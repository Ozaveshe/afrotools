# Prompt 10 — CreatorMind: AI Creative Brief & Script Writer

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorMind |
| **Tagline** | "Your creative brain. Amplified." |
| **Path** | `/tools/creator-mind/` |
| **CSS prefix** | `cmn-` |
| **Accent color** | Fuchsia `#D946EF` / dark `#C026D3` / pale `rgba(217,70,239,0.08)` |
| **Engine** | `engines/creator-mind-engine.js` |
| **AI advisor key** | `"creator-mind"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_mind_projects`, `creator_mind_outputs`, `creator_voice_profiles` |
| **Netlify function** | `netlify/functions/creator-mind.js` (extended AI function with higher token limits) |

---

## Design Philosophy

This is the tool where AI is the ENTIRE product — not a feature bolted on, but the core experience. CreatorMind is the African creator's **creative co-pilot**: it writes scripts, captions, briefs, pitches, bios, emails, and content outlines — all in the creator's own voice, with African cultural intelligence baked in.

The differentiator from ChatGPT: CreatorMind knows the creator's niche, audience, voice, and cultural context. It doesn't write like a generic AI — it writes like the creator would if they had a professional writer on their team.

**Visual personality:**
- Mystical, intelligent, creative — the fuchsia accent is bold, creative, and slightly futuristic
- The interface is conversational (chat-style) but with structured output cards
- Outputs are beautifully formatted — not walls of text but designed content cards
- The "Voice Training" section feels like teaching an apprentice — personal and intimate
- Quick-action buttons are prominent — creators shouldn't have to figure out prompts
- The workspace feels expansive — dark background, fuchsia accents, like a creative studio at night

**Mobile-first UX:**
- Chat interface is native-feeling: keyboard up, messages flowing, send button at bottom
- Output cards are tappable to expand, copy, or send to other tools
- Quick-action grid at top: one-tap access to common generation types
- Voice training is a simple paste-and-save flow, not a complex setup
- Outputs have "Copy" and "Share to WhatsApp" buttons on every card
- History sidebar (drawer on mobile) shows past generations for re-use

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Your Creative Brain. Amplified." with fuchsia accent
- Demo: show an input ("I need a caption about my new preset pack") → beautiful output card with 3 caption options
- Features: Voice cloning, multi-format generation, cultural calibration, brand brief decoder, content repurposer
- "It writes like YOU, not like a robot" positioning
- Feature comparison: ChatGPT (generic) vs CreatorMind (knows your niche, voice, and audience)
- FAQ: how many generations?, does it store my content?, can it learn my voice?

### 2. CreatorMind Workspace (`app.html`)
The main AI generation interface:

**Top Section — Quick Actions** (horizontal scrollable grid, 2 rows)
Pre-built generation types, each a tappable card with icon:

