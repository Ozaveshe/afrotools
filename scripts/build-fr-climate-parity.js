'use strict';
const fs = require('fs');
const path = require('path');
const { analyticsVersion, canonicalLoaderTag } = require('./inject-analytics-loader');
const ROOT = path.resolve(__dirname, '..');
const ANALYTICS_LOADER = canonicalLoaderTag(analyticsVersion());

const tools = [
  ['drought-risk', 'risque-secheresse', 'Évaluation du risque de sécheresse', 'Estimez un risque agricole à partir de la pluie, de la culture, du sol et de l’accès à l’irrigation.'],
  ['water-scarcity', 'penurie-eau', 'Calculateur de pénurie d’eau', 'Estimez demande, interruptions, autonomie de stockage et réduction par réutilisation.'],
  ['rainfall-tracker', 'suivi-pluviometrie', 'Suivi des pluies et besoins agricoles', 'Comparez pluie reçue et pluie attendue pour préparer irrigation, drainage et calendrier agricole.'],
  ['carbon-credit', 'revenus-credits-carbone', 'Calculateur de revenus des crédits carbone', 'Testez taille, période, prix, réserve et coût de validation avant une étude carbone formelle.'],
  ['flood-risk', 'risque-inondation', 'Évaluation du risque d’inondation', 'Évaluez exposition du site, drainage, bâtiment et perte annuelle indicative.'],
  ['air-quality', 'indice-qualite-air', 'Estimateur de qualité de l’air', 'Estimez AQI, PM2.5 et exposition personnelle, puis confirmez avec un moniteur actuel.'],
  ['deforestation', 'impact-deforestation', 'Estimateur d’impact de la déforestation', 'Estimez émissions, puits futur perdu et budget de restauration avant une conversion de terrain.'],
  ['waste-management', 'cout-gestion-dechets', 'Calculateur de coût de gestion des déchets', 'Estimez collecte, potentiel de détournement, valeur récupérable et besoins de tri.'],
  ['recycling-revenue', 'revenus-recyclage', 'Calculateur de revenus du recyclage', 'Estimez revenus, contamination, transport et qualité d’un mélange de matières.'],
  ['charcoal-vs-clean', 'charbon-vs-cuisson-propre', 'Charbon ou cuisson propre', 'Comparez coût, équipement, fumée et réduction carbone sur plusieurs années.'],
  ['ewaste-value', 'valeur-dechets-electroniques', 'Valeur de collecte des déchets électroniques', 'Estimez reprise, masse, danger et priorité d’effacement avant une remise au collecteur.'],
  ['tree-planting-roi', 'roi-plantation-arbres', 'ROI d’une plantation d’arbres', 'Projetez survie, entretien, carbone, produits et valeur nette sur vingt-cinq ans.'],
  ['sustainability-scorecard', 'score-durabilite-entreprise', 'Score de durabilité de l’entreprise', 'Évaluez énergie, déchets, eau, fournisseurs, sécurité et preuves documentaires.']
].map(([id, slug, title, description]) => ({ id, slug, title, description }));

