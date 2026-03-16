(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.CryptoTax = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#f59e0b';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    var TAX_INFO = {
      NG: { name: 'Nigeria', symbol: '\u20A6', cgtRate: 0.10, marginalRates: { low: 0.07, mid: 0.15, high: 0.24 }, exclusion: 0, digitalAssetTax: 0 },
      KE: { name: 'Kenya', symbol: 'KES', cgtRate: 0.15, digitalAssetTax: 0.03, marginalRates: { low: 0.10, mid: 0.25, high: 0.35 }, exclusion: 0 },
      ZA: { name: 'South Africa', symbol: 'R', cgtRate: 0.18, inclusionRate: 0.40, exclusion: 40000, marginalRates: { low: 0.18, mid: 0.31, high: 0.45 }, digitalAssetTax: 0 },
      GH: { name: 'Ghana', symbol: 'GH\u20B5', cgtRate: 0.15, marginalRates: { low: 0.05, mid: 0.175, high: 0.30 }, exclusion: 0, digitalAssetTax: 0 }
    };

    container.innerHTML = '<div class="aw-crypto-tax" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">African Crypto Tax Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Country</label>' +
            '<select id="aw-ctx-country" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="ZA">South Africa</option><option value="GH">Ghana</option>' +
            '</select></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Transaction Type</label>' +
            '<select id="aw-ctx-type" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="sell">Sold Crypto for Fiat</option><option value="swap">Swapped Crypto</option><option value="spend">Spent Crypto</option><option value="mining">Mining / Staking Income</option>' +
            '</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Cost Basis (Purchase Price)</label>' +
            '<input type="number" id="aw-ctx-cost" value="500000" min="0" step="10000" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Sale / Disposal Price</label>' +
            '<input type="number" id="aw-ctx-sale" value="1500000" min="0" step="10000" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Transaction Fees</label>' +
            '<input type="number" id="aw-ctx-fees" value="5000" min="0" step="1000" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Income Bracket</label>' +
            '<select id="aw-ctx-bracket" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="low">Low</option><option value="mid">Medium</option><option value="high">High</option>' +
            '</select></div>' +
        '</div>' +
        '<button id="aw-ctx-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#d97706,'+accent+');color:#fff;font-family:inherit">Calculate Tax</button>' +
        '<div id="aw-ctx-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div id="aw-ctx-tax-box" style="text-align:center;padding:16px;border-radius:8px;grid-column:1/-1"></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ctx-gain" style="font-size:1.3rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Capital Gain</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ctx-rate" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Effective Rate</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ctx-after" style="font-size:1.3rem;font-weight:800;color:#16a34a"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">After-Tax Profit</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ctx-method" style="font-size:.82rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Tax Method</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var c = container.querySelector('#aw-ctx-country').value;
      var t = TAX_INFO[c];
      var costBasis = parseFloat(container.querySelector('#aw-ctx-cost').value) || 0;
      var salePrice = parseFloat(container.querySelector('#aw-ctx-sale').value) || 0;
      var fees = parseFloat(container.querySelector('#aw-ctx-fees').value) || 0;
      var txType = container.querySelector('#aw-ctx-type').value;
      var bracket = container.querySelector('#aw-ctx-bracket').value;

      var gain = salePrice - costBasis - fees;
      var fmt = function(n) { return t.symbol + ' ' + Math.round(Math.abs(n)).toLocaleString('en'); };

      var tax = 0, method = '', effectiveRate = 0;

      if (gain <= 0) {
        var taxBox = container.querySelector('#aw-ctx-tax-box');
        taxBox.style.background = '#dcfce7';
        taxBox.style.border = '1px solid #86efac';
        taxBox.innerHTML = '<div style="font-size:1.8rem;font-weight:800;color:#166534">Capital Loss: ' + fmt(gain) + '</div><div style="font-size:.68rem;color:#166534;font-weight:600;margin-top:3px">No tax payable on losses</div>';
        container.querySelector('#aw-ctx-gain').textContent = fmt(gain);
        container.querySelector('#aw-ctx-rate').textContent = '0%';
        container.querySelector('#aw-ctx-after').textContent = fmt(gain);
        container.querySelector('#aw-ctx-method').textContent = 'N/A';
        container.querySelector('#aw-ctx-result').style.display = 'block';
        return;
      }

      if (c === 'ZA') {
        var taxableGain = Math.max(0, gain - t.exclusion);
        var includedGain = taxableGain * t.inclusionRate;
        var marginalRate = t.marginalRates[bracket];
        tax = includedGain * marginalRate;
        method = 'CGT: ' + (t.inclusionRate * 100) + '% inclusion x ' + (marginalRate * 100) + '% marginal';
        effectiveRate = gain > 0 ? (tax / gain * 100) : 0;
      } else if (c === 'KE') {
        var dat = salePrice * t.digitalAssetTax;
        var cgt = gain * t.cgtRate;
        tax = Math.max(dat, cgt);
        method = dat > cgt ? 'Digital Asset Tax: 3% of sale' : 'CGT: ' + (t.cgtRate * 100) + '% of gain';
        effectiveRate = gain > 0 ? (tax / gain * 100) : 0;
      } else {
        var cgtTax = gain * t.cgtRate;
        var incomeTax = gain * t.marginalRates[bracket];
        if (txType === 'mining') {
          tax = incomeTax;
          method = 'Income tax: ' + (t.marginalRates[bracket] * 100) + '%';
        } else {
          tax = Math.min(cgtTax, incomeTax);
          method = cgtTax < incomeTax ? 'CGT: ' + (t.cgtRate * 100) + '%' : 'Income: ' + (t.marginalRates[bracket] * 100) + '%';
        }
        effectiveRate = gain > 0 ? (tax / gain * 100) : 0;
      }

      var taxBox = container.querySelector('#aw-ctx-tax-box');
      taxBox.style.background = isDark ? '#451a03' : '#fffbeb';
      taxBox.style.border = '1px solid ' + (isDark ? '#92400e' : '#fde68a');
      taxBox.innerHTML = '<div style="font-size:1.8rem;font-weight:800;color:' + accent + '">' + fmt(tax) + '</div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Estimated Tax</div>';

      container.querySelector('#aw-ctx-gain').textContent = fmt(gain);
      container.querySelector('#aw-ctx-rate').textContent = effectiveRate.toFixed(1) + '%';
      container.querySelector('#aw-ctx-after').textContent = fmt(gain - tax);
      container.querySelector('#aw-ctx-method').textContent = method;

      container.querySelector('#aw-ctx-result').style.display = 'block';
    }

    container.querySelector('#aw-ctx-btn').addEventListener('click', calc);
  };
})();
