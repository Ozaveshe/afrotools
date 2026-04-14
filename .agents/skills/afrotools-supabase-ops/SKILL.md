---
name: afrotools-supabase-ops
description: AfroTools Supabase workflow for live schema inspection, SQL execution, auth or storage debugging, generated types, and repo changes that depend on Supabase behavior. Use when a task needs live project access or when Supabase-backed code paths in this repo need to stay aligned with the project configuration.
---
# AfroTools Supabase Ops

Use this skill for any task that crosses the line between repo code and live Supabase state.

## Mandatory Rule

Use the configured `supabase` MCP server first whenever live project access is required.

## Likely Repo Touchpoints

- `supabase/`
- `auth/`
- `embed/`
- `netlify/functions/`
- files that use `@supabase/supabase-js`

## Workflow

1. Separate live questions from repo questions.
2. Use Supabase MCP for schema, SQL, logs, auth, storage, or type generation.
3. Edit the repo only after the live-state assumption is confirmed.
4. Summarize what changed in the project versus what changed in code.