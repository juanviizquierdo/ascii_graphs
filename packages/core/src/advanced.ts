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
  ChartBase,
  ChordChart,
  ChordChartInput,
  ControlChart,
  ControlChartInput,
  HexbinChart,
  HexbinChartInput,
  HexbinDatum,
  LayoutOptions,
  MosaicChart,
  MosaicChartInput,
  RidgelineChart,
  RidgelineChartInput,
  RidgelineSeries,
  StackedBarRow,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 16;

function validateBase(input: ChartBase): void {
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
}

function baseFields(input: ChartBase) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  };
}

function drawTitle(
  grid: GridBuilder,
  chart: ChartBase,
  width: number,
  ellipsis: string,
): number {
  if (chart.title === undefined) return 0;
  grid.text(0, 0, truncateText(chart.title, width, ellipsis), "title", {
    foreground: "accent",
    bold: true,
  });
  return 2;
}

function densityAt(
  values: readonly number[],
  minimum: number,
  maximum: number,
  samples: number,
): number[] {
  if (values.length === 0) return Array.from({ length: samples }, () => 0);
  const span = Math.max(1e-9, maximum - minimum);
  const bandwidth = Math.max(span / 14, span / Math.sqrt(values.length) / 2);
  return Array.from({ length: samples }, (_, index) => {
    const position = minimum + (index / Math.max(1, samples - 1)) * span;
    return values.reduce((sum, value) => {
      const distance = (position - value) / bandwidth;
      return sum + Math.exp(-0.5 * distance * distance);
    }, 0);
  });
}

export function ridgeline(input: RidgelineChartInput): RidgelineChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("ridgeline input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  validateDataLength(input.series.length, "series");
  const series: readonly RidgelineSeries[] = Object.freeze(
    input.series.map((item, seriesIndex) => {
      if (typeof item !== "object" || item === null)
        throw new TypeError(`series[${seriesIndex}] must be an object.`);
      validateText(item.label, `series[${seriesIndex}].label`);
      if (!Array.isArray(item.values))
        throw new TypeError(`series[${seriesIndex}].values must be an array.`);
      validateDataLength(item.values.length, `series[${seriesIndex}].values`);
      item.values.forEach((value: number, valueIndex: number) =>
        validateFiniteNumber(
          value,
          `series[${seriesIndex}].values[${valueIndex}]`,
        ),
      );
      return Object.freeze({
        label: item.label,
        values: Object.freeze([...item.values]),
      });
    }),
  );
  validateBase(input);
  return Object.freeze({
    type: "ridgeline",
    series,
    ...baseFields(input),
  });
}

export function layoutRidgeline(
  chart: RidgelineChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.series.length) + 2;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; ridgeline requires ${naturalHeight} rows.`,
    );
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart, width, palette.ellipsis);
  const labelWidth = Math.min(
    Math.max(1, ...chart.series.map(({ label }) => measureText(label))),
    Math.floor(width * 0.28),
  );
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX;
  const allValues = chart.series.flatMap(({ values }) => values);
  const minimum = allValues.length === 0 ? 0 : Math.min(...allValues);
  const maximum = allValues.length === 0 ? 1 : Math.max(...allValues);
  const profiles = chart.series.map(({ values }) =>
    densityAt(values, minimum, maximum, plotWidth),
  );
  const maxDensity = Math.max(1e-9, ...profiles.flat());

  if (chart.series.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  }
  chart.series.forEach((item, rowIndex) => {
    const y = titleRows + rowIndex;
    grid.text(
      0,
      y,
      truncateText(item.label, labelWidth, palette.ellipsis),
      "label",
    );
    const profile = profiles[rowIndex] ?? [];
    profile.forEach((value, index) => {
      const level = Math.min(
        palette.density.length - 1,
        Math.floor((value / maxDensity) * palette.density.length),
      );
      grid.set(
        plotX + index,
        y,
        palette.density[level] ?? palette.density[0] ?? ".",
        "series",
        { foreground: `series${(rowIndex % 4) + 1}` as "series1" },
        { label: item.label, value },
      );
    });
  });
  if (chart.series.length > 0) {
    const axisY = titleRows + chart.series.length;
    for (let x = plotX; x < width; x += 1)
      grid.set(x, axisY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    grid.text(plotX, axisY + 1, formatValue(minimum), "label", {
      foreground: "muted",
    });
    const maximumLabel = formatValue(maximum);
    grid.text(
      width - measureText(maximumLabel),
      axisY + 1,
      maximumLabel,
      "label",
      { foreground: "muted" },
    );
  }
  const heading = chart.title ?? "Ridgeline plot";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.series.length} distributions on a shared scale.`,
    {
      caption: heading,
      columns: [
        { key: "series", label: "Series" },
        { key: "index", label: "Observation" },
        { key: "value", label: "Value" },
      ],
      rows: chart.series.flatMap((item) =>
        item.values.map((value, index) => ({
          series: item.label,
          index: index + 1,
          value,
        })),
      ),
    },
  );
}

