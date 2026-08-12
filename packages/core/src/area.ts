import { formatValue } from "./bar.js";
import { GridBuilder, measureText, truncateText } from "./grid.js";
import { sampleSeries } from "./line.js";
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
  AreaChart,
  AreaChartInput,
  CellGrid,
  CharacterSet,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const glyphs: Record<CharacterSet, { fill: string; point: string }> = {
  ascii: { fill: "#", point: "*" },
  unicode: { fill: "░", point: "█" },
};

function copyValue(value: number | null, index: number): number | null {
  if (value === null) return null;
  validateFiniteNumber(value, `values[${index}]`);
  return value;
}

export function area(input: AreaChartInput): AreaChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("area input must be an object.");
  }
  if (!Array.isArray(input.values))
    throw new TypeError("values must be an array.");
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
  return Object.freeze({
    type: "area",
    values: Object.freeze(input.values.map(copyValue)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function describe(chart: AreaChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? chart.label ?? "Area chart";
  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  if (finite.length === 0) return `${heading}. No numeric data.`;
  return `${heading}. ${chart.values.length} points; minimum ${formatValue(Math.min(...finite))}; maximum ${formatValue(Math.max(...finite))}.`;
}

export function layoutArea(
  chart: AreaChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 4) {
    throw new RangeError(
      `layout height ${height} is too short; area charts require at least ${titleRows + 5} rows.`,
    );
  }
  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  const minimum = chart.min ?? (finite.length === 0 ? 0 : Math.min(...finite));
  const maximum = chart.max ?? (finite.length === 0 ? 1 : Math.max(...finite));
  const labelWidth = Math.max(
    measureText(formatValue(minimum)),
    measureText(formatValue(maximum)),
  );
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX;
  if (plotWidth < 2)
    throw new RangeError(
      `layout width ${width} is too narrow for an area chart.`,
    );

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
  const plotTop = titleRows;
  const plotBottom = plotTop + plotHeight - 1;
  grid.text(0, plotTop, formatValue(maximum), "value", { foreground: "muted" });
  grid.text(0, plotBottom, formatValue(minimum), "value", {
    foreground: "muted",
  });
  for (let x = plotX - 1; x < width; x += 1) {
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  }

  const samples = sampleSeries(chart.values, plotWidth);
  const positions = samples.map((sample, index) => {
    const x =
      samples.length <= 1
        ? plotX
        : plotX + Math.round((index * (plotWidth - 1)) / (samples.length - 1));
    if (sample.value === null) return { ...sample, x, y: null };
    const ratio =
      maximum === minimum
        ? 0.5
        : Math.max(
            0,
            Math.min(1, (sample.value - minimum) / (maximum - minimum)),
          );
    return {
      ...sample,
      x,
      y: plotBottom - 1 - Math.round(ratio * (plotHeight - 2)),
    };
  });
  for (let index = 1; index < positions.length; index += 1) {
    const left = positions[index - 1];
    const right = positions[index];
    if (
      left === undefined ||
      right === undefined ||
      left.y === null ||
      right.y === null
    )
      continue;
    const span = Math.max(1, right.x - left.x);
    for (let x = left.x; x <= right.x; x += 1) {
      const ratio = (x - left.x) / span;
      const y = Math.round(left.y + (right.y - left.y) * ratio);
      for (let fillY = y; fillY < plotBottom; fillY += 1) {
        grid.set(x, fillY, glyphs[charset].fill, "series", {
          foreground: "series1",
        });
      }
    }
  }
  positions.forEach((sample) => {
    if (sample.y === null || sample.value === null) {
      grid.set(
        sample.x,
        plotTop + Math.floor(plotHeight / 2),
        palette.missing,
        "missing",
        { foreground: "muted" },
      );
    } else {
      grid.set(
        sample.x,
        sample.y,
        glyphs[charset].point,
        "series",
        { foreground: "series1", bold: true },
        { label: String(sample.index), value: sample.value },
      );
    }
  });
  if (chart.values.length > 0) {
    grid.text(plotX, height - 1, "0", "label", { foreground: "muted" });
    const last = String(chart.values.length - 1);
    grid.text(width - measureText(last), height - 1, last, "label", {
      foreground: "muted",
    });
  } else {
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  }
  return grid.build(describe(chart), {
    caption: chart.title ?? chart.label ?? "Area chart",
    columns: [
      { key: "index", label: "Index" },
      { key: "value", label: "Value" },
    ],
    rows: chart.values.map((value, index) => ({ index, value })),
  });
}
