'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(ROOT, 'data', 'insurance', 'assumption-contract.json');
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const APPS = CONTRACT.apps;
const registryApi = require('./lib/canonical-registry');
const progressiveDirectories = require('./build-progressive-directories');

const SW_ALTERNATES = {
  'car-insurance': '/sw/zana/kikokotoo-bima-ya-gari/',
  'health-insurance-compare': '/sw/zana/kilinganisha-bima-ya-afya/',
  'life-insurance-calc': '/sw/zana/kikokotoo-bima-ya-maisha/',
  'funeral-insurance': '/sw/zana/kikokotoo-bima-ya-mazishi/',
  'motor-third-party': '/sw/zana/bima-ya-lazima-ya-gari/',
  'business-insurance': '/sw/zana/kikokotoo-bima-ya-biashara/',
  'travel-insurance': '/sw/zana/kikokotoo-bima-ya-safari/',
  'workers-comp': '/sw/zana/fidia-ya-wafanyakazi/',
  'health-contribution': '/sw/zana/kikokotoo-mchango-wa-afya/',
  'claim-tracker': '/sw/zana/ufuatiliaji-wa-dai/',
  'crop-insurance-calc': '/sw/zana/kikokotoo-bima-ya-mazao/',
  'fire-insurance': '/sw/zana/kikokotoo-bima-ya-moto/',
  microinsurance: '/sw/zana/bima-ndogo/',
  'professional-indemnity': '/sw/zana/bima-ya-dhima-ya-kitaalamu/'
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function absolute(route) {
  return `https://afrotools.com${route}`;
}

function currencyField() {
  return `<label>Devise d’affichage
    <select name="currency" aria-describedby="currency-help">
      <option value="XOF">XOF — franc CFA BCEAO</option>
      <option value="XAF">XAF — franc CFA BEAC</option>
      <option value="EUR">EUR — euro</option>
      <option value="MAD">MAD — dirham marocain</option>
      <option value="DZD">DZD — dinar algérien</option>
      <option value="TND">TND — dinar tunisien</option>
      <option value="NGN">NGN — naira nigérian</option>
      <option value="GHS">GHS — cedi ghanéen</option>
      <option value="KES">KES — shilling kényan</option>
      <option value="ZAR">ZAR — rand sud-africain</option>
      <option value="USD">USD — dollar américain</option>
    </select>
    <small id="currency-help">La devise change uniquement l’étiquette ; aucun taux de change n’est appliqué.</small>
  </label>`;
}

function fields(app) {
  if (app.mode === 'need') {
    return `<div class="insurance-workflow__grid">
      ${currencyField()}
      <label>Besoins annuels du foyer<input name="annual" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Nombre d’années à couvrir<input name="years" type="number" min="1" step="1" required inputmode="numeric"></label>
      <label>Dettes restantes<input name="debts" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Besoins d’éducation<input name="education" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Autres besoins ponctuels<input name="other" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Épargne et couvertures déjà disponibles<input name="available" type="number" min="0" step="any" required inputmode="decimal"></label>
    </div>`;
  }
  if (app.mode === 'compare') {
    return `<div class="insurance-workflow__grid">
      ${currencyField()}
      <label>Prime annuelle de la formule A<input name="aPremium" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Franchise envisagée — formule A<input name="aExcess" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plafond annuel — formule A<input name="aLimit" type="number" min="0.01" step="any" required inputmode="decimal"></label>
      <label>Prime annuelle de la formule B<input name="bPremium" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Franchise envisagée — formule B<input name="bExcess" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plafond annuel — formule B<input name="bLimit" type="number" min="0.01" step="any" required inputmode="decimal"></label>
    </div>`;
  }
  if (app.mode === 'contribution') {
    return `<div class="insurance-workflow__grid">
      ${currencyField()}
      <label>Assiette salariale ou masse salariale<input name="base" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Taux salarié vérifié (%)<input name="employee" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
      <label>Taux employeur vérifié (%)<input name="employer" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
      <label>Nombre de périodes<input name="months" type="number" min="1" step="1" required inputmode="numeric"></label>
    </div>`;
  }
  if (app.mode === 'claim') {
    return `<div class="insurance-workflow__grid">
      <label>Date du sinistre<input name="incident" type="date" required></label>
      <label>Date de déclaration prévue<input name="planned" type="date" required></label>
      <label>Délai de déclaration indiqué au contrat (jours)<input name="windowDays" type="number" min="1" step="1" required inputmode="numeric"></label>
    </div>`;
  }
  if (app.mode === 'warning') {
    return `<fieldset><legend>Signaux que vous avez observés</legend>
      <label><input type="checkbox" name="signals" value="pressure">Pression pour payer immédiatement ou hors des canaux habituels</label>
      <label><input type="checkbox" name="signals" value="identity">Identité ou licence de l’intermédiaire impossible à vérifier indépendamment</label>
      <label><input type="checkbox" name="signals" value="document">Informations du contrat incompatibles avec les dossiers de l’assureur</label>
      <label><input type="checkbox" name="signals" value="guarantee">Promesse de paiement garanti ou de couverture impossible</label>
    </fieldset>`;
  }
  return `<div class="insurance-workflow__grid">
    ${currencyField()}
    <label>${escapeHtml(app.exposureLabel)}<input name="exposure" type="number" min="0.01" step="any" required inputmode="decimal"></label>
    <label>${escapeHtml(app.rateLabel)}<input name="rate" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
    <label>${escapeHtml(app.fixedLabel)}<input name="fixed" type="number" min="0" step="any" required inputmode="decimal"></label>
    <label>Marge de prudence saisie (%)<input name="contingency" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
  </div>`;
}

function appSchema(app) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: app.title,
        description: app.description,
        url: absolute(app.frenchRoute),
        inLanguage: 'fr',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        isBasedOn: absolute(app.englishRoute),
        image: absolute(`/assets/img/tools/${app.id}.webp`),
        provider: {
          '@type': 'Organization',
          name: 'AfroTools',
          url: 'https://afrotools.com/'
        }
      },
      {
        '@type': 'FAQPage',
        inLanguage: 'fr',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Cet outil fournit-il un devis ou un contrat d’assurance ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Non. Il calcule uniquement un scénario à partir de vos propres hypothèses et ne se connecte à aucun assureur.'
            }
          },
          {
            '@type': 'Question',
            name: 'Les données saisies sont-elles envoyées sur Internet ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Non. Le calcul et les exports restent dans votre navigateur. L’aide IA séparée est facultative et demande un consentement explicite.'
            }
          }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AfroTools en français', item: 'https://afrotools.com/fr/' },
          { '@type': 'ListItem', position: 2, name: 'Assurance', item: 'https://afrotools.com/fr/insurance/' },
          { '@type': 'ListItem', position: 3, name: app.title, item: absolute(app.frenchRoute) }
        ]
      }
    ]
  });
}

