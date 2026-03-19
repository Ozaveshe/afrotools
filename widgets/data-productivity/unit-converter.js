(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.unitConverter = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#1a1a2e';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-uc-' + Math.random().toString(36).slice(2,8);

    var CATS = {
      length: {
        label: 'Length', icon: '📏',
        units: [
          {l:'Kilometre (km)',v:1000},{l:'Metre (m)',v:1},{l:'Centimetre (cm)',v:0.01},{l:'Millimetre (mm)',v:0.001},
          {l:'Mile',v:1609.34},{l:'Yard',v:0.9144},{l:'Foot',v:0.3048},{l:'Inch',v:0.0254},
          {l:'Nautical Mile',v:1852},{l:'Micrometre',v:0.000001}
        ],
        fromIdx:1, toIdx:4
      },
      weight: {
        label: 'Weight', icon: '⚖️',
        units: [
          {l:'Tonne (t)',v:1000},{l:'Kilogram (kg)',v:1},{l:'Gram (g)',v:0.001},{l:'Milligram (mg)',v:0.000001},
          {l:'Pound (lb)',v:0.453592},{l:'Ounce (oz)',v:0.0283495},{l:'Stone (st)',v:6.35029},{l:'Troy Ounce',v:0.0311035}
        ],
        fromIdx:1, toIdx:4
      },
      volume: {
        label: 'Volume', icon: '🧪',
        units: [
          {l:'Litre (L)',v:1},{l:'Millilitre (mL)',v:0.001},{l:'Cubic Metre',v:1000},
          {l:'US Gallon',v:3.78541},{l:'US Quart',v:0.946353},{l:'US Pint',v:0.473176},{l:'US Cup',v:0.236588},{l:'US Fluid Oz',v:0.0295735},
          {l:'UK Gallon',v:4.54609},{l:'UK Pint',v:0.568261}
        ],
        fromIdx:0, toIdx:3
      },
      temperature: {
        label: 'Temperature', icon: '🌡️',
        units: [{l:'Celsius (°C)',v:'C'},{l:'Fahrenheit (°F)',v:'F'},{l:'Kelvin (K)',v:'K'}],
        fromIdx:0, toIdx:1, special: true
      },
      speed: {
        label: 'Speed', icon: '🚀',
        units: [
          {l:'km/h',v:1},{l:'m/s',v:0.277778},{l:'mph',v:1.60934},{l:'Knot',v:1.852}
        ],
        fromIdx:0, toIdx:2
      },
      area: {
        label: 'Area', icon: '🗺️',
        units: [
          {l:'Square Kilometre',v:1000000},{l:'Hectare (ha)',v:10000},{l:'Square Metre',v:1},
          {l:'Acre',v:4046.86},{l:'Square Foot',v:0.092903},
          {l:'Nigerian Plot (648m²)',v:648},{l:'SA Morgen',v:8564.7},{l:'Ghana Acra Plot',v:2023.43}
        ],
        fromIdx:2, toIdx:3
      },
      data: {
        label: 'Data', icon: '💾',
        units: [
          {l:'Terabyte (TB)',v:1e12},{l:'Gigabyte (GB)',v:1e9},{l:'Megabyte (MB)',v:1e6},
          {l:'Kilobyte (KB)',v:1000},{l:'Byte (B)',v:1},{l:'Bit (b)',v:0.125}
        ],
        fromIdx:1, toIdx:2
      }
    };

    function toK(val, u) {
      if (u === 'C') return val + 273.15;
      if (u === 'F') return (val - 32) * 5/9 + 273.15;
      return val;
    }
    function fromK(k, u) {
      if (u === 'C') return k - 273.15;
      if (u === 'F') return (k - 273.15) * 9/5 + 32;
      return k;
    }

    function buildOpts(units) {
      return units.map(function(u, i) {
        return '<option value="' + i + '">' + u.l + '</option>';
      }).join('');
    }

    var catKeys = Object.keys(CATS);
    var tabsHtml = catKeys.map(function(k) {
      return '<button class="aw-uc-tab" data-cat="' + k + '">' + CATS[k].icon + ' ' + CATS[k].label + '</button>';
    }).join('');

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Unit Converter</div>' +
        '<div style="padding:10px 14px;overflow-x:auto;white-space:nowrap;display:flex;gap:6px;" class="aw-uc-tabs">' + tabsHtml + '</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:10px;align-items:end;">' +
            '<div>' +
              '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">From</label>' +
              '<input type="number" id="' + uid + '-fromVal" value="1" style="width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.95rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;">' +
              '<select id="' + uid + '-fromU" style="width:100%;padding:8px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.8rem;background:' + inputBg + ';color:' + text + ';margin-top:6px;outline:none;"></select>' +
            '</div>' +
            '<button id="' + uid + '-swap" style="width:36px;height:36px;border-radius:50%;background:' + accent + ';color:#fff;border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:30px;">⇄</button>' +
            '<div>' +
              '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">To</label>' +
              '<input type="number" id="' + uid + '-toVal" readonly style="width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.95rem;font-weight:600;background:' + inputBg + ';color:' + accent + ';outline:none;">' +
              '<select id="' + uid + '-toU" style="width:100%;padding:8px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.8rem;background:' + inputBg + ';color:' + text + ';margin-top:6px;outline:none;"></select>' +
            '</div>' +
          '</div>' +
          '<div id="' + uid + '-formula" style="text-align:center;font-size:.75rem;color:' + muted + ';margin-top:10px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var root = container.querySelector('#' + uid);
    var tabs = root.querySelectorAll('.aw-uc-tab');
    var fromVal = container.querySelector('#' + uid + '-fromVal');
    var toVal = container.querySelector('#' + uid + '-toVal');
    var fromU = container.querySelector('#' + uid + '-fromU');
    var toU = container.querySelector('#' + uid + '-toU');
    var formula = container.querySelector('#' + uid + '-formula');
    var swapBtn = container.querySelector('#' + uid + '-swap');
    var curCat = 'length';

    // Style tabs
    var tabStyle = 'padding:6px 12px;border-radius:6px;font-size:.72rem;font-weight:700;border:1.5px solid ' + border + ';background:transparent;color:' + muted + ';cursor:pointer;white-space:nowrap;';
    var tabActiveStyle = 'padding:6px 12px;border-radius:6px;font-size:.72rem;font-weight:700;border:1.5px solid ' + accent + ';background:' + accent + ';color:#fff;cursor:pointer;white-space:nowrap;';
    tabs.forEach(function(t) { t.setAttribute('style', tabStyle); });

    function switchCat(cat) {
      curCat = cat;
      tabs.forEach(function(t) {
        t.setAttribute('style', t.dataset.cat === cat ? tabActiveStyle : tabStyle);
      });
      var c = CATS[cat];
      var html = buildOpts(c.units);
      fromU.innerHTML = html;
      toU.innerHTML = html;
      fromU.selectedIndex = c.fromIdx;
      toU.selectedIndex = c.toIdx;
      fromVal.value = 1;
      convert();
    }

    function convert() {
      var c = CATS[curCat];
      var val = parseFloat(fromVal.value);
      if (isNaN(val)) { toVal.value = ''; formula.textContent = ''; return; }
      var fi = parseInt(fromU.value);
      var ti = parseInt(toU.value);
      var result;
      if (c.special) {
        var fUnit = c.units[fi].v;
        var tUnit = c.units[ti].v;
        result = fromK(toK(val, fUnit), tUnit);
      } else {
        var fV = c.units[fi].v;
        var tV = c.units[ti].v;
        result = (val * fV) / tV;
      }
      toVal.value = isNaN(result) ? '' : +result.toPrecision(8);
      if (!c.special) {
        var ratio = c.units[fi].v / c.units[ti].v;
        formula.textContent = '1 ' + c.units[fi].l + ' = ' + (+ratio.toPrecision(7)) + ' ' + c.units[ti].l;
      } else {
        formula.textContent = val + ' ' + c.units[fi].l + ' = ' + (+result.toPrecision(7)) + ' ' + c.units[ti].l;
      }
    }

    tabs.forEach(function(t) {
      t.addEventListener('click', function() { switchCat(t.dataset.cat); });
    });
    fromVal.addEventListener('input', convert);
    fromU.addEventListener('change', convert);
    toU.addEventListener('change', convert);
    swapBtn.addEventListener('click', function() {
      var tmp = fromU.value; fromU.value = toU.value; toU.value = tmp;
      fromVal.value = toVal.value || '';
      convert();
    });

    switchCat('length');
  };
})();
