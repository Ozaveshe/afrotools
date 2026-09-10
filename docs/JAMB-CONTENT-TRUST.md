# AfroJAMB content review and publication

This workflow is being implemented in Step 4 of the September 2026 release plan.
The audit and four-page repair are implemented. Full public-pool, static-page,
email, tutor, flashcard and deployment enforcement remains pending. Do not treat
an audit result or this document as proof that production is quarantined.

## Existing source limitations

The inspected practice pool contains 13,626 records, 8,780 answer values and
3,922 AI explanation fields. Its normalization removed `source_file`. The raw
subject JSON retains PDF filenames, which are provenance clues, not permission
records or verified answer keys.

The old ignored `.jamb-tools/` scripts in the canonical checkout are historical
evidence only. `generate_answers.py` writes model-generated answer letters and
explanations into pools. `sync_pool_answers_to_manifest.py` copies those values
back into raw subject files. `parse_all.py` can match an unknown-year answer-key
bucket by question number. Consequently, an answer in either the raw data or a
pool must not be described as official, confirmed or teacher-reviewed merely
because the field is populated. Do not rerun those pipelines for publication.

## Review ledger

`data/jamb/review-ledger.json` records review evidence. Its empty initial maps
mean no qualifying approval evidence has been recorded. Never populate them
with invented reviewers, inferred source permission, or an AI response presented
as expert approval.

Each question review is keyed by its exact ID and records:

- `content_sha256`: `questionFingerprint(question)` from
  `scripts/lib/jamb-content-trust.js`. It pins all content fields using recursively
  sorted object keys, unchanged strings and SHA-256.
- `source_id`: an entry in `sources` identifying the actual original source.
- `question_review`, `answer_review`, `explanation_review`: each includes
  `status: accepted`, reviewer, `reviewed_at` date and an evidence reference.
- `asset_review` where an image is provided, including its correctness and use
  permission in the evidence. Missing passages, figures and descriptions must
  be supplied; a review label cannot replace the missing material.

Source records include a `permission` object with `status: permitted`, a basis
(`written-permission`, `open-license` or `original-work`), evidence reference,
`reviewed_by`, and `reviewed_at`. A PDF filename or a publicly accessible URL
alone is insufficient. Keep private agreements and reviewer contact information
out of public artifacts. The forthcoming public dataset should expose only
appropriate attribution and review status.

The mechanical gate checks evidence completeness and content integrity. It
does not independently establish whether a reviewer is qualified or a source
permission claim is valid. Those records require actual editorial verification.

## Reproducible checks and repairs

`npm run jamb:content:audit` writes a per-record audit to the excluded reports
directory. `--output` can instead select an external evidence path. `--check`
compares the report with current inputs. `--require-reviewed` returns a failing
exit code if any input record remains quarantined.

Screening rejects missing/invalid answer keys, incomplete/duplicate options,
OCR artifacts, missing context or visual support, and explanations requiring
correction. These are conservative review signals, not a claim that every
unflagged answer is correct. All approvals are invalidated when their pinned
content changes.

`npm run jamb:repair-pages:build` owns these four formerly truncated pages:

- `/jamb/commerce/1997/`
- `/jamb/english/2000/`
- `/jamb/english/2009/`
- `/jamb/mathematics/1987/`

The generator creates complete documents from approved records, rather than
appending closing tags to a partial question. Pages with no approved questions
retain their route and canonical, display a review notice and useful study
planner link, emit no Question/acceptedAnswer schema, and are `noindex, follow`.
Raw question data is preserved for review. Output is validated before and after
writing a temporary sibling file, then renamed over the destination. Never
directly overwrite the destination with an unvalidated partial render.

`npm run jamb:repair-pages:check` validates the generated documents and their
question/schema sets. `npm run test:jamb-trust` runs the focused contracts.
`tests/e2e/jamb-reviewed-pages.spec.js` checks the four review states at mobile
and desktop widths, keyboard navigation and working study-planner links.

The readable CBT engine is `engines/src/jamb-cbt-engine.js`; regenerate its
browser output with `node scripts/minify.js --only=jamb-cbt-engine`. Saved
sessions must be rejected when any saved question is removed or duplicated.
The engine also supports `poolRevision`; callers must supply the reviewed-pool
revision to invalidate saved sessions after answer/permission review changes.

## Remaining release gate

Before claiming Step 4 complete or promoting AfroJAMB:

1. Preserve raw/question-source inputs outside the public artifact, then generate
   every public pool from the review ledger. Keep unknown permissions quarantined.
2. Apply the same approved set to CBT, saved sessions, browsing, prediction,
   tutor question lookup and daily email. Do not send test emails to subscribers.
3. Regenerate all subject/year question cards, schemas, counts and derived topic
   data. Client-side filtering does not remove already rendered question HTML.
4. Review flashcard sources and answers separately; they are not covered by the
   multiple-choice question ledger merely because they are educational content.
5. Reconcile empty states and public claims, update source-owned sitemap output,
   and verify unreviewed records cannot be fetched from the built artifact.
6. Run security, build/artifact, relevant SEO and browser checks; publish through
   coordinated release ownership and verify the deployed revision and journeys.

Step 5 still requires real Nigeria student completion and returning-user
evidence. Automated fixtures do not count as a student pilot.
