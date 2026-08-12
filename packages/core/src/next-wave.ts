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
  CreativeEdge,
  CreativeSeries,
  EventDatum,
  LayoutOptions,
  NextChart,
  NextChartInput,
  NextChartType,
  NextDatum,
} from "./types.js";

const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 18;

function normalize(type: NextChartType, input: NextChartInput): NextChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError(`${type} input must be an object.`);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");

  const labels = Object.freeze(
    (input.labels ?? []).map((label, index) => {
      validateText(label, `labels[${index}]`);
      return label;
    }),
  );
  const series: readonly CreativeSeries[] = Object.freeze(
    (input.series ?? []).map((item, index) => {
      validateText(item.label, `series[${index}].label`);
      const values = Object.freeze(
        item.values.map((value, valueIndex) => {
          validateFiniteNumber(value, `series[${index}].values[${valueIndex}]`);
          return value;
        }),
      );
      return Object.freeze({ label: item.label, values });
    }),
  );
  const data: readonly NextDatum[] = Object.freeze(
    (input.data ?? []).map((item, index) => {
      if (item.label !== undefined)
        validateText(item.label, `data[${index}].label`);
      if (item.group !== undefined)
        validateText(item.group, `data[${index}].group`);
      for (const key of [
        "x",
        "y",
        "value",
        "low",
        "high",
        "start",
        "end",
      ] as const) {
        if (item[key] !== undefined)
          validateFiniteNumber(item[key], `data[${index}].${key}`);
      }
      return Object.freeze({ ...item });
    }),
  );
  const values = Object.freeze(
    (input.values ?? []).map((value, index) => {
      validateFiniteNumber(value, `values[${index}]`);
      return value;
    }),
  );
  const matrix = Object.freeze(
    (input.matrix ?? []).map((row, rowIndex) =>
      Object.freeze(
        row.map((value, columnIndex) => {
          validateFiniteNumber(value, `matrix[${rowIndex}][${columnIndex}]`);
          return value;
        }),
      ),
    ),
  );
  const edges: readonly CreativeEdge[] = Object.freeze(
    (input.edges ?? []).map((edge, index) => {
      if (!Number.isInteger(edge.from) || !Number.isInteger(edge.to))
        throw new TypeError(`edges[${index}] endpoints must be integers.`);
      const value = edge.value ?? 1;
      validateFiniteNumber(value, `edges[${index}].value`);
      return Object.freeze({ from: edge.from, to: edge.to, value });
    }),
  );
  const events: readonly EventDatum[] = Object.freeze(
    (input.events ?? []).map((event, index) => {
      validateFiniteNumber(event.position, `events[${index}].position`);
      if (event.label !== undefined)
        validateText(event.label, `events[${index}].label`);
      const value = event.value ?? 1;
      validateFiniteNumber(value, `events[${index}].value`);
      return Object.freeze({
        position: event.position,
        ...(event.label === undefined ? {} : { label: event.label }),
        value,
      });
    }),
  );
  const sourceCount =
    labels.length +
    series.length +
    data.length +
    values.length +
    matrix.length +
    edges.length +
    events.length;
  validateDataLength(sourceCount, "chart data");
  return Object.freeze({
    type,
    labels,
    series,
    data,
    values,
    matrix,
    edges,
    events,
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined
      ? {}
      : { description: input.description }),
    ...(input.width === undefined ? {} : { width: input.width }),
    ...(input.height === undefined ? {} : { height: input.height }),
  });
}

export const streamgraph = (input: NextChartInput) =>
  normalize("streamgraph", input);
export const hovmoller = (input: NextChartInput) =>
  normalize("hovmoller", input);
export const sankeyTimeline = (input: NextChartInput) =>
  normalize("sankey-timeline", input);
export const slopegraph = (input: NextChartInput) =>
  normalize("slopegraph", input);
export const marimekkoTimeline = (input: NextChartInput) =>
  normalize("marimekko-timeline", input);
export const voronoiMap = (input: NextChartInput) =>
  normalize("voronoi-map", input);
export const smallMultiples = (input: NextChartInput) =>
  normalize("small-multiples", input);
export const clusteredDendrogram = (input: NextChartInput) =>
  normalize("clustered-dendrogram", input);
export const heatmapDendrogram = (input: NextChartInput) =>
  normalize("heatmap-dendrogram", input);
export const confusionMatrix = (input: NextChartInput) =>
  normalize("confusion-matrix", input);
export const liftGains = (input: NextChartInput) =>
  normalize("lift-gains", input);
export const forestPlot = (input: NextChartInput) =>
  normalize("forest-plot", input);
export const blandAltman = (input: NextChartInput) =>
  normalize("bland-altman", input);
export const queueTimeline = (input: NextChartInput) =>
  normalize("queue-timeline", input);
export const criticalPath = (input: NextChartInput) =>
  normalize("critical-path", input);
export const spectrogram = (input: NextChartInput) =>
  normalize("spectrogram", input);
export const waveform = (input: NextChartInput) => normalize("waveform", input);
export const footprintChart = (input: NextChartInput) =>
  normalize("footprint", input);
export const renko = (input: NextChartInput) => normalize("renko", input);
export const kagi = (input: NextChartInput) => normalize("kagi", input);
export const cartogram = (input: NextChartInput) =>
  normalize("cartogram", input);
export const transitMap = (input: NextChartInput) =>
  normalize("transit-map", input);

function setup(chart: NextChart, options: LayoutOptions) {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  let top = 0;
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
    top = 2;
  }
  return { width, height, charset, palette, grid, top };
}

function line(
  grid: GridBuilder,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  glyph: string,
  index = 0,
) {
  const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let step = 0; step <= steps; step += 1) {
    grid.set(
      Math.round(x0 + ((x1 - x0) * step) / steps),
      Math.round(y0 + ((y1 - y0) * step) / steps),
      glyph,
      "series",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    );
  }
}

