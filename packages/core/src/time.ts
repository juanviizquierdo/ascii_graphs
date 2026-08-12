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
  CalendarDatum,
  CalendarHeatmapChart,
  CalendarHeatmapChartInput,
  CellGrid,
  HorizonChart,
  HorizonChartInput,
  LayoutOptions,
  TimelineChart,
  TimelineChartInput,
  TimelineDatum,
} from "./types.js";

const DEFAULT_WIDTH = 60;

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

function baseFields(input: {
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

function drawTitle(
  grid: GridBuilder,
  title: string | undefined,
  width: number,
  ellipsis: string,
) {
  if (title !== undefined)
    grid.text(0, 0, truncateText(title, width, ellipsis), "title", {
      foreground: "accent",
      bold: true,
    });
}

export function calendarHeatmap(
  input: CalendarHeatmapChartInput,
): CalendarHeatmapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("calendar heatmap input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const seen = new Set<string>();
  const data: readonly CalendarDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`data[${index}] must be a calendar datum object.`);
      const timestamp =
        typeof datum.date === "string"
          ? Date.parse(`${datum.date}T00:00:00Z`)
          : Number.NaN;
      if (
        typeof datum.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(datum.date) ||
        Number.isNaN(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 10) !== datum.date
      )
        throw new TypeError(
          `data[${index}].date must be a valid YYYY-MM-DD date.`,
        );
      if (seen.has(datum.date))
        throw new RangeError(`data contains duplicate date ${datum.date}.`);
      seen.add(datum.date);
      if (datum.value !== null)
        validateFiniteNumber(datum.value, `data[${index}].value`);
      return Object.freeze({ date: datum.date, value: datum.value });
    }),
  );
  if (input.min !== undefined) validateFiniteNumber(input.min, "min");
  if (input.max !== undefined) validateFiniteNumber(input.max, "max");
  if (
    input.min !== undefined &&
    input.max !== undefined &&
    input.min > input.max
  )
    throw new RangeError("min cannot be greater than max.");
  base(input);
  return Object.freeze({
    type: "calendar-heatmap",
    data,
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...baseFields(input),
  });
}

export function layoutCalendarHeatmap(
  chart: CalendarHeatmapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? 12;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  if (height - titleRows < 8)
    throw new RangeError(
      `layout height ${height} is too short for a calendar heatmap.`,
    );
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  const sorted = [...chart.data].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const first = sorted[0];
  const values = sorted.flatMap(({ value }) => (value === null ? [] : [value]));
  const minimum = chart.min ?? Math.min(...values, 0);
  const maximum = chart.max ?? Math.max(...values, 1);
  const levels =
    charset === "ascii" ? [".", ":", "*", "#"] : ["░", "▒", "▓", "█"];
  if (first !== undefined) {
    const firstDate = new Date(`${first.date}T00:00:00Z`);
    const mondayOffset = (firstDate.getUTCDay() + 6) % 7;
    sorted.forEach((datum) => {
      const date = new Date(`${datum.date}T00:00:00Z`);
      const days =
        Math.round((date.getTime() - firstDate.getTime()) / 86_400_000) +
        mondayOffset;
      const x = 4 + Math.floor(days / 7) * 2;
      const y = titleRows + 1 + (days % 7);
      const ratio =
        datum.value === null || maximum === minimum
          ? 0
          : (datum.value - minimum) / (maximum - minimum);
      const glyph =
        datum.value === null
          ? palette.missing
          : (levels[
              Math.max(
                0,
                Math.min(
                  levels.length - 1,
                  Math.round(ratio * (levels.length - 1)),
                ),
              )
            ] ??
            levels[0] ??
            ".");
      grid.set(
        x,
        y,
        glyph,
        datum.value === null ? "missing" : "series",
        { foreground: datum.value === null ? "muted" : "series1" },
        datum.value === null
          ? undefined
          : { label: datum.date, value: datum.value },
      );
    });
  }
  ["M", "T", "W", "T", "F", "S", "S"].forEach((day, index) =>
    grid.text(0, titleRows + 1 + index, day, "label", { foreground: "muted" }),
  );
  grid.text(
    0,
    height - 1,
    `${formatValue(minimum)} ${levels.join("")} ${formatValue(maximum)}  ${palette.missing} missing`,
    "label",
    { foreground: "muted" },
  );
  const heading = chart.title ?? "Calendar heatmap";
  return grid.build(
    chart.description ?? `${heading}. ${chart.data.length} dated values.`,
    {
      caption: heading,
      columns: [
        { key: "date", label: "Date" },
        { key: "value", label: "Value" },
      ],
      rows: chart.data.map(({ date, value }) => ({ date, value })),
    },
  );
}

export function horizon(input: HorizonChartInput): HorizonChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("horizon input must be an object.");
  if (!Array.isArray(input.values))
    throw new TypeError("values must be an array.");
  validateDataLength(input.values.length, "values");
  input.values.forEach((value, index) => {
    if (value !== null) validateFiniteNumber(value, `values[${index}]`);
  });
  if (
    input.bands !== undefined &&
    (!Number.isInteger(input.bands) || input.bands < 1 || input.bands > 4)
  )
    throw new RangeError("bands must be an integer between 1 and 4.");
  if (input.label !== undefined) validateText(input.label, "label");
  base(input);
  return Object.freeze({
    type: "horizon",
    values: Object.freeze([...input.values]),
    bands: input.bands ?? 3,
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...baseFields(input),
  });
}

