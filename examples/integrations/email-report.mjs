import { progress, layout } from "../../packages/core/dist/index.js";
import { renderEmailParts } from "../../packages/renderer-email/dist/index.js";

const grid = layout(
  progress({
    title: "Nightly pipeline",
    data: [
      { label: "Build", value: 100, target: 100 },
      { label: "Tests", value: 94, target: 100 },
      { label: "Deploy", value: 72, target: 100 },
    ],
  }),
  { width: 48, charset: "ascii" },
);

const parts = renderEmailParts(grid, {
  html: { accessibility: "both", fontSize: 13 },
});

process.stdout.write(
  [
    "--- text/plain ---",
    parts.text,
    "",
    "--- text/html ---",
    parts.html,
    "",
  ].join("\n"),
);