export function hexbin(input: HexbinChartInput): HexbinChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("hexbin input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly HexbinDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`data[${index}] must be an object.`);
      validateFiniteNumber(datum.x, `data[${index}].x`);
      validateFiniteNumber(datum.y, `data[${index}].y`);
      if (datum.label !== undefined)
        validateText(datum.label, `data[${index}].label`);
      return Object.freeze({ ...datum });
    }),
  );
  if (
    input.bins !== undefined &&
    (!Number.isInteger(input.bins) || input.bins < 2 || input.bins > 80)
  )
    throw new RangeError("bins must be an integer between 2 and 80.");
  validateBase(input);
  return Object.freeze({
    type: "hexbin",
    data,
    bins: input.bins ?? 12,
    ...baseFields(input),
  });
}

export function layoutHexbin(
  chart: HexbinChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const titleRows = drawTitle(grid, chart, width, palette.ellipsis);
  const plotLeft = 7;
  const plotBottom = height - 2;
  const plotWidth = width - plotLeft;
  const plotHeight = plotBottom - titleRows;
  if (plotWidth < 10 || plotHeight < 5)
    throw new RangeError("layout viewport is too small for a hexbin plot.");
  const minX = Math.min(...chart.data.map(({ x }) => x), 0);
  const maxX = Math.max(...chart.data.map(({ x }) => x), 1);
  const minY = Math.min(...chart.data.map(({ y }) => y), 0);
  const maxY = Math.max(...chart.data.map(({ y }) => y), 1);
  const columns = Math.min(chart.bins, plotWidth);
  const rows = Math.min(Math.max(2, Math.round(chart.bins * 0.55)), plotHeight);
  const counts = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => 0),
  );
  chart.data.forEach(({ x, y }) => {
    const row = Math.min(
      rows - 1,
      Math.floor(((maxY - y) / Math.max(1e-9, maxY - minY)) * rows),
    );
    const offset = row % 2 === 0 ? 0 : 0.5;
    const column = Math.max(
      0,
      Math.min(
        columns - 1,
        Math.floor(
          ((x - minX) / Math.max(1e-9, maxX - minX)) * columns - offset,
        ),
      ),
    );
    const countRow = counts[row];
    if (countRow !== undefined) countRow[column] = (countRow[column] ?? 0) + 1;
  });
  const maximumCount = Math.max(1, ...counts.flat());
  const glyphs =
    charset === "ascii" ? [".", "o", "O", "@"] : ["░", "▒", "▓", "█"];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const count = counts[row]?.[column] ?? 0;
      if (count === 0) continue;
      const x =
        plotLeft +
        Math.min(
          plotWidth - 1,
          Math.round(
            ((column + (row % 2 === 0 ? 0 : 0.5)) / columns) * (plotWidth - 1),
          ),
        );
      const y =
        titleRows +
        Math.round((row / Math.max(1, rows - 1)) * (plotHeight - 1));
      const level = Math.min(
        glyphs.length - 1,
        Math.ceil((count / maximumCount) * glyphs.length) - 1,
      );
      grid.set(
        x,
        y,
        glyphs[level] ?? "@",
        "series",
        {
          foreground: "series1",
          bold: level === glyphs.length - 1,
        },
        { label: "Bin count", value: count },
      );
    }
  }
  for (let x = plotLeft - 1; x < width; x += 1)
    grid.set(x, plotBottom, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  for (let y = titleRows; y <= plotBottom; y += 1)
    grid.set(plotLeft - 1, y, palette.baseline, "axis", {
      foreground: "muted",
    });
  grid.text(0, titleRows, formatValue(maxY), "label", {
    foreground: "muted",
  });
  grid.text(0, plotBottom - 1, formatValue(minY), "label", {
    foreground: "muted",
  });
  grid.text(plotLeft, height - 1, formatValue(minX), "label", {
    foreground: "muted",
  });
  const maxXLabel = formatValue(maxX);
  grid.text(width - measureText(maxXLabel), height - 1, maxXLabel, "label", {
    foreground: "muted",
  });
  const heading = chart.title ?? "Hexbin plot";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} points aggregated into staggered density bins.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "x", label: "X" },
        { key: "y", label: "Y" },
      ],
      rows: chart.data.map(({ label, x, y }, index) => ({
        label: label ?? String(index + 1),
        x,
        y,
      })),
    },
  );
}

