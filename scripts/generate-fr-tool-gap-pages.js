"use strict";

const fs = require("fs");
const path = require("path");

const SITE = "https://afrotools.com";

const PAGES = [
  {
    enSlug: "50-30-20-budget",
    frSlug: "budget-50-30-20",
    title: "Calculateur budget 50/30/20 pour l'Afrique | AfroTools",
    name: "Calculateur budget 50/30/20",
    description:
      "Repartissez un revenu mensuel entre besoins, envies et epargne avec une interface francaise pour les budgets africains.",
    eyebrow: "Finance personnelle",
    lead:
      "Comparez vos depenses actuelles avec la regle 50/30/20 et gardez les montants en devise locale.",
    useCase:
      "Utile pour cadrer un budget mensuel avant d'ajuster loyer, transport, abonnements ou epargne.",
    safety:
      "Le resultat reste une aide de planification, pas un conseil financier personnalise.",
    related:
      "Pour les conversions de devise, utilisez aussi le convertisseur de devises africaines en francais.",
    terms: [
      ["50/30/20 Budget Calculator", "Calculateur budget 50/30/20"],
      ["Needs", "Besoins"],
      ["Wants", "Envies"],
      ["Savings", "Epargne"],
      ["Monthly Income", "Revenu mensuel"],
      ["Calculate My Budget", "Calculer mon budget"],
      ["Current Spending", "Depenses actuelles"],
      ["Ideal Budget", "Budget cible"],
    ],
  },
  {
    enSlug: "cash-flow-forecast",
    frSlug: "prevision-tresorerie",
    title: "Prevision de tresorerie 12 mois | AfroTools",
    name: "Prevision de tresorerie",
    description:
      "Projetez recettes, couts, taxes et solde de tresorerie sur 12 mois pour une petite entreprise africaine.",
    eyebrow: "Tresorerie PME",
    lead:
      "Preparez un scenario simple de flux de tresorerie mensuel et reperez les mois ou le solde devient fragile.",
    useCase:
      "Servez-vous de cette page avant une commande, une embauche, un pret court terme ou un achat de stock.",
    safety:
      "Les montants sont des estimations internes; rapprochez-les ensuite de votre comptabilite.",
    related:
      "Associez cette prevision au calculateur de marge ou au seuil de rentabilite si le modele de prix change.",
    terms: [
      ["12-Month Cash Flow Forecast", "Prevision de tresorerie 12 mois"],
      ["Cash Flow Forecast", "Prevision de tresorerie"],
      ["Opening Cash", "Tresorerie initiale"],
      ["Monthly Revenue", "Recettes mensuelles"],
      ["COGS", "Cout des ventes"],
      ["Fixed Costs", "Couts fixes"],
      ["One-Time Expense", "Depense ponctuelle"],
      ["Tax Rate", "Taux de taxe"],
      ["Generate 12-Month Forecast", "Generer la prevision 12 mois"],
      ["Closing Balance", "Solde de cloture"],
      ["Negative months", "Mois negatifs"],
    ],
  },
  {
    enSlug: "mini-importation",
    frSlug: "marge-mini-importation",
    title: "Calculateur de marge mini-importation | AfroTools",
    name: "Marge mini-importation",
    description:
      "Estimez cout rendu, droits indicatifs, prix de vente et marge pour une petite importation vers l'Afrique.",
    eyebrow: "Importation commerciale",
    lead:
      "Regroupez achat, fret, change, douane indicative et prix de revente avant de lancer un lot test.",
    useCase:
      "Adapte aux revendeurs qui testent un produit depuis Alibaba, 1688 ou un fournisseur regional.",
    safety:
      "Les droits et frais restent indicatifs; confirmez toujours le code SH et le devis transitaire.",
    related:
      "Pour une importation plus lourde, passez par droits de douane, cout rendu et estimateur de fret.",
    terms: [
      ["Mini-Importation Profit Calculator", "Calculateur de marge mini-importation"],
      ["Product Cost", "Cout produit"],
      ["Shipping", "Fret"],
      ["Customs Duty", "Droit de douane"],
      ["Clearance Fees", "Frais de dedouanement"],
      ["Selling Price", "Prix de vente"],
      ["Units", "Unites"],
      ["Calculate Profit", "Calculer la marge"],
      ["Gross Profit", "Benefice brut"],
      ["Profit Margin", "Marge beneficiaire"],
    ],
  },
  {
    enSlug: "pos-agent",
    frSlug: "rentabilite-agent-pos",
    title: "Rentabilite agent POS et mobile money | AfroTools",
    name: "Rentabilite agent POS",
    description:
      "Estimez les commissions, frais, transactions et benefice mensuel d'un kiosque POS ou mobile money.",
    eyebrow: "Mobile money",
    lead:
      "Comparez volume de transactions, commissions et couts d'exploitation avant d'ouvrir ou d'etendre un point agent.",
    useCase:
      "Utile pour les agents POS, MoMo, M-Pesa ou points de retrait qui veulent tester plusieurs volumes.",
    safety:
      "Les commissions varient selon operateur, pays et contrat; gardez la feuille comme simulation.",
    related:
      "Pour les frais client, consultez aussi les frais mobile money et les comparateurs de paiement.",
    terms: [
      ["POS Agent Business Calculator", "Calculateur rentabilite agent POS"],
      ["Daily Transactions", "Transactions par jour"],
      ["Average Transaction", "Transaction moyenne"],
      ["Commission", "Commission"],
      ["Monthly Rent", "Loyer mensuel"],
      ["Staff Cost", "Cout personnel"],
      ["Calculate Profitability", "Calculer la rentabilite"],
      ["Monthly Profit", "Benefice mensuel"],
      ["Break-even", "Seuil de rentabilite"],
    ],
  },
  {
    enSlug: "mama-put",
    frSlug: "rentabilite-restauration-rue",
    title: "Rentabilite restauration de rue | AfroTools",
    name: "Rentabilite restauration de rue",
    description:
      "Calculez chiffre d'affaires, couts ingredients, marge et seuil de rentabilite pour un food vendor africain.",
    eyebrow: "Restauration locale",
    lead:
      "Modelez les plats vendus par jour, le cout des ingredients, le personnel et les frais fixes.",
    useCase:
      "Utile pour restaurants populaires, stands de rue, cantines, traiteurs et cuisines de quartier.",
    safety:
      "Les couts alimentaires bougent vite; actualisez les prix de marche avant chaque decision.",
    related:
      "A relier au budget stock, aux prix de panier alimentaire et au calculateur de marge commerciale.",
    terms: [
      ["Mama Put", "Restauration de rue"],
      ["Food Vendor", "Vendeur de repas"],
      ["Add Dish", "Ajouter un plat"],
      ["Dish", "Plat"],
      ["Meals per Day", "Repas par jour"],
      ["Ingredient Cost", "Cout ingredients"],
      ["Selling Price", "Prix de vente"],
      ["Calculate My Profit", "Calculer mon benefice"],
      ["Daily Profit", "Benefice journalier"],
      ["Monthly Profit", "Benefice mensuel"],
    ],
  },
  {
    enSlug: "marketplace-fees",
    frSlug: "frais-marketplace",
    title: "Frais de marketplaces africaines | AfroTools",
    name: "Frais marketplace",
    description:
      "Comparez commission, frais fixes et revenu net par vente sur Jumia, Konga, Takealot, Kilimall et autres marketplaces.",
    eyebrow: "E-commerce",
    lead:
      "Estimez ce qui reste apres commission, paiement, livraison ou frais fixes avant de publier un produit.",
    useCase:
      "Pratique pour comparer plusieurs canaux de vente et fixer un prix qui garde une marge nette.",
    safety:
      "Les grilles changent par pays, categorie et contrat vendeur; confirmez la fiche tarifaire officielle.",
    related:
      "A utiliser avec le calculateur de marge et les frais de paiement pour valider le prix final.",
    terms: [
      ["Marketplace Fee Comparator", "Comparateur de frais marketplace"],
      ["All Platforms", "Toutes les plateformes"],
      ["Zero Commission", "Sans commission"],
      ["Card View", "Vue cartes"],
      ["Table View", "Vue tableau"],
      ["Sale Price", "Prix de vente"],
      ["Commission", "Commission"],
      ["Net Revenue", "Revenu net"],
      ["Compare Net Revenue", "Comparer le revenu net"],
      ["Platform", "Plateforme"],
    ],
  },
  {
    enSlug: "burn-rate",
    frSlug: "burn-rate-startup",
    title: "Calculateur burn rate startup | AfroTools",
    name: "Burn rate startup",
    description:
      "Calculez burn rate, runway et couts mensuels pour une startup ou PME africaine.",
    eyebrow: "Startup finance",
    lead:
      "Additionnez personnel, bureau, logiciels, marketing et autres couts pour savoir combien de mois de runway restent.",
    useCase:
      "Utile avant une levee, une reduction de couts ou un plan de recrutement progressif.",
    safety:
      "Le calcul est un modele de gestion; il ne remplace pas un budget approuve par la direction.",
    related:
      "Comparez ensuite avec la prevision de tresorerie pour voir les effets de revenus attendus.",
    terms: [
      ["Burn Rate Calculator", "Calculateur de burn rate"],
      ["Gross Burn", "Burn brut"],
      ["Net Burn", "Burn net"],
      ["Runway", "Runway"],
      ["Cash Balance", "Tresorerie disponible"],
      ["Personnel", "Personnel"],
      ["Office", "Bureau"],
      ["Software", "Logiciels"],
      ["Marketing", "Marketing"],
      ["Calculate Burn Rate & Runway", "Calculer burn rate et runway"],
      ["Add Person", "Ajouter une personne"],
      ["Add Item", "Ajouter une ligne"],
      ["Add Tool", "Ajouter un outil"],
    ],
  },
  {
    enSlug: "electricity-tariff",
    frSlug: "tarifs-electricite",
    title: "Calculateur de tarifs electricite Afrique | AfroTools",
    name: "Tarifs electricite",
    description:
      "Estimez une facture d'electricite avec tarif, tranche, frais fixes et consommation mensuelle.",
    eyebrow: "Energie",
    lead:
      "Testez une estimation de facture pour un menage ou une petite entreprise avant de comparer avec le releve officiel.",
    useCase:
      "Utile pour budgeter un commerce, une maison, une chambre froide ou un atelier avec consommation variable.",
    safety:
      "Les tarifs publics changent par compagnie et tranche; verifiez toujours la facture ou le regulateur local.",
    related:
      "Pour le backup, comparez avec cout carburant, generateur et ROI solaire.",
    terms: [
      ["Electricity Tariff Calculator", "Calculateur de tarifs electricite"],
      ["Electricity Bill", "Facture d'electricite"],
      ["Monthly Usage", "Consommation mensuelle"],
      ["kWh", "kWh"],
      ["Tariff", "Tarif"],
      ["Fixed Charge", "Frais fixe"],
      ["Service Charge", "Frais de service"],
      ["Calculate", "Calculer"],
      ["Estimated Bill", "Facture estimee"],
    ],
  },
  {
    enSlug: "prepaid-meter",
    frSlug: "compteur-prepaye",
    title: "Calculateur compteur prepaye | AfroTools",
    name: "Compteur prepaye",
    description:
      "Estimez les unites kWh achetees avec un montant donne, frais fixes et tarif local.",
    eyebrow: "Electricite prepaye",
    lead:
      "Voyez combien d'unites un token peut fournir et combien de jours il pourrait couvrir selon votre usage.",
    useCase:
      "Pratique pour foyers, boutiques, salons et petits ateliers qui rechargent par token.",
    safety:
      "Le resultat depend du distributeur, de la tranche et des frais; utilisez-le comme estimation.",
    related:
      "Comparez avec le calculateur de tarifs electricite et l'audit energie maison.",
    terms: [
      ["Prepaid Meter Calculator", "Calculateur compteur prepaye"],
      ["Token Amount", "Montant du token"],
      ["Service Charges", "Frais de service"],
      ["Units", "Unites"],
      ["Days of Supply", "Jours de couverture"],
      ["Daily Usage", "Usage quotidien"],
      ["Calculate", "Calculer"],
      ["Estimated Units", "Unites estimees"],
    ],
  },
  {
    enSlug: "solar-roi",
    frSlug: "roi-solaire",
    title: "Calculateur ROI solaire Afrique | AfroTools",
    name: "ROI solaire",
    description:
      "Estimez temps de retour, economies et cout total d'un systeme solaire pour l'Afrique.",
    eyebrow: "Solaire",
    lead:
      "Comparez cout d'installation, economie mensuelle, maintenance et duree d'amortissement.",
    useCase:
      "Utile pour arbitrer entre reseau, generateur, batterie et installation solaire progressive.",
    safety:
      "Les rendements dependent du site, de l'installateur et de l'entretien; demandez un devis technique avant achat.",
    related:
      "A rapprocher de cout carburant, generateur et estimateur electricite pour un scenario complet.",
    terms: [
      ["Solar Panel ROI Calculator", "Calculateur ROI solaire"],
      ["Solar ROI", "ROI solaire"],
      ["System Cost", "Cout du systeme"],
      ["Monthly Savings", "Economies mensuelles"],
      ["Payback", "Retour sur investissement"],
      ["Maintenance", "Maintenance"],
      ["Calculate", "Calculer"],
      ["Years", "Annees"],
      ["Savings", "Economies"],
    ],
  },
  {
    enSlug: "solar-sizing",
    frSlug: "dimensionnement-solaire",
    title: "Dimensionnement solaire Afrique | AfroTools",
    name: "Dimensionnement solaire",
    description:
      "Estimez panneaux, batterie et onduleur pour une maison ou une petite entreprise africaine.",
    eyebrow: "Energie solaire",
    lead:
      "Listez vos appareils, votre usage quotidien et votre pays pour obtenir une premiere taille de systeme solaire.",
    useCase:
      "Utile avant de demander un devis solaire ou de comparer installation progressive, batterie et reseau.",
    safety:
      "Le resultat reste une estimation de pre-dimensionnement; un installateur doit verifier site, toiture et charges reelles.",
    related:
      "A comparer avec ROI solaire, autonomie de secours et consommation des appareils.",
    terms: [
      ["Solar System Sizing Calculator", "Calculateur de dimensionnement solaire"],
      ["Your Appliance List", "Liste de vos appareils"],
      ["Appliance", "Appareil"],
      ["Watts", "Watts"],
      ["Hours/day", "Heures/jour"],
      ["Quantity", "Quantite"],
      ["Add Appliance", "Ajouter un appareil"],
      ["Calculate System Size", "Calculer la taille du systeme"],
      ["Solar Panels", "Panneaux solaires"],
      ["Battery", "Batterie"],
      ["Inverter", "Onduleur"],
    ],
  },
  {
    enSlug: "battery-sizing",
    frSlug: "dimensionnement-batterie-onduleur",
    title: "Dimensionnement batterie et onduleur | AfroTools",
    name: "Dimensionnement batterie et onduleur",
    description:
      "Calculez une capacite de batterie et une puissance d'onduleur pour secours ou hors reseau.",
    eyebrow: "Secours electrique",
    lead:
      "Estimez combien de batterie et quelle taille d'onduleur il faut selon charge, autonomie visee et rendement.",
    useCase:
      "Utile pour dimensionner un backup maison, boutique, chambre froide ou bureau avant devis technique.",
    safety:
      "Confirmez toujours profondeur de decharge, type de batterie et marge de securite avec l'installateur.",
    related:
      "Associez ce calcul a autonomie de secours, audit energie maison et dimensionnement solaire.",
    terms: [
      ["Battery & Inverter Sizing", "Dimensionnement batterie et onduleur"],
      ["Enter Your Requirements", "Saisissez vos besoins"],
      ["Load", "Charge"],
      ["Backup Hours", "Heures d'autonomie"],
      ["Battery Type", "Type de batterie"],
      ["Inverter Size", "Taille d'onduleur"],
      ["Battery Bank", "Banc de batteries"],
      ["Calculate", "Calculer"],
    ],
  },
  {
    enSlug: "appliance-power",
    frSlug: "consommation-appareils",
    title: "Consommation des appareils electriques | AfroTools",
    name: "Consommation des appareils",
    description:
      "Additionnez watts, heures d'utilisation et quantites pour estimer la consommation electrique mensuelle.",
    eyebrow: "Facture et charge",
    lead:
      "Identifiez les appareils qui consomment le plus avant de choisir un compteur, un onduleur ou un systeme solaire.",
    useCase:
      "Pratique pour foyers, salons, boutiques, ateliers et petites chambres froides.",
    safety:
      "Les plaques signalees et l'usage reel peuvent varier; mesurez si possible les gros consommateurs.",
    related:
      "Passez ensuite a tarifs electricite, compteur prepaye ou dimensionnement solaire.",
    terms: [
      ["Appliance Power Calculator", "Calculateur consommation appareils"],
      ["Your Appliances", "Vos appareils"],
      ["Appliance", "Appareil"],
      ["Watts", "Watts"],
      ["Hours", "Heures"],
      ["Quantity", "Quantite"],
      ["Standby", "Veille"],
      ["Monthly Usage", "Consommation mensuelle"],
      ["Add Row", "Ajouter une ligne"],
    ],
  },
  {
    enSlug: "energy-audit",
    frSlug: "audit-energie-maison",
    title: "Audit energie maison | AfroTools",
    name: "Audit energie maison",
    description:
      "Evaluez vos usages d'energie et reperez les economies possibles a la maison ou dans une petite activite.",
    eyebrow: "Efficacite energetique",
    lead:
      "Passez en revue appareils, eclairage, cuisson, climatisation et habitudes pour obtenir un score d'efficacite.",
    useCase:
      "Utile avant de changer d'appareils, d'ajouter un solaire ou de reduire une facture elevee.",
    safety:
      "Ce score est indicatif; il ne remplace pas un audit terrain ni les mesures d'un electricien.",
    related:
      "A combiner avec consommation des appareils, tarifs electricite et ROI solaire.",
    terms: [
      ["Home Energy Audit", "Audit energie maison"],
      ["Tell Us About Your Home", "Decrivez votre logement"],
      ["Energy Score", "Score energie"],
      ["Efficiency", "Efficacite"],
      ["Lighting", "Eclairage"],
      ["Cooling", "Refroidissement"],
      ["Cooking", "Cuisson"],
      ["Recommendations", "Recommandations"],
    ],
  },
  {
    enSlug: "backup-duration",
    frSlug: "autonomie-secours",
    title: "Calculateur autonomie de secours | AfroTools",
    name: "Autonomie de secours",
    description:
      "Estimez combien de temps une batterie, un onduleur ou un UPS peut alimenter vos appareils.",
    eyebrow: "Backup power",
    lead:
      "Entrez capacite batterie, charge et rendement pour estimer les heures d'autonomie disponibles.",
    useCase:
      "Pratique pour planifier coupures de courant, backup internet, caisse POS ou refrigerateur.",
    safety:
      "La duree reelle depend de l'etat de la batterie, du rendement et des pointes de demarrage.",
    related:
      "A rapprocher du dimensionnement batterie/onduleur et de la consommation des appareils.",
    terms: [
      ["Backup Duration Calculator", "Calculateur autonomie de secours"],
      ["Your Battery System", "Votre systeme batterie"],
      ["Battery Capacity", "Capacite batterie"],
      ["Load Wattage", "Puissance de charge"],
      ["Efficiency", "Rendement"],
      ["Runtime", "Autonomie"],
      ["Hours", "Heures"],
    ],
  },
  {
    enSlug: "carbon-footprint-energy",
    frSlug: "empreinte-carbone-energie",
    title: "Empreinte carbone energie | AfroTools",
    name: "Empreinte carbone energie",
    description:
      "Estimez les emissions liees a l'electricite reseau, generateur, diesel, essence ou GPL.",
    eyebrow: "Climat et energie",
    lead:
      "Comparez vos usages energetiques mensuels et identifiez les postes qui pesent le plus dans l'empreinte.",
    useCase:
      "Utile pour PME, foyers et projets qui veulent suivre une trajectoire d'efficacite ou de reporting.",
    safety:
      "Les facteurs d'emission sont indicatifs et doivent etre adaptes aux donnees officielles si vous reportez.",
    related:
      "Comparez avec ROI solaire, diesel vs solaire et audit energie maison.",
    terms: [
      ["Carbon Footprint", "Empreinte carbone"],
      ["Enter Your Monthly Energy Use", "Saisissez votre usage energie mensuel"],
      ["Grid Electricity", "Electricite reseau"],
      ["Generator", "Generateur"],
      ["LPG", "GPL"],
      ["Emissions", "Emissions"],
      ["CO2e", "CO2e"],
    ],
  },
  {
    enSlug: "diesel-vs-solar-farm",
    frSlug: "diesel-vs-solaire-ferme",
    title: "Diesel vs solaire pour ferme | AfroTools",
    name: "Diesel vs solaire ferme",
    description:
      "Comparez cout total, carburant, maintenance et amortissement entre generateur diesel et solaire agricole.",
    eyebrow: "Agriculture energie",
    lead:
      "Modelez les heures de pompage ou d'exploitation et comparez les couts sur plusieurs annees.",
    useCase:
      "Utile pour fermes, pompes, transformation agricole et petites installations hors reseau.",
    safety:
      "Le resultat depend du prix du carburant, du soleil local, de la charge et du devis d'installation.",
    related:
      "A utiliser avec ROI solaire, biogaz et mini-reseau si le site est collectif.",
    terms: [
      ["Diesel vs Solar Farm", "Diesel vs solaire ferme"],
      ["Your Farm Details", "Details de votre ferme"],
      ["Diesel Generator", "Generateur diesel"],
      ["Solar", "Solaire"],
      ["Fuel Cost", "Cout carburant"],
      ["Maintenance", "Maintenance"],
      ["Payback", "Retour sur investissement"],
      ["10-year TCO", "Cout total sur 10 ans"],
    ],
  },
  {
    enSlug: "ev-charging",
    frSlug: "cout-recharge-ev",
    title: "Cout de recharge vehicule electrique | AfroTools",
    name: "Cout recharge EV",
    description:
      "Estimez le cout de recharge d'un vehicule electrique et comparez avec un usage essence ou diesel.",
    eyebrow: "Mobilite electrique",
    lead:
      "Entrez batterie, consommation, tarif kWh et kilometrage pour estimer le cout par trajet ou par mois.",
    useCase:
      "Utile pour particuliers, flottes legeres et entreprises qui testent le passage a l'electrique.",
    safety:
      "Les tarifs de recharge et la disponibilite des bornes varient fortement par ville et pays.",
    related:
      "A comparer avec tarifs electricite, ROI solaire et cout carburant.",
    terms: [
      ["EV Charging Cost Calculator", "Calculateur cout recharge EV"],
      ["Your EV Details", "Details du vehicule electrique"],
      ["Battery Size", "Taille batterie"],
      ["Charging Cost", "Cout de recharge"],
      ["Range", "Autonomie"],
      ["Cost per km", "Cout par km"],
      ["Petrol", "Essence"],
      ["Diesel", "Diesel"],
    ],
  },
  {
    enSlug: "mini-grid-feasibility",
    frSlug: "faisabilite-mini-reseau",
    title: "Faisabilite mini-reseau solaire | AfroTools",
    name: "Faisabilite mini-reseau",
    description:
      "Evaluez rapidement la viabilite d'un mini-reseau pour communaute, ferme ou site rural.",
    eyebrow: "Electrification rurale",
    lead:
      "Combinez population, demande, production solaire et couts indicatifs pour un premier score de faisabilite.",
    useCase:
      "Utile pour cooperatives, villages, fermes et projets qui preparent une etude plus detaillee.",
    safety:
      "Cette page ne remplace pas une etude technique, sociale, tarifaire et reglementaire complete.",
    related:
      "A rapprocher du dimensionnement solaire, diesel vs solaire et audit energie.",
    terms: [
      ["Mini-Grid Feasibility Calculator", "Calculateur faisabilite mini-reseau"],
      ["Community Details", "Details de la communaute"],
      ["Population", "Population"],
      ["Demand", "Demande"],
      ["Solar Resource", "Ressource solaire"],
      ["Feasibility", "Faisabilite"],
      ["Tariff", "Tarif"],
    ],
  },
  {
    enSlug: "biogas-roi",
    frSlug: "roi-biogaz",
    title: "ROI digesteur biogaz | AfroTools",
    name: "ROI biogaz",
    description:
      "Estimez investissement, gaz produit, economie de cuisson et retour sur un digesteur biogaz.",
    eyebrow: "Energie agricole",
    lead:
      "Utilisez dechets animaux, cout d'installation et usage de cuisson pour voir si le biogaz est plausible.",
    useCase:
      "Utile pour fermes, menages ruraux et petites exploitations avec fumier ou residus organiques.",
    safety:
      "Confirmez toujours la disponibilite du feedstock, la maintenance et les normes de securite locales.",
    related:
      "Comparez avec diesel vs solaire ferme, cout GPL et audit energie.",
    terms: [
      ["Biogas Digester ROI", "ROI digesteur biogaz"],
      ["Your Farm & Cooking Details", "Details ferme et cuisson"],
      ["Feedstock", "Matiere organique"],
      ["Gas Yield", "Production de gaz"],
      ["Cooking Hours", "Heures de cuisson"],
      ["Payback", "Retour sur investissement"],
      ["Savings", "Economies"],
    ],
  },
];