function relatedApps(currentId) {
  const currentIndex = APPS.findIndex((app) => app.id === currentId);
  return [1, 2, 3].map((offset) => APPS[(currentIndex + offset) % APPS.length]);
}

function appHtml(app) {
  const related = relatedApps(app.id);
  const submitLabel = app.mode === 'warning' ? 'Examiner les signaux' : 'Calculer avec mes données';
  const aiQuery = encodeURIComponent(`Aide-moi à choisir le bon outil pour ${app.title.toLowerCase()}`);
  const swAlternate = SW_ALTERNATES[app.id]
    ? `\n<link rel="alternate" hreflang="sw" href="${absolute(SW_ALTERNATES[app.id])}">`
    : '';
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(app.title)} | AfroTools</title>
  <meta name="description" content="${escapeHtml(app.description)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#075985">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(app.title)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(app.description)}">
  <meta property="og:url" content="${absolute(app.frenchRoute)}">
  <meta property="og:image" content="${absolute(`/assets/img/tools/${app.id}.webp`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(app.title)} | AfroTools">
  <meta name="twitter:description" content="${escapeHtml(app.description)}">
  <meta name="twitter:image" content="${absolute(`/assets/img/tools/${app.id}.webp`)}">
  <script type="application/ld+json">${appSchema(app)}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
  <link rel="stylesheet" href="/assets/css/insurance-assumption-workflow.css">
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
  <script src="/assets/js/pages/insurance-assumption-workflow.js" defer></script>
