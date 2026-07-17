# AfroTools v8c Phantom File Provenance Report

Prepared: 2026-05-20T23:54:10.9494773+05:00

## Final Verdict
NOT SAFE TO COMMIT

v8c did not prove a stable enough tree to rerun the v8b CSS commit. The original scholarship phantom file was inspected and classified, and the 60-second watcher was clean, but the v8c stability snapshots did not match: the untracked/source-like inventory changed around tools/cv-builder/css/cv-completion-flow-fix.css.

## Phantom File State
- Still exists: True
- Path: C:\Users\Oza\Documents\afrotools\tools\scholarship-finder\scholarship-study-context-bridge.js
- Size: 14491 bytes
- Creation time: 05/20/2026 23:40:15
- Last write time: 05/20/2026 23:40:15
- Last access time: 05/20/2026 23:47:31
- SHA256: 4391CB81A65860238380EE0C7FA1F41588E7B845128DFBC502E3C059AB675944
- Summary: minified browser-side JavaScript for Scholarship Finder/Study Abroad context bridging. It references AfroProductBackbone, localStorage, analytics, filters, checklist UI, and scholarship context handoff behavior.
- Production effect: yes, if included. It is linked by tools/scholarship-finder/index.html, but the asset itself is untracked.

## Git History and References
- Tracked by git: False
- Has git history: False
- Exact tracked references: 2
  - tools/scholarship-finder/index.html:19:<link rel="stylesheet" href="/tools/scholarship-finder/scholarship-study-context-bridge.css?v=3d7a72bb">
  - tools/scholarship-finder/index.html:26:<script src="/tools/scholarship-finder/scholarship-study-context-bridge.js?v=44591a32" defer></script>
- Ignored: no, based on git check-ignore in audit-results/v8c-phantom-file-reference-check.md.

## Classification
B. LEGITIMATE PRODUCT FILE REQUIRING MANUAL REVIEW

Reason: the file is production-looking JavaScript, linked from a tracked page, and has no git history. It also belongs to the Scholarship Finder / Study Abroad / product-backbone manual-review surface, not the CSS view-transition fix.

## Process and Supervisor Check
- Repo-local mutating process count: 0.
- PowerShell jobs: 0.
- Relevant scheduled tasks: 0.
- No active cachebust, inject-internal-links, seo-daily-fix, npm build, git add, git restore, or build:deploy process was found.

## Filesystem Watcher Result
- 60-second watcher completed.
- Captured events: 0.
- Unexpected source/tool/script events: 0.
- Staged CSS pair remained intact during the watcher review.

## Stability Snapshots
- Snapshots matched: false.
- Snapshot counts from audit-results/v8c-stability-review.md:
  - S1: status 8178, cached 2, name-status 7948, name-only 7948, untracked 294, source-like 11, mutators 0.
  - S2: status 8179, cached 2, name-status 7948, name-only 7948, untracked 294, source-like 11, mutators 0.
  - S3: status 8179, cached 2, name-status 7948, name-only 7948, untracked 293, source-like 10, mutators 0.
- Drift investigation: tools/cv-builder/css/cv-completion-flow-fix.css appeared in status between S1 and S2, and the source-like untracked list changed by S3.

## Current Staged State
- Staged files remain exactly the two CSS files: True
- Generated HTML staged count: 0
```
M	assets/css/global.css
M	assets/css/global.min.css
```

## Current Source-like Untracked Review Queue
These are not staged and were not modified by v8c:
```
tools/cv-builder/css/cv-export-empty-polish.css
tools/cv-builder/css/cv-layout-decongestion.css
tools/cv-builder/js/cv-completion-flow-fix.js
tools/cv-builder/js/cv-export-empty-polish.js
tools/cv-builder/js/cv-layout-decongestion.js
tools/scholarship-finder/scholarship-study-context-bridge.css
tools/scholarship-finder/scholarship-study-context-bridge.js
tools/study-abroad-cost/study-abroad-conversion-auto.js
tools/study-abroad-cost/study-abroad-conversion-layer.css
tools/study-abroad-cost/study-abroad-conversion-layer.js
```

## Next Action
Do not rerun v8b yet. First resolve the remaining stability question around the CV Builder untracked file inventory and keep the Scholarship Finder bridge files in the manual review queue. Once repeated snapshots match without new or disappearing source-like files, rerun v8b to commit only assets/css/global.css and assets/css/global.min.css.

## Files Written
- audit-results/v8c-status-before.txt
- audit-results/v8c-porcelain-before.txt
- audit-results/v8c-cached-before.txt
- audit-results/v8c-untracked-before.txt
- audit-results/v8c-phantom-file-inspection.md
- audit-results/v8c-phantom-file-reference-check.md
- audit-results/v8c-process-supervisor-check.md
- audit-results/v8c-filesystem-watch.log
- audit-results/v8c-filesystem-watch-review.md
- audit-results/v8c-phantom-file-decision.md
- audit-results/v8c-stability-snapshot-1.txt
- audit-results/v8c-stability-snapshot-2.txt
- audit-results/v8c-stability-snapshot-3.txt
- audit-results/v8c-stability-review.md
- audit-results/v8c-stability-drift-investigation.md