const COMMON_TERMS = [
  ["Home", "Accueil"],
  ["Tools", "Outils"],
  ["All Tools", "Tous les outils"],
  ["Business", "Entreprise"],
  ["Finance", "Finance"],
  ["Energy", "Energie"],
  ["Country", "Pays"],
  ["Currency", "Devise"],
  ["Amount", "Montant"],
  ["Income", "Revenu"],
  ["Revenue", "Revenus"],
  ["Costs", "Couts"],
  ["Cost", "Cout"],
  ["Expenses", "Depenses"],
  ["Expense", "Depense"],
  ["Price", "Prix"],
  ["Monthly", "Mensuel"],
  ["Daily", "Journalier"],
  ["Yearly", "Annuel"],
  ["Result", "Resultat"],
  ["Results", "Resultats"],
  ["Calculate", "Calculer"],
  ["Reset", "Reinitialiser"],
  ["Clear", "Effacer"],
  ["Copy", "Copier"],
  ["Copied", "Copie"],
  ["Download", "Telecharger"],
  ["Export", "Exporter"],
  ["Example", "Exemple"],
  ["Search", "Rechercher"],
  ["Input", "Entree"],
  ["Output", "Sortie"],
  ["Total", "Total"],
  ["Profit", "Benefice"],
  ["Margin", "Marge"],
  ["All African Countries", "Tous les pays africains"],
  ["Instant Results", "Resultats instantanes"],
  ["Free", "Gratuit"],
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlFor(page) {
  const enUrl = `${SITE}/tools/${page.enSlug}/`;
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const terms = JSON.stringify([...page.terms, ...COMMON_TERMS]);
  const schema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: page.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr",
      url: frUrl,
      description: page.description,
      isBasedOn: enUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "AfroTools", url: SITE },
    },
    null,
    2
  );

  return `<!DOCTYPE html>
<!-- Generated by scripts/generate-fr-tool-gap-pages.js. Edit source data there. -->
<html data-chat-bundle="/assets/js/bundles/chat.e5a3e11c.min.js" lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${frUrl}">
  <meta property="og:title" content="${escapeHtml(page.name)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:image" content="${SITE}/assets/img/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${frUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${SITE}/assets/img/og-default.png">
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="fr" href="${frUrl}" />
  <link rel="alternate" hreflang="x-default" href="${enUrl}" />
  <link rel="stylesheet" href="/assets/css/global.css">
  <style>
    .fr-tool-shell{max-width:1120px;margin:0 auto;padding:92px 20px 58px}
    .breadcrumb{font-size:.92rem;color:#64748b;margin-bottom:18px}.breadcrumb a{color:#2563eb;text-decoration:none}
    .eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:10px}
    h1{font-size:clamp(2rem,5vw,3.35rem);line-height:1.06;margin:0 0 16px;color:#0f172a}
    .lead{max-width:790px;color:#475569;font-size:1.08rem;line-height:1.7;margin:0 0 24px}
    .route-note{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}.route-note span{border:1px solid #dbe4ef;border-radius:999px;padding:7px 11px;background:#f8fafc;color:#334155;font-size:.86rem}
    #tool-mount{background:#fff;border:1px solid #dbe4ef;border-radius:8px;padding:18px;box-shadow:0 10px 28px rgba(15,23,42,.08);overflow:hidden}
    .tool-status{color:#64748b}.tool-error{padding:18px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;color:#991b1b}.tool-error a{color:#1d4ed8}
    .support-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:26px}.support-grid section{border:1px solid #dbe4ef;border-radius:8px;padding:18px;background:#fff}.support-grid h2{font-size:1rem;margin:0 0 8px;color:#111827}.support-grid p{margin:0;color:#475569;line-height:1.55;font-size:.94rem}
    @media (max-width:760px){.fr-tool-shell{padding-top:76px}.support-grid{grid-template-columns:1fr}#tool-mount{padding:12px}}
  </style>
  <script type="application/ld+json">${schema.replace(/</g, "\\u003c")}</script>
</head>
<body>
  <div id="navbar"></div>
  <main class="fr-tool-shell">
    <nav class="breadcrumb"><a href="/fr/">Accueil</a> &gt; <a href="/fr/all-tools/">Outils</a> &gt; ${escapeHtml(page.name)}</nav>
    <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
    <h1>${escapeHtml(page.name)}</h1>
    <p class="lead">${escapeHtml(page.lead)}</p>
    <div class="route-note">
      <span>Route francaise canonique</span>
      <span>Outil source conserve</span>
      <span>Estimation a verifier localement</span>
    </div>
    <div id="tool-mount"><p class="tool-status">Chargement de l'outil...</p></div>
    <div class="support-grid">
      <section><h2>Usage recommande</h2><p>${escapeHtml(page.useCase)}</p></section>
      <section><h2>Lecture prudente</h2><p>${escapeHtml(page.safety)}</p></section>
      <section><h2>Liens utiles</h2><p>${escapeHtml(page.related)}</p></section>
    </div>
  </main>
  <div id="footer"></div>
  <script src="/assets/js/components/navbar.js"></script>
  <script src="/assets/js/components/footer.js"></script>
  <script>
(function () {
  var terms = ${terms};
  terms.sort(function (a, b) { return b[0].length - a[0].length; });
  function swapText(value) {
    if (!value) return value;
    var next = value;
    terms.forEach(function (pair) {
      next = next.split(pair[0]).join(pair[1]);
    });
    return next;
  }
  function localize(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (parent && /^(script|style|code|pre)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) { node.nodeValue = swapText(node.nodeValue); });
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"],button').forEach(function (el) {
      ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(function (attr) {
        if (el.hasAttribute && el.hasAttribute(attr)) el.setAttribute(attr, swapText(el.getAttribute(attr)));
      });
    });
  }
  function watch(root) {
    localize(root);
    new MutationObserver(function () { localize(root); }).observe(root, { childList: true, subtree: true, characterData: true });
  }
  window.frToolGapLocalizer = { localize: localize, watch: watch };
})();
</script>
  <script>
    fetch('/tools/${page.enSlug}/')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var main = doc.querySelector('.tool-main') || doc.querySelector('main') || doc.body;
        doc.querySelectorAll('link[rel="stylesheet"], style').forEach(function (node) {
          var clone = node.cloneNode(true);
          if (clone.href) clone.href = new URL(clone.getAttribute('href'), window.location.origin + '/tools/${page.enSlug}/').href;
          document.head.appendChild(clone);
        });
        var mount = document.getElementById('tool-mount');
        mount.innerHTML = '';
        mount.appendChild(document.importNode(main, true));
        window.frToolGapLocalizer.watch(mount);
        var scripts = Array.prototype.slice.call(doc.querySelectorAll('script'));
        function shouldLoadExternal(script) {
          var src = script.getAttribute('src') || '';
          return src && !/components\\/(navbar|footer)|wise-cta|chat/i.test(src);
        }
        function appendExternal(script) {
          return new Promise(function (resolve) {
            var next = document.createElement('script');
            next.async = false;
            next.src = new URL(script.getAttribute('src'), window.location.origin + '/tools/${page.enSlug}/').href;
            next.onload = resolve;
            next.onerror = resolve;
            document.body.appendChild(next);
          });
        }
        var chain = Promise.resolve();
        scripts.filter(shouldLoadExternal).forEach(function (script) {
          chain = chain.then(function () { return appendExternal(script); });
        });
        return chain.then(function () {
          scripts.forEach(function (script) {
            if (!script.src && script.textContent) {
              var next = document.createElement('script');
              next.textContent = script.textContent;
              document.body.appendChild(next);
            }
          });
          window.frToolGapLocalizer.localize(mount);
        });
      })
      .catch(function () {
        document.getElementById('tool-mount').innerHTML = '<div class="tool-error">Impossible de charger l\\'outil pour le moment. <a href="/tools/${page.enSlug}/">Ouvrir la version source</a>.</div>';
      });
  </script>
</body>
</html>
`;
}

