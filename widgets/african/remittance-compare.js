(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.remittanceCompare = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#007AFF';
    var uid = 'aw-rc-' + Math.random().toString(36).slice(2,8);

    var PROVIDERS = [
      {name:'Wise',fee:function(a){return Math.max(3,a*0.006);},margin:0.003,speed:'1-2 days',method:'Bank transfer'},
      {name:'Lemfi',fee:function(a){return Math.max(2,a*0.005);},margin:0.005,speed:'Instant-1 day',method:'Bank/Mobile'},
      {name:'Remitly',fee:function(a){return a<200?3.99:0;},margin:0.01,speed:'Min-1 day',method:'Bank/Mobile/Cash'},
      {name:'WorldRemit',fee:function(a){return a<200?3.99:a<500?4.99:5.99;},margin:0.012,speed:'Min-2 days',method:'Mobile/Cash'},
      {name:'Western Union',fee:function(a){return a<200?8:a<500?12:a<1000?15:25;},margin:0.025,speed:'Minutes',method:'Cash pickup'},
      {name:'MoneyGram',fee:function(a){return a<200?6:a<500?10:a<1000?12:20;},margin:0.022,speed:'Min-1 day',method:'Cash/Mobile'},
      {name:'Chipper Cash',fee:function(a){return 0;},margin:0.015,speed:'Instant',method:'Mobile wallet'},
      {name:'SendWave',fee:function(a){return 0;},margin:0.018,speed:'Instant',method:'Mobile money'},
      {name:'OFX',fee:function(a){return a<1000?15:0;},margin:0.005,speed:'1-3 days',method:'Bank transfer'},
      {name:'Pangea',fee:function(a){return a<500?2.95:4.95;},margin:0.008,speed:'1-3 days',method:'Bank/Cash'}
    ];

    var FROM_RATES = {USD:1,GBP:0.79,EUR:0.92,CAD:1.37};
    var FROM_SYMS = {USD:'$',GBP:'\u00A3',EUR:'\u20AC',CAD:'C$'};
    var TO_RATES = {NGN:1600,KES:130,GHS:16,ZAR:18.5,EGP:30,TZS:2500,UGX:3800,RWF:1300,XOF:620,ETB:52,ZMW:25};
    var TO_SYMS = {NGN:'\u20A6',KES:'KSh',GHS:'GH\u20B5',ZAR:'R',EGP:'EGP',TZS:'TSh',UGX:'USh',RWF:'RF',XOF:'CFA',ETB:'ETB',ZMW:'ZMW'};

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    function buildOpts(obj) {
      var html = '';
      for (var k in obj) { html += '<option value="' + k + '">' + k + '</option>'; }
      return html;
    }

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:560px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Remittance Comparator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Send From</label>' +
              '<select id="' + uid + '-from" style="' + fieldStyle + '">' + buildOpts(FROM_RATES) + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Send To</label>' +
              '<select id="' + uid + '-to" style="' + fieldStyle + '">' + buildOpts(TO_RATES) + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Amount</label>' +
              '<input type="number" id="' + uid + '-amount" value="500" min="1" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Compare Providers</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:14px;"></div>' +
          '<div id="' + uid + '-savings" style="display:none;margin-top:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;text-align:center;font-size:.82rem;font-weight:700;color:#92400e;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function compare() {
      var fromCur = document.getElementById(uid + '-from').value;
      var toCur = document.getElementById(uid + '-to').value;
      var amount = parseFloat(document.getElementById(uid + '-amount').value) || 500;

      var baseRate = TO_RATES[toCur] / FROM_RATES[fromCur];
      var sym = FROM_SYMS[fromCur];
      var toSym = TO_SYMS[toCur];

      var results = PROVIDERS.map(function(p) {
        var fee = p.fee(amount);
        var effectiveRate = baseRate * (1 - p.margin);
        var received = (amount - fee) * effectiveRate;
        var midMarketReceived = amount * baseRate;
        var totalCost = fee + (midMarketReceived - received) / baseRate;
        var pct = (totalCost / amount * 100);
        return {name:p.name, fee:fee, effectiveRate:effectiveRate, received:received, totalCost:totalCost, pct:pct, speed:p.speed, method:p.method};
      });
      results.sort(function(a, b) { return a.totalCost - b.totalCost; });

      var html = '';
      results.forEach(function(r, i) {
        var isBest = i === 0;
        var cardBg = isBest ? (theme==='dark'?'rgba(0,122,255,.1)':'#eff6ff') : inputBg;
        var cardBorder = isBest ? '#007AFF' : border;
        html += '<div style="background:' + cardBg + ';border:1.5px solid ' + cardBorder + ';border-radius:8px;padding:12px;margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
            '<div style="font-size:.85rem;font-weight:700;color:' + text + ';">' + r.name + (isBest ? ' <span style="font-size:.62rem;background:#007AFF;color:#fff;padding:1px 6px;border-radius:3px;">CHEAPEST</span>' : '') + '</div>' +
            '<div style="font-size:.95rem;font-weight:800;color:' + accent + ';">' + toSym + Math.round(r.received).toLocaleString() + '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' +
            '<div><div style="font-size:.58rem;color:' + muted + ';text-transform:uppercase;font-weight:600;">Fee</div><div style="font-size:.78rem;font-weight:700;">' + sym + r.fee.toFixed(2) + '</div></div>' +
            '<div><div style="font-size:.58rem;color:' + muted + ';text-transform:uppercase;font-weight:600;">Rate</div><div style="font-size:.78rem;font-weight:700;">1=' + toSym + r.effectiveRate.toFixed(2) + '</div></div>' +
            '<div><div style="font-size:.58rem;color:' + muted + ';text-transform:uppercase;font-weight:600;">Cost</div><div style="font-size:.78rem;font-weight:700;">' + r.pct.toFixed(1) + '%</div></div>' +
            '<div><div style="font-size:.58rem;color:' + muted + ';text-transform:uppercase;font-weight:600;">Speed</div><div style="font-size:.78rem;font-weight:700;">' + r.speed + '</div></div>' +
          '</div></div>';
      });

      document.getElementById(uid + '-results').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';

      if (results.length > 1) {
        var best = results[0], worst = results[results.length - 1];
        var savings = worst.totalCost - best.totalCost;
        document.getElementById(uid + '-savings').textContent = 'Save ' + sym + savings.toFixed(2) + ' by choosing ' + best.name + ' over ' + worst.name + '. That\'s ' + sym + (savings * 12).toFixed(0) + '/year on monthly transfers.';
        document.getElementById(uid + '-savings').style.display = 'block';
      }
    }

    document.getElementById(uid + '-btn').addEventListener('click', compare);
    compare();
  };
})();
