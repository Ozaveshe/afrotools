# v8c Stability Review

Reviewed: 2026-05-20T23:52:09.8301231+05:00
Snapshots match: False
Staged files remain exactly CSS pair: True
Generated HTML staged: 0

## Snapshot Counts

Snapshot MutatorCount StatusCount CachedCount NameStatusCount NameOnlyCount UntrackedCount SourceLikeUntrackedCount
-------- ------------ ----------- ----------- --------------- ------------- -------------- ------------------------
       1            0        8178           2            7948          7948            294                       11
       2            0        8179           2            7948          7948            294                       11
       3            0        8179           2            7948          7948            293                       10

## Source-like Untracked Files Excluding Audit Results
tools/cv-builder/css/cv-completion-flow-fix.css
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

## Decision
FAIL: do not rerun v8b until the mismatch or staged-set problem is resolved.