function rows(chart: NextChart) {
  if (chart.data.length > 0)
    return chart.data.map((item, index) => ({
      index: index + 1,
      label: item.label ?? "",
      x: item.x ?? null,
      y: item.y ?? null,
      value: item.value ?? null,
      low: item.low ?? null,
      high: item.high ?? null,
      start: item.start ?? null,
      end: item.end ?? null,
      group: item.group ?? "",
    }));
  if (chart.series.length > 0)
    return chart.series.flatMap((item) =>
      item.values.map((value, index) => ({
        index: index + 1,
        label: item.label,
        value,
      })),
    );
  if (chart.matrix.length > 0)
    return chart.matrix.flatMap((row, y) =>
      row.map((value, x) => ({ x, y, value })),
    );
  if (chart.events.length > 0)
    return chart.events.map((item) => ({
      index: item.position,
      label: item.label ?? "",
      value: item.value,
    }));
  if (chart.edges.length > 0)
    return chart.edges.map((item, index) => ({
      index: index + 1,
      label: `${chart.labels[item.from] ?? item.from} → ${chart.labels[item.to] ?? item.to}`,
      value: item.value,
    }));
  return chart.values.map((value, index) => ({ index: index + 1, value }));
}

function finish(grid: GridBuilder, chart: NextChart): CellGrid {
  const heading = chart.title ?? chart.type;
  return grid.build(chart.description ?? `${heading}.`, {
    caption: heading,
    columns: [
      { key: "index", label: "Index" },
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ],
    rows: rows(chart),
  });
}

function layoutStream(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const count = Math.max(1, ...chart.series.map((item) => item.values.length));
  const totals = Array.from({ length: count }, (_, index) =>
    chart.series.reduce(
      (sum, item) => sum + Math.max(0, item.values[index] ?? 0),
      0,
    ),
  );
  const maximum = Math.max(1, ...totals);
  const plotHeight = Math.max(3, height - top - 3);
  for (let column = 0; column < count; column += 1) {
    const x0 = Math.round((column / count) * width);
    const x1 = Math.max(x0 + 1, Math.round(((column + 1) / count) * width));
    const total = totals[column] ?? 0;
    let cursor = Math.floor(
      top + plotHeight / 2 - ((total / maximum) * plotHeight) / 2,
    );
    chart.series.forEach((item, seriesIndex) => {
      const segment = Math.max(
        1,
        Math.round(((item.values[column] ?? 0) / maximum) * plotHeight),
      );
      const glyph =
        charset === "ascii"
          ? String((seriesIndex + 1) % 10)
          : (["░", "▒", "▓", "█"][seriesIndex % 4] ?? "#");
      for (
        let y = cursor;
        y < Math.min(top + plotHeight, cursor + segment);
        y += 1
      )
        for (let x = x0; x < x1; x += 1)
          grid.set(x, y, glyph, "series", {
            foreground: `series${(seriesIndex % 4) + 1}` as "series1",
          });
      cursor += segment;
    });
  }
  chart.series.forEach((item, index) =>
    grid.text(
      index * Math.floor(width / chart.series.length),
      height - 1,
      `${index + 1}:${truncateText(item.label, 9, palette.ellipsis)}`,
      "label",
    ),
  );
  return finish(grid, chart);
}

function layoutField(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const left = chart.type === "spectrogram" ? 9 : 7;
  const bottom = height - 3;
  const all = chart.matrix.flat();
  const minimum = Math.min(...all),
    maximum = Math.max(...all);
  chart.matrix.forEach((row, rowIndex) => {
    const y0 =
      top + Math.round((rowIndex / chart.matrix.length) * (bottom - top));
    const y1 = Math.max(
      y0 + 1,
      top + Math.round(((rowIndex + 1) / chart.matrix.length) * (bottom - top)),
    );
    row.forEach((value, column) => {
      const x0 = left + Math.round((column / row.length) * (width - left - 1));
      const x1 = Math.max(
        x0 + 1,
        left + Math.round(((column + 1) / row.length) * (width - left - 1)),
      );
      const level = Math.round(
        ((value - minimum) / Math.max(1e-9, maximum - minimum)) *
          (palette.density.length - 1),
      );
      for (let y = y0; y < y1; y += 1)
        for (let x = x0; x < x1; x += 1)
          grid.set(
            x,
            y,
            charset === "ascii"
              ? ([".", ":", "*", "#"][level % 4] ?? "#")
              : (palette.density[level] ?? "."),
            "series",
            { foreground: `series${(level % 4) + 1}` as "series1" },
          );
    });
  });
  grid.text(
    0,
    top,
    chart.type === "spectrogram" ? "high Hz" : "north",
    "label",
  );
  grid.text(
    0,
    bottom - 1,
    chart.type === "spectrogram" ? "low Hz" : "south",
    "label",
  );
  grid.text(left, height - 1, "time →", "label", { foreground: "muted" });
  const legend = `${palette.density[0] ?? "."}${palette.density.at(-1) ?? "#"} ${formatValue(minimum)}–${formatValue(maximum)}`;
  grid.text(width - measureText(legend), height - 1, legend, "label", {
    foreground: "muted",
  });
  return finish(grid, chart);
}

function layoutMarimekko(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const periods = Math.max(
    1,
    ...chart.series.map((item) => item.values.length),
  );
  const totals = Array.from({ length: periods }, (_, index) =>
    chart.series.reduce(
      (sum, item) => sum + Math.max(0, item.values[index] ?? 0),
      0,
    ),
  );
  const grandTotal = Math.max(
    1,
    totals.reduce((sum, value) => sum + value, 0),
  );
  const plotHeight = height - top - 2;
  let x = 0;
  totals.forEach((total, period) => {
    const periodWidth =
      period === totals.length - 1
        ? width - x
        : Math.max(2, Math.round((total / grandTotal) * width));
    let y = top;
    chart.series.forEach((item, seriesIndex) => {
      const value = item.values[period] ?? 0;
      const segmentHeight = Math.max(
        1,
        Math.round((value / Math.max(1, total)) * plotHeight),
      );
      for (
        let row = y;
        row < Math.min(top + plotHeight, y + segmentHeight);
        row += 1
      )
        for (
          let column = x;
          column < Math.min(width, x + periodWidth);
          column += 1
        )
          grid.set(
            column,
            row,
            charset === "ascii"
              ? String((seriesIndex + 1) % 10)
              : (["░", "▒", "▓", "█"][seriesIndex % 4] ?? "#"),
            "series",
            { foreground: `series${(seriesIndex % 4) + 1}` as "series1" },
          );
      y += segmentHeight;
    });
    grid.text(x, height - 1, String(period + 1), "label");
    x += periodWidth;
  });
  chart.series.forEach((item, index) =>
    grid.text(
      index * Math.floor(width / chart.series.length),
      height - 2,
      `${index + 1}:${truncateText(item.label, 8, palette.ellipsis)}`,
      "label",
    ),
  );
  return finish(grid, chart);
}

