# AfroTools Design Doctrine

This document turns scattered design guidance into one operating reference for Codex and humans.

## Primary Sources

- `assets/css/design-system.css`
- `style-guide.html`
- `docs/PLATFORM_STANDARDS.md`

## Visual Thesis

AfroTools should feel precise, modern, trust-first, and authored. The default product language is a quiet financial-product interface: calm surfaces, clear hierarchy, restrained color, reliable controls, and content that proves local expertise.

African specificity should come from country selectors, local currency, tax years, language, regulatory references, examples, and source links. Do not rely on excessive flags, emoji, loud gradients, novelty illustrations, or decorative "African" visual tropes to communicate relevance.

The system should feel boring in the best way: one type scale, one spacing scale, one button system, one card system, one form system, one badge system, one color palette, one radius/shadow language, and one page shell.

## System Contract

- **Page shell:** use `.page-shell`, `.page-header`, `.page-title`, `.page-description`, `.container`, and `.section` before inventing a new page frame.
- **Typography:** use `DM Sans` for product UI, dense tools, labels, controls, and cards. Reserve `Instrument Serif` for large editorial or brand moments only, using `.headline-editorial` when that treatment is intentional.
- **Spacing:** use `--space-*`, `--space-section`, `--page-gutter`, and `--card-padding`. Do not use arbitrary margins to force rhythm.
- **Buttons:** use `.btn` plus `.btn-primary`, `.btn-secondary`, `.btn-ghost`, or `.btn-danger`. Buttons are sentence case by default, not all caps.
- **Cards:** use `.card`, `.card-header`, `.card-title`, and `.card-description`. Cards are quiet surfaces for grouping or interaction, not a default page-section wrapper.
- **Forms:** use `.form-field`, `.form-label`, `.form-input`, `.form-select`, `.form-help`, and `.form-error` for new forms.
- **Badges:** use badges only for real state such as Live, Updated, Private, Official source, No upload, AI explanation, or warning. Do not use badges as decoration.
- **Color:** blue is the action and focus color. Gold is a rare accent. Neutral surfaces should carry most pages.
- **Shadows and radius:** use tokenized shadows and radii. Prefer subtle borders and light elevation over glow-heavy panels.
- **Motion:** use motion only for clarity, reveal, and feedback. Respect `prefers-reduced-motion`.

## Core Rules

### 1. Use the system, not ad hoc values

- Use tokens from `assets/css/design-system.css`.
- Do not hardcode colors, fonts, spacing, radii, or shadows when a token already exists.
- Use page-level CSS only for composition and special cases.

### 2. Typography carries the brand

- Use `Instrument Serif` for large statements and page-defining headlines.
- Use `DM Sans` for body, controls, labels, and dense product UI.
- Use `JetBrains Mono` for commands, metrics, file paths, and operational metadata.

### 3. Blue is the engine, gold is the accent

- Default to the existing blue token family for action, state, and focus.
- Use gold sparingly for emphasis, signal, or premium moments.
- Avoid introducing extra accent colors unless the surface already has a strong reason.
- Avoid dark blue gradient panels as the default page answer. Use neutral surfaces and local content first.

### 4. Composition before components

- Start with hierarchy, spacing, alignment, and visual rhythm.
- Avoid generic dashboard-card mosaics as the first instinct.
- Let each section have one dominant job.
- Use cards only when the card itself is the interaction or grouping.

### 5. Utility copy on operational surfaces

- Internal dashboards and workspaces should use utility copy, not homepage copy.
- Headings should tell the operator what a surface is or what they can do there.
- If a line sounds like campaign copy, rewrite it.

### 6. Motion should sharpen, not decorate

- Use motion for entrance, reveal, and emphasis.
- Prefer transform and opacity transitions.
- Respect `prefers-reduced-motion`.
- Keep timings restrained and consistent.

### 7. Icons and symbols

- Prefer SVG or typographic marks over emoji icons.
- Use a single visual language for icons on a given page.
- If an icon does not improve scanning, remove it.
- Flags should support country selection or identification, not decorate every card.

### 8. Glass and softness are tools, not defaults

- The design system includes glass surfaces and soft shadows.
- Use them where they clarify depth or importance.
- Do not let every region become a frosted card.

### 9. Standalone metric panels need balance

- Do not use standalone metric containers that park a label block, decorative rail, or empty slab on the left while isolating a giant number on the right.
- For valuation, revenue, score, and follower panels, lead with the number, then add compact source/status metadata and a short note in the same visual rhythm.
- If a metric needs emphasis, use typography, spacing, and subtle surface texture before adding extra side ornaments.

### 10. Dark mode is a first-class theme

- Use `data-theme="dark"` and `data-theme="light"` on `<html>` through `AfroTools.darkMode`; do not create page-local storage keys.
- Keep `data-theme` as the active effective theme. When the user has not chosen a preference, set `data-theme-choice="auto"` and let system color scheme decide the active value.
- Build new surfaces with design tokens so the global dark palette can carry them without page-specific overrides.
- Keep dark mode calm and readable: deep neutral backgrounds, raised surfaces, blue focus/action states, and at least 4.5:1 contrast for normal text.
- Add visible theme controls through shared navigation or a reusable settings surface rather than one-off page buttons.

## Internal Surface Rules

- Mission control, admin pages, and internal consoles should still feel branded.
- Keep the first viewport strong and unmistakable.
- Show the working model early: what to read, what to run, where to go.
- Make copyable commands and source-of-truth links obvious.

## Implementation Checklist

- Import `assets/css/design-system.css` first on new internal pages.
- Load the repo type stack used by the style guide when the page needs standalone font loading.
- Reuse tokens for color, spacing, border, motion, and radius.
- Check mobile at small widths and keep touch targets comfortable.
- Add visible focus states for interactive controls.
