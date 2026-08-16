#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');
const { enhanceCategory } = require('./lib/localized-category-standard');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'transport', 'french-parity.json');
const SOURCE_MANIFEST_PATH = path.join(ROOT, 'data', 'transport', 'official-sources.json');
const HUB_PATH = path.join(ROOT, 'fr', 'transport', 'index.html');
const args = new Set(process.argv.slice(2));
const isCheck = args.has('--check');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return route.endsWith('/')
    ? path.join(ROOT, clean, 'index.html')
    : path.join(ROOT, `${clean}.html`);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function normalizeGeneratedHtml(value) {
  return value.replace(/[ \t]+$/gm, '');
}

function normalizeTransportGeneratorHtml(html) {
  const seoLinks = [];
  let normalized = normalizeBuildManagedHtml(html)
    .replace(
      /\s*<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>/gi,
      (tag) => {
        seoLinks.push(tag.replace(/\s+/g, ' ').trim());
        return '';
      }
    )
    .replace(
      /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,
      (tag, beforeType, afterType, json) => {
        try {
          const value = JSON.parse(json);
          // SEO postprocessing can derive an image from og:image. Artwork is
          // validated independently, so that derived field is not owner drift.
          delete value.image;
          return `<script${beforeType}type="application/ld+json"${afterType}>${JSON.stringify(value)}</script>`;
        } catch {
          return tag;
        }
      }
    )
    .replace(/\s*<meta\b[^>]*\bname=["']twitter:image["'][^>]*>/gi, '')
    .replace(/((?:src|href)=["'][^"'?]+)\?v=[a-f0-9]+(["'])/gi, '$1$2')
    .replace(/\r\n?/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();

  seoLinks.sort();
  normalized += `<!-- normalized-seo-links:${seoLinks.join('|')} -->`;
  return normalized;
}

function alternateHref(html, locale) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["']alternate["']/i.test(tag)) continue;
    const language = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (language && href && language[1].toLowerCase() === locale.toLowerCase()) return href[1];
  }
  return '';
}

function ensureAlternateHreflang(html, locale, href) {
  if (!href) return html;
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const language = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const target = tag.match(/\bhref=["']([^"']+)["']/i);
    if (
      /\brel=["']alternate["']/i.test(tag) &&
      language &&
      target &&
      language[1].toLowerCase() === locale.toLowerCase() &&
      target[1] === href
    ) return html;
  }
  const clean = html.replace(
    new RegExp(`<link\\b(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${locale}["'])[^>]*>\\s*`, 'gi'),
    ''
  );
  const tag = `<link rel="alternate" hreflang="${locale}" href="${href}">`;
  const canonical = clean.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  if (canonical) return clean.replace(canonical[0], `${canonical[0]}\n${tag}`);
  return clean.replace('</head>', `${tag}\n</head>`);
}

function removeElementsByClass(html, className) {
  const classPattern = new RegExp(
    `<([a-z][a-z0-9-]*)\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`,
    'i'
  );
  let output = html;
  let match = classPattern.exec(output);
  while (match) {
    const tag = match[1];
    const tokenPattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    tokenPattern.lastIndex = match.index;
    let depth = 0;
    let token;
    let end = -1;
    while ((token = tokenPattern.exec(output))) {
      if (new RegExp(`^<\\/${tag}\\b`, 'i').test(token[0])) depth -= 1;
      else depth += 1;
      if (depth === 0) {
        end = tokenPattern.lastIndex;
        break;
      }
    }
    if (end < 0) throw new Error(`Unbalanced .${className} element`);
    output = output.slice(0, match.index) + output.slice(end);
    match = classPattern.exec(output);
  }
  return output;
}

const commonTranslations = {
  'AfroTools': 'AfroTools',
  'Home': 'Accueil',
  'Transport': 'Transport',
  'Transport & Logistics': 'Transport et logistique',
  'Transport Logistics': 'Transport et logistique',
  'Car Import Cost': 'Coût d’importation d’un véhicule',
  'Ride-Hailing Fare Estimator': 'Estimateur de tarif VTC et taxi',
  'Boda-Boda / Okada Income Calculator': 'Calculateur de revenu boda-boda et okada',
  'Matatu / Danfo Fare Calculator': 'Estimateur de tarif matatu, danfo et trotro',
  'Delivery Cost Estimator': 'Estimateur du coût de livraison',
  'Car Loan vs Cash Comparator': 'Comparateur voiture à crédit ou au comptant',
  'Vehicle Registration Renewal Checker': 'Checklist d’immatriculation d’un véhicule',
  'Vehicle Depreciation Calculator': 'Calculateur de dépréciation d’un véhicule',
  'Fleet Fuel Budget Calculator': 'Calculateur de budget carburant d’une flotte',
  'Last-Mile Delivery Cost Optimizer': 'Optimiseur du coût du dernier kilomètre',
  'Parking Fee Calculator': 'Calculateur de frais de stationnement',
  'Logistics Route Cost Comparator': 'Comparateur du coût d’un trajet logistique',
  'Toll Fee Calculator': 'Calculateur de frais de péage',
  'Truck Load Optimizer': 'Optimiseur de chargement d’un camion',
  'Vehicle Operating Cost Calculator': 'Calculateur du coût d’utilisation d’un véhicule',
  'Vehicle Tracker ROI Calculator': 'Calculateur du ROI d’un traceur de véhicule',
  'All Tools': 'Tous les outils',
  'Country': 'Pays',
  'City': 'Ville',
  'Route': 'Trajet',
  'Free': 'Gratuit',
  'Pan-African': 'Panafricain',
  'Instant Results': 'Résultats immédiats',
  'Mobile Friendly': 'Adapté au mobile',
  'Real Data': 'Hypothèses affichées',
  'Vehicle Type': 'Type de véhicule',
  'Vehicle Details': 'Détails du véhicule',
  'Vehicle &amp; Financing Details': 'Détails du véhicule et du financement',
  'Vehicle &amp; Tracker Details': 'Détails du véhicule et du traceur',
  'Vehicle Usage': 'Utilisation du véhicule',
  'Trip Type': 'Type de trajet',
  'One-Way': 'Aller simple',
  'Return': 'Aller-retour',
  'Monthly': 'Mensuel',
  'Annual': 'Annuel',
  'Annual (USD)': 'Annuel (USD)',
  'Daily': 'Quotidien',
  'Weekly': 'Hebdomadaire',
  'Distance (km)': 'Distance (km)',
  'Route Distance (km)': 'Distance du trajet (km)',
  'Trip Distance (km)': 'Distance du trajet (km)',
  'Country or route scope': 'Pays ou périmètre du trajet',
  'Currency': 'Devise',
  'Amount or count': 'Montant ou nombre',
  'Priority': 'Priorité',
  'Buffer percent': 'Marge de sécurité (%)',
  'Create summary': 'Créer le résumé',
  'Copy summary': 'Copier le résumé',
  'Frequently Asked Questions': 'Questions fréquentes',
  'Related tools': 'Outils associés',
  'Sources verification': 'Sources et vérification',
  'Methodology': 'Méthode',
  'Before acting': 'Avant d’agir',
  'What to check': 'Points à vérifier',
  'Limitations': 'Limites',
  'Planning estimate only.': 'Estimation de planification uniquement.',
  'Reviewed 2026.': 'Revue des hypothèses en 2026.',
  'Input mode': 'Mode de saisie',
  'Output mode': 'Mode de résultat',
  'Make': 'Marque',
  'Model': 'Modèle',
  'Year': 'Année',
  'Fuel type': 'Carburant',
  'Body type': 'Carrosserie',
  'Transmission': 'Transmission',
  'Condition': 'État',
  'Mileage': 'Kilométrage',
  'Port': 'Port',
  'Destination city': 'Ville de destination',
  'Delay days': 'Jours de retard',
  'Storage days': 'Jours de stockage',
  'Payment Method': 'Mode de paiement',
  'Cash': 'Comptant',
  'Truck': 'Camion',
  'Truck / Commercial Vehicle': 'Camion ou véhicule commercial',
  'Truck / Heavy Vehicle': 'Camion ou poids lourd',
  'Pickup Truck': 'Pick-up',
  'Pickup Truck (10–13 L/100km)': 'Pick-up (10 à 13 L/100 km)',
  'Heavy Truck (25–35 L/100km)': 'Poids lourd (25 à 35 L/100 km)',
  'Motorcycle': 'Moto',
  'Car': 'Voiture',
  'Private Car': 'Voiture particulière',
  'Required Documents': 'Documents à vérifier',
  'Current pump price': 'Prix de carburant saisi',
  'Multi-Vehicle': 'Plusieurs véhicules',
  'Per Vehicle': 'Par véhicule',
  'Per Vehicle/Year': 'Par véhicule et par an',
  'Per Trip': 'Par trajet',
  'Route Trip Details': 'Détails du trajet',
  'Route &amp; Trip Details': 'Détails du trajet',
  'Route &amp; Cargo Details': 'Détails du fret et du trajet',
  'Load &amp; Route Details': 'Chargement et trajet',
  'Delivery Configuration': 'Configuration de la livraison',
  'Select Your Vehicle': 'Choisissez votre véhicule',
  'Other African Country': 'Autre pays africain',
  'Reset': 'Réinitialiser',
  'Monthly Net': 'Revenu net mensuel',
  'Annual Net': 'Revenu net annuel',
  'Monthly (est.)': 'Mensuel (estimation)',
  'Both ways (×2 for round trip)': 'Aller-retour (×2)',
  '2 trips/day × 22 working days = 44': '2 courses par jour × 22 jours travaillés = 44',
  'If you hire, enter daily cost': 'En cas de location, saisissez le coût quotidien',
  'Usually 20-30% of vehicle price': 'Souvent 20 à 30 % du prix du véhicule',
  'Pre-filled for selected country': 'Valeur préremplie pour le pays choisi',
  'T-bill / savings rate if you kept the cash': 'Rendement supposé si le capital reste placé',
  'Planning estimate only. Pre-filled rate ranges are indicative and can change by bank, vehicle age, credit profile, insurance, fees, and country rules. Confirm a current written quote before buying or financing.': 'Estimation de planification uniquement. Les taux préremplis sont indicatifs et varient selon banque, âge du véhicule, dossier, assurance, frais et règles nationales. Confirmez une offre écrite actuelle avant tout achat ou financement.',
  'Purchase Price (any currency)': 'Prix d’achat (devise au choix)',
  'Vehicle Brand Tier': 'Catégorie de marque',
  'Vehicle Age Now (years)': 'Âge actuel du véhicule (années)',
  '0 = brand new, enter current age to see present value': '0 = neuf ; saisissez l’âge actuel pour estimer la valeur',
  'Total depreciation: 0 (0%)': 'Dépréciation totale : 0 (0 %)',
  'Electric Vehicle': 'Véhicule électrique',
  'Avg Daily km per Vehicle': 'Kilomètres quotidiens moyens par véhicule',
  'Fuel Price (per litre)': 'Prix saisi par litre',
  'In your local currency per litre': 'Dans la devise locale, par litre',
  'Operating Days per Month': 'Jours d’activité par mois',
  '6 days': '6 jours',
  '26 days': '26 jours',
  'Average Distance per Delivery (km)': 'Distance moyenne par livraison (km)',
  'Fuel Price (USD per litre)': 'Prix du carburant saisi (USD par litre)',
  'Optimize Last-Mile Cost': 'Optimiser le coût du dernier kilomètre',
  'These figures are an estimate — actual rates vary by courier, surge/time of day, waiting time and local charges. Confirm the live quote with the provider before booking. Source: published Lalamove, Sendy, Max.ng, Kobo360 and local courier base + per-km rate cards (indicative).': 'Ces chiffres sont des estimations fondées sur le modèle et vos saisies. Confirmez le devis actuel, les suppléments, l’attente et les frais locaux directement auprès du transporteur avant de réserver.',
  'Yes — use monthly permit rate': 'Oui — appliquer l’abonnement mensuel',
  'Parking vs Ride-Hailing Comparison (monthly)': 'Stationnement ou VTC (comparaison mensuelle)',
  'Used to calculate time value of cargo in transit': 'Sert à estimer la valeur du temps pendant le transit',
  '0 days transit': '0 jour de transit',
  'E-tag Savings': 'Économie avec badge',
  'Enter 0 if not a regular commute': 'Saisissez 0 si le trajet n’est pas régulier',
  'Small Truck (3-5 tonnes)': 'Petit camion (3 à 5 tonnes)',
  'Medium Truck (8-10 tonnes)': 'Camion moyen (8 à 10 tonnes)',
  'Large Truck (20-30 tonnes)': 'Grand camion (20 à 30 tonnes)',
  'In your local currency for this specific trip': 'Dans la devise locale pour ce trajet',
  'Loaded truck — empty may be 15-25% less': 'Camion chargé — renseignez votre propre hypothèse pour un trajet à vide',
  'Vehicle Details Annual Usage': 'Véhicule et utilisation annuelle',
  'Typical: 3-6% of vehicle value for comprehensive': 'Hypothèse modifiable du modèle ; confirmez le devis d’assurance',
  'Calculate the return on investment for a GPS vehicle tracker in Africa — insurance discounts, fuel savings from driver behaviour monitoring, theft prevention value, and payback period.': 'Modelez le retour sur investissement d’un traceur GPS à partir de vos propres coûts et bénéfices supposés. Le résultat ne garantit ni remise d’assurance, ni économie de carburant, ni récupération après vol.',
  'Vehicle Tracker': 'Traceur de véhicule',
  'Fuel Savings': 'Économies de carburant supposées',
  'Business / staff vehicle': 'Véhicule d’entreprise ou de service',
  'Logistics / delivery': 'Logistique ou livraison',
  'Basic GPS tracker (no subscription)': 'Traceur GPS simple (sans abonnement)',
  'SIM-based GPS (monthly subscription)': 'Traceur GPS avec SIM (abonnement mensuel)',
  'Recommended Tracker Brands in Africa': 'Hypothèses du modèle à remplacer par des devis actuels',
  'For fleets of 5+ vehicles, advanced telematics can reduce fuel costs by 15–20% (eliminating detours, idling), reduce accidents by 30% (driver behaviour scoring), and cut maintenance costs through predictive service alerts. The ROI compounds significantly with fleet size.': 'Les bénéfices du modèle sont des hypothèses modifiables, pas des performances garanties. Demandez des devis actuels et mesurez vos propres économies avant tout déploiement de flotte.',
  'Estimate Fares': 'Estimer les tarifs',
  'Calculate Net Income': 'Calculer le revenu net',
  'Calculate Fare': 'Calculer le tarif estimé',
  'Estimate Delivery Cost': 'Estimer le coût de livraison',
  'Compare Loan vs Cash': 'Comparer crédit et comptant',
  'Check Registration': 'Vérifier la préparation',
  'Check Roadworthiness': 'Vérifier la préparation',
  'Calculate Depreciation': 'Calculer la dépréciation',
  'Calculate Fleet Fuel Budget': 'Calculer le budget carburant',
  'Optimize Delivery Cost': 'Optimiser le coût de livraison',
  'Calculate Parking Cost': 'Calculer le stationnement',
  'Compare Routes': 'Comparer les scénarios',
  'Calculate Toll Costs': 'Calculer le budget péage',
  'Optimize Load': 'Optimiser le chargement',
  'Calculate Annual Operating Cost': 'Calculer le coût annuel',
  'Calculate Tracker ROI': 'Calculer le ROI du traceur',
  'Normal (Off-peak)': 'Normal (heures creuses)',
  'Busy (Evening rush)': 'Chargé (pointe du soir)',
  'Peak (Morning rush)': 'Pointe (matin)',
  'Very Busy (Rain/events)': 'Très chargé (pluie ou événement)',
  'Normal (next day)': 'Normal (lendemain)',
  'Express (same day)': 'Express (même jour)',
  'Urgent (2-3 hours)': 'Urgent (2 à 3 heures)',
  'Yes': 'Oui',
  'No': 'Non',
  'Cost Component': 'Composante du coût',
  '% of Total': '% du total',
  'Total Annual Operating Cost': 'Coût annuel total',
  'Load Efficiency': 'Taux de chargement',
  'Annual Net Benefit': 'Bénéfice net annuel',
  'Payback Period': 'Délai de retour',
  'Source': 'Source',
  'Local estimate': 'Estimation locale',
  'Rule-pack estimate': 'Estimation par jeu de règles',
  'Operations estimate': 'Estimation opérationnelle'
};

const appTranslations = {
  'car-import-cost': {
    'Know the true landed cost before you buy': 'Connaissez le coût rendu avant d’acheter',
    'Know the true landed cost before you buy, bid, or ship': 'Connaissez le coût rendu avant d’acheter ou d’expédier',
    'Start with the few details you know. The calculator will split vehicle value, official charges, port or clearing extras, and registration into one planning quote.': 'Commencez avec les informations disponibles. Le calculateur sépare la valeur du véhicule, les coûts du barème, les frais de port ou de transit et l’immatriculation dans une estimation de planification.',
    'Start your quote': 'Commencer l’estimation',
    'Browse import vs local prices': 'Comparer importation et prix locaux',
    'Official vs practical cost split': 'Séparation des coûts du barème et des coûts pratiques',
    'Best / normal / painful scenarios': 'Scénarios favorable, normal et défavorable',
    'Japan vs UAE vs UK vs South Africa': 'Japon, Émirats arabes unis, Royaume-Uni et Afrique du Sud',
    'What you get in one quote': 'Ce que contient l’estimation',
    'Official Charges vs practical port and clearing extras.': 'Coûts du barème et frais pratiques de port ou de transit.',
    'Official costs vs practical port and clearing extras.': 'Coûts du barème et frais pratiques de port ou de transit.',
    'Best, normal, and painful-case scenarios instead of one blunt number.': 'Scénarios favorable, normal et défavorable plutôt qu’un chiffre unique.',
    'See the full number': 'Voir le coût complet',
    'Split vehicle value, customs charges, and real-world port or clearing extras before you commit money.': 'Séparez la valeur du véhicule, les droits de douane et les frais pratiques de port ou de transit avant tout paiement.',
    'Catch rule issues early': 'Repérer tôt les contraintes',
    'See age, steering, valuation, and inspection risk before you ship the wrong car.': 'Vérifiez les risques liés à l’âge, à la conduite, à la valorisation et au contrôle avant l’expédition.',
    'Budget for bad surprises': 'Prévoir une marge de sécurité',
    'Use best, normal, and painful-case scenarios instead of one misleading quote.': 'Utilisez les scénarios favorable, normal et défavorable plutôt qu’une estimation trompeuse.',
    'Quick starts': 'Exemples de départ',
    'Load a realistic sample quote, then edit it to match your actual vehicle.': 'Chargez un exemple réaliste, puis adaptez-le à votre véhicule.',
    'Built for ad traffic': 'Saisie rapide',
    'Japan quote': 'Estimation depuis le Japon',
    'What you need': 'Informations nécessaires',
    'Even partial information is enough to get a planning estimate.': 'Des informations partielles suffisent pour obtenir une estimation de planification.',
    'No paperwork required': 'Aucun document requis',
    'Questions to check before importing': 'Questions à vérifier avant d’importer',
    'What does the landed-cost estimate include?': 'Que comprend l’estimation du coût rendu ?',
    'It separates vehicle price, freight, insurance, customs, port and clearing charges, inland delivery, registration and the FX buffer you select.': 'Elle sépare le prix du véhicule, le fret, l’assurance, la douane, les frais de port et de transit, la livraison intérieure, l’immatriculation et la marge de change choisie.',
    'Can I use the estimate as a customs quote?': 'Puis-je utiliser cette estimation comme devis douanier ?',
    'No. It is a planning estimate from source-dated rule packs. Confirm valuation, age limits, duty, tax, inspection and port charges with the relevant authority and a written clearing quote.': 'Non. Il s’agit d’une estimation de planification fondée sur des jeux de règles datés. Confirmez la valorisation, les limites d’âge, les droits, les taxes, le contrôle et les frais de port auprès de l’autorité compétente et au moyen d’un devis écrit de transit.',
    'Why does the calculator show a range?': 'Pourquoi le calculateur affiche-t-il une fourchette ?',
    'The best, normal and painful cases make changing freight, FX and clearing assumptions visible instead of presenting one brittle total as guaranteed.': 'Les scénarios favorable, normal et défavorable rendent visibles les variations du fret, du change et du transit au lieu de présenter un total fragile comme garanti.',
    'Import country': 'Pays d’importation',
    'Source market': 'Marché source',
    'Make + model + year': 'Marque, modèle et année',
    'Approx price or CIF': 'Prix approximatif ou CIF',
    'Port or destination if you know it': 'Port ou destination, si connu',
    'Input mode': 'Mode de saisie',
    'I know the purchase price': 'Je connais le prix d’achat',
    'I know FOB': 'Je connais le FOB',
    'I know CIF': 'Je connais le CIF',
    'I only know make/model/year': 'Je connais seulement la marque, le modèle et l’année',
    'I want to compare source markets': 'Je veux comparer les marchés sources',
    'Output mode': 'Mode de résultat',
    'Official + practical port costs': 'Barème et coûts pratiques du port',
    'Official mode': 'Barème uniquement',
    'Stress test': 'Test de sensibilité',
    'Make': 'Marque',
    'Model': 'Modèle',
    'Trim optional': 'Finition facultative',
    'Year': 'Année',
    'First registration month': 'Mois de première immatriculation',
    'January': 'Janvier',
    'February': 'Février',
    'March': 'Mars',
    'April': 'Avril',
    'May': 'Mai',
    'June': 'Juin',
    'July': 'Juillet',
    'August': 'Août',
    'September': 'Septembre',
    'October': 'Octobre',
    'November': 'Novembre',
    'December': 'Décembre',
    'Fuel type': 'Carburant',
    'Petrol': 'Essence',
    'Diesel': 'Diesel',
    'Hybrid': 'Hybride',
    'Engine cc': 'Cylindrée (cm³)',
    'Body type': 'Carrosserie',
    'Sedan': 'Berline',
    'Hatchback': 'Compacte',
    'MPV / Van': 'Monospace / fourgonnette',
    'Pickup': 'Pick-up',
    'Truck': 'Camion',
    'Motorcycle': 'Moto',
    'Drive side': 'Côté de conduite',
    'Right-hand drive': 'Conduite à droite',
    'Left-hand drive': 'Conduite à gauche',
    'Transmission': 'Transmission',
    'Automatic': 'Automatique',
    'Manual': 'Manuelle',
    'Condition': 'État',
    'Used': 'Occasion',
    'New': 'Neuf',
    'Mileage': 'Kilométrage',
    'Purchase price USD': 'Prix d’achat en USD',
    'Advanced costs and finance': 'Coûts avancés et financement',
    'Freight USD': 'Transport en USD',
    'Insurance USD': 'Assurance en USD',
    'Official customs value USD': 'Valeur douanière du barème en USD',
    'Port': 'Port',
    'Destination city': 'Ville de destination',
    'Delay days': 'Jours de retard',
    'Storage days': 'Jours de stockage',
    'Clearing mode': 'Mode de dédouanement',
    'Agent estimate': 'Estimation avec transitaire',
    'DIY estimate': 'Estimation autonome',
    'Down payment %': 'Apport (%)',
    'Finance months': 'Durée du financement (mois)',
    'Local dealer price USD': 'Prix local du vendeur en USD',
    'Extra agency charges USD': 'Frais supplémentaires du transitaire en USD',
    'Get landed cost': 'Calculer le coût rendu',
    'Open source comparison': 'Ouvrir la comparaison des marchés sources',
    'Fast read:': 'Lecture rapide :',
    'quote already includes more than customs.': 'Cette estimation inclut déjà plus que la douane.',
    'to isolate customs-only costs, or open': 'pour isoler les coûts douaniers, ou ouvrez',
    'to see whether': 'pour vérifier si',
    'still looks best against the other source markets.': 'reste préférable aux autres marchés sources.',
    'still looks best against the other source markets': 'reste préférable aux autres marchés sources',
    'Japon still looks best against the other source markets.': 'le Japon reste préférable aux autres marchés sources.',
    'Japan': 'Japon',
    'UAE': 'Émirats arabes unis',
    'UK': 'Royaume-Uni',
    'Local dealer': 'Vendeur local',
    'Summary': 'Résumé',
    'FAQ': 'Questions fréquentes',
    'Customs value': 'Valeur douanière',
    'Practical extras': 'Coûts pratiques',
    'Monthly finance': 'Mensualité estimée',
    'Resale band': 'Fourchette de revente',
    'Vehicle + freight + insurance': 'Véhicule, transport et assurance',
    'Official taxes': 'Taxes du barème',
    'Official fees': 'Frais du barème',
    'Practical port costs': 'Coûts pratiques du port',
    'Inland delivery': 'Livraison intérieure',
    'Item': 'Élément',
    'Rate': 'Taux',
    'Local': 'Devise locale',
    'Vehicle base / FOB': 'Valeur du véhicule / FOB',
    'Freight to port': 'Transport jusqu’au port',
    'Marine insurance': 'Assurance maritime',
    'CIF / customs value': 'CIF / valeur douanière',
    'Save Result': 'Enregistrer le résultat',
    'estimate using': 'estimation utilisant',
    'estimate-pack and valuation-pack': 'jeu d’estimation et jeu de valorisation',
    'estimate-pack and manual-customs-value': 'jeu d’estimation et valeur douanière saisie',
    'customs value.': 'comme valeur douanière.',
    'Rule pack effective': 'Jeu de règles applicable depuis le',
    'delay days': 'jours de retard',
    'Finance estimate:': 'Estimation du financement :',
    'per month for': 'par mois pendant',
    'months after': 'mois après',
    'down. Suggested resale band:': 'd’apport. Fourchette de revente suggérée :',
    'Local comparator:': 'Comparaison locale :',
    'Required Documents': 'Documents requis',
    'Sources and safeguards': 'Sources et limites',
    'Compare Japan, UAE, UK, South Africa, and local dealer assumptions in one flow.': 'Comparez dans un même parcours les hypothèses du Japon, des Émirats arabes unis, du Royaume-Uni, d’Afrique du Sud et du marché local.',
    'Estimate the real cost to land a used or new vehicle in Nigeria through Lagos ports, including customs taxes, practical clearing costs, registration, storage risk, and inland movement.': 'Estimez le coût d’importation d’un véhicule neuf ou d’occasion au Nigéria via les ports de Lagos, avec taxes douanières, frais pratiques de transit, immatriculation, risque de stockage et transport intérieur.',
    'Users often miss terminal delivery orders, scanning or examination fees, local registration, demurrage after free days, and FX spread between the quote date and clearing date.': 'Les coûts souvent oubliés comprennent les bons de livraison du terminal, les frais de scan ou d’inspection, l’immatriculation locale, les surestaries après la période gratuite et l’écart de change entre le devis et le dédouanement.',
    'Estimate a Kenya car import from source price or make/model/year through Mombasa, including KRA taxes, KEBS inspection, inland delivery, and registration.': 'Estimez une importation au Kenya depuis le prix source ou la marque, le modèle et l’année via Mombasa, avec taxes KRA, inspection KEBS, livraison intérieure et immatriculation.',
    'The biggest misses are valuation uplift versus invoice, KEBS inspection, IDF, RDL, storage, and inland delivery to Nairobi, Kisumu, or Eldoret.': 'Les écarts les plus fréquents concernent la valorisation par rapport à la facture, l’inspection KEBS, l’IDF, la RDL, le stockage et la livraison vers Nairobi, Kisumu ou Eldoret.',
    'Estimate a vehicle import through Tema or Takoradi with Ghana-specific duties, levies, overage penalty, local port costs, DVLA registration, and third-party clearing charges.': 'Estimez une importation via Tema ou Takoradi avec les droits et prélèvements du Ghana, la pénalité d’âge, les coûts portuaires, l’immatriculation DVLA et les frais de transit de tiers.',
    'Common misses are used-vehicle examination fees, processing fees, safe bond rent, shipping-line charges, trade number plates, and age overage penalties.': 'Les coûts souvent oubliés comprennent l’inspection des véhicules d’occasion, le traitement, le magasin sous douane, la compagnie maritime, les plaques provisoires et les pénalités d’âge.',
    'Estimate a Uganda vehicle import using URA-style valuation data, exchange-rate-aware taxes, clearing costs, inland transport to Kampala or regional cities, and registration.': 'Estimez une importation en Ouganda avec les données de valorisation de type URA, les taxes sensibles au change, le transit, le transport vers Kampala ou les villes régionales et l’immatriculation.',
    'The biggest misses are valuation-guide differences, inland movement from Mombasa or Dar, environmental levy on older vehicles, storage, and FX timing.': 'Les écarts les plus fréquents concernent le guide de valorisation, le transport depuis Mombasa ou Dar es Salaam, la taxe environnementale des véhicules anciens, le stockage et le moment du change.',
    'Estimate a Zambia vehicle import with a ZRA schedule-friendly engine, customs taxes, ASYCUDA-style processing, agency buffers, inland movement, and registration.': 'Estimez une importation en Zambie avec un modèle compatible avec les barèmes ZRA, les taxes douanières, le traitement de type ASYCUDA, les marges des intermédiaires, le transport intérieur et l’immatriculation.',
    'The common misses are official schedule row differences, other agency charges, long inland delivery from port corridors, and exchange-rate movement.': 'Les coûts souvent oubliés sont les écarts entre lignes de barème, les frais d’autres organismes, le long transport depuis les corridors portuaires et les variations de change.',
    'Estimate a Tanzania vehicle import through Dar es Salaam with customs taxes, used-vehicle age excise, local registration tax, motor vehicle licence fee, and inland delivery.': 'Estimez une importation en Tanzanie via Dar es Salaam avec les taxes douanières, l’accise liée à l’âge, la taxe d’immatriculation, la licence automobile et la livraison intérieure.',
    'The costs people miss are first-registration levy blocks, age-based excise, port storage, clearing fees, and inland delivery beyond Dar es Salaam.': 'Les coûts souvent oubliés sont les prélèvements de première immatriculation, l’accise liée à l’âge, le stockage au port, le transit et la livraison au-delà de Dar es Salaam.',
    'Can I calculate Nigeria if I only know the car price?': 'Puis-je estimer une importation au Nigéria avec seulement le prix du véhicule ?',
    'Yes. The calculator treats purchase price as a FOB-style estimate, adds freight and marine insurance, then calculates on CIF. You can switch to FOB or CIF mode when you have cleaner shipping documents.': 'Oui. Le calculateur traite le prix d’achat comme une estimation de type FOB, ajoute le transport et l’assurance maritime, puis calcule sur le CIF. Passez au mode FOB ou CIF lorsque vous disposez de documents d’expédition plus précis.',
    'Why is there a Nigeria rule-pack warning?': 'Pourquoi le jeu de règles du Nigéria affiche-t-il un avertissement ?',
    'Nigeria has had policy movement around FOB-based charges and vehicle levies. The calculator keeps those layers editable and source-dated so a new pack can be published without changing code.': 'Les frais fondés sur le FOB et les prélèvements automobiles ont évolué au Nigéria. Le calculateur garde ces couches modifiables et datées afin de publier un nouveau jeu sans modifier le code.',
    'What is the Japan to Mombasa happy path?': 'Quel est le parcours type du Japon à Mombasa ?',
    'Use Japan as the source market, Mombasa as the port, Nairobi or another city as destination, and right-hand drive as the steering side. The calculator will add KEBS inspection and KRA-style taxes.': 'Choisissez le Japon comme marché source, Mombasa comme port, Nairobi ou une autre ville comme destination et la conduite à droite. Le calculateur ajoute l’inspection KEBS et les taxes de type KRA.',
    'What if I do not know the CRSP value?': 'Que faire si je ne connais pas la valeur CRSP ?',
    'Use make, model, and year. The result is labelled as an estimate based on the current valuation pack or fallback seed until the exact KRA value is uploaded.': 'Saisissez la marque, le modèle et l’année. Le résultat reste une estimation fondée sur le jeu de valorisation actuel jusqu’à l’ajout de la valeur KRA exacte.',
    'Why does Ghana separate official taxes and third-party charges?': 'Pourquoi le Ghana sépare-t-il les taxes du barème et les frais de tiers ?',
    'Ghana clearing often includes statutory taxes, ICUMS-related fees, terminal costs, shipping-line charges, safe bond handling, trade plates, and agent charges. Separating them makes the estimate easier to audit.': 'Le transit au Ghana inclut souvent taxes légales, frais ICUMS, terminal, compagnie maritime, magasin sous douane, plaques provisoires et frais d’agent. Les séparer facilite la vérification de l’estimation.',
    'Can Ghana use VIN lookup later?': 'Le Ghana pourra-t-il utiliser une recherche VIN ?',
    'Yes. The data model has an ICUMS/VIN-oriented hook so an official or licensed lookup source can be imported later without rewriting the calculator.': 'Oui. Le modèle de données prévoit une intégration ICUMS/VIN afin d’ajouter plus tard une source officielle ou habilitée sans réécrire le calculateur.',
    'Can Uganda estimate without a customs value?': 'L’Ouganda peut-il être estimé sans valeur douanière ?',
    'Yes. Use make, model, and year. The calculator tries the valuation seed pack and labels the result clearly when a precise official URA value is unavailable.': 'Oui. Saisissez la marque, le modèle et l’année. Le calculateur utilise le jeu de valorisation et indique clairement l’absence de valeur URA officielle précise.',
    'How are Uganda values updated?': 'Comment les valeurs de l’Ouganda sont-elles mises à jour ?',
    'The valuation rows are refreshed from official URA guide data, previewed for calculation accuracy, then published through the configured data workflow.': 'Les lignes de valorisation sont actualisées depuis le guide URA officiel, vérifiées en prévisualisation puis publiées par le parcours de données configuré.',
    'Why does Zambia show a schedule estimate?': 'Pourquoi la Zambie affiche-t-elle une estimation par barème ?',
    'ZRA motor vehicle calculations can depend on specific duty schedules. The engine supports schedule lookup and falls back to a clearly labelled percentage estimate only when no schedule row is available.': 'Les calculs ZRA peuvent dépendre de barèmes de droits précis. Le moteur consulte ces barèmes et n’utilise une estimation en pourcentage clairement signalée qu’en l’absence de ligne correspondante.',
    'Can I view Zambia totals in USD and kwacha?': 'Puis-je voir les totaux de la Zambie en USD et en kwacha ?',
    'Yes. The calculator shows USD for reproducibility and ZMW using the FX rate stored with the quote.': 'Oui. Le calculateur affiche les USD pour la reproductibilité et les ZMW selon le taux de change enregistré avec l’estimation.',
    'Why does Tanzania show customs and registration separately?': 'Pourquoi la Tanzanie sépare-t-elle douane et immatriculation ?',
    'TRA import taxes and local first-registration fees happen at different stages. Keeping them separate makes it easier to budget for clearing versus getting the car road-ready.': 'Les taxes d’importation TRA et les frais locaux de première immatriculation interviennent à des étapes différentes. Les séparer facilite le budget du transit et de la mise en circulation.',
    'Does this support used motorcycle age logic?': 'Le modèle prend-il en charge l’âge des motos d’occasion ?',
    'The rules engine already supports age-based and vehicle-class conditions, so a motorcycle branch can be added in data without changing the pipeline.': 'Le moteur gère déjà les conditions liées à l’âge et à la catégorie du véhicule ; une branche moto peut donc être ajoutée dans les données sans modifier le parcours.',
    'officialUsed for customs-import workflow metadata.': 'officiel — utilisé pour les métadonnées du parcours d’importation.',
    'officialUsed for documentation and compliance framing.': 'officiel — utilisé pour les documents et les limites du parcours.',
    'officialTracks 2025 FOB charge discussions so the rule pack remains versionable.': 'officiel — suit les échanges de 2025 sur les frais FOB afin de conserver un jeu de règles versionné.',
    'Used for customs-import workflow metadata.': 'Utilisé pour les métadonnées du parcours d’importation.',
    'Used for documentation and compliance framing.': 'Utilisé pour les documents et les limites du parcours.',
    'Tracks 2025 FOB charge discussions so the rule pack remains versionable.': 'Suit les échanges de 2025 sur les frais FOB afin de conserver un jeu de règles versionné.',
    'See the real on-road budget before you bid, buy, or ship. Estimate customs, port charges, clearing, inland delivery, registration, FX risk, and source-market differences in one quote.': 'Préparez un budget routier avant d’acheter ou d’expédier. Séparez douane, port, transit, livraison intérieure, immatriculation et risque de change dans une même estimation.',
    'Source-market comparisons for Japan, UAE, UK, South Africa, and local dealer.': 'Comparaison des marchés sources proposés par le modèle et de l’achat local.',
    'Estimate only. Duties, valuation rules, and FX rates change frequently &mdash; confirm the final landed figure with a licensed clearing agent and your national customs authority before you buy, bid, or ship.': 'Estimation uniquement. Confirmez droits, méthode de valorisation, change et coût rendu final auprès de la douane nationale et d’un transitaire habilité avant tout paiement.',
    'The calculator turns partial information into a planning quote, separates official charges from practical extras, checks compliance rules, and shows how much the final number can move when FX or port delays go against you.': 'Le calculateur transforme les informations disponibles en estimation de planification, sépare les barèmes du modèle des coûts pratiques et montre la sensibilité au change et aux retards.',
    'Start with purchase price, FOB, CIF, or just make, model, and year.': 'Commencez par le prix d’achat, le FOB, le CIF ou les informations marque, modèle et année.',
    'See vehicle value, customs, port or clearing extras, inland delivery, and registration separately.': 'Consultez séparément valeur du véhicule, douane, port ou transit, livraison intérieure et immatriculation.',
    'Country-specific rule notes': 'Notes du modèle par pays',
    'Pick a country to see its active rule-pack summary.': 'Choisissez un pays pour voir le résumé du jeu de règles enregistré.',
    'Why the estimate is trustworthy': 'Pourquoi les hypothèses restent vérifiables',
    'Rule packs are source-dated and versioned instead of scraped live. That keeps the calculator stable, auditable, and easier to update when a customs rule, valuation workflow, or port preset changes.': 'Les jeux de règles sont datés et versionnés, sans extraction en direct. Le calcul reste stable et auditable, mais toute règle changeante doit être confirmée avant d’agir.',
    'Import Duty Calculator': 'Calculateur de droits d’importation',
    'African Currency Converter': 'Convertisseur de devises africaines',
    'Delivery Cost Estimator': 'Estimateur du coût de livraison',
    'Car Insurance Tools': 'Outils d’assurance automobile',
    'Car Loan Calculator': 'Calculateur de crédit automobile',
    'Partner clearing, shipping, insurance, finance, and dealer quote zones are ready to connect.': 'Les mises en relation avec transitaires, transporteurs, assureurs, financeurs ou vendeurs exigent une action explicite.'
  },
  'ride-fare': {
    'Enter Your Trip Details': 'Saisissez les détails de la course',
    'Estimated Travel Time (minutes)': 'Durée estimée (minutes)',
    'Time of Day': 'Période de la journée',
    'Daily Commute Trips per Month': 'Courses domicile-travail par mois'
  },
  'boda-income': {
    'Rider Details': 'Détails du conducteur',
    '15 Countries': '15 pays',
    'Nigeria': 'Nigéria',
    'Uganda': 'Ouganda',
    'Tanzania': 'Tanzanie',
    'Average Fare per Trip': 'Tarif moyen par course',
    'Average in KSh — adjust to your actual fares': 'Moyenne en KSh — adaptez-la à vos tarifs réels',
    'Trips per Day': 'Courses par jour',
    'Average working day trips': 'Nombre moyen de courses par jour travaillé',
    'Own Bike?': 'Moto personnelle ?',
    'Yes — I own my bike': 'Oui — ma moto m’appartient',
    'No — I hire a bike daily': 'Non — je loue une moto chaque jour',
    'Daily Bike Hire Cost': 'Location quotidienne de la moto',
    'Typical hire: KSh 300/day if not owned': 'Location indicative : 300 KSh par jour si la moto ne vous appartient pas',
    'Fuel Price (per litre)': 'Prix du carburant par litre',
    'Current KSh/litre pump price': 'Prix saisi en KSh par litre',
    'Fuel Consumption (km per litre)': 'Consommation (km par litre)',
    'Motos: 30–45 km/litre typical': 'Moto : hypothèse courante de 30 à 45 km par litre',
    'Avg km per Trip': 'Kilomètres moyens par course',
    'Working Days per Month': 'Jours travaillés par mois',
    'Daily Net Income': 'Revenu net quotidien',
    'After fuel, hire &amp; maintenance | KSh': 'Après carburant, location et entretien | KSh',
    'After fuel, hire & maintenance | KSh': 'Après carburant, location et entretien | KSh',
    'Weekly Net': 'Revenu net hebdomadaire',
    'Gross Revenue': 'Revenu brut',
    'Fuel Cost': 'Coût du carburant',
    'Maintenance Allowance': 'Provision d’entretien',
    'Net Income': 'Revenu net',
    'You own your bike — great! Your profit margin is': 'Votre moto vous appartient. Votre marge est de',
    'Ensure you set aside at least': 'Prévoyez au moins',
    '/month for maintenance and tyre replacement.': 'par mois pour l’entretien et le remplacement des pneus.',
    'Profit Margin': 'Marge'
  },
  'matatu-fare': {
    'Route Details': 'Détails du trajet',
    'Number of Transfers': 'Nombre de correspondances',
    'Direct (no transfer)': 'Direct (sans correspondance)',
    '1 transfer': '1 correspondance',
    '2 transfers': '2 correspondances',
    'Commute Days per Month': 'Jours de trajet par mois',
    'Estimated One-Way Fare': 'Tarif aller simple estimé',
    'Ride-Hailing': 'VTC / taxi',
    '(vs ride-hailing)': '(par rapport au VTC)',
    'Route:': 'Trajet :',
    'Est. time:': 'Durée estimée :',
    'Transfers:': 'Correspondances :',
    'Using public transport saves approximately': 'Les transports collectifs permettent d’économiser environ',
    '/month': 'par mois',
    'vs ride-hailing. Annual saving:': 'par rapport au VTC. Économie annuelle :',
    'Note: matatu fares are higher during peak hours (7-9am, 5-8pm) and may increase 20-50% during school holidays or bad weather.': 'Les tarifs des matatus sont plus élevés aux heures de pointe (7 h à 9 h, 17 h à 20 h) et peuvent augmenter de 20 à 50 % pendant les vacances scolaires ou par mauvais temps.',
    'Monthly Saving': 'Économie mensuelle'
  },
  'delivery-cost': {
    'Delivery Details': 'Détails de la livraison',
    '6 Markets + more': '6 marchés et plus',
    'Free': 'Gratuit',
    'Multi-Provider': 'Plusieurs prestataires',
    'South Africa': 'Afrique du Sud',
    'Tanzania': 'Tanzanie',
    'Uganda': 'Ouganda',
    'Distance in km': 'Distance en km',
    'Package Weight (kg)': 'Poids du colis (kg)',
    'Package weight in kg': 'Poids du colis en kg',
    'Urgency': 'Urgence',
    'Motorcycle / Bike': 'Moto',
    'Car / Sedan': 'Voiture',
    'Van / Minivan': 'Fourgonnette',
    'Range:': 'Fourchette :',
    'Estimated Cheapest': 'Le moins cher estimé',
    'Est. Best Price': 'Meilleur prix estimé',
    'Cost per kg': 'Coût par kg',
    'Other African Country': 'Autre pays africain'
  },
  'car-loan-vs-cash': {
    'Vehicle Financing Details': 'Détails du financement',
    'Vehicle Price (local currency)': 'Prix du véhicule (devise locale)',
    'Down Payment': 'Apport',
    'Loan Tenor (months)': 'Durée du crédit (mois)',
    'Annual Interest Rate (%)': 'Taux d’intérêt annuel (%)',
    'Nigeria: typical auto loan 22–30%': 'Nigéria : hypothèse de crédit automobile de 22 à 30 %',
    'Alternative Investment Return (%/yr)': 'Rendement alternatif (% par an)',
    'Total Loan Cost': 'Coût total du crédit',
    'Total Cash Cost': 'Coût au comptant',
    'Foregone returns:': 'Rendements non perçus :',
    'Loan is more economical in this scenario — your investment returns exceed the interest saved by paying cash.': 'Le crédit est plus économique dans ce scénario : le rendement du capital dépasse les intérêts évités par un paiement comptant.',
    'Cash is more economical in this scenario — the interest saved exceeds your investment returns.': 'Le paiement comptant est plus économique dans ce scénario : les intérêts évités dépassent le rendement du capital.',
    'Metric': 'Indicateur',
    'Loan': 'Crédit',
    'Vehicle Price': 'Prix du véhicule',
    'Total Interest / Finance Charges': 'Intérêts et frais de financement',
    'Foregone Investment Returns': 'Rendements du capital non perçus',
    'Monthly Payment': 'Mensualité',
    'Total Effective Cost': 'Coût effectif total',
    'N/A': 'Sans objet',
    'Download TXT': 'Télécharger le TXT'
  },
  'vehicle-registration': {
    'Vehicle Registration Details': 'Détails de l’immatriculation',
    'Vehicle & Registration Details': 'Véhicule et immatriculation',
    '54 Countries': '54 pays',
    'Nigeria': 'Nigéria',
    'South Africa': 'Afrique du Sud',
    'Tanzania': 'Tanzanie',
    'Uganda': 'Ouganda',
    'Ethiopia': 'Éthiopie',
    'Zambia': 'Zambie',
    'Egypt': 'Égypte',
    'Commercial / Taxi': 'Véhicule commercial / taxi',
    'Bus / Minibus': 'Bus / minibus',
    'Registration / Renewal Type': 'Type de démarche',
    'Annual Renewal': 'Renouvellement annuel',
    'First Registration (new vehicle)': 'Première immatriculation',
    'Change of Ownership': 'Changement de propriétaire',
    'Current Registration Expiry Date': 'Date d’expiration actuelle',
    'Leave blank if unknown': 'Laissez vide si la date est inconnue',
    'Annual Renewal Fee': 'Frais annuels du modèle',
    'Days Until Expiry': 'Jours avant expiration',
    'Registration valid': 'Immatriculation valide',
    'days until renewal due. Next renewal:': 'jours avant l’échéance. Prochain renouvellement :',
    'Registration expires soon — only': 'L’immatriculation expire bientôt — seulement',
    'days left! Renew now to avoid fines and insurance invalidation.': 'jours restants. Renouvelez-la pour éviter les amendes et l’invalidation de l’assurance.',
    'Registration EXPIRED': 'Immatriculation EXPIRÉE depuis',
    'days ago! Your insurance may be void. Do not drive until renewed. Fines apply.': 'jours. L’assurance peut être invalide. Ne conduisez pas avant le renouvellement.',
    'Registration details for': 'Informations d’immatriculation pour',
    'shown below. Enter expiry date above to check if renewal is due.': 'affichées ci-dessous. Saisissez la date d’expiration pour vérifier l’échéance.',
    'Renewal Fee': 'Frais de renouvellement',
    'Lapsed Fine': 'Pénalité de retard',
    'Renewal Frequency': 'Fréquence de renouvellement',
    'days remaining': 'jours restants',
    'Where to renew:': 'Où renouveler :',
    'Current Registration Certificate': 'Certificat d’immatriculation actuel',
    'Valid Road Worthiness Certificate': 'Certificat de contrôle technique valide',
    'Valid Insurance Certificate (third-party minimum)': 'Attestation d’assurance valide (responsabilité civile au minimum)',
    'Proof of Previous Year Payment': 'Preuve de paiement de l’année précédente',
    'Vehicle Identification Number (VIN) check': 'Vérification du numéro d’identification du véhicule (VIN)',
    'Owner ID card / Passport': 'Pièce d’identité ou passeport du propriétaire',
    'offices nationwide': 'dans les bureaux du pays',
    '/month': '/mois'
  },
  roadworthiness: {
    'Roadworthiness Details': 'Détails de la visite technique',
    'Vehicle Age (years)': 'Âge du véhicule (années)',
    'Inspection Type': 'Type de contrôle',
    'Interactive': 'Interactif',
    'Private Car (up to 8 seats)': 'Voiture particulière (jusqu’à 8 places)',
    'PSV / Matatu / Taxi': 'Transport collectif / matatu / taxi',
    'Motorcycle / Boda-Boda': 'Moto / boda-boda',
    'Inspection Checklist': 'Checklist de contrôle',
    'Brakes': 'Freins',
    'Foot brake, handbrake, brake lights working': 'Frein principal, frein à main et feux stop en état',
    'Headlights': 'Phares',
    'Low beam, high beam, clean and aligned': 'Feux de croisement et de route propres et réglés',
    'Indicators & Hazards': 'Clignotants et feux de détresse',
    'All four indicators flashing correctly': 'Les quatre clignotants fonctionnent correctement',
    'Tyres': 'Pneus',
    'Tread depth ≥ 1.6mm, no bulges or cracks': 'Profondeur ≥ 1,6 mm, sans hernie ni fissure',
    'Windscreen': 'Pare-brise',
    'No cracks in driver’s line of sight, wipers work': 'Aucune fissure dans le champ de vision, essuie-glaces fonctionnels',
    'Horn': 'Klaxon',
    'Audible horn in working condition': 'Klaxon audible et fonctionnel',
    'Seat Belts': 'Ceintures de sécurité',
    'All seat belts present and latching correctly': 'Toutes les ceintures sont présentes et se verrouillent',
    'Exhaust': 'Échappement',
    'No excessive smoke, secure and not dragging': 'Pas de fumée excessive, fixation correcte',
    'Steering': 'Direction',
    'No excessive play, power steering working': 'Pas de jeu excessif, assistance fonctionnelle',
    'Mirrors': 'Rétroviseurs',
    'All mirrors present, clean, and adjustable': 'Tous les rétroviseurs sont présents, propres et réglables',
    'Fire Extinguisher': 'Extincteur',
    'Present, mounted, within service date': 'Présent, fixé et dans sa période de validité',
    'First Aid Kit': 'Trousse de secours',
    'Sealed first aid kit present in vehicle': 'Trousse scellée présente dans le véhicule',
    'Warning Triangles': 'Triangles de signalisation',
    'Two reflective triangles (or one in some countries)': 'Deux triangles réfléchissants (ou un selon le pays)',
    'Number Plates': 'Plaques d’immatriculation',
    'Front and rear plates legible and correct': 'Plaques avant et arrière lisibles et conformes'
  },
  'vehicle-depreciation': {
    'Vehicle Purchase Details': 'Détails d’achat du véhicule',
    'Original Purchase Price': 'Prix d’achat initial',
    'Current Vehicle Age (years)': 'Âge actuel (années)',
    'Annual Mileage (km)': 'Kilométrage annuel (km)',
    'Estimated Current Value': 'Valeur actuelle estimée',
    'Current Market Value': 'Valeur actuelle du marché',
    'Total depreciation:': 'Dépréciation totale :',
    'of purchase price': 'du prix d’achat',
    'Current Value': 'Valeur actuelle',
    '5-Year Value': 'Valeur après 5 ans',
    '10-Year Value': 'Valeur après 10 ans',
    '5-Année Value': 'Valeur après 5 ans',
    '10-Année Value': 'Valeur après 10 ans',
    'Total 10yr Loss': 'Perte totale sur 10 ans',
    'Depreciation Rate': 'Taux de dépréciation',
    'Value Lost': 'Valeur perdue',
    'Market Value': 'Valeur de marché',
    '% of Original': '% de la valeur initiale',
    'Best time to sell:': 'Meilleur moment pour vendre :',
    'At this point, the steepest depreciation curve has flattened and you retain more value per year of use. Selling before year 3 means absorbing the worst depreciation without enough benefit. Holding beyond year 8 gives very slow further depreciation but increases maintenance risk.': 'À ce stade, la baisse la plus forte est passée et vous conservez davantage de valeur par année d’usage. Vendre avant la troisième année revient à absorber la plus forte dépréciation sans assez d’usage. Après la huitième année, la dépréciation ralentit mais le risque d’entretien augmente.'
  },
  'fleet-fuel': {
    'Fleet Details': 'Détails de la flotte',
    'Number of Vehicles': 'Nombre de véhicules',
    'Average Daily Distance per Vehicle (km)': 'Distance quotidienne moyenne par véhicule (km)',
    'Fuel Consumption (L/100km)': 'Consommation (L/100 km)',
    'Fuel Price per Litre': 'Prix saisi par litre',
    'Working Days per Month': 'Jours d’activité par mois',
    'All vehicles': 'Tous les véhicules',
    'operating days': 'jours d’activité',
    '12 months': '12 mois',
    'Metric': 'Indicateur',
    'Full Fleet': 'Flotte entière',
    'Daily km': 'Kilomètres quotidiens',
    'Litres consumed/day': 'Litres consommés par jour',
    'Daily fuel cost': 'Coût quotidien du carburant',
    'Monthly fuel cost': 'Coût mensuel du carburant',
    'Annual fuel cost': 'Coût annuel du carburant',
    'Optimization tip:': 'Conseil d’optimisation :',
    'A 10% improvement in fuel efficiency across your fleet of': 'Une amélioration de 10 % de l’efficacité énergétique de votre flotte de',
    'vehicles would save approximately': 'véhicules permettrait d’économiser environ',
    'per year. Consider: GPS tracking & route optimization, driver efficiency training, regular vehicle maintenance, and bulk fuel purchasing agreements.': 'par an. Envisagez le suivi GPS, l’optimisation des trajets, la formation des conducteurs, l’entretien régulier et l’achat groupé de carburant.'
  },
  'last-mile-delivery': {
    'Delivery Operation Details': 'Détails de l’opération de livraison',
    'Stops per Route': 'Arrêts par tournée',
    'Route Distance (km)': 'Distance de la tournée (km)',
    'Failed Delivery Rate (%)': 'Taux d’échec de livraison (%)',
    'Number of Deliveries per Day': 'Nombre de livraisons par jour',
    'Area Type': 'Type de zone',
    'Dense Urban (high-rise, narrow streets)': 'Zone urbaine dense (immeubles, rues étroites)',
    'Urban / City (standard streets)': 'Zone urbaine (rues standard)',
    'Suburban (spread out, good roads)': 'Périphérie (dispersée, bonnes routes)',
    'Rural (poor roads, long distances)': 'Zone rurale (routes difficiles, longues distances)',
    'Driver Daily Wage (USD)': 'Coût quotidien du conducteur (USD)',
    'Package Size / Weight': 'Taille et poids du colis',
    'Small (under 5kg)': 'Petit (moins de 5 kg)',
    'Medium (5-20kg)': 'Moyen (5 à 20 kg)',
    'Large (20-50kg)': 'Grand (20 à 50 kg)',
    'Bulky / Oversized': 'Volumineux / hors gabarit',
    'Van': 'Fourgonnette',
    'per delivery': 'par livraison',
    'vehicle(s)': 'véhicule(s)',
    'Most Efficient': 'Le plus efficace',
    'Highest Cost': 'Coût le plus élevé',
    'Best Cost/Delivery': 'Meilleur coût par livraison',
    'Daily Total Cost': 'Coût quotidien total',
    'Deliveries/Day': 'Livraisons par jour',
    'Monthly Volume': 'Volume mensuel',
    'deliveries/day in a dense urban area,': 'livraisons par jour en zone urbaine dense,',
    'is most cost-effective at': 'est la solution la plus économique à',
    'using': 'avec',
    'Cluster deliveries by neighbourhood to minimize backtracking and reduce cost by a further 15-25%.': 'Regroupez les livraisons par quartier pour limiter les retours et réduire davantage le coût de 15 à 25 %.'
  },
  'parking-fee': {
    'Parking Details': 'Détails du stationnement',
    '15 Countries': '15 pays',
    'vs Ride-Hailing': 'par rapport au VTC',
    'Nigeria': 'Nigéria',
    'South Africa': 'Afrique du Sud',
    'Egypt': 'Égypte',
    'Ethiopia': 'Éthiopie',
    'Tanzania': 'Tanzanie',
    'City / Area Type': 'Zone',
    'CBD / City Centre': 'Centre-ville',
    'Suburbs': 'Banlieue',
    'Shopping Mall': 'Centre commercial',
    'Hours Parked per Day': 'Heures stationnées par jour',
    'Typical workday: 8-9 hours': 'Journée de travail indicative : 8 à 9 heures',
    'Days per Month': 'Jours par mois',
    'Monthly Permit Available?': 'Abonnement mensuel disponible ?',
    'No — hourly only': 'Non — tarif horaire uniquement',
    'One-Way Commute Distance (km)': 'Distance aller domicile-travail (km)',
    'For ride-hailing comparison': 'Pour la comparaison avec un VTC',
    'Cost/Hour': 'Coût par heure',
    '/hr': '/h',
    'Monthly Parking Cost': 'Coût mensuel du stationnement',
    'Monthly Ride-Hailing': 'Coût mensuel du VTC',
    'trips': 'trajets',
    'days': 'jours',
    'Difference': 'Écart',
    'Cheaper Option': 'Option la moins chère',
    'Ride-Hailing': 'VTC',
    'Ride-hailing is cheaper by': 'Le VTC coûte moins cher de',
    'Parking is cheaper by': 'Le stationnement coûte moins cher de',
    '/month in your scenario. You also save on fuel, maintenance, and parking search time. Consider switching to ride-hailing for your daily commute.': 'par mois dans ce scénario. Vous évitez aussi carburant, entretien et recherche d’une place. Envisagez le VTC pour vos trajets quotidiens.',
    '/month in your scenario. Keeping the car parked remains the cheaper option for your daily commute.': 'par mois dans ce scénario. Le stationnement reste l’option la moins chère pour vos trajets quotidiens.'
  },
  'route-cost': {
    'Route Cargo Details': 'Détails du fret',
    'Road vs Rail vs Sea': 'Route, rail et mer',
    'Cargo Weight (tonnes)': 'Poids du fret (tonnes)',
    'Number of Border Crossings': 'Nombre de frontières',
    'Cargo Value (USD)': 'Valeur du fret (USD)',
    'Fuel Price (USD/litre)': 'Prix du carburant saisi (USD/litre)',
    'Cargo Sensitivity': 'Sensibilité du fret',
    'Low (bulk, non-perishable)': 'Faible (vrac, non périssable)',
    'Medium (manufactured goods)': 'Moyenne (produits manufacturés)',
    'High (perishable, time-sensitive)': 'Élevée (périssable, sensible au délai)',
    'Road Freight': 'Fret routier',
    'Rail Freight': 'Fret ferroviaire',
    'Sea / Coastal': 'Mer ou cabotage',
    'days transit': 'jours de transit',
    'Road': 'Route',
    'Rail': 'Rail',
    'Sea': 'Mer',
    'Freight Base Rate': 'Tarif de base du fret',
    'Fuel/Handling': 'Carburant et manutention',
    'Border Costs': 'Coûts aux frontières',
    'Time Value of Cargo': 'Valeur du temps du fret',
    'Total': 'Total',
    'Recommendation:': 'Recommandation :',
    'Sea freight appears most cost-effective for this route at an estimated': 'Le fret maritime semble le plus économique pour ce trajet, avec une estimation de',
    'Rail freight appears most cost-effective for this route at an estimated': 'Le fret ferroviaire semble le plus économique pour ce trajet, avec une estimation de',
    'Road freight appears most cost-effective for this route at an estimated': 'Le fret routier semble le plus économique pour ce trajet, avec une estimation de',
    'total. Note: rail and sea options may not be available on all African routes. Road is the most flexible but border crossings add significant time and cost. These are indicative estimates — get formal quotes from freight forwarders for actual bookings.': 'au total. Le rail et la mer ne sont pas disponibles sur tous les trajets africains. La route est plus flexible, mais les frontières ajoutent délai et coût. Ces estimations sont indicatives : demandez des devis formels aux transitaires avant toute réservation.'
  },
  'toll-calc': {
    'Route & Trip Details': 'Détails du trajet',
    '15 Countries': '15 pays',
    'Nigeria': 'Nigéria',
    'South Africa': 'Afrique du Sud',
    'Kenya (no national tolls)': 'Kenya (aucun péage national)',
    'Ethiopia': 'Éthiopie',
    'Tanzania': 'Tanzanie',
    'Cameroon': 'Cameroun',
    'Expressway': 'autoroute',
    'Trips per Month (commute)': 'Trajets par mois',
    'Car / Light Motor Vehicle': 'Voiture ou véhicule léger',
    'Minibus / Kombi': 'Minibus',
    'Heavy Truck': 'Poids lourd',
    'Return (same day)': 'Aller-retour (même jour)',
    'Toll Gate': 'Poste de péage',
    'Car (Cash)': 'Voiture (comptant)',
    'With E-tag': 'Avec badge',
    'E-tag / Tag (10-15% discount)': 'Badge / e-tag (réduction supposée de 10 à 15 %)',
    'Switch to e-tag / tag payment to save approximately 10-15% (': 'Passez au paiement par badge pour économiser environ 10 à 15 % (',
    '/year on this route).': 'par an sur ce trajet).'
  },
  'truck-load': {
    'Load & Route Details': 'Chargement et trajet',
    'Truck Type': 'Type de camion',
    'Truck Capacity (tonnes)': 'Capacité du camion (tonnes)',
    'Actual Load Weight (tonnes)': 'Charge réelle (tonnes)',
    'Total Trip Cost (fuel + driver + tolls)': 'Coût total du trajet',
    'Fuel Consumption (L/100km)': 'Consommation (L/100 km)',
    'utilization': 'd’utilisation',
    'Load Utilization': 'Taux de chargement',
    'Cost/Tonne-km': 'Coût par tonne-km',
    'Cost/Tonne': 'Coût par tonne',
    'Empty Capacity': 'Capacité inutilisée',
    'Wasted Capacity Cost': 'Coût de la capacité inutilisée',
    'Excellent load efficiency': 'Excellent taux de chargement',
    'Your truck is well-utilized on this route. Estimated wasted capacity cost:': 'Votre camion est bien utilisé sur ce trajet. Coût estimé de la capacité inutilisée :',
    'Moderate efficiency': 'Taux de chargement moyen',
    'You have': 'Vous avez',
    'tonnes of unused capacity. Consider consolidating with other shipments to reduce the cost per tonne-km by up to': 'tonnes de capacité inutilisée. Regroupez d’autres expéditions pour réduire le coût par tonne-km jusqu’à',
    'Low efficiency': 'Faible taux de chargement',
    'Running at less than 65% capacity significantly increases your cost per tonne-km. Consolidate loads, postpone the trip until you have more cargo, or use a smaller truck for this load.': 'Une charge inférieure à 65 % augmente fortement le coût par tonne-km. Regroupez les charges, attendez davantage de fret ou utilisez un camion plus petit.'
  },
  'vehicle-operating-cost': {
    'Vehicle Details & Annual Usage': 'Véhicule et utilisation annuelle',
    'Vehicle Details &amp; Annual Usage': 'Véhicule et utilisation annuelle',
    'Planning assumptions:': 'Hypothèses de planification :',
    'maintenance is 6% of vehicle value (4% for motorcycles), registration is 1.5%, and annual depreciation is 20% for SUVs or 22% for other listed types. These are fixed model inputs, not official rates or live market data.': 'l’entretien représente 6 % de la valeur du véhicule (4 % pour les motos), l’immatriculation 1,5 %, et la dépréciation annuelle 20 % pour les SUV ou 22 % pour les autres types listés. Ces valeurs sont des paramètres fixes du modèle, pas des taux officiels ni des données de marché en direct.',
    'Planning assumptions: maintenance is 6% of vehicle value (4% for motorcycles), registration is 1.5%, and annual depreciation is 20% for SUVs or 22% for other listed types. These are fixed model inputs, not official rates or live market data.': 'Hypothèses de planification : l’entretien représente 6 % de la valeur du véhicule (4 % pour les motos), l’immatriculation 1,5 %, et la dépréciation annuelle 20 % pour les SUV ou 22 % pour les autres types listés. Ces valeurs sont des paramètres fixes du modèle, pas des taux officiels ni des données de marché en direct.',
    'Sedan / Saloon': 'Berline',
    'Van / Minibus': 'Fourgonnette / minibus',
    'Vehicle Value (USD)': 'Valeur du véhicule (USD)',
    'Annual Distance (km)': 'Distance annuelle (km)',
    'Fuel Consumption (L/100km)': 'Consommation (L/100 km)',
    'Fuel Price (USD/litre)': 'Prix du carburant saisi (USD/litre)',
    'Need a current planning input? Compare': 'Besoin d’une hypothèse actuelle ? Comparez',
    'African petrol and diesel prices in AfroFuel': 'les prix africains de l’essence et du diesel dans AfroFuel',
    'Annual Insurance Premium (USD)': 'Assurance annuelle (USD)',
    'Monthly Parking Cost (USD)': 'Stationnement mensuel (USD)',
    'Annual Toll Costs (USD)': 'Péages annuels (USD)',
    'per km': 'par km',
    'per month': 'par mois',
    'Fuel': 'Carburant',
    'Depreciation': 'Dépréciation',
    'Maintenance & Tyres': 'Entretien et pneus',
    'Insurance': 'Assurance',
    'Parking': 'Stationnement',
    'Registration & Road Tax': 'Immatriculation et taxe routière',
    'Tolls': 'Péages',
    'Total Annual Cost': 'Coût annuel total',
    'Monthly Cost': 'Coût mensuel',
    'Cost per km': 'Coût par km',
    'Annual Fuel': 'Carburant annuel',
    'Depreciation Loss': 'Perte de valeur',
    'Your vehicle costs approximately': 'Votre véhicule coûte environ',
    '/month to own and operate. Fuel represents': 'par mois à posséder et utiliser. Le carburant représente',
    'of your total cost. Consider carpooling, optimising routes, or switching to a more fuel-efficient vehicle to reduce costs.': 'du coût total. Envisagez le covoiturage, l’optimisation des trajets ou un véhicule plus économe.'
  },
  'vehicle-tracker-roi': {
    'Vehicle Tracker Details': 'Détails du traceur',
    'Number of Vehicles': 'Nombre de véhicules',
    'Vehicle Value (per vehicle, local currency)': 'Valeur par véhicule (devise locale)',
    'Annual Insurance Premium (per vehicle)': 'Assurance annuelle par véhicule',
    'Monthly Fuel Cost (per vehicle)': 'Carburant mensuel par véhicule',
    'Tracker Type': 'Type de traceur',
    'Tracker Cost (hardware, per vehicle)': 'Coût du matériel par véhicule',
    'Monthly Subscription (per vehicle, 0 if none)': 'Abonnement mensuel par véhicule',
    'ROI Breakdown': 'Détail du ROI',
    'Benefit Category': 'Catégorie de bénéfice',
    '5-Year Cost vs Savings': 'Coût et économies sur 5 ans',
    '/yr': '/an',
    'Setup cost:': 'Coût initial :',
    'vehicle': 'véhicule',
    'months': 'mois',
    'Insurance Savings': 'Économies d’assurance',
    'premium discount': 'de réduction supposée de prime',
    'fuel reduction': 'de réduction supposée du carburant',
    'Theft Protection': 'Protection contre le vol',
    'annual risk value': 'valeur de risque annuelle',
    'year 1': 'première année',
    'All Vehicles/Year': 'Tous les véhicules par an',
    'All Vehicles/Année': 'Tous les véhicules par an',
    'Assumption': 'Hypothèse',
    'Insurance premium discount': 'Réduction supposée de la prime d’assurance',
    'of annual premium': 'de la prime annuelle',
    'Fuel savings (driver behaviour)': 'Économies de carburant (conduite)',
    'annual fuel': 'de carburant annuel',
    'Theft prevention value': 'Valeur de prévention du vol',
    'annual risk': 'de risque annuel',
    'recovery rate': 'de taux de récupération',
    'TOTAL ANNUAL BENEFIT': 'BÉNÉFICE ANNUEL TOTAL',
    'Before subscription cost': 'Avant le coût de l’abonnement',
    'Annual subscription cost': 'Coût annuel de l’abonnement',
    'Annuel subscription cost': 'Coût annuel de l’abonnement',
    '(cost)': '(coût)',
    '/month': '/mois',
    'NET ANNUAL BENEFIT': 'BÉNÉFICE ANNUEL NET',
    'After all costs': 'Après tous les coûts',
    'Total Cost': 'Coût total',
    'Total Benefit': 'Bénéfice total',
    'Net': 'Net',
    'Cumulative': 'Cumul',
    'local, widespread': 'local, largement disponible',
    'enterprise fleet': 'pour flotte d’entreprise',
    'premium telematics': 'télématique haut de gamme',
    'budget basic tracker': 'traceur simple à petit budget',
    'Fleet Management Bonus': 'Bénéfice de gestion de flotte'
  }
};

function translateChunk(chunk, translations) {
  return Object.keys(translations)
    .sort((left, right) => right.length - left.length)
    .reduce((value, source) => {
      if (source.length > 5) return value.split(source).join(translations[source]);
      const trimmed = value.trim();
      return trimmed === source ? value.replace(source, translations[source]) : value;
    }, chunk);
}

function translateVisibleHtml(html, app) {
  const translations = Object.assign({}, commonTranslations, appTranslations[app.englishId] || {});
  let inScript = false;
  let inStyle = false;
  return html.split(/(<[^>]+>)/g).map((chunk) => {
    if (!chunk.startsWith('<')) {
      return inScript || inStyle ? chunk : translateChunk(chunk, translations);
    }
    if (/^<script\b/i.test(chunk)) inScript = true;
    if (/^<\/script/i.test(chunk)) inScript = false;
    if (/^<style\b/i.test(chunk)) inStyle = true;
    if (/^<\/style/i.test(chunk)) inStyle = false;
    if (inScript || inStyle) return chunk;
    return chunk.replace(/\b(placeholder|aria-label|title)="([^"]*)"/g, (match, attribute, value) => {
      return `${attribute}="${escapeHtml(translations[value] || value)}"`;
    });
  }).join('');
}

