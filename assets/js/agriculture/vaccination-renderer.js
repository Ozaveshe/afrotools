(function vaccinationRendererModule(root, factory) {
  'use strict';

  var renderer = factory();
  if (typeof module === 'object' && module.exports) module.exports = renderer;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.VaccinationRenderer = renderer;
  }
}(typeof window !== 'undefined' ? window : null, function vaccinationRendererFactory() {
  'use strict';

  function formatNumber(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 10000) return Math.round(value).toLocaleString();
    return String(Math.round(value * 10) / 10);
  }

  function element(id) {
    return document.getElementById(id);
  }

  function renderCalendarGrid(result, targetId) {
    var data = window.AfroTools.vaccinationData;
    var target = element(targetId);
    if (!target) return;

    var html = '<div class="cal-wrap"><div class="cal-header"><div class="cal-label-col">Vaccine</div>';
    data.months.forEach(function renderMonth(month, index) {
      html += '<div class="cal-month' + (index + 1 === result.currentMonth ? ' cal-now' : '') + '">'
        + month + '</div>';
    });
    html += '</div>';

    var previousAnimal = '';
    result.schedule.forEach(function renderRow(row) {
      if (row.animalType !== previousAnimal) {
        var label = row.animalType === 'goats_sheep'
          ? 'GOATS / SHEEP'
          : row.animalType === 'poultry' ? 'POULTRY' : 'CATTLE';
        html += '<div class="cal-animal-header">' + label + '</div>';
        previousAnimal = row.animalType;
      }
      html += '<div class="cal-row cal-sev-' + row.severity + (row.core ? '' : ' cal-optional') + '">'
        + '<div class="cal-label-col"><span class="cal-name">' + row.short
        + '</span><span class="cal-sev-dot"></span></div>';
      for (var month = 1; month <= 12; month += 1) {
        var scheduled = row.vaccinationMonths.indexOf(month) > -1;
        html += '<div class="cal-cell' + (month === result.currentMonth ? ' cal-now-col' : '') + '">'
          + (scheduled ? '<span class="cal-dot"></span>' : '') + '</div>';
      }
      html += '</div>';
    });
    target.innerHTML = html + '</div>';
  }

  function renderScheduleTable(result, targetId) {
    var target = element(targetId);
    if (!target) return;

    var html = '<table class="vax-table"><thead><tr><th>Vaccine</th><th>For</th>'
      + '<th>Priority</th><th>Schedule</th><th>Next Due</th><th>Gov Program</th>'
      + '</tr></thead><tbody>';
    result.schedule.forEach(function renderRow(row) {
      var dueClass = row.urgency === 'urgent'
        ? ' vax-urgent'
        : row.urgency === 'soon' ? ' vax-soon' : '';
      var frequency = row.annualDoses >= 2
        ? 'Every ' + Math.round(12 / row.annualDoses) + ' months'
        : row.id === 'brucellosis'
          ? 'Once (heifers)'
          : row.annualDoses < 1 ? 'Every ' + Math.round(1 / row.annualDoses) + ' yrs' : 'Annual';
      var dueBadge = row.urgency === 'urgent'
        ? ' <span class="due-badge">DUE</span>'
        : row.urgency === 'soon' ? ' <span class="due-badge due-soon">SOON</span>' : '';

      html += '<tr class="vax-row-' + row.severity + '">'
        + '<td><strong>' + row.name + '</strong><br><span class="vax-route">' + row.route + '</span></td>'
        + '<td>' + row.animalLabel + '</td>'
        + '<td><span class="sev-badge sev-' + row.severity + '">' + row.severity.toUpperCase() + '</span></td>'
        + '<td>' + frequency + '</td>'
        + '<td class="' + dueClass + '">' + row.nextDueLabel + dueBadge + '</td>'
        + '<td>' + (row.govCampaign
          ? '<span class="gov-badge">✓ Gov</span>'
          : '<span class="priv-badge">Private vet</span>') + '</td></tr>';
    });
    target.innerHTML = html + '</tbody></table>';
  }

  function renderCostTable(result, targetId) {
    var target = element(targetId);
    if (!target) return;

    var approximateUsd = result.costs.currency === 'USD';
    var symbol = result.costs.symbol;
    var html = '<div class="cost-summary"><div class="cost-hero"><div class="cost-total">'
      + symbol + ' ' + formatNumber(result.costs.totalAnnual)
      + '</div><div class="cost-sub">Estimated annual vaccination cost — '
      + result.herdSize.toLocaleString() + ' animals</div></div>'
      + (approximateUsd
        ? '<div class="cost-note">⚠ Approximate USD estimates — contact your local vet for exact prices</div>'
        : '<div class="cost-note">Local prices from government/private vet services</div>')
      + '<div class="cost-cards"><div class="cost-card"><div class="cost-val">'
      + symbol + ' ' + formatNumber(result.costs.perAnimal)
      + '</div><div class="cost-lbl">Per Animal/Year</div></div>';
    if (result.costs.govSavings > 0) {
      html += '<div class="cost-card cost-card-green"><div class="cost-val">'
        + symbol + ' ' + formatNumber(result.costs.govSavings)
        + '</div><div class="cost-lbl">Gov. Savings</div></div>';
    }
    html += '<div class="cost-card"><div class="cost-val">'
      + result.schedule.filter(function core(row) { return row.core; }).length
      + '</div><div class="cost-lbl">Core Vaccines</div></div></div>'
      + '<table class="cost-breakdown"><thead><tr><th>Vaccine</th><th>For</th>'
      + '<th>Per Animal</th><th>Annual Doses</th><th>Total</th><th>Gov?</th>'
      + '</tr></thead><tbody>';

    result.schedule.forEach(function renderRow(row) {
      if (row.id === 'marek') return;
      var annualDoses = row.annualDoses >= 1
        ? row.annualDoses.toFixed(0) + 'x/yr'
        : row.id === 'brucellosis' ? 'Once' : '1x/3yr';
      html += '<tr><td>' + row.short + '</td><td>' + row.animalLabel + '</td>'
        + '<td>' + row.currencySymbol + row.pricePerAnimal.toFixed(2) + '/dose</td>'
        + '<td>' + annualDoses + '</td><td><strong>' + symbol + ' '
        + formatNumber(row.totalAnnualCost) + '</strong></td><td>'
        + (row.govCampaign ? '<span class="gov-badge">Free/Subsidised</span>' : '-')
        + '</td></tr>';
    });
    target.innerHTML = html + '</tbody></table></div>';
  }

  function renderGovInfo(result, targetId) {
    var target = element(targetId);
    if (!target) return;

    var html = '<div class="gov-info-box"><h3 class="gov-info-title">'
      + '&#127963; Government Veterinary Service</h3><p class="gov-service-name">'
      + result.govInfo.service + '</p>';
    if (result.govInfo.campaigns && result.govInfo.campaigns.length) {
      html += '<h4>Annual Government Vaccination Campaigns</h4><ul class="gov-campaign-list">';
      result.govInfo.campaigns.forEach(function renderCampaign(campaign) {
        html += '<li>&#9989; ' + campaign + '</li>';
      });
      html += '</ul><p class="gov-tip">&#128161; Contact your local veterinary office to register '
        + 'your herd for these free or subsidised campaigns.</p>';
    }
    if (result.govInfo.note) html += '<div class="gov-note">ℹ ' + result.govInfo.note + '</div>';
    target.innerHTML = html + '</div>';
  }

  return {
    renderCalendarGrid: renderCalendarGrid,
    renderScheduleTable: renderScheduleTable,
    renderCostTable: renderCostTable,
    renderGovInfo: renderGovInfo
  };
}));
