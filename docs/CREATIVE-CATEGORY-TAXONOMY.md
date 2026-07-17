# Creative Category Taxonomy

The English creative category now has one shared mapping source:

- `assets/js/components/creative-taxonomy.js`

That file is the source of truth for:

- The 6 standard creative buckets
- Which registry-backed tools belong to each bucket
- Which tools are intentionally featured inside each bucket
- Which product surfaces should be labeled separately from registry-backed tools
- How the Creative hub explains its counts

## Standard Buckets

1. `Content Creation`
2. `Visual & Editing`
3. `Creator Business`
4. `Audience Growth`
5. `Monetization & Commerce`
6. `Creative Products / Platforms`

## Product Surface Rule

- `AfroStream` is a registry-backed creative entry and a product surface.
- `Creator Studio`, `Creator Suite`, and `Streamer University` are ecosystem product surfaces and do not increase the registry-backed tool count.
- The `Creative Products / Platforms` bucket is reserved for registry-backed platform-style entries inside the creative category.

## Count Rule

- The Creative hub should read counts from `assets/js/components/creative-taxonomy.js`, not from repeated hardcoded section totals.
- Current count logic:
  - `46` registry-backed creative tools
  - `41` standard registry tools
  - `5` registry-backed platform-style tools
  - `4` named product surfaces

When updating the category, change the shared taxonomy first and let `/creative/` render from it.
