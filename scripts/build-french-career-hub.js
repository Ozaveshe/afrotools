#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const { stableId } = require('./lib/content-integrity');
const ROOT = path.resolve(__dirname, '..');
const paths = {
  negotiate: { title: 'Négocier mon salaire', description: 'Préparer une contre-offre avec une référence mensuelle vérifiée et des arguments précis.', href: '/fr/tools/negociation-salaire/', checks: ['Noter le salaire et les avantages actuels', 'Vérifier une référence récente pour un poste comparable', 'Préparer des preuves de contribution', 'Définir un minimum acceptable et les conditions écrites'] },
  switch: { title: 'Changer de carrière', description: 'Comparer le coût de formation, le revenu abandonné et le délai de retour à l’équilibre.', href: '/fr/tools/changement-carriere/', checks: ['Chiffrer la formation et ses frais annexes', 'Estimer la période sans revenu', 'Vérifier la demande pour le métier visé', 'Comparer le délai de retour à l’équilibre avec mon budget'] },
  growth: { title: 'Progresser dans ma carrière', description: 'Choisir des compétences, des projets et une prochaine étape plutôt qu’une promesse de salaire.', href: '/fr/tools/croissance-carriere/', checks: ['Choisir le rôle ou le niveau visé', 'Identifier les compétences à développer', 'Sélectionner un projet qui démontre ces compétences', 'Prévoir une date pour revoir les hypothèses'] },
  retire: { title: 'Préparer ma retraite', description: 'Examiner l’épargne, la pension vérifiée et les dépenses prévues avec plusieurs scénarios.', href: '/fr/tools/preparation-retraite/', checks: ['Relever l’épargne et les contributions actuelles', 'Vérifier la pension auprès du prestataire', 'Prévoir les dépenses de santé et les personnes à charge', 'Comparer les scénarios prudents et la contribution supplémentaire'] }
};
const questions = [
  { question: 'Ma liste contient-elle mes données salariales ?', answer: 'Non. Cette page conserve uniquement le parcours choisi et les cases cochées. Les montants sont saisis séparément dans les calculateurs et restent locaux par défaut.' },
  { question: 'Que contient le lien de partage ?', answer: 'Le lien copié contient uniquement le type de parcours. Les cases cochées, les montants et les documents personnels ne sont pas inclus.' },
  { question: 'Comment retrouver ou effacer un rapport enregistré ?', answer: 'Dans le calculateur concerné, utilisez « Rouvrir le rapport enregistré » pour le lire et le télécharger, ou « Effacer le rapport enregistré » pour supprimer sa sauvegarde locale. Les champs du formulaire ne sont pas restaurés.' }
];

