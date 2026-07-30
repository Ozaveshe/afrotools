(function () {
  'use strict';
  var root = document.querySelector('[data-property-workflow]');
  if (!root) return;
  var form = root.querySelector('form');
  var output = root.querySelector('[data-result]');
  var download = root.querySelector('[data-action=download]');
  var tool = root.dataset.tool;
  var engine = window.AfroTools && window.AfroTools.PropertyAssumptionEngine;
  var currency = 'your currency';
  var lastText = '';
  var formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

  function money(value) {
    return currency + ' ' + formatter.format(value);
  }

  function say(text) {
    lastText = text;
    output.textContent = text;
    output.focus();
    if (download) download.hidden = tool !== 'rental-agreement' || !text;
  }

  function inputValues() {
    var input = {};
    new FormData(form).forEach(function (value, name) { input[name] = value; });
    input.checked = form.querySelectorAll('input[type=checkbox]:checked').length;
    return input;
  }

  function errorMessage(code) {
    return ({
      'agreement-required': 'Complete all fields with non-negative amounts and a positive duration.',
      'duty-range': 'Enter a positive transaction value and a rate from 0% to 100%.',
      'yield-range': 'Enter a positive property value and non-negative rent and costs.',
      'cost-range': 'Enter positive quantity and unit cost, plus non-negative fixed cost and contingency up to 100%.',
      'valuation-range': 'Enter positive area and comparable unit price, with an adjustment from 0% to 100%.',
      'affordability-range': 'Enter positive income and a planning ratio from 0% to 100%.',
      'management-range': 'Enter non-negative rent and fixed fees, with a rate from 0% to 100%.',
      'development-range': 'Enter positive expected revenue and non-negative costs.',
      'tax-range': 'Enter a positive sale amount and a tax-rate assumption from 0% to 100%.',
      'service-range': 'Enter annual shared costs, a positive number of units and reserve up to 100%.',
      'shortlet-range': 'Enter non-negative values and occupied nights from 0 to 365.',
      'commission-range': 'Enter rates from 0% to 100%.',
      'converter-range': 'Enter a non-negative measurement.',
      'diaspora-range': 'Enter positive foreign budget and exchange-rate assumptions, plus non-negative costs.',
      'offplan-range': 'Enter non-negative scenario values.',
      'unsupported-tool': 'This worksheet is not available.'
    })[code] || 'Check the entered assumptions and try again.';
  }

  function renderResult(result) {
    var boundaries = {
      'land-title-check': 'This does not verify title, ownership, encumbrances or registry status. Complete the official search and obtain qualified legal review.',
      'tenant-screening': 'This does not score or approve a tenant. Obtain consent, apply the same lawful criteria to every applicant and avoid protected-characteristic discrimination.',
      'building-permit': 'This does not confirm permit requirements or approval. Verify the current process with the responsible planning authority.'
    };

    if (result.kind === 'checklist') {
      say('Checklist progress: ' + result.checked + ' item(s) marked. ' + boundaries[tool]);
    } else if (result.kind === 'agreement') {
      say('REVIEW DRAFT — NOT LEGAL ADVICE\n\nLandlord: ' + result.landlord + '\nTenant: ' + result.tenant +
        '\nProperty: ' + result.address + '\nStart date: ' + result.start + '\nDuration entered: ' + result.duration +
        ' month(s)\nRent entered: ' + money(result.rent) + '\nDeposit entered: ' + money(result.deposit) +
        '\n\nAdd jurisdiction-specific clauses, inventories, signatures, notices and required disclosures only after qualified local review.');
    } else if (result.kind === 'duty') {
      say('Entered-assumption duty: ' + money(result.total) + '. No statutory band or exemption is supplied; confirm the current tariff and document classification with the revenue authority.');
    } else if (result.kind === 'yield') {
      say('Net annual income from your inputs: ' + money(result.netAnnual) + '. Net yield: ' + formatter.format(result.yieldPercent) + '%. No rent, vacancy or valuation forecast is supplied.');
    } else if (result.kind === 'cost') {
      say('Cost scenario from your inputs: ' + money(result.total) + '. This is not a contractor quote, bill of quantities, survey fee schedule or valuation.');
    } else if (result.kind === 'valuation') {
      say('Comparable-based scenario: ' + money(result.total) + '. This is arithmetic from one entered comparable, not an appraisal, market valuation or lending value.');
    } else if (result.kind === 'affordability') {
      say('Entered monthly rent is ' + money(result.rent) + '; your entered budget boundary is ' + money(result.boundary) +
        '. Upfront rent assumption: ' + money(result.upfront) + '. This is not landlord eligibility or financial advice.');
    } else if (result.kind === 'management') {
      say('Management-fee scenario: ' + money(result.total) + ' per entered period. Confirm scope, tax and exclusions in the manager quote.');
    } else if (result.kind === 'development') {
      say('Entered revenue less entered costs: ' + money(result.margin) + '. Cost total: ' + money(result.totalCost) + '. This is not a sales forecast, feasibility opinion, approval or valuation.');
    } else if (result.kind === 'tax') {
      say('Taxable-gain scenario: ' + money(result.gain) + '. Tax from your entered rate: ' + money(result.tax) + '. This is not a filing calculation; confirm basis, exemptions, timing and rate officially.');
    } else if (result.kind === 'service') {
      say('Annual charge per unit from your inputs: ' + money(result.perUnit) + '. This does not validate a lease, budget or allocation method.');
    } else if (result.kind === 'shortlet') {
      say('Annual net scenario: ' + money(result.netAnnual) + '. No occupancy, nightly-rate, tax or platform forecast is supplied.');
    } else if (result.kind === 'commission') {
      say('Commission scenario: ' + money(result.total) + '. Rate and tax treatment came from you; confirm the signed mandate and invoice.');
    } else if (result.kind === 'converter') {
      say(formatter.format(result.input) + ' ' + result.from + ' = ' + formatter.format(result.converted) + ' ' + result.to + '. Conversion is mathematical; local plot names and customary sizes are not standard units.');
    } else if (result.kind === 'diaspora') {
      say('Local-currency budget from your entered FX rate: ' + money(result.localBudget) + '. Entered acquisition need: ' + money(result.required) +
        '. Difference: ' + money(result.difference) + '. No live FX, title, valuation, remittance or legal verification is provided.');
    } else if (result.kind === 'offplan') {
      say('Ready entered cost: ' + money(result.ready) + '. Off-plan entered cost including carrying and delay rent: ' + money(result.offplanTotal) +
        '. Difference: ' + money(result.difference) + '. No completion, appreciation, quality or developer-performance forecast is supplied.');
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!engine) {
      say('The calculation engine is unavailable. Reload this page before continuing.');
      return;
    }
    currency = form.elements.currency ? form.elements.currency.value.trim() || 'your currency' : 'your currency';
    var result = engine.calculate(tool, inputValues());
    if (!result.ok) {
      say(errorMessage(result.code));
      return;
    }
    renderResult(result);
  });

  root.querySelector('[data-action=reset]').addEventListener('click', function () {
    form.reset();
    output.textContent = '';
    lastText = '';
    if (download) download.hidden = true;
    form.querySelector('input,select,textarea').focus();
  });

  if (download) {
    download.addEventListener('click', function () {
      if (!lastText) return;
      var blob = new Blob([lastText + '\n'], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'afrotools-rental-agreement-review-draft.txt';
      anchor.click();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    });
  }
}());
