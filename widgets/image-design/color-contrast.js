(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.colorContrast = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-color-contrast" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Foreground</label>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<input type="color" class="aw-cc-fg" value="#000000" style="width:50px;height:40px;border:none;cursor:pointer;border-radius:6px;padding:0">' +
              '<input type="text" class="aw-input aw-cc-fg-hex" value="#000000" style="flex:1;padding:8px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box">' +
            '</div>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Background</label>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<input type="color" class="aw-cc-bg" value="#FFFFFF" style="width:50px;height:40px;border:none;cursor:pointer;border-radius:6px;padding:0">' +
              '<input type="text" class="aw-input aw-cc-bg-hex" value="#FFFFFF" style="flex:1;padding:8px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="aw-cc-preview" style="padding:20px;border-radius:8px;margin-bottom:12px;text-align:center;border:1px solid '+borderColor+'">' +
          '<div style="font-size:24px;font-weight:700;margin-bottom:4px">Sample Text</div>' +
          '<div style="font-size:14px">The quick brown fox jumps over the lazy dog</div>' +
        '</div>' +
        '<div class="aw-result-box" style="text-align:center;padding:16px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px;margin-bottom:12px">' +
          '<div style="font-size:14px;font-weight:600;margin-bottom:4px">Contrast Ratio</div>' +
          '<div class="aw-cc-ratio" style="font-size:36px;font-weight:700;color:'+primary+'">21:1</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' +
          '<div class="aw-result-box aw-cc-aa-normal" style="padding:10px;border-radius:8px;border:1px solid '+borderColor+';text-align:center">' +
            '<div style="font-size:11px;font-weight:600;margin-bottom:2px">AA Normal</div>' +
            '<div style="font-size:11px;color:#888">4.5:1 required</div>' +
            '<div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div>' +
          '</div>' +
          '<div class="aw-result-box aw-cc-aa-large" style="padding:10px;border-radius:8px;border:1px solid '+borderColor+';text-align:center">' +
            '<div style="font-size:11px;font-weight:600;margin-bottom:2px">AA Large</div>' +
            '<div style="font-size:11px;color:#888">3:1 required</div>' +
            '<div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div>' +
          '</div>' +
          '<div class="aw-result-box aw-cc-aaa-normal" style="padding:10px;border-radius:8px;border:1px solid '+borderColor+';text-align:center">' +
            '<div style="font-size:11px;font-weight:600;margin-bottom:2px">AAA Normal</div>' +
            '<div style="font-size:11px;color:#888">7:1 required</div>' +
            '<div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div>' +
          '</div>' +
          '<div class="aw-result-box aw-cc-aaa-large" style="padding:10px;border-radius:8px;border:1px solid '+borderColor+';text-align:center">' +
            '<div style="font-size:11px;font-weight:600;margin-bottom:2px">AAA Large</div>' +
            '<div style="font-size:11px;color:#888">4.5:1 required</div>' +
            '<div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:8px;text-align:center">' +
          '<button class="aw-btn aw-cc-swap" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Swap Colors</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var fgPicker = container.querySelector('.aw-cc-fg');
    var bgPicker = container.querySelector('.aw-cc-bg');
    var fgHex = container.querySelector('.aw-cc-fg-hex');
    var bgHex = container.querySelector('.aw-cc-bg-hex');
    var previewEl = container.querySelector('.aw-cc-preview');
    var ratioEl = container.querySelector('.aw-cc-ratio');

    function hexToRgb(hex) {
      hex = hex.replace(/^#/, '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      return {
        r: parseInt(hex.substring(0,2),16),
        g: parseInt(hex.substring(2,4),16),
        b: parseInt(hex.substring(4,6),16)
      };
    }

    function relativeLuminance(r, g, b) {
      var rs = r / 255, gs = g / 255, bs = b / 255;
      rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
      gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
      bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function contrastRatio(l1, l2) {
      var lighter = Math.max(l1, l2);
      var darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function setStatus(selector, pass) {
      var el = container.querySelector(selector + ' .aw-cc-status');
      el.textContent = pass ? 'PASS' : 'FAIL';
      el.style.color = pass ? '#16a34a' : '#dc2626';
      container.querySelector(selector).style.background = pass ? (isDark ? 'rgba(22,163,74,0.1)' : 'rgba(22,163,74,0.05)') : (isDark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.05)');
    }

    function update() {
      var fgC = hexToRgb(fgHex.value);
      var bgC = hexToRgb(bgHex.value);
      var fgL = relativeLuminance(fgC.r, fgC.g, fgC.b);
      var bgL = relativeLuminance(bgC.r, bgC.g, bgC.b);
      var ratio = contrastRatio(fgL, bgL);

      previewEl.style.color = fgHex.value;
      previewEl.style.background = bgHex.value;
      ratioEl.textContent = ratio.toFixed(2) + ':1';

      setStatus('.aw-cc-aa-normal', ratio >= 4.5);
      setStatus('.aw-cc-aa-large', ratio >= 3);
      setStatus('.aw-cc-aaa-normal', ratio >= 7);
      setStatus('.aw-cc-aaa-large', ratio >= 4.5);
    }

    fgPicker.addEventListener('input', function() { fgHex.value = this.value.toUpperCase(); update(); });
    bgPicker.addEventListener('input', function() { bgHex.value = this.value.toUpperCase(); update(); });
    fgHex.addEventListener('change', function() {
      var v = this.value.trim();
      if (/^#?[0-9a-fA-F]{3,6}$/.test(v)) {
        if (v[0] !== '#') v = '#' + v;
        this.value = v.toUpperCase();
        fgPicker.value = v;
        update();
      }
    });
    bgHex.addEventListener('change', function() {
      var v = this.value.trim();
      if (/^#?[0-9a-fA-F]{3,6}$/.test(v)) {
        if (v[0] !== '#') v = '#' + v;
        this.value = v.toUpperCase();
        bgPicker.value = v;
        update();
      }
    });

    container.querySelector('.aw-cc-swap').addEventListener('click', function() {
      var tmpC = fgPicker.value;
      var tmpH = fgHex.value;
      fgPicker.value = bgPicker.value;
      fgHex.value = bgHex.value;
      bgPicker.value = tmpC;
      bgHex.value = tmpH;
      update();
    });

    update();
  };
})();
