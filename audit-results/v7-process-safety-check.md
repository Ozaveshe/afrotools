# v7 process safety check

## Result

Not safe to proceed with generated-output cleanup until the index and working tree are explicitly stabilized by a human.

## Processes observed

- Two local `http-server` Node processes were running against this repo on ports 4181 and 4183. These are read-only static servers and were not treated as working-tree mutation risks.
- SimbiOS Node/Next processes were running outside this repo. These were unrelated.
- Adobe and Codex helper Node processes were running. These were unrelated.
- Unexpected `npm run build` processes were observed in this repo, including child build steps `node scripts/cachebust.js`, `node scripts/inject-internal-links.js`, and `node scripts/seo-daily-fix.js`. These could mutate thousands of generated/static HTML files.
- After being stopped, another repo-local `npm run build` / `node scripts/cachebust.js` pair appeared and was stopped as well.
- An unexpected `git add -u` process was observed after stopping the build. It could have staged broad generated churn.

## Actions taken

- Stopped the observed `npm run build`, `scripts/cachebust.js`, `scripts/inject-internal-links.js`, and `scripts/seo-daily-fix.js` processes for this repo when found.
- Checked the cached diff after the observed `git add -u`; the index still contained only:
  - `assets/css/global.css`
  - `assets/css/global.min.css`
- Did not run any build command.
- Did not use broad restore/reset/clean commands.
- Did not stage or commit anything.

## Safety conclusion

The working tree was subject to unexpected mutation during v7, and the build process restarted after being stopped. Cleanup should not proceed automatically from this state. The safe path is to stop the external process source, commit or unstage the reviewed v6 CSS patch first, then rerun the generated-output decision from a stable index.
