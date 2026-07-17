import { describe, expect, it } from "vitest";

import { layout, layoutProgress, progress } from "./index.js";

function serialize(grid: ReturnType<typeof layoutProgress>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("progress", () => {
  it("normalizes defaults and freezes data", () => {
    const chart = progress({ data: [{ label: "Build", value: 72 }] });
    expect(chart.data).toEqual([
      { label: "Build", value: 72, min: 0, max: 100 },
    ]);
    expect(chart.showPercentage).toBe(true);
    expect(chart.clamp).toBe(true);
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it.each([
    [
      { data: [{ label: "Build", value: 1, min: 2, max: 2 }] },
      "min must be less than max",
    ],
    [
      { data: [{ label: "Build", value: 1, target: 101 }] },
      "target must be between min and max",
    ],
    [
      { data: [{ label: "Build", value: 120 }], clamp: false },
      "value must be between min and max",
    ],
    [
      { data: [{ label: "Build\nunsafe", value: 1 }] },
      "cannot contain control",
    ],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => progress(input as never)).toThrow(message as string);
  });
});

describe("layoutProgress", () => {
  it("renders multiple rows, targets, and overflow", () => {
    const grid = layout(
      progress({
        title: "Release",
        width: 40,
        data: [
          { label: "Build", value: 72, target: 80 },
          { label: "Deploy", value: 120 },
        ],
      }),
    );
    const output = serialize(grid);

    expect(output).toContain("Build  [███████████████████░│░░░░░] 72%");
    expect(output).toContain("Deploy [██████████████████████████] 120%");
    expect(grid.description).toContain("Build: 72 of 100 (72%)");
    expect(grid.table.rows[0]).toMatchObject({
      label: "Build",
      target: 80,
      percentage: 72,
    });
  });

  it("uses ASCII glyphs and respects custom ranges", () => {
    const grid = layoutProgress(
      progress({
        data: [{ label: "Budget", value: 15, min: 10, max: 20, target: 18 }],
      }),
      { width: 30, charset: "ascii" },
    );
    expect(serialize(grid)).toMatch(/Budget \[#+\.+\|\.*\] 50%/);
  });

  it("can hide percentages to fit compact output", () => {
    const grid = layoutProgress(
      progress({
        showPercentage: false,
        data: [{ label: "A very long label", value: 50 }],
      }),
      { width: 16 },
    );
    expect(grid.width).toBe(16);
    expect(serialize(grid)).not.toContain("50%");
  });

  it("renders an empty state", () => {
    const grid = layoutProgress(progress({ title: "Jobs", data: [] }), {
      width: 20,
    });
    expect(serialize(grid)).toContain("No data");
    expect(grid.description).toBe("Jobs. No data.");
  });
});
