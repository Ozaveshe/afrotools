/**
 * AfroTools Auth & User Data System
 * Phase 1: localStorage-based (works offline, no server needed)
 * Phase 2a: PBKDF2 password hashing via Web Crypto API (March 2026)
 * Phase 2b: Server-side auth via Netlify Functions + Blobs
 *
 * Usage:
 *   AfroAuth.isLoggedIn()         → boolean
 *   AfroAuth.getUser()            → {email, name, id, country, tier, createdAt}
 *   AfroAuth.signup(email, name, password, country)  → Promise<{ok, user?, error?}>
 *   AfroAuth.login(email, password)                  → Promise<{ok, user?, error?}>
 *   AfroAuth.logout()
 *   AfroAuth.updateProfile({name?, country?})
 *   AfroAuth.isPro()              → boolean
 *   AfroAuth.getSessionToken()    → string|null
 *
 *   AfroData.save(toolId, data)         → saves calculation result
 *   AfroData.load(toolId, limit=10)     → [{data, date}]
 *   AfroData.clearTool(toolId)
 *   AfroData.getFavorites()             → [toolId]
 *   AfroData.toggleFavorite(toolId)     → boolean (new state)
 *   AfroData.getRecentTools()           → [{toolId, name, date}]
 *   AfroData.logToolUse(toolId, name)
 *   AfroData.getUsageStats()            → {topCategory, toolCounts, totalUses}
 */

