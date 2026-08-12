#!/bin/sh
set -eu

example_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

node "$example_dir/render-json.mjs" <<'JSON'
{
  "chart": {
    "type": "bar",
    "title": "Shell deployment report",
    "data": [
      { "label": "Success", "value": 38 },
      { "label": "Failed", "value": -4 }
    ]
  },
  "layout": { "width": 42, "charset": "ascii" },
  "output": { "format": "text" }
}
JSON
