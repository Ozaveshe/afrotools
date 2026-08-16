#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const inventory = require("../reports/swahili-free-app-parity-inventory.json");
const assignedManifest = require("../data/localization/sw-education-parity.json");

const root = path.resolve(__dirname, "..");
const assignedIds = new Set(assignedManifest.routes.map((route) => route.id));
const rows = inventory.rows.filter(
  (row) => row.categoryKey === "education" && assignedIds.has(row.englishId)
);
const acceptanceState = "candidate-proof-pending";
const refreshTranslations = process.argv.includes("--refresh-translations");
const translationCachePath = path.join(root, "data", "i18n", "sw-education-parity-translations.json");
const missingRouteOwners = Object.freeze({
  "word-counter": "/sw/zana/kihesabu-maneno",
  "statistics-calc": "/sw/zana/kikokotoo-takwimu",
  "fraction-calc": "/sw/zana/kikokotoo-sehemu",
  "roman-numerals": "/sw/zana/nambari-za-kirumi",
  "percentage-calc": "/sw/zana/kikokotoo-asilimia",
  "scientific-calc": "/sw/zana/kikokotoo-kisayansi",
  "study-abroad-cost": "/sw/zana/gharama-za-kusoma-nje",
  "plagiarism-pct": "/sw/zana/asilimia-ya-ufanano",
  "tutoring-rate": "/sw/zana/bei-ya-mafunzo-binafsi"
});
const number = (name, label, value, min = 0, max = 1000000000, step = "any") => ({ name, label, type: "number", value, min, max, step });
const text = (name, label, value = "") => ({ name, label, type: "text", value });
const area = (name, label, value = "") => ({ name, label, type: "textarea", value });
const date = (name, label, value) => ({ name, label, type: "date", value });
const select = (name, label, value, options) => ({ name, label, type: "select", value, options });
const grades = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"].map((value) => [value, value]);
const kcseGrades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"].map((value) => [value, value]);

