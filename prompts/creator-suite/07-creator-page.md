# Prompt 07 — CreatorPage: Link Page & Digital Storefront

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorPage |
| **Tagline** | "One link. Everything you." |
| **Path** | `/tools/creator-page/` |
| **CSS prefix** | `cpg-` |
| **Accent color** | Rose `#F43F5E` / dark `#E11D48` / pale `rgba(244,63,94,0.08)` |
| **Engine** | `engines/creator-page-engine.js` |
| **AI advisor key** | `"creator-page"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_pages`, `creator_page_blocks`, `creator_page_products`, `creator_page_analytics` |
| **Netlify function** | `netlify/functions/creator-page.js` |

---

## Design Philosophy

Linktree is boring — a list of buttons. Gumroad doesn't work with African payment methods. CreatorPage is both: a beautiful, customizable link-in-bio page PLUS a storefront where creators can sell digital products with payment methods Africans actually use.

The public-facing page is what matters most — it's the creator's digital storefront, seen by thousands. It must be gorgeous, fast, and conversion-optimized.

**Visual personality:**
- Vibrant, bold, expressive — the rose accent is energetic and eye-catching
- The page builder feels like decorating your digital home — themes, colors, layouts
- The public page must load in under 1.5 seconds on 3G — it's shared in Instagram bios and WhatsApp statuses
- Each theme has personality — not just color changes but actual layout and typography shifts
- Product cards look premium — creators sell more when the presentation is beautiful
- Analytics are clean and motivating — "your page got 342 visits this week" feels like growth

**Mobile-first UX:**
- The builder IS the preview — what you see is what visitors get (true WYSIWYG)
- Block-based editing: tap any block to edit, long-press to move
- Theme switching is instant (CSS variables, no reload)
- Product creation: snap a photo, add a title and price, done
- Analytics are a swipe-up panel from the bottom of the builder
- Share button is always accessible — one tap to copy link or share to WhatsApp

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "One Link. Everything You." with rose accent
- Side-by-side: boring Linktree vs beautiful CreatorPage mockup
- Features: Custom themes, digital products, booking, tips, email capture, analytics, WhatsApp checkout
- "Built for African creators" — M-Pesa, Paystack, Flutterwave, bank transfer
- Live counter: "Serving X creators" (updated periodically)
- FAQ: custom domain?, how do payments work?, is it free?

### 2. Page Builder (`app.html`)
WYSIWYG block-based editor:

**Builder Chrome** (minimal, gets out of the way):
- Top bar: [Preview] [Share] [Analytics] [Settings gear icon]
- The page itself IS the editor — tap any block to edit
- Floating [+ Add Block] button at bottom
- "Edit mode" vs "Preview mode" toggle (top bar)

**Page Structure** (blocks in order, all draggable):

**Block: Profile Header**
- Avatar/logo upload (circle or square, with crop)
- Display name (large, styled by theme)
- Bio text (short — 1-3 lines)
- Location badge (optional): "Lagos, Nigeria" with flag emoji
- Social icon row: IG, TT, YT, X, LI, email (icon buttons, tappable)
- Verified badge (future, for pro users)

**Block: Link Buttons**
- Classic link-in-bio buttons — but beautiful:
  - Each link: Title + URL + optional icon/emoji + optional thumbnail
  - Animation options: none, subtle hover glow, gentle bounce on load
  - Priority link styling: one link can be "featured" (larger, accent-colored, stands out)
- Smart link types:
  - Regular URL → standard button
  - YouTube URL → embedded video preview card
  - Spotify/Apple Music URL → music player preview card
  - WhatsApp URL → green button with WhatsApp icon
- Scheduling: links can be shown/hidden by date (promote a launch, then auto-hide)

**Block: Digital Products (Storefront)**
- Product cards in a scrollable row or grid:
  - Product image/cover
  - Title
  - Price (or "Free" / "Pay what you want")
  - [Buy Now] button
- Product types:
  - Digital download (PDF, PSD, preset pack, template, ebook)
  - Booking/consultation (link to scheduling)
  - Custom/other (redirect to payment + delivery instructions)
- Payment flow (embedded, no redirect):
  1. Tap [Buy Now] → payment method selector bottom sheet
  2. Options: Bank transfer (show account details + reference), M-Pesa (show paybill + instructions), Paystack/Flutterwave (card payment embed), PayPal (redirect)
  3. After payment: download link revealed, or email sent with file
  4. For bank transfer: "I've paid" confirmation button → creator gets notification to verify and release
- Product limits on free tier: 3 products. Pro: unlimited.

