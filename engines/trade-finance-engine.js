var TradeFinanceEngine = (function () {
  'use strict';

  /* ── helpers ─────────────────────────────────────────── */
  function fmt(n, dp) { return Number(n).toFixed(dp === undefined ? 2 : dp); }
  function pct(val, total) { return total ? fmt(val / total * 100) : '0.00'; }

  /* ── calculate cost for a specific instrument ─────────── */
  function calculate(params) {
    var instrumentId = params.instrumentId || 'lc_sight';
    var tradeValue   = parseFloat(params.tradeValue) || 100000;
    var countryCode  = params.countryCode || 'KE';
    var tenorDays    = parseInt(params.tenorDays) || 0;
    var confirmed    = params.confirmed !== false;

    var inst   = TradeFinanceData.getById(instrumentId);
    if (!inst) return null;
    var costs  = TradeFinanceData.getCountryCosts(instrumentId, countryCode) || {};
    var result = { instrumentId: instrumentId, tradeValue: tradeValue, countryCode: countryCode, breakdown: [], totalFee: 0, totalCost: tradeValue };

    /* ── L/C Sight ───────────────────────────────────────── */
    if (instrumentId === 'lc_sight') {
      var opening = tradeValue * ((costs.opening || 1.5) / 100);
      var conf    = confirmed ? tradeValue * ((costs.confirmation || 1.5) / 100) : 0;
      var swift   = costs.swift || 100;
      var courier = costs.courier || 75;
      var margin  = (costs.margin || 10) / 100 * tradeValue;
      result.breakdown = [
        { label: 'LC Opening Commission', amount: opening, basis: (costs.opening || 1.5) + '% of value' },
        { label: 'Confirmation Fee', amount: conf, basis: confirmed ? (costs.confirmation || 1.5) + '% of value' : 'Not selected' },
        { label: 'SWIFT Charges', amount: swift, basis: 'Flat fee' },
        { label: 'Courier / Document Handling', amount: courier, basis: 'Flat fee' }
      ];
      result.marginRequired = margin;
      result.marginNote = (costs.margin || 10) + '% cash margin required upfront';
      if (costs.notes) result.countryNote = costs.notes;
      result.totalFee = opening + conf + swift + courier;
    }

    /* ── L/C Usance ──────────────────────────────────────── */
    else if (instrumentId === 'lc_usance') {
      if (tenorDays < 30) tenorDays = 90;
      var opening2 = tradeValue * ((costs.opening || 1.5) / 100);
      var conf2    = confirmed ? tradeValue * ((costs.confirmation || 1.5) / 100) : 0;
      var swift2   = costs.swift || 100;
      var usanceAmt = tradeValue * ((costs.usanceRate || 5.0) / 100) * (tenorDays / 365);
      result.breakdown = [
        { label: 'LC Opening Commission', amount: opening2, basis: (costs.opening || 1.5) + '% of value' },
        { label: 'Usance / Acceptance Fee', amount: usanceAmt, basis: fmt(costs.usanceRate || 5.0) + '% p.a. × ' + tenorDays + ' days' },
        { label: 'Confirmation Fee', amount: conf2, basis: confirmed ? (costs.confirmation || 1.5) + '% of value' : 'N/A' },
        { label: 'SWIFT Charges', amount: swift2, basis: 'Flat fee' }
      ];
      result.marginRequired = (costs.margin || 10) / 100 * tradeValue;
      result.tenorDays = tenorDays;
      result.totalFee = opening2 + usanceAmt + conf2 + swift2;
    }

    /* ── T/T Advance ─────────────────────────────────────── */
    else if (instrumentId === 'tt_advance') {
      var flat   = costs.flatFee || 40;
      var fxMgn  = tradeValue * ((costs.fxMargin || 2.0) / 100);
      result.breakdown = [
        { label: 'Wire Transfer Fee', amount: flat, basis: 'Flat fee (bank charge)' },
        { label: 'FX Margin / Spread', amount: fxMgn, basis: (costs.fxMargin || 2.0) + '% on FX conversion' }
      ];
      result.riskWarning = 'HIGH RISK: Payment before goods shipped — no recourse if supplier defaults.';
      result.totalFee = flat + fxMgn;
    }

    /* ── CAD ─────────────────────────────────────────────── */
    else if (instrumentId === 'cad') {
      var colFee  = Math.max(tradeValue * ((costs.collectionFee || 0.5) / 100), costs.minFee || 75);
      var swiftC  = costs.swiftFee || 40;
      result.breakdown = [
        { label: 'Documentary Collection Fee', amount: colFee, basis: (costs.collectionFee || 0.5) + '% (min $' + (costs.minFee || 75) + ')' },
        { label: 'SWIFT / Courier Charges', amount: swiftC, basis: 'Flat fee' }
      ];
      result.totalFee = colFee + swiftC;
    }

    /* ── Open Account ────────────────────────────────────── */
    else if (instrumentId === 'open_account') {
      var bankFee2 = tradeValue * ((costs.bankFee || 0.1) / 100);
      result.breakdown = [
        { label: 'Bank Transfer Fee', amount: bankFee2, basis: (costs.bankFee || 0.1) + '% of value' }
      ];
      result.riskWarning = 'HIGH SELLER RISK: Goods shipped before payment received. Recommend trade credit insurance.';
      result.totalFee = bankFee2;
    }

    /* ── SBLC ────────────────────────────────────────────── */
    else if (instrumentId === 'sblc') {
      var annualFee2  = tradeValue * ((costs.annualFee || 2.0) / 100);
      var issuance2   = tradeValue * ((costs.issuanceFee || 0.25) / 100);
      var mrgSblc     = (costs.margin || 10) / 100 * tradeValue;
      result.breakdown = [
        { label: 'Annual Guarantee Fee', amount: annualFee2, basis: (costs.annualFee || 2.0) + '% per annum' },
        { label: 'Issuance / Setup Fee', amount: issuance2, basis: (costs.issuanceFee || 0.25) + '% one-time' }
      ];
      result.marginRequired = mrgSblc;
      result.marginNote = (costs.margin || 10) + '% cash collateral (held by bank)';
      result.totalFee = annualFee2 + issuance2;
    }

    result.totalCost  = tradeValue + result.totalFee;
    result.feePct     = pct(result.totalFee, tradeValue);
    result.instrument = inst;
    result.observations = getObservations(instrumentId, countryCode, tradeValue);
    return result;
  }

  /* ── compare all 6 instruments at once ───────────────── */
  function compareAll(tradeValue, countryCode) {
    var ids = ['lc_sight', 'lc_usance', 'tt_advance', 'cad', 'open_account', 'sblc'];
    return ids.map(function (id) {
      var res = calculate({ instrumentId: id, tradeValue: tradeValue, countryCode: countryCode, tenorDays: 90 });
      return { id: id, name: TradeFinanceData.getById(id).abbreviation, totalFee: res.totalFee, feePct: res.feePct };
    });
  }

  /* ── decision advisor ────────────────────────────────── */
  function advise(answers) {
    // answers: { firstTime, smallOrder, needDeferred, intraAfrica, regular }
    if (answers.smallOrder) return { recommended: 'tt_advance', reason: 'For orders under $5,000, LC fees would be disproportionately expensive. Verify supplier first.' };
    if (answers.firstTime)  return { recommended: 'lc_sight', reason: 'First-time supplier always warrants LC protection. Bank guarantees compliant document = payment.' };
    if (answers.needDeferred) return { recommended: 'lc_usance', reason: 'Usance LC lets you receive and sell goods before payment due — built-in trade finance.' };
    if (answers.regular)    return { recommended: 'sblc', reason: 'Annual SBLC costs less per transaction than per-shipment LCs for regular monthly trade.' };
    if (answers.intraAfrica) return { recommended: 'open_account', reason: 'Intra-Africa trade with trusted partners often uses open account. Consider SBLC if new relationship.' };
    return { recommended: 'cad', reason: 'CAD is a good middle ground — lower cost than LC, more secure than T/T.' };
  }

  /* ── contextual observations ─────────────────────────── */
  function getObservations(instrumentId, countryCode, tradeValue) {
    var obs = [];
    if (instrumentId === 'lc_sight') {
      if (countryCode === 'NG') {
        obs.push('🇳🇬 Nigeria: CBN requires Form M application before opening any LC. 100% cash margin is standard at most Nigerian banks.');
        if (tradeValue >= 500000) obs.push('⚠️ Nigerian importers are required to use LC for imports above $500,000 — this is mandatory.');
      }
      if (countryCode === 'GH') obs.push('🇬🇭 Ghana: Bank of Ghana\'s import monitoring may require additional forms for large LC values.');
      obs.push('💡 Request a confirmed LC when the issuing bank is in a higher-risk country — confirmation shifts payment risk to the confirming bank.');
    }
    if (instrumentId === 'lc_usance') {
      obs.push('⏳ Usance LCs are effectively a trade credit tool. The seller bears financing cost, often adding it to the goods price.');
      obs.push('💡 Compare the usance cost to a local short-term loan rate — often the LC financing is cheaper than bank overdraft.');
    }
    if (instrumentId === 'tt_advance') {
      obs.push('⚠️ T/T Advance is the riskiest method for buyers. Always verify supplier via trade reference, website, and ideally an inspection visit.');
      obs.push('💡 For China-Africa trade, use Alibaba Trade Assurance or a freight forwarder inspection service before sending T/T.');
    }
    if (instrumentId === 'open_account') {
      obs.push('🌍 Open Account is increasingly viable for intra-Africa trade with AfCFTA. Trade credit insurance from African Trade Insurance (ATI) can protect against buyer default.');
    }
    if (instrumentId === 'sblc') {
      obs.push('🛡️ SBLC is a "back-pocket" guarantee — it\'s only drawn if the buyer fails to pay. Day-to-day trade continues on open account terms.');
    }
    return obs;
  }

  return {
    calculate: calculate,
    compareAll: compareAll,
    advise: advise,
    getObservations: getObservations
  };
})();
