import { describe, expect, it } from "vitest";
import { candlestick, layoutCandlestick } from "./index.js";

const text = (grid: ReturnType<typeof layoutCandlestick>) =>
  grid.rows.map((row) => row.map(({ glyph }) => glyph).join("")).join("\n");

describe("candlestick", () => {
  it("freezes valid OHLC data", () => {
    const chart = candlestick({
      data: [{ label: "Mon", open: 10, high: 14, low: 8, close: 12 }],
    });
    expect(Object.isFrozen(chart.data[0])).toBe(true);
  });

  it("rejects impossible OHLC ranges", () => {
    expect(() =>
      candlestick({
        data: [{ label: "Mon", open: 10, high: 11, low: 8, close: 12 }],
      }),
    ).toThrow("low <= open/close <= high");
  });

  it("renders rising and falling candles with source tables", () => {
    const grid = layoutCandlestick(
      candlestick({
        data: [
          { label: "M", open: 10, high: 14, low: 8, close: 12 },
          { label: "T", open: 12, high: 13, low: 7, close: 9 },
        ],
      }),
      { width: 30, height: 9, charset: "ascii" },
    );
    expect(text(grid)).toContain("#");
    expect(text(grid)).toContain("x");
    expect(text(grid)).toContain("|");
    expect(grid.table.rows[1]).toEqual({
      label: "T",
      open: 12,
      high: 13,
      low: 7,
      close: 9,
    });
  });
});
