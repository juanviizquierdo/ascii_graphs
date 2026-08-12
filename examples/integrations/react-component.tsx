import { useMemo } from "react";

import { layout, progress } from "@ascii-graphs/core";
import { renderHtml } from "@ascii-graphs/renderer-html";

export interface ReleaseProgressProps {
  readonly build: number;
  readonly tests: number;
  readonly docs: number;
}

export function ReleaseProgress({ build, tests, docs }: ReleaseProgressProps) {
  const markup = useMemo(() => {
    const grid = layout(
      progress({
        title: "Release readiness",
        data: [
          { label: "Build", value: build, target: 100 },
          { label: "Tests", value: tests, target: 100 },
          { label: "Docs", value: docs, target: 100 },
        ],
      }),
      { width: 44 },
    );
    return renderHtml(grid, { accessibility: "both", fontSize: 13 });
  }, [build, docs, tests]);

  // renderHtml escapes chart content and includes a screen-reader data table.
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
