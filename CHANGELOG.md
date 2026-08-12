# Changelog

All notable changes to this project will be documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases will use
[Semantic Versioning](https://semver.org/) after version 1.0.

## [Unreleased]

### Added

- Twenty-two distinct additional chart types spanning streamgraphs, Hovmöller
  diagrams, Sankey timelines, slopegraphs, Marimekko timelines, Voronoi maps,
  small multiples, clustered and heatmap dendrograms, confusion matrices,
  lift/gains, forest and Bland–Altman plots, queue timelines, critical paths,
  spectrograms, waveforms, footprints, Renko, Kagi, cartograms, and transit
  maps.
- Twenty-five creative chart types: bump, fan, raincloud, UpSet,
  point-and-figure, wind rose, polar area, ternary, contour, adjacency matrix,
  arc diagram, survival, ROC/precision-recall, calibration, SLO error budget,
  cumulative flow, burndown/burnup, market profile/TPO, order-book depth,
  barcode/event, spiral timeline, world choropleth, migration flow, hex-tile,
  and dot-density maps. All include ASCII/Unicode layouts and accessible source
  tables.
- Six responsive continent maps with country-level boundaries, ISO-style value
  lookup, missing-data texture, visual markers, and accessible legends.
- Responsive country-map atlases with eight built-in Natural Earth silhouettes,
  country-level values, monochrome textures, and accessible comparison tables.
- ECharts-inspired gauge, centered theme-river, pictorial-bar, raster
  choropleth-map, and directed coordinate route-map charts.
- Ridgeline plots with shared-scale density profiles for multiple distributions.
- Hexbin plots with staggered density aggregation for crowded point data.
- Statistical control charts with automatic or explicit center and control
  limits, including out-of-control markers.
- Mosaic/Marimekko charts encoding group totals by width and composition by
  segment height.
- Chord diagrams with weighted directed relationships and accessible edge
  tables.
- Configurable funnel/pyramid legend position and semantic color, configurable
  multi-line legend position/color, and bounded HTML font sizing and line
  height.

### Changed

- Consolidated eight duplicate experimental chart names into established
  families: survival, control, ridgeline, heatmap/calendar, timeline,
  candlestick, contour, and network. The remaining advanced charts now use
  chart-specific geometry instead of shared placeholder layouts.
- Radar charts now use a layered spider web, filled high-contrast data polygon,
  collision-free outer labels, and responsive plot gutters.
- Choropleth maps now scale their source rasters, separate regions with
  map-specific density textures, mark region centroids, and include a readable
  region key.
- Line, step, and multi-line charts now use continuous box-drawing paths with
  explicit corners and junctions.
- Sankey/alluvial layouts now position source and target nodes independently and
  route weighted fan-in/fan-out movement between them.

## [0.1.0-alpha.0] - 2026-07-18

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
- Vertical column charts with mixed-sign baselines and responsive categorical
  labels.
- Categorical status grids with ASCII/Unicode shapes, semantic colors, legends,
  aggregate descriptions, and accessible matrix tables.
- Connected line charts with labelled bounds, explicit missing-value gaps,
  responsive plotting, and deterministic peak-preserving downsampling.
- Scatter plots with labelled numeric points, automatic or explicit domains,
  collision markers, responsive axes, and accessible coordinate tables.
- Histograms with deterministic numeric binning, responsive columns, range
  labels, and accessible frequency tables.
- Filled area charts with explicit missing-value gaps and peak-preserving
  downsampling.
- Box plots with interpolated quartiles, comparison scales, and statistical
  summary tables.
- Proportional stacked bars with shape-distinct segments, legends, and matrix
  tables.
- Donut charts with monochrome-safe slice markers, compact legends, percentage
  descriptions, and accessible tables.
- Grouped bars with shared scales, shape-distinct series, legends, and matrix
  tables.
- Waterfall charts with running totals, positive/negative changes, and optional
  final totals.
- Bullet charts with qualitative ranges, actual values, target markers, and
  accessible objective tables.
- Candlestick charts with validated OHLC invariants, rising/falling semantics,
  and source-data tables.
- Gantt timelines with bounded task ranges, completion fills, and accessible
  schedule metadata.
- Multi-series line and stacked-area charts with monochrome-safe series marks.
- Range/dumbbell, lollipop, and step charts with accessible source tables.
- Error-bar and confidence-interval charts with validated bounds and accessible
  estimate tables.
- Density, violin, strip, beeswarm, empirical CDF, and Q-Q distribution modes
  with responsive ASCII/Unicode layouts.
- Diverging Likert stacks, filled pie mode, treemaps, waffles, funnel/pyramid
  stages, and Pareto charts with source-data tables.
- Calendar heatmaps, folded horizon bands, and unified event/range timelines.
- Bubble, connected-scatter, correlation-matrix, radar, parallel-coordinate,
  Sankey, and alluvial relationship charts.
- Tree/org/dependency hierarchy modes, network graphs, and flame/sunburst
  hierarchy partitions.
- Executable CLI and browser galleries covering every current chart type,
  character modes, responsive widths, and HTML themes.
