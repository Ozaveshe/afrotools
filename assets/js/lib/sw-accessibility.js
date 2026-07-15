(function () {
  'use strict';

  var interactiveSelector = 'a[href],button,input,select,textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

  function text(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function accessibleName(control) {
    if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return true;
    if (control.id && document.querySelector('label[for="' + CSS.escape(control.id) + '"]')) return true;
    return Boolean(control.closest('label'));
  }

  function labelControls(root) {
    root.querySelectorAll('input,select,textarea').forEach(function (control) {
      if ((control.type || '').toLowerCase() === 'hidden' || accessibleName(control)) return;
      var label = text(control.getAttribute('placeholder') || control.getAttribute('title') || control.getAttribute('name') || control.id);
      if (label) control.setAttribute('aria-label', label);
    });
  }

  function normalizeClickable(root) {
    root.querySelectorAll('div[onclick],span[onclick],li[onclick]').forEach(function (control) {
      if (control.dataset.swKeyboardReady === 'true') return;
      if (control.querySelector(interactiveSelector)) return;
      control.dataset.swKeyboardReady = 'true';
      if (!control.hasAttribute('role')) control.setAttribute('role', 'button');
      if (!control.hasAttribute('tabindex')) control.setAttribute('tabindex', '0');
      if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
        var label = text(control.textContent);
        if (label) control.setAttribute('aria-label', label);
      }
      control.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        control.click();
        if (control.getAttribute('role') === 'checkbox') {
          control.setAttribute('aria-checked', String(control.classList.contains('on')));
        }
      });
    });
  }

  function enhance(root) {
    if (!root || root.nodeType !== 1) return;
    labelControls(root);
    normalizeClickable(root);
  }

  function start() {
    enhance(document.body);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) enhance(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
