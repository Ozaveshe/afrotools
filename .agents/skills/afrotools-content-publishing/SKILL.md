---
name: afrotools-content-publishing
description: AfroTools content publishing workflow for the static blog and AfroStream creator news. Use when drafting, publishing, or operating recurring content across the two editorial surfaces.
---
# AfroTools Content Publishing

Use this skill when the task is to write or publish content for AfroTools.

## Read First

- `docs/CONTENT-PUBLISHING-WORKFLOW.md`
- `docs/codex-playbook.md`
- `docs/design-doctrine.md`

## Working Rules

- Treat `/blog/` and AfroStream news as different systems.
- Use the configured `supabase` MCP server first for live AfroStream news work.
- Prefer repo edits for static blog posts and live publishing for AfroStream news.
- For time-sensitive claims, verify before writing.
- Avoid duplicate slugs and obvious keyword cannibalization.

## Workflow

1. Classify the destination: static blog or AfroStream news.
2. For static blog posts, create or update `blog/<slug>/index.html` and add the card to `blog/index.html`.
3. For AfroStream news, publish through the live path instead of inventing a static file workflow.
4. Add the right metadata, schema, and internal links for the surface.
5. Run the narrowest validation that proves the post is reachable.
6. If a recurring publishing pattern changes, update the content workflow doc.

## Common Checks

- `npm run check-links`
- `npm test`
- `GET /api/afrostream/news?slug=<slug>`
- `/tools/afrostream/news/<slug>`
