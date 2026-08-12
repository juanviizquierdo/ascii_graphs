# Releasing ASCII Graphs

All five public packages use one version and are published under the
`@ascii-graphs` npm scope. Prereleases use the `next` distribution tag so an
alpha can never replace `latest` accidentally.

## One-time setup

1. Create or gain publish access to the `@ascii-graphs` organization on npm.
2. Add the repository's final Git remote and update every package manifest with
   `repository`, `homepage`, and `bugs` URLs.
3. Protect the `npm` GitHub environment with required reviewers.
4. Bootstrap the first package versions with a granular npm automation token.
   After the packages exist, configure npm trusted publishing for this GitHub
   repository and the `release.yml` workflow, then remove the token.

Package-name lookup returned `E404` for `@ascii-graphs/core` on 2026-07-18. That
means the package is not public, but it does not prove the current npm account
owns the scope.

## Release checklist

1. Start from a clean, reviewed commit on `main`.
2. Keep the root and all package versions identical.
3. Move user-visible changes from `Unreleased` into a dated release section.
4. Install exactly what the lockfile declares:

   ```sh
   pnpm install --frozen-lockfile
   ```

5. Run the complete source, build, example, and tarball checks:

   ```sh
   pnpm release:check
   pnpm release:dry-run
   ```

6. Confirm every dry-run package uses the intended version and `next` tag.
7. Create an annotated tag such as `v0.1.0-alpha.0` and push it.
8. Run the GitHub `Release` workflow with `dry_run` enabled first. Re-run with
   `dry_run` disabled only after reviewing the output and approving the `npm`
   environment. A publishing run refuses to proceed unless the selected Git ref
   is the tag matching the root package version.

## First manual publication

Trusted publishing can only be attached after the npm packages exist. For the
first release, authenticate with a short-lived granular token that has access
only to the `@ascii-graphs` scope, then run:

```sh
pnpm release:check
pnpm -r publish --tag next --access public --provenance --no-git-checks
```

Revoke the bootstrap token immediately, configure trusted publishing, and use
the GitHub workflow for later releases.

## Verify the registry

```sh
npm view @ascii-graphs/core@next version dist.tarball dist.integrity
npm view @ascii-graphs/renderer-text@next dependencies
npm view @ascii-graphs/renderer-ansi@next dependencies
npm view @ascii-graphs/renderer-html@next dependencies
npm view @ascii-graphs/renderer-email@next dependencies
```

Install the packages in an empty project and run one text and one HTML example
before announcing the release.

Promote a stable version only after the alpha API has been exercised:

```sh
npm dist-tag add @ascii-graphs/core@<stable-version> latest
```

Repeat the promotion for every package at the same stable version.
