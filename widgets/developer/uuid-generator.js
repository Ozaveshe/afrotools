(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.uuidGenerator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-uuid-generator" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">' +
          '<button class="aw-btn aw-btn--primary aw-uuid-gen" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Generate UUID</button>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-uuid-upper"> Uppercase</label>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-uuid-braces"> Braces</label>' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-left:auto">' +
            '<label>Count:</label>' +
            '<input type="number" class="aw-input aw-uuid-count" value="1" min="1" max="100" style="width:60px;padding:4px 6px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+'">' +
          '</div>' +
        '</div>' +
        '<div class="aw-field">' +
          '<textarea class="aw-input aw-uuid-output" style="width:100%;min-height:120px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="aw-btn aw-uuid-copy" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var outputEl = container.querySelector('.aw-uuid-output');

    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function generate() {
      var count = parseInt(container.querySelector('.aw-uuid-count').value) || 1;
      count = Math.max(1, Math.min(100, count));
      var upper = container.querySelector('.aw-uuid-upper').checked;
      var braces = container.querySelector('.aw-uuid-braces').checked;
      var uuids = [];
      for (var i = 0; i < count; i++) {
        var uuid = generateUUID();
        if (upper) uuid = uuid.toUpperCase();
        if (braces) uuid = '{' + uuid + '}';
        uuids.push(uuid);
      }
      outputEl.value = uuids.join('\n');
    }

    container.querySelector('.aw-uuid-gen').addEventListener('click', generate);
    container.querySelector('.aw-uuid-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(outputEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1500); });
    });

    generate();
  };
})();
