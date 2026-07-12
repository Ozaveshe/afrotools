(function installSharedUiLocalization(root) {
  'use strict';

  function runtime() {
    return root.AfroTools && root.AfroTools.i18n;
  }

  function translated(key, fallback) {
    var api = runtime();
    if (!api) return fallback;
    var result = api.t(key, {}, { allowFallback: false, missingValue: fallback || '' });
    return result.state === 'missing' ? fallback : result.value;
  }

  function setText(documentRoot, selector, key) {
    Array.prototype.forEach.call(documentRoot.querySelectorAll(selector), function update(node) {
      var next = translated(key, node.textContent);
      if (next && node.textContent !== next) node.textContent = next;
    });
  }

  function setAttribute(documentRoot, selector, attribute, key) {
    Array.prototype.forEach.call(documentRoot.querySelectorAll(selector), function update(node) {
      var next = translated(key, node.getAttribute(attribute));
      if (next && node.getAttribute(attribute) !== next) node.setAttribute(attribute, next);
    });
  }

  function apply() {
    var doc = root.document;
    if (!doc || !runtime()) return;
    setText(doc, '#afro-cookie-consent p', 'cookie.message');
    setText(doc, '#afro-cc-accept', 'cookie.accept');
    setText(doc, '#afro-cc-learn', 'legal.privacy');
    setAttribute(doc, '#afro-cc-close', 'aria-label', 'common.close');
    setText(doc, '.am-tab[data-tab="login"]', 'account.signIn');
    setText(doc, '.am-tab[data-tab="signup"]', 'account.createAccount');
    setAttribute(doc, '#amClose', 'aria-label', 'common.close');
    setText(doc, '[data-ai-consent-decline]', 'consent.decline');
    setText(doc, '[data-ai-consent-accept]', 'consent.accept');

    Array.prototype.forEach.call(doc.querySelectorAll('.am-label'), function updateAuthLabel(node) {
      var current = String(node.textContent || '').trim().toLowerCase();
      var key = current.indexOf('email') !== -1 ? 'forms.email'
        : current.indexOf('password') !== -1 ? 'forms.password'
          : current.indexOf('full name') !== -1 || current === 'name' ? 'forms.name'
            : current.indexOf('country') !== -1 ? 'forms.country' : null;
      if (key) node.textContent = translated(key, node.textContent);
    });

    Array.prototype.forEach.call(doc.querySelectorAll('#amSubmit'), function updateSubmit(node) {
      var current = String(node.textContent || '').toLowerCase();
      var key = node.disabled || current.indexOf('wait') !== -1 ? 'states.loading'
        : current.indexOf('create') !== -1 || current.indexOf('sign up') !== -1 ? 'account.createAccount' : 'account.signIn';
      node.textContent = translated(key, node.textContent);
    });

    Array.prototype.forEach.call(doc.querySelectorAll('.am-error'), function updateError(node) {
      var current = String(node.textContent || '').trim().toLowerCase();
      if (!current) return;
      var key = current.indexOf('required') !== -1 || current.indexOf('fill in') !== -1 ? 'validation.required'
        : current.indexOf('not loaded') !== -1 || current.indexOf('not ready') !== -1 ? 'states.unavailable'
          : current.indexOf('wrong') !== -1 || current.indexOf('failed') !== -1 ? 'states.error' : null;
      if (key) node.textContent = translated(key, node.textContent);
    });
  }

  function start() {
    apply();
    if (!root.MutationObserver || root.__afrotoolsSharedUiLocalizationObserver) return;
    var scheduled = false;
    var observer = new root.MutationObserver(function onMutation() {
      if (scheduled) return;
      scheduled = true;
      root.setTimeout(function applyChanges() {
        scheduled = false;
        apply();
      }, 0);
    });
    observer.observe(root.document.documentElement, { childList: true, subtree: true });
    root.__afrotoolsSharedUiLocalizationObserver = observer;
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.localizeSharedUi = apply;
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
