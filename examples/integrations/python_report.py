"""Call ASCII Graphs from Python through its JSON stdin bridge."""

import json
import subprocess
from pathlib import Path

bridge = Path(__file__).with_name("render-json.mjs")
request = {
    "chart": {
        "type": "line",
        "title": "Python worker latency",
        "label": "p95 ms",
        "values": [18, 22, 19, 31, 27, 35, 29],
    },
    "layout": {"width": 48, "charset": "unicode"},
    "output": {"format": "text"},
}

result = subprocess.run(
    ["node", str(bridge)],
    input=json.dumps(request),
    text=True,
    capture_output=True,
    check=True,
)
print(result.stdout, end="")
