import { describe, expect, it } from "vitest";

import { correlationMatrix, layoutCorrelationMatrix } from "./index.js";

const text = (grid: ReturnType<typeof layoutCorrelationMatrix>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("correlation matrix visual hierarchy", () => {
  it("prints readable coefficients and full-width density cells", () => {
    const grid = layoutCorrelationMatrix(
      correlationMatrix({
        labels: ["Speed", "Cost", "Quality"],
        values: [
          [1, -0.4, 0.7],
          [-0.4, 1, -0.2],
          [0.7, -0.2, 1],
        ],
      }),
      { width: 48, charset: "unicode" },
    );
    expect(text(grid)).toContain("+1.0");
    expect(text(grid)).toContain("-0.4");
    expect(
      grid.rows.flat().filter(({ glyph }) => glyph === "█").length,
    ).toBeGreaterThan(3);
  });
});
