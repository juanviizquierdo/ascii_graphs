import { formatValue } from "./bar.js";
import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import { drawConnectedPath } from "./line.js";
import {
  validateDataLength,
  validateFiniteNumber,
  validateHeight,
  validateText,
  validateViewport,
  validateWidth,
} from "./validation.js";

import type {
  BubbleChart,
  BubbleChartInput,
  BubbleDatum,
  CellGrid,
  ConnectedScatterChart,
  ConnectedScatterChartInput,
  CorrelationMatrixChart,
  CorrelationMatrixChartInput,
  FlowChart,
  FlowChartInput,
  FlowLink,
  LayoutOptions,
  ParallelCoordinatesChart,
  ParallelCoordinatesChartInput,
  ParallelSeries,
  RadarChart,
  RadarChartInput,
  ScatterDatum,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;

function base(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}): void {
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
}

function fields(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  };
}

function heading(
  grid: GridBuilder,
  value: string | undefined,
  width: number,
  ellipsis: string,
) {
  if (value !== undefined)
    grid.text(0, 0, truncateText(value, width, ellipsis), "title", {
      foreground: "accent",
      bold: true,
    });
}

function pointPlot(
  data: readonly { label?: string; x: number; y: number }[],
  options: LayoutOptions,
  chart: {
    title?: string;
    description?: string;
    width?: number;
    height?: number;
  },
  draw: (
    grid: GridBuilder,
    points: readonly {
      datum: { label?: string; x: number; y: number };
      x: number;
      y: number;
    }[],
    charset: "ascii" | "unicode",
  ) => void,
  table: CellGrid["table"],
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotLeft = 7;
  const plotBottom = height - 2;
  const plotHeight = plotBottom - titleRows;
  if (plotHeight < 5 || width - plotLeft < 10)
    throw new RangeError(
      "layout viewport is too small for a relationship plot.",
    );
  const minX = Math.min(...data.map(({ x }) => x), 0);
  const maxX = Math.max(...data.map(({ x }) => x), 1);
  const minY = Math.min(...data.map(({ y }) => y), 0);
  const maxY = Math.max(...data.map(({ y }) => y), 1);
  const points = data.map((datum) => ({
    datum,
    x:
      plotLeft +
      Math.round(
        ((datum.x - minX) / Math.max(1e-9, maxX - minX)) *
          (width - plotLeft - 1),
      ),
    y:
      plotBottom -
      1 -
      Math.round(
        ((datum.y - minY) / Math.max(1e-9, maxY - minY)) * (plotHeight - 1),
      ),
  }));
  const grid = new GridBuilder(width, height);
  heading(grid, chart.title, width, palette.ellipsis);
  for (let x = plotLeft - 1; x < width; x += 1)
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  for (let y = titleRows; y <= plotBottom; y += 1)
    grid.set(plotLeft - 1, y, palette.baseline, "axis", {
      foreground: "muted",
    });
  draw(grid, points, charset);
  grid.text(0, titleRows, formatValue(maxY), "label", { foreground: "muted" });
  grid.text(0, plotBottom - 1, formatValue(minY), "label", {
    foreground: "muted",
  });
  grid.text(plotLeft, height - 1, formatValue(minX), "label", {
    foreground: "muted",
  });
  const maxLabel = formatValue(maxX);
  grid.text(width - measureText(maxLabel), height - 1, maxLabel, "label", {
    foreground: "muted",
  });
  return grid.build(
    chart.description ??
      `${chart.title ?? table.caption}. ${data.length} points.`,
    table,
  );
}

export function bubble(input: BubbleChartInput): BubbleChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("bubble input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly BubbleDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (datum.label !== undefined)
        validateText(datum.label, `data[${index}].label`);
      validateFiniteNumber(datum.x, `data[${index}].x`);
      validateFiniteNumber(datum.y, `data[${index}].y`);
      validateFiniteNumber(datum.size, `data[${index}].size`);
      if (datum.size < 0)
        throw new RangeError(`data[${index}].size cannot be negative.`);
      return Object.freeze({ ...datum });
    }),
  );
  base(input);
  return Object.freeze({ type: "bubble", data, ...fields(input) });
}

