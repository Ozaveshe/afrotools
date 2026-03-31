# Prompt 02 — CarouselStudio (creator-carousel)

> Instagram & LinkedIn Carousel Maker — Swipeable multi-slide posts in minutes

---

## Identity

| Field | Value |
|-------|-------|
| Name | CarouselStudio |
| Slug | `creator-carousel` |
| Path | `/tools/creator-carousel/` |
| Accent | `#AF52DE` (Vivid Purple) |
| Accent Dark | `#8E44AD` |
| Accent Light | `#F3E8FF` |
| Accent Glow | `rgba(175,82,222,.4)` |
| CSS Prefix | `cc-` |
| Type | Visual Canvas Tool |

---

## What This Is

A carousel post builder for Instagram and LinkedIn. Creators use carousels for educational content, storytelling, tips, testimonials, and brand building. This tool lets you create multi-slide posts with consistent branding, text hierarchy, and visual flow — then export all slides as images.

The typical flow: Pick a template → Edit text on each slide → Change colors/fonts → Export all slides → Post to IG/LinkedIn.

---

## Design Philosophy

### Workspace
- **Dark studio**: `#0f0f0f` body, `#1a1a1a` panels
- **Slide filmstrip**: Horizontal strip of slide thumbnails at the bottom — click to navigate, drag to reorder
- **Active slide**: Large preview in center, filling available space
- **Edit panel**: Right sidebar (desktop) or bottom sheet (mobile) for editing the active slide
- **Swipe preview mode**: Full-screen swipe simulation showing how the carousel will look on Instagram

### The Feel
This should feel like building a slide deck, not filling out a form. You SEE your carousel being built. Every tap changes something visible. The slides have personality — gradients, bold typography, branded consistency.

---

## Pages

### 1. Landing Page — `index.html`
Light theme, SEO-optimized.

**Hero**: "Carousels That Stop the Scroll" — animated mockup of a carousel being swiped
**Stats**: Templates | Slide formats | Export quality
**Features**: 8 template categories, consistent branding, swipe preview, batch export
**How it works**: Pick template → Edit slides → Export & post
**CTA**: "Start Building →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout**:
```
┌──────────────────────────────────────────────────┐
│ [←]  CarouselStudio   [Swipe Preview] [Export ↓] │
├──────────────────────────────┬───────────────────┤
│                              │  EDIT PANEL       │
│     ACTIVE SLIDE PREVIEW     │                   │
│     (1080 × 1080 or          │  [Text]           │
│      1080 × 1350)            │  [Colors]         │
│                              │  [Images]         │
│     ┌──────────────────┐     │  [Layout]         │
│     │                  │     │  [Branding]       │
│     │   Slide 3 of 8   │     │                   │
│     │                  │     │                   │
│     └──────────────────┘     │                   │
│                              │                   │
├──────────────────────────────┴───────────────────┤
│ [1] [2] [3] [4] [5] [6] [7] [8] [+] [−]         │ ← Slide filmstrip
└──────────────────────────────────────────────────┘
```

**Mobile Layout**:
```
┌──────────────────────┐
│ [←] CarouselStudio   │
├──────────────────────┤
│                      │
│   ACTIVE SLIDE       │
│   (fills width)      │
│                      │
│   ← swipe →          │
│   to change slides   │
│                      │
├──────────────────────┤
│ [1][2][3][4][+]      │ ← Filmstrip
├──────────────────────┤
│   EDIT PANEL         │
│   (bottom sheet)     │
│   [Text][Color][Img] │
│                      │
├──────────────────────┤
│ [Preview] [Export ↓] │ ← Sticky bottom
└──────────────────────┘
```

---

## Template System

### Format Options
- **Instagram Square**: 1080 × 1080
- **Instagram Portrait**: 1080 × 1350 (recommended — takes more screen space)
- **LinkedIn**: 1080 × 1080 (or 1280 × 720 for landscape)

### Template Categories (8)

1. **Educational / Tips**
   - Numbered slides: "5 Things You Need to Know About..."
   - Headline slide → content slides → CTA slide
   - Clean, structured, high-contrast text

2. **Storytelling**
   - Narrative flow across slides
   - Photo backgrounds with text overlays
   - Emotional arc: hook → build → climax → resolution

3. **Before/After**
   - Comparison format
   - Side-by-side or swipe-to-reveal feel
   - Great for transformations, results, growth

4. **Quote / Motivation**
   - Large typography, minimal design
   - Attribution slide
   - Background textures/gradients

5. **Brand Introduction**
   - "Hi, I'm [Name]" → What I do → Who I help → CTA
   - Professional, clean
   - Good for new followers

6. **Product Showcase**
   - Product images per slide
   - Features, pricing, CTA
   - E-commerce friendly

7. **Data / Statistics**
   - Charts, numbers, percentages
   - Infographic style
   - Bold numbers with context text

8. **Testimonial**
   - Client quotes per slide
   - Star ratings, photos
   - Social proof format

