#!/usr/bin/env node

import {
  bar,
  heatmap,
  layout,
  line,
  progress,
} from "../../packages/core/dist/index.js";
import { renderAnsi } from "../../packages/renderer-ansi/dist/index.js";
import { renderEmailParts } from "../../packages/renderer-email/dist/index.js";
import { renderHtml } from "../../packages/renderer-html/dist/index.js";
import { renderText } from "../../packages/renderer-text/dist/index.js";

const constructors = { bar, heatmap, line, progress };

function object(value, name) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${name} must be a JSON object.`);
  }
  return value;
}

export function renderRequest(input) {
  const request = object(input, "request");
  const chartSpec = object(request.chart, "chart");
  const type = chartSpec.type;
  if (typeof type !== "string" || !(type in constructors)) {
    throw new RangeError(
      `chart.type must be one of: ${Object.keys(constructors).join(", ")}.`,
    );
  }

  const chartInput = { ...chartSpec };
  delete chartInput.type;
  const chart = constructors[type](chartInput);
  const grid = layout(chart, object(request.layout ?? {}, "layout"));
  const output = object(request.output ?? {}, "output");
  const format = output.format ?? "text";

  switch (format) {
    case "text":
      return renderText(grid);
    case "ansi":
      return renderAnsi(grid, {
        colorLevel: output.colorLevel ?? 3,
        finalNewline: false,
      });
    case "html":
      return renderHtml(grid, { accessibility: "both" });
    case "email":
      return JSON.stringify(renderEmailParts(grid), null, 2);
    default:
      throw new RangeError("output.format must be text, ansi, html, or email.");
  }
}

try {
  process.stdin.setEncoding("utf8");
  let source = "";
  for await (const chunk of process.stdin) source += chunk;
  if (source.trim() === "")
    throw new Error("Expected a JSON request on stdin.");
  process.stdout.write(`${renderRequest(JSON.parse(source))}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ascii-graphs: ${message}\n`);
  process.exitCode = 1;
}
