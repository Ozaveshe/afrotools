"use strict";

function numberField(key, label, value, options = {}) {
  return {
    key,
    label,
    type: "number",
    value,
    min: options.min == null ? 0 : options.min,
    max: options.max,
    step: options.step || "any",
    help: options.help || "",
  };
}

function textField(key, label, value, help) {
  return { key, label, type: "text", value: value || "", help: help || "" };
}

function selectField(key, label, value, options, help) {
  return { key, label, type: "select", value, options, help: help || "" };
}

function option(value, label) {
  return { value, label };
}

function common({
  id,
  eyebrow,
  title,
  description,
  action,
  fields,
  metrics,
  outputs,
  source,
  freshness,
  confidence,
  limitations,
  workflow,
  endpoint,
  responseKey,
  delegate,
}) {
  return {
    id,
    eyebrow,
    title,
    description,
    action,
    fields,
    metrics,
    outputs,
    source,
    freshness,
    confidence,
    limitations,
    workflow,
    endpoint: endpoint || null,
    responseKey: responseKey || null,
    delegate: delegate || null,
  };
}

function fintechFeeWatch() {
  return common({
    id: "fintech-fee-watch",
    eyebrow: "Frais fintech africains",
    title: "Suivi des frais fintech",
    description: "Comparez le coût réel d’une opération à partir du montant, des frais affichés et de la marge de change. Les observations de la communauté restent datées et distinctes de votre simulation.",
    action: "Calculer le coût effectif",
    fields: [
      textField("provider", "Prestataire observé", "M-Pesa", "Le nom sert uniquement à votre résumé local."),
      textField("currency", "Devise", "KES"),
      numberField("amount", "Montant de l’opération", 5000, { min: 0.01 }),
      numberField("flatFee", "Frais fixes", 35),
      numberField("feePct", "Frais variables (%)", 0.5),
      numberField("fxMarginPct", "Marge de change (%)", 0.8),
    ],
    metrics: {
      fee: "Frais de transaction",
      fxCost: "Coût de change",
      totalCost: "Coût total",
      recipientValue: "Valeur nette",
      totalPct: "Coût effectif (%)",
    },
    outputs: ["copy", "json"],
    source: "Même formule déterministe que l’outil anglais; observations via /api/fintech-fees.",
    freshness: "Chaque observation conserve sa date et son signal de preuve. Aucun flux n’est présenté comme temps réel.",
    confidence: "Élevée pour la formule; variable pour les observations, selon date et preuve.",
    limitations: "Vérifiez l’écran final, l’USSD ou la grille officielle avant de confirmer une opération.",
    workflow: "fee-comparison",
    endpoint: "/api/fintech-fees",
    responseKey: "fees",
  });
}

function ajoTracker() {
  return common({
    id: "ajo-chama",
    eyebrow: "Ajo · Esusu · Chama · Stokvel · Tontine",
    title: "Suivi d’un groupe d’épargne rotative",
    description: "Préparez les tours, la cagnotte et l’exposition aux retards sans effacer les règles propres à votre groupe. Les noms locaux restent visibles; le calcul ne prétend pas uniformiser les pratiques.",
    action: "Construire le suivi",
    fields: [
      selectField("groupTerm", "Nom utilisé par le groupe", "tontine", [
        option("ajo", "Ajo"),
        option("esusu", "Esusu"),
        option("chama", "Chama"),
        option("stokvel", "Stokvel"),
        option("tontine", "Tontine"),
      ]),
      textField("currency", "Devise", "XOF"),
      numberField("members", "Membres", 10, { min: 2, step: 1 }),
      numberField("contribution", "Cotisation par membre et par tour", 25000, { min: 0.01 }),
      numberField("rounds", "Nombre de tours à planifier", 10, { min: 1, step: 1 }),
      numberField("missedPayments", "Paiements actuellement en retard", 1, { min: 0, step: 1 }),
      numberField("latePenalty", "Pénalité par retard", 1000, { min: 0 }),
    ],
    metrics: {
      pool: "Cagnotte par tour",
      totalContributions: "Cotisations planifiées",
      arrears: "Retards et pénalités",
    },
    outputs: ["copy", "json", "pdf"],
    source: "Règles de rotation du propriétaire anglais /tools/ajo-tracker/.",
    freshness: "Aucune donnée distante: le calendrier dépend uniquement des règles saisies.",
    confidence: "Élevée pour l’arithmétique; dépend de l’ordre et des règles confirmés par le groupe.",
    limitations: "Ce suivi n’est ni un compte de dépôt ni une garantie de paiement. Faites signer les règles et reçus.",
    workflow: "rotation-tracker",
  });
}

