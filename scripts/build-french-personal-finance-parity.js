#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const REVIEW_DATE = '18 juillet 2026';
const ISO_DATE = '2026-07-18';
const CHECK = process.argv.includes('--check');

const countryOptions = `
<option value="CI">Côte d’Ivoire · XOF</option>
<option value="SN">Sénégal · XOF</option>
<option value="CM">Cameroun · XAF</option>
<option value="MA">Maroc · MAD</option>
<option value="TN">Tunisie · TND</option>
<option value="RW">Rwanda · RWF</option>
<option value="GH">Ghana · GHS</option>
<option value="NG">Nigeria · NGN</option>
<option value="KE">Kenya · KES</option>
<option value="ZA">Afrique du Sud · ZAR</option>
<option value="EG">Égypte · EGP</option>
<option value="ET">Éthiopie · ETB</option>
<option value="TZ">Tanzanie · TZS</option>
<option value="UG">Ouganda · UGX</option>
<option value="AO">Angola · AOA</option>
<option value="ZM">Zambie · ZMW</option>
<option value="ZW">Zimbabwe · USD</option>`.trim();

function field(name, label, options = {}) {
  const id = `pf-${name}`;
  const type = options.type || 'number';
  const attrs = [
    `type="${type}"`,
    `id="${id}"`,
    `name="${name}"`,
    options.value !== undefined ? `value="${options.value}"` : '',
    options.min !== undefined ? `min="${options.min}"` : '',
    options.max !== undefined ? `max="${options.max}"` : '',
    options.step !== undefined ? `step="${options.step}"` : '',
    options.required ? 'required' : '',
    type === 'number' ? `inputmode="${options.inputmode || 'decimal'}"` : '',
    options.describedBy ? `aria-describedby="${options.describedBy}"` : ''
  ].filter(Boolean).join(' ');
  return `<div class="pf-field${options.wide ? ' pf-field--wide' : ''}">
<label for="${id}">${label}</label>
<input ${attrs}>
${options.help ? `<small id="${options.describedBy || `${id}-help`}">${options.help}</small>` : ''}
</div>`;
}

function select(name, label, options, help = '') {
  const id = `pf-${name}`;
  return `<div class="pf-field">
<label for="${id}">${label}</label>
<select id="${id}" name="${name}">${options}</select>
${help ? `<small>${help}</small>` : ''}
</div>`;
}

