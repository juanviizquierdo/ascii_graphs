#!/usr/bin/env node

import { bar, layout } from "../../packages/core/dist/index.js";
import {
  detectColorLevel,
  renderAnsi,
} from "../../packages/renderer-ansi/dist/index.js";

const grid = layout(
  bar({
    title: "Build time",
    unit: "s",
    data: [
      { label: "Web", value: 18 },
      { label: "API", value: 27 },
      { label: "Jobs", value: 11 },
    ],
  }),
  { width: Math.min(64, process.stdout.columns ?? 48) },
);

const colorLevel = detectColorLevel({
  isTTY: process.stdout.isTTY,
  env: process.env,
});
process.stdout.write(renderAnsi(grid, { colorLevel, finalNewline: true }));
