/**
 * AfroTools Auth — Supabase Edition
 *
 * Replaces localStorage auth with Supabase Auth + PostgreSQL.
 * Google OAuth, email/password, session management, auth modal.
 *
 * Provides backward-compatible APIs:
 *   AfroAuth.isLoggedIn(), .getUser(), .login(), .signup(), .logout(), etc.
 *   AfroData.save(), .load(), .getFavorites(), .toggleFavorite(), etc.
 *   AfroAuthModal.open(), .close()
 */
(function (window, document) {
  'use strict';

  if (window._afroSupaAuthLoaded) return;
  window._afroSupaAuthLoaded = true;

  var SUPABASE_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_rI-EzUY_FO0mYkESNf6G5g_n2_IEOYG';

  var _sb = null;       // Supabase client
  var _user = null;      // auth.users row
  var _profile = null;   // public.profiles row
  var _ready = false;
  var _readyCbs = [];
  var _modalInjected = false;
  var _isSignupMode = false;

  // ───────────────────────────────────────────────
  // 1. Load Supabase SDK from CDN
  // ───────────────────────────────────────────────
  function loadSDK() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Supabase SDK failed to load')); };
      document.head.appendChild(s);
    });
  }

  // ───────────────────────────────────────────────
  // 2. Boot
  // ───────────────────────────────────────────────
  async function boot() {
    try {
      await loadSDK();
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      // Auth state listener
      _sb.auth.onAuthStateChange(async function (event, session) {
        if (session && session.user) {
          _user = session.user;
          await fetchProfile();
        } else {
          _user = null;
          _profile = null;
        }
        refreshNavbar();
        fire('afro-auth-change', { user: _user, profile: _profile, event: event });
      });

      // Check existing session on load
      var res = await _sb.auth.getSession();
      if (res.data.session && res.data.session.user) {
        _user = res.data.session.user;
        await fetchProfile();
      }
      refreshNavbar();
    } catch (err) {
      console.warn('[AfroAuth] Boot error:', err);
    }

    _ready = true;
    _readyCbs.forEach(function (fn) { fn(); });
    _readyCbs = [];
  }

  async function fetchProfile() {
    if (!_user || !_sb) return;
    try {
      var r = await _sb.from('profiles').select('*').eq('id', _user.id).single();
      if (!r.error && r.data) _profile = r.data;
    } catch (e) { /* silent */ }
  }

  function fire(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  // ───────────────────────────────────────────────
  // 3. Navbar auth state
  // ───────────────────────────────────────────────
  function refreshNavbar() {
    var navbar = document.querySelector('afro-navbar');
    if (!navbar || !navbar.shadowRoot) return;

    var loginBtn = navbar.shadowRoot.querySelector('.btn-login');
    var mobLogin = navbar.shadowRoot.querySelector('.mob-login');

    if (_user) {
      var name = (_profile && _profile.name) || (_user.user_metadata && _user.user_metadata.full_name) || 'Account';
      var avatar = (_profile && _profile.avatar_url) || (_user.user_metadata && (_user.user_metadata.avatar_url || _user.user_metadata.picture)) || '';
      var first = name.split(' ')[0];

      if (loginBtn) {
        loginBtn.href = '/dashboard/';
        if (avatar) {
          loginBtn.innerHTML = '<img src="' + avatar + '" style="width:26px;height:26px;border-radius:50%;object-fit:cover;" alt=""> ' + first;
          loginBtn.style.display = 'inline-flex';
          loginBtn.style.alignItems = 'center';
          loginBtn.style.gap = '8px';
        } else {
          loginBtn.textContent = first;
        }
      }
      if (mobLogin) {
        mobLogin.href = '/dashboard/';
        mobLogin.textContent = first;
      }
    } else {
      if (loginBtn) {
        loginBtn.textContent = 'Sign in';
        loginBtn.removeAttribute('style');
      }
      if (mobLogin) {
        mobLogin.textContent = 'Sign In';
      }
    }
  }

  // Intercept navbar sign-in clicks to open modal
  function hookNavbarClicks() {
    var navbar = document.querySelector('afro-navbar');
    if (!navbar || !navbar.shadowRoot) return;

    var loginBtn = navbar.shadowRoot.querySelector('.btn-login');
    var mobLogin = navbar.shadowRoot.querySelector('.mob-login');

    function intercept(e) {
      if (!_user) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      }
    }

    if (loginBtn && !loginBtn._afroHooked) {
      loginBtn.addEventListener('click', intercept);
      loginBtn._afroHooked = true;
    }
    if (mobLogin && !mobLogin._afroHooked) {
      mobLogin.addEventListener('click', intercept);
      mobLogin._afroHooked = true;
    }
  }

  // Poll for navbar (Web Component may render after this script)
  var _navPoll = setInterval(function () {
    var nb = document.querySelector('afro-navbar');
    if (nb && nb.shadowRoot && nb.shadowRoot.querySelector('.btn-login')) {
      clearInterval(_navPoll);
      hookNavbarClicks();
      refreshNavbar();
    }
  }, 150);
  setTimeout(function () { clearInterval(_navPoll); }, 8000);

  // ───────────────────────────────────────────────
  // 4. Auth Modal
  // ───────────────────────────────────────────────
  function injectModal() {
    if (_modalInjected) return;
    _modalInjected = true;

    // CSS
    if (!document.getElementById('afro-auth-css')) {
      var link = document.createElement('link');
      link.id = 'afro-auth-css';
      link.rel = 'stylesheet';
      link.href = '/assets/css/auth-modal.css';
      document.head.appendChild(link);
    }

    // HTML
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="afro-auth-overlay" id="afroAuthOverlay">' +
        '<div class="afro-auth-card">' +
          '<button class="afro-auth-close" id="afroAuthClose" aria-label="Close">&times;</button>' +

          '<div class="afro-auth-brand">' +
            '<img src="/assets/img/logo-dark.svg" alt="AfroTools" onerror="this.style.display=\'none\'">' +
            '<h2 class="afro-auth-title" id="afroAuthTitle">Welcome back</h2>' +
            '<p class="afro-auth-subtitle" id="afroAuthSubtitle">Sign in to save your tools and calculations</p>' +
          '</div>' +

          '<div class="afro-auth-msg" id="afroAuthMsg"></div>' +

          '<div class="afro-auth-social">' +
            '<button class="afro-auth-social-btn" id="afroGoogleBtn" type="button">' +
              '<svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
              'Continue with Google' +
            '</button>' +
          '</div>' +

          '<div class="afro-auth-divider">or continue with email</div>' +

          '<form class="afro-auth-form" id="afroAuthForm">' +
            '<div class="afro-auth-field afro-signup-field" style="display:none">' +
              '<label for="afroAuthName">Full name</label>' +
              '<input type="text" id="afroAuthName" placeholder="Your full name" autocomplete="name">' +
            '</div>' +

            '<div class="afro-auth-field">' +
              '<label for="afroAuthEmail">Email address</label>' +
              '<input type="email" id="afroAuthEmail" placeholder="you@example.com" required autocomplete="email">' +
            '</div>' +

            '<div class="afro-auth-field">' +
              '<label for="afroAuthPassword">Password</label>' +
              '<input type="password" id="afroAuthPassword" placeholder="Min 6 characters" required minlength="6" autocomplete="current-password">' +
            '</div>' +

            '<div class="afro-auth-field afro-signup-field" style="display:none">' +
              '<label for="afroAuthCountry">Country</label>' +
              '<select id="afroAuthCountry">' +
                '<option value="">Select your country</option>' +
                '<option value="Nigeria">Nigeria</option>' +
                '<option value="Kenya">Kenya</option>' +
                '<option value="Ghana">Ghana</option>' +
                '<option value="South Africa">South Africa</option>' +
                '<option value="Egypt">Egypt</option>' +
                '<option value="Tanzania">Tanzania</option>' +
                '<option value="Uganda">Uganda</option>' +
                '<option value="Rwanda">Rwanda</option>' +
                '<option value="Ethiopia">Ethiopia</option>' +
                '<option value="Other">Other</option>' +
              '</select>' +
            '</div>' +

            '<button type="submit" class="afro-auth-submit" id="afroAuthSubmit">Sign in</button>' +
          '</form>' +

          '<div class="afro-auth-footer" id="afroAuthFooter">' +
            'Don\'t have an account? <button id="afroAuthToggle">Sign up</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap.firstElementChild);
    bindModalEvents();
  }

  function bindModalEvents() {
    var overlay = document.getElementById('afroAuthOverlay');
    var closeBtn = document.getElementById('afroAuthClose');
    var googleBtn = document.getElementById('afroGoogleBtn');
    var form = document.getElementById('afroAuthForm');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    // Google OAuth
    googleBtn.addEventListener('click', async function () {
      if (!_sb) { showMsg('Auth service loading... try again.', 'error'); return; }
      googleBtn.disabled = true;
      googleBtn.style.opacity = '0.6';
      try {
        var result = await _sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/dashboard/' }
        });
        if (result.error) showMsg(result.error.message, 'error');
      } catch (err) {
        showMsg(err.message || 'Google sign-in failed', 'error');
      }
      googleBtn.disabled = false;
      googleBtn.style.opacity = '';
    });

    // Email form submit
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!_sb) { showMsg('Auth service loading... try again.', 'error'); return; }

      var email = document.getElementById('afroAuthEmail').value.trim();
      var password = document.getElementById('afroAuthPassword').value;
      var submitBtn = document.getElementById('afroAuthSubmit');

      submitBtn.disabled = true;
      hideMsg();

      try {
        if (_isSignupMode) {
          var name = document.getElementById('afroAuthName').value.trim();
          var country = document.getElementById('afroAuthCountry').value;
          if (!name) { showMsg('Please enter your name.', 'error'); submitBtn.disabled = false; return; }

          var res = await _sb.auth.signUp({
            email: email,
            password: password,
            options: {
              data: { full_name: name, country: country },
              emailRedirectTo: window.location.origin + '/dashboard/'
            }
          });

          if (res.error) throw res.error;

          // Supabase may require email confirmation
          if (res.data.user && !res.data.session) {
            showMsg('Check your email for a confirmation link!', 'success');
            submitBtn.disabled = false;
            return;
          }

          closeModal();
          window.location.href = '/dashboard/';
        } else {
          var res2 = await _sb.auth.signInWithPassword({ email: email, password: password });
          if (res2.error) throw res2.error;
          closeModal();
          // Refresh page if on dashboard, otherwise stay
          if (window.location.pathname.indexOf('/dashboard') === 0) {
            window.location.reload();
          }
        }
      } catch (err) {
        showMsg(err.message || 'Authentication failed', 'error');
      }

      submitBtn.disabled = false;
    });

    // Toggle sign-in / sign-up
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'afroAuthToggle') {
        _isSignupMode = !_isSignupMode;
        setModalMode(_isSignupMode);
      }
    });
  }

  function setModalMode(signup) {
    _isSignupMode = signup;
    var title = document.getElementById('afroAuthTitle');
    var subtitle = document.getElementById('afroAuthSubtitle');
    var submit = document.getElementById('afroAuthSubmit');
    var footer = document.getElementById('afroAuthFooter');
    var fields = document.querySelectorAll('.afro-signup-field');

    if (signup) {
      title.textContent = 'Create your account';
      subtitle.textContent = 'Join thousands of professionals across Africa';
      submit.textContent = 'Create account';
      footer.innerHTML = 'Already have an account? <button id="afroAuthToggle">Sign in</button>';
      fields.forEach(function (f) { f.style.display = ''; });
    } else {
      title.textContent = 'Welcome back';
      subtitle.textContent = 'Sign in to save your tools and calculations';
      submit.textContent = 'Sign in';
      footer.innerHTML = 'Don\'t have an account? <button id="afroAuthToggle">Sign up</button>';
      fields.forEach(function (f) { f.style.display = 'none'; });
    }
    hideMsg();
  }

  function openModal(mode) {
    injectModal();
    setModalMode(mode === 'signup');
    var overlay = document.getElementById('afroAuthOverlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Focus first input
      setTimeout(function () {
        var el = document.getElementById(_isSignupMode ? 'afroAuthName' : 'afroAuthEmail');
        if (el) el.focus();
      }, 300);
    }
  }

  function closeModal() {
    var overlay = document.getElementById('afroAuthOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      hideMsg();
    }
  }

  function showMsg(msg, type) {
    var el = document.getElementById('afroAuthMsg');
    if (el) { el.textContent = msg; el.className = 'afro-auth-msg show ' + (type || 'error'); }
  }

  function hideMsg() {
    var el = document.getElementById('afroAuthMsg');
    if (el) { el.textContent = ''; el.className = 'afro-auth-msg'; }
  }

  // ───────────────────────────────────────────────
  // 5. Public API — AfroAuth (backward compatible)
  // ───────────────────────────────────────────────
  window.AfroAuth = {
    isLoggedIn: function () { return !!_user; },

    getUser: function () {
      if (!_user) return null;
      var meta = _user.user_metadata || {};
      return {
        id: _user.id,
        email: _user.email,
        name: (_profile && _profile.name) || meta.full_name || '',
        country: (_profile && _profile.country) || meta.country || '',
        avatar_url: (_profile && _profile.avatar_url) || meta.avatar_url || meta.picture || '',
        tier: (_profile && _profile.tier) || 'free',
        createdAt: _user.created_at
      };
    },

    isPro: function () { return _profile && _profile.tier === 'pro'; },

    getSessionToken: function () { return _user ? 'active' : null; },

    async login(email, password) {
      if (!_sb) return { ok: false, error: 'Auth not ready' };
      var res = await _sb.auth.signInWithPassword({ email: email, password: password });
      if (res.error) return { ok: false, error: res.error.message };
      _user = res.data.user;
      await fetchProfile();
      return { ok: true, user: this.getUser() };
    },

    async signup(email, name, password, country) {
      if (!_sb) return { ok: false, error: 'Auth not ready' };
      var res = await _sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name, country: country } }
      });
      if (res.error) return { ok: false, error: res.error.message };
      if (res.data.user) { _user = res.data.user; await fetchProfile(); }
      return { ok: true, user: this.getUser() };
    },

    async logout() {
      if (_sb) await _sb.auth.signOut();
      _user = null;
      _profile = null;
      refreshNavbar();
    },

    async updateProfile(updates) {
      if (!_user || !_sb) return { ok: false, error: 'Not logged in' };
      var res = await _sb.from('profiles').update(updates).eq('id', _user.id);
      if (res.error) return { ok: false, error: res.error.message };
      await fetchProfile();
      return { ok: true, user: this.getUser() };
    },

    openModal: function (mode) { openModal(mode); },
    closeModal: function () { closeModal(); },

    onReady: function (fn) {
      if (_ready) fn();
      else _readyCbs.push(fn);
    },

    getSupabase: function () { return _sb; }
  };

  // Alias
  window.AfroAuthModal = { open: openModal, close: closeModal };

  // ───────────────────────────────────────────────
  // 6. Public API — AfroData (localStorage + Supabase sync)
  // ───────────────────────────────────────────────
  window.AfroData = {
    save: function (toolId, data) {
      var key = 'afro_data_' + toolId;
      try {
        var existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift({ data: data, date: new Date().toISOString() });
        if (existing.length > 50) existing.length = 50;
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (e) { /* silent */ }

      // Sync to Supabase
      if (_user && _sb) {
        _sb.from('saved_calculations').insert({
          user_id: _user.id, tool_id: toolId, data: data
        }).then(function () {});
      }
    },

    load: function (toolId, limit) {
      limit = limit || 10;
      try {
        return JSON.parse(localStorage.getItem('afro_data_' + toolId) || '[]').slice(0, limit);
      } catch (e) { return []; }
    },

    clearTool: function (toolId) {
      localStorage.removeItem('afro_data_' + toolId);
      if (_user && _sb) {
        _sb.from('saved_calculations').delete().eq('user_id', _user.id).eq('tool_id', toolId).then(function () {});
      }
    },

    getFavorites: function () {
      try { return JSON.parse(localStorage.getItem('afro_favs_v2') || '[]'); }
      catch (e) { return []; }
    },

    toggleFavorite: function (toolId) {
      var favs = this.getFavorites();
      var idx = favs.indexOf(toolId);
      if (idx >= 0) {
        favs.splice(idx, 1);
        if (_user && _sb) _sb.from('favorites').delete().eq('user_id', _user.id).eq('tool_id', toolId).then(function () {});
      } else {
        favs.unshift(toolId);
        if (favs.length > 30) favs.length = 30;
        if (_user && _sb) _sb.from('favorites').upsert({ user_id: _user.id, tool_id: toolId }).then(function () {});
      }
      localStorage.setItem('afro_favs_v2', JSON.stringify(favs));
      return idx < 0; // true if now favorited
    },

    getRecentTools: function () {
      try { return JSON.parse(localStorage.getItem('afro_recent_v2') || '[]'); }
      catch (e) { return []; }
    },

    logToolUse: function (toolId, name) {
      try {
        var recent = JSON.parse(localStorage.getItem('afro_recent_v2') || '[]');
        recent = recent.filter(function (r) { return r.toolId !== toolId; });
        recent.unshift({ toolId: toolId, name: name, date: new Date().toISOString() });
        if (recent.length > 20) recent.length = 20;
        localStorage.setItem('afro_recent_v2', JSON.stringify(recent));
      } catch (e) { /* silent */ }
    },

    getUsageStats: function () {
      try {
        var recent = this.getRecentTools();
        var counts = {};
        recent.forEach(function (r) { counts[r.toolId] = (counts[r.toolId] || 0) + 1; });
        return { toolCounts: counts, totalUses: recent.length, topCategory: null };
      } catch (e) { return { toolCounts: {}, totalUses: 0, topCategory: null }; }
    },

    getAllSaved: function () {
      var result = {};
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('afro_data_') === 0) {
          var toolId = key.replace('afro_data_', '');
          try {
            var items = JSON.parse(localStorage.getItem(key));
            if (items && items.length) {
              result[toolId] = { latest: items[0], count: items.length };
            }
          } catch (e) { /* skip */ }
        }
      }
      return result;
    }
  };

  // ───────────────────────────────────────────────
  // 7. Boot
  // ───────────────────────────────────────────────
  boot();

})(window, document);
