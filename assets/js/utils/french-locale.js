/* ════════════════════════════════════════════════════════════
   French Locale Utilities — AfroTools Francophone Africa
   Shared formatting + labels for all /fr/ tool pages
   ════════════════════════════════════════════════════════════ */
window.AfroFrench = {

  /* Format number French-style: 1 500 000 */
  formatNumber: function(num, decimals) {
    decimals = decimals || 0;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },

  /* Format currency: 1 500 000 FCFA  or  15 000 MAD */
  formatCurrency: function(num, currency, decimals) {
    decimals = decimals || 0;
    var formatted = this.formatNumber(num, decimals);
    var symbols = {
      'XOF': 'FCFA', 'XAF': 'FCFA', 'MAD': 'MAD', 'DZD': 'DA',
      'TND': 'DT', 'CDF': 'FC', 'GNF': 'FG'
    };
    return formatted + '\u00A0' + (symbols[currency] || currency);
  },

  /* Shorthand: "1 500 000 FCFA" */
  fmt: function(num, currency) {
    return this.formatCurrency(Math.round(Math.abs(num)), currency);
  },

  /* Percentage */
  pct: function(rate) {
    var v = rate * 100;
    return (v % 1 === 0 ? v.toFixed(0) : parseFloat(v.toFixed(2)).toString()) + '\u00A0%';
  },

  /* Common French UI labels */
  labels: {
    grossSalary:      'Salaire brut mensuel',
    netSalary:        'Salaire net mensuel',
    annualGross:      'Salaire brut annuel',
    annualNet:        'Salaire net annuel',
    incomeTax:        'Imp\u00f4t sur le revenu',
    socialSecurity:   'Cotisations sociales',
    pension:          'Cotisation retraite',
    healthInsurance:  'Assurance maladie',
    totalDeductions:  'Total des retenues',
    effectiveRate:    'Taux effectif d\'imposition',
    calculate:        'Calculer',
    reset:            'R\u00e9initialiser',
    monthly:          'Mensuel',
    annual:           'Annuel',
    taxBrackets:      'Bar\u00e8me d\'imposition',
    results:          'R\u00e9sultats',
    downloadPDF:      'T\u00e9l\u00e9charger le PDF',
    shareResult:      'Partager le r\u00e9sultat',
    saveResult:       'Sauvegarder',
    faq:              'Questions fr\u00e9quentes',
    howItWorks:       'Comment \u00e7a marche',
    disclaimer:       'Ce calculateur fournit une estimation. Consultez un expert-comptable pour votre situation personnelle.',
    poweredBy:        'Propuls\u00e9 par AfroTools',
    tryCalculator:    'Essayez le calculateur \u2192',
    enterSalary:      'Entrez votre salaire brut mensuel',
    selectEmployment: 'Type de contrat',
    employee:         'Salari\u00e9',
    selfEmployed:     'Travailleur ind\u00e9pendant',
    civilServant:     'Fonctionnaire'
  }
};
