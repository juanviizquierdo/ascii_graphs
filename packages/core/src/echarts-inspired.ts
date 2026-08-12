import { formatValue } from "./bar.js";
import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import { linearScale } from "./scales.js";
import {
  validateDataLength,
  validateFiniteNumber,
  validateHeight,
  validateText,
  validateViewport,
  validateWidth,
} from "./validation.js";

import type {
  BarDatum,
  CellGrid,
  CellStyle,
  ChartBase,
  ChoroplethMapChart,
  ChoroplethMapChartInput,
  CountryMapChart,
  CountryMapChartInput,
  CountryMapDatum,
  CountryMapName,
  GaugeChart,
  GaugeChartInput,
  LayoutOptions,
  MapRegion,
  PictorialBarChart,
  PictorialBarChartInput,
  Route,
  RouteMapChart,
  RouteMapChartInput,
  RoutePoint,
  SeriesValues,
  SeriesValuesInput,
  ThemeRiverChart,
  ThemeRiverChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 16;
const seriesStyles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];

interface CountryShape {
  readonly label: string;
  readonly rows: readonly string[];
}

// Rasterized from Natural Earth 1:110m Admin 0 country polygons (public domain).
const countryShapes: Readonly<Record<CountryMapName, CountryShape>> = {
  spain: {
    label: "Spain",
    rows: [
      "XXXXXXXXXXXXXXX         ",
      "XXXXXXXXXXXXXXXXXXXXX   ",
      "XXXXXXXXXXXXXXXXXXXXXXXX",
      "     XXXXXXXXXXXXXXXXXXX",
      "     XXXXXXXXXXXXXXX    ",
      "    XXXXXXXXXXXXXXX     ",
      "   XXXXXXXXXXXXXXX      ",
      "    XXXXXXXXXXXXXX      ",
      "    XXXXXXXXXXXXXX      ",
      "   XXXXXXXXXXXXXX       ",
      "   XXXXXXXXXXXX         ",
      "      XXX               ",
    ],
  },
  france: {
    label: "France",
    rows: [
      "         XXXX         ",
      "    X  XXXXXXXXX      ",
      " XX XXXXXXXXXXXXXXXX  ",
      "XXXXXXXXXXXXXXXXXXX   ",
      " XXXXXXXXXXXXXXXXXX   ",
      "    XXXXXXXXXXXXX     ",
      "     XXXXXXXXXXXXX    ",
      "     XXXXXXXXXXXXX    ",
      "     XXXXXXXXXXXXXX   ",
      "    XXXXXXXXXXXXXXX   ",
      "      XXXXXX        XX",
      "                    XX",
    ],
  },
  germany: {
    label: "Germany",
    rows: [
      "    XXXX        ",
      "    XXXXXXXXXXX ",
      " XXXXXXXXXXXXXX ",
      " XXXXXXXXXXXXXX ",
      " XXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXX    ",
      "XXXXXXXXXXXXX   ",
      "  XXXXXXXXXXXX  ",
      "  XXXXXXXXXXX   ",
      "  XXXXXXXXXXX   ",
    ],
  },
  italy: {
    label: "Italy",
    rows: [
      "   X XXXXXX       ",
      "XXXXXXXXXXX       ",
      "XXXXXXXXX         ",
      "XXXXXXXXXX        ",
      "     XXXXXX       ",
      "      XXXXXXX     ",
      "   X    XXXXXXXX  ",
      "  XXX      XXXXXXX",
      "  XXX        XXX X",
      "   X          XX  ",
      "        XXXXXXX   ",
      "          XXX     ",
    ],
  },
  "united-kingdom": {
    label: "United Kingdom",
    rows: [
      "   XXXX      ",
      "  XXXXXX     ",
      "  XXXXXX     ",
      "  XXXXXX     ",
      "  XXXXXXX    ",
      "XXXXXXXXXX   ",
      "XXX   XXXXX  ",
      "    XXXXXXXX ",
      "    XXXXXXXXX",
      "   XXXXXXXXXX",
      "    XXXXXXXXX",
      "  XXXX X     ",
    ],
  },
  "united-states": {
    label: "United States",
    rows: [
      "XXXXXXXXXXXXXXXX        ",
      "XXXXXXXXXXXXXXXXX     XX",
      "XXXXXXXXXXXXXXXXXX  XXXX",
      "XXXXXXXXXXXXXXXXXXXXXXX ",
      "XXXXXXXXXXXXXXXXXXXXXX  ",
      "XXXXXXXXXXXXXXXXXXXXX   ",
      " XXXXXXXXXXXXXXXXXXXX   ",
      " XXXXXXXXXXXXXXXXXXX    ",
      "   XXXXXXXXXXXXXXXX     ",
      "        XXXXXXXXXX      ",
      "          XX     XX     ",
      "          XX     XX     ",
    ],
  },
  japan: {
    label: "Japan",
    rows: [
      "              XX   ",
      "             XXXXXX",
      "            XXXXX  ",
      "            XXX    ",
      "            XXX    ",
      "            XXX    ",
      "          XXXX     ",
      "       XXXXXXX     ",
      "   XXXXXXXXXX      ",
      " XXXXXXXX          ",
      "XXXXX              ",
      " XX                ",
    ],
  },
  australia: {
    label: "Australia",
    rows: [
      "         XXXXX  XX     ",
      "      XXXXXXXX  XXX    ",
      "     XXXXXXXXXXXXXX    ",
      " XXXXXXXXXXXXXXXXXXXX  ",
      "XXXXXXXXXXXXXXXXXXXXXX ",
      "XXXXXXXXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXXXXXXXXXX",
      " XXXXXXXXXXXXXXXXXXXXXX",
      " XXXXX      XXXXXXXXXX ",
      "               XXXXXX  ",
      "                 XX    ",
      "                  XX   ",
    ],
  },
};

