# v8c Phantom File Decision

Decided: 2026-05-20T23:49:50.9944222+05:00

## Classification
B. LEGITIMATE PRODUCT FILE REQUIRING MANUAL REVIEW

## Rationale
- The file is browser-side production JavaScript for Scholarship Finder and Study Abroad context bridging.
- It is referenced by tracked tools/scholarship-finder/index.html.
- It has no git history and is not currently tracked.
- It is not ignored.
- It references AfroProductBackbone and Study Abroad context, which puts it in the manual review/carryover zone called out by earlier packaging work.
- It appeared during v8b stability rather than as an intentional v8b change, so it must not be silently committed with the CSS fix.

## File/Reference State
- JS exists: True
- JS tracked: False
- JS status: ?? tools/scholarship-finder/scholarship-study-context-bridge.js
- CSS counterpart exists: True
- CSS counterpart tracked: False
- CSS status: ?? tools/scholarship-finder/scholarship-study-context-bridge.css
- Index status:  M tools/scholarship-finder/index.html

## Index References
19:<link rel="stylesheet" href="/tools/scholarship-finder/scholarship-study-context-bridge.css?v=3d7a72bb">
26:<script src="/tools/scholarship-finder/scholarship-study-context-bridge.js?v=44591a32" defer></script>

## Targeted Index Diff Summary
tools/scholarship-finder/index.html has unstaged changes. Full targeted diff saved to audit-results/v8c-scholarship-index-targeted-diff.txt.

## Decision Details
- Should remain untracked for now: yes, until a human reviews the Scholarship Finder/Study Abroad bridge as a separate product change.
- Move to manual review queue: yes.
- Should be ignored: no, not as a blanket rule; it is production-looking JS referenced by a page.
- Should be deleted later by human maintainer: only if the linked page/reference is also reverted or replaced. Do not delete automatically.
- Blocks CSS fix commit: not inherently after process stability is proven, but it must remain unstaged and explicitly excluded from the CSS commit.
