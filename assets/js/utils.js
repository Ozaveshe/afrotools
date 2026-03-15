/**
 * AFROTOOLS UTILITIES — Compatibility Layer
 * ===================================================================
 * This file preserves the original AfroTools.fmt, AfroTools.i18n,
 * AfroTools.reveal, AfroTools.ai, AfroTools.analytics,
 * AfroTools.toast, and AfroTools.share APIs.
 *
 * New code should import the individual lib modules directly:
 *   /assets/js/lib/currency.js    -> AfroTools.currency
 *   /assets/js/lib/formatters.js  -> AfroTools.fmt
 *   /assets/js/lib/validators.js  -> AfroTools.validate
 *   /assets/js/lib/analytics.js   -> AfroTools.analytics
 *   /assets/js/lib/storage.js     -> AfroTools.store
 *   /assets/js/lib/a11y.js        -> AfroTools.a11y
 *   /assets/js/lib/toast.js       -> AfroTools.toast (standalone)
 *   /assets/js/lib/share-state.js -> AfroTools.shareState
 *   /assets/js/lib/pdf-template.js-> AfroTools.pdf
 *   /assets/js/lib/calculate-animation.js -> AfroTools.anim
 *
 * This file adds legacy aliases and features not yet in lib modules:
 *   - AfroTools.fmt.ngn(), .kes(), .ghs(), .zar(), .egp(), .tzs()
 *   - AfroTools.fmt.currency(), .pct(), .compact()
 *   - AfroTools.i18n (translation system)
 *   - AfroTools.reveal (scroll reveal)
 *   - AfroTools.ai (AI advisor API helper)
 *   - AfroTools.share.shareResult() (result card sharing)
 * ===================================================================
 */

