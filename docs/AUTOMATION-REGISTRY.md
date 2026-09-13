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

At 08:30, 18:30 and 21:30 local time the same publisher scans every handoff, validates reachable
commits and source-file allowlists, topologically orders dependencies, and
processes ready work oldest first. It checks each patch against the cumulative
integration tree before applying it without preserving the producer commit,
which allows one cumulative commit per nonempty release run. Invalid or overlapping patches are
quarantined independently. The publisher regenerates shared output once, runs
the combined release gates, pushes `main`, waits for CI and exact-SHA Netlify
proof, verifies touched live routes, then marks only proven handoffs consumed.

Run:

```bash
npm run automation:handoffs
npm run test:automation-handoffs
```

### Durable receipt history

Use `node scripts/automation-handoff.js publish <receipt.json>` after preparing
a schema-valid receipt. This command holds an exclusive lane write lock,
preserves the previous receipt under `runs/<run-id>/handoff.json`, writes the
new run archive, then atomically installs the latest receipt. It rejects run-id
collisions, source-identity changes and backwards lifecycle timestamps. A
stranded `.handoff-write.lock` requires checking the owning process before
manual recovery; never remove it blindly.

Queue scans read both latest receipts and these run archives. Copies with the
same handoff ID are reconciled by `updated_at` only when immutable source
identity agrees. Conflicting copies fail closed. A newer consumed or
quarantined copy supersedes an old ready copy, preventing replay. Different
handoff IDs remain independent work even after a producer starts another run.
The publisher must update the exact receipt it consumed, including archived
work, with its release/deploy proof. Live mutations are never replayed.

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

Fleet health and release authorization are separate results. The strict audit
above remains the maintainer's fleet-health gate. For a concrete release, pass
every accepted exact handoff ID, including unconsumed dependencies:

```bash
npm run automation:release:check -- --handoff-id <exact-id> --handoff-id <dependency-id> --json
```

Release mode reports all fleet findings but exits using `release.ready` and
`release.blockers`. A missing observer, schedule/cost drift or retained worktree
backlog must remain visible without vetoing independently validated source.
The worktree count is retained active-lane storage, not a count of executing
tasks; never delete protected work to make a release pass. Missing/inactive
publisher, selected receipt/source/remote/ownership errors, unsafe conflicts,
missing dependencies and unknown integrity errors still fail closed. Build,
security, source freshness, deployment identity and exact-SHA live gates remain
mandatory. An unsafe unrelated candidate is quarantined independently.

Delayed receipts are not automatically freshened. After the 24-hour SLA, the
publisher must recheck changing primary sources, the original source patch and
targeted tests against fetched current `origin/main`. Preserve original
`created_at`, commit and base SHA; record `publisher.revalidation` with
`handoff_id`, `commit`, `base_sha`, `current_main_sha`, `source_patch_sha256`,
`reviewed_at`, and passing `checks` named `primary_sources`, `source_patch` and
`targeted_validation`, each with evidence. The gate recomputes the patch hash
and rejects identity mismatch or proof older than 24 hours. A newer main SHA
requires new review. This is revalidation, not a freshness waiver.

Every new `ready` receipt must also include `producer` ownership metadata:

- exact worktree path;
- time `origin/main` was fetched;
- exact remote branch ref;
- earliest safe cleanup time.

The receipt writer rejects a new ready repository receipt without this metadata
before publishing it. Historical copies remain available for reconciliation;
legacy receipt readability does not authorize a release without ownership proof.

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

## Coherent operating model (September 2026)

The policy budgets 25 active jobs: 24 cron lanes (21 for AfroTools, two for
OddsPadi and one for SalaryPadi) plus the existing hourly command centre
heartbeat. The heartbeat inherits its target task model and produces no
producer receipt; its schedule, target and notification preferences remain
owned by the saved definition. On September 9 the user authorized reactivation,
consolidation and deletion. Eleven useful lanes were reactivated and 55
redundant or unsupported definitions were deleted after local backup.
`data/automation/specialist-coverage.json` assigns every retained responsibility
to an active owner. Creator wealth estimation is retired without replacement.
Existing IDs were reused; no new scheduler definitions were necessary.

Each source or quality owner scans its coverage metadata, completes a bounded
batch and carries unchecked families forward with last-review dates and
blockers. The maintainer reviews missing natural-run proof after seven days,
repeated blockers after three runs and family coverage older than 28 days.
These thresholds expose gaps; they do not imply that every country and family
can be fully audited in one run.

