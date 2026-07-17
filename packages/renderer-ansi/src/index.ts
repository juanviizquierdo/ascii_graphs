import type { Cell, CellGrid, CellStyle, ColorToken } from "@ascii-graphs/core";

export type AnsiColorLevel = 0 | 1 | 2 | 3;

export interface AnsiColor {
  ansi16: number;
  ansi256: number;
  rgb: readonly [red: number, green: number, blue: number];
}

export type AnsiTheme = Record<ColorToken, AnsiColor>;

export interface AnsiRenderOptions {
  colorLevel?: AnsiColorLevel;
  finalNewline?: boolean;
  theme?: Partial<AnsiTheme>;
}

export interface ColorEnvironment {
  isTTY: boolean;
  env?: Readonly<Record<string, string | undefined>>;
}

const ESCAPE = String.fromCharCode(27);
const RESET = `${ESCAPE}[0m`;
function hasTerminalControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
  });
}

const defaultTheme: AnsiTheme = {
  muted: { ansi16: 90, ansi256: 244, rgb: [113, 113, 122] },
  accent: { ansi16: 95, ansi256: 99, rgb: [109, 40, 217] },
  positive: { ansi16: 92, ansi256: 28, rgb: [21, 128, 61] },
  negative: { ansi16: 91, ansi256: 124, rgb: [185, 28, 28] },
  series1: { ansi16: 96, ansi256: 31, rgb: [3, 105, 161] },
  series2: { ansi16: 95, ansi256: 92, rgb: [126, 34, 206] },
  series3: { ansi16: 93, ansi256: 136, rgb: [161, 98, 7] },
  series4: { ansi16: 94, ansi256: 30, rgb: [15, 118, 110] },
};

function styleCode(
  style: CellStyle | undefined,
  level: AnsiColorLevel,
  theme: AnsiTheme,
): string {
  if (level === 0 || style === undefined) return "";
  const codes: number[] = [];
  if (style.bold === true) codes.push(1);
  if (style.foreground !== undefined) {
    const color = theme[style.foreground];
    if (level === 1) codes.push(color.ansi16);
    if (level === 2) codes.push(38, 5, color.ansi256);
    if (level === 3) codes.push(38, 2, ...color.rgb);
  }
  return codes.length === 0 ? "" : `${ESCAPE}[${codes.join(";")}m`;
}

function visibleCells(row: readonly Cell[]): readonly Cell[] {
  let end = row.length;
  while (end > 0 && /^\s*$/u.test(row[end - 1]?.glyph ?? "")) end -= 1;
  return row.slice(0, end);
}

function renderRow(
  row: readonly Cell[],
  level: AnsiColorLevel,
  theme: AnsiTheme,
): string {
  let result = "";
  let active = "";
  for (const cell of visibleCells(row)) {
    if (hasTerminalControl(cell.glyph)) {
      throw new TypeError(
        "cell glyphs cannot contain terminal control characters.",
      );
    }
    const next = styleCode(cell.style, level, theme);
    if (next !== active) {
      if (active !== "") result += RESET;
      if (next !== "") result += next;
      active = next;
    }
    result += cell.glyph;
  }
  if (active !== "") result += RESET;
  return result;
}

export function renderAnsi(
  grid: CellGrid,
  options: AnsiRenderOptions = {},
): string {
  const level = options.colorLevel ?? 3;
  if (![0, 1, 2, 3].includes(level)) {
    throw new RangeError("colorLevel must be 0, 1, 2, or 3.");
  }
  const theme: AnsiTheme = { ...defaultTheme, ...options.theme };
  const output = grid.rows
    .map((row) => renderRow(row, level, theme))
    .join("\n");
  return options.finalNewline === true ? `${output}\n` : output;
}

function forcedLevel(value: string | undefined): AnsiColorLevel | undefined {
  if (value === undefined) return undefined;
  if (value === "0" || value.toLowerCase() === "false") return 0;
  if (value === "2") return 2;
  if (value === "3") return 3;
  return 1;
}

export function detectColorLevel({
  isTTY,
  env = {},
}: ColorEnvironment): AnsiColorLevel {
  const forced = forcedLevel(env.FORCE_COLOR);
  if (forced !== undefined) return forced;
  if (env.NO_COLOR !== undefined || !isTTY || env.TERM === "dumb") return 0;
  if (env.COLORTERM?.toLowerCase().includes("truecolor") === true) return 3;
  if (env.TERM?.toLowerCase().includes("256color") === true) return 2;
  return 1;
}
