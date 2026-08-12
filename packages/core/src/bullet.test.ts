import { describe, expect, it } from "vitest";
import { bullet, layoutBullet } from "./index.js";

const text = (grid: ReturnType<typeof layoutBullet>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("bullet", () => {
  it("normalizes defaults and freezes ranges", () => {
    const chart = bullet({ data: [{ label: "SLA", value: 82, target: 90 }] });
    expect(chart.data[0]).toMatchObject({
      min: 0,
      max: 100,
      value: 82,
      target: 90,
    });
    expect(Object.isFrozen(chart.data[0]?.ranges)).toBe(true);
  });

  it.each([
    [
      { data: [{ label: "A", value: 1, target: 2, min: 3, max: 3 }] },
      "less than max",
    ],
    [
      { data: [{ label: "A", value: 1, target: 2, ranges: [80, 60] }] },
      "must be increasing",
    ],
  ])("rejects invalid ranges %#", (input, message) => {
    expect(() => bullet(input as never)).toThrow(message as string);
  });

  it("renders qualitative bands, value, and target", () => {
    const grid = layoutBullet(
      bullet({ data: [{ label: "SLA", value: 82, target: 90 }] }),
      { width: 40, charset: "ascii" },
    );
    expect(text(grid)).toContain("#");
    expect(text(grid)).toContain("|");
    expect(grid.table.rows[0]).toEqual({
      label: "SLA",
      value: 82,
      target: 90,
      minimum: 0,
      maximum: 100,
    });
  });
});