Row 1 — Content Creation:
- Caption Writer (Instagram icon)
- Thread Writer (X icon)
- Script Writer (YouTube icon)
- Hook Generator (lightning icon)
- Hashtag Generator (# icon)
- Bio / About Writer (person icon)

Row 2 — Business:
- Pitch Email (email icon)
- Brand Brief Decoder (document icon)
- Client Response (chat icon)
- Product Description (shopping bag icon)
- Content Repurposer (recycle icon)
- Campaign Ideas (lightbulb icon)

Tapping a quick action opens a pre-configured generation form (not a blank chat).

**Generation Forms** (each quick action has its own form):

**Caption Writer Form:**
- Platform: IG | TT | X | LI | FB (pills)
- What's the post about? (textarea, 2-3 lines)
- Post type: Photo | Carousel | Reel | Story
- Tone: Professional | Casual | Funny | Inspirational | Controversial | Educational
- Include CTA? (toggle + CTA type: visit link, comment, share, save, DM)
- [Generate 3 Options] button

**Script Writer Form:**
- Platform: YouTube | TikTok | Podcast | Presentation
- Topic/title: (text input)
- Video length: Under 1 min | 1-5 min | 5-15 min | 15+ min
- Style: Tutorial | Storytelling | Review | Reaction | Vlog | Educational | Entertainment
- Key points to cover: (textarea, optional — AI structures if left blank)
- [Generate Script] button

**Hook Generator Form:**
- Platform: Any | IG | TT | YT | X
- Content topic: (text input)
- Hook style: Curiosity | Controversy | Statistic | Story | Question | Challenge | Confession
- [Generate 10 Hooks] button

**Thread Writer Form:**
- Topic: (text input)
- Thread length: 5 tweets | 10 tweets | 15 tweets
- Angle: Educational | Opinion | Story | Tips | Case Study
- [Generate Thread] button

**Pitch Email Form:**
- Who are you pitching? (brand name)
- What are you pitching? (collaboration, sponsorship, feature)
- Your unique value prop: (1-2 lines)
- Budget discussion? Include rate / Leave open
- [Generate Pitch] button

**Brand Brief Decoder Form:**
- Paste the brand brief: (large textarea)
- [Decode Brief] button
- Output: What they actually want, key deliverables, timeline, creative direction, do's and don'ts, what they're measuring

**Content Repurposer Form:**
- Original content: (paste text or URL)
- Original format: YouTube video | Blog post | Podcast | Tweet | Newsletter
- Repurpose into (multi-select): IG Caption | X Thread | LinkedIn Post | TikTok Script | Newsletter | Carousel Text | Email
- [Repurpose] button

**Output Display:**
Each generation produces a styled output card:
- Output text in a clean, readable card with subtle fuchsia border
- Multiple options shown as swipeable cards (e.g., 3 caption options as 3 cards)
- Action buttons per card:
  - [Copy] — copies text to clipboard (toast confirmation)
  - [Send to WhatsApp] — opens WhatsApp with the text
  - [Edit] — opens inline text editor to modify
  - [Regenerate] — get a new version
  - [Save] — save to history
  - [Send to Calendar] — create a post in CreatorCalendar with this text
  - [Send to CreatorPage] — use as product description or bio
- "Not quite right? Tell me what to change" — inline refinement input

**Chat Mode** (alternative to forms):
- For freeform requests that don't fit quick actions
- Standard chat interface: messages bottom-to-top, input bar at bottom
- AI responds with structured cards (not plain text)
- Context-aware: knows the creator's profile, craft, audience
- Conversation history preserved within session
- "New conversation" button to reset context

### 3. Voice Training (`voice.html`)
Where the AI learns to write like the creator:

**Concept:** The creator pastes 3-5 examples of their own writing, and the AI extracts their voice patterns — sentence length, slang usage, emoji patterns, tone, vocabulary, signature phrases.

**Flow:**
1. "Paste examples of your writing" — 3-5 text boxes
   - Instagram captions they've written before
   - Or tweets, YouTube descriptions, newsletter excerpts
   - Or even WhatsApp messages that represent their voice
2. [Analyze My Voice] button
3. AI produces a "Voice Profile":
   - Tone: "Conversational, slightly irreverent, uses Nigerian English naturally"
   - Sentence style: "Short punchy sentences. Rarely exceeds 15 words. Loves rhetorical questions."
   - Signature patterns: "Starts captions with a bold statement. Ends with a question. Uses 🔥 and 💀 occasionally."
   - Vocabulary: "Tech-savvy language mixed with Lagos slang ('wahala', 'omo', 'na so')"
   - What to avoid: "Formal language, excessive emojis, corporate tone"
4. Creator can edit/refine the voice profile
5. Voice profile saved and applied to ALL future generations
6. "Update voice" — paste new examples to refine over time

**Voice Profile Data:**
```javascript
{
  tone: "conversational, witty, direct",
  sentence_style: "short punchy sentences, rhetorical questions",
  vocabulary: ["wahala", "omo", "no cap", "abeg"],
  emoji_usage: "minimal, strategic — 🔥💀😂 only",
  signature_patterns: [
    "Opens with bold declarative statement",
    "Ends with a question or CTA",
    "Uses humor to make serious points"
  ],
  avoid: ["formal language", "excessive hashtags", "corporate buzzwords"],
  cultural_context: "Nigerian, Lagos-based, millennial",
  example_snippets: ["raw text examples stored for reference"]
}
```

### 4. Generation History (`history.html`)
All past generations, searchable:
- Cards showing: generation type, first line of output, date, platform
- Search by keyword
- Filter by type (caption, script, hook, etc.)
- Re-use: tap to view full output, copy, or regenerate
- Delete old generations
- "Favorites" — star generations for quick access

### 5. Cultural Calendar Integration
Built into the generation engine — when generating content, AI automatically considers:
- What's happening culturally right now (pulled from CreatorCalendar's African events data)
- Season-appropriate references (harmattan, rainy season, holiday periods)
- Trending topics in the creator's country (manually updated or AI-inferred from context)
- Religious sensitivities (Ramadan, Lent, etc.)

