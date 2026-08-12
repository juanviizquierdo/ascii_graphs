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
  BarDatum,
  CellGrid,
  CellStyle,
  CharacterSet,
  FunnelChart,
  FunnelChartInput,
  LayoutOptions,
  LegendOptions,
  LikertChart,
  LikertChartInput,
  ParetoChart,
  ParetoChartInput,
  StackedBarRow,
  TreemapChart,
  TreemapChartInput,
  WaffleChart,
  WaffleChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const marks: Record<CharacterSet, readonly string[]> = {
  ascii: ["1", "2", "3", "4", "5", "6", "7", "8"],
  unicode: ["●", "◆", "■", "▲", "○", "◇", "□", "△"],
};
const fills: Record<CharacterSet, readonly string[]> = {
  ascii: ["#", "+", "=", "%", "@", "*", "x", "o"],
  unicode: ["█", "▓", "▒", "░", "▰", "▧", "▦", "▩"],
};
const styles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];

function base(input: {
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

function normalizedData(
  data: readonly BarDatum[],
  field = "data",
): readonly BarDatum[] {
  if (!Array.isArray(data)) throw new TypeError(`${field} must be an array.`);
  validateDataLength(data.length, field);
  return Object.freeze(
    data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`${field}[${index}] must be a datum object.`);
      validateText(datum.label, `${field}[${index}].label`);
      validateFiniteNumber(datum.value, `${field}[${index}].value`);
      if (datum.value < 0)
        throw new RangeError(`${field}[${index}].value cannot be negative.`);
      return Object.freeze({ label: datum.label, value: datum.value });
    }),
  );
}

function copyBase(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  };
}

function title(grid: GridBuilder, value: string | undefined, width: number) {
  if (value !== undefined)
    grid.text(0, 0, truncateText(value, width, "…"), "title", {
      foreground: "accent",
      bold: true,
    });
}

const colorTokens = new Set([
  "muted",
  "accent",
  "positive",
  "negative",
  "series1",
  "series2",
  "series3",
  "series4",
]);

function funnelLegend(
  input: LegendOptions | undefined,
): Readonly<Required<LegendOptions>> {
  const position = input?.position ?? "inside";
  const color = input?.color ?? "muted";
  if (position !== "inside" && position !== "left" && position !== "right")
    throw new TypeError(
      "funnel legend.position must be inside, left, or right.",
    );
  if (!colorTokens.has(color))
    throw new TypeError("legend.color must be a valid semantic color token.");
  return Object.freeze({ position, color });
}

export function likert(input: LikertChartInput): LikertChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("likert input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  if (!Array.isArray(input.rows)) throw new TypeError("rows must be an array.");
  validateDataLength(input.rows.length, "rows");
  input.series.forEach((label, index) =>
    validateText(label, `series[${index}]`),
  );
  const rows: readonly StackedBarRow[] = Object.freeze(
    input.rows.map((row, rowIndex) => {
      validateText(row.label, `rows[${rowIndex}].label`);
      if (
        !Array.isArray(row.values) ||
        row.values.length !== input.series.length
      )
        throw new RangeError(
          `rows[${rowIndex}].values must match series length.`,
        );
      row.values.forEach((value: number, valueIndex: number) =>
        validateFiniteNumber(value, `rows[${rowIndex}].values[${valueIndex}]`),
      );
      return Object.freeze({
        label: row.label,
        values: Object.freeze([...row.values]),
      });
    }),
  );
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  base(input);
  return Object.freeze({
    type: "likert",
    series: Object.freeze([...input.series]),
    rows,
    showLegend: input.showLegend ?? true,
    ...copyBase(input),
  });
}

