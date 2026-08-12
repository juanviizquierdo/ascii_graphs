import { formatValue } from "./bar.js";
import { GridBuilder, measureText, truncateText } from "./grid.js";
import { drawConnectedPath, layoutLine, line, sampleSeries } from "./line.js";
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
  DataTableRow,
  LayoutOptions,
  LollipopChart,
  LollipopChartInput,
  MultiLineChart,
  MultiLineChartInput,
  RangeChart,
  RangeChartInput,
  RangeDatum,
  RangeDatumInput,
  SeriesValues,
  SeriesValuesInput,
  StackedAreaChart,
  StackedAreaChartInput,
  StepChart,
  StepChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const seriesMarks: Record<CharacterSet, readonly string[]> = {
  ascii: ["1", "2", "3", "4"],
  unicode: ["●", "◆", "■", "▲"],
};
const seriesStyles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];
const legendColors = new Set([
  "muted",
  "accent",
  "positive",
  "negative",
  "series1",
  "series2",
  "series3",
  "series4",
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

function normalizeSeries(
  series: SeriesValuesInput,
  index: number,
): SeriesValues {
  if (typeof series !== "object" || series === null)
    throw new TypeError(`series[${index}] must be a series object.`);
  validateText(series.label, `series[${index}].label`);
  if (!Array.isArray(series.values))
    throw new TypeError(`series[${index}].values must be an array.`);
  validateDataLength(series.values.length, `series[${index}].values`);
  series.values.forEach((value, valueIndex) => {
    if (value !== null)
      validateFiniteNumber(value, `series[${index}].values[${valueIndex}]`);
  });
  return Object.freeze({
    label: series.label,
    values: Object.freeze([...series.values]),
  });
}

function normalizeSeriesMatrix(
  input: readonly SeriesValuesInput[],
): readonly SeriesValues[] {
  const normalized = input.map(normalizeSeries);
  const length = normalized[0]?.values.length ?? 0;
  if (normalized.some(({ values }) => values.length !== length))
    throw new RangeError("all series must contain the same number of values.");
  return Object.freeze(normalized);
}

export function multiLine(input: MultiLineChartInput): MultiLineChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("multi-line input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  validateDataLength(input.series.length, "series");
  if (input.series.length > 4)
    throw new RangeError("multi-line charts support at most 4 series.");
  commonBase(input);
  if (input.min !== undefined) validateFiniteNumber(input.min, "min");
  if (input.max !== undefined) validateFiniteNumber(input.max, "max");
  if (
    input.min !== undefined &&
    input.max !== undefined &&
    input.min > input.max
  )
    throw new RangeError("min cannot be greater than max.");
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  const legendPosition = input.legend?.position ?? "bottom";
  const legendColor = input.legend?.color ?? "muted";
  if (legendPosition !== "top" && legendPosition !== "bottom")
    throw new TypeError("multi-line legend.position must be top or bottom.");
  if (!legendColors.has(legendColor))
    throw new TypeError("legend.color must be a valid semantic color token.");
  return Object.freeze({
    type: "multi-line",
    series: normalizeSeriesMatrix(input.series),
    showLegend: input.showLegend ?? true,
    legend: Object.freeze({
      position: legendPosition,
      color: legendColor,
    }),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutMultiLine(
  chart: MultiLineChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const plotHeight = height - titleRows - legendRows - 1;
  if (plotHeight < 4)
    throw new RangeError(
      `layout height ${height} is too short for multi-line charts.`,
    );
  const finite = chart.series.flatMap(({ values }) =>
    values.filter((value): value is number => value !== null),
  );
  const minimum = chart.min ?? (finite.length === 0 ? 0 : Math.min(...finite));
  const maximum = chart.max ?? (finite.length === 0 ? 1 : Math.max(...finite));
  const labelWidth = Math.max(
    measureText(formatValue(minimum)),
    measureText(formatValue(maximum)),
  );
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX;
  const plotTop =
    titleRows +
    (chart.showLegend && chart.legend.position === "top" ? legendRows : 0);
  const plotBottom = plotTop + plotHeight - 1;
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  grid.text(0, plotTop, formatValue(maximum), "value", { foreground: "muted" });
  grid.text(0, plotBottom, formatValue(minimum), "value", {
    foreground: "muted",
  });
  for (let x = plotX - 1; x < width; x += 1)
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  chart.series.forEach((series, seriesIndex) => {
    const samples = sampleSeries(series.values, plotWidth);
    const positions = samples.map((sample, index) => ({
      ...sample,
      x:
        samples.length <= 1
          ? plotX
          : plotX +
            Math.round((index * (plotWidth - 1)) / (samples.length - 1)),
      y:
        sample.value === null
          ? null
          : plotBottom -
            1 -
            Math.round(
              (maximum === minimum
                ? 0.5
                : Math.max(
                    0,
                    Math.min(1, (sample.value - minimum) / (maximum - minimum)),
                  )) *
                (plotHeight - 2),
            ),
    }));
    drawConnectedPath(
      grid,
      charset,
      positions,
      "linear",
      seriesStyles[seriesIndex] ?? { foreground: "series1" },
    );
    positions.forEach((sample) => {
      if (sample.y === null || sample.value === null) {
        grid.set(
          sample.x,
          plotTop + Math.floor(plotHeight / 2),
          palette.missing,
          "missing",
          { foreground: "muted" },
        );
      } else {
        grid.set(
          sample.x,
          sample.y,
          seriesMarks[charset][seriesIndex] ?? palette.fill,
          "series",
          seriesStyles[seriesIndex],
          { label: series.label, value: sample.value },
        );
      }
    });
  });
  if (chart.showLegend) {
    const legend = chart.series
      .map(({ label }, index) => `${seriesMarks[charset][index]} ${label}`)
      .join("  ");
    grid.text(
      0,
      chart.legend.position === "top" ? titleRows : height - 1,
      truncateText(legend, width, palette.ellipsis),
      "label",
      { foreground: chart.legend.color },
    );
  }
  const columns = [
    { key: "index", label: "Index" },
    ...chart.series.map((series, index) => ({
      key: `series_${index}`,
      label: series.label,
    })),
  ];
  const count = chart.series[0]?.values.length ?? 0;
  const rows: DataTableRow[] = Array.from({ length: count }, (_, index) => {
    const row: DataTableRow = { index };
    chart.series.forEach((series, seriesIndex) => {
      row[`series_${seriesIndex}`] = series.values[index] ?? null;
    });
    return row;
  });
  const heading = chart.title ?? "Multi-series line chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.series.length} series and ${count} points.`,
    { caption: heading, columns, rows },
  );
}

export function stackedArea(input: StackedAreaChartInput): StackedAreaChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("stacked-area input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  validateDataLength(input.series.length, "series");
  if (input.series.length > 4)
    throw new RangeError("stacked-area charts support at most 4 series.");
  commonBase(input);
  const series = normalizeSeriesMatrix(input.series);
  series.forEach((item, seriesIndex) =>
    item.values.forEach((value, index) => {
      if (value !== null && value < 0)
        throw new RangeError(
          `series[${seriesIndex}].values[${index}] cannot be negative.`,
        );
    }),
  );
  return Object.freeze({
    type: "stacked-area",
    series,
    showLegend: input.showLegend ?? true,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutStackedArea(
  chart: StackedAreaChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const plotHeight = height - titleRows - legendRows - 1;
  const count = chart.series[0]?.values.length ?? 0;
  if (plotHeight < 4)
    throw new RangeError(
      `layout height ${height} is too short for stacked areas.`,
    );
  const totals = Array.from({ length: count }, (_, index) =>
    chart.series.reduce((sum, series) => sum + (series.values[index] ?? 0), 0),
  );
  const maximum = Math.max(0, ...totals);
  const labelWidth = measureText(formatValue(maximum));
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX;
  if (count > plotWidth)
    throw new RangeError(
      `layout width ${width} is too narrow for ${count} samples.`,
    );
  const stride = count === 0 ? 1 : Math.max(1, Math.floor(plotWidth / count));
  const cellWidth = Math.max(1, stride - 1);
  const plotTop = titleRows;
  const plotBottom = plotTop + plotHeight - 1;
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  grid.text(0, plotTop, formatValue(maximum), "value", { foreground: "muted" });
  grid.text(0, plotBottom, "0", "value", { foreground: "muted" });
  for (let x = plotX - 1; x < width; x += 1)
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  for (let index = 0; index < count; index += 1) {
    let cumulative = 0;
    chart.series.forEach((series, seriesIndex) => {
      const value = series.values[index];
      if (value === null || value === undefined) return;
      const previous = cumulative;
      cumulative += value;
      const fromY =
        plotBottom -
        Math.round(
          maximum === 0 ? 0 : (cumulative / maximum) * (plotHeight - 1),
        );
      const toY =
        plotBottom -
        Math.round(maximum === 0 ? 0 : (previous / maximum) * (plotHeight - 1));
      for (let y = fromY; y < toY; y += 1)
        for (let offset = 0; offset < cellWidth; offset += 1)
          grid.set(
            plotX + index * stride + offset,
            y,
            seriesMarks[charset][seriesIndex] ?? palette.fill,
            "series",
            seriesStyles[seriesIndex],
            { label: series.label, value },
          );
    });
  }
  if (chart.showLegend) {
    const legend = chart.series
      .map(({ label }, index) => `${seriesMarks[charset][index]} ${label}`)
      .join("  ");
    grid.text(
      0,
      height - 1,
      truncateText(legend, width, palette.ellipsis),
      "label",
      { foreground: "muted" },
    );
  }
  const columns = [
    { key: "index", label: "Index" },
    ...chart.series.map((series, index) => ({
      key: `series_${index}`,
      label: series.label,
    })),
  ];
  const rows: DataTableRow[] = Array.from({ length: count }, (_, index) => {
    const row: DataTableRow = { index };
    chart.series.forEach((series, seriesIndex) => {
      row[`series_${seriesIndex}`] = series.values[index] ?? null;
    });
    return row;
  });
  const heading = chart.title ?? "Stacked area chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.series.length} stacked series and ${count} samples.`,
    { caption: heading, columns, rows },
  );
}

function normalizeRange(datum: RangeDatumInput, index: number): RangeDatum {
  if (typeof datum !== "object" || datum === null)
    throw new TypeError(`data[${index}] must be a range datum object.`);
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.start, `data[${index}].start`);
  validateFiniteNumber(datum.end, `data[${index}].end`);
  return Object.freeze({
    label: datum.label,
    start: datum.start,
    end: datum.end,
  });
}

export function rangeChart(input: RangeChartInput): RangeChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("range input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  commonBase(input);
  const style = input.style ?? "bar";
  if (style !== "bar" && style !== "dumbbell")
    throw new TypeError("style must be bar or dumbbell.");
  return Object.freeze({
    type: "range",
    data: Object.freeze(input.data.map(normalizeRange)),
    style,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutRange(
  chart: RangeChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length) + 2;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
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
    chart.data.length === 0
      ? 0
      : Math.min(...chart.data.flatMap(({ start, end }) => [start, end]));
  const maximum =
    chart.data.length === 0
      ? 1
      : Math.max(...chart.data.flatMap(({ start, end }) => [start, end]));
  const toX = (value: number) =>
    plotX +
    (maximum === minimum
      ? Math.floor(plotWidth / 2)
      : Math.round(
          ((value - minimum) / (maximum - minimum)) * (plotWidth - 1),
        ));
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  if (chart.data.length === 0)
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  chart.data.forEach((datum, index) => {
    const y = titleRows + index;
    grid.text(
      0,
      y,
      truncateText(datum.label, labelWidth, palette.ellipsis),
      "label",
    );
    const startX = toX(datum.start);
    const endX = toX(datum.end);
    for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x += 1)
      grid.set(
        x,
        y,
        chart.style === "bar" ? palette.fill : palette.horizontalAxis,
        "series",
        { foreground: "series1" },
      );
    if (chart.style === "dumbbell") {
      grid.set(
        startX,
        y,
        charset === "ascii" ? "o" : "●",
        "series",
        { foreground: "series1" },
        { label: `${datum.label} start`, value: datum.start },
      );
      grid.set(
        endX,
        y,
        charset === "ascii" ? "x" : "◆",
        "series",
        { foreground: "series2" },
        { label: `${datum.label} end`, value: datum.end },
      );
    }
  });
  const axisY = titleRows + chart.data.length;
  if (chart.data.length > 0) {
    for (let x = plotX; x < width; x += 1)
      grid.set(x, axisY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    const minLabel = formatValue(minimum);
    const maxLabel = formatValue(maximum);
    grid.text(plotX, axisY + 1, minLabel, "label", { foreground: "muted" });
    grid.text(width - measureText(maxLabel), axisY + 1, maxLabel, "label", {
      foreground: "muted",
    });
  }
  const heading =
    chart.title ??
    (chart.style === "dumbbell" ? "Dumbbell chart" : "Range chart");
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} ranges from ${formatValue(minimum)} to ${formatValue(maximum)}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "start", label: "Start" },
        { key: "end", label: "End" },
      ],
      rows: chart.data.map(({ label, start, end }) => ({ label, start, end })),
    },
  );
}

function normalizeBarDatum(datum: BarDatum, index: number): BarDatum {
  if (typeof datum !== "object" || datum === null)
    throw new TypeError(`data[${index}] must be a datum object.`);
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  return Object.freeze({ label: datum.label, value: datum.value });
}

export function lollipop(input: LollipopChartInput): LollipopChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("lollipop input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  commonBase(input);
  return Object.freeze({
    type: "lollipop",
    data: Object.freeze(input.data.map(normalizeBarDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutLollipop(
  chart: LollipopChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length);
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.data.map(({ label }) => measureText(label))),
    Math.floor(width * 0.3),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  const minimum = Math.min(0, ...chart.data.map(({ value }) => value));
  const maximum = Math.max(0, ...chart.data.map(({ value }) => value));
  const toX = (value: number) =>
    plotX +
    (maximum === minimum
      ? 0
      : Math.round(
          ((value - minimum) / (maximum - minimum)) * (plotWidth - 1),
        ));
  const zeroX = toX(0);
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  if (chart.data.length === 0)
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  chart.data.forEach((datum, index) => {
    const y = titleRows + index;
    grid.text(
      0,
      y,
      truncateText(datum.label, labelWidth, palette.ellipsis),
      "label",
    );
    const endX = toX(datum.value);
    for (let x = Math.min(zeroX, endX); x <= Math.max(zeroX, endX); x += 1)
      grid.set(
        x,
        y,
        palette.horizontalAxis,
        datum.value >= 0 ? "positive" : "negative",
        { foreground: datum.value >= 0 ? "positive" : "negative" },
      );
    grid.set(
      endX,
      y,
      charset === "ascii" ? "o" : "●",
      "series",
      { foreground: datum.value >= 0 ? "positive" : "negative", bold: true },
      datum,
    );
    grid.set(zeroX, y, palette.baseline, "axis", { foreground: "muted" });
  });
  const heading = chart.title ?? "Lollipop chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.map(({ label, value }) => `${label}: ${formatValue(value)}`).join("; ")}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
      ],
      rows: chart.data.map(({ label, value }) => ({ label, value })),
    },
  );
}

export function stepChart(input: StepChartInput): StepChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("step input must be an object.");
  const base = line(input);
  return Object.freeze({
    type: "step",
    values: base.values,
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutStep(
  chart: StepChart,
  options: LayoutOptions = {},
): CellGrid {
  const base = layoutLine(line(chart), options, "step");
  base.description =
    chart.description ??
    `${chart.title ?? chart.label ?? "Step chart"}. ${chart.values.length} points.`;
  base.table.caption = chart.title ?? chart.label ?? "Step chart";
  return base;
}
