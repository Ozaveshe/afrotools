(function () {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.sz_paye = function (root, options) {
    const money = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
    const format = amount => 'E' + money.format(amount);
    const bands = [[100000, 0.20], [50000, 0.25], [50000, 0.30], [Infinity, 0.33]];
    root.innerHTML = '<div class="aw-title">Eswatini PAYE Calculator</div>' +
      '<p>Estimate a regular 2026 payslip using the general E8,200 annual rebate and employee ENPF. The additional over-60 rebate is excluded.</p>' +
      '<form><div class="aw-field"><label class="aw-label" for="awSzGross">Monthly gross salary (SZL)</label>' +
      '<input class="aw-input" id="awSzGross" type="text" inputmode="decimal" placeholder="e.g. 10,000"></div>' +
      '<button class="aw-btn aw-btn--primary" id="awSzCalc" type="submit">Calculate PAYE</button></form>' +
      '<div id="awSzResult" aria-live="polite"></div>' + ((options && options.footerHTML) || '');
    const input = root.querySelector('#awSzGross');
    const output = root.querySelector('#awSzResult');
    input.addEventListener('input', () => { output.textContent = ''; });
    root.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const entered = input.value.trim();
      const salary = Number(entered.replace(/,/g, ''));
      if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(entered) || !Number.isFinite(salary * 12) || salary <= 0) {
        output.textContent = 'Enter a positive monthly gross salary in emalangeni.';
        input.focus();
        return;
      }
      const enpf = Math.min(salary * 0.05, 215);
      const taxable = salary - enpf;
      let remaining = taxable * 12;
      let annualTax = 0;
      for (const [width, rate] of bands) {
        const portion = Math.min(remaining, width);
        annualTax += portion * rate;
        remaining -= portion;
      }
      const paye = Math.max(0, annualTax - 8200) / 12;
      const net = salary - enpf - paye;
      const row = (label, value) => '<div class="aw-result-row"><span>' + label + '</span><span>' + value + '</span></div>';
      output.innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly take-home pay</div>' +
        '<div class="aw-result-main">' + format(net) + '</div></div>' +
        row('Monthly gross', format(salary)) + row('Employee ENPF', format(enpf)) +
        row('Monthly taxable pay', format(taxable)) + row('Monthly PAYE', format(paye)) +
        row('Effective PAYE rate', (100 * paye / salary).toFixed(1) + '%') +
        row('Net for 12 identical months', format(12 * net));
    });
  };
})();