export function layoutLikert(
  chart: LikertChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const height =
    options.height ??
    chart.height ??
    titleRows + chart.rows.length + 2 + legendRows;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.rows.map(({ label }) => measureText(label))),
    Math.floor(width * 0.25),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  const center = plotX + Math.floor(plotWidth / 2);
  const maximumSide = Math.max(
    1,
    ...chart.rows.flatMap(({ values }) => [
      values
        .filter((value) => value < 0)
        .reduce((sum, value) => sum - value, 0),
      values
        .filter((value) => value >= 0)
        .reduce((sum, value) => sum + value, 0),
    ]),
  );
  const grid = new GridBuilder(width, height);
  title(grid, chart.title, width);
  chart.rows.forEach((row, rowIndex) => {
    const y = titleRows + rowIndex;
    grid.text(
      0,
      y,
      truncateText(row.label, labelWidth, palette.ellipsis),
      "label",
    );
    let negativeX = center - 1;
    let positiveX = center + 1;
    row.values.forEach((value, seriesIndex) => {
      const size = Math.round(
        (Math.abs(value) / maximumSide) * Math.floor((plotWidth - 2) / 2),
      );
      for (let offset = 0; offset < size; offset += 1) {
        const x = value < 0 ? negativeX-- : positiveX++;
        grid.set(
          x,
          y,
          fills[charset][seriesIndex % fills[charset].length] ?? "#",
          "series",
          styles[seriesIndex % styles.length],
          {
            label: chart.series[seriesIndex] ?? String(seriesIndex),
            value,
          },
        );
      }
    });
    grid.set(center, y, palette.baseline, "axis", { foreground: "muted" });
  });
  if (chart.showLegend) {
    const legend = chart.series
      .map(
        (label, index) =>
          `${marks[charset][index % marks[charset].length]} ${label}`,
      )
      .join("  ");
    grid.text(
      0,
      height - 1,
      truncateText(legend, width, palette.ellipsis),
      "label",
      { foreground: "muted" },
    );
  }
  return grid.build(
    chart.description ??
      `${chart.title ?? "Likert chart"}. ${chart.rows.length} diverging response rows.`,
    {
      caption: chart.title ?? "Likert chart",
      columns: [
        { key: "label", label: "Label" },
        ...chart.series.map((label, index) => ({
          key: `series_${index}`,
          label,
        })),
      ],
      rows: chart.rows.map((row) => ({
        label: row.label,
        ...Object.fromEntries(
          row.values.map((value, index) => [`series_${index}`, value]),
        ),
      })),
    },
  );
}

export function treemap(input: TreemapChartInput): TreemapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("treemap input must be an object.");
  base(input);
  return Object.freeze({
    type: "treemap",
    data: normalizedData(input.data),
    ...copyBase(input),
  });
}

export function layoutTreemap(
  chart: TreemapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows;
  const grid = new GridBuilder(width, height);
  title(grid, chart.title, width);
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    let x = 0;
    chart.data.forEach((datum, index) => {
      const remaining = width - x;
      const blockWidth =
        index === chart.data.length - 1
          ? remaining
          : Math.max(1, Math.round((datum.value / Math.max(total, 1)) * width));
      const end = Math.min(width, x + blockWidth);
      for (let y = titleRows; y < height; y += 1)
        for (let drawX = x; drawX < end; drawX += 1)
          grid.set(
            drawX,
            y,
            fills[charset][index % fills[charset].length] ?? "#",
            "series",
            styles[index % styles.length],
            datum,
          );
      if (end - x > 3 && plotHeight > 1)
        grid.text(
          x + 1,
          titleRows + Math.floor(plotHeight / 2),
          truncateText(datum.label, end - x - 2, "…"),
          "label",
          { bold: true },
          datum,
        );
      x = end;
    });
  }
  return valueTable(grid, chart, "Treemap", total);
}

export function waffle(input: WaffleChartInput): WaffleChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("waffle input must be an object.");
  if (
    input.cells !== undefined &&
    (!Number.isInteger(input.cells) || input.cells < 4 || input.cells > 400)
  )
    throw new RangeError("cells must be an integer between 4 and 400.");
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  base(input);
  return Object.freeze({
    type: "waffle",
    data: normalizedData(input.data),
    cells: input.cells ?? 100,
    showLegend: input.showLegend ?? true,
    ...copyBase(input),
  });
}

