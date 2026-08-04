(function () {
  'use strict';

  var config = window.SwEducationApp;
  if (!config) return;
  var form = document.getElementById('swEduForm');
  var resultBox = document.getElementById('swEduResult');
  var metricsBox = document.getElementById('swEduMetrics');
  var errorBox = document.getElementById('swEduError');
  var statusBox = document.getElementById('swEduStatus');
  var lastPayload = null;

  function byPath(path) {
    return path.split('.').reduce(function (value, key) { return value && value[key]; }, window);
  }

  function values() {
    var output = {};
    config.fields.forEach(function (field) {
      var node = form.elements[field[0]];
      output[field[0]] = field[2] === 'number' ? (node.value.trim() === '' ? NaN : Number(node.value)) : node.value.trim();
    });
    return output;
  }

  function requireNumbers(input) {
    var bad = config.fields.some(function (field) {
      return field[2] === 'number' && (!Number.isFinite(input[field[0]]) || input[field[0]] < 0);
    });
    if (bad) throw new Error('Weka namba halali isiyo chini ya sifuri katika kila sehemu ya kiasi.');
  }

  function calculate(input) {
    requireNumbers(input);
    var engine = byPath(config.engineGlobal);
    if (!engine) throw new Error('Kikokotoo hakijapakiwa. Pakia ukurasa upya.');
    var out;
    if (config.id === 'school-fees') {
      out = engine.calculate(input);
      if (!out.ok) throw new Error('Kagua ada, gharama za ziada, kiasi cha mwezi na idadi ya malipo.');
      out.annualTotal = out.annual;
    } else if (config.id === 'ke-helb') {
      out = engine.calculate(input);
      if (!out.valid || !out.clears) throw new Error('Malipo ya mwezi lazima yawe makubwa kuliko riba na yamalize mkopo ndani ya muda wa kikokotoo.');
    } else if (config.id === 'student-budget') {
      out = engine.calculate({
        periodMonths: input.periodMonths,
        monthlyIncome: input.monthlyIncome,
        periodFunding: input.periodFunding,
        monthlyExpenses: { housing: input.housing, food: input.food, transport: input.transport },
        periodExpenses: { tuition: input.tuition, setup: input.setup }
      });
      if (!out.ok) throw new Error('Muda wa mpango lazima uwe zaidi ya sifuri na kiasi kiwe halali.');
    } else if (config.id === 'teacher-salary') {
      out = engine.validate(input);
      if (!out.ok) throw new Error('Weka mshahara wa msingi na muda wa kazi unaokubalika.');
    } else if (config.id === 'student-loan-repay') {
      if (input.principal <= 0 || input.months < 1) throw new Error('Salio lazima liwe zaidi ya sifuri na muda uwe angalau mwezi mmoja.');
      out = engine.compare(input);
      out = Object.assign({}, out.plan, { monthsSaved: out.monthsSaved, interestSaved: out.interestSaved });
    } else if (config.id === 'tutoring-rate') {
      out = engine.calculate(Object.assign({ proposedPrice: '' }, input));
      if (!out.ok) throw new Error('Kagua mapato, vipindi, muda, gharama na asilimia za akiba.');
      out.requiredRevenue = out.requiredRevenueMonthly;
    } else if (config.id === 'edu-savings') {
      if (input.todayCost <= 0 || input.months < 1) throw new Error('Gharama ya leo na idadi ya miezi lazima iwe zaidi ya sifuri.');
      out = engine.calculate(Object.assign({ timing: 'end' }, input));
      if (!out.ok) throw new Error('Kagua lengo, muda, viwango na michango yako.');
    } else if (config.id === 'study-abroad-cost') {
      out = engine.calculate(input);
      if (!out.valid) throw new Error('Miezi lazima iwe namba kamili kati ya 1 na 120; kagua kiasi kingine pia.');
    }
    return out;
  }

  function format(value, key, input) {
    if (key === 'months' || key === 'payoffMonths' || key === 'monthsSaved') return Math.round(value).toLocaleString('sw-TZ');
    var currency = input.currency || (config.id === 'ke-helb' ? 'KES' : '');
    return (currency ? currency + ' ' : '') + Number(value || 0).toLocaleString('sw-TZ', { maximumFractionDigits: 2 });
  }

  function render(input, output) {
    metricsBox.textContent = '';
    config.metrics.forEach(function (metric) {
      var card = document.createElement('div');
      card.className = 'metric';
      var strong = document.createElement('strong');
      var label = document.createElement('span');
      strong.textContent = format(output[metric[0]], metric[0], input);
      label.textContent = metric[1];
      card.append(strong, label);
      metricsBox.appendChild(card);
    });
    var exportedResults = {};
    config.metrics.forEach(function (metric) { exportedResults[metric[0]] = output[metric[0]]; });
    lastPayload = { app: config.id, kichwa: config.title, pembejeo: input, matokeo: exportedResults, ilikokotolewa: new Date().toISOString() };
    resultBox.hidden = false;
    statusBox.textContent = 'Hesabu imekamilika ndani ya kivinjari hiki.';
    resultBox.focus();
  }

  function reportText() {
    var lines = [config.title, 'Imetolewa: ' + new Date(lastPayload.ilikokotolewa).toLocaleString('sw-TZ'), '', 'Pembejeo:'];
    config.fields.forEach(function (field) { lines.push(field[1] + ': ' + lastPayload.pembejeo[field[0]]); });
    lines.push('', 'Matokeo:');
    config.metrics.forEach(function (metric) { lines.push(metric[1] + ': ' + format(lastPayload.matokeo[metric[0]], metric[0], lastPayload.pembejeo)); });
    lines.push('', 'Kumbuka: Haya ni makadirio ya kupanga, si taarifa rasmi, ushauri wa kifedha, uamuzi wa mkopo, visa au udahili.');
    return lines.join('\n');
  }

  function download(blob, extension) {
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = config.id + '-sw.' + extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorBox.textContent = '';
    try { var input = values(); render(input, calculate(input)); }
    catch (error) { lastPayload = null; resultBox.hidden = true; errorBox.textContent = error.message; }
  });
  document.getElementById('swEduReset').addEventListener('click', function () {
    form.reset(); lastPayload = null; resultBox.hidden = true; errorBox.textContent = ''; statusBox.textContent = 'Fomu imesafishwa.';
  });
  document.getElementById('swEduJson').addEventListener('click', function () {
    if (!lastPayload) return;
    download(new Blob([JSON.stringify(lastPayload, null, 2)], { type: 'application/json;charset=utf-8' }), 'json');
    statusBox.textContent = 'Faili la JSON limepakuliwa.';
  });
  document.getElementById('swEduTxt').addEventListener('click', function () {
    if (!lastPayload) return;
    download(new Blob([reportText()], { type: 'text/plain;charset=utf-8' }), 'txt');
    statusBox.textContent = 'Faili la maandishi limepakuliwa.';
  });
  document.getElementById('swEduPdf').addEventListener('click', function () {
    if (!lastPayload || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF();
    var lines = doc.splitTextToSize(reportText(), 175);
    doc.setFontSize(10); doc.text(lines, 18, 18); doc.save(config.id + '-sw.pdf');
    statusBox.textContent = 'Faili la PDF limepakuliwa.';
  });
  document.getElementById('swEduCopy').addEventListener('click', function () {
    if (!lastPayload) return;
    var text = reportText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { statusBox.textContent = 'Muhtasari umenakiliwa.'; }).catch(function () { statusBox.textContent = text; });
    else statusBox.textContent = text;
  });
  document.getElementById('swTheme').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    this.setAttribute('aria-pressed', String(!dark));
    this.textContent = dark ? 'Mandhari nyeusi' : 'Mandhari nyepesi';
  });
}());
