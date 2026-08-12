import { describe, expect, it } from "vitest";

import { cumulativeFlow, layout } from "./index.js";

describe("cumulative-flow visual continuity", () => {
  it("fills the space between time samples as continuous stacked bands", () => {
    const grid = layout(
      cumulativeFlow({
        labels: ["Mon", "Tue", "Wed", "Thu"],
        stages: [
          { label: "Todo", values: [12, 9, 5, 2] },
          { label: "Doing", values: [2, 4, 5, 3] },
          { label: "Done", values: [1, 4, 9, 15] },
        ],
      }),
      { width: 48, height: 16, charset: "unicode" },
    );
    const occupiedColumns = Array.from({ length: grid.width }, (_, x) =>
      grid.rows.some((row) => row[x]?.role === "series"),
    ).filter(Boolean).length;
    expect(occupiedColumns).toBeGreaterThan(35);
  });
});
