export type CharacterSet = "ascii" | "unicode";

export type ColorToken =
  | "muted"
  | "accent"
  | "positive"
  | "negative"
  | "series1"
  | "series2"
  | "series3"
  | "series4";

export type CellRole =
  | "empty"
  | "title"
  | "label"
  | "axis"
  | "positive"
  | "negative"
  | "series"
  | "missing"
  | "value";

export interface CellStyle {
  foreground?: ColorToken;
  bold?: boolean;
}

export interface CellDatum {
  label: string;
  value: number;
}

export interface Cell {
  glyph: string;
  role: CellRole;
  style?: CellStyle;
  datum?: CellDatum;
}

export interface DataTableColumn {
  key: string;
  label: string;
}

export type DataTableValue = string | number | null;
export type DataTableRow = Record<string, DataTableValue>;

export interface DataTable {
  caption: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
}

export interface CellGrid {
  width: number;
  height: number;
  rows: Cell[][];
  description: string;
  table: DataTable;
}

export interface BarDatum {
  label: string;
  value: number;
}

export interface ChartBase {
  title?: string;
  width?: number;
  height?: number;
  description?: string;
}

export type LegendPosition = "inside" | "left" | "right" | "top" | "bottom";

export interface LegendOptions {
  position?: LegendPosition;
  color?: ColorToken;
}

export interface BarChartInput extends ChartBase {
  data: readonly BarDatum[];
  showValues?: boolean;
}

export interface BarChart extends ChartBase {
  readonly type: "bar";
  readonly data: readonly BarDatum[];
  readonly showValues: boolean;
}

export interface SparklineChartInput extends ChartBase {
  values: readonly (number | null)[];
  label?: string;
  min?: number;
  max?: number;
}

export interface SparklineChart extends ChartBase {
  readonly type: "sparkline";
  readonly values: readonly (number | null)[];
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
}

export interface LineChartInput extends ChartBase {
  values: readonly (number | null)[];
  label?: string;
  min?: number;
  max?: number;
}

export interface LineChart extends ChartBase {
  readonly type: "line";
  readonly values: readonly (number | null)[];
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
}

export interface ScatterDatumInput {
  x: number;
  y: number;
  label?: string;
}

export interface ScatterDatum {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
}

