import type { CharacterSet } from "./types.js";

export interface CharacterPalette {
  fill: string;
  baseline: string;
  horizontalAxis: string;
  ellipsis: string;
  missing: string;
  emptyFill: string;
  target: string;
  density: readonly string[];
}

const palettes: Record<CharacterSet, CharacterPalette> = {
  ascii: {
    fill: "#",
    baseline: "|",
    horizontalAxis: "-",
    ellipsis: "...",
    missing: "?",
    emptyFill: ".",
    target: "|",
    density: [".", ":", "-", "=", "+", "*", "#", "@"],
  },
  unicode: {
    fill: "█",
    baseline: "│",
    horizontalAxis: "─",
    ellipsis: "…",
    missing: "·",
    emptyFill: "░",
    target: "│",
    density: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"],
  },
};

export function getPalette(charset: CharacterSet): CharacterPalette {
  const palette = palettes[charset];
  if (palette === undefined) {
    throw new TypeError('charset must be either "ascii" or "unicode".');
  }
  return palette;
}
