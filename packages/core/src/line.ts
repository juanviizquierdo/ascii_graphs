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
  CellStyle,
  CharacterSet,
  LayoutOptions,
  LineChart,
  LineChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 14;

export interface SeriesSample {
  index: number;
  value: number | null;
}

const lineGlyphs: Record<
  CharacterSet,
  {
    point: string;
    horizontal: string;
    rising: string;
    falling: string;
    vertical: string;
  }
> = {
  ascii: {
    point: "*",
    horizontal: "-",
    rising: "/",
    falling: "\\",
    vertical: "|",
  },
  unicode: {
    point: "●",
    horizontal: "─",
    rising: "╱",
    falling: "╲",
    vertical: "│",
  },
};

function copyValue(value: number | null, index: number): number | null {
  if (value === null) return null;
  validateFiniteNumber(value, `values[${index}]`);
  return value;
}

export function line(input: LineChartInput): LineChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("line input must be an object.");
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

  return Object.freeze({
    type: "line",
    values: Object.freeze(input.values.map(copyValue)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
  });
}

export function sampleSeries(
  values: readonly (number | null)[],
  target: number,
): SeriesSample[] {
  const samples = values.map((value, index) => ({ index, value }));
  if (samples.length <= target) return samples;
  if (target <= 1) return samples.slice(0, 1);
  if (target === 2) {
    return [samples[0], samples.at(-1)].filter(
      (sample): sample is SeriesSample => sample !== undefined,
    );
  }

  const finite = values.filter((value): value is number => value !== null);
  const midpoint =
    finite.length === 0 ? 0 : (Math.min(...finite) + Math.max(...finite)) / 2;
  const result: SeriesSample[] = [samples[0] ?? { index: 0, value: null }];
  const interior = samples.length - 2;

  for (let bucket = 0; bucket < target - 2; bucket += 1) {
    const start = 1 + Math.floor((bucket * interior) / (target - 2));
    const end = 1 + Math.floor(((bucket + 1) * interior) / (target - 2));
    const candidates = samples.slice(start, Math.max(start + 1, end));
    const populated = candidates.filter(
      (sample): sample is SeriesSample & { value: number } =>
        sample.value !== null,
    );
    if (populated.length === 0) {
      result.push(candidates[0] ?? { index: start, value: null });
      continue;
    }
    let selected = populated[0];
    if (selected === undefined) continue;
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

  const last = samples.at(-1);
  if (last !== undefined) result.push(last);
  return result;
}

function descriptionFor(chart: LineChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? chart.label ?? "Line chart";
  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  if (finite.length === 0) return `${heading}. No numeric data.`;
  return `${heading}. ${chart.values.length} points; minimum ${formatValue(Math.min(...finite))}; maximum ${formatValue(Math.max(...finite))}.`;
}

export interface PathPoint {
  x: number;
  y: number | null;
}

type PathDirection = 1 | 2 | 4 | 8;

function pathGlyph(charset: CharacterSet, connections: number): string {
  if (charset === "ascii") {
    if (connections === 3 || connections === 1 || connections === 2) return "-";
    if (connections === 12 || connections === 4 || connections === 8)
      return "|";
    return "+";
  }
  return (
    (
      {
        1: "─",
        2: "─",
        3: "─",
        4: "│",
        5: "╯",
        6: "╰",
        7: "┴",
        8: "│",
        9: "╮",
        10: "╭",
        11: "┬",
        12: "│",
        13: "┤",
        14: "├",
        15: "┼",
      } as Record<number, string>
    )[connections] ?? "•"
  );
}

function coordinatesBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
  route: "linear" | "step",
): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [{ ...from }];
  const appendHorizontal = (targetX: number): void => {
    const current = result.at(-1);
    if (current === undefined) return;
    const direction = targetX >= current.x ? 1 : -1;
    for (
      let x = current.x + direction;
      x !== targetX + direction;
      x += direction
    )
      result.push({ x, y: current.y });
  };
  const appendVertical = (targetY: number): void => {
    const current = result.at(-1);
    if (current === undefined) return;
    const direction = targetY >= current.y ? 1 : -1;
    for (
      let y = current.y + direction;
      y !== targetY + direction;
      y += direction
    )
      result.push({ x: current.x, y });
  };
  if (from.y === to.y) appendHorizontal(to.x);
  else if (from.x === to.x) appendVertical(to.y);
  else if (route === "step") {
    appendHorizontal(to.x);
    appendVertical(to.y);
  } else {
    const middleX = Math.round((from.x + to.x) / 2);
    appendHorizontal(middleX);
    appendVertical(to.y);
    appendHorizontal(to.x);
  }
  return result;
}

