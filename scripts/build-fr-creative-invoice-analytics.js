#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function write(relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/\r?\n/g, '\n'), 'utf8');
  console.log(`wrote ${relative}`);
}

const sharedHead = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="geo.region" content="002">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
  <link rel="stylesheet" href="/assets/css/theme-dark.min.css?v=e7def0f1">
  <link rel="stylesheet" href="/assets/css/creator-business-native.css">
  <script>(function(){try{var t=localStorage.getItem('aft_theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var a=(t==='dark'||t==='light')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.setAttribute('data-theme-choice',(t==='dark'||t==='light')?t:'auto');document.documentElement.style.colorScheme=a;}catch(_){}})();</script>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
  <script src="/assets/js/lib/dark-mode.js?v=5cb64ba3" defer></script>`;

function invoiceApp(lang) {
  const fr = lang === 'fr';
  const route = fr ? '/fr/tools/facture-createur/app' : '/tools/creator-invoice/app';
  const counterpart = fr ? '/tools/creator-invoice/app' : '/fr/tools/facture-createur/app';
  const launcher = fr ? '/fr/tools/facture-createur/' : '/tools/creator-invoice/';
  const image = 'https://afrotools.com/assets/img/tools/creator-invoice.webp';
  const t = fr ? {
    title: 'Espace facture créateur | AfroTools',
    description: 'Créez une facture multi-devise dans votre navigateur, calculez remise et taxe, puis exportez un PDF, JSON ou texte sans compte.',
    back: 'Retour à Facture créateur',
    eyebrow: 'Facturation locale',
    h1: 'Préparer une facture claire',
    lead: 'Calculez chaque ligne, la remise et la taxe dans un espace privé. Exportez ensuite un brouillon à vérifier selon les règles de votre pays.',
    trust: ['Sans compte', 'Données locales', 'PDF + JSON + texte'],
    issuer: 'Émetteur et client', issuerName: 'Nom de l’émetteur', issuerEmail: 'E-mail de l’émetteur (facultatif)',
    clientName: 'Nom du client', clientEmail: 'E-mail du client (facultatif)',
    details: 'Détails de la facture', number: 'Numéro de facture', currency: 'Devise', issued: 'Date d’émission', due: 'Date d’échéance',
    taxLabel: 'Libellé de taxe', taxRate: 'Taux de taxe (%)', discountType: 'Type de remise', discountValue: 'Valeur de remise',
    none: 'Aucune', percent: 'Pourcentage', fixed: 'Montant fixe',
    items: 'Prestations', descriptionLabel: 'Description', quantity: 'Quantité', unitPrice: 'Prix unitaire',
    notes: 'Notes et conditions (facultatif)', calculate: 'Calculer la facture', save: 'Enregistrer localement', load: 'Restaurer le brouillon',
    preview: 'Aperçu', fromTo: 'Émetteur → client', subtotal: 'Sous-total', discount: 'Remise', tax: 'Taxe', total: 'Total',
    copy: 'Copier le résumé', json: 'Télécharger JSON', txt: 'Télécharger TXT', pdf: 'Télécharger PDF',
    privacy: '<strong>Confidentialité :</strong> les noms, e-mails, montants et notes restent dans ce navigateur. Aucun compte, serveur, IA ou service de paiement n’est utilisé. Les exports partent uniquement après votre action.',
    warning: '<strong>À vérifier :</strong> ce document est un brouillon commercial, pas une facture fiscale certifiée. Vérifiez la numérotation, les mentions, la TVA, la retenue et l’archivage applicables.',
    examples: ['Conception d’identité visuelle', 'Production vidéo', 'Droits d’utilisation']
  } : {
    title: 'Creator invoice workspace | AfroTools',
    description: 'Create a multi-currency invoice in your browser, calculate discount and tax, then export real PDF, JSON or text files without an account.',
    back: 'Back to CreatorInvoice',
    eyebrow: 'Local invoicing',
    h1: 'Prepare a clear invoice',
    lead: 'Calculate every line, discount and tax in a private workspace. Export a draft and verify the rules that apply where you invoice.',
    trust: ['No account', 'Local data', 'PDF + JSON + text'],
    issuer: 'Issuer and client', issuerName: 'Issuer name', issuerEmail: 'Issuer email (optional)',
    clientName: 'Client name', clientEmail: 'Client email (optional)',
    details: 'Invoice details', number: 'Invoice number', currency: 'Currency', issued: 'Issue date', due: 'Due date',
    taxLabel: 'Tax label', taxRate: 'Tax rate (%)', discountType: 'Discount type', discountValue: 'Discount value',
    none: 'None', percent: 'Percentage', fixed: 'Fixed amount',
    items: 'Services', descriptionLabel: 'Description', quantity: 'Quantity', unitPrice: 'Unit price',
    notes: 'Notes and terms (optional)', calculate: 'Calculate invoice', save: 'Save locally', load: 'Restore draft',
    preview: 'Preview', fromTo: 'Issuer → client', subtotal: 'Subtotal', discount: 'Discount', tax: 'Tax', total: 'Total',
    copy: 'Copy summary', json: 'Download JSON', txt: 'Download TXT', pdf: 'Download PDF',
    privacy: '<strong>Privacy:</strong> names, emails, amounts and notes stay in this browser. No account, server, AI or payment service is used. Exports happen only after your action.',
    warning: '<strong>Verify before issuing:</strong> this is a commercial draft, not a certified tax invoice. Check numbering, required details, VAT, withholding and recordkeeping rules.',
    examples: ['Brand identity design', 'Video production', 'Usage rights']
  };
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: fr ? 'Espace facture créateur' : 'Creator invoice workspace',
    inLanguage: lang,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `https://afrotools.com${route}`,
    image,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: fr ? ['Calcul de facture local', 'Export PDF', 'Export JSON', 'Export texte'] : ['Local invoice calculation', 'PDF export', 'JSON export', 'Text export']
  });
  const lines = [0, 1, 2].map((index) => `
          <div class="cb-line" data-invoice-line>
            <label class="cb-field"><span class="cb-label">${t.descriptionLabel}</span><input class="cb-input" data-line-description value="${index === 0 ? t.examples[0] : ''}" autocomplete="off"></label>
            <label class="cb-field"><span class="cb-label">${t.quantity}</span><input class="cb-input" data-line-quantity type="number" min="0" step="0.25" value="${index === 0 ? '1' : '1'}"></label>
            <label class="cb-field"><span class="cb-label">${t.unitPrice}</span><input class="cb-input" data-line-price type="number" min="0" step="0.01" value="${index === 0 ? '250000' : ''}"></label>
          </div>`).join('');
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${sharedHead}
  <title>${t.title}</title>
  <meta name="description" content="${t.description}">
  <meta name="robots" content="noindex, follow">
  <meta property="og:title" content="${t.title}">
  <meta property="og:description" content="${t.description}">
  <meta property="og:image" content="${image}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://afrotools.com${route}">
  <meta property="og:locale" content="${fr ? 'fr_FR' : 'en_US'}">
  <link rel="canonical" href="https://afrotools.com${route}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-invoice/app">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/facture-createur/app">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-invoice/app">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="cb-app" data-creator-invoice-app>
    <div class="cb-shell">
      <a class="cb-back" href="${launcher}">← ${t.back}</a>
      <header class="cb-hero">
        <p class="cb-eyebrow">${t.eyebrow}</p>
        <h1>${t.h1}</h1>
        <p class="cb-lead">${t.lead}</p>
        <ul class="cb-trust">${t.trust.map((item) => `<li>${item}</li>`).join('')}</ul>
      </header>
      <div class="cb-grid">
        <form class="cb-card" novalidate>
          <section class="cb-section">
            <h2>${t.issuer}</h2>
            <div class="cb-fields">
              <label class="cb-field"><span class="cb-label">${t.issuerName}</span><input id="ciIssuerName" class="cb-input" required autocomplete="organization" value="Studio Kora"></label>
              <label class="cb-field"><span class="cb-label">${t.issuerEmail}</span><input id="ciIssuerEmail" class="cb-input" type="email" autocomplete="email"></label>
              <label class="cb-field"><span class="cb-label">${t.clientName}</span><input id="ciClientName" class="cb-input" required autocomplete="off" value="Client Démo"></label>
              <label class="cb-field"><span class="cb-label">${t.clientEmail}</span><input id="ciClientEmail" class="cb-input" type="email" autocomplete="off"></label>
            </div>
          </section>
          <section class="cb-section">
            <h2>${t.details}</h2>
            <div class="cb-fields">
              <label class="cb-field"><span class="cb-label">${t.number}</span><input id="ciNumber" class="cb-input" required value="INV-001"></label>
              <label class="cb-field"><span class="cb-label">${t.currency}</span><select id="ciCurrency" class="cb-select">${['XOF','XAF','EUR','USD','NGN','KES','ZAR','GHS','MAD','GBP'].map((code) => `<option value="${code}"${code === (fr ? 'XOF' : 'USD') ? ' selected' : ''}>${code}</option>`).join('')}</select></label>
              <label class="cb-field"><span class="cb-label">${t.issued}</span><input id="ciIssuedDate" class="cb-input" type="date" required></label>
              <label class="cb-field"><span class="cb-label">${t.due}</span><input id="ciDueDate" class="cb-input" type="date" required></label>
              <label class="cb-field"><span class="cb-label">${t.taxLabel}</span><input id="ciTaxLabel" class="cb-input" value="${fr ? 'TVA' : 'VAT'}"></label>
              <label class="cb-field"><span class="cb-label">${t.taxRate}</span><input id="ciTaxRate" class="cb-input" type="number" min="0" max="100" step="0.01" value="0"></label>
              <label class="cb-field"><span class="cb-label">${t.discountType}</span><select id="ciDiscountType" class="cb-select"><option value="percentage">${t.percent}</option><option value="fixed">${t.fixed}</option></select></label>
              <label class="cb-field"><span class="cb-label">${t.discountValue}</span><input id="ciDiscountValue" class="cb-input" type="number" min="0" step="0.01" value="0"></label>
            </div>
          </section>
          <section class="cb-section">
            <h2>${t.items}</h2>
${lines}
          </section>
          <section class="cb-section">
            <label class="cb-field"><span class="cb-label">${t.notes}</span><textarea id="ciNotes" class="cb-textarea"></textarea></label>
            <div class="cb-actions">
              <button class="cb-btn cb-btn-primary" type="submit">${t.calculate}</button>
              <button class="cb-btn" id="ciSave" type="button">${t.save}</button>
              <button class="cb-btn" id="ciLoad" type="button">${t.load}</button>
            </div>
            <p id="ciError" class="cb-error" role="alert"></p>
            <p id="ciStatus" class="cb-status" role="status" aria-live="polite"></p>
          </section>
        </form>
        <aside class="cb-card">
          <h2>${t.preview}</h2>
          <div id="ciPreview" class="cb-preview" hidden>
            <div class="cb-preview-head"><div><div id="ciPreviewNumber" class="cb-preview-title"></div><div id="ciPreviewParties"></div></div></div>
            <div id="ciPreviewItems" class="cb-preview-items"></div>
            <div class="cb-totals">
              <div class="cb-total-row"><span>${t.subtotal}</span><strong id="ciPreviewSubtotal"></strong></div>
              <div class="cb-total-row" id="ciPreviewDiscountRow"><span>${t.discount}</span><strong id="ciPreviewDiscount"></strong></div>
              <div class="cb-total-row" id="ciPreviewTaxRow"><span id="ciPreviewTaxLabel">${t.tax}</span><strong id="ciPreviewTax"></strong></div>
              <div class="cb-total-row cb-total-row-grand"><span>${t.total}</span><strong id="ciPreviewTotal"></strong></div>
            </div>
          </div>
          <div class="cb-actions">
            <button class="cb-btn" id="ciCopy" type="button" data-needs-invoice disabled>${t.copy}</button>
            <button class="cb-btn" id="ciJson" type="button" data-needs-invoice disabled>${t.json}</button>
            <button class="cb-btn" id="ciText" type="button" data-needs-invoice disabled>${t.txt}</button>
            <button class="cb-btn cb-btn-primary" id="ciPdf" type="button" data-needs-invoice disabled>${t.pdf}</button>
          </div>
          <p class="cb-privacy">${t.privacy}</p>
          <p class="cb-privacy">${t.warning}</p>
        </aside>
      </div>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
  <script src="/engines/creator-invoice-engine.js"></script>
  <script src="/assets/js/pages/creative/creator-invoice-native.js"></script>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;
}

function analyticsApp(lang) {
  const fr = lang === 'fr';
  const route = fr ? '/fr/tools/stats-createur/app' : '/tools/creator-analytics/app';
  const launcher = fr ? '/fr/tools/stats-createur/' : '/tools/creator-analytics/';
  const image = 'https://afrotools.com/assets/img/tools/creator-analytics.webp';
  const t = fr ? {
    title: 'Espace statistiques créateur | AfroTools',
    description: 'Consignez localement portée et interactions, comparez plateformes et formats, puis exportez vos données en CSV ou JSON.',
    back: 'Retour à Stats créateur', eyebrow: 'Analyse locale', h1: 'Comprendre ce qui fonctionne',
    lead: 'Consignez les chiffres de vos plateformes sans connecter de compte. Comparez la portée, l’engagement et les abonnés gagnés avec une méthode cohérente.',
    trust: ['Aucune connexion sociale', 'Stockage local', 'CSV + JSON'],
    add: 'Ajouter une publication', platform: 'Plateforme', format: 'Format', date: 'Date', label: 'Titre ou repère (facultatif)',
    impressions: 'Impressions', reach: 'Portée', likes: 'J’aime', comments: 'Commentaires', shares: 'Partages', saves: 'Enregistrements', followers: 'Abonnés gagnés',
    submit: 'Ajouter aux statistiques', clear: 'Effacer les données locales', dashboard: 'Synthèse',
    posts: 'Publications', engagement: 'Engagement', bestPlatform: 'Meilleure plateforme', bestFormat: 'Meilleur format',
    log: 'Historique', tableDate: 'Date', tablePlatform: 'Plateforme', tableFormat: 'Format', tableReach: 'Portée', tableEngagement: 'Engagement', action: 'Action',
    copy: 'Copier la synthèse', csv: 'Télécharger CSV', json: 'Télécharger JSON',
    privacy: '<strong>Confidentialité :</strong> vos statistiques restent dans le stockage local de ce navigateur. Aucun compte social, serveur ou modèle d’IA n’est contacté.',
    method: '<strong>Méthode :</strong> engagement = (J’aime + commentaires + partages + enregistrements) ÷ portée × 100. Comparez des périodes et objectifs similaires.'
  } : {
    title: 'Creator analytics workspace | AfroTools',
    description: 'Log reach and interactions locally, compare platforms and formats, then export your creator data as parseable CSV or JSON.',
    back: 'Back to CreatorAnalytics', eyebrow: 'Local analysis', h1: 'Understand what works',
    lead: 'Log figures from your platform dashboards without connecting an account. Compare reach, engagement and followers gained with a consistent method.',
    trust: ['No social login', 'Local storage', 'CSV + JSON'],
    add: 'Add a post', platform: 'Platform', format: 'Format', date: 'Date', label: 'Title or reference (optional)',
    impressions: 'Impressions', reach: 'Reach', likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves', followers: 'Followers gained',
    submit: 'Add to analytics', clear: 'Clear local data', dashboard: 'Summary',
    posts: 'Posts', engagement: 'Engagement', bestPlatform: 'Best platform', bestFormat: 'Best format',
    log: 'Post log', tableDate: 'Date', tablePlatform: 'Platform', tableFormat: 'Format', tableReach: 'Reach', tableEngagement: 'Engagement', action: 'Action',
    copy: 'Copy summary', csv: 'Download CSV', json: 'Download JSON',
    privacy: '<strong>Privacy:</strong> your metrics stay in this browser’s local storage. No social account, server or AI model is contacted.',
    method: '<strong>Method:</strong> engagement = (likes + comments + shares + saves) ÷ reach × 100. Compare periods and objectives that are alike.'
  };
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: fr ? 'Espace statistiques créateur' : 'Creator analytics workspace',
    inLanguage: lang,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `https://afrotools.com${route}`,
    image,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: fr ? ['Calcul d’engagement local', 'Comparaison de plateformes', 'Export CSV', 'Export JSON'] : ['Local engagement calculation', 'Platform comparison', 'CSV export', 'JSON export']
  });
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${sharedHead}
  <title>${t.title}</title>
  <meta name="description" content="${t.description}">
  <meta name="robots" content="noindex, follow">
  <meta property="og:title" content="${t.title}">
  <meta property="og:description" content="${t.description}">
  <meta property="og:image" content="${image}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://afrotools.com${route}">
  <meta property="og:locale" content="${fr ? 'fr_FR' : 'en_US'}">
  <link rel="canonical" href="https://afrotools.com${route}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-analytics/app">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/stats-createur/app">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-analytics/app">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="cb-app" data-creator-analytics-app>
    <div class="cb-shell">
      <a class="cb-back" href="${launcher}">← ${t.back}</a>
      <header class="cb-hero">
        <p class="cb-eyebrow">${t.eyebrow}</p>
        <h1>${t.h1}</h1>
        <p class="cb-lead">${t.lead}</p>
        <ul class="cb-trust">${t.trust.map((item) => `<li>${item}</li>`).join('')}</ul>
      </header>
      <div class="cb-grid">
        <form class="cb-card" novalidate>
          <h2>${t.add}</h2>
          <div class="cb-fields">
            <label class="cb-field"><span class="cb-label">${t.platform}</span><select id="caPlatform" class="cb-select">${['instagram','x','tiktok','youtube','linkedin','facebook','other'].map((value) => `<option value="${value}">${value}</option>`).join('')}</select></label>
            <label class="cb-field"><span class="cb-label">${t.format}</span><select id="caFormat" class="cb-select">${['reel','carousel','story','static','thread','short','long-form','other'].map((value) => `<option value="${value}">${value}</option>`).join('')}</select></label>
            <label class="cb-field"><span class="cb-label">${t.date}</span><input id="caDate" class="cb-input" type="date" required></label>
            <label class="cb-field"><span class="cb-label">${t.label}</span><input id="caLabel" class="cb-input" autocomplete="off"></label>
            <label class="cb-field"><span class="cb-label">${t.impressions}</span><input id="caImpressions" class="cb-input" type="number" min="0" value="15000"></label>
            <label class="cb-field"><span class="cb-label">${t.reach}</span><input id="caReach" class="cb-input" type="number" min="1" required value="10000"></label>
            <label class="cb-field"><span class="cb-label">${t.likes}</span><input id="caLikes" class="cb-input" type="number" min="0" value="600"></label>
            <label class="cb-field"><span class="cb-label">${t.comments}</span><input id="caComments" class="cb-input" type="number" min="0" value="50"></label>
            <label class="cb-field"><span class="cb-label">${t.shares}</span><input id="caShares" class="cb-input" type="number" min="0" value="30"></label>
            <label class="cb-field"><span class="cb-label">${t.saves}</span><input id="caSaves" class="cb-input" type="number" min="0" value="120"></label>
            <label class="cb-field"><span class="cb-label">${t.followers}</span><input id="caFollowers" class="cb-input" type="number" min="0" value="18"></label>
          </div>
          <div class="cb-actions">
            <button class="cb-btn cb-btn-primary" type="submit">${t.submit}</button>
            <button class="cb-btn cb-btn-danger" id="caClear" type="button">${t.clear}</button>
          </div>
          <p id="caError" class="cb-error" role="alert"></p>
          <p id="caStatus" class="cb-status" role="status" aria-live="polite"></p>
          <p class="cb-privacy">${t.privacy}</p>
        </form>
        <aside class="cb-card">
          <h2>${t.dashboard}</h2>
          <div class="cb-metrics">
            <div class="cb-metric"><span>${t.posts}</span><strong id="caPosts">0</strong></div>
            <div class="cb-metric"><span>${t.reach}</span><strong id="caReachTotal">0</strong></div>
            <div class="cb-metric"><span>${t.engagement}</span><strong id="caEngagement">0%</strong></div>
            <div class="cb-metric"><span>${t.followers}</span><strong id="caFollowersTotal">0</strong></div>
            <div class="cb-metric"><span>${t.bestPlatform}</span><strong id="caBestPlatform">—</strong></div>
            <div class="cb-metric"><span>${t.bestFormat}</span><strong id="caBestFormat">—</strong></div>
          </div>
          <p id="caBrief" class="cb-brief"></p>
          <div class="cb-actions">
            <button class="cb-btn" id="caCopy" type="button" data-needs-posts disabled>${t.copy}</button>
            <button class="cb-btn cb-btn-primary" id="caCsv" type="button" data-needs-posts disabled>${t.csv}</button>
            <button class="cb-btn" id="caJson" type="button" data-needs-posts disabled>${t.json}</button>
          </div>
          <p class="cb-privacy">${t.method}</p>
        </aside>
      </div>
      <section class="cb-card" style="margin-top:20px">
        <h2>${t.log}</h2>
        <div class="cb-table-wrap">
          <table class="cb-table">
            <thead><tr><th>${t.tableDate}</th><th>${t.tablePlatform}</th><th>${t.tableFormat}</th><th>${t.tableReach}</th><th>${t.tableEngagement}</th><th>${t.action}</th></tr></thead>
            <tbody id="caTableBody"></tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script src="/engines/creator-analytics-engine.js"></script>
  <script src="/assets/js/pages/creative/creator-analytics-native.js"></script>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;
}

