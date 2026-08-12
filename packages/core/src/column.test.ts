import { describe, expect, it } from "vitest";

import { column, layout, layoutColumn, measureText } from "./index.js";

function serialize(grid: ReturnType<typeof layoutColumn>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("column", () => {
  it("validates, copies, and freezes categorical data", () => {
    const data = [{ label: "Jan", value: 10 }];
    const chart = column({ data });
    data[0] = { label: "Changed", value: 0 };

    expect(chart.data).toEqual([{ label: "Jan", value: 10 }]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it.each([
    [{ data: [{ label: "", value: 1 }] }, "non-empty string"],
    [{ data: [{ label: "Jan", value: Number.NaN }] }, "finite number"],
    [{ data: [{ label: "bad\nlabel", value: 1 }] }, "cannot contain control"],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => column(input as never)).toThrow(message as string);
  });
});

describe("layoutColumn", () => {
  const chart = column({
    title: "Net change",
    data: [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 5 },
      { label: "Mar", value: -5 },
    ],
  });

  it("renders positive and negative columns around one baseline", () => {
    const grid = layout(chart, { width: 32, height: 12 });
    const output = serialize(grid);

    expect(output).toContain("███████ ███████");
    expect(output).toContain("────────────────────────");
    expect(output).toContain("                ███████");
    expect(output).toContain("  Jan     Feb     Mar");
    expect(grid.description).toBe("Net change. Jan: 10; Feb: 5; Mar: -5.");
  });

  it("uses strict ASCII characters", () => {
    const output = serialize(
      layoutColumn(chart, { width: 32, height: 12, charset: "ascii" }),
    );
    expect(output).toContain("-------");
    expect(output).toContain("#######");
    expect(output).not.toContain("█");
  });

  it("renders an empty state", () => {
    const grid = layoutColumn(column({ title: "Empty", data: [] }), {
      width: 20,
      height: 8,
    });
    expect(serialize(grid)).toContain("No data");
  });

  it("rejects undersized height and width", () => {
    expect(() => layoutColumn(chart, { width: 32, height: 6 })).toThrow(
      "too short",
    );
    const many = Array.from({ length: 21 }, (_, index) => ({
      label: String(index),
      value: index,
    }));
    expect(() =>
      layoutColumn(column({ data: many }), { width: 20, height: 10 }),
    ).toThrow("too narrow for 21 columns");
  });

  it("preserves declared display width for every row", () => {
    const grid = layoutColumn(chart, { width: 32, height: 12 });
    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(32);
    }
  });
});
