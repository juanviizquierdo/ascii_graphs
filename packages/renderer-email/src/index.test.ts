import { layout, progress } from "@ascii-graphs/core";
import { describe, expect, it } from "vitest";

import { renderEmailParts } from "./index.js";

describe("renderEmailParts", () => {
  const grid = layout(
    progress({
      title: "Release status",
      data: [{ label: "Build", value: 72, target: 80 }],
    }),
    { width: 36, charset: "ascii" },
  );

  it("returns matching plain-text and accessible HTML parts", () => {
    const parts = renderEmailParts(grid);

    expect(parts.text).toContain("Build [");
    expect(parts.text).toContain("72%");
    expect(parts.text).not.toContain(String.fromCharCode(27));
    expect(parts.html).toContain('data-ascii-graphs-email="true"');
    expect(parts.html).toContain("<table");
    expect(parts.html).toContain("Release status");
    expect(Object.isFrozen(parts)).toBe(true);
  });

  it("forwards renderer-specific options without allowing email mode off", () => {
    const parts = renderEmailParts(grid, {
      text: { finalNewline: true },
      html: { accessibility: "description" },
    });

    expect(parts.text.endsWith("\n")).toBe(true);
    expect(parts.html).not.toContain("<table");
    expect(parts.html).toContain('data-ascii-graphs-email="true"');
  });
});
