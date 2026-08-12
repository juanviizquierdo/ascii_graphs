import { describe, expect, it } from "vitest";
import { layoutWaterfall, waterfall } from "./index.js";

const text = (grid: ReturnType<typeof layoutWaterfall>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("waterfall", () => {
  it("copies data and validates finite changes", () => {
    const data = [{ label: "Sales", value: 10 }];
    const chart = waterfall({ data, initial: 5 });
    data[0] = { label: "Changed", value: 99 };
    expect(chart.data).toEqual([{ label: "Sales", value: 10 }]);
    expect(() =>
      waterfall({ data: [{ label: "A", value: Infinity }] }),
    ).toThrow("finite");
  });

  it("calculates running totals and renders gains and losses", () => {
    const grid = layoutWaterfall(
      waterfall({
        initial: 100,
        data: [
          { label: "Sales", value: 40 },
          { label: "Costs", value: -25 },
        ],
      }),
      { width: 40, charset: "ascii" },
    );
    expect(grid.table.rows).toEqual([
      { label: "Sales", change: 40, total: 140 },
      { label: "Costs", change: -25, total: 115 },
    ]);
    expect(grid.description).toContain("ends at 115");
    expect(text(grid)).toContain("Total");
    expect(text(grid)).toContain("#");
    expect(text(grid)).toContain(".");
  });

  it("supports an explicit no-total empty state", () => {
    const grid = layoutWaterfall(waterfall({ data: [], showTotal: false }), {
      width: 24,
    });
    expect(text(grid)).toContain("No data");
  });
});
