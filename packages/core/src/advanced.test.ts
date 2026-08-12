import { describe, expect, it } from "vitest";

import {
  chord,
  controlChart,
  hexbin,
  layout,
  layoutChord,
  layoutControl,
  layoutHexbin,
  layoutMosaic,
  layoutRidgeline,
  mosaic,
  ridgeline,
} from "./index.js";

const text = (grid: { rows: Array<Array<{ glyph: string }>> }) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("ridgeline", () => {
  it("copies and freezes series observations", () => {
    const values = [1, 2, 3];
    const chart = ridgeline({ series: [{ label: "A", values }] });
    values[0] = 99;
    expect(chart.series[0]?.values).toEqual([1, 2, 3]);
    expect(Object.isFrozen(chart.series)).toBe(true);
    expect(Object.isFrozen(chart.series[0]?.values)).toBe(true);
  });

  it("renders shared-scale density profiles in both character sets", () => {
    const chart = ridgeline({
      title: "Latency",
      series: [
        { label: "EU", values: [1, 2, 2, 3, 5] },
        { label: "US", values: [3, 4, 4, 6, 8] },
      ],
    });
    const ascii = layoutRidgeline(chart, { width: 42, charset: "ascii" });
    const unicode = layoutRidgeline(chart, {
      width: 42,
      charset: "unicode",
    });
    expect(text(ascii)).toContain("EU");
    expect(text(unicode)).toMatch(/[▁-█]/u);
    expect(unicode.table.rows).toHaveLength(10);
  });

  it("rejects unsafe or non-finite observations", () => {
    expect(() =>
      ridgeline({ series: [{ label: "bad\nlabel", values: [1] }] }),
    ).toThrow("control");
    expect(() =>
      ridgeline({ series: [{ label: "A", values: [Number.NaN] }] }),
    ).toThrow("finite number");
  });
});

describe("hexbin", () => {
  const points = [
    { label: "a", x: 1, y: 1 },
    { label: "b", x: 1.1, y: 1.1 },
    { label: "c", x: 8, y: 7 },
  ];

  it("aggregates points into visible density bins", () => {
    const grid = layoutHexbin(hexbin({ data: points, bins: 8 }), {
      width: 44,
      height: 13,
      charset: "ascii",
    });
    expect(text(grid)).toMatch(/[oO@]/);
    expect(grid.table.rows).toEqual(points);
  });

  it("validates bin count and finite coordinates", () => {
    expect(() => hexbin({ data: [], bins: 1 })).toThrow("between 2 and 80");
    expect(() => hexbin({ data: [{ x: Infinity, y: 1 }] })).toThrow(
      "finite number",
    );
  });
});

describe("controlChart", () => {
  it("derives three-sigma limits and preserves labels", () => {
    const chart = controlChart({
      values: [10, 11, 9, 10],
      labels: ["W1", "W2", "W3", "W4"],
    });
    expect(chart.center).toBe(10);
    expect(chart.upperLimit).toBeGreaterThan(chart.center);
    expect(chart.lowerLimit).toBeLessThan(chart.center);
    expect(chart.labels).toEqual(["W1", "W2", "W3", "W4"]);
  });

  it("marks out-of-control points and exposes their status", () => {
    const grid = layoutControl(
      controlChart({
        values: [10, 11, 18],
        center: 10,
        lowerLimit: 7,
        upperLimit: 13,
      }),
      { width: 44, height: 14, charset: "ascii" },
    );
    expect(text(grid)).toContain("X");
    expect(text(grid).match(/o/g)).toHaveLength(2);
    expect(grid.table.rows.at(-1)?.outside).toBe("yes");
  });

  it("rejects mismatched labels and inverted limits", () => {
    expect(() =>
      controlChart({ values: [1, 2], labels: ["only one"] }),
    ).toThrow("matching values length");
    expect(() =>
      controlChart({
        values: [1],
        center: 4,
        lowerLimit: 5,
        upperLimit: 6,
      }),
    ).toThrow("lowerLimit <= center <= upperLimit");
  });
});

describe("mosaic", () => {
  const chart = mosaic({
    title: "Plan mix",
    series: ["Free", "Paid"],
    rows: [
      { label: "Web", values: [60, 40] },
      { label: "API", values: [20, 80] },
    ],
  });

  it("renders proportional columns, segments, and a legend", () => {
    const grid = layoutMosaic(chart, {
      width: 44,
      height: 14,
      charset: "unicode",
    });
    expect(text(grid)).toContain("Web");
    expect(text(grid)).toContain("Free");
    expect(text(grid)).toMatch(/[█▓]/u);
    expect(grid.table.rows).toHaveLength(2);
  });

  it("requires non-negative rows matching the series", () => {
    expect(() =>
      mosaic({ series: ["A", "B"], rows: [{ label: "X", values: [1] }] }),
    ).toThrow("match series length");
    expect(() =>
      mosaic({ series: ["A"], rows: [{ label: "X", values: [-1] }] }),
    ).toThrow("cannot be negative");
  });
});

describe("chord", () => {
  const chart = chord({
    title: "Team handoffs",
    labels: ["Design", "Build", "Review"],
    values: [
      [0, 8, 2],
      [1, 0, 6],
      [3, 2, 0],
    ],
  });

  it("renders nodes and weighted center-crossing relationships", () => {
    const grid = layoutChord(chart, {
      width: 52,
      height: 18,
      charset: "unicode",
    });
    expect(text(grid)).toContain("Design");
    expect(text(grid)).toContain("●");
    expect(grid.table.rows).toHaveLength(6);
  });

  it("requires a non-negative square matrix", () => {
    expect(() => chord({ labels: ["A"], values: [[0]] })).toThrow(
      "at least two labels",
    );
    expect(() =>
      chord({
        labels: ["A", "B"],
        values: [[0, 1], [1]],
      }),
    ).toThrow("square matrix");
    expect(() =>
      chord({
        labels: ["A", "B"],
        values: [
          [0, -1],
          [1, 0],
        ],
      }),
    ).toThrow("cannot be negative");
  });

  it("routes every new type through the generic layout API", () => {
    const charts = [
      ridgeline({ series: [{ label: "A", values: [1, 2] }] }),
      hexbin({ data: [{ x: 1, y: 2 }] }),
      controlChart({ values: [1, 2, 1] }),
      mosaic({ series: ["A"], rows: [{ label: "X", values: [1] }] }),
      chart,
    ];
    for (const item of charts) {
      const grid = layout(item, { width: 48, height: 16 });
      expect(grid.width).toBe(48);
      expect(grid.description).not.toBe("");
    }
  });
});
