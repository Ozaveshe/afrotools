const fs = require("fs"),
  path = require("path"),
  litePack = require("./lite/widget-pack.js"),
  root = __dirname,
  registryPath = path.join(root, "WIDGET-REGISTRY.js"),
  iframeDir = path.join(root, "iframe"),
  siteOrigin = "https://afrotools.com",
  aliasMap = {
    "equatorial-guinea-paye": ["eq-guinea-paye"],
    "markup-calc": ["markup-calculator"],
    "discount-calc": ["discount-calculator"],
    "inflation-calc": ["inflation-calculator"],
    "waist-hip": ["waist-hip-ratio"],
    ovulation: ["ovulation-calculator"],
    "ielts-band": ["ielts-calculator"],
    "scientific-calc": ["scientific-calculator"],
  },
  linkCorrections = {
    "car-paye": "/car/cf-paye.html",
    "equatorial-guinea-paye": "/eq-guinea/gq-paye.html",
    "vat-calculator": "/tools/vat-calculator/",
    "dca-calculator": "/crypto/dca-calculator/",
    ovulation: "/tools/ovulation-calc/",
    "waist-hip": "/tools/waist-hip-ratio/",
    "business-license-budget": "/tools/business-registration/",
    "invoice-fee-widget": "/tools/invoice-generator/",
    "employer-cost-widget": "/salary-tax/",
  },
  coreAdditions = [
    {
      id: "ask-ai-router",
      name: "Ask AfroTools AI Mini Router",
      category: "ai",
      description: "Prompt-to-tool router for partner pages",
      fullToolLink: "/ai/",
      iframePath: "/widgets/iframe/ai-mini-router.html",
      scriptPath: "ai/mini-router",
      aliases: ["ask-afrotools-ai", "ai-mini-router"],
      source: "core-widget",
    },
  ];
