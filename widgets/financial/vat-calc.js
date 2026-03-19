(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.vat_calc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';

    var DB = {
      NG:{name:'Nigeria',currency:'\u20A6',rate:7.5},
      KE:{name:'Kenya',currency:'KSh',rate:16},
      ZA:{name:'South Africa',currency:'R',rate:15},
      GH:{name:'Ghana',currency:'GH\u20B5',rate:21.9},
      TZ:{name:'Tanzania',currency:'TZS',rate:18},
      RW:{name:'Rwanda',currency:'FRw',rate:18},
      UG:{name:'Uganda',currency:'USh',rate:18},
      ET:{name:'Ethiopia',currency:'ETB',rate:15},
      EG:{name:'Egypt',currency:'E\u00A3',rate:14},
      MA:{name:'Morocco',currency:'MAD',rate:20},
      DZ:{name:'Algeria',currency:'DA',rate:19},
      TN:{name:'Tunisia',currency:'TND',rate:19},
      CM:{name:'Cameroon',currency:'FCFA',rate:19.25},
      SN:{name:'Senegal',currency:'CFA',rate:18},
      CI:{name:"C\u00F4te d'Ivoire",currency:'CFA',rate:18},
      AO:{name:'Angola',currency:'Kz',rate:14},
      CD:{name:'DR Congo',currency:'FC',rate:16},
      ZM:{name:'Zambia',currency:'ZK',rate:16},
      ZW:{name:'Zimbabwe',currency:'ZWL',rate:15},
      BW:{name:'Botswana',currency:'P',rate:14},
      NA:{name:'Namibia',currency:'N$',rate:15},
      MZ:{name:'Mozambique',currency:'MT',rate:16},
      MW:{name:'Malawi',currency:'MK',rate:16.5},
      MU:{name:'Mauritius',currency:'Rs',rate:15},
      MG:{name:'Madagascar',currency:'Ar',rate:20},
      DJ:{name:'Djibouti',currency:'Fdj',rate:10},
      SC:{name:'Seychelles',currency:'Rs',rate:15},
      SZ:{name:'Eswatini',currency:'L',rate:15},
      LS:{name:'Lesotho',currency:'L',rate:15},
      CV:{name:'Cape Verde',currency:'$',rate:15},
      LR:{name:'Liberia',currency:'LD$',rate:10},
      SL:{name:'Sierra Leone',currency:'Le',rate:15},
      GM:{name:'Gambia',currency:'D',rate:15},
      MR:{name:'Mauritania',currency:'UM',rate:16},
      BJ:{name:'Benin',currency:'CFA',rate:18},
      BF:{name:'Burkina Faso',currency:'CFA',rate:18},
      ML:{name:'Mali',currency:'CFA',rate:18},
      NE:{name:'Niger',currency:'CFA',rate:19},
      TG:{name:'Togo',currency:'CFA',rate:18},
      GN:{name:'Guinea',currency:'FG',rate:18},
      TD:{name:'Chad',currency:'CFA',rate:18},
      GA:{name:'Gabon',currency:'CFA',rate:18},
      CG:{name:'Congo',currency:'CFA',rate:18.9},
      GQ:{name:'Equatorial Guinea',currency:'CFA',rate:15},
      CF:{name:'Central African Rep.',currency:'CFA',rate:19},
      ST:{name:'S\u00E3o Tom\u00E9 & Pr\u00EDncipe',currency:'Db',rate:15},
      SD:{name:'Sudan',currency:'SDG',rate:17},
      SS:{name:'South Sudan',currency:'SSP',rate:18},
      BI:{name:'Burundi',currency:'FBu',rate:18},
      KM:{name:'Comoros',currency:'CF',rate:10},
      SO:{name:'Somalia',currency:'Sh',rate:0},
      ER:{name:'Eritrea',currency:'Nfk',rate:0},
      LY:{name:'Libya',currency:'LD',rate:0}
    };

    var sorted = Object.keys(DB).sort(function(a, b) {
      return DB[a].name.localeCompare(DB[b].name);
    });
    var countryOptions = '';
    for (var i = 0; i < sorted.length; i++) {
      var c = sorted[i];
      countryOptions += '<option value="' + c + '">' + DB[c].name + ' \u2014 ' + DB[c].rate + '%</option>';
    }

    container.innerHTML =
      '<div class="aw aw--' + theme + '">' +
        '<div class="aw-title">Pan-African VAT Calculator</div>' +
        '<div class="aw-tabs" data-ref="mode">' +
          '<button class="aw-tab aw-tab--active" data-m="add">Add VAT</button>' +
          '<button class="aw-tab" data-m="extract">Extract VAT</button>' +
        '</div>' +
        '<div class="aw-field">' +
          '<label class="aw-label">Country</label>' +
          '<select class="aw-select" data-ref="country">' +
            '<option value="">-- Select country --</option>' +
            countryOptions +
          '</select>' +
        '</div>' +
        '<div class="aw-field">' +
          '<label class="aw-label" data-ref="label">Amount (excl. VAT)</label>' +
          '<input class="aw-input" data-ref="amount" type="text" inputmode="decimal" placeholder="0.00">' +
        '</div>' +
        '<button class="aw-btn aw-btn--primary" data-ref="calc">Calculate VAT</button>' +
        '<div class="aw-result-box" data-ref="result" style="display:none">' +
          '<div class="aw-result-label" data-ref="resLabel">Total (VAT inclusive)</div>' +
          '<div class="aw-result-main" data-ref="resMain"></div>' +
          '<div class="aw-divider"></div>' +
          '<div class="aw-result-row"><span>Net Amount</span><strong data-ref="net"></strong></div>' +
          '<div class="aw-result-row"><span>VAT Amount</span><strong data-ref="vat"></strong></div>' +
          '<div class="aw-result-row"><span>Total</span><strong data-ref="total"></strong></div>' +
        '</div>' +
        (opts.footerHTML ? '<div class="aw-footer">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var mode = 'add';
    var q = function(sel) { return container.querySelector(sel); };
    var tabs = container.querySelectorAll('[data-ref="mode"] .aw-tab');
    var countryEl = q('[data-ref="country"]');
    var amountEl = q('[data-ref="amount"]');
    var labelEl = q('[data-ref="label"]');
    var resultEl = q('[data-ref="result"]');
    var resLabelEl = q('[data-ref="resLabel"]');
    var resMainEl = q('[data-ref="resMain"]');
    var netEl = q('[data-ref="net"]');
    var vatEl = q('[data-ref="vat"]');
    var totalEl = q('[data-ref="total"]');

    var fmt = function(v, sym) {
      return sym + ' ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    var parseAmt = function(s) { return parseFloat((s || '').replace(/,/g, '')) || 0; };

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function() {
        mode = this.getAttribute('data-m');
        for (var j = 0; j < tabs.length; j++) {
          tabs[j].classList.remove('aw-tab--active');
        }
        this.classList.add('aw-tab--active');
        labelEl.textContent = mode === 'add' ? 'Amount (excl. VAT)' : 'Amount (incl. VAT)';
      });
    }

    var calculate = function() {
      var code = countryEl.value;
      var amount = parseAmt(amountEl.value);
      if (!code || !DB[code] || amount <= 0) return;
      var d = DB[code];
      var rate = d.rate / 100;
      var net, vat, total;
      if (mode === 'add') {
        net = amount; vat = net * rate; total = net + vat;
      } else {
        total = amount; net = total / (1 + rate); vat = total - net;
      }
      resultEl.style.display = '';
      resLabelEl.textContent = mode === 'add' ? 'Total (VAT inclusive)' : 'Net Amount (excl. VAT)';
      resMainEl.textContent = fmt(mode === 'add' ? total : net, d.currency);
      netEl.textContent = fmt(net, d.currency);
      vatEl.textContent = fmt(vat, d.currency) + ' (' + d.rate + '%)';
      totalEl.textContent = fmt(total, d.currency);
    };

    q('[data-ref="calc"]').addEventListener('click', calculate);
    amountEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') calculate(); });
  };
})();
