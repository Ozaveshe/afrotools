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