---

## AI Integration

```javascript
"creator-mind": {
  name: "CreatorMind — AI Creative Brief & Script Writer",
  systemPrompt: `You are a creative writing assistant specialized in African creator culture. You write content that sounds human, culturally aware, and platform-native — never robotic or generic.

CORE PRINCIPLES:
1. VOICE MATCHING: When a voice profile is provided, match it exactly. The creator's audience follows them for THEIR voice — any AI-generated content must be indistinguishable from what they'd write themselves. If no voice profile, default to warm, confident, African-millennial tone.

2. CULTURAL INTELLIGENCE: You deeply understand African cultural contexts:
   - Nigerian English (pidgin when appropriate, Yoruba/Igbo/Hausa sprinkles for flavor)
   - East African English (Sheng for Kenyan content, Swahili phrases)
   - South African English (township slang, Afrikaans phrases for SA audience)
   - Pan-African references (shared experiences across the continent)
   - Diaspora awareness (London/US African communities)
   NEVER force cultural references. Only include them when they're natural for the creator's audience.

3. PLATFORM MASTERY:
   - Instagram: Visual storytelling, relatable, strategic line breaks, strong first line, CTA natural not forced. 2000 chars ideal. Hashtags separate from caption.
   - TikTok: Conversational, hook in first 2 seconds, trendy language, pattern interrupts, controversial enough to engage. Keep under 150 chars for on-screen text.
   - X/Twitter: Wit, insight, strong opinions, thread-worthy takes. 280 chars. Threads: each tweet standalone but flowing. First tweet is the hook.
   - YouTube: Thumbnail text (3-5 words max), titles (under 60 chars, curiosity-driven), descriptions (SEO first paragraph, timestamps, links), scripts (hook → value → CTA).
   - LinkedIn: Professional authority, insight-leading, formatted paragraphs, relatable professional stories. No hashtag spam.

4. HOOK MASTERY: The first line determines everything. Master hook types:
   - Curiosity gap: "I stopped doing [X] and my income tripled"
   - Controversial take: "[Popular opinion] is wrong. Here's why."
   - Direct value: "3 things I wish I knew before starting [X]"
   - Storytelling: "Last Tuesday, a client asked me..."
   - Statistical shock: "97% of photographers in Lagos make this mistake"
   - Confession: "I'm going to be honest about something..."
   Hooks must be adapted for African audiences — references and examples should be local.

5. CONTENT REPURPOSING: Transform one piece of content across all platforms while adapting:
   - Length and format to platform norms
   - Tone to platform culture
   - CTAs to platform actions (swipe, click, retweet, save)
   - Visual direction suggestions (what image/video to pair)

6. BUSINESS WRITING: Pitches, emails, responses that are professional but human:
   - Pitch emails: personalized, reference brand's recent work, clear value prop, not begging
   - Client responses: professional, clear, boundary-setting when needed
   - Brand brief decoding: translate corporate language to creative direction

