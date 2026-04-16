# AfroTools Mobile-First Standards

AfroTools should assume the primary user is on a phone first, often on variable bandwidth, often using touch, and often completing a task quickly.

## What "Mobile-First" Means Here

- Start with the smallest viewport that still needs to work well, then scale up.
- Optimize for touch comfort before desktop polish.
- Prefer shared-source fixes over one-off page patches.
- Treat mobile speed, readability, and task completion as product requirements.

## Shared Baselines

### 1. Inputs must not trigger iOS zoom

- On small screens, text inputs, selects, and textareas must render at `16px` or larger.
- If a control needs to look visually smaller, reduce weight, spacing, or surrounding chrome before reducing font size.

### 2. Touch targets must be comfortable

- Interactive controls should target a minimum hit area of `44px`.
- This includes buttons, chips, nav actions, search rows, modal actions, and high-frequency toggles.

### 3. Respect safe areas and dynamic viewport height

- Overlays, drawers, sticky UI, and full-height sections should account for `safe-area-inset-*`.
- Prefer `100dvh`-aware behavior for mobile overlays and modal sizing.

### 4. Collapse dense layouts early

- Do not wait for ultra-small widths before stacking sidebars, secondary columns, or dense control groups.
- For operational and calculator layouts, move single-column earlier when the main task area starts feeling compressed.

### 5. Avoid mobile scroll traps

- Mobile drawers and overlays should contain their own scroll.
- Background page scrolling should be locked cleanly while mobile navigation is open.

## Preferred Implementation Order

1. `assets/css/design-system.css`
2. shared web components such as `assets/js/components/navbar.js`
3. shared layout CSS such as calculator and tool layout styles
4. page-level CSS only when the shared layer cannot solve it safely

## Review Checklist

- Can the page complete its core task comfortably at `360px` width?
- Are all form controls readable without browser zoom?
- Are the primary actions easy to tap with one thumb?
- Does the layout avoid horizontal overflow?
- Does any drawer, modal, or sticky element respect safe areas?
- Does the page still feel fast and calm on mobile?

## Validation

- Spot-check the homepage, one category page, one tool page, and one calculator page on mobile widths.
- Run the narrowest validation for touched files after shared mobile changes.
- If a mobile fix becomes a repeating pattern, update this doc instead of re-explaining it in each task.
