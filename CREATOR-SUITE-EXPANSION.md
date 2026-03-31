# Creator Suite Expansion — 13 New Tools
## Master Build Prompts (Senior Product Developer)

> **Workflow**: Build in order 1→13. Each prompt is self-contained.
> **Pattern**: Each tool = `index.html` (SEO landing) + `app.html` (workspace) + `style.css`
> **Stack**: Plain HTML/CSS/JS only. No frameworks. Supabase for persistence. Claude API via `/.netlify/functions/ai-advisor`
> **Brand**: Blue #007AFF base. Each tool gets a unique accent color.
> **Fonts**: `Instrument Serif` (headings) + `DM Sans` (body)
> **Components**: `<afro-navbar>`, `<afro-footer>` web components

---

## Tool Matrix

| # | Tool Name | Slug | CSS Prefix | Accent Color | Category |
|---|-----------|------|------------|--------------|----------|
| 1 | CreatorStock — Stock Media Browser | creator-stock | csk- | Rose #F43F5E | Media Assets |
| 2 | CreatorAnalytics — Performance Tracker | creator-analytics | cay- | Emerald #10B981 | Analytics |
| 3 | CreatorRecord — Screen Recorder | creator-record | crd- | Sky #38BDF8 | Video |
| 4 | CreatorPolish — Writing & Grammar Tool | creator-polish | cpl- | Violet #8B5CF6 | Writing |
| 5 | CreatorClip — Video Clipper & Captioner | creator-clip | ccl- | Red #EF4444 | Video |
| 6 | CreatorVoice — Audio Recorder & Editor | creator-voice | cvo- | Teal #14B8A6 | Audio |
| 7 | CreatorMail — Newsletter Builder | creator-mail | cml- | Indigo #6366F1 | Email |
| 8 | CreatorClub — Membership & Community | creator-club | ccb- | Amber #F59E0B | Monetization |
| 9 | CreatorCourse — Course & Product Builder | creator-course | cco- | Lime #84CC16 | Education |
| 10 | CreatorResearch — AI Research Assistant | creator-research | crh- | Slate #64748B | Research |
| 11 | CreatorTeam — Collaboration Workspace | creator-team | ctm- | Pink #EC4899 | Collaboration |
| 12 | CreatorBrand — Brand Kit Manager | creator-brand | cbk- | Gold #EAB308 | Branding |
| 13 | CreatorSchedule — Social Media Scheduler | creator-schedule | csc- | Orange #F97316 | Publishing |

---

## PROMPT 1 — CreatorStock (Stock Media Browser)

```
You are building "CreatorStock — Free Stock Media Browser" for AfroTools Creator Suite.

PATH: /tools/creator-stock/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: csk-
ACCENT: Rose #F43F5E, hover #E11D48, light rgba(244,63,94,0.08), border rgba(244,63,94,0.25)

## WHAT IT DOES
A unified stock media search engine that searches Unsplash, Pexels, and Pixabay APIs simultaneously from one interface. African-first — surfaces African photographers, African landscapes, African people, and African culture prominently.

## FEATURES (app.html)
1. **Unified Search Bar** — Single search input, searches all 3 APIs in parallel. Debounced (300ms). Shows result count per source.
2. **Source Tabs** — "All", "Unsplash", "Pexels", "Pixabay" filter tabs. Default: All (interleaved results).
3. **Media Type Toggle** — Photos | Videos | Music (Pixabay audio). Default: Photos.
4. **Masonry Grid** — Responsive masonry layout (CSS columns). Lazy-loaded images with blur-up placeholders. Infinite scroll (load 30 at a time).
5. **Photo Detail Modal** — Click to expand. Shows: full preview, photographer name + link, resolution, license info, download button (multiple sizes), "Copy attribution" button, color palette extraction (5 dominant colors shown as swatches).
6. **Collections** — Users can create named collections (saved to localStorage). Drag or click "+" to add to collection. Collections panel slides out from right. Export collection as ZIP (client-side using JSZip).
7. **African Creators Spotlight** — Curated section at top before search: "African Photographers to Follow" with 10 featured photographers from Unsplash/Pexels who shoot African content. Rotating featured set.
8. **Color Search** — Click a color swatch or use color picker to search by dominant color.
9. **Orientation Filter** — Landscape | Portrait | Square.
10. **Safe Search Toggle** — On by default.
11. **Recent Searches** — Last 10 searches saved in localStorage, shown as chips below search bar.
12. **Download Counter** — Track total downloads per session, shown in topbar.

## API STRATEGY
- APIs are called via Netlify Functions (proxy) to protect API keys: `/.netlify/functions/stock-search`
- The Netlify function accepts: `{ query, source, type, color, orientation, page, per_page }`
- Returns normalized results: `{ id, title, url, thumbnail, photographer, photographerUrl, source, width, height, downloadUrl, colors }`
- Rate limiting: 50 searches/hour per IP

## LANDING PAGE (index.html)
- Full SEO: title, description, og tags, canonical, hreflang, WebApplication schema, FAQPage schema (6 FAQs)
- Hero: "Find the Perfect Shot. Free, Forever." / "Search millions of free photos, videos, and music from Unsplash, Pexels, and Pixabay — all in one place. African creators and content featured first."
- Stats: "3 Sources" | "Millions of Assets" | "100% Free"
- Features grid (6 cards): Unified Search, African Spotlight, Collections, Color Search, One-Click Download, Zero Copyright Worry
- How it works: 1) Search → 2) Preview → 3) Download or Save to Collection
- FAQ section (6 questions about licensing, API limits, African focus, video support, collections, attribution)
- CTA: "Browse Free Media →"
- Breadcrumb: AfroTools / Creator Studio / CreatorStock

## STYLE (style.css)
- Follow exact pattern from creator-captions/style.css but with rose accent
- Landing: dark gradient hero with rose radial accents
- App: dark studio aesthetic, masonry grid, modal overlay with backdrop blur
- Cards: rounded corners, hover scale 1.02, photographer overlay at bottom
- Mobile-first responsive. Grid: 1 col mobile, 2 col tablet, 3-4 col desktop

## TECHNICAL
- No frameworks. Vanilla JS with ES6 modules.
- JSZip loaded from CDN for collection export
- Images lazy-loaded with IntersectionObserver
- Masonry via CSS `columns` property (no JS library)
- localStorage for collections and recent searches
- Copy attribution uses Clipboard API
```

