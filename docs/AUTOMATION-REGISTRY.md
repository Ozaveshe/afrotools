# Automation Registry

`data/automation/automation-registry.json` is the source of truth for automation ownership and runner expectations.

Use it to distinguish four different things that are easy to confuse:

- Codex-local automations in `C:/Users/Oza/.codex/automations`
- Netlify scheduled functions declared in `netlify.toml`
- GitHub Actions workflows in `.github/workflows`
- Manual release, incident, and truth-review lanes

## Rules

- A missing Netlify schedule is a production bug only when a registry record has `production_required: true` and names that Netlify function as its required runner.
- A missing GitHub workflow is a production bug only when a registry record has `production_required: true` and names that workflow as its required runner.
- Codex-only automations may warn when they have no recent local run evidence. That warning does not mean Netlify is missing a function.
- Any automation that supports public claims should list the matching `claim_id` from `data/audits/public-claim-registry.json` in `public_claims_supported`.
- Every record should list at least one validation command, even when the lane is manual.

## Validation

Run:

```bash
npm run audit:automation-registry
```

The audit parses `netlify.toml`, `package.json`, `.github/workflows`, the public-claim registry, and the latest local automation report when present.

Warnings are allowed for Codex no-run evidence and stale manual lanes. Missing production Netlify schedules or GitHub workflows fail the audit.

## Daily handoff and release queue

Every active AfroTools Codex automation writes one machine-readable receipt to
`C:/Users/Oza/.codex/automations/<automation-id>/handoff.json` before ending a
run. The contract is defined by `data/automation/handoff-schema.json` and checked
by `scripts/automation-handoff.js`.

Use one of these dispositions:

- `ready`: a validated repository change with a named branch, reachable commit,
  base SHA, source-file allowlist, validation results, and risk metadata.
- `no_change`: the run completed without changing repository or live state.
- `live_only`: the run changed Supabase or another live system but has no
  repository merge candidate. The receipt must describe the live mutation and
  its proof.
- `blocked`: the lane did not finish and names the exact blocker and smallest
  next action.
- `quarantined`: the producer or publisher found unsafe, conflicting, stale, or
  unverifiable work. A quarantined lane does not block unrelated ready work.
- `consumed`: the publisher included the handoff in a proven daily release and
  recorded the release SHA, deployment ID, and live proof.

The publisher is the only daily integration owner. Producers never push `main`
or deploy static repository work. A producer commits only its scoped source
change to `automation/<automation-id>-<date>-<run-id>`, pushes that branch, and
writes the handoff atomically after validation. Generated files are identified
separately so the publisher can regenerate them once from current `main`.

At 17:30 local time the publisher scans every handoff, validates reachable
commits and source-file allowlists, topologically orders dependencies, and
processes ready work oldest first. It checks each patch against the cumulative
integration tree before applying it without preserving the producer commit,
which allows one daily release commit. Invalid or overlapping patches are
quarantined independently. The publisher regenerates shared output once, runs
the combined release gates, pushes `main`, waits for CI and exact-SHA Netlify
proof, verifies touched live routes, then marks only proven handoffs consumed.

Run:

```bash
npm run automation:handoffs
npm run test:automation-handoffs
```
