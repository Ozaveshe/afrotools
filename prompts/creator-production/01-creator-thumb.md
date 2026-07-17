# Prompt 01 — ThumbnailForge (creator-thumb)

> YouTube Thumbnail Maker — Design click-worthy thumbnails in 60 seconds

---

## Identity

| Field | Value |
|-------|-------|
| Name | ThumbnailForge |
| Slug | `creator-thumb` |
| Path | `/tools/creator-thumb/` |
| Accent | `#FF3B30` (Electric Red) |
| Accent Dark | `#CC2D26` |
| Accent Light | `#FFE5E5` |
| Accent Glow | `rgba(255,59,48,.4)` |
| CSS Prefix | `ct-` |
| Type | Visual Canvas Tool |

---

## What This Is

A YouTube thumbnail maker that lets African creators design professional, click-worthy thumbnails without Canva or Photoshop. Open it, pick a template, change the text, drop in your face, export. 60 seconds.

This is NOT a calculator. This is a visual design tool. The UI is a dark canvas workspace where you see your thumbnail being built in real-time.

---

## Design Philosophy

### The Workspace
- **Dark background**: `#0f0f0f` body, `#1a1a1a` panels, `#252525` cards
- **The canvas is center stage**: 70% of the screen is the thumbnail preview
- **Tools live in a slim sidebar** (desktop) or **bottom drawer** (mobile)
- **No forms, no labels** — icons + tooltips, direct manipulation
- **Real-time preview** — every change instantly reflected on canvas
- **Export is always visible** — glowing red download button, never hidden

### Color System
```css
--ct-bg: #0f0f0f;
--ct-surface: #1a1a1a;
--ct-surface-2: #252525;
--ct-border: #333;
--ct-text: #fff;
--ct-text-muted: #888;
--ct-accent: #FF3B30;
--ct-accent-glow: rgba(255,59,48,.4);
```

### Typography in the App
- UI chrome: `DM Sans` 13-14px, weight 500-600
- Canvas text editing: User-selectable fonts (Impact, Bebas Neue, Montserrat Black, Oswald, Anton)

---

## Pages

### 1. Landing Page — `index.html`
Standard light-theme landing page for SEO/conversion. Follows the existing `tool-landing.css` pattern.

**Hero**: "Thumbnails That Get Clicked" — show before/after examples of boring vs engaging thumbnails
**Features**: Templates, text styles, face crop, background removal, batch export
**How it works**: Pick template → Customize → Export
**Social proof**: "Join 10,000+ African YouTubers"
**CTA**: "Start Designing →" → links to app.html
**FAQ**: 6 questions about export quality, templates, mobile usage
**Schema**: WebApplication + FAQPage

### 2. App/Workspace — `app.html`
This is the main event. The dark studio workspace.

**Layout (Desktop)**:
```
┌─────────────────────────────────────────────────┐
│  [← Back]   ThumbnailForge        [↓ Export]    │  ← Minimal top bar
├────────┬────────────────────────────────────────┤
│        │                                         │
│ TOOLS  │         CANVAS PREVIEW                  │
│        │         (1280 × 720)                    │
│ Text   │                                         │
│ Image  │    ┌─────────────────────────┐          │
│ Shape  │    │                         │          │
│ Filter │    │   YOUR THUMBNAIL        │          │
│ BG     │    │   RENDERS HERE          │          │
│        │    │                         │          │
│        │    └─────────────────────────┘          │
│        │                                         │
├────────┴────────────────────────────────────────┤
│  [Template 1] [Template 2] [Template 3] [+]     │  ← Template strip
└─────────────────────────────────────────────────┘
```

