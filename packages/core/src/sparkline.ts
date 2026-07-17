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
  SparklineChart,
  SparklineChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 40;

interface Sample {
  index: number;
  value: number | null;
}

function copyValue(value: number | null, index: number): number | null {
  if (value === null) return null;
  validateFiniteNumber(value, `values[${index}]`);
  return value;
}

export function sparkline(input: SparklineChartInput): SparklineChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("sparkline input must be an object.");
  }
  if (!Array.isArray(input.values)) {
    throw new TypeError("values must be an array.");
  }
  validateDataLength(input.values.length, "values");
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.label !== undefined) validateText(input.label, "label");
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

  const values = Object.freeze(input.values.map(copyValue));
  const chart: SparklineChart = {
    type: "sparkline",
    values,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
  };
  return Object.freeze(chart);
}

function downsample(
  values: readonly (number | null)[],
  target: number,
): Sample[] {
  const samples = values.map((value, index) => ({ index, value }));
  if (samples.length <= target) return samples;
  if (target === 1) return [samples[0] ?? { index: 0, value: null }];
  if (target === 2) {
    return [samples[0], samples[samples.length - 1]].filter(
      (sample): sample is Sample => sample !== undefined,
    );
  }

  const finite = values.filter((value): value is number => value !== null);
  const midpoint =
    finite.length === 0 ? 0 : (Math.min(...finite) + Math.max(...finite)) / 2;
  const result: Sample[] = [samples[0] ?? { index: 0, value: null }];
  const interior = samples.length - 2;

  for (let bucket = 0; bucket < target - 2; bucket += 1) {
    const start = 1 + Math.floor((bucket * interior) / (target - 2));
    const end = 1 + Math.floor(((bucket + 1) * interior) / (target - 2));
    const candidates = samples.slice(start, Math.max(start + 1, end));
    const populated = candidates.filter(
      (sample): sample is Sample & { value: number } => sample.value !== null,
    );
    if (populated.length === 0) {
      result.push(candidates[0] ?? { index: start, value: null });
      continue;
    }
    const first = populated[0];
    if (first === undefined) continue;
    let selected = first;
    for (const candidate of populated.slice(1)) {
      if (
        Math.abs(candidate.value - midpoint) >
        Math.abs(selected.value - midpoint)
      ) {
        selected = candidate;
      }
    }
    result.push(selected);
  }

  const last = samples[samples.length - 1];
  if (last !== undefined) result.push(last);
  return result;
}

function descriptionFor(chart: SparklineChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? chart.label ?? "Sparkline";
  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  if (finite.length === 0) return `${heading}. No numeric data.`;
  return `${heading}. ${chart.values.length} points; first ${finite[0]}; last ${finite[finite.length - 1]}; minimum ${Math.min(...finite)}; maximum ${Math.max(...finite)}.`;
}

export function layoutSparkline(
  chart: SparklineChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  validateWidth(width, "layout width");
  const palette = getPalette(options.charset ?? "unicode");
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + 1;
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

  const row = titleRows;
  const labelWidth =
    chart.label === undefined
      ? 0
      : Math.min(measureText(chart.label), Math.floor(width * 0.3));
  if (chart.label !== undefined) {
    grid.text(
      0,
      row,
      truncateText(chart.label, labelWidth, palette.ellipsis),
      "label",
    );
  }
  const plotX = labelWidth === 0 ? 0 : labelWidth + 1;
  const plotWidth = width - plotX;

  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  const minimum = chart.min ?? (finite.length === 0 ? 0 : Math.min(...finite));
  const maximum = chart.max ?? (finite.length === 0 ? 1 : Math.max(...finite));
  const samples = downsample(chart.values, plotWidth);

  if (samples.length === 0) {
    grid.text(plotX, row, "No data", "missing", { foreground: "muted" });
  } else {
    samples.forEach((sample, x) => {
      if (sample.value === null) {
        grid.set(plotX + x, row, palette.missing, "missing", {
          foreground: "muted",
        });
        return;
      }
      const ratio =
        maximum === minimum
          ? 0.5
          : Math.max(
              0,
              Math.min(1, (sample.value - minimum) / (maximum - minimum)),
            );
      const level = Math.floor(ratio * (palette.density.length - 1));
      const glyph =
        palette.density[level] ?? palette.density[0] ?? palette.fill;
      grid.set(
        plotX + x,
        row,
        glyph,
        "series",
        { foreground: "series1" },
        {
          label: String(sample.index),
          value: sample.value,
        },
      );
    });
  }

  return grid.build(descriptionFor(chart), {
    caption: chart.title ?? chart.label ?? "Sparkline",
    columns: [
      { key: "index", label: "Index" },
      { key: "value", label: "Value" },
    ],
    rows: chart.values.map((value, index) => ({ index, value })),
  });
}