function electricityEstimator() {
  return common({
    id: "electricity-estimator",
    eyebrow: "Énergie domestique et petite entreprise",
    title: "Estimateur de consommation électrique",
    description: "Transformez la puissance et le temps d’usage d’un appareil en kWh et en coût. Le tarif reste un champ explicite afin de ne pas inventer un prix national ou une grille officielle.",
    action: "Estimer la consommation",
    fields: [
      textField("appliance", "Appareil", "Réfrigérateur"),
      numberField("watts", "Puissance (W)", 150, { min: 0.01 }),
      numberField("hoursPerDay", "Heures d’utilisation par jour", 12, { min: 0.01, max: 24 }),
      numberField("quantity", "Quantité", 1, { min: 1, step: 1 }),
      numberField("tariff", "Tarif par kWh", 75, { min: 0.0001 }),
      textField("currency", "Devise du tarif", "NGN"),
      numberField("days", "Jours de facturation", 30, { min: 1, max: 366, step: 1 }),
    ],
    metrics: {
      dailyKwh: "Consommation quotidienne (kWh)",
      monthlyKwh: "Consommation sur la période (kWh)",
      monthlyCost: "Coût estimé",
    },
    outputs: ["copy", "txt", "json"],
    source: "Formule énergie de /tools/electricity-estimator/: watts × heures × quantité ÷ 1 000.",
    freshness: "Le calcul est stable; le tarif et les taxes doivent être datés par l’utilisateur.",
    confidence: "Élevée pour les kWh; moyenne pour le coût si l’appareil cycle ou si la grille comporte des paliers.",
    limitations: "Puissance nominale, pertes, taxes, paliers et délestage peuvent modifier la facture réelle.",
    workflow: "appliance-energy",
  });
}

function fuelCost() {
  return common({
    id: "fuel-cost",
    eyebrow: "Trajet et groupe électrogène",
    title: "Calculateur de coût du carburant",
    description: "Calculez un trajet avec état de route et réserve, ou la consommation d’un groupe électrogène. Le mode choisi conserve la formule anglaise correspondante.",
    action: "Calculer le carburant",
    fields: [
      selectField("mode", "Mode", "trip", [option("trip", "Trajet routier"), option("generator", "Groupe électrogène")]),
      numberField("distance", "Distance aller", 120, { min: 0.01 }),
      selectField("distanceUnit", "Unité de distance", "km", [option("km", "Kilomètres"), option("mi", "Miles")]),
      numberField("efficiency", "Rendement du véhicule", 12, { min: 0.01 }),
      selectField("efficiencyUnit", "Unité de rendement", "kml", [option("kml", "km/L"), option("l100", "L/100 km"), option("mpg", "MPG")]),
      selectField("condition", "État du trajet", "mixed", [
        option("highway", "Route principale"),
        option("mixed", "Ville et route"),
        option("traffic", "Circulation dense"),
        option("rough", "Route dégradée ou détour"),
      ]),
      selectField("roundTrip", "Aller-retour", "yes", [option("yes", "Oui"), option("no", "Non")]),
      numberField("reservePct", "Réserve carburant (%)", 10, { min: 0, max: 50 }),
      numberField("passengers", "Personnes partageant le coût", 2, { min: 1, step: 1 }),
      numberField("kva", "Puissance du groupe (kVA)", 5, { min: 0.01 }),
      numberField("hours", "Heures du groupe par jour", 6, { min: 0.01, max: 24 }),
      selectField("fuelType", "Carburant du groupe", "diesel", [option("diesel", "Gasoil"), option("petrol", "Essence")]),
      numberField("burnRate", "Consommation mesurée (L/h, facultatif)", 0, { min: 0 }),
      numberField("days", "Jours par mois", 25, { min: 1, max: 31, step: 1 }),
      numberField("price", "Prix par litre", 1500, { min: 0.01 }),
      textField("currency", "Devise", "NGN"),
    ],
    metrics: {
      distanceKm: "Distance totale (km)",
      totalLitres: "Carburant total (L)",
      reserveLitres: "Réserve (L)",
      totalCost: "Coût du trajet",
      perPerson: "Coût par personne",
      burnRate: "Consommation (L/h)",
      dailyLitres: "Litres par jour",
      dailyCost: "Coût par jour",
      monthlyLitres: "Litres par mois",
      monthlyCost: "Coût mensuel",
    },
    outputs: ["copy", "json"],
    source: "Formules trajet et groupe de /tools/fuel-cost/; prix saisi localement.",
    freshness: "La formule est stable; le prix par litre doit être vérifié le jour du calcul.",
    confidence: "Élevée pour les entrées mesurées; moyenne avec une consommation constructeur ou un rendement par défaut.",
    limitations: "Trafic, route, charge, entretien, qualité du carburant et pertes du groupe changent la consommation réelle.",
    workflow: "fuel-trip-generator",
  });
}

