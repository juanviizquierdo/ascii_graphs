# `@ascii-graphs/renderer-text`

Plain-text serialization for `CellGrid` output from `@ascii-graphs/core`.

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-text@next
```

```ts
import { layout, sparkline } from "@ascii-graphs/core";
import { renderText } from "@ascii-graphs/renderer-text";

const grid = layout(sparkline({ values: [2, 5, 3, 8] }));
console.log(renderText(grid, { finalNewline: true }));
```

The output contains no ANSI control sequences. Requires Node.js 20 or newer.
Licensed under MIT.
