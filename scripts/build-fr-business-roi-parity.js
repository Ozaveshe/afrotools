const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function field(label, name, options = {}) {
  return { label, name, type: "number", ...options };
}

const currencies = [
  ["XOF", "Franc CFA BCEAO"], ["XAF", "Franc CFA BEAC"], ["EUR", "Euro"],
  ["NGN", "Naira"], ["GHS", "Cedi"], ["KES", "Shilling kényan"], ["ZAR", "Rand"], ["USD", "Dollar US"]
];

const pages = [
  {
    id: "pomodoro", slug: "minuteur-pomodoro", en: "/tools/pomodoro/", sw: "/sw/zana/pomodoro/", name: "Minuteur Pomodoro",
    title: "Minuteur Pomodoro en français | AfroTools",
    description: "Planifiez et lancez localement des sessions Pomodoro, pauses et cycles de concentration avec statistiques enregistrées sur cet appareil.",
    intro: "Choisissez vos durées et le nombre de sessions. Le minuteur reste dans votre navigateur; aucune activité n’est envoyée.",
    fields: [
      field("Concentration (minutes)", "focusMinutes", { min: 1, step: 1, value: 25 }),
      field("Pause courte (minutes)", "shortBreakMinutes", { min: 1, step: 1, value: 5 }),
      field("Pause longue (minutes)", "longBreakMinutes", { min: 1, step: 1, value: 15 }),
      field("Sessions par cycle", "sessions", { min: 1, max: 12, step: 1, value: 4 })
    ]
  },
  {
    id: "unit-converter", slug: "convertisseur-unites", en: "/tools/unit-converter/", sw: "/sw/zana/kubadilisha-vipimo/", name: "Convertisseur d’unités africaines",
    title: "Convertisseur d’unités africaines | AfroTools",
    description: "Convertissez longueur, masse, superficie, température et données, notamment parcelle nigériane et morgen sud-africain.",
    intro: "Le moteur partagé applique des facteurs déterministes. Les unités foncières locales peuvent varier selon la pratique; confirmez les actes et relevés.",
    fields: [
      field("Famille", "group", { type: "select", choices: [["length", "Longueur"], ["mass", "Masse"], ["area", "Superficie"], ["temperature", "Température"], ["data", "Données"]] }),
      field("Valeur", "value", { min: -1000000000, step: "any", value: 1 }),
      field("Unité source", "from", { type: "select", choices: [["m", "mètre"], ["km", "kilomètre"], ["cm", "centimètre"], ["ft", "pied"], ["kg", "kilogramme"], ["g", "gramme"], ["lb", "livre"], ["sqm", "m²"], ["hectare", "hectare"], ["acre", "acre"], ["plot_ng", "parcelle nigériane indicative"], ["morgen_za", "morgen sud-africain"], ["C", "°C"], ["F", "°F"], ["K", "kelvin"], ["byte", "octet"], ["kb", "Kio"], ["mb", "Mio"], ["gb", "Gio"]] }),
      field("Unité cible", "to", { type: "select", choices: [["km", "kilomètre"], ["m", "mètre"], ["cm", "centimètre"], ["ft", "pied"], ["kg", "kilogramme"], ["g", "gramme"], ["lb", "livre"], ["sqm", "m²"], ["hectare", "hectare"], ["acre", "acre"], ["plot_ng", "parcelle nigériane indicative"], ["morgen_za", "morgen sud-africain"], ["C", "°C"], ["F", "°F"], ["K", "kelvin"], ["byte", "octet"], ["kb", "Kio"], ["mb", "Mio"], ["gb", "Gio"]] })
    ]
  },
  {
    id: "budget-planner", slug: "planificateur-budget", en: "/tools/budget-planner/", sw: "/sw/zana/mpango-bajeti/", name: "Planificateur de budget mensuel",
    title: "Planificateur de budget mensuel | AfroTools",
    description: "Calculez revenus, besoins, envies, soutien familial, épargne, solde et répartition 50/30/20 avec export local.",
    intro: "Saisissez vos propres montants. La règle 50/30/20 est un repère modifiable, pas un conseil financier ni un objectif obligatoire.",
    fields: [
      field("Devise", "currency", { type: "select", choices: currencies }),
      field("Revenu principal", "incomeMain", { min: 0, step: .01, value: 1000 }),
      field("Autres revenus", "incomeOther", { min: 0, step: .01, value: 0 }),
      field("Logement", "housing", { min: 0, step: .01, value: 300 }),
      field("Alimentation", "food", { min: 0, step: .01, value: 150 }),
      field("Transport", "transport", { min: 0, step: .01, value: 100 }),
      field("Soutien familial", "family", { min: 0, step: .01, value: 50 }),
      field("Envies et loisirs", "wants", { min: 0, step: .01, value: 100 }),
      field("Épargne planifiée", "savings", { min: 0, step: .01, value: 100 })
    ]
  },
  {
    id: "countdown-timer", slug: "compte-a-rebours", en: "/tools/countdown-timer/", sw: "/sw/zana/hesabu-siku-za-tukio/", name: "Compte à rebours d’événement",
    title: "Compte à rebours d’événement | AfroTools",
    description: "Créez un compte à rebours local avec jours, heures, minutes et secondes, puis enregistrez son résumé sur votre appareil.",
    intro: "Le décompte utilise la date et l’heure de votre appareil. Confirmez le fuseau et toute échéance officielle séparément.",
    fields: [
      field("Nom de l’événement", "eventName", { type: "text", required: true, value: "Événement" }),
      field("Date", "eventDate", { type: "date", required: true }),
      field("Heure locale", "eventTime", { type: "time", required: true, value: "09:00" })
    ]
  },
  {
    id: "time-zone", slug: "fuseaux-horaires", en: "/tools/time-zone/", sw: "/sw/zana/kigeuzi-saa-za-maeneo/", name: "Convertisseur de fuseaux horaires",
    title: "Convertisseur de fuseaux horaires africains | AfroTools",
    description: "Convertissez une date et une heure entre les principaux fuseaux africains avec gestion déterministe des règles IANA.",
    intro: "Le moteur utilise les fuseaux IANA du navigateur, y compris leurs règles saisonnières. Vérifiez séparément les rendez-vous critiques.",
    fields: [
      field("Date et heure source", "localDateTime", { type: "datetime-local", required: true }),
      field("Fuseau source", "fromZone", { type: "select", choices: [["Africa/Abidjan", "Abidjan / Accra (GMT)"], ["Africa/Lagos", "Lagos (WAT)"], ["Africa/Johannesburg", "Johannesburg (SAST)"], ["Africa/Cairo", "Le Caire"], ["Africa/Nairobi", "Nairobi (EAT)"], ["Africa/Casablanca", "Casablanca"], ["Indian/Mauritius", "Maurice"], ["Africa/Windhoek", "Windhoek"]] }),
      field("Fuseau cible", "toZone", { type: "select", choices: [["Africa/Nairobi", "Nairobi (EAT)"], ["Africa/Abidjan", "Abidjan / Accra (GMT)"], ["Africa/Lagos", "Lagos (WAT)"], ["Africa/Johannesburg", "Johannesburg (SAST)"], ["Africa/Cairo", "Le Caire"], ["Africa/Casablanca", "Casablanca"], ["Indian/Mauritius", "Maurice"], ["Africa/Windhoek", "Windhoek"]] })
    ]
  },
  {
    id: "public-holidays", slug: "jours-feries", en: "/tools/public-holidays/", sw: "/sw/zana/kalenda-likizo-za-umma/", name: "Entrée de jour férié confirmée",
    title: "Jour férié africain confirmé vers ICS | AfroTools",
    description: "Après vérification d’un avis officiel, préparez localement une entrée de calendrier ICS pour quatre sources gouvernementales africaines.",
    intro: "AfroTools ne publie pas un calendrier national complet. Vous confirmez une date depuis l’autorité liée; les proclamations et substitutions peuvent changer.",
    fields: [
      field("Source officielle", "country", { type: "select", choices: [["ZA", "Afrique du Sud"], ["KE", "Kenya"], ["GH", "Ghana"], ["NG", "Nigeria"]] }),
      field("Nom indiqué dans l’avis", "name", { type: "text", required: true }),
      field("Date locale confirmée", "date", { type: "date", required: true }),
      field("Note non sensible", "note", { type: "textarea" }),
      field("J’ai vérifié l’avis officiel actuel", "confirmed", { type: "checkbox", required: true })
    ],
    extraFormats: ["ics"]
  },
  {
    id: "working-days", slug: "jours-ouvrables", en: "/tools/working-days/", sw: "/sw/zana/siku-za-kazi/", name: "Calculateur de jours ouvrables",
    title: "Calculateur de jours ouvrables | AfroTools",
    description: "Comptez les jours ouvrables entre deux dates et excluez les fins de semaine ainsi que des dates fériées que vous avez vérifiées.",
    intro: "Les jours fériés varient et peuvent être proclamés tardivement. Collez seulement les dates confirmées, une par ligne.",
    fields: [
      field("Date de début", "start", { type: "date", required: true }),
      field("Date de fin", "end", { type: "date", required: true }),
      field("Dates fériées confirmées (AAAA-MM-JJ)", "holidays", { type: "textarea", placeholder: "2026-08-04\n2026-12-25" })
    ]
  },
  {
    id: "age-calculator", slug: "calculateur-age", en: "/tools/age-calculator/", sw: "/sw/zana/kikokotoo-umri/", name: "Calculateur d’âge exact",
    title: "Calculateur d’âge exact | AfroTools",
    description: "Calculez l’âge en années, mois et jours, les totaux et le délai jusqu’au prochain anniversaire.",
    intro: "Le calcul est calendaire et local. Il ne vérifie aucun document d’identité et ne conserve pas la date saisie.",
    fields: [
      field("Date de naissance", "birthDate", { type: "date", required: true }),
      field("Calculer à la date", "atDate", { type: "date", required: true })
    ]
  },
  {
    id: "grade-tracker", slug: "suivi-notes", en: "/tools/grade-tracker/", sw: "/sw/zana/kifuatiliaji-alama/", name: "Suivi de notes et GPA",
    title: "Suivi de notes, GPA et objectif CGPA | AfroTools",
    description: "Calculez GPA, CGPA, crédits, points qualité et GPA futur requis à partir de matières pondérées.",
    intro: "Choisissez la même échelle que votre établissement. Les résultats servent à la planification et ne remplacent pas un relevé officiel.",
    fields: [
      field("Échelle maximale", "scale", { type: "select", choices: [["5", "5 points"], ["4", "4 points"], ["100", "100 points"]] }),
      field("Matière 1", "course1", { type: "text", required: true, value: "Matière A" }),
      field("Crédits 1", "credits1", { min: 0, step: 1, value: 3 }),
      field("Points 1", "points1", { min: 0, step: .01, value: 4 }),
      field("Matière 2", "course2", { type: "text", value: "Matière B" }),
      field("Crédits 2", "credits2", { min: 0, step: 1, value: 2 }),
      field("Points 2", "points2", { min: 0, step: .01, value: 3 }),
      field("GPA précédent", "previousGpa", { min: 0, step: .01, value: 0 }),
      field("Crédits précédents", "previousCredits", { min: 0, step: 1, value: 0 }),
      field("CGPA cible", "targetGpa", { min: 0, step: .01, value: 0 }),
      field("Futurs crédits", "futureCredits", { min: 0, step: 1, value: 0 })
    ]
  },
  {
    id: "random-picker", slug: "selecteur-aleatoire", en: "/tools/random-picker/", sw: "/sw/zana/chaguo-nasibu/", name: "Sélecteur aléatoire",
    title: "Sélecteur aléatoire et équipes | AfroTools",
    description: "Tirez un élément ou répartissez une liste en équipes avec l’aléa cryptographique local du navigateur.",
    intro: "Le tirage se fait localement avec crypto.getRandomValues. Ce n’est pas un système certifié pour jeux d’argent, concours réglementés ou élections.",
    fields: [
      field("Éléments (un par ligne)", "items", { type: "textarea", required: true, value: "Amina\nKofi\nFatou\nThabo" }),
      field("Mode", "mode", { type: "select", choices: [["pick", "Choisir un élément"], ["teams", "Créer des équipes"]] }),
      field("Nombre d’équipes", "teamCount", { min: 2, max: 20, step: 1, value: 2 })
    ]
  },
  {
    id: "meeting-cost", slug: "cout-reunion", en: "/tools/meeting-cost/", sw: "/sw/zana/gharama-ya-mkutano/", name: "Coût réel d’une réunion",
    title: "Calculateur de coût de réunion | AfroTools",
    description: "Estimez coût de réunion, coût par minute, coût annuel et heures-personnes à partir des salaires et hypothèses.",
    intro: "Le résultat est un coût interne de planification, pas une valorisation de la performance des personnes.",
    fields: [
      field("Devise", "currency", { type: "select", choices: currencies }),
      field("Participants", "attendees", { min: 1, step: 1, value: 5 }),
      field("Salaire annuel moyen", "annualSalary", { min: 0, step: .01, value: 52000 }),
      field("Durée (minutes)", "durationMinutes", { min: 1, step: 1, value: 60 }),
      field("Multiplicateur de charges", "overhead", { min: 0, step: .1, value: 1.5 }),
      field("Réunions par an", "annualFrequency", { min: 0, step: 1, value: 52 }),
      field("Heures de travail annuelles", "workHoursPerYear", { min: 1, step: 1, value: 2080 })
    ]
  },
  {
    id: "tip-calculator", slug: "calculateur-pourboire", en: "/tools/tip-calculator/", sw: "/sw/zana/kigawanya-bili-na-tip/", name: "Pourboire et partage d’addition",
    title: "Calculateur de pourboire et partage | AfroTools",
    description: "Calculez taxe, pourboire sur le montant hors taxe, arrondi et part par personne dans plusieurs devises.",
    intro: "Le service, la taxe et les usages varient. Vérifiez l’addition et choisissez vous-même le pourcentage.",
    fields: [
      field("Devise", "currency", { type: "select", choices: currencies }),
      field("Montant de l’addition", "bill", { min: 0, step: .01, value: 100 }),
      field("Pourboire (%)", "tipRate", { min: 0, step: .01, value: 10 }),
      field("Taxe (%)", "taxRate", { min: 0, step: .01, value: 0 }),
      field("Nombre de personnes", "people", { min: 1, step: 1, value: 2 }),
      field("Arrondir au multiple de", "roundTo", { min: 0, step: .01, value: 0 })
    ]
  }
];

