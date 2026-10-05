(function () {
  'use strict';

  var tool = document.querySelector('meta[name="tool-id"]');
  if (!tool || tool.content !== 'cv-builder') return;
  // These local workspaces rerender their form after save/status changes.
  // Keep their mobile dock context through the resulting focus loss: changing
  // fixed/relative position during the next pointer click loses that click.
  var documentControls = '.cv-application-pack-panel, .cv-job-tracker-panel';
  var documentNavigation = '[data-cv-copilot="pack"], [data-cv-copilot="job-tracker"], [data-cv-version-open-tracker], [data-next-step-action="pack"], [data-next-step-action="tracker"]';
  function enterDocumentControls() {
    if (document.body) document.body.classList.add('sw-cv-document-controls-active');
  }
  function visibleDocumentControls() {
    if (window.innerWidth > 700) return;
    if (Array.from(document.querySelectorAll(documentControls)).some(function (panel) {
      var bounds = panel.getBoundingClientRect();
      return bounds.height > 0 && bounds.top < window.innerHeight - 100 && bounds.bottom > 110;
    })) enterDocumentControls();
  }
  document.addEventListener('focusin', function (event) {
    if (event.target.closest && event.target.closest(documentControls)) enterDocumentControls();
  });
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target.closest) return;
    if (target.closest(documentNavigation)) enterDocumentControls();
    else if (target.closest('.cv-toolbar [data-action], [data-cv-mobile-command], .cv-flow-hero-actions [data-cv-flow-action]')) {
      document.body.classList.remove('sw-cv-document-controls-active');
    }
  }, true);
  window.addEventListener('scroll', visibleDocumentControls, {passive:true});
  window.addEventListener('resize', visibleDocumentControls, {passive:true});
  window.addEventListener('load', visibleDocumentControls, {once:true});
  var descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (!descriptor || !descriptor.get || !descriptor.set || descriptor.set.__swDocumentPdfStable) return;
  var lastSource = new WeakMap();

  function userContent(node) {
    var element = node && (node.nodeType === 1 ? node : node.parentElement);
    return element && element.closest && element.closest('.cv-prod, .cv-expanded-template, [data-cv-user-text], .cv-flow-doc:not(.cv-flow-empty) strong, .cv-flow-doc:not(.cv-flow-empty) small, textarea');
  }

  function localizeMarkup(source, localizer, isPreview) {
    var template = document.createElement('template');
    descriptor.set.call(template, source);
    var walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function (node) {
      if (userContent(node) || (node.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(node.parentElement.tagName))) return;
      if (isPreview && localizer.isCvUserText(node.nodeValue)) return;
      node.nodeValue = localizer.translate(node.nodeValue);
    });
    template.content.querySelectorAll('[placeholder],[aria-label],[title],input[type="button"],input[type="submit"]').forEach(function (element) {
      if (element.closest('.cv-prod, .cv-expanded-template, [data-cv-user-text]')) return;
      ['placeholder', 'aria-label', 'title', 'value'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        if (attribute === 'value' && !/^(button|submit)$/i.test(element.type || '')) return;
        element.setAttribute(attribute, localizer.translate(element.getAttribute(attribute)));
      });
    });
    return descriptor.get.call(template);
  }

  function setInnerHtml(value) {
    var source = String(value == null ? '' : value);
    var localizer = window.AfroTools && window.AfroTools.SwahiliDocumentPdfLocalizer;
    var next = !userContent(this) && localizer && typeof localizer.translate === 'function'
      ? localizeMarkup(source, localizer, this.id === 'cvpreview' || Boolean(this.closest && this.closest('#cvpreview')))
      : source;
    if (lastSource.get(this) === source && descriptor.get.call(this) === next) return;
    if (descriptor.get.call(this) === next) return;
    descriptor.set.call(this, next);
    lastSource.set(this, source);
  }
  setInnerHtml.__swDocumentPdfStable = true;
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set: setInnerHtml
  });

  var textDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  if (textDescriptor && textDescriptor.get && textDescriptor.set && !textDescriptor.set.__swDocumentPdfStable) {
    function setTextContent(value) {
      var source = String(value == null ? '' : value);
      var localizer = window.AfroTools && window.AfroTools.SwahiliDocumentPdfLocalizer;
      var next = this.isConnected && !userContent(this) && localizer && typeof localizer.translate === 'function'
        ? localizer.translate(source)
        : source;
      if (textDescriptor.get.call(this) === next) return;
      textDescriptor.set.call(this, next);
    }
    setTextContent.__swDocumentPdfStable = true;
    Object.defineProperty(Node.prototype, 'textContent', {
      configurable: textDescriptor.configurable,
      enumerable: textDescriptor.enumerable,
      get: textDescriptor.get,
      set: setTextContent
    });
  }
})();
