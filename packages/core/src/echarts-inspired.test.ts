import { describe, expect, it } from "vitest";

import {
  choroplethMap,
  countryMap,
  countryMapNames,
  gauge,
  layout,
  layoutChoroplethMap,
  layoutCountryMap,
  layoutGauge,
  layoutPictorialBar,
  layoutRouteMap,
  layoutThemeRiver,
  pictorialBar,
  routeMap,
  themeRiver,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("gauge", () => {
  it("renders a dial and exposes its range as data", () => {
    const grid = layoutGauge(gauge({ label: "CPU", value: 73 }), {
      width: 40,
      height: 12,
    });
    expect(text(grid)).toContain("CPU 73");
    expect(text(grid)).toContain("◆");
    expect(grid.table.rows[0]).toMatchObject({ value: 73, min: 0, max: 100 });
  });

  it("requires a valid finite range", () => {
    expect(() => gauge({ value: Number.NaN })).toThrow("finite number");
    expect(() => gauge({ value: 2, min: 5, max: 5 })).toThrow("less than max");
  });
});

describe("themeRiver", () => {
  it("centers multiple streams and preserves nullable observations", () => {
    const values = [2, 4, null, 3];
    const chart = themeRiver({
      series: [
        { label: "Web", values },
        { label: "API", values: [1, 2, 3, 4] },
      ],
    });
    values[0] = 99;
    const grid = layoutThemeRiver(chart, { width: 40, height: 12 });
    expect(chart.series[0]?.values[0]).toBe(2);
    expect(text(grid)).toContain("Web");
    expect(grid.table.rows).toHaveLength(8);
  });

  it("rejects negative, mismatched, or excessive series", () => {
    expect(() =>
      themeRiver({ series: [{ label: "A", values: [-1] }] }),
    ).toThrow("cannot be negative");
    expect(() =>
      themeRiver({
        series: [
          { label: "A", values: [1] },
          { label: "B", values: [1, 2] },
        ],
      }),
    ).toThrow("same number");
  });
});

describe("pictorialBar", () => {
  it("repeats a symbol and falls back to strict ASCII", () => {
    const chart = pictorialBar({
      data: [
        { label: "Build", value: 8 },
        { label: "Test", value: 4 },
      ],
      symbol: "◆",
    });
    expect(text(layoutPictorialBar(chart, { width: 36 }))).toContain("◆◆");
    expect(
      text(layoutPictorialBar(chart, { width: 36, charset: "ascii" })),
    ).not.toContain("◆");
  });

  it("requires non-negative data and one-column symbols", () => {
    expect(() => pictorialBar({ data: [{ label: "A", value: -1 }] })).toThrow(
      "cannot be negative",
    );
    expect(() => pictorialBar({ data: [], symbol: "XX" })).toThrow(
      "one display column",
    );
  });
});

describe("choroplethMap", () => {
  const chart = choroplethMap({
    shape: [" AA ", "ABBB", " CC "],
    regions: [
      { id: "A", label: "North", value: 10 },
      { id: "B", label: "East", value: 50 },
      { id: "C", label: "South", value: 90 },
    ],
  });

  it("shades a deterministic raster shape with a density legend", () => {
    const grid = layoutChoroplethMap(chart, { width: 30 });
    expect(text(grid)).toMatch(/[░▒▓█]/u);
    expect(text(grid)).toContain("A");
    expect(text(grid)).toContain("B");
    expect(text(grid)).toContain("C");
    expect(text(grid)).toContain("North");
    expect(grid.height).toBeGreaterThan(chart.shape.length);
    expect(grid.table.rows).toHaveLength(3);
  });

  it("rejects ragged shapes and unknown region ids", () => {
    expect(() => choroplethMap({ shape: ["AA", "A"], regions: [] })).toThrow(
      "same display width",
    );
    expect(() => choroplethMap({ shape: ["Z"], regions: [] })).toThrow(
      "unknown region",
    );
  });
});

describe("countryMap", () => {
  it("renders a responsive atlas from built-in country silhouettes", () => {
    const grid = layoutCountryMap(
      countryMap({
        title: "Country activity",
        data: [
          { country: "spain", value: 72 },
          { country: "france", value: 54 },
          { country: "italy", value: 83 },
          { country: "japan", value: 61 },
        ],
      }),
      { width: 60 },
    );
    expect(text(grid)).toContain("Spain 72");
    expect(text(grid)).toContain("Japan 61");
    expect(text(grid)).toMatch(/[░▒▓█]/u);
    expect(grid.table.rows).toHaveLength(4);
    expect(countryMapNames).toHaveLength(8);
  });

  it("supports strict ASCII and freezes copied input", () => {
    const data = [{ country: "australia" as const, value: 40 }];
    const chart = countryMap({ data });
    data[0] = { country: "australia", value: 99 };
    const output = text(
      layoutCountryMap(chart, { width: 32, charset: "ascii" }),
    );
    expect(chart.data[0]?.value).toBe(40);
    expect(output).toMatch(/[.:*#@]/);
    expect(output).not.toMatch(/[░▒▓█]/u);
  });

  it("rejects unknown or duplicate countries", () => {
    expect(() =>
      countryMap({ data: [{ country: "mars" as "spain", value: 1 }] }),
    ).toThrow("must be one of");
    expect(() =>
      countryMap({
        data: [
          { country: "spain", value: 1 },
          { country: "spain", value: 2 },
        ],
      }),
    ).toThrow("only appear once");
  });
});

describe("routeMap", () => {
  it("renders multiple directed coordinate routes", () => {
    const grid = layoutRouteMap(
      routeMap({
        routes: [
          {
            from: { x: 0, y: 0, label: "Madrid" },
            to: { x: 8, y: 5, label: "Paris" },
            value: 12,
          },
          {
            from: { x: 0, y: 0, label: "Madrid" },
            to: { x: 9, y: -2, label: "Rome" },
            value: 7,
          },
        ],
      }),
      { width: 44, height: 14 },
    );
    expect(text(grid)).toMatch(/[▶▲▼]/u);
    expect(text(grid)).toContain("Paris");
    expect(grid.table.rows).toHaveLength(2);
  });

  it("validates points and route weights", () => {
    expect(() =>
      routeMap({
        routes: [{ from: { x: 0, y: 0 }, to: { x: Infinity, y: 1 } }],
      }),
    ).toThrow("finite number");
    expect(() =>
      routeMap({
        routes: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, value: -1 }],
      }),
    ).toThrow("cannot be negative");
  });

  it("routes every new chart through the generic layout API", () => {
    const charts = [
      gauge({ value: 50 }),
      themeRiver({ series: [{ label: "A", values: [1, 2] }] }),
      pictorialBar({ data: [{ label: "A", value: 1 }] }),
      choroplethMap({
        shape: ["A"],
        regions: [{ id: "A", label: "A", value: 1 }],
      }),
      routeMap({ routes: [] }),
    ];
    for (const chart of charts)
      expect(layout(chart, { width: 30, height: 12 }).width).toBe(30);
    expect(
      layout(countryMap({ data: [{ country: "spain", value: 1 }] }), {
        width: 30,
        height: 14,
      }).width,
    ).toBe(30);
  });
});
