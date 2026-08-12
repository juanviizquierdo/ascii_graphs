import { describe, expect, it } from "vitest";

import {
  donut,
  funnel,
  layoutDonut,
  layoutFunnel,
  layoutLikert,
  layoutPareto,
  layoutTreemap,
  layoutWaffle,
  likert,
  pareto,
  treemap,
  waffle,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("composition charts", () => {
  it("renders diverging Likert rows and a series table", () => {
    const grid = layoutLikert(
      likert({
        series: ["Disagree", "Agree"],
        rows: [{ label: "Fast", values: [-35, 65] }],
      }),
      { width: 42, charset: "ascii" },
    );
    expect(text(grid)).toContain("|");
    expect(grid.table.rows[0]).toEqual({
      label: "Fast",
      series_0: -35,
      series_1: 65,
    });
  });

  it("supports both pie and donut geometry through one API", () => {
    const data = [
      { label: "A", value: 60 },
      { label: "B", value: 40 },
    ];
    const pie = layoutDonut(donut({ style: "pie", data }), {
      width: 36,
      height: 14,
      charset: "ascii",
    });
    const ring = layoutDonut(donut({ data }), {
      width: 36,
      height: 14,
      charset: "ascii",
    });
    expect(text(pie)).not.toContain("100");
    expect(text(ring)).toContain("100");
  });

  it("renders proportional treemap regions", () => {
    const grid = layoutTreemap(
      treemap({
        data: [
          { label: "Web", value: 70 },
          { label: "API", value: 30 },
        ],
      }),
      { width: 40, height: 8 },
    );
    expect(text(grid)).toContain("Web");
    expect(grid.table.rows).toHaveLength(2);
  });

  it("allocates the requested number of waffle cells", () => {
    const grid = layoutWaffle(
      waffle({
        cells: 25,
        data: [
          { label: "Done", value: 3 },
          { label: "Open", value: 1 },
        ],
      }),
      { width: 32, height: 10, charset: "ascii" },
    );
    const seriesCells = grid.rows
      .flat()
      .filter(({ role }) => role === "series");
    expect(seriesCells).toHaveLength(25);
  });

  it.each(["funnel", "pyramid"] as const)("renders %s mode", (mode) => {
    const grid = layoutFunnel(
      funnel({
        mode,
        data: [
          { label: "Visit", value: 100 },
          { label: "Buy", value: 25 },
        ],
      }),
      { width: 40, charset: "ascii" },
    );
    expect(text(grid)).toContain("Visit");
    expect(grid.table.rows).toHaveLength(2);
  });

  it("places funnel legends outside either side with semantic color", () => {
    const left = layoutFunnel(
      funnel({
        data: [{ label: "Visit", value: 100 }],
        legend: { position: "left", color: "accent" },
      }),
      { width: 40, charset: "ascii" },
    );
    const right = layoutFunnel(
      funnel({
        mode: "pyramid",
        data: [{ label: "Support", value: 40 }],
        legend: { position: "right", color: "positive" },
      }),
      { width: 40, charset: "ascii" },
    );
    expect(text(left).split("\n")[0]).toMatch(/^Visit 100/);
    expect(text(right).split("\n")[0]?.trimEnd()).toMatch(/Support 40$/);
    expect(
      left.rows
        .flat()
        .find(({ datum, role }) => datum?.label === "Visit" && role === "label")
        ?.style?.foreground,
    ).toBe("accent");
    expect(() =>
      funnel({
        data: [{ label: "A", value: 1 }],
        legend: { position: "top" },
      }),
    ).toThrow("inside, left, or right");
  });

  it("sorts Pareto categories and calculates cumulative percentage", () => {
    const grid = layoutPareto(
      pareto({
        data: [
          { label: "Small", value: 10 },
          { label: "Large", value: 30 },
          { label: "Medium", value: 20 },
        ],
      }),
      { width: 42, height: 12 },
    );
    expect(grid.table.rows[0]).toMatchObject({ label: "Large", value: 30 });
    expect(grid.table.rows.at(-1)).toMatchObject({ cumulative: 100 });
  });

  it("rejects negative composition values and invalid row shapes", () => {
    expect(() => treemap({ data: [{ label: "Bad", value: -1 }] })).toThrow(
      "cannot be negative",
    );
    expect(() =>
      likert({ series: ["A", "B"], rows: [{ label: "Row", values: [1] }] }),
    ).toThrow("match series length");
  });
});
