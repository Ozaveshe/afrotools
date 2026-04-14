# AfroTools Codex Workspace

AfroTools is a static-first web platform with country hubs, calculators, SEO surfaces, blogs, Netlify functions, and content-generation pipelines. This repo now includes a repo-native Codex operating layer so the agent can work with project context instead of generic defaults.

## Start Here

- `AGENTS.md` - Codex operating manual
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
