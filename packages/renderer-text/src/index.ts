import type { CellGrid } from "@ascii-graphs/core";

export interface TextRenderOptions {
  finalNewline?: boolean;
  trimTrailingWhitespace?: boolean;
}

export function renderText(
  grid: CellGrid,
  options: TextRenderOptions = {},
): string {
  const trim = options.trimTrailingWhitespace ?? true;
  const lines = grid.rows.map((row) => {
    const line = row.map(({ glyph }) => glyph).join("");
    return trim ? line.replace(/\s+$/u, "") : line;
  });
  const output = lines.join("\n");
  return options.finalNewline === true ? `${output}\n` : output;
}
