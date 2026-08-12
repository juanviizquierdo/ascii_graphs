import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import {
  validateDataLength,
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
  StatusChart,
  StatusChartInput,
  StatusRow,
  StatusRowInput,
  StatusValue,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const MAX_MATRIX_VALUES = 100_000;
const statuses = new Set<StatusValue>([
  "success",
  "warning",
  "failure",
  "unknown",
]);

const statusGlyphs: Record<CharacterSet, Record<StatusValue, string>> = {
  ascii: { success: "+", warning: "!", failure: "x", unknown: "?" },
  unicode: { success: "✓", warning: "!", failure: "×", unknown: "?" },
};

const statusStyles: Record<StatusValue, CellStyle> = {
  success: { foreground: "positive", bold: true },
  warning: { foreground: "accent", bold: true },
  failure: { foreground: "negative", bold: true },
  unknown: { foreground: "muted" },
};

function normalizeRow(
  row: StatusRowInput,
  index: number,
  columnCount: number,
): StatusRow {
  if (typeof row !== "object" || row === null) {
    throw new TypeError(`rows[${index}] must be a status row object.`);
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
  row.values.forEach((value, column) => {
    if (!statuses.has(value)) {
      throw new TypeError(
        `rows[${index}].values[${column}] must be success, warning, failure, or unknown.`,
      );
    }
  });
  return Object.freeze({
    label: row.label,
    values: Object.freeze([...row.values]),
  });
}

export function statusGrid(input: StatusChartInput): StatusChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("status input must be an object.");
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
      `status grid cannot contain more than ${MAX_MATRIX_VALUES} matrix values.`,
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
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean") {
    throw new TypeError("showLegend must be a boolean.");
  }

  const columns = Object.freeze([...input.columns]);
  const rows = Object.freeze(
    input.rows.map((row, index) => normalizeRow(row, index, columns.length)),
  );
  return Object.freeze({
    type: "status",
    columns,
    rows,
    showLegend: input.showLegend ?? true,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function describe(chart: StatusChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Status grid";
  const counts: Record<StatusValue, number> = {
    success: 0,
    warning: 0,
    failure: 0,
    unknown: 0,
  };
  for (const row of chart.rows) {
    for (const value of row.values) counts[value] += 1;
  }
  return `${heading}. ${chart.rows.length} rows by ${chart.columns.length} columns; ${counts.success} success, ${counts.warning} warning, ${counts.failure} failure, ${counts.unknown} unknown.`;
}

export function layoutStatus(
  chart: StatusChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  validateWidth(width, "layout width");
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const glyphs = statusGlyphs[charset];
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
        `layout width ${width} is too narrow for ${chart.columns.length} status columns.`,
      );
    }
    const stride = Math.min(8, Math.floor(available / chart.columns.length));
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
        const glyph = glyphs[value];
        const offset = Math.max(
          0,
          Math.floor((cellWidth - measureText(glyph)) / 2),
        );
        grid.set(
          x + offset,
          y,
          glyph,
          value === "unknown" ? "missing" : "series",
          statusStyles[value],
        );
      });
    });

    if (chart.showLegend) {
      const legendY = headerY + 1 + chart.rows.length + 1;
      const legend = `${glyphs.success} success  ${glyphs.warning} warning  ${glyphs.failure} failure  ${glyphs.unknown} unknown`;
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
  return grid.build(describe(chart), {
    caption: chart.title ?? "Status grid",
    columns,
    rows,
  });
}
