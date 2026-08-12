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
  LayoutOptions,
  WaterfallChart,
  WaterfallChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;

function normalizeDatum(datum: BarDatum, index: number): BarDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be a waterfall datum object.`);
  }
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  return Object.freeze({ label: datum.label, value: datum.value });
}

export function waterfall(input: WaterfallChartInput): WaterfallChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("waterfall input must be an object.");
  }
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  if (input.initial !== undefined)
    validateFiniteNumber(input.initial, "initial");
  if (input.showTotal !== undefined && typeof input.showTotal !== "boolean") {
    throw new TypeError("showTotal must be a boolean.");
  }
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  return Object.freeze({
    type: "waterfall",
    data: Object.freeze(input.data.map(normalizeDatum)),
    initial: input.initial ?? 0,
    showTotal: input.showTotal ?? true,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutWaterfall(
  chart: WaterfallChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const rowCount = chart.data.length + (chart.showTotal ? 1 : 0);
  const naturalHeight = titleRows + Math.max(1, rowCount) + 2;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight) {
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  }
  validateViewport(width, height);
  const palette = getPalette(options.charset ?? "unicode");
  const labels = [
    ...chart.data.map(({ label }) => label),
    ...(chart.showTotal ? ["Total"] : []),
  ];
  const labelWidth = Math.min(
    Math.max(1, ...labels.map(measureText)),
    Math.max(1, Math.floor(width * 0.3)),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  if (plotWidth < 6)
    throw new RangeError(
      `layout width ${width} is too narrow for a waterfall chart.`,
    );
  const steps: Array<{
    label: string;
    change: number;
    start: number;
    end: number;
  }> = [];
  let running = chart.initial;
  chart.data.forEach(({ label, value }) => {
    const start = running;
    running += value;
    steps.push({ label, change: value, start, end: running });
  });
  const domainValues = [
    0,
    chart.initial,
    running,
    ...steps.flatMap(({ start, end }) => [start, end]),
  ];
  const minimum = Math.min(...domainValues);
  const maximum = Math.max(...domainValues);
  const toX = (value: number) =>
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
      {
        foreground: "accent",
        bold: true,
      },
    );
  }
  if (steps.length === 0 && !chart.showTotal) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    steps.forEach((step, index) => {
      const y = titleRows + index;
      grid.text(
        0,
        y,
        truncateText(step.label, labelWidth, palette.ellipsis),
        "label",
      );
      const startX = toX(step.start);
      const endX = toX(step.end);
      const from = Math.min(startX, endX);
      const to = Math.max(startX, endX);
      const style = {
        foreground:
          step.change >= 0 ? ("positive" as const) : ("negative" as const),
      };
      const glyph = step.change >= 0 ? palette.fill : palette.emptyFill;
      for (let x = from; x <= to; x += 1) {
        grid.set(
          x,
          y,
          glyph,
          step.change >= 0 ? "positive" : "negative",
          style,
          {
            label: step.label,
            value: step.change,
          },
        );
      }
      if (index < steps.length - 1) {
        grid.set(endX, y + 1, palette.baseline, "axis", {
          foreground: "muted",
        });
      }
    });
    if (chart.showTotal) {
      const y = titleRows + steps.length;
      grid.text(0, y, "Total", "label", undefined, {
        label: "Total",
        value: running,
      });
      const zeroX = toX(0);
      const totalX = toX(running);
      for (
        let x = Math.min(zeroX, totalX);
        x <= Math.max(zeroX, totalX);
        x += 1
      ) {
        grid.set(x, y, palette.fill, "series", {
          foreground: "accent",
          bold: true,
        });
      }
    }
    const axisY = titleRows + rowCount;
    for (let x = plotX; x < width; x += 1) {
      grid.set(x, axisY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    }
    const minLabel = formatValue(minimum);
    const maxLabel = formatValue(maximum);
    grid.text(plotX, axisY + 1, minLabel, "label", { foreground: "muted" });
    grid.text(width - measureText(maxLabel), axisY + 1, maxLabel, "label", {
      foreground: "muted",
    });
  }
  const heading = chart.title ?? "Waterfall chart";
  const description =
    chart.description ??
    `${heading}. Starts at ${formatValue(chart.initial)} and ends at ${formatValue(running)} after ${steps.length} changes.`;
  return grid.build(description, {
    caption: heading,
    columns: [
      { key: "label", label: "Label" },
      { key: "change", label: "Change" },
      { key: "total", label: "Running total" },
    ],
    rows: steps.map(({ label, change, end }) => ({
      label,
      change,
      total: end,
    })),
  });
}
