(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.randomPicker = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-rp-' + Math.random().toString(36).slice(2,8);

    var tabStyle = 'padding:8px 14px;border-radius:7px;font-size:.78rem;font-weight:700;border:1.5px solid ' + border + ';background:transparent;color:' + muted + ';cursor:pointer;';
    var tabActive = 'padding:8px 14px;border-radius:7px;font-size:.78rem;font-weight:700;border:1.5px solid ' + accent + ';background:' + accent + ';color:#fff;cursor:pointer;';
    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';
    var btnStyle = 'width:100%;padding:13px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:800;cursor:pointer;';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:480px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';display:flex;justify-content:space-between;align-items:center;">Random Picker <span id="' + uid + '-badge" style="font-size:.72rem;background:' + (theme==='dark'?'rgba(255,255,255,.08)':'#e2e8f0') + ';padding:2px 8px;border-radius:4px;color:' + muted + ';">0 items</span></div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px;">' +
            '<button class="aw-rp-tab" data-tab="names" style="' + tabActive + '">Names</button>' +
            '<button class="aw-rp-tab" data-tab="numbers" style="' + tabStyle + '">Numbers</button>' +
            '<button class="aw-rp-tab" data-tab="coin" style="' + tabStyle + '">Coin Flip</button>' +
          '</div>' +
          '<div id="' + uid + '-names">' +
            '<div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Enter names/items (one per line)</label>' +
            '<textarea id="' + uid + '-list" style="' + fieldStyle + 'min-height:100px;resize:vertical;">Chinedu\nAmina\nThabo\nAma\nKwame\nFatima\nSipho\nNgozi</textarea></div>' +
            '<div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">How many to pick?</label>' +
            '<input type="number" id="' + uid + '-pickN" value="1" min="1" max="100" style="' + fieldStyle + '"></div>' +
            '<button id="' + uid + '-pickBtn" style="' + btnStyle + '">Pick Random Name(s)</button>' +
          '</div>' +
          '<div id="' + uid + '-numbers" style="display:none;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
              '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Minimum</label><input type="number" id="' + uid + '-min" value="1" style="' + fieldStyle + '"></div>' +
              '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Maximum</label><input type="number" id="' + uid + '-max" value="100" style="' + fieldStyle + '"></div>' +
            '</div>' +
            '<div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">How many?</label><input type="number" id="' + uid + '-numN" value="1" min="1" style="' + fieldStyle + '"></div>' +
            '<button id="' + uid + '-numBtn" style="' + btnStyle + '">Generate Random Number(s)</button>' +
          '</div>' +
          '<div id="' + uid + '-coin" style="display:none;">' +
            '<p style="font-size:.85rem;color:' + muted + ';margin-bottom:14px;">Flip a fair coin. 50/50 chance. Uses cryptographic randomness.</p>' +
            '<button id="' + uid + '-coinBtn" style="' + btnStyle + '">Flip Coin</button>' +
          '</div>' +
          '<div id="' + uid + '-display" style="display:none;margin-top:16px;text-align:center;padding:24px;background:' + (theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)') + ';border-radius:10px;">' +
            '<div id="' + uid + '-rtext" style="font-size:1.8rem;font-weight:800;color:#38bdf8;word-break:break-word;"></div>' +
            '<div id="' + uid + '-rsub" style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:6px;"></div>' +
          '</div>' +
          '<div id="' + uid + '-hist" style="margin-top:10px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var root = document.getElementById(uid);
    var curTab = 'names';
    var histArr = [];

    function cryptoRandom(max) {
      if (window.crypto && window.crypto.getRandomValues) {
        var arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0] % max;
      }
      return Math.floor(Math.random() * max);
    }

    function showResult(t, sub) {
      var d = document.getElementById(uid + '-display');
      d.style.display = 'block';
      document.getElementById(uid + '-rtext').textContent = t;
      document.getElementById(uid + '-rsub').textContent = sub || '';
    }

    function addHist(t) {
      histArr.unshift(t);
      if (histArr.length > 15) histArr.pop();
      var histEl = document.getElementById(uid + '-hist');
      histEl.innerHTML = histArr.map(function(h) {
        return '<span style="display:inline-block;padding:3px 10px;background:' + (theme==='dark'?'rgba(255,255,255,.08)':'#EFF6FF') + ';border:1px solid ' + (theme==='dark'?'rgba(255,255,255,.12)':'#BFDBFE') + ';border-radius:16px;font-size:.72rem;font-weight:600;color:' + (theme==='dark'?'#93c5fd':'#1e40af') + ';margin:2px;">' + h + '</span>';
      }).join('');
    }

    // Tab switching
    var tabs = root.querySelectorAll('.aw-rp-tab');
    tabs.forEach(function(t) {
      t.addEventListener('click', function() {
        curTab = t.dataset.tab;
        tabs.forEach(function(b) { b.setAttribute('style', b.dataset.tab === curTab ? tabActive : tabStyle); });
        ['names','numbers','coin'].forEach(function(id) {
          document.getElementById(uid + '-' + id).style.display = id === curTab ? 'block' : 'none';
        });
      });
    });

    // Pick names
    document.getElementById(uid + '-pickBtn').addEventListener('click', function() {
      var raw = document.getElementById(uid + '-list').value.trim();
      if (!raw) { alert('Enter some names first'); return; }
      var names = raw.split('\n').map(function(n){ return n.trim(); }).filter(Boolean);
      var count = Math.min(parseInt(document.getElementById(uid + '-pickN').value) || 1, names.length);
      document.getElementById(uid + '-badge').textContent = names.length + ' items';
      var shuffled = names.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = cryptoRandom(i + 1);
        var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      var picked = shuffled.slice(0, count);
      showResult(picked.join(', '), count === 1 ? 'Selected from ' + names.length + ' items' : 'Picked ' + count + ' from ' + names.length + ' items');
      picked.forEach(function(p) { addHist(p); });
    });

    // Pick numbers
    document.getElementById(uid + '-numBtn').addEventListener('click', function() {
      var min = parseInt(document.getElementById(uid + '-min').value) || 0;
      var max = parseInt(document.getElementById(uid + '-max').value) || 100;
      var count = parseInt(document.getElementById(uid + '-numN').value) || 1;
      if (min >= max) { alert('Minimum must be less than maximum'); return; }
      var range = max - min + 1;
      if (count > range) { alert('Range too small for that many unique numbers'); return; }
      var picked = {};
      var arr = [];
      while (arr.length < count) {
        var n = min + cryptoRandom(range);
        if (!picked[n]) { picked[n] = true; arr.push(n); }
      }
      arr.sort(function(a,b){ return a-b; });
      showResult(arr.join(', '), count === 1 ? 'Random number between ' + min + ' and ' + max : 'Picked ' + count + ' unique numbers');
      arr.forEach(function(n) { addHist(String(n)); });
    });

    // Coin flip
    document.getElementById(uid + '-coinBtn').addEventListener('click', function() {
      var result = cryptoRandom(2) === 0 ? 'Heads' : 'Tails';
      showResult(result, 'The coin landed on ' + result.toLowerCase());
      addHist(result);
    });
  };
})();
