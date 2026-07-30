"use strict";

const SITE = "https://afrotools.com";
const CHECKED = "29 juillet 2026";

const PAGES = [
  {
    enSlug: "africa-flight",
    frSlug: "prix-vols-afrique",
    swSlug: "safari-za-ndege-afrika",
    name: "Fourchette de budget pour un vol en Afrique",
    shortName: "Budget de vol",
    description: "Comparez localement des devis de vol saisis par vous, bagages compris, sans inventer de tarif, d’horaire ni de disponibilité.",
    lead: "Cadrez une fourchette à partir de devis actuels, puis vérifiez trajet, horaires, bagages et conditions directement auprès du transporteur.",
    boundary: "Aucun tarif ni horaire en direct. Le calcul reste bloqué sans fourchette de devis saisie par vous.",
    confidence: "Élevée pour l’addition locale; non évaluée pour tarif, horaire et disponibilité.",
    sources: [
      ["Codes aéroportuaires officiels IATA", "https://www.iata.org/en/publications/directories/code-search"],
      ["Exigences de voyage IATA Travel Centre", "https://www.iata.org/en/travel-centre/"],
    ],
  },
  {
    enSlug: "airbnb-vs-hotel",
    frSlug: "airbnb-vs-hotel",
    swSlug: "airbnb-dhidi-ya-hoteli",
    name: "Comparateur location courte durée ou hôtel",
    shortName: "Location ou hôtel",
    description: "Comparez deux devis d’hébergement avec nuits, chambres, frais et économies repas, uniquement à partir de montants saisis par vous.",
    lead: "Mettez deux offres réellement consultées sur la même base de coût avant de réserver.",
    boundary: "Aucun prix, classement, sécurité ni disponibilité n’est récupéré ou déduit.",
    confidence: "Élevée pour la comparaison arithmétique; dépend entièrement de vos devis et conditions.",
    sources: [["Conseils officiels par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"]],
  },
  {
    enSlug: "airport-transfer",
    frSlug: "transfert-aeroport",
    swSlug: "usafiri-wa-uwanja-wa-ndege",
    name: "Comparateur de transferts aéroport",
    shortName: "Transfert aéroport",
    description: "Comparez taxi, VTC, navette et voiture privée à partir de devis actuels, avec coût total et coût par personne.",
    lead: "Comparez des offres pour un aéroport précis sans supposer qu’un service, un tarif ou une prise en charge est disponible.",
    boundary: "Les codes IATA identifient le lieu; ils ne prouvent ni desserte, ni tarif, ni disponibilité.",
    confidence: "Élevée pour la comparaison locale; non évaluée pour disponibilité, sûreté et temps de trajet.",
    sources: [
      ["Recherche officielle des codes IATA", "https://www.iata.org/en/publications/directories/code-search"],
      ["Conseils officiels par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"],
    ],
  },
  {
    enSlug: "beach-holiday-budget",
    frSlug: "budget-vacances-plage",
    swSlug: "bajeti-ya-likizo-ufukweni",
    name: "Budget de vacances à la plage",
    shortName: "Vacances plage",
    description: "Additionnez hébergement, repas, transport, activités, vols et réserve dans la devise de votre destination.",
    lead: "Construisez un scénario modifiable par voyageur à partir de prix vérifiés par vous.",
    boundary: "Aucune plage, activité, frontière, météo, sécurité ou disponibilité n’est déclarée ouverte.",
    confidence: "Élevée pour le budget local; dépend de vos prix, dates et vérifications de destination.",
    sources: [["Conseils officiels par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"]],
  },
  {
    enSlug: "festival-travel-budget",
    frSlug: "budget-voyage-festival",
    name: "Budget de voyage pour festival",
    shortName: "Voyage festival",
    description: "Préparez un budget d’événement à partir de dates et tarifs que vous avez vérifiés auprès de l’organisateur.",
    lead: "Additionnez billet, transport, hébergement, repas et marge seulement après avoir saisi votre propre événement.",
    boundary: "Le calcul refuse de présenter le scénario comme prêt tant que la source organisateur n’est pas confirmée.",
    confidence: "Élevée pour l’addition; non évaluée pour date, programme, billet, entrée ou disponibilité.",
    sources: [["Conseils officiels par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"]],
  },
  {
    enSlug: "hotel-star-guide",
    frSlug: "guide-prix-hotels",
    name: "Comparateur de devis d’hôtel",
    shortName: "Devis d’hôtel",
    description: "Comparez deux offres d’hôtel avec chambres, nuits, taxes, repas et conditions, sans publier de fausse grille par étoiles.",
    lead: "Utilisez les étoiles comme information déclarée par l’établissement, jamais comme garantie universelle de qualité.",
    boundary: "Aucun classement, prix, quartier, sécurité ou inventaire n’est certifié par AfroTools.",
    confidence: "Élevée pour la comparaison; dépend des taxes, inclusions et conditions de chaque offre.",
    sources: [["Conseils officiels par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"]],
  },
  {
    enSlug: "safari-cost",
    frSlug: "calculateur-du-cout-d-un-safari",
    name: "Calculateur de budget safari",
    shortName: "Budget safari",
    description: "Additionnez devis opérateur, droits de parc, transferts, vols et réserve sans inventer permis, disponibilité ou tarif officiel.",
    lead: "Partez d’un devis daté et vérifiez les droits auprès de l’autorité du parc avant paiement.",
    boundary: "Aucun permis, statut de résident, visa, droit d’entrée, activité ou disponibilité n’est déduit.",
    confidence: "Élevée pour l’addition; non évaluée pour permis, éligibilité, droits, opérateur et disponibilité.",
    sources: [
      ["Kenya Wildlife Service", "https://www.kws.go.ke/"],
      ["Tanzania National Parks", "https://www.tanzaniaparks.go.tz/tourism/visitor-information/tariff"],
      ["Uganda Wildlife Authority", "https://ugandawildlife.org/uwa-rates/"],
      ["Réservations officielles Rwanda Development Board", "https://www.visitrwandabookings.rdb.rw/rdbportal/web/rdb/home"],
      ["South African National Parks", "https://www.sanparks.org/"],
    ],
  },
  {
    enSlug: "travel-packing-list",
    frSlug: "liste-bagages-voyage",
    name: "Liste de bagages pour un voyage en Afrique",
    shortName: "Liste de bagages",
    description: "Générez localement une checklist selon le type de voyage, le climat, la durée, la lessive et la franchise bagage saisie.",
    lead: "Préparez une liste pratique sans transformer des règles de compagnie, de santé ou de frontière en certitudes.",
    boundary: "La liste ne prescrit aucun médicament et ne confirme ni visa, ni document, ni franchise transporteur.",
    confidence: "Élevée pour la checklist déterministe; non évaluée pour règles transporteur, santé et entrée.",
    sources: [
      ["Exigences de voyage IATA Travel Centre", "https://www.iata.org/en/travel-centre/"],
      ["Conseils OMS aux voyageurs", "https://www.who.int/travel-advice"],
    ],
  },
  {
    enSlug: "travel-vaccination-cost",
    frSlug: "preparer-consultation-sante-voyage",
    name: "Préparer une consultation de santé-voyage",
    shortName: "Consultation santé-voyage",
    description: "Créez un brief local pour un professionnel de santé sans diagnostiquer, prescrire, recommander un vaccin ou annoncer une exigence d’entrée.",
    lead: "Rassemblez trajet, transits, dates et questions avant une consultation qualifiée.",
    boundary: "Aucun vaccin, traitement, prix clinique, certificat ou admissibilité n’est calculé.",
    confidence: "Élevée pour la structure du brief; aucune décision médicale ou réglementaire.",
    sources: [
      ["OMS — vaccins et voyages", "https://www.who.int/travel-advice/vaccines"],
      ["OMS — conseils aux voyageurs", "https://www.who.int/travel-advice"],
      ["IATA Travel Centre — passeport, visa et santé", "https://www.iata.org/en/travel-centre/"],
      ["France Diplomatie — conseils par destination", "https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/"],
    ],
  },
];