const definitions = {
  "matric-points": {
    title: "Planificateur NSC et points Matric", description: "Reproduisez les niveaux NSC et le meilleur total de six matières; chaque université conserve sa propre méthode APS.",
    script: "/tools/matric-points/matric-points-engine.js", global: "MatricPointsEngine", recipe: "matric",
    fields: [number("home", "Langue principale (%)", 72, 0, 100), number("learning", "Langue d’enseignement (%)", 68, 0, 100), number("mathematics", "Mathématiques (%)", 65, 0, 100), number("science", "Sciences physiques (%)", 58, 0, 100), number("lifeScience", "Sciences de la vie (%)", 64, 0, 100), number("accounting", "Comptabilité (%)", 55, 0, 100), number("orientation", "Life Orientation (%)", 78, 0, 100)],
    metrics: [["planningIndex", "Indice de planification"], ["route", "Niveau général NSC"], ["countedCount", "Matières comptées"]]
  },
  "exam-countdown": {
    title: "Compte à rebours d’examen", description: "Calculez les jours calendaires jusqu’à une date officielle saisie et obtenez une phase de préparation, sans prédire de résultat.",
    script: "/tools/exam-countdown/exam-countdown-engine.js", global: "AfroTools.ExamCountdownEngine", recipe: "exam-countdown",
    fields: [text("name", "Épreuve ou échéance", "Biologie — épreuve 1"), date("examDate", "Date officielle", "2026-08-20"), select("meaning", "Nature de la date", "exam", [["exam", "Épreuve"], ["registration", "Date limite d’inscription"], ["results", "Publication des résultats"]])],
    metrics: [["days", "Jours calendaires"], ["phase", "Phase de préparation"], ["kind", "État de la date"]]
  },
  "flashcard-maker": {
    title: "Créateur de fiches privé", description: "Transformez localement des lignes question-réponse en fiches de révision et exportez le paquet sans envoyer votre contenu.",
    script: "/tools/flashcard-maker/flashcard-engine.js", global: "AfroFlashcardEngine", recipe: "flashcards",
    fields: [area("deck", "Une fiche par ligne: question, réponse", "Force,Masse × accélération\nCapitale du Sénégal,Dakar\nSymbole de l’or,Au")],
    metrics: [["cardCount", "Fiches valides"], ["reviewCount", "Fiches dans la file"], ["firstPrompt", "Première question"]]
  },
  "citation-generator": {
    title: "Générateur de citations", description: "Formatez une référence APA, MLA, Chicago ou Harvard à partir des métadonnées saisies; vérifiez les règles de votre établissement.",
    script: "/tools/citation-generator/citation-engine.js", global: "AfroTools.citationEngine", recipe: "citation",
    fields: [select("style", "Style", "apa", [["apa", "APA"], ["mla", "MLA"], ["chicago", "Chicago"], ["harvard", "Harvard"]]), select("sourceType", "Type de source", "book", [["book", "Livre"], ["journal", "Article"], ["website", "Site web"]]), text("authors", "Auteurs", "Okafor, Ada"), text("title", "Titre", "Recherche au-delà des frontières"), number("year", "Année", 2024, 1, 9999, 1), text("publisher", "Éditeur", "Coast Press"), text("url", "URL (facultative)", "https://example.org/source")],
    metrics: [["reference", "Référence"], ["inText", "Citation dans le texte"], ["note", "Note de style"]]
  },
  "periodic-table": {
    title: "Tableau périodique interactif", description: "Recherchez un élément par symbole ou numéro atomique dans le jeu de 118 éléments utilisé par l’application anglaise.",
    script: "/tools/periodic-table/periodic-table-engine.js", global: "AfroTools.periodicTableEngine", recipe: "periodic", prelude: "periodic-elements",
    fields: [text("query", "Symbole ou numéro atomique", "Fe")],
    metrics: [["count", "Correspondances"], ["symbol", "Symbole"], ["atomicNumber", "Numéro atomique"], ["atomicWeight", "Masse atomique"], ["group", "Groupe"]]
  },
  "algebra-solver": {
    title: "Solveur d’algèbre", description: "Résolvez localement une équation linéaire, quadratique ou une inégalité et vérifiez la forme saisie.",
    script: "/tools/algebra-solver/algebra-engine.js", global: "AfroAlgebraEngine", recipe: "algebra",
    fields: [select("mode", "Type", "linear", [["linear", "Équation linéaire"], ["quadratic", "Équation quadratique"], ["inequality", "Inégalité"]]), text("expression", "Expression", "2x + 5 = 13")],
    metrics: [["type", "Type de solution"], ["x", "Valeur de x"], ["expression", "Équation vérifiée"]]
  },
  "binary-converter": {
    title: "Convertisseur de bases exact", description: "Convertissez des nombres entre bases 2, 8, 10 et 16 avec l’arithmétique exacte du propriétaire anglais.",
    script: "/tools/binary-converter/binary-converter-engine.js", global: "AfroTools.binaryConverter", recipe: "binary",
    fields: [text("value", "Valeur", "1010"), select("fromBase", "Base d’entrée", "2", [["2", "Binaire (2)"], ["8", "Octal (8)"], ["10", "Décimal (10)"], ["16", "Hexadécimal (16)"]])],
    metrics: [["decimal", "Décimal"], ["binary", "Binaire"], ["hex", "Hexadécimal"]]
  },
  "statistics-calc": {
    title: "Calculateur de statistiques descriptives", description: "Analysez localement une série numérique: moyenne, médiane, étendue et dispersion, sans transmission réseau.",
    script: "/tools/statistics-calc/statistics-engine.js", global: "AfroTools.statisticsEngine", recipe: "statistics",
    fields: [area("values", "Valeurs séparées par virgule, espace ou ligne", "1, 2, 2, 4, 8")],
    metrics: [["count", "Nombre de valeurs"], ["mean", "Moyenne"], ["median", "Médiane"], ["range", "Étendue"], ["sampleSd", "Écart-type échantillon"]]
  },
  "fraction-calc": {
    title: "Calculateur de fractions exactes", description: "Additionnez, soustrayez, multipliez ou divisez deux fractions avec des entiers exacts et une forme simplifiée.",
    script: "/tools/fraction-calc/fraction-engine.js", global: "AfroTools.fractionEngine", recipe: "fraction",
    fields: [number("leftNumerator", "Numérateur 1", 1, -1000000000), number("leftDenominator", "Dénominateur 1", 2, 1), select("operation", "Opération", "add", [["add", "Addition"], ["subtract", "Soustraction"], ["multiply", "Multiplication"], ["divide", "Division"]]), number("rightNumerator", "Numérateur 2", 1, -1000000000), number("rightDenominator", "Dénominateur 2", 3, 1)],
    metrics: [["raw.text", "Résultat brut"], ["simplified.text", "Fraction simplifiée"], ["decimal.text", "Décimal"], ["percentage.text", "Pourcentage"]]
  },
  "roman-numerals": {
    title: "Convertisseur de chiffres romains", description: "Convertissez exactement un entier de 1 à 3999 ou un chiffre romain canonique.",
    script: "/tools/roman-numerals/roman-numerals-engine.js", global: "AfroTools.romanNumerals", recipe: "roman",
    fields: [text("value", "Entier ou chiffre romain", "944")],
    metrics: [["inputType", "Type d’entrée"], ["output", "Conversion"], ["explanation", "Décomposition"]]
  },
  "scientific-calc": {
    title: "Calculatrice scientifique", description: "Évaluez localement une expression scientifique déterministe; les domaines non réels ou non finis sont refusés.",
    script: "/tools/scientific-calc/scientific-engine.js", global: "AfroTools.scientificEngine", recipe: "scientific",
    fields: [text("expression", "Expression", "sin(30) + sqrt(16)"), select("angleMode", "Mode angulaire", "DEG", [["DEG", "Degrés"], ["RAD", "Radians"]])],
    metrics: [["formatted", "Résultat"], ["value", "Valeur numérique"], ["angleMode", "Mode angulaire"]]
  },
  "school-fees": {
    title: "Comparateur de frais scolaires", description: "Calculez une réserve annuelle à partir de montants publiés ou saisis; confirmez le barème et la période auprès de l’école.",
    script: "/tools/school-fees/school-fees-engine.js", global: "AfroTools.schoolFeesEngine", recipe: "school-fees",
    fields: [text("school", "École", "École exemple"), text("currency", "Devise ISO", "XOF"), number("tuition", "Scolarité annuelle", 1200000, 1), number("extras", "Autres frais annuels", 240000, 0), number("monthlySupport", "Budget mensuel disponible", 200000, 0), number("rhythm", "Paiements par an", 3, 1, 12, 1)],
    metrics: [["annual", "Total annuel"], ["monthlyReserve", "Réserve mensuelle"], ["paymentChunk", "Échéance"], ["band", "Pression sur le budget"]]
  },
  "study-planner": {
    title: "Planificateur d’études", description: "Répartissez vos séances hebdomadaires entre matières à partir du temps réellement disponible.",
    script: "/tools/study-planner/study-planner-engine.js", global: "AfroTools.studyPlannerEngine", recipe: "study-planner",
    fields: [number("subjectCount", "Nombre de matières", 3, 1, 20, 1), number("hoursPerDay", "Heures par jour", 2, 0.25, 16), number("daysPerWeek", "Jours par semaine", 5, 1, 7, 1), number("sessionLength", "Durée d’une séance (h)", 1, 0.25, 4), text("startTime", "Heure de début", "08:00")],
    metrics: [["totalSessions", "Séances hebdomadaires"], ["scheduledHours", "Heures planifiées"], ["unusedMinutesPerDay", "Minutes libres par jour"], ["allocation", "Répartition"]]
  },
  "ielts-calculator": {
    title: "Calculateur IELTS", description: "Reproduisez la moyenne et l’arrondi IELTS à partir de quatre notes saisies; ce résultat ne décide ni visa, ni admission, ni bourse.",
    script: "/tools/ielts-calculator/ielts-vip-engine.js", global: "IELTSVipEngine", recipe: "ielts",
    fields: [number("listening", "Listening", 6.5, 0, 9, 0.5), number("reading", "Reading", 6.5, 0, 9, 0.5), number("writing", "Writing", 5.5, 0, 9, 0.5), number("speaking", "Speaking", 6, 0, 9, 0.5), number("target", "Objectif", 6.5, 0, 9, 0.5)],
    metrics: [["overall", "Score global"], ["targetStatus", "Position par rapport à l’objectif"], ["average", "Moyenne brute"]]
  },
  "teacher-salary": {
    title: "Feuille de rémunération enseignante", description: "Comparez salaire, allocations, retenues et heures à partir de votre offre ou fiche de paie; aucun barème national n’est inventé.",
    script: "/tools/teacher-salary/teacher-salary-engine.js", global: "AfroTools.teacherSalaryEngine", recipe: "teacher-salary",
    fields: [number("baseMonthly", "Salaire mensuel de base", 500000, 1), number("allowancesMonthly", "Allocations mensuelles", 50000, 0), number("deductionsMonthly", "Retenues mensuelles", 60000, 0), number("weeklyHours", "Heures/semaine", 40, 1, 100), number("workingWeeks", "Semaines travaillées/an", 44, 1, 52)],
    metrics: [["grossCashMonthly", "Brut récurrent mensuel"], ["estimatedTakeHomeMonthly", "Net mensuel saisi"], ["annualCash", "Brut annuel"], ["grossHourly", "Brut horaire"]]
  },
  "waec-calculator": {
    title: "Planificateur de résultats WAEC / NECO", description: "Vérifiez localement les crédits saisis et reproduisez l’arithmétique d’un scénario WAEC, NECO ou WASSCE sans prédire une admission.",
    script: "/tools/waec-calculator/waec-engine.js", global: "WAECPlannerEngine", recipe: "waec",
    fields: [select("english", "Anglais", "B3", grades), select("mathematics", "Mathématiques", "B2", grades), select("physics", "Physique", "C4", grades), select("chemistry", "Chimie", "C5", grades), select("biology", "Biologie", "C6", grades)],
    metrics: [["value", "Somme indicative"], ["credits", "Crédits enregistrés"], ["complete", "Dossier complet"]]
  },
  "jamb-aggregate": {
    title: "Feuille de calcul JAMB", description: "Reproduisez un scénario UTME et Post-UTME avec les pondérations publiées par l’établissement; ce résultat ne constitue pas un seuil officiel.",
    script: "/tools/jamb-aggregate/jamb-aggregate-engine.js", global: "JambAggregateEngine", recipe: "jamb",
    fields: [number("utme", "Score UTME (0–400)", 280, 0, 400), number("postUtme", "Score Post-UTME (0–100)", 65, 0, 100), number("utmeWeight", "Poids UTME (%)", 50, 0, 100), number("postUtmeWeight", "Poids Post-UTME (%)", 50, 0, 100), number("benchmark", "Repère publié (facultatif)", 65, 0, 100)],
    metrics: [["normalizedUtme", "UTME normalisé"], ["aggregate", "Agrégat reproduit"], ["difference", "Écart au repère"]]
  },
  "gpa-calculator": {
    title: "Calculateur GPA / CGPA", description: "Calculez une moyenne pondérée locale à partir de vos crédits et points; vérifiez toujours l’échelle de votre établissement.",
    script: "/tools/gpa-calculator/gpa-engine.js", global: "AfroGpaEngine", recipe: "gpa",
    fields: [select("scale", "Échelle", "5.0", [["5.0", "5,0"], ["4.0", "4,0"], ["20", "20"]]), number("credits1", "Crédits du cours 1", 3, 0.1, 100), number("points1", "Points du cours 1", 4, 0, 20), number("credits2", "Crédits du cours 2", 2, 0.1, 100), number("points2", "Points du cours 2", 3, 0, 20)],
    metrics: [["totalCredits", "Crédits totaux"], ["average", "Moyenne pondérée"], ["invalidCourses", "Cours invalides"]]
  },
  "word-counter": {
    title: "Compteur de mots et limite de devoir", description: "Analysez localement mots, caractères, paragraphes, durée de lecture et limite de devoir sans envoyer votre texte.",
    script: "/tools/word-counter/word-counter-engine.js", global: "AfroTools.wordCounter", recipe: "word",
    fields: [area("text", "Texte privé", "Cette introduction présente le sujet. Elle expose ensuite la méthode et les limites du devoir."), number("minimumWords", "Minimum de mots", 8, 1, 100000), number("maximumWords", "Maximum de mots", 120, 1, 100000), number("maximumCharacters", "Maximum de caractères", 1000, 1, 1000000)],
    metrics: [["words", "Mots"], ["characters", "Caractères"], ["sentences", "Phrases"], ["paragraphs", "Paragraphes"], ["limitState", "État de la limite"]]
  },
  "percentage-calc": {
    title: "Calculateur de pourcentage", description: "Calculez une part, un pourcentage ou une variation avec une formule déterministe exécutée dans ce navigateur.",
    script: "/tools/percentage-calc/percentage-engine.js", global: "AfroPercentageEngine", recipe: "percentage",
    fields: [select("mode", "Calcul", "percentOf", [["percentOf", "X % de Y"], ["percentageOf", "X représente quel % de Y"], ["change", "Variation de X à Y"]]), number("a", "Valeur X", 20, -1000000000, 1000000000), number("b", "Valeur Y", 500, -1000000000, 1000000000)],
    metrics: [["result", "Résultat"], ["modeSwahili", "Méthode"], ["firstValue", "Première valeur"], ["secondValue", "Deuxième valeur"]]
  },
  "ke-helb": {
    title: "Planificateur de remboursement HELB", description: "Modelez un solde de relevé HELB avec votre taux et votre paiement; aucun solde officiel n’est récupéré.",
    script: "/tools/ke-helb/helb-engine.js", global: "AfroTools.helbEngine", recipe: "helb",
    fields: [number("balance", "Solde du relevé (KES)", 100000, 1), number("annualRate", "Taux annuel saisi (%)", 4, 0, 50), number("monthlyPayment", "Paiement mensuel", 5000, 1), number("extraPayment", "Paiement supplémentaire", 500, 0)],
    metrics: [["months", "Mois estimés"], ["totalPaid", "Total payé"], ["totalInterest", "Intérêts modélisés"]]
  },
  "university-ranking": {
    title: "Comparateur d’universités", description: "Comparez deux programmes à partir de vos coûts, dates et liens officiels; ce classement personnel n’est pas un palmarès officiel.",
    script: "/tools/university-ranking/university-comparison-engine.js", global: "AfroTools.universityComparisonEngine", recipe: "university-ranking",
    fields: [text("aName", "Université / programme A", "Programme A"), number("aTuition", "Frais A", 5000, 0), text("aUrl", "Page officielle A", "https://example.edu/a"), text("bName", "Université / programme B", "Programme B"), number("bTuition", "Frais B", 7000, 0), text("bUrl", "Page officielle B", "https://example.edu/b")],
    metrics: [["comparableCostCount", "Coûts comparables"], ["firstName", "Premier dossier"], ["firstCost", "Coût du premier dossier"]]
  },
  "degree-checker": {
    title: "Planificateur de reconnaissance de diplôme", description: "Préparez la route de vérification de votre diplôme auprès du propriétaire officiel; aucune équivalence n’est déclarée ici.",
    script: "/tools/degree-checker/degree-route-engine.js", global: "AfroTools.degreeRouteEngine", recipe: "degree",
    fields: [select("destination", "Destination", "south-africa", [["south-africa", "Afrique du Sud"], ["uk", "Royaume-Uni"], ["canada", "Canada"]]), select("purpose", "Objet", "study", [["study", "Études"], ["work", "Emploi"], ["immigration", "Immigration"], ["licensed", "Profession réglementée"]]), text("qualification", "Diplôme détenu", "Licence"), select("institutionStatus", "Établissement confirmé", "unknown", [["unknown", "À confirmer"], ["confirmed", "Confirmé"]])],
    metrics: [["purpose", "Objet"], ["owner", "Propriétaire de la décision"], ["gapCount", "Vérifications restantes"]]
  },
  "study-abroad-cost": {
    title: "Budget d’études à l’étranger", description: "Construisez un budget pluriannuel avec vos frais, aides et fonds disponibles; les montants ne sont ni des devis ni des exigences de visa.",
    script: "/tools/study-abroad-cost/study-cost-engine.js", global: "AfroTools.studyCostEngine", recipe: "study-abroad",
    fields: [number("months", "Durée (mois)", 12, 1, 120, 1), number("tuitionAnnual", "Frais de scolarité annuels", 10000, 0), number("tuitionYears", "Années facturées", 1, 0, 10), number("accommodationMonthly", "Logement mensuel", 600, 0), number("livingMonthly", "Vie mensuelle", 400, 0), number("insuranceAnnual", "Assurance annuelle", 500, 0), number("governmentFees", "Frais publics saisis", 300, 0), number("setupCosts", "Installation", 1000, 0), number("confirmedAid", "Aide confirmée", 2000, 0), number("availableFunds", "Fonds disponibles", 5000, 0)],
    metrics: [["gross", "Coût brut"], ["net", "Coût après aide"], ["fundingGap", "Écart de financement"], ["upfrontCash", "Trésorerie initiale"]]
  },
  "student-loan-repay": {
    title: "Planificateur de remboursement de prêt étudiant", description: "Modelez localement un prêt à partir de votre principal, taux et durée; ce n’est pas un relevé de prêteur.",
    script: "/tools/student-loan-repay/student-loan-engine.js", global: "StudentLoanEngine", recipe: "student-loan",
    fields: [number("principal", "Principal", 100000, 1), number("annualRate", "Taux annuel (%)", 12, 0, 100), number("months", "Durée (mois)", 36, 1, 600, 1), number("extraPayment", "Supplément mensuel", 1000, 0)],
    metrics: [["scheduledPayment", "Mensualité prévue"], ["totalInterest", "Intérêts totaux"], ["monthsSaved", "Mois économisés"], ["interestSaved", "Intérêts économisés"]]
  },
  "nysc-allowance": {
    title: "Budget d’allocation NYSC", description: "Planifiez uniquement les montants et mois que vous saisissez; aucun montant NYSC actuel n’est supposé ou récupéré.",
    script: "/tools/nysc-allowance/nysc-budget-engine.js", global: "AfroTools.nyscBudgetEngine", recipe: "nysc",
    fields: [number("planMonths", "Mois du plan", 10, 1, 12, 1), number("federalMonthly", "Allocation fédérale saisie", 77000, 0), number("federalMonths", "Mois fédéraux", 10, 0, 12, 1), number("stateMonthly", "Allocation État saisie", 10000, 0), number("stateMonths", "Mois État", 6, 0, 12, 1), number("housingMonthly", "Logement mensuel", 20000, 0), number("foodMonthly", "Alimentation mensuelle", 25000, 0), number("transportMonthly", "Transport mensuel", 12000, 0), number("oneTimeCosts", "Coûts ponctuels", 40000, 0)],
    metrics: [["totalIncome", "Revenus saisis"], ["totalCosts", "Coûts du plan"], ["remainder", "Reste"], ["bufferMonths", "Mois de réserve"]]
  },
  "kcse-calculator": {
    title: "Feuille de calcul KCSE", description: "Reproduisez l’agrégat à partir des notes saisies; seul KUCCPS ou l’établissement décide de l’éligibilité et du placement.",
    script: "/tools/kcse-calculator/kcse-engine.js", global: "AfroTools.kcseEngine", recipe: "kcse",
    fields: [select("mathematics", "Mathématiques", "A", kcseGrades), select("english", "Anglais", "B+", kcseGrades), select("kiswahili", "Kiswahili", "B", kcseGrades), select("other1", "Sciences", "A-", kcseGrades), select("other2", "Humanités", "B+", kcseGrades), select("other3", "Option 1", "B", kcseGrades), select("other4", "Option 2", "C+", kcseGrades), select("other5", "Option 3", "C", kcseGrades)],
    metrics: [["aggregate", "Agrégat"], ["meanGrade", "Note moyenne"], ["countedCount", "Matières comptées"]]
  },
  "national-service-gh": {
    title: "Budget du service national au Ghana", description: "Réconciliez votre propre relevé d’allocation et vos dépenses; AfroTools ne fournit aucun montant officiel par défaut.",
    script: "/tools/national-service-gh/ghana-service-engine.js", global: "AfroTools.ghanaServiceEngine", recipe: "ghana-service",
    fields: [number("planMonths", "Mois du plan", 10, 1, 12, 1), number("allowanceMonthly", "Allocation mensuelle du relevé (GHS)", 715, 1), number("allowanceMonths", "Mois d’allocation", 10, 0, 12, 1), number("receivedToDate", "Reçu à ce jour", 3575, 0), number("dueMonths", "Mois à rapprocher", 6, 0, 12, 1), number("housingMonthly", "Logement mensuel", 300, 0), number("foodMonthly", "Alimentation mensuelle", 400, 0), number("transportMonthly", "Transport mensuel", 150, 0), number("oneTimeCosts", "Coûts ponctuels", 600, 0)],
    metrics: [["totalIncome", "Revenus du plan"], ["totalCosts", "Coûts du plan"], ["remainder", "Reste"], ["reconciliationDifference", "Écart de rapprochement"]]
  },
  "university-admission": {
    title: "Planificateur de route d’admission", description: "Préparez une liste de vérification par pays et programme; aucune admission, éligibilité ou place n’est prédite.",
    script: "/engines/education-route-engine.js", global: "EducationRouteEngine", recipe: "admission",
    fields: [select("country", "Pays", "nigeria", [["nigeria", "Nigeria"], ["kenya", "Kenya"], ["south-africa", "Afrique du Sud"], ["ghana", "Ghana"], ["zimbabwe", "Zimbabwe"]]), text("programme", "Programme visé", "Informatique"), text("institution", "Établissement visé", "Université exemple"), select("requirementsChecked", "Exigences officielles vérifiées", "no", [["no", "Pas encore"], ["yes", "Oui"]])],
    metrics: [["owner", "Propriétaire officiel"], ["stepCount", "Étapes"], ["gapCount", "Vérifications restantes"]]
  },
  "student-budget": {
    title: "Budget étudiant privé", description: "Comparez ressources et dépenses de votre période d’études; vos montants restent dans ce navigateur.",
    script: "/tools/student-budget/student-budget-engine.js", global: "AfroTools.studentBudgetEngine", recipe: "student-budget",
    fields: [number("periodMonths", "Durée de la période (mois)", 4, 0.5, 24), number("monthlyIncome", "Revenu mensuel", 500, 0), number("periodFunding", "Financement ponctuel", 2500, 0), number("housing", "Logement mensuel", 300, 0), number("food", "Alimentation mensuelle", 200, 0), number("transport", "Transport mensuel", 100, 0), number("fees", "Frais de période", 500, 0)],
    metrics: [["totalResources", "Ressources"], ["totalExpenses", "Dépenses"], ["balance", "Solde"], ["monthlyBalanceEquivalent", "Solde mensuel équivalent"]]
  },
  "coding-bootcamp": {
    title: "Comparateur de bootcamps", description: "Comparez deux offres à partir des frais, du temps et du revenu différé que vous saisissez; aucune embauche n’est garantie.",
    script: "/tools/coding-bootcamp/bootcamp-comparison-engine.js", global: "AfroTools.bootcampComparisonEngine", recipe: "bootcamp",
    fields: [number("aDuration", "Durée A (mois)", 6, 1, 36), number("aWeeklyHours", "Heures/semaine A", 20, 1, 100), number("aProviderCost", "Coût fournisseur A", 3000, 0), number("aFees", "Autres frais A", 300, 0), number("aForegone", "Revenu différé/mois A", 800, 0), number("bDuration", "Durée B (mois)", 4, 1, 36), number("bWeeklyHours", "Heures/semaine B", 15, 1, 100), number("bProviderCost", "Coût fournisseur B", 2000, 0), number("bFees", "Autres frais B", 320, 0), number("bForegone", "Revenu différé/mois B", 675, 0), number("incomeLift", "Gain mensuel hypothétique", 500, 0)],
    metrics: [["a.decisionCost", "Coût de décision A"], ["b.decisionCost", "Coût de décision B"], ["decisionCostDifference", "Écart de coût"], ["a.paybackMonths", "Retour hypothétique A (mois)"]]
  },
  "boarding-school": {
    title: "Planificateur du coût d’internat", description: "Projetez les coûts récurrents, de démarrage et de transport que vous saisissez; confirmez les frais auprès de l’école.",
    script: "/tools/boarding-school/boarding-school-engine.js", global: "BoardingSchoolEngine", recipe: "boarding",
    fields: [number("years", "Années restantes", 2, 1, 12, 1), number("terms", "Trimestres par an", 3, 1, 6, 1), number("months", "Mois de dépenses/an", 9, 0, 12, 1), number("trips", "Trajets/an", 6, 0, 24, 1), number("tuitionTerm", "Scolarité/trimestre", 1000, 0), number("boardingTerm", "Internat/trimestre", 500, 0), number("monthly", "Dépenses mensuelles", 100, 0), number("startup", "Démarrage", 300, 0), number("inflation", "Inflation hypothétique (%)", 5, 0, 50), number("contingency", "Marge de sécurité (%)", 5, 0, 50)],
    metrics: [["total", "Coût total"], ["averageAnnual", "Moyenne annuelle"], ["baseRecurring", "Base récurrente"]]
  },
  "cert-roi": {
    title: "Scénario coût et retour d’une certification", description: "Modelez coût, temps d’étude et hausse de revenu hypothétique; ce calcul ne promet ni emploi ni salaire.",
    script: "/tools/cert-roi/cert-roi-engine.js", global: "AfroTools.certRoiEngine", recipe: "cert",
    fields: [number("directCost", "Coût direct", 1000, 0), number("otherCost", "Autres coûts", 200, 0), number("studyHours", "Heures d’étude", 100, 0), number("hourValue", "Valeur d’une heure", 10, 0), number("annualUplift", "Hausse annuelle hypothétique", 1200, 0), number("studyMonths", "Mois d’étude", 6, 0, 120), number("delayMonths", "Délai après étude", 3, 0, 120), number("horizonYears", "Horizon (années)", 3, 1, 10)],
    metrics: [["totalInvestment", "Investissement total"], ["grossUplift", "Gain brut hypothétique"], ["netGain", "Gain net"], ["roiPercent", "ROI hypothétique (%)"]]
  },
  "classroom-size": {
    title: "Planificateur de capacité de salle", description: "Calculez une capacité géométrique à partir des mesures saisies; vérifiez les normes locales, sorties et besoins d’accessibilité.",
    script: "/tools/classroom-size/classroom-layout-engine.js", global: "AfroTools.classroomLayoutEngine", recipe: "classroom",
    fields: [number("roomLength", "Longueur (m)", 9, 0.1), number("roomWidth", "Largeur (m)", 7, 0.1), number("frontDepth", "Dégagement avant", 1.3, 0), number("rearDepth", "Dégagement arrière", 1, 0), number("sideClearance", "Dégagement latéral", 0.5, 0), number("aisleWidth", "Largeur d’allée", 0.6, 0), number("aisleCount", "Nombre d’allées", 1, 0, 20, 1), number("deskWidth", "Largeur du module", 1.2, 0.1), number("rowPitch", "Pas des rangées", 0.9, 0.1), number("seatsPerUnit", "Places par module", 2, 1, 20, 1), number("areaPerLearner", "Surface par apprenant", 1.5, 0.1), number("actualLearners", "Effectif actuel", 32, 0, 1000, 1)],
    metrics: [["grossArea", "Surface brute"], ["planningCapacity", "Capacité de planification"], ["limitingFactor", "Facteur limitant"], ["difference", "Écart avec l’effectif"]]
  },
  "course-load": {
    title: "Audit de charge de cours", description: "Additionnez crédits et heures hebdomadaires; votre établissement reste propriétaire des règles de progression.",
    script: "/tools/course-load/course-load-engine.js", global: "CourseLoadEngine", recipe: "course-load",
    fields: [number("required", "Crédits du programme", 120, 1, 1000), number("earned", "Crédits acquis", 45, 0, 1000), number("min", "Minimum du semestre", 12, 0, 100), number("max", "Maximum du semestre", 21, 0.1, 100), text("course1", "Cours 1", "BIO 201"), number("credits1", "Crédits cours 1", 3, 0.1, 100), text("course2", "Cours 2", "CHEM 203"), number("credits2", "Crédits cours 2", 4, 0.1, 100), number("contact", "Cours/placements h", 15, 0, 168), number("study", "Étude autonome h", 24, 0, 168), number("work", "Travail/soins h", 10, 0, 168), number("sleepNight", "Sommeil/nuit h", 8, 0, 24)],
    metrics: [["registered", "Crédits inscrits"], ["band", "Position dans la plage"], ["remainingIfCompleted", "Crédits restants"], ["unallocated", "Heures non affectées"]]
  },
  "edu-savings": {
    title: "Plan d’épargne études", description: "Projetez un objectif avec vos propres hypothèses d’inflation et de croissance; aucun produit financier n’est recommandé.",
    script: "/tools/edu-savings/edu-savings-engine.js", global: "AfroTools.eduSavingsEngine", recipe: "edu-savings",
    fields: [number("todayCost", "Coût actuel", 10000, 1), number("months", "Mois avant paiement", 12, 1, 600, 1), number("inflationRate", "Inflation annuelle (%)", 0, -50, 100), number("currentSavings", "Épargne actuelle", 1000, 0), number("monthlyContribution", "Versement mensuel", 500, 0), number("annualGrowthRate", "Croissance annuelle hypothétique (%)", 0, -50, 100), select("timing", "Moment du versement", "end", [["end", "Fin de mois"], ["beginning", "Début de mois"]])],
    metrics: [["futureCost", "Coût futur"], ["projectedFund", "Fonds projeté"], ["gap", "Écart"], ["requiredMonthlyContribution", "Versement requis"]]
  },
  "exam-timetable": {
    title: "Générateur de planning d’examens", description: "Répartissez des séances avant les dates officielles que vous saisissez; le planning ne remplace pas le calendrier de l’établissement.",
    script: "/tools/exam-timetable/exam-schedule-engine.js", global: "AfroTools.examScheduleEngine", recipe: "exam-timetable",
    fields: [date("startDate", "Début des révisions", "2026-08-03"), number("sessionsPerDay", "Séances par jour", 2, 1, 8, 1), text("subject1", "Matière 1", "Mathématiques"), date("examDate1", "Date officielle 1", "2026-08-20"), number("target1", "Séances visées 1", 6, 1, 200, 1), text("subject2", "Matière 2", "Physique"), date("examDate2", "Date officielle 2", "2026-08-25"), number("target2", "Séances visées 2", 4, 1, 200, 1)],
    metrics: [["totalTarget", "Séances visées"], ["totalPlanned", "Séances planifiées"], ["totalShortfall", "Séances manquantes"]]
  },
  "interview-prep": {
    title: "Préparation d’entretien", description: "Structurez localement preuves, récit STAR et questions; aucun texte n’est envoyé à un recruteur ou à une IA.",
    script: "/tools/interview-prep/interview-prep-engine.js", global: "InterviewPrepEngine", recipe: "interview",
    fields: [text("role", "Rôle visé", "Analyste opérations"), text("employer", "Employeur", "Entreprise exemple"), select("format", "Format", "panel", [["panel", "Panel"], ["video", "Vidéo"], ["phone", "Téléphone"]]), text("requirement", "Exigence", "Amélioration de processus"), area("proof", "Preuve synthétique", "Réduction mesurée du délai de traitement"), area("question", "Question à poser", "Comment la réussite est-elle mesurée ?")],
    metrics: [["role", "Rôle"], ["employer", "Employeur"], ["evidenceCount", "Preuves préparées"], ["questionCount", "Questions préparées"]]
  },
  "plagiarism-pct": {
    title: "Auto-vérification de répétitions", description: "Repérez localement répétitions et variété lexicale; ce diagnostic ne compare pas votre texte à Internet et ne mesure pas le plagiat.",
    script: "/tools/plagiarism-pct/draft-repetition-engine.js", global: "AfroTools.draftRepetitionEngine", recipe: "plagiarism",
    fields: [area("text", "Brouillon privé", "Alpha beta gamma delta ouvre cette analyse. Cette phrase se répète exactement. Alpha beta gamma delta revient pour tester la répétition. Cette phrase se répète exactement. Une conclusion distincte termine le brouillon."), number("phraseSize", "Taille des groupes de mots", 4, 3, 8, 1), number("minimumCount", "Occurrences minimales", 2, 2, 10, 1)],
    metrics: [["wordCount", "Mots"], ["uniqueWords", "Mots uniques"], ["lexicalVarietyPercent", "Variété lexicale (%)"], ["repeatedPhraseCount", "Groupes répétés"]]
  },
  "scholarship-finder": {
    title: "Recherche de bourses pour l'Afrique", description: "Comparez votre profil au flux de bourses sourcé d'AfroTools; le score organise une liste de vérification et ne décide jamais de votre éligibilité.",
    script: "/engines/scholarship-matcher.js", extraScripts: ["/assets/js/education-scholarship-feed.js"], global: "ScholarshipMatcher", recipe: "scholarship",
    fields: [number("gpaValue", "GPA ou note", 3.5, 0, 100, 0.01), select("gpaScale", "Barème", "4.0", [["4.0", "4,0"], ["5.0", "5,0"], ["percentage", "Pourcentage"], ["20", "Sur 20"]]), number("ielts", "IELTS global", 7, 0, 9, 0.5), select("level", "Niveau visé", "masters", [["undergrad", "Licence"], ["masters", "Master"], ["phd", "Doctorat"], ["postdoc", "Post-doctorat"]]), select("field", "Domaine", "stem", [["any", "Tous domaines"], ["stem", "STEM / ingénierie"], ["business", "Commerce / économie"], ["health", "Santé"], ["law", "Droit"], ["arts", "Arts et lettres"], ["agric", "Agriculture"]]), select("destination", "Destination", "uk", [["global", "Toutes destinations"], ["uk", "Royaume-Uni"], ["us", "États-Unis"], ["eu", "Europe"], ["canada", "Canada"], ["australia", "Australie"], ["africa", "Afrique"]])],
    metrics: [["total", "Bourses comparées"], ["topName", "Première correspondance"], ["topPercent", "Score indicatif (%)"], ["topCategorySwahili", "Niveau de correspondance"], ["feedLabel", "État de la source"]]
  },
  "tutoring-rate": {
    swahiliRoute: "/sw/zana/bei-ya-mafunzo-binafsi", title: "Calculateur de tarif de tutorat", description: "Calculez un tarif soutenable à partir de votre revenu cible, coûts, charge de travail et réserves; aucun tarif de marché n’est prétendu.",
    script: "/tools/tutoring-rate/tutoring-rate-engine.js", global: "AfroToolsTutoringRateEngine", recipe: "tutoring",
    fields: [number("targetIncome", "Revenu mensuel cible", 400000, 0), number("monthlyCosts", "Coûts fixes mensuels", 35000, 0), number("sessionsPerWeek", "Séances/semaine", 10, 0.1, 100), number("weeksPerMonth", "Semaines/mois", 4, 0.1, 6), number("lessonMinutes", "Minutes de cours", 60, 1, 600), number("groupSize", "Apprenants/séance", 1, 1, 100, 1), number("prepMinutes", "Préparation/séance", 20, 0, 600), number("adminMinutes", "Administration/séance", 10, 0, 600), number("travelMinutes", "Déplacement/séance", 0, 0, 600), number("sessionCost", "Coût variable/séance", 1000, 0), number("taxReserve", "Réserve fiscale (%)", 5, 0, 49), number("riskReserve", "Réserve risque (%)", 5, 0, 49), number("packageSessions", "Séances du forfait", 8, 1, 100, 1), number("packageDiscount", "Remise forfait (%)", 5, 0, 100), number("proposedPrice", "Prix proposé", 12000, 0)],
    metrics: [["requiredRevenueMonthly", "Revenu mensuel requis"], ["requiredSessionRevenue", "Revenu requis/séance"], ["perLearnerSession", "Tarif/apprenant"], ["comparison.monthlyGap", "Écart mensuel du prix proposé"]]
  }
};