export const countryMapNames = Object.freeze(
  Object.keys(countryShapes) as CountryMapName[],
);

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

function titleRows(
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

function plotLine(
  grid: GridBuilder,
  from: { x: number; y: number },
  to: { x: number; y: number },
  glyph: string,
  style: CellStyle,
): void {
  const distance = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  for (let step = 0; step <= distance; step += 1) {
    const ratio = distance === 0 ? 0 : step / distance;
    grid.set(
      Math.round(from.x + (to.x - from.x) * ratio),
      Math.round(from.y + (to.y - from.y) * ratio),
      glyph,
      "series",
      style,
    );
  }
}

export function gauge(input: GaugeChartInput): GaugeChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("gauge input must be an object.");
  validateFiniteNumber(input.value, "value");
  const minimum = input.min ?? 0;
  const maximum = input.max ?? 100;
  validateFiniteNumber(minimum, "min");
  validateFiniteNumber(maximum, "max");
  if (minimum >= maximum) throw new RangeError("min must be less than max.");
  if (input.label !== undefined) validateText(input.label, "label");
  validateBase(input);
  return Object.freeze({
    type: "gauge",
    value: input.value,
    min: minimum,
    max: maximum,
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...baseFields(input),
  });
}

export function layoutGauge(
  chart: GaugeChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? 12;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const available = height - top - 2;
  if (available < 5)
    throw new RangeError(`layout height ${height} is too short for a gauge.`);
  const centerX = Math.floor(width / 2);
  const radiusX = Math.max(
    4,
    Math.min(Math.floor(width / 2) - 2, available * 2),
  );
  const radiusY = Math.max(2, Math.min(available - 2, Math.floor(radiusX / 2)));
  const centerY = top + radiusY + 1;
  const ratio = Math.max(
    0,
    Math.min(1, (chart.value - chart.min) / (chart.max - chart.min)),
  );
  const arcGlyph = charset === "unicode" ? "●" : "o";
  for (let step = 0; step <= radiusX * 4; step += 1) {
    const angle = Math.PI - (step / (radiusX * 4)) * Math.PI;
    grid.set(
      Math.round(centerX + Math.cos(angle) * radiusX),
      Math.round(centerY - Math.sin(angle) * radiusY),
      arcGlyph,
      "axis",
      { foreground: "muted" },
    );
  }
  const needleAngle = Math.PI - ratio * Math.PI;
  const needleEnd = {
    x: Math.round(centerX + Math.cos(needleAngle) * (radiusX - 2)),
    y: Math.round(centerY - Math.sin(needleAngle) * (radiusY - 1)),
  };
  plotLine(
    grid,
    { x: centerX, y: centerY },
    needleEnd,
    charset === "unicode" ? "•" : "*",
    { foreground: "accent", bold: true },
  );
  grid.set(centerX, centerY, charset === "unicode" ? "◆" : "O", "value", {
    foreground: "accent",
    bold: true,
  });
  const valueText = `${chart.label === undefined ? "" : `${chart.label} `}${formatValue(chart.value)}`;
  grid.text(
    Math.max(0, centerX - Math.floor(measureText(valueText) / 2)),
    Math.min(height - 1, centerY + 1),
    truncateText(valueText, width, palette.ellipsis),
    "value",
    { foreground: "accent", bold: true },
  );
  const minText = formatValue(chart.min);
  const maxText = formatValue(chart.max);
  grid.text(Math.max(0, centerX - radiusX), centerY + 1, minText, "label", {
    foreground: "muted",
  });
  grid.text(
    Math.min(
      width - measureText(maxText),
      centerX + radiusX - measureText(maxText) + 1,
    ),
    centerY + 1,
    maxText,
    "label",
    { foreground: "muted" },
  );
  const heading = chart.title ?? chart.label ?? "Gauge";
  return grid.build(
    chart.description ??
      `${heading}. ${formatValue(chart.value)} on a ${formatValue(chart.min)} to ${formatValue(chart.max)} scale.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
        { key: "min", label: "Minimum" },
        { key: "max", label: "Maximum" },
      ],
      rows: [
        {
          label: chart.label ?? "Value",
          value: chart.value,
          min: chart.min,
          max: chart.max,
        },
      ],
    },
  );
}

function normalizeSeries(
  item: SeriesValuesInput,
  seriesIndex: number,
): SeriesValues {
  if (typeof item !== "object" || item === null)
    throw new TypeError(`series[${seriesIndex}] must be an object.`);
  validateText(item.label, `series[${seriesIndex}].label`);
  if (!Array.isArray(item.values))
    throw new TypeError(`series[${seriesIndex}].values must be an array.`);
  validateDataLength(item.values.length, `series[${seriesIndex}].values`);
  item.values.forEach((value, valueIndex) => {
    if (value !== null) {
      validateFiniteNumber(
        value,
        `series[${seriesIndex}].values[${valueIndex}]`,
      );
      if (value < 0)
        throw new RangeError(
          `series[${seriesIndex}].values[${valueIndex}] cannot be negative.`,
        );
    }
  });
  return Object.freeze({
    label: item.label,
    values: Object.freeze([...item.values]),
  });
}

export function themeRiver(input: ThemeRiverChartInput): ThemeRiverChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("theme-river input must be an object.");
  if (!Array.isArray(input.series))
    throw new TypeError("series must be an array.");
  validateDataLength(input.series.length, "series");
  if (input.series.length > 4)
    throw new RangeError("theme-river charts support at most 4 series.");
  const series = Object.freeze(input.series.map(normalizeSeries));
  const pointCount = series[0]?.values.length ?? 0;
  if (series.some(({ values }) => values.length !== pointCount))
    throw new RangeError("all series must contain the same number of values.");
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "theme-river",
    series,
    showLegend: input.showLegend ?? true,
    ...baseFields(input),
  });
}

export function layoutThemeRiver(
  chart: ThemeRiverChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const plotHeight = height - top - legendRows;
  if (plotHeight < 5)
    throw new RangeError(
      `layout height ${height} is too short for a theme-river chart.`,
    );
  const pointCount = chart.series[0]?.values.length ?? 0;
  if (chart.series.length === 0 || pointCount === 0) {
    grid.text(0, top, "No data", "missing", { foreground: "muted" });
  } else {
    const totals = Array.from({ length: pointCount }, (_, index) =>
      chart.series.reduce(
        (sum, series) => sum + (series.values[index] ?? 0),
        0,
      ),
    );
    const maximum = Math.max(1, ...totals);
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = Math.min(
        pointCount - 1,
        Math.round((x / Math.max(1, width - 1)) * (pointCount - 1)),
      );
      const total = totals[sourceIndex] ?? 0;
      const scaledTotal = Math.round((total / maximum) * (plotHeight - 1));
      const startY = top + Math.floor((plotHeight - scaledTotal) / 2);
      let cursor = startY;
      chart.series.forEach((series, seriesIndex) => {
        const value = series.values[sourceIndex] ?? 0;
        const bandHeight =
          total === 0 ? 0 : Math.round((value / total) * scaledTotal);
        const nextCursor =
          seriesIndex === chart.series.length - 1
            ? startY + scaledTotal
            : cursor + bandHeight;
        for (let y = cursor; y < nextCursor; y += 1) {
          const bandGlyph =
            charset === "unicode"
              ? (["█", "▓", "▒", "░"][seriesIndex] ?? "█")
              : (["#", "+", "=", "*"][seriesIndex] ?? "#");
          grid.set(x, y, bandGlyph, "series", seriesStyles[seriesIndex], {
            label: series.label,
            value,
          });
        }
        cursor = nextCursor;
      });
    }
  }
  if (legendRows > 0) {
    let legendX = 0;
    const legendY = height - 1;
    chart.series.forEach((series, index) => {
      const entry = `${charset === "unicode" ? "■" : String(index + 1)} ${series.label}`;
      if (legendX + measureText(entry) <= width) {
        grid.text(legendX, legendY, entry, "label", seriesStyles[index]);
        legendX += measureText(entry) + 2;
      }
    });
  }
  const heading = chart.title ?? "Theme river";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.series.length} centered streams across ${pointCount} points.`,
    {
      caption: heading,
      columns: [
        { key: "series", label: "Series" },
        { key: "index", label: "Point" },
        { key: "value", label: "Value" },
      ],
      rows: chart.series.flatMap((series) =>
        series.values.map((value, index) => ({
          series: series.label,
          index: index + 1,
          value,
        })),
      ),
    },
  );
}

