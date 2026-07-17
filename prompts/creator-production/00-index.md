# Creator Production Tools — 10 Standalone Web Apps

## The Problem
The creative category is full of calculators. Creators don't come back daily to calculate royalties. They come back to MAKE things — thumbnails, captions, scripts, carousels. This suite fills that gap.

## Design Philosophy — NOT Calculators

These tools must feel like **standalone creative apps**, not form-to-result calculators.

### What calculators look like (AVOID):
- White background with form fields
- Labels → inputs → "Calculate" button → results table
- Centered narrow column layout
- Static, no personality, feels like a tax form

### What production tools look like (THIS):
- **Dark studio UI** — #0f0f0f / #1a1a1a backgrounds like Figma, CapCut, Canva
- **Full-bleed workspace** — the tool IS the page, no wasted whitespace
- **Results-first** — output appears as you type, not after clicking a button
- **One input, instant output** — 1-2 fields max before magic happens
- **Card-based results** — generated content in swipeable, copyable cards
- **One-tap actions** — copy, download, share always visible, always one tap
- **Typing/streaming animations** — AI text appears word by word, feels alive
- **Vibrant accents** — neon colors on dark backgrounds, not corporate blue
- **Zero chrome** — no unnecessary headers, sidebars, breadcrumbs in the workspace
- **Mobile-native patterns** — bottom sheets, swipe, thumb-zone placement

### Landing pages stay light
Each tool still gets a landing page (index.html) with the standard light theme for SEO, trust, and conversion. But when you click "Open Tool" → you enter the dark studio workspace (app.html). The transition should feel like entering a creative environment.

---

## The 10 Tools

| # | Tool | Slug | Type | Accent | CSS Prefix |
|---|------|------|------|--------|------------|
| 1 | ThumbnailForge | `creator-thumb` | Visual Canvas | `#FF3B30` Red | `ct-` |
| 2 | CarouselStudio | `creator-carousel` | Visual Canvas | `#AF52DE` Purple | `cc-` |
| 3 | TitleSmith | `creator-titles` | AI Text | `#007AFF` Blue | `cts-` |
| 4 | HookFactory | `creator-hooks` | AI Text | `#FF9500` Orange | `ch-` |
| 5 | CaptionCraft | `creator-captions` | AI Text | `#5AC8FA` Cyan | `ccr-` |
| 6 | BioForge | `creator-bios` | AI Text | `#34C759` Green | `cb-` |
| 7 | ScriptPad | `creator-scripts` | AI Text | `#5856D6` Indigo | `csc-` |
| 8 | TagWave | `creator-hashtags` | AI Text | `#FF2D55` Pink | `cht-` |
| 9 | Repurpose | `creator-repurpose` | AI Text | `#FFD60A` Gold | `crp-` |
| 10 | ResizeKit | `creator-resize` | Visual Canvas | `#00C7BE` Teal | `crz-` |

---

## Shared Infrastructure

### AI Backend
All AI text tools use `/.netlify/functions/creator-[slug].js` which calls Claude Haiku via Anthropic API. Each tool gets its own TOOL_CONTEXT entry in `ai-advisor.js` AND its own dedicated Netlify function for generation.

### Engine Pattern
Each tool gets `engines/creator-[slug]-engine.js` as an IIFE module on `window.AfroTools.engines.[name]`.

### Supabase
Auth instance: `zpclagtgczsygrgztlts.supabase.co`
Tables prefixed per tool. History/saves stored locally first, synced to Supabase for logged-in users.

### Canvas Tools (Thumbnail, Carousel, Resize)
Use HTML5 Canvas API for rendering. DOM-based editing layer on top for positioning/dragging. Export via `canvas.toBlob()` / `canvas.toDataURL()`.

### File Structure Per Tool
```
tools/creator-[slug]/
  index.html      — Landing page (light theme, SEO, conversion)
  app.html        — Workspace (dark studio theme)
  style.css       — Tool-specific styles
engines/creator-[slug]-engine.js
netlify/functions/creator-[slug].js
```

### Cross-Tool Navigation
Tools link to each other via the Creator Production strip. "Made a thumbnail? Now write the title." Flow between tools is encouraged.

---

## Relationship to Creator Suite

The **Creator Suite** (10 tools) is the business backbone — pricing, invoicing, CRM, finance, scheduling.

The **Creator Production Tools** (these 10) are the creative hands — making, generating, designing, repurposing.

They complement each other. CreatorMind (Suite) is the AI Swiss Army knife. These standalone tools are dedicated, single-purpose chef's knives — faster, more focused, zero friction.

---

## Hub Page Restructure

The `/creative/` hub will be reorganized:
1. **Creator Suite** — 10 pro business tools (existing)
2. **Creator Studio** — 10 production tools (NEW, this build)
3. **Creator Business** — existing calculators (kept, reframed)

Fashion/event tools demoted to their natural categories (Small Business, Uniquely African, etc.).
