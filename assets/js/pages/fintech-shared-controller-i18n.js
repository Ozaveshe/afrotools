(function (global) {
  'use strict';

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
    }
  };

  function isFrench() {
    return String(document.documentElement.lang || '').toLowerCase().split('-')[0] === 'fr';
  }

  function isSwahili() {
    return String(document.documentElement.lang || '').toLowerCase().split('-')[0] === 'sw';
  }

  function text(toolId, key, englishFallback) {
    var routeStrings = isFrench() ? (STRINGS[toolId] || {}) : (isSwahili() ? (SW_STRINGS[toolId] || {}) : {});
    return Object.prototype.hasOwnProperty.call(routeStrings, key) ? routeStrings[key] : englishFallback;
  }

  global.AfroToolsFintechI18n = {
    isFrench: isFrench,
    isSwahili: isSwahili,
    text: text
  };
}(window));
