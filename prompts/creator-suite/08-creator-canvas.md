# Prompt 08 — CreatorCanvas: Thumbnail & Graphics Studio

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorCanvas |
| **Tagline** | "Scroll-stopping visuals. In seconds." |
| **Path** | `/tools/creator-canvas/` |
| **CSS prefix** | `cv-` |
| **Accent color** | Amber `#F59E0B` / dark `#D97706` / pale `rgba(245,158,11,0.08)` |
| **Engine** | `engines/creator-canvas-engine.js` |
| **AI advisor key** | `"creator-canvas"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_designs`, `creator_design_templates`, `creator_brand_kits` |
| **Netlify function** | `netlify/functions/creator-canvas.js` |

---

## Design Philosophy

This is NOT trying to be Canva. Canva is a design tool for everyone. CreatorCanvas is a **visual content weapon for African creators** — focused on the 5 graphics creators actually need: social media posts, YouTube thumbnails, event flyers, story graphics, and quote cards. That narrow focus means it can be 10x faster than Canva for those specific tasks.

The key differentiators:
1. **African-first templates** — patterns, colors, typography that feel authentically African, not "African-themed by a Western designer"
2. **Size-aware** — knows every platform's exact dimensions and safe zones
3. **AI-powered** — describe what you want, get a design direction instantly
4. **Lightweight** — works on low-end phones with 3G connections. Canva struggles on old Androids; this won't.

**Visual personality:**
- Creative, energetic, warm — the amber accent is creative and inviting
- The workspace is dark (like Photoshop/Figma) — content pops against dark UI
- Templates are the hero — a gallery of beautiful starting points, not a blank canvas
- Export preview shows exactly how it'll look on the target platform
- Everything feels fast — templates load instantly, edits are real-time

**Mobile-first UX:**
- Templates browse as a vertical masonry grid (like Pinterest)
- Editor uses bottom toolbar (not top — keeps thumb-zone friendly)
- Text editing: tap text → inline edit with keyboard, no modal
- Color picker: pre-set palettes first, custom color second
- Pinch to zoom on canvas, two-finger rotate for elements
- Export: one-tap download or share to WhatsApp/Instagram
- CRITICAL: The editor must work on a 5.5" Android screen. No feature can require a large display.

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "Scroll-Stopping Visuals. In Seconds." with amber accent
- Template gallery preview — showing 6 beautiful African-designed templates
- Features: AI design brief, platform sizes, African templates, brand kit, batch export
- Comparison: "What takes 30 minutes in Canva takes 30 seconds here"
- FAQ: is it free, can I upload my own images, file formats, print quality

### 2. Template Gallery (`app.html`)
The starting point — always start from a template:

**Top Bar:**
- Format filter (horizontal scroll pills):
  - Instagram Post (1080×1080)
  - Instagram Story (1080×1920)
  - Instagram Carousel (1080×1080, multi-slide)
  - YouTube Thumbnail (1280×720)
  - TikTok Cover (1080×1920)
  - X/Twitter Post (1200×675)
  - Facebook Cover (820×312)
  - WhatsApp Status (1080×1920)
  - Event Flyer (1080×1350)
  - A4 Poster (2480×3508)
  - Custom Size
- Category filter:
  - All | Quotes | Promotional | Announcement | Event | Music | Photography | Food | Fashion | Business | Minimalist

**Template Grid** (masonry layout on mobile):
- Each template card: thumbnail + format badge + category tag
- Tapping a template: full-screen preview with [Use This Template] button
- "AI Design" card at top: "Describe what you need — AI picks the template and customizes it"
- Templates are pre-designed with placeholder text and images — user swaps in their content

**Template Categories (African-first):**
- **African Patterns**: Kente, Ankara, Adire, Kitenge, Ndebele geometric patterns as backgrounds/borders
- **African Typography**: Bold Afrocentric display fonts paired with clean body fonts
- **African Color Palettes**: Earth tones (terracotta, ochre, olive), Pan-African (red/gold/green), Coastal (teal/coral/sand), Urban (neon/black/chrome)
- **Photography-forward**: Large photo with text overlay — designed for photog/videographer content
- **Music/Entertainment**: Dark backgrounds, neon accents, bold text — for music promo, event flyers
- **Professional/Business**: Clean, corporate-adjacent but with personality — for consultants, coaches, speakers

### 3. Design Editor (`edit.html?id=xxx`)
The canvas editor — optimized for speed and mobile:

**Canvas Area** (center, dark background):
- WYSIWYG canvas showing the design at target resolution
- Pinch to zoom, pan to scroll
- Tap any element to select (shows blue handles)
- Selected element: resize handles on corners, rotation handle on top
- Double-tap text to edit inline