const DESTINATIONS = [
  ["Dakar (DSS), Sénégal", "XOF"], ["Abidjan (ABJ), Côte d’Ivoire", "XOF"],
  ["Cotonou (COO), Bénin", "XOF"], ["Lomé (LFW), Togo", "XOF"],
  ["Bamako (BKO), Mali", "XOF"], ["Ouagadougou (OUA), Burkina Faso", "XOF"],
  ["Conakry (CKY), Guinée", "GNF"], ["Douala (DLA), Cameroun", "XAF"],
  ["Yaoundé (NSI), Cameroun", "XAF"], ["Libreville (LBV), Gabon", "XAF"],
  ["Kinshasa (FIH), RD Congo", "CDF"], ["Antananarivo (TNR), Madagascar", "MGA"],
  ["Casablanca (CMN), Maroc", "MAD"], ["Alger (ALG), Algérie", "DZD"],
  ["Tunis (TUN), Tunisie", "TND"], ["Nairobi (NBO), Kenya", "KES"],
  ["Kigali (KGL), Rwanda", "RWF"], ["Paris (CDG), France", "EUR"],
];

const SAFARI_DESTINATIONS = [
  ["Kenya — KWS", "KES"], ["Tanzanie — TANAPA", "TZS"], ["Rwanda — RDB", "RWF"],
  ["Ouganda — UWA", "UGX"], ["Afrique du Sud — SANParks", "ZAR"], ["Autre destination", "USD"],
];

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function options(rows, selected = 0) {
  return rows.map((row, index) => `<option value="${escapeHtml(row[0])}" data-currency="${row[1]}"${index === selected ? " selected" : ""}>${escapeHtml(row[0])}</option>`).join("");
}

