import { bar, layout, layoutBar, sparkline } from "@ascii-graphs/core";
import { describe, expect, it } from "vitest";

import { renderHtml } from "./index.js";

describe("renderHtml", () => {
  it("escapes untrusted chart content and includes an accessible table", () => {
    const grid = layoutBar(
      bar({
        title: 'Sales "report" <2026>',
        data: [{ label: "<script>alert(1)</script>", value: 3 }],
      }),
      { width: 36 },
    );
    const html = renderHtml(grid);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Sales &quot;report&quot; &lt;2026&gt;");
    expect(html).toContain("<table");
    expect(html).toContain('aria-hidden="true"');
  });

  it("can render a description-only email fragment", () => {
    const grid = layoutBar(bar({ data: [{ label: "Done", value: 100 }] }));
    const html = renderHtml(grid, {
      accessibility: "description",
      email: true,
    });

    expect(html).toContain('aria-label="Bar chart. Done: 100."');
    expect(html).toContain('data-ascii-graphs-email="true"');
    expect(html).not.toContain("<table");
  });

  it("renders generic multi-column metadata including missing values", () => {
    const html = renderHtml(
      layout(sparkline({ label: "Trend", values: [1, null, 3] })),
    );

    expect(html).toContain("<th>Index</th><th>Value</th>");
    expect(html).toContain('<th scope="row">1</th><td>—</td>');
  });
});
