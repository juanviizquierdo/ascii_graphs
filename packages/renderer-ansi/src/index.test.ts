import { bar, layout, sparkline } from "@ascii-graphs/core";
import { describe, expect, it } from "vitest";

import { detectColorLevel, renderAnsi } from "./index.js";

const ESCAPE = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESCAPE}\\[[0-9;]*m`, "gu");

describe("renderAnsi", () => {
  const grid = layout(
    bar({ data: [{ label: "Sales", value: 10 }], width: 20 }),
    { charset: "ascii" },
  );

  it("matches plain text exactly at color level zero", () => {
    expect(renderAnsi(grid, { colorLevel: 0 })).toBe("Sales |########## 10");
  });

  it("styles semantic cells and always resets the line", () => {
    const output = renderAnsi(grid, { colorLevel: 3 });
    expect(output).toContain(`${ESCAPE}[38;2;113;113;122m|`);
    expect(output).toContain(`${ESCAPE}[38;2;21;128;61m##########`);
    expect(output.replace(ANSI_PATTERN, "")).toBe("Sales |########## 10");
    expect(output.endsWith(`${ESCAPE}[0m`)).toBe(false);
  });

  it("renders sparkline series with the first series token", () => {
    const output = renderAnsi(layout(sparkline({ values: [1, 2, 3] })), {
      colorLevel: 1,
    });
    expect(output).toContain(`${ESCAPE}[96m`);
    expect(output.replace(ANSI_PATTERN, "")).toBe("▁▄█");
  });

  it("rejects control characters in hand-built grids", () => {
    const unsafe = structuredClone(grid);
    const first = unsafe.rows[0]?.[0];
    if (first !== undefined) first.glyph = `${ESCAPE}[31m`;
    expect(() => renderAnsi(unsafe)).toThrow("terminal control characters");
  });
});

describe("detectColorLevel", () => {
  it.each([
    [{ isTTY: false }, 0],
    [{ isTTY: true, env: { NO_COLOR: "" } }, 0],
    [{ isTTY: true, env: { TERM: "xterm-256color" } }, 2],
    [{ isTTY: true, env: { COLORTERM: "truecolor" } }, 3],
    [{ isTTY: false, env: { FORCE_COLOR: "3" } }, 3],
    [{ isTTY: true, env: { FORCE_COLOR: "0" } }, 0],
  ])("detects capability for environment %#", (environment, expected) => {
    expect(detectColorLevel(environment)).toBe(expected);
  });
});
