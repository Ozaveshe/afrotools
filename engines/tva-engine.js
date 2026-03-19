/* ════════════════════════════════════════════════════════════
   TVA Engine — Francophone Africa VAT Calculator
   Supports standard + reduced rates per country
   TODO: Verify exact 2026 rates before production deployment
   ════════════════════════════════════════════════════════════ */
window.TVAEngine = {

  /* Country-specific TVA rates */
  RATES: {
    'CI': { name: "C\u00f4te d'Ivoire", currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDE8\uD83C\uDDEE', standard: 0.18, reduced: [{ rate: 0.09, label: 'R\u00e9duit (9%)' }] },
    'SN': { name: 'S\u00e9n\u00e9gal',  currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDF8\uD83C\uDDF3', standard: 0.18, reduced: [{ rate: 0.10, label: 'R\u00e9duit (10%)' }] },
    'CM': { name: 'Cameroun',   currency: 'XAF', symbol: 'FCFA', flag: '\uD83C\uDDE8\uD83C\uDDF2', standard: 0.1925, reduced: [] },
    'CD': { name: 'RD Congo',   currency: 'CDF', symbol: 'FC',   flag: '\uD83C\uDDE8\uD83C\uDDE9', standard: 0.16, reduced: [] },
    'MA': { name: 'Maroc',      currency: 'MAD', symbol: 'MAD',  flag: '\uD83C\uDDF2\uD83C\uDDE6', standard: 0.20, reduced: [{ rate: 0.14, label: 'R\u00e9duit (14%)' }, { rate: 0.10, label: 'R\u00e9duit (10%)' }, { rate: 0.07, label: 'Super r\u00e9duit (7%)' }] },
    'DZ': { name: 'Alg\u00e9rie',    currency: 'DZD', symbol: 'DA',   flag: '\uD83C\uDDE9\uD83C\uDDFF', standard: 0.19, reduced: [{ rate: 0.09, label: 'R\u00e9duit (9%)' }] },
    'TN': { name: 'Tunisie',    currency: 'TND', symbol: 'DT',   flag: '\uD83C\uDDF9\uD83C\uDDF3', standard: 0.19, reduced: [{ rate: 0.13, label: 'R\u00e9duit (13%)' }, { rate: 0.07, label: 'R\u00e9duit (7%)' }] },
    'ML': { name: 'Mali',       currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDF2\uD83C\uDDF1', standard: 0.18, reduced: [] },
    'BF': { name: 'Burkina Faso', currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDE7\uD83C\uDDEB', standard: 0.18, reduced: [] },
    'NE': { name: 'Niger',      currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDF3\uD83C\uDDEA', standard: 0.19, reduced: [] },
    'GN': { name: 'Guin\u00e9e',     currency: 'GNF', symbol: 'FG',   flag: '\uD83C\uDDEC\uD83C\uDDF3', standard: 0.18, reduced: [] },
    'CG': { name: 'Congo',      currency: 'XAF', symbol: 'FCFA', flag: '\uD83C\uDDE8\uD83C\uDDEC', standard: 0.18, reduced: [{ rate: 0.05, label: 'R\u00e9duit (5%)' }] },
    'GA': { name: 'Gabon',      currency: 'XAF', symbol: 'FCFA', flag: '\uD83C\uDDEC\uD83C\uDDE6', standard: 0.18, reduced: [{ rate: 0.10, label: 'R\u00e9duit (10%)' }] },
    'TG': { name: 'Togo',       currency: 'XOF', symbol: 'FCFA', flag: '\uD83C\uDDF9\uD83C\uDDEC', standard: 0.18, reduced: [{ rate: 0.10, label: 'R\u00e9duit (10%)' }] }
  },

  /**
   * Calculate TVA
   * @param {number} amount - Input amount
   * @param {number} rate   - TVA rate as decimal (e.g. 0.18)
   * @param {string} mode   - 'add' (HT→TTC) or 'remove' (TTC→HT)
   */
  calculate: function(amount, rate, mode) {
    mode = mode || 'add';
    if (mode === 'add') {
      var tva = amount * rate;
      return { ht: amount, tva: tva, ttc: amount + tva, rate: rate };
    } else {
      var ht = amount / (1 + rate);
      var tva = amount - ht;
      return { ht: ht, tva: tva, ttc: amount, rate: rate };
    }
  }
};
