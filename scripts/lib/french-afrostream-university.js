"use strict";

function amount(name, label, min, value = "") {
  return `<label>${label}<input name="${name}" type="number" inputmode="decimal" min="${min}" step="any" value="${value}" required></label>`;
}

const lessons = {
  setup: {
    slug: "installation-de-streaming-a-petit-budget",
    title: "Préparer un direct à petit budget",
    description: "Testez le matériel que vous avez déjà et choisissez une solution de secours pour votre prochain direct.",
    heading: "Répéter avant de diffuser", action: "Préparer ma fiche de répétition",
    content: `<h2>Faire un essai avec le matériel disponible</h2>
      <p>Posez le téléphone sur un support stable, face à une fenêtre. Enregistrez une minute dans les conditions du direct. Écoutez au casque pour vérifier que la voix reste claire lorsque la pièce est bruyante.</p>
      <h2>Prévoir les interruptions</h2>
      <p>Testez la connexion au lieu et à l’heure prévus. Si le débit varie, essayez une définition plus basse. Si la connexion coupe, prévoyez une séquence enregistrée localement ou un report annoncé au public.</p>
      <p>Vérifiez l’espace disponible, la charge de la batterie et la température du téléphone pendant une répétition. Avant un achat, identifiez le problème précis que cet équipement doit résoudre.</p>`,
    fields: `<fieldset><legend>Vérifications terminées</legend>
      ${["Voix intelligible à la réécoute", "Image stable et visage éclairé", "Connexion testée au lieu prévu", "Batterie et espace de stockage vérifiés"].map(s => `<label class="check"><input type="checkbox" name="checks" value="${s}"> ${s}</label>`).join("")}
      </fieldset>
      <label>Solution de secours<select name="fallback"><option>Enregistrer localement et publier plus tard</option><option>Réduire la définition du direct</option><option>Passer sur une connexion de secours déjà testée</option><option>Annoncer le report du direct</option></select></label>
      <label>Prochain essai à réaliser<input name="next" maxlength="240" placeholder="Ex. écouter ma voix avec les écouteurs disponibles" required></label>`
  },
  "brand-deals": {
    slug: "tarifer-un-partenariat-de-marque",
    title: "Chiffrer un partenariat de marque",
    description: "Décrivez le contenu demandé, puis estimez votre devis à partir du travail, de la production et des droits négociés.",
    heading: "Construire le devis", action: "Calculer mon devis",
    content: `<h2>Définir les livrables avant le prix</h2><p>Notez le format, le nombre de publications, les canaux, la date de livraison et les retours inclus. Décrivez l’audience à laquelle vous vous adressez avec des exemples de résultats observés.</p>
      <h2>Chiffrer séparément les droits</h2><p>Une publication sur votre compte, une reprise sur le compte de la marque et une publicité payante sont trois usages distincts. Convenez des supports, du territoire et de la durée. Pour une exclusivité, précisez les concurrents concernés et la période.</p>
      <p>Le devis ci-dessous additionne le temps de création, les frais et les montants de droits que vous saisissez. Ce budget de négociation ne fixe aucun tarif de marché.</p>`,
    fields: `<label>Livrables et conditions convenus<textarea name="scope" rows="2" maxlength="800" placeholder="Ex. une vidéo, une correction et diffusion organique pendant un mois" required></textarea></label>
      <label>Code de devise<input name="currency" maxlength="3" pattern="[A-Za-z]{3}" placeholder="Ex. XOF" required></label>
      ${amount("hours", "Temps de création (heures)", "0.01")}${amount("hourlyFloor", "Tarif par heure dans cette devise", "0.01")}
      ${amount("production", "Frais de production", 0, 0)}${amount("usageRights", "Droits de réutilisation", 0, 0)}${amount("exclusivity", "Exclusivité", 0, 0)}`
  },
  monetization: {
    slug: "monetisation-pour-createurs-africains",
    title: "Tester une offre de monétisation",
    description: "Choisissez une source de revenus adaptée à votre audience et préparez un essai dont vous pourrez mesurer le résultat.",
    heading: "Préparer un test d’offre", action: "Créer mon plan de test",
    content: `<h2>Choisir un premier essai</h2>
      <p>Pour une prestation ou un produit, partez d’une demande que votre audience formule déjà. Décrivez ce que la personne reçoit, le délai et le moyen de paiement que vous pouvez accepter.</p>
      <p>Pour un partenariat, préparez une proposition avec des livrables précis. Pour l’affiliation, vérifiez les conditions de commission et indiquez clairement votre relation avec la marque. Pour un soutien communautaire, expliquez ce que vous pouvez proposer régulièrement.</p>
      <h2>Vérifier le mode de versement</h2><p>Les programmes des plateformes varient selon le pays et le compte. Vérifiez votre admissibilité, les frais et les conditions de retrait dans votre propre compte avant de compter ces revenus dans votre budget.</p>
      <p>Pour le premier essai, choisissez un indicateur observable, par exemple les demandes reçues ou les commandes payées. Fixez une date pour comparer le résultat au temps et aux frais engagés.</p>`,
    fields: `<label>Piste à tester<select name="channel"><option>Produit ou prestation</option><option>Partenariat de marque</option><option>Affiliation</option><option>Soutien communautaire</option><option>Programme de plateforme</option></select></label>
      <label>Offre et public visé<textarea name="offer" rows="2" maxlength="800" placeholder="Ex. atelier de montage pour les membres de ma communauté" required></textarea></label>
      <label>Première action<input name="action" maxlength="240" placeholder="Ex. proposer trois créneaux d’essai" required></label>
      <label>Indicateur à suivre<input name="measure" maxlength="240" placeholder="Ex. nombre de réservations payées" required></label>
      <label>Date du bilan<input name="review" type="date" required></label>`
  }
};

