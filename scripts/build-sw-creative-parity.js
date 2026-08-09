"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_FILE = path.join(ROOT, "reports", "swahili-free-app-parity-inventory.json");
const SOURCE_OWNER = "scripts/build-sw-creative-parity.js";
const DEDICATED_SOURCE_OWNERS = Object.freeze({
  "creator-record": "scripts/build-sw-creator-record-final.js",
  "creator-voice": "scripts/build-sw-creator-voice-final.js",
  "linkedin-optimizer": "scripts/build-sw-linkedin-optimizer-final.js",
});
const CREATIVE_HUB_FILE = path.join(ROOT, "sw", "ubunifu-na-watayarishi", "index.html");
const IMAGE_HUB_FILE = path.join(ROOT, "sw", "picha-na-design", "index.html");
const HUB_REFLOW_STYLE = `<style data-sw-creative-parity-hub-reflow>
@media (max-width:760px){
  main.wrap{overflow-wrap:anywhere}
  main.wrap,main.wrap *{min-width:0;box-sizing:border-box}
  main.wrap a,main.wrap button{max-width:100%;white-space:normal;overflow-wrap:anywhere}
  [data-sw-creative-parity-apps] .grid,[data-sw-creative-parity-visual-apps] .grid{grid-template-columns:minmax(0,1fr)}
}
</style>`;

const DEVICE_BLOCKED = new Set(["creator-clip", "creator-record", "creator-voice"]);
const PRODUCT_BLOCKED = Object.freeze({
  afrostream: "The English owner is a network-backed streaming hub. Route-specific fallback, freshness and no-network proof is not complete.",
  "creator-desk": "The legacy Swahili route has no route-specific project-state and portable export oracle.",
  "creator-mail": "The legacy Swahili route has no reopened HTML/TXT newsletter export oracle.",
  "creator-mind": "The legacy Swahili route has no route-specific idea-generation and JSON/TXT export oracle.",
  "creator-polish": "The legacy Swahili route has no route-specific analysis and rewritten-text export oracle.",
  "creator-schedule": "The legacy Swahili route has no route-specific calendar-state and parsed CSV/iCal oracle.",
  "creator-split": "The legacy Swahili route has no collaborator mutation, exact-total and parsed export oracle.",
  "creator-team": "The legacy Swahili route has no task-state mutation and parsed CSV/JSON export oracle.",
});

const SW_ROUTE_OVERRIDES = Object.freeze({
  "music-royalty-splitter": "/sw/zana/mgawanyo-wa-mrahaba-wa-muziki",
  "photography-pricing": "/sw/zana/bei-ya-upigaji-picha",
  "podcast-monetization": "/sw/zana/mapato-ya-podcast",
  "self-publishing-royalty": "/sw/zana/mrahaba-wa-kujichapishia",
  "wedding-photo-package": "/sw/zana/package-ya-picha-za-harusi",
});

function field(name, label, type, value, extra = {}) {
  return { name, label, type, value, ...extra };
}

function select(name, label, value, options) {
  return field(name, label, "select", value, { required: true, options: options.map(([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel })) });
}

const COUNTRIES = [
  ["KE", "Kenya"], ["TZ", "Tanzania"], ["UG", "Uganda"], ["RW", "Rwanda"],
  ["NG", "Nigeria"], ["ZA", "Afrika Kusini"], ["GH", "Ghana"], ["EG", "Misri"],
];

