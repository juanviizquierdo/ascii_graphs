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
  BarChart,
  BarChartInput,
  BarDatum,
  CellDatum,
  CellGrid,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;

function copyDatum(datum: BarDatum, index: number): BarDatum {
  if (typeof datum !== "object" || datum === null) {
    throw new TypeError(
      `data[${index}] must be an object with label and value.`,
    );
  }
  validateText(datum.label, `data[${index}].label`);
  validateFiniteNumber(datum.value, `data[${index}].value`);
  return { label: datum.label, value: datum.value };
}

export function bar(input: BarChartInput): BarChart {
  if (typeof input !== "object" || input === null) {
    throw new TypeError("bar input must be an object.");
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
  if (input.showValues !== undefined && typeof input.showValues !== "boolean") {
    throw new TypeError("showValues must be a boolean.");
  }

  const data = Object.freeze(
    input.data.map((datum, index) => Object.freeze(copyDatum(datum, index))),
  );
  const chart: BarChart = {
    type: "bar",
    data,
    showValues: input.showValues ?? true,
    ...(input.title !== undefined && input.title !== ""
      ? { title: input.title }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
  };
  return Object.freeze(chart);
}

export function formatValue(value: number): string {
  if (Object.is(value, -0)) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000 || (absolute > 0 && absolute < 0.001)) {
    return value
      .toExponential(2)
      .replace(/\.00e/, "e")
      .replace(/(\.\d)0e/, "$1e");
  }
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function describe(
  title: string | undefined,
  data: readonly BarDatum[],
): string {
  const heading = title === undefined ? "Bar chart" : title;
  if (data.length === 0) return `${heading}. No data.`;
  return `${heading}. ${data.map(({ label, value }) => `${label}: ${formatValue(value)}`).join("; ")}.`;
}

export function layoutBar(
  chart: BarChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  validateWidth(width, "layout width");
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);

  const valueStrings = chart.data.map(({ value }) => formatValue(value));
  const valueWidth = chart.showValues
    ? Math.max(1, ...valueStrings.map((value) => measureText(value)))
    : 0;
  const longestLabel = Math.max(
    1,
    ...chart.data.map(({ label }) => measureText(label)),
  );
  const reserved = valueWidth + (chart.showValues ? 1 : 0) + 1;
  const maximumLabelWidth = Math.max(1, Math.floor(width * 0.3));
  const labelWidth = Math.min(longestLabel, maximumLabelWidth);
  const plotWidth = width - labelWidth - reserved;

  if (plotWidth < 3) {
    throw new RangeError(
      `layout width ${width} is too narrow for the labels and formatted values; increase it or hide values.`,
    );
  }

  const titleRows = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleRows + Math.max(1, chart.data.length);
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight) {
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  }
  validateViewport(width, height);
  const grid = new GridBuilder(width, height);

  if (chart.title !== undefined) {
    const title = truncateText(chart.title, width, palette.ellipsis);
    grid.text(0, 0, title, "title", { foreground: "accent", bold: true });
  }

  if (chart.data.length === 0) {
    grid.text(0, titleRows, "No data", "label", { foreground: "muted" });
  } else {
    const minimum = Math.min(0, ...chart.data.map(({ value }) => value));
    const maximum = Math.max(0, ...chart.data.map(({ value }) => value));
    const span = maximum - minimum;
    const zero =
      span === 0 ? 0 : Math.round((-minimum / span) * (plotWidth - 1));
    const plotX = labelWidth + 1;

    chart.data.forEach((item, index) => {
      const y = titleRows + index;
      const datum: CellDatum = { label: item.label, value: item.value };
      const label = truncateText(item.label, labelWidth, palette.ellipsis);
      grid.text(0, y, label, "label", undefined, datum);

      grid.set(
        plotX + zero,
        y,
        palette.baseline,
        "axis",
        { foreground: "muted" },
        datum,
      );

      if (item.value > 0 && maximum > 0) {
        const available = plotWidth - 1 - zero;
        const length = Math.max(
          1,
          Math.round((item.value / maximum) * available),
        );
        for (let x = zero + 1; x <= zero + length; x += 1) {
          grid.set(
            plotX + x,
            y,
            palette.fill,
            "positive",
            { foreground: "positive" },
            datum,
          );
        }
      } else if (item.value < 0 && minimum < 0) {
        const available = zero;
        const length = Math.max(
          1,
          Math.round((item.value / minimum) * available),
        );
        for (let x = zero - length; x < zero; x += 1) {
          grid.set(
            plotX + x,
            y,
            palette.fill,
            "negative",
            { foreground: "negative" },
            datum,
          );
        }
      }

      if (chart.showValues) {
        const value = valueStrings[index];
        if (value !== undefined) {
          grid.text(width - valueWidth, y, value, "value", undefined, datum);
        }
      }
    });
  }

  const caption = chart.title ?? "Bar chart";
  return grid.build(chart.description ?? describe(chart.title, chart.data), {
    caption,
    columns: [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ],
    rows: chart.data.map(({ label, value }) => ({ label, value })),
  });
}
