(function (window, document) {
  "use strict";

  var CONTRACTS = window.AFRO_FR_SPORTS_CONTRACTS || {};
  var FIELD_LABELS = {
    actualReceived: "Montant réellement reçu", admissions: "Entrées prévues", affiliateFee: "Rémunération affiliation ou influence",
    age: "Âge", agentFee: "Frais d’agent ou de gestion (%)", albumCost: "Album ou tirages",
    annualGrowth: "Croissance annuelle du contrat (%)", appleStreams: "Écoutes Apple Music", artistFees: "Cachets artistes",
    artistMasterShare: "Part artiste sur le master (%)", assists: "Passes décisives", attendance: "Taux de présence prévu (%)",
    audiomackStreams: "Écoutes Audiomack", averageLegOdds: "Cote moyenne par sélection", avgTicket: "Prix moyen du billet (NGN)",
    bonus: "Points bonus", boomplayStreams: "Écoutes Boomplay", brandTieIns: "Partenariats de marque (NGN)",
    budget: "Budget total en devise locale", cac: "Coût d’acquisition d’un client", capacity: "Capacité du lieu",
    captain: "Multiplicateur", channel: "Canal d’achat", cinemaShare: "Part cinéma ou exploitant (%)",
    cleanSheet: "Match sans but encaissé", coachEmails: "Messages envoyés aux entraîneurs",
    collaboratorShare: "Part producteur ou collaborateur (%)", compTickets: "Invitations", competitionLevel: "Plus haut niveau de compétition",
    contingency: "Aléas (%)", coreCourses: "Cours fondamentaux identifiés", country: "Marché",
    crowdSize: "Public prévu", currency: "Devise", deezerStreams: "Écoutes Deezer",
    defenseBoost: "Bonus de stabilité défensive", defensiveActions: "Contributions défensives", deliverables: "Nombre de livrables finaux",
    demand: "Niveau de demande", depositTaxPct: "Taxe personnalisée sur dépôt ou mise (%)", distributionExpenses: "Frais de distribution (NGN)",
    distributorFee: "Frais du distributeur (%)", drone: "Prise de vue par drone", earlyBirdPrice: "Prix prévente",
    earlyBirdTickets: "Billets prévente vendus", editDays: "Jours de montage", englishScore: "Score d’anglais ou équivalent",
    equipment: "Matériel fourni", equipmentCost: "Location de matériel par jour", equipmentFinance: "Financement du matériel",
    estimatedProbability: "Votre probabilité estimée de victoire", eventType: "Type d’événement", experience: "Niveau du DJ",
    extraCrew: "Membres d’équipe supplémentaires", favorite: "Équipe à tester", fixedCosts: "Coûts fixes de l’événement",
    fixtureDifficulty: "Difficulté du match (1 à 5)", foodCost: "Repas et boissons", formBoost: "Bonus de forme récente",
    gameType: "Usage principal", gatewayFee: "Frais de paiement (%)", goals: "Buts",
    goalsConceded: "Buts encaissés", gpa: "Moyenne estimée sur 4,0", grossPayout: "Paiement brut en cas de gain",
    homeMatches: "Matchs à domicile inclus", hostBoost: "Avantage du pays hôte ou du public", hours: "Durée du set (heures)",
    injuryReserve: "Réserve d’indisponibilité (%)", insuranceCost: "Assurance et couverture médicale",
    investorRecoupPct: "Part de recoupement investisseur (%)", level: "Niveau actuel", market: "Marché fiscal",
    marketingBudget: "Budget marketing (NGN)", marketingCost: "Coût marketing", marketingSpend: "Dépenses marketing facturées (USD)",
    matchTier: "Niveau de compétition", mcService: "Inclure un service de présentation", members: "Membres actifs payants",
    minutes: "Minutes jouées", mode: "Mode", monthlyChurn: "Attrition mensuelle (%)",
    monthlyEndorsements: "Sponsoring mensuel", monthlyFee: "Cotisation mensuelle moyenne",
    monthlySalary: "Salaire mensuel actuel (facultatif)", oddsFormat: "Format de cote", oddsValue: "Valeur de la cote",
    opponentOddsFormat: "Format de cote du côté opposé", opponentOddsValue: "Cote du côté opposé",
    otherCosts: "Autres coûts mensuels", overheadPct: "Frais généraux (%)", ownGoals: "Buts contre son camp",
    ownerSalary: "Rémunération du gérant", parkingCost: "Stationnement ou accès", parlayLegs: "Sélections du combiné",
    pathway: "Parcours visé", peakDay: "Date très demandée ou période de décembre", penaltyMisses: "Penalties manqués",
    penaltySaves: "Penalties arrêtés", peripherals: "Inclure écran et périphériques", permitCost: "Autorisations et licences",
    platformFee: "Frais de plateforme (%)", playerPrice: "Prix du joueur (millions)", position: "Poste",
    productionBudget: "Budget de production (NGN)", productionCost: "Coût de production", projectType: "Type de projet",
    ptRevenue: "Revenus de coaching individuel", quantity: "Nombre de billets", recoupableAdvance: "Avance restant à recouper (USD)",
    redCards: "Cartons rouges", refundRate: "Réserve remboursements ou absences (%)", regularPrice: "Prix standard",
    regularTicket: "Prix du billet standard", regularTickets: "Billets standard vendus",
    relocationCost: "Déménagement et soutien familial", rent: "Loyer mensuel", resolution: "Définition visée",
    responseRate: "Taux de réponse des entraîneurs (%)", retailRevenue: "Revenus boutique ou boissons",
    retirementContribution: "Réserve retraite (%)", revisionRounds: "Séries de révisions incluses", rush: "Livraison urgente",
    saves: "Arrêts (gardien uniquement)", savingsRate: "Taux d’épargne sur le net (%)", seasonPassPrice: "Prix de l’abonnement",
    seatType: "Catégorie de place", securityCost: "Sécurité et conformité", setupHours: "Installation et balance (heures)",
    shootDays: "Jours de tournage", signingBonus: "Prime à la signature", songwriterShare: "Part auteur-compositeur (%)",
    sourceType: "Mode d’achat", sponsorRevenue: "Revenus de sponsoring", sport: "Sport",
    spotifyStreams: "Écoutes Spotify", staffCost: "Coût mensuel du personnel", stake: "Mise ou dépôt",
    startProbability: "Probabilité de titularisation (%)", startupCost: "Investissement initial", streamingDeal: "Accord de streaming (NGN)",
    studentPrice: "Prix étudiant", studentTickets: "Billets étudiant vendus", targetIncome: "Objectif de revenu net (USD)",
    targetSchools: "Établissements ciblés étudiés", taxReserve: "Réserve fiscale (%)", ticketingFee: "Frais billetterie ou paiement (%)",
    tidalStreams: "Écoutes Tidal", transcripts: "Relevés officiels prêts", transportCost: "Transport",
    travelCost: "Déplacement et logistique", upsetTolerance: "Volatilité des surprises", usage: "Droits d’usage",
    usedParts: "Utiliser des pièces d’occasion vérifiées", utilities: "Énergie et internet", vendorRevenue: "Revenus des stands",
    venueCost: "Coût du lieu", video: "Vidéo de présentation prête", vipPrice: "Prix VIP",
    vipShare: "Part VIP des billets vendus (%)", vipTicket: "Prix du billet VIP", vipTickets: "Billets VIP vendus",
    whtPct: "Retenue personnalisée sur les gains (%)", yearsRemaining: "Années restantes", yellowCards: "Cartons jaunes",
    youtubeStreams: "Écoutes YouTube Music"
  };

  var OPTIONS = {
    "2025 review and what-if mode": "Revue 2025 et scénarios alternatifs",
    "2027 planning mode": "Planification 2027",
    "AAA gaming": "Jeu AAA",
    "Academy or amateur": "Académie ou amateur", "American, e.g. +150 or -200": "Américaine, ex. +150 ou -200",
    "American, e.g. +170 or -150": "Américaine, ex. +170 ou -150", "Athletics": "Athlétisme",
    "Basketball": "Basket-ball", "Box/hospitality": "Loge ou hospitalité", "Boxing": "Boxe",
    "Broadcast or large campaign": "Diffusion ou grande campagne", "CAF/continental match": "Match CAF ou continental",
    "Canada university sport": "Sport universitaire au Canada", "Captain, 2x": "Capitaine, ×2",
    "Client supplies everything": "Le client fournit tout", "Club night": "Soirée en club",
    "Commercial campaign": "Campagne commerciale", "Continental/top club": "Club continental ou de premier plan",
    "Corporate event": "Événement d’entreprise", "Custom market": "Marché personnalisé",
    "Decimal, e.g. 2.50": "Décimale, ex. 2,50", "Decimal, e.g. 2.70": "Décimale, ex. 2,70",
    "Deck/controller only": "Contrôleur uniquement", "Defender": "Défenseur", "Emerging": "En développement",
    "Esports, 1080p high FPS": "E-sport, 1080p à fréquence élevée", "Europe or global league": "Championnat européen ou mondial",
    "Event coverage": "Couverture d’événement", "Festival": "Festival", "Final or trophy game": "Finale ou match pour un trophée",
    "Football": "Football", "Forward": "Attaquant", "Fractional, e.g. 17/10": "Fractionnaire, ex. 17/10",
    "Fractional, e.g. 6/4": "Fractionnaire, ex. 6/4", "Gaming plus content creation": "Jeu et création de contenu",
    "Gate or club office": "Guichet ou bureau du club", "Goalkeeper": "Gardien", "Headline act": "Tête d’affiche",
    "Import parts": "Importer les composants", "International selection": "Sélection internationale",
    "Known city act": "Artiste reconnu dans la ville", "Local league": "Championnat local",
    "Local multiplier, e.g. 2.5": "Multiplicateur local, ex. 2,5", "Local multiplier, e.g. 2.7": "Multiplicateur local, ex. 2,7",
    "Local professional": "Professionnel local", "Local retailers": "Revendeurs locaux",
    "Major derby or rivalry": "Grand derby ou rivalité", "Midfielder": "Milieu", "Music video": "Clip musical",
    "National competition": "Compétition nationale", "National team qualifier": "Qualification d’équipe nationale",
    "No": "Non", "No, new parts only": "Non, pièces neuves uniquement", "No, tower only": "Non, unité centrale uniquement",
    "Normal fixture": "Match ordinaire", "Normal player": "Joueur normal", "Official online platform": "Plateforme officielle en ligne",
    "Paid campaign": "Campagne payante", "Personal/private use": "Usage personnel ou privé",
    "Portrait/session": "Portrait ou séance", "Private party": "Fête privée", "Real estate/property": "Immobilier",
    "Regular seat": "Place standard", "Reseller/agent": "Revendeur ou intermédiaire", "Rivalry match": "Match de rivalité",
    "Rugby": "Rugby", "School/local club": "École ou club local", "Small business marketing": "Communication d’une petite entreprise",
    "Sound system": "Sonorisation", "Sound, lights, booth": "Son, éclairage et cabine",
    "State/regional": "Régional", "Title race or qualifier": "Course au titre ou qualification",
    "Top national league": "Premier championnat national", "Triple captain, 3x": "Triple capitaine, ×3",
    "UK university sport": "Sport universitaire au Royaume-Uni", "VIP": "VIP", "Wedding": "Mariage",
    "Wedding or owambe": "Mariage ou owambe", "Working professional": "Professionnel confirmé",
    "Yes": "Oui", "Yes, some parts": "Oui, certaines pièces"
  };

  var COUNTRIES = {
    Algeria: "Algérie", Cameroon: "Cameroun", "Cote d'Ivoire": "Côte d’Ivoire", Egypt: "Égypte",
    Ethiopia: "Éthiopie", Gambia: "Gambie", Morocco: "Maroc", Nigeria: "Nigeria",
    "South Africa": "Afrique du Sud", Tanzania: "Tanzanie", Tunisia: "Tunisie", Uganda: "Ouganda"
  };

  var RESULT_LABELS = {
    "Actual received from slip": "Montant réellement reçu", "Advance recouped this period": "Avance recoupée sur la période",
    "Affiliate or influencer payout": "Rémunération affiliation ou influence", "Age review": "Vérification de l’âge",
    "Agent fee reserve": "Réserve frais d’agent", "Album/print production": "Album ou tirages",
    "American odds": "Cote américaine", "Appearance, 60+ minutes": "Présence, 60 minutes ou plus",
    "Apple": "Apple Music", "Artist fees": "Cachets artistes", "Artist master share": "Part artiste sur le master",
    "Athletic proof": "Preuves sportives", "Average paid ticket": "Billet payé moyen", "Average ticket yield": "Rendement moyen par billet",
    "Base country benchmark": "Référence du marché", "Base performance fee": "Cachet de base", "Base score": "Score de base",
    "Bonus points": "Points bonus", "Booking deposit": "Acompte de réservation", "Box office gross": "Box-office brut",
    "Break-even admissions": "Entrées au seuil de rentabilité", "Break-even members": "Membres au seuil de rentabilité",
    "Career gross": "Revenu brut de carrière", "Channel fee": "Frais du canal", "Clean sheet": "Match sans but encaissé",
    "Coach reply rate": "Taux de réponse des entraîneurs", "Collaborator split": "Part collaborateur",
    "Comp tickets": "Invitations", "Contingency": "Aléas", "Core build budget": "Budget unité centrale",
    "Core courses entered": "Cours fondamentaux saisis", "Crowd-size lift": "Majoration selon le public",
    "Decimal odds": "Cote décimale", "Deliverable handling": "Gestion des livrables", "Deposit": "Acompte",
    "Deposit or stake duty": "Taxe sur dépôt ou mise", "Distribution expenses": "Frais de distribution",
    "Distributor fee": "Frais du distributeur", "Drone add-on": "Option drone", "Early-bird gross": "Brut prévente",
    "Editing fee": "Montage", "Effective drag": "Prélèvement effectif", "Endorsements per month": "Sponsoring mensuel",
    "English score": "Score d’anglais", "Equipment line": "Matériel", "Equipment rental": "Location de matériel",
    "Estimated member LTV": "Valeur client estimée", "Estimated net": "Net estimé", "Expected performance": "Performance attendue",
    "Expected value": "Valeur attendue", "Extra crew": "Équipe supplémentaire", "Extra hours": "Heures supplémentaires",
    "Extra revision rounds": "Révisions supplémentaires", "Fair odds from your estimate": "Cote juste selon votre estimation",
    "Favorite rank": "Rang de l’équipe testée", "Fees and refunds": "Frais et remboursements", "Field pressure": "Poids du reste du plateau",
    "Fixture-adjusted expectation": "Estimation ajustée au match", "Food and drinks": "Repas et boissons",
    "Fractional odds": "Cote fractionnaire", "GPA entered": "Moyenne saisie", "GPA target": "Moyenne cible",
    "Goals scored": "Buts marqués", "Gross estimate": "Estimation brute", "Gross payout if won": "Paiement brut en cas de gain",
    "Gross sales": "Ventes brutes", "Highlight video": "Vidéo de présentation", "Implied chance": "Probabilité implicite",
    "Injury reserve": "Réserve d’indisponibilité", "Investor recoup": "Recoupement investisseur",
    "Investor recoup waterfall": "Ordre de recoupement investisseur", "LTV/CAC": "Valeur client / acquisition",
    "MC or host add-on": "Option présentation", "MC/host service": "Service de présentation",
    "Market implied": "Implicite du marché", "Marketing and fixed costs": "Marketing et coûts fixes",
    "Marketing budget": "Budget marketing", "Marketing spend charged": "Dépenses marketing imputées",
    "Match tier and demand lift": "Majoration niveau et demande", "Match-day extras": "Dépenses du jour de match",
    "Membership revenue": "Revenus des abonnements", "Minutes": "Minutes", "Monthly baseline": "Base mensuelle",
    "Monthly churn": "Attrition mensuelle", "Monthly fixed costs": "Coûts fixes mensuels",
    "Most likely final path": "Finale la plus probable du scénario", "Net payout": "Paiement net",
    "Net winnings before tax": "Gain net avant taxe", "Next contract target": "Objectif du prochain contrat",
    "No-vig fair odds for your side": "Cote juste sans marge pour votre côté",
    "No-vig probability for your side": "Probabilité sans marge pour votre côté", "Non-dues revenue": "Revenus hors cotisations",
    "Outreach engine": "Démarches auprès des établissements", "Overhead": "Frais généraux",
    "Owner/operator salary": "Rémunération du gérant", "PSU guidance": "Conseil alimentation",
    "PT and retail revenue": "Coaching et ventes annexes", "Parking or local access": "Stationnement ou accès",
    "Parlay stress test": "Test du combiné", "Payback period": "Délai de retour", "Peak-day premium": "Majoration date demandée",
    "Permits and insurance": "Autorisations et assurance", "Player value": "Valeur du joueur",
    "Potential profit": "Bénéfice potentiel", "Price uplift": "Majoration de prix", "Producer cinema share": "Part cinéma du producteur",
    "Producer revenue": "Revenu producteur", "Production budget": "Budget de production", "Readiness": "Préparation",
    "Recoup left": "Reste à recouper", "Regular gross": "Brut standard", "Relocation and family support": "Déménagement et soutien familial",
    "Retirement reserve": "Réserve retraite", "Rush premium": "Majoration urgence", "Season pass value": "Valeur de l’abonnement",
    "Season per match": "Abonnement par match", "Seat multiplier": "Coefficient de place", "Security and marketing": "Sécurité et marketing",
    "Setup and soundcheck time": "Installation et balance", "Shoot fee": "Tournage", "Signing bonus": "Prime à la signature",
    "Single ticket": "Billet à l’unité", "Slip audit gap": "Écart avec le coupon", "Songwriter/publishing estimate": "Estimation auteur et édition",
    "Sponsor revenue": "Revenus de sponsoring", "Sponsor/vendor cover": "Couverture sponsors et stands",
    "Stake or wallet deposit": "Mise ou dépôt", "Startup investment": "Investissement initial",
    "Streaming and brand revenue": "Streaming et partenariats", "Streams for target": "Écoutes nécessaires pour l’objectif",
    "Student gross": "Brut étudiant", "Suggested quote range": "Fourchette de devis", "Suggested savings": "Épargne suggérée",
    "Target resolution": "Définition visée", "Target schools": "Établissements ciblés", "Tax reserve": "Réserve fiscale",
    "Ticket quantity": "Nombre de billets", "Ticket revenue": "Revenus billetterie",
    "Ticket subtotal with channel fee": "Sous-total avec frais du canal", "Ticketing and gateway fees": "Frais de billetterie et paiement",
    "Top contender": "Favori du scénario", "Total costs": "Coûts totaux", "Total return": "Retour total",
    "Transcripts": "Relevés", "Transport": "Transport", "Travel": "Déplacement", "Travel and logistics": "Déplacement et logistique",
    "Two-way market overround": "Marge du marché à deux issues", "Upset setting": "Niveau de surprise",
    "Usage fee": "Droits d’usage", "Used-parts discount model": "Décote des pièces d’occasion",
    "VIP gross": "Brut VIP", "Value": "Valeur", "Vendor booth revenue": "Revenus des stands",
    "Venue and production": "Lieu et production", "WHT on winnings": "Retenue sur les gains",
    "Withheld on winnings": "Retenue sur les gains", "Your edge": "Votre écart", "Your estimate": "Votre estimation"
  };

  var VALUE_REPLACEMENTS = [
    [/title probability/g, "de probabilité de titre"], [/model share/g, "de part du modèle"],
    [/among 24 teams/g, "sur 24 équipes"], [/chance someone else wins/g, "de probabilité pour le reste du plateau"],
    [/higher means less confidence in favorites/g, "un niveau élevé réduit la certitude sur les favoris"],
    [/implied chance/g, "de probabilité implicite"], [/break-even probability/g, "probabilité au seuil"],
    [/estimate minus market/g, "estimation moins marché"], [/per bet at your estimate/g, "par scénario selon votre estimation"],
    [/legs at avg/g, "sélection(s) à une cote moyenne de"], [/points per million/g, "point(s) par million"],
    [/using ([0-9.]+)% start probability/g, "avec $1 % de probabilité de titularisation"],
    [/before multiplier/g, "avant multiplicateur"], [/clean-sheet eligible/g, "éligible au bonus défensif"],
    [/before splits/g, "avant répartitions"], [/after cinema\/distributor split/g, "après parts cinéma et distribution"],
    [/salary plus endorsements/g, "salaire et sponsoring"], [/active paying members/g, "membres actifs payants"],
    [/member loss assumption/g, "hypothèse de perte de membres"], [/retention economics/g, "économie de fidélisation"],
    [/recommended booking hold/g, "acompte de réservation recommandé"], [/percent upfront/g, "% à la réservation"],
    [/including fees and contingency/g, "frais et aléas inclus"], [/of costs/g, "des coûts"],
    [/of revenue/g, "des revenus"], [/of gross payout/g, "du paiement brut"], [/of net/g, "du net"],
    [/of profit/g, "du bénéfice"], [/profit over cost/g, "bénéfice sur coût"], [/after this period/g, "après cette période"],
    [/before event costs/g, "avant coûts de l’événement"], [/paid tickets plus sponsors/g, "billets payés plus sponsoring"],
    [/paid attendees/g, "participants payants"], [/seats/g, "places"], [/of capacity/g, "de la capacité"],
    [/hours over base/g, "heure(s) au-delà de la base"], [/day\(s\)/g, "jour(s)"], [/streams, est\./g, "écoutes, estimation"],
    [/for USD ([0-9,.]+) net/g, "pour $1 USD nets"], [/Enter a pass price to compare\./g, "Saisissez le prix de l’abonnement pour comparer."],
    [/Enter actual received to audit a slip/g, "Saisissez le montant reçu pour contrôler le coupon"],
    [/Not applied/g, "Non appliquée"], [/Ready/g, "Prêt"], [/Missing/g, "Manquant"], [/not selected/g, "non sélectionné"],
    [/1080p balanced/g, "1080p équilibré"],
    [/Entry esports/g, "E-sport d’entrée de gamme"], [/High refresh 1440p/g, "1440p à fréquence élevée"],
    [/1440p value/g, "1440p économique"], [/4K enthusiast/g, "4K haut de gamme"],
    [/FPS at/g, "IPS en"], [/bronze baseline/g, "certification Bronze minimale"], [/gold preferred/g, "certification Gold préférable"],
    [/quality unit with headroom/g, "alimentation de qualité avec réserve"], [/coach emails/g, "messages aux entraîneurs"],
    [/FilmOne yearbook references a high-growth West African box office market\. Use current distributor data for release decisions\./g,
      "L’annuaire FilmOne décrit un marché ouest-africain en croissance. Utilisez des données actuelles du distributeur avant toute décision de sortie."],
    [/local level/g, "niveau local"], [/national level/g, "niveau national"], [/minimum planning mark/g, "minimum de planification"],
    [/eligibility timing/g, "calendrier d’admissibilité"], [/regular seat/g, "place standard"],
    [/transport, food, parking/g, "transport, repas et stationnement"], [/peripherals reserved/g, "périphériques réservés"],
    [/tower only/g, "unité centrale uniquement"], [/do not underspec/g, "ne pas sous-dimensionner"],
    [/recommended build tier/g, "gamme recommandée"], [/personal/g, "personnel"], [/online/g, "en ligne"], [/local/g, "local"]
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function optionLabel(label) {
    if (OPTIONS[label]) return OPTIONS[label];
    var match = String(label).match(/^(.+) \(([A-Z]{3})\)$/);
    if (match) return (COUNTRIES[match[1]] || match[1]) + " (" + match[2] + ")";
    return COUNTRIES[label] || label;
  }

  function resultLabel(value) {
    var source = String(value == null ? "" : value);
    if (RESULT_LABELS[source]) return RESULT_LABELS[source];
    var ranked = source.match(/^([0-9]+)\. (.+)$/);
    if (ranked) return ranked[1] + ". " + (COUNTRIES[ranked[2]] || ranked[2]);
    return COUNTRIES[source] || source;
  }

  function resultValue(value) {
    var translated = String(value == null ? "" : value);
    Object.keys(COUNTRIES).forEach(function (name) {
      translated = translated.split(name).join(COUNTRIES[name]);
    });
    VALUE_REPLACEMENTS.forEach(function (entry) {
      translated = translated.replace(entry[0], entry[1]);
    });
    return translated;
  }

  function sourceStateLabel(state) {
    return {
      "archived-snapshot": "Instantané archivé",
      "static-formula": "Formule statique",
      "static-reference": "Références statiques",
      "static-scenario": "Scénario statique"
    }[state] || "État statique";
  }

  function reviewAge(reviewedAt) {
    var reviewed = new Date(String(reviewedAt || "") + "T00:00:00Z");
    if (!Number.isFinite(reviewed.getTime())) return "date de revue invalide — fraîcheur non établie";
    var today = new Date();
    var todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    var days = Math.floor((todayUtc - reviewed.getTime()) / 86400000);
    if (days < 0) return "date de revue future — fraîcheur non établie";
    return days + (days > 1 ? " jours" : " jour");
  }

  function sourceConfidenceHtml(contract) {
    var source = contract.sourceConfidence;
    if (!source) {
      return '<section class="sports-source-card fr-sports-source-confidence" data-fr-source-confidence><h3>Sources, fraîcheur et confiance</h3><p class="fr-sports-source-warning">Contrat de source absent : ne pas utiliser ce résultat pour décider.</p></section>';
    }
    var html = '<section class="sports-source-card fr-sports-source-confidence" data-fr-source-confidence>';
    html += '<div class="fr-sports-source-heading"><h3>Sources, fraîcheur et confiance</h3><span class="fr-sports-live-badge">Non temps réel · live=false</span></div>';
    html += '<dl class="fr-sports-source-facts">';
    html += '<div><dt>État</dt><dd>' + esc(sourceStateLabel(source.state)) + '</dd></div>';
    html += '<div><dt>Révisé le</dt><dd>' + esc(source.reviewedAt) + ' · âge de la revue : ' + esc(reviewAge(source.reviewedAt)) + '</dd></div>';
    html += '<div><dt>Valable comme</dt><dd>' + esc(source.asOf) + '</dd></div>';
    html += '<div><dt>Cadence</dt><dd>' + esc(source.cadence) + '</dd></div>';
    html += '<div><dt>Confiance</dt><dd><strong>Grade ' + esc(source.confidence.grade) + ' — ' + esc(source.confidence.label) + '</strong><br>' + esc(source.confidence.rationale) + '</dd></div>';
    html += '</dl>';
    if (source.mutableBaselines && source.mutableBaselines.length) {
      html += '<p class="fr-sports-source-warning"><strong>Repères susceptibles de changer, non présentés comme actuels :</strong> ' + esc(source.mutableBaselines.join("; ")) + '.</p>';
    }
    html += '<h4>Hypothèses et limites</h4><ul class="fr-sports-source-assumptions">';
    source.assumptions.forEach(function (assumption) { html += '<li>' + esc(assumption) + '</li>'; });
    html += '</ul>';
    if (source.sources && source.sources.length) {
      html += '<h4>Références conservées du contrat anglais</h4><ul class="fr-sports-source-list">';
      source.sources.forEach(function (item) {
        html += '<li><a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + '</a><span>' + esc(item.note) + '</span></li>';
      });
      html += '</ul>';
    } else {
      html += '<h4>Pourquoi aucune URL externe</h4><p data-fr-source-rationale>' + esc(source.sourceRationale) + '</p>';
    }
    return html + '</section>';
  }

  function readInputs(form, config) {
    var input = {};
    var error = "";
    config.fields.forEach(function (field) {
      if (field.type === "heading") return;
      var control = form.elements[field.id];
      input[field.id] = control ? control.value : field.value;
      if (!error && field.type === "number") {
        var numeric = Number(input[field.id]);
        if (input[field.id] === "" || !Number.isFinite(numeric) || numeric < 0) {
          error = "Saisissez une valeur numérique positive ou nulle pour « " + (FIELD_LABELS[field.id] || field.label) + " ».";
          if (control) control.setAttribute("aria-invalid", "true");
        } else if (control) {
          control.removeAttribute("aria-invalid");
        }
      }
    });
    return { input: input, error: error };
  }

  function fieldHtml(field) {
    if (field.type === "heading") return '<div class="sports-field-heading">' + esc(FIELD_LABELS[field.id] || field.label) + "</div>";
    var label = FIELD_LABELS[field.id] || field.label;
    var id = "fr-sports-" + field.id;
    var html = '<div class="' + (field.full ? "sports-field full" : "sports-field") + '"><label class="sports-label" for="' + esc(id) + '">' + esc(label) + "</label>";
    if (field.type === "select") {
      html += '<select class="sports-select" id="' + esc(id) + '" name="' + esc(field.id) + '">';
      (field.options || []).forEach(function (option) {
        html += '<option value="' + esc(option.value) + '"' + (String(option.value) === String(field.value) ? " selected" : "") + ">" + esc(optionLabel(option.label)) + "</option>";
      });
      html += "</select>";
    } else {
      html += '<input class="sports-input" id="' + esc(id) + '" name="' + esc(field.id) + '" type="' + esc(field.type || "text") + '" value="' + esc(field.value) + '" inputmode="' + (field.type === "number" ? "decimal" : "text") + '">';
    }
    if (field.hint) html += '<div class="sports-hint">Valeur de scénario modifiable.</div>';
    return html + "</div>";
  }

  function reportText(contract, config, input, result) {
    var source = contract.sourceConfidence;
    var lines = [
      contract.title + " — rapport local AfroTools",
      "Créé le : " + new Date().toLocaleString("fr-FR"),
      "Route : /fr/tools/" + contract.frSlug + "/",
      "",
      contract.resultLabel + " : " + resultValue(result.heroValue),
      contract.resultSummary,
      "",
      "Indicateurs"
    ];
    (result.metrics || []).forEach(function (metric) {
      lines.push("- " + resultLabel(metric.label) + " : " + resultValue(metric.value) + (metric.unit ? " (" + resultValue(metric.unit) + ")" : ""));
    });
    if (result.rows && result.rows.length) {
      lines.push("", "Détail");
      result.rows.forEach(function (row) { lines.push("- " + resultLabel(row[0]) + " : " + resultValue(row[1])); });
    }
    lines.push("", "Hypothèses saisies");
    config.fields.forEach(function (field) {
      if (field.type !== "heading") {
        var raw = input[field.id] == null ? "" : input[field.id];
        var selected = (field.options || []).find(function (option) { return String(option.value) === String(raw); });
        lines.push("- " + (FIELD_LABELS[field.id] || field.label) + " : " + (selected ? optionLabel(selected.label) : String(raw)));
      }
    });
    if (source) {
      lines.push(
        "",
        "Sources, fraîcheur et confiance",
        "- Temps réel : non (live=false)",
        "- État : " + sourceStateLabel(source.state),
        "- Révisé le : " + source.reviewedAt + " (âge : " + reviewAge(source.reviewedAt) + ")",
        "- Valable comme : " + source.asOf,
        "- Cadence : " + source.cadence,
        "- Confiance : grade " + source.confidence.grade + " — " + source.confidence.label,
        "- Motif : " + source.confidence.rationale,
        "",
        "Hypothèses et limites"
      );
      source.assumptions.forEach(function (assumption) { lines.push("- " + assumption); });
      if (source.mutableBaselines && source.mutableBaselines.length) {
        lines.push("", "Repères non actuels : " + source.mutableBaselines.join("; "));
      }
      if (source.sources && source.sources.length) {
        lines.push("", "Références");
        source.sources.forEach(function (item) {
          lines.push("- " + item.title + " — " + item.url, "  Note : " + item.note);
        });
      } else {
        lines.push("", "Statut de source : " + source.sourceRationale);
      }
    }
    lines.push("", "Limite : " + contract.safety, "Confidentialité : calcul et export dans ce navigateur; aucune saisie n’est envoyée.");
    return lines.join("\n");
  }

  function renderResult(root, contract, config, input, result) {
    var html = '<aside class="sports-source-card fr-sports-boundary" data-fr-sports-boundary aria-label="Limites du scénario"><h3>Scénario local, pas une information en direct</h3><p>' + esc(contract.safety) + '</p><p>Les prix, règles, classements, participants, blessures et disponibilités externes ne sont pas actualisés automatiquement.</p></aside>';
    html += sourceConfidenceHtml(contract);
    html += '<div class="sports-result-hero"><div class="sports-result-label">' + esc(contract.resultLabel) + '</div><div class="sports-result-value">' + esc(resultValue(result.heroValue || "—")) + '</div><div class="sports-result-sub">' + esc(contract.resultSummary) + "</div></div>";
    if (result.metrics && result.metrics.length) {
      html += '<div class="sports-metrics">';
      result.metrics.forEach(function (metric) {
        html += '<div class="sports-metric"><div class="sports-metric-label">' + esc(resultLabel(metric.label)) + '</div><div class="sports-metric-value">' + esc(resultValue(metric.value)) + '</div><div class="sports-metric-unit">' + esc(resultValue(metric.unit || "")) + "</div></div>";
      });
      html += "</div>";
    }
    if (result.bars && result.bars.length) {
      html += '<div class="sports-bars">';
      result.bars.forEach(function (bar) {
        var width = Math.max(0, Math.min(100, Number(bar.value) || 0));
        html += '<div class="sports-bar-row"><div>' + esc(resultLabel(bar.label)) + '</div><div class="sports-bar-track"><div class="sports-bar-fill" style="width:' + width + '%"></div></div><div>' + esc(resultValue(bar.text || width.toFixed(1) + "%")) + "</div></div>";
      });
      html += "</div>";
    }
    if (result.rows && result.rows.length) {
      html += '<div class="sports-table-wrap"><table class="sports-table"><thead><tr><th>Élément</th><th>Valeur</th></tr></thead><tbody>';
      result.rows.forEach(function (row) { html += "<tr><td>" + esc(resultLabel(row[0])) + "</td><td>" + esc(resultValue(row[1])) + "</td></tr>"; });
      html += "</tbody></table></div>";
    }
    html += '<div class="sports-insights"><h3>Comment utiliser ce résultat</h3><ul>';
    contract.insights.forEach(function (insight) { html += "<li>" + esc(insight) + "</li>"; });
    html += "</ul></div>";
    html += '<div class="sports-report-gate" data-fr-local-export><h3>Exporter ou rouvrir ce scénario</h3><p>Copiez, imprimez ou téléchargez un fichier JSON local. Aucun courriel, compte ou envoi réseau n’est requis.</p><div class="sports-report-actions"><button class="sports-btn" type="button" data-fr-print>Imprimer ou enregistrer en PDF</button><button class="sports-btn secondary" type="button" data-fr-copy>Copier le rapport</button><button class="sports-btn secondary" type="button" data-fr-download>Télécharger JSON</button><label class="sports-btn secondary fr-sports-import">Rouvrir JSON<input type="file" accept="application/json,.json" data-fr-import></label></div><div class="sports-lead-msg" data-fr-export-status aria-live="polite"></div><pre class="sports-report-preview on" tabindex="0" data-fr-report>' + esc(reportText(contract, config, input, result)) + "</pre></div>";
    root.innerHTML = html;
  }

  function init() {
    var page = document.body && document.body.getAttribute("data-fr-sports-tool");
    var engine = window.AfroSports;
    var contract = CONTRACTS[page];
    var config = engine && engine.tools && engine.tools[page];
    var mount = document.getElementById("fr-sports-tool-root");
    if (!mount || !contract || !config) return;

    mount.innerHTML = '<div class="sports-shell-grid"><section class="sports-panel"><div class="sports-panel-title"><span>Vos hypothèses</span><span class="sports-panel-kicker">' + esc(contract.eyebrow) + '</span></div><form id="fr-sports-tool-form" novalidate><div class="sports-form-grid">' + config.fields.map(fieldHtml).join("") + '</div><div class="sports-actions"><button class="sports-btn" type="submit">Calculer</button><button class="sports-btn secondary" type="button" data-fr-reset>Réinitialiser</button></div><div class="fr-sports-error" data-fr-error role="alert" aria-live="assertive"></div></form></section><section class="sports-panel" id="fr-sports-result-panel"><div class="sports-panel-title"><span>Résultats</span><span class="sports-status">Calcul local</span></div><div id="fr-sports-results" role="status" aria-live="polite"></div></section></div>';
    var form = document.getElementById("fr-sports-tool-form");
    var resultRoot = document.getElementById("fr-sports-results");
    var errorRoot = mount.querySelector("[data-fr-error]");
    var last = null;

    function calculate() {
      var read = readInputs(form, config);
      errorRoot.textContent = read.error;
      if (read.error) {
        resultRoot.innerHTML = '<div class="sports-empty">Corrigez la saisie signalée pour obtenir un résultat. Aucun calcul incomplet n’est présenté.</div>';
        last = null;
        return;
      }
      var result = engine.calculate(page, read.input);
      last = { input: read.input, result: result };
      renderResult(resultRoot, contract, config, read.input, result);
    }

    form.addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
    Array.prototype.forEach.call(form.elements, function (control) {
      if (control.name) control.addEventListener("change", calculate);
    });
    mount.querySelector("[data-fr-reset]").addEventListener("click", function () {
      config.fields.forEach(function (field) {
        if (field.type !== "heading" && form.elements[field.id]) form.elements[field.id].value = field.value == null ? "" : field.value;
      });
      calculate();
    });

    resultRoot.addEventListener("click", function (event) {
      var report = resultRoot.querySelector("[data-fr-report]");
      var status = resultRoot.querySelector("[data-fr-export-status]");
      if (event.target.closest("[data-fr-print]")) {
        document.body.classList.add("fr-sports-printing");
        window.print();
        window.setTimeout(function () { document.body.classList.remove("fr-sports-printing"); }, 300);
      }
      if (event.target.closest("[data-fr-copy]") && report) {
        var operation = window.navigator.clipboard && window.navigator.clipboard.writeText
          ? window.navigator.clipboard.writeText(report.textContent) : Promise.reject(new Error("clipboard"));
        operation.then(function () { status.textContent = "Rapport copié dans le presse-papiers."; })
          .catch(function () { status.textContent = "Copie bloquée : sélectionnez le rapport et copiez-le manuellement."; });
      }
      if (event.target.closest("[data-fr-download]") && last) {
        var payload = {
          schema: "afrotools.fr.sports-scenario.v1", toolId: page, route: "/fr/tools/" + contract.frSlug + "/",
          inputs: last.input, resultLabel: contract.resultLabel, resultValue: last.result.heroValue,
          sourceReview: contract.sourceConfidence, createdAt: new Date().toISOString(), privacy: "local-export"
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url; link.download = contract.frSlug + "-scenario.json"; link.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        status.textContent = "Fichier JSON téléchargé localement.";
      }
    });

    resultRoot.addEventListener("change", function (event) {
      if (!event.target.matches("[data-fr-import]")) return;
      var status = resultRoot.querySelector("[data-fr-export-status]");
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      file.text().then(function (text) {
        var payload = JSON.parse(text);
        if (payload.schema !== "afrotools.fr.sports-scenario.v1" || payload.toolId !== page || !payload.inputs) throw new Error("schema");
        config.fields.forEach(function (field) {
          if (field.type !== "heading" && form.elements[field.id] && Object.prototype.hasOwnProperty.call(payload.inputs, field.id)) {
            form.elements[field.id].value = payload.inputs[field.id];
          }
        });
        calculate();
        var currentStatus = resultRoot.querySelector("[data-fr-export-status]");
        if (currentStatus) currentStatus.textContent = "Scénario rouvert depuis le fichier local.";
      }).catch(function () {
        status.textContent = "Ce fichier ne correspond pas à cette application.";
      });
    });

    calculate();
  }

  window.AfroFrSports = {
    init: init,
    fieldLabel: function (id, fallback) { return FIELD_LABELS[id] || fallback || id; },
    optionLabel: optionLabel,
    resultLabel: resultLabel,
    resultValue: resultValue
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}(window, document));