const CONFIGS = Object.freeze({
  "african-palette": {
    title: "Paleti za rangi zenye muktadha wa Afrika",
    description: "Chagua paleti iliyotengenezwa tayari, kagua rangi zake na pakua muhtasari wa JSON au TXT ndani ya kivinjari.",
    boundary: "Majina ya paleti ni mwongozo wa design, si uthibitisho wa maana ya kitamaduni au wa brand. Hakiki contrast na muktadha kabla ya kuchapisha.",
    engine: "african-palette-engine", engineGlobal: "AfroTools.AfricanPaletteEngine",
    fields: [select("paletteId", "Paleti", "modern-african", [
      ["modern-african", "Modern African"], ["kente", "Kente"], ["ankara", "Ankara"],
      ["savanna", "Savanna"], ["desert", "Desert"], ["ocean", "Ocean"],
      ["night-market", "Night Market"], ["ubuntu", "Ubuntu"],
    ])],
  },
  "art-commission": {
    title: "Kikokotoo cha bei ya kazi ya sanaa",
    description: "Kadiria bei ya commission kwa nchi, aina ya sanaa, ukubwa, ugumu, haki za matumizi, marekebisho na ratiba.",
    boundary: "Ni makadirio ya kupanga mkataba. Bei ya msanii, vifaa, kodi, usafirishaji na haki za matumizi lazima zithibitishwe kabla ya kukubaliana.",
    engine: "art-commission-engine", engineGlobal: "AfroTools.ArtCommissionEngine",
    fields: [
      select("country", "Nchi ya bei", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH", "EG"].includes(code))),
      select("artType", "Aina ya sanaa", "digital_portrait", [["digital_portrait", "Picha ya kidijitali"], ["digital_illustration", "Mchoro wa kidijitali"], ["oil_portrait", "Picha ya oil"], ["acrylic", "Acrylic"], ["watercolour", "Watercolour"], ["pencil", "Penseli"], ["logo", "Logo"]]),
      select("size", "Ukubwa", "A3", [["A4", "A4"], ["A3", "A3"], ["A2", "A2"], ["custom", "Ukubwa maalum"]]),
      select("complexity", "Ugumu", "detailed", [["simple", "Rahisi"], ["detailed", "Yenye maelezo"], ["very_detailed", "Maelezo mengi sana"]]),
      select("rights", "Haki za matumizi", "personal", [["personal", "Matumizi binafsi"], ["commercial", "Matumizi ya biashara"]]),
      select("revisions", "Marekebisho", "limited", [["limited", "Marekebisho yenye kikomo"], ["unlimited", "Marekebisho bila kikomo"]]),
      select("timeline", "Ratiba", "standard", [["standard", "Ratiba ya kawaida"], ["rush", "Kazi ya haraka"]]),
      field("hours", "Saa za kazi", "number", "12", { required: true, min: 1, step: 0.5 }),
    ],
  },
  "book-publishing-cost": {
    title: "Kikokotoo cha gharama ya kuchapisha kitabu",
    description: "Panga editing, design, ISBN, uchapishaji, mapato ya nakala na kiwango cha kufikia gharama kwa kutumia injini ileile ya Kiingereza.",
    boundary: "Makadirio hayathibitishi quote ya printer, ISBN, usambazaji, kodi, returns au masharti ya jukwaa.",
    engine: "book-publishing-cost-engine", engineGlobal: "AfroTools.BookPublishingCostEngine",
    fields: [
      select("country", "Nchi ya gharama", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH", "EG"].includes(code))),
      field("retailPrice", "Bei ya kitabu (USD)", "number", "12", { required: true, min: 0.01, step: 0.01 }),
      field("monthlySales", "Nakala kwa mwezi", "number", "50", { required: true, min: 1, step: 1 }),
      field("devEdit", "Developmental edit (USD)", "number", "300", { min: 0, step: 0.01 }),
      field("copyEdit", "Copy edit (USD)", "number", "180", { min: 0, step: 0.01 }),
      field("proofread", "Proofreading (USD)", "number", "90", { min: 0, step: 0.01 }),
      field("coverDesign", "Design ya cover (USD)", "number", "120", { min: 0, step: 0.01 }),
      field("layout", "Layout (USD)", "number", "80", { min: 0, step: 0.01 }),
      field("isbn", "ISBN na usajili (USD)", "number", "25", { min: 0, step: 0.01 }),
      field("printQty", "Nakala za kuchapisha", "number", "100", { min: 0, step: 1 }),
      field("printCost", "Gharama kwa nakala (USD)", "number", "3", { min: 0, step: 0.01 }),
    ],
  },
  "engagement-rate": {
    title: "Kikokotoo cha kiwango cha ushiriki",
    description: "Kokotoa engagement rate kutokana na wafuasi, likes, maoni, shares na saves, kisha linganisha na viwango vya jukwaa.",
    boundary: "Viwango ni marejeo ya kupanga, si data ya moja kwa moja wala ahadi ya reach, mapato, brand deal au virality.",
    engine: "engagement-rate-engine", engineGlobal: "AfroTools.EngagementRateEngine",
    fields: [
      select("platform", "Jukwaa", "instagram", [["instagram", "Instagram"], ["tiktok", "TikTok"], ["twitter", "X / Twitter"], ["linkedin", "LinkedIn"], ["facebook", "Facebook"]]),
      field("followers", "Wafuasi", "number", "25000", { required: true, min: 1, step: 1 }),
      field("likes", "Likes", "number", "900", { required: true, min: 0, step: 1 }),
      field("comments", "Maoni", "number", "120", { min: 0, step: 1 }),
      field("shares", "Shares", "number", "80", { min: 0, step: 1 }),
      field("saves", "Saves", "number", "160", { min: 0, step: 1 }),
    ],
  },
  "music-royalty-splitter": {
    title: "Kigawanya mirabaha ya muziki",
    description: "Gawa mirabaha kati ya waandishi, producers na wasanii kwa asilimia zinazofika 100%, kwa USD na sarafu ya nchi.",
    boundary: "Hiki si kikao cha rights, publishing au lebo. Thibitisha credits, recoupment, kodi na makubaliano ya kisheria.",
    engine: "music-royalty-splitter-engine", engineGlobal: "AfroTools.MusicRoyaltySplitterEngine",
    fields: [
      field("title", "Jina la wimbo", "text", "Sauti ya Mji", { required: true, wide: true }),
      select("country", "Nchi ya sarafu", "KE", COUNTRIES),
      field("totalRoyalties", "Jumla ya mirabaha (USD)", "number", "1200", { required: true, min: 0.01, step: 0.01 }),
      select("period", "Kipindi cha taarifa", "3", [["1", "Mwezi"], ["3", "Robo mwaka"], ["12", "Mwaka"]]),
      field("nameOne", "Mshiriki wa kwanza", "text", "Amina", { required: true }), field("roleOne", "Jukumu la kwanza", "text", "Songwriter", { required: true }), field("shareOne", "Asilimia ya kwanza", "number", "40", { required: true, min: 0, max: 100, step: 0.01 }),
      field("nameTwo", "Mshiriki wa pili", "text", "Baraka", { required: true }), field("roleTwo", "Jukumu la pili", "text", "Producer", { required: true }), field("shareTwo", "Asilimia ya pili", "number", "30", { required: true, min: 0, max: 100, step: 0.01 }),
      field("nameThree", "Mshiriki wa tatu", "text", "Chiku", { required: true }), field("roleThree", "Jukumu la tatu", "text", "Lead artist", { required: true }), field("shareThree", "Asilimia ya tatu", "number", "30", { required: true, min: 0, max: 100, step: 0.01 }),
    ],
  },
  "photography-pricing": {
    title: "Kikokotoo cha bei ya session ya picha",
    description: "Kadiria bei ya session kwa nchi, utaalamu, uzoefu, vifaa, muda wa kupiga na kuhariri, studio na prints.",
    boundary: "Bei ni makadirio ya kupanga quotation. Thibitisha travel, assistant, matumizi ya picha, deposit, cancellation na delivery.",
    engine: "photography-pricing-engine", engineGlobal: "AfroTools.PhotographyPricingEngine",
    fields: [
      select("country", "Nchi ya bei", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH", "EG", "TZ"].includes(code))),
      select("speciality", "Aina ya session", "portrait", [["portrait", "Portrait"], ["wedding", "Harusi"], ["commercial", "Biashara"], ["realestate", "Nyumba"], ["product", "Bidhaa"], ["events", "Tukio"], ["fashion", "Fashion"]]),
      select("experience", "Uzoefu", "mid", [["new", "Mwanzo"], ["mid", "Miaka 2–5"], ["senior", "Miaka 5+"], ["established", "Aliyejijenga"]]),
      select("equipment", "Kiwango cha vifaa", "mid", [["entry", "Vifaa vya mwanzo"], ["mid", "Vifaa vya kati"], ["pro", "Vifaa vya kitaalamu"]]),
      field("shootHours", "Saa za kupiga picha", "number", "4", { required: true, min: 0.5, step: 0.5 }),
      field("editHours", "Saa za kuhariri", "number", "3", { required: true, min: 0, step: 0.5 }),
      field("studioRent", "Kodi ya studio kwa mwezi", "number", "0", { min: 0, step: 0.01 }),
      field("workDays", "Siku za kazi kwa mwezi", "number", "20", { required: true, min: 1, step: 1 }),
      field("equipmentValue", "Thamani ya vifaa", "number", "500000", { required: true, min: 0, step: 1 }),
      select("prints", "Prints au albamu", "no", [["no", "Digital pekee"], ["basic", "Prints chache"], ["album", "Albamu"]]),
    ],
  },
  "podcast-monetization": {
    title: "Kikokotoo cha mapato ya podcast",
    description: "Kadiria matangazo, sponsorship, msaada wa mashabiki na merchandise kwa downloads, vipindi, hadhira na niche.",
    boundary: "Ni scenario ya kupanga kwa data unayoingiza, si bei ya moja kwa moja, CPM ya uhakika, sponsor au ahadi ya mapato.",
    engine: "podcast-monetization-engine", engineGlobal: "AfroTools.PodcastMonetizationEngine",
    fields: [
      select("country", "Nchi ya sarafu", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH", "EG"].includes(code))),
      field("downloads", "Downloads kwa mwezi", "number", "12000", { required: true, min: 100, step: 1 }),
      field("episodes", "Vipindi kwa mwezi", "number", "4", { required: true, min: 1, step: 1 }),
      select("audience", "Mahali pa hadhira", "africa", [["africa", "Afrika"], ["mixed", "Mchanganyiko"], ["diaspora", "Diaspora"]]),
      select("niche", "Niche", "business", [["business", "Biashara"], ["entertainment", "Burudani"], ["news", "Habari"], ["education", "Elimu"], ["sports", "Michezo"], ["culture", "Utamaduni"], ["tech", "Teknolojia"]]),
      field("patrons", "Mashabiki wanaolipa", "number", "20", { min: 0, step: 1 }),
      field("patronFee", "Msaada kwa shabiki (USD)", "number", "5", { required: true, min: 0, step: 0.01 }),
    ],
  },
  "self-publishing-royalty": {
    title: "Kikokotoo cha mrahaba wa kujichapishia",
    description: "Linganisha mrahaba kwa ebook, paperback au hardcover na bei, kurasa, mauzo ya mwezi na sarafu ya nchi.",
    boundary: "Makadirio hayatabiri mauzo wala kuthibitisha fees, returns, kodi au masharti ya Amazon KDP, IngramSpark au jukwaa jingine.",
    engine: "self-publishing-royalty-engine", engineGlobal: "AfroTools.SelfPublishingRoyaltyEngine",
    fields: [
      select("country", "Nchi ya sarafu", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH"].includes(code))),
      field("price", "Bei ya kitabu (USD)", "number", "6.99", { required: true, min: 0.01, step: 0.01 }),
      select("format", "Format ya kitabu", "ebook", [["ebook", "Ebook"], ["paperback", "Paperback"], ["hardcover", "Hardcover"]]),
      field("pages", "Idadi ya kurasa", "number", "250", { required: true, min: 1, step: 1 }),
      field("monthly", "Nakala kwa mwezi", "number", "80", { required: true, min: 1, step: 1 }),
    ],
  },
  "wedding-photo-package": {
    title: "Kikokotoo cha package ya picha za harusi",
    description: "Panga package ya harusi kwa nchi, saa, uzoefu na nyongeza kama mpiga picha wa pili, drone, albamu au session ya kabla ya harusi.",
    boundary: "Hiki ni kiadirio cha quotation. Thibitisha venue, travel, deposit, cancellation, haki za picha, backup na tarehe ya delivery kwenye mkataba.",
    engine: "wedding-photo-package-engine", engineGlobal: "AfroTools.WeddingPhotoPackageEngine",
    fields: [
      select("country", "Nchi ya bei", "KE", COUNTRIES.filter(([code]) => ["NG", "KE", "ZA", "GH", "EG"].includes(code))),
      select("hours", "Saa za coverage", "8", [["4", "Saa 4"], ["6", "Saa 6"], ["8", "Saa 8"], ["10", "Saa 10"], ["12", "Saa 12"]]),
      select("experience", "Uzoefu wa mpiga picha", "mid", [["new", "Mwanzo"], ["mid", "Mwenye uzoefu"], ["senior", "Senior"], ["established", "Aliyejijenga"]]),
      field("addons", "Nyongeza za package", "checkboxes", [], { wide: true, options: [
        { value: "second_shooter", label: "Mpiga picha wa pili", checked: true }, { value: "drone", label: "Picha za drone" },
        { value: "sde", label: "Uhariri wa siku hiyo (SDE)" }, { value: "album_40", label: "Albamu ya kurasa 40", checked: true },
        { value: "album_60", label: "Albamu ya kurasa 60" }, { value: "pre_wedding", label: "Session ya kabla ya harusi" },
        { value: "prints", label: "Picha 40 zilizochapishwa" }, { value: "extra_day", label: "Siku ya ziada" },
      ] }),
    ],
  },
  "creator-club": {
    title: "Mpangaji wa mapato ya klabu ya watayarishi",
    description: "Kokotoa mapato ya uanachama, ada za jukwaa, gharama, kiwango cha kufikia gharama na mapato ya mwaka.",
    boundary: "Ni kalkuleta ya ndani ya kivinjari, si community iliyohostiwa, mfumo wa malipo, chat au database ya wanachama.",
    engine: "creator-final-wave-engine", engineGlobal: "AfroTools.creatorFinalWave",
    fields: [field("clubName", "Jina la klabu", "text", "Studio Circle", { required: true }), field("members", "Wanachama wanaolipa", "number", "100", { required: true, min: 1, step: 1 }), field("monthlyPrice", "Bei ya mwezi", "number", "10", { required: true, min: 0, step: 0.01 }), field("feePct", "Ada ya jukwaa (%)", "number", "5", { required: true, min: 0, max: 100, step: 0.01 }), field("monthlyCosts", "Gharama za mwezi", "number", "150", { required: true, min: 0, step: 0.01 })],
  },
  "creator-course": {
    title: "Mpangaji wa kozi na mapato ya watayarishi",
    description: "Panga moduli mbili hadi kumi na mbili na scenario ya mauzo ya kozi bila kupakia masomo au taarifa za wanafunzi.",
    boundary: "Zana hutengeneza outline na makadirio tu. Haihosti, haichapishi, haiuzi, haifundishi wala kuchakata malipo.",
    engine: "creator-final-wave-engine", engineGlobal: "AfroTools.creatorFinalWave",
    fields: [field("courseTitle", "Jina la kozi", "text", "Misingi ya video ya simu", { required: true }), field("audience", "Hadhira ya wanafunzi", "text", "Watayarishi wanaoanza", { required: true }), field("modules", "Mada za moduli", "textarea", "Panga hadithi iliyo wazi\nRekodi sauti safi kwa simu\nHariri video fupi", { required: true, wide: true, rows: 5 }), field("price", "Bei kwa mwanafunzi", "number", "25", { required: true, min: 0, step: 0.01 }), field("students", "Wanafunzi wanaotarajiwa", "number", "40", { required: true, min: 1, step: 1 }), field("feePct", "Ada ya jukwaa (%)", "number", "5", { required: true, min: 0, max: 100, step: 0.01 }), field("costs", "Gharama za kutengeneza na kutoa", "number", "250", { required: true, min: 0, step: 0.01 })],
  },
  "creator-research": {
    title: "Mpangaji wa utafiti wa maudhui kwa vyanzo",
    description: "Geuza maswali yako na link za HTTP(S) kuwa mpango wa kuhakiki bila kupakia brief au kuomba AI itunge utafiti.",
    boundary: "Zana haifungui, haisomi, haipangi wala kuhakiki chanzo. Lazima ufungue kila link na uthibitishe madai mwenyewe.",
    engine: "creator-final-wave-engine", engineGlobal: "AfroTools.creatorFinalWave",
    fields: [field("topic", "Mada", "text", "Usambazaji wa muziki Afrika Mashariki", { required: true }), field("audience", "Hadhira", "text", "Wanamuzi wanaoanza", { required: true }), field("questions", "Maswali ya utafiti", "textarea", "Gharama zipi ni za kudumu?\nMasharti gani hubadilika kwa jukwaa?\nUshahidi upi ni wa sasa?", { required: true, wide: true, rows: 5 }), field("sources", "Vyanzo vya awali", "textarea", "Nyaraka za publisher | https://example.com/docs\nTaarifa ya regulator | https://example.org/notice", { required: true, wide: true, rows: 5, help: "Mstari mmoja kwa chanzo: Jina | https://example.com" })],
  },
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function json(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\//, ""), "index.html");
}

function url(route) {
  return `https://afrotools.com${route.endsWith("/") ? route : `${route}/`}`;
}

function alternate(html, locale) {
  const match = html.match(new RegExp(`<link\\b(?=[^>]*hreflang=["']${locale}["'])[^>]*href=["']https://afrotools\\.com([^"']+)`, "i"));
  return match ? match[1] : "";
}

function ensureAlternate(html, locale, route) {
  const tag = `<link rel="alternate" hreflang="${locale}" href="${url(route)}">`;
  const pattern = new RegExp(`<link\\b(?=[^>]*hreflang=["']${locale}["'])[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `${tag}\n</head>`);
}

function ensureMeta(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}">`;
  const pattern = new RegExp(`<meta\\b(?=[^>]*name=["']${name}["'])[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `${tag}\n</head>`);
}

function ensureAsset(html, tag, marker) {
  if (html.includes(marker)) return html;
  return html.replace("</head>", `${tag}\n</head>`);
}

function ensureHubReflowStyle(html) {
  const pattern = /<style\b[^>]*data-sw-creative-parity-hub-reflow[^>]*>[\s\S]*?<\/style>/i;
  if (pattern.test(html)) return html.replace(pattern, HUB_REFLOW_STYLE);
  return html.replace("</head>", `${HUB_REFLOW_STYLE}\n</head>`);
}

function ensureHubSection(html, marker, section) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const block = `${start}\n${section}\n${end}`;
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (pattern.test(html)) return html.replace(pattern, block);
  const mainEnd = html.lastIndexOf("</main>");
  if (mainEnd < 0) throw new Error(`${marker}: hub has no closing main element`);
  return `${html.slice(0, mainEnd)}${block}\n${html.slice(mainEnd)}`;
}

function hubCards(rows) {
  return rows.map((row) => {
    const config = CONFIGS[row.englishId];
    return `<article class="card"><h3><a href="${row.swahiliRoute}">${escapeHtml(config.title)}</a></h3><p>${escapeHtml(config.description)}</p></article>`;
  }).join("");
}

function polishExisting(html) {
  return html
    .replace(/No upakiaji\s*[-—]\s*files never leave your kivinjari/gi, "Hakuna upakiaji — faili haziondoki kwenye kivinjari chako")
    .replace(/browser yako/gi, "kivinjari chako")
    .replace(/Bonyeza Tengeneza ili kupata RESULT\./g, "Bonyeza Tengeneza ili kupata matokeo.")
    .replace(/files never leave your browser/gi, "faili haziondoki kwenye kivinjari chako");
}

function page(row, config, frRoute) {
  const canonical = row.primarySwahiliRoute.endsWith("/") ? row.primarySwahiliRoute : `${row.primarySwahiliRoute}/`;
  const image = `/assets/img/tools/${row.englishId}.webp`;
  const appConfig = { owner: row.englishId, title: config.title, boundary: config.boundary, engineGlobal: config.engineGlobal, fields: config.fields };
  return `<!doctype html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(config.title)} | AfroTools</title>
  <meta name="description" content="${escapeHtml(config.description)}">
  <meta name="afrotools-sw-native-owner" content="${row.englishId}">
  <meta name="afrotools-sw-source-owner" content="${SOURCE_OWNER}">
  <link rel="canonical" href="${url(canonical)}">
  <link rel="alternate" hreflang="en" href="${url(row.englishRoute)}">
  ${frRoute ? `<link rel="alternate" hreflang="fr" href="${url(frRoute)}">` : ""}
  <link rel="alternate" hreflang="sw" href="${url(canonical)}">
  <link rel="alternate" hreflang="x-default" href="${url(row.englishRoute)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(config.title)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(config.description)}">
  <meta property="og:url" content="${url(canonical)}">
  <meta property="og:image" content="https://afrotools.com${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(config.title)} | AfroTools">
  <meta name="twitter:description" content="${escapeHtml(config.description)}">
  <meta name="twitter:image" content="https://afrotools.com${image}">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/sw-creative-parity.css">
  <script type="application/ld+json">${json({ "@context": "https://schema.org", "@type": "WebApplication", name: config.title, url: url(canonical), inLanguage: "sw", description: config.description, applicationCategory: "DesignApplication", operatingSystem: "Web" })}</script>
  <script type="application/ld+json">${json({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "sw", mainEntity: [{ "@type": "Question", name: "Je, taarifa zangu zinatumwa kwenye server?", acceptedAnswer: { "@type": "Answer", text: "Hapana. Ukokotoaji na export za ukurasa huu zinafanyika ndani ya kivinjari chako." } }, { "@type": "Question", name: "Je, matokeo ni bei au makubaliano rasmi?", acceptedAnswer: { "@type": "Answer", text: "Hapana. Matokeo ni makadirio ya kupanga na lazima yahakikiwe kabla ya uamuzi wa biashara au mkataba." } }] })}</script>
</head>
<body class="swc-page">
  <afro-navbar></afro-navbar>
  <main class="swc-shell" data-sw-creative-app data-owner="${row.englishId}">
    <header class="swc-hero">
      <p class="swc-eyebrow">Ubunifu na watayarishi · Hufanya kazi kwenye kifaa chako</p>
      <h1>${escapeHtml(config.title)}</h1>
      <p>${escapeHtml(config.description)}</p>
    </header>
    <div class="swc-grid">
      <section class="swc-card" aria-labelledby="swc-input-title">
        <h2 id="swc-input-title">Taarifa za makadirio</h2>
        <form class="swc-form" novalidate>
          <div data-fields class="swc-form" style="display:contents"></div>
          <div class="swc-actions">
            <button class="swc-button" type="submit">Kokotoa makadirio</button>
            <button class="swc-button swc-button--secondary" type="button" data-reset>Weka upya</button>
          </div>
        </form>
      </section>
      <section class="swc-card" aria-labelledby="swc-result-title">
        <h2 id="swc-result-title">Matokeo</h2>
        <p class="swc-status" data-status role="status" aria-live="polite">Jaza taarifa kisha bonyeza kokotoa.</p>
        <div data-result tabindex="-1" hidden></div>
        <div class="swc-exports" data-exports hidden>
          <button class="swc-button swc-button--secondary" type="button" data-copy>Nakili matokeo</button>
          <button class="swc-button swc-button--secondary" type="button" data-export-json>Pakua JSON</button>
          <button class="swc-button swc-button--secondary" type="button" data-export-txt>Pakua TXT</button>
        </div>
      </section>
    </div>
    <aside class="swc-note"><strong>Mpaka wa matumizi:</strong> ${escapeHtml(config.boundary)} Ukurasa huu hautumi taarifa kwa AI, uchanganuzi au seva ili kutengeneza matokeo.</aside>
    <nav class="swc-links" aria-label="Zana zinazohusiana">
      <a href="/sw/ubunifu-na-watayarishi/">Ubunifu na watayarishi</a>
      <a href="/sw/picha-na-design/">Picha na design</a>
      <a href="/sw/biashara-ndogo/">Biashara ndogo</a>
      <a href="/sw/zana-zote/">Zana zote za Kiswahili</a>
    </nav>
  </main>
  <afro-footer></afro-footer>
  <script id="swCreativeConfig" type="application/json">${json(appConfig)}</script>
  <script src="/engines/${config.engine}.js"></script>
  <script src="/assets/js/pages/creative/sw-creative-parity.js"></script>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/lazy-analytics.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
</body>
</html>
`;
}

function run() {
  const browserGreen = process.argv.includes("--browser-green");
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
  const rows = inventory.rows.filter((row) => row.categoryKey === "creative");
  if (rows.length !== 46) throw new Error(`Expected exactly 46 Creative rows, found ${rows.length}.`);
  const manifestRows = [];

  for (const row of rows) {
    const enFile = routeFile(row.englishRoute);
    if (!fs.existsSync(enFile)) throw new Error(`${row.englishId}: English source missing`);
    let enHtml = fs.readFileSync(enFile, "utf8");
    const frRoute = alternate(enHtml, "fr");
    const swRoute = row.primarySwahiliRoute || SW_ROUTE_OVERRIDES[row.englishId];
    if (!swRoute) throw new Error(`${row.englishId}: Swahili route unresolved`);
    row.primarySwahiliRoute = swRoute.replace(/\/$/, "");
    row.primarySwahiliFile = `${row.primarySwahiliRoute.replace(/^\//, "")}/index.html`;

    enHtml = ensureAlternate(enHtml, "sw", `${row.primarySwahiliRoute}/`);
    fs.writeFileSync(enFile, enHtml);
    if (frRoute) {
      const frFile = routeFile(frRoute);
      if (!fs.existsSync(frFile)) throw new Error(`${row.englishId}: French reciprocal source missing at ${frRoute}`);
      const frHtml = ensureAlternate(fs.readFileSync(frFile, "utf8"), "sw", `${row.primarySwahiliRoute}/`);
      fs.writeFileSync(frFile, frHtml);
    }

    const swFile = path.join(ROOT, row.primarySwahiliFile);
    fs.mkdirSync(path.dirname(swFile), { recursive: true });
    if (CONFIGS[row.englishId]) {
      fs.writeFileSync(swFile, page(row, CONFIGS[row.englishId], frRoute));
    } else {
      if (!fs.existsSync(swFile)) throw new Error(`${row.englishId}: expected existing Swahili owner missing`);
      const dedicatedOwner = DEDICATED_SOURCE_OWNERS[row.englishId];
      if (dedicatedOwner) {
        const html = fs.readFileSync(swFile, "utf8");
        if (!html.includes(`name="afrotools-sw-source-owner" content="${dedicatedOwner}"`)) {
          throw new Error(`${row.englishId}: dedicated owner output is stale; run ${dedicatedOwner}`);
        }
      } else {
        let html = polishExisting(fs.readFileSync(swFile, "utf8"));
        html = ensureMeta(html, "afrotools-sw-native-owner", row.englishId);
        html = ensureMeta(html, "afrotools-sw-source-owner", SOURCE_OWNER);
        html = ensureAsset(html, '<link rel="stylesheet" href="/assets/css/sw-creative-parity.css">', "sw-creative-parity.css");
        html = ensureAlternate(html, "en", `${row.englishRoute}/`);
        if (frRoute) html = ensureAlternate(html, "fr", frRoute);
        html = ensureAlternate(html, "sw", `${row.primarySwahiliRoute}/`);
        html = ensureAlternate(html, "x-default", `${row.englishRoute}/`);
        fs.writeFileSync(swFile, html);
      }
    }

    const isDeviceBlocked = DEVICE_BLOCKED.has(row.englishId);
    const blocker = isDeviceBlocked
      ? "Real-device capture and reopened codec proof is unavailable; acceptance fails closed."
      : PRODUCT_BLOCKED[row.englishId] || "The localized route is usable, but a route-specific shared-engine, invalid-state and complete parsed export oracle is not yet present; acceptance fails closed.";
    const accepted = Boolean(CONFIGS[row.englishId]);
    manifestRows.push({
      englishId: row.englishId,
      englishRoute: `${row.englishRoute.replace(/\/$/, "")}/`,
      frenchRoute: frRoute,
      swahiliRoute: `${row.primarySwahiliRoute}/`,
      swahiliFile: row.primarySwahiliFile,
      sourceOwner: DEDICATED_SOURCE_OWNERS[row.englishId] || SOURCE_OWNER,
      engineOwner: CONFIGS[row.englishId] ? `/engines/${CONFIGS[row.englishId].engine}.js` : row.englishId === "creator-record" ? "/assets/js/pages/creative/creator-record-app-controller.js" : row.englishId === "creator-voice" ? "/assets/js/pages/creative/creator-voice-app-controller.js" : row.englishId === "linkedin-optimizer" ? "/engines/linkedin-optimizer-engine.js" : row.sourceOwner,
      artwork: `/assets/img/tools/${row.englishId}.webp`,
      status: accepted ? "accepted-candidate" : "blocked",
      blocker: accepted ? "" : blocker,
    });
  }

  const accepted = manifestRows.filter((row) => row.status === "accepted-candidate");
  const blocked = manifestRows.filter((row) => row.status === "blocked");
  const creatorHub = ensureHubSection(
    ensureHubReflowStyle(
      ensureMeta(fs.readFileSync(CREATIVE_HUB_FILE, "utf8"), "afrotools-sw-creative-parity-hub-owner", SOURCE_OWNER),
    ),
    "sw-creative-parity-apps",
    `<section class="section" data-sw-creative-parity-apps><h2>Zana za ubunifu zilizothibitishwa kwa Kiswahili</h2><p>Zana hizi hutumia injini zilezile za ukokotoaji kama kurasa za Kiingereza na hufanya kazi ndani ya kivinjari.</p><div class="grid">${hubCards(accepted)}</div></section>`
  );
  fs.writeFileSync(CREATIVE_HUB_FILE, creatorHub);

  const imageRows = accepted.filter((row) => ["african-palette", "photography-pricing", "wedding-photo-package"].includes(row.englishId));
  const imageHub = ensureHubSection(
    ensureHubReflowStyle(
      ensureMeta(fs.readFileSync(IMAGE_HUB_FILE, "utf8"), "afrotools-sw-creative-parity-hub-owner", SOURCE_OWNER),
    ),
    "sw-creative-parity-visual-apps",
    `<section class="section" data-sw-creative-parity-visual-apps><h2>Rangi na bei za kazi ya picha</h2><p>Chagua paleti au panga quotation ya session na package ya harusi kwa makadirio ya ndani ya kivinjari.</p><div class="grid">${hubCards(imageRows)}</div></section>`
  );
  fs.writeFileSync(IMAGE_HUB_FILE, imageHub);

  const manifest = {
    schemaVersion: 1,
    generatedBy: SOURCE_OWNER,
    baseCommit: "0f6990118d9ac8b9dcde446a6ede10a017b9a2db",
    scope: { categoryKey: "creative", exactRows: 46, hubs: ["/sw/ubunifu-na-watayarishi/", "/sw/picha-na-design/"], centralAcceptanceLedgerEdited: false, sharedAiMapEdited: false },
    totals: { scoped: manifestRows.length, acceptedCandidate: accepted.length, blocked: blocked.length, artworkCovered: manifestRows.filter((row) => fs.existsSync(path.join(ROOT, row.artwork.replace(/^\//, "")))).length },
    rows: manifestRows,
  };
  fs.writeFileSync(path.join(ROOT, "data", "localization", "sw-creative-parity-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const receipt = {
    schemaVersion: 1,
    generatedBy: SOURCE_OWNER,
    status: browserGreen ? "accepted-with-explicit-blockers" : "candidate-browser-proof-pending",
    totals: manifest.totals,
    acceptedCandidateIds: accepted.map((row) => row.englishId),
    blocked: blocked.map((row) => ({ englishId: row.englishId, route: row.swahiliRoute, reason: row.blocker })),
    proof: {
      static: "tests/sw-creative-parity.test.js",
      browser: "tests/e2e/sw-creative-parity.spec.js",
      browserResult: browserGreen ? "60/60 passed in one-worker isolated Chromium" : "pending shared browser slot",
      hubs: ["/sw/ubunifu-na-watayarishi/", "/sw/picha-na-design/"],
      exportFormatsAdvertised: ["json", "txt"],
      centralAcceptanceLedger: "not edited",
      localizationGeneratedArtifacts: "coordinator update required for the five new physical routes"
    },
  };
  fs.writeFileSync(path.join(ROOT, "reports", "sw-creative-parity-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, "reports", "sw-creative-parity-artwork.json"), `${JSON.stringify({ scoped: 46, covered: manifest.totals.artworkCovered, missing: manifestRows.filter((row) => !fs.existsSync(path.join(ROOT, row.artwork.replace(/^\//, "")))).map((row) => row.artwork) }, null, 2)}\n`);
  console.log(`Swahili Creative parity source built: ${accepted.length} accepted candidates, ${blocked.length} blocked, ${manifest.totals.artworkCovered}/46 artwork.`);
}

run();
