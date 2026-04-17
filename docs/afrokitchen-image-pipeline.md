# AfroKitchen Image Pipeline

AfroKitchen recipe images now follow one local convention:

- Storage folder: `assets/img/kitchen`
- Format: `.webp`
- Filename pattern: `{recipe-slug}.webp`
- Example: `jollof-rice-ng.webp`
- Public path pattern: `/assets/img/kitchen/{recipe-slug}.webp`

## How The Site Resolves Images

- Recipe cards start with the existing text fallback state.
- The page then checks for `/assets/img/kitchen/{slug}.webp`.
- If the file exists, the fallback is replaced with the real image.
- If the file does not exist yet, the fallback stays in place and the page does not break.

This means you can upload images gradually without needing to patch HTML every time.

## Source Of Truth For Filenames

Use these generated manifests when preparing files:

- `tools/afrokitchen/recipe-image-manifest.csv`
- `tools/afrokitchen/recipe-image-manifest.json`

Both manifests are generated from the live AfroKitchen recipe catalog and include:

- recipe slug
- recipe name
- country
- category
- expected filename
- expected local path

## Practical Guidance

- Save one hero-quality dish image per recipe using the exact slug filename.
- Prefer landscape food photography that survives cropping on cards and large hero surfaces.
- Keep filenames lowercase and hyphenated exactly as shown in the manifest.
- Do not reuse the loose files currently sitting in `assets/img/kitchen` unless you rename them to the manifest convention and convert them to `.webp`.