---

## PROMPT 2 — CreatorAnalytics (Content Performance Tracker)

```
You are building "CreatorAnalytics — Content Performance Tracker" for AfroTools Creator Suite.

PATH: /tools/creator-analytics/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cay-
ACCENT: Emerald #10B981, hover #059669, light rgba(16,185,129,0.08), border rgba(16,185,129,0.25)

## WHAT IT DOES
A manual content performance tracker where creators log their posts and track metrics over time. Shows growth trends, best-performing content, optimal posting times, and platform comparisons. No API connections needed — creators paste their stats.

## FEATURES (app.html)
1. **Dashboard View** — Overview cards: Total Posts Tracked, Avg Engagement Rate, Best Platform, Top Post. Line chart showing follower growth over time (per platform). Bar chart showing engagement by content type.
2. **Log a Post** — Form: Platform (IG/X/TikTok/YT/LI/FB), Post Type (Reel/Carousel/Story/Static/Thread/Short/Long-form), Date Posted, URL (optional), Impressions, Reach, Likes, Comments, Shares, Saves, Followers Gained, Notes. Quick-log mode: just paste numbers comma-separated.
3. **Posts Table** — Sortable, filterable table of all logged posts. Columns: Date, Platform, Type, Engagement Rate (auto-calculated), Impressions, Top Metric. Click row to edit. Bulk delete.
4. **Analytics Views**:
   - **Engagement Rate Trends** — Line chart over time, per platform. Shows industry avg benchmarks (African creator benchmarks).
   - **Best Time to Post** — Heatmap grid (day × hour) showing avg engagement. Based on logged post times.
   - **Content Type Comparison** — Which format performs best per platform (Reels vs Carousels vs Static etc.)
   - **Platform Comparison** — Side-by-side metrics across platforms. Radar chart.
   - **Growth Velocity** — Followers gained per week/month trend line.
5. **Goals & Milestones** — Set monthly goals (e.g., "Reach 10K followers on IG", "Average 5% engagement"). Progress bar tracking. Milestone celebrations (confetti animation when hit).
6. **Weekly Report** — Auto-generated summary: "This week you posted 12 times. Your best post was [X] with 8.2% engagement. TikTok outperformed IG by 3x. Recommendation: Post more Reels on Tuesday evenings."
7. **Export** — CSV export of all data. PDF report export (basic).
8. **Data Storage** — All data in localStorage (no account needed) + optional Supabase sync for logged-in users.

## CHARTS
- Use Chart.js loaded from CDN. No other chart libraries.
- Charts: Line (growth), Bar (comparison), Radar (platform), Heatmap (custom CSS grid, not chart.js).
- Dark theme charts with emerald accent lines.

## LANDING PAGE (index.html)
- Hero: "Know Your Numbers. Grow Your Numbers." / "Track content performance across every platform. See what works, what doesn't, and what to do next — no spreadsheet required."
- Stats: "6 Platforms" | "Auto-Calculated" | "Free Forever"
- Features grid: Dashboard, Post Logger, Engagement Trends, Best Time Heatmap, Content Battle, Growth Goals
- How it works: 1) Log your post metrics → 2) Watch patterns emerge → 3) Double down on what works
- FAQ: 6 questions about data privacy (local-first), supported platforms, engagement calculation formula, data export, benchmarks source, account requirement
- Schema: WebApplication + FAQPage
- CTA: "Start Tracking →"

## STYLE
- Same pattern as creator-captions/style.css with emerald accent
- Dashboard: card grid with subtle shadows, chart containers with dark backgrounds
- Heatmap: CSS Grid with color-coded cells (emerald gradient from light to dark)
- Mobile: cards stack, charts scroll horizontally
```

---

## PROMPT 3 — CreatorRecord (Screen Recorder)

```
You are building "CreatorRecord — Browser Screen Recorder" for AfroTools Creator Suite.

PATH: /tools/creator-record/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: crd-
ACCENT: Sky #38BDF8, hover #0EA5E9, light rgba(56,189,248,0.08), border rgba(56,189,248,0.25)

## WHAT IT DOES
A browser-based screen recorder using the Screen Capture API (getDisplayMedia). Record screen, webcam, or both. No downloads, no extensions, no signup. Records locally — video never leaves the browser.

## FEATURES (app.html)
1. **Recording Modes**:
   - Screen Only — full screen, window, or tab capture
   - Webcam Only — front camera with mirror toggle
   - Screen + Webcam — PiP webcam overlay on screen recording (draggable, resizable webcam bubble, 4 corner positions)
   - Audio Only — microphone recording (voice memo mode)
2. **Recording Controls** — Big red record button (pulse animation). Pause/Resume. Stop. Timer showing elapsed time (MM:SS). Recording indicator dot.
3. **Audio Options** — System audio (tab audio), Microphone, Both, None. Volume meter showing live mic levels. Noise suppression toggle (if supported).
4. **Webcam Settings** — Camera selector (if multiple), Mirror toggle, Shape (circle/rectangle/rounded), Background blur (if supported via CanvasRenderingContext2D or ML).
5. **Countdown Timer** — 3-2-1 countdown before recording starts. Optional: no countdown.
6. **Annotations (during recording)** — Floating toolbar: pen draw (red), highlighter (yellow), arrow, text, eraser. Canvas overlay on top of preview. Clear all.
7. **Preview & Trim** — After recording: full video preview player. Trim handles at start/end to clip unwanted parts. Show duration and file size.
8. **Export Options** — Download as WebM (default). Download as MP4 (if MediaRecorder supports mp4). Quality selector: 1080p/720p/480p. Filename auto-generated: "recording-YYYY-MM-DD-HHMMSS".
9. **Recording History** — Last 5 recordings stored in IndexedDB (with thumbnail). Click to re-preview or re-download. Delete individual recordings.
10. **Keyboard Shortcuts** — R: Record/Stop, P: Pause, Esc: Cancel. Shown in floating hint.

## TECHNICAL
- Uses `navigator.mediaDevices.getDisplayMedia()` for screen
- Uses `navigator.mediaDevices.getUserMedia()` for webcam/mic
- MediaRecorder API for recording (WebM/VP8 or VP9)
- Canvas compositing for screen+webcam overlay
- IndexedDB for recording history (via simple wrapper, no library)
- No server calls — 100% client-side
- Feature detection: show clear error if browser doesn't support Screen Capture API (Safari limitations noted)

## LANDING PAGE (index.html)
- Hero: "Record Your Screen. No App Required." / "Professional screen recording right in your browser. Record tutorials, demos, reactions — with webcam overlay, annotations, and instant download. Zero installs."
- Stats: "4 Modes" | "100% Private" | "No Install"
- Features: Screen + Webcam PiP, Live Annotations, Trim & Export, Recording History, Keyboard Shortcuts, Browser-Native
- How it works: 1) Pick a mode → 2) Hit record → 3) Download your video
- FAQ: browser support, video format, max recording length (limited by disk), privacy (nothing uploaded), webcam shapes, annotation tools
- CTA: "Start Recording →"
```

