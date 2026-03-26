/* AfroTools — Incoterms Engine /engines/incoterms-engine.js */
var IncotermsEngine = (function() {
  'use strict';

  function getTerm(code) {
    return INCOTERMS_DATA.terms.find(function(t){ return t.code === code; }) || null;
  }

  function getAllTerms() { return INCOTERMS_DATA.terms; }

  function getByGroup(group) {
    return INCOTERMS_DATA.terms.filter(function(t){ return t.group === group; });
  }

  function calculateCostSplit(termCode, costInputs) {
    // costInputs: object with keys matching costComponents.id, values in USD
    var sellerMatrix = INCOTERMS_DATA.sellerPaysMatrix[termCode];
    if (!sellerMatrix) return null;

    var sellerTotal = 0, buyerTotal = 0;
    var breakdown = INCOTERMS_DATA.costComponents.map(function(comp) {
      var amount = parseFloat(costInputs[comp.id]) || 0;
      var sellerPays = !!sellerMatrix[comp.id];
      if (sellerPays) sellerTotal += amount; else buyerTotal += amount;
      return { id: comp.id, label: comp.label, amount: amount, paidBy: sellerPays ? 'seller' : 'buyer' };
    });

    var total = sellerTotal + buyerTotal;
    return {
      termCode: termCode, breakdown: breakdown,
      sellerTotal: sellerTotal, buyerTotal: buyerTotal, total: total,
      sellerPct: total > 0 ? (sellerTotal / total * 100).toFixed(0) : 0,
      buyerPct: total > 0 ? (buyerTotal / total * 100).toFixed(0) : 0
    };
  }

  function compareTwoTerms(termCode1, termCode2, costInputs) {
    var r1 = calculateCostSplit(termCode1, costInputs);
    var r2 = calculateCostSplit(termCode2, costInputs);
    if (!r1 || !r2) return null;

    // Difference from buyer's perspective
    var buyerDiff = r2.buyerTotal - r1.buyerTotal;
    return {
      term1: Object.assign({}, getTerm(termCode1), { split: r1 }),
      term2: Object.assign({}, getTerm(termCode2), { split: r2 }),
      buyerDiff: buyerDiff, // positive = term2 more expensive for buyer
      sellerDiff: r2.sellerTotal - r1.sellerTotal
    };
  }

  function getDefaultCosts(fobValue) {
    // Generate typical cost estimates based on FOB value
    var fob = parseFloat(fobValue) || 10000;
    var defaults = {};
    INCOTERMS_DATA.costComponents.forEach(function(comp) {
      defaults[comp.id] = Math.round(fob * comp.typical / 100);
    });
    return defaults;
  }

  function getObservations(termCode, context) {
    // context: { isAfrican, shipmentValue, transportMode }
    var term = getTerm(termCode);
    if (!term) return [];
    var obs = [];

    if (term.africaNote) obs.push({ type: 'info', text: term.africaNote });

    // Context-specific
    if (context && context.isAfrican && termCode === 'DDP') {
      obs.push({ type: 'warn', text: 'DDP is extremely rare for African imports. Very few foreign suppliers have clearing agents in African countries. Verify the supplier\'s arrangement before agreeing to DDP terms.' });
    }
    if (context && context.transportMode === 'sea' && (termCode === 'CPT' || termCode === 'CIP' || termCode === 'FCA')) {
      obs.push({ type: 'tip', text: termCode + ' is technically designed for any transport mode — it\'s better than ' + (termCode === 'CPT' ? 'CFR' : termCode === 'CIP' ? 'CIF' : 'FOB') + ' for containerized sea cargo because risk transfers at the container terminal, not at the ship\'s rail.' });
    }
    if (termCode === 'CIF' || termCode === 'CFR') {
      obs.push({ type: 'warn', text: 'Note: Under ' + termCode + ', RISK transfers at the origin port (when goods go on board), even though the seller pays freight to your port. You are at risk during the ocean voyage.' });
    }

    return obs;
  }

  function getAfricaTopTerms() {
    return [
      { code: 'CIF', reason: 'Most common for African imports. CIF value = customs duty base in all African countries.' },
      { code: 'FOB', reason: 'Standard for African commodity exports and most procurement contracts.' },
      { code: 'FCA', reason: 'Best for containerized cargo — avoids FOB\'s technical issue with risk at ship\'s rail.' },
      { code: 'DAP', reason: 'Growing use for door delivery to Africa. Buyer handles customs.' },
      { code: 'DDP', reason: 'Rare but offered by some Chinese suppliers. Verify legitimacy of customs arrangements.' }
    ];
  }

  return { getTerm: getTerm, getAllTerms: getAllTerms, getByGroup: getByGroup, calculateCostSplit: calculateCostSplit, compareTwoTerms: compareTwoTerms, getDefaultCosts: getDefaultCosts, getObservations: getObservations, getAfricaTopTerms: getAfricaTopTerms };
})();

if (typeof module !== 'undefined') module.exports = { IncotermsEngine: IncotermsEngine };
