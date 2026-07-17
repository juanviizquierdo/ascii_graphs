import { bar, layout, sparkline } from "@ascii-graphs/core";
import { renderAnsi } from "@ascii-graphs/renderer-ansi";
import { renderHtml } from "@ascii-graphs/renderer-html";
import { renderText } from "@ascii-graphs/renderer-text";

const chart = bar({
  title: "Monthly revenue",
  data: [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 68 },
    { label: "Mar", value: 91 },
  ],
});

const grid = layout(chart, { width: 42, charset: "unicode" });

console.log(renderText(grid));
console.log(renderHtml(grid, { accessibility: "both" }));

const trend = layout(
  sparkline({
    label: "Latency",
    values: [18, 22, null, 19, 35, 27],
  }),
);

console.log(renderAnsi(trend, { colorLevel: 3 }));
