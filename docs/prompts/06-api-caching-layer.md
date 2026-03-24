# Prompt 06: API Response Caching Layer

## Context

Read these files first:
- `netlify/functions/api-forex.js` (forex rate endpoint)
- `netlify/functions/api-fuel.js` (fuel price endpoint)
- `netlify/functions/api-rates.js` (central bank rates endpoint)
- `netlify/functions/scheduled-fetch-forex-rates.js` (runs every 15 min)
- `netlify/functions/scheduled-fetch-fuel-prices.js` (runs every 6 hours)
- `netlify/functions/scheduled-fetch-central-bank-rates.js` (runs every 12 hours)
- `data/` directory (static JSON data files)
- `netlify.toml` (headers and cache config)

Currently every API call hits Supabase directly. But forex rates only update every 15 minutes, fuel prices every 6 hours, and central bank rates every 12 hours. There's no caching between the user request and the database query.

## Objective

Add a multi-layer caching strategy:

### Layer 1: Netlify CDN Edge Cache (HTTP headers)
Set `Cache-Control` and `CDN-Cache-Control` headers on API responses so Netlify's edge nodes serve cached responses.

```
/api/forex/*    → CDN cache 10 minutes, browser cache 5 minutes
/api/fuel/*     → CDN cache 2 hours, browser cache 1 hour
/api/rates      → CDN cache 6 hours, browser cache 3 hours
/api/countries  → CDN cache 24 hours, browser cache 12 hours
/api/crypto/*   → CDN cache 2 minutes, browser cache 1 minute (volatile)
```

### Layer 2: Netlify Blobs Function-Level Cache
For functions that query Supabase, check Netlify Blobs first. If cached data is fresh (within TTL), return it without hitting Supabase.

### Layer 3: Client-Side Cache
Use `AfroTools.store` (localStorage with TTL) to cache API responses client-side so repeat visits don't even make network requests.

## Constraints

- Do NOT break existing API response formats — same JSON shape, just faster
- Use `@netlify/blobs` which is already a dependency in `package.json`
- Cache keys must include any query parameters that affect the response (e.g., currency pair for forex)
- Add `X-Cache: HIT` or `X-Cache: MISS` response header so you can monitor cache effectiveness
- Stale-while-revalidate pattern: serve stale data immediately, refresh in background
- Cache must be invalidated when scheduled fetch functions run (they should write to Blobs too)
- Use `Vary: Accept-Encoding` header so gzipped and non-gzipped responses are cached separately
- Client-side caching: use `AfroTools.store.set(key, data, ttlSeconds)` pattern already in `storage.js`
- CORS headers must still be present on cached responses

## Implementation Steps

1. Create `netlify/functions/_lib/cache.js` — shared caching utility:
   ```js
   // getOrFetch(key, ttlSeconds, fetchFn) → data
   // Checks Blobs first, falls back to fetchFn, stores result in Blobs
   // Returns { data, fromCache: boolean }
   ```
2. Update each API function to use the cache utility:
   - `api-forex.js` → cache key: `forex:${baseCurrency}:${targetCurrency}`, TTL: 600s
   - `api-fuel.js` → cache key: `fuel:${countryCode}`, TTL: 7200s
   - `api-rates.js` → cache key: `rates:all`, TTL: 21600s
   - `api-countries.js` → cache key: `countries:all`, TTL: 86400s
3. Add CDN cache headers to each function's response:
   ```js
   headers: {
     'Cache-Control': `public, max-age=${browserTTL}, s-maxage=${cdnTTL}, stale-while-revalidate=${staleTTL}`,
     'CDN-Cache-Control': `public, max-age=${cdnTTL}`,
     'X-Cache': fromCache ? 'HIT' : 'MISS',
     'Vary': 'Accept-Encoding'
   }
   ```
4. Update scheduled fetch functions to also write to Blobs:
   - `scheduled-fetch-forex-rates.js` → after fetching new rates, write to Blobs cache
   - `scheduled-fetch-fuel-prices.js` → same
   - `scheduled-fetch-central-bank-rates.js` → same
5. Add `_headers` entries in netlify.toml for static data files:
   ```
   /data/forex/*    Cache-Control: public, max-age=600
   /data/fuel/*     Cache-Control: public, max-age=7200
   /data/rates/*    Cache-Control: public, max-age=21600
   ```
6. Add client-side caching wrapper (small utility function in `assets/js/lib/api-cache.js`):
   ```js
   AfroTools.api = {
     async fetch(url, ttlSeconds) {
       const cached = AfroTools.store.get('api:' + url);
       if (cached) return cached;
       const res = await fetch(url);
       const data = await res.json();
       AfroTools.store.set('api:' + url, data, ttlSeconds);
       return data;
     }
   };
   ```

## Verification

- Call `/api/forex?base=USD&target=NGN` twice within 10 minutes → second call should have `X-Cache: HIT` header
- Check Netlify Blobs dashboard → confirm cached entries exist
- Check DevTools Network → confirm `Cache-Control` headers on API responses
- Simulate slow Supabase (add artificial delay) → confirm cached responses are still fast
- After scheduled fetch runs → confirm Blobs cache is updated (fresh data)
- Check localStorage → confirm `api:` prefixed entries with TTL
