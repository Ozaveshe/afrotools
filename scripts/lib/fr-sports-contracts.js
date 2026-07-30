"use strict";

const SPORTS = [
  {
    id: "betting-odds",
    frSlug: "cotes-paris-sportifs",
    title: "Calculateur de cotes de football",
    seoTitle: "Calculateur de cotes de football : probabilité et valeur | AfroTools",
    description: "Convertissez des cotes de football, comparez probabilité implicite et estimation personnelle, puis mesurez rendement et valeur attendue sans prédire un résultat.",
    eyebrow: "Comprendre les cotes",
    intro: "Transformez les chiffres d’un coupon en scénario transparent. Le calcul utilise uniquement vos valeurs et ne désigne jamais un pari gagnant.",
    resultLabel: "Valeur mathématique du scénario",
    resultSummary: "Rendement conditionnel calculé à partir de la mise, des cotes et de votre estimation. Ce résultat ne prédit pas l’issue du match.",
    insights: [
      "Une valeur positive dépend entièrement de la qualité de votre estimation et ne prédit aucune victoire.",
      "Comparez la valeur attendue entre scénarios de même mise, sans chercher à récupérer une perte.",
      "La marge sans commission est une lecture mathématique du marché saisi, pas un conseil de pari."
    ],
    safety: "Réservé aux adultes. Fixez une limite de perte, n’empruntez jamais pour jouer et ne poursuivez jamais vos pertes."
  },
  {
    id: "afcon-predictor",
    frSlug: "predicteur-can",
    title: "Modèle de tournoi de la CAN",
    seoTitle: "Modèle de tournoi CAN : scénarios 2027 et revue 2025 | AfroTools",
    description: "Testez des hypothèses de forme, défense et avantage du public pour un scénario transparent de CAN, sans score en direct ni prédiction officielle.",
    eyebrow: "Scénario de tournoi",
    intro: "Comparez une sélection à un plateau de 24 équipes avec un modèle déterministe. Les réglages sont vos hypothèses, pas un classement en direct.",
    resultLabel: "Part du modèle pour le titre",
    resultSummary: "Scénario indicatif fondé sur la force de base et vos hypothèses de forme, défense, public et volatilité.",
    insights: [
      "Les réglages de forme et de défense sont des hypothèses éditoriales, pas des données en direct.",
      "Dans un tournoi à élimination directe, une faible probabilité individuelle est normale.",
      "Utilisez le classement de scénarios pour préparer des questions, jamais comme résultat officiel."
    ],
    safety: "Aucun score, entrant, blessure ni résultat en direct n’est récupéré ou inventé. Vérifiez le plateau et le règlement auprès de la CAF."
  },
  {
    id: "fantasy-football",
    frSlug: "points-fantasy-football",
    title: "Calculateur de points fantasy football",
    seoTitle: "Calculateur points fantasy : archive du barème FPL 2025/26 | AfroTools",
    description: "Rejouez un scénario avec l’archive du barème FPL 2025/26 selon le poste, les minutes, buts, passes, bonus, cartons, arrêts et contributions défensives.",
    eyebrow: "Barème fantasy",
    intro: "Reconstituez un score à partir d’une performance saisie. Le résultat reste provisoire tant que l’organisateur n’a pas confirmé les statistiques.",
    resultLabel: "Points de la journée",
    resultSummary: "Score calculé avant règles de banc, puces et corrections éventuelles de l’organisateur.",
    insights: [
      "Ajoutez les contributions défensives uniquement à partir de statistiques vérifiables.",
      "Le capitanat dépend aussi du temps de jeu probable et de la difficulté du match.",
      "L’organisateur peut corriger passes décisives et bonus après révision."
    ],
    safety: "Aucune composition, blessure ou statistique en direct n’est fournie. Vérifiez toujours le barème et les données officielles."
  },
  {
    id: "betting-tax",
    frSlug: "taxe-paris-sportifs",
    title: "Simulateur de taxes sur les paris sportifs",
    seoTitle: "Simulateur taxes paris sportifs Afrique : retenue et net | AfroTools",
    description: "Simulez dépôt, mise, paiement brut, retenue indicative et bénéfice net à partir de règles modifiables, sans produire d’avis fiscal officiel.",
    eyebrow: "Fiscalité indicative",
    intro: "Séparez mise, retenue et paiement net. Les paramètres du moteur anglais sont conservés, mais toute règle doit être vérifiée avant déclaration.",
    resultLabel: "Bénéfice net après taxes modélisées",
    resultSummary: "Estimation de planification selon le marché et les taux sélectionnés. Ce n’est ni un relevé opérateur ni un calcul fiscal officiel.",
    insights: [
      "Comparez la retenue affichée au relevé réel de l’opérateur.",
      "Les taxes peuvent porter sur le dépôt, la mise, le gain brut ou le gain net selon le pays.",
      "Utilisez le mode personnalisé seulement avec un taux provenant d’une source actuelle."
    ],
    safety: "Réservé aux adultes. Ne jouez que légalement et sans emprunt. Confirmez les règles auprès de l’administration fiscale et de l’opérateur."
  },
  {
    id: "streaming-royalties",
    frSlug: "redevances-streaming-musical",
    title: "Estimateur de redevances de streaming musical",
    seoTitle: "Redevances streaming musical Afrique : estimation artiste | AfroTools",
    description: "Estimez les revenus artiste selon le volume d’écoutes, le mix de plateformes, le distributeur, le label, l’édition et les retenues.",
    eyebrow: "Revenus musicaux",
    intro: "Construisez une fourchette de planification plutôt qu’un faux tarif par écoute. Les plateformes utilisent des modèles variables de répartition.",
    resultLabel: "Revenu net estimé de l’artiste",
    resultSummary: "Fourchette de planification après plateforme, distributeur, label, édition et retenues saisies.",
    insights: [
      "Aucune plateforme ne garantit un tarif fixe par écoute.",
      "Vérifiez les relevés du distributeur, les territoires et les clauses de votre contrat.",
      "Planifiez avec une fourchette et séparez droits du master et droits d’édition."
    ],
    safety: "Aucune donnée de compte ou d’artiste n’est transmise. Le résultat n’est ni un relevé de plateforme ni une créance garantie."
  },
  {
    id: "nollywood-box-office",
    frSlug: "box-office-nollywood",
    title: "Estimateur de rentabilité Nollywood",
    seoTitle: "Estimateur box-office Nollywood : recoupement producteur | AfroTools",
    description: "Estimez recettes producteur, part exploitant, distribution, streaming, partenariats, budget, marketing et seuil de fréquentation.",
    eyebrow: "Économie du film",
    intro: "Passez du box-office brut au revenu réellement disponible pour le producteur avec des hypothèses modifiables.",
    resultLabel: "Résultat estimé côté producteur",
    resultSummary: "Scénario après part des salles, distribution, revenus complémentaires, budget et marketing.",
    insights: [
      "Le box-office brut n’est pas le revenu du producteur.",
      "Documentez séparément chaque accord de distribution, streaming et partenariat.",
      "Testez un scénario prudent avant de retenir un objectif de fréquentation."
    ],
    safety: "Aucun chiffre de fréquentation ou contrat en direct n’est utilisé. Confirmez les accords et relevés avec les parties concernées."
  },
  {
    id: "dj-booking-rate",
    frSlug: "tarif-dj",
    title: "Calculateur de tarif DJ",
    seoTitle: "Calculateur tarif DJ Afrique : prestation, matériel et acompte | AfroTools",
    description: "Préparez un devis DJ avec type d’événement, durée, public, matériel, date, déplacement, hébergement et acompte.",
    eyebrow: "Devis de prestation",
    intro: "Expliquez le prix d’une prestation ligne par ligne afin de protéger le temps, le matériel et la logistique.",
    resultLabel: "Devis DJ recommandé",
    resultSummary: "Estimation de devis selon le marché, la prestation, le matériel, la date et la logistique saisis.",
    insights: [
      "Distinguez cachet artistique, location de matériel et déplacement.",
      "Précisez l’acompte, les horaires, les heures supplémentaires et les conditions d’annulation.",
      "Réduisez le périmètre avant de réduire un poste indispensable à la sécurité."
    ],
    safety: "Les références de prix ne sont pas des tarifs officiels. Confirmez disponibilité, sécurité électrique, transport et contrat."
  },
  {
    id: "concert-budget",
    frSlug: "budget-concert",
    title: "Planificateur de budget concert et festival",
    seoTitle: "Budget concert et festival : seuil de rentabilité | AfroTools",
    description: "Planifiez capacité, billets, sponsoring, artistes, lieu, production, sécurité, marketing, frais, aléas et seuil de rentabilité.",
    eyebrow: "Budget événementiel",
    intro: "Testez l’économie d’un événement avant d’annoncer la programmation ou de lancer la billetterie.",
    resultLabel: "Résultat net de l’événement",
    resultSummary: "Scénario après billetterie, sponsoring, artistes, lieu, production, sécurité, marketing, frais et aléas.",
    insights: [
      "Budgétez sécurité, autorisations et fonds d’urgence avant toute annonce.",
      "Traitez le sponsoring non signé comme zéro dans le scénario prudent.",
      "Vérifiez la capacité utile après zones techniques et exigences de sécurité."
    ],
    safety: "Ce budget ne remplace ni plan de sécurité, licence, assurance, devis fournisseur ni autorisation locale."
  },
  {
    id: "gym-roi-business",
    frSlug: "roi-salle-sport",
    title: "Calculateur de rentabilité d’une salle de sport",
    seoTitle: "Rentabilité salle de sport Afrique : membres, churn et retour | AfroTools",
    description: "Estimez bénéfice mensuel, membres au seuil, retour sur investissement, churn, valeur client et coût d’acquisition d’une salle de sport.",
    eyebrow: "Économie de la salle",
    intro: "Reliez membres actifs, prix, fidélisation, charges et investissement initial pour tester la viabilité d’une salle.",
    resultLabel: "Bénéfice d’exploitation mensuel",
    resultSummary: "Scénario d’exploitation selon membres, abonnements, ventes annexes, charges, acquisition et financement.",
    insights: [
      "Le churn mensuel peut annuler rapidement la croissance des inscriptions.",
      "Suivez séparément membres actifs, impayés, coûts d’acquisition et revenus annexes.",
      "Vérifiez chaque devis d’équipement et coût de financement avant investissement."
    ],
    safety: "Outil de planification commerciale uniquement. Il ne fournit aucun programme d’entraînement, diagnostic ou conseil de santé."
  },
  {
    id: "event-ticket-revenue",
    frSlug: "revenus-billetterie",
    title: "Calculateur de revenus de billetterie",
    seoTitle: "Revenus billetterie : VIP, standard, frais et remboursements | AfroTools",
    description: "Calculez le revenu net de billets VIP, standard et étudiant après frais de plateforme, paiement, remboursements, invitations et coûts.",
    eyebrow: "Rendement billetterie",
    intro: "Passez des ventes brutes au revenu réellement disponible après frais, remboursements, invitations et dépenses fixes.",
    resultLabel: "Revenu net de billetterie",
    resultSummary: "Scénario par catégorie de billet après frais, remboursements, invitations, marketing et coûts fixes.",
    insights: [
      "Les invitations utilisent de la capacité même sans générer de revenu.",
      "Vérifiez les frais de plateforme et de paiement dans votre contrat.",
      "Conservez une réserve pour remboursements et incidents."
    ],
    safety: "Aucune vente ou disponibilité en direct n’est consultée. Confirmez capacité, taxes, frais et politique de remboursement."
  },
  {
    id: "match-tickets",
    frSlug: "prix-billets-match",
    title: "Comparateur de prix de billets de match",
    seoTitle: "Prix billets de match Afrique : tribune, canal et pass | AfroTools",
    description: "Comparez un coût indicatif selon pays, compétition, tribune, demande, canal d’achat, quantité et valeur d’un abonnement.",
    eyebrow: "Budget jour de match",
    intro: "Testez le coût d’une sortie au stade avec des hypothèses modifiables, sans prétendre connaître le prix ou la disponibilité en direct.",
    resultLabel: "Coût estimé des billets",
    resultSummary: "Scénario selon pays, compétition, tribune, demande, canal, quantité et éventuel abonnement.",
    insights: [
      "Privilégiez les canaux officiels et vérifiez les frais avant paiement.",
      "Un revendeur peut ajouter un risque de fraude et une forte majoration.",
      "Comparez un abonnement uniquement si le nombre de matchs réellement suivis est réaliste."
    ],
    safety: "Aucun prix, stock ou revendeur en direct n’est vérifié. Achetez auprès de la billetterie ou du club officiel."
  },
  {
    id: "sports-scholarship",
    frSlug: "eligibilite-bourse-sportive",
    title: "Évaluation de préparation à une bourse sportive",
    seoTitle: "Bourse sportive : préparation NCAA, NAIA, Royaume-Uni et Canada | AfroTools",
    description: "Évaluez la préparation d’un dossier sportif selon niveau, résultats, notes, cours, vidéo, anglais, documents et calendrier.",
    eyebrow: "Dossier étudiant-athlète",
    intro: "Repérez les pièces manquantes avant de payer un intermédiaire. Le score organise le travail et ne décide pas de l’admission.",
    resultLabel: "Niveau de préparation du dossier",
    resultSummary: "Score de préparation fondé sur les informations saisies. Il ne garantit ni admission, ni recrutement, ni bourse.",
    insights: [
      "Vérifiez directement les exigences auprès de l’établissement et de l’organisme concerné.",
      "Une vidéo claire, des résultats vérifiables et des relevés complets réduisent les ambiguïtés.",
      "Ne payez jamais pour une promesse de bourse garantie."
    ],
    safety: "Aucune admissibilité officielle n’est déterminée. Ne saisissez ni identité complète ni document sensible; utilisez uniquement des indicateurs."
  },
  {
    id: "athlete-earnings",
    frSlug: "revenus-carriere-athlete",
    title: "Calculateur de revenus de carrière sportive",
    seoTitle: "Revenus carrière sportive Afrique : contrats, réserves et épargne | AfroTools",
    description: "Projetez salaire, primes, sponsoring, agent, impôts, réserve d’indisponibilité, épargne et prochain contrat d’un athlète.",
    eyebrow: "Planification de carrière",
    intro: "Modélisez une carrière courte et irrégulière en séparant revenus bruts, frais, réserves et épargne.",
    resultLabel: "Revenu net projeté sur la carrière",
    resultSummary: "Scénario financier selon contrat, croissance, sponsoring, agent, réserve fiscale, indisponibilité et épargne.",
    insights: [
      "Une réserve d’indisponibilité est un coussin financier, pas une estimation médicale du risque de blessure.",
      "Faites relire contrat, frais d’agent et obligations fiscales par des professionnels qualifiés.",
      "Utilisez plusieurs scénarios de durée de carrière et de croissance."
    ],
    safety: "Planification financière uniquement. Aucun risque de blessure, diagnostic, durée de récupération ou aptitude sportive n’est évalué."
  },
  {
    id: "gaming-pc-build",
    frSlug: "configuration-pc-gaming",
    title: "Configurateur de PC gaming pour l’Afrique",
    seoTitle: "Configuration PC gaming Afrique : budget GPU, CPU et import | AfroTools",
    description: "Répartissez un budget local entre GPU, CPU, carte mère, mémoire, stockage, alimentation, boîtier, refroidissement et périphériques.",
    eyebrow: "Budget composants",
    intro: "Transformez un budget local en configuration équilibrée après marge de distribution ou d’importation.",
    resultLabel: "Gamme de configuration recommandée",
    resultSummary: "Allocation indicative du budget après marge locale ou d’importation, usage d’occasion et périphériques.",
    insights: [
      "Conservez une alimentation de qualité et une marge thermique suffisante.",
      "Comparez garantie locale, douane et risque de transport avant d’importer.",
      "Pour un cybercafé, privilégiez durabilité et pièces faciles à remplacer."
    ],
    safety: "Les prix, stocks et performances ne sont pas en direct. Vérifiez compatibilité, garantie et consommation auprès des fabricants."
  },
  {
    id: "photo-video-pricing",
    frSlug: "prix-photo-video",
    title: "Calculateur de prix photo et vidéo",
    seoTitle: "Prix photo vidéo Afrique : tournage, montage et droits d’usage | AfroTools",
    description: "Préparez un devis photo ou vidéo avec jours de tournage, montage, équipe, matériel, livrables, déplacements, urgence et droits d’usage.",
    eyebrow: "Devis créatif",
    intro: "Protégez temps, matériel et droits d’usage en détaillant chaque poste du devis.",
    resultLabel: "Devis créatif recommandé",
    resultSummary: "Estimation de devis selon tournage, montage, équipe, matériel, livrables, déplacement, urgence et droits.",
    insights: [
      "Inscrivez la durée, le territoire et le média des droits d’usage sur le devis.",
      "Réduisez les livrables ou la portée avant de sacrifier le temps de montage.",
      "Précisez acompte, révisions incluses et frais de déplacement."
    ],
    safety: "Les références de prix sont indicatives. Confirmez droits, permis, sécurité du tournage, assurance et contrat."
  }
];

const BY_ID = Object.fromEntries(SPORTS.map((item) => [item.id, item]));
const BY_FR_SLUG = Object.fromEntries(SPORTS.map((item) => [item.frSlug, item]));

module.exports = { SPORTS, BY_ID, BY_FR_SLUG };
