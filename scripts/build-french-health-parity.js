#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY = path.join(ROOT, "reports", "french-free-app-parity-inventory.json");
const CACHE = path.join(ROOT, "data", "i18n", "fr-health-parity-translations.json");
const RUNTIME = "/assets/js/pages/french-health-parity-runtime.js";
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh-translations");
const DEDICATED_ROUTE_OWNERS = new Map([
  ["malaria-risk", {
    file: "fr/tools/risque-paludisme/index.html",
    required: [
      /<html\b[^>]*\blang="fr"/i,
      /malaria-urgency-engine\.js/i,
      /malaria-urgency-fr\.js/i,
      /Privé et local/i,
      /"inLanguage"\s*:\s*"fr"/i
    ]
  }]
]);

const titleById = {
  "medical-report": "Interprète de rapport médical",
  "bmi-calculator": "Fiche de fiabilité des mesures IMC",
  "due-date": "Planificateur de rendez-vous prénataux",
  "calorie-counter": "Journal alimentaire quotidien",
  "malaria-risk": "Liste de contrôle pour le dépistage du paludisme",
  "ovulation-calc": "Estimateur de fenêtre du cycle",
  "drug-dosage": "Vérificateur arithmétique de dose",
  "water-quality": "Fiche de lecture d'analyse d'eau potable",
  "water-intake": "Journal privé des apports hydriques",
  "vaccine-schedule": "Guide des programmes de vaccination",
  "waist-hip-ratio": "Outil de mesure du rapport taille-hanches",
  "blood-pressure": "Vérification d'une mesure de tension artérielle",
  "hospital-cost": "Budget d'un épisode de soins hospitaliers",
  "clinic-costs": "Budget de consultation et de suivi",
  "pharmacy-prices": "Normalisateur de devis de pharmacie",
  "sickle-cell": "Explorateur de transmission de la drépanocytose",
  "diabetes-risk": "Outil de préparation au dépistage du prédiabète",
  "bmi-calc-tools": "Calculateur d'IMC adulte",
  "calorie-counter-tools": "Estimateur de calories pour un aliment",
  "due-date-tools": "Estimateur de plage de dates de grossesse",
  "genotype-checker": "Guide de vérification d'un résultat d'hémoglobine",
  "blood-group": "Référence de compatibilité des composants sanguins",
  "maternal-mortality": "Guide de préparation à la santé maternelle",
  "childbirth-cost": "Budget d'accouchement fondé sur un devis",
  "csection-vs-natural": "Préparateur de questions sur les modes d'accouchement",
  "dental-cost": "Budget de soins dentaires fondé sur un devis",
  "drug-price-compare": "Comparateur de devis pour un médicament précis",
  "traditional-vs-western": "Comparateur de coûts et de logistique de deux plans de soins",
  "african-meal-plan": "Planificateur de repas et de budget",
  "child-growth": "Référence OMS de croissance de l'enfant",
  "hiv-treatment-cost": "Fiche privée de coûts des soins VIH",
  "tb-tracker": "Suivi privé des dates de consultation pour la tuberculose",
  "cholera-risk": "Liste de contrôle d'urgence pour le choléra",
  "ebola-checklist": "Liste de contrôle exposition et santé publique Ebola",
  "hep-b-screening": "Parcours dépistage, diagnostic et vaccination contre l'hépatite B",
  "medical-tourism": "Budget de déplacement pour soins médicaux",
  "eye-care-cost": "Budget de soins oculaires fondé sur un devis",
  "mental-health-cost": "Planificateur du coût d'un accompagnement en santé mentale",
  "pregnancy-nutrition": "Planificateur de variété alimentaire pendant la grossesse",
  "breastfeeding-tracker": "Journal privé d'alimentation et de couches",
  "gym-cost-compare": "Comparateur de devis de salle de sport",
  "home-workout": "Planificateur d'activité à domicile"
};

