# `@ascii-graphs/core`

Validated, renderer-neutral ASCII and Unicode chart layouts for terminals,
browsers, email, logs, and documentation.

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-text@next
```

```ts
import { bar, layout } from "@ascii-graphs/core";
import { renderText } from "@ascii-graphs/renderer-text";

const grid = layout(
  bar({
    title: "Monthly revenue",
    data: [
      { label: "Jan", value: 42 },
      { label: "Feb", value: 68 },
      { label: "Mar", value: 91 },
    ],
  }),
  { width: 42, charset: "unicode" },
);

console.log(renderText(grid));
```

The core package has no DOM, terminal, or filesystem dependency. It produces a
semantic `CellGrid` that can be rendered by the text, ANSI, HTML, or email
packages.

Requires Node.js 20 or newer. Licensed under MIT.