function inputMarkup(item) {
  const id = `f-${item.name}`;
  const required = item.required ? " required" : "";
  if (item.type === "select") {
    return `<label for="${id}">${item.label}</label><select id="${id}" name="${item.name}"${required}>${item.choices.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select>`;
  }
  if (item.type === "textarea") {
    return `<label for="${id}">${item.label}</label><textarea id="${id}" name="${item.name}"${required} placeholder="${item.placeholder || ""}">${item.value || ""}</textarea>`;
  }
  if (item.type === "checkbox") {
    return `<label class="check" for="${id}"><input id="${id}" name="${item.name}" type="checkbox"${required}><span>${item.label}</span></label>`;
  }
  return `<label for="${id}">${item.label}</label><input id="${id}" name="${item.name}" type="${item.type}"${required}${item.min !== undefined ? ` min="${item.min}"` : ""}${item.max !== undefined ? ` max="${item.max}"` : ""}${item.step !== undefined ? ` step="${item.step}"` : ""}${item.value !== undefined ? ` value="${item.value}"` : ""}>`;
}

function pageHtml(page) {
  const canonical = `https://afrotools.com/fr/tools/${page.slug}/`;
  const image = `https://afrotools.com/assets/img/tools/${page.id}.webp`;
  const formats = ["pdf", "csv", "json", "txt"].concat(page.extraFormats || []);
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: page.name,
    applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "fr",
    isAccessibleForFree: true, url: canonical, image
  });
  return `<!doctype html>
<html lang="fr" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title}</title><meta name="description" content="${page.description}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com${page.en}">${page.sw ? `<link rel="alternate" hreflang="sw" href="https://afrotools.com${page.sw}">` : ""}
<link rel="alternate" hreflang="x-default" href="https://afrotools.com${page.en}">
<meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}">
<meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}">
<script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/assets/css/tokens.css"><link rel="stylesheet" href="/assets/css/design-system.css">
<style>
body{margin:0;background:#f4f7fb;color:#102033;font-family:Inter,system-ui,sans-serif}.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.hero{background:#071d35;color:#fff;padding:50px 0 42px}.hero a{color:#9fc5ff}.hero h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.05;margin:.8rem 0}.hero p{max-width:760px;line-height:1.7;color:#d8e6f5}.layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:24px;padding:28px 0 54px}.panel{background:#fff;border:1px solid #d9e2ec;border-radius:18px;padding:24px;box-shadow:0 14px 35px rgba(13,37,61,.08)}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.fields label{font-weight:750;font-size:.9rem}.fields input,.fields select,.fields textarea{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid #bac8d8;border-radius:10px;background:#fff;color:#102033;font:inherit;min-height:46px}.fields textarea{min-height:96px;resize:vertical}.check{grid-column:1/-1;display:flex;gap:10px;align-items:flex-start}.check input{width:22px;min-height:22px;margin:0}.primary,.actions button{border:0;border-radius:10px;padding:12px 16px;font-weight:800;cursor:pointer}.primary{width:100%;margin-top:18px;background:#1167d8;color:#fff;min-height:48px}.status{min-height:24px;margin:12px 0 0}.result{outline:none}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{background:#eef5ff;border-radius:12px;padding:14px}.metric span{display:block;color:#52667c;font-size:.78rem;text-transform:uppercase}.metric strong{display:block;margin-top:4px;font-size:1.05rem;overflow-wrap:anywhere}.details{width:100%;border-collapse:collapse;margin-top:14px}.details td{padding:10px;border-bottom:1px solid #e5ebf2;vertical-align:top}.details td:first-child{font-weight:700}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.actions button{background:#eaf2fc;color:#0b4d9c}.boundary{margin-top:18px;padding:14px;border-left:4px solid #d79a1e;background:#fff8df;line-height:1.6}.source{margin-top:14px;font-size:.9rem;color:#4c6075}.source a{color:#075fc7}html[data-theme=dark] body{background:#07131f;color:#e8f0f8}html[data-theme=dark] .panel{background:#102335;border-color:#31506c;color:#eef6ff}html[data-theme=dark] .fields input,html[data-theme=dark] .fields select,html[data-theme=dark] .fields textarea{background:#081725;border-color:#48647e;color:#fff}html[data-theme=dark] .metric,html[data-theme=dark] .actions button{background:#183650;color:#fff}html[data-theme=dark] .metric span,html[data-theme=dark] .source{color:#bbccdc}html[data-theme=dark] .boundary{background:#3a3117;color:#fff}@media(prefers-color-scheme:dark){html:not([data-theme]) body{background:#07131f;color:#e8f0f8}html:not([data-theme]) .panel{background:#102335;border-color:#31506c;color:#eef6ff}}@media(max-width:760px){.layout{grid-template-columns:1fr}.fields,.metrics{grid-template-columns:1fr}.wrap{width:min(100% - 20px,1120px)}.panel{padding:18px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style></head><body>
<afro-navbar></afro-navbar>
<header class="hero"><div class="wrap"><nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/business-roi/">Business et productivité</a></nav><h1>${page.name}</h1><p>${page.intro}</p></div></header>
<main class="wrap layout" data-business-app data-tool="${page.id}">
<section class="panel"><h2>Vos paramètres</h2><form data-business-form><div class="fields">${page.fields.map(inputMarkup).join("")}</div><button class="primary" type="submit">Calculer et préparer le résultat</button><p class="status" data-business-status role="status" aria-live="polite"></p></form></section>
<section class="panel result" data-business-result hidden tabindex="-1"><h2 data-result-title>Résultat</h2><p data-result-summary></p><div class="metrics" data-result-metrics></div><table class="details"><tbody data-result-rows></tbody></table><div class="actions">${formats.map(format => `<button type="button" data-export="${format}">${format.toUpperCase()}</button>`).join("")}<button type="button" data-action="copy">Copier</button><button type="button" data-action="save">Enregistrer localement</button><button type="button" data-action="print">Imprimer</button></div><div class="boundary">Résultat de planification produit localement. Aucun compte, téléversement ni envoi à une IA. Vérifiez les données officielles, contrats ou politiques applicables avant une décision importante.</div><p class="source">Sources et hypothèses : <a href="${page.en}">fonctionnement anglais de référence</a> · moteur partagé déterministe · données saisies par l’utilisateur.</p></section>
</main><afro-related-tools category="data-productivity" current="${page.id}"></afro-related-tools><afro-footer></afro-footer>
<script src="/engines/business-roi-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/fr-business-roi-parity.js"></script>
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/components/related-tools.min.js" defer></script>
</body></html>`;
}

for (const page of pages) {
  const output = path.join(root, "fr", "tools", page.slug, "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, pageHtml(page));
}

console.log(`Built ${pages.length} native French Business & ROI pages.`);
