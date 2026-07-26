const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "ai", "vertical-landing-pages.json");
const BUNDLE_MANIFEST_PATH = path.join(ROOT, "assets", "js", "bundles", "manifest.json");
const BASE_URL = "https://afrotools.com";
const promptExamples = require(path.join(ROOT, "assets", "js", "ai", "example-registry.js"));
const { imageSizeFromUrl } = require("./lib/image-size.js");

const COUNTRY_NAMES = { NG: "Nigeria", KE: "Kenya", GH: "Ghana", ZA: "South Africa" };

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function readBundlePaths() {
  const manifest = JSON.parse(fs.readFileSync(BUNDLE_MANIFEST_PATH, "utf8"));
  if (!manifest.core || !manifest.core.path || !manifest.chat || !manifest.chat.path) {
    throw new Error("generate-ai-landing-pages: bundle manifest is missing core or chat paths");
  }
  return { core: manifest.core.path, chat: manifest.chat.path };
}

/**
 * Real pixel dimensions of a site-root-relative image.
 *
 * og:image:width/height were previously hardcoded to 1200x630, which silently lied for any page
 * whose image was not that size. Social platforms lay out the preview from these hints before
 * fetching the file, so a wrong hint mis-renders the card. Throw rather than guess: a build that
 * fails is recoverable, a card that quietly lies is not.
 */
function imageSize(relativePath) {
  const size = imageSizeFromUrl(relativePath, ROOT);
  if (!size) {
    throw new Error(`generate-ai-landing-pages: cannot read image dimensions for ${relativePath}`);
  }
  return size;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function promptHref(prompt) {
  return "/ai/?q=" + encodeURIComponent(prompt);
}

function promptText(promptId, fallback) {
  return promptExamples.getPromptText(promptId, fallback || "");
}

function pagePrimaryPrompt(page) {
  return promptText(page.primaryPromptId, page.primaryPrompt);
}

function pageExamplePrompts(page) {
  if (Array.isArray(page.examplePromptIds) && page.examplePromptIds.length) {
    return page.examplePromptIds.map((id, index) => promptText(id, page.examplePrompts && page.examplePrompts[index])).filter(Boolean);
  }
  return Array.isArray(page.examplePrompts) ? page.examplePrompts : [];
}

function verticalNav(data, activeSlug) {
  return data.verticals.map((page) => {
    const active = page.slug === activeSlug ? ' aria-current="page"' : "";
    return `<a${active} href="${escapeHtml(page.path)}">${escapeHtml(page.kicker.replace(" AI", ""))}</a>`;
  }).join("");
}

function renderStructuredData(page) {
  const canonical = BASE_URL + page.path;
  const pageId = canonical + "#webpage";
  const breadcrumbId = canonical + "#breadcrumb";
  const faqId = canonical + "#faq";
  const toolsId = canonical + "#tools";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageId,
        "url": canonical,
        "name": page.metaTitle,
        "description": page.description,
        "isPartOf": { "@id": BASE_URL + "/" },
        "primaryImageOfPage": { "@type": "ImageObject", "url": BASE_URL + page.heroImage },
        "about": page.title,
        "breadcrumb": { "@id": breadcrumbId },
        "mainEntity": { "@id": toolsId }
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL + "/" },
          { "@type": "ListItem", "position": 2, "name": "AfroTools AI", "item": BASE_URL + "/ai/" },
          { "@type": "ListItem", "position": 3, "name": page.title, "item": canonical }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        "mainEntity": page.faqs.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      },
      {
        "@type": "ItemList",
        "@id": toolsId,
        "name": page.title + " tools",
        "itemListElement": page.tools.map((tool, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": tool.href.startsWith("http") ? tool.href : BASE_URL + tool.href,
          "item": tool.href.startsWith("http") ? tool.href : BASE_URL + tool.href,
          "name": tool.label
        }))
      }
    ]
  };
}

/* ── Demo card: the worked example, server-rendered ─────────────────────── */