export function layoutBubble(
  chart: BubbleChart,
  options: LayoutOptions = {},
): CellGrid {
  const sizes = chart.data.map(({ size }) => size);
  const minimum = Math.min(...sizes, 0);
  const maximum = Math.max(...sizes, 1);
  return pointPlot(
    chart.data,
    options,
    chart,
    (grid, points, charset) => {
      points.forEach(({ datum, x, y }) => {
        const size = (datum as BubbleDatum).size;
        const level = Math.round(
          ((size - minimum) / Math.max(1e-9, maximum - minimum)) * 2,
        );
        const glyph = charset === "ascii" ? ["o", "O", "@"] : ["○", "●", "⬤"];
        grid.set(
          x,
          y,
          glyph[level] ?? glyph[0] ?? "o",
          "series",
          { foreground: "series1", bold: level > 0 },
          { label: datum.label ?? String(x), value: size },
        );
      });
    },
    {
      caption: chart.title ?? "Bubble chart",
      columns: [
        { key: "label", label: "Label" },
        { key: "x", label: "X" },
        { key: "y", label: "Y" },
        { key: "size", label: "Size" },
      ],
      rows: chart.data.map(({ label, x, y, size }) => ({ label, x, y, size })),
    },
  );
}

export function connectedScatter(
  input: ConnectedScatterChartInput,
): ConnectedScatterChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("connected scatter input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly ScatterDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (datum.label !== undefined)
        validateText(datum.label, `data[${index}].label`);
      validateFiniteNumber(datum.x, `data[${index}].x`);
      validateFiniteNumber(datum.y, `data[${index}].y`);
      return Object.freeze({ ...datum });
    }),
  );
  base(input);
  return Object.freeze({ type: "connected-scatter", data, ...fields(input) });
}

export function layoutConnectedScatter(
  chart: ConnectedScatterChart,
  options: LayoutOptions = {},
): CellGrid {
  return pointPlot(
    chart.data,
    options,
    chart,
    (grid, points, charset) => {
      points.forEach((point, index) => {
        const previous = points[index - 1];
        if (previous !== undefined) {
          const steps = Math.max(
            Math.abs(point.x - previous.x),
            Math.abs(point.y - previous.y),
          );
          for (let step = 0; step <= steps; step += 1) {
            const ratio = steps === 0 ? 0 : step / steps;
            grid.set(
              Math.round(previous.x + (point.x - previous.x) * ratio),
              Math.round(previous.y + (point.y - previous.y) * ratio),
              charset === "ascii" ? "." : "·",
              "series",
              { foreground: "series1" },
            );
          }
        }
        grid.set(
          point.x,
          point.y,
          charset === "ascii" ? "o" : "●",
          "series",
          { foreground: "accent", bold: true },
          { label: point.datum.label ?? String(index), value: point.datum.y },
        );
      });
    },
    {
      caption: chart.title ?? "Connected scatter chart",
      columns: [
        { key: "label", label: "Label" },
        { key: "x", label: "X" },
        { key: "y", label: "Y" },
      ],
      rows: chart.data.map(({ label, x, y }, index) => ({
        label: label ?? String(index),
        x,
        y,
      })),
    },
  );
}

export function correlationMatrix(
  input: CorrelationMatrixChartInput,
): CorrelationMatrixChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("correlation matrix input must be an object.");
  if (!Array.isArray(input.labels) || !Array.isArray(input.values))
    throw new TypeError("labels and values must be arrays.");
  if (input.values.length !== input.labels.length)
    throw new RangeError("values must be a square matrix matching labels.");
  input.labels.forEach((label, index) =>
    validateText(label, `labels[${index}]`),
  );
  const values = Object.freeze(
    input.values.map((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== input.labels.length)
        throw new RangeError("values must be a square matrix matching labels.");
      row.forEach((value, columnIndex) => {
        validateFiniteNumber(value, `values[${rowIndex}][${columnIndex}]`);
        if (value < -1 || value > 1)
          throw new RangeError("correlations must be between -1 and 1.");
      });
      return Object.freeze([...row]);
    }),
  );
  base(input);
  return Object.freeze({
    type: "correlation-matrix",
    labels: Object.freeze([...input.labels]),
    values,
    ...fields(input),
  });
}