export function controlChart(input: ControlChartInput): ControlChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("control chart input must be an object.");
  if (!Array.isArray(input.values))
    throw new TypeError("values must be an array.");
  validateDataLength(input.values.length, "values");
  input.values.forEach((value, index) =>
    validateFiniteNumber(value, `values[${index}]`),
  );
  if (input.labels !== undefined) {
    if (
      !Array.isArray(input.labels) ||
      input.labels.length !== input.values.length
    )
      throw new RangeError("labels must be an array matching values length.");
    input.labels.forEach((label, index) =>
      validateText(label, `labels[${index}]`),
    );
  }
  for (const key of ["center", "upperLimit", "lowerLimit"] as const)
    if (input[key] !== undefined) validateFiniteNumber(input[key], key);
  const mean =
    input.values.length === 0
      ? 0
      : input.values.reduce((sum, value) => sum + value, 0) /
        input.values.length;
  const variance =
    input.values.length === 0
      ? 0
      : input.values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        input.values.length;
  const deviation = Math.sqrt(variance);
  const center = input.center ?? mean;
  const upperLimit = input.upperLimit ?? center + deviation * 3;
  const lowerLimit = input.lowerLimit ?? center - deviation * 3;
  if (lowerLimit > center || center > upperLimit)
    throw new RangeError(
      "control limits must satisfy lowerLimit <= center <= upperLimit.",
    );
  validateBase(input);
  return Object.freeze({
    type: "control",
    values: Object.freeze([...input.values]),
    labels: Object.freeze(
      input.labels === undefined
        ? input.values.map((_, index) => String(index + 1))
        : [...input.labels],
    ),
    center,
    upperLimit,
    lowerLimit,
    ...baseFields(input),
  });
}

function drawLine(
  grid: GridBuilder,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  glyph: string,
  style: {
    foreground: "muted" | "series1" | "series2" | "series3" | "series4";
  },
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let step = 0; step <= steps; step += 1) {
    const ratio = steps === 0 ? 0 : step / steps;
    grid.set(
      Math.round(x0 + (x1 - x0) * ratio),
      Math.round(y0 + (y1 - y0) * ratio),
      glyph,
      "series",
      style,
    );
  }
}

export function layoutControl(
  chart: ControlChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const titleRows = drawTitle(grid, chart, width, palette.ellipsis);
  const plotLeft = 8;
  const plotBottom = height - 2;
  const plotHeight = plotBottom - titleRows;
  if (width - plotLeft < 10 || plotHeight < 5)
    throw new RangeError("layout viewport is too small for a control chart.");
  const minimum = Math.min(chart.lowerLimit, ...chart.values);
  const maximum = Math.max(chart.upperLimit, ...chart.values);
  const toY = (value: number) =>
    titleRows +
    Math.round(
      ((maximum - value) / Math.max(1e-9, maximum - minimum)) *
        (plotHeight - 1),
    );
  const rules = [
    {
      label: "UCL",
      value: chart.upperLimit,
      glyph: charset === "ascii" ? "!" : "┄",
    },
    { label: "AVG", value: chart.center, glyph: palette.horizontalAxis },
    {
      label: "LCL",
      value: chart.lowerLimit,
      glyph: charset === "ascii" ? "!" : "┄",
    },
  ];
  rules.forEach(({ label, value, glyph }) => {
    const y = toY(value);
    grid.text(0, y, label, "label", { foreground: "muted" });
    for (let x = plotLeft; x < width; x += 1)
      grid.set(x, y, glyph, "axis", { foreground: "muted" });
  });
  const points = chart.values.map((value, index) => ({
    value,
    x:
      plotLeft +
      Math.round(
        (index / Math.max(1, chart.values.length - 1)) * (width - plotLeft - 1),
      ),
    y: toY(value),
  }));
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (previous !== undefined)
      drawLine(
        grid,
        previous.x,
        previous.y,
        point.x,
        point.y,
        charset === "ascii" ? "." : "·",
        { foreground: "series1" },
      );
  });
  points.forEach((point, index) => {
    const outside =
      point.value > chart.upperLimit || point.value < chart.lowerLimit;
    grid.set(
      point.x,
      point.y,
      outside
        ? charset === "ascii"
          ? "X"
          : "◆"
        : charset === "ascii"
          ? "o"
          : "●",
      outside ? "negative" : "series",
      { foreground: outside ? "series2" : "series1", bold: true },
      { label: chart.labels[index] ?? String(index + 1), value: point.value },
    );
  });
  grid.text(plotLeft, height - 1, chart.labels[0] ?? "", "label", {
    foreground: "muted",
  });
  const lastLabel = chart.labels.at(-1) ?? "";
  grid.text(width - measureText(lastLabel), height - 1, lastLabel, "label", {
    foreground: "muted",
  });
  const heading = chart.title ?? "Control chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.values.length} observations with center ${formatValue(chart.center)}, lower limit ${formatValue(chart.lowerLimit)}, and upper limit ${formatValue(chart.upperLimit)}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "outside", label: "Outside limits" },
      ],
      rows: chart.values.map((value, index) => ({
        label: chart.labels[index] ?? String(index + 1),
        value,
        outside:
          value > chart.upperLimit || value < chart.lowerLimit ? "yes" : "no",
      })),
    },
  );
}

