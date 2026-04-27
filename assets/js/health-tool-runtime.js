(function () {
  'use strict';

  var CONFIG = window.HEALTH_TOOL_CONFIG || {};
  var root = document.getElementById('health-app-root');
  if (!root || !CONFIG.type) return;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function num(id, fallback) {
    var el = document.getElementById(id);
    var value = el ? Number(el.value) : NaN;
    return Number.isFinite(value) ? value : fallback;
  }

  function text(id, fallback) {
    var el = document.getElementById(id);
    return el && el.value ? el.value : fallback;
  }

  function fmt(value, currency) {
    var amount = Number(value) || 0;
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }) + (currency ? ' ' + currency : '');
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function addDays(date, days) {
    var copy = new Date(date.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function dateValue(id) {
    var raw = text(id, '');
    return raw ? new Date(raw + 'T00:00:00') : new Date();
  }

  function fieldAttrs(field) {
    var type = field.type || 'number';
    var attrs = [
      'id="' + esc(field.id) + '"',
      'name="' + esc(field.id) + '"',
      'type="' + esc(type) + '"',
      'aria-label="' + esc(field.label || field.id) + '"'
    ];
    if (field.required !== false) attrs.push('required');
    if (type === 'number') attrs.push('inputmode="decimal"');
    if (field.value != null) attrs.push('value="' + esc(field.value) + '"');
    if (field.min != null) attrs.push('min="' + esc(field.min) + '"');
    if (field.max != null) attrs.push('max="' + esc(field.max) + '"');
    attrs.push('step="' + esc(field.step || '1') + '"');
    if (field.placeholder) attrs.push('placeholder="' + esc(field.placeholder) + '"');
    return attrs.join(' ');
  }

  function renderFields(fields) {
    return '<div class="health-app-form">' + fields.map(function (field) {
      var cls = field.full ? 'health-app-field full' : 'health-app-field';
      if (field.type === 'select') {
        return '<div class="' + cls + '"><label for="' + esc(field.id) + '">' + esc(field.label) + '</label><select id="' + esc(field.id) + '" name="' + esc(field.id) + '" aria-label="' + esc(field.label || field.id) + '"' + (field.required === false ? '' : ' required') + '>' +
          (field.options || []).map(function (option) {
            var value = typeof option === 'string' ? option : option.value;
            var label = typeof option === 'string' ? option : option.label;
            return '<option value="' + esc(value) + '">' + esc(label) + '</option>';
          }).join('') + '</select></div>';
      }
      if (field.type === 'textarea') {
        return '<div class="' + cls + '"><label for="' + esc(field.id) + '">' + esc(field.label) + '</label><textarea id="' + esc(field.id) + '" name="' + esc(field.id) + '" aria-label="' + esc(field.label || field.id) + '" placeholder="' + esc(field.placeholder || '') + '"' + (field.required === false ? '' : ' required') + '>' + esc(field.value || '') + '</textarea></div>';
      }
      return '<div class="' + cls + '"><label for="' + esc(field.id) + '">' + esc(field.label) + '</label><input ' + fieldAttrs(field) + '></div>';
    }).join('') + '</div>';
  }

  function renderChecks(checks) {
    return '<div class="health-app-checks">' + checks.map(function (item, index) {
      return '<label><input type="checkbox" id="risk-' + index + '" data-weight="' + esc(item.weight || 1) + '"><span>' + esc(item.label) + '</span></label>';
    }).join('') + '</div>';
  }

  function collectFieldValues() {
    return (CONFIG.fields || []).map(function (field) {
      var el = document.getElementById(field.id);
      if (!el) return null;
      return {
        label: field.label || field.id,
        value: el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value
      };
    }).filter(function (item) { return item && item.value !== ''; });
  }

  function recordResult(snapshot) {
    if (!window.AfroHealthWorkflow || typeof window.AfroHealthWorkflow.recordSnapshot !== 'function') return;
    window.AfroHealthWorkflow.recordSnapshot(Object.assign({
      toolId: CONFIG.id || '',
      toolName: CONFIG.title || document.title.replace(/\s*\|\s*AfroTools.*/, ''),
      type: CONFIG.type || '',
      fields: collectFieldValues()
    }, snapshot || {}));
  }

  function showResult(html, snapshot) {
    var result = document.getElementById('health-app-result');
    result.innerHTML = html;
    result.classList.add('show');
    recordResult(snapshot || {
      headline: result.textContent.replace(/\s+/g, ' ').trim().slice(0, 160),
      resultText: result.textContent.replace(/\s+/g, ' ').trim().slice(0, 900)
    });
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resultCards(cards) {
    return '<div class="health-result-grid">' + cards.map(function (card) {
      return '<div class="health-result-card"><h3>' + esc(card.title) + '</h3><p>' + card.body + '</p></div>';
    }).join('') + '</div>';
  }

  function runCostEstimator() {
    var currency = text('currency', CONFIG.defaultCurrency || '');
    var base = num('baseCost', 0);
    var units = Math.max(1, num('units', 1));
    var transport = num('transport', 0);
    var addOn = num('addOn', 0);
    var coverage = Math.max(0, Math.min(100, num('coverage', 0)));
    var subtotal = base * units + transport + addOn;
    var outOfPocket = subtotal * (1 - coverage / 100);
    showResult(
      '<div class="health-result-value">' + esc(fmt(outOfPocket, currency)) + '</div>' +
      '<div class="health-result-label">Estimated out-of-pocket planning total</div>' +
      resultCards([
        { title: 'Before coverage', body: esc(fmt(subtotal, currency)) },
        { title: 'Coverage applied', body: esc(coverage + '%') },
        { title: 'Next action', body: esc(CONFIG.nextAction || 'Replace defaults with a clinic quote and confirm with a qualified health worker.') }
      ]) +
      '<p class="health-app-note">' + esc(CONFIG.note || 'This is a planning estimate, not a clinical price guarantee. Replace default values with local quotes before making a care decision.') + '</p>'
    );
  }

  function runRiskChecklist() {
    var checks = root.querySelectorAll('[data-weight]');
    var score = 0;
    var selected = 0;
    checks.forEach(function (box) {
      if (box.checked) {
        score += Number(box.getAttribute('data-weight')) || 1;
        selected += 1;
      }
    });
    var level = score >= (CONFIG.highAt || 5) ? 'Higher attention' : score >= (CONFIG.mediumAt || 2) ? 'Needs prevention steps' : 'Lower current signal';
    showResult(
      '<div class="health-result-value">' + esc(level) + '</div>' +
      '<div class="health-result-label">' + esc(selected + ' checklist items selected') + '</div>' +
      resultCards([
        { title: 'Immediate step', body: esc(CONFIG.immediateStep || 'Use the prevention checklist and contact local health services if symptoms or exposure are present.') },
        { title: 'Escalate now if', body: esc(CONFIG.escalate || 'There are severe symptoms, dehydration, bleeding, breathing difficulty, confusion, or known exposure.') },
        { title: 'Document', body: esc(CONFIG.document || 'Save the date, location, symptoms, exposure route, and any clinic instructions.') }
      ])
    );
  }

  function runScheduleTracker() {
    var start = dateValue('startDate');
    var months = Math.max(1, num('months', CONFIG.defaultMonths || 6));
    var completed = Math.max(0, num('completedDays', 0));
    var missed = Math.max(0, num('missedDoses', 0));
    var totalDays = Math.round(months * 30.44);
    var endDate = addDays(start, totalDays);
    var percent = Math.max(0, Math.min(100, Math.round((completed / totalDays) * 100)));
    var today = new Date();
    var dayOnPlan = Math.max(0, daysBetween(start, today));
    showResult(
      '<div class="health-result-value">' + esc(percent + '%') + '</div>' +
      '<div class="health-result-label">Tracker progress</div>' +
      resultCards([
        { title: 'Estimated end date', body: esc(endDate.toLocaleDateString()) },
        { title: 'Plan day', body: esc(dayOnPlan + ' of about ' + totalDays) },
        { title: 'Missed doses', body: esc(missed + ' logged. Ask your clinic how to handle any missed dose.') }
      ]) +
      '<p class="health-app-note">' + esc(CONFIG.note || 'Do not change treatment timing without a clinician. This tracker is for planning and appointment conversations only.') + '</p>'
    );
  }

  function runNutrition() {
    var weight = Math.max(35, num('weightKg', 70));
    var trimester = text('trimester', '2');
    var activity = text('activity', 'moderate');
    var extra = trimester === '1' ? 0 : trimester === '2' ? 340 : 450;
    var activityFactor = activity === 'high' ? 34 : activity === 'low' ? 28 : 30;
    var calories = Math.round(weight * activityFactor + extra);
    var protein = Math.round(weight * 1.1);
    showResult(
      '<div class="health-result-value">' + esc(calories.toLocaleString()) + '</div>' +
      '<div class="health-result-label">Estimated daily calories</div>' +
      resultCards([
        { title: 'Protein target', body: esc(protein + ' g/day, discuss personal needs with your provider') },
        { title: 'Micronutrients', body: esc('Ask about iron, folic acid, calcium, iodine, and vitamin D based on local ANC guidance.') },
        { title: 'Local plate idea', body: esc('Pair a staple with beans, fish, egg, groundnuts, vegetables, fruit, and safe drinking water.') }
      ])
    );
  }

  function runActivity() {
    var weight = Math.max(25, num('weightKg', 70));
    var minutes = Math.max(1, num('minutes', 30));
    var met = Number(text('activity', '4')) || 4;
    var kcal = Math.round((met * 3.5 * weight / 200) * minutes);
    showResult(
      '<div class="health-result-value">' + esc(kcal) + '</div>' +
      '<div class="health-result-label">Estimated calories burned</div>' +
      resultCards([
        { title: 'Session', body: esc(minutes + ' minutes at MET ' + met) },
        { title: 'Weekly planning', body: esc(Math.round(kcal * 3) + ' kcal for 3 similar sessions') },
        { title: 'Safety', body: esc('Start gently if you are pregnant, ill, injured, or returning after a long break.') }
      ])
    );
  }

  function runCompare() {
    var currency = text('currency', CONFIG.defaultCurrency || '');
    var first = num('firstCost', 0);
    var firstRepeat = Math.max(1, num('firstRepeat', 1));
    var second = num('secondCost', 0);
    var secondRepeat = Math.max(1, num('secondRepeat', 1));
    var travel = num('travel', 0);
    var buffer = num('buffer', 0);
    var firstTotal = first * firstRepeat + travel + buffer;
    var secondTotal = second * secondRepeat;
    var diff = firstTotal - secondTotal;
    showResult(
      '<div class="health-result-value">' + esc(fmt(Math.abs(diff), currency)) + '</div>' +
      '<div class="health-result-label">' + esc(diff > 0 ? 'Option B is cheaper by this estimate' : 'Option A is cheaper by this estimate') + '</div>' +
      resultCards([
        { title: 'Option A total', body: esc(fmt(firstTotal, currency)) },
        { title: 'Option B total', body: esc(fmt(secondTotal, currency)) },
        { title: 'Decision note', body: esc(CONFIG.nextAction || 'Compare quality, follow-up, emergency access, and documents, not price only.') }
      ])
    );
  }

  function storageKey() {
    return 'afrotools:' + (CONFIG.id || 'health-tool') + ':log';
  }

  function readLog() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || '[]');
    } catch (error) {
      return [];
    }
  }

  function writeLog(log) {
    localStorage.setItem(storageKey(), JSON.stringify(log.slice(-40)));
  }

  function renderFeedingLog() {
    var list = document.getElementById('health-log-list');
    var log = readLog();
    if (!list) return;
    if (!log.length) {
      list.innerHTML = '<div class="health-log-item"><span>No sessions logged yet</span><strong>Today</strong></div>';
      return;
    }
    list.innerHTML = log.slice().reverse().map(function (item) {
      return '<div class="health-log-item"><span>' + esc(item.side) + ' - ' + esc(item.minutes) + ' min</span><strong>' + esc(new Date(item.when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '</strong></div>';
    }).join('');
  }

  function addFeedingSession() {
    var side = text('side', 'Left');
    var minutes = Math.max(1, num('minutes', 10));
    var log = readLog();
    log.push({ side: side, minutes: minutes, when: new Date().toISOString() });
    writeLog(log);
    renderFeedingLog();
    showResult(
      '<div class="health-result-value">' + esc(log.length) + '</div>' +
      '<div class="health-result-label">Sessions logged on this device</div>' +
      resultCards([
        { title: 'Last side', body: esc(side) },
        { title: 'Last duration', body: esc(minutes + ' minutes') },
        { title: 'Reminder', body: esc('Seek feeding support if baby is not gaining weight, has fewer wet diapers, or feeding is painful.') }
      ])
    );
  }

  function renderApp() {
    var fields = CONFIG.fields || [];
    var intro = CONFIG.intro ? '<p>' + esc(CONFIG.intro) + '</p>' : '';
    var body = intro;
    if (CONFIG.type === 'risk-checklist') {
      body += renderChecks(CONFIG.checks || []);
    } else {
      body += renderFields(fields);
    }
    body += '<div class="health-app-actions"><button class="health-app-button" id="health-run" type="button">' + esc(CONFIG.buttonLabel || 'Calculate') + '</button><button class="health-app-button secondary" id="health-reset" type="button">Reset</button></div>';
    body += '<div class="health-app-result" id="health-app-result" aria-live="polite"></div>';
    if (CONFIG.type === 'feeding-tracker') {
      body += '<div class="health-log-list" id="health-log-list"></div>';
    }
    body += '<p class="health-app-note">' + esc(CONFIG.disclaimer || 'This tool is informational. It does not replace care from a qualified health professional or emergency service.') + '</p>';
    root.innerHTML = body;

    document.getElementById('health-run').addEventListener('click', function () {
      if (CONFIG.type === 'cost-estimator') runCostEstimator();
      else if (CONFIG.type === 'risk-checklist') runRiskChecklist();
      else if (CONFIG.type === 'schedule-tracker') runScheduleTracker();
      else if (CONFIG.type === 'nutrition') runNutrition();
      else if (CONFIG.type === 'activity') runActivity();
      else if (CONFIG.type === 'compare') runCompare();
      else if (CONFIG.type === 'feeding-tracker') addFeedingSession();
    });
    document.getElementById('health-reset').addEventListener('click', function () {
      root.querySelectorAll('input').forEach(function (input) {
        if (input.type === 'checkbox') input.checked = false;
      });
      var result = document.getElementById('health-app-result');
      result.classList.remove('show');
      result.innerHTML = '';
    });
    if (CONFIG.type === 'feeding-tracker') renderFeedingLog();
  }

  renderApp();
})();