**Block: Tip Jar / Support**
- "Support my work" section
- Preset amounts: ₦1,000 | ₦2,000 | ₦5,000 | Custom
- Same payment methods as storefront
- Optional: show supporter names (leaderboard / wall of love)
- Monthly supporter option (recurring, for pro tier)

**Block: Email / Newsletter Signup**
- Simple email capture: "Join my newsletter" + email input + subscribe button
- Subscribers stored in Supabase
- Export as CSV
- Future: integrate with Mailchimp, Convertkit, etc.

**Block: Booking / Consultation**
- Service name + description + price + duration
- Calendar view for available slots (simple: pick a date, pick a time)
- Booking confirmation via WhatsApp or email
- Integration with CreatorDesk (new bookings auto-create projects)

**Block: Content Showcase**
- Embed latest YouTube videos (from channel URL)
- Instagram post grid (manual image upload — no API needed to start)
- Portfolio gallery (pulls from CreatorKit if connected)
- Podcast episode embed (Spotify, Apple Podcasts)

**Block: Testimonials**
- Quote cards from satisfied clients/customers
- Pull from CreatorKit testimonials if connected
- Or add manually: quote text + attribution

**Block: Custom Text / Announcement**
- Heading + paragraph + optional CTA button
- For announcements: "New preset pack dropping Friday!" with countdown timer
- Dismissable by visitors (cookie-based)

**Block: Spacer / Divider**
- Visual separator between sections
- Options: line, dots, decorative pattern, or empty space

### 3. Theme Customizer (`settings` panel within app.html)
Slide-out or bottom sheet settings:

**Themes** (pre-built, one-tap apply):
1. **Clean** — White background, minimal, modern
2. **Dark** — Dark background, glowing accents, premium feel
3. **Gradient** — Colorful gradient background, vibrant
4. **Photo** — Background image (upload or preset African landscapes/textures)
5. **Neon** — Dark with neon accent outlines, tech/music vibe
6. **Warm** — Cream/beige tones, earthy, organic feel
7. **Bold** — High contrast, large type, statement-making
8. **Glass** — Frosted glass/blur effect, modern and sleek

**Customization on any theme:**
- Accent color picker (or enter hex)
- Font pairing selector (4 options)
- Button style: rounded / square / pill
- Button fill: solid / outline / ghost
- Background: solid color / gradient / image upload
- Layout: centered / left-aligned
- Animation: none / subtle / playful

### 4. Analytics Dashboard (within app, swipe-up or tab)
- Total page views (all time + this week + today)
- Unique visitors
- Click-through rates per link (bar chart, sorted by clicks)
- Product sales: total revenue + count
- Top referrers: where visitors come from (Instagram, WhatsApp, X, direct)
- Device split: mobile vs desktop (pie chart — expect 90%+ mobile)
- Country breakdown: where visitors are located
- Peak times: when your page gets the most traffic
- AI insight: "Your booking link gets the most clicks but your conversion rate is low. Try adding pricing information to reduce friction."

### 5. Public Page (`p/[username]` or `page/[share-token]`)
The actual creator page visitors see:
- Ultra-fast static render — no heavy JS
- All blocks rendered in order with chosen theme
- Product purchase flow: embedded bottom sheets
- Email signup: inline form
- Analytics tracking: lightweight pixel (page view, link clicks, product views)
- SEO: Open Graph tags, Twitter cards, schema.org Person/Organization
- Footer: tiny "Made with AfroTools" link (removable on Pro)
- PWA installable: visitors can "Add to Home Screen" for quick access
- Offline: basic page structure loads even offline if previously visited

---

## AI Integration

```javascript
"creator-page": {
  name: "CreatorPage — Link Page & Digital Storefront",
  systemPrompt: `You are a conversion optimization and digital storefront advisor for African creators.

Your capabilities:
1. BIO OPTIMIZATION: Write compelling profile bios that tell visitors exactly who this creator is and what they offer. Max 150 characters for impact. Different versions for different niches.

2. LINK COPY: Optimize link button text for clicks. "My YouTube" → "Watch my latest video" (action-oriented). "Photography" → "Book a photoshoot" (clear CTA).

3. PRODUCT DESCRIPTIONS: Write sales copy for digital products that drives purchases. Focus on transformation ("What will the buyer gain?"), not features. Keep it short — mobile attention spans.

4. CONVERSION ADVICE: Analyze page structure and suggest improvements:
   - Link ordering (highest-converting links first)
   - Reducing friction (too many links overwhelm visitors)
   - CTA clarity (every link should have a clear action)
   - Trust signals (testimonials, client count, featured work)

5. PRICING STRATEGY for digital products:
   - African market pricing awareness (₦2,000 preset pack vs $20 — know the sweet spot)
   - Bundle suggestions (3 presets for ₦2K, or all 20 for ₦8K)
   - "Pay what you want" vs fixed pricing guidance
   - Anchor pricing (show crossed-out "original" price)

