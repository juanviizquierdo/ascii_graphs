import { describe, expect, it } from "vitest";
import { area, layoutArea } from "./index.js";

const text = (grid: ReturnType<typeof layoutArea>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("area", () => {
  it("copies and freezes nullable values", () => {
    const values = [1, null, 3];
    const chart = area({ values });
    values[0] = 99;
    expect(chart.values).toEqual([1, null, 3]);
    expect(Object.isFrozen(chart.values)).toBe(true);
  });

  it.each([
    [{ values: [Infinity] }, "values[0] must be a finite"],
    [{ values: [1], min: 3, max: 2 }, "min cannot be greater"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => area(input as never)).toThrow(message as string);
  });

  it("fills beneath a Unicode series and keeps missing gaps", () => {
    const grid = layoutArea(area({ values: [1, 4, null, 2, 5] }), {
      width: 28,
      height: 8,
    });
    expect(text(grid)).toContain("░");
    expect(text(grid)).toContain("·");
    expect(grid.table.rows[2]).toEqual({ index: 2, value: null });
  });

  it("uses only strict ASCII plot glyphs in ASCII mode", () => {
    const output = text(
      layoutArea(area({ values: [1, 3, 2] }), {
        width: 24,
        height: 7,
        charset: "ascii",
      }),
    );
    expect(output).toContain("#");
    expect(output).toContain("*");
    expect(output).not.toMatch(/[░█·]/u);
  });

  it("preserves a wide peak through shared downsampling", () => {
    const values = Array.from({ length: 100 }, (_, index) =>
      index === 50 ? 1_000 : index,
    );
    const grid = layoutArea(area({ values }), { width: 20, height: 8 });
    expect(grid.rows.flat().map(({ datum }) => datum?.value)).toContain(1_000);
  });
});
