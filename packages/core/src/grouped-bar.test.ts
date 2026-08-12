import { describe, expect, it } from "vitest";
import { groupedBar, layoutGroupedBar } from "./index.js";

const text = (grid: ReturnType<typeof layoutGroupedBar>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("groupedBar", () => {
  it("freezes its rectangular matrix", () => {
    const values = [4, 6];
    const chart = groupedBar({
      series: ["A", "B"],
      rows: [{ label: "Q1", values }],
    });
    values[0] = 99;
    expect(chart.rows[0]?.values).toEqual([4, 6]);
    expect(Object.isFrozen(chart.rows[0]?.values)).toBe(true);
  });

  it("inherits stacked-matrix validation", () => {
    expect(() =>
      groupedBar({ series: ["A"], rows: [{ label: "Q1", values: [-1] }] }),
    ).toThrow("cannot be negative");
  });

  it("renders separate series bars and a complete table", () => {
    const grid = layoutGroupedBar(
      groupedBar({
        series: ["Web", "API"],
        rows: [{ label: "Q1", values: [4, 8] }],
      }),
      { width: 32, charset: "ascii" },
    );
    expect(text(grid)).toContain("Q1/Web");
    expect(text(grid)).toContain("Q1/API");
    expect(text(grid)).toContain("#");
    expect(text(grid)).toContain("=");
    expect(grid.table.rows[0]).toEqual({ row: "Q1", series_0: 4, series_1: 8 });
  });
});
