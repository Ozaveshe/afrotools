# AfroJAMB content review and publication

This workflow is being implemented in Step 4 of the September 2026 release plan.
The source audit, preserved inputs, reviewed data generation, server gates,
browser consumers and static pages are integrated locally. The deployment build,
artifact audit and 45 focused browser cases passed on 10 September 2026.
Final combined validation and deployment remain pending. Do not treat
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
out of public artifacts. The review ledger is excluded from the static deploy.
Any licence-specific public attribution must be checked before approving content.

The mechanical gate checks evidence completeness and content integrity. It
does not independently establish whether a reviewer is qualified or a source
permission claim is valid. Those records require actual editorial verification.

## Reproducible checks and repairs

Original practice, index, patterns, flashcards and raw subject data are preserved
under `ops/jamb/`, which is excluded from the website artifact. This is a deploy
boundary, not an assertion that repository access is private. Store confidential
agreements outside the repository; use evidence references in the ledger.

`npm run jamb:data:build` generates all 15 public datasets. `jamb:data:check`
compares them with source and review evidence. A single deterministic revision
pins the source question pool, source flashcards, ledger and publication policy.
Every dataset has a `publication.policy: reviewed-only` envelope and content
digest. Questions and approved cards/decks carry individual review digests.
Digests detect stale or changed content; they are not cryptographic signatures
or independent evidence of editorial review. Empty datasets are valid and do
not imply any questions have passed review.

Flashcard reviews use `ledger.flashcards[stable_card_id]` with the normalized
card fingerprint, `source_id`, `front_review` and `back_review`. Generate the
stable ID with `normalizeCard` in `scripts/lib/jamb-publication.js`. MCQ approval
does not approve a flashcard. Topic datasets describe reviewed historical
coverage; they contain no future-topic predictions.

The server reads the reviewed pool and rechecks question fingerprints and
review evidence. Attempts must carry the current `pool_revision`; scores are
recomputed from canonical answer keys. The retained 0–400 storage scale is
practice performance, not a validated forecast. Anonymous records are not
proof of real student completion or retention.

The backend writes `metadata.review_validation` only after canonical validation,
using the AfroTools service credential. Migration
`20260910151500_jamb_attempt_review_provenance.sql` reserves that marker with an
additive restrictive INSERT policy for anonymous and authenticated clients.
It was applied to the verified AfroTools project on 10 September 2026; a rolled
back anonymous insert probe rejected a forged marker and left existing rows
unchanged. Direct client submissions without the marker remain unverified
telemetry. The marker is not evidence of a human student or an exam result.

Daily signup requires the current revision and available reviewed subjects.
Sending pauses before reading subscribers if no reviewed email-safe questions
are available. Visual questions are omitted from email until its renderer can
preserve their supporting assets. Unsubscribe remains independent of content
availability. Bank tutor calls require reviewed `question_id`/`pool_revision`
and explicit AI consent; the server ignores client-supplied answer context.
Freeform study guidance is separate and does not become a reviewed answer key.

The study planner works locally without an AI request. Optional AI assistance
requires consent to the disclosed study inputs. The server validates bounded
dates, day counts and time budgets, then validates the returned schedule before
the browser accepts it. Invalid provider output falls back to the local planner.
The standalone tutor requires consent before sending the conversation.

Question-bank JSON is network-only and `no-store`; it is not served from the
service worker's offline cache. Its revision participates in the cache stamp,
so a changed review bank invalidates the previous cached page generation.
Local planning remains available independently of question-bank availability.

`npm run build:jamb` owns data, subject/year pages and their sitemap before other
build stages. `npm run jamb:publication:audit` compares the built public data
with current reviewed source and rejects extra JAMB files. `audit:dist` includes
this gate. `npm run jamb:sitemap` discovers canonical, indexable JAMB routes;
zero-approved subject/year notices must stay out of the sitemap.

`npm run jamb:content:audit` writes a per-record audit to the excluded reports
directory. `--output` can instead select an external evidence path. `--check`
compares the report with current inputs. `--require-reviewed` returns a failing
exit code if any input record remains quarantined.

Screening rejects missing/invalid answer keys, incomplete/duplicate options,
OCR artifacts, missing context or visual support, and explanations requiring
correction. These are conservative review signals, not a claim that every
unflagged answer is correct. All approvals are invalidated when their pinned
content changes.

`npm run jamb:repair-pages:build` now owns all 242 existing subject/year routes,
including these four formerly truncated pages:

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

1. Complete final combined regression/security checks, commit the integrated
   source and generated output, and verify hosted CI and the exact deployment.
2. Check production review notices, question-bank revision, attempt rejection,
   daily availability and non-public source paths. Do not send test emails to
   subscribers or confuse synthetic tests with a live student pilot.
3. Record actual source permission and qualified academic review for a usable
   initial curriculum. The current ledger approves zero questions or flashcards.
   Flashcards require their own evidence; MCQ approval does not approve a deck.
4. Regenerate and revalidate publication whenever approved content or its
   supporting evidence changes. Keep unknown permissions quarantined.

Step 5 still requires real Nigeria student completion and returning-user
evidence. Automated fixtures do not count as a student pilot.
