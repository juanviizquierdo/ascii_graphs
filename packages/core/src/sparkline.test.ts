import { describe, expect, it } from "vitest";

import { layout, layoutSparkline, measureText, sparkline } from "./index.js";

function serialize(grid: ReturnType<typeof layoutSparkline>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("sparkline", () => {
  it("validates and freezes its input", () => {
    const input = [1, null, 3];
    const chart = sparkline({ label: "Trend", values: input });
    input[0] = 99;

    expect(chart.values).toEqual([1, null, 3]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.values)).toBe(true);
  });

  it.each([
    [{ values: [Number.NaN] }, "values[0] must be a finite number"],
    [{ values: [1], label: "bad\nlabel" }, "cannot contain control"],
    [{ values: [1], min: 3, max: 2 }, "min cannot be greater"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => sparkline(input as never)).toThrow(message as string);
  });
});

describe("layoutSparkline", () => {
  it("renders Unicode density and missing values", () => {
    const grid = layout(
      sparkline({
        title: "Latency",
        label: "api",
        width: 20,
        values: [1, 2, null, 4, 8],
      }),
    );

    expect(serialize(grid)).toMatchInlineSnapshot(`
      "Latency             
                          
      api ▁▂·▄█           "
    `);
    expect(grid.description).toBe(
      "Latency. 5 points; first 1; last 8; minimum 1; maximum 8.",
    );
  });

  it("renders constant values at a middle density", () => {
    const grid = layoutSparkline(sparkline({ values: [5, 5, 5], width: 12 }), {
      charset: "ascii",
    });
    expect(serialize(grid).trim()).toBe("===");
  });

  it("preserves first, last, and extrema when reducing wide datasets", () => {
    const values = Array.from({ length: 100 }, (_, index) =>
      index === 50 ? 1_000 : index,
    );
    const grid = layoutSparkline(sparkline({ values, width: 12 }));
    const represented = grid.rows[0]
      ?.map(({ datum }) => datum?.value)
      .filter((value): value is number => value !== undefined);

    expect(represented?.[0]).toBe(0);
    expect(represented?.at(-1)).toBe(99);
    expect(represented).toContain(1_000);
  });

  it("keeps every rendered row within the viewport width", () => {
    const grid = layoutSparkline(
      sparkline({ label: "東京 report", values: [1, 2, 3] }),
      { width: 24 },
    );
    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(24);
    }
  });

  it("rejects unknown chart types at runtime", () => {
    expect(() => layout({ type: "pie" } as never)).toThrow(
      "Unsupported chart type: pie",
    );
  });
});
