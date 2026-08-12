import { describe, expect, it } from "vitest";
import {
  layoutLollipop,
  layoutMultiLine,
  layoutRange,
  layoutStackedArea,
  layoutStep,
  lollipop,
  multiLine,
  rangeChart,
  stackedArea,
  stepChart,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("multiLine", () => {
  it("freezes rectangular nullable series", () => {
    const values = [1, null, 3];
    const chart = multiLine({ series: [{ label: "A", values }] });
    values[0] = 99;
    expect(chart.series[0]?.values).toEqual([1, null, 3]);
    expect(Object.isFrozen(chart.series[0]?.values)).toBe(true);
  });

  it("rejects mismatched series and supports distinct ASCII markers", () => {
    expect(() =>
      multiLine({
        series: [
          { label: "A", values: [1] },
          { label: "B", values: [1, 2] },
        ],
      }),
    ).toThrow("same number");
    const output = text(
      layoutMultiLine(
        multiLine({
          series: [
            { label: "A", values: [1, 3] },
            { label: "B", values: [3, 1] },
          ],
        }),
        { width: 28, height: 9, charset: "ascii" },
      ),
    );
    expect(output).toContain("1");
    expect(output).toContain("2");
  });

  it("supports top or bottom legends with semantic color", () => {
    const grid = layoutMultiLine(
      multiLine({
        title: "Traffic",
        series: [{ label: "EU", values: [1, 3, 2] }],
        legend: { position: "top", color: "accent" },
      }),
      { width: 32, height: 10 },
    );
    expect(text(grid).split("\n")[2]).toContain("EU");
    expect(
      grid.rows[2]?.find(({ glyph }) => glyph === "●")?.style?.foreground,
    ).toBe("accent");
    expect(() =>
      multiLine({
        series: [{ label: "A", values: [1] }],
        legend: { position: "left" },
      }),
    ).toThrow("top or bottom");
  });
});

describe("stackedArea", () => {
  it("rejects negative values and renders stacked bands", () => {
    expect(() =>
      stackedArea({ series: [{ label: "A", values: [-1] }] }),
    ).toThrow("cannot be negative");
    const grid = layoutStackedArea(
      stackedArea({
        series: [
          { label: "A", values: [2, 3] },
          { label: "B", values: [1, 2] },
        ],
      }),
      { width: 28, height: 9 },
    );
    expect(text(grid)).toContain("●");
    expect(text(grid)).toContain("◆");
    expect(grid.table.rows[0]).toEqual({ index: 0, series_0: 2, series_1: 1 });
  });
});

describe("rangeChart", () => {
  it("supports range bars and dumbbells with accessible endpoints", () => {
    const grid = layoutRange(
      rangeChart({
        style: "dumbbell",
        data: [{ label: "SLA", start: 72, end: 94 }],
      }),
      { width: 32, charset: "ascii" },
    );
    expect(text(grid)).toContain("o");
    expect(text(grid)).toContain("x");
    expect(grid.table.rows[0]).toEqual({ label: "SLA", start: 72, end: 94 });
    const bar = layoutRange(
      rangeChart({
        style: "bar",
        data: [{ label: "Build", start: 2, end: 6 }],
      }),
      { width: 32, charset: "ascii" },
    );
    expect(text(bar)).toContain("#");
  });
});

describe("lollipop", () => {
  it("renders mixed-sign stems and point markers", () => {
    const grid = layoutLollipop(
      lollipop({
        data: [
          { label: "Gain", value: 8 },
          { label: "Loss", value: -3 },
        ],
      }),
      { width: 32, charset: "ascii" },
    );
    expect(text(grid)).toContain("o");
    expect(grid.table.rows).toHaveLength(2);
  });
});

describe("stepChart", () => {
  it("uses horizontal and vertical step segments while retaining source data", () => {
    const grid = layoutStep(stepChart({ values: [1, 4, 2] }), {
      width: 28,
      height: 8,
      charset: "ascii",
    });
    expect(text(grid)).toContain("-");
    expect(text(grid)).toContain("|");
    expect(grid.table.rows).toEqual([
      { index: 0, value: 1 },
      { index: 1, value: 4 },
      { index: 2, value: 2 },
    ]);
  });
});
