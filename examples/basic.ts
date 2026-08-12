import {
  area,
  bar,
  boxPlot,
  bubble,
  bullet,
  candlestick,
  calendarHeatmap,
  column,
  connectedScatter,
  correlationMatrix,
  donut,
  distribution,
  funnel,
  flow,
  heatmap,
  hierarchy,
  histogram,
  horizon,
  intervalChart,
  likert,
  gantt,
  groupedBar,
  layout,
  line,
  lollipop,
  multiLine,
  network,
  parallelCoordinates,
  rangeChart,
  progress,
  pareto,
  partition,
  radar,
  scatter,
  sparkline,
  stackedBar,
  stackedArea,
  stepChart,
  statusGrid,
  treemap,
  timeline,
  waffle,
  waterfall,
} from "@ascii-graphs/core";
import { renderAnsi } from "@ascii-graphs/renderer-ansi";
import { renderEmailParts } from "@ascii-graphs/renderer-email";
import { renderHtml } from "@ascii-graphs/renderer-html";
import { renderText } from "@ascii-graphs/renderer-text";

const chart = bar({
  title: "Monthly revenue",
  data: [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 68 },
    { label: "Mar", value: 91 },
  ],
});

const grid = layout(chart, { width: 42, charset: "unicode" });

console.log(renderText(grid));
console.log(renderHtml(grid, { accessibility: "both" }));

const trend = layout(
  sparkline({
    label: "Latency",
    values: [18, 22, null, 19, 35, 27],
  }),
);

console.log(renderAnsi(trend, { colorLevel: 3 }));

const traffic = layout(
  line({
    title: "Requests per minute",
    label: "RPM",
    values: [18, 24, 21, 35, 31, null, 38, 52, 44, 61, 57, 68],
  }),
  { width: 48, height: 12 },
);

console.log(renderText(traffic));

const relationship = layout(
  scatter({
    title: "Latency vs throughput",
    data: [
      { label: "edge-a", x: 120, y: 18 },
      { label: "edge-b", x: 180, y: 27 },
      { label: "api-a", x: 240, y: 42 },
      { label: "api-b", x: 310, y: 39 },
      { label: "batch", x: 390, y: 64 },
      { label: "peak", x: 470, y: 88 },
    ],
  }),
  { width: 48, height: 12 },
);

console.log(renderText(relationship));

const requestDistribution = layout(
  histogram({
    title: "Request duration distribution",
    bins: 6,
    values: [12, 14, 15, 16, 18, 18, 20, 21, 22, 24, 26, 31, 34, 42],
  }),
  { width: 48, height: 12 },
);
console.log(renderText(requestDistribution));

const activeUsers = layout(
  area({
    title: "Daily active users",
    values: [42, 48, 51, 49, 58, 64, null, 67, 73, 71, 79, 84],
  }),
  { width: 48, height: 12 },
);
console.log(renderText(activeUsers));

const latency = layout(
  boxPlot({
    title: "Latency by region",
    data: [
      { label: "EU", values: [18, 21, 22, 24, 31, 35, 42] },
      { label: "US", values: [24, 27, 29, 35, 39, 44, 51] },
    ],
  }),
  { width: 48 },
);
console.log(renderText(latency));

const mix = layout(
  stackedBar({
    title: "Traffic mix",
    series: ["Web", "API", "Jobs"],
    rows: [
      { label: "Mon", values: [52, 31, 17] },
      { label: "Tue", values: [46, 38, 16] },
    ],
  }),
  { width: 48 },
);
console.log(renderText(mix));

const runtime = layout(
  donut({
    title: "Runtime share",
    data: [
      { label: "Node", value: 46 },
      { label: "Python", value: 28 },
      { label: "Go", value: 17 },
      { label: "Other", value: 9 },
    ],
  }),
  { width: 48, height: 14 },
);
console.log(renderText(runtime));

console.log(
  renderText(
    layout(
      groupedBar({
        title: "Quarterly channels",
        series: ["Web", "API"],
        rows: [
          { label: "Q1", values: [42, 31] },
          { label: "Q2", values: [51, 39] },
        ],
      }),
      { width: 48 },
    ),
  ),
);

