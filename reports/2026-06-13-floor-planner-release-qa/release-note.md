# AfroTools Floor Planner Release QA - 2026-06-13

## Fixed during QA

- Repositioned the desktop furniture drawer so its close control is no longer blocked by the global navbar.
- Increased mobile/tablet touch targets for planner zoom, assumptions, SEO CTA, properties toggle, and drawer close controls.
- Added a page-level main landmark for the planner app.
- Converted the nested builder-pack proof aside into a neutral status panel.
- Improved builder-pack proof text contrast to clear automated accessibility checks.

## Verified

- Laptop and mobile users can scroll to and use the full planner; no fixed export bar covers the canvas.
- African templates load editable rooms and objects.
- Room add, edit, duplicate, delete, and auto-arrange flows work.
- Wall, door, window, furniture, measure, label, erase, fit, reset, and full-screen controls are reachable.
- Estimate, BOQ, PNG, builder pack, copy summary, save, and restore flows pass browser tests.
- Main workflow stays consumer-first; source/verification language is not visible above the planner.
- axe reports 0 violations on the route.
- Lighthouse SEO is 100 on desktop and mobile.

## Remaining note

- Lighthouse mobile performance is still low under simulated throttling. The planner is usable in browser tests, but future performance work should reduce render-blocking and startup script cost.
