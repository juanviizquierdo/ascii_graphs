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
  AdjacencyMatrixChart,
  AdjacencyMatrixChartInput,
  ArcDiagramChart,
  ArcDiagramChartInput,
  BarcodeChart,
  BarcodeChartInput,
  BumpChart,
  BumpChartInput,
  BurnChart,
  BurnChartInput,
  CalibrationChart,
  CalibrationChartInput,
  CellGrid,
  ChartBase,
  ContourChart,
  ContourChartInput,
  CreativeEdge,
  CreativePoint,
  CreativeSeries,
  CumulativeFlowChart,
  CumulativeFlowChartInput,
  DotDensityMapChart,
  DotDensityMapChartInput,
  ErrorBudgetChart,
  ErrorBudgetChartInput,
  EventDatum,
  FanChart,
  FanChartInput,
  HexTileDatum,
  HexTileMapChart,
  HexTileMapChartInput,
  LayoutOptions,
  MarketProfileChart,
  MarketProfileChartInput,
  MigrationFlowChart,
  MigrationFlowChartInput,
  OrderBookChart,
  OrderBookChartInput,
  PointFigureChart,
  PointFigureChartInput,
  PolarAreaChart,
  PolarAreaChartInput,
  PriceLevel,
  ProbabilitySeries,
  RaincloudChart,
  RaincloudChartInput,
  RegionValue,
  RocChart,
  RocChartInput,
  Route,
  SpiralTimelineChart,
  SpiralTimelineChartInput,
  SurvivalChart,
  SurvivalChartInput,
  TernaryChart,
  TernaryChartInput,
  TernaryDatum,
  UpSetChart,
  UpSetChartInput,
  WindRoseChart,
  WindRoseChartInput,
  WindRoseDatum,
  WorldChoroplethChart,
  WorldChoroplethChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 18;

function validateBase(input: ChartBase): void {
  if (typeof input !== "object" || input === null)
    throw new TypeError("chart input must be an object.");
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
}

function base(input: ChartBase) {
  validateBase(input);
  return {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ...(input.width === undefined ? {} : { width: input.width }),
    ...(input.height === undefined ? {} : { height: input.height }),
  };
}

function numbers(values: readonly number[], name: string): readonly number[] {
  if (!Array.isArray(values)) throw new TypeError(`${name} must be an array.`);
  validateDataLength(values.length, name);
  values.forEach((value, index) =>
    validateFiniteNumber(value, `${name}[${index}]`),
  );
  return Object.freeze([...values]);
}

function labels(values: readonly string[], name = "labels"): readonly string[] {
  if (!Array.isArray(values)) throw new TypeError(`${name} must be an array.`);
  validateDataLength(values.length, name);
  values.forEach((value, index) => validateText(value, `${name}[${index}]`));
  return Object.freeze([...values]);
}

function series(
  values: readonly { label: string; values: readonly number[] }[],
): readonly CreativeSeries[] {
  if (!Array.isArray(values)) throw new TypeError("series must be an array.");
  validateDataLength(values.length, "series");
  return Object.freeze(
    values.map((item, index) => {
      validateText(item.label, `series[${index}].label`);
      return Object.freeze({
        label: item.label,
        values: numbers(item.values, `series[${index}].values`),
      });
    }),
  );
}

function viewport(chart: ChartBase, options: LayoutOptions) {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  return {
    width,
    height,
    charset: options.charset ?? "unicode",
    palette: getPalette(options.charset ?? "unicode"),
  };
}

function title(grid: GridBuilder, chart: ChartBase, ellipsis: string): number {
  if (chart.title === undefined) return 0;
  grid.text(0, 0, truncateText(chart.title, grid.width, ellipsis), "title", {
    foreground: "accent",
    bold: true,
  });
  return 2;
}

function drawLine(
  grid: GridBuilder,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  glyph: string,
  seriesIndex = 0,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(x0 + ((x1 - x0) * step) / steps);
    const y = Math.round(y0 + ((y1 - y0) * step) / steps);
    grid.set(x, y, glyph, "series", {
      foreground: `series${(seriesIndex % 4) + 1}` as "series1",
    });
  }
}

function chartTable(
  grid: GridBuilder,
  chart: ChartBase,
  fallback: string,
  columns: { key: string; label: string }[],
  rows: Record<string, string | number | null>[],
): CellGrid {
  const heading = chart.title ?? fallback;
  return grid.build(chart.description ?? `${heading}.`, {
    caption: heading,
    columns,
    rows,
  });
}

export function bump(input: BumpChartInput): BumpChart {
  const chartLabels = labels(input.labels);
  const chartSeries = series(input.series);
  chartSeries.forEach((item, index) => {
    if (item.values.length !== chartLabels.length)
      throw new RangeError(`series[${index}].values must match labels.`);
  });
  return Object.freeze({
    type: "bump",
    labels: chartLabels,
    series: chartSeries,
    ...base(input),
  });
}