const manualTranslations = Object.freeze({
  "sin(30) + sqrt(16)": "sin(30) + sqrt(16)",
  "Éducation AfroTools": "Elimu AfroTools",
  "Votre scénario": "Hali yako ya kujaribu",
  "Calculer et vérifier": "Kokotoa na uhakiki",
  "Réinitialiser": "Weka upya",
  "Résultat du scénario": "Matokeo ya hali uliyoingiza",
  "Copier": "Nakili",
  "Enregistrer localement": "Hifadhi kwenye kifaa",
  "Imprimer": "Chapisha",
  "Limites et confidentialité": "Mipaka na faragha",
  "Flux vérifié": "Chanzo kilichohakikiwa",
  "Ouvrir l'application": "Fungua programu",
  "Tableau de planification des études": "Karatasi ya kupanga masomo",
  "Mathématiques": "Hisabati",
  "Sciences physiques": "Sayansi ya fizikia",
  "Sciences de la vie": "Sayansi ya maisha",
  "Comptabilité": "Uhasibu",
  "Résultat": "Matokeo",
  "Pourcentage": "Asilimia",
  "Moyenne": "Wastani",
  "Médiane": "Mediani",
  "Date officielle": "Tarehe rasmi",
  "Jours calendaires": "Siku za kalenda",
  "Sources officielles": "Vyanzo rasmi",
  "Vérifier auprès de la source officielle": "Hakikisha kwenye chanzo rasmi"
});

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function translationMarker(index) {
  return `___AFRO_SW_EDU_${String(index).padStart(4, "0")}___`;
}

