(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MetaTagEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clean(value) { return String(value == null ? "" : value).trim(); }
  function attr(value) {
    return clean(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function generate(input) {
    const data = {
      title: clean(input && input.title), description: clean(input && input.description),
      url: clean(input && input.url), image: clean(input && input.image), siteName: clean(input && input.siteName),
      type: clean(input && input.type) || "website", twitterCard: clean(input && input.twitterCard) || "summary_large_image",
      twitter: clean(input && input.twitter), robots: clean(input && input.robots) || "index, follow", lang: clean(input && input.lang) || "sw"
    };
    if (!data.title || !data.description || !data.url) return { ok: false, error: "required" };
    let parsed;
    try { parsed = new URL(data.url); } catch (_) { return { ok: false, error: "url" }; }
    if (!/^https?:$/.test(parsed.protocol)) return { ok: false, error: "url" };
    const tags = [
      ["title", data.title], ["meta", { name: "description", content: data.description }],
      ["meta", { name: "robots", content: data.robots }], ["link", { rel: "canonical", href: parsed.href }],
      ["meta", { property: "og:type", content: data.type }], ["meta", { property: "og:title", content: data.title }],
      ["meta", { property: "og:description", content: data.description }], ["meta", { property: "og:url", content: parsed.href }],
      ["meta", { name: "twitter:card", content: data.twitterCard }], ["meta", { name: "twitter:title", content: data.title }],
      ["meta", { name: "twitter:description", content: data.description }]
    ];
    if (data.siteName) tags.push(["meta", { property: "og:site_name", content: data.siteName }]);
    if (data.image) tags.push(["meta", { property: "og:image", content: data.image }], ["meta", { name: "twitter:image", content: data.image }]);
    if (data.twitter) tags.push(["meta", { name: "twitter:site", content: data.twitter }]);
    const code = tags.map(([tag, value]) => {
      if (tag === "title") return `<title>${attr(value)}</title>`;
      const attrs = Object.entries(value).map(([key, item]) => `${key}="${attr(item)}"`).join(" ");
      return `<${tag} ${attrs}>`;
    }).join("\n");
    return { ok: true, data, code, tagCount: tags.length, titleLength: data.title.length, descriptionLength: data.description.length };
  }
  return { generate };
});
