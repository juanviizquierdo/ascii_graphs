import type {
  Cell,
  CellGrid,
  CellStyle,
  ColorToken,
  DataTableValue,
} from "@ascii-graphs/core";

export interface HtmlTheme extends Record<ColorToken, string> {
  foreground: string;
  background: string;
}

export interface HtmlRenderOptions {
  accessibility?: "description" | "table" | "both";
  email?: boolean;
  fontFamily?: string;
  theme?: Partial<HtmlTheme>;
}

const defaultTheme: HtmlTheme = {
  foreground: "#18181b",
  muted: "#71717a",
  accent: "#6d28d9",
  positive: "#15803d",
  negative: "#b91c1c",
  series1: "#0369a1",
  series2: "#7e22ce",
  series3: "#a16207",
  series4: "#0f766e",
  background: "transparent",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function styleFor(cellStyle: CellStyle | undefined, theme: HtmlTheme): string {
  if (cellStyle === undefined) return "";
  const declarations: string[] = [];
  if (cellStyle.foreground !== undefined) {
    declarations.push(`color:${theme[cellStyle.foreground]}`);
  }
  if (cellStyle.bold === true) declarations.push("font-weight:700");
  return declarations.join(";");
}

function renderRow(row: readonly Cell[], theme: HtmlTheme): string {
  let result = "";
  let pending = "";
  let pendingStyle = "";

  const flush = (): void => {
    if (pending === "") return;
    const escaped = escapeHtml(pending);
    result +=
      pendingStyle === ""
        ? escaped
        : `<span style="${pendingStyle}">${escaped}</span>`;
    pending = "";
  };

  let end = row.length;
  while (end > 0 && /^\s*$/u.test(row[end - 1]?.glyph ?? "")) end -= 1;

  for (const cell of row.slice(0, end)) {
    const nextStyle = styleFor(cell.style, theme);
    if (nextStyle !== pendingStyle) {
      flush();
      pendingStyle = nextStyle;
    }
    pending += cell.glyph;
  }
  flush();
  return result;
}

function renderTable(grid: CellGrid): string {
  const hidden = [
    "position:absolute",
    "width:1px",
    "height:1px",
    "padding:0",
    "margin:-1px",
    "overflow:hidden",
    "clip:rect(0,0,0,0)",
    "white-space:nowrap",
    "border:0",
  ].join(";");
  const formatCell = (value: DataTableValue | undefined): string =>
    value === null || value === undefined ? "—" : String(value);
  const header = grid.table.columns
    .map(({ label }) => `<th>${escapeHtml(label)}</th>`)
    .join("");
  const rows = grid.table.rows
    .map((row) => {
      const cells = grid.table.columns
        .map(({ key }, index) => {
          const tag = index === 0 ? 'th scope="row"' : "td";
          const close = index === 0 ? "th" : "td";
          return `<${tag}>${escapeHtml(formatCell(row[key]))}</${close}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table style="${hidden}"><caption>${escapeHtml(grid.table.caption)}</caption><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderHtml(
  grid: CellGrid,
  options: HtmlRenderOptions = {},
): string {
  const theme: HtmlTheme = { ...defaultTheme, ...options.theme };
  const accessibility = options.accessibility ?? "both";
  const fontFamily =
    options.fontFamily ??
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
  const preStyle = [
    "margin:0",
    "white-space:pre",
    "line-height:1.25",
    `font-family:${fontFamily}`,
    "font-variant-ligatures:none",
    `color:${theme.foreground}`,
    `background:${theme.background}`,
  ].join(";");
  const chart = grid.rows.map((row) => renderRow(row, theme)).join("\n");
  const hasTable = accessibility === "table" || accessibility === "both";
  const label =
    accessibility === "table"
      ? ""
      : ` aria-label="${escapeHtml(grid.description)}"`;
  const hidden = hasTable ? ' aria-hidden="true"' : "";
  const emailMarker =
    options.email === true ? ' data-ascii-graphs-email="true"' : "";
  const table = hasTable ? renderTable(grid) : "";
  return `<figure${label}${emailMarker} style="margin:0"><pre${hidden} style="${escapeHtml(preStyle)}">${chart}</pre>${table}</figure>`;
}
