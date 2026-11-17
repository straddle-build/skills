# Check skills against the public API

Run from the repository root with Bun 1.3.8:

```sh
bun scripts/check-api-drift.ts
bun test tests/api-drift.test.ts
```

The check reads the public current contract from
[Scalar Registry](https://registry.scalar.com/@straddle/apis/straddle-api?format=yaml).
No credentials, private checkout, or hand-copied spec are needed. In the contract
repository, `.github/workflows/contract.yml` publishes immutable public versions
under `@straddle/straddle-api` on `contract-v*` tags, retrieves their public bytes,
and checks that the release is current. The unversioned URL above currently serves
1.0.4. Authored changes in the contract repository may be newer than that release.

To check an exact published version, or a local candidate spec:

```sh
bun scripts/check-api-drift.ts --contract-version 1.0.4
bun scripts/check-api-drift.ts --spec /tmp/candidate.openapi.yaml
```

The checker reports each finding as `file:line: what to update`, and exits 1 when
there is drift or a registry cannot be read. Missing approval entries point to
the table header where a row must be added; existing references point to their
own lines. It never edits a skill, adds an approval, or updates a pin.

## What is checked

- Every POST, PUT, PATCH and DELETE operation, plus any operation whose path or
  operation ID includes `unmask` or `reveal`, must be in the approval table in
  `skills/straddle-best-practices/references/writes-and-approval.md`.
  Every existing table entry must still name an operation and its operation ID.
- All files under `skills/` are scanned for standalone `/v1/...` references,
  with or without an HTTP method, including tables and code fences. A method
  must exist on that exact path. Path placeholders and query-string parameter
  names must exist on that operation, resolving local OpenAPI references and
  path-level parameters. Embedded fragments such as a provider's
  `api/v1/echeck/` or a URL on another host are outside this path syntax.
- Bare parameter names and schema fields in inline backticks are identified
  against the immutable public contract pinned by `kit/release-inputs.json`.
  They must still exist in the current contract. This historical baseline is
  necessary: classifying names using only the current contract would silently
  ignore a deleted name. Dotted fields are checked by their individual names;
  prose without an explicit route is checked globally, rather than inferring
  which operation it means. Internal skill markers and third-party vocabulary
  absent from the baseline are outside this classification. When reviewing a
  contract-pin change, run against the previous baseline as well:
  `--baseline-spec /tmp/previous.openapi.yaml`.
- Generated SDK pins in skill version tables, `kit/release-inputs.json` and
  `kit/manifest.yaml` are compared with the published versions on npm, PyPI,
  RubyGems, NuGet (stable releases), and the Go module proxy. Historical SDK
  source observations elsewhere in the skills are evidence, rather than pins.
  Numeric semantic versions are compared, including Go's `v` prefix and
  prereleases. Stale pins are reported at every pinned location, never bumped.

The CLI and wizard repositories are still unchecked. This workflow reads only
this repository; neither the CLI nor the wizard is part of its scan.

## CI and publication triggers

`.github/workflows/api-drift.yml` runs on every pull request. It also accepts
`workflow_dispatch` with optional input `contract_version`, and
`repository_dispatch` with event type `api-contract-published` and optional
`client_payload.contract_version`:

```json
{
  "event_type": "api-contract-published",
  "client_payload": { "contract_version": "1.0.4" }
}
```

Omitting the version checks the public current contract. A supplied version
must be `X.Y.Z` and match the retrieved document's `info.version`. Registry
requests have a 60-second timeout and the CI job has a five-minute timeout.
The publication caller needs permission to dispatch this repository's workflow.
This change provides the receiving trigger; it does not modify the contract
repository's publication pipeline or arrange an automatic dispatch there.

Existing approval drift makes the new CI job fail until the approval list is
updated separately. No baseline allowlist suppresses those findings.
