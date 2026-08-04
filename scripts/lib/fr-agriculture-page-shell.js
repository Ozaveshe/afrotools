'use strict';

const { alternateEntries } = require('./fr-agriculture-hreflang');

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function frenchFamilyRoute(context, family, countryCode) {
  const rows = context && context.manifest && Array.isArray(context.manifest.rows)
    ? context.manifest.rows
    : [];
  const sibling = rows.find((row) => (
    row.family === family
    && row.country
    && row.country.code === countryCode
    && row.french
    && row.french.route
  ));
  if (!sibling) {
    throw new Error(`Missing French Agriculture route for ${family}/${countryCode}.`);
  }
  return sibling.french.route;
}

const REVIEWED_FAMILY_ARTWORK_ALTS = Object.freeze({
  'Rendement des cultures': 'Illustration du calculateur de rendement',
  'Engrais NPK': 'Illustration du calculateur d’engrais NPK',
  Irrigation: 'Illustration du calculateur d’irrigation',
  'Rentabilité agricole': 'Illustration du calculateur de rentabilité agricole',
  Semences: 'Illustration du calculateur de quantité de semences',
  Pisciculture: 'Illustration du calculateur de rentabilité piscicole',
  Serres: 'Illustration du calculateur de coût et de rentabilité d’une serre',
  'Transformation du manioc': 'Illustration du calculateur de transformation du manioc',
  'Ration animale': 'Illustration du calculateur de ration animale',
  'Paie agricole': 'Illustration du calculateur de paie agricole',
  'Prix des intrants': 'Illustration du comparateur de prix des intrants agricoles',
  'Prêts agricoles': 'Illustration du calculateur de prêt agricole',
});

