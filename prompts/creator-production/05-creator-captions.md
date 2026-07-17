# Prompt 05 — CaptionCraft (creator-captions)

> AI Caption Writer — Platform-perfect captions with one tap

---

## Identity

| Field | Value |
|-------|-------|
| Name | CaptionCraft |
| Slug | `creator-captions` |
| Path | `/tools/creator-captions/` |
| Accent | `#5AC8FA` (Cyan) |
| Accent Dark | `#0EA5E9` |
| Accent Light | `#E0F7FF` |
| Accent Glow | `rgba(90,200,250,.4)` |
| CSS Prefix | `ccr-` |
| Type | AI Text Generation |

---

## What This Is

A caption generator that understands platforms. Not "write me a caption" — but "write me an Instagram caption that hooks in the first line, uses line breaks properly, includes a CTA, and adds relevant hashtags." Or a LinkedIn post that starts with a bold first line, uses short paragraphs, and ends with a question for engagement.

The difference from CreatorMind: CaptionCraft is single-purpose. Open → describe your post → get 3 variations → copy the best one. 30 seconds, done. CreatorMind is the full Swiss Army knife. This is the dedicated caption scalpel.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, cyan accents
- **Split view**: Left side = your input brief. Right side = generated captions in platform-realistic preview cards
- **Phone mockups**: Each caption rendered inside a platform-specific phone mockup (IG post mockup, tweet mockup, LinkedIn mockup) so you SEE exactly how it will look
- **Inline editing**: Tap any generated caption to edit it directly
- **Character/line counter**: Live count showing platform limits

### The Feel
Clean, spacious, focused. Cyan is calm and clear — this isn't about drama, it's about craft. The output should feel like reading actual social posts, not AI-generated text in a box.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "Captions That Sound Like You, Not a Robot" — show a phone with caption text appearing in real-time
**Features**: Platform formatting, tone selection, CTA builder, hashtag integration, 3 variations per generation
**CTA**: "Write a Caption →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout**:
```
┌──────────────────────────────────────────────────┐
│              CaptionCraft ✍️                     │
├──────────────────────┬───────────────────────────┤
│                      │                           │
│   YOUR BRIEF         │    GENERATED CAPTIONS     │
│                      │                           │
│   What's the post    │    ┌─IG PREVIEW ─────┐    │
│   about?             │    │ @yourhandle      │    │
│   [textarea]         │    │                  │    │
│                      │    │ Caption text     │    │
│   Platform:          │    │ with proper      │    │
│   [IG][X][LI]        │    │ line breaks...   │    │
│   [TikTok][FB]       │    │                  │    │
│                      │    │ #hashtags        │    │
│   Tone:              │    │ [Copy] [Edit]    │    │
│   [Casual][Pro]      │    └─────────────────┘    │
│   [Bold][Playful]    │                           │
│   [Inspirational]    │    ┌─ VARIATION 2 ───┐    │
│                      │    │ ...              │    │
│   Include:           │    └─────────────────┘    │
│   ☑ CTA              │                           │
│   ☑ Hashtags         │    ┌─ VARIATION 3 ───┐    │
│   ☑ Emoji            │    │ ...              │    │
│   ☐ Question at end  │    └─────────────────┘    │
│                      │                           │
│   [Generate ✨]      │                           │
├──────────────────────┴───────────────────────────┤
│  Recent: [saved caption 1] [saved caption 2]     │
└──────────────────────────────────────────────────┘
```

**Mobile**: Brief inputs on top, generated captions scroll below. Full-width cards.

---

## Platform-Specific Formatting

### Instagram
- **First line is everything** — hook before the "...more" truncation (125 chars visible)
- **Line breaks**: Use actual line breaks (not `\n` — proper spacing)
- **Hashtags**: 5-15 hashtags, separated from caption by 5 line breaks (or in first comment)
- **Emoji**: Strategic placement, not excessive
- **CTA**: "Link in bio", "Save this post", "Share with someone who..."
- **Max length**: 2,200 chars
- **Preview shows**: How it looks in feed with truncation

### X/Twitter
- **Character limit**: 280 chars (hard limit)
- **Thread option**: If content is long, split into numbered thread (1/5, 2/5...)
- **No hashtags in body** — hashtags feel spammy on X, use sparingly
- **Punchy**: Short sentences. Line breaks for emphasis.
- **Preview shows**: Tweet card mockup

### LinkedIn
- **First 2 lines visible** before "...see more" — make them count
- **Short paragraphs**: 1-2 sentences each, lots of whitespace
- **Professional tone**: Even casual LinkedIn has structure
- **End with engagement question**: "What do you think?" "Have you experienced this?"
- **No hashtags in body** — 3-5 hashtags at the very end
- **Preview shows**: LinkedIn post mockup