function hawalaTracker() {
  return common({
    id: "hawala-tracker",
    eyebrow: "Corridors de transfert",
    title: "Comparateur Hawala et transferts",
    description: "Comparez six canaux avec les mêmes frais, marges de change et ajustements de corridor que l’outil anglais. Hawala reste une option informative, sans recommandation ni promesse de conformité.",
    action: "Comparer les canaux",
    fields: [
      selectField("from", "Pays ou zone d’envoi", "us", [
        option("us", "États-Unis"), option("uk", "Royaume-Uni"), option("eu", "Zone euro"),
        option("ae", "Émirats arabes unis"), option("ca", "Canada"), option("ng", "Nigeria"),
        option("ke", "Kenya"), option("za", "Afrique du Sud"),
      ]),
      selectField("to", "Pays de réception", "ng", [
        option("ng", "Nigeria"), option("ke", "Kenya"), option("gh", "Ghana"),
        option("za", "Afrique du Sud"), option("ug", "Ouganda"), option("tz", "Tanzanie"),
        option("et", "Éthiopie"), option("sn", "Sénégal"),
      ]),
      numberField("amount", "Montant envoyé", 500, { min: 0.01 }),
      textField("currency", "Devise d’envoi", "USD"),
    ],
    metrics: {
      cheapestCost: "Coût le plus bas",
      highestCost: "Coût le plus élevé",
      savings: "Écart entre les canaux",
    },
    outputs: ["copy", "json"],
    source: "Barèmes indicatifs et ajustements de corridor intégrés à /tools/hawala-tracker/.",
    freshness: "Hypothèses statiques de planification; elles ne sont ni un devis ni un flux en direct.",
    confidence: "Moyenne pour comparer la structure des coûts; faible pour un prix exécutable.",
    limitations: "Vérifiez licence, identité, plafond, délai, recours, taux final et légalité du canal dans les deux pays.",
    workflow: "corridor-channels",
  });
}

function stapleBasket() {
  return common({
    id: "staple-basket",
    eyebrow: "Panier alimentaire local",
    title: "Panier de produits de base",
    description: "Projetez un budget de panier à partir d’un coût hebdomadaire daté, de la taille du foyer et d’une variation observée. Les produits, marchés et unités restent attachés à leur lieu.",
    action: "Projeter le panier",
    fields: [
      textField("market", "Marché ou ville", "Marché Sandaga, Dakar"),
      textField("currency", "Devise", "XOF"),
      numberField("weeklyCost", "Coût hebdomadaire observé", 25000, { min: 0.01 }),
      numberField("householdSize", "Personnes dans le foyer", 4, { min: 1, step: 1 }),
      numberField("weeks", "Semaines à budgéter", 4.33, { min: 0.01 }),
      numberField("changePct", "Variation depuis l’observation (%)", 0, { min: -100 }),
      textField("observedAt", "Date de l’observation", "2026-07-01"),
    ],
    metrics: {
      baseCost: "Panier de base",
      adjustedCost: "Budget ajusté du foyer",
      weeklyPerPerson: "Coût hebdomadaire par personne",
    },
    outputs: ["copy", "json"],
    source: "Même projection locale que /tools/staple-basket/; observations via /api/staple-baskets.",
    freshness: "La date du prix reste visible; l’API peut répondre vide ou indisponible sans transformer l’état en donnée live.",
    confidence: "Élevée pour la projection; variable pour le prix de départ.",
    limitations: "Qualité, unité, saison, promotion, disponibilité et marché modifient fortement le panier.",
    workflow: "staple-basket",
    endpoint: "/api/staple-baskets",
    responseKey: "recent_prices",
  });
}

function wholesaleRetailSpread() {
  return common({
    id: "wholesale-retail-spread",
    eyebrow: "Marchés de gros et de détail",
    title: "Marge gros–détail",
    description: "Mesurez le spread, la marge et le bénéfice brut pour un produit, une unité et une quantité précis. Le prix de gros et le prix de détail ne sont jamais mélangés entre marchés.",
    action: "Calculer la marge",
    fields: [
      textField("product", "Produit", "Huile de cuisson"),
      textField("unit", "Conditionnement ou unité", "Bidon de 5 L"),
      textField("currency", "Devise", "XOF"),
      numberField("wholesale", "Prix de gros par unité", 8000, { min: 0.01 }),
      numberField("retail", "Prix de détail par unité", 10000, { min: 0.01 }),
      numberField("quantity", "Quantité", 20, { min: 1 }),
      textField("observedAt", "Date des prix", "2026-07-01"),
    ],
    metrics: {
      unitSpread: "Écart par unité",
      spreadPct: "Majoration sur coût (%)",
      grossProfit: "Bénéfice brut",
      marginPct: "Marge sur vente (%)",
      cost: "Coût total",
      revenue: "Chiffre d’affaires",
    },
    outputs: ["copy", "json"],
    source: "Formules du propriétaire anglais et observations via /api/wholesale-retail-spreads.",
    freshness: "Chaque observation doit conserver date, marché, unité et preuve.",
    confidence: "Élevée pour l’arithmétique; variable pour les prix et volumes vendables.",
    limitations: "Transport, pertes, crédit, taxe, invendus et variation de qualité ne sont pas inclus sauf ajout au prix de gros.",
    workflow: "wholesale-margin",
    endpoint: "/api/wholesale-retail-spreads",
    responseKey: "spreads",
  });
}