function renderFrenchAgriculturePage(options) {
  const {
    row,
    title,
    description,
    heading,
    lead,
    artwork,
    body,
    scripts,
    pageConfig,
    familyLabel = 'Outil agricole',
    familyRoute = '/fr/agriculture/',
  } = options;
  const canonical = `https://afrotools.com${row.french.route}`;
  const englishUrl = `https://afrotools.com${row.english.route}`;
  const hreflangLinks = alternateEntries(row)
    .map(({ hreflang, route }) => (
      `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`
    ))
    .join('\n');
  const image = artwork
    ? `https://afrotools.com/${artwork.replace(/^\/+/, '')}`
    : 'https://afrotools.com/assets/img/og-default.png';
  const country = row.country || {};
  const reviewedFamilyAlt = REVIEWED_FAMILY_ARTWORK_ALTS[familyLabel]
    || `Illustration de l’outil agricole : ${familyLabel}`;
  const artworkAlt = country.frenchName
    ? familyLabel === 'Rendement des cultures'
      ? `${reviewedFamilyAlt} pour ${country.frenchName}`
      : `${reviewedFamilyAlt} — ${country.frenchName}`
    : `Illustration de l’outil agricole : ${familyLabel}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: heading,
    url: canonical,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    inLanguage: 'fr',
    isAccessibleForFree: true,
    description,
    spatialCoverage: country.code ? {
      '@type': 'Country',
      name: country.frenchName,
      identifier: country.code,
    } : undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'sourceJurisdiction', value: country.code || 'Africa' },
      { '@type': 'PropertyValue', name: 'formulaJurisdiction', value: country.code || 'Africa' },
    ],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' },
    image,
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools en français', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Agriculture', item: 'https://afrotools.com/fr/agriculture/' },
      { '@type': 'ListItem', position: 3, name: familyLabel, item: `https://afrotools.com${familyRoute}` },
      { '@type': 'ListItem', position: 4, name: country.frenchName || heading, item: canonical },
    ],
  };

  return `<!DOCTYPE html>
<html lang="fr" data-theme="system">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="content-language" content="fr">
<meta name="afrotools-country-id" content="${escapeHtml(country.code || '')}">
<meta name="afrotools-source-jurisdiction" content="${escapeHtml(country.code || '')}">
<meta name="afrotools-formula-jurisdiction" content="${escapeHtml(country.code || '')}">
<meta name="tool-id" content="${escapeHtml(row.english.id)}">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
${hreflangLinks}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="${image}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${safeJson(structuredData)}</script>
<script type="application/ld+json">${safeJson(breadcrumb)}</script>
<link rel="stylesheet" href="/assets/css/tokens.min.css">
<link rel="stylesheet" href="/assets/css/global.min.css">
<style>
:root{color-scheme:light dark;--agri-bg:#f5f8fc;--agri-card:#fff;--agri-text:#132238;--agri-muted:#5d6b7e;--agri-border:#d8e1ec;--agri-brand:#075eb8;--agri-brand-strong:#064987;--agri-primary-on:#fff;--agri-soft:#e9f3ff;--agri-good:#08783e;--agri-warn:#995d00;--agri-danger:#b42318;--agri-shadow:0 12px 32px rgba(15,35,63,.08)}
html[data-theme="dark"]{--agri-bg:#0d1624;--agri-card:#152237;--agri-text:#f3f7fc;--agri-muted:#b7c3d4;--agri-border:#34465f;--agri-brand:#75b8ff;--agri-brand-strong:#9dccff;--agri-primary-on:#071525;--agri-soft:#173252;--agri-good:#77d49e;--agri-warn:#ffd078;--agri-danger:#ff9b91;--agri-shadow:none}
@media(prefers-color-scheme:dark){html[data-theme="system"]{--agri-bg:#0d1624;--agri-card:#152237;--agri-text:#f3f7fc;--agri-muted:#b7c3d4;--agri-border:#34465f;--agri-brand:#75b8ff;--agri-brand-strong:#9dccff;--agri-primary-on:#071525;--agri-soft:#173252;--agri-good:#77d49e;--agri-warn:#ffd078;--agri-danger:#ff9b91;--agri-shadow:none}}
*{box-sizing:border-box}html{background:var(--agri-bg);scroll-behavior:smooth}body{margin:0;background:var(--agri-bg);color:var(--agri-text);font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.55}a{color:var(--agri-brand)}button,input,select{font:inherit}.skip-link{position:fixed;left:12px;top:-80px;z-index:1000;padding:10px 14px;background:var(--agri-card);color:var(--agri-text);border:2px solid var(--agri-brand);border-radius:8px}.skip-link:focus{top:12px}.site-head{background:#09182a;color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}.site-head__inner,.shell{width:min(1080px,calc(100% - 32px));margin-inline:auto}.site-head__inner{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:.02em}.site-nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.site-nav a{color:#dceaff;text-decoration:none;font-weight:700;font-size:.9rem}.theme-toggle{min-height:42px;border:1px solid #66809f;border-radius:8px;background:#122d4d;color:#fff;padding:8px 12px;cursor:pointer}.theme-toggle:focus-visible,a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #ffbf47;outline-offset:3px}.hero{background:#0b1d32;color:#fff;padding:34px 0}.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 168px;align-items:center;gap:28px}.breadcrumbs{display:flex;gap:8px;flex-wrap:wrap;font-size:.82rem;color:#b8c9df;margin-bottom:14px}.breadcrumbs a{color:#dceaff}.hero h1{margin:0;color:#fff;font-size:clamp(1.8rem,5vw,3.1rem);line-height:1.08;overflow-wrap:anywhere}.hero p{max-width:760px;color:#d4e1ef;font-size:1.02rem;margin:14px 0 0}.hero-art{width:168px;aspect-ratio:1;object-fit:cover;border-radius:18px;border:1px solid rgba(255,255,255,.2);background:#122d4d}.shell{padding:28px 0 56px}.card{background:var(--agri-card);border:1px solid var(--agri-border);border-radius:14px;box-shadow:var(--agri-shadow);padding:22px;margin-bottom:18px}.card h2,.card h3{margin-top:0;color:var(--agri-text)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.field{display:grid;gap:7px;min-width:0}.field label{font-weight:800;font-size:.88rem}.field small{color:var(--agri-muted)}.field input,.field select{width:100%;min-height:46px;border:1.5px solid var(--agri-border);border-radius:9px;padding:10px 12px;background:var(--agri-card);color:var(--agri-text)}.field input:focus,.field select:focus{border-color:var(--agri-brand)}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.action{min-height:44px;border:1.5px solid var(--agri-border);border-radius:9px;background:var(--agri-card);color:var(--agri-text);font-weight:800;padding:9px 14px;cursor:pointer}.action.primary{background:var(--agri-brand-strong);border-color:var(--agri-brand-strong);color:var(--agri-primary-on)}.action:disabled{opacity:.55;cursor:not-allowed}.empty{border:1px dashed var(--agri-border);border-radius:10px;padding:20px;text-align:center;color:var(--agri-muted)}.error{min-height:24px;color:var(--agri-danger);font-weight:800;margin-top:10px}.result-panel[hidden]{display:none}.result-hero{padding:20px;border-radius:12px;background:var(--agri-soft);text-align:center}.result-value{font-size:clamp(2rem,9vw,3.6rem);font-weight:900;color:var(--agri-brand-strong);overflow-wrap:anywhere}.result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.metric{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.metric strong{display:block;font-size:1.08rem;overflow-wrap:anywhere}.metric span{color:var(--agri-muted);font-size:.82rem}.compare{display:grid;gap:10px;margin-top:18px}.compare-row{display:grid;grid-template-columns:minmax(110px,160px) minmax(0,1fr);gap:10px;align-items:center}.bar{height:26px;border-radius:999px;background:var(--agri-soft);overflow:hidden}.bar span{display:flex;align-items:center;min-width:max-content;height:100%;padding-inline:8px;border-radius:999px;background:var(--agri-brand-strong);color:var(--agri-primary-on);font-size:.74rem;font-weight:800}.recommendations{padding-left:20px}.recommendations li{margin-bottom:8px}.status{min-height:24px;margin-top:10px;color:var(--agri-good);font-weight:800}.trust-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.trust-item{border:1px solid var(--agri-border);padding:10px 12px;background:var(--agri-soft);border-radius:6px}.trust-item strong{display:block}.trust-item span{font-size:.84rem;color:var(--agri-muted)}.table-wrap{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:600px}.data-table th,.data-table td{text-align:left;border-bottom:1px solid var(--agri-border);padding:10px}.data-table th{font-size:.78rem}.site-foot{border-top:1px solid var(--agri-border);background:var(--agri-card);padding:24px 0;color:var(--agri-muted);font-size:.84rem}.site-foot__inner{width:min(1080px,calc(100% - 32px));margin-inline:auto}.site-foot a{margin-right:14px}.visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.country-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 20px;padding-left:20px}.country-list li{break-inside:avoid}.country-list span{color:var(--agri-muted);font-size:.82rem}
@media(max-width:720px){.site-head__inner{align-items:flex-start;padding:12px 0}.site-nav{justify-content:flex-end}.hero-grid{grid-template-columns:1fr}.hero-art{width:112px}.grid,.result-grid,.trust-grid,.country-list{grid-template-columns:1fr}.compare-row{grid-template-columns:1fr}.card{padding:17px}.shell,.site-head__inner{width:min(100% - 24px,1080px)}}
@media(max-width:360px){.site-nav a{display:none}.actions .action{width:100%}.hero{padding:26px 0}.shell{padding-top:18px}.card{border-radius:10px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
@media print{.site-head,.actions,.theme-toggle,.breadcrumbs,.site-foot{display:none!important}.shell{width:100%;padding:0}.card{box-shadow:none;break-inside:avoid}}
</style>
</head>
<body>
<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-head">
  <div class="site-head__inner">
    <a class="brand" href="/fr/">AfroTools</a>
    <nav class="site-nav" aria-label="Navigation principale">
      <a href="/fr/agriculture/">Agriculture</a>
      <a href="/fr/all-tools/">Tous les outils</a>
      <a href="/fr/ai/">Assistant</a>
      <button class="theme-toggle" id="themeToggle" type="button" aria-pressed="false">Thème sombre</button>
    </nav>
  </div>
</header>
<section class="hero">
  <div class="shell hero-grid">
    <div>
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <a href="/fr/">Accueil</a><span aria-hidden="true">/</span>
        <a href="/fr/agriculture/">Agriculture</a><span aria-hidden="true">/</span>
        <a href="${escapeHtml(familyRoute)}">${escapeHtml(familyLabel)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(country.frenchName || '')}</span>
      </nav>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(lead)}</p>
    </div>
${artwork ? `    <img class="hero-art" src="/${escapeHtml(artwork.replace(/^\/+/, ''))}" alt="${escapeHtml(artworkAlt)}" width="168" height="168">` : ''}
  </div>
</section>
<main class="shell" id="contenu" tabindex="-1">
${body}
</main>
<footer class="site-foot">
  <div class="site-foot__inner">
    <p><strong>AfroTools en français.</strong> Des outils pratiques, gratuits et adaptés aux contextes africains.</p>
    <a href="/fr/privacy/">Confidentialité</a>
    <a href="/fr/agriculture/">Agriculture</a>
    <a href="/fr/all-tools/">Tous les outils</a>
  </div>
</footer>
<script>window.__FR_AGRI_PAGE__=${safeJson(pageConfig)};</script>
${scripts}
<script>
(function(){
  var button=document.getElementById('themeToggle');
  var stored='';
  try{stored=localStorage.getItem('afrotools-theme')||'';}catch(error){}
  if(stored==='light'||stored==='dark')document.documentElement.dataset.theme=stored;
  function sync(){
    var dark=document.documentElement.dataset.theme==='dark';
    button.setAttribute('aria-pressed',dark?'true':'false');
    button.textContent=dark?'Thème clair':'Thème sombre';
  }
  button.addEventListener('click',function(){
    var next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    try{localStorage.setItem('afrotools-theme',next);}catch(error){}
    sync();
  });
  sync();
})();
</script>
</body>
</html>
`;
}

module.exports = {
  escapeHtml,
  frenchFamilyRoute,
  safeJson,
  renderFrenchAgriculturePage,
};
