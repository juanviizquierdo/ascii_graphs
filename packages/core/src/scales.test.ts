import { describe, expect, it } from "vitest";

import { linearScale } from "./index.js";

describe("linearScale", () => {
  it("maps domain endpoints and midpoint", () => {
    const scale = linearScale(-10, 10, 0, 40);
    expect(scale.map(-10)).toBe(0);
    expect(scale.map(0)).toBe(20);
    expect(scale.map(10)).toBe(40);
  });

  it("maps a constant domain to the range midpoint", () => {
    expect(linearScale(5, 5, 0, 10).map(5)).toBe(5);
  });
});
