(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.budget_planner = function(container, opts) {
    container.innerHTML =
      '<div class="aw-title">\u{1f4cb} Budget Planner</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Income</label><input class="aw-input" id="aw-income" type="number" min="0" placeholder="0"></div>' +
      '<div class="aw-field"><label class="aw-label">Housing/Rent</label><input class="aw-input" id="aw-housing" type="number" min="0" placeholder="0"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Food</label><input class="aw-input" id="aw-food" type="number" min="0" placeholder="0"></div>' +
        '<div class="aw-field"><label class="aw-label">Transport</label><input class="aw-input" id="aw-transport" type="number" min="0" placeholder="0"></div>' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Utilities</label><input class="aw-input" id="aw-utilities" type="number" min="0" placeholder="0"></div>' +
        '<div class="aw-field"><label class="aw-label">Other</label><input class="aw-input" id="aw-other" type="number" min="0" placeholder="0"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate Budget</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');
    function calc() {
      var income = parseFloat(container.querySelector('#aw-income').value) || 0;
      var cats = ['housing','food','transport','utilities','other'];
      var total = 0;
      cats.forEach(function(c){ total += parseFloat(container.querySelector('#aw-'+c).value) || 0; });
      var remaining = income - total;
      var savingsRate = income > 0 ? (remaining / income * 100) : 0;
      var f = function(n){return Math.round(n).toLocaleString('en')};
      var r = container.querySelector('#aw-res'); r.style.display='block';
      var color = remaining >= 0 ? '#007AFF' : '#dc2626';
      r.innerHTML = '<div class="aw-result-row"><span class="aw-result-label">Total Expenses</span><span class="aw-result-main">'+f(total)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Remaining</span><span class="aw-result-main" style="color:'+color+'">'+f(remaining)+'</span></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Savings Rate</span><span>'+savingsRate.toFixed(1)+'%</span></div><div class="aw-result-row"><span class="aw-result-label">Expense Ratio</span><span>'+(income>0?(total/income*100).toFixed(1):0)+'%</span></div>';
    }
    container.querySelector('#aw-calc').addEventListener('click',calc);
  };
})();
