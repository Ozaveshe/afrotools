# Claude Code Guide

Read `AGENTS.md` before changing this repository. It is the shared operating
contract for Claude, Codex, and human contributors.

For deployment work, also read `docs/DEPLOYMENT-WORKFLOW.md` and run
`npm run deploy:doctor` before changing Git, Netlify, MCP, or release files.

Critical boundaries:

- One agent owns one branch/worktree. Do not edit another agent's active
  checkout or discard its generated output.
- Never deploy the repository root or a dirty checkout. Netlify publishes
  `dist/` from the Git-linked `main` commit.
- Production normally deploys automatically after a push or merge to `main`.
  Do not use `netlify deploy --prod` unless the deployment guide's documented
  recovery lane is explicitly requested.
- Use the repo-local `supabase` MCP server for AfroTools only. It must resolve
  project ref `zpclagtgczsygrgztlts`; never substitute another product's
  project.
- Shared MCP configuration may reference environment variables, but must not
  contain credentials or placeholder servers that fail every session.
