import { bar, layoutBar } from "@ascii-graphs/core";
import { describe, expect, it } from "vitest";

import { renderText } from "./index.js";

describe("renderText", () => {
  const grid = layoutBar(
    bar({ data: [{ label: "A", value: 10 }], width: 20 }),
    { charset: "ascii" },
  );

  it("strips trailing whitespace by default", () => {
    const output = renderText(grid);
    expect(output).toBe("A |############## 10");
    expect(output).not.toContain(String.fromCharCode(27));
  });

  it("can preserve the fixed-width grid and add a final newline", () => {
    const output = renderText(grid, {
      trimTrailingWhitespace: false,
      finalNewline: true,
    });
    expect(output).toHaveLength(21);
    expect(output.endsWith("\n")).toBe(true);
  });
});