---

## PROMPT 4 — CreatorPolish (Writing & Grammar Tool)

```
You are building "CreatorPolish — AI Writing & Grammar Tool" for AfroTools Creator Suite.

PATH: /tools/creator-polish/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cpl-
ACCENT: Violet #8B5CF6, hover #7C3AED, light rgba(139,92,246,0.08), border rgba(139,92,246,0.25)

## WHAT IT DOES
An AI-powered writing assistant that checks grammar, improves clarity, adjusts tone, and localizes content for African audiences. Understands African English variants (Nigerian English, South African English, Kenyan English, etc.), pidgin, and code-switching.

## FEATURES (app.html)
1. **Split Editor** — Left: input textarea (rich text, paste-friendly). Right: corrected/improved output with inline diff highlighting (green = added, red = removed, yellow = changed).
2. **Mode Tabs**:
   - **Fix Grammar** — Correct spelling, grammar, punctuation. Preserves voice.
   - **Improve Clarity** — Simplify sentences, remove jargon, improve readability.
   - **Change Tone** — Rewrite in selected tone: Professional, Casual, Bold, Academic, Friendly, Persuasive.
   - **Shorten** — Cut word count by ~30% while keeping meaning.
   - **Expand** — Add detail, examples, transitions. Target word count input.
   - **Localize** — Adapt for specific African English variants or translate casual ↔ formal.
3. **English Variant Selector** — Standard English, Nigerian English, South African English, Kenyan English, Ghanaian English, Pan-African Neutral. Affects grammar rules (e.g., "licence" vs "license", "programme" vs "program").
4. **Readability Score** — Live score panel: Flesch-Kincaid grade, word count, sentence count, avg sentence length, reading time. Updates on input.
5. **Inline Suggestions** — Underlined words/phrases with hover tooltip showing suggestion + explanation. Click to accept. "Accept All" button.
6. **History** — Last 10 polish sessions saved. Click to reload.
7. **Copy & Export** — Copy polished text. Export as .txt or .docx (simple XML generation).
8. **Character/Word Counter** — Live count with limits for platforms (280 for X, 2200 for IG, etc. — selectable).

## AI INTEGRATION
- Calls `/.netlify/functions/ai-advisor` with tool key "creator-polish"
- Sends: { text, mode, tone, variant, targetWordCount }
- Returns: { corrected, changes: [{ original, replacement, reason, position }], readabilityScore }
- Rate limit: 15 polish operations per day (free)

## LANDING PAGE (index.html)
- Hero: "Write Better. Sound Like You." / "AI writing assistant that respects African English. Fix grammar, sharpen clarity, switch tone — without losing your authentic voice. Understands Nigerian English, SA English, and more."
- Stats: "6 Modes" | "5 English Variants" | "AI Powered"
- Features: Grammar Fix, Tone Shift, African English Variants, Readability Score, Inline Diff, Platform Limits
- FAQ: How is this different from Grammarly? (African English awareness), Is my text stored? (No, processed and discarded), supported languages, daily limits, how inline suggestions work, export options
- CTA: "Polish Your Writing →"
```

---

## PROMPT 5 — CreatorClip (Video Clipper & Captioner)

