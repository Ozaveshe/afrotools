!function(root) {
  "use strict";

  var PROD_ORIGIN = "https://afrotools.com";
  var PLACEHOLDER_IMAGE = "/assets/img/og-default.png";
  var CAT_GRADIENTS = {
    milestones: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    milestone: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    platform: "linear-gradient(135deg,#0891b2,#0f766e)",
    collabs: "linear-gradient(135deg,#db2777,#7c3aed)",
    drama: "linear-gradient(135deg,#ea580c,#dc2626)",
    business: "linear-gradient(135deg,#16a34a,#0f766e)",
    rising: "linear-gradient(135deg,#14b8a6,#2563eb)",
    industry: "linear-gradient(135deg,#0891b2,#2563eb)",
    data: "linear-gradient(135deg,#10b981,#059669)"
  };

  function isLocal(loc) {
    loc = loc || root.location || {};
    var host = String(loc.hostname || "").toLowerCase();
    return loc.protocol === "file:" || host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  function slugPart(slug) {
    return encodeURIComponent(String(slug || "").trim()).replace(/%2F/gi, "");
  }

  function prettyPath(slug) {
    return "/tools/afrostream/news/" + slugPart(slug);
  }

  function previewPath(slug) {
    return "/tools/afrostream/article.html?slug=" + slugPart(slug);
  }

  function articleHref(slug, loc) {
    return isLocal(loc) ? previewPath(slug) : prettyPath(slug);
  }

  function canonicalUrl(slug) {
    return PROD_ORIGIN + prettyPath(slug);
  }

  function slugFromLocation(loc) {
    loc = loc || root.location || {};
    var params = new URLSearchParams(loc.search || "");
    var fromQuery = params.get("slug") || params.get("article");
    if (fromQuery) return fromQuery;
    var match = String(loc.pathname || "").match(/\/tools\/afrostream\/news\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHttpUrl(url) {
    var value = String(url || "").trim();
    if (!value) return "";
    if (value.charAt(0) === "/") return value;
    try {
      var parsed = new URL(value, root.location && root.location.origin ? root.location.origin : PROD_ORIGIN);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : "";
    } catch (e) {
      return "";
    }
  }

  function escapeCssUrl(url) {
    return safeHttpUrl(url).replace(/["'()\\]/g, function(ch) {
      return "\\" + ch;
    });
  }

  function isPlaceholderImage(url) {
    var value = String(url || "").toLowerCase();
    return !value || value.indexOf("/assets/img/og-default.png") !== -1 || value.indexOf("placeholder") !== -1;
  }

  function categoryGradient(cat) {
    var key = String(cat || "milestones").toLowerCase();
    return CAT_GRADIENTS[key] || CAT_GRADIENTS.milestones;
  }

  function imageStyle(item) {
    item = item || {};
    var url = item.imageUrl || item.image_url || item.cover_url || "";
    if (!isPlaceholderImage(url)) {
      return "background-image:url(\"" + escapeCssUrl(url) + "\");background-size:cover;background-position:center;background-repeat:no-repeat";
    }
    var gradient = item.gradient || categoryGradient(item.cat || item.category);
    return "background:" + gradient + ";background-size:cover;background-position:center";
  }

  function normalizeBody(text) {
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  function formatInline(text) {
    var source = String(text || "");
    var tokens = [];
    source = source.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, function(_, label, url) {
      var i = tokens.length;
      tokens.push('<a href="' + escapeHTML(safeHttpUrl(url)) + '" target="_blank" rel="noopener">' + escapeHTML(label) + "</a>");
      return "\u0000LINK" + i + "\u0000";
    });
    var html = escapeHTML(source)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html.replace(/\u0000LINK(\d+)\u0000/g, function(_, i) {
      return tokens[Number(i)] || "";
    });
  }

  function renderMarkdown(text) {
    var clean = normalizeBody(text);
    if (!clean) return "";
    return clean.split(/\n{2,}/).map(function(block) {
      var value = block.trim();
      if (!value) return "";
      if (/^###\s+/.test(value)) return "<h3>" + formatInline(value.replace(/^###\s+/, "")) + "</h3>";
      if (/^##\s+/.test(value)) return "<h2>" + formatInline(value.replace(/^##\s+/, "")) + "</h2>";
      if (/^>\s+/.test(value)) return "<blockquote>" + formatInline(value.replace(/^>\s+/gm, "").replace(/\n/g, " ")) + "</blockquote>";
      if (/^(?:[-*]\s+.+\n?)+$/.test(value)) {
        return "<ul>" + value.split("\n").map(function(line) {
          return "<li>" + formatInline(line.replace(/^[-*]\s+/, "")) + "</li>";
        }).join("") + "</ul>";
      }
      if (/^(?:\d+\.\s+.+\n?)+$/.test(value)) {
        return "<ol>" + value.split("\n").map(function(line) {
          return "<li>" + formatInline(line.replace(/^\d+\.\s+/, "")) + "</li>";
        }).join("") + "</ol>";
      }
      return "<p>" + formatInline(value).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  root.AfroStreamNewsUtils = {
    isLocal: isLocal,
    articleHref: articleHref,
    canonicalUrl: canonicalUrl,
    prettyPath: prettyPath,
    previewPath: previewPath,
    slugFromLocation: slugFromLocation,
    escapeHTML: escapeHTML,
    safeHttpUrl: safeHttpUrl,
    isPlaceholderImage: isPlaceholderImage,
    categoryGradient: categoryGradient,
    imageStyle: imageStyle,
    renderMarkdown: renderMarkdown,
    placeholderImage: PLACEHOLDER_IMAGE
  };
}(typeof globalThis !== "undefined" ? globalThis : this);
