import { describe, expect, it } from "vitest";

import { cartogram, layout } from "./index.js";

describe("cartogram visual legibility", () => {
  it("uses solid area textures without line-like artifacts", () => {
    const grid = layout(
      cartogram({
        matrix: [
          [8, 4, 2],
          [3, 9, 5],
          [7, 2, 6],
        ],
      }),
      { width: 48, height: 18, charset: "unicode" },
    );
    const seriesGlyphs = new Set(
      grid.rows
        .flat()
        .filter(({ role }) => role === "series")
        .map(({ glyph }) => glyph),
    );
    expect(
      [...seriesGlyphs].every((glyph) => ["░", "▒", "▓", "█"].includes(glyph)),
    ).toBe(true);
    expect(seriesGlyphs.has("─")).toBe(false);
  });
});
