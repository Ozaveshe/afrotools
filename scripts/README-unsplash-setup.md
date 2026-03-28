# Unsplash Image Setup — AfroKitchen

## What this does
The script `scripts/fetch-unsplash-images.js` queries the Unsplash API once (offline),
builds a JSON mapping of recipe slug → image URL, and saves it to
`tools/afrokitchen/recipe-images.json`. The frontend loads this file — no live API
calls from users' browsers.

---

## Step 1 — Get your Unsplash Access Key

You already have one. It's stored in the script. To use a different key:

1. Go to https://unsplash.com/oauth/applications
2. Open your application
3. Copy the **Access Key** (NOT the Secret Key)

---

## Step 2 — Run the mapper

```powershell
cd C:\Users\Oza\Documents\afrotools
node scripts/fetch-unsplash-images.js --key=amG1djvXSSzKXZho87zJgBItlq-n6T-bLV8cd1hsPLY
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--key=KEY` | — | **Required.** Unsplash access key |
| `--pexels-key=KEY` | — | Optional. Pexels key for fallback (200/hr free) |
| `--resume-from=N` | 0 | Skip first N recipes (resume after pause) |
| `--apply` | off | PATCH `image_url` into Supabase after mapping |
| `--supabase-key=KEY` | anon | Supabase service role key (needed for `--apply`) |
| `--dry-run` | off | Process only first 3 recipes (test mode) |
| `--batch-limit=N` | 45 | Unsplash API calls before auto-pause |

### Test first (dry run)
```powershell
node scripts/fetch-unsplash-images.js --key=amG1djvXSSzKXZho87zJgBItlq-n6T-bLV8cd1hsPLY --dry-run
```

### Full run
```powershell
node scripts/fetch-unsplash-images.js --key=amG1djvXSSzKXZho87zJgBItlq-n6T-bLV8cd1hsPLY
```

The script auto-pauses at 45 API calls and waits 65 minutes, then resumes.
You can also Ctrl-C and restart with `--resume-from=N` where N is shown in the logs.

---

## Step 3 — Review the output

Open `tools/afrokitchen/recipe-images.json`.

For each recipe check:
- Does the image look like the actual dish?
- Is it appetizing?

To fix a bad match:
1. Go to https://unsplash.com and search manually
2. Open the photo, copy the URL from the browser (it looks like `unsplash.com/photos/PHOTO-ID`)
3. Add an entry to `tools/afrokitchen/recipe-images-override.json`:

```json
{
  "_note": "Manual overrides — these win over recipe-images.json",
  "recipes": {
    "your-recipe-slug": {
      "thumb": "https://images.unsplash.com/photo-PHOTO-ID?w=400&fit=crop&q=80&auto=format",
      "full":  "https://images.unsplash.com/photo-PHOTO-ID?w=1080&fit=crop&q=80&auto=format",
      "photographer": "Photographer Name",
      "photographer_url": "https://unsplash.com/@handle?utm_source=afrotools&utm_medium=referral",
      "unsplash_url": "https://unsplash.com/photos/PHOTO-ID?utm_source=afrotools&utm_medium=referral",
      "source": "unsplash",
      "query_used": "manual",
      "match_quality": "matched"
    }
  }
}
```

---

## Step 4 — Apply to Supabase (optional but recommended)

Once you're happy with the images, update the Supabase `image_url` field directly so
the recipe detail page hero also gets the full-resolution photo:

```powershell
node scripts/fetch-unsplash-images.js --key=amG1djvXSSzKXZho87zJgBItlq-n6T-bLV8cd1hsPLY --apply --supabase-key=YOUR_SERVICE_ROLE_KEY
```

> The service role key is in your Supabase dashboard (zpclagtgczsygrgztlts) → Settings → API → service_role.

---

## Step 5 — Deploy

```powershell
git add -A
git commit -m "feat: add Unsplash food photography to AfroKitchen"
git push
```

Verify live at https://afrotools.com/tools/afrokitchen/

---

## Rate limits

| API     | Free tier   | Script limit |
|---------|-------------|--------------|
| Unsplash | 50 req/hr  | 45/batch (auto-pause) |
| Pexels  | 200 req/hr  | used only as fallback |

Apply for Unsplash Production (5,000/hr) at https://unsplash.com/oauth/applications
if you need to re-run frequently.

---

## Unsplash attribution requirement

Unsplash requires visible photographer credit when using their API.
AfroKitchen shows:
- On recipe cards: small overlay credit in the bottom-right of the image
- On recipe pages: "Photo by [Name] on Unsplash" below the hero

Both credits link to the photographer's Unsplash profile with UTM parameters.
