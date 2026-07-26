(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.statisticsEngine;
  if (!engine) return;

  var current = null;
  var input = document.getElementById('dataInput');
  var status = document.getElementById('statsStatus');
  var resultCard = document.getElementById('resultCard');
  var statGrid = document.getElementById('statGrid');
  var histogram = document.getElementById('histogram');
  var sortedSection = document.getElementById('sortedSection');

  function setStatus(message, okay) {
    status.textContent = message || '';
    status.classList.toggle('is-success', !!okay);
  }

  function formatNumber(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'Not defined';
    if (Object.is(value, -0)) value = 0;
    return new Intl.NumberFormat('en', {
      maximumFractionDigits: Math.abs(value) < 1 && value !== 0 ? 6 : 4
    }).format(value);
  }

  function addStat(label, value, emphasis, note) {
    var box = document.createElement('div');
    box.className = 'stat-box' + (emphasis ? ' big' : '');
    var number = document.createElement('div');
    number.className = 'num';
    number.textContent = value;
    var heading = document.createElement('div');
    heading.className = 'lbl';
    heading.textContent = label;
    box.append(number, heading);
    if (note) {
      var helper = document.createElement('div');
      helper.className = 'stat-note';
      helper.textContent = note;
      box.appendChild(helper);
    }
    statGrid.appendChild(box);
  }

  function renderHistogram(values) {
    histogram.replaceChildren();
    var title = document.createElement('h3');
    title.className = 'stats-subtitle';
    title.textContent = 'Distribution';
    histogram.appendChild(title);
    var bins = engine.histogram(values);
    var maxCount = Math.max.apply(null, bins.map(function (bin) { return bin.count; }));
    bins.forEach(function (bin) {
      var row = document.createElement('div');
      row.className = 'hist-bar-row';
      var label = document.createElement('span');
      label.className = 'hist-label';
      label.textContent = bin.lower === bin.upper
        ? formatNumber(bin.lower)
        : formatNumber(bin.lower) + '–' + formatNumber(bin.upper);
      var track = document.createElement('span');
      track.className = 'stats-hist-track';
      var bar = document.createElement('span');
      bar.className = 'hist-bar';
      bar.style.width = ((bin.count / maxCount) * 100) + '%';
      track.appendChild(bar);
      var count = document.createElement('span');
      count.className = 'hist-count';
      count.textContent = String(bin.count);
      row.append(label, track, count);
      histogram.appendChild(row);
    });
  }

  function render(result) {
    statGrid.replaceChildren();
    addStat('Mean', formatNumber(result.mean), true);
    addStat('Median', formatNumber(result.median), true);
    addStat('Mode', result.modes.length ? result.modes.map(formatNumber).join(', ') : 'No repeated value');
    addStat('Count (n)', String(result.count));
    addStat('Sample standard deviation', formatNumber(result.sampleSd));
    addStat('Population standard deviation', formatNumber(result.populationSd));
    addStat('Sample variance', formatNumber(result.sampleVariance));
    addStat('Population variance', formatNumber(result.populationVariance));
    addStat('Minimum', formatNumber(result.minimum));
    addStat('Maximum', formatNumber(result.maximum));
    addStat('Range', formatNumber(result.range));
    addStat('Q1 (inclusive)', formatNumber(result.q1));
    addStat('Q3 (inclusive)', formatNumber(result.q3));
    addStat('IQR', formatNumber(result.iqr));
    addStat(
      'Coefficient of variation',
      result.coefficientOfVariation === null ? 'Not defined' : formatNumber(result.coefficientOfVariation) + '%',
      false,
      result.coefficientOfVariation === null ? 'Mean is zero.' : 'Interpret only for ratio-scale data with a meaningful zero.'
    );
    addStat(
      'Adjusted skewness',
      formatNumber(result.skewness),
      false,
      result.skewness === null ? 'Needs at least three values and non-zero spread.' : 'Adjusted Fisher–Pearson coefficient.'
    );
    addStat('Sum', formatNumber(result.sum));

    renderHistogram(result.sorted);
    sortedSection.replaceChildren();
    var heading = document.createElement('h3');
    heading.className = 'stats-subtitle';
    heading.textContent = 'Sorted data';
    var values = document.createElement('div');
    values.className = 'sorted-data';
    values.textContent = result.sorted.map(formatNumber).join(', ');
    sortedSection.append(heading, values);
    resultCard.style.display = 'block';
  }

  function calculate() {
    var parsed = engine.parseInput(input.value);
    if (parsed.invalidTokens.length) {
      current = null;
      resultCard.style.display = 'none';
      setStatus('Fix or remove non-numeric values: ' + parsed.invalidTokens.slice(0, 5).join(', ') +
        (parsed.invalidTokens.length > 5 ? '…' : '') + '. No values were silently ignored.');
      return;
    }
    if (parsed.values.length < 2) {
      current = null;
      resultCard.style.display = 'none';
      setStatus('Enter at least two finite numbers.');
      return;
    }
    current = engine.analyse(parsed.values);
    render(current);
    setStatus('Calculated descriptive statistics for ' + current.count + ' values in this browser.', true);
    resultCard.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function reportText() {
    if (!current) calculate();
    if (!current) return '';
    return [
      'Descriptive statistics worksheet — AfroTools',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Count: ' + current.count,
      'Sum: ' + formatNumber(current.sum),
      'Mean: ' + formatNumber(current.mean),
      'Median: ' + formatNumber(current.median),
      'Mode: ' + (current.modes.length ? current.modes.map(formatNumber).join(', ') : 'No repeated value'),
      'Minimum: ' + formatNumber(current.minimum),
      'Maximum: ' + formatNumber(current.maximum),
      'Range: ' + formatNumber(current.range),
      'Sample standard deviation: ' + formatNumber(current.sampleSd),
      'Population standard deviation: ' + formatNumber(current.populationSd),
      'Sample variance: ' + formatNumber(current.sampleVariance),
      'Population variance: ' + formatNumber(current.populationVariance),
      'Q1 (inclusive interpolation): ' + formatNumber(current.q1),
      'Q3 (inclusive interpolation): ' + formatNumber(current.q3),
      'IQR: ' + formatNumber(current.iqr),
      'Coefficient of variation: ' + (current.coefficientOfVariation === null ? 'Not defined (mean is zero)' : formatNumber(current.coefficientOfVariation) + '%'),
      'Adjusted Fisher–Pearson skewness: ' + formatNumber(current.skewness),
      '',
      'Verification notes:',
      '- Decide whether the dataset is a sample or the full population before choosing an SD or variance.',
      '- Quartiles use inclusive linear interpolation; another textbook or package may use a different convention.',
      '- CV is meaningful only for ratio-scale data with a meaningful zero.',
      '- Skewness is not defined here for fewer than three values or zero spread.',
      '- The exported summary omits the raw dataset. Use the visible sorted-data section if you need to review inputs.'
    ].join('\n');
  }

  function copyFallback(text) {
    var helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    try { document.execCommand('copy'); setStatus('Statistics summary copied.', true); }
    catch (error) { setStatus('Copy failed. Download the TXT summary instead.'); }
    helper.remove();
  }

  function copyStatsReport() {
    var text = reportText();
    if (!text) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) return copyFallback(text);
    navigator.clipboard.writeText(text)
      .then(function () { setStatus('Statistics summary copied.', true); })
      .catch(function () { copyFallback(text); });
  }

  function downloadStatsReport() {
    var text = reportText();
    if (!text) return;
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'descriptive-statistics-summary.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('TXT summary downloaded without the raw dataset.', true);
  }

  function printStatsReport() {
    if (!current) calculate();
    if (!current) return;
    window.print();
    setStatus('Print dialog opened. Choose Save as PDF for a PDF summary.', true);
  }

  function clearStatsData() {
    input.value = '';
    current = null;
    resultCard.style.display = 'none';
    statGrid.replaceChildren();
    histogram.replaceChildren();
    sortedSection.replaceChildren();
    setStatus('Dataset cleared from this tab.', true);
    input.focus();
  }

  function loadSample(type) {
    var samples = {
      exam: '65, 72, 78, 82, 85, 88, 90, 55, 60, 75, 80, 92, 68, 74, 77, 83, 95, 58, 70, 86, 73, 79, 81, 87, 63',
      salary: '35000, 42000, 38000, 55000, 48000, 62000, 41000, 39000, 150000, 45000, 52000, 36000, 43000, 47000, 58000, 40000, 44000, 37000, 51000, 46000'
    };
    input.value = samples[type] || '';
    calculate();
  }

  window.calculate = calculate;
  window.loadSample = loadSample;
  window.copyStatsReport = copyStatsReport;
  window.downloadStatsReport = downloadStatsReport;
  window.clearStatsData = clearStatsData;
  window.printStatsReport = printStatsReport;

  var buttons = document.querySelector('.btn-row');
  if (buttons && !document.getElementById('printStatsReport')) {
    var printButton = document.createElement('button');
    printButton.type = 'button';
    printButton.id = 'printStatsReport';
    printButton.className = 'btn btn-secondary';
    printButton.textContent = 'Print / save PDF';
    printButton.addEventListener('click', printStatsReport);
    buttons.insertBefore(printButton, buttons.lastElementChild);
  }
  input.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') calculate();
  });
  window.AFROTOOLS_STATISTICS_VIP = true;
}());