export function mosaic(input: MosaicChartInput): MosaicChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("mosaic input must be an object.");
  if (!Array.isArray(input.series) || !Array.isArray(input.rows))
    throw new TypeError("series and rows must be arrays.");
  input.series.forEach((label, index) =>
    validateText(label, `series[${index}]`),
  );
  validateDataLength(input.rows.length, "rows");
  const rows: readonly StackedBarRow[] = Object.freeze(
    input.rows.map((row, rowIndex) => {
      validateText(row.label, `rows[${rowIndex}].label`);
      if (
        !Array.isArray(row.values) ||
        row.values.length !== input.series.length
      )
        throw new RangeError(
          `rows[${rowIndex}].values must match series length.`,
        );
      row.values.forEach((value: number, valueIndex: number) => {
        validateFiniteNumber(value, `rows[${rowIndex}].values[${valueIndex}]`);
        if (value < 0)
          throw new RangeError(
            `rows[${rowIndex}].values[${valueIndex}] cannot be negative.`,
          );
      });
      return Object.freeze({
        label: row.label,
        values: Object.freeze([...row.values]),
      });
    }),
  );
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "mosaic",
    series: Object.freeze([...input.series]),
    rows,
    showLegend: input.showLegend ?? true,
    ...baseFields(input),
  });
}