function landSize() {
  return common({
    id: "land-size",
    eyebrow: "Parcelles et superficies",
    title: "Convertisseur de taille de terrain",
    description: "Convertissez dimensions, mètres carrés, hectares, acres et hypothèses locales de parcelle. Les tailles de « plot » restent des facteurs explicites, jamais une norme nationale.",
    action: "Convertir la superficie",
    fields: [
      selectField("mode", "Mode de saisie", "area", [option("area", "Superficie connue"), option("dimensions", "Longueur × largeur")]),
      numberField("area", "Superficie", 648, { min: 0.01 }),
      selectField("unit", "Unité de superficie", "sqm", [
        option("sqm", "m²"), option("sqft", "pieds²"), option("acre", "acre"),
        option("hectare", "hectare"), option("plot", "plot nigérian indicatif"),
        option("gplot", "plot ghanéen indicatif"), option("keighth", "1/8 acre kényan"),
        option("morgen", "morgen sud-africain"),
      ]),
      numberField("length", "Longueur", 60, { min: 0.01 }),
      numberField("width", "Largeur", 120, { min: 0.01 }),
      selectField("dimensionUnit", "Unité des dimensions", "ft", [option("m", "mètres"), option("ft", "pieds"), option("yd", "yards")]),
      numberField("pricePerSqm", "Prix indicatif par m²", 0, { min: 0 }),
      textField("currency", "Devise du prix", "NGN"),
    ],
    metrics: {
      sqm: "Mètres carrés",
      sqft: "Pieds carrés",
      hectares: "Hectares",
      acres: "Acres",
      estimatedPrice: "Valeur indicative",
    },
    outputs: ["copy", "json"],
    source: "Facteurs de conversion et hypothèses de parcelle de /tools/land-size/.",
    freshness: "Conversions physiques stables; hypothèses de plot à confirmer par géomètre et titre local.",
    confidence: "Élevée pour les unités standard; faible à moyenne pour les unités foncières informelles.",
    limitations: "Ce résultat ne prouve ni limites, titre, zonage, servitude, mesurage cadastral ni valeur marchande.",
    workflow: "land-conversion",
  });
}

function informalFxWatch() {
  return common({
    id: "informal-fx-watch",
    eyebrow: "Taux officiel et taux observé",
    title: "Suivi du change parallèle",
    description: "Mesurez l’écart entre un taux officiel et une observation datée de rue, BDC, P2P ou agent. L’observation n’est jamais qualifiée d’officielle ou de temps réel sans preuve.",
    action: "Calculer l’écart",
    fields: [
      textField("pair", "Paire de devises", "USD/NGN"),
      numberField("officialRate", "Taux officiel", 1550, { min: 0.000001 }),
      numberField("observedRate", "Taux observé", 1620, { min: 0.000001 }),
      numberField("amount", "Montant de base", 100, { min: 0.000001 }),
      selectField("marketType", "Type d’observation", "bdc", [
        option("street", "Rue"), option("bdc", "BDC / bureau de change"),
        option("p2p", "P2P"), option("agent", "Agent"), option("community", "Observation communautaire"),
      ]),
      textField("observedAt", "Date et heure de l’observation", "2026-07-01 12:00"),
    ],
    metrics: {
      officialValue: "Valeur au taux officiel",
      observedValue: "Valeur au taux observé",
      spread: "Écart de taux",
      spreadPct: "Écart (%)",
      difference: "Différence sur le montant",
    },
    outputs: ["copy", "json"],
    source: "Formule de spread de /tools/informal-fx-watch/; observations via /api/fx-spreads.",
    freshness: "La date et le type de marché sont obligatoires dans le contexte du résultat.",
    confidence: "Élevée pour le calcul; faible à variable pour une observation non prouvée.",
    limitations: "Ne constitue ni un devis, ni une recommandation de contrepartie, ni une preuve de légalité.",
    workflow: "fx-spread",
    endpoint: "/api/fx-spreads",
    responseKey: "rates",
  });
}

function costOfLiving() {
  const cities = [
    option("lagos", "Lagos, Nigeria"), option("nairobi", "Nairobi, Kenya"),
    option("joburg", "Johannesburg, Afrique du Sud"), option("accra", "Accra, Ghana"),
    option("cairo", "Le Caire, Égypte"), option("dar", "Dar es Salaam, Tanzanie"),
    option("kampala", "Kampala, Ouganda"), option("kigali", "Kigali, Rwanda"),
    option("cape", "Le Cap, Afrique du Sud"), option("addis", "Addis-Abeba, Éthiopie"),
    option("casablanca", "Casablanca, Maroc"), option("abuja", "Abuja, Nigeria"),
  ];
  return common({
    id: "cost-of-living",
    eyebrow: "Villes africaines",
    title: "Comparateur du coût de la vie",
    description: "Comparez deux villes avec le même panier intégré que l’outil anglais: logement, alimentation, transport, services et mode de vie. Les valeurs restent des repères en USD avec équivalent local.",
    action: "Comparer les villes",
    fields: [
      selectField("city1", "Première ville", "lagos", cities),
      selectField("city2", "Deuxième ville", "joburg", cities),
      numberField("householdSize", "Personnes dans le foyer", 1, { min: 1, step: 1 }),
      selectField("housing", "Logement", "rent1bed", [option("rent1bed", "Appartement 1 chambre au centre"), option("rent3bed", "Appartement 3 chambres au centre")]),
      selectField("lifestyle", "Profil de dépenses", "balanced", [option("local", "Budget local"), option("balanced", "Équilibré"), option("expat", "Profil expatrié")]),
    ],
    metrics: {
      city1TotalUsd: "Budget mensuel ville 1 (USD)",
      city2TotalUsd: "Budget mensuel ville 2 (USD)",
      cheaperCity: "Ville la moins chère",
      monthlyDifferenceUsd: "Écart mensuel (USD)",
      annualDifferenceUsd: "Écart annuel (USD)",
    },
    outputs: ["copy", "json"],
    source: "Panier statique et facteurs de profil de /tools/cost-of-living/.",
    freshness: "Instantané de planification intégré au propriétaire anglais; prix non temps réel.",
    confidence: "Moyenne pour un ordre de grandeur; faible pour un logement ou ménage précis.",
    limitations: "École, santé, visa, quartier, caution, trajet domicile-travail et inflation récente peuvent dominer l’écart.",
    workflow: "city-comparison",
  });
}

