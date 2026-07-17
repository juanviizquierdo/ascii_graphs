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
  HeatmapChart,
  HeatmapChartInput,
  HeatmapRow,
  HeatmapRowInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const MAX_MATRIX_VALUES = 100_000;

function normalizeValue(value: number | null, row: number, column: number) {
  if (value === null) return null;
  validateFiniteNumber(value, `rows[${row}].values[${column}]`);
  return value;
}

function normalizeRow(
  row: HeatmapRowInput,
  index: number,
  columnCount: number,
): HeatmapRow {
  if (typeof row !== "object" || row === null) {
    throw new TypeError(`rows[${index}] must be a heatmap row object.`);
  }
  validateText(row.label, `rows[${index}].label`);
  if (!Array.isArray(row.values)) {
    throw new TypeError(`rows[${index}].values must be an array.`);
  }
  if (row.values.length !== columnCount) {
    throw new RangeError(
      `rows[${index}].values must contain exactly ${columnCount} values.`,
    );
  }
  return Object.freeze({
    label: row.label,
    values: Object.freeze(
      row.values.map((value, column) => normalizeValue(value, index, column)),
    ),
  });
}

export function heatmap(input: HeatmapChartInput): HeatmapChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("heatmap input must be an object.");
  }
  if (!Array.isArray(input.columns)) {
    throw new TypeError("columns must be an array.");
  }
  if (!Array.isArray(input.rows)) {
    throw new TypeError("rows must be an array.");
  }
  validateDataLength(input.columns.length, "columns");
  validateDataLength(input.rows.length, "rows");
  if (input.columns.length * input.rows.length > MAX_MATRIX_VALUES) {
    throw new RangeError(
      `heatmap cannot contain more than ${MAX_MATRIX_VALUES} matrix values.`,
    );
  }
  input.columns.forEach((column, index) =>
    validateText(column, `columns[${index}]`),
  );
  if (new Set(input.columns).size !== input.columns.length) {
    throw new TypeError("column labels must be unique.");
  }
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  if (input.min !== undefined) validateFiniteNumber(input.min, "min");
  if (input.max !== undefined) validateFiniteNumber(input.max, "max");
  if (
    input.min !== undefined &&
    input.max !== undefined &&
    input.min > input.max
  ) {
    throw new RangeError("min cannot be greater than max.");
  }
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean") {
    throw new TypeError("showLegend must be a boolean.");
  }

  const columns = Object.freeze([...input.columns]);
  const rows = Object.freeze(
    input.rows.map((row, index) => normalizeRow(row, index, columns.length)),
  );
  const chart: HeatmapChart = {
    type: "heatmap",
    columns,
    rows,
    showLegend: input.showLegend ?? true,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
  };
  return Object.freeze(chart);
}

function describe(chart: HeatmapChart, finite: readonly number[]): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Heatmap";
  if (finite.length === 0) {
    return `${heading}. ${chart.rows.length} rows by ${chart.columns.length} columns; no numeric data.`;
  }
  return `${heading}. ${chart.rows.length} rows by ${chart.columns.length} columns; minimum ${formatValue(Math.min(...finite))}; maximum ${formatValue(Math.max(...finite))}.`;
}

export function layoutHeatmap(
  chart: HeatmapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  validateWidth(width, "layout width");
  const palette = getPalette(options.charset ?? "unicode");
  const isEmpty = chart.columns.length === 0 || chart.rows.length === 0;
  const titleRows = chart.title === undefined ? 0 : 2;
  const matrixRows = isEmpty
    ? 1
    : 1 + chart.rows.length + (chart.showLegend ? 2 : 0);
  const naturalHeight = titleRows + matrixRows;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight) {
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  }
  validateViewport(width, height);
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

  const values = chart.rows.flatMap(({ values: rowValues }) => rowValues);
  const finite = values.filter((value): value is number => value !== null);
  const minimum = chart.min ?? (finite.length === 0 ? 0 : Math.min(...finite));
  const maximum = chart.max ?? (finite.length === 0 ? 1 : Math.max(...finite));

  if (isEmpty) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    const labelWidth = Math.min(
      Math.max(1, ...chart.rows.map(({ label }) => measureText(label))),
      Math.max(1, Math.floor(width * 0.25)),
    );
    const available = width - labelWidth - 1;
    if (available < chart.columns.length) {
      throw new RangeError(
        `layout width ${width} is too narrow for ${chart.columns.length} heatmap columns.`,
      );
    }
    const stride = Math.min(6, Math.floor(available / chart.columns.length));
    const cellWidth = stride === 1 ? 1 : stride - 1;
    const plotX = labelWidth + 1;
    const headerY = titleRows;

    chart.columns.forEach((column, index) => {
      grid.text(
        plotX + index * stride,
        headerY,
        truncateText(column, cellWidth, palette.ellipsis),
        "label",
        { foreground: "muted" },
      );
    });

    chart.rows.forEach((row, rowIndex) => {
      const y = headerY + 1 + rowIndex;
      grid.text(
        0,
        y,
        truncateText(row.label, labelWidth, palette.ellipsis),
        "label",
      );
      row.values.forEach((value, columnIndex) => {
        const x = plotX + columnIndex * stride;
        if (value === null) {
          grid.set(x, y, palette.missing, "missing", { foreground: "muted" });
          return;
        }
        const ratio =
          maximum === minimum
            ? 0.5
            : Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
        const level = Math.floor(ratio * (palette.density.length - 1));
        const glyph =
          palette.density[level] ?? palette.density[0] ?? palette.fill;
        for (let offset = 0; offset < cellWidth; offset += 1) {
          grid.set(
            x + offset,
            y,
            glyph,
            "series",
            { foreground: "series1" },
            { label: `${row.label} / ${chart.columns[columnIndex]}`, value },
          );
        }
      });
    });

    if (chart.showLegend) {
      const legendY = headerY + 1 + chart.rows.length + 1;
      const legend = `${formatValue(minimum)} ${palette.density.join("")} ${formatValue(maximum)}  ${palette.missing} missing`;
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
    ...chart.columns.map((label, index) => ({
      key: `column_${index}`,
      label,
    })),
  ];
  const rows: DataTableRow[] = chart.rows.map((row) => {
    const tableRow: DataTableRow = { row: row.label };
    row.values.forEach((value, index) => {
      tableRow[`column_${index}`] = value;
    });
    return tableRow;
  });
  return grid.build(describe(chart, finite), {
    caption: chart.title ?? "Heatmap",
    columns,
    rows,
  });
}