```
You are building "CreatorClip — Video Clipper & Auto-Captioner" for AfroTools Creator Suite.

PATH: /tools/creator-clip/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: ccl-
ACCENT: Red #EF4444, hover #DC2626, light rgba(239,68,68,0.08), border rgba(239,68,68,0.25)

## WHAT IT DOES
Upload a video, trim it, add auto-generated captions, resize for any platform, and export. The browser-based CapCut alternative for African creators. All processing happens client-side using Web APIs.

## FEATURES (app.html)
1. **Video Upload** — Drag-and-drop or file picker. Supports MP4, WebM, MOV. Max 500MB. Shows upload progress. Thumbnail preview.
2. **Timeline Editor** — Visual timeline strip with frame thumbnails. Drag handles to set trim start/end. Playhead scrubber. Current time / total time display. Keyboard: J/K/L for shuttle, I/O for in/out points.
3. **Video Player** — Large preview player. Play/Pause, Skip ±5s, Volume, Fullscreen. Shows captions overlay in real-time.
4. **Auto Captions** — Uses browser's SpeechRecognition API (Web Speech API) or sends audio chunk to `/.netlify/functions/transcribe` (Whisper API via proxy). Outputs: timestamped caption segments. Editable caption list — click any caption to edit text, adjust timing.
5. **Caption Styles** — 8 preset styles: Classic White, Bold Yellow (MrBeast style), Karaoke (word-by-word highlight), Minimal Lowercase, Neon Glow, Typewriter, Gradient, Custom. Font selector, size, color, background, position (top/center/bottom).
6. **Platform Resize** — One-click resize: 16:9 (YouTube), 9:16 (Reels/TikTok/Shorts), 1:1 (IG Feed), 4:5 (IG Portrait). Shows safe zones. Drag to reposition video within frame. Background fill: blur, solid color, or gradient.
7. **Text Overlays** — Add static text overlays at any point in the timeline. Customizable: font, size, color, position, animation (fade in, pop, slide).
8. **Export** — Render using OffscreenCanvas + MediaRecorder. Quality: High (1080p) / Medium (720p) / Low (480p). Format: MP4 (if supported) or WebM. Progress bar during render. Download when done.
9. **Project Save** — Save current project to IndexedDB. Resume later. List saved projects.

## TECHNICAL
- Video playback: HTML5 <video> element
- Timeline: custom-built with Canvas API for frame thumbnails (extract via video.currentTime + canvas.drawImage at intervals)
- Captions: WebVTT format internally. Rendered as positioned divs over video.
- Resize/crop: CSS transform on video container for preview, Canvas compositing for export.
- Export pipeline: Draw video frame + captions + overlays to OffscreenCanvas each frame, feed to MediaRecorder.
- Heavy operations in Web Workers where possible.
- No ffmpeg.wasm (too large) — use native browser APIs only.

## LANDING PAGE (index.html)
- Hero: "Clip It. Caption It. Post It." / "Trim videos, add auto-captions with 8 styles, resize for any platform — all in your browser. No app downloads, no watermarks, no subscriptions."
- Stats: "8 Caption Styles" | "4 Platform Sizes" | "100% Free"
- Features: Trim & Cut, Auto-Captions, MrBeast-Style Text, Platform Resize, Text Overlays, Project Save
- FAQ: max video size, caption accuracy, supported formats, is it really free, export quality, browser requirements
- CTA: "Edit Your Video →"
```

---

## PROMPT 6 — CreatorVoice (Audio Recorder & Editor)

```
You are building "CreatorVoice — Audio Recorder & Editor" for AfroTools Creator Suite.

PATH: /tools/creator-voice/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cvo-
ACCENT: Teal #14B8A6, hover #0D9488, light rgba(20,184,166,0.08), border rgba(20,184,166,0.25)

## WHAT IT DOES
Browser-based audio recording and editing for podcasters, voiceover artists, and musicians. Record, trim, enhance, and export — no Audacity needed. All processing via Web Audio API.

## FEATURES (app.html)
1. **Recording Studio** — Big record button with live waveform visualization (real-time, using AnalyserNode + Canvas). Mic selector dropdown. Live level meter (green/yellow/red). Recording timer. Pause/Resume.
2. **Waveform Editor** — After recording or file upload: scrollable waveform display (drawn on Canvas from AudioBuffer). Click to place playhead. Click-drag to select region. Zoom in/out (horizontal). Keyboard: Space=play/pause, Delete=cut selection.
3. **Editing Tools**:
   - **Trim** — Cut start/end by dragging handles
   - **Cut** — Remove selected region
   - **Split** — Split at playhead into separate clips
   - **Fade In/Out** — Apply to selection or full track
   - **Normalize** — Auto-level volume to target loudness
   - **Noise Reduction (basic)** — Simple noise gate + spectral subtraction (Web Audio filters)
   - **Speed/Pitch** — Playback speed: 0.5x–2x. Basic pitch shift.
4. **Multi-Track (basic)** — Up to 3 tracks. Record voiceover on Track 1, add background music (upload) on Track 2, sound effects on Track 3. Volume + pan per track. Simple timeline alignment.
5. **Audio Upload** — Import MP3, WAV, OGG, M4A files for editing.
6. **Sound Library** — 20 built-in free sound effects: transitions, whooshes, dings, applause, crickets, etc. (small WebM clips embedded or lazy-loaded from CDN).
7. **Export** — WAV (lossless), MP3 (via lamejs CDN), OGG. Quality selector. Metadata: title, artist tags. Filename template.
8. **Project Save** — Save to IndexedDB. Resume later.

## TECHNICAL
- Web Audio API: AudioContext, MediaStreamSource, AnalyserNode, GainNode, BiquadFilterNode
- MediaRecorder for capturing
- AudioBuffer manipulation for editing (copy/paste channel data)
- Canvas for waveform rendering (requestAnimationFrame for live, static draw for editor)
- lamejs (CDN) for MP3 encoding
- IndexedDB for project persistence
- All client-side, no server processing

## LANDING PAGE (index.html)
- Hero: "Your Studio. In Your Browser." / "Record, edit, and export podcast-quality audio without installing anything. Multi-track mixing, noise reduction, waveform editing — the Audacity alternative that lives in your browser."
- Stats: "3 Tracks" | "4 Export Formats" | "Zero Install"
- Features: Live Waveform, Multi-Track, Noise Reduction, Sound Library, Trim & Split, One-Click Export
- FAQ: audio quality, max recording length, multi-track explained, noise reduction effectiveness, browser support, project save
- CTA: "Open Your Studio →"
```

---

## PROMPT 7 — CreatorMail (Newsletter Builder)

