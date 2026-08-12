import { createServer } from "node:http";

import { bar, layout } from "../../packages/core/dist/index.js";
import { renderHtml } from "../../packages/renderer-html/dist/index.js";

const port = Number(process.env.PORT ?? 4180);

const server = createServer((_request, response) => {
  const grid = layout(
    bar({
      title: "Requests by service",
      data: [
        { label: "Web", value: 128 },
        { label: "API", value: 94 },
        { label: "Jobs", value: 37 },
      ],
    }),
    { width: 48 },
  );
  const chart = renderHtml(grid, { accessibility: "both", fontSize: 14 });
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>Service report</title><main><h1>Live service report</h1>${chart}</main>`,
  );
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Server report: http://127.0.0.1:${port}\n`);
});
