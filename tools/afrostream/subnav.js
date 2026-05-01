!function() {
  "use strict";

  function isLocalPreview() {
    var host = String(window.location.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || window.location.protocol === "file:";
  }

  function localPreviewHref(href) {
    if (!href || href.indexOf("/tools/afrostream/") !== 0) return href;
    var hashIndex = href.indexOf("#");
    var hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    var base = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
    var queryIndex = base.indexOf("?");
    var query = queryIndex >= 0 ? base.slice(queryIndex) : "";
    var path = queryIndex >= 0 ? base.slice(0, queryIndex) : base;
    var routes = {
      "/tools/afrostream/rankings": "/tools/afrostream/rankings.html",
      "/tools/afrostream/news": "/tools/afrostream/news.html",
      "/tools/afrostream/calendar": "/tools/afrostream/calendar.html",
      "/tools/afrostream/submit": "/tools/afrostream/submit.html",
      "/tools/afrostream/creator": "/tools/afrostream/creator.html",
      "/tools/afrostream/article": "/tools/afrostream/article.html",
      "/tools/afrostream/admin": "/tools/afrostream/admin.html",
      "/tools/afrostream/community": "/tools/afrostream/community.html"
    };
    return routes[path] ? routes[path] + query + hash : href;
  }

  function normalizeLocalLinks() {
    if (!isLocalPreview()) return;
    document.querySelectorAll("a[href^='/tools/afrostream/']").forEach(function(link) {
      var href = link.getAttribute("href");
      var next = localPreviewHref(href);
      if (next !== href) link.setAttribute("href", next);
    });
  }

  function activeKey() {
    var path = window.location.pathname.replace(/\/+$/, "/");
    var params = new URLSearchParams(window.location.search);
    if (path.indexOf("/tools/afrostream/university") !== -1) return "university";
    if (path.indexOf("/tools/afrostream/methodology") !== -1 || path.indexOf("/tools/afrostream/afroscore") !== -1) return "methodology";
    if (path.indexOf("/tools/afrostream/submit") !== -1) return "submit";
    if (path.indexOf("/tools/afrostream/calendar") !== -1) return "calendar";
    if (path.indexOf("/tools/afrostream/news") !== -1 || path.indexOf("/tools/afrostream/article") !== -1) return "news";
    if (path.indexOf("/tools/afrostream/creator") !== -1) return "rankings";
    if (path.indexOf("/tools/afrostream/rankings") !== -1) return params.get("mode") === "streamers" ? "streamers" : "rankings";
    return "live";
  }

  function refresh() {
    normalizeLocalLinks();
    var key = activeKey();
    document.querySelectorAll(".as-subnav-links a[data-as-nav], .su-subnav-links a[data-as-nav]").forEach(function(link) {
      var active = link.getAttribute("data-as-nav") === key;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();

  window.AfroStreamSubnav = { refresh: refresh };
}();
