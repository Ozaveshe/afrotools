"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { normalizeReleaseOwnedHtml } = require("./lib/release-owned-html-normalizer.js");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "tools", "creator-captions", "app.html");
const outputDir = path.join(root, "sw", "zana", "caption-za-maudhui");
const output = path.join(outputDir, "app.html");
const swLocalizerVersion = crypto.createHash("md5")
  .update(fs.readFileSync(path.join(root, "assets/js/pages/creative/sw-creator-captions-localizer.js"), "utf8").replace(/\r\n?/g, "\n"))
  .digest("hex")
  .slice(0, 8);

const copy = new Map([
  ["CaptionCraft Workspace | AfroTools", "Sehemu ya Caption za Maudhui | AfroTools"],
  ["Sign in to CaptionCraft", "Ingia kwenye CaptionCraft"],
  ["Create AI-powered captions for Instagram, X, TikTok, LinkedIn and Facebook. Sign in to unlock unlimited generations and save your favorites.", "Tengeneza caption za Instagram, X, TikTok, LinkedIn na Facebook. Hali ya ndani inafanya kazi bila akaunti; ingia tu ukihitaji huduma za akaunti."],
  ["Sign In to Continue", "Ingia ili kuendelea"],
  ["Learn more about CaptionCraft", "Jifunze zaidi kuhusu CaptionCraft"],
  ["Write New", "Andika mpya"],
  ["Rewrite", "Boresha"],
  ["History", "Historia"],
  ["Favorites", "Vipendwa"],
  ["Sign Out", "Toka"],
  ["captions today", "caption leo"],
  ["saved", "zilizohifadhiwa"],
  ["in history", "kwenye historia"],
  ["What's the post about?", "Chapisho linahusu nini?"],
  ["Launching my new preset pack, celebrating 10k followers, behind-the-scenes...", "Kuzindua bidhaa mpya, kusherehekea wafuasi 10k, au kuonyesha maandalizi..."],
  ["Platform", "Jukwaa"],
  ["Tone", "Sauti"],
  ["Casual", "Ya kawaida"],
  ["Professional", "Ya kitaalamu"],
  ["Bold", "Ya ujasiri"],
  ["Playful", "Ya kufurahisha"],
  ["Inspirational", "Ya kutia moyo"],
  ["Educational", "Ya kuelimisha"],
  ["Caption Length", "Urefu wa caption"],
  ["Medium", "Wastani"],
  ["Language", "Lugha"],
  [">English<", ">Kiingereza<"],
  [">Pidgin English<", ">Kiingereza Pidgin<"],
  [">French<", ">Kifaransa<"],
  [">Swahili<", ">Kiswahili<"],
  [">Portuguese<", ">Kireno<"],
  ["Include", "Jumuisha"],
  ["Call to Action", "Wito wa kuchukua hatua"],
  ["Hashtags", "Hashtag"],
  ["Question", "Swali"],
  ["Hook First Line", "Kishawishi mstari wa kwanza"],
  ["Include call to action", "Jumuisha wito wa kuchukua hatua"],
  ["Include hashtags", "Jumuisha hashtag"],
  ["Include emojis", "Jumuisha emoji"],
  ["Include a question", "Jumuisha swali"],
  ["Include a hook", "Jumuisha kishawishi"],
  ["Optional AI assist", "Msaada wa AI wa hiari"],
  ["When checked, your topic, platform, tone and selected options are sent to AfroTools’ caption service. Leave unchecked to generate locally in this browser.", "Ukichagua kisanduku hiki, mada, jukwaa, sauti na chaguo zako zitatumwa kwa huduma ya caption ya AfroTools. Kiache bila kuchaguliwa ili kutengeneza kwenye kivinjari hiki pekee."],
  ["Generate Captions", "Tengeneza caption"],
  ["Your captions will appear here", "Caption zako zitaonekana hapa"],
  ["Describe your post, pick a platform and tone, then hit Generate.", "Eleza chapisho, chagua jukwaa na sauti, kisha bonyeza Tengeneza."],
  ["Paste your existing caption", "Bandika caption iliyopo"],
  ["Paste the caption you want to improve...", "Bandika caption unayotaka kuboresha..."],
  ["When checked, the pasted caption and platform are sent to AfroTools’ caption service. Leave unchecked to rewrite locally in this browser.", "Ukichagua kisanduku hiki, caption uliyobandika na jukwaa zitatumwa kwa huduma ya caption ya AfroTools. Kiache bila kuchaguliwa ili kuboresha kwenye kivinjari hiki pekee."],
  ["Rewrite Caption", "Boresha caption"],
  ["Paste a caption to rewrite", "Bandika caption ya kuboresha"],
  ["Get 3 improved versions with better hooks, formatting, and CTAs.", "Pata matoleo 3 yaliyoboreshwa yenye vishawishi, mpangilio na wito wa hatua ulio wazi."],
  ["A/B Compare", "Linganisha A/B"],
  ["selected", "zimechaguliwa"],
  ["Compare Side-by-Side", "Linganisha sambamba"],
  ["Clear", "Futa"],
  [">Write<", ">Andika<"],
  [">Rewrite<", ">Boresha<"],
  [">History<", ">Historia<"],
  [">Favorites<", ">Vipendwa<"]
]);