const pages = [
  {
    app: 'budget-50-30-20',
    englishId: '50-30-20-budget',
    swRoute: '/sw/zana/bajeti-50-30-20/',
    route: '/fr/tools/budget-50-30-20/',
    file: 'fr/tools/budget-50-30-20/index.html',
    title: 'Calculateur budget 50/30/20 en monnaie africaine | AfroTools',
    description: 'Répartissez un revenu net entre besoins, envies et épargne avec la règle 50/30/20, comparez vos montants et exportez un plan privé en français.',
    h1: 'Répartir un revenu avec le budget 50/30/20',
    eyebrow: 'Budget personnel · formule déterministe',
    intro: 'Saisissez votre revenu net et vos montants actuels. Le calcul applique exactement 50 % aux besoins, 30 % aux envies et 20 % à l’épargne ou aux remboursements supplémentaires, sans convertir la devise.',
    image: '50-30-20-budget.webp',
    imageAlt: 'Trois blocs représentant les besoins, les envies et l’épargne dans un budget 50/30/20',
    formTitle: 'Comparer votre répartition',
    formIntro: 'Les montants restent sur cet appareil. Les catégories sont des repères ajustables, pas une obligation financière.',
    form: `${select('country', 'Pays et devise d’affichage', countryOptions, 'Le pays change uniquement le symbole et le code. Aucun taux de change n’est appliqué.')}
${field('income', 'Revenu net mensuel', { min: 0, step: 'any', required: true })}
${field('currentNeeds', 'Dépenses actuelles pour les besoins', { min: 0, step: 'any', value: 0, help: 'Logement essentiel, alimentation, services de base, transport nécessaire et paiements minimums.' })}
${field('currentWants', 'Dépenses actuelles pour les envies', { min: 0, step: 'any', value: 0, help: 'Loisirs, sorties, abonnements et dépenses reportables.' })}
${field('currentSavings', 'Épargne et dette supplémentaire', { min: 0, step: 'any', value: 0, help: 'Épargne de précaution, objectifs, investissement et remboursements au-delà du minimum.' })}`,
    method: 'Le moteur calcule revenu × 0,50, revenu × 0,30 et revenu × 0,20. Les écarts comparent ensuite chaque montant saisi à son repère. La formule ne connaît ni votre coût de la vie, ni vos obligations, ni vos priorités.',
    sourceName: 'Guide budgétaire du Consumer Financial Protection Bureau (CFPB)',
    sourceUrl: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/analyzing-budgets/',
    confidence: 'Élevée pour l’arithmétique; faible pour l’adéquation de la règle à un foyer précis.',
    faqs: [
      ['La règle 50/30/20 est-elle obligatoire ?', 'Non. C’est un repère de planification. Un coût élevé du logement, des soins, du transport ou des obligations familiales peut exiger une autre répartition.'],
      ['Le choix du pays convertit-il les montants ?', 'Non. Il change uniquement la devise affichée. Tous les montants doivent déjà être saisis dans cette même devise.'],
      ['Les remboursements de dette vont-ils dans l’épargne ?', 'Le paiement minimum est généralement un besoin; un remboursement supplémentaire peut être suivi dans le bloc de 20 % avec l’épargne. Adaptez ce classement à votre plan.']
    ]
  },
  {
    app: 'budget-album-ep',
    englishId: 'album-budget',
    swRoute: '/sw/zana/bajeti-ya-albamu/',
    route: '/fr/tools/budget-album-ep/',
    file: 'fr/tools/budget-album-ep/index.html',
    title: 'Budget album, EP ou single en Afrique | AfroTools',
    description: 'Planifiez en français les coûts d’enregistrement, mixage, mastering, visuels, distribution et promotion d’un album, EP ou single, avec réserves et seuil indicatif.',
    h1: 'Construire le budget d’un album, EP ou single',
    eyebrow: 'Musique · budget de sortie local',
    intro: 'Additionnez vos propres devis de production, visuels et promotion. Comparez le plan saisi avec des réserves de 10 % et 20 %, puis estimez un seuil de streams uniquement avec votre recette nette observée.',
    image: 'album-budget.webp',
    imageAlt: 'Studio de musique représentant la préparation du budget d’un album ou EP',
    formTitle: 'Chiffrer la sortie musicale',
    formIntro: 'Remplacez les exemples par des devis réels dans une seule devise. Le pays ne fournit ni prix de marché ni conversion.',
    form: `${select('country', 'Pays et devise d’affichage', countryOptions, 'Aucune conversion automatique.')}
${select('projectType', 'Type de projet', '<option value="single">Single</option><option value="ep" selected>EP</option><option value="album">Album</option>')}
${field('tracks', 'Nombre de titres', { min: 1, max: 20, step: 1, value: 5, required: true, inputmode: 'numeric' })}
${field('studioRate', 'Tarif studio par heure', { min: 0, step: 'any', value: 15000 })}
${field('hoursPerTrack', 'Heures d’enregistrement par titre', { min: 0, step: 'any', value: 4, required: true })}
${field('beatCost', 'Beats et instrumentaux · total', { min: 0, step: 'any', value: 50000 })}
${field('mixCost', 'Mixage · par titre', { min: 0, step: 'any', value: 10000 })}
${field('masterCost', 'Mastering · projet total', { min: 0, step: 'any', value: 30000 })}
${field('coverArt', 'Pochette', { min: 0, step: 'any', value: 25000 })}
${field('photoShoot', 'Photos promotionnelles', { min: 0, step: 'any', value: 30000 })}
${field('musicVideo', 'Clip musical', { min: 0, step: 'any', value: 0 })}
${field('distroCost', 'Distribution · total', { min: 0, step: 'any', value: 0 })}
${field('playlistBudget', 'Promotion playlists', { min: 0, step: 'any', value: 15000 })}
${field('adsBudget', 'Publicité sur les réseaux', { min: 0, step: 'any', value: 50000 })}
${field('prBudget', 'Relations presse', { min: 0, step: 'any', value: 20000 })}
${field('netPerStream', 'Votre recette nette estimée par stream', { min: 0, step: 'any', value: 0, wide: true, help: 'Facultatif. Utilisez un montant effectif issu de vos propres relevés après distributeur, label et autres déductions.' })}`,
    method: 'Enregistrement = tarif horaire × heures par titre × nombre de titres. Mixage = coût par titre × nombre de titres. Le total additionne production audio, visuels, distribution et promotion. Les réserves sont exactement 10 % et 20 % du total saisi.',
    sourceName: 'Explication des royalties artistes de Spotify',
    sourceUrl: 'https://support.spotify.com/my-en/artists/article/understanding-spotify-royalties/',
    confidence: 'Élevée pour les additions; faible pour les coûts futurs et le seuil si la recette nette par stream n’est pas issue de vos relevés.',
    faqs: [
      ['Spotify paie-t-il un montant fixe par stream ?', 'Non. Le service explique que les paiements ne reposent pas sur un tarif fixe par stream. Utilisez seulement une recette nette effective issue de vos relevés pour le scénario.'],
      ['Le pays fournit-il des tarifs locaux ?', 'Non. Le pays change uniquement la devise affichée. Remplacez chaque exemple par un devis dans cette devise.'],
      ['Les taxes et droits sont-ils inclus ?', 'Seulement si vous les ajoutez dans un poste existant. Vérifiez séparément fiscalité, licences, édition, samples, contrats, syndicats et obligations de diffusion.']
    ]
  },
  {
    app: 'budget-film',
    englishId: 'film-budget',
    swRoute: '/sw/zana/bajeti-ya-filamu/',
    route: '/fr/tools/budget-film/',
    file: 'fr/tools/budget-film/index.html',
    title: 'Répartition du budget d’un film en Afrique | AfroTools',
    description: 'Répartissez un budget film entre création, production, postproduction, marketing et livraison, puis calculez coût par jour, réserve et écart de financement.',
    h1: 'Répartir et sécuriser un budget de film',
    eyebrow: 'Cinéma · allocation et financement',
    intro: 'Ventilez un budget total entre quatre départements qui doivent représenter exactement 100 %. Le résultat calcule le coût moyen par jour, la réserve choisie et l’écart avec le financement confirmé.',
    image: 'film-budget.webp',
    imageAlt: 'Plateau de tournage représentant la répartition d’un budget de film',
    formTitle: 'Définir l’allocation',
    formIntro: 'Saisissez une seule devise et ne comptez comme financement confirmé que les montants étayés par un accord ou une preuve que vous jugez fiable.',
    form: `${select('country', 'Pays et devise d’affichage', countryOptions, 'Aucune conversion automatique.')}
${select('productionType', 'Type de production', '<option value="short">Court métrage</option><option value="feature" selected>Long métrage</option><option value="series">Série TV</option><option value="web">Web-série</option>')}
${field('totalBudget', 'Budget total', { min: 1, step: 'any', value: 20000000, required: true })}
${field('shootDays', 'Jours de tournage', { min: 1, step: 1, value: 10, required: true, inputmode: 'numeric' })}
${field('cashSecured', 'Financement confirmé', { min: 0, step: 'any', value: 0 })}
${field('contingencyPct', 'Réserve', { min: 0, max: 100, step: 'any', value: 10, help: 'Pourcentage ajouté au budget de base.' })}
${field('aboveLinePct', 'Au-dessus de la ligne', { min: 0, max: 100, step: 'any', value: 30 })}
${field('productionPct', 'Production physique', { min: 0, max: 100, step: 'any', value: 45 })}
${field('postPct', 'Postproduction', { min: 0, max: 100, step: 'any', value: 15 })}
${field('marketingPct', 'Marketing et livraison', { min: 0, max: 100, step: 'any', value: 10 })}`,
    method: 'Chaque allocation = budget total × pourcentage saisi. Les quatre pourcentages doivent totaliser 100 %. Le budget avec réserve = budget total + budget total × taux de réserve. L’écart soustrait le financement confirmé.',
    sourceName: 'Modèles officiels de budget et plan de financement de Screen Australia',
    sourceUrl: 'https://www.screenaustralia.gov.au/resource_subject/budget-template/',
    confidence: 'Élevée pour la répartition mathématique; faible pour la suffisance des postes sans devis, contrats, droits et plan de production détaillé.',
    faqs: [
      ['Les allocations doivent-elles totaliser 100 % ?', 'Oui. Le calcul est bloqué tant que les quatre départements ne totalisent pas exactement 100 %.'],
      ['Qu’est-ce qu’un financement confirmé ?', 'Utilisez uniquement un montant appuyé par un accord signé ou une autre preuve fiable. N’incluez pas des subventions, ventes, sponsors ou accords de plateforme seulement espérés.'],
      ['Le résultat calcule-t-il le retour sur investissement ?', 'Non. Il ne connaît ni recettes, ni frais de distribution, ni ordre de recoupement, ni fiscalité, ni conditions des investisseurs.']
    ]
  },
  {
    app: 'fonds-urgence-securite',
    englishId: 'security-emergency-fund',
    swRoute: '/sw/zana/mfuko-wa-dharura-wa-usalama/',
    route: '/fr/tools/fonds-d-urgence-et-de-securite/',
    file: 'fr/tools/fonds-d-urgence-et-de-securite/index.html',
    title: 'Calculateur de fonds d’urgence et de sécurité | AfroTools',
    description: 'Calculez un objectif de fonds d’urgence depuis vos dépenses essentielles, mois de couverture, coûts ponctuels, épargne actuelle et contribution mensuelle.',
    h1: 'Fixer un objectif de fonds d’urgence',
    eyebrow: 'Sécurité financière · objectif local',
    intro: 'Choisissez le nombre de mois d’essentiels à couvrir, ajoutez des coûts ponctuels réalistes, puis soustrayez l’épargne déjà disponible. Le délai dépend uniquement de votre contribution mensuelle saisie.',
    image: 'security-emergency-fund.webp',
    imageAlt: 'Bouclier et réserve représentant un fonds d’urgence financier',
    formTitle: 'Construire votre objectif',
    formIntro: 'Le calcul ne recommande ni banque, ni produit, ni nombre universel de mois. Adaptez le plan aux risques, personnes à charge et délais d’accès de votre situation.',
    form: `${select('country', 'Pays et devise d’affichage', countryOptions, 'Aucune conversion automatique.')}
${field('monthlyExpenses', 'Dépenses essentielles mensuelles', { min: 0, step: 'any', required: true, help: 'Logement de base, alimentation, services essentiels, transport nécessaire, soins indispensables et paiements minimums.' })}
${field('targetMonths', 'Mois d’essentiels à couvrir', { min: 1, max: 24, step: 1, value: 3, required: true, inputmode: 'numeric' })}
${field('oneOffCosts', 'Coûts d’urgence ponctuels', { min: 0, step: 'any', value: 0, help: 'Par exemple voyage urgent, hébergement temporaire, franchise, réparation ou soins non couverts.' })}
${field('currentSavings', 'Épargne d’urgence actuelle', { min: 0, step: 'any', value: 0 })}
${field('monthlyContribution', 'Contribution mensuelle prévue', { min: 0, step: 'any', value: 0 })}`,
    method: 'Objectif = dépenses essentielles mensuelles × mois choisis + coûts ponctuels. Reste à constituer = maximum de zéro et objectif moins épargne actuelle. Délai = plafond du reste divisé par la contribution mensuelle.',
    sourceName: 'Guide du fonds d’urgence du Consumer Financial Protection Bureau (CFPB)',
    sourceUrl: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/',
    confidence: 'Élevée pour l’arithmétique; faible pour le bon niveau de couverture, qui dépend des risques et de l’accès réel aux fonds.',
    faqs: [
      ['Que mettre dans les dépenses essentielles ?', 'Utilisez les coûts impossibles à éviter à court terme : logement de base, alimentation, services essentiels, transport nécessaire, soins indispensables, soutien requis et paiements minimums.'],
      ['Que mettre dans les coûts ponctuels ?', 'Utilisez des montants réalistes pour les urgences que vous préparez, sans compter deux fois la même dépense.'],
      ['Où conserver le fonds ?', 'L’outil ne recommande aucun fournisseur. Comparez délai d’accès, limites de retrait, frais, risque de devise, protection du compte et risque de défaillance dans votre pays.']
    ]
  },
  {
    app: 'classement-activites',
    englishId: 'side-hustle-ranker',
    swRoute: '/sw/zana/orodha-ya-side-hustle/',
    route: '/fr/tools/classement-d-activites-complementaires/',
    file: 'fr/tools/classement-d-activites-complementaires/index.html',
    title: 'Classement d’activités complémentaires en Afrique | AfroTools',
    description: 'Classez 15 idées d’activité complémentaire selon vos compétences, votre temps hebdomadaire et une tranche de capital, sans promesse de revenu.',
    h1: 'Classer des activités complémentaires à tester',
    eyebrow: 'Revenu complémentaire · score transparent',
    intro: 'Sélectionnez vos compétences, votre temps et une tranche de capital. Le score attribue 60 points à une compétence correspondante, 20 au capital et 20 au temps. Il ne prévoit ni demande, ni revenu, ni bénéfice.',
    image: 'side-hustle-ranker.webp',
    imageAlt: 'Plusieurs pistes de travail représentant un classement d’activités complémentaires',
    formTitle: 'Définir vos contraintes',
    formIntro: 'Le résultat sert à choisir de petits tests payants. Vérifiez demande, prix, coûts, fiscalité, licences, assurance, sécurité, données et contrat de travail avant de dépenser.',
    form: `${select('hours', 'Temps disponible par semaine', '<option value="5">Jusqu’à 5 heures</option><option value="10" selected>5 à 10 heures</option><option value="20">10 à 20 heures</option><option value="40">20 heures ou plus (presque à temps plein)</option>')}
${select('capital', 'Tranche de capital de départ', '<option value="0">Aucun nouveau capital</option><option value="1">Faible</option><option value="2" selected>Moyenne</option><option value="3">Élevée</option>', 'Les tranches sont relatives et ne représentent aucun montant ou prix local.')}
<fieldset class="pf-checks pf-field--wide"><legend class="pf-legend">Compétences déjà mobilisables</legend>
<label><input type="checkbox" name="skills" value="writing"> Rédaction</label>
<label><input type="checkbox" name="skills" value="design"> Design et graphisme</label>
<label><input type="checkbox" name="skills" value="tech"> Tech et code</label>
<label><input type="checkbox" name="skills" value="social"> Réseaux sociaux</label>
<label><input type="checkbox" name="skills" value="teaching"> Enseignement</label>
<label><input type="checkbox" name="skills" value="sales"> Vente et marketing</label>
<label><input type="checkbox" name="skills" value="cooking"> Cuisine et pâtisserie</label>
<label><input type="checkbox" name="skills" value="tailoring"> Couture et mode</label>
<label><input type="checkbox" name="skills" value="driving"> Conduite</label>
<label><input type="checkbox" name="skills" value="photography"> Photo et vidéo</label>
<label><input type="checkbox" name="skills" value="finance"> Finance et comptabilité</label>
<label><input type="checkbox" name="skills" value="beauty"> Beauté et coiffure</label>
<label><input type="checkbox" name="skills" value="repair"> Réparation technique</label>
<label><input type="checkbox" name="skills" value="farming"> Agriculture</label>
</fieldset>`,
    method: 'Compétence correspondante : 60 points. Sans compétence sélectionnée : 20 points exploratoires. Capital suffisant : jusqu’à 20 points. Temps suffisant : jusqu’à 20 points. Les égalités gardent l’ordre stable du propriétaire anglais.',
    sourceName: 'Méthode déterministe AfroTools, propriétaire anglais gelé',
    sourceUrl: 'https://afrotools.com/tools/side-hustle-ranker/',
    confidence: 'Élevée pour la reproduction du score; faible pour la rentabilité réelle, car aucune donnée de demande, prix ou réussite n’est utilisée.',
    faqs: [
      ['Le meilleur score signifie-t-il le meilleur bénéfice ?', 'Non. Il indique seulement qu’une idée correspond davantage aux tranches de compétence, temps et capital sélectionnées. Le bénéfice dépend de la demande, du prix, des coûts, de l’exécution et des risques.'],
      ['Pourquoi aucun revenu estimé ?', 'Des fourchettes non sourcées deviennent vite obsolètes et masquent les différences de prix, heures, coûts et expérience. Construisez plutôt un petit test avec de vrais acheteurs et devis.'],
      ['Que tester en premier ?', 'Définissez une offre payante étroite, interrogez plusieurs acheteurs adaptés, notez les objections, chiffrez tous les coûts et arrêtez ou ajustez si les preuves sont insuffisantes.']
    ]
  }
];

