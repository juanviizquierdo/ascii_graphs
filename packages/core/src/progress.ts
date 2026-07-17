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
  LayoutOptions,
  ProgressChart,
  ProgressChartInput,
  ProgressDatum,
  ProgressDatumInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;

function normalizeDatum(
  datum: ProgressDatumInput,
  index: number,
  clamp: boolean,
): ProgressDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be a progress data object.`);
  }
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  const minimum = datum.min ?? 0;
  const maximum = datum.max ?? 100;
  validateFiniteNumber(minimum, `data[${index}].min`);
  validateFiniteNumber(maximum, `data[${index}].max`);
  if (minimum >= maximum) {
    throw new RangeError(`data[${index}].min must be less than max.`);
  }
  if (datum.target !== undefined) {
    validateFiniteNumber(datum.target, `data[${index}].target`);
    if (datum.target < minimum || datum.target > maximum) {
      throw new RangeError(
        `data[${index}].target must be between min and max.`,
      );
    }
  }
  if (!clamp && (datum.value < minimum || datum.value > maximum)) {
    throw new RangeError(
      `data[${index}].value must be between min and max when clamp is false.`,
    );
  }

  const normalized: ProgressDatum = {
    label: datum.label,
    value: datum.value,
    min: minimum,
    max: maximum,
    ...(datum.target !== undefined ? { target: datum.target } : {}),
  };
  return Object.freeze(normalized);
}

export function progress(input: ProgressChartInput): ProgressChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("progress input must be an object.");
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
  if (
    input.showPercentage !== undefined &&
    typeof input.showPercentage !== "boolean"
  ) {
    throw new TypeError("showPercentage must be a boolean.");
  }
  if (input.clamp !== undefined && typeof input.clamp !== "boolean") {
    throw new TypeError("clamp must be a boolean.");
  }

  const clamp = input.clamp ?? true;
  const data = Object.freeze(
    input.data.map((datum, index) => normalizeDatum(datum, index, clamp)),
  );
  const chart: ProgressChart = {
    type: "progress",
    data,
    showPercentage: input.showPercentage ?? true,
    clamp,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
  };
  return Object.freeze(chart);
}

function percentage(datum: ProgressDatum): number {
  return ((datum.value - datum.min) / (datum.max - datum.min)) * 100;
}

function percentageLabel(datum: ProgressDatum): string {
  return `${formatValue(percentage(datum))}%`;
}

function describe(chart: ProgressChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Progress chart";
  if (chart.data.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.data
    .map(
      (datum) =>
        `${datum.label}: ${formatValue(datum.value)} of ${formatValue(datum.max)} (${percentageLabel(datum)})`,
    )
    .join("; ")}.`;
}

export function layoutProgress(
  chart: ProgressChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  validateWidth(width, "layout width");
  const palette = getPalette(options.charset ?? "unicode");
  const labels = chart.data.map(({ label }) => measureText(label));
  const labelWidth = Math.min(
    Math.max(1, ...labels),
    Math.max(1, Math.floor(width * 0.3)),
  );
  const percentages = chart.data.map(percentageLabel);
  const percentageWidth = chart.showPercentage
    ? Math.max(1, ...percentages.map(measureText))
    : 0;
  const reserved =
    labelWidth + 1 + (chart.showPercentage ? percentageWidth + 1 : 0);
  const plotWidth = width - reserved;
  if (plotWidth < 5) {
    throw new RangeError(
      `layout width ${width} is too narrow for progress labels; increase it or hide percentages.`,
    );
  }

  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length);
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

  if (chart.data.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    chart.data.forEach((datum, index) => {
      const y = titleRows + index;
      const plotX = labelWidth + 1;
      const insideWidth = plotWidth - 2;
      const rawRatio = (datum.value - datum.min) / (datum.max - datum.min);
      const ratio = Math.max(0, Math.min(1, rawRatio));
      const filled = Math.round(ratio * insideWidth);
      grid.text(
        0,
        y,
        truncateText(datum.label, labelWidth, palette.ellipsis),
        "label",
      );
      grid.set(plotX, y, "[", "axis", { foreground: "muted" });
      for (let x = 0; x < insideWidth; x += 1) {
        const isFilled = x < filled;
        grid.set(
          plotX + 1 + x,
          y,
          isFilled ? palette.fill : palette.emptyFill,
          isFilled ? "positive" : "empty",
          { foreground: isFilled ? "positive" : "muted" },
          { label: datum.label, value: datum.value },
        );
      }
      if (datum.target !== undefined) {
        const targetRatio =
          (datum.target - datum.min) / (datum.max - datum.min);
        const targetX = Math.round(targetRatio * (insideWidth - 1));
        grid.set(
          plotX + 1 + targetX,
          y,
          palette.target,
          "axis",
          { foreground: "accent", bold: true },
          { label: datum.label, value: datum.target },
        );
      }
      grid.set(plotX + plotWidth - 1, y, "]", "axis", { foreground: "muted" });
      if (chart.showPercentage) {
        const label = percentages[index];
        if (label !== undefined) {
          grid.text(width - percentageWidth, y, label, "value");
        }
      }
    });
  }

  return grid.build(describe(chart), {
    caption: chart.title ?? "Progress chart",
    columns: [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
      { key: "min", label: "Minimum" },
      { key: "max", label: "Maximum" },
      { key: "target", label: "Target" },
      { key: "percentage", label: "Percentage" },
    ],
    rows: chart.data.map((datum) => ({
      label: datum.label,
      value: datum.value,
      min: datum.min,
      max: datum.max,
      target: datum.target ?? null,
      percentage: percentage(datum),
    })),
  });
}