const text = {
  'Country preset': 'Pays du scénario', 'Crop or enterprise': 'Culture ou activité',
  'Season stage': 'Phase de saison', 'Rainfall anomaly': 'Anomalie pluviométrique (%)',
  'Irrigation access': 'Accès à l’irrigation', 'Soil condition': 'État du sol',
  'Area exposed': 'Surface exposée (ha)', 'Crop value per ha': 'Valeur de la culture par ha (USD)',
  'Use case': 'Type d’usage', 'People or user units': 'Personnes ou unités utilisatrices',
  'Daily demand per user': 'Demande quotidienne par utilisateur (litres)',
  'Reliable supply days/week': 'Jours d’approvisionnement fiable par semaine',
  'Current storage': 'Stockage actuel (litres)', 'Reuse or saved demand': 'Demande réutilisée ou économisée (%)',
  'Month': 'Mois', 'Crop': 'Culture', 'Crop stage': 'Stade de la culture',
  'Rain received': 'Pluie reçue (mm)', 'Expected rain': 'Pluie attendue (mm)', 'Area': 'Surface (ha)',
  'Project type': 'Type de projet', 'Project size': 'Taille du projet (ha ou unités)',
  'Crediting years': 'Années de crédit', 'Standard pathway': 'Voie de certification',
  'Credit price override': 'Prix du crédit saisi (USD/t)', 'Buffer/reserve': 'Réserve tampon (%)',
  'Validation and setup cost': 'Coût de validation et démarrage (USD)',
  'Site type': 'Type de site', 'Distance to water': 'Distance à l’eau',
  'Elevation above water': 'Hauteur au-dessus de l’eau', 'Drainage condition': 'État du drainage',
  'Building material': 'Matériau du bâtiment', 'Property or stock value': 'Valeur du bien ou stock (USD)',
  'Insurance status': 'État de l’assurance', 'Location pattern': 'Type de zone',
  'Main pollution source': 'Source principale de pollution', 'Sensitive group': 'Groupe sensible',
  'Outdoor exposure': 'Exposition extérieure (heures)', 'Indoor cooking fuel': 'Combustible de cuisson intérieur',
  'Known PM2.5': 'PM2.5 connue (µg/m³, 0 = estimation)', 'Forest type': 'Type de forêt',
  'Area affected': 'Surface concernée (ha)', 'New land use': 'Nouvel usage du sol',
  'Soil disturbance': 'Perturbation du carbone du sol', 'Restoration route': 'Voie de restauration',
  'Waste per day': 'Déchets par jour (kg)', 'Organic share': 'Part organique (%)',
  'Dry recyclable share': 'Part recyclable sèche (%)', 'Separation system': 'Système de tri',
  'Pickups per month': 'Collectes par mois', 'Hazardous waste': 'Déchets dangereux',
  'Plastic': 'Plastique (kg/mois)', 'Aluminum cans': 'Canettes aluminium (kg/mois)',
  'Steel/metals': 'Acier et métaux (kg/mois)', 'Paper/cardboard': 'Papier et carton (kg/mois)',
  'Glass': 'Verre (kg/mois)', 'Organics/compostable': 'Organiques compostables (kg/mois)',
  'Contamination': 'Contamination (%)', 'Transport cost': 'Coût du transport (USD)',
  'Charcoal used weekly': 'Charbon utilisé par semaine (kg)', 'Clean option': 'Option propre',
  'New stove/setup cost': 'Coût du nouvel équipement (USD)', 'Kitchen ventilation': 'Aération de la cuisine',
  'Comparison period': 'Période de comparaison (années)', 'Device type': 'Type d’appareil',
  'Condition': 'État', 'Quantity': 'Quantité', 'Stored data risk': 'Risque lié aux données stockées',
  'Recycler route': 'Voie de collecte', 'Planting model': 'Modèle de plantation',
  'Trees planted': 'Arbres plantés', 'Expected survival': 'Survie attendue (%)',
  'Setup investment': 'Investissement initial (USD)', 'Annual maintenance/tree': 'Entretien annuel par arbre (USD)',
  'Carbon price': 'Prix carbone (USD/t)', 'Carbon route': 'Voie carbone',
  'Sector': 'Secteur', 'Renewable energy share': 'Part d’énergie renouvelable (%)',
  'Generator energy share': 'Part d’énergie des groupes électrogènes (%)',
  'Energy audit done': 'Audit énergétique réalisé', 'Waste recycled': 'Déchets recyclés (%)',
  'Separates waste': 'Tri des déchets', 'Hazardous waste plan': 'Plan déchets dangereux',
  'Water metered': 'Eau mesurée', 'Water reused/saved': 'Eau réutilisée ou économisée (%)',
  'Leak checks logged': 'Contrôles de fuite documentés', 'Local sourcing': 'Approvisionnement local (%)',
  'Supplier standards': 'Normes fournisseurs', 'PPE and safety controls': 'EPI et contrôles de sécurité',
  'Worker training logs': 'Formation des travailleurs documentée', 'Impact data documented': 'Données d’impact documentées',
  'Nigeria': 'Nigéria', 'South Africa': 'Afrique du Sud', 'Egypt': 'Égypte', 'Ethiopia': 'Éthiopie',
  'Tanzania': 'Tanzanie', 'Uganda': 'Ouganda', "Cote d'Ivoire": "Côte d’Ivoire",
  'Cameroon': 'Cameroun', 'Senegal': 'Sénégal', 'Morocco': 'Maroc', 'Tunisia': 'Tunisie',
  'Maize': 'Maïs', 'Rice': 'Riz', 'Cassava': 'Manioc', 'Cocoa': 'Cacao', 'Vegetables': 'Légumes',
  'Livestock': 'Élevage', 'Sorghum': 'Sorgho', 'Early rains': 'Premières pluies',
  'Main rainy season': 'Saison principale des pluies', 'Late season': 'Fin de saison',
  'Dry season': 'Saison sèche', 'None': 'Aucun', 'Partial': 'Partiel', 'Reliable': 'Fiable',
  'Loam or mixed': 'Limoneux ou mixte', 'Sandy': 'Sableux', 'Clay': 'Argileux',
  'Degraded/low organic matter': 'Dégradé ou pauvre en matière organique',
  'Household': 'Ménage', 'Business': 'Entreprise', 'School': 'École', 'Clinic': 'Clinique', 'Small farm': 'Petite ferme',
  'January': 'Janvier', 'February': 'Février', 'March': 'Mars', 'April': 'Avril', 'May': 'Mai',
  'June': 'Juin', 'July': 'Juillet', 'August': 'Août', 'September': 'Septembre',
  'October': 'Octobre', 'November': 'Novembre', 'December': 'Décembre',
  'Pasture': 'Pâturage', 'Planting/establishment': 'Semis ou installation', 'Vegetative': 'Végétatif',
  'Flowering/fruiting': 'Floraison ou fructification', 'Harvest': 'Récolte',
  'REDD+ avoided deforestation': 'REDD+ déforestation évitée', 'Reforestation': 'Reboisement',
  'Agroforestry': 'Agroforesterie', 'Soil carbon': 'Carbone du sol',
  'Mangrove restoration': 'Restauration de mangrove', 'Clean cookstove units': 'Foyers de cuisson propres',
  'Methane capture units': 'Unités de captage du méthane', 'Plan Vivo/community': 'Plan Vivo ou communautaire',
  'Domestic/buyer-led': 'National ou porté par un acheteur', 'Urban lowland': 'Bas-fond urbain',
  'Coastal/lagoon': 'Côtier ou lagunaire', 'Near river': 'Près d’une rivière',
  'Wetland/floodplain': 'Zone humide ou inondable', 'Upland': 'Hauteur',
  'Under 100 m': 'Moins de 100 m', '100-500 m': '100 à 500 m', '500 m-2 km': '500 m à 2 km',
  'Over 2 km': 'Plus de 2 km', 'Under 5 m': 'Moins de 5 m', '5-15 m': '5 à 15 m',
  '15-50 m': '15 à 50 m', 'Over 50 m': 'Plus de 50 m', 'Blocked drains': 'Caniveaux bouchés',
  'Poor': 'Mauvais', 'Average': 'Moyen', 'Good/maintained': 'Bon ou entretenu',
  'Mud/adobe': 'Terre ou adobe', 'Timber/lightweight': 'Bois ou léger', 'Block/concrete': 'Bloc ou béton',
  'Reinforced/raised': 'Renforcé ou surélevé', 'Basic': 'Basique', 'Full flood wording': 'Couverture inondation explicite',
  'City/capital average': 'Moyenne ville ou capitale', 'Industrial district': 'Zone industrielle',
  'Roadside/market corridor': 'Axe routier ou marché', 'Peri-urban': 'Périurbain', 'Rural/background': 'Rural ou fond',
  'Mixed urban': 'Urbain mixte', 'Traffic': 'Trafic', 'Diesel generators': 'Groupes diesel',
  'Open burning': 'Brûlage à ciel ouvert', 'Dust/harmattan': 'Poussière ou harmattan',
  'Cooking smoke': 'Fumée de cuisson', 'General adult': 'Adulte en général', 'Child': 'Enfant',
  'Older adult': 'Personne âgée', 'Asthma/respiratory': 'Asthme ou maladie respiratoire', 'Pregnancy': 'Grossesse',
  'Mostly clean/electric': 'Principalement propre ou électrique', 'Wood/biomass': 'Bois ou biomasse',
  'Kerosene': 'Kérosène', 'Tropical moist forest': 'Forêt tropicale humide',
  'Miombo/dry woodland': 'Miombo ou forêt sèche', 'Mangrove': 'Mangrove', 'Savanna woodland': 'Savane boisée',
  'Plantation': 'Plantation', 'Cropland': 'Terres cultivées', 'Mining/quarry': 'Mine ou carrière',
  'Urban/building': 'Urbain ou construction', 'Selective logging only': 'Exploitation sélective seulement',
  'Low': 'Faible', 'Medium': 'Moyen', 'High/peat or wet soil': 'Élevé, tourbe ou sol humide',
  'Natural regeneration': 'Régénération naturelle', 'Assisted regeneration': 'Régénération assistée',
  'Basic bags': 'Sacs simples', 'Color-coded bins': 'Bacs codés par couleur', 'Audited streams': 'Flux audités',
  'No': 'Non', 'Small amount': 'Petite quantité', 'Regular/high risk': 'Régulier ou risque élevé',
  'Electric/induction': 'Électrique ou induction', 'Poor/enclosed': 'Faible ou fermée', 'Good': 'Bonne',
  'Mostly outdoor': 'Principalement extérieur', 'Smartphones': 'Smartphones', 'Laptops': 'Ordinateurs portables',
  'Desktop/monitor': 'Ordinateur ou écran', 'TV/display': 'Téléviseur ou écran',
  'Batteries/power banks': 'Batteries ou batteries externes', 'Mixed small electronics': 'Petits appareils mélangés',
  'Working/resale': 'Fonctionnel ou revente', 'Repairable': 'Réparable', 'Dead': 'Hors service',
  'Stripped/incomplete': 'Démonté ou incomplet', 'No storage': 'Sans stockage', 'High/client data': 'Élevé ou données client',
  'Certified recycler': 'Recycleur certifié', 'Formal collection point': 'Point de collecte formel',
  'Informal scrap buyer': 'Ferrailleur informel', 'Fruit orchard': 'Verger fruitier', 'Timber': 'Bois d’œuvre',
  'Indigenous restoration': 'Restauration d’essences locales', 'Agroforestry mix': 'Mélange agroforestier',
  'No carbon registration': 'Sans enregistrement carbone', 'Cooperative/program': 'Coopérative ou programme',
  'Direct project': 'Projet direct', 'Retail': 'Commerce', 'Manufacturing': 'Industrie',
  'Food and beverage': 'Alimentation et boissons', 'Services': 'Services', 'Logistics': 'Logistique',
  'Farm/agri': 'Agriculture', 'Yes': 'Oui'
};
const ranges = {
  rainfallAnomaly: [-100, 100], area: [0.01, 1000000], cropValue: [0, 1000000000],
  people: [1, 1000000], dailyDemand: [1, 100000], supplyDays: [0, 7], storage: [0, 1000000000],
  reusePct: [0, 90], month: [1, 12], receivedRain: [0, 10000], expectedRain: [0, 10000],
  projectSize: [1, 100000000], years: [1, 40], price: [0, 100000], bufferPct: [0, 40],
  validationCost: [0, 1000000000], propertyValue: [0, 1000000000000], exposureHours: [0, 24],
  pm25: [0, 500.4], hectares: [0.01, 100000000], kgDay: [0, 100000000],
  organicPct: [0, 100], recyclingPct: [0, 95], pickups: [0, 10000],
  plastic: [0, 100000000], aluminum: [0, 100000000], steel: [0, 100000000],
  paper: [0, 100000000], glass: [0, 100000000], organic: [0, 100000000],
  contaminationPct: [0, 60], transportCost: [0, 1000000000], charcoalKgWeek: [0.1, 100000],
  stoveCost: [0, 1000000000], quantity: [1, 100000000], trees: [1, 1000000000],
  survivalPct: [10, 100], investment: [0, 1000000000000], maintenancePerTree: [0, 1000000],
  carbonPrice: [0, 100000], renewablePct: [0, 100], generatorPct: [0, 100],
  waterReusePct: [0, 100], localSourcingPct: [0, 100]
};
function tr(value) { return text[value] || value; }
function controlFor(source, id) {
  const select = source.match(new RegExp(`<select([^>]*id="${id}"[^>]*)>([\\s\\S]*?)</select>`));
  if (select) {
    const options = select[2].replace(/(<option\b[^>]*>)([^<]*)(<\/option>)/g, (_, a, label, c) => a + tr(label.trim()) + c);
    return `<select${select[1]}>${options}</select>`;
  }
  const input = source.match(new RegExp(`<input([^>]*id="${id}"[^>]*)>`));
  if (!input) throw new Error(`Control not found: ${id}`);
  let attrs = input[1];
  if (ranges[id]) attrs += ` min="${ranges[id][0]}" max="${ranges[id][1]}"`;
  if (!/\brequired\b/.test(attrs)) attrs += ' required';
  return `<input${attrs}>`;
}
function fieldsFor(source) {
  const match = source.match(/<form[^>]*id="climateForm"[\s\S]*?<\/form>/);
  if (!match) throw new Error('climateForm missing');
  const fields = [];
  for (const label of match[0].matchAll(/<label[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/label>/g)) {
    const id = label[1];
    const clean = label[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    fields.push(`<div class="fr-climate-field"><label for="${id}">${tr(clean)}</label>${controlFor(match[0], id)}</div>`);
  }
  return fields.join('');
}
function configFor(source) {
  const match = source.match(/window\.AfroClimateToolConfig=(\{[\s\S]*?\});<\/script>/);
  if (!match) throw new Error('Tool config missing');
  return JSON.parse(match[1]);
}
function alternates(source) {
  return [...source.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .filter(([, lang]) => lang !== 'fr')
    .map(([, lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('\n');
}
function page(tool) {
  const englishFile = path.join(ROOT, 'tools', tool.id, 'index.html');
  const source = fs.readFileSync(englishFile, 'utf8');
  const owner = configFor(source);
  const canonical = `https://afrotools.com/fr/tools/${tool.slug}/`;
  const sources = owner.sources.map(item =>
    `<li><a href="${item.href}" target="_blank" rel="noopener">${item.label}</a><small>Référence méthodologique ; aucune donnée n’est récupérée en direct par cette page.</small></li>`
  ).join('');
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tool.title} Afrique | AfroTools</title><meta name="description" content="${tool.description}">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="fr" href="${canonical}">
${alternates(source)}
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${tool.title}"><meta property="og:description" content="${tool.description}">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${tool.id}.webp">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/climate.css"><link rel="stylesheet" href="/assets/css/fr-climate-tools.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/climate-tools.js" defer></script><script src="/assets/js/pages/fr-climate-tools.js" defer></script>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.title, url: canonical,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'fr',
    isAccessibleForFree: true, isBasedOn: `https://afrotools.com/tools/${tool.id}/`,
    description: tool.description
  })}</script></head><body><afro-navbar lang="fr"></afro-navbar>
<main class="fr-climate-main" data-fr-climate-tool="${tool.id}">
<section class="fr-climate-hero"><p class="eyebrow">Climat et environnement · modèle local</p><h1>${tool.title}</h1><p>${tool.description}</p></section>
<div class="fr-climate-layout"><section class="fr-climate-card"><h2>Construire un scénario</h2><p>Utilisez vos propres observations quand elles sont disponibles.</p>
<form id="frClimateForm" class="fr-climate-form" novalidate>${fieldsFor(source)}<div class="fr-climate-wide"><button class="fr-climate-btn" type="submit">Calculer ce scénario</button><p class="fr-climate-status" data-status role="status" aria-live="polite"></p></div></form>
<section class="fr-climate-results" data-results hidden aria-live="polite"><div class="fr-climate-result-head"><div><h2 data-result-label>Résultat</h2><div class="fr-climate-result-value" data-result-value></div></div><span class="fr-climate-pill" data-result-level></span></div><p data-result-note></p><div class="fr-climate-metrics" data-metrics></div><h2>Plan d’action</h2><ol class="fr-climate-plan" data-plan></ol><div class="fr-climate-actions"><button type="button" class="fr-climate-btn secondary" data-copy>Copier le résumé</button><button type="button" class="fr-climate-btn secondary" data-save>Enregistrer localement</button><button type="button" class="fr-climate-btn secondary" data-pdf>Télécharger le PDF</button></div></section>
</section><aside class="fr-climate-card"><h2>Confiance et fraîcheur</h2><p class="fr-climate-confidence"><strong>Estimation de planification, confiance faible.</strong> Modèle revu le 28 avril 2026. Les préréglages nationaux ne sont ni des mesures météo en direct, ni des avis officiels, et doivent être revalidés avec des données locales actuelles.</p><h2>Confidentialité</h2><p class="fr-climate-privacy">Le calcul, la copie, le PDF et l’enregistrement sont locaux. Les valeurs saisies ne sont pas envoyées à l’IA, à l’analytique ou placées dans l’URL.</p><h2>Sources méthodologiques</h2><ul class="fr-climate-sources">${sources}</ul></aside></div>
</main><afro-footer></afro-footer>${ANALYTICS_LOADER}</body></html>`;
}
function hubPage() {
  const canonical = 'https://afrotools.com/fr/climat-environnement/';
  const cards = tools.map((tool) => `<a class="fr-climate-hub-link" href="/fr/tools/${tool.slug}/">
<strong>${tool.title}</strong><span>${tool.description}</span></a>`).join('');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Outils climat et environnement pour l’Afrique',
    url: canonical,
    inLanguage: 'fr',
    isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.title,
        url: `https://afrotools.com/fr/tools/${tool.slug}/`
      }))
    }
  };
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>13 outils climat et environnement pour l’Afrique | AfroTools</title>
<meta name="description" content="Treize applications françaises pour estimer sécheresse, eau, pluie, carbone, inondation, air, déchets, arbres et durabilité avec limites et sources explicites.">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="https://afrotools.com/climate/">
<link rel="alternate" hreflang="fr" href="${canonical}">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/hali-ya-hewa-na-mazingira/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/climate/">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<meta property="og:title" content="Outils climat et environnement pour l’Afrique">
<meta property="og:description" content="Treize applications françaises locales avec sources, fraîcheur, confiance et exports.">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/fr-climate-tools.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><afro-navbar lang="fr"></afro-navbar>
<main class="fr-climate-main"><section class="fr-climate-hero"><p class="eyebrow">13 applications natives en français</p>
<h1>Climat et environnement</h1><p>Construisez un scénario, comprenez ses limites et exportez un rapport local. Les préréglages sont des hypothèses de planification à confiance faible, pas des mesures en direct.</p></section>
<section class="fr-climate-card"><h2>Choisir une application</h2><p>Chaque application utilise le même moteur de calcul que son propriétaire anglais, avec interface, résultats et plan d’action en français.</p>
<div class="fr-climate-hub-grid">${cards}</div></section></main><afro-footer></afro-footer>${ANALYTICS_LOADER}</body></html>`;
}
function aliasPage(alias, target, title) {
  const canonical = `https://afrotools.com/fr/tools/${target}/`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | AfroTools</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonical}">
