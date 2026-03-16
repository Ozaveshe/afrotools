(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.base64 = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-base64" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:8px;margin-bottom:12px">' +
          '<button class="aw-btn aw-btn--primary aw-b64-encode" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Encode</button>' +
          '<button class="aw-btn aw-b64-decode" style="padding:8px 16px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Decode</button>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-left:auto"><input type="checkbox" class="aw-b64-urlsafe"> URL-safe</label>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Input</label>' +
            '<textarea class="aw-input aw-b64-input" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter text..."></textarea>' +
            '<div class="aw-b64-input-count" style="font-size:11px;color:#888;margin-top:4px">0 characters</div>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Output</label>' +
            '<textarea class="aw-input aw-b64-output" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
            '<div class="aw-b64-output-count" style="font-size:11px;color:#888;margin-top:4px">0 characters</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="aw-btn aw-b64-copy" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy Output</button>' +
          '<button class="aw-btn aw-b64-swap" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Swap</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var encodeMode = true;
    var inputEl = container.querySelector('.aw-b64-input');
    var outputEl = container.querySelector('.aw-b64-output');
    var urlSafe = container.querySelector('.aw-b64-urlsafe');
    var encBtn = container.querySelector('.aw-b64-encode');
    var decBtn = container.querySelector('.aw-b64-decode');

    function convert() {
      var val = inputEl.value;
      container.querySelector('.aw-b64-input-count').textContent = val.length + ' characters';
      if (!val) { outputEl.value = ''; container.querySelector('.aw-b64-output-count').textContent = '0 characters'; return; }
      try {
        var isUrlSafe = urlSafe.checked;
        if (encodeMode) {
          var encoded = btoa(unescape(encodeURIComponent(val)));
          if (isUrlSafe) encoded = encoded.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
          outputEl.value = encoded;
        } else {
          var toDecode = val;
          if (isUrlSafe) {
            toDecode = toDecode.replace(/-/g,'+').replace(/_/g,'/');
            var pad = 4 - (toDecode.length % 4);
            if (pad !== 4) toDecode += '='.repeat(pad);
          }
          outputEl.value = decodeURIComponent(escape(atob(toDecode)));
        }
      } catch(e) { outputEl.value = 'Error: ' + e.message; }
      container.querySelector('.aw-b64-output-count').textContent = outputEl.value.length + ' characters';
    }

    encBtn.addEventListener('click', function() {
      encodeMode = true;
      encBtn.style.background = primary; encBtn.style.color = '#fff'; encBtn.style.border = 'none';
      decBtn.style.background = inputBg; decBtn.style.color = fg; decBtn.style.border = '1px solid '+borderColor;
      convert();
    });
    decBtn.addEventListener('click', function() {
      encodeMode = false;
      decBtn.style.background = primary; decBtn.style.color = '#fff'; decBtn.style.border = 'none';
      encBtn.style.background = inputBg; encBtn.style.color = fg; encBtn.style.border = '1px solid '+borderColor;
      convert();
    });
    inputEl.addEventListener('input', convert);
    urlSafe.addEventListener('change', convert);

    container.querySelector('.aw-b64-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(outputEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy Output'; }, 1500); });
    });
    container.querySelector('.aw-b64-swap').addEventListener('click', function() {
      var tmp = inputEl.value; inputEl.value = outputEl.value; outputEl.value = tmp;
      container.querySelector('.aw-b64-input-count').textContent = inputEl.value.length + ' characters';
      container.querySelector('.aw-b64-output-count').textContent = outputEl.value.length + ' characters';
    });
  };
})();
