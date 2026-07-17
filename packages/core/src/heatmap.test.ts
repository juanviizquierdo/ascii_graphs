import { describe, expect, it } from "vitest";

import { heatmap, layout, layoutHeatmap, measureText } from "./index.js";

function serialize(grid: ReturnType<typeof layoutHeatmap>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("heatmap", () => {
  it("normalizes and deeply freezes matrix input", () => {
    const values = [1, null, 3];
    const chart = heatmap({
      columns: ["Mon", "Tue", "Wed"],
      rows: [{ label: "API", values }],
    });
    values[0] = 99;

    expect(chart.rows[0]?.values).toEqual([1, null, 3]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.columns)).toBe(true);
    expect(Object.isFrozen(chart.rows)).toBe(true);
    expect(Object.isFrozen(chart.rows[0]?.values)).toBe(true);
  });

  it.each([
    [
      {
        columns: ["Mon", "Tue"],
        rows: [{ label: "API", values: [1] }],
      },
      "exactly 2 values",
    ],
    [{ columns: ["Mon", "Mon"], rows: [] }, "column labels must be unique"],
    [{ columns: ["bad\ncolumn"], rows: [] }, "cannot contain control"],
    [
      {
        columns: ["Mon"],
        rows: [{ label: "API", values: [Number.NaN] }],
      },
      "must be a finite number",
    ],
    [{ columns: [], rows: [], min: 2, max: 1 }, "min cannot be greater"],
  ])("rejects invalid matrix input %#", (input, message) => {
    expect(() => heatmap(input as never)).toThrow(message as string);
  });
});

describe("layoutHeatmap", () => {
  const chart = heatmap({
    title: "Activity",
    columns: ["Mon", "Tue", "Wed"],
    rows: [
      { label: "API", values: [0, 5, 10] },
      { label: "Web", values: [null, 5, 0] },
    ],
  });

  it("renders Unicode density, missing values, and a legend", () => {
    const grid = layout(chart, { width: 36 });
    const output = serialize(grid);

    expect(output).toContain("API ▁▁▁▁▁ ▄▄▄▄▄ █████");
    expect(output).toContain("Web ·     ▄▄▄▄▄ ▁▁▁▁▁");
    expect(output).toContain("0 ▁▂▃▄▅▆▇█ 10  · missing");
    expect(grid.description).toBe(
      "Activity. 2 rows by 3 columns; minimum 0; maximum 10.",
    );
    expect(grid.table.columns.map(({ label }) => label)).toEqual([
      "Row",
      "Mon",
      "Tue",
      "Wed",
    ]);
    expect(grid.table.rows[1]).toMatchObject({
      row: "Web",
      column_0: null,
      column_1: 5,
    });
  });

  it("renders a constant domain at middle density in ASCII", () => {
    const grid = layoutHeatmap(
      heatmap({
        columns: ["A", "B"],
        rows: [{ label: "Only", values: [5, 5] }],
        showLegend: false,
      }),
      { width: 20, charset: "ascii" },
    );
    expect(serialize(grid)).toContain("Only ===== =====");
  });

  it("renders an empty state", () => {
    const grid = layoutHeatmap(
      heatmap({ title: "Empty", columns: [], rows: [] }),
      { width: 20 },
    );
    expect(serialize(grid)).toContain("No data");
    expect(grid.description).toContain("0 rows by 0 columns");
  });

  it("fails clearly when every column cannot receive a display cell", () => {
    const manyColumns = Array.from({ length: 20 }, (_, index) => `C${index}`);
    expect(() =>
      layoutHeatmap(
        heatmap({
          columns: manyColumns,
          rows: [{ label: "Row", values: manyColumns.map(() => 1) }],
        }),
        { width: 20 },
      ),
    ).toThrow("too narrow for 20 heatmap columns");
  });

  it("keeps every rendered row within the declared display width", () => {
    const grid = layoutHeatmap(chart, { width: 36 });
    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(36);
    }
  });
});