export function layoutCorrelationMatrix(
  chart: CorrelationMatrixChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const height =
    options.height ?? chart.height ?? titleRows + chart.labels.length + 3;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.labels.map(measureText)),
    Math.floor(width * 0.25),
  );
  const cellWidth = Math.max(
    2,
    Math.min(
      5,
      Math.floor((width - labelWidth - 1) / Math.max(1, chart.labels.length)),
    ),
  );
  const grid = new GridBuilder(width, height);
  heading(grid, chart.title, width, palette.ellipsis);
  chart.labels.forEach((label, index) =>
    grid.text(
      labelWidth + 1 + index * cellWidth,
      titleRows,
      truncateText(label, cellWidth, palette.ellipsis),
      "label",
      { foreground: "muted" },
    ),
  );
  const glyphs =
    charset === "ascii" ? ["-", ".", "+", "#"] : ["▓", "░", "▒", "█"];
  chart.values.forEach((row, rowIndex) => {
    grid.text(
      0,
      titleRows + 1 + rowIndex,
      truncateText(chart.labels[rowIndex] ?? "", labelWidth, palette.ellipsis),
      "label",
    );
    row.forEach((value, columnIndex) => {
      const level = Math.min(3, Math.floor(Math.abs(value) * 4));
      const glyph = glyphs[level] ?? glyphs[0] ?? ".";
      grid.text(
        labelWidth + 1 + columnIndex * cellWidth,
        titleRows + 1 + rowIndex,
        `${value < 0 ? "-" : " "}${glyph}`,
        "series",
        { foreground: value < 0 ? "negative" : "positive" },
        {
          label: `${chart.labels[rowIndex]} / ${chart.labels[columnIndex]}`,
          value,
        },
      );
    });
  });
  const headingText = chart.title ?? "Correlation matrix";
  return grid.build(
    chart.description ?? `${headingText}. ${chart.labels.length} variables.`,
    {
      caption: headingText,
      columns: [
        { key: "label", label: "Variable" },
        ...chart.labels.map((label, index) => ({
          key: `value_${index}`,
          label: label ?? "",
        })),
      ],
      rows: chart.values.map((row, index) => ({
        label: chart.labels[index] ?? String(index),
        ...Object.fromEntries(
          row.map((value, column) => [`value_${column}`, value]),
        ),
      })),
    },
  );
}

export function radar(input: RadarChartInput): RadarChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("radar input must be an object.");
  if (
    !Array.isArray(input.axes) ||
    !Array.isArray(input.values) ||
    input.axes.length !== input.values.length ||
    input.axes.length < 3
  )
    throw new RangeError(
      "radar axes and values must have the same length of at least 3.",
    );
  input.axes.forEach((axis, index) => validateText(axis, `axes[${index}]`));
  input.values.forEach((value, index) => {
    validateFiniteNumber(value, `values[${index}]`);
    if (value < 0) throw new RangeError("radar values cannot be negative.");
  });
  const maximum = input.max ?? Math.max(...input.values, 1);
  validateFiniteNumber(maximum, "max");
  if (maximum <= 0 || input.values.some((value) => value > maximum))
    throw new RangeError("radar max must be positive and cover all values.");
  base(input);
  return Object.freeze({
    type: "radar",
    axes: Object.freeze([...input.axes]),
    values: Object.freeze([...input.values]),
    max: maximum,
    ...fields(input),
  });
}

interface RadarPoint {
  x: number;
  y: number;
}

