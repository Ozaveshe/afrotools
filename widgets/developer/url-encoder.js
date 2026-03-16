(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.urlEncoder = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-url-encoder" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:8px;margin-bottom:12px">' +
          '<button class="aw-btn aw-btn--primary aw-url-encode" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Encode</button>' +
          '<button class="aw-btn aw-url-decode" style="padding:8px 16px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Decode</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Input</label>' +
            '<textarea class="aw-input aw-url-input" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter text or URL..."></textarea>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Output</label>' +
            '<textarea class="aw-input aw-url-output" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="aw-btn aw-url-copy" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy Output</button>' +
          '<button class="aw-btn aw-url-swap" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Swap</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var encodeMode = true;
    var inputEl = container.querySelector('.aw-url-input');
    var outputEl = container.querySelector('.aw-url-output');
    var encBtn = container.querySelector('.aw-url-encode');
    var decBtn = container.querySelector('.aw-url-decode');

    function convert() {
      var val = inputEl.value;
      if (!val) { outputEl.value = ''; return; }
      try {
        if (encodeMode) {
          outputEl.value = encodeURIComponent(val);
        } else {
          outputEl.value = decodeURIComponent(val);
        }
      } catch(e) { outputEl.value = 'Error: ' + e.message; }
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

    container.querySelector('.aw-url-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(outputEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy Output'; }, 1500); });
    });
    container.querySelector('.aw-url-swap').addEventListener('click', function() {
      var tmp = inputEl.value; inputEl.value = outputEl.value; outputEl.value = tmp;
    });
  };
})();