function layoutCartogram(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const rowTotals = chart.matrix.map((row) =>
    row.reduce((sum, value) => sum + Math.max(0, value), 0),
  );
  const total = Math.max(
    1,
    rowTotals.reduce((sum, value) => sum + value, 0),
  );
  let y = top;
  rowTotals.forEach((rowTotal, rowIndex) => {
    const rowHeight =
      rowIndex === rowTotals.length - 1
        ? height - 1 - y
        : Math.max(2, Math.round((rowTotal / total) * (height - top - 1)));
    let x = 0;
    const row = chart.matrix[rowIndex] ?? [];
    row.forEach((value, columnIndex) => {
      const cellWidth =
        columnIndex === row.length - 1
          ? width - x
          : Math.max(3, Math.round((value / Math.max(1, rowTotal)) * width));
      const label = `${rowIndex + 1}${String.fromCharCode(65 + columnIndex)}`;
      for (let rowY = y; rowY < Math.min(height - 1, y + rowHeight); rowY += 1)
        for (
          let columnX = x;
          columnX < Math.min(width, x + cellWidth);
          columnX += 1
        )
          grid.set(
            columnX,
            rowY,
            charset === "ascii"
              ? ([".", ":", "+", "#"][(rowIndex + columnIndex) % 4] ?? "#")
              : (palette.density[
                  ((rowIndex + columnIndex) % (palette.density.length - 1)) + 1
                ] ?? "#"),
            "series",
            {
              foreground:
                `series${((rowIndex + columnIndex) % 4) + 1}` as "series1",
            },
          );
      if (cellWidth >= measureText(label) + 2 && rowHeight >= 2)
        grid.text(
          x + 1,
          y + Math.floor(rowHeight / 2),
          label,
          "value",
          { bold: true },
          { label, value },
        );
      x += cellWidth;
    });
    y += rowHeight;
  });
  return finish(grid, chart);
}

function raster(chart: NextChart, options: LayoutOptions): CellGrid {
  if (chart.type === "streamgraph") return layoutStream(chart, options);
  if (chart.type === "hovmoller" || chart.type === "spectrogram")
    return layoutField(chart, options);
  if (chart.type === "marimekko-timeline")
    return layoutMarimekko(chart, options);
  if (chart.type === "cartogram") return layoutCartogram(chart, options);
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const source =
    chart.matrix.length > 0
      ? chart.matrix
      : chart.series.map((item) => item.values);
  const all = source.flat();
  const minimum = Math.min(...all);
  const maximum = Math.max(...all);
  const rowHeight = Math.max(1, Math.floor((height - top - 2) / source.length));
  source.forEach((row, rowIndex) => {
    const y0 = top + rowIndex * rowHeight;
    row.forEach((value, column) => {
      const x0 = Math.round((column / row.length) * width);
      const x1 = Math.max(
        x0 + 1,
        Math.round(((column + 1) / row.length) * width),
      );
      const level = Math.round(
        ((value - minimum) / Math.max(1e-9, maximum - minimum)) *
          (palette.density.length - 1),
      );
      const glyph =
        chart.type === "marimekko-timeline"
          ? String((rowIndex + 1) % 10)
          : (palette.density[level] ?? ".");
      for (let y = y0; y < Math.min(height - 1, y0 + rowHeight); y += 1)
        for (let x = x0; x < x1; x += 1)
          grid.set(
            x,
            y,
            charset === "ascii" && glyph.trim() !== ""
              ? ([".", ":", "*", "#"][level % 4] ?? "#")
              : glyph,
            "series",
            { foreground: `series${(rowIndex % 4) + 1}` as "series1" },
          );
    });
  });
  return finish(grid, chart);
}

function layoutLift(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, grid, top } = setup(chart, options);
  const left = 7,
    bottom = height - 3;
  const points = chart.data.map((item, index) => ({
    x: item.x ?? index,
    y: item.y ?? item.value ?? 0,
  }));
  const maxX = Math.max(1, ...points.map((item) => item.x)),
    maxY = Math.max(1, ...points.map((item) => item.y));
  const px = (value: number) =>
    left + Math.round((value / maxX) * (width - left - 2));
  const py = (value: number) =>
    bottom - Math.round((value / maxY) * (bottom - top));
  line(
    grid,
    px(0),
    py(0),
    px(maxX),
    py(maxY),
    charset === "ascii" ? "." : "·",
    3,
  );
  points.forEach((point, index) => {
    if (index > 0) {
      const previous = points[index - 1];
      if (previous)
        line(
          grid,
          px(previous.x),
          py(previous.y),
          px(point.x),
          py(point.y),
          charset === "ascii" ? "*" : "●",
        );
    }
    grid.set(
      px(point.x),
      py(point.y),
      charset === "ascii" ? "O" : "◆",
      "value",
    );
  });
  grid.text(0, top, "100%", "label");
  grid.text(left, height - 1, "population →", "label");
  grid.text(width - 15, top, "model gain", "label", { foreground: "accent" });
  return finish(grid, chart);
}

function layoutForest(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const labelWidth = Math.min(
    15,
    Math.max(8, ...chart.data.map((item) => measureText(item.label ?? ""))),
  );
  const bounds = chart.data.flatMap((item) => [
    item.low ?? item.x ?? 0,
    item.high ?? item.x ?? 0,
  ]);
  const minimum = Math.min(0, ...bounds),
    maximum = Math.max(1, ...bounds),
    plotLeft = labelWidth + 2;
  const px = (value: number) =>
    plotLeft +
    Math.round(
      ((value - minimum) / Math.max(1e-9, maximum - minimum)) *
        (width - plotLeft - 8),
    );
  const nullX = px(1);
  for (let y = top; y < height - 2; y += 1)
    grid.set(nullX, y, charset === "ascii" ? "." : "·", "axis", {
      foreground: "muted",
    });
  chart.data.slice(0, height - top - 2).forEach((item, index) => {
    const y = top + index;
    const estimate = item.x ?? item.value ?? 0,
      low = item.low ?? estimate,
      high = item.high ?? estimate;
    grid.text(
      0,
      y,
      truncateText(
        item.label ?? String(index + 1),
        labelWidth,
        palette.ellipsis,
      ),
      "label",
    );
    line(grid, px(low), y, px(high), y, charset === "ascii" ? "-" : "─", index);
    grid.set(px(low), y, charset === "ascii" ? "[" : "├", "axis");
    grid.set(px(high), y, charset === "ascii" ? "]" : "┤", "axis");
    grid.set(px(estimate), y, charset === "ascii" ? "O" : "◆", "value", {
      foreground: "series1",
      bold: true,
    });
    grid.text(width - 7, y, formatValue(estimate), "value");
  });
  grid.text(nullX - 3, height - 1, "null=1", "label", { foreground: "muted" });
  return finish(grid, chart);
}

