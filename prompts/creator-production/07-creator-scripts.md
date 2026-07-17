# Prompt 07 — ScriptPad (creator-scripts)

> Video Script Generator — Full scripts for YouTube, podcasts, and voiceovers

---

## Identity

| Field | Value |
|-------|-------|
| Name | ScriptPad |
| Slug | `creator-scripts` |
| Path | `/tools/creator-scripts/` |
| Accent | `#5856D6` (Indigo) |
| Accent Dark | `#4338CA` |
| Accent Light | `#EEF2FF` |
| Accent Glow | `rgba(88,86,214,.4)` |
| CSS Prefix | `csc-` |
| Type | AI Text Generation |

---

## What This Is

A full video/audio script generator. Not just a hook or a caption — a complete, structured script with intro, sections, transitions, CTAs, B-roll suggestions, and outro. This is what a creator uses when they're about to shoot a YouTube video and need the entire script laid out.

The difference from HookFactory: HookFactory does the first 3 seconds. ScriptPad does the full 5-15 minutes.
The difference from CreatorMind: CreatorMind is a general AI writer. ScriptPad is purpose-built for video/audio scripts with structure, timestamps, and visual/audio cues.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, indigo accents
- **Writer-mode layout**: Full-width script display, like a document editor but dark
- **Script sections visually separated**: Each section (intro, point 1, point 2, outro) is a collapsible card
- **B-roll/visual cues in the margin**: Side annotations showing "Show screenshot here" or "Cut to product shot"
- **Teleprompter integration**: Built-in — any section or full script can be read in teleprompter mode
- **Word count + estimated duration**: Live counter showing script length and video duration

### The Feel
Focused, calm, professional. Indigo is deep and thoughtful — this is where the creative work happens. The UI should feel like a premium writing app (Notion, iA Writer) but purpose-built for video scripts. No clutter. Just the script.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "Scripts That Write Themselves" — show a script being generated section by section with typing animation
**Features**: 5 script formats, B-roll suggestions, timestamp markers, teleprompter, export to PDF
**CTA**: "Start Writing →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout**:
```
┌──────────────────────────────────────────────────┐
│ [←] ScriptPad      [📱 Teleprompter] [↓ Export]  │
├──────────────────────────────────────────────────┤
│                                                  │
│   WHAT'S THE VIDEO ABOUT?                        │
│   ┌──────────────────────────────────────────┐   │
│   │ e.g. "5 mistakes Nigerian startups make  │   │
│   │ that kill their funding chances"          │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   FORMAT          DURATION        PLATFORM        │
│   [YouTube]       [5-8 min]       [YouTube]       │
│   [Podcast]       [8-12 min]      [TikTok]        │
│   [Voiceover]     [12-20 min]     [Course]        │
│   [Educational]                                   │
│   [Storytime]                                     │
│                                                  │
│   ───── Write My Script ✍️ ─────                 │
│                                                  │
│ ═══════════════════════════════════════════════   │
│                                                  │
│   YOUR SCRIPT          │  NOTES                  │
│   ─────────────        │  ─────                  │
│                        │                         │
│   ▼ HOOK (0:00-0:15)   │  🎬 Face close-up       │
│   ┌────────────────┐   │  📸 Show stats graphic  │
│   │ "Every week,   │   │                         │
│   │ another Nige-  │   │                         │
│   │ rian startup   │   │                         │
│   │ dies. Not be-  │   │                         │
│   │ cause of bad   │   │                         │
│   │ ideas..."      │   │                         │
│   └────────────────┘   │                         │
│                        │                         │
│   ▼ INTRO (0:15-0:45)  │  🎬 B-roll: office      │
│   ┌────────────────┐   │  📊 Overlay: 5 mistakes │
│   │ "I've worked   │   │                         │
│   │ with 30+       │   │                         │
│   │ startups..."   │   │                         │
│   └────────────────┘   │                         │
│                        │                         │
│   ▼ POINT 1 (0:45-2:00)│  🎬 Screen recording   │
│   ┌────────────────┐   │                         │
│   │ "Mistake #1:   │   │                         │
│   │ Chasing VC     │   │                         │
│   │ money before   │   │                         │
│   │ proving..."    │   │                         │
│   └────────────────┘   │                         │
│                        │                         │
│   ... more sections    │                         │
│                        │                         │
│   ▼ CTA (7:00-7:30)   │  🎬 End screen          │
│   ┌────────────────┐   │  📢 Subscribe button    │
│   │ "If you found  │   │                         │
│   │ this helpful,  │   │                         │
│   │ hit subscribe" │   │                         │
│   └────────────────┘   │                         │
│                        │                         │
│   ▼ OUTRO (7:30-8:00)  │  🎬 Outro template     │
│   ┌────────────────┐   │                         │
│   │ Sign off text  │   │                         │
│   └────────────────┘   │                         │
│                        │                         │
├──────────────────────────────────────────────────┤
│ 1,847 words · ~8 min read · Est. 7:30 video      │
└──────────────────────────────────────────────────┘
```

**Mobile**: Single column, notes collapse into expandable tags inline, teleprompter button sticky at bottom.

---

## Script Formats (5)

