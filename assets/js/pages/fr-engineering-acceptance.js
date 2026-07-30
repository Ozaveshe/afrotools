(function () {
  'use strict';

  var controlSnapshot = [];
  var resultSnapshot = [];
  var snapshotReady = false;
  var observedRoots = new WeakSet();

  function ownerId() {
    var guide = document.querySelector('[data-fr-engineering-owner]');
    return guide ? guide.getAttribute('data-fr-engineering-owner') : '';
  }

  function status(message) {
    var node = document.querySelector('[data-fr-engineering-runtime-status]');
    if (node) node.textContent = message;
  }

  function mutableControls() {
    return Array.prototype.filter.call(
      document.querySelectorAll('input, select, textarea'),
      function (control) {
        return !control.disabled &&
          control.type !== 'hidden' &&
          control.type !== 'file' &&
          !control.closest('afro-navbar, afro-footer, afro-site-assistant, .fr-engineering-local-export');
      }
    );
  }

  function capture() {
    var controls = mutableControls();
    controls.forEach(function (control, index) {
      if (!control.id) {
        control.id = 'fr-engineering-' + (ownerId() || 'owner') + '-control-' + (index + 1);
      }
    });
    controlSnapshot = controls.map(function (control) {
      return {
        node: control,
        value: control.value,
        checked: Boolean(control.checked),
        selectedIndex: control.selectedIndex
      };
    });
    resultSnapshot = Array.prototype.filter.call(
      document.querySelectorAll('output, [aria-live], .result, .results, [id*="result" i], [class*="result" i]'),
      function (node) {
        return !node.closest('.fr-engineering-local-export') &&
          !node.querySelector('input, select, textarea, button') &&
          node.innerHTML.length < 20000;
      }
    ).map(function (node) {
      return {
        node: node,
        html: node.innerHTML,
        hidden: node.hidden,
        display: node.style.display,
        ariaHidden: node.getAttribute('aria-hidden')
      };
    });
    snapshotReady = true;
    window.AfroToolsFrenchEngineeringAcceptance.ready = true;
  }

  function restoreResults() {
    resultSnapshot.forEach(function (entry) {
      if (!entry.node.isConnected) return;
      entry.node.innerHTML = entry.html;
      entry.node.hidden = entry.hidden;
      entry.node.style.display = entry.display;
      if (entry.ariaHidden === null) entry.node.removeAttribute('aria-hidden');
      else entry.node.setAttribute('aria-hidden', entry.ariaHidden);
    });
  }

  function reset() {
    if (!snapshotReady) capture();
    Array.prototype.forEach.call(document.querySelectorAll('form'), function (form) {
      form.reset();
    });
    controlSnapshot.forEach(function (entry) {
      var control = entry.node;
      if (!control.isConnected) return;
      if (control.type === 'checkbox' || control.type === 'radio') {
        control.checked = entry.checked;
      } else if (control.tagName === 'SELECT') {
        control.selectedIndex = entry.selectedIndex;
      } else {
        control.value = entry.value;
      }
      control.setCustomValidity('');
      control.removeAttribute('aria-invalid');
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
    window.requestAnimationFrame(function () {
      restoreResults();
      status('Parcours réinitialisé aux valeurs d’ouverture.');
    });
  }

  function setImportedValue(control, value) {
    if (!control || control.disabled) return;
    if (control.type === 'checkbox' || control.type === 'radio') {
      control.checked = Boolean(value);
    } else {
      control.value = String(value);
    }
    control.setCustomValidity('');
    control.removeAttribute('aria-invalid');
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function importPayload(payload) {
    if (!payload || payload.schema !== 'afrotools-fr-engineering-local-export-v1') {
      throw new Error('Format JSON AfroTools non reconnu.');
    }
    if (payload.owner && ownerId() && payload.owner !== ownerId()) {
      throw new Error('Cet état JSON appartient à un autre parcours.');
    }
    var controls = mutableControls();
    Object.keys(payload.inputs || {}).forEach(function (key) {
      var control = document.getElementById(key) ||
        document.querySelector('[name="' + CSS.escape(key) + '"]');
      var fallback = key.match(/^control-(\d+)$/);
      if (!control && fallback) control = controls[Number(fallback[1]) - 1];
      setImportedValue(control, payload.inputs[key]);
    });
    status('État JSON rouvert localement. Vérifiez les valeurs avant de recalculer.');
  }

  function readImport(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    file.text()
      .then(function (text) {
        importPayload(JSON.parse(text));
      })
      .catch(function (error) {
        status('Import impossible : ' + error.message);
      })
      .finally(function () {
        input.value = '';
      });
  }

  function observe(root) {
    if (!window.MutationObserver || observedRoots.has(root)) return;
    observedRoots.add(root);
    new MutationObserver(function () {
      patchOpenRoots(root);
      document.querySelectorAll('afro-site-assistant').forEach(patchAssistant);
    }).observe(root, { childList: true, subtree: true });
  }

  function patchAssistant(host) {
    if (!host || !host.shadowRoot) return;
    var root = host.shadowRoot;
    var input = root.getElementById('inp') || root.querySelector('.chat-input');
    if (input && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      input.setAttribute('aria-label', input.getAttribute('placeholder') || 'Décrivez votre besoin');
    }
    var send = root.getElementById('send') || root.querySelector('.send-btn');
    if (send && !send.getAttribute('type')) send.setAttribute('type', 'button');
    observe(root);
  }

  function patchOpenRoots(root) {
    root.querySelectorAll('*').forEach(function (element) {
      if (!element.shadowRoot) return;
      if (element.tagName === 'AFRO-SITE-ASSISTANT') patchAssistant(element);
      patchOpenRoots(element.shadowRoot);
      observe(element.shadowRoot);
    });
  }

  function start() {
    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-fr-engineering-reset]')) return;
      event.preventDefault();
      reset();
    });
    document.addEventListener('change', function (event) {
      if (event.target.matches('[data-fr-engineering-import]')) readImport(event.target);
    });
    patchOpenRoots(document);
    document.querySelectorAll('afro-site-assistant').forEach(patchAssistant);
    observe(document.documentElement);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(capture);
    });
  }

  window.AfroToolsFrenchEngineeringAcceptance = {
    ready: false,
    importPayload: importPayload,
    reset: reset
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