function afroAtlas() {
  return common({
    id: "afroatlas",
    eyebrow: "Économie et ressources africaines",
    title: "AfroAtlas en français",
    description: "Comparez deux pays à partir du même jeu de 54 profils que l’outil anglais. Le pays, le PIB, la population, les ressources et l’année de référence restent attachés à chaque ligne.",
    action: "Comparer les pays",
    fields: [
      selectField("countryA", "Premier pays", "nigeria", []),
      selectField("countryB", "Deuxième pays", "ghana", []),
    ],
    metrics: {
      largerEconomy: "Économie la plus grande",
      gdpDifferenceUsd: "Écart de PIB (USD)",
    },
    outputs: ["copy", "json"],
    source: "engines/src/afroatlas-engine.js, jeu de données embarqué du propriétaire anglais.",
    freshness: "Les années et valeurs intégrées au moteur sont affichées comme instantané; aucun chiffre n’est qualifié de live.",
    confidence: "Élevée pour la reproduction du jeu intégré; dépend des sources et années du profil.",
    limitations: "Les ressources ne prouvent ni réserves exploitables, ni droits miniers, ni revenu futur.",
    workflow: "country-resource-comparison",
    delegate: "AfroAtlas",
  });
}

function afroPoints() {
  return common({
    id: "afropoints",
    eyebrow: "Contributions de données africaines",
    title: "Planificateur AfroPoints",
    description: "Estimez les points d’un lot de contributions avec le barème exact de la catégorie choisie. Les points ne sont pas de l’argent garanti et l’envoi reste une action séparée avec authentification.",
    action: "Estimer les points",
    fields: [
      selectField("category", "Catégorie de contribution", "staple_price", []),
      numberField("records", "Observations préparées", 10, { min: 1, step: 1 }),
      numberField("acceptedRate", "Taux d’acceptation estimé (%)", 80, { min: 0, max: 100 }),
      numberField("pointsPerRecord", "Points par observation", 8, { min: 1, step: 1 }),
    ],
    metrics: {
      acceptedRecords: "Observations acceptées estimées",
      pendingRecords: "Observations non acceptées",
      estimatedPoints: "Points estimés",
    },
    outputs: ["copy", "json"],
    source: "Barèmes et catégories de engines/src/afropoints-engine.js.",
    freshness: "Barème embarqué; tout changement serveur doit être confirmé avant une contribution réelle.",
    confidence: "Élevée pour la formule; aucune garantie d’acceptation, de rang ou de valeur monétaire.",
    limitations: "La modération, la preuve, les limites quotidiennes et l’éligibilité du compte déterminent le résultat réel.",
    workflow: "contribution-points",
    delegate: "AfroPointsEngine",
  });
}

function afroKitchen() {
  return common({
    id: "afrokitchen",
    eyebrow: "Recettes et cuisines africaines",
    title: "AfroCuisine",
    description: "Redimensionnez une recette du jeu AfroKitchen sans renommer ses ingrédients locaux ni effacer son origine. La fiche conserve le pays, le nom local, les portions et les précautions alimentaires.",
    action: "Adapter les quantités",
    fields: [
      selectField("recipe", "Recette", "nigerian-jollof-rice", []),
      numberField("targetServings", "Portions souhaitées", 12, { min: 1, step: 1 }),
      numberField("originalServings", "Portions de la recette", 6, { min: 1, step: 1 }),
    ],
    metrics: {
      scaleFactor: "Facteur de mise à l’échelle",
      ingredientCount: "Ingrédients adaptés",
      targetServings: "Portions finales",
    },
    outputs: ["copy", "txt", "json"],
    source: "engines/src/afrokitchen-engine.js et son jeu SEED_RECIPES; données de cuisine complémentaires du propriétaire anglais.",
    freshness: "Recettes embarquées, pas un flux live. Les substitutions et prix locaux doivent être vérifiés.",
    confidence: "Élevée pour la mise à l’échelle; moyenne pour les volumes de cuisson et substitutions.",
    limitations: "Allergènes, cuisson, disponibilité, tailles de marmite et mesures locales nécessitent une vérification humaine.",
    workflow: "recipe-scaling",
    delegate: "AfroKitchenEngine",
  });
}