6. LAUNCH COPY: Help creators announce products and launches — optimized for Instagram captions, WhatsApp statuses, and X/Twitter posts.

Focus on clarity and conversion. African audiences are mobile-first, data-conscious, and value-driven. Don't be salesy — be clear about value.`,
  exampleQueries: [
    "Write a bio for my creator page — I'm a graphic designer in Accra specializing in brand identity",
    "I have 8 links — which should be first?",
    "Write a product description for my Lightroom preset pack (10 presets, ₦3,000)",
    "My page gets 500 views but only 3 sales — what's wrong?",
    "Help me write an Instagram caption announcing my new ebook"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  social_links JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'clean',
  accent_color TEXT DEFAULT '#F43F5E',
  font_pairing TEXT DEFAULT 'default',
  button_style TEXT DEFAULT 'pill',
  background_type TEXT DEFAULT 'solid',
  background_value TEXT DEFAULT '#ffffff',
  custom_css TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'base36'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('link','product','tip_jar','email_signup','booking','content','testimonial','text','spacer')),
  content JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN DEFAULT TRUE,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_page_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed','pay_what_you_want','free')),
  min_price BIGINT,
  product_type TEXT DEFAULT 'download' CHECK (product_type IN ('download','booking','redirect')),
  file_url TEXT,
  redirect_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sales_count INTEGER DEFAULT 0,
  revenue_total BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','link_click','product_view','product_purchase','email_signup')),
  block_id UUID REFERENCES creator_page_blocks(id),
  product_id UUID REFERENCES creator_page_products(id),
  referrer TEXT,
  country TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_page_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES creator_pages(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_page_date ON creator_page_analytics(page_id, created_at DESC);
CREATE INDEX idx_analytics_event ON creator_page_analytics(page_id, event_type);
```

---

## Payment Integration

African payment is fragmented — support all major methods:

**Method 1: Bank Transfer (free, manual)**
- Creator adds bank details in settings
- Buyer sees account details + unique reference code
- Buyer taps "I've paid" → creator gets notification → manually verifies → releases product
- Most common in Nigeria, Ghana

**Method 2: M-Pesa (free, manual)**
- Creator adds M-Pesa paybill/till number
- Buyer sees payment instructions
- Same manual confirmation flow
- Most common in Kenya, Tanzania

**Method 3: Paystack (automated)**
- Creator connects Paystack account (settings)
- Buyer pays via Paystack popup (card, bank transfer, USSD)
- Payment auto-confirmed → product auto-delivered
- Paystack handles: NGN, GHS, ZAR, KES

**Method 4: Flutterwave (automated)**
- Same as Paystack but wider African coverage
- Handles: 30+ African currencies

**Method 5: PayPal (international)**
- For diaspora and international buyers
- Redirect flow

The creator chooses which methods to enable. The buyer sees available options sorted by relevance (based on their detected country).

---

## Cross-Tool Integration

- **CreatorKit**: Portfolio and testimonials can be embedded as blocks
- **CreatorInvoice**: Product sales auto-logged in invoice system
- **CreatorMoney**: Revenue from page sales auto-tracked in finance
- **CreatorDesk**: Bookings auto-create client entries and projects
- **CreatorCalendar**: "Latest content" block pulls from scheduled/posted content

---

## Public Page Performance (CRITICAL)

The public page must be blazing fast — it's shared in bios, WhatsApp statuses, tweets:
- **Target: < 1.5s LCP on 3G**
- Static HTML generation (pre-rendered, not client-side rendered)
- No framework JS — vanilla JS only for interactions (payment sheets, analytics pixel)
- Images: WebP with lazy loading, blurhash placeholders
- Fonts: system fonts for body, one custom font for display (async loaded)
- CSS: inline critical styles, async load theme CSS
- Total page weight: < 100KB (excluding product images)
- Analytics pixel: < 2KB inline script
- CDN: served via Netlify CDN edge

---

## Mobile Patterns

- **WYSIWYG builder**: The builder renders exactly like the public page — no "preview" needed
- **Block editing**: Tap any block → editing UI overlays the block inline
- **Block reorder**: Long-press + drag. Blocks have a visible drag handle in edit mode
- **Theme switcher**: Bottom sheet with theme cards — tap to preview instantly (CSS variable swap)
- **Share shortcut**: Persistent share button in top bar → native share sheet (WhatsApp, copy, QR code)
- **QR code**: Auto-generated QR for the page URL — download and print for business cards
- **Offline builder**: All edits cached locally, synced when online
