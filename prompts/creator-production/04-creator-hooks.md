# Prompt 04 — HookFactory (creator-hooks)

> Video Hook Generator — First 3 seconds that stop the scroll

---

## Identity

| Field | Value |
|-------|-------|
| Name | HookFactory |
| Slug | `creator-hooks` |
| Path | `/tools/creator-hooks/` |
| Accent | `#FF9500` (Neon Orange) |
| Accent Dark | `#CC7700` |
| Accent Light | `#FFF3E0` |
| Accent Glow | `rgba(255,149,0,.4)` |
| CSS Prefix | `ch-` |
| Type | AI Text Generation |

---

## What This Is

A hook generator for short-form and long-form video. The first 3-5 seconds decide everything — will they keep watching or scroll past? This tool generates multiple opening hooks for any video topic, optimized by platform and content type.

The killer feature: **Teleprompter Mode**. After generating hooks, tap one and it becomes a scrolling teleprompter on your screen. Hold your phone up, hit record on another device, and read the hook directly. This is what makes creators come back daily.

---

## Design Philosophy

### The Interface
- **Dark studio**: `#0f0f0f` background with orange accent glows
- **Input area**: Topic + platform selection at top
- **Hook cards**: Generated hooks appear as large, readable cards
- **Each card has a "Teleprompter" button** — tap it, screen goes full-screen black with large white scrolling text
- **Video type selector**: Educational, entertainment, storytime, review, tutorial, reaction
- **Platform pills**: TikTok, Reels, Shorts, YouTube (long-form)

### The Feel
Energetic. Orange is urgent, attention-grabbing — like the hooks themselves. The UI should feel fast, punchy, no-nonsense. A creator opens this tool 5 minutes before recording.

---

## Pages

### 1. Landing Page — `index.html`
Light theme, standard pattern.

**Hero**: "3 Seconds to Hook or Lose Them" — animated counter showing a scroll feed stopping on a hook
**Stats**: Hook types | Platforms | Teleprompter mode
**Features**: 6 hook categories, teleprompter, platform-native hooks, save favorites
**CTA**: "Generate Hooks →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Layout**:
```
┌──────────────────────────────────────────┐
│          HookFactory 🔥                  │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ What's the video about?              │ │ ← Input
│ │                                      │ │
│ │ e.g. "Why most Nigerian startups     │ │
│ │  fail in the first year"             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [TikTok] [Reels] [Shorts] [YouTube]      │ ← Platform
│                                          │
│ [Educational] [Story] [Review]           │ ← Content type
│ [Tutorial] [Reaction] [Entertainment]    │
│                                          │
│  ───── Generate Hooks 🔥 ─────          │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⚡ THE PATTERN INTERRUPT              │ │
│ │                                      │ │
│ │ "Stop. If you're about to start a    │ │
│ │  business in Nigeria, you need to    │ │
│ │  hear this first."                   │ │
│ │                                      │ │
│ │ 3.2s read time                       │ │
│ │ [Copy] [📱 Teleprompter] [♡]        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 🤔 THE QUESTION                      │ │
│ │                                      │ │
│ │ "Why do 90% of Nigerian startups     │ │
│ │  fail? I've been studying this for   │ │
│ │  2 years and the answer isn't what   │ │
│ │  you think."                         │ │
│ │                                      │ │
│ │ 4.1s read time                       │ │
│ │ [Copy] [📱 Teleprompter] [♡]        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ... more hook cards ...                  │
└──────────────────────────────────────────┘
```

---

## Hook Categories (6)

1. **The Pattern Interrupt**
   - Commands attention with "Stop.", "Wait.", "Don't scroll."
   - Breaks the infinite scroll reflex
   - Read time: 2-3 seconds

2. **The Question**
   - Asks something the viewer can't help but think about
   - Creates a curiosity gap that demands an answer
   - "Have you ever wondered why..."

3. **The Bold Statement**
   - Starts with a controversial or surprising claim
   - "Most advice about [topic] is wrong."
   - Forces the viewer to either agree or stay to argue

4. **The Story Opener**
   - "Last week, something happened that changed everything..."
   - Narrative pull — the viewer needs to know what happened
   - Emotional setup

5. **The Statistic**
   - Leads with a shocking number or data point
   - "93% of [group] don't know this about [topic]"
   - Authority + surprise

6. **The Direct Address**
   - Calls out the specific viewer
   - "If you're a [creator type] in [city], this is for you."
   - Feels personal, creates belonging

---

## AI System Prompt

