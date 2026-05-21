# v7 cache-bust source review

## Source of truth

`scripts/cachebust.js` writes `?v=` query strings for local CSS and JS references in HTML.

The script runs as part of `npm run build` after:

- `scripts/minify.js`
- `scripts/bundle.js`
- `scripts/update-html-bundles.js`
- `scripts/apply-og-fallbacks.js`

`npm run build:deploy` runs `npm run build` and then `scripts/build-dist.js`.

## How versions are generated

The cache-bust value is deterministic:

- It reads the referenced asset file.
- It normalizes line endings.
- It hashes the content with MD5.
- It uses the first 8 hex characters.

It is not timestamp-based, random, or current-time-based.

## Current global CSS cache-bust values

- `global.min.css`: `98898086` to `e7ad73c8`
- `global.css`: `4b86b610` to `8ba19bad`

These values match content-hash cache busting after the staged CSS change.

## Risk

The mechanism itself is stable, but v7 found an unexpected active build/cachebust process during the sprint. That means the current generated/static churn may have been modified while the cleanup analysis was running.

## Conclusion

The cache-bust system is deterministic and suitable for release, but the current working tree should be treated as unsafe for automatic cleanup because the v6 CSS fix is still staged and a build/cachebust process ran during v7.
