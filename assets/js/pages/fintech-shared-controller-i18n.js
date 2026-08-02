(function (global) {
  'use strict';

  var SW_STRINGS = {
    'fixed-deposit': {
      invalid: 'Weka mtaji ulio juu ya sifuri, pamoja na riba ya mwaka na kodi ya zuio kati ya 0% na 100%.',
      principal: 'Mtaji',
      netInterest: 'Riba halisi',
      month: 'Mwezi'
    },
    'tbill-calc': {
      invalid: 'Weka thamani ya ukomavu iliyo juu ya sifuri, pamoja na kiwango kilichotajwa na kodi ya zuio kati ya 0% na 100%.',
      invalidDiscount: 'Masharti haya ya kiwango cha punguzo yanatoa bei ya ununuzi ya sifuri au hasi. Kagua kiwango na aina yake.',
      faceValue: 'Thamani ya ukomavu',
      youPay: 'Bei unayolipa'
    },
    'real-return': {
      invalid: 'Weka kiasi kilicho juu ya sifuri, pamoja na faida ya kawaida na mfumuko wa bei iliyo juu ya -100%.',
      yearShort: 'mwaka',
      yearsShort: 'miaka',
      nominal: 'Faida ya kawaida',
      inflation: 'Mfumuko wa bei',
      negative: 'Katika hali hii ya viwango visivyobadilika, faida halisi ni hasi; kiasi kinachokadiriwa kinapoteza uwezo wa kununua. Kagua kodi, ada na kipimo cha mfumuko kabla ya kutumia matokeo.',
      positiveStart: 'Faida yako halisi ni chanya kwa',
      positiveMiddle: 'Uwezo wako wa kununua unaongezeka. Baada ya',
      positiveEnd: 'itakuwa na uwezo wa kununua wa',
      today: 'kwa thamani ya leo'
    }
  };

  var STRINGS = {
    'mobile-vs-bank': {
      invalid: 'Saisissez un montant supérieur à zéro et des frais compris entre 0 % et 100 %.',
      amount: 'Montant',
      mobileQuote: 'Devis mobile money',
      bankQuote: 'Devis de virement bancaire',
      flat: 'Forfait',
      effectiveFee: 'Taux de frais effectif',
      sameEnteredCost: 'MÊME COÛT SAISI',
      cheapest: 'LE MOINS CHER',
      cheaper: 'Moins cher',
      sameCost: 'Même coût'
    },
    'fixed-deposit': {
      invalid: 'Saisissez un capital supérieur à zéro, ainsi qu’un taux annuel et un taux de retenue compris entre 0 % et 100 %.',
      principal: 'Capital',
      netInterest: 'Intérêts nets',
      month: 'Mois'
    },
    'tbill-calc': {
      invalid: 'Saisissez une valeur nominale supérieure à zéro, ainsi qu’un taux proposé et un taux de retenue compris entre 0 % et 100 %.',
      invalidDiscount: 'Ces conditions de taux d’escompte produisent un prix d’achat nul ou négatif. Vérifiez le devis et le type de taux.',
      faceValue: 'Valeur nominale',
      youPay: 'Prix payé'
    },
    'real-return': {
      invalid: 'Saisissez un montant supérieur à zéro, ainsi que des taux de rendement nominal et d’inflation supérieurs à −100 %.',
      yearShort: 'an',
      yearsShort: 'ans',
      nominal: 'Rendement nominal',
      inflation: 'Inflation',
      negative: 'Dans ce scénario à taux constants, le rendement réel est négatif : le montant projeté perd du pouvoir d’achat. Vérifiez les impôts, les frais et la mesure d’inflation avant d’utiliser le résultat.',
      positiveStart: 'Votre rendement réel est positif à',
      positiveMiddle: 'Votre pouvoir d’achat progresse. Dans',
      positiveEnd: 'aura alors le pouvoir d’achat de',
      today: 'en valeur actuelle'
    },
    'loan-shark-compare': {
      invalid: 'Saisissez un montant de prêt supérieur à zéro, un taux mensuel forfaitaire compris entre 0 % et 100 %, et un taux annuel bancaire compris entre 0 % et 1 000 %.',
      sameTotal: 'Les deux offres saisies ont le même remboursement total',
      flatCosts: 'L’offre à taux forfaitaire coûte',
      reducingCosts: 'L’offre à solde dégressif coûte',
      moreOver: 'de plus sur',
      months: 'mois',
      monthly: 'Mensualité',
      totalInterest: 'Intérêts totaux',
      effectiveAnnual: 'Taux annuel effectif',
      same: 'Identique',
      notFinite: 'Non calculable'
    },
    'microfinance-loan': {
      invalid: 'Saisissez un prêt supérieur à zéro, un taux mensuel compris entre 0 % et 100 %, des frais inférieurs au montant du prêt, et un taux de comparaison compris entre 0 % et 1 000 %.',
      flat: 'Intérêts forfaitaires',
      reducing: 'Solde dégressif',
      payments: 'mensualités',
      netProceeds: 'Produit net',
      same: 'Identique',
      more: 'de plus',
      less: 'de moins'
    },
    'digital-lending': {
      offer: 'Offre',
      invalid: 'Saisissez un montant supérieur à zéro, une durée de 1 à 3 650 jours et des remboursements totaux au moins égaux au montant reçu.',
      lowest: 'REMBOURSEMENT LE PLUS BAS'
    },
    'sacco-calc': {
      invalid: 'Saisissez une cotisation mensuelle positive, des taux compris entre 0 % et 100 %, et un multiplicateur de prêt compris entre 0 et 20.',
      year: 'an',
      years: 'ans',
      contributions: 'cotisations versées en fin de mois'
    },
    'payment-gateway': {
      invalid: 'Saisissez une valeur de transaction positive et un nombre entier de transactions mensuelles au moins égal à 1.',
      invalidQuote: 'Donnez un nom à chaque devis, un taux compris entre 0 % et 100 %, ainsi que des frais fixes et un plafond positifs ou nuls.',
      lowest: 'devis saisi le moins cher',
      monthlyFees: 'Frais mensuels',
      effectiveRate: 'Taux effectif'
    },
    'bnpl-calc': {
      invalid: 'Saisissez un prix positif, de 2 à 24 échéances entières et des frais totaux compris entre 0 % et 100 %.',
      invalidCheckout: 'Le paiement initial atteint le prix de l’article : aucun taux annuel effectif fini ne peut être calculé. Réduisez les frais ou choisissez un premier paiement dans un mois.',
      totalPayable: 'Total à payer',
      cashPrice: 'Prix au comptant',
      installment: 'Échéance',
      now: 'Maintenant',
      month: 'Mois'
    },
    'emergency-fund': {
      invalid: 'Saisissez des dépenses essentielles positives, de 1 à 24 mois entiers de couverture, une épargne positive ou nulle, une inflation de 0 % à 100 % et un horizon entier de 0 à 10 ans.',
      goalReached: 'Objectif atteint',
      months: 'mois',
      addSaving: 'Ajoutez une épargne mensuelle',
      expenses: 'mois de dépenses',
      monthly: 'Mensuel',
      inflationAdjusted: 'Objectif corrigé de l’inflation',
      year: 'an',
      years: 'ans'
    },
    'asset-finance': {
      invalid: 'Saisissez un prix positif, un apport inférieur à 100 %, un taux compris entre 0 % et 1 000 %, et un total apport plus paiement final inférieur ou égal à 100 % du prix.',
      financed: 'Montant financé',
      over: 'sur',
      months: 'mois',
      none: 'Aucun'
    },
    'b2b-payment': {
      invalid: 'Saisissez un montant positif et une fréquence mensuelle entière de 1 à 1 000.',
      invalidQuote: 'Donnez un nom à chaque devis, des taux de frais et de change compris entre 0 % et 100 %, des frais fixes positifs ou nuls et un règlement de 0 à 365 jours.',
      perTransaction: 'Par transaction',
      effectiveRate: 'Taux effectif',
      settlement: 'Règlement',
      transferFee: 'Frais de transfert',
      days: 'jours'
    },
    'bill-split': {
      person: 'Personne',
      name: 'nom',
      percentage: 'pourcentage',
      remove: 'Retirer la personne',
      invalid: 'Saisissez une addition supérieure à zéro et des frais ajoutés compris entre 0 % et 100 %.',
      keepTwo: 'Conservez au moins deux personnes dans le partage.',
      customInvalid: 'Chaque pourcentage personnalisé doit être compris entre 0 % et 100 %, et leur somme doit être exactement égale à 100 %.',
      equalShare: 'Par personne — partage égal',
      averageShare: 'Part moyenne',
      total: 'Total',
      people: 'personnes',
      ofTotal: 'du total'
    },
    'bond-yield': {
      invalid: 'Saisissez une valeur nominale et un prix positifs, un coupon compris entre 0 % et 1 000 %, et une durée produisant un nombre entier de périodes de coupon.',
      coupon: 'Coupon',
      price: 'Prix',
      ofFace: 'de la valeur nominale',
      periods: 'périodes'
    },
    'credit-score': {
      invalid: 'Choisissez une valeur valide de 0 à 100 pour chacun des cinq facteurs.',
      strongProfile: 'Profil d’auto-évaluation solide',
      mixedProfile: 'Profil d’auto-évaluation mitigé',
      reviewProfile: 'Facteurs à vérifier',
      paymentHistory: 'Historique de paiement',
      utilization: 'Utilisation du crédit',
      historyAge: 'Ancienneté du crédit',
      creditMix: 'Diversité des crédits',
      newInquiries: 'Nouvelles demandes',
      strong: 'Solide',
      mixed: 'Mitigé',
      review: 'À vérifier',
      paymentTip: 'Vérifiez les échéances, les paiements et tout arriéré indiqué dans votre rapport officiel.',
      utilizationTip: 'Comparez les soldes et plafonds du rapport actuel avec vos propres relevés.',
      ageTip: 'Un historique court n’est pas une erreur en soi ; vérifiez que les anciens comptes admissibles n’ont pas été omis.',
      mixTip: 'N’ouvrez pas un crédit uniquement pour modifier cette liste. Vérifiez plutôt que les types de comptes existants sont correctement déclarés.',
      inquiriesTip: 'Vérifiez les demandes récentes et contestez toute consultation que vous ne reconnaissez pas.',
      strongTip: 'Les choix de cette auto-évaluation sont solides. Un rapport officiel peut néanmoins contenir des erreurs ou utiliser d’autres facteurs.'
    },
    'dca-calc': {
      invalid: 'Saisissez des versements positifs ou nuls avec au moins un montant supérieur à zéro, et un rendement annuel supérieur à −100 % et inférieur ou égal à 1 000 %.',
      totalInvested: 'Total versé',
      over: 'sur',
      years: 'ans',
      lowerScenario: 'Scénario inférieur',
      enteredScenario: 'Scénario saisi',
      higherScenario: 'Scénario supérieur'
    },
    'debt-snowball': {
      debt: 'Dette',
      debtName: 'Nom de la dette',
      debtBalance: 'Solde de la dette',
      minimumPayment: 'Paiement mensuel minimum',
      annualRate: 'Taux d’intérêt annuel',
      removeDebt: 'Retirer la dette',
      invalidDebt: 'Chaque dette doit avoir un solde et un paiement minimum positifs, ainsi qu’un taux annuel compris entre 0 % et 1 000 %.',
      addDebt: 'Ajoutez au moins une dette avec un solde positif.',
      invalidExtra: 'Le paiement mensuel supplémentaire doit être positif ou nul.',
      months: 'mois',
      years: 'ans',
      notRepaid: 'Non remboursé dans un délai de 600 mois',
      modelledInterest: 'Intérêts modélisés',
      modelledTotal: 'Total payé modélisé',
      planNotRepaid: 'Au moins un plan n’est pas remboursé dans un délai de 600 mois.',
      increaseBudget: 'Augmentez le budget de paiement ou vérifiez les taux et minimums saisis.',
      avalancheSaves: 'L’avalanche économise',
      scheduledAssumption: 'dans ce modèle. La comparaison suppose que chaque paiement prévu est effectué.',
      sameInterest: 'Les intérêts modélisés sont identiques',
      displayedPrecision: 'à la précision affichée pour ces données.',
      notRepaidShort: 'Non remboursé'
    },
    'dividend-yield': {
      invalid: 'Saisissez un cours supérieur à zéro, ainsi qu’un dividende et un nombre d’actions positifs ou nuls.',
      invalidEps: 'Le bénéfice par action doit être vide ou supérieur à zéro.',
      invalidRates: 'Vérifiez les pourcentages saisis : l’impôt doit être compris entre 0 % et 100 %, et les autres taux doivent être supérieurs à −100 % et inférieurs ou égaux à 1 000 %.',
      afterTax: 'Rendement après impôt au taux saisi de',
      enteredTax: '',
      notAvailable: 'Non disponible',
      years: 'ans',
      verdictPrefix: 'Le rendement du dividende après impôt saisi est de',
      points: 'points de pourcentage',
      above: 'au-dessus',
      below: 'en dessous',
      verdictSuffix: 'du rendement de comparaison saisi. Ce calcul arithmétique ne rend pas les risques identiques et ne recommande aucune option.'
    },
    'fire-calc': {
      invalidAge: 'L’âge cible doit être supérieur à l’âge actuel.',
      invalidAmounts: 'Saisissez des dépenses actuelles, une épargne et des versements positifs ou nuls, ainsi que des dépenses de retraite supérieures à zéro.',
      invalidRates: 'Le rendement et l’inflation doivent être supérieurs à −100 % et inférieurs ou égaux à 1 000 % ; le taux de retrait doit être supérieur à 0 % et inférieur ou égal à 20 %.',
      targetSpending: 'Dépenses à la date cible',
      perMonth: 'par mois',
      realReturn: 'Scénario de rendement réel',
      year: 'an',
      years: 'ans',
      monthlyShort: 'par mois'
    },
    'invoice-factoring': {
      invalid: 'Saisissez une facture supérieure à zéro, un taux d’avance compris entre 0 % et 100 %, des frais positifs ou nuls et une durée de 1 à 3 650 jours.',
      invalidFees: 'Le total des frais saisis doit être inférieur à la valeur de la facture.',
      dayFacility: 'jours de financement',
      nonRecourse: 'modèle sans recours',
      recourse: 'modèle avec recours',
      invoice: 'Facture',
      advance: 'Avance',
      fees: 'Frais',
      reserveRelease: 'Libération de la réserve',
      totalReceived: 'Total reçu',
      annualizedProxy: 'Indicateur de coût annualisé',
      compare: 'Comparez cette offre saisie à des solutions portant sur le même montant et la même durée.',
      feeExceeds: 'Les frais dépassent la réserve de',
      askDeduction: 'Demandez donc si une partie sera déduite de l’avance.',
      reserveCovers: 'La réserve peut couvrir les frais modélisés si le débiteur paie à temps.',
      decision: 'Points de décision',
      askReserve: 'Demandez quand la réserve est libérée et si le débiteur doit être informé.',
      compareAlternatives: 'Comparez avec un découvert, un crédit fournisseur, une remise client ou l’attente du paiement.',
      localStatus: 'Scénario d’affacturage calculé localement. Aucune donnée de facture n’a été envoyée.',
      copied: 'Résumé copié.',
      downloaded: 'Fichier CSV téléchargé.',
      estimate: 'Estimation d’affacturage',
      grossAdvance: 'avance brute',
      totalFee: 'Frais totaux',
      costProxy: 'Indicateur de coût annualisé',
      summaryPrefix: 'Estimation d’affacturage : facture',
      summaryAdvance: 'avance brute',
      summaryFee: 'frais totaux',
      summaryReserve: 'libération de la réserve',
      summaryReceived: 'total reçu',
      summaryCost: 'indicateur de coût annualisé',
      verify: 'Vérifiez le recours, l’information du débiteur, le calendrier des frais, la libération de la réserve, les pénalités et la fiscalité avant de signer.'
    },
    'loan-consolidation': {
      loan: 'Prêt',
      balance: 'Solde',
      monthlyPayment: 'Paiement mensuel',
      annualRate: 'Taux annuel (%)',
      loanBalance: 'solde',
      loanPayment: 'paiement mensuel',
      loanRate: 'taux annuel',
      remove: 'Retirer le prêt',
      addOne: 'Ajoutez au moins un prêt actuel.',
      invalidLoan: 'Chaque prêt actuel doit avoir un solde et un paiement positifs, ainsi qu’un taux annuel compris entre 0 % et 1 000 %.',
      invalidAmortization: 'Chaque paiement actuel doit couvrir les intérêts mensuels et rembourser le prêt dans un délai de 600 mois.',
      invalidOffer: 'Vérifiez le taux, la durée et les frais de consolidation. Le taux doit être compris entre 0 % et 1 000 %, et les frais entre 0 % et 100 %.',
      lower: 'Remboursement total modélisé inférieur',
      higher: 'Remboursement total modélisé supérieur',
      equal: 'Remboursement total modélisé identique',
      currentTotal: 'Total actuel',
      overUpTo: 'sur une durée maximale de',
      months: 'mois',
      consolidationTotal: 'total de consolidation',
      over: 'sur',
      including: 'y compris',
      financedFee: 'de frais financés',
      sameTerm: 'Même durée',
      longer: 'de plus',
      shorter: 'de moins'
    },
    'merchant-fees': {
      invalidAmounts: 'Les ventes mensuelles et la valeur moyenne d’une transaction doivent être supérieures à zéro.',
      invalidMix: 'La répartition des paiements doit totaliser exactement 100 %. Total actuel :',
      invalidRates: 'Chaque taux de frais saisi doit être compris entre 0 % et 100 %.',
      on: 'Sur',
      monthlyRevenue: 'de chiffre d’affaires mensuel',
      blendedRate: 'taux pondéré',
      card: 'Carte ou terminal de paiement',
      mobileMoney: 'Mobile money',
      bankTransfer: 'Virement bancaire',
      cash: 'Espèces',
      method: 'Moyen',
      volume: 'Volume',
      mix: 'Répartition',
      fees: 'Frais',
      effectiveRate: 'Taux effectif',
      total: 'TOTAL'
    },
    'money-market': {
      invalid: 'Saisissez un montant supérieur à zéro et des taux annuels supérieurs à −100 % et inférieurs ou égaux à 1 000 %.',
      totalValue: 'Valeur totale',
      period: 'Période',
      days: 'jours',
      fund: 'Fonds monétaire',
      annualEffective: 'annuel effectif',
      deposit: 'Dépôt à terme',
      simpleAnnual: 'annuel simple',
      summary: 'Comparaison monétaire',
      estimatedReturn: 'de rendement estimé du fonds monétaire sur',
      daily: 'gain journalier',
      weekly: 'rendement sur sept jours',
      difference: 'écart avec le dépôt à terme',
      verify: 'Vérifiez la fiche actuelle du fonds, les frais, la liquidité, la fiscalité et le statut réglementaire avant d’investir.',
      copied: 'Copié',
      copy: 'Copier le résumé comparatif'
    },
    'net-worth': {
      itemName: 'Nom du poste',
      amount: 'Montant du poste',
      remove: 'Retirer le poste',
      invalid: 'Chaque montant d’actif et de dette doit être positif ou nul.',
      empty: 'Saisissez au moins un montant d’actif ou de dette.',
      assets: 'Actifs',
      liabilities: 'Dettes',
      ratioPrefix: 'Les dettes représentent',
      ratioSuffix: 'des actifs saisis. Ce ratio est descriptif ; il ne constitue pas un score de santé financière.',
      noAssets: 'Aucun actif saisi ; le ratio dettes-actifs n’est pas significatif.'
    },
    'pos-fees': {
      invalid: 'Vérifiez les frais et le volume : les montants ne peuvent pas être négatifs, la part des cartes doit être supérieure à 0 % et inférieure ou égale à 100 %, et les jours d’activité doivent être compris entre 1 et 31.',
      on: 'Sur',
      monthlyVolume: 'de volume mensuel par carte',
      cardAcceptance: 'd’acceptation par carte'
    },
    'property-vs-stocks': {
      invalid: 'Vérifiez les montants et scénarios. Les coûts doivent être compris entre 0 % et 100 % ; les hypothèses de rendement doivent être supérieures à −100 % et inférieures ou égales à 1 000 %.',
      propertyGain: 'Gain net après les coûts d’achat, d’exploitation et de vente saisis',
      stockGain: 'Gain en rendement total',
      included: 'Inclus'
    },
    'qr-payment': {
      invalid: 'Saisissez une valeur et un nombre de transactions positifs, de 1 à 31 jours d’activité et des frais positifs ou nuls.',
      on: 'Sur',
      monthlyVolume: 'de volume mensuel',
      transactions: 'transactions',
      qr: 'Paiement par QR',
      mobileMoney: 'Mobile money',
      card: 'Terminal ou carte',
      cash: 'Traitement des espèces',
      lowest: 'coût saisi le plus bas',
      perMonth: 'par mois',
      ofVolume: 'du volume'
    },
    'stock-portfolio': {
      holding: 'Position',
      ticker: 'symbole',
      shares: 'actions',
      buyPrice: 'prix d’achat par action',
      currentPrice: 'cours actuel par action',
      delete: 'Supprimer la position',
      invalid: 'Chaque ligne utilisée doit comporter un nombre d’actions et un prix d’achat positifs, ainsi qu’un cours actuel positif ou nul.',
      empty: 'Saisissez au moins une position complète.'
    },
    'thrift-calc': {
      invalid: 'Saisissez de 2 à 100 membres, une position comprise dans le groupe, une contribution positive et des taux annuels positifs ou nuls.',
      atMonth: 'Au mois',
      of: 'sur',
      groupTotal: 'total du groupe',
      months: 'mois',
      rotation: 'Rotation sans frais : vous versez',
      overCycle: 'sur le cycle complet et recevez la même cagnotte nominale au mois',
      timing: 'La position modifie le calendrier, pas le rendement nominal.',
      atRate: 'Avec le taux annuel effectif saisi de',
      planEnds: 'le plan de contributions atteint',
      bankEnds: 'Les mêmes versements de fin de mois au taux bancaire saisi atteignent'
    },
    'trade-credit': {
      invalid: 'Saisissez une facture positive, une échéance nette postérieure à la date d’escompte, un escompte inférieur à 100 % et un taux d’emprunt ainsi qu’un volume positifs ou nuls.',
      days: 'jours',
      payEarly: 'Coût modélisé inférieur : payer tôt',
      earlySub: 'L’escompte économisé dépasse le coût d’emprunt modélisé sur',
      earlyVerdict: 'Selon les hypothèses saisies, le paiement anticipé procure un avantage net de',
      perInvoice: 'par facture après',
      borrowingCost: 'de coût d’emprunt modélisé. Confirmez les frais du prêteur, les besoins de liquidité et les conditions du fournisseur.',
      payNet: 'Coût modélisé inférieur : payer à l’échéance nette',
      netSub: 'Le coût d’emprunt modélisé n’est pas inférieur à l’escompte économisé',
      netVerdict: 'Selon les hypothèses saisies, emprunter pour payer tôt coûte',
      versus: 'contre un escompte de',
      planning: 'Il s’agit d’une comparaison de planification, pas d’une instruction de paiement.',
      terms: 'Conditions',
      discount: 'Escompte',
      implied: 'Taux annuel implicite',
      action: 'Action',
      earlyAdvantage: 'Avantage modélisé au paiement anticipé',
      netAdvantage: 'Avantage modélisé au paiement à l’échéance'
    }
  };

  var SW_STRINGS = {
    'b2b-payment': {
      invalid: 'Weka kiasi chanya cha kutuma na idadi kamili ya malipo ya mwezi kutoka 1 hadi 1,000.',
      invalidQuote: 'Weka jina la kila ofa, asilimia za ada na FX kutoka 0% hadi 100%, ada tambarare isiyo hasi, na muda wa kupokelewa kutoka siku 0 hadi 365.',
      perTransaction: 'Kwa muamala',
      effectiveRate: 'Kiwango halisi',
      settlement: 'Muda wa kupokelewa',
      transferFee: 'Ada ya uhamisho',
      days: 'siku'
    },
    'bill-split': {
      person: 'Mtu',
      name: 'jina',
      percentage: 'asilimia',
      remove: 'Ondoa mtu',
      invalid: 'Weka bili yenye thamani zaidi ya sifuri na ada ya ziada kutoka 0% hadi 100%.',
      keepTwo: 'Baki na angalau watu wawili katika mgawanyo.',
      customInvalid: 'Kila asilimia maalum lazima iwe kutoka 0% hadi 100%, na jumla iwe 100% kamili.',
      equalShare: 'Kwa kila mtu (mgawanyo sawa)',
      averageShare: 'Wastani wa sehemu',
      total: 'Jumla',
      people: 'watu',
      ofTotal: 'ya jumla'
    },
    'sacco-calc': {
      invalid: 'Weka mchango chanya wa mwezi, viwango kutoka 0% hadi 100%, na kizidishi cha mkopo kutoka 0 hadi 20.',
      year: 'mwaka',
      years: 'miaka',
      contributions: 'michango ya mwisho wa mwezi'
    },
    'credit-score': {
      invalid: 'Chagua thamani halali kutoka 0 hadi 100 kwa kila kipengele kati ya vitano.',
      strongProfile: 'Wasifu thabiti wa kujikagua',
      mixedProfile: 'Wasifu mchanganyiko wa kujikagua',
      reviewProfile: 'Vipengele vinahitaji uhakiki',
      paymentHistory: 'Historia ya malipo',
      utilization: 'Matumizi ya kikomo cha mkopo',
      historyAge: 'Umri wa historia ya mkopo',
      creditMix: 'Mchanganyiko wa mikopo',
      newInquiries: 'Maombi mapya ya mkopo',
      strong: 'Thabiti',
      mixed: 'Mchanganyiko',
      review: 'Kagua',
      paymentTip: 'Kagua tarehe za mwisho, rekodi za malipo na madeni yaliyochelewa kwenye ripoti yako rasmi.',
      utilizationTip: 'Linganisha salio na vikomo kwenye ripoti ya sasa dhidi ya rekodi zako.',
      ageTip: 'Historia fupi si kosa yenyewe; hakikisha akaunti za zamani zinazostahili hazijaachwa kwenye ripoti.',
      mixTip: 'Usifungue mkopo ili kubadilisha orodha hii pekee. Hakikisha aina za akaunti ulizo nazo zimeripotiwa kwa usahihi.',
      inquiriesTip: 'Kagua maombi ya hivi karibuni na uliza kuhusu uchunguzi wowote usioufahamu.',
      strongTip: 'Majibu ya kujikagua yanaonekana thabiti. Ripoti rasmi bado inaweza kuwa na makosa au kutumia vipengele tofauti.'
    },
    'loan-shark-compare': {
      invalid: 'Weka kiasi cha mkopo zaidi ya sifuri, riba tambarare ya mwezi kati ya 0% na 100%, na riba ya benki kwa mwaka kati ya 0% na 1,000%.',
      sameTotal: 'Ofa ulizoingiza zina jumla sawa ya kulipa',
      flatCosts: 'Ofa ya riba tambarare inagharimu',
      reducingCosts: 'Ofa ya salio linalopungua inagharimu',
      moreOver: 'zaidi kwa muda wa',
      months: 'miezi',
      monthly: 'Kwa mwezi',
      totalInterest: 'Riba yote',
      effectiveAnnual: 'Kiwango halisi cha mwaka',
      same: 'Sawa',
      notFinite: 'Haiwezi kukokotolewa'
    },
    'microfinance-loan': {
      invalid: 'Weka mkopo zaidi ya sifuri, riba ya mwezi kati ya 0% na 100%, ada chini ya kiasi cha mkopo, na riba ya kulinganisha kati ya 0% na 1,000%.',
      flat: 'Riba tambarare',
      reducing: 'Salio linalopungua',
      payments: 'malipo',
      netProceeds: 'Kiasi halisi unachopokea',
      same: 'Sawa',
      more: 'zaidi',
      less: 'pungufu'
    },
    'digital-lending': {
      offer: 'Ofa',
      invalid: 'Weka kiasi zaidi ya sifuri, muda wa siku 1 hadi 3,650, na jumla za kulipa zisizopungua kiasi ulichopokea.',
      lowest: 'JUMLA NDOGO ZAIDI'
    },
    'bnpl-calc': {
      invalid: 'Weka bei zaidi ya sifuri, malipo kamili 2 hadi 24, na ada ya jumla kati ya 0% na 100%.',
      invalidCheckout: 'Malipo ya mwanzo ni makubwa sawa na bei ya bidhaa, kwa hiyo APR yenye kikomo haiwezi kukokotolewa. Punguza ada au chagua malipo ya kwanza baada ya mwezi mmoja.',
      totalPayable: 'Jumla ya kulipa',
      cashPrice: 'Bei taslimu',
      installment: 'Malipo',
      now: 'Sasa',
      month: 'Mwezi'
    },
    'emergency-fund': {
      invalid: 'Weka gharama muhimu zilizo zaidi ya sifuri, miezi kamili 1 hadi 24, akiba isiyo hasi, mfumuko wa bei wa 0% hadi 100%, na miaka kamili 0 hadi 10.',
      goalReached: 'Lengo limefikiwa',
      months: 'miezi',
      addSaving: 'Ongeza akiba ya kila mwezi',
      expenses: 'miezi ya gharama',
      monthly: 'Kwa mwezi',
      inflationAdjusted: 'Lengo baada ya mfumuko wa bei',
      year: 'mwaka',
      years: 'miaka'
    },
    'debt-snowball': {
      debt: 'Deni', debtName: 'Jina la deni', debtBalance: 'Salio la deni',
      minimumPayment: 'Malipo ya chini kwa mwezi', annualRate: 'Riba kwa mwaka',
      removeDebt: 'Ondoa deni',
      invalidDebt: 'Kila deni linahitaji salio na malipo ya chini yaliyo zaidi ya sifuri, pamoja na riba ya mwaka kati ya 0% na 1,000%.',
      addDebt: 'Ongeza angalau deni moja lenye salio chanya.',
      invalidExtra: 'Malipo ya ziada kwa mwezi lazima yawe sifuri au zaidi.',
      months: 'miezi', years: 'miaka',
      notRepaid: 'Halijalipwa ndani ya miezi 600',
      modelledInterest: 'Riba ya makadirio', modelledTotal: 'Jumla ya makadirio iliyolipwa',
      planNotRepaid: 'Angalau mpango mmoja haukulipa madeni ndani ya miezi 600.',
      increaseBudget: 'Ongeza bajeti ya malipo au kagua riba na malipo ya chini.',
      avalancheSaves: 'Avalanche inaokoa',
      scheduledAssumption: 'katika makadirio haya. Ulinganisho hudhani kila malipo yaliyopangwa yanafanywa.',
      sameInterest: 'Riba ya makadirio ni sawa',
      displayedPrecision: 'kwa usahihi unaoonyeshwa kwa taarifa hizi.',
      notRepaidShort: 'Halijalipwa'
    },
    'loan-consolidation': {
      loan: 'Mkopo', balance: 'Salio', monthlyPayment: 'Malipo kwa mwezi',
      annualRate: 'Riba kwa mwaka (%)', loanBalance: 'salio',
      loanPayment: 'malipo kwa mwezi', loanRate: 'riba kwa mwaka', remove: 'Ondoa mkopo',
      addOne: 'Ongeza angalau mkopo mmoja wa sasa.',
      invalidLoan: 'Kila mkopo wa sasa unahitaji salio na malipo chanya, pamoja na riba ya mwaka kati ya 0% na 1,000%.',
      invalidAmortization: 'Kila malipo ya sasa lazima yafidie riba ya mwezi na kulipa mkopo ndani ya miezi 600.',
      invalidOffer: 'Kagua riba, muda na ada ya kuunganisha. Riba lazima iwe 0% hadi 1,000% na ada 0% hadi 100%.',
      lower: 'Jumla ya makadirio ya malipo ni ndogo',
      higher: 'Jumla ya makadirio ya malipo ni kubwa',
      equal: 'Jumla ya makadirio ya malipo ni sawa',
      currentTotal: 'Jumla ya sasa', overUpTo: 'kwa hadi', months: 'miezi',
      consolidationTotal: 'jumla ya kuunganisha', over: 'kwa', including: 'ikijumuisha',
      financedFee: 'ya ada iliyofadhiliwa', sameTerm: 'Muda sawa', longer: 'zaidi', shorter: 'pungufu'
    },
    'bond-yield': {
      invalid: 'Weka thamani chanya ya uso na bei, kuponi kati ya 0% na 1,000%, na muda unaotoa idadi kamili ya vipindi vya kuponi.',
      coupon: 'Kuponi', price: 'Bei', ofFace: 'ya thamani ya uso', periods: 'vipindi'
    },
    'money-market': {
      invalid: 'Weka kiasi zaidi ya sifuri na viwango vya mwaka zaidi ya -100% na visivyozidi 1,000%.',
      totalValue: 'Thamani yote', period: 'Kipindi', days: 'siku', fund: 'Mfuko wa soko la fedha', annualEffective: 'halisi kwa mwaka',
      deposit: 'Amana ya muda', simpleAnnual: 'rahisi kwa mwaka', summary: 'Ulinganisho wa soko la fedha', estimatedReturn: 'ya mapato ya MMF kwa',
      daily: 'ongezeko la siku', weekly: 'mapato ya siku 7', difference: 'tofauti dhidi ya amana ya muda',
      verify: 'Hakiki factsheet ya sasa ya mfuko, ada, ukwasi, kodi na hali ya udhibiti kabla ya kuwekeza.', copied: 'Imenakiliwa', copy: 'Nakili muhtasari wa ulinganisho'
    },
    'invoice-factoring': {
      invalid:'Weka ankara zaidi ya sifuri, kiwango cha advance kati ya 0% na 100%, ada zisizo hasi na siku 1 hadi 3,650.',
      invalidFees:'Jumla ya ada lazima iwe chini ya thamani ya ankara.',dayFacility:'siku za ufadhili',nonRecourse:'mfumo bila recourse',recourse:'mfumo wenye recourse',invoice:'Ankara',advance:'Advance',fees:'Ada',reserveRelease:'Reserve inayotolewa',totalReceived:'Jumla inayopokelewa',annualizedProxy:'Kadirio la gharama ya mwaka',compare:'Linganisha ofa hii na njia nyingine kwa kiasi na muda sawa.',feeExceeds:'Ada inazidi reserve kwa',askDeduction:'Uliza kama sehemu itakatwa kwenye advance.',reserveCovers:'Reserve inaweza kufidia ada za makadirio iwapo mdaiwa atalipa kwa wakati.',decision:'Hatua za uamuzi',askReserve:'Uliza reserve itatolewa lini na kama mdaiwa lazima ajulishwe.',compareAlternatives:'Linganisha na overdraft, mkopo wa msambazaji, punguzo la mteja au kusubiri malipo.',localStatus:'Hali ya factoring imekokotolewa kwenye kivinjari. Hakuna data ya ankara iliyotumwa.',copied:'Muhtasari umenakiliwa.',downloaded:'Faili ya CSV imepakuliwa.',estimate:'Kadirio la factoring ya ankara',grossAdvance:'advance ghafi',totalFee:'Jumla ya ada',costProxy:'Kadirio la gharama ya mwaka',summaryPrefix:'Kadirio la factoring: ankara',summaryAdvance:'advance ghafi',summaryFee:'jumla ya ada',summaryReserve:'reserve inayotolewa',summaryReceived:'jumla inayopokelewa',summaryCost:'kadirio la gharama ya mwaka',verify:'Hakiki recourse, taarifa kwa mdaiwa, muda wa ada, kutolewa kwa reserve, adhabu na kodi kabla ya kusaini.'
    },
    'payment-gateway': {
      invalid: 'Weka thamani ya muamala zaidi ya sifuri na idadi kamili ya miamala ya mwezi isiyopungua 1.',
      invalidQuote: 'Weka jina la kila ofa, asilimia kati ya 0% na 100%, na ada tambarare pamoja na kikomo visivyo hasi.',
      lowest: 'ofa uliyoingiza yenye gharama ndogo zaidi',
      monthlyFees: 'Ada za mwezi',
      effectiveRate: 'Kiwango halisi'
    },
    'merchant-fees': {
      invalidAmounts: 'Mauzo ya mwezi na thamani ya wastani ya muamala lazima ziwe zaidi ya sifuri.',
      invalidMix: 'Mgawanyo wa malipo lazima uwe jumla ya 100%. Jumla ya sasa:',
      invalidRates: 'Kila kiwango cha ada lazima kiwe kati ya 0% na 100%.',
      on: 'Kwenye', monthlyRevenue: 'ya mapato ya mwezi', blendedRate: 'kiwango cha ada kilichochanganywa',
      card: 'Kadi au POS', mobileMoney: 'Pesa kwa simu', bankTransfer: 'Uhamisho wa benki', cash: 'Taslimu',
      method: 'Njia', volume: 'Kiasi', mix: 'Mgawanyo', fees: 'Ada', effectiveRate: 'Kiwango halisi', total: 'JUMLA'
    },
    'pos-fees': {
      invalid: 'Kagua masharti ya ada na kiasi: namba haziwezi kuwa hasi, sehemu ya kadi lazima iwe zaidi ya 0% na isizidi 100%, na siku za kazi ziwe 1 hadi 31.',
      on: 'Kwenye', monthlyVolume: 'ya kiasi cha kadi kwa mwezi', cardAcceptance: 'ya malipo kwa kadi'
    },
    'asset-finance': {
      invalid: 'Weka bei chanya, amana chini ya 100%, riba kati ya 0% na 1,000%, na jumla ya amana pamoja na balloon isiyozidi 100% ya bei.',
      financed: 'Kiasi kilichofadhiliwa', over: 'kwa', months: 'miezi', none: 'Hakuna'
    },
    'trade-credit': {
      invalid: 'Weka ankara chanya, tarehe ya mwisho baada ya tarehe ya punguzo, punguzo chini ya 100%, na riba ya kukopa pamoja na ujazo zisizo hasi.',
      days: 'siku', payEarly: 'Gharama ndogo ya makadirio: lipa mapema',
      earlySub: 'Punguzo linalookolewa linazidi gharama ya kukopa ya makadirio kwa',
      earlyVerdict: 'Kwa masharti uliyoingiza, kulipa mapema kuna faida halisi ya',
      perInvoice: 'kwa ankara baada ya', borrowingCost: 'ya gharama ya kukopa ya makadirio. Hakiki ada za mkopeshaji, ukwasi na masharti ya msambazaji.',
      payNet: 'Gharama ndogo ya makadirio: lipa tarehe ya mwisho',
      netSub: 'Gharama ya kukopa ya makadirio si ndogo kuliko punguzo',
      netVerdict: 'Kwa masharti uliyoingiza, kukopa ili kulipa mapema kunagharimu',
      versus: 'dhidi ya punguzo la', planning: 'Huu ni ulinganisho wa kupanga, si agizo la malipo.',
      terms: 'Masharti', discount: 'Punguzo', implied: 'Riba ya mwaka inayodokezwa', action: 'Hatua',
      earlyAdvantage: 'Kulipa mapema kuna faida ya makadirio', netAdvantage: 'Kulipa tarehe ya mwisho kuna faida ya makadirio'
    },
    'thrift-calc': {
      invalid: 'Weka wanachama 2–100, nafasi iliyo ndani ya kundi, mchango chanya, na viwango vya mwaka visivyo hasi.',
      atMonth: 'Mwezi wa',
      of: 'kati ya',
      groupTotal: 'Jumla ya kundi',
      months: 'miezi',
      rotation: 'Mzunguko usio na ada: unachangia',
      overCycle: 'katika mzunguko mzima na unapokea fungu lilelile kwa thamani ya kawaida mwezi wa',
      timing: 'Nafasi hubadilisha muda wa kupokea, si faida ya kawaida.',
      atRate: 'Kwa kiwango halisi cha mwaka ulichoingiza cha',
      planEnds: 'mpango wa michango unafikia',
      bankEnds: 'Michango ileile ya mwisho wa mwezi kwa kiwango cha benki ulichoingiza inafikia'
    },
    'dca-calc': {
      invalid: 'Weka michango isiyo hasi na angalau kiasi kimoja zaidi ya sifuri, pamoja na faida ya mwaka zaidi ya -100% na isiyozidi 1,000%.',
      totalInvested: 'Jumla iliyowekezwa', over: 'Kwa', years: 'miaka',
      lowerScenario: 'Hali ya chini', enteredScenario: 'Hali uliyoingiza', higherScenario: 'Hali ya juu'
    },
    'dividend-yield': {
      invalid: 'Weka bei ya hisa zaidi ya sifuri, pamoja na gawio na idadi ya hisa zisizo hasi.',
      invalidEps: 'Mapato kwa kila hisa lazima yaachwe wazi au yawe zaidi ya sifuri.',
      invalidRates: 'Kagua asilimia: kodi lazima iwe 0% hadi 100%, na viwango vingine viwe zaidi ya -100% na visizidi 1,000%.',
      afterTax: 'Mavuno baada ya kodi ya', enteredTax: ' uliyoingiza', notAvailable: 'Haipatikani', years: 'miaka',
      verdictPrefix: 'Mavuno ya gawio baada ya kodi ni', points: 'pointi za asilimia', above: 'juu ya', below: 'chini ya',
      verdictSuffix: 'mavuno ya ulinganisho uliyoingiza. Hesabu hii haifanyi hatari kuwa sawa wala kupendekeza chaguo.'
    },
    'net-worth': {
      itemName: 'Jina la kipengele', amount: 'Kiasi cha kipengele', remove: 'Ondoa kipengele',
      invalid: 'Kila kiasi cha mali na deni lazima kiwe sifuri au zaidi.',
      empty: 'Weka angalau kiasi kimoja cha mali au deni.', assets: 'Mali', liabilities: 'Madeni',
      ratioPrefix: 'Madeni ni', ratioSuffix: 'ya mali uliyoingiza. Uwiano huu ni maelezo, si alama ya afya ya kifedha.',
      noAssets: 'Hakuna mali iliyoingizwa; uwiano wa madeni kwa mali hauna maana.'
    }
  };

  function locale() {
    return String(document.documentElement.lang || '').toLowerCase().split('-')[0];
  }

  function isFrench() {
    return locale() === 'fr';
  }

  function isSwahili() {
    return locale() === 'sw';
  }

  function text(toolId, key, englishFallback) {
    var routeStrings;
    if (locale() === 'fr') routeStrings = STRINGS[toolId] || {};
    else if (locale() === 'sw') routeStrings = SW_STRINGS[toolId] || {};
    else return englishFallback;
    return Object.prototype.hasOwnProperty.call(routeStrings, key) ? routeStrings[key] : englishFallback;
  }

  global.AfroToolsFintechI18n = {
    isFrench: isFrench,
    isSwahili: isSwahili,
    text: text
  };
}(window));
