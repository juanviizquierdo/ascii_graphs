import { describe, expect, it } from "vitest";

import { contour, layout } from "./index.js";

describe("contour visual interpolation", () => {
  it("smooths sampled values and marks their locations", () => {
    const grid = layout(
      contour({
        data: [
          { x: 0, y: 0, value: 1 },
          { x: 5, y: 0, value: 5 },
          { x: 10, y: 0, value: 1 },
          { x: 0, y: 5, value: 5 },
          { x: 5, y: 5, value: 10 },
          { x: 10, y: 5, value: 5 },
          { x: 0, y: 10, value: 1 },
          { x: 5, y: 10, value: 5 },
          { x: 10, y: 10, value: 1 },
        ],
      }),
      { width: 48, height: 16, charset: "unicode" },
    );
    expect(grid.rows.flat().filter(({ glyph }) => glyph === "○")).toHaveLength(
      9,
    );
    expect(
      new Set(
        grid.rows
          .flat()
          .filter(({ role }) => role === "series")
          .map(({ glyph }) => glyph),
      ).size,
    ).toBeGreaterThan(2);
  });
});
