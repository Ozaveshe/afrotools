# Prompt 03 — TitleSmith (creator-titles)

> Title & Headline Generator — Click-worthy titles for YouTube, blogs, and social posts

---

## Identity

| Field | Value |
|-------|-------|
| Name | TitleSmith |
| Slug | `creator-titles` |
| Path | `/tools/creator-titles/` |
| Accent | `#007AFF` (Electric Blue) |
| Accent Dark | `#0063D1` |
| Accent Light | `#E0F0FF` |
| Accent Glow | `rgba(0,122,255,.4)` |
| CSS Prefix | `cts-` |
| Type | AI Text Generation |

---

## What This Is

A single-purpose AI title generator. Creator types a topic or idea, picks a platform, and instantly gets 10+ title variations in different styles. No menus. No dashboards. One input → instant output. Copy and go.

This is what a creator opens when they've finished recording a video and need a title in 30 seconds. Or when they're writing a blog post and want headline options. Or when they need an email subject line that gets opened.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background
- **One massive input field** at the top — that's it. No forms, no dropdowns before the input.
- **Platform pills** below input — YouTube, Blog, Newsletter, Instagram, X, LinkedIn (default: YouTube)
- **Results flow immediately** — as soon as the user submits, titles stream in with typing animation
- **Each title is a card** — tap to copy, star to favorite, tap "variations" for more like this
- **No page reloads** — everything happens in one view

### The Feel
Think Google search. One box. Type. Get results. But the results are creative, varied, and immediately usable. Not a chat interface. Not a form. A generator.

---

## Pages

### 1. Landing Page — `index.html`
Light theme, standard `tool-landing.css`.

**Hero**: "Titles That Get Clicked" — show a boring title transforming into 5 engaging variations with typing animation
**Stats**: Styles | Platforms | Character limits
**Features**: 8 title styles, platform optimization, A/B comparison, character counting
**Social proof**: Examples of before/after titles
**CTA**: "Generate Titles →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout**:
```
┌──────────────────────────────────────────────┐
│              TitleSmith ⚡                    │
│                                              │
│  ┌────────────────────────────────────────┐   │
│  │ What's your content about?             │   │ ← Large input
│  │                                        │   │
│  │ e.g. "How I grew from 0 to 100K on    │   │
│  │  YouTube as a Nigerian creator"        │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  [YouTube] [Blog] [Newsletter] [IG] [X] [LI] │ ← Platform pills
│                                              │
│  ─────── Generate 🔥 ───────                │ ← Generate button
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 🔥 THE CLICKBAIT                     │    │
│  │ "I Went From 0 to 100K Subscribers   │    │
│  │  in Lagos — Here's What NOBODY Tells  │    │
│  │  You"                                 │    │
│  │ 58 chars ✓    [Copy] [♡] [More ↻]    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 📊 THE SEO-OPTIMIZED                 │    │
│  │ "How to Grow a YouTube Channel in    │    │
│  │  Nigeria: 0 to 100K Guide (2026)"    │    │
│  │ 52 chars ✓    [Copy] [♡] [More ↻]    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ... more title cards ...                    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ ⚡ A/B TEST                          │    │
│  │ Which is stronger?                    │    │
│  │ [Title A] vs [Title B]               │    │
│  │ Winner: Title A — stronger hook,     │    │
│  │ curiosity gap, personal angle        │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Mobile**: Same but full-width, cards stack vertically, platform pills scroll horizontally.

---

## Title Styles (8 categories)

Each generation produces one title per style:

1. **The Clickbait** — Curiosity gap, bold claims, emotional triggers
   - "I Tried [X] for 30 Days — The Results Will SHOCK You"

2. **The SEO-Optimized** — Keywords first, search-friendly, clear intent
   - "How to [X]: Complete Guide for [Audience] (2026)"

3. **The Storyteller** — Personal narrative, journey, transformation
   - "From [Bad State] to [Good State]: My [Timeframe] Journey"

4. **The Listicle** — Numbers, lists, quantified value
   - "7 [Things] Every [Audience] Needs to Know About [Topic]"

5. **The Question** — Provocative question that demands an answer
   - "Why Are [Audience] Still [Doing Wrong Thing] in 2026?"

6. **The Bold Claim** — Controversial, strong opinion, hot take
   - "[Popular Belief] Is WRONG — Here's the Truth"

7. **The How-To** — Practical, clear, actionable
   - "How I [Achieved X] in [Timeframe] (Step-by-Step)"

8. **The Viral** — Trend-riding, platform-native, shareable
   - "POV: You're a [Creator Type] in [African City] and..."

---

## Platform-Specific Rules

| Platform | Max Length | Notes |
|----------|-----------|-------|
| YouTube | 60 chars recommended, 100 max | Front-load keywords, use brackets |
| Blog/Article | 60-70 chars for SEO | Include primary keyword early |
| Newsletter Subject | 50 chars recommended | Personalization, urgency work |
| Instagram | No limit but first line matters | Hook in first 5 words, emoji OK |
| X/Twitter | 280 chars total post | Short, punchy, no fluff |
| LinkedIn | 150 chars visible before "see more" | Professional tone, value-first |

Character count shown live on each generated title. Green check if within limit, yellow warning if close, red if over.

---

## AI System Prompt

```
You are TitleSmith, a title generation expert for African content creators.

