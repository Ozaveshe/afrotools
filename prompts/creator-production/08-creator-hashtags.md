# Prompt 08 — TagWave (creator-hashtags)

> Hashtag Generator — Trending, niche, and community tags for every platform

---

## Identity

| Field | Value |
|-------|-------|
| Name | TagWave |
| Slug | `creator-hashtags` |
| Path | `/tools/creator-hashtags/` |
| Accent | `#FF2D55` (Hot Pink) |
| Accent Dark | `#CC2444` |
| Accent Light | `#FFE5EB` |
| Accent Glow | `rgba(255,45,85,.4)` |
| CSS Prefix | `cht-` |
| Type | AI Text Generation |

---

## What This Is

A focused hashtag generator that gives creators ready-to-paste hashtag sets for any post. Not random tags — curated, categorized sets with a strategic mix of high-reach, mid-reach, and niche tags. Understands African creator communities, local trends, and platform-specific hashtag strategies.

Open → describe your post → get 3 hashtag sets → copy and paste → done.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, hot pink accents
- **Minimal input**: One text field — "What's the post about?"
- **Platform tabs**: Instagram, TikTok, X, LinkedIn, YouTube
- **Output as copyable tag clouds**: Hashtags displayed as colorful pills, sorted by reach level
- **Mix-and-match**: Drag tags between sets, toggle individual tags on/off
- **One-tap copy**: Copy the entire set or build a custom set

### The Feel
Fast, colorful, punchy. Hot pink is energetic and social-media-native. The hashtag pills should feel like a candy store — pick the ones you want, skip the rest. This is a 15-second tool. Don't overthink it.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "The Right Tags. Every Time." — animated hashtag cloud forming from search
**Features**: 3 strategic sets per generation, reach-level categorization, African community tags, platform-specific limits
**CTA**: "Generate Hashtags →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Layout**:
```
┌──────────────────────────────────────────┐
│            TagWave #️⃣                    │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ What's the post about?               │ │
│ │ e.g. "Behind the scenes of a Lagos   │ │
│ │ wedding photoshoot"                  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Instagram] [TikTok] [X] [LinkedIn] [YT] │
│                                          │
│  ───── Generate Tags 🏷️ ─────           │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ SET 1: THE BROAD REACH               │ │
│ │                                      │ │
│ │ 🔴 #Photography  #WeddingPhotography │ │
│ │ 🔴 #BehindTheScenes  #BTS           │ │
│ │ 🟡 #WeddingPhotographer  #BridalShoot│ │
│ │ 🟡 #NigerianWedding  #LagosWedding  │ │
│ │ 🟢 #LagosPhotographer               │ │
│ │ 🟢 #NaijaPhotographer               │ │
│ │                                      │ │
│ │ 10 tags · est. reach: 45M           │ │
│ │ [Copy Set 📋]                        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ SET 2: THE NICHE PLAY                │ │
│ │                                      │ │
│ │ 🟡 #AfricanWedding  #Owambe        │ │
│ │ 🟡 #AsoEbi  #NigerianBride         │ │
│ │ 🟢 #LagosWeddingPhotographer       │ │
│ │ 🟢 #NaijaWeddings  #Bellanaija     │ │
│ │ 🟢 #WeddingVendorLagos             │ │
│ │                                      │ │
│ │ 10 tags · est. reach: 8M            │ │
│ │ [Copy Set 📋]                        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ SET 3: THE COMMUNITY                 │ │
│ │                                      │ │
│ │ 🟢 #LagosCreatives                  │ │
│ │ 🟢 #NigerianPhotographers           │ │
│ │ 🟢 #AfricanCreators                 │ │
│ │ 🟢 #NaijaCreative  #MadeInLagos    │ │
│ │                                      │ │
│ │ 8 tags · est. reach: 2M             │ │
│ │ [Copy Set 📋]                        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 🔧 BUILD YOUR OWN MIX               │ │
│ │                                      │ │
│ │ Tap tags above to add/remove:        │ │
│ │ #Photography #NigerianWedding        │ │
│ │ #LagosPhotographer #Owambe          │ │
│ │ #AfricanCreators                     │ │
│ │                                      │ │
│ │ 5 of 30 max         [Copy Mix 📋]   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## Tag Categorization

### Reach Levels (color-coded pills)
- **🔴 High Reach** (1M+ posts): Broad, competitive. Gets impressions but hard to rank.
- **🟡 Mid Reach** (100K-1M posts): Sweet spot. Discoverable, less competitive.
- **🟢 Niche** (<100K posts): Community-specific. Higher engagement rate, builds authority.

### Strategic Mix
Each set follows a different strategy:
- **Set 1: Broad Reach** — 4 high, 4 mid, 2 niche. Maximum impressions.
- **Set 2: Niche Play** — 1 high, 4 mid, 5 niche. Higher engagement, community building.
- **Set 3: Community** — 0 high, 2 mid, 6-8 niche. African creator communities, local tags.

---

## Platform-Specific Rules

| Platform | Max Tags | Placement | Strategy |
|----------|----------|-----------|----------|
| Instagram | 30 (but 8-15 recommended) | Caption or first comment | Mix of all three reach levels |
| TikTok | 5-8 recommended | In caption | Discovery-critical, trending tags essential |
| X/Twitter | 1-3 max | In tweet body | Sparingly, only if trending or event-specific |
| LinkedIn | 3-5 | End of post | Professional, industry-specific |
| YouTube | 500 char limit in tags field | Backend tags | SEO keywords, not display hashtags |

The generator adapts set sizes and recommendations per platform.

---

## AI System Prompt

```
You are TagWave, a hashtag strategy expert for African content creators.

