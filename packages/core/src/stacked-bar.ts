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
  CellStyle,
  CharacterSet,
  DataTableRow,
  LayoutOptions,
  StackedBarChart,
  StackedBarChartInput,
  StackedBarRow,
  StackedBarRowInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const fills: Record<CharacterSet, readonly string[]> = {
  ascii: ["#", "=", "+", "-"],
  unicode: ["█", "▓", "▒", "░"],
};
const styles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];

function normalizeRow(
  row: StackedBarRowInput,
  index: number,
  count: number,
): StackedBarRow {
  if (typeof row !== "object" || row === null)
    throw new TypeError(`rows[${index}] must be a stacked bar row object.`);
  validateText(row.label, `rows[${index}].label`);
  if (!Array.isArray(row.values) || row.values.length !== count) {
    throw new RangeError(
      `rows[${index}].values must contain exactly ${count} values.`,
    );
  }
  row.values.forEach((value, valueIndex) => {
    validateFiniteNumber(value, `rows[${index}].values[${valueIndex}]`);
    if (value < 0)
      throw new RangeError(
        `rows[${index}].values[${valueIndex}] cannot be negative.`,
      );
  });
  return Object.freeze({
    label: row.label,
    values: Object.freeze([...row.values]),
  });
}

export function stackedBar(input: StackedBarChartInput): StackedBarChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("stacked bar input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  if (!Array.isArray(input.rows)) throw new TypeError("rows must be an array.");
  validateDataLength(input.series.length, "series");
  validateDataLength(input.rows.length, "rows");
  input.series.forEach((label, index) =>
    validateText(label, `series[${index}]`),
  );
  if (new Set(input.series).size !== input.series.length)
    throw new TypeError("series labels must be unique.");
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  const series = Object.freeze([...input.series]);
  return Object.freeze({
    type: "stacked-bar",
    series,
    rows: Object.freeze(
      input.rows.map((row, index) => normalizeRow(row, index, series.length)),
    ),
    showLegend: input.showLegend ?? true,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function describe(chart: StackedBarChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Stacked bar chart";
  if (chart.rows.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.rows.length} rows across ${chart.series.length} series.`;
}

export function layoutStackedBar(
  chart: StackedBarChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight =
    titleRows +
    Math.max(1, chart.rows.length) +
    (chart.showLegend && chart.series.length > 0 ? 2 : 0);
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.rows.map(({ label }) => measureText(label))),
    Math.max(1, Math.floor(width * 0.3)),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  if (plotWidth < 4)
    throw new RangeError(
      `layout width ${width} is too narrow for stacked bars.`,
    );
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  if (chart.rows.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    chart.rows.forEach((row, rowIndex) => {
      const y = titleRows + rowIndex;
      grid.text(
        0,
        y,
        truncateText(row.label, labelWidth, palette.ellipsis),
        "label",
      );
      const total = row.values.reduce((sum, value) => sum + value, 0);
      let cursor = plotX;
      row.values.forEach((value, seriesIndex) => {
        const remaining = width - cursor;
        const segmentWidth =
          total === 0
            ? 0
            : seriesIndex === row.values.length - 1
              ? remaining
              : Math.min(remaining, Math.round((value / total) * plotWidth));
        const glyph =
          fills[charset][seriesIndex % fills[charset].length] ?? palette.fill;
        const style = styles[seriesIndex % styles.length];
        for (let offset = 0; offset < segmentWidth; offset += 1)
          grid.set(cursor + offset, y, glyph, "series", style, {
            label: chart.series[seriesIndex] ?? String(seriesIndex),
            value,
          });
        cursor += segmentWidth;
      });
      if (total === 0)
        grid.text(plotX, y, "No value", "missing", { foreground: "muted" });
    });
    if (chart.showLegend && chart.series.length > 0) {
      const legendY = titleRows + chart.rows.length + 1;
      const legend = chart.series
        .map(
          (label, index) =>
            `${fills[charset][index % fills[charset].length]} ${label}`,
        )
        .join("  ");
      grid.text(
        0,
        legendY,
        truncateText(legend, width, palette.ellipsis),
        "label",
        { foreground: "muted" },
      );
    }
  }
  const columns = [
    { key: "row", label: "Row" },
    ...chart.series.map((label, index) => ({ key: `series_${index}`, label })),
  ];
  const rows: DataTableRow[] = chart.rows.map((row) => {
    const result: DataTableRow = { row: row.label };
    row.values.forEach((value, index) => {
      result[`series_${index}`] = value;
    });
    return result;
  });
  return grid.build(describe(chart), {
    caption: chart.title ?? "Stacked bar chart",
    columns,
    rows,
  });
}