function removeTagBySrc(html, pattern) {
  return html.replace(new RegExp(`<script\\b[^>]*src=["'][^"']*${pattern}[^"']*["'][^>]*>\\s*</script>`, 'gi'), '');
}

function sourceProof(app, sourceManifest, parityManifest) {
  const sourceTool = sourceManifest.tools.find((tool) => tool.id === app.englishId);
  const sourceIds = sourceTool ? sourceTool.sourceIds : [];
  const sources = sourceIds.map((id) => sourceManifest.sources.find((source) => source.id === id)).filter(Boolean);
  const uiTranslations = Object.assign({}, commonTranslations, appTranslations[app.englishId] || {});
  const sourceTypeLabels = {
    'customs-agency': 'douane',
    'revenue-authority': 'administration fiscale',
    'port-authority': 'autorité portuaire',
    'fuel-regulator': 'régulateur des carburants',
    'operator-page': 'page de l’opérateur',
    'urban-transport-authority': 'autorité de transport urbain',
    'city-authority': 'autorité municipale',
    'vehicle-registration-portal': 'portail d’immatriculation',
    'vehicle-registration-authority': 'autorité d’immatriculation',
    'city-parking-authority': 'autorité de stationnement'
  };
  const sourceLinks = sources.slice(0, 7).map((source) =>
    `<li><a href="${escapeHtml(source.url)}" rel="noopener">${escapeHtml(source.authority)}</a> — ${escapeHtml(sourceTypeLabels[source.sourceType] || source.sourceType)}</li>`
  ).join('');
  return `<!-- FR_TRANSPORT_PARITY_START -->
<script type="application/json" data-fr-transport-ui-translations>${escapeJsonForHtml(uiTranslations)}</script>
<section class="fr-transport-proof" aria-labelledby="fr-transport-proof-title">
  <h2 id="fr-transport-proof-title">Sources, fraîcheur et confidentialité</h2>
  <figure class="fr-transport-proof__artwork">
    <img data-fr-transport-artwork src="/assets/img/tools/${app.imageId}.webp" alt="Illustration de ${escapeHtml(app.name)}" loading="eager" decoding="async">
    <figcaption>Illustration associée à ${escapeHtml(app.name)}</figcaption>
  </figure>
  <div class="fr-transport-proof__grid">
    <div class="fr-transport-proof__item"><strong>${escapeHtml(parityManifest.sourceReviewDate)}</strong><span>Dernière revue enregistrée</span></div>
    <div class="fr-transport-proof__item"><strong>${parityManifest.sourceReviewCadenceDays} jours</strong><span>Cadence prévue, revue effectuée dans le délai</span></div>
    <div class="fr-transport-proof__item"><strong>Confiance prudente</strong><span>${parityManifest.sourceChangedCount} sources modifiées et ${parityManifest.sourceBlockedManualCount} bloquées ou manuelles restent à examiner ; aucune donnée tarifaire en direct</span></div>
  </div>
  <p class="fr-transport-proof__warning"><strong>Limite non négociable :</strong> ${escapeHtml(parityManifest.claimBoundary)}</p>
  <p>Les champs et le résultat restent dans ce navigateur. Aucun document, identifiant, trajet, devis, numéro de châssis ou détail client n’est envoyé par cette couche française. L’assistant central reste déterministe sans consentement ; tout appel à un modèle exige un choix explicite et conserve un parcours local.</p>
  <details>
    <summary>Sources de vérification associées</summary>
    <ul>${sourceLinks || '<li>Aucune source liée dans le registre Transport ; vérification manuelle obligatoire.</li>'}</ul>
  </details>
  <div class="fr-transport-proof__actions">
    <button type="button" data-fr-transport-download-text>Télécharger le résumé TXT</button>
    <button type="button" class="secondary" data-fr-transport-download-pdf>Télécharger le PDF local</button>
    <a class="secondary" href="/fr/ai/?outil=${encodeURIComponent(app.englishId)}">Assistant AfroTools (optionnel)</a>
  </div>
  <p class="fr-transport-proof__status" data-fr-transport-status aria-live="polite">Lancez le calcul, puis exportez le résultat local.</p>
  <p class="fr-transport-proof__error" data-fr-transport-error role="alert"></p>
</section>
<!-- FR_TRANSPORT_PARITY_END -->`;
}