const manual = {
  "AfroTools": "AfroTools",
  "Health & Wellness": "Santé et bien-être",
  "Home": "Accueil",
  "Tools": "Outils",
  "All tools": "Tous les outils",
  "All Tools": "Tous les outils",
  "Health": "Santé",
  "Health tools": "Outils santé",
  "Dark mode": "Mode sombre",
  "Download PDF": "Télécharger le PDF",
  "Download TXT": "Télécharger le TXT",
  "Upload image": "Importer une image",
  "Upload PDF": "Importer un PDF",
  "Upload and privacy boundaries": "Importation et limites de confidentialité",
  "No upload by default": "Aucun téléversement par défaut",
  "Can I upload a photo of my lab report?": "Puis-je importer une photo de mon rapport de laboratoire ?",
  "&#x1FA78; CBC": "&#x1FA78; NFS",
  "Clear": "Effacer",
  "Reset": "Réinitialiser",
  "Calculate": "Calculer",
  "Privacy": "Confidentialité",
  "Sources": "Sources",
  "Related tools": "Outils associés",
  "Related AfroTools": "Outils AfroTools associés",
  "Frequently Asked Questions": "Questions fréquentes",
  "Do not wait for this tool.": "N'attendez pas le résultat de cet outil.",
  "Do not wait for this checklist.": "N'attendez pas la fin de cette liste de contrôle.",
  "Educational use only — not a diagnosis or medical advice.": "Usage éducatif uniquement — ni diagnostic ni avis médical.",
  "This tool does not diagnose, treat, confirm health, or replace professional medical advice.": "Cet outil ne pose aucun diagnostic, ne traite pas, ne confirme pas un état de santé et ne remplace pas l'avis d'un professionnel de santé.",
  "No diagnosis": "Aucun diagnostic",
  "No upload": "Aucun téléversement",
  "No account": "Aucun compte requis",
  "Runs in this browser": "Fonctionne dans ce navigateur",
  "Save on this device": "Enregistrer sur cet appareil",
  "Print / save PDF": "Imprimer / enregistrer en PDF",
  "Print or save as PDF": "Imprimer ou enregistrer en PDF",
  "Light mode": "Mode clair",
  "Quoted gross": "Total brut du devis",
  "Buffer": "Marge de sécurité",
  "Why:": "Pourquoi :",
  "Warning:": "Avertissement :",
  "Complete the checklist. A negative or low-concern result cannot rule out malaria.": "Remplissez la liste de contrôle. Un résultat négatif ou apparemment peu préoccupant ne permet pas d'exclure le paludisme.",
  "Clinic Visit & Follow-up Cost Planner | AfroTools": "Budget de consultation et de suivi | AfroTools"
};

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeRoute(route) {
  const clean = String(route || "").split(/[?#]/)[0].replace(/\/+/g, "/");
  return clean === "/" ? "/" : "/" + clean.replace(/^\/+|\/+$/g, "");
}

function englishFile(route) {
  const clean = normalizeRoute(route).replace(/^\//, "");
  const index = path.join(ROOT, clean, "index.html");
  if (fs.existsSync(index)) return index;
  return path.join(ROOT, clean + ".html");
}

function absoluteAppScript(src, englishRoute) {
  if (!src || /^(?:https?:)?\/\//i.test(src) || src.startsWith("/assets/")) return src;
  if (src.startsWith("/")) return src;
  return normalizeRoute(englishRoute) + "/" + src.replace(/^\.\//, "");
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function clipWords(value, limit) {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1).replace(/\s+\S*$/, "").replace(/[,:;–—-]\s*$/, "").trim();
  return (clipped || text.slice(0, limit).trim()).replace(/[.!?]?$/, "…");
}

function isTranslatable(value) {
  const text = cleanText(value);
  if (text.length < 2 || text.length > 900 || !/[A-Za-z]{2}/.test(text)) return false;
  if (/___FR_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(text)) return false;
  if (/^(?:https?:|\/|#|\.|[A-Z0-9_-]{2,})/.test(text) && !/\s/.test(text)) return false;
  if (/^(?:GET|POST|PUT|PATCH|DELETE|application\/|text\/|image\/|[a-z]+_[a-z_]+)$/i.test(text)) return false;
  return true;
}

function protectedBlocks(html, callback) {
  const blocks = [];
  const protectedHtml = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, (block) => {
    const token = `___FR_HEALTH_PROTECTED_${blocks.length}___`;
    blocks.push(block);
    return token;
  });
  const changed = callback(protectedHtml);
  return changed.replace(/___FR_HEALTH_PROTECTED_(\d+)___/g, (_all, index) => blocks[Number(index)]);
}

function collectVisibleStrings(html) {
  const strings = new Set();
  protectedBlocks(html, (body) => {
    body.split(/(<[^>]+>)/g).forEach((part) => {
      if (!part || part.startsWith("<")) return;
      const value = cleanText(part);
      if (/___FR_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(value)) return;
      if (isTranslatable(value)) strings.add(value);
    });
    body.replace(/\b(?:aria-label|placeholder|title|alt|content)=("([^"]*)"|'([^']*)')/gi, (_all, _quoted, double, single) => {
      const value = cleanText(double == null ? single : double);
      if (isTranslatable(value) && !/^(?:width=device|index,|summary_|website$)/i.test(value)) strings.add(value);
      return _all;
    });
    return body;
  });
  return strings;
}

function collectScriptStrings(html, englishRoute) {
  const strings = new Set();
  const sources = [];
  html.replace(/<script\b[^>]*\bsrc=("([^"]+)"|'([^']+)')[^>]*>/gi, (_all, _q, double, single) => {
    const src = absoluteAppScript(double == null ? single : double, englishRoute).split("?")[0];
    if (src.startsWith("/assets/") || /^(?:https?:)?\/\//.test(src)) return _all;
    const file = path.join(ROOT, src.replace(/^\//, ""));
    if (fs.existsSync(file)) sources.push(fs.readFileSync(file, "utf8"));
    return _all;
  });
  html.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi, (_all, source) => {
    if (source.trim()) sources.push(source);
    return _all;
  });
  sources.forEach((source) => {
    source.replace(/(["'`])((?:\\.|(?!\1)[\s\S]){3,600})\1/g, (_all, _quote, raw) => {
      const value = cleanText(raw.replace(/\\n/g, " ").replace(/\\(["'`])/g, "$1"));
      if (!isTranslatable(value) || !/\s/.test(value)) return _all;
      if (/^(?:[#.\[]|data-|aria-|health-|afro|application\/|text\/|image\/)/i.test(value)) return _all;
      if (/[{}();]|=>|===|querySelector|localStorage|addEventListener|classList|innerHTML/.test(value)) return _all;
      strings.add(value);
      return _all;
    });
  });
  return strings;
}

function marker(index) {
  return `___AFROSEG_${String(index).padStart(4, "0")}___`;
}

async function translateChunk(items) {
  const joined = items.map((item, index) => marker(index) + "\n" + item).join("\n");
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q="
    + encodeURIComponent(joined);
  const response = await fetch(url, { headers: { "User-Agent": "AfroTools-French-Health-Parity/1.0" } });
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = (data[0] || []).map((row) => row[0] || "").join("");
  const parts = translated.split(/___AFROSEG_(\d{4})___\s*/g);
  const result = new Array(items.length);
  for (let index = 1; index < parts.length; index += 2) {
    result[Number(parts[index])] = String(parts[index + 1] || "").trim();
  }
  if (result.some((value) => !value)) throw new Error("Translation batch markers were not preserved.");
  return result;
}

async function populateCache(strings, cache) {
  const pending = [...strings].filter((value) => !cache[value]).sort((a, b) => a.localeCompare(b));
  let chunk = [];
  let length = 0;
  const chunks = [];
  pending.forEach((value) => {
    if (chunk.length && (length + value.length > 2800 || chunk.length >= 24)) {
      chunks.push(chunk);
      chunk = [];
      length = 0;
    }
    chunk.push(value);
    length += value.length + 24;
  });
  if (chunk.length) chunks.push(chunk);
  for (let index = 0; index < chunks.length; index += 1) {
    const items = chunks[index];
    let translations;
    try {
      translations = await translateChunk(items);
    } catch (error) {
      translations = [];
      for (const item of items) {
        const single = await translateChunk([item]);
        translations.push(single[0]);
      }
    }
    items.forEach((item, itemIndex) => {
      cache[item] = translations[itemIndex];
    });
    process.stdout.write(`Translated ${Math.min(pending.length, (index + 1) * 24)}/${pending.length}\r`);
  }
  if (pending.length) process.stdout.write("\n");
}

function postCorrectFrench(value) {
  return String(value || "")
    .replace(/\bAfroOutils\b/g, "AfroTools")
    .replace(/\bAfro-?outils\b/gi, "AfroTools");
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value, quote) {
  let result = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  result = quote === '"' ? result.replace(/"/g, "&quot;") : result.replace(/'/g, "&#39;");
  return result;
}

function translateStatic(html, cache) {
  return protectedBlocks(html, (body) => {
    let result = body.split(/(<[^>]+>)/g).map((part) => {
      if (!part || part.startsWith("<")) return part;
      const clean = cleanText(part);
      if (/___FR_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(clean)) return part;
      if (!clean || !cache[clean]) return part;
      const leading = part.match(/^\s*/)[0];
      const trailing = part.match(/\s*$/)[0];
      return leading + escapeText(cache[clean]) + trailing;
    }).join("");
    result = result.replace(/\b(aria-label|placeholder|title|alt|data-name|data-desc)=("([^"]*)"|'([^']*)')/gi, (all, name, quoted, double, single) => {
      const quote = quoted[0];
      const value = double == null ? single : double;
      const clean = cleanText(value);
      return cache[clean] ? `${name}=${quote}${escapeAttribute(cache[clean], quote)}${quote}` : all;
    });
    return result;
  });
}

function removeJsonLd(html) {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
}

function replaceHeadMetadata(html, row, title, description) {
  const canonical = "https://afrotools.com" + normalizeRoute(row.primaryFrenchRoute) + "/";
  const english = "https://afrotools.com" + normalizeRoute(row.englishRoute) + "/";
  const seoTitle = `${clipWords(title, 51)} | AfroTools`;
  const inheritedLanguageLinks = [];
  html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["'][^"']*\balternate\b[^"']*["']/i.test(tag)) return tag;
    const language = (tag.match(/\bhreflang=["']([^"']+)["']/i) || [])[1];
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (!language || !href || /^(?:en|fr|x-default)$/i.test(language)) return tag;
    inheritedLanguageLinks.push(`<link rel="alternate" hreflang="${escapeAttribute(language, '"')}" href="${escapeAttribute(href, '"')}">`);
    return tag;
  });
  let result = html
    .replace(/<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i, `<html$1lang="fr"$2 data-fr-health-source="${row.englishId}">`)
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeText(seoTitle)}</title>`)
    .replace(/<meta\b[^>]*\bname=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttribute(seoTitle, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta\b[^>]*\bname=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttribute(seoTitle, '"')}">`)
    .replace(/<meta\b[^>]*\bname=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttribute(description, '"')}">`)
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*\brel=["']alternate["'][^>]*>\s*/gi, "");
  const languageLinks = [
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="en" href="${english}">`,
    `<link rel="alternate" hreflang="fr" href="${canonical}">`,
    ...new Set(inheritedLanguageLinks),
    `<link rel="alternate" hreflang="x-default" href="${english}">`
  ].join("\n");
  return result.replace("</head>", `${languageLinks}\n</head>`);
}

function rewriteAppScripts(html, englishRoute) {
  const placeholders = [];
  let protectedHtml = html.replace(/<script\b[^>]*\bsrc=("([^"]+)"|'([^']+)')[^>]*><\/script>/gi, (tag, _quoted, double, single) => {
    const src = double == null ? single : double;
    const absolute = absoluteAppScript(src, englishRoute);
    const changed = tag.replace(src, absolute);
    const token = `___FR_HEALTH_SCRIPT_TAG_${placeholders.length}___`;
    placeholders.push(changed);
    return token;
  });
  protectedHtml = protectedHtml.replace(/<link\b(?=[^>]*\brel=["'][^"']*\bstylesheet\b[^"']*["'])[^>]*\bhref=("([^"]+)"|'([^']+)')[^>]*>/gi, (tag, _quoted, double, single) => {
    const href = double == null ? single : double;
    const absolute = absoluteAppScript(href, englishRoute);
    const changed = tag.replace(href, absolute);
    const token = `___FR_HEALTH_SCRIPT_TAG_${placeholders.length}___`;
    placeholders.push(changed);
    return token;
  });
  return {
    html: protectedHtml,
    restore(value) {
      return value.replace(/___FR_HEALTH_SCRIPT_TAG_(\d+)___/g, (_all, index) => placeholders[Number(index)]);
    }
  };
}

function mapInternalRoutes(html, routeMap) {
  let result = html;
  [...routeMap.entries()].sort((a, b) => b[0].length - a[0].length).forEach(([english, french]) => {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`https://afrotools\\.com${escaped}(?=[/'"?#<])`, "g"), `https://afrotools.com${french}`);
    result = result.replace(new RegExp(`(["'])${escaped}(?=[/'"?#])`, "g"), `$1${french}`);
  });
  return result;
}

function schema(title, description, route) {
  const url = "https://afrotools.com" + normalizeRoute(route) + "/";
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: title,
      description,
      url,
      inLanguage: "fr",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "fr",
      mainEntity: [
        {
          "@type": "Question",
          name: "Cet outil pose-t-il un diagnostic ou recommande-t-il un traitement ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. Il organise des informations ou effectue un calcul limité. Un professionnel de santé qualifié, un laboratoire, une pharmacie ou un service d'urgence reste l'autorité pour toute décision médicale."
          }
        },
        {
          "@type": "Question",
          name: "Que faire si la situation semble urgente ou si le résultat m'inquiète ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "N'attendez pas le résultat de cet outil. Contactez le service d'urgence, la maternité, le centre antipoison, la clinique ou l'autorité de santé publique disponible dans votre pays selon la situation."
          }
        }
      ]
    }
  ];
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function safetySection(title, englishRoute) {
  return [
    `<section class="fr-health-safety" data-fr-health-safety data-tool-verification-panel aria-labelledby="fr-health-safety-title">`,
    `<h2 id="fr-health-safety-title">Méthode, sécurité et confidentialité</h2>`,
    `<p><strong>Portée :</strong> ${escapeText(title)} reprend le moteur de calcul vérifié de la page anglaise, avec une interface et des résultats en français. Il ne pose aucun diagnostic, ne prescrit aucun traitement et ne remplace jamais un professionnel de santé ou un service d'urgence.</p>`,
    `<p><strong>Confidentialité :</strong> les données de santé saisies restent dans ce navigateur pour le parcours principal. Les exports sont créés localement. Toute fonction réseau facultative doit demander un consentement explicite et montrer les données envoyées.</p>`,
    `<p><strong>Vérification :</strong> confirmez les résultats, dates, doses, analyses, tarifs et consignes avec le professionnel, laboratoire, pharmacien, établissement ou programme national compétent. Consultez aussi <a href="https://www.who.int/fr/health-topics" rel="noopener">les dossiers de santé de l'OMS</a>.</p>`,
    `<p class="fr-health-source-note">Moteur de référence : <a href="${englishRoute}/" hreflang="en">${englishRoute}/</a>. Sources et limites propres à l'application indiquées sur cette page.</p>`,
    `</section>`
  ].join("");
}

function style() {
  return `<style data-fr-health-parity-style>
.fr-health-safety{max-width:1080px;margin:24px auto;padding:18px;border:1px solid #bae6fd;border-radius:14px;background:#f8fbff;color:#334155;line-height:1.65}
.fr-health-safety h2{margin:0 0 10px;color:#0f172a;font-size:1.25rem}.fr-health-safety p{margin:.55rem 0}.fr-health-safety a{color:#0057b8;font-weight:700}
[data-theme="dark"] .fr-health-safety{background:#0f1f36;border-color:#1d4ed8;color:#bfdbfe}[data-theme="dark"] .fr-health-safety h2{color:#f8fafc}
@media(max-width:640px){.fr-health-safety{margin:18px 12px;padding:15px}.fr-health-safety p{overflow-wrap:anywhere}}
</style>`;
}

function pageDictionary(strings, cache) {
  const result = {};
  strings.forEach((key) => {
    if (cache[key] && cache[key] !== key) result[key] = postCorrectFrench(cache[key]);
  });
  Object.assign(result, manual);
  return result;
}

function localizeMedicalReportRuntime(html, englishId) {
  if (englishId !== "medical-report") return html;
  const replacements = {
    "All ' + total + ' recognized markers fall within their displayed reference ranges. This does not confirm overall health. Verify every range-source label against the original report and discuss symptoms, missing markers, and retest timing with your healthcare provider.": "Les ' + total + ' marqueurs reconnus se situent dans les plages de référence affichées. Cela ne confirme pas l’état de santé général. Vérifiez chaque plage et sa source dans le rapport original, puis discutez avec votre professionnel de santé des symptômes, des marqueurs manquants et du calendrier de contrôle.",
    "Within shown range": "Dans la plage indiquée",
    "Above Range": "Au-dessus de la plage",
    "Below Range": "En dessous de la plage",
    "Total Markers": "Marqueurs au total",
    "COMPLETE BLOOD COUNT (CBC)": "NUMÉRATION FORMULE SANGUINE (NFS)",
    "Complete Blood Count (CBC)": "Numération formule sanguine (NFS)",
    "NORMAL": "DANS LA PLAGE",
    "Normal": "Dans la plage",
    "Reference range": "Plage de référence",
    "Laboratory range used.": "Plage du laboratoire utilisée.",
    "General fallback range used.": "Plage générale de secours utilisée.",
    "This range was parsed from the same line as the result. Check it against the original report.": "Cette plage a été extraite de la même ligne que le résultat. Vérifiez-la dans le rapport original.",
    "The parser did not identify a range on the report line. This fallback may not match your laboratory or personal context.": "L’analyseur n’a pas identifié de plage sur la ligne du rapport. Cette plage de secours peut ne pas correspondre à votre laboratoire ou à votre situation.",
    " The source line also contained an explicit critical or urgent flag.": " La ligne source comportait aussi une mention explicite critique ou urgente.",
    "White Blood Cell Count": "Nombre de globules blancs",
    "White blood cells fight infection. Low counts may mean weakened immunity; high counts often indicate infection or inflammation.": "Les globules blancs participent à la défense contre les infections. Un taux bas peut indiquer une immunité affaiblie ; un taux élevé accompagne souvent une infection ou une inflammation.",
    "The protein in red blood cells that carries oxygen. Low levels mean anemia, which causes fatigue and weakness.": "Protéine des globules rouges qui transporte l’oxygène. Un taux bas évoque une anémie et peut accompagner fatigue et faiblesse.",
    "Laboratory range used. This range was parsed from the same line as the result. Check it against the original report.": "Plage du laboratoire utilisée. Cette plage a été extraite de la même ligne que le résultat ; vérifiez-la dans le rapport original."
  };
  const medicalRuntimeSentences = {
    "normal + ' of ' + total + ' markers are within their displayed ranges. ' + abnormal + ' marker' + (abnormal > 1 ? 's are' : ' is') + ' outside range and should be discussed with your healthcare provider, especially if symptoms or lab-critical flags are present.'": "normal + ' sur ' + total + ' marqueurs se situent dans les plages affichées. ' + abnormal + ' marqueur' + (abnormal > 1 ? 's sont' : ' se situe') + ' hors plage ; discutez-en avec votre professionnel de santé, surtout en présence de symptômes ou d’une mention critique du laboratoire.'",
    "normal + ' of ' + total + ' markers are within their displayed ranges. ' + abnormal + ' markers are outside range. Arrange clinician review and seek urgent care for severe symptoms or any result your lab marks critical.'": "normal + ' sur ' + total + ' marqueurs se situent dans les plages affichées. ' + abnormal + ' marqueurs sont hors plage. Organisez une revue clinique et consultez en urgence en cas de symptômes graves ou de résultat marqué critique par le laboratoire.'",
    "'My ' + r.key + ' is ' + direction + ' at ' + r.value + ' ' + r.biomarker.unit + '. What follow-up or repeat test should I consider?'": "'Mon résultat ' + r.key + ' est ' + (direction === 'high' ? 'élevé' : 'bas') + ' à ' + r.value + ' ' + r.biomarker.unit + '. Quel suivi ou nouveau contrôle dois-je envisager ?'",
    "Based on these outside-range results, should I have any follow-up tests?": "Compte tenu de ces résultats hors plage, faut-il prévoir des analyses de suivi ?",
    "Could timing, preparation, medicines, supplements, illness, pregnancy, hydration, or laboratory method affect these results?": "Le moment, la préparation, les médicaments, les compléments, une maladie, une grossesse, l’hydratation ou la méthode du laboratoire peuvent-ils influencer ces résultats ?",
    "results.length + ' recognized markers; ' + abnormal.length + ' outside general range'": "results.length + ' marqueurs reconnus ; ' + abnormal.length + ' hors plage générale'",
    "Sanitized medical-report summary only. Raw pasted/uploaded report text is not included.": "Résumé assaini du rapport médical uniquement. Le texte brut collé ou importé n’est pas inclus.",
    "Recognized markers": "Marqueurs reconnus",
    "Within general range": "Dans la plage générale",
    "Outside general range": "Hors plage générale",
    "Saved content": "Contenu enregistré",
    "Marker names, values, status, clinician questions; no raw report text": "Noms, valeurs et statuts des marqueurs, plus questions au clinicien ; aucun texte brut du rapport",
    "All recognized markers fall within the reference ranges shown here. That does not confirm overall health. Check each range-source label: the laboratory range is preferred when parsed; otherwise the page uses a general fallback that may not apply to you.\\n\\n": "Tous les marqueurs reconnus se situent dans les plages de référence affichées. Cela ne confirme pas l’état de santé général. Vérifiez la source de chaque plage : la plage du laboratoire est prioritaire lorsqu’elle est extraite ; sinon la page utilise une plage générale qui peut ne pas vous convenir.\\n\\n",
    "Use this as a visit-prep note: ask your clinician whether these tests should be repeated, whether any missing markers matter for you, and what interval is appropriate for your situation.": "Utilisez ceci pour préparer la consultation : demandez au clinicien si ces analyses doivent être répétées, si des marqueurs absents comptent dans votre situation et quel intervalle convient.",
    "normal.length + ' recognized marker' + (normal.length === 1 ? ' is' : 's are') + ' within its displayed reference range and ' + abnormal.length + ' marker' + (abnormal.length === 1 ? ' is' : 's are') + ' outside it.\\n\\n'": "normal.length + ' marqueur' + (normal.length === 1 ? ' reconnu se situe' : 's reconnus se situent') + ' dans la plage affichée et ' + abnormal.length + ' marqueur' + (abnormal.length === 1 ? ' se situe' : 's se situent') + ' hors plage.\\n\\n'",
    "Markers to discuss:\\n\\n": "Marqueurs à discuter :\\n\\n",
    "'- ' + r.biomarker.name + ' (' + r.key + '): ' + r.value + ' ' + r.biomarker.unit + ' is ' + direction + ' the displayed ' + (r.referenceSource === 'lab' ? 'laboratory' : 'general fallback') + ' range. ' + r.biomarker.explain + '\\n\\n'": "'- ' + r.biomarker.name + ' (' + r.key + ') : ' + r.value + ' ' + r.biomarker.unit + ' se situe ' + (direction === 'above' ? 'au-dessus de' : 'en dessous de') + ' la plage ' + (r.referenceSource === 'lab' ? 'du laboratoire' : 'générale de secours') + ' affichée. ' + r.biomarker.explain + '\\n\\n'",
    "A single outside-range result is not a diagnosis. Lab variation, timing, diet, hydration, exercise, stress, medicines, and illness can affect results. Ask your healthcare provider whether a repeat test, related marker, or urgent review is needed.": "Un résultat hors plage ne constitue pas un diagnostic. Les variations du laboratoire, le moment, l’alimentation, l’hydratation, l’exercice, le stress, les médicaments et une maladie peuvent influencer les résultats. Demandez à votre professionnel de santé si un nouveau contrôle, un marqueur associé ou une revue urgente est nécessaire."
  };
  let result = html;
  Object.entries(replacements).forEach(([english, french]) => {
    result = result.split(english).join(french);
  });
  Object.entries(medicalRuntimeSentences).forEach(([english, french]) => {
    result = result.split(english).join(french);
  });
  return result;
}

function buildPage(row, cache, routeMap) {
  const source = fs.readFileSync(englishFile(row.englishRoute), "utf8");
  const strings = new Set([...collectVisibleStrings(source), ...collectScriptStrings(source, row.englishRoute)]);
  const title = titleById[row.englishId] || cache[row.englishName] || row.englishName;
  const englishDescription = (source.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || []);
  const descriptionSource = cleanText(englishDescription[2] == null ? englishDescription[3] : englishDescription[2]);
  const description = clipWords(cache[descriptionSource] || `Outil de santé gratuit en français pour ${title.toLowerCase()}, avec calcul local, limites visibles et sources à vérifier.`, 165);
  const scripts = rewriteAppScripts(source, row.englishRoute);
  let html = removeJsonLd(scripts.html);
  html = mapInternalRoutes(html, routeMap);
  html = scripts.restore(html);
  html = localizeMedicalReportRuntime(html, row.englishId);
  html = translateStatic(html, cache);
  html = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeText(title)}</h1>`);
  html = replaceHeadMetadata(html, row, title, description);
  html = html
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "")
    .replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "")
    .replace(/<noscript>\s*<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>\s*<\/noscript>\s*/gi, "");
  if (!/\/assets\/fonts\/typography\.css/.test(html)) {
    html = html.replace("</head>", `<link rel="stylesheet" href="/assets/fonts/typography.css?v=2f0aa84f">\n</head>`);
  }
  const dictionary = pageDictionary(strings, cache);
  const payload = `<script type="application/json" id="fr-health-translations">${JSON.stringify(dictionary).replace(/</g, "\\u003c")}</script><script src="${RUNTIME}" defer></script>`;
  const additions = `${schema(title, description, row.primaryFrenchRoute)}\n${style()}\n${payload}`;
  html = html.replace("</head>", `${additions}\n</head>`);
  const safety = safetySection(title, normalizeRoute(row.englishRoute));
  html = html.includes("</main>") ? html.replace("</main>", `${safety}</main>`) : html.replace("</body>", `${safety}</body>`);
  return `<!-- French Health parity owner: scripts/build-french-health-parity.js; English engine preserved. -->\n${html}`;
}

function buildHub(rows, cache) {
  const groups = [
    {
      title: "Mesures, prévention et suivi",
      description: "Des fiches pour organiser des mesures, repérer les limites d'un résultat et préparer une discussion avec un professionnel.",
      ids: ["bmi-calculator", "bmi-calc-tools", "waist-hip-ratio", "blood-pressure", "diabetes-risk", "water-intake", "water-quality", "malaria-risk"]
    },
    {
      title: "Grossesse, naissance et santé de l'enfant",
      description: "Des outils de calendrier, de préparation et de suivi qui ne remplacent jamais une maternité, une sage-femme ou un service pédiatrique.",
      ids: ["due-date", "due-date-tools", "ovulation-calc", "maternal-mortality", "childbirth-cost", "csection-vs-natural", "pregnancy-nutrition", "child-growth", "breastfeeding-tracker", "vaccine-schedule"]
    },
    {
      title: "Analyses, médicaments et situations infectieuses",
      description: "Des parcours conservateurs pour comprendre quoi vérifier, quoi documenter et quand passer immédiatement à un service de santé.",
      ids: ["medical-report", "genotype-checker", "blood-group", "sickle-cell", "drug-dosage", "hiv-treatment-cost", "tb-tracker", "cholera-risk", "ebola-checklist", "hep-b-screening"]
    },
    {
      title: "Coûts, devis et accès aux soins",
      description: "Des budgets construits uniquement avec vos devis et hypothèses, sans classement clinique, prix prétendument en direct ni promesse de couverture.",
      ids: ["hospital-cost", "clinic-costs", "pharmacy-prices", "drug-price-compare", "dental-cost", "eye-care-cost", "mental-health-cost", "traditional-vs-western", "medical-tourism"]
    },
    {
      title: "Alimentation et activité",
      description: "Des journaux et planificateurs locaux pour vos propres choix alimentaires et activités, sans régime prescrit ni objectif médical automatique.",
      ids: ["calorie-counter", "calorie-counter-tools", "african-meal-plan", "gym-cost-compare", "home-workout"]
    }
  ];
  const rowById = new Map(rows.map((row) => [row.englishId, row]));
  const seen = [];
  const sections = groups.map((group) => {
    const cards = group.ids.map((id) => {
      const row = rowById.get(id);
      if (!row) throw new Error(`French Health hub group references unknown id: ${id}`);
      seen.push(id);
      const title = titleById[id] || cache[row.englishName] || row.englishName;
      const english = fs.readFileSync(englishFile(row.englishRoute), "utf8");
      const descriptionMatch = english.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || [];
      const descriptionSource = cleanText(descriptionMatch[2] == null ? descriptionMatch[3] : descriptionMatch[2]);
      const description = cache[descriptionSource] || "Outil gratuit avec traitement local, limites visibles et vérification professionnelle.";
      const imageMatch = english.match(/<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=("([^"]*)"|'([^']*)')/i) || [];
      const image = imageMatch[2] == null ? imageMatch[3] : imageMatch[2];
      return `<article class="frh-card"><a href="${normalizeRoute(row.primaryFrenchRoute)}/"><img src="${escapeAttribute(image || "https://afrotools.com/assets/img/og-default.png", '"')}" alt="" width="800" height="450" loading="lazy"><span class="frh-card-body"><strong>${escapeText(title)}</strong><span>${escapeText(description)}</span><em>Ouvrir l'outil</em></span></a></article>`;
    }).join("");
    return `<section class="frh-group" aria-labelledby="frh-${group.ids[0]}"><div class="frh-group-head"><p>Parcours santé</p><h2 id="frh-${group.ids[0]}">${group.title}</h2><span>${group.description}</span></div><div class="frh-grid">${cards}</div></section>`;
  }).join("");
  if (new Set(seen).size !== 42 || seen.length !== 42) {
    throw new Error(`French Health hub must list 42 unique apps; found ${new Set(seen).size}/${seen.length}.`);
  }
  const itemList = rows.map((row, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: titleById[row.englishId] || cache[row.englishName] || row.englishName,
    url: "https://afrotools.com" + normalizeRoute(row.primaryFrenchRoute) + "/"
  }));
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Outils de santé et de bien-être en français",
      description: "42 applications gratuites en français pour organiser des mesures, des questions, des dates et des budgets de santé sans diagnostic ni prescription.",
      url: "https://afrotools.com/fr/health/",
      inLanguage: "fr",
      isPartOf: { "@type": "WebSite", name: "AfroTools", url: "https://afrotools.com/" },
      mainEntity: { "@type": "ItemList", numberOfItems: 42, itemListElement: itemList }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "fr",
      mainEntity: [
        {
          "@type": "Question",
          name: "Les outils santé AfroTools peuvent-ils poser un diagnostic ?",
          acceptedAnswer: { "@type": "Answer", text: "Non. Ils servent à organiser une mesure, un calendrier, un devis ou des questions. Un professionnel de santé, un laboratoire, un pharmacien ou un service d'urgence reste l'autorité." }
        },
        {
          "@type": "Question",
          name: "Les données de santé sont-elles envoyées à un serveur ?",
          acceptedAnswer: { "@type": "Answer", text: "Le parcours principal de ces applications fonctionne localement dans le navigateur. Une fonction réseau facultative doit demander un consentement explicite et préciser les données envoyées." }
        }
      ]
    }
  ];
  return `<!doctype html>
<html lang="fr" data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>42 outils santé gratuits en français | AfroTools</title>
<meta name="description" content="Utilisez 42 applications santé gratuites en français : mesures, grossesse, analyses, prévention, devis de soins, alimentation et activité, avec limites claires.">
<meta name="robots" content="index,follow"><meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools"><meta property="og:locale" content="fr_FR">
<meta property="og:title" content="42 outils santé gratuits en français | AfroTools"><meta property="og:description" content="Des applications santé complètes en français, locales par défaut et conçues pour préparer une décision sans diagnostic ni prescription."><meta property="og:url" content="https://afrotools.com/fr/health/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/medical-report.webp">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="42 outils santé gratuits en français | AfroTools"><meta name="twitter:description" content="Mesures, grossesse, analyses, prévention, coûts, alimentation et activité avec une sécurité médicale explicite."><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/medical-report.webp">
<link rel="stylesheet" href="/assets/fonts/typography.css?v=2f0aa84f"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
<link rel="canonical" href="https://afrotools.com/fr/health/"><link rel="alternate" hreflang="en" href="https://afrotools.com/health/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/health/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/afya/"><link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/lafiya/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/health/">
<script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script><script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<script type="application/ld+json">${JSON.stringify(structured)}</script>
<style>
:root{--frh-bg:#f5f8fc;--frh-card:#fff;--frh-text:#0f172a;--frh-muted:#526174;--frh-border:#dbe4ee;--frh-soft:#eaf3ff}[data-theme=dark]{--frh-bg:#0b1220;--frh-card:#111c2d;--frh-text:#f8fafc;--frh-muted:#bdc8d5;--frh-border:#30415a;--frh-soft:#102744}body{margin:0;background:var(--frh-bg);color:var(--frh-text);overflow-x:hidden}.frh-shell{max-width:1180px;margin:auto;padding:0 20px}.frh-hero{background:#071b33;color:#fff;padding:clamp(42px,8vw,86px) 0}.frh-kicker{display:inline-block;color:#8fd3ff;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.frh-hero h1{max-width:900px;margin:12px 0 16px;font-size:clamp(2.3rem,6vw,4.6rem);line-height:1.02}.frh-hero p{max-width:800px;color:#cfdef0;font-size:clamp(1rem,2vw,1.2rem);line-height:1.7}.frh-badges{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}.frh-badges span{padding:8px 12px;border:1px solid #315273;border-radius:999px;background:#102b49;font-weight:700}.frh-alert{margin:-22px auto 34px;position:relative;padding:18px 20px;border:1px solid #f4c94f;border-radius:14px;background:#fff9df;color:#713f12;box-shadow:0 12px 30px #071b3322}.frh-alert strong{display:block;margin-bottom:4px}.frh-main{padding:42px 0 72px}.frh-group{margin:0 0 48px}.frh-group-head{max-width:760px;margin-bottom:18px}.frh-group-head p{margin:0 0 6px;color:#08786f;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}.frh-group-head h2{margin:0 0 8px;font-size:clamp(1.55rem,3vw,2.2rem)}.frh-group-head span{color:var(--frh-muted);line-height:1.65}.frh-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.frh-card{min-width:0;border:1px solid var(--frh-border);border-radius:16px;overflow:hidden;background:var(--frh-card);box-shadow:0 8px 22px #0f172a0d}.frh-card a{display:block;height:100%;color:inherit;text-decoration:none}.frh-card img{display:block;width:100%;height:142px;object-fit:cover;background:var(--frh-soft)}.frh-card-body{display:flex;flex-direction:column;gap:8px;padding:16px}.frh-card strong{font-size:1.03rem;line-height:1.3}.frh-card span span{color:var(--frh-muted);line-height:1.55;font-size:.91rem}.frh-card em{margin-top:auto;color:#005fbe;font-style:normal;font-weight:800}.frh-card a:focus-visible{outline:3px solid #f59e0b;outline-offset:-3px}.frh-proof{padding:24px;border:1px solid var(--frh-border);border-radius:18px;background:var(--frh-card)}.frh-proof h2{margin-top:0}.frh-proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.frh-proof-grid div{padding:14px;border-left:4px solid #0f766e;background:var(--frh-soft);border-radius:8px}.frh-proof p{color:var(--frh-muted);line-height:1.65}@media(max-width:860px){.frh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.frh-proof-grid{grid-template-columns:1fr}}@media(max-width:560px){.frh-shell{padding:0 14px}.frh-grid{grid-template-columns:1fr}.frh-card img{height:128px}.frh-hero{padding:44px 0 58px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style></head>
<body><afro-navbar active="health"></afro-navbar>
<header class="frh-hero"><div class="frh-shell"><span class="frh-kicker">Santé et bien-être · français</span><h1>42 outils utiles, avec la même exigence que les applications anglaises</h1><p>Mesurez, organisez, comparez et préparez vos questions en français. Les moteurs de calcul sont ceux des applications anglaises vérifiées; les interfaces, résultats, limites, sources et exports sont adaptés au parcours francophone.</p><div class="frh-badges"><span>42 applications gratuites</span><span>Traitement local par défaut</span><span>Aucun diagnostic</span><span>Mobile et mode sombre</span></div></div></header>
<main class="frh-main"><div class="frh-shell"><aside class="frh-alert" role="note"><strong>Une urgence médicale passe avant tout calcul.</strong>N'attendez jamais le résultat d'un outil en cas de détresse respiratoire, douleur thoracique, confusion, convulsions, saignement important, déshydratation sévère, réaction grave, grossesse inquiétante ou aggravation rapide. Contactez le service local disponible.</aside>${sections}<section class="frh-proof" data-tool-verification-panel><h2>Une limite claire pour chaque application</h2><div class="frh-proof-grid"><div><strong>Moteurs identiques</strong><p>Les pages françaises appellent les mêmes moteurs validés que les pages anglaises. Les unités et règles de calcul ne sont pas retraduites ni réinventées.</p></div><div><strong>Confidentialité</strong><p>Les données de santé restent dans le navigateur pour le parcours principal. Les exports sont locaux et aucune fonction réseau facultative ne doit agir sans consentement explicite.</p></div><div><strong>Autorité</strong><p>Les résultats servent à préparer une discussion. Le professionnel de santé, laboratoire, pharmacien, établissement, programme national ou service d'urgence reste l'autorité.</p></div></div></section></div></main>
<afro-footer></afro-footer><script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script></body></html>`;
}