### Template Data Structure
```javascript
{
  id: 'edu-tips-01',
  name: '5 Tips — Bold',
  category: 'educational',
  format: '1080x1350',
  slideCount: 7, // cover + 5 tips + CTA
  branding: {
    primaryColor: '#AF52DE',
    secondaryColor: '#1a1a1a',
    font: 'Montserrat',
    fontWeight: 800
  },
  slides: [
    {
      type: 'cover',
      layers: [
        { type: 'bg', gradient: 'linear-gradient(135deg, #AF52DE, #5B21B6)' },
        { type: 'text', role: 'headline', content: '5 THINGS EVERY CREATOR NEEDS', x: 540, y: 500, font: 'Montserrat', size: 64, color: '#fff', align: 'center', maxWidth: 900 },
        { type: 'text', role: 'subhead', content: 'Swipe →', x: 540, y: 1250, font: 'DM Sans', size: 28, color: 'rgba(255,255,255,.6)', align: 'center' }
      ]
    },
    // ... content slides
    {
      type: 'cta',
      layers: [
        { type: 'bg', color: '#1a1a1a' },
        { type: 'text', role: 'cta-headline', content: 'FOLLOW FOR MORE', x: 540, y: 600, font: 'Montserrat', size: 56, color: '#fff', align: 'center' },
        { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 720, font: 'DM Sans', size: 32, color: '#AF52DE', align: 'center' }
      ]
    }
  ]
}
```

---

## Branding System

Every carousel maintains visual consistency across slides:

- **Primary Color**: User-selectable, applied to backgrounds, accents, highlights
- **Secondary Color**: Auto-generated complement
- **Font**: User-selectable from 6 options
- **Logo/Handle**: Set once, appears on every slide (optional)
- **Slide Numbers**: Auto-generated (1/8, 2/8, etc.) — toggleable

Users can set their brand colors + font + handle once, and every template respects it. This is the stickiness — "my carousels always look like ME."

---

## Slide Editor

### Text Editing
- Tap text to edit inline on the slide
- Font family: Montserrat, DM Sans, Bebas Neue, Playfair Display, Space Grotesk, Anton
- Font size: drag slider or tap to type
- Font weight: Regular, Bold, Black
- Color: preset swatches + hex input
- Alignment: left / center / right
- Line height adjustment
- Text transform: uppercase / normal
- Max 3 text layers per slide (headline, body, accent)

### Background Options
- Solid color
- Gradient (linear, radial — 2 color stops, angle)
- Uploaded image (with overlay tint)
- Pattern (subtle geometric patterns)

### Image Placement
- Upload image per slide
- Position: drag to place
- Size: pinch/corner handles
- Clip: rectangle, circle, rounded rectangle
- Opacity slider

### Slide Management
- **Add slide**: "+" button in filmstrip, choose blank or from template
- **Remove slide**: Long-press slide in filmstrip → "Delete"
- **Reorder**: Drag slides in filmstrip
- **Duplicate**: Long-press → "Duplicate"
- **Max slides**: 10 (Instagram limit)
- **Min slides**: 2

---

## Swipe Preview Mode

Full-screen simulation of how the carousel looks on Instagram:
- Phone frame mockup (optional)
- Swipe left/right to navigate slides
- Dot indicators at bottom
- Shows the "feel" of the carousel before posting
- Exit with X button or swipe down

---

## Export

- **All slides**: ZIP file with slide-1.png through slide-N.png
- **Individual slide**: Tap slide in filmstrip → export single
- **Format**: PNG (default) or JPEG
- **Resolution**: Native template resolution (1080×1080 or 1080×1350)
- **Naming**: `carousel-[title]-slide-[N].png`
- **Mobile**: Download all slides to camera roll
- **Share**: "Share to WhatsApp" with all slides attached

---

## Data Model (Supabase)

```sql
CREATE TABLE creator_carousel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Carousel',
  format TEXT DEFAULT '1080x1350',
  branding JSONB DEFAULT '{}',
  slides JSONB NOT NULL DEFAULT '[]',
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_carousel_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own carousels" ON creator_carousel_projects
  FOR ALL USING (auth.uid() = user_id);
```

---

## Engine — `engines/creator-carousel-engine.js`

```javascript
(function() {
  'use strict';
  const CarouselEngine = {
    slides: [],
    activeSlideIndex: 0,
    branding: {},
    format: { w: 1080, h: 1350 },

    init() {},
    loadTemplate(id) {},
    addSlide(afterIndex) {},
    removeSlide(index) {},
    duplicateSlide(index) {},
    reorderSlides(fromIndex, toIndex) {},
    setActiveSlide(index) {},
    updateSlideLayer(slideIndex, layerId, props) {},
    setBranding(brandingObj) {},
    renderSlide(index, canvas) {},
    exportSlide(index) {},
    exportAll() {},
    saveLocal() {},
    loadLocal(projectId) {},
  };
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorCarousel = CarouselEngine;
})();
```

---

## Performance

- First paint < 1.5s on 3G
- Template load < 800ms
- Slide switch < 100ms (instant feel)
- Export single slide < 1.5s
- Export all slides (10) < 8s
- Total JS < 90KB gzipped

---

## Cross-Tool Links

- "Need captions for this carousel?" → CaptionCraft
- "Generate hashtags?" → TagWave
- "Schedule posting?" → CreatorCalendar
- "Need a hook for slide 1?" → HookFactory
