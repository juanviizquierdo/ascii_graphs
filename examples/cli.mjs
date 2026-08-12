#!/usr/bin/env node

import {
  adjacencyMatrix,
  area,
  arcDiagram,
  bar,
  barcode,
  boxPlot,
  bubble,
  bump,
  burn,
  bullet,
  candlestick,
  calendarHeatmap,
  calibration,
  chord,
  choroplethMap,
  countryMap,
  column,
  continentMap,
  connectedScatter,
  contour,
  controlChart,
  correlationMatrix,
  cumulativeFlow,
  dotDensityMap,
  donut,
  distribution,
  errorBudget,
  fan,
  funnel,
  flow,
  heatmap,
  hexbin,
  hierarchy,
  histogram,
  horizon,
  intervalChart,
  likert,
  gantt,
  gauge,
  groupedBar,
  hexTileMap,
  layout,
  line,
  lollipop,
  marketProfile,
  migrationFlow,
  multiLine,
  mosaic,
  network,
  orderBook,
  parallelCoordinates,
  pictorialBar,
  pointFigure,
  polarArea,
  rangeChart,
  progress,
  pareto,
  partition,
  radar,
  raincloud,
  ridgeline,
  routeMap,
  roc,
  scatter,
  sparkline,
  stackedBar,
  stackedArea,
  stepChart,
  spiralTimeline,
  statusGrid,
  survival,
  ternary,
  treemap,
  timeline,
  themeRiver,
  upset,
  waffle,
  waterfall,
  windRose,
  worldChoropleth,
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
} from "../packages/core/dist/index.js";
import {
  detectColorLevel,
  renderAnsi,
} from "../packages/renderer-ansi/dist/index.js";
import { renderText } from "../packages/renderer-text/dist/index.js";

const chartNames = [
  "bar",
  "column",
  "sparkline",
  "line",
  "scatter",
  "histogram",
  "area",
  "boxplot",
  "stacked",
  "donut",
  "grouped",
  "waterfall",
  "bullet",
  "candle",
  "gantt",
  "multiline",
  "stackedarea",
  "range",
  "dumbbell",
  "lollipop",
  "step",
  "interval",
  "density",
  "violin",
  "strip",
  "beeswarm",
  "ecdf",
  "qq",
  "likert",
  "pie",
  "treemap",
  "waffle",
  "funnel",
  "pyramid",
  "pareto",
  "calendar",
  "horizon",
  "timeline",
  "bubble",
  "connected",
  "correlation",
  "radar",
  "parallel",
  "sankey",
  "alluvial",
  "tree",
  "org",
  "dependency",
  "network",
  "flame",
  "sunburst",
  "progress",
  "heatmap",
  "status",
  "ridgeline",
  "hexbin",
  "control",
  "mosaic",
  "chord",
  "gauge",
  "themeriver",
  "pictorial",
  "choropleth",
  "countries",
  "continent",
  "routes",
  "bump",
  "fan",
  "raincloud",
  "upset",
  "pointfigure",
  "windrose",
  "polararea",
  "ternary",
  "contour",
  "adjacency",
  "arc",
  "survival",
  "roc",
  "calibration",
  "errorbudget",
  "cumulativeflow",
  "burn",
  "marketprofile",
  "orderbook",
  "barcode",
  "spiral",
  "world",
  "migration",
  "hextile",
  "dotdensity",
  "streamgraph",
  "hovmoller",
  "sankeytimeline",
  "slopegraph",
  "marimekkotimeline",
  "voronoi",
  "smallmultiples",
  "dendrogram",
  "heatdendrogram",
  "confusion",
  "lift",
  "forest",
  "blandaltman",
  "queuetimeline",
  "criticalpath",
  "spectrogram",
  "waveform",
  "footprint",
  "renko",
  "kagi",
  "cartogram",
  "transit",
];

