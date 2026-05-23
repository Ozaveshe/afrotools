!function() {
  "use strict";

  var replacements = [
    [/local demo/gi, "account preview"],
    [/Save picks locally/g, "Save my picks"],
    [/No local prediction saved yet\./g, "No prediction saved yet."]
  ];

  function polishText(value) {
    return replacements.reduce(function(text, pair) {
      return text.replace(pair[0], pair[1]);
    }, value);
  }

  function shouldSkip(node) {
    return node && node.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.parentElement.tagName);
  }

  function polish(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (shouldSkip(node)) continue;
      var nextValue = polishText(node.nodeValue);
      if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
    }
  }

  function start() {
    polish(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}();