<meta http-equiv="refresh" content="0;url=/fr/tools/${target}/"></head><body><main><h1>${title}</h1>
<p>Cette ancienne adresse a été regroupée avec l’application française canonique.</p><p><a href="/fr/tools/${target}/">Ouvrir l’application</a></p>
</main><script>location.replace('/fr/tools/${target}/');</script>${ANALYTICS_LOADER}</body></html>`;
}
for (const tool of tools) {
  const target = path.join(ROOT, 'fr', 'tools', tool.slug, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page(tool), 'utf8');
}
const hubTarget = path.join(ROOT, 'fr', 'climat-environnement', 'index.html');
fs.mkdirSync(path.dirname(hubTarget), { recursive: true });
fs.writeFileSync(hubTarget, hubPage(), 'utf8');
const aliases = [
  ['calculateur-de-revenus-des-credits-carbone-nigeria', 'revenus-credits-carbone', 'Calculateur de revenus des crédits carbone'],
  ['evaluation-du-risque-d-inondation-nigeria', 'risque-inondation', 'Évaluation du risque d’inondation']
];
for (const [alias, target, title] of aliases) {
  fs.writeFileSync(path.join(ROOT, 'fr', 'tools', alias, 'index.html'), aliasPage(alias, target, title), 'utf8');
}
console.log(`Built ${tools.length} native French Climate pages, one hub and ${aliases.length} noindex aliases.`);