let html = fs.readFileSync(source, "utf8");
html = html
  .replace(/\n<link rel="alternate" hreflang="(?:en|fr|sw|x-default)" href="https:\/\/afrotools\.com\/(?:tools\/creator-captions|fr\/tools\/legendes-createur|sw\/zana\/caption-za-maudhui)\/app">/g, "")
  .replace(/\s*<script src="\/assets\/js\/analytics-bootstrap\.js[^>]*><\/script>\s*/g, "\n")
  .replace(/\s*<script src="\/assets\/js\/lazy-analytics\.js[^>]*><\/script>\s*/g, "\n")
  .replace('lang="en"', 'lang="sw"')
  .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*/g, "\n")
  .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/g, "\n")
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "\n")
  .replace('href="style.css?v=9083b950"', 'href="/tools/creator-captions/style.css?v=9083b950"')
  .replace('href="index.html"', 'href="/sw/zana/caption-za-maudhui/"')
  .replaceAll('href="index.html"', 'href="/sw/zana/caption-za-maudhui/"')
  .replace('/auth/?mode=login&amp;next=/tools/creator-captions/app.html', '/auth/?mode=login&amp;next=/sw/zana/caption-za-maudhui/app')
  .replace('<meta property="og:url" content="https://afrotools.com/tools/creator-captions/app">', [
    '<meta name="description" content="Tengeneza na uboreshe caption za mitandao ya kijamii kwa Kiswahili, hifadhi vipendwa na upakue TXT kwenye kivinjari chako.">',
    '<meta name="afrotools-sw-native-owner" content="creator-captions">',
    '<meta name="afrotools-sw-source-owner" content="scripts/build-sw-creator-captions-app.js">',
    '<meta property="og:title" content="Sehemu ya Caption za Maudhui | AfroTools">',
    '<meta property="og:description" content="Caption tatu za Kiswahili kwa kila mada, pamoja na historia, vipendwa na TXT ya ndani.">',
    '<meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-captions.webp">',
    '<meta property="og:url" content="https://afrotools.com/sw/zana/caption-za-maudhui/app">',
    '<meta property="og:locale" content="sw_TZ">'
  ].join("\n"))
  .replace('<link rel="canonical" href="https://afrotools.com/tools/creator-captions/app">', [
    '<link rel="canonical" href="https://afrotools.com/sw/zana/caption-za-maudhui/app">',
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-captions/app">',
    '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/legendes-createur/app">',
    '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/caption-za-maudhui/app">',
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-captions/app">',
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Caption za Maudhui","applicationCategory":"MultimediaApplication","operatingSystem":"Web","inLanguage":"sw","url":"https://afrotools.com/sw/zana/caption-za-maudhui/app","isBasedOn":"https://afrotools.com/tools/creator-captions/app","image":"https://afrotools.com/assets/img/tools/creator-captions.webp","offers":{"@type":"Offer","price":"0","priceCurrency":"TZS"}}</script>',
    '<style>',
    'html body[data-sw-creator-captions] :focus-visible{outline:3px solid #fbbf24!important;outline-offset:3px}',
    'body[data-sw-creator-captions] .ccr-pill-v2[role="radio"]{cursor:pointer}',
    'body[data-sw-creator-captions] .ccr-topbar-v2-tab,body[data-sw-creator-captions] .ccr-topbar-v2-email,body[data-sw-creator-captions] .ccr-topbar-v2-signout,body[data-sw-creator-captions] .ccr-stats-bar,body[data-sw-creator-captions] .ccr-sidebar-section-title,body[data-sw-creator-captions] .ccr-pill-v2,body[data-sw-creator-captions] .ccr-toggle-v2-label,body[data-sw-creator-captions] .ccr-empty,body[data-sw-creator-captions] .ccr-empty-title,body[data-sw-creator-captions] .ccr-output-card-chartext,body[data-sw-creator-captions] .ccr-act-btn,body[data-sw-creator-captions] .ccr-platform-tip,body[data-sw-creator-captions] .ccr-history-tone,body[data-sw-creator-captions] .ccr-history-time,body[data-sw-creator-captions] .ccr-history-count,body[data-sw-creator-captions] .ccr-fav-remove,body[data-sw-creator-captions] .ccr-compare-bar-text,body[data-sw-creator-captions] .ccr-bnav2-item,body[data-sw-creator-captions] .ccr-export-btn{color:#cbd5e1}',
    'body[data-sw-creator-captions] .ccr-input-v2::placeholder,body[data-sw-creator-captions] .ccr-fav-search::placeholder{color:#aeb9c8}',
    'html body[data-sw-creator-captions] .ccr-input-v2,html body[data-sw-creator-captions] .ccr-select-v2,html body[data-sw-creator-captions] .ccr-fav-search,html body[data-sw-creator-captions] .ccr-pill-v2,html body[data-sw-creator-captions] .ccr-act-btn,html body[data-sw-creator-captions] .ccr-export-btn{border-color:#94a3b8!important}',
    'html body[data-sw-creator-captions] .ccr-toggle-v2{border:1px solid #94a3b8!important}',
    'html body[data-sw-creator-captions] .ccr-generate-v2{background:#0369a1!important;color:#fff!important}',
    'html[data-theme="light"] body[data-sw-creator-captions]{background:#f8fafc!important;color:#0f172a!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2,html[data-theme="light"] body[data-sw-creator-captions] .ccr-bottom-nav-v2{background:#fff!important;border-color:#cbd5e1!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-sidebar,html[data-theme="light"] body[data-sw-creator-captions] .ccr-content-area,html[data-theme="light"] body[data-sw-creator-captions] .ccr-output-card,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-item,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-card,html[data-theme="light"] body[data-sw-creator-captions] .ccr-compare-col{background:#fff!important;border-color:#cbd5e1!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2-brand-text,html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2-tab,html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2-email,html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2-signout,html[data-theme="light"] body[data-sw-creator-captions] .ccr-stats-bar,html[data-theme="light"] body[data-sw-creator-captions] .ccr-sidebar-section-title,html[data-theme="light"] body[data-sw-creator-captions] .ccr-pill-v2,html[data-theme="light"] body[data-sw-creator-captions] .ccr-toggle-v2-label,html[data-theme="light"] body[data-sw-creator-captions] .ccr-empty,html[data-theme="light"] body[data-sw-creator-captions] .ccr-empty-title,html[data-theme="light"] body[data-sw-creator-captions] .ccr-output-card-chartext,html[data-theme="light"] body[data-sw-creator-captions] .ccr-act-btn,html[data-theme="light"] body[data-sw-creator-captions] .ccr-platform-tip,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-tone,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-time,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-topic,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-count,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-card-text,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-remove,html[data-theme="light"] body[data-sw-creator-captions] .ccr-compare-bar-text,html[data-theme="light"] body[data-sw-creator-captions] .ccr-compare-text,html[data-theme="light"] body[data-sw-creator-captions] .ccr-bnav2-item,html[data-theme="light"] body[data-sw-creator-captions] .ccr-export-btn{color:#334155!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-input-v2,html[data-theme="light"] body[data-sw-creator-captions] .ccr-select-v2,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-search,html[data-theme="light"] body[data-sw-creator-captions] .ccr-pill-v2,html[data-theme="light"] body[data-sw-creator-captions] .ccr-act-btn,html[data-theme="light"] body[data-sw-creator-captions] .ccr-export-btn{background:#fff!important;border-color:#64748b!important;color:#0f172a!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-input-v2::placeholder,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-search::placeholder{color:#475569!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-ai-consent{background:#eff6ff!important;border-color:#64748b!important;color:#334155!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] .ccr-topbar-v2-tab.active,html[data-theme="light"] body[data-sw-creator-captions] .ccr-pill-v2.active,html[data-theme="light"] body[data-sw-creator-captions] .ccr-bnav2-item.active,html[data-theme="light"] body[data-sw-creator-captions] .ccr-stats-bar strong,html[data-theme="light"] body[data-sw-creator-captions] .ccr-slider-val,html[data-theme="light"] body[data-sw-creator-captions] .ccr-output-card-label,html[data-theme="light"] body[data-sw-creator-captions] .ccr-history-platform,html[data-theme="light"] body[data-sw-creator-captions] .ccr-fav-card-platform,html[data-theme="light"] body[data-sw-creator-captions] .ccr-platform-tip strong{color:#075985!important}',
    'html[data-theme="light"] body[data-sw-creator-captions] :focus-visible{outline-color:#1d4ed8!important}',
    '</style>'
  ].join("\n"))
  .replace('<body class="ccr-app top-level-page-ui-refresh"', '<body class="ccr-app top-level-page-ui-refresh" data-sw-creator-captions')
  .replace(/(<script src="\/assets\/js\/pages\/creative\/creator-captions-app-controller\.js\?v=[a-f0-9]+"><\/script>)/, `<script src="/assets/js/pages/creative/sw-creator-captions-localizer.js?v=${swLocalizerVersion}"></script>\n$1`);

