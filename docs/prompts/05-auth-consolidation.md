# Prompt 05: Auth System Consolidation

## Context

Read these files first:
- `assets/js/afro-auth.js` (localStorage-based auth with PBKDF2 hashing)
- `assets/js/supabase-auth.js` (Supabase-based auth)
- `netlify/functions/auth.js` (server-side auth endpoint)
- `dashboard/index.html` (login/signup UI)
- `supabase/migrations/006-extend-profiles.sql` (profiles schema)
- `assets/js/lib/storage.js` (localStorage utility)

Currently there are TWO auth systems running in parallel:
1. **afro-auth.js** — Custom localStorage auth with client-side PBKDF2 hashing. Stores users in `afro_users_v2` localStorage. Generates fake UUIDs for user IDs. Works offline.
2. **supabase-auth.js** — Supabase's built-in auth. Server-side, JWT-based. Real user management.

This dual system creates bugs: sessions can desync, user IDs don't match between systems, and the localStorage auth is inherently insecure (passwords hashed client-side can be extracted).

## Objective

Consolidate to a SINGLE auth system using Supabase Auth as the source of truth, with a lightweight offline fallback using cached session data (NOT a separate auth system).

### Target Architecture

```
User Action → Supabase Auth (primary) → JWT stored in localStorage
                                       → Profile cached in localStorage for offline display
                                       → All writes go through Supabase when online
                                       → Read-only cached mode when offline
```

### What Changes

1. **Remove** `afro-auth.js` entirely (the custom localStorage auth)
2. **Upgrade** `supabase-auth.js` to be the single auth module at `assets/js/afro-auth.js` (keep the filename for backward compat)
3. **Add** offline session cache: when user logs in, cache their profile in localStorage. When offline, display cached profile in read-only mode. Show "offline" badge.
4. **Migrate** any users stored in `afro_users_v2` localStorage to Supabase on their next login (one-time migration helper)

### New Auth API (drop-in replacement)

```js
window.AfroTools.auth = {
  // Core
  signup(email, password, name, countryCode) → Promise<{ user, session }>
  login(email, password) → Promise<{ user, session }>
  logout() → void
  getUser() → { id, email, name, country, tier, ... } | null
  getSession() → { token, expiresAt } | null
  isLoggedIn() → boolean
  isPro() → boolean

  // State
  onAuthChange(callback) → unsubscribe function

  // Offline
  isOffline() → boolean
  getCachedProfile() → object | null
};
```

## Constraints

- The new `afro-auth.js` must expose the EXACT same method names as the current one so no other files break
- Follow IIFE + `window.AfroTools.auth` pattern
- Supabase client must be initialized ONCE (singleton pattern) — do NOT create multiple clients
- The `afro-auth-change` CustomEvent must still be dispatched on login/logout for backward compat
- Store session in `afro_session_v3` localStorage key (same as current)
- Store cached profile in `afro_profile_cache` localStorage key
- JWT refresh: use Supabase's built-in `onAuthStateChange` to auto-refresh tokens
- Rate limit login attempts client-side: max 5 attempts per minute, show countdown
- Remove all PBKDF2 client-side hashing — Supabase handles password hashing server-side
- The migration helper for `afro_users_v2` must be non-destructive: read old data, prompt user to re-register with Supabase, do NOT auto-migrate passwords

## Implementation Steps

1. Read current `afro-auth.js` completely — note every method, event, and localStorage key used
2. Read `supabase-auth.js` completely — note Supabase client initialization
3. Search the entire codebase for references to `AfroTools.auth`, `afro-auth`, `afro_session`, `afro_users` to find all consumers
4. Create new `assets/js/afro-auth.js`:
   - Single Supabase client initialization (use existing env vars for URL + anon key)
   - Implement all methods from the API above
   - `onAuthStateChange` listener for token refresh
   - Dispatch `afro-auth-change` CustomEvent
   - Offline detection via `navigator.onLine` + `online`/`offline` events
   - Profile caching on successful login
5. Delete old `assets/js/supabase-auth.js` (merged into new afro-auth)
6. Update `netlify/functions/auth.js` if needed to handle any migration logic
7. Update `dashboard/index.html` login/signup forms to use new auth methods
8. Add migration notice: if `afro_users_v2` exists in localStorage, show banner "Please sign in again to upgrade your account"
9. Run `npm run minify`
10. Test all auth flows: signup, login, logout, session persistence, offline mode, token refresh

## Verification

- Sign up with new email → confirm user created in Supabase Auth dashboard
- Login → confirm JWT stored in `afro_session_v3`
- Refresh page → confirm still logged in (session persisted)
- Go offline (DevTools Network → Offline) → confirm cached profile displayed with "offline" badge
- Go back online → confirm session auto-refreshes
- Open calculator → do a calculation → confirm it saves to `calculation_history` with correct Supabase user_id
- Check console for any `AfroTools.auth` errors across the site
- Confirm `afro-auth-change` event fires on login/logout (test with `document.addEventListener('afro-auth-change', e => console.log(e))`)