export function layoutBump(
  chart: BumpChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 5;
  const bottom = height - 2;
  const plotWidth = Math.max(1, width - left - 2);
  const plotHeight = Math.max(1, bottom - top);
  const rankAt = chart.labels.map((_, point) =>
    chart.series
      .map((item, index) => ({ index, value: item.values[point] ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .reduce<number[]>((ranks, item, rank) => {
        ranks[item.index] = rank;
        return ranks;
      }, []),
  );
  chart.series.forEach((item, seriesIndex) => {
    for (let point = 0; point < chart.labels.length; point += 1) {
      const x =
        left +
        Math.round((point / Math.max(1, chart.labels.length - 1)) * plotWidth);
      const rank = rankAt[point]?.[seriesIndex] ?? 0;
      const y =
        top +
        Math.round((rank / Math.max(1, chart.series.length - 1)) * plotHeight);
      if (point > 0) {
        const previousRank = rankAt[point - 1]?.[seriesIndex] ?? 0;
        const previousX =
          left +
          Math.round(
            ((point - 1) / Math.max(1, chart.labels.length - 1)) * plotWidth,
          );
        const previousY =
          top +
          Math.round(
            (previousRank / Math.max(1, chart.series.length - 1)) * plotHeight,
          );
        drawLine(
          grid,
          previousX,
          previousY,
          x,
          y,
          charset === "ascii" ? "-" : "─",
          seriesIndex,
        );
      }
      grid.set(x, y, String((seriesIndex + 1) % 10), "value", {
        foreground: `series${(seriesIndex % 4) + 1}` as "series1",
        bold: true,
      });
    }
  });
  chart.series
    .slice(0, 9)
    .forEach((item, index) =>
      grid.text(
        0,
        top + index,
        `${index + 1} ${truncateText(item.label, left - 2, palette.ellipsis)}`,
        "label",
      ),
    );
  return chartTable(
    grid,
    chart,
    "Bump chart",
    [
      { key: "series", label: "Series" },
      { key: "period", label: "Period" },
      { key: "value", label: "Value" },
    ],
    chart.series.flatMap((item) =>
      item.values.map((value, index) => ({
        series: item.label,
        period: chart.labels[index] ?? String(index + 1),
        value,
      })),
    ),
  );
}

export function fan(input: FanChartInput): FanChart {
  const chartLabels = labels(input.labels);
  const median = numbers(input.median, "median");
  const lower = numbers(input.lower, "lower");
  const upper = numbers(input.upper, "upper");
  if (
    [median, lower, upper].some(
      (values) => values.length !== chartLabels.length,
    )
  )
    throw new RangeError("median, lower, and upper must match labels.");
  lower.forEach((value, index) => {
    if (
      value > (median[index] ?? value) ||
      (median[index] ?? value) > (upper[index] ?? value)
    )
      throw new RangeError(`fan bounds are invalid at index ${index}.`);
  });
  return Object.freeze({
    type: "fan",
    labels: chartLabels,
    median,
    lower,
    upper,
    ...base(input),
  });
}

export function layoutFan(
  chart: FanChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 7;
  const bottom = height - 2;
  const minimum = Math.min(...chart.lower);
  const maximum = Math.max(...chart.upper);
  const span = Math.max(1e-9, maximum - minimum);
  const px = (i: number) =>
    left +
    Math.round((i / Math.max(1, chart.labels.length - 1)) * (width - left - 2));
  const py = (v: number) =>
    bottom - Math.round(((v - minimum) / span) * Math.max(1, bottom - top));
  chart.labels.forEach((_, index) => {
    const x = px(index);
    for (
      let y = py(chart.upper[index] ?? 0);
      y <= py(chart.lower[index] ?? 0);
      y += 1
    )
      grid.set(x, y, charset === "ascii" ? "." : "░", "series", {
        foreground: "series2",
      });
    if (index > 0)
      drawLine(
        grid,
        px(index - 1),
        py(chart.median[index - 1] ?? 0),
        x,
        py(chart.median[index] ?? 0),
        charset === "ascii" ? "*" : "●",
      );
  });
  grid.text(0, top, formatValue(maximum), "label");
  grid.text(0, bottom, formatValue(minimum), "label");
  return chartTable(
    grid,
    chart,
    "Fan chart",
    [
      { key: "period", label: "Period" },
      { key: "lower", label: "Lower" },
      { key: "median", label: "Median" },
      { key: "upper", label: "Upper" },
    ],
    chart.labels.map((period, i) => ({
      period,
      lower: chart.lower[i] ?? 0,
      median: chart.median[i] ?? 0,
      upper: chart.upper[i] ?? 0,
    })),
  );
}

export function raincloud(input: RaincloudChartInput): RaincloudChart {
  return Object.freeze({
    type: "raincloud",
    series: series(input.series),
    ...base(input),
  });
}

export function layoutRaincloud(
  chart: RaincloudChart,
  options: LayoutOptions = {},
): CellGrid {
  const naturalHeight =
    (chart.title === undefined ? 0 : 2) + chart.series.length * 3 + 2;
  const { width, height, charset, palette } = viewport(
    { ...chart, height: chart.height ?? naturalHeight },
    options,
  );
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = Math.min(
    14,
    Math.max(5, ...chart.series.map((item) => measureText(item.label) + 1)),
  );
  const values = chart.series.flatMap((item) => item.values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-9, max - min);
  const plot = width - left - 1;
  chart.series.forEach((item, row) => {
    const y = top + row * 3;
    grid.text(
      0,
      y + 1,
      truncateText(item.label, left - 1, palette.ellipsis),
      "label",
    );
    const bins = Array.from({ length: plot }, () => 0);
    item.values.forEach((value) => {
      const bin = Math.round(((value - min) / span) * Math.max(0, plot - 1));
      bins[bin] = (bins[bin] ?? 0) + 1;
    });
    const peak = Math.max(1, ...bins);
    bins.forEach((count, x) => {
      if (count > 0)
        grid.set(
          left + x,
          y,
          charset === "ascii" ? "~" : count / peak > 0.5 ? "▄" : "▂",
          "series",
          { foreground: `series${(row % 4) + 1}` as "series1" },
        );
    });
    item.values.forEach((value, index) =>
      grid.set(
        left + Math.round(((value - min) / span) * Math.max(0, plot - 1)),
        y + 2,
        charset === "ascii" ? "." : index % 2 === 0 ? "•" : "·",
        "value",
      ),
    );
  });
  return chartTable(
    grid,
    chart,
    "Raincloud plot",
    [
      { key: "series", label: "Series" },
      { key: "value", label: "Value" },
    ],
    chart.series.flatMap((item) =>
      item.values.map((value) => ({ series: item.label, value })),
    ),
  );
}

export function upset(input: UpSetChartInput): UpSetChart {
  const sets = labels(input.sets, "sets");
  if (!Array.isArray(input.intersections))
    throw new TypeError("intersections must be an array.");
  validateDataLength(input.intersections.length, "intersections");
  const intersections = Object.freeze(
    input.intersections.map((item, index) => {
      const selected = labels(item.sets, `intersections[${index}].sets`);
      selected.forEach((name) => {
        if (!sets.includes(name)) throw new RangeError(`unknown set ${name}.`);
      });
      validateFiniteNumber(item.value, `intersections[${index}].value`);
      return Object.freeze({ sets: selected, value: item.value });
    }),
  );
  return Object.freeze({ type: "upset", sets, intersections, ...base(input) });
}

export function layoutUpSet(
  chart: UpSetChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = Math.min(15, Math.max(...chart.sets.map(measureText)) + 2);
  const columns = Math.min(
    chart.intersections.length,
    Math.max(1, Math.floor((width - left) / 3)),
  );
  const max = Math.max(1, ...chart.intersections.map((item) => item.value));
  const barRows = Math.max(2, height - top - chart.sets.length - 2);
  chart.intersections.slice(0, columns).forEach((item, column) => {
    const x = left + column * 3;
    const barHeight = Math.round((item.value / max) * barRows);
    for (let y = 0; y < barHeight; y += 1)
      grid.set(
        x,
        top + barRows - y - 1,
        charset === "ascii" ? "#" : "█",
        "series",
      );
    const active = chart.sets.map((set) => item.sets.includes(set));
    const first = active.indexOf(true);
    const last = active.lastIndexOf(true);
    for (let row = 0; row < chart.sets.length; row += 1) {
      const y = top + barRows + row;
      if (row >= first && row <= last && first >= 0)
        grid.set(x, y, charset === "ascii" ? "|" : "│", "axis");
      grid.set(
        x,
        y,
        active[row]
          ? charset === "ascii"
            ? "O"
            : "●"
          : charset === "ascii"
            ? "."
            : "○",
        active[row] ? "value" : "missing",
      );
    }
  });
  chart.sets.forEach((set, row) =>
    grid.text(
      0,
      top + barRows + row,
      truncateText(set, left - 2, palette.ellipsis),
      "label",
    ),
  );
  return chartTable(
    grid,
    chart,
    "UpSet plot",
    [
      { key: "sets", label: "Intersection" },
      { key: "value", label: "Size" },
    ],
    chart.intersections.map((item) => ({
      sets: item.sets.join(" & "),
      value: item.value,
    })),
  );
}

export function pointFigure(input: PointFigureChartInput): PointFigureChart {
  const values = numbers(input.values, "values");
  const boxSize =
    input.boxSize ??
    Math.max(1e-9, (Math.max(...values) - Math.min(...values)) / 10);
  validateFiniteNumber(boxSize, "boxSize");
  if (boxSize <= 0) throw new RangeError("boxSize must be positive.");
  return Object.freeze({
    type: "point-figure",
    values,
    boxSize,
    ...base(input),
  });
}

export function layoutPointFigure(
  chart: PointFigureChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const low = Math.floor(Math.min(...chart.values) / chart.boxSize);
  const high = Math.ceil(Math.max(...chart.values) / chart.boxSize);
  const rows = Math.max(1, high - low);
  const columns: { direction: number; low: number; high: number }[] = [];
  chart.values.slice(1).forEach((value, i) => {
    const previous = chart.values[i] ?? value;
    const direction = Math.sign(value - previous);
    const box = Math.round(value / chart.boxSize);
    const current = columns.at(-1);
    if (
      direction !== 0 &&
      (current === undefined || current.direction !== direction)
    )
      columns.push({
        direction,
        low: Math.min(Math.round(previous / chart.boxSize), box),
        high: Math.max(Math.round(previous / chart.boxSize), box),
      });
    else if (current !== undefined) {
      current.low = Math.min(current.low, box);
      current.high = Math.max(current.high, box);
    }
  });
  columns.slice(0, width - 7).forEach((column, x) => {
    for (let box = column.low; box <= column.high; box += 1) {
      const y =
        top + Math.round(((high - box) / rows) * Math.max(1, height - top - 2));
      grid.set(
        6 + x,
        y,
        column.direction > 0 ? "X" : charset === "ascii" ? "O" : "○",
        column.direction > 0 ? "positive" : "negative",
      );
    }
  });
  grid.text(0, top, formatValue(high * chart.boxSize), "label");
  grid.text(0, height - 2, formatValue(low * chart.boxSize), "label");
  return chartTable(
    grid,
    chart,
    "Point-and-figure chart",
    [
      { key: "index", label: "Index" },
      { key: "value", label: "Value" },
    ],
    chart.values.map((value, index) => ({ index: index + 1, value })),
  );
}

function radialData(
  input: WindRoseChartInput | PolarAreaChartInput,
): readonly WindRoseDatum[] {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  return Object.freeze(
    input.data.map((item, index) => {
      validateText(item.label, `data[${index}].label`);
      validateFiniteNumber(item.value, `data[${index}].value`);
      if (item.value < 0)
        throw new RangeError("radial values cannot be negative.");
      return Object.freeze({ label: item.label, value: item.value });
    }),
  );
}
export function windRose(input: WindRoseChartInput): WindRoseChart {
  return Object.freeze({
    type: "wind-rose",
    data: radialData(input),
    ...base(input),
  });
}
export function polarArea(input: PolarAreaChartInput): PolarAreaChart {
  return Object.freeze({
    type: "polar-area",
    data: radialData(input),
    ...base(input),
  });
}

function layoutRadial(
  chart: WindRoseChart | PolarAreaChart,
  options: LayoutOptions,
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const cx = Math.floor(width / 2);
  const cy = Math.floor((top + height - 1) / 2);
  const radius = Math.max(
    2,
    Math.min(Math.floor(width / 3), Math.floor((height - top - 2) / 2)),
  );
  const max = Math.max(1, ...chart.data.map((item) => item.value));
  chart.data.forEach((item, index) => {
    const angle = -Math.PI / 2 + (index / chart.data.length) * Math.PI * 2;
    const length = Math.max(
      1,
      Math.round(Math.sqrt(item.value / max) * radius),
    );
    const endX = cx + Math.round(Math.cos(angle) * length * 1.8);
    const endY = cy + Math.round(Math.sin(angle) * length);
    drawLine(
      grid,
      cx,
      cy,
      endX,
      endY,
      chart.type === "wind-rose"
        ? charset === "ascii"
          ? "*"
          : "◆"
        : charset === "ascii"
          ? "#"
          : "█",
      index,
    );
    const lx = cx + Math.round(Math.cos(angle) * (radius * 1.8 + 2));
    const ly = cy + Math.round(Math.sin(angle) * (radius + 1));
    grid.text(
      Math.max(0, Math.min(width - measureText(item.label), lx)),
      ly,
      item.label,
      "label",
    );
  });
  grid.set(cx, cy, charset === "ascii" ? "+" : "◎", "axis");
  return chartTable(
    grid,
    chart,
    chart.type === "wind-rose" ? "Wind rose" : "Polar area chart",
    [
      { key: "category", label: "Category" },
      { key: "value", label: "Value" },
    ],
    chart.data.map((item) => ({ category: item.label, value: item.value })),
  );
}
export const layoutWindRose = (
  chart: WindRoseChart,
  options: LayoutOptions = {},
) => layoutRadial(chart, options);
export const layoutPolarArea = (
  chart: PolarAreaChart,
  options: LayoutOptions = {},
) => layoutRadial(chart, options);

export function ternary(input: TernaryChartInput): TernaryChart {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly TernaryDatum[] = Object.freeze(
    input.data.map((item, i) => {
      [item.a, item.b, item.c].forEach((v, j) => {
        validateFiniteNumber(v, `data[${i}][${j}]`);
        if (v < 0)
          throw new RangeError("ternary components cannot be negative.");
      });
      if (item.a + item.b + item.c <= 0)
        throw new RangeError("ternary components must have a positive sum.");
      if (item.label !== undefined)
        validateText(item.label, `data[${i}].label`);
      return Object.freeze({ ...item });
    }),
  );
  const axisLabels = input.labels ?? (["A", "B", "C"] as const);
  axisLabels.forEach((v, i) => validateText(v, `labels[${i}]`));
  return Object.freeze({
    type: "ternary",
    labels: Object.freeze([...axisLabels]) as readonly [string, string, string],
    data,
    ...base(input),
  });
}

export function layoutTernary(
  chart: TernaryChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 5;
  const right = width - 5;
  const bottom = height - 2;
  const apex = Math.floor((left + right) / 2);
  drawLine(grid, left, bottom, right, bottom, charset === "ascii" ? "-" : "─");
  drawLine(grid, left, bottom, apex, top, charset === "ascii" ? "/" : "╱");
  drawLine(grid, right, bottom, apex, top, charset === "ascii" ? "\\" : "╲");
  grid.text(
    Math.max(0, apex - measureText(chart.labels[0]) / 2),
    top,
    chart.labels[0],
    "label",
  );
  grid.text(0, bottom, chart.labels[1], "label");
  grid.text(right + 1, bottom, chart.labels[2], "label");
  chart.data.forEach((item, index) => {
    const sum = item.a + item.b + item.c;
    const x = Math.round(
      (item.a * apex + item.b * left + item.c * right) / sum,
    );
    const y = Math.round((item.a * top + (item.b + item.c) * bottom) / sum);
    grid.set(x, y, String((index + 1) % 10), "value", {
      foreground: `series${(index % 4) + 1}` as "series1",
      bold: true,
    });
  });
  return chartTable(
    grid,
    chart,
    "Ternary plot",
    [
      { key: "label", label: "Point" },
      { key: "a", label: chart.labels[0] },
      { key: "b", label: chart.labels[1] },
      { key: "c", label: chart.labels[2] },
    ],
    chart.data.map((item, i) => ({
      label: item.label ?? String(i + 1),
      a: item.a,
      b: item.b,
      c: item.c,
    })),
  );
}

export function contour(input: ContourChartInput): ContourChart {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly CreativePoint[] = Object.freeze(
    input.data.map((item, i) => {
      validateFiniteNumber(item.x, `data[${i}].x`);
      validateFiniteNumber(item.y, `data[${i}].y`);
      if (item.value === undefined)
        throw new TypeError(`data[${i}].value is required.`);
      validateFiniteNumber(item.value, `data[${i}].value`);
      return Object.freeze({ ...item });
    }),
  );
  return Object.freeze({ type: "contour", data, ...base(input) });
}

export function layoutContour(
  chart: ContourChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const xs = chart.data.map((p) => p.x);
  const ys = chart.data.map((p) => p.y);
  const values = chart.data.map((p) => p.value ?? 0);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    minV = Math.min(...values),
    maxV = Math.max(...values);
  const fieldValue = (x: number, y: number) => {
    let weighted = 0,
      weights = 0;
    for (const point of chart.data) {
      const nx = (point.x - x) / Math.max(1e-9, maxX - minX);
      const ny = (point.y - y) / Math.max(1e-9, maxY - minY);
      const distanceSquared = nx * nx + ny * ny;
      if (distanceSquared < 1e-10) return point.value ?? 0;
      const weight = 1 / distanceSquared;
      weighted += (point.value ?? 0) * weight;
      weights += weight;
    }
    return weighted / Math.max(1e-9, weights);
  };
  for (let y = top; y < height - 1; y += 1)
    for (let x = 5; x < width; x += 1) {
      const dx = minX + ((x - 5) / Math.max(1, width - 6)) * (maxX - minX);
      const dy =
        maxY - ((y - top) / Math.max(1, height - top - 2)) * (maxY - minY);
      const interpolated = fieldValue(dx, dy);
      const level = Math.round(
        ((interpolated - minV) / Math.max(1e-9, maxV - minV)) *
          (palette.density.length - 1),
      );
      grid.set(x, y, palette.density[level] ?? ".", "series", {
        foreground: `series${(level % 4) + 1}` as "series1",
      });
    }
  chart.data.forEach((point) => {
    const x =
      5 +
      Math.round(
        ((point.x - minX) / Math.max(1e-9, maxX - minX)) * (width - 6),
      );
    const y =
      top +
      Math.round(
        ((maxY - point.y) / Math.max(1e-9, maxY - minY)) * (height - top - 2),
      );
    grid.set(x, y, charset === "ascii" ? "o" : "○", "value", {
      foreground: "accent",
      bold: true,
    });
  });
  grid.text(0, top, formatValue(maxY), "label");
  grid.text(0, height - 2, formatValue(minY), "label");
  return chartTable(
    grid,
    chart,
    "Contour plot",
    [
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
      { key: "value", label: "Value" },
    ],
    chart.data.map((p) => ({ x: p.x, y: p.y, value: p.value ?? 0 })),
  );
}

export function adjacencyMatrix(
  input: AdjacencyMatrixChartInput,
): AdjacencyMatrixChart {
  const chartLabels = labels(input.labels);
  if (
    !Array.isArray(input.values) ||
    input.values.length !== chartLabels.length
  )
    throw new RangeError("values must be a square matrix matching labels.");
  const values = Object.freeze(
    input.values.map((row, i) => {
      const result = numbers(row, `values[${i}]`);
      if (result.length !== chartLabels.length)
        throw new RangeError("values must be a square matrix matching labels.");
      return result;
    }),
  );
  return Object.freeze({
    type: "adjacency-matrix",
    labels: chartLabels,
    values,
    ...base(input),
  });
}

export function layoutAdjacencyMatrix(
  chart: AdjacencyMatrixChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const labelWidth = Math.min(
    14,
    Math.max(...chart.labels.map(measureText)) + 1,
  );
  const size = Math.min(
    chart.labels.length,
    height - top,
    Math.floor((width - labelWidth) / 2),
  );
  const max = Math.max(1, ...chart.values.flat());
  chart.labels.slice(0, size).forEach((label, row) => {
    grid.text(
      0,
      top + row,
      truncateText(label, labelWidth - 1, palette.ellipsis),
      "label",
    );
    chart.values[row]?.slice(0, size).forEach((value, column) => {
      const level = Math.round((value / max) * (palette.density.length - 1));
      grid.text(
        labelWidth + column * 2,
        top + row,
        palette.density[level] ?? ".",
        "series",
        { foreground: `series${(column % 4) + 1}` as "series1" },
        { label: `${label} → ${chart.labels[column]}`, value },
      );
    });
  });
  return chartTable(
    grid,
    chart,
    "Adjacency matrix",
    [
      { key: "from", label: "From" },
      { key: "to", label: "To" },
      { key: "value", label: "Value" },
    ],
    chart.values.flatMap((row, i) =>
      row.map((value, j) => ({
        from: chart.labels[i] ?? i,
        to: chart.labels[j] ?? j,
        value,
      })),
    ),
  );
}

export function arcDiagram(input: ArcDiagramChartInput): ArcDiagramChart {
  const chartLabels = labels(input.labels);
  if (!Array.isArray(input.edges))
    throw new TypeError("edges must be an array.");
  validateDataLength(input.edges.length, "edges");
  const edges: readonly CreativeEdge[] = Object.freeze(
    input.edges.map((edge, i) => {
      if (
        !Number.isInteger(edge.from) ||
        !Number.isInteger(edge.to) ||
        edge.from < 0 ||
        edge.to < 0 ||
        edge.from >= chartLabels.length ||
        edge.to >= chartLabels.length
      )
        throw new RangeError(`edges[${i}] has an invalid endpoint.`);
      const value = edge.value ?? 1;
      validateFiniteNumber(value, `edges[${i}].value`);
      return Object.freeze({ from: edge.from, to: edge.to, value });
    }),
  );
  return Object.freeze({
    type: "arc-diagram",
    labels: chartLabels,
    edges,
    ...base(input),
  });
}

export function layoutArcDiagram(
  chart: ArcDiagramChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const axisY = height - 4;
  const position = (i: number) =>
    2 + Math.round((i / Math.max(1, chart.labels.length - 1)) * (width - 5));
  chart.edges.forEach((edge, index) => {
    const from = position(edge.from),
      to = position(edge.to),
      center = (from + to) / 2,
      radius = Math.abs(to - from) / 2;
    const arcHeight = Math.min(
      axisY - top,
      Math.max(2, Math.round(radius / 3)),
    );
    for (let step = 0; step <= Math.max(2, Math.abs(to - from)); step += 1) {
      const t = step / Math.max(2, Math.abs(to - from));
      const x = Math.round(from + (to - from) * t);
      const y = Math.round(axisY - Math.sin(Math.PI * t) * arcHeight);
      grid.set(x, y, charset === "ascii" ? "." : "·", "series", {
        foreground: `series${(index % 4) + 1}` as "series1",
      });
    }
    void center;
  });
  chart.labels.forEach((label, i) => {
    const x = position(i);
    grid.set(x, axisY, charset === "ascii" ? "O" : "●", "value");
    grid.text(
      Math.max(0, x - Math.floor(measureText(label) / 2)),
      axisY + 2,
      truncateText(label, 8, palette.ellipsis),
      "label",
    );
  });
  return chartTable(
    grid,
    chart,
    "Arc diagram",
    [
      { key: "from", label: "From" },
      { key: "to", label: "To" },
      { key: "value", label: "Value" },
    ],
    chart.edges.map((edge) => ({
      from: chart.labels[edge.from] ?? edge.from,
      to: chart.labels[edge.to] ?? edge.to,
      value: edge.value,
    })),
  );
}

function probabilitySeries(
  values: readonly {
    label: string;
    points: readonly { x: number; probability: number }[];
  }[],
): readonly ProbabilitySeries[] {
  if (!Array.isArray(values)) throw new TypeError("series must be an array.");
  validateDataLength(values.length, "series");
  return Object.freeze(
    values.map((item, i) => {
      validateText(item.label, `series[${i}].label`);
      if (!Array.isArray(item.points))
        throw new TypeError(`series[${i}].points must be an array.`);
      validateDataLength(item.points.length, `series[${i}].points`);
      const points = item.points as readonly {
        x: number;
        probability: number;
      }[];
      return Object.freeze({
        label: item.label,
        points: Object.freeze(
          points.map((point, j) => {
            validateFiniteNumber(point.x, `series[${i}].points[${j}].x`);
            validateFiniteNumber(
              point.probability,
              `series[${i}].points[${j}].probability`,
            );
            if (point.probability < 0 || point.probability > 1)
              throw new RangeError("probability must be between 0 and 1.");
            return Object.freeze({ ...point });
          }),
        ),
      });
    }),
  );
}
export function survival(input: SurvivalChartInput): SurvivalChart {
  return Object.freeze({
    type: "survival",
    series: probabilitySeries(input.series),
    ...base(input),
  });
}
export function roc(input: RocChartInput): RocChart {
  return Object.freeze({
    type: "roc",
    mode: input.mode ?? "roc",
    series: probabilitySeries(input.series),
    ...base(input),
  });
}

function layoutProbability(
  chart: SurvivalChart | RocChart,
  options: LayoutOptions,
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 6,
    bottom = height - 2;
  const allX = chart.series.flatMap((s) => s.points.map((p) => p.x));
  const minX = chart.type === "roc" ? 0 : Math.min(...allX);
  const maxX = chart.type === "roc" ? 1 : Math.max(...allX);
  const px = (x: number) =>
    left +
    Math.round(((x - minX) / Math.max(1e-9, maxX - minX)) * (width - left - 2));
  const py = (p: number) => bottom - Math.round(p * Math.max(1, bottom - top));
  if (chart.type === "roc" && chart.mode === "roc")
    drawLine(
      grid,
      px(0),
      py(0),
      px(1),
      py(1),
      charset === "ascii" ? "." : "·",
      3,
    );
  chart.series.forEach((item, si) =>
    item.points.forEach((point, i) => {
      if (i > 0) {
        const prev = item.points[i - 1];
        if (prev) {
          if (chart.type === "survival") {
            drawLine(
              grid,
              px(prev.x),
              py(prev.probability),
              px(point.x),
              py(prev.probability),
              charset === "ascii" ? "-" : "─",
              si,
            );
            drawLine(
              grid,
              px(point.x),
              py(prev.probability),
              px(point.x),
              py(point.probability),
              charset === "ascii" ? "|" : "│",
              si,
            );
          } else
            drawLine(
              grid,
              px(prev.x),
              py(prev.probability),
              px(point.x),
              py(point.probability),
              charset === "ascii" ? "*" : "●",
              si,
            );
        }
      }
    }),
  );
  grid.text(0, top, "1.0", "label");
  grid.text(0, bottom, "0.0", "label");
  chart.series.forEach((item, i) =>
    grid.text(
      left + i * 14,
      height - 1,
      `${i + 1}:${truncateText(item.label, 10, palette.ellipsis)}`,
      "label",
    ),
  );
  return chartTable(
    grid,
    chart,
    chart.type === "survival"
      ? "Survival curve"
      : chart.mode === "roc"
        ? "ROC curve"
        : "Precision-recall curve",
    [
      { key: "series", label: "Series" },
      {
        key: "x",
        label:
          chart.type === "survival"
            ? "Time"
            : chart.mode === "roc"
              ? "False positive rate"
              : "Recall",
      },
      {
        key: "probability",
        label:
          chart.type === "survival"
            ? "Survival"
            : chart.mode === "roc"
              ? "True positive rate"
              : "Precision",
      },
    ],
    chart.series.flatMap((item) =>
      item.points.map((point) => ({
        series: item.label,
        x: point.x,
        probability: point.probability,
      })),
    ),
  );
}
export const layoutSurvival = (
  chart: SurvivalChart,
  options: LayoutOptions = {},
) => layoutProbability(chart, options);
export const layoutRoc = (chart: RocChart, options: LayoutOptions = {}) =>
  layoutProbability(chart, options);

export function calibration(input: CalibrationChartInput): CalibrationChart {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data = Object.freeze(
    input.data.map((item, i) => {
      validateFiniteNumber(item.predicted, `data[${i}].predicted`);
      validateFiniteNumber(item.observed, `data[${i}].observed`);
      if ([item.predicted, item.observed].some((v) => v < 0 || v > 1))
        throw new RangeError("calibration values must be between 0 and 1.");
      return Object.freeze({ ...item });
    }),
  );
  return Object.freeze({ type: "calibration", data, ...base(input) });
}

export function layoutCalibration(
  chart: CalibrationChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 6,
    bottom = height - 3,
    plotRight = width - 1;
  const px = (v: number) => left + Math.round(v * (width - left - 2));
  const py = (v: number) => bottom - Math.round(v * (bottom - top));
  drawLine(
    grid,
    px(0),
    py(0),
    px(1),
    py(1),
    charset === "ascii" ? "." : "·",
    3,
  );
  chart.data.forEach((item, i) => {
    if (i > 0) {
      const p = chart.data[i - 1];
      if (p)
        drawLine(
          grid,
          px(p.predicted),
          py(p.observed),
          px(item.predicted),
          py(item.observed),
          charset === "ascii" ? "*" : "●",
        );
    }
    grid.set(
      px(item.predicted),
      py(item.observed),
      String((i + 1) % 10),
      "value",
      { foreground: "series1", bold: true },
    );
  });
  grid.text(0, top, "1.0", "label");
  grid.text(0, bottom, "0.0", "label");
  return chartTable(
    grid,
    chart,
    "Calibration plot",
    [
      { key: "predicted", label: "Predicted" },
      { key: "observed", label: "Observed" },
    ],
    chart.data.map((item) => ({
      predicted: item.predicted,
      observed: item.observed,
    })),
  );
}

export function errorBudget(input: ErrorBudgetChartInput): ErrorBudgetChart {
  const chartLabels = labels(input.labels);
  const remaining = numbers(input.remaining, "remaining");
  if (remaining.length !== chartLabels.length)
    throw new RangeError("remaining must match labels.");
  remaining.forEach((v) => {
    if (v < 0 || v > 100)
      throw new RangeError("remaining must be between 0 and 100.");
  });
  return Object.freeze({
    type: "error-budget",
    labels: chartLabels,
    remaining,
    ...base(input),
  });
}

export function cumulativeFlow(
  input: CumulativeFlowChartInput,
): CumulativeFlowChart {
  const chartLabels = labels(input.labels);
  const stages = series(input.stages);
  stages.forEach((item) => {
    if (item.values.length !== chartLabels.length)
      throw new RangeError("stage values must match labels.");
    item.values.forEach((v) => {
      if (v < 0) throw new RangeError("stage values cannot be negative.");
    });
  });
  return Object.freeze({
    type: "cumulative-flow",
    labels: chartLabels,
    stages,
    ...base(input),
  });
}

export function burn(input: BurnChartInput): BurnChart {
  const chartLabels = labels(input.labels);
  const actual = numbers(input.actual, "actual");
  if (actual.length !== chartLabels.length)
    throw new RangeError("actual must match labels.");
  const ideal =
    input.ideal === undefined
      ? Object.freeze(
          actual.map((_, i) => {
            const start = actual[0] ?? 0;
            const end = input.mode === "up" ? (actual.at(-1) ?? start) : 0;
            return start + ((end - start) * i) / Math.max(1, actual.length - 1);
          }),
        )
      : numbers(input.ideal, "ideal");
  if (ideal.length !== chartLabels.length)
    throw new RangeError("ideal must match labels.");
  return Object.freeze({
    type: "burn",
    labels: chartLabels,
    actual,
    ideal,
    mode: input.mode ?? "down",
    ...base(input),
  });
}

function simpleLines(
  chart: ErrorBudgetChart | BurnChart,
  options: LayoutOptions,
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 7,
    bottom = height - 2;
  const values =
    chart.type === "error-budget"
      ? [chart.remaining]
      : [chart.actual, chart.ideal];
  const all = values.flat();
  const min = Math.min(0, ...all),
    max = Math.max(1, ...all),
    span = max - min;
  const count = chart.labels.length;
  const px = (i: number) =>
    left + Math.round((i / Math.max(1, count - 1)) * (width - left - 2));
  const py = (v: number) =>
    bottom - Math.round(((v - min) / span) * (bottom - top));
  values.forEach((line, si) =>
    line.forEach((v, i) => {
      if (i > 0)
        drawLine(
          grid,
          px(i - 1),
          py(line[i - 1] ?? v),
          px(i),
          py(v),
          si === 0
            ? charset === "ascii"
              ? "*"
              : "●"
            : charset === "ascii"
              ? "."
              : "·",
          si,
        );
    }),
  );
  grid.text(0, top, formatValue(max), "label");
  grid.text(0, bottom, formatValue(min), "label");
  return chartTable(
    grid,
    chart,
    chart.type === "error-budget"
      ? "SLO error budget"
      : chart.mode === "down"
        ? "Burndown chart"
        : "Burnup chart",
    [
      { key: "period", label: "Period" },
      {
        key: "actual",
        label: chart.type === "error-budget" ? "Remaining" : "Actual",
      },
      ...(chart.type === "burn" ? [{ key: "ideal", label: "Ideal" }] : []),
    ],
    chart.labels.map((period, i) => ({
      period,
      actual:
        chart.type === "error-budget"
          ? (chart.remaining[i] ?? 0)
          : (chart.actual[i] ?? 0),
      ...(chart.type === "burn" ? { ideal: chart.ideal[i] ?? 0 } : {}),
    })),
  );
}
export const layoutErrorBudget = (
  chart: ErrorBudgetChart,
  options: LayoutOptions = {},
) => simpleLines(chart, options);
export const layoutBurn = (chart: BurnChart, options: LayoutOptions = {}) =>
  simpleLines(chart, options);

export function layoutCumulativeFlow(
  chart: CumulativeFlowChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const left = 6,
    bottom = height - 3,
    plotRight = width - 1;
  const totals = chart.labels.map((_, i) =>
    chart.stages.reduce((sum, stage) => sum + (stage.values[i] ?? 0), 0),
  );
  const max = Math.max(1, ...totals);
  for (let x = left; x <= plotRight; x += 1) {
    const position =
      ((x - left) / Math.max(1, plotRight - left)) *
      Math.max(0, chart.labels.length - 1);
    const from = Math.floor(position);
    const to = Math.min(chart.labels.length - 1, from + 1);
    const mix = position - from;
    let cumulative = 0;
    chart.stages.forEach((stage, si) => {
      const startValue = stage.values[from] ?? 0;
      const endValue = stage.values[to] ?? startValue;
      const value = startValue + (endValue - startValue) * mix;
      const y0 = bottom - Math.round((cumulative / max) * (bottom - top));
      cumulative += value;
      const y1 = bottom - Math.round((cumulative / max) * (bottom - top));
      for (let y = y1; y < y0; y += 1)
        grid.set(
          x,
          y,
          charset === "ascii"
            ? String((si + 1) % 10)
            : (["░", "▒", "▓", "█"][si % 4] ?? "#"),
          "series",
          { foreground: `series${(si % 4) + 1}` as "series1" },
        );
    });
  }
  chart.labels.forEach((label, index) => {
    const x =
      left +
      Math.round(
        (index / Math.max(1, chart.labels.length - 1)) * (plotRight - left),
      );
    const text = truncateText(label, 7, palette.ellipsis);
    grid.text(
      Math.max(left, Math.min(width - measureText(text), x - 2)),
      height - 2,
      text,
      "label",
      { foreground: "muted" },
    );
  });
  chart.stages.forEach((stage, i) =>
    grid.text(
      Math.min(
        width - 1,
        left +
          i * Math.max(9, Math.floor((width - left) / chart.stages.length)),
      ),
      height - 1,
      `${i + 1}:${truncateText(stage.label, 7, palette.ellipsis)}`,
      "label",
    ),
  );
  return chartTable(
    grid,
    chart,
    "Cumulative flow diagram",
    [
      { key: "period", label: "Period" },
      { key: "stage", label: "Stage" },
      { key: "value", label: "Items" },
    ],
    chart.stages.flatMap((stage) =>
      stage.values.map((value, i) => ({
        period: chart.labels[i] ?? i,
        stage: stage.label,
        value,
      })),
    ),
  );
}

function priceLevels(
  values: readonly { price: number; value: number }[],
  name: string,
): readonly PriceLevel[] {
  if (!Array.isArray(values)) throw new TypeError(`${name} must be an array.`);
  validateDataLength(values.length, name);
  return Object.freeze(
    values.map((item, i) => {
      validateFiniteNumber(item.price, `${name}[${i}].price`);
      validateFiniteNumber(item.value, `${name}[${i}].value`);
      if (item.value < 0)
        throw new RangeError("level value cannot be negative.");
      return Object.freeze({ ...item });
    }),
  );
}
export function marketProfile(
  input: MarketProfileChartInput,
): MarketProfileChart {
  return Object.freeze({
    type: "market-profile",
    data: priceLevels(input.data, "data"),
    ...base(input),
  });
}
export function orderBook(input: OrderBookChartInput): OrderBookChart {
  return Object.freeze({
    type: "order-book",
    bids: priceLevels(input.bids, "bids"),
    asks: priceLevels(input.asks, "asks"),
    ...base(input),
  });
}

function layoutPrices(
  chart: MarketProfileChart | OrderBookChart,
  options: LayoutOptions,
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const center = chart.type === "order-book" ? Math.floor(width / 2) : 10;
  const rows =
    chart.type === "market-profile"
      ? chart.data
      : [...chart.asks].reverse().concat(chart.bids);
  const max = Math.max(1, ...rows.map((r) => r.value));
  rows.slice(0, height - top).forEach((row, i) => {
    const y = top + i;
    const length = Math.round(
      (row.value / max) *
        (chart.type === "order-book" ? center - 9 : width - center - 2),
    );
    if (chart.type === "market-profile") {
      grid.text(0, y, formatValue(row.price).padStart(8), "label");
      grid.text(
        center,
        y,
        (charset === "ascii" ? "#" : "█").repeat(length),
        "series",
      );
    } else {
      const isBid = chart.bids.includes(row);
      grid.text(center - 4, y, formatValue(row.price).padStart(8), "label");
      const start = isBid ? center - 5 - length : center + 5;
      grid.text(
        start,
        y,
        (charset === "ascii" ? (isBid ? "<" : ">") : isBid ? "◀" : "▶").repeat(
          length,
        ),
        isBid ? "positive" : "negative",
      );
    }
  });
  return chartTable(
    grid,
    chart,
    chart.type === "market-profile"
      ? "Market profile / TPO"
      : "Order-book depth",
    [
      { key: "side", label: "Side" },
      { key: "price", label: "Price" },
      { key: "value", label: "Volume" },
    ],
    chart.type === "market-profile"
      ? chart.data.map((r) => ({ side: "profile", ...r }))
      : [
          ...chart.bids.map((r) => ({ side: "bid", ...r })),
          ...chart.asks.map((r) => ({ side: "ask", ...r })),
        ],
  );
}
export const layoutMarketProfile = (
  chart: MarketProfileChart,
  options: LayoutOptions = {},
) => layoutPrices(chart, options);
export const layoutOrderBook = (
  chart: OrderBookChart,
  options: LayoutOptions = {},
) => layoutPrices(chart, options);

function events(
  values: readonly { position: number; label?: string; value?: number }[],
): readonly EventDatum[] {
  if (!Array.isArray(values)) throw new TypeError("events must be an array.");
  validateDataLength(values.length, "events");
  return Object.freeze(
    values.map((item, i) => {
      validateFiniteNumber(item.position, `events[${i}].position`);
      if (item.label !== undefined)
        validateText(item.label, `events[${i}].label`);
      const value = item.value ?? 1;
      validateFiniteNumber(value, `events[${i}].value`);
      return Object.freeze({
        position: item.position,
        ...(item.label === undefined ? {} : { label: item.label }),
        value,
      });
    }),
  );
}
export function barcode(input: BarcodeChartInput): BarcodeChart {
  return Object.freeze({
    type: "barcode",
    events: events(input.events),
    ...base(input),
  });
}
export function spiralTimeline(
  input: SpiralTimelineChartInput,
): SpiralTimelineChart {
  return Object.freeze({
    type: "spiral-timeline",
    events: events(input.events),
    ...base(input),
  });
}

export function layoutBarcode(
  chart: BarcodeChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const min = Math.min(...chart.events.map((e) => e.position)),
    max = Math.max(...chart.events.map((e) => e.position));
  chart.events.forEach((event, i) => {
    const x = Math.round(
      ((event.position - min) / Math.max(1e-9, max - min)) * (width - 1),
    );
    const h = Math.max(
      1,
      Math.round(
        (Math.abs(event.value) /
          Math.max(1, ...chart.events.map((e) => Math.abs(e.value)))) *
          (height - top - 3),
      ),
    );
    for (let y = height - 3; y > height - 3 - h; y -= 1)
      grid.set(x, y, charset === "ascii" ? "|" : "│", "series", {
        foreground: `series${(i % 4) + 1}` as "series1",
      });
  });
  grid.text(0, height - 1, formatValue(min), "label");
  const end = formatValue(max);
  grid.text(width - measureText(end), height - 1, end, "label");
  return chartTable(
    grid,
    chart,
    "Barcode / event plot",
    [
      { key: "position", label: "Position" },
      { key: "label", label: "Event" },
      { key: "value", label: "Value" },
    ],
    chart.events.map((e) => ({
      position: e.position,
      label: e.label ?? "",
      value: e.value,
    })),
  );
}

export function layoutSpiralTimeline(
  chart: SpiralTimelineChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const cx = Math.floor(width / 2),
    cy = Math.floor((top + height) / 2);
  const rx = Math.max(2, width / 2 - 4),
    ry = Math.max(2, (height - top) / 2 - 2);
  const sorted = [...chart.events].sort((a, b) => a.position - b.position);
  for (let step = 0; step < 240; step += 1) {
    const t = step / 239;
    const angle = t * Math.PI * 5;
    const x = Math.round(cx + Math.cos(angle) * rx * t);
    const y = Math.round(cy + Math.sin(angle) * ry * t);
    grid.set(x, y, charset === "ascii" ? "." : "·", "axis", {
      foreground: "muted",
    });
  }
  sorted.forEach((event, i) => {
    const t = i / Math.max(1, sorted.length - 1);
    const angle = t * Math.PI * 5;
    const x = Math.round(cx + Math.cos(angle) * rx * t),
      y = Math.round(cy + Math.sin(angle) * ry * t);
    grid.set(x, y, String((i + 1) % 10), "value", {
      foreground: `series${(i % 4) + 1}` as "series1",
      bold: true,
    });
  });
  return chartTable(
    grid,
    chart,
    "Spiral timeline",
    [
      { key: "position", label: "Position" },
      { key: "label", label: "Event" },
      { key: "value", label: "Value" },
    ],
    sorted.map((e) => ({
      position: e.position,
      label: e.label ?? "",
      value: e.value,
    })),
  );
}

const WORLD = [
  "      NNNNNN                 EEEEE AAAA       ",
  "   NNNNNNNNNNN              EEEEEAAAAAAA      ",
  " NNNNNNNNNNNNNN         EEEEEEEEAAAAAAAAAAA   ",
  "  NNNNNNNNNNNN           EEEEEAAAAAAAAAAAAA   ",
  "     NNNNN               FFFFFFFFFAAAAAAAA     ",
  "       SSSS             FFFFFFFFFFF AA         ",
  "       SSSSSS            FFFFFFFFF      OOO    ",
  "        SSSSS             FFFFFFF      OOOOO   ",
  "         SSSS              FFFF         OOO    ",
  "          SS                FF                 ",
];

export function worldChoropleth(
  input: WorldChoroplethChartInput,
): WorldChoroplethChart {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  const data: readonly RegionValue[] = Object.freeze(
    input.data.map((item, i) => {
      validateText(item.id, `data[${i}].id`);
      validateFiniteNumber(item.value, `data[${i}].value`);
      if (item.label !== undefined)
        validateText(item.label, `data[${i}].label`);
      return Object.freeze({ ...item, id: item.id.toUpperCase() });
    }),
  );
  return Object.freeze({ type: "world-choropleth", data, ...base(input) });
}

export function layoutWorldChoropleth(
  chart: WorldChoroplethChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const keys: Record<string, string> = {
    N: "NA",
    S: "SA",
    E: "EU",
    F: "AF",
    A: "AS",
    O: "OC",
  };
  const values = new Map(chart.data.map((item) => [item.id, item.value]));
  const min = Math.min(...chart.data.map((d) => d.value)),
    max = Math.max(...chart.data.map((d) => d.value));
  WORLD.slice(0, height - top - 3).forEach((row, y) =>
    [...row].slice(0, width).forEach((cell, x) => {
      if (cell === " ") return;
      const id = keys[cell] ?? cell;
      const value = values.get(id);
      const level =
        value === undefined
          ? 1
          : Math.round(
              ((value - min) / Math.max(1e-9, max - min)) *
                (palette.density.length - 1),
            );
      grid.set(
        x,
        top + y,
        value === undefined ? "·" : (palette.density[level] ?? "#"),
        value === undefined ? "missing" : "series",
        {
          foreground:
            value === undefined
              ? "muted"
              : (`series${(level % 4) + 1}` as "series1"),
        },
      );
    }),
  );
  chart.data.forEach((item, i) =>
    grid.text(
      (i % 3) * Math.floor(width / 3),
      height - 2 + Math.floor(i / 3),
      `${item.id} ${formatValue(item.value)}`,
      "label",
    ),
  );
  return chartTable(
    grid,
    chart,
    "World choropleth",
    [
      { key: "region", label: "Region" },
      { key: "value", label: "Value" },
    ],
    chart.data.map((item) => ({
      region: item.label ?? item.id,
      value: item.value,
    })),
  );
}

export function migrationFlow(
  input: MigrationFlowChartInput,
): MigrationFlowChart {
  if (!Array.isArray(input.routes))
    throw new TypeError("routes must be an array.");
  validateDataLength(input.routes.length, "routes");
  const routes: readonly Route[] = Object.freeze(
    input.routes.map((route, i) => {
      [route.from, route.to].forEach((point, j) => {
        validateFiniteNumber(point.x, `routes[${i}].point[${j}].x`);
        validateFiniteNumber(point.y, `routes[${i}].point[${j}].y`);
      });
      const value = route.value ?? 1;
      validateFiniteNumber(value, `routes[${i}].value`);
      return Object.freeze({
        from: Object.freeze({ ...route.from }),
        to: Object.freeze({ ...route.to }),
        value,
      });
    }),
  );
  return Object.freeze({ type: "migration-flow", routes, ...base(input) });
}

export function layoutMigrationFlow(
  chart: MigrationFlowChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const points = chart.routes.flatMap((r) => [r.from, r.to]);
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x)),
    minY = Math.min(...points.map((p) => p.y)),
    maxY = Math.max(...points.map((p) => p.y));
  const px = (v: number) =>
    2 + Math.round(((v - minX) / Math.max(1e-9, maxX - minX)) * (width - 5));
  const py = (v: number) =>
    height -
    3 -
    Math.round(((v - minY) / Math.max(1e-9, maxY - minY)) * (height - top - 4));
  chart.routes.forEach((route, i) => {
    const x0 = px(route.from.x),
      y0 = py(route.from.y),
      x1 = px(route.to.x),
      y1 = py(route.to.y);
    const steps = Math.max(3, Math.abs(x1 - x0));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(
        y0 +
          (y1 - y0) * t -
          Math.sin(Math.PI * t) * Math.min(5, Math.abs(x1 - x0) / 5),
      );
      grid.set(x, y, charset === "ascii" ? "." : "·", "series", {
        foreground: `series${(i % 4) + 1}` as "series1",
      });
    }
    grid.set(x1, y1, charset === "ascii" ? ">" : "▶", "value", {
      foreground: `series${(i % 4) + 1}` as "series1",
    });
  });
  return chartTable(
    grid,
    chart,
    "Migration-flow map",
    [
      { key: "from", label: "From" },
      { key: "to", label: "To" },
      { key: "value", label: "Flow" },
    ],
    chart.routes.map((r) => ({
      from: r.from.label ?? `${r.from.x},${r.from.y}`,
      to: r.to.label ?? `${r.to.x},${r.to.y}`,
      value: r.value,
    })),
  );
}

