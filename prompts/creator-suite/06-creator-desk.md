# Prompt 06 — CreatorDesk: Client & Project Manager (CRM-lite)

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorDesk |
| **Tagline** | "Your clients. Your projects. Under control." |
| **Path** | `/tools/creator-desk/` |
| **CSS prefix** | `cd-` |
| **Accent color** | Sky `#0EA5E9` / dark `#0284C7` / pale `rgba(14,165,233,0.08)` |
| **Engine** | `engines/creator-desk-engine.js` |
| **AI advisor key** | `"creator-desk"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_clients` (shared), `creator_projects`, `creator_project_tasks`, `creator_project_notes` |
| **Netlify function** | `netlify/functions/creator-desk.js` |

---

## Design Philosophy

Creators are managing clients in WhatsApp threads, projects in their head, and deadlines on sticky notes. CreatorDesk is the **one place everything lives** — but it can't feel like Jira or Salesforce. It has to feel like a clean, visual workspace that's actually faster than WhatsApp for tracking what's happening.

**Visual personality:**
- Clean, organized, calming — sky blue accent is trustworthy and clear
- Card-based, not table-based — each project and client is a visual card with status and avatar
- Pipeline view is the hero — see where every project stands at a glance
- Activity timeline feels like a chat log — familiar to WhatsApp-native users
- Empty states are encouraging: "Your first client is waiting. Add them here."
- Status colors are universally readable: blue=active, amber=needs attention, green=done, gray=paused

**Mobile-first UX:**
- Pipeline view on mobile = vertical stack of status columns, horizontally scrollable
- Client cards are tappable to reveal full details as a bottom sheet
- Quick-add client: name + WhatsApp number = done (everything else optional)
- Voice note → text: paste WhatsApp voice transcript, AI extracts project brief
- Swipe actions on project cards: right=complete, left=archive
- Bottom nav: Pipeline | Clients | Activity | AI

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Your Clients. Your Projects. Under Control."
- Pipeline preview mockup showing projects moving through stages
- Features: Client management, project pipeline, task tracking, AI brief interpreter, follow-up drafts
- "Stop losing clients in your WhatsApp threads" positioning
- FAQ: data privacy, can my team use it, does it integrate with invoicing

### 2. Project Pipeline (`app.html`)
The visual project tracker — Kanban-style:

**Pipeline Columns:**
- **Lead** (gray) — Potential projects, inquiries, initial conversations
- **Quoted** (amber) — Quote sent, waiting for response
- **Active** (sky blue) — Work in progress
- **Review** (violet) — Delivered, awaiting feedback
- **Completed** (green) — Done, invoiced or paid
- **On Hold** (muted) — Paused projects

**Each Project Card Shows:**
- Client avatar/initial circle (generated from name, colored)
- Project name (bold)
- Client name (smaller, below)
- Due date with urgency indicator:
  - Gray: >7 days away
  - Amber: 3-7 days
  - Red: overdue or <3 days
- Amount/value (from linked quote/invoice)
- Task progress: "3/5 tasks done" micro progress bar
- Priority dot: low (no dot) / medium (amber) / high (red)

**Drag & Drop:**
- Desktop: drag cards between columns to update status
- Mobile: tap card → bottom sheet with "Move to" status selector
- Cards within a column sortable by drag (priority ordering)

**Top Bar:**
- Filter: All | This Week's Deadlines | By Client | By Priority
- Sort: Date added | Due date | Value
- [+ New Project] button

**Quick Stats Bar** (above pipeline, horizontally scrollable on mobile):
- Active projects: 5
- Due this week: 2
- Overdue: 1 (red badge)
- Pipeline value: ₦1.2M

### 3. Client Directory (`clients.html`)
All clients in one place:

**Client Cards** (grid on desktop, vertical list on mobile):
- Avatar circle (initial + color)
- Name + company
- Quick stats:
  - Projects: 3 total, 1 active
  - Total revenue: ₦850,000
  - Last project: Feb 2026
  - Payment speed: "Pays in ~8 days" (green) or "Slow payer ~25 days" (amber)