function currencyOptions(selected = "XOF") {
  return ["XOF", "XAF", "EUR", "USD", "MAD", "DZD", "TND", "GNF", "CDF", "MGA", "KES", "RWF", "TZS", "UGX", "ZAR"]
    .map((code) => `<option value="${code}"${code === selected ? " selected" : ""}>${code}</option>`).join("");
}

function numberField(id, name, label, value, min = "0", step = "1") {
  return `<label for="${id}">${label}<input id="${id}" name="${name}" type="number" min="${min}" step="${step}" inputmode="decimal" value="${value}" required></label>`;
}

function textField(id, name, label, placeholder, required = true) {
  return `<label for="${id}">${label}<input id="${id}" name="${name}" type="text" placeholder="${escapeHtml(placeholder)}"${required ? " required" : ""}></label>`;
}

function currencyField(selected = "XOF") {
  return `<label for="frt-currency">Devise du scénario<select id="frt-currency" name="currency">${currencyOptions(selected)}</select></label>`;
}

function destinationField(rows = DESTINATIONS, selected = 0, name = "destination", label = "Destination") {
  const currencySource = name === "origin" ? "" : " data-currency-source";
  return `<label for="frt-${name}">${label}<select id="frt-${name}" name="${name}"${currencySource}>${options(rows, selected)}</select></label>`;
}

