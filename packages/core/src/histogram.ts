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
  HistogramChart,
  HistogramChartInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;
const MAX_BINS = 50;

interface Bin {
  minimum: number;
  maximum: number;
  count: number;
}

export function histogram(input: HistogramChartInput): HistogramChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("histogram input must be an object.");
  }
  if (!Array.isArray(input.values)) {
    throw new TypeError("values must be an array.");
  }
  validateDataLength(input.values.length, "values");
  input.values.forEach((value, index) =>
    validateFiniteNumber(value, `values[${index}]`),
  );
  if (input.bins !== undefined) {
    if (
      !Number.isInteger(input.bins) ||
      input.bins < 1 ||
      input.bins > MAX_BINS
    ) {
      throw new RangeError(
        `bins must be an integer between 1 and ${MAX_BINS}.`,
      );
    }
  }
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");

  return Object.freeze({
    type: "histogram",
    values: Object.freeze([...input.values]),
    ...(input.bins !== undefined ? { bins: input.bins } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

function makeBins(chart: HistogramChart): Bin[] {
  if (chart.values.length === 0) return [];
  const minimum = Math.min(...chart.values);
  const maximum = Math.max(...chart.values);
  if (minimum === maximum) {
    return [{ minimum, maximum, count: chart.values.length }];
  }
  const count =
    chart.bins ?? Math.max(1, Math.ceil(Math.sqrt(chart.values.length)));
  const size = (maximum - minimum) / count;
  const bins = Array.from({ length: count }, (_, index) => ({
    minimum: minimum + index * size,
    maximum: index === count - 1 ? maximum : minimum + (index + 1) * size,
    count: 0,
  }));
  for (const value of chart.values) {
    const index = Math.min(count - 1, Math.floor((value - minimum) / size));
    const bin = bins[index];
    if (bin !== undefined) bin.count += 1;
  }
  return bins;
}

function describe(chart: HistogramChart, bins: readonly Bin[]): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Histogram";
  if (chart.values.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.values.length} values across ${bins.length} bins; range ${formatValue(Math.min(...chart.values))} to ${formatValue(Math.max(...chart.values))}.`;
}

export function layoutHistogram(
  chart: HistogramChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const palette = getPalette(options.charset ?? "unicode");
  const bins = makeBins(chart);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 4) {
    throw new RangeError(
      `layout height ${height} is too short; histograms require at least ${titleRows + 5} rows.`,
    );
  }
  const maxCount = Math.max(0, ...bins.map(({ count }) => count));
  const yLabelWidth = measureText(String(maxCount));
  const plotX = yLabelWidth + 2;
  const plotWidth = width - plotX;
  if (bins.length > plotWidth) {
    throw new RangeError(
      `layout width ${width} is too narrow for ${bins.length} bins.`,
    );
  }

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
  grid.text(0, plotTop, String(maxCount), "value", { foreground: "muted" });
  grid.text(0, plotBottom, "0", "value", { foreground: "muted" });
  for (let x = plotX - 1; x < width; x += 1) {
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  }

  if (bins.length === 0) {
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  } else {
    const stride = Math.max(1, Math.floor(plotWidth / bins.length));
    const cellWidth = stride === 1 ? 1 : stride - 1;
    bins.forEach((bin, index) => {
      const barHeight =
        maxCount === 0
          ? 0
          : Math.max(1, Math.round((bin.count / maxCount) * (plotHeight - 1)));
      const x = plotX + index * stride;
      for (let y = plotBottom - barHeight; y < plotBottom; y += 1) {
        for (let offset = 0; offset < cellWidth; offset += 1) {
          grid.set(x + offset, y, palette.fill, "series", {
            foreground: "series1",
          });
        }
      }
    });
    const minimumLabel = formatValue(bins[0]?.minimum ?? 0);
    const maximumLabel = formatValue(bins.at(-1)?.maximum ?? 0);
    grid.text(plotX, height - 1, minimumLabel, "label", {
      foreground: "muted",
    });
    grid.text(
      width - measureText(maximumLabel),
      height - 1,
      maximumLabel,
      "label",
      {
        foreground: "muted",
      },
    );
  }

  return grid.build(describe(chart, bins), {
    caption: chart.title ?? "Histogram",
    columns: [
      { key: "range", label: "Range" },
      { key: "count", label: "Count" },
    ],
    rows: bins.map((bin) => ({
      range: `${formatValue(bin.minimum)}–${formatValue(bin.maximum)}`,
      count: bin.count,
    })),
  });
}