function relatedTools(app, apps) {
  const related = apps.filter((candidate) => candidate.englishId !== app.englishId).slice(0, 6);
  return `<nav class="fr-transport-proof" aria-label="Outils Transport associés">
  <h2>Outils Transport associés</h2>
  <ul>${related.map((candidate) => `<li><a href="${candidate.frenchRoute}">${escapeHtml(candidate.name)}</a></li>`).join('')}</ul>
</nav>`;
}

function metadataTags(app, englishHtml) {
  const absoluteEnglish = `https://afrotools.com${app.englishRoute}`;
  const absoluteFrench = `https://afrotools.com${app.frenchRoute}`;
  const swahili = alternateHref(englishHtml, 'sw');
  const tags = [
    `<link rel="canonical" href="${absoluteFrench}">`,
    `<link rel="alternate" hreflang="en" href="${absoluteEnglish}">`,
    `<link rel="alternate" hreflang="fr" href="${absoluteFrench}">`
  ];
  if (swahili) tags.push(`<link rel="alternate" hreflang="sw" href="${swahili}">`);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${absoluteEnglish}">`);
  return tags.join('\n');
}

function applicationSchema(app) {
  return `<script type="application/ld+json" data-fr-transport-schema>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    url: `https://afrotools.com${app.frenchRoute}`,
    inLanguage: 'fr',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    image: `https://afrotools.com/assets/img/tools/${app.imageId}.webp`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  })}</script>`;
}

function applyRouteSpecificFrenchCorrections(html, app) {
  if (app.englishId === 'delivery-cost') {
    return html
      .replace(/\s+onchange="updateDelProviders\(\)"/g, '')
      .replace(/<input\b(?=[^>]*\bid=["']delWeight["'])[^>]*>/i, (input) =>
        input.replace(/\bvalue=["']5["']/i, 'value="5.1"'));
  }
  if (app.englishId === 'route-cost') {
    return html.replace(/<input\b(?=[^>]*\bid=["']routeWeight["'])[^>]*>/i, (input) =>
      input.replace(/\bvalue=["']20["']/i, 'value="20.1"'));
  }
  if (app.englishId === 'roadworthiness') {
    return html
      .replace('id="rwScore"', 'id="rwScore" data-fr-transport-result')
      .replace(
        `return '<div class="check-item" id="ci_' + item.id + '" onclick="toggleCheck(\\'' + item.id + '\\')">' +`,
        `return '<button type="button" class="check-item" aria-label="' + item.name + ' : non vérifié" id="ci_' + item.id + '" onclick="toggleCheck(\\'' + item.id + '\\')">' +`
      )
      .replace(
        `      '</div>';\n  }).join('');`,
        `      '</button>';\n  }).join('');`
      )
      .replace(
        `    ci.className = 'check-item pass';\n    ct.textContent = '✓';`,
        `    ci.className = 'check-item pass';\n    ci.setAttribute('aria-label', ci.querySelector('.check-name').textContent + ' : conforme');\n    ct.textContent = '✓';`
      )
      .replace(
        `    ci.className = 'check-item fail';\n    ct.textContent = '✗';`,
        `    ci.className = 'check-item fail';\n    ci.setAttribute('aria-label', ci.querySelector('.check-name').textContent + ' : à corriger');\n    ct.textContent = '✗';`
      )
      .replace(
        `    ci.className = 'check-item';\n    ct.textContent = '—';`,
        `    ci.className = 'check-item';\n    ci.setAttribute('aria-label', ci.querySelector('.check-name').textContent + ' : non vérifié');\n    ct.textContent = '—';`
      )
      .replace(
        `document.getElementById('rwScore').textContent = 'Tap each item to mark Pass / Fail';`,
        `document.getElementById('rwScore').textContent = 'Activez chaque point pour le marquer conforme, à corriger ou non vérifié';`
      )
      .replace(
        `document.getElementById('rwScore').textContent = passed + ' passed, ' + failed + ' failed, ' + (total - keys.length) + ' not checked';`,
        `document.getElementById('rwScore').textContent = passed + ' conformes, ' + failed + ' à corriger, ' + (total - keys.length) + ' non vérifiés';`
      );
  }
  if (app.englishId === 'vehicle-registration') {
    return html
      .replace('Deadline Calculator</span>', 'Calculateur d’échéance</span>')
      .replace(
        "return '<li><span class=\"doc-check\">&#x2713;</span>' + d + '</li>';",
        "return '<li><span class=\"doc-check\">&#x2713;</span><span class=\"doc-label\">' + d + '</span></li>';"
      );
  }
  if (app.englishId === 'car-import-cost') {
    return html
      .replace('What to do next</h2>', 'Prochaine étape</h2>')
      .replace(
        /<script\b(?![^>]*\bid=)(?=[^>]*\bsrc=["']\/assets\/js\/lib\/analytics\.js(?:\?[^"']*)?["'])/i,
        '<script id="afro-analytics-js"'
      );
  }
  if (app.englishId === 'parking-fee') {
    return html.replace(/\s+onchange="updateParkCity\(\)"/g, '');
  }
  return html;
}

function localizePage(app, parityManifest, sourceManifest, englishHtml) {
  let html = englishHtml;
  html = html.split(`https://afrotools.com${app.englishRoute}`).join(`https://afrotools.com${app.frenchRoute}`);
  html = html.replace(/<html\b([^>]*)\blang=["'][^"']+["']([^>]*)>/i, '<html$1lang="fr"$2>');
  html = html.replace(
    /\bdata-chat-bundle=["'][^"']+["']/i,
    'data-chat-bundle="/assets/js/components/site-assistant.min.js"'
  );
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(app.name)} | AfroTools</title>`);
  html = html.replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
    `<meta name="description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(app.name)} | AfroTools">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i,
    `<meta property="og:url" content="https://afrotools.com${app.frenchRoute}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:locale["'])[^>]*>\s*/gi, '');
  html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(app.name)} | AfroTools">`);
  html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, '');
  html = html.replace(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=)[^>]*>\s*/gi, '');
  html = html.replace('</head>', `<meta property="og:locale" content="fr_FR">
${metadataTags(app, englishHtml)}
${applicationSchema(app)}
<link rel="stylesheet" href="/assets/css/french-transport-parity.css">
</head>`);
  html = html.replace(/<body\b([^>]*)>/i,
    `<body$1 data-fr-transport-parity="${escapeHtml(app.englishId)}" data-fr-transport-name="${escapeHtml(app.name)}" data-fr-transport-route="${escapeHtml(app.frenchRoute)}" data-fr-transport-review-date="${escapeHtml(parityManifest.sourceReviewDate)}">`);
  html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, `<h1>${escapeHtml(app.name)}</h1>`);
  html = html.replace(/<p class="tool-hero-sub">[\s\S]*?<\/p>/i, `<p class="tool-hero-sub">${escapeHtml(app.description)}</p>`);
  html = html.replace(/<section class="df-upgrade"[\s\S]*?<\/section>\s*/gi, '');
  html = html.replace(/<section class="df-faq"[\s\S]*?<\/section>\s*/gi, '');
  html = removeElementsByClass(html, 'faq-section');
  html = removeElementsByClass(html, 'tool-verification-sec');
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>\s*/gi, '');
  html = html.replace(/<afro-related-tools\b[\s\S]*?<\/afro-related-tools>/gi, relatedTools(app, parityManifest.apps));
  html = html.replace(/<afro-business-cta\b[\s\S]*?<\/afro-business-cta>/gi, '');
  html = removeTagBySrc(html, 'english-df-app-upgrades');
  html = removeTagBySrc(html, 'transport-focus');
  html = removeTagBySrc(html, 'business-cta');
  html = removeTagBySrc(html, 'source-confidence');
  const routeMap = new Map(parityManifest.apps.map((item) => [item.englishRoute, item.frenchRoute]));
  for (const [englishRoute, frenchRoute] of routeMap) {
    html = html.split(`href="${englishRoute}"`).join(`href="${frenchRoute}"`);
  }
  html = translateVisibleHtml(html, app);
  html = applyRouteSpecificFrenchCorrections(html, app);
  const proof = sourceProof(app, sourceManifest, parityManifest);
  html = html.replace(/<afro-footer\b/i, `${proof}\n<afro-footer`);
  const carsParityScript = app.englishId === 'car-price-intelligence'
    ? '\n<script src="/assets/js/pages/french-cars-directory-parity.js" defer></script>'
    : '';
  html = html.replace('</body>', `<script src="/assets/js/lib/pdf-template.js" defer></script>
<script src="/assets/js/pages/french-transport-parity.js" defer></script>
${carsParityScript}
</body>`);
  html = html.replace(/"inLanguage"\s*:\s*"en"/g, '"inLanguage":"fr"');
  html = html.replace(/"url"\s*:\s*"https:\/\/afrotools\.com[^"]+"/, `"url":"https://afrotools.com${app.frenchRoute}"`);
  return normalizeGeneratedHtml(html);
}