function usage() {
  return `ASCII Graphs CLI gallery

Usage:
  pnpm example:cli -- [options]

Options:
  --chart <name>   bar, column, sparkline, line, scatter, histogram, area,
                   boxplot, stacked, donut, grouped, waterfall, bullet,
                   candle, gantt, multiline, stackedarea, range, dumbbell, lollipop,
                   step, interval, density, violin, strip, beeswarm, ecdf,
                   qq, likert, pie, treemap, waffle, funnel, pyramid, pareto,
                   calendar, horizon, timeline, bubble, connected, correlation,
                   radar, parallel, sankey, alluvial, tree, org, dependency,
                   network, flame, sunburst, progress, heatmap, status,
                   ridgeline, hexbin, control, mosaic, chord, gauge,
                   themeriver, pictorial, choropleth, countries, continent,
                   routes, bump, fan, raincloud, upset, pointfigure,
                   windrose, polararea, ternary, contour, adjacency, arc,
                   survival, roc, calibration, errorbudget, cumulativeflow,
                   burn, marketprofile, orderbook, barcode, spiral, world,
                   migration, hextile, dotdensity,
                   streamgraph, hovmoller, sankeytimeline, slopegraph,
                   marimekkotimeline, voronoi, smallmultiples,
                   dendrogram, heatdendrogram, confusion, lift, forest,
                   blandaltman, queuetimeline, criticalpath, spectrogram,
                   waveform, footprint, renko, kagi, cartogram, transit, or all
  --width <cols>   viewport width from 24 to 120 (default: 64)
  --ascii          use strict ASCII glyphs
  --unicode        use Unicode glyphs (default)
  --ansi           force true-color ANSI output
  --plain          disable ANSI color
  --help           show this message

Examples:
  pnpm example:cli
  pnpm example:cli -- --chart heatmap --ascii --width 48
  pnpm example:cli -- --chart progress --ansi
`;
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n\n${usage()}`);
  process.exitCode = 2;
}

function parseArguments(arguments_) {
  const options = {
    chart: "all",
    width: 64,
    charset: "unicode",
    colorLevel: detectColorLevel({
      isTTY: process.stdout.isTTY === true,
      env: process.env,
    }),
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--") continue;
    if (argument === "--help") return { ...options, help: true };
    if (argument === "--ascii") {
      options.charset = "ascii";
      continue;
    }
    if (argument === "--unicode") {
      options.charset = "unicode";
      continue;
    }
    if (argument === "--ansi") {
      options.colorLevel = 3;
      continue;
    }
    if (argument === "--plain") {
      options.colorLevel = 0;
      continue;
    }
    if (argument === "--chart") {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error("--chart requires a value.");
      options.chart = value;
      index += 1;
      continue;
    }
    if (argument === "--width") {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error("--width requires a value.");
      options.width = Number(value);
      index += 1;
      continue;
    }
    throw new Error(`unknown option ${argument}.`);
  }
  return options;
}

function createCharts() {
  const nextSeries = [
    { label: "Web", values: [12, 18, 15, 24, 29] },
    { label: "API", values: [8, 13, 19, 17, 22] },
  ];
  const nextMatrix = [
    [2, 4, 7, 9],
    [3, 8, 11, 7],
    [1, 5, 9, 12],
    [2, 3, 6, 8],
  ];
  const nextNetwork = {
    labels: ["Plan", "Build", "Test", "Review", "Ship"],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
    ],
  };
  return {
    bar: bar({
      title: "Monthly revenue",
      data: [
        { label: "Jan", value: 42 },
        { label: "Feb", value: 68 },
        { label: "Mar", value: 91 },
        { label: "Returns", value: -18 },
      ],
    }),
    column: column({
      title: "Quarterly change",
      data: [
        { label: "Q1", value: 34 },
        { label: "Q2", value: 52 },
        { label: "Q3", value: -18 },
        { label: "Q4", value: 41 },
      ],
    }),
    sparkline: sparkline({
      title: "API latency",
      label: "p95",
      values: [18, 22, 21, null, 19, 35, 27, 24, 31, 20],
    }),
    line: line({
      title: "Requests per minute",
      label: "RPM",
      values: [18, 24, 21, 35, 31, null, 38, 52, 44, 61, 57, 68],
    }),
    scatter: scatter({
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
    histogram: histogram({
      title: "Request duration distribution",
      bins: 6,
      values: [12, 14, 15, 16, 18, 18, 20, 21, 22, 24, 26, 31, 34, 42],
    }),
    area: area({
      title: "Daily active users",
      label: "DAU",
      values: [42, 48, 51, 49, 58, 64, null, 67, 73, 71, 79, 84],
    }),
    boxplot: boxPlot({
      title: "Latency by region",
      data: [
        { label: "EU", values: [18, 21, 22, 24, 31, 35, 42] },
        { label: "US", values: [24, 27, 29, 35, 39, 44, 51] },
        { label: "APAC", values: [31, 36, 41, 48, 55, 61, 72] },
      ],
    }),
    stacked: stackedBar({
      title: "Traffic mix",
      series: ["Web", "API", "Jobs"],
      rows: [
        { label: "Mon", values: [52, 31, 17] },
        { label: "Tue", values: [46, 38, 16] },
        { label: "Wed", values: [41, 43, 16] },
      ],
    }),
    donut: donut({
      title: "Runtime share",
      data: [
        { label: "Node", value: 46 },
        { label: "Python", value: 28 },
        { label: "Go", value: 17 },
        { label: "Other", value: 9 },
      ],
    }),
    grouped: groupedBar({
      title: "Quarterly channels",
      series: ["Web", "API"],
      rows: [
        { label: "Q1", values: [42, 31] },
        { label: "Q2", values: [51, 39] },
        { label: "Q3", values: [47, 46] },
      ],
    }),
    waterfall: waterfall({
      title: "Revenue bridge",
      initial: 120,
      data: [
        { label: "Sales", value: 48 },
        { label: "Refunds", value: -17 },
        { label: "Fees", value: -11 },
        { label: "Upsell", value: 26 },
      ],
    }),
    bullet: bullet({
      title: "Service objectives",
      data: [
        { label: "Uptime", value: 97, target: 99 },
        { label: "Coverage", value: 84, target: 90 },
        { label: "Quality", value: 76, target: 85 },
      ],
    }),
    candle: candlestick({
      title: "Weekly price",
      data: [
        { label: "M", open: 42, high: 51, low: 39, close: 48 },
        { label: "T", open: 48, high: 53, low: 44, close: 46 },
        { label: "W", open: 46, high: 56, low: 45, close: 54 },
        { label: "T", open: 54, high: 57, low: 49, close: 51 },
        { label: "F", open: 51, high: 62, low: 50, close: 59 },
      ],
    }),
    gantt: gantt({
      title: "Release timeline",
      tasks: [
        { label: "Design", start: 1, end: 4, progress: 100 },
        { label: "Build", start: 3, end: 8, progress: 70 },
        { label: "QA", start: 7, end: 10, progress: 25 },
        { label: "Launch", start: 10, end: 11, progress: 0 },
      ],
    }),
    multiline: multiLine({
      title: "Regional traffic",
      legend: { position: "top", color: "accent" },
      series: [
        { label: "EU", values: [18, 24, 21, 35, 31, 42] },
        { label: "US", values: [14, 19, 27, 25, 38, 45] },
        { label: "APAC", values: [22, 17, 31, 29, 42, 37] },
      ],
    }),
    stackedarea: stackedArea({
      title: "Usage composition",
      series: [
        { label: "Web", values: [18, 24, 29, 35, 41] },
        { label: "API", values: [12, 16, 21, 26, 31] },
      ],
    }),
    range: rangeChart({
      title: "Delivery windows",
      style: "bar",
      data: [
        { label: "Design", start: 1, end: 4 },
        { label: "Build", start: 3, end: 8 },
        { label: "Review", start: 7, end: 10 },
      ],
    }),
    dumbbell: rangeChart({
      title: "Before and after",
      style: "dumbbell",
      data: [
        { label: "Build", start: 62, end: 88 },
        { label: "Tests", start: 71, end: 94 },
        { label: "Deploy", start: 54, end: 79 },
      ],
    }),
    lollipop: lollipop({
      title: "Quarterly variance",
      data: [
        { label: "Q1", value: 12 },
        { label: "Q2", value: -5 },
        { label: "Q3", value: 19 },
      ],
    }),
    step: stepChart({
      title: "Plan changes",
      values: [12, 18, 18, 27, 21, 34],
    }),
    interval: intervalChart({
      title: "Latency estimates",
      data: [
        { label: "Edge", value: 22, low: 18, high: 29 },
        { label: "API", value: 42, low: 35, high: 51 },
        { label: "Batch", value: 67, low: 54, high: 81 },
      ],
    }),
    density: distribution({
      title: "Latency density",
      mode: "density",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    violin: distribution({
      title: "Latency violin",
      mode: "violin",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    strip: distribution({
      title: "Latency strip",
      mode: "strip",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    beeswarm: distribution({
      title: "Latency beeswarm",
      mode: "beeswarm",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    ecdf: distribution({
      title: "Latency ECDF",
      mode: "ecdf",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    qq: distribution({
      title: "Latency Q-Q",
      mode: "qq",
      values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
    }),
    likert: likert({
      title: "Developer survey",
      series: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"],
      rows: [
        { label: "Fast", values: [-12, -18, 45, 25] },
        { label: "Clear", values: [-8, -14, 48, 30] },
        { label: "Stable", values: [-15, -20, 41, 24] },
      ],
    }),
    pie: donut({
      title: "Runtime share",
      style: "pie",
      data: [
        { label: "Node", value: 46 },
        { label: "Python", value: 28 },
        { label: "Go", value: 17 },
        { label: "Other", value: 9 },
      ],
    }),
    treemap: treemap({
      title: "Bundle composition",
      data: [
        { label: "Core", value: 48 },
        { label: "HTML", value: 24 },
        { label: "ANSI", value: 18 },
        { label: "Email", value: 10 },
      ],
    }),
    waffle: waffle({
      title: "Issue status",
      data: [
        { label: "Closed", value: 68 },
        { label: "Active", value: 22 },
        { label: "Blocked", value: 10 },
      ],
    }),
    funnel: funnel({
      title: "Signup funnel",
      legend: { position: "left", color: "accent" },
      data: [
        { label: "Visit", value: 1000 },
        { label: "Trial", value: 540 },
        { label: "Active", value: 280 },
        { label: "Paid", value: 120 },
      ],
    }),
    pyramid: funnel({
      title: "Support pyramid",
      mode: "pyramid",
      legend: { position: "right", color: "positive" },
      data: [
        { label: "Self-serve", value: 700 },
        { label: "Community", value: 360 },
        { label: "Support", value: 140 },
        { label: "Engineering", value: 45 },
      ],
    }),
    pareto: pareto({
      title: "Incident causes",
      data: [
        { label: "Config", value: 42 },
        { label: "Deploy", value: 28 },
        { label: "Capacity", value: 17 },
        { label: "Other", value: 8 },
      ],
    }),
    calendar: calendarHeatmap({
      title: "Daily activity",
      data: [
        { date: "2026-07-13", value: 2 },
        { date: "2026-07-14", value: 5 },
        { date: "2026-07-15", value: null },
        { date: "2026-07-16", value: 8 },
        { date: "2026-07-17", value: 6 },
        { date: "2026-07-20", value: 10 },
        { date: "2026-07-21", value: 4 },
        { date: "2026-07-22", value: 7 },
      ],
    }),
    horizon: horizon({
      title: "Traffic deviation",
      label: "RPM delta",
      bands: 3,
      values: [-8, -5, -2, 1, 4, 9, 6, 2, -3, -7, 5, 10],
    }),
    timeline: timeline({
      title: "Release events",
      data: [
        { label: "Kickoff", start: 1 },
        { label: "Build", start: 2, end: 6 },
        { label: "Review", start: 5 },
        { label: "Rollout", start: 7, end: 10 },
      ],
    }),
    bubble: bubble({
      title: "Market map",
      data: [
        { label: "Alpha", x: 2, y: 7, size: 12 },
        { label: "Beta", x: 5, y: 4, size: 28 },
        { label: "Gamma", x: 8, y: 9, size: 46 },
      ],
    }),
    connected: connectedScatter({
      title: "Efficiency path",
      data: [
        { label: "Jan", x: 2, y: 3 },
        { label: "Feb", x: 4, y: 6 },
        { label: "Mar", x: 7, y: 5 },
        { label: "Apr", x: 9, y: 9 },
      ],
    }),
    correlation: correlationMatrix({
      title: "Metric correlations",
      labels: ["Speed", "Cost", "Quality"],
      values: [
        [1, -0.6, 0.7],
        [-0.6, 1, -0.3],
        [0.7, -0.3, 1],
      ],
    }),
    radar: radar({
      title: "Platform profile",
      axes: ["Speed", "Cost", "Quality", "Reach", "Safety"],
      values: [8, 5, 9, 7, 6],
      max: 10,
    }),
    parallel: parallelCoordinates({
      title: "Service comparison",
      axes: ["Cost", "Speed", "Quality", "Scale"],
      series: [
        { label: "Edge", values: [4, 9, 7, 8] },
        { label: "API", values: [6, 7, 9, 6] },
      ],
    }),
    sankey: flow({
      title: "Traffic flow",
      links: [
        { source: "Search", target: "Docs", value: 48 },
        { source: "Search", target: "Trial", value: 18 },
        { source: "Email", target: "Docs", value: 12 },
        { source: "Email", target: "Trial", value: 31 },
        { source: "Docs", target: "Paid", value: 22 },
        { source: "Trial", target: "Paid", value: 16 },
      ],
    }),
    alluvial: flow({
      title: "Cohort movement",
      mode: "alluvial",
      links: [
        { source: "Free", target: "Active", value: 58 },
        { source: "Free", target: "Churned", value: 20 },
        { source: "Active", target: "Paid", value: 34 },
        { source: "Active", target: "Churned", value: 12 },
        { source: "Paid", target: "Retained", value: 27 },
        { source: "Paid", target: "Churned", value: 7 },
      ],
    }),
    tree: hierarchy({
      title: "Application tree",
      root: {
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
      },
    }),
    org: hierarchy({
      title: "Team structure",
      mode: "org",
      root: {
        label: "CEO",
        children: [
          {
            label: "Product",
            children: [{ label: "Design" }, { label: "Research" }],
          },
          {
            label: "Engineering",
            children: [{ label: "Platform" }, { label: "Apps" }],
          },
        ],
      },
    }),
    dependency: hierarchy({
      title: "Package dependencies",
      mode: "dependency",
      root: {
        label: "app",
        children: [
          { label: "core", children: [{ label: "scales" }, { label: "grid" }] },
          { label: "renderer-html" },
        ],
      },
    }),
    network: network({
      title: "Service network",
      nodes: [{ id: "web" }, { id: "api" }, { id: "jobs" }, { id: "db" }],
      edges: [
        { source: "web", target: "api", value: 8 },
        { source: "api", target: "db", value: 6 },
        { source: "jobs", target: "db", value: 3 },
      ],
    }),
    flame: partition({
      title: "CPU flame graph",
      root: {
        label: "main",
        children: [
          {
            label: "render",
            children: [
              { label: "layout", value: 42 },
              { label: "paint", value: 18 },
            ],
          },
          { label: "parse", value: 25 },
        ],
      },
    }),
    sunburst: partition({
      title: "Repository sunburst",
      mode: "sunburst",
      root: {
        label: "repo",
        children: [
          {
            label: "core",
            children: [
              { label: "charts", value: 48 },
              { label: "grid", value: 20 },
            ],
          },
          { label: "renderers", value: 32 },
        ],
      },
    }),
    ridgeline: ridgeline({
      title: "Latency by region",
      series: [
        { label: "EU", values: [18, 20, 21, 22, 24, 28, 31, 35] },
        { label: "US", values: [24, 27, 29, 31, 35, 39, 44, 51] },
        { label: "APAC", values: [31, 36, 41, 44, 48, 55, 61, 72] },
      ],
    }),
    hexbin: hexbin({
      title: "Request clusters",
      bins: 12,
      data: [
        { x: 12, y: 18 },
        { x: 13, y: 18 },
        { x: 14, y: 19 },
        { x: 15, y: 20 },
        { x: 18, y: 24 },
        { x: 19, y: 25 },
        { x: 20, y: 24 },
        { x: 35, y: 42 },
        { x: 36, y: 43 },
        { x: 37, y: 41 },
        { x: 58, y: 68 },
      ],
    }),
    control: controlChart({
      title: "Deploy duration control",
      labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
      values: [18, 21, 19, 22, 20, 24, 21, 34],
      center: 21,
      lowerLimit: 14,
      upperLimit: 28,
    }),
    mosaic: mosaic({
      title: "Plan mix by channel",
      series: ["Free", "Team", "Enterprise"],
      rows: [
        { label: "Web", values: [58, 31, 11] },
        { label: "API", values: [20, 46, 34] },
        { label: "Partner", values: [8, 27, 65] },
      ],
    }),
    chord: chord({
      title: "Team handoffs",
      labels: ["Design", "Build", "Review", "Ship"],
      values: [
        [0, 12, 3, 0],
        [2, 0, 10, 4],
        [1, 3, 0, 9],
        [0, 2, 4, 0],
      ],
    }),
    gauge: gauge({
      title: "CPU saturation",
      label: "CPU",
      value: 73,
      min: 0,
      max: 100,
    }),
    themeriver: themeRiver({
      title: "Traffic themes",
      series: [
        { label: "Web", values: [12, 18, 25, 20, 14, 17] },
        { label: "API", values: [8, 14, 18, 24, 29, 25] },
        { label: "Jobs", values: [5, 7, 6, 9, 12, 16] },
      ],
    }),
    pictorial: pictorialBar({
      title: "Release work",
      symbol: "◆",
      data: [
        { label: "Features", value: 8 },
        { label: "Bugs", value: 5 },
        { label: "Docs", value: 3 },
      ],
    }),
    choropleth: choroplethMap({
      title: "Regional demand",
      shape: [
        "   NNNN    ",
        "  NNNNNEE  ",
        " WWWNNEEEE ",
        " WWWWEEEES ",
        "  WWWSSSSS ",
        "   WSSSSS  ",
        "    SSS    ",
      ],
      regions: [
        { id: "N", label: "North", value: 72 },
        { id: "W", label: "West", value: 41 },
        { id: "E", label: "East", value: 88 },
        { id: "S", label: "South", value: 57 },
      ],
    }),
    countries: countryMap({
      title: "Country activity",
      data: [
        { country: "spain", value: 72 },
        { country: "france", value: 54 },
        { country: "italy", value: 83 },
        { country: "japan", value: 61 },
      ],
    }),
    continent: continentMap({
      title: "European activity",
      continent: "europe",
      data: [
        { country: "ESP", value: 72 },
        { country: "FRA", value: 64 },
        { country: "DEU", value: 81 },
        { country: "ITA", value: 57 },
        { country: "GBR", value: 69 },
        { country: "POL", value: 48 },
      ],
    }),
    routes: routeMap({
      title: "European routes",
      routes: [
        {
          from: { x: 0, y: 0, label: "Madrid" },
          to: { x: 5, y: 6, label: "Paris" },
          value: 12,
        },
        {
          from: { x: 0, y: 0, label: "Madrid" },
          to: { x: 8, y: 1, label: "Rome" },
          value: 8,
        },
        {
          from: { x: 5, y: 6, label: "Paris" },
          to: { x: 9, y: 8, label: "Berlin" },
          value: 6,
        },
      ],
    }),
    bump: bump({
      title: "Search rankings",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { label: "Atlas", values: [82, 91, 88, 96] },
        { label: "Nova", values: [93, 87, 90, 89] },
        { label: "Pixel", values: [71, 78, 94, 92] },
      ],
    }),
    fan: fan({
      title: "Demand forecast",
      labels: ["Now", "+1", "+2", "+3"],
      lower: [48, 44, 39, 34],
      median: [50, 53, 57, 61],
      upper: [52, 62, 73, 84],
    }),
    raincloud: raincloud({
      title: "Latency samples",
      series: [
        { label: "Edge", values: [12, 14, 14, 16, 18, 21] },
        { label: "Origin", values: [22, 27, 29, 31, 35, 41] },
      ],
    }),
    upset: upset({
      title: "Feature adoption",
      sets: ["Web", "API", "CLI"],
      intersections: [
        { sets: ["Web"], value: 42 },
        { sets: ["API"], value: 31 },
        { sets: ["Web", "API"], value: 27 },
        { sets: ["Web", "API", "CLI"], value: 12 },
      ],
    }),
    pointfigure: pointFigure({
      title: "Price reversals",
      values: [42, 44, 47, 51, 48, 44, 40, 43, 46, 49],
      boxSize: 1,
    }),
    windrose: windRose({
      title: "Wind direction",
      data: [
        { label: "N", value: 18 },
        { label: "NE", value: 31 },
        { label: "E", value: 24 },
        { label: "SE", value: 12 },
        { label: "S", value: 8 },
        { label: "SW", value: 15 },
        { label: "W", value: 27 },
        { label: "NW", value: 22 },
      ],
    }),
    polararea: polarArea({
      title: "Channel reach",
      data: [
        { label: "Web", value: 82 },
        { label: "Email", value: 54 },
        { label: "CLI", value: 39 },
        { label: "Social", value: 68 },
      ],
    }),
    ternary: ternary({
      title: "Project trade-offs",
      labels: ["Speed", "Quality", "Cost"],
      data: [
        { label: "A", a: 55, b: 30, c: 15 },
        { label: "B", a: 25, b: 55, c: 20 },
        { label: "C", a: 30, b: 25, c: 45 },
      ],
    }),
    contour: contour({
      title: "Response surface",
      data: [
        { x: 0, y: 0, value: 2 },
        { x: 5, y: 0, value: 8 },
        { x: 10, y: 0, value: 3 },
        { x: 0, y: 5, value: 5 },
        { x: 5, y: 5, value: 12 },
        { x: 10, y: 5, value: 7 },
      ],
    }),
    adjacency: adjacencyMatrix({
      title: "Service calls",
      labels: ["Web", "API", "Auth", "DB"],
      values: [
        [0, 18, 4, 0],
        [2, 0, 12, 21],
        [0, 3, 0, 9],
        [0, 1, 0, 0],
      ],
    }),
    arc: arcDiagram({
      title: "Dependencies",
      labels: ["app", "ui", "api", "auth", "data"],
      edges: [
        { from: 0, to: 1, value: 8 },
        { from: 0, to: 2, value: 12 },
        { from: 2, to: 3, value: 6 },
        { from: 2, to: 4, value: 9 },
      ],
    }),
    survival: survival({
      title: "Subscriber retention",
      series: [
        {
          label: "Free",
          points: [
            { x: 0, probability: 1 },
            { x: 1, probability: 0.84 },
            { x: 3, probability: 0.61 },
            { x: 6, probability: 0.38 },
          ],
        },
        {
          label: "Pro",
          points: [
            { x: 0, probability: 1 },
            { x: 1, probability: 0.94 },
            { x: 3, probability: 0.86 },
            { x: 6, probability: 0.72 },
          ],
        },
      ],
    }),
    roc: roc({
      title: "Fraud model ROC",
      series: [
        {
          label: "v2",
          points: [
            { x: 0, probability: 0 },
            { x: 0.08, probability: 0.55 },
            { x: 0.18, probability: 0.78 },
            { x: 1, probability: 1 },
          ],
        },
      ],
    }),
    calibration: calibration({
      title: "Probability calibration",
      data: [
        { predicted: 0.1, observed: 0.08 },
        { predicted: 0.3, observed: 0.34 },
        { predicted: 0.5, observed: 0.47 },
        { predicted: 0.7, observed: 0.64 },
        { predicted: 0.9, observed: 0.82 },
      ],
    }),
    errorbudget: errorBudget({
      title: "API error budget",
      labels: ["W1", "W2", "W3", "W4", "W5"],
      remaining: [100, 94, 81, 76, 48],
    }),
    cumulativeflow: cumulativeFlow({
      title: "Sprint flow",
      labels: ["M", "T", "W", "T", "F"],
      stages: [
        { label: "Todo", values: [18, 15, 12, 8, 4] },
        { label: "Doing", values: [3, 5, 7, 6, 4] },
        { label: "Done", values: [0, 2, 5, 10, 16] },
      ],
    }),
    burn: burn({
      title: "Sprint burndown",
      labels: ["D1", "D2", "D3", "D4", "D5"],
      actual: [34, 31, 24, 20, 11],
    }),
    marketprofile: marketProfile({
      title: "Volume at price",
      data: [
        { price: 105, value: 4 },
        { price: 104, value: 9 },
        { price: 103, value: 16 },
        { price: 102, value: 23 },
        { price: 101, value: 18 },
      ],
    }),
    orderbook: orderBook({
      title: "BTC order book",
      bids: [
        { price: 99, value: 8 },
        { price: 98, value: 15 },
        { price: 97, value: 23 },
      ],
      asks: [
        { price: 100, value: 6 },
        { price: 101, value: 12 },
        { price: 102, value: 21 },
      ],
    }),
    barcode: barcode({
      title: "Deploy events",
      events: [
        { position: 1, label: "web", value: 2 },
        { position: 3, label: "api", value: 4 },
        { position: 3.4, label: "worker", value: 1 },
        { position: 7, label: "web", value: 3 },
      ],
    }),
    spiral: spiralTimeline({
      title: "Product history",
      events: [
        { position: 1, label: "Idea" },
        { position: 2, label: "Prototype" },
        { position: 3, label: "Beta" },
        { position: 4, label: "Launch" },
        { position: 5, label: "Global" },
      ],
    }),
    world: worldChoropleth({
      title: "Global activity",
      data: [
        { id: "NA", value: 78 },
        { id: "SA", value: 42 },
        { id: "EU", value: 91 },
        { id: "AF", value: 35 },
        { id: "AS", value: 84 },
        { id: "OC", value: 53 },
      ],
    }),
    migration: migrationFlow({
      title: "Talent migration",
      routes: [
        {
          from: { x: 0, y: 2, label: "Madrid" },
          to: { x: 5, y: 7, label: "Paris" },
          value: 12,
        },
        {
          from: { x: 5, y: 7, label: "Paris" },
          to: { x: 10, y: 5, label: "Berlin" },
          value: 8,
        },
      ],
    }),
    hextile: hexTileMap({
      title: "Iberian regions",
      data: [
        { x: 1, y: 0, label: "GA", value: 38 },
        { x: 2, y: 0, label: "AS", value: 44 },
        { x: 3, y: 0, label: "PV", value: 67 },
        { x: 0, y: 1, label: "PT", value: 51 },
        { x: 2, y: 1, label: "CL", value: 49 },
        { x: 3, y: 1, label: "MD", value: 92 },
      ],
    }),
    dotdensity: dotDensityMap({
      title: "Population density",
      shape: [
        "  AAAA  BBBB  ",
        " AAAAAABBBBBB ",
        "AAAAAAABBBBBBB",
        " AAAAA CBBBBB ",
        "  AAACCCBBB   ",
      ],
      regions: [
        { id: "A", label: "West", value: 140 },
        { id: "B", label: "East", value: 210 },
        { id: "C", label: "South", value: 90 },
      ],
      dotsPerUnit: 10,
    }),
    streamgraph: streamgraph({ title: "Traffic stream", series: nextSeries }),
    hovmoller: hovmoller({
      title: "Temperature propagation",
      matrix: nextMatrix,
    }),
    sankeytimeline: sankeyTimeline({
      title: "Release flow over time",
      ...nextNetwork,
    }),
    slopegraph: slopegraph({
      title: "Regional change",
      data: [
        { label: "Europe", start: 42, end: 71 },
        { label: "Americas", start: 68, end: 59 },
        { label: "Asia", start: 37, end: 82 },
      ],
    }),
    marimekkotimeline: marimekkoTimeline({
      title: "Revenue mix",
      series: nextSeries,
    }),
    voronoi: voronoiMap({
      title: "Service territories",
      data: [
        { label: "MAD", x: 1, y: 3 },
        { label: "PAR", x: 5, y: 8 },
        { label: "BER", x: 9, y: 7 },
        { label: "ROM", x: 8, y: 1 },
      ],
    }),
    smallmultiples: smallMultiples({
      title: "Service dashboard",
      series: nextSeries,
    }),
    dendrogram: clusteredDendrogram({
      title: "Customer clusters",
      ...nextNetwork,
    }),
    heatdendrogram: heatmapDendrogram({
      title: "Clustered features",
      labels: ["A", "B", "C", "D"],
      matrix: nextMatrix,
    }),
    confusion: confusionMatrix({
      title: "Classifier outcomes",
      labels: ["Cat", "Dog", "Bird", "Other"],
      matrix: [
        [81, 7, 3, 2],
        [6, 74, 8, 4],
        [2, 9, 68, 6],
        [3, 4, 5, 79],
      ],
    }),
    lift: liftGains({
      title: "Campaign lift",
      data: [
        { x: 0, y: 0 },
        { x: 20, y: 48 },
        { x: 40, y: 71 },
        { x: 60, y: 86 },
        { x: 100, y: 100 },
      ],
    }),
    forest: forestPlot({
      title: "Treatment effects",
      data: [
        { label: "Overall", x: 1.2, y: 1, low: 0.8, high: 1.6 },
        { label: "Adults", x: 1.5, y: 2, low: 1, high: 2.1 },
        { label: "Seniors", x: 0.9, y: 3, low: 0.4, high: 1.4 },
      ],
    }),
    blandaltman: blandAltman({
      title: "Method agreement",
      data: [
        { x: 10, y: -0.4 },
        { x: 18, y: 0.2 },
        { x: 25, y: -0.1 },
        { x: 33, y: 0.6 },
      ],
    }),
    queuetimeline: queueTimeline({ title: "Request queue", ...nextNetwork }),
    criticalpath: criticalPath({
      title: "Launch critical path",
      ...nextNetwork,
    }),
    spectrogram: spectrogram({ title: "Signal spectrum", matrix: nextMatrix }),
    waveform: waveform({
      title: "Audio waveform",
      values: [0, 2, 5, 3, -1, -4, -2, 1, 4, 2, -3, 0],
    }),
    footprint: footprintChart({
      title: "Order footprint",
      data: [
        { low: 42, high: 51, start: 44, end: 49, value: 12 },
        { low: 45, high: 54, start: 50, end: 47, value: 9 },
      ],
    }),
    renko: renko({
      title: "Renko trend",
      values: [42, 44, 47, 51, 48, 45, 49, 54],
    }),
    kagi: kagi({
      title: "Kagi trend",
      values: [42, 46, 51, 47, 43, 48, 55, 52],
    }),
    cartogram: cartogram({ title: "Population cartogram", matrix: nextMatrix }),
    transit: transitMap({ title: "Metro network", ...nextNetwork }),
    progress: progress({
      title: "Release status",
      data: [
        { label: "Build", value: 72, target: 80 },
        { label: "Tests", value: 94, target: 90 },
        { label: "Deploy", value: 40 },
      ],
    }),
    heatmap: heatmap({
      title: "Weekly activity",
      columns: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      rows: [
        { label: "API", values: [2, 5, 8, 10, 7] },
        { label: "Web", values: [1, null, 6, 4, 9] },
        { label: "Jobs", values: [0, 3, 4, 8, 5] },
      ],
    }),
    status: statusGrid({
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
  };
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return;
  }

  if (options.help === true) {
    process.stdout.write(usage());
    return;
  }
  if (
    !Number.isInteger(options.width) ||
    options.width < 24 ||
    options.width > 120
  ) {
    fail("--width must be an integer between 24 and 120.");
    return;
  }
  if (options.chart !== "all" && !chartNames.includes(options.chart)) {
    fail(`--chart must be all or one of: ${chartNames.join(", ")}.`);
    return;
  }

  const charts = createCharts();
  const selected = options.chart === "all" ? chartNames : [options.chart];
  const output = selected.map((name) => {
    const chart = charts[name];
    const grid = layout(chart, {
      width: options.width,
      charset: options.charset,
    });
    return options.colorLevel === 0
      ? renderText(grid)
      : renderAnsi(grid, { colorLevel: options.colorLevel });
  });
  process.stdout.write(
    `${output.join(`\n\n${" - ".repeat(options.width)}\n\n`)}\n`,
  );
}

main();
