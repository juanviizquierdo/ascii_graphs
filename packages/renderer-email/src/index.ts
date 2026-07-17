import type { CellGrid } from "@ascii-graphs/core";
import {
  renderHtml,
  type HtmlRenderOptions,
} from "@ascii-graphs/renderer-html";
import {
  renderText,
  type TextRenderOptions,
} from "@ascii-graphs/renderer-text";

export interface EmailRenderOptions {
  text?: TextRenderOptions;
  html?: Omit<HtmlRenderOptions, "email">;
}

export interface EmailParts {
  readonly text: string;
  readonly html: string;
}

export function renderEmailParts(
  grid: CellGrid,
  options: EmailRenderOptions = {},
): EmailParts {
  return Object.freeze({
    text: renderText(grid, options.text),
    html: renderHtml(grid, { ...options.html, email: true }),
  });
}
