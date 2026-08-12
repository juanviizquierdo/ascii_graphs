import { describe, expect, it } from "vitest";
import { boxPlot, layoutBoxPlot } from "./index.js";

const text = (grid: ReturnType<typeof layoutBoxPlot>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("boxPlot", () => {
  it("deeply freezes groups", () => {
    const values = [1, 2, 3];
    const chart = boxPlot({ data: [{ label: "A", values }] });
    values[0] = 99;
    expect(chart.data[0]?.values).toEqual([1, 2, 3]);
    expect(Object.isFrozen(chart.data[0]?.values)).toBe(true);
  });

  it.each([
    [{ data: [{ label: "A", values: [] }] }, "must be a non-empty array"],
    [{ data: [{ label: "A", values: [Number.NaN] }] }, "must be a finite"],
  ])("rejects invalid groups %#", (input, message) => {
    expect(() => boxPlot(input as never)).toThrow(message as string);
  });

  it("calculates quartiles and renders Unicode summaries", () => {
    const grid = layoutBoxPlot(
      boxPlot({ data: [{ label: "API", values: [1, 2, 3, 4, 5] }] }),
      { width: 32 },
    );
    expect(grid.table.rows[0]).toEqual({
      label: "API",
      count: 5,
      minimum: 1,
      q1: 2,
      median: 3,
      q3: 4,
      maximum: 5,
    });
    expect(text(grid)).toContain("═");
    expect(text(grid)).toContain("│");
  });

  it("renders strict ASCII and empty states", () => {
    const ascii = text(
      layoutBoxPlot(boxPlot({ data: [{ label: "A", values: [1, 2, 3] }] }), {
        width: 24,
        charset: "ascii",
      }),
    );
    expect(ascii).toContain("=");
    expect(ascii).not.toMatch(/[═├┤]/u);
    expect(text(layoutBoxPlot(boxPlot({ data: [] }), { width: 24 }))).toContain(
      "No data",
    );
  });
});