for (const [english, swahili] of copy) html = html.split(english).join(swahili);
html = html
  .replaceAll("rewriteJukwaaPills", "rewritePlatformPills")
  .replaceAll("tabAndika", "tabWrite")
  .replaceAll("tabBoresha", "tabRewrite")
  .replaceAll("tabHistoria", "tabHistory")
  .replaceAll("tabVipendwa", "tabFavorites")
  .replaceAll("statHistoria", "statHistory")
  .replaceAll("aiBoreshaConsent", "aiRewriteConsent")
  .replaceAll("compareFutaBtn", "compareClearBtn")
  .replaceAll('"inLugha"', '"inLanguage"');

html = html
  .replace(/id="topicInput"([^>]*?)aria-label="[^"]*"/, 'id="topicInput"$1aria-label="Mada au maelezo ya chapisho"')
  .replace(/aria-label="[^"]*"([^>]*?)id="lengthSlider"/, 'aria-label="Urefu wa caption"$1id="lengthSlider"')
  .replace(/id="langSelect"([^>]*?)aria-label="[^"]*"/, 'id="langSelect"$1aria-label="Lugha ya caption"')
  .replace(/id="rewriteInput"([^>]*?)aria-label="[^"]*"/, 'id="rewriteInput"$1aria-label="Caption ya kuboresha"')
  .replace('aria-label="Jumuisha call to action"', 'aria-label="Jumuisha wito wa kuchukua hatua"')
  .replace('aria-label="Jumuisha hashtags"', 'aria-label="Jumuisha hashtag"')
  .replace('aria-label="Jumuisha emojis"', 'aria-label="Jumuisha emoji"')
  .replace('aria-label="Jumuisha a question"', 'aria-label="Jumuisha swali"')
  .replace('aria-label="Jumuisha a hook"', 'aria-label="Jumuisha kishawishi"');

fs.mkdirSync(outputDir, { recursive: true });
const current = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
const normalizeOptions = { stripReleaseMetadata: true, stripRouteContractLinks: true };
const changed = normalizeReleaseOwnedHtml(current, normalizeOptions) !== normalizeReleaseOwnedHtml(html, normalizeOptions);
if (changed) fs.writeFileSync(output, html);
console.log(`${changed ? "Wrote" : "Checked"} ${path.relative(root, output)}`);