function enhanceExistingNativePage(app, parityManifest, sourceManifest, englishHtml) {
  const filePath = routeFile(app.frenchRoute);
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(app.name)} | AfroTools</title>`);
  html = html.replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
    `<meta name="description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(app.name)} | AfroTools">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i,
    `<meta property="og:url" content="https://afrotools.com${app.frenchRoute}">`);
  html = html.replace(/<meta\b(?=[^>]*\bproperty=["']og:locale["'])[^>]*>\s*/gi, '');
  html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(app.name)} | AfroTools">`);
  html = html.replace(/<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(app.description)}">`);
  html = html.replace(/<!-- FR_TRANSPORT_PARITY_START -->[\s\S]*?<!-- FR_TRANSPORT_PARITY_END -->\s*/g, '');
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, '');
  html = html.replace(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=)[^>]*>\s*/gi, '');
  html = html.replace(
    /<link\b[^>]*href=["']\/assets\/css\/french-transport-parity\.css(?:\?[^"']*)?["'][^>]*>\s*/gi,
    ''
  );
  html = html.replace(/<script\b[^>]*data-fr-transport-schema[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  html = removeTagBySrc(html, 'french-transport-parity');
  html = removeTagBySrc(html, 'pdf-template');
  html = html.replace('</head>', `<meta property="og:locale" content="fr_FR">
${metadataTags(app, englishHtml)}
${applicationSchema(app)}
<link rel="stylesheet" href="/assets/css/french-transport-parity.css">
</head>`);
  html = html.replace(/<body\b([^>]*)>/i, (match, attributes) => {
    const clean = attributes
      .replace(/\sdata-fr-transport-parity="[^"]*"/g, '')
      .replace(/\sdata-fr-transport-name="[^"]*"/g, '')
      .replace(/\sdata-fr-transport-route="[^"]*"/g, '')
      .replace(/\sdata-fr-transport-review-date="[^"]*"/g, '');
    return `<body${clean} data-fr-transport-parity="${escapeHtml(app.englishId)}" data-fr-transport-name="${escapeHtml(app.name)}" data-fr-transport-route="${escapeHtml(app.frenchRoute)}" data-fr-transport-review-date="${escapeHtml(parityManifest.sourceReviewDate)}">`;
  });
  html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, `<h1>${escapeHtml(app.name)}</h1>`);
  html = html.replace(/<afro-footer\b/i, `${sourceProof(app, sourceManifest, parityManifest)}\n<afro-footer`);
  html = html.replace(/\s*<\/body>/i, '\n</body>');
  html = html.replace('</body>', `<script src="/assets/js/lib/pdf-template.js" defer></script>
<script src="/assets/js/pages/french-transport-parity.js" defer></script>
</body>`);
  html = html.replace(/"inLanguage"\s*:\s*"en"/g, '"inLanguage":"fr"');
  return normalizeGeneratedHtml(html);
}