function ensureAlternate(html, lang, href) {
  const rel = new RegExp(`<link\\s+rel=["']alternate["'][^>]*hreflang=["']${lang}["'][^>]*>`, "i");
  if (rel.test(html)) {
    return html;
  }
  const line = `<link rel="alternate" hreflang="${lang}" href="${href}" />`;
  if (lang === "fr") {
    const enAlt = html.match(/<link\s+rel=["']alternate["'][^>]*hreflang=["']en["'][^>]*>\s*/i);
    if (enAlt) return html.replace(enAlt[0], `${enAlt[0]}${line}\n`);
  }
  const canonical = html.match(/<link\s+rel=["']canonical["'][^>]*>\s*/i);
  if (canonical) return html.replace(canonical[0], `${canonical[0]}${line}\n`);
  return html.replace(/<\/head>/i, `  ${line}\n</head>`);
}

function ensureEnglishHreflang(page) {
  const file = path.join("tools", page.enSlug, "index.html");
  const enUrl = `${SITE}/tools/${page.enSlug}/`;
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  after = ensureAlternate(after, "en", enUrl);
  after = ensureAlternate(after, "fr", frUrl);
  after = ensureAlternate(after, "x-default", enUrl);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    return true;
  }
  return false;
}

function main() {
  let pagesWritten = 0;
  let englishUpdated = 0;
  for (const page of PAGES) {
    const source = path.join("tools", page.enSlug, "index.html");
    if (!fs.existsSync(source)) {
      throw new Error(`Missing English source page: ${source}`);
    }
    const dir = path.join("fr", "tools", page.frSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), htmlFor(page), "utf8");
    pagesWritten += 1;
    if (ensureEnglishHreflang(page)) englishUpdated += 1;
  }
  console.log(`Generated ${pagesWritten} French tool pages.`);
  console.log(`Updated ${englishUpdated} English hreflang counterparts.`);
}

if (require.main === module) {
  main();
}

module.exports = { PAGES };