ALWAYS:
- Generate multiple options (3 minimum for captions/hooks, 1 for scripts/threads)
- Label each option with what makes it different ("The provocative one" / "The safe one" / "The viral one")
- Include platform-specific formatting (line breaks, emojis where natural)
- Flag if something might be controversial or sensitive in the creator's cultural context
- Be concise — creators don't want to read essays about their content, they want the content itself`,
  exampleQueries: [
    "Write 3 Instagram captions for my new photography portfolio launch",
    "I need a 60-second TikTok script about why natural hair products in Nigeria are overpriced",
    "Turn my 15-minute YouTube video about savings tips into 5 social posts",
    "Write a pitch email to Pepsi Nigeria for a content collaboration",
    "A brand sent me this brief — decode it and tell me what they really want",
    "Generate 10 scroll-stopping hooks for photography tips content",
    "Write a Twitter thread about the state of Nollywood in 2026"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_data JSONB NOT NULL DEFAULT '{}',
  example_texts JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE creator_mind_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Untitled',
  project_type TEXT NOT NULL CHECK (project_type IN ('caption','thread','script','hook','bio','pitch','brief_decode','response','product_desc','repurpose','campaign','freeform')),
  input_data JSONB NOT NULL DEFAULT '{}',
  platform TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_mind_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES creator_mind_projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  variant_label TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  sent_to_calendar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mind_user_type ON creator_mind_projects(user_id, project_type);
CREATE INDEX idx_mind_user_date ON creator_mind_projects(user_id, created_at DESC);
```

---

## Netlify Function (`creator-mind.js`)

This function needs higher token limits than the standard ai-advisor.js:
- Standard AI advisor: Haiku, short responses
- CreatorMind: Sonnet (for quality), higher max tokens (2000+ for scripts and threads)
- Rate limiting: 5 generations/day free, 30/day pro
- Voice profile injected into system prompt when available

```javascript
// System prompt is constructed dynamically:
const buildSystemPrompt = (basePrompt, voiceProfile, creatorProfile) => {
  let prompt = basePrompt;

  if (voiceProfile) {
    prompt += `\n\nCREATOR VOICE PROFILE:\n${JSON.stringify(voiceProfile)}`;
    prompt += `\nIMPORTANT: Match this voice exactly. Every output must sound like this specific creator.`;
  }

  if (creatorProfile) {
    prompt += `\n\nCREATOR CONTEXT:\n`;
    prompt += `Craft: ${creatorProfile.craft}\n`;
    prompt += `Niche: ${creatorProfile.specialty}\n`;
    prompt += `Audience: ${creatorProfile.audience_country}\n`;
    prompt += `Stage: ${creatorProfile.stage}\n`;
    prompt += `Platforms: ${creatorProfile.platforms.join(', ')}`;
  }

  return prompt;
};
```

---

## Cross-Tool Integration

- **CreatorCalendar**: "Send to Calendar" button on any output creates a post with the generated text + scheduled date picker
- **CreatorPage**: Bio and product descriptions generated here can be pushed to CreatorPage blocks
- **CreatorKit**: Media kit bio generated/updated via CreatorMind voice-matched writing
- **CreatorInvoice**: Pitch emails reference the creator's rate card and services
- **CreatorDesk**: Client communication drafts (follow-ups, updates) generated with project context
- **CreatorPricing**: Negotiation responses generated with pricing data context

---

## Mobile Patterns

- **Quick-action grid**: 2-row horizontal scroll of generation type cards. Each card has an icon + label. One-tap opens the generation form.
- **Generation form**: Bottom sheet (70% screen height), scrollable, with [Generate] at bottom
- **Output cards**: Swipeable horizontally if multiple options. Each card has Copy/WhatsApp/Edit in a compact action bar
- **Chat mode**: Standard mobile chat UI — keyboard pushes content up, send button on right
- **Voice training**: Simple paste flow — large text areas with "Paste from clipboard" helper button
- **History**: Drawer (swipe from left) or tab, with search bar at top
- **Offline**: Generation requires internet (AI call). History and voice profile available offline.
- **Haptic feedback**: Vibration when generation completes
- **Loading state**: Fuchsia shimmer animation on the output card while AI generates (feels creative, not clinical)

---

## Rate Limiting & Cost Control

CreatorMind is the most expensive tool (AI-heavy). Manage costs:
- **Free tier**: 5 generations/day (any type)
- **Pro tier**: 30 generations/day
- **Model routing**:
  - Hooks, hashtags, short captions → Haiku (cheap, fast)
  - Scripts, threads, pitches, briefs → Sonnet (quality)
  - Voice training analysis → Sonnet (one-time cost)
- **Caching**: Identical requests within 1 hour return cached results (no new API call)
- **Token limits**:
  - Captions: 500 tokens max
  - Hooks: 300 tokens max
  - Scripts: 2000 tokens max
  - Threads: 1500 tokens max
  - Pitches: 800 tokens max
- **Streaming**: Use streaming responses for scripts (user sees text appear word-by-word — feels alive)

---

## Performance

- Quick-action cards: pure CSS grid, no JS until tapped
- Generation forms: lightweight HTML forms, no framework
- Output rendering: plain HTML cards with CSS styling
- Chat interface: vanilla JS with DOM manipulation (no React/Vue)
- Voice profile: stored in localStorage + Supabase (offline accessible)
- History: paginated, 20 items per load
- Target: < 60KB JS (excluding AI call overhead), LCP < 1.5s on 3G
- Streaming UI: SSE (Server-Sent Events) from Netlify function for word-by-word output
