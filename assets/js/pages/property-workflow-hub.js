(function () {
  'use strict';
  var form = document.getElementById('property-router');
  if (!form) return;
  var select = document.getElementById('property-need');
  var status = document.getElementById('property-router-status');
  var route = document.getElementById('property-route');
  var title = document.getElementById('property-route-title');
  var reason = document.getElementById('property-route-reason');
  var link = document.getElementById('property-route-link');
  var routes = {
    mortgage: ['Mortgage planning calculator', 'Model a fixed-rate scenario from a lender rate and costs you enter.', '/tools/mortgage-calculator/'],
    affordability: ['Mortgage budget boundary', 'Start with income, commitments and your own planning ratio before asking a lender.', '/tools/mortgage-affordability/'],
    title: ['Land title verification checklist', 'Prepare evidence and official checks; the tool does not verify ownership.', '/tools/land-title-check/'],
    transfer: ['Property transfer quote reconciler', 'Reconcile professional quotes and official charges rather than relying on a preset tariff.', '/tools/property-transfer-cost/'],
    rent: ['Rent vs Buy scenario comparison', 'Compare costs you enter without a forecast of prices or rent inflation.', '/tools/rent-vs-buy/'],
    build: ['Renovation cost calculator', 'Build a quantity-and-unit-cost scenario from contractor inputs.', '/tools/home-renovation-cost/'],
    tenant: ['Tenant screening checklist', 'Prepare a fair, consent-aware evidence checklist without a tenant score.', '/tools/tenant-screening/'],
    investment: ['Property ROI calculator', 'Calculate return from entered costs and proceeds without a valuation forecast.', '/tools/property-roi/']
  };
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var selected = routes[select.value];
    if (!selected) {
      route.hidden = true;
      status.textContent = 'Choose a decision before continuing.';
      select.focus();
      return;
    }
    title.textContent = selected[0];
    reason.textContent = selected[1];
    link.href = selected[2];
    route.hidden = false;
    status.textContent = 'Starting route selected. Review its boundaries before entering information.';
    title.focus();
  });
  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      route.hidden = true;
      status.textContent = 'Choose a decision to see one starting route.';
      select.focus();
    }, 0);
  });
  title.tabIndex = -1;
}());