RULES:
- Generate exactly 3 hashtag sets with different strategies (Broad Reach, Niche Play, Community)
- Each set should have the right number of tags for the specified platform
- Categorize each tag by reach level (high/mid/niche) with estimated post count
- Include African creator community tags when relevant (#NaijaCreative, #KenyanCreator, #SACreatives, etc.)
- Include local/cultural tags when relevant (#Owambe, #Amapiano, #Jollof, etc.)
- NO banned or shadowbanned hashtags
- NO irrelevant tags just to fill the count
- Tags must be ACTUALLY USED on the platform — don't invent tags nobody searches
- For Instagram: aim for 10-15 tags per set
- For TikTok: aim for 5-8 tags per set
- Include trending/seasonal tags when applicable

OUTPUT FORMAT (JSON):
{
  "sets": [
    {
      "name": "THE BROAD REACH",
      "strategy": "Maximum impressions with competitive tags",
      "tags": [
        { "tag": "#Photography", "reach": "high", "estimatedPosts": "420M" },
        { "tag": "#NigerianWedding", "reach": "mid", "estimatedPosts": "850K" },
        { "tag": "#LagosPhotographer", "reach": "niche", "estimatedPosts": "42K" }
      ],
      "totalTags": 10,
      "estimatedReach": "45M"
    },
    ...
  ],
  "trendingNote": "🔥 #Detty December is trending right now — consider adding it if this is a December post",
  "avoidList": ["#FollowForFollow", "#Like4Like — these attract bots, not real engagement"]
}
```

---

## Mix-and-Match Builder

Below the 3 generated sets, a "Build Your Own Mix" section:
- Tap any tag in any set to toggle it into/out of your custom mix
- Selected tags appear in the builder with the count (e.g., "12 of 30 max")
- Color-coded so you can see your reach balance
- "Copy Mix" copies your custom selection
- Platform limit warning if you exceed recommendations

---

## Data Model

```sql
CREATE TABLE creator_hashtags_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  sets JSONB NOT NULL,
  custom_mix JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_hashtags_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hashtags" ON creator_hashtags_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine, Function, Performance

**Engine**: `engines/creator-hashtags-engine.js` — generate, toggle tag, build mix, copy variants, history.

**Netlify Function**: `netlify/functions/creator-hashtags.js` — POST `/api/creator-hashtags/generate`

**Performance**: First paint < 800ms, generation < 2s (short output), tag toggle < 50ms, total JS < 15KB gzipped.

---

## Cross-Tool Links
- "Need a caption to go with these?" → CaptionCraft
- "Design the post?" → CarouselStudio or CreatorCanvas
- "Schedule this post?" → CreatorCalendar
