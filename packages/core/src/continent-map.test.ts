import { describe, expect, it } from "vitest";

import {
  continentMap,
  continentMapNames,
  getContinentCountries,
  layout,
  layoutContinentMap,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("continentMap", () => {
  const europe = continentMap({
    title: "European activity",
    continent: "europe",
    data: [
      { country: "ESP", value: 72 },
      { country: "FRA", value: 64 },
      { country: "DEU", value: 81 },
      { country: "ITA", value: 57 },
    ],
  });

  it("renders country-level values and texture-separated neighbors", () => {
    const grid = layoutContinentMap(europe, { width: 60 });
    const output = text(grid);
    expect(output).toContain("European activity");
    expect(output).toContain("ESP");
    expect(output).toMatch(/[░▒▓█]/u);
    expect(new Set(output.match(/[░▒▓█]/gu)).size).toBeGreaterThan(2);
    expect(grid.table.rows).toHaveLength(4);
  });

  it("downsamples responsively in strict ASCII", () => {
    const grid = layoutContinentMap(europe, {
      width: 32,
      charset: "ascii",
    });
    expect(grid.width).toBe(32);
    expect(new Set(text(grid).match(/[.:*#@]/g)).size).toBeGreaterThan(2);
    expect(text(grid)).not.toMatch(/[░▒▓█│─┼]/u);
  });

  it("publishes six presets and their supported country codes", () => {
    expect(continentMapNames).toEqual([
      "europe",
      "africa",
      "asia",
      "north-america",
      "south-america",
      "oceania",
    ]);
    expect(getContinentCountries("europe")).toContainEqual({
      code: "ESP",
      label: "Spain",
    });
    expect(getContinentCountries("africa").length).toBeGreaterThan(30);
  });

  it("renders every built-in continent preset", () => {
    for (const continent of continentMapNames) {
      const grid = layoutContinentMap(
        continentMap({ continent, data: [], showLegend: false }),
        { width: 60 },
      );
      expect(text(grid).trim()).not.toBe("");
      expect(grid.table.rows).toHaveLength(0);
    }
  });

  it("copies data and validates continent-country membership", () => {
    const data = [{ country: "ESP", value: 1 }];
    const chart = continentMap({ continent: "europe", data });
    data[0] = { country: "ESP", value: 99 };
    expect(chart.data[0]?.value).toBe(1);
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(() =>
      continentMap({
        continent: "europe",
        data: [{ country: "BRA", value: 1 }],
      }),
    ).toThrow("not available");
    expect(() =>
      continentMap({
        continent: "europe",
        data: [
          { country: "ESP", value: 1 },
          { country: "esp", value: 2 },
        ],
      }),
    ).toThrow("only appear once");
  });

  it("routes through the generic layout API", () => {
    expect(layout(europe, { width: 60 }).table.caption).toBe(
      "European activity",
    );
  });
});
