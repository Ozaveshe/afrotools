(function () {
  'use strict';

  var tool = document.querySelector('meta[name="tool-id"]');
  if (!tool || tool.content !== 'cv-builder') return;
  var descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (!descriptor || !descriptor.get || !descriptor.set || descriptor.set.__swDocumentPdfStable) return;
  var lastSource = new WeakMap();

  function localizeMarkup(source, localizer) {
    var template = document.createElement('template');
    descriptor.set.call(template, source);
    var walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function (node) {
      if (node.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(node.parentElement.tagName)) return;
      node.nodeValue = localizer.translate(node.nodeValue);
    });
    template.content.querySelectorAll('[placeholder],[aria-label],[title],input[type="button"],input[type="submit"]').forEach(function (element) {
      ['placeholder', 'aria-label', 'title', 'value'].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        element.setAttribute(attribute, localizer.translate(element.getAttribute(attribute)));
      });
    });
    return descriptor.get.call(template);
  }

  function setInnerHtml(value) {
    var source = String(value == null ? '' : value);
    var localizer = window.AfroTools && window.AfroTools.SwahiliDocumentPdfLocalizer;
    var next = localizer && typeof localizer.translate === 'function'
      ? localizeMarkup(source, localizer)
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
      var next = localizer && typeof localizer.translate === 'function'
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
