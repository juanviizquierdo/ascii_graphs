<div align="center">

<pre>
 █████╗ ███████╗ ██████╗██╗██╗     ██████╗ ██████╗  █████╗ ██████╗ ██╗  ██╗███████╗
██╔══██╗██╔════╝██╔════╝██║██║    ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██║  ██║██╔════╝
███████║███████╗██║     ██║██║    ██║  ███╗██████╔╝███████║██████╔╝███████║███████╗
██╔══██║╚════██║██║     ██║██║    ██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║╚════██║
██║  ██║███████║╚██████╗██║██║    ╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║███████║
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝
</pre>

**Portable, deterministic text charts for terminals, websites, email reports,
logs, and docs.**

[![License: MIT](https://img.shields.io/badge/license-MIT-26211c?style=flat-square)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%E2%89%A520-315c3b?style=flat-square)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-a43816?style=flat-square)](tsconfig.json)
[![Release candidate](https://img.shields.io/badge/release-0.1.0--alpha.0-71685e?style=flat-square)](CHANGELOG.md)

[Quick start](#quick-start) · [Chart catalog](#113-chart-styles) ·
[Renderers](#one-grid-four-outputs) · [Examples](#run-the-gallery) ·
[Contributing](CONTRIBUTING.md)

</div>

```text
Monthly revenue

Jan │███████████████                    42
Feb │████████████████████████           68
Mar │██████████████████████████████████ 91
    └────────────────────────────────────
     0                                 100
```

ASCII Graphs treats a chart as data, not a terminal side effect. It validates
the input and lays it out as a semantic grid of character cells. That same grid
can then become plain text, ANSI color, safe accessible HTML, or matching email
parts.

```text
chart specification → semantic CellGrid → text / ANSI / HTML / email
```

The core package has no DOM, terminal, or filesystem dependency. Output stays
useful without color, CSS, JavaScript, or even Unicode.

> [!IMPORTANT] The project is currently a `0.1.0-alpha.0` release candidate.
> Package names and the public API may change during the alpha series.

## Quick start

Install the prerelease packages from the `next` channel after the first public
release:

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-text@next
```

Describe a chart, lay it out for the available space, and render it:

```ts
import { bar, layout } from "@ascii-graphs/core";
import { renderText } from "@ascii-graphs/renderer-text";

const chart = bar({
  title: "Monthly revenue",
  data: [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 68 },
    { label: "Mar", value: 91 },
  ],
});

const grid = layout(chart, {
  width: 42,
  charset: "unicode", // use "ascii" for strict 7-bit output
});

console.log(renderText(grid));
```

Every chart uses the same `layout(chart, options)` entry point. Width, height,
and character set belong to layout; output-specific concerns belong to the
renderer.

## One grid, four outputs

| Package                                                   | Use it for                                       | Output characteristics                                 |
| --------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| [`@ascii-graphs/renderer-text`](packages/renderer-text)   | Logs, Markdown, snapshots, redirected CLI output | Plain text with no control sequences                   |
| [`@ascii-graphs/renderer-ansi`](packages/renderer-ansi)   | Interactive terminal UIs and reports             | 16-color, 256-color, or true-color ANSI                |
| [`@ascii-graphs/renderer-html`](packages/renderer-html)   | Minimal websites and web reports                 | Escaped HTML, screen-reader text, semantic tables      |
| [`@ascii-graphs/renderer-email`](packages/renderer-email) | Transactional and scheduled reports              | Matching `text/plain` and accessible `text/html` parts |

### Terminal color

```ts
import { detectColorLevel, renderAnsi } from "@ascii-graphs/renderer-ansi";

const colorLevel = detectColorLevel({
  isTTY: process.stdout.isTTY,
  env: process.env,
});

process.stdout.write(renderAnsi(grid, { colorLevel }));
```

### Accessible HTML

```ts
import { renderHtml } from "@ascii-graphs/renderer-html";

const html = renderHtml(grid, {
  accessibility: "both", // description + semantic data table
  fontSize: 14, // pixels, from 6 to 72
  lineHeight: 1.35,
});
```

All chart content is escaped. Accessibility modes can add a concise description,
a semantic data table, or both alongside the visual `<pre>`.

### Configurable legends and multi-line charts

Funnel and pyramid stage legends can sit inside the shape or on either side and
use any semantic palette color:

```ts
import { funnel, layout, multiLine } from "@ascii-graphs/core";

const conversion = layout(
  funnel({
    title: "Signup funnel",
    legend: { position: "left", color: "accent" },
    data: [
      { label: "Visit", value: 1_000 },
      { label: "Trial", value: 540 },
      { label: "Paid", value: 120 },
    ],
  }),
);

const traffic = layout(
  multiLine({
    title: "Regional traffic",
    legend: { position: "top", color: "muted" },
    series: [
      { label: "EU", values: [18, 24, 21, 35] },
      { label: "US", values: [14, 19, 27, 25] },
      { label: "APAC", values: [22, 17, 31, 29] },
    ],
  }),
);
```

Legend colors are semantic tokens: `muted`, `accent`, `positive`, `negative`, or
`series1` through `series4`. Multi-line legends support `top` and `bottom`;
funnel and pyramid legends support `inside`, `left`, and `right`.

### Multipart email

```ts
import { renderEmailParts } from "@ascii-graphs/renderer-email";

const { text, html } = renderEmailParts(grid);
// Attach `text` and `html` as the two alternatives in your email provider.
```

## Use it in different languages and places

JavaScript and TypeScript applications use the packages directly. Other
languages can send a JSON request to the included stdin/stdout bridge and
receive plain text, ANSI, accessible HTML, or matching email alternatives.

| Context                | Ready-to-run example                                               |
| ---------------------- | ------------------------------------------------------------------ |
| Node.js CLI            | [`node-cli.mjs`](examples/integrations/node-cli.mjs)               |
| Python process         | [`python_report.py`](examples/integrations/python_report.py)       |
| PHP application        | [`php-report.php`](examples/integrations/php-report.php)           |
| Ruby job               | [`ruby_report.rb`](examples/integrations/ruby_report.rb)           |
| Shell or cron          | [`shell-report.sh`](examples/integrations/shell-report.sh)         |
| Plain browser          | [`browser-widget.html`](examples/integrations/browser-widget.html) |
| React component        | [`react-component.tsx`](examples/integrations/react-component.tsx) |
| Server-rendered page   | [`http-server.mjs`](examples/integrations/http-server.mjs)         |
| Email worker           | [`email-report.mjs`](examples/integrations/email-report.mjs)       |
| GitHub Actions summary | [`github-action.yml`](examples/integrations/github-action.yml)     |

```sh
pnpm example:integrations
node examples/integrations/render-json.mjs < examples/integrations/chart.json
```

See the [integration cookbook](examples/README.md#integration-cookbook) for
commands, the portable JSON shape, and browser/server previews.

## 113 chart styles

The catalog covers quick status reports through dense analytical views. Every
style supports portable text output and the generic layout API.

| Family                | Included charts                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Trends**            | Sparkline, line, multi-line, area, stacked area, theme river, step, horizon, control, bump, fan                                           |
| **Comparison**        | Bar, column, grouped bar, stacked bar, pictorial bar, lollipop, dumbbell, range, bullet                                                   |
| **Distribution**      | Histogram, box plot, density, ridgeline, raincloud, violin, strip, beeswarm, ECDF, Q-Q                                                    |
| **Composition**       | Donut, pie, treemap, mosaic, waffle, Likert, funnel, pyramid, Pareto                                                                      |
| **Relationships**     | Scatter, hexbin, bubble, connected scatter, correlation matrix, adjacency matrix, arc, radar, parallel coordinates, chord, UpSet, ternary |
| **Time & planning**   | Gantt, timeline, spiral timeline, barcode/event, calendar heatmap, candlestick, waterfall                                                 |
| **Flows & hierarchy** | Sankey, alluvial, cumulative flow, tree, organization, dependency, network, flame, sunburst                                               |
| **Maps & routes**     | Choropleth, world choropleth, country atlas, continent, route, migration flow, hex tile, dot density                                      |
| **Operations**        | Progress and goals, gauge, numeric heatmap, status grid, error intervals, error budget, burndown/burnup                                   |
| **Statistical**       | Contour, survival, ROC/precision-recall, calibration                                                                                      |
| **Markets**           | Point-and-figure, market profile/TPO, order-book depth                                                                                    |
| **Radial**            | Wind rose, polar area                                                                                                                     |
| **Advanced analysis** | Streamgraph, Hovmöller, slopegraph, small multiples, dendrograms, confusion matrix, lift/gains, forest, Bland–Altman                      |
| **Signals & process** | Spectrogram, waveform, queue timeline, critical path                                                                                      |
| **Advanced markets**  | Footprint, Renko, Kagi                                                                                                                    |
| **Advanced maps**     | Voronoi, cartogram, transit                                                                                                               |

The country atlas includes Spain, France, Germany, Italy, the United Kingdom,
the United States, Japan, and Australia. Its silhouettes are rasterized from
[Natural Earth’s public-domain 1:110m Admin 0 country data](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/).
Continent maps cover Europe, Africa, Asia, North America, South America, and
Oceania, with country values addressed through three-letter codes.

```ts
import { continentMap, countryMap, layout } from "@ascii-graphs/core";

const atlas = layout(
  countryMap({
    title: "Country activity",
    data: [
      { country: "spain", value: 72 },
      { country: "france", value: 54 },
      { country: "italy", value: 83 },
      { country: "japan", value: 61 },
    ],
  }),
  { width: 60 },
);

const europe = layout(
  continentMap({
    title: "European activity",
    continent: "europe",
    data: [
      { country: "ESP", value: 72 },
      { country: "FRA", value: 64 },
      { country: "DEU", value: 81 },
    ],
  }),
  { width: 60 },
);
```

<details>
<summary><strong>See a few more chart specifications</strong></summary>

### Trends with missing data

```ts
import { layout, line } from "@ascii-graphs/core";

const traffic = layout(
  line({
    title: "Requests per minute",
    label: "RPM",
    values: [18, 24, 21, 35, 31, null, 38, 52, 44, 61],
  }),
  { width: 48, height: 12 },
);
```

Missing values remain explicit gaps. Downsampling preserves important peaks
instead of silently flattening the series.

### Operational status

```ts
import { layout, statusGrid } from "@ascii-graphs/core";

const health = layout(
  statusGrid({
    title: "Service health",
    columns: ["API", "Web", "Jobs"],
    rows: [
      { label: "Prod", values: ["success", "success", "warning"] },
      { label: "Stage", values: ["success", "unknown", "failure"] },
    ],
  }),
  { width: 42 },
);
```

Status meaning is preserved through shape and text, not color alone.

### Numeric heatmaps

```ts
import { heatmap, layout } from "@ascii-graphs/core";

const activity = layout(
  heatmap({
    title: "Weekly activity",
    columns: ["Mon", "Tue", "Wed"],
    rows: [
      { label: "API", values: [0, 5, 10] },
      { label: "Web", values: [null, 5, 0] },
    ],
  }),
  { width: 36 },
);
```

</details>

## Run the gallery

The repository includes two executable galleries built from the real workspace
packages—not copied output or screenshots.

### Interactive browser gallery

```sh
pnpm install
pnpm example:html
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Search all 113 chart
styles, resize the virtual viewport, adjust font size, switch between ASCII and
Unicode, and compare paper and terminal themes. GitHub Pages deployment is
automated by [`pages.yml`](.github/workflows/pages.yml).

### Terminal gallery

```sh
pnpm example:cli
pnpm example:cli -- --chart heatmap --ascii --width 48
pnpm example:cli -- --chart sankey --unicode --width 64
pnpm example:cli -- --help
```

See the [examples guide](examples/README.md) for all available chart names and
flags.

## Design principles

- **Portable by construction.** Layout does not know whether output is headed
  for a terminal, browser, inbox, or snapshot test.
- **Deterministic.** Equal input and layout options produce equal output.
- **Monochrome first.** Shape, glyph, position, and labels carry meaning before
  color is added.
- **Display-column aware.** Labels are measured and truncated by Unicode display
  width rather than JavaScript string length.
- **Strict at the boundary.** Invalid numbers, unsafe terminal controls,
  newlines, and bidirectional formatting controls are rejected.
- **Accessible beyond the picture.** HTML output can include descriptions and
  the underlying data as a semantic table.

## Workspace packages

| Package                                                   | Responsibility                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`@ascii-graphs/core`](packages/core)                     | Validation, chart specifications, scales, layout, palettes, and `CellGrid` |
| [`@ascii-graphs/renderer-text`](packages/renderer-text)   | Plain ASCII and Unicode serialization                                      |
| [`@ascii-graphs/renderer-ansi`](packages/renderer-ansi)   | Portable semantic terminal color                                           |
| [`@ascii-graphs/renderer-html`](packages/renderer-html)   | Safe and accessible browser/email HTML                                     |
| [`@ascii-graphs/renderer-email`](packages/renderer-email) | Paired plain-text and HTML email output                                    |

## Development

Requires Node.js 20 or newer and pnpm.

```sh
pnpm install
pnpm check
```

`pnpm check` runs formatting, linting, type checks, tests, package builds, and
example checks. `pnpm release:check` additionally packs and inspects every
public package.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security
reports follow [SECURITY.md](SECURITY.md), and release maintainers should use
the checklist in [RELEASING.md](RELEASING.md).

## Roadmap

- JSON/CSV command-line interface
- Browser playground with editable datasets
- More renderer themes and embeddable presets
- Stable `1.0` API after alpha feedback

Ideas, bug reports, and new chart proposals are welcome.

## License

[MIT](LICENSE) © 2026 Juan Víctor Izquierdo