function fieldsFor(page) {
  switch (page.enSlug) {
    case "africa-flight":
      return `${destinationField(DESTINATIONS, 17, "origin", "Aéroport de départ")}${destinationField(DESTINATIONS, 0)}
        ${currencyField("XOF")}${numberField("frt-travellers", "travellers", "Voyageurs", "1", "1")}
        ${numberField("frt-low", "quoteLow", "Devis bas par voyageur", "0", "0", "0.01")}
        ${numberField("frt-high", "quoteHigh", "Devis haut par voyageur", "0", "0", "0.01")}
        ${numberField("frt-bag", "baggage", "Bagages par voyageur", "0", "0", "0.01")}
        ${textField("frt-route-note", "routeNote", "Trajet, date et classe vérifiés", "Ex. direct, 12 août, économique")}`;
    case "airbnb-vs-hotel":
      return `${textField("frt-city", "city", "Ville et quartier", "Ex. Dakar, Plateau")}${currencyField()}
        ${numberField("frt-nights", "nights", "Nuits", "3", "1")}${numberField("frt-people", "people", "Voyageurs", "2", "1")}
        ${numberField("frt-rooms", "rooms", "Chambres d’hôtel", "1", "1")}
        ${numberField("frt-hotel-night", "hotelNight", "Hôtel par chambre et nuit", "0", "0", "0.01")}
        ${numberField("frt-hotel-fees", "hotelFees", "Taxes et frais hôtel au total", "0", "0", "0.01")}
        ${numberField("frt-rental-night", "rentalNight", "Location par nuit", "0", "0", "0.01")}
        ${numberField("frt-rental-fees", "rentalFees", "Ménage, service et taxes location", "0", "0", "0.01")}
        ${numberField("frt-food-savings", "foodSavings", "Économie repas estimée", "0", "0", "0.01")}`;
    case "airport-transfer":
      return `${destinationField(DESTINATIONS, 0, "airport", "Aéroport d’arrivée")}${currencyField()}
        ${numberField("frt-distance", "distanceKm", "Distance indicative (km)", "0", "0", "0.1")}
        ${numberField("frt-people", "people", "Voyageurs", "2", "1")}
        ${numberField("frt-taxi", "taxi", "Devis taxi total", "0", "0", "0.01")}
        ${numberField("frt-vtc", "rideHail", "Devis VTC total", "0", "0", "0.01")}
        ${numberField("frt-shuttle", "shuttleEach", "Navette par personne", "0", "0", "0.01")}
        ${numberField("frt-private", "privateCar", "Voiture privée totale", "0", "0", "0.01")}
        ${textField("frt-pickup", "pickupTerms", "Point et conditions de prise en charge", "Ex. comptoir officiel, annulation incluse", false)}`;
    case "beach-holiday-budget":
      return `${destinationField(DESTINATIONS, 1)}${currencyField()}${numberField("frt-days", "days", "Jours", "5", "1")}
        ${numberField("frt-people", "people", "Voyageurs", "2", "1")}
        ${numberField("frt-lodging", "lodgingNight", "Hébergement par nuit (groupe)", "0", "0", "0.01")}
        ${numberField("frt-meals", "mealsDayEach", "Repas par jour et voyageur", "0", "0", "0.01")}
        ${numberField("frt-local", "localTransport", "Transport local total", "0", "0", "0.01")}
        ${numberField("frt-activities", "activitiesEach", "Activités par voyageur", "0", "0", "0.01")}
        ${numberField("frt-flights", "flightsEach", "Vols par voyageur", "0", "0", "0.01")}
        ${numberField("frt-buffer", "bufferPercent", "Réserve (%)", "10", "0", "0.1")}`;
    case "festival-travel-budget":
      return `${textField("frt-event", "eventName", "Événement saisi par vous", "Ex. nom exact sur le site organisateur")}
        ${textField("frt-place", "destination", "Ville et pays", "Ex. Saint-Louis, Sénégal")}${currencyField()}
        <label for="frt-date">Date vérifiée auprès de l’organisateur<input id="frt-date" name="eventDate" type="date" required></label>
        ${numberField("frt-people", "people", "Voyageurs", "2", "1")}
        ${numberField("frt-ticket", "ticketEach", "Billet par voyageur", "0", "0", "0.01")}
        ${numberField("frt-transport", "transportEach", "Transport aller-retour par voyageur", "0", "0", "0.01")}
        ${numberField("frt-nights", "nights", "Nuits", "2", "0")}
        ${numberField("frt-lodging", "lodgingNight", "Hébergement par nuit (groupe)", "0", "0", "0.01")}
        ${numberField("frt-meals", "mealsDayEach", "Repas par jour et voyageur", "0", "0", "0.01")}
        ${numberField("frt-local", "localTransport", "Transport local total", "0", "0", "0.01")}
        ${numberField("frt-buffer", "bufferPercent", "Réserve (%)", "10", "0", "0.1")}
        <label class="frt-check"><input name="scheduleConfirmed" type="checkbox" required> J’ai vérifié la date et le canal de vente directement auprès de l’organisateur; je sais que disponibilité et entrée ne sont pas garanties.</label>`;
    case "hotel-star-guide":
      return `${textField("frt-city", "city", "Ville et quartier", "Ex. Yaoundé, Bastos")}${currencyField()}
        ${numberField("frt-nights", "nights", "Nuits", "3", "1")}${numberField("frt-rooms", "rooms", "Chambres", "1", "1")}
        ${textField("frt-a-name", "offerAName", "Offre A", "Ex. Hôtel A — 3 étoiles déclarées")}
        ${numberField("frt-a-night", "offerANight", "Offre A par chambre et nuit", "0", "0", "0.01")}
        ${numberField("frt-a-fees", "offerAFees", "Offre A taxes et frais", "0", "0", "0.01")}
        ${textField("frt-b-name", "offerBName", "Offre B", "Ex. Hôtel B — classement à vérifier")}
        ${numberField("frt-b-night", "offerBNight", "Offre B par chambre et nuit", "0", "0", "0.01")}
        ${numberField("frt-b-fees", "offerBFees", "Offre B taxes et frais", "0", "0", "0.01")}
        ${textField("frt-terms", "terms", "Inclusions et annulation", "Ex. petit-déjeuner A; B non remboursable", false)}`;
    case "safari-cost":
      return `${destinationField(SAFARI_DESTINATIONS, 0)}${currencyField("KES")}
        ${numberField("frt-days", "days", "Jours de safari", "3", "1")}${numberField("frt-people", "people", "Voyageurs", "2", "1")}
        ${numberField("frt-operator", "operatorDayEach", "Devis opérateur par jour et voyageur", "0", "0", "0.01")}
        ${numberField("frt-park", "parkFees", "Droits de parc vérifiés au total", "0", "0", "0.01")}
        ${numberField("frt-transfer", "transfers", "Transferts au total", "0", "0", "0.01")}
        ${numberField("frt-flights", "flightsEach", "Vols par voyageur", "0", "0", "0.01")}
        ${numberField("frt-admin", "adminCosts", "Visa et formalités saisis par vous", "0", "0", "0.01")}
        ${numberField("frt-tips", "tips", "Pourboires prévus", "0", "0", "0.01")}
        ${numberField("frt-buffer", "bufferPercent", "Réserve (%)", "10", "0", "0.1")}
        <label class="frt-check"><input name="officialFeesConfirmed" type="checkbox" required> J’ai vérifié les droits auprès de l’autorité du parc et je n’utilise pas cet outil comme preuve de permis, résidence ou éligibilité.</label>`;
    case "travel-packing-list":
      return `<label for="frt-trip">Type de voyage<select id="frt-trip" name="tripType"><option value="safari">Safari</option><option value="plage">Plage</option><option value="affaires">Affaires</option><option value="ville">Ville</option><option value="aventure">Aventure</option></select></label>
        <label for="frt-climate">Climat prévu<select id="frt-climate" name="climate"><option value="chaud">Chaud / tropical</option><option value="pluie">Saison des pluies</option><option value="desert">Désert / sec</option><option value="frais">Altitude / frais</option></select></label>
        ${numberField("frt-days", "days", "Jours", "7", "1")}${numberField("frt-baggage", "baggageKg", "Franchise vérifiée (kg)", "23", "0", "0.1")}
        <label for="frt-laundry">Lessive prévue<select id="frt-laundry" name="laundry"><option value="non">Non</option><option value="oui">Oui</option></select></label>
        ${textField("frt-airline", "carrierRule", "Règle bagage vérifiée", "Ex. 1 bagage 23 kg + cabine 8 kg", false)}
        <label class="frt-check"><input name="documentsChecked" type="checkbox" required> Je vérifierai passeport, visa, transit, santé et bagages auprès des autorités, du transporteur et d’un professionnel qualifié.</label>`;
    case "travel-vaccination-cost":
      return `${textField("frt-origin", "origin", "Pays de départ", "Ex. Sénégal")}
        ${textField("frt-destination", "destination", "Pays de destination", "Ex. Cameroun")}
        ${textField("frt-transit", "transit", "Tous les transits", "Ex. Casablanca; aucun", false)}
        <label for="frt-date">Date de départ<input id="frt-date" name="departureDate" type="date" required></label>
        ${numberField("frt-days", "days", "Durée (jours)", "14", "1")}${numberField("frt-people", "people", "Voyageurs", "1", "1")}
        <label for="frt-health-notes">Questions privées à poser au professionnel<textarea id="frt-health-notes" name="healthNotes" placeholder="Facultatif. Reste sur cet appareil et dans vos exports locaux."></textarea></label>
        <label class="frt-check"><input name="clinicalBoundaryConfirmed" type="checkbox" required> Je comprends que seul un professionnel de santé peut personnaliser les conseils, et que les règles d’entrée doivent être revérifiées auprès des sources officielles.</label>`;
    default:
      throw new Error(`Unknown French travel page: ${page.enSlug}`);
  }
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderPage(page) {
  const enUrl = `${SITE}/tools/${page.enSlug}/`;
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const swAlternate = page.swSlug ? `\n<link rel="alternate" hreflang="sw" href="${SITE}/sw/zana/${page.swSlug}/">` : "";
  const schema = [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: page.name,
      applicationCategory: "TravelApplication", operatingSystem: "Any", inLanguage: "fr",
      url: frUrl, description: page.description, isBasedOn: enUrl, dateModified: "2026-07-29",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      provider: { "@type": "Organization", name: "AfroTools", url: SITE },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
        { "@type": "ListItem", position: 2, name: "Voyage", item: `${SITE}/fr/travel/` },
        { "@type": "ListItem", position: 3, name: page.name, item: frUrl },
      ],
    },
  ];
  const config = { toolId: page.enSlug, frSlug: page.frSlug, name: page.name, checked: CHECKED, boundary: page.boundary };
  return `<!DOCTYPE html>
<!-- Generated by scripts/lib/french-travel-pages.js via scripts/generate-fr-tool-gap-pages.js. -->
<html lang="fr" data-theme="light">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="afrotools-content-id" content="fr-travel:${escapeHtml(page.enSlug)}">
<meta name="afrotools-source-owner" content="scripts/lib/french-travel-pages.js">
<title>${escapeHtml(page.name)} | AfroTools</title>
<meta name="description" content="${escapeHtml(page.description)}">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools"><meta property="og:title" content="${escapeHtml(page.name)}">
<meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${frUrl}">
<meta property="og:image" content="${SITE}/assets/img/tools/${page.enSlug}.webp">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/assets/img/tools/${page.enSlug}.webp">
<meta name="article:modified_time" content="2026-07-29">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
<link rel="stylesheet" href="/assets/css/french-travel-parity.css">
<script type="application/ld+json">${safeJson(schema)}</script>
<script type="application/json" id="fr-travel-config">${safeJson(config)}</script>
<script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
<script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js" defer></script>
<script src="/assets/js/pages/french-travel-parity.js" defer></script>
<link rel="canonical" href="${frUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="fr" href="${frUrl}">${swAlternate}
<link rel="alternate" hreflang="x-default" href="${enUrl}">
</head>
<body data-fr-travel-app="${page.enSlug}">
<afro-navbar active="travel"></afro-navbar>
<main id="main-content" class="frt-shell">
  <nav class="frt-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a><span aria-hidden="true">/</span><a href="/fr/travel/">Voyage</a><span aria-hidden="true">/</span><span>${escapeHtml(page.shortName)}</span></nav>
  <header class="frt-hero">
    <p class="frt-kicker">Voyage en Afrique · calcul local</p>
    <h1>${escapeHtml(page.name)}</h1>
    <p>${escapeHtml(page.lead)}</p>
    <div class="frt-chips" aria-label="Caractéristiques"><span>Sans compte</span><span>Sans prix en direct</span><span>Exports locaux</span></div>
  </header>
  <aside class="frt-boundary" role="note" data-fr-travel-boundary><strong>Limite ferme :</strong> ${escapeHtml(page.boundary)}</aside>
  <div class="frt-layout">
    <form class="frt-card frt-form" data-fr-travel-form novalidate>
      <h2>Votre scénario vérifié</h2>
      <p>Les montants et faits variables viennent de vous. Les champs obligatoires empêchent un résultat trompeur.</p>
      <div class="frt-fields">${fieldsFor(page)}</div>
      <p class="frt-error" data-fr-travel-error role="alert"></p>
      <div class="frt-actions">
        <button class="frt-primary" type="submit">Calculer / préparer</button>
        <button type="button" data-fr-travel-reset>Réinitialiser</button>
      </div>
    </form>
    <section class="frt-card frt-result" data-fr-travel-result hidden aria-live="polite" aria-atomic="true">
      <h2>Résultat local</h2><div data-fr-travel-output></div>
      <div class="frt-actions frt-export-actions">
        <button type="button" data-copy>Copier</button><button type="button" data-export-json>Exporter JSON</button>
        <button type="button" data-import-json>Rouvrir JSON</button><button type="button" data-export-pdf>Télécharger PDF</button>
        <input type="file" accept="application/json,.json" data-import-file hidden>
      </div>
      <p class="frt-status" data-fr-travel-status aria-live="polite"></p>
    </section>
  </div>
  <section class="frt-card frt-ai" data-ai-consent-boundary data-ai-local-fallback="complete">
    <h2>IA facultative, flux local complet</h2>
    <p>Ce calcul fonctionne entièrement sans IA. AfroTools n’envoie aucun détail de voyage depuis cette page.</p>
    <label class="frt-check"><input type="checkbox" data-ai-consent> Je choisis de préparer localement une question que je pourrai relire avant tout envoi ailleurs.</label>
    <button type="button" data-ai-prompt disabled>Préparer la question locale</button>
    <output data-ai-output aria-live="polite"></output>
  </section>
  <div class="frt-evidence-grid">
    <section class="frt-card" data-source-confidence><h2>Fraîcheur et confiance</h2>
      <p><strong>Liens vérifiés :</strong> ${CHECKED}.</p><p><strong>Confiance :</strong> ${escapeHtml(page.confidence)}</p>
      <p>Les prix, règles, horaires et disponibilités doivent être revérifiés à la date d’utilisation.</p>
    </section>
    <section class="frt-card"><h2>Confidentialité locale</h2>
      <p>Les saisies restent en mémoire de page. Elles ne sont ni enregistrées dans un compte, ni envoyées à une API. JSON et PDF sont créés sur cet appareil.</p>
    </section>
    <section class="frt-card"><h2>Sources officielles à rouvrir</h2><ul class="frt-sources">
      ${page.sources.map(([label, href]) => `<li><a href="${href}" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`).join("")}
    </ul></section>
  </div>
  <section class="frt-direct-answer" aria-labelledby="frt-answer-title"><h2 id="frt-answer-title">Réponse courte</h2>
    <p>${escapeHtml(page.description)} Vérifiez toujours la source officielle ou le prestataire responsable avant de réserver, voyager ou prendre une décision de santé.</p>
  </section>
</main>
<afro-footer></afro-footer>
</body></html>
`;
}

