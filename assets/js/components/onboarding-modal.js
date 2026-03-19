/**
 * <onboarding-modal> — 2-step profile setup after signup
 *
 * Step 1: Country + Employment type
 * Step 2: Preferred tool categories (pick up to 3)
 *
 * Saves to profiles table via AfroAuth.updateProfile().
 */
(function () {
  'use strict';

  var TOOL_CATEGORIES = [
    { id: 'salary-tax',    icon: '\uD83D\uDCB0', label: 'Salary & Tax' },
    { id: 'currency-fx',   icon: '\uD83D\uDCB1', label: 'Currency & FX' },
    { id: 'pdf-documents', icon: '\uD83D\uDCC4', label: 'PDF & Documents' },
    { id: 'business',      icon: '\uD83D\uDCBC', label: 'Business Tools' },
    { id: 'crypto-web3',   icon: '\u20BF',        label: 'Crypto & Web3' },
    { id: 'african',       icon: '\uD83C\uDF0D', label: 'African Tools' }
  ];

  var EMPLOYMENT_TYPES = [
    { value: 'employed',       label: 'Employed' },
    { value: 'self-employed',  label: 'Self-Employed' },
    { value: 'freelancer',     label: 'Freelancer' },
    { value: 'business-owner', label: 'Business Owner' }
  ];

  var tmpl = document.createElement('template');
  tmpl.innerHTML = '<style>' + getStyles() + '</style><div class="ob-overlay" id="obOverlay"></div>';

  class OnboardingModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._step = 1;
      this._country = '';
      this._currency = '';
      this._employment = '';
      this._selectedTools = [];
      this._emailDigest = true;
    }

    connectedCallback() {
      this.shadowRoot.appendChild(tmpl.content.cloneNode(true));
      this._overlay = this.shadowRoot.getElementById('obOverlay');
    }

    show() {
      if (!this._overlay) return;
      this._step = 1;
      this._country = '';
      this._currency = '';
      this._employment = '';
      this._selectedTools = [];
      this._render();
      this._overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    hide() {
      if (!this._overlay) return;
      this._overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    _render() {
      if (this._step === 1) this._renderStep1();
      else this._renderStep2();
    }

    _renderStep1() {
      var countries = typeof AFRICAN_COUNTRIES !== 'undefined' ? AFRICAN_COUNTRIES : [];
      var opts = countries.map(function (c) {
        return '<option value="' + c.code + '">' + c.flag + ' ' + c.name + '</option>';
      }).join('');

      var radios = EMPLOYMENT_TYPES.map(function (t) {
        return '<label class="ob-radio">' +
          '<input type="radio" name="ob-employment" value="' + t.value + '">' +
          '<span class="ob-radio-label">' + t.label + '</span>' +
        '</label>';
      }).join('');

      this._overlay.innerHTML =
        '<div class="ob-card">' +
          '<div class="ob-header">' +
            '<div class="ob-dots"><span class="ob-dot active"></span><span class="ob-dot"></span></div>' +
            '<h2 class="ob-title">Set up your profile</h2>' +
            '<p class="ob-subtitle">This helps us personalise your tools and dashboard</p>' +
          '</div>' +
          '<div class="ob-body">' +
            '<div class="ob-field">' +
              '<label class="ob-label" for="obCountry">Country</label>' +
              '<select class="ob-select" id="obCountry">' +
                '<option value="">Select your country</option>' +
                opts +
              '</select>' +
            '</div>' +
            '<div class="ob-field">' +
              '<label class="ob-label">Employment type</label>' +
              '<div class="ob-radios">' + radios + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ob-footer">' +
            '<button class="ob-btn ob-btn-primary" id="obNext" disabled>Next</button>' +
            '<button class="ob-btn ob-btn-skip" id="obSkip">Skip for now</button>' +
          '</div>' +
        '</div>';

      this._bindStep1();
    }

    _bindStep1() {
      var self = this;
      var countrySelect = this.shadowRoot.getElementById('obCountry');
      var nextBtn = this.shadowRoot.getElementById('obNext');
      var skipBtn = this.shadowRoot.getElementById('obSkip');
      var radios = this.shadowRoot.querySelectorAll('input[name="ob-employment"]');

      function checkReady() {
        nextBtn.disabled = !(self._country && self._employment);
      }

      countrySelect.addEventListener('change', function () {
        self._country = countrySelect.value;
        var countries = typeof AFRICAN_COUNTRIES !== 'undefined' ? AFRICAN_COUNTRIES : [];
        var match = countries.filter(function (c) { return c.code === self._country; })[0];
        self._currency = match ? match.currency : 'USD';
        checkReady();
      });

      radios.forEach(function (r) {
        r.addEventListener('change', function () {
          self._employment = r.value;
          checkReady();
        });
      });

      nextBtn.addEventListener('click', function () {
        self._step = 2;
        self._render();
      });

      skipBtn.addEventListener('click', function () { self._skip(); });
    }

    _renderStep2() {
      var self = this;
      var cards = TOOL_CATEGORIES.map(function (cat) {
        return '<label class="ob-cat-card" data-id="' + cat.id + '">' +
          '<input type="checkbox" value="' + cat.id + '">' +
          '<span class="ob-cat-icon">' + cat.icon + '</span>' +
          '<span class="ob-cat-label">' + cat.label + '</span>' +
          '<span class="ob-cat-check">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</span>' +
        '</label>';
      }).join('');

      this._overlay.innerHTML =
        '<div class="ob-card">' +
          '<div class="ob-header">' +
            '<div class="ob-dots"><span class="ob-dot"></span><span class="ob-dot active"></span></div>' +
            '<h2 class="ob-title">What do you use most?</h2>' +
            '<p class="ob-subtitle">Pick up to 3 categories to personalise your dashboard</p>' +
          '</div>' +
          '<div class="ob-body">' +
            '<div class="ob-categories">' + cards + '</div>' +
            '<p class="ob-hint" id="obHint"></p>' +
            '<label class="ob-email-opt" id="obEmailOpt">' +
              '<input type="checkbox" id="obEmailDigest" checked>' +
              '<span class="ob-email-label">Send me a monthly financial summary email<br><span class="ob-email-desc">Your take-home, tax updates, and rate changes</span></span>' +
            '</label>' +
          '</div>' +
          '<div class="ob-footer">' +
            '<div class="ob-footer-row">' +
              '<button class="ob-btn ob-btn-back" id="obBack">Back</button>' +
              '<button class="ob-btn ob-btn-primary" id="obFinish">Finish</button>' +
            '</div>' +
            '<button class="ob-btn ob-btn-skip" id="obSkip2">Skip for now</button>' +
          '</div>' +
        '</div>';

      this._bindStep2();
    }

    _bindStep2() {
      var self = this;
      var checkboxes = this.shadowRoot.querySelectorAll('.ob-cat-card input[type="checkbox"]');
      var hint = this.shadowRoot.getElementById('obHint');
      var backBtn = this.shadowRoot.getElementById('obBack');
      var finishBtn = this.shadowRoot.getElementById('obFinish');
      var skipBtn = this.shadowRoot.getElementById('obSkip2');

      checkboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
          if (cb.checked && self._selectedTools.length >= 3) {
            cb.checked = false;
            hint.textContent = 'Maximum 3 categories';
            hint.classList.add('show');
            setTimeout(function () { hint.classList.remove('show'); }, 2000);
            return;
          }
          var card = cb.closest('.ob-cat-card');
          if (cb.checked) {
            self._selectedTools.push(cb.value);
            card.classList.add('selected');
          } else {
            self._selectedTools = self._selectedTools.filter(function (t) { return t !== cb.value; });
            card.classList.remove('selected');
          }
        });
      });

      backBtn.addEventListener('click', function () {
        self._step = 1;
        self._render();
        // Restore step 1 selections
        var cs = self.shadowRoot.getElementById('obCountry');
        if (cs && self._country) cs.value = self._country;
        var radios = self.shadowRoot.querySelectorAll('input[name="ob-employment"]');
        radios.forEach(function (r) { if (r.value === self._employment) r.checked = true; });
        var nextBtn = self.shadowRoot.getElementById('obNext');
        if (nextBtn) nextBtn.disabled = !(self._country && self._employment);
      });

      var emailCb = this.shadowRoot.getElementById('obEmailDigest');
      if (emailCb) {
        emailCb.addEventListener('change', function () { self._emailDigest = emailCb.checked; });
      }

      finishBtn.addEventListener('click', function () { self._submit(); });
      skipBtn.addEventListener('click', function () { self._skip(); });
    }

    async _submit() {
      var finishBtn = this.shadowRoot.getElementById('obFinish');
      if (finishBtn) {
        finishBtn.disabled = true;
        finishBtn.textContent = 'Saving...';
      }

      var updates = {
        onboarding_completed: true,
        country_code: this._country || null,
        currency: this._currency || 'USD',
        employment_type: this._employment || null,
        preferred_tools: this._selectedTools.length > 0 ? this._selectedTools : [],
        email_digest_enabled: this._emailDigest
      };

      if (window.AfroAuth && window.AfroAuth.updateProfile) {
        await window.AfroAuth.updateProfile(updates);
      }

      this.hide();
      window.dispatchEvent(new CustomEvent('afro-onboarding-complete', { detail: updates }));

      if (window.location.pathname.indexOf('/dashboard') !== 0) {
        window.location.href = '/dashboard/';
      }
    }

    async _skip() {
      if (window.AfroAuth && window.AfroAuth.updateProfile) {
        await window.AfroAuth.updateProfile({ onboarding_completed: true });
      }
      this.hide();
      window.dispatchEvent(new CustomEvent('afro-onboarding-complete', { detail: { skipped: true } }));
    }
  }

  function getStyles() {
    return '' +
      ':host{display:block}' +
      '.ob-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;padding:16px;backdrop-filter:blur(4px)}' +
      '.ob-overlay.open{display:flex}' +

      '.ob-card{background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15);animation:ob-slide-up 0.3s ease}' +
      '@keyframes ob-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +

      '.ob-header{text-align:center;padding:28px 28px 0}' +
      '.ob-dots{display:flex;gap:6px;justify-content:center;margin-bottom:16px}' +
      '.ob-dot{width:8px;height:8px;border-radius:50%;background:#E2E8F0}' +
      '.ob-dot.active{background:#007AFF;width:24px;border-radius:4px}' +
      '.ob-title{font-family:"DM Sans",system-ui,sans-serif;font-size:1.35rem;font-weight:700;color:#0f172a;margin:0 0 6px;text-transform:none;letter-spacing:-0.02em}' +
      '.ob-subtitle{font-family:"DM Sans",system-ui,sans-serif;font-size:0.875rem;color:#64748b;margin:0;text-transform:none}' +

      '.ob-body{padding:24px 28px}' +
      '.ob-field{margin-bottom:20px}' +
      '.ob-label{display:block;font-family:"DM Sans",system-ui,sans-serif;font-size:0.8rem;font-weight:600;color:#475569;margin-bottom:6px;text-transform:none}' +
      '.ob-select{width:100%;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:"DM Sans",system-ui,sans-serif;font-size:0.95rem;color:#0f172a;background:#fff;appearance:auto;cursor:pointer;transition:border-color 0.15s}' +
      '.ob-select:focus{outline:none;border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,0.1)}' +

      '.ob-radios{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.ob-radio{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:10px;cursor:pointer;transition:all 0.15s;font-family:"DM Sans",system-ui,sans-serif}' +
      '.ob-radio:hover{border-color:#94a3b8}' +
      '.ob-radio input{accent-color:#007AFF;width:16px;height:16px;margin:0}' +
      '.ob-radio-label{font-size:0.875rem;color:#0f172a;text-transform:none}' +
      '.ob-radio:has(input:checked){border-color:#007AFF;background:#eff6ff}' +

      '.ob-categories{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.ob-cat-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;border:1.5px solid #E2E8F0;border-radius:12px;cursor:pointer;transition:all 0.15s;position:relative;text-align:center;font-family:"DM Sans",system-ui,sans-serif}' +
      '.ob-cat-card:hover{border-color:#94a3b8}' +
      '.ob-cat-card input{position:absolute;opacity:0;pointer-events:none}' +
      '.ob-cat-card.selected{border-color:#007AFF;background:#eff6ff}' +
      '.ob-cat-icon{font-size:1.5rem;line-height:1}' +
      '.ob-cat-label{font-size:0.8rem;font-weight:500;color:#334155;text-transform:none}' +
      '.ob-cat-check{display:none;position:absolute;top:6px;right:6px;color:#007AFF}' +
      '.ob-cat-card.selected .ob-cat-check{display:block}' +

      '.ob-hint{font-family:"DM Sans",system-ui,sans-serif;font-size:0.78rem;color:#ef4444;text-align:center;margin:8px 0 0;opacity:0;transition:opacity 0.2s;text-transform:none}' +
      '.ob-hint.show{opacity:1}' +

      '.ob-email-opt{display:flex;align-items:flex-start;gap:10px;margin-top:16px;padding:12px 14px;border:1.5px solid #E2E8F0;border-radius:10px;cursor:pointer;transition:border-color 0.15s;font-family:"DM Sans",system-ui,sans-serif}' +
      '.ob-email-opt:hover{border-color:#94a3b8}' +
      '.ob-email-opt input{accent-color:#007AFF;width:18px;height:18px;margin:2px 0 0;flex-shrink:0}' +
      '.ob-email-label{font-size:0.84rem;color:#334155;line-height:1.4;text-transform:none}' +
      '.ob-email-desc{font-size:0.76rem;color:#94a3b8}' +

      '.ob-footer{padding:0 28px 24px;text-align:center}' +
      '.ob-footer-row{display:flex;gap:10px}' +
      '.ob-btn{font-family:"DM Sans",system-ui,sans-serif;border:none;border-radius:10px;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all 0.15s;text-transform:none}' +
      '.ob-btn-primary{flex:1;padding:12px 20px;background:#0f172a;color:#fff}' +
      '.ob-btn-primary:hover{background:#1e293b}' +
      '.ob-btn-primary:disabled{background:#94a3b8;cursor:not-allowed}' +
      '.ob-btn-back{padding:12px 20px;background:#f1f5f9;color:#475569}' +
      '.ob-btn-back:hover{background:#e2e8f0}' +
      '.ob-btn-skip{background:none;color:#94a3b8;padding:10px;margin-top:8px;font-size:0.8rem;width:100%}' +
      '.ob-btn-skip:hover{color:#64748b}' +

      '@media(max-width:600px){' +
        '.ob-overlay{padding:0;align-items:stretch}' +
        '.ob-card{max-width:100%;border-radius:0;max-height:100vh;min-height:100vh;display:flex;flex-direction:column}' +
        '.ob-body{flex:1;overflow-y:auto}' +
        '.ob-radios{grid-template-columns:1fr}' +
        '.ob-categories{grid-template-columns:1fr 1fr}' +
        '.ob-select,.ob-radio,.ob-cat-card{min-height:48px}' +
      '}' +
      '@media(prefers-color-scheme:dark){' +
        '.ob-overlay{background:rgba(0,0,0,0.7)}' +
        '.ob-card{background:#131D2E}' +
        '.ob-title{color:#E2E8F0}' +
        '.ob-subtitle{color:#94A3B8}' +
        '.ob-label{color:#C9D6E8}' +
        '.ob-select{background:#0A1628;border-color:#1E2D40;color:#E2E8F0}' +
        '.ob-radio{border-color:#1E2D40;color:#E2E8F0}' +
        '.ob-radio:has(input:checked){border-color:#007AFF;background:rgba(0,122,255,0.1)}' +
        '.ob-radio-label{color:#E2E8F0}' +
        '.ob-cat-card{border-color:#1E2D40}' +
        '.ob-cat-card.selected{border-color:#007AFF;background:rgba(0,122,255,0.1)}' +
        '.ob-cat-label{color:#C9D6E8}' +
        '.ob-btn-primary{background:#007AFF}' +
        '.ob-btn-primary:hover{background:#0063D1}' +
        '.ob-btn-back{background:#1E2D40;color:#C9D6E8}' +
        '.ob-btn-skip{color:#64748B}' +
        '.ob-email-opt{border-color:#1E2D40}' +
        '.ob-email-label{color:#C9D6E8}' +
        '.ob-email-desc{color:#64748B}' +
      '}';
  }

  customElements.define('onboarding-modal', OnboardingModal);
})();
