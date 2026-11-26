(function inputPricesControllerModule(root) {
  'use strict';

  var engine = root.AfroTools && root.AfroTools.InputPricesEngine;

  function element(id) {
    return document.getElementById(id);
  }

  function format(value) {
    return root.INPUT_PRICES_PAGE_CONFIG.formatAmount(value);
  }

  function onTypeChange() {
    var type = element('inputType').value;
    element('cropField').style.display = type === 'seeds' || type === 'all' ? '' : 'none';
  }

  function fertilizerTable(result) {
    var rows = result.fertilizers.rows.map(function renderRow(row) {
      var subsidy = row.subsidizedPrice && result.input.priceMode !== 'subsidized'
        ? ' <small style="color:#16A34A;font-weight:700">(sub: ' + format(row.subsidizedPrice) + ')</small>'
        : '';
      return '<tr class="' + (row.isCheapest ? 'cheapest' : '') + '"><td>' + row.brand + subsidy +
        '<br><small style="color:#64748B">' + row.supplier + '</small></td><td>' + row.bagKg +
        'kg</td><td>' + format(row.selectedPrice) + '</td><td>' + format(row.perKg) +
        '/kg</td><td>' + format(Math.round(row.perHa)) + '</td></tr>';
    }).join('');
    return '<thead><tr><th>Product / Supplier</th><th>Bag size</th><th>Price/bag</th><th>Per kg</th><th>Per ha*</th></tr></thead><tbody>' +
      rows + '</tbody><tfoot><tr><td colspan="5" style="font-size:.7rem;color:#94a3b8;padding-top:.5rem">* Illustrative bags per hectare from the catalogue. Highlight marks the lowest listed bag price.</td></tr></tfoot>';
  }

  function seedTable(result) {
    var rows = result.seeds.rows.map(function renderRow(row) {
      var typeTag = row.type ? ' <small style="color:#0062CC">[' + row.type + ']</small>' : '';
      var pack = row.bagKg ? row.bagKg + 'kg' : row.unit || '—';
      return '<tr class="' + (row.isCheapest ? 'cheapest' : '') + '"><td>' + row.crop + ' — ' +
        row.brand + typeTag + '<br><small style="color:#64748B">' + row.supplier + '</small></td><td>' +
        pack + '</td><td>' + format(row.price) + '</td><td>' + (row.notes || '—') + '</td></tr>';
    }).join('');
    return '<thead><tr><th>Crop / Brand</th><th>Pack size</th><th>Price</th><th>Notes</th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function chemicalTable(result) {
    var rows = result.agrochemicals.groups.map(function renderGroup(group) {
      return group.rows.map(function renderRow(row) {
        return '<tr class="' + (row.isCheapestInType ? 'cheapest' : '') + '"><td>' + row.type + ' — ' +
          row.brand + '</td><td>' + row.size + '</td><td>' + format(row.price) + '</td></tr>';
      }).join('');
    }).join('');
    return '<thead><tr><th>Type / Product</th><th>Size</th><th>Price</th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function budgetSummary(result) {
    var budget = result.budget;
    var items = '';
    if (budget.fertilizerSubtotal) {
      items += '<div class="budget-item"><div class="bv">' + format(Math.round(budget.fertilizerSubtotal)) + '</div><div class="bl">Fertilizer</div></div>';
    }
    if (budget.seedSubtotal) {
      items += '<div class="budget-item"><div class="bv">' + format(Math.round(budget.seedSubtotal)) + '</div><div class="bl">Seeds</div></div>';
    }
    if (budget.agrochemicalSubtotal) {
      items += '<div class="budget-item"><div class="bv">' + format(Math.round(budget.agrochemicalSubtotal)) + '</div><div class="bl">Chemicals</div></div>';
    }
    if (budget.total) {
      items += '<div class="budget-item total"><div class="bv">' + format(Math.round(budget.total)) + '</div><div class="bl">Estimated basket</div></div>';
    }
    var lines = [];
    var fertilizer = result.fertilizers.cheapest, seed = result.seeds.cheapest, chemical = result.agrochemicals.cheapest;
    if (fertilizer) lines.push(Math.ceil(fertilizer.bagsPerHa * result.input.farmSize) + ' × ' + fertilizer.bagKg + ' kg ' + fertilizer.brand);
    if (seed) lines.push(seed.quantity === null ? 'Seed cost excluded: no matched crop and pack weight' : seed.quantity + ' × ' + seed.bagKg + ' kg ' + seed.brand);
    if (chemical) lines.push(chemical.quantity + ' × ' + chemical.size + ' ' + chemical.brand + ' (planning assumption: one pack per hectare, rounded up)');
    var comparison = budget.marketTotal === null ? '' : '<p class="saving-pill">Same products and quantities at listed market prices: ' +
      format(Math.round(budget.marketTotal)) + '. Difference with listed subsidy: ' + format(Math.round(budget.savings)) +
      ' (' + Number(budget.savingsPercent.toFixed(1)) + '%).</p>';
    return '<p>Planning basket for ' + result.input.farmSize + ' ha · catalogue dated ' + root.INPUT_PRICES.lastUpdated +
      '</p><p>' + lines.join(' · ') + '</p><div class="budget-grid">' + items + '</div>' + comparison;
  }

  function subsidyAlert(program) {
    if (!program || !program.name) return '';
    return '<div class="alert-box subsidy" style="margin-top:1rem"><span class="alert-icon">🏛️</span><div><strong>' +
      program.name + '</strong><br>' + (program.subsidyPercent
        ? program.subsidyPercent + '% discount on qualifying inputs. '
        : '') + program.eligibility + '<br><small>' + program.notes + '</small></div></div>';
  }

  function runComparison() {
    if (!engine) throw new Error('Input Prices engine is unavailable');
    var config = root.INPUT_PRICES_PAGE_CONFIG;
    var result = engine.calculate({
      countryCode: config.countryCode,
      inputType: element('inputType').value,
      crop: element('cropSel').value,
      farmSize: element('farmSize').value,
      priceMode: element('priceType').value,
    }, root.INPUT_PRICES[config.countryCode], root.INPUT_PRICES.appRates, config.engineBehavior);

    element('results').classList.add('visible');
    element('fertCard').style.display = result.visibility.fertilizers ? '' : 'none';
    element('seedCard').style.display = result.visibility.seeds ? '' : 'none';
    element('chemCard').style.display = result.visibility.agrochemicals ? '' : 'none';
    if (result.visibility.fertilizers) element('fertTable').innerHTML = fertilizerTable(result);
    if (result.visibility.seeds) element('seedTable').innerHTML = seedTable(result);
    if (result.visibility.agrochemicals) element('chemTable').innerHTML = chemicalTable(result);
    element('budgetSummary').innerHTML = budgetSummary(result);
    element('subsidyAlert').innerHTML = subsidyAlert(result.subsidyProgram);
    element('qualityTip').innerHTML = config.qualityHtml;
    root.INPUT_PRICES_LAST_RESULT = result;
    return result;
  }

  root.onTypeChange = onTypeChange;
  root.runComparison = runComparison;
  root.AfroTools.InputPricesController = {
    onTypeChange: onTypeChange,
    runComparison: runComparison,
  };
})(typeof window !== 'undefined' ? window : globalThis);
