import { describe, expect, it } from "vitest";

import {
  adjacencyMatrix,
  arcDiagram,
  barcode,
  bump,
  burn,
  calibration,
  contour,
  cumulativeFlow,
  dotDensityMap,
  errorBudget,
  fan,
  hexTileMap,
  layout,
  marketProfile,
  migrationFlow,
  orderBook,
  pointFigure,
  polarArea,
  raincloud,
  roc,
  spiralTimeline,
  survival,
  ternary,
  upset,
  windRose,
  worldChoropleth,
} from "./index.js";

const charts = [
  bump({
    labels: ["Q1", "Q2", "Q3"],
    series: [
      { label: "A", values: [3, 1, 2] },
      { label: "B", values: [1, 3, 4] },
    ],
  }),
  fan({
    labels: ["Now", "+1", "+2"],
    lower: [8, 6, 4],
    median: [10, 11, 12],
    upper: [12, 16, 20],
  }),
  raincloud({
    series: [
      { label: "EU", values: [1, 2, 2, 4] },
      { label: "US", values: [3, 4, 4, 6] },
    ],
  }),
  upset({
    sets: ["Web", "API", "CLI"],
    intersections: [
      { sets: ["Web"], value: 20 },
      { sets: ["Web", "API"], value: 12 },
    ],
  }),
  pointFigure({ values: [10, 12, 15, 13, 9, 11], boxSize: 1 }),
  windRose({
    data: [
      { label: "N", value: 12 },
      { label: "E", value: 8 },
      { label: "S", value: 5 },
      { label: "W", value: 10 },
    ],
  }),
  polarArea({
    data: [
      { label: "A", value: 12 },
      { label: "B", value: 8 },
      { label: "C", value: 5 },
    ],
  }),
  ternary({
    labels: ["Speed", "Quality", "Cost"],
    data: [
      { label: "A", a: 50, b: 30, c: 20 },
      { label: "B", a: 20, b: 40, c: 40 },
    ],
  }),
  contour({
    data: [
      { x: 0, y: 0, value: 2 },
      { x: 1, y: 0, value: 8 },
      { x: 0, y: 1, value: 5 },
      { x: 1, y: 1, value: 10 },
    ],
  }),
  adjacencyMatrix({
    labels: ["A", "B", "C"],
    values: [
      [0, 3, 1],
      [2, 0, 4],
      [1, 2, 0],
    ],
  }),
  arcDiagram({
    labels: ["A", "B", "C", "D"],
    edges: [
      { from: 0, to: 2, value: 4 },
      { from: 1, to: 3, value: 2 },
    ],
  }),
  survival({
    series: [
      {
        label: "Control",
        points: [
          { x: 0, probability: 1 },
          { x: 3, probability: 0.8 },
          { x: 8, probability: 0.4 },
        ],
      },
    ],
  }),
  roc({
    series: [
      {
        label: "Model",
        points: [
          { x: 0, probability: 0 },
          { x: 0.2, probability: 0.7 },
          { x: 1, probability: 1 },
        ],
      },
    ],
  }),
  calibration({
    data: [
      { predicted: 0.1, observed: 0.12 },
      { predicted: 0.5, observed: 0.46 },
      { predicted: 0.9, observed: 0.84 },
    ],
  }),
  errorBudget({ labels: ["W1", "W2", "W3"], remaining: [100, 72, 48] }),
  cumulativeFlow({
    labels: ["M", "T", "W"],
    stages: [
      { label: "Todo", values: [10, 8, 5] },
      { label: "Doing", values: [2, 3, 4] },
      { label: "Done", values: [0, 2, 6] },
    ],
  }),
  burn({ labels: ["D1", "D2", "D3"], actual: [20, 13, 7] }),
  marketProfile({
    data: [
      { price: 101, value: 8 },
      { price: 100, value: 14 },
      { price: 99, value: 6 },
    ],
  }),
  orderBook({
    bids: [
      { price: 99, value: 12 },
      { price: 98, value: 8 },
    ],
    asks: [
      { price: 100, value: 7 },
      { price: 101, value: 11 },
    ],
  }),
  barcode({
    events: [
      { position: 1, label: "A" },
      { position: 3, label: "B", value: 4 },
    ],
  }),
  spiralTimeline({
    events: [
      { position: 1, label: "Plan" },
      { position: 2, label: "Build" },
      { position: 3, label: "Ship" },
    ],
  }),
  worldChoropleth({
    data: [
      { id: "NA", value: 70 },
      { id: "EU", value: 88 },
      { id: "AS", value: 54 },
    ],
  }),
  migrationFlow({
    routes: [
      {
        from: { x: 0, y: 0, label: "A" },
        to: { x: 8, y: 5, label: "B" },
        value: 12,
      },
    ],
  }),
  hexTileMap({
    data: [
      { x: 0, y: 0, label: "CA", value: 50 },
      { x: 1, y: 1, label: "TX", value: 70 },
    ],
  }),
  dotDensityMap({
    shape: [" AAA BBB ", "AAAA BBBB", " AAA BBB "],
    regions: [
      { id: "A", label: "West", value: 30 },
      { id: "B", label: "East", value: 60 },
    ],
    dotsPerUnit: 10,
  }),
] as const;

describe("creative chart collection", () => {
  it("constructs and lays out all 25 chart types in both character sets", () => {
    expect(new Set(charts.map((chart) => chart.type)).size).toBe(25);
    for (const chart of charts) {
      expect(Object.isFrozen(chart)).toBe(true);
      for (const charset of ["ascii", "unicode"] as const) {
        const grid = layout(chart, { width: 64, height: 18, charset });
        expect(grid.width).toBe(64);
        expect(grid.height).toBe(18);
        expect(grid.table.rows.length).toBeGreaterThan(0);
        expect(grid.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects structurally invalid data", () => {
    expect(() =>
      fan({ labels: ["A"], lower: [2], median: [1], upper: [3] }),
    ).toThrow(/bounds/);
    expect(() =>
      adjacencyMatrix({ labels: ["A", "B"], values: [[0, 1]] }),
    ).toThrow(/square matrix/);
    expect(() => ternary({ data: [{ a: 0, b: 0, c: 0 }] })).toThrow(
      /positive sum/,
    );
    expect(() =>
      upset({ sets: ["A"], intersections: [{ sets: ["B"], value: 1 }] }),
    ).toThrow(/unknown set/);
  });
});
