import { describe, expect, it } from "vitest";

import { hexTileMap, layout } from "./index.js";

describe("hex-tile visual geometry", () => {
  it("renders each discrete region as an equal-area three-row hexagon", () => {
    const grid = layout(
      hexTileMap({
        data: [
          { x: 0, y: 0, label: "NW", value: 2 },
          { x: 1, y: 0, label: "NE", value: 5 },
          { x: 0, y: 1, label: "SW", value: 8 },
          { x: 1, y: 1, label: "SE", value: 4 },
        ],
      }),
      { width: 40, height: 12, charset: "unicode" },
    );
    expect(grid.rows.flat().filter(({ glyph }) => glyph === "╱")).toHaveLength(
      8,
    );
    expect(grid.rows.flat().filter(({ glyph }) => glyph === "╲")).toHaveLength(
      8,
    );
  });
});