for (const nextChart of [
  multiLine({
    series: [
      { label: "A", values: [1, 3, 2, 5] },
      { label: "B", values: [2, 1, 4, 3] },
    ],
  }),
  stackedArea({
    series: [
      { label: "A", values: [2, 3, 4] },
      { label: "B", values: [1, 2, 3] },
    ],
  }),
  rangeChart({
    style: "dumbbell",
    data: [{ label: "SLA", start: 72, end: 94 }],
  }),
  rangeChart({
    style: "bar",
    data: [{ label: "Build", start: 2, end: 6 }],
  }),
  lollipop({
    data: [
      { label: "Gain", value: 8 },
      { label: "Loss", value: -3 },
    ],
  }),
  stepChart({ values: [1, 4, 2, 5] }),
  intervalChart({
    data: [{ label: "API", value: 42, low: 35, high: 51 }],
  }),
  ...(["density", "violin", "strip", "beeswarm", "ecdf", "qq"] as const).map(
    (mode) => distribution({ mode, values: [1, 2, 2, 3, 5, 8, 13] }),
  ),
  likert({
    series: ["Disagree", "Agree"],
    rows: [{ label: "Fast", values: [-35, 65] }],
  }),
  donut({
    style: "pie",
    data: [
      { label: "A", value: 3 },
      { label: "B", value: 2 },
    ],
  }),
  treemap({
    data: [
      { label: "A", value: 3 },
      { label: "B", value: 2 },
    ],
  }),
  waffle({
    cells: 25,
    data: [
      { label: "A", value: 3 },
      { label: "B", value: 2 },
    ],
  }),
  funnel({
    data: [
      { label: "Visit", value: 100 },
      { label: "Buy", value: 25 },
    ],
  }),
  funnel({
    mode: "pyramid",
    data: [
      { label: "Base", value: 100 },
      { label: "Apex", value: 25 },
    ],
  }),
  pareto({
    data: [
      { label: "A", value: 30 },
      { label: "B", value: 20 },
    ],
  }),
  calendarHeatmap({ data: [{ date: "2026-07-18", value: 4 }] }),
  horizon({ values: [-3, -1, 2, 5] }),
  timeline({
    data: [
      { label: "Launch", start: 4 },
      { label: "Build", start: 1, end: 3 },
    ],
  }),
  bubble({ data: [{ label: "A", x: 1, y: 2, size: 3 }] }),
  connectedScatter({
    data: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ],
  }),
  correlationMatrix({
    labels: ["A", "B"],
    values: [
      [1, 0.5],
      [0.5, 1],
    ],
  }),
  radar({ axes: ["A", "B", "C"], values: [3, 4, 2], max: 5 }),
  parallelCoordinates({
    axes: ["A", "B"],
    series: [{ label: "One", values: [2, 4] }],
  }),
  flow({ links: [{ source: "A", target: "B", value: 3 }] }),
  flow({ mode: "alluvial", links: [{ source: "A", target: "B", value: 3 }] }),
  hierarchy({ root: { label: "App", children: [{ label: "Core" }] } }),
  hierarchy({
    mode: "org",
    root: { label: "CEO", children: [{ label: "CTO" }] },
  }),
  hierarchy({
    mode: "dependency",
    root: { label: "App", children: [{ label: "Core" }] },
  }),
  network({
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [{ source: "a", target: "b" }],
  }),
  partition({
    root: { label: "main", children: [{ label: "render", value: 4 }] },
  }),
  partition({
    mode: "sunburst",
    root: { label: "repo", children: [{ label: "core", value: 4 }] },
  }),
]) {
  console.log(renderText(layout(nextChart, { width: 48, height: 12 })));
}

console.log(
  renderText(
    layout(
      waterfall({
        title: "Revenue bridge",
        initial: 120,
        data: [
          { label: "Sales", value: 48 },
          { label: "Refunds", value: -17 },
          { label: "Upsell", value: 26 },
        ],
      }),
      { width: 48 },
    ),
  ),
);

console.log(
  renderText(
    layout(
      bullet({
        title: "Service objectives",
        data: [{ label: "Uptime", value: 97, target: 99 }],
      }),
      { width: 48 },
    ),
  ),
);

console.log(
  renderText(
    layout(
      candlestick({
        title: "Weekly price",
        data: [
          { label: "M", open: 42, high: 51, low: 39, close: 48 },
          { label: "T", open: 48, high: 53, low: 44, close: 46 },
        ],
      }),
      { width: 48, height: 12 },
    ),
  ),
);

console.log(
  renderText(
    layout(
      gantt({
        title: "Release timeline",
        tasks: [
          { label: "Design", start: 1, end: 4, progress: 100 },
          { label: "Build", start: 3, end: 8, progress: 70 },
        ],
      }),
      { width: 48 },
    ),
  ),
);

const release = layout(
  progress({
    title: "Release status",
    data: [
      { label: "Build", value: 72, target: 80 },
      { label: "Deploy", value: 40 },
    ],
  }),
  { width: 42 },
);

const email = renderEmailParts(release);
console.log(email.text);

const activity = layout(
  heatmap({
    title: "Activity",
    columns: ["Mon", "Tue", "Wed"],
    rows: [
      { label: "API", values: [0, 5, 10] },
      { label: "Web", values: [null, 5, 0] },
    ],
  }),
  { width: 36 },
);

console.log(renderText(activity));

const quarterly = layout(
  column({
    title: "Quarterly change",
    data: [
      { label: "Q1", value: 34 },
      { label: "Q2", value: 52 },
      { label: "Q3", value: -18 },
      { label: "Q4", value: 41 },
    ],
  }),
  { width: 42, height: 14 },
);

console.log(renderText(quarterly));

const health = layout(
  statusGrid({
    title: "Service health",
    columns: ["API", "Web", "Jobs", "DB"],
    rows: [
      {
        label: "Prod",
        values: ["success", "success", "warning", "success"],
      },
      {
        label: "Stage",
        values: ["success", "unknown", "failure", "warning"],
      },
    ],
  }),
  { width: 42 },
);

console.log(renderText(health));
