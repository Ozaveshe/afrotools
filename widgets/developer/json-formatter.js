(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.jsonFormatter = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-json-formatter" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">JSON Input</label>' +
          '<textarea class="aw-input aw-json-input" style="width:100%;min-height:160px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Paste JSON here..."></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
          '<button class="aw-btn aw-btn--primary aw-json-format" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Format</button>' +
          '<button class="aw-btn aw-json-minify" style="padding:8px 16px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Minify</button>' +
          '<button class="aw-btn aw-json-copy" style="padding:8px 16px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Copy</button>' +
        '</div>' +
        '<div class="aw-json-status" style="font-size:12px;margin-bottom:8px"></div>' +
        '<div class="aw-field">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Output</label>' +
          '<textarea class="aw-input aw-json-output" style="width:100%;min-height:160px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var input = container.querySelector('.aw-json-input');
    var output = container.querySelector('.aw-json-output');
    var status = container.querySelector('.aw-json-status');

    function validate(str) {
      try {
        var obj = JSON.parse(str);
        status.style.color = '#16a34a';
        status.textContent = 'Valid JSON';
        return obj;
      } catch(e) {
        status.style.color = '#dc2626';
        status.textContent = 'Invalid JSON: ' + e.message;
        return null;
      }
    }

    container.querySelector('.aw-json-format').addEventListener('click', function() {
      var obj = validate(input.value);
      if (obj !== null) output.value = JSON.stringify(obj, null, 2);
    });

    container.querySelector('.aw-json-minify').addEventListener('click', function() {
      var obj = validate(input.value);
      if (obj !== null) output.value = JSON.stringify(obj);
    });

    container.querySelector('.aw-json-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(output.value).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
    });

    input.addEventListener('input', function() {
      if (input.value.trim()) validate(input.value);
      else { status.textContent = ''; }
    });
  };
})();