```
You are HookFactory, a video hook expert for African content creators.

RULES:
- Generate exactly 6 hooks, one per category: Pattern Interrupt, Question, Bold Statement, Story Opener, Statistic, Direct Address
- Each hook must be 2-5 seconds of spoken word (roughly 8-25 words)
- Calculate estimated read time (average speaking pace: 150 words per minute)
- Hooks must feel NATURAL when spoken aloud — no written-language phrases
- Use African context when relevant — cities, cultural references, local expressions
- Platform-specific:
  - TikTok/Reels: Ultra-short (2-3s), punchy, informal, trending language OK
  - Shorts: Slightly longer OK (3-4s), can be more informational
  - YouTube long-form: Can be 4-5s, more narrative setup allowed
- NEVER start with "Hey guys" or "What's up everyone" — those are weak hooks
- Every hook should create a REASON to keep watching

OUTPUT FORMAT (JSON):
{
  "hooks": [
    {
      "category": "pattern_interrupt",
      "categoryLabel": "⚡ THE PATTERN INTERRUPT",
      "text": "Stop. If you're about to start a business in Nigeria, you need to hear this first.",
      "wordCount": 17,
      "readTimeSeconds": 3.2,
      "whyItWorks": "Imperative command breaks scroll pattern, creates urgency with 'you need to hear this'",
      "deliveryTip": "Pause after 'Stop.' Look directly at camera. Lower your voice on 'you need to hear this first.'"
    },
    ...
  ]
}
```

---

## Teleprompter Mode

This is the killer differentiator. When a creator taps "Teleprompter" on a hook card:

### The Experience
1. Screen goes **full-screen** (uses Fullscreen API)
2. Background becomes **pure black**
3. Hook text appears in **large white text** (48-72px depending on text length)
4. Text **auto-scrolls** at a comfortable reading pace
5. **Mirror mode toggle** — flips text horizontally for front-facing camera reflections
6. **Speed control** — slower/faster buttons, or drag to adjust
7. **Pause/Resume** — tap screen to pause, tap again to resume
8. **Countdown** — optional 3-2-1 countdown before scroll starts (for setting up recording)
9. **Exit** — swipe down or tap X in corner

### Technical Implementation
```javascript
// Teleprompter mode
function startTeleprompter(text, options = {}) {
  const speed = options.speed || 1; // 1 = normal, 0.5 = slow, 2 = fast
  const mirror = options.mirror || false;
  const countdown = options.countdown || 3;

  // Create fullscreen overlay
  const overlay = document.createElement('div');
  overlay.className = 'ch-teleprompter';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:#000;display:flex;align-items:center;justify-content:center;
    ${mirror ? 'transform:scaleX(-1);' : ''}
  `;

  // Text element with auto-scroll
  const textEl = document.createElement('div');
  textEl.style.cssText = `
    color:#fff;font-size:clamp(36px,8vw,72px);font-weight:700;
    font-family:'DM Sans',sans-serif;text-align:center;
    padding:0 40px;line-height:1.4;max-width:800px;
    animation:ch-scroll ${text.length * 0.08 / speed}s linear;
  `;
  textEl.textContent = text;
  // ... setup controls, countdown, fullscreen
}
```

### Mobile UX
- On mobile, teleprompter is the primary use case
- Creator holds phone at eye level, reads hook while camera records on another device
- Or props phone behind laptop camera for eye-level reading
- Touch anywhere to pause/resume
- Swipe down to exit

---

## Additional Features

### Delivery Tips
Each hook comes with a "Delivery Tip" — how to SAY it for maximum impact:
- Where to pause
- Voice tone changes
- Facial expression suggestions
- Hand gesture cues

### Read Time Calculator
Every hook shows estimated read time in seconds:
- Calculated at 150 words per minute speaking pace
- Color coded: Green (2-3s), Yellow (3-4s), Orange (4-5s), Red (5s+)
- Platform-appropriate warnings: "This hook is 4.8s — might lose TikTok viewers"

### Combine Hooks
"Merge" button lets you combine elements from different hooks:
- Take the opening of Hook 1 + the ending of Hook 3
- Edit inline to blend

---

## Data Model

```sql
CREATE TABLE creator_hooks_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT DEFAULT 'tiktok',
  content_type TEXT DEFAULT 'educational',
  hooks JSONB NOT NULL,
  favorited JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_hooks_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hooks" ON creator_hooks_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine — `engines/creator-hooks-engine.js`

Standard IIFE module with:
- `generate(topic, platform, contentType)` — calls Netlify function
- `startTeleprompter(text, options)` — fullscreen teleprompter
- `stopTeleprompter()` — exit teleprompter
- `copyHook(text)` — clipboard
- `toggleFavorite(hookIndex)` — save hook
- `getHistory()` / `saveLocal()` / `loadLocal()`

---

## Netlify Function — `netlify/functions/creator-hooks.js`

- POST `/api/creator-hooks/generate`
- Body: `{ topic, platform, contentType }`
- Claude Haiku, < 3s response
- Rate limit: 10/day free, 50/day pro

---

## Performance

- First paint < 1s
- Generation < 3s
- Teleprompter launch < 200ms
- Total JS < 20KB gzipped

---

## Cross-Tool Links

- "Now write the full script?" → ScriptPad
- "Generate a title for this video?" → TitleSmith
- "Create a thumbnail?" → ThumbnailForge
