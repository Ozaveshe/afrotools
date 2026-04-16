# Education Category Taxonomy

The English education category now uses one shared mapping source:

- `assets/js/components/education-taxonomy.js`

That file is the source of truth for:

- The 6 standard education buckets
- Which registry-backed tools belong to each bucket
- Which tools are featured on `/education/`
- Which focused subsets power `/education/fees/`, `/education/loans/`, `/education/scholarships/`, and `/education/study-abroad/`
- Which product surfaces should be labeled separately from registry tools

## Standard Buckets

1. `Exam Prep & Admissions`
2. `Student Finance`
3. `Scholarships & Study Abroad`
4. `Academic Tools`
5. `Career & Teaching`
6. `Education Products / Platforms`

## Product Surface Rule

- `Education Hub` is a registry-backed education entry and a product surface.
- `AfroJAMB` and `AfroStudy` are ecosystem product surfaces and are not part of the registry tool count.

When updating counts or section labels, do not hardcode numbers into the page first. Update the shared mapping and let the education pages read from it.

## Canonical Tool Rule

- One user job should map to one primary education tool in the taxonomy.
- If an older or alternate URL still matters for SEO continuity, keep it as an alias or redirect instead of a second registry-backed tool.
- Current example: `/tools/ke-helb/` is the canonical Kenya HELB surface, while `/tools/helb-repayment/` should behave only as an alias route into that canonical page.
