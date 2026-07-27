(function () {
  'use strict';
  var root = document.querySelector('[data-property-workflow]');
  if (!root) return;
  var form = root.querySelector('form');
  var output = root.querySelector('[data-result]');
  var download = root.querySelector('[data-action=download]');
  var tool = root.dataset.tool;
  var currency = 'your currency';
  var lastText = '';
  var formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

  function n(name) {
    var field = form.elements[name];
    if (!field || field.value.trim() === '') return NaN;
    return Number(field.value);
  }
  function nums(names) {
    return names.map(n);
  }
  function valid(values) {
    return values.every(function (value) { return Number.isFinite(value) && value >= 0; });
  }
  function money(value) {
    return currency + ' ' + formatter.format(value);
  }
  function say(text) {
    lastText = text;
    output.textContent = text;
    output.focus();
    if (download) download.hidden = tool !== 'rental-agreement' || !text;
  }
  function checklist(boundary) {
    var count = form.querySelectorAll('input[type=checkbox]:checked').length;
    say('Checklist progress: ' + count + ' item(s) marked. ' + boundary);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    currency = form.elements.currency ? form.elements.currency.value.trim() || 'your currency' : 'your currency';

    if (['land-title-check', 'tenant-screening', 'building-permit'].includes(tool)) {
      var boundaries = {
        'land-title-check': 'This does not verify title, ownership, encumbrances or registry status. Complete the official search and obtain qualified legal review.',
        'tenant-screening': 'This does not score or approve a tenant. Obtain consent, apply the same lawful criteria to every applicant and avoid protected-characteristic discrimination.',
        'building-permit': 'This does not confirm permit requirements or approval. Verify the current process with the responsible planning authority.'
      };
      checklist(boundaries[tool]);
      return;
    }

    if (tool === 'rental-agreement') {
      var landlord = form.elements.landlord.value.trim(), tenant = form.elements.tenant.value.trim();
      var address = form.elements.address.value.trim(), start = form.elements.start.value;
      var rent = n('rent'), deposit = n('deposit'), duration = n('duration');
      if (!landlord || !tenant || !address || !start || !valid([rent, deposit, duration]) || duration === 0) {
        say('Complete all fields with non-negative amounts and a positive duration.');
        return;
      }
      say('REVIEW DRAFT — NOT LEGAL ADVICE\n\nLandlord: ' + landlord + '\nTenant: ' + tenant +
        '\nProperty: ' + address + '\nStart date: ' + start + '\nDuration entered: ' + duration +
        ' month(s)\nRent entered: ' + money(rent) + '\nDeposit entered: ' + money(deposit) +
        '\n\nAdd jurisdiction-specific clauses, inventories, signatures, notices and required disclosures only after qualified local review.');
      return;
    }

    var result;
    if (tool === 'stamp-duty') {
      var duty = nums(['value', 'rate', 'fixed']);
      if (!valid(duty) || duty[0] === 0 || duty[1] > 100) return say('Enter a positive transaction value and a rate from 0% to 100%.');
      result = duty[0] * duty[1] / 100 + duty[2];
      say('Entered-assumption duty: ' + money(result) + '. No statutory band or exemption is supplied; confirm the current tariff and document classification with the revenue authority.');
    } else if (tool === 'rental-yield') {
      var yieldInputs = nums(['value', 'rent', 'costs']);
      if (!valid(yieldInputs) || yieldInputs[0] === 0) return say('Enter a positive property value and non-negative rent and costs.');
      var netAnnual = yieldInputs[1] * 12 - yieldInputs[2];
      say('Net annual income from your inputs: ' + money(netAnnual) + '. Net yield: ' + formatter.format(netAnnual / yieldInputs[0] * 100) + '%. No rent, vacancy or valuation forecast is supplied.');
    } else if (['home-renovation-cost', 'building-materials', 'construction-budget', 'survey-cost'].includes(tool)) {
      var costs = nums(['quantity', 'unitCost', 'fixed', 'contingency']);
      if (!valid(costs) || costs[0] === 0 || costs[1] === 0 || costs[3] > 100) return say('Enter positive quantity and unit cost, plus non-negative fixed cost and contingency up to 100%.');
      result = (costs[0] * costs[1] + costs[2]) * (1 + costs[3] / 100);
      say('Cost scenario from your inputs: ' + money(result) + '. This is not a contractor quote, bill of quantities, survey fee schedule or valuation.');
    } else if (tool === 'property-valuation') {
      var valuation = nums(['area', 'comparable', 'adjustment']);
      if (!valid(valuation) || valuation[0] === 0 || valuation[1] === 0 || valuation[2] > 100) return say('Enter positive area and comparable unit price, with an adjustment from 0% to 100%.');
      result = valuation[0] * valuation[1] * (1 + valuation[2] / 100);
      say('Comparable-based scenario: ' + money(result) + '. This is arithmetic from one entered comparable, not an appraisal, market valuation or lending value.');
    } else if (tool === 'rent-affordability') {
      var affordability = nums(['income', 'rent', 'ratio', 'advance']);
      if (!valid(affordability) || affordability[0] === 0 || affordability[2] > 100) return say('Enter positive income and a planning ratio from 0% to 100%.');
      var limit = affordability[0] * affordability[2] / 100;
      say('Entered monthly rent is ' + money(affordability[1]) + '; your entered budget boundary is ' + money(limit) +
        '. Upfront rent assumption: ' + money(affordability[1] * affordability[3]) + '. This is not landlord eligibility or financial advice.');
    } else if (tool === 'property-mgmt-fees') {
      var management = nums(['rent', 'rate', 'fixed']);
      if (!valid(management) || management[1] > 100) return say('Enter non-negative rent and fixed fees, with a rate from 0% to 100%.');
      say('Management-fee scenario: ' + money(management[0] * management[1] / 100 + management[2]) + ' per entered period. Confirm scope, tax and exclusions in the manager quote.');
    } else if (tool === 'dev-feasibility') {
      var development = nums(['revenue', 'land', 'build', 'professional', 'finance', 'other']);
      if (!valid(development) || development[0] === 0) return say('Enter positive expected revenue and non-negative costs.');
      var totalCost = development.slice(1).reduce(function (sum, value) { return sum + value; }, 0);
      say('Entered revenue less entered costs: ' + money(development[0] - totalCost) + '. Cost total: ' + money(totalCost) + '. This is not a sales forecast, feasibility opinion, approval or valuation.');
    } else if (tool === 'property-cgt') {
      var tax = nums(['sale', 'basis', 'costs', 'exemption', 'rate']);
      if (!valid(tax) || tax[0] === 0 || tax[4] > 100) return say('Enter a positive sale amount and a tax-rate assumption from 0% to 100%.');
      var gain = Math.max(0, tax[0] - tax[1] - tax[2] - tax[3]);
      say('Taxable-gain scenario: ' + money(gain) + '. Tax from your entered rate: ' + money(gain * tax[4] / 100) + '. This is not a filing calculation; confirm basis, exemptions, timing and rate officially.');
    } else if (tool === 'service-charge') {
      var service = nums(['annual', 'units', 'reserve']);
      if (!valid(service) || service[1] === 0 || service[2] > 100) return say('Enter annual shared costs, a positive number of units and reserve up to 100%.');
      say('Annual charge per unit from your inputs: ' + money(service[0] * (1 + service[2] / 100) / service[1]) + '. This does not validate a lease, budget or allocation method.');
    } else if (tool === 'short-let-calc') {
      var shortLet = nums(['nightly', 'nights', 'expenses']);
      if (!valid(shortLet) || shortLet[1] > 365) return say('Enter non-negative values and occupied nights from 0 to 365.');
      say('Annual net scenario: ' + money(shortLet[0] * shortLet[1] - shortLet[2]) + '. No occupancy, nightly-rate, tax or platform forecast is supplied.');
    } else if (tool === 'agent-commission') {
      var commission = nums(['value', 'rate', 'tax']);
      if (!valid(commission) || commission[1] > 100 || commission[2] > 100) return say('Enter rates from 0% to 100%.');
      var baseCommission = commission[0] * commission[1] / 100;
      say('Commission scenario: ' + money(baseCommission * (1 + commission[2] / 100)) + '. Rate and tax treatment came from you; confirm the signed mandate and invoice.');
    } else if (tool === 'plot-converter') {
      var convert = n('value'), from = form.elements.from.value, to = form.elements.to.value;
      var sqm = { sqm: 1, hectare: 10000, acre: 4046.8564224, sqft: 0.09290304 };
      if (!valid([convert])) return say('Enter a non-negative measurement.');
      say(formatter.format(convert) + ' ' + from + ' = ' + formatter.format(convert * sqm[from] / sqm[to]) + ' ' + to + '. Conversion is mathematical; local plot names and customary sizes are not standard units.');
    } else if (tool === 'diaspora-property') {
      var diaspora = nums(['budget', 'fx', 'price', 'costs']);
      if (!valid(diaspora) || diaspora[0] === 0 || diaspora[1] === 0) return say('Enter positive foreign budget and exchange-rate assumptions, plus non-negative costs.');
      var localBudget = diaspora[0] * diaspora[1], required = diaspora[2] + diaspora[3];
      say('Local-currency budget from your entered FX rate: ' + money(localBudget) + '. Entered acquisition need: ' + money(required) +
        '. Difference: ' + money(localBudget - required) + '. No live FX, title, valuation, remittance or legal verification is provided.');
    } else if (tool === 'offplan-vs-ready') {
      var comparison = nums(['ready', 'offplan', 'carrying', 'delay', 'rent']);
      if (!valid(comparison)) return say('Enter non-negative scenario values.');
      var offplanTotal = comparison[1] + comparison[2] + comparison[3] * comparison[4];
      say('Ready entered cost: ' + money(comparison[0]) + '. Off-plan entered cost including carrying and delay rent: ' + money(offplanTotal) +
        '. Difference: ' + money(offplanTotal - comparison[0]) + '. No completion, appreciation, quality or developer-performance forecast is supplied.');
    }
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
