import { describe, expect, it } from "vitest";

import {
  distribution,
  intervalChart,
  layoutDistribution,
  layoutInterval,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("intervalChart", () => {
  it("copies and freezes validated interval data", () => {
    const data = [{ label: "API", value: 42, low: 35, high: 51 }];
    const chart = intervalChart({ data });
    const firstDatum = data[0];
    if (firstDatum === undefined) throw new Error("test fixture is empty");
    firstDatum.value = 99;

    expect(chart.data[0]).toEqual({
      label: "API",
      value: 42,
      low: 35,
      high: 51,
    });
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it("rejects estimates outside their interval", () => {
    expect(() =>
      intervalChart({
        data: [{ label: "API", value: 10, low: 12, high: 20 }],
      }),
    ).toThrow("low <= value <= high");
  });

  it("renders ASCII and Unicode intervals with complete table metadata", () => {
    const chart = intervalChart({
      data: [{ label: "API", value: 42, low: 35, high: 51 }],
    });
    const ascii = layoutInterval(chart, { width: 36, charset: "ascii" });
    const unicode = layoutInterval(chart, { width: 36, charset: "unicode" });

    expect(text(ascii)).toContain("[");
    expect(text(ascii)).toContain("o");
    expect(text(unicode)).toContain("●");
    expect(ascii.table.rows[0]).toEqual({
      label: "API",
      value: 42,
      low: 35,
      high: 51,
    });
  });
});

describe("distribution", () => {
  it("copies and freezes values and rejects invalid input", () => {
    const values = [1, 2, 3];
    const chart = distribution({ mode: "density", values });
    values[0] = 99;
    expect(chart.values).toEqual([1, 2, 3]);
    expect(Object.isFrozen(chart.values)).toBe(true);
    expect(() =>
      distribution({ mode: "density", values: [Number.NaN] }),
    ).toThrow("finite number");
    expect(() =>
      distribution({ mode: "invalid" as "density", values: [1] }),
    ).toThrow("mode must be");
  });

  it.each(["density", "violin", "strip", "beeswarm", "ecdf", "qq"] as const)(
    "renders the %s mode inside its viewport",
    (mode) => {
      const grid = layoutDistribution(
        distribution({ mode, values: [1, 2, 2, 3, 5, 8, 13] }),
        { width: 40, height: 12, charset: "ascii" },
      );
      expect(grid.width).toBe(40);
      expect(grid.height).toBe(12);
      expect(grid.table.rows).toHaveLength(7);
      expect(text(grid)).not.toContain("undefined");
    },
  );

  it("spreads beeswarm collisions and exposes Q-Q theoretical quantiles", () => {
    const swarm = layoutDistribution(
      distribution({ mode: "beeswarm", values: [2, 2, 2, 2] }),
      { width: 32, height: 10 },
    );
    const occupiedRows = swarm.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.some(({ role }) => role === "series"));
    expect(occupiedRows.length).toBeGreaterThan(1);

    const qq = layoutDistribution(
      distribution({ mode: "qq", values: [1, 2, 4] }),
      { width: 32, height: 10 },
    );
    expect(qq.table.columns.at(-1)?.label).toBe("Theoretical quantile");
    expect(qq.table.rows[0]).toHaveProperty("theoretical");
  });

  it("renders an explicit empty state", () => {
    const grid = layoutDistribution(
      distribution({ mode: "density", values: [] }),
      { width: 32, height: 10 },
    );
    expect(text(grid)).toContain("No data");
  });
});
