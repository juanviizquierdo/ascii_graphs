import { layoutBar } from "./bar.js";
import { layoutArea } from "./area.js";
import { layoutBoxPlot } from "./boxplot.js";
import { layoutBullet } from "./bullet.js";
import { layoutCandlestick } from "./candlestick.js";
import { layoutColumn } from "./column.js";
import { layoutContinentMap } from "./continent-map.js";
import { layoutHeatmap } from "./heatmap.js";
import { layoutHistogram } from "./histogram.js";
import { layoutGantt } from "./gantt.js";
import { layoutGroupedBar } from "./grouped-bar.js";
import { layoutLine } from "./line.js";
import { layoutProgress } from "./progress.js";
import { layoutScatter } from "./scatter.js";
import { layoutSparkline } from "./sparkline.js";
import { layoutStatus } from "./status.js";
import { layoutStackedBar } from "./stacked-bar.js";
import { layoutDonut } from "./donut.js";
import { layoutWaterfall } from "./waterfall.js";
import {
  layoutFunnel,
  layoutLikert,
  layoutPareto,
  layoutTreemap,
  layoutWaffle,
} from "./composition.js";
import {
  layoutCalendarHeatmap,
  layoutHorizon,
  layoutTimeline,
} from "./time.js";
import {
  layoutBubble,
  layoutConnectedScatter,
  layoutCorrelationMatrix,
  layoutFlow,
  layoutParallelCoordinates,
  layoutRadar,
} from "./relationships.js";
import {
  layoutHierarchy,
  layoutNetwork,
  layoutPartition,
} from "./hierarchy.js";
import { layoutDistribution, layoutInterval } from "./statistical.js";
import {
  layoutLollipop,
  layoutMultiLine,
  layoutRange,
  layoutStackedArea,
  layoutStep,
} from "./trend-comparison.js";
import {
  layoutChord,
  layoutControl,
  layoutHexbin,
  layoutMosaic,
  layoutRidgeline,
} from "./advanced.js";
import {
  layoutChoroplethMap,
  layoutCountryMap,
  layoutGauge,
  layoutPictorialBar,
  layoutRouteMap,
  layoutThemeRiver,
} from "./echarts-inspired.js";
import {
  layoutAdjacencyMatrix,
  layoutArcDiagram,
  layoutBarcode,
  layoutBump,
  layoutBurn,
  layoutCalibration,
  layoutContour,
  layoutCumulativeFlow,
  layoutDotDensityMap,
  layoutErrorBudget,
  layoutFan,
  layoutHexTileMap,
  layoutMarketProfile,
  layoutMigrationFlow,
  layoutOrderBook,
  layoutPointFigure,
  layoutPolarArea,
  layoutRaincloud,
  layoutRoc,
  layoutSpiralTimeline,
  layoutSurvival,
  layoutTernary,
  layoutUpSet,
  layoutWindRose,
  layoutWorldChoropleth,
} from "./creative.js";
import { layoutNextChart } from "./next-wave.js";

import type { CellGrid, Chart, LayoutOptions } from "./types.js";

