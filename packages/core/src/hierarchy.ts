import { GridBuilder, measureText, truncateText } from "./grid.js";
import { getPalette } from "./palette.js";
import {
  validateDataLength,
  validateFiniteNumber,
  validateHeight,
  validateText,
  validateViewport,
  validateWidth,
} from "./validation.js";

import type {
  CellGrid,
  HierarchyChart,
  HierarchyChartInput,
  HierarchyNode,
  HierarchyNodeInput,
  LayoutOptions,
  NetworkChart,
  NetworkChartInput,
  NetworkEdge,
  NetworkNode,
  PartitionChart,
  PartitionChartInput,
} from "./types.js";

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 16;

function base(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}): void {
  if (input.title !== undefined) validateText(input.title, "title");
  if (input.description !== undefined)
    validateText(input.description, "description");
  if (input.width !== undefined) validateWidth(input.width, "width");
  if (input.height !== undefined) validateHeight(input.height, "height");
}

function fields(input: {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
  };
}

function normalizeNode(
  input: HierarchyNodeInput,
  path: string,
  active: WeakSet<object>,
  counter: { value: number },
): HierarchyNode {
  if (typeof input !== "object" || input === null)
    throw new TypeError(`${path} must be a hierarchy node object.`);
  if (active.has(input)) throw new RangeError(`${path} contains a cycle.`);
  active.add(input);
  counter.value += 1;
  validateDataLength(counter.value, "hierarchy nodes");
  validateText(input.label, `${path}.label`);
  if (input.value !== undefined) {
    validateFiniteNumber(input.value, `${path}.value`);
    if (input.value < 0)
      throw new RangeError(`${path}.value cannot be negative.`);
  }
  if (input.children !== undefined && !Array.isArray(input.children))
    throw new TypeError(`${path}.children must be an array.`);
  const children = Object.freeze(
    (input.children ?? []).map((child, index) =>
      normalizeNode(child, `${path}.children[${index}]`, active, counter),
    ),
  );
  active.delete(input);
  return Object.freeze({
    label: input.label,
    ...(input.value !== undefined ? { value: input.value } : {}),
    children,
  });
}

function normalizeRoot(root: HierarchyNodeInput): HierarchyNode {
  return normalizeNode(root, "root", new WeakSet(), { value: 0 });
}

function flatten(root: HierarchyNode) {
  const rows: Array<{
    node: HierarchyNode;
    parent: string | null;
    depth: number;
    last: boolean;
    ancestorsLast: boolean[];
  }> = [];
  const visit = (
    node: HierarchyNode,
    parent: string | null,
    depth: number,
    last: boolean,
    ancestorsLast: boolean[],
  ) => {
    rows.push({ node, parent, depth, last, ancestorsLast });
    node.children.forEach((child, index) =>
      visit(child, node.label, depth + 1, index === node.children.length - 1, [
        ...ancestorsLast,
        last,
      ]),
    );
  };
  visit(root, null, 0, true, []);
  return rows;
}

function drawTitle(
  grid: GridBuilder,
  title: string | undefined,
  width: number,
  ellipsis: string,
) {
  if (title !== undefined)
    grid.text(0, 0, truncateText(title, width, ellipsis), "title", {
      foreground: "accent",
      bold: true,
    });
}

export function hierarchy(input: HierarchyChartInput): HierarchyChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("hierarchy input must be an object.");
  if (
    input.mode !== undefined &&
    !["tree", "org", "dependency"].includes(input.mode)
  )
    throw new TypeError("mode must be tree, org, or dependency.");
  base(input);
  return Object.freeze({
    type: "hierarchy",
    root: normalizeRoot(input.root),
    mode: input.mode ?? "tree",
    ...fields(input),
  });
}

export function layoutHierarchy(
  chart: HierarchyChart,
  options: LayoutOptions = {},
): CellGrid {
  const rows = flatten(chart.root);
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const titleRows = chart.title === undefined ? 0 : 2;
  const height = options.height ?? chart.height ?? titleRows + rows.length;
  validateViewport(width, height);
  if (height < titleRows + rows.length)
    throw new RangeError(
      `layout height ${height} is too short for ${rows.length} hierarchy nodes.`,
    );
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  rows.forEach((row, index) => {
    const y = titleRows + index;
    if (row.depth > 0) {
      row.ancestorsLast.slice(1).forEach((ancestorLast, depth) => {
        if (!ancestorLast)
          grid.text(depth * 3, y, charset === "ascii" ? "|" : "│", "axis", {
            foreground: "muted",
          });
      });
      const prefix =
        chart.mode === "dependency"
          ? charset === "ascii"
            ? "-> "
            : "→ "
          : row.last
            ? charset === "ascii"
              ? "`- "
              : "└─ "
            : charset === "ascii"
              ? "+- "
              : "├─ ";
      grid.text((row.depth - 1) * 3, y, prefix, "axis", {
        foreground: "muted",
      });
    }
    const label = chart.mode === "org" ? `[${row.node.label}]` : row.node.label;
    const x = row.depth * 3;
    grid.text(
      x,
      y,
      truncateText(label, width - x, palette.ellipsis),
      "label",
      row.depth === 0 ? { foreground: "accent", bold: true } : undefined,
      row.node.value === undefined
        ? undefined
        : { label: row.node.label, value: row.node.value },
    );
  });
  const fallback =
    chart.mode === "org"
      ? "Org chart"
      : chart.mode === "dependency"
        ? "Dependency tree"
        : "Tree diagram";
  const heading = chart.title ?? fallback;
  return grid.build(chart.description ?? `${heading}. ${rows.length} nodes.`, {
    caption: heading,
    columns: [
      { key: "label", label: "Label" },
      { key: "parent", label: "Parent" },
      { key: "depth", label: "Depth" },
      { key: "value", label: "Value" },
    ],
    rows: rows.map(({ node, parent, depth }) => ({
      label: node.label,
      parent,
      depth,
      value: node.value ?? null,
    })),
  });
}

