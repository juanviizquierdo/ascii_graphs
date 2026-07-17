# Changelog

All notable changes to this project will be documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases will use
[Semantic Versioning](https://semver.org/) after version 1.0.

## [Unreleased]

### Added

- Target-neutral semantic cell grid.
- Validated horizontal bar chart layout with mixed-sign support.
- ASCII and Unicode plain-text renderer.
- Escaped, accessible HTML and email renderer.
- Generic chart dispatch, linear scales, shared validation, and semantic
  character palettes.
- Sparkline charts with missing values and deterministic peak-preserving
  downsampling.
- ANSI renderer with 16-color, 256-color, true-color, `NO_COLOR`, and
  `FORCE_COLOR` support.
- Control-character rejection and bounded grid allocation.
- Multi-row progress charts with per-row ranges, optional target markers,
  overflow clamping, and accessible percentage metadata.
- Dedicated email renderer producing matching plain-text and inline-style HTML
  parts.
- Numeric heatmaps with rectangular-matrix validation, custom domains, missing
  cells, density legends, responsive cell widths, and accessible matrix tables.
