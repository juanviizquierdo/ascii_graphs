# frozen_string_literal: true

# Call ASCII Graphs from Ruby through its JSON stdin bridge.
require "json"
require "open3"

request = {
  chart: {
    type: "heatmap",
    title: "Ruby job activity",
    columns: %w[Mon Tue Wed Thu Fri],
    rows: [
      { label: "Mail", values: [2, 5, 8, 4, 6] },
      { label: "Sync", values: [1, 3, 7, 9, 5] }
    ]
  },
  layout: { width: 48, charset: "unicode" },
  output: { format: "text" }
}

bridge = File.join(__dir__, "render-json.mjs")
stdout, stderr, status = Open3.capture3("node", bridge, stdin_data: JSON.generate(request))
abort(stderr) unless status.success?
print(stdout)
