(function (window, document) {
  'use strict';

  var CONSENT_KEY = 'afrotools_cookie_consent';
  var BANNER_ID = 'afro-cookie-consent';
  var STYLE_ID = 'afro-cookie-consent-style';
  var pendingBodyOpen = false;
  var COPY = {
    en: {
      label: 'Cookie consent',
      message: 'AfroTools uses optional analytics cookies. Limited cookieless measurement remains active when you reject them.',
      accept: 'Accept analytics', decline: 'Reject analytics', privacy: 'Privacy details',
      currentAccepted: 'Current choice: analytics cookies allowed.',
      currentDeclined: 'Current choice: analytics cookies rejected.',
      close: 'Close analytics choices', privacyHref: '/cookies/'
    },
    fr: {
      label: 'Consentement aux cookies',
      message: 'AfroTools utilise des cookies d’analyse facultatifs. Une mesure limitée sans cookie reste active si vous les refusez.',
      accept: 'Accepter l’analyse', decline: 'Refuser l’analyse', privacy: 'Détails de confidentialité',
      currentAccepted: 'Choix actuel : cookies d’analyse autorisés.',
      currentDeclined: 'Choix actuel : cookies d’analyse refusés.',
      close: 'Fermer les choix d’analyse', privacyHref: '/cookies/'
    },
    sw: {
      label: 'Idhini ya vidakuzi',
      message: 'AfroTools hutumia vidakuzi vya hiari vya uchanganuzi. Kipimo kidogo kisichotumia vidakuzi hubaki hai ukivikataa.',
      accept: 'Kubali uchanganuzi', decline: 'Kataa uchanganuzi', privacy: 'Maelezo ya faragha',
      currentAccepted: 'Chaguo la sasa: vidakuzi vya uchanganuzi vimeruhusiwa.',
      currentDeclined: 'Chaguo la sasa: vidakuzi vya uchanganuzi vimekataliwa.',
      close: 'Funga chaguo za uchanganuzi', privacyHref: '/sw/faragha/'
    },
    ha: {
      label: 'Izinin kukis',
      message: 'AfroTools yana amfani da kukis na nazari na zaɓi. Ƙaramin aunawa marar kuki yana ci gaba idan ka ƙi.',
      accept: 'Yarda da nazari', decline: 'Ƙi nazari', privacy: 'Bayanan sirri',
      currentAccepted: 'Zaɓin yanzu: an yarda da kukis na nazari.',
      currentDeclined: 'Zaɓin yanzu: an ƙi kukis na nazari.',
      close: 'Rufe zaɓin nazari', privacyHref: '/ha/sirri/'
    },
    yo: {
      label: 'Ìfọwọ́sí kúkì',
      message: 'AfroTools ń lo àwọn kúkì ìtúpalẹ̀ àṣàyàn. Ìwọ̀n díẹ̀ láìsí kúkì ṣì ń ṣiṣẹ́ tí o bá kọ̀ wọ́n.',
      accept: 'Gba ìtúpalẹ̀', decline: 'Kọ ìtúpalẹ̀', privacy: 'Àlàyé ìpamọ́',
      currentAccepted: 'Àṣàyàn lọ́wọ́: a gba àwọn kúkì ìtúpalẹ̀.',
      currentDeclined: 'Àṣàyàn lọ́wọ́: a kọ àwọn kúkì ìtúpalẹ̀.',
      close: 'Pa àwọn àṣàyàn ìtúpalẹ̀', privacyHref: '/privacy/'
    }
  };

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (_) {
      return null;
    }
  }

  function remove(id) {
    var node = document.getElementById(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function close() {
    remove(BANNER_ID);
    remove(STYLE_ID);
  }

  function save(status) {
    try {
      window.localStorage.setItem(CONSENT_KEY, status);
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('afrotools:cookie-consent', { detail: { status: status } }));
    close();
  }

  function languageCopy() {
    var language = (document.documentElement.lang || 'en').substring(0, 2).toLowerCase();
    return COPY[language] || COPY.en;
  }

  function addStyles() {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#afro-cookie-consent{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));z-index:99999;width:min(720px,calc(100vw - 24px));transform:translateX(-50%);background:#102033;border:1px solid rgba(203,213,225,.24);border-radius:10px;padding:12px;font-family:"DM Sans",system-ui,sans-serif;box-shadow:0 14px 34px rgba(2,8,23,.22)}',
      '#afro-cookie-consent .afro-cc-inner{display:grid;gap:10px}',
      '#afro-cookie-consent .afro-cc-message{margin:0;color:#e5eef8;font-size:13px;line-height:1.5}',
      '#afro-cookie-consent .afro-cc-current{color:#bfdbfe;font-weight:700}',
      '#afro-cookie-consent .afro-cc-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '#afro-cookie-consent button,#afro-cookie-consent a{align-items:center;border-radius:8px;display:inline-flex;font-family:inherit;font-size:13px;font-weight:800;justify-content:center;min-height:44px;padding:0 14px}',
      '#afro-analytics-consent-accept{background:#0062cc;border:1px solid #0062cc;color:#fff;cursor:pointer}',
      '#afro-cc-decline{background:transparent;border:1px solid rgba(255,255,255,.45);color:#fff;cursor:pointer}',
      '#afro-cc-learn{border:1px solid transparent;color:#bfdbfe;text-decoration:none}',
      '#afro-cc-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#e5eef8;cursor:pointer;margin-left:auto;width:44px;padding:0}',
      '#afro-cookie-consent button:hover,#afro-cookie-consent a:hover{background:#004fa8;color:#fff}',
      '#afro-cookie-consent button:focus-visible,#afro-cookie-consent a:focus-visible{outline:3px solid rgba(147,197,253,.6);outline-offset:2px}',
      '@media(max-width:560px){#afro-cookie-consent{bottom:calc(8px + env(safe-area-inset-bottom));width:calc(100vw - 20px);padding:10px}#afro-cookie-consent .afro-cc-actions{display:grid;grid-template-columns:1fr 1fr}#afro-cookie-consent button,#afro-cookie-consent a{font-size:12.4px;padding:0 8px}#afro-cc-close{grid-column:2;margin-left:auto}}'
    ].join('');
    document.head.appendChild(style);
  }

  function open() {
    if (!document.body) {
      if (!pendingBodyOpen) {
        pendingBodyOpen = true;
        document.addEventListener('DOMContentLoaded', function () {
          pendingBodyOpen = false;
          open();
        }, { once: true });
      }
      return null;
    }
    var copy = languageCopy();
    var status = readConsent();
    close();
    addStyles();

    var banner = document.createElement('section');
    banner.id = BANNER_ID;
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', copy.label);
    banner.innerHTML = '<div class="afro-cc-inner"><div class="afro-cc-message">' + copy.message + '</div>'
      + (status ? '<div class="afro-cc-current">' + (status === 'accepted' ? copy.currentAccepted : copy.currentDeclined) + '</div>' : '')
      + '<div class="afro-cc-actions"><button id="afro-analytics-consent-accept" type="button">' + copy.accept + '</button>'
      + '<button id="afro-cc-decline" type="button">' + copy.decline + '</button>'
      + '<a href="' + copy.privacyHref + '" id="afro-cc-learn">' + copy.privacy + '</a>'
      + (status ? '<button id="afro-cc-close" type="button" aria-label="' + copy.close + '">&times;</button>' : '')
      + '</div></div>';
    document.body.appendChild(banner);

    document.getElementById('afro-analytics-consent-accept').addEventListener('click', function () { save('accepted'); });
    document.getElementById('afro-cc-decline').addEventListener('click', function () { save('declined'); });
    var closeButton = document.getElementById('afro-cc-close');
    if (closeButton) closeButton.addEventListener('click', close);
    return banner;
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.analyticsConsent = {
    getStatus: readConsent,
    open: open,
    accept: function () { save('accepted'); },
    decline: function () { save('declined'); }
  };
  window.addEventListener('afrotools:open-cookie-consent', open);
  document.addEventListener('click', function (event) {
    if (event.target && event.target.closest && event.target.closest('[data-afro-cookie-consent-open]')) {
      event.preventDefault();
      open();
    }
  });
  if (!readConsent()) open();
}(window, document));
