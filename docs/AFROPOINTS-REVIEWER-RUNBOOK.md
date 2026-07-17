# AfroPoints Reviewer Runbook

## Purpose

This runbook covers the reviewer workflow for AfroPoints market-data submissions, buyer leads, and payout approvals.

## Review Surfaces

- Pending submissions and auto-flagged outliers
- Pending payout requests, including crypto wallet cashouts
- Data buyer leads waiting for qualification

## Review Rules

- Review rent, lease-risk, clinic, pharmacy, new-city, new-route, and 20 percent outlier submissions before publication.
- Confirm that proof links, timestamps, and location metadata support the claimed value.
- Reject only the publishability of the record when needed; keep the raw contribution stored unless it is clearly abusive.
- Do not auto-send crypto payouts from the reviewer surface. Approval moves the request into manual ops, not chain execution.

## Submission Decisions

- `approve`: mark the domain row publishable, update `data_confidence`, and allow the record to appear in public APIs.
- `reject`: keep the raw contribution, mark it not publishable, and record a note.
- `needs_followup`: keep the record pending and add reviewer notes for more proof or corroboration.

## Payout Decisions

- `approve`: mark the payout request as approved for manual processing.
- `reject`: mark the request rejected and store the reason.
- `hold`: use when KYC, fraud, or payout destination checks are incomplete.

## Buyer Lead Decisions

- `new`: untouched inbound request
- `qualified`: acceptable buyer profile for follow-up
- `needs_context`: missing budget, cadence, or location coverage details
- `closed`: lead resolved or not progressing

## Ops Checklist

- Check for duplicate submissions by contributor, route, provider, or listing URL.
- Compare the claimed value against nearby recent baselines before approving outliers.
- Prefer approving records with proof, specific geography, and a clear observed timestamp.
- Use reviewer notes for every manual rejection and payout hold.
- Escalate suspected fraud rings, fake proof links, or repeat payout abuse outside the normal approve-reject loop.
