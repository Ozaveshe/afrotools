"use strict";

const number = (name, label, value, extra = {}) => ({ name, label, type: "number", value, min: 0, step: "any", ...extra });
const text = (name, label, value = "", extra = {}) => ({ name, label, type: "text", value, ...extra });
const date = (name, label, value = "2026-07-29") => ({ name, label, type: "date", value });
const area = (name, label, value = "") => ({ name, label, type: "textarea", value });
const select = (name, label, options, value) => ({ name, label, type: "select", options, value: value || options[0].value });
const currencies = [{ value: "XOF", label: "XOF" }, { value: "XAF", label: "XAF" }, { value: "NGN", label: "NGN" }, { value: "KES", label: "KES" }, { value: "ZAR", label: "ZAR" }, { value: "USD", label: "USD" }];

const routes = [
  {
    id: "startup-runway", slug: "runway-startup", title: "Calculateur de runway startup", export: "txt",
    description: "Calculez la consommation nette de trésorerie, le runway et l’écart mensuel à couvrir.",
    fields: [select("currency", "Devise", currencies, "XOF"), number("cashBalance", "Trésorerie disponible", 12000000), number("monthlyRevenue", "Encaissements mensuels", 3000000), number("monthlyCosts", "Coûts de trésorerie mensuels", 5000000)]
  },
  {
    id: "tam-sam-som", slug: "taille-marche-tam-sam-som", title: "Calculateur TAM, SAM et SOM", export: "txt",
    description: "Dimensionnez un marché à partir d’un segment, d’un nombre de clients et d’hypothèses explicites.",
    fields: [text("segment", "Segment visé", "PME de services"), number("customers", "Clients adressables", 100000), number("arpu", "Revenu annuel moyen par client", 50000), number("accessiblePct", "Part accessible (%)", 25, { max: 100 }), number("sharePct", "Part de marché visée (%)", 2, { max: 100 }), number("growthPct", "Croissance annuelle (%)", 8)]
  },
  {
    id: "unit-economics", slug: "economie-unitaire", title: "Calculateur d’économie unitaire", export: "txt",
    description: "Mesurez contribution unitaire, seuil de rentabilité, profit mensuel et ratio LTV/CAC.",
    fields: [number("price", "Prix de vente unitaire", 15000), number("variableCost", "Coût variable principal", 5000), number("otherVariableCost", "Autres coûts variables", 1000), number("fixedCosts", "Coûts fixes mensuels", 1500000), number("units", "Unités vendues par mois", 200), number("refundPct", "Taux de remboursement (%)", 3, { max: 99 }), number("cac", "Coût d’acquisition client", 8000), number("lifetimeUnits", "Unités sur la durée de vie client", 8)]
  },
  {
    id: "churn-rate", slug: "taux-attrition-clients", title: "Calculateur de taux d’attrition", export: "txt",
    description: "Rapprochez clients perdus, churn revenu et rétention nette sur une période cohérente.",
    fields: [select("method", "Méthode clients perdus", [{ value: "reconcile", label: "Début + nouveaux − fin" }, { value: "direct", label: "Saisie directe" }]), number("customersStart", "Clients au début", 1000), number("customersAdded", "Nouveaux clients", 100), number("customersEnd", "Clients à la fin", 1030), number("customersChurned", "Clients perdus (direct)", 70), number("mrrStart", "Revenu récurrent au début", 10000000), number("mrrChurned", "Revenu perdu", 500000), number("mrrContraction", "Contraction", 100000), number("mrrExpansion", "Expansion", 300000)]
  },
  {
    id: "burn-rate", slug: "burn-rate-startup", title: "Calculateur de burn rate", export: "txt",
    description: "Calculez la consommation brute, la consommation nette et le runway à partir de vos flux.",
    fields: [select("currency", "Devise", currencies, "XOF"), number("cashBalance", "Trésorerie disponible", 18000000), number("monthlyRevenue", "Encaissements mensuels", 4000000), number("monthlyCosts", "Coûts mensuels totaux", 6500000)]
  },
  {
    id: "cash-flow-forecast", slug: "prevision-tresorerie", title: "Prévision de trésorerie sur 12 mois", export: "csv",
    description: "Projetez encaissements, coûts variables, charges fixes, provision fiscale et solde mensuel.",
    fields: [select("currency", "Devise", currencies, "XOF"), number("openingBalance", "Solde d’ouverture", 8000000), number("month1Revenue", "Encaissements du mois 1", 5000000), number("monthlyGrowthPct", "Croissance mensuelle (%)", 3), number("cogsPct", "Coûts variables (%)", 35, { max: 100 }), number("fixedMonthly", "Charges fixes mensuelles", 1800000), number("taxRatePct", "Provision fiscale (%)", 10, { max: 100 }), number("oneTimeCost", "Coût exceptionnel au mois 1", 500000)]
  },
  {
    id: "pos-agent", slug: "rentabilite-agent-pos", title: "Rentabilité d’un agent POS", export: "txt",
    description: "Estimez commissions, coût d’exploitation, marge et délai de récupération du capital.",
    fields: [text("provider", "Fournisseur ou réseau", "Réseau saisi"), number("dailyTransactions", "Transactions quotidiennes", 80), number("averageTransaction", "Montant moyen", 10000), number("failurePct", "Échecs ou annulations (%)", 3, { max: 99 }), number("operatingDays", "Jours d’activité par mois", 26, { max: 31 }), number("commissionPct", "Commission (%)", 0.5, { max: 100 }), number("commissionCap", "Plafond par transaction", 0), number("deviceCost", "Coût du terminal", 150000), number("floatCapital", "Fonds de caisse", 500000), number("monthlyRent", "Loyer mensuel", 50000), number("otherMonthlyCosts", "Autres coûts mensuels", 70000)]
  },
  {
    id: "mini-importation", slug: "marge-mini-importation", title: "Calculateur de marge mini-importation", export: "csv",
    description: "Calculez coût rendu, droits, marge et retour sur investissement à partir de devis vérifiables.",
    fields: [text("product", "Produit", "Article test"), number("supplierPriceUsd", "Prix fournisseur unitaire (USD)", 8), number("units", "Unités", 100), number("fxRate", "Taux de change exécuté", 620), number("shipping", "Transport en devise locale", 150000), number("dutyPct", "Droit de douane (%)", 20), number("otherCharges", "Autres charges import", 50000), number("clearingFee", "Frais de dédouanement", 30000), number("sellingPrice", "Prix de vente unitaire", 9000)]
  },
  {
    id: "mama-put", slug: "rentabilite-restauration-rue", title: "Rentabilité de restauration de rue", export: "txt",
    description: "Testez prix, portions, ingrédients, coûts quotidiens et profit mensuel d’un plat.",
    fields: [text("dish", "Plat", "Plat principal"), number("dishPrice", "Prix par portion", 2500), number("portions", "Portions vendues par jour", 80), number("ingredientCost", "Ingrédients par portion", 900), number("rent", "Loyer quotidien imputé", 15000), number("staff", "Personnel quotidien", 25000), number("utilities", "Énergie et eau", 8000), number("otherCosts", "Autres coûts quotidiens", 5000), number("workingDays", "Jours par mois", 26)]
  },
  {
    id: "marketplace-fees", slug: "frais-marketplace", title: "Comparateur de frais marketplace", export: "txt",
    description: "Comparez le produit net après commission, frais fixes, publicité, transport et autres retenues.",
    fields: [text("marketplace", "Marketplace", "Plateforme A"), number("salePrice", "Prix de vente", 25000), number("feePct", "Commission (%)", 12), number("fixedFee", "Frais fixes", 500), number("shipping", "Transport à votre charge", 1500), number("ads", "Publicité par vente", 800), number("otherFees", "Autres retenues", 300)]
  },
  {
    id: "brand-collab-roi", slug: "roi-collaboration-marque", title: "ROI d’une collaboration de marque", export: "txt",
    description: "Rapprochez budget, attribution, marge, impressions et conversions sans confondre corrélation et causalité.",
    fields: [text("campaign", "Campagne", "Campagne pilote"), number("budget", "Budget", 1000000), number("impressions", "Impressions attribuées", 250000), number("revenue", "Revenu attribué", 3000000), number("grossMarginPct", "Marge brute (%)", 45, { max: 100 }), number("conversions", "Conversions attribuées", 300)]
  },
  {
    id: "business-continuity", slug: "plan-continuite-activite", title: "Plan de continuité d’activité", export: "txt",
    description: "Créez un brouillon local avec RTO, RPO, menaces et actions de validation.",
    fields: [text("businessName", "Entreprise", "PME exemple"), text("country", "Pays", "Sénégal"), text("sector", "Secteur", "Services"), text("staffBand", "Effectif", "11–50"), select("rto", "RTO", [{ value: "4 heures", label: "4 heures" }, { value: "24 heures", label: "24 heures" }, { value: "72 heures", label: "72 heures" }]), select("rpo", "RPO", [{ value: "1 heure", label: "1 heure" }, { value: "4 heures", label: "4 heures" }, { value: "24 heures", label: "24 heures" }]), area("threats", "Menaces, une par ligne", "Coupure électrique\nPanne informatique")]
  },
  {
    id: "event-decoration-cost", slug: "cout-decoration-evenement", title: "Budget de décoration événementielle", export: "txt",
    description: "Additionnez quantités, prix unitaires, main-d’œuvre, transport et marge de contingence.",
    fields: [number("guests", "Invités attendus", 200), number("balloonArches", "Arches de ballons", 2), number("balloonUnitCost", "Coût par arche", 75000), number("floral", "Compositions florales", 10), number("floralUnitCost", "Coût par composition", 15000), number("centerpieces", "Centres de table", 20), number("centerpieceUnitCost", "Coût par centre", 8000), number("draping", "Drapés", 120000), number("lighting", "Éclairage", 100000), number("signage", "Signalétique et fond", 80000), number("chairs", "Housses de chaise", 200), number("chairUnitCost", "Coût par chaise", 1000), number("setupLabour", "Installation et main-d’œuvre", 150000), number("transport", "Transport", 50000), number("contingencyPct", "Contingence (%)", 10)]
  },
  {
    id: "factory-setup-cost", slug: "cout-installation-usine", title: "Coût d’installation d’une usine", export: "json",
    description: "Construisez un modèle CAPEX par surface, lots de travaux, équipements et fonds de roulement.",
    fields: [text("sector", "Secteur", "agroalimentaire"), number("area", "Surface (m²)", 500), number("land", "Terrain et site", 10000000), number("building", "Bâtiment ou aménagement", 25000000), number("machinery", "Machines", 40000000), number("utilities", "Raccordements et utilités", 8000000), number("permits", "Permis et honoraires", 3000000), number("monthlyOperatingCash", "Besoin mensuel d’exploitation", 6000000), number("workingCapitalMonths", "Mois de fonds de roulement", 3), number("contingencyPct", "Contingence (%)", 10)]
  },
  {
    id: "fashion-brand-startup", slug: "cout-lancement-marque-mode", title: "Coût de lancement d’une marque de mode", export: "txt",
    description: "Estimez collection, stock initial, coûts de marque, contribution et seuil de récupération.",
    fields: [number("pieces", "Pièces de la première collection", 100), number("retailPrice", "Prix de vente par pièce", 25000), number("monthlyUnits", "Unités vendues par mois", 50), number("fabricCost", "Tissu par pièce", 7000), number("labourCost", "Main-d’œuvre par pièce", 4000), number("notionsCost", "Mercerie par pièce", 1000), number("packagingCost", "Emballage par pièce", 700), number("brandingCost", "Identité de marque", 300000), number("websiteCost", "Site", 250000), number("photoCost", "Photos", 200000), number("showCost", "Lancement", 300000), number("marketingCost", "Marketing initial", 400000), number("equipmentCost", "Équipements", 500000)]
  },
  {
    id: "freelance-contract", slug: "contrat-freelance", title: "Générateur de contrat freelance", export: "txt",
    description: "Préparez localement un brouillon de contrat avec parties, livrables, calendrier, paiement et propriété intellectuelle.",
    fields: [text("freelancerName", "Nom du freelance", "Awa Diop"), text("businessName", "Nom commercial", "Studio Awa"), text("clientName", "Client", "Entreprise Exemple"), text("clientContact", "Représentant du client", "M. Exemple"), text("projectTitle", "Projet", "Identité visuelle"), area("projectDescription", "Description", "Conception d’une identité visuelle."), area("deliverables", "Livrables", "Logo, charte, fichiers sources"), date("startDate", "Date de début"), date("deliveryDate", "Date de livraison", "2026-08-29"), select("currency", "Devise", currencies, "XOF"), number("totalFee", "Honoraires totaux", 750000), text("paymentSchedule", "Échéancier", "50 % à la commande, 50 % à la livraison"), number("revisions", "Cycles de révision", 2), text("ipOwner", "Propriété intellectuelle", "Transfert après paiement intégral"), text("jurisdiction", "Droit envisagé", "À confirmer localement")]
  },
  {
    id: "freelancer-rate", slug: "tarif-freelance", title: "Calculateur de tarif freelance", export: "json",
    description: "Transformez objectif net, frais, réserve et capacité facturable en tarifs mensuel, journalier et horaire.",
    fields: [select("currency", "Devise", currencies, "XOF"), number("income", "Objectif mensuel net", 1000000), number("overhead", "Frais mensuels", 250000), number("reservePct", "Réserve (%)", 20, { max: 99 }), number("billableDays", "Jours facturables", 15), number("hoursPerDay", "Heures par jour", 6)]
  },
  {
    id: "graphic-design-pricing", slug: "prix-design-graphique", title: "Calculateur de prix de design graphique", export: "json",
    description: "Construisez un devis à partir des heures, du taux plancher, des frais et du tampon de périmètre.",
    fields: [text("projectType", "Type de projet", "Identité visuelle"), text("experience", "Niveau d’expérience", "confirmé"), number("concepts", "Concepts", 3), number("revisions", "Révisions", 2), text("timeline", "Délai", "14 jours"), text("license", "Droits d’usage", "usage commercial défini"), number("hours", "Heures estimées", 30), number("hourlyFloor", "Taux horaire plancher", 15000), number("expenses", "Frais du projet", 50000), number("scopeBufferPct", "Tampon de périmètre (%)", 15)]
  },
  {
    id: "guard-service-cost", slug: "cout-gardiennage", title: "Comparateur de coût de gardiennage", export: "txt",
    description: "Comparez un devis d’entreprise avec un scénario d’embauche directe et documentez les contrôles de conformité.",
    fields: [text("propertyType", "Type de site", "Commerce"), text("coverage", "Couverture", "24 h / 7 j"), number("posts", "Postes", 2), number("guardsPerPost", "Agents par poste", 3), text("guardType", "Type d’agent", "non armé"), number("companyQuote", "Devis société par agent", 200000), number("directWage", "Salaire direct par agent", 120000), number("directOncost", "Charges et relève par agent", 50000), number("otherCosts", "Autres coûts mensuels", 30000)]
  },
  {
    id: "influencer-rate", slug: "tarif-influenceur", title: "Générateur de tarif influenceur", export: "txt",
    description: "Construisez une carte tarifaire à partir du temps, de la production, des droits et de l’exclusivité.",
    fields: [text("platform", "Plateforme", "Instagram"), number("followers", "Abonnés enregistrés", 50000), number("engagementPct", "Engagement enregistré (%)", 4), text("niche", "Niche", "Beauté"), number("hours", "Temps de création (heures)", 12), number("hourlyFloor", "Taux horaire plancher", 20000), number("production", "Frais de production", 100000), number("usageRights", "Droits d’usage", 150000), number("exclusivity", "Exclusivité", 100000), number("dealsPerMonth", "Collaborations mensuelles", 2)]
  },
  {
    id: "made-in-africa-label", slug: "label-made-in-africa", title: "Vérificateur de préparation « Made in Africa »", export: "txt",
    description: "Préparez le dossier d’origine avec pays, code SH, règle citée et parts de matières sans rendre une décision officielle.",
    fields: [text("originCountry", "Pays de production", "Sénégal"), text("destinationCountry", "Pays de destination", "Côte d’Ivoire"), text("hsCode", "Code SH exact", "0000.00"), text("ruleReference", "Référence de la règle produit", "Règle à confirmer"), date("ruleDate", "Date de vérification"), number("exWorks", "Prix départ usine", 1000000), number("nonOriginating", "Matières non originaires", 250000), select("criterion", "Critère envisagé", [{ value: "transformed", label: "Transformation suffisante" }, { value: "wholly", label: "Entièrement obtenu" }]), area("evidence", "Preuves disponibles", "Factures matières et fiche de fabrication")]
  },
  {
    id: "nafdac-registration", slug: "cout-enregistrement-produit", title: "Budget d’enregistrement d’un produit", export: "txt",
    description: "Additionnez tarif officiel daté, essais, inspection, étiquetage et conseil sans prédire l’autorisation.",
    fields: [text("product", "Produit", "Produit exemple"), text("category", "Catégorie", "Aliment"), text("origin", "Origine", "locale"), number("applications", "Nombre de dossiers", 1, { step: 1 }), number("officialFee", "Tarif officiel par dossier", 100000), text("source", "Référence officielle", "Portail officiel consulté"), date("sourceDate", "Date de consultation"), number("testing", "Essais", 50000), number("facility", "Inspection ou site", 30000), number("labels", "Étiquetage", 20000), number("adviser", "Conseil", 40000), number("other", "Autres coûts", 10000)]
  },
  {
    id: "oee-calculator", slug: "calculateur-oee", title: "Calculateur OEE / TRS", export: "csv",
    description: "Calculez disponibilité, performance, qualité et OEE sur une période de mesure contrôlée.",
    fields: [number("scheduledMinutes", "Temps planifié (minutes)", 480), number("excludedMinutes", "Arrêts planifiés exclus", 30), number("downtimeMinutes", "Arrêts non planifiés", 45), number("idealCycleSeconds", "Cycle idéal (secondes)", 30), number("producedUnits", "Unités produites", 700), number("rejectUnits", "Unités rejetées", 20), number("contributionPerUnit", "Contribution par unité (facultatif)", 1000)]
  },
  {
    id: "packaging-cost", slug: "cout-emballage", title: "Calculateur de coût d’emballage", export: "json",
    description: "Calculez le coût unitaire complet à partir d’un devis daté, du carton, du fret, de l’outillage et des pertes.",
    fields: [select("currency", "Devise", currencies, "XOF"), text("product", "Produit", "Boisson 500 ml"), text("packagingType", "Type d’emballage", "bouteille"), text("size", "Spécification", "500 ml"), number("volume", "Volume mensuel", 10000), number("primaryUnit", "Emballage primaire unitaire", 120), number("printUnit", "Impression unitaire", 20), number("closureUnit", "Fermeture unitaire", 30), number("cartonQuote", "Prix du carton", 1200), number("unitsPerCarton", "Unités par carton", 24), number("freight", "Fret du lot", 300000), number("setup", "Outillage ou plaques", 500000), number("setupAllocationUnits", "Unités d’amortissement", 50000), number("wastePct", "Pertes (%)", 3), number("sellingPrice", "Prix de vente", 800), text("source", "Référence du devis", "Devis fournisseur A"), date("sourceDate", "Date du devis")]
  },
  {
    id: "production-cost", slug: "cout-production", title: "Calculateur de coût de production", export: "txt",
    description: "Calculez COGM, coût par unité bonne, marge et profit à partir du périmètre de production saisi.",
    fields: [select("currency", "Devise", currencies, "XOF"), number("units", "Unités lancées", 1000), number("rawMaterials", "Matières premières", 2000000), number("packaging", "Emballage", 500000), number("labour", "Main-d’œuvre directe", 700000), number("energy", "Énergie", 200000), number("rent", "Loyer imputé", 150000), number("depreciation", "Amortissement", 100000), number("transport", "Transport", 120000), number("other", "Autres frais", 80000), number("wastePct", "Pertes ou rejets (%)", 5, { max: 99 }), number("sellingPrice", "Prix de vente unitaire", 5000)]
  },
  {
    id: "quality-sampling", slug: "calculateur-d-echantillonnage-qualite", title: "Contrôle d’échantillonnage qualité", export: "txt",
    description: "Vérifiez un résultat observé contre les seuils Ac/Re d’un plan contrôlé et daté.",
    fields: [number("lotSize", "Taille du lot", 1000, { step: 1 }), text("planReference", "Référence du plan", "Plan interne QC-01"), date("planDate", "Date du plan"), number("sampleSize", "Taille de l’échantillon", 80, { step: 1 }), number("acceptNumber", "Seuil d’acceptation Ac", 2, { step: 1 }), number("rejectNumber", "Seuil de rejet Re", 3, { step: 1 }), number("defects", "Défauts observés", 1, { step: 1 }), number("costPerUnit", "Coût d’inspection par unité", 500)]
  },
  {
    id: "tailoring-pricing", slug: "tarification-couture", title: "Calculateur de devis couture", export: "txt",
    description: "Construisez un devis de couture à partir du temps, des matières, des frais, du tampon, de la marge et de l’urgence.",
    fields: [text("garment", "Vêtement", "Robe sur mesure"), text("complexity", "Complexité", "moyenne"), number("hours", "Heures de couture", 12), number("labourRate", "Taux horaire", 5000), number("fabricCost", "Tissu", 30000), number("notionsCost", "Mercerie", 5000), number("overheadCost", "Frais imputés", 10000), number("scopeBufferPct", "Tampon de périmètre (%)", 10, { max: 100 }), number("markupPct", "Marge ajoutée (%)", 25), number("rushFee", "Supplément urgence", 0), number("monthlyOrders", "Commandes mensuelles (scénario)", 15)]
  },
  {
    id: "youtube-revenue", slug: "revenus-youtube", title: "Rapprochement de revenus YouTube", export: "csv",
    description: "Rapprochez preuves Analytics, RPM, autres revenus, coûts et réserve sans inventer de taux de plateforme.",
    fields: [text("period", "Période", "Juillet 2026"), select("currency", "Devise", currencies, "XOF"), number("views", "Vues enregistrées", 500000), number("analyticsRpm", "RPM Analytics saisi", 1.5), number("recordedYoutube", "Revenu YouTube enregistré", 0), number("sponsorship", "Sponsoring", 300000), number("memberships", "Abonnements", 50000), number("affiliate", "Affiliation", 40000), number("otherRevenue", "Autres revenus", 10000), number("channelCosts", "Coûts de chaîne", 250000), number("reservePct", "Réserve (%)", 15, { max: 100 }), date("checkedDate", "Date de vérification"), text("evidenceReference", "Référence de preuve", "Export Analytics juillet 2026")]
  }
];

module.exports = { routes, currencies };
