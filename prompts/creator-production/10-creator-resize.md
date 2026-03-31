# Prompt 10 — ResizeKit (creator-resize)

> Social Post Resizer — One image → every social media size, instantly

---

## Identity

| Field | Value |
|-------|-------|
| Name | ResizeKit |
| Slug | `creator-resize` |
| Path | `/tools/creator-resize/` |
| Accent | `#00C7BE` (Teal) |
| Accent Dark | `#009E97` |
| Accent Light | `#E0FBF9` |
| Accent Glow | `rgba(0,199,190,.4)` |
| CSS Prefix | `crz-` |
| Type | Visual Canvas Tool |

---

## What This Is

Upload one image. Get it perfectly sized for every social media platform — Instagram square, Instagram story, X post, X header, YouTube thumbnail, YouTube banner, LinkedIn post, Facebook cover. Each version is smart-cropped around the focal point, with optional background fill for different aspect ratios.

This is the tool creators use after a photoshoot or after creating a graphic in CreatorCanvas. Instead of opening Photoshop 8 times to resize, upload once and download everything.

---

## Design Philosophy

### The Interface
- **Dark workspace**: `#0f0f0f` background, teal accents
- **Center: uploaded image with focal point marker** — user taps to set the "center of interest"
- **Grid of size previews** — all platform sizes shown as mini-previews around the original
- **One-click download all** — ZIP with all sizes, properly named
- **Background fill options** — when aspect ratio doesn't match: blur fill, solid color, gradient, or extend edges

### The Feel
Efficient, utilitarian, satisfying. Teal is clean and precise. The joy is in the "instant everything" moment — upload one image, see 8 perfectly sized versions appear immediately. No fuss, no tweaking, just done.

---

## Pages

### 1. Landing Page — `index.html`
Standard light theme.

**Hero**: "One Image. Every Platform. Every Size." — animated mockup showing one photo branching into 8 different sized cards
**Stats**: 8+ sizes | Smart crop | Batch download
**Features**: Focal point detection, background fill modes, batch export, no quality loss
**CTA**: "Upload & Resize →"
**FAQ**: 6 questions
**Schema**: WebApplication + FAQPage

### 2. Workspace — `app.html`

**Desktop Layout — Before Upload**:
```
┌──────────────────────────────────────────┐
│          ResizeKit ✂️                    │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │    📸 Drop your image here       │   │
│   │    or click to upload            │   │
│   │                                  │   │
│   │    PNG, JPG, WebP · Max 10MB     │   │
│   │                                  │   │
│   └──────────────────────────────────┘   │
│                                          │
│   Quick sizes:                           │
│   [All Social] [Instagram Only]          │
│   [YouTube Only] [Custom]                │
│                                          │
└──────────────────────────────────────────┘
```

**Desktop Layout — After Upload**:
```
┌──────────────────────────────────────────────────┐
│ [←] ResizeKit     [Fill Mode: Blur ▾] [↓ All]   │
├──────────────────────────────────────────────────┤
│                                                  │
│   ORIGINAL IMAGE          │  SIZE PREVIEWS       │
│   ┌──────────────────┐    │                      │
│   │                  │    │  ┌──────┐ ┌──────┐   │
│   │   [focal point   │    │  │IG Sq │ │IG Sty│   │
│   │    marker ⊕]     │    │  │1080² │ │1080× │   │
│   │                  │    │  │      │ │1920  │   │
│   │                  │    │  └──────┘ └──────┘   │
│   └──────────────────┘    │                      │
│                           │  ┌──────┐ ┌──────┐   │
│   Focal point: center     │  │X Post│ │X Hdr │   │
│   [Reset] [Auto-detect]   │  │1200× │ │1500× │   │
│                           │  │675   │ │500   │   │
│                           │  └──────┘ └──────┘   │
│                           │                      │
│                           │  ┌──────┐ ┌──────┐   │
│                           │  │YT Thu│ │YT Ban│   │
│                           │  │1280× │ │2560× │   │
│                           │  │720   │ │1440  │   │
│                           │  └──────┘ └──────┘   │
│                           │                      │
│                           │  ┌──────┐ ┌──────┐   │
│                           │  │LI Pos│ │FB Cov│   │
│                           │  │1200× │ │820×  │   │
│                           │  │627   │ │312   │   │
│                           │  └──────┘ └──────┘   │
│                           │                      │
├──────────────────────────────────────────────────┤
│ 8 sizes ready · [Download All (ZIP)] [↓ Single]  │
└──────────────────────────────────────────────────┘
```

**Mobile**: Original image at top with focal point. Sizes in 2-column grid below. Sticky download button at bottom.

---

## Supported Sizes

| Platform | Size Name | Dimensions | Aspect Ratio |
|----------|-----------|------------|-------------|
| Instagram | Square Post | 1080 × 1080 | 1:1 |
| Instagram | Portrait Post | 1080 × 1350 | 4:5 |
| Instagram | Story/Reel | 1080 × 1920 | 9:16 |
| X/Twitter | Post Image | 1200 × 675 | 16:9 |
| X/Twitter | Header | 1500 × 500 | 3:1 |
| YouTube | Thumbnail | 1280 × 720 | 16:9 |
| YouTube | Channel Banner | 2560 × 1440 | 16:9 |
| LinkedIn | Post Image | 1200 × 627 | 1.91:1 |
| Facebook | Cover Photo | 820 × 312 | 2.63:1 |
| Facebook | Post Image | 1200 × 630 | 1.91:1 |
| Pinterest | Pin | 1000 × 1500 | 2:3 |
| WhatsApp | Status | 1080 × 1920 | 9:16 |