export function layoutWaffle(
  chart: WaffleChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const titleRows = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend ? 2 : 0;
  const availableHeight = height - titleRows - legendRows;
  const columns = Math.min(
    width,
    Math.max(2, Math.ceil(Math.sqrt(chart.cells))),
  );
  const rows = Math.ceil(chart.cells / columns);
  if (rows > availableHeight)
    throw new RangeError(
      `layout height ${height} is too short for ${chart.cells} waffle cells.`,
    );
  const grid = new GridBuilder(width, height);
  title(grid, chart.title, width);
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  const counts = chart.data.map((datum) =>
    Math.floor((datum.value / Math.max(total, 1)) * chart.cells),
  );
  let remainder =
    total === 0
      ? 0
      : chart.cells - counts.reduce((sum, count) => sum + count, 0);
  for (
    let index = 0;
    remainder > 0;
    index = (index + 1) % Math.max(1, counts.length)
  ) {
    counts[index] = (counts[index] ?? 0) + 1;
    remainder -= 1;
  }
  let seriesIndex = 0;
  let seriesCell = 0;
  for (
    let cell = 0;
    cell < chart.cells && seriesIndex < chart.data.length;
    cell += 1
  ) {
    while (
      seriesIndex < counts.length &&
      seriesCell >= (counts[seriesIndex] ?? 0)
    ) {
      seriesIndex += 1;
      seriesCell = 0;
    }
    const datum = chart.data[seriesIndex];
    if (datum === undefined) break;
    grid.set(
      cell % columns,
      titleRows + rows - 1 - Math.floor(cell / columns),
      marks[charset][seriesIndex % marks[charset].length] ?? "o",
      "series",
      styles[seriesIndex % styles.length],
      datum,
    );
    seriesCell += 1;
  }
  if (chart.showLegend) {
    const legend = chart.data
      .map(
        (datum, index) =>
          `${marks[charset][index % marks[charset].length]} ${datum.label}`,
      )
      .join("  ");
    grid.text(0, height - 1, truncateText(legend, width, "…"), "label", {
      foreground: "muted",
    });
  }
  return valueTable(grid, chart, "Waffle chart", total);
}

export function funnel(input: FunnelChartInput): FunnelChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("funnel input must be an object.");
  if (
    input.mode !== undefined &&
    input.mode !== "funnel" &&
    input.mode !== "pyramid"
  )
    throw new TypeError("mode must be funnel or pyramid.");
  base(input);
  return Object.freeze({
    type: "funnel",
    data: normalizedData(input.data),
    mode: input.mode ?? "funnel",
    legend: funnelLegend(input.legend),
    ...copyBase(input),
  });
}

export function layoutFunnel(
  chart: FunnelChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const height =
    options.height ??
    chart.height ??
    titleRows + Math.max(1, chart.data.length * 2);
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  title(grid, chart.title, width);
  const legendLabels = chart.data.map(
    ({ label, value }) => `${label} ${formatValue(value)}`,
  );
  const externalLegend =
    chart.legend.position === "left" || chart.legend.position === "right";
  const legendWidth = externalLegend
    ? Math.min(
        Math.max(1, ...legendLabels.map(measureText)),
        Math.floor(width * 0.4),
      )
    : 0;
  const gap = externalLegend ? 2 : 0;
  const plotStart = chart.legend.position === "left" ? legendWidth + gap : 0;
  const plotEnd =
    chart.legend.position === "right" ? width - legendWidth - gap : width;
  const plotWidth = plotEnd - plotStart;
  if (plotWidth < 8)
    throw new RangeError(
      "layout width is too narrow for the funnel and legend.",
    );
  const maximum = Math.max(1, ...chart.data.map(({ value }) => value));
  chart.data.forEach((datum, index) => {
    const sourceIndex =
      chart.mode === "pyramid" ? chart.data.length - 1 - index : index;
    const source = chart.data[sourceIndex] ?? datum;
    const size = Math.max(
      1,
      Math.round((source.value / maximum) * (plotWidth - 2)),
    );
    const start = plotStart + Math.floor((plotWidth - size) / 2);
    const y = titleRows + index * 2;
    for (let x = start; x < start + size; x += 1)
      grid.set(
        x,
        y,
        fills[charset][sourceIndex % fills[charset].length] ?? "#",
        "series",
        styles[sourceIndex % styles.length],
        source,
      );
    const label = `${source.label} ${formatValue(source.value)}`;
    const displayedLabel = truncateText(
      label,
      Math.max(1, legendWidth),
      palette.ellipsis,
    );
    const labelX =
      chart.legend.position === "left"
        ? 0
        : chart.legend.position === "right"
          ? plotEnd + gap
          : Math.max(0, Math.floor((width - measureText(label)) / 2));
    grid.text(
      labelX,
      y,
      externalLegend
        ? displayedLabel
        : truncateText(label, width, palette.ellipsis),
      "label",
      { foreground: chart.legend.color, bold: true },
      source,
    );
  });
  const total = chart.data.reduce((sum, item) => sum + item.value, 0);
  return valueTable(
    grid,
    chart,
    chart.mode === "pyramid" ? "Pyramid chart" : "Funnel chart",
    total,
  );
}