RULES:
- Generate exactly 8 titles, one per style: Clickbait, SEO, Storyteller, Listicle, Question, Bold Claim, How-To, Viral
- Each title must be for the specified platform with appropriate length
- Use African context naturally — don't force it, but reference when relevant (Lagos, Nairobi, Accra, SA, African creator culture)
- Never use generic Western references when African ones work better
- Include character count for each title
- Make EVERY title genuinely interesting — no filler titles
- Vary sentence structure across the 8 — don't repeat patterns
- For YouTube: use brackets like [2026 Guide] or (Watch This) sparingly but effectively

OUTPUT FORMAT (JSON):
{
  "titles": [
    {
      "style": "clickbait",
      "styleLabel": "🔥 THE CLICKBAIT",
      "title": "...",
      "charCount": 58,
      "withinLimit": true,
      "whyItWorks": "Curiosity gap + personal angle + unexpected outcome"
    },
    ...
  ],
  "abTest": {
    "titleA": 0,
    "titleB": 1,
    "winner": "A",
    "reason": "Stronger emotional hook and more specific claim"
  }
}
```

---

## Interaction Details

### Generation Flow
1. User types topic in the input field
2. Selects platform (YouTube default, optional change)
3. Taps "Generate" (or presses Enter)
4. Loading state: input pulses with blue glow, skeleton cards appear
5. Titles stream in one by one with typing animation (200ms delay between cards)
6. A/B test section appears last

### Card Actions
- **Copy**: Tap "Copy" → title copied to clipboard → button text changes to "Copied ✓" for 2s
- **Favorite**: Tap star → saves to favorites (localStorage + Supabase)
- **More Like This**: Tap "More ↻" → generates 3 more variations in the same style
- **Edit**: Tap the title text to edit it inline (manually tweak AI output)

### A/B Test Section
- AI picks the 2 strongest titles and compares them
- Shows a brief analysis of why one is stronger
- User can tap "Test Different Pair" to compare other combinations
- This is the value-add that makes it more than just a list of titles

### History
- Last 20 generations saved in localStorage
- Accessible via "History" icon in top bar
- Each entry shows the topic + platform + timestamp
- Tap to reload that generation's results

---

## Data Model

```sql
CREATE TABLE creator_titles_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'youtube',
  titles JSONB NOT NULL,
  favorited JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_titles_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own history" ON creator_titles_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine — `engines/creator-titles-engine.js`

```javascript
(function() {
  'use strict';
  const TitlesEngine = {
    currentPlatform: 'youtube',
    history: [],
    favorites: [],

    init() {},
    setPlatform(platform) {},
    generate(topic) {},   // Calls Netlify function, returns titles
    regenerateStyle(topic, style) {},  // "More like this"
    copyTitle(text) {},
    toggleFavorite(titleIndex) {},
    getHistory() {},
    clearHistory() {},
    saveLocal() {},
    loadLocal() {},
  };
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorTitles = TitlesEngine;
})();
```

---

## Netlify Function — `netlify/functions/creator-titles.js`

- **Endpoint**: POST `/api/creator-titles/generate`
- **Body**: `{ topic, platform }`
- **AI Model**: Claude Haiku for speed (< 3s response)
- **Rate Limit**: 10 generations per day (free), 50 (pro)
- **Response**: JSON with 8 titles + A/B analysis

---

## Performance

- First paint < 1s on 3G (minimal UI)
- Generation response < 3s
- Title card render < 100ms each
- Typing animation: 30ms per character
- Total JS < 25KB gzipped (this is a simple tool)

---

## Cross-Tool Links

- "Design a thumbnail for this title?" → ThumbnailForge
- "Write a hook for this video?" → HookFactory
- "Need a description?" → CaptionCraft
- "Generate hashtags?" → TagWave

---

## What This Is NOT

- NOT a blog content writer (it generates titles only, not articles)
- NOT an SEO tool (no keyword research, no SERP analysis)
- NOT a chat interface (no back-and-forth conversation)
- One input → instant titles → copy and go
