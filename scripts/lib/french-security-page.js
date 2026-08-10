"use strict";

const SITE = "https://afrotools.com";

const PAGES = {
  "cctv-cost": {
    title: "Calculateur du coût d’un système CCTV en Afrique",
    shortTitle: "Coût d’un système CCTV",
    description: "Estimez en français caméras, enregistreur, stockage, installation, surveillance et coût sur cinq ans, sans transmettre vos données.",
    eyebrow: "Sécurité vidéo",
    lead: "Comparez un système analogique, IP ou cloud à partir de vos propres prix et devis, puis exportez un scénario local à rouvrir.",
  },
  "cybersecurity-assessment": {
    title: "Évaluation du risque cybersécurité pour une organisation",
    shortTitle: "Évaluation du risque cybersécurité",
    description: "Évaluez 20 contrôles de cybersécurité en français avec un score transparent, des priorités locales et un export JSON privé.",
    eyebrow: "Cybersécurité",
    lead: "Passez en revue réseau, données, accès, terminaux, sensibilisation et réponse aux incidents sans envoyer vos réponses.",
  },
  "data-breach-cost": {
    title: "Calculateur du coût d’une violation de données",
    shortTitle: "Coût d’une violation de données",
    description: "Estimez en français le coût de réponse à une violation de données, sans inventer d’amende ni transmettre les données de l’incident.",
    eyebrow: "Réponse aux incidents",
    lead: "Cadrez investigation, notification, conseil, communication, remédiation et interruption avec des hypothèses de planification explicites.",
  },
  "fire-safety-checklist": {
    title: "Checklist de sécurité incendie pour un site africain",
    shortTitle: "Checklist de sécurité incendie",
    description: "Évaluez en français 17 points de préparation incendie et un scénario de remédiation, sans prétendre fournir une inspection ou un certificat.",
    eyebrow: "Sécurité des locaux",
    lead: "Marquez uniquement les éléments appuyés par une preuve récente, puis exportez la checklist pour une revue locale qualifiée.",
  },
  "home-security-cost": {
    title: "Estimateur du coût de sécurité d’un logement",
    shortTitle: "Coût de sécurité d’un logement",
    description: "Estimez CCTV, alarme, surveillance, maintenance et gardiennage avec les quatre contrôles et la formule de l’application anglaise canonique.",
    eyebrow: "Sécurité du domicile",
    lead: "Choisissez pays, type de logement, risque déclaré et niveau de protection pour reproduire en français le scénario canonique, sans en faire un devis ni une garantie.",
    method: "Un moteur partagé sans accès au DOM applique exactement les quatre contrôles, options, valeurs par défaut, barèmes et formules de l’application anglaise canonique. La version française ne remplace pas ce contrat par des montants saisis.",
  },
  "password-strength": {
    title: "Vérificateur local de force d’un mot de passe",
    shortTitle: "Force d’un mot de passe",
    description: "Analysez localement la longueur, l’entropie et les motifs d’un exemple de mot de passe. Aucun secret n’est enregistré, copié ou envoyé.",
    eyebrow: "Confidentialité stricte",
    lead: "Le calcul reste dans ce navigateur. N’utilisez pas un identifiant réellement actif : ce score heuristique ne remplace ni un gestionnaire ni la MFA.",
  },
  "phishing-quiz": {
    title: "Quiz français de détection du phishing",
    shortTitle: "Quiz de détection du phishing",
    description: "Testez en français vos réflexes face à dix messages synthétiques de phishing, puis copiez un résumé de formation sans coordonnées sensibles.",
    eyebrow: "Sensibilisation au phishing",
    lead: "Entraînez-vous à vérifier indépendamment domaines, expéditeurs, urgences, paiements et demandes d’identifiants.",
  },
};

const ROUTES = {
  "cctv-cost": "cout-cctv",
  "cybersecurity-assessment": "evaluation-risque-cybersecurite",
  "data-breach-cost": "cout-violation-donnees",
  "fire-safety-checklist": "checklist-securite-incendie",
  "home-security-cost": "cout-securite-maison",
  "password-strength": "force-mot-de-passe",
  "phishing-quiz": "quiz-phishing",
};

