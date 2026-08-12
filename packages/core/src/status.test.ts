import { describe, expect, it } from "vitest";

import { layout, layoutStatus, statusGrid } from "./index.js";

function serialize(grid: ReturnType<typeof layoutStatus>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("statusGrid", () => {
  it("normalizes and freezes categorical matrices", () => {
    const values = ["success", "warning"] as const;
    const chart = statusGrid({
      columns: ["API", "Web"],
      rows: [{ label: "Prod", values }],
    });

    expect(chart.rows[0]?.values).toEqual(["success", "warning"]);
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.columns)).toBe(true);
    expect(Object.isFrozen(chart.rows[0]?.values)).toBe(true);
  });

  it.each([
    [
      {
        columns: ["API", "Web"],
        rows: [{ label: "Prod", values: ["success"] }],
      },
      "exactly 2 values",
    ],
    [
      {
        columns: ["API"],
        rows: [{ label: "Prod", values: ["offline"] }],
      },
      "must be success, warning, failure, or unknown",
    ],
    [{ columns: ["API", "API"], rows: [] }, "column labels must be unique"],
  ])("rejects invalid status matrices %#", (input, message) => {
    expect(() => statusGrid(input as never)).toThrow(message as string);
  });
});

describe("layoutStatus", () => {
  const chart = statusGrid({
    title: "Service health",
    columns: ["API", "Web", "Jobs"],
    rows: [
      { label: "Prod", values: ["success", "warning", "failure"] },
      { label: "Stage", values: ["success", "unknown", "success"] },
    ],
  });

  it("renders shape-distinct Unicode statuses and a legend", () => {
    const grid = layout(chart, { width: 40 });
    const output = serialize(grid);

    expect(output).toMatch(/Prod\s+✓\s+!\s+×/);
    expect(output).toMatch(/Stage\s+✓\s+\?\s+✓/);
    expect(output).toContain("✓ success  ! warning  × failure  ?");
    expect(grid.description).toBe(
      "Service health. 2 rows by 3 columns; 3 success, 1 warning, 1 failure, 1 unknown.",
    );
    expect(grid.table.rows[0]).toMatchObject({
      row: "Prod",
      column_0: "success",
      column_2: "failure",
    });
  });

  it("renders strict ASCII status glyphs", () => {
    const output = serialize(
      layoutStatus(chart, { width: 40, charset: "ascii" }),
    );
    expect(output).toMatch(/Prod\s+\+\s+!\s+x/);
    expect(output).not.toContain("✓");
  });

  it("renders an empty state", () => {
    const grid = layoutStatus(
      statusGrid({ title: "Empty", columns: [], rows: [] }),
      { width: 20 },
    );
    expect(serialize(grid)).toContain("No data");
  });
});