**Layout (Mobile)**:
```
┌──────────────────────┐
│ [←]  ThumbnailForge  │
├──────────────────────┤
│                      │
│   CANVAS PREVIEW     │
│   (fills width)      │
│                      │
├──────────────────────┤
│ [Templates strip →]  │  ← Horizontal scroll
├──────────────────────┤
│                      │
│   TOOL PANEL         │
│   (bottom sheet)     │
│   [Text] [Image]     │
│   [Shape] [BG]       │
│                      │
├──────────────────────┤
│ [Export ↓]           │  ← Sticky bottom
└──────────────────────┘
```

---

## Template System

### Template Categories
1. **Reaction** — Big face, emoji, bold text ("I TRIED..." "NEVER AGAIN")
2. **Before/After** — Split screen comparison
3. **Tutorial** — Step numbers, clean text, tool/software icons
4. **Vlog** — Casual photo, location text, date stamp
5. **Podcast** — Guest photos, show name, episode number
6. **Gaming** — Action screenshot, neon text, character art
7. **Listicle** — Number prominence ("7 THINGS..." "TOP 10...")
8. **Drama/Storytime** — Dark overlay, dramatic text, question marks
9. **Review** — Product image, rating stars, verdict text
10. **Blank** — Empty 1280x720 canvas, start from scratch

### Template Data Structure
```javascript
{
  id: 'reaction-01',
  name: 'Big Reaction',
  category: 'reaction',
  preview: 'data:image/...', // Base64 thumbnail preview
  layers: [
    { type: 'bg', color: '#FF3B30' },
    { type: 'shape', shape: 'circle', x: 680, y: 360, radius: 280, fill: '#fff' },
    { type: 'image-placeholder', x: 680, y: 360, w: 500, h: 500, label: 'Your Face', clip: 'circle' },
    { type: 'text', content: 'YOUR TEXT HERE', x: 200, y: 200, font: 'Impact', size: 90, color: '#fff', stroke: '#000', strokeWidth: 4 },
    { type: 'emoji', content: '😱', x: 100, y: 600, size: 80 }
  ]
}
```

---

## Canvas Engine

### Rendering Pipeline
1. **DOM editing layer** — Positioned `div` elements for drag/resize/edit (interactive)
2. **Canvas render layer** — HTML5 Canvas for final pixel output (export)
3. On every change, the DOM layer updates instantly. Canvas re-renders for export.

### Supported Layer Types
- **Background**: Solid color, gradient, or uploaded image
- **Text**: Multi-line, fonts (6 pre-loaded), colors, outline/stroke, shadow, rotation
- **Image**: Upload from device, drag to position, resize, crop to circle/rectangle
- **Shape**: Rectangle, circle, arrow, line — fill + stroke
- **Emoji**: Click to place, resize, rotate
- **Overlay**: Color tint over background (for darkening photos)

### Text Editing
- Double-click text to edit inline
- Font selector: Impact, Bebas Neue, Montserrat Black, Anton, Oswald, DM Sans
- Size slider: 20-200px
- Color picker (preset swatches + custom hex)
- Outline: on/off, color, width
- Shadow: on/off, color, blur, offset
- Alignment: left/center/right
- Transform: uppercase toggle

### Image Handling
- Upload from device camera or gallery
- Drag to position on canvas
- Corner handles to resize (maintain aspect ratio)
- Clip mask: none, circle, rounded rectangle
- Brightness/contrast sliders (CSS filters applied to canvas)
- **Face crop helper**: When user uploads a photo, auto-suggest face-centered crop position

### Export
- **Format**: PNG (default, transparent support) or JPEG (smaller file)
- **Resolution**: Always 1280×720 (YouTube standard)
- **Quality**: JPEG quality slider 70-100%
- **Export button**: Glowing red, always visible
- **Mobile**: Uses `canvas.toBlob()` → `URL.createObjectURL()` → download link
- **Share**: "Share to WhatsApp" button (mobile deep link with image)

---

## Mobile-First Interactions