function radarLineGlyph(
  charset: "ascii" | "unicode",
  from: RadarPoint,
  to: RadarPoint,
  series: boolean,
): string {
  if (!series) return charset === "ascii" ? "." : "·";
  if (charset === "ascii") return "*";
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.8;
  const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.8;
  if (horizontal) return series ? "━" : "─";
  if (vertical) return series ? "┃" : "│";
  return deltaX * deltaY >= 0 ? "╲" : "╱";
}

function drawRadarSegment(
  grid: GridBuilder,
  charset: "ascii" | "unicode",
  from: RadarPoint,
  to: RadarPoint,
  series: boolean,
): void {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  const glyph = radarLineGlyph(charset, from, to, series);
  for (let step = 0; step <= steps; step += 1) {
    grid.set(
      Math.round(from.x + ((to.x - from.x) * step) / Math.max(1, steps)),
      Math.round(from.y + ((to.y - from.y) * step) / Math.max(1, steps)),
      glyph,
      series ? "series" : "axis",
      series ? { foreground: "series1", bold: true } : { foreground: "muted" },
    );
  }
}

function insideRadarPolygon(
  x: number,
  y: number,
  polygon: readonly RadarPoint[],
): boolean {
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    if (currentPoint === undefined || previousPoint === undefined) continue;
    const crosses =
      currentPoint.y > y !== previousPoint.y > y &&
      x <
        ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function layoutRadar(
  chart: RadarChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? 45;
  const height = options.height ?? chart.height ?? 17;
  validateViewport(width, height);
  if (width < 24 || height < (chart.title === undefined ? 9 : 11))
    throw new RangeError(
      "layout viewport is too small for a readable radar chart.",
    );
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const centerX = Math.floor(width / 2);
  const labelWidth = Math.max(
    4,
    Math.min(
      14,
      Math.floor(width * 0.22),
      Math.max(...chart.axes.map((axis) => measureText(axis))),
    ),
  );
  const radiusX = Math.max(
    3,
    Math.min(14, Math.floor((width - labelWidth * 2 - 4) / 2)),
  );
  const radiusY = Math.max(
    3,
    Math.min(6, Math.floor((height - titleRows - 3) / 2)),
  );
  const centerY = titleRows + radiusY + 1;
  const grid = new GridBuilder(width, height);
  heading(grid, chart.title, width, palette.ellipsis);
  const axes = chart.axes.map((axis, index) => {
    const angle = -Math.PI / 2 + (index / chart.axes.length) * Math.PI * 2;
    return {
      axis,
      angle,
      cosine: Math.cos(angle),
      sine: Math.sin(angle),
      endpoint: {
        x: centerX + Math.round(Math.cos(angle) * radiusX),
        y: centerY + Math.round(Math.sin(angle) * radiusY),
      },
    };
  });

  for (const scale of [0.5, 1]) {
    const ring = axes.map(({ cosine, sine }) => ({
      x: centerX + Math.round(cosine * radiusX * scale),
      y: centerY + Math.round(sine * radiusY * scale),
    }));
    ring.forEach((point, index) => {
      const next = ring[(index + 1) % ring.length];
      if (next !== undefined)
        drawRadarSegment(grid, charset, point, next, false);
    });
  }
  axes.forEach(({ endpoint }) =>
    drawRadarSegment(
      grid,
      charset,
      { x: centerX, y: centerY },
      endpoint,
      false,
    ),
  );
  grid.set(centerX, centerY, charset === "unicode" ? "┼" : "+", "axis", {
    foreground: "muted",
  });

  const points = axes.map(({ axis, angle, cosine, sine }, index) => {
    const ratio = (chart.values[index] ?? 0) / chart.max;
    return {
      x: centerX + Math.round(Math.cos(angle) * radiusX * ratio),
      y: centerY + Math.round(Math.sin(angle) * radiusY * ratio),
      axis,
      value: chart.values[index] ?? 0,
      cosine,
      sine,
    };
  });

  const minimumX = Math.min(...points.map(({ x }) => x));
  const maximumX = Math.max(...points.map(({ x }) => x));
  const minimumY = Math.min(...points.map(({ y }) => y));
  const maximumY = Math.max(...points.map(({ y }) => y));
  for (let y = minimumY; y <= maximumY; y += 1) {
    for (let x = minimumX; x <= maximumX; x += 1) {
      if (
        insideRadarPolygon(x + 0.5, y + 0.5, points) &&
        grid.rows[y]?.[x]?.role === "empty"
      )
        grid.set(x, y, charset === "unicode" ? "░" : ":", "series", {
          foreground: "series1",
        });
    }
  }
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    if (next === undefined) return;
    drawRadarSegment(grid, charset, point, next, true);
  });
  points.forEach((point) => {
    grid.set(
      point.x,
      point.y,
      charset === "ascii" ? "o" : "●",
      "series",
      { foreground: "accent" },
      { label: point.axis, value: point.value },
    );
  });
  axes.forEach(({ axis, cosine, sine, endpoint }) => {
    const label = truncateText(axis, labelWidth, palette.ellipsis);
    const measured = measureText(label);
    const vertical = Math.abs(cosine) < 0.3;
    const x = vertical
      ? endpoint.x - Math.floor(measured / 2)
      : cosine > 0
        ? endpoint.x + 2
        : endpoint.x - measured - 2;
    const y = vertical
      ? endpoint.y + (sine > 0 ? 1 : -1)
      : endpoint.y + (Math.abs(sine) < 0.35 ? 0 : sine > 0 ? 1 : -1);
    grid.text(
      Math.max(0, Math.min(width - measured, x)),
      Math.max(titleRows, Math.min(height - 1, y)),
      label,
      "label",
      { foreground: "muted" },
    );
  });
  const headingText = chart.title ?? "Radar chart";
  return grid.build(
    chart.description ??
      `${headingText}. ${chart.axes.length} axes on a 0 to ${formatValue(chart.max)} scale.`,
    {
      caption: headingText,
      columns: [
        { key: "axis", label: "Axis" },
        { key: "value", label: "Value" },
      ],
      rows: chart.axes.map((axis, index) => ({
        axis,
        value: chart.values[index] ?? 0,
      })),
    },
  );
}