function renderHub() {
  const hubUrl = `${SITE}/fr/travel/`;
  const itemList = PAGES.map((page, index) => ({
    "@type": "ListItem", position: index + 1, name: page.name,
    url: `${SITE}/fr/tools/${page.frSlug}/`,
  }));
  const schema = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: "Outils de voyage en français", inLanguage: "fr", url: hubUrl, dateModified: "2026-07-29", mainEntity: { "@type": "ItemList", numberOfItems: 9, itemListElement: itemList } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
      { "@type": "ListItem", position: 2, name: "Voyage", item: hubUrl },
    ] },
  ];
  return `<!DOCTYPE html>
<!-- Generated by scripts/lib/french-travel-pages.js. -->
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="afrotools-content-id" content="fr-travel:hub">
<meta name="afrotools-source-owner" content="scripts/lib/french-travel-pages.js">
<title>9 outils de voyage en français pour l’Afrique | AfroTools</title>
<meta name="description" content="Neuf outils de voyage en français: vols, hébergement, transferts, plage, festivals, hôtels, safaris, bagages et consultation santé-voyage.">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="AfroTools">
<meta property="og:title" content="9 outils de voyage en français pour l’Afrique"><meta property="og:description" content="Des scénarios locaux, vérifiables et exportables, sans inventer prix, visa, santé, horaire ou disponibilité.">
<meta property="og:url" content="${hubUrl}"><meta property="og:image" content="${SITE}/assets/img/og-default.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg"><link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5"><link rel="stylesheet" href="/assets/css/french-travel-parity.css">
<script type="application/ld+json">${safeJson(schema)}</script><script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script><script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<link rel="canonical" href="${hubUrl}">
<link rel="alternate" hreflang="en" href="${SITE}/travel/">
<link rel="alternate" hreflang="fr" href="${hubUrl}">
<link rel="alternate" hreflang="x-default" href="${SITE}/travel/">
</head><body class="frt-hub"><afro-navbar active="travel"></afro-navbar><main id="main-content" class="frt-shell">
<header class="frt-hero"><p class="frt-kicker">Voyage et tourisme · français</p><h1>Préparer un voyage sans transformer une estimation en fait</h1>
<p>Neuf applications locales pour cadrer budgets, comparaison, bagages et rendez-vous santé. Aucune ne prétend connaître un prix, une disponibilité, un visa, un horaire ou une exigence médicale en direct.</p>
<div class="frt-chips"><span>9 applications</span><span>9 aperçus disponibles</span><span>100 % local</span></div></header>
<aside class="frt-boundary" role="note"><strong>Avant de partir :</strong> vérifiez transport et bagages auprès du transporteur, formalités auprès de l’autorité compétente, santé auprès d’un professionnel qualifié, et dates auprès de l’organisateur.</aside>
<section class="frt-hub-grid" aria-label="Neuf applications de voyage">${PAGES.map((page) => `<a class="frt-tool-card" href="/fr/tools/${page.frSlug}/">
<img src="/assets/img/tools/${page.enSlug}.webp" alt="" width="320" height="168" loading="lazy"><span class="frt-card-kicker">${escapeHtml(page.shortName)}</span><h2>${escapeHtml(page.name)}</h2><p>${escapeHtml(page.description)}</p><strong>Ouvrir l’application →</strong></a>`).join("")}</section>
<section class="frt-card frt-ai" data-ai-consent-boundary data-ai-local-fallback="complete"><h2>Recherche locale avant IA</h2><p>Choisissez une application ci-dessus. Chaque flux fonctionne sans IA et ne transmet aucune saisie. Une aide externe éventuelle doit rester distincte et demander un consentement explicite.</p></section>
<section class="frt-direct-answer"><h2>Comment utiliser ce hub</h2><p>Choisissez le travail à faire, saisissez des devis ou faits que vous avez vérifiés, exportez le scénario localement, puis ouvrez les sources responsables avant toute réservation ou décision.</p></section>
</main><afro-footer></afro-footer></body></html>`;
}

function pageForEnSlug(slug) {
  return PAGES.find((page) => page.enSlug === slug) || null;
}

module.exports = { PAGES, pageForEnSlug, renderPage, renderHub };
