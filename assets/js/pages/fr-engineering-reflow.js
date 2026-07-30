(function () {
  'use strict';

  var RULES = {
    'AFRO-NAVBAR': [
      '@media (max-width:480px){',
      '.inner{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;padding-inline:8px!important;gap:8px!important;display:flex!important;align-items:center!important}',
      '.logo{box-sizing:border-box!important;display:flex!important;align-items:center!important;flex:1 1 auto!important;width:auto!important;max-width:calc(100% - 52px)!important;min-width:0!important;margin:0!important}',
      '.logo-mark{display:block!important;width:26px!important;max-width:26px!important;min-width:26px!important;height:26px!important;flex:0 0 26px!important}',
      '.logo>div{min-width:0!important}',
      '.nav-links{display:none!important}',
      '.right{width:44px!important;min-width:44px!important;flex:0 0 44px!important;gap:0!important;margin:0!important}',
      '.right>:not(.burger){display:none!important}',
      '.burger{width:44px!important;min-width:44px!important;margin:0!important}',
      '.mega{display:none!important}',
      '.mob:not(.open){display:none!important}',
      '}'
    ].join(''),
    'AFRO-FOOTER': [
      '@media (max-width:480px){',
      '.wrap{width:100%!important;max-width:100%!important;padding-inline:8px!important}',
      '.stats{grid-template-columns:1fr!important}',
      '.stats>div{min-width:0!important;overflow-wrap:anywhere!important}',
      '.cols,.col,.col-link{min-width:0!important;max-width:100%!important}',
      '.col-link{overflow-wrap:anywhere!important;white-space:normal!important}',
      '}'
    ].join(''),
    'AFRO-RELATED-TOOLS': [
      '@media (max-width:480px){',
      '.wrap{width:100%!important;max-width:100%!important;padding-inline:8px!important}',
      '.grid{grid-template-columns:1fr!important}',
      '.card,.card-body,.pill{min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important;white-space:normal!important}',
      '}'
    ].join('')
  };
  var observedRoots = new WeakSet();
  var themeReadyGeneration = 0;
  var themeRuntimeAttempts = 0;

  function patchHost(host) {
    if (!host || !host.shadowRoot || !RULES[host.tagName]) return;
    if (!host.shadowRoot.getElementById('fr-engineering-reflow')) {
      var style = document.createElement('style');
      style.id = 'fr-engineering-reflow';
      style.textContent = RULES[host.tagName];
      host.shadowRoot.appendChild(style);
    }
    if ('MutationObserver' in window && !observedRoots.has(host.shadowRoot)) {
      observedRoots.add(host.shadowRoot);
      new MutationObserver(function () {
        patchHost(host);
      }).observe(host.shadowRoot, { childList: true });
    }
  }

  function patchAll() {
    Object.keys(RULES).forEach(function (tagName) {
      document.querySelectorAll(tagName.toLowerCase()).forEach(patchHost);
    });
  }

  function afterStablePaint(callback) {
    var fontsReady = document.fonts && document.fonts.ready
      ? document.fonts.ready.catch(function () {})
      : Promise.resolve();
    fontsReady.then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(callback);
      });
    });
  }

  function afterThemeStyles(callback) {
    var stylesheet = document.getElementById('afro-theme-dark-css');
    if (!stylesheet || stylesheet.sheet) {
      callback();
      return;
    }
    var settled = false;
    var finish = function () {
      if (settled) return;
      settled = true;
      stylesheet.removeEventListener('load', finish);
      stylesheet.removeEventListener('error', finish);
      callback();
    };
    stylesheet.addEventListener('load', finish, { once: true });
    stylesheet.addEventListener('error', finish, { once: true });
    setTimeout(finish, 2000);
  }

  function scheduleThemeReady() {
    var root = document.documentElement;
    var generation = ++themeReadyGeneration;
    root.dataset.frEngineeringThemeReady = 'pending';
    afterThemeStyles(function () {
      afterStablePaint(function () {
        if (generation !== themeReadyGeneration) return;
        patchAll();
        var activeTheme = root.dataset.theme ||
          (window.AfroTools.darkMode.isDark() ? 'dark' : 'light');
        root.dataset.frEngineeringThemeReady = activeTheme;
        root.dataset.frEngineeringThemeGeneration = String(generation);
        document.dispatchEvent(new CustomEvent('fr-engineering:theme-ready', {
          detail: {
            activeTheme: activeTheme,
            generation: generation
          }
        }));
      });
    });
  }

  function waitForThemeRuntime() {
    if (
      window.AfroTools &&
      window.AfroTools.darkMode &&
      typeof window.AfroTools.darkMode.set === 'function'
    ) {
      scheduleThemeReady();
      return;
    }
    themeRuntimeAttempts += 1;
    if (themeRuntimeAttempts < 200) {
      setTimeout(waitForThemeRuntime, 25);
    }
  }

  function start() {
    patchAll();
    document.addEventListener('afrotools:theme-change', function () {
      patchAll();
      scheduleThemeReady();
    });
    if ('MutationObserver' in window) {
      new MutationObserver(patchAll).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    Object.keys(RULES).forEach(function (tagName) {
      if (window.customElements && customElements.whenDefined) {
        customElements.whenDefined(tagName.toLowerCase()).then(patchAll);
      }
    });
    waitForThemeRuntime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
