"use strict";

const fs = require("fs");
const path = require("path");

const SITE = "https://afrotools.com";

const CURATED_PAGES = [
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
  {
    enSlug: "emergency-fund",
    frSlug: "fonds-urgence",
    title: "Calculateur de fonds d'urgence Afrique | AfroTools",
    name: "Fonds d'urgence",
    description:
      "Estimez une reserve de securite en mois de depenses selon revenu, stabilite et inflation locale.",
    eyebrow: "Finance personnelle",
    lead:
      "Calculez combien garder de cote pour absorber une perte de revenu, une urgence familiale ou une depense medicale.",
    useCase:
      "Utile avant de fixer un objectif d'epargne mensuel ou de reorganiser un budget familial.",
    safety:
      "Ce calcul reste une aide de planification; adaptez-le a votre situation, vos dettes et vos obligations.",
    related:
      "A combiner avec objectif epargne, budget 50/30/20 et consolidation de prets si les mensualites sont lourdes.",
    terms: [
      ["Emergency Fund Calculator", "Calculateur de fonds d'urgence"],
      ["Emergency Fund", "Fonds d'urgence"],
      ["Monthly Expenses", "Depenses mensuelles"],
      ["Job Security", "Stabilite du revenu"],
      ["Months Covered", "Mois couverts"],
      ["Recommended Fund", "Reserve recommandee"],
      ["Savings Goal", "Objectif d'epargne"],
    ],
  },
  {
    enSlug: "debt-snowball",
    frSlug: "boule-neige-dettes",
    title: "Calculateur boule de neige des dettes | AfroTools",
    name: "Boule de neige des dettes",
    description:
      "Comparez remboursement boule de neige et avalanche pour reduire plusieurs dettes plus vite.",
    eyebrow: "Dettes et credit",
    lead:
      "Listez vos dettes, taux et paiements minimums pour voir quelle strategie peut liberer le plus de cash-flow.",
    useCase:
      "Utile pour arbitrer entre carte, pret personnel, avance mobile money et dette familiale.",
    safety:
      "Les taux, penalites et frais de retard varient; verifiez toujours les contrats avant de refinancer.",
    related:
      "Comparez ensuite avec consolidation de prets, fonds d'urgence et simulateur de score credit.",
    terms: [
      ["Debt Snowball / Avalanche Calculator", "Calculateur boule de neige / avalanche"],
      ["Debt Snowball", "Boule de neige"],
      ["Debt Avalanche", "Avalanche"],
      ["Balance", "Solde"],
      ["Interest Rate", "Taux d'interet"],
      ["Minimum Payment", "Paiement minimum"],
      ["Payoff Date", "Date de remboursement"],
      ["Interest Saved", "Interets economises"],
    ],
  },
  {
    enSlug: "bnpl-calc",
    frSlug: "cout-bnpl",
    title: "Calculateur cout BNPL Afrique | AfroTools",
    name: "Cout BNPL",
    description:
      "Calculez le cout reel d'un achat payer-plus-tard avec frais, acompte, echeances et taux effectif.",
    eyebrow: "Credit consommation",
    lead:
      "Comparez le prix comptant avec le cout total d'une offre acheter maintenant payer plus tard.",
    useCase:
      "Utile avant d'accepter une offre BNPL pour telephone, electronique, formation ou achat menager.",
    safety:
      "Les penalites et frais caches changent selon fournisseur; lisez toujours les conditions de credit.",
    related:
      "A utiliser avec budget 50/30/20, boule de neige des dettes et simulateur de score credit.",
    terms: [
      ["BNPL Cost Calculator", "Calculateur cout BNPL"],
      ["Buy Now Pay Later", "Acheter maintenant payer plus tard"],
      ["Upfront Payment", "Paiement initial"],
      ["Installments", "Echeances"],
      ["Fees", "Frais"],
      ["Effective APR", "TAEG indicatif"],
      ["Total Cost", "Cout total"],
    ],
  },
  {
    enSlug: "loan-consolidation",
    frSlug: "consolidation-prets",
    title: "Calculateur consolidation de prets | AfroTools",
    name: "Consolidation de prets",
    description:
      "Comparez plusieurs prets avec un pret consolide pour estimer mensualite, cout total et point mort.",
    eyebrow: "Credit et remboursement",
    lead:
      "Testez si regrouper vos dettes reduit vraiment la mensualite sans allonger trop cher la duree.",
    useCase:
      "Utile pour comparer banque, microfinance, credit mobile et dettes commerciales avant renegociation.",
    safety:
      "Une mensualite plus basse peut couter plus cher au total; verifiez frais de dossier et assurance.",
    related:
      "A rapprocher de boule de neige des dettes, BNPL et fonds d'urgence pour garder une marge de securite.",
    terms: [
      ["Loan Consolidation Calculator", "Calculateur consolidation de prets"],
      ["Current Loans", "Prets actuels"],
      ["Consolidation Loan", "Pret consolide"],
      ["New Monthly Payment", "Nouvelle mensualite"],
      ["Break-even Point", "Point mort"],
      ["Savings", "Economies"],
      ["Total Interest", "Interets totaux"],
    ],
  },
  {
    enSlug: "fixed-deposit",
    frSlug: "depot-terme",
    title: "Comparateur depot a terme Afrique | AfroTools",
    name: "Depot a terme",
    description:
      "Comparez taux, duree, interets et rendement effectif pour un depot a terme ou compte d'epargne.",
    eyebrow: "Epargne remuneree",
    lead:
      "Estimez ce qu'un placement bloque peut rapporter avant de comparer banques, devise et duree.",
    useCase:
      "Utile pour choisir entre epargne liquide, depot a terme, bons du Tresor ou remboursement de dette.",
    safety:
      "Les taux bancaires changent vite; confirmez taux net, retenue fiscale et conditions de retrait.",
    related:
      "Comparez avec rendement obligations, rendement dividendes et DCA investissement.",
    terms: [
      ["Fixed Deposit Rate Comparator", "Comparateur depot a terme"],
      ["Fixed Deposit", "Depot a terme"],
      ["Interest Earned", "Interets gagnes"],
      ["Tenor", "Duree"],
      ["Maturity", "Echeance"],
      ["Effective Annual Return", "Rendement annuel effectif"],
      ["Total Payout", "Versement final"],
    ],
  },
  {
    enSlug: "bond-yield",
    frSlug: "rendement-obligations",
    title: "Calculateur rendement obligations | AfroTools",
    name: "Rendement obligations",
    description:
      "Calculez rendement courant, prix et rendement a maturite pour obligations et bons publics.",
    eyebrow: "Marches obligataires",
    lead:
      "Comparez coupon, prix d'achat et duree restante pour comprendre le rendement indicatif d'une obligation.",
    useCase:
      "Utile avant de comparer obligation d'Etat, bon du Tresor, depot a terme ou fonds monetaire.",
    safety:
      "Les prix, liquidite, fiscalite et risque emetteur doivent etre verifies avec une source officielle ou un courtier.",
    related:
      "A comparer avec depot a terme, rendement dividendes et calculateur DCA.",
    methodology:
      "La page prepare coupon, prix, valeur nominale, echeance et devise, puis l'outil source calcule rendement courant, rendement a maturite et hypotheses comparables.",
    sourceNote:
      "Controle 2026: verifiez prix de marche, calendrier de coupon, fiscalite, frais de courtage, liquidite et risque emetteur avec l'avis d'emission, la bourse, le Tresor ou votre courtier.",
    businessCtaNote:
      "Conservez le brief de comparaison avec prix, coupon, echeance et frais avant de presenter une note de tresorerie, d'investissement ou de conseil client.",
    iframeEmbed: true,
    terms: [
      ["Government Bond Yield Calculator", "Calculateur rendement obligations"],
      ["Yield-to-Maturity", "Rendement a maturite"],
      ["Current Yield", "Rendement courant"],
      ["Coupon", "Coupon"],
      ["Face Value", "Valeur nominale"],
      ["Market Price", "Prix de marche"],
      ["Maturity", "Maturite"],
    ],
  },
  {
    enSlug: "dividend-yield",
    frSlug: "rendement-dividendes",
    title: "Calculateur rendement dividendes | AfroTools",
    name: "Rendement dividendes",
    description:
      "Calculez rendement, revenu annuel et ratio de distribution a partir du dividende et du prix de l'action.",
    eyebrow: "Investissement actions",
    lead:
      "Estimez le revenu potentiel d'un portefeuille a dividendes et comparez-le a l'inflation ou aux taux d'epargne.",
    useCase:
      "Utile pour analyser une action locale, une participation familiale ou un portefeuille de rendement.",
    safety:
      "Un dividende passe ne garantit pas un paiement futur; verifiez resultats, fiscalite et liquidite.",
    related:
      "A rapprocher de depot a terme, rendement obligations et DCA investissement.",
    methodology:
      "La page prepare prix d'action, dividende annuel, nombre de titres et devise, puis l'outil source calcule rendement, revenu annuel et ratio de distribution indicatif.",
    sourceNote:
      "Controle 2026: confirmez dividende declare, ex-date, retenue fiscale, liquidite et derniers resultats avec les annonces de l'emetteur, la bourse, le courtier ou le rapport annuel.",
    businessCtaNote:
      "Gardez le resume de rendement, la source du dividende et la date de verification avant toute note d'investissement ou discussion client.",
    iframeEmbed: true,
    terms: [
      ["Dividend Yield Calculator", "Calculateur rendement dividendes"],
      ["Dividend Yield", "Rendement dividende"],
      ["Share Price", "Prix de l'action"],
      ["Annual Dividend", "Dividende annuel"],
      ["Payout Ratio", "Ratio de distribution"],
      ["Dividend Income", "Revenu dividendes"],
    ],
  },
  {
    enSlug: "dca-calc",
    frSlug: "dca-investissement",
    title: "Calculateur DCA investissement | AfroTools",
    name: "DCA investissement",
    description:
      "Modelez des achats reguliers, cout moyen et valeur finale selon plusieurs scenarios de rendement.",
    eyebrow: "Investissement progressif",
    lead:
      "Simulez une contribution mensuelle pour voir comment l'investissement et le prix moyen evoluent dans le temps.",
    useCase:
      "Utile pour planifier une strategie ETF, crypto, actions locales ou epargne long terme.",
    safety:
      "Les rendements sont des scenarios; ils ne prevoient pas la performance reelle ni le risque de perte.",
    related:
      "Comparez avec rendement dividendes, depot a terme et fonds d'urgence avant d'engager l'epargne.",
    methodology:
      "La page structure contribution reguliere, duree, prix moyen, rendement scenario et devise, puis l'outil source calcule les valeurs finales et comparaisons de cout moyen.",
    sourceNote:
      "Controle 2026: utilisez des prix, frais, spreads, taxes et rendements scenario dates. Le DCA reduit certains risques d'entree, mais ne garantit pas de gain.",
    businessCtaNote:
      "Exportez le brief avec contribution, horizon, frais et scenario pour comparer une politique d'epargne, un club d'investissement ou un plan de tresorerie.",
    iframeEmbed: true,
    terms: [
      ["Dollar-Cost Averaging Calculator", "Calculateur DCA"],
      ["Dollar-Cost Averaging", "Investissement programme"],
      ["Monthly Contribution", "Contribution mensuelle"],
      ["Average Cost", "Cout moyen"],
      ["Portfolio Value", "Valeur du portefeuille"],
      ["Return Scenario", "Scenario de rendement"],
    ],
  },
  {
    enSlug: "bill-split",
    frSlug: "partage-addition",
    title: "Calculateur partage d'addition | AfroTools",
    name: "Partage d'addition",
    description:
      "Partagez une facture entre amis, collegues ou groupe avec pourboire, parts egales ou montants personnalises.",
    eyebrow: "Vie quotidienne",
    lead:
      "Calculez rapidement qui paie quoi lors d'un repas, transport, logement partage ou achat de groupe.",
    useCase:
      "Utile pour sorties, colocations, voyages, contributions d'equipe et tontines informelles.",
    safety:
      "Le partage reste indicatif; confirmez les montants avec le groupe avant paiement.",
    related:
      "A utiliser avec calculateur pourboire, convertisseur de devises et suivi tontine.",
    methodology:
      "La page prepare devise, montant, objectif de partage et contexte, puis l'outil source calcule parts egales, ajustements, pourboire et resume a partager.",
    sourceNote:
      "Controle 2026: confirmez taxes, frais de service, arrondis, remboursements et taux de change avec le recu ou le groupe avant paiement.",
    businessCtaNote:
      "Conservez le resume pour une equipe, un voyage, une colocation ou une contribution de groupe avant d'envoyer les demandes de paiement.",
    iframeEmbed: true,
    terms: [
      ["Bill Split Calculator", "Calculateur partage d'addition"],
      ["Split Bills", "Partager les factures"],
      ["Equal Split", "Partage egal"],
      ["Custom Amounts", "Montants personnalises"],
      ["Tip", "Pourboire"],
      ["Per Person", "Par personne"],
    ],
  },
  {
    enSlug: "asset-finance",
    frSlug: "financement-actifs",
    title: "Calculateur financement d'actifs | AfroTools",
    name: "Financement d'actifs",
    description:
      "Estimez mensualite, cout total, apport et paiement ballon pour vehicule, machine ou equipement.",
    eyebrow: "Financement entreprise",
    lead:
      "Comparez achat comptant et financement avant d'acquerir un actif productif pour une PME.",
    useCase:
      "Utile pour vehicules commerciaux, materiel agricole, machines, moto de livraison ou equipement atelier.",
    safety:
      "Confirmez taux, frais, garantie, assurance et penalites avec le financeur avant signature.",
    related:
      "A rapprocher de flux de tresorerie, seuil de rentabilite et prevision de revenus.",
    terms: [
      ["Asset Finance Calculator", "Calculateur financement d'actifs"],
      ["Asset Cost", "Cout de l'actif"],
      ["Deposit", "Apport"],
      ["Monthly Installment", "Mensualite"],
      ["Balloon Payment", "Paiement ballon"],
      ["Effective Rate", "Taux effectif"],
      ["Total Cost", "Cout total"],
    ],
  },
  {
    enSlug: "invoice-factoring",
    frSlug: "affacturage",
    title: "Calculateur affacturage Afrique | AfroTools",
    name: "Affacturage",
    description:
      "Calculez avance, frais, produit net et cout effectif d'un financement de factures.",
    eyebrow: "Tresorerie B2B",
    lead:
      "Estimez ce qu'il reste apres commission d'affacturage avant de vendre une creance client.",
    useCase:
      "Utile pour PME qui attendent un paiement client mais doivent payer stock, salaires ou fournisseurs.",
    safety:
      "Le cout depend du risque client, du contrat et du recours; relisez les clauses avant cession.",
    related:
      "Comparez avec prevision de tresorerie, financement d'actifs et consolidation de prets.",
    terms: [
      ["Invoice Factoring Calculator", "Calculateur affacturage"],
      ["Invoice Amount", "Montant facture"],
      ["Advance Rate", "Taux d'avance"],
      ["Factoring Fee", "Frais d'affacturage"],
      ["Net Proceeds", "Produit net"],
      ["Effective APR", "TAEG indicatif"],
    ],
  },
  {
    enSlug: "business-insurance",
    frSlug: "assurance-entreprise",
    title: "Estimateur assurance entreprise Afrique | AfroTools",
    name: "Assurance entreprise",
    description:
      "Estimez les besoins de couverture pour PME: incendie, vol, responsabilite, stock et activite professionnelle.",
    eyebrow: "Assurance PME",
    lead:
      "Structurez une premiere estimation de couverture avant de demander des devis a plusieurs assureurs.",
    useCase:
      "Utile pour boutique, bureau, restaurant, atelier, entrepot ou service professionnel.",
    safety:
      "Les primes et exclusions changent selon assureur, pays, secteur et historique de sinistres.",
    related:
      "A combiner avec assurance incendie, suivi sinistre et financement d'actifs.",
    terms: [
      ["Business Insurance Estimator", "Estimateur assurance entreprise"],
      ["Public Liability", "Responsabilite civile"],
      ["Professional Indemnity", "Responsabilite professionnelle"],
      ["Goods in Transit", "Marchandises transportees"],
      ["Stock", "Stock"],
      ["Premium", "Prime"],
      ["Cover Needs", "Besoins de couverture"],
    ],
  },
  {
    enSlug: "claim-tracker",
    frSlug: "suivi-sinistre-assurance",
    title: "Suivi de sinistre assurance | AfroTools",
    name: "Suivi sinistre assurance",
    description:
      "Organisez documents, echeances, relances et etapes pour une declaration de sinistre assurance.",
    eyebrow: "Assurance",
    lead:
      "Gardez une checklist claire pour moteur, sante, vie, habitation ou entreprise apres un incident.",
    useCase:
      "Utile pour eviter les oublis de documents, photos, rapports, devis, preuves de paiement et relances.",
    safety:
      "Les delais contractuels varient; confirmez toujours avec votre police et votre assureur.",
    related:
      "A utiliser avec assurance auto, assurance entreprise et assurance incendie.",
    terms: [
      ["Insurance Claim Tracker / Checklist", "Suivi sinistre assurance"],
      ["Insurance Claim", "Sinistre assurance"],
      ["Required Documents", "Documents requis"],
      ["Deadline", "Echeance"],
      ["Follow-up", "Relance"],
      ["Claim Status", "Statut du dossier"],
    ],
  },
  {
    enSlug: "fire-insurance",
    frSlug: "assurance-incendie",
    title: "Calculateur assurance incendie | AfroTools",
    name: "Assurance incendie",
    description:
      "Estimez une prime indicative selon valeur du batiment, type de construction et mesures de protection.",
    eyebrow: "Assurance patrimoine",
    lead:
      "Preparez les informations de base avant de demander un devis pour batiment, stock ou local commercial.",
    useCase:
      "Utile pour proprietaires, PME, entrepots, commerces et ateliers qui veulent cadrer le risque incendie.",
    safety:
      "Le devis final depend inspection, exclusions, franchise, zone et garanties choisies.",
    related:
      "A rapprocher d'assurance entreprise, evaluation immobiliere et suivi sinistre.",
    terms: [
      ["Fire Insurance Premium Estimator", "Estimateur prime assurance incendie"],
      ["Fire Insurance Calculator", "Calculateur assurance incendie"],
      ["Property Value", "Valeur du bien"],
      ["Construction Type", "Type de construction"],
      ["Fire Protection", "Protection incendie"],
      ["Premium", "Prime"],
      ["Excess", "Franchise"],
    ],
  },
  {
    enSlug: "credit-score",
    frSlug: "score-credit",
    title: "Simulateur score credit Afrique | AfroTools",
    name: "Score credit",
    description:
      "Comprenez les facteurs qui influencent un score credit et simulez l'effet de retards, dettes et historique.",
    eyebrow: "Credit personnel",
    lead:
      "Visualisez comment paiement a temps, utilisation du credit et anciennete peuvent influencer un profil emprunteur.",
    useCase:
      "Utile avant de demander pret, location, financement d'actif ou carte de credit.",
    safety:
      "Ce simulateur n'est pas un score officiel; chaque bureau de credit et preteur applique sa methode.",
    related:
      "A combiner avec consolidation de prets, BNPL et boule de neige des dettes.",
    methodology:
      "La page prepare pays, montant, objectif et facteurs de profil, puis l'outil source explique les leviers qui peuvent influencer un score ou une decision de credit.",
    sourceNote:
      "Controle 2026: verifiez toujours votre rapport officiel, les criteres du preteur, les bureaux de credit locaux et les droits de correction avant toute demande de credit.",
    businessCtaNote:
      "Gardez le brief des facteurs de risque et des actions de correction avant une demande de pret, de location, d'actif ou de financement PME.",
    iframeEmbed: true,
    terms: [
      ["Credit Score Explainer & Simulator", "Simulateur score credit"],
      ["Credit Score", "Score credit"],
      ["Payment History", "Historique de paiement"],
      ["Credit Utilization", "Utilisation du credit"],
      ["Late Payment", "Retard de paiement"],
      ["Score Factors", "Facteurs du score"],
    ],
  },
  {
    enSlug: "classroom-size",
    frSlug: "capacite-salle-classe",
    title: "Calculateur capacite salle de classe | AfroTools",
    name: "Capacite salle de classe",
    description:
      "Estimez la capacite d'une salle selon surface, espacement des pupitres et marge de securite.",
    eyebrow: "Education",
    lead:
      "Calculez une capacite indicative avant d'organiser une salle, une formation ou une classe temporaire.",
    useCase:
      "Utile pour ecoles, centres de formation, ONG education et responsables d'infrastructures scolaires.",
    safety:
      "Verifiez toujours les normes locales, ventilation, sorties et contraintes de securite incendie.",
    related:
      "A utiliser avec frais scolaires, budget internat et planning examens pour cadrer une offre education.",
    terms: [
      ["Classroom Size Calculator", "Calculateur capacite salle de classe"],
      ["Classroom Capacity", "Capacite de la salle"],
      ["Floor Area", "Surface au sol"],
      ["Desk Spacing", "Espacement des pupitres"],
      ["Students", "Eleves"],
      ["Safety", "Securite"],
    ],
  },
  {
    enSlug: "boarding-school",
    frSlug: "cout-internat",
    title: "Calculateur cout internat Afrique | AfroTools",
    name: "Cout internat",
    description:
      "Estimez frais de scolarite, logement, repas, uniforme et extras pour un internat.",
    eyebrow: "Budget education",
    lead:
      "Comparez les postes de cout avant de choisir entre internat public, mission, prive ou regional.",
    useCase:
      "Utile pour familles qui preparent une rentree scolaire ou comparent plusieurs etablissements.",
    safety:
      "Confirmez frais obligatoires, cautions, transport et hausses annuelles directement avec l'ecole.",
    related:
      "A rapprocher de plan epargne etudes, frais scolaires et recherche de bourses.",
    terms: [
      ["Boarding School Cost Calculator", "Calculateur cout internat"],
      ["Tuition", "Frais de scolarite"],
      ["Boarding", "Internat"],
      ["Uniforms", "Uniformes"],
      ["Meals", "Repas"],
      ["Extras", "Extras"],
      ["Total Cost", "Cout total"],
    ],
  },
  {
    enSlug: "course-load",
    frSlug: "charge-cours",
    title: "Planificateur charge de cours | AfroTools",
    name: "Charge de cours",
    description:
      "Planifiez credits, matieres et rythme d'etudes pour eviter surcharge ou retard de diplomation.",
    eyebrow: "Etudes superieures",
    lead:
      "Repartissez vos credits sur le semestre et visualisez l'impact sur votre calendrier de fin d'etudes.",
    useCase:
      "Utile pour etudiants, conseillers pedagogiques et programmes a temps partiel.",
    safety:
      "Les regles de credits dependent de l'universite; validez toujours avec le departement.",
    related:
      "A combiner avec planning examens, calculateur GPA et plan epargne etudes.",
    terms: [
      ["Course Load & Credit Hour Planner", "Planificateur charge de cours"],
      ["Credit Hours", "Heures de credit"],
      ["Semester", "Semestre"],
      ["Graduation Timeline", "Calendrier de diplomation"],
      ["Course", "Cours"],
      ["Overload", "Surcharge"],
    ],
  },
  {
    enSlug: "exam-timetable",
    frSlug: "planning-examens",
    title: "Generateur planning examens | AfroTools",
    name: "Planning examens",
    description:
      "Generez un planning de revision avec sessions, pauses et priorites par matiere.",
    eyebrow: "Revision",
    lead:
      "Transformez dates d'examen, matieres et disponibilites en calendrier de preparation clair.",
    useCase:
      "Utile pour WAEC, KCSE, Matric, universite, concours et examens professionnels.",
    safety:
      "Le planning aide l'organisation; adaptez-le a votre niveau reel et aux consignes officielles.",
    related:
      "A utiliser avec calculateur GPA, charge de cours et compte a rebours examen.",
    terms: [
      ["Exam Timetable Generator", "Generateur planning examens"],
      ["Study Sessions", "Sessions de revision"],
      ["Revision Blocks", "Blocs de revision"],
      ["Break Reminders", "Rappels de pause"],
      ["Subject", "Matiere"],
      ["Exam Date", "Date d'examen"],
    ],
  },
  {
    enSlug: "edu-savings",
    frSlug: "epargne-etudes",
    title: "Calculateur epargne etudes | AfroTools",
    name: "Epargne etudes",
    description:
      "Estimez combien epargner pour frais scolaires, universite, internat ou formation.",
    eyebrow: "Planification familiale",
    lead:
      "Modelez inflation scolaire, contribution mensuelle et objectif pour preparer les couts d'education.",
    useCase:
      "Utile pour parents, tuteurs et etudiants qui financent progressivement une formation.",
    safety:
      "Les frais changent selon ecole, devise et annee; actualisez les chiffres avant decision.",
    related:
      "A combiner avec cout internat, frais scolaires et recherche de bourses.",
    terms: [
      ["Education Savings Plan Calculator", "Calculateur epargne etudes"],
      ["Education Savings", "Epargne etudes"],
      ["School Fees", "Frais scolaires"],
      ["Inflation", "Inflation"],
      ["Monthly Savings", "Epargne mensuelle"],
      ["Goal", "Objectif"],
    ],
  },
  {
    enSlug: "coding-bootcamp",
    frSlug: "comparateur-bootcamp",
    title: "Comparateur bootcamp tech Afrique | AfroTools",
    name: "Comparateur bootcamp",
    description:
      "Comparez cout, duree, stack, format et retour attendu de formations tech et bootcamps.",
    eyebrow: "Formation tech",
    lead:
      "Structurez votre comparaison avant de payer une formation en developpement, data, cloud ou design.",
    useCase:
      "Utile pour etudiants, professionnels en reconversion et equipes RH qui evaluent des programmes.",
    safety:
      "Verifiez placement, mentors, programme, remboursement et preuves d'anciens apprenants.",
    related:
      "A rapprocher de ROI certification, changement de carriere et preparation entretien.",
    terms: [
      ["Coding Bootcamp Comparator", "Comparateur bootcamp"],
      ["Bootcamp", "Bootcamp"],
      ["Duration", "Duree"],
      ["Job Placement", "Insertion professionnelle"],
      ["Stack", "Stack technique"],
      ["Tuition", "Frais"],
    ],
  },
  {
    enSlug: "cert-roi",
    frSlug: "roi-certification",
    title: "Calculateur ROI certification professionnelle | AfroTools",
    name: "ROI certification",
    description:
      "Estimez cout, hausse de revenu, delai de retour et rendement d'une certification professionnelle.",
    eyebrow: "Carriere",
    lead:
      "Comparez frais d'examen, cours, temps d'etude et impact salarial attendu avant de vous inscrire.",
    useCase:
      "Utile pour certifications finance, cloud, gestion projet, data, comptabilite ou audit.",
    safety:
      "Le rendement depend du marche, de l'experience et de l'employeur; traitez-le comme scenario.",
    related:
      "A combiner avec comparateur bootcamp, croissance carriere et changement de carriere.",
    terms: [
      ["Professional Certification ROI Calculator", "Calculateur ROI certification"],
      ["Certification ROI", "ROI certification"],
      ["Payback Period", "Delai de retour"],
      ["Exam Fees", "Frais d'examen"],
      ["Salary Increase", "Hausse salariale"],
      ["Five-year Return", "Rendement sur cinq ans"],
    ],
  },
  {
    enSlug: "gov-scholarship",
    frSlug: "bourses-gouvernementales",
    title: "Recherche de bourses gouvernementales | AfroTools",
    name: "Bourses gouvernementales",
    description:
      "Preparez une recherche de bourses publiques selon pays, niveau, domaine et destination.",
    eyebrow: "Bourses",
    lead:
      "Filtrez les criteres utiles avant de verifier les portails officiels et les dates limites.",
    useCase:
      "Utile pour etudiants qui cherchent financement local, regional ou international.",
    safety:
      "Confirmez toujours l'existence, l'eligibilite et la date limite sur la source officielle.",
    related:
      "A utiliser avec reste a financer bourse, epargne etudes et planning examens.",
    terms: [
      ["Government Scholarship Finder", "Recherche de bourses gouvernementales"],
      ["Scholarships", "Bourses"],
      ["Eligibility", "Eligibilite"],
      ["Deadline", "Date limite"],
      ["Field", "Domaine"],
      ["Level", "Niveau"],
      ["Official Source", "Source officielle"],
    ],
  },
  {
    enSlug: "interview-prep",
    frSlug: "preparation-entretien",
    title: "Checklist preparation entretien | AfroTools",
    name: "Preparation entretien",
    description:
      "Generez une checklist d'entretien avec questions, methode STAR et actions de suivi.",
    eyebrow: "Carriere",
    lead:
      "Organisez votre preparation selon role, type d'entreprise et points de preuve a raconter.",
    useCase:
      "Utile avant entretien RH, technique, stage, premier emploi ou promotion interne.",
    safety:
      "La checklist aide a preparer; adaptez vos reponses a votre experience reelle.",
    related:
      "A combiner avec croissance carriere, changement de carriere et generateur CV.",
    terms: [
      ["Interview Preparation Checklist", "Checklist preparation entretien"],
      ["STAR method", "Methode STAR"],
      ["Role-specific questions", "Questions par role"],
      ["Follow-up email", "Email de suivi"],
      ["Company Type", "Type d'entreprise"],
      ["Checklist", "Checklist"],
    ],
  },
  {
    enSlug: "career-growth",
    frSlug: "croissance-carriere",
    title: "Calculateur croissance de carriere | AfroTools",
    name: "Croissance carriere",
    description:
      "Projetez promotions, jalons salariaux, competences et trajectoire de progression.",
    eyebrow: "Carriere",
    lead:
      "Visualisez plusieurs scenarios de progression pour relier apprentissage, performance et revenu.",
    useCase:
      "Utile pour negocier, planifier une promotion ou choisir une prochaine competence a renforcer.",
    safety:
      "Les projections sont indicatives; elles dependent du secteur, de l'entreprise et du marche.",
    related:
      "A comparer avec ROI certification, preparation entretien et changement de carriere.",
    terms: [
      ["Career Growth Trajectory Calculator", "Calculateur croissance de carriere"],
      ["Career Growth", "Croissance de carriere"],
      ["Promotion", "Promotion"],
      ["Salary Milestones", "Jalons salariaux"],
      ["Skills", "Competences"],
      ["Lifetime Earnings", "Revenus de carriere"],
    ],
  },
  {
    enSlug: "career-switch",
    frSlug: "changement-carriere",
    title: "Calculateur changement de carriere | AfroTools",
    name: "Changement de carriere",
    description:
      "Estimez cout de transition, revenu perdu, formation et delai de retour lors d'une reconversion.",
    eyebrow: "Reconversion",
    lead:
      "Comparez scenario actuel et nouvelle voie avant de quitter un role ou d'investir dans une formation.",
    useCase:
      "Utile pour passer vers tech, finance, creation, commerce, enseignement ou travail independant.",
    safety:
      "Les resultats ne garantissent pas emploi ni salaire; gardez une marge de tresorerie.",
    related:
      "A combiner avec fonds d'urgence, ROI certification et preparation entretien.",
    terms: [
      ["Career Switch Financial Impact Calculator", "Calculateur changement de carriere"],
      ["Career Switch", "Changement de carriere"],
      ["Foregone Income", "Revenu perdu"],
      ["Retraining", "Reformation"],
      ["Break-even Timeline", "Delai de retour"],
      ["Transition Budget", "Budget de transition"],
    ],
  },
  {
    enSlug: "freelance-contract",
    frSlug: "contrat-freelance",
    title: "Generateur contrat freelance | AfroTools",
    name: "Contrat freelance",
    description:
      "Preparez un contrat freelance avec livrables, paiements, revisions, confidentialite et propriete intellectuelle.",
    eyebrow: "Travail independant",
    lead:
      "Structurez les clauses principales avant de faire relire le document ou de l'envoyer au client.",
    useCase:
      "Utile pour designers, developpeurs, redacteurs, consultants, creatifs et agences.",
    safety:
      "Ce modele n'est pas un avis juridique; adaptez-le au droit local et au projet.",
    related:
      "A utiliser avec facture freelance, taux freelance et generateur de contrat.",
    terms: [
      ["Freelance Contract Generator", "Generateur contrat freelance"],
      ["Deliverables", "Livrables"],
      ["Payment Milestones", "Jalons de paiement"],
      ["IP ownership", "Propriete intellectuelle"],
      ["Revision Limits", "Limites de revision"],
      ["Confidentiality", "Confidentialite"],
    ],
  },
  {
    enSlug: "freelance-invoice",
    frSlug: "facture-freelance",
    title: "Generateur facture freelance | AfroTools",
    name: "Facture freelance",
    description:
      "Creez une facture, un devis ou un recu freelance avec taxes, client, lignes et export.",
    eyebrow: "Facturation",
    lead:
      "Preparez des documents propres pour encaisser un acompte, livrer un projet ou relancer un paiement.",
    useCase:
      "Utile pour freelances, consultants, createurs, petites agences et prestataires locaux.",
    safety:
      "Verifiez TVA, retenue a la source, mentions legales et devise selon votre pays.",
    related:
      "A combiner avec contrat freelance, taux freelance et marge beneficiaire.",
    terms: [
      ["Freelance Invoice Generator", "Generateur facture freelance"],
      ["Invoice", "Facture"],
      ["Estimate", "Devis"],
      ["Receipt", "Recu"],
      ["Client", "Client"],
      ["Payment Link", "Lien de paiement"],
      ["Export", "Exporter"],
    ],
  },
  {
    enSlug: "concert-budget",
    frSlug: "budget-concert",
    title: "Planificateur budget concert | AfroTools",
    name: "Budget concert",
    description:
      "Planifiez capacite, billets, sponsoring, artistes, lieu, production et seuil de rentabilite.",
    eyebrow: "Evenements",
    lead:
      "Modelez les couts et revenus d'un concert, festival ou evenement communautaire avant de lancer les ventes.",
    useCase:
      "Utile pour promoteurs, campus, eglises, collectifs creatifs et equipes marketing.",
    safety:
      "Les couts securite, licences, taxes et annulations doivent etre confirmes localement.",
    related:
      "A utiliser avec revenus billetterie, budget voyage et cout reunion.",
    terms: [
      ["Concert and Festival Budget Planner", "Planificateur budget concert"],
      ["Break-even Ticket Price", "Prix billet au seuil"],
      ["Capacity", "Capacite"],
      ["Sponsorship", "Sponsoring"],
      ["Artists", "Artistes"],
      ["Venue", "Lieu"],
      ["Production", "Production"],
    ],
  },
  {
    enSlug: "event-ticket-revenue",
    frSlug: "revenus-billetterie",
    title: "Calculateur revenus billetterie | AfroTools",
    name: "Revenus billetterie",
    description:
      "Calculez revenu net par categorie de billet apres frais, remboursements, invitations et couts.",
    eyebrow: "Evenements",
    lead:
      "Comparez VIP, standard, etudiant ou early bird pour comprendre le revenu vraiment disponible.",
    useCase:
      "Utile pour concerts, conferences, matchs, ateliers, festivals et evenements communautaires.",
    safety:
      "Les frais de plateforme, taxes et remboursements peuvent changer; verifiez avant publication.",
    related:
      "A combiner avec budget concert, cout reunion et planificateur budget.",
    terms: [
      ["Event Ticket Revenue Calculator", "Calculateur revenus billetterie"],
      ["Ticket Revenue", "Revenus billetterie"],
      ["VIP", "VIP"],
      ["Regular", "Standard"],
      ["Student", "Etudiant"],
      ["Refunds", "Remboursements"],
      ["Net Revenue", "Revenu net"],
    ],
  },
  {
    enSlug: "airport-transfer",
    frSlug: "transfert-aeroport",
    title: "Comparateur cout transfert aeroport | AfroTools",
    name: "Transfert aeroport",
    description:
      "Comparez taxi, VTC, navette et voiture privee pour un transfert aeroport en Afrique.",
    eyebrow: "Voyage",
    lead:
      "Estimez le cout d'arrivee ou de depart avant de choisir entre taxi, application, navette ou chauffeur.",
    useCase:
      "Utile pour voyageurs, familles, equipes et visiteurs business qui planifient un trajet depuis l'aeroport.",
    safety:
      "Les prix changent selon ville, heure, carburant et disponibilite; confirmez le tarif avant depart.",
    related:
      "A combiner avec budget voyage, hotel vs Airbnb et guide prix hotels.",
    terms: [
      ["Airport Transfer Cost Comparator", "Comparateur cout transfert aeroport"],
      ["Taxi", "Taxi"],
      ["Shuttle", "Navette"],
      ["Private Car", "Voiture privee"],
      ["Group Pricing", "Prix de groupe"],
      ["Transfer Cost", "Cout transfert"],
    ],
  },
  {
    enSlug: "airbnb-vs-hotel",
    frSlug: "airbnb-vs-hotel",
    title: "Comparateur Airbnb vs hotel Afrique | AfroTools",
    name: "Airbnb vs hotel",
    description:
      "Comparez cout total, duree, groupe, repas et frais entre location courte duree et hotel.",
    eyebrow: "Hebergement",
    lead:
      "Reperez quand une location devient moins chere qu'un hotel selon taille du groupe et duree du sejour.",
    useCase:
      "Utile pour voyages en famille, deplacement business, sejours longs et city breaks.",
    safety:
      "Verifiez taxes, frais de menage, securite, localisation et conditions d'annulation.",
    related:
      "A utiliser avec guide prix hotels, budget vacances plage et transfert aeroport.",
    terms: [
      ["Airbnb vs Hotel Comparator", "Comparateur Airbnb vs hotel"],
      ["Hotel", "Hotel"],
      ["Long stay", "Long sejour"],
      ["Group size", "Taille du groupe"],
      ["Cooking savings", "Economies repas"],
      ["Accommodation", "Hebergement"],
    ],
  },
  {
    enSlug: "beach-holiday-budget",
    frSlug: "budget-vacances-plage",
    title: "Budget vacances plage Afrique | AfroTools",
    name: "Budget vacances plage",
    description:
      "Planifiez hebergement, repas, activites, transport et marge pour des vacances plage africaines.",
    eyebrow: "Tourisme",
    lead:
      "Construisez un budget par personne avant de reserver sejour, excursions et transport local.",
    useCase:
      "Utile pour Zanzibar, Diani, Seychelles, Maurice, Mombasa, Lagos, Le Cap ou Charm el-Cheikh.",
    safety:
      "Les prix varient selon saison, change, disponibilite et niveau de confort; gardez une marge.",
    related:
      "A rapprocher de hotel vs Airbnb, transfert aeroport et budget festival.",
    terms: [
      ["African Beach Holiday Budget Planner", "Planificateur budget vacances plage"],
      ["Beach Holiday", "Vacances plage"],
      ["Accommodation", "Hebergement"],
      ["Activities", "Activites"],
      ["Per-person cost", "Cout par personne"],
      ["Food", "Repas"],
    ],
  },
  {
    enSlug: "festival-travel-budget",
    frSlug: "budget-voyage-festival",
    title: "Budget voyage festival Afrique | AfroTools",
    name: "Budget voyage festival",
    description:
      "Estimez billets, transport, hotel, repas et marge pour un festival ou evenement africain.",
    eyebrow: "Evenements et voyage",
    lead:
      "Regroupez les couts avant un festival, match, carnaval, concert ou evenement culturel.",
    useCase:
      "Utile pour AFCON, festivals musicaux, carnavals, evenements religieux et sorties de groupe.",
    safety:
      "Confirmez prix officiels, disponibilite, visas, securite et remboursements avant achat.",
    related:
      "A combiner avec budget concert, revenus billetterie et budget vacances plage.",
    terms: [
      ["African Festival & Event Travel Budget", "Budget voyage festival"],
      ["Festival", "Festival"],
      ["Flights", "Vols"],
      ["Hotels", "Hotels"],
      ["Tickets", "Billets"],
      ["All-in cost", "Cout complet"],
    ],
  },
  {
    enSlug: "hotel-star-guide",
    frSlug: "guide-prix-hotels",
    title: "Guide prix hotels Afrique | AfroTools",
    name: "Guide prix hotels",
    description:
      "Comparez fourchettes de prix par categorie d'hotel, ville, saison et quartier.",
    eyebrow: "Hebergement",
    lead:
      "Obtenez une estimation par nuit avant de comparer quartiers, etoiles et plateformes de reservation.",
    useCase:
      "Utile pour deplacements business, tourisme urbain, transit aeroport et voyages familiaux.",
    safety:
      "Les prix sont indicatifs; verifiez disponibilite, taxes, petit-dejeuner et frais locaux.",
    related:
      "A utiliser avec Airbnb vs hotel, transfert aeroport et budget voyage festival.",
    terms: [
      ["Hotel Star Rating Price Guide", "Guide prix hotels"],
      ["Hotel nightly rate", "Tarif hotel par nuit"],
      ["Star prices", "Prix par etoiles"],
      ["Season pricing", "Prix saisonniers"],
      ["Neighborhoods", "Quartiers"],
      ["Booking tips", "Conseils reservation"],
    ],
  },
  {
    enSlug: "hajj-budget",
    frSlug: "budget-hajj-umrah",
    title: "Calculateur budget Hajj et Omra | AfroTools",
    name: "Budget Hajj et Omra",
    description:
      "Estimez forfait, visa, repas, transport, duree et marge pour Hajj ou Omra.",
    eyebrow: "Voyage religieux",
    lead:
      "Preparez une cible d'epargne et comparez plusieurs niveaux de package avant de reserver.",
    useCase:
      "Utile pour familles, groupes et voyageurs qui planifient un pelerinage depuis l'Afrique.",
    safety:
      "Confirmez toujours exigences officielles, visa, agence autorisee et calendrier religieux.",
    related:
      "A rapprocher de budget voyage, objectif epargne et convertisseur de devises.",
    terms: [
      ["Hajj and Umrah Budget Calculator", "Calculateur budget Hajj et Omra"],
      ["Hajj", "Hajj"],
      ["Umrah", "Omra"],
      ["Package level", "Niveau de forfait"],
      ["Travelers", "Voyageurs"],
      ["Contingency", "Marge de securite"],
    ],
  },
  {
    enSlug: "delivery-cost",
    frSlug: "cout-livraison",
    title: "Estimateur cout livraison Afrique | AfroTools",
    name: "Cout livraison",
    description:
      "Estimez cout de livraison selon distance, poids, urgence et type de vehicule.",
    eyebrow: "Logistique",
    lead:
      "Comparez moto, voiture, van ou camion avant de fixer un prix de livraison.",
    useCase:
      "Utile pour e-commerce, restaurants, pharmacies, boutiques et petites operations logistiques.",
    safety:
      "Les tarifs varient selon carburant, ville, plateforme, attente et conditions routieres.",
    related:
      "A combiner avec dernier kilometre, cout transfert aeroport et estimation fret.",
    terms: [
      ["Delivery Cost Estimator", "Estimateur cout livraison"],
      ["Delivery costs", "Couts livraison"],
      ["Distance", "Distance"],
      ["Weight", "Poids"],
      ["Urgency", "Urgence"],
      ["Bike", "Moto"],
      ["Van", "Van"],
    ],
  },
  {
    enSlug: "last-mile-delivery",
    frSlug: "dernier-kilometre",
    title: "Optimiseur cout dernier kilometre | AfroTools",
    name: "Dernier kilometre",
    description:
      "Comparez cout par colis selon densite, zone, vehicule et volume de livraison.",
    eyebrow: "Logistique urbaine",
    lead:
      "Reperez le scenario le plus economique pour livrer en zone dense, periurbaine ou rurale.",
    useCase:
      "Utile pour e-commerce, distribution FMCG, pharmacies, dark stores et operateurs locaux.",
    safety:
      "Les resultats dependent de la densite reelle, retours, temps d'attente et prix carburant.",
    related:
      "A rapprocher de cout livraison, partage cout conteneur et cout rendu.",
    businessCtaNote:
      "Gardez le volume, le cout par colis, la zone et les contraintes SLA avant de demander un calculateur livraison ou un widget de devis.",
    terms: [
      ["Last-Mile Delivery Cost Optimizer", "Optimiseur cout dernier kilometre"],
      ["Last-mile", "Dernier kilometre"],
      ["Cost per package", "Cout par colis"],
      ["Urban", "Urbain"],
      ["Rural", "Rural"],
      ["Vehicle types", "Types de vehicule"],
    ],
  },
  {
    enSlug: "customs-time",
    frSlug: "delai-dedouanement",
    title: "Estimateur delai dedouanement Afrique | AfroTools",
    name: "Delai dedouanement",
    description:
      "Estimez delais, documents, frais agent et cout stockage pour une operation de dedouanement.",
    eyebrow: "Commerce et douane",
    lead:
      "Preparez un planning prudent avant d'importer par port, aeroport ou route.",
    useCase:
      "Utile pour importateurs, transitaires, PME et acheteurs qui veulent anticiper les blocages.",
    safety:
      "Les procedures douanieres changent; confirmez code SH, documents et frais avec un transitaire.",
    related:
      "A combiner avec droits de douane, cout rendu et estimateur fret.",
    terms: [
      ["Customs Clearance Time Estimator", "Estimateur delai dedouanement"],
      ["Customs clearance", "Dedouanement"],
      ["Required documents", "Documents requis"],
      ["Agent fees", "Frais agent"],
      ["Storage cost", "Cout stockage"],
      ["Ports", "Ports"],
    ],
  },
  {
    enSlug: "b2b-payment",
    frSlug: "paiement-b2b-transfrontalier",
    title: "Comparateur paiement B2B transfrontalier | AfroTools",
    name: "Paiement B2B transfrontalier",
    description:
      "Comparez frais de transfert, taux de change, delai, KYC et cout net pour paiements B2B internationaux en Afrique.",
    eyebrow: "Paiements entreprises",
    lead:
      "Estimez le cout total avant d'envoyer un paiement fournisseur, freelance ou distributeur, puis verifiez le devis reel de la banque ou fintech.",
    useCase:
      "Utile pour PME qui comparent SWIFT, fintechs, mobile money, stablecoins ou plateformes business.",
    safety:
      "Verifiez disponibilite, limites, KYC, taux de change, sanctions, justificatifs et conformite avant paiement.",
    related:
      "A utiliser avec impact FX import, frais bancaires, prevision de tresorerie et workflow fournisseur.",
    methodology:
      "Nous preparons montant, devise, frais, spread FX, delai et methode de reglement, puis l'outil source calcule le cout net et les hypotheses a comparer.",
    sourceNote:
      "Source principale: devis ou grille tarifaire de votre banque, fintech ou prestataire de paiement. Derniere verification de la page: 2026.",
    businessCtaNote:
      "Gardez le resume fournisseur, le devis de frais et le delai de reglement avant de lancer un paiement recurrent ou de demander une integration API.",
    iframeEmbed: true,
    faq: [
      {
        name: "Quand utiliser Paiement B2B transfrontalier ?",
        text: "Utilisez-le avant de payer un fournisseur, freelance, distributeur ou partenaire quand les frais, le taux de change et le delai peuvent changer le cout final.",
      },
      {
        name: "Comment lire le resultat ?",
        text: "Comparez cout net, frais fixes, spread de change, delai et contraintes KYC. Le resultat est une estimation a confirmer avec le prestataire.",
      },
      {
        name: "Le comparateur remplace-t-il un devis bancaire ?",
        text: "Non. Il aide a preparer la comparaison, mais le devis officiel, les limites, la conformite et les documents exiges doivent etre verifies localement.",
      },
      {
        name: "Quels risques verifier avant paiement ?",
        text: "Verifiez sanctions, pays desservi, devise disponible, justificatifs, frais intermediaires, delai de reglement et politique de remboursement ou d'annulation.",
      },
    ],
    terms: [
      ["Cross-Border B2B Payment Comparator", "Comparateur paiement B2B transfrontalier"],
      ["Cross-border", "Transfrontalier"],
      ["SWIFT", "SWIFT"],
      ["Transfer fee", "Frais de transfert"],
      ["Exchange rate", "Taux de change"],
      ["Settlement time", "Delai de reglement"],
    ],
  },
  {
    enSlug: "factory-setup-cost",
    frSlug: "cout-installation-usine",
    title: "Estimateur cout installation usine | AfroTools",
    name: "Cout installation usine",
    description:
      "Estimez terrain, batiment, machines, utilites, permis et fonds de roulement pour une usine.",
    eyebrow: "Industrie",
    lead:
      "Cadrez un budget de demarrage industriel avant de demander devis, financement ou autorisations.",
    useCase:
      "Utile pour projets agrotransformation, textile, emballage, assemblage et petites manufactures.",
    safety:
      "Ce n'est pas une etude de faisabilite; confirmez foncier, energie, normes et fiscalite localement.",
    related:
      "A rapprocher de financement d'actifs, prevision tresorerie et etude faisabilite.",
    terms: [
      ["Factory Setup Cost Estimator", "Estimateur cout installation usine"],
      ["Factory setup", "Installation usine"],
      ["Land", "Terrain"],
      ["Machinery", "Machines"],
      ["Utilities", "Utilites"],
      ["Permits", "Permis"],
      ["Working capital", "Fonds de roulement"],
    ],
  },
  {
    enSlug: "guard-service-cost",
    frSlug: "cout-gardiennage",
    title: "Comparateur cout gardiennage | AfroTools",
    name: "Cout gardiennage",
    description:
      "Comparez gardiennage arme ou non arme, societe ou freelance, contrat et cout mensuel.",
    eyebrow: "Securite",
    lead:
      "Estimez une enveloppe mensuelle avant de demander un devis de securite pour site ou commerce.",
    useCase:
      "Utile pour PME, entrepots, immeubles, chantiers, ecoles et evenements.",
    safety:
      "Verifiez licence, assurance, responsabilite, horaires, supervision et regles locales.",
    related:
      "A combiner avec cout securite maison, CCTV et assurance entreprise.",
    terms: [
      ["Guard Service Cost Comparator", "Comparateur cout gardiennage"],
      ["Guard service", "Service de gardiennage"],
      ["Armed", "Arme"],
      ["Unarmed", "Non arme"],
      ["Contract checklist", "Checklist contrat"],
      ["Monthly cost", "Cout mensuel"],
    ],
  },
  {
    enSlug: "home-security-cost",
    frSlug: "cout-securite-maison",
    title: "Estimateur cout securite maison | AfroTools",
    name: "Cout securite maison",
    description:
      "Estimez cout initial et mensuel pour CCTV, alarme, gardiennage et mesures de prevention.",
    eyebrow: "Securite domicile",
    lead:
      "Comparez plusieurs niveaux de protection avant d'acheter camera, alarme ou service de surveillance.",
    useCase:
      "Utile pour maison, appartement, boutique familiale ou residence de diaspora.",
    safety:
      "Le niveau de risque doit etre evalue localement; demandez conseil a des prestataires verifies.",
    related:
      "A rapprocher de cout CCTV, gardiennage et assurance habitation ou entreprise.",
    terms: [
      ["Home Security Cost Estimator", "Estimateur cout securite maison"],
      ["Home security", "Securite maison"],
      ["CCTV", "CCTV"],
      ["Alarm", "Alarme"],
      ["Risk level", "Niveau de risque"],
      ["Monthly costs", "Couts mensuels"],
    ],
  },
  {
    enSlug: "cctv-cost",
    frSlug: "cout-cctv",
    title: "Calculateur cout CCTV | AfroTools",
    name: "Cout CCTV",
    description:
      "Calculez cameras, enregistreur, stockage, installation, monitoring et cout total sur plusieurs annees.",
    eyebrow: "Securite video",
    lead:
      "Comparez installation DIY et professionnelle avant d'equiper maison, boutique ou entrepot.",
    useCase:
      "Utile pour commerces, ecoles, bureaux, residences et petits sites industriels.",
    safety:
      "Verifiez qualite camera, retention video, confidentialite, garantie et maintenance.",
    related:
      "A utiliser avec securite maison, gardiennage et assurance entreprise.",
    terms: [
      ["CCTV System Cost Calculator", "Calculateur cout CCTV"],
      ["CCTV System", "Systeme CCTV"],
      ["Cameras", "Cameras"],
      ["DVR/NVR", "DVR/NVR"],
      ["Storage", "Stockage"],
      ["Monitoring", "Surveillance"],
      ["Installation", "Installation"],
    ],
  },
  {
    enSlug: "gas-lpg-cost",
    frSlug: "cout-gaz-lpg",
    title: "Calculateur cout gaz LPG | AfroTools",
    name: "Cout gaz LPG",
    description:
      "Estimez cout de cuisson au gaz selon bouteille, prix de recharge, usage et frequence.",
    eyebrow: "Energie domestique",
    lead:
      "Comparez tailles de cylindre, cout par kg et prevision de recharge pour menage ou petite activite.",
    useCase:
      "Utile pour foyers, restaurants, cantines, vendeurs de rue et petites cuisines commerciales.",
    safety:
      "Les prix et disponibilites changent par ville; respectez toujours les consignes de securite gaz.",
    related:
      "A rapprocher de tarifs electricite, charbon vs cuisson propre et audit energie maison.",
    terms: [
      ["Gas / LPG Cost Calculator", "Calculateur cout gaz LPG"],
      ["LPG", "LPG"],
      ["Cooking gas", "Gaz de cuisson"],
      ["Cylinder size", "Taille bouteille"],
      ["Refill price", "Prix recharge"],
      ["Usage", "Usage"],
      ["Forecast", "Prevision"],
    ],
  },
  {
    enSlug: "car-import-cost",
    frSlug: "cout-importation-voiture",
    title: "Calculateur cout importation voiture Afrique | AfroTools",
    name: "Cout importation voiture",
    description:
      "Estimez prix achat, fret, droits, taxes, change et frais portuaires pour importer une voiture en Afrique.",
    eyebrow: "Import auto",
    lead:
      "Cadrez le cout rendu d'un vehicule avant de comparer annonces, shipping, agents et taxes locales.",
    useCase:
      "Utile pour acheteurs, revendeurs, diaspora et petites flottes qui comparent plusieurs scenarios d'importation.",
    safety:
      "Les droits, restrictions d'age, emissions et frais portuaires doivent etre confirmes avec les sources officielles.",
    related:
      "A rapprocher de droits de douane, cout rendu, assurance auto et depreciation vehicule.",
    terms: [
      ["African Car Landed Cost Calculator", "Calculateur cout importation voiture"],
      ["Purchase price", "Prix achat"],
      ["Freight", "Fret"],
      ["Customs duty", "Droit de douane"],
      ["Port fees", "Frais portuaires"],
      ["Exchange rate", "Taux de change"],
      ["Landed cost", "Cout rendu"],
    ],
  },
  {
    enSlug: "visa-checker",
    frSlug: "exigences-visa-afrique",
    title: "Verificateur exigences visa Afrique | AfroTools",
    name: "Exigences visa Afrique",
    description:
      "Preparez une verification des exigences visa, eVisa, arrivee et documents pour les voyages africains.",
    eyebrow: "Voyage",
    lead:
      "Comparez nationalite, destination, duree et type de sejour avant de consulter la source officielle.",
    useCase:
      "Utile pour voyageurs, equipes business, etudiants, familles et organisateurs d'evenements.",
    safety:
      "Les exigences changent vite; confirmez toujours sur le site officiel de l'ambassade ou de l'immigration.",
    related:
      "A combiner avec budget voyage, transfert aeroport et assurance voyage.",
    terms: [
      ["African Visa Requirement Checker", "Verificateur exigences visa Afrique"],
      ["Visa", "Visa"],
      ["eVisa", "eVisa"],
      ["Passport", "Passeport"],
      ["Destination", "Destination"],
      ["Stay duration", "Duree du sejour"],
      ["Official source", "Source officielle"],
    ],
  },
  {
    enSlug: "business-registration",
    frSlug: "enregistrement-entreprise",
    title: "Checklist enregistrement entreprise | AfroTools",
    name: "Enregistrement entreprise",
    description:
      "Organisez les etapes, documents, frais et delais pour immatriculer une entreprise africaine.",
    eyebrow: "Creation d'entreprise",
    lead:
      "Transformez une idee de societe en checklist d'actions avant de payer un agent ou un service public.",
    useCase:
      "Utile pour fondateurs, freelances, commerces, startups et petites entreprises qui preparent leur dossier.",
    safety:
      "Les exigences dependent du pays, de la forme juridique et du secteur; verifiez le portail officiel.",
    related:
      "A utiliser avec type de societe, licence business, plan d'affaires et contrat fondateurs.",
    terms: [
      ["Business Registration Checklist", "Checklist enregistrement entreprise"],
      ["Company name", "Nom de societe"],
      ["Registration fees", "Frais d'immatriculation"],
      ["Documents", "Documents"],
      ["Director", "Dirigeant"],
      ["Tax ID", "Identifiant fiscal"],
      ["License", "Licence"],
    ],
  },
  {
    enSlug: "ride-fare",
    frSlug: "tarif-vtc-taxi",
    title: "Estimateur tarif VTC et taxi | AfroTools",
    name: "Tarif VTC et taxi",
    description:
      "Estimez prix d'un trajet selon distance, duree, carburant, attente, heure et type de vehicule.",
    eyebrow: "Transport urbain",
    lead:
      "Comparez taxi, VTC, moto ou trajet prive avant de negocier ou confirmer une course.",
    useCase:
      "Utile pour trajets quotidiens, aeroport, sorties, livraisons legeres et remboursements business.",
    safety:
      "Les tarifs varient selon trafic, demande, carburant et securite; confirmez le prix avant depart.",
    related:
      "A combiner avec transfert aeroport, tarifs itineraire et cout livraison.",
    terms: [
      ["Ride-Hailing Fare Estimator", "Estimateur tarif VTC et taxi"],
      ["Ride fare", "Tarif trajet"],
      ["Distance", "Distance"],
      ["Waiting time", "Temps d'attente"],
      ["Surge", "Majoration"],
      ["Taxi", "Taxi"],
      ["Motorbike", "Moto"],
    ],
  },
  {
    enSlug: "route-fares",
    frSlug: "tarifs-itineraire",
    title: "Estimateur tarifs itineraire Afrique | AfroTools",
    name: "Tarifs itineraire",
    description:
      "Estimez cout de route, transport collectif, carburant, peages et marge pour un itineraire africain.",
    eyebrow: "Transport interurbain",
    lead:
      "Preparez un budget de deplacement entre villes avant de choisir bus, taxi collectif, voiture ou navette.",
    useCase:
      "Utile pour voyageurs, etudiants, equipes terrain, commercants et familles qui planifient un trajet.",
    safety:
      "Les prix peuvent changer selon saison, securite, carburant et disponibilite; verifiez le jour du depart.",
    related:
      "A utiliser avec tarif VTC, budget voyage et cout livraison.",
    terms: [
      ["Route Fares", "Tarifs itineraire"],
      ["Route", "Itineraire"],
      ["Fare", "Tarif"],
      ["Bus", "Bus"],
      ["Fuel", "Carburant"],
      ["Toll", "Peage"],
      ["Travel budget", "Budget deplacement"],
    ],
  },
  {
    enSlug: "solar-vs-generator",
    frSlug: "solaire-vs-generateur",
    title: "Comparateur solaire vs generateur | AfroTools",
    name: "Solaire vs generateur",
    description:
      "Comparez cout initial, carburant, batterie, maintenance et retour entre solaire et generateur.",
    eyebrow: "Energie",
    lead:
      "Choisissez une option de secours en visualisant cout mensuel, autonomie et point de bascule.",
    useCase:
      "Utile pour maisons, boutiques, bureaux, cliniques, ecoles et petites operations hors reseau fiable.",
    safety:
      "Les resultats dependent du profil de charge, du carburant et des devis; confirmez avec un installateur qualifie.",
    related:
      "A combiner avec calculateur solaire, cout gaz LPG, autonomie batterie et audit energie.",
    terms: [
      ["Solar vs Generator", "Solaire vs generateur"],
      ["Generator", "Generateur"],
      ["Solar", "Solaire"],
      ["Battery", "Batterie"],
      ["Fuel cost", "Cout carburant"],
      ["Maintenance", "Maintenance"],
      ["Payback", "Retour sur investissement"],
    ],
  },
  {
    enSlug: "land-registry-fees",
    frSlug: "frais-registre-foncier",
    title: "Calculateur frais registre foncier | AfroTools",
    name: "Frais registre foncier",
    description:
      "Estimez droits, recherches, timbres, enregistrement et frais administratifs pour une transaction fonciere.",
    eyebrow: "Foncier",
    lead:
      "Preparez un budget de mutation ou verification avant de signer une promesse d'achat.",
    useCase:
      "Utile pour acheteurs, diaspora, agents immobiliers, juristes et familles qui verifient un titre.",
    safety:
      "Les frais et documents sont locaux; confirmez avec le registre foncier, un notaire ou un avocat.",
    related:
      "A utiliser avec verification titre foncier, droits de mutation et taxes foncieres.",
    terms: [
      ["Land Registry Fee Calculator", "Calculateur frais registre foncier"],
      ["Land registry", "Registre foncier"],
      ["Title search", "Recherche de titre"],
      ["Stamp duty", "Droit de timbre"],
      ["Transfer fee", "Frais de mutation"],
      ["Admin fees", "Frais administratifs"],
      ["Property value", "Valeur du bien"],
    ],
  },
  {
    enSlug: "backup-power-costs",
    frSlug: "couts-secours-energie",
    title: "Calculateur couts energie de secours | AfroTools",
    name: "Couts energie de secours",
    description:
      "Comparez carburant, batterie, onduleur, maintenance et coupures pour une solution de secours.",
    eyebrow: "Energie de secours",
    lead:
      "Estimez le vrai cout mensuel des coupures avant d'acheter generateur, batterie ou systeme hybride.",
    useCase:
      "Utile pour menages, commerces, cybercafes, cliniques, salons, ateliers et petites usines.",
    safety:
      "Confirmez puissance, ventilation, securite electrique et cout carburant avec un technicien local.",
    related:
      "A combiner avec solaire vs generateur, autonomie batterie et cout coupure business.",
    terms: [
      ["Backup Power Costs", "Couts energie de secours"],
      ["Outage", "Coupure"],
      ["Backup", "Secours"],
      ["Inverter", "Onduleur"],
      ["Fuel", "Carburant"],
      ["Battery", "Batterie"],
      ["Runtime", "Autonomie"],
    ],
  },
  {
    enSlug: "electricity-bill-verify",
    frSlug: "verifier-facture-electricite",
    title: "Verificateur facture electricite | AfroTools",
    name: "Verifier facture electricite",
    description:
      "Controlez consommation, tarif, taxes, arrieres et frais pour comprendre une facture electricite.",
    eyebrow: "Factures energie",
    lead:
      "Reperez les ecarts avant de payer, contester ou ajuster vos appareils energivores.",
    useCase:
      "Utile pour foyers, locataires, commerces, proprietaires et gestionnaires de petites installations.",
    safety:
      "Les tarifs officiels changent; utilisez la facture et le bareme de votre distributeur comme reference.",
    related:
      "A utiliser avec tarifs electricite, couts energie de secours et calculateur solaire.",
    terms: [
      ["Electricity Bill Verifier", "Verificateur facture electricite"],
      ["Electricity bill", "Facture electricite"],
      ["Meter reading", "Releve compteur"],
      ["Tariff", "Tarif"],
      ["Arrears", "Arrieres"],
      ["Taxes", "Taxes"],
      ["Consumption", "Consommation"],
    ],
  },
  {
    enSlug: "mobile-vs-bank",
    frSlug: "mobile-money-vs-banque",
    title: "Comparateur mobile money vs banque | AfroTools",
    name: "Mobile money vs banque",
    description:
      "Comparez frais, delai, plafond, accessibilite et cout net entre mobile money et virement bancaire.",
    eyebrow: "Paiements",
    lead:
      "Choisissez le canal le moins couteux pour encaisser, envoyer ou payer un fournisseur.",
    useCase:
      "Utile pour PME, freelances, familles, commercants et associations qui comparent plusieurs canaux.",
    safety:
      "Les frais et plafonds dependent de l'operateur, de la banque et du pays; confirmez avant transaction.",
    related:
      "A combiner avec frais mobile money, paiement B2B transfrontalier et transfert argent.",
    terms: [
      ["Mobile Money vs Bank Transfer", "Mobile money vs virement bancaire"],
      ["Mobile money", "Mobile money"],
      ["Bank transfer", "Virement bancaire"],
      ["Fees", "Frais"],
      ["Limits", "Plafonds"],
      ["Settlement time", "Delai de reglement"],
      ["Net amount", "Montant net"],
    ],
  },
  {
    enSlug: "study-abroad-cost",
    frSlug: "cout-etudes-etranger",
    title: "Calculateur cout etudes a l'etranger | AfroTools",
    name: "Cout etudes a l'etranger",
    description:
      "Estimez frais de scolarite, logement, visa, billet, assurance et reste a financer pour etudier a l'etranger.",
    eyebrow: "Education internationale",
    lead:
      "Construisez un budget complet avant de choisir destination, universite ou demande de bourse.",
    useCase:
      "Utile pour etudiants, parents, conseillers scolaires et candidats a une bourse internationale.",
    safety:
      "Les frais, change, visa et exigences changent; confirmez avec l'universite et les sources officielles.",
    related:
      "A combiner avec bourses gouvernementales, reste a financer bourse et epargne etudes.",
    terms: [
      ["Study Abroad Cost Calculator", "Calculateur cout etudes a l'etranger"],
      ["Tuition", "Frais de scolarite"],
      ["Living costs", "Cout de vie"],
      ["Visa", "Visa"],
      ["Flight", "Billet"],
      ["Scholarship", "Bourse"],
      ["Funding gap", "Reste a financer"],
    ],
  },
  {
    enSlug: "loan-shark-compare",
    frSlug: "pret-usurier-vs-banque",
    title: "Comparateur pret usurier vs banque | AfroTools",
    name: "Pret usurier vs banque",
    description:
      "Comparez cout total, interets, frais et risque entre pret informel, microfinance et banque.",
    eyebrow: "Credit",
    lead:
      "Visualisez le cout reel d'un pret court terme avant de signer ou de renouveler une dette.",
    useCase:
      "Utile pour menages, petites entreprises et emprunteurs qui comparent plusieurs options de financement.",
    safety:
      "Ce calcul ne remplace pas un conseil financier ou juridique; evitez les preteurs non autorises.",
    related:
      "A combiner avec comparaison de pret, consolidation de dettes et score credit.",
    terms: [
      ["Loan Shark vs Bank Rate", "Pret usurier vs banque"],
      ["Loan shark", "Pret usurier"],
      ["Bank", "Banque"],
      ["Interest", "Interets"],
      ["Fees", "Frais"],
      ["Total repayment", "Remboursement total"],
    ],
  },
  {
    enSlug: "staple-basket",
    frSlug: "panier-produits-base",
    title: "Suivi panier produits de base | AfroTools",
    name: "Panier produits de base",
    description:
      "Suivez cout mensuel de riz, farine, huile, legumes, carburant et autres produits essentiels.",
    eyebrow: "Cout de vie",
    lead:
      "Construisez un panier local pour voir comment les prix affectent le budget familial.",
    useCase:
      "Utile pour foyers, journalistes, associations, ecoles et equipes qui surveillent le cout de vie.",
    safety:
      "Les prix doivent etre verifies localement et dates; evitez de les presenter comme statistiques officielles.",
    related:
      "A utiliser avec inflation, budget familial, cout de vie et prix de marche.",
    terms: [
      ["Staple Basket Tracker", "Suivi panier produits de base"],
      ["Staple basket", "Panier de base"],
      ["Rice", "Riz"],
      ["Flour", "Farine"],
      ["Cooking oil", "Huile de cuisson"],
      ["Monthly cost", "Cout mensuel"],
    ],
  },
  {
    enSlug: "nda-generator",
    frSlug: "generateur-nda",
    title: "Generateur NDA Afrique | AfroTools",
    name: "Generateur NDA",
    description:
      "Preparez une base d'accord de confidentialite avec parties, duree, informations et obligations.",
    eyebrow: "Contrats",
    lead:
      "Structurez un NDA avant de partager une idee, un devis, un fichier client ou une proposition.",
    useCase:
      "Utile pour startups, freelances, agences, createurs, fournisseurs et discussions d'investissement.",
    safety:
      "Ce modele doit etre relu par un juriste local avant signature ou usage sensible.",
    related:
      "A combiner avec generateur de contrat, politique de confidentialite et contrat freelance.",
    terms: [
      ["NDA Generator", "Generateur NDA"],
      ["Non-disclosure agreement", "Accord de confidentialite"],
      ["Confidential information", "Informations confidentielles"],
      ["Recipient", "Recepteur"],
      ["Term", "Duree"],
      ["Jurisdiction", "Juridiction"],
    ],
  },
  {
    enSlug: "passport-checklist",
    frSlug: "checklist-passeport",
    title: "Checklist demande passeport | AfroTools",
    name: "Checklist passeport",
    description:
      "Organisez documents, frais, rendez-vous, photos et suivi pour une demande ou renouvellement de passeport.",
    eyebrow: "Documents publics",
    lead:
      "Preparez votre dossier avant de vous rendre au bureau des passeports ou sur le portail officiel.",
    useCase:
      "Utile pour voyageurs, familles, etudiants, travailleurs et diaspora qui veulent eviter les oublis.",
    safety:
      "Les exigences changent par pays; consultez toujours le portail officiel avant paiement.",
    related:
      "A utiliser avec exigences visa, photo passeport et guide carte nationale.",
    terms: [
      ["Passport Application Checklist", "Checklist demande passeport"],
      ["Passport", "Passeport"],
      ["Renewal", "Renouvellement"],
      ["Documents", "Documents"],
      ["Appointment", "Rendez-vous"],
      ["Official portal", "Portail officiel"],
    ],
  },
  {
    enSlug: "company-type-selector",
    frSlug: "choisir-forme-societe",
    title: "Selecteur forme juridique societe | AfroTools",
    name: "Choisir forme societe",
    description:
      "Comparez entreprise individuelle, SARL, Ltd, association ou partenariat selon risque, fiscalite et cout.",
    eyebrow: "Creation d'entreprise",
    lead:
      "Choisissez une structure probable avant d'immatriculer une activite ou de parler a un conseiller.",
    useCase:
      "Utile pour fondateurs, freelances, commerces familiaux, agences et entrepreneurs en expansion.",
    safety:
      "La forme juridique a des consequences fiscales et legales; confirmez avec un professionnel local.",
    related:
      "A combiner avec enregistrement entreprise, licence business et plan d'affaires.",
    terms: [
      ["Company Type Selector", "Selecteur forme juridique societe"],
      ["Sole proprietor", "Entreprise individuelle"],
      ["Limited company", "Societe limitee"],
      ["Partnership", "Partenariat"],
      ["Liability", "Responsabilite"],
      ["Tax", "Fiscalite"],
    ],
  },
  {
    enSlug: "digital-lending",
    frSlug: "taux-credit-digital",
    title: "Comparateur taux credit digital | AfroTools",
    name: "Taux credit digital",
    description:
      "Comparez frais, interets, penalites, delai et cout reel des applications de credit digital.",
    eyebrow: "Fintech",
    lead:
      "Convertissez frais journaliers ou hebdomadaires en cout total avant d'accepter une offre.",
    useCase:
      "Utile pour emprunteurs, commercants et analystes qui comparent banques, fintechs et microcredit.",
    safety:
      "Verifiez l'autorisation du preteur, la confidentialite des donnees et les conditions completes.",
    related:
      "A combiner avec pret usurier vs banque, microfinance et score credit.",
    terms: [
      ["Digital Lending App Rates", "Taux credit digital"],
      ["Digital loan", "Credit digital"],
      ["App fee", "Frais application"],
      ["Penalty", "Penalite"],
      ["APR", "TAEG"],
      ["Repayment", "Remboursement"],
    ],
  },
  {
    enSlug: "fintech-fee-watch",
    frSlug: "suivi-frais-fintech",
    title: "Suivi frais fintech Afrique | AfroTools",
    name: "Suivi frais fintech",
    description:
      "Comparez frais de transfert, retrait, carte, paiement marchand et change entre services financiers.",
    eyebrow: "Fintech",
    lead:
      "Reperez les frais caches avant de choisir une application, un portefeuille ou une passerelle.",
    useCase:
      "Utile pour PME, freelances, createurs, familles et equipes operations qui suivent les couts de paiement.",
    safety:
      "Les frais changent souvent; datez chaque source et verifiez les grilles officielles.",
    related:
      "A utiliser avec mobile money vs banque, frais mobile money et paiement B2B transfrontalier.",
    terms: [
      ["Fintech Fee Watch", "Suivi frais fintech"],
      ["Transfer fee", "Frais de transfert"],
      ["Withdrawal", "Retrait"],
      ["Merchant fee", "Frais marchand"],
      ["Exchange", "Change"],
      ["Net received", "Net recu"],
    ],
  },
  {
    enSlug: "lease-risk-check",
    frSlug: "verification-risque-bail",
    title: "Verification risque bail location | AfroTools",
    name: "Risque bail location",
    description:
      "Passez en revue depot, preavis, reparations, renouvellement, clauses et signaux de risque d'un bail.",
    eyebrow: "Location",
    lead:
      "Identifiez les points a clarifier avant de payer un depot ou de signer un contrat de location.",
    useCase:
      "Utile pour locataires, proprietaires, agents, etudiants et familles qui comparent plusieurs logements.",
    safety:
      "Ce controle n'est pas un avis juridique; demandez conseil local pour un litige ou une signature importante.",
    related:
      "A combiner avec depot location, contrat de location et verification locataire.",
    terms: [
      ["Lease Risk Check", "Verification risque bail"],
      ["Lease", "Bail"],
      ["Deposit", "Depot"],
      ["Notice period", "Preavis"],
      ["Repairs", "Reparations"],
      ["Red flags", "Signaux de risque"],
    ],
  },
  {
    enSlug: "matatu-fare",
    frSlug: "tarif-matatu-danfo",
    title: "Calculateur tarif matatu danfo | AfroTools",
    name: "Tarif matatu danfo",
    description:
      "Estimez prix de trajet en matatu, danfo, trotro ou taxi collectif selon distance et heure.",
    eyebrow: "Transport local",
    lead:
      "Preparez un budget de route locale avant de vous deplacer ou de rembourser une equipe terrain.",
    useCase:
      "Utile pour navetteurs, etudiants, equipes commerciales, voyageurs et organisateurs de terrain.",
    safety:
      "Les tarifs changent selon carburant, pluie, heure de pointe et itineraire; confirmez sur place.",
    related:
      "A utiliser avec tarifs itineraire, tarif VTC et budget voyage.",
    terms: [
      ["Matatu/Danfo Route Fare Calc", "Calculateur tarif matatu danfo"],
      ["Matatu", "Matatu"],
      ["Danfo", "Danfo"],
      ["Trotro", "Trotro"],
      ["Route fare", "Tarif route"],
      ["Peak hour", "Heure de pointe"],
    ],
  },
  {
    enSlug: "startup-runway",
    frSlug: "runway-startup",
    title: "Calculateur runway startup | AfroTools",
    name: "Runway startup",
    description:
      "Calculez mois de tresorerie, burn rate, revenus, embauches et besoin de financement.",
    eyebrow: "Startup",
    lead:
      "Voyez combien de mois il reste avant de lever, reduire les couts ou atteindre le seuil de rentabilite.",
    useCase:
      "Utile pour fondateurs, incubateurs, investisseurs, CFO fractionnels et equipes produits.",
    safety:
      "Les projections sont internes; testez plusieurs scenarios et gardez les hypotheses visibles.",
    related:
      "A combiner avec prevision tresorerie, burn rate et taille de marche TAM/SAM/SOM.",
    terms: [
      ["Startup Runway Calculator", "Calculateur runway startup"],
      ["Runway", "Runway"],
      ["Burn rate", "Burn rate"],
      ["Cash balance", "Tresorerie disponible"],
      ["Monthly revenue", "Revenu mensuel"],
      ["Funding need", "Besoin de financement"],
    ],
  },
  {
    enSlug: "travel-insurance",
    frSlug: "assurance-voyage",
    title: "Estimateur assurance voyage Afrique | AfroTools",
    name: "Assurance voyage",
    description:
      "Comparez couverture, franchise, duree, destination et cout indicatif d'une assurance voyage.",
    eyebrow: "Voyage",
    lead:
      "Preparez un budget assurance avant un voyage, visa, etudes, mission business ou sejour familial.",
    useCase:
      "Utile pour voyageurs, etudiants, familles, equipes terrain et diaspora qui comparent plusieurs couvertures.",
    safety:
      "Lisez toujours les exclusions, plafonds et conditions de remboursement avant achat.",
    related:
      "A combiner avec exigences visa, budget voyage et cout etudes a l'etranger.",
    terms: [
      ["Travel Insurance Estimator", "Estimateur assurance voyage"],
      ["Travel insurance", "Assurance voyage"],
      ["Coverage", "Couverture"],
      ["Deductible", "Franchise"],
      ["Trip duration", "Duree du voyage"],
      ["Claim", "Sinistre"],
    ],
  },
  {
    enSlug: "wholesale-retail-spread",
    frSlug: "marge-gros-detail",
    title: "Calculateur marge gros detail | AfroTools",
    name: "Marge gros detail",
    description:
      "Calculez ecart entre prix de gros, prix detail, transport, pertes et marge nette.",
    eyebrow: "Commerce",
    lead:
      "Voyez si un lot achete en gros reste rentable apres transport, casse, commissions et remise.",
    useCase:
      "Utile pour grossistes, detaillants, vendeurs marche, boutiques et revendeurs en ligne.",
    safety:
      "Les prix doivent etre dates et verifies localement; gardez une marge pour pertes et change.",
    related:
      "A utiliser avec marge beneficiaire, cout livraison et prevision tresorerie.",
    terms: [
      ["Wholesale Retail Spread", "Marge gros detail"],
      ["Wholesale price", "Prix de gros"],
      ["Retail price", "Prix detail"],
      ["Losses", "Pertes"],
      ["Markup", "Marge"],
      ["Net margin", "Marge nette"],
    ],
  },
  {
    enSlug: "microfinance-loan",
    frSlug: "pret-microfinance",
    title: "Calculateur pret microfinance | AfroTools",
    name: "Pret microfinance",
    description:
      "Comparez montant, frais, interets, echeances et cout total d'un pret microfinance.",
    eyebrow: "Microfinance",
    lead:
      "Estimez le remboursement total avant d'accepter une offre de credit groupe ou individuel.",
    useCase:
      "Utile pour entrepreneurs, cooperatives, commercants et menages qui preparent un petit financement.",
    safety:
      "Confirmez taux, frais obligatoires, penalites et assurance credit avec l'institution.",
    related:
      "A combiner avec pret usurier vs banque, taux credit digital et SACCO.",
    terms: [
      ["Microfinance Loan Calculator", "Calculateur pret microfinance"],
      ["Microfinance", "Microfinance"],
      ["Loan amount", "Montant du pret"],
      ["Installment", "Echeance"],
      ["Processing fee", "Frais de dossier"],
      ["Total cost", "Cout total"],
    ],
  },
  {
    enSlug: "national-id-guide",
    frSlug: "guide-carte-identite",
    title: "Guide carte nationale d'identite | AfroTools",
    name: "Guide carte identite",
    description:
      "Organisez documents, frais, rendez-vous et delais pour une demande de carte nationale d'identite.",
    eyebrow: "Documents publics",
    lead:
      "Preparez votre dossier avant de consulter le portail officiel ou le centre d'enrolement.",
    useCase:
      "Utile pour citoyens, parents, etudiants, travailleurs et diaspora qui verifient les pieces requises.",
    safety:
      "Les conditions varient par pays; confirmez toujours les exigences sur le portail officiel.",
    related:
      "A utiliser avec checklist passeport, certificat naissance et exigences visa.",
    terms: [
      ["National ID Registration Guide", "Guide carte nationale d'identite"],
      ["National ID", "Carte nationale"],
      ["Registration", "Enrolement"],
      ["Documents", "Documents"],
      ["Appointment", "Rendez-vous"],
      ["Official portal", "Portail officiel"],
    ],
  },
  {
    enSlug: "payment-gateway",
    frSlug: "comparateur-passerelle-paiement",
    title: "Comparateur passerelle paiement | AfroTools",
    name: "Passerelle paiement",
    description:
      "Comparez frais, delai de reglement, devises, cartes, mobile money et cout net des passerelles.",
    eyebrow: "Paiements business",
    lead:
      "Choisissez une passerelle selon votre panier moyen, pays, canal de vente et devise.",
    useCase:
      "Utile pour e-commerce, SaaS, createurs, ecoles, ONG et PME qui encaissent en ligne.",
    safety:
      "Verifiez frais officiels, litiges, reserve, KYC et disponibilite pays avant integration.",
    related:
      "A combiner avec mobile money vs banque, suivi frais fintech et facture freelance.",
    terms: [
      ["Payment Gateway Fee Compare", "Comparateur frais passerelle paiement"],
      ["Payment gateway", "Passerelle paiement"],
      ["Settlement", "Reglement"],
      ["Card fee", "Frais carte"],
      ["Mobile money", "Mobile money"],
      ["Net payout", "Reversement net"],
    ],
  },
  {
    enSlug: "pension-proj",
    frSlug: "projection-pension-simple",
    title: "Projection pension retraite | AfroTools",
    name: "Projection pension",
    description:
      "Projetez contributions, rendement, inflation et revenu mensuel possible a la retraite.",
    eyebrow: "Retraite",
    lead:
      "Estimez si votre epargne retraite suit votre objectif avant d'ajuster contribution ou age de depart.",
    useCase:
      "Utile pour salaries, independants, employeurs et familles qui planifient un revenu futur.",
    safety:
      "Les rendements ne sont pas garantis; comparez avec les regles officielles de votre regime.",
    related:
      "A utiliser avec retraite, epargne objectif et rendement reel apres inflation.",
    terms: [
      ["Pension Projection Calculator", "Calculateur projection pension"],
      ["Pension", "Pension"],
      ["Contribution", "Contribution"],
      ["Retirement age", "Age de retraite"],
      ["Inflation", "Inflation"],
      ["Monthly income", "Revenu mensuel"],
    ],
  },
  {
    enSlug: "university-admission",
    frSlug: "parcours-admission-universite",
    title: "Planificateur admission universite | AfroTools",
    name: "Admission universite",
    description:
      "Structurez notes, exigences, documents, delais et options pour une admission universitaire.",
    eyebrow: "Education",
    lead:
      "Transformez une liste d'universites en checklist claire avec exigences et prochaines actions.",
    useCase:
      "Utile pour lyceens, etudiants, parents, conseillers et candidats internationaux.",
    safety:
      "Confirmez toujours les conditions d'admission, frais et dates sur le site de l'universite.",
    related:
      "A combiner avec cout etudes a l'etranger, bourses gouvernementales et epargne etudes.",
    terms: [
      ["University Admission Pathway Finder", "Planificateur admission universite"],
      ["Admission", "Admission"],
      ["Entry requirements", "Conditions d'entree"],
      ["Deadline", "Date limite"],
      ["Documents", "Documents"],
      ["Application fee", "Frais de dossier"],
    ],
  },
  {
    enSlug: "car-loan-vs-cash",
    frSlug: "voiture-credit-vs-comptant",
    title: "Comparateur voiture credit vs comptant | AfroTools",
    name: "Voiture credit vs comptant",
    description:
      "Comparez achat comptant, credit auto, interets, assurance, depreciation et tresorerie restante.",
    eyebrow: "Auto",
    lead:
      "Voyez le cout total d'une voiture selon financement, apport, duree et valeur de revente.",
    useCase:
      "Utile pour acheteurs, familles, chauffeurs, petites flottes et revendeurs qui comparent des options.",
    safety:
      "Les taux, frais et assurance varient; confirmez l'offre avec la banque ou le concessionnaire.",
    related:
      "A utiliser avec pret automobile, cout importation voiture et depreciation vehicule.",
    terms: [
      ["Car Loan vs Cash Purchase", "Voiture credit vs comptant"],
      ["Cash purchase", "Achat comptant"],
      ["Car loan", "Credit auto"],
      ["Down payment", "Apport"],
      ["Depreciation", "Depreciation"],
      ["Total cost", "Cout total"],
    ],
  },
  {
    enSlug: "motor-third-party",
    frSlug: "prime-responsabilite-auto",
    title: "Estimateur prime responsabilite auto | AfroTools",
    name: "Responsabilite auto",
    description:
      "Estimez prime d'assurance auto obligatoire selon vehicule, usage, pays et niveau de risque.",
    eyebrow: "Assurance auto",
    lead:
      "Preparez une fourchette avant de demander un devis ou renouveler une police.",
    useCase:
      "Utile pour proprietaires, chauffeurs, flottes, motos, taxis et petites entreprises.",
    safety:
      "Les primes et garanties obligatoires dependent du pays; demandez un devis officiel.",
    related:
      "A combiner avec assurance auto, cout importation voiture et depreciation vehicule.",
    terms: [
      ["Motor Third-Party Premium", "Prime responsabilite auto"],
      ["Third-party", "Responsabilite civile"],
      ["Premium", "Prime"],
      ["Vehicle type", "Type de vehicule"],
      ["Usage", "Usage"],
      ["Quote", "Devis"],
    ],
  },
  {
    enSlug: "nysc-allowance",
    frSlug: "allocation-nysc",
    title: "Calculateur allocation NYSC | AfroTools",
    name: "Allocation NYSC",
    description:
      "Estimez allocation, transport, logement, repas et reste disponible pendant le service NYSC.",
    eyebrow: "Education Nigeria",
    lead:
      "Preparez un budget mensuel pour service, camp, affectation et depenses quotidiennes.",
    useCase:
      "Utile pour corps members, parents et etudiants qui planifient le service national au Nigeria.",
    safety:
      "Verifiez les montants officiels et avantages locaux avant de prendre une decision financiere.",
    related:
      "A combiner avec budget etudiant, cout de vie et planificateur budget.",
    terms: [
      ["NYSC Allowance Calculator", "Calculateur allocation NYSC"],
      ["Allowance", "Allocation"],
      ["Transport", "Transport"],
      ["Accommodation", "Logement"],
      ["Food", "Repas"],
      ["Monthly budget", "Budget mensuel"],
    ],
  },
  {
    enSlug: "overtime-calc",
    frSlug: "calculateur-heures-supplementaires",
    title: "Calculateur heures supplementaires | AfroTools",
    name: "Heures supplementaires",
    description:
      "Calculez salaire horaire, majoration, heures supplementaires et paiement brut indicatif.",
    eyebrow: "Paie",
    lead:
      "Verifiez une estimation avant de comparer bulletin, contrat ou politique interne.",
    useCase:
      "Utile pour salaries, RH, managers, freelances et petites entreprises qui suivent les heures.",
    safety:
      "Les taux de majoration dependent du droit local et du contrat; confirmez avant reclamation.",
    related:
      "A utiliser avec salaire net, jours conge, cout employeur et bulletin de paie.",
    terms: [
      ["Overtime Calculator", "Calculateur heures supplementaires"],
      ["Overtime", "Heures supplementaires"],
      ["Hourly rate", "Taux horaire"],
      ["Multiplier", "Majoration"],
      ["Gross pay", "Salaire brut"],
      ["Timesheet", "Feuille d'heures"],
    ],
  },
  {
    enSlug: "sacco-calc",
    frSlug: "calculateur-sacco-cooperative",
    title: "Calculateur SACCO cooperative | AfroTools",
    name: "SACCO cooperative",
    description:
      "Estimez parts, epargne, dividendes, pret disponible et contribution dans une cooperative.",
    eyebrow: "Cooperative",
    lead:
      "Comparez contribution mensuelle, rendement et capacite d'emprunt avant d'adherer a une SACCO.",
    useCase:
      "Utile pour membres SACCO, tontines, cooperatives, groupes d'epargne et petites entreprises.",
    safety:
      "Les regles, frais et dividendes varient; confirmez avec les statuts et rapports de la cooperative.",
    related:
      "A combiner avec pret microfinance, epargne objectif et suivi tontine.",
    terms: [
      ["SACCO/Credit Union Calculator", "Calculateur SACCO cooperative"],
      ["SACCO", "SACCO"],
      ["Shares", "Parts"],
      ["Savings", "Epargne"],
      ["Dividend", "Dividende"],
      ["Loan eligibility", "Eligibilite pret"],
    ],
  },
  {
    enSlug: "student-budget",
    frSlug: "budget-etudiant",
    title: "Planificateur budget etudiant | AfroTools",
    name: "Budget etudiant",
    description:
      "Planifiez frais, loyer, transport, repas, data, livres et reste a financer pour etudiants.",
    eyebrow: "Vie etudiante",
    lead:
      "Construisez un budget mensuel simple avant de choisir campus, logement ou job etudiant.",
    useCase:
      "Utile pour etudiants, parents, boursiers, conseillers et candidats a l'universite.",
    safety:
      "Les prix changent selon ville, campus et saison; gardez une marge d'urgence.",
    related:
      "A combiner avec admission universite, cout etudes a l'etranger et epargne etudes.",
    terms: [
      ["Student Budget Planner", "Planificateur budget etudiant"],
      ["Student budget", "Budget etudiant"],
      ["Tuition", "Frais de scolarite"],
      ["Rent", "Loyer"],
      ["Books", "Livres"],
      ["Funding gap", "Reste a financer"],
    ],
  },
  {
    enSlug: "tbill-calc",
    frSlug: "rendement-bons-tresor",
    title: "Calculateur rendement bons du tresor | AfroTools",
    name: "Rendement bons du tresor",
    description:
      "Calculez prix, escompte, rendement annualise et montant a l'echeance d'un bon du tresor.",
    eyebrow: "Placement",
    lead:
      "Comparez un bon du tresor avec depot a terme, obligations ou epargne en gardant le rendement clair.",
    useCase:
      "Utile pour epargnants, tresoriers PME, clubs d'investissement et analystes financiers.",
    safety:
      "Les rendements et taxes changent; verifiez les adjudications et conditions officielles.",
    related:
      "A utiliser avec depot terme, rendement obligations et rendement reel apres inflation.",
    terms: [
      ["Treasury Bill Yield Calculator", "Calculateur rendement bons du tresor"],
      ["Treasury bill", "Bon du tresor"],
      ["Discount", "Escompte"],
      ["Maturity", "Echeance"],
      ["Yield", "Rendement"],
      ["Face value", "Valeur nominale"],
    ],
  },
  {
    enSlug: "water-bill",
    frSlug: "calculateur-facture-eau",
    title: "Calculateur facture eau | AfroTools",
    name: "Facture eau",
    description:
      "Estimez consommation, tranche tarifaire, taxes, arrieres et cout mensuel d'une facture d'eau.",
    eyebrow: "Services publics",
    lead:
      "Comprenez une facture d'eau avant de payer, contester ou ajuster votre consommation.",
    useCase:
      "Utile pour foyers, locataires, proprietaires, commerces et gestionnaires de petites installations.",
    safety:
      "Les tarifs officiels varient par ville et operateur; utilisez votre releve et le bareme local.",
    related:
      "A combiner avec facture electricite, consommation eau et plan arrieres services.",
    terms: [
      ["Water Bill Calculator", "Calculateur facture eau"],
      ["Water bill", "Facture eau"],
      ["Meter reading", "Releve compteur"],
      ["Tariff block", "Tranche tarifaire"],
      ["Arrears", "Arrieres"],
      ["Consumption", "Consommation"],
    ],
  },
  {
    enSlug: "social-welfare",
    frSlug: "eligibilite-aide-sociale",
    title: "Verificateur eligibilite aide sociale | AfroTools",
    name: "Eligibilite aide sociale",
    description:
      "Preparez une verification d'eligibilite pour aides sociales, subventions, pensions ou programmes publics.",
    eyebrow: "Services publics",
    lead:
      "Organisez situation, revenus, menage, documents et prochaine etape avant de consulter le portail officiel.",
    useCase:
      "Utile pour familles, travailleurs sociaux, associations et usagers qui preparent une demande.",
    safety:
      "Les criteres changent selon pays, programme et date; confirmez toujours avec l'administration competente.",
    related:
      "A combiner avec carte identite, certificat naissance et portail officiel du programme.",
    terms: [
      ["Social Welfare Eligibility Checker", "Verificateur eligibilite aide sociale"],
      ["Eligibility", "Eligibilite"],
      ["Household", "Menage"],
      ["Income", "Revenu"],
      ["Documents", "Documents"],
      ["Application", "Demande"],
    ],
  },
  {
    enSlug: "marriage-cert",
    frSlug: "guide-certificat-mariage",
    title: "Guide certificat de mariage | AfroTools",
    name: "Certificat de mariage",
    description:
      "Organisez documents, frais, rendez-vous, temoins et delais pour un certificat ou acte de mariage.",
    eyebrow: "Documents civils",
    lead:
      "Preparez votre dossier avant de vous rendre a l'etat civil ou sur le portail officiel.",
    useCase:
      "Utile pour couples, familles, diaspora et assistants administratifs qui verifient les pieces requises.",
    safety:
      "Les exigences varient selon pays, commune et type de mariage; confirmez avec l'etat civil.",
    related:
      "A utiliser avec certificat naissance, carte identite et checklist passeport.",
    terms: [
      ["Marriage Certificate Guide", "Guide certificat de mariage"],
      ["Marriage certificate", "Certificat de mariage"],
      ["Civil registry", "Etat civil"],
      ["Witnesses", "Temoins"],
      ["Appointment", "Rendez-vous"],
      ["Official copy", "Copie officielle"],
    ],
  },
  {
    enSlug: "outage-cost",
    frSlug: "cout-coupure-entreprise",
    title: "Calculateur cout coupure entreprise | AfroTools",
    name: "Cout coupure entreprise",
    description:
      "Estimez pertes de ventes, carburant, personnel, stock et productivite pendant une coupure.",
    eyebrow: "Energie business",
    lead:
      "Transformez une panne d'electricite en cout horaire pour justifier batterie, generateur ou solaire.",
    useCase:
      "Utile pour commerces, ateliers, cliniques, cybercafes, restaurants et petites usines.",
    safety:
      "Les pertes sont des estimations internes; comparez-les avec vos registres et factures.",
    related:
      "A combiner avec couts energie de secours, solaire vs generateur et facture electricite.",
    terms: [
      ["Outage Cost", "Cout coupure"],
      ["Power outage", "Coupure electricite"],
      ["Lost sales", "Ventes perdues"],
      ["Generator fuel", "Carburant generateur"],
      ["Downtime", "Temps d'arret"],
      ["Productivity", "Productivite"],
    ],
  },
  {
    enSlug: "student-loan-repay",
    frSlug: "remboursement-pret-etudiant",
    title: "Calculateur remboursement pret etudiant | AfroTools",
    name: "Remboursement pret etudiant",
    description:
      "Estimez mensualite, interets, duree et cout total d'un pret etudiant.",
    eyebrow: "Financement etudes",
    lead:
      "Comparez plusieurs plans de remboursement avant de choisir une duree ou un montant mensuel.",
    useCase:
      "Utile pour etudiants, jeunes diplomes, parents et conseillers qui planifient la sortie d'etudes.",
    safety:
      "Les conditions dependent du preteur et du pays; verifiez taux, grace period et penalites.",
    related:
      "A combiner avec budget etudiant, cout etudes a l'etranger et epargne etudes.",
    terms: [
      ["Student Loan Repayment Calculator", "Calculateur remboursement pret etudiant"],
      ["Student loan", "Pret etudiant"],
      ["Monthly payment", "Mensualite"],
      ["Grace period", "Periode de grace"],
      ["Interest", "Interets"],
      ["Total repayment", "Remboursement total"],
    ],
  },
  {
    enSlug: "paygo-solar",
    frSlug: "solaire-paygo",
    title: "Calculateur solaire PayGo | AfroTools",
    name: "Solaire PayGo",
    description:
      "Comparez acompte, paiement journalier, duree, maintenance et cout total d'un systeme solaire PayGo.",
    eyebrow: "Energie solaire",
    lead:
      "Voyez si le paiement a l'usage reste moins cher qu'un generateur, une batterie ou le reseau.",
    useCase:
      "Utile pour foyers, kiosques, petites boutiques, ecoles et installateurs qui comparent des offres.",
    safety:
      "Verifiez contrat, garantie, verrouillage appareil, service apres-vente et penalites.",
    related:
      "A combiner avec solaire vs generateur, ROI solaire et dimensionnement batterie.",
    terms: [
      ["PayGo Solar Calculator", "Calculateur solaire PayGo"],
      ["PayGo solar", "Solaire PayGo"],
      ["Deposit", "Acompte"],
      ["Daily payment", "Paiement journalier"],
      ["Ownership", "Propriete"],
      ["Maintenance", "Maintenance"],
    ],
  },
  {
    enSlug: "real-return",
    frSlug: "rendement-reel-inflation",
    title: "Calculateur rendement reel apres inflation | AfroTools",
    name: "Rendement reel",
    description:
      "Calculez rendement apres inflation, frais et taxes pour comprendre le gain reel d'un placement.",
    eyebrow: "Investissement",
    lead:
      "Comparez un placement avec l'inflation locale avant de juger sa performance.",
    useCase:
      "Utile pour epargnants, clubs d'investissement, tresoriers PME et analystes.",
    safety:
      "Les donnees d'inflation et de rendement doivent etre datees; ce n'est pas un conseil financier.",
    related:
      "A combiner avec depot terme, bons du tresor et rendement obligations.",
    terms: [
      ["Real Return After Inflation", "Rendement reel apres inflation"],
      ["Nominal return", "Rendement nominal"],
      ["Inflation", "Inflation"],
      ["Fees", "Frais"],
      ["Tax", "Taxe"],
      ["Real return", "Rendement reel"],
    ],
  },
  {
    enSlug: "tam-sam-som",
    frSlug: "taille-marche-tam-sam-som",
    title: "Calculateur taille marche TAM SAM SOM | AfroTools",
    name: "Taille marche TAM SAM SOM",
    description:
      "Estimez marche total, marche servi, marche accessible et hypotheses pour un projet africain.",
    eyebrow: "Startup",
    lead:
      "Structurez une estimation de marche avant pitch, business plan ou decision produit.",
    useCase:
      "Utile pour fondateurs, incubateurs, etudiants, investisseurs et equipes marketing.",
    safety:
      "Les chiffres doivent etre justifies par sources et hypotheses; evitez les tailles de marche inventees.",
    related:
      "A combiner avec runway startup, unite economique et plan d'affaires.",
    terms: [
      ["TAM/SAM/SOM Market Size Calculator", "Calculateur taille marche TAM SAM SOM"],
      ["TAM", "TAM"],
      ["SAM", "SAM"],
      ["SOM", "SOM"],
      ["Market size", "Taille marche"],
      ["Assumptions", "Hypotheses"],
    ],
  },
  {
    enSlug: "voter-registration",
    frSlug: "guide-inscription-electorale",
    title: "Guide inscription electorale | AfroTools",
    name: "Inscription electorale",
    description:
      "Preparez documents, lieu d'inscription, statut, delais et verification d'une inscription electorale.",
    eyebrow: "Civique",
    lead:
      "Organisez les etapes avant de consulter la commission electorale ou le portail officiel.",
    useCase:
      "Utile pour citoyens, primo-votants, diaspora, associations civiques et journalistes.",
    safety:
      "Les calendriers electoraux changent; verifiez toujours la commission electorale officielle.",
    related:
      "A utiliser avec carte identite, certificat naissance et guide services publics.",
    terms: [
      ["Voter Registration Guide", "Guide inscription electorale"],
      ["Voter registration", "Inscription electorale"],
      ["Polling station", "Bureau de vote"],
      ["Election commission", "Commission electorale"],
      ["Deadline", "Date limite"],
      ["Status check", "Verification statut"],
    ],
  },
  {
    enSlug: "vehicle-registration",
    frSlug: "checklist-immatriculation-vehicule",
    title: "Checklist immatriculation vehicule | AfroTools",
    name: "Immatriculation vehicule",
    description:
      "Organisez documents, frais, inspection, assurance et plaques pour immatriculer un vehicule.",
    eyebrow: "Transport",
    lead:
      "Preparez le dossier d'un vehicule neuf, importe ou d'occasion avant la visite administrative.",
    useCase:
      "Utile pour acheteurs, importateurs, chauffeurs, flottes et revendeurs automobiles.",
    safety:
      "Les exigences varient selon pays et type de vehicule; verifiez avec l'autorite routiere.",
    related:
      "A combiner avec cout importation voiture, responsabilite auto et roadworthiness.",
    terms: [
      ["Vehicle Import Checklist", "Checklist immatriculation vehicule"],
      ["Vehicle registration", "Immatriculation vehicule"],
      ["Inspection", "Inspection"],
      ["Insurance", "Assurance"],
      ["Number plates", "Plaques"],
      ["Road authority", "Autorite routiere"],
    ],
  },
  {
    enSlug: "unit-economics",
    frSlug: "economie-unitaire",
    title: "Calculateur economie unitaire | AfroTools",
    name: "Economie unitaire",
    description:
      "Calculez revenu par unite, cout variable, marge de contribution, CAC et LTV.",
    eyebrow: "Business model",
    lead:
      "Comprenez si chaque vente contribue vraiment aux couts fixes et a la croissance.",
    useCase:
      "Utile pour startups, e-commerce, SaaS, services, createurs et PME qui testent un modele.",
    safety:
      "Les resultats dependent des hypotheses; comparez avec ventes reelles et couts comptables.",
    related:
      "A combiner avec runway startup, marge beneficiaire et taille marche TAM SAM SOM.",
    terms: [
      ["Unit Economics Calculator", "Calculateur economie unitaire"],
      ["Unit economics", "Economie unitaire"],
      ["Contribution margin", "Marge de contribution"],
      ["CAC", "CAC"],
      ["LTV", "LTV"],
      ["Variable cost", "Cout variable"],
    ],
  },
  {
    enSlug: "pdf-editor",
    frSlug: "editeur-pdf",
    title: "Editeur PDF en ligne | AfroTools",
    name: "Editeur PDF",
    description:
      "Modifiez, annotez, organisez et preparez un PDF avec une interface francaise locale.",
    eyebrow: "Documents PDF",
    lead:
      "Travaillez sur un document PDF avant partage, impression, signature ou archivage.",
    useCase:
      "Utile pour formulaires, dossiers administratifs, contrats, devoirs et pieces justificatives.",
    safety:
      "Verifiez toujours le fichier final avant depot officiel; gardez une copie originale.",
    related:
      "A combiner avec espace PDF, fusion PDF, compression PDF et signature PDF.",
    terms: [
      ["PDF Editor", "Editeur PDF"],
      ["Edit PDF", "Modifier le PDF"],
      ["Annotate", "Annoter"],
      ["Pages", "Pages"],
      ["Save PDF", "Enregistrer le PDF"],
      ["Upload PDF", "Televerser un PDF"],
    ],
  },
  {
    enSlug: "pdf-workspace",
    frSlug: "espace-pdf",
    title: "Espace de travail PDF | AfroTools",
    name: "Espace PDF",
    description:
      "Regroupez plusieurs actions PDF dans un espace de travail francais pour documents et formulaires.",
    eyebrow: "Documents PDF",
    lead:
      "Organisez les fichiers, choisissez les actions et gardez un flux clair pour vos documents.",
    useCase:
      "Utile pour traiter plusieurs PDF avant un dossier d'etudes, visa, travail ou entreprise.",
    safety:
      "Controlez les pages, noms de fichiers et donnees sensibles avant export ou partage.",
    related:
      "A utiliser avec editeur PDF, fusion PDF, compression PDF et OCR PDF.",
    terms: [
      ["PDF Workspace", "Espace PDF"],
      ["Workspace", "Espace de travail"],
      ["Files", "Fichiers"],
      ["Workflow", "Flux de travail"],
      ["Export", "Exporter"],
      ["Batch", "Lot"],
    ],
  },
  {
    enSlug: "childbirth-cost",
    frSlug: "cout-accouchement",
    title: "Calculateur cout accouchement | AfroTools",
    name: "Cout accouchement",
    description:
      "Estimez consultation, hopital, medicaments, transport et marge de securite pour un accouchement.",
    eyebrow: "Sante familiale",
    lead:
      "Preparez un budget prudent pour les depenses avant, pendant et apres la naissance.",
    useCase:
      "Utile pour familles, cliniques, travailleurs sociaux et accompagnants qui planifient les couts.",
    safety:
      "Ce calcul ne remplace pas un avis medical; confirmez les soins, risques et tarifs avec un professionnel.",
    related:
      "A combiner avec budget maternite, assurance sante et reste a charge medical.",
    terms: [
      ["Childbirth Cost Calculator", "Calculateur cout accouchement"],
      ["Hospital", "Hopital"],
      ["Clinic", "Clinique"],
      ["Medication", "Medicaments"],
      ["Transport", "Transport"],
      ["Emergency buffer", "Marge d'urgence"],
    ],
  },
  {
    enSlug: "drug-price-compare",
    frSlug: "comparateur-prix-medicaments",
    title: "Comparateur prix medicaments | AfroTools",
    name: "Prix medicaments",
    description:
      "Comparez prix, presentation, quantite et budget indicatif pour des medicaments ou produits de pharmacie.",
    eyebrow: "Budget sante",
    lead:
      "Preparez une comparaison de prix avant de contacter une pharmacie ou une clinique.",
    useCase:
      "Utile pour foyers, soignants, associations et patients qui veulent anticiper un budget.",
    safety:
      "N'utilisez pas cette page pour choisir un traitement; demandez conseil a un professionnel de sante.",
    related:
      "A combiner avec prix pharmacie, cout clinique et reste sante assurance.",
    terms: [
      ["Drug/Medicine Price Comparator", "Comparateur prix medicaments"],
      ["Medicine", "Medicament"],
      ["Pharmacy", "Pharmacie"],
      ["Dosage", "Dosage"],
      ["Quantity", "Quantite"],
      ["Compare prices", "Comparer les prix"],
    ],
  },
  {
    enSlug: "csection-vs-natural",
    frSlug: "cout-cesarienne-voie-basse",
    title: "Cout cesarienne vs voie basse | AfroTools",
    name: "Cesarienne vs voie basse",
    description:
      "Comparez couts indicatifs, sejour, transport et marge d'urgence pour deux scenarios d'accouchement.",
    eyebrow: "Sante maternelle",
    lead:
      "Structurez un budget de preparation sans transformer le choix medical en simple comparaison de prix.",
    useCase:
      "Utile pour familles et accompagnants qui veulent prevoir plusieurs scenarios de depenses.",
    safety:
      "La decision clinique appartient aux professionnels de sante; cette page sert uniquement au budget.",
    related:
      "A utiliser avec cout accouchement, budget maternite et assurance sante.",
    terms: [
      ["C-Section vs Natural Birth Cost", "Cout cesarienne vs voie basse"],
      ["C-section", "Cesarienne"],
      ["Natural birth", "Voie basse"],
      ["Stay", "Sejour"],
      ["Doctor fee", "Honoraires"],
      ["Emergency", "Urgence"],
    ],
  },
  {
    enSlug: "rent-intelligence",
    frSlug: "intelligence-loyer",
    title: "Intelligence loyer et marche locatif | AfroTools",
    name: "Intelligence loyer",
    description:
      "Comparez loyer, quartier, surface, charges et signaux de marche pour une decision locative.",
    eyebrow: "Logement",
    lead:
      "Organisez les donnees de comparaison avant negociation, renouvellement ou recherche de logement.",
    useCase:
      "Utile pour locataires, proprietaires, agents et gestionnaires qui comparent plusieurs offres.",
    safety:
      "Les prix changent vite; confirmez avec visites, annonces recentes et conditions du bail.",
    related:
      "A combiner avec loyer abordable, verification bail et verification locataire.",
    terms: [
      ["Rent Intelligence", "Intelligence loyer"],
      ["Rent", "Loyer"],
      ["Neighborhood", "Quartier"],
      ["Comparable", "Comparable"],
      ["Lease", "Bail"],
      ["Market signal", "Signal de marche"],
    ],
  },
  {
    enSlug: "privacy-policy-gen",
    frSlug: "generateur-politique-confidentialite",
    title: "Generateur politique de confidentialite | AfroTools",
    name: "Politique de confidentialite",
    description:
      "Preparez une base de politique de confidentialite pour site, application ou service africain.",
    eyebrow: "Conformite donnees",
    lead:
      "Structurez collecte, finalites, droits, conservation et contacts avant revue juridique.",
    useCase:
      "Utile pour fondateurs, freelances, ONG et PME qui documentent leurs pratiques de donnees.",
    safety:
      "Ce modele n'est pas un avis juridique; faites valider les obligations locales applicables.",
    related:
      "A utiliser avec POPIA, NDPA, DPA Kenya et outils de conformite donnees.",
    terms: [
      ["Privacy Policy Generator", "Generateur politique de confidentialite"],
      ["Privacy policy", "Politique de confidentialite"],
      ["Personal data", "Donnees personnelles"],
      ["Retention", "Conservation"],
      ["User rights", "Droits utilisateur"],
      ["Controller", "Responsable de traitement"],
    ],
  },
  {
    enSlug: "rental-agreement",
    frSlug: "contrat-location",
    title: "Generateur contrat de location | AfroTools",
    name: "Contrat de location",
    description:
      "Preparez clauses, loyer, depot, duree et obligations pour un bail ou contrat de location.",
    eyebrow: "Logement legal",
    lead:
      "Rassemblez les informations essentielles avant signature, revue ou adaptation locale.",
    useCase:
      "Utile pour proprietaires, locataires, agents et petites agences immobilieres.",
    safety:
      "Le modele doit etre adapte au droit local; demandez une revue juridique pour les cas sensibles.",
    related:
      "A combiner avec verification bail, depot de location et loyer abordable.",
    terms: [
      ["Rental Agreement Generator", "Generateur contrat de location"],
      ["Rental agreement", "Contrat de location"],
      ["Tenant", "Locataire"],
      ["Landlord", "Proprietaire"],
      ["Deposit", "Depot"],
      ["Term", "Duree"],
    ],
  },
  {
    enSlug: "dental-cost",
    frSlug: "cout-soins-dentaires",
    title: "Estimateur cout soins dentaires | AfroTools",
    name: "Cout soins dentaires",
    description:
      "Estimez consultation, traitement, radios, medicaments et suivi pour des soins dentaires.",
    eyebrow: "Budget sante",
    lead:
      "Preparez un budget de soins avant devis clinique ou comparaison de prestataires.",
    useCase:
      "Utile pour familles, patients et cliniques qui veulent cadrer les couts avant rendez-vous.",
    safety:
      "Le diagnostic et le plan de traitement doivent venir d'un dentiste qualifie.",
    related:
      "A combiner avec cout clinique, assurance sante et prix medicaments.",
    terms: [
      ["Dental Procedure Cost Estimator", "Estimateur cout soins dentaires"],
      ["Dental", "Dentaire"],
      ["Procedure", "Soin"],
      ["X-ray", "Radio"],
      ["Follow-up", "Suivi"],
      ["Quote", "Devis"],
    ],
  },
  {
    enSlug: "pharmacy-prices",
    frSlug: "prix-pharmacie",
    title: "Prix pharmacie et budget medicaments | AfroTools",
    name: "Prix pharmacie",
    description:
      "Organisez prix, quantites, alternatives et budget pour achats en pharmacie.",
    eyebrow: "Sante et pharmacie",
    lead:
      "Comparez un panier de pharmacie avant achat, remboursement ou demande d'aide.",
    useCase:
      "Utile pour menages, patients chroniques, aidants et associations de terrain.",
    safety:
      "Ne remplacez pas une prescription sans avis medical; confirmez disponibilite et dosage.",
    related:
      "A utiliser avec comparateur prix medicaments, cout clinique et assurance sante.",
    terms: [
      ["Pharmacy Prices", "Prix pharmacie"],
      ["Pharmacy", "Pharmacie"],
      ["Medicine basket", "Panier medicaments"],
      ["Generic", "Generique"],
      ["Brand", "Marque"],
      ["Total cost", "Cout total"],
    ],
  },
  {
    enSlug: "africa-election-tracker",
    frSlug: "suivi-elections-afrique",
    title: "Suivi elections Afrique | AfroTools",
    name: "Suivi elections Afrique",
    description:
      "Organisez pays, date, statut, source officielle et prochaine etape pour les elections africaines.",
    eyebrow: "Civique",
    lead:
      "Gardez une vue claire des scrutins, calendriers et liens officiels a verifier.",
    useCase:
      "Utile pour citoyens, journalistes, ONG, chercheurs et equipes civiques.",
    safety:
      "Les dates peuvent changer; confirmez toujours avec la commission electorale officielle.",
    related:
      "A combiner avec guide inscription electorale, carte identite et guides gouvernementaux.",
    terms: [
      ["Africa Election Tracker", "Suivi elections Afrique"],
      ["Election", "Election"],
      ["Commission", "Commission"],
      ["Deadline", "Date limite"],
      ["Polling", "Vote"],
      ["Official source", "Source officielle"],
    ],
  },
  {
    enSlug: "clinic-costs",
    frSlug: "couts-clinique",
    title: "Estimateur couts clinique | AfroTools",
    name: "Couts clinique",
    description:
      "Estimez consultation, examens, medicaments, transport et reste a charge pour une visite clinique.",
    eyebrow: "Budget sante",
    lead:
      "Preparez un budget de visite medicale avec marge pour examens ou medicaments.",
    useCase:
      "Utile pour familles, patients, aidants et programmes communautaires.",
    safety:
      "Cette estimation ne remplace pas un diagnostic, un devis medical ou une urgence.",
    related:
      "A combiner avec prix pharmacie, assurance sante et reste sante assurance.",
    terms: [
      ["Clinic Costs", "Couts clinique"],
      ["Consultation", "Consultation"],
      ["Lab tests", "Examens"],
      ["Medicine", "Medicament"],
      ["Co-pay", "Reste a charge"],
      ["Visit", "Visite"],
    ],
  },
  {
    enSlug: "pdf-workflow",
    frSlug: "flux-pdf",
    title: "Constructeur de flux PDF | AfroTools",
    name: "Flux PDF",
    description:
      "Planifiez une sequence d'actions PDF pour preparer, nettoyer, signer ou exporter des documents.",
    eyebrow: "Documents PDF",
    lead:
      "Choisissez l'ordre des operations pour transformer un lot de PDF sans perdre le fil.",
    useCase:
      "Utile pour dossiers administratifs, candidatures, contrats et archivage de documents.",
    safety:
      "Verifiez l'ordre des pages et les donnees sensibles avant de finaliser le fichier.",
    related:
      "A utiliser avec espace PDF, editeur PDF, compression PDF et fusion PDF.",
    terms: [
      ["PDF Workflow Builder", "Constructeur de flux PDF"],
      ["Workflow", "Flux de travail"],
      ["Step", "Etape"],
      ["Merge", "Fusionner"],
      ["Compress", "Compresser"],
      ["Sign", "Signer"],
    ],
  },
  {
    enSlug: "will-generator",
    frSlug: "generateur-testament",
    title: "Generateur de testament | AfroTools",
    name: "Generateur testament",
    description:
      "Preparez une trame de testament avec beneficiaires, biens, executeur et notes de verification.",
    eyebrow: "Documents legaux",
    lead:
      "Organisez les informations principales avant conseil juridique, temoins ou formalisation locale.",
    useCase:
      "Utile pour familles, conseillers et particuliers qui veulent preparer une discussion juridique.",
    safety:
      "Les exigences de validite changent selon pays; faites verifier le document par un professionnel.",
    related:
      "A combiner avec procuration, affidavit et generateur de contrat.",
    terms: [
      ["Will / Testament Generator", "Generateur de testament"],
      ["Will", "Testament"],
      ["Beneficiary", "Beneficiaire"],
      ["Executor", "Executeur"],
      ["Assets", "Biens"],
      ["Witness", "Temoin"],
    ],
  },
  {
    enSlug: "zakat-calculator",
    frSlug: "calculateur-zakat",
    title: "Calculateur zakat | AfroTools",
    name: "Calculateur zakat",
    description:
      "Estimez zakat sur epargne, or, commerce et actifs avec hypotheses clairement separees.",
    eyebrow: "Finance islamique",
    lead:
      "Regroupez actifs eligibles, dettes et seuils avant consultation religieuse ou paiement.",
    useCase:
      "Utile pour foyers, commercants, etudiants et associations qui preparent une estimation.",
    safety:
      "Les interpretations varient; confirmez les regles avec une autorite religieuse qualifiee.",
    related:
      "A combiner avec finance islamique, budget personnel et convertisseur de devises.",
    terms: [
      ["Zakat Calculator", "Calculateur zakat"],
      ["Zakat", "Zakat"],
      ["Nisab", "Nisab"],
      ["Gold", "Or"],
      ["Savings", "Epargne"],
      ["Eligible assets", "Actifs eligibles"],
    ],
  },
  {
    enSlug: "child-support",
    frSlug: "pension-alimentaire-enfant",
    title: "Estimateur pension alimentaire enfant | AfroTools",
    name: "Pension alimentaire enfant",
    description:
      "Estimez revenus, charges, garde, besoins de l'enfant et scenario de contribution.",
    eyebrow: "Famille legal",
    lead:
      "Structurez les informations avant mediation, discussion familiale ou conseil juridique.",
    useCase:
      "Utile pour parents, mediateurs, travailleurs sociaux et conseillers communautaires.",
    safety:
      "Les montants officiels dependent du droit local et d'une decision competente.",
    related:
      "A combiner avec cout scolarite, budget enfant et documents familiaux.",
    terms: [
      ["Child Support Calculator", "Estimateur pension alimentaire enfant"],
      ["Child support", "Pension alimentaire"],
      ["Custody", "Garde"],
      ["Income", "Revenu"],
      ["Needs", "Besoins"],
      ["Contribution", "Contribution"],
    ],
  },
  {
    enSlug: "health-contribution",
    frSlug: "contribution-sante",
    title: "Calculateur contribution sante | AfroTools",
    name: "Contribution sante",
    description:
      "Estimez contribution, salaire, plafond, ayants droit et reste a payer pour couverture sante.",
    eyebrow: "Assurance sante",
    lead:
      "Preparez une estimation avant paie, inscription ou verification d'une cotisation.",
    useCase:
      "Utile pour salaries, RH, independants et familles qui comparent les contributions.",
    safety:
      "Les baremes changent selon pays et regime; confirmez avec l'organisme officiel.",
    related:
      "A combiner avec assurance sante, cout clinique et reste sante assurance.",
    terms: [
      ["Health Contribution", "Contribution sante"],
      ["Contribution", "Cotisation"],
      ["Salary", "Salaire"],
      ["Dependants", "Ayants droit"],
      ["Coverage", "Couverture"],
      ["Monthly amount", "Montant mensuel"],
    ],
  },
  {
    enSlug: "leave-calculator",
    frSlug: "calculateur-conges-pto",
    title: "Calculateur conges et PTO | AfroTools",
    name: "Calculateur conges",
    description:
      "Calculez jours acquis, jours pris, solde, valeur monetaire et plan de conges.",
    eyebrow: "Paie et RH",
    lead:
      "Suivez les droits de conge avant paie, depart, planification d'equipe ou validation RH.",
    useCase:
      "Utile pour salaries, RH, PME et freelances qui veulent clarifier un solde de conges.",
    safety:
      "Les droits dependent du contrat, de la convention et du droit local du travail.",
    related:
      "A combiner avec heures supplementaires, cout employeur et periode de preavis.",
    terms: [
      ["Leave & PTO Calculator", "Calculateur conges et PTO"],
      ["Leave", "Conge"],
      ["PTO", "Conges payes"],
      ["Accrued", "Acquis"],
      ["Taken", "Pris"],
      ["Balance", "Solde"],
    ],
  },
  {
    enSlug: "popia-checker",
    frSlug: "verificateur-popia",
    title: "Verificateur POPIA | AfroTools",
    name: "Verificateur POPIA",
    description:
      "Passez en revue collecte, base legale, consentement, securite et droits sous POPIA.",
    eyebrow: "Protection des donnees",
    lead:
      "Transformez les obligations de protection des donnees en checklist de revue interne.",
    useCase:
      "Utile pour PME, sites web, applications, ONG et equipes operations en Afrique du Sud.",
    safety:
      "Cette checklist n'est pas un avis juridique; documentez les preuves et consultez un expert.",
    related:
      "A utiliser avec politique confidentialite, NDPA et generateur DPA.",
    terms: [
      ["POPIA Compliance Checker", "Verificateur POPIA"],
      ["POPIA", "POPIA"],
      ["Consent", "Consentement"],
      ["Data subject", "Personne concernee"],
      ["Processing", "Traitement"],
      ["Security safeguards", "Mesures de securite"],
    ],
  },
  {
    enSlug: "social-security",
    frSlug: "securite-sociale",
    title: "Calculateur securite sociale | AfroTools",
    name: "Securite sociale",
    description:
      "Estimez cotisations employe, employeur, plafond, salaire net et total verse.",
    eyebrow: "Paie",
    lead:
      "Preparez une estimation de contribution avant paie, declaration ou budget employeur.",
    useCase:
      "Utile pour RH, comptables, salaries, independants et PME qui verifient les cotisations.",
    safety:
      "Les taux et plafonds changent; confirmez avec l'organisme social officiel de votre pays.",
    related:
      "A combiner avec PAYE, cout employeur, pension et contribution sante.",
    businessCtaNote:
      "Gardez le salaire, pays, part employe, part employeur et plafond avant de demander un module paie ou un export RH.",
    terms: [
      ["Social Security Calculator", "Calculateur securite sociale"],
      ["Social security", "Securite sociale"],
      ["Employee contribution", "Cotisation salarie"],
      ["Employer contribution", "Cotisation employeur"],
      ["Ceiling", "Plafond"],
      ["Net pay", "Salaire net"],
    ],
  },
  {
    enSlug: "genotype-checker",
    frSlug: "verificateur-genotype",
    title: "Verificateur compatibilite genotype | AfroTools",
    name: "Verificateur genotype",
    description:
      "Preparez une discussion sur genotype, drepanocytose, groupe sanguin et risques familiaux.",
    eyebrow: "Sante familiale",
    lead:
      "Structurez les informations de base avant conseil genetique, test de laboratoire ou rendez-vous medical.",
    useCase:
      "Utile pour couples, familles et conseillers communautaires qui veulent comprendre les termes avant consultation.",
    safety:
      "Cette page ne remplace pas un test de laboratoire, un diagnostic ou un conseil medical qualifie.",
    related:
      "A combiner avec compatibilite groupe sanguin et guides de sante familiale.",
    terms: [
      ["Genotype Compatibility Checker", "Verificateur compatibilite genotype"],
      ["Genotype", "Genotype"],
      ["Sickle cell", "Drepanocytose"],
      ["Carrier", "Porteur"],
      ["Compatibility", "Compatibilite"],
      ["Counselling", "Conseil"],
    ],
  },
  {
    enSlug: "blood-group",
    frSlug: "compatibilite-groupe-sanguin",
    title: "Compatibilite groupe sanguin | AfroTools",
    name: "Groupe sanguin",
    description:
      "Comprenez donneur, receveur, rhesus et questions de compatibilite sanguine.",
    eyebrow: "Sante",
    lead:
      "Preparez les notions de base avant don de sang, grossesse, dossier medical ou urgence.",
    useCase:
      "Utile pour sensibilisation, education sante, familles et associations de donneurs.",
    safety:
      "En urgence ou transfusion, suivez uniquement les professionnels de sante et les tests officiels.",
    related:
      "A combiner avec verificateur genotype et informations de clinique.",
    terms: [
      ["Blood Group Compatibility Checker", "Verificateur groupe sanguin"],
      ["Blood group", "Groupe sanguin"],
      ["Donor", "Donneur"],
      ["Recipient", "Receveur"],
      ["Rh factor", "Facteur rhesus"],
      ["Transfusion", "Transfusion"],
    ],
  },
  {
    enSlug: "african-meal-plan",
    frSlug: "plan-repas-africain",
    title: "Generateur plan repas africain | AfroTools",
    name: "Plan repas africain",
    description:
      "Preparez un plan de repas avec aliments africains, objectifs, restrictions et budget.",
    eyebrow: "Nutrition",
    lead:
      "Organisez des idees de repas regionaux avant courses, cuisine familiale ou suivi personnel.",
    useCase:
      "Utile pour familles, etudiants, coachs et personnes qui veulent varier les repas locaux.",
    safety:
      "Pour grossesse, diabete, allergies ou maladie chronique, demandez un avis nutritionnel qualifie.",
    related:
      "A combiner avec nutrition grossesse, compteur calories et budget alimentaire.",
    terms: [
      ["African Meal Plan Generator", "Generateur plan repas africain"],
      ["Meal plan", "Plan repas"],
      ["Dietary restrictions", "Restrictions alimentaires"],
      ["Calories", "Calories"],
      ["Protein", "Proteines"],
      ["Shopping list", "Liste de courses"],
    ],
  },
  {
    enSlug: "child-growth",
    frSlug: "croissance-enfant",
    title: "Suivi croissance enfant | AfroTools",
    name: "Croissance enfant",
    description:
      "Notez age, poids, taille et repere de croissance pour preparer une discussion pediatrique.",
    eyebrow: "Sante enfant",
    lead:
      "Gardez les mesures organisees et separez observation familiale et avis medical.",
    useCase:
      "Utile pour parents, agents communautaires et cliniques qui preparent un suivi.",
    safety:
      "Un professionnel de sante doit interpreter retard, perte de poids ou symptome inquietant.",
    related:
      "A utiliser avec nutrition grossesse, budget clinique et carnet de vaccination.",
    terms: [
      ["Child Growth Chart", "Courbe croissance enfant"],
      ["Weight", "Poids"],
      ["Height", "Taille"],
      ["Age", "Age"],
      ["Z-score", "Score Z"],
      ["Pediatrician", "Pediatre"],
    ],
  },
  {
    enSlug: "prayer-times",
    frSlug: "horaires-priere-qibla",
    title: "Horaires de priere et qibla | AfroTools",
    name: "Horaires priere",
    description:
      "Preparez ville, methode de calcul, fuseau horaire et direction qibla.",
    eyebrow: "Vie religieuse",
    lead:
      "Organisez les horaires de priere pour planification personnelle, voyage ou evenement.",
    useCase:
      "Utile pour voyageurs, familles, mosquees, etudiants et organisateurs locaux.",
    safety:
      "Confirmez les horaires avec votre mosquee locale ou l'autorite religieuse de reference.",
    related:
      "A combiner avec calendrier Ramadan, zakat et calendrier religieux.",
    terms: [
      ["Prayer Times and Qibla Planner", "Horaires de priere et qibla"],
      ["Prayer time", "Horaire de priere"],
      ["Qibla", "Qibla"],
      ["Fajr", "Fajr"],
      ["Maghrib", "Maghrib"],
      ["Method", "Methode"],
    ],
  },
  {
    enSlug: "faraid-inheritance",
    frSlug: "heritage-islamique-faraid",
    title: "Calculateur heritage islamique Faraid | AfroTools",
    name: "Heritage Faraid",
    description:
      "Structurez heritiers, parts, dettes et actifs pour une estimation Faraid.",
    eyebrow: "Finance islamique",
    lead:
      "Preparez les informations avant consultation familiale, religieuse ou juridique.",
    useCase:
      "Utile pour familles, conseillers et etudiants qui veulent comprendre les categories d'heritiers.",
    safety:
      "La repartition finale doit etre confirmee par une autorite religieuse et juridique competente.",
    related:
      "A combiner avec testament, zakat et documents familiaux.",
    terms: [
      ["Islamic Inheritance Faraid Calculator", "Calculateur heritage islamique Faraid"],
      ["Faraid", "Faraid"],
      ["Heirs", "Heritiers"],
      ["Estate", "Succession"],
      ["Debt", "Dette"],
      ["Share", "Part"],
    ],
  },
  {
    enSlug: "hiv-treatment-cost",
    frSlug: "cout-traitement-vih",
    title: "Estimateur cout traitement VIH | AfroTools",
    name: "Cout traitement VIH",
    description:
      "Preparez budget indicatif pour consultation, examens, transport, medicaments et suivi VIH.",
    eyebrow: "Budget sante",
    lead:
      "Organisez les couts possibles et les questions a poser a une clinique ou programme public.",
    useCase:
      "Utile pour patients, aidants, associations et agents communautaires qui planifient le suivi.",
    safety:
      "Ne changez jamais de traitement sans professionnel de sante; cherchez une prise en charge qualifiee.",
    related:
      "A combiner avec cout clinique, prix pharmacie et assurance sante.",
    terms: [
      ["HIV/AIDS Treatment Cost Calculator", "Estimateur cout traitement VIH"],
      ["HIV", "VIH"],
      ["ARV", "ARV"],
      ["Clinic visit", "Visite clinique"],
      ["Lab test", "Examen"],
      ["Follow-up", "Suivi"],
    ],
  },
  {
    enSlug: "kcse-calculator",
    frSlug: "calculateur-kcse",
    title: "Calculateur notes KCSE | AfroTools",
    name: "Calculateur KCSE",
    description:
      "Estimez points, notes, matieres et scenario de resultat KCSE.",
    eyebrow: "Education Kenya",
    lead:
      "Preparez une lecture simple des notes avant conseil scolaire ou choix de filiere.",
    useCase:
      "Utile pour eleves, parents, enseignants et conseillers d'orientation.",
    safety:
      "Les decisions officielles dependent des resultats publies et des regles d'admission.",
    related:
      "A combiner avec admission universite, budget etudiant et planning examens.",
    terms: [
      ["KCSE Grade Calculator", "Calculateur notes KCSE"],
      ["Subject", "Matiere"],
      ["Grade", "Note"],
      ["Points", "Points"],
      ["Mean grade", "Note moyenne"],
      ["University", "Universite"],
    ],
  },
  {
    enSlug: "ndpa-checker",
    frSlug: "verificateur-ndpa",
    title: "Verificateur conformite NDPA | AfroTools",
    name: "Verificateur NDPA",
    description:
      "Passez en revue collecte, base legale, consentement, securite et droits sous NDPA.",
    eyebrow: "Protection donnees",
    lead:
      "Transformez les obligations de protection des donnees en checklist de revue interne.",
    useCase:
      "Utile pour startups, PME, ONG, sites web et applications traitant des donnees personnelles.",
    safety:
      "Cette checklist n'est pas un avis juridique; gardez les preuves et consultez un expert.",
    related:
      "A utiliser avec politique confidentialite, POPIA et generateur DPA.",
    terms: [
      ["NDPA Compliance Checker", "Verificateur NDPA"],
      ["NDPA", "NDPA"],
      ["Consent", "Consentement"],
      ["Personal data", "Donnees personnelles"],
      ["Processing", "Traitement"],
      ["Compliance", "Conformite"],
    ],
  },
  {
    enSlug: "pregnancy-nutrition",
    frSlug: "nutrition-grossesse",
    title: "Calculateur nutrition grossesse | AfroTools",
    name: "Nutrition grossesse",
    description:
      "Preparez besoins, repas locaux, fer, folates, proteines et questions de suivi pendant la grossesse.",
    eyebrow: "Sante maternelle",
    lead:
      "Organisez un plan alimentaire indicatif avec aliments africains et marge pour conseil medical.",
    useCase:
      "Utile pour femmes enceintes, familles, cliniques et agents communautaires.",
    safety:
      "La grossesse necessite un suivi qualifie; adaptez toujours l'alimentation avec un professionnel.",
    related:
      "A combiner avec cout accouchement, plan repas africain et budget clinique.",
    terms: [
      ["Pregnancy Nutrition Calculator", "Calculateur nutrition grossesse"],
      ["Pregnancy", "Grossesse"],
      ["Iron", "Fer"],
      ["Folic acid", "Acide folique"],
      ["Protein", "Proteines"],
      ["Meal", "Repas"],
    ],
  },
  {
    enSlug: "ramadan-timetable",
    frSlug: "calendrier-ramadan",
    title: "Calendrier Ramadan | AfroTools",
    name: "Calendrier Ramadan",
    description:
      "Preparez horaires, ville, priere, sahur, iftar et planning Ramadan.",
    eyebrow: "Vie religieuse",
    lead:
      "Organisez le mois de Ramadan autour des horaires locaux et de vos engagements.",
    useCase:
      "Utile pour familles, voyageurs, mosquees, etudiants et organisateurs communautaires.",
    safety:
      "Confirmez les horaires et dates avec l'autorite religieuse locale.",
    related:
      "A combiner avec horaires de priere, zakat et budget Hajj Umrah.",
    terms: [
      ["Ramadan Timetable Generator", "Generateur calendrier Ramadan"],
      ["Ramadan", "Ramadan"],
      ["Sahur", "Sahur"],
      ["Iftar", "Iftar"],
      ["Prayer", "Priere"],
      ["Timetable", "Calendrier"],
    ],
  },
  {
    enSlug: "birth-death-cert",
    frSlug: "guide-naissance-deces",
    title: "Guide acte de naissance et deces | AfroTools",
    name: "Naissance et deces",
    description:
      "Preparez documents, autorite, frais, delais et copies pour enregistrer naissance ou deces.",
    eyebrow: "Etat civil",
    lead:
      "Organisez les pieces avant visite a l'etat civil, hopital ou portail officiel.",
    useCase:
      "Utile pour familles, assistants administratifs, diaspora et services communautaires.",
    safety:
      "Les exigences varient selon pays et commune; confirmez avec l'autorite d'etat civil.",
    related:
      "A utiliser avec carte identite, certificat mariage et passeport.",
    terms: [
      ["Birth & Death Certificate Guide", "Guide acte naissance et deces"],
      ["Birth certificate", "Acte de naissance"],
      ["Death certificate", "Acte de deces"],
      ["Civil registry", "Etat civil"],
      ["Late registration", "Declaration tardive"],
      ["Official copy", "Copie officielle"],
    ],
  },
  {
    enSlug: "court-fees",
    frSlug: "frais-tribunal",
    title: "Calculateur frais de tribunal | AfroTools",
    name: "Frais de tribunal",
    description:
      "Estimez frais de depot, copie, notification et marge de dossier pour une procedure.",
    eyebrow: "Justice",
    lead:
      "Preparez un budget indicatif avant depot, conseil juridique ou visite au greffe.",
    useCase:
      "Utile pour particuliers, assistants juridiques, ONG et petites entreprises.",
    safety:
      "Les frais changent selon juridiction et type de dossier; confirmez au greffe competent.",
    related:
      "A combiner avec affidavit, procuration et aide juridique.",
    terms: [
      ["Court Fee Calculator", "Calculateur frais de tribunal"],
      ["Court", "Tribunal"],
      ["Filing fee", "Frais de depot"],
      ["Registry", "Greffe"],
      ["Case type", "Type de dossier"],
      ["Receipt", "Recu"],
    ],
  },
  {
    enSlug: "national-service-gh",
    frSlug: "allocation-service-national-ghana",
    title: "Allocation service national Ghana | AfroTools",
    name: "Service national Ghana",
    description:
      "Estimez allocation, logement, transport, repas et reste disponible pendant le service national.",
    eyebrow: "Education Ghana",
    lead:
      "Preparez un budget mensuel simple avant affectation, logement ou trajet quotidien.",
    useCase:
      "Utile pour diplomes, parents et conseillers qui planifient la periode de service.",
    safety:
      "Les montants officiels changent; confirmez avec le service national et vos documents.",
    related:
      "A combiner avec budget etudiant, allocation NYSC et cout transport.",
    terms: [
      ["Ghana NSS Allowance", "Allocation service national Ghana"],
      ["Allowance", "Allocation"],
      ["Transport", "Transport"],
      ["Rent", "Loyer"],
      ["Food", "Repas"],
      ["Balance", "Solde"],
    ],
  },
  {
    enSlug: "vehicle-depreciation",
    frSlug: "depreciation-vehicule",
    title: "Calculateur depreciation vehicule | AfroTools",
    name: "Depreciation vehicule",
    description:
      "Estimez perte de valeur, age, kilometrage, usage et valeur de revente d'un vehicule.",
    eyebrow: "Transport",
    lead:
      "Comparez cout reel d'un vehicule avant achat, vente, flotte ou financement.",
    useCase:
      "Utile pour acheteurs, chauffeurs, flottes, importateurs et revendeurs.",
    safety:
      "La valeur reelle depend du marche local, de l'etat du vehicule et de l'inspection.",
    related:
      "A combiner avec immatriculation vehicule, voiture credit vs comptant et assurance auto.",
    terms: [
      ["Vehicle Depreciation Calculator", "Calculateur depreciation vehicule"],
      ["Depreciation", "Depreciation"],
      ["Mileage", "Kilometrage"],
      ["Resale value", "Valeur de revente"],
      ["Age", "Age"],
      ["Condition", "Etat"],
    ],
  },
  {
    enSlug: "maternal-mortality",
    frSlug: "risque-mortalite-maternelle",
    title: "Evaluation risque mortalite maternelle | AfroTools",
    name: "Risque maternel",
    description:
      "Preparez facteurs de risque, signes d'alerte et questions a poser pendant la grossesse.",
    eyebrow: "Sante maternelle",
    lead:
      "Organisez les informations utiles avant consultation prenatale, accouchement ou orientation vers une clinique.",
    useCase:
      "Utile pour familles, agents communautaires et programmes de sensibilisation sante.",
    safety:
      "En cas de symptome inquietant, cherchez une prise en charge medicale urgente; cet outil n'est pas un diagnostic.",
    related:
      "A combiner avec cout accouchement, nutrition grossesse et couts clinique.",
    terms: [
      ["Maternal Mortality Risk Assessment", "Evaluation risque mortalite maternelle"],
      ["Risk", "Risque"],
      ["Pregnancy", "Grossesse"],
      ["Warning signs", "Signes d'alerte"],
      ["Clinic", "Clinique"],
      ["Emergency", "Urgence"],
    ],
  },
  {
    enSlug: "traditional-vs-western",
    frSlug: "cout-medecine-traditionnelle-moderne",
    title: "Medecine traditionnelle vs moderne | AfroTools",
    name: "Medecine traditionnelle vs moderne",
    description:
      "Comparez couts indicatifs, acces, transport et suivi pour differentes options de soins.",
    eyebrow: "Budget sante",
    lead:
      "Respectez les choix culturels tout en gardant visible le besoin de diagnostic et de suivi qualifie.",
    useCase:
      "Utile pour familles et agents communautaires qui veulent discuter couts et parcours de soins.",
    safety:
      "Ne retardez pas une urgence ou un traitement prescrit; demandez conseil a un professionnel de sante.",
    related:
      "A combiner avec couts clinique, prix pharmacie et cout traitement VIH.",
    terms: [
      ["Traditional vs Western Medicine Cost", "Medecine traditionnelle vs moderne"],
      ["Traditional medicine", "Medecine traditionnelle"],
      ["Western medicine", "Medecine moderne"],
      ["Consultation", "Consultation"],
      ["Treatment", "Traitement"],
      ["Follow-up", "Suivi"],
    ],
  },
  {
    enSlug: "workers-comp",
    frSlug: "indemnisation-accident-travail",
    title: "Calculateur indemnisation accident du travail | AfroTools",
    name: "Accident du travail",
    description:
      "Estimez salaire, incapacite, frais et documents pour une demande d'indemnisation.",
    eyebrow: "Assurance travail",
    lead:
      "Preparez les informations avant declaration employeur, assurance ou service social.",
    useCase:
      "Utile pour salaries, RH, PME et conseillers qui structurent un dossier initial.",
    safety:
      "Les droits dependent du pays, du contrat et de la decision de l'organisme competent.",
    related:
      "A combiner avec securite sociale, cout employeur et contrat de travail.",
    terms: [
      ["Workers Compensation Calculator", "Calculateur indemnisation accident du travail"],
      ["Workers compensation", "Indemnisation accident du travail"],
      ["Injury", "Blessure"],
      ["Salary", "Salaire"],
      ["Claim", "Demande"],
      ["Documents", "Documents"],
    ],
  },
  {
    enSlug: "islamic-finance",
    frSlug: "finance-islamique-profit",
    title: "Calculateur taux profit finance islamique | AfroTools",
    name: "Finance islamique",
    description:
      "Comparez prix, marge, echeances et cout total pour un financement islamique indicatif.",
    eyebrow: "Finance islamique",
    lead:
      "Structurez les chiffres avant discussion avec une institution, un conseiller ou un comite religieux.",
    useCase:
      "Utile pour menages, PME et etudiants qui comparent plusieurs scenarios de financement.",
    safety:
      "Confirmez la conformite religieuse, les frais et le contrat avec des experts qualifies.",
    related:
      "A combiner avec zakat, heritage Faraid et calculateur de pret.",
    terms: [
      ["Islamic Finance Profit Rate Calculator", "Calculateur taux profit finance islamique"],
      ["Profit rate", "Taux de profit"],
      ["Murabaha", "Mourabaha"],
      ["Installment", "Echeance"],
      ["Total cost", "Cout total"],
      ["Asset", "Actif"],
    ],
  },
  {
    enSlug: "roadworthiness",
    frSlug: "checklist-visite-technique",
    title: "Checklist visite technique vehicule | AfroTools",
    name: "Visite technique",
    description:
      "Preparez documents, inspection, assurance, freins, pneus et controle securite avant visite.",
    eyebrow: "Transport",
    lead:
      "Verifiez les points pratiques avant inspection routiere, renouvellement ou achat de vehicule.",
    useCase:
      "Utile pour chauffeurs, proprietaires, flottes, taxis et transporteurs.",
    safety:
      "Les exigences varient selon pays; confirmez toujours avec l'autorite routiere competente.",
    related:
      "A combiner avec immatriculation vehicule, depreciation vehicule et assurance auto.",
    terms: [
      ["Roadworthiness Checklist", "Checklist visite technique"],
      ["Roadworthiness", "Aptitude a circuler"],
      ["Inspection", "Inspection"],
      ["Brakes", "Freins"],
      ["Tyres", "Pneus"],
      ["Certificate", "Certificat"],
    ],
  },
  {
    enSlug: "medical-tourism",
    frSlug: "comparateur-tourisme-medical",
    title: "Comparateur cout tourisme medical | AfroTools",
    name: "Tourisme medical",
    description:
      "Comparez procedure, voyage, logement, accompagnant et suivi pour un traitement hors pays.",
    eyebrow: "Budget sante",
    lead:
      "Regroupez les couts visibles et caches avant de contacter hopitaux, agences ou assureurs.",
    useCase:
      "Utile pour familles, patients et conseillers qui evaluent plusieurs destinations de soins.",
    safety:
      "Verifiez accreditations, dossier medical, risques de voyage et suivi apres retour avec un medecin.",
    related:
      "A combiner avec couts clinique, assurance sante et prix medicaments.",
    terms: [
      ["Medical Tourism Cost Comparator", "Comparateur cout tourisme medical"],
      ["Medical tourism", "Tourisme medical"],
      ["Procedure", "Procedure"],
      ["Travel", "Voyage"],
      ["Accommodation", "Logement"],
      ["Aftercare", "Suivi apres soins"],
    ],
  },
  {
    enSlug: "wedding-budget",
    frSlug: "budget-mariage-africain",
    title: "Planificateur budget mariage africain | AfroTools",
    name: "Budget mariage africain",
    description:
      "Estimez lieu, tenues, repas, dot, famille, musique, photo et marge pour un mariage.",
    eyebrow: "Culture et famille",
    lead:
      "Organisez les depenses du mariage avec une vue claire sur priorites et contributions.",
    useCase:
      "Utile pour couples, familles, planificateurs et comites de mariage.",
    safety:
      "Les couts dependent fortement de la ville, des traditions et du nombre d'invites.",
    related:
      "A combiner avec cout aso-ebi, ceremonie de nommage et budget evenement.",
    terms: [
      ["African Wedding Budget Planner", "Planificateur budget mariage africain"],
      ["Wedding", "Mariage"],
      ["Guests", "Invites"],
      ["Venue", "Lieu"],
      ["Catering", "Repas"],
      ["Bride price", "Dot"],
    ],
  },
  {
    enSlug: "funeral-cost",
    frSlug: "planification-funerailles",
    title: "Calculateur cout funerailles | AfroTools",
    name: "Cout funerailles",
    description:
      "Estimez cercueil, transport, lieu, repas, annonces, rites et marge familiale.",
    eyebrow: "Famille et culture",
    lead:
      "Preparez un budget prudent dans un moment sensible, sans perdre les details pratiques.",
    useCase:
      "Utile pour familles, associations, eglises, mosquees et groupes communautaires.",
    safety:
      "Les pratiques et couts changent selon tradition, ville, religion et urgence.",
    related:
      "A combiner avec assurance funeraire, budget evenement et documents civils.",
    terms: [
      ["Funeral Cost Calculator", "Calculateur cout funerailles"],
      ["Funeral", "Funerailles"],
      ["Burial", "Inhumation"],
      ["Transport", "Transport"],
      ["Catering", "Repas"],
      ["Ceremony", "Ceremonie"],
    ],
  },
  {
    enSlug: "churn-rate",
    frSlug: "taux-attrition-clients",
    title: "Calculateur taux d'attrition clients | AfroTools",
    name: "Taux d'attrition",
    description:
      "Calculez churn clients, churn revenus, retention nette et duree de vie moyenne.",
    eyebrow: "Business model",
    lead:
      "Mesurez la perte de clients avant d'ajuster prix, support, produit ou acquisition.",
    useCase:
      "Utile pour SaaS, abonnements, createurs, clubs, fintechs et PME recurrentes.",
    safety:
      "Comparez les resultats avec donnees reelles et cohortes avant toute decision commerciale.",
    related:
      "A combiner avec economie unitaire, runway startup et taille marche TAM SAM SOM.",
    terms: [
      ["Churn Rate Calculator", "Calculateur taux d'attrition"],
      ["Churn", "Attrition"],
      ["Retention", "Retention"],
      ["Customers", "Clients"],
      ["Revenue churn", "Attrition revenus"],
      ["Net revenue retention", "Retention nette revenus"],
    ],
  },
  {
    enSlug: "mental-health-cost",
    frSlug: "cout-sante-mentale",
    title: "Estimateur cout sante mentale | AfroTools",
    name: "Cout sante mentale",
    description:
      "Preparez budget pour therapie, consultation, medicaments, transport et suivi.",
    eyebrow: "Sante mentale",
    lead:
      "Organisez les couts possibles avant de chercher un service, une assurance ou une aide locale.",
    useCase:
      "Utile pour personnes, familles, aidants et associations qui planifient un accompagnement.",
    safety:
      "En crise ou danger immediat, contactez les services d'urgence ou une ligne d'aide locale.",
    related:
      "A combiner avec couts clinique, prix pharmacie et assurance sante.",
    terms: [
      ["Mental Health Service Cost Finder", "Estimateur cout sante mentale"],
      ["Mental health", "Sante mentale"],
      ["Therapy", "Therapie"],
      ["Psychiatry", "Psychiatrie"],
      ["Medication", "Medicaments"],
      ["Support", "Soutien"],
    ],
  },
  {
    enSlug: "baby-name-generator",
    frSlug: "generateur-prenom-africain",
    title: "Generateur prenom africain | AfroTools",
    name: "Prenom africain",
    description:
      "Explorez prenoms, origines, significations et idees culturelles pour un enfant.",
    eyebrow: "Culture",
    lead:
      "Parcourez des idees de prenoms africains avec un cadre de recherche et de verification familiale.",
    useCase:
      "Utile pour parents, familles, ecrivains et createurs qui cherchent une inspiration culturelle.",
    safety:
      "Confirmez signification, prononciation et usage avec des locuteurs ou sources culturelles fiables.",
    related:
      "A combiner avec signification prenoms africains et ceremonie de nommage.",
    terms: [
      ["African Baby Name Generator", "Generateur prenom africain"],
      ["Baby name", "Prenom bebe"],
      ["Meaning", "Signification"],
      ["Origin", "Origine"],
      ["Gender", "Genre"],
      ["Culture", "Culture"],
    ],
  },
  {
    enSlug: "breastfeeding-tracker",
    frSlug: "suivi-allaitement",
    title: "Suivi allaitement | AfroTools",
    name: "Suivi allaitement",
    description:
      "Notez tettees, duree, cote, remarques et questions pour le suivi du nourrisson.",
    eyebrow: "Sante enfant",
    lead:
      "Gardez un historique simple a partager avec une sage-femme, une clinique ou un pediatre.",
    useCase:
      "Utile pour parents, aidants et agents communautaires pendant les premiers mois.",
    safety:
      "Pour douleur, fievre, perte de poids ou difficulte a nourrir, consultez rapidement un professionnel.",
    related:
      "A combiner avec croissance enfant, nutrition grossesse et budget clinique.",
    terms: [
      ["Breastfeeding Tracker", "Suivi allaitement"],
      ["Breastfeeding", "Allaitement"],
      ["Feed", "Tetee"],
      ["Duration", "Duree"],
      ["Left", "Gauche"],
      ["Right", "Droite"],
    ],
  },
  {
    enSlug: "budget-comparator",
    frSlug: "comparateur-budget-public",
    title: "Comparateur budget public | AfroTools",
    name: "Budget public",
    description:
      "Comparez allocations budgetaires, secteurs, variation annuelle et notes de source.",
    eyebrow: "Civique",
    lead:
      "Structurez une comparaison de budget gouvernemental avant analyse, article ou plaidoyer.",
    useCase:
      "Utile pour journalistes, ONG, chercheurs, citoyens et equipes civiques.",
    safety:
      "Confirmez les chiffres avec les documents budgetaires officiels et la date de publication.",
    related:
      "A combiner avec suivi elections Afrique, FOI et guides gouvernementaux.",
    terms: [
      ["Government Budget Comparator", "Comparateur budget public"],
      ["Budget", "Budget"],
      ["Allocation", "Allocation"],
      ["Sector", "Secteur"],
      ["Year-on-year", "Annee sur annee"],
      ["Official source", "Source officielle"],
    ],
  },
  {
    enSlug: "festival-calendar",
    frSlug: "calendrier-festivals-culturels",
    title: "Calendrier festivals culturels africains | AfroTools",
    name: "Calendrier festivals",
    description:
      "Organisez festival, pays, date, ville, voyage et verification de source.",
    eyebrow: "Culture et voyage",
    lead:
      "Preparez un calendrier culturel pour voyage, contenu, recherche ou planification locale.",
    useCase:
      "Utile pour voyageurs, createurs, medias, organisateurs et equipes touristiques.",
    safety:
      "Les dates peuvent changer; confirmez avec l'organisateur ou l'office touristique officiel.",
    related:
      "A combiner avec budget festival, voyage et calendrier traditionnel.",
    terms: [
      ["Cultural Festival Calendar", "Calendrier festivals culturels"],
      ["Festival", "Festival"],
      ["Date", "Date"],
      ["City", "Ville"],
      ["Travel", "Voyage"],
      ["Organizer", "Organisateur"],
    ],
  },
  {
    enSlug: "eye-care-cost",
    frSlug: "cout-soins-oculaires",
    title: "Estimateur cout soins oculaires | AfroTools",
    name: "Cout soins oculaires",
    description:
      "Estimez consultation, lunettes, lentilles, chirurgie, transport et suivi oculaire.",
    eyebrow: "Budget sante",
    lead:
      "Preparez une comparaison de couts avant rendez-vous, devis clinique ou assurance.",
    useCase:
      "Utile pour familles, patients, aidants et cliniques qui planifient des soins oculaires.",
    safety:
      "Le diagnostic et le traitement doivent venir d'un professionnel de la vue qualifie.",
    related:
      "A combiner avec couts clinique, prix pharmacie et assurance sante.",
    terms: [
      ["Eye Care Cost Calculator", "Estimateur cout soins oculaires"],
      ["Eye care", "Soins oculaires"],
      ["Glasses", "Lunettes"],
      ["Contact lenses", "Lentilles"],
      ["Surgery", "Chirurgie"],
      ["Consultation", "Consultation"],
    ],
  },
  {
    enSlug: "aso-ebi-cost",
    frSlug: "cout-aso-ebi",
    title: "Calculateur cout Aso-Ebi | AfroTools",
    name: "Cout Aso-Ebi",
    description:
      "Estimez tissu, couture, accessoires, livraison et contribution de groupe.",
    eyebrow: "Culture et evenements",
    lead:
      "Preparez le budget d'une tenue de groupe pour mariage, ceremonie ou evenement familial.",
    useCase:
      "Utile pour familles, comites de mariage, createurs de mode et organisateurs.",
    safety:
      "Les prix dependent du tissu, de la ville, du tailleur, du delai et du volume commande.",
    related:
      "A combiner avec budget mariage africain, tenue traditionnelle et ceremonie de nommage.",
    terms: [
      ["Aso-Ebi Group Outfit Cost Calculator", "Calculateur cout Aso-Ebi"],
      ["Aso-Ebi", "Aso-Ebi"],
      ["Fabric", "Tissu"],
      ["Tailoring", "Couture"],
      ["Accessories", "Accessoires"],
      ["Group order", "Commande de groupe"],
    ],
  },
  {
    enSlug: "carbon-credit",
    frSlug: "revenus-credits-carbone",
    title: "Estimateur revenus credits carbone | AfroTools",
    name: "Credits carbone",
    description:
      "Estimez surface, reductions, prix indicatif, verification et frais de projet.",
    eyebrow: "Climat",
    lead:
      "Cadrez une premiere estimation avant discussion avec developpeurs, cooperatives ou acheteurs.",
    useCase:
      "Utile pour agriculteurs, ONG, cooperatives, PME vertes et porteurs de projets climat.",
    safety:
      "Les revenus reels dependent de methodologie, verification, permanence, prix marche et contrat.",
    related:
      "A combiner avec plantation d'arbres, score durabilite et empreinte carbone energie.",
    terms: [
      ["Carbon Credit Revenue for Africa", "Revenus credits carbone"],
      ["Carbon credit", "Credit carbone"],
      ["Verification", "Verification"],
      ["Emission reduction", "Reduction emissions"],
      ["Price", "Prix"],
      ["Project cost", "Frais de projet"],
    ],
  },
  {
    enSlug: "foi-template",
    frSlug: "modele-demande-acces-information",
    title: "Modele demande acces a l'information | AfroTools",
    name: "Demande d'information",
    description:
      "Preparez organisme, objet, questions, delai, format souhaite et suivi.",
    eyebrow: "Civique",
    lead:
      "Structurez une demande claire avant envoi a une administration, agence ou institution publique.",
    useCase:
      "Utile pour journalistes, ONG, chercheurs, citoyens et equipes de plaidoyer.",
    safety:
      "Verifiez la loi applicable, les frais, les delais et les exemptions dans le pays concerne.",
    related:
      "A combiner avec budget public, suivi elections Afrique et guides gouvernementaux.",
    terms: [
      ["FOI Request Template Generator", "Modele demande acces a l'information"],
      ["Freedom of information", "Acces a l'information"],
      ["Public body", "Organisme public"],
      ["Request", "Demande"],
      ["Deadline", "Delai"],
      ["Appeal", "Recours"],
    ],
  },
  {
    enSlug: "home-workout",
    frSlug: "entrainement-maison",
    title: "Calculateur entrainement maison | AfroTools",
    name: "Entrainement maison",
    description:
      "Estimez duree, intensite, poids, calories indicatives et progression.",
    eyebrow: "Sante et forme",
    lead:
      "Planifiez une seance simple avec une estimation pratique de l'effort fourni.",
    useCase:
      "Utile pour particuliers, coachs, groupes communautaires et programmes bien-etre.",
    safety:
      "Adaptez l'effort a votre condition; demandez avis medical en cas de douleur ou maladie.",
    related:
      "A combiner avec comparateur salle de sport, IMC et compteur calories.",
    terms: [
      ["Home Workout Calorie Burner", "Calculateur entrainement maison"],
      ["Workout", "Entrainement"],
      ["Calories", "Calories"],
      ["Intensity", "Intensite"],
      ["Duration", "Duree"],
      ["Progress", "Progression"],
    ],
  },
  {
    enSlug: "naming-ceremony",
    frSlug: "budget-ceremonie-nommage",
    title: "Budget ceremonie de nommage | AfroTools",
    name: "Ceremonie de nommage",
    description:
      "Estimez lieu, repas, tenues, cadeaux, musique, photos et contribution familiale.",
    eyebrow: "Culture et famille",
    lead:
      "Preparez les depenses d'une ceremonie de nommage avec une marge claire.",
    useCase:
      "Utile pour parents, familles, comites religieux et organisateurs locaux.",
    safety:
      "Les couts varient selon tradition, invitees, ville, religion et niveau de reception.",
    related:
      "A combiner avec prenom africain, budget mariage africain et cout Aso-Ebi.",
    terms: [
      ["Naming Ceremony Budget Calculator", "Budget ceremonie de nommage"],
      ["Naming ceremony", "Ceremonie de nommage"],
      ["Guests", "Invites"],
      ["Food", "Repas"],
      ["Gifts", "Cadeaux"],
      ["Family contribution", "Contribution familiale"],
    ],
  },
  {
    enSlug: "tb-tracker",
    frSlug: "suivi-traitement-tuberculose",
    title: "Suivi traitement tuberculose | AfroTools",
    name: "Suivi tuberculose",
    description:
      "Notez doses, rendez-vous, effets secondaires, examens et questions pour la clinique.",
    eyebrow: "Sante publique",
    lead:
      "Gardez un suivi simple a partager avec un agent de sante ou un programme TB.",
    useCase:
      "Utile pour patients, aidants, agents communautaires et cliniques de suivi.",
    safety:
      "Ne modifiez jamais un traitement sans professionnel de sante; signalez rapidement tout symptome grave.",
    related:
      "A combiner avec couts clinique, prix pharmacie et contribution sante.",
    terms: [
      ["Tuberculosis Treatment Tracker", "Suivi traitement tuberculose"],
      ["Tuberculosis", "Tuberculose"],
      ["Treatment", "Traitement"],
      ["Dose", "Dose"],
      ["Appointment", "Rendez-vous"],
      ["Side effects", "Effets secondaires"],
    ],
  },
  {
    enSlug: "traditional-attire",
    frSlug: "cout-tenue-traditionnelle",
    title: "Calculateur cout tenue traditionnelle | AfroTools",
    name: "Tenue traditionnelle",
    description:
      "Estimez tissu, broderie, couture, accessoires, essayages et livraison.",
    eyebrow: "Culture et mode",
    lead:
      "Comparez plusieurs options de tenue traditionnelle avant commande ou evenement.",
    useCase:
      "Utile pour familles, tailleurs, boutiques, createurs et organisateurs de ceremonies.",
    safety:
      "Confirmez mesures, qualite du tissu, delais et politique de retouche avant paiement.",
    related:
      "A combiner avec cout Aso-Ebi, budget mariage africain et ceremonie de nommage.",
    terms: [
      ["Traditional Attire Cost Calculator", "Calculateur cout tenue traditionnelle"],
      ["Traditional attire", "Tenue traditionnelle"],
      ["Fabric", "Tissu"],
      ["Embroidery", "Broderie"],
      ["Tailor", "Tailleur"],
      ["Alterations", "Retouches"],
    ],
  },
  {
    enSlug: "traditional-calendar",
    frSlug: "calendrier-traditionnel",
    title: "Convertisseur calendrier traditionnel | AfroTools",
    name: "Calendrier traditionnel",
    description:
      "Comparez date, cycle local, jour de marche, fete ou repere culturel.",
    eyebrow: "Culture",
    lead:
      "Organisez des dates traditionnelles avec une note claire sur la source et la verification locale.",
    useCase:
      "Utile pour chercheurs, familles, createurs, guides touristiques et organisateurs culturels.",
    safety:
      "Les systemes de calendrier varient; confirmez toujours avec des sources culturelles locales.",
    related:
      "A combiner avec festivals culturels, prenom africain et proverbes africains.",
    terms: [
      ["Traditional Calendar Converter", "Convertisseur calendrier traditionnel"],
      ["Traditional calendar", "Calendrier traditionnel"],
      ["Market day", "Jour de marche"],
      ["Festival", "Festival"],
      ["Cycle", "Cycle"],
      ["Local source", "Source locale"],
    ],
  },
  {
    enSlug: "age-calculator-african",
    frSlug: "calculateur-age-jour-nom",
    title: "Calculateur age et jour de nom | AfroTools",
    name: "Age et jour de nom",
    description:
      "Calculez age, jour de naissance, repere culturel et idee de nom associee.",
    eyebrow: "Culture",
    lead:
      "Reliez une date de naissance a des reperes pratiques pour famille, culture ou contenu.",
    useCase:
      "Utile pour parents, familles, createurs, ecoles et projets culturels.",
    safety:
      "Les noms et associations culturelles doivent etre verifies avec des locuteurs ou sources fiables.",
    related:
      "A combiner avec prenom africain, calendrier traditionnel et calculateur age.",
    terms: [
      ["Age Calculator with African Name Day", "Calculateur age et jour de nom"],
      ["Age", "Age"],
      ["Birth date", "Date de naissance"],
      ["Name day", "Jour de nom"],
      ["Culture", "Culture"],
      ["Meaning", "Signification"],
    ],
  },
  {
    enSlug: "gym-cost-compare",
    frSlug: "comparateur-cout-salle-sport",
    title: "Comparateur cout salle de sport | AfroTools",
    name: "Cout salle de sport",
    description:
      "Comparez abonnement, transport, inscription, cours, equipement et frequence.",
    eyebrow: "Sante et forme",
    lead:
      "Calculez le cout reel d'une salle de sport par mois, seance ou objectif.",
    useCase:
      "Utile pour particuliers, coachs, etudiants, familles et programmes bien-etre.",
    safety:
      "Comparez aussi horaires, securite, hygiene, encadrement et politique d'annulation.",
    related:
      "A combiner avec entrainement maison, IMC et compteur calories.",
    terms: [
      ["Gym Membership Cost Comparator", "Comparateur cout salle de sport"],
      ["Gym", "Salle de sport"],
      ["Membership", "Abonnement"],
      ["Monthly cost", "Cout mensuel"],
      ["Transport", "Transport"],
      ["Per session", "Par seance"],
    ],
  },
  {
    enSlug: "tree-planting-roi",
    frSlug: "roi-plantation-arbres",
    title: "Calculateur ROI plantation d'arbres | AfroTools",
    name: "ROI plantation arbres",
    description:
      "Estimez plants, entretien, survie, revenus, carbone indicatif et horizon.",
    eyebrow: "Climat et agriculture",
    lead:
      "Comparez les couts et retours possibles d'un projet de plantation avant engagement.",
    useCase:
      "Utile pour agriculteurs, ecoles, ONG, cooperatives, communes et projets climat.",
    safety:
      "Les resultats dependent des especes, de l'eau, du foncier, de la survie et du marche.",
    related:
      "A combiner avec credits carbone, score durabilite et deforestation.",
    terms: [
      ["Tree Planting ROI for Africa", "ROI plantation d'arbres"],
      ["Tree planting", "Plantation d'arbres"],
      ["Survival rate", "Taux de survie"],
      ["Maintenance", "Entretien"],
      ["Revenue", "Revenus"],
      ["Horizon", "Horizon"],
    ],
  },
  {
    enSlug: "air-quality",
    frSlug: "indice-qualite-air",
    title: "Indice qualite de l'air | AfroTools",
    name: "Qualite de l'air",
    description:
      "Suivez AQI, particules, niveau de risque, activites et recommandations prudentes.",
    eyebrow: "Climat et sante",
    lead:
      "Interpretez une mesure de qualite de l'air avec un langage simple et des actions prudentes.",
    useCase:
      "Utile pour familles, ecoles, travailleurs exterieurs, journalistes et equipes sante.",
    safety:
      "Les donnees peuvent etre locales ou indicatives; suivez les avis officiels en cas d'alerte.",
    related:
      "A combiner avec risque inondation, secheresse et cout sante mentale.",
    terms: [
      ["Air Quality Index Tracker for Africa", "Indice qualite de l'air"],
      ["Air quality", "Qualite de l'air"],
      ["AQI", "AQI"],
      ["Particulate matter", "Particules"],
      ["Risk level", "Niveau de risque"],
      ["Advisory", "Avis"],
    ],
  },
  {
    enSlug: "flood-risk",
    frSlug: "risque-inondation",
    title: "Evaluation risque inondation | AfroTools",
    name: "Risque inondation",
    description:
      "Evaluez zone, saison, drainage, historique, alerte et mesures de preparation.",
    eyebrow: "Climat et securite",
    lead:
      "Structurez une verification de risque avant logement, chantier, voyage ou plan familial.",
    useCase:
      "Utile pour menages, ecoles, PME, communes, ONG et equipes de terrain.",
    safety:
      "Cet outil ne remplace pas les alertes officielles, plans d'urgence ou avis meteorologiques.",
    related:
      "A combiner avec qualite de l'air, secheresse et gestion dechets.",
    terms: [
      ["Flood Risk Assessment for Africa", "Evaluation risque inondation"],
      ["Flood", "Inondation"],
      ["Drainage", "Drainage"],
      ["Season", "Saison"],
      ["Preparedness", "Preparation"],
      ["Warning", "Alerte"],
    ],
  },
  {
    enSlug: "hep-b-screening",
    frSlug: "cout-depistage-hepatite-b",
    title: "Estimateur cout depistage hepatite B | AfroTools",
    name: "Depistage hepatite B",
    description:
      "Estimez test, consultation, vaccination, transport, suivi et rappels.",
    eyebrow: "Sante publique",
    lead:
      "Preparez un budget indicatif avant depistage, vaccination ou consultation clinique.",
    useCase:
      "Utile pour familles, patients, agents communautaires, cliniques et programmes de prevention.",
    safety:
      "Les resultats et traitements doivent etre interpretes par un professionnel de sante qualifie.",
    related:
      "A combiner avec prix pharmacie, couts clinique et contribution sante.",
    terms: [
      ["Hepatitis B Screening Cost Estimator", "Estimateur cout depistage hepatite B"],
      ["Hepatitis B", "Hepatite B"],
      ["Screening", "Depistage"],
      ["Vaccine", "Vaccin"],
      ["Consultation", "Consultation"],
      ["Follow-up", "Suivi"],
    ],
  },
  {
    enSlug: "sustainability-scorecard",
    frSlug: "score-durabilite-entreprise",
    title: "Score durabilite entreprise | AfroTools",
    name: "Score durabilite",
    description:
      "Passez en revue energie, dechets, eau, fournisseurs, risques et preuves.",
    eyebrow: "Climat et business",
    lead:
      "Obtenez une grille simple pour prioriser les actions durables d'une organisation.",
    useCase:
      "Utile pour PME, cooperatives, startups, ONG, ecoles et equipes operations.",
    safety:
      "Un score interne ne remplace pas un audit ESG, une certification ou une verification externe.",
    related:
      "A combiner avec credits carbone, recyclage et gestion dechets.",
    terms: [
      ["Sustainable Business Scorecard for Africa", "Score durabilite entreprise"],
      ["Sustainability", "Durabilite"],
      ["Energy", "Energie"],
      ["Waste", "Dechets"],
      ["Water", "Eau"],
      ["Evidence", "Preuves"],
    ],
  },
  {
    enSlug: "charcoal-vs-clean",
    frSlug: "charbon-vs-cuisson-propre",
    title: "Charbon vs cuisson propre | AfroTools",
    name: "Charbon vs cuisson propre",
    description:
      "Comparez combustible, cout mensuel, fumee, temps, sante et options de cuisson.",
    eyebrow: "Energie domestique",
    lead:
      "Evaluez le cout pratique d'une transition vers gaz, electricite, biogaz ou foyer ameliore.",
    useCase:
      "Utile pour menages, ONG, programmes sante, cooperatives et equipes energie.",
    safety:
      "Les impacts sante et emissions sont indicatifs; suivez les conseils locaux de securite.",
    related:
      "A combiner avec cout gaz LPG, solaire vs generateur et score durabilite.",
    terms: [
      ["Charcoal vs Clean Cooking for Africa", "Charbon vs cuisson propre"],
      ["Charcoal", "Charbon"],
      ["Clean cooking", "Cuisson propre"],
      ["Smoke", "Fumee"],
      ["Fuel cost", "Cout combustible"],
      ["Health", "Sante"],
    ],
  },
  {
    enSlug: "betting-tax",
    frSlug: "taxe-paris-sportifs",
    title: "Calculateur taxe paris sportifs | AfroTools",
    name: "Taxe paris sportifs",
    description:
      "Estimez mise, gain brut, taxe indicative, frais et gain net apres retenues.",
    eyebrow: "Sports et fiscalite",
    lead:
      "Comprenez l'effet possible des taxes et frais avant d'interpreter un gain de pari.",
    useCase:
      "Utile pour utilisateurs, journalistes sportifs, analystes et equipes de contenu.",
    safety:
      "Les regles changent selon pays et operateur; ne pariez que legalement et avec moderation.",
    related:
      "A combiner avec cotes paris sportifs, budget divertissement et outils fiscaux locaux.",
    terms: [
      ["Sports Betting Tax Calculator Africa", "Calculateur taxe paris sportifs"],
      ["Bet", "Pari"],
      ["Stake", "Mise"],
      ["Winnings", "Gains"],
      ["Tax", "Taxe"],
      ["Net payout", "Paiement net"],
    ],
  },
  {
    enSlug: "ewaste-value",
    frSlug: "valeur-dechets-electroniques",
    title: "Valeur dechets electroniques | AfroTools",
    name: "Dechets electroniques",
    description:
      "Estimez telephones, batteries, cables, cartes, poids, tri et valeur indicative.",
    eyebrow: "Climat et recyclage",
    lead:
      "Preparez une estimation avant collecte, recyclage, rachat ou campagne communautaire.",
    useCase:
      "Utile pour collecteurs, ecoles, ONG, reparateurs, PME et programmes environnement.",
    safety:
      "Manipulez batteries et composants avec prudence; confirmez prix et filieres agreees localement.",
    related:
      "A combiner avec revenus recyclage, gestion dechets et score durabilite.",
    terms: [
      ["E-Waste Collection Value for Africa", "Valeur dechets electroniques"],
      ["E-waste", "Dechets electroniques"],
      ["Collection", "Collecte"],
      ["Weight", "Poids"],
      ["Recycling", "Recyclage"],
      ["Value", "Valeur"],
    ],
  },
  {
    enSlug: "cholera-risk",
    frSlug: "risque-cholera",
    title: "Evaluation risque cholera | AfroTools",
    name: "Risque cholera",
    description:
      "Evaluez eau, assainissement, symptomes, exposition, alerte et mesures prudentes.",
    eyebrow: "Sante publique",
    lead:
      "Structurez une verification rapide des facteurs de risque et des prochaines actions.",
    useCase:
      "Utile pour familles, ecoles, agents communautaires, ONG et equipes de terrain.",
    safety:
      "En cas de diarrhee severe ou signes de dehydration, cherchez une aide medicale urgente.",
    related:
      "A combiner avec qualite de l'eau, couts clinique et risque inondation.",
    terms: [
      ["Cholera Risk Assessment Tool", "Evaluation risque cholera"],
      ["Cholera", "Cholera"],
      ["Water", "Eau"],
      ["Sanitation", "Assainissement"],
      ["Dehydration", "Deshydratation"],
      ["Emergency", "Urgence"],
    ],
  },
  {
    enSlug: "streaming-royalties",
    frSlug: "redevances-streaming-musical",
    title: "Calculateur redevances streaming musical | AfroTools",
    name: "Redevances streaming",
    description:
      "Estimez ecoutes, taux indicatif, part label, distributeur, taxes et revenu net.",
    eyebrow: "Createurs et musique",
    lead:
      "Comprenez l'ordre de grandeur des revenus streaming avant campagne ou sortie musicale.",
    useCase:
      "Utile pour artistes, managers, labels, createurs et analystes musique.",
    safety:
      "Les paiements reels dependent des plateformes, contrats, territoires et delais de distributeur.",
    related:
      "A combiner avec budget album, split royalties et prix photo video.",
    terms: [
      ["Music Streaming Royalty Calculator Africa", "Calculateur redevances streaming musical"],
      ["Streaming", "Streaming"],
      ["Streams", "Ecoutes"],
      ["Royalty", "Redevance"],
      ["Distributor", "Distributeur"],
      ["Net revenue", "Revenu net"],
    ],
  },
  {
    enSlug: "water-scarcity",
    frSlug: "penurie-eau",
    title: "Calculateur penurie d'eau | AfroTools",
    name: "Penurie d'eau",
    description:
      "Estimez besoin journalier, stockage, saison, distance, cout et marge de securite.",
    eyebrow: "Climat et eau",
    lead:
      "Planifiez l'eau disponible pour un foyer, une ecole, une ferme ou une petite activite.",
    useCase:
      "Utile pour menages, agriculteurs, ecoles, ONG, PME et equipes d'urgence.",
    safety:
      "Les resultats sont indicatifs; suivez les avis officiels en cas de secheresse ou crise.",
    related:
      "A combiner avec risque secheresse, risque inondation et volume irrigation.",
    terms: [
      ["Water Scarcity Calculator for Africa", "Calculateur penurie d'eau"],
      ["Water scarcity", "Penurie d'eau"],
      ["Storage", "Stockage"],
      ["Daily need", "Besoin journalier"],
      ["Season", "Saison"],
      ["Safety margin", "Marge de securite"],
    ],
  },
  {
    enSlug: "drought-risk",
    frSlug: "risque-secheresse",
    title: "Evaluation risque secheresse | AfroTools",
    name: "Risque secheresse",
    description:
      "Evaluez pluie, saison, culture, eau disponible, stock fourrage et plan d'urgence.",
    eyebrow: "Climat et agriculture",
    lead:
      "Reperez les facteurs de vulnerabilite avant une saison agricole ou un plan communautaire.",
    useCase:
      "Utile pour agriculteurs, cooperatives, ONG, communes et equipes climat.",
    safety:
      "Cet outil ne remplace pas les alertes meteorologiques, assurances ou conseils agricoles locaux.",
    related:
      "A combiner avec penurie d'eau, suivi pluviometrie et assurance recolte.",
    terms: [
      ["Drought Risk Assessment for Africa", "Evaluation risque secheresse"],
      ["Drought", "Secheresse"],
      ["Rainfall", "Pluie"],
      ["Crop", "Culture"],
      ["Water", "Eau"],
      ["Emergency plan", "Plan d'urgence"],
    ],
  },
  {
    enSlug: "sports-scholarship",
    frSlug: "eligibilite-bourse-sportive",
    title: "Eligibilite bourse sportive | AfroTools",
    name: "Bourse sportive",
    description:
      "Preparez sport, niveau, notes, video, resultats, age et documents de candidature.",
    eyebrow: "Sports et education",
    lead:
      "Organisez les criteres avant de cibler ecoles, clubs, universites ou programmes sportifs.",
    useCase:
      "Utile pour eleves, parents, coachs, clubs, academies et conseillers education.",
    safety:
      "Confirmez toujours les criteres officiels, frais, visas et dates limites du programme.",
    related:
      "A combiner avec cout etudes etranger, parcours admission universite et planning examens.",
    terms: [
      ["Sports Scholarship Eligibility Checker", "Eligibilite bourse sportive"],
      ["Sports scholarship", "Bourse sportive"],
      ["Eligibility", "Eligibilite"],
      ["Grades", "Notes"],
      ["Highlights video", "Video sportive"],
      ["Deadline", "Date limite"],
    ],
  },
  {
    enSlug: "waste-management",
    frSlug: "cout-gestion-dechets",
    title: "Calculateur cout gestion dechets | AfroTools",
    name: "Gestion dechets",
    description:
      "Estimez collecte, tri, sacs, transport, recyclage, compostage et frais.",
    eyebrow: "Climat et operations",
    lead:
      "Comparez les couts d'un plan de gestion des dechets pour site, evenement ou PME.",
    useCase:
      "Utile pour PME, ecoles, marches, evenements, communes et ONG environnement.",
    safety:
      "Respectez les regles locales pour dechets dangereux, medicaux, batteries et incineration.",
    related:
      "A combiner avec revenus recyclage, dechets electroniques et score durabilite.",
    terms: [
      ["Waste Management Cost for Africa", "Calculateur cout gestion dechets"],
      ["Waste", "Dechets"],
      ["Collection", "Collecte"],
      ["Sorting", "Tri"],
      ["Recycling", "Recyclage"],
      ["Composting", "Compostage"],
    ],
  },
  {
    enSlug: "fence-cost",
    frSlug: "cout-cloture",
    title: "Calculateur cout cloture | AfroTools",
    name: "Cout cloture",
    description:
      "Estimez longueur, materiau, poteaux, main-d'oeuvre, portail et marge chantier.",
    eyebrow: "Construction",
    lead:
      "Preparez un budget de cloture pour maison, ferme, ecole, chantier ou depot.",
    useCase:
      "Utile pour proprietaires, entrepreneurs, agriculteurs, ecoles et gestionnaires de site.",
    safety:
      "Confirmez limites foncieres, permis, qualite des materiaux et devis avant construction.",
    related:
      "A combiner avec cout piscine, fosse septique et frais registre foncier.",
    terms: [
      ["Fence Cost Calculator", "Calculateur cout cloture"],
      ["Fence", "Cloture"],
      ["Length", "Longueur"],
      ["Posts", "Poteaux"],
      ["Gate", "Portail"],
      ["Labour", "Main-d'oeuvre"],
    ],
  },
  {
    enSlug: "gaming-pc-build",
    frSlug: "configuration-pc-gaming",
    title: "Configurateur PC gaming | AfroTools",
    name: "PC gaming",
    description:
      "Estimez CPU, GPU, memoire, stockage, ecran, alimentation et budget total.",
    eyebrow: "Gaming et materiel",
    lead:
      "Comparez une configuration PC avant achat local, importation ou mise a niveau.",
    useCase:
      "Utile pour gamers, createurs, etudiants, cybercafes et petites equipes esport.",
    safety:
      "Verifiez compatibilite, garantie, frais d'importation, alimentation et disponibilite locale.",
    related:
      "A combiner avec prix photo video, createurs et convertisseur devise.",
    terms: [
      ["Gaming PC Build Calculator Africa", "Configurateur PC gaming"],
      ["Gaming PC", "PC gaming"],
      ["GPU", "GPU"],
      ["CPU", "CPU"],
      ["Memory", "Memoire"],
      ["Power supply", "Alimentation"],
    ],
  },
  {
    enSlug: "recycling-revenue",
    frSlug: "revenus-recyclage",
    title: "Estimateur revenus recyclage | AfroTools",
    name: "Revenus recyclage",
    description:
      "Estimez poids, matiere, prix indicatif, tri, transport et marge de collecte.",
    eyebrow: "Climat et economie locale",
    lead:
      "Preparez une estimation avant collecte, rachat, cooperative ou campagne de recyclage.",
    useCase:
      "Utile pour collecteurs, cooperatives, ecoles, ONG, PME et communes.",
    safety:
      "Les prix changent vite selon qualite, volume, distance et acheteur local.",
    related:
      "A combiner avec dechets electroniques, gestion dechets et score durabilite.",
    terms: [
      ["Recycling Revenue for Africa", "Estimateur revenus recyclage"],
      ["Recycling", "Recyclage"],
      ["Material", "Matiere"],
      ["Weight", "Poids"],
      ["Buyer", "Acheteur"],
      ["Margin", "Marge"],
    ],
  },
  {
    enSlug: "dj-booking-rate",
    frSlug: "tarif-dj",
    title: "Calculateur tarif DJ | AfroTools",
    name: "Tarif DJ",
    description:
      "Estimez duree, evenement, materiel, transport, equipe, cachet et marge.",
    eyebrow: "Createurs et evenements",
    lead:
      "Calculez un tarif de prestation DJ avant devis, negotiation ou reservation.",
    useCase:
      "Utile pour DJ, organisateurs, salles, mariages, clubs et evenements corporate.",
    safety:
      "Clarifiez acompte, annulation, droits musicaux, horaire et besoins techniques par contrat.",
    related:
      "A combiner avec budget concert, revenus billetterie et prix photo video.",
    terms: [
      ["DJ Booking Rate Calculator Africa", "Calculateur tarif DJ"],
      ["DJ", "DJ"],
      ["Booking", "Reservation"],
      ["Event", "Evenement"],
      ["Equipment", "Materiel"],
      ["Fee", "Cachet"],
    ],
  },
  {
    enSlug: "photo-video-pricing",
    frSlug: "prix-photo-video",
    title: "Calculateur prix photo video | AfroTools",
    name: "Prix photo video",
    description:
      "Estimez tournage, montage, materiel, transport, assistants, licences et marge.",
    eyebrow: "Createurs et services",
    lead:
      "Preparez un devis clair pour mariage, evenement, marque, artiste ou entreprise.",
    useCase:
      "Utile pour photographes, videastes, createurs, agences et organisateurs.",
    safety:
      "Precisez livrables, revisions, droits d'usage, acompte et delais dans le devis.",
    related:
      "A combiner avec tarif DJ, budget concert et redevances streaming.",
    terms: [
      ["Photography and Videography Pricing Tool Africa", "Calculateur prix photo video"],
      ["Photography", "Photographie"],
      ["Videography", "Videographie"],
      ["Editing", "Montage"],
      ["Deliverables", "Livrables"],
      ["Usage rights", "Droits d'usage"],
    ],
  },
  {
    enSlug: "rainfall-tracker",
    frSlug: "suivi-pluviometrie",
    title: "Suivi pluviometrie | AfroTools",
    name: "Suivi pluviometrie",
    description:
      "Notez pluie, date, lieu, saison, tendance, besoins eau et observations.",
    eyebrow: "Climat et agriculture",
    lead:
      "Organisez les releves de pluie pour ferme, ecole, communaute ou petit projet climat.",
    useCase:
      "Utile pour agriculteurs, ecoles, cooperatives, ONG, communes et equipes terrain.",
    safety:
      "Les mesures locales doivent etre comparees aux donnees meteorologiques officielles si disponibles.",
    related:
      "A combiner avec risque secheresse, penurie d'eau et volume irrigation.",
    terms: [
      ["Rainfall Pattern Tracker for Africa", "Suivi pluviometrie"],
      ["Rainfall", "Pluviometrie"],
      ["Rain gauge", "Pluviometre"],
      ["Season", "Saison"],
      ["Trend", "Tendance"],
      ["Observation", "Observation"],
    ],
  },
  {
    enSlug: "septic-tank",
    frSlug: "dimensionnement-fosse-septique",
    title: "Calculateur dimension fosse septique | AfroTools",
    name: "Fosse septique",
    description:
      "Estimez habitants, debit, volume, vidange, sol, distance et marge chantier.",
    eyebrow: "Construction et assainissement",
    lead:
      "Preparez un premier dimensionnement avant devis, inspection ou discussion avec un technicien.",
    useCase:
      "Utile pour proprietaires, entrepreneurs, ecoles, cliniques et petits sites ruraux.",
    safety:
      "Confirmez toujours normes, sol, nappe, distances sanitaires et permis avec un professionnel local.",
    related:
      "A combiner avec cout cloture, cout piscine et materiaux de construction.",
    terms: [
      ["Septic Tank Size Calculator", "Calculateur dimension fosse septique"],
      ["Septic tank", "Fosse septique"],
      ["Volume", "Volume"],
      ["Household", "Menage"],
      ["Drainage", "Drainage"],
      ["Maintenance", "Entretien"],
    ],
  },
  {
    enSlug: "gym-roi-business",
    frSlug: "roi-salle-sport",
    title: "Calculateur ROI salle de sport | AfroTools",
    name: "ROI salle de sport",
    description:
      "Estimez membres, abonnements, loyer, equipement, coachs, marketing et marge.",
    eyebrow: "Sports business",
    lead:
      "Evaluez la rentabilite d'une salle de sport avant lancement, extension ou reprise.",
    useCase:
      "Utile pour fondateurs, coachs, investisseurs, franchises et gestionnaires de club.",
    safety:
      "Comparez avec donnees locales, saisonnalite, retention et couts reels avant decision.",
    related:
      "A combiner avec cout salle de sport, taux attrition et economie unitaire.",
    terms: [
      ["Gym and Fitness Center ROI Calculator", "Calculateur ROI salle de sport"],
      ["Gym", "Salle de sport"],
      ["ROI", "ROI"],
      ["Members", "Membres"],
      ["Subscription", "Abonnement"],
      ["Operating cost", "Cout operationnel"],
    ],
  },
  {
    enSlug: "architectural-fee",
    frSlug: "honoraires-architecte",
    title: "Calculateur honoraires architecte | AfroTools",
    name: "Honoraires architecte",
    description:
      "Estimez surface, complexite, plans, revisions, suivi chantier et frais.",
    eyebrow: "Construction",
    lead:
      "Preparez une estimation d'honoraires avant briefing, devis ou contrat de conception.",
    useCase:
      "Utile pour proprietaires, promoteurs, architectes, PME et equipes chantier.",
    safety:
      "Les honoraires varient selon pays, licence, scope, responsabilites et contrat signe.",
    related:
      "A combiner avec cout cloture, fosse septique et cout construction route.",
    terms: [
      ["Architectural Drawing Fee Calculator", "Calculateur honoraires architecte"],
      ["Architect", "Architecte"],
      ["Design fee", "Honoraires"],
      ["Drawings", "Plans"],
      ["Revision", "Revision"],
      ["Site supervision", "Suivi chantier"],
    ],
  },
  {
    enSlug: "betting-odds",
    frSlug: "cotes-paris-sportifs",
    title: "Calculateur cotes paris sportifs | AfroTools",
    name: "Cotes paris sportifs",
    description:
      "Convertissez cotes, probabilite implicite, mise, gain potentiel et valeur indicative.",
    eyebrow: "Sports",
    lead:
      "Comprenez les cotes avant d'analyser un pari, un article ou un exemple de probabilite.",
    useCase:
      "Utile pour fans, analystes, journalistes sportifs et contenus educatifs.",
    safety:
      "Cet outil n'encourage pas le pari; respectez la loi locale et fixez des limites strictes.",
    related:
      "A combiner avec taxe paris sportifs, fantasy football et prediction CAN.",
    terms: [
      ["Football Betting Odds Calculator", "Calculateur cotes paris sportifs"],
      ["Odds", "Cotes"],
      ["Probability", "Probabilite"],
      ["Stake", "Mise"],
      ["Payout", "Gain"],
      ["Value", "Valeur"],
    ],
  },
  {
    enSlug: "ebola-checklist",
    frSlug: "checklist-ebola",
    title: "Checklist preparation Ebola | AfroTools",
    name: "Checklist Ebola",
    description:
      "Passez en revue symptomes, exposition, isolement, contacts, alerte et protection.",
    eyebrow: "Sante publique",
    lead:
      "Organisez les points de preparation et d'orientation pendant une alerte sanitaire.",
    useCase:
      "Utile pour familles, ecoles, agents communautaires, ONG et equipes terrain.",
    safety:
      "Suivez les consignes officielles; en cas de suspicion, contactez rapidement les services de sante.",
    related:
      "A combiner avec risque cholera, couts clinique et contribution sante.",
    terms: [
      ["Ebola Preparedness Checklist", "Checklist preparation Ebola"],
      ["Ebola", "Ebola"],
      ["Symptoms", "Symptomes"],
      ["Exposure", "Exposition"],
      ["Isolation", "Isolement"],
      ["Contacts", "Contacts"],
    ],
  },
  {
    enSlug: "fantasy-football",
    frSlug: "points-fantasy-football",
    title: "Calculateur points fantasy football | AfroTools",
    name: "Fantasy football",
    description:
      "Estimez buts, passes, minutes, clean sheet, cartons, bonus et score joueur.",
    eyebrow: "Sports",
    lead:
      "Preparez une estimation de points pour jeu fantasy, contenu ou comparaison de joueurs.",
    useCase:
      "Utile pour fans, createurs sportifs, ligues fantasy et analystes de match.",
    safety:
      "Les regles de points varient selon plateforme; verifiez toujours le reglement du jeu.",
    related:
      "A combiner avec prediction CAN, billets match et cotes paris sportifs.",
    terms: [
      ["Fantasy Football Points Calculator", "Calculateur points fantasy football"],
      ["Fantasy football", "Fantasy football"],
      ["Goals", "Buts"],
      ["Assists", "Passes decisives"],
      ["Clean sheet", "Clean sheet"],
      ["Bonus", "Bonus"],
    ],
  },
  {
    enSlug: "afcon-predictor",
    frSlug: "predicteur-can",
    title: "Predicteur CAN | AfroTools",
    name: "Predicteur CAN",
    description:
      "Comparez equipes, groupes, forme, probabilites indicatives et scenario tournoi.",
    eyebrow: "Football africain",
    lead:
      "Explorez des scenarios de Coupe d'Afrique pour contenu, discussions et planification sportive.",
    useCase:
      "Utile pour fans, createurs, journalistes, analystes et communautes football.",
    safety:
      "Les predictions sont ludiques et indicatives; les resultats reels dependent du terrain.",
    related:
      "A combiner avec fantasy football, billets match et cotes paris sportifs.",
    terms: [
      ["AFCON Tournament Predictor", "Predicteur CAN"],
      ["AFCON", "CAN"],
      ["Prediction", "Prediction"],
      ["Group", "Groupe"],
      ["Knockout", "Phase finale"],
      ["Probability", "Probabilite"],
    ],
  },
  {
    enSlug: "deforestation",
    frSlug: "impact-deforestation",
    title: "Estimateur impact deforestation | AfroTools",
    name: "Impact deforestation",
    description:
      "Estimez surface, arbres, carbone indicatif, biodiversite, eau et cout local.",
    eyebrow: "Climat",
    lead:
      "Structurez une estimation d'impact pour sensibilisation, projet, article ou discussion publique.",
    useCase:
      "Utile pour ONG, ecoles, chercheurs, journalistes, communes et equipes climat.",
    safety:
      "Les impacts reels demandent donnees locales, inventaire terrain et expertise environnementale.",
    related:
      "A combiner avec plantation arbres, credits carbone et score durabilite.",
    terms: [
      ["Deforestation Impact for Africa", "Estimateur impact deforestation"],
      ["Deforestation", "Deforestation"],
      ["Forest area", "Surface forestiere"],
      ["Carbon", "Carbone"],
      ["Biodiversity", "Biodiversite"],
      ["Water", "Eau"],
    ],
  },
  {
    enSlug: "swimming-pool-cost",
    frSlug: "cout-piscine",
    title: "Estimateur cout piscine | AfroTools",
    name: "Cout piscine",
    description:
      "Estimez taille, terrassement, revetement, pompe, filtration, securite et entretien.",
    eyebrow: "Construction",
    lead:
      "Preparez un budget prudent avant devis piscine, renovation ou amenagement d'hotel.",
    useCase:
      "Utile pour proprietaires, hotels, ecoles, entrepreneurs et gestionnaires d'espaces.",
    safety:
      "Confirmez normes de securite, drainage, electricite, permis et entretien avec des pros locaux.",
    related:
      "A combiner avec fosse septique, honoraires architecte et cout cloture.",
    terms: [
      ["Swimming Pool Cost Estimator", "Estimateur cout piscine"],
      ["Swimming pool", "Piscine"],
      ["Excavation", "Terrassement"],
      ["Pump", "Pompe"],
      ["Filtration", "Filtration"],
      ["Maintenance", "Entretien"],
    ],
  },
  {
    enSlug: "nollywood-box-office",
    frSlug: "box-office-nollywood",
    title: "Estimateur box-office Nollywood | AfroTools",
    name: "Box-office Nollywood",
    description:
      "Estimez salles, billets, prix moyen, partage cinema, marketing et revenu net.",
    eyebrow: "Cinema africain",
    lead:
      "Cadrez les revenus potentiels d'une sortie film avant budget, distribution ou promotion.",
    useCase:
      "Utile pour producteurs, distributeurs, createurs, analystes et etudiants cinema.",
    safety:
      "Les revenus reels dependent de distribution, calendrier, marketing, piratage et accords salles.",
    related:
      "A combiner avec budget album, prix photo video et revenus streaming.",
    terms: [
      ["Nollywood Box Office Estimator", "Estimateur box-office Nollywood"],
      ["Box office", "Box-office"],
      ["Ticket", "Billet"],
      ["Cinema", "Cinema"],
      ["Distributor", "Distributeur"],
      ["Net revenue", "Revenu net"],
    ],
  },
  {
    enSlug: "athlete-earnings",
    frSlug: "revenus-carriere-athlete",
    title: "Calculateur revenus carriere athlete | AfroTools",
    name: "Revenus athlete",
    description:
      "Estimez salaire, primes, sponsoring, agent, impots, duree carriere et epargne.",
    eyebrow: "Sports business",
    lead:
      "Visualisez les revenus et couts possibles d'une carriere sportive sur plusieurs annees.",
    useCase:
      "Utile pour athletes, familles, agents, academies, coachs et conseillers financiers.",
    safety:
      "Les revenus sportifs sont incertains; validez contrats, fiscalite et assurance avec experts.",
    related:
      "A combiner avec bourse sportive, billets match et planificateur retraite.",
    terms: [
      ["Athlete Career Earnings Calculator Africa", "Calculateur revenus carriere athlete"],
      ["Athlete", "Athlete"],
      ["Salary", "Salaire"],
      ["Bonus", "Primes"],
      ["Sponsorship", "Sponsoring"],
      ["Agent", "Agent"],
    ],
  },
  {
    enSlug: "match-tickets",
    frSlug: "prix-billets-match",
    title: "Comparateur prix billets match | AfroTools",
    name: "Billets match",
    description:
      "Comparez categorie, stade, frais, transport, revente et budget jour de match.",
    eyebrow: "Sports",
    lead:
      "Estimez le cout total d'une journee de match avant achat ou voyage.",
    useCase:
      "Utile pour fans, familles, clubs, groupes supporters et organisateurs de voyage.",
    safety:
      "Achetez via canaux officiels quand possible; verifiez frais, conditions et risques de fraude.",
    related:
      "A combiner avec prediction CAN, fantasy football et budget voyage.",
    terms: [
      ["Match Ticket Price Comparator Africa", "Comparateur prix billets match"],
      ["Match ticket", "Billet match"],
      ["Stadium", "Stade"],
      ["Category", "Categorie"],
      ["Fees", "Frais"],
      ["Transport", "Transport"],
    ],
  },
  {
    enSlug: "affidavit-generator",
    frSlug: "generateur-affidavit",
    title: "Generateur affidavit | AfroTools",
    name: "Affidavit",
    description:
      "Preparez declarant, faits, pieces, temoins, signature et note de verification.",
    eyebrow: "Documents juridiques",
    lead:
      "Structurez un brouillon d'affidavit avant impression, revue ou depot local.",
    useCase:
      "Utile pour particuliers, PME, parajuristes, ONG et equipes administratives.",
    safety:
      "Ce modele n'est pas un avis juridique; verifiez format, serment et depot avec l'autorite locale.",
    related:
      "A combiner avec frais tribunal, generateur testament et modele demande information.",
    terms: [
      ["Affidavit Generator Africa", "Generateur affidavit"],
      ["Affidavit", "Affidavit"],
      ["Declarant", "Declarant"],
      ["Statement", "Declaration"],
      ["Witness", "Temoin"],
      ["Signature", "Signature"],
    ],
  },
  {
    enSlug: "africa-flight",
    frSlug: "prix-vols-afrique",
    title: "Suivi prix vols Afrique | AfroTools",
    name: "Prix vols Afrique",
    description:
      "Comparez origine, destination, saison, bagages, taxes, escales et budget total.",
    eyebrow: "Voyage",
    lead:
      "Preparez une comparaison de couts avant reservation, voyage regional ou deplacement pro.",
    useCase:
      "Utile pour voyageurs, familles, PME, organisateurs et equipes de tourisme.",
    safety:
      "Les tarifs changent vite; verifiez prix final, conditions, visa et bagages avec la compagnie.",
    related:
      "A combiner avec assurance voyage, transfert aeroport et budget voyage.",
    terms: [
      ["Africa Domestic Flight Price Tracker", "Suivi prix vols Afrique"],
      ["Flight", "Vol"],
      ["Fare", "Tarif"],
      ["Baggage", "Bagages"],
      ["Stopover", "Escale"],
      ["Taxes", "Taxes"],
    ],
  },
  {
    enSlug: "african-api-directory",
    frSlug: "annuaire-api-africaines",
    title: "Annuaire API africaines | AfroTools",
    name: "API africaines",
    description:
      "Explorez API fintech, telecom, gouvernement, donnees, frais, docs et statut.",
    eyebrow: "Developpeurs",
    lead:
      "Organisez une premiere recherche d'API africaines avant integration ou prototype.",
    useCase:
      "Utile pour developpeurs, startups, equipes produit, hackathons et analystes tech.",
    safety:
      "Confirmez documentation, SLA, tarification, conformite donnees et support directement a la source.",
    related:
      "A combiner avec testeur API, domaines africains et generateur commit.",
    terms: [
      ["African API Directory", "Annuaire API africaines"],
      ["API", "API"],
      ["Fintech", "Fintech"],
      ["Documentation", "Documentation"],
      ["Integration", "Integration"],
      ["Status", "Statut"],
    ],
  },
  {
    enSlug: "african-domains",
    frSlug: "verificateur-domaines-africains",
    title: "Verificateur domaines africains | AfroTools",
    name: "Domaines africains",
    description:
      "Comparez extensions, disponibilite, usage, prix indicatif et registrar.",
    eyebrow: "Developpeurs",
    lead:
      "Preparez une shortlist de domaines africains avant achat, marque ou lancement produit.",
    useCase:
      "Utile pour startups, agences, createurs, ONG, PME et equipes produit.",
    safety:
      "Confirmez disponibilite, prix, regles d'eligibilite et renouvellement chez le registrar.",
    related:
      "A combiner avec annuaire API africaines, hebergement et generateur meta tags.",
    terms: [
      ["African Domain Checker", "Verificateur domaines africains"],
      ["Domain", "Domaine"],
      ["TLD", "Extension"],
      ["Registrar", "Registrar"],
      ["Availability", "Disponibilite"],
      ["Renewal", "Renouvellement"],
    ],
  },
  {
    enSlug: "african-palette",
    frSlug: "palette-couleurs-africaines",
    title: "Generateur palette couleurs africaines | AfroTools",
    name: "Palette africaine",
    description:
      "Creez palettes, codes hex, contrastes, usages marque et notes d'inspiration.",
    eyebrow: "Design",
    lead:
      "Explorez des palettes visuelles pour marque, affiche, site, produit ou contenu culturel.",
    useCase:
      "Utile pour designers, createurs, PME, etudiants, artistes et equipes marketing.",
    safety:
      "Verifiez contraste, lisibilite et sensibilite culturelle avant usage public.",
    related:
      "A combiner avec selecteur couleur, contraste couleurs et createur de logo.",
    terms: [
      ["African Color Palette Generator", "Generateur palette couleurs africaines"],
      ["Palette", "Palette"],
      ["Color", "Couleur"],
      ["Hex", "Hex"],
      ["Contrast", "Contraste"],
      ["Brand", "Marque"],
    ],
  },
  {
    enSlug: "african-proverbs",
    frSlug: "generateur-proverbes-africains",
    title: "Generateur proverbes africains | AfroTools",
    name: "Proverbes africains",
    description:
      "Explorez proverbes, themes, contexte, langue, usage et notes de verification.",
    eyebrow: "Culture",
    lead:
      "Trouvez une inspiration culturelle pour discours, classe, contenu ou recherche.",
    useCase:
      "Utile pour enseignants, createurs, familles, auteurs, medias et etudiants.",
    safety:
      "Confirmez origine, traduction et contexte avec des sources culturelles fiables.",
    related:
      "A combiner avec prenom africain, calendrier traditionnel et palette africaine.",
    terms: [
      ["African Proverb Generator", "Generateur proverbes africains"],
      ["Proverb", "Proverbe"],
      ["Theme", "Theme"],
      ["Language", "Langue"],
      ["Meaning", "Signification"],
      ["Context", "Contexte"],
    ],
  },
  {
    enSlug: "album-budget",
    frSlug: "budget-album-ep",
    title: "Budget album et EP | AfroTools",
    name: "Budget album EP",
    description:
      "Estimez studio, production, mixage, mastering, visuels, distribution et promo.",
    eyebrow: "Musique",
    lead:
      "Cadrez les couts d'un projet musical avant enregistrement, sortie ou campagne.",
    useCase:
      "Utile pour artistes, managers, labels, producteurs et createurs independants.",
    safety:
      "Les couts varient selon studio, droits, equipe, calendrier et strategie de sortie.",
    related:
      "A combiner avec redevances streaming, prix photo video et tarif DJ.",
    terms: [
      ["Album / EP Release Budget Calculator", "Budget album et EP"],
      ["Album", "Album"],
      ["EP", "EP"],
      ["Studio", "Studio"],
      ["Mastering", "Mastering"],
      ["Promotion", "Promotion"],
    ],
  },
  {
    enSlug: "ankara-kente-cost",
    frSlug: "cout-ankara-kente",
    title: "Calculateur cout Ankara Kente | AfroTools",
    name: "Cout Ankara Kente",
    description:
      "Estimez tissu, metrage, couture, broderie, accessoires, retouches et marge.",
    eyebrow: "Mode africaine",
    lead:
      "Preparez un budget de tenue ou collection avant achat tissu, atelier ou evenement.",
    useCase:
      "Utile pour tailleurs, createurs, familles, boutiques, stylistes et organisateurs.",
    safety:
      "Confirmez qualite, mesures, delais, pertes tissu et retouches avant commande.",
    related:
      "A combiner avec cout Aso-Ebi, tenue traditionnelle et budget mariage africain.",
    terms: [
      ["Ankara / Kente Pattern Cost Calculator", "Calculateur cout Ankara Kente"],
      ["Ankara", "Ankara"],
      ["Kente", "Kente"],
      ["Fabric", "Tissu"],
      ["Tailoring", "Couture"],
      ["Alterations", "Retouches"],
    ],
  },
  {
    enSlug: "annual-returns",
    frSlug: "declarations-annuelles-societes",
    title: "Guide declarations annuelles societes | AfroTools",
    name: "Declarations annuelles",
    description:
      "Preparez entreprise, registre, echeance, frais, pieces et suivi de depot.",
    eyebrow: "Conformite entreprise",
    lead:
      "Structurez une checklist avant depot de declaration annuelle ou mise a jour de registre.",
    useCase:
      "Utile pour PME, secretaires societes, fondateurs, comptables et conseillers.",
    safety:
      "Verifiez les exigences officielles, penalites, dates et formulaires du registre local.",
    related:
      "A combiner avec licence entreprise, resolution conseil et enregistrement entreprise.",
    terms: [
      ["Annual Returns Filing Guide", "Guide declarations annuelles societes"],
      ["Annual return", "Declaration annuelle"],
      ["Company registry", "Registre societes"],
      ["Deadline", "Echeance"],
      ["Penalty", "Penalite"],
      ["Filing", "Depot"],
    ],
  },
  {
    enSlug: "art-commission",
    frSlug: "prix-commande-art",
    title: "Calculateur prix commande art | AfroTools",
    name: "Commande art",
    description:
      "Estimez temps, format, materiaux, complexite, licence, livraison et marge.",
    eyebrow: "Createurs",
    lead:
      "Preparez un prix juste pour commande artistique, illustration, portrait ou piece unique.",
    useCase:
      "Utile pour artistes, designers, clients, agences et createurs independants.",
    safety:
      "Clarifiez acompte, droits d'usage, revisions, livraison et annulation par ecrit.",
    related:
      "A combiner avec prix photo video, palette africaine et design graphique.",
    terms: [
      ["Art Commission Price Calculator", "Calculateur prix commande art"],
      ["Art commission", "Commande art"],
      ["Materials", "Materiaux"],
      ["Complexity", "Complexite"],
      ["License", "Licence"],
      ["Revision", "Revision"],
    ],
  },
  {
    enSlug: "bail-calculator",
    frSlug: "calculateur-caution-penale",
    title: "Calculateur caution penale | AfroTools",
    name: "Caution penale",
    description:
      "Estimez fourchette indicative, infraction, risque, garanties, frais et audience.",
    eyebrow: "Justice",
    lead:
      "Comprenez les facteurs possibles avant discussion avec avocat, famille ou tribunal.",
    useCase:
      "Utile pour familles, parajuristes, ONG, journalistes et services d'aide juridique.",
    safety:
      "Ce n'est pas un avis juridique; seules les autorites et tribunaux competents decident.",
    related:
      "A combiner avec frais tribunal, aide juridique et generateur affidavit.",
    terms: [
      ["Bail Calculator Africa", "Calculateur caution penale"],
      ["Bail", "Caution"],
      ["Court", "Tribunal"],
      ["Offence", "Infraction"],
      ["Hearing", "Audience"],
      ["Legal advice", "Avis juridique"],
    ],
  },
  {
    enSlug: "board-resolution",
    frSlug: "modele-resolution-conseil",
    title: "Modele resolution conseil | AfroTools",
    name: "Resolution conseil",
    description:
      "Preparez societe, decision, administrateurs, quorum, signature et annexes.",
    eyebrow: "Documents entreprise",
    lead:
      "Generez une base de resolution pour approbation interne, banque ou registre.",
    useCase:
      "Utile pour fondateurs, secretaires societes, PME, associations et conseillers.",
    safety:
      "Verifiez statuts, pouvoirs, quorum et exigences legales avant signature ou depot.",
    related:
      "A combiner avec declarations annuelles, licence entreprise et generateur NDA.",
    terms: [
      ["Board Resolution Template Generator", "Modele resolution conseil"],
      ["Board resolution", "Resolution conseil"],
      ["Director", "Administrateur"],
      ["Quorum", "Quorum"],
      ["Signature", "Signature"],
      ["Company", "Societe"],
    ],
  },
  {
    enSlug: "book-publishing-cost",
    frSlug: "cout-publication-livre",
    title: "Calculateur cout publication livre | AfroTools",
    name: "Publication livre",
    description:
      "Estimez edition, couverture, ISBN, impression, distribution, marketing et marge.",
    eyebrow: "Edition",
    lead:
      "Cadrez le budget d'un livre avant auto-edition, impression ou lancement.",
    useCase:
      "Utile pour auteurs, editeurs, createurs, ecoles, ONG et librairies.",
    safety:
      "Confirmez droits, contrats, qualite impression, distribution et taxes avant paiement.",
    related:
      "A combiner avec prix commande art, budget album et revenus createur.",
    terms: [
      ["Book Publishing Cost Calculator", "Calculateur cout publication livre"],
      ["Book", "Livre"],
      ["Publishing", "Publication"],
      ["ISBN", "ISBN"],
      ["Printing", "Impression"],
      ["Distribution", "Distribution"],
    ],
  },
  {
    enSlug: "brand-collab-roi",
    frSlug: "roi-collaboration-marque",
    title: "Calculateur ROI collaboration marque | AfroTools",
    name: "ROI collaboration marque",
    description:
      "Estimez cout createur, audience, conversions, ventes, marge et retour campagne.",
    eyebrow: "Marketing",
    lead:
      "Comparez une collaboration marque-createur avant brief, contrat ou campagne.",
    useCase:
      "Utile pour marques, createurs, agences, PME, managers et equipes croissance.",
    safety:
      "Utilisez donnees reelles, objectifs clairs, droits d'usage et etiquetage sponsorise.",
    related:
      "A combiner avec taux engagement, tarif influenceur et prix photo video.",
    terms: [
      ["Brand Collaboration ROI Calculator", "Calculateur ROI collaboration marque"],
      ["Brand collaboration", "Collaboration marque"],
      ["Creator", "Createur"],
      ["Conversion", "Conversion"],
      ["Campaign", "Campagne"],
      ["ROI", "ROI"],
    ],
  },
  {
    enSlug: "breach-notification",
    frSlug: "notification-violation-donnees",
    title: "Modele notification violation donnees | AfroTools",
    name: "Violation donnees",
    description:
      "Preparez incident, donnees touchees, risques, mesures, delais et contacts.",
    eyebrow: "Protection donnees",
    lead:
      "Structurez une notification initiale avant revue juridique, DPO ou autorite competente.",
    useCase:
      "Utile pour PME, DPO, startups, ONG, equipes securite et responsables operations.",
    safety:
      "Confirmez obligations, delais, contenu et destinataires avec un conseil qualifie.",
    related:
      "A combiner avec DPA, DPIA, cookie consent et cout violation donnees.",
    terms: [
      ["Data Breach Notification Template Generator", "Modele notification violation donnees"],
      ["Data breach", "Violation donnees"],
      ["Notification", "Notification"],
      ["Affected data", "Donnees touchees"],
      ["Regulator", "Autorite"],
      ["Deadline", "Delai"],
    ],
  },
  {
    enSlug: "business-continuity",
    frSlug: "plan-continuite-activite",
    title: "Generateur plan continuite activite | AfroTools",
    name: "Continuite activite",
    description:
      "Preparez risques, processus critiques, contacts, sauvegardes, reprise et tests.",
    eyebrow: "Operations",
    lead:
      "Construisez une base de plan de continuite pour PME, equipe, ecole ou association.",
    useCase:
      "Utile pour PME, ONG, ecoles, equipes operations, fondateurs et responsables IT.",
    safety:
      "Testez le plan, mettez-le a jour et adaptez-le aux risques locaux et contrats.",
    related:
      "A combiner avec cybersecurite, assurance entreprise et cout coupure entreprise.",
    terms: [
      ["Business Continuity Plan Generator", "Generateur plan continuite activite"],
      ["Business continuity", "Continuite activite"],
      ["Risk", "Risque"],
      ["Backup", "Sauvegarde"],
      ["Recovery", "Reprise"],
      ["Test", "Test"],
    ],
  },
  {
    enSlug: "business-license",
    frSlug: "licence-entreprise",
    title: "Guide licence entreprise | AfroTools",
    name: "Licence entreprise",
    description:
      "Preparez activite, pays, secteur, pieces, frais, delais et autorite competente.",
    eyebrow: "Formalites entreprise",
    lead:
      "Cadrez les exigences de licence avant lancement, renouvellement ou expansion pays.",
    useCase:
      "Utile pour fondateurs, PME, consultants, chambres de commerce et equipes operations.",
    safety:
      "Verifiez exigences officielles, frais et delais directement aupres des autorites locales.",
    related:
      "A combiner avec declarations annuelles, enregistrement entreprise et forme societe.",
    terms: [
      ["Business License Requirements", "Guide licence entreprise"],
      ["Business license", "Licence entreprise"],
      ["Permit", "Permis"],
      ["Industry", "Secteur"],
      ["Authority", "Autorite"],
      ["Renewal", "Renouvellement"],
    ],
  },
  {
    enSlug: "commit-message-gen",
    frSlug: "generateur-message-commit",
    title: "Generateur message de commit | AfroTools",
    name: "Message de commit",
    description:
      "Creez messages Conventional Commits avec type, scope, resume, corps et breaking change.",
    eyebrow: "Developpeurs",
    lead:
      "Transformez une description de changement en message de commit propre et coherent.",
    useCase:
      "Utile pour developpeurs, equipes produit, etudiants, mainteneurs et bootcamps.",
    safety:
      "Relisez toujours le message pour verifier exactitude, confidentialite et conventions d'equipe.",
    related:
      "A combiner avec formatteur JSON, testeur regex et annuaire API africaines.",
    terms: [
      ["Commit Message Generator", "Generateur message de commit"],
      ["Commit", "Commit"],
      ["Conventional Commits", "Conventional Commits"],
      ["Scope", "Scope"],
      ["Summary", "Resume"],
      ["Breaking change", "Breaking change"],
    ],
  },
  {
    enSlug: "contractor-vs-employee",
    frSlug: "contractant-vs-salarie",
    title: "Contractant vs salarie | AfroTools",
    name: "Contractant vs salarie",
    description:
      "Comparez salaire, charges, avantages, risques de classification et cout total.",
    eyebrow: "RH et paie",
    lead:
      "Cadrez une comparaison de statut avant embauche, contrat de service ou budget RH.",
    useCase:
      "Utile pour PME, RH, fondateurs, freelances, comptables et conseillers.",
    safety:
      "La classification depend du droit local; confirmez contrat, impots et obligations avec un expert.",
    related:
      "A combiner avec cout total employe, contrat freelance et salaire employe maison.",
    terms: [
      ["Contractor vs Employee Cost", "Contractant vs salarie"],
      ["Contractor", "Contractant"],
      ["Employee", "Salarie"],
      ["Benefits", "Avantages"],
      ["Payroll tax", "Charges paie"],
      ["Misclassification", "Mauvaise classification"],
    ],
  },
  {
    enSlug: "cookie-consent",
    frSlug: "banniere-consentement-cookies",
    title: "Generateur banniere consentement cookies | AfroTools",
    name: "Consentement cookies",
    description:
      "Preparez categories, finalites, boutons, texte, preference et note de conformite.",
    eyebrow: "Protection donnees",
    lead:
      "Creez une base de banniere cookies avant revue juridique et integration site.",
    useCase:
      "Utile pour PME, startups, agences, boutiques en ligne et equipes produit.",
    safety:
      "Verifiez les obligations locales, GDPR/NDPA/POPIA et le comportement technique reel.",
    related:
      "A combiner avec DPA, DPIA et notification violation donnees.",
    terms: [
      ["Cookie Consent Banner Generator", "Generateur banniere consentement cookies"],
      ["Cookie", "Cookie"],
      ["Consent", "Consentement"],
      ["Preference", "Preference"],
      ["Purpose", "Finalite"],
      ["Compliance", "Conformite"],
    ],
  },
  {
    enSlug: "crop-insurance-calc",
    frSlug: "assurance-recolte",
    title: "Calculateur assurance recolte | AfroTools",
    name: "Assurance recolte",
    description:
      "Estimez surface, culture, prime, franchise, indemnisation et risque saisonnier.",
    eyebrow: "Assurance agricole",
    lead:
      "Preparez une estimation avant discussion avec assureur, cooperative ou programme agricole.",
    useCase:
      "Utile pour agriculteurs, cooperatives, agents terrain, ONG et conseillers agricoles.",
    safety:
      "Les garanties dependent du contrat, du pays, des exclusions et de la verification des pertes.",
    related:
      "A combiner avec risque secheresse, suivi pluviometrie et rendement agricole.",
    terms: [
      ["Crop Insurance Calculator", "Calculateur assurance recolte"],
      ["Crop insurance", "Assurance recolte"],
      ["Premium", "Prime"],
      ["Deductible", "Franchise"],
      ["Payout", "Indemnisation"],
      ["Risk", "Risque"],
    ],
  },
  {
    enSlug: "cross-border-data",
    frSlug: "checklist-transfert-donnees",
    title: "Checklist transfert transfrontalier donnees | AfroTools",
    name: "Transfert donnees",
    description:
      "Passez en revue pays, base legale, garanties, sous-traitants, risques et preuves.",
    eyebrow: "Protection donnees",
    lead:
      "Structurez une verification avant transfert de donnees personnelles hors pays.",
    useCase:
      "Utile pour DPO, startups, PME, SaaS, ONG, equipes IT et juristes.",
    safety:
      "Ce n'est pas un avis juridique; confirmez obligations et contrats avec un conseil qualifie.",
    related:
      "A combiner avec DPA, DPIA et notification violation donnees.",
    terms: [
      ["Cross-Border Data Transfer Checklist", "Checklist transfert donnees"],
      ["Data transfer", "Transfert donnees"],
      ["Legal basis", "Base legale"],
      ["Processor", "Sous-traitant"],
      ["Safeguards", "Garanties"],
      ["Evidence", "Preuves"],
    ],
  },
  {
    enSlug: "cybersecurity-assessment",
    frSlug: "evaluation-risque-cybersecurite",
    title: "Evaluation risque cybersecurite | AfroTools",
    name: "Risque cybersecurite",
    description:
      "Evaluez mots de passe, sauvegardes, acces, appareils, incidents et priorites.",
    eyebrow: "Securite",
    lead:
      "Obtenez une grille pratique pour prioriser les controles cyber de base.",
    useCase:
      "Utile pour PME, ecoles, ONG, startups, freelances et responsables operations.",
    safety:
      "Un score interne ne remplace pas un audit de securite ou une reponse incident qualifiee.",
    related:
      "A combiner avec cout violation donnees, quiz phishing et force mot de passe.",
    terms: [
      ["Cybersecurity Risk Assessment Tool", "Evaluation risque cybersecurite"],
      ["Cybersecurity", "Cybersecurite"],
      ["Risk", "Risque"],
      ["Backup", "Sauvegarde"],
      ["Access", "Acces"],
      ["Incident", "Incident"],
    ],
  },
  {
    enSlug: "data-breach-cost",
    frSlug: "cout-violation-donnees",
    title: "Calculateur cout violation donnees | AfroTools",
    name: "Cout violation donnees",
    description:
      "Estimez detection, notification, support, interruption, juridique, amendes et remediation.",
    eyebrow: "Securite et donnees",
    lead:
      "Cadrez les couts potentiels d'un incident avant assurance, budget ou plan de reponse.",
    useCase:
      "Utile pour PME, DPO, securite, finance, operations et fondateurs.",
    safety:
      "Les couts reels dependent des faits, autorites, contrats, assurances et obligations locales.",
    related:
      "A combiner avec notification violation donnees, cybersecurite et assurance entreprise.",
    terms: [
      ["Data Breach Cost Calculator", "Calculateur cout violation donnees"],
      ["Data breach", "Violation donnees"],
      ["Notification", "Notification"],
      ["Downtime", "Interruption"],
      ["Fine", "Amende"],
      ["Remediation", "Remediation"],
    ],
  },
  {
    enSlug: "divorce-settlement",
    frSlug: "calculateur-divorce",
    title: "Calculateur partage divorce | AfroTools",
    name: "Partage divorce",
    description:
      "Organisez actifs, dettes, enfants, logement, pension, frais et scenarios indicatifs.",
    eyebrow: "Famille et droit",
    lead:
      "Preparez une discussion structuree avant mediation, conseil juridique ou tribunal.",
    useCase:
      "Utile pour familles, mediateurs, parajuristes, ONG et conseillers.",
    safety:
      "Ce n'est pas un avis juridique; les droits dependent du pays, du regime matrimonial et du juge.",
    related:
      "A combiner avec pension alimentaire enfant, frais tribunal et aide juridique.",
    terms: [
      ["Divorce Settlement Calculator", "Calculateur partage divorce"],
      ["Divorce", "Divorce"],
      ["Assets", "Actifs"],
      ["Debt", "Dettes"],
      ["Maintenance", "Pension"],
      ["Mediation", "Mediation"],
    ],
  },
  {
    enSlug: "docker-compose-gen",
    frSlug: "generateur-docker-compose",
    title: "Generateur Docker Compose | AfroTools",
    name: "Docker Compose",
    description:
      "Preparez services, ports, volumes, variables, reseaux et dependances.",
    eyebrow: "Developpeurs",
    lead:
      "Creez une base Compose pour prototype, environnement local ou petit deploiement.",
    useCase:
      "Utile pour developpeurs, etudiants, bootcamps, startups et equipes DevOps.",
    safety:
      "Relisez secrets, ports exposes, volumes et images avant de lancer en production.",
    related:
      "A combiner avec generateur message commit, testeur API et formateur JSON.",
    terms: [
      ["Docker Compose Generator", "Generateur Docker Compose"],
      ["Docker Compose", "Docker Compose"],
      ["Service", "Service"],
      ["Port", "Port"],
      ["Volume", "Volume"],
      ["Environment", "Environnement"],
    ],
  },
  {
    enSlug: "domestic-worker",
    frSlug: "salaire-employe-maison",
    title: "Guide salaire employe maison | AfroTools",
    name: "Employe maison",
    description:
      "Estimez salaire, horaires, conges, repas, transport, contrat et obligations.",
    eyebrow: "RH domestique",
    lead:
      "Preparez un budget et une checklist avant embauche d'un employe de maison.",
    useCase:
      "Utile pour familles, employeurs, travailleurs domestiques, ONG et conseillers.",
    safety:
      "Verifiez salaire minimum, contrat, securite sociale et regles locales applicables.",
    related:
      "A combiner avec cout total employe, conges et securite sociale.",
    terms: [
      ["Domestic Worker Salary Guide", "Guide salaire employe maison"],
      ["Domestic worker", "Employe maison"],
      ["Salary", "Salaire"],
      ["Leave", "Conges"],
      ["Contract", "Contrat"],
      ["Social security", "Securite sociale"],
    ],
  },
  {
    enSlug: "dpa-generator",
    frSlug: "generateur-dpa",
    title: "Generateur accord traitement donnees DPA | AfroTools",
    name: "Accord DPA",
    description:
      "Preparez roles, donnees, sous-traitants, securite, transferts, audits et clauses.",
    eyebrow: "Protection donnees",
    lead:
      "Structurez une base d'accord de traitement des donnees avant revue juridique.",
    useCase:
      "Utile pour SaaS, PME, DPO, juristes, agences et equipes procurement.",
    safety:
      "Faites valider le contrat selon la loi applicable et les obligations de chaque partie.",
    related:
      "A combiner avec DPIA, cookies et transfert donnees.",
    terms: [
      ["Data Processing Agreement Generator", "Generateur accord traitement donnees"],
      ["DPA", "DPA"],
      ["Controller", "Responsable traitement"],
      ["Processor", "Sous-traitant"],
      ["Security", "Securite"],
      ["Audit", "Audit"],
    ],
  },
  {
    enSlug: "dpia-tool",
    frSlug: "outil-dpia",
    title: "Outil DPIA protection donnees | AfroTools",
    name: "DPIA",
    description:
      "Evaluez finalite, donnees, risques, mesures, necessite, proportionnalite et preuves.",
    eyebrow: "Protection donnees",
    lead:
      "Preparez une analyse d'impact avant lancement d'un traitement sensible.",
    useCase:
      "Utile pour DPO, equipes produit, juristes, ONG, SaaS et services publics.",
    safety:
      "Cet outil aide a structurer; il ne remplace pas une validation juridique ou regulatoire.",
    related:
      "A combiner avec DPA, transfert donnees et notification violation donnees.",
    terms: [
      ["DPIA Tool", "Outil DPIA"],
      ["DPIA", "DPIA"],
      ["Purpose", "Finalite"],
      ["Risk", "Risque"],
      ["Mitigation", "Mesure"],
      ["Evidence", "Preuves"],
    ],
  },
  {
    enSlug: "employee-cost",
    frSlug: "cout-total-employe",
    title: "Calculateur cout total employe | AfroTools",
    name: "Cout total employe",
    description:
      "Estimez salaire, charges, avantages, materiel, formation, recrutement et cout complet.",
    eyebrow: "RH et finance",
    lead:
      "Comparez le cout complet d'un poste avant embauche, budget ou offre salariale.",
    useCase:
      "Utile pour PME, RH, fondateurs, comptables et equipes finance.",
    safety:
      "Les charges et obligations varient selon pays, contrat, avantages et conventions locales.",
    related:
      "A combiner avec contractant vs salarie, cout employeur et salaire minimum.",
    terms: [
      ["Employee Cost Calculator", "Calculateur cout total employe"],
      ["Employee cost", "Cout employe"],
      ["Salary", "Salaire"],
      ["Benefits", "Avantages"],
      ["Recruitment", "Recrutement"],
      ["Training", "Formation"],
    ],
  },
  {
    enSlug: "engagement-rate",
    frSlug: "taux-engagement",
    title: "Calculateur taux engagement | AfroTools",
    name: "Taux engagement",
    description:
      "Calculez likes, commentaires, partages, vues, abonnes et taux d'engagement.",
    eyebrow: "Createurs",
    lead:
      "Comparez la performance de contenu social avant rapport, devis ou collaboration marque.",
    useCase:
      "Utile pour createurs, marques, agences, community managers et etudiants marketing.",
    safety:
      "Comparez les resultats avec objectifs, qualite audience et donnees de plateforme.",
    related:
      "A combiner avec ROI collaboration marque, tarif influenceur et prix photo video.",
    terms: [
      ["Engagement Rate Calculator", "Calculateur taux engagement"],
      ["Engagement", "Engagement"],
      ["Likes", "Likes"],
      ["Comments", "Commentaires"],
      ["Shares", "Partages"],
      ["Followers", "Abonnes"],
    ],
  },
  {
    enSlug: "event-decoration-cost",
    frSlug: "cout-decoration-evenement",
    title: "Calculateur cout decoration evenement | AfroTools",
    name: "Decoration evenement",
    description:
      "Estimez fleurs, tissu, scene, mobilier, transport, equipe, montage et marge.",
    eyebrow: "Evenements",
    lead:
      "Preparez un devis de decoration pour mariage, concert, conference ou ceremonie.",
    useCase:
      "Utile pour decorateurs, organisateurs, familles, salles et PME evenementielles.",
    safety:
      "Confirmez inventaire, casse, acces, delais, depot et conditions d'annulation.",
    related:
      "A combiner avec budget mariage, tarif DJ et prix photo video.",
    terms: [
      ["Event Decoration Cost Calculator", "Calculateur cout decoration evenement"],
      ["Decoration", "Decoration"],
      ["Event", "Evenement"],
      ["Flowers", "Fleurs"],
      ["Furniture", "Mobilier"],
      ["Setup", "Montage"],
    ],
  },
  {
    enSlug: "fabric-cost",
    frSlug: "cout-tissu-matiere",
    title: "Calculateur cout tissu et matiere | AfroTools",
    name: "Cout tissu",
    description:
      "Estimez metrage, pertes, prix unitaire, transport, teinture, doublure et marge.",
    eyebrow: "Mode et artisanat",
    lead:
      "Calculez le cout matiere avant couture, petite production ou vente de vetements.",
    useCase:
      "Utile pour tailleurs, createurs, boutiques, ateliers, ecoles de mode et familles.",
    safety:
      "Confirmez qualite, largeur, retrait, pertes et disponibilite avant achat.",
    related:
      "A combiner avec cout Ankara Kente, Aso-Ebi et tenue traditionnelle.",
    terms: [
      ["Fabric & Material Cost Calculator", "Calculateur cout tissu et matiere"],
      ["Fabric", "Tissu"],
      ["Material", "Matiere"],
      ["Yardage", "Metrage"],
      ["Waste", "Pertes"],
      ["Margin", "Marge"],
    ],
  },
  {
    enSlug: "fashion-brand-startup",
    frSlug: "cout-lancement-marque-mode",
    title: "Calculateur cout lancement marque mode | AfroTools",
    name: "Marque mode",
    description:
      "Estimez echantillons, tissus, production, shooting, packaging, boutique et marketing.",
    eyebrow: "Mode et business",
    lead:
      "Cadrez le budget de lancement d'une marque de mode avant commande ou campagne.",
    useCase:
      "Utile pour createurs, stylistes, boutiques, ateliers, etudiants mode et fondateurs.",
    safety:
      "Validez fournisseurs, qualite, delais, MOQ, retours et droits de marque avant paiement.",
    related:
      "A combiner avec cout tissu, prix photo video et ROI collaboration marque.",
    terms: [
      ["Fashion Brand Startup Cost Calculator", "Calculateur cout lancement marque mode"],
      ["Fashion brand", "Marque mode"],
      ["Samples", "Echantillons"],
      ["Production", "Production"],
      ["Packaging", "Packaging"],
      ["Marketing", "Marketing"],
    ],
  },
  {
    enSlug: "film-budget",
    frSlug: "budget-film",
    title: "Budget film et cinema | AfroTools",
    name: "Budget film",
    description:
      "Estimez scenario, tournage, equipe, lieux, postproduction, musique, marketing et distribution.",
    eyebrow: "Cinema africain",
    lead:
      "Preparez un budget de film avant pitch, production, financement ou sortie.",
    useCase:
      "Utile pour producteurs, realisateurs, etudiants cinema, createurs et distributeurs.",
    safety:
      "Confirmez contrats, droits, assurances, autorisations et accords de distribution.",
    related:
      "A combiner avec box-office Nollywood, prix photo video et publication livre.",
    terms: [
      ["Film / Movie Budget Breakdown Tool", "Budget film et cinema"],
      ["Film", "Film"],
      ["Production", "Production"],
      ["Crew", "Equipe"],
      ["Post-production", "Postproduction"],
      ["Distribution", "Distribution"],
    ],
  },
  {
    enSlug: "fire-calc",
    frSlug: "calculateur-fire",
    title: "Calculateur independance financiere FIRE | AfroTools",
    name: "Calculateur FIRE",
    description:
      "Estimez depenses, taux epargne, portefeuille cible, rendement reel et annees restantes.",
    eyebrow: "Finance personnelle",
    lead:
      "Visualisez un scenario d'independance financiere avec des hypotheses prudentes.",
    useCase:
      "Utile pour salaries, freelances, familles, investisseurs debutants et coachs financiers.",
    safety:
      "Les rendements sont incertains; ce n'est pas un conseil financier ni une garantie.",
    related:
      "A combiner avec valeur nette, marche monetaire et readiness retraite.",
    terms: [
      ["FIRE Calculator", "Calculateur independance financiere FIRE"],
      ["FIRE", "FIRE"],
      ["Savings rate", "Taux epargne"],
      ["Portfolio", "Portefeuille"],
      ["Expenses", "Depenses"],
      ["Real return", "Rendement reel"],
    ],
  },
  {
    enSlug: "fire-safety-checklist",
    frSlug: "checklist-securite-incendie",
    title: "Checklist securite incendie | AfroTools",
    name: "Securite incendie",
    description:
      "Passez en revue extincteurs, sorties, alarme, evacuation, formation et inspection.",
    eyebrow: "Securite",
    lead:
      "Preparez une verification incendie simple pour bureau, ecole, atelier ou evenement.",
    useCase:
      "Utile pour PME, ecoles, gestionnaires, organisateurs, ONG et responsables site.",
    safety:
      "Respectez les normes locales et faites inspecter les installations critiques par des pros.",
    related:
      "A combiner avec plan continuite activite, assurance entreprise et cout interruption.",
    terms: [
      ["Fire Safety Compliance Checker", "Checklist securite incendie"],
      ["Fire safety", "Securite incendie"],
      ["Extinguisher", "Extincteur"],
      ["Exit", "Sortie"],
      ["Alarm", "Alarme"],
      ["Evacuation", "Evacuation"],
    ],
  },
  {
    enSlug: "fleet-fuel",
    frSlug: "budget-carburant-flotte",
    title: "Calculateur budget carburant flotte | AfroTools",
    name: "Carburant flotte",
    description:
      "Estimez vehicules, distance, consommation, prix carburant, trajets et marge.",
    eyebrow: "Transport",
    lead:
      "Planifiez le cout carburant d'une flotte avant livraison, contrat ou operation mensuelle.",
    useCase:
      "Utile pour transporteurs, PME, ONG, flottes, livreurs et gestionnaires operations.",
    safety:
      "Les prix et consommations varient; comparez avec donnees reelles et carnet flotte.",
    related:
      "A combiner avec cout itineraire, livraison dernier kilometre et depreciation vehicule.",
    terms: [
      ["Fleet Fuel Budget Calculator", "Calculateur budget carburant flotte"],
      ["Fleet", "Flotte"],
      ["Fuel", "Carburant"],
      ["Distance", "Distance"],
      ["Consumption", "Consommation"],
      ["Route", "Trajet"],
    ],
  },
  {
    enSlug: "foreign-company-reg",
    frSlug: "enregistrement-societe-etrangere",
    title: "Guide enregistrement societe etrangere | AfroTools",
    name: "Societe etrangere",
    description:
      "Preparez pays, entite mere, representant, documents, frais, delais et obligations.",
    eyebrow: "Formalites entreprise",
    lead:
      "Cadrez les etapes avant d'enregistrer une societe etrangere ou succursale.",
    useCase:
      "Utile pour PME, cabinets, investisseurs, fondateurs et equipes expansion.",
    safety:
      "Verifiez exigences officielles, fiscalite, licences et obligations locales avec un conseil.",
    related:
      "A combiner avec licence entreprise, declarations annuelles et forme societe.",
    terms: [
      ["Foreign Company Registration Guide", "Guide enregistrement societe etrangere"],
      ["Foreign company", "Societe etrangere"],
      ["Branch", "Succursale"],
      ["Representative", "Representant"],
      ["Documents", "Documents"],
      ["Filing", "Depot"],
    ],
  },
  {
    enSlug: "freelancer-rate",
    frSlug: "tarif-freelance",
    title: "Calculateur tarif freelance | AfroTools",
    name: "Tarif freelance",
    description:
      "Estimez revenu cible, jours facturables, charges, impots, marge et tarif journalier.",
    eyebrow: "Freelance",
    lead:
      "Transformez un objectif de revenu en tarif horaire, journalier ou projet.",
    useCase:
      "Utile pour freelances, consultants, createurs, agences et travailleurs independants.",
    safety:
      "Ajustez selon marche, experience, impots, risques, contrat et delai de paiement.",
    related:
      "A combiner avec facture freelance, contrat freelance et cout total employe.",
    terms: [
      ["Freelancer Rate Card", "Calculateur tarif freelance"],
      ["Freelancer", "Freelance"],
      ["Rate", "Tarif"],
      ["Billable days", "Jours facturables"],
      ["Overhead", "Charges"],
      ["Margin", "Marge"],
    ],
  },
  {
    enSlug: "gdpr-vs-africa",
    frSlug: "rgpd-vs-lois-africaines",
    title: "RGPD vs lois africaines protection donnees | AfroTools",
    name: "RGPD vs Afrique",
    description:
      "Comparez principes, bases legales, droits, transferts, notifications et autorites.",
    eyebrow: "Protection donnees",
    lead:
      "Obtenez une comparaison structuree avant projet donnees, politique ou revue de conformite.",
    useCase:
      "Utile pour DPO, juristes, startups, ONG, equipes produit et consultants.",
    safety:
      "Ce comparatif est indicatif; confirmez toujours avec textes officiels et conseil qualifie.",
    related:
      "A combiner avec DPA, DPIA, cookies et transfert donnees.",
    terms: [
      ["GDPR vs African Data Protection Laws", "RGPD vs lois africaines"],
      ["GDPR", "RGPD"],
      ["Data protection", "Protection donnees"],
      ["Legal basis", "Base legale"],
      ["Rights", "Droits"],
      ["Regulator", "Autorite"],
    ],
  },
  {
    enSlug: "graphic-design-pricing",
    frSlug: "prix-design-graphique",
    title: "Calculateur prix design graphique | AfroTools",
    name: "Prix design graphique",
    description:
      "Estimez brief, livrables, revisions, droits, delai, complexite et marge.",
    eyebrow: "Services creatifs",
    lead:
      "Preparez un devis de design clair pour marque, affiche, logo, reseaux ou campagne.",
    useCase:
      "Utile pour designers, agences, freelances, PME, createurs et clients.",
    safety:
      "Clarifiez scope, fichiers sources, droits d'usage, revisions et acompte.",
    related:
      "A combiner avec prix commande art, palette africaine et tarif freelance.",
    terms: [
      ["Graphic Design Pricing Calculator", "Calculateur prix design graphique"],
      ["Graphic design", "Design graphique"],
      ["Deliverables", "Livrables"],
      ["Revision", "Revision"],
      ["Usage rights", "Droits d'usage"],
      ["Deadline", "Delai"],
    ],
  },
  {
    enSlug: "gratuity-calculator",
    frSlug: "calculateur-indemnite-depart",
    title: "Calculateur indemnite de depart | AfroTools",
    name: "Indemnite de depart",
    description:
      "Estimez anciennete, salaire, formule, preavis, avantages et paiement indicatif.",
    eyebrow: "RH et paie",
    lead:
      "Structurez une estimation avant fin de contrat, separation ou revue RH.",
    useCase:
      "Utile pour salaries, RH, PME, syndicats, comptables et conseillers.",
    safety:
      "Les droits varient selon pays, contrat, convention, motif et decision competente.",
    related:
      "A combiner avec licenciement, conges, securite sociale et salaire minimum.",
    terms: [
      ["Gratuity & Severance Calculator", "Calculateur indemnite de depart"],
      ["Gratuity", "Gratuite"],
      ["Severance", "Indemnite de depart"],
      ["Tenure", "Anciennete"],
      ["Notice", "Preavis"],
      ["Final pay", "Solde final"],
    ],
  },
  {
    enSlug: "halal-compliance",
    frSlug: "conformite-halal",
    title: "Checklist conformite halal entreprise | AfroTools",
    name: "Conformite halal",
    description:
      "Passez en revue ingredients, fournisseurs, stockage, certification, etiquetage et controles.",
    eyebrow: "Commerce halal",
    lead:
      "Preparez une verification initiale avant certification, audit ou lancement produit.",
    useCase:
      "Utile pour restaurants, producteurs, distributeurs, PME, ecoles et conseillers.",
    safety:
      "Confirmez avec autorite religieuse, certificateur et regles locales applicables.",
    related:
      "A combiner avec finance islamique, calendrier islamique et licence entreprise.",
    terms: [
      ["Halal Business Compliance Checker", "Checklist conformite halal"],
      ["Halal", "Halal"],
      ["Certification", "Certification"],
      ["Ingredient", "Ingredient"],
      ["Supplier", "Fournisseur"],
      ["Label", "Etiquette"],
    ],
  },
  {
    enSlug: "hosting-compare",
    frSlug: "comparateur-hebergement",
    title: "Comparateur cout hebergement web | AfroTools",
    name: "Hebergement web",
    description:
      "Comparez serveur, trafic, stockage, domaine, SSL, sauvegarde, support et cout mensuel.",
    eyebrow: "Developpeurs",
    lead:
      "Choisissez une option d'hebergement avant lancement site, app ou boutique.",
    useCase:
      "Utile pour developpeurs, agences, startups, etudiants, PME et createurs.",
    safety:
      "Verifiez SLA, localisation donnees, renouvellement, sauvegardes et support reel.",
    related:
      "A combiner avec domaines africains, PWA manifest et testeur API.",
    terms: [
      ["Hosting Cost Comparator", "Comparateur cout hebergement web"],
      ["Hosting", "Hebergement"],
      ["Server", "Serveur"],
      ["Traffic", "Trafic"],
      ["Storage", "Stockage"],
      ["Backup", "Sauvegarde"],
    ],
  },
  {
    enSlug: "influencer-rate",
    frSlug: "tarif-influenceur",
    title: "Generateur tarif influenceur | AfroTools",
    name: "Tarif influenceur",
    description:
      "Estimez audience, engagement, format, droits, exclusivite, livrables et prix.",
    eyebrow: "Createurs",
    lead:
      "Preparez une grille tarifaire pour collaboration, campagne ou devis de createur.",
    useCase:
      "Utile pour influenceurs, marques, agences, managers et equipes marketing.",
    safety:
      "Incluez etiquetage sponsorise, droits d'usage, exclusivite, revisions et paiement.",
    related:
      "A combiner avec taux engagement, ROI collaboration marque et prix photo video.",
    terms: [
      ["Influencer Rate Card Generator", "Generateur tarif influenceur"],
      ["Influencer", "Influenceur"],
      ["Audience", "Audience"],
      ["Engagement", "Engagement"],
      ["Deliverables", "Livrables"],
      ["Exclusivity", "Exclusivite"],
    ],
  },
  {
    enSlug: "insurance-fraud-checker",
    frSlug: "signaux-fraude-assurance",
    title: "Checklist signaux fraude assurance | AfroTools",
    name: "Fraude assurance",
    description:
      "Reperez incoherences, documents, dates, temoins, montants et points de revue.",
    eyebrow: "Assurance",
    lead:
      "Structurez une revue initiale de dossier sans accuser ni conclure automatiquement.",
    useCase:
      "Utile pour assureurs, courtiers, PME, equipes sinistres et controle interne.",
    safety:
      "Les signaux ne prouvent pas une fraude; suivez procedure, droit local et revue humaine.",
    related:
      "A combiner avec suivi sinistre assurance, assurance entreprise et cybersecurite.",
    terms: [
      ["Insurance Fraud Red Flag Checker", "Checklist signaux fraude assurance"],
      ["Insurance fraud", "Fraude assurance"],
      ["Red flag", "Signal d'alerte"],
      ["Claim", "Sinistre"],
      ["Evidence", "Preuves"],
      ["Review", "Revue"],
    ],
  },
  {
    enSlug: "ip-protection",
    frSlug: "guide-protection-pi",
    title: "Guide protection propriete intellectuelle | AfroTools",
    name: "Protection PI",
    description:
      "Preparez marque, droit auteur, brevet, preuve, pays, frais et calendrier.",
    eyebrow: "Propriete intellectuelle",
    lead:
      "Organisez les premieres etapes de protection d'une creation, marque ou invention.",
    useCase:
      "Utile pour createurs, startups, artistes, PME, agences et etudiants.",
    safety:
      "Confirmez strategie, recherches, depots et delais avec l'office PI ou un conseil qualifie.",
    related:
      "A combiner avec licence entreprise, commande art et publication livre.",
    terms: [
      ["IP Protection Guide", "Guide protection propriete intellectuelle"],
      ["Intellectual property", "Propriete intellectuelle"],
      ["Trademark", "Marque"],
      ["Copyright", "Droit auteur"],
      ["Patent", "Brevet"],
      ["Filing", "Depot"],
    ],
  },
  {
    enSlug: "islamic-calendar",
    frSlug: "convertisseur-calendrier-islamique",
    title: "Convertisseur calendrier islamique | AfroTools",
    name: "Calendrier islamique",
    description:
      "Convertissez dates gregoriennes et hijri avec notes sur observation lunaire et calendrier local.",
    eyebrow: "Culture et religion",
    lead:
      "Preparez une estimation de date pour planification, contenu, evenement ou rappel religieux.",
    useCase:
      "Utile pour familles, ecoles, communautes, organisateurs et createurs de contenu.",
    safety:
      "Les dates religieuses peuvent dependre de l'observation locale; confirmez avec l'autorite competente.",
    related:
      "A combiner avec horaires priere, calendrier Ramadan et finance islamique.",
    terms: [
      ["Islamic Calendar Converter", "Convertisseur calendrier islamique"],
      ["Islamic calendar", "Calendrier islamique"],
      ["Hijri", "Hijri"],
      ["Gregorian", "Gregorien"],
      ["Moon sighting", "Observation lunaire"],
      ["Date", "Date"],
    ],
  },
  {
    enSlug: "kenya-dpa",
    frSlug: "conformite-dpa-kenya",
    title: "Checklist conformite Kenya DPA | AfroTools",
    name: "Kenya DPA",
    description:
      "Passez en revue base legale, droits, DPO, notification, transferts et preuves.",
    eyebrow: "Protection donnees",
    lead:
      "Structurez une premiere verification autour de la loi kenyane sur la protection des donnees.",
    useCase:
      "Utile pour PME, startups, DPO, juristes, ONG et equipes produit travaillant au Kenya.",
    safety:
      "Ce n'est pas un avis juridique; confirmez obligations avec les textes officiels et un conseil.",
    related:
      "A combiner avec DPA, DPIA, cookies et transfert donnees.",
    terms: [
      ["Kenya Data Protection Act Compliance Checker", "Checklist conformite Kenya DPA"],
      ["Kenya DPA", "Kenya DPA"],
      ["Data protection", "Protection donnees"],
      ["Legal basis", "Base legale"],
      ["DPO", "DPO"],
      ["Notification", "Notification"],
    ],
  },
  {
    enSlug: "legal-aid",
    frSlug: "eligibilite-aide-juridique-afrique",
    title: "Eligibilite aide juridique Afrique | AfroTools",
    name: "Aide juridique",
    description:
      "Preparez revenu, affaire, urgence, documents, pays et pistes d'assistance.",
    eyebrow: "Justice",
    lead:
      "Organisez les informations avant de chercher une clinique juridique, ONG ou service public.",
    useCase:
      "Utile pour particuliers, familles, ONG, parajuristes et centres communautaires.",
    safety:
      "L'eligibilite depend du pays et de l'organisme; contactez un service qualifie pour confirmer.",
    related:
      "A combiner avec frais tribunal, affidavit et caution penale.",
    terms: [
      ["Legal Aid Eligibility Checker", "Eligibilite aide juridique"],
      ["Legal aid", "Aide juridique"],
      ["Eligibility", "Eligibilite"],
      ["Income", "Revenu"],
      ["Case", "Affaire"],
      ["Documents", "Documents"],
    ],
  },
  {
    enSlug: "linkedin-optimizer",
    frSlug: "optimiseur-linkedin",
    title: "Optimiseur profil LinkedIn | AfroTools",
    name: "Optimiseur LinkedIn",
    description:
      "Revoyez titre, resume, experiences, mots-cles, preuves, liens et appel a l'action.",
    eyebrow: "Carriere",
    lead:
      "Ameliorez la presentation professionnelle avant candidature, prospection ou personal branding.",
    useCase:
      "Utile pour chercheurs d'emploi, freelances, fondateurs, etudiants et professionnels.",
    safety:
      "Gardez les faits exacts, evitez les donnees sensibles et adaptez au poste vise.",
    related:
      "A combiner avec preparation entretien, audit marque personnelle et generateur CV.",
    terms: [
      ["LinkedIn Profile Optimizer", "Optimiseur profil LinkedIn"],
      ["LinkedIn", "LinkedIn"],
      ["Headline", "Titre"],
      ["Summary", "Resume"],
      ["Keywords", "Mots-cles"],
      ["Experience", "Experience"],
    ],
  },
  {
    enSlug: "made-in-africa-label",
    frSlug: "label-made-in-africa",
    title: "Verificateur label Made in Africa | AfroTools",
    name: "Made in Africa",
    description:
      "Evaluez origine, intrants, transformation, documentation, fournisseur et preuve.",
    eyebrow: "Commerce",
    lead:
      "Preparez une verification initiale avant etiquetage, export, marketing ou AfCFTA.",
    useCase:
      "Utile pour PME, fabricants, exportateurs, cooperatives et equipes commerce.",
    safety:
      "Confirmez les regles d'origine, normes et preuves avec l'autorite competente.",
    related:
      "A combiner avec ZLECAf, documents export et licence entreprise.",
    terms: [
      ["Made in Africa Label Checker", "Verificateur label Made in Africa"],
      ["Made in Africa", "Made in Africa"],
      ["Origin", "Origine"],
      ["Inputs", "Intrants"],
      ["Proof", "Preuve"],
      ["Rules of origin", "Regles origine"],
    ],
  },
  {
    enSlug: "marine-insurance",
    frSlug: "assurance-maritime-cargo",
    title: "Calculateur assurance maritime cargo | AfroTools",
    name: "Assurance cargo",
    description:
      "Estimez valeur marchandise, route, incoterm, couverture, prime et franchise.",
    eyebrow: "Assurance transport",
    lead:
      "Preparez une estimation avant expedition, importation, export ou devis assureur.",
    useCase:
      "Utile pour importateurs, exportateurs, transitaires, PME et equipes logistiques.",
    safety:
      "Confirmez garanties, exclusions, incoterms et documents avec assureur ou transitaire.",
    related:
      "A combiner avec cout itineraire, fret et documents export.",
    terms: [
      ["Marine & Cargo Insurance Calculator", "Calculateur assurance maritime cargo"],
      ["Marine insurance", "Assurance maritime"],
      ["Cargo", "Cargo"],
      ["Incoterm", "Incoterm"],
      ["Premium", "Prime"],
      ["Deductible", "Franchise"],
    ],
  },
  {
    enSlug: "maternity-leave",
    frSlug: "conge-maternite-paternite",
    title: "Calculateur conge maternite paternite | AfroTools",
    name: "Conge parental",
    description:
      "Estimez semaines, salaire, indemnites, dates, preavis, documents et retour.",
    eyebrow: "RH et paie",
    lead:
      "Planifiez un conge parental avant discussion employeur, paie ou assurance sociale.",
    useCase:
      "Utile pour salaries, RH, familles, employeurs, comptables et conseillers.",
    safety:
      "Les droits dependent du pays, contrat, anciennete et organisme competent.",
    related:
      "A combiner avec conges, securite sociale et contribution sante.",
    terms: [
      ["Maternity & Paternity Leave Calculator", "Calculateur conge maternite paternite"],
      ["Maternity leave", "Conge maternite"],
      ["Paternity leave", "Conge paternite"],
      ["Salary", "Salaire"],
      ["Benefit", "Indemnite"],
      ["Return", "Retour"],
    ],
  },
  {
    enSlug: "merchant-fees",
    frSlug: "frais-marchand",
    title: "Calculateur frais marchand | AfroTools",
    name: "Frais marchand",
    description:
      "Estimez volume, panier moyen, taux, frais fixes, remboursements et cout net.",
    eyebrow: "Paiements",
    lead:
      "Comparez le cout d'un moyen de paiement avant integration ou negotiation.",
    useCase:
      "Utile pour e-commerce, restaurants, boutiques, fintechs, PME et comptables.",
    safety:
      "Verifiez tarifs reels, taxes, retenues, chargebacks et conditions du prestataire.",
    related:
      "A combiner avec passerelle paiement, comparateur paiement et frais POS.",
    methodology:
      "La page prepare pays, devise, volume, panier moyen, objectif et fichier local, puis l'outil source calcule frais fixes, taux variables, remboursements et cout net.",
    sourceNote:
      "Controle 2026: verifiez grille tarifaire officielle, taxes, retenues, reserve, chargebacks, frais de retrait et delai de reglement avec le prestataire avant integration.",
    businessCtaNote:
      "Exportez le brief de frais, volume et panier moyen avant de negocier une passerelle, choisir un prestataire ou presenter un business case paiement.",
    iframeEmbed: true,
    terms: [
      ["Merchant Fee Calculator", "Calculateur frais marchand"],
      ["Merchant fee", "Frais marchand"],
      ["Transaction", "Transaction"],
      ["Fixed fee", "Frais fixe"],
      ["Chargeback", "Chargeback"],
      ["Net cost", "Cout net"],
    ],
  },
  {
    enSlug: "microinsurance",
    frSlug: "prime-microassurance",
    title: "Calculateur prime microassurance | AfroTools",
    name: "Microassurance",
    description:
      "Estimez couverture, groupe, prime, commission, sinistres attendus et marge.",
    eyebrow: "Assurance inclusive",
    lead:
      "Cadrez une prime indicative avant produit pilote, cooperative ou discussion assureur.",
    useCase:
      "Utile pour assureurs, cooperatives, fintechs, ONG, agents terrain et PME.",
    safety:
      "La tarification reelle exige donnees actuarielles, reglementation et validation assureur.",
    related:
      "A combiner avec assurance recolte, assurance maritime et fraude assurance.",
    terms: [
      ["Microinsurance Premium Calculator", "Calculateur prime microassurance"],
      ["Microinsurance", "Microassurance"],
      ["Premium", "Prime"],
      ["Coverage", "Couverture"],
      ["Claims", "Sinistres"],
      ["Commission", "Commission"],
    ],
  },
  {
    enSlug: "money-market",
    frSlug: "comparateur-fonds-monetaires",
    title: "Comparateur fonds monetaires | AfroTools",
    name: "Fonds monetaires",
    description:
      "Comparez rendement, frais, liquidite, depot minimum, risque et revenu net.",
    eyebrow: "Epargne et investissement",
    lead:
      "Structurez une comparaison avant de choisir un fonds monetaire ou produit de tresorerie.",
    useCase:
      "Utile pour particuliers, PME, tresoriers, investisseurs debutants et conseillers.",
    safety:
      "Les rendements changent et le capital peut etre a risque; lisez les documents officiels.",
    related:
      "A combiner avec depot terme, bons tresor et rendement reel inflation.",
    methodology:
      "La page prepare montant, devise, objectif de tresorerie, horizon et fichier local, puis l'outil source compare rendement, frais, liquidite, depot minimum et revenu net.",
    sourceNote:
      "Controle 2026: confirmez fiche produit, frais de gestion, rendement date, liquidite, fiscalite, risque de capital et documents du gestionnaire avant placement.",
    businessCtaNote:
      "Gardez le brief de comparaison et les fiches produits avant une decision de tresorerie PME, club d'investissement ou conseil client.",
    iframeEmbed: true,
    terms: [
      ["Money Market Fund Comparator", "Comparateur fonds monetaires"],
      ["Money market", "Marche monetaire"],
      ["Yield", "Rendement"],
      ["Fees", "Frais"],
      ["Liquidity", "Liquidite"],
      ["Risk", "Risque"],
    ],
  },
  {
    enSlug: "music-royalty-splitter",
    frSlug: "partage-redevances-musicales",
    title: "Calculateur partage redevances musicales | AfroTools",
    name: "Partage royalties",
    description:
      "Repartissez parts artiste, producteur, auteur, label, distributeur et collaborateurs.",
    eyebrow: "Musique",
    lead:
      "Clarifiez les parts avant sortie musicale, contrat, collaboration ou reporting.",
    useCase:
      "Utile pour artistes, producteurs, managers, labels, auteurs et beatmakers.",
    safety:
      "Validez les parts dans un contrat ecrit et confirmez les droits avec les societes competentes.",
    related:
      "A combiner avec redevances streaming, budget album et tarif DJ.",
    terms: [
      ["Music Royalty Splitter", "Calculateur partage redevances musicales"],
      ["Royalty", "Redevance"],
      ["Split", "Partage"],
      ["Artist", "Artiste"],
      ["Producer", "Producteur"],
      ["Label", "Label"],
    ],
  },
  {
    enSlug: "nafdac-registration",
    frSlug: "cout-enregistrement-produit",
    title: "Guide cout enregistrement produit | AfroTools",
    name: "Enregistrement produit",
    description:
      "Preparez categorie, dossier, tests, frais, delais, etiquetage et renouvellement.",
    eyebrow: "Conformite produit",
    lead:
      "Cadrez les couts et documents avant enregistrement d'un produit reglemente.",
    useCase:
      "Utile pour fabricants, importateurs, cosmetiques, aliments, PME et consultants.",
    safety:
      "Confirmez exigences officielles, laboratoires, categories et frais avec l'autorite locale.",
    related:
      "A combiner avec licence entreprise, made in Africa et assurance produit.",
    terms: [
      ["Product Registration Cost Guide", "Guide cout enregistrement produit"],
      ["Product registration", "Enregistrement produit"],
      ["Category", "Categorie"],
      ["Testing", "Tests"],
      ["Labeling", "Etiquetage"],
      ["Renewal", "Renouvellement"],
    ],
  },
  {
    enSlug: "net-worth",
    frSlug: "suivi-valeur-nette",
    title: "Suivi valeur nette | AfroTools",
    name: "Valeur nette",
    description:
      "Additionnez actifs, dettes, epargne, investissements, biens et progression mensuelle.",
    eyebrow: "Finance personnelle",
    lead:
      "Suivez votre situation financiere avec une vue simple des actifs moins dettes.",
    useCase:
      "Utile pour particuliers, familles, coachs financiers, etudiants et entrepreneurs.",
    safety:
      "Gardez les donnees privees et verifiez les valeurs avec documents ou releves fiables.",
    related:
      "A combiner avec FIRE, fonds urgence et rendement investissement.",
    terms: [
      ["Net Worth Tracker", "Suivi valeur nette"],
      ["Net worth", "Valeur nette"],
      ["Assets", "Actifs"],
      ["Debt", "Dettes"],
      ["Savings", "Epargne"],
      ["Investment", "Investissement"],
    ],
  },
  {
    enSlug: "oee-calculator",
    frSlug: "calculateur-oee",
    title: "Calculateur OEE rendement equipement | AfroTools",
    name: "OEE",
    description:
      "Calculez disponibilite, performance, qualite, temps arret, production et pertes.",
    eyebrow: "Operations",
    lead:
      "Mesurez l'efficacite d'un equipement avant amelioration atelier ou reporting usine.",
    useCase:
      "Utile pour usines, ateliers, responsables production, PME et consultants operations.",
    safety:
      "Utilisez des donnees terrain fiables et confirmez les definitions avec votre equipe.",
    related:
      "A combiner avec cout production, controle qualite et installation usine.",
    terms: [
      ["OEE Calculator", "Calculateur OEE"],
      ["OEE", "OEE"],
      ["Availability", "Disponibilite"],
      ["Performance", "Performance"],
      ["Quality", "Qualite"],
      ["Downtime", "Temps arret"],
    ],
  },
  {
    enSlug: "packaging-cost",
    frSlug: "cout-emballage",
    title: "Calculateur cout emballage | AfroTools",
    name: "Cout emballage",
    description:
      "Estimez boite, etiquette, impression, protection, transport, pertes et marge.",
    eyebrow: "Production et commerce",
    lead:
      "Calculez le cout d'emballage par unite avant production, vente ou export.",
    useCase:
      "Utile pour PME, artisans, e-commerce, fabricants, agriculteurs et marques.",
    safety:
      "Verifiez qualite, normes, MOQ, delais, taxes et compatibilite produit.",
    related:
      "A combiner avec cout production, prix livraison et enregistrement produit.",
    terms: [
      ["Packaging Cost Calculator", "Calculateur cout emballage"],
      ["Packaging", "Emballage"],
      ["Label", "Etiquette"],
      ["Printing", "Impression"],
      ["Unit cost", "Cout unitaire"],
      ["Waste", "Pertes"],
    ],
  },
  {
    enSlug: "parking-fee",
    frSlug: "frais-parking",
    title: "Calculateur frais parking | AfroTools",
    name: "Frais parking",
    description:
      "Estimez duree, tarif horaire, forfait, penalites, taxes et cout total.",
    eyebrow: "Transport urbain",
    lead:
      "Preparez le cout d'un stationnement avant deplacement, evenement ou planning de flotte.",
    useCase:
      "Utile pour conducteurs, livreurs, organisateurs, PME et gestionnaires de flotte.",
    safety:
      "Les tarifs changent selon ville, zone, heure et operateur; confirmez les panneaux locaux.",
    related:
      "A combiner avec budget carburant flotte, peages et cout itineraire.",
    terms: [
      ["Parking Fee Calculator", "Calculateur frais parking"],
      ["Parking", "Parking"],
      ["Hourly rate", "Tarif horaire"],
      ["Fine", "Penalite"],
      ["Duration", "Duree"],
      ["Total cost", "Cout total"],
    ],
  },
  {
    enSlug: "partnership-agreement",
    frSlug: "accord-partenariat",
    title: "Generateur accord de partenariat | AfroTools",
    name: "Accord partenariat",
    description:
      "Preparez partenaires, apports, roles, partage, duree, sortie et signatures.",
    eyebrow: "Documents entreprise",
    lead:
      "Structurez un brouillon d'accord avant revue juridique, negotiation ou signature.",
    useCase:
      "Utile pour PME, fondateurs, cooperatives, createurs, ONG et consultants.",
    safety:
      "Ce modele n'est pas un avis juridique; faites valider les clauses selon le droit local.",
    related:
      "A combiner avec resolution conseil, licence entreprise et procuration.",
    terms: [
      ["Partnership Agreement Generator", "Generateur accord de partenariat"],
      ["Partnership", "Partenariat"],
      ["Partner", "Partenaire"],
      ["Contribution", "Apport"],
      ["Profit share", "Partage benefices"],
      ["Exit", "Sortie"],
    ],
  },
  {
    enSlug: "password-strength",
    frSlug: "force-mot-de-passe",
    title: "Verificateur force mot de passe | AfroTools",
    name: "Force mot de passe",
    description:
      "Evaluez longueur, complexite, reutilisation, temps indicatif et conseils de securite.",
    eyebrow: "Securite",
    lead:
      "Verifiez rapidement si un mot de passe semble assez robuste pour un usage courant.",
    useCase:
      "Utile pour particuliers, ecoles, PME, equipes IT et formations cybersecurite.",
    safety:
      "Ne collez pas de vrais mots de passe sensibles dans un outil partage; utilisez un gestionnaire fiable.",
    related:
      "A combiner avec quiz phishing, cybersecurite et generateur mot de passe.",
    terms: [
      ["Password Strength Checker", "Verificateur force mot de passe"],
      ["Password", "Mot de passe"],
      ["Strength", "Force"],
      ["Length", "Longueur"],
      ["Complexity", "Complexite"],
      ["Security", "Securite"],
    ],
  },
  {
    enSlug: "personal-brand-audit",
    frSlug: "audit-marque-personnelle",
    title: "Audit marque personnelle | AfroTools",
    name: "Marque personnelle",
    description:
      "Evaluez profil, positionnement, preuves, contenu, audience, coherence et prochaines actions.",
    eyebrow: "Carriere et createurs",
    lead:
      "Structurez votre presence professionnelle avant recherche, prospection ou collaboration.",
    useCase:
      "Utile pour freelances, createurs, cadres, fondateurs, etudiants et coachs.",
    safety:
      "Gardez les informations exactes, respectez la confidentialite et adaptez au public vise.",
    related:
      "A combiner avec optimiseur LinkedIn, taux engagement et tarif freelance.",
    terms: [
      ["Personal Brand Audit Tool", "Audit marque personnelle"],
      ["Personal brand", "Marque personnelle"],
      ["Positioning", "Positionnement"],
      ["Proof", "Preuves"],
      ["Audience", "Audience"],
      ["Content", "Contenu"],
    ],
  },
  {
    enSlug: "phishing-quiz",
    frSlug: "quiz-phishing",
    title: "Quiz detection phishing | AfroTools",
    name: "Quiz phishing",
    description:
      "Testez indices d'email suspect, lien, urgence, piece jointe, expediteur et reflexes.",
    eyebrow: "Securite",
    lead:
      "Entrainez une equipe ou un utilisateur a reconnaitre des signaux de phishing.",
    useCase:
      "Utile pour PME, ecoles, ONG, formations securite et particuliers.",
    safety:
      "Un quiz ne remplace pas une formation complete, des controles techniques et une procedure incident.",
    related:
      "A combiner avec force mot de passe, cybersecurite et cout violation donnees.",
    terms: [
      ["Phishing Detection Quiz", "Quiz detection phishing"],
      ["Phishing", "Phishing"],
      ["Email", "Email"],
      ["Link", "Lien"],
      ["Attachment", "Piece jointe"],
      ["Sender", "Expediteur"],
    ],
  },
  {
    enSlug: "photography-pricing",
    frSlug: "prix-seance-photo",
    title: "Calculateur prix seance photo | AfroTools",
    name: "Prix seance photo",
    description:
      "Estimez duree, lieu, retouche, livraison, droits, transport, assistant et marge.",
    eyebrow: "Services creatifs",
    lead:
      "Preparez un devis de photographie pour portrait, evenement, marque ou produit.",
    useCase:
      "Utile pour photographes, createurs, agences, PME, familles et organisateurs.",
    safety:
      "Clarifiez livrables, droits d'usage, retouches, acompte et delai dans le devis.",
    related:
      "A combiner avec prix photo video, design graphique et commande art.",
    terms: [
      ["Photography Session Pricing Tool", "Calculateur prix seance photo"],
      ["Photography", "Photographie"],
      ["Session", "Seance"],
      ["Editing", "Retouche"],
      ["Usage rights", "Droits d'usage"],
      ["Deliverables", "Livrables"],
    ],
  },
  {
    enSlug: "plagiarism-pct",
    frSlug: "pourcentage-plagiat",
    title: "Auto-verification pourcentage plagiat | AfroTools",
    name: "Pourcentage plagiat",
    description:
      "Comparez texte, similarite indicative, sources, citations, paraphrase et notes de revision.",
    eyebrow: "Education",
    lead:
      "Organisez une auto-revue avant remise, publication, devoir ou verification editoriale.",
    useCase:
      "Utile pour etudiants, enseignants, redacteurs, chercheurs et equipes contenu.",
    safety:
      "Un score indicatif ne remplace pas une verification academique ou un outil institutionnel.",
    related:
      "A combiner avec compteur mots, comparateur texte et generateur citations.",
    terms: [
      ["Plagiarism Percentage Self-Check Tool", "Auto-verification pourcentage plagiat"],
      ["Plagiarism", "Plagiat"],
      ["Similarity", "Similarite"],
      ["Citation", "Citation"],
      ["Source", "Source"],
      ["Revision", "Revision"],
    ],
  },
  {
    enSlug: "podcast-monetization",
    frSlug: "monetisation-podcast",
    title: "Calculateur monetisation podcast | AfroTools",
    name: "Monetisation podcast",
    description:
      "Estimez ecoutes, sponsoring, abonnements, production, distribution et revenu net.",
    eyebrow: "Createurs audio",
    lead:
      "Cadrez un modele de revenus podcast avant pitch sponsor, lancement ou planning contenu.",
    useCase:
      "Utile pour podcasteurs, createurs, studios, marques, agences et medias.",
    safety:
      "Les revenus dependent de l'audience, contrats, niche, cadence et couts de production.",
    related:
      "A combiner avec redevances streaming, budget album et taux engagement.",
    terms: [
      ["Podcast Monetization Calculator", "Calculateur monetisation podcast"],
      ["Podcast", "Podcast"],
      ["Sponsorship", "Sponsoring"],
      ["Downloads", "Ecoutes"],
      ["Subscription", "Abonnement"],
      ["Net revenue", "Revenu net"],
    ],
  },
  {
    enSlug: "pos-fees",
    frSlug: "frais-pos",
    title: "Calculateur frais POS | AfroTools",
    name: "Frais POS",
    description:
      "Estimez transactions, taux, frais fixes, retraits, chargebacks et cout net.",
    eyebrow: "Paiements",
    lead:
      "Comparez les couts d'un terminal POS ou agent avant choix de prestataire.",
    useCase:
      "Utile pour boutiques, restaurants, agents, PME, comptables et fintechs.",
    safety:
      "Verifiez les tarifs reels, taxes, retenues, litiges et conditions du fournisseur.",
    related:
      "A combiner avec frais marchand, paiement QR et passerelle paiement.",
    methodology:
      "La page prepare transactions, volume, devise et objectif, puis l'outil source calcule frais de terminal, taux transactionnels, retraits, chargebacks et cout net.",
    sourceNote:
      "Controle 2026: confirmez tarifs POS, frais de terminal, frais de retrait, litiges, taxes et conditions de reglement avec la banque, fintech ou agent avant signature.",
    businessCtaNote:
      "Exportez le brief de transactions, volume et cout net avant de choisir un terminal POS, negocier un contrat ou comparer deux prestataires.",
    iframeEmbed: true,
    terms: [
      ["POS Transaction Fee Calculator", "Calculateur frais POS"],
      ["POS", "POS"],
      ["Transaction fee", "Frais transaction"],
      ["Chargeback", "Chargeback"],
      ["Provider", "Prestataire"],
      ["Net cost", "Cout net"],
    ],
  },
  {
    enSlug: "power-of-attorney",
    frSlug: "procuration",
    title: "Generateur procuration | AfroTools",
    name: "Procuration",
    description:
      "Preparez mandant, mandataire, pouvoirs, duree, limites, temoins et signature.",
    eyebrow: "Documents juridiques",
    lead:
      "Structurez un brouillon de procuration avant impression, notarisation ou depot.",
    useCase:
      "Utile pour familles, diaspora, PME, parajuristes, ONG et administrations.",
    safety:
      "Ce modele n'est pas un avis juridique; confirmez forme, temoins et notarisation localement.",
    related:
      "A combiner avec affidavit, testament et frais tribunal.",
    terms: [
      ["Power of Attorney Generator", "Generateur procuration"],
      ["Power of attorney", "Procuration"],
      ["Principal", "Mandant"],
      ["Agent", "Mandataire"],
      ["Authority", "Pouvoirs"],
      ["Signature", "Signature"],
    ],
  },
  {
    enSlug: "production-cost",
    frSlug: "cout-production",
    title: "Calculateur cout production | AfroTools",
    name: "Cout production",
    description:
      "Estimez matieres, main-d'oeuvre, energie, emballage, pertes, overhead et marge.",
    eyebrow: "Operations",
    lead:
      "Calculez un cout unitaire avant prix de vente, devis, production ou negotiation.",
    useCase:
      "Utile pour fabricants, artisans, PME, ateliers, agriculteurs et equipes finance.",
    safety:
      "Comparez avec donnees reelles, fournisseurs, rendement et couts indirects.",
    related:
      "A combiner avec cout emballage, OEE et controle qualite.",
    terms: [
      ["Production Cost Calculator", "Calculateur cout production"],
      ["Production cost", "Cout production"],
      ["Materials", "Matieres"],
      ["Labour", "Main-d'oeuvre"],
      ["Overhead", "Frais indirects"],
      ["Unit cost", "Cout unitaire"],
    ],
  },
  {
    enSlug: "professional-indemnity",
    frSlug: "assurance-responsabilite-professionnelle",
    title: "Calculateur assurance responsabilite professionnelle | AfroTools",
    name: "Responsabilite pro",
    description:
      "Estimez activite, chiffre affaires, limite couverture, franchise, risque et prime.",
    eyebrow: "Assurance entreprise",
    lead:
      "Preparez une estimation avant devis assurance, renouvellement ou contrat client.",
    useCase:
      "Utile pour consultants, agences, PME, freelances, cabinets et professions de service.",
    safety:
      "Les garanties et exclusions dependent du contrat; confirmez avec un courtier ou assureur.",
    related:
      "A combiner avec assurance entreprise, fraude assurance et cout violation donnees.",
    terms: [
      ["Professional Indemnity Insurance Calculator", "Calculateur assurance responsabilite professionnelle"],
      ["Professional indemnity", "Responsabilite professionnelle"],
      ["Coverage", "Couverture"],
      ["Deductible", "Franchise"],
      ["Premium", "Prime"],
      ["Exclusion", "Exclusion"],
    ],
  },
  {
    enSlug: "property-vs-stocks",
    frSlug: "immobilier-vs-actions",
    title: "Comparateur immobilier vs actions | AfroTools",
    name: "Immobilier vs actions",
    description:
      "Comparez rendement locatif, appreciation, dividendes, frais, risque et liquidite.",
    eyebrow: "Investissement",
    lead:
      "Structurez une comparaison entre bien immobilier et portefeuille d'actions.",
    useCase:
      "Utile pour investisseurs, familles, PME, conseillers et etudiants finance.",
    safety:
      "Ce n'est pas un conseil financier; les rendements, taxes et risques varient fortement.",
    related:
      "A combiner avec rendement locatif, valeur nette et fonds monetaires.",
    terms: [
      ["Investment Property vs Stocks Comparator", "Comparateur immobilier vs actions"],
      ["Property", "Immobilier"],
      ["Stocks", "Actions"],
      ["Dividend", "Dividende"],
      ["Liquidity", "Liquidite"],
      ["Risk", "Risque"],
    ],
  },
  {
    enSlug: "pwa-manifest",
    frSlug: "generateur-manifest-pwa",
    title: "Generateur manifest PWA | AfroTools",
    name: "Manifest PWA",
    description:
      "Preparez nom, icones, theme, affichage, couleurs, start URL et JSON.",
    eyebrow: "Developpeurs",
    lead:
      "Generez une base de manifest pour rendre une application web installable.",
    useCase:
      "Utile pour developpeurs, agences, etudiants, startups et createurs no-code.",
    safety:
      "Testez icones, chemins, cache, service worker et compatibilite navigateur.",
    related:
      "A combiner avec hebergement web, domaines africains et generateur JSON.",
    terms: [
      ["PWA Manifest Generator", "Generateur manifest PWA"],
      ["PWA", "PWA"],
      ["Manifest", "Manifest"],
      ["Icon", "Icone"],
      ["Theme color", "Couleur theme"],
      ["Start URL", "Start URL"],
    ],
  },
  {
    enSlug: "qr-payment",
    frSlug: "cout-paiement-qr",
    title: "Calculateur cout paiement QR | AfroTools",
    name: "Paiement QR",
    description:
      "Estimez montant, frais marchand, passerelle, impression, reconciliation et cout net.",
    eyebrow: "Paiements",
    lead:
      "Comparez le cout d'un paiement QR pour boutique, marche, evenement ou collecte.",
    useCase:
      "Utile pour commercants, fintechs, ONG, evenements, restaurants et PME.",
    safety:
      "Verifiez frais reels, limites, securite, remboursement et reconciliation du fournisseur.",
    related:
      "A combiner avec frais POS, frais marchand et generateur QR.",
    terms: [
      ["QR Payment Cost Calculator", "Calculateur cout paiement QR"],
      ["QR payment", "Paiement QR"],
      ["Merchant fee", "Frais marchand"],
      ["Gateway", "Passerelle"],
      ["Reconciliation", "Reconciliation"],
      ["Net cost", "Cout net"],
    ],
  },
  {
    enSlug: "afropoints",
    frSlug: "afropoints",
    title: "AfroPoints — Gagnez de l'argent avec vos données locales | AfroTools",
    name: "AfroPoints",
    description: "Partagez des prix, taux et coûts vérifiés de votre marché local, gagnez des points et encaissez via mobile money dans 54 pays africains.",
    eyebrow: "Données communautaires",
    lead: "Contribuez des prix du marché, des taux de change et des coûts locaux vérifiés, puis suivez vos points, votre score de confiance et vos retraits depuis un seul tableau de bord.",
    useCase: "Utile pour étudiants, commerçants et professionnels qui connaissent les prix réels de leur ville et veulent un revenu complémentaire.",
    safety: "Ne partagez jamais de données personnelles sensibles. Chaque contribution passe par une vérification par consensus avant validation et paiement.",
    related: "À utiliser avec le suivi carburant, les prix des produits locaux et le convertisseur de devises.",
    methodology: "Chaque contribution est comparée aux soumissions d'autres membres ; le consensus attribue les points, le score de confiance et l'accès aux paliers de retrait.",
    sourceNote: "Source principale : contributions communautaires vérifiées AfroPoints. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Comment gagne-t-on des points AfroPoints ?", text: "En soumettant des données locales vérifiables : prix de marché, taux de change, loyers, salaires ou coûts courants. Les soumissions confirmées par consensus créditent vos points." },
      { name: "Comment retirer ses gains ?", text: "Une fois le palier de retrait atteint, l'encaissement se fait via mobile money selon votre pays. Les délais et minimums sont affichés dans le tableau de bord." },
      { name: "Les données soumises sont-elles publiques ?", text: "Les données validées alimentent les outils AfroTools de façon agrégée. Vos informations de compte restent privées." },
      { name: "Que faire si une soumission est rejetée ?", text: "Vérifiez la fraîcheur et la source de votre donnée, puis soumettez à nouveau. Les rejets répétés baissent le score de confiance, les validations le remontent." },
    ],
    terms: [
      ["Earn Money by Contributing African Data", "Gagnez de l'argent avec vos données africaines"],
      ["Contribute data", "Contribuer des données"],
      ["Cash out", "Retrait"],
      ["Trust score", "Score de confiance"],
      ["Verified", "Vérifié"],
      ["Points balance", "Solde de points"],
    ],
  },
  {
    enSlug: "informal-fx-watch",
    frSlug: "taux-change-parallele",
    title: "Taux de change parallèle en Afrique | AfroTools",
    name: "Taux de change parallèle",
    description: "Suivez les écarts entre taux officiel, bureaux de change et P2P sur les grands corridors africains, avec des taux soumis et vérifiés par la communauté.",
    eyebrow: "Devises et corridors",
    lead: "Comparez le taux officiel, le taux rue/BDC et le taux P2P avant d'échanger, puis vérifiez la fraîcheur et le niveau de confiance des données du corridor.",
    useCase: "Utile pour importateurs, diaspora et voyageurs qui doivent choisir le bon canal de change au bon moment.",
    safety: "Les taux parallèles sont indicatifs et changent vite. Vérifiez la réglementation locale des changes avant toute opération.",
    related: "À utiliser avec le convertisseur de devises, les frais de transfert d'argent et l'impact FX sur les imports.",
    methodology: "Les écarts sont calculés entre le taux officiel de référence et les taux informels soumis via AfroPoints, avec horodatage et niveau de confiance par corridor.",
    sourceNote: "Source principale : taux communautaires vérifiés et taux officiels de référence. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Quelle est la différence entre taux officiel et taux parallèle ?", text: "Le taux officiel vient de la banque centrale ou du marché interbancaire ; le taux parallèle reflète la rue, les bureaux de change et le P2P. L'écart mesure la tension sur la devise." },
      { name: "Les taux affichés sont-ils garantis ?", text: "Non. Ce sont des taux observés et horodatés, utiles comme repère de négociation, pas une cotation ferme." },
      { name: "Puis-je soumettre un taux ?", text: "Oui, via AfroPoints : chaque taux soumis est comparé aux autres soumissions du corridor avant validation." },
      { name: "Le change parallèle est-il légal ?", text: "Cela dépend du pays. Renseignez-vous sur la réglementation locale des changes avant d'utiliser un canal informel." },
    ],
    terms: [
      ["Informal FX Watch", "Taux de change parallèle"],
      ["Street rate", "Taux de rue"],
      ["Official rate", "Taux officiel"],
      ["Spread", "Écart"],
      ["Corridor", "Corridor"],
      ["Last updated", "Dernière mise à jour"],
    ],
  },
  {
    enSlug: "retirement-readiness",
    frSlug: "preparation-retraite",
    title: "Score de préparation à la retraite | AfroTools",
    name: "Préparation à la retraite",
    description: "Calculez votre score de préparation à la retraite : épargne projetée, adéquation de la pension et manque mensuel dans 15 pays africains.",
    eyebrow: "Épargne et retraite",
    lead: "Estimez si votre épargne et votre pension couvriront vos dépenses, puis identifiez le manque mensuel à combler avant la retraite.",
    useCase: "Utile pour salariés et indépendants qui veulent un diagnostic rapide avant d'ajuster épargne, pension ou investissements.",
    safety: "Projection éducative, pas un conseil financier. Vérifiez les règles de pension locales et vos relevés réels avant décision.",
    related: "À utiliser avec la projection de pension, le planificateur retraite FIRE et le calculateur d'inflation.",
    methodology: "Le score combine épargne actuelle, contributions, rendement attendu, inflation locale et dépenses cibles pour estimer l'adéquation et le manque mensuel.",
    sourceNote: "Source principale : hypothèses de pension et d'inflation par pays, à confirmer avec vos relevés officiels. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Que signifie mon score de préparation ?", text: "Il compare le revenu de retraite projeté à vos dépenses cibles. Un score faible indique un manque mensuel à combler par plus d'épargne, plus de temps ou des dépenses revues." },
      { name: "Quels pays sont couverts ?", text: "Quinze pays africains avec inflation et hypothèses de pension locales. Vous pouvez modifier chaque hypothèse pour votre situation." },
      { name: "Le score remplace-t-il un conseiller ?", text: "Non. C'est un diagnostic de planification à confirmer avec vos relevés de pension et, si possible, un professionnel." },
      { name: "Comment améliorer mon score ?", text: "Augmentez le taux d'épargne, allongez l'horizon, réduisez les dépenses cibles ou diversifiez les sources de revenu de retraite, puis recalculez." },
    ],
    terms: [
      ["Retirement Readiness Score", "Score de préparation à la retraite"],
      ["Monthly shortfall", "Manque mensuel"],
      ["Pension adequacy", "Adéquation de la pension"],
      ["Savings", "Épargne"],
      ["Target expenses", "Dépenses cibles"],
    ],
  },
  {
    enSlug: "lobola-negotiation-checklist",
    frSlug: "checklist-negociation-dot",
    title: "Checklist de négociation de la dot (lobola) | AfroTools",
    name: "Négociation de la dot",
    description: "Préparez une rencontre familiale respectueuse : rôles, questions, éléments confirmés, cadeaux en attente et calendrier de paiement de la dot.",
    eyebrow: "Famille et traditions",
    lead: "Structurez la rencontre des familles avec une checklist claire : qui parle, quoi confirmer, quoi noter et quoi reporter à une prochaine rencontre.",
    useCase: "Utile pour les familles qui préparent une négociation de dot ou de lobola et veulent des notes copiables à partager entre aînés.",
    safety: "Les coutumes varient fortement selon les communautés. Adaptez chaque élément aux aînés et aux usages de votre famille.",
    related: "À utiliser avec la liste de cadeaux de dot et le budget mariage.",
    methodology: "La checklist organise rôles, questions et décisions en éléments confirmés, en attente ou reportés, puis produit une note de discussion copiable.",
    sourceNote: "Source principale : pratiques familiales et communautaires ; aucun barème officiel n'existe. Dernière vérification de la page : 2026.",
    lobolaNative: "checklist",
    faq: [
      { name: "La checklist fixe-t-elle un montant de dot ?", text: "Non. Elle structure la discussion ; les montants et cadeaux relèvent des familles et de la coutume locale." },
      { name: "Qui devrait remplir la checklist ?", text: "Un représentant de chaque famille peut la préparer avant la rencontre, puis la mettre à jour pendant la discussion." },
      { name: "Peut-on partager les notes ?", text: "Oui, la note de discussion se copie et s'envoie par WhatsApp ou e-mail pour garder les deux familles alignées." },
    ],
    terms: [
      ["Lobola Negotiation Checklist", "Checklist de négociation de la dot"],
      ["Family meeting", "Rencontre familiale"],
      ["Confirmed", "Confirmé"],
      ["Pending", "En attente"],
      ["Discussion notes", "Notes de discussion"],
    ],
  },
  {
    enSlug: "lobola-gift-list",
    frSlug: "liste-cadeaux-dot",
    title: "Liste de cadeaux de dot (lobola) | AfroTools",
    name: "Liste de cadeaux de dot",
    description: "Composez une liste de cadeaux respectueuse : couvertures, provisions, vêtements, notes de bétail, transport et soutien de cérémonie, avec hypothèses modifiables.",
    eyebrow: "Famille et traditions",
    lead: "Listez les cadeaux attendus par catégorie, estimez les coûts avec des hypothèses modifiables et suivez ce qui est confirmé ou en attente.",
    useCase: "Utile pour les familles qui préparent la cérémonie et veulent un budget cadeau clair, partageable entre les deux familles.",
    safety: "Les listes varient selon les communautés. Confirmez chaque catégorie avec les aînés avant d'acheter.",
    related: "À utiliser avec la checklist de négociation de la dot et le budget mariage.",
    methodology: "Chaque catégorie de cadeaux reçoit une estimation modifiable ; le total et le statut (confirmé, en attente) se mettent à jour pour le suivi familial.",
    sourceNote: "Source principale : pratiques familiales et communautaires ; les prix sont des estimations locales à vérifier. Dernière vérification de la page : 2026.",
    lobolaNative: "gift-list",
    faq: [
      { name: "La liste est-elle un barème officiel ?", text: "Non. C'est un support d'organisation : les cadeaux et montants dépendent de la coutume et de l'accord des familles." },
      { name: "Peut-on modifier les catégories ?", text: "Oui, chaque catégorie et chaque estimation se modifie pour refléter la liste réelle convenue entre les familles." },
      { name: "Comment partager la liste ?", text: "Copiez le résumé et envoyez-le par WhatsApp ou e-mail afin que les deux familles suivent les mêmes éléments." },
    ],
    terms: [
      ["Lobola Gift List", "Liste de cadeaux de dot"],
      ["Blankets", "Couvertures"],
      ["Groceries", "Provisions"],
      ["Livestock", "Bétail"],
      ["Ceremony support", "Soutien de cérémonie"],
    ],
  },
  {
    enSlug: "creator-invoice",
    frSlug: "facture-createur",
    title: "Factures et devis pour créateurs | AfroTools",
    name: "Facture créateur",
    description: "Créez des factures et devis professionnels multi-devises avec taxes, messages client et export PDF, pensés pour créateurs et freelances africains.",
    eyebrow: "Business créateur",
    lead: "Préparez une facture ou un devis propre en quelques minutes : devise locale, taxes, conditions de paiement et export PDF prêt à envoyer.",
    useCase: "Utile pour créateurs, freelances et petites agences qui facturent des marques locales ou internationales.",
    safety: "Vérifiez les mentions fiscales exigées dans votre pays (TVA, numéro fiscal) avant d'envoyer la facture.",
    related: "À utiliser avec le générateur de factures classique, le calculateur TVA et les frais de transfert d'argent.",
    methodology: "Les champs multi-devises, taxes et remises calculent le total dû ; le document s'exporte en PDF avec vos informations et votre message client.",
    sourceNote: "Source principale : vos conditions commerciales et les règles de facturation locales. Dernière vérification de la page : 2026.",
    businessCtaNote: "Gardez le devis accepté et la facture PDF dans le même dossier client avant de relancer un paiement.",
    iframeEmbed: true,
    faq: [
      { name: "Puis-je facturer en plusieurs devises ?", text: "Oui, choisissez la devise du client (NGN, XOF, USD, EUR...) et indiquez le taux appliqué si vous convertissez." },
      { name: "La TVA est-elle gérée ?", text: "Vous pouvez ajouter la TVA ou toute taxe locale en pourcentage ; vérifiez le taux et les mentions exigées dans votre pays." },
      { name: "Le PDF est-il personnalisable ?", text: "Oui : logo, coordonnées, conditions de paiement et message client apparaissent sur le document exporté." },
    ],
    terms: [
      ["Invoice & Quote Builder", "Générateur de factures et devis"],
      ["Invoice", "Facture"],
      ["Quote", "Devis"],
      ["Due date", "Date d'échéance"],
      ["Payment terms", "Conditions de paiement"],
      ["Client", "Client"],
    ],
  },
  {
    enSlug: "creator-page",
    frSlug: "page-createur",
    title: "Page lien-en-bio pour créateurs | AfroTools",
    name: "Page créateur",
    description: "Créez une page lien-en-bio élégante : thèmes personnalisés, produits numériques, pourboires et newsletter, sans écrire de code.",
    eyebrow: "Présence créateur",
    lead: "Rassemblez tous vos liens, offres et réseaux sur une seule page rapide à partager en bio Instagram, TikTok ou X.",
    useCase: "Utile pour créateurs, artistes et petites marques qui veulent une vitrine simple avec vente et pourboires intégrés.",
    safety: "Vérifiez les conditions des moyens de paiement locaux avant d'activer la vente ou les pourboires.",
    related: "À utiliser avec le générateur de bios, le lien WhatsApp et la facture créateur.",
    methodology: "Choisissez un thème, ajoutez liens, produits et formulaire newsletter ; la page se publie avec une adresse unique à mettre en bio.",
    sourceNote: "Source principale : vos contenus et offres. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Faut-il savoir coder ?", text: "Non. Les thèmes et blocs se configurent visuellement ; la page est prête en quelques minutes." },
      { name: "Puis-je vendre des produits numériques ?", text: "Oui, ajoutez un bloc produit avec prix et lien de paiement ; vérifiez les frais du prestataire de paiement choisi." },
      { name: "La page est-elle rapide sur mobile ?", text: "Oui, elle est pensée mobile d'abord pour les visiteurs venant d'Instagram, TikTok ou WhatsApp." },
    ],
    terms: [
      ["One Link. Everything You.", "Un seul lien. Tout vous."],
      ["Link-in-bio", "Lien-en-bio"],
      ["Tips", "Pourboires"],
      ["Digital products", "Produits numériques"],
      ["Newsletter", "Newsletter"],
      ["Theme", "Thème"],
    ],
  },
  {
    enSlug: "creator-hashtags",
    frSlug: "hashtags-createur",
    title: "Générateur de hashtags pour créateurs | AfroTools",
    name: "Hashtags créateur",
    description: "Générez des jeux de hashtags stratégiques par plateforme : tendances, niche et communauté, classés par niveau de portée.",
    eyebrow: "Croissance créateur",
    lead: "Obtenez des jeux de hashtags équilibrés entre forte portée, niche et communauté locale, adaptés à chaque plateforme.",
    useCase: "Utile pour créateurs et community managers qui veulent une stratégie de hashtags répétable sans recherche manuelle.",
    safety: "Évitez les hashtags interdits ou hors sujet : ils peuvent réduire la portée du compte.",
    related: "À utiliser avec les légendes créateur, le calendrier de contenu et les stats créateur.",
    methodology: "Chaque jeu combine hashtags à forte portée, hashtags de niche et tags communautaires, avec un classement par niveau de portée estimé.",
    sourceNote: "Source principale : catégories de tags par plateforme et thème. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Combien de hashtags utiliser ?", text: "Selon la plateforme : Instagram tolère des jeux plus larges, X et LinkedIn préfèrent 2 à 5 tags précis. L'outil adapte la taille du jeu." },
      { name: "Les hashtags africains sont-ils couverts ?", text: "Oui, les jeux incluent des tags communautaires locaux par pays et par niche quand ils existent." },
      { name: "Faut-il changer de hashtags à chaque post ?", text: "Alternez plusieurs jeux proches pour éviter la répétition exacte tout en gardant votre niche." },
    ],
    terms: [
      ["Hashtag Generator for Creators", "Générateur de hashtags pour créateurs"],
      ["Trending", "Tendances"],
      ["Niche", "Niche"],
      ["Reach", "Portée"],
      ["Copy set", "Copier le jeu"],
    ],
  },
  {
    enSlug: "creator-captions",
    frSlug: "legendes-createur",
    title: "Rédacteur de légendes pour réseaux sociaux | AfroTools",
    name: "Légendes créateur",
    description: "Rédigez des légendes adaptées à Instagram, X, LinkedIn, TikTok et Facebook en un clic, avec plusieurs variations par plateforme.",
    eyebrow: "Contenu créateur",
    lead: "Décrivez votre post une fois et obtenez des légendes au bon format, au bon ton et à la bonne longueur pour chaque plateforme.",
    useCase: "Utile pour créateurs et marques qui publient sur plusieurs plateformes et veulent des légendes cohérentes sans tout réécrire.",
    safety: "Relisez chaque légende avant publication : ton, faits et mentions doivent rester exacts.",
    related: "À utiliser avec les hashtags créateur, le calendrier de contenu et le générateur de bios.",
    methodology: "À partir de votre sujet et de votre ton, l'outil produit plusieurs variations par plateforme en respectant limites de caractères et usages de format.",
    sourceNote: "Source principale : formats et limites par plateforme. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Les légendes sont-elles identiques partout ?", text: "Non : chaque plateforme reçoit sa version — plus courte et directe sur X, plus narrative sur LinkedIn, avec émojis et appels à l'action adaptés." },
      { name: "Puis-je écrire en français ?", text: "Oui, décrivez le post en français et gardez le ton souhaité ; relisez toujours avant de publier." },
      { name: "Combien de variations sont proposées ?", text: "Plusieurs par plateforme, pour choisir ou mélanger la meilleure accroche." },
    ],
    terms: [
      ["AI Caption Writer for Social Media", "Rédacteur de légendes pour réseaux sociaux"],
      ["Caption", "Légende"],
      ["Tone", "Ton"],
      ["Variations", "Variations"],
      ["Call to action", "Appel à l'action"],
    ],
  },
  {
    enSlug: "creator-bios",
    frSlug: "bio-createur",
    title: "Générateur de bios multi-plateformes | AfroTools",
    name: "Bio créateur",
    description: "Générez des bios parfaites pour Instagram, TikTok, X, LinkedIn, YouTube et Threads d'un coup, avec limites de caractères et ton adaptés.",
    eyebrow: "Présence créateur",
    lead: "Décrivez qui vous êtes et ce que vous faites : chaque plateforme reçoit une bio à la bonne longueur, avec le bon ton.",
    useCase: "Utile pour créateurs et professionnels qui veulent des bios cohérentes partout sans compter les caractères.",
    safety: "Vérifiez que liens et mentions respectent les règles de chaque plateforme.",
    related: "À utiliser avec la page créateur, les légendes créateur et le lien WhatsApp.",
    methodology: "Un seul brief génère des bios par plateforme en respectant la limite de caractères, le ton choisi et vos mots-clés.",
    sourceNote: "Source principale : limites et usages de bio par plateforme. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Pourquoi une bio différente par plateforme ?", text: "Les limites et attentes diffèrent : 150 caractères sur Instagram, ton professionnel sur LinkedIn, accroche courte sur X. L'outil adapte chaque version." },
      { name: "Puis-je inclure des émojis ?", text: "Oui, selon le ton choisi ; l'outil dose les émojis différemment entre Instagram, TikTok et LinkedIn." },
      { name: "La bio peut-elle être en français ?", text: "Oui, rédigez le brief en français et le ton s'adapte à votre audience francophone." },
    ],
    terms: [
      ["One Tap, Every Platform Bio", "Une bio pour chaque plateforme"],
      ["Bio", "Bio"],
      ["Character limit", "Limite de caractères"],
      ["Tone matching", "Ton adapté"],
      ["Keywords", "Mots-clés"],
    ],
  },
  {
    enSlug: "creator-calendar",
    frSlug: "calendrier-createur",
    title: "Calendrier de contenu pour créateurs | AfroTools",
    name: "Calendrier créateur",
    description: "Planifiez vos publications Instagram, TikTok, YouTube, X et LinkedIn avec des idées de contenu et les temps forts culturels africains.",
    eyebrow: "Organisation créateur",
    lead: "Remplissez votre semaine de publication avec des idées adaptées à votre niche et aux moments forts locaux, sans page blanche.",
    useCase: "Utile pour créateurs et petites marques qui veulent une cadence de publication régulière sur plusieurs plateformes.",
    safety: "Adaptez les idées proposées à votre audience ; vérifiez les dates locales avant de planifier un contenu événementiel.",
    related: "À utiliser avec les légendes créateur, les hashtags créateur et les stats créateur.",
    methodology: "Le calendrier propose des créneaux et des idées par plateforme et par niche, en intégrant fêtes et temps forts culturels africains.",
    sourceNote: "Source principale : calendrier culturel et bonnes pratiques de publication par plateforme. Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Combien de posts par semaine planifier ?", text: "Commencez par une cadence tenable (3 à 5 posts) et augmentez si vos stats le justifient ; la régularité bat le volume." },
      { name: "Les fêtes locales sont-elles incluses ?", text: "Oui, les temps forts culturels et fêtes africaines apparaissent pour ancrer votre contenu dans l'actualité locale." },
      { name: "Puis-je exporter le calendrier ?", text: "Oui, copiez ou exportez votre planning pour le partager avec votre équipe." },
    ],
    terms: [
      ["Content calendar & planner", "Calendrier et planificateur de contenu"],
      ["Content ideas", "Idées de contenu"],
      ["Schedule", "Planning"],
      ["Posting slot", "Créneau de publication"],
      ["Weekly plan", "Plan hebdomadaire"],
    ],
  },
  {
    enSlug: "creator-analytics",
    frSlug: "stats-createur",
    title: "Suivi de performance de contenu | AfroTools",
    name: "Stats créateur",
    description: "Suivez la performance de vos contenus sur toutes les plateformes : ce qui marche, ce qui ne marche pas et quoi faire ensuite, sans tableur.",
    eyebrow: "Performance créateur",
    lead: "Centralisez vos indicateurs par plateforme et repérez les formats qui font grandir votre audience.",
    useCase: "Utile pour créateurs qui veulent des décisions de contenu fondées sur les chiffres plutôt que l'intuition.",
    safety: "Les indicateurs saisis restent dans votre navigateur sauf export volontaire.",
    related: "À utiliser avec le calendrier de contenu, les hashtags créateur et les légendes créateur.",
    methodology: "Saisissez ou importez vos indicateurs par post ; l'outil calcule tendances, meilleurs formats et recommandations de prochaine action.",
    sourceNote: "Source principale : vos statistiques par plateforme (Studio, Insights, Analytics). Dernière vérification de la page : 2026.",
    iframeEmbed: true,
    faq: [
      { name: "Faut-il connecter mes comptes ?", text: "Non : saisissez les chiffres clés depuis vos tableaux de bord natifs ; tout reste dans votre navigateur." },
      { name: "Quels indicateurs suivre en priorité ?", text: "Portée, taux d'engagement et abonnés gagnés par post suffisent pour repérer les formats gagnants." },
      { name: "Comment décider du prochain contenu ?", text: "Répétez les formats au-dessus de votre médiane d'engagement et testez une variable à la fois : accroche, durée ou horaire." },
    ],
    terms: [
      ["Content Performance Tracker", "Suivi de performance de contenu"],
      ["Engagement rate", "Taux d'engagement"],
      ["Reach", "Portée"],
      ["Followers gained", "Abonnés gagnés"],
      ["Best format", "Meilleur format"],
    ],
  },
];

const COVERAGE_WAVE = require("../data/localization/coverage-wave-2026-07.json");
const WAVE_PAGES = COVERAGE_WAVE.french.filter((page) => page.native !== true).map((page) => ({
  enSlug: page.enSlug,
  frSlug: page.frSlug,
  title: `${page.name} | AfroTools`,
  name: page.name,
  description: page.description,
  eyebrow: "Outil pratique",
  lead: `Préparez votre démarche avec l’outil « ${page.name} » dans une interface française claire.`,
  useCase: "Utilisez cette page pour rassembler les informations utiles avant d’ouvrir le flux complet de l’outil.",
  safety: "Vérifiez les règles, tarifs, sources et hypothèses qui s’appliquent à votre pays avant de prendre une décision.",
  related: "Consultez aussi l’annuaire français pour trouver les calculateurs et guides associés.",
  sourceNote: "Cette page localisée s’appuie sur l’outil anglais indiqué. La logique métier reste celle de la source déterministe; les données variables doivent être vérifiées à leur date d’utilisation.",
  terms: page.originalName && page.originalName !== page.name ? [[page.originalName, page.name]] : [],
}));
const PAGES = [...CURATED_PAGES, ...WAVE_PAGES];

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

function lobolaNativeMarkup(page) {
  const countryOptions = ["Afrique du Sud", "Zimbabwe", "Botswana", "Zambie", "Eswatini", "Lesotho", "Namibie", "Autre / transfrontalier"]
    .map((country) => `<option value="${country}">${country}</option>`)
    .join("");
  if (page.lobolaNative === "checklist") {
    return `<section id="tool-mount" class="lobola-native" data-lobola-fr-checklist>
      <div class="lobola-native-heading"><div><span>Rencontre familiale</span><h2>Préparer les personnes, les questions et les décisions</h2></div><button type="button" data-use-plan disabled>Utiliser le dernier plan sauvegardé</button></div>
      <form class="lobola-native-form">
        <div class="lobola-native-grid"><label for="fr-check-country">Pays ou contexte<select id="fr-check-country" name="country">${countryOptions}</select></label><label for="fr-check-range">Montant ou fourchette déjà discuté<input id="fr-check-range" name="range" placeholder="Ex. encore à confirmer"></label><label for="fr-check-family-a">Représentants d'une famille<input id="fr-check-family-a" name="familyA" placeholder="Parents, aînés, oncles, tantes"></label><label for="fr-check-family-b">Représentants de l'autre famille<input id="fr-check-family-b" name="familyB" placeholder="Parents, aînés, oncles, tantes"></label></div>
        <label for="fr-check-confirmed">Éléments confirmés<textarea id="fr-check-confirmed" name="confirmed" placeholder="Personnes, date, cadeaux ou modalités déjà confirmés"></textarea></label><label for="fr-check-pending">Questions encore ouvertes<textarea id="fr-check-pending" name="pending" placeholder="Bétail, espèces, cadeaux, calendrier, témoins ou logistique"></textarea></label><label for="fr-check-next">Prochaine étape<textarea id="fr-check-next" name="next" placeholder="Qui appelle qui, quelle date et quel point doit être confirmé ?"></textarea></label>
        <div class="lobola-native-checks"><label><input type="checkbox" name="roles" checked> Les deux familles savent qui peut parler en leur nom.</label><label><input type="checkbox" name="items"> Espèces, bétail, cadeaux et cérémonie restent séparés.</label><label><input type="checkbox" name="timing"> Le calendrier et l'affordabilité restent ouverts à la discussion.</label></div>
        <div class="lobola-native-actions"><button type="submit">Mettre à jour le résumé</button><button type="button" class="secondary" data-copy-native>Copier le résumé</button><span data-native-status aria-live="polite"></span></div>
      </form><output class="lobola-native-output" data-native-output aria-live="polite"></output>
    </section>`;
  }
  if (page.lobolaNative === "gift-list") {
    return `<section id="tool-mount" class="lobola-native" data-lobola-fr-gifts>
      <div class="lobola-native-heading"><div><span>Budget cadeaux</span><h2>Séparer les cadeaux et la logistique</h2></div><button type="button" data-use-plan disabled>Utiliser le dernier plan sauvegardé</button></div>
      <form class="lobola-native-form"><div class="lobola-native-grid"><label for="fr-gift-country">Pays ou contexte<select id="fr-gift-country" name="country">${countryOptions}</select></label><label for="fr-gift-currency">Devise<select id="fr-gift-currency" name="currency"><option>ZAR</option><option>USD</option><option>BWP</option><option>ZMW</option><option>SZL</option><option>LSL</option><option>NAD</option><option>XOF</option><option>EUR</option></select></label><label for="fr-gift-items">Cadeaux et articles pratiques<input id="fr-gift-items" name="gifts" type="number" min="0" step="1" inputmode="decimal" value="0"></label><label for="fr-gift-travel">Déplacement des représentants<input id="fr-gift-travel" name="travel" type="number" min="0" step="1" inputmode="decimal" value="0"></label><label for="fr-gift-ceremony">Nourriture, rencontre et cérémonie<input id="fr-gift-ceremony" name="ceremony" type="number" min="0" step="1" inputmode="decimal" value="0"></label><label for="fr-gift-other">Autres éléments confirmés<input id="fr-gift-other" name="other" type="number" min="0" step="1" inputmode="decimal" value="0"></label></div><label for="fr-gift-notes">Notes et statut<textarea id="fr-gift-notes" name="notes" placeholder="Notez ce qui est confirmé, en attente, facultatif ou non nécessaire."></textarea></label><div class="lobola-native-actions"><button type="submit">Mettre à jour le total</button><button type="button" class="secondary" data-copy-native>Copier le résumé</button><span data-native-status aria-live="polite"></span></div></form><output class="lobola-native-output" data-native-output aria-live="polite"></output>
    </section>`;
  }
  return "";
}

function lobolaNativeScript() {
  return `<script>
(function () {
  function value(form, name) { var field = form.elements[name]; return field && String(field.value || '').trim(); }
  function amount(form, name) { var number = Number(value(form, name)); return Number.isFinite(number) && number > 0 ? number : 0; }
  function copy(text, status) { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { status.textContent = 'Résumé copié.'; }).catch(function () { status.textContent = 'Sélectionnez le résumé et copiez-le manuellement.'; }); } else { status.textContent = 'Sélectionnez le résumé et copiez-le manuellement.'; } }
  function savedPlan() { try { return JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1') || 'null'); } catch (error) { return null; } }
  function localCountry(country) { return ({ 'South Africa':'Afrique du Sud', 'Zambia':'Zambie', 'Namibia':'Namibie' })[country] || country || ''; }
  var checklist = document.querySelector('[data-lobola-fr-checklist]');
  if (checklist) {
    var checkForm = checklist.querySelector('form'); var checkOutput = checklist.querySelector('[data-native-output]'); var checkStatus = checklist.querySelector('[data-native-status]'); var checkUse = checklist.querySelector('[data-use-plan]'); var plan = savedPlan(); checkUse.disabled = !plan;
    function checkSummary() { return ['Checklist de rencontre familiale', 'Contexte : ' + (value(checkForm, 'country') || 'à confirmer'), 'Montant ou fourchette : ' + (value(checkForm, 'range') || 'à confirmer'), 'Représentants : ' + (value(checkForm, 'familyA') || 'à confirmer') + ' / ' + (value(checkForm, 'familyB') || 'à confirmer'), 'Confirmé : ' + (value(checkForm, 'confirmed') || 'rien pour le moment'), 'Questions ouvertes : ' + (value(checkForm, 'pending') || 'à compléter'), 'Prochaine étape : ' + (value(checkForm, 'next') || 'à confirmer'), 'Rappel : document de préparation, pas accord juridique ni barème officiel.'].join('\\n'); }
    function renderCheck() { checkOutput.textContent = checkSummary(); checkStatus.textContent = ''; }
    checkForm.addEventListener('input', renderCheck); checkForm.addEventListener('change', renderCheck); checkForm.addEventListener('submit', function (event) { event.preventDefault(); renderCheck(); }); checklist.querySelector('[data-copy-native]').addEventListener('click', function () { copy(checkSummary(), checkStatus); }); checkUse.addEventListener('click', function () { if (!plan) return; checkForm.elements.country.value = localCountry(plan.country) || checkForm.elements.country.value; checkForm.elements.range.value = (plan.currency || '') + ' ' + Math.round(Number(plan.total) || 0).toLocaleString('fr-FR'); renderCheck(); checkStatus.textContent = 'Dernier plan importé depuis cet appareil.'; }); renderCheck();
  }
  var gifts = document.querySelector('[data-lobola-fr-gifts]');
  if (gifts) {
    var giftForm = gifts.querySelector('form'); var giftOutput = gifts.querySelector('[data-native-output]'); var giftStatus = gifts.querySelector('[data-native-status]'); var giftUse = gifts.querySelector('[data-use-plan]'); var giftPlan = savedPlan(); giftUse.disabled = !giftPlan;
    function giftSummary() { var currency = value(giftForm, 'currency') || 'ZAR'; var giftValue = amount(giftForm, 'gifts'); var travel = amount(giftForm, 'travel'); var ceremony = amount(giftForm, 'ceremony'); var other = amount(giftForm, 'other'); var total = giftValue + travel + ceremony + other; function money(number) { return currency + ' ' + Math.round(number).toLocaleString('fr-FR'); } return ['Liste de cadeaux et logistique', 'Contexte : ' + (value(giftForm, 'country') || 'à confirmer'), 'Cadeaux et articles : ' + money(giftValue), 'Déplacement : ' + money(travel), 'Rencontre et cérémonie : ' + money(ceremony), 'Autres éléments : ' + money(other), 'Total modifiable : ' + money(total), 'Notes : ' + (value(giftForm, 'notes') || 'aucune'), 'Rappel : vérifiez chaque élément avec les familles avant tout achat ou engagement.'].join('\\n'); }
    function renderGifts() { giftOutput.textContent = giftSummary(); giftStatus.textContent = ''; }
    giftForm.addEventListener('input', renderGifts); giftForm.addEventListener('change', renderGifts); giftForm.addEventListener('submit', function (event) { event.preventDefault(); renderGifts(); }); gifts.querySelector('[data-copy-native]').addEventListener('click', function () { copy(giftSummary(), giftStatus); }); giftUse.addEventListener('click', function () { if (!giftPlan) return; giftForm.elements.country.value = localCountry(giftPlan.country) || giftForm.elements.country.value; giftForm.elements.currency.value = giftPlan.currency || giftForm.elements.currency.value; giftForm.elements.gifts.value = Number(giftPlan.giftValue) || 0; giftForm.elements.ceremony.value = Number(giftPlan.ceremonyCost) || 0; renderGifts(); giftStatus.textContent = 'Dernier plan importé depuis cet appareil.'; }); renderGifts();
  }
})();
</script>`;
}

function htmlFor(page) {
  if (page.enSlug === "route-fares") {
    return require("./lib/route-fares-locale-page.js").render("fr");
  }
  const enUrl = `${SITE}/tools/${page.enSlug}/`;
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const terms = JSON.stringify([...page.terms, ...COMMON_TERMS]);
  const faqItems = page.faq || [
    { name: `Quand utiliser ${page.name} ?`, text: page.useCase },
    { name: "Comment lire le resultat ?", text: page.safety },
  ];
  const schema = JSON.stringify(
    [
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
        provider: { "@type": "Organization", name: "AfroTools", url: `${SITE}/` },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
          { "@type": "ListItem", position: 2, name: "Outils", item: `${SITE}/fr/all-tools/` },
          { "@type": "ListItem", position: 3, name: page.name, item: frUrl },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: "fr",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.name,
          acceptedAnswer: { "@type": "Answer", text: item.text },
        })),
      },
    ],
    null,
    2
  );
  const nativeTool = lobolaNativeMarkup(page);
  const prepPanel = nativeTool ? "" : `<section class="prep-panel" aria-label="Preparation rapide">
      <h2>Preparez votre saisie</h2>
      <p>Notez les trois informations utiles avant de lancer l'outil. Rien n'est envoye: ce brouillon reste dans votre navigateur.</p>
      <form class="prep-form" data-fr-prep>
        <div class="prep-fields">
          <label>Pays ou devise<input name="country" autocomplete="off" placeholder="Ex: Senegal, XOF"></label>
          <label>Montant ou volume<input name="amount" autocomplete="off" placeholder="Ex: 250000"></label>
          <label>Objectif<input name="goal" autocomplete="off" placeholder="Ex: comparer deux scenarios"></label>
          <label>Fichier de travail<input name="file" type="file" aria-label="Fichier de travail local"></label>
        </div>
        <output class="prep-output" data-prep-output>Ajoutez un pays, un montant ou un objectif pour preparer votre resume.</output>
        <div class="prep-actions"><button type="button" data-copy-prep>Copier le resume</button><button type="button" data-download-prep>Telecharger le brief</button><span class="prep-note" data-copy-status aria-live="polite"></span></div>
        <p class="privacy-note"><strong>Confidentialite locale 2026:</strong> le fichier selectionne et le brouillon restent dans votre navigateur; ne collez pas de donnees sensibles dans un service externe sans accord explicite.</p>
      </form>
    </section>`;
  const toolEmbed = nativeTool || (page.iframeEmbed
    ? `<iframe id="tool-mount" src="/tools/${page.enSlug}/" title="${escapeHtml(page.name)}" loading="lazy" style="width:100%;min-height:760px;border:1px solid #dbe4ef;border-radius:8px;background:#fff"></iframe>`
    : `<div id="tool-mount" class="source-launch"><h2>Continuer dans le calculateur complet</h2><p>Le brief ci-dessus reste local. Ouvrez le calculateur principal pour utiliser tous les controles, puis copiez ou telechargez votre resume pour verification.</p><a class="primary-action" href="/tools/${page.enSlug}/">Ouvrir le calculateur complet</a></div>`);
  const sourceImportScript = nativeTool ? lobolaNativeScript() : "";

  return `<!DOCTYPE html>
<!-- Generated by scripts/generate-fr-tool-gap-pages.js. Edit source data there. -->
<html data-chat-bundle="/assets/js/bundles/chat.8446833d.min.js" lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="afrotools-content-id" content="fr-tool-gap:${escapeHtml(page.frSlug)}">
  <meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
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
  <meta property="og:locale" content="fr_FR">
  <meta name="robots" content="index, follow">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${SITE}/assets/img/og-default.png">
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="fr" href="${frUrl}" />
  <link rel="alternate" hreflang="x-default" href="${enUrl}" />
  <link rel="stylesheet" href="/assets/css/global.css">
  <script src="/assets/js/components/business-cta.js?v=25d06338" defer></script>
  <style>
    .fr-tool-shell{max-width:1120px;margin:0 auto;padding:92px 20px 58px}
    .breadcrumb{font-size:.92rem;color:#64748b;margin-bottom:18px}.breadcrumb a{color:#2563eb;text-decoration:none}
    .eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:10px}
    h1{font-size:clamp(2rem,5vw,3.35rem);line-height:1.06;margin:0 0 16px;color:#0f172a}
    .lead{max-width:790px;color:#475569;font-size:1.08rem;line-height:1.7;margin:0 0 24px}
    .route-note{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}.route-note span{border:1px solid #dbe4ef;border-radius:999px;padding:7px 11px;background:#f8fafc;color:#334155;font-size:.86rem}
    .action-row{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:11px 16px;font-weight:800;text-decoration:none}.primary-action{background:#0f766e;color:#fff}.secondary-action{border:1px solid #cbd5e1;color:#0f172a;background:#fff}
    .prep-panel{border:1px solid #b6e4dd;background:linear-gradient(135deg,#ecfdf5 0%,#f8fafc 100%);border-radius:8px;padding:18px;margin:0 0 24px}.prep-panel h2{font-size:1.05rem;margin:0 0 6px;color:#064e3b}.prep-panel p{margin:0 0 14px;color:#334155;line-height:1.55}
    .prep-form{display:grid;gap:12px}.prep-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:10px}.prep-form label{display:grid;gap:5px;font-size:.82rem;font-weight:800;color:#0f172a}.prep-form input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 11px;font:inherit;background:#fff}.prep-output{display:block;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;padding:12px;line-height:1.5;min-height:52px}.prep-actions{display:flex;flex-wrap:wrap;gap:8px}.prep-actions button{border:0;border-radius:999px;background:#0f172a;color:#fff;font-weight:800;padding:10px 14px;cursor:pointer}.prep-note{font-size:.82rem;color:#64748b}.privacy-note{margin-top:10px;border-left:4px solid #10b981;background:#f0fdf4;border-radius:8px;padding:10px 12px;color:#365346;font-size:.9rem;line-height:1.55}
    #tool-mount{background:#fff;border:1px solid #dbe4ef;border-radius:8px;padding:18px;box-shadow:0 10px 28px rgba(15,23,42,.08);overflow:hidden}
    .lobola-native{display:grid;gap:16px}.lobola-native-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.lobola-native-heading span{display:block;color:#0f766e;font-size:.76rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.lobola-native-heading h2{margin:4px 0 0;font-size:1.25rem;color:#0f172a}.lobola-native-heading button,.lobola-native-actions button{border:0;border-radius:999px;background:#0f766e;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}.lobola-native-heading button:disabled{opacity:.48;cursor:not-allowed}.lobola-native-form{display:grid;gap:13px}.lobola-native-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lobola-native-form label{display:grid;gap:6px;color:#0f172a;font-size:.86rem;font-weight:800}.lobola-native-form input,.lobola-native-form select,.lobola-native-form textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:10px 11px;font:inherit;color:#0f172a}.lobola-native-form textarea{min-height:84px;resize:vertical}.lobola-native-checks{display:grid;gap:8px;border:1px solid #dbe4ef;border-radius:8px;background:#f8fafc;padding:12px}.lobola-native-checks label{display:flex;grid-template-columns:none;align-items:flex-start;gap:8px;font-weight:650}.lobola-native-checks input{width:auto;margin-top:3px}.lobola-native-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px}.lobola-native-actions button.secondary{background:#0f172a}.lobola-native-actions span{color:#64748b;font-size:.86rem}.lobola-native-output{display:block;white-space:pre-line;border:1px solid #b6e4dd;border-left:4px solid #0f766e;border-radius:0 8px 8px 0;background:#f0fdf4;padding:14px;color:#334155;line-height:1.62;min-height:110px}
    .tool-status{color:#64748b}.tool-error{padding:18px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;color:#991b1b}.tool-error a{color:#1d4ed8}
    .support-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:26px}.support-grid section{border:1px solid #dbe4ef;border-radius:8px;padding:18px;background:#fff}.support-grid h2{font-size:1rem;margin:0 0 8px;color:#111827}.support-grid p{margin:0;color:#475569;line-height:1.55;font-size:.94rem}
    @media (max-width:760px){.fr-tool-shell{padding-top:76px}.support-grid,.lobola-native-grid{grid-template-columns:1fr}#tool-mount{padding:12px}.lobola-native-heading{display:grid}.lobola-native-heading button,.lobola-native-actions button{width:100%}}
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
      <span>Interface en francais</span>
      <span>Calculateur complet disponible</span>
      <span>Estimation a verifier localement</span>
    </div>
    <div class="action-row">
      <a class="primary-action" href="#tool-mount">Utiliser l'outil ici</a>
      <a class="secondary-action" href="/tools/${page.enSlug}/">Ouvrir le calculateur complet</a>
    </div>
${prepPanel}
    ${toolEmbed}
    <div class="support-grid" data-tool-verification-panel>
      <section><h2>Usage recommande</h2><p>${escapeHtml(page.useCase)}</p></section>
      <section><h2>Methodologie</h2><p>${escapeHtml(page.methodology || "Nous preparons les entrees cles, ouvrons le calculateur complet et affichons les resultats avec les hypotheses utiles pour une verification locale.")}</p></section>
      <section><h2>Avertissement</h2><p>${escapeHtml(page.safety)} Cette page fournit une estimation generale: elle ne remplace pas un avis juridique, fiscal, medical, financier ou professionnel adapte a votre pays.</p></section>
      <section><h2>Liens utiles</h2><p>${escapeHtml(page.related)}</p></section>
      <section><h2>Sources et fraicheur</h2><p>${escapeHtml(page.sourceNote || "Controle 2026: comparez le resultat avec le document de reference, les consignes du client, les exigences de depot et les sources officielles ou professionnelles avant envoi.")}</p></section>
    </div>
${page.businessCtaNote ? `    <afro-business-cta tool-name="${escapeHtml(page.name)}" prospect-segment="business" save-note="${escapeHtml(page.businessCtaNote)}"></afro-business-cta>` : ""}
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
    nodes.forEach(function (node) {
      var next = swapText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"],button').forEach(function (el) {
      ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(function (attr) {
        if (el.hasAttribute && el.hasAttribute(attr)) {
          var current = el.getAttribute(attr);
          var next = swapText(current);
          if (next !== current) el.setAttribute(attr, next);
        }
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
(function () {
  var pageName = ${JSON.stringify(page.name)};
  var useCase = ${JSON.stringify(page.useCase)};
  var form = document.querySelector('[data-fr-prep]');
  if (!form) return;
  var output = form.querySelector('[data-prep-output]');
  var status = form.querySelector('[data-copy-status]');
  function field(name) {
    var input = form.querySelector('[name="' + name + '"]');
    return input && input.value ? input.value.trim() : '';
  }
  function summary() {
    var parts = [];
    var country = field('country');
    var amount = field('amount');
    var goal = field('goal');
    var file = form.querySelector('[name="file"]');
    var fileText = file && file.files && file.files.length ? file.files.length + ' fichier(s) local/localises' : '';
    if (country) parts.push('Pays/devise: ' + country);
    if (amount) parts.push('Montant/volume: ' + amount);
    if (goal) parts.push('Objectif: ' + goal);
    if (fileText) parts.push(fileText);
    if (!parts.length) return 'Ajoutez un pays, un montant ou un objectif pour preparer votre resume.';
    return pageName + ' - ' + parts.join(' | ') + '. Usage: ' + useCase;
  }
  function render() {
    output.textContent = summary();
    if (status) status.textContent = '';
  }
  form.addEventListener('input', render);
  var copy = form.querySelector('[data-copy-prep]');
  if (copy) {
    copy.addEventListener('click', function () {
      var text = summary();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (status) status.textContent = 'Resume copie.';
        }).catch(function () {
          if (status) status.textContent = text;
        });
      } else if (status) {
        status.textContent = text;
      }
    });
  }
  var download = form.querySelector('[data-download-prep]');
  if (download) {
    download.addEventListener('click', function () {
      var blob = new Blob([summary()], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-brief.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (status) status.textContent = 'Brief telecharge.';
    });
  }
})();
</script>
${sourceImportScript}
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
  const slugArg = process.argv.find((arg) => arg.startsWith("--slugs="));
  const selected = slugArg
    ? new Set(slugArg.slice("--slugs=".length).split(",").map((slug) => slug.trim()).filter(Boolean))
    : null;
  const pages = selected
    ? PAGES.filter((page) => selected.has(page.frSlug) || selected.has(page.enSlug))
    : PAGES;
  if (selected && pages.length !== selected.size) {
    const found = new Set(pages.flatMap((page) => [page.frSlug, page.enSlug]));
    const missing = Array.from(selected).filter((slug) => !found.has(slug));
    throw new Error(`Unknown French page slug(s): ${missing.join(", ")}`);
  }
  for (const page of pages) {
    const source = path.join("tools", page.enSlug, "index.html");
    if (!fs.existsSync(source)) {
      throw new Error(`Missing English source page: ${source}`);
    }
    const dir = path.join("fr", "tools", page.frSlug);
    fs.mkdirSync(dir, { recursive: true });
    // Accent/elision repair at generation time: legacy PAGES copy is partly
    // ASCII-only French; this keeps regeneration from undoing the sitewide repair.
    const { processHtml: repairFrenchAccents } = require("./repair-fr-accents.js");
    fs.writeFileSync(path.join(dir, "index.html"), repairFrenchAccents(htmlFor(page)), "utf8");
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