async function translateChunk(items) {
  const joined = items.map((item, index) => `${translationMarker(index)}\n${item}`).join("\n");
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=sw&dt=t&q="
    + encodeURIComponent(joined);
  const response = await fetch(url, { headers: { "User-Agent": "AfroTools-Swahili-Education-Parity/1.0" } });
  if (!response.ok) throw new Error(`Education translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = (data[0] || []).map((row) => row[0] || "").join("");
  const parts = translated.split(/___AFRO_SW_EDU_(\d{4})___\s*/g);
  const result = new Array(items.length);
  for (let index = 1; index < parts.length; index += 2) {
    result[Number(parts[index])] = String(parts[index + 1] || "").trim();
  }
  if (result.some((value) => !value)) throw new Error("Education translation markers were not preserved.");
  return result;
}

function definitionStrings() {
  const strings = new Set();
  Object.values(definitions).forEach((definition) => {
    strings.add(definition.title);
    strings.add(definition.description);
    definition.fields.forEach((field) => {
      strings.add(field.label);
      if ((field.type === "text" || field.type === "textarea") && field.value) strings.add(String(field.value));
      (field.options || []).forEach((option) => strings.add(String(option[1])));
    });
    definition.metrics.forEach((metric) => strings.add(String(metric[1])));
  });
  return [...strings].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

async function populateTranslationCache(strings, cache) {
  const pending = strings.filter((value) => !cache[value]);
  for (let start = 0; start < pending.length; start += 20) {
    const items = pending.slice(start, start + 20);
    const translated = await translateChunk(items);
    items.forEach((item, index) => { cache[item] = translated[index]; });
    process.stdout.write(`Translated Education ${Math.min(start + items.length, pending.length)}/${pending.length}\r`);
  }
  if (pending.length) process.stdout.write("\n");
}

function localizeDefinition(definition, cache) {
  const t = (value) => manualTranslations[value] || cache[value] || value;
  return {
    ...definition,
    title: t(definition.title),
    description: t(definition.description),
    fields: definition.fields.map((field) => ({
      ...field,
      label: t(field.label),
      value: (field.type === "text" || field.type === "textarea") && field.value ? t(String(field.value)) : field.value,
      options: field.options ? field.options.map(([value, label]) => [value, t(String(label))]) : undefined
    })),
    metrics: definition.metrics.map(([key, label]) => [key, t(String(label))])
  };
}

function normalize(route) {
  return `/${String(route || "").replace(/^\/+|\/+$/g, "")}/`;
}

function alternateLinks(existing, english, swahili) {
  const englishFile = path.join(root, normalize(english).replace(/^\/|\/$/g, ""), "index.html");
  const englishHtml = fs.existsSync(englishFile) ? fs.readFileSync(englishFile, "utf8") : "";
  const found = `${englishHtml}\n${existing}`.match(/<link rel="alternate"[^>]+>/g) || [];
  const byLang = new Map();
  found.forEach((tag) => {
    const match = tag.match(/hreflang="([^"]+)"/);
    if (match) byLang.set(match[1], tag);
  });
  byLang.delete("sw");
  byLang.set("en", `<link rel="alternate" hreflang="en" href="https://afrotools.com${normalize(english)}">`);
  byLang.set("sw", `<link rel="alternate" hreflang="sw" href="https://afrotools.com${normalize(swahili)}">`);
  byLang.set("x-default", `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${normalize(english)}">`);
  return [...byLang.values()].join("\n");
}

function ensureReciprocalHreflang(manifest) {
  for (const route of manifest.routes) {
    const swFile = path.join(root, route.swahili.replace(/^\/|\/$/g, ""), "index.html");
    if (!fs.existsSync(swFile)) continue;
    const swHtml = fs.readFileSync(swFile, "utf8");
    const alternates = swHtml.match(/<link rel="alternate"[^>]+>/g) || [];
    for (const alternate of alternates) {
      const lang = (alternate.match(/hreflang="([^"]+)"/) || [])[1];
      const href = (alternate.match(/href="https:\/\/afrotools\.com([^"]+)"/) || [])[1];
      if (!lang || !href || lang === "sw" || lang === "x-default") continue;
      const ownerFile = path.join(root, normalize(href).replace(/^\/|\/$/g, ""), "index.html");
      if (!fs.existsSync(ownerFile)) continue;
      const ownerHtml = fs.readFileSync(ownerFile, "utf8");
      const swTag = `<link rel="alternate" hreflang="sw" href="https://afrotools.com${route.swahili}">`;
      if (ownerHtml.includes(swTag)) continue;
      const next = ownerHtml.includes('<link rel="alternate" hreflang="x-default"')
        ? ownerHtml.replace('<link rel="alternate" hreflang="x-default"', `${swTag}\n<link rel="alternate" hreflang="x-default"`)
        : ownerHtml.replace("</head>", `${swTag}\n</head>`);
      fs.writeFileSync(ownerFile, next, "utf8");
    }
  }
}

function fieldHtml(field) {
  const required = " required";
  if (field.type === "select") {
    return `<label>${field.label}<select name="${field.name}"${required}>${field.options.map(([value, label]) => `<option value="${value}"${String(value) === String(field.value) ? " selected" : ""}>${label}</option>`).join("")}</select></label>`;
  }
  if (field.type === "textarea") return `<label class="full">${field.label}<textarea name="${field.name}" rows="6"${required}>${field.value}</textarea></label>`;
  const limits = field.type === "number" ? ` min="${field.min}" max="${field.max}" step="${field.step}"` : "";
  return `<label>${field.label}<input type="${field.type}" name="${field.name}" value="${field.value}"${limits}${required}></label>`;
}

function page(row, definition, route, existing) {
  const english = normalize(row.englishRoute);
  const swahili = normalize(route);
  const art = `/assets/img/tools/${row.englishId}.webp`;
  const config = JSON.stringify({ id: row.englishId, title: definition.title, recipe: definition.recipe, global: definition.global, metrics: definition.metrics });
  let prelude = "";
  if (definition.prelude === "periodic-elements") {
    const english = fs.readFileSync(path.join(root, "tools/periodic-table/index.html"), "utf8");
    const match = english.match(/var E=(\[[\s\S]*?\]);\s*window\.PERIODIC_ELEMENTS=E;/);
    if (!match) throw new Error("Periodic element dataset owner not found.");
    prelude = `<script>window.PERIODIC_ELEMENTS=${match[1]};</script>`;
  }
  const extraScripts = (definition.extraScripts || []).map((src) => `<script src="${src}"></script>`).join("");
  const sourceBadge = definition.recipe === "scholarship"
    ? '<p class="crumb" data-scholarship-feed-badge>Chanzo kilichohakikiwa</p>'
    : "";
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${definition.title} | AfroTools</title>
<meta name="description" content="${definition.description}">
<link rel="canonical" href="https://afrotools.com${swahili}">
${alternateLinks(existing, english, swahili)}
<meta property="og:title" content="${definition.title}"><meta property="og:description" content="${definition.description}">
<meta property="og:url" content="https://afrotools.com${swahili}"><meta property="og:image" content="https://afrotools.com${art}">
<meta name="twitter:card" content="summary_large_image">
<meta name="afrotools-source-owner" content="scripts/build-sw-education-parity.js">
<meta name="afrotools-sw-native-owner" content="${row.englishId}">
<link rel="stylesheet" href="/assets/css/design-system.css">
<style>
:root{color-scheme:light dark;--ed-bg:#f4f7fb;--ed-card:#fff;--ed-text:#10213a;--ed-muted:#53647c;--ed-line:#cbd7e6;--ed-blue:#1166cc;--ed-soft:#eaf3ff}
[data-theme="dark"]{--ed-bg:#091526;--ed-card:#122238;--ed-text:#f5f8fc;--ed-muted:#b8c7d9;--ed-line:#3b516d;--ed-blue:#7db5ff;--ed-soft:#183456}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--ed-bg:#091526;--ed-card:#122238;--ed-text:#f5f8fc;--ed-muted:#b8c7d9;--ed-line:#3b516d;--ed-blue:#7db5ff;--ed-soft:#183456}}
*{box-sizing:border-box}body{margin:0;background:var(--ed-bg);color:var(--ed-text);font-family:Inter,system-ui,sans-serif;line-height:1.55}.wrap{width:min(1120px,calc(100% - 28px));margin:auto;padding:28px 0 64px}.hero{background:#071d35;color:#fff;border-radius:24px;padding:clamp(24px,5vw,54px);box-shadow:0 20px 55px #00152b24}.hero p{color:#d6e8ff;max-width:780px}.crumb{color:#94c7ff;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:22px;margin-top:22px}.card{background:var(--ed-card);border:1px solid var(--ed-line);border-radius:20px;padding:24px;min-width:0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.fields label{display:grid;gap:6px;font-weight:750}.fields .full{grid-column:1/-1}input,select,textarea,button{font:inherit}input,select,textarea{width:100%;min-height:48px;border:1px solid var(--ed-line);border-radius:11px;background:var(--ed-card);color:var(--ed-text);padding:10px 12px}textarea{resize:vertical}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}button{min-height:46px;border-radius:11px;border:1px solid var(--ed-line);padding:10px 15px;font-weight:800;cursor:pointer;background:var(--ed-card);color:var(--ed-text)}button.primary{background:#0868d7;color:#fff;border-color:#0868d7}.status{min-height:28px;margin:12px 0;color:var(--ed-muted)}.status.error{color:#b42318}.result{display:none;background:var(--ed-soft);border-radius:14px;padding:18px}.result.show{display:block}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{background:var(--ed-card);border:1px solid var(--ed-line);border-radius:12px;padding:12px}.metric span{display:block;color:var(--ed-muted);font-size:.88rem}.metric strong{display:block;overflow-wrap:anywhere}.boundary{border-left:4px solid #16834b}.boundary p,.boundary li{color:var(--ed-muted)}a{color:var(--ed-blue)}:focus-visible{outline:3px solid #ffb000;outline-offset:3px}
@media(max-width:760px){.grid{grid-template-columns:1fr}.fields{grid-template-columns:1fr}.fields .full{grid-column:auto}.metrics{grid-template-columns:1fr}.wrap{width:min(100% - 18px,1120px)}}
@media print{.hero,.boundary,.actions,.status{display:none}.grid{display:block}.card{border:0}.result{display:block}}
</style>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":["WebApplication","EducationalApplication"],name:definition.title,url:`https://afrotools.com${swahili}`,inLanguage:"sw",isAccessibleForFree:true,applicationCategory:"EducationalApplication",operatingSystem:"Any modern browser",description:definition.description})}</script>
</head><body data-education-id="${row.englishId}">
<main class="wrap"><section class="hero"><a class="crumb" href="/sw/elimu/">Elimu AfroTools</a><h1>${definition.title}</h1><p>${definition.description}</p>${sourceBadge}</section>
<div class="grid"><section class="card"><h2>Hali yako ya kujaribu</h2><form data-education-form><div class="fields">${definition.fields.map(fieldHtml).join("")}</div><div class="actions"><button class="primary" type="submit">Kokotoa na uhakiki</button><button type="reset">Weka upya</button></div></form><p class="status" data-education-status role="status" aria-live="polite"></p><section class="result" data-education-result aria-live="polite"><h2>Matokeo ya hali uliyoingiza</h2><div class="metrics" data-education-metrics></div><div class="actions"><button type="button" data-action="copy">Nakili</button><button type="button" data-action="json">JSON</button><button type="button" data-action="csv">CSV</button><button type="button" data-action="txt">TXT</button><button type="button" data-action="pdf">PDF</button><button type="button" data-action="save">Hifadhi kwenye kifaa</button><button type="button" data-action="print">Chapisha</button></div></section></section>
<aside class="card boundary"><h2>Mipaka, vyanzo na faragha</h2><p>Huhitaji akaunti, hakuna upakiaji, na hakuna taarifa inayotumwa kwa AI. Taarifa unazoingiza na faili za kupakua hubaki kwenye kivinjari hiki.</p><ul><li>Matokeo ni karatasi ya kupanga, si uamuzi wa kujiunga, ufadhili, alama rasmi, ada rasmi au ushauri wa fedha.</li><li>Kanuni, tarehe, ada na viwango vinavyobadilika lazima vithibitishwe kwenye tovuti rasmi na taasisi husika.</li><li>Kurasa za Kiingereza na Kiswahili zinatumia injini ileile ya hesabu inayoweza kurudiwa.</li></ul><p><strong>Uhakiki wa chanzo:</strong> tumia kiungo cha Kiingereza kilicho kwenye hreflang kufikia marejeo na vyanzo vya programu hii; angalia tarehe ya chanzo kabla ya kufanya uamuzi.</p><img src="${art}" alt="" width="240" height="135" loading="lazy"></aside></div></main>
<script type="application/json" id="education-parity-config">${config.replace(/</g, "\\u003c")}</script>
${prelude}${extraScripts}<script src="${definition.script}"></script><script src="/assets/js/pages/sw-education-parity.js"></script>
</body></html>`;
}

function categoryHub(manifest, localizedDefinitions) {
  const labels = {
    "education-hub": "Kituo cha kupanga masomo"
  };
  const items = manifest.routes.map((route, index) => {
    const title = localizedDefinitions[route.id] ? localizedDefinitions[route.id].title : labels[route.id] || route.id;
    return `<li><a href="${route.swahili}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${title}</strong><small>Fungua programu</small></a></li>`;
  }).join("");
  const itemList = manifest.routes.map((route, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://afrotools.com${route.swahili}`,
    name: localizedDefinitions[route.id] ? localizedDefinitions[route.id].title : labels[route.id] || route.id
  }));
  return `<!doctype html>
<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Programu ${manifest.routes.length} za elimu kwa Kiswahili | AfroTools</title>
<meta name="description" content="Fungua programu ${manifest.routes.length} za elimu kwa Kiswahili kwa mitihani, GPA, kujiunga, bajeti, ufadhili, mipango, hesabu na faili za ndani ya kivinjari.">
<link rel="canonical" href="https://afrotools.com/sw/elimu/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/education/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/elimu/">
<link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/ilimi/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/education/">
<meta property="og:type" content="website"><meta property="og:locale" content="sw_KE">
<meta property="og:title" content="Programu ${manifest.routes.length} za elimu kwa Kiswahili | AfroTools">
<meta property="og:description" content="Orodha kamili ya programu za elimu za AfroTools zinazopatikana kwa Kiswahili.">
<meta property="og:url" content="https://afrotools.com/sw/elimu/"><meta property="og:image" content="https://afrotools.com/assets/img/tools/education-hub.webp">
<link rel="stylesheet" href="/assets/css/design-system.css">
<style>
:root{color-scheme:light dark;--bg:#f4f7fb;--card:#fff;--text:#10213a;--muted:#53647c;--line:#cad8e7;--link:#075fca}
[data-theme="dark"]{--bg:#081524;--card:#122238;--text:#f6f9fd;--muted:#bed0e4;--line:#405872;--link:#86bdff}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#081524;--card:#122238;--text:#f6f9fd;--muted:#bed0e4;--line:#405872;--link:#86bdff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;line-height:1.55}.wrap{width:min(1180px,calc(100% - 28px));margin:auto}.hero{background:#071d35;color:#fff;padding:clamp(44px,8vw,86px) 0}.eyebrow{color:#90c8ff;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.hero h1{max-width:900px;font-size:clamp(2.2rem,6vw,4.6rem);line-height:1.02;margin:.35rem 0 1rem}.hero p{max-width:800px;color:#d6e8ff;font-size:1.08rem}.summary{display:flex;gap:14px;flex-wrap:wrap;margin-top:22px}.summary span{border:1px solid #446a91;border-radius:999px;padding:8px 13px;font-weight:750}.directory{padding:42px 0 70px}.directory h2{font-size:1.8rem}.directory>p{color:var(--muted);max-width:780px}.tools{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.tools a{height:100%;display:grid;grid-template-columns:auto 1fr;gap:5px 12px;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:17px;color:var(--text);text-decoration:none}.tools span{grid-row:1/3;color:var(--link);font-weight:900}.tools strong{overflow-wrap:anywhere}.tools small{color:var(--muted)}.tools a:hover{border-color:var(--link);transform:translateY(-1px)}:focus-visible{outline:3px solid #ffb000;outline-offset:3px}
@media(max-width:850px){.tools{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.tools{grid-template-columns:1fr}.wrap{width:min(100% - 18px,1180px)}}
</style>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage",name:`Programu ${manifest.routes.length} za elimu kwa Kiswahili`,url:"https://afrotools.com/sw/elimu/",inLanguage:"sw",mainEntity:{"@type":"ItemList",numberOfItems:manifest.routes.length,itemListElement:itemList}})}</script>
</head><body><afro-navbar active="education"></afro-navbar><main><header class="hero"><div class="wrap"><p class="eyebrow">Elimu · Kiswahili</p><h1>Programu zote ${manifest.routes.length} za elimu, mahali pamoja.</h1><p>Kila programu ya bure ya Kiingereza katika kundi hili ina mmiliki wa Kiswahili. Hesabu hubaki kwenye kivinjari; alama, viwango, ada, tarehe, kujiunga na ufadhili lazima vithibitishwe kwenye chanzo rasmi.</p><div class="summary"><span>Programu ${manifest.routes.length}</span><span>Foleni ya michoro iliyo wazi</span><span>Hesabu na faili za ndani</span></div></div></header><section class="directory wrap"><h2>Orodha kamili</h2><p>Chagua kazi. Kila kadi hufungua programu ya Kiswahili moja kwa moja bila kukupeleka kwenye ganda la Kiingereza.</p><ol class="tools">${items}</ol></section></main><afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></body></html>`;
}

function updateAssignedDiscovery(manifest, localizedDefinitions) {
  const file = path.join(root, "sw/zana-za-elimu/index.html");
  const html = fs.readFileSync(file, "utf8");
  const start = "<!-- sw-education-assigned-parity:start -->";
  const end = "<!-- sw-education-assigned-parity:end -->";
  const links = manifest.routes.map((route) => {
    const name = localizedDefinitions[route.id] ? localizedDefinitions[route.id].title : "Kituo cha elimu";
    return `<a href="${route.swahili}" class="tool-card"><span class="badge-live">Inapatikana</span><div class="tool-card-name">${name}</div><span class="tool-card-cta">Fungua →</span></a>`;
  }).join("\n      ");
  const block = `${start}\n<section class="sec sec--white" data-sw-education-assigned-directory><div class="wrap"><div class="eyebrow">Programu zilizohakikiwa</div><h2 class="sec-title">Programu 32 za kundi hili</h2><p class="sec-sub">Orodha hii ina kila programu ya Elimu iliyopewa ukaguzi huu; kila kiungo kinafungua programu asilia ya Kiswahili.</p><div class="tool-grid">${links}</div></div></section>\n${end}`;
  const next = html.includes(start)
    ? html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block)
    : html.replace("<afro-footer></afro-footer>", `${block}\n<afro-footer></afro-footer>`);
  fs.writeFileSync(file, next, "utf8");
}

