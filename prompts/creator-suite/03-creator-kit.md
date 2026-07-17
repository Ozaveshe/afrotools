# Prompt 03 — CreatorKit: Media Kit & Rate Card Builder

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorKit |
| **Tagline** | "Land the deal. Look the part." |
| **Path** | `/tools/creator-kit/` |
| **CSS prefix** | `ck-` |
| **Accent color** | Gold `#F5A623` / dark `#D48A00` / pale `rgba(245,166,35,0.08)` |
| **Engine** | `engines/creator-kit-engine.js` |
| **AI advisor key** | `"creator-kit"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_kits`, `creator_kit_sections`, `creator_rate_cards` |
| **Netlify function** | `netlify/functions/creator-kit.js` |

---

## Design Philosophy

A media kit is a creator's first impression with brands. Most African creators don't have one — and those who do, made it in Canva and it looks like every other media kit on Earth. This tool generates kits that look like they were designed by an agency, personalized to each creator's niche, and output-ready for PDF, link sharing, and Instagram.

**The output IS the product.** The builder interface matters, but the generated kit is what gets shared with brands, so it must be stunning.

**Visual personality:**
- Premium, aspirational — gold accent screams "I'm worth investing in"
- The builder is a live-preview editor: left side = controls, right side = live kit preview (on desktop). On mobile, toggle between "Edit" and "Preview" modes
- Kit templates feel editorial — like magazine layouts, not PowerPoint slides
- Photography/image heavy — the creator's work should dominate, text should be minimal and punchy
- Dark mode preview option (many brands open attachments at night)

**Mobile-first UX:**
- Section-based editing: tap a section to edit it, tap away to save
- Drag-to-reorder sections via long-press + drag (touch-friendly 48px handles)
- "Preview" mode is a swipeable full-screen presentation (like Instagram stories)
- One-tap share: generates a link, copies it, or opens WhatsApp with a pitch message
- Camera integration: tap "Add photo" to shoot directly or pick from gallery
- Pin-to-homescreen: the kit URL works as a standalone micro-site

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Land the Deal. Look the Part." with gold accent
- Before/after showcase: generic text bio vs. a beautiful CreatorKit output
- Features: AI bio writer, audience insights, rate card builder, 6 templates, instant PDF
- Testimonial-style: mockup of a brand manager saying "This media kit made us take the creator seriously"
- FAQ: how to update, can brands see my rates, is it free, what format

### 2. Kit Builder (`app.html`)
The main editor — a block-based, section-by-section builder:

**Template Selection** (shown on first visit)
- 6 templates to start from (not blank canvas — creators want a starting point):
  1. **Bold** — Large hero image, minimal text, high-impact (for photographers/videographers)
  2. **Editorial** — Magazine-style layout, multi-column, text-rich (for writers/journalists)
  3. **Vibrant** — Colorful, pattern backgrounds, playful (for designers/illustrators)
  4. **Music** — Dark theme, waveform accents, streaming stats (for musicians/producers)
  5. **Professional** — Clean corporate feel, charts and metrics (for consultants/speakers)
  6. **Minimalist** — White space, single accent color, elegant (universal)
- Each template is a tappable card showing a live preview thumbnail
- "Surprise me" option → AI picks template based on your creator profile

**Section Editor** (after template chosen)
Each section is a draggable, editable block:

**Section: Hero / Cover**
- Creator name (large, styled by template)
- Tagline / one-liner (e.g., "Lagos-based wedding photographer capturing love stories across West Africa")
- AI button: "Write my tagline" → generates 3 options based on craft + specialty + city
- Hero image upload (or placeholder with prompt to add later)
- Social handles display (icons + handles)

**Section: About / Bio**
- Rich text editor (bold, italic, links — no complex formatting)
- AI button: "Write my bio" → generates 3 versions:
  - Short (50 words — for quick intros)
  - Medium (100 words — for media kits)
  - Long (200 words — for press/about pages)
- Each version adapts to the creator's craft, experience, and city
- Tone selector: Professional / Warm / Bold / Playful