### TikTok
- **Super short**: 150 chars recommended
- **Hashtags are crucial**: Platform discovery depends on them
- **Emoji-heavy**: This platform is visual
- **Trending sounds/references**: Mention relevant trends
- **Preview shows**: TikTok description mockup

### Facebook
- **Longer OK**: Facebook algorithm likes longer posts (100+ words)
- **Storytelling works**: Narrative posts perform well
- **Questions drive comments**: End with a question
- **Preview shows**: Facebook post mockup

---

## Tone Options

| Tone | Description | Example vibe |
|------|-------------|-------------|
| Casual | Relaxed, conversational, like texting a friend | "So like... this happened today" |
| Professional | Polished, authoritative, credible | "I've spent 5 years studying this" |
| Bold | Confident, unapologetic, strong statements | "Let's be real about something" |
| Playful | Fun, witty, light-hearted | "POV: you just discovered..." |
| Inspirational | Motivating, uplifting, empowering | "Your journey is valid. Your hustle matters." |
| Educational | Informative, structured, teacher-mode | "Here's what most people get wrong about..." |

---

## AI System Prompt

```
You are CaptionCraft, a social media caption expert for African content creators.

RULES:
- Generate exactly 3 caption variations, each with a different approach
- Follow platform-specific formatting rules EXACTLY (line breaks, character limits, hashtag placement)
- Each variation should have a different energy: one safe/reliable, one creative/bold, one unique/unexpected
- African cultural context when natural — don't force it, but don't sanitize it either
- Include the requested elements (CTA, hashtags, emoji, question) when toggled on
- Hashtags must be relevant — mix of high-traffic and niche-specific
- First line is ALWAYS a hook — never start with "Hey everyone" or "Good morning"
- Captions should sound like a REAL PERSON wrote them, not an AI

OUTPUT FORMAT (JSON):
{
  "captions": [
    {
      "variation": 1,
      "label": "The Reliable One",
      "text": "...",
      "charCount": 245,
      "withinLimit": true,
      "hashtags": ["#AfricanCreator", "#ContentTips", "..."],
      "cta": "Save this for later 🔖",
      "firstLinePreview": "What I learned losing ₦2M on a brand deal..."
    },
    ...
  ],
  "platformTip": "On Instagram, your first 125 characters appear before 'more'. This caption's hook is 98 chars — it fits perfectly."
}
```

---

## Platform Preview Mockups

Each generated caption is rendered inside a minimal platform mockup:

### Instagram Mockup
```html
<div class="ccr-ig-preview">
  <div class="ccr-ig-header">
    <div class="ccr-ig-avatar"></div>
    <span class="ccr-ig-handle">@yourhandle</span>
    <span class="ccr-ig-time">2m</span>
  </div>
  <div class="ccr-ig-image">[Your Post Image]</div>
  <div class="ccr-ig-actions">♡ 💬 ↗ 🔖</div>
  <div class="ccr-ig-caption">
    <strong>yourhandle</strong> Caption text here with proper
    line breaks and formatting...
    <span class="ccr-ig-more">more</span>
  </div>
</div>
```

The mockup is CSS-only (no screenshots), dark-themed to match the workspace.

---

## Additional Features

### Hashtag Sets
When hashtags are enabled, show them in categorized groups:
- **High reach**: #ContentCreator, #AfricanCreator (100K+ posts)
- **Mid reach**: #NigerianYouTuber, #KenyanCreator (10K-100K posts)
- **Niche**: #LagosPhotographer, #AfroTechCreator (1K-10K posts)

User can toggle individual hashtags on/off before copying.

### Caption Rewriter
Paste an existing caption → "Rewrite This" → get 3 improved versions.
Same interface, different entry point. Tab at top: "Write New" | "Rewrite Existing"

### Copy Options
- **Copy caption only** — just the text, no hashtags
- **Copy with hashtags** — text + hashtags
- **Copy hashtags only** — just the hashtag block
- **Copy for first comment** — caption without hashtags (they go in comment)

---

## Data Model

```sql
CREATE TABLE creator_captions_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  tone TEXT DEFAULT 'casual',
  captions JSONB NOT NULL,
  favorited JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_captions_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own captions" ON creator_captions_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine, Function, Performance

**Engine**: `engines/creator-captions-engine.js` — standard IIFE with generate, rewrite, copy variants, history management.

**Netlify Function**: `netlify/functions/creator-captions.js` — POST `/api/creator-captions/generate` and `/api/creator-captions/rewrite`

**Performance**: First paint < 1s, generation < 3s, total JS < 25KB gzipped.

---

## Cross-Tool Links
- "Need hashtags?" → TagWave
- "Create a carousel for this?" → CarouselStudio
- "Schedule this post?" → CreatorCalendar
- "Design a graphic to go with it?" → CreatorCanvas