export function layoutMosaic(
  chart: MosaicChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const titleRows = drawTitle(grid, chart, width, palette.ellipsis);
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const labelY = height - legendRows - 1;
  const plotHeight = labelY - titleRows;
  if (plotHeight < 4)
    throw new RangeError("layout viewport is too short for a mosaic chart.");
  const totals = chart.rows.map(({ values }) =>
    values.reduce((sum, value) => sum + value, 0),
  );
  const grandTotal = totals.reduce((sum, value) => sum + value, 0);
  const fills =
    charset === "ascii"
      ? ["#", "+", "=", "%", "@", "*"]
      : ["█", "▓", "▒", "░", "▧", "▦"];
  let x = 0;
  chart.rows.forEach((row, rowIndex) => {
    const total = totals[rowIndex] ?? 0;
    const remaining = width - x;
    const columnWidth =
      rowIndex === chart.rows.length - 1
        ? remaining
        : Math.min(
            remaining,
            Math.max(1, Math.round((total / Math.max(1, grandTotal)) * width)),
          );
    let bottom = labelY;
    row.values.forEach((value, seriesIndex) => {
      const segmentHeight =
        seriesIndex === row.values.length - 1
          ? bottom - titleRows
          : Math.max(
              value === 0 ? 0 : 1,
              Math.round((value / Math.max(1, total)) * plotHeight),
            );
      const top = Math.max(titleRows, bottom - segmentHeight);
      for (let drawY = top; drawY < bottom; drawY += 1)
        for (let drawX = x; drawX < x + columnWidth; drawX += 1)
          grid.set(
            drawX,
            drawY,
            fills[seriesIndex % fills.length] ?? "#",
            "series",
            { foreground: `series${(seriesIndex % 4) + 1}` as "series1" },
            {
              label: `${row.label} / ${chart.series[seriesIndex] ?? seriesIndex}`,
              value,
            },
          );
      bottom = top;
    });
    if (columnWidth > 0)
      grid.text(
        x,
        labelY,
        truncateText(row.label, columnWidth, palette.ellipsis),
        "label",
        { foreground: "muted" },
      );
    x += columnWidth;
  });
  if (grandTotal === 0)
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  if (chart.showLegend) {
    const legend = chart.series
      .map((label, index) => `${fills[index % fills.length]} ${label}`)
      .join("  ");
    grid.text(
      0,
      height - 1,
      truncateText(legend, width, palette.ellipsis),
      "label",
      { foreground: "muted" },
    );
  }
  const heading = chart.title ?? "Mosaic chart";
  return grid.build(
    chart.description ??
      `${heading}. Column width shows group total and segment height shows within-group composition.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        ...chart.series.map((label, index) => ({
          key: `series_${index}`,
          label,
        })),
      ],
      rows: chart.rows.map((row) => ({
        label: row.label,
        ...Object.fromEntries(
          row.values.map((value, index) => [`series_${index}`, value]),
        ),
      })),
    },
  );
}

export function chord(input: ChordChartInput): ChordChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("chord input must be an object.");
  if (!Array.isArray(input.labels) || !Array.isArray(input.values))
    throw new TypeError("labels and values must be arrays.");
  if (input.labels.length < 2)
    throw new RangeError("chord requires at least two labels.");
  validateDataLength(input.labels.length, "labels");
  input.labels.forEach((label, index) =>
    validateText(label, `labels[${index}]`),
  );
  if (input.values.length !== input.labels.length)
    throw new RangeError("values must be a square matrix matching labels.");
  const values = Object.freeze(
    input.values.map((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== input.labels.length)
        throw new RangeError("values must be a square matrix matching labels.");
      row.forEach((value, columnIndex) => {
        validateFiniteNumber(value, `values[${rowIndex}][${columnIndex}]`);
        if (value < 0)
          throw new RangeError(
            `values[${rowIndex}][${columnIndex}] cannot be negative.`,
          );
      });
      return Object.freeze([...row]);
    }),
  );
  validateBase(input);
  return Object.freeze({
    type: "chord",
    labels: Object.freeze([...input.labels]),
    values,
    ...baseFields(input),
  });
}

export function layoutChord(
  chart: ChordChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? 20;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const titleRows = drawTitle(grid, chart, width, palette.ellipsis);
  const centerX = Math.floor(width / 2);
  const centerY = titleRows + Math.floor((height - titleRows) / 2);
  const radiusX = Math.max(5, Math.floor(width * 0.33));
  const radiusY = Math.max(3, Math.floor((height - titleRows) * 0.36));
  const nodes = chart.labels.map((label, index) => {
    const angle = -Math.PI / 2 + (index / chart.labels.length) * Math.PI * 2;
    return {
      label,
      x: centerX + Math.round(Math.cos(angle) * radiusX),
      y: centerY + Math.round(Math.sin(angle) * radiusY),
    };
  });
  const links = chart.values.flatMap((row, source) =>
    row.flatMap((value, target) =>
      source === target || value === 0 ? [] : [{ source, target, value }],
    ),
  );
  const maximum = Math.max(1, ...links.map(({ value }) => value));
  links.forEach((link, index) => {
    const source = nodes[link.source];
    const target = nodes[link.target];
    if (source === undefined || target === undefined) return;
    const level = Math.ceil((link.value / maximum) * 3);
    const glyph =
      charset === "ascii"
        ? ([".", ":", "="][level - 1] ?? "=")
        : (["·", "┄", "─"][level - 1] ?? "─");
    const style = {
      foreground: `series${(index % 4) + 1}` as "series1",
    };
    drawLine(grid, source.x, source.y, centerX, centerY, glyph, style);
    drawLine(grid, centerX, centerY, target.x, target.y, glyph, style);
  });
  nodes.forEach((node, index) => {
    const marker = charset === "ascii" ? String((index % 9) + 1) : "●";
    grid.set(node.x, node.y, marker, "series", {
      foreground: `series${(index % 4) + 1}` as "series1",
      bold: true,
    });
    const available = Math.max(1, Math.floor(width * 0.22));
    const label = truncateText(node.label, available, palette.ellipsis);
    const labelX =
      node.x < centerX ? node.x - measureText(label) - 1 : node.x + 2;
    grid.text(Math.max(0, labelX), node.y, label, "label", {
      foreground: "muted",
    });
  });
  if (links.length === 0)
    grid.text(0, titleRows, "No relationships", "missing", {
      foreground: "muted",
    });
  const heading = chart.title ?? "Chord diagram";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.labels.length} nodes and ${links.length} weighted directed relationships.`,
    {
      caption: heading,
      columns: [
        { key: "source", label: "Source" },
        { key: "target", label: "Target" },
        { key: "value", label: "Value" },
      ],
      rows: links.map(({ source, target, value }) => ({
        source: chart.labels[source] ?? String(source),
        target: chart.labels[target] ?? String(target),
        value,
      })),
    },
  );
}
