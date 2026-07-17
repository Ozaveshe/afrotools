# Prompt 03: Failed Search Query Capture

## Context

Read these files first:
- `assets/js/components/tool-registry.js` (search implementation)
- `netlify/functions/capture-lead.js` (existing capture endpoint)
- `supabase/migrations/` (existing migration files, find next number)
- `assets/js/lib/analytics.js` (GA4 event tracking)

The tool registry has a search feature but does NOT capture what users search for when they find zero results. These failed searches are literally users telling you what tools to build next.

## Objective

Build a system that captures all search queries (especially failed ones) into a Supabase table for product intelligence.

### New Table: `search_queries`

```sql
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'navbar',   -- 'navbar' | 'category-page' | '404-page' | 'all-tools'
  country_code TEXT,                        -- user's detected country if available
  page_url TEXT,                            -- page where search was performed
  session_id TEXT,                          -- anonymous session identifier (not PII)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Function: `capture-search.js`

Lightweight Netlify function that accepts search data and inserts into `search_queries`.

### Client-Side Integration

Debounce search queries (500ms) and send to the capture endpoint. Only send after user stops typing (not on every keystroke).

## Constraints

- Follow IIFE pattern for any client-side JS changes
- The search capture must be fire-and-forget (non-blocking, no error shown to user)
- Use `navigator.sendBeacon()` for the POST to avoid blocking page navigation
- Session ID should be a random UUID stored in `sessionStorage` (NOT localStorage) — dies with tab close, not PII
- Rate limit: max 20 search captures per session to prevent abuse
- RLS: anonymous insert only, select restricted to service role
- Do NOT send searches shorter than 2 characters
- Debounce: 500ms after last keystroke before sending
- The existing search filtering in `tool-registry.js` must NOT be slowed down — the capture happens asynchronously after the filter completes

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-search-queries.sql`
   - Create table with indexes on `query`, `results_count`, `created_at`
   - Add RLS policy: anon can INSERT, only service_role can SELECT
2. Create `netlify/functions/capture-search.js`:
   - Accept POST with `{ query, results_count, source, country_code, page_url, session_id }`
   - Validate: query length 2-200 chars, results_count is integer
   - Insert into `search_queries`
   - Return 200 with empty body (minimal response)
3. Add redirect in `_redirects`: `/api/capture-search /.netlify/functions/capture-search 200`
4. Update `assets/js/components/tool-registry.js`:
   - After search filtering completes, debounce 500ms, then call capture
   - Use `navigator.sendBeacon('/api/capture-search', JSON.stringify(data))`
   - Track session search count in a closure variable, stop at 20
   - Generate session ID via `crypto.randomUUID()` stored in `sessionStorage`
5. Also integrate into the 404 page search bar if one exists (`404.html`)
6. Fire GA4 events `search_query` and `search_no_results` alongside the capture (from Prompt 01)
7. Run `npm run minify`

## Verification

- Open any page with the search bar → type a valid query → check Supabase `search_queries` for the record
- Type a nonsense query like "xyzabc123" → confirm it's captured with `results_count: 0`
- Type quickly (many keystrokes) → confirm only one capture fires (debounce working)
- Open DevTools Network → confirm `sendBeacon` is used (POST to `/api/capture-search`)
- Open 21+ searches → confirm the 21st does NOT send (rate limit)
- Close and reopen tab → confirm session_id changes (sessionStorage, not persistent)
