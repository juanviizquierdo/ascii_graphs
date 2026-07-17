import type { CharacterSet } from "./types.js";

export interface CharacterPalette {
  fill: string;
  baseline: string;
  ellipsis: string;
  missing: string;
  density: readonly string[];
}

const palettes: Record<CharacterSet, CharacterPalette> = {
  ascii: {
    fill: "#",
    baseline: "|",
    ellipsis: "...",
    missing: "?",
    density: [".", ":", "-", "=", "+", "*", "#", "@"],
  },
  unicode: {
    fill: "█",
    baseline: "│",
    ellipsis: "…",
    missing: "·",
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
