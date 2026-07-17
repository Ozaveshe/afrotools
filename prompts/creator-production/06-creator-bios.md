# Prompt 06 — BioForge (creator-bios)

> Bio Generator — Every platform bio, generated at once

---

## Identity

| Field | Value |
|-------|-------|
| Name | BioForge |
| Slug | `creator-bios` |
| Path | `/tools/creator-bios/` |
| Accent | `#34C759` (Green) |
| Accent Dark | `#248A3D` |
| Accent Light | `#E8FAE8` |
| Accent Glow | `rgba(52,199,89,.4)` |
| CSS Prefix | `cb-` |
| Type | AI Text Generation |

---

## What This Is

Every creator needs bios — for Instagram (150 chars), TikTok (80 chars), X/Twitter (160 chars), LinkedIn (headline 220 chars + about 2600 chars), YouTube (1000 chars), and more. Every platform is different. Most creators use the same generic bio everywhere. BioForge generates platform-optimized bios ALL AT ONCE.

Tell it who you are, what you do, and your vibe. It generates bios for every platform simultaneously, each tailored to that platform's character limits, tone expectations, and formatting norms.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, green accents
- **Minimal input**: 3 fields max — Who are you? What do you do? Your vibe/tone.
- **All-at-once output**: After generation, show ALL platform bios on one scrollable page — a "bio sheet"
- **Platform cards**: Each bio in a card styled like that platform's UI (IG bio area mockup, X profile mockup, LinkedIn header mockup)
- **Live character counter**: Each bio shows chars used vs limit, color-coded
- **One-tap copy**: Each platform bio copies independently

### The Feel
This is a "fill-once, get-everything" tool. The satisfaction is seeing ALL your bios generated in one shot. Like ordering everything on the menu and it all arrives at once. Green = go, fresh, new beginning — perfect for someone setting up or refreshing their creator presence.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "One Tap. Every Platform. Every Bio." — animated grid of platform icons (IG, TikTok, X, LI, YT) with bios appearing in each
**Features**: All-at-once generation, platform-specific character limits, tone matching, emoji intelligence
**CTA**: "Generate My Bios →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Layout**:
```
┌──────────────────────────────────────────────┐
│              BioForge 🌿                     │
│                                              │
│   WHO ARE YOU?                               │
│   ┌────────────────────────────────────┐     │
│   │ e.g. Adaeze, photographer & visual │     │
│   │ storyteller based in Lagos         │     │
│   └────────────────────────────────────┘     │
│                                              │
│   WHAT DO YOU DO?                            │
│   ┌────────────────────────────────────┐     │
│   │ e.g. Brand photography, content    │     │
│   │ creation, visual branding          │     │
│   └────────────────────────────────────┘     │
│                                              │
│   YOUR VIBE                                  │
│   [Professional] [Bold] [Playful]            │
│   [Minimalist] [Motivational]                │
│                                              │
│   ────── Generate All Bios 🌿 ──────        │
│                                              │
│ ═══════════════════════════════════════════   │
│                                              │
│   ┌─ INSTAGRAM ──────────────────────┐       │
│   │ 📸 Adaeze | Visual Storyteller   │       │
│   │ 📍 Lagos → Worldwide             │       │
│   │ ✨ Brands I've shot: Nike, GTBank│       │
│   │ 🔗 Book a session ↓              │       │
│   │                                  │       │
│   │ 127/150 chars ✓     [Copy 📋]    │       │
│   └──────────────────────────────────┘       │
│                                              │
│   ┌─ TIKTOK ─────────────────────────┐       │
│   │ Photographer who shows the BTS 📸│       │
│   │ Lagos 🇳🇬 | Book me ↓            │       │
│   │                                  │       │
│   │ 72/80 chars ✓       [Copy 📋]    │       │
│   └──────────────────────────────────┘       │
│                                              │
│   ┌─ X / TWITTER ────────────────────┐       │
│   │ Visual storyteller. Capturing    │       │
│   │ African brands in their best     │       │
│   │ light. Lagos-based, globally     │       │
│   │ booked. 📸                       │       │
│   │                                  │       │
│   │ 142/160 chars ✓     [Copy 📋]    │       │
│   └──────────────────────────────────┘       │
│                                              │
│   ┌─ LINKEDIN ───────────────────────┐       │
│   │ Headline:                        │       │
│   │ Brand Photographer & Visual      │       │
│   │ Storyteller | Lagos              │       │
│   │                                  │       │
│   │ About:                           │       │
│   │ I help brands look like they     │       │
│   │ belong on billboards...          │       │
│   │                                  │       │
│   │ 198/220 + 380/2600   [Copy 📋]   │       │
│   └──────────────────────────────────┘       │
│                                              │
│   ┌─ YOUTUBE ────────────────────────┐       │
│   │ About section...                 │       │
│   │ 456/1000 chars        [Copy 📋]  │       │
│   └──────────────────────────────────┘       │
│                                              │
│   ┌─ THREADS ────────────────────────┐       │
│   │ ...                   [Copy 📋]  │       │
│   └──────────────────────────────────┘       │
│                                              │
│   [Copy All to Clipboard 📋]                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Platform Specifications

| Platform | Field | Char Limit | Format Notes |
|----------|-------|------------|-------------|
| Instagram | Bio | 150 | Line breaks work, emoji common, link reference |
| TikTok | Bio | 80 | Ultra-short, emoji-heavy, CTA to link |
| X/Twitter | Bio | 160 | Punchy, no line breaks in bio, personality-first |
| LinkedIn | Headline | 220 | Professional, keywords for search |
| LinkedIn | About | 2,600 | Paragraphs, storytelling, credibility markers |
| YouTube | About | 1,000 | Keywords for discovery, upload schedule, links |
| Threads | Bio | 150 | Casual, personality-driven, conversational |
| Facebook | Bio | 101 | Short, often ignored but still matters |

---

## AI System Prompt

```
You are BioForge, a bio writing expert for African content creators.

