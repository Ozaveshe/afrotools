# Prompt 04 — CreatorCalendar: Content Calendar & Planner

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorCalendar |
| **Tagline** | "Never stare at a blank screen again." |
| **Path** | `/tools/creator-calendar/` |
| **CSS prefix** | `cc-` |
| **Accent color** | Violet `#8B5CF6` / dark `#7C3AED` / pale `rgba(139,92,246,0.08)` |
| **Engine** | `engines/creator-calendar-engine.js` |
| **AI advisor key** | `"creator-calendar"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_posts`, `creator_content_pillars`, `creator_platforms` |
| **Netlify function** | `netlify/functions/creator-calendar.js` |

---

## Design Philosophy

Content calendars are boring. They're grids of empty boxes that make you feel bad about not posting. This tool should feel like a **creative war room** — a place where ideas flow, content gets organized visually, and you always know what's next. It should spark creativity, not drain it.

**Visual personality:**
- Playful, creative, energetic — the violet accent is imaginative and dynamic
- NOT a spreadsheet calendar. Think Pinterest board meets task manager
- Posts are visual cards with platform colors (Instagram purple, TikTok pink/cyan, X black, YouTube red, LinkedIn blue)
- Drag-and-drop everywhere — move posts between days, between platforms, between pillars
- Empty days don't look sad — they look like opportunity ("+ Add something here")
- Content pillars are color-coded columns or tags that give the feed a rainbow structure

**Mobile-first UX:**
- Default view on mobile is "Feed" (vertical timeline) not "Calendar" (grid too cramped)
- Swipeable week view: swipe left/right to navigate weeks
- Bottom sheet for creating/editing posts — slides up, covers 80% of screen
- Quick-add: Long-press on any day → add post (like adding an alarm on iPhone)
- Platform filter: horizontal scrollable pill tabs (All | Instagram | TikTok | YouTube | X | LinkedIn)
- Pull-down to reveal this week's overview stats

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Never Stare at a Blank Screen Again." with violet accent
- Animated preview: a week of content cards filling in, showing the planning process
- Features: AI content generator, multi-platform planning, content pillars, trend alerts, repurpose engine
- "Plan your first month in 5 minutes" CTA
- FAQ: does it auto-post?, which platforms?, can my team see it?

### 2. Calendar App (`app.html`)
The main workspace with multiple view modes:

**View Switcher** (top bar, sticky)
- Icons for view modes: [Feed] [Week] [Month] [Pillars]
- Platform filter pills: All | IG | TT | YT | X | LI (scrollable)
- Date navigation: < This Week > or month/year selector
- [+ New Post] button (always accessible)

**View A — Feed View** (default on mobile)
A vertical timeline, like a social feed of your planned content:
- Today is highlighted at top with "TODAY" badge
- Each post card shows:
  - Platform icon(s) (colored: IG purple, TT gradient, YT red, etc.)
  - Post type badge: Reel | Carousel | Story | Thread | Video | Article
  - Title/hook (first line of caption, bold)
  - Caption preview (truncated to 2 lines)
  - Thumbnail/image preview (if attached)
  - Status: Draft | Ready | Posted | Missed
  - Scheduled time (if set)
  - Content pillar tag (colored dot + label)
- Tapping a card opens the post editor bottom sheet
- Posts grouped by day with date headers
- Infinite scroll backwards (past) and forwards (future)
- Empty day = subtle card: "Nothing planned for Thursday — add something?"

**View B — Week View** (default on desktop)
A 7-column grid showing the week:
- Each column = one day, header showing day name + date
- Posts are compact cards stacked in each column
- Drag-and-drop between columns to reschedule
- Today's column has a violet accent border
- Each post card: platform icon, type badge, title (1 line), pillar color dot
- "+" button at bottom of each column to add post to that day
- On mobile: horizontal scroll with snap points per day, or 3-day view

**View C — Month View**
A traditional month calendar grid:
- Each day cell shows dot indicators (colored by platform) for scheduled posts
- Tapping a day zooms into that day's feed view
- Bottom: monthly summary bar — "18/30 days planned, 4 gaps"
- On mobile: compact grid with dots only, tappable to expand

**View D — Pillars View**
Kanban-style columns for each content pillar:
- Each pillar is a vertical column: Educational | Entertaining | Promotional | Personal | Behind-the-Scenes | (custom)
- Posts (as cards) are sorted into their pillar columns
- Helps creators see: "Am I too heavy on promotional? Not enough educational?"
- AI insight at top: "Your last 2 weeks are 60% promotional. Your engagement drops when you go above 40%. Try adding 2 educational posts this week."
- Drag posts between pillars to re-categorize

