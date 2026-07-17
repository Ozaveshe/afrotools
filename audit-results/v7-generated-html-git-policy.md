# v7 generated HTML git policy

## Observed repo convention

- Root/static HTML files are tracked in git.
- `dist/` is ignored and has no tracked files.
- Netlify publishes `dist/`, not the repo root.
- `npm run build:deploy` runs the full source/build mutation pipeline and then copies the publishable artifact into `dist/`.
- `docs/release-checklist.md` says full rebuild or shared asset changes should run `npm run build`, `npm run build:deploy`, and `npm test`.
- `docs/known-traps.md` says the repo is static-first but has a generated layer, and several scripts mutate outputs during build and maintenance.

## Does generated HTML belong in git?

Yes, for root/static HTML. The repo tracks the built/static HTML layer, while `dist/` is the untracked deploy artifact.

## Should `global.min.css?v=` query updates be committed?

Usually yes when the related CSS asset change is committed and the cache-bust diffs are produced by the deterministic build pipeline. They should be separated from source changes in a generated-output commit.

## Are the current 7,942 HTML files reviewable as one generated-output commit?

Not yet.

The current HTML churn is mostly reviewable generated cache-bust output, but it is mixed with two non-cache-bust HTML outliers:

- `tools/cv-builder/index.html`
- `tools/study-abroad-cost/index.html`

The v6 CSS fix also remains staged rather than committed, and an unexpected build/cachebust process ran during v7.

## Are the HTML files safe to revert?

Not automatically. The cache-bust diffs are likely required for the staged CSS fix to reach users without stale cached CSS after that CSS fix is committed. Reverting all HTML churn would be safe only if the maintainer chooses to rely on Netlify rebuild output and not commit generated root HTML, which does not match current repo convention.

## Policy conclusion

Generated root HTML belongs in git here, but only as a separate generated-output commit after the reviewed source/CSS change is committed and the two non-cache-bust outliers are handled separately.
