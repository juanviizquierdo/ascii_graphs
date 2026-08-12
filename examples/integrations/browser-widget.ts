import { multiLine, layout } from "@ascii-graphs/core";
import { renderHtml } from "@ascii-graphs/renderer-html";

const target = document.querySelector<HTMLElement>("#chart");
if (target === null) throw new Error("Missing #chart mount point.");

const chart = multiLine({
  title: "Requests by region",
  legend: { position: "top", color: "muted" },
  series: [
    { label: "EU", values: [18, 24, 21, 35, 31, 42] },
    { label: "US", values: [14, 19, 27, 25, 38, 45] },
    { label: "APAC", values: [22, 17, 31, 29, 42, 37] },
  ],
});

target.innerHTML = renderHtml(layout(chart, { width: 54 }), {
  accessibility: "both",
  fontSize: 14,
  lineHeight: 1.3,
});