export function parallelCoordinates(
  input: ParallelCoordinatesChartInput,
): ParallelCoordinatesChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("parallel coordinates input must be an object.");
  if (
    !Array.isArray(input.axes) ||
    input.axes.length < 2 ||
    !Array.isArray(input.series)
  )
    throw new RangeError(
      "parallel coordinates require at least two axes and a series array.",
    );
  input.axes.forEach((axis, index) => validateText(axis, `axes[${index}]`));
  const series: readonly ParallelSeries[] = Object.freeze(
    input.series.map((item, itemIndex) => {
      validateText(item.label, `series[${itemIndex}].label`);
      if (
        !Array.isArray(item.values) ||
        item.values.length !== input.axes.length
      )
        throw new RangeError(
          `series[${itemIndex}].values must match axes length.`,
        );
      item.values.forEach((value: number, index: number) =>
        validateFiniteNumber(value, `series[${itemIndex}].values[${index}]`),
      );
      return Object.freeze({
        label: item.label,
        values: Object.freeze([...item.values]),
      });
    }),
  );
  base(input);
  return Object.freeze({
    type: "parallel-coordinates",
    axes: Object.freeze([...input.axes]),
    series,
    ...fields(input),
  });
}

export function layoutParallelCoordinates(
  chart: ParallelCoordinatesChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotBottom = height - 2;
  const plotHeight = plotBottom - titleRows;
  const grid = new GridBuilder(width, height);
  heading(grid, chart.title, width, palette.ellipsis);
  const positions = chart.axes.map((_, index) =>
    Math.round((index / Math.max(1, chart.axes.length - 1)) * (width - 1)),
  );
  const mins = chart.axes.map((_, axis) =>
    Math.min(...chart.series.map(({ values }) => values[axis] ?? 0), 0),
  );
  const maxs = chart.axes.map((_, axis) =>
    Math.max(...chart.series.map(({ values }) => values[axis] ?? 0), 1),
  );
  positions.forEach((x, index) => {
    for (let y = titleRows; y <= plotBottom; y += 1)
      grid.set(x, y, palette.baseline, "axis", { foreground: "muted" });
    grid.text(
      Math.max(
        0,
        Math.min(
          width - 1,
          x - Math.floor(measureText(chart.axes[index] ?? "") / 2),
        ),
      ),
      height - 1,
      chart.axes[index] ?? "",
      "label",
      { foreground: "muted" },
    );
  });
  chart.series.forEach((item, seriesIndex) => {
    positions.forEach((x, axisIndex) => {
      const value = item.values[axisIndex] ?? 0;
      const y =
        plotBottom -
        Math.round(
          ((value - (mins[axisIndex] ?? 0)) /
            Math.max(1e-9, (maxs[axisIndex] ?? 1) - (mins[axisIndex] ?? 0))) *
            plotHeight,
        );
      const previousX = positions[axisIndex - 1];
      if (previousX !== undefined) {
        const previousValue = item.values[axisIndex - 1] ?? 0;
        const previousY =
          plotBottom -
          Math.round(
            ((previousValue - (mins[axisIndex - 1] ?? 0)) /
              Math.max(
                1e-9,
                (maxs[axisIndex - 1] ?? 1) - (mins[axisIndex - 1] ?? 0),
              )) *
              plotHeight,
          );
        for (let drawX = previousX; drawX <= x; drawX += 1) {
          const ratio =
            x === previousX ? 0 : (drawX - previousX) / (x - previousX);
          grid.set(
            drawX,
            Math.round(previousY + (y - previousY) * ratio),
            charset === "ascii"
              ? String((seriesIndex % 9) + 1)
              : (["●", "◆", "■", "▲"][seriesIndex % 4] ?? "●"),
            "series",
            { foreground: `series${(seriesIndex % 4) + 1}` as "series1" },
            { label: item.label, value },
          );
        }
      }
    });
  });
  const headingText = chart.title ?? "Parallel coordinates";
  return grid.build(
    chart.description ??
      `${headingText}. ${chart.series.length} series across ${chart.axes.length} axes.`,
    {
      caption: headingText,
      columns: [
        { key: "label", label: "Label" },
        ...chart.axes.map((axis, index) => ({
          key: `axis_${index}`,
          label: axis,
        })),
      ],
      rows: chart.series.map((item) => ({
        label: item.label,
        ...Object.fromEntries(
          item.values.map((value, index) => [`axis_${index}`, value]),
        ),
      })),
    },
  );
}