export interface ScatterChartInput extends ChartBase {
  data: readonly ScatterDatumInput[];
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export interface ScatterChart extends ChartBase {
  readonly type: "scatter";
  readonly data: readonly ScatterDatum[];
  readonly xMin?: number;
  readonly xMax?: number;
  readonly yMin?: number;
  readonly yMax?: number;
}

export interface HistogramChartInput extends ChartBase {
  values: readonly number[];
  bins?: number;
}

export interface HistogramChart extends ChartBase {
  readonly type: "histogram";
  readonly values: readonly number[];
  readonly bins?: number;
}

export interface AreaChartInput extends ChartBase {
  values: readonly (number | null)[];
  label?: string;
  min?: number;
  max?: number;
}

export interface AreaChart extends ChartBase {
  readonly type: "area";
  readonly values: readonly (number | null)[];
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
}

export interface BoxPlotDatumInput {
  label: string;
  values: readonly number[];
}

export interface BoxPlotDatum {
  readonly label: string;
  readonly values: readonly number[];
}

export interface BoxPlotChartInput extends ChartBase {
  data: readonly BoxPlotDatumInput[];
}

export interface BoxPlotChart extends ChartBase {
  readonly type: "boxplot";
  readonly data: readonly BoxPlotDatum[];
}

export interface StackedBarRowInput {
  label: string;
  values: readonly number[];
}

export interface StackedBarRow {
  readonly label: string;
  readonly values: readonly number[];
}

export interface StackedBarChartInput extends ChartBase {
  series: readonly string[];
  rows: readonly StackedBarRowInput[];
  showLegend?: boolean;
}

export interface StackedBarChart extends ChartBase {
  readonly type: "stacked-bar";
  readonly series: readonly string[];
  readonly rows: readonly StackedBarRow[];
  readonly showLegend: boolean;
}

export interface DonutChartInput extends ChartBase {
  data: readonly BarDatum[];
  showLegend?: boolean;
  style?: "donut" | "pie";
}

export interface DonutChart extends ChartBase {
  readonly type: "donut";
  readonly data: readonly BarDatum[];
  readonly showLegend: boolean;
  readonly style: "donut" | "pie";
}

export interface GroupedBarChartInput extends ChartBase {
  series: readonly string[];
  rows: readonly StackedBarRowInput[];
  showLegend?: boolean;
}

export interface GroupedBarChart extends ChartBase {
  readonly type: "grouped-bar";
  readonly series: readonly string[];
  readonly rows: readonly StackedBarRow[];
  readonly showLegend: boolean;
}

export interface WaterfallChartInput extends ChartBase {
  data: readonly BarDatum[];
  initial?: number;
  showTotal?: boolean;
}

export interface WaterfallChart extends ChartBase {
  readonly type: "waterfall";
  readonly data: readonly BarDatum[];
  readonly initial: number;
  readonly showTotal: boolean;
}

export interface BulletDatumInput {
  label: string;
  value: number;
  target: number;
  min?: number;
  max?: number;
  ranges?: readonly number[];
}

export interface BulletDatum {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly min: number;
  readonly max: number;
  readonly ranges: readonly number[];
}

export interface BulletChartInput extends ChartBase {
  data: readonly BulletDatumInput[];
}

export interface BulletChart extends ChartBase {
  readonly type: "bullet";
  readonly data: readonly BulletDatum[];
}

export interface CandlestickDatumInput {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickDatum {
  readonly label: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface CandlestickChartInput extends ChartBase {
  data: readonly CandlestickDatumInput[];
}

export interface CandlestickChart extends ChartBase {
  readonly type: "candlestick";
  readonly data: readonly CandlestickDatum[];
}

export interface GanttTaskInput {
  label: string;
  start: number;
  end: number;
  progress?: number;
}

export interface GanttTask {
  readonly label: string;
  readonly start: number;
  readonly end: number;
  readonly progress: number;
}

export interface GanttChartInput extends ChartBase {
  tasks: readonly GanttTaskInput[];
  min?: number;
  max?: number;
}

export interface GanttChart extends ChartBase {
  readonly type: "gantt";
  readonly tasks: readonly GanttTask[];
  readonly min?: number;
  readonly max?: number;
}

export interface SeriesValuesInput {
  label: string;
  values: readonly (number | null)[];
}

export interface SeriesValues {
  readonly label: string;
  readonly values: readonly (number | null)[];
}

export interface MultiLineChartInput extends ChartBase {
  series: readonly SeriesValuesInput[];
  min?: number;
  max?: number;
  showLegend?: boolean;
  legend?: LegendOptions;
}

export interface MultiLineChart extends ChartBase {
  readonly type: "multi-line";
  readonly series: readonly SeriesValues[];
  readonly min?: number;
  readonly max?: number;
  readonly showLegend: boolean;
  readonly legend: Readonly<Required<LegendOptions>>;
}

export interface StackedAreaChartInput extends ChartBase {
  series: readonly SeriesValuesInput[];
  showLegend?: boolean;
}

export interface StackedAreaChart extends ChartBase {
  readonly type: "stacked-area";
  readonly series: readonly SeriesValues[];
  readonly showLegend: boolean;
}

export interface RangeDatumInput {
  label: string;
  start: number;
  end: number;
}

export interface RangeDatum {
  readonly label: string;
  readonly start: number;
  readonly end: number;
}

export interface RangeChartInput extends ChartBase {
  data: readonly RangeDatumInput[];
  style?: "bar" | "dumbbell";
}

export interface RangeChart extends ChartBase {
  readonly type: "range";
  readonly data: readonly RangeDatum[];
  readonly style: "bar" | "dumbbell";
}

export interface LollipopChartInput extends ChartBase {
  data: readonly BarDatum[];
}

export interface LollipopChart extends ChartBase {
  readonly type: "lollipop";
  readonly data: readonly BarDatum[];
}

export interface StepChartInput extends ChartBase {
  values: readonly (number | null)[];
  label?: string;
  min?: number;
  max?: number;
}

export interface StepChart extends ChartBase {
  readonly type: "step";
  readonly values: readonly (number | null)[];
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
}

export interface IntervalDatumInput {
  label: string;
  value: number;
  low: number;
  high: number;
}

export interface IntervalDatum {
  readonly label: string;
  readonly value: number;
  readonly low: number;
  readonly high: number;
}

export interface IntervalChartInput extends ChartBase {
  data: readonly IntervalDatumInput[];
}

export interface IntervalChart extends ChartBase {
  readonly type: "interval";
  readonly data: readonly IntervalDatum[];
}

export type DistributionMode =
  "density" | "violin" | "strip" | "beeswarm" | "ecdf" | "qq";

export interface DistributionChartInput extends ChartBase {
  values: readonly number[];
  mode: DistributionMode;
  label?: string;
}

export interface DistributionChart extends ChartBase {
  readonly type: "distribution";
  readonly values: readonly number[];
  readonly mode: DistributionMode;
  readonly label?: string;
}

export interface LikertChartInput extends ChartBase {
  series: readonly string[];
  rows: readonly StackedBarRowInput[];
  showLegend?: boolean;
}

export interface LikertChart extends ChartBase {
  readonly type: "likert";
  readonly series: readonly string[];
  readonly rows: readonly StackedBarRow[];
  readonly showLegend: boolean;
}

export interface TreemapChartInput extends ChartBase {
  data: readonly BarDatum[];
}

export interface TreemapChart extends ChartBase {
  readonly type: "treemap";
  readonly data: readonly BarDatum[];
}

export interface WaffleChartInput extends ChartBase {
  data: readonly BarDatum[];
  cells?: number;
  showLegend?: boolean;
}

export interface WaffleChart extends ChartBase {
  readonly type: "waffle";
  readonly data: readonly BarDatum[];
  readonly cells: number;
  readonly showLegend: boolean;
}

export type FunnelMode = "funnel" | "pyramid";

export interface FunnelChartInput extends ChartBase {
  data: readonly BarDatum[];
  mode?: FunnelMode;
  legend?: LegendOptions;
}

export interface FunnelChart extends ChartBase {
  readonly type: "funnel";
  readonly data: readonly BarDatum[];
  readonly mode: FunnelMode;
  readonly legend: Readonly<Required<LegendOptions>>;
}

export interface ParetoChartInput extends ChartBase {
  data: readonly BarDatum[];
}

export interface ParetoChart extends ChartBase {
  readonly type: "pareto";
  readonly data: readonly BarDatum[];
}

export interface CalendarDatumInput {
  date: string;
  value: number | null;
}

export interface CalendarDatum {
  readonly date: string;
  readonly value: number | null;
}

export interface CalendarHeatmapChartInput extends ChartBase {
  data: readonly CalendarDatumInput[];
  min?: number;
  max?: number;
}

export interface CalendarHeatmapChart extends ChartBase {
  readonly type: "calendar-heatmap";
  readonly data: readonly CalendarDatum[];
  readonly min?: number;
  readonly max?: number;
}

export interface HorizonChartInput extends ChartBase {
  values: readonly (number | null)[];
  bands?: number;
  label?: string;
}

export interface HorizonChart extends ChartBase {
  readonly type: "horizon";
  readonly values: readonly (number | null)[];
  readonly bands: number;
  readonly label?: string;
}

export interface TimelineDatumInput {
  label: string;
  start: number;
  end?: number;
}

export interface TimelineDatum {
  readonly label: string;
  readonly start: number;
  readonly end: number;
}

export interface TimelineChartInput extends ChartBase {
  data: readonly TimelineDatumInput[];
  min?: number;
  max?: number;
}

export interface TimelineChart extends ChartBase {
  readonly type: "timeline";
  readonly data: readonly TimelineDatum[];
  readonly min?: number;
  readonly max?: number;
}

export interface BubbleDatumInput {
  label: string;
  x: number;
  y: number;
  size: number;
}

export interface BubbleDatum {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

export interface BubbleChartInput extends ChartBase {
  data: readonly BubbleDatumInput[];
}

export interface BubbleChart extends ChartBase {
  readonly type: "bubble";
  readonly data: readonly BubbleDatum[];
}

export interface ConnectedScatterChartInput extends ChartBase {
  data: readonly ScatterDatumInput[];
}

export interface ConnectedScatterChart extends ChartBase {
  readonly type: "connected-scatter";
  readonly data: readonly ScatterDatum[];
}

export interface CorrelationMatrixChartInput extends ChartBase {
  labels: readonly string[];
  values: readonly (readonly number[])[];
}

export interface CorrelationMatrixChart extends ChartBase {
  readonly type: "correlation-matrix";
  readonly labels: readonly string[];
  readonly values: readonly (readonly number[])[];
}

export interface RadarChartInput extends ChartBase {
  axes: readonly string[];
  values: readonly number[];
  max?: number;
}

export interface RadarChart extends ChartBase {
  readonly type: "radar";
  readonly axes: readonly string[];
  readonly values: readonly number[];
  readonly max: number;
}

export interface ParallelSeriesInput {
  label: string;
  values: readonly number[];
}

export interface ParallelSeries {
  readonly label: string;
  readonly values: readonly number[];
}

export interface ParallelCoordinatesChartInput extends ChartBase {
  axes: readonly string[];
  series: readonly ParallelSeriesInput[];
}

export interface ParallelCoordinatesChart extends ChartBase {
  readonly type: "parallel-coordinates";
  readonly axes: readonly string[];
  readonly series: readonly ParallelSeries[];
}

export interface FlowLinkInput {
  source: string;
  target: string;
  value: number;
}

export interface FlowLink {
  readonly source: string;
  readonly target: string;
  readonly value: number;
}

export type FlowMode = "sankey" | "alluvial";

export interface FlowChartInput extends ChartBase {
  links: readonly FlowLinkInput[];
  mode?: FlowMode;
}

export interface FlowChart extends ChartBase {
  readonly type: "flow";
  readonly links: readonly FlowLink[];
  readonly mode: FlowMode;
}

export interface HierarchyNodeInput {
  label: string;
  value?: number;
  children?: readonly HierarchyNodeInput[];
}

export interface HierarchyNode {
  readonly label: string;
  readonly value?: number;
  readonly children: readonly HierarchyNode[];
}

export type HierarchyMode = "tree" | "org" | "dependency";

export interface HierarchyChartInput extends ChartBase {
  root: HierarchyNodeInput;
  mode?: HierarchyMode;
}

export interface HierarchyChart extends ChartBase {
  readonly type: "hierarchy";
  readonly root: HierarchyNode;
  readonly mode: HierarchyMode;
}

export interface NetworkNodeInput {
  id: string;
  label?: string;
}

export interface NetworkNode {
  readonly id: string;
  readonly label: string;
}

export interface NetworkEdgeInput {
  source: string;
  target: string;
  value?: number;
}

export interface NetworkEdge {
  readonly source: string;
  readonly target: string;
  readonly value: number;
}

export interface NetworkChartInput extends ChartBase {
  nodes: readonly NetworkNodeInput[];
  edges: readonly NetworkEdgeInput[];
}

export interface NetworkChart extends ChartBase {
  readonly type: "network";
  readonly nodes: readonly NetworkNode[];
  readonly edges: readonly NetworkEdge[];
}

export type PartitionMode = "flame" | "sunburst";

export interface PartitionChartInput extends ChartBase {
  root: HierarchyNodeInput;
  mode?: PartitionMode;
}

export interface PartitionChart extends ChartBase {
  readonly type: "partition";
  readonly root: HierarchyNode;
  readonly mode: PartitionMode;
}

export interface ProgressDatumInput {
  label: string;
  value: number;
  min?: number;
  max?: number;
  target?: number;
}

export interface ProgressDatum {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly target?: number;
}

export interface ProgressChartInput extends ChartBase {
  data: readonly ProgressDatumInput[];
  showPercentage?: boolean;
  clamp?: boolean;
}

export interface ProgressChart extends ChartBase {
  readonly type: "progress";
  readonly data: readonly ProgressDatum[];
  readonly showPercentage: boolean;
  readonly clamp: boolean;
}

export interface HeatmapRowInput {
  label: string;
  values: readonly (number | null)[];
}

export interface HeatmapRow {
  readonly label: string;
  readonly values: readonly (number | null)[];
}

export interface HeatmapChartInput extends ChartBase {
  columns: readonly string[];
  rows: readonly HeatmapRowInput[];
  min?: number;
  max?: number;
  showLegend?: boolean;
}

export interface HeatmapChart extends ChartBase {
  readonly type: "heatmap";
  readonly columns: readonly string[];
  readonly rows: readonly HeatmapRow[];
  readonly min?: number;
  readonly max?: number;
  readonly showLegend: boolean;
}

export interface ColumnChartInput extends ChartBase {
  data: readonly BarDatum[];
}

export interface ColumnChart extends ChartBase {
  readonly type: "column";
  readonly data: readonly BarDatum[];
}

export type StatusValue = "success" | "warning" | "failure" | "unknown";

export interface StatusRowInput {
  label: string;
  values: readonly StatusValue[];
}

export interface StatusRow {
  readonly label: string;
  readonly values: readonly StatusValue[];
}

export interface StatusChartInput extends ChartBase {
  columns: readonly string[];
  rows: readonly StatusRowInput[];
  showLegend?: boolean;
}

export interface StatusChart extends ChartBase {
  readonly type: "status";
  readonly columns: readonly string[];
  readonly rows: readonly StatusRow[];
  readonly showLegend: boolean;
}

export interface RidgelineSeriesInput {
  label: string;
  values: readonly number[];
}

export interface RidgelineSeries {
  readonly label: string;
  readonly values: readonly number[];
}

export interface RidgelineChartInput extends ChartBase {
  series: readonly RidgelineSeriesInput[];
}

export interface RidgelineChart extends ChartBase {
  readonly type: "ridgeline";
  readonly series: readonly RidgelineSeries[];
}

export interface HexbinDatumInput {
  x: number;
  y: number;
  label?: string;
}

export interface HexbinDatum {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
}

export interface HexbinChartInput extends ChartBase {
  data: readonly HexbinDatumInput[];
  bins?: number;
}

export interface HexbinChart extends ChartBase {
  readonly type: "hexbin";
  readonly data: readonly HexbinDatum[];
  readonly bins: number;
}

export interface ControlChartInput extends ChartBase {
  values: readonly number[];
  labels?: readonly string[];
  center?: number;
  upperLimit?: number;
  lowerLimit?: number;
}

export interface ControlChart extends ChartBase {
  readonly type: "control";
  readonly values: readonly number[];
  readonly labels: readonly string[];
  readonly center: number;
  readonly upperLimit: number;
  readonly lowerLimit: number;
}

export interface MosaicChartInput extends ChartBase {
  series: readonly string[];
  rows: readonly StackedBarRowInput[];
  showLegend?: boolean;
}

export interface MosaicChart extends ChartBase {
  readonly type: "mosaic";
  readonly series: readonly string[];
  readonly rows: readonly StackedBarRow[];
  readonly showLegend: boolean;
}

export interface ChordChartInput extends ChartBase {
  labels: readonly string[];
  values: readonly (readonly number[])[];
}

export interface ChordChart extends ChartBase {
  readonly type: "chord";
  readonly labels: readonly string[];
  readonly values: readonly (readonly number[])[];
}

export interface GaugeChartInput extends ChartBase {
  value: number;
  label?: string;
  min?: number;
  max?: number;
}

export interface GaugeChart extends ChartBase {
  readonly type: "gauge";
  readonly value: number;
  readonly label?: string;
  readonly min: number;
  readonly max: number;
}

export interface ThemeRiverChartInput extends ChartBase {
  series: readonly SeriesValuesInput[];
  showLegend?: boolean;
}

export interface ThemeRiverChart extends ChartBase {
  readonly type: "theme-river";
  readonly series: readonly SeriesValues[];
  readonly showLegend: boolean;
}

export interface PictorialBarChartInput extends ChartBase {
  data: readonly BarDatum[];
  symbol?: string;
  showValues?: boolean;
}

export interface PictorialBarChart extends ChartBase {
  readonly type: "pictorial-bar";
  readonly data: readonly BarDatum[];
  readonly symbol: string;
  readonly showValues: boolean;
}

export interface MapRegionInput {
  id: string;
  label: string;
  value: number;
}

export interface MapRegion {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

export interface ChoroplethMapChartInput extends ChartBase {
  shape: readonly string[];
  regions: readonly MapRegionInput[];
  showLegend?: boolean;
}

export interface ChoroplethMapChart extends ChartBase {
  readonly type: "choropleth-map";
  readonly shape: readonly string[];
  readonly regions: readonly MapRegion[];
  readonly showLegend: boolean;
}

export type CountryMapName =
  | "spain"
  | "france"
  | "germany"
  | "italy"
  | "united-kingdom"
  | "united-states"
  | "japan"
  | "australia";

export interface CountryMapDatumInput {
  country: CountryMapName;
  value: number;
  label?: string;
}

export interface CountryMapDatum {
  readonly country: CountryMapName;
  readonly value: number;
  readonly label?: string;
}

export interface CountryMapChartInput extends ChartBase {
  data: readonly CountryMapDatumInput[];
  showValues?: boolean;
}

export interface CountryMapChart extends ChartBase {
  readonly type: "country-map";
  readonly data: readonly CountryMapDatum[];
  readonly showValues: boolean;
}

export type ContinentMapName =
  "europe" | "africa" | "asia" | "north-america" | "south-america" | "oceania";

export interface ContinentCountryDatumInput {
  country: string;
  value: number;
  label?: string;
}

export interface ContinentCountryDatum {
  readonly country: string;
  readonly value: number;
  readonly label?: string;
}

export interface ContinentMapChartInput extends ChartBase {
  continent: ContinentMapName;
  data: readonly ContinentCountryDatumInput[];
  showLegend?: boolean;
}

export interface ContinentMapChart extends ChartBase {
  readonly type: "continent-map";
  readonly continent: ContinentMapName;
  readonly data: readonly ContinentCountryDatum[];
  readonly showLegend: boolean;
}

export interface RoutePointInput {
  x: number;
  y: number;
  label?: string;
}

export interface RoutePoint {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
}

export interface RouteInput {
  from: RoutePointInput;
  to: RoutePointInput;
  value?: number;
}

export interface Route {
  readonly from: RoutePoint;
  readonly to: RoutePoint;
  readonly value: number;
}

export interface RouteMapChartInput extends ChartBase {
  routes: readonly RouteInput[];
}

export interface RouteMapChart extends ChartBase {
  readonly type: "route-map";
  readonly routes: readonly Route[];
}

export interface CreativeSeriesInput {
  label: string;
  values: readonly number[];
}

export interface CreativeSeries {
  readonly label: string;
  readonly values: readonly number[];
}

export interface CreativePointInput {
  x: number;
  y: number;
  value?: number;
  label?: string;
}

export interface CreativePoint {
  readonly x: number;
  readonly y: number;
  readonly value?: number;
  readonly label?: string;
}

export interface CreativeEdgeInput {
  from: number;
  to: number;
  value?: number;
}

export interface CreativeEdge {
  readonly from: number;
  readonly to: number;
  readonly value: number;
}

export interface BumpChartInput extends ChartBase {
  labels: readonly string[];
  series: readonly CreativeSeriesInput[];
}
export interface BumpChart extends ChartBase {
  readonly type: "bump";
  readonly labels: readonly string[];
  readonly series: readonly CreativeSeries[];
}

export interface FanChartInput extends ChartBase {
  labels: readonly string[];
  median: readonly number[];
  lower: readonly number[];
  upper: readonly number[];
}
export interface FanChart extends ChartBase {
  readonly type: "fan";
  readonly labels: readonly string[];
  readonly median: readonly number[];
  readonly lower: readonly number[];
  readonly upper: readonly number[];
}

export interface RaincloudChartInput extends ChartBase {
  series: readonly CreativeSeriesInput[];
}
export interface RaincloudChart extends ChartBase {
  readonly type: "raincloud";
  readonly series: readonly CreativeSeries[];
}

export interface UpSetIntersectionInput {
  sets: readonly string[];
  value: number;
}
export interface UpSetIntersection {
  readonly sets: readonly string[];
  readonly value: number;
}
export interface UpSetChartInput extends ChartBase {
  sets: readonly string[];
  intersections: readonly UpSetIntersectionInput[];
}
export interface UpSetChart extends ChartBase {
  readonly type: "upset";
  readonly sets: readonly string[];
  readonly intersections: readonly UpSetIntersection[];
}

export interface PointFigureChartInput extends ChartBase {
  values: readonly number[];
  boxSize?: number;
}
export interface PointFigureChart extends ChartBase {
  readonly type: "point-figure";
  readonly values: readonly number[];
  readonly boxSize: number;
}

export interface WindRoseDatumInput {
  label: string;
  value: number;
}
export interface WindRoseDatum {
  readonly label: string;
  readonly value: number;
}
export interface WindRoseChartInput extends ChartBase {
  data: readonly WindRoseDatumInput[];
}
export interface WindRoseChart extends ChartBase {
  readonly type: "wind-rose";
  readonly data: readonly WindRoseDatum[];
}
export interface PolarAreaChartInput extends ChartBase {
  data: readonly WindRoseDatumInput[];
}
export interface PolarAreaChart extends ChartBase {
  readonly type: "polar-area";
  readonly data: readonly WindRoseDatum[];
}

export interface TernaryDatumInput {
  label?: string;
  a: number;
  b: number;
  c: number;
}
export interface TernaryDatum {
  readonly label?: string;
  readonly a: number;
  readonly b: number;
  readonly c: number;
}
export interface TernaryChartInput extends ChartBase {
  labels?: readonly [string, string, string];
  data: readonly TernaryDatumInput[];
}
export interface TernaryChart extends ChartBase {
  readonly type: "ternary";
  readonly labels: readonly [string, string, string];
  readonly data: readonly TernaryDatum[];
}

export interface ContourChartInput extends ChartBase {
  data: readonly CreativePointInput[];
}
export interface ContourChart extends ChartBase {
  readonly type: "contour";
  readonly data: readonly CreativePoint[];
}

export interface AdjacencyMatrixChartInput extends ChartBase {
  labels: readonly string[];
  values: readonly (readonly number[])[];
}
export interface AdjacencyMatrixChart extends ChartBase {
  readonly type: "adjacency-matrix";
  readonly labels: readonly string[];
  readonly values: readonly (readonly number[])[];
}

export interface ArcDiagramChartInput extends ChartBase {
  labels: readonly string[];
  edges: readonly CreativeEdgeInput[];
}
export interface ArcDiagramChart extends ChartBase {
  readonly type: "arc-diagram";
  readonly labels: readonly string[];
  readonly edges: readonly CreativeEdge[];
}

export interface ProbabilityPointInput {
  x: number;
  probability: number;
}
export interface ProbabilityPoint {
  readonly x: number;
  readonly probability: number;
}
export interface ProbabilitySeriesInput {
  label: string;
  points: readonly ProbabilityPointInput[];
}
export interface ProbabilitySeries {
  readonly label: string;
  readonly points: readonly ProbabilityPoint[];
}
export interface SurvivalChartInput extends ChartBase {
  series: readonly ProbabilitySeriesInput[];
}
export interface SurvivalChart extends ChartBase {
  readonly type: "survival";
  readonly series: readonly ProbabilitySeries[];
}
export interface RocChartInput extends ChartBase {
  mode?: "roc" | "precision-recall";
  series: readonly ProbabilitySeriesInput[];
}
export interface RocChart extends ChartBase {
  readonly type: "roc";
  readonly mode: "roc" | "precision-recall";
  readonly series: readonly ProbabilitySeries[];
}

export interface CalibrationDatumInput {
  predicted: number;
  observed: number;
  label?: string;
}
export interface CalibrationDatum {
  readonly predicted: number;
  readonly observed: number;
  readonly label?: string;
}
export interface CalibrationChartInput extends ChartBase {
  data: readonly CalibrationDatumInput[];
}
export interface CalibrationChart extends ChartBase {
  readonly type: "calibration";
  readonly data: readonly CalibrationDatum[];
}

export interface ErrorBudgetChartInput extends ChartBase {
  labels: readonly string[];
  remaining: readonly number[];
}
export interface ErrorBudgetChart extends ChartBase {
  readonly type: "error-budget";
  readonly labels: readonly string[];
  readonly remaining: readonly number[];
}

export interface CumulativeFlowChartInput extends ChartBase {
  labels: readonly string[];
  stages: readonly CreativeSeriesInput[];
}
export interface CumulativeFlowChart extends ChartBase {
  readonly type: "cumulative-flow";
  readonly labels: readonly string[];
  readonly stages: readonly CreativeSeries[];
}

export interface BurnChartInput extends ChartBase {
  labels: readonly string[];
  actual: readonly number[];
  ideal?: readonly number[];
  mode?: "down" | "up";
}
export interface BurnChart extends ChartBase {
  readonly type: "burn";
  readonly labels: readonly string[];
  readonly actual: readonly number[];
  readonly ideal: readonly number[];
  readonly mode: "down" | "up";
}

export interface PriceLevelInput {
  price: number;
  value: number;
}
export interface PriceLevel {
  readonly price: number;
  readonly value: number;
}
export interface MarketProfileChartInput extends ChartBase {
  data: readonly PriceLevelInput[];
}
export interface MarketProfileChart extends ChartBase {
  readonly type: "market-profile";
  readonly data: readonly PriceLevel[];
}
export interface OrderBookChartInput extends ChartBase {
  bids: readonly PriceLevelInput[];
  asks: readonly PriceLevelInput[];
}
export interface OrderBookChart extends ChartBase {
  readonly type: "order-book";
  readonly bids: readonly PriceLevel[];
  readonly asks: readonly PriceLevel[];
}

export interface EventDatumInput {
  position: number;
  label?: string;
  value?: number;
}
export interface EventDatum {
  readonly position: number;
  readonly label?: string;
  readonly value: number;
}
export interface BarcodeChartInput extends ChartBase {
  events: readonly EventDatumInput[];
}
export interface BarcodeChart extends ChartBase {
  readonly type: "barcode";
  readonly events: readonly EventDatum[];
}
export interface SpiralTimelineChartInput extends ChartBase {
  events: readonly EventDatumInput[];
}
export interface SpiralTimelineChart extends ChartBase {
  readonly type: "spiral-timeline";
  readonly events: readonly EventDatum[];
}

export interface RegionValueInput {
  id: string;
  value: number;
  label?: string;
}
export interface RegionValue {
  readonly id: string;
  readonly value: number;
  readonly label?: string;
}
export interface WorldChoroplethChartInput extends ChartBase {
  data: readonly RegionValueInput[];
}
export interface WorldChoroplethChart extends ChartBase {
  readonly type: "world-choropleth";
  readonly data: readonly RegionValue[];
}
export interface MigrationFlowChartInput extends ChartBase {
  routes: readonly RouteInput[];
}
export interface MigrationFlowChart extends ChartBase {
  readonly type: "migration-flow";
  readonly routes: readonly Route[];
}

export interface HexTileDatumInput {
  x: number;
  y: number;
  label: string;
  value: number;
}
export interface HexTileDatum {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly value: number;
}
export interface HexTileMapChartInput extends ChartBase {
  data: readonly HexTileDatumInput[];
}
export interface HexTileMapChart extends ChartBase {
  readonly type: "hex-tile-map";
  readonly data: readonly HexTileDatum[];
}
export interface DotDensityMapChartInput extends ChartBase {
  shape: readonly string[];
  regions: readonly MapRegionInput[];
  dotsPerUnit?: number;
}
export interface DotDensityMapChart extends ChartBase {
  readonly type: "dot-density-map";
  readonly shape: readonly string[];
  readonly regions: readonly MapRegion[];
  readonly dotsPerUnit: number;
}

export type NextChartType =
  | "streamgraph"
  | "hovmoller"
  | "sankey-timeline"
  | "slopegraph"
  | "marimekko-timeline"
  | "voronoi-map"
  | "small-multiples"
  | "clustered-dendrogram"
  | "heatmap-dendrogram"
  | "confusion-matrix"
  | "lift-gains"
  | "forest-plot"
  | "bland-altman"
  | "queue-timeline"
  | "critical-path"
  | "spectrogram"
  | "waveform"
  | "footprint"
  | "renko"
  | "kagi"
  | "cartogram"
  | "transit-map";

export interface NextDatumInput {
  label?: string;
  x?: number;
  y?: number;
  value?: number;
  low?: number;
  high?: number;
  start?: number;
  end?: number;
  group?: string;
}

export interface NextDatum {
  readonly label?: string;
  readonly x?: number;
  readonly y?: number;
  readonly value?: number;
  readonly low?: number;
  readonly high?: number;
  readonly start?: number;
  readonly end?: number;
  readonly group?: string;
}

export interface NextChartInput extends ChartBase {
  labels?: readonly string[];
  series?: readonly CreativeSeriesInput[];
  data?: readonly NextDatumInput[];
  values?: readonly number[];
  matrix?: readonly (readonly number[])[];
  edges?: readonly CreativeEdgeInput[];
  events?: readonly EventDatumInput[];
}

export interface NextChart extends ChartBase {
  readonly type: NextChartType;
  readonly labels: readonly string[];
  readonly series: readonly CreativeSeries[];
  readonly data: readonly NextDatum[];
  readonly values: readonly number[];
  readonly matrix: readonly (readonly number[])[];
  readonly edges: readonly CreativeEdge[];
  readonly events: readonly EventDatum[];
}

export type Chart =
  | BarChart
  | SparklineChart
  | LineChart
  | ScatterChart
  | HistogramChart
  | AreaChart
  | BoxPlotChart
  | StackedBarChart
  | DonutChart
  | GroupedBarChart
  | WaterfallChart
  | BulletChart
  | CandlestickChart
  | GanttChart
  | MultiLineChart
  | StackedAreaChart
  | RangeChart
  | LollipopChart
  | StepChart
  | IntervalChart
  | DistributionChart
  | LikertChart
  | TreemapChart
  | WaffleChart
  | FunnelChart
  | ParetoChart
  | CalendarHeatmapChart
  | HorizonChart
  | TimelineChart
  | BubbleChart
  | ConnectedScatterChart
  | CorrelationMatrixChart
  | RadarChart
  | ParallelCoordinatesChart
  | FlowChart
  | HierarchyChart
  | NetworkChart
  | PartitionChart
  | ProgressChart
  | HeatmapChart
  | ColumnChart
  | StatusChart
  | RidgelineChart
  | HexbinChart
  | ControlChart
  | MosaicChart
  | ChordChart
  | GaugeChart
  | ThemeRiverChart
  | PictorialBarChart
  | ChoroplethMapChart
  | CountryMapChart
  | ContinentMapChart
  | RouteMapChart
  | BumpChart
  | FanChart
  | RaincloudChart
  | UpSetChart
  | PointFigureChart
  | WindRoseChart
  | PolarAreaChart
  | TernaryChart
  | ContourChart
  | AdjacencyMatrixChart
  | ArcDiagramChart
  | SurvivalChart
  | RocChart
  | CalibrationChart
  | ErrorBudgetChart
  | CumulativeFlowChart
  | BurnChart
  | MarketProfileChart
  | OrderBookChart
  | BarcodeChart
  | SpiralTimelineChart
  | WorldChoroplethChart
  | MigrationFlowChart
  | HexTileMapChart
  | DotDensityMapChart
  | NextChart;
export type ChartType = Chart["type"];

export interface LayoutOptions {
  width?: number;
  height?: number;
  charset?: CharacterSet;
}