- **Canvas**: Pinch to zoom, two-finger drag to pan
- **Layers**: Tap to select, long-press for options menu
- **Text editing**: Tap text → keyboard opens with formatting toolbar above it
- **Templates**: Horizontal swipe strip at top of bottom sheet
- **Tool switching**: Tab bar at bottom of the bottom sheet (Text / Image / Shape / BG / Export)
- **Bottom sheet**: Draggable — half-height default, full-height on drag up, dismiss on drag down
- **Undo/Redo**: Two-finger swipe left (undo) / right (redo), or buttons in top bar

---

## Font Loading

Pre-load these fonts for canvas use (Google Fonts):
```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Montserrat:wght@900&family=Oswald:wght@700&display=swap" rel="stylesheet">
```
Impact is system-available. DM Sans already loaded globally.

---

## Data Model (Supabase)

```sql
-- Thumbnail projects (for logged-in users)
CREATE TABLE creator_thumb_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Thumbnail',
  layers JSONB NOT NULL DEFAULT '[]',
  canvas_width INT DEFAULT 1280,
  canvas_height INT DEFAULT 720,
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Template favorites
CREATE TABLE creator_thumb_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE creator_thumb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_thumb_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON creator_thumb_projects
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON creator_thumb_favorites
  FOR ALL USING (auth.uid() = user_id);
```

### Local Storage (No Auth)
Projects saved to `localStorage` as `ct_projects` array. Synced to Supabase on login.

---

## Engine — `engines/creator-thumb-engine.js`

```javascript
// IIFE module
(function() {
  'use strict';

  const ThumbEngine = {
    canvas: null,
    ctx: null,
    layers: [],
    selectedLayer: null,
    history: [],
    historyIndex: -1,

    init(canvasEl) { /* Set up canvas, load fonts, bind events */ },

    // Layer management
    addLayer(type, props) { /* Add text/image/shape/emoji layer */ },
    removeLayer(id) { /* Remove layer by ID */ },
    moveLayer(id, direction) { /* Reorder layers */ },
    selectLayer(id) { /* Select for editing */ },
    updateLayer(id, props) { /* Update layer properties */ },

    // Templates
    loadTemplate(templateId) { /* Load template layers */ },
    getTemplates(category) { /* Filter templates by category */ },

    // Canvas operations
    render() { /* Render all layers to canvas */ },
    exportPNG() { /* Export as PNG blob */ },
    exportJPEG(quality) { /* Export as JPEG blob */ },

    // History
    pushHistory() { /* Save state for undo */ },
    undo() { /* Restore previous state */ },
    redo() { /* Restore next state */ },

    // Image handling
    handleImageUpload(file) { /* Process uploaded image */ },

    // Persistence
    saveLocal() { /* Save to localStorage */ },
    loadLocal(projectId) { /* Load from localStorage */ },
    syncToSupabase() { /* Sync for logged-in users */ },
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorThumb = ThumbEngine;
})();
```

---

## Netlify Function — `netlify/functions/creator-thumb.js`

Minimal — this tool is primarily client-side. The function handles:
- Saving/loading projects for authenticated users
- Template analytics (which templates are popular)
- No AI generation needed for this tool

---

## Performance Targets

- **First paint**: < 1.5s on 3G
- **Canvas interactive**: < 2s after page load
- **Template load**: < 500ms per template
- **Export**: < 2s for full 1280×720 PNG
- **Fonts**: Loaded async, don't block render
- **Total JS**: < 80KB gzipped (engine + canvas logic)

---

## Cross-Tool Integration

- "Need a title?" → Link to TitleSmith
- "Add caption?" → Link to CaptionCraft
- "Schedule this content?" → Link to CreatorCalendar
- Export directly to CreatorPage (as portfolio piece)

---

## What This Is NOT

- This is NOT Canva. No multi-page documents, no presentation mode, no vector editing.
- This is NOT a general design tool. It does ONE thing: YouTube thumbnails.
- This is NOT a photo editor. Basic filters only — brightness, contrast, overlay tint.
- Keep scope tight. Do thumbnails perfectly. Nothing else.