export function pareto(input: ParetoChartInput): ParetoChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("pareto input must be an object.");
  base(input);
  return Object.freeze({
    type: "pareto",
    data: normalizedData(input.data),
    ...copyBase(input),
  });
}

export function layoutPareto(
  chart: ParetoChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotBottom = height - 2;
  const plotHeight = plotBottom - titleRows;
  const grid = new GridBuilder(width, height);
  title(grid, chart.title, width);
  const sorted = [...chart.data].sort(
    (left, right) => right.value - left.value,
  );
  const maximum = Math.max(1, ...sorted.map(({ value }) => value));
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const slot = Math.max(1, Math.floor(width / Math.max(1, sorted.length)));
  let cumulative = 0;
  let previous: { x: number; y: number } | undefined;
  sorted.forEach((datum, index) => {
    const x = Math.min(width - 1, index * slot + Math.floor(slot / 2));
    const barHeight = Math.round((datum.value / maximum) * (plotHeight - 1));
    for (let y = plotBottom - 1; y >= plotBottom - barHeight; y -= 1)
      grid.set(x, y, palette.fill, "series", { foreground: "series1" }, datum);
    cumulative += datum.value;
    const lineY =
      plotBottom -
      1 -
      Math.round((cumulative / Math.max(total, 1)) * (plotHeight - 1));
    if (previous !== undefined) {
      const start = Math.min(previous.x, x);
      const end = Math.max(previous.x, x);
      for (let drawX = start; drawX <= end; drawX += 1) {
        const ratio = end === start ? 0 : (drawX - start) / (end - start);
        const y = Math.round(previous.y + (lineY - previous.y) * ratio);
        grid.set(drawX, y, charset === "ascii" ? "." : "•", "series", {
          foreground: "accent",
        });
      }
    }
    grid.set(x, lineY, charset === "ascii" ? "o" : "●", "series", {
      foreground: "accent",
      bold: true,
    });
    grid.text(
      index * slot,
      height - 1,
      truncateText(datum.label, slot, "…"),
      "label",
      { foreground: "muted" },
    );
    previous = { x, y: lineY };
  });
  return grid.build(
    chart.description ??
      `${chart.title ?? "Pareto chart"}. Categories sorted by value with cumulative share.`,
    {
      caption: chart.title ?? "Pareto chart",
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "cumulative", label: "Cumulative percentage" },
      ],
      rows: sorted.map((datum) => {
        const end = sorted
          .slice(0, sorted.indexOf(datum) + 1)
          .reduce((sum, item) => sum + item.value, 0);
        return {
          label: datum.label,
          value: datum.value,
          cumulative: total === 0 ? 0 : Math.round((end / total) * 100),
        };
      }),
    },
  );
}

function valueTable(
  grid: GridBuilder,
  chart: TreemapChart | WaffleChart | FunnelChart,
  fallback: string,
  total: number,
): CellGrid {
  const heading = chart.title ?? fallback;
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} categories totaling ${formatValue(total)}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "percentage", label: "Percentage" },
      ],
      rows: chart.data.map(({ label, value }) => ({
        label,
        value,
        percentage: total === 0 ? 0 : Math.round((value / total) * 100),
      })),
    },
  );
}