function layoutBland(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, grid, top } = setup(chart, options);
  const left = 8,
    bottom = height - 3;
  const points = chart.data.map((item, index) => ({
    x: item.x ?? index,
    y: item.y ?? item.value ?? 0,
  }));
  const mean = points.reduce((sum, item) => sum + item.y, 0) / points.length;
  const variance =
    points.reduce((sum, item) => sum + (item.y - mean) ** 2, 0) /
    Math.max(1, points.length - 1);
  const sd = Math.sqrt(variance);
  const lower = mean - 1.96 * sd,
    upper = mean + 1.96 * sd;
  const minX = Math.min(...points.map((item) => item.x)),
    maxX = Math.max(...points.map((item) => item.x)),
    minY = Math.min(lower, ...points.map((item) => item.y)),
    maxY = Math.max(upper, ...points.map((item) => item.y));
  const px = (value: number) =>
    left +
    Math.round(
      ((value - minX) / Math.max(1e-9, maxX - minX)) * (width - left - 2),
    );
  const py = (value: number) =>
    bottom -
    Math.round(((value - minY) / Math.max(1e-9, maxY - minY)) * (bottom - top));
  [
    [mean, "mean", "="],
    [upper, "+1.96σ", "."],
    [lower, "−1.96σ", "."],
  ].forEach(([value, label, glyph], index) => {
    line(
      grid,
      left,
      py(Number(value)),
      width - 2,
      py(Number(value)),
      charset === "ascii" ? String(glyph) : index === 0 ? "━" : "┄",
      index,
    );
    grid.text(0, py(Number(value)), String(label), "label");
  });
  points.forEach((point, index) =>
    grid.set(
      px(point.x),
      py(point.y),
      charset === "ascii" ? "o" : "●",
      "value",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    ),
  );
  grid.text(left, height - 1, "measurement mean →", "label", {
    foreground: "muted",
  });
  return finish(grid, chart);
}

function layoutWave(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, grid, top } = setup(chart, options);
  const left = 6,
    bottom = height - 2;
  const maximum = Math.max(1, ...chart.values.map(Math.abs));
  const zero = top + Math.round((bottom - top) / 2);
  for (let x = left; x < width; x += 1)
    grid.set(x, zero, charset === "ascii" ? "-" : "─", "axis", {
      foreground: "muted",
    });
  chart.values.forEach((value, index) => {
    const x =
      left +
      Math.round(
        (index / Math.max(1, chart.values.length - 1)) * (width - left - 2),
      );
    const y =
      zero - Math.round((value / maximum) * Math.max(1, (bottom - top) / 2));
    line(
      grid,
      x,
      zero,
      x,
      y,
      charset === "ascii" ? "|" : value >= 0 ? "▮" : "▯",
      value >= 0 ? 0 : 1,
    );
    if (index > 0) {
      const previous = chart.values[index - 1] ?? value;
      const px =
        left +
        Math.round(
          ((index - 1) / Math.max(1, chart.values.length - 1)) *
            (width - left - 2),
        );
      const py =
        zero -
        Math.round((previous / maximum) * Math.max(1, (bottom - top) / 2));
      line(
        grid,
        px,
        py,
        x,
        y,
        charset === "ascii" ? "*" : "•",
        value >= 0 ? 0 : 1,
      );
    }
  });
  grid.text(0, top, `+${formatValue(maximum)}`, "label");
  grid.text(0, zero, " 0", "label");
  grid.text(0, bottom, `-${formatValue(maximum)}`, "label");
  return finish(grid, chart);
}

function layoutRenko(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, grid, top } = setup(chart, options);
  const minimum = Math.min(...chart.values),
    maximum = Math.max(...chart.values),
    box = Math.max(1e-9, (maximum - minimum) / 8);
  const bricks: { level: number; up: boolean }[] = [];
  let level = Math.round((chart.values[0] ?? 0) / box);
  chart.values.slice(1).forEach((value) => {
    const target = Math.round(value / box);
    while (target !== level) {
      const up = target > level;
      level += up ? 1 : -1;
      bricks.push({ level, up });
      if (bricks.length >= width - 8) break;
    }
  });
  const minLevel = Math.min(...bricks.map((item) => item.level)),
    maxLevel = Math.max(...bricks.map((item) => item.level));
  const py = (value: number) =>
    top +
    Math.round(
      ((maxLevel - value) / Math.max(1, maxLevel - minLevel)) *
        (height - top - 3),
    );
  bricks.forEach((brick, index) => {
    const x = 7 + index,
      y = py(brick.level);
    grid.set(
      x,
      y,
      brick.up
        ? charset === "ascii"
          ? "#"
          : "█"
        : charset === "ascii"
          ? "o"
          : "□",
      brick.up ? "positive" : "negative",
    );
  });
  grid.text(0, top, formatValue(maximum), "label");
  grid.text(0, height - 3, formatValue(minimum), "label");
  grid.text(
    7,
    height - 1,
    `${charset === "ascii" ? "#" : "█"} up  ${charset === "ascii" ? "o" : "□"} down  box ${formatValue(box)}`,
    "label",
  );
  return finish(grid, chart);
}

