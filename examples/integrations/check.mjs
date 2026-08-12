import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL(".", import.meta.url));
const bridge = fileURLToPath(new URL("render-json.mjs", import.meta.url));
const fixture = await readFile(new URL("chart.json", import.meta.url), "utf8");

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: directory,
    encoding: "utf8",
    ...options,
  });
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} exited with ${result.status}`);
  }
  return result.stdout;
}

const text = run(process.execPath, [bridge], { input: fixture });
if (!text.includes("Deployments by region") || !text.includes("Europe")) {
  throw new Error("JSON bridge did not render the expected text chart.");
}

const htmlRequest = JSON.parse(fixture);
htmlRequest.output.format = "html";
const html = run(process.execPath, [bridge], {
  input: JSON.stringify(htmlRequest),
});
if (!html.includes("<figure") || !html.includes("<table")) {
  throw new Error("JSON bridge did not render accessible HTML.");
}

for (const file of ["node-cli.mjs", "email-report.mjs", "http-server.mjs"]) {
  run(process.execPath, ["--check", file]);
}

process.stdout.write(
  "Verified JSON, CLI, email, browser-server, and HTML integration examples.\n",
);
