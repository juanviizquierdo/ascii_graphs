# `@ascii-graphs/renderer-email`

Matching plain-text and accessible HTML alternatives for multipart email.

```sh
pnpm add @ascii-graphs/core@next @ascii-graphs/renderer-email@next
```

```ts
import { layout, progress } from "@ascii-graphs/core";
import { renderEmailParts } from "@ascii-graphs/renderer-email";

const grid = layout(progress({ data: [{ label: "Deploy", value: 40 }] }));
const { text, html } = renderEmailParts(grid);
```

Use `text` and `html` as the two alternatives of the same MIME message. Requires
Node.js 20 or newer. Licensed under MIT.
