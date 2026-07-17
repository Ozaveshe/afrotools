# Prompt 09 — CreatorSplit: Royalty & Collaboration Splitter

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorSplit |
| **Tagline** | "Collabs without the drama." |
| **Path** | `/tools/creator-split/` |
| **CSS prefix** | `cs-` |
| **Accent color** | Indigo `#6366F1` / dark `#4F46E5` / pale `rgba(99,102,241,0.08)` |
| **Engine** | `engines/creator-split-engine.js` |
| **AI advisor key** | `"creator-split"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_splits`, `creator_split_members`, `creator_split_earnings`, `creator_split_payouts` |
| **Netlify function** | `netlify/functions/creator-split.js` |

---

## Design Philosophy

Money destroys creative relationships in Africa every single day. Producers and artists fight over splits. Photographers and models argue about usage rights. Video teams can't agree on who gets what. CreatorSplit brings **transparency before the money arrives** so there's nothing to fight about after.

This tool isn't about accounting — it's about **relationships**. The design should feel collaborative, fair, and clear. When everyone can see the split, nobody can feel cheated.

**Visual personality:**
- Collaborative, trustworthy, fair — the indigo accent feels balanced and serious-but-not-cold
- The split visualization is the hero — a pie chart/donut that dynamically adjusts as you change percentages
- Each collaborator has a distinct color in the pie — their slice is their identity
- Earnings projections feel exciting: "If this song hits 1M streams, you earn ₦X"
- Agreement cards look like contracts but feel like handshakes — professional but personal
- The "share with collaborators" flow feels like inviting friends, not filing paperwork

**Mobile-first UX:**
- Split creation is a flowing conversation: "Who worked on this?" → "What did each person do?" → "What's fair?"
- Pie chart is interactive — drag slice edges to adjust percentages in real-time
- WhatsApp sharing of split agreements is one tap
- Earnings tracker shows each person's running total (your cut is always highlighted)
- Bottom sheet for adding collaborators — name, role, percentage
- Touch-friendly pie slices with labels that don't overlap

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Collabs Without the Drama." with indigo accent
- Pain point visualization: two creators happy at the start, confused about money at the end → CreatorSplit in the middle making it clear
- Features: Fair split advisor, earnings projections, shareable agreements, payout tracking, multi-project splits
- "For every creator who's ever been burned" — emotional, real
- FAQ: is it legally binding?, how do splits work for streaming?, can I change splits later?

### 2. Splits Dashboard (`app.html`)
Overview of all collaboration agreements:

**Active Splits** (card list):
Each split card shows:
- Project/track/collab name (bold)
- Collaborator avatars (overlapping circles, like GitHub)
- Your percentage: "Your cut: 35%"
- Total earnings so far: ₦120,000 (your share: ₦42,000)
- Status badge: Active | Pending Agreement | Settled | Disputed
- Last updated date
- Quick actions: View details, Log earnings, Share

**Stats Row** (top, horizontal scroll):
- Active splits: 4
- Total earned from collabs: ₦380,000
- Pending payouts: ₦65,000
- Collaborators: 12 people

**[+ New Split] button** (prominent, indigo)

### 3. Split Creator (`create.html`)
A guided, conversational flow:

**Step 1 — What are you splitting?**
- Project type selector (visual cards):
  - Music track / EP / Album
  - Video / Film project
  - Photography project
  - Design / Creative project
  - Content collaboration
  - Live event / Show
  - Other
- Project name input
- Optional: link to the work (YouTube URL, Spotify link, portfolio piece)

**Step 2 — Who's involved?**
- Collaborator list builder:
  - [+ Add person] → Name, Role, Contact (WhatsApp/email)
  - Yourself auto-added with your profile info
  - Role selector per person (customized by project type):
    - **Music**: Artist, Producer, Songwriter, Mix Engineer, Master Engineer, Featured Artist, Manager, Label, Beat Maker, Vocalist
    - **Video**: Director, Videographer, Editor, Colorist, Sound Designer, Talent, Producer, Writer
    - **Photography**: Photographer, Model, Stylist, MUA, Retoucher, Art Director
    - **Design**: Designer, Illustrator, Copywriter, Art Director, Client
  - Each person gets a unique color (assigned from a palette)
- "I'm splitting with someone not on AfroTools" → they get a view-only link + invite

**Step 3 — The Split**
The core interaction — two modes:

**Mode A: AI-Suggested Split**
- Based on roles and project type, AI suggests a fair split:
  - "For an Afrobeats track with a beat producer and vocalist:"
  - Producer (beat): 30% — "Created the instrumental from scratch"
  - Artist (vocals + topline): 40% — "Wrote and performed the main vocal"
  - Songwriter (hook): 15% — "Co-wrote the hook melody"
  - Mix engineer: 10% — "Mixed the final track"
  - Manager: 5% — "Handled business and distribution"
- Each suggestion has a brief justification (why this %)
- "This is based on industry standard splits for [genre] in [country]"
- User can accept as-is or adjust

**Mode B: Manual Split**
- Interactive donut/pie chart:
  - Each collaborator's slice is draggable
  - As you expand one slice, others shrink proportionally
  - Percentage labels on each slice, updating in real-time
  - Total always equals 100% (enforced)
- Alternatively: percentage input fields per person (keyboard entry)
- Slider option: horizontal slider per person, all connected to sum to 100

**Below the chart:**
- Split summary table:
  | Person | Role | Split % | If ₦100K earned | If ₦1M earned |
  |--------|------|---------|-----------------|---------------|
  - Projections make the split tangible — not abstract percentages but real money

**Step 4 — Agreement**
- Auto-generated split agreement:
  - Project name and description
  - All parties with names, roles, and percentages
  - Revenue types covered: streaming, sync, live performance, merch, licensing
  - Amendment clause: "Changes require agreement from all parties"
  - Date and digital acknowledgment
- AI generates professional language from the split data
- "This is not a legal contract — it's a record of agreement between collaborators"
- Each collaborator must acknowledge (via link sent to them)
- Acknowledgment tracked: "3/4 have agreed" with status per person
- PDF export of the agreement
- WhatsApp share: formatted message with split summary + link to view full agreement

### 4. Split Detail (`split.html?id=xxx`)
Deep view of a single collaboration:

**Split Visualization:**
- Large donut chart with collaborator slices
- Tapping a slice highlights it and shows that person's details

**Earnings Tracker:**
- Log earnings as they come in:
  - [+ Log Earning] → Amount, Source (streaming, sync, live, merch, other), Date
  - Automatic split calculation: ₦500,000 earned → Person A gets ₦200K, Person B gets ₦150K, etc.
- Earnings timeline: chronological list of all logged earnings
- Running totals per person: cumulative bar chart

**Payout Tracker:**
- When money is actually distributed:
  - [Log Payout] → Person, Amount, Date, Method (bank transfer, M-Pesa, cash)
  - Track: owed vs paid per person
  - Balance: "You owe Person B ₦35,000" or "Person A owes you ₦20,000"
- Outstanding balances highlighted

**Projection Calculator:**
- Input hypothetical scenarios:
  - "If we get 1M Spotify streams" → everyone's cut calculated
  - "If we get a sync placement for ₦2M" → instant split calculation
  - "If ticket sales reach ₦5M" → everyone's share
- Great for motivating collaborators: "See what this could be worth!"

**Notes / Communication:**
- Activity log: changes, earnings, payouts, messages
- Comment section: collaborators can leave notes
- Amendment requests: "Person B wants to renegotiate" → notification to all

### 5. Collaborator View (public, via shared link)
What non-AfroTools collaborators see:
- Read-only view of the split agreement
- Their percentage highlighted
- Earnings and payout summary (their share only)
- [Acknowledge Agreement] button
- "Join AfroTools to manage your splits" subtle CTA
- WhatsApp-optimized layout (many will open the link from WhatsApp)

---

## AI Integration

```javascript
"creator-split": {
  name: "CreatorSplit — Royalty & Collaboration Splitter",
  systemPrompt: `You are a music industry and creative collaboration advisor specializing in African markets. You help creators agree on fair revenue splits and manage collaborative projects.

Your expertise:
1. FAIR SPLIT SUGGESTIONS: Know industry-standard splits by project type and role:
   - Afrobeats/Afropop: Typically producer 20-30%, artist 30-50%, songwriter 10-20%, engineer 5-10%
   - Amapiano: Often more producer-heavy (30-40%) due to the beat-driven nature
   - Film/Video: Director 25-35%, cinematographer 15-20%, editor 10-15%, producer 15-25%
   - Photography: Photographer 50-70%, model 15-25%, stylist 5-10%
   Always explain WHY each percentage is suggested. Splits vary by who brings what to the table.

2. DISPUTE MEDIATION: When collaborators disagree, provide:
   - Industry precedents and benchmarks
   - Framework for evaluating contributions objectively
   - Compromise suggestions that acknowledge both perspectives
   - Language for having difficult money conversations professionally

