import { layoutBar } from "./bar.js";
import { layoutProgress } from "./progress.js";
import { layoutSparkline } from "./sparkline.js";

import type { CellGrid, Chart, LayoutOptions } from "./types.js";

export function layout(chart: Chart, options: LayoutOptions = {}): CellGrid {
  switch (chart.type) {
    case "bar":
      return layoutBar(chart, options);
    case "sparkline":
      return layoutSparkline(chart, options);
    case "progress":
      return layoutProgress(chart, options);
    default: {
      const unreachable: never = chart;
      throw new TypeError(
        `Unsupported chart type: ${String((unreachable as { type?: unknown }).type)}`,
      );
    }
  }
}