export function pictorialBar(input: PictorialBarChartInput): PictorialBarChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("pictorial-bar input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const data: readonly BarDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`data[${index}] must be an object.`);
      validateText(datum.label, `data[${index}].label`);
      validateFiniteNumber(datum.value, `data[${index}].value`);
      if (datum.value < 0)
        throw new RangeError(`data[${index}].value cannot be negative.`);
      return Object.freeze({ label: datum.label, value: datum.value });
    }),
  );
  const symbol = input.symbol ?? "◆";
  validateText(symbol, "symbol");
  if (measureText(symbol) !== 1)
    throw new RangeError("symbol must occupy exactly one display column.");
  if (input.showValues !== undefined && typeof input.showValues !== "boolean")
    throw new TypeError("showValues must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "pictorial-bar",
    data,
    symbol,
    showValues: input.showValues ?? true,
    ...baseFields(input),
  });
}

export function layoutPictorialBar(
  chart: PictorialBarChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleCount = chart.title === undefined ? 0 : 2;
  const naturalHeight = titleCount + Math.max(1, chart.data.length);
  const height = options.height ?? chart.height ?? naturalHeight;
  validateViewport(width, height);
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; pictorial-bar requires ${naturalHeight} rows.`,
    );
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const labelWidth = Math.min(
    Math.max(1, ...chart.data.map(({ label }) => measureText(label))),
    Math.floor(width * 0.3),
  );
  const maximum = Math.max(0, ...chart.data.map(({ value }) => value));
  const maxValueWidth = chart.showValues
    ? Math.max(
        0,
        ...chart.data.map(({ value }) => measureText(formatValue(value))),
      ) + 1
    : 0;
  const plotX = labelWidth + 2;
  const plotWidth = width - plotX - maxValueWidth;
  if (plotWidth < 1)
    throw new RangeError(
      `layout width ${width} is too narrow for pictorial-bar.`,
    );
  if (chart.data.length === 0)
    grid.text(0, top, "No data", "missing", { foreground: "muted" });
  chart.data.forEach((datum, index) => {
    const y = top + index;
    grid.text(
      0,
      y,
      truncateText(datum.label, labelWidth, palette.ellipsis),
      "label",
    );
    const count =
      maximum === 0
        ? 0
        : Math.max(1, Math.round((datum.value / maximum) * plotWidth));
    const symbol =
      charset === "ascii" &&
      Array.from(chart.symbol).some(
        (character) => (character.codePointAt(0) ?? 0) > 0x7f,
      )
        ? "*"
        : chart.symbol;
    for (let x = 0; x < count; x += 1)
      grid.set(
        plotX + x,
        y,
        symbol,
        "positive",
        { foreground: "series1" },
        datum,
      );
    if (chart.showValues)
      grid.text(plotX + plotWidth + 1, y, formatValue(datum.value), "value");
  });
  const heading = chart.title ?? "Pictorial bar chart";
  return grid.build(
    chart.description ?? `${heading}. ${chart.data.length} symbol bars.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
      ],
      rows: chart.data.map(({ label, value }) => ({ label, value })),
    },
  );
}

