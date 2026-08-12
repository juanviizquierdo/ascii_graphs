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
} from "@ascii-graphs/core";
import { renderHtml } from "@ascii-graphs/renderer-html";
import { renderText } from "@ascii-graphs/renderer-text";

const hierarchyRoot = {
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

const nextSeries = [
  { label: "Web", values: [12, 18, 15, 24, 29, 25] },
  { label: "API", values: [8, 13, 19, 17, 22, 31] },
  { label: "Jobs", values: [5, 7, 9, 14, 11, 16] },
];
const nextMatrix = [
  [2, 4, 7, 9, 5, 3],
  [3, 8, 11, 7, 4, 2],
  [1, 5, 9, 12, 8, 4],
  [2, 3, 6, 8, 10, 7],
];
const nextNetwork = {
  labels: ["Plan", "Build", "Test", "Review", "Ship", "Learn"],
  edges: [
    { from: 0, to: 1, value: 8 },
    { from: 1, to: 2, value: 7 },
    { from: 1, to: 3, value: 5 },
    { from: 2, to: 4, value: 6 },
    { from: 3, to: 4, value: 4 },
    { from: 4, to: 5, value: 3 },
  ],
};

const nextWaveFactories = [
  {
    name: "Streamgraph",
    description: "Centered flowing layers emphasize changing composition.",
    create: () => streamgraph({ title: "Traffic stream", series: nextSeries }),
  },
  {
    name: "Hovmöller diagram",
    description: "A spatial measurement evolves across time as a dense raster.",
    create: () =>
      hovmoller({ title: "Temperature propagation", matrix: nextMatrix }),
  },
  {
    name: "Sankey timeline",
    description: "Repeated stages show how flow develops through time.",
    create: () =>
      sankeyTimeline({ title: "Release flow over time", ...nextNetwork }),
  },
  {
    name: "Slopegraph",
    description:
      "Before-and-after values reveal direction and magnitude cleanly.",
    create: () =>
      slopegraph({
        title: "Regional change",
        data: [
          { label: "Europe", start: 42, end: 71 },
          { label: "Americas", start: 68, end: 59 },
          { label: "Asia", start: 37, end: 82 },
          { label: "Oceania", start: 51, end: 63 },
        ],
      }),
  },
  {
    name: "Marimekko timeline",
    description: "Time width and category height jointly encode composition.",
    create: () =>
      marimekkoTimeline({ title: "Revenue mix", series: nextSeries }),
  },
  {
    name: "Voronoi map",
    description: "Every cell belongs to its nearest labelled seed.",
    create: () =>
      voronoiMap({
        title: "Service territories",
        data: [
          { label: "MAD", x: 1, y: 3 },
          { label: "PAR", x: 5, y: 8 },
          { label: "BER", x: 9, y: 7 },
          { label: "ROM", x: 8, y: 1 },
        ],
      }),
  },
  {
    name: "Small multiples",
    description: "Synchronized miniature charts make many trends comparable.",
    create: () =>
      smallMultiples({ title: "Service dashboard", series: nextSeries }),
  },
  {
    name: "Clustered dendrogram",
    description:
      "Hierarchical similarity is expressed through branching clusters.",
    create: () =>
      clusteredDendrogram({ title: "Customer clusters", ...nextNetwork }),
  },
  {
    name: "Heatmap dendrogram",
    description:
      "A clustered matrix combines intensity with hierarchical order.",
    create: () =>
      heatmapDendrogram({
        title: "Clustered features",
        labels: ["A", "B", "C", "D"],
        matrix: nextMatrix,
      }),
  },
  {
    name: "Confusion matrix",
    description:
      "Prediction outcomes include readable diagonal and error cells.",
    create: () =>
      confusionMatrix({
        title: "Classifier outcomes",
        labels: ["Cat", "Dog", "Bird", "Other"],
        matrix: [
          [81, 7, 3, 2],
          [6, 74, 8, 4],
          [2, 9, 68, 6],
          [3, 4, 5, 79],
        ],
      }),
  },
  {
    name: "Lift and gains",
    description: "Model targeting performance is compared with a baseline.",
    create: () =>
      liftGains({
        title: "Campaign lift",
        data: [
          { x: 0, y: 0 },
          { x: 20, y: 48 },
          { x: 40, y: 71 },
          { x: 60, y: 86 },
          { x: 80, y: 95 },
          { x: 100, y: 100 },
        ],
      }),
  },
  {
    name: "Forest plot",
    description: "Point estimates and confidence intervals compare subgroups.",
    create: () =>
      forestPlot({
        title: "Treatment effects",
        data: [
          { label: "Overall", x: 1.2, y: 1, low: 0.8, high: 1.6 },
          { label: "Adults", x: 1.5, y: 2, low: 1.0, high: 2.1 },
          { label: "Seniors", x: 0.9, y: 3, low: 0.4, high: 1.4 },
          { label: "Remote", x: 1.8, y: 4, low: 1.1, high: 2.5 },
        ],
      }),
  },
  {
    name: "Bland–Altman plot",
    description: "Measurement differences are inspected against their means.",
    create: () =>
      blandAltman({
        title: "Method agreement",
        data: [
          { x: 10, y: -0.4 },
          { x: 18, y: 0.2 },
          { x: 25, y: -0.1 },
          { x: 33, y: 0.6 },
          { x: 41, y: -0.3 },
          { x: 52, y: 0.1 },
        ],
      }),
  },
  {
    name: "Queue timeline",
    description: "Waiting and processing stages form an operational journey.",
    create: () => queueTimeline({ title: "Request queue", ...nextNetwork }),
  },
  {
    name: "Critical-path network",
    description: "Dependent project stages expose the delivery-critical route.",
    create: () =>
      criticalPath({ title: "Launch critical path", ...nextNetwork }),
  },
  {
    name: "Spectrogram",
    description: "Signal frequency intensity changes across time.",
    create: () => spectrogram({ title: "Signal spectrum", matrix: nextMatrix }),
  },
  {
    name: "Waveform",
    description: "Positive and negative signal amplitude share a zero axis.",
    create: () =>
      waveform({
        title: "Audio waveform",
        values: [0, 2, 5, 3, -1, -4, -2, 1, 4, 2, -3, 0],
      }),
  },
  {
    name: "Footprint chart",
    description: "Bid and ask activity appears inside each price period.",
    create: () =>
      footprintChart({
        title: "Order footprint",
        data: [
          { low: 42, high: 51, start: 44, end: 49, value: 12 },
          { low: 45, high: 54, start: 50, end: 47, value: 9 },
          { low: 46, high: 58, start: 48, end: 56, value: 18 },
        ],
      }),
  },
  {
    name: "Renko chart",
    description:
      "Fixed-size movement bricks suppress insignificant time noise.",
    create: () =>
      renko({
        title: "Renko trend",
        values: [42, 44, 47, 51, 48, 45, 49, 54, 52, 57],
      }),
  },
  {
    name: "Kagi chart",
    description: "Direction and reversal matter more than elapsed time.",
    create: () =>
      kagi({
        title: "Kagi trend",
        values: [42, 46, 51, 47, 43, 48, 55, 52, 58],
      }),
  },
  {
    name: "Geographic cartogram",
    description:
      "Equal cells distort geography to emphasize regional magnitude.",
    create: () =>
      cartogram({ title: "Population cartogram", matrix: nextMatrix }),
  },
  {
    name: "Transit map",
    description:
      "Stations and transfer paths form a schematic transport network.",
    create: () => transitMap({ title: "Metro network", ...nextNetwork }),
  },
] as const;

const chartFactories = [
  {
    name: "Diverging bars",
    description: "Positive and negative values share a zero baseline.",
    create: () =>
      bar({
        title: "Monthly revenue",
        data: [
          { label: "Jan", value: 42 },
          { label: "Feb", value: 68 },
          { label: "Mar", value: 91 },
          { label: "Returns", value: -18 },
        ],
      }),
  },
  {
    name: "Vertical columns",
    description: "Positive and negative categories cross a shared baseline.",
    create: () =>
      column({
        title: "Quarterly change",
        data: [
          { label: "Q1", value: 34 },
          { label: "Q2", value: 52 },
          { label: "Q3", value: -18 },
          { label: "Q4", value: 41 },
        ],
      }),
  },
  {
    name: "Sparkline",
    description:
      "Missing samples use a distinct glyph instead of becoming zero.",
    create: () =>
      sparkline({
        title: "API latency",
        label: "p95",
        values: [18, 22, 21, null, 19, 35, 27, 24, 31, 20],
      }),
  },
  {
    name: "Line chart",
    description: "Connected samples retain peaks and break cleanly at gaps.",
    create: () =>
      line({
        title: "Requests per minute",
        label: "RPM",
        values: [18, 24, 21, 35, 31, null, 38, 52, 44, 61, 57, 68],
      }),
  },
  {
    name: "Scatter plot",
    description: "Numeric relationships remain legible in a compact grid.",
    create: () =>
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
  },
  {
    name: "Histogram",
    description: "Automatic numeric bins reveal the shape of a distribution.",
    create: () =>
      histogram({
        title: "Request duration distribution",
        bins: 6,
        values: [12, 14, 15, 16, 18, 18, 20, 21, 22, 24, 26, 31, 34, 42],
      }),
  },
  {
    name: "Area chart",
    description: "Filled trends retain missing-data gaps and important peaks.",
    create: () =>
      area({
        title: "Daily active users",
        label: "DAU",
        values: [42, 48, 51, 49, 58, 64, null, 67, 73, 71, 79, 84],
      }),
  },
  {
    name: "Box plot",
    description: "Quartiles and medians compare distributions compactly.",
    create: () =>
      boxPlot({
        title: "Latency by region",
        data: [
          { label: "EU", values: [18, 21, 22, 24, 31, 35, 42] },
          { label: "US", values: [24, 27, 29, 35, 39, 44, 51] },
          { label: "APAC", values: [31, 36, 41, 48, 55, 61, 72] },
        ],
      }),
  },
  {
    name: "Stacked bars",
    description: "Proportional segments compare composition across rows.",
    create: () =>
      stackedBar({
        title: "Traffic mix",
        series: ["Web", "API", "Jobs"],
        rows: [
          { label: "Mon", values: [52, 31, 17] },
          { label: "Tue", values: [46, 38, 16] },
          { label: "Wed", values: [41, 43, 16] },
        ],
      }),
  },
  {
    name: "Donut chart",
    description:
      "Shape-coded slices and percentages survive monochrome output.",
    create: () =>
      donut({
        title: "Runtime share",
        data: [
          { label: "Node", value: 46 },
          { label: "Python", value: 28 },
          { label: "Go", value: 17 },
          { label: "Other", value: 9 },
        ],
      }),
  },
  {
    name: "Grouped bars",
    description: "Adjacent series preserve direct comparisons across groups.",
    create: () =>
      groupedBar({
        title: "Quarterly channels",
        series: ["Web", "API"],
        rows: [
          { label: "Q1", values: [42, 31] },
          { label: "Q2", values: [51, 39] },
          { label: "Q3", values: [47, 46] },
        ],
      }),
  },
  {
    name: "Waterfall chart",
    description:
      "Running gains and losses explain movement to the final total.",
    create: () =>
      waterfall({
        title: "Revenue bridge",
        initial: 120,
        data: [
          { label: "Sales", value: 48 },
          { label: "Refunds", value: -17 },
          { label: "Fees", value: -11 },
          { label: "Upsell", value: 26 },
        ],
      }),
  },
  {
    name: "Bullet chart",
    description:
      "Actual values, qualitative ranges, and targets share one row.",
    create: () =>
      bullet({
        title: "Service objectives",
        data: [
          { label: "Uptime", value: 97, target: 99 },
          { label: "Coverage", value: 84, target: 90 },
          { label: "Quality", value: 76, target: 85 },
        ],
      }),
  },
  {
    name: "Candlestick chart",
    description:
      "OHLC bodies and wicks distinguish rising and falling periods.",
    create: () =>
      candlestick({
        title: "Weekly price",
        data: [
          { label: "M", open: 42, high: 51, low: 39, close: 48 },
          { label: "T", open: 48, high: 53, low: 44, close: 46 },
          { label: "W", open: 46, high: 56, low: 45, close: 54 },
          { label: "T", open: 54, high: 57, low: 49, close: 51 },
          { label: "F", open: 51, high: 62, low: 50, close: 59 },
        ],
      }),
  },
  {
    name: "Gantt timeline",
    description:
      "Task ranges and completion remain readable without interaction.",
    create: () =>
      gantt({
        title: "Release timeline",
        tasks: [
          { label: "Design", start: 1, end: 4, progress: 100 },
          { label: "Build", start: 3, end: 8, progress: 70 },
          { label: "QA", start: 7, end: 10, progress: 25 },
          { label: "Launch", start: 10, end: 11, progress: 0 },
        ],
      }),
  },
  {
    name: "Multi-series line",
    description: "Shape-coded series remain distinct without color.",
    create: () =>
      multiLine({
        title: "Regional traffic",
        legend: { position: "top", color: "accent" },
        series: [
          { label: "EU", values: [18, 24, 21, 35, 31, 42] },
          { label: "US", values: [14, 19, 27, 25, 38, 45] },
          { label: "APAC", values: [22, 17, 31, 29, 42, 37] },
        ],
      }),
  },
  {
    name: "Stacked area",
    description: "Layered bands show total growth and composition.",
    create: () =>
      stackedArea({
        title: "Usage composition",
        series: [
          { label: "Web", values: [18, 24, 29, 35, 41] },
          { label: "API", values: [12, 16, 21, 26, 31] },
        ],
      }),
  },
  {
    name: "Dumbbell chart",
    description: "Two endpoints emphasize change across categories.",
    create: () =>
      rangeChart({
        title: "Before and after",
        style: "dumbbell",
        data: [
          { label: "Build", start: 62, end: 88 },
          { label: "Tests", start: 71, end: 94 },
          { label: "Deploy", start: 54, end: 79 },
        ],
      }),
  },
  {
    name: "Range bar chart",
    description: "Filled intervals compare bounded spans across categories.",
    create: () =>
      rangeChart({
        title: "Delivery windows",
        style: "bar",
        data: [
          { label: "Design", start: 1, end: 4 },
          { label: "Build", start: 3, end: 8 },
          { label: "Review", start: 7, end: 10 },
        ],
      }),
  },
  {
    name: "Lollipop chart",
    description: "Lightweight stems highlight positive and negative values.",
    create: () =>
      lollipop({
        title: "Quarterly variance",
        data: [
          { label: "Q1", value: 12 },
          { label: "Q2", value: -5 },
          { label: "Q3", value: 19 },
        ],
      }),
  },
  {
    name: "Step chart",
    description: "Discrete changes use horizontal plateaus and vertical jumps.",
    create: () =>
      stepChart({ title: "Plan changes", values: [12, 18, 18, 27, 21, 34] }),
  },
  {
    name: "Error intervals",
    description:
      "Point estimates retain their low and high uncertainty bounds.",
    create: () =>
      intervalChart({
        title: "Latency estimates",
        data: [
          { label: "Edge", value: 22, low: 18, high: 29 },
          { label: "API", value: 42, low: 35, high: 51 },
          { label: "Batch", value: 67, low: 54, high: 81 },
        ],
      }),
  },
  ...(
    [
      [
        "Density plot",
        "density",
        "A compact kernel profile reveals distribution shape.",
      ],
      [
        "Violin plot",
        "violin",
        "A symmetric profile emphasizes concentration and tails.",
      ],
      [
        "Strip plot",
        "strip",
        "Individual observations stay visible on one shared scale.",
      ],
      [
        "Beeswarm plot",
        "beeswarm",
        "Colliding observations spread around the center line.",
      ],
      [
        "ECDF",
        "ecdf",
        "A stepped cumulative curve shows every observed threshold.",
      ],
      [
        "Q-Q plot",
        "qq",
        "Observed values are compared with theoretical quantiles.",
      ],
    ] as const
  ).map(([name, mode, description]) => ({
    name,
    description,
    create: () =>
      distribution({
        title: name,
        mode,
        values: [12, 14, 15, 17, 18, 18, 20, 22, 23, 27, 31, 42],
      }),
  })),
  {
    name: "Likert chart",
    description: "Diverging response segments share a neutral center line.",
    create: () =>
      likert({
        title: "Developer survey",
        series: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"],
        rows: [
          { label: "Fast", values: [-12, -18, 45, 25] },
          { label: "Clear", values: [-8, -14, 48, 30] },
          { label: "Stable", values: [-15, -20, 41, 24] },
        ],
      }),
  },
  {
    name: "Pie chart",
    description: "A filled radial composition complements the donut view.",
    create: () =>
      donut({
        title: "Runtime share",
        style: "pie",
        data: [
          { label: "Node", value: 46 },
          { label: "Python", value: 28 },
          { label: "Go", value: 17 },
          { label: "Other", value: 9 },
        ],
      }),
  },
  {
    name: "Treemap",
    description: "Area-proportional regions show part-to-whole composition.",
    create: () =>
      treemap({
        title: "Bundle composition",
        data: [
          { label: "Core", value: 48 },
          { label: "HTML", value: 24 },
          { label: "ANSI", value: 18 },
          { label: "Email", value: 10 },
        ],
      }),
  },
  {
    name: "Waffle chart",
    description: "A fixed cell grid makes proportions easy to count.",
    create: () =>
      waffle({
        title: "Issue status",
        data: [
          { label: "Closed", value: 68 },
          { label: "Active", value: 22 },
          { label: "Blocked", value: 10 },
        ],
      }),
  },
  {
    name: "Funnel chart",
    description: "Centered stages emphasize conversion and attrition.",
    create: () =>
      funnel({
        title: "Signup funnel",
        legend: { position: "left", color: "accent" },
        data: [
          { label: "Visit", value: 1000 },
          { label: "Trial", value: 540 },
          { label: "Active", value: 280 },
          { label: "Paid", value: 120 },
        ],
      }),
  },
  {
    name: "Pyramid chart",
    description: "Reversed centered stages build from a narrow apex.",
    create: () =>
      funnel({
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
  },
  {
    name: "Pareto chart",
    description: "Sorted bars and a cumulative curve reveal the vital few.",
    create: () =>
      pareto({
        title: "Incident causes",
        data: [
          { label: "Config", value: 42 },
          { label: "Deploy", value: 28 },
          { label: "Capacity", value: 17 },
          { label: "Other", value: 8 },
        ],
      }),
  },
  {
    name: "Calendar heatmap",
    description: "Week-aligned cells reveal activity patterns over dates.",
    create: () =>
      calendarHeatmap({
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
  },
  {
    name: "Horizon chart",
    description: "Folded positive and negative bands compress dense trends.",
    create: () =>
      horizon({
        title: "Traffic deviation",
        label: "RPM delta",
        bands: 3,
        values: [-8, -5, -2, 1, 4, 9, 6, 2, -3, -7, 5, 10],
      }),
  },
  {
    name: "Event and range timeline",
    description: "Point events and duration ranges share one numeric axis.",
    create: () =>
      timeline({
        title: "Release events",
        data: [
          { label: "Kickoff", start: 1 },
          { label: "Build", start: 2, end: 6 },
          { label: "Review", start: 5 },
          { label: "Rollout", start: 7, end: 10 },
        ],
      }),
  },
  {
    name: "Bubble chart",
    description: "Marker area adds a third quantitative dimension.",
    create: () =>
      bubble({
        title: "Market map",
        data: [
          { label: "Alpha", x: 2, y: 7, size: 12 },
          { label: "Beta", x: 5, y: 4, size: 28 },
          { label: "Gamma", x: 8, y: 9, size: 46 },
        ],
      }),
  },
  {
    name: "Connected scatter",
    description:
      "Source-order connections expose a changing two-variable path.",
    create: () =>
      connectedScatter({
        title: "Efficiency path",
        data: [
          { label: "Jan", x: 2, y: 3 },
          { label: "Feb", x: 4, y: 6 },
          { label: "Mar", x: 7, y: 5 },
          { label: "Apr", x: 9, y: 9 },
        ],
      }),
  },
  {
    name: "Correlation matrix",
    description: "Signed density cells compare every variable pair.",
    create: () =>
      correlationMatrix({
        title: "Metric correlations",
        labels: ["Speed", "Cost", "Quality"],
        values: [
          [1, -0.6, 0.7],
          [-0.6, 1, -0.3],
          [0.7, -0.3, 1],
        ],
      }),
  },
  {
    name: "Radar chart",
    description: "A closed radial profile compares values across shared axes.",
    create: () =>
      radar({
        title: "Platform profile",
        axes: ["Speed", "Cost", "Quality", "Reach", "Safety"],
        values: [8, 5, 9, 7, 6],
        max: 10,
      }),
  },
  {
    name: "Parallel coordinates",
    description: "Multiple profiles cross aligned quantitative axes.",
    create: () =>
      parallelCoordinates({
        title: "Service comparison",
        axes: ["Cost", "Speed", "Quality", "Scale"],
        series: [
          { label: "Edge", values: [4, 9, 7, 8] },
          { label: "API", values: [6, 7, 9, 6] },
        ],
      }),
  },
  {
    name: "Sankey diagram",
    description: "Weighted source-to-target links summarize flow.",
    create: () =>
      flow({
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
  },
  {
    name: "Alluvial diagram",
    description: "Thicker bands emphasize movement between categories.",
    create: () =>
      flow({
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
  },
  ...(
    [
      [
        "Tree diagram",
        "tree",
        "A compact indented tree preserves parent-child structure.",
      ],
      [
        "Org chart",
        "org",
        "Boxed labels present the same hierarchy as an organization.",
      ],
      [
        "Dependency tree",
        "dependency",
        "Directional connectors clarify dependency chains.",
      ],
    ] as const
  ).map(([name, mode, description]) => ({
    name,
    description,
    create: () => hierarchy({ title: name, mode, root: hierarchyRoot }),
  })),
  {
    name: "Network graph",
    description:
      "Circular nodes and explicit edges show non-hierarchical links.",
    create: () =>
      network({
        title: "Service network",
        nodes: [{ id: "web" }, { id: "api" }, { id: "jobs" }, { id: "db" }],
        edges: [
          { source: "web", target: "api", value: 8 },
          { source: "api", target: "db", value: 6 },
          { source: "jobs", target: "db", value: 3 },
        ],
      }),
  },
  {
    name: "Flame graph",
    description:
      "Weighted nested frames reveal where execution time accumulates.",
    create: () => partition({ title: "CPU flame graph", root: hierarchyRoot }),
  },
  {
    name: "Sunburst chart",
    description: "Concentric weighted sectors expose hierarchical composition.",
    create: () =>
      partition({
        title: "Repository sunburst",
        mode: "sunburst",
        root: hierarchyRoot,
      }),
  },
  {
    name: "Ridgeline plot",
    description: "Stacked density profiles compare distributions on one scale.",
    create: () =>
      ridgeline({
        title: "Latency by region",
        series: [
          { label: "EU", values: [18, 20, 21, 22, 24, 28, 31, 35] },
          { label: "US", values: [24, 27, 29, 31, 35, 39, 44, 51] },
          { label: "APAC", values: [31, 36, 41, 44, 48, 55, 61, 72] },
        ],
      }),
  },
  {
    name: "Hexbin plot",
    description:
      "Staggered density bins reveal clusters in crowded point data.",
    create: () =>
      hexbin({
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
  },
  {
    name: "Control chart",
    description:
      "Center and control limits make exceptional observations explicit.",
    create: () =>
      controlChart({
        title: "Deploy duration control",
        labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
        values: [18, 21, 19, 22, 20, 24, 21, 34],
        center: 21,
        lowerLimit: 14,
        upperLimit: 28,
      }),
  },
  {
    name: "Mosaic chart",
    description:
      "Column width shows group size; segment height shows composition.",
    create: () =>
      mosaic({
        title: "Plan mix by channel",
        series: ["Free", "Team", "Enterprise"],
        rows: [
          { label: "Web", values: [58, 31, 11] },
          { label: "API", values: [20, 46, 34] },
          { label: "Partner", values: [8, 27, 65] },
        ],
      }),
  },
  {
    name: "Chord diagram",
    description: "Weighted center-crossing links expose cyclic relationships.",
    create: () =>
      chord({
        title: "Team handoffs",
        labels: ["Design", "Build", "Review", "Ship"],
        values: [
          [0, 12, 3, 0],
          [2, 0, 10, 4],
          [1, 3, 0, 9],
          [0, 2, 4, 0],
        ],
      }),
  },
  {
    name: "Gauge dial",
    description:
      "A compact instrument dial communicates one value against a range.",
    create: () =>
      gauge({
        title: "CPU saturation",
        label: "CPU",
        value: 73,
        min: 0,
        max: 100,
      }),
  },
  {
    name: "Theme river",
    description:
      "Centered streams reveal how several categories ebb and flow over time.",
    create: () =>
      themeRiver({
        title: "Traffic themes",
        series: [
          { label: "Web", values: [12, 18, 25, 20, 14, 17] },
          { label: "API", values: [8, 14, 18, 24, 29, 25] },
          { label: "Jobs", values: [5, 7, 6, 9, 12, 16] },
        ],
      }),
  },
  {
    name: "Pictorial bar",
    description:
      "Repeated symbols turn simple magnitude comparisons into expressive rows.",
    create: () =>
      pictorialBar({
        title: "Release work",
        symbol: "◆",
        data: [
          { label: "Features", value: 8 },
          { label: "Bugs", value: 5 },
          { label: "Docs", value: 3 },
        ],
      }),
  },
  {
    name: "Choropleth map",
    description:
      "A portable raster shape shades named regions by numeric intensity.",
    create: () =>
      choroplethMap({
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
  },
  {
    name: "Country map atlas",
    description:
      "Geographic silhouettes compare country-level values in responsive small multiples.",
    create: () =>
      countryMap({
        title: "Country activity",
        data: [
          { country: "spain", value: 72 },
          { country: "france", value: 54 },
          { country: "italy", value: 83 },
          { country: "japan", value: 61 },
        ],
      }),
  },
  {
    name: "Continent map",
    description:
      "Real country boundaries turn continent-level metrics into a portable choropleth.",
    create: () =>
      continentMap({
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
  },
  {
    name: "Route map",
    description:
      "Directed coordinate routes show movement between many origins and destinations.",
    create: () =>
      routeMap({
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
  },
  {
    name: "Goals and progress",
    description: "Target markers remain visible without relying on color.",
    create: () =>
      progress({
        title: "Release status",
        data: [
          { label: "Build", value: 72, target: 80 },
          { label: "Tests", value: 94, target: 90 },
          { label: "Deploy", value: 40 },
        ],
      }),
  },
  {
    name: "Numeric heatmap",
    description: "Density glyphs and a legend work in monochrome output.",
    create: () =>
      heatmap({
        title: "Weekly activity",
        columns: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        rows: [
          { label: "API", values: [2, 5, 8, 10, 7] },
          { label: "Web", values: [1, null, 6, 4, 9] },
          { label: "Jobs", values: [0, 3, 4, 8, 5] },
        ],
      }),
  },
  {
    name: "Bump chart",
    description:
      "Rank changes make competitive position and overtakes immediately visible.",
    create: () =>
      bump({
        title: "Search rankings",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        series: [
          { label: "Atlas", values: [82, 91, 88, 96] },
          { label: "Nova", values: [93, 87, 90, 89] },
          { label: "Pixel", values: [71, 78, 94, 92] },
        ],
      }),
  },
  {
    name: "Fan chart",
    description:
      "A forecast median travels inside an expanding uncertainty band.",
    create: () =>
      fan({
        title: "Demand forecast",
        labels: ["Now", "+1", "+2", "+3", "+4"],
        lower: [48, 44, 39, 34, 29],
        median: [50, 53, 57, 61, 66],
        upper: [52, 62, 73, 84, 96],
      }),
  },
  {
    name: "Raincloud plot",
    description:
      "Density, observations, and group comparison share a compact horizontal scale.",
    create: () =>
      raincloud({
        title: "Latency samples",
        series: [
          { label: "Edge", values: [12, 14, 14, 16, 18, 21, 24] },
          { label: "Origin", values: [22, 27, 29, 31, 35, 41, 48] },
          { label: "Batch", values: [38, 42, 44, 51, 56, 61, 68] },
        ],
      }),
  },
  {
    name: "UpSet plot",
    description:
      "Set intersections scale beyond the visual limits of Venn diagrams.",
    create: () =>
      upset({
        title: "Feature adoption",
        sets: ["Web", "API", "CLI"],
        intersections: [
          { sets: ["Web"], value: 42 },
          { sets: ["API"], value: 31 },
          { sets: ["Web", "API"], value: 27 },
          { sets: ["Web", "CLI"], value: 18 },
          { sets: ["Web", "API", "CLI"], value: 12 },
        ],
      }),
  },
  {
    name: "Point-and-figure",
    description:
      "X and O columns emphasize meaningful price reversals instead of elapsed time.",
    create: () =>
      pointFigure({
        title: "Price reversals",
        values: [42, 44, 47, 51, 48, 44, 40, 43, 46, 49, 45, 41],
        boxSize: 1,
      }),
  },
  {
    name: "Wind rose",
    description:
      "Directional rays encode frequency with square-root radial scaling.",
    create: () =>
      windRose({
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
  },
  {
    name: "Polar-area chart",
    description:
      "Equal-angle radial sectors compare category magnitude without Cartesian axes.",
    create: () =>
      polarArea({
        title: "Channel reach",
        data: [
          { label: "Web", value: 82 },
          { label: "Email", value: 54 },
          { label: "CLI", value: 39 },
          { label: "Social", value: 68 },
          { label: "Partner", value: 47 },
        ],
      }),
  },
  {
    name: "Ternary plot",
    description:
      "Three-part compositions live inside a triangular coordinate system.",
    create: () =>
      ternary({
        title: "Project trade-offs",
        labels: ["Speed", "Quality", "Cost"],
        data: [
          { label: "A", a: 55, b: 30, c: 15 },
          { label: "B", a: 25, b: 55, c: 20 },
          { label: "C", a: 30, b: 25, c: 45 },
        ],
      }),
  },
  {
    name: "Contour plot",
    description:
      "Density textures reveal level regions across a sampled numeric surface.",
    create: () =>
      contour({
        title: "Response surface",
        data: [
          { x: 0, y: 0, value: 2 },
          { x: 5, y: 0, value: 8 },
          { x: 10, y: 0, value: 3 },
          { x: 0, y: 5, value: 5 },
          { x: 5, y: 5, value: 12 },
          { x: 10, y: 5, value: 7 },
          { x: 0, y: 10, value: 3 },
          { x: 5, y: 10, value: 9 },
          { x: 10, y: 10, value: 4 },
        ],
      }),
  },
  {
    name: "Adjacency matrix",
    description:
      "Network intensity becomes a compact, scalable matrix of pairwise connections.",
    create: () =>
      adjacencyMatrix({
        title: "Service calls",
        labels: ["Web", "API", "Auth", "DB", "Queue"],
        values: [
          [0, 18, 4, 0, 2],
          [2, 0, 12, 21, 8],
          [0, 3, 0, 9, 0],
          [0, 1, 0, 0, 4],
          [0, 7, 0, 11, 0],
        ],
      }),
  },
  {
    name: "Arc diagram",
    description:
      "Curved links expose long-range relationships along an ordered baseline.",
    create: () =>
      arcDiagram({
        title: "Package dependencies",
        labels: ["app", "ui", "api", "auth", "data", "jobs"],
        edges: [
          { from: 0, to: 1, value: 8 },
          { from: 0, to: 2, value: 12 },
          { from: 2, to: 3, value: 6 },
          { from: 2, to: 4, value: 9 },
          { from: 4, to: 5, value: 4 },
        ],
      }),
  },
  {
    name: "Survival curve",
    description: "Stepwise probability curves compare time-to-event outcomes.",
    create: () =>
      survival({
        title: "Subscriber retention",
        series: [
          {
            label: "Free",
            points: [
              { x: 0, probability: 1 },
              { x: 1, probability: 0.84 },
              { x: 3, probability: 0.61 },
              { x: 6, probability: 0.38 },
              { x: 12, probability: 0.22 },
            ],
          },
          {
            label: "Pro",
            points: [
              { x: 0, probability: 1 },
              { x: 1, probability: 0.94 },
              { x: 3, probability: 0.86 },
              { x: 6, probability: 0.72 },
              { x: 12, probability: 0.58 },
            ],
          },
        ],
      }),
  },
  {
    name: "ROC / precision-recall",
    description:
      "Classifier trade-offs are shown against a no-skill reference line.",
    create: () =>
      roc({
        title: "Fraud model ROC",
        series: [
          {
            label: "v2",
            points: [
              { x: 0, probability: 0 },
              { x: 0.08, probability: 0.55 },
              { x: 0.18, probability: 0.78 },
              { x: 0.37, probability: 0.91 },
              { x: 1, probability: 1 },
            ],
          },
          {
            label: "v1",
            points: [
              { x: 0, probability: 0 },
              { x: 0.16, probability: 0.46 },
              { x: 0.34, probability: 0.72 },
              { x: 1, probability: 1 },
            ],
          },
        ],
      }),
  },
  {
    name: "Calibration plot",
    description:
      "Predicted probabilities are checked against observed outcomes and perfect calibration.",
    create: () =>
      calibration({
        title: "Probability calibration",
        data: [
          { predicted: 0.1, observed: 0.08 },
          { predicted: 0.3, observed: 0.34 },
          { predicted: 0.5, observed: 0.47 },
          { predicted: 0.7, observed: 0.64 },
          { predicted: 0.9, observed: 0.82 },
        ],
      }),
  },
  {
    name: "SLO error budget",
    description:
      "Remaining reliability budget reveals burn rate across the reporting window.",
    create: () =>
      errorBudget({
        title: "API error budget",
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        remaining: [100, 94, 81, 76, 48, 41],
      }),
  },
  {
    name: "Cumulative-flow diagram",
    description:
      "Stacked work states expose bottlenecks and throughput over time.",
    create: () =>
      cumulativeFlow({
        title: "Sprint flow",
        labels: ["M", "T", "W", "T", "F"],
        stages: [
          { label: "Todo", values: [18, 15, 12, 8, 4] },
          { label: "Doing", values: [3, 5, 7, 6, 4] },
          { label: "Review", values: [1, 2, 3, 5, 4] },
          { label: "Done", values: [0, 2, 5, 10, 16] },
        ],
      }),
  },
  {
    name: "Burndown / burnup",
    description: "Actual progress runs beside an ideal delivery trajectory.",
    create: () =>
      burn({
        title: "Sprint burndown",
        labels: ["D1", "D2", "D3", "D4", "D5", "D6"],
        actual: [34, 31, 24, 20, 11, 5],
      }),
  },
  {
    name: "Market profile / TPO",
    description:
      "Horizontal volume-at-price bars reveal acceptance and rejection levels.",
    create: () =>
      marketProfile({
        title: "Volume at price",
        data: [
          { price: 105, value: 4 },
          { price: 104, value: 9 },
          { price: 103, value: 16 },
          { price: 102, value: 23 },
          { price: 101, value: 18 },
          { price: 100, value: 11 },
          { price: 99, value: 6 },
        ],
      }),
  },
  {
    name: "Order-book depth",
    description:
      "Mirrored bid and ask liquidity makes spread and depth easy to scan.",
    create: () =>
      orderBook({
        title: "BTC order book",
        bids: [
          { price: 99, value: 8 },
          { price: 98, value: 15 },
          { price: 97, value: 23 },
          { price: 96, value: 31 },
        ],
        asks: [
          { price: 100, value: 6 },
          { price: 101, value: 12 },
          { price: 102, value: 21 },
          { price: 103, value: 29 },
        ],
      }),
  },
  {
    name: "Barcode / event plot",
    description:
      "Dense event timing becomes a readable barcode with magnitude-sensitive ticks.",
    create: () =>
      barcode({
        title: "Deploy events",
        events: [
          { position: 1, label: "web", value: 2 },
          { position: 3, label: "api", value: 4 },
          { position: 3.4, label: "worker", value: 1 },
          { position: 7, label: "web", value: 3 },
          { position: 8.2, label: "db", value: 5 },
          { position: 11, label: "api", value: 2 },
        ],
      }),
  },
  {
    name: "Spiral timeline",
    description:
      "Long chronological sequences fold into a compact, numbered spiral.",
    create: () =>
      spiralTimeline({
        title: "Product history",
        events: [
          { position: 1, label: "Idea" },
          { position: 2, label: "Prototype" },
          { position: 3, label: "Beta" },
          { position: 4, label: "Launch" },
          { position: 5, label: "Teams" },
          { position: 6, label: "Global" },
        ],
      }),
  },
  {
    name: "World choropleth",
    description:
      "A recognizable world silhouette compares activity across continents.",
    create: () =>
      worldChoropleth({
        title: "Global activity",
        data: [
          { id: "NA", label: "North America", value: 78 },
          { id: "SA", label: "South America", value: 42 },
          { id: "EU", label: "Europe", value: 91 },
          { id: "AF", label: "Africa", value: 35 },
          { id: "AS", label: "Asia", value: 84 },
          { id: "OC", label: "Oceania", value: 53 },
        ],
      }),
  },
  {
    name: "Migration-flow map",
    description:
      "Curved, weighted movement paths retain origin, destination, and direction.",
    create: () =>
      migrationFlow({
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
          {
            from: { x: 0, y: 2, label: "Madrid" },
            to: { x: 8, y: 0, label: "Rome" },
            value: 6,
          },
        ],
      }),
  },
  {
    name: "Hex-tile map",
    description:
      "Equal-area geographic tiles make regional comparison fair and compact.",
    create: () =>
      hexTileMap({
        title: "Iberian regions",
        data: [
          { x: 1, y: 0, label: "GA", value: 38 },
          { x: 2, y: 0, label: "AS", value: 44 },
          { x: 3, y: 0, label: "PV", value: 67 },
          { x: 0, y: 1, label: "PT", value: 51 },
          { x: 2, y: 1, label: "CL", value: 49 },
          { x: 3, y: 1, label: "MD", value: 92 },
          { x: 4, y: 1, label: "CT", value: 81 },
          { x: 1, y: 2, label: "AN", value: 73 },
          { x: 3, y: 2, label: "VC", value: 69 },
        ],
      }),
  },
  {
    name: "Dot-density map",
    description:
      "Deterministic dots show counts while preserving the underlying region shapes.",
    create: () =>
      dotDensityMap({
        title: "Population density",
        shape: [
          "  AAAA  BBBB  ",
          " AAAAAABBBBBB ",
          "AAAAAAABBBBBBB",
          " AAAAA CBBBBB ",
          "  AAACCCBBB   ",
          "    CCCCC     ",
          "     CCC      ",
        ],
        regions: [
          { id: "A", label: "West", value: 140 },
          { id: "B", label: "East", value: 210 },
          { id: "C", label: "South", value: 90 },
        ],
        dotsPerUnit: 10,
      }),
  },
  ...nextWaveFactories,
  {
    name: "Status grid",
    description: "Shape and text preserve meaning when color is unavailable.",
    create: () =>
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
  },
] as const;

const gallery = document.querySelector<HTMLElement>("#gallery");
const searchInput = document.querySelector<HTMLInputElement>("#search");
const galleryStatus = document.querySelector<HTMLElement>("#gallery-status");
const widthInput = document.querySelector<HTMLInputElement>("#width");
const widthOutput = document.querySelector<HTMLOutputElement>("#width-value");
const fontSizeInput = document.querySelector<HTMLInputElement>("#font-size");
const fontSizeOutput =
  document.querySelector<HTMLOutputElement>("#font-size-value");
const charsetInput = document.querySelector<HTMLSelectElement>("#charset");
const themeInput = document.querySelector<HTMLSelectElement>("#theme");
const controlsToggle =
  document.querySelector<HTMLButtonElement>("#controls-toggle");
const controlsOptions =
  document.querySelector<HTMLElement>("#controls-options");

if (
  gallery === null ||
  searchInput === null ||
  galleryStatus === null ||
  widthInput === null ||
  widthOutput === null ||
  fontSizeInput === null ||
  fontSizeOutput === null ||
  charsetInput === null ||
  themeInput === null ||
  controlsToggle === null ||
  controlsOptions === null
) {
  throw new Error("Gallery controls are missing from the HTML document.");
}

const compactControls = window.matchMedia("(max-width: 720px)");
let mobileControlsExpanded = false;

function syncControlsVisibility(): void {
  const collapsed = compactControls.matches && !mobileControlsExpanded;
  controlsOptions.hidden = collapsed;
  controlsToggle.setAttribute("aria-expanded", String(!collapsed));
  controlsToggle.textContent = collapsed ? "Settings" : "Done";
}

controlsToggle.addEventListener("click", () => {
  mobileControlsExpanded = !mobileControlsExpanded;
  syncControlsVisibility();
});
compactControls.addEventListener("change", syncControlsVisibility);
syncControlsVisibility();

const themes = {
  paper: {
    foreground: "#28241f",
    background: "transparent",
    muted: "#83786b",
    accent: "#9a3412",
    positive: "#166534",
    negative: "#b91c1c",
    series1: "#0369a1",
    series2: "#7e22ce",
    series3: "#a16207",
    series4: "#0f766e",
  },
  terminal: {
    foreground: "#b7f7c5",
    background: "transparent",
    muted: "#668f70",
    accent: "#7dd3fc",
    positive: "#4ade80",
    negative: "#fb7185",
    series1: "#67e8f9",
    series2: "#c4b5fd",
    series3: "#fde047",
    series4: "#5eead4",
  },
} as const;

function renderGallery(): void {
  const width = Number(widthInput.value);
  const fontSize = Number(fontSizeInput.value);
  const charset = charsetInput.value === "ascii" ? "ascii" : "unicode";
  const themeName = themeInput.value === "terminal" ? "terminal" : "paper";
  const theme = themes[themeName];
  document.documentElement.dataset.theme = themeName;
  widthOutput.value = String(width);
  fontSizeOutput.value = `${fontSize}px`;
  gallery.replaceChildren();

  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleExamples = chartFactories.filter((example) =>
    `${example.name} ${example.description}`
      .toLocaleLowerCase()
      .includes(query),
  );
  galleryStatus.textContent = `${visibleExamples.length} of ${chartFactories.length} chart styles shown`;

  if (visibleExamples.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = `No charts match “${searchInput.value.trim()}”. Try a broader term.`;
    gallery.append(empty);
    return;
  }

  for (const example of visibleExamples) {
    const grid = layout(example.create(), { width, charset });
    const article = document.createElement("article");
    article.className = "chart-card";

    const heading = document.createElement("h2");
    heading.textContent = example.name;
    const description = document.createElement("p");
    description.textContent = example.description;
    const chart = document.createElement("div");
    chart.className = "chart-output";
    chart.innerHTML = renderHtml(grid, {
      accessibility: "both",
      theme,
      fontSize,
    });

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "View plain-text output";
    const plain = document.createElement("pre");
    plain.textContent = renderText(grid);
    details.append(summary, plain);
    article.append(heading, description, chart, details);
    gallery.append(article);
  }
}

for (const control of [
  searchInput,
  widthInput,
  fontSizeInput,
  charsetInput,
  themeInput,
]) {
  control.addEventListener("input", renderGallery);
  control.addEventListener("change", renderGallery);
}

const githubLink = document.querySelector<HTMLAnchorElement>("#github-link");
if (githubLink !== null && window.location.hostname.endsWith(".github.io")) {
  const owner = window.location.hostname.slice(0, -".github.io".length);
  const repository =
    window.location.pathname.split("/").filter(Boolean)[0] ??
    `${owner}.github.io`;
  if (owner !== "") {
    githubLink.href = `https://github.com/${owner}/${repository}`;
    githubLink.hidden = false;
  }
}

renderGallery();