```
You are building "CreatorMail — Newsletter Builder for Creators" for AfroTools Creator Suite.

PATH: /tools/creator-mail/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cml-
ACCENT: Indigo #6366F1, hover #4F46E5, light rgba(99,102,241,0.08), border rgba(99,102,241,0.25)

## WHAT IT DOES
A visual newsletter/email builder with drag-and-drop blocks, African-themed templates, and one-click export to HTML that works in any email platform (Mailchimp, ConvertKit, Brevo, or raw Gmail). NOT an email sender — a design and export tool.

## FEATURES (app.html)
1. **Template Gallery** — 12 starter templates: Creator Weekly Update, Product Launch, Event Invite, Course Announcement, Personal Story, Digest/Roundup, Sale/Promo, Welcome Email, Milestone Celebration, Behind-the-Scenes, Collaboration Pitch, Sponsorship Report. African-inspired designs with warm color palettes.
2. **Drag-and-Drop Editor** — Block-based: Header, Text, Image, Button, Divider, Quote, Social Links, Two-Column, Three-Column, Video Thumbnail, Countdown, Footer. Drag to reorder. Click block to edit inline. Block settings panel on right.
3. **Block Customization** — Per block: background color, padding, text color, font size, alignment, border radius, link URL. Text blocks: basic rich text (bold, italic, link, list).
4. **Global Styles Panel** — Email-wide: background color, content width (600px default), font family (web-safe fonts only for email), primary color, border radius, header logo upload.
5. **Responsive Preview** — Toggle: Desktop (600px) / Mobile (375px) preview. Side by side or toggle.
6. **Dark Mode Preview** — Simulate email dark mode rendering (inverted colors).
7. **Personalization Tags** — Insert `{{first_name}}`, `{{subscriber_count}}`, `{{date}}` merge tags. Shown with placeholder highlight.
8. **AI Content Assist** — Button per text block: "Write this for me" → sends context to AI advisor, returns newsletter-style copy. Uses `/.netlify/functions/ai-advisor` with tool key "creator-mail".
9. **Export Options**:
   - **Copy HTML** — Inline-styled HTML ready to paste into any email platform. All CSS inlined (email clients don't support <style> tags reliably). Tables-based layout for max compatibility.
   - **Download HTML file** — .html file download
   - **Copy Plain Text** — Stripped text version for plain-text fallback
10. **Saved Newsletters** — Save designs to localStorage. Load, duplicate, delete.
11. **Spam Score Check** — Basic heuristic: checks for spam trigger words, all-caps percentage, image-to-text ratio, link count. Shows score 1-10 with tips.

## TECHNICAL
- Drag and drop: HTML5 Drag & Drop API (dragstart, dragover, drop)
- Email HTML output: <table> based layout (email standard), all CSS inlined using JS
- No external CSS in output — everything is inline styles
- Images: base64 or user-provided URLs (warn about hosted images)
- Templates stored as JSON block arrays, rendered to HTML on the fly
- localStorage for saved newsletters

## LANDING PAGE (index.html)
- Hero: "Design Newsletters That Get Opened." / "Drag-and-drop newsletter builder with African-inspired templates. Export email-ready HTML for Mailchimp, ConvertKit, or any platform. No coding. No subscription."
- Stats: "12 Templates" | "Drag & Drop" | "Email-Ready HTML"
- Features: Template Gallery, Block Editor, Responsive Preview, Dark Mode Test, AI Copywriting, Spam Score
- FAQ: Is this an email sender? (No — it's a builder), email client compatibility, images handling, merge tags, export formats, template customization
- CTA: "Build Your Newsletter →"
```

---

## PROMPT 8 — CreatorClub (Membership & Community)

```
You are building "CreatorClub — Membership & Community Platform" for AfroTools Creator Suite.

PATH: /tools/creator-club/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: ccb-
ACCENT: Amber #F59E0B, hover #D97706, light rgba(245,158,11,0.08), border rgba(245,158,11,0.25)

## WHAT IT DOES
A tool for creators to set up and manage paid memberships, exclusive content tiers, and community engagement. Creates a shareable membership page that accepts payments via Paystack, Flutterwave, or M-Pesa. Supabase-backed for persistence.

## FEATURES (app.html)
1. **Membership Page Builder** — WYSIWYG builder for the public-facing membership page. Sections: Hero (creator photo, name, tagline), About, Tier Cards, Benefits List, FAQ, Testimonials. Live preview.
2. **Tier Manager** — Create up to 5 tiers. Per tier: Name, Price (multi-currency: NGN, KES, ZAR, GHS, USD), Billing cycle (monthly/yearly/one-time), Benefits list, Tier color, Member limit (optional). Drag to reorder.
3. **Content Vault** — Upload exclusive content per tier: PDF, video links, audio files, text posts, download links. Content locked behind tier. Drip scheduling: release content on specific dates.
4. **Member Management** — Dashboard: total members, revenue this month, tier breakdown (pie chart), growth trend (line chart). Member list: name, email, tier, joined date, status (active/churned). Export CSV.
5. **Payment Integration Setup** — Configure: Paystack public key, Flutterwave public key, or M-Pesa till number. Payment verification via Netlify Functions. Webhook URL generator for payment confirmation.
6. **Community Feed (basic)** — Simple post feed per tier. Creator posts text/image updates. Members see posts for their tier and below. No comments (v1) — link to WhatsApp/Telegram for discussion.
7. **Public Page** — Generated URL: `/club/{creator-slug}`. Clean membership landing page. Tier comparison. Payment buttons. Mobile-optimized.
8. **Analytics** — MRR (Monthly Recurring Revenue), churn rate, tier conversion, top referrers, revenue by currency.
9. **Welcome Email Template** — Customize the auto-welcome message sent when someone joins. Merge tags: `{{name}}`, `{{tier}}`, `{{benefits}}`.

## SUPABASE TABLES
- `creator_clubs` — id, user_id, slug, name, tagline, about, hero_image, theme, created_at
- `club_tiers` — id, club_id, name, price, currency, billing_cycle, benefits (jsonb), sort_order, member_limit
- `club_content` — id, club_id, tier_id, title, type, content_url, drip_date, created_at
- `club_members` — id, club_id, tier_id, email, name, payment_ref, status, joined_at
- RLS: creators see only their own club data

## LANDING PAGE (index.html)
- Hero: "Turn Followers Into Members." / "Create paid membership tiers, gate exclusive content, and accept payments in Naira, Shillings, Rand, or Cedis. Your community, your rules, your revenue."
- Stats: "5 Tiers" | "4 Currencies" | "3 Payment Methods"
- Features: Tier Builder, Content Vault, Payment Integration, Member Dashboard, Community Feed, Analytics
- FAQ: payment processing fees, supported currencies, how members access content, can I offer free tiers, content types supported, is there a platform fee
- CTA: "Build Your Club →"
```