3. AGREEMENT DRAFTING: Write clear, plain-language split agreements that cover:
   - What revenue types are included (streaming, sync, live, merch, licensing)
   - How decisions about the work are made (releases, licensing approval)
   - What happens if someone wants to exit
   - Amendment process
   Not legal contracts — these are records of understanding written in plain English.

4. EARNINGS PROJECTIONS: Calculate realistic earnings based on:
   - Spotify: ~₦2-4 per stream for African markets
   - Apple Music: ~₦5-8 per stream
   - YouTube: ~₦200-600 per 1K views (varies by CPM)
   - Sync placements: ₦500K-₦5M+ depending on usage
   - Live performance: varies by market and artist tier
   Give ranges, not exact numbers. Be realistic about African streaming payouts.

5. REVENUE TYPE EDUCATION: Many African creators don't know about all revenue streams:
   - Publishing royalties vs master royalties
   - Sync licensing opportunities
   - Performance royalties (from radio, TV, live venues)
   - Mechanical royalties
   Explain in simple terms which streams apply to their project.

Be honest and fair. Don't default to "the artist gets the most" — value every contribution. African creative industries have a history of producers and behind-the-scenes talent being underpaid. Help fix that.`,
  exampleQueries: [
    "What's a fair split for an Afrobeats track? I produced the beat, my friend wrote and sang it",
    "My collaborator wants 50% but they only did the mixing. Is that reasonable?",
    "How much would each person earn if our song gets 500K Spotify streams?",
    "Write a split agreement for a 3-person video production team",
    "We had a verbal agreement but now they want to change it. What should I do?"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  description TEXT,
  work_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','active','settled','disputed')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  total_earnings BIGINT DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_split_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES creator_splits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  contact_whatsapp TEXT,
  contact_email TEXT,
  has_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: percentages for a split must sum to 100
-- Enforced at application level (not DB — allows drafts that aren't complete)

CREATE TABLE creator_split_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES creator_splits(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  source TEXT NOT NULL CHECK (source IN ('streaming','sync','live','merch','licensing','other')),
  description TEXT,
  earning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_split_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES creator_splits(id) ON DELETE CASCADE,
  member_id UUID REFERENCES creator_split_members(id),
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  method TEXT CHECK (method IN ('bank_transfer','mpesa','cash','paystack','other')),
  payout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Split Visualization

The donut chart is the signature UI element — it must feel alive and interactive:

**Implementation: SVG-based donut chart**
- SVG `<circle>` elements with `stroke-dasharray` for each slice
- Smooth CSS transitions when percentages change
- Touch handling: detect which slice was touched, enable drag to resize
- Labels: positioned outside the donut with connecting lines (no overlap)
- Center label: total percentage allocated (should read "100%")
- Responsive: fills container width, min 200px, max 400px
- Colors: each collaborator gets a distinct color from a palette (not random — curated for contrast)

**Color Palette for Collaborators:**
```javascript
const COLLAB_COLORS = [
  '#6366F1', // indigo (primary)
  '#F43F5E', // rose
  '#10B981', // emerald
  '#F59E0B', // amber
  '#0EA5E9', // sky
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#EF4444', // red
  '#22C55E', // green
];
```

---

## Cross-Tool Integration

- **CreatorInvoice**: "Invoice this collaboration" → creates an invoice using the split data
- **CreatorMoney**: Collab earnings auto-logged in finance tracker with collaborator context
- **CreatorDesk**: Multi-person projects tracked with split agreements linked
- **CreatorKit**: "Collaborator" section in media kit pulls from split history
- **CreatorPricing**: Split percentages inform effective rate calculations

---

## Mobile Patterns

- **Donut interaction**: Tap a slice to select, drag edge to resize. Percentage updates in real-time
- **Collaborator cards**: Swipeable horizontal cards for each member
- **Quick-add earnings**: FAB → amount + source → splits automatically calculated
- **Agreement share**: WhatsApp share generates a formatted message:
  > "Hey! Here's our split agreement for [Project Name]: You: 35% (Vocals), Me: 40% (Production), [Name]: 25% (Writing). View the full agreement: [link]"
- **Pull-to-refresh**: Sync latest earnings/payouts
- **Offline**: Split data cached locally. Earnings can be logged offline and synced
- **Notification**: When a collaborator acknowledges, you get a notification

---

## Performance

- SVG donut chart: < 5KB, renders instantly
- No charting library needed (pure SVG + CSS animations)
- Collaborator views are static HTML (no auth required for viewing)
- Target: < 70KB JS, < 30KB CSS, LCP < 1.5s on 3G
