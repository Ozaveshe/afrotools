(function initFrenchEnergyParity(root) {
  "use strict";

  var configNode = document.querySelector("script[data-fr-energy-config]");
  var config = null;
  try {
    config = configNode ? JSON.parse(configNode.textContent) : null;
  } catch (error) {
    config = null;
  }

  var exact = [
    ["Home", "Accueil"],
    ["Energy & Utilities", "Énergie et services publics"],
    ["Electricity cost", "Coût de l’électricité"],
    ["Convert money to estimated prepaid units or kWh to an estimated bill. Automatic results appear only where an exact provider-and-class tariff passes its freshness check.", "Convertissez un montant en unités prépayées estimées ou des kWh en facture estimée. Un résultat automatique n’est affiché que lorsqu’un tarif exact par fournisseur et catégorie satisfait au contrôle de fraîcheur."],
    ["Calculate with a current tariff", "Calculer avec un tarif à jour"],
    ["Amounts stay in this browser. Do not enter a token, meter number, address, phone number or payment reference.", "Les montants restent dans ce navigateur. Ne saisissez ni jeton, ni numéro de compteur, ni adresse, ni téléphone, ni référence de paiement."],
    ["Calculation direction", "Sens du calcul"],
    ["Money → prepaid units", "Montant → unités prépayées"],
    ["Units → bill", "Unités → facture"],
    ["Country", "Pays"],
    ["Uganda", "Ouganda"],
    ["South Africa", "Afrique du Sud"],
    ["Ivory Coast", "Côte d’Ivoire"],
    ["Priority markets are listed; unsupported markets switch to local custom-rate mode.", "Les marchés prioritaires sont listés ; les marchés non pris en charge passent au mode de tarif local personnalisé."],
    ["Provider (when available)", "Fournisseur (si disponible)"],
    ["Loading providers…", "Chargement des fournisseurs…"],
    ["Provider selection is automatic when only one verified schedule is maintained.", "Le fournisseur est sélectionné automatiquement lorsqu’une seule grille vérifiée est tenue à jour."],
    ["Customer class", "Catégorie de client"],
    ["Loading customer classes…", "Chargement des catégories de clients…"],
    ["Use the class shown on the account, bill, token receipt or utility notice. The calculator does not infer eligibility.", "Utilisez la catégorie indiquée sur le compte, la facture, le reçu de recharge ou l’avis du fournisseur. Le calculateur ne déduit pas l’admissibilité."],
    ["Purchase amount", "Montant de l’achat"],
    ["Enter the money paid for the token; do not enter a token or meter number.", "Saisissez le montant payé pour la recharge ; ne saisissez ni jeton ni numéro de compteur."],
    ["Receipt deductions (%)", "Déductions du reçu (%)"],
    ["Optional VAT, levy or percentage deduction shown on the receipt.", "TVA, prélèvement ou déduction en pourcentage facultatif indiqué sur le reçu."],
    ["Fixed receipt deductions (", "Déductions fixes du reçu ("],
    ["Optional arrears, debt recovery or fixed vending deduction.", "Arriérés, recouvrement de dette ou déduction fixe de vente facultatifs."],
    ["Use a current local rate", "Utiliser un tarif local à jour"],
    ["Copy the price per kWh and any fixed charge from a current bill or official notice. AfroTools does not store or validate these values.", "Copiez le prix par kWh et les éventuels frais fixes depuis une facture récente ou un avis officiel. AfroTools ne conserve ni ne valide ces valeurs."],
    ["Rate per kWh (", "Tarif par kWh ("],
    ["Fixed bill charge (", "Frais fixes de facture ("],
    ["Calculate electricity estimate", "Calculer l’estimation d’électricité"],
    ["Estimated prepaid units", "Unités prépayées estimées"],
    ["Estimated electricity bill", "Facture d’électricité estimée"],
    ["Amount for energy", "Montant consacré à l’énergie"],
    ["Energy charge", "Coût de l’énergie"],
    ["Deductions", "Déductions"],
    ["Effective cost per kWh", "Coût effectif par kWh"],
    ["Tariff breakdown", "Détail du tarif"],
    ["Tariff source and freshness", "Source et fraîcheur du tarif"],
    ["Loading tariff source…", "Chargement de la source tarifaire…"],
    ["Checking the maintained tariff record.", "Vérification du tarif tenu à jour."],
    ["Open official source", "Ouvrir la source officielle"],
    ["Immediate tariff examples", "Exemples tarifaires immédiats"],
    ["These crawlable examples use the same maintained records as the calculator and make the class assumptions explicit.", "Ces exemples indexables utilisent les mêmes données tenues à jour que le calculateur et précisent les hypothèses de catégorie."],
    ["Uganda standard: UGX 10,000", "Ouganda standard : 10 000 UGX"],
    ["At UEDCL’s Q3 2026 domestic standard rate of UGX 779.4/kWh, UGX 10,000 buys about ", "Au tarif domestique standard UEDCL du troisième trimestre 2026 de 779,4 UGX/kWh, 10 000 UGX achètent environ "],
    [" before receipt-specific deductions.", " avant les déductions propres au reçu."],
    ["Uganda lifeline: 30 kWh", "Ouganda tarif social : 30 kWh"],
    ["For an eligible UEDCL lifeline account, the first 15 kWh at UGX 250 and the next 15 kWh at UGX 779.4 total about ", "Pour un compte UEDCL admissible au tarif social, les 15 premiers kWh à 250 UGX et les 15 suivants à 779,4 UGX totalisent environ "],
    ["Tanzania D1: 100 kWh", "Tanzanie D1 : 100 kWh"],
    ["For a TANESCO D1 account, 75 kWh at TZS 100 plus 25 kWh at TZS 350 totals ", "Pour un compte TANESCO D1, 75 kWh à 100 TZS plus 25 kWh à 350 TZS totalisent "],
    ["Coverage and limitations", "Couverture et limites"],
    ["Automatic at release", "Calcul automatique au lancement"],
    ["Uganda:", "Ouganda :"],
    [" UEDCL Q3 2026 domestic standard, eligible domestic lifeline and commercial average classes. ", " catégories UEDCL du troisième trimestre 2026 : domestique standard, tarif social domestique admissible et moyenne commerciale. "],
    ["Tanzania:", "Tanzanie :"],
    [" TANESCO D1 low-usage domestic and T1 general-use classes from EWURA’s published schedule.", " catégories TANESCO D1 domestique à faible consommation et T1 usage général selon la grille publiée par l’EWURA."],
    ["Custom-rate only", "Tarif personnalisé uniquement"],
    ["Nigeria, Ghana, Kenya, South Africa, Zambia, Côte d'Ivoire and Senegal are not auto-calculated until exact current provider/class schedules are parsed and reviewed. A regulator homepage or national benchmark is not enough.", "Le Nigeria, le Ghana, le Kenya, l’Afrique du Sud, la Zambie, la Côte d’Ivoire et le Sénégal ne sont pas calculés automatiquement tant que les grilles exactes et actuelles par fournisseur et catégorie ne sont pas analysées et vérifiées. La page d’accueil d’un régulateur ou une moyenne nationale ne suffit pas."],
    ["Bills and token receipts may include taxes, levies, fixed charges, minimum charges, arrears, debt recovery, meter corrections or time-of-use pricing. Enter receipt deductions where known and verify the result before paying or disputing a charge.", "Les factures et reçus de recharge peuvent inclure taxes, prélèvements, frais fixes, minimums, arriérés, recouvrement de dette, corrections de compteur ou tarification horaire. Saisissez les déductions connues et vérifiez le résultat avant de payer ou de contester un montant."],
    ["Need to compare a meter reading with a bill?", "Besoin de comparer un relevé de compteur à une facture ?"],
    ["Need to estimate appliance usage first?", "Besoin d’estimer d’abord la consommation des appareils ?"],
    ["Electricity tariff questions", "Questions sur les tarifs d’électricité"],
    ["How many prepaid electricity units will I get?", "Combien d’unités d’électricité prépayées vais-je recevoir ?"],
    ["Choose the country, provider and customer class, then enter the purchase amount. Actual units can differ when a receipt includes deductions not entered here.", "Choisissez le pays, le fournisseur et la catégorie de client, puis saisissez le montant de l’achat. Les unités réelles peuvent différer si le reçu comporte des déductions non saisies ici."],
    ["Why is my country not calculated automatically?", "Pourquoi mon pays n’est-il pas calculé automatiquement ?"],
    ["Automatic estimates need an exact official provider-and-class schedule plus a passing validity and freshness check. Use a current local rate when that evidence is missing.", "Les estimations automatiques exigent une grille officielle exacte par fournisseur et catégorie, ainsi qu’un contrôle réussi de validité et de fraîcheur. Utilisez un tarif local à jour lorsque ces preuves manquent."],
    ["Is this an official bill or token receipt?", "S’agit-il d’une facture officielle ou d’un reçu de recharge ?"],
    ["No. It is a planning estimate. Confirm the result with the regulator or utility schedule and your actual receipt.", "Non. Il s’agit d’une estimation de planification. Confirmez le résultat avec la grille du régulateur ou du fournisseur et votre reçu réel."],
    ["No verified provider available", "Aucun fournisseur vérifié disponible"],
    ["Use a custom local rate", "Utiliser un tarif local personnalisé"],
    ["This tariff is no longer current enough for an automatic estimate. Enter a rate from a current bill or official notice instead.", "Ce tarif n’est plus assez récent pour une estimation automatique. Saisissez plutôt un tarif provenant d’une facture récente ou d’un avis officiel."],
    ["No current provider-and-class tariff is maintained for this country. Enter a current rate from your bill or official notice; it stays in this browser.", "Aucun tarif actuel par fournisseur et catégorie n’est tenu à jour pour ce pays. Saisissez un tarif récent depuis votre facture ou un avis officiel ; il reste dans ce navigateur."],
    ["Automatic estimate paused", "Estimation automatique suspendue"],
    ["Custom-rate mode", "Mode de tarif personnalisé"],
    ["The stored official record failed its validity or verification window.", "La donnée officielle enregistrée ne satisfait plus à sa période de validité ou de vérification."],
    ["No automatic tariff is claimed. Your rate is processed locally and is not saved.", "Aucun tarif automatique n’est revendiqué. Votre tarif est traité localement et n’est pas enregistré."],
    ["Effective ", "En vigueur le "],
    [" · verified ", " · vérifié le "],
    [" · official provider schedule · high confidence.", " · grille officielle du fournisseur · confiance élevée."],
    ["Open ", "Ouvrir "],
    ["User-entered percentage deduction", "Déduction en pourcentage saisie par l’utilisateur"],
    ["User-entered fixed deduction", "Déduction fixe saisie par l’utilisateur"],
    [" Custom rates are not verified by AfroTools.", " Les tarifs personnalisés ne sont pas vérifiés par AfroTools."],
    [" This is a planning estimate, not an official bill or token receipt.", " Il s’agit d’une estimation de planification, pas d’une facture officielle ni d’un reçu de recharge."],
    ["Enter a purchase amount greater than zero.", "Saisissez un montant d’achat supérieur à zéro."],
    ["Enter electricity units greater than zero.", "Saisissez un nombre d’unités supérieur à zéro."],
    ["Enter a current tariff rate greater than zero.", "Saisissez un tarif actuel supérieur à zéro."],
    ["Electricity units", "Unités d’électricité"],
    ["Enter monthly or billing-period consumption in kWh.", "Saisissez la consommation mensuelle ou celle de la période de facturation en kWh."],
    ["The tariff dataset could not be loaded. Automatic estimates are unavailable; try again later.", "Le jeu de données tarifaires n’a pas pu être chargé. Les estimations automatiques sont indisponibles ; réessayez plus tard."],
    ["Select Your Country", "Sélectionnez votre pays"],
    ["Choose a country starting point", "Choisissez un pays de départ"],
    ["Search or select country", "Rechercher ou sélectionner un pays"],
    ["Check a monthly bill with country assumptions", "Vérifier une facture mensuelle avec les hypothèses du pays"],
    ["Reconcile prepaid units and estimate days of supply", "Rapprocher les unités prépayées et estimer les jours d’autonomie"],
    ["Quick Outage Budget Planner", "Planificateur rapide du budget de secours"],
    ["Token receipt check", "Contrôle du reçu de recharge"],
    ["Account class", "Classe tarifaire"],
    ["Use country defaults", "Utiliser les valeurs du pays"],
    ["Use country tariff", "Utiliser le tarif du pays"],
    ["Check monthly bill", "Vérifier la facture mensuelle"],
    ["Check token receipt", "Vérifier le reçu de recharge"],
    ["Estimated bill breakdown", "Détail de la facture estimée"],
    ["Prepaid unit reconciliation", "Rapprochement des unités prépayées"],
    ["Copy breakdown", "Copier le détail"],
    ["Copy receipt check", "Copier le contrôle du reçu"],
    ["Download CSV evidence", "Télécharger les éléments CSV"],
    ["Which electricity tariff should I enter?", "Quel tarif d’électricité dois-je saisir ?"],
    ["Why can my electricity bill differ from this estimate?", "Pourquoi ma facture peut-elle différer de cette estimation ?"],
    ["Can I use this estimate in a billing dispute?", "Puis-je utiliser cette estimation pour contester une facture ?"],
    ["Why did my prepaid electricity units drop?", "Pourquoi mes unités prépayées ont-elles diminué ?"],
    ["Is this a prepaid electricity token generator?", "S’agit-il d’un générateur de jetons prépayés ?"],
    ["What evidence should I save for a prepaid vending complaint?", "Quels justificatifs conserver pour une réclamation sur une recharge ?"],
    ["Scenario inputs", "Données du scénario"],
    ["Market starter profile", "Profil de marché initial"],
    ["Local currency", "Devise locale"],
    ["Generator fuel type", "Carburant du générateur"],
    ["Generator fuel use (litres/hour)", "Consommation du générateur (litres/heure)"],
    ["Generator maintenance per month", "Entretien mensuel du générateur"],
    ["Current grid cost per kWh", "Coût actuel du réseau par kWh"],
    ["Solar deposit or upfront payment", "Acompte solaire ou paiement initial"],
    ["Solar maintenance (% of kit/year)", "Entretien solaire (% du kit/an)"],
    ["Emissions factor (kg CO2/litre)", "Facteur d’émission (kg CO₂/litre)"],
    ["Compare costs", "Comparer les coûts"],
    ["Cost comparison result", "Résultat de la comparaison des coûts"],
    ["Generator path", "Option générateur"],
    ["Solar and battery path", "Option solaire et batterie"],
    ["Bill inputs", "Données de la facture"],
    ["Billing period start", "Début de la période de facturation"],
    ["Billing period end", "Fin de la période de facturation"],
    ["Meter type", "Type de compteur"],
    ["Opening meter reading (optional)", "Relevé initial (facultatif)"],
    ["Closing meter reading (optional)", "Relevé final (facultatif)"],
    ["Billed consumption (kWh)", "Consommation facturée (kWh)"],
    ["Fixed charge for period", "Frais fixes de la période"],
    ["Arrears or balance brought forward", "Arriérés ou solde reporté"],
    ["Previous bill amount (optional)", "Montant de la facture précédente (facultatif)"],
    ["Verify bill", "Vérifier la facture"],
    ["Verification result", "Résultat de la vérification"],
    ["Expected bill breakdown", "Détail de la facture attendue"],
    ["Anomaly detection", "Détection des anomalies"],
    ["Dispute checklist", "Liste de contrôle pour une contestation"],
    ["Meter and tariff inputs", "Données du compteur et du tarif"],
    ["Country or city preset", "Préréglage du pays ou de la ville"],
    ["Usage mode", "Mode d’utilisation"],
    ["People, staff, or users served", "Personnes, employés ou usagers desservis"],
    ["Sewerage or service charge", "Frais d’assainissement ou de service"],
    ["Leak suspicion toggle", "Suspicion de fuite"],
    ["Measured night-flow test (optional)", "Test nocturne mesuré (facultatif)"],
    ["Test start reading (m3)", "Relevé au début du test (m³)"],
    ["Test end reading (m3)", "Relevé à la fin du test (m³)"],
    ["Test duration (minutes)", "Durée du test (minutes)"],
    ["Custom rates", "Tarifs personnalisés"],
    ["Calculate bill", "Calculer la facture"],
    ["Water bill result", "Résultat de la facture d’eau"],
    ["Bill breakdown", "Détail de la facture"],
    ["Usage signals", "Signaux de consommation"],
    ["Measured night-flow leak test", "Test nocturne de fuite mesuré"],
    ["Leak checklist and next steps", "Contrôles de fuite et prochaines étapes"],
    ["CALCULATOR INPUTS", "DONNÉES DU CALCULATEUR"],
    ["COUNTRY PRESET", "PRÉRÉGLAGE DU PAYS"],
    ["LOCAL CURRENCY", "DEVISE LOCALE"],
    ["CYLINDER SIZE", "TAILLE DE LA BOUTEILLE"],
    ["REFILL PRICE", "PRIX DE LA RECHARGE"],
    ["CYLINDER TARE WEIGHT (OPTIONAL)", "TARE DE LA BOUTEILLE (FACULTATIF)"],
    ["FILLED SCALE WEIGHT (OPTIONAL)", "POIDS DE LA BOUTEILLE PLEINE (FACULTATIF)"],
    ["USAGE MODE", "MODE D’UTILISATION"],
    ["USAGE FREQUENCY", "FRÉQUENCE D’UTILISATION"],
    ["MAIN USAGE MODEL", "MODÈLE D’UTILISATION PRINCIPAL"],
    ["MEALS PER DAY", "REPAS PAR JOUR"],
    ["BURNER HOURS PER DAY", "HEURES DE BRÛLEUR PAR JOUR"],
    ["ACTIVE BURNERS", "BRÛLEURS ACTIFS"],
    ["LPG PER MEAL", "GPL PAR REPAS"],
    ["LPG PER BURNER-HOUR", "GPL PAR HEURE DE BRÛLEUR"],
    ["BILLING MONTH LENGTH", "DURÉE DU MOIS DE FACTURATION"],
    ["PLANNING BUFFER", "MARGE DE PLANIFICATION"],
    ["COST BREAKDOWN", "DÉTAIL DES COÛTS"],
    ["SAFETY NOTES", "CONSIGNES DE SÉCURITÉ"],
    ["PRICE-CHECK NOTES", "NOTES DE VÉRIFICATION DU PRIX"],
    ["PAYGO PLAN INPUTS", "DONNÉES DU PLAN PAYGO"],
    ["SOLAR KIT USABLE ENERGY PER DAY", "ÉNERGIE SOLAIRE UTILE PAR JOUR"],
    ["CRITICAL LOAD TARGET", "OBJECTIF DE CHARGE PRIORITAIRE"],
    ["WATTS EACH", "WATTS PAR APPAREIL"],
    ["QUANTITY", "QUANTITÉ"],
    ["HOURS/DAY", "HEURES/JOUR"],
    ["KIT DEPOSIT", "ACOMPTE DU KIT"],
    ["REPAYMENT AMOUNT", "MONTANT DU REMBOURSEMENT"],
    ["REPAYMENT FREQUENCY", "FRÉQUENCE DE REMBOURSEMENT"],
    ["TERM LENGTH IN MONTHS", "DURÉE EN MOIS"],
    ["CURRENT GENERATOR OR GRID SPEND PER MONTH", "DÉPENSE MENSUELLE ACTUELLE : GÉNÉRATEUR OU RÉSEAU"],
    ["CURRENT SPEND THE KIT WILL REPLACE", "DÉPENSE ACTUELLE REMPLACÉE PAR LE KIT"],
    ["MAINTENANCE BUFFER PERCENT", "MARGE D’ENTRETIEN (%)"],
    ["PAYGO DECISION OUTPUT", "RÉSULTAT DE LA DÉCISION PAYGO"],
    ["RISK FLAGS", "SIGNAUX DE RISQUE"],
    ["DECISION CHECKLIST", "LISTE DE CONTRÔLE DE LA DÉCISION"],
    ["OUTAGE INPUTS", "DONNÉES DE LA COUPURE"],
    ["BUSINESS TYPE", "TYPE D’ENTREPRISE"],
    ["OUTAGE HOURS", "HEURES DE COUPURE"],
    ["REVENUE INPUT BASIS", "BASE DU CHIFFRE D’AFFAIRES"],
    ["REVENUE AMOUNT", "MONTANT DU CHIFFRE D’AFFAIRES"],
    ["OPERATING HOURS PER DAY", "HEURES D’ACTIVITÉ PAR JOUR"],
    ["STAFF IDLE COST PER HOUR", "COÛT HORAIRE DU PERSONNEL INACTIF"],
    ["GENERATOR OR BACKUP COST PER HOUR", "COÛT HORAIRE DU GÉNÉRATEUR OU DU SECOURS"],
    ["EXPECTED SPOILAGE PERCENT", "PERTES DE STOCK ATTENDUES (%)"],
    ["SIMILAR OUTAGES PER MONTH", "COUPURES SIMILAIRES PAR MOIS"],
    ["PROPOSED BACKUP CAPITAL COST", "INVESTISSEMENT DE SECOURS PROPOSÉ"],
    ["ESTIMATED OUTAGE IMPACT", "IMPACT ESTIMÉ DE LA COUPURE"],
    ["OPERATING CHECKLIST", "LISTE DE CONTRÔLE OPÉRATIONNEL"],
    ["NEXT ACTION PLAN", "PROCHAIN PLAN D’ACTION"],
    ["Your Appliance List", "Votre liste d’appareils"],
    ["Your Appliances", "Vos appareils"],
    ["Enter Your Requirements", "Saisissez vos besoins"],
    ["Your Battery System", "Votre système de batterie"],
    ["Your Farm Details", "Données de votre exploitation"],
    ["Community Details", "Données de la communauté"],
    ["Enter Your Monthly Energy Use", "Saisissez votre consommation mensuelle d’énergie"],
    ["Your EV Details", "Données de votre véhicule électrique"],
    ["Your Farm & Cooking Details", "Données de l’exploitation et de la cuisson"],
    ["Total Load (Watts)", "Charge totale (watts)"],
    ["Backup Hours Needed", "Heures d’autonomie nécessaires"],
    ["Battery Type", "Type de batterie"],
    ["System Voltage", "Tension du système"],
    ["Current Monthly Electricity Bill", "Facture mensuelle actuelle d’électricité"],
    ["Home Size (m²)", "Surface du logement (m²)"],
    ["Number of Occupants", "Nombre d’occupants"],
    ["Number of AC Units", "Nombre de climatiseurs"],
    ["Lighting Type", "Type d’éclairage"],
    ["Water Heating", "Chauffage de l’eau"],
    ["Run Energy Audit", "Lancer l’audit énergétique"],
    ["Savings Opportunities", "Possibilités d’économies"],
    ["Calculate Consumption", "Calculer la consommation"],
    ["Calculate Backup Time", "Calculer l’autonomie"],
    ["Farm Size (hectares)", "Surface de l’exploitation (hectares)"],
    ["Pump Sizing Basis", "Base de dimensionnement de la pompe"],
    ["Daily Pumping Hours", "Heures de pompage par jour"],
    ["Compare Costs", "Comparer les coûts"],
    ["Number of Households", "Nombre de ménages"],
    ["Number of Businesses / Anchors", "Nombre d’entreprises / clients piliers"],
    ["Avg kWh / Household / Month", "kWh moyens / ménage / mois"],
    ["Avg kWh / Business / Month", "kWh moyens / entreprise / mois"],
    ["Assess Feasibility", "Évaluer la faisabilité"],
    ["Grid Electricity (kWh/month)", "Électricité du réseau (kWh/mois)"],
    ["Diesel Generator (litres/month)", "Générateur diesel (litres/mois)"],
    ["LPG / Cooking Gas (kg/month)", "GPL / gaz de cuisson (kg/mois)"],
    ["Firewood / Biomass (kg/month)", "Bois / biomasse (kg/mois)"],
    ["Calculate Footprint", "Calculer l’empreinte"],
    ["Charging Type", "Type de recharge"],
    ["Daily Driving Distance (km)", "Distance parcourue par jour (km)"],
    ["Calculate EV Cost", "Calculer le coût du véhicule électrique"],
    ["Livestock Type", "Type d’élevage"],
    ["Number of Animals", "Nombre d’animaux"],
    ["Daily Cooking Hours", "Heures de cuisson par jour"],
    ["Installed cost quote", "Devis du coût d’installation"],
    ["LPG price per kg", "Prix du GPL par kg"],
    ["Verified bioslurry value per month", "Valeur mensuelle vérifiée du digestat"],
    ["Annual operating and maintenance cost", "Coût annuel d’exploitation et d’entretien"],
    ["Calculate ROI", "Calculer la rentabilité"],
    ["RUN HOURS PER DAY", "HEURES DE FONCTIONNEMENT PAR JOUR"],
    ["FUEL PRICE / LITRE", "PRIX DU CARBURANT / LITRE"],
    ["Planning readout", "Résultat de planification"],
    ["Before you buy fuel", "Avant d’acheter du carburant"],
    ["Create fuel brief", "Créer le brief carburant"],
    ["Copy fuel brief", "Copier le brief carburant"],
    ["Save to dashboard", "Enregistrer dans le tableau de bord"],
    ["Download the PDF report", "Télécharger le rapport PDF"],
    ["Download PDF report", "Télécharger le rapport PDF"],
    ["Copy report", "Copier le rapport"],
    ["Search or select country", "Rechercher ou sélectionner un pays"],
    ["Review assumptions before opening the calculator", "Vérifier les hypothèses avant d’ouvrir le calculateur"],
    ["Choose the solar workflow", "Choisir le parcours solaire"],
    ["Solar ROI methodology", "Méthodologie de rentabilité solaire"],
    ["Before acting", "Avant d’agir"],
    ["Methodology", "Méthodologie"],
    ["Assumptions and sources", "Hypothèses et sources"],
    ["Disclaimer", "Avertissement"],
    ["Sources & verification", "Sources et vérification"],
    ["Sources & freshness", "Sources et fraîcheur"],
    ["Related energy tools", "Outils énergie associés"],
    ["Country LPG pages", "Pages GPL par pays"],
    ["Country PayGo solar pages", "Pages solaires PayGo par pays"],
    ["Country outage pages", "Pages coupures par pays"],
    ["What to check", "Points à vérifier"],
    ["Limitations", "Limites"],
    ["Questions frequentes", "Questions fréquentes"],
    ["Frequently Asked Questions", "Questions fréquentes"],
    ["Tell Us About Your Home", "Décrivez votre logement"],
    ["Solar System Sizing for Africa — How It Works", "Dimensionnement solaire en Afrique — fonctionnement"],
    ["Inverter & Battery Sizing for Africa — A Guide", "Dimensionnement de l’onduleur et de la batterie en Afrique — guide"],
    ["Home Energy Audit in Africa — Why It Matters", "Audit énergétique du logement en Afrique — pourquoi il compte"],
    ["Appliance Power Usage in Africa — Know Your Consumers", "Consommation des appareils en Afrique — identifiez les postes majeurs"],
    ["Power Backup Duration in Africa — Planning Your Energy Independence", "Autonomie électrique en Afrique — planifier son indépendance énergétique"],
    ["Solar vs Diesel Irrigation in Africa — The Business Case", "Irrigation solaire ou diesel en Afrique — comparaison économique"],
    ["Solar Mini-Grid Feasibility in Africa — Key Considerations", "Faisabilité d’un mini-réseau solaire en Afrique — points essentiels"],
    ["What this home energy carbon estimate does — and does not do", "Ce que couvre — et ne couvre pas — cette estimation carbone"],
    ["How the EV and petrol cost comparison is reconciled", "Comment la comparaison entre véhicule électrique et essence est rapprochée"],
    ["Biogas Digesters in Africa — A Sustainable Energy Solution", "Digesteurs de biogaz en Afrique — une solution énergétique durable"],
    ["Cross-check the whole electricity picture", "Recouper l’ensemble de votre situation électrique"],
    ["Screening result vs evidence readiness", "Résultat de présélection et niveau de preuve"],
    ["Keep model output separate from field evidence", "Séparer le résultat du modèle des preuves de terrain"],
    ["Turn run hours into an operating-cost checkpoint", "Transformer les heures de fonctionnement en point de contrôle des coûts"],
    ["Use bundled default", "Utiliser la valeur intégrée"],
    ["Run hours per day", "Heures de fonctionnement par jour"],
    ["Which fuel price should I enter?", "Quel prix du carburant dois-je saisir ?"],
    ["How is generator fuel use estimated?", "Comment la consommation du générateur est-elle estimée ?"],
    ["What should I verify before running a generator?", "Que vérifier avant de faire fonctionner un générateur ?"],
    ["How do I calculate solar payback?", "Comment calculer le délai de retour solaire ?"],
    ["What size solar system do I need?", "De quelle taille de système solaire ai-je besoin ?"],
    ["Why is my payback different from installer quotes?", "Pourquoi mon délai de retour diffère-t-il des devis d’installateurs ?"],
    ["What assumptions can I edit?", "Quelles hypothèses puis-je modifier ?"],
    ["How accurate is this calculator?", "Quelle est la précision de ce calculateur ?"],
    ["How does the Solar Sizing Calculator estimate system size?", "Comment le calculateur estime-t-il la taille du système solaire ?"],
    ["What should I send installers for comparable solar quotes?", "Que transmettre aux installateurs pour obtenir des devis comparables ?"],
    ["Why does LiFePO4 need less nameplate capacity than lead-acid?", "Pourquoi le LiFePO₄ nécessite-t-il moins de capacité nominale que le plomb-acide ?"],
    ["Why is the inverter recommendation the same for both battery chemistries?", "Pourquoi la recommandation d’onduleur est-elle identique pour les deux chimies ?"],
    ["What is excluded from the battery chemistry comparison?", "Qu’est-ce qui est exclu de la comparaison des batteries ?"],
    ["How are the per-appliance monthly costs calculated?", "Comment les coûts mensuels par appareil sont-ils calculés ?"],
    ["Does the wattage field show actual appliance consumption?", "La puissance saisie représente-t-elle la consommation réelle ?"],
    ["How does the calculator treat standby power?", "Comment le calculateur traite-t-il la veille ?"],
    ["How is the load-shedding runtime ladder calculated?", "Comment l’échelle d’autonomie en délestage est-elle calculée ?"],
    ["What happens if I enter both kWh and Ah battery capacity?", "Que se passe-t-il si je saisis la capacité en kWh et en Ah ?"],
    ["Why can real backup runtime be shorter than the estimate?", "Pourquoi l’autonomie réelle peut-elle être inférieure à l’estimation ?"],
    ["How does farm-size pump estimation work?", "Comment fonctionne l’estimation de pompe selon la surface ?"],
    ["What happens when I select a known pump size?", "Que se passe-t-il si je sélectionne une puissance de pompe connue ?"],
    ["What should a solar-pump supplier verify?", "Que doit vérifier un fournisseur de pompe solaire ?"],
    ["What does the mini-grid screening result mean?", "Que signifie le résultat de présélection du mini-réseau ?"],
    ["Which tariff and operating-cost assumptions drive payback?", "Quelles hypothèses de tarif et de coûts déterminent le retour ?"],
    ["Which evidence should be checked before pre-feasibility?", "Quelles preuves vérifier avant la préfaisabilité ?"],
    ["Are the electricity emissions country-specific?", "Les émissions électriques sont-elles propres au pays ?"],
    ["How should I choose a reduction target?", "Comment choisir un objectif de réduction ?"],
    ["Can I use this result as a formal emissions inventory?", "Puis-je utiliser ce résultat comme inventaire officiel des émissions ?"],
    ["Estimate charging cost, then confirm your tariff", "Estimer le coût de recharge, puis confirmer votre tarif"],
    ["Estimate gas output, then verify installer assumptions", "Estimer la production de gaz, puis vérifier les hypothèses de l’installateur"],
    ["Use the class printed on your bill where available.", "Utilisez la classe indiquée sur votre facture lorsqu’elle est disponible."],
    ["Current reading minus previous reading.", "Relevé actuel moins relevé précédent."],
    ["VAT or electricity tax (%)", "TVA ou taxe sur l’électricité (%)"],
    ["Edit if your bill exempts or changes this charge.", "Modifiez si votre facture exonère ou change cette taxe."],
    ["Used only to compare your bill with the estimate.", "Utilisé uniquement pour comparer votre facture à l’estimation."],
    ["Use the class shown on the receipt or account.", "Utilisez la classe indiquée sur le reçu ou le compte."],
    ["Typical daily use (kWh)", "Consommation quotidienne habituelle (kWh)"],
    ["Used only to estimate how many days the units may last.", "Utilisé uniquement pour estimer la durée des unités."],
    ["Units on receipt (optional)", "Unités indiquées sur le reçu (facultatif)"],
    ["Enter the delivered kWh, not the token number.", "Saisissez les kWh délivrés, jamais le numéro du jeton."],
    ["Turn on if taps run overnight, the meter moves while closed, a toilet cistern leaks, or usage jumped suddenly.", "Activez si un robinet coule la nuit, si le compteur avance tout fermé, si une chasse fuit ou si la consommation a brusquement augmenté."],
    ["Seasonal load survey", "Étude saisonnière de la charge"],
    ["Measured household and productive-use demand across representative days and seasons.", "Demande des ménages et des usages productifs mesurée sur des jours et saisons représentatifs."],
    ["Willingness and ability to pay", "Volonté et capacité de paiement"],
    ["Customer evidence tested against the model's fixed USD 0.40/kWh sales tariff.", "Preuves clients testées par rapport au tarif de vente fixe du modèle, 0,40 USD/kWh."],
    ["I checked the installed cost, LPG price, bioslurry value, and operating cost against current quotes, receipts, or farm records. This confirms my inputs, not AfroTools or installer approval.", "J’ai comparé le coût installé, le prix du GPL, la valeur du digestat et les coûts d’exploitation à des devis, reçus ou registres actuels. Cela confirme mes données, pas une approbation d’AfroTools ou de l’installateur."],
    ["Calculate System Size", "Calculer le dimensionnement"],
    ["Calculate Solar ROI", "Calculer la rentabilité solaire"],
    ["Calculate Generator Cost", "Calculer le coût du générateur"],
    ["Calculate Electricity Bill", "Calculer la facture d’électricité"],
    ["Calculate Water Bill", "Calculer la facture d’eau"],
    ["Calculate LPG Cost", "Calculer le coût du GPL"],
    ["Calculate PayGo Cost", "Calculer le coût PayGo"],
    ["Calculate Outage Cost", "Calculer le coût des coupures"],
    ["Calculate Carbon Footprint", "Calculer l’empreinte carbone"],
    ["Calculate Charging Cost", "Calculer le coût de recharge"],
    ["Calculate Biogas ROI", "Calculer la rentabilité du biogaz"],
    ["Calculate Fuel Cost", "Calculer le coût du carburant"],
    ["Calculated installer brief", "Brief calculé pour l’installateur"],
    ["Copy installer brief", "Copier le brief installateur"],
    ["Copy result", "Copier le résultat"],
    ["Export CSV", "Exporter en CSV"],
    ["Download PDF", "Télécharger le PDF"],
    ["Print result", "Imprimer le résultat"],
    ["Reset defaults", "Rétablir les valeurs"],
    ["Reset calculator", "Réinitialiser le calculateur"],
    ["Add appliance", "Ajouter un appareil"],
    ["Remove appliance", "Supprimer l’appareil"],
    ["Monthly electricity bill", "Facture mensuelle d’électricité"],
    ["Monthly generator fuel spend", "Dépense mensuelle de carburant du générateur"],
    ["Electricity tariff", "Tarif d’électricité"],
    ["Fixed monthly charge", "Frais fixes mensuels"],
    ["Service charge", "Frais de service"],
    ["Consumption (kWh)", "Consommation (kWh)"],
    ["Token amount", "Montant de la recharge"],
    ["Units received", "Unités reçues"],
    ["Daily usage", "Consommation quotidienne"],
    ["Days of supply", "Jours d’autonomie"],
    ["Previous meter reading", "Ancien relevé du compteur"],
    ["Current meter reading", "Nouveau relevé du compteur"],
    ["Expected bill", "Facture attendue"],
    ["Actual bill", "Facture reçue"],
    ["Bill variance", "Écart de facture"],
    ["Cylinder size", "Taille de la bouteille"],
    ["Refill price", "Prix de la recharge"],
    ["Monthly usage", "Consommation mensuelle"],
    ["Daily outage hours", "Heures de coupure par jour"],
    ["Critical load", "Charge prioritaire"],
    ["Generator size", "Puissance du générateur"],
    ["Fuel type", "Type de carburant"],
    ["Fuel price per litre", "Prix du carburant par litre"],
    ["Fuel use per hour", "Consommation par heure"],
    ["Generator maintenance", "Entretien du générateur"],
    ["Solar kit cost", "Coût du kit solaire"],
    ["Solar deposit", "Acompte solaire"],
    ["Payment term", "Durée de paiement"],
    ["Battery size", "Capacité de la batterie"],
    ["Battery capacity", "Capacité de la batterie"],
    ["Battery voltage", "Tension de la batterie"],
    ["Depth of discharge", "Profondeur de décharge"],
    ["Inverter efficiency", "Rendement de l’onduleur"],
    ["Inverter size", "Puissance de l’onduleur"],
    ["Backup duration", "Autonomie de secours"],
    ["Panel wattage", "Puissance des panneaux"],
    ["Peak sun hours", "Heures de soleil utiles"],
    ["Daily energy", "Énergie quotidienne"],
    ["Monthly energy", "Énergie mensuelle"],
    ["Annual savings", "Économies annuelles"],
    ["Payback period", "Délai de retour"],
    ["Five-year savings", "Économies sur cinq ans"],
    ["Total ownership cost", "Coût total de possession"],
    ["Revenue lost", "Chiffre d’affaires perdu"],
    ["Staff downtime", "Temps de travail perdu"],
    ["Spoilage and damage", "Pertes de stock et dommages"],
    ["Backup power cost", "Coût de l’énergie de secours"],
    ["Community connections", "Raccordements de la communauté"],
    ["Average monthly demand", "Demande mensuelle moyenne"],
    ["Break-even tariff", "Tarif d’équilibre"],
    ["Project cost", "Coût du projet"],
    ["Annual operating cost", "Coût d’exploitation annuel"],
    ["Grid electricity", "Électricité du réseau"],
    ["Diesel generator", "Générateur diesel"],
    ["Petrol generator", "Générateur essence"],
    ["Carbon emissions", "Émissions de carbone"],
    ["Emission factor", "Facteur d’émission"],
    ["Charging sessions", "Sessions de recharge"],
    ["Vehicle efficiency", "Rendement du véhicule"],
    ["Distance per month", "Distance mensuelle"],
    ["Petrol comparison", "Comparaison avec l’essence"],
    ["Daily feedstock", "Matière organique quotidienne"],
    ["Biogas yield", "Rendement du biogaz"],
    ["Digester cost", "Coût du digesteur"],
    ["Cooking fuel savings", "Économies de combustible de cuisson"],
    ["Country assumption", "Hypothèse pays"],
    ["Market profile", "Profil de marché"],
    ["Custom scenario", "Scénario personnalisé"],
    ["Planning estimate", "Estimation de planification"],
    ["Source and freshness", "Source et fraîcheur"],
    ["Sources and methodology", "Sources et méthodologie"],
    ["How it works", "Fonctionnement"],
    ["What to verify", "Points à vérifier"],
    ["Recommended next steps", "Prochaines étapes recommandées"],
    ["Related tools", "Outils associés"],
    ["Frequently Asked Questions", "Questions fréquentes"],
    ["All African countries", "Tous les pays africains"],
    ["Select country", "Sélectionner un pays"],
    ["Select a country", "Sélectionner un pays"],
    ["Select fuel type", "Sélectionner le carburant"],
    ["Enter a valid amount", "Saisissez un montant valide"],
    ["Please enter valid inputs", "Saisissez des valeurs valides"],
    ["No payback within 10 years", "Aucun retour en moins de 10 ans"],
    ["Result copied to clipboard.", "Résultat copié dans le presse-papiers."],
    ["Copy was blocked by the browser.", "La copie a été bloquée par le navigateur."],
    ["CSV export created.", "Export CSV créé."],
    ["Instant Results", "Résultats immédiats"],
    ["Free to use", "Utilisation gratuite"],
    ["No sign-up required", "Aucune inscription requise"],
  ];

  var words = [
    ["Calculate", "Calculer"], ["Calculator", "Calculateur"], ["Estimate", "Estimer"],
    ["Results", "Résultats"], ["Result", "Résultat"], ["Recommendation", "Recommandation"],
    ["Country", "Pays"], ["Currency", "Devise"], ["Amount", "Montant"],
    ["Monthly", "Mensuel"], ["Annual", "Annuel"], ["Daily", "Quotidien"],
    ["Yearly", "Annuel"], ["Years", "Ans"], ["Year", "An"], ["Months", "Mois"],
    ["Hours", "Heures"], ["Hour", "Heure"], ["Days", "Jours"], ["Day", "Jour"],
    ["Cost", "Coût"], ["Costs", "Coûts"], ["Price", "Prix"], ["Savings", "Économies"],
    ["Revenue", "Revenus"], ["Expenses", "Dépenses"], ["Maintenance", "Entretien"],
    ["Electricity", "Électricité"], ["Solar", "Solaire"], ["Generator", "Générateur"],
    ["Battery", "Batterie"], ["Inverter", "Onduleur"], ["Power", "Puissance"],
    ["Energy", "Énergie"], ["Water", "Eau"], ["Fuel", "Carburant"],
    ["Diesel", "Diesel"], ["Petrol", "Essence"], ["Gas", "Gaz"], ["Load", "Charge"],
    ["Consumption", "Consommation"], ["Efficiency", "Rendement"], ["Capacity", "Capacité"],
    ["Total", "Total"], ["Average", "Moyenne"], ["Fixed", "Fixe"], ["Variable", "Variable"],
    ["Compare", "Comparer"], ["Comparison", "Comparaison"], ["Verify", "Vérifier"],
    ["Copy", "Copier"], ["Copied", "Copié"], ["Download", "Télécharger"],
    ["Export", "Exporter"], ["Print", "Imprimer"], ["Reset", "Réinitialiser"],
    ["Add", "Ajouter"], ["Remove", "Supprimer"], ["Select", "Sélectionner"],
    ["Home", "Accueil"], ["Tools", "Outils"], ["Business", "Entreprise"],
    ["Residential", "Résidentiel"], ["Commercial", "Commercial"], ["Industrial", "Industriel"],
    ["Input", "Entrée"], ["Output", "Sortie"], ["Assumption", "Hypothèse"],
    ["Source", "Source"], ["Updated", "Mis à jour"], ["Reviewed", "Révisé"],
    ["Fresh", "À jour"], ["Stale", "Périmé"], ["Unavailable", "Indisponible"],
    ["Warning", "Avertissement"], ["Required", "Obligatoire"], ["Optional", "Facultatif"],
    ["Yes", "Oui"], ["No", "Non"], ["Other", "Autre"], ["Custom", "Personnalisé"],
  ];

  exact.sort(function (a, b) { return b[0].length - a[0].length; });
  words.sort(function (a, b) { return b[0].length - a[0].length; });

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function translate(value) {
    if (!value || !/[A-Za-z]/.test(value)) return value;
    var next = value;
    exact.forEach(function (pair) {
      next = next.replace(new RegExp(escapeRegExp(pair[0]), "gi"), pair[1]);
    });
    words.forEach(function (pair) {
      next = next.replace(new RegExp("\\b" + escapeRegExp(pair[0]) + "\\b", "gi"), pair[1]);
    });
    return next;
  }

  function localize(scope) {
    if (!scope) return;
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent && /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    scope.querySelectorAll("[placeholder],[aria-label],[title],input[value],button[value]").forEach(function (element) {
      ["placeholder", "aria-label", "title", "value"].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        var current = element.getAttribute(attribute);
        var next = translate(current);
        if (next !== current) element.setAttribute(attribute, next);
      });
    });
  }

  function parseDate(value) {
    var date = new Date(String(value || "") + "T00:00:00Z");
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function sourceState(reviewedAt) {
    var reviewed = parseDate(reviewedAt);
    if (!reviewed) return { id: "unavailable", label: "Référence indisponible" };
    var age = Math.floor((Date.now() - reviewed.getTime()) / 86400000);
    if (age < 0) return { id: "unavailable", label: "Date de référence incohérente" };
    if (age > 30) return { id: "stale", label: "Références archivées — valeurs à confirmer" };
    return { id: "fresh", label: "Références révisées récemment" };
  }

  function captureInputs() {
    var values = {};
    document.querySelectorAll("main input, main select, main textarea, .tool-main input, .tool-main select, .tool-main textarea").forEach(function (field, index) {
      if (field.type === "file" || field.type === "password" || field.disabled) return;
      var key = field.name || field.id || "champ-" + (index + 1);
      if (field.type === "checkbox" || field.type === "radio") values[key] = Boolean(field.checked);
      else values[key] = field.value;
    });
    return values;
  }

  function applyInputs(values) {
    Object.keys(values || {}).forEach(function (key) {
      var field = document.querySelector('[name="' + CSS.escape(key) + '"],#' + CSS.escape(key));
      if (!field || field.type === "file" || field.type === "password") return;
      if (field.type === "checkbox" || field.type === "radio") field.checked = Boolean(values[key]);
      else field.value = values[key];
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function downloadJson(payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "afrotools-" + config.id + "-fr.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function buildPanels() {
    var state = sourceState(config && config.reviewedAt);
    var firstMain = document.querySelector("main, .tool-main, [role='main']");
    var trust = document.createElement("section");
    trust.className = "fr-energy-trust";
    trust.dataset.state = state.id;
    trust.dataset.frEnergyDataState = state.id;
    trust.setAttribute("aria-labelledby", "fr-energy-trust-title");
    trust.innerHTML =
      '<h2 id="fr-energy-trust-title">Source, fraîcheur et niveau de confiance</h2>' +
      "<p><strong>" + state.label + ".</strong> Les valeurs intégrées datent du " +
      (config && config.reviewedAt || "non renseigné") +
      ". Elles restent des hypothèses de planification et non des tarifs en direct.</p>" +
      "<p>Confirmez le tarif, le prix du carburant, les taxes, le devis installateur et les caractéristiques techniques auprès du fournisseur, du régulateur ou d’un professionnel qualifié avant toute dépense.</p>" +
      '<div class="fr-energy-meta"><span>' + (config && config.sourceLabel || "Source indisponible") +
      "</span><span>" + (config && config.confidence || "Confiance non renseignée") +
      '</span><span>Aucun appel réseau ajouté</span><span>Données saisies conservées localement</span></div>';
    if (firstMain && firstMain.parentNode) firstMain.parentNode.insertBefore(trust, firstMain);
    else document.body.insertBefore(trust, document.body.firstChild);

    var exportPanel = document.createElement("section");
    exportPanel.className = "fr-energy-export";
    exportPanel.setAttribute("aria-labelledby", "fr-energy-export-title");
    exportPanel.innerHTML =
      '<h2 id="fr-energy-export-title">Exporter ou rouvrir ce scénario</h2>' +
      "<p>L’export JSON contient uniquement les champs du calculateur. Il reste sur votre appareil et peut être rouvert ici. Utilisez Imprimer pour enregistrer un PDF lorsque le navigateur le propose.</p>" +
      '<div class="fr-energy-actions"><button type="button" data-fr-energy-export>Exporter JSON</button>' +
      '<label class="secondary">Rouvrir JSON <input class="fr-energy-import" type="file" accept="application/json,.json" data-fr-energy-import></label>' +
      '<button class="secondary" type="button" data-fr-energy-print>Imprimer / PDF</button>' +
      '<span class="fr-energy-status" aria-live="polite" data-fr-energy-export-status></span></div>';

    var aiPanel = document.createElement("section");
    aiPanel.className = "fr-energy-ai";
    aiPanel.setAttribute("aria-labelledby", "fr-energy-ai-title");
    aiPanel.innerHTML =
      '<h2 id="fr-energy-ai-title">Aide AfroTools AI, facultative</h2>' +
      "<p>Le calcul local fonctionne sans IA. Si vous ouvrez l’assistant, seul l’identifiant de cet outil est ajouté au lien; vos montants et votre scénario ne sont pas envoyés automatiquement.</p>" +
      '<label><input type="checkbox" data-fr-energy-ai-consent> Je consens à ouvrir l’assistant pour cette action. Je choisirai moi-même les informations à partager.</label>' +
      '<div class="fr-energy-actions"><a class="fr-energy-link secondary" aria-disabled="true" data-fr-energy-ai-link href="/fr/ai/">Ouvrir l’assistant</a>' +
      '<span class="fr-energy-status" aria-live="polite" data-fr-energy-ai-status>Alternative locale active.</span></div>';

    var footer = document.querySelector("afro-footer, footer");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(exportPanel, footer);
      footer.parentNode.insertBefore(aiPanel, footer);
    } else {
      document.body.appendChild(exportPanel);
      document.body.appendChild(aiPanel);
    }

    var status = exportPanel.querySelector("[data-fr-energy-export-status]");
    exportPanel.querySelector("[data-fr-energy-export]").addEventListener("click", function () {
      downloadJson({
        schema: "afrotools.fr-energy-scenario.v1",
        toolId: config.id,
        route: config.frRoute,
        title: config.title,
        inputs: captureInputs(),
      });
      status.textContent = "Scénario JSON téléchargé.";
    });
    exportPanel.querySelector("[data-fr-energy-import]").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var payload = JSON.parse(reader.result);
          if (payload.schema !== "afrotools.fr-energy-scenario.v1" || payload.toolId !== config.id) {
            throw new Error("mismatch");
          }
          applyInputs(payload.inputs);
          status.textContent = "Scénario rouvert sur cet appareil.";
        } catch (error) {
          status.textContent = "Fichier incompatible ou illisible. Aucun champ n’a été modifié.";
        }
      };
      reader.onerror = function () { status.textContent = "Lecture locale impossible."; };
      reader.readAsText(file);
    });
    exportPanel.querySelector("[data-fr-energy-print]").addEventListener("click", function () {
      window.print();
    });

    var consent = aiPanel.querySelector("[data-fr-energy-ai-consent]");
    var aiLink = aiPanel.querySelector("[data-fr-energy-ai-link]");
    var aiStatus = aiPanel.querySelector("[data-fr-energy-ai-status]");
    aiLink.href = "/fr/ai/?tool=" + encodeURIComponent(config.id);
    aiLink.addEventListener("click", function (event) {
      if (!consent.checked) {
        event.preventDefault();
        aiStatus.textContent = "Consentement requis; le calcul local reste disponible.";
      }
    });
    consent.addEventListener("change", function () {
      aiLink.setAttribute("aria-disabled", consent.checked ? "false" : "true");
      aiStatus.textContent = consent.checked ? "Consentement accordé pour cette ouverture uniquement." : "Alternative locale active.";
    });
  }

  function rewriteFrenchLinks() {
    if (!config || !config.routeMap) return;
    document.querySelectorAll("a[href]").forEach(function (link) {
      var pathname;
      try { pathname = new URL(link.href, location.href).pathname; } catch (error) { return; }
      var normalized = pathname.replace(/\/$/, "") + "/";
      if (config.routeMap[normalized]) link.setAttribute("href", config.routeMap[normalized]);
    });
  }

  document.documentElement.lang = "fr";
  if (!config) {
    config = {
      id: "indisponible",
      title: "Outil énergie",
      frRoute: location.pathname,
      reviewedAt: "",
      sourceLabel: "Configuration indisponible",
      confidence: "Indisponible",
      routeMap: {},
    };
  }
  buildPanels();
  rewriteFrenchLinks();
  localize(document.body);

  var scheduled = false;
  new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame(function () {
      scheduled = false;
      localize(document.body);
      rewriteFrenchLinks();
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
})(window);