const REGISTRY_IDS = {
  "cctv-cost": "cout-cctv-fr",
  "cybersecurity-assessment": "evaluation-risque-cybersecurite-fr",
  "data-breach-cost": "cout-violation-donnees-fr",
  "fire-safety-checklist": "checklist-securite-incendie-fr",
  "home-security-cost": "cout-securite-maison-fr",
  "password-strength": "force-mot-de-passe-fr",
  "phishing-quiz": "quiz-phishing-fr",
};

const EXTRA_ALTERNATES = {
  "cctv-cost": [
    { lang: "sw", href: `${SITE}/sw/zana/gharama-za-cctv/` },
  ],
  "cybersecurity-assessment": [
    { lang: "sw", href: `${SITE}/sw/zana/tathmini-ya-usalama-wa-kidijitali/` },
  ],
  "data-breach-cost": [
    { lang: "sw", href: `${SITE}/sw/zana/gharama-ya-uvujaji-wa-data/` },
  ],
};

const FAQ = [
  {
    name: "Les saisies sont-elles envoyées à un serveur ou à une IA ?",
    text: "Non. Le calcul, le quiz, la copie et les fichiers JSON restent dans le navigateur. Cette page n’appelle aucun fournisseur d’IA et ne transmet pas les champs de l’outil.",
  },
  {
    name: "Le résultat constitue-t-il un audit, un devis ou une conformité ?",
    text: "Non. Il s’agit d’un scénario de planification déterministe. Vérifiez les équipements, les prix, les preuves, le droit applicable et les exigences de l’autorité ou de l’assureur.",
  },
  {
    name: "Comment reprendre un scénario exporté ?",
    text: "Pour les calculateurs et checklists non secrets, utilisez Exporter JSON puis Rouvrir JSON. Le fichier est lu localement, validé et recalculé. Les mots de passe ne sont jamais exportés.",
  },
];

