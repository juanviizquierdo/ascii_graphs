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
  layoutBar,
  line,
  lollipop,
  multiLine,
  network,
  parallelCoordinates,
  pareto,
  partition,
  radar,
  rangeChart,
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
import { describe, expect, it } from "vitest";

import { renderHtml } from "./index.js";

describe("renderHtml", () => {
  it("supports bounded chart typography options", () => {
    const grid = layoutBar(bar({ data: [{ label: "Done", value: 100 }] }));
    const html = renderHtml(grid, { fontSize: 16, lineHeight: 1.5 });
    expect(html).toContain("font-size:16px");
    expect(html).toContain("line-height:1.5");
    expect(() => renderHtml(grid, { fontSize: 100 })).toThrow(
      "between 6 and 72",
    );
  });

  it("escapes untrusted chart content and includes an accessible table", () => {
    const grid = layoutBar(
      bar({
        title: 'Sales "report" <2026>',
        data: [{ label: "<script>alert(1)</script>", value: 3 }],
      }),
      { width: 36 },
    );
    const html = renderHtml(grid);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Sales &quot;report&quot; &lt;2026&gt;");
    expect(html).toContain("<table");
    expect(html).toContain('aria-hidden="true"');
  });

  it("can render a description-only email fragment", () => {
    const grid = layoutBar(bar({ data: [{ label: "Done", value: 100 }] }));
    const html = renderHtml(grid, {
      accessibility: "description",
      email: true,
    });

    expect(html).toContain('aria-label="Bar chart. Done: 100."');
    expect(html).toContain('data-ascii-graphs-email="true"');
    expect(html).not.toContain("<table");
  });

  it("renders generic multi-column metadata including missing values", () => {
    const html = renderHtml(
      layout(sparkline({ label: "Trend", values: [1, null, 3] })),
    );

    expect(html).toContain("<th>Index</th><th>Value</th>");
    expect(html).toContain('<th scope="row">1</th><td>—</td>');
  });

  it("renders line charts with every original sample in the table", () => {
    const html = renderHtml(
      layout(line({ label: "Traffic", values: [3, null, 9] })),
    );

    expect(html).toContain("<th>Index</th><th>Value</th>");
    expect(html).toContain('<th scope="row">1</th><td>—</td>');
    expect(html).toContain('<th scope="row">2</th><td>9</td>');
  });

  it("renders scatter labels and coordinates in an accessible table", () => {
    const html = renderHtml(
      layout(scatter({ data: [{ label: "api", x: 120, y: 18 }] })),
    );

    expect(html).toContain("<th>Label</th><th>X</th><th>Y</th>");
    expect(html).toContain('<th scope="row">api</th><td>120</td><td>18</td>');
  });

  it("renders accessible tables for the five reporting chart families", () => {
    const histogramHtml = renderHtml(
      layout(histogram({ values: [1, 2, 3], bins: 2 })),
    );
    const areaHtml = renderHtml(layout(area({ values: [1, null, 3] })));
    const boxHtml = renderHtml(
      layout(boxPlot({ data: [{ label: "API", values: [1, 2, 3] }] })),
    );
    const stackedHtml = renderHtml(
      layout(
        stackedBar({
          series: ["Web", "API"],
          rows: [{ label: "Prod", values: [4, 6] }],
        }),
      ),
    );
    const donutHtml = renderHtml(
      layout(donut({ data: [{ label: "Node", value: 10 }] })),
    );

    expect(histogramHtml).toContain("<th>Range</th><th>Count</th>");
    expect(areaHtml).toContain('<th scope="row">1</th><td>—</td>');
    expect(boxHtml).toContain("<th>Q1</th><th>Median</th><th>Q3</th>");
    expect(stackedHtml).toContain(
      '<th scope="row">Prod</th><td>4</td><td>6</td>',
    );
    expect(donutHtml).toContain(
      '<th scope="row">Node</th><td>10</td><td>100</td>',
    );
  });

  it("renders accessible tables for grouped, waterfall, bullet, OHLC, and Gantt charts", () => {
    const groupedHtml = renderHtml(
      layout(
        groupedBar({
          series: ["Web"],
          rows: [{ label: "Q1", values: [4] }],
        }),
      ),
    );
    const waterfallHtml = renderHtml(
      layout(waterfall({ data: [{ label: "Sales", value: 10 }] })),
    );
    const bulletHtml = renderHtml(
      layout(bullet({ data: [{ label: "SLA", value: 90, target: 95 }] })),
    );
    const candleHtml = renderHtml(
      layout(
        candlestick({
          data: [{ label: "Mon", open: 10, high: 14, low: 8, close: 12 }],
        }),
      ),
    );
    const ganttHtml = renderHtml(
      layout(gantt({ tasks: [{ label: "Build", start: 1, end: 3 }] })),
    );

    expect(groupedHtml).toContain('<th scope="row">Q1</th><td>4</td>');
    expect(waterfallHtml).toContain(
      '<th scope="row">Sales</th><td>10</td><td>10</td>',
    );
    expect(bulletHtml).toContain("<th>Target</th>");
    expect(candleHtml).toContain("<th>Open</th><th>High</th><th>Low</th>");
    expect(ganttHtml).toContain("<th>Start</th><th>End</th><th>Progress</th>");
  });

  it("renders tables for the extended trend and comparison charts", () => {
    const charts = [
      multiLine({ series: [{ label: "A", values: [1, 2] }] }),
      stackedArea({ series: [{ label: "A", values: [1, 2] }] }),
      rangeChart({ data: [{ label: "SLA", start: 2, end: 4 }] }),
      lollipop({ data: [{ label: "Q1", value: 3 }] }),
      stepChart({ values: [1, 2] }),
    ];
    const html = charts.map((chart) => renderHtml(layout(chart))).join("\n");
    expect(html).toContain("<th>Start</th><th>End</th>");
    expect(html).toContain('<th scope="row">Q1</th><td>3</td>');
    expect(html).toContain("<th>Index</th><th>A</th>");
  });

  it("renders accessible interval and distribution metadata", () => {
    const intervalHtml = renderHtml(
      layout(
        intervalChart({
          data: [{ label: "API", value: 42, low: 35, high: 51 }],
        }),
      ),
    );
    const qqHtml = renderHtml(
      layout(distribution({ mode: "qq", values: [1, 2, 4] })),
    );

    expect(intervalHtml).toContain("<th>Value</th><th>Low</th><th>High</th>");
    expect(intervalHtml).toContain(
      '<th scope="row">API</th><td>42</td><td>35</td><td>51</td>',
    );
    expect(qqHtml).toContain("<th>Theoretical quantile</th>");
  });

  it("renders accessible composition tables", () => {
    const charts = [
      likert({
        series: ["No", "Yes"],
        rows: [{ label: "Fast", values: [-2, 8] }],
      }),
      donut({ style: "pie", data: [{ label: "A", value: 10 }] }),
      treemap({ data: [{ label: "A", value: 10 }] }),
      waffle({ data: [{ label: "A", value: 10 }] }),
      funnel({ data: [{ label: "Visit", value: 10 }] }),
      pareto({ data: [{ label: "Cause", value: 10 }] }),
    ];
    const html = charts.map((chart) => renderHtml(layout(chart))).join("\n");

    expect(html).toContain("<th>No</th><th>Yes</th>");
    expect(html).toContain("<th>Percentage</th>");
    expect(html).toContain("<th>Cumulative percentage</th>");
  });

  it("renders accessible time-chart tables", () => {
    const html = [
      calendarHeatmap({ data: [{ date: "2026-07-18", value: 4 }] }),
      horizon({ values: [-1, 2] }),
      timeline({ data: [{ label: "Launch", start: 4 }] }),
    ]
      .map((chart) => renderHtml(layout(chart)))
      .join("\n");

    expect(html).toContain("<th>Date</th><th>Value</th>");
    expect(html).toContain("<th>Index</th><th>Value</th>");
    expect(html).toContain("<th>Start</th><th>End</th><th>Kind</th>");
  });

  it("renders accessible relationship tables", () => {
    const html = [
      bubble({ data: [{ label: "A", x: 1, y: 2, size: 3 }] }),
      connectedScatter({ data: [{ x: 1, y: 2 }] }),
      correlationMatrix({ labels: ["A"], values: [[1]] }),
      radar({ axes: ["A", "B", "C"], values: [1, 2, 3] }),
      parallelCoordinates({
        axes: ["A", "B"],
        series: [{ label: "One", values: [1, 2] }],
      }),
      flow({ links: [{ source: "A", target: "B", value: 3 }] }),
    ]
      .map((chart) => renderHtml(layout(chart)))
      .join("\n");

    expect(html).toContain("<th>Size</th>");
    expect(html).toContain("<th>Variable</th>");
    expect(html).toContain("<th>Axis</th><th>Value</th>");
    expect(html).toContain("<th>Source</th><th>Target</th><th>Value</th>");
  });

  it("renders accessible hierarchy and network tables", () => {
    const root = { label: "App", children: [{ label: "Core", value: 4 }] };
    const html = [
      hierarchy({ root }),
      network({
        nodes: [{ id: "a" }, { id: "b" }],
        edges: [{ source: "a", target: "b" }],
      }),
      partition({ root }),
    ]
      .map((chart) => renderHtml(layout(chart)))
      .join("\n");

    expect(html).toContain("<th>Parent</th><th>Depth</th><th>Value</th>");
    expect(html).toContain("<th>Source</th><th>Target</th><th>Value</th>");
  });

  it("renders heatmap matrices as complete accessible tables", () => {
    const html = renderHtml(
      layout(
        heatmap({
          columns: ["Mon", "Tue"],
          rows: [{ label: "API", values: [3, null] }],
        }),
      ),
    );

    expect(html).toContain("<th>Row</th><th>Mon</th><th>Tue</th>");
    expect(html).toContain('<th scope="row">API</th><td>3</td><td>—</td>');
  });

  it("renders column and status charts with their underlying data tables", () => {
    const columnHtml = renderHtml(
      layout(column({ data: [{ label: "Jan", value: 10 }] })),
    );
    const statusHtml = renderHtml(
      layout(
        statusGrid({
          columns: ["API"],
          rows: [{ label: "Prod", values: ["success"] }],
        }),
      ),
    );

    expect(columnHtml).toContain('<th scope="row">Jan</th><td>10</td>');
    expect(statusHtml).toContain('<th scope="row">Prod</th><td>success</td>');
  });
});
