import { describe, expect, it } from "vitest";

import {
  bubble,
  connectedScatter,
  correlationMatrix,
  flow,
  layoutBubble,
  layoutConnectedScatter,
  layoutCorrelationMatrix,
  layoutFlow,
  layoutParallelCoordinates,
  layoutRadar,
  parallelCoordinates,
  radar,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("relationship charts", () => {
  it("renders bubble sizes with distinct ASCII marks", () => {
    const grid = layoutBubble(
      bubble({
        data: [
          { label: "Small", x: 1, y: 2, size: 1 },
          { label: "Large", x: 4, y: 5, size: 10 },
        ],
      }),
      { width: 40, height: 12, charset: "ascii" },
    );
    expect(text(grid)).toContain("o");
    expect(text(grid)).toContain("@");
    expect(grid.table.rows[1]).toMatchObject({ size: 10 });
  });

  it("connects scatter points in source order", () => {
    const grid = layoutConnectedScatter(
      connectedScatter({
        data: [
          { label: "A", x: 1, y: 1 },
          { label: "B", x: 4, y: 5 },
        ],
      }),
      { width: 40, height: 12, charset: "ascii" },
    );
    expect(text(grid)).toContain(".");
    expect(text(grid)).toContain("o");
  });

  it("validates and renders square correlation matrices", () => {
    const grid = layoutCorrelationMatrix(
      correlationMatrix({
        labels: ["Speed", "Quality"],
        values: [
          [1, -0.4],
          [-0.4, 1],
        ],
      }),
      { width: 40, charset: "ascii" },
    );
    expect(text(grid)).toContain("Speed");
    expect(grid.table.rows).toHaveLength(2);
    expect(() => correlationMatrix({ labels: ["A"], values: [[2]] })).toThrow(
      "between -1 and 1",
    );
  });

  it("draws a closed radar profile", () => {
    const grid = layoutRadar(
      radar({ axes: ["Speed", "Cost", "Quality"], values: [8, 5, 9], max: 10 }),
      { width: 42, height: 15, charset: "ascii" },
    );
    expect(text(grid)).toContain("*");
    expect(text(grid)).toContain("Speed");
    expect(text(grid)).toContain("Quality");
    expect(text(grid)).toContain("+");
    expect(
      grid.rows
        .flat()
        .filter(({ glyph, role }) => glyph === "o" && role === "series"),
    ).toHaveLength(3);
    expect(grid.table.rows).toHaveLength(3);
  });

  it("renders multiple parallel-coordinate series", () => {
    const grid = layoutParallelCoordinates(
      parallelCoordinates({
        axes: ["Cost", "Speed", "Quality"],
        series: [
          { label: "A", values: [3, 8, 6] },
          { label: "B", values: [7, 4, 9] },
        ],
      }),
      { width: 48, height: 12, charset: "ascii" },
    );
    expect(text(grid)).toContain("1");
    expect(text(grid)).toContain("2");
    expect(grid.table.rows).toHaveLength(2);
  });

  it.each(["sankey", "alluvial"] as const)(
    "renders %s weighted links",
    (mode) => {
      const grid = layoutFlow(
        flow({ mode, links: [{ source: "Visit", target: "Buy", value: 25 }] }),
        { width: 42, charset: "ascii" },
      );
      expect(text(grid)).toContain(">");
      expect(grid.table.rows[0]).toEqual({
        source: "Visit",
        target: "Buy",
        value: 25,
      });
    },
  );

  it("routes Sankey fan-out and fan-in between independently positioned nodes", () => {
    const grid = layoutFlow(
      flow({
        links: [
          { source: "Search", target: "Docs", value: 40 },
          { source: "Search", target: "Trial", value: 20 },
          { source: "Email", target: "Trial", value: 30 },
        ],
      }),
      { width: 48, height: 12, charset: "ascii" },
    );
    const output = text(grid);
    expect(output).toContain("+");
    expect(output.match(/Search/g)).toHaveLength(1);
    expect(output).toContain("Docs");
    expect(output).toContain("Trial");
    expect(grid.table.rows).toHaveLength(3);
  });

  it("rejects negative bubble sizes and flow weights", () => {
    expect(() =>
      bubble({ data: [{ label: "Bad", x: 1, y: 1, size: -1 }] }),
    ).toThrow("cannot be negative");
    expect(() =>
      flow({ links: [{ source: "A", target: "B", value: -1 }] }),
    ).toThrow("cannot be negative");
  });
});