**Bottom Toolbar** (mobile — 5 icons, swipe for more):
Primary tools:
- **Text** (T icon): Add text block. Tap to type, bottom sheet for font/size/color/alignment
- **Image** (mountain icon): Add image from gallery/camera. Crop tool. Filters (6 basic: none, warm, cool, B&W, vintage, pop)
- **Elements** (shapes icon): Stickers, shapes, icons, decorative elements. African-pattern frames and borders
- **Background** (palette icon): Solid color, gradient, pattern, or image background
- **AI** (sparkle icon): AI design assistant (describe changes, get suggestions)

Secondary tools (swipe toolbar right):
- **Layers** (stack icon): Reorder elements front/back
- **Opacity**: Slider for selected element transparency
- **Duplicate**: Copy selected element
- **Delete**: Remove selected element
- **Undo/Redo**: Arrow buttons

**Top Bar** (minimal):
- [Back] — return to gallery (auto-saves)
- Design name (tappable to rename)
- [Export] button (amber accent)

**Text Editing Panel** (bottom sheet when text selected):
- Font selector: curated list of 20 fonts (not 500 — opinionated selection):
  - Display: Instrument Serif, Playfair Display, Space Grotesk, Bebas Neue, Righteous
  - Body: DM Sans, Inter, Poppins, Nunito, Raleway
  - African-inspired: Staatliches, Archivo Black, Alfa Slab One
  - Handwritten: Caveat, Shadows Into Light, Pacifico
- Size slider (tap to type exact number)
- Color picker:
  - Quick palette row (6 colors from template + black/white)
  - Full color wheel (expandable)
  - Hex input field
  - Eyedropper (pick color from canvas)
- Alignment: left/center/right
- Style: bold, italic, underline, all-caps, letter spacing
- Effects: text shadow, outline/stroke, curved text (basic)

**Image Editing Panel** (bottom sheet when image selected):
- Crop: free-form or aspect ratio lock
- Filters: 6 presets (swipeable preview)
- Adjustments: brightness, contrast (sliders)
- Remove background (AI-powered via API — pro feature)
- Flip: horizontal, vertical
- Opacity slider

### 4. Brand Kit (within settings or separate tab)
Saved brand assets for consistency:
- Logo upload (dark + light versions)
- Brand colors: up to 6 saved colors
- Brand fonts: primary + secondary (from available font list)
- Auto-apply: new designs start with brand colors/fonts
- Pulls from CreatorKit accent color if connected

### 5. Design Gallery (saved designs)
Grid of all saved designs:
- Thumbnail preview
- Format badge
- Last edited date
- Actions: Edit, Duplicate, Delete, Download
- Folders/tags for organization (optional)

### 6. Export Flow
When user taps [Export]:

**Bottom sheet options:**
- **Download** — saves to device
  - Format: PNG (default) or JPG (smaller file size)
  - Quality: High (original) or Compressed (for WhatsApp — reduces file size)
- **Share** — native share sheet
  - WhatsApp (optimized compression)
  - Instagram (direct share if supported, else download + prompt)
  - Copy to clipboard
- **Multi-format export** (batch):
  - "Export for all platforms" → generates resized versions for each selected platform
  - IG Post (1080×1080) + IG Story (1080×1920) + X Post (1200×675) from one design
  - Each version intelligently repositions elements for the new aspect ratio

---

## AI Integration

```javascript
"creator-canvas": {
  name: "CreatorCanvas — Thumbnail & Graphics Studio",
  systemPrompt: `You are a graphic design advisor for African creators. You help them create visually compelling social media graphics, thumbnails, and promotional materials.

Your capabilities:
1. DESIGN BRIEF → TEMPLATE SELECTION: When a creator describes what they need ("I need a YouTube thumbnail for my Lagos food vlog"), recommend:
   - Best template category
   - Color palette suggestion (based on content type and target emotion)
   - Text suggestions (headline + subtitle)
   - Layout advice (photo placement, text positioning)

2. HEADLINE OPTIMIZATION: Rewrite thumbnail/post text for maximum impact:
   - YouTube thumbnails: 3-5 words max, create curiosity or shock
   - Instagram posts: engaging, emoji-light, CTA-clear
   - Event flyers: date/time prominent, FOMO-inducing
   Know what works for African audiences specifically.

3. COLOR PSYCHOLOGY: Advise on colors based on the intended emotion and action:
   - Trust/professionalism: deep blue, navy
   - Energy/excitement: red, orange, yellow
   - Calm/luxury: teal, gold, deep purple
   - African heritage: earth tones, kente colors, pan-African palette
   - Music/nightlife: neon on dark, gradient effects

4. LAYOUT ADVICE: Guide element placement:
   - YouTube safe zones (where UI elements overlap)
   - Instagram's algorithm favoring faces + text overlay
   - Mobile readability: minimum text size for phone screens
   - Visual hierarchy: what should the eye see first, second, third

