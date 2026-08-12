import { describe, expect, it } from "vitest";
import { gantt, layoutGantt } from "./index.js";

const text = (grid: ReturnType<typeof layoutGantt>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("gantt", () => {
  it("normalizes progress and freezes tasks", () => {
    const chart = gantt({ tasks: [{ label: "Plan", start: 1, end: 3 }] });
    expect(chart.tasks[0]?.progress).toBe(0);
    expect(Object.isFrozen(chart.tasks[0])).toBe(true);
  });

  it.each([
    [{ tasks: [{ label: "A", start: 3, end: 2 }] }, "start cannot exceed end"],
    [
      { tasks: [{ label: "A", start: 1, end: 2, progress: 101 }] },
      "between 0 and 100",
    ],
  ])("rejects invalid tasks %#", (input, message) => {
    expect(() => gantt(input as never)).toThrow(message as string);
  });

  it("renders completed and remaining spans with an accessible table", () => {
    const grid = layoutGantt(
      gantt({ tasks: [{ label: "Build", start: 1, end: 5, progress: 50 }] }),
      { width: 32, charset: "ascii" },
    );
    expect(text(grid)).toContain("#");
    expect(text(grid)).toContain(".");
    expect(grid.table.rows[0]).toEqual({
      label: "Build",
      start: 1,
      end: 5,
      progress: 50,
    });
  });
});
