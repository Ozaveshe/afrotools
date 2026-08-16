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

At 18:30 local time the publisher scans every handoff, validates reachable
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

## Control-plane policy

`data/automation/control-plane-policy.json` is the machine-readable budget and
lifecycle contract for recurring Codex work. It allowlists the active lanes,
pins their schedules/model effort, caps the active count, defines the publisher
lease, limits ready-receipt age, and sets publishing/worktree SLOs.

Run:

```bash
npm run automation:control-plane
npm run automation:control-plane:strict
```

The strict audit fails for an unexpected active lane, schedule/model drift, an
invalid or conflicting handoff, a ready receipt older than its publisher SLA,
an excessive number of active-lane worktrees, or dirty stranded automation
work. Historical worktree volume and safe cleanup candidates are reported
without deleting anything.

Every new `ready` receipt must also include `producer` ownership metadata:

- exact worktree path;
- time `origin/main` was fetched;
- exact remote branch ref;
- earliest safe cleanup time.

The publisher marks a receipt consumed only after exact-SHA deploy and live
proof. It may then remove that producer worktree only when the path matches the
receipt, the tree is clean, the remote commit is reachable, and the intended
work is deployed and the receipt is consumed. Dirty, rescue, locked, unknown,
and unproven worktrees are never auto-removed.

Use the guarded lifecycle command for cleanup. `plan` is read-only; `remove`
requires the exact handoff id as confirmation and rechecks every invariant:

```bash
npm run automation:worktree-lifecycle -- plan --handoff <handoff.json> --path <worktree>
npm run automation:worktree-lifecycle -- remove --handoff <handoff.json> --path <worktree> --confirm <handoff-id>
```

## Single-publisher lease

Use the repository command rather than creating an ad hoc lock file:

```bash
npm run automation:publisher-lease -- acquire --run-id <run-id> --base-sha <sha>
npm run automation:publisher-lease -- refresh --run-id <run-id> --token <token>
npm run automation:publisher-lease -- release --run-id <run-id> --token <token>
```

Acquisition is atomic. An active lease blocks a second publisher. An expired
lease still requires explicit `--replace-stale` after checking that no
publisher, Git, build, CI-wait, or deploy process remains.

## Publishing SLO

The scheduled Automation Health workflow checks both live scheduled-function
proof and the public blog:

```bash
npm run automation:publishing-slo
npm run automation:publishing-slo:live
```

After the evening deployment cutoff, the source and live site must contain the
daily article quota. The newest required routes must return successfully and
appear in both the blog hub and RSS feed. Scheduled checks open or update one
incident issue without turning every monitor run into failure-email noise;
manual health gates remain strict.

## Cost discipline

- Keep no more active lanes than the policy budget.
- Producers perform one bounded deliverable and stop at a validated handoff.
- Evaluators first compare the new Git/live evidence with their previous
  checkpoint and exit `no_change` before broad installs or browser suites when
  nothing relevant changed.
- The publisher regenerates shared output and runs full release gates once per
  daily bundle, not once per producer.
- Increasing model effort, frequency, or the active-lane count requires an
  explicit policy change reviewed with the expected measurable outcome.
