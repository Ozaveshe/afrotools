(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.propertyInvestmentAnalysis = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var MAX_AMOUNT = 1000000000000000;

  function amount(value, field, allowZero) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(field + ' must be a finite number.');
    if (number < 0 || number > MAX_AMOUNT || (!allowZero && number === 0)) {
      throw new RangeError(field + ' must be ' + (allowZero ? 'between 0' : 'above 0 and no more than') + ' ' + MAX_AMOUNT + '.');
    }
    return number;
  }

  function normalize(input) {
    input = input || {};
    var values = {
      purchasePrice: amount(input.purchasePrice, 'purchasePrice', false),
      buyingCosts: amount(input.buyingCosts, 'buyingCosts', true),
      improvements: amount(input.improvements, 'improvements', true),
      salePrice: amount(input.salePrice, 'salePrice', false),
      sellingCosts: amount(input.sellingCosts, 'sellingCosts', true),
      taxPaid: amount(input.taxPaid, 'taxPaid', true),
      grossRent: amount(input.grossRent, 'grossRent', true),
      vacancyLoss: amount(input.vacancyLoss, 'vacancyLoss', true),
      operatingExpenses: amount(input.operatingExpenses, 'operatingExpenses', true),
      financingCosts: amount(input.financingCosts, 'financingCosts', true),
      yearsHeld: Number(input.yearsHeld)
    };
    if (!Number.isFinite(values.yearsHeld) || values.yearsHeld < 1 / 12 || values.yearsHeld > 100) {
      throw new RangeError('yearsHeld must be between one month and 100 years.');
    }
    values.yearsHeld = Math.round(values.yearsHeld * 12) / 12;
    if (values.vacancyLoss > values.grossRent) throw new RangeError('vacancyLoss cannot exceed grossRent.');
    if (values.sellingCosts + values.taxPaid > values.salePrice) {
      throw new RangeError('sellingCosts and taxPaid together cannot exceed salePrice.');
    }
    return values;
  }

  function analyse(input) {
    var values = normalize(input);
    var propertyBasis = values.purchasePrice + values.buyingCosts + values.improvements;
    var capitalPriceChange = values.salePrice - values.purchasePrice;
    var netOperatingCashFlow = values.grossRent - values.vacancyLoss - values.operatingExpenses;
    var netSaleProceeds = values.salePrice - values.sellingCosts - values.taxPaid;
    var totalProfit = netSaleProceeds + netOperatingCashFlow - propertyBasis - values.financingCosts;
    var totalRoi = totalProfit / propertyBasis;
    var simpleAverageAnnualRoi = totalRoi / values.yearsHeld;
    var averageAnnualGrossRent = values.grossRent / values.yearsHeld;
    var averageAnnualNetOperatingCashFlow = netOperatingCashFlow / values.yearsHeld;
    var grossRentalYield = averageAnnualGrossRent / values.purchasePrice;
    var netRentalYield = averageAnnualNetOperatingCashFlow / propertyBasis;
    var totalCashOutflows = propertyBasis + values.vacancyLoss + values.operatingExpenses +
      values.financingCosts + values.sellingCosts + values.taxPaid;
    var totalCashInflows = values.salePrice + values.grossRent;

    return {
      input: values,
      propertyBasis: propertyBasis,
      capitalPriceChange: capitalPriceChange,
      netOperatingCashFlow: netOperatingCashFlow,
      netSaleProceeds: netSaleProceeds,
      totalProfit: totalProfit,
      totalRoi: totalRoi,
      simpleAverageAnnualRoi: simpleAverageAnnualRoi,
      averageAnnualGrossRent: averageAnnualGrossRent,
      averageAnnualNetOperatingCashFlow: averageAnnualNetOperatingCashFlow,
      grossRentalYield: grossRentalYield,
      netRentalYield: netRentalYield,
      totalCashOutflows: totalCashOutflows,
      totalCashInflows: totalCashInflows
    };
  }

  return {
    analyse: analyse,
    formulaParameters: {
      scope: 'Property-basis ROI analysis from user-entered entry, holding and exit amounts.',
      totalProfit: 'net sale proceeds + net operating cash flow - property basis - financing costs',
      totalRoi: 'total profit / property basis',
      simpleAverageAnnualRoi: 'total ROI / years held; not CAGR or IRR',
      grossRentalYield: 'average annual gross rent / purchase price',
      netRentalYield: 'average annual net operating cash flow / property basis',
      financeBoundary: 'Financing costs mean interest and lender fees only. Loan principal and proceeds are excluded.'
    },
    limits: { maximumAmount: MAX_AMOUNT, minimumYears: 1 / 12, maximumYears: 100 },
    roundingPolicy: {
      method: 'full-precision-then-display',
      precision: 'Calculations retain JavaScript floating-point precision; display rounding does not feed back into formulas.'
    }
  };
});
