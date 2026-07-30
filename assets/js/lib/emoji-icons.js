(function (window, document) {
  'use strict';

  var selector = '.cat-icon-wrap, .ut-thumb-ph, .ld-icon, [data-twemoji-icon]';

  function hydrate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach(function (element) {
      if (!element.hasAttribute('data-twemoji-ready')) {
        element.setAttribute('data-twemoji-ready', 'native');
      }
    });
  }

  function start() {
    hydrate(document);
    if (!window.MutationObserver) return;
    new window.MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) { return mutation.addedNodes.length > 0; })) {
        window.requestAnimationFrame(function () { hydrate(document); });
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.AfroEmojiIcons = { hydrate: hydrate };
}(window, document));
