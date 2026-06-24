const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "ai", "vertical-landing-pages.json");
const BASE_URL = "https://afrotools.com";
const promptExamples = require(path.join(ROOT, "assets", "js", "ai", "example-registry.js"));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
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

function renderStructuredData(page, data) {
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
          "url": BASE_URL + tool.href,
          "item": BASE_URL + tool.href,
          "name": tool.label
        }))
      }
    ]
  };
}

function renderPage(page, data) {
  const canonical = BASE_URL + page.path;
  const primaryPrompt = pagePrimaryPrompt(page);
  const examplePrompts = pageExamplePrompts(page);
  const prompt = promptHref(primaryPrompt);
  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.8446833d.min.js" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=optional" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=optional"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/bundles/core.be3f97db.min.js" defer></script>
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(page.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:image" content="${escapeHtml(BASE_URL + page.heroImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.metaTitle)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${escapeHtml(BASE_URL + page.heroImage)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(canonical)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}">
  <script type="application/ld+json">${jsonLd(renderStructuredData(page, data))}</script>
  <style>
    body{margin:0;background:#f8fafc;color:#0f172a;font-family:"DM Sans",system-ui,sans-serif}.ai-landing-hero{min-height:430px;display:flex;align-items:flex-end;background:#f8fafc;background-image:linear-gradient(90deg,rgba(248,250,252,.98),rgba(248,250,252,.92),rgba(248,250,252,.74)),var(--hero-image);background-size:cover;background-position:center;padding:56px 18px 34px;border-bottom:1px solid #dbe6f4}.ai-landing-wrap{width:min(1120px,100%);margin:0 auto}.ai-kicker{display:inline-flex;margin-bottom:12px;border:1px solid #bfe7cd;border-radius:8px;padding:7px 11px;color:#14723f;background:#edf9f1;font-size:.76rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.ai-landing-hero h1{max-width:760px;margin:0;color:#0f172a;font-size:clamp(2.1rem,5vw,4.2rem);line-height:1.02;letter-spacing:0;font-weight:900}.ai-hero-copy{max-width:760px;margin:14px 0 0;color:#52637a;font-size:1.04rem;line-height:1.68}.ai-hero-actions,.ai-actions-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.ai-primary,.ai-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:8px;padding:0 15px;font-weight:900;text-decoration:none}.ai-primary{background:#0057b8;color:#fff;border:1px solid #0057b8}.ai-secondary{background:#fff;color:#0057b8;border:1px solid #cbdff7}.ai-primary:hover,.ai-primary:focus-visible{background:#004c9f;border-color:#004c9f}.ai-secondary:hover,.ai-secondary:focus-visible{background:#f8fbff;border-color:#93c5fd}.ai-page-nav{background:#fff;border-top:1px solid #dbe6f4;border-bottom:1px solid #dbe6f4}.ai-page-nav .ai-landing-wrap{display:flex;gap:8px;overflow:auto;padding:10px 18px}.ai-page-nav a{white-space:nowrap;border:1px solid #dbe6f4;border-radius:8px;color:#475569;background:#fff;text-decoration:none;padding:8px 11px;font-size:.8rem;font-weight:900}.ai-page-nav a[aria-current="page"],.ai-page-nav a:hover{background:#eff6ff;color:#0057b8;border-color:#bfdbfe}.ai-content{padding:34px 18px 52px}.ai-section{margin-top:24px}.ai-section:first-child{margin-top:0}.ai-section h2{margin:0 0 10px;font-size:1.35rem;line-height:1.2}.ai-section p{color:#475569;line-height:1.7}.ai-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ai-card,.ai-tool,.ai-note,.ai-faq details{border:1px solid #dbe6f4;border-radius:8px;background:#fff;padding:14px}.ai-card strong,.ai-tool strong{display:block;color:#0f172a;font-size:.92rem}.ai-card span,.ai-tool span{display:block;margin-top:5px;color:#64748b;font-size:.84rem;line-height:1.55}.ai-tool{text-decoration:none;color:inherit}.ai-tool:hover,.ai-tool:focus-visible{border-color:#93c5fd;background:#f8fbff}.ai-two{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.ai-list{margin:0;padding-left:20px;color:#475569;line-height:1.65}.ai-prompt{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;padding:13px;color:#1e3a8a;text-decoration:none}.ai-prompt strong{display:block;color:#172554}.ai-prompt span{display:block;margin-top:3px;color:#1d4ed8;font-size:.82rem}.ai-note{background:#fffbeb;border-color:#fde68a}.ai-note strong{color:#92400e}.ai-faq details{margin-top:8px}.ai-faq summary{display:inline-flex;align-items:center;min-height:40px;cursor:pointer;color:#0f172a;font-weight:900}.ai-faq p{margin:8px 0 0}.ai-small-nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ai-small-nav a{border:1px solid #dbe6f4;border-radius:8px;background:#fff;color:#0057b8;text-decoration:none;padding:7px 10px;font-size:.82rem;font-weight:900}.ai-content *{box-sizing:border-box;min-width:0}.ai-content p,.ai-content li,.ai-content a,.ai-content span,.ai-content strong,.ai-page-nav a{overflow-wrap:anywhere}.ai-page-nav .ai-landing-wrap{-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-snap-type:x proximity}.ai-page-nav .ai-landing-wrap::-webkit-scrollbar{display:none}.ai-page-nav a,.ai-small-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;max-width:100%;line-height:1.25;text-align:center;scroll-snap-align:start}.ai-prompt,.ai-tool{min-height:72px;touch-action:manipulation}.ai-prompt strong{overflow-wrap:anywhere}.ai-primary,.ai-secondary,.ai-prompt,.ai-tool,.ai-small-nav a{touch-action:manipulation}.ai-primary:focus-visible,.ai-secondary:focus-visible,.ai-prompt:focus-visible,.ai-tool:focus-visible,.ai-page-nav a:focus-visible,.ai-small-nav a:focus-visible{outline:3px solid rgba(0,87,184,.22);outline-offset:3px}@media(max-width:820px){.ai-landing-hero{min-height:360px;padding:42px 14px 28px;background-image:linear-gradient(180deg,rgba(248,250,252,.98),rgba(248,250,252,.88)),var(--hero-image)}.ai-landing-hero h1{font-size:clamp(1.85rem,9vw,2.7rem);line-height:1.06}.ai-hero-copy{font-size:.95rem;line-height:1.55}.ai-content{padding:26px 14px 44px}.ai-grid,.ai-two{grid-template-columns:1fr}.ai-hero-actions,.ai-actions-row{display:grid}.ai-primary,.ai-secondary{width:100%;min-height:48px}.ai-prompt{display:grid;min-height:64px}.ai-page-nav .ai-landing-wrap{padding:10px 14px}.ai-page-nav a,.ai-small-nav a{white-space:normal}.ai-small-nav{display:grid;grid-template-columns:1fr}.ai-small-nav a{border-radius:8px}}
  </style>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main>
    <section class="ai-landing-hero" style="--hero-image:url('${escapeHtml(page.heroImage)}')">
      <div class="ai-landing-wrap">
        <span class="ai-kicker">${escapeHtml(page.kicker)}</span>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="ai-hero-copy">${escapeHtml(page.description)}</p>
        <div class="ai-hero-actions">
          <a class="ai-primary" href="${escapeHtml(prompt)}">Try this prompt</a>
          <a class="ai-secondary" href="#tools">Open the tools</a>
        </div>
      </div>
    </section>
    <nav class="ai-page-nav" aria-label="AfroTools AI verticals"><div class="ai-landing-wrap">${verticalNav(data, page.slug)}</div></nav>
    <div class="ai-content">
      <div class="ai-landing-wrap">
        <section class="ai-section ai-two" aria-labelledby="how-it-works">
          <div>
            <h2 id="how-it-works">How this helps</h2>
            <p>${escapeHtml(page.summary)}</p>
            <div class="ai-actions-row">
              <a class="ai-primary" style="background:#0057b8;color:#fff;border-color:#0057b8" href="${escapeHtml(prompt)}">Ask AfroTools AI</a>
              <a class="ai-secondary" style="background:#fff;color:#0057b8;border-color:#dbe6f4" href="/ai/">Open AI command page</a>
            </div>
          </div>
          <div class="ai-note">
            <strong>Privacy note</strong>
            <p>${escapeHtml(page.privacy)}</p>
          </div>
        </section>

        <section class="ai-section" aria-labelledby="use-cases">
          <h2 id="use-cases">Useful when you need to</h2>
          <div class="ai-grid">${page.useCases.map((item) => `<div class="ai-card"><strong>${escapeHtml(item.split(" ").slice(0, 5).join(" "))}</strong><span>${escapeHtml(item)}</span></div>`).join("")}</div>
        </section>

        <section class="ai-section" aria-labelledby="example-prompts">
          <h2 id="example-prompts">Example prompts</h2>
          <div class="ai-grid">${examplePrompts.map((item) => `<a class="ai-prompt" href="${escapeHtml(promptHref(item))}"><span><strong>${escapeHtml(item)}</strong><span>Opens the right AfroTools tool.</span></span></a>`).join("")}</div>
        </section>

        <section class="ai-section" id="tools" aria-labelledby="tools-title">
          <h2 id="tools-title">Tools this page can open</h2>
          <div class="ai-grid">${page.tools.map((tool) => `<a class="ai-tool" href="${escapeHtml(tool.href)}"><strong>${escapeHtml(tool.label)}</strong><span>${escapeHtml(tool.note)}</span></a>`).join("")}</div>
        </section>

        <section class="ai-section ai-two" aria-labelledby="limits-title">
          <div>
            <h2 id="limits-title">Limitations and verification</h2>
            <ul class="ai-list">${page.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
          <div>
            <h2>Related AI pages</h2>
            <div class="ai-small-nav">${data.verticals.filter((item) => item.slug !== page.slug).slice(0, 6).map((item) => `<a href="${escapeHtml(item.path)}">${escapeHtml(item.kicker)}</a>`).join("")}</div>
          </div>
        </section>

        <section class="ai-section ai-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">FAQ</h2>
          ${page.faqs.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}
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
}

main();
