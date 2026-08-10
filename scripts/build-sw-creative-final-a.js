"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const clipPage = require("./lib/build-sw-creator-clip-page.js");
const workspacePage = require("./lib/build-sw-creative-workspace-page.js");
const contentDepth = require("./lib/sw-creative-final-a-depth.js");
const apps = {
  afrostream: {
    slug: "afrostream",
    fr: "/fr/tools/afrostream-afrique-s-createur-streaming-hub/",
    title: "AfroStream kwa Kiswahili",
    description:
      "Gundua watayarishi wa Afrika kutoka data ya umma, chunguza freshness na tumia snapshot iliyowekwa wazi API inaposhindwa.",
    engine: "afrostream-engine.js",
    special: "afrostream",
    exports: [
      ["json", "Pakua JSON"],
      ["csv", "Pakua CSV"],
    ],
    boundary:
      "Data ya API inaweza kubadilika au kukosekana. Snapshot ya fallback huoneshwa kwa lebo na tarehe yake; thibitisha wasifu kwenye jukwaa asili.",
  },
  "creator-carousel": {
    slug: "carousel-ya-mitandao",
    fr: "/fr/tools/createur-de-carrousel/",
    title: "Kijenzi cha carousel",
    description:
      "Panga slaidi za mitandao ndani ya kivinjari na pakua mpango wa JSON au ukurasa wa HTML wa slaidi.",
    engine: "creator-final-wave-engine.js",
    fields: [
      t("headline", "Kichwa kikuu", "Hatua tano za kuanza podcast", 1),
      t("audience", "Hadhira", "Watayarishi wapya", 1),
      a(
        "points",
        "Hoja za slaidi — mstari mmoja kwa kila slaidi",
        "Chagua mada moja\nOnyesha ushahidi\nToa hatua ya vitendo",
        1,
      ),
      t("callToAction", "Mwito wa hatua", "Hifadhi carousel hii"),
      t("handle", "Jina la akaunti", "@afrotools"),
      t("background", "Rangi ya mandharinyuma", "#111827", 0, "color"),
      t("accent", "Rangi ya msisitizo", "#f59e0b", 0, "color"),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
      ["zip", "Pakua PNG zote (ZIP)"],
    ],
    boundary:
      "Huu ni mpangilio wa ndani wa slaidi. Hakiki maandishi, ukubwa wa jukwaa na haki za picha kabla ya kuchapisha.",
  },
  "creator-clip": {
    slug: "kukata-video-za-mtayarishi",
    fr: "/fr/tools/decoupe-de-video-pour-createur/",
    title: "Kikata video cha ndani",
    description:
      "Chagua video yako, weka muda wa klipu na rekodi WebM ndani ya kivinjari bila kupakia faili kwenye seva.",
    engine: "creator-clip-engine.js",
    special: "clip",
    exports: [
      ["webm", "Pakua WebM"],
      ["json", "Pakua taarifa JSON"],
    ],
    boundary:
      "MediaRecorder na codec hutegemea kivinjari. Sampuli ya sintetiki huthibitisha mtiririko wa WebM bila kamera; si uthibitisho wa kifaa halisi.",
  },
  "creator-desk": {
    slug: "dawati-la-mtayarishi",
    fr: "/fr/tools/bureau-du-createur/",
    title: "Dawati la miradi ya mtayarishi",
    description:
      "Ongeza miradi na wateja kwenye kikao cha ndani, kisha pakua rekodi zinazoweza kuhamishwa za JSON au CSV.",
    engine: "creator-desk-engine.js",
    special: "workspace",
    fields: [
      t("project", "Jina la mradi", "Picha za bidhaa", 1),
      t("client", "Mteja", "Biashara A", 1),
      s("status", "Hali", "active", [
        ["lead", "Matarajio"],
        ["active", "Inaendelea"],
        ["review", "Mapitio"],
        ["completed", "Imekamilika"],
      ]),
      n("value", "Thamani", 120000, 0),
      s("currency", "Sarafu", "KES", [
        "KES",
        "TZS",
        "UGX",
        "RWF",
        "XOF",
        "NGN",
        "ZAR",
        "USD",
      ]),
      t("due", "Tarehe ya mwisho", "2026-09-01", 0, "date"),
      a("notes", "Maelezo", "Picha 12 zilizohaririwa"),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["csv", "Pakua CSV"],
    ],
    boundary:
      "Rekodi hubaki katika kikao hiki hadi uzipakue. Usijumuishe siri za mteja zisizohitajika kwenye export.",
  },
  "creator-hashtags": {
    slug: "hashtag-za-maudhui",
    fr: "/fr/tools/hashtags-createur/",
    title: "Mchanganyiko wa hashtag",
    description:
      "Tengeneza makundi ya hashtag kwa mada na jukwaa kwa kanuni za ndani, bila kudai trend au reach ya moja kwa moja.",
    engine: "creator-hashtags-engine.js",
    special: "workspace",
    fields: [
      t("topic", "Mada ya chapisho", "Picha za harusi mjini Dar es Salaam", 1),
      s("platform", "Jukwaa", "instagram", [
        "instagram",
        "tiktok",
        "linkedin",
        "youtube",
      ]),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Mapendekezo si data hai ya trend wala dhamana ya reach. Kagua hashtag kwenye jukwaa kabla ya kuchapisha.",
  },
  "creator-hooks": {
    slug: "hook-za-video",
    fr: "/fr/tools/accroches-de-contenu-pour-createur/",
    title: "Hook za video",
    description:
      "Tengeneza hook sita za Kiswahili kwa mada yako kwa njia ya ndani, pamoja na makadirio ya muda wa kusoma.",
    engine: "creator-hooks-engine.js",
    fields: [
      t("topic", "Mada ya video", "Jinsi ya kuweka bei ya kazi ya ubunifu", 1),
      s("platform", "Jukwaa", "tiktok", [
        "tiktok",
        "reels",
        "shorts",
        "youtube",
      ]),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Hook ni rasimu ya ndani. Hakiki ukweli, takwimu, sauti ya kitamaduni na sheria za jukwaa.",
  },
  "creator-invoice": {
    slug: "ankara-ya-mtayarishi",
    fr: "/fr/tools/facture-createur/",
    title: "Ankara ya mtayarishi",
    description:
      "Kokotoa ankara ya kazi ya ubunifu kwa senti sahihi na pakua JSON, TXT au PDF ya ndani.",
    engine: "creator-invoice-engine.js",
    special: "workspace",
    pdf: true,
    fields: [
      t("issuer", "Jina la mtoa huduma", "Studio Kora", 1),
      t("client", "Jina la mteja", "Mteja wa mfano", 1),
      t("invoiceNumber", "Namba ya ankara", "INV-042", 1),
      t("description", "Huduma", "Picha za kampeni", 1),
      n("quantity", "Idadi", 2, 0.01),
      n("unitPrice", "Bei kwa kipengele", 50000, 0),
      s("currency", "Sarafu", "KES", [
        "KES",
        "TZS",
        "UGX",
        "RWF",
        "XOF",
        "NGN",
        "ZAR",
        "USD",
      ]),
      n("taxRate", "Kodi (%)", 16, 0, 100),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
      ["pdf", "Pakua PDF"],
    ],
    boundary:
      "Rasimu hii si ankara iliyowasilishwa wala ushauri wa kodi. Thibitisha VAT, withholding, masharti na taarifa za malipo.",
  },
  "creator-kit": {
    slug: "media-kit-ya-mtayarishi",
    fr: "/fr/tools/kit-media-pour-createur/",
    title: "Media kit na rate card",
    description:
      "Unda rate card ya ndani yenye huduma na mawasiliano. AI ni hiari, huonesha payload na inahitaji idhini wazi.",
    engine: "creator-kit-engine.js",
    ai: true,
    fields: [
      t("creator", "Jina la mtayarishi", "Amina Studio", 1),
      t("tagline", "Tagline", "Hadithi za biashara za Afrika"),
      t("service", "Huduma", "Video ya brand", 1),
      n("price", "Bei", 250000, 0),
      s("currency", "Sarafu", "KES", [
        "KES",
        "TZS",
        "UGX",
        "RWF",
        "XOF",
        "NGN",
        "ZAR",
        "USD",
      ]),
      a(
        "description",
        "Kinachojumuishwa",
        "Video moja, marekebisho mawili na haki za siku 30",
        1,
      ),
      t(
        "email",
        "Barua pepe ya mawasiliano",
        "studio@example.test",
        0,
        "email",
      ),
      t("whatsapp", "WhatsApp", "+254700000000"),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Takwimu na madai lazima yawe ya kweli. AI haitumiki hadi ukague payload na utoe idhini wazi; jenereta ya ndani hubaki mbadala kamili.",
  },
  "creator-mail": {
    slug: "barua-ya-mtayarishi",
    fr: "/fr/tools/courriels-pour-createur/",
    title: "Kijenzi cha newsletter",
    description:
      "Andika newsletter, hakiki nakala na pakua HTML, JSON au TXT bila kutuma barua wala kufuatilia wasomaji.",
    engine: "creator-mail-engine.js",
    fields: [
      t("subject", "Mada ya barua", "Habari mpya kutoka Studio Amina", 1),
      t("preheader", "Preheader", "Mradi mpya na hatua inayofuata"),
      t("headline", "Kichwa cha newsletter", "Tumezindua mfululizo mpya", 1),
      a(
        "body",
        "Ujumbe",
        "Asante kwa kufuatilia kazi yetu. Wiki hii tunashiriki mchakato wa kuunda video mpya na somo tulilojifunza.",
        1,
      ),
      t("cta", "Maandishi ya kitufe", "Tazama kazi"),
      t("url", "Kiungo cha CTA", "https://example.com"),
      t("sender", "Jina la mtumaji", "Amina Studio"),
    ],
    exports: [
      ["html", "Pakua HTML"],
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "AfroTools haitumi newsletter, haihifadhi orodha ya waliojisajili na haifuatilii opens. Ongeza anwani ya mtumaji na kiungo cha kujiondoa.",
  },
  "creator-mind": {
    slug: "mawazo-ya-mtayarishi",
    fr: "/fr/tools/idees-de-contenu-pour-createur/",
    title: "Mpangaji wa mawazo ya maudhui",
    description:
      "Tengeneza mawazo kumi ya Kiswahili kwa mada, hadhira na jukwaa kwa njia ya ndani na inayoweza kurudiwa.",
    engine: "creator-mind-engine.js",
    fields: [
      t("topic", "Mada", "Bei ya kazi ya ubunifu", 1),
      t("audience", "Hadhira", "Wabunifu wanaojiajiri", 1),
      s("platform", "Jukwaa", "instagram", [
        "instagram",
        "tiktok",
        "linkedin",
        "youtube",
        "podcast",
      ]),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Mawazo ni rasimu ya kanuni za ndani, si utafiti wa soko wala uthibitisho wa trend. Thibitisha vyanzo vya madai.",
  },
  "creator-money": {
    slug: "mapato-ya-mtayarishi",
    fr: "/fr/tools/revenus-du-createur/",
    title: "Mpango wa mapato ya mtayarishi",
    description:
      "Panga mapato, gharama, akiba ya kodi, malipo ya mmiliki na uwekezaji upya kwa kutumia thamani zako.",
    engine: "creator-money-engine.js",
    fields: [
      s("currency", "Sarafu", "KES", [
        "KES",
        "TZS",
        "UGX",
        "RWF",
        "XOF",
        "NGN",
        "ZAR",
        "USD",
      ]),
      n("income", "Mapato ya mwezi", 500000, 0),
      n("expenses", "Gharama za mwezi", 180000, 0),
      n("monthlyHours", "Saa za kazi kwa mwezi", 120, 1),
      n("taxRate", "Akiba ya kodi (%)", 10, 0, 100),
      n("ownerPayRate", "Malipo ya mmiliki (%)", 50, 0, 100),
      n("reinvestmentRate", "Uwekezaji upya (%)", 20, 0, 100),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
      ["copy", "Nakili mpango"],
    ],
    boundary:
      "Haya ni makadirio ya kupanga, si ushauri wa kodi au uwekezaji. Thibitisha viwango na mtaalamu wa eneo lako.",
  },
  "creator-page": {
    slug: "ukurasa-wa-mtayarishi",
    fr: "/fr/tools/page-createur/",
    title: "Ukurasa mmoja wa mtayarishi",
    description:
      "Unda ukurasa wa viungo unaohamishika na pakua HTML au JSON. AfroTools haiuhifadhi wala kuuchapisha.",
    engine: "creator-final-wave-engine.js",
    fields: [
      t("displayName", "Jina la kuonyesha", "Amina Studio", 1),
      a(
        "bio",
        "Wasifu mfupi",
        "Mtayarishi wa filamu anayeandika mafunzo ya uzalishaji kwa vitendo.",
        1,
      ),
      a(
        "links",
        "Viungo — Jina | https://...",
        "Portfolio | https://example.com\nYouTube | https://youtube.com",
        1,
      ),
      t("accent", "Rangi ya msisitizo", "#0b67d1", 0, "color"),
    ],
    exports: [
      ["html", "Pakua HTML"],
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Ni faili ya ndani inayohamishika; AfroTools haihosti ukurasa huu. Kagua viungo na faragha kabla ya kuchapisha.",
  },
  "creator-polish": {
    slug: "boresha-maudhui-ya-mtayarishi",
    fr: "/fr/tools/amelioration-de-contenu-pour-createur/",
    title: "Mapitio ya maandishi ya ndani",
    description:
      "Tambua sentensi ndefu, kurudiwa, nafasi na punctuation kwa kanuni wazi, kisha pakua JSON au TXT.",
    engine: "creator-polish-engine.js",
    fields: [
      a(
        "text",
        "Maandishi ya kukagua",
        "Mradi huu unaeleza kazi kwa uwazi.  Kazi inabaki ndani ya kivinjari.. Kazi inaweza kuhakikiwa tena kabla ya kuchapishwa.",
        1,
      ),
    ],
    exports: [
      ["json", "Pakua JSON"],
      ["txt", "Pakua TXT"],
    ],
    boundary:
      "Uchambuzi wa kanuni hauhakiki ukweli, sauti ya kitamaduni wala sarufi yote. Hakiki matokeo kwa binadamu.",
  },
};
function t(name, label, value, required, type) {
  return { name, label, value, required: !!required, type: type || "text" };
}
function a(name, label, value, required) {
  return {
    name,
    label,
    value,
    required: !!required,
    type: "textarea",
    wide: true,
  };
}
function n(name, label, value, min, max) {
  return {
    name,
    label,
    value,
    type: "number",
    required: true,
    min,
    max,
    step: "any",
  };
}
function s(name, label, value, options) {
  return {
    name,
    label,
    value,
    type: "select",
    required: true,
    options: options.map((x) =>
      Array.isArray(x) ? { value: x[0], label: x[1] } : x,
    ),
  };
}
function routeFile(route) {
  let clean = route.replace(/^\//, "").replace(/\/$/, "");
  return path.join(ROOT, clean, "index.html");
}
function ensureAlt(html, lang, href) {
  const tag = `<link rel="alternate" hreflang="${lang}" href="https://afrotools.com${href}">`,
    re = new RegExp(
      `<link\\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=["']${lang}["'])[^>]*>`,
      `i`,
    );
  return re.test(html)
    ? html.replace(re, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function j(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
function page(owner, cfg) {
  const canonical = `/sw/zana/${cfg.slug}/`,
    en = `/tools/${owner}/`,
    image = `/assets/img/tools/${owner}.webp`,
    schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: cfg.title,
      description: cfg.description,
      url: `https://afrotools.com${canonical}`,
      inLanguage: "sw",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      image: `https://afrotools.com${image}`,
      isAccessibleForFree: true,
    };
  let body;
  if (cfg.special === "afrostream")
    body = `<section class="swfa-card"><h2>Orodha iliyopakiwa</h2><div class="swfa-form"><div class="swfa-field"><label for="swfa-search">Tafuta katika wasifu</label><input id="swfa-search" data-search type="search" autocomplete="off"></div><div class="swfa-field"><label for="swfa-country">Nchi</label><select id="swfa-country" data-country><option value="">Nchi zote</option></select></div></div><p class="swfa-status" data-status role="status" aria-live="polite"></p><p data-freshness></p><div class="swfa-results" data-results></div><div class="swfa-actions" data-exports hidden>${buttons(cfg.exports)}</div></section><section class="swfa-note"><strong>Chanzo na freshness.</strong> API za umma za AfroStream husomwa wakati wa kufungua ukurasa. API ikishindwa, faili ya fallback yenye lebo, tarehe ya mapitio na hali ya metrics hutumika; ikiwa zote zimeshindwa hakuna data ya kubuni inayooneshwa.</section>`;
  else if (cfg.special === "clip")
    body = `<section class="swfa-grid"><form class="swfa-card"><h2>Video na muda</h2><div class="swfa-form"><div class="swfa-field wide"><label for="swfa-title">Jina la klipu</label><input id="swfa-title" name="title" value="Klipu ya kampeni" required></div><div class="swfa-field wide"><label for="swfa-file">Video ya ndani</label><input id="swfa-file" data-file name="file" type="file" accept="video/*"></div><div class="swfa-field"><label for="swfa-start">Mwanzo (sekunde au HH:MM:SS)</label><input id="swfa-start" name="start" value="0" required></div><div class="swfa-field"><label for="swfa-end">Mwisho</label><input id="swfa-end" name="end" value="1" required></div></div><div class="swfa-actions"><button class="swfa-button" type="submit">Kata video</button><button class="swfa-button secondary" type="button" data-synthetic>Rekodi sampuli ya WebM</button><button class="swfa-button secondary" type="button" data-reset>Weka upya</button></div></form><section class="swfa-card"><h2>Hakiki klipu</h2><p class="swfa-status" data-status role="status" aria-live="polite">Chagua video inayomilikiwa au tumia sampuli ya majaribio.</p><video class="swfa-media" controls hidden></video><div class="swfa-actions" data-exports hidden>${buttons(cfg.exports)}</div></section></section>`;
  else
    body = `<section class="swfa-grid"><form class="swfa-card" novalidate><h2>Taarifa za kazi</h2><div class="swfa-form" data-fields></div><div class="swfa-actions"><button class="swfa-button" type="submit">Tengeneza matokeo</button><button class="swfa-button secondary" type="button" data-reset>Weka upya</button></div></form><section class="swfa-card"><h2>Matokeo</h2><p class="swfa-status" data-status role="status" aria-live="polite"></p><div class="swfa-results" data-results hidden></div><div class="swfa-actions" data-exports hidden>${buttons(cfg.exports)}</div>${cfg.ai ? aiPanel() : ""}</section></section>`;
  const dataAttr =
    cfg.special === "afrostream"
      ? "data-swfa-afrostream"
      : cfg.special === "clip"
        ? "data-swfa-clip"
        : "data-swfa";
  const script =
    cfg.special === "afrostream"
      ? "sw-afrostream-final-a.js"
      : cfg.special === "clip"
        ? "sw-creator-clip-final-a.js"
        : "sw-creative-final-a.js";
  return `<!doctype html>\n<html lang="sw"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${cfg.title} | AfroTools</title><meta name="description" content="${cfg.description}"><meta name="robots" content="index, follow"><meta name="geo.region" content="002"><meta property="og:title" content="${cfg.title}"><meta property="og:description" content="${cfg.description}"><meta property="og:image" content="https://afrotools.com${image}"><meta property="og:url" content="https://afrotools.com${canonical}"><meta property="og:locale" content="sw_KE"><link rel="canonical" href="https://afrotools.com${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com${en}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${cfg.fr}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${canonical}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${en}"><link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/sw-creative-final-a.css"><script type="application/ld+json">${j(schema)}</script><script>(function(){try{var t=localStorage.getItem('aft_theme');var d=matchMedia('(prefers-color-scheme:dark)').matches;var a=t==='dark'||t==='light'?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.style.colorScheme=a;}catch(_){}})();</script></head><body class="swfa-page"><afro-navbar></afro-navbar><main class="swfa-shell" ${dataAttr} data-owner="${owner}"><header class="swfa-hero"><div><p class="swfa-eyebrow">Kiswahili · Zana ya mtayarishi · Local-first</p><h1>${cfg.title}</h1><p>${cfg.description}</p></div><img src="${image}" alt="${cfg.title}" width="600" height="400"></header>${body}<aside class="swfa-note"><strong>Mpaka wa matumizi.</strong> ${cfg.boundary}</aside><nav class="swfa-links" aria-label="Zana zinazohusiana"><a href="/sw/ubunifu-na-watayarishi/">Ubunifu na watayarishi</a><a href="/sw/picha-na-design/">Picha na design</a><a href="/sw/zana-zote/">Zana zote</a></nav></main><afro-footer></afro-footer>${cfg.special ? "" : `<script id="swfaConfig" type="application/json">${j({ owner, fields: cfg.fields })}</script>`}<script src="/engines/${cfg.engine}"></script>${owner === "creator-carousel" ? '<script src="/assets/vendor/jszip/jszip.min.js"></script>' : ""}${cfg.pdf ? '<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>' : ""}<script src="/assets/js/pages/creative/${script}"></script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/lib/dark-mode.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></body></html>\n`;
}
function buttons(items) {
  return items
    .map(
      ([kind, label]) =>
        `<button class="swfa-button secondary" type="button" data-export="${kind}">${label}</button>`,
    )
    .join("");
}
function aiPanel() {
  return `<section class="swfa-consent" data-ai-panel><h3>Msaidizi wa AI (hiari)</h3><p>Media kit ya ndani inafanya kazi bila AI. Ukichagua AI, kagua kwanza taarifa zitakazotumwa.</p><label><input type="checkbox" data-ai-consent> Nimekagua payload na nakubali kuituma kwa AfroTools AI kwa ombi hili.</label><div class="swfa-field"><label for="swfa-ai-preview">Payload ya kukagua</label><textarea id="swfa-ai-preview" data-ai-preview readonly></textarea></div><div class="swfa-actions"><button class="swfa-button secondary" type="button" data-ai-refresh>Sasisha onyesho</button><button class="swfa-button" type="button" data-ai-run>Tuma kwa AI</button></div></section>`;
}
for (const [owner, cfg] of Object.entries(apps)) {
  const enRoute = `/tools/${owner}/`,
    swRoute = `/sw/zana/${cfg.slug}/`;
  for (const [route, lang, href] of [
    [enRoute, "sw", swRoute],
    [cfg.fr, "sw", swRoute],
  ]) {
    const file = routeFile(route);
    if (!fs.existsSync(file))
      throw new Error(`${owner}: reciprocal file missing ${route}`);
    const before = fs.readFileSync(file, "utf8"),
      after = ensureAlt(before, lang, href);
    if (after !== before) fs.writeFileSync(file, after);
  }
  const target = routeFile(swRoute);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    contentDepth.inject(
      cfg.special === "clip" ? clipPage.build(ROOT) : cfg.special === "workspace" ? workspacePage.build(ROOT, owner, cfg) : page(owner, cfg),
      owner,
      swRoute,
    ),
  );
}
console.log(`Built ${Object.keys(apps).length} native Swahili Creative apps.`);