<link rel="canonical" href="${absolute(app.frenchRoute)}">
<link rel="alternate" hreflang="en" href="${absolute(app.englishRoute)}">
<link rel="alternate" hreflang="fr" href="${absolute(app.frenchRoute)}">${swAlternate}
<link rel="alternate" hreflang="x-default" href="${absolute(app.englishRoute)}">
</head>
<body class="day7-insurance-workflow">
  <afro-navbar theme="dark" active="insurance"></afro-navbar>
  <main class="insurance-workflow" data-insurance-workflow data-locale="fr" data-app-id="${app.id}" data-mode="${app.mode}" data-currency="XOF" data-source-date="${CONTRACT.datasetFloor}">
    <header class="insurance-workflow__hero insurance-workflow__hero--with-art">
      <div>
        <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/insurance/">Assurance</a></nav>
        <p class="insurance-workflow__eyebrow">Feuille locale, hypothèses explicites</p>
        <h1>${escapeHtml(app.title)}</h1>
        <p>${escapeHtml(app.description)}</p>
        <p class="insurance-workflow__notice"><strong>Limite de planification :</strong> AfroTools ne consulte aucun système d’assureur, n’émet aucun devis ou contrat, ne confirme aucune garantie, éligibilité, disponibilité d’assureur, validité de sinistre ou obligation légale. Les champs vides restent vides.</p>
      </div>
      <img src="/assets/img/tools/${app.id}.webp" alt="" width="480" height="320" loading="eager">
    </header>

    <section class="insurance-workflow__panel" aria-labelledby="workflow-heading">
      <h2 id="workflow-heading">Saisissez vos propres hypothèses</h2>
      <p>${escapeHtml(app.riskPrompt)}</p>
      <form novalidate>
        ${fields(app)}
        <div class="insurance-workflow__actions">
          <button type="submit">${submitLabel}</button>
          <button type="button" data-action="reset">Réinitialiser</button>
        </div>
        <output class="insurance-workflow__result" data-result tabindex="-1" role="status" aria-live="polite" aria-atomic="true"></output>
        <div class="insurance-workflow__actions insurance-workflow__exports" aria-label="Exports locaux">
          <button type="button" data-export="copy" disabled>Copier le résumé</button>
          <button type="button" data-export="json" disabled>Télécharger JSON</button>
          <button type="button" data-export="pdf" disabled>Imprimer / enregistrer en PDF</button>
        </div>
        <p class="insurance-workflow__small" data-export-status role="status" aria-live="polite"></p>
      </form>
      <p class="insurance-workflow__small"><strong>Vie privée locale :</strong> aucune valeur du formulaire n’est envoyée sur le réseau, enregistrée dans le stockage du navigateur ou ajoutée à une URL. Les exports sont créés sur cet appareil.</p>
    </section>

    <section class="insurance-workflow__source" aria-labelledby="source-heading">
      <h2 id="source-heading">Source, fraîcheur et confiance</h2>
      <p><strong>Plancher du jeu de données :</strong> 29 mars 2026. <span data-source-age></span></p>
      <p><strong>Source :</strong> registre AfroTools <code>data/insurance/official-sources.json</code>. Le rattachement d’un site de régulateur ne prouve ni tarif, ni produit, ni assureur disponible, ni règle d’éligibilité.</p>
      <p><strong>Confiance :</strong> élevée pour l’arithmétique issue de vos entrées ; faible pour toute conclusion de marché, juridique, contractuelle ou d’éligibilité, car cette feuille n’en produit aucune.</p>
      <p><strong>Action requise :</strong> confirmez tarifs, taxes, garanties, exclusions, délais, licences, documents et procédure auprès du régulateur compétent et d’un assureur ou courtier autorisé avant de payer ou signer.</p>
    </section>

    <section class="insurance-workflow__panel" aria-labelledby="ai-heading">
      <h2 id="ai-heading">Trouver le bon parcours sans envoyer vos données</h2>
      <p>Le routage local d’AfroTools AI peut ouvrir cette feuille sans consentement à un modèle. Toute aide IA facultative demande un consentement explicite et doit laisser une solution locale ; ne transmettez pas les montants ou faits privés de ce formulaire.</p>
      <a href="/ai/?locale=fr&amp;router=off&amp;q=${aiQuery}">Ouvrir le routage local en français</a>
    </section>

    <section class="insurance-workflow__panel" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Questions fréquentes</h2>
      <details><summary>Cet outil fournit-il un devis ou un contrat d’assurance ?</summary><p>Non. Il calcule uniquement un scénario à partir de vos propres hypothèses et ne se connecte à aucun assureur.</p></details>
      <details><summary>Les données saisies sont-elles envoyées sur Internet ?</summary><p>Non. Le calcul et les exports restent dans votre navigateur. L’aide IA séparée est facultative et demande un consentement explicite.</p></details>
      <details><summary>Puis-je utiliser le résultat pour souscrire ou déclarer un sinistre ?</summary><p>Utilisez-le comme feuille de préparation uniquement. Vérifiez ensuite chaque condition avec le régulateur, l’assureur ou un professionnel autorisé.</p></details>
    </section>

    <nav class="insurance-workflow__panel" aria-label="Autres outils d’assurance en français">
      <h2>Continuer dans la catégorie Assurance</h2>
      <ul class="insurance-workflow__countries">
        ${related.map((item) => `<li><a href="${item.frenchRoute}">${escapeHtml(item.title)}</a></li>`).join('')}
        <li><a href="/fr/all-tools/?category=insurance">Tous les outils d’assurance</a></li>
      </ul>
    </nav>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

