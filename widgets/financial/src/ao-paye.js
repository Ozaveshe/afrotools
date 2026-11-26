(function () {
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.ao_paye = function (container, options = {}) {
    const money = value => 'AOA ' + Math.round(value).toLocaleString('en');
    container.innerHTML = '<div class="aw-title">🇦🇴 Angola PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label" for="awAoGross">Monthly Gross Salary (AOA)</label>' +
      '<input class="aw-input" id="awAoGross" inputmode="decimal" placeholder="e.g. 500,000"></div>' +
      '<button class="aw-btn aw-btn--primary" id="awAoCalc">Calculate PAYE</button>' +
      '<div id="awAoResult" aria-live="polite"></div>' + (options.footerHTML || '');
    const input = container.querySelector('#awAoGross');
    const output = container.querySelector('#awAoResult');
    function calculate() {
      const gross = Number(input.value.replace(/,/g, '').trim());
      if (!Number.isFinite(gross) || gross <= 0) {
        output.textContent = 'Enter a positive monthly gross salary.';
        return;
      }
      const inss = gross * 0.03;
      const taxable = gross - inss;
      const tax = window.AngolaIRT.withholding(taxable).tax;
      const net = taxable - tax;
      const rows = [
        ['Gross salary', money(gross)], ['INSS (3%)', money(inss)],
        ['Taxable pay', money(taxable)], ['Monthly IRT', money(tax)],
        ['Effective tax rate', (100 * tax / gross).toFixed(1) + '%'],
        ['Net salary', money(net)], ['Annual net', money(net * 12)]
      ];
      output.innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly Take-Home</div>' +
        '<div class="aw-result-main">' + money(net) + '</div></div>' +
        rows.map(([label, value]) => '<div class="aw-result-row"><span>' +
          label + '</span><span>' + value + '</span></div>').join('');
    }
    container.querySelector('#awAoCalc').addEventListener('click', calculate);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') calculate(); });
  };
})();