### Size Presets
- **All Social** — generates all 12 sizes
- **Instagram Only** — square, portrait, story
- **YouTube Only** — thumbnail, banner
- **X Only** — post, header
- **Custom** — user picks which sizes to generate

---

## Focal Point System

### What It Does
When cropping from a wide image to a narrow aspect ratio (or vice versa), the crop centers on the focal point. This ensures the important part of the image (a face, product, text) isn't cut off.

### Implementation
- After upload, the focal point defaults to CENTER
- User can tap/click anywhere on the image to set a new focal point
- A crosshair marker (⊕) appears at the focal point
- All size previews update instantly when focal point changes
- **Auto-detect**: Button that uses simple heuristics — if the image has a face (detected via simple center-of-mass algorithm), set focal point there

### Crop Algorithm
```javascript
function cropToSize(image, targetW, targetH, focalX, focalY) {
  const sourceRatio = image.width / image.height;
  const targetRatio = targetW / targetH;

  let cropW, cropH, cropX, cropY;

  if (sourceRatio > targetRatio) {
    // Source is wider — crop horizontally
    cropH = image.height;
    cropW = cropH * targetRatio;
    cropX = Math.max(0, Math.min(focalX * image.width - cropW / 2, image.width - cropW));
    cropY = 0;
  } else {
    // Source is taller — crop vertically
    cropW = image.width;
    cropH = cropW / targetRatio;
    cropX = 0;
    cropY = Math.max(0, Math.min(focalY * image.height - cropH / 2, image.height - cropH));
  }

  // Draw cropped region to target canvas
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
}
```

---

## Background Fill Modes

When the source image aspect ratio is very different from the target, instead of aggressive cropping, the user can choose a fill mode:

### 1. Blur Fill (Default)
- Source image centered at correct aspect ratio
- Background filled with a blurred, scaled-up version of the same image
- Popular on Instagram stories — feels intentional, not cropped

### 2. Solid Color
- Source image centered
- Background filled with a solid color (auto-detected from image edges, or user-selected)
- Clean, professional look

### 3. Gradient
- Source image centered
- Background filled with a gradient derived from the image's dominant colors
- Elegant, premium feel

### 4. Extend (AI-like)
- Simple edge extension — stretches the outermost pixels to fill
- Works well for images with simple edges (sky, solid backgrounds)
- NOT actual AI generation — just pixel stretching

### 5. Crop Only
- No fill. Aggressive crop to exact target ratio.
- Focal point determines crop position.

---

## Image Processing

All processing happens **client-side** in the browser using HTML5 Canvas:

```javascript
// Core processing pipeline
async function processImage(sourceImage, sizes, focalPoint, fillMode) {
  const results = [];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');

    if (fillMode === 'blur') {
      // Draw blurred, scaled background
      ctx.filter = 'blur(30px)';
      ctx.drawImage(sourceImage, 0, 0, size.width, size.height);
      ctx.filter = 'none';
      // Draw sharp image centered
      drawFocalCentered(ctx, sourceImage, size, focalPoint);
    } else if (fillMode === 'crop') {
      cropToSize(ctx, sourceImage, size, focalPoint);
    }
    // ... other fill modes

    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    results.push({ name: size.name, blob, filename: `${size.slug}.png` });
  }

  return results;
}
```

### ZIP Export
Uses JSZip (lightweight library) to bundle all sizes into a single ZIP download:
```javascript
async function downloadAll(results, projectName) {
  const zip = new JSZip();
  for (const r of results) {
    zip.file(`${projectName}/${r.filename}`, r.blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${projectName}-all-sizes.zip`);
}
```

Include JSZip as a dependency (3.7KB gzipped CDN load).

---

## Mobile Experience

- **Upload**: Camera roll picker or take new photo
- **Focal point**: Tap on image to set
- **Previews**: 2-column grid of all sizes, scrollable
- **Tap preview to expand**: Full-size preview of that specific crop
- **Download**: Individual or all (ZIP)
- **Share**: Direct share to WhatsApp, save to camera roll

---

## Data Model

No database needed for this tool — it's entirely client-side. No projects to save (it's a one-shot process tool).

Optional localStorage for:
- Last used fill mode preference
- Last used size preset
- Recent upload count (for analytics)

---

## Engine — `engines/creator-resize-engine.js`

```javascript
(function() {
  'use strict';
  const ResizeEngine = {
    sourceImage: null,
    focalPoint: { x: 0.5, y: 0.5 },
    fillMode: 'blur',
    activeSizes: [],

    init() {},
    loadImage(file) {},
    setFocalPoint(x, y) {},
    autoDetectFocal() {},
    setFillMode(mode) {},
    setSizePreset(preset) {},
    toggleSize(sizeId) {},
    generatePreviews() {},
    renderSize(sizeConfig) {},
    downloadSingle(sizeId) {},
    downloadAll() {},
  };
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorResize = ResizeEngine;
})();
```

---

## Netlify Function

None needed — this tool is 100% client-side. No AI, no database, no server processing.

---

## Performance

- First paint < 800ms (minimal UI)
- Image load < 1s for a 5MB photo
- All 12 previews generated < 2s
- ZIP export (12 files) < 3s
- Total JS < 30KB gzipped (including JSZip)

---

## Dependencies

- **JSZip** (3.7KB gzipped) — for batch ZIP download
- No other external dependencies

---

## Cross-Tool Links
- "Design a graphic first?" → CreatorCanvas
- "Create a thumbnail?" → ThumbnailForge
- "Need a caption for this?" → CaptionCraft
- "Build a carousel?" → CarouselStudio

---

## What This Is NOT

- NOT an image editor — no filters, no text, no stickers
- NOT an AI image generator — it resizes your existing images
- NOT a compression tool — output maintains quality
- One thing: resize and crop intelligently. That's it.
