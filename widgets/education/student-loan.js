(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.StudentLoan = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#2563eb';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    var PRESETS = {
      nsfas: { name: 'NSFAS (South Africa) — 0%', rate: 0, grace: 12, currency: 'ZAR', amount: 150000 },
      helb: { name: 'HELB (Kenya) — 4%', rate: 4, grace: 12, currency: 'KES', amount: 500000 },
      'private': { name: 'Private Education Loan', rate: 18, grace: 6, currency: 'NGN', amount: 2000000 },
      custom: { name: 'Custom', rate: 10, grace: 0, currency: 'NGN', amount: 1000000 }
    };

    container.innerHTML = '<div class="aw-student-loan" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Student Loan Repayment Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Loan Type</label>' +
            '<select id="aw-sl-type" '+s+'>' +
              '<option value="nsfas">NSFAS (South Africa) — 0%</option>' +
              '<option value="helb">HELB (Kenya) — 4%</option>' +
              '<option value="private" selected>Private Education Loan</option>' +
              '<option value="custom">Custom</option>' +
            '</select></div>' +
          '<div><label '+lbl+'>Currency</label>' +
            '<select id="aw-sl-currency" '+s+'>' +
              '<option value="NGN">NGN (Naira)</option><option value="KES">KES (Shilling)</option><option value="ZAR">ZAR (Rand)</option><option value="GHS">GHS (Cedi)</option>' +
            '</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Loan Amount</label><input type="number" id="aw-sl-amount" value="2000000" min="10000" step="50000" '+s+'></div>' +
          '<div><label '+lbl+'>Annual Interest Rate %</label><input type="number" id="aw-sl-rate" value="18" min="0" max="40" step="0.5" '+s+'></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Repayment Period (Years)</label><input type="number" id="aw-sl-years" value="5" min="1" max="30" '+s+'></div>' +
          '<div><label '+lbl+'>Grace Period (Months)</label><input type="number" id="aw-sl-grace" value="12" min="0" max="36" '+s+'></div>' +
        '</div>' +
        '<div style="margin-bottom:14px"><label '+lbl+'>Extra Monthly Payment (optional)</label><input type="number" id="aw-sl-extra" value="0" min="0" step="1000" '+s+'></div>' +
        '<button id="aw-sl-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1e40af,'+accent+');color:#fff;font-family:inherit">Calculate Repayment</button>' +
        '<div id="aw-sl-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#1e3a5f':'#eff6ff')+';border:1px solid '+(isDark?'#2563eb':'#bfdbfe')+';border-radius:8px;grid-column:1/-1"><div id="aw-sl-monthly" style="font-size:2rem;font-weight:900;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Monthly Payment</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-sl-total" style="font-size:1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Repaid</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-sl-interest" style="font-size:1rem;font-weight:800;color:#dc2626"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Interest</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-sl-payoff" style="font-size:1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Payoff Time</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-sl-grace-int" style="font-size:1rem;font-weight:800;color:#d97706"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Grace Period Interest</div></div>' +
          '</div>' +
          '<div id="aw-sl-schedule" style="margin-top:14px;max-height:280px;overflow-y:auto;border:1px solid '+border+';border-radius:8px"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    // Preset switching
    container.querySelector('#aw-sl-type').addEventListener('change', function() {
      var p = PRESETS[this.value];
      if (p) {
        container.querySelector('#aw-sl-rate').value = p.rate;
        container.querySelector('#aw-sl-grace').value = p.grace;
        container.querySelector('#aw-sl-currency').value = p.currency;
        container.querySelector('#aw-sl-amount').value = p.amount;
      }
    });

    function fmt(n, cur) { return cur + ' ' + Math.round(n).toLocaleString('en'); }

    function calc() {
      var currency = container.querySelector('#aw-sl-currency').value;
      var principal = parseFloat(container.querySelector('#aw-sl-amount').value) || 0;
      var annualRate = (parseFloat(container.querySelector('#aw-sl-rate').value) || 0) / 100;
      var monthlyRate = annualRate / 12;
      var years = parseInt(container.querySelector('#aw-sl-years').value) || 1;
      var grace = parseInt(container.querySelector('#aw-sl-grace').value) || 0;
      var extra = parseFloat(container.querySelector('#aw-sl-extra').value) || 0;
      var totalMonths = years * 12;

      if (principal <= 0) return;

      // Interest accrues during grace period
      var balanceAfterGrace = principal;
      for (var m = 0; m < grace; m++) balanceAfterGrace += balanceAfterGrace * monthlyRate;

      // Monthly payment (amortisation formula)
      var monthlyPayment;
      if (monthlyRate === 0) {
        monthlyPayment = balanceAfterGrace / totalMonths;
      } else {
        monthlyPayment = balanceAfterGrace * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }

      monthlyPayment += extra;
      var balance = balanceAfterGrace;
      var totalPaid = 0;
      var totalInterest = 0;
      var rows = [];
      var month = 0;

      while (balance > 0.5 && month < 600) {
        month++;
        var interest = balance * monthlyRate;
        var payment = Math.min(monthlyPayment, balance + interest);
        var principalPart = payment - interest;
        balance -= principalPart;
        if (balance < 0) balance = 0;
        totalPaid += payment;
        totalInterest += interest;

        if (month <= 12 || month % 12 === 0 || balance <= 0) {
          rows.push({ month: month, payment: payment, interest: interest, principal: principalPart, balance: balance });
        }
      }

      var graceInterest = balanceAfterGrace - principal;

      container.querySelector('#aw-sl-monthly').textContent = fmt(monthlyPayment - extra, currency);
      container.querySelector('#aw-sl-total').textContent = fmt(totalPaid, currency);
      container.querySelector('#aw-sl-interest').textContent = fmt(totalInterest, currency);
      container.querySelector('#aw-sl-payoff').textContent = month + ' months (' + (month / 12).toFixed(1) + ' yrs)';
      container.querySelector('#aw-sl-grace-int').textContent = fmt(graceInterest, currency);

      // Amortization schedule table
      var thStyle = 'style="padding:7px;text-align:right;font-size:.68rem;font-weight:700;text-transform:uppercase;background:'+(isDark?'#1e3a5f':'#eff6ff')+';color:'+(isDark?'#93c5fd':'#1e40af')+';border-bottom:2px solid '+(isDark?'#2563eb':'#bfdbfe')+'"';
      var tdStyle = 'style="padding:6px 7px;text-align:right;font-size:.75rem;color:'+text+';border-bottom:1px solid '+border+'"';
      var table = '<table style="width:100%;border-collapse:collapse"><thead><tr>' +
        '<th '+thStyle+' style="text-align:left;padding:7px">Month</th>' +
        '<th '+thStyle+'>Payment</th><th '+thStyle+'>Interest</th><th '+thStyle+'>Principal</th><th '+thStyle+'>Balance</th>' +
        '</tr></thead><tbody>';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        table += '<tr><td '+tdStyle+' style="text-align:left;font-weight:600;padding:6px 7px">' + r.month + '</td>' +
          '<td '+tdStyle+'>' + fmt(r.payment, '') + '</td>' +
          '<td '+tdStyle+'>' + fmt(r.interest, '') + '</td>' +
          '<td '+tdStyle+'>' + fmt(r.principal, '') + '</td>' +
          '<td '+tdStyle+' style="font-weight:700;text-align:right;padding:6px 7px">' + fmt(r.balance, '') + '</td></tr>';
      }
      table += '</tbody></table>';
      container.querySelector('#aw-sl-schedule').innerHTML = table;

      container.querySelector('#aw-sl-result').style.display = 'block';
    }

    container.querySelector('#aw-sl-btn').addEventListener('click', calc);
  };
})();
