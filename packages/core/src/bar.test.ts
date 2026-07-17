import { describe, expect, it } from "vitest";

import { bar, layoutBar, measureText } from "./index.js";

function serialize(grid: ReturnType<typeof layoutBar>): string {
  return grid.rows
    .map((row) => row.map(({ glyph }) => glyph).join(""))
    .join("\n");
}

describe("bar", () => {
  it("copies and normalizes caller input", () => {
    const data = [{ label: "Jan", value: 42 }];
    const chart = bar({ data });
    data[0] = { label: "Changed", value: 0 };

    expect(chart).toMatchObject({
      type: "bar",
      data: [{ label: "Jan", value: 42 }],
      showValues: true,
    });
    expect(Object.isFrozen(chart)).toBe(true);
    expect(Object.isFrozen(chart.data)).toBe(true);
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it.each([
    [{ data: [{ label: "", value: 1 }] }, "data[0].label"],
    [{ data: [{ label: "x", value: Number.NaN }] }, "finite number"],
    [{ data: [], width: 4 }, "between 12 and 500"],
    [
      { data: [{ label: "safe\u001b[31m", value: 1 }] },
      "cannot contain control",
    ],
  ])("rejects invalid input %#", (input, message) => {
    expect(() => bar(input as never)).toThrow(message as string);
  });
});

describe("layoutBar", () => {
  it("renders deterministic Unicode bars", () => {
    const grid = layoutBar(
      bar({
        title: "Monthly revenue",
        width: 40,
        data: [
          { label: "Jan", value: 42 },
          { label: "Feb", value: 68 },
          { label: "Mar", value: 91 },
        ],
      }),
    );

    expect(serialize(grid)).toMatchInlineSnapshot(`
      "Monthly revenue                         
                                              
      Jan │███████████████                  42
      Feb │████████████████████████         68
      Mar │████████████████████████████████ 91"
    `);
    expect(grid.description).toBe(
      "Monthly revenue. Jan: 42; Feb: 68; Mar: 91.",
    );
  });

  it("uses a shared zero baseline for mixed values", () => {
    const grid = layoutBar(
      bar({
        width: 42,
        data: [
          { label: "Loss", value: -10 },
          { label: "Break-even", value: 0 },
          { label: "Gain", value: 20 },
        ],
      }),
      { charset: "ascii" },
    );
    const output = serialize(grid);

    expect(output).toContain("#########|");
    expect(output).toMatch(/Break-even\s+\|/);
    expect(output).toContain("|################# 20");
  });

  it("renders an explicit empty state", () => {
    const grid = layoutBar(bar({ title: "Nothing yet", data: [] }), {
      width: 24,
    });
    expect(serialize(grid)).toBe(
      "Nothing yet             \n                        \nNo data                 ",
    );
    expect(grid.description).toBe("Nothing yet. No data.");
  });

  it("respects display columns for wide labels", () => {
    const grid = layoutBar(
      bar({ data: [{ label: "東京 📈 report", value: 3 }] }),
      { width: 30 },
    );
    for (const row of grid.rows) {
      expect(measureText(row.map(({ glyph }) => glyph).join(""))).toBe(30);
    }
  });

  it("rejects unknown character sets at runtime", () => {
    expect(() =>
      layoutBar(bar({ data: [] }), { charset: "emoji" as never }),
    ).toThrow('charset must be either "ascii" or "unicode"');
  });

  it("supports a custom accessible description and generic table metadata", () => {
    const grid = layoutBar(
      bar({
        description: "Revenue rose in March.",
        data: [{ label: "March", value: 91 }],
      }),
    );

    expect(grid.description).toBe("Revenue rose in March.");
    expect(grid.table.columns).toEqual([
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ]);
  });
});
