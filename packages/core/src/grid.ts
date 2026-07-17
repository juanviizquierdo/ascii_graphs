import stringWidth from "string-width";

import type {
  Cell,
  CellDatum,
  CellGrid,
  CellRole,
  CellStyle,
  DataTable,
} from "./types.js";

const segmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

function graphemes(value: string): string[] {
  if (segmenter === undefined) return Array.from(value);
  return Array.from(segmenter.segment(value), ({ segment }) => segment);
}

export function measureText(value: string): number {
  return stringWidth(value);
}

export function truncateText(
  value: string,
  width: number,
  suffix: string,
): string {
  if (width <= 0) return "";
  if (measureText(value) <= width) return value;

  const suffixWidth = measureText(suffix);
  if (suffixWidth >= width) {
    return graphemes(suffix).find((part) => measureText(part) <= width) ?? "";
  }

  let result = "";
  for (const part of graphemes(value)) {
    if (measureText(result + part) + suffixWidth > width) break;
    result += part;
  }
  return result + suffix;
}

function emptyCell(): Cell {
  return { glyph: " ", role: "empty" };
}

export class GridBuilder {
  readonly rows: Cell[][];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    if (width * height > 250_000) {
      throw new RangeError(
        `grid requires ${width * height} cells, exceeding the 250000 cell limit.`,
      );
    }
    this.rows = Array.from({ length: height }, () =>
      Array.from({ length: width }, emptyCell),
    );
  }

  set(
    x: number,
    y: number,
    glyph: string,
    role: CellRole,
    style?: CellStyle,
    datum?: CellDatum,
  ): void {
    const row = this.rows[y];
    if (row === undefined || x < 0 || x >= this.width) return;

    const cell: Cell = { glyph, role };
    if (style !== undefined) cell.style = style;
    if (datum !== undefined) cell.datum = datum;
    row[x] = cell;
  }

  text(
    x: number,
    y: number,
    value: string,
    role: CellRole,
    style?: CellStyle,
    datum?: CellDatum,
  ): void {
    let cursor = x;
    for (const part of graphemes(value)) {
      const width = measureText(part);
      if (width === 0) continue;
      if (cursor + width > this.width) break;
      this.set(cursor, y, part, role, style, datum);
      for (let offset = 1; offset < width; offset += 1) {
        this.set(cursor + offset, y, "", role, style, datum);
      }
      cursor += width;
    }
  }

  build(description: string, table: DataTable): CellGrid {
    return {
      width: this.width,
      height: this.height,
      rows: this.rows,
      description,
      table,
    };
  }
}
