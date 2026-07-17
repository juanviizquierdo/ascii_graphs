# Contributing

Thanks for helping make portable text charts better.

## Local setup

1. Install Node 20 or newer and pnpm.
2. Run `pnpm install`.
3. Run `pnpm check` before submitting a pull request.

## Architecture rules

- Chart modules validate and normalize input, then produce a semantic
  `CellGrid`.
- Core code must not import Node built-ins, DOM APIs, ANSI utilities, or
  renderers.
- Renderers consume a grid; they do not recompute chart geometry.
- Every visual output change requires a reviewed snapshot or focused assertion.
- Labels and titles must be treated as untrusted by markup renderers.
- Width means terminal display columns, not UTF-16 code units.
- Titles and labels may not contain control or bidirectional formatting
  characters.
- Color must be expressed as a semantic token in core; raw ANSI and CSS values
  belong in their renderers.

## Pull requests

Keep changes focused. Describe the user-visible behavior, compatibility impact,
and tests you added. New chart types should include narrow-width, empty-data,
negative-value, and Unicode-label fixtures where applicable.

API proposals and substantial visual changes should begin as a GitHub Discussion
or design issue so maintainers can agree on the contract before implementation.