export function drawConnectedPath(
  grid: GridBuilder,
  charset: CharacterSet,
  points: readonly PathPoint[],
  route: "linear" | "step",
  style: CellStyle = { foreground: "series1" },
): void {
  const connections = new Map<string, number>();
  const connect = (
    left: { x: number; y: number },
    right: { x: number; y: number },
  ): void => {
    let leftDirection: PathDirection;
    let rightDirection: PathDirection;
    if (right.x > left.x) [leftDirection, rightDirection] = [2, 1];
    else if (right.x < left.x) [leftDirection, rightDirection] = [1, 2];
    else if (right.y > left.y) [leftDirection, rightDirection] = [8, 4];
    else [leftDirection, rightDirection] = [4, 8];
    const leftKey = `${left.x},${left.y}`;
    const rightKey = `${right.x},${right.y}`;
    connections.set(leftKey, (connections.get(leftKey) ?? 0) | leftDirection);
    connections.set(
      rightKey,
      (connections.get(rightKey) ?? 0) | rightDirection,
    );
  };
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (
      from === undefined ||
      to === undefined ||
      from.y === null ||
      to.y === null
    )
      continue;
    const coordinates = coordinatesBetween(
      { x: from.x, y: from.y },
      { x: to.x, y: to.y },
      route,
    );
    for (let coordinate = 1; coordinate < coordinates.length; coordinate += 1) {
      const previous = coordinates[coordinate - 1];
      const current = coordinates[coordinate];
      if (previous !== undefined && current !== undefined)
        connect(previous, current);
    }
  }
  for (const [key, value] of connections) {
    const [x, y] = key.split(",").map(Number);
    if (x !== undefined && y !== undefined)
      grid.set(x, y, pathGlyph(charset, value), "series", style);
  }
}

export function layoutLine(
  chart: LineChart,
  options: LayoutOptions = {},
  route: "linear" | "step" = "linear",
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const glyphs = lineGlyphs[charset];
  const titleRows = chart.title === undefined ? 0 : 2;
  const plotHeight = height - titleRows - 1;
  if (plotHeight < 4) {
    throw new RangeError(
      `layout height ${height} is too short; line charts require at least ${titleRows + 5} rows.`,
    );
  }

  const finite = chart.values.filter(
    (value): value is number => value !== null,
  );
  const minimum = chart.min ?? (finite.length === 0 ? 0 : Math.min(...finite));
  const maximum = chart.max ?? (finite.length === 0 ? 1 : Math.max(...finite));
  const axisLabelWidth = Math.max(
    measureText(formatValue(minimum)),
    measureText(formatValue(maximum)),
  );
  const plotX = axisLabelWidth + 2;
  const plotWidth = width - plotX;
  if (plotWidth < 2) {
    throw new RangeError(
      `layout width ${width} is too narrow for a line chart.`,
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
  grid.text(0, plotTop, formatValue(maximum), "value", {
    foreground: "muted",
  });
  grid.text(0, plotBottom, formatValue(minimum), "value", {
    foreground: "muted",
  });
  for (let y = plotTop; y <= plotBottom; y += 1) {
    grid.set(plotX - 1, y, glyphs.vertical, "axis", {
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
      y: plotBottom - Math.round(ratio * (plotHeight - 1)),
    };
  });

  drawConnectedPath(grid, charset, positions, route);

  positions.forEach((sample) => {
    if (sample.value === null || sample.y === null) {
      grid.set(
        sample.x,
        plotTop + Math.floor(plotHeight / 2),
        palette.missing,
        "missing",
        {
          foreground: "muted",
        },
      );
      return;
    }
    grid.set(
      sample.x,
      sample.y,
      glyphs.point,
      "series",
      { foreground: "series1", bold: true },
      { label: String(sample.index), value: sample.value },
    );
  });

  const indexY = height - 1;
  if (chart.values.length > 0) {
    grid.text(plotX, indexY, "0", "label", { foreground: "muted" });
    const last = String(chart.values.length - 1);
    grid.text(width - measureText(last), indexY, last, "label", {
      foreground: "muted",
    });
  } else {
    grid.text(plotX, plotTop, "No data", "missing", { foreground: "muted" });
  }

  return grid.build(descriptionFor(chart), {
    caption: chart.title ?? chart.label ?? "Line chart",
    columns: [
      { key: "index", label: "Index" },
      { key: "value", label: "Value" },
    ],
    rows: chart.values.map((value, index) => ({ index, value })),
  });
}