async function main() {
  const inventory = readJson(INVENTORY, null);
  if (!inventory) throw new Error("French parity inventory is missing.");
  const rows = inventory.rows.filter((row) => row.categoryKey === "health");
  if (rows.length !== 42) throw new Error(`Expected 42 Health rows; found ${rows.length}.`);
  if (rows.some((row) => !row.primaryFrenchFile || !row.primaryFrenchRoute)) {
    throw new Error("Every Health row must have one French owner route before generation.");
  }
  const routeMap = new Map(rows.map((row) => [normalizeRoute(row.englishRoute), normalizeRoute(row.primaryFrenchRoute)]));
  const cache = Object.assign({}, readJson(CACHE, {}), manual);
  Object.keys(cache).forEach((key) => {
    if (/___FR_HEALTH_(?:PROTECTED|SCRIPT_TAG)_/i.test(key)) delete cache[key];
    else cache[key] = postCorrectFrench(cache[key]);
  });
  const strings = new Set();
  rows.forEach((row) => {
    const html = fs.readFileSync(englishFile(row.englishRoute), "utf8");
    collectVisibleStrings(html).forEach((value) => strings.add(value));
    collectScriptStrings(html, row.englishRoute).forEach((value) => strings.add(value));
    strings.add(row.englishName);
  });
  if (REFRESH) await populateCache(strings, cache);
  const missing = [...strings].filter((value) => !cache[value]);
  if (missing.length) {
    throw new Error(`${missing.length} French Health strings are not translated. Run with --refresh-translations --write.`);
  }
  const sortedCache = Object.fromEntries(Object.entries(cache).sort((a, b) => a[0].localeCompare(b[0])));
  const changes = [];
  rows.forEach((row) => {
    const output = path.join(ROOT, row.primaryFrenchFile);
    const dedicatedOwner = DEDICATED_ROUTE_OWNERS.get(row.englishId);
    if (dedicatedOwner) {
      if (row.primaryFrenchFile !== dedicatedOwner.file) {
        throw new Error(`${row.englishId}: dedicated French owner moved from ${dedicatedOwner.file} to ${row.primaryFrenchFile}`);
      }
      const current = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
      const missingContract = dedicatedOwner.required.find((pattern) => !pattern.test(current));
      if (missingContract) {
        throw new Error(`${row.englishId}: dedicated French owner failed contract ${missingContract}`);
      }
      return;
    }
    const next = buildPage(row, sortedCache, routeMap);
    const current = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
    if (current !== next) changes.push(row.primaryFrenchFile);
    if (WRITE) {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, next);
    }
  });
  const hubOutput = path.join(ROOT, "fr", "health", "index.html");
  const hubNext = buildHub(rows, sortedCache);
  const hubCurrent = fs.existsSync(hubOutput) ? fs.readFileSync(hubOutput, "utf8") : "";
  if (hubCurrent !== hubNext) changes.push("fr/health/index.html");
  if (WRITE) fs.writeFileSync(hubOutput, hubNext);
  if (WRITE) {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(sortedCache, null, 2) + "\n");
  }
  console.log(JSON.stringify({
    healthApps: rows.length,
    translatedStrings: Object.keys(sortedCache).length,
    missingStrings: missing.length,
    changedPages: changes.filter((file) => file !== "fr/health/index.html").length,
    hubChanged: changes.includes("fr/health/index.html"),
    mode: WRITE ? "write" : "check"
  }, null, 2));
  if (!WRITE && changes.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
