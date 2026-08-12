# Executable examples

## Integration cookbook

The library is written in TypeScript, but its rendered output works anywhere
that accepts text or HTML. These examples cover direct JavaScript usage and a
JSON stdin bridge for other languages.

| Language or place  | Example                                                   | What it demonstrates                                |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------- |
| Node.js terminal   | [`node-cli.mjs`](integrations/node-cli.mjs)               | TTY-aware ANSI color and terminal width             |
| JSON / any process | [`render-json.mjs`](integrations/render-json.mjs)         | Text, ANSI, HTML, or email output over stdin/stdout |
| Python             | [`python_report.py`](integrations/python_report.py)       | `subprocess.run` with a JSON request                |
| PHP                | [`php-report.php`](integrations/php-report.php)           | `proc_open` with safe argument arrays               |
| Ruby               | [`ruby_report.rb`](integrations/ruby_report.rb)           | `Open3.capture3` with JSON stdin                    |
| POSIX shell        | [`shell-report.sh`](integrations/shell-report.sh)         | A heredoc report for scripts and cron jobs          |
| Plain browser      | [`browser-widget.html`](integrations/browser-widget.html) | Accessible HTML inside a minimal web page           |
| React              | [`react-component.tsx`](integrations/react-component.tsx) | Memoized accessible chart component                 |
| HTTP server        | [`http-server.mjs`](integrations/http-server.mjs)         | Server-rendered HTML with Node's standard library   |
| Email worker       | [`email-report.mjs`](integrations/email-report.mjs)       | Matching `text/plain` and `text/html` alternatives  |
| GitHub Actions     | [`github-action.yml`](integrations/github-action.yml)     | A chart in `$GITHUB_STEP_SUMMARY`                   |

Build the packages and verify the portable examples:

```sh
pnpm example:integrations
```

Run individual terminal and language examples after `pnpm build`:

```sh
node examples/integrations/node-cli.mjs
node examples/integrations/render-json.mjs < examples/integrations/chart.json
python3 examples/integrations/python_report.py
php examples/integrations/php-report.php
ruby examples/integrations/ruby_report.rb
sh examples/integrations/shell-report.sh
```

Preview the standalone browser widget at
`http://127.0.0.1:4173/integrations/browser-widget.html`:

```sh
pnpm example:integrations:browser
```

Preview email alternatives or start a server-rendered report:

```sh
pnpm example:integrations:email
pnpm example:integrations:server
```

### Portable JSON request

The bridge deliberately uses stdin and stdout, so it works from almost every
language and does not require a long-running service:

```json
{
  "chart": {
    "type": "bar",
    "title": "Deployments by region",
    "data": [
      { "label": "Europe", "value": 42 },
      { "label": "Americas", "value": 31 }
    ]
  },
  "layout": { "width": 44, "charset": "unicode" },
  "output": { "format": "text" }
}
```

The example bridge supports `bar`, `line`, `progress`, and `heatmap`. Output
formats are `text`, `ansi`, `html`, and `email`. It is an integration pattern,
not a second chart API: JavaScript applications should use the package exports
directly.

## Terminal gallery

Render every chart using the current terminal capabilities:

```sh
pnpm example:cli
```

Select a chart, character set, viewport width, or output mode:

```sh
pnpm example:cli -- --chart heatmap --ascii --width 48
pnpm example:cli -- --chart column --unicode --width 48
pnpm example:cli -- --chart line --ascii --width 56
pnpm example:cli -- --chart scatter --unicode --width 56
pnpm example:cli -- --chart histogram --ascii --width 56
pnpm example:cli -- --chart area --unicode --width 56
pnpm example:cli -- --chart boxplot --ascii --width 56
pnpm example:cli -- --chart stacked --unicode --width 56
pnpm example:cli -- --chart donut --ascii --width 56
pnpm example:cli -- --chart grouped --unicode --width 56
pnpm example:cli -- --chart waterfall --ascii --width 56
pnpm example:cli -- --chart bullet --unicode --width 56
pnpm example:cli -- --chart candle --ascii --width 56
pnpm example:cli -- --chart gantt --unicode --width 56
pnpm example:cli -- --chart multiline --ascii --width 56
pnpm example:cli -- --chart stackedarea --unicode --width 56
pnpm example:cli -- --chart range --ascii --width 56
pnpm example:cli -- --chart dumbbell --unicode --width 56
pnpm example:cli -- --chart lollipop --unicode --width 56
pnpm example:cli -- --chart step --ascii --width 56
pnpm example:cli -- --chart interval --unicode --width 56
pnpm example:cli -- --chart density --ascii --width 56
pnpm example:cli -- --chart violin --unicode --width 56
pnpm example:cli -- --chart strip --ascii --width 56
pnpm example:cli -- --chart beeswarm --unicode --width 56
pnpm example:cli -- --chart ecdf --ascii --width 56
pnpm example:cli -- --chart qq --unicode --width 56
pnpm example:cli -- --chart likert --ascii --width 56
pnpm example:cli -- --chart pie --unicode --width 56
pnpm example:cli -- --chart treemap --ascii --width 56
pnpm example:cli -- --chart waffle --unicode --width 56
pnpm example:cli -- --chart funnel --ascii --width 56
pnpm example:cli -- --chart pyramid --unicode --width 56
pnpm example:cli -- --chart pareto --ascii --width 56
pnpm example:cli -- --chart calendar --unicode --width 56
pnpm example:cli -- --chart horizon --ascii --width 56
pnpm example:cli -- --chart timeline --unicode --width 56
pnpm example:cli -- --chart bubble --ascii --width 56
pnpm example:cli -- --chart connected --unicode --width 56
pnpm example:cli -- --chart correlation --ascii --width 56
pnpm example:cli -- --chart radar --unicode --width 56
pnpm example:cli -- --chart parallel --ascii --width 56
pnpm example:cli -- --chart sankey --unicode --width 56
pnpm example:cli -- --chart alluvial --ascii --width 56
pnpm example:cli -- --chart tree --unicode --width 56
pnpm example:cli -- --chart org --ascii --width 56
pnpm example:cli -- --chart dependency --unicode --width 56
pnpm example:cli -- --chart network --ascii --width 56
pnpm example:cli -- --chart flame --unicode --width 56
pnpm example:cli -- --chart sunburst --ascii --width 56
pnpm example:cli -- --chart status --plain
pnpm example:cli -- --chart ridgeline --unicode --width 56
pnpm example:cli -- --chart hexbin --ascii --width 56
pnpm example:cli -- --chart control --unicode --width 56
pnpm example:cli -- --chart mosaic --ascii --width 56
pnpm example:cli -- --chart chord --unicode --width 64
pnpm example:cli -- --chart gauge --unicode --width 48
pnpm example:cli -- --chart themeriver --ascii --width 56
pnpm example:cli -- --chart pictorial --unicode --width 56
pnpm example:cli -- --chart choropleth --unicode --width 48
pnpm example:cli -- --chart countries --unicode --width 60
pnpm example:cli -- --chart continent --unicode --width 60
pnpm example:cli -- --chart routes --ascii --width 64
pnpm example:cli -- --chart progress --ansi
pnpm example:cli -- --help
```

The command builds the workspace before running, so the output always exercises
the current source.

## Browser gallery

Build the browser bundle and start the local example server:

```sh
pnpm example:html
```

Then visit [http://127.0.0.1:4173](http://127.0.0.1:4173). The gallery provides
live search plus controls for viewport width, font size, ASCII/Unicode
characters, and paper/terminal themes. Expand “View plain-text output” beneath
any chart to compare the browser rendering with its portable text
representation.

The same gallery is the project's GitHub Pages site. A push to `main` builds the
browser bundle and deploys the static page through
`.github/workflows/pages.yml`.

The generated browser bundle is intentionally ignored by Git. Running
`pnpm example:html` rebuilds it from the real workspace packages.