export function choroplethMap(
  input: ChoroplethMapChartInput,
): ChoroplethMapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("choropleth-map input must be an object.");
  if (!Array.isArray(input.shape))
    throw new TypeError("shape must be an array of strings.");
  validateDataLength(input.shape.length, "shape");
  input.shape.forEach((row, index) =>
    validateText(row, `shape[${index}]`, { allowEmpty: true }),
  );
  const shapeWidth = measureText(input.shape[0] ?? "");
  if (input.shape.some((row) => measureText(row) !== shapeWidth))
    throw new RangeError("all shape rows must have the same display width.");
  if (!Array.isArray(input.regions))
    throw new TypeError("regions must be an array.");
  validateDataLength(input.regions.length, "regions");
  const ids = new Set<string>();
  const regions: readonly MapRegion[] = Object.freeze(
    input.regions.map((region, index) => {
      if (typeof region !== "object" || region === null)
        throw new TypeError(`regions[${index}] must be an object.`);
      validateText(region.id, `regions[${index}].id`);
      if (measureText(region.id) !== 1)
        throw new RangeError(
          `regions[${index}].id must occupy one display column.`,
        );
      if (region.id === "." || region.id === " ")
        throw new RangeError(
          `regions[${index}].id cannot be a map background symbol.`,
        );
      if (ids.has(region.id))
        throw new RangeError(`region id ${region.id} must be unique.`);
      ids.add(region.id);
      validateText(region.label, `regions[${index}].label`);
      validateFiniteNumber(region.value, `regions[${index}].value`);
      return Object.freeze({
        id: region.id,
        label: region.label,
        value: region.value,
      });
    }),
  );
  const shapeIds = new Set<string>();
  input.shape.forEach((row) => {
    for (const id of String(row)) {
      if (id !== " " && id !== ".") shapeIds.add(id);
    }
  });
  for (const id of shapeIds) {
    if (!ids.has(id))
      throw new RangeError(`shape references unknown region id ${id}.`);
  }
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "choropleth-map",
    shape: Object.freeze([...input.shape]),
    regions,
    showLegend: input.showLegend ?? true,
    ...baseFields(input),
  });
}