function renderTranscriptCard(page, primaryPrompt) {
  const r = page.routing;
  const understood = r.understood.map((pair) =>
    `<span class="vl-chip"><em>${escapeHtml(pair.label)}</em>${escapeHtml(pair.value)}</span>`
  ).join("");
  const computed = r.computed ? `
        <div class="vl-t-row vl-t-row--computed">
          <span class="vl-t-tag">It computed</span>
          <div><strong>${escapeHtml(r.computed.label)}: ${escapeHtml(r.computed.value)}</strong><small>${escapeHtml(r.computed.caption)}</small></div>
        </div>` : "";
  return `
        <div class="vl-t-row">
          <span class="vl-t-tag">You ask</span>
          <p class="vl-t-prompt">&ldquo;${escapeHtml(primaryPrompt)}&rdquo;</p>
        </div>
        <div class="vl-t-row">
          <span class="vl-t-tag">It understood</span>
          <div class="vl-chips">${understood}</div>
        </div>${computed}
        <div class="vl-t-row">
          <span class="vl-t-tag">It asks</span>
          <p>${escapeHtml(r.asks)}</p>
        </div>
        <div class="vl-t-row">
          <span class="vl-t-tag">It opens</span>
          <p><a class="vl-t-open" href="${escapeHtml(r.opens.href)}">${escapeHtml(r.opens.label)}</a> &mdash; with these details already filled in</p>
        </div>
        <p class="vl-t-privacy">${escapeHtml(r.privacyLine)}</p>`;
}

function renderDemoCard(page, primaryPrompt) {
  const demo = page.demo || {};
  const isEngine = demo.type === "paye" || demo.type === "duty";
  const liveBlock = isEngine ? `
      <div class="vl-demo-live" data-demo-live hidden>
        <div class="vl-demo-live-head">${escapeHtml(demo.title)}</div>
        <div data-demo-rows></div>
        <p class="vl-demo-assumptions" data-demo-assumptions>${escapeHtml(demo.type === "duty" ? demo.assumptions : "")}</p>
        ${demo.type === "duty" ? `<p class="vl-demo-assumptions">${escapeHtml(demo.inputsLabel)}</p>` : ""}
        <a class="vl-demo-toollink" data-demo-tool href="${escapeHtml(demo.type === "duty" ? demo.toolHref : "#")}">${demo.type === "duty" ? `Open the ${escapeHtml(demo.toolLabel)} →` : ""}</a>
        <p class="vl-demo-note">${escapeHtml(demo.note)}</p>
      </div>` : `
      <p class="vl-demo-note">${escapeHtml(demo.note || "")}</p>`;
  return `
    <aside class="vl-demo" aria-label="Worked example">
      <div class="vl-demo-head"><span class="vl-demo-dot" aria-hidden="true"></span>${escapeHtml(isEngine ? "A real run — then real numbers" : (demo.title || "A real run, step by step"))}</div>
      <div class="vl-demo-body">${renderTranscriptCard(page, primaryPrompt)}${liveBlock}
        <a class="vl-demo-run" href="${escapeHtml(promptHref(primaryPrompt))}">Run this exact prompt yourself &rarr;</a>
      </div>
    </aside>`;
}

/* ── Country facts tabs ─────────────────────────────────────────────────── */

function renderCountrySection(page) {
  const facts = page.countryFacts;
  if (!facts) return "";
  const order = facts.order || [];
  const tabs = order.map((code, index) =>
    `<button type="button" class="vl-cf-tab" role="tab" data-cf-tab="${code}" aria-selected="${index === 0 ? "true" : "false"}">${escapeHtml(COUNTRY_NAMES[code] || code)}</button>`
  ).join("");
  const panels = order.map((code, index) => {
    const fact = facts[code];
    const links = (fact.links || []).map((link) =>
      `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)} &rarr;</a>`
    ).join("");
    return `<div class="vl-cf-panel" data-cf-panel="${code}"${index === 0 ? "" : " hidden"} role="tabpanel"><p>${escapeHtml(fact.line)}</p><div class="vl-cf-links">${links}</div></div>`;
  }).join("");
  const fallback = facts.default ? `<p class="vl-cf-default">${escapeHtml(facts.default.line)}</p>` : "";
  return `
      <section class="vl-section" aria-labelledby="cf-title">
        <h2 id="cf-title">Built for where you are</h2>
        <div class="vl-cf" role="tablist" aria-label="Country">${tabs}</div>
        ${panels}
        ${fallback}
      </section>`;
}

/* ── Page template ──────────────────────────────────────────────────────── */