### 1. YouTube Standard
- Hook (0-15s) → Intro/credibility (15-45s) → Main points (body) → CTA (last 30s) → Outro
- B-roll suggestions per section
- Transition phrases between points
- YouTube-specific: "Subscribe", "Comment below", "Watch next"

### 2. Podcast/Audio
- Cold open (teaser clip) → Intro jingle/welcome → Topic setup → Discussion points → Takeaways → Outro/next episode teaser
- No visual cues — audio-only notes (sound effects, music transitions)
- Conversational tone, as if talking to one person

### 3. Voiceover/Narration
- Clean, no filler words, measured pacing
- Timed to accompany visuals
- Pause markers [PAUSE 2s] for emphasis
- Best for product videos, explainers, documentaries

### 4. Educational/Tutorial
- Learning objective stated upfront
- Step-by-step structure with numbered steps
- "Show screen" markers for screen recordings
- Knowledge check questions woven in
- Summary/recap at end

### 5. Storytime
- Narrative arc: Setup → Rising action → Climax → Resolution → Lesson
- Emotional beats marked
- Pacing notes (speed up here, slow down here)
- Audience engagement hooks ("You won't believe what happened next")

---

## AI System Prompt

```
You are ScriptPad, a video script writing expert for African content creators.

RULES:
- Generate a COMPLETE script, not an outline. Write every word the creator will say.
- Structure with clear sections, each with a timestamp estimate
- Match the requested format (YouTube/Podcast/Voiceover/Educational/Storytime)
- Match the requested duration — a 5-8 min YouTube video = ~1200-1800 words
- Include B-roll/visual suggestions in [brackets] within each section
- Include transition phrases between sections
- Write in SPOKEN language, not written. Short sentences. Contractions. Natural flow.
- African context where relevant — don't force it, but let it be natural
- Hook must be compelling (use HookFactory-style techniques)
- CTA must be specific and natural, not "please like and subscribe" boilerplate
- Include delivery notes: [PAUSE], [EMPHASIS], [SHOW SCREEN], [CUT TO B-ROLL]

OUTPUT FORMAT (JSON):
{
  "title": "5 Mistakes Killing Nigerian Startups",
  "format": "youtube",
  "estimatedDuration": "7:30",
  "wordCount": 1650,
  "sections": [
    {
      "type": "hook",
      "label": "HOOK",
      "timestamp": "0:00-0:15",
      "text": "Every week, another Nigerian startup dies. Not because of bad ideas — Nigeria has the best ideas on the continent. They die because of these five mistakes that nobody talks about.",
      "visualCues": ["Face close-up, intense eye contact", "Flash stats graphic: '93% fail rate'"],
      "deliveryNotes": "Start quiet, build intensity. Pause after 'nobody talks about.'"
    },
    ...
  ],
  "fullScript": "Complete concatenated script text for teleprompter...",
  "keywordSuggestions": ["Nigerian startups", "startup mistakes", "African tech"]
}
```

---

## Script Editing

### Inline Editing
- Tap any section to edit the text directly
- Changes are tracked — see what's modified
- "Regenerate This Section" button per section — keeps everything else, rewrites one section

### Section Management
- Drag to reorder sections
- Add new section between existing ones
- Delete sections
- Merge two sections into one

### Notes Panel (Desktop)
Right column shows:
- B-roll/visual suggestions
- Delivery notes
- Timing markers
- Keyword suggestions for SEO (YouTube)

On mobile, these collapse into inline tags that expand on tap.

---

## Teleprompter Integration

Same as HookFactory's teleprompter but with the FULL script:
- Scrolls through entire script at adjustable pace
- Section headers appear briefly then scroll away
- Visual cue markers flash briefly ([SHOW SCREEN], [CUT TO B-ROLL])
- Mirror mode for front-camera reading
- Speed: 80-200 words per minute slider
- Countdown before start
- Tap to pause/resume

---

## Export Options

- **Copy full script** — plain text, all sections concatenated
- **Copy per section** — tap any section's copy button
- **Export as PDF** — formatted document with sections, notes, timestamps
- **Share to WhatsApp** — send script to collaborator/editor
- **Export for teleprompter** — clean text only, no cues

---

## Data Model

```sql
CREATE TABLE creator_scripts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  format TEXT DEFAULT 'youtube',
  duration TEXT DEFAULT '5-8min',
  platform TEXT DEFAULT 'youtube',
  script JSONB NOT NULL,
  edited_sections JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_scripts_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scripts" ON creator_scripts_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine, Function, Performance

**Engine**: `engines/creator-scripts-engine.js` — generate, edit section, regenerate section, teleprompter, export PDF, history.

**Netlify Function**: `netlify/functions/creator-scripts.js` — POST `/api/creator-scripts/generate`. Longer Claude call due to full script output. Use Claude Sonnet for quality, or Haiku with larger output budget.

**Performance**: First paint < 1s, generation < 8s (full scripts are longer), section regeneration < 3s, total JS < 30KB gzipped.

---

## Cross-Tool Links
- "Need a hook?" → HookFactory
- "Generate a title?" → TitleSmith
- "Create a thumbnail?" → ThumbnailForge
- "Repurpose this script into social posts?" → Repurpose
