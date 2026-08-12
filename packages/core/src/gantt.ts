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
  GanttChart,
  GanttChartInput,
  GanttTask,
  GanttTaskInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;

function normalizeTask(task: GanttTaskInput, index: number): GanttTask {
  if (typeof task !== "object" || task === null)
    throw new TypeError(`tasks[${index}] must be a Gantt task object.`);
  validateText(task.label, `tasks[${index}].label`);
  validateFiniteNumber(task.start, `tasks[${index}].start`);
  validateFiniteNumber(task.end, `tasks[${index}].end`);
  if (task.start > task.end)
    throw new RangeError(`tasks[${index}].start cannot exceed end.`);
  const progress = task.progress ?? 0;
  validateFiniteNumber(progress, `tasks[${index}].progress`);
  if (progress < 0 || progress > 100)
    throw new RangeError(`tasks[${index}].progress must be between 0 and 100.`);
  return Object.freeze({
    label: task.label,
    start: task.start,
    end: task.end,
    progress,
  });
}

export function gantt(input: GanttChartInput): GanttChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("gantt input must be an object.");
  if (!Array.isArray(input.tasks))
    throw new TypeError("tasks must be an array.");
  validateDataLength(input.tasks.length, "tasks");
  if (input.min !== undefined) validateFiniteNumber(input.min, "min");
  if (input.max !== undefined) validateFiniteNumber(input.max, "max");
  if (
    input.min !== undefined &&
    input.max !== undefined &&
    input.min > input.max
  )
    throw new RangeError("min cannot be greater than max.");
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  return Object.freeze({
    type: "gantt",
    tasks: Object.freeze(input.tasks.map(normalizeTask)),
    ...(input.min !== undefined ? { min: input.min } : {}),
    ...(input.max !== undefined ? { max: input.max } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutGantt(
  chart: GanttChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.tasks.length) + 2;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  validateViewport(width, height);
  const palette = getPalette(options.charset ?? "unicode");
  const minimum =
    chart.min ??
    (chart.tasks.length === 0
      ? 0
      : Math.min(...chart.tasks.map(({ start }) => start)));
  const maximum =
    chart.max ??
    (chart.tasks.length === 0
      ? 1
      : Math.max(...chart.tasks.map(({ end }) => end)));
  if (minimum > maximum)
    throw new RangeError("resolved minimum cannot exceed maximum.");
  const labelWidth = Math.min(
    Math.max(1, ...chart.tasks.map(({ label }) => measureText(label))),
    Math.max(1, Math.floor(width * 0.3)),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  if (plotWidth < 8)
    throw new RangeError(
      `layout width ${width} is too narrow for a Gantt chart.`,
    );
  const toX = (value: number) =>
    plotX +
    (maximum === minimum
      ? 0
      : Math.round(
          ((Math.max(minimum, Math.min(maximum, value)) - minimum) /
            (maximum - minimum)) *
            (plotWidth - 1),
        ));
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  if (chart.tasks.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    chart.tasks.forEach((task, index) => {
      const y = titleRows + index;
      grid.text(
        0,
        y,
        truncateText(task.label, labelWidth, palette.ellipsis),
        "label",
      );
      const startX = toX(task.start);
      const endX = toX(task.end);
      const length = Math.max(1, endX - startX + 1);
      const complete = Math.round((task.progress / 100) * length);
      for (let offset = 0; offset < length; offset += 1)
        grid.set(
          startX + offset,
          y,
          offset < complete ? palette.fill : palette.emptyFill,
          "series",
          { foreground: offset < complete ? "positive" : "muted" },
          { label: task.label, value: task.progress },
        );
    });
    const axisY = titleRows + chart.tasks.length;
    for (let x = plotX; x < width; x += 1)
      grid.set(x, axisY, palette.horizontalAxis, "axis", {
        foreground: "muted",
      });
    const minLabel = formatValue(minimum);
    const maxLabel = formatValue(maximum);
    grid.text(plotX, axisY + 1, minLabel, "label", { foreground: "muted" });
    grid.text(width - measureText(maxLabel), axisY + 1, maxLabel, "label", {
      foreground: "muted",
    });
  }
  const heading = chart.title ?? "Gantt chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.tasks.length} tasks from ${formatValue(minimum)} to ${formatValue(maximum)}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Task" },
        { key: "start", label: "Start" },
        { key: "end", label: "End" },
        { key: "progress", label: "Progress" },
      ],
      rows: chart.tasks.map(({ label, start, end, progress }) => ({
        label,
        start,
        end,
        progress,
      })),
    },
  );
}
