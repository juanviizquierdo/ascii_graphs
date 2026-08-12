import { describe, expect, it } from "vitest";

import { distribution, layoutDistribution } from "./index.js";

describe("distribution visual semantics", () => {
  it("packs nearby beeswarm points onto separate rows", () => {
    const grid = layoutDistribution(
      distribution({ mode: "beeswarm", values: [1, 1.04, 1.08, 1.12, 2] }),
      { width: 32, height: 10, charset: "unicode" },
    );
    const seriesRows = grid.rows.filter((row) =>
      row.some(({ role }) => role === "series"),
    );
    expect(seriesRows.length).toBeGreaterThan(1);
  });

  it("draws a muted reference diagonal behind Q-Q points", () => {
    const grid = layoutDistribution(
      distribution({ mode: "qq", values: [1, 2, 3, 5, 8] }),
      { width: 36, height: 12, charset: "unicode" },
    );
    expect(
      grid.rows
        .flat()
        .some(({ glyph, role }) => glyph === "·" && role === "axis"),
    ).toBe(true);
  });
});
