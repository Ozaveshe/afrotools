"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const CHECKED = "30 Julai 2026";
const SCOPE = require("../data/localization/sw-sports-travel-parity-manifest.json");
const SPORTS_SOURCES = require("../data/sports/source-assumption-manifest.json");
const SPORTS_SOURCE_COPY = require("../data/sports/sw-source-assumption-copy.json");
const { renderOwnerWorkflow } = require("./lib/swahili-travel-pages.js");

const META = {
  "betting-odds": ["Kikokotoo cha uwezekano wa kamari", "Badili odds na ukokotoe uwezekano, thamani inayotarajiwa na malipo kwa fedha yako.", "Makadirio ya kupanga tu; si ushauri wa kamari wala hakikisho la ushindi.", "Juu kwa hesabu; chini kwa matokeo ya mchezo."],
  "afcon-predictor": ["Kitabiri cha mashindano ya AFCON", "Pima timu 24 kwa modeli ya AFCON inayotumia nguvu, kiwango, ulinzi na faida ya mwenyeji.", "Modeli ya kupanga maudhui, si utabiri rasmi wala taarifa ya moja kwa moja.", "Wastani; hutegemea mawazo uliyoingiza."],
  "fantasy-football": ["Kikokotoo cha alama za Fantasy Football", "Kokotoa alama za FPL kwa nafasi, dakika, mabao, pasi, ulinzi na bonasi.", "Alama rasmi zinaweza kurekebishwa baada ya mchezo; hakiki FPL.", "Juu kwa kanuni zilizoorodheshwa; si alama ya mwisho rasmi."],
  "betting-tax": ["Kikokotoo cha kodi ya kamari", "Kadiria ushuru wa dau, zuio la ushindi na malipo halisi kwa soko ulilochagua.", "Makadirio ya kupanga tu; hakiki mamlaka ya kodi na leseni ya kampuni kabla ya kufungua jalada.", "Wastani; viwango vinaweza kubadilika na hutegemea mamlaka."],
  "streaming-royalties": ["Kikokotoo cha mirabaha ya muziki", "Kadiria mapato ya utiririshaji kwa majukwaa, mgawanyo, ada na marejesho ya malipo ya awali.", "Majukwaa hayalipi kiwango kimoja kwa kila mtiririko; tumia kama safu ya kupanga.", "Chini hadi wastani; malipo halisi hutegemea mkataba na mgao wa mitiririko."],
  "nollywood-box-office": ["Kikokotoo cha mapato ya sinema ya Nollywood", "Pima mauzo ya tiketi, mgao wa sinema, usambazaji, streaming na urejeshaji wa mwekezaji.", "Makadirio ya biashara tu; si ahadi ya mauzo, usambazaji au faida.", "Wastani; hutegemea viingilio na mikataba uliyoingiza."],
  "dj-booking-rate": ["Kikokotoo cha bei ya DJ", "Tengeneza bei ya DJ kwa soko, tukio, uzoefu, muda, vifaa, safari na tarehe yenye mahitaji.", "Mwongozo wa bei, si nukuu ya soko au ahadi ya nafasi.", "Wastani; kiwango cha msingi ni cha kupanga na kinahitaji nukuu ya ndani."],
  "concert-budget": ["Mpangaji wa bajeti ya tamasha", "Panga mapato ya tiketi na udhamini dhidi ya wasanii, ukumbi, uzalishaji, usalama na akiba.", "Makadirio ya kupanga tu; vibali, usalama, bima na upatikanaji lazima vihakikiwe.", "Wastani; hutegemea bei na mahudhurio uliyoingiza."],
  "gym-roi-business": ["Kikokotoo cha faida ya biashara ya gym", "Pima mapato ya wanachama, wanaoondoka, gharama za kupata wateja na muda wa kurejesha uwekezaji.", "Makadirio ya biashara tu; si ushauri wa uwekezaji au mkopo.", "Wastani; hutegemea gharama na uhifadhi wa wanachama."],
  "event-ticket-revenue": ["Kikokotoo cha mapato ya tiketi za tukio", "Kokotoa tiketi za VIP, kawaida, mwanafunzi na za mapema baada ya ada na marejesho.", "Makadirio ya kupanga tukio; si taarifa ya mauzo au upatikanaji wa tiketi.", "Juu kwa hesabu; hutegemea kiasi na ada ulizoingiza."],
  "match-tickets": ["Kilinganisha bei ya tiketi za mechi", "Kadiria gharama ya tiketi, ada, usafiri, chakula na pasi ya msimu kwa nchi yako.", "Hakiki tiketi na njia ya mauzo kwa klabu au muuzaji rasmi; hakuna bei ya moja kwa moja.", "Wastani; bei ya msingi ni makisio ya kupanga."],
  "sports-scholarship": ["Tathmini ya utayari wa ufadhili wa michezo", "Pima njia, kiwango cha mashindano, masomo, video, nyaraka na mawasiliano ya kocha.", "Si uamuzi wa ustahiki, udahili, visa au ufadhili; taasisi husika ndiyo huamua.", "Wastani kwa utayari; hakuna hakikisho la nafasi."],
  "athlete-earnings": ["Mpangaji wa mapato ya mwanariadha", "Panga mshahara, bonasi, udhamini, ada ya wakala, akiba ya kodi, jeraha na kustaafu.", "Makadirio ya kupanga fedha; si ushauri wa kodi, mkataba au uwekezaji.", "Wastani; hutegemea mkataba na viwango ulivyoingiza."],
  "gaming-pc-build": ["Mpangaji wa kompyuta ya michezo", "Gawa bajeti kwa GPU, CPU, RAM, storage na nguvu kwa bei ya ndani au uagizaji.", "Makadirio ya kupanga; hakiki bei, ulinganifu, dhamana na umeme kabla ya kununua.", "Wastani; marekebisho ya soko ni ya kupanga."],
  "photo-video-pricing": ["Kikokotoo cha bei ya picha na video", "Tengeneza nukuu kwa siku za kupiga, kuhariri, timu, vifaa, matumizi, marekebisho na safari.", "Mwongozo wa nukuu; si kiwango rasmi cha soko au mkataba wa kisheria.", "Wastani; hutegemea soko na gharama zako."],
  "africa-flight": ["Mpangaji wa bajeti ya ndege Afrika", "Linganisha safu tuli za bei za njia, daraja na muda wa kuweka nafasi kutoka kwa modeli ya Kiingereza.", "Hakuna nauli au ratiba ya moja kwa moja; badilisha makisio kwa nukuu ya sasa ya mtoa huduma.", "Chini hadi wastani; safu ni kumbukumbu tuli, si nukuu ya sasa."],
  "airbnb-vs-hotel": ["Airbnb dhidi ya hoteli", "Linganisha makisio tuli ya Airbnb na hoteli kwa mji, kiwango, ukubwa wa kundi, muda na akiba ya kupika.", "Hakuna bei, usalama, ubora au nafasi inayochukuliwa kutoka mtandaoni.", "Chini hadi wastani; viwango vya mji ni vya kumbukumbu, si nukuu mbili ulizoingiza."],
  "airport-transfer": ["Kilinganisha usafiri wa uwanja wa ndege", "Linganisha teksi, huduma ya programu, basi la pamoja na gari binafsi kwa jumla na kwa mtu.", "Msimbo wa IATA hutambua mahali tu; hauthibitishi huduma, bei au usalama.", "Juu kwa ulinganisho; haijatathminiwa kwa nafasi, usalama au muda."],
  "beach-holiday-budget": ["Mpangaji wa bajeti ya likizo ufukweni", "Jumlisha malazi, chakula, usafiri, shughuli, ndege na akiba kwa fedha ya safari.", "Hakuna hali ya hewa, mpaka, usalama, shughuli au nafasi inayohakikishwa.", "Juu kwa bajeti; hutegemea bei, tarehe na ukaguzi wako."],
  "festival-travel-budget": ["Bajeti ya safari ya tamasha", "Panga tiketi, usafiri, malazi, chakula na akiba baada ya kuhakiki chanzo cha mwandalizi.", "Hesabu inafungwa mpaka uthibitishe tarehe na njia ya tiketi kutoka kwa mwandalizi.", "Juu kwa hesabu; haijatathminiwa kwa tukio, tiketi au kuingia."],
  "hotel-star-guide": ["Mwongozo wa bei za hoteli kwa nyota", "Linganisha safu tuli za bei kwa mji, kiwango cha nyota, usiku, vyumba na msimu.", "Nyota na safu ya bei ni kumbukumbu ya modeli, si ulinganisho wa hoteli mbili wala nukuu ya sasa.", "Chini hadi wastani; viwango vya mji na nyota hubadilika."],
  "safari-cost": ["Kikokotoo cha gharama ya safari", "Kadiria kifurushi cha safari kwa nchi, muda, kundi, kiwango, msimu, ndege na nyongeza kwa viwango tuli vya modeli.", "Hakuna nukuu ya mwendeshaji, kibali, ada au nafasi ya sasa inayothibitishwa na matokeo.", "Chini hadi wastani; viwango vya modeli lazima vibadilishwe kwa nukuu ya mwendeshaji."],
  "travel-packing-list": ["Orodha ya vifaa vya safari", "Tengeneza orodha ya ukaguzi kwa aina ya safari, hali ya hewa, siku, kufua na kikomo cha mzigo.", "Orodha haitoi dawa wala kuthibitisha visa, nyaraka au sheria za shirika la ndege.", "Juu kwa orodha ya ukaguzi; haijatathminiwa kwa mipaka, afya au mizigo."],
  "travel-vaccination-cost": ["Makisio ya gharama na ratiba ya afya ya safari", "Kadiria gharama tuli na ratiba ya maandalizi kutoka kwa modeli ya Kiingereza, kisha andaa ukaguzi na mtaalamu.", "Makisio hayapendekezi chanjo, dawa, cheti wala ruhusa ya kuingia; thibitisha kwa mtaalamu na mamlaka.", "Chini; gharama na alama za njia ni jedwali tuli la kupanga, si ushauri wa afya."]
};

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