5. BRAND CONSISTENCY: When a brand kit is saved, advise on maintaining visual consistency while keeping designs fresh.

Be specific and practical. Don't suggest things that require advanced design skills. The creator is using templates with simple text/image swaps — keep advice actionable within those constraints.`,
  exampleQueries: [
    "I need a YouTube thumbnail for 'Top 10 Jollof Rice Mistakes' — what should it look like?",
    "What colors should I use for a fitness brand targeting young Nigerians?",
    "Make this text punchier for a thumbnail: 'How I Started My Photography Business In Lagos'",
    "I'm making an event flyer for an Afrobeats concert — suggest a layout",
    "My Instagram feed looks messy. How do I make it more cohesive?"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Untitled Design',
  format TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  canvas_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  template_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  canvas_data JSONB NOT NULL,
  thumbnail_url TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Brand',
  logo_light_url TEXT,
  logo_dark_url TEXT,
  colors JSONB DEFAULT '[]',
  primary_font TEXT,
  secondary_font TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Canvas Engine Architecture

The canvas engine needs to work on low-end phones. No Fabric.js or heavy canvas libraries.

**Approach: HTML/CSS-based canvas (not `<canvas>` element)**
- Each element is an absolutely positioned `<div>` within a container
- Text elements: contenteditable divs with CSS styling
- Image elements: `<img>` tags with CSS transforms
- This approach is:
  - Touch-native (browser handles touch events on elements)
  - Accessible (text is selectable, readable)
  - Lightweight (no canvas library)
  - WYSIWYG (CSS rendering = export rendering)

**Export: html2canvas** (lazy-loaded)
- Captures the container div as a canvas → PNG/JPG blob
- Accurate because the source IS HTML/CSS

**Element data structure:**
```javascript
{
  id: 'elem_1',
  type: 'text', // text | image | shape | pattern
  content: 'Your headline here',
  x: 50,        // position from left (px in canvas coords)
  y: 100,       // position from top
  width: 400,
  height: 80,
  rotation: 0,  // degrees
  opacity: 1,
  zIndex: 2,
  style: {
    fontFamily: 'Instrument Serif',
    fontSize: 48,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    letterSpacing: 0
  }
}
```

---

## Template Design System

Templates are JSON structures that define:
- Canvas dimensions and background
- Pre-placed elements with styling
- Placeholder text (e.g., "YOUR HEADLINE" → user replaces)
- Placeholder images (sample images → user replaces)
- Color variables (template colors that update when user changes accent)

**Seed the system with 50 templates:**
- 10 YouTube thumbnails (food, tech, lifestyle, music, business, reaction, tutorial, vlog, review, motivation)
- 10 Instagram posts (quote, promo, announcement, carousel cover, before/after, stat, tip, testimonial, product, BTS)
- 10 Instagram stories (poll, announcement, countdown, link promo, question, product showcase)
- 5 Event flyers (concert, workshop, party, conference, launch)
- 5 X/Twitter posts (thread intro, stat share, hot take, quote, announcement)
- 5 WhatsApp status graphics
- 5 General (business card, poster, media kit cover)

---

## Cross-Tool Integration

- **CreatorKit**: Brand kit colors/fonts shared. Media kit cover auto-designed
- **CreatorCalendar**: "Create graphic" button on planned posts opens editor with right format and topic
- **CreatorPage**: Product cover images designed here
- **CreatorInvoice**: Invoice header/logo designed here
- **CreatorMind**: AI-generated content briefs include visual direction that pre-configures the canvas

---

## Mobile Patterns

- **Template browsing**: Vertical scroll masonry grid, lazy-loaded thumbnails
- **Canvas interaction**: Pinch-zoom, single-finger pan, tap-select, double-tap-edit
- **Bottom toolbar**: 56px tall, icons only, horizontally scrollable for secondary tools
- **Text editing**: Full-screen keyboard with formatting bar above it
- **Color picker**: Bottom sheet with swatches, expandable to full picker
- **Save/export**: Auto-save every 5 seconds. Export via bottom sheet with format options
- **Orientation**: Editor works in portrait (standard) but suggests landscape for YouTube thumbnail editing
- **Memory management**: Only render visible canvas area, unload off-screen template thumbnails

---

## Performance (CRITICAL for low-end devices)

- No heavy canvas libraries — HTML/CSS-based rendering
- Templates: JSON + references to shared assets (patterns, fonts loaded on demand)
- Fonts: subset only characters used in the design, lazy-loaded per font
- Images: compressed on upload (max 1200px), WebP where supported
- html2canvas: lazy-loaded only on export (~80KB)
- Template thumbnails: 200px WebP previews, progressive loading
- Target: < 100KB initial JS, < 60KB CSS, editor usable on 2GB RAM Android
- Touch responsiveness: all interactions must respond within 100ms (no perceptible lag)