(function(window) {
  'use strict';

  const AUTH_KEY = 'afro_auth_v2';
  const USERS_KEY = 'afro_users_v2';
  const SESSION_KEY = 'afro_session_v3';
  const DATA_PREFIX = 'afro_data_';
  const FAVS_KEY = 'afro_favs_v2';
  const RECENT_KEY = 'afro_recent_v2';

  const SERVER_AUTH = '/.netlify/functions/auth';

  // ── Legacy simple hash (for migrating old accounts) ──
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
  }

  // ── PBKDF2 password hashing via Web Crypto API ──
  async function secureHash(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return 'p2_' + Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateId() {
    return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setSession(session) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: session } }));
  }

  // ── Try server auth, fall back to local ──
  async function serverRequest(action, body) {
    try {
      const resp = await fetch(SERVER_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body })
      });
      if (!resp.ok) throw new Error('Server error');
      return await resp.json();
    } catch {
      return null; // server unavailable, use localStorage
    }
  }

  // ── AUTH ────────────────────────────────────────────────────────────────
  const AfroAuth = {
    isLoggedIn() {
      try {
        const session = JSON.parse(localStorage.getItem(AUTH_KEY));
        return !!(session && session.id && session.email);
      } catch { return false; }
    },

    getUser() {
      try {
        const session = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (!session || !session.id) return null;
        return {
          id: session.id,
          email: session.email,
          name: session.name,
          country: session.country || '',
          tier: session.tier || 'free',
          createdAt: session.createdAt
        };
      } catch { return null; }
    },

    isPro() {
      const user = this.getUser();
      return user && user.tier === 'pro';
    },

    getSessionToken() {
      try { return localStorage.getItem(SESSION_KEY) || null; } catch { return null; }
    },

    async signup(email, name, password, country) {
      if (!email || !password || password.length < 4) {
        return { ok: false, error: 'Email and password (min 4 chars) required' };
      }
      email = email.trim().toLowerCase();
      name = (name || '').trim() || email.split('@')[0];

      // Try server auth first
      const serverResult = await serverRequest('signup', { email, name, password, country });
      if (serverResult) {
        if (!serverResult.ok) return serverResult;
        if (serverResult.token) localStorage.setItem(SESSION_KEY, serverResult.token);
        const session = { id: serverResult.user.id, email, name, country: country || '', tier: 'free', createdAt: serverResult.user.createdAt };
        setSession(session);
        return { ok: true, user: session };
      }

      // Fallback: localStorage auth with PBKDF2
      const users = getUsers();
      if (users[email]) {
        return { ok: false, error: 'An account with this email already exists. Try logging in.' };
      }

      const passwordHash = await secureHash(password, email);
      const user = {
        id: generateId(),
        email,
        name,
        passwordHash,
        country: country || '',
        tier: 'free',
        createdAt: new Date().toISOString()
      };

      users[email] = user;
      saveUsers(users);

      const session = { id: user.id, email: user.email, name: user.name, country: user.country, tier: 'free', createdAt: user.createdAt };
      setSession(session);

      // Migrate any v1 favorites to v2 global key
      const oldFavs = localStorage.getItem('afro_favs_v1');
      if (oldFavs) {
        try {
          const existing = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]');
          const old = JSON.parse(oldFavs);
          const merged = [...existing];
          old.forEach(function(id) { if (!merged.includes(id)) merged.push(id); });
          localStorage.setItem(FAVS_KEY, JSON.stringify(merged));
        } catch(e) {}
        localStorage.removeItem('afro_favs_v1');
      }

      return { ok: true, user: session };
    },

    async login(email, password) {
      if (!email || !password) return { ok: false, error: 'Email and password required' };
      email = email.trim().toLowerCase();

      // Try server auth first
      const serverResult = await serverRequest('login', { email, password });
      if (serverResult) {
        if (!serverResult.ok) return serverResult;
        if (serverResult.token) localStorage.setItem(SESSION_KEY, serverResult.token);
        const session = { id: serverResult.user.id, email, name: serverResult.user.name, country: serverResult.user.country || '', tier: serverResult.user.tier || 'free', createdAt: serverResult.user.createdAt };
        setSession(session);
        return { ok: true, user: session };
      }

      // Fallback: localStorage auth
      const users = getUsers();
      const user = users[email];
      if (!user) return { ok: false, error: 'No account found. Please sign up first.' };

      // Check password — support both old simple hash and new PBKDF2
      if (user.passwordHash.startsWith('h_')) {
        // Legacy hash — verify with old method then migrate
        if (user.passwordHash !== simpleHash(password)) {
          return { ok: false, error: 'Incorrect password.' };
        }
        // Migrate to PBKDF2
        user.passwordHash = await secureHash(password, email);
        if (!user.tier) user.tier = 'free';
        users[email] = user;
        saveUsers(users);
      } else if (user.passwordHash.startsWith('p2_')) {
        // PBKDF2 hash — verify
        const check = await secureHash(password, email);
        if (user.passwordHash !== check) {
          return { ok: false, error: 'Incorrect password.' };
        }
      } else {
        return { ok: false, error: 'Incorrect password.' };
      }

      const session = { id: user.id, email: user.email, name: user.name, country: user.country, tier: user.tier || 'free', createdAt: user.createdAt };
      setSession(session);
      return { ok: true, user: session };
    },

    logout() {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null } }));
    },

    updateProfile(updates) {
      const session = this.getUser();
      if (!session) return false;

      const users = getUsers();
      const user = users[session.email];
      if (!user) return false;

      if (updates.name) { user.name = updates.name; session.name = updates.name; }
      if (updates.country) { user.country = updates.country; session.country = updates.country; }

      users[session.email] = user;
      saveUsers(users);
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return true;
    }
  };

  // ── DATA ────────────────────────────────────────────────────────────────
  const AfroData = {
    _userId() {
      const user = AfroAuth.getUser();
      return user ? user.id : 'guest';
    },

    save(toolId, data) {
      const key = DATA_PREFIX + this._userId() + '_' + toolId;
      let history = [];
      try { history = JSON.parse(localStorage.getItem(key)) || []; } catch {}

      history.unshift({
        data,
        date: new Date().toISOString(),
        toolId
      });

      if (history.length > 50) history = history.slice(0, 50);
      localStorage.setItem(key, JSON.stringify(history));
    },

    load(toolId, limit) {
      limit = limit || 10;
      const key = DATA_PREFIX + this._userId() + '_' + toolId;
      try {
        const history = JSON.parse(localStorage.getItem(key)) || [];
        return history.slice(0, limit);
      } catch { return []; }
    },

    clearTool(toolId) {
      const key = DATA_PREFIX + this._userId() + '_' + toolId;
      localStorage.removeItem(key);
    },

    getFavorites() {
      // Read from global key (shared with favorites.js widget)
      try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; } catch { return []; }
    },

    toggleFavorite(toolId) {
      const key = FAVS_KEY;
      let favs = this.getFavorites();
      const idx = favs.indexOf(toolId);
      if (idx >= 0) {
        favs.splice(idx, 1);
      } else {
        favs.push(toolId);
        if (favs.length > 30) favs.shift();
      }
      localStorage.setItem(key, JSON.stringify(favs));
      return idx < 0;
    },

    logToolUse(toolId, name) {
      const key = RECENT_KEY + '_' + this._userId();
      let recent = [];
      try { recent = JSON.parse(localStorage.getItem(key)) || []; } catch {}

      recent = recent.filter(r => r.toolId !== toolId);
      recent.unshift({ toolId, name: name || toolId, date: new Date().toISOString() });
      if (recent.length > 20) recent = recent.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(recent));
    },

    getRecentTools() {
      const key = RECENT_KEY + '_' + this._userId();
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
    },

    getAllSaved() {
      const prefix = DATA_PREFIX + this._userId() + '_';
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          const toolId = k.replace(prefix, '');
          try {
            const data = JSON.parse(localStorage.getItem(k));
            if (data && data.length > 0) {
              result[toolId] = { count: data.length, latest: data[0] };
            }
          } catch {}
        }
      }
      return result;
    },

    /**
     * Get usage statistics for dashboard recommendations
     * Returns: { topCategory, toolCounts: {toolId: count}, totalUses, categoryCounts: {cat: count} }
     */
    getUsageStats() {
      const recent = this.getRecentTools();
      const toolCounts = {};
      const categoryCounts = {};
      let totalUses = 0;

      // Count tool usage from recent history
      recent.forEach(r => {
        toolCounts[r.toolId] = (toolCounts[r.toolId] || 0) + 1;
        totalUses++;
      });

      // Map tools to categories using the registry
      if (typeof AFRO_TOOLS !== 'undefined') {
        const toolMap = {};
        AFRO_TOOLS.forEach(t => { toolMap[t.id] = t.category; });

        Object.keys(toolCounts).forEach(toolId => {
          const cat = toolMap[toolId];
          if (cat) {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + toolCounts[toolId];
          }
        });
      }

      // Find top category
      let topCategory = '';
      let topCount = 0;
      Object.keys(categoryCounts).forEach(cat => {
        if (categoryCounts[cat] > topCount) {
          topCategory = cat;
          topCount = categoryCounts[cat];
        }
      });

      return { topCategory, toolCounts, totalUses, categoryCounts };
    }
  };

  // ── AUTH UI INJECTION ───────────────────────────────────────────────────
  function injectAuthUI() {
    const nav = document.querySelector('afro-navbar');
    if (!nav) return;

    const authBar = document.createElement('div');
    authBar.id = 'afro-auth-bar';
    authBar.style.cssText = 'position:fixed;top:0;right:0;z-index:10001;padding:8px 16px;display:flex;align-items:center;gap:8px;';

    function render() {
      const user = AfroAuth.getUser();
      if (user) {
        const proBadge = user.tier === 'pro' ? '<span style="background:linear-gradient(135deg,#F5A623,#e8960e);color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:100px;margin-left:4px;letter-spacing:.06em">PRO</span>' : '';
        authBar.innerHTML = `
          <a href="/dashboard/" style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(0,113,227,.1);border:1px solid rgba(0,113,227,.3);border-radius:6px;font-size:12px;font-weight:700;color:#0071E3;text-decoration:none;font-family:'DM Sans',sans-serif;">
            <span style="width:20px;height:20px;background:#0071E3;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;">${(user.name || 'U')[0].toUpperCase()}</span>
            ${user.name || 'Dashboard'}${proBadge}
          </a>`;
      } else {
        authBar.innerHTML = `
          <a href="/dashboard/" style="padding:6px 14px;background:#0071E3;border-radius:6px;font-size:12px;font-weight:700;color:#fff;text-decoration:none;font-family:'DM Sans',sans-serif;">
            Sign Up Free
          </a>`;
      }
    }

    render();
    document.body.appendChild(authBar);
    window.addEventListener('afro-auth-change', render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAuthUI);
  } else {
    injectAuthUI();
  }

  window.AfroAuth = AfroAuth;
  window.AfroData = AfroData;

})(window);
