/**
 * AFROTOOLS UTILITIES
 * ══════════════════════════════════════════════════════════════
 * Shared helpers used across all tools and pages.
 * Exposed on window.AfroTools so any page script can call them.
 *
 * Usage:
 *   AfroTools.fmt.ngn(500000)      → "₦500,000"
 *   AfroTools.fmt.kes(80000)       → "KES 80,000"
 *   AfroTools.fmt.pct(18.7)        → "18.7%"
 *   AfroTools.i18n.t('calculate')  → "Calculate" or "Calculer"
 *   AfroTools.reveal.init()        → activates scroll reveals
 * ══════════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  // ── CURRENCY FORMATTERS ────────────────────────────────────
  const fmt = {
    /** Nigeria Naira */
    ngn: (n) => '₦' + Math.round(n).toLocaleString('en-NG'),

    /** Kenya Shilling */
    kes: (n) => 'KES ' + Math.round(n).toLocaleString('en-KE'),

    /** Ghana Cedi */
    ghs: (n) => 'GHS ' + Math.round(n).toLocaleString('en-GH'),

    /** South Africa Rand */
    zar: (n) => 'R ' + Math.round(n).toLocaleString('en-ZA'),

    /** Egypt Pound */
    egp: (n) => 'EGP ' + Math.round(n).toLocaleString('en-EG'),

    /** Tanzania Shilling */
    tzs: (n) => 'TZS ' + Math.round(n).toLocaleString('en-TZ'),

    /** Generic — pass currency code */
    currency: (n, code) => {
      const map = { NGN: '₦', KES: 'KES ', GHS: 'GHS ', ZAR: 'R ', EGP: 'EGP ', TZS: 'TZS ' };
      return (map[code] || code + ' ') + Math.round(n).toLocaleString();
    },

    /** Percentage — always 1 decimal */
    pct: (n) => n.toFixed(1) + '%',

    /** Compact number (1,200,000 → 1.2M) */
    compact: (n) => {
      if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
      if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
      if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
      return Math.round(n).toString();
    },
  };

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
      ai_thinking:       'Analysing your results…',
      chat_placeholder:  'Ask a follow-up question…',
      send:              'Send',
      free_tool:         'Free Tool',
      no_signup:         'No sign-up required',
    },
    fr: {
      calculate:         'Calculer',
      reset:             'Réinitialiser',
      results:           'Vos Résultats',
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
      ai_idle:           'Calculez pour obtenir votre analyse IA personnalisée.',
      ai_thinking:       'Analyse de vos résultats…',
      chat_placeholder:  'Posez une question de suivi…',
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
        // Fallback: just show everything
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Fire once
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
     * Returns response text or throws.
     *
     * @param {string} prompt - The full prompt
     * @param {string} systemPrompt - Optional system context
     * @param {Array}  history - Optional message history for follow-up
     */
    async ask(prompt, systemPrompt = '', history = []) {
      const messages = history.length > 0
        ? [...history, { role: 'user', content: prompt }]
        : [{ role: 'user', content: prompt }];

      const body = { messages };

      if (systemPrompt) {
        body.system = systemPrompt;
      }

      const res = await fetch('/.netlify/functions/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      return data.reply || '';
    },
  };

  // ── ANALYTICS WRAPPER ──────────────────────────────────────
  const analytics = {
    /** Track a tool calculation */
    trackCalc(toolId, country, value) {
      if (window.gtag) {
        window.gtag('event', 'calculate', {
          tool_id:  toolId,
          country:  country,
          value:    Math.round(value),
        });
      }
    },

    /** Track an AI advisor trigger */
    trackAI(toolId) {
      if (window.gtag) {
        window.gtag('event', 'ai_advisor_triggered', { tool_id: toolId });
      }
    },

    /** Track newsletter signup */
    trackNewsletter() {
      if (window.gtag) {
        window.gtag('event', 'newsletter_signup');
      }
    },
  };

  // ── TOAST NOTIFICATIONS ────────────────────────────────────
  const toast = {
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
      const bg = type === 'success' ? '#008751' : type === 'error' ? '#dc3545' : '#0a1a10';
      Object.assign(el.style, {
        background: bg, color: 'white', padding: '12px 18px',
        borderRadius: '5px', fontFamily: "'Barlow', Arial, sans-serif",
        fontSize: '0.875rem', fontWeight: '400', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        animation: 'slideIn 0.25s ease', maxWidth: '320px', lineHeight: '1.5',
      });
      el.textContent = message;
      this._container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.25s ease';
        setTimeout(() => el.remove(), 300);
      }, duration);
    },
  };

  // ── EXPOSE GLOBALLY ────────────────────────────────────────
  window.AfroTools = { fmt, i18n, reveal, ai, analytics, toast };

  // Auto-apply translations on load
  document.addEventListener('DOMContentLoaded', () => {
    i18n.apply();
    reveal.init();
  });

})(window);