function frenchLauncher(kind) {
  const invoice = kind === 'invoice';
  const slug = invoice ? 'facture-createur' : 'stats-createur';
  const enSlug = invoice ? 'creator-invoice' : 'creator-analytics';
  const image = `https://afrotools.com/assets/img/tools/${enSlug}.webp`;
  const title = invoice ? 'Facture créateur — factures et devis en français | AfroTools' : 'Stats créateur — suivi de contenu en français | AfroTools';
  const description = invoice
    ? 'Créez une facture multi-devise en français, calculez remise et taxe localement, puis exportez un vrai PDF, JSON ou texte sans compte.'
    : 'Suivez portée, interactions et abonnés gagnés en français, comparez formats et plateformes, puis exportez vos données en CSV ou JSON.';
  const h1 = invoice ? 'Facturer son travail créatif sans perdre le fil' : 'Transformer ses chiffres de contenu en décisions';
  const lead = invoice
    ? 'Un espace natif en français pour préparer une facture claire, vérifier les totaux et conserver un brouillon local avant envoi.'
    : 'Un espace natif en français pour consigner les métriques essentielles et comparer les performances sans connecter vos comptes sociaux.';
  const points = invoice ? [
    ['Calcul fiable', 'Lignes, quantités, prix, remise et taxe sont calculés par le même moteur local que la version anglaise.'],
    ['Exports réels', 'Téléchargez un PDF relisible, un JSON structuré ou un résumé texte après votre vérification.'],
    ['Données privées', 'Les noms, e-mails, montants et notes restent dans le navigateur ; aucun compte ni service distant.']
  ] : [
    ['Une méthode stable', 'Le taux d’engagement utilise la portée et les interactions saisies, sans mélanger des périodes incomparables.'],
    ['Décisions lisibles', 'Repérez la plateforme et le format les plus performants, puis testez une variable à la fois.'],
    ['Données privées', 'Les métriques restent dans le navigateur ; aucun compte social, serveur ou service d’IA.']
  ];
  const schema = JSON.stringify([
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: invoice ? 'Facture créateur' : 'Stats créateur',
      applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'fr',
      url: `https://afrotools.com/fr/tools/${slug}/`, image,
      description, isBasedOn: `https://afrotools.com/tools/${enSlug}/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://afrotools.com/fr/' },
        { '@type': 'ListItem', position: 2, name: 'Outils', item: 'https://afrotools.com/fr/all-tools/' },
        { '@type': 'ListItem', position: 3, name: invoice ? 'Facture créateur' : 'Stats créateur', item: `https://afrotools.com/fr/tools/${slug}/` }
      ]
    }
  ]);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${sharedHead}
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://afrotools.com/fr/tools/${slug}/">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://afrotools.com/fr/tools/${slug}/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/${enSlug}/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/${slug}/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${invoice ? 'ankara-ya-mtayarishi' : 'takwimu-za-mtayarishi'}/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/${enSlug}/">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="cb-app">
    <div class="cb-shell">
      <a class="cb-back" href="/fr/creative/">← Économie créative</a>
      <header class="cb-hero">
        <p class="cb-eyebrow">${invoice ? 'Business créateur' : 'Performance créateur'}</p>
        <h1>${h1}</h1>
        <p class="cb-lead">${lead}</p>
        <ul class="cb-trust"><li>Interface française native</li><li>Fonctionne sur mobile</li><li>Sans compte</li></ul>
        <div class="cb-actions"><a class="cb-link cb-btn-primary" href="/fr/tools/${slug}/app">Ouvrir l’espace de travail</a><a class="cb-link" href="/tools/${enSlug}/">Voir la version anglaise</a></div>
      </header>
      <section class="cb-grid" aria-label="Fonctions principales">
        ${points.map(([heading, body]) => `<article class="cb-card"><h2>${heading}</h2><p class="cb-lead">${body}</p></article>`).join('')}
      </section>
      <section class="cb-card" style="margin-top:20px">
        <h2>${invoice ? 'Avant d’envoyer une facture' : 'Avant de comparer vos publications'}</h2>
        <p class="cb-lead">${invoice
          ? 'Vérifiez les mentions obligatoires, le numéro fiscal, la taxe, la retenue à la source, la devise et les conditions de paiement applicables. AfroTools prépare un brouillon ; il ne dépose ni ne certifie la facture.'
          : 'Utilisez la même définition de portée et la même période pour chaque comparaison. Les chiffres dépendent de vos exports de plateforme et ne constituent pas une prédiction de croissance.'}</p>
      </section>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;
}

write('tools/creator-invoice/app.html', invoiceApp('en'));
write('fr/tools/facture-createur/app.html', invoiceApp('fr'));
write('tools/creator-analytics/app.html', analyticsApp('en'));
write('fr/tools/stats-createur/app.html', analyticsApp('fr'));
write('fr/tools/facture-createur/index.html', frenchLauncher('invoice'));
write('fr/tools/stats-createur/index.html', frenchLauncher('analytics'));
