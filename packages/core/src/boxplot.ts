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
  BoxPlotChart,
  BoxPlotChartInput,
  BoxPlotDatum,
  BoxPlotDatumInput,
  CellGrid,
  CharacterSet,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const glyphs: Record<
  CharacterSet,
  {
    whisker: string;
    box: string;
    minimum: string;
    maximum: string;
    median: string;
  }
> = {
  ascii: { whisker: "-", box: "=", minimum: "|", maximum: "|", median: "|" },
  unicode: { whisker: "─", box: "═", minimum: "├", maximum: "┤", median: "│" },
};

interface Summary {
  label: string;
  count: number;
  minimum: number;
  q1: number;
  median: number;
  q3: number;
  maximum: number;
}

function normalizeDatum(datum: BoxPlotDatumInput, index: number): BoxPlotDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be a box plot group object.`);
  }
  validateText(datum.label, `data[${index}].label`);
  if (!Array.isArray(datum.values) || datum.values.length === 0) {
    throw new TypeError(`data[${index}].values must be a non-empty array.`);
  }
  validateDataLength(datum.values.length, `data[${index}].values`);
  datum.values.forEach((value, valueIndex) =>
    validateFiniteNumber(value, `data[${index}].values[${valueIndex}]`),
  );
  return Object.freeze({
    label: datum.label,
    values: Object.freeze([...datum.values]),
  });
}

export function boxPlot(input: BoxPlotChartInput): BoxPlotChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("box plot input must be an object.");
  }
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  return Object.freeze({
    type: "boxplot",
    data: Object.freeze(input.data.map(normalizeDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function quantile(sorted: readonly number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const low = sorted[lower] ?? 0;
  const high = sorted[upper] ?? low;
  return low + (high - low) * (position - lower);
}

function summarize(group: BoxPlotDatum): Summary {
  const sorted = [...group.values].sort((left, right) => left - right);
  return {
    label: group.label,
    count: sorted.length,
    minimum: sorted[0] ?? 0,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    maximum: sorted.at(-1) ?? 0,
  };
}

function describe(chart: BoxPlotChart, summaries: readonly Summary[]): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Box plot";
  if (summaries.length === 0) return `${heading}. No data.`;
  return `${heading}. ${summaries.length} groups; ${summaries.map(({ label, median }) => `${label} median ${formatValue(median)}`).join("; ")}.`;
}

export function layoutBoxPlot(
  chart: BoxPlotChart,
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
  const marks = glyphs[charset];
  const summaries = chart.data.map(summarize);
  const labelWidth = Math.min(
    Math.max(1, ...summaries.map(({ label }) => measureText(label))),
    Math.max(1, Math.floor(width * 0.25)),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  if (plotWidth < 8)
    throw new RangeError(`layout width ${width} is too narrow for a box plot.`);
  const minimum =
    summaries.length === 0
      ? 0
      : Math.min(...summaries.map((item) => item.minimum));
  const maximum =
    summaries.length === 0
      ? 1
      : Math.max(...summaries.map((item) => item.maximum));
  const toX = (value: number): number =>
    plotX +
    (maximum === minimum
      ? Math.floor((plotWidth - 1) / 2)
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
  if (summaries.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    summaries.forEach((summary, index) => {
      const y = titleRows + index;
      grid.text(
        0,
        y,
        truncateText(summary.label, labelWidth, palette.ellipsis),
        "label",
      );
      const minX = toX(summary.minimum);
      const q1X = toX(summary.q1);
      const medianX = toX(summary.median);
      const q3X = toX(summary.q3);
      const maxX = toX(summary.maximum);
      for (let x = minX; x <= maxX; x += 1) {
        grid.set(
          x,
          y,
          x >= q1X && x <= q3X ? marks.box : marks.whisker,
          "series",
          { foreground: "series1" },
        );
      }
      grid.set(minX, y, marks.minimum, "series", { foreground: "muted" });
      grid.set(maxX, y, marks.maximum, "series", { foreground: "muted" });
      grid.set(
        medianX,
        y,
        marks.median,
        "series",
        { foreground: "accent", bold: true },
        { label: summary.label, value: summary.median },
      );
    });
    const axisY = titleRows + summaries.length;
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
  return grid.build(describe(chart, summaries), {
    caption: chart.title ?? "Box plot",
    columns: [
      { key: "label", label: "Label" },
      { key: "count", label: "Count" },
      { key: "minimum", label: "Minimum" },
      { key: "q1", label: "Q1" },
      { key: "median", label: "Median" },
      { key: "q3", label: "Q3" },
      { key: "maximum", label: "Maximum" },
    ],
    rows: summaries.map(
      ({ label, count, minimum, q1, median, q3, maximum }) => ({
        label,
        count,
        minimum,
        q1,
        median,
        q3,
        maximum,
      }),
    ),
  });
}