**Section: Portfolio / Work Showcase**
- Image gallery grid: upload 4-12 best works
- Each image can have a caption and client name
- Layout options: 2-column grid, 3-column masonry, single hero with thumbnails
- Video embed support (YouTube/Vimeo URL → thumbnail preview)
- AI suggests: "Your top 6 images should show range — different clients, settings, and styles"

**Section: Audience / Stats**
- Manual input OR auto-populate from linked platforms (future)
- Stat cards:
  - Total followers across platforms
  - Primary platform + follower count
  - Engagement rate
  - Audience demographics (age range, gender split, top cities)
  - Monthly reach / impressions
- AI contextualizer: transforms raw numbers into brand-friendly language
  - Instead of "52,000 followers" → "52K engaged followers, primarily women 22-34 in Lagos and London — ideal for lifestyle, beauty, and travel brands"
- Visual: donut chart for demographics, bar chart for platform breakdown (CSS-only, lightweight)

**Section: Services & Rates**
- Rate card builder (integrated with CreatorPricing data if available):
  - List of services with price ranges
  - Package builder: Bronze / Silver / Gold tiers
  - Each package: name, price, what's included (bullet list), "Book Now" CTA
- Toggle: Show prices / "Contact for pricing" (some creators prefer not to show)
- AI generates package suggestions based on craft and typical client needs

