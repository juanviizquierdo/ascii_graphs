import { describe, expect, it } from "vitest";

import { layout, layoutLine, line, measureText } from "./index.js";

function serialize(grid: ReturnType<typeof layoutLine>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("line", () => {
  it("validates, copies, and freezes its input", () => {
    const values = [1, null, 3];
    const chart = line({ label: "Requests", values });
    values[0] = 99;

    expect(chart.values).toEqual([1, null, 3]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.values)).toBe(true);
  });

  it.each([
    [{ values: [Number.NaN] }, "values[0] must be a finite number"],
    [{ values: [1], label: "bad\nlabel" }, "cannot contain control"],
    [{ values: [1], min: 3, max: 2 }, "min cannot be greater"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => line(input as never)).toThrow(message as string);
  });
});

describe("layoutLine", () => {
  it("draws connected Unicode points with labelled bounds", () => {
    const grid = layout(
      line({ title: "Traffic", values: [0, 5, 10], width: 24, height: 8 }),
    );
    const output = serialize(grid);

    expect(output).toContain("Traffic");
    expect(output).toContain("●");
    expect(output).toMatch(/[╭╮╰╯]/u);
    expect(output).toContain("10");
    expect(output).toContain("0");
    expect(grid.description).toBe("Traffic. 3 points; minimum 0; maximum 10.");
  });

  it("uses strict ASCII glyphs", () => {
    const output = serialize(
      layoutLine(line({ values: [0, 5, 10] }), {
        width: 24,
        height: 7,
        charset: "ascii",
      }),
    );

    expect(output).toContain("*");
    expect(output).toContain("+");
    expect(output).not.toMatch(/[●╱╲─│]/u);
  });

  it("breaks the line and renders a distinct missing marker", () => {
    const grid = layoutLine(line({ values: [0, null, 10] }), {
      width: 24,
      height: 7,
    });
    const seriesCells = grid.rows
      .flat()
      .filter(({ role }) => role === "series");
    const missingCells = grid.rows
      .flat()
      .filter(({ role }) => role === "missing");

    expect(seriesCells).toHaveLength(2);
    expect(missingCells.map(({ glyph }) => glyph)).toContain("·");
  });

  it("preserves first, last, and peak values when downsampling", () => {
    const values = Array.from({ length: 100 }, (_, index) =>
      index === 50 ? 1_000 : index,
    );
    const grid = layoutLine(line({ values }), { width: 18, height: 8 });
    const represented = grid.rows
      .flat()
      .map(({ datum }) => datum)
      .filter((datum): datum is { label: string; value: number } =>
        Boolean(datum),
      )
      .sort((left, right) => Number(left.label) - Number(right.label))
      .map(({ value }) => value);

    expect(represented[0]).toBe(0);
    expect(represented.at(-1)).toBe(99);
    expect(represented).toContain(1_000);
  });

  it("retains the complete source series in its accessible table", () => {
    const grid = layoutLine(line({ label: "Load", values: [3, null, 9] }));

    expect(grid.table.caption).toBe("Load");
    expect(grid.table.rows).toEqual([
      { index: 0, value: 3 },
      { index: 1, value: null },
      { index: 2, value: 9 },
    ]);
  });

  it("keeps Unicode labels within the requested viewport", () => {
    const grid = layoutLine(
      line({ title: "東京 traffic", values: [1, 3, 2] }),
      { width: 24, height: 8 },
    );

    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(24);
    }
  });

  it("rejects a viewport too short for the plot", () => {
    expect(() =>
      layoutLine(line({ title: "Traffic", values: [1, 2] }), {
        width: 24,
        height: 6,
      }),
    ).toThrow("too short");
  });
});
