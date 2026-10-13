(function (root, install) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = install;
  else install(root);
}(typeof window === 'object' ? window : this, function installLocalSubmitGuard(win) {
  'use strict';
  var host = win.document.querySelector('[data-sw-agriculture-app]');
  var form = host && host.querySelector('[data-local-submit-guard="1"]');
  if (!form) return;
  var config = win.__SW_AGRI_CONFIG__;
  var hook = win.__SW_AGRI_TEST__;
  var engines = {
    'planting-calendar': ['PlantingCalendarEngine', 'calculate'],
    'fertilizer-calc': ['FertilizerCalcEngine', 'calculate'],
    'farm-budget': ['FarmBudgetEngine', 'calculate'],
    'poultry-roi-calculator': ['PoultryROIEngine', 'calculate'],
    'pesticide-dosage-calculator': ['PesticideDosageEngine', 'calculate'],
    'soil-ph-calculator': ['SoilPhEngine', 'calculate'],
    'farm-size-converter': ['FarmSizeEngine', 'calculate'],
    'harvest-date-estimator': ['HarvestDateEngine', 'calculate'],
    'cocoa-tracker': ['CocoaEngine', 'calculate'],
    'storage-loss': ['StorageLossEngine', 'calculate'],
    'crop-rotation-planner': ['CropRotationEngine', 'calculate'],
    'commodity-prices': ['CommodityPriceEngine', 'calculate'],
    'agric-profit': ['AgricProfitEngine', 'calculate'],
    'crop-yield': ['CropYieldToolEngine', 'calculate'],
    'export-docs': ['ExportDocsDirectoryEngine', 'buildDirectory'],
    'tractor-calculator': ['TractorCalculatorEngine', 'calculate'],
    'crop-insurance': ['CropInsuranceHubEngine', 'calculate']
  };
  var expected = config && engines[config.id];
  var engine = expected && win.AfroTools && win.AfroTools[expected[0]];
  // The existing controller assigns this hook only after all handlers bind.
  var ready = Boolean(expected && engine && typeof engine[expected[1]] === 'function' &&
    hook && typeof hook.run === 'function' && typeof hook.getLatest === 'function' &&
    typeof hook.report === 'function');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!ready) event.stopImmediatePropagation();
  }, true);
  var submit = form.querySelector('button[type="submit"]');
  if (ready) {
    host.querySelector('[data-local-script-note]').hidden = true;
    submit.disabled = false;
    return;
  }
  submit.disabled = true;
  host.querySelectorAll('[data-export]').forEach(function (button) { button.disabled = true; });
  host.querySelector('[data-status]').textContent =
    'Kikokotoo hakijapakia kikamilifu. Pakia ukurasa tena ili ujaribu. Ingizo halijatumwa.';
}));
