(function () {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.rw_paye = function (container, options) {
    const format = value => 'RWF ' + Math.round(value).toLocaleString('en-RW');
    container.innerHTML = '<div class="aw-title">Rwanda PAYE Calculator</div>' +
      '<label class="aw-field"><span class="aw-label">Monthly gross taxable salary (RWF)</span>' +
      '<input class="aw-input" id="awRwGross" type="text" inputmode="numeric" placeholder="e.g. 500,000"></label>' +
      '<button class="aw-btn aw-btn--primary" id="awRwCalc" type="button">Calculate PAYE</button>' +
      '<div id="awRwResult" aria-live="polite"></div>' + (options?.footerHTML || '');
    const input = container.querySelector('#awRwGross');
    const result = container.querySelector('#awRwResult');
    function calculate() {
      const gross = Number(input.value.replace(/[ ,]/g, ''));
      if (!Number.isFinite(gross) || gross <= 0) {
        result.textContent = 'Enter a positive monthly salary in RWF.';
        return;
      }
      const paye = Math.ceil((Math.min(Math.max(gross - 60000, 0), 40000) +
        2 * Math.min(Math.max(gross - 100000, 0), 100000) +
        3 * Math.max(gross - 200000, 0)) / 10);
      const pension = gross * 0.06;
      const maternity = gross * 0.003;
      const beforeCbhi = gross - pension - maternity - paye;
      const cbhi = Math.round(beforeCbhi * 0.005 / 1.005);
      const net = beforeCbhi - cbhi;
      const hazard = gross * 0.02;
      const rows = [
        ['Gross salary', format(gross)], ['Taxable income', format(gross)],
        ['PAYE tax', format(paye)], ['Effective PAYE rate', (paye / gross * 100).toFixed(1) + '%'],
        ['Employee pension (6%)', format(pension)], ['Employee maternity (0.3%)', format(maternity)],
        ['Employee CBHI (0.5% of net)', format(cbhi)], ['Annual net salary', format(net * 12)],
        ['Employer pension (6%)', format(pension)], ['Employer maternity (0.3%)', format(maternity)],
        ['Employer occupational hazard (2%)', format(hazard)],
        ['Total monthly employer cost', format(gross + pension + maternity + hazard)]
      ];
      result.innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly take-home pay</div>' +
        '<div class="aw-result-main">' + format(net) + '</div></div>' +
        rows.map(([label, value]) => '<div class="aw-result-row"><span>' + label + '</span><span>' + value + '</span></div>').join('');
    }
    container.querySelector('#awRwCalc').addEventListener('click', calculate);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') calculate(); });
  };
})();
