# V4 Suspicious / Carryover Review

The five v3 suspicious/carryover items are no longer dirty in this checkout. They were committed in:

`43e6f10 chore: ship automation and quality audit updates`

That commit changed 8746 files and is not reviewable as one human diff.

## `llms-full.txt`

- Change: scholarship finder description changed from `120+ scholarships` to `verified live scholarship feed for African students`.
- Related to v3 blockers: no.
- Related to truth/copy safety: yes.
- Safe to keep: yes, if paired with public-claim/scholarship truth changes.
- Packaging decision: separate content/LLM metadata commit, not v4 packaging.

## `data/audits/public-claim-registry.json`

- Change: new public claim registry with patterns, allowed files, truth sources, and validations.
- Related to v3 blockers: indirectly, through copy/claim audit discipline.
- Safe to keep: yes, as audit infrastructure.
- Packaging decision: separate public-claim audit commit.

## `data/automation/automation-registry.json`

- Change: new automation registry with runner ownership, schedules, validations, and production expectations.
- Related to v3 blockers: no direct mobile/dark/a11y/network relation.
- Safe to keep: yes, but operationally large.
- Packaging decision: separate automation governance commit.

## `data/scholarships/official-sources.json`

- Change: new scholarship official-source registry.
- Related to v3 blockers: no.
- Safe to keep: yes, if shipped with scholarship pipeline work.
- Packaging decision: separate scholarship data/source-truth commit.

## `docs/AUTOMATION-REGISTRY.md`

- Change: documents automation registry rules and validation.
- Related to v3 blockers: no direct relation.
- Safe to keep: yes, with automation registry.
- Packaging decision: separate docs commit with automation registry.

## Review Decision

None of the five should be silently included as v4 packaging. They are useful, but they need human approval or separate commits by product surface.
