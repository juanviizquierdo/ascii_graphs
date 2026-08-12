import { describe, expect, it } from "vitest";

import { layout, smallMultiples } from "./index.js";

describe("small-multiples visual grouping", () => {
  it("frames each synchronized series as a distinct panel", () => {
    const grid = layout(
      smallMultiples({
        series: [
          { label: "Web", values: [2, 5, 3, 8] },
          { label: "API", values: [7, 4, 6, 2] },
          { label: "Jobs", values: [1, 3, 4, 6] },
        ],
      }),
      { width: 56, height: 18, charset: "unicode" },
    );
    expect(grid.rows.flat().filter(({ glyph }) => glyph === "┌")).toHaveLength(
      3,
    );
    expect(grid.rows.flat().filter(({ glyph }) => glyph === "┘")).toHaveLength(
      3,
    );
  });
});
