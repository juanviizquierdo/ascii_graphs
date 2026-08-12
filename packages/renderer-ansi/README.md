# `@ascii-graphs/renderer-ansi`

Semantic ANSI color rendering for `CellGrid` output from `@ascii-graphs/core`,
with 16-color, 256-color, and true-color support.

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-ansi@next
```

```ts
import { bar, layout } from "@ascii-graphs/core";
import { detectColorLevel, renderAnsi } from "@ascii-graphs/renderer-ansi";

const grid = layout(bar({ data: [{ label: "Done", value: 84 }] }));
console.log(
  renderAnsi(grid, {
    colorLevel: detectColorLevel({
      isTTY: process.stdout.isTTY,
      env: process.env,
    }),
  }),
);
```

`NO_COLOR` and `FORCE_COLOR` are supported. Requires Node.js 20 or newer.
Licensed under MIT.