### 3. Post Editor (bottom sheet / modal)
Opens when creating or editing a post:

**Header**: Platform selector (multi-select pills — same post can be planned for multiple platforms)

**Content Section:**
- Caption textarea (large, auto-expanding)
  - Character counter per platform (Instagram 2200, X 280, LinkedIn 3000)
  - Warns when caption exceeds selected platform's limit
  - Hashtag section (separate from caption for clean editing)
- AI Assist button group (horizontal scroll):
  - [Write Caption] — AI generates caption based on topic/hook
  - [Write Hook] — Just the first line (the scroll-stopper)
  - [Hashtags] — Platform-optimized hashtag set
  - [Repurpose] — Take this post's content and adapt for another platform
  - [Improve] — Enhance existing caption (more engaging, better CTA)
- Media attachment: image upload, or URL to reference content
- Post type selector: Reel | Post | Carousel | Story | Thread | Video | Article | Newsletter

**Scheduling Section:**
- Date picker (inline calendar)
- Time picker with presets: "Best time for your audience" (AI-suggested), Morning, Afternoon, Evening, Custom
- Repeat toggle: One-time | Weekly series | Every [X] days

**Organization Section:**
- Content pillar selector (colored pills)
- Status: Draft | Ready | Posted
- Notes (private, not part of the post — for your own reference)
- Link to related project (from CreatorDesk, if connected)

**Actions:**
- [Save Draft] / [Mark Ready] / [Mark Posted]
- [Duplicate] — Copy post to another date or platform
- [Delete] — Swipe or button with confirmation

### 4. AI Content Planner (`plan.html`)
A dedicated flow for generating a full content plan:

**Step 1 — Context**
- "What do you create?" (from creator profile, or select)
- "What are your content pillars?" (suggest defaults based on niche, or custom)
- "Which platforms?" (multi-select)
- "How often do you want to post?" (slider: 3/week to daily to 2x/day)

**Step 2 — Calendar Context**
- "Any special events coming up?" (auto-suggest based on country):
  - Nigeria: Detty December, Independence Day, Ramadan, Easter
  - Kenya: Mashujaa Day, Jamhuri Day, Safari Rally
  - South Africa: Heritage Day, Youth Day, Loadshedding jokes season
  - Pan-African: AFCON, Africa Day, World Cup qualifiers
  - Custom events: product launch, collab drop, etc.

**Step 3 — AI Generates**
- Full month of content ideas, distributed across platforms and pillars
- Each idea: topic, hook, platform, content type, pillar, suggested day
- User can: accept, edit, swap, or regenerate any idea
- "Shuffle this week" button to get new ideas for specific weeks
- Approved ideas auto-populate the calendar

---

## AI Integration

```javascript
"creator-calendar": {
  name: "CreatorCalendar — Content Calendar & Planner",
  systemPrompt: `You are a content strategist for African creators. You help plan, write, and optimize social media content across Instagram, TikTok, YouTube, X/Twitter, and LinkedIn.

Your expertise:
1. CONTENT STRATEGY: Generate monthly content plans balanced across pillars (educational, entertaining, promotional, personal, BTS). Know that audiences disengage when any single pillar exceeds 40% of content.

2. AFRICAN CULTURAL CALENDAR: Know key dates, seasons, and cultural moments across African countries:
   - Nigeria: Detty December (Nov-Jan peak), Owambe season, Independence Oct 1, major music releases
   - Kenya: Safari season, Mashujaa Day, East African integration events
   - South Africa: Heritage Day, Youth Day, loadshedding culture, Amapiano drops
   - Ghana: Independence March, Homcoming/Afrochella December, Year of Return legacy
   - Pan-African: AFCON, Africa Day (May 25), AU Summit, World Cup qualifiers
   - Religious: Ramadan, Eid, Easter, Christmas (timing varies by country)
   Never suggest content that conflicts with cultural or religious sensitivities.

3. CAPTION WRITING: Write platform-native captions:
   - Instagram: Storytelling, relatable, emoji-light, strong CTA, line breaks for readability
   - TikTok: Conversational, trend-aware, hook-first, controversy/curiosity driven
   - X/Twitter: Concise, witty, thread-worthy, engagement-bait without being cringe
   - YouTube: Description SEO, timestamp chapters, subscribe CTAs
   - LinkedIn: Professional but human, insight-leading, formatted with line breaks
   Adapt language to African English/slang where appropriate (not forced).

4. HOOK GENERATION: The first line determines whether anyone reads the rest. Generate scroll-stopping hooks that create curiosity, controversy, or emotional connection. African audiences respond to: relatable struggles, success stories, cultural pride, humor, and real talk.