export function network(input: NetworkChartInput): NetworkChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("network input must be an object.");
  if (!Array.isArray(input.nodes) || !Array.isArray(input.edges))
    throw new TypeError("nodes and edges must be arrays.");
  validateDataLength(input.nodes.length, "nodes");
  validateDataLength(input.edges.length, "edges");
  const ids = new Set<string>();
  const nodes: readonly NetworkNode[] = Object.freeze(
    input.nodes.map((node, index) => {
      validateText(node.id, `nodes[${index}].id`);
      if (ids.has(node.id))
        throw new RangeError(`duplicate network node id ${node.id}.`);
      ids.add(node.id);
      if (node.label !== undefined)
        validateText(node.label, `nodes[${index}].label`);
      return Object.freeze({ id: node.id, label: node.label ?? node.id });
    }),
  );
  const edges: readonly NetworkEdge[] = Object.freeze(
    input.edges.map((edge, index) => {
      validateText(edge.source, `edges[${index}].source`);
      validateText(edge.target, `edges[${index}].target`);
      if (!ids.has(edge.source) || !ids.has(edge.target))
        throw new RangeError(`edges[${index}] must reference existing nodes.`);
      const value = edge.value ?? 1;
      validateFiniteNumber(value, `edges[${index}].value`);
      if (value < 0)
        throw new RangeError(`edges[${index}].value cannot be negative.`);
      return Object.freeze({ source: edge.source, target: edge.target, value });
    }),
  );
  base(input);
  return Object.freeze({ type: "network", nodes, edges, ...fields(input) });
}

export function layoutNetwork(
  chart: NetworkChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const centerX = Math.floor(width / 2);
  const centerY = titleRows + Math.floor((height - titleRows) / 2);
  const radiusX = Math.max(3, Math.floor(width * 0.35));
  const radiusY = Math.max(2, Math.floor((height - titleRows) * 0.35));
  const positions = new Map(
    chart.nodes.map((node, index) => {
      const angle =
        -Math.PI / 2 + (index / Math.max(1, chart.nodes.length)) * Math.PI * 2;
      return [
        node.id,
        {
          node,
          x: centerX + Math.round(Math.cos(angle) * radiusX),
          y: centerY + Math.round(Math.sin(angle) * radiusY),
        },
      ] as const;
    }),
  );
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  chart.edges.forEach((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (source === undefined || target === undefined) return;
    const steps = Math.max(
      Math.abs(target.x - source.x),
      Math.abs(target.y - source.y),
    );
    for (let step = 0; step <= steps; step += 1)
      grid.set(
        Math.round(
          source.x + ((target.x - source.x) * step) / Math.max(1, steps),
        ),
        Math.round(
          source.y + ((target.y - source.y) * step) / Math.max(1, steps),
        ),
        charset === "ascii" ? "." : "·",
        "series",
        { foreground: "muted" },
        { label: `${edge.source} → ${edge.target}`, value: edge.value },
      );
  });
  positions.forEach(({ node, x, y }) => {
    grid.set(
      x,
      y,
      charset === "ascii" ? "O" : "●",
      "series",
      { foreground: "accent", bold: true },
      {
        label: node.label,
        value: chart.edges.filter(
          (edge) => edge.source === node.id || edge.target === node.id,
        ).length,
      },
    );
    grid.text(
      Math.max(0, Math.min(width - measureText(node.label), x + 2)),
      y,
      node.label,
      "label",
      { bold: true },
    );
  });
  const heading = chart.title ?? "Network graph";
  return grid.build(
    chart.description ??
      `${heading}. ${chart.nodes.length} nodes and ${chart.edges.length} edges.`,
    {
      caption: heading,
      columns: [
        { key: "source", label: "Source" },
        { key: "target", label: "Target" },
        { key: "value", label: "Value" },
      ],
      rows: chart.edges.map(({ source, target, value }) => ({
        source,
        target,
        value,
      })),
    },
  );
}

export function partition(input: PartitionChartInput): PartitionChart {
  if (typeof input !== "object" || input === null)
    throw new TypeError("partition input must be an object.");
  if (
    input.mode !== undefined &&
    input.mode !== "flame" &&
    input.mode !== "sunburst"
  )
    throw new TypeError("mode must be flame or sunburst.");
  base(input);
  return Object.freeze({
    type: "partition",
    root: normalizeRoot(input.root),
    mode: input.mode ?? "flame",
    ...fields(input),
  });
}

