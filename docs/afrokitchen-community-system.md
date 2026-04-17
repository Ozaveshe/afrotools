# AfroKitchen Community System

AfroKitchen recipe pages now use a split community architecture:

- `tools/afrokitchen/recipe-page.js`
  Drives the interactive recipe page UI, trust band, richer reviews, cook photo uploads, shopping-list utilities, and related-recipe improvements.
- `netlify/functions/afrokitchen-community.js`
  Handles server-side community actions so the browser does not need direct write access.

## Data flow

- Reviews
  - Stored in Supabase `recipe_reviews`
  - Read and written through the Netlify function
- Cook photos
  - Uploaded as WebP to the public `news-images` storage bucket under `afrokitchen/cooksnaps/...`
  - Metadata stored in Netlify Blobs store `afrokitchen-community`

## Why this shape

- Public recipe review insert policies are not open, so server-side writes are safer and more reliable.
- Cook photos needed a lightweight metadata layer without requiring a new live table.
- The recipe page can now grow community proof over time without breaking the static-first site model.

## Frontend expectations

- Client compresses cook photos to WebP before upload.
- The page should gracefully render with no reviews or photos.
- Utilities like `Copy shopping list` and `Share ingredients` are page-level features in `recipe-page.js`, not engine-level features.