function cleanText(e) {
  return String(e || "")
    .replace(/\u2192/g, " to ")
    .replace(/\u2194/g, " to ")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function absoluteUrl(e) {
  return e
    ? /^https?:\/\//.test(e)
      ? e
      : `${siteOrigin}${e}`
    : `${siteOrigin}/`;
}
function trackedToolUrl(e) {
  const t = absoluteUrl(e.fullToolLink),
    r = t.includes("?") ? "&" : "?";
  return `${t}${r}utm_source=widget&utm_medium=embed&utm_campaign=${encodeURIComponent(e.id)}`;
}
function writeAtomic(e, t) {
  const r = `${e}.tmp-${process.pid}-${Date.now()}`;
  (fs.writeFileSync(r, t, "utf8"), fs.renameSync(r, e));
}
function updateIframeAttribution(e) {
  const t = path.join(
    iframeDir,
    String(e.iframePath || "").replace(/^\/widgets\/iframe\//, ""),
  );
  if (!fs.existsSync(t)) return;
  const r = fs.readFileSync(t, "utf8"),
    i = `<div class="aw-footer"><a href="${trackedToolUrl(e)}" target="_blank" rel="noopener noreferrer">Powered by AfroTools</a></div>`,
    a = r.replace(
      /<div class="aw-footer"><a href="[^"]*" target="_blank" rel="noopener(?: noreferrer)?">[^<]*<\/a><\/div>/,
      i,
    );
  a !== r && writeAtomic(t, a);
}
function iframeFromCode(e) {
  const t = String(e || "").match(/\/widgets\/iframe\/([^"']+\.html)/);
  return t ? t[1] : "";
}
function scriptPathFromIframe(e) {
  const t = path.join(iframeDir, e || "");
  if (!e || !fs.existsSync(t)) return "";
  const r = fs
    .readFileSync(t, "utf8")
    .match(/<script\s+src="\/widgets\/([^"?]+)\.js(?:\?[^"]*)?"/);
  return r ? r[1] : "";
}
function canonicalIframeFile(e) {
  const t = String(e.iframePath || "").replace(/^\/widgets\/iframe\//, "");
  if (t && fs.existsSync(path.join(iframeDir, t))) return t;
  const r = `${e.category}-${e.id}.html`;
  return fs.existsSync(path.join(iframeDir, r))
    ? r
    : iframeFromCode(e.iframeCode) || r;
}
function embedCode(e) {
  return `<div data-afrotools="${e}"></div>`;
}
function iframeCode(e, t) {
  return `<iframe src="https://afrotools.com/widgets/iframe/${e}" width="100%" height="500" frameborder="0" title="${cleanText(t)} - AfroTools" loading="lazy"></iframe>`;
}
function normalizeBaseEntry(e) {
  const t = canonicalIframeFile(e),
    r = e.scriptPath || scriptPathFromIframe(t),
    i = cleanText(e.id);
  return {
    id: i,
    name: cleanText(e.name),
    category: cleanText(e.category),
    description: cleanText(e.description || e.name),
    fullToolLink: linkCorrections[i] || e.fullToolLink || "/",
    embedCode: embedCode(i),
    iframeCode: iframeCode(t, e.name),
    iframePath: `/widgets/iframe/${t}`,
    scriptPath: r,
    aliases: aliasMap[i] || e.aliases || [],
    source: e.source || "core-widget",
  };
}
function liteEntry(e) {
  const t = `${e.category}-${e.id}.html`;
  return {
    id: e.id,
    name: cleanText(e.title),
    category: e.category,
    description: cleanText(e.description),
    fullToolLink: linkCorrections[e.id] || e.fullToolLink,
    embedCode: embedCode(e.id),
    iframeCode: iframeCode(t, e.title),
    iframePath: `/widgets/iframe/${t}`,
    scriptPath: "lite/widget-pack",
    aliases: [],
    source: "lite-pack",
  };
}
function makeLiteIframe(e) {
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${cleanText(e.title)} - AfroTools</title>\n<link rel="canonical" href="${absoluteUrl(e.fullToolLink)}">\n<meta name="robots" content="noindex, follow">\n<meta property="og:url" content="${siteOrigin}/widgets/iframe/${e.category}-${e.id}.html">\n<link rel="stylesheet" href="/widgets/css/widget-base.css">\n<style>\nbody{margin:0;padding:20px;background:#fff;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}\nbody.dark{background:#0a1628;color:#fafaf8}\n#widget-root{max-width:480px;margin:0 auto}\n.aw{box-shadow:none}\n.aw-footer{text-align:center;margin:12px auto 0;max-width:480px;padding-top:12px;border-top:1px solid rgba(128,128,128,.25)}\n.aw-footer a{font-size:11px;color:#0062CC;text-decoration:none;font-weight:700}\n</style>\n</head>\n<body>\n<div id="widget-root" class="aw aw--light"></div>\n<div class="aw-footer"><a href="${trackedToolUrl(e)}" target="_blank" rel="noopener noreferrer">Powered by AfroTools</a></div>\n<script src="/widgets/lite/widget-pack.js"><\/script>\n<script>\n(function(){\n  var params = new URLSearchParams(window.location.search);\n  var theme = params.get("theme") || "light";\n  var root = document.getElementById("widget-root");\n  var locale = params.get("lang") === "fr" && "${e.id}" === "poultry-roi-estimator" ? "fr" : "en";\n  if (locale === "fr") {\n    document.documentElement.lang = "fr";\n    document.title = "Rentabilité avicole - AfroTools";\n    var attribution = document.querySelector(".aw-footer a");\n    attribution.textContent = "Propulsé par AfroTools";\n    attribution.href = "/fr/agriculture/poultry-roi/?utm_source=widget&utm_medium=embed&utm_campaign=poultry-roi-estimator";\n  }\n  if (theme === "dark") document.body.classList.add("dark");\n  root.className = "aw aw--" + theme;\n  window.AfroWidgets.renderLiteWidget(root, { widgetId: "${e.id}", theme: theme, locale: locale });\n  if ("ResizeObserver" in window) {\n    var ro = new ResizeObserver(function(){\n      window.parent.postMessage({ type: "afrotools:resize", height: document.body.scrollHeight }, "*");\n    });\n    ro.observe(document.body);\n  }\n})();\n<\/script>\n</body>\n</html>\n`;
}
function refreshLiteRuntime(existing, generated, id) {
  const scripts = (html) => (html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || [])
    .filter((script) => script.includes("window.AfroWidgets.renderLiteWidget"));
  const before = scripts(existing), after = scripts(generated);
  if (before.length !== 1 || after.length !== 1) throw new Error(`Expected one lite runtime for ${id}`);
  return existing.replace(before[0], () => after[0]);
}
const runtimeOnly = process.argv.includes("--runtime-only");
const selectedLiteId = (process.argv.find((arg) => arg.startsWith("--only=")) || "").slice(7);
if (selectedLiteId && !litePack.specs.some((entry) => entry.id === selectedLiteId)) throw new Error(`Unknown lite widget: ${selectedLiteId}`);
const current = require("./WIDGET-REGISTRY.js"),
  base = coreAdditions
    .concat(current.filter((e) => "lite-pack" !== e.source))
    .map(normalizeBaseEntry),
  lite = litePack.specs.map(liteEntry),
  byId = new Map();
base.concat(lite).forEach((e) => {
  e.id && !byId.has(e.id) && byId.set(e.id, e);
});
const entries = Array.from(byId.values()).sort((e, t) =>
  e.category === t.category
    ? e.name.localeCompare(t.name)
    : e.category.localeCompare(t.category),
);
(writeAtomic(
  registryPath,
  `var AFRO_WIDGET_REGISTRY=${JSON.stringify(entries)};"undefined"!=typeof module&&module.exports&&(module.exports=AFRO_WIDGET_REGISTRY);`,
),
  fs.existsSync(iframeDir) || fs.mkdirSync(iframeDir, { recursive: !0 }),
  litePack.specs.forEach((e) => {
    if (selectedLiteId && e.id !== selectedLiteId) return;
    const file = path.join(iframeDir, `${e.category}-${e.id}.html`);
    const generated = makeLiteIframe(e);
    writeAtomic(
      file,
      runtimeOnly ? refreshLiteRuntime(fs.readFileSync(file, "utf8"), generated, e.id) : generated,
    );
  }),
  entries.filter((entry) => !selectedLiteId || entry.id === selectedLiteId).forEach(updateIframeAttribution));
const counts = entries.reduce(
    (e, t) => ((e[t.category] = (e[t.category] || 0) + 1), e),
    {},
  ),
  manifest = [
    "# AfroTools Widget System - Build Manifest",
    "",
    `**Total Widgets Built:** ${entries.length}`,
    `**Total Iframe Embeds:** ${entries.length}`,
    `**Total Registry Entries:** ${entries.length}`,
    "",
    "## Counts by Category",
    "",
    ...Object.keys(counts)
      .sort()
      .map((e) => `- **${e}**: ${counts[e]}`),
    "",
    "## Source Model",
    "",
    "- `widgets/WIDGET-REGISTRY.js` is the public widget registry consumed by the gallery and embed loader.",
    "- `widgets/lite/widget-pack.js` adds data-driven calculator widgets without one JS file per calculator.",
    "- `widgets/ai/mini-router.js` provides the deterministic Ask AfroTools AI mini-router widget.",
    "- `widgets/build-widget-product.js` rebuilds the registry and generated lite iframe pages.",
    "",
    "## Usage",
    "",
    "```html",
    '<div data-afrotools="nigeria-paye"></div>',
    '<script src="https://afrotools.com/widgets/embed.js" async><\/script>',
    "```",
    "",
    "### Ask AfroTools AI mini-router",
    "",
    "```html",
    '<div data-afrotools="ask-ai-router" data-afrotools-default-country="Ghana" data-afrotools-default-category="career" data-afrotools-partner-id="example-partner" data-afrotools-allowed-categories="career,business,education"></div>',
    '<script src="https://afrotools.com/widgets/embed.js" async><\/script>',
    "```",
    "",
  ].join("\n");
(writeAtomic(path.join(root, "MANIFEST.md"), manifest),
  console.log(
    `Built ${entries.length} widgets with ${lite.length} lite-pack widgets.`,
  ));
