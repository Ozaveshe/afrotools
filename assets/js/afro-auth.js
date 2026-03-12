/**
 * AfroTools Auth & User Data System
 * Phase 1: localStorage-based (works offline, no server needed)
 * Phase 2: Upgrade to Netlify Identity for cross-device sync
 *
 * Usage:
 *   AfroAuth.isLoggedIn()         → boolean
 *   AfroAuth.getUser()            → {email, name, id, country, createdAt}
 *   AfroAuth.signup(email, name, password, country)  → {ok, user?, error?}
 *   AfroAuth.login(email, password)                  → {ok, user?, error?}
 *   AfroAuth.logout()
 *   AfroAuth.updateProfile({name?, country?})
 *
 *   AfroData.save(toolId, data)         → saves calculation result
 *   AfroData.load(toolId, limit=10)     → [{data, date}]
 *   AfroData.clearTool(toolId)
 *   AfroData.getFavorites()             → [toolId]
 *   AfroData.toggleFavorite(toolId)     → boolean (new state)
 *   AfroData.getRecentTools()           → [{toolId, name, date}]
 *   AfroData.logToolUse(toolId, name)
 */

(function(window) {
  'use strict';

  const AUTH_KEY = 'afro_auth_v2';
  const USERS_KEY = 'afro_users_v2';
  const DATA_PREFIX = 'afro_data_';
  const FAVS_KEY = 'afro_favs_v2';
  const RECENT_KEY = 'afro_recent_v2';

  // Simple hash for passwords (NOT cryptographically secure — Phase 2 uses Netlify Identity)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
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
        return { id: session.id, email: session.email, name: session.name, country: session.country || '', createdAt: session.createdAt };
      } catch { return null; }
    },

    signup(email, name, password, country) {
      if (!email || !password || password.length < 4) {
        return { ok: false, error: 'Email and password (min 4 chars) required' };
      }
      email = email.trim().toLowerCase();
      name = (name || '').trim() || email.split('@')[0];

      const users = getUsers();
      if (users[email]) {
        return { ok: false, error: 'An account with this email already exists. Try logging in.' };
      }

      const user = {
        id: generateId(),
        email,
        name,
        passwordHash: simpleHash(password),
        country: country || '',
        createdAt: new Date().toISOString()
      };

      users[email] = user;
      saveUsers(users);

      // Auto-login
      const session = { id: user.id, email: user.email, name: user.name, country: user.country, createdAt: user.createdAt };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));

      // Migrate any existing favorites
      const oldFavs = localStorage.getItem('afro_favs_v1');
      if (oldFavs) {
        localStorage.setItem(FAVS_KEY + '_' + user.id, oldFavs);
      }

      window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: session } }));
      return { ok: true, user: session };
    },

    login(email, password) {
      if (!email || !password) return { ok: false, error: 'Email and password required' };
      email = email.trim().toLowerCase();

      const users = getUsers();
      const user = users[email];

      if (!user) return { ok: false, error: 'No account found. Please sign up first.' };
      if (user.passwordHash !== simpleHash(password)) return { ok: false, error: 'Incorrect password.' };

      const session = { id: user.id, email: user.email, name: user.name, country: user.country, createdAt: user.createdAt };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));

      window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: session } }));
      return { ok: true, user: session };
    },

    logout() {
      localStorage.removeItem(AUTH_KEY);
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

      // Keep max 50 entries per tool
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
      const key = FAVS_KEY + '_' + this._userId();
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
    },

    toggleFavorite(toolId) {
      const key = FAVS_KEY + '_' + this._userId();
      let favs = this.getFavorites();
      const idx = favs.indexOf(toolId);
      if (idx >= 0) {
        favs.splice(idx, 1);
      } else {
        favs.push(toolId);
        if (favs.length > 30) favs.shift();
      }
      localStorage.setItem(key, JSON.stringify(favs));
      return idx < 0; // true if newly favorited
    },

    logToolUse(toolId, name) {
      const key = RECENT_KEY + '_' + this._userId();
      let recent = [];
      try { recent = JSON.parse(localStorage.getItem(key)) || []; } catch {}

      // Remove existing entry for this tool
      recent = recent.filter(r => r.toolId !== toolId);
      recent.unshift({ toolId, name: name || toolId, date: new Date().toISOString() });
      if (recent.length > 20) recent = recent.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(recent));
    },

    getRecentTools() {
      const key = RECENT_KEY + '_' + this._userId();
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
    },

    // Get all saved data across tools (for dashboard)
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
    }
  };

  // ── AUTH UI INJECTION ───────────────────────────────────────────────────
  // Adds login/signup button to the page (call on DOMContentLoaded)
  function injectAuthUI() {
    // Find navbar or create auth bar
    const nav = document.querySelector('afro-navbar');
    if (!nav) return;

    const authBar = document.createElement('div');
    authBar.id = 'afro-auth-bar';
    authBar.style.cssText = 'position:fixed;top:0;right:0;z-index:10001;padding:8px 16px;display:flex;align-items:center;gap:8px;';

    function render() {
      const user = AfroAuth.getUser();
      if (user) {
        authBar.innerHTML = `
          <a href="/dashboard/" style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(0,135,81,.1);border:1px solid rgba(0,135,81,.3);border-radius:6px;font-size:12px;font-weight:700;color:#008751;text-decoration:none;font-family:'DM Sans',sans-serif;">
            <span style="width:20px;height:20px;background:#008751;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;">${(user.name || 'U')[0].toUpperCase()}</span>
            ${user.name || 'Dashboard'}
          </a>`;
      } else {
        authBar.innerHTML = `
          <a href="/dashboard/" style="padding:6px 14px;background:#008751;border-radius:6px;font-size:12px;font-weight:700;color:#fff;text-decoration:none;font-family:'DM Sans',sans-serif;">
            Sign Up Free
          </a>`;
      }
    }

    render();
    document.body.appendChild(authBar);
    window.addEventListener('afro-auth-change', render);
  }

  // Auto-inject on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAuthUI);
  } else {
    injectAuthUI();
  }

  // Export
  window.AfroAuth = AfroAuth;
  window.AfroData = AfroData;

})(window);
