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
  ColumnChart,
  ColumnChartInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;

function normalizeDatum(datum: BarDatum, index: number): BarDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(
      `data[${index}] must be an object with label and value.`,
    );
  }
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  return Object.freeze({ label: datum.label, value: datum.value });
}

export function column(input: ColumnChartInput): ColumnChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("column input must be an object.");
  }
  if (!Array.isArray(input.data)) {
    throw new TypeError("data must be an array.");
  }
  validateDataLength(input.data.length);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");

  const chart: ColumnChart = {
    type: "column",
    data: Object.freeze(input.data.map(normalizeDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  };
  return Object.freeze(chart);
}

function describe(chart: ColumnChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Column chart";
  if (chart.data.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.data
    .map(({ label, value }) => `${label}: ${formatValue(value)}`)
    .join("; ")}.`;
}

export function layoutColumn(
  chart: ColumnChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const palette = getPalette(options.charset ?? "unicode");
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotTop = titleRows;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 4) {
    throw new RangeError(
      `layout height ${height} is too short; column charts require at least ${titleRows + 5} rows.`,
    );
  }
  const labelY = plotTop + plotHeight;
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
    grid.text(0, plotTop, "No data", "missing", { foreground: "muted" });
  } else {
    if (chart.data.length > width) {
      throw new RangeError(
        `layout width ${width} is too narrow for ${chart.data.length} columns.`,
      );
    }
    const stride = Math.min(8, Math.floor(width / chart.data.length));
    const cellWidth = stride === 1 ? 1 : stride - 1;
    const usedWidth = stride * chart.data.length;
    const startX = Math.max(0, Math.floor((width - usedWidth) / 2));
    const minimum = Math.min(0, ...chart.data.map(({ value }) => value));
    const maximum = Math.max(0, ...chart.data.map(({ value }) => value));
    const span = maximum - minimum;
    const zeroOffset =
      span === 0
        ? plotHeight - 1
        : Math.round((maximum / span) * (plotHeight - 1));
    const zeroY = plotTop + zeroOffset;
    const plotBottom = plotTop + plotHeight - 1;

    for (let x = startX; x < startX + usedWidth; x += 1) {
      grid.set(x, zeroY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    }

    chart.data.forEach((datum, index) => {
      const x = startX + index * stride;
      if (datum.value > 0 && maximum > 0) {
        const available = zeroY - plotTop;
        const length = Math.max(
          1,
          Math.round((datum.value / maximum) * available),
        );
        for (let y = zeroY - length; y < zeroY; y += 1) {
          for (let offset = 0; offset < cellWidth; offset += 1) {
            grid.set(
              x + offset,
              y,
              palette.fill,
              "positive",
              { foreground: "positive" },
              datum,
            );
          }
        }
      } else if (datum.value < 0 && minimum < 0) {
        const available = plotBottom - zeroY;
        const length = Math.max(
          1,
          Math.round((datum.value / minimum) * available),
        );
        for (let y = zeroY + 1; y <= zeroY + length; y += 1) {
          for (let offset = 0; offset < cellWidth; offset += 1) {
            grid.set(
              x + offset,
              y,
              palette.fill,
              "negative",
              { foreground: "negative" },
              datum,
            );
          }
        }
      }
      const label = truncateText(datum.label, cellWidth, palette.ellipsis);
      const offset = Math.max(
        0,
        Math.floor((cellWidth - measureText(label)) / 2),
      );
      grid.text(x + offset, labelY, label, "label", undefined, datum);
    });
  }

  return grid.build(describe(chart), {
    caption: chart.title ?? "Column chart",
    columns: [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ],
    rows: chart.data.map(({ label, value }) => ({ label, value })),
  });
}