---

## PROMPT 9 — CreatorCourse (Course & Digital Product Builder)

```
You are building "CreatorCourse — Course & Digital Product Builder" for AfroTools Creator Suite.

PATH: /tools/creator-course/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cco-
ACCENT: Lime #84CC16, hover #65A30D, light rgba(132,204,22,0.08), border rgba(132,204,22,0.25)

## WHAT IT DOES
Build and sell online courses and digital products. Create structured courses with modules and lessons, set pricing, and share a sales page. Supabase-backed. Teachable/Gumroad alternative for African creators.

## FEATURES (app.html)
1. **Course Builder** — Create course: Title, Description, Cover Image, Category, Price, Currency. Add Modules → Add Lessons per module. Drag to reorder. Lesson types: Video (YouTube/Vimeo embed URL), Text (rich text editor), PDF (upload link), Quiz (multiple choice), Assignment (text prompt).
2. **Sales Page Builder** — Auto-generated from course data. Sections: Hero (title, subtitle, cover), Instructor Bio, What You'll Learn (bullet points), Curriculum (expandable modules, lesson count), Pricing, Testimonials (manual add), FAQ, CTA button. Customizable: primary color, instructor photo, guarantee badge.
3. **Student Dashboard** — Students see: enrolled courses, progress bar per course, continue where you left off, certificate download.
4. **Progress Tracking** — Per student: lesson completion checkmarks, quiz scores, assignment submissions (text upload). Stored in Supabase.
5. **Certificates** — Auto-generated completion certificate. Template: student name, course name, date, instructor name, course hours. PDF export via Canvas API. Customizable: border style, instructor signature upload.
6. **Quiz Engine** — Multiple choice questions (4 options). Pass mark configurable. Show correct answers after submission. Score tracking.
7. **Pricing & Payment** — Set price in NGN/KES/ZAR/GHS/USD. Connect Paystack or Flutterwave. Free courses supported. Discount codes (percentage or fixed amount).
8. **Analytics** — Enrolled students, completion rate, revenue, quiz pass rates, avg time to complete. Charts.
9. **Drip Content** — Schedule lessons to unlock over time (Day 1, Day 7, Day 14, etc.).

## SUPABASE TABLES
- `creator_courses` — id, user_id, title, description, cover_url, price, currency, category, status (draft/published), slug, created_at
- `course_modules` — id, course_id, title, sort_order
- `course_lessons` — id, module_id, title, type, content, sort_order, drip_day
- `course_enrollments` — id, course_id, student_email, student_name, payment_ref, enrolled_at
- `lesson_progress` — id, enrollment_id, lesson_id, completed, completed_at
- `course_quizzes` — id, lesson_id, questions (jsonb), pass_mark
- `quiz_attempts` — id, enrollment_id, quiz_id, score, passed, attempted_at

## LANDING PAGE (index.html)
- Hero: "Teach What You Know. Get Paid." / "Build online courses with video, text, quizzes, and certificates. Set your price in local currency, share your sales page, and start earning. Africa's creator-first course platform."
- Stats: "5 Lesson Types" | "Auto Certificates" | "Multi-Currency"
- Features: Course Builder, Sales Page, Student Progress, Certificates, Quiz Engine, Drip Content
- FAQ: supported content types, payment processing, student experience, certificates, free courses, analytics
- CTA: "Create Your Course →"
```

---

## PROMPT 10 — CreatorResearch (AI Research Assistant)

```
You are building "CreatorResearch — AI Research Assistant" for AfroTools Creator Suite.

PATH: /tools/creator-research/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: crh-
ACCENT: Slate #64748B, hover #475569, light rgba(100,116,139,0.08), border rgba(100,116,139,0.25)

## WHAT IT DOES
An AI-powered research assistant that helps creators research topics, find talking points, get statistics, and build content briefs — with African context baked in. Like Perplexity but optimized for content creation.

## FEATURES (app.html)
1. **Research Chat** — Chat-style interface. User asks a research question, AI returns structured research with talking points, statistics, key facts, and suggested angles. African context: "How is this relevant to African audiences?" section in every response.
2. **Output Modes**:
   - **Talking Points** — 5-10 bullet points ready for a video script or podcast
   - **Content Brief** — Title suggestions, outline, hook ideas, key stats, CTA suggestions
   - **Thread/Carousel Script** — Numbered points ready for an X thread or IG carousel
   - **Deep Dive** — Long-form research document with sections and sub-points
   - **Fact Check** — Verify a claim, return sources and verdict (True/Partially True/False/Unverifiable)
3. **Topic Library** — Save researched topics. Tag them. Search saved research. Export as text/PDF.
4. **Trending Topics** — AI-suggested trending topics for African creators. Categories: Tech, Culture, Business, Entertainment, Politics, Lifestyle. Refreshed via AI with current context.
5. **Source Suggestions** — For each research output, suggest where to find original sources: specific publications, databases, reports. (AI can't browse the web, but can suggest where to look.)
6. **Content Calendar Integration** — "Send to CreatorCalendar" button — formats research as a content idea and saves to localStorage for CreatorCalendar to pick up.
7. **Conversation History** — Last 20 research conversations saved. Searchable.

## AI INTEGRATION
- Calls `/.netlify/functions/ai-advisor` with tool key "creator-research"
- System prompt emphasizes: factual accuracy, African context, content-creator-friendly format, cite knowledge limitations
- Sends: { question, mode, context }
- Returns: { content, talkingPoints, suggestedSources, africanAngle }

## LANDING PAGE (index.html)
- Hero: "Research Smarter. Create Faster." / "AI research assistant that gives you talking points, content briefs, and fact-checks — with African context built in. Stop Googling for hours. Start creating in minutes."
- Stats: "5 Output Modes" | "African Context" | "AI Powered"
- Features: Research Chat, Talking Points, Content Briefs, Fact Check, Topic Library, Trending Topics
- FAQ: accuracy, African context explained, daily limits, data sources, saved research, difference from ChatGPT
- CTA: "Start Researching →"
```

