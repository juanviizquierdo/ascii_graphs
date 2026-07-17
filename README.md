# ASCII Graphs

Portable, deterministic text charts for terminals, browsers, email reports,
logs, and documentation.

> **Project status:** early alpha. The package names and public API may change
> before the first public release.

ASCII Graphs separates chart layout from output formatting. A chart is laid out
once as a semantic grid of character cells, then rendered as plain text or safe,
accessible HTML.

```text
Monthly revenue

Jan │███████████████                    42
Feb │████████████████████████           68
Mar │██████████████████████████████████ 91
```

## Why this project?

Most text chart libraries are designed specifically for a terminal. ANSI color,
terminal capability detection, and chart layout become inseparable, making the
output difficult to reuse in a browser or email. ASCII Graphs keeps those layers
independent:

```text
validated chart → semantic CellGrid → text / ANSI / HTML / future renderers
```

The current alpha foundation includes:

- Horizontal bar charts with positive, negative, and zero values.
- Compact sparklines with missing-value and downsampling support.
- Multi-row progress and goal charts with custom ranges and target markers.
- Numeric heatmaps with missing cells, density legends, and matrix tables.
- Strict ASCII and richer Unicode character sets.
- Unicode display-column-aware label measurement and truncation.
- Plain-text output with no control sequences.
- Semantic ANSI color with 16-color, 256-color, and true-color output.
- Escaped HTML output with a screen-reader description and data table.
- Paired plain-text and HTML email parts generated from the same grid.
- No DOM, terminal, or filesystem dependency in the core package.

## Quick start

The packages have not been published yet. From this repository:

```sh
pnpm install
pnpm build
```

```ts
import { bar, layoutBar } from "@ascii-graphs/core";
import { renderText } from "@ascii-graphs/renderer-text";

const chart = bar({
  title: "Monthly revenue",
  data: [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 68 },
    { label: "Mar", value: 91 },
  ],
});

const grid = layoutBar(chart, { width: 42, charset: "unicode" });
console.log(renderText(grid));
```

The generic layout API works across chart types:

```ts
import { layout, sparkline } from "@ascii-graphs/core";
import { detectColorLevel, renderAnsi } from "@ascii-graphs/renderer-ansi";

const trend = layout(
  sparkline({
    label: "Latency",
    values: [18, 22, null, 19, 35, 27],
  }),
);

console.log(
  renderAnsi(trend, {
    colorLevel: detectColorLevel({
      isTTY: process.stdout.isTTY,
      env: process.env,
    }),
  }),
);
```

Render the same grid for a web page or HTML email:

```ts
import { renderHtml } from "@ascii-graphs/renderer-html";

const html = renderHtml(grid, {
  accessibility: "both",
  email: true,
});
```

For multipart email, generate both alternatives together:

```ts
import { layout, progress } from "@ascii-graphs/core";
import { renderEmailParts } from "@ascii-graphs/renderer-email";

const release = layout(
  progress({
    title: "Release status",
    data: [
      { label: "Build", value: 72, target: 80 },
      { label: "Deploy", value: 40 },
    ],
  }),
  { width: 42 },
);

const { text, html } = renderEmailParts(release);
```

Heatmaps use the same portable grid and automatically adapt cell width to the
available viewport:

```ts
import { heatmap, layout } from "@ascii-graphs/core";

const activity = layout(
  heatmap({
    title: "Activity",
    columns: ["Mon", "Tue", "Wed"],
    rows: [
      { label: "API", values: [0, 5, 10] },
      { label: "Web", values: [null, 5, 0] },
    ],
  }),
  { width: 36 },
);
```

```text
Activity

    Mon   Tue   Wed
API ▁▁▁▁▁ ▄▄▄▄▄ █████
Web ·     ▄▄▄▄▄ ▁▁▁▁▁

0 ▁▂▃▄▅▆▇█ 10  · missing
```

All chart titles and labels are HTML-escaped. The generated `<pre>` is
accompanied by a semantic data table when `accessibility` is `"table"` or
`"both"`.

## Packages

| Package                        | Responsibility                                                  |
| ------------------------------ | --------------------------------------------------------------- |
| `@ascii-graphs/core`           | Validation, scales, layout, Unicode measurement, and `CellGrid` |
| `@ascii-graphs/renderer-text`  | Plain ASCII/Unicode string serialization                        |
| `@ascii-graphs/renderer-ansi`  | Portable 16/256/true-color terminal rendering                   |
| `@ascii-graphs/renderer-email` | Matching plain-text and accessible HTML email parts             |
| `@ascii-graphs/renderer-html`  | Browser and email-safe accessible HTML                          |

The scoped names are provisional until npm and trademark availability are
confirmed.

## Development

Requires Node 20 or newer and pnpm.

```sh
pnpm install
pnpm check
```

Individual commands are available for `build`, `test`, `test:watch`,
`typecheck`, `lint`, and `format`.

## Executable examples

Render the full chart gallery in your terminal:

```sh
pnpm example:cli
pnpm example:cli -- --chart heatmap --ascii --width 48
```

Run the interactive HTML gallery:

```sh
pnpm example:html
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). See the
[examples guide](examples/README.md) for every option.

## Compatibility principles

- Grid dimensions are measured in display columns, not JavaScript string length.
- ASCII mode uses `#`, `|`, and ordinary punctuation.
- Unicode mode uses block and box-drawing characters.
- Missing or non-finite numeric values are rejected rather than silently
  changed.
- Titles and labels reject terminal controls, newlines, and bidirectional
  formatting controls.
- Redirected plain-text output never contains ANSI escape sequences.
- Rendering is deterministic so output can be snapshot-tested.

Email clients can substitute their own fonts. For critical reports, include both
HTML and plain-text MIME parts and retain the accessible data table.

## Roadmap

- [x] Target-neutral cell grid
- [x] Horizontal bar chart
- [x] ASCII and Unicode text rendering
- [x] Accessible HTML/email rendering
- [x] ANSI renderer
- [x] Sparklines
- [x] Progress and goal indicators
- [x] Paired email rendering
- [x] Numeric heatmaps
- [ ] Vertical bars
- [ ] Line charts and downsampling
- [ ] Categorical status grids
- [ ] JSON/CSV command-line interface
- [ ] Browser playground

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE) © 2026 Juan Víctor Izquierdo
