---
name: afrotools-openclaw-hostinger
description: AfroTools workflow for setting up or operating OpenClaw on Hostinger with Codex-backed repo automation. Use when the user mentions Hostinger, OpenClaw, ChatGPT Pro Codex, VPS agent hosting, or asks how OpenClaw can help AfroTools.
---

# AfroTools OpenClaw + Hostinger

## Use this skill when

- the user wants to run OpenClaw on Hostinger
- the user asks whether ChatGPT Pro Codex can power OpenClaw
- the user wants an agent sidecar for AfroTools repo work
- the user needs a safe split between Netlify hosting and agent automation

## Read first

1. `docs/openclaw-hostinger.md`
2. `prompts/openclaw-afrotools-system-prompt.md`
3. `ops/openclaw/openclaw.hostinger.example.jsonc`
4. `AGENTS.md`
5. `docs/codex-playbook.md`

## Default recommendation

Recommend Hostinger VPS plus manual OpenClaw install for AfroTools repo automation.

Use Hostinger 1-Click OpenClaw only when the user wants a simple managed assistant and does not need deep repo access.

## Required guidance

- Keep the public AfroTools site on Netlify.
- Run OpenClaw as a separate agent runtime.
- Use `openai-codex` if the user wants ChatGPT Pro Codex.
- Remind the user that ChatGPT billing and OpenAI API billing are separate.
- For live Supabase work, use the Supabase MCP server first.

## What to produce

Depending on the request, provide one or more of:

- a Hostinger decision recommendation
- a minimal OpenClaw Codex config snippet
- the current `openclaw.json` example file path
- a repo-safe operating prompt
- a first-task checklist for AfroTools
- a doc or config patch inside the repo when asked to "patch"

## Avoid

- telling the user to move AfroTools off Netlify without a separate migration request
- recommending hand edits to generated files
- treating Hostinger 1-click messaging setup as equivalent to a full repo automation environment