function sportsSourceReview(row, meta) {
  const source = SPORTS_SOURCES.tools[row.toolId];
  const copy = SPORTS_SOURCE_COPY.tools[row.toolId];
  if (!source) throw new Error(`Sports source metadata missing for ${row.toolId}`);
  if (!copy) throw new Error(`Swahili Sports source copy missing for ${row.toolId}`);
  if (copy.sources.length !== (source.sources || []).length) {
    throw new Error(`Swahili Sports source count mismatch for ${row.toolId}`);
  }
  const confidenceLabels = {
    A: "Juu kwa fomula na hesabu; si uthibitisho wa hali halisi.",
    B: "Wastani hadi juu kwa modeli; rejea rasmi bado lazima ihakikiwe.",
    C: "Chini hadi wastani; badilisha viwango tuli kwa ushahidi wa sasa."
  };
  const stateLabels = {
    "archived-snapshot": "Snapshot ya kumbukumbu",
    "static-formula": "Fomula tuli",
    "static-reference": "Rejea tuli",
    "static-scenario": "Hali tuli ya kupanga"
  };
  return {
    reviewedAt: source.reviewedAt || SPORTS_SOURCES.reviewedAt,
    state: source.state,
    stateLabel: stateLabels[source.state] || "Hali tuli",
    sourceMode: source.sourceMode,
    live: source.live,
    asOf: copy.asOf,
    cadence: "Kagua kabla ya uamuzi na baada ya mabadiliko ya kanuni, msimu, soko au modeli.",
    confidence: {
      grade: source.confidence.grade,
      label: confidenceLabels[source.confidence.grade] || meta[3],
      rationale: "Daraja linahusu ubora wa hesabu na muktadha wa chanzo, si matokeo, bei, nafasi au ustahiki wa sasa."
    },
    assumptions: copy.assumptions,
    mutableBaselines: copy.mutableBaselines,
    sources: (source.sources || []).map((entry, index) => ({
      title: copy.sources[index].title,
      url: entry.url,
      note: copy.sources[index].note,
      state: entry.state || source.state
    })),
    sourceRationale: source.sources && source.sources.length
      ? "Viungo hivi vinahifadhi muktadha wa modeli ya Kiingereza; havibadilishi data ya sasa."
      : "Fomula hutumia viingizo vya mtumiaji au hali ya kupanga. Hakuna URL ya nje inayohitajika ili kufanya hesabu."
  };
}

