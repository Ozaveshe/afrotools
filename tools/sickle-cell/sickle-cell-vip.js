(function () {
  'use strict';
  var engine = window.AfroToolsSickleInheritance;
  var form = document.getElementById('inheritance-form');
  if (!engine || !form) return;

  var first = document.getElementById('result-one');
  var second = document.getElementById('result-two');
  var confirmed = document.getElementById('lab-confirmed');
  var errorSummary = document.getElementById('error-summary');
  var errorList = document.getElementById('error-list');
  var resultsPanel = document.getElementById('results');
  var current = null;

  function clearErrors() {
    errorSummary.hidden = true;
    errorList.textContent = '';
    [first, second, confirmed].forEach(function (field) { field.removeAttribute('aria-invalid'); });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (field) field.setAttribute('aria-invalid', 'true');
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + error.field;
      link.textContent = error.message;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (field) field.focus();
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function outcomeClass(genotype) {
    if (genotype === 'AS' || genotype === 'AC') return 'trait';
    if (genotype === 'SS' || genotype === 'SC') return 'scd';
    if (genotype === 'CC') return 'hbc';
    return 'haa';
  }

  function renderPunnett(result) {
    var wrap = document.getElementById('punnett-square');
    wrap.textContent = '';
    var heading = document.createElement('h3');
    heading.textContent = 'Punnett square';
    wrap.appendChild(heading);
    var table = document.createElement('table');
    table.className = 'sc-punnett';
    var caption = document.createElement('caption');
    caption.textContent = 'Each interior cell represents one of four equally weighted allele combinations.';
    table.appendChild(caption);
    var head = document.createElement('thead');
    var headRow = document.createElement('tr');
    headRow.innerHTML = '<th scope="col">Alleles</th><th scope="col">' + result.allelesSecond[0] + '</th><th scope="col">' + result.allelesSecond[1] + '</th>';
    head.appendChild(headRow);
    table.appendChild(head);
    var body = document.createElement('tbody');
    for (var row = 0; row < 2; row += 1) {
      var tr = document.createElement('tr');
      var rowHead = document.createElement('th');
      rowHead.scope = 'row';
      rowHead.textContent = result.allelesFirst[row];
      tr.appendChild(rowHead);
      for (var col = 0; col < 2; col += 1) {
        var cell = document.createElement('td');
        var genotype = result.cells[(row * 2) + col];
        cell.textContent = genotype;
        cell.className = 'is-' + outcomeClass(genotype);
        tr.appendChild(cell);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);
    wrap.appendChild(table);
  }

  function renderOutcomes(result) {
    var container = document.getElementById('outcomes');
    container.textContent = '';
    result.outcomes.forEach(function (outcome) {
      var article = document.createElement('article');
      article.className = 'sc-outcome is-' + outcomeClass(outcome.genotype);
      var genotype = document.createElement('p');
      genotype.className = 'sc-outcome-code';
      genotype.textContent = outcome.genotype;
      var probability = document.createElement('p');
      probability.className = 'sc-outcome-value';
      probability.textContent = outcome.probability + '%';
      var label = document.createElement('h3');
      label.textContent = outcome.label;
      var category = document.createElement('p');
      category.textContent = outcome.category + ' · for each pregnancy';
      article.appendChild(genotype);
      article.appendChild(probability);
      article.appendChild(label);
      article.appendChild(category);
      container.appendChild(article);
    });
  }

  function renderResult(result) {
    current = result;
    document.getElementById('result-summary').textContent = result.first + ' × ' + result.second + ' produces ' + result.outcomes.length + ' possible genotype combination' + (result.outcomes.length === 1 ? '' : 's') + ' in this four-cell model.';
    renderPunnett(result);
    renderOutcomes(result);
    resultsPanel.hidden = false;
    resultsPanel.focus();
    resultsPanel.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function summaryText() {
    if (!current) return '';
    return [
      'SICKLE CELL INHERITANCE EDUCATION - NOT A DIAGNOSIS OR DECISION',
      '',
      'Created locally: ' + new Date().toISOString(),
      'First lab-confirmed result: ' + current.first,
      'Second lab-confirmed result: ' + current.second,
      '',
      'POSSIBLE COMBINATIONS FOR EACH PREGNANCY',
      current.outcomes.map(function (outcome) {
        return '- ' + outcome.genotype + ': ' + outcome.probability + '% - ' + outcome.label + ' (' + outcome.category + ')';
      }).join('\n'),
      '',
      'Each pregnancy is independent. These percentages do not predict or guarantee an individual child’s result.',
      'This simplified model covers only AA, AS, AC, SS, SC, and CC. It does not confirm a genotype, cover other variants or thalassaemia, assess symptoms or severity, or direct relationship or reproductive decisions.',
      'Use confirmed laboratory results and discuss testing, newborn screening, confirmatory follow-up, and personal questions with a qualified clinician or genetic counsellor.',
      '',
      'Official context checked 2026-07-26:',
      '- CDC About Sickle Cell Disease: https://www.cdc.gov/sickle-cell/about/index.html',
      '- CDC Sickle Cell Trait: https://www.cdc.gov/sickle-cell/sickle-cell-trait/',
      '- NIH/NHLBI Sickle Cell Trait: https://www.nhlbi.nih.gov/health/sickle-cell-disease/sickle-cell-trait',
      '- NIH/NHLBI Pregnancy and Reproduction: https://www.nhlbi.nih.gov/health/sickle-cell-disease/pregnancy'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    resultsPanel.hidden = true;
    current = null;
    var errors = [];
    if (!confirmed.checked) errors.push({ field: 'lab-confirmed', message: 'Confirm that both entries come from qualified laboratory or clinical interpretation.' });
    var result = engine.calculate(first.value, second.value);
    if (!result.ok) errors = errors.concat(result.errors);
    if (errors.length) {
      showErrors(errors);
      return;
    }
    renderResult(result);
  });

  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      clearErrors();
      resultsPanel.hidden = true;
      current = null;
    }, 0);
  });
  document.getElementById('print-button').addEventListener('click', function () {
    if (current) window.print();
  });
  document.getElementById('download-button').addEventListener('click', function () {
    if (!current) return;
    var blob = new Blob([summaryText()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'sickle-cell-inheritance-summary.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
})();