function africaConflict() {
  return common({
    id: "africa-conflict",
    eyebrow: "Information sur les conflits",
    title: "Carte des conflits en Afrique",
    description: "Filtrez les mêmes dossiers structurés que le tableau anglais et conservez statut, pays, date, déplacement et source. Un état vide ou indisponible reste explicite.",
    action: "Appliquer le filtre",
    fields: [
      selectField("status", "Statut ou gravité", "all", [
        option("all", "Tous les dossiers"), option("critical", "Critique"),
        option("high", "Élevé"), option("medium", "Moyen"), option("low", "Faible"),
        option("active", "Actif"), option("escalating", "En escalade"),
      ]),
    ],
    metrics: {
      records: "Dossiers correspondants",
      displaced: "Personnes déplacées dans les dossiers",
      weightedSeverity: "Indice descriptif de gravité",
      empty: "Filtre sans résultat",
    },
    outputs: ["copy", "txt", "json"],
    source: "engines/src/africa-conflict-engine.js et endpoint /.netlify/functions/conflict-data.",
    freshness: "La date de mise à jour et l’état réseau sont affichés. La page ne prétend jamais fournir une alerte de sécurité live.",
    confidence: "Variable par dossier et signal de preuve.",
    limitations: "Ne sert pas à décider d’un déplacement immédiat. Consultez les autorités, ambassades et organismes humanitaires compétents.",
    workflow: "conflict-filter",
    delegate: "AfroConflict",
  });
}

function diasporaGuide() {
  return common({
    id: "diaspora-guide",
    eyebrow: "Résidence et transferts diaspora",
    title: "Guide de planification diaspora",
    description: "Situez un nombre de jours par rapport à un seuil saisi et préparez les questions de résidence, convention fiscale et transfert. Aucun seuil n’est présenté comme universel.",
    action: "Préparer le contrôle de résidence",
    fields: [
      textField("origin", "Pays d’origine", "Sénégal"),
      textField("destination", "Pays de résidence ou séjour", "France"),
      numberField("daysPresent", "Jours présents pendant la période", 120, { min: 0, max: 366, step: 1 }),
      numberField("residencyThreshold", "Seuil à vérifier dans la règle applicable", 183, { min: 1, max: 366, step: 1 }),
      numberField("annualRemittance", "Transferts annuels prévus", 5000, { min: 0 }),
      textField("currency", "Devise", "EUR"),
    ],
    metrics: {
      daysToThreshold: "Jours avant le seuil saisi",
      thresholdReached: "Seuil saisi atteint",
      annualRemittance: "Transferts annuels préparés",
    },
    outputs: ["copy", "json"],
    source: "Workflow déterministe de /tools/diaspora-guide/; le seuil reste une entrée à vérifier.",
    freshness: "Règles fiscales et migratoires changeantes: datez la source officielle consultée.",
    confidence: "Élevée pour le comptage; aucune conclusion fiscale automatique.",
    limitations: "La résidence dépend aussi du foyer, du domicile, du travail, des conventions et des règles locales. Ce n’est pas un avis fiscal.",
    workflow: "diaspora-residency",
  });
}

function nollywoodPitch() {
  return common({
    id: "nollywood-pitch",
    eyebrow: "Production Nollywood",
    title: "Budget et pitch Nollywood",
    description: "Construisez un top sheet avec préproduction, tournage, postproduction, distribution, imprévus et financement. Les catégories et la logique restent celles du propriétaire anglais.",
    action: "Calculer le budget",
    fields: [
      textField("project", "Titre ou logline", "Long métrage familial à Lagos"),
      textField("currency", "Devise", "NGN"),
      numberField("preProduction", "Préproduction", 2000000, { min: 0.01 }),
      numberField("production", "Production / tournage", 8000000, { min: 0.01 }),
      numberField("postProduction", "Postproduction", 2500000, { min: 0.01 }),
      numberField("distribution", "Distribution et livrables", 1000000, { min: 0 }),
      numberField("contingencyPct", "Imprévus (%)", 10, { min: 0 }),
      numberField("shootDays", "Jours de tournage", 15, { min: 1, step: 1 }),
      numberField("fundedPct", "Budget déjà sécurisé (%)", 40, { min: 0, max: 100 }),
    ],
    metrics: {
      subtotal: "Sous-total",
      contingency: "Imprévus",
      total: "Budget total",
      costPerShootDay: "Coût par jour de tournage",
      secured: "Financement sécurisé",
      fundingGap: "Besoin de financement",
    },
    outputs: ["copy", "txt", "json"],
    source: "Top-sheet et logique de financement de /tools/nollywood-pitch/.",
    freshness: "Hypothèses budgétaires statiques; devis de lieux, équipes, matériel et livrables à dater.",
    confidence: "Élevée pour l’addition; variable pour les coûts de production réels.",
    limitations: "Droits, assurances, classification, musique, change, sécurité, transport et fiscalité peuvent créer des postes supplémentaires.",
    workflow: "nollywood-budget",
  });
}