function renderHub(manifest) {
  const lanes = [
    ['vehicle-money', 'Acheter, importer et exploiter un véhicule'],
    ['fleet-road', 'Flotte, route et conformité'],
    ['logistics-freight', 'Livraison et logistique'],
    ['city-travel', 'Déplacements urbains']
  ];
  const cards = manifest.apps.map((app) => `<a class="frt-card" href="${app.frenchRoute}" data-fr-transport-card="${app.englishId}">
  <img src="/assets/img/tools/${app.imageId}.webp" alt="" width="320" height="180" loading="lazy">
  <span>${escapeHtml(lanes.find((lane) => lane[0] === app.lane)[1])}</span>
  <h3>${escapeHtml(app.name)}</h3>
  <p>${escapeHtml(app.description)}</p>
</a>`).join('\n');
  const laneSections = lanes.map(([lane, label]) => {
    const laneApps = manifest.apps.filter((app) => app.lane === lane);
    return `<section aria-labelledby="lane-${lane}">
  <h2 id="lane-${lane}">${escapeHtml(label)}</h2>
  <ul>${laneApps.map((app) => `<li><a href="${app.frenchRoute}">${escapeHtml(app.name)}</a></li>`).join('')}</ul>
</section>`;
  }).join('\n');
  const itemList = manifest.apps.map((app, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: app.name,
    url: `https://afrotools.com${app.frenchRoute}`
  }));
  return enhanceCategory(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>18 outils Transport en français | AfroTools</title>
<meta name="description" content="Les 18 applications Transport AfroTools en français : véhicules, flotte, livraison, logistique, péages, stationnement et déplacements urbains.">
<meta property="og:title" content="18 outils Transport en français | AfroTools">
<meta property="og:description" content="Une application française native pour chacun des 18 outils Transport canoniques.">
<meta property="og:url" content="https://afrotools.com/fr/transport/">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/vehicle-operating-cost.webp">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AfroTools">
<link rel="canonical" href="https://afrotools.com/fr/transport/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/transport/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/transport/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/usafiri-na-magari/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/transport/">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/french-transport-parity.css">
<script src="/assets/js/components/navbar.js" defer></script>
<script src="/assets/js/components/footer.js" defer></script>
<script type="application/ld+json">${escapeJsonForHtml({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '18 outils Transport en français',
    description: 'Une application française native pour chacun des 18 outils Transport canoniques AfroTools.',
    url: 'https://afrotools.com/fr/transport/',
    inLanguage: 'fr',
    numberOfItems: manifest.apps.length
  })}</script>
<script type="application/ld+json">${escapeJsonForHtml({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Outils Transport en français',
    numberOfItems: manifest.apps.length,
    itemListElement: itemList
  })}</script>
<style>
body{margin:0;background:var(--color-background,#f8fafc);color:var(--color-text,#0f172a)}
.frt-hero{padding:52px 20px;background:#0f172a;color:#fff}.frt-inner{max-width:1120px;margin:auto}
.frt-hero h1{font-size:clamp(2rem,6vw,3.4rem);max-width:850px}.frt-hero p{max-width:780px;line-height:1.7;color:#dbeafe}
.frt-main{max-width:1120px;margin:auto;padding:32px 20px 72px}.frt-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.frt-card{display:block;padding:16px;border:1px solid #d7e0ea;border-radius:12px;background:#fff;color:inherit;text-decoration:none}
.frt-card img{display:block;width:100%;height:150px;object-fit:cover;border-radius:8px}.frt-card span{display:block;margin-top:12px;color:#0758b8;font-size:.78rem;font-weight:800}
.frt-card h3{margin:.4rem 0}.frt-card p{color:#52637a;line-height:1.55}.frt-lanes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:36px}
.frt-lanes section{padding:18px;border:1px solid #d7e0ea;border-radius:12px;background:#fff}.frt-lanes li{margin:.55rem 0}
html[data-theme="dark"] body{background:#0b1220;color:#e5edf7}html[data-theme="dark"] .frt-card,html[data-theme="dark"] .frt-lanes section{background:#111b2d;border-color:#334155}html[data-theme="dark"] .frt-card p{color:#cbd5e1}
@media(max-width:820px){.frt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){
.frt-hero{padding:32px 12px}.frt-inner,.frt-main,.frt-grid,.frt-card,.frt-card img,.frt-lanes,.frt-lanes section{box-sizing:border-box;min-width:0;max-width:100%}
.frt-hero h1,.frt-hero p,.frt-main h2,.frt-card span,.frt-card h3,.frt-card p,.frt-lanes h2,.frt-lanes li,.frt-lanes a{max-width:100%;overflow-wrap:anywhere;word-break:normal}
.frt-main{padding:24px 12px 48px}.frt-grid,.frt-lanes{grid-template-columns:minmax(0,1fr);gap:14px}.frt-card{width:100%;padding:12px}.frt-card img{height:auto;aspect-ratio:16/9}.frt-lanes section{width:100%;padding:12px}.frt-lanes ul{min-width:0;padding-left:24px}
}
</style>
</head>
<body>
<afro-navbar active="transport"></afro-navbar>
<header class="frt-hero"><div class="frt-inner"><nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › Transport</nav><p>Transport et logistique</p><h1>18 applications Transport, chacune disponible en français</h1><p>Chaque carte correspond à un propriétaire anglais canonique. Les calculs restent locaux et les hypothèses restent visibles. Aucun tarif, horaire, trajet, disponibilité, règlement ou statut officiel n’est présenté comme une donnée en direct.</p></div></header>
<main class="frt-main">
<section class="fr-transport-proof" aria-labelledby="frt-source-title"><h2 id="frt-source-title">Frontière de confiance</h2><p class="fr-transport-proof__warning"><strong>Revue enregistrée : ${escapeHtml(manifest.sourceReviewDate)}.</strong> Revue effectuée dans la cadence de ${manifest.sourceReviewCadenceDays} jours. ${manifest.sourceChangedCount} sources modifiées et ${manifest.sourceBlockedManualCount} sources bloquées ou manuelles restent à examiner ; aucun fait, tarif, règle, trajet ou statut n’a été accepté automatiquement.</p><p>Le hub compte exactement les 18 applications Transport canoniques. Les cinq outils transversaux visibles sur le hub anglais restent accessibles par leurs catégories propriétaires et ne gonflent pas ce dénominateur.</p></section>
<section aria-labelledby="frt-apps-title"><h2 id="frt-apps-title">Les 18 applications</h2><div class="frt-grid">${cards}</div></section>
<div class="frt-lanes">${laneSections}</div>
</main>
<afro-footer></afro-footer>
</body>
</html>
`, 'fr');
}

function renderAiRouteOverlay(manifest) {
  const routes = Object.fromEntries(manifest.apps.map((app) => [app.englishRoute, app.frenchRoute]));
  return `(function initFrenchTransportRouteMap(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./french-route-map.generated.js"));
  } else {
    root.AfroToolsAIFrenchRouteMap = factory(root.AfroToolsAIFrenchRouteMap);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function mergeFrenchTransportRoutes(base) {
  "use strict";
  var current = base && typeof base === "object" ? base : {};
  var routes = Object.assign({}, current.routes || {}, ${JSON.stringify(routes, null, 2)});
  return Object.freeze(Object.assign({}, current, {
    schemaVersion: 1,
    locale: "fr",
    source: "data/transport/french-parity.json",
    routes: Object.freeze(routes)
  }));
});
`;
}

function patchAiPage(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace(/\s*<script\b[^>]*src=["']\/assets\/js\/ai\/french-transport-route-map\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
  html = html.replace(
    /(<script\b[^>]*src=["']\/assets\/js\/ai\/french-route-map\.generated\.js[^"']*["'][^>]*>\s*<\/script>)/i,
    '$1\n  <script src="/assets/js/ai/french-transport-route-map.js"></script>'
  );
  return html;
}

function patchEnglishHreflang(html, app) {
  const clean = html.replace(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']fr["'])[^>]*>\s*/gi, '');
  const tag = `<link rel="alternate" hreflang="fr" href="https://afrotools.com${app.frenchRoute}">\n`;
  const canonical = clean.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  if (canonical) return clean.replace(canonical[0], `${canonical[0]}\n${tag.trimEnd()}`);
  return clean.replace('</head>', `${tag}</head>`);
}

function writeOrCheck(filePath, content, differences) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const isHtml = /\.html?$/i.test(filePath);
  const currentComparable = isHtml ? normalizeTransportGeneratorHtml(current) : current;
  const contentComparable = isHtml ? normalizeTransportGeneratorHtml(content) : content;
  if (currentComparable === contentComparable) return;
  differences.push(path.relative(ROOT, filePath).replace(/\\/g, '/'));
  if (isCheck) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function validateManifest(manifest, sourceManifest) {
  if (manifest.apps.length !== 18) throw new Error(`French Transport denominator must be 18, received ${manifest.apps.length}.`);
  const englishIds = new Set();
  const englishRoutes = new Set();
  const frenchRoutes = new Set();
  for (const app of manifest.apps) {
    if (englishIds.has(app.englishId)) throw new Error(`Duplicate English id ${app.englishId}`);
    if (englishRoutes.has(app.englishRoute)) throw new Error(`Duplicate English route ${app.englishRoute}`);
    if (frenchRoutes.has(app.frenchRoute)) throw new Error(`Duplicate French route ${app.frenchRoute}`);
    englishIds.add(app.englishId);
    englishRoutes.add(app.englishRoute);
    frenchRoutes.add(app.frenchRoute);
    if (!fs.existsSync(routeFile(app.englishRoute))) throw new Error(`Missing English source ${app.englishRoute}`);
    if (!fs.existsSync(path.join(ROOT, 'assets', 'img', 'tools', `${app.imageId}.webp`))) {
      throw new Error(`Missing canonical artwork for ${app.englishId}`);
    }
    if (!sourceManifest.tools.some((tool) => tool.id === app.englishId)) {
      throw new Error(`Transport source manifest is missing ${app.englishId}`);
    }
  }
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const sourceManifest = readJson(SOURCE_MANIFEST_PATH);
  validateManifest(manifest, sourceManifest);
  const differences = [];

  for (const app of manifest.apps) {
    const englishPath = routeFile(app.englishRoute);
    const english = fs.readFileSync(englishPath, 'utf8');
    const frenchContent = app.existingNative
      ? enhanceExistingNativePage(app, manifest, sourceManifest, english)
      : localizePage(app, manifest, sourceManifest, english);
    writeOrCheck(routeFile(app.frenchRoute), frenchContent, differences);
    writeOrCheck(englishPath, patchEnglishHreflang(english, app), differences);
    const swahiliHref = alternateHref(english, 'sw');
    if (swahiliHref) {
      const swahiliPath = routeFile(new URL(swahiliHref).pathname);
      const swahili = fs.readFileSync(swahiliPath, 'utf8');
      writeOrCheck(
        swahiliPath,
        ensureAlternateHreflang(swahili, 'fr', `https://afrotools.com${app.frenchRoute}`),
        differences
      );
    }
  }
  writeOrCheck(HUB_PATH, renderHub(manifest), differences);
  writeOrCheck(path.join(ROOT, 'assets', 'js', 'ai', 'french-transport-route-map.js'), renderAiRouteOverlay(manifest), differences);
  writeOrCheck(path.join(ROOT, 'ai', 'index.html'), patchAiPage(path.join(ROOT, 'ai', 'index.html')), differences);
  writeOrCheck(path.join(ROOT, 'ask', 'index.html'), patchAiPage(path.join(ROOT, 'ask', 'index.html')), differences);

  if (isCheck && differences.length) {
    throw new Error(`French Transport parity outputs are stale:\n${differences.map((file) => `- ${file}`).join('\n')}`);
  }
  console.log(`French Transport parity: ${manifest.apps.length}/18 canonical apps; ${differences.length} file(s) ${isCheck ? 'stale' : 'updated'}.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  enhanceExistingNativePage,
  normalizeTransportGeneratorHtml,
  renderHub
};
