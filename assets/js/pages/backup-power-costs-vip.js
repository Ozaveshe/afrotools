(function () {
  'use strict';
  var form = document.getElementById('bpPlanner');
  if (!form || !window.BackupPowerCostsEngine) return;
  var resultBox = document.getElementById('bpResults');
  var status = document.getElementById('bpStatus');
  var copyNode = document.getElementById('bpLocaleCopy');
  var copy = copyNode ? JSON.parse(copyNode.textContent) : {
    updated: 'Comparison updated. Your inputs stayed in this browser.',
    invalid: 'Check the highlighted planning values.',
    copied: 'Planning summary copied.',
    copyBlocked: 'Copy was blocked. Select the result text manually.',
    downloaded: 'Text summary downloaded.',
    scenario: { generator: 'Fuel generator', battery: 'Battery / inverter', solar: 'Solar / battery' },
    lowest: 'Lowest monthly equivalent', energy: 'Backup energy', runtime: 'Monthly backup runtime', fuel: 'Generator fuel units', annual: 'Annual equivalent', note: 'Planning comparison only. Confirm sizing, safety, quotes, service life and local tariffs before purchase.'
  };
  var last = null;

  function value(name) { return form.elements[name].value; }
  function currencyCode() { return String(value('currency') || 'USD').trim().toUpperCase(); }
  function money(amount) {
    try { return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: currencyCode(), maximumFractionDigits: 2 }).format(amount); }
    catch (_) { return currencyCode() + ' ' + Number(amount).toFixed(2); }
  }
  function scenarioName(id) { return (copy.scenario && copy.scenario[id]) || id; }
  function input() {
    return {
      loadWatts: value('loadWatts'), outageHours: value('outageHours'), days: value('days'),
      fuelUsePerHour: value('fuelUsePerHour'), fuelPrice: value('fuelPrice'), generatorMaintenance: value('generatorMaintenance'),
      batterySystemCost: value('batterySystemCost'), batteryLifeMonths: value('batteryLifeMonths'), rechargeTariff: value('rechargeTariff'), roundTripEfficiency: value('roundTripEfficiency'), batteryMaintenance: value('batteryMaintenance'),
      solarSystemCost: value('solarSystemCost'), solarLifeMonths: value('solarLifeMonths'), solarMaintenance: value('solarMaintenance')
    };
  }
  function summary(result) {
    return [
      document.querySelector('h1').textContent,
      copy.energy + ': ' + result.backupEnergyKwh.toFixed(2) + ' kWh',
      scenarioName('generator') + ': ' + money(result.generatorMonthly) + ' / month',
      scenarioName('battery') + ': ' + money(result.batteryMonthly) + ' / month',
      scenarioName('solar') + ': ' + money(result.solarMonthly) + ' / month',
      copy.lowest + ': ' + scenarioName(result.lowestScenario) + ' - ' + money(result.lowestMonthly),
      copy.annual + ': ' + money(result.annualLowestEquivalent),
      copy.note
    ].join('\n');
  }
  function render(result) {
    last = result;
    resultBox.classList.add('on');
    resultBox.removeAttribute('aria-hidden');
    document.getElementById('bpLowestLabel').textContent = copy.lowest + ' — ' + scenarioName(result.lowestScenario);
    document.getElementById('bpLowest').textContent = money(result.lowestMonthly);
    document.getElementById('bpGenerator').textContent = money(result.generatorMonthly);
    document.getElementById('bpBattery').textContent = money(result.batteryMonthly);
    document.getElementById('bpSolar').textContent = money(result.solarMonthly);
    document.getElementById('bpEnergy').textContent = result.backupEnergyKwh.toFixed(2) + ' kWh';
    document.getElementById('bpRuntime').textContent = result.runtimeHours.toFixed(1) + ' h';
    document.getElementById('bpFuelUnits').textContent = result.generatorFuelUnits.toFixed(2);
    status.textContent = copy.updated;
    status.className = 'bp-status';
  }
  function fail(error) {
    last = null;
    resultBox.classList.remove('on');
    resultBox.setAttribute('aria-hidden', 'true');
    status.textContent = error && error.message ? error.message : copy.invalid;
    status.className = 'bp-status error';
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      if (!/^[A-Z]{3}$/.test(currencyCode())) throw new Error(copy.invalid);
      render(window.BackupPowerCostsEngine.calculate(input()));
    }
    catch (error) { fail(error); }
  }
  form.addEventListener('submit', calculate);
  document.getElementById('bpCopy').addEventListener('click', function () {
    if (!last) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary(last)).then(function () { status.textContent = copy.copied; }).catch(function () { status.textContent = copy.copyBlocked; });
    } else status.textContent = copy.copyBlocked;
  });
  document.getElementById('bpDownload').addEventListener('click', function () {
    if (!last) return;
    var url = URL.createObjectURL(new Blob([summary(last)], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url; link.download = 'backup-power-cost-comparison.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = copy.downloaded;
  });
  document.getElementById('bpPrint').addEventListener('click', function () { if (last) window.print(); });
  calculate();
})();