---

## PROMPT 11 — CreatorTeam (Collaboration Workspace)

```
You are building "CreatorTeam — Collaboration Workspace" for AfroTools Creator Suite.

PATH: /tools/creator-team/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: ctm-
ACCENT: Pink #EC4899, hover #DB2777, light rgba(236,72,153,0.08), border rgba(236,72,153,0.25)

## WHAT IT DOES
A lightweight collaboration workspace for creator teams (2-10 people). Share content briefs, review drafts, assign tasks, and manage approvals. Built for the African creator workflow: WhatsApp-friendly sharing, async-first.

## FEATURES (app.html)
1. **Team Setup** — Create a team workspace with a name and invite link. Team members join via link (email/name only, stored in Supabase). Roles: Owner, Editor, Viewer. Max 10 members free.
2. **Content Board (Kanban)** — Columns: Ideas → In Progress → Review → Approved → Published. Drag cards between columns. Each card: title, assignee, due date, platform, notes, attachments (links), status. Click card for detail view.
3. **Content Briefs** — Create structured briefs: Topic, Platform, Target Audience, Key Points, Tone, References, Deadline. Assign to team member. Brief template library.
4. **Review & Approval** — Submit content for review. Reviewer can: Approve ✅, Request Changes 🔄, or Comment 💬. Version history: see previous versions. Diff view between versions.
5. **Asset Library** — Shared links to images, videos, documents. Tag by project/campaign. Search. Not file hosting — stores URLs/Google Drive links.
6. **Activity Feed** — Real-time feed of team actions: "Ade moved 'Podcast Ep 12' to Review", "Funmi approved 'IG Reel script'". Uses Supabase Realtime for live updates.
7. **WhatsApp Share** — Every card has a "Share via WhatsApp" button that formats the brief/task as a clean WhatsApp message with link back to the board.
8. **Calendar View** — See all due dates on a monthly calendar. Filter by assignee.

## SUPABASE TABLES
- `creator_teams` — id, name, owner_id, invite_code, created_at
- `team_members` — id, team_id, user_id, email, name, role, joined_at
- `team_cards` — id, team_id, title, description, assignee_id, column, platform, due_date, sort_order, created_by, created_at, updated_at
- `card_comments` — id, card_id, user_id, content, created_at
- `card_versions` — id, card_id, content, submitted_by, status (pending/approved/changes_requested), reviewed_by, reviewed_at
- Enable Supabase Realtime on team_cards and card_comments

## LANDING PAGE (index.html)
- Hero: "Create Together. Ship Faster." / "Kanban board, content briefs, review workflows, and WhatsApp sharing — built for African creator teams. Stop losing ideas in group chats."
- Stats: "10 Members Free" | "Real-Time Sync" | "WhatsApp Ready"
- Features: Kanban Board, Content Briefs, Review & Approval, Asset Library, Activity Feed, Calendar View
- FAQ: team size limits, real-time collaboration, WhatsApp integration, data privacy, free vs paid, offline access
- CTA: "Start Your Team →"
```

---

## PROMPT 12 — CreatorBrand (Brand Kit Manager)

```
You are building "CreatorBrand — Brand Kit Manager" for AfroTools Creator Suite.

PATH: /tools/creator-brand/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: cbk-
ACCENT: Gold #EAB308, hover #CA8A04, light rgba(234,179,8,0.08), border rgba(234,179,8,0.25)

## WHAT IT DOES
A central place to store and manage brand identity: logos, colors, fonts, tone of voice, brand guidelines. Auto-generates a shareable brand guide page. Other Creator Suite tools can pull from this kit for consistency.

## FEATURES (app.html)
1. **Brand Profile** — Brand name, tagline, mission statement (one paragraph), brand story (longer). Industry, target audience.
2. **Logo Library** — Upload up to 5 logo variations: Primary, Secondary, Icon/Mark, Light Background, Dark Background. Shows each on both light and dark preview backgrounds. Download individual or all as ZIP.
3. **Color Palette** — Define brand colors: Primary, Secondary, Accent, Background, Text. Color picker + hex input. Auto-generates: tints (10/20/30%), shades, complementary, and contrast ratios (WCAG AA/AAA check). Export as CSS variables, Tailwind config, or Figma-ready JSON.
4. **Typography** — Select up to 3 fonts from Google Fonts: Heading, Body, Accent. Preview with brand text. Shows font pairing score. Export as Google Fonts link tag.
5. **Tone of Voice** — Define brand voice: 4 slider scales: Formal ↔ Casual, Serious ↔ Playful, Professional ↔ Friendly, Reserved ↔ Bold. "We are" / "We are not" lists. AI generates sample social media posts in your brand voice (via ai-advisor).
6. **Brand Guidelines Page** — Auto-generated from all inputs. Clean, professional layout. Sections: Logo Usage, Color Palette, Typography, Tone of Voice, Do's & Don'ts. Shareable URL or PDF export.
7. **Brand Assets Export** — Download complete brand kit as ZIP: logos, color swatches (PNG), font links, guidelines PDF.
8. **Integration API** — Stores brand kit in localStorage + Supabase. Other Creator Suite tools (CreatorCanvas, CreatorMail, CreatorKit) can read brand colors/fonts from localStorage key `afro_brand_kit`.

## SUPABASE TABLES
- `brand_kits` — id, user_id, name, tagline, mission, story, industry, audience, colors (jsonb), fonts (jsonb), voice (jsonb), logos (jsonb array of URLs), created_at, updated_at

## LANDING PAGE (index.html)
- Hero: "Your Brand. One Source of Truth." / "Store your logos, colors, fonts, and tone of voice in one place. Auto-generate brand guidelines. Keep every post, email, and collab perfectly on-brand."
- Stats: "5 Logo Slots" | "WCAG Checked" | "Auto Brand Guide"
- Features: Logo Library, Color System, Typography Pairing, Tone of Voice, Brand Guide Generator, Cross-Tool Sync
- FAQ: how cross-tool sync works, supported logo formats, color export formats, Google Fonts integration, can I share my brand guide, storage limits
- CTA: "Build Your Brand Kit →"
```