function render() {
  const title = 'Carrière et emploi en français | AfroTools';
  const description = 'Choisissez une décision de carrière, préparez une liste locale et ouvrez les calculateurs français de salaire, reconversion, progression et retraite.';
  const canonical = 'https://afrotools.com/fr/jobs/';
  const links = Object.entries(paths).map(([key, row]) => `<article class="fr-career-card" data-career-path="${key}"><h3>${row.title}</h3><p>${row.description}</p><button class="fr-action secondary" type="button" data-career-select="${key}" aria-pressed="false">Préparer ce parcours</button><p><a href="${row.href}">Ouvrir le calculateur</a></p></article>`).join('\n');
  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="afrotools-source-owner" content="scripts/build-french-career-hub.js">
<meta name="afrotools-content-id" content="${stableId('/fr/jobs/')}">
<title>${title}</title><meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com/career/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/kazi-na-ajira/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/career/">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="AfroTools">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/fr-career-tools.css"><link rel="stylesheet" href="/assets/css/fr-career-hub.css">
<script src="/assets/js/lib/dark-mode.js" defer></script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/pages/fr-career-hub.js" defer></script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: canonical, inLanguage: 'fr', isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/fr/' } })}</script>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'fr', mainEntity: questions.map(row => ({ '@type': 'Question', name: row.question, acceptedAnswer: { '@type': 'Answer', text: row.answer } })) })}</script>
</head><body>
<afro-navbar lang="fr" active="career"></afro-navbar>
<main class="fr-career-main fr-career-hub">
<nav aria-label="Fil d’Ariane"><a href="/fr/">AfroTools</a> / <a href="/fr/categories/">Catégories</a> / <span>Carrière et emploi</span></nav>
<header class="fr-career-hero"><p class="eyebrow">Carrière et emploi</p><h1>Préparer ma prochaine décision de carrière</h1><p>Commencez par la décision à prendre, puis utilisez un calculateur français pour comparer vos hypothèses. Vos montants restent dans les outils locaux ; cette page conserve uniquement le parcours choisi et les cases cochées.</p><p><a href="#career-paths">Choisir mon parcours</a> · <a href="/fr/tools/negociation-salaire/">Commencer par la négociation</a></p></header>
<section aria-labelledby="career-paths-title" id="career-paths"><h2 id="career-paths-title">Quatre décisions, quatre calculateurs</h2><p>Choisissez un parcours pour préparer une liste de vérifications. Vous pouvez aussi ouvrir directement son calculateur. Aucun compte n’est nécessaire pour ces calculs ou leurs exports locaux.</p><form data-career-search class="fr-career-search"><label for="career-search">Rechercher un parcours</label><input type="search" id="career-search" placeholder="Salaire, reconversion, progression…" autocomplete="off"><button class="fr-action secondary" type="submit">Rechercher</button><button class="fr-action secondary" type="reset">Afficher les quatre parcours</button></form><p data-career-search-status role="status" aria-live="polite">4 parcours disponibles. La recherche reste sur cette page.</p><div class="fr-career-path-grid">${links}</div></section>
<section class="fr-career-card fr-career-checks" aria-labelledby="career-check-title"><h2 id="career-check-title">Ma liste de préparation</h2><p data-career-summary>Choisissez un parcours pour afficher les vérifications utiles avant le calcul.</p><fieldset data-career-checklist hidden><legend data-career-legend></legend><div data-career-checks></div></fieldset><p><a data-career-continue hidden>Ouvrir mon calculateur</a></p><div class="fr-actions"><button class="fr-action secondary" type="button" data-career-save disabled>Enregistrer ma liste</button><button class="fr-action secondary" type="button" data-career-copy disabled>Copier le lien du parcours</button><button class="fr-action secondary" type="button" data-career-download disabled>Télécharger ma liste TXT</button><button class="fr-action secondary" type="button" data-career-reset>Effacer ma liste locale</button></div><p class="fr-status" data-career-status role="status" aria-live="polite">Les cases cochées restent sur cet appareil. Le lien partage uniquement le type de parcours.</p><noscript><p>Activez JavaScript pour la liste de préparation. Les quatre liens vers les calculateurs restent disponibles ci-dessus.</p></noscript></section>
<section class="fr-career-card"><h2>Avant de décider</h2><p>Une simulation de salaire ou de retraite n’est ni une offre d’emploi, ni une grille officielle, ni une garantie de rendement. Vérifiez la date, le lieu, le métier et les conditions écrites de chaque référence. Les multiplicateurs de progression sont des hypothèses générales : ils ne représentent pas un marché salarial en direct.</p><h3>Comparer une option prudente</h3><p>Pour une reconversion, ajoutez les frais annexes et la période de recherche d’emploi avant de payer une formation ou de quitter un poste. Pour la retraite, vérifiez la pension, les frais et les règles du prestataire. Conservez aussi un scénario sans augmentation ou sans rendement pour apprécier le risque.</p><h3>Lire et conserver le résultat</h3><p>Les quatre calculateurs proposent une copie, un fichier TXT et une sauvegarde sur l’appareil. Relisez les hypothèses et les limites dans le rapport avant de l’utiliser. La liste de cette page est un aide-mémoire : elle ne contient ni salaire, ni nom d’employeur, ni document personnel.</p></section>
<section class="fr-career-card"><h2>Préparer une candidature</h2><p>Après la décision, vous pouvez préparer les documents nécessaires. Ouvrez la page du produit pour vérifier ses formats d’export et ses limites ; un lien de découverte ne garantit pas qu’une interface complète est traduite.</p><ul><li><a href="/fr/tools/generateur-cv/">Générateur de CV</a></li><li><a href="/fr/tools/generateur-lettre-motivation/">Lettre de motivation</a></li><li><a href="/fr/tools/evaluateur-offre-emploi/">Évaluation d’une offre</a></li><li><a href="/fr/tools/calculateur-conges/">Calculateur de congés</a></li><li><a href="/fr/document-pdf/">Documents et PDF</a></li></ul><h3>Passerelles complémentaires</h3><p>Ces pages donnent accès à des fonctions ou à des repères qui peuvent encore utiliser une interface anglaise. Confirmez les données auprès d’un employeur, d’un recruteur ou d’une source locale récente.</p><ul><li><a href="/fr/jobs/cv-builder/">Passerelle vers le constructeur de CV</a></li><li><a href="/fr/jobs/freelance-rates/">Tarifs freelance à vérifier</a></li><li><a href="/fr/jobs/market-data/">Données du marché à vérifier</a></li><li><a href="/fr/jobs/salary-benchmarks/">Références salariales à vérifier</a></li></ul></section>
<section class="fr-career-card"><h2>Confidentialité et partage</h2><p>La liste est enregistrée dans le navigateur. Si le stockage est bloqué, vous pouvez continuer sur la page et télécharger votre liste. Le lien copié contient uniquement un identifiant de parcours prédéfini ; il ne contient pas vos cases cochées ou les montants saisis dans les calculateurs. Effacez la liste sur un appareil partagé.</p><p><a href="/fr/privacy/">Lire la politique de confidentialité</a> · <a href="/fr/contact/">Signaler un problème</a> · <a href="/fr/all-tools/?category=career">Explorer les autres outils de carrière</a></p></section>
<section class="fr-career-card"><h2>Questions sur la liste et les rapports</h2>${questions.map(row => `<details><summary>${row.question}</summary><p>${row.answer}</p></details>`).join('\n')}</section>
<script type="application/json" id="fr-career-paths">${JSON.stringify(paths)}</script>
</main><afro-footer></afro-footer></body></html>\n`;
}

function main() {
  const target = path.join(ROOT, 'fr/jobs/index.html');
  const expected = render();
  const current = fs.readFileSync(target, 'utf8');
  if (normalizeBuildManagedHtml(current).trim() === normalizeBuildManagedHtml(expected).trim()) {
    console.log('French Career hub is current.');
    return;
  }
  if (!process.argv.includes('--write')) { console.error('French Career hub is stale.'); process.exitCode = 1; return; }
  writeFileSyncWithRetry(target, expected, 'utf8');
  console.log('Generated fr/jobs/index.html from its French Career owner.');
}
if (require.main === module) main();
module.exports = { paths, render };