function hubSchema() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Outils d’assurance en français',
        description: 'Seize feuilles de planification d’assurance en français, sans devis ni décision de garantie.',
        url: 'https://afrotools.com/fr/insurance/',
        inLanguage: 'fr',
        numberOfItems: APPS.length,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: APPS.length,
          itemListElement: APPS.map((app, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: app.title,
            url: absolute(app.frenchRoute)
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AfroTools en français', item: 'https://afrotools.com/fr/' },
          { '@type': 'ListItem', position: 2, name: 'Assurance', item: 'https://afrotools.com/fr/insurance/' }
        ]
      }
    ]
  });
}

function hubHtml() {
  const cards = APPS.map((app) => `<a class="insurance-link" href="${app.frenchRoute}" data-insurance-app="${app.id}">
    <img src="/assets/img/tools/${app.id}.webp" alt="" width="320" height="180" loading="lazy">
    <strong>${escapeHtml(app.title)}</strong>
    <span>${escapeHtml(app.description)}</span>
  </a>`).join('\n');
  const options = APPS.map((app) => `<option value="${app.id}">${escapeHtml(app.title)}</option>`).join('');
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Assurance : 16 outils de planification | AfroTools</title>
  <meta name="description" content="Choisissez parmi 16 outils d’assurance en français pour comparer des hypothèses, préparer un sinistre ou vérifier des coûts sans devis ni garantie.">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#075985">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="Assurance : 16 outils de planification | AfroTools">
  <meta property="og:description" content="Des feuilles locales pour comparer des hypothèses et préparer des vérifications, sans devis ni décision de garantie.">
  <meta property="og:url" content="https://afrotools.com/fr/insurance/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/car-insurance.webp">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${hubSchema()}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
  <link rel="stylesheet" href="/assets/css/insurance-assumption-workflow.css">
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<link rel="canonical" href="https://afrotools.com/fr/insurance/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/insurance/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/insurance/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/bima/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/insurance/">
</head>
<body class="day7-insurance-workflow">
  <afro-navbar theme="dark" active="insurance"></afro-navbar>
  <main class="insurance-workflow">
    <header class="insurance-workflow__hero">
      <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / Assurance</nav>
      <p class="insurance-workflow__eyebrow">16 applications canoniques, aucune promesse de contrat</p>
      <h1>Commencez par la décision d’assurance, pas par une prime promise.</h1>
      <p>Choisissez une feuille de préparation pour un devis, une comparaison, une contribution, un sinistre ou des signaux d’alerte. Ces outils ne lient aucune garantie, n’émettent aucun contrat, ne confirment aucun assureur et ne fournissent aucun conseil officiel.</p>
    </header>

    <section class="insurance-workflow__panel" aria-labelledby="router-heading">
      <h2 id="router-heading">Trouver une feuille</h2>
      <form id="fr-insurance-router" novalidate>
        <label for="fr-insurance-need">Que voulez-vous préparer ?
          <select id="fr-insurance-need" required>
            <option value="">Choisir une application</option>
            ${options}
          </select>
        </label>
        <div class="insurance-workflow__actions">
          <button type="submit">Afficher le parcours</button>
          <button type="reset" data-action="reset">Réinitialiser</button>
        </div>
      </form>
      <div id="fr-insurance-route" class="insurance-workflow__result" hidden aria-live="polite">
        <strong id="fr-insurance-title"></strong>
        <p id="fr-insurance-note"></p>
        <a id="fr-insurance-link">Ouvrir la feuille</a>
      </div>
      <p id="fr-insurance-status" role="status" aria-live="polite"></p>
      <p class="insurance-workflow__small">Le registre contient aussi des variantes pays. Elles restent des expériences localisées distinctes et ne sont pas comptées comme des applications canoniques supplémentaires.</p>
    </section>

    <section aria-labelledby="directory-heading">
      <h2 id="directory-heading">16 outils d’assurance en français</h2>
      <div class="insurance-list">${cards}</div>
    </section>

    <section class="insurance-workflow__source" aria-labelledby="trust-heading">
      <h2 id="trust-heading">Limites communes</h2>
      <p>Les chiffres proviennent uniquement de vos saisies. Les données réglementaires et commerciales changent ; vérifiez toute obligation, prime, garantie, exclusion, licence, disponibilité, éligibilité ou procédure auprès de l’autorité et d’un professionnel autorisé.</p>
      <p>Les formulaires restent locaux. Le routage AfroTools AI fonctionne sans modèle ; toute aide IA facultative demande un consentement explicite et conserve une solution sans IA.</p>
      <p><a href="/fr/all-tools/?category=insurance">Voir la découverte Assurance complète</a> · <a href="/fr/">Retour à l’accueil français</a> · <a href="/fr/health/">Santé en français</a></p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script>
  (function () {
    'use strict';
    var apps = ${JSON.stringify(Object.fromEntries(APPS.map((app) => [app.id, {
      title: app.title,
      description: app.description,
      route: app.frenchRoute
    }]))).replace(/</g, '\\u003c')};
    var form = document.getElementById('fr-insurance-router');
    var select = document.getElementById('fr-insurance-need');
    var result = document.getElementById('fr-insurance-route');
    var status = document.getElementById('fr-insurance-status');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var app = apps[select.value];
      if (!app) {
        result.hidden = true;
        status.textContent = 'Choisissez une application.';
        select.setAttribute('aria-invalid', 'true');
        select.focus();
        return;
      }
      select.removeAttribute('aria-invalid');
      document.getElementById('fr-insurance-title').textContent = app.title;
      document.getElementById('fr-insurance-note').textContent = app.description;
      document.getElementById('fr-insurance-link').href = app.route;
      result.hidden = false;
      status.textContent = 'Parcours sélectionné.';
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        result.hidden = true;
        status.textContent = '';
        select.removeAttribute('aria-invalid');
        select.focus();
      }, 0);
    });
  }());
  </script>