export function layout(chart: Chart, options: LayoutOptions = {}): CellGrid {
  switch (chart.type) {
    case "bar":
      return layoutBar(chart, options);
    case "sparkline":
      return layoutSparkline(chart, options);
    case "progress":
      return layoutProgress(chart, options);
    case "heatmap":
      return layoutHeatmap(chart, options);
    case "column":
      return layoutColumn(chart, options);
    case "status":
      return layoutStatus(chart, options);
    case "line":
      return layoutLine(chart, options);
    case "scatter":
      return layoutScatter(chart, options);
    case "histogram":
      return layoutHistogram(chart, options);
    case "area":
      return layoutArea(chart, options);
    case "boxplot":
      return layoutBoxPlot(chart, options);
    case "stacked-bar":
      return layoutStackedBar(chart, options);
    case "donut":
      return layoutDonut(chart, options);
    case "grouped-bar":
      return layoutGroupedBar(chart, options);
    case "waterfall":
      return layoutWaterfall(chart, options);
    case "bullet":
      return layoutBullet(chart, options);
    case "candlestick":
      return layoutCandlestick(chart, options);
    case "gantt":
      return layoutGantt(chart, options);
    case "multi-line":
      return layoutMultiLine(chart, options);
    case "stacked-area":
      return layoutStackedArea(chart, options);
    case "range":
      return layoutRange(chart, options);
    case "lollipop":
      return layoutLollipop(chart, options);
    case "step":
      return layoutStep(chart, options);
    case "interval":
      return layoutInterval(chart, options);
    case "distribution":
      return layoutDistribution(chart, options);
    case "likert":
      return layoutLikert(chart, options);
    case "treemap":
      return layoutTreemap(chart, options);
    case "waffle":
      return layoutWaffle(chart, options);
    case "funnel":
      return layoutFunnel(chart, options);
    case "pareto":
      return layoutPareto(chart, options);
    case "calendar-heatmap":
      return layoutCalendarHeatmap(chart, options);
    case "horizon":
      return layoutHorizon(chart, options);
    case "timeline":
      return layoutTimeline(chart, options);
    case "bubble":
      return layoutBubble(chart, options);
    case "connected-scatter":
      return layoutConnectedScatter(chart, options);
    case "correlation-matrix":
      return layoutCorrelationMatrix(chart, options);
    case "radar":
      return layoutRadar(chart, options);
    case "parallel-coordinates":
      return layoutParallelCoordinates(chart, options);
    case "flow":
      return layoutFlow(chart, options);
    case "hierarchy":
      return layoutHierarchy(chart, options);
    case "network":
      return layoutNetwork(chart, options);
    case "partition":
      return layoutPartition(chart, options);
    case "ridgeline":
      return layoutRidgeline(chart, options);
    case "hexbin":
      return layoutHexbin(chart, options);
    case "control":
      return layoutControl(chart, options);
    case "mosaic":
      return layoutMosaic(chart, options);
    case "chord":
      return layoutChord(chart, options);
    case "gauge":
      return layoutGauge(chart, options);
    case "theme-river":
      return layoutThemeRiver(chart, options);
    case "pictorial-bar":
      return layoutPictorialBar(chart, options);
    case "choropleth-map":
      return layoutChoroplethMap(chart, options);
    case "country-map":
      return layoutCountryMap(chart, options);
    case "continent-map":
      return layoutContinentMap(chart, options);
    case "route-map":
      return layoutRouteMap(chart, options);
    case "bump":
      return layoutBump(chart, options);
    case "fan":
      return layoutFan(chart, options);
    case "raincloud":
      return layoutRaincloud(chart, options);
    case "upset":
      return layoutUpSet(chart, options);
    case "point-figure":
      return layoutPointFigure(chart, options);
    case "wind-rose":
      return layoutWindRose(chart, options);
    case "polar-area":
      return layoutPolarArea(chart, options);
    case "ternary":
      return layoutTernary(chart, options);
    case "contour":
      return layoutContour(chart, options);
    case "adjacency-matrix":
      return layoutAdjacencyMatrix(chart, options);
    case "arc-diagram":
      return layoutArcDiagram(chart, options);
    case "survival":
      return layoutSurvival(chart, options);
    case "roc":
      return layoutRoc(chart, options);
    case "calibration":
      return layoutCalibration(chart, options);
    case "error-budget":
      return layoutErrorBudget(chart, options);
    case "cumulative-flow":
      return layoutCumulativeFlow(chart, options);
    case "burn":
      return layoutBurn(chart, options);
    case "market-profile":
      return layoutMarketProfile(chart, options);
    case "order-book":
      return layoutOrderBook(chart, options);
    case "barcode":
      return layoutBarcode(chart, options);
    case "spiral-timeline":
      return layoutSpiralTimeline(chart, options);
    case "world-choropleth":
      return layoutWorldChoropleth(chart, options);
    case "migration-flow":
      return layoutMigrationFlow(chart, options);
    case "hex-tile-map":
      return layoutHexTileMap(chart, options);
    case "dot-density-map":
      return layoutDotDensityMap(chart, options);
    case "streamgraph":
    case "hovmoller":
    case "sankey-timeline":
    case "slopegraph":
    case "marimekko-timeline":
    case "voronoi-map":
    case "small-multiples":
    case "clustered-dendrogram":
    case "heatmap-dendrogram":
    case "confusion-matrix":
    case "lift-gains":
    case "forest-plot":
    case "bland-altman":
    case "queue-timeline":
    case "critical-path":
    case "spectrogram":
    case "waveform":
    case "footprint":
    case "renko":
    case "kagi":
    case "cartogram":
    case "transit-map":
      return layoutNextChart(chart, options);
    default: {
      const unreachable: never = chart;
      throw new TypeError(
        `Unsupported chart type: ${String((unreachable as { type?: unknown }).type)}`,
      );
    }
  }
}
