# Prompt 09 — Repurpose (creator-repurpose)

> Content Repurposer — One piece of content → 5 platform-ready posts

---

## Identity

| Field | Value |
|-------|-------|
| Name | Repurpose |
| Slug | `creator-repurpose` |
| Path | `/tools/creator-repurpose/` |
| Accent | `#FFD60A` (Gold) |
| Accent Dark | `#B8960A` |
| Accent Light | `#FFFDE7` |
| Accent Glow | `rgba(255,214,10,.4)` |
| CSS Prefix | `crp-` |
| Type | AI Text Generation |

---

## What This Is

The biggest time-waster for creators: making one piece of content and then starting from scratch for every other platform. A YouTube video could become 5 Instagram posts, a tweet thread, a LinkedIn article, a newsletter snippet, and 3 TikTok scripts — but most creators never repurpose because it takes too long.

Repurpose fixes this. Paste your content (script, blog post, thread, newsletter) and it instantly generates platform-optimized versions for every channel. One input → multiple outputs. Multiply your content without multiplying your effort.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, gold accents
- **Two-panel layout**: Left = your source content. Right = repurposed outputs.
- **Source types**: YouTube script, blog post, tweet thread, newsletter, podcast notes, Instagram caption
- **Output targets**: Toggle which platforms you want outputs for
- **Each output is a platform-previewed card** — see it as it would look on that platform
- **Waterfall generation**: Outputs appear one by one, each platform card filling in with a typing animation

### The Feel
Gold = value, richness, multiplication. You're turning one thing into many things. The interface should feel like watching your content multiply before your eyes. Satisfying. Productive. Like you just saved yourself 3 hours of work.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "One Video. Five Platforms. Zero Extra Work." — animated diagram showing one content piece branching into multiple platform icons
**Features**: 6 source types, 7 output platforms, platform-native formatting, batch copy
**CTA**: "Start Repurposing →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout**:
```
┌──────────────────────────────────────────────────┐
│        Repurpose ⚡ One → Many                   │
├──────────────────────┬───────────────────────────┤
│                      │                           │
│  SOURCE CONTENT      │  REPURPOSED OUTPUTS       │
│                      │                           │
│  Source type:        │  Generate for:            │
│  [YT Script]        │  ☑ Instagram Caption      │
│  [Blog Post]        │  ☑ X Thread               │
│  [Tweet Thread]     │  ☑ LinkedIn Post           │
│  [Newsletter]       │  ☑ TikTok Script           │
│  [Podcast]          │  ☑ Newsletter Snippet      │
│  [IG Caption]       │  ☐ Facebook Post           │
│                      │  ☐ Blog Summary            │
│  ┌────────────────┐  │                           │
│  │ Paste your     │  │  ┌─ INSTAGRAM ─────────┐ │
│  │ content here   │  │  │ [Generated caption]  │ │
│  │                │  │  │ with proper IG       │ │
│  │ (or paste a    │  │  │ formatting...        │ │
│  │  YouTube URL   │  │  │ 📋 Copy              │ │
│  │  and we'll     │  │  └─────────────────────┘ │
│  │  extract the   │  │                           │
│  │  transcript)   │  │  ┌─ X THREAD ──────────┐ │
│  │                │  │  │ 1/5 First tweet...   │ │
│  │                │  │  │ 2/5 Second tweet...  │ │
│  │                │  │  │ ...                  │ │
│  │                │  │  │ 📋 Copy Thread       │ │
│  │                │  │  └─────────────────────┘ │
│  │                │  │                           │
│  │                │  │  ┌─ LINKEDIN ───────────┐ │
│  └────────────────┘  │  │ [Generated post]     │ │
│                      │  │ with LI formatting...│ │
│  2,450 words         │  │ 📋 Copy              │ │
│  ~12 min read        │  └─────────────────────┘ │
│                      │                           │
│  [Repurpose ⚡]      │  ┌─ TIKTOK SCRIPT ──────┐ │
│                      │  │ [3 short scripts]    │ │
│                      │  │ 📋 Copy              │ │
│                      │  └─────────────────────┘ │
│                      │                           │
│                      │  [Copy All 📋]           │
├──────────────────────┴───────────────────────────┤
│  💡 This script generated 5 pieces of content    │
│  That's 4+ hours of work saved                   │
└──────────────────────────────────────────────────┘
```

**Mobile**: Single column. Source input at top → Generate button → Outputs scroll below in platform cards.

---

## Source Types & Input Methods

