import { describe, expect, it } from "vitest";
import { histogram, layoutHistogram } from "./index.js";

const text = (grid: ReturnType<typeof layoutHistogram>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("histogram", () => {
  it("copies and freezes values", () => {
    const values = [1, 2, 3];
    const chart = histogram({ values, bins: 2 });
    values[0] = 99;
    expect(chart.values).toEqual([1, 2, 3]);
    expect(Object.isFrozen(chart.values)).toBe(true);
  });

  it.each([
    [{ values: [Number.NaN] }, "values[0] must be a finite"],
    [{ values: [], bins: 0 }, "bins must be an integer"],
    [{ values: [], bins: 51 }, "bins must be an integer"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => histogram(input as never)).toThrow(message as string);
  });

  it("computes deterministic bin counts and accessible ranges", () => {
    const grid = layoutHistogram(
      histogram({ values: [0, 1, 2, 3, 4, 5], bins: 3 }),
      { width: 30, height: 8 },
    );
    expect(grid.table.rows.map(({ count }) => count)).toEqual([2, 2, 2]);
    expect(grid.description).toContain("6 values across 3 bins");
    expect(text(grid)).toContain("█");
  });

  it("renders strict ASCII and constant data", () => {
    const grid = layoutHistogram(histogram({ values: [4, 4, 4], bins: 5 }), {
      width: 24,
      height: 7,
      charset: "ascii",
    });
    expect(text(grid)).toContain("#");
    expect(grid.table.rows).toHaveLength(1);
  });

  it("renders an empty state", () => {
    const grid = layoutHistogram(histogram({ values: [] }), {
      width: 24,
      height: 7,
    });
    expect(text(grid)).toContain("No data");
    expect(grid.table.rows).toEqual([]);
  });
});
