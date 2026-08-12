import { formatValue } from "./bar.js";
import { GridBuilder, truncateText } from "./grid.js";
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
  DonutChart,
  DonutChartInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 44;
const DEFAULT_HEIGHT = 16;
const MAX_SLICES = 8;
const marks: Record<CharacterSet, readonly string[]> = {
  ascii: ["1", "2", "3", "4", "5", "6", "7", "8"],
  unicode: ["●", "◆", "■", "▲", "○", "◇", "□", "△"],
};
const styles: readonly CellStyle[] = [
  { foreground: "series1", bold: true },
  { foreground: "series2", bold: true },
  { foreground: "series3", bold: true },
  { foreground: "series4", bold: true },
];

function normalizeDatum(datum: BarDatum, index: number): BarDatum {
  if (typeof datum !== "object" || datum === null)
    throw new TypeError(`data[${index}] must be a donut slice object.`);
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  if (datum.value < 0)
    throw new RangeError(`data[${index}].value cannot be negative.`);
  return Object.freeze({ label: datum.label, value: datum.value });
}

export function donut(input: DonutChartInput): DonutChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("donut input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  if (input.data.length > MAX_SLICES)
    throw new RangeError(`donut charts support at most ${MAX_SLICES} slices.`);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  if (
    input.style !== undefined &&
    input.style !== "donut" &&
    input.style !== "pie"
  )
    throw new TypeError("style must be donut or pie.");
  return Object.freeze({
    type: "donut",
    data: Object.freeze(input.data.map(normalizeDatum)),
    showLegend: input.showLegend ?? true,
    style: input.style ?? "donut",
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function describe(chart: DonutChart, total: number): string {
  if (chart.description !== undefined) return chart.description;
  const heading =
    chart.title ?? (chart.style === "pie" ? "Pie chart" : "Donut chart");
  if (total === 0) return `${heading}. No positive data.`;
  return `${heading}. ${chart.data.map(({ label, value }) => `${label}: ${formatValue(value)} (${Math.round((value / total) * 100)}%)`).join("; ")}.`;
}

export function layoutDonut(
  chart: DonutChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend && chart.data.length > 0 ? 2 : 0;
  const plotHeight = height - titleRows - legendRows;
  if (plotHeight < 7)
    throw new RangeError(
      `layout height ${height} is too short for a donut chart.`,
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
  const total = chart.data.reduce((sum, { value }) => sum + value, 0);
  if (total === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    const radiusY = Math.max(3, Math.min(5, Math.floor((plotHeight - 1) / 2)));
    const radiusX = Math.max(6, Math.min(12, radiusY * 2));
    const centerX = Math.floor(width / 2);
    const centerY = titleRows + radiusY;
    const cumulative: number[] = [];
    let sum = 0;
    chart.data.forEach(({ value }) => {
      sum += value / total;
      cumulative.push(sum);
    });
    for (let y = centerY - radiusY; y <= centerY + radiusY; y += 1) {
      for (let x = centerX - radiusX; x <= centerX + radiusX; x += 1) {
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if ((chart.style === "donut" && distance < 0.52) || distance > 1.08)
          continue;
        const angle =
          (Math.atan2(dy, dx) + Math.PI * 2 + Math.PI / 2) % (Math.PI * 2);
        const fraction = angle / (Math.PI * 2);
        const slice = cumulative.findIndex((boundary) => fraction <= boundary);
        const index = slice === -1 ? chart.data.length - 1 : slice;
        const datum = chart.data[index];
        if (datum === undefined) continue;
        grid.set(
          x,
          y,
          marks[charset][index] ?? palette.fill,
          "series",
          styles[index % styles.length],
          datum,
        );
      }
    }
    if (chart.style === "donut") {
      grid.text(
        centerX - Math.floor(formatValue(total).length / 2),
        centerY,
        formatValue(total),
        "value",
        { foreground: "accent", bold: true },
      );
    }
    if (chart.showLegend) {
      const legend = chart.data
        .map(({ label }, index) => `${marks[charset][index]} ${label}`)
        .join("  ");
      grid.text(
        0,
        height - 1,
        truncateText(legend, width, palette.ellipsis),
        "label",
        { foreground: "muted" },
      );
    }
  }
  return grid.build(describe(chart, total), {
    caption:
      chart.title ?? (chart.style === "pie" ? "Pie chart" : "Donut chart"),
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
  });
}