function okadaIncome() {
  return common({
    id: "okada-income",
    eyebrow: "Okada · Boda-boda · Moto-taxi",
    title: "Revenu d’un conducteur moto-taxi",
    description: "Estimez recettes, coûts et bénéfice mensuel avec les mêmes défauts pays et la même base de 4,33 semaines que l’outil anglais.",
    action: "Calculer le revenu",
    fields: [
      selectField("country", "Marché de référence", "ng", [
        option("ng", "Nigeria — Okada"), option("ke", "Kenya — Boda-boda"),
        option("ug", "Ouganda — Boda-boda"), option("gh", "Ghana — Okada"),
      ]),
      numberField("trips", "Courses par jour", 15, { min: 1 }),
      numberField("fare", "Tarif moyen par course", 300, { min: 0.01 }),
      numberField("daysPerWeek", "Jours travaillés par semaine", 6, { min: 1, max: 7 }),
      numberField("slowDays", "Jours non travaillés par mois", 3, { min: 0 }),
      numberField("fuel", "Carburant par jour", 1500, { min: 0 }),
      numberField("ownerPay", "Versement au propriétaire par jour", 0, { min: 0 }),
      numberField("maintenance", "Entretien par semaine", 500, { min: 0 }),
      numberField("insurance", "Assurance par mois", 0, { min: 0 }),
      numberField("phone", "Téléphone et données par mois", 2000, { min: 0 }),
      numberField("commissionPct", "Commission plateforme (%)", 0, { min: 0, max: 100 }),
      numberField("loan", "Mensualité moto", 0, { min: 0 }),
      numberField("parking", "Stationnement et permis par jour", 0, { min: 0 }),
      numberField("savePct", "Part du bénéfice à épargner (%)", 20, { min: 0, max: 80 }),
      numberField("bikeGoal", "Objectif d’achat de la moto", 700000, { min: 0 }),
      numberField("reserveGoal", "Objectif de réserve d’urgence", 100000, { min: 0 }),
    ],
    metrics: {
      monthlyGross: "Recettes mensuelles",
      expenses: "Dépenses mensuelles",
      monthlyProfit: "Bénéfice mensuel",
      dailyProfit: "Bénéfice par jour travaillé",
      profitMarginPct: "Marge (%)",
      breakEvenTrips: "Courses nécessaires pour couvrir les coûts",
      monthlySavings: "Épargne mensuelle prévue",
      bikeMonths: "Mois jusqu’à l’objectif moto",
      reserveMonths: "Mois jusqu’à la réserve",
    },
    outputs: ["copy", "json"],
    source: "Défauts pays et formule de /tools/okada-income/.",
    freshness: "Les défauts sont un instantané de planification; tarifs, carburant et réglementation doivent être vérifiés localement.",
    confidence: "Élevée pour la formule; moyenne à faible si courses, carburant ou jours perdus sont estimés.",
    limitations: "Accidents, amendes, interdictions locales, assurance, réparations lourdes et saisonnalité ne sont pas prédits.",
    workflow: "rider-income",
  });
}

function afroPrices() {
  return common({
    id: "afroprices",
    eyebrow: "Prix comparables en Afrique",
    title: "AfroPrix",
    description: "Recherchez un produit dans le jeu AfroPrices puis comparez uniquement les lignes qui conservent pays, ville, unité, devise, source et date.",
    action: "Rechercher et comparer",
    fields: [
      textField("query", "Produit ou modèle", "Samsung"),
      selectField("country", "Marché de recherche", "NG", [
        option("NG", "Nigeria"),
        option("KE", "Kenya"),
        option("GH", "Ghana"),
        option("ZA", "Afrique du Sud"),
        option("EG", "Égypte"),
        option("TZ", "Tanzanie"),
        option("MA", "Maroc"),
        option("UG", "Ouganda"),
        option("RW", "Rwanda"),
        option("CI", "Côte d’Ivoire"),
      ]),
      numberField("quantity", "Quantité comparable", 1, { min: 0.01 }),
    ],
    metrics: {
      records: "Prix comparables",
      cheapestCountry: "Pays du prix le plus bas",
      cheapestTotal: "Total le plus bas",
      highestTotal: "Total le plus haut",
      savings: "Écart maximal",
    },
    outputs: ["copy", "json"],
    source: "engines/src/afroprices-engine.js, recherche et dossiers du propriétaire anglais.",
    freshness: "Chaque prix conserve sa date et sa source; aucun résultat n’est qualifié de live sans état explicite.",
    confidence: "Variable selon unité, date, source et couverture du produit.",
    limitations: "Change, taxe, garantie, état, transport, contrefaçon et disponibilité peuvent rendre deux prix non comparables.",
    workflow: "price-search",
    delegate: "AfroPricesEngine",
  });
}

