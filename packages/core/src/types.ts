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

export type Chart = BarChart | SparklineChart;
export type ChartType = Chart["type"];

export interface LayoutOptions {
  width?: number;
  height?: number;
  charset?: CharacterSet;
}
