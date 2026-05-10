# AfroTax Source Review Discipline

Updated: 2026-05-10

AfroTax source review is a workflow for preparing accountant review work. It is not legal certification, not filing, and not proof that tax was paid.

## Evidence Pack Rules

- An Evidence pack is a review folder for document details and references.
- An Evidence pack is not filing.
- An Evidence pack is not proof of tax payment.
- Do not claim file upload unless an upload flow, storage path, and review state are actually built.
- Document details are allowed: document type, source app, period, amount, currency, status, note, and file or reference placeholder.
- Source app values should stay customer-facing: Payroll, Books, Seller, and manual.

## Source Review Rules

- A Source review record should name the official source title, URL, source checked on date, next review date, confidence, reviewer, and notes.
- Use official or primary sources before changing deadline, rate, or legal source facts.
- If an official source is not linked, show review needed.
- If source checked on is empty, show review needed.
- If next review date has passed, show stale source review.
- Source review is not legal certification.

## Readiness Rules

Show warnings before accountant handoff when any of these are true:

- Missing evidence.
- Stale source review.
- Missing reviewer.
- Unresolved warning.
- No official source linked.
- Source checked on missing.

## Export Rules

- Evidence pack Markdown is a review export only.
- Evidence item CSV is a review export only.
- Source review CSV is a review export only.
- Exports do not submit, file, pay, remit, or certify anything.

## Current Limitation

The current AfroTax workspace can organize review prompts and document details on this device, and can map them to account records when the account schema exists. Current source facts, deadlines, and rates still need official review before production use.