function ankaraKenteCost() {
  return common({
    id: "ankara-kente-cost",
    eyebrow: "Ankara · Kente · Bogolan · Adinkra",
    title: "Coût Ankara et Kente",
    description: "Établissez un devis par pièce en conservant tissu, yards, qualité, main-d’œuvre, emballage, livraison et marge. Aucun multiplicateur d’export n’est présenté comme prix garanti.",
    action: "Établir le devis",
    fields: [
      selectField("fabricType", "Tissu", "ankara", [
        option("ankara", "Ankara / wax"), option("kente", "Kente"),
        option("adinkra", "Adinkra"), option("bogolan", "Bogolan"),
      ]),
      textField("currency", "Devise", "NGN"),
      numberField("fxRate", "Unités locales pour 1 USD", 1660, { min: 0.000001 }),
      numberField("pricePerYard", "Prix par yard", 3500, { min: 0.01 }),
      numberField("yards", "Yards pour la commande", 12, { min: 0.01 }),
      numberField("units", "Pièces à confectionner", 4, { min: 1, step: 1 }),
      numberField("labourPerPiece", "Main-d’œuvre par pièce", 8000, { min: 0 }),
      numberField("packagingPerPiece", "Emballage par pièce", 1000, { min: 0 }),
      numberField("shippingOrder", "Livraison de la commande", 5000, { min: 0 }),
      numberField("marginPct", "Marge cible (%)", 30, { min: 0 }),
    ],
    metrics: {
      material: "Tissu total",
      materialUsd: "Tissu en USD",
      costPerPiece: "Coût de revient par pièce",
      quotePerPiece: "Devis par pièce",
      orderTotal: "Total de la commande",
      grossProfitPerPiece: "Bénéfice brut par pièce",
    },
    outputs: ["copy", "json", "print"],
    source: "Logique de devis de /tools/ankara-kente-cost/; prix et change saisis explicitement.",
    freshness: "Prix du tissu, change et livraison à dater avant le devis.",
    confidence: "Élevée pour l’arithmétique; dépend des mesures, du sens du motif et des devis fournisseurs.",
    limitations: "Douane, défauts, raccord de motif, doublure, retouches et tissu inutilisé doivent être convenus avec le client.",
    workflow: "fabric-production-quote",
  });
}

function fabricCost() {
  return common({
    id: "fabric-cost",
    eyebrow: "Confection et matières",
    title: "Coût du tissu et des fournitures",
    description: "Calculez matière, perte, fournitures, main-d’œuvre et prix client sans confondre coût du tissu et coût de production.",
    action: "Calculer le prix de confection",
    fields: [
      textField("garment", "Vêtement", "Robe doublée"),
      textField("currency", "Devise", "XOF"),
      numberField("fxRate", "Unités locales pour 1 USD", 615, { min: 0.000001 }),
      numberField("pricePerYard", "Prix par yard", 6000, { min: 0.01 }),
      numberField("yards", "Yards nécessaires avant perte", 4, { min: 0.01 }),
      numberField("wastePct", "Perte et raccord de motif (%)", 15, { min: 0 }),
      numberField("notions", "Fermeture, boutons, fil, doublure", 5000, { min: 0 }),
      numberField("labour", "Main-d’œuvre", 15000, { min: 0 }),
      numberField("marginPct", "Marge cible (%)", 30, { min: 0 }),
    ],
    metrics: {
      yardsWithWaste: "Yards avec perte",
      fabricCost: "Coût du tissu",
      notions: "Fournitures",
      materialCost: "Matières et fournitures",
      productionCost: "Coût de production",
      quote: "Prix client",
      grossProfit: "Bénéfice brut",
      quoteUsd: "Prix client en USD",
    },
    outputs: ["copy", "json", "print"],
    source: "Formule de confection de /tools/fabric-cost/.",
    freshness: "Prix, change et main-d’œuvre à confirmer au moment du devis.",
    confidence: "Élevée pour le calcul; dépend des mesures, de la largeur du tissu et de la complexité.",
    limitations: "Retouches, broderie, urgence, transport et changement de mesures nécessitent des lignes supplémentaires.",
    workflow: "garment-cost",
  });
}

const PRESENTATION_FACTORIES = Object.freeze({
  "fintech-fee-watch": fintechFeeWatch,
  "ajo-chama": ajoTracker,
  "electricity-estimator": electricityEstimator,
  "fuel-cost": fuelCost,
  "hawala-tracker": hawalaTracker,
  "staple-basket": stapleBasket,
  "wholesale-retail-spread": wholesaleRetailSpread,
  "land-size": landSize,
  "informal-fx-watch": informalFxWatch,
  "cost-of-living": costOfLiving,
  afroatlas: afroAtlas,
  afropoints: afroPoints,
  afrokitchen: afroKitchen,
  "africa-conflict": africaConflict,
  "diaspora-guide": diasporaGuide,
  "nollywood-pitch": nollywoodPitch,
  "okada-income": okadaIncome,
  afroprices: afroPrices,
  "ankara-kente-cost": ankaraKenteCost,
  "fabric-cost": fabricCost,
});

function getPresentation(toolId) {
  const factory = PRESENTATION_FACTORIES[toolId];
  return factory ? factory() : null;
}

module.exports = {
  PRESENTATION_FACTORIES,
  getPresentation,
};
