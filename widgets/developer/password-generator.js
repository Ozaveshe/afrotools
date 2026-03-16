(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.passwordGenerator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-password-gen" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Generated Password</label>' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" class="aw-input aw-pwd-output" readonly style="flex:1;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:15px;background:'+inputBg+';color:'+fg+';box-sizing:border-box">' +
            '<button class="aw-btn aw-pwd-copy" style="padding:8px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy</button>' +
            '<button class="aw-btn aw-btn--primary aw-pwd-gen" style="padding:8px 12px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Generate</button>' +
          '</div>' +
        '</div>' +
        '<div class="aw-pwd-strength" style="height:6px;border-radius:3px;background:'+borderColor+';margin-bottom:4px;overflow:hidden"><div class="aw-pwd-strength-bar" style="height:100%;width:0;border-radius:3px;transition:width 0.3s,background 0.3s"></div></div>' +
        '<div class="aw-pwd-strength-text" style="font-size:11px;color:#888;margin-bottom:12px"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Length: <span class="aw-pwd-len-val">16</span></label>' +
            '<input type="range" class="aw-pwd-length" min="4" max="128" value="16" style="width:100%">' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">' +
            '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-upper" checked> Uppercase</label>' +
            '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-lower" checked> Lowercase</label>' +
            '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-nums" checked> Numbers</label>' +
            '<label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-syms" checked> Symbols</label>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var LOWER = 'abcdefghijklmnopqrstuvwxyz';
    var NUMS = '0123456789';
    var SYMS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    var outputEl = container.querySelector('.aw-pwd-output');
    var lengthEl = container.querySelector('.aw-pwd-length');
    var lenValEl = container.querySelector('.aw-pwd-len-val');
    var strengthBar = container.querySelector('.aw-pwd-strength-bar');
    var strengthText = container.querySelector('.aw-pwd-strength-text');

    function generate() {
      var len = parseInt(lengthEl.value) || 16;
      var charset = '';
      if (container.querySelector('.aw-pwd-upper').checked) charset += UPPER;
      if (container.querySelector('.aw-pwd-lower').checked) charset += LOWER;
      if (container.querySelector('.aw-pwd-nums').checked) charset += NUMS;
      if (container.querySelector('.aw-pwd-syms').checked) charset += SYMS;
      if (!charset) { charset = LOWER; }

      var arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      var pwd = '';
      for (var i = 0; i < len; i++) {
        pwd += charset[arr[i] % charset.length];
      }
      outputEl.value = pwd;
      updateStrength(pwd);
    }

    function updateStrength(pwd) {
      var len = pwd.length;
      var types = 0;
      if (/[a-z]/.test(pwd)) types++;
      if (/[A-Z]/.test(pwd)) types++;
      if (/[0-9]/.test(pwd)) types++;
      if (/[^a-zA-Z0-9]/.test(pwd)) types++;

      var score = 0;
      if (len >= 8) score++;
      if (len >= 12) score++;
      if (len >= 16) score++;
      if (len >= 24) score++;
      score += types;

      var pct, color, label;
      if (score <= 2) { pct = 20; color = '#dc2626'; label = 'Very Weak'; }
      else if (score <= 4) { pct = 40; color = '#f97316'; label = 'Weak'; }
      else if (score <= 5) { pct = 60; color = '#eab308'; label = 'Fair'; }
      else if (score <= 6) { pct = 80; color = '#22c55e'; label = 'Strong'; }
      else { pct = 100; color = '#16a34a'; label = 'Very Strong'; }

      strengthBar.style.width = pct + '%';
      strengthBar.style.background = color;
      strengthText.textContent = label + ' (' + Math.floor(Math.log2(Math.pow(pwd.length > 0 ? 94 : 1, pwd.length))) + ' bits entropy est.)';
    }

    lengthEl.addEventListener('input', function() {
      lenValEl.textContent = this.value;
      generate();
    });

    container.querySelector('.aw-pwd-gen').addEventListener('click', generate);
    container.querySelector('.aw-pwd-upper').addEventListener('change', generate);
    container.querySelector('.aw-pwd-lower').addEventListener('change', generate);
    container.querySelector('.aw-pwd-nums').addEventListener('change', generate);
    container.querySelector('.aw-pwd-syms').addEventListener('change', generate);

    container.querySelector('.aw-pwd-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(outputEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1500); });
    });

    generate();
  };
})();
