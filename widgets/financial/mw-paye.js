(function () {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.mw_paye = function (root, options) {
    const money = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
    const format = amount => 'MWK ' + money.format(amount);
    const bands = [[170000, 0], [1400000, 0.30], [8430000, 0.35], [Infinity, 0.40]];
    root.innerHTML = '<div class="aw-title">Malawi PAYE Calculator</div>' +
      '<p>Use regular monthly taxable pay. The estimate assumes the full salary is pensionable, with a 5% employee and 10% employer pension contribution.</p>' +
      '<form><div class="aw-field"><label class="aw-label" for="awMwGross">Monthly gross salary (MWK)</label>' +
      '<input class="aw-input" id="awMwGross" type="text" inputmode="decimal" placeholder="e.g. 500,000"></div>' +
      '<button class="aw-btn aw-btn--primary" id="awMwCalc" type="submit">Calculate PAYE</button></form>' +
      '<div id="awMwResult" aria-live="polite"></div>' + ((options && options.footerHTML) || '');
    const input = root.querySelector('#awMwGross');
    const output = root.querySelector('#awMwResult');
    input.addEventListener('input', () => { output.textContent = ''; });
    root.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const entered = input.value.trim();
      const salary = Number(entered.replace(/,/g, ''));
      if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(entered) || !Number.isFinite(salary * 12) || salary <= 0) {
        output.textContent = 'Enter a positive monthly gross salary in Malawi kwacha.';
        input.focus();
        return;
      }
      const pension = salary * 0.05;
      let remaining = salary;
      let paye = 0;
      for (const [width, rate] of bands) {
        const portion = Math.min(remaining, width);
        paye += portion * rate;
        remaining -= portion;
      }
      const net = salary - pension - paye;
      const row = (label, value) => '<div class="aw-result-row"><span>' + label + '</span><span>' + value + '</span></div>';
      output.innerHTML = '<div class="aw-result-box"><div class="aw-result-label">Monthly take-home pay</div>' +
        '<div class="aw-result-main">' + format(net) + '</div></div>' +
        row('Monthly gross', format(salary)) + row('Employee pension (5%)', format(pension)) +
        row('Employer pension paid separately (10%)', format(salary * 0.10)) + row('Monthly PAYE', format(paye)) +
        row('Effective PAYE rate', (100 * paye / salary).toFixed(1) + '%') +
        row('Net for 12 identical months', format(12 * net));
    });
  };
})();