export function hexTileMap(input: HexTileMapChartInput): HexTileMapChart {
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly HexTileDatum[] = Object.freeze(
    input.data.map((item, i) => {
      validateFiniteNumber(item.x, `data[${i}].x`);
      validateFiniteNumber(item.y, `data[${i}].y`);
      validateFiniteNumber(item.value, `data[${i}].value`);
      validateText(item.label, `data[${i}].label`);
      return Object.freeze({ ...item });
    }),
  );
  return Object.freeze({ type: "hex-tile-map", data, ...base(input) });
}

export function layoutHexTileMap(
  chart: HexTileMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const minX = Math.min(...chart.data.map((d) => d.x)),
    maxX = Math.max(...chart.data.map((d) => d.x)),
    minY = Math.min(...chart.data.map((d) => d.y)),
    maxY = Math.max(...chart.data.map((d) => d.y)),
    minV = Math.min(...chart.data.map((d) => d.value)),
    maxV = Math.max(...chart.data.map((d) => d.value));
  chart.data.forEach((item) => {
    const x = Math.round(
      ((item.x - minX) / Math.max(1, maxX - minX)) * (width - 5),
    );
    const y =
      top +
      Math.round(
        ((item.y - minY) / Math.max(1, maxY - minY)) * (height - top - 2),
      );
    const level = Math.round(
      ((item.value - minV) / Math.max(1e-9, maxV - minV)) *
        (palette.density.length - 1),
    );
    grid.text(
      x,
      y,
      charset === "ascii"
        ? `[${truncateText(item.label, 2, "")} ]`
        : `⬡${truncateText(item.label, 2, "")}`,
      "series",
      { foreground: `series${(level % 4) + 1}` as "series1" },
      { label: item.label, value: item.value },
    );
  });
  return chartTable(
    grid,
    chart,
    "Hex-tile map",
    [
      { key: "region", label: "Region" },
      { key: "x", label: "X" },
      { key: "y", label: "Y" },
      { key: "value", label: "Value" },
    ],
    chart.data.map((d) => ({
      region: d.label,
      x: d.x,
      y: d.y,
      value: d.value,
    })),
  );
}