export function layoutChoroplethMap(
  chart: ChoroplethMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleCount = chart.title === undefined ? 0 : 2;
  const legendRows = chart.showLegend && chart.regions.length > 0 ? 2 : 0;
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const mapDensity =
    charset === "unicode"
      ? (["░", "▒", "▓", "█"] as const)
      : ([".", ":", "*", "#", "@"] as const);
  const shapeWidth = measureText(chart.shape[0] ?? "");
  if (shapeWidth > width)
    throw new RangeError(
      `layout width ${width} is too narrow for the map shape.`,
    );
  const scaleX =
    shapeWidth === 0
      ? 1
      : Math.max(1, Math.min(3, Math.floor((width - 2) / shapeWidth)));
  const preferredScaleY = chart.shape.length === 0 ? 1 : 2;
  const requestedHeight = options.height ?? chart.height;
  const scaleY =
    requestedHeight === undefined || chart.shape.length === 0
      ? preferredScaleY
      : Math.max(
          1,
          Math.min(
            preferredScaleY,
            Math.floor(
              (requestedHeight - titleCount - legendRows) / chart.shape.length,
            ),
          ),
        );
  const mapHeight = Math.max(1, chart.shape.length * scaleY);
  const naturalHeight = titleCount + mapHeight + legendRows;
  const height = requestedHeight ?? naturalHeight;
  validateViewport(width, height);
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; choropleth-map requires ${naturalHeight} rows.`,
    );
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const mapWidth = shapeWidth * scaleX;
  const startX = Math.floor((width - mapWidth) / 2);
  const values = chart.regions.map(({ value }) => value);
  const minimum = values.length === 0 ? 0 : Math.min(...values);
  const maximum = values.length === 0 ? 1 : Math.max(...values);
  const regionById = new Map(
    chart.regions.map((region) => [region.id, region]),
  );
  const rows = chart.shape.map((row) => Array.from(row));
  if (chart.shape.length === 0)
    grid.text(0, top, "No data", "missing", { foreground: "muted" });
  rows.forEach((row, rowIndex) => {
    row.forEach((id, columnIndex) => {
      if (id === " " || id === ".") return;
      const region = regionById.get(id);
      if (region === undefined) return;
      const ratio =
        maximum === minimum
          ? 0.65
          : (region.value - minimum) / (maximum - minimum);
      const level = Math.min(
        mapDensity.length - 1,
        Math.floor(ratio * mapDensity.length),
      );
      const style = {
        foreground:
          `series${(chart.regions.indexOf(region) % 4) + 1}` as "series1",
      };
      for (let y = 0; y < scaleY; y += 1) {
        for (let x = 0; x < scaleX; x += 1) {
          grid.set(
            startX + columnIndex * scaleX + x,
            top + rowIndex * scaleY + y,
            mapDensity[level] ?? palette.fill,
            "series",
            style,
            { label: region.label, value: region.value },
          );
        }
      }
    });
  });
  chart.regions.forEach((region) => {
    const cells = rows.flatMap((row, rowIndex) =>
      row.flatMap((id, columnIndex) =>
        id === region.id ? [{ rowIndex, columnIndex }] : [],
      ),
    );
    if (cells.length === 0) return;
    const averageColumn =
      cells.reduce((sum, cell) => sum + cell.columnIndex, 0) / cells.length;
    const averageRow =
      cells.reduce((sum, cell) => sum + cell.rowIndex, 0) / cells.length;
    const center = cells.reduce((nearest, cell) => {
      const distance =
        (cell.columnIndex - averageColumn) ** 2 +
        (cell.rowIndex - averageRow) ** 2;
      const nearestDistance =
        (nearest.columnIndex - averageColumn) ** 2 +
        (nearest.rowIndex - averageRow) ** 2;
      return distance < nearestDistance ? cell : nearest;
    });
    grid.set(
      startX + center.columnIndex * scaleX + Math.floor(scaleX / 2),
      top + center.rowIndex * scaleY + Math.floor(scaleY / 2),
      region.id,
      "label",
      { foreground: "accent", bold: true },
      { label: region.label, value: region.value },
    );
  });
  if (legendRows > 0) {
    const legend = `${formatValue(minimum)} ${mapDensity.join("")} ${formatValue(maximum)}`;
    grid.text(
      Math.max(0, Math.floor((width - measureText(legend)) / 2)),
      height - 1,
      truncateText(legend, width, palette.ellipsis),
      "label",
      { foreground: "muted" },
    );
    const entries = chart.regions.map(
      ({ id, label }) => `${id} ${truncateText(label, 10, palette.ellipsis)}`,
    );
    const totalWidth = entries.reduce(
      (sum, entry) => sum + measureText(entry),
      Math.max(0, entries.length - 1) * 2,
    );
    let legendX = Math.max(0, Math.floor((width - totalWidth) / 2));
    entries.forEach((entry, index) => {
      if (legendX >= width) return;
      grid.text(
        legendX,
        height - 2,
        truncateText(entry, width - legendX, palette.ellipsis),
        "label",
        seriesStyles[index % seriesStyles.length],
      );
      legendX += measureText(entry) + 2;
    });
  }
  const heading = chart.title ?? "Choropleth map";
  return grid.build(
    chart.description ?? `${heading}. ${chart.regions.length} shaded regions.`,
    {
      caption: heading,
      columns: [
        { key: "id", label: "Region ID" },
        { key: "label", label: "Region" },
        { key: "value", label: "Value" },
      ],
      rows: chart.regions.map(({ id, label, value }) => ({ id, label, value })),
    },
  );
}

export function countryMap(input: CountryMapChartInput): CountryMapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("country-map input must be an object.");
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const seen = new Set<CountryMapName>();
  const data: readonly CountryMapDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`data[${index}] must be an object.`);
      if (
        typeof datum.country !== "string" ||
        !Object.hasOwn(countryShapes, datum.country)
      )
        throw new RangeError(
          `data[${index}].country must be one of: ${countryMapNames.join(", ")}.`,
        );
      if (seen.has(datum.country))
        throw new RangeError(`country ${datum.country} can only appear once.`);
      seen.add(datum.country);
      validateFiniteNumber(datum.value, `data[${index}].value`);
      if (datum.label !== undefined)
        validateText(datum.label, `data[${index}].label`);
      return Object.freeze({
        country: datum.country,
        value: datum.value,
        ...(datum.label !== undefined ? { label: datum.label } : {}),
      });
    }),
  );
  if (input.showValues !== undefined && typeof input.showValues !== "boolean")
    throw new TypeError("showValues must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "country-map",
    data,
    showValues: input.showValues ?? true,
    ...baseFields(input),
  });
}

export function layoutCountryMap(
  chart: CountryMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleCount = chart.title === undefined ? 0 : 2;
  const maximumShapeWidth = Math.max(
    1,
    ...chart.data.map(({ country }) =>
      Math.max(...countryShapes[country].rows.map((row) => measureText(row))),
    ),
  );
  const shapeHeight = Math.max(
    1,
    ...chart.data.map(({ country }) => countryShapes[country].rows.length),
  );
  const panelWidth = maximumShapeWidth + 2;
  const columns = Math.max(1, Math.min(2, Math.floor(width / panelWidth)));
  const panelHeight = shapeHeight + 2;
  const panelRows = Math.max(1, Math.ceil(chart.data.length / columns));
  const naturalHeight = titleCount + panelRows * panelHeight;
  const height = options.height ?? chart.height ?? naturalHeight;
  validateViewport(width, height);
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; country-map requires ${naturalHeight} rows.`,
    );
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const density =
    charset === "unicode"
      ? (["░", "▒", "▓", "█"] as const)
      : ([".", ":", "*", "#", "@"] as const);
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const values = chart.data.map(({ value }) => value);
  const minimum = values.length === 0 ? 0 : Math.min(...values);
  const maximum = values.length === 0 ? 1 : Math.max(...values);
  if (chart.data.length === 0)
    grid.text(0, top, "No data", "missing", { foreground: "muted" });
  chart.data.forEach((datum, index) => {
    const panelColumn = index % columns;
    const panelRow = Math.floor(index / columns);
    const actualPanelWidth = Math.floor(width / columns);
    const panelX = panelColumn * actualPanelWidth;
    const panelY = top + panelRow * panelHeight;
    const shape = countryShapes[datum.country];
    const shapeWidth = Math.max(...shape.rows.map((row) => measureText(row)));
    const shapeX =
      panelX + Math.max(0, Math.floor((actualPanelWidth - shapeWidth) / 2));
    const ratio =
      maximum === minimum
        ? 0.65
        : (datum.value - minimum) / (maximum - minimum);
    const level = Math.min(
      density.length - 1,
      Math.floor(Math.max(0, Math.min(1, ratio)) * density.length),
    );
    const glyph = density[level] ?? density[0];
    const style = seriesStyles[index % seriesStyles.length];
    shape.rows.forEach((row, rowIndex) => {
      Array.from(row).forEach((cell, columnIndex) => {
        if (cell !== "X") return;
        grid.set(
          shapeX + columnIndex,
          panelY + rowIndex,
          glyph,
          "series",
          style,
          { label: datum.label ?? shape.label, value: datum.value },
        );
      });
    });
    const label = `${datum.label ?? shape.label}${chart.showValues ? ` ${formatValue(datum.value)}` : ""}`;
    grid.text(
      panelX +
        Math.max(0, Math.floor((actualPanelWidth - measureText(label)) / 2)),
      panelY + shapeHeight,
      truncateText(label, actualPanelWidth, palette.ellipsis),
      "label",
      style,
    );
  });
  const heading = chart.title ?? "Country maps";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.data.length} countries shown as geographic silhouettes.`,
    {
      caption: heading,
      columns: [
        { key: "country", label: "Country" },
        { key: "label", label: "Label" },
        { key: "value", label: "Value" },
      ],
      rows: chart.data.map(({ country, label, value }) => ({
        country,
        label: label ?? countryShapes[country].label,
        value,
      })),
    },
  );
}

function normalizePoint(point: unknown, field: string): RoutePoint {
  if (typeof point !== "object" || point === null)
    throw new TypeError(`${field} must be an object.`);
  const candidate = point as { x?: unknown; y?: unknown; label?: unknown };
  validateFiniteNumber(candidate.x, `${field}.x`);
  validateFiniteNumber(candidate.y, `${field}.y`);
  if (candidate.label !== undefined)
    validateText(candidate.label, `${field}.label`);
  return Object.freeze({
    x: candidate.x,
    y: candidate.y,
    ...(candidate.label !== undefined ? { label: candidate.label } : {}),
  });
}

export function routeMap(input: RouteMapChartInput): RouteMapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("route-map input must be an object.");
  if (!Array.isArray(input.routes))
    throw new TypeError("routes must be an array.");
  validateDataLength(input.routes.length, "routes");
  const routes: readonly Route[] = Object.freeze(
    input.routes.map((route, index) => {
      if (typeof route !== "object" || route === null)
        throw new TypeError(`routes[${index}] must be an object.`);
      const value = route.value ?? 1;
      validateFiniteNumber(value, `routes[${index}].value`);
      if (value < 0)
        throw new RangeError(`routes[${index}].value cannot be negative.`);
      return Object.freeze({
        from: normalizePoint(route.from, `routes[${index}].from`),
        to: normalizePoint(route.to, `routes[${index}].to`),
        value,
      });
    }),
  );
  validateBase(input);
  return Object.freeze({ type: "route-map", routes, ...baseFields(input) });
}

export function layoutRouteMap(
  chart: RouteMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  const top = titleRows(grid, chart, width, palette.ellipsis);
  const plotHeight = height - top - 1;
  if (plotHeight < 5)
    throw new RangeError(
      `layout height ${height} is too short for a route-map.`,
    );
  const points = chart.routes.flatMap(({ from, to }) => [from, to]);
  if (points.length === 0) {
    grid.text(0, top, "No data", "missing", { foreground: "muted" });
  } else {
    const minX = Math.min(...points.map(({ x }) => x));
    const maxX = Math.max(...points.map(({ x }) => x));
    const minY = Math.min(...points.map(({ y }) => y));
    const maxY = Math.max(...points.map(({ y }) => y));
    const xScale = linearScale(minX, maxX, 1, width - 2);
    const yScale = linearScale(minY, maxY, top + plotHeight - 1, top);
    const projected = chart.routes.map((route, index) => ({
      route,
      from: {
        x: Math.round(xScale.map(route.from.x)),
        y: Math.round(yScale.map(route.from.y)),
      },
      to: {
        x: Math.round(xScale.map(route.to.x)),
        y: Math.round(yScale.map(route.to.y)),
      },
      style: seriesStyles[index % seriesStyles.length] ?? {
        foreground: "series1",
      },
    }));
    projected.forEach(({ from, to, style }) => {
      plotLine(grid, from, to, charset === "unicode" ? "·" : ".", style);
    });
    projected.forEach(({ route, from, style }) => {
      grid.set(
        from.x,
        from.y,
        charset === "unicode" ? "●" : "o",
        "series",
        style,
        {
          label: route.from.label ?? "Origin",
          value: route.value,
        },
      );
    });
    projected.forEach(({ route, from, to, style }) => {
      const horizontal = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
      const arrow =
        charset === "ascii"
          ? horizontal
            ? to.x >= from.x
              ? ">"
              : "<"
            : to.y >= from.y
              ? "v"
              : "^"
          : horizontal
            ? to.x >= from.x
              ? "▶"
              : "◀"
            : to.y >= from.y
              ? "▼"
              : "▲";
      grid.set(to.x, to.y, arrow, "series", style, {
        label: route.to.label ?? "Destination",
        value: route.value,
      });
    });
    const labelled = new Set<string>();
    projected.forEach(({ route, from, to, style }) => {
      const candidates = [
        { point: route.from, position: from },
        { point: route.to, position: to },
      ];
      candidates.forEach(({ point, position }) => {
        if (point.label === undefined) return;
        const key = `${position.x},${position.y},${point.label}`;
        if (labelled.has(key)) return;
        labelled.add(key);
        const labelWidth = measureText(point.label);
        const fitsRight = position.x + 1 + labelWidth < width;
        const available = fitsRight ? width - position.x - 1 : position.x;
        const label = truncateText(point.label, available, palette.ellipsis);
        const labelX = fitsRight
          ? position.x + 1
          : Math.max(0, position.x - measureText(label));
        grid.text(labelX, position.y, label, "label", style);
      });
    });
  }
  const heading = chart.title ?? "Route map";
  return grid.build(
    chart.description ?? `${heading}. ${chart.routes.length} directed routes.`,
    {
      caption: heading,
      columns: [
        { key: "from", label: "From" },
        { key: "to", label: "To" },
        { key: "fromX", label: "From X" },
        { key: "fromY", label: "From Y" },
        { key: "toX", label: "To X" },
        { key: "toY", label: "To Y" },
        { key: "value", label: "Value" },
      ],
      rows: chart.routes.map(({ from, to, value }) => ({
        from: from.label ?? "Origin",
        to: to.label ?? "Destination",
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        value,
      })),
    },
  );
}
