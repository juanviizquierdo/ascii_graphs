import { describe, expect, it } from "vitest";

import {
  hierarchy,
  layoutHierarchy,
  layoutNetwork,
  layoutPartition,
  network,
  partition,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

const root = {
  label: "App",
  children: [
    { label: "Web", value: 4 },
    {
      label: "API",
      children: [
        { label: "Auth", value: 2 },
        { label: "Data", value: 3 },
      ],
    },
  ],
};

describe("hierarchy and network charts", () => {
  it.each(["tree", "org", "dependency"] as const)(
    "renders %s hierarchy mode",
    (mode) => {
      const grid = layoutHierarchy(hierarchy({ root, mode }), {
        width: 42,
        charset: "ascii",
      });
      expect(text(grid)).toContain("App");
      expect(text(grid)).toContain("API");
      expect(grid.table.rows).toHaveLength(5);
    },
  );

  it("deep-copies hierarchy nodes and rejects cycles", () => {
    const mutable = { label: "Root", children: [{ label: "Child" }] };
    const chart = hierarchy({ root: mutable });
    const child = mutable.children[0];
    if (child === undefined) throw new Error("test fixture is empty");
    child.label = "Changed";
    expect(chart.root.children[0]?.label).toBe("Child");

    const cyclic: { label: string; children?: unknown[] } = { label: "Loop" };
    cyclic.children = [cyclic];
    expect(() => hierarchy({ root: cyclic as never })).toThrow("cycle");
  });

  it("validates and renders network edges", () => {
    const grid = layoutNetwork(
      network({
        nodes: [{ id: "web" }, { id: "api" }, { id: "db" }],
        edges: [
          { source: "web", target: "api" },
          { source: "api", target: "db", value: 2 },
        ],
      }),
      { width: 48, height: 14, charset: "ascii" },
    );
    expect(text(grid)).toContain("web");
    expect(grid.table.rows[0]).toEqual({
      source: "web",
      target: "api",
      value: 1,
    });
    expect(() =>
      network({ nodes: [{ id: "a" }], edges: [{ source: "a", target: "b" }] }),
    ).toThrow("existing nodes");
  });

  it.each(["flame", "sunburst"] as const)("renders %s partitions", (mode) => {
    const grid = layoutPartition(partition({ root, mode }), {
      width: 48,
      height: 14,
      charset: "ascii",
    });
    expect(grid.table.rows).toHaveLength(5);
    expect(grid.rows.flat().some(({ role }) => role === "series")).toBe(true);
  });
});
