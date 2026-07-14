# AfroTools Deployment Workflow

## One Production Path

AfroTools uses Netlify's GitHub integration as the normal production path:

1. Work on a scoped branch in one agent-owned worktree.
2. Run the relevant tests and `npm run deploy:ready` before release.
3. Merge or push the reviewed commit to `main`.
4. Netlify builds that exact Git commit and publishes `dist/`.
5. Verify the Netlify deploy commit, GitHub checks, live routes, and scheduled
   function proof as separate evidence.

Do not run a second manual production upload after a healthy Git-triggered
deploy. A CLI upload has no reliable Git `commit_ref`, which makes rollback and
production proof harder even when the files are valid.

## Fast Commands

- `npm run deploy:doctor` checks local Git/worktree, Node, Netlify, and shared
  MCP configuration without changing anything.
- `npm run deploy:doctor:live` also verifies GitHub, Netlify CLI, and Claude MCP
  connectivity without printing credential values.
- `npm run deploy:verify` verifies the pinned AfroTools Netlify/Supabase/Git
  identities and the local deployment contract. Netlify runs this command in
  every deploy context.
- `npm run deploy:ready` is the release gate for a clean `main` checkout that
  exactly matches a freshly fetched `origin/main`; it runs live environment
  checks, the security scan, the full deploy build, and the `dist/` audit.

The full build still owns generated outputs. `build:seo` generates and validates
the public-claim registry once. `build:checks` intentionally does not repeat the
same two full-repository public-claim scans; this keeps Git-triggered Netlify
builds inside the platform time limit without weakening the claim contract.

## Worktree Rules For Claude And Codex

- One branch per worktree and one active agent per worktree.
- Reuse an existing task worktree while that task is active. Do not create a
  second worktree merely to deploy the same commit.
- Never reset, clean, force-remove, or overwrite a dirty worktree owned by
  another agent.
- `git worktree list --porcelain` is the source of truth. A missing path marked
  `locked initializing` is active setup, not stale metadata.
- Cleanup is allowed only after proving a worktree is present, clean, inactive,
  and merged. Run the cleanup helper in report mode first.
- Keep `.worktree-ports.json`, `.env*`, `.netlify/`, `.claude/`, and `.codex/`
  local and ignored.

The canonical checkout may be dirty while another agent works. Release proof
belongs in a clean task worktree; production still comes from the reviewed
`main` commit through Netlify's Git integration.

## MCP Contract

The tracked `.mcp.json` contains only the required AfroTools Supabase server.
Claude reads `SUPABASE_ACCESS_TOKEN` from the user environment and sends it in
an authorization header. Codex uses the repo-local `supabase` server or the
global `supabase_afrotools` fallback. Both must resolve:

- project ref: `zpclagtgczsygrgztlts`
- project URL: `https://zpclagtgczsygrgztlts.supabase.co`

Optional MCP servers should be installed only when their real credentials or
OAuth flow are available. Do not commit placeholder credentials or nonexistent
npm package names to the shared MCP file.

After changing MCP URLs, headers, or environment variables, restart the agent
host before judging the new configuration from an already-running session.

## Recovery Lane

Use a manual production upload only when Netlify's Git-triggered path is
confirmed unavailable and the user explicitly authorizes recovery:

1. Start from a clean checkout at the exact reviewed `origin/main` commit.
2. Run `npm run deploy:ready`.
3. Deploy only `dist/` plus `netlify/functions`; never publish the repo root.
4. Include the full commit SHA in the deploy message.
5. Record that the deploy source is CLI and verify live routes separately.

Recovery success does not repair Git integration. Diagnose and restore the
normal path before the next release.

## Closeout Evidence

Keep these states separate:

- Git: branch, exact SHA, clean tree, and `origin/main` alignment.
- GitHub: required checks for that SHA.
- Netlify: deploy state, source, and `commit_ref` for that SHA.
- Artifact: `build:deploy`, `security:scan`, and `audit:dist`.
- Live routes: production HTTP checks.
- Schedules: `npm run automation:live-health:strict` when schedule health is in
  scope.

End with one outcome: verified no-op, verified production deploy, verified
production deploy with scheduled proof pending, or blocked with the exact
failing evidence.
