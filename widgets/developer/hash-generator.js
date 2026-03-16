(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.hashGenerator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-hash-generator" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Input Text</label>' +
          '<textarea class="aw-input aw-hash-input" style="width:100%;min-height:100px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter text to hash..."></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px">' +
          '<button class="aw-btn aw-btn--primary aw-hash-generate" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Generate Hashes</button>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-hash-uppercase"> Uppercase</label>' +
        '</div>' +
        '<div class="aw-hash-results" style="display:grid;gap:10px"></div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var inputEl = container.querySelector('.aw-hash-input');
    var resultsEl = container.querySelector('.aw-hash-results');
    var upperCheck = container.querySelector('.aw-hash-uppercase');
    var algos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

    function arrayBufToHex(buf) {
      return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function generateHashes() {
      var val = inputEl.value;
      if (!val) { resultsEl.innerHTML = ''; return; }
      var encoder = new TextEncoder();
      var data = encoder.encode(val);
      var isUpper = upperCheck.checked;

      resultsEl.innerHTML = algos.map(function(a) {
        return '<div class="aw-result-box" style="background:'+inputBg+';border:1px solid '+borderColor+';border-radius:6px;padding:10px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
            '<span style="font-size:12px;font-weight:600">'+a+'</span>' +
            '<button class="aw-btn aw-hash-copy" data-algo="'+a+'" style="padding:3px 8px;background:transparent;color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Copy</button>' +
          '</div>' +
          '<div class="aw-hash-val" data-algo="'+a+'" style="font-family:\'Courier New\',monospace;font-size:12px;word-break:break-all;color:#888">Computing...</div>' +
        '</div>';
      }).join('');

      algos.forEach(function(algo) {
        crypto.subtle.digest(algo, data).then(function(buf) {
          var hex = arrayBufToHex(buf);
          if (isUpper) hex = hex.toUpperCase();
          var el = resultsEl.querySelector('.aw-hash-val[data-algo="'+algo+'"]');
          if (el) el.textContent = hex;
        });
      });

      resultsEl.querySelectorAll('.aw-hash-copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var algo = this.getAttribute('data-algo');
          var val = resultsEl.querySelector('.aw-hash-val[data-algo="'+algo+'"]').textContent;
          var b = this;
          navigator.clipboard.writeText(val).then(function() { b.textContent = 'Copied!'; setTimeout(function(){ b.textContent = 'Copy'; }, 1500); });
        });
      });
    }

    container.querySelector('.aw-hash-generate').addEventListener('click', generateHashes);
    upperCheck.addEventListener('change', generateHashes);
    inputEl.addEventListener('input', generateHashes);
  };
})();
