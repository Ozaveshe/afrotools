# AfroTools Design Doctrine

This document turns scattered design guidance into one operating reference for Codex and humans.

## Primary Sources

- `assets/css/design-system.css`
- `style-guide.html`
- `docs/PLATFORM_STANDARDS.md`

## Visual Thesis

AfroTools should feel precise, modern, and authored. The product language is not playful SaaS chrome. It mixes editorial confidence with calm utility.

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

### 8. Glass and softness are tools, not defaults

- The design system includes glass surfaces and soft shadows.
- Use them where they clarify depth or importance.
- Do not let every region become a frosted card.

### 9. Standalone metric panels need balance

- Do not use standalone metric containers that park a label block, decorative rail, or empty slab on the left while isolating a giant number on the right.
- For valuation, revenue, score, and follower panels, lead with the number, then add compact source/status metadata and a short note in the same visual rhythm.
- If a metric needs emphasis, use typography, spacing, and subtle surface texture before adding extra side ornaments.

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