function render(entry) {
  const key = entry.enSlug.split("/").at(-1);
  const lesson = lessons[key];
  if (!lesson || entry.frSlug !== lesson.slug) throw new Error("Unknown AfroStream lesson: " + entry.enSlug);
  const french = "https://afrotools.com/fr/tools/" + lesson.slug + "/";
  const english = "https://afrotools.com/tools/" + entry.enSlug + "/";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="afrotools-content-id" content="fr-afrostream-university:${key}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
<title>${lesson.title} | AfroStream University</title><meta name="description" content="${lesson.description}"><meta property="og:title" content="${lesson.title}"><meta property="og:description" content="${lesson.description}"><meta property="og:type" content="article"><meta property="og:url" content="${french}"><meta property="og:locale" content="fr_FR"><meta property="og:image" content="https://afrotools.com/assets/img/tools/afrostream.webp">
<link rel="canonical" href="${french}"><link rel="alternate" hreflang="fr" href="${french}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${english}">
<link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/tools/afrostream/university/university.css">
<style>.lesson-sheet{display:grid;gap:1rem}.lesson-sheet label,.lesson-sheet fieldset{display:grid;gap:.35rem}.lesson-sheet :is(input:not([type=checkbox]),textarea,select){width:100%;box-sizing:border-box;min-height:44px;padding:.6rem;font:inherit}.lesson-sheet .check{display:flex;align-items:center;min-height:44px}.lesson-sheet button,.lesson-result button{padding:.7rem 1rem;font:inherit;cursor:pointer}.lesson-result pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}.lesson-links{display:grid;gap:.6rem}.su-content-wrap{min-width:0}</style>
<script src="/assets/js/analytics-bootstrap.js" async></script></head>
<body class="su-page"><afro-navbar></afro-navbar><header class="su-lesson-hero"><div class="su-lesson-hero-inner">
<a class="su-lesson-back" href="/fr/">Accueil AfroTools</a><p>AfroStream University</p><h1>${lesson.title}</h1><p class="su-lesson-hero-sub">${lesson.description}</p><a href="#fiche" class="su-lesson-back">Aller à la fiche pratique</a></div></header>
<main class="su-content-wrap"><article class="su-prose">${lesson.content}
<section id="fiche"><h2>${lesson.heading}</h2><form class="lesson-sheet" data-lesson="${key}">${lesson.fields}<button type="submit">${lesson.action}</button></form><noscript>Activez JavaScript pour générer la fiche à télécharger.</noscript>
<section class="lesson-result" hidden><h3 tabindex="-1">Votre fiche</h3><pre></pre><button type="button">Télécharger ma fiche (TXT)</button></section></section>
<nav class="lesson-links" aria-label="Poursuivre en français"><h2>Autres guides en français</h2>${Object.values(lessons).filter(item => item !== lesson).map(item => `<a href="/fr/tools/${item.slug}/">${item.title}</a>`).join("")}</nav>
<p><a href="${english}" hreflang="en">Lire le guide original en anglais</a></p></article></main><afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
${key === "brand-deals" ? '<script src="/assets/js/engines/small-business-parity.js" defer></script>' : ""}
<script src="/assets/js/pages/fr-afrostream-university.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script></body></html>
`;
}

module.exports = { render };