function layoutKagi(chart: NextChart, options: LayoutOptions): CellGrid {
  const { height, charset, grid, top } = setup(chart, options);
  const minimum = Math.min(...chart.values),
    maximum = Math.max(...chart.values),
    bottom = height - 2;
  const py = (value: number) =>
    top +
    Math.round(
      ((maximum - value) / Math.max(1e-9, maximum - minimum)) * (bottom - top),
    );
  let x = 7;
  let direction = 0;
  chart.values.slice(1).forEach((value, index) => {
    const previous = chart.values[index] ?? value,
      nextDirection = Math.sign(value - previous);
    const glyph =
      nextDirection >= 0
        ? charset === "ascii"
          ? "#"
          : "┃"
        : charset === "ascii"
          ? "|"
          : "│";
    line(
      grid,
      x,
      py(previous),
      x,
      py(value),
      glyph,
      nextDirection >= 0 ? 0 : 1,
    );
    if (direction !== 0 && nextDirection !== direction) {
      line(
        grid,
        x,
        py(previous),
        x + 3,
        py(previous),
        charset === "ascii" ? "-" : "━",
        nextDirection >= 0 ? 0 : 1,
      );
      x += 3;
    }
    direction = nextDirection;
  });
  grid.text(0, top, formatValue(maximum), "label");
  grid.text(0, bottom, formatValue(minimum), "label");
  grid.text(
    7,
    height - 1,
    `${charset === "ascii" ? "#" : "┃"} yang  ${charset === "ascii" ? "|" : "│"} yin`,
    "label",
  );
  return finish(grid, chart);
}

function cartesian(chart: NextChart, options: LayoutOptions): CellGrid {
  if (chart.type === "lift-gains") return layoutLift(chart, options);
  if (chart.type === "forest-plot") return layoutForest(chart, options);
  if (chart.type === "bland-altman") return layoutBland(chart, options);
  if (chart.type === "waveform") return layoutWave(chart, options);
  if (chart.type === "renko") return layoutRenko(chart, options);
  if (chart.type === "kagi") return layoutKagi(chart, options);
  const { width, height, charset, grid, top } = setup(chart, options);
  const left = 8;
  const bottom = height - 2;
  const points: {
    x: number;
    y: number;
    low?: number;
    high?: number;
    group?: string;
    label?: string;
  }[] =
    chart.data.length > 0
      ? chart.data.map((item, index) => ({
          x: item.x ?? index,
          y: item.y ?? item.value ?? 0,
          ...item,
        }))
      : chart.values.map((value, index) => ({ x: index, y: value }));
  const xs = points.map((point) => point.x);
  const ys = points.flatMap((point) => [
    point.y,
    point.low ?? point.y,
    point.high ?? point.y,
  ]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const px = (value: number) =>
    left +
    Math.round(
      ((value - minX) / Math.max(1e-9, maxX - minX)) * (width - left - 2),
    );
  const py = (value: number) =>
    bottom -
    Math.round(((value - minY) / Math.max(1e-9, maxY - minY)) * (bottom - top));
  points.forEach((point, index) => {
    const x = px(point.x),
      y = py(point.y);
    if (point.low !== undefined && point.high !== undefined) {
      line(
        grid,
        px(point.low),
        y,
        px(point.high),
        y,
        charset === "ascii" ? "-" : "─",
        index,
      );
      grid.set(x, y, charset === "ascii" ? "O" : "◆", "value");
    } else if (index > 0) {
      const previous = points[index - 1];
      if (previous) {
        line(
          grid,
          px(previous.x),
          py(previous.y),
          x,
          y,
          charset === "ascii" ? "*" : "●",
          index,
        );
      }
    }
    grid.set(
      x,
      y,
      chart.type === "waveform"
        ? point.y >= 0
          ? "▲"
          : "▼"
        : charset === "ascii"
          ? "o"
          : "●",
      "value",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    );
  });
  grid.text(0, top, formatValue(maxY), "label");
  grid.text(0, bottom, formatValue(minY), "label");
  return finish(grid, chart);
}

function slope(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const pairs = chart.data;
  const all = pairs.flatMap((item) => [
    item.start ?? item.x ?? 0,
    item.end ?? item.y ?? 0,
  ]);
  const min = Math.min(...all),
    max = Math.max(...all);
  const py = (value: number) =>
    top +
    Math.round(
      ((max - value) / Math.max(1e-9, max - min)) * (height - top - 2),
    );
  pairs.forEach((item, index) => {
    const start = item.start ?? item.x ?? 0,
      end = item.end ?? item.y ?? 0;
    line(
      grid,
      14,
      py(start),
      width - 15,
      py(end),
      charset === "ascii" ? "-" : "─",
      index,
    );
    grid.text(
      0,
      py(start),
      `${truncateText(item.label ?? String(index + 1), 8, palette.ellipsis)} ${formatValue(start)}`,
      "label",
    );
    grid.text(width - 12, py(end), formatValue(end), "label");
  });
  return finish(grid, chart);
}

function matrix(chart: NextChart, options: LayoutOptions): CellGrid {
  const { height, charset, palette, grid, top } = setup(chart, options);
  const matrixTop = top + 3;
  const size = Math.min(
    chart.matrix.length,
    Math.floor((height - matrixTop) / 2),
  );
  const maximum = Math.max(1, ...chart.matrix.flat());
  grid.text(
    0,
    top,
    chart.type === "confusion-matrix"
      ? "actual ↓ / predicted →"
      : "row tree / column tree",
    "label",
    { foreground: "muted" },
  );
  chart.labels
    .slice(0, size)
    .forEach((label, x) =>
      grid.text(
        12 + x * 6,
        top + 1,
        truncateText(label, 5, palette.ellipsis),
        "label",
      ),
    );
  chart.matrix.slice(0, size).forEach((row, y) => {
    grid.text(
      0,
      matrixTop + y * 2,
      truncateText(chart.labels[y] ?? String(y + 1), 10, palette.ellipsis),
      "label",
    );
    row.slice(0, size).forEach((value, x) => {
      const level = Math.round(
        (value / maximum) * (palette.density.length - 1),
      );
      grid.text(
        12 + x * 6,
        matrixTop + y * 2,
        `${chart.type === "confusion-matrix" && x === y ? (charset === "ascii" ? "[" : "▐") : " "}${charset === "ascii" ? [".", ":", "*", "#"][level % 4] : palette.density[level]}${String(value).padStart(2)}${chart.type === "confusion-matrix" && x === y ? (charset === "ascii" ? "]" : "▌") : " "}`,
        x === y ? "positive" : "series",
        {
          foreground:
            x === y ? "positive" : (`series${(x % 4) + 1}` as "series1"),
        },
      );
    });
  });
  if (chart.type === "heatmap-dendrogram") {
    for (let pair = 0; pair + 1 < size; pair += 2) {
      const x0 = 14 + pair * 6,
        x1 = 14 + (pair + 1) * 6;
      line(grid, x0, top + 2, x1, top + 2, charset === "ascii" ? "-" : "─");
      grid.set(
        Math.round((x0 + x1) / 2),
        top + 1,
        charset === "ascii" ? "+" : "┴",
        "axis",
      );
      const y0 = matrixTop + pair * 2,
        y1 = matrixTop + (pair + 1) * 2;
      line(grid, 10, y0, 10, y1, charset === "ascii" ? "|" : "│");
      grid.set(
        9,
        Math.round((y0 + y1) / 2),
        charset === "ascii" ? "+" : "┤",
        "axis",
      );
    }
  }
  return finish(grid, chart);
}

function layoutSankeyTimeline(
  chart: NextChart,
  options: LayoutOptions,
): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const levels = Array.from({ length: chart.labels.length }, () => 0);
  for (let pass = 0; pass < chart.labels.length; pass += 1)
    chart.edges.forEach((edge) => {
      levels[edge.to] = Math.max(
        levels[edge.to] ?? 0,
        (levels[edge.from] ?? 0) + 1,
      );
    });
  const maxLevel = Math.max(1, ...levels);
  const byLevel = Array.from({ length: maxLevel + 1 }, () => [] as number[]);
  levels.forEach((level, index) => byLevel[level]?.push(index));
  const positions = chart.labels.map((_, index) => {
    const level = levels[index] ?? 0,
      peers = byLevel[level] ?? [index],
      rank = peers.indexOf(index);
    return {
      x: 3 + Math.round((level / maxLevel) * (width - 8)),
      y:
        top +
        1 +
        Math.round(((rank + 1) / (peers.length + 1)) * (height - top - 5)),
    };
  });
  chart.edges.forEach((edge, edgeIndex) => {
    const from = positions[edge.from],
      to = positions[edge.to];
    if (!from || !to) return;
    const thickness = Math.min(
      3,
      Math.max(
        1,
        Math.round(
          (edge.value / Math.max(1, ...chart.edges.map((item) => item.value))) *
            3,
        ),
      ),
    );
    for (let offset = 0; offset < thickness; offset += 1)
      line(
        grid,
        from.x + 1,
        from.y + offset,
        to.x - 1,
        to.y + offset,
        charset === "ascii" ? "=" : (["─", "━", "═"][thickness - 1] ?? "─"),
        edgeIndex,
      );
  });
  positions.forEach((position, index) => {
    grid.text(
      position.x,
      position.y,
      charset === "ascii" ? "[ ]" : "▐█▌",
      "value",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    );
    grid.text(
      Math.max(0, position.x - 2),
      position.y + 2,
      truncateText(chart.labels[index] ?? "", 9, palette.ellipsis),
      "label",
    );
  });
  for (let level = 0; level <= maxLevel; level += 1)
    grid.text(
      3 + Math.round((level / maxLevel) * (width - 8)),
      height - 1,
      `T${level + 1}`,
      "label",
      { foreground: "muted" },
    );
  return finish(grid, chart);
}