</body>
</html>
`;
}

function buildFrenchDiscovery() {
  const registry = registryApi.buildCanonicalRegistry();
  const validation = registryApi.validateCanonicalRegistry(registry);
  if (!validation.ok) throw new Error(validation.errors.map(registryApi.formatIssue).join('\n'));

  const categoryFile = path.join(ROOT, 'fr', 'categories', 'index.html');
  const categoryCurrent = fs.readFileSync(categoryFile, 'utf8');
  const categoryFallback = progressiveDirectories.categoryFallback(registry, 'fr');
  const categoryExpected = progressiveDirectories.replaceFrenchCategoryMetadata(
    progressiveDirectories.replaceBlock(categoryCurrent, 'fr/categories/index.html', categoryFallback),
    'fr/categories/index.html'
  );
  fs.writeFileSync(categoryFile, categoryExpected, 'utf8');

  const allToolsFile = path.join(ROOT, 'fr', 'all-tools', 'index.html');
  const allToolsCurrent = fs.readFileSync(allToolsFile, 'utf8');
  const allToolsFallback = progressiveDirectories.allToolsFallback(registry, 'fr');
  const allToolsExpected = progressiveDirectories.replaceBlock(
    allToolsCurrent,
    'fr/all-tools/index.html',
    allToolsFallback
  );
  fs.writeFileSync(allToolsFile, allToolsExpected, 'utf8');
  console.log('Reconciled scoped French category and all-tools discovery fallbacks.');
}

function run() {
  if (APPS.length !== 16) throw new Error(`Expected 16 canonical Insurance apps, found ${APPS.length}`);
  const seenIds = new Set();
  const seenFrenchRoutes = new Set();
  for (const app of APPS) {
    if (seenIds.has(app.id)) throw new Error(`Duplicate Insurance app id: ${app.id}`);
    if (seenFrenchRoutes.has(app.frenchRoute)) throw new Error(`Duplicate French Insurance route: ${app.frenchRoute}`);
    seenIds.add(app.id);
    seenFrenchRoutes.add(app.frenchRoute);
    const output = path.join(ROOT, app.frenchRoute.replace(/^\/+/, ''), 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, appHtml(app), 'utf8');
    console.log(`Built ${app.id} -> ${app.frenchRoute}`);
  }
  const hub = path.join(ROOT, 'fr', 'insurance', 'index.html');
  fs.mkdirSync(path.dirname(hub), { recursive: true });
  fs.writeFileSync(hub, hubHtml(), 'utf8');
  console.log(`Built French Insurance hub with ${APPS.length} canonical apps.`);
  buildFrenchDiscovery();
}

if (require.main === module) run();

module.exports = { run, appHtml, hubHtml, buildFrenchDiscovery };
