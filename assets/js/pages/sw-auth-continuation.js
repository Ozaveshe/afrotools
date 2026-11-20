(function () {
  "use strict";
  var link = document.querySelector('.sw-contract-actions a[href^="/auth/?"]');
  if (!link) return;
  var incoming = new URLSearchParams(location.search);
  var destination = new URL(link.href);
  var next = incoming.get("next") || incoming.get("redirect");
  if (next && next.startsWith("/") && !next.startsWith("//") &&
      !/[\\\u0000-\u001f\u007f]/.test(next)) {
    var target = new URL(next, location.origin);
    if (target.origin === location.origin && !target.pathname.startsWith("//") &&
        !/^\/(?:sw\/)?auth(?:\/|$)/.test(target.pathname)) {
      destination.searchParams.set("next", target.pathname + target.search + target.hash);
    }
  }
  var mode = incoming.get("mode");
  if (mode === "signup" || mode === "reset") destination.searchParams.set("mode", mode);
  link.href = destination.pathname + destination.search;
})();
