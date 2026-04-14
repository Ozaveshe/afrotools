---
name: afrotools-batch-content-edit
description: AfroTools workflow for repeated edits across many static pages, generated content, localized pages, or registry-backed surfaces. Use when a request affects many similar files and should be handled with scripts, targeted transforms, or careful source-of-truth selection instead of manual one-by-one patching.
---
# AfroTools Batch Content Edit

Use this skill when a change spans many files or repeated page patterns.

## Working Rules

- Choose the source of truth before editing.
- Prefer a script when more than a handful of similar files are affected.
- Avoid mixing generated outputs with canonical sources in the same batch unless the task truly requires it.

## Workflow

1. Identify the canonical source: template, generator script, registry, or hand-authored page.
2. Decide whether a targeted script is safer than manual edits.
3. Apply the smallest repeatable change.
4. Run the validation that matches the touched surface.

## Common Surfaces

- Country page families
- Tool card and metadata sweeps
- SEO metadata repairs
- i18n outputs
- Blog image and content maintenance