function schemaFor(page) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: page.h1,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      inLanguage: 'fr',
      url: `https://afrotools.com${page.route}`,
      image: `https://afrotools.com/assets/img/tools/${page.image}`,
      isBasedOn: `https://afrotools.com/tools/${page.englishId}/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'XOF' },
      featureList: ['Calcul déterministe local', 'Brouillon local', 'Export TXT', 'Export JSON réouvrable', 'Impression ou PDF']
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://afrotools.com/fr/' },
        { '@type': 'ListItem', position: 2, name: 'Finances personnelles', item: 'https://afrotools.com/fr/personal-finance/' },
        { '@type': 'ListItem', position: 3, name: page.h1, item: `https://afrotools.com${page.route}` }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'fr',
      mainEntity: page.faqs.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    }
  ];
}

function relatedCards(current) {
  return pages.filter((page) => page.app !== current).slice(0, 4).map((page) => `
<article class="pf-tool-card">
<img src="/assets/img/tools/${page.image}" alt="${page.imageAlt}" width="640" height="360" loading="lazy">
<h2>${page.h1}</h2>
<p>${page.description}</p>
<a href="${page.route}">Ouvrir l’application<span class="pf-visually-hidden"> : ${page.h1}</span></a>
</article>`).join('');
}

function renderPage(page) {
  const schemas = schemaFor(page).map((schema) => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`).join('\n');
  const faq = page.faqs.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('\n');
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
<meta name="robots" content="index,follow">
<meta name="content-language" content="fr">
<link rel="canonical" href="https://afrotools.com${page.route}">
<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/${page.englishId}/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com${page.route}">
${page.swRoute ? `<link rel="alternate" hreflang="sw" href="https://afrotools.com${page.swRoute}">` : ''}
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/${page.englishId}/">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="https://afrotools.com${page.route}">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/${page.image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${page.title}">
<meta name="twitter:description" content="${page.description}">
<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${page.image}">
<meta property="article:modified_time" content="${ISO_DATE}">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.min.css">
<link rel="stylesheet" href="/assets/css/fr-personal-finance.css">
<script>(function(){try{var t=localStorage.getItem('aft_theme');var c=t==='dark'||t==='light'?t:'auto';var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.themeChoice=c;document.documentElement.dataset.theme=c==='auto'?(d?'dark':'light'):c;document.documentElement.style.colorScheme=document.documentElement.dataset.theme;}catch(_){}})();</script>
${schemas}
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/pages/fr-personal-finance.js" defer></script>
</head>
<body>
<a class="pf-skip" href="#main">Aller au calculateur</a>
<afro-navbar></afro-navbar>
<header class="pf-shell">
<div class="pf-topbar">
<nav class="pf-breadcrumbs" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a><span aria-hidden="true">/</span><a href="/fr/personal-finance/">Finances personnelles</a><span aria-hidden="true">/</span><span aria-current="page">${page.h1}</span></nav>
<button class="pf-theme-button" type="button" data-theme-toggle>Thème : auto</button>
</div>
<div class="pf-hero">
<div>
<span class="pf-eyebrow">${page.eyebrow}</span>
<h1>${page.h1}</h1>
<p>${page.intro}</p>
<div class="pf-trust-row" aria-label="Garanties de fonctionnement"><span>Calcul local</span><span>Aucun compte</span><span>Aucune conversion</span><span>Exports privés</span></div>
</div>
<img class="pf-hero-art" src="/assets/img/tools/${page.image}" alt="${page.imageAlt}" width="640" height="420">
</div>
</header>
<main id="main" class="pf-shell">
<div class="pf-workspace">
<section class="pf-panel" aria-labelledby="form-title">
<div class="pf-panel__inner">
<h2 id="form-title">${page.formTitle}</h2>
<p class="pf-panel-intro">${page.formIntro}</p>
<form data-personal-finance-form data-app="${page.app}" novalidate>
<div class="pf-form-grid">${page.form}</div>
<div class="pf-form-actions">
<button class="pf-button pf-button--primary" type="submit">Calculer localement</button>
<button class="pf-button" type="button" data-action="save">Enregistrer le brouillon</button>
<button class="pf-button" type="button" data-action="restore">Rouvrir le brouillon</button>
<button class="pf-button" type="button" data-action="import">Importer JSON</button>
<button class="pf-button" type="button" data-action="reset">Réinitialiser</button>
</div>
<input class="pf-visually-hidden" type="file" accept="application/json,.json" data-import aria-label="Importer une sauvegarde JSON">
<p class="pf-status" data-status role="status" aria-live="polite">Prêt pour un calcul local.</p>
</form>
</div>
</section>
<section class="pf-panel" aria-labelledby="result-title">
<div class="pf-panel__inner">
<h2 id="result-title">Résultat de planification</h2>
<div class="pf-result" data-result hidden aria-live="polite"></div>
<div class="pf-export-actions" aria-label="Exporter ou rouvrir le résultat">
<button class="pf-button" type="button" data-action="copy">Copier le résumé</button>
<button class="pf-button" type="button" data-action="txt">Télécharger TXT</button>
<button class="pf-button" type="button" data-action="json">Télécharger JSON réouvrable</button>
<button class="pf-button" type="button" data-action="print">Imprimer ou enregistrer en PDF</button>
</div>
</div>
</section>
</div>
<section class="pf-content-grid" aria-label="Méthode, limites et confidentialité">
<article class="pf-content-card"><h2>Méthode déterministe</h2><p>${page.method}</p><p><strong>Confiance :</strong> ${page.confidence}</p></article>
<article class="pf-content-card"><h2>Source et fraîcheur</h2><p><a href="${page.sourceUrl}" target="_blank" rel="noopener noreferrer">${page.sourceName}</a>.</p><p>Source ou méthode vérifiée le ${REVIEW_DATE}. Les montants, prix, règles et conditions réels peuvent évoluer; vérifiez les devis et sources applicables avant toute décision.</p></article>
<article class="pf-content-card"><h2>Vie privée et limite IA</h2><p>Les montants et choix restent dans ce navigateur. Aucun script d’analytique, appel d’IA, requête API ou envoi réseau ne reçoit vos entrées.</p><p>AfroTools AI peut seulement orienter vers cette route; il ne préremplit pas le formulaire. Le calcul, la sauvegarde locale et les exports restent disponibles sans IA ni consentement réseau.</p></article>
</section>
<section class="pf-card-grid" aria-labelledby="related-title"><h2 id="related-title" class="pf-field--wide">Continuer en français</h2>${relatedCards(page.app)}</section>
<section class="pf-faq" aria-labelledby="faq-title"><h2 id="faq-title">Questions fréquentes</h2>${faq}</section>
</main>
<p class="pf-footer-note">Estimation de planification fondée uniquement sur vos entrées. Ni conseil financier, ni devis, ni garantie de résultat.</p>
</body>
</html>
`;
}

function renderHub() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    inLanguage: 'fr',
    name: 'Finances personnelles en français',
    url: 'https://afrotools.com/fr/personal-finance/',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 5,
      itemListElement: pages.map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: page.h1,
        url: `https://afrotools.com${page.route}`
      }))
    }
  };
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Applications de finances personnelles en français | AfroTools</title>
<meta name="description" content="Cinq applications françaises de finances personnelles : budget 50/30/20, budget album, budget film, fonds d’urgence et classement d’activités complémentaires.">
<meta name="robots" content="index,follow">
<meta name="content-language" content="fr">
<link rel="canonical" href="https://afrotools.com/fr/personal-finance/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/personal-finance/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/personal-finance/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/personal-finance/">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta property="og:title" content="Applications de finances personnelles en français | AfroTools">
<meta property="og:description" content="Cinq workflows locaux pour répartir un revenu, chiffrer un projet créatif, préparer une réserve et tester une activité complémentaire.">
<meta property="og:url" content="https://afrotools.com/fr/personal-finance/">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/50-30-20-budget.webp">
<meta name="twitter:card" content="summary_large_image">
<meta property="article:modified_time" content="${ISO_DATE}">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.min.css">
<link rel="stylesheet" href="/assets/css/fr-personal-finance.css">
<script>(function(){try{var t=localStorage.getItem('aft_theme');var c=t==='dark'||t==='light'?t:'auto';var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.themeChoice=c;document.documentElement.dataset.theme=c==='auto'?(d?'dark':'light'):c;document.documentElement.style.colorScheme=document.documentElement.dataset.theme;}catch(_){}})();</script>
<script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, '\\u003c')}</script>
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/pages/fr-personal-finance.js" defer></script>
</head>
<body>
<a class="pf-skip" href="#main">Aller aux applications</a>
<afro-navbar></afro-navbar>
<header class="pf-shell">
<div class="pf-topbar"><nav class="pf-breadcrumbs" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Finances personnelles</span></nav><button class="pf-theme-button" type="button" data-theme-toggle>Thème : auto</button></div>
<div class="pf-hero">
<div><span class="pf-eyebrow">5 applications françaises · 5 workflows natifs</span><h1>Des décisions d’argent plus claires, sans envoyer vos montants</h1><p>Répartissez un revenu, chiffrez un album ou un film, préparez un fonds d’urgence et classez des activités complémentaires. Chaque application calcule localement, explique sa formule et exporte un dossier réouvrable.</p><div class="pf-trust-row"><span>5/5 workflows natifs</span><span>Devise locale sans conversion</span><span>Exports TXT, JSON et PDF</span><span>Alternative locale à l’IA</span></div></div>
<img class="pf-hero-art" src="/assets/img/tools/50-30-20-budget.webp" alt="Répartition visuelle d’un budget personnel" width="640" height="420">
</div>
</header>
<main id="main" class="pf-shell">
<section class="pf-card-grid" aria-labelledby="apps-title"><h2 id="apps-title" class="pf-field--wide">Choisir votre prochain travail</h2>${pages.map((page) => `
<article class="pf-tool-card"><img src="/assets/img/tools/${page.image}" alt="${page.imageAlt}" width="640" height="360" loading="lazy"><p class="pf-eyebrow">${page.eyebrow}</p><h2>${page.h1}</h2><p>${page.description}</p><a href="${page.route}">Ouvrir l’application<span class="pf-visually-hidden"> : ${page.h1}</span></a></article>`).join('')}</section>
<section class="pf-content-grid" aria-label="Contrat de la catégorie">
<article class="pf-content-card"><h2>Calculs gelés et transparents</h2><p>Les cinq propriétaires anglais restent inchangés. Les applications françaises reproduisent leurs formules déterministes et bloquent les valeurs invalides avant d’afficher un résultat.</p></article>
<article class="pf-content-card"><h2>Monnaie correctement étiquetée</h2><p>Le pays choisit un code et un symbole de devise. Il ne déclenche aucun taux de change, prix local, taux de marché ou recommandation de fournisseur.</p></article>
<article class="pf-content-card"><h2>Vie privée et IA</h2><p>Aucun montant n’est envoyé à l’analytique, à une API ou à une IA. Le routage IA peut ouvrir une application française, mais ne préremplit pas les données financières. Le workflow local reste complet.</p></article>
</section>
<section class="pf-faq" aria-labelledby="hub-faq"><h2 id="hub-faq">Avant de commencer</h2><details><summary>Ces résultats sont-ils des conseils financiers ?</summary><p>Non. Ce sont des estimations de planification fondées uniquement sur les entrées et formules affichées.</p></details><details><summary>Les fichiers exportés quittent-ils l’appareil ?</summary><p>Non. TXT, JSON et impression ou PDF sont préparés dans le navigateur après une action explicite.</p></details><details><summary>Une IA lit-elle les montants ?</summary><p>Non. Ces pages n’appellent aucune IA et le contrat de routage ne permet pas le préremplissage des entrées financières.</p></details></section>
</main>
<p class="pf-footer-note">Cinq applications canoniques de finances personnelles, en français natif et local par défaut.</p>
</body>
</html>
`;
}

const outputs = new Map([
  ['fr/personal-finance/index.html', renderHub()],
  ...pages.map((page) => [page.file, renderPage(page)])
]);

function sourceOwnedMarkers(content) {
  const patterns = [
    /<link rel="canonical"[^>]*>/,
    /<meta property="og:url"[^>]*>/,
    /<form data-personal-finance-form data-app="[^"]+"/,
    /<h1>[^<]+<\/h1>/
  ];
  return patterns.map((pattern) => content.match(pattern)?.[0]).filter(Boolean);
}

function formFieldNames(content) {
  const form = content.match(/<form\b[^>]*data-personal-finance-form[\s\S]*?<\/form>/i)?.[0] || '';
  return [...form.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]).sort();
}

function sourceOwnedOutputIsCurrent(current, expected) {
  if (!sourceOwnedMarkers(expected).every((marker) => current.includes(marker))) return false;
  if (JSON.stringify(formFieldNames(current)) !== JSON.stringify(formFieldNames(expected))) return false;
  const routes = [...expected.matchAll(/href="(\/fr\/tools\/[^"]+\/)"/g)].map((match) => match[1]);
  return routes.every((route) => current.includes(`href="${route}"`));
}

let stale = false;
for (const [relativePath, content] of outputs) {
  const filePath = path.join(ROOT, relativePath);
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (normalizeBuildManagedHtml(current) === normalizeBuildManagedHtml(content)) continue;
  if (CHECK) {
    if (!sourceOwnedOutputIsCurrent(current, content)) {
      stale = true;
      console.error(`Stale French Personal Finance output: ${relativePath}`);
    }
    continue;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Wrote ${relativePath}`);
}

if (stale) process.exitCode = 1;
else console.log(`French Personal Finance parity: ${pages.length}/${pages.length} canonical apps plus hub.`);

module.exports = { pages, renderPage, renderHub };
