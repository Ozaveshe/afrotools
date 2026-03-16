(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.htmlEntities = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-html-entities" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:8px;margin-bottom:12px">' +
          '<button class="aw-btn aw-btn--primary aw-he-encode" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Encode</button>' +
          '<button class="aw-btn aw-he-decode" style="padding:8px 16px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Decode</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Input</label>' +
            '<textarea class="aw-input aw-he-input" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter HTML or text..."></textarea>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Output</label>' +
            '<textarea class="aw-input aw-he-output" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="aw-btn aw-he-copy" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy Output</button>' +
          '<button class="aw-btn aw-he-swap" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Swap</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var encodeMode = true;
    var inputEl = container.querySelector('.aw-he-input');
    var outputEl = container.querySelector('.aw-he-output');
    var encBtn = container.querySelector('.aw-he-encode');
    var decBtn = container.querySelector('.aw-he-decode');

    var entityMap = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};

    function encodeEntities(str) {
      return str.replace(/[&<>"']/g, function(c) { return entityMap[c]; });
    }

    function decodeEntities(str) {
      var ta = document.createElement('textarea');
      ta.innerHTML = str;
      return ta.value;
    }

    function convert() {
      var val = inputEl.value;
      if (!val) { outputEl.value = ''; return; }
      try {
        outputEl.value = encodeMode ? encodeEntities(val) : decodeEntities(val);
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

    container.querySelector('.aw-he-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(outputEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy Output'; }, 1500); });
    });
    container.querySelector('.aw-he-swap').addEventListener('click', function() {
      var tmp = inputEl.value; inputEl.value = outputEl.value; outputEl.value = tmp;
    });
  };
})();