### 1. YouTube Script / Video
- Paste the full script text
- OR paste a YouTube URL → tool extracts key points (AI summarizes, doesn't need actual transcript API)
- AI identifies the main points, key takeaways, quotable lines

### 2. Blog Post
- Paste the article text
- AI extracts headline, subheads, key arguments, quotable lines, statistics

### 3. Tweet Thread
- Paste the thread text
- AI expands into longer-form for other platforms

### 4. Newsletter
- Paste newsletter content
- AI extracts the core message and adapts tone per platform

### 5. Podcast Notes / Transcript
- Paste show notes or rough transcript
- AI structures into platform-ready content

### 6. Instagram Caption
- Paste existing caption
- AI adapts for other platforms (expand for LinkedIn, compress for X, restructure for TikTok)

---

## Output Formats

### Instagram Caption
- Hook in first line (before "...more")
- Proper line breaks
- CTA included
- 5-10 relevant hashtags
- 1-3 emoji used strategically

### X/Twitter Thread
- Split into tweet-sized chunks (280 chars each)
- Numbered (1/N format)
- First tweet is a hook
- Last tweet is CTA + retweet prompt
- 3-8 tweets depending on source length

### LinkedIn Post
- Professional tone adaptation
- Bold first line for feed visibility
- Short paragraphs
- Engagement question at end
- 3-5 hashtags at bottom

### TikTok Scripts (3 variations)
- Not captions — actual SCRIPTS for talking-head TikToks
- Each script is 30-60 seconds (60-120 words)
- Hook → Point → CTA
- Different angle per script (hot take, tutorial, storytime)

### Newsletter Snippet
- Subject line suggestion
- Opening paragraph hook
- Key takeaways as bullet points
- CTA for full content

### Facebook Post
- Longer narrative format
- Question-driven for comments
- Shareable framing

### Blog Summary
- Meta description (160 chars)
- Key takeaways (3-5 bullets)
- Social sharing snippet

---

## AI System Prompt

```
You are Repurpose, a content repurposing expert for African content creators.

RULES:
- Take the source content and create GENUINELY DIFFERENT versions for each requested platform
- Do NOT just copy-paste and shorten. Each platform version should feel NATIVE to that platform.
- Adapt tone: LinkedIn is more professional, TikTok is casual and fast, Instagram is visual-first
- Preserve the core message and key points but present them differently
- For X threads: each tweet must stand alone AND flow as a sequence
- For TikTok: write actual scripts (what to SAY), not captions
- For LinkedIn: restructure as thought leadership, not a casual share
- Include platform-specific elements (hashtags for IG, thread numbering for X, etc.)
- African context preservation — if the source mentions African specifics, keep them natural
- If the source is about a topic with African relevance, lean into it
- Calculate word count and read/watch time for each output

OUTPUT FORMAT (JSON):
{
  "source": {
    "type": "youtube_script",
    "wordCount": 2450,
    "keyPoints": ["Point 1", "Point 2", ...],
    "quotableLines": ["Best quote 1", "Best quote 2"]
  },
  "outputs": [
    {
      "platform": "instagram",
      "text": "...",
      "charCount": 1200,
      "hashtags": ["#tag1", "#tag2"],
      "format": "caption"
    },
    {
      "platform": "twitter",
      "tweets": [
        { "number": 1, "text": "...", "charCount": 245 },
        ...
      ],
      "format": "thread"
    },
    ...
  ],
  "timeSaved": "~4 hours of manual repurposing",
  "contentMultiplier": "1 video → 5 posts"
}
```

---

## Value Messaging

After generation, show a "value card":
- "You just turned 1 YouTube script into 5 platform-ready pieces of content"
- "Estimated time saved: ~4 hours"
- "Content multiplier: 5x"

This reinforces the tool's value and encourages sharing.

---

## Data Model

```sql
CREATE TABLE creator_repurpose_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_text TEXT NOT NULL,
  target_platforms JSONB DEFAULT '[]',
  outputs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_repurpose_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own repurpose history" ON creator_repurpose_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine, Function, Performance

**Engine**: `engines/creator-repurpose-engine.js` — process source, generate outputs, copy per platform, copy all, history.

**Netlify Function**: `netlify/functions/creator-repurpose.js` — POST `/api/creator-repurpose/generate`. Larger output = use Claude Sonnet or Haiku with generous token budget.

**Performance**: First paint < 1s, generation < 10s (multiple outputs), per-platform card render < 200ms, total JS < 25KB gzipped.

---

## Cross-Tool Links
- "Need hashtags for the Instagram post?" → TagWave
- "Design a carousel from this content?" → CarouselStudio
- "Create a thumbnail for the video?" → ThumbnailForge
- "Schedule all these posts?" → CreatorCalendar
