(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.PropertyAssumptionEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var AREA_IN_SQUARE_METRES = {
    sqm: 1,
    hectare: 10000,
    acre: 4046.8564224,
    sqft: 0.09290304
  };

  function number(value) {
    if (value === '' || value === null || typeof value === 'undefined') return NaN;
    return Number(value);
  }

  function numbers(input, names) {
    return names.map(function (name) { return number(input[name]); });
  }

  function valid(values) {
    return values.every(function (value) {
      return Number.isFinite(value) && value >= 0;
    });
  }

  function fail(code) {
    return { ok: false, code: code };
  }

  function calculate(tool, input) {
    var values;
    var result;

    if (['land-title-check', 'tenant-screening', 'building-permit'].includes(tool)) {
      return {
        ok: true,
        kind: 'checklist',
        checked: Math.max(0, Number(input.checked) || 0)
      };
    }

    if (tool === 'rental-agreement') {
      values = numbers(input, ['rent', 'deposit', 'duration']);
      if (!input.landlord || !input.tenant || !input.address || !input.start ||
          !valid(values) || values[2] === 0) return fail('agreement-required');
      return {
        ok: true,
        kind: 'agreement',
        landlord: String(input.landlord),
        tenant: String(input.tenant),
        address: String(input.address),
        start: String(input.start),
        duration: values[2],
        rent: values[0],
        deposit: values[1]
      };
    }

    if (tool === 'stamp-duty') {
      values = numbers(input, ['value', 'rate', 'fixed']);
      if (!valid(values) || values[0] === 0 || values[1] > 100) return fail('duty-range');
      return { ok: true, kind: 'duty', total: values[0] * values[1] / 100 + values[2] };
    }

    if (tool === 'rental-yield') {
      values = numbers(input, ['value', 'rent', 'costs']);
      if (!valid(values) || values[0] === 0) return fail('yield-range');
      result = values[1] * 12 - values[2];
      return { ok: true, kind: 'yield', netAnnual: result, yieldPercent: result / values[0] * 100 };
    }

    if (['home-renovation-cost', 'building-materials', 'construction-budget', 'survey-cost'].includes(tool)) {
      values = numbers(input, ['quantity', 'unitCost', 'fixed', 'contingency']);
      if (!valid(values) || values[0] === 0 || values[1] === 0 || values[3] > 100) {
        return fail('cost-range');
      }
      return {
        ok: true,
        kind: 'cost',
        total: (values[0] * values[1] + values[2]) * (1 + values[3] / 100)
      };
    }

    if (tool === 'property-valuation') {
      values = numbers(input, ['area', 'comparable', 'adjustment']);
      if (!valid(values) || values[0] === 0 || values[1] === 0 || values[2] > 100) {
        return fail('valuation-range');
      }
      return {
        ok: true,
        kind: 'valuation',
        total: values[0] * values[1] * (1 + values[2] / 100)
      };
    }

    if (tool === 'rent-affordability') {
      values = numbers(input, ['income', 'rent', 'ratio', 'advance']);
      if (!valid(values) || values[0] === 0 || values[2] > 100) return fail('affordability-range');
      return {
        ok: true,
        kind: 'affordability',
        rent: values[1],
        boundary: values[0] * values[2] / 100,
        upfront: values[1] * values[3]
      };
    }

    if (tool === 'property-mgmt-fees') {
      var detailedManagement = ['lettingMonths', 'newLets', 'renewalMonths', 'renewals', 'taxRate'].some(function (name) {
        return Object.prototype.hasOwnProperty.call(input, name);
      });

      if (!detailedManagement) {
        values = numbers(input, ['rent', 'rate', 'fixed']);
        if (!valid(values) || values[1] > 100) return fail('management-range');
        return {
          ok: true,
          kind: 'management',
          total: values[0] * values[1] / 100 + values[2]
        };
      }

      input = Object.assign({
        lettingMonths: 0,
        newLets: 0,
        renewalMonths: 0,
        renewals: 0,
        fixed: 0,
        taxRate: 0
      }, input);
      values = numbers(input, [
        'rent', 'rate', 'lettingMonths', 'newLets', 'renewalMonths',
        'renewals', 'fixed', 'taxRate'
      ]);
      if (!valid(values) || values[0] === 0 || values[1] > 100 || values[7] > 100 ||
          !Number.isInteger(values[3]) || !Number.isInteger(values[5])) {
        return fail('management-range');
      }
      var annualRent = values[0] * 12;
      var annualManagement = annualRent * values[1] / 100;
      var lettingTotal = values[0] * values[2] * values[3];
      var renewalTotal = values[0] * values[4] * values[5];
      var subtotal = annualManagement + lettingTotal + renewalTotal + values[6];
      var tax = subtotal * values[7] / 100;
      var ongoingSubtotal = annualManagement + renewalTotal + values[6];
      return {
        ok: true,
        kind: 'management',
        monthlyRent: annualRent / 12,
        annualRent: annualRent,
        rate: Number(input.rate),
        annualManagement: annualManagement,
        lettingMonths: Number(input.lettingMonths),
        newLets: Number(input.newLets),
        lettingTotal: lettingTotal,
        renewalMonths: Number(input.renewalMonths),
        renewals: Number(input.renewals),
        renewalTotal: renewalTotal,
        fixed: Number(input.fixed),
        taxRate: Number(input.taxRate),
        tax: tax,
        subtotal: subtotal,
        total: subtotal + tax,
        continuingTotal: ongoingSubtotal * (1 + values[7] / 100),
        netAnnual: annualRent - subtotal - tax,
        costSharePercent: annualRent ? (subtotal + tax) / annualRent * 100 : 0
      };
    }

    if (tool === 'dev-feasibility') {
      values = numbers(input, ['revenue', 'land', 'build', 'professional', 'finance', 'other']);
      if (!valid(values) || values[0] === 0) return fail('development-range');
      result = values.slice(1).reduce(function (sum, value) { return sum + value; }, 0);
      return {
        ok: true,
        kind: 'development',
        margin: values[0] - result,
        totalCost: result
      };
    }

    if (tool === 'property-cgt') {
      values = numbers(input, ['sale', 'basis', 'costs', 'exemption', 'rate']);
      if (!valid(values) || values[0] === 0 || values[4] > 100) return fail('tax-range');
      result = Math.max(0, values[0] - values[1] - values[2] - values[3]);
      return {
        ok: true,
        kind: 'tax',
        gain: result,
        tax: result * values[4] / 100
      };
    }

    if (tool === 'service-charge') {
      values = numbers(input, ['annual', 'units', 'reserve']);
      if (!valid(values) || values[1] === 0 || values[2] > 100) return fail('service-range');
      return {
        ok: true,
        kind: 'service',
        perUnit: values[0] * (1 + values[2] / 100) / values[1]
      };
    }

    if (tool === 'short-let-calc') {
      values = numbers(input, ['nightly', 'nights', 'expenses']);
      if (!valid(values) || values[1] > 365) return fail('shortlet-range');
      return {
        ok: true,
        kind: 'shortlet',
        netAnnual: values[0] * values[1] - values[2]
      };
    }

    if (tool === 'agent-commission') {
      values = numbers(input, ['value', 'rate', 'tax']);
      if (!valid(values) || values[1] > 100 || values[2] > 100) return fail('commission-range');
      result = values[0] * values[1] / 100;
      return {
        ok: true,
        kind: 'commission',
        total: result * (1 + values[2] / 100)
      };
    }

    if (tool === 'plot-converter') {
      values = [number(input.value)];
      if (!valid(values) || !AREA_IN_SQUARE_METRES[input.from] || !AREA_IN_SQUARE_METRES[input.to]) {
        return fail('converter-range');
      }
      return {
        ok: true,
        kind: 'converter',
        input: values[0],
        from: input.from,
        to: input.to,
        converted: values[0] * AREA_IN_SQUARE_METRES[input.from] / AREA_IN_SQUARE_METRES[input.to]
      };
    }

    if (tool === 'diaspora-property') {
      values = numbers(input, ['budget', 'fx', 'price', 'costs']);
      if (!valid(values) || values[0] === 0 || values[1] === 0) return fail('diaspora-range');
      result = values[0] * values[1];
      return {
        ok: true,
        kind: 'diaspora',
        localBudget: result,
        required: values[2] + values[3],
        difference: result - values[2] - values[3]
      };
    }

    if (tool === 'offplan-vs-ready') {
      values = numbers(input, ['ready', 'offplan', 'carrying', 'delay', 'rent']);
      if (!valid(values)) return fail('offplan-range');
      result = values[1] + values[2] + values[3] * values[4];
      return {
        ok: true,
        kind: 'offplan',
        ready: values[0],
        offplanTotal: result,
        difference: result - values[0]
      };
    }

    return fail('unsupported-tool');
  }

  return {
    calculate: calculate,
    areaInSquareMetres: AREA_IN_SQUARE_METRES
  };
}));
