/* AfroTools — LC Fee Engine /engines/lc-fee-engine.js */
var LcFeeEngine = (function() {
  'use strict';

  var BASE_FEES = {
    issuance:    { rate: 1.5, min: 200, label: 'LC Issuance Fee' },
    confirmation:{ rate: 1.5, min: 300, label: 'Confirmation Fee' },
    negotiation: { rate: 0.5, min: 100, label: 'Document Negotiation Fee' },
    advising:    { rate: 0.2, min: 75,  label: 'Advising Bank Fee' },
    swift:       { flat: 150,           label: 'SWIFT Message Charges (×3)' },
    courier:     { flat: 100,           label: 'Document Courier Fee' }
  };

  var BANK_CHARGES = {
    NG: { issuanceRate: 1.5, confirmationRate: 2.0, marginRequirement: 100, notes: 'CBN Form M required. 100% cash cover often required by Nigerian banks. LC must be domiciled at CBN-authorised dealer bank. Very high cost.', currency: 'NGN', flag: '🇳🇬' },
    KE: { issuanceRate: 1.5, confirmationRate: 1.5, marginRequirement: 10,  notes: 'KRA may require pre-shipment inspection certificate (PVoC). Reasonable margin requirements.', currency: 'KES', flag: '🇰🇪' },
    ZA: { issuanceRate: 1.0, confirmationRate: 1.0, marginRequirement: 10,  notes: 'SARB regulations apply. Forward cover available for FX risk management. Most sophisticated LC environment in Africa.', currency: 'ZAR', flag: '🇿🇦' },
    GH: { issuanceRate: 2.0, confirmationRate: 2.0, marginRequirement: 30,  notes: 'Bank of Ghana regulations. Destination inspection often required. Higher issuance rates than East/Southern Africa.', currency: 'GHS', flag: '🇬🇭' },
    EG: { issuanceRate: 1.5, confirmationRate: 1.5, marginRequirement: 20,  notes: 'Must be opened at authorised bank. Priority banking available for essential imports. USD scarcity may affect availability.', currency: 'EGP', flag: '🇪🇬' },
    TZ: { issuanceRate: 1.5, confirmationRate: 1.5, marginRequirement: 15,  notes: 'BOT regulations. LC processing reasonable in Dar es Salaam. EAC corridors straightforward.', currency: 'TZS', flag: '🇹🇿' },
    UG: { issuanceRate: 1.5, confirmationRate: 1.8, marginRequirement: 20,  notes: 'BOU regulations. Landlocked — add transit document costs.', currency: 'UGX', flag: '🇺🇬' },
    RW: { issuanceRate: 1.2, confirmationRate: 1.5, marginRequirement: 10,  notes: 'BNR regulations. Rwanda improving LC efficiency. Low margin requirements reflect improving risk environment.', currency: 'RWF', flag: '🇷🇼' },
    MA: { issuanceRate: 1.0, confirmationRate: 1.0, marginRequirement: 10,  notes: 'BAM regulations. Most efficient North African LC environment. Morocco-EU FTA simplifies many transactions.', currency: 'MAD', flag: '🇲🇦' },
    TN: { issuanceRate: 1.2, confirmationRate: 1.2, marginRequirement: 15,  notes: 'BCT regulations. Offshore companies have simplified procedures.', currency: 'TND', flag: '🇹🇳' },
    CI: { issuanceRate: 1.5, confirmationRate: 1.8, marginRequirement: 20,  notes: 'BCEAO zone. WAEMU regulations. Regional LC market through BCEAO.', currency: 'XOF', flag: '🇨🇮' },
    SN: { issuanceRate: 1.5, confirmationRate: 1.8, marginRequirement: 20,  notes: 'BCEAO zone. Same WAEMU framework as Côte d\'Ivoire.', currency: 'XOF', flag: '🇸🇳' },
    CM: { issuanceRate: 1.5, confirmationRate: 2.0, marginRequirement: 25,  notes: 'BEAC zone (Central Africa). Higher margin requirements. Douala banking concentrated.', currency: 'XAF', flag: '🇨🇲' },
    ET: { issuanceRate: 1.5, confirmationRate: 2.0, marginRequirement: 100, notes: 'NBE regulations. National Bank controls FX tightly. Similar to Nigeria in terms of margin requirements. LC often mandatory for imports >$50,000.', currency: 'ETB', flag: '🇪🇹' },
    AO: { issuanceRate: 2.0, confirmationRate: 2.5, marginRequirement: 30,  notes: 'BNA regulations. Oil-dominated economy. FX access difficult for non-oil sectors.', currency: 'AOA', flag: '🇦🇴' }
  };

  var LC_TYPES = {
    sight:        { label: 'Sight LC', description: 'Payment on presentation of documents', tenorCostRate: 0,   tenorDays: 0   },
    usance30:     { label: 'Usance 30 days', description: 'Payment 30 days after sight', tenorCostRate: 0.5, tenorDays: 30  },
    usance60:     { label: 'Usance 60 days', description: 'Payment 60 days after sight', tenorCostRate: 1.0, tenorDays: 60  },
    usance90:     { label: 'Usance 90 days', description: 'Payment 90 days after sight', tenorCostRate: 1.5, tenorDays: 90  },
    usance120:    { label: 'Usance 120 days', description: 'Payment 120 days after sight', tenorCostRate: 2.0, tenorDays: 120 },
    usance180:    { label: 'Usance 180 days', description: 'Payment 180 days after sight', tenorCostRate: 3.0, tenorDays: 180 },
    standby:      { label: 'Standby LC', description: 'Standby LC (guarantee)', tenorCostRate: 1.0, tenorDays: 90  },
    revolving:    { label: 'Revolving LC', description: 'Revolving LC (multiple drawings)', tenorCostRate: 2.0, tenorDays: 365 },
    transferable: { label: 'Transferable LC', description: 'Transferable LC (broker trade)', tenorCostRate: 0.5, tenorDays: 30  }
  };

  var PAYMENT_METHODS = {
    lc:           { label: 'Letter of Credit', risk: 'Low', costLevel: 'High',   description: 'Bank guarantee — safest for both parties. Banks verify documents.' },
    tt_advance:   { label: 'T/T Advance (Wire)', risk: 'High (buyer)', costLevel: 'Low', description: 'Full prepayment by buyer. Maximum risk to buyer — supplier may not deliver.' },
    tt_balance:   { label: 'T/T 30% + 70% BL', risk: 'Medium', costLevel: 'Low', description: 'Deposit + balance on B/L copy. Common for trusted suppliers. Some risk.' },
    cad:          { label: 'CAD / D/P (Documents Against Payment)', risk: 'Medium', costLevel: 'Medium', description: 'Bank releases documents only against payment. No bank guarantee — just document control.' },
    dp:           { label: 'D/A (Documents Against Acceptance)', risk: 'High (buyer)', costLevel: 'Medium', description: 'Documents released against buyer\'s acceptance of a bill. Buyer can fail to pay.' },
    open_account: { label: 'Open Account', risk: 'High (seller)', costLevel: 'Lowest', description: 'Seller ships, buyer pays later. Lowest cost but maximum seller risk. Only for established relationships.' }
  };

  function calculate(params) {
    // params: { lcValue, countryCode, lcType, confirmed, amendments, includeMargin }
    var val = parseFloat(params.lcValue) || 0;
    if (val <= 0) return null;

    var country = BANK_CHARGES[params.countryCode] || BANK_CHARGES['KE'];
    var lcType  = LC_TYPES[params.lcType] || LC_TYPES['sight'];

    var issuanceFee    = Math.max(val * country.issuanceRate / 100, BASE_FEES.issuance.min);
    var confirmationFee= params.confirmed ? Math.max(val * country.confirmationRate / 100, BASE_FEES.confirmation.min) : 0;
    var negotiationFee = Math.max(val * BASE_FEES.negotiation.rate / 100, BASE_FEES.negotiation.min);
    var advisingFee    = Math.max(val * BASE_FEES.advising.rate / 100, BASE_FEES.advising.min);
    var swiftFee       = BASE_FEES.swift.flat;
    var courierFee     = BASE_FEES.courier.flat;
    var tenorCost      = val * lcType.tenorCostRate / 100;
    var amendmentFees  = (parseInt(params.amendments) || 0) * 100;
    var marginDeposit  = params.includeMargin ? val * country.marginRequirement / 100 : 0;

    var totalFees = issuanceFee + confirmationFee + negotiationFee + advisingFee + swiftFee + courierFee + tenorCost + amendmentFees;
    var feePercentage = (totalFees / val * 100).toFixed(2);
    var totalCashRequired = totalFees + marginDeposit;
    var effectiveCostOfGoods = val + totalFees;

    return {
      lcValue: val, countryCode: params.countryCode, lcType: params.lcType,
      confirmed: params.confirmed, lcTypeLabel: lcType.label, lcTypeDesc: lcType.description,
      tenorDays: lcType.tenorDays,
      breakdown: [
        { id: 'issuance',     label: 'LC Issuance Fee (' + country.issuanceRate + '%)', amount: issuanceFee,    basis: 'LC Value', note: 'Min $' + BASE_FEES.issuance.min },
        { id: 'confirmation', label: 'Confirmation Fee (' + country.confirmationRate + '%)', amount: confirmationFee, basis: 'LC Value', note: params.confirmed ? '' : 'Not applicable (unconfirmed LC)' },
        { id: 'negotiation',  label: 'Document Negotiation Fee (0.5%)', amount: negotiationFee, basis: 'LC Value', note: 'Min $' + BASE_FEES.negotiation.min },
        { id: 'advising',     label: 'Advising Bank Fee (0.2%)', amount: advisingFee, basis: 'LC Value', note: 'Min $' + BASE_FEES.advising.min },
        { id: 'swift',        label: 'SWIFT Message Charges', amount: swiftFee,    basis: 'Flat', note: '3 SWIFT messages' },
        { id: 'courier',      label: 'Document Courier', amount: courierFee,   basis: 'Flat', note: 'Courier to issuing bank' },
        { id: 'tenor',        label: 'Tenor / Usance Cost (' + lcType.tenorCostRate + '%)', amount: tenorCost,  basis: 'LC Value', note: lcType.tenorDays ? lcType.tenorDays + ' days' : 'N/A for sight LC' },
        { id: 'amendments',   label: 'Amendments (' + (parseInt(params.amendments)||0) + ' × $100)', amount: amendmentFees, basis: 'Flat per amendment', note: '' }
      ],
      totalFees: totalFees, feePercentage: feePercentage,
      marginDeposit: marginDeposit, marginNote: 'Deposit (returned when LC settled) — ' + country.marginRequirement + '% requirement',
      totalCashRequired: totalCashRequired,
      effectiveCostOfGoods: effectiveCostOfGoods,
      countryNotes: country.notes
    };
  }

  function comparePaymentMethods(lcResult) {
    if (!lcResult) return [];
    var val = lcResult.lcValue;
    return [
      { method: 'lc', label: PAYMENT_METHODS.lc.label, sellerProtection: 5, buyerProtection: 5, cost: lcResult.totalFees, costPct: lcResult.feePercentage, riskLabel: PAYMENT_METHODS.lc.risk, desc: PAYMENT_METHODS.lc.description },
      { method: 'cad', label: PAYMENT_METHODS.cad.label, sellerProtection: 3, buyerProtection: 3, cost: val * 0.003, costPct: '0.3', riskLabel: PAYMENT_METHODS.cad.risk, desc: PAYMENT_METHODS.cad.description },
      { method: 'tt_balance', label: PAYMENT_METHODS.tt_balance.label, sellerProtection: 4, buyerProtection: 2, cost: val * 0.001, costPct: '0.1', riskLabel: PAYMENT_METHODS.tt_balance.risk, desc: PAYMENT_METHODS.tt_balance.description },
      { method: 'open_account', label: PAYMENT_METHODS.open_account.label, sellerProtection: 1, buyerProtection: 5, cost: 0, costPct: '0', riskLabel: PAYMENT_METHODS.open_account.risk, desc: PAYMENT_METHODS.open_account.description }
    ];
  }

  function getObservations(result) {
    if (!result) return [];
    var obs = [];
    var pct = parseFloat(result.feePercentage);
    if (pct > 5) obs.push({ type: 'warn', text: 'LC fees of ' + result.feePercentage + '% are above average for Africa. Consider reducing by: using an unconfirmed LC if supplier is reputable, or negotiating fewer SWIFT messages.' });
    if (result.countryCode === 'NG' || result.countryCode === 'ET') obs.push({ type: 'warn', text: 'This country often requires 100% cash margin deposit — tying up ' + formatCurrency(result.marginDeposit) + ' until the LC is settled. Factor into your working capital plan.' });
    if (result.lcType && result.lcType.includes('usance')) obs.push({ type: 'info', text: 'A ' + result.lcTypeLabel + ' provides ' + result.tenorDays + ' days payment deferment — useful for cash flow, but the tenor cost adds ' + formatCurrency(LC_TYPES[result.lcType] ? result.lcValue * LC_TYPES[result.lcType].tenorCostRate / 100 : 0) + ' to your costs.' });
    if (!result.confirmed && result.lcValue > 100000) obs.push({ type: 'tip', text: 'For LCs over $100,000, consider getting the LC confirmed by a top-tier bank to reduce payment risk, especially if the issuing bank is in a high-risk country.' });
    obs.push({ type: 'info', text: 'A Standby LC is a cheaper alternative for established supplier relationships — costs ~1% vs full LC fees of ' + result.feePercentage + '%.' });
    return obs;
  }

  function formatCurrency(v) { return '$' + Math.round(v).toLocaleString(); }

  function getAllCountries() {
    return Object.keys(BANK_CHARGES).map(function(code) {
      return { code: code, name: code, flag: BANK_CHARGES[code].flag, marginRequirement: BANK_CHARGES[code].marginRequirement };
    });
  }

  function getLcTypes() { return LC_TYPES; }
  function getBankCharges(countryCode) { return BANK_CHARGES[countryCode] || null; }

  return { calculate: calculate, comparePaymentMethods: comparePaymentMethods, getObservations: getObservations, getAllCountries: getAllCountries, getLcTypes: getLcTypes, getBankCharges: getBankCharges };
})();

if (typeof module !== 'undefined') module.exports = { LcFeeEngine: LcFeeEngine };