RULES:
- Generate bios for ALL platforms simultaneously: Instagram, TikTok, X/Twitter, LinkedIn (headline + about), YouTube, Threads
- Each bio MUST respect the platform's character limit EXACTLY
- Each bio should feel NATIVE to that platform:
  - Instagram: visual, emoji structure, line breaks, link reference
  - TikTok: ultra-short, trendy, Gen-Z energy if appropriate
  - X: witty, personality-first, no filler words
  - LinkedIn headline: professional keywords, searchable
  - LinkedIn about: storytelling, credibility, paragraphs
  - YouTube: discovery-focused, upload schedule mention, keywords
  - Threads: casual, conversational, personality
- Use the specified tone consistently across all bios
- African context natural — location, cultural references, local achievements
- Emoji usage should match platform norms (heavy on IG/TikTok, minimal on LinkedIn)
- NEVER use generic filler like "Passionate about..." or "Lover of..." — be specific
- Include ONE unique element that makes the creator memorable

OUTPUT FORMAT (JSON):
{
  "bios": [
    {
      "platform": "instagram",
      "text": "📸 Adaeze | Visual Storyteller\n📍 Lagos → Worldwide\n✨ Shot for: Nike, GTBank, Dangote\n🔗 Book a session ↓",
      "charCount": 127,
      "charLimit": 150,
      "withinLimit": true
    },
    ...
  ],
  "personalBrandTip": "Your unique angle: you're not just a photographer, you're a visual storyteller for African brands going global. Lead with that everywhere."
}
```

---

## Additional Features

### Edit & Regenerate Per Platform
- Tap any bio to edit inline
- "Regenerate just this one" button per platform — keeps all others, redoes one
- Useful when 5 out of 6 are perfect but one needs work

### Copy All
- "Copy All to Clipboard" button generates a formatted text block:
```
--- INSTAGRAM ---
[bio text]

--- TIKTOK ---
[bio text]

--- X/TWITTER ---
[bio text]

... etc
```

### Bio Refresh
- "Refresh All" generates entirely new bios with same inputs
- Useful for A/B testing different approaches

### Save as Template
- Save a bio set as a template for future use
- "Switch to Professional Mode" → reloads all bios with professional tone
- Quick tone switching without re-entering details

---

## Data Model

```sql
CREATE TABLE creator_bios_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  who TEXT NOT NULL,
  what TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  bios JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_bios_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bios" ON creator_bios_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine, Function, Performance

**Engine**: `engines/creator-bios-engine.js` — generate all, regenerate single platform, copy variants, inline edit, history.

**Netlify Function**: `netlify/functions/creator-bios.js` — POST `/api/creator-bios/generate`

**Performance**: First paint < 1s, generation < 4s (more output = slightly longer), total JS < 20KB gzipped.

---

## Cross-Tool Links
- "Need a link page for that bio link?" → CreatorPage
- "Build a media kit?" → CreatorKit
- "Design profile graphics?" → CreatorCanvas