(function (window) {
  'use strict';

  // Ensure namespace exists (lib modules may have already created it)
  window.AfroTools = window.AfroTools || {};

  // ── LEGACY CURRENCY FORMATTERS ───────────────────────────────
  // These delegate to AfroTools.currency.format() if available,
  // otherwise use standalone implementations for backward compat.

  const legacyFmt = {
    /** Nigeria Naira */
    ngn: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('NGN', n);
      return '\u20A6' + Math.round(n).toLocaleString('en-NG');
    },

    /** Kenya Shilling */
    kes: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('KES', n);
      return 'KES ' + Math.round(n).toLocaleString('en-KE');
    },

    /** Ghana Cedi */
    ghs: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('GHS', n);
      return 'GHS ' + Math.round(n).toLocaleString('en-GH');
    },

    /** South Africa Rand */
    zar: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('ZAR', n);
      return 'R ' + Math.round(n).toLocaleString('en-ZA');
    },

    /** Egypt Pound */
    egp: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('EGP', n);
      return 'EGP ' + Math.round(n).toLocaleString('en-EG');
    },

    /** Tanzania Shilling */
    tzs: (n) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format('TZS', n);
      return 'TZS ' + Math.round(n).toLocaleString('en-TZ');
    },

    /** Generic — pass currency code */
    currency: (n, code) => {
      if (window.AfroTools.currency) return window.AfroTools.currency.format(code, n);
      const map = { NGN: '\u20A6', KES: 'KES ', GHS: 'GHS ', ZAR: 'R ', EGP: 'EGP ', TZS: 'TZS ' };
      return (map[code] || code + ' ') + Math.round(n).toLocaleString();
    },

    /** Percentage — always 1 decimal */
    pct: (n) => {
      if (window.AfroTools.fmt && window.AfroTools.fmt.percent) {
        return window.AfroTools.fmt.percent(n, 1, false);
      }
      return n.toFixed(1) + '%';
    },

    /** Compact number (1,200,000 -> 1.2M) */
    compact: (n) => {
      if (window.AfroTools.fmt && window.AfroTools.fmt.compact) {
        return window.AfroTools.fmt.compact(n);
      }
      if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
      if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
      if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
      return Math.round(n).toString();
    },
  };

  // Merge: lib/formatters.js methods + legacy currency shortcuts
  window.AfroTools.fmt = Object.assign(legacyFmt, window.AfroTools.fmt || {});

  // ── i18n ───────────────────────────────────────────────────
  const LANG_KEY = 'afrotools_lang';

  const STRINGS = {
    en: {
      calculate:         'Calculate',
      reset:             'Reset',
      results:           'Your Results',
      monthly:           'Monthly',
      annual:            'Annual',
      monthly_takehome:  'Monthly Take-Home Pay',
      annual_takehome:   'Annual Take-Home Pay',
      per_month:         'per month',
      per_year:          'per year',
      effective_rate:    'Effective Tax Rate',
      taxable_income:    'Taxable Income',
      gross_income:      'Gross Income',
      net_income:        'Net Income',
      ai_title:          'AI Financial Advisor',
      ai_idle:           'Calculate to get your personalised AI analysis.',
      ai_thinking:       'Analysing your results\u2026',
      chat_placeholder:  'Ask a follow-up question\u2026',
      send:              'Send',
      free_tool:         'Free Tool',
      no_signup:         'No sign-up required',
    },
    fr: {
      calculate:         'Calculer',
      reset:             'R\u00e9initialiser',
      results:           'Vos R\u00e9sultats',
      monthly:           'Mensuel',
      annual:            'Annuel',
      monthly_takehome:  'Salaire Net Mensuel',
      annual_takehome:   'Salaire Net Annuel',
      per_month:         'par mois',
      per_year:          'par an',
      effective_rate:    'Taux Effectif d\'Imposition',
      taxable_income:    'Revenu Imposable',
      gross_income:      'Revenu Brut',
      net_income:        'Revenu Net',
      ai_title:          'Conseiller Financier IA',
      ai_idle:           'Calculez pour obtenir votre analyse IA personnalis\u00e9e.',
      ai_thinking:       'Analyse de vos r\u00e9sultats\u2026',
      chat_placeholder:  'Posez une question de suivi\u2026',
      send:              'Envoyer',
      free_tool:         'Outil Gratuit',
      no_signup:         'Sans inscription',
    },
  };

  const i18n = {
    get lang() { return localStorage.getItem(LANG_KEY) || 'en'; },

    t(key) {
      const dict = STRINGS[this.lang] || STRINGS.en;
      return dict[key] || STRINGS.en[key] || key;
    },

    /** Apply translations to all elements with data-i18n attribute */
    apply() {
      const dict = STRINGS[this.lang] || STRINGS.en;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = dict[key];
          } else {
            el.textContent = dict[key];
          }
        }
      });
    },

    /** Set language and trigger page re-translation */
    set(lang) {
      localStorage.setItem(LANG_KEY, lang);
      this.apply();
      document.documentElement.lang = lang;
    },
  };

  // ── SCROLL REVEAL ──────────────────────────────────────────
  const reveal = {
    init() {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    },
  };

  // ── AI API HELPER ──────────────────────────────────────────
  const ai = {
    /**
     * Call Claude for AI analysis via Netlify serverless proxy.
     * @param {string} prompt
     * @param {string} systemPrompt
     * @param {Array}  history
     * @param {Object} opts - { tool, context }
     */
    async ask(prompt, systemPrompt = '', history = [], opts = {}) {
      const messages = history.length > 0
        ? [...history, { role: 'user', content: prompt }]
        : [{ role: 'user', content: prompt }];

      const body = { messages };
      if (systemPrompt) body.system = systemPrompt;
      if (opts.tool) body.tool = opts.tool;
      if (opts.context) body.context = opts.context;

      const reqHeaders = { 'Content-Type': 'application/json' };
      if (window.AfroAuth) {
        const token = AfroAuth.getSessionToken();
        if (token) reqHeaders['Authorization'] = 'Bearer ' + token;
      }

      const res = await fetch('/.netlify/functions/ai-advisor', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const data = await res.json();
        if (window.AfroTools.analytics) {
          window.AfroTools.analytics.trackRateLimit(opts.tool);
        }
        throw new Error(data.reply || 'Daily AI limit reached. Sign up for more questions.');
      }

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (window.AfroTools.analytics && opts.tool) {
        window.AfroTools.analytics.trackAIQuery(opts.tool, prompt, messages.length);
      }

      return data.reply || '';
    },
  };

  // ── SHARE HELPER ─────────────────────────────────────────
  const share = {
    /**
     * Share content via Web Share API or fallback to clipboard
     * @param {Object} opts - { title, text, url, imageBlob, toolId }
     */
    async shareResult(opts = {}) {
      const url = opts.url || window.location.href;
      const utm = url.includes('?') ? '&' : '?';
      const shareUrl = url + utm + 'utm_source=share&utm_medium=result_card&utm_campaign=' + (opts.toolId || 'unknown');

      // Try native share with image
      if (navigator.share && opts.imageBlob) {
        try {
          const file = new File([opts.imageBlob], 'afrotools-result.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: opts.title || 'AfroTools Result', text: opts.text || '', url: shareUrl, files: [file] });
            if (window.AfroTools.analytics) window.AfroTools.analytics.trackShare(opts.toolId, 'native_image');
            return 'shared';
          }
        } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
      }

      // Try native share without image
      if (navigator.share) {
        try {
          await navigator.share({ title: opts.title || 'AfroTools Result', text: opts.text || '', url: shareUrl });
          if (window.AfroTools.analytics) window.AfroTools.analytics.trackShare(opts.toolId, 'native');
          return 'shared';
        } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
      }

      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText((opts.text || '') + ' ' + shareUrl);
        if (window.AfroTools.analytics) window.AfroTools.analytics.trackShare(opts.toolId, 'clipboard');
        if (window.AfroTools.toast) window.AfroTools.toast.success('Link copied to clipboard!');
        return 'copied';
      } catch {
        if (window.AfroTools.toast) window.AfroTools.toast.error('Could not share. Try copying the URL manually.');
        return 'failed';
      }
    }
  };

  // ── LEGACY ANALYTICS (delegates to new module) ─────────────
  const legacyAnalytics = {
    trackCalc(toolId, country, value) {
      if (window.AfroTools.analytics && window.AfroTools.analytics.trackCalculation) {
        window.AfroTools.analytics.trackCalculation(toolId, country, value);
      } else if (window.gtag) {
        window.gtag('event', 'calculate', {
          tool_id: toolId, country: country, value: Math.round(value),
        });
      }
    },
    trackAI(toolId) {
      if (window.AfroTools.analytics && window.AfroTools.analytics.trackAITriggered) {
        window.AfroTools.analytics.trackAITriggered(toolId);
      } else if (window.gtag) {
        window.gtag('event', 'ai_advisor_triggered', { tool_id: toolId });
      }
    },
    trackNewsletter() {
      if (window.AfroTools.analytics && window.AfroTools.analytics.trackNewsletter) {
        window.AfroTools.analytics.trackNewsletter();
      } else if (window.gtag) {
        window.gtag('event', 'newsletter_signup');
      }
    },
  };

  // Only set analytics if the new module hasn't already claimed it
  if (!window.AfroTools.analytics) {
    window.AfroTools.analytics = legacyAnalytics;
  } else {
    // Merge legacy aliases onto the new analytics module
    Object.assign(window.AfroTools.analytics, legacyAnalytics);
  }

  // ── ASSIGN REMAINING MODULES ───────────────────────────────
  window.AfroTools.i18n = i18n;
  window.AfroTools.reveal = reveal;
  window.AfroTools.ai = ai;
  window.AfroTools.share = share;

  // Toast: only set if lib/toast.js hasn't loaded yet
  if (!window.AfroTools.toast || !window.AfroTools.toast.success) {
    window.AfroTools.toast = {
      _container: null,
      _ensureContainer() {
        if (!this._container) {
          this._container = document.createElement('div');
          Object.assign(this._container.style, {
            position: 'fixed', bottom: '24px', right: '24px',
            zIndex: '400', display: 'flex', flexDirection: 'column', gap: '8px',
          });
          document.body.appendChild(this._container);
        }
      },
      show(message, type = 'info', duration = 4000) {
        this._ensureContainer();
        const el = document.createElement('div');
        const bg = type === 'success' ? 'var(--color-primary)' : type === 'error' ? '#dc3545' : '#0a1a10';
        Object.assign(el.style, {
          background: bg, color: 'white', padding: '12px 18px',
          borderRadius: '5px', fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.875rem', fontWeight: '500', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          maxWidth: '320px', lineHeight: '1.5',
        });
        el.textContent = message;
        this._container.appendChild(el);
        setTimeout(() => {
          el.style.opacity = '0';
          el.style.transition = 'opacity 0.25s ease';
          setTimeout(() => el.remove(), 300);
        }, duration);
      },
      success(msg, d) { this.show(msg, 'success', d); },
      error(msg, d)   { this.show(msg, 'error', d); },
      info(msg, d)    { this.show(msg, 'info', d); },
      warning(msg, d) { this.show(msg, 'warning', d); },
    };
  }

  // ── AUTO-INIT ON DOM READY ─────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    i18n.apply();
    reveal.init();
  });

})(window);
