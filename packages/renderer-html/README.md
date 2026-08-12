# `@ascii-graphs/renderer-html`

Escaped, accessible HTML rendering for `CellGrid` output from
`@ascii-graphs/core`.

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-html@next
```

```ts
import { layout, progress } from "@ascii-graphs/core";
import { renderHtml } from "@ascii-graphs/renderer-html";

const grid = layout(progress({ data: [{ label: "Build", value: 72 }] }));
const html = renderHtml(grid, {
  accessibility: "both",
  fontSize: 14,
  lineHeight: 1.35,
});
```

Chart content is HTML-escaped and can include a screen-reader description and
semantic data table. `fontSize` accepts 6–72 pixels and `lineHeight` accepts
0.8–3. Requires Node.js 20 or newer. Licensed under MIT.
