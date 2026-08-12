import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { gunzipSync } from "node:zlib";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const packageDirectories = [
  "packages/core",
  "packages/renderer-text",
  "packages/renderer-ansi",
  "packages/renderer-html",
  "packages/renderer-email",
];
const requiredFiles = new Set([
  "LICENSE",
  "README.md",
  "dist/index.d.ts",
  "dist/index.js",
  "package.json",
]);
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function fail(message) {
  throw new Error(`Package verification failed: ${message}`);
}

function parsePackJson(output) {
  const marker = output.lastIndexOf("\n{");
  const start = marker === -1 ? output.indexOf("{") : marker + 1;
  if (start === -1) fail("pnpm pack did not return JSON metadata.");
  return JSON.parse(output.slice(start));
}

function readTarEntry(archivePath, wantedPath) {
  const archive = gunzipSync(readFileSync(archivePath));
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/u, "");
    if (name === "") break;
    const sizeText = header
      .subarray(124, 136)
      .toString("ascii")
      .replace(/\0.*$/u, "")
      .trim();
    const size = Number.parseInt(sizeText || "0", 8);
    const dataStart = offset + 512;
    if (name === wantedPath) {
      return archive.subarray(dataStart, dataStart + size).toString("utf8");
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  fail(`${wantedPath} is missing from ${basename(archivePath)}.`);
}

function validateManifest(manifest, expectedVersion) {
  if (manifest.version !== expectedVersion)
    fail(`${manifest.name} packed with version ${manifest.version}.`);
  if (manifest.license !== "MIT") fail(`${manifest.name} must use MIT.`);
  if (manifest.engines?.node !== ">=20")
    fail(`${manifest.name} must declare Node >=20.`);
  if (manifest.publishConfig?.access !== "public")
    fail(`${manifest.name} must publish publicly.`);
  if (manifest.publishConfig?.tag !== "next")
    fail(`${manifest.name} prereleases must default to the next tag.`);
  if (manifest.publishConfig?.provenance !== true)
    fail(`${manifest.name} must enable provenance.`);
  if (manifest.main !== "./dist/index.js")
    fail(`${manifest.name} has an unexpected main entry point.`);
  if (manifest.types !== "./dist/index.d.ts")
    fail(`${manifest.name} has an unexpected types entry point.`);

  for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
    if (name.startsWith("@ascii-graphs/") && version !== expectedVersion) {
      fail(
        `${manifest.name} packed internal dependency ${name} as ${version}.`,
      );
    }
    if (String(version).startsWith("workspace:")) {
      fail(`${manifest.name} contains an unresolved workspace dependency.`);
    }
  }
}

const manifests = packageDirectories.map((directory) =>
  JSON.parse(
    readFileSync(join(workspaceRoot, directory, "package.json"), "utf8"),
  ),
);
const versions = new Set(manifests.map(({ version }) => version));
if (versions.size !== 1) fail("all public packages must share one version.");
const version = manifests[0]?.version;
if (typeof version !== "string") fail("the package version is missing.");

const temporaryDirectory = mkdtempSync(join(tmpdir(), "ascii-graphs-pack-"));
try {
  for (const directory of packageDirectories) {
    const output = execFileSync(
      pnpm,
      [
        "--dir",
        directory,
        "pack",
        "--pack-destination",
        temporaryDirectory,
        "--json",
      ],
      { cwd: workspaceRoot, encoding: "utf8" },
    );
    const metadata = parsePackJson(output);
    const paths = new Set(metadata.files.map(({ path }) => path));
    for (const required of requiredFiles) {
      if (!paths.has(required))
        fail(`${metadata.name} is missing ${required}.`);
    }
    for (const path of paths) {
      if (path.startsWith("src/") || /(?:^|\/)\w+\.test\./u.test(path))
        fail(`${metadata.name} unexpectedly packs ${path}.`);
    }
    const archivePath = join(temporaryDirectory, basename(metadata.filename));
    const packedManifest = JSON.parse(
      readTarEntry(archivePath, "package/package.json"),
    );
    validateManifest(packedManifest, version);
    const kilobytes = Math.ceil(statSync(archivePath).size / 1024);
    process.stdout.write(
      `✓ ${metadata.name}@${metadata.version}: ${paths.size} files, ${kilobytes} kB\n`,
    );
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

process.stdout.write(
  `Verified ${packageDirectories.length} publishable packages.\n`,
);
