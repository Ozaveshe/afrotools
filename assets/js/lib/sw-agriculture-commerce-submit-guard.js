(function (root, install) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = install;
  else install(root);
}(typeof window === 'object' ? window : this, function installCommerceSubmitGuard(win) {
  'use strict';
  var host = win.document.querySelector('[data-sw-agriculture-app]');
  var form = host && host.querySelector('[data-commerce-submit-guard="1"]');
  if (!form) return;
  var config = win.__SW_AGRI_CONFIG__;
  var hook = win.__SW_AGRI_TEST__;
  var contracts = {
    'coffee-calculator': ['CoffeeEngine', ['gradeInfo', 'calcYield', 'qualityImprovement', 'processingCost'], 'AgroCoffeeForm', 'COFFEE_DATA'],
    'cooperative-calculator': ['CooperativeEngine', ['calculate'], 'AgroCooperativeForm'],
    'warehouse-receipt': ['WarehouseReceiptEngine', ['calculate'], 'AgroWarehouseReceiptForm', 'WAREHOUSE_RECEIPT_DATA']
  };
  var expected = config && contracts[config.id];
  var engine = expected && win.AfroTools && win.AfroTools[expected[0]];
  var helper = expected && win[expected[2]];
  // This existing hook is assigned at the controller's final statement, after
  // successful helper creation and every submit/reset/export/import binding.
  var ready = Boolean(expected && host.getAttribute('data-tool') === config.id &&
    engine && expected[1].every(function (method) { return typeof engine[method] === 'function'; }) &&
    helper && typeof helper.create === 'function' && (!expected[3] || win[expected[3]]) &&
    hook && typeof hook.run === 'function' && typeof hook.getLatest === 'function' &&
    typeof hook.report === 'function');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!ready) event.stopImmediatePropagation();
  }, true);
  var submit = form.querySelector('button[type="submit"]');
  var note = host.querySelector('[data-commerce-script-note]');
  if (ready) {
    note.hidden = true;
    submit.disabled = false;
    return;
  }
  submit.disabled = true;
  host.querySelectorAll('[data-export]').forEach(function (button) { button.disabled = true; });
  host.querySelector('[data-status]').textContent =
    'Kikokotoo hakijapakia kikamilifu. Pakia ukurasa tena ili ujaribu. Ingizo halijatumwa.';
}));
