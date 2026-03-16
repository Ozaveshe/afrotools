(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.cssGradient = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-css-gradient" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-cg-preview" style="width:100%;height:120px;border-radius:8px;border:1px solid '+borderColor+';margin-bottom:12px"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
          '<div>' +
            '<div style="display:flex;gap:8px;margin-bottom:8px">' +
              '<button class="aw-btn aw-btn--primary aw-cg-linear" style="padding:6px 12px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Linear</button>' +
              '<button class="aw-btn aw-cg-radial" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Radial</button>' +
            '</div>' +
            '<div class="aw-cg-angle-wrap">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Angle: <span class="aw-cg-angle-val">90</span>&deg;</label>' +
              '<input type="range" class="aw-cg-angle" min="0" max="360" value="90" style="width:100%">' +
            '</div>' +
            '<div class="aw-cg-shape-wrap" style="display:none">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Shape</label>' +
              '<select class="aw-input aw-cg-shape" style="padding:6px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+'">' +
                '<option value="circle">Circle</option><option value="ellipse">Ellipse</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Color Stops</label>' +
            '<div class="aw-cg-stops" style="display:grid;gap:6px"></div>' +
            '<button class="aw-btn aw-cg-add-stop" style="margin-top:6px;padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">+ Add Stop</button>' +
          '</div>' +
        '</div>' +
        '<div class="aw-field">' +
          '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">CSS Code</label>' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" class="aw-input aw-cg-code" readonly style="flex:1;padding:8px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:12px;background:'+inputBg+';color:'+fg+';box-sizing:border-box">' +
            '<button class="aw-btn aw-cg-copy" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy</button>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var isLinear = true;
    var stops = [
      {color:'#007AFF', position:0},
      {color:'#00C6FF', position:100}
    ];

    var previewEl = container.querySelector('.aw-cg-preview');
    var codeEl = container.querySelector('.aw-cg-code');
    var angleEl = container.querySelector('.aw-cg-angle');
    var angleValEl = container.querySelector('.aw-cg-angle-val');
    var stopsEl = container.querySelector('.aw-cg-stops');
    var linearBtn = container.querySelector('.aw-cg-linear');
    var radialBtn = container.querySelector('.aw-cg-radial');

    function renderStops() {
      stopsEl.innerHTML = stops.map(function(s, i) {
        return '<div style="display:flex;gap:4px;align-items:center">' +
          '<input type="color" class="aw-cg-stop-color" data-i="'+i+'" value="'+s.color+'" style="width:30px;height:24px;border:none;cursor:pointer;padding:0">' +
          '<input type="number" class="aw-input aw-cg-stop-pos" data-i="'+i+'" value="'+s.position+'" min="0" max="100" style="width:50px;padding:4px;border:1px solid '+borderColor+';border-radius:4px;font-size:11px;background:'+inputBg+';color:'+fg+'">%' +
          (stops.length > 2 ? '<button class="aw-btn aw-cg-rm-stop" data-i="'+i+'" style="padding:2px 6px;background:transparent;border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:10px;color:#dc2626">&times;</button>' : '') +
        '</div>';
      }).join('');

      stopsEl.querySelectorAll('.aw-cg-stop-color').forEach(function(el) {
        el.addEventListener('input', function() { stops[+this.dataset.i].color = this.value; update(); });
      });
      stopsEl.querySelectorAll('.aw-cg-stop-pos').forEach(function(el) {
        el.addEventListener('input', function() { stops[+this.dataset.i].position = +this.value; update(); });
      });
      stopsEl.querySelectorAll('.aw-cg-rm-stop').forEach(function(el) {
        el.addEventListener('click', function() { stops.splice(+this.dataset.i, 1); renderStops(); update(); });
      });
    }

    function update() {
      var colorStr = stops.map(function(s) { return s.color+' '+s.position+'%'; }).join(', ');
      var css;
      if (isLinear) {
        css = 'linear-gradient('+angleEl.value+'deg, '+colorStr+')';
      } else {
        var shape = container.querySelector('.aw-cg-shape').value;
        css = 'radial-gradient('+shape+', '+colorStr+')';
      }
      previewEl.style.background = css;
      codeEl.value = 'background: '+css+';';
    }

    linearBtn.addEventListener('click', function() {
      isLinear = true;
      linearBtn.style.background = primary; linearBtn.style.color = '#fff'; linearBtn.style.border = 'none';
      radialBtn.style.background = inputBg; radialBtn.style.color = fg; radialBtn.style.border = '1px solid '+borderColor;
      container.querySelector('.aw-cg-angle-wrap').style.display = '';
      container.querySelector('.aw-cg-shape-wrap').style.display = 'none';
      update();
    });
    radialBtn.addEventListener('click', function() {
      isLinear = false;
      radialBtn.style.background = primary; radialBtn.style.color = '#fff'; radialBtn.style.border = 'none';
      linearBtn.style.background = inputBg; linearBtn.style.color = fg; linearBtn.style.border = '1px solid '+borderColor;
      container.querySelector('.aw-cg-angle-wrap').style.display = 'none';
      container.querySelector('.aw-cg-shape-wrap').style.display = '';
      update();
    });
    angleEl.addEventListener('input', function() { angleValEl.textContent = this.value; update(); });
    container.querySelector('.aw-cg-shape').addEventListener('change', update);
    container.querySelector('.aw-cg-add-stop').addEventListener('click', function() {
      stops.push({color:'#ffffff', position:50});
      renderStops();
      update();
    });
    container.querySelector('.aw-cg-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(codeEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1500); });
    });

    renderStops();
    update();
  };
})();
