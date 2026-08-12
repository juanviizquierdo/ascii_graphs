import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import { stackedBar } from "./stacked-bar.js";

import type {
  CellGrid,
  CellStyle,
  CharacterSet,
  DataTableRow,
  GroupedBarChart,
  GroupedBarChartInput,
  LayoutOptions,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const fills: Record<CharacterSet, readonly string[]> = {
  ascii: ["#", "=", "+", "-"],
  unicode: ["█", "▓", "▒", "░"],
};
const styles: readonly CellStyle[] = [
  { foreground: "series1" },
  { foreground: "series2" },
  { foreground: "series3" },
  { foreground: "series4" },
];

export function groupedBar(input: GroupedBarChartInput): GroupedBarChart {
  const base = stackedBar(input);
  return Object.freeze({ ...base, type: "grouped-bar" });
}

function describe(chart: GroupedBarChart): string {
  if (chart.description !== undefined) return chart.description;
  const heading = chart.title ?? "Grouped bar chart";
  if (chart.rows.length === 0) return `${heading}. No data.`;
  return `${heading}. ${chart.rows.length} groups across ${chart.series.length} series.`;
}

export function layoutGroupedBar(
  chart: GroupedBarChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const dataRows = chart.rows.length * Math.max(1, chart.series.length);
  const legendRows = chart.showLegend && chart.series.length > 0 ? 2 : 0;
  const naturalHeight = titleRows + Math.max(1, dataRows) + legendRows;
  const height = options.height ?? chart.height ?? naturalHeight;
  if (height < naturalHeight) {
    throw new RangeError(
      `layout height ${height} is too short; this chart requires at least ${naturalHeight} rows.`,
    );
  }
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const labelWidth = Math.min(
    Math.max(
      1,
      ...chart.rows.flatMap((row) =>
        chart.series.map((series) => measureText(`${row.label}/${series}`)),
      ),
    ),
    Math.max(1, Math.floor(width * 0.35)),
  );
  const plotX = labelWidth + 1;
  const plotWidth = width - plotX;
  if (plotWidth < 4) {
    throw new RangeError(
      `layout width ${width} is too narrow for grouped bars.`,
    );
  }
  const maximum = Math.max(0, ...chart.rows.flatMap(({ values }) => values));
  const grid = new GridBuilder(width, height);
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
  }
  if (chart.rows.length === 0) {
    grid.text(0, titleRows, "No data", "missing", { foreground: "muted" });
  } else {
    let y = titleRows;
    chart.rows.forEach((row) => {
      chart.series.forEach((series, seriesIndex) => {
        const label = `${row.label}/${series}`;
        grid.text(
          0,
          y,
          truncateText(label, labelWidth, palette.ellipsis),
          "label",
        );
        const value = row.values[seriesIndex] ?? 0;
        const length =
          maximum === 0 ? 0 : Math.round((value / maximum) * plotWidth);
        const glyph =
          fills[charset][seriesIndex % fills[charset].length] ?? palette.fill;
        for (let offset = 0; offset < length; offset += 1) {
          grid.set(
            plotX + offset,
            y,
            glyph,
            "series",
            styles[seriesIndex % styles.length],
            {
              label: series,
              value,
            },
          );
        }
        if (value === 0)
          grid.set(plotX, y, palette.missing, "missing", {
            foreground: "muted",
          });
        y += 1;
      });
    });
    if (chart.showLegend) {
      const legend = chart.series
        .map(
          (label, index) =>
            `${fills[charset][index % fills[charset].length]} ${label}`,
        )
        .join("  ");
      grid.text(
        0,
        y + 1,
        truncateText(legend, width, palette.ellipsis),
        "label",
        {
          foreground: "muted",
        },
      );
    }
  }
  const columns = [
    { key: "row", label: "Row" },
    ...chart.series.map((label, index) => ({ key: `series_${index}`, label })),
  ];
  const rows: DataTableRow[] = chart.rows.map((row) => {
    const tableRow: DataTableRow = { row: row.label };
    row.values.forEach((value, index) => {
      tableRow[`series_${index}`] = value;
    });
    return tableRow;
  });
  return grid.build(describe(chart), {
    caption: chart.title ?? "Grouped bar chart",
    columns,
    rows,
  });
}