function layoutDendrogram(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const leaves = chart.labels.length > 0 ? chart.labels : ["A", "B"];
  const bottom = height - 3;
  let clusters = leaves.map((_, index) => ({
    x: 3 + Math.round((index / Math.max(1, leaves.length - 1)) * (width - 7)),
    y: bottom,
  }));
  leaves.forEach((label, index) =>
    grid.text(
      Math.max(0, (clusters[index]?.x ?? 0) - 2),
      bottom + 2,
      truncateText(label, 7, palette.ellipsis),
      "label",
    ),
  );
  let level = 0;
  while (clusters.length > 1) {
    const next: { x: number; y: number }[] = [];
    for (let index = 0; index < clusters.length; index += 2) {
      const left = clusters[index],
        right = clusters[index + 1];
      if (!left) continue;
      if (!right) {
        next.push(left);
        continue;
      }
      const y = Math.max(
        top + 1,
        bottom -
          (level + 1) *
            Math.max(
              2,
              Math.floor((bottom - top) / Math.ceil(Math.log2(leaves.length))),
            ),
      );
      line(grid, left.x, left.y, left.x, y, charset === "ascii" ? "|" : "│");
      line(grid, right.x, right.y, right.x, y, charset === "ascii" ? "|" : "│");
      line(grid, left.x, y, right.x, y, charset === "ascii" ? "-" : "─");
      next.push({ x: Math.round((left.x + right.x) / 2), y });
    }
    clusters = next;
    level += 1;
  }
  grid.text(0, top, "distance", "label", { foreground: "muted" });
  return finish(grid, chart);
}

function layoutQueue(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const labelWidth = Math.min(
    12,
    Math.max(5, ...chart.labels.map(measureText)),
  );
  const plotWidth = width - labelWidth - 2;
  chart.labels.slice(0, height - top - 2).forEach((label, index) => {
    const y = top + index;
    grid.text(0, y, truncateText(label, labelWidth, palette.ellipsis), "label");
    const start = Math.round(
        (index / Math.max(1, chart.labels.length)) * plotWidth * 0.35,
      ),
      wait = 2 + (index % 4),
      work = 3 + ((index * 2) % 6);
    grid.text(
      labelWidth + 1 + start,
      y,
      (charset === "ascii" ? "." : "░").repeat(wait),
      "missing",
      { foreground: "muted" },
    );
    grid.text(
      labelWidth + 1 + start + wait,
      y,
      (charset === "ascii" ? "#" : "█").repeat(work),
      "series",
      { foreground: "series1" },
    );
    grid.set(
      labelWidth + start + wait + work + 1,
      y,
      charset === "ascii" ? ">" : "◆",
      "positive",
    );
  });
  grid.text(labelWidth + 1, height - 1, "wait ···  work ███  done ◆", "label", {
    foreground: "muted",
  });
  return finish(grid, chart);
}