Pro readiness runs twice weekly and owns the former app-specific development
backlog. These jobs maintain product features; they do not execute customer
payroll, send reminders, contact users or move money. Each product retains its
own release owner and identity checks. OddsPadi operations writes exact-commit
candidate manifests for its publisher; SalaryPadi combines health review and
narrow reliability maintenance with its existing release gate. Healthy unchanged
releases should be short no-ops.

Retiring a Codex definition does not retire its Netlify or GitHub runner.
Production-required registry responsibilities retain their runner links and
validation commands, reassigned to active Codex owners. Historical receipt IDs
remain historical identities; never rewrite them to the successor's ID or
replay consumed work. Backups and private run evidence remain outside Git.

| Responsibility | Owner | Outcome |
| --- | --- | --- |
| Daily useful content | AM and PM producers | Two distinct source-backed articles with remote handoffs; live AfroStream proof remains separate |
| Civic source maintenance | Election freshness | Verified dated changes, no predictions or unsupported outcomes |
| Live health detection | Health watch | Fresh observations with issue keys, severity and active owner |
| Live-data remediation | Live Data Product Upgrade | One proven scheduler/source defect repaired, then natural-run proof |
| Search and release safety | SEO, sitemap and bug reviews | New defects isolated; no broad reruns or cosmetic date churn on unchanged inputs |
| Product priorities | Pro readiness and Hausa/Yoruba rotation | One tested existing workflow improved within the free-app freeze |
| Image intake | Daily image queue | Delivered assets reviewed once; pending batches reused |
| Integration and deployment | Daily publisher | One validated cumulative release with exact-SHA proof |
| Command centre observation | Hourly command centre heartbeat | Read-only collection; task model inherited; no producer receipt |
| Governance and recovery | System maintainer | Fresh seven-day report, missing ownership and stranded work repaired |
| Statutory and financial sources | Government, Labour & Financial Source Review | Dated jurisdiction-specific source changes and explicit review gaps |
| Customs and trade sources | Trade & Customs Source Review | Verified tariff, HS and import assumptions without duplicate source edits |
| Transport and relocation | Transport, Cars & Relocation Source Review | Official fees and source-backed car evidence |
| Education sources | Scholarships & Education Source Review | Official deadlines, awards and school-fee freshness |
| Usability and exports | Mobile, Accessibility & Export Quality | One working synthetic user journey with separate export proof |
| Commercial readiness | Commercial Funnel Integrity Sweep | Honest offers, working opt-in paths and evidence-backed conversion findings |
| Existing content | Weekly Blog Refresh; Creator & Recipe Media Integrity | Source freshness and identity/media quality without duplicating new-article quotas |
| Other products | OddsPadi operations and publisher; SalaryPadi health/release | Product-specific health, scoped repairs and exact-commit release proof |

Routine cron work uses GPT-5.6 Sol with high reasoning. Complex review,
governance and repair use GPT-6 Astra/high; production publishers use
Astra/xhigh. Heartbeats inherit their task model and require a task target,
not cron model fields. Local environment setup scripts are disabled in the
saved cron definitions; jobs perform explicit dependency setup when required.

The primary publisher starts at 18:30 local time, with 21:30 retry and 08:30
backlog recovery through the same saved automation and exclusive lease. Recovery
resumes checkpoints and scans before building; an empty queue or already-proven
exact SHA does not trigger another full build or commit. Expected receipts are
limited to producer runs due before that invocation. The public publishing-SLO cutoff is
22:00, allowing the stated intake grace and release budget. Runtime-minute
fields are planning/checkpoint limits; they do not terminate processes.
Mandatory quality and freshness gates remain strict even for carried debt.

### Current reporting rather than stale summaries

`automation:report` defaults to a rolling seven-day window, streams retained
sessions and archived sessions, and deduplicates copies by session ID. It
prefilters dated filenames before parsing, classifies failed terminal events
as failed, and reports validated receipt observations separately. Missing
retained evidence is not proof that the scheduler failed to fire. Neither a
terminal event nor a receipt alone proves a production deployment.

The maintainer writes local evidence with:

```bash
npm run automation:report -- --output-dir=C:/Users/Oza/.codex/automations/automation-system-maintainer/reports
```

The registry audit selects the newest report by generation date from repository
reports and this local directory. `CODEX_AUTOMATION_REPORT_DIR` overrides the
local directory. Private run evidence is not committed to the public repository.
Newly activated jobs remain awaiting their next scheduled proof; paused jobs
are not classified as missed runs. Keep global memory registries untouched.

The image queue runs at 09:30 independently of any task lifecycle. The former
image heartbeat disappeared during configuration verification; the existing
image queue was activated instead of recreating a duplicate schedule.