const SOURCES = {
  "cctv-cost": [
    { label: "Valeurs saisies par l’utilisateur", note: "Aucun prix fournisseur n’est intégré. Comparez au moins deux devis locaux décrivant matériel, stockage, alimentation, installation et maintenance." },
  ],
  "home-security-cost": [
    { label: "Hypothèses intégrées de l’application canonique", note: "Barèmes illustratifs pour le Nigeria, le Kenya, l’Afrique du Sud, le Ghana, l’Égypte et la Tanzanie; contrat revu le 29 juillet 2026. Confiance élevée pour la reproductibilité de la formule, faible pour un prix local actuel. Obtenez une visite du site et des devis détaillés." },
  ],
  "data-breach-cost": [
    { label: "Nigeria Data Protection Commission", url: "https://www.ndpc.gov.ng/resources/" },
    { label: "Office of the Data Protection Commissioner — Kenya", url: "https://www.odpc.go.ke/report-a-data-breach/" },
    { label: "Information Regulator — Afrique du Sud", url: "https://inforegulator.org.za/popia/" },
    { label: "Valeurs de scénario saisies par l’utilisateur", note: "Les sources officielles couvrent les obligations. Elles ne valident pas vos coûts de réponse ni votre taux de change." },
  ],
  "cybersecurity-assessment": [
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
    { label: "Nigeria Data Protection Commission", url: "https://www.ndpc.gov.ng/" },
    { label: "Office of the Data Protection Commissioner — Kenya", url: "https://www.odpc.go.ke/" },
  ],
  "fire-safety-checklist": [
    { label: "Federal Fire Service — Nigeria", url: "https://fedfire.gov.ng/about-us/" },
    { label: "Ministère de l’Intérieur du Ghana — Ghana National Fire Service", url: "https://www.mint.gov.gh/agencies/ghana-national-fire-service/", note: "Le portail GNFS de certification renvoie actuellement une erreur serveur; confirmez la procédure et le point de contact avant toute démarche." },
    { label: "Occupational Health and Safety Act — Afrique du Sud", url: "https://www.gov.za/documents/occupational-health-and-safety-act" },
    { label: "Budgets saisis par l’utilisateur", note: "Les sources officielles couvrent les exigences. Elles ne valident pas le budget de remédiation ou d’entretien saisi." },
  ],
  "password-strength": [
    { label: "NIST SP 800-63B — mots et phrases de passe", url: "https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver" },
    { label: "Vocabulaire français BIP-39 — 2 048 mots", url: "https://github.com/bitcoin/bips/blob/9783d61f1b9c81231581fee026c8e8cb9499d265/bip-0039/french.txt", note: "Instantané utilisé uniquement comme vocabulaire local uniformément échantillonné; six mots donnent 66 bits de sélection." },
  ],
  "phishing-quiz": [
    { label: "Australian Signals Directorate — conseils sur le phishing", url: "https://www.cyber.gov.au/threats/types-threats/phishing" },
    { label: "US Federal Trade Commission — reconnaître et éviter le phishing", url: "https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams" },
  ],
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(page) {
  const content = PAGES[page.enSlug];
  if (!content || ROUTES[page.enSlug] !== page.frSlug) {
    throw new Error(`Unknown French Security page mapping: ${page.enSlug} -> ${page.frSlug}`);
  }
  const enUrl = `${SITE}/tools/${page.enSlug}/`;
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const imageUrl = `${SITE}/assets/img/tools/${page.enSlug}.webp`;
  const extraAlternates = (EXTRA_ALTERNATES[page.enSlug] || [])
    .map(({ lang, href }) => `<link rel="alternate" hreflang="${lang}" href="${href}">`)
    .join("\n");
  const related = Object.entries(PAGES)
    .filter(([id]) => id !== page.enSlug)
    .slice(0, 6)
    .map(([id, item]) => `<a href="/fr/tools/${ROUTES[id]}/">${escapeHtml(item.shortTitle)}</a>`)
    .join("");
  const sources = (SOURCES[page.enSlug] || [])
    .map((source) => source.url
      ? `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>${source.note ? ` — ${escapeHtml(source.note)}` : ""}</li>`
      : `<li><strong>${escapeHtml(source.label)}</strong> — ${escapeHtml(source.note)}</li>`)
    .join("");
  const fireEngineScript = page.enSlug === "fire-safety-checklist"
    ? '  <script src="/assets/js/engines/security-fire-safety.js" defer></script>\n'
    : "";
  const homeEngineScript = page.enSlug === "home-security-cost"
    ? '  <script src="/assets/js/engines/home-security-cost.js" defer></script>\n'
    : "";
  const passwordWordsScript = page.enSlug === "password-strength"
    ? '  <script src="/assets/js/data/french-passphrase-words.js" defer></script>\n'
    : "";
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: content.shortTitle,
      description: content.description,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Web",
      inLanguage: "fr",
      areaServed: { "@type": "Place", name: "Afrique" },
      audience: { "@type": "Audience", geographicArea: { "@type": "Place", name: "Afrique" } },
      url: frUrl,
      image: imageUrl,
      isBasedOn: enUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "AfroTools", url: `${SITE}/` },
      featureList: [
        "Traitement local dans le navigateur",
        "Calcul déterministe",
        "Aucune transmission de saisie",
        page.enSlug === "password-strength" ? "Aucun export du secret" : "Export JSON local et reprise",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
        { "@type": "ListItem", position: 2, name: "Sécurité", item: `${SITE}/fr/all-tools/` },
        { "@type": "ListItem", position: 3, name: content.shortTitle, item: frUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "fr",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.name,
        acceptedAnswer: { "@type": "Answer", text: item.text },
      })),
    },
  ];

  return `<!DOCTYPE html>
<!-- Generated by scripts/generate-fr-tool-gap-pages.js via scripts/lib/french-security-page.js. -->
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="afrotools-content-id" content="fr-security-native:${escapeHtml(page.frSlug)}">
  <meta name="afrotools-source-owner" content="scripts/lib/french-security-page.js">
  <meta name="afrotools-source-tool" content="${escapeHtml(page.enSlug)}">
  <title>${escapeHtml(content.title)} | AfroTools</title>
  <meta name="description" content="${escapeHtml(content.description)}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(content.title)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(content.description)}">
  <meta property="og:url" content="${frUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:alt" content="${escapeHtml(content.shortTitle)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(content.title)} | AfroTools">
  <meta name="twitter:description" content="${escapeHtml(content.description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/french-security-tools.css">
  <script>window.AfroDisableAssistant=true;</script>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script>
<link rel="canonical" href="${frUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="fr" href="${frUrl}">
${extraAlternates ? `${extraAlternates}\n` : ""}<link rel="alternate" hreflang="x-default" href="${enUrl}">
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="frs-shell">
    <nav class="frs-breadcrumb" aria-label="Fil d’Ariane">
      <a href="/fr/">Accueil</a><span aria-hidden="true">/</span>
      <a href="/fr/all-tools/?category=security">Sécurité</a><span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(content.shortTitle)}</span>
    </nav>
    <header class="frs-hero">
      <div>
        <p class="frs-eyebrow">${escapeHtml(content.eyebrow)}</p>
        <h1>${escapeHtml(content.title)}</h1>
        <p class="frs-lead">${escapeHtml(content.lead)}</p>
      </div>
      <img class="frs-art" src="/assets/img/tools/${escapeHtml(page.enSlug)}.webp" width="640" height="360" alt="${escapeHtml(content.shortTitle)}" loading="eager">
    </header>
    <section class="frs-assurance" aria-label="Garanties de confidentialité">
      <div><strong>Local d’abord</strong>Les champs restent dans ce navigateur.</div>
      <div><strong>Sans IA ni envoi</strong>Aucune saisie n’est transmise ou journalisée.</div>
      <div><strong>Résultat explicable</strong>Hypothèses et limites restent visibles.</div>
    </section>
    <section class="frs-app" data-fr-security-app="${escapeHtml(page.enSlug)}" aria-label="${escapeHtml(content.shortTitle)}">
      <noscript><p class="frs-notice frs-danger">Activez JavaScript pour exécuter ce calcul local. Aucune saisie ne sera envoyée.</p></noscript>
    </section>
    <div class="frs-support" data-tool-verification-panel>
      <section><h2>Méthode</h2><p>${escapeHtml(content.method || "La logique déterministe reprend les contrôles et bornes de l’application anglaise canonique. Les outils de coût utilisent uniquement les montants saisis et affichent leur frontière de données.")}</p></section>
      <section><h2>Confidentialité</h2><p>Aucun champ n’est stocké dans localStorage, envoyé à une API, ajouté aux journaux ou transmis à une IA. Les exports sont créés sur l’appareil.</p></section>
      <section><h2>Limites</h2><p>Les prix et règles peuvent évoluer. Ce résultat n’est pas un devis, un audit, une certification, une décision juridique ou une garantie de sécurité.</p></section>
    </div>
    <section class="frs-faq" aria-labelledby="frs-sources-title" data-authoritative-sources>
      <h2 id="frs-sources-title">Sources et vérifications</h2>
      <p>Références vérifiées le 29 juillet 2026. Confirmez toujours la version, le canal et l’autorité compétente pour votre pays, votre secteur et les faits réels.</p>
      <ul>${sources}</ul>
    </section>
    <section class="frs-related" aria-labelledby="frs-related-title">
      <h2 id="frs-related-title">Autres outils français de sécurité</h2>
      <div class="frs-related-list">${related}</div>
    </section>
    <section class="frs-faq" aria-labelledby="frs-faq-title">
      <h2 id="frs-faq-title">Questions fréquentes</h2>
      ${FAQ.map((item) => `<details><summary>${escapeHtml(item.name)}</summary><p>${escapeHtml(item.text)}</p></details>`).join("")}
    </section>
  </main>
  <afro-footer></afro-footer>
${fireEngineScript}${homeEngineScript}${passwordWordsScript}  <script src="/assets/js/pages/french-security-tools.js" defer></script>
</body>
</html>
`;
}

module.exports = { PAGES, ROUTES, REGISTRY_IDS, render };
