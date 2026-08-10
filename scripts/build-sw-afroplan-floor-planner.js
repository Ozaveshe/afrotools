#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "engineering", "floor-planner", "index.html");
const OUTPUT = path.join(ROOT, "sw", "zana", "mpangaji-ramani-ya-sakafu", "index.html");
const SW_URL = "https://afrotools.com/sw/zana/mpangaji-ramani-ya-sakafu/";

const text = new Map(Object.entries({
  "Free Floor Planner Africa | House Plan Estimator &amp; Construction BOQ Calculator | AfroTools":"Mpangaji wa Ramani ya Sakafu Afrika | Makadirio ya Nyumba na BOQ | AfroTools",
  "AfroTools floor planner":"Mpangaji wa ramani ya sakafu wa AfroTools",
  "Free Floor Planner for African Homes &amp; Small Buildings":"Mpangaji wa Ramani ya Sakafu kwa Nyumba na Majengo Madogo Afrika",
  "Sketch rooms, add doors and windows, estimate materials, and export a builder-ready pack.":"Chora vyumba, ongeza milango na madirisha, kadiria vifaa, kisha pakua kifurushi cha kujadili na fundi.",
  "Works in your browser. No CAD experience needed.":"Hufanya kazi ndani ya kivinjari. Huhitaji uzoefu wa CAD.",
  "Start planning":"Anza kupanga","Load template":"Pakia kiolezo","Start from template":"Anza na kiolezo",
  "Open home, shop, office, and classroom starters.":"Fungua violezo vya nyumba, duka, ofisi na darasa.",
  "Add measured room":"Ongeza chumba chenye vipimo","Enter room size and place it on the canvas.":"Weka ukubwa wa chumba na ukipange kwenye turubai.",
  "Estimate materials":"Kadiria vifaa","Adjust height, waste, labour, and finish rates.":"Badili urefu, upotevu, kazi na bei za umaliziaji.",
  "Export pack":"Pakua kifurushi","Export PDF/PNG/BOQ":"Pakua PDF/PNG/BOQ","PDF/PNG/BOQ when your plan is ready.":"PDF/PNG/BOQ ramani yako ikiwa tayari.",
  "Country":"Nchi","Nigeria (NGN)":"Nigeria (NGN)","Kenya (KES)":"Kenya (KES)","Ghana (GHS)":"Ghana (GHS)","South Africa (ZAR)":"Afrika Kusini (ZAR)","Tanzania (TZS)":"Tanzania (TZS)",
  "Project setup":"Mipangilio ya mradi","Project name":"Jina la mradi","City or market note":"Mji au dokezo la soko","Focus planner":"Lenga mpangaji",
  "Save local draft":"Hifadhi rasimu kwenye kifaa","Restore":"Rejesha","Copy summary":"Nakili muhtasari","Load 4m x 3m fixture":"Pakia mfano wa 4m x 3m",
  "Plan rooms and estimate":"Panga vyumba na makadirio","Build your plan from measurements.":"Jenga ramani kutoka vipimo.",
  "Add a room, review the live estimate, then keep drawing on the canvas.":"Ongeza chumba, kagua makadirio, kisha endelea kuchora kwenye turubai.",
  "Back to canvas":"Rudi kwenye turubai","Describe to plan":"Eleza ili kutengeneza ramani","Beta":"Beta",
  "Type a simple brief and AfroTools will create editable rooms on the canvas.":"Andika maelezo mafupi; AfroTools itatengeneza vyumba vinavyoharirika kwenye turubai.",
  "Local parser ready":"Kichanganuzi cha ndani kiko tayari","Plan description":"Maelezo ya ramani","Self-contained":"Chumba cha kujitegemea","Small shop":"Duka dogo","3-bedroom bungalow":"Nyumba ya vyumba 3","Create editable plan":"Tengeneza ramani inayoharirika","Clear":"Futa",
  "Creates real rooms, walls, doors, windows, and starter items. No account or network service required.":"Hutengeneza vyumba, kuta, milango, madirisha na vitu halisi. Hakuna akaunti wala huduma ya mtandao inayohitajika.",
  "Plan rooms":"Panga vyumba","0 rooms on canvas":"Vyumba 0 kwenye turubai","Start with a template or add your room measurements.":"Anza na kiolezo au ongeza vipimo vya chumba.",
  "Room name":"Jina la chumba","Bedroom":"Chumba cha kulala","Parlour/Living room":"Sebule","Kitchen":"Jikoni","Bathroom":"Bafu","Store":"Ghala","Veranda":"Baraza","Shop floor":"Eneo la duka","Office":"Ofisi","Width":"Upana","Depth":"Kina","Wall type":"Aina ya ukuta","Block wall":"Ukuta wa block","Brick wall":"Ukuta wa matofali","Drywall partition":"Kizigeu cha drywall","Add room":"Ongeza chumba","Add another room":"Ongeza chumba kingine","Auto arrange rooms":"Panga vyumba kiotomatiki","Rooms":"Vyumba","No rooms yet":"Bado hakuna vyumba","No rooms yet. Add a room above or load a template.":"Bado hakuna vyumba. Ongeza chumba hapo juu au pakia kiolezo.",
  "Planning estimate ready":"Makadirio yako tayari","Edit assumptions":"Hariri makisio","Wall height (m)":"Urefu wa ukuta (m)","Waste allowance (%)":"Posho ya upotevu (%)","Labour allowance (%)":"Posho ya kazi (%)","Finish rate per m2":"Bei ya umaliziaji kwa m2","Include roofing sheets":"Jumuisha mabati","Unit rates":"Bei kwa kipimo","Reset to default rates":"Rudisha bei za mwanzo","Update estimate":"Sasisha makadirio","BOQ details":"Maelezo ya BOQ","Export builder pack":"Pakua kifurushi cha fundi","Local only":"Kwenye kifaa tu",
  "Add measured spaces, rename them, and shape the canvas.":"Ongeza nafasi zenye vipimo, zipe majina na uunde turubai.","Add doors and windows":"Ongeza milango na madirisha","Place openings, furniture, labels, and measurements.":"Weka nafasi za kufunguka, samani, lebo na vipimo.","Save the draft, print a pack, or download PNG and BOQ notes.":"Hifadhi rasimu, chapisha kifurushi, au pakua PNG na maelezo ya BOQ.",
  "Select":"Chagua","Wall":"Ukuta","Door":"Mlango","Window":"Dirisha","Furniture":"Samani","Measure":"Pima","Label":"Lebo","Erase":"Futa","Undo":"Tengua","Redo":"Rudia","Save":"Hifadhi","Reset view":"Rudisha mwonekano","Fit to plan":"Linganisha na ramani","3D view":"Mwonekano wa 3D","Full screen planner":"Mpangaji skrini nzima","Properties":"Sifa","Fit":"Linganisha","2D plan":"Ramani ya 2D","3D preview":"Onyesho la 3D","Zoom":"Kuza","Fit plan":"Linganisha ramani","Select an element to view properties":"Chagua kipengele kuona sifa","Tool: Select":"Zana: Chagua","Metric (m)":"Metriki (m)","Imperial (ft)":"Imperial (ft)","More":"Zaidi","Review plan":"Kagua ramani","Estimate":"Makadirio","Local help":"Msaada wa ndani","Builder pack":"Kifurushi cha fundi","Share":"Shiriki",
  "Save stores the editable draft in this browser only.":"Hifadhi huweka rasimu inayoharirika kwenye kivinjari hiki tu.","PDF, PNG, BOQ, and summary exports are for builder or family discussion.":"PDF, PNG, BOQ na muhtasari ni kwa majadiliano na fundi au familia.","No export attempted yet.":"Bado hujapakua faili.",
  "Assumptions, accuracy and professional checks":"Makisio, usahihi na ukaguzi wa kitaalamu","This is a planning estimate, not an architectural or permit drawing.":"Haya ni makadirio ya kupanga, si mchoro wa usanifu au kibali.","Confirm structure, drainage, approvals, and final rates with qualified local professionals.":"Thibitisha miundo, mifereji, idhini na bei za mwisho na wataalamu wa eneo.","Material estimates use editable local assumptions.":"Makadirio ya vifaa hutumia makisio ya eneo yanayoharirika.","Areas, wall lengths, openings, and quantity notes are calculated from canvas objects in this browser.":"Maeneo, urefu wa kuta, nafasi za kufunguka na kiasi hukokotolewa kutoka vitu vya turubai kwenye kivinjari hiki.","Rates and allowances can be changed in the estimate controls before export.":"Bei na posho zinaweza kubadilishwa kabla ya kupakua.","Export footer notes keep the saved draft and builder-pack metadata visible when you download or print.":"Maelezo ya faili huweka taarifa za rasimu na kifurushi wazi unapopakua au kuchapisha.","Describe-to-plan uses a local parser in this browser; no network service is used for the current draft feature.":"Eleza-ili-kupanga hutumia kichanganuzi cha ndani; rasimu haitumwi mtandaoni.",
  "How to use the floor planner":"Jinsi ya kutumia mpangaji wa ramani","Plan a room, house, shop, or small building in minutes":"Panga chumba, nyumba, duka au jengo dogo kwa dakika","Start with a template or blank canvas.":"Anza na kiolezo au turubai tupu.","Add measured rooms, walls, doors, windows, furniture, and labels.":"Ongeza vyumba vyenye vipimo, kuta, milango, madirisha, samani na lebo.","Review the live estimate for materials, labour allowance, finish allowance, and openings.":"Kagua makadirio ya vifaa, kazi, umaliziaji na nafasi za kufunguka.","Export a PNG, BOQ file, copyable summary, or builder pack PDF.":"Pakua PNG, faili la BOQ, muhtasari wa kunakili au PDF ya fundi.",
  "Popular templates":"Violezo maarufu","African starter layouts":"Mipangilio ya kuanzia Afrika","Load practical templates for self-contained rooms, 1-bedroom apartments, 2-bedroom bungalows, 3-bedroom homes, duplex starters, rental compounds, shops, salons, cafes, classrooms, clinic receptions, and office/store layouts.":"Pakia violezo vya vyumba vya kujitegemea, nyumba za chumba 1 hadi 3, duplex, makazi ya kupanga, maduka, saluni, mikahawa, madarasa, mapokezi ya kliniki na ofisi.","View templates":"Tazama violezo","Construction estimate":"Makadirio ya ujenzi","Planning BOQ and local currency totals":"BOQ ya kupanga na jumla kwa sarafu ya eneo","The estimate updates from room area, wall length, wall height, wall type, doors, windows, finish rate, waste allowance, labour allowance, country, and currency.":"Makadirio husasishwa kwa eneo la vyumba, urefu na aina ya ukuta, milango, madirisha, umaliziaji, upotevu, kazi, nchi na sarafu.","Open the planner":"Fungua mpangaji",
  "FAQ":"Maswali ya kawaida","Floor planner questions":"Maswali kuhusu mpangaji wa ramani","Is this floor planner free to use?":"Mpangaji huu ni wa bure?","Yes. It runs in your browser and lets you sketch plans, load templates, estimate materials, and export planning files for free.":"Ndiyo. Hufanya kazi kwenye kivinjari na hukuruhusu kuchora, kupakia violezo, kukadiria vifaa na kupakua faili bila malipo.","Can I use it for African house plans?":"Naweza kuitumia kwa ramani za nyumba Afrika?","Yes. The gallery includes self-contained rooms, bungalows, family houses, rental compounds, shops, salons, classrooms, clinics, and small offices.":"Ndiyo. Violezo vinajumuisha vyumba vya kujitegemea, nyumba, makazi ya kupanga, maduka, saluni, madarasa, kliniki na ofisi ndogo.","Does the planner create a construction BOQ?":"Mpangaji hutengeneza BOQ ya ujenzi?","It creates a planning BOQ estimate from your rooms, walls, openings, rates, allowances, country, and currency.":"Hutengeneza BOQ ya kupanga kutoka vyumba, kuta, nafasi, bei, posho, nchi na sarafu.","Can this replace an architect or permit drawing?":"Inaweza kuchukua nafasi ya mbunifu au mchoro wa kibali?","No. Use it for early budgeting and discussion, then confirm structure, drainage, approvals, and final rates with qualified local professionals.":"Hapana. Itumie kwa bajeti na majadiliano ya awali, kisha thibitisha miundo, mifereji, idhini na bei na wataalamu.",
  "Related tools":"Zana zinazohusiana","Construction calculators":"Vikokotoo vya ujenzi","Construction cost calculator":"Kikokotoo cha gharama za ujenzi","Cement and block calculator":"Kikokotoo cha saruji na block","Paint calculator":"Kikokotoo cha rangi","Roofing calculator":"Kikokotoo cha paa","Land and area calculator":"Kikokotoo cha ardhi na eneo","African floor plan templates":"Violezo vya ramani za sakafu Afrika","Furniture & Fixtures":"Samani na vifaa","Review your plan in 3D":"Kagua ramani kwa 3D","Drag to rotate. Scroll or pinch to zoom. Use presets for quick views.":"Buruta kuzungusha. Sogeza au bana ili kukuza. Tumia mipangilio kwa mwonekano wa haraka.","Orbit":"Zunguka","Top":"Juu","Room":"Chumba","Refresh":"Onyesha upya","Fit view":"Linganisha mwonekano","Preparing 3D preview...":"Inaandaa onyesho la 3D...","Open 3D view to preview rooms, walls, doors, windows, and furniture.":"Fungua 3D kuona vyumba, kuta, milango, madirisha na samani.","Construction Cost Estimate":"Makadirio ya Gharama za Ujenzi","AfroPlan Local Help":"Msaada wa Ndani wa AfroPlan","Send":"Tuma","Tools":"Zana","Tap a tool, then tap the canvas to place it.":"Gusa zana, kisha gusa turubai kuiweka."
}));

