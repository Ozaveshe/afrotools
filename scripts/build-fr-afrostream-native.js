"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const target = path.join(
  ROOT,
  "fr",
  "tools",
  "afrostream-afrique-s-createur-streaming-hub",
  "index.html"
);

const description =
  "Découvrez des créateurs africains à partir des données publiques AfroStream, filtrez localement les profils chargés et exportez une liste JSON ou CSV.";
const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AfroStream — Découverte de créateurs africains",
  description,
  url: "https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/",
  inLanguage: "fr",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  image: "https://afrotools.com/assets/img/tools/afrostream.webp",
  isAccessibleForFree: true,
  author: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" },
};
const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "AfroTools", item: "https://afrotools.com/fr/" },
    { "@type": "ListItem", position: 2, name: "Outils créatifs", item: "https://afrotools.com/fr/creative/" },
    {
      "@type": "ListItem",
      position: 3,
      name: "AfroStream",
      item: "https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/",
    },
  ],
};

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AfroStream — Créateurs africains et données publiques | AfroTools</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <meta name="geo.region" content="002">
  <meta property="og:title" content="AfroStream — Créateurs africains et données publiques | AfroTools">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/afrostream.webp">
  <meta property="og:url" content="https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <link rel="canonical" href="https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/afrostream/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/afrostream-afrique-s-createur-streaming-hub/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/afrostream/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/afrostream/">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/afrostream-fr-native.css">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumb).replace(/</g, "\\u003c")}</script>
  <script>(function(){try{var t=localStorage.getItem('aft_theme');var d=matchMedia('(prefers-color-scheme:dark)').matches;var a=t==='dark'||t==='light'?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.setAttribute('data-theme-choice',t==='dark'||t==='light'?t:'auto');document.documentElement.style.colorScheme=a;}catch(_){}})();</script>
  <script src="/engines/afrostream-engine.js" defer></script>
  <script src="/assets/js/pages/creative/afrostream-fr-native.js" defer></script>
</head>
<body class="afs-page">
  <afro-navbar></afro-navbar>
  <main class="afs-shell">
    <section class="afs-hero">
      <div>
        <p class="afs-eyebrow">AfroStream · Données publiques chargées à la demande</p>
        <h1>Découvrir les créateurs africains</h1>
        <p>Chargez les profils et actualités publiés par AfroStream, puis recherchez et filtrez les résultats dans votre navigateur. Les filtres ne sont jamais envoyés à l’API.</p>
        <p><a class="afs-btn" href="/tools/afrostream/">English version</a></p>
      </div>
      <img class="afs-art" src="/assets/img/tools/afrostream.webp" alt="AfroStream, découverte de créateurs africains" width="600" height="400">
    </section>

    <section class="afs-card" aria-labelledby="afsDirectoryTitle">
      <h2 id="afsDirectoryTitle">Répertoire chargé</h2>
      <div class="afs-controls">
        <div class="afs-field">
          <label for="afsSearch">Rechercher dans les profils chargés</label>
          <input id="afsSearch" type="search" autocomplete="off" placeholder="Nom, pays ou catégorie">
        </div>
        <div class="afs-field">
          <label for="afsCountry">Pays</label>
          <select id="afsCountry"><option value="">Tous les pays</option></select>
        </div>
        <div class="afs-actions">
          <button class="afs-btn" id="afsExportJson" type="button" disabled>Télécharger JSON</button>
          <button class="afs-btn" id="afsExportCsv" type="button" disabled>Télécharger CSV</button>
        </div>
      </div>
      <p class="afs-status" id="afsStatus" role="status" aria-live="polite"></p>
      <p class="afs-freshness" id="afsFreshness">Fraîcheur en attente du chargement.</p>
      <div class="afs-creators" id="afsCreators" aria-live="polite"></div>
    </section>

    <section class="afs-card" aria-labelledby="afsNewsTitle">
      <h2 id="afsNewsTitle">Actualités publiées</h2>
      <div class="afs-news" id="afsNews"></div>
    </section>

    <section class="afs-card">
      <h2>Source, confidentialité et limites</h2>
      <p class="afs-source-note"><strong>Source :</strong> les routes publiques <code>/api/afrostream/creators</code>, <code>/api/afrostream/streams</code> et <code>/api/afrostream/news</code>. La date affichée est la plus récente fournie par les enregistrements chargés ; elle ne prouve pas que chaque profil est à jour.</p>
      <p class="afs-source-note"><strong>Confidentialité :</strong> la recherche et le filtre pays restent dans le navigateur. Seules les requêtes de lecture publiques nécessaires au chargement sont envoyées, sans le texte de recherche.</p>
      <p class="afs-source-note"><strong>Limite :</strong> AfroStream agrège des informations publiées ; vérifiez le profil et la plateforme d’origine avant une décision commerciale, éditoriale ou de partenariat. En cas d’échec API, aucune donnée fictive n’est affichée.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, html, "utf8");
process.stdout.write("WROTE fr/tools/afrostream-afrique-s-createur-streaming-hub/index.html\n");