export function dotDensityMap(
  input: DotDensityMapChartInput,
): DotDensityMapChart {
  if (!Array.isArray(input.shape))
    throw new TypeError("shape must be an array.");
  const shape = labels(input.shape, "shape");
  if (!Array.isArray(input.regions))
    throw new TypeError("regions must be an array.");
  const regions = Object.freeze(
    input.regions.map((item, i) => {
      validateText(item.id, `regions[${i}].id`);
      validateText(item.label, `regions[${i}].label`);
      validateFiniteNumber(item.value, `regions[${i}].value`);
      return Object.freeze({ ...item });
    }),
  );
  const dotsPerUnit = input.dotsPerUnit ?? 10;
  validateFiniteNumber(dotsPerUnit, "dotsPerUnit");
  if (dotsPerUnit <= 0) throw new RangeError("dotsPerUnit must be positive.");
  return Object.freeze({
    type: "dot-density-map",
    shape,
    regions,
    dotsPerUnit,
    ...base(input),
  });
}

export function layoutDotDensityMap(
  chart: DotDensityMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const { width, height, charset, palette } = viewport(chart, options);
  const grid = new GridBuilder(width, height);
  const top = title(grid, chart, palette.ellipsis);
  const region = new Map(
    chart.regions.map((r, i) => [r.id, { ...r, index: i }]),
  );
  const cells = new Map<string, { x: number; y: number }[]>();
  chart.shape.forEach((row, y) =>
    [...row].forEach((id, x) => {
      if (id !== " ") cells.set(id, [...(cells.get(id) ?? []), { x, y }]);
    }),
  );
  cells.forEach((positions, id) => {
    const item = region.get(id);
    const count =
      item === undefined
        ? 0
        : Math.min(
            positions.length,
            Math.round(item.value / chart.dotsPerUnit),
          );
    positions.forEach((position, i) => {
      if (position.x < width && top + position.y < height - 2)
        grid.set(
          position.x,
          top + position.y,
          i < count
            ? charset === "ascii"
              ? "."
              : "•"
            : charset === "ascii"
              ? " "
              : "·",
          i < count ? "series" : "missing",
          {
            foreground:
              item === undefined
                ? "muted"
                : (`series${((item.index ?? 0) % 4) + 1}` as "series1"),
          },
        );
    });
  });
  chart.regions.forEach((item, i) =>
    grid.text(
      (i % 3) * Math.floor(width / 3),
      height - 2 + Math.floor(i / 3),
      `${item.id} ${formatValue(item.value)}`,
      "label",
    ),
  );
  return chartTable(
    grid,
    chart,
    "Dot-density map",
    [
      { key: "region", label: "Region" },
      { key: "value", label: "Value" },
    ],
    chart.regions.map((r) => ({ region: r.label, value: r.value })),
  );
}
