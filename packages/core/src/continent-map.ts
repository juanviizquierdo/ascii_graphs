import { formatValue } from "./bar.js";
import { continentPresets } from "./continent-presets.js";
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
  ChartBase,
  ContinentCountryDatum,
  ContinentMapChart,
  ContinentMapChartInput,
  ContinentMapName,
  LayoutOptions,
} from "./types.js";

interface CountryMetadata {
  readonly code: string;
  readonly label: string;
}

interface ContinentPreset {
  readonly label: string;
  readonly rows: readonly string[];
  readonly countries: Readonly<Record<string, CountryMetadata>>;
}

const presets = continentPresets as unknown as Readonly<
  Record<ContinentMapName, ContinentPreset>
>;
const styles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];
const markerGlyphs = Array.from(
  "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
);

export const continentMapNames = Object.freeze(
  Object.keys(presets) as ContinentMapName[],
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

function countriesByCode(
  continent: ContinentMapName,
): Map<string, CountryMetadata> {
  return new Map(
    Object.values(presets[continent].countries).map((country) => [
      country.code,
      country,
    ]),
  );
}

export function getContinentCountries(
  continent: ContinentMapName,
): readonly CountryMetadata[] {
  if (!Object.hasOwn(presets, continent))
    throw new RangeError(
      `continent must be one of: ${continentMapNames.join(", ")}.`,
    );
  return Object.freeze(
    [...countriesByCode(continent).values()]
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((country) => Object.freeze({ ...country })),
  );
}

export function continentMap(input: ContinentMapChartInput): ContinentMapChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("continent-map input must be an object.");
  if (
    typeof input.continent !== "string" ||
    !Object.hasOwn(presets, input.continent)
  )
    throw new RangeError(
      `continent must be one of: ${continentMapNames.join(", ")}.`,
    );
  if (!Array.isArray(input.data)) throw new TypeError("data must be an array.");
  validateDataLength(input.data.length);
  const supported = countriesByCode(input.continent);
  const seen = new Set<string>();
  const data: readonly ContinentCountryDatum[] = Object.freeze(
    input.data.map((datum, index) => {
      if (typeof datum !== "object" || datum === null)
        throw new TypeError(`data[${index}] must be an object.`);
      validateText(datum.country, `data[${index}].country`);
      const code = datum.country.toUpperCase();
      if (!supported.has(code))
        throw new RangeError(
          `${code} is not available in the ${input.continent} preset.`,
        );
      if (seen.has(code))
        throw new RangeError(`country ${code} can only appear once.`);
      seen.add(code);
      validateFiniteNumber(datum.value, `data[${index}].value`);
      if (datum.label !== undefined)
        validateText(datum.label, `data[${index}].label`);
      return Object.freeze({
        country: code,
        value: datum.value,
        ...(datum.label !== undefined ? { label: datum.label } : {}),
      });
    }),
  );
  if (input.showLegend !== undefined && typeof input.showLegend !== "boolean")
    throw new TypeError("showLegend must be a boolean.");
  validateBase(input);
  return Object.freeze({
    type: "continent-map",
    continent: input.continent,
    data,
    showLegend: input.showLegend ?? true,
    ...baseFields(input),
  });
}

function wrapLegend(entries: readonly string[], width: number): string[][] {
  const lines: string[][] = [];
  for (const entry of entries) {
    const current = lines.at(-1);
    const currentWidth =
      current?.reduce(
        (sum, item) => sum + measureText(item),
        Math.max(0, current.length - 1) * 2,
      ) ?? 0;
    if (
      current === undefined ||
      (current.length > 0 && currentWidth + 2 + measureText(entry) > width)
    )
      lines.push([entry]);
    else current.push(entry);
  }
  return lines;
}

function colorCountries(
  rows: readonly (readonly string[])[],
): Map<string, number> {
  const adjacency = new Map<string, Set<string>>();
  const connect = (left: string, right: string | undefined): void => {
    if (left === " " || right === undefined || right === " " || left === right)
      return;
    const neighbors = adjacency.get(left) ?? new Set<string>();
    neighbors.add(right);
    adjacency.set(left, neighbors);
    const reverse = adjacency.get(right) ?? new Set<string>();
    reverse.add(left);
    adjacency.set(right, reverse);
  };
  rows.forEach((row, rowIndex) => {
    row.forEach((token, columnIndex) => {
      if (token === " ") return;
      if (!adjacency.has(token)) adjacency.set(token, new Set());
      connect(token, row[columnIndex + 1]);
      connect(token, rows[rowIndex + 1]?.[columnIndex]);
    });
  });
  const colors = new Map<string, number>();
  [...adjacency]
    .sort((left, right) => right[1].size - left[1].size)
    .forEach(([token, neighbors]) => {
      const used = new Set(
        [...neighbors].flatMap((neighbor) => {
          const color = colors.get(neighbor);
          return color === undefined ? [] : [color];
        }),
      );
      colors.set(token, [0, 1, 2, 3].find((color) => !used.has(color)) ?? 0);
    });
  return colors;
}

