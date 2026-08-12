import { formatValue } from "./bar.js";
import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import {
  validateDataLength,
  validateFiniteNumber,
  validateHeight,
  validateText,
  validateViewport,
  validateWidth,
} from "./validation.js";

import type {
  CellGrid,
  DataTableRow,
  DistributionChart,
  DistributionChartInput,
  DistributionMode,
  IntervalChart,
  IntervalChartInput,
  IntervalDatum,
  IntervalDatumInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const modes = new Set<DistributionMode>([
  "density",
  "violin",
  "strip",
  "beeswarm",
  "ecdf",
  "qq",
]);

function commonBase(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}): void {
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
}

function normalizeInterval(
  datum: IntervalDatumInput,
  index: number,
): IntervalDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be an interval datum object.`);
  }
  validateText(datum.label, `data[${index}].label`);
  for (const key of ["value", "low", "high"] as const) {
    validateFiniteNumber(datum[key], `data[${index}].${key}`);
  }
  if (datum.low > datum.value || datum.value > datum.high) {
    throw new RangeError(`data[${index}] must satisfy low <= value <= high.`);
  }
  return Object.freeze({ ...datum });
}

export function intervalChart(input: IntervalChartInput): IntervalChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("interval input must be an object.");
  }
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  commonBase(input);
  return Object.freeze({
    type: "interval",
    data: Object.freeze(input.data.map(normalizeInterval)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutInterval(
  chart: IntervalChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length) + 2;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight) {
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  }
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.data.map(({ label }) => measureText(label))),
    Math.floor(width * 0.3),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  const minimum =
    chart.data.length === 0 ? 0 : Math.min(...chart.data.map(({ low }) => low));
  const maximum =
    chart.data.length === 0
      ? 1
      : Math.max(...chart.data.map(({ high }) => high));
  const toX = (value: number) =>
    plotX +
    (maximum === minimum
      ? Math.floor(plotWidth / 2)
      : Math.round(
          ((value - minimum) / (maximum - minimum)) * (plotWidth - 1),
        ));
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined) {
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  }
  if (chart.data.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  }
  chart.data.forEach((datum, index) => {
    const y = titleRows + index;
    grid.text(
      0,
      y,
      truncateText(datum.label, labelWidth, palette.ellipsis),
      "label",
    );
    const lowX = toX(datum.low);
    const highX = toX(datum.high);
    const valueX = toX(datum.value);
    for (let x = lowX; x <= highX; x += 1) {
      grid.set(x, y, palette.horizontalAxis, "series", {
        foreground: "series1",
      });
    }
    grid.set(lowX, y, charset === "ascii" ? "[" : "├", "series", {
      foreground: "muted",
    });
    grid.set(highX, y, charset === "ascii" ? "]" : "┤", "series", {
      foreground: "muted",
    });
    grid.set(
      valueX,
      y,
      charset === "ascii" ? "o" : "●",
      "series",
      { foreground: "accent", bold: true },
      { label: datum.label, value: datum.value },
    );
  });
  if (chart.data.length > 0) {
    const axisY = titleRows + chart.data.length;
    for (let x = plotX; x < width; x += 1) {
      grid.set(x, axisY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    }
    const minLabel = formatValue(minimum);
    const maxLabel = formatValue(maximum);
    grid.text(plotX, axisY + 1, minLabel, "label", {
      foreground: "muted",
    });
    grid.text(width - measureText(maxLabel), axisY + 1, maxLabel, "label", {
      foreground: "muted",
    });
  }
  const heading = chart.title ?? "Interval chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} estimates with low and high intervals.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "low", label: "Low" },
        { key: "high", label: "High" },
      ],
      rows: chart.data.map(({ label, value, low, high }) => ({
        label,
        value,
        low,
        high,
      })),
    },
  );
}

export function distribution(input: DistributionChartInput): DistributionChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("distribution input must be an object.");
  }
  if (!Array.isArray(input.values)) {
    throw new TypeError("values must be an array.");
  }
  if (!modes.has(input.mode)) {
    throw new TypeError(
      "mode must be density, violin, strip, beeswarm, ecdf, or qq.",
    );
  }
  validateDataLength(input.values.length, "values");
  input.values.forEach((value, index) =>
    validateFiniteNumber(value, `values[${index}]`),
  );
  if (input.label !== undefined) validateText(input.label, "label");
  commonBase(input);
  return Object.freeze({
    type: "distribution",
    values: Object.freeze([...input.values]),
    mode: input.mode,
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function densityValues(
  values: readonly number[],
  minimum: number,
  maximum: number,
  count: number,
): number[] {
  if (values.length === 0) return [];
  const span = Math.max(1e-9, maximum - minimum);
  const bandwidth = Math.max(span / 12, span / Math.sqrt(values.length) / 2);
  return Array.from({ length: count }, (_, index) => {
    const x = minimum + (index / Math.max(1, count - 1)) * span;
    return values.reduce((sum, value) => {
      const distance = (x - value) / bandwidth;
      return sum + Math.exp(-0.5 * distance * distance);
    }, 0);
  });
}

function theoreticalQuantile(index: number, count: number): number {
  const probability = (index + 0.5) / count;
  return Math.log(probability / (1 - probability)) / 1.7;
}

export function layoutDistribution(
  chart: DistributionChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 5) {
    throw new RangeError(
      `layout height ${height} is too short for distribution charts.`,
    );
  }
  const sorted = [...chart.values].sort((left, right) => left - right);
  const minimum = sorted[0] ?? 0;
  const maximum = sorted.at(-1) ?? 1;
  const labelWidth = Math.max(
    measureText(formatValue(minimum)),
    measureText(formatValue(maximum)),
  );
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX;
  if (plotWidth < 8) {
    throw new RangeError(
      `layout width ${width} is too narrow for distribution charts.`,
    );
  }
  const plotTop = titleRows;
  const plotBottom = plotTop + plotHeight - 1;
  const toX = (value: number) =>
    plotX +
    (maximum === minimum
      ? Math.floor(plotWidth / 2)
      : Math.round(
          ((value - minimum) / (maximum - minimum)) * (plotWidth - 1),
        ));
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined) {
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  }
  if (sorted.length === 0) {
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  } else if (chart.mode === "density" || chart.mode === "violin") {
    const density = densityValues(sorted, minimum, maximum, plotWidth);
    const peak = Math.max(...density, 1e-9);
    const centerY = plotTop + Math.floor((plotHeight - 1) / 2);
    density.forEach((value, index) => {
      const size = Math.max(
        1,
        Math.round(
          (value / peak) *
            (chart.mode === "violin"
              ? Math.floor((plotHeight - 2) / 2)
              : plotHeight - 2),
        ),
      );
      if (chart.mode === "density") {
        for (let y = plotBottom - 1; y >= plotBottom - size; y -= 1) {
          grid.set(plotX + index, y, palette.fill, "series", {
            foreground: "series1",
          });
        }
      } else {
        for (let y = centerY - size; y <= centerY + size; y += 1) {
          grid.set(plotX + index, y, palette.fill, "series", {
            foreground: "series1",
          });
        }
      }
    });
  } else if (chart.mode === "strip" || chart.mode === "beeswarm") {
    const centerY = plotTop + Math.floor((plotHeight - 1) / 2);
    const occupied = new Map<number, number>();
    sorted.forEach((value, index) => {
      const x = toX(value);
      const collision = occupied.get(x) ?? 0;
      occupied.set(x, collision + 1);
      const offset =
        chart.mode === "beeswarm"
          ? collision === 0
            ? 0
            : Math.ceil(collision / 2) * (collision % 2 === 0 ? -1 : 1)
          : 0;
      const y = Math.max(plotTop, Math.min(plotBottom - 1, centerY + offset));
      grid.set(
        x,
        y,
        charset === "ascii"
          ? collision > 0
            ? "x"
            : "o"
          : collision > 0
            ? "◆"
            : "●",
        "series",
        { foreground: collision > 0 ? "accent" : "series1" },
        { label: String(index), value },
      );
    });
  } else if (chart.mode === "ecdf") {
    let previousX = toX(sorted[0] ?? minimum);
    let previousY = plotBottom - 1;
    sorted.forEach((value, index) => {
      const x = toX(value);
      const y =
        plotBottom -
        1 -
        Math.round(((index + 1) / sorted.length) * (plotHeight - 2));
      for (let drawX = previousX; drawX <= x; drawX += 1) {
        grid.set(drawX, previousY, palette.horizontalAxis, "series", {
          foreground: "series1",
        });
      }
      for (
        let drawY = Math.min(y, previousY);
        drawY <= Math.max(y, previousY);
        drawY += 1
      ) {
        grid.set(x, drawY, palette.baseline, "series", {
          foreground: "series1",
        });
      }
      previousX = x;
      previousY = y;
    });
  } else {
    const theoretical = sorted.map((_, index) =>
      theoreticalQuantile(index, sorted.length),
    );
    const theoryMin = theoretical[0] ?? -1;
    const theoryMax = theoretical.at(-1) ?? 1;
    sorted.forEach((value, index) => {
      const theory = theoretical[index] ?? 0;
      const x =
        plotX +
        Math.round(
          ((theory - theoryMin) / Math.max(1e-9, theoryMax - theoryMin)) *
            (plotWidth - 1),
        );
      const y =
        plotBottom -
        1 -
        Math.round(
          ((value - minimum) / Math.max(1e-9, maximum - minimum)) *
            (plotHeight - 2),
        );
      grid.set(
        x,
        y,
        charset === "ascii" ? "o" : "●",
        "series",
        { foreground: "series1" },
        { label: formatValue(theory), value },
      );
    });
  }
  for (let x = plotX - 1; x < width; x += 1) {
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  }
  const minLabel = formatValue(minimum);
  const maxLabel = formatValue(maximum);
  grid.text(plotX, height - 1, minLabel, "label", { foreground: "muted" });
  grid.text(width - measureText(maxLabel), height - 1, maxLabel, "label", {
    foreground: "muted",
  });
  const heading =
    chart.title ?? chart.label ?? `${chart.mode.toUpperCase()} plot`;
  const rows: DataTableRow[] = chart.values.map((value, index) => ({
    index,
    value,
    ...(chart.mode === "qq"
      ? { theoretical: theoreticalQuantile(index, chart.values.length) }
      : {}),
  }));
  const columns = [
    { key: "index", label: "Index" },
    { key: "value", label: "Value" },
    ...(chart.mode === "qq"
      ? [{ key: "theoretical", label: "Theoretical quantile" }]
      : []),
  ];
  return grid.build(
    chart.description ??
      `${heading}. ${chart.values.length} values; minimum ${formatValue(minimum)}; maximum ${formatValue(maximum)}.`,
    { caption: heading, columns, rows },
  );
}
