"use strict";

// Option values are the scoring inputs of the shared personal-brand audit engine.
const groups = [
  ["LinkedIn", [
    ["liConnections", "Relations sur LinkedIn", [[0,"Aucune"],[3,"1 à 99"],[7,"100 à 499"],[13,"500 à 999"],[18,"1 000 à 4 999"],[20,"5 000 ou plus"]]],
    ["liPosting", "Publications sur LinkedIn", [[0,"Jamais"],[2,"Quelques fois par an"],[5,"Chaque mois"],[8,"Chaque semaine"],[10,"Plusieurs fois par semaine"]]]
  ]],
  ["Réseaux sociaux", [
    ["twFollowers", "Abonnés sur X (Twitter)", [[0,"Aucun"],[2,"1 à 499"],[5,"500 à 1 999"],[9,"2 000 à 9 999"],[12,"10 000 à 49 999"],[15,"50 000 ou plus"]]],
    ["igFollowers", "Abonnés sur Instagram", [[0,"Aucun"],[1,"1 à 999"],[3,"1 000 à 4 999"],[5,"5 000 à 19 999"],[7,"20 000 à 99 999"],[10,"100 000 ou plus"]]]
  ]],
  ["Présence dans les moteurs de recherche", [
    ["website", "Site ou portfolio", [[0,"Aucun"],[7,"Page de liens ou de présentation"],[12,"Site complet avec biographie"],[15,"Site professionnel optimisé pour la recherche"]]],
    ["googleResult", "Recherche de votre nom sur Google", [[0,"Aucun résultat me concernant"],[3,"Résultat en deuxième page ou après"],[7,"Un résultat en première page"],[10,"Plusieurs résultats en première page"]]]
  ]],
  ["Création de contenu", [
    ["articles", "Articles publiés", [[0,"Aucun"],[3,"1 à 5"],[7,"6 à 20"],[12,"21 à 50"],[15,"Plus de 50"]]],
    ["book", "Ouvrages ou rapports", [[0,"Aucun"],[5,"Chapitre ou rapport publié"],[10,"Livre autoédité"],[15,"Livre paru chez un grand éditeur"]]],
    ["podcast", "Podcast ou chaîne vidéo", [[0,"Aucun"],[3,"Participation comme invité"],[6,"Ma propre émission, moins de 1 000 abonnés"],[10,"Ma propre émission, au moins 1 000 abonnés"]]]
  ]],
  ["Réputation hors ligne", [
    ["speaking", "Prises de parole publiques", [[0,"Aucune"],[3,"Un à trois petits événements"],[7,"Interventions régulières dans mon secteur"],[12,"Conférence internationale ou intervention principale"]]],
    ["awards", "Distinctions reçues", [[0,"Aucune"],[2,"Distinction locale ou interne"],[5,"Prix national dans mon secteur"],[8,"Distinction internationale"]]]
  ]],
  ["Formation et certifications", [
    ["education", "Niveau de formation", [[2,"Secondaire"],[5,"Licence ou équivalent"],[9,"Master ou équivalent"],[12,"Doctorat"],[0,"Autre parcours ou sans diplôme"]]],
    ["certs", "Certifications professionnelles", [[0,"Aucune"],[2,"Une certification locale"],[5,"Une ou deux certifications reconnues à l’international"],[8,"Au moins trois certifications reconnues à l’international"]]]
  ]]
];

function render(page) {
  const canonical = `https://afrotools.com/fr/tools/${page.frSlug}/`;
  const english = "https://afrotools.com/tools/personal-brand-audit/";
  const title = "Audit de marque personnelle";
  const description = "Évaluez votre visibilité professionnelle sur six axes et repartez avec un plan d’action adapté à votre profil.";
  const fields = groups.map(([label, questions]) => `<fieldset class="en-card"><legend>${label}</legend><div class="en-card-body en-form-grid">${questions.map(([name, question, options]) => `<div class="en-field"><label class="en-label" for="${name}">${question}</label><select class="en-select" id="${name}" name="${name}" required><option value="">Choisir une réponse</option>${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join("")}</select></div>`).join("")}</div></fieldset>`).join("\n");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
<title>${title} | AfroTools</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/personal-brand-audit.webp"><meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${english}"><link rel="alternate" hreflang="fr" href="${canonical}"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/ukaguzi-wa-personal-brand/">
<link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css"><style>#brand-form fieldset{min-inline-size:0}#brand-form select{width:100%;max-width:100%}#brand-form legend{padding:.5rem;font-weight:700}#brand-report{white-space:pre-line;overflow-wrap:anywhere}</style>
<script src="/assets/js/analytics-bootstrap.js" async></script></head><body><afro-navbar></afro-navbar><header class="en-tool-hero"><div class="container"><nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/all-tools/">Outils</a></nav><h1>${title}</h1><p>${description}</p></div></header>
<main class="en-main"><p>Répondez à partir de votre activité réelle. Aucun nom, lien de profil ou identifiant n’est demandé.</p><form id="brand-form">${fields}<button class="en-btn" type="submit">Obtenir mon audit</button> <button type="reset">Recommencer</button></form>
<section class="en-card" id="brand-results" hidden><div class="en-card-body"><h2 tabindex="-1">Votre audit</h2><p id="brand-report"></p><button class="en-btn" type="button" id="brand-download">Télécharger le bilan (TXT)</button></div></section>
<details><summary>Comment lire le score ?</summary><p>Les réponses sont pondérées et regroupées par axe. Le total arrondi est exprimé sur 100. La priorité proposée correspond à l’axe ayant obtenu la plus faible proportion de son maximum. Cette autoévaluation décrit uniquement les signaux renseignés. Elle ne prédit ni le revenu ni les chances de recrutement.</p></details></main><afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/engines/personal-brand-audit-engine.js" defer></script><script src="/assets/js/pages/creative/fr-personal-brand-audit.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script></body></html>
`;
}

module.exports = { render };