- Contact shortcuts: WhatsApp icon, Email icon, Phone icon (one-tap actions)
- "Last contacted" indicator

**Client Detail View** (tapping a card → full page or large bottom sheet):
- Full contact info
- All projects (timeline)
- All invoices (from CreatorInvoice)
- Revenue history (mini chart)
- Notes section (chronological, like a journal)
- AI section:
  - "Upsell opportunities" — based on past projects
  - "Relationship health" — based on last contact date, payment history, project frequency
  - "Draft a check-in message" — AI writes a personalized WhatsApp message

**Add Client Form:**
- Minimal required: Name only
- Optional (progressively collected): Company, Email, Phone, WhatsApp, Country, Notes
- "Import from WhatsApp" — paste a WhatsApp contact card or conversation snippet, AI extracts details

### 4. Project Detail (`project.html?id=xxx`)
Deep view of a single project:

**Project Header:**
- Project name (editable inline)
- Client name (linked to client detail)
- Status badge (tappable to change)
- Due date (tappable to change)
- Value (from linked quote/invoice)

**Task Checklist:**
- Simple checklist — each task is a checkbox + description
- Drag-to-reorder (touch-friendly)
- Swipe to delete
- [+ Add task] at bottom (inline text input, enter to add)
- Progress bar showing completion percentage
- AI button: "Break this project into tasks" — describe the project, AI generates a task list
  - E.g., "Wedding photography — Nov 15" → AI generates:
    1. Pre-wedding consultation call
    2. Location scouting
    3. Shoot day — ceremony
    4. Shoot day — reception
    5. Photo culling (select best 300)
    6. Editing & retouching
    7. Deliver via gallery link
    8. Send invoice & follow up

**Timeline / Activity Log:**
- Chronological feed of everything that happened:
  - "Project created — Mar 1"
  - "Quote sent — ₦250,000 — Mar 3"
  - "Quote accepted — Mar 5"
  - "Task completed: Pre-wedding consultation — Mar 8"
  - "Invoice sent — INV-012 — Mar 20"
  - "Payment received — Mar 25"
- Each entry timestamped, auto-generated from actions across tools
- Manual note entries: text input to log meetings, calls, decisions

**Files / Deliverables** (simple):
- Link attachments (Google Drive, Dropbox, WeTransfer URLs)
- Note field for delivery instructions
- "Mark as delivered" button → moves project to Review stage

**AI Project Assistant:**
- "Summarize this project" — AI gives a one-paragraph status update
- "Draft a progress update for the client" — WhatsApp-ready message
- "This project is behind schedule. What should I do?" — AI advises on prioritization, deadline negotiation
- "Red flag check" — AI analyzes project notes and flags concerns (scope creep, delayed responses, unclear deliverables)

### 5. Activity Feed (`activity.html`)
Cross-project activity stream:
- All project movements, task completions, invoice events, client interactions
- Filterable by: project, client, date range
- "Today" section always at top
- Helps creators start their day by seeing what needs attention

---

## AI Integration

```javascript
"creator-desk": {
  name: "CreatorDesk — Client & Project Manager",
  systemPrompt: `You are a project manager and client relationship advisor for African creative professionals. You help them stay organized, communicate professionally, and grow client relationships.

Your capabilities:
1. BRIEF INTERPRETATION: When given raw client communication (WhatsApp messages, emails, voice note transcripts), extract:
   - What they actually want (deliverables)
   - When they need it (deadlines)
   - What they're willing to pay (budget signals)
   - Red flags (unrealistic expectations, vague scope, "exposure" instead of payment)
   Format as a clean project brief the creator can confirm.

