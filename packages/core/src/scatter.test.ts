import { describe, expect, it } from "vitest";

import { layout, layoutScatter, measureText, scatter } from "./index.js";

function serialize(grid: ReturnType<typeof layoutScatter>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("scatter", () => {
  it("copies and deeply freezes point data", () => {
    const data = [{ label: "A", x: 1, y: 2 }];
    const chart = scatter({ data });
    const original = data[0];
    if (original === undefined) throw new Error("test fixture is missing");
    original.x = 99;

    expect(chart.data).toEqual([{ label: "A", x: 1, y: 2 }]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it.each([
    [{ data: [{ x: Number.NaN, y: 2 }] }, "data[0].x must be a finite"],
    [{ data: [{ x: 1, y: Infinity }] }, "data[0].y must be a finite"],
    [{ data: [{ x: 1, y: 2, label: "bad\nlabel" }] }, "cannot contain control"],
    [{ data: [], xMin: 3, xMax: 2 }, "xMin cannot be greater"],
    [{ data: [], yMin: 3, yMax: 2 }, "yMin cannot be greater"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => scatter(input as never)).toThrow(message as string);
  });
});

describe("layoutScatter", () => {
  it("renders Unicode points, axes, and an automatic range description", () => {
    const grid = layout(
      scatter({
        title: "Latency vs load",
        data: [
          { label: "A", x: 10, y: 20 },
          { label: "B", x: 30, y: 50 },
        ],
        width: 32,
        height: 10,
      }),
    );
    const output = serialize(grid);

    expect(output).toContain("Latency vs load");
    expect(output).toContain("●");
    expect(output).toContain("└");
    expect(output).toContain("─");
    expect(grid.description).toBe(
      "Latency vs load. 2 points; x range 10 to 30; y range 20 to 50.",
    );
  });

  it("uses strict ASCII glyphs", () => {
    const output = serialize(
      layoutScatter(scatter({ data: [{ x: 1, y: 2 }] }), {
        width: 24,
        height: 7,
        charset: "ascii",
      }),
    );

    expect(output).toContain("*");
    expect(output).toContain("+");
    expect(output).not.toMatch(/[●◆└─│]/u);
  });

  it("marks collisions when points occupy the same rendered cell", () => {
    const grid = layoutScatter(
      scatter({
        data: [
          { label: "A", x: 1, y: 1 },
          { label: "B", x: 1, y: 1 },
        ],
      }),
      { width: 24, height: 7 },
    );

    expect(serialize(grid)).toContain("◆");
    expect(
      grid.rows.flat().find(({ glyph }) => glyph === "◆")?.style?.foreground,
    ).toBe("accent");
  });

  it("supports explicit domains and clamps out-of-range points", () => {
    const grid = layoutScatter(
      scatter({
        data: [{ x: 20, y: -5 }],
        xMin: 0,
        xMax: 10,
        yMin: 0,
        yMax: 10,
      }),
      { width: 24, height: 7 },
    );
    const point = grid.rows.flat().find(({ role }) => role === "series");

    expect(point?.datum).toEqual({ label: "0", value: -5 });
    expect(grid.description).toContain("x range 0 to 10; y range 0 to 10");
  });

  it("retains labels and coordinates in its accessible table", () => {
    const grid = layoutScatter(
      scatter({ data: [{ label: "cache", x: 12, y: 8 }] }),
    );

    expect(grid.table.columns.map(({ label }) => label)).toEqual([
      "Label",
      "X",
      "Y",
    ]);
    expect(grid.table.rows).toEqual([{ label: "cache", x: 12, y: 8 }]);
  });

  it("renders a deterministic empty state", () => {
    const grid = layoutScatter(scatter({ title: "Samples", data: [] }), {
      width: 24,
      height: 8,
    });

    expect(serialize(grid)).toContain("No data");
    expect(grid.description).toBe("Samples. No data.");
    expect(grid.table.rows).toEqual([]);
  });

  it("keeps Unicode titles within the requested viewport", () => {
    const grid = layoutScatter(
      scatter({ title: "東京 metrics", data: [{ x: 1, y: 2 }] }),
      { width: 24, height: 8 },
    );

    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(24);
    }
  });

  it("rejects a viewport too short for the plot", () => {
    expect(() =>
      layoutScatter(scatter({ title: "Samples", data: [] }), {
        width: 24,
        height: 6,
      }),
    ).toThrow("too short");
  });

  it("rejects a partial domain that conflicts with the data", () => {
    expect(() =>
      layoutScatter(scatter({ data: [{ x: 2, y: 3 }], xMin: 4 })),
    ).toThrow("resolved x minimum cannot exceed maximum");
  });
});
