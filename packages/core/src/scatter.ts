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
  CharacterSet,
  LayoutOptions,
  ScatterChart,
  ScatterChartInput,
  ScatterDatum,
  ScatterDatumInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;

const scatterGlyphs: Record<
  CharacterSet,
  { point: string; collision: string; corner: string }
> = {
  ascii: { point: "*", collision: "#", corner: "+" },
  unicode: { point: "●", collision: "◆", corner: "└" },
};

function normalizeDatum(datum: ScatterDatumInput, index: number): ScatterDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be a scatter point object.`);
  }
  validateFiniteNumber(datum.x, `data[${index}].x`);
  validateFiniteNumber(datum.y, `data[${index}].y`);
  if (datum.label !== undefined) {
    validateText(datum.label, `data[${index}].label`);
  }
  return Object.freeze({
    x: datum.x,
    y: datum.y,
    ...(datum.label !== undefined ? { label: datum.label } : {}),
  });
}

function validateDomain(
  minimum: number | undefined,
  maximum: number | undefined,
  minimumName: string,
  maximumName: string,
): void {
  if (minimum !== undefined) validateFiniteNumber(minimum, minimumName);
  if (maximum !== undefined) validateFiniteNumber(maximum, maximumName);
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw new RangeError(
      `${minimumName} cannot be greater than ${maximumName}.`,
    );
  }
}

export function scatter(input: ScatterChartInput): ScatterChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("scatter input must be an object.");
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
  validateDomain(input.xMin, input.xMax, "xMin", "xMax");
  validateDomain(input.yMin, input.yMax, "yMin", "yMax");

  return Object.freeze({
    type: "scatter",
    data: Object.freeze(input.data.map(normalizeDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.xMin !== undefined ? { xMin: input.xMin } : {}),
    ...(input.xMax !== undefined ? { xMax: input.xMax } : {}),
    ...(input.yMin !== undefined ? { yMin: input.yMin } : {}),
    ...(input.yMax !== undefined ? { yMax: input.yMax } : {}),
  });
}

function resolveDomain(
  explicitMinimum: number | undefined,
  explicitMaximum: number | undefined,
  values: readonly number[],
  axis: "x" | "y",
): readonly [number, number] {
  const minimum =
    explicitMinimum ?? (values.length === 0 ? 0 : Math.min(...values));
  const maximum =
    explicitMaximum ?? (values.length === 0 ? 1 : Math.max(...values));
  if (minimum > maximum) {
    throw new RangeError(`resolved ${axis} minimum cannot exceed maximum.`);
  }
  return [minimum, maximum];
}

function describe(
  chart: ScatterChart,
  xMinimum: number,
  xMaximum: number,
  yMinimum: number,
  yMaximum: number,
): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Scatter plot";
  if (chart.data.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.data.length} points; x range ${formatValue(xMinimum)} to ${formatValue(xMaximum)}; y range ${formatValue(yMinimum)} to ${formatValue(yMaximum)}.`;
}

function position(
  value: number,
  minimum: number,
  maximum: number,
  extent: number,
): number {
  if (maximum === minimum) return Math.floor(extent / 2);
  const ratio = Math.max(
    0,
    Math.min(1, (value - minimum) / (maximum - minimum)),
  );
  return Math.round(ratio * extent);
}

export function layoutScatter(
  chart: ScatterChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const glyphs = scatterGlyphs[charset];
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 4) {
    throw new RangeError(
      `layout height ${height} is too short; scatter plots require at least ${titleRows + 5} rows.`,
    );
  }

  const [xMinimum, xMaximum] = resolveDomain(
    chart.xMin,
    chart.xMax,
    chart.data.map(({ x }) => x),
    "x",
  );
  const [yMinimum, yMaximum] = resolveDomain(
    chart.yMin,
    chart.yMax,
    chart.data.map(({ y }) => y),
    "y",
  );
  const yLabelWidth = Math.max(
    measureText(formatValue(yMinimum)),
    measureText(formatValue(yMaximum)),
  );
  const plotX = yLabelWidth + 2;
  const plotWidth = width - plotX;
  if (plotWidth < 3) {
    throw new RangeError(
      `layout width ${width} is too narrow for a scatter plot.`,
    );
  }

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

  const plotTop = titleRows;
  const plotBottom = plotTop + plotHeight - 1;
  const axisX = plotX - 1;
  grid.text(0, plotTop, formatValue(yMaximum), "value", {
    foreground: "muted",
  });
  grid.text(0, plotBottom, formatValue(yMinimum), "value", {
    foreground: "muted",
  });
  for (let y = plotTop; y < plotBottom; y += 1) {
    grid.set(axisX, y, palette.baseline, "axis", { foreground: "muted" });
  }
  grid.set(axisX, plotBottom, glyphs.corner, "axis", {
    foreground: "muted",
  });
  for (let x = plotX; x < width; x += 1) {
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  }

  chart.data.forEach((datum, index) => {
    const x = plotX + position(datum.x, xMinimum, xMaximum, plotWidth - 1);
    const y =
      plotBottom - 1 - position(datum.y, yMinimum, yMaximum, plotHeight - 2);
    const existing = grid.rows[y]?.[x];
    const collision = existing?.role === "series";
    grid.set(
      x,
      y,
      collision ? glyphs.collision : glyphs.point,
      "series",
      { foreground: collision ? "accent" : "series1", bold: true },
      {
        label: datum.label ?? String(index),
        value: datum.y,
      },
    );
  });

  const xLabelY = height - 1;
  const minimumLabel = formatValue(xMinimum);
  const maximumLabel = formatValue(xMaximum);
  grid.text(plotX, xLabelY, minimumLabel, "label", { foreground: "muted" });
  grid.text(width - measureText(maximumLabel), xLabelY, maximumLabel, "label", {
    foreground: "muted",
  });
  if (chart.data.length === 0) {
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  }

  return grid.build(describe(chart, xMinimum, xMaximum, yMinimum, yMaximum), {
    caption: chart.title ?? "Scatter plot",
    columns: [
      { key: "label", label: "Label" },
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
    ],
    rows: chart.data.map((datum, index) => ({
      label: datum.label ?? String(index),
      x: datum.x,
      y: datum.y,
    })),
  });
}