2. TASK BREAKDOWN: Generate realistic task lists for creative projects. Know the actual workflow:
   - Photography: consultation → scouting → shoot → culling → editing → delivery → feedback → final delivery
   - Video: brief → scripting → pre-production → shoot → rough cut → revisions → final cut → delivery
   - Design: brief → moodboard → concepts → feedback → revisions → final files
   Include time estimates when asked.

3. CLIENT COMMUNICATION: Draft messages for every stage:
   - Initial response to inquiry (professional, warm, shows interest)
   - Quote follow-up (gentle nudge after 3-5 days)
   - Project kickoff (set expectations, confirm scope)
   - Progress updates (reassuring, shows professionalism)
   - Delivery message (celebratory, asks for feedback)
   - Payment follow-up (firm but respectful)
   - Check-in after completion (relationship nurturing, ask for referrals)
   All messages formatted for WhatsApp (short paragraphs, no corporate formality).

4. UPSELL IDENTIFICATION: Based on project history, suggest additional services:
   - "This client hired you for product photography 3 times. They don't have brand video content — pitch a retainer."
   - "Wedding clients often want anniversary shoots. Follow up in 6 months."

5. RED FLAG DETECTION: Analyze client behavior patterns and warn about:
   - Scope creep (requirements growing without budget adjustment)
   - Communication gaps (client going silent during a project)
   - Payment risk (late payments becoming a pattern)
   - Unreasonable expectations (rushed timelines, "it should be simple")

Always be practical and direct. African creators are busy — give them copy-paste ready messages, not frameworks to think about.`,
  exampleQueries: [
    "A potential client sent me this WhatsApp message — turn it into a project brief: [paste]",
    "Break down a brand video project into tasks with deadlines",
    "Write a follow-up message — I sent a quote 5 days ago and haven't heard back",
    "This client has hired me 4 times. What should I pitch them next?",
    "The client keeps asking for more changes. Help me set boundaries."
  ]
}
```

---

## Data Model

```sql
-- creator_clients already defined in CreatorInvoice (shared table)

CREATE TABLE creator_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','quoted','active','review','completed','on_hold','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  value BIGINT,
  currency TEXT DEFAULT 'NGN',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  quote_id UUID REFERENCES creator_quotes(id),
  invoice_id UUID REFERENCES creator_invoices(id),
  deliverables_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES creator_projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES creator_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'manual' CHECK (note_type IN ('manual','system','ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES creator_projects(id),
  client_id UUID REFERENCES creator_clients(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_status ON creator_projects(user_id, status);
CREATE INDEX idx_activity_user_date ON creator_activity_log(user_id, created_at DESC);
```

---

## Cross-Tool Integration

- **CreatorInvoice**: Link invoices and quotes to projects. Invoice status updates reflect in project timeline
- **CreatorPricing**: When creating a project, suggest pricing based on project type
- **CreatorMoney**: Project value flows into income tracking when invoiced/paid
- **CreatorCalendar**: Campaign projects link to content calendar posts
- **CreatorKit**: Client count and revenue stats feed into media kit
- **CreatorSplit**: Collab projects track multiple team members and split agreements

---

## Mobile Patterns

- **Pipeline swipe**: Horizontal scroll across status columns, snap to each column
- **Quick-add**: FAB → "New Project" or "New Client" — minimal fields, fill rest later
- **Card tap**: Opens project/client detail as full-screen view (not a popup)
- **Contact shortcuts**: WhatsApp/email/phone icons on client cards open native apps directly
- **Pull-to-refresh**: Sync latest data from Supabase
- **Offline**: Project and client data cached locally. Changes queue and sync when online
- **Search**: Universal search across projects, clients, and notes (top of screen, expandable)
- **Notification badges**: Red dot on Pipeline tab when overdue projects exist

---

## Performance

- Pipeline loads only active projects by default (completed/cancelled lazy-loaded)
- Client list uses virtual scrolling for 100+ clients
- Activity log paginated (load 20 at a time, infinite scroll)
- Client avatars generated client-side (initial + color, no image upload)
- Target: < 90KB JS, LCP < 2s on 3G
