import { describe, expect, it } from "vitest";
import { layoutStackedBar, stackedBar } from "./index.js";

const text = (grid: ReturnType<typeof layoutStackedBar>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("stackedBar", () => {
  it("deeply freezes rows and series", () => {
    const values = [2, 3];
    const chart = stackedBar({
      series: ["Web", "API"],
      rows: [{ label: "Prod", values }],
    });
    values[0] = 99;
    expect(chart.rows[0]?.values).toEqual([2, 3]);
    expect(Object.isFrozen(chart.series)).toBe(true);
  });

  it.each([
    [
      { series: ["A"], rows: [{ label: "R", values: [1, 2] }] },
      "exactly 1 values",
    ],
    [
      { series: ["A"], rows: [{ label: "R", values: [-1] }] },
      "cannot be negative",
    ],
    [{ series: ["A", "A"], rows: [] }, "must be unique"],
  ])("rejects invalid matrices %#", (input, message) => {
    expect(() => stackedBar(input as never)).toThrow(message as string);
  });

  it("renders distinct Unicode segments and a legend", () => {
    const grid = layoutStackedBar(
      stackedBar({
        series: ["Web", "API", "Jobs"],
        rows: [{ label: "Prod", values: [4, 3, 2] }],
      }),
      { width: 36 },
    );
    expect(text(grid)).toContain("█");
    expect(text(grid)).toContain("▓");
    expect(text(grid)).toContain("Web");
    expect(grid.table.rows[0]).toEqual({
      row: "Prod",
      series_0: 4,
      series_1: 3,
      series_2: 2,
    });
  });

  it("renders ASCII and zero-value states", () => {
    const output = text(
      layoutStackedBar(
        stackedBar({ series: ["A"], rows: [{ label: "R", values: [0] }] }),
        { width: 24, charset: "ascii" },
      ),
    );
    expect(output).toContain("No value");
    expect(output).not.toMatch(/[█▓▒░]/u);
  });
});