function layoutCritical(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const distance = Array.from({ length: chart.labels.length }, () => 0),
    previous = Array.from({ length: chart.labels.length }, () => -1);
  for (let pass = 0; pass < chart.labels.length; pass += 1)
    chart.edges.forEach((edge) => {
      const candidate = (distance[edge.from] ?? 0) + edge.value;
      if (candidate > (distance[edge.to] ?? 0)) {
        distance[edge.to] = candidate;
        previous[edge.to] = edge.from;
      }
    });
  let end = distance.indexOf(Math.max(...distance));
  const critical = new Set<string>();
  while ((previous[end] ?? -1) >= 0) {
    const from = previous[end] ?? -1;
    critical.add(`${from}:${end}`);
    end = from;
  }
  const positions = chart.labels.map((_, index) => ({
    x:
      4 +
      Math.round((index / Math.max(1, chart.labels.length - 1)) * (width - 9)),
    y: top + 2 + (index % 2) * Math.max(3, Math.floor((height - top - 6) / 2)),
  }));
  chart.edges.forEach((edge, index) => {
    const from = positions[edge.from],
      to = positions[edge.to];
    if (!from || !to) return;
    const isCritical = critical.has(`${edge.from}:${edge.to}`);
    line(
      grid,
      from.x,
      from.y,
      to.x,
      to.y,
      isCritical
        ? charset === "ascii"
          ? "="
          : "━"
        : charset === "ascii"
          ? "."
          : "·",
      isCritical ? 0 : index + 1,
    );
  });
  positions.forEach((position, index) => {
    grid.set(
      position.x,
      position.y,
      critical.size > 0 && (previous[index] ?? -1) >= 0
        ? charset === "ascii"
          ? "O"
          : "◆"
        : charset === "ascii"
          ? "o"
          : "○",
      "value",
    );
    grid.text(
      Math.max(0, position.x - 3),
      position.y + 1,
      truncateText(chart.labels[index] ?? "", 8, palette.ellipsis),
      "label",
    );
  });
  grid.text(
    0,
    height - 1,
    `${charset === "ascii" ? "=" : "━"} critical  ${charset === "ascii" ? "." : "·"} slack`,
    "label",
    { foreground: "muted" },
  );
  return finish(grid, chart);
}

function layoutTransit(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const positions = chart.labels.map((_, index) => ({
    x:
      5 +
      Math.round((index / Math.max(1, chart.labels.length - 1)) * (width - 11)),
    y: top + 2 + (index % 3) * Math.max(2, Math.floor((height - top - 6) / 3)),
  }));
  chart.edges.forEach((edge, index) => {
    const from = positions[edge.from],
      to = positions[edge.to];
    if (!from || !to) return;
    line(
      grid,
      from.x,
      from.y,
      to.x,
      from.y,
      charset === "ascii" ? "=" : "━",
      index,
    );
    line(
      grid,
      to.x,
      from.y,
      to.x,
      to.y,
      charset === "ascii" ? "|" : "┃",
      index,
    );
  });
  positions.forEach((position, index) => {
    grid.set(
      position.x,
      position.y,
      charset === "ascii" ? "O" : index % 3 === 0 ? "◉" : "○",
      "value",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    );
    grid.text(
      position.x + 2,
      position.y,
      truncateText(chart.labels[index] ?? "", 8, palette.ellipsis),
      "label",
    );
  });
  return finish(grid, chart);
}

function network(chart: NextChart, options: LayoutOptions): CellGrid {
  if (chart.type === "sankey-timeline")
    return layoutSankeyTimeline(chart, options);
  if (chart.type === "clustered-dendrogram")
    return layoutDendrogram(chart, options);
  if (chart.type === "queue-timeline") return layoutQueue(chart, options);
  if (chart.type === "critical-path") return layoutCritical(chart, options);
  if (chart.type === "transit-map") return layoutTransit(chart, options);
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const labels =
    chart.labels.length > 0
      ? chart.labels
      : chart.events.map((event) => event.label ?? String(event.position));
  const count = Math.max(1, labels.length);
  const positions = labels.map((_, index) => ({
    x:
      4 +
      Math.round(
        ((index % Math.ceil(count / 2)) /
          Math.max(1, Math.ceil(count / 2) - 1)) *
          (width - 10),
      ),
    y: top + (index < Math.ceil(count / 2) ? 2 : Math.max(5, height - top - 5)),
  }));
  const edges =
    chart.edges.length > 0
      ? chart.edges
      : labels
          .slice(1)
          .map((_, index) => ({ from: index, to: index + 1, value: 1 }));
  edges.forEach((edge, index) => {
    const from = positions[edge.from],
      to = positions[edge.to];
    if (from && to) {
      line(
        grid,
        from.x,
        from.y,
        to.x,
        to.y,
        chart.type === "transit-map"
          ? charset === "ascii"
            ? "="
            : "━"
          : charset === "ascii"
            ? "."
            : "·",
        index,
      );
      if (["critical-path", "queue-timeline"].includes(chart.type))
        grid.set(to.x, to.y, charset === "ascii" ? ">" : "▶", "value");
    }
  });
  positions.forEach((position, index) => {
    grid.set(
      position.x,
      position.y,
      chart.type === "transit-map"
        ? charset === "ascii"
          ? "O"
          : "◉"
        : charset === "ascii"
          ? "o"
          : "●",
      "value",
      { foreground: `series${(index % 4) + 1}` as "series1" },
    );
    grid.text(
      Math.max(0, position.x - 3),
      position.y + 1,
      truncateText(labels[index] ?? "", 8, palette.ellipsis),
      "label",
    );
  });
  return finish(grid, chart);
}

function voronoi(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const seeds = chart.data.map((item, index) => ({
    x: item.x ?? index,
    y: item.y ?? index,
    label: item.label ?? String(index + 1),
    value: item.value ?? 1,
  }));
  const minX = Math.min(...seeds.map((s) => s.x)),
    maxX = Math.max(...seeds.map((s) => s.x));
  const minY = Math.min(...seeds.map((s) => s.y)),
    maxY = Math.max(...seeds.map((s) => s.y));
  for (let y = top; y < height - 2; y += 1)
    for (let x = 0; x < width; x += 1) {
      const sx = minX + (x / width) * (maxX - minX),
        sy = minY + ((y - top) / Math.max(1, height - top - 2)) * (maxY - minY);
      let nearest = 0,
        distance = Infinity;
      seeds.forEach((seed, index) => {
        const d = Math.hypot(seed.x - sx, seed.y - sy);
        if (d < distance) {
          nearest = index;
          distance = d;
        }
      });
      grid.set(
        x,
        y,
        charset === "ascii"
          ? ([".", ":", "+", "#"][nearest % 4] ?? ".")
          : (palette.density[(nearest % (palette.density.length - 1)) + 1] ??
              "·"),
        "series",
        { foreground: `series${(nearest % 4) + 1}` as "series1" },
      );
    }
  seeds.forEach((seed, index) =>
    grid.text(
      (index % 4) * Math.floor(width / 4),
      height - 1,
      seed.label,
      "label",
    ),
  );
  return finish(grid, chart);
}

