import { bar, heatmap, layout, progress, sparkline } from "@ascii-graphs/core";
import { renderHtml } from "@ascii-graphs/renderer-html";
import { renderText } from "@ascii-graphs/renderer-text";

const chartFactories = [
  {
    name: "Diverging bars",
    description: "Positive and negative values share a zero baseline.",
    create: () =>
      bar({
        title: "Monthly revenue",
        data: [
          { label: "Jan", value: 42 },
          { label: "Feb", value: 68 },
          { label: "Mar", value: 91 },
          { label: "Returns", value: -18 },
        ],
      }),
  },
  {
    name: "Sparkline",
    description:
      "Missing samples use a distinct glyph instead of becoming zero.",
    create: () =>
      sparkline({
        title: "API latency",
        label: "p95",
        values: [18, 22, 21, null, 19, 35, 27, 24, 31, 20],
      }),
  },
  {
    name: "Goals and progress",
    description: "Target markers remain visible without relying on color.",
    create: () =>
      progress({
        title: "Release status",
        data: [
          { label: "Build", value: 72, target: 80 },
          { label: "Tests", value: 94, target: 90 },
          { label: "Deploy", value: 40 },
        ],
      }),
  },
  {
    name: "Numeric heatmap",
    description: "Density glyphs and a legend work in monochrome output.",
    create: () =>
      heatmap({
        title: "Weekly activity",
        columns: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        rows: [
          { label: "API", values: [2, 5, 8, 10, 7] },
          { label: "Web", values: [1, null, 6, 4, 9] },
          { label: "Jobs", values: [0, 3, 4, 8, 5] },
        ],
      }),
  },
] as const;

const gallery = document.querySelector<HTMLElement>("#gallery");
const widthInput = document.querySelector<HTMLInputElement>("#width");
const widthOutput = document.querySelector<HTMLOutputElement>("#width-value");
const charsetInput = document.querySelector<HTMLSelectElement>("#charset");
const themeInput = document.querySelector<HTMLSelectElement>("#theme");

if (
  gallery === null ||
  widthInput === null ||
  widthOutput === null ||
  charsetInput === null ||
  themeInput === null
) {
  throw new Error("Gallery controls are missing from the HTML document.");
}

const themes = {
  paper: {
    foreground: "#28241f",
    background: "transparent",
    muted: "#83786b",
    accent: "#9a3412",
    positive: "#166534",
    negative: "#b91c1c",
    series1: "#0369a1",
    series2: "#7e22ce",
    series3: "#a16207",
    series4: "#0f766e",
  },
  terminal: {
    foreground: "#b7f7c5",
    background: "transparent",
    muted: "#668f70",
    accent: "#7dd3fc",
    positive: "#4ade80",
    negative: "#fb7185",
    series1: "#67e8f9",
    series2: "#c4b5fd",
    series3: "#fde047",
    series4: "#5eead4",
  },
} as const;

function renderGallery(): void {
  const width = Number(widthInput.value);
  const charset = charsetInput.value === "ascii" ? "ascii" : "unicode";
  const themeName = themeInput.value === "terminal" ? "terminal" : "paper";
  const theme = themes[themeName];
  document.documentElement.dataset.theme = themeName;
  widthOutput.value = String(width);
  gallery.replaceChildren();

  for (const example of chartFactories) {
    const grid = layout(example.create(), { width, charset });
    const article = document.createElement("article");
    article.className = "chart-card";

    const heading = document.createElement("h2");
    heading.textContent = example.name;
    const description = document.createElement("p");
    description.textContent = example.description;
    const chart = document.createElement("div");
    chart.className = "chart-output";
    chart.innerHTML = renderHtml(grid, {
      accessibility: "both",
      theme,
    });

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "View plain-text output";
    const plain = document.createElement("pre");
    plain.textContent = renderText(grid);
    details.append(summary, plain);
    article.append(heading, description, chart, details);
    gallery.append(article);
  }
}

for (const control of [widthInput, charsetInput, themeInput]) {
  control.addEventListener("input", renderGallery);
  control.addEventListener("change", renderGallery);
}

renderGallery();
