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
  BulletChart,
  BulletChartInput,
  BulletDatum,
  BulletDatumInput,
  CellGrid,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;

function normalizeDatum(datum: BulletDatumInput, index: number): BulletDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(`data[${index}] must be a bullet datum object.`);
  }
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  validateFiniteNumber(datum.target, `data[${index}].target`);
  const minimum = datum.min ?? 0;
  const maximum = datum.max ?? 100;
  validateFiniteNumber(minimum, `data[${index}].min`);
  validateFiniteNumber(maximum, `data[${index}].max`);
  if (minimum >= maximum) {
    throw new RangeError(`data[${index}].min must be less than max.`);
  }
  const ranges = datum.ranges ?? [
    minimum + (maximum - minimum) * 0.6,
    minimum + (maximum - minimum) * 0.8,
    maximum,
  ];
  if (!Array.isArray(ranges) || ranges.length === 0 || ranges.length > 4) {
    throw new RangeError(
      `data[${index}].ranges must contain 1 to 4 thresholds.`,
    );
  }
  let previous = minimum;
  ranges.forEach((range, rangeIndex) => {
    validateFiniteNumber(range, `data[${index}].ranges[${rangeIndex}]`);
    if (range <= previous || range > maximum) {
      throw new RangeError(
        `data[${index}].ranges must be increasing within min and max.`,
      );
    }
    previous = range;
  });
  return Object.freeze({
    label: datum.label,
    value: datum.value,
    target: datum.target,
    min: minimum,
    max: maximum,
    ranges: Object.freeze([...ranges]),
  });
}

export function bullet(input: BulletChartInput): BulletChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("bullet input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
  return Object.freeze({
    type: "bullet",
    data: Object.freeze(input.data.map(normalizeDatum)),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  });
}

export function layoutBullet(
  chart: BulletChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length);
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  validateViewport(width, height);
  const palette = getPalette(options.charset ?? "unicode");
  const labelWidth = Math.min(
    Math.max(1, ...chart.data.map(({ label }) => measureText(label))),
    Math.max(1, Math.floor(width * 0.25)),
  );
  const valueWidth = Math.max(
    3,
    ...chart.data.map(({ value }) => String(value).length),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX - valueWidth - 1;
  if (plotWidth < 8)
    throw new RangeError(
      `layout width ${width} is too narrow for bullet charts.`,
    );
  const grid = new GridBuilder(width, height);
  if (chart.title !== undefined)
    grid.text(
      0,
      0,
      truncateText(chart.title, width, palette.ellipsis),
      "title",
      { foreground: "accent", bold: true },
    );
  if (chart.data.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    chart.data.forEach((datum, index) => {
      const y = titleRows + index;
      grid.text(
        0,
        y,
        truncateText(datum.label, labelWidth, palette.ellipsis),
        "label",
      );
      for (let x = 0; x < plotWidth; x += 1) {
        const valueAtCell =
          datum.min + ((x + 1) / plotWidth) * (datum.max - datum.min);
        const band = datum.ranges.findIndex((range) => valueAtCell <= range);
        const densityIndex = Math.max(
          0,
          palette.density.length - 1 - Math.max(0, band) * 2,
        );
        grid.set(
          plotX + x,
          y,
          palette.density[densityIndex] ?? palette.emptyFill,
          "empty",
          { foreground: "muted" },
        );
      }
      const ratio = Math.max(
        0,
        Math.min(1, (datum.value - datum.min) / (datum.max - datum.min)),
      );
      const length = Math.round(ratio * plotWidth);
      for (let x = 0; x < length; x += 1)
        grid.set(
          plotX + x,
          y,
          palette.fill,
          "series",
          { foreground: "series1" },
          { label: datum.label, value: datum.value },
        );
      const targetRatio = Math.max(
        0,
        Math.min(1, (datum.target - datum.min) / (datum.max - datum.min)),
      );
      const targetX =
        plotX +
        Math.min(plotWidth - 1, Math.round(targetRatio * (plotWidth - 1)));
      grid.set(
        targetX,
        y,
        palette.target,
        "axis",
        { foreground: "accent", bold: true },
        { label: `${datum.label} target`, value: datum.target },
      );
      grid.text(plotX + plotWidth + 1, y, String(datum.value), "value");
    });
  }
  const heading = chart.title ?? "Bullet chart";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.map(({ label, value, target }) => `${label}: ${value}, target ${target}`).join("; ")}.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "target", label: "Target" },
        { key: "minimum", label: "Minimum" },
        { key: "maximum", label: "Maximum" },
      ],
      rows: chart.data.map(({ label, value, target, min, max }) => ({
        label,
        value,
        target,
        minimum: min,
        maximum: max,
      })),
    },
  );
}
