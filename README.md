# AfroTools Codex Workspace

AfroTools has a mature free directory: static-first tools, country hubs, blogs, widgets, SEO pipelines, and Netlify functions maintained through repeatable scripts rather than one-off edits. Treat this side as largely stabilized: fix broken public flows, keep source ledgers current, and validate release artifacts before shipping.

AfroTools Pro is the active product workstream. Start with `docs/PRO-APP-READINESS.md`, `docs/PRO-FENCE.md`, and the Pro registry files before changing paid routes, gates, billing, or app claims. Only AfroPayroll is active today; the rest must stay honest about local preview, early access, or planned capability until backed by real data and QA.

The current commercial path is sales-led and SEO-assisted: free tools drive acquisition, while Pro, widgets, custom calculators, API pilots, sponsored tools, and B2B enquiries drive revenue. Use `docs/AFROTOOLS-50K-EXECUTION-HANDOFF.md`, `docs/CLOSE-OUT-2026-05.md`, and `docs/ADMIN-OPS.md` to keep that direction coherent.

## Start Here

- `AGENTS.md` - Codex operating manual
- `docs/CLOSE-OUT-2026-05.md` - current free-side close-out and Pro handoff
- `docs/PRO-APP-READINESS.md` - Pro 20-app status and claims boundary
- `docs/design-doctrine.md` - consolidated design and interaction rules
- `docs/ARCHITECTURE.md` - product and file structure overview
- `docs/codex-playbook.md` - common task flows
- `docs/release-checklist.md` - pre-ship checks by change type
- `docs/known-traps.md` - common footguns and generated-file rules
- `afrotools-mission-control.html` - internal Codex cockpit
- `mc-7a2f9x.html` - legacy ops dashboard

## Common Commands

```bash
npm run build
npm test
npm run seo:report
npm run build:i18n:validate
npm run validate:hreflang
npm run cars:catalog:refresh
```

## Local Skills

Repo-specific skills live in `.agents/skills/`:

- `afrotools-seo-ops`
- `afrotools-country-page-scaffold`
- `afrotools-release-qa`
- `afrotools-supabase-ops`
- `afrotools-batch-content-edit`

## Repo Themes

- Static HTML pages with shared JS/CSS
- Registry-driven discovery and routing
- Scripted SEO and content maintenance
- Mixed hand-authored and generated outputs
- Netlify deployment and serverless functions
- Supabase-backed auth or data touchpoints where needed

## Working Model

1. Read the matching playbook.
2. Change the source, not the generated artifact.
3. Run the narrowest useful validation.
4. Capture repeatable knowledge in docs, rules, or skills.
