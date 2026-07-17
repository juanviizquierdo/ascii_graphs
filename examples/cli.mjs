#!/usr/bin/env node

import {
  bar,
  heatmap,
  layout,
  progress,
  sparkline,
} from "../packages/core/dist/index.js";
import {
  detectColorLevel,
  renderAnsi,
} from "../packages/renderer-ansi/dist/index.js";
import { renderText } from "../packages/renderer-text/dist/index.js";

const chartNames = ["bar", "sparkline", "progress", "heatmap"];

function usage() {
  return `ASCII Graphs CLI gallery

Usage:
  pnpm example:cli -- [options]

Options:
  --chart <name>   bar, sparkline, progress, heatmap, or all (default: all)
  --width <cols>   viewport width from 24 to 120 (default: 64)
  --ascii          use strict ASCII glyphs
  --unicode        use Unicode glyphs (default)
  --ansi           force true-color ANSI output
  --plain          disable ANSI color
  --help           show this message

Examples:
  pnpm example:cli
  pnpm example:cli -- --chart heatmap --ascii --width 48
  pnpm example:cli -- --chart progress --ansi
`;
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n\n${usage()}`);
  process.exitCode = 2;
}

function parseArguments(arguments_) {
  const options = {
    chart: "all",
    width: 64,
    charset: "unicode",
    colorLevel: detectColorLevel({
      isTTY: process.stdout.isTTY === true,
      env: process.env,
    }),
  };

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--") continue;
    if (argument === "--help") return { ...options, help: true };
    if (argument === "--ascii") {
      options.charset = "ascii";
      continue;
    }
    if (argument === "--unicode") {
      options.charset = "unicode";
      continue;
    }
    if (argument === "--ansi") {
      options.colorLevel = 3;
      continue;
    }
    if (argument === "--plain") {
      options.colorLevel = 0;
      continue;
    }
    if (argument === "--chart") {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error("--chart requires a value.");
      options.chart = value;
      index += 1;
      continue;
    }
    if (argument === "--width") {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error("--width requires a value.");
      options.width = Number(value);
      index += 1;
      continue;
    }
    throw new Error(`unknown option ${argument}.`);
  }
  return options;
}

function createCharts() {
  return {
    bar: bar({
      title: "Monthly revenue",
      data: [
        { label: "Jan", value: 42 },
        { label: "Feb", value: 68 },
        { label: "Mar", value: 91 },
        { label: "Returns", value: -18 },
      ],
    }),
    sparkline: sparkline({
      title: "API latency",
      label: "p95",
      values: [18, 22, 21, null, 19, 35, 27, 24, 31, 20],
    }),
    progress: progress({
      title: "Release status",
      data: [
        { label: "Build", value: 72, target: 80 },
        { label: "Tests", value: 94, target: 90 },
        { label: "Deploy", value: 40 },
      ],
    }),
    heatmap: heatmap({
      title: "Weekly activity",
      columns: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      rows: [
        { label: "API", values: [2, 5, 8, 10, 7] },
        { label: "Web", values: [1, null, 6, 4, 9] },
        { label: "Jobs", values: [0, 3, 4, 8, 5] },
      ],
    }),
  };
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return;
  }

  if (options.help === true) {
    process.stdout.write(usage());
    return;
  }
  if (
    !Number.isInteger(options.width) ||
    options.width < 24 ||
    options.width > 120
  ) {
    fail("--width must be an integer between 24 and 120.");
    return;
  }
  if (options.chart !== "all" && !chartNames.includes(options.chart)) {
    fail(`--chart must be all or one of: ${chartNames.join(", ")}.`);
    return;
  }

  const charts = createCharts();
  const selected = options.chart === "all" ? chartNames : [options.chart];
  const output = selected.map((name) => {
    const chart = charts[name];
    const grid = layout(chart, {
      width: options.width,
      charset: options.charset,
    });
    return options.colorLevel === 0
      ? renderText(grid)
      : renderAnsi(grid, { colorLevel: options.colorLevel });
  });
  process.stdout.write(
    `${output.join("\n\n${" - ".repeat(options.width)}\n\n")}\n`,
  );
}

main();
