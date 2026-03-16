(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.colorPicker = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-color-picker" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">' +
          '<div>' +
            '<input type="color" class="aw-cp-input" value="#007AFF" style="width:80px;height:80px;border:none;cursor:pointer;border-radius:8px;padding:0">' +
          '</div>' +
          '<div style="flex:1;min-width:200px">' +
            '<div class="aw-field" style="margin-bottom:8px">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">HEX</label>' +
              '<div style="display:flex;gap:6px"><input type="text" class="aw-input aw-cp-hex" value="#007AFF" style="flex:1;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box"><button class="aw-btn aw-cp-copy" data-fmt="hex" style="padding:4px 8px;background:transparent;border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;color:'+fg+';font-family:inherit">Copy</button></div>' +
            '</div>' +
            '<div class="aw-field" style="margin-bottom:8px">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">RGB</label>' +
              '<div style="display:flex;gap:6px"><input type="text" class="aw-input aw-cp-rgb" readonly style="flex:1;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box"><button class="aw-btn aw-cp-copy" data-fmt="rgb" style="padding:4px 8px;background:transparent;border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;color:'+fg+';font-family:inherit">Copy</button></div>' +
            '</div>' +
            '<div class="aw-field" style="margin-bottom:8px">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">HSL</label>' +
              '<div style="display:flex;gap:6px"><input type="text" class="aw-input aw-cp-hsl" readonly style="flex:1;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box"><button class="aw-btn aw-cp-copy" data-fmt="hsl" style="padding:4px 8px;background:transparent;border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;color:'+fg+';font-family:inherit">Copy</button></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="aw-field" style="margin-top:12px">' +
          '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">Palette</label>' +
          '<div class="aw-cp-palette" style="display:flex;gap:4px;flex-wrap:wrap"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var colorInput = container.querySelector('.aw-cp-input');
    var hexEl = container.querySelector('.aw-cp-hex');
    var rgbEl = container.querySelector('.aw-cp-rgb');
    var hslEl = container.querySelector('.aw-cp-hsl');
    var paletteEl = container.querySelector('.aw-cp-palette');

    function hexToRgb(hex) {
      hex = hex.replace(/^#/, '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      var r = parseInt(hex.substring(0,2),16);
      var g = parseInt(hex.substring(2,4),16);
      var b = parseInt(hex.substring(4,6),16);
      return {r:r,g:g,b:b};
    }

    function rgbToHsl(r,g,b) {
      r/=255; g/=255; b/=255;
      var max=Math.max(r,g,b), min=Math.min(r,g,b);
      var h,s,l=(max+min)/2;
      if(max===min){h=s=0;}
      else{
        var d=max-min;
        s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){
          case r:h=((g-b)/d+(g<b?6:0))/6;break;
          case g:h=((b-r)/d+2)/6;break;
          case b:h=((r-g)/d+4)/6;break;
        }
      }
      return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
    }

    function hslToHex(h,s,l) {
      s/=100; l/=100;
      var a=s*Math.min(l,1-l);
      function f(n){
        var k=(n+h/30)%12;
        var c=l-a*Math.max(Math.min(k-3,9-k,1),-1);
        return Math.round(255*c).toString(16).padStart(2,'0');
      }
      return '#'+f(0)+f(8)+f(4);
    }

    function update(hex) {
      hex = hex.toUpperCase();
      var rgb = hexToRgb(hex);
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      colorInput.value = hex.length === 7 ? hex : '#000000';
      hexEl.value = hex;
      rgbEl.value = 'rgb('+rgb.r+', '+rgb.g+', '+rgb.b+')';
      hslEl.value = 'hsl('+hsl.h+', '+hsl.s+'%, '+hsl.l+'%)';

      // Generate palette (lightness variations)
      var steps = [10,25,40,50,60,75,90];
      paletteEl.innerHTML = steps.map(function(lv) {
        var c = hslToHex(hsl.h, hsl.s, lv);
        return '<div style="width:36px;height:36px;border-radius:6px;background:'+c+';cursor:pointer;border:2px solid '+(lv===hsl.l?primary:'transparent')+'" title="'+c+'" data-hex="'+c+'"></div>';
      }).join('');
      paletteEl.querySelectorAll('div').forEach(function(el) {
        el.addEventListener('click', function() { update(this.getAttribute('data-hex')); });
      });
    }

    colorInput.addEventListener('input', function() { update(this.value); });
    hexEl.addEventListener('change', function() {
      var v = this.value.trim();
      if (/^#?[0-9a-fA-F]{3,6}$/.test(v)) {
        if (v[0] !== '#') v = '#' + v;
        update(v);
      }
    });

    container.querySelectorAll('.aw-cp-copy').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var fmt = this.getAttribute('data-fmt');
        var val = container.querySelector('.aw-cp-'+fmt).value;
        var b = this;
        navigator.clipboard.writeText(val).then(function() { b.textContent = 'Copied!'; setTimeout(function(){ b.textContent = 'Copy'; }, 1500); });
      });
    });

    update('#007AFF');
  };
})();