export function flow(input: FlowChartInput): FlowChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("flow input must be an object.");
  if (!Array.isArray(input.links))
    throw new TypeError("links must be an array.");
  validateDataLength(input.links.length, "links");
  const links: readonly FlowLink[] = Object.freeze(
    input.links.map((link, index) => {
      validateText(link.source, `links[${index}].source`);
      validateText(link.target, `links[${index}].target`);
      validateFiniteNumber(link.value, `links[${index}].value`);
      if (link.value < 0)
        throw new RangeError(`links[${index}].value cannot be negative.`);
      return Object.freeze({ ...link });
    }),
  );
  if (
    input.mode !== undefined &&
    input.mode !== "sankey" &&
    input.mode !== "alluvial"
  )
    throw new TypeError("mode must be sankey or alluvial.");
  base(input);
  return Object.freeze({
    type: "flow",
    links,
    mode: input.mode ?? "sankey",
    ...fields(input),
  });
}

export function layoutFlow(
  chart: FlowChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const sources = [...new Set(chart.links.map(({ source }) => source))];
  const targets = [...new Set(chart.links.map(({ target }) => target))];
  const nodeRows = Math.max(1, sources.length, targets.length);
  const height =
    options.height ?? chart.height ?? titleRows + Math.max(5, nodeRows * 3);
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  heading(grid, chart.title, width, palette.ellipsis);
  const leftWidth = Math.min(
    Math.max(4, ...sources.map(measureText)),
    Math.floor(width * 0.25),
  );
  const rightWidth = Math.min(
    Math.max(4, ...targets.map(measureText)),
    Math.floor(width * 0.25),
  );
  const startX = leftWidth + 1;
  const endX = width - rightWidth - 2;
  if (endX - startX < 8)
    throw new RangeError("layout width is too narrow for a routed flow chart.");
  const plotTop = titleRows;
  const plotBottom = height - 1;
  const positionNodes = (labels: readonly string[]) =>
    new Map(
      labels.map((label, index) => [
        label,
        labels.length === 1
          ? Math.round((plotTop + plotBottom) / 2)
          : plotTop +
            Math.round(
              (index / Math.max(1, labels.length - 1)) * (plotBottom - plotTop),
            ),
      ]),
    );
  const sourceRows = positionNodes(sources);
  const targetRows = positionNodes(targets);
  const maximum = Math.max(1, ...chart.links.map(({ value }) => value));
  chart.links.forEach((link, index) => {
    const sourceY = sourceRows.get(link.source) ?? plotTop;
    const targetY = targetRows.get(link.target) ?? plotTop;
    const thickness = Math.max(
      1,
      Math.round((link.value / maximum) * (chart.mode === "alluvial" ? 3 : 2)),
    );
    const laneStart = startX + Math.max(2, Math.floor((endX - startX) * 0.2));
    const laneEnd = endX - Math.max(2, Math.floor((endX - startX) * 0.2));
    const laneX =
      chart.links.length <= 1
        ? Math.round((startX + endX) / 2)
        : laneStart +
          Math.round(
            (index / Math.max(1, chart.links.length - 1)) *
              (laneEnd - laneStart),
          );
    for (let offset = 0; offset < thickness; offset += 1) {
      const centeredOffset = offset - Math.floor((thickness - 1) / 2);
      drawConnectedPath(
        grid,
        charset,
        [
          {
            x: startX,
            y: Math.max(
              plotTop,
              Math.min(plotBottom, sourceY + centeredOffset),
            ),
          },
          {
            x: laneX,
            y: Math.max(
              plotTop,
              Math.min(plotBottom, sourceY + centeredOffset),
            ),
          },
          {
            x: laneX,
            y: Math.max(
              plotTop,
              Math.min(plotBottom, targetY + centeredOffset),
            ),
          },
          {
            x: endX,
            y: Math.max(
              plotTop,
              Math.min(plotBottom, targetY + centeredOffset),
            ),
          },
        ],
        "step",
        { foreground: `series${(index % 4) + 1}` as "series1" },
      );
    }
    grid.set(
      endX,
      targetY,
      charset === "ascii" ? ">" : "▶",
      "series",
      { foreground: "accent" },
      { label: link.target, value: link.value },
    );
  });
  sources.forEach((source, index) => {
    const y = sourceRows.get(source) ?? plotTop;
    grid.text(
      0,
      y,
      truncateText(source, leftWidth, palette.ellipsis),
      "label",
      { foreground: `series${(index % 4) + 1}` as "series1", bold: true },
    );
    grid.set(startX, y, charset === "ascii" ? "]" : "●", "series", {
      foreground: `series${(index % 4) + 1}` as "series1",
      bold: true,
    });
  });
  targets.forEach((target) => {
    const y = targetRows.get(target) ?? plotTop;
    grid.text(
      endX + 2,
      y,
      truncateText(target, rightWidth, palette.ellipsis),
      "label",
      { foreground: "accent", bold: true },
    );
  });
  if (chart.links.length === 0)
    grid.text(0, titleRows, "No flows", "missing", { foreground: "muted" });
  const headingText =
    chart.title ??
    (chart.mode === "alluvial" ? "Alluvial diagram" : "Sankey diagram");
  return grid.build(
    chart.description ??
      `${headingText}. ${chart.links.length} weighted flows.`,
    {
      caption: headingText,
      columns: [
        { key: "source", label: "Source" },
        { key: "target", label: "Target" },
        { key: "value", label: "Value" },
      ],
      rows: chart.links.map(({ source, target, value }) => ({
        source,
        target,
        value,
      })),
    },
  );
}