export function layoutHorizon(
  chart: HorizonChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? 8;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 3)
    throw new RangeError(
      `layout height ${height} is too short for a horizon chart.`,
    );
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  const finite = chart.values.flatMap((value) =>
    value === null ? [] : [value],
  );
  const magnitude = Math.max(1, ...finite.map(Math.abs));
  const step = Math.max(1, Math.ceil(chart.values.length / width));
  for (
    let x = 0;
    x < Math.min(width, Math.ceil(chart.values.length / step));
    x += 1
  ) {
    const bucket = chart.values
      .slice(x * step, (x + 1) * step)
      .filter((value): value is number => value !== null);
    if (bucket.length === 0) {
      grid.set(
        x,
        titleRows + Math.floor(plotHeight / 2),
        palette.missing,
        "missing",
        { foreground: "muted" },
      );
      continue;
    }
    const value = bucket.reduce((sum, item) => sum + item, 0) / bucket.length;
    const band = Math.max(
      1,
      Math.min(
        chart.bands,
        Math.ceil((Math.abs(value) / magnitude) * chart.bands),
      ),
    );
    const y =
      value >= 0
        ? titleRows + chart.bands - band
        : titleRows + chart.bands + band;
    grid.set(
      x,
      Math.min(titleRows + plotHeight - 1, y),
      charset === "ascii"
        ? String(band)
        : (["░", "▒", "▓", "█"][band - 1] ?? "█"),
      "series",
      { foreground: value >= 0 ? "positive" : "negative" },
      { label: chart.label ?? String(x), value },
    );
  }
  const baselineY = Math.min(
    titleRows + plotHeight - 1,
    titleRows + chart.bands,
  );
  for (let x = 0; x < width; x += 1)
    grid.set(x, baselineY, palette.horizontalAxis, "axis", {
      foreground: "muted",
    });
  const heading = chart.title ?? chart.label ?? "Horizon chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.values.length} folded samples across ${chart.bands} bands.`,
    {
      caption: heading,
      columns: [
        { key: "index", label: "Index" },
        { key: "value", label: "Value" },
      ],
      rows: chart.values.map((value, index) => ({ index, value })),
    },
  );
}

export function timeline(input: TimelineChartInput): TimelineChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("timeline input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly TimelineDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      validateText(datum.label, `data[${index}].label`);
      validateFiniteNumber(datum.start, `data[${index}].start`);
      const end = datum.end ?? datum.start;
      validateFiniteNumber(end, `data[${index}].end`);
      if (end < datum.start)
        throw new RangeError(`data[${index}].end cannot be less than start.`);
      return Object.freeze({ label: datum.label, start: datum.start, end });
    }),
  );
  if (input.min !== undefined) validateFiniteNumber(input.min, "min");
  if (input.max !== undefined) validateFiniteNumber(input.max, "max");
  base(input);
  return Object.freeze({
    type: "timeline",
    data,
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...baseFields(input),
  });
}

export function layoutTimeline(
  chart: TimelineChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const height =
    options.height ??
    chart.height ??
    titleRows + Math.max(1, chart.data.length) + 2;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(1, ...chart.data.map(({ label }) => measureText(label))),
    Math.floor(width * 0.3),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  const minimum =
    chart.min ?? Math.min(...chart.data.map(({ start }) => start), 0);
  const maximum = chart.max ?? Math.max(...chart.data.map(({ end }) => end), 1);
  if (minimum > maximum)
    throw new RangeError("timeline min cannot be greater than max.");
  const toX = (value: number) =>
    plotX +
    Math.round(
      ((value - minimum) / Math.max(1e-9, maximum - minimum)) * (plotWidth - 1),
    );
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  chart.data.forEach((datum, index) => {
    const y = titleRows + index;
    grid.text(
      0,
      y,
      truncateText(datum.label, labelWidth, palette.ellipsis),
      "label",
    );
    const startX = toX(datum.start);
    const endX = toX(datum.end);
    if (startX === endX)
      grid.set(
        startX,
        y,
        charset === "ascii" ? "o" : "●",
        "series",
        { foreground: "accent" },
        { label: datum.label, value: datum.start },
      );
    else {
      for (let x = startX; x <= endX; x += 1)
        grid.set(
          x,
          y,
          palette.horizontalAxis,
          "series",
          { foreground: "series1" },
          { label: datum.label, value: datum.start },
        );
      grid.set(
        startX,
        y,
        charset === "ascii" ? "[" : "├",
        "series",
        { foreground: "series1" },
        { label: datum.label, value: datum.start },
      );
      grid.set(
        endX,
        y,
        charset === "ascii" ? "]" : "┤",
        "series",
        { foreground: "series1" },
        { label: datum.label, value: datum.end },
      );
    }
  });
  const axisY = titleRows + chart.data.length;
  for (let x = plotX; x < width; x += 1)
    grid.set(x, axisY, palette.horizontalAxis, "axis", { foreground: "muted" });
  grid.text(plotX, axisY + 1, formatValue(minimum), "label", {
    foreground: "muted",
  });
  const maxLabel = formatValue(maximum);
  grid.text(width - measureText(maxLabel), axisY + 1, maxLabel, "label", {
    foreground: "muted",
  });
  const heading = chart.title ?? "Timeline";
  return grid.build(
    chart.description ?? `${heading}. ${chart.data.length} events and ranges.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "start", label: "Start" },
        { key: "end", label: "End" },
        { key: "kind", label: "Kind" },
      ],
      rows: chart.data.map(({ label, start, end }) => ({
        label,
        start,
        end,
        kind: start === end ? "event" : "range",
      })),
    },
  );
}
