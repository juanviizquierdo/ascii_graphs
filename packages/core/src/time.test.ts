import { describe, expect, it } from "vitest";

import {
  calendarHeatmap,
  horizon,
  layoutCalendarHeatmap,
  layoutHorizon,
  layoutTimeline,
  timeline,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("time charts", () => {
  it("renders dated calendar cells and retains missing values", () => {
    const grid = layoutCalendarHeatmap(
      calendarHeatmap({
        data: [
          { date: "2026-07-13", value: 2 },
          { date: "2026-07-14", value: null },
          { date: "2026-07-20", value: 8 },
        ],
      }),
      { width: 36, height: 10, charset: "ascii" },
    );
    expect(text(grid)).toContain("missing");
    expect(grid.table.rows[1]).toEqual({ date: "2026-07-14", value: null });
  });

  it("rejects malformed and duplicate calendar dates", () => {
    expect(() =>
      calendarHeatmap({ data: [{ date: "July 18", value: 1 }] }),
    ).toThrow("YYYY-MM-DD");
    expect(() =>
      calendarHeatmap({ data: [{ date: "2026-02-31", value: 1 }] }),
    ).toThrow("YYYY-MM-DD");
    expect(() =>
      calendarHeatmap({
        data: [
          { date: "2026-07-18", value: 1 },
          { date: "2026-07-18", value: 2 },
        ],
      }),
    ).toThrow("duplicate date");
  });

  it("folds positive and negative horizon bands around a baseline", () => {
    const chart = horizon({ values: [-8, -2, null, 3, 9], bands: 3 });
    const grid = layoutHorizon(chart, {
      width: 36,
      height: 9,
      charset: "ascii",
    });
    expect(text(grid)).toContain("-");
    expect(text(grid)).toContain("3");
    expect(grid.table.rows[2]).toEqual({ index: 2, value: null });
  });

  it("renders point events and ranges through one timeline", () => {
    const grid = layoutTimeline(
      timeline({
        data: [
          { label: "Kickoff", start: 1 },
          { label: "Build", start: 2, end: 6 },
        ],
      }),
      { width: 42, charset: "ascii" },
    );
    expect(text(grid)).toContain("o");
    expect(text(grid)).toContain("[");
    expect(grid.table.rows).toEqual([
      { label: "Kickoff", start: 1, end: 1, kind: "event" },
      { label: "Build", start: 2, end: 6, kind: "range" },
    ]);
  });

  it("copies inputs and validates invalid ranges", () => {
    const values = [1, null, 3];
    const chart = horizon({ values });
    values[0] = 99;
    expect(chart.values).toEqual([1, null, 3]);
    expect(() =>
      timeline({ data: [{ label: "Bad", start: 4, end: 2 }] }),
    ).toThrow("less than start");
  });
});