async function main() {
  if (rows.length !== 32) throw new Error(`Assigned Education denominator drift: ${rows.length}/32`);
  const strings = definitionStrings();
  const cache = Object.assign({}, readJson(translationCachePath, {}), manualTranslations);
  if (refreshTranslations) await populateTranslationCache(strings, cache);
  const untranslated = strings.filter((value) => !cache[value]);
  if (untranslated.length) {
    throw new Error(`${untranslated.length} Swahili Education strings are not translated. Run with --refresh-translations.`);
  }
  const localizedDefinitions = Object.fromEntries(
    Object.entries(definitions).map(([id, definition]) => [id, localizeDefinition(definition, cache)])
  );
  const manifest = {
    schemaVersion: 1,
    baseline: "6edacda8437e1fa9b9e5a512138cbdd3169e38be",
    category: "Education",
    categoryKey: "education",
    denominator: rows.length,
    routes: []
  };
  for (const row of rows) {
    const definition = localizedDefinitions[row.englishId];
    const swahiliRoute = normalize(
      (definition && definition.swahiliRoute)
        || row.primarySwahiliRoute
        || missingRouteOwners[row.englishId]
    );
    if (swahiliRoute === "/") throw new Error(`${row.englishId}: no Swahili Education owner route is declared.`);
    manifest.routes.push({
      id: row.englishId,
      english: normalize(row.englishRoute),
      swahili: swahiliRoute,
      baselineState: row.state,
      owner: definition ? definition.global : "existing-native-owner",
      sourceOwner: definition ? "scripts/build-sw-education-parity.js" : row.sourceOwner,
      artwork: `assets/img/tools/${row.englishId}.webp`,
      state: acceptanceState
    });
    if (!definition) continue;
    const file = path.join(root, swahiliRoute.replace(/^\/|\/$/g, ""), "index.html");
    const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page(row, definition, swahiliRoute, existing), "utf8");
  }
  fs.mkdirSync(path.join(root, "data", "i18n"), { recursive: true });
  fs.writeFileSync(translationCachePath, `${JSON.stringify(Object.fromEntries(
    Object.entries(cache).sort((a, b) => a[0].localeCompare(b[0]))
  ), null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(root, "data/localization/sw-education-parity.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  updateAssignedDiscovery(manifest, localizedDefinitions);
  ensureReciprocalHreflang(manifest);
  const missing = manifest.routes
    .filter((route) => !fs.existsSync(path.join(root, route.artwork)))
    .map((route) => ({ id: route.id, route: route.swahili, artwork: route.artwork }));
  fs.writeFileSync(
    path.join(root, "reports/sw-education-missing-artwork.json"),
    `${JSON.stringify({ denominator: rows.length, missingCount: missing.length, missing }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Generated ${rows.length} assigned Education owners; manifest ${manifest.routes.length}/${rows.length}; artwork missing ${missing.length}.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