function renderPage(page, data) {
  const canonical = BASE_URL + page.path;
  const bundles = readBundlePaths();
  const primaryPrompt = pagePrimaryPrompt(page);
  const examplePrompts = pageExamplePrompts(page);
  const accent = page.accent || { base: "#0062CC", soft: "#eef5ff", ink: "#0a3d7a" };
  const liveConfig = page.demo && (page.demo.type === "paye" || page.demo.type === "duty")
    ? `<script>window.AI_VERTICAL_LIVE=${jsonLd({ demo: page.demo })};</script>`
    : "";
  const chips = examplePrompts.map((item) =>
    `<a class="vl-chip-prompt" data-chip-prompt="${escapeHtml(item)}" href="${escapeHtml(promptHref(item))}">${escapeHtml(item)}</a>`
  ).join("");
  const useCases = page.useCases.map((item) =>
    `<div class="vl-card"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>`
  ).join("");
  const tools = page.tools.map((tool) =>
    `<a class="vl-tool" href="${escapeHtml(tool.href)}"><strong>${escapeHtml(tool.label)}</strong><span>${escapeHtml(tool.note)}</span><em aria-hidden="true">&rarr;</em></a>`
  ).join("");
  const limitations = page.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const faqs = page.faqs.map((item) =>
    `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`
  ).join("");
  const related = data.verticals.filter((item) => item.slug !== page.slug).map((item) =>
    `<a href="${escapeHtml(item.path)}">${escapeHtml(item.kicker)}</a>`
  ).join("");

  return `<!DOCTYPE html>
<html data-chat-bundle="${escapeHtml(bundles.chat)}" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=optional" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=optional"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="${escapeHtml(bundles.core)}" defer></script>
  <script src="/assets/js/ai/vertical-live.js" defer></script>
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(page.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:image" content="${escapeHtml(BASE_URL + page.heroImage)}">
  <meta property="og:image:width" content="${imageSize(page.heroImage).w}">
  <meta property="og:image:height" content="${imageSize(page.heroImage).h}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${escapeHtml(BASE_URL + page.heroImage)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(canonical)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}">
  <script type="application/ld+json">${jsonLd(renderStructuredData(page))}</script>
  ${liveConfig}
  <style>
    :root{--ac:${accent.base};--ac-soft:${accent.soft};--ac-ink:${accent.ink}}
    body{margin:0;background:#f8fafc;color:#0f172a;font-family:"DM Sans",system-ui,sans-serif}
    .vl-wrap{width:min(1120px,100%);margin:0 auto;padding:0 18px}
    .vl-hero{background:linear-gradient(160deg,var(--ac-soft) 0%,#f8fafc 62%,#fff 100%);border-bottom:1px solid #e2e8f0;padding:52px 0 44px}
    .vl-hero-grid{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);gap:34px;align-items:start}
    .vl-kicker{display:inline-flex;align-items:center;gap:7px;border:1px solid color-mix(in srgb,var(--ac) 28%,#fff);border-radius:999px;padding:6px 13px;color:var(--ac-ink);background:#fff;font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em}
    .vl-hero h1{margin:14px 0 0;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:clamp(2.1rem,4.6vw,3.4rem);line-height:1.04;letter-spacing:-.01em;color:#0f172a}
    .vl-promise{max-width:520px;margin:14px 0 0;color:#475569;font-size:1.05rem;line-height:1.65}
    .vl-ask{margin-top:22px}
    .vl-ask-form{display:flex;gap:8px;background:#fff;border:1px solid #cbd5e1;border-radius:14px;padding:7px;box-shadow:0 10px 30px rgba(15,23,42,.07)}
    .vl-ask-form:focus-within{border-color:var(--ac);box-shadow:0 10px 30px rgba(15,23,42,.07),0 0 0 3px color-mix(in srgb,var(--ac) 18%,transparent)}
    .vl-ask-form input{flex:1;min-width:0;border:0;outline:0;background:none;padding:10px 12px;font:inherit;font-size:.95rem;color:#0f172a}
    .vl-ask-form button{border:0;border-radius:9px;background:var(--ac);color:#fff;font-weight:800;font-size:.9rem;padding:0 18px;min-height:46px;cursor:pointer;white-space:nowrap}
    .vl-ask-form button:hover{filter:brightness(.94)}
    .vl-ask-hint{margin:9px 2px 0;color:#64748b;font-size:.78rem}
    .vl-chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .vl-chip-prompt{border:1px solid #dbe4f0;border-radius:999px;background:rgba(255,255,255,.8);color:#334155;text-decoration:none;padding:8px 13px;font-size:.8rem;font-weight:600;line-height:1.3;transition:border-color .15s,background .15s}
    .vl-chip-prompt:hover,.vl-chip-prompt:focus-visible{border-color:var(--ac);background:#fff;color:var(--ac-ink)}
    .vl-demo{background:#fff;border:1px solid #dbe4f0;border-radius:16px;box-shadow:0 18px 44px rgba(15,23,42,.09);overflow:hidden}
    .vl-demo-head{display:flex;align-items:center;gap:9px;background:#0b1526;color:#e2e8f0;font-size:.78rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:11px 16px}
    .vl-demo-dot{width:8px;height:8px;border-radius:999px;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.25)}
    .vl-demo-body{padding:16px}
    .vl-t-row{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;align-items:start;padding:8px 0;border-bottom:1px dashed #e8eef6}
    .vl-t-row p{margin:0;color:#334155;font-size:.88rem;line-height:1.55}
    .vl-t-tag{color:#94a3b8;font-size:.68rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding-top:3px}
    .vl-t-prompt{font-style:italic;color:#0f172a!important;font-weight:600}
    .vl-chips{display:flex;flex-wrap:wrap;gap:6px}
    .vl-chip{display:inline-flex;align-items:baseline;gap:6px;border:1px solid #dbe4f0;border-radius:7px;background:#f8fafc;padding:4px 9px;font-size:.78rem;color:#0f172a;font-weight:700}
    .vl-chip em{font-style:normal;color:#94a3b8;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .vl-t-row--computed div strong{display:block;color:var(--ac-ink);font-size:.9rem}
    .vl-t-row--computed div small{display:block;margin-top:3px;color:#64748b;font-size:.75rem;line-height:1.45}
    .vl-t-open{display:inline-block;background:var(--ac-soft);border:1px solid color-mix(in srgb,var(--ac) 30%,#fff);border-radius:7px;color:var(--ac-ink);font-weight:800;text-decoration:none;padding:3px 9px}
    .vl-t-open:hover{border-color:var(--ac)}
    .vl-t-privacy{margin:10px 0 0;color:#64748b;font-size:.76rem}
    .vl-demo-live{margin-top:14px;border:1px solid color-mix(in srgb,var(--ac) 24%,#fff);border-radius:12px;background:var(--ac-soft);padding:13px}
    .vl-demo-live-head{color:var(--ac-ink);font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px}
    .vl-demo-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;font-size:.87rem;color:#334155}
    .vl-demo-row strong{color:#0f172a;font-variant-numeric:tabular-nums}
    .vl-demo-row--total{border-top:1px solid color-mix(in srgb,var(--ac) 26%,#fff);margin-top:4px;padding-top:9px;font-weight:800}
    .vl-demo-row--total strong{color:var(--ac-ink);font-size:1rem}
    .vl-demo-assumptions{margin:9px 0 0;color:#64748b;font-size:.74rem;line-height:1.5}
    .vl-demo-toollink{display:inline-block;margin-top:9px;color:var(--ac-ink);font-weight:800;font-size:.84rem;text-decoration:none}
    .vl-demo-toollink:hover{text-decoration:underline}
    .vl-demo-note{margin:12px 0 0;color:#64748b;font-size:.76rem;line-height:1.5}
    .vl-demo-run{display:flex;align-items:center;justify-content:center;margin-top:14px;min-height:46px;border-radius:10px;background:var(--ac);color:#fff;font-weight:800;font-size:.9rem;text-decoration:none}
    .vl-demo-run:hover{filter:brightness(.94)}
    .vl-nav{background:#fff;border-bottom:1px solid #e2e8f0}
    .vl-nav .vl-wrap{display:flex;gap:8px;overflow:auto;padding-top:10px;padding-bottom:10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .vl-nav .vl-wrap::-webkit-scrollbar{display:none}
    .vl-nav a{display:inline-flex;align-items:center;min-height:40px;white-space:nowrap;border:1px solid #e2e8f0;border-radius:9px;color:#475569;background:#fff;text-decoration:none;padding:0 13px;font-size:.8rem;font-weight:800}
    .vl-nav a[aria-current="page"]{background:var(--ac-soft);color:var(--ac-ink);border-color:color-mix(in srgb,var(--ac) 34%,#fff)}
    .vl-nav a:hover{border-color:var(--ac)}
    .vl-main{padding:40px 0 58px}
    .vl-section{margin-top:38px}
    .vl-section:first-child{margin-top:0}
    .vl-section h2{margin:0 0 6px;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:1.65rem;letter-spacing:-.01em}
    .vl-section > p{margin:0 0 16px;color:#475569;line-height:1.7;max-width:680px}
    .vl-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
    .vl-card{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:16px}
    .vl-card strong{display:block;color:#0f172a;font-size:.95rem}
    .vl-card span{display:block;margin-top:6px;color:#64748b;font-size:.85rem;line-height:1.6}
    .vl-cf{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .vl-cf-tab{border:1px solid #dbe4f0;border-radius:999px;background:#fff;color:#475569;font:inherit;font-size:.82rem;font-weight:700;padding:9px 16px;min-height:42px;cursor:pointer}
    .vl-cf-tab[aria-selected="true"]{background:var(--ac);border-color:var(--ac);color:#fff}
    .vl-cf-panel{margin-top:14px;border:0;background:var(--ac-soft);border-radius:12px;padding:16px}
    .vl-cf-panel p{margin:0;color:#1e293b;font-size:.92rem;line-height:1.7}
    .vl-cf-links{display:flex;flex-wrap:wrap;gap:14px;margin-top:10px}
    .vl-cf-links a{color:var(--ac-ink);font-weight:800;font-size:.84rem;text-decoration:none}
    .vl-cf-links a:hover{text-decoration:underline}
    .vl-cf-default{margin:12px 0 0;color:#64748b;font-size:.82rem;line-height:1.6}
    .vl-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}
    .vl-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"label arrow" "note arrow";align-items:center;column-gap:12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:13px 15px;text-decoration:none;min-height:64px}
    .vl-tool strong{grid-area:label;color:#0f172a;font-size:.92rem}
    .vl-tool span{grid-area:note;margin-top:2px;color:#64748b;font-size:.8rem;line-height:1.45}
    .vl-tool em{grid-area:arrow;font-style:normal;color:#94a3b8;font-weight:700;transition:transform .15s,color .15s}
    .vl-tool:hover{border-color:var(--ac)}
    .vl-tool:hover em{color:var(--ac);transform:translateX(3px)}
    .vl-honest{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:14px;margin-top:16px}
    .vl-honest-card{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:18px}
    .vl-honest-card h3{margin:0 0 8px;font-size:.95rem;color:#0f172a}
    .vl-honest-card p{margin:0;color:#475569;font-size:.88rem;line-height:1.65}
    .vl-honest-card ul{margin:0;padding-left:18px;color:#475569;font-size:.88rem;line-height:1.65}
    .vl-honest-card li{margin-top:5px}
    .vl-faq{margin-top:16px}
    .vl-faq details{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:0 16px;margin-top:8px}
    .vl-faq summary{display:flex;align-items:center;min-height:50px;cursor:pointer;color:#0f172a;font-weight:700;font-size:.92rem}
    .vl-faq p{margin:0 0 14px;color:#475569;font-size:.88rem;line-height:1.65}
    .vl-related{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .vl-related a{display:inline-flex;align-items:center;min-height:42px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;color:#475569;text-decoration:none;padding:0 13px;font-size:.82rem;font-weight:800}
    .vl-related a:hover{border-color:var(--ac);color:var(--ac-ink)}
    .vl-main *,.vl-hero *{box-sizing:border-box;min-width:0}
    .vl-main p,.vl-main a,.vl-main span,.vl-main strong,.vl-hero p,.vl-hero a,.vl-hero strong{overflow-wrap:anywhere}
    a:focus-visible,button:focus-visible{outline:3px solid color-mix(in srgb,var(--ac) 30%,transparent);outline-offset:2px}
    /* Dark theme: dark-mode.js force-lightens generic h1/strong text sitewide,
       so every light surface here must darken with it or text goes invisible
       (the white-on-light bug class). */
    :root[data-theme="dark"] .vl-hero{background:linear-gradient(160deg,#0d1b2e 0%,#0b1728 55%,#09111f 100%);border-color:rgba(77,163,255,.16)}
    :root[data-theme="dark"] .vl-kicker{background:rgba(18,31,51,.8);border-color:rgba(77,163,255,.28);color:#93c5fd}
    :root[data-theme="dark"] .vl-promise,:root[data-theme="dark"] .vl-section > p{color:#b8c7dc}
    :root[data-theme="dark"] .vl-ask-form{background:rgba(18,31,51,.85);border-color:rgba(77,163,255,.28);box-shadow:0 10px 30px rgba(0,0,0,.35)}
    :root[data-theme="dark"] .vl-ask-form input{color:#eef5ff}
    :root[data-theme="dark"] .vl-ask-form input::placeholder{color:#7d90ab}
    :root[data-theme="dark"] .vl-ask-hint{color:#8fa3bf}
    :root[data-theme="dark"] .vl-chip-prompt{background:rgba(18,31,51,.7);border-color:rgba(77,163,255,.22);color:#b8c7dc}
    :root[data-theme="dark"] .vl-chip-prompt:hover,:root[data-theme="dark"] .vl-chip-prompt:focus-visible{background:rgba(18,31,51,.95);color:#93c5fd}
    :root[data-theme="dark"] .vl-demo{background:#0f1a2c;border-color:rgba(77,163,255,.24)}
    :root[data-theme="dark"] .vl-t-row{border-color:rgba(77,163,255,.14)}
    :root[data-theme="dark"] .vl-t-row p{color:#b8c7dc}
    :root[data-theme="dark"] .vl-t-prompt{color:#eef5ff!important}
    :root[data-theme="dark"] .vl-chip{background:rgba(18,31,51,.8);border-color:rgba(77,163,255,.2);color:#eef5ff}
    :root[data-theme="dark"] .vl-t-open{background:rgba(77,163,255,.13);border-color:rgba(147,197,253,.24);color:#93c5fd}
    :root[data-theme="dark"] .vl-t-privacy,:root[data-theme="dark"] .vl-demo-assumptions,:root[data-theme="dark"] .vl-demo-note,:root[data-theme="dark"] .vl-cf-default{color:#8fa3bf}
    :root[data-theme="dark"] .vl-demo-live{background:rgba(77,163,255,.08);border-color:rgba(77,163,255,.22)}
    :root[data-theme="dark"] .vl-demo-live-head,:root[data-theme="dark"] .vl-demo-toollink{color:#93c5fd}
    :root[data-theme="dark"] .vl-demo-row{color:#b8c7dc}
    :root[data-theme="dark"] .vl-demo-row strong{color:#eef5ff}
    :root[data-theme="dark"] .vl-demo-row--total{border-color:rgba(77,163,255,.26)}
    :root[data-theme="dark"] .vl-demo-row--total strong{color:#93c5fd}
    :root[data-theme="dark"] .vl-nav{background:#0b1526;border-color:rgba(77,163,255,.16)}
    :root[data-theme="dark"] .vl-nav a,:root[data-theme="dark"] .vl-related a{background:transparent;border-color:rgba(77,163,255,.22);color:#b8c7dc}
    :root[data-theme="dark"] .vl-nav a[aria-current="page"]{background:rgba(77,163,255,.13);border-color:rgba(147,197,253,.3);color:#93c5fd}
    :root[data-theme="dark"] .vl-card,:root[data-theme="dark"] .vl-tool,:root[data-theme="dark"] .vl-honest-card,:root[data-theme="dark"] .vl-faq details{background:rgba(18,31,51,.7);border-color:rgba(77,163,255,.18)}
    :root[data-theme="dark"] .vl-card span,:root[data-theme="dark"] .vl-tool span,:root[data-theme="dark"] .vl-honest-card p,:root[data-theme="dark"] .vl-honest-card ul,:root[data-theme="dark"] .vl-faq p{color:#b8c7dc}
    :root[data-theme="dark"] .vl-cf-tab{background:rgba(18,31,51,.7);border-color:rgba(77,163,255,.22);color:#b8c7dc}
    :root[data-theme="dark"] .vl-cf-tab[aria-selected="true"]{background:var(--ac);border-color:var(--ac);color:#fff}
    :root[data-theme="dark"] .vl-cf-panel{background:rgba(77,163,255,.1)}
    :root[data-theme="dark"] .vl-cf-panel p{color:#dbe7f6}
    :root[data-theme="dark"] .vl-cf-links a{color:#93c5fd}
    @media(max-width:900px){
      .vl-hero{padding:36px 0 34px}
      /* minmax(0,1fr), never bare 1fr: a nowrap chip row's min-content width
         would otherwise expand the column past the viewport. */
      .vl-hero-grid{grid-template-columns:minmax(0,1fr);gap:24px}
      .vl-grid3,.vl-tools,.vl-honest{grid-template-columns:minmax(0,1fr)}
      .vl-ask-form{flex-direction:column}
      .vl-ask-form button{min-height:48px}
      .vl-chip-row{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .vl-chip-row::-webkit-scrollbar{display:none}
      .vl-chip-prompt{flex:0 0 auto;white-space:nowrap}
      .vl-t-row{grid-template-columns:1fr;gap:4px}
    }
  </style>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main>
    <section class="vl-hero">
      <div class="vl-wrap">
        <div class="vl-hero-grid">
          <div>
            <span class="vl-kicker">${escapeHtml(page.kicker)}</span>
            <h1>${escapeHtml(page.title)}</h1>
            <p class="vl-promise">${escapeHtml(page.promise)}</p>
            <div class="vl-ask">
              <form class="vl-ask-form" action="/ai/" method="get">
                <input id="vlPrompt" name="q" type="text" placeholder="${escapeHtml(page.inputPlaceholder)}" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Describe your task">
                <button type="submit">Ask AfroTools AI</button>
              </form>
              <p class="vl-ask-hint">Private by default &middot; answers with figures in your local currency &middot; opens the right tool filled in</p>
              <div class="vl-chip-row">${chips}</div>
            </div>
          </div>
          ${renderDemoCard(page, primaryPrompt)}
        </div>
      </div>
    </section>
    <nav class="vl-nav" aria-label="AfroTools AI verticals"><div class="vl-wrap">${verticalNav(data, page.slug)}</div></nav>
    <div class="vl-main">
      <div class="vl-wrap">
        <section class="vl-section" aria-labelledby="how-title">
          <h2 id="how-title">How this helps</h2>
          <p>${escapeHtml(page.summary)}</p>
          <div class="vl-grid3">${useCases}</div>
        </section>
        ${renderCountrySection(page)}
        <section class="vl-section" id="tools" aria-labelledby="tools-title">
          <h2 id="tools-title">The tools it opens</h2>
          <p>Every route ends in a real calculator or document tool &mdash; the assistant fills in what it learned, and you stay in control of the numbers.</p>
          <div class="vl-tools">${tools}</div>
        </section>
        <section class="vl-section" aria-labelledby="honest-title">
          <h2 id="honest-title">Straight answers about limits</h2>
          <div class="vl-honest">
            <div class="vl-honest-card">
              <h3>What it will not do</h3>
              <ul>${limitations}</ul>
            </div>
            <div class="vl-honest-card">
              <h3>Privacy, plainly</h3>
              <p>${escapeHtml(page.privacy)}</p>
            </div>
          </div>
        </section>
        <section class="vl-section vl-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Questions people actually ask</h2>
          ${faqs}
        </section>
        <section class="vl-section" aria-labelledby="related-title">
          <h2 id="related-title">More AfroTools AI</h2>
          <div class="vl-related"><a href="/ai/">AI command page</a>${related}</div>
        </section>
      </div>
    </div>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

function writePage(page, data) {
  const outDir = path.join(ROOT, "ai", page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), renderPage(page, data));
}

function main() {
  const data = readData();
  data.verticals.forEach((page) => writePage(page, data));
  console.log(`Generated ${data.verticals.length} AfroTools AI landing pages.`);
  console.log("Run `npm run analytics:inject` next — regeneration strips the injected analytics loader, and a page without it ships dark (GA4 coverage loss, Jul 2026).");
}

main();