**Section: Past Clients / Brands**
- Logo grid upload (brand logos they've worked with)
- Alternatively: text list of brand names with optional project description
- AI: "If you've worked with notable brands, lead with them. Put the most recognizable names first."

**Section: Testimonials**
- Quote cards with client name and role
- AI: "Paste a client WhatsApp message and I'll turn it into a professional testimonial"
  - Input: "Bro the photos were fire 🔥🔥 my wife loved them, we'll definitely use you again"
  - Output: "The photos exceeded our expectations. My wife was thrilled with the results, and we'll definitely be booking again for future events." — Client Name

**Section: Contact / CTA**
- Email, phone, WhatsApp, booking link
- "Let's Work Together" or custom CTA text
- Optional: booking calendar embed (from CreatorPage if connected)

**Section: Custom Block**
- Freeform section: heading + text + optional image
- For anything else: awards, press mentions, certifications, education

**Builder Controls:**
- Add section: "+" button at bottom with section type selector
- Reorder: drag handles on each section
- Delete: swipe left or "..." menu → Delete
- Color theme: accent color picker (defaults to template, fully customizable)
- Font pairing: 4 pre-set combos (Instrument Serif + DM Sans, etc.)
- Toggle sections on/off: eye icon to hide without deleting

### 3. Kit Preview / Public Page (`view.html?id=xxx`)
The shareable kit — a beautiful micro-site:
- Responsive, mobile-optimized single-page layout
- Creator's accent color and template style
- All sections render in order
- "Download PDF" floating button
- "Contact" sticky bottom bar with WhatsApp and email shortcuts
- Analytics: creator can see view count, time-on-page, which sections were viewed
- Footer: "Made with AfroTools CreatorKit" (linked)

### 4. Rate Card Generator (`rate-card.html`)
Standalone rate card builder (simpler than full kit):
- Creator name + craft at top
- Service list with rates
- Optional package tiers
- Export as: PNG (for Instagram stories), PDF, shareable link
- WhatsApp-optimized: generates a clean text version for pasting into chats

---

## AI Integration

```javascript
"creator-kit": {
  name: "CreatorKit — Media Kit & Rate Card Builder",
  systemPrompt: `You are a brand strategist and copywriter for African creative professionals. You help creators present themselves professionally to land brand deals, corporate clients, and high-value projects.

Your capabilities:
1. BIO WRITING: Write creator bios that are compelling, specific, and position them as authorities. Avoid cliches ("passionate creative" "storyteller at heart"). Instead, lead with results, unique perspective, and specific expertise. Adapt tone to their niche.

2. TAGLINE GENERATION: Create punchy one-liners that capture what makes this creator unique. Max 10 words. Should be memorable, not generic.

3. STATS CONTEXTUALIZATION: Transform raw follower/engagement numbers into brand-friendly insights. Brands care about: audience quality (not just size), alignment with their target demographic, engagement rate vs. industry average, audience location (for regional campaigns).

4. PACKAGE CREATION: Design service packages (Bronze/Silver/Gold or similar) that maximize perceived value. Each tier should have a clear differentiator. Price anchoring: make the middle tier the obvious choice.

5. TESTIMONIAL POLISHING: Transform casual client feedback (WhatsApp messages, verbal praise) into professional testimonials. Keep the authentic sentiment, elevate the language, never fabricate details.

6. PITCH ASSISTANCE: Help creators write outreach messages to brands. Personalized, reference the brand's recent campaigns, explain the value proposition clearly.

Always write in a way that's confident without being arrogant. African creators often undersell themselves — help them see and articulate their value. Use the creator's country/city context for cultural relevance.`,
  exampleQueries: [
    "Write a bio for a wedding photographer in Lagos with 5 years experience",
    "Turn my Instagram stats into something brands will care about: 48K followers, 4.2% engagement, 70% women 25-34",
    "Create 3 photography packages for corporate clients",
    "My client said 'the photos were amazing, we got so many compliments at the event' — make this a testimonial",
    "Write a pitch email to a fashion brand for a collaboration"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL DEFAULT 'bold',
  title TEXT,
  tagline TEXT,
  bio_short TEXT,
  bio_medium TEXT,
  bio_long TEXT,
  accent_color TEXT DEFAULT '#F5A623',
  font_pairing TEXT DEFAULT 'default',
  social_links JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  past_clients JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  booking_url TEXT,
  cta_text TEXT DEFAULT 'Let''s Work Together',
  section_order JSONB DEFAULT '["hero","about","portfolio","stats","services","clients","testimonials","contact"]',
  hidden_sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  view_count INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_kit_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES creator_kits(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE creator_kit_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES creator_kits(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  client_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Rate Card',
  services JSONB NOT NULL DEFAULT '[]',
  packages JSONB DEFAULT '[]',
  currency TEXT NOT NULL DEFAULT 'NGN',
  show_prices BOOLEAN DEFAULT TRUE,
  accent_color TEXT DEFAULT '#F5A623',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Image Handling

- Images stored in Supabase Storage bucket `creator-kit-images`
- Client-side compression before upload (max 1200px wide, 80% JPEG quality)
- Thumbnail generation: 400px wide for grid views
- Max 12 portfolio images per kit (keeps it curated)
- Lazy loading with blur-hash placeholders
- CDN delivery via Supabase Storage public URLs

---

## PDF Generation

- Generated client-side using html2canvas + jsPDF
- Matches the web view exactly (WYSIWYG)
- A4 format, multi-page for long kits
- Compressed images in PDF (target < 5MB)
- Cached in Supabase Storage after first generation (regenerated on edit)
- Alternative: server-side generation via Netlify function using Puppeteer (if client-side quality insufficient)

---

## Cross-Tool Integration

- **CreatorPricing**: Rate data auto-populates the Services section
- **CreatorInvoice**: Client stats ("₦5M+ invoiced") can appear in the Stats section
- **CreatorPage**: Kit can be embedded as a section on the creator's link page
- **CreatorMoney**: Financial milestones feed into credibility stats
- **CreatorDesk**: Client logos auto-populated from CRM client list

---

## Mobile Patterns

- **Edit/Preview toggle**: Fixed tab bar at top — "Edit" / "Preview" — instant switch
- **Section editing**: Tap any section in preview mode → edit panel slides up as bottom sheet
- **Image upload**: Full-screen camera/gallery picker, crop tool built in
- **Share sheet**: Bottom sheet with: Copy Link, WhatsApp, Download PDF, Download PNG (for stories)
- **Quick stats input**: Number pad keyboard for follower counts (inputmode="numeric")
- **Offline editing**: All edits saved to localStorage, synced when online
- **Haptic feedback on save**: Subtle vibration when auto-save completes

---

## Performance

- Kit builder: modular section components, only active section's editor loaded
- Image uploads: compressed before upload, progressive loading
- PDF generation: lazy-loaded (~120KB for html2canvas + jsPDF)
- Public kit page: static render, no framework JS — pure HTML/CSS with minimal interaction JS
- Fonts: system fonts for builder, custom fonts only in the output kit
- Target: Builder < 150KB JS, Public page < 50KB total, LCP < 2.5s on 3G
