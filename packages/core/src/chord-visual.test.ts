import { describe, expect, it } from "vitest";

import { chord, layoutChord } from "./index.js";

describe("chord visual structure", () => {
  it("draws a perimeter ring and bent interior relationships", () => {
    const grid = layoutChord(
      chord({
        labels: ["Design", "Build", "Review", "Ship"],
        values: [
          [0, 8, 2, 0],
          [1, 0, 6, 3],
          [2, 1, 0, 7],
          [4, 0, 2, 0],
        ],
      }),
      { width: 52, height: 18, charset: "unicode" },
    );
    expect(
      grid.rows
        .flat()
        .filter(({ glyph, role }) => glyph === "·" && role === "axis").length,
    ).toBeGreaterThan(12);
    expect(grid.rows.flat().some(({ role }) => role === "series")).toBe(true);
  });
});
