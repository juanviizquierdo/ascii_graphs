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
  CandlestickChart,
  CandlestickChartInput,
  CandlestickDatum,
  CandlestickDatumInput,
  CellGrid,
  CharacterSet,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const marks: Record<
  CharacterSet,
  { wick: string; rising: string; falling: string }
> = {
  ascii: { wick: "|", rising: "#", falling: "x" },
  unicode: { wick: "│", rising: "█", falling: "▓" },
};

function normalizeDatum(
  datum: CandlestickDatumInput,
  index: number,
): CandlestickDatum {
  if (typeof datum !== "object" || datum === null)
    throw new TypeError(`data[${index}] must be a candlestick datum object.`);
  validateText(datum.label, `data[${index}].label`);
  for (const key of ["open", "high", "low", "close"] as const)
    validateFiniteNumber(datum[key], `data[${index}].${key}`);
  if (
    datum.low > Math.min(datum.open, datum.close) ||
    datum.high < Math.max(datum.open, datum.close) ||
    datum.low > datum.high
  ) {
    throw new RangeError(
      `data[${index}] must satisfy low <= open/close <= high.`,
    );
  }
  return Object.freeze({ ...datum });
}

export function candlestick(input: CandlestickChartInput): CandlestickChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("candlestick input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  return Object.freeze({
    type: "candlestick",
    data: Object.freeze(input.data.map(normalizeDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutCandlestick(
  chart: CandlestickChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 5)
    throw new RangeError(
      `layout height ${height} is too short for candlesticks.`,
    );
  const minimum =
    chart.data.length === 0 ? 0 : Math.min(...chart.data.map(({ low }) => low));
  const maximum =
    chart.data.length === 0
      ? 1
      : Math.max(...chart.data.map(({ high }) => high));
  const yLabelWidth = Math.max(
    measureText(formatValue(minimum)),
    measureText(formatValue(maximum)),
  );
  const plotX = yLabelWidth + 2;
  const plotWidth = width - plotX;
  if (chart.data.length > plotWidth)
    throw new RangeError(
      `layout width ${width} is too narrow for ${chart.data.length} candles.`,
    );
  const stride =
    chart.data.length === 0
      ? 1
      : Math.max(1, Math.floor(plotWidth / chart.data.length));
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  const plotTop = titleRows;
  const plotBottom = plotTop + plotHeight - 1;
  grid.text(0, plotTop, formatValue(maximum), "value", { foreground: "muted" });
  grid.text(0, plotBottom, formatValue(minimum), "value", {
    foreground: "muted",
  });
  const toY = (value: number) =>
    plotBottom -
    Math.round(
      ((value - minimum) / Math.max(1e-12, maximum - minimum)) *
        (plotHeight - 1),
    );
  if (chart.data.length === 0)
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  chart.data.forEach((datum, index) => {
    const x = plotX + index * stride + Math.floor((stride - 1) / 2);
    const highY = toY(datum.high);
    const lowY = toY(datum.low);
    const openY = toY(datum.open);
    const closeY = toY(datum.close);
    const rising = datum.close >= datum.open;
    const style = {
      foreground: rising ? ("positive" as const) : ("negative" as const),
    };
    for (let y = highY; y <= lowY; y += 1)
      grid.set(x, y, marks[charset].wick, "series", style);
    for (let y = Math.min(openY, closeY); y <= Math.max(openY, closeY); y += 1)
      grid.set(
        x,
        y,
        rising ? marks[charset].rising : marks[charset].falling,
        rising ? "positive" : "negative",
        style,
        { label: datum.label, value: datum.close },
      );
    grid.text(
      x,
      height - 1,
      truncateText(datum.label, Math.max(1, stride - 1), palette.ellipsis),
      "label",
    );
  });
  const heading = chart.title ?? "Candlestick chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} periods; low ${formatValue(minimum)}; high ${formatValue(maximum)}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "open", label: "Open" },
        { key: "high", label: "High" },
        { key: "low", label: "Low" },
        { key: "close", label: "Close" },
      ],
      rows: chart.data.map(({ label, open, high, low, close }) => ({
        label,
        open,
        high,
        low,
        close,
      })),
    },
  );
}