function translateTextNodes(html) {
  return html.replace(/>([^<>]+)</g, (whole, value) => {
    const leading = value.match(/^\s*/)[0];
    const trailing = value.match(/\s*$/)[0];
    const key = value.trim();
    return text.has(key) ? `>${leading}${text.get(key)}${trailing}<` : whole;
  });
}

function build() {
  let html = fs.readFileSync(SOURCE, "utf8");
  html = html.replace(/<script src="\/assets\/js\/analytics-bootstrap\.js[^>]*><\/script>\s*/i, "");
  html = html.replace(/<script src="\/assets\/js\/lazy-analytics\.js[^>]*><\/script>/i, "");
  html = html.replace(/\s*<section class="df-upgrade"[\s\S]*?<\/section>\s*<section class="df-faq"[\s\S]*?<\/section>/i, "\n");
  html = html.replace(/\s*<afro-related-tools[\s\S]*?<\/afro-related-tools>/i, "\n");
  html = html.replace(/<script src="\/assets\/js\/components\/related-tools\.min\.js[^>]*><\/script>/i, "");
  html = html.replace(/<html([^>]*)lang="en"([^>]*)>/i, '<html$1lang="sw"$2>');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "<title>Mpangaji wa Ramani ya Sakafu Afrika | BOQ na PDF | AfroTools</title>");
  html = html.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="Chora vyumba, kuta, milango, madirisha na samani; hifadhi rasimu na upakue PNG, PDF, BOQ, CSV, XLSX, JSON au HTML kwa Kiswahili.">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="Mpangaji wa Ramani ya Sakafu | AfroTools">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="Mpangaji kamili wa ramani, vipimo, BOQ na faili za ujenzi wa awali kwa Kiswahili.">');
  html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${SW_URL}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/i, '<meta name="twitter:title" content="Mpangaji wa Ramani ya Sakafu | AfroTools">');
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/i, '<meta name="twitter:description" content="Chora, pima, hifadhi na pakua ramani ya sakafu na BOQ kwa Kiswahili.">');
  html = html.replace(/<meta name="tool-id" content="[^"]*">/i, '<meta name="tool-id" content="afroplan-floor-planner-sw">');
  html = html.replace(/"inLanguage"\s*:\s*"en"/g, '"inLanguage":"sw"');
  html = html.replace(/"url"\s*:\s*"https:\/\/afrotools\.com\/engineering\/floor-planner\/"/g, `"url":"${SW_URL}"`);
  html = html.replace(/"item"\s*:\s*"https:\/\/afrotools\.com\/engineering\/floor-planner\/"/g, `"item":"${SW_URL}"`);
  html = html.replace(/<meta property="article:modified_time" content="[^"]*">/i, '<meta property="article:modified_time" content="2026-08-09">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${SW_URL}">`);
  html = html.replace(/<link rel="alternate" hreflang="sw" href="[^"]*">/i, `<link rel="alternate" hreflang="sw" href="${SW_URL}">`);
  html = html.replace(/<\/head>/i, '<meta name="tool-id" content="afroplan-floor-planner-sw"><meta name="generator" content="scripts/build-sw-afroplan-floor-planner.js"><meta name="afrotools-source-route" content="/engineering/floor-planner/"><meta name="afrotools-content-id" content="sw-engineering:afroplan-floor-planner"><meta name="afrotools-ai-tool-id" content="afroplan-floor-planner">\n</head>');
  html = html.replace(/<body([^>]*)>/i, '<body$1 data-fp-locale="sw">');
  html = translateTextNodes(html);
  html = html.replace(/<!-- Core scripts \(loaded immediately\) -->/i, '<!-- Core scripts (loaded immediately) -->\n<script src="/engineering/floor-planner/js/fp-sw-localize.js?v=20260809"></script>\n<script src="/engineering/floor-planner/js/fp-sw-export.js?v=20260809"></script>');
  html = html.replace(/<script src="\/assets\/js\/pages\/english-df-app-upgrades\.js[^>]*><\/script>/i, "");
  html = html.replace(/<link rel="stylesheet" href="\/assets\/css\/english-df-app-upgrades\.css[^>]*>/i, "");
  return html;
}

const expected = build();
if (process.argv.includes("--check")) {
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== expected) {
    console.error("Swahili AfroPlan owner is stale. Run node scripts/build-sw-afroplan-floor-planner.js");
    process.exit(1);
  }
  console.log("Swahili AfroPlan owner is current.");
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, expected);
  console.log(path.relative(ROOT, OUTPUT));
}
