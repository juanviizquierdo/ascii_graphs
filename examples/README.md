# Executable examples

## Terminal gallery

Render every chart using the current terminal capabilities:

```sh
pnpm example:cli
```

Select a chart, character set, viewport width, or output mode:

```sh
pnpm example:cli -- --chart heatmap --ascii --width 48
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
live controls for viewport width, ASCII/Unicode characters, and paper/terminal
themes. Expand “View plain-text output” beneath any chart to compare the browser
rendering with its portable text representation.

The generated browser bundle is intentionally ignored by Git. Running
`pnpm example:html` rebuilds it from the real workspace packages.
