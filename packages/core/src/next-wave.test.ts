import { describe, expect, it } from "vitest";

import {
  blandAltman,
  cartogram,
  clusteredDendrogram,
  confusionMatrix,
  criticalPath,
  footprintChart,
  forestPlot,
  heatmapDendrogram,
  hovmoller,
  kagi,
  layout,
  liftGains,
  marimekkoTimeline,
  queueTimeline,
  renko,
  sankeyTimeline,
  slopegraph,
  smallMultiples,
  spectrogram,
  streamgraph,
  transitMap,
  voronoiMap,
  waveform,
} from "./index.js";

const series = [
  { label: "A", values: [2, 5, 3, 7] },
  { label: "B", values: [4, 2, 6, 3] },
];
const matrix = [
  [2, 4, 8],
  [3, 9, 5],
  [7, 3, 1],
];
const points = [
  { label: "A", x: 0, y: 2 },
  { label: "B", x: 2, y: 6 },
  { label: "C", x: 4, y: 3 },
];
const network = {
  labels: ["A", "B", "C", "D"],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 1, to: 3 },
  ],
};

const charts = [
  streamgraph({ series }),
  hovmoller({ matrix }),
  sankeyTimeline(network),
  slopegraph({
    data: [
      { label: "A", start: 2, end: 8 },
      { label: "B", start: 7, end: 4 },
    ],
  }),
  marimekkoTimeline({ series }),
  voronoiMap({ data: points }),
  smallMultiples({ series }),
  clusteredDendrogram(network),
  heatmapDendrogram({ labels: ["A", "B", "C"], matrix }),
  confusionMatrix({ labels: ["Cat", "Dog", "Bird"], matrix }),
  liftGains({ data: points }),
  forestPlot({
    data: [
      { label: "A", x: 2, y: 1, low: 1, high: 3 },
      { label: "B", x: 4, y: 2, low: 2, high: 6 },
    ],
  }),
  blandAltman({ data: points }),
  queueTimeline(network),
  criticalPath(network),
  spectrogram({ matrix }),
  waveform({ values: [0, 2, -1, 3, -2, 0] }),
  footprintChart({
    data: [
      { low: 2, high: 8, start: 3, end: 7, value: 12 },
      { low: 4, high: 9, start: 8, end: 5, value: 8 },
    ],
  }),
  renko({ values: [2, 4, 7, 5, 8] }),
  kagi({ values: [2, 4, 7, 5, 8] }),
  cartogram({ matrix }),
  transitMap(network),
] as const;

describe("next-wave chart collection", () => {
  it("constructs and renders all 22 distinct chart types", () => {
    expect(new Set(charts.map((chart) => chart.type)).size).toBe(22);
    for (const chart of charts) {
      expect(Object.isFrozen(chart)).toBe(true);
      for (const charset of ["ascii", "unicode"] as const) {
        const grid = layout(chart, { width: 64, height: 18, charset });
        expect(grid.table.rows.length).toBeGreaterThan(0);
        expect(
          grid.rows.some((row) => row.some((cell) => cell.glyph.trim() !== "")),
        ).toBe(true);
      }
    }
  });

  it("keeps every advanced chart visually distinct", () => {
    const signatures = charts.map((chart) =>
      layout(chart, { width: 64, height: 18, charset: "ascii" })
        .rows.map((row) => row.map((cell) => cell.glyph).join(""))
        .slice(2)
        .join("\n"),
    );
    expect(new Set(signatures).size).toBe(charts.length);
  });

  it("rejects non-finite normalized values", () => {
    expect(() => waveform({ values: [1, Number.NaN] })).toThrow(
      /finite number/,
    );
  });
});
