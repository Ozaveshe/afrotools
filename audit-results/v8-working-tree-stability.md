# v8 working tree stability

## Snapshot result

FAILED.

Three snapshots were taken after stopping the first build process tree:

- `audit-results/v8-stability-snapshot-1.txt`
- `audit-results/v8-stability-snapshot-2.txt`
- `audit-results/v8-stability-snapshot-3.txt`

Counts:

| Snapshot | Status entries | Unstaged name-status entries | Cached entries | Cached files | Related tools changed | CV screenshot dir present |
|---:|---:|---:|---:|---|---|---|
| 1 | 8072 | 7948 | 2 | `assets/css/global.css`, `assets/css/global.min.css` | yes | no |
| 2 | 8073 | 7947 | 2 | `assets/css/global.css`, `assets/css/global.min.css` | no | yes |
| 3 | 8072 | 7947 | 2 | `assets/css/global.css`, `assets/css/global.min.css` | no | yes |

Evidence:

- `audit-results/v8-stability-counts.json`
- `audit-results/v8-stability-snapshot-hashes.json`

## What changed between snapshots

- `assets/js/components/related-tools-data.js` disappeared from the unstaged diff after snapshot 1.
- `audit-results/cv-builder-export-empty-preview-polish-screens/` appeared as an untracked directory after snapshot 1.
- A hidden monitored `npm run build` process was found after the instability and stopped.

## Required gate

The user requirement was: if snapshots differ, do not commit and return `NOT SAFE TO COMMIT`.

## Verdict

NOT SAFE TO COMMIT.