---

## PROMPT 13 — CreatorSchedule (Social Media Scheduler)

```
You are building "CreatorSchedule — Social Media Scheduler & Calendar" for AfroTools Creator Suite.

PATH: /tools/creator-schedule/
FILES: index.html (SEO landing), app.html (workspace), style.css
CSS PREFIX: csc-
ACCENT: Orange #F97316, hover #EA580C, light rgba(249,115,22,0.08), border rgba(249,115,22,0.25)

## WHAT IT DOES
A content scheduling tool that lets creators plan, preview, and queue posts for all platforms. Does NOT auto-publish (no API connections to social platforms) — instead: shows exactly what to post when, with one-tap copy and "Open [Platform]" deep links. Smart queue, optimal time suggestions, and calendar view.

## FEATURES (app.html)
1. **Post Composer** — Create a post: Text content (with character count per platform), Image(s) (upload or URL, up to 4), Platform tags (multi-select: IG, X, TikTok, YT, LI, FB, Threads), Scheduled date/time, Status: Draft / Queued / Posted.
2. **Platform Preview** — Real-time preview of how the post will look on each selected platform. Accurate character limits, image crop previews, hashtag rendering. Toggle between platforms.
3. **Calendar View** — Monthly calendar with post thumbnails on each day. Color-coded by platform. Click day to see/add posts. Drag to reschedule.
4. **Queue View** — List of upcoming posts sorted by date. Quick actions: Edit, Copy Text, Open Platform (deep link to platform's post creation page), Mark as Posted, Delete.
5. **Smart Queue** — AI suggests optimal posting times based on platform best practices and user's past performance data (from CreatorAnalytics localStorage, if available). "Auto-fill my week" button: suggests posting schedule for the week.
6. **Content Templates** — Save reusable post templates: "Motivational Monday", "Product Spotlight", "Behind the Scenes", etc. Pre-filled text with `{{placeholder}}` tags.
7. **Bulk Composer** — Schedule multiple posts at once. CSV upload: date, time, platform, text, image_url. Or paste multiple posts separated by "---".
8. **Post-to-Platform Flow** — When it's time to post: notification-style reminder at top of page. Click "Post Now" → copies text to clipboard + opens platform in new tab. User pastes and posts manually. Mark as posted.
9. **Analytics Summary** — Posts this week/month, platform distribution (pie chart), posting consistency streak, busiest day.
10. **Recurring Posts** — Set a post to repeat: daily, weekly, biweekly, monthly. "Evergreen" content that auto-queues.
11. **Cross-Tool Integration** — "Import from CreatorMind/CaptionCraft" — pull recent generated content from localStorage.

## DATA STORAGE
- localStorage for all post data (no account needed)
- Optional Supabase sync for logged-in users
- Data structure: posts array with { id, text, images, platforms, scheduledAt, status, template, recurring }

## LANDING PAGE (index.html)
- Hero: "Plan It. Queue It. Post It." / "Visual content calendar with platform previews, smart scheduling, and one-tap posting. Plan your entire week in 15 minutes. Copy, paste, done."
- Stats: "7 Platforms" | "Smart Queue" | "Calendar View"
- Features: Post Composer, Platform Preview, Calendar, Smart Queue, Bulk Import, Recurring Posts
- FAQ: does it auto-post (no, and why), supported platforms, data storage, smart queue algorithm, bulk upload format, cross-tool integration
- CTA: "Plan Your Content →"
```

---

## BUILD ORDER & WORKFLOW

### Phase 1 — Quick Wins (Browser-native, no server)
1. **CreatorStock** — Stock media browser (API proxy needed, but straightforward)
2. **CreatorRecord** — Screen recorder (100% client-side)
3. **CreatorVoice** — Audio recorder (100% client-side)

### Phase 2 — AI-Powered (Need ai-advisor updates)
4. **CreatorPolish** — Writing & grammar (AI calls)
5. **CreatorResearch** — Research assistant (AI calls)

### Phase 3 — Content Workflow
6. **CreatorClip** — Video clipper (complex but client-side)
7. **CreatorSchedule** — Scheduler & calendar
8. **CreatorAnalytics** — Performance tracker

### Phase 4 — Business & Monetization (Supabase heavy)
9. **CreatorMail** — Newsletter builder
10. **CreatorBrand** — Brand kit manager
11. **CreatorClub** — Membership platform
12. **CreatorCourse** — Course builder

### Phase 5 — Team
13. **CreatorTeam** — Collaboration workspace

### Per-Tool Checklist
- [ ] Create directory `/tools/creator-{slug}/`
- [ ] Build `style.css` with unique prefix and accent color
- [ ] Build `index.html` — SEO landing with schema, FAQ, og tags, breadcrumbs
- [ ] Build `app.html` — Full workspace
- [ ] Add tool to navbar.js under "Creator Studio" category
- [ ] Add tool card to `/creative/index.html` category page
- [ ] Add TOOL_CONTEXT entry in `netlify/functions/ai-advisor.js` (if AI-powered)
- [ ] Create Netlify Function (if server-side needed)
- [ ] Add Supabase tables + RLS (if data-backed)
- [ ] Test mobile responsiveness
- [ ] Test all interactive features
- [ ] Cross-tool nav strip registration
