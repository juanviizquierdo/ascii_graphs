import { describe, expect, it } from "vitest";
import { donut, layoutDonut } from "./index.js";

const text = (grid: ReturnType<typeof layoutDonut>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("donut", () => {
  it("copies and freezes slices", () => {
    const data = [{ label: "Web", value: 4 }];
    const chart = donut({ data });
    data[0] = { label: "Changed", value: 99 };
    expect(chart.data).toEqual([{ label: "Web", value: 4 }]);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it.each([
    [{ data: [{ label: "A", value: -1 }] }, "cannot be negative"],
    [
      {
        data: Array.from({ length: 9 }, (_, index) => ({
          label: String(index),
          value: 1,
        })),
      },
      "at most 8 slices",
    ],
  ])("rejects invalid slices %#", (input, message) => {
    expect(() => donut(input as never)).toThrow(message as string);
  });

  it("renders a Unicode ring, percentages, and legend", () => {
    const grid = layoutDonut(
      donut({
        title: "Traffic",
        data: [
          { label: "Web", value: 60 },
          { label: "API", value: 40 },
        ],
      }),
      { width: 36, height: 14 },
    );
    expect(text(grid)).toContain("●");
    expect(text(grid)).toContain("◆");
    expect(text(grid)).toContain("100");
    expect(grid.table.rows).toEqual([
      { label: "Web", value: 60, percentage: 60 },
      { label: "API", value: 40, percentage: 40 },
    ]);
  });

  it("uses numeric ASCII slice markers", () => {
    const output = text(
      layoutDonut(
        donut({
          data: [
            { label: "A", value: 1 },
            { label: "B", value: 1 },
          ],
        }),
        { width: 30, height: 12, charset: "ascii" },
      ),
    );
    expect(output).toContain("1");
    expect(output).toContain("2");
    expect(output).not.toMatch(/[●◆]/u);
  });

  it("renders a zero-total empty state", () => {
    const grid = layoutDonut(donut({ data: [{ label: "A", value: 0 }] }), {
      width: 30,
      height: 12,
    });
    expect(text(grid)).toContain("No data");
    expect(grid.description).toContain("No positive data");
  });
});
