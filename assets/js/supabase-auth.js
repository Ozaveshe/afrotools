/**
 * AfroTools Auth — Supabase Edition v3
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
  var SUPABASE_PROXY = (window.location.origin || '') + '/supabase-proxy';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0';

  // Custom fetch: route all Supabase API calls through our Netlify proxy so auth
  // works even when supabase.co is blocked by ad blockers or ISP restrictions.
  // Netlify proxy strips custom headers, so we pass apikey as a URL param instead.
  // Falls back to direct Supabase URL if proxy fails.
  var _proxyFetch = function (url, options) {
    var proxyUrl = url.replace(SUPABASE_URL, SUPABASE_PROXY);
    // Netlify proxy may strip the 'apikey' header — add it as a URL param
    var sep = proxyUrl.indexOf('?') > -1 ? '&' : '?';
    proxyUrl += sep + 'apikey=' + encodeURIComponent(SUPABASE_KEY);
    return fetch(proxyUrl, options).catch(function () {
      return fetch(url, options);
    });
  };

  var _sb = null;       // Supabase client
  var _user = null;      // auth.users row
  var _profile = null;   // public.profiles row
  var _ready = false;
  var _readyCbs = [];
  var _modalInjected = false;
  var _isSignupMode = false;

  // ───────────────────────────────────────────────
  // 1. Load Supabase SDK from CDN (with retry)
  // ───────────────────────────────────────────────
  // SDK sources — local first (always works), CDN as fallback
  var SDK_SOURCES = [
    '/assets/js/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  ];

  function loadSDK(sourceIndex) {
    sourceIndex = sourceIndex || 0;
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) { resolve(); return; }
      if (sourceIndex >= SDK_SOURCES.length) {
        reject(new Error('Supabase SDK failed to load from all sources'));
        return;
      }
      var s = document.createElement('script');
      s.src = SDK_SOURCES[sourceIndex];
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve();
        else loadSDK(sourceIndex + 1).then(resolve, reject);
      };
      s.onerror = function () {
        console.warn('[AfroAuth] SDK failed from ' + SDK_SOURCES[sourceIndex] + ', trying next...');
        loadSDK(sourceIndex + 1).then(resolve, reject);
      };
      document.head.appendChild(s);
    });
  }

  // ───────────────────────────────────────────────
  // Helper: user-friendly error messages
  // ───────────────────────────────────────────────
  function friendlyError(msg) {
    if (!msg) return 'Something went wrong. Please try again.';
    if (msg === 'Failed to fetch' || msg.indexOf('fetch') > -1 || msg.indexOf('NetworkError') > -1) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    if (msg.indexOf('Invalid login') > -1) return 'Incorrect email or password. Try again or reset your password.';
    if (msg.indexOf('Email not confirmed') > -1) return 'Please check your email for a confirmation link before signing in.';
    if (msg.indexOf('User already registered') > -1) return 'This email is already registered. Try signing in instead.';
    if (msg.indexOf('Password should be') > -1) return 'Password must be at least 8 characters.';
    if (msg.indexOf('rate limit') > -1 || msg.indexOf('429') > -1) return 'Too many attempts. Please wait a moment and try again.';
    return msg;
  }

  // ───────────────────────────────────────────────
  // 2. Boot
  // ───────────────────────────────────────────────
  async function boot() {
    try {
      await loadSDK();

      // detectSessionInUrl: true — Supabase v2 automatically handles both
      // PKCE (?code=) and implicit (#access_token=) redirects before firing
      // INITIAL_SESSION, so no manual URL processing is needed.
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: window.localStorage
        },
        global: { fetch: _proxyFetch }
      });

      _sb.auth.onAuthStateChange(async function (event, session) {
        console.log('[AfroAuth] Event:', event, session ? '(session found)' : '(no session)');

        if (session && session.user) {
          _user = session.user;
          await fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          _user = null;
          _profile = null;
        }

        refreshNavbar();
        fire('afro-auth-change', { user: _user, profile: _profile, event: event });

        // Mark ready after initial session resolution
        if (!_ready) {
          _ready = true;
          _readyCbs.forEach(function (fn) { try { fn(); } catch (e) {} });
          _readyCbs = [];
        }
      });

    } catch (err) {
      console.warn('[AfroAuth] Boot error:', err);
      // Still mark ready so the dashboard doesn't hang
      _ready = true;
      _readyCbs.forEach(function (fn) { try { fn(); } catch (e) {} });
      _readyCbs = [];
    }
  }

  async function fetchProfile() {
    if (!_user || !_sb) return;
    try {
      var r = await _sb.from('profiles').select('*').eq('id', _user.id).single();
      if (!r.error && r.data) _profile = r.data;
    } catch (e) { console.warn('[AfroAuth] Profile fetch error:', e); }
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
  // 4. Auth Modal — CSS + HTML injection
  // ───────────────────────────────────────────────

  // Critical inline styles to override global.css (text-transform: uppercase on h1-h6, etc.)
  var MODAL_CRITICAL_CSS =
    '.afro-auth-overlay *{text-transform:none!important;letter-spacing:normal!important}' +
    '.afro-auth-card{text-transform:none!important}' +
    '.afro-auth-title{text-transform:none!important;font-family:"DM Sans",system-ui,sans-serif!important;color:#0f172a!important;font-size:1.5rem!important;font-weight:700!important}' +
    '.afro-auth-subtitle{text-transform:none!important;font-family:"DM Sans",system-ui,sans-serif!important}' +
    '.afro-auth-submit{background:#0f172a!important;color:#fff!important;border:none!important;border-radius:12px!important;padding:0.8rem 1rem!important;font-family:"DM Sans",system-ui,sans-serif!important;font-size:0.95rem!important;font-weight:600!important;cursor:pointer!important;text-transform:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important}' +
    '.afro-auth-submit:hover{background:#1e293b!important}' +
    '.afro-auth-submit:disabled{background:#94a3b8!important;cursor:not-allowed!important}' +
    '.afro-auth-social-btn{text-transform:none!important;background:#fff!important;border:1px solid #dadce0!important;color:#3c4043!important;font-family:"DM Sans",system-ui,sans-serif!important}' +
    '.afro-auth-social-btn:hover{background:#f8f9fa!important}' +
    '.afro-auth-social-btn--fb:hover{background:#f0f2ff!important}' +
    '.afro-auth-social-btn--x:hover{background:#f5f5f5!important}' +
    '.afro-auth-social-btn--gh:hover{background:#f5f5f5!important}' +
    '.afro-auth-password-toggle{position:absolute!important;right:12px!important;bottom:10px!important;background:none!important;border:none!important;cursor:pointer!important;padding:4px!important;display:flex!important;align-items:center!important;opacity:0.5;transition:opacity 0.15s}' +
    '.afro-auth-password-toggle:hover{opacity:1}' +
    '.afro-auth-strength{display:flex;align-items:center;gap:8px;margin-top:-4px}' +
    '.afro-auth-strength-bar{flex:1;height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;position:relative}' +
    '.afro-auth-strength-bar::after{content:"";position:absolute;left:0;top:0;height:100%;width:var(--strength,0%);background:var(--strength-color,#e2e8f0);border-radius:2px;transition:width 0.3s,background 0.3s}' +
    '.afro-auth-strength-text{font-size:0.75rem!important;color:var(--strength-color,#94a3b8)!important;min-width:48px;text-align:right}' +
    '.afro-auth-forgot{text-align:right;margin-top:-4px}' +
    '.afro-auth-forgot button{background:none!important;border:none!important;color:#64748b!important;font-size:0.8rem!important;cursor:pointer;padding:0;font-family:"DM Sans",system-ui,sans-serif!important;text-transform:none!important}' +
    '.afro-auth-forgot button:hover{color:#0f172a!important}' +
    '.afro-auth-security{text-align:center;font-size:0.78rem!important;color:#94a3b8!important;margin-top:1.25rem;padding-top:1rem;border-top:1px solid #f1f5f9;font-family:"DM Sans",system-ui,sans-serif!important;text-transform:none!important;display:flex;align-items:center;justify-content:center;gap:6px}' +
    '.afro-auth-security a{color:#0f172a!important;text-decoration:underline;text-underline-offset:2px}' +
    '.afro-auth-footer{text-transform:none!important}' +
    '.afro-auth-footer button{text-transform:none!important;color:#0f172a!important;background:none!important;border:none!important;font-weight:600!important;text-decoration:underline!important}' +
    '.afro-auth-field label{text-transform:none!important}' +
    '.afro-auth-divider{text-transform:none!important}' +
    '.afro-auth-brand-text{font-family:"DM Sans",system-ui,sans-serif!important;font-weight:700!important;font-size:1.1rem!important;color:#0f172a!important;text-transform:none!important;letter-spacing:-0.02em!important}' +
    '.afro-auth-msg{text-transform:none!important}' +
    '@keyframes afro-spin{to{transform:rotate(360deg)}}' +
    '.afro-auth-submit .spin{animation:afro-spin 0.6s linear infinite}';

  function injectModal() {
    if (_modalInjected) return;
    _modalInjected = true;

    // External CSS (nice-to-have, but critical styles are inline above)
    if (!document.getElementById('afro-auth-css')) {
      var link = document.createElement('link');
      link.id = 'afro-auth-css';
      link.rel = 'stylesheet';
      link.href = '/assets/css/auth-modal.css?v=' + Date.now();
      document.head.appendChild(link);
    }

    // Critical inline styles (override global.css text-transform/colors)
    if (!document.getElementById('afro-auth-critical')) {
      var style = document.createElement('style');
      style.id = 'afro-auth-critical';
      style.textContent = MODAL_CRITICAL_CSS;
      document.head.appendChild(style);
    }

    // HTML
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="afro-auth-overlay" id="afroAuthOverlay">' +
        '<div class="afro-auth-card">' +
          '<button class="afro-auth-close" id="afroAuthClose" aria-label="Close" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;padding:6px;color:#94a3b8;font-size:1.4rem;line-height:1;border-radius:8px;">&times;</button>' +

          '<div class="afro-auth-brand" style="text-align:center;margin-bottom:1.75rem;">' +
            '<div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:1rem;">' +
              '<img src="/assets/img/logo-mark.svg" alt="" style="height:28px;width:28px;">' +
              '<span class="afro-auth-brand-text">AfroTools</span>' +
            '</div>' +
            '<h2 class="afro-auth-title" id="afroAuthTitle">Welcome back</h2>' +
            '<p class="afro-auth-subtitle" id="afroAuthSubtitle">Sign in to save your tools and calculations</p>' +
          '</div>' +

          '<div class="afro-auth-msg" id="afroAuthMsg"></div>' +

          '<div class="afro-auth-social" style="display:flex;flex-direction:column;gap:0.625rem;margin-bottom:1.5rem;">' +
            // Google
            '<button class="afro-auth-social-btn" id="afroGoogleBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;width:100%;padding:0.8rem 1rem;border-radius:12px;font-size:0.95rem;font-weight:500;cursor:pointer;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
              '<svg viewBox="0 0 24 24" style="width:20px;height:20px;flex-shrink:0;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
              'Continue with Google' +
            '</button>' +
            // Facebook
            '<button class="afro-auth-social-btn afro-auth-social-btn--fb" id="afroFacebookBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;width:100%;padding:0.8rem 1rem;border-radius:12px;font-size:0.95rem;font-weight:500;cursor:pointer;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
              '<svg viewBox="0 0 24 24" style="width:20px;height:20px;flex-shrink:0;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>' +
              'Continue with Facebook' +
            '</button>' +
            // X / Twitter
            '<button class="afro-auth-social-btn afro-auth-social-btn--x" id="afroXBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;width:100%;padding:0.8rem 1rem;border-radius:12px;font-size:0.95rem;font-weight:500;cursor:pointer;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
              '<svg viewBox="0 0 24 24" style="width:18px;height:18px;flex-shrink:0;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000"/></svg>' +
              'Continue with X' +
            '</button>' +
            // GitHub
            '<button class="afro-auth-social-btn afro-auth-social-btn--gh" id="afroGithubBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:0.75rem;width:100%;padding:0.8rem 1rem;border-radius:12px;font-size:0.95rem;font-weight:500;cursor:pointer;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
              '<svg viewBox="0 0 24 24" style="width:20px;height:20px;flex-shrink:0;"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="#333"/></svg>' +
              'Continue with GitHub' +
            '</button>' +
          '</div>' +

          '<div class="afro-auth-divider" style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;color:#94a3b8;font-size:0.8rem;">or continue with email</div>' +

          '<form class="afro-auth-form" id="afroAuthForm" style="display:flex;flex-direction:column;gap:0.875rem;">' +
            '<div class="afro-auth-field afro-signup-field" style="display:none">' +
              '<label for="afroAuthName">Full name</label>' +
              '<input type="text" id="afroAuthName" placeholder="Your full name" autocomplete="name">' +
            '</div>' +

            '<div class="afro-auth-field">' +
              '<label for="afroAuthEmail">Email address</label>' +
              '<input type="email" id="afroAuthEmail" placeholder="you@example.com" required autocomplete="email">' +
            '</div>' +

            '<div class="afro-auth-field" style="position:relative;">' +
              '<label for="afroAuthPassword">Password</label>' +
              '<input type="password" id="afroAuthPassword" placeholder="Min 8 characters" required minlength="8" autocomplete="current-password">' +
              '<button type="button" class="afro-auth-password-toggle" id="afroAuthPwToggle" aria-label="Show password" tabindex="-1">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
              '</button>' +
            '</div>' +

            '<div class="afro-auth-strength afro-signup-field" style="display:none">' +
              '<div class="afro-auth-strength-bar" id="afroStrengthBar"></div>' +
              '<span class="afro-auth-strength-text" id="afroStrengthText"></span>' +
            '</div>' +

            '<div class="afro-auth-forgot afro-signin-field">' +
              '<button type="button" id="afroForgotBtn">Forgot password?</button>' +
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

          '<div class="afro-auth-footer" id="afroAuthFooter" style="text-align:center;margin-top:1.5rem;font-size:0.875rem;color:#64748b;">' +
            'Don\'t have an account? <button id="afroAuthToggle">Sign up</button>' +
          '</div>' +

          '<div class="afro-auth-security" id="afroAuthSecurity">' +
            '<span>\uD83D\uDD12</span> Your data is private and secure' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap.firstElementChild);
    bindModalEvents();
  }

  // Helper: initiate OAuth for any provider
  function startOAuth(provider, btn) {
    return async function () {
      if (!_sb) { showMsg('Auth service is loading. Please wait a moment and try again.', 'error'); return; }
      btn.disabled = true;
      btn.style.opacity = '0.6';
      hideMsg();
      try {
        console.log('[AfroAuth] Starting ' + provider + ' OAuth...');
        var opts = {
          provider: provider,
          options: { redirectTo: window.location.origin + '/dashboard/' }
        };
        if (provider === 'google') opts.options.queryParams = { prompt: 'select_account' };
        var result = await _sb.auth.signInWithOAuth(opts);
        if (result.error) {
          console.warn('[AfroAuth] OAuth error:', result.error);
          showMsg(friendlyError(result.error.message), 'error');
          btn.disabled = false;
          btn.style.opacity = '';
        }
      } catch (err) {
        console.warn('[AfroAuth] OAuth exception:', err);
        showMsg(friendlyError(err.message), 'error');
        btn.disabled = false;
        btn.style.opacity = '';
      }
    };
  }

  // Helper: calculate password strength (0-4)
  function calcPasswordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    // clamp to 4
    score = Math.min(score, 4);
    var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    var colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'];
    return { score: score, label: labels[score], color: colors[score] };
  }

  function bindModalEvents() {
    var overlay = document.getElementById('afroAuthOverlay');
    var closeBtn = document.getElementById('afroAuthClose');
    var form = document.getElementById('afroAuthForm');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    // Social OAuth buttons
    var googleBtn = document.getElementById('afroGoogleBtn');
    var facebookBtn = document.getElementById('afroFacebookBtn');
    var xBtn = document.getElementById('afroXBtn');
    var githubBtn = document.getElementById('afroGithubBtn');

    googleBtn.addEventListener('click', startOAuth('google', googleBtn));
    facebookBtn.addEventListener('click', startOAuth('facebook', facebookBtn));
    xBtn.addEventListener('click', startOAuth('twitter', xBtn));
    githubBtn.addEventListener('click', startOAuth('github', githubBtn));

    // Password visibility toggle
    var pwToggle = document.getElementById('afroAuthPwToggle');
    var pwInput = document.getElementById('afroAuthPassword');
    pwToggle.addEventListener('click', function () {
      var showing = pwInput.type === 'text';
      pwInput.type = showing ? 'password' : 'text';
      pwToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      // Swap icon: open eye vs closed eye
      if (!showing) {
        pwToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      } else {
        pwToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    });

    // Password strength indicator (signup mode only)
    pwInput.addEventListener('input', function () {
      if (!_isSignupMode) return;
      var str = calcPasswordStrength(pwInput.value);
      var bar = document.getElementById('afroStrengthBar');
      var txt = document.getElementById('afroStrengthText');
      if (bar) {
        var pct = (str.score / 4 * 100) + '%';
        bar.style.setProperty('--strength', pct);
        bar.style.setProperty('--strength-color', str.color);
      }
      if (txt) {
        txt.textContent = str.label;
        txt.style.setProperty('color', str.color, 'important');
      }
    });

    // Forgot password
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'afroForgotBtn') {
        e.preventDefault();
        if (!_sb) { showMsg('Auth service is loading. Please wait a moment and try again.', 'error'); return; }
        var email = document.getElementById('afroAuthEmail').value.trim();
        if (!email) { showMsg('Enter your email address above, then click Forgot password.', 'error'); return; }
        hideMsg();
        _sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/dashboard/'
        }).then(function (res) {
          if (res.error) { showMsg(friendlyError(res.error.message), 'error'); }
          else { showMsg('Password reset link sent! Check your email inbox.', 'success'); }
        }).catch(function (err) {
          showMsg(friendlyError(err.message), 'error');
        });
      }
    });

    // Email form submit
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!_sb) { showMsg('Auth service is loading. Please wait a moment and try again.', 'error'); return; }

      var email = document.getElementById('afroAuthEmail').value.trim();
      var password = document.getElementById('afroAuthPassword').value;
      var submitBtn = document.getElementById('afroAuthSubmit');
      var submitLabel = _isSignupMode ? 'Create account' : 'Sign in';

      if (!email || !password) { showMsg('Please enter your email and password.', 'error'); return; }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spin" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;"></span> ' + (_isSignupMode ? 'Creating account...' : 'Signing in...');
      hideMsg();

      try {
        if (_isSignupMode) {
          var name = document.getElementById('afroAuthName').value.trim();
          var country = document.getElementById('afroAuthCountry').value;
          if (!name) { showMsg('Please enter your name.', 'error'); submitBtn.disabled = false; submitBtn.textContent = submitLabel; return; }

          console.log('[AfroAuth] Signing up:', email);
          var res = await _sb.auth.signUp({
            email: email,
            password: password,
            options: {
              data: { full_name: name, country: country },
              emailRedirectTo: window.location.origin + '/dashboard/'
            }
          });

          if (res.error) throw res.error;

          // Auto-confirm disabled? Session returned immediately
          if (res.data.session) {
            console.log('[AfroAuth] Signup success, session active');
            _user = res.data.session.user;
            await fetchProfile();
            closeModal();
            refreshNavbar();
            fire('afro-auth-change', { user: _user, profile: _profile, event: 'SIGNED_IN' });
            // After signup: redirect to dashboard
            if (window.location.pathname.indexOf('/dashboard') !== 0) {
              window.location.href = '/dashboard/';
            }
            return;
          }

          // Email confirmation required
          if (res.data.user && !res.data.session) {
            showMsg('Account created! Check your email for a confirmation link.', 'success');
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
            return;
          }

        } else {
          console.log('[AfroAuth] Signing in:', email);
          var res2 = await _sb.auth.signInWithPassword({ email: email, password: password });
          if (res2.error) throw res2.error;

          console.log('[AfroAuth] Sign-in success');
          _user = res2.data.session.user;
          await fetchProfile();
          closeModal();
          refreshNavbar();
          fire('afro-auth-change', { user: _user, profile: _profile, event: 'SIGNED_IN' });

          // On dashboard: afro-auth-change event above already triggers showDashboard() — no reload needed.
          // On any other page: redirect to dashboard.
          if (window.location.pathname.indexOf('/dashboard') !== 0) {
            window.location.href = '/dashboard/';
          }
          return;
        }
      } catch (err) {
        console.warn('[AfroAuth] Auth error:', err);
        showMsg(friendlyError(err.message), 'error');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
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
    var signupFields = document.querySelectorAll('.afro-signup-field');
    var signinFields = document.querySelectorAll('.afro-signin-field');
    var pwInput = document.getElementById('afroAuthPassword');
    var security = document.getElementById('afroAuthSecurity');

    if (signup) {
      title.textContent = 'Create your account';
      subtitle.textContent = 'Join thousands of professionals across Africa';
      submit.textContent = 'Create account';
      footer.innerHTML = 'Already have an account? <button id="afroAuthToggle">Sign in</button>';
      signupFields.forEach(function (f) { f.style.display = ''; });
      signinFields.forEach(function (f) { f.style.display = 'none'; });
      if (pwInput) pwInput.setAttribute('autocomplete', 'new-password');
      if (security) security.innerHTML = 'By signing up, you agree to our <a href="/terms/">Terms of Service</a> and <a href="/privacy/">Privacy Policy</a>';
    } else {
      title.textContent = 'Welcome back';
      subtitle.textContent = 'Sign in to save your tools and calculations';
      submit.textContent = 'Sign in';
      footer.innerHTML = 'Don\'t have an account? <button id="afroAuthToggle">Sign up</button>';
      signupFields.forEach(function (f) { f.style.display = 'none'; });
      signinFields.forEach(function (f) { f.style.display = ''; });
      if (pwInput) pwInput.setAttribute('autocomplete', 'current-password');
      if (security) security.innerHTML = '<span>\uD83D\uDD12</span> Your data is private and secure';
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
      try {
        var res = await _sb.auth.signInWithPassword({ email: email, password: password });
        if (res.error) return { ok: false, error: friendlyError(res.error.message) };
        _user = res.data.user;
        await fetchProfile();
        return { ok: true, user: this.getUser() };
      } catch (e) {
        return { ok: false, error: friendlyError(e.message) };
      }
    },

    async signup(email, name, password, country) {
      if (!_sb) return { ok: false, error: 'Auth not ready' };
      try {
        var res = await _sb.auth.signUp({
          email: email,
          password: password,
          options: { data: { full_name: name, country: country } }
        });
        if (res.error) return { ok: false, error: friendlyError(res.error.message) };
        if (res.data.user) { _user = res.data.user; await fetchProfile(); }
        return { ok: true, user: this.getUser() };
      } catch (e) {
        return { ok: false, error: friendlyError(e.message) };
      }
    },

    async logout() {
      if (_sb) {
        try { await _sb.auth.signOut(); } catch (e) {}
      }
      _user = null;
      _profile = null;
      refreshNavbar();
      fire('afro-auth-change', { user: null, profile: null, event: 'SIGNED_OUT' });
    },

    async updateProfile(updates) {
      if (!_user || !_sb) return { ok: false, error: 'Not logged in' };
      try {
        var res = await _sb.from('profiles').update(updates).eq('id', _user.id);
        if (res.error) return { ok: false, error: friendlyError(res.error.message) };
        await fetchProfile();
        return { ok: true, user: this.getUser() };
      } catch (e) {
        return { ok: false, error: friendlyError(e.message) };
      }
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
