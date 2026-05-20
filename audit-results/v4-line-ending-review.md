# V4 Line Ending Review

## Files Investigated

- `netlify.toml`
- `scripts/update-html-bundles.js`

## Findings

`.gitattributes` already contains:

```text
* text=auto eol=lf
```

`git ls-files --eol` reports:

- `netlify.toml`: index LF, worktree CRLF, attr `text=auto eol=lf`
- `scripts/update-html-bundles.js`: index LF, worktree mixed, attr `text=auto eol=lf`

Current v4 `git diff --check` passes after the generated mobile-network markdown trailing blank line was fixed.

## Decision

Leave line endings documented as non-blocking. Do not normalize these files in v4 because:

- They are not dirty in the current packaging diff.
- Normalization would cause avoidable full-file churn.
- `.gitattributes` already states the intended LF policy.

Recommended future cleanup:

```bash
git add --renormalize netlify.toml scripts/update-html-bundles.js
git diff --check
```

Run that as a dedicated line-ending commit only.