function nodeWeight(node: HierarchyNode): number {
  if (node.value !== undefined) return node.value;
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + nodeWeight(child), 0);
}

function nodeDepth(node: HierarchyNode): number {
  return 1 + Math.max(0, ...node.children.map(nodeDepth));
}

export function layoutPartition(
  chart: PartitionChart,
  options: LayoutOptions = {},
): CellGrid {
  const width = options.width ?? chart.width ?? DEFAULT_WIDTH;
  const height = options.height ?? chart.height ?? DEFAULT_HEIGHT;
  validateViewport(width, height);
  const charset = options.charset ?? "unicode";
  const palette = getPalette(charset);
  const titleRows = chart.title === undefined ? 0 : 2;
  const grid = new GridBuilder(width, height);
  drawTitle(grid, chart.title, width, palette.ellipsis);
  const fills =
    charset === "ascii" ? ["#", "+", "=", "%"] : ["█", "▓", "▒", "░"];
  if (chart.mode === "flame") {
    const depth = nodeDepth(chart.root);
    const rowHeight = Math.max(1, Math.floor((height - titleRows) / depth));
    const draw = (
      node: HierarchyNode,
      x: number,
      span: number,
      level: number,
    ) => {
      const y = height - 1 - (level + 1) * rowHeight;
      for (
        let drawY = Math.max(titleRows, y);
        drawY < Math.min(height, y + rowHeight);
        drawY += 1
      )
        for (let drawX = x; drawX < Math.min(width, x + span); drawX += 1)
          grid.set(
            drawX,
            drawY,
            fills[level % fills.length] ?? "#",
            "series",
            { foreground: `series${(level % 4) + 1}` as "series1" },
            { label: node.label, value: nodeWeight(node) },
          );
      if (span > 3)
        grid.text(
          x + 1,
          Math.max(titleRows, y),
          truncateText(node.label, span - 2, palette.ellipsis),
          "label",
          { bold: true },
        );
      let childX = x;
      const total = node.children.reduce(
        (sum, child) => sum + nodeWeight(child),
        0,
      );
      node.children.forEach((child, index) => {
        const childSpan =
          index === node.children.length - 1
            ? x + span - childX
            : Math.max(
                1,
                Math.round((nodeWeight(child) / Math.max(1, total)) * span),
              );
        draw(child, childX, childSpan, level + 1);
        childX += childSpan;
      });
    };
    draw(chart.root, 0, width, 0);
  } else {
    const centerX = Math.floor(width / 2);
    const centerY = titleRows + Math.floor((height - titleRows) / 2);
    const maxDepth = nodeDepth(chart.root);
    const radiusX = Math.max(4, Math.min(Math.floor(width / 2) - 1, 16));
    const radiusY = Math.max(
      3,
      Math.min(Math.floor((height - titleRows) / 2) - 1, 7),
    );
    const draw = (
      node: HierarchyNode,
      start: number,
      end: number,
      depth: number,
    ) => {
      for (let y = centerY - radiusY; y <= centerY + radiusY; y += 1)
        for (let x = centerX - radiusX; x <= centerX + radiusX; x += 1) {
          const dx = (x - centerX) / radiusX;
          const dy = (y - centerY) / radiusY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const ring = Math.floor(distance * maxDepth);
          const angle =
            (Math.atan2(dy, dx) + Math.PI * 2 + Math.PI / 2) % (Math.PI * 2);
          if (ring === depth && angle >= start && angle <= end)
            grid.set(
              x,
              y,
              fills[depth % fills.length] ?? "#",
              "series",
              { foreground: `series${(depth % 4) + 1}` as "series1" },
              { label: node.label, value: nodeWeight(node) },
            );
        }
      let cursor = start;
      const total = node.children.reduce(
        (sum, child) => sum + nodeWeight(child),
        0,
      );
      node.children.forEach((child) => {
        const span = ((end - start) * nodeWeight(child)) / Math.max(1, total);
        draw(child, cursor, cursor + span, depth + 1);
        cursor += span;
      });
    };
    draw(chart.root, 0, Math.PI * 2, 0);
    grid.text(
      centerX - Math.floor(measureText(chart.root.label) / 2),
      centerY,
      chart.root.label,
      "label",
      { foreground: "accent", bold: true },
    );
  }
  const rows = flatten(chart.root);
  const fallback = chart.mode === "flame" ? "Flame graph" : "Sunburst chart";
  const heading = chart.title ?? fallback;
  return grid.build(
    chart.description ?? `${heading}. ${rows.length} weighted hierarchy nodes.`,
    {
      caption: heading,
      columns: [
        { key: "label", label: "Label" },
        { key: "parent", label: "Parent" },
        { key: "depth", label: "Depth" },
        { key: "value", label: "Value" },
      ],
      rows: rows.map(({ node, parent, depth }) => ({
        label: node.label,
        parent,
        depth,
        value: nodeWeight(node),
      })),
    },
  );
}