function schema(row, meta) {
  const hubRoute = row.category === "sports" ? "/sw/michezo/" : "/sw/usafiri-utalii/";
  const hubName = row.category === "sports" ? "Michezo na burudani" : "Usafiri na utalii";
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: meta[0],
      description: meta[1],
      url: SITE + row.swahiliRoute,
      applicationCategory: row.category === "sports" ? "SportsApplication" : "TravelApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      inLanguage: "sw",
      isBasedOn: SITE + row.englishRoute,
      image: SITE + row.artwork,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mwanzo", item: `${SITE}/sw/` },
        { "@type": "ListItem", position: 2, name: hubName, item: SITE + hubRoute },
        { "@type": "ListItem", position: 3, name: meta[0], item: SITE + row.swahiliRoute }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "sw",
      mainEntity: [
        {
          "@type": "Question",
          name: `Je, ${meta[0]} hutumia data ya moja kwa moja?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hapana. Programu hutumia viingizo vya mtumiaji na viwango tuli vinavyoonyeshwa; thibitisha taarifa zinazobadilika kabla ya uamuzi."
          }
        },
        {
          "@type": "Question",
          name: "Je, viingizo vinatumwa mtandaoni?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hapana. Hesabu na export hufanyika kwenye kivinjari; msaada wa AI ni wa hiari na unahitaji ridhaa ya wazi."
          }
        }
      ]
    }
  ]).replace(/</g, "\\u003c");
}

function frenchUrlFor(row) {
  const file = path.join(ROOT, row.englishRoute, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/<link rel="alternate" hreflang="fr" href="([^"]+)"\s*\/?>/i);
  if (!match) throw new Error(`French alternate missing from English owner: ${row.englishRoute}`);
  return match[1];
}

function existingEnglishReciprocalFor(row) {
  const file = path.join(ROOT, row.englishRoute, "index.html");
  const html = fs.readFileSync(file, "utf8");
  return html.includes(`hreflang="sw" href="${SITE}${row.swahiliRoute}"`);
}

function existingFrenchReciprocalFor(row) {
  const frenchUrl = frenchUrlFor(row);
  const frenchRoute = new URL(frenchUrl).pathname;
  const file = path.join(ROOT, frenchRoute, "index.html");
  if (!fs.existsSync(file)) throw new Error(`French owner missing: ${frenchRoute}`);
  const html = fs.readFileSync(file, "utf8");
  const expected = `hreflang="sw" href="${SITE}${row.swahiliRoute}"`;
  return html.includes(expected) ? frenchUrl : null;
}

function render(row) {
  const meta = META[row.toolId];
  if (!meta) throw new Error(`Hakuna metadata ya ${row.toolId}`);
  const isSports = row.category === "sports";
  const travelWorkflow = isSports ? null : renderOwnerWorkflow(row);
  const sportsReview = isSports ? sportsSourceReview(row, meta) : null;
  const sourceItems = isSports
    ? sportsReview.sources
    : travelWorkflow.owner.source.links.map((entry) => ({ title: entry[0], url: entry[1], note: "" }));
  const englishReciprocal = existingEnglishReciprocalFor(row);
  const frenchUrl = existingFrenchReciprocalFor(row);
  const localizedCluster = englishReciprocal && frenchUrl;
  const form = isSports
    ? `<div id="sw-sports-root" data-tool-id="${row.toolId}"></div>`
    : `<p class="sw-error" data-sw-owner-error role="alert" aria-live="assertive"></p>${travelWorkflow.html}`;
  const ownerConfig = travelWorkflow && {
    action: travelWorkflow.owner.action,
    copy: travelWorkflow.owner.copy,
    fieldIds: travelWorkflow.owner.fieldIds,
    healthBoundary: travelWorkflow.owner.healthBoundary,
    invalid: travelWorkflow.owner.invalid,
    ownerHash: travelWorkflow.owner.ownerHash,
    planningNote: travelWorkflow.owner.planningNote,
    resultId: travelWorkflow.owner.resultId,
    safetyMode: travelWorkflow.owner.safetyMode,
    source: travelWorkflow.owner.source
  };
  const config = {
    toolId: row.toolId,
    swSlug: row.swahiliRoute.split("/").filter(Boolean).pop(),
    name: meta[0],
    boundary: meta[2],
    checked: CHECKED,
    sourceReview: sportsReview,
    ...(ownerConfig ? { owner: ownerConfig } : {})
  };
  const pageSource = isSports ? sportsReview : travelWorkflow.owner.source;
  const sourceState = pageSource.stateLabel || pageSource.state;
  const sourceConfidence = isSports ? `${sportsReview.confidence.grade} — ${sportsReview.confidence.label}` : travelWorkflow.owner.source.confidence;
  const sourceCadence = pageSource.cadence;
  const sourceAsOf = pageSource.asOf || "Hali na viwango vinavyoelezwa hapa si data ya moja kwa moja.";
  const sourceReviewedAt = pageSource.reviewedAt || CHECKED;
  const sourceAssumptions = pageSource.assumptions || [meta[2]];
  const sourceBaselines = pageSource.mutableBaselines || [];
  const sourceRationale = pageSource.sourceRationale || "Thibitisha kila bei, kanuni, ratiba, nafasi na masharti yanayobadilika kabla ya uamuzi.";
  const pageHtml = `<!doctype html>
<html lang="sw" data-theme="light">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(meta[0])} | AfroTools</title>
  <meta name="description" content="${esc(meta[1])}">
  <link rel="canonical" href="${SITE}${row.swahiliRoute}">
  ${localizedCluster ? `<link rel="alternate" hreflang="en" href="${SITE}${row.englishRoute}">` : ""}
  ${localizedCluster ? `<link rel="alternate" hreflang="fr" href="${frenchUrl}">` : ""}
  <link rel="alternate" hreflang="sw" href="${SITE}${row.swahiliRoute}">
  <link rel="alternate" hreflang="x-default" href="${localizedCluster ? `${SITE}${row.englishRoute}` : `${SITE}${row.swahiliRoute}`}">
  <meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ">
  <meta property="og:title" content="${esc(meta[0])}"><meta property="og:description" content="${esc(meta[1])}">
  <meta property="og:url" content="${SITE}${row.swahiliRoute}"><meta property="og:image" content="${SITE}${row.artwork}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(meta[0])}"><meta name="twitter:description" content="${esc(meta[1])}"><meta name="twitter:image" content="${SITE}${row.artwork}">
  <script type="application/ld+json">${schema(row, meta)}</script>
  <link rel="stylesheet" href="/assets/css/design-system.css">${isSports ? "" : `<link rel="stylesheet" href="/assets/css/energy.css">`}<link rel="stylesheet" href="/assets/css/sw-sports-travel-parity.css">
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
  ${isSports ? `<script src="/assets/js/sports-toolkit.js" defer></script><script src="/assets/js/pages/sw-sports-parity.js" defer></script>` : `<script src="/assets/vendor/jspdf/jspdf.umd.min.js" defer></script><script src="/assets/js/pages/sw-travel-owner-parity.js" defer></script>`}
</head>
<body data-sw-tool="${row.toolId}">
  <a class="skip-link" href="#programu">Ruka hadi programu</a>
  <header class="sw-header"><a href="/sw/">AfroTools Kiswahili</a><button type="button" data-theme-toggle aria-label="Badili mandhari">◐</button></header>
  <main id="programu" class="sw-page">
    <nav aria-label="Njia"><a href="/sw/">Mwanzo</a> / <a href="${isSports ? "/sw/michezo/" : "/sw/usafiri-utalii/"}">${isSports ? "Michezo" : "Usafiri na utalii"}</a></nav>
    <section class="sw-hero"><div><p class="sw-kicker">${isSports ? "Programu ya michezo" : "Programu ya safari"}</p><h1>${esc(meta[0])}</h1><p>${esc(meta[1])}</p><p class="sw-local">Hufanya kazi kwenye kivinjari hiki. Hakuna taarifa unayoingiza inayotumwa mtandaoni.</p></div><img src="${row.artwork}" alt="" width="640" height="360"></section>
    <section class="sw-boundary" aria-label="Mipaka ya matokeo"><strong>Makisio na mipaka</strong><p>${esc(meta[2])}</p></section>
    <section class="sw-app" aria-label="${esc(meta[0])}">${form}</section>
    <section class="sw-source" aria-labelledby="chanzo"><h2 id="chanzo">Vyanzo, usasishaji na uhakika</h2><p><strong>Data ya moja kwa moja:</strong> Hapana${pageSource.live === false ? " (live=false)" : ""}</p><p><strong>Hali ya chanzo:</strong> ${esc(sourceState)}</p><p><strong>Inawakilisha:</strong> ${esc(sourceAsOf)}</p><p><strong>Imehakikiwa:</strong> ${esc(sourceReviewedAt)}</p><p><strong>Kiwango cha uhakika:</strong> ${esc(sourceConfidence)}</p><p><strong>Kagua upya:</strong> ${esc(sourceCadence)}</p><h3>Mawazo na mipaka</h3><ul>${sourceAssumptions.map((assumption) => `<li>${esc(assumption)}</li>`).join("")}</ul>${sourceBaselines.length ? `<p><strong>Viwango vinavyoweza kubadilika:</strong> ${esc(sourceBaselines.join("; "))}.</p>` : ""}${sourceItems.length ? `<h3>Rejea</h3><ul>${sourceItems.map((item) => `<li><a href="${esc(item.url)}">${esc(item.title)}</a>${item.note ? `<span>${esc(item.note)}</span>` : ""}</li>`).join("")}</ul>` : `<p>${esc(sourceRationale)}</p>`}<p>Bei, ada, kanuni, ratiba, nafasi na ustahiki wa sasa lazima uhakikishe kabla ya uamuzi.</p></section>
    <section class="sw-ai" aria-labelledby="msaada-ai"><h2 id="msaada-ai">Msaada wa AI kwa hiari</h2><p>Programu haitumi data kwa AI. Ukiamua kutumia AI, tengeneza swali hapa, ulipitie na uondoe taarifa binafsi kabla ya kulituma mwenyewe.</p><label class="sw-check"><input type="checkbox" data-ai-consent> <span>Ninakubali kuandaa swali kwa hiari; ninaelewa halitatumwa na ukurasa huu.</span></label><button type="button" data-ai-prompt disabled>Andaa swali la ukaguzi</button><pre data-ai-output tabindex="0" aria-live="polite"></pre><p><a href="/sw/ai/?tool=${row.toolId}">Fungua kipangaji cha AfroTools AI</a> baada ya kukagua unachotaka kushiriki.</p></section>
  </main>
  <script id="sw-tool-config" type="application/json">${JSON.stringify(config).replace(/</g, "\\u003c")}</script>
</body></html>`;
  return pageHtml.replace(/[ \t]+$/gm, "");
}

function renderSportsHub() {
  const rows = SCOPE.rows.filter((row) => row.category === "sports");
  const cards = rows.map((row) => {
    const meta = META[row.toolId];
    return `<a class="sw-hub-card" href="${row.swahiliRoute}" data-source-id="${row.toolId}"><img src="${row.artwork}" alt="" width="480" height="270"><strong>${esc(meta[0])}</strong><span>${esc(meta[1])}</span></a>`;
  }).join("");
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: "sw",
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: META[row.toolId][0],
      url: SITE + row.swahiliRoute
    }))
  };
  return `<!doctype html>
<html lang="sw" data-theme="light">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-source-owner" content="scripts/build-sw-sports-travel-parity.js">
  <meta name="afrotools-content-id" content="sw-sports-travel:michezo">
  <title>Michezo na burudani: programu 15 za Kiswahili | AfroTools</title>
  <meta name="description" content="Programu 15 za Kiswahili kwa odds, mashindano, tiketi, matukio, kazi za ubunifu na mipango ya wanamichezo.">
  <link rel="canonical" href="${SITE}/sw/michezo/">
  <link rel="alternate" hreflang="sw" href="${SITE}/sw/michezo/">
  <link rel="alternate" hreflang="en" href="${SITE}/sports/">
  <link rel="alternate" hreflang="fr" href="${SITE}/fr/sports/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/sports/">
  <meta property="og:title" content="Michezo na burudani kwa Kiswahili | AfroTools">
  <meta property="og:description" content="Programu 15 za kupanga na kukokotoa bila kubuni matokeo au bei za moja kwa moja.">
  <meta property="og:image" content="${SITE}/assets/img/tools/afcon-predictor.webp">
  <meta property="og:url" content="${SITE}/sw/michezo/"><meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/assets/img/tools/afcon-predictor.webp">
  <script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>
  <link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/sw-sports-travel-parity.css">
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
</head>
<body><a class="skip-link" href="#orodha">Ruka hadi programu</a>
  <header class="sw-header"><a href="/sw/">AfroTools Kiswahili</a><button type="button" data-theme-toggle aria-label="Badili mandhari">◐</button></header>
  <main id="orodha" class="sw-page sw-family-hub">
    <nav aria-label="Njia"><a href="/sw/">Mwanzo</a> / Michezo na burudani</nav>
    <header><p class="sw-kicker">Michezo na burudani</p><h1>Programu 15 za Kiswahili</h1><p>Chagua programu yenye modeli, viingizo, vyanzo na mipaka yake. Hakuna matokeo, majeraha, tiketi, odds au nafasi za moja kwa moja zinazobuniwa.</p></header>
    <aside class="sw-boundary"><strong>Mpaka wa pamoja:</strong> programu za kamari ni za watu wazima na za kuelewa odds au kodi tu; usikopeshe dau, usifukuze hasara, na usichukulie modeli kama ahadi ya ushindi.</aside>
    <section class="sw-hub-grid" aria-label="Programu 15 za michezo">${cards}</section>
  </main>
  <script>document.querySelector("[data-theme-toggle]").addEventListener("click",function(){if(window.AfroTools&&window.AfroTools.darkMode)window.AfroTools.darkMode.toggle();});</script>
</body></html>`;
}

function renderTravelHub() {
  const rows = SCOPE.rows.filter((row) => row.category === "travel-tourism");
  if (rows.length !== 9) throw new Error(`Travel hub requires 9 rows, got ${rows.length}`);
  const cards = rows.map((row) => {
    const meta = META[row.toolId];
    return `<article class="sw-hub-card"><img src="${row.artwork}" alt="" width="480" height="270" loading="lazy"><div><h2><a href="${row.swahiliRoute}">${esc(meta[0])}</a></h2><p>${esc(meta[1])}</p><p class="sw-hub-boundary">${esc(meta[2])}</p></div></article>`;
  }).join("");
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: "sw",
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: META[row.toolId][0],
      url: SITE + row.swahiliRoute
    }))
  };
  return `<!doctype html>
<html lang="sw" data-theme="light">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-source-owner" content="scripts/build-sw-sports-travel-parity.js">
  <meta name="afrotools-content-id" content="sw-sports-travel:usafiri-utalii">
  <title>Usafiri na utalii: programu 9 za Kiswahili | AfroTools</title>
  <meta name="description" content="Programu 9 za Kiswahili kwa ndege, malazi, uwanja wa ndege, ufukwe, matamasha, hoteli, safari za wanyama, mizigo na maandalizi ya afya.">
  <link rel="canonical" href="${SITE}/sw/usafiri-utalii/">
  <link rel="alternate" hreflang="sw" href="${SITE}/sw/usafiri-utalii/">
  <link rel="alternate" hreflang="en" href="${SITE}/travel/">
  <link rel="alternate" hreflang="fr" href="${SITE}/fr/travel/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/travel/">
  <meta property="og:title" content="Usafiri na utalii kwa Kiswahili | AfroTools">
  <meta property="og:description" content="Programu 9 za kupanga safari kwa data ya mmiliki, vyanzo, mipaka na uhifadhi wa ndani.">
  <meta property="og:image" content="${SITE}/assets/img/tools/safari-cost.webp">
  <meta property="og:url" content="${SITE}/sw/usafiri-utalii/"><meta property="og:type" content="website"><meta property="og:locale" content="sw_TZ">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/assets/img/tools/safari-cost.webp">
  <script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>
  <link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/sw-sports-travel-parity.css">
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
</head>
<body><a class="skip-link" href="#orodha">Ruka hadi programu</a>
  <header class="sw-header"><a href="/sw/">AfroTools Kiswahili</a><button type="button" data-theme-toggle aria-label="Badili mandhari">◐</button></header>
  <main id="orodha" class="sw-page sw-family-hub">
    <nav aria-label="Njia"><a href="/sw/">Mwanzo</a> / Usafiri na utalii</nav>
    <header><p class="sw-kicker">Usafiri na utalii</p><h1>Programu 9 za Kiswahili</h1><p>Kila programu hutumia mchakato, seti ya taarifa na matokeo ya mmiliki wake wa Kiingereza, pamoja na tafsiri, vyanzo na mipaka ya kupanga.</p></header>
    <aside class="sw-boundary"><strong>Mpaka wa pamoja:</strong> thibitisha bei, nafasi, usalama, vibali, masharti ya kuingia na ushauri wa afya kwa watoa huduma au mamlaka rasmi kabla ya uamuzi.</aside>
    <section class="sw-hub-grid" aria-label="Programu 9 za usafiri na utalii">${cards}</section>
  </main>
  <script>document.querySelector("[data-theme-toggle]").addEventListener("click",function(){if(window.AfroTools&&window.AfroTools.darkMode)window.AfroTools.darkMode.toggle();});</script>
</body></html>`;
}

function withAlternate(html, hreflang, href) {
  const pattern = new RegExp(`<link\\s+rel=["']alternate["']\\s+hreflang=["']${hreflang}["'][^>]*>`, "i");
  const tag = `<link rel="alternate" hreflang="${hreflang}" href="${href}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/(<link\s+rel=["']canonical["'][^>]*>)/i, `$1\n${tag}`);
}

function build() {
  if (SCOPE.rows.length !== 24) throw new Error(`Scope must contain 24 rows, got ${SCOPE.rows.length}`);
  const ids = new Set();
  for (const row of SCOPE.rows) {
    if (ids.has(row.toolId)) throw new Error(`Duplicate toolId ${row.toolId}`);
    ids.add(row.toolId);
    if (!fs.existsSync(path.join(ROOT, row.artwork))) throw new Error(`Dedicated artwork missing: ${row.artwork}`);
    const output = path.join(ROOT, row.swahiliRoute, "index.html");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, render(row));
  }
  const sportsHub = path.join(ROOT, "sw", "michezo", "index.html");
  fs.mkdirSync(path.dirname(sportsHub), { recursive: true });
  fs.writeFileSync(sportsHub, renderSportsHub());
  const englishSportsHub = path.join(ROOT, "sports", "index.html");
  fs.writeFileSync(
    englishSportsHub,
    withAlternate(fs.readFileSync(englishSportsHub, "utf8"), "sw", `${SITE}/sw/michezo/`)
  );
  const travelHub = path.join(ROOT, "sw", "usafiri-utalii", "index.html");
  fs.mkdirSync(path.dirname(travelHub), { recursive: true });
  fs.writeFileSync(travelHub, renderTravelHub());
  const englishTravelHub = path.join(ROOT, "travel", "index.html");
  fs.writeFileSync(
    englishTravelHub,
    withAlternate(fs.readFileSync(englishTravelHub, "utf8"), "sw", `${SITE}/sw/usafiri-utalii/`)
  );
  const frenchHubReciprocals = [
    ["fr/sports/index.html", `${SITE}/sw/michezo/`],
    ["fr/travel/index.html", `${SITE}/sw/usafiri-utalii/`]
  ];
  for (const [relative, swHref] of frenchHubReciprocals) {
    const frenchHub = path.join(ROOT, relative);
    fs.writeFileSync(
      frenchHub,
      withAlternate(fs.readFileSync(frenchHub, "utf8"), "sw", swHref)
    );
  }
  console.log(`Built ${SCOPE.rows.length} native Swahili Sports/Travel pages.`);
}

if (require.main === module) build();

module.exports = { META, render, renderSportsHub, renderTravelHub, build };