function multiples(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const columns = 2,
    cardWidth = Math.floor(width / columns),
    cardHeight = Math.max(
      4,
      Math.floor((height - top) / Math.ceil(chart.series.length / columns)),
    );
  chart.series.forEach((item, index) => {
    const left = (index % columns) * cardWidth,
      cardTop = top + Math.floor(index / columns) * cardHeight,
      right = Math.min(width - 1, left + cardWidth - 2),
      bottom = Math.min(height - 1, cardTop + cardHeight - 1);
    const horizontal = charset === "ascii" ? "-" : "─";
    const vertical = charset === "ascii" ? "|" : "│";
    for (let x = left + 1; x < right; x += 1) {
      grid.set(x, cardTop, horizontal, "axis", { foreground: "muted" });
      grid.set(x, bottom, horizontal, "axis", { foreground: "muted" });
    }
    for (let y = cardTop + 1; y < bottom; y += 1) {
      grid.set(left, y, vertical, "axis", { foreground: "muted" });
      grid.set(right, y, vertical, "axis", { foreground: "muted" });
    }
    grid.set(left, cardTop, charset === "ascii" ? "+" : "┌", "axis");
    grid.set(right, cardTop, charset === "ascii" ? "+" : "┐", "axis");
    grid.set(left, bottom, charset === "ascii" ? "+" : "└", "axis");
    grid.set(right, bottom, charset === "ascii" ? "+" : "┘", "axis");
    grid.text(
      left + 2,
      cardTop,
      ` ${truncateText(item.label, Math.max(1, cardWidth - 6), palette.ellipsis)} `,
      "label",
      { bold: true },
    );
    const min = Math.min(...item.values),
      max = Math.max(...item.values);
    item.values.forEach((value, point) => {
      const x =
        left +
        1 +
        Math.round(
          (point / Math.max(1, item.values.length - 1)) *
            Math.max(1, right - left - 2),
        );
      const y =
        cardTop +
        1 +
        Math.round(
          ((max - value) / Math.max(1e-9, max - min)) *
            Math.max(1, bottom - cardTop - 2),
        );
      if (point > 0) {
        const previous = item.values[point - 1] ?? value;
        const px =
          left +
          1 +
          Math.round(
            ((point - 1) / Math.max(1, item.values.length - 1)) *
              Math.max(1, right - left - 2),
          );
        const py =
          cardTop +
          1 +
          Math.round(
            ((max - previous) / Math.max(1e-9, max - min)) *
              Math.max(1, bottom - cardTop - 2),
          );
        line(grid, px, py, x, y, charset === "ascii" ? "*" : "●", index);
      }
    });
  });
  return finish(grid, chart);
}

function financial(chart: NextChart, options: LayoutOptions): CellGrid {
  const { width, height, charset, palette, grid, top } = setup(chart, options);
  const items = chart.data;
  const highs = items.map((item) => item.high ?? item.value ?? 0),
    lows = items.map((item) => item.low ?? item.value ?? 0);
  const min = Math.min(...lows),
    max = Math.max(...highs),
    bottom = height - 3;
  const periodWidth = Math.max(9, Math.floor((width - 7) / items.length));
  const py = (v: number) =>
    top + Math.round(((max - v) / Math.max(1e-9, max - min)) * (bottom - top));
  items.forEach((item, index) => {
    const x = 7 + index * periodWidth;
    const low = item.low ?? item.value ?? 0,
      high = item.high ?? item.value ?? 0;
    const open = item.start ?? low,
      close = item.end ?? high;
    const y0 = py(high),
      y1 = py(low),
      volume = Math.max(2, Math.round(item.value ?? 10));
    for (let y = y0; y <= y1; y += 1) {
      const ratio = (y - y0) / Math.max(1, y1 - y0);
      const bid = Math.round(volume * ratio),
        ask = volume - bid;
      const imbalance =
        Math.max(bid, ask) >= Math.max(1, Math.min(bid, ask)) * 3;
      grid.text(
        x,
        y,
        `${String(bid).padStart(2)}${charset === "ascii" ? "x" : "×"}${String(ask).padEnd(2)}`,
        imbalance ? (bid > ask ? "negative" : "positive") : "value",
        {
          foreground: imbalance
            ? bid > ask
              ? "negative"
              : "positive"
            : (`series${(index % 4) + 1}` as "series1"),
          bold: imbalance,
        },
      );
    }
    grid.set(x - 1, py(open), charset === "ascii" ? "[" : "├", "axis");
    grid.set(
      x - 1,
      py(close),
      charset === "ascii" ? "]" : "┤",
      close >= open ? "positive" : "negative",
    );
    grid.text(
      x,
      height - 1,
      truncateText(
        item.label ?? `T${index + 1}`,
        periodWidth - 1,
        palette.ellipsis,
      ),
      "label",
    );
  });
  grid.text(0, top, formatValue(max), "label");
  grid.text(0, bottom, formatValue(min), "label");
  grid.text(0, height - 1, "bid×ask", "label", { foreground: "muted" });
  return finish(grid, chart);
}

export function layoutNextChart(
  chart: NextChart,
  options: LayoutOptions = {},
): CellGrid {
  switch (chart.type) {
    case "streamgraph":
    case "hovmoller":
    case "marimekko-timeline":
    case "spectrogram":
    case "cartogram":
      return raster(chart, options);
    case "slopegraph":
      return slope(chart, options);
    case "confusion-matrix":
    case "heatmap-dendrogram":
      return matrix(chart, options);
    case "sankey-timeline":
    case "clustered-dendrogram":
    case "queue-timeline":
    case "critical-path":
    case "transit-map":
      return network(chart, options);
    case "voronoi-map":
      return voronoi(chart, options);
    case "small-multiples":
      return multiples(chart, options);
    case "footprint":
      return financial(chart, options);
    case "lift-gains":
    case "forest-plot":
    case "bland-altman":
    case "waveform":
    case "renko":
    case "kagi":
      return cartesian(chart, options);
  }
}