export function layoutContinentMap(
  chart: ContinentMapChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? 60;
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const preset = presets[chart.continent];
  const countries = countriesByCode(chart.continent);
  const markers = chart.data.map(
    (_, index) => markerGlyphs[index % markerGlyphs.length] ?? "?",
  );
  const legendEntries = chart.data.map((datum, index) => {
    const label =
      datum.label ?? countries.get(datum.country)?.label ?? datum.country;
    return `${markers[index]} ${datum.country} ${truncateText(label, 12, palette.ellipsis)} ${formatValue(datum.value)}`;
  });
  const legendLines = chart.showLegend ? wrapLegend(legendEntries, width) : [];
  const titleRows = chart.title === undefined ? 0 : 2;
  const sourceWidth = Math.max(...preset.rows.map((row) => measureText(row)));
  const mapWidth = Math.min(width, sourceWidth);
  const mapHeight = preset.rows.length;
  const legendRows = chart.showLegend ? legendLines.length + 1 : 0;
  const naturalHeight = titleRows + mapHeight + legendRows;
  const height = options.height ?? chart.height ?? naturalHeight;
  validateViewport(width, height);
  if (height < naturalHeight)
    throw new RangeError(
      `layout height ${height} is too short; continent-map requires ${naturalHeight} rows.`,
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
  const startX = Math.floor((width - mapWidth) / 2);
  const dataByCode = new Map(chart.data.map((datum) => [datum.country, datum]));
  const dataIndex = new Map(
    chart.data.map((datum, index) => [datum.country, index]),
  );
  const values = chart.data.map(({ value }) => value);
  const minimum = values.length === 0 ? 0 : Math.min(...values);
  const maximum = values.length === 0 ? 1 : Math.max(...values);
  const density =
    charset === "unicode"
      ? (["░", "▒", "▓", "█"] as const)
      : ([".", ":", "*", "#", "@"] as const);
  const projected = preset.rows.map((row) =>
    Array.from({ length: mapWidth }, (_, index) => {
      const source = Math.min(
        sourceWidth - 1,
        Math.floor((index / Math.max(1, mapWidth)) * sourceWidth),
      );
      return Array.from(row)[source] ?? " ";
    }),
  );
  const countryColors = colorCountries(projected);
  projected.forEach((row, rowIndex) => {
    row.forEach((token, columnIndex) => {
      if (token === " ") return;
      const country = preset.countries[token];
      if (country === undefined) return;
      const datum = dataByCode.get(country.code);
      const index = dataIndex.get(country.code);
      const ratio =
        datum === undefined
          ? 0
          : maximum === minimum
            ? 0.65
            : (datum.value - minimum) / (maximum - minimum);
      const level = Math.min(
        density.length - 1,
        Math.floor(Math.max(0, Math.min(1, ratio)) * density.length),
      );
      grid.set(
        startX + columnIndex,
        titleRows + rowIndex,
        datum === undefined
          ? (density[countryColors.get(token) ?? 0] ?? density[0])
          : (density[level] ?? density[0]),
        datum === undefined ? "missing" : "series",
        datum === undefined
          ? {
              foreground:
                `series${((countryColors.get(token) ?? 0) % 4) + 1}` as "series1",
            }
          : styles[index ?? 0],
        {
          label: datum?.label ?? country.label,
          value: datum?.value ?? 0,
        },
      );
    });
  });
  chart.data.forEach((datum, index) => {
    const tokens = Object.entries(preset.countries)
      .filter(([, country]) => country.code === datum.country)
      .map(([token]) => token);
    const cells = projected.flatMap((row, rowIndex) =>
      row.flatMap((token, columnIndex) =>
        tokens.includes(token) ? [{ rowIndex, columnIndex }] : [],
      ),
    );
    if (cells.length === 0) return;
    const averageX =
      cells.reduce((sum, cell) => sum + cell.columnIndex, 0) / cells.length;
    const averageY =
      cells.reduce((sum, cell) => sum + cell.rowIndex, 0) / cells.length;
    const center = cells.reduce((nearest, cell) => {
      const distance =
        (cell.columnIndex - averageX) ** 2 + (cell.rowIndex - averageY) ** 2;
      const nearestDistance =
        (nearest.columnIndex - averageX) ** 2 +
        (nearest.rowIndex - averageY) ** 2;
      return distance < nearestDistance ? cell : nearest;
    });
    grid.set(
      startX + center.columnIndex,
      titleRows + center.rowIndex,
      markers[index] ?? "?",
      "label",
      { foreground: "accent", bold: true },
      {
        label:
          datum.label ?? countries.get(datum.country)?.label ?? datum.country,
        value: datum.value,
      },
    );
  });
  if (chart.showLegend) {
    const summary = `${preset.label} · ${chart.data.length}/${countries.size} countries with data`;
    grid.text(
      Math.max(0, Math.floor((width - measureText(summary)) / 2)),
      titleRows + mapHeight,
      truncateText(summary, width, palette.ellipsis),
      "label",
      { foreground: "muted" },
    );
    legendLines.forEach((line, lineIndex) => {
      let x = Math.max(
        0,
        Math.floor(
          (width -
            line.reduce(
              (sum, entry) => sum + measureText(entry),
              Math.max(0, line.length - 1) * 2,
            )) /
            2,
        ),
      );
      line.forEach((entry) => {
        grid.text(x, titleRows + mapHeight + lineIndex + 1, entry, "label");
        x += measureText(entry) + 2;
      });
    });
  }
  const heading = chart.title ?? `${preset.label} map`;
  return grid.build(
    chart.description ??
      `${heading}. Country boundaries with data for ${chart.data.length} of ${countries.size} countries.`,
    {
      caption: heading,
      columns: [
        { key: "country", label: "Country code" },
        { key: "label", label: "Country" },
        { key: "value", label: "Value" },
      ],
      rows: chart.data.map(({ country, label, value }) => ({
        country,
        label: label ?? countries.get(country)?.label ?? country,
        value,
      })),
    },
  );
}