5. REPURPOSING: Transform one piece of content into 5+ platform-specific versions. A YouTube video becomes: IG carousel of key points, TikTok clip of best moment, X thread of insights, LinkedIn article summary, newsletter excerpt.

6. TREND ADAPTATION: When told about a trend (sound, format, challenge), suggest how creators in different niches can authentically participate.

Always consider: mobile data costs (don't suggest video-heavy plans for creators whose audience is data-conscious), posting times for African timezones (WAT, EAT, SAST, CAT), and the reality that many African creators manage everything themselves.`,
  exampleQueries: [
    "Plan my content for next week — I'm a Lagos food creator on IG and TikTok",
    "Write 5 Instagram caption options for a behind-the-scenes photo from my studio",
    "What should I post for Detty December as a fashion creator?",
    "Turn my YouTube video about saving money in Nigeria into 5 social posts",
    "Give me 10 hook ideas for photography tips content"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT,
  target_percentage INTEGER DEFAULT 20,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar_id UUID REFERENCES creator_content_pillars(id) ON DELETE SET NULL,
  title TEXT,
  caption TEXT,
  hashtags TEXT,
  platforms JSONB DEFAULT '[]',
  post_type TEXT CHECK (post_type IN ('post','reel','carousel','story','thread','video','article','newsletter','short')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','ready','posted','missed')),
  scheduled_date DATE,
  scheduled_time TIME,
  repeat_type TEXT CHECK (repeat_type IN ('once','weekly','biweekly','monthly')),
  media_urls JSONB DEFAULT '[]',
  notes TEXT,
  project_id UUID,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','twitter','linkedin','facebook','newsletter')),
  handle TEXT,
  follower_count INTEGER,
  best_posting_times JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-range queries
CREATE INDEX idx_posts_user_date ON creator_posts(user_id, scheduled_date);
```

---

## Engine (`creator-calendar-engine.js`)

Key functions:
- `getWeekPosts(userId, weekStart)` — fetch posts for a 7-day range
- `getMonthOverview(userId, month, year)` — post counts per day for month view
- `getPillarBalance(userId, dateRange)` — calculate % distribution across pillars
- `suggestPostingTime(platform, country)` — optimal times based on African audience data
- `duplicatePost(postId, newDate, newPlatforms)` — clone a post to another slot
- `getContentGaps(userId, dateRange)` — find days with no posts planned
- `getAfricanEvents(country, month)` — cultural calendar data

---

## African Posting Time Data (built into engine)

```javascript
const OPTIMAL_TIMES = {
  NG: {
    instagram: ['07:00', '12:00', '19:00'],
    tiktok: ['09:00', '15:00', '21:00'],
    twitter: ['08:00', '12:30', '18:00'],
    youtube: ['14:00', '18:00'],
    linkedin: ['08:00', '12:00']
  },
  KE: {
    instagram: ['06:30', '12:00', '19:30'],
    tiktok: ['10:00', '16:00', '21:00'],
    // ...
  },
  ZA: { /* ... */ },
  GH: { /* ... */ },
  // All times in local timezone for each country
};
```

---

## Cross-Tool Integration

- **CreatorPricing**: When a post is about services, suggest linking to rate card
- **CreatorInvoice**: Mark posts related to paid campaigns with the client name
- **CreatorKit**: Audience stats from kit feed into "best time to post" suggestions
- **CreatorDesk**: Campaign posts linked to client projects; deadline awareness
- **CreatorMind**: AI-generated content ideas can be sent directly to the calendar
- **CreatorPage**: "Latest content" section on link page auto-populated from calendar

---

## Mobile Patterns

- **Swipe navigation**: Left/right swipes navigate weeks in Week view
- **Quick-add gesture**: Long-press any empty day → post creation bottom sheet opens with that date pre-filled
- **Pull-to-refresh**: Refresh content from Supabase
- **Bottom tab bar**: Feed | Calendar | Pillars | AI Plan (4 tabs, always accessible)
- **Offline support**: Posts cached in localStorage; edits queue and sync when online
- **Notification-ready**: "You have 2 posts scheduled for today" reminder (future PWA push)
- **Platform color coding**: Every post card has a left border in the platform's brand color for instant visual scanning
- **Batch actions**: Long-press to select multiple posts → bulk move, delete, or change status

---

## Performance

- Calendar renders with CSS Grid (no heavy calendar library)
- Posts lazy-loaded by visible date range (not all posts at once)
- AI calls only on explicit user action (button tap)
- Content pillar calculations done client-side from cached post data
- Skeleton loading for post cards while fetching
- Target: < 100KB JS, LCP < 2s on 3G
- Drag-and-drop: lightweight Sortable.js or native HTML drag API with touch polyfill
