(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.qrGenerator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-qr-generator" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:start">' +
          '<div>' +
            '<div class="aw-field" style="margin-bottom:10px">' +
              '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Type</label>' +
              '<select class="aw-input aw-qr-type" style="width:100%;padding:8px;border:1px solid '+borderColor+';border-radius:6px;font-size:13px;background:'+inputBg+';color:'+fg+'">' +
                '<option value="text">Text / URL</option>' +
                '<option value="wifi">WiFi</option>' +
                '<option value="vcard">vCard</option>' +
              '</select>' +
            '</div>' +
            '<div class="aw-qr-text-fields">' +
              '<div class="aw-field" style="margin-bottom:10px">' +
                '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Content</label>' +
                '<textarea class="aw-input aw-qr-input" style="width:100%;min-height:80px;padding:8px;border:1px solid '+borderColor+';border-radius:6px;font-family:inherit;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter text or URL..."></textarea>' +
              '</div>' +
            '</div>' +
            '<div class="aw-qr-wifi-fields" style="display:none">' +
              '<div class="aw-field" style="margin-bottom:8px">' +
                '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">SSID</label>' +
                '<input type="text" class="aw-input aw-qr-ssid" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Network name">' +
              '</div>' +
              '<div class="aw-field" style="margin-bottom:8px">' +
                '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Password</label>' +
                '<input type="text" class="aw-input aw-qr-pass" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="WiFi password">' +
              '</div>' +
              '<div class="aw-field" style="margin-bottom:8px">' +
                '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Security</label>' +
                '<select class="aw-input aw-qr-security" style="padding:6px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+'"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="">None</option></select>' +
              '</div>' +
            '</div>' +
            '<div class="aw-qr-vcard-fields" style="display:none">' +
              '<div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vname" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Full Name"></div>' +
              '<div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vphone" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Phone"></div>' +
              '<div class="aw-field" style="margin-bottom:6px"><input type="text" class="aw-input aw-qr-vemail" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Email"></div>' +
              '<div class="aw-field" style="margin-bottom:8px"><input type="text" class="aw-input aw-qr-vorg" style="width:100%;padding:6px 8px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Organization"></div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">' +
              '<label style="font-size:12px">FG:</label><input type="color" class="aw-qr-fg" value="#000000" style="width:30px;height:24px;border:none;cursor:pointer;padding:0">' +
              '<label style="font-size:12px">BG:</label><input type="color" class="aw-qr-bg" value="#ffffff" style="width:30px;height:24px;border:none;cursor:pointer;padding:0">' +
              '<label style="font-size:12px;margin-left:8px">Size:</label>' +
              '<input type="number" class="aw-input aw-qr-size" value="200" min="100" max="500" step="50" style="width:60px;padding:4px;border:1px solid '+borderColor+';border-radius:4px;font-size:12px;background:'+inputBg+';color:'+fg+'">' +
            '</div>' +
            '<button class="aw-btn aw-btn--primary aw-qr-gen" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Generate QR Code</button>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div class="aw-qr-canvas" style="display:inline-block;padding:10px;background:#fff;border-radius:8px;border:1px solid '+borderColor+'"></div>' +
            '<div style="margin-top:8px"><button class="aw-btn aw-qr-download" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:none">Download PNG</button></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var typeEl = container.querySelector('.aw-qr-type');
    var canvasContainer = container.querySelector('.aw-qr-canvas');
    var downloadBtn = container.querySelector('.aw-qr-download');

    typeEl.addEventListener('change', function() {
      container.querySelector('.aw-qr-text-fields').style.display = this.value === 'text' ? '' : 'none';
      container.querySelector('.aw-qr-wifi-fields').style.display = this.value === 'wifi' ? '' : 'none';
      container.querySelector('.aw-qr-vcard-fields').style.display = this.value === 'vcard' ? '' : 'none';
    });

    function getData() {
      var type = typeEl.value;
      if (type === 'text') return container.querySelector('.aw-qr-input').value;
      if (type === 'wifi') {
        var ssid = container.querySelector('.aw-qr-ssid').value;
        var pass = container.querySelector('.aw-qr-pass').value;
        var sec = container.querySelector('.aw-qr-security').value;
        return 'WIFI:T:'+sec+';S:'+ssid+';P:'+pass+';;';
      }
      if (type === 'vcard') {
        var name = container.querySelector('.aw-qr-vname').value;
        var phone = container.querySelector('.aw-qr-vphone').value;
        var email = container.querySelector('.aw-qr-vemail').value;
        var org = container.querySelector('.aw-qr-vorg').value;
        return 'BEGIN:VCARD\nVERSION:3.0\nFN:'+name+'\nTEL:'+phone+'\nEMAIL:'+email+'\nORG:'+org+'\nEND:VCARD';
      }
      return '';
    }

    // Minimal QR code generator using Canvas (no external lib)
    // Uses a simple approach: encode data into a QR matrix
    function generate() {
      var data = getData();
      if (!data) return;
      var size = parseInt(container.querySelector('.aw-qr-size').value) || 200;
      var fgColor = container.querySelector('.aw-qr-fg').value;
      var bgColor = container.querySelector('.aw-qr-bg').value;

      // Check if QRCode library is available (from qrcodejs CDN)
      if (typeof QRCode !== 'undefined') {
        canvasContainer.innerHTML = '';
        new QRCode(canvasContainer, {
          text: data,
          width: size,
          height: size,
          colorDark: fgColor,
          colorLight: bgColor,
          correctLevel: QRCode.CorrectLevel.M
        });
        downloadBtn.style.display = '';
      } else {
        // Fallback: generate using Canvas API with a simple encoding
        canvasContainer.innerHTML = '';
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');

        // Simple visual pattern (not a real QR code - for fallback only)
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);

        // Generate a deterministic pattern from data
        var moduleCount = 21;
        var cellSize = size / moduleCount;
        ctx.fillStyle = fgColor;

        // Position detection patterns
        function drawFinder(x, y) {
          for (var r = 0; r < 7; r++) {
            for (var c = 0; c < 7; c++) {
              if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                ctx.fillRect((x+c)*cellSize, (y+r)*cellSize, cellSize, cellSize);
              }
            }
          }
        }
        drawFinder(0, 0);
        drawFinder(moduleCount-7, 0);
        drawFinder(0, moduleCount-7);

        // Data area - hash the data to fill modules
        var hash = 0;
        for (var i = 0; i < data.length; i++) {
          hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
        }
        for (var r = 0; r < moduleCount; r++) {
          for (var c = 0; c < moduleCount; c++) {
            if ((r < 7 && c < 7) || (r < 7 && c >= moduleCount-7) || (r >= moduleCount-7 && c < 7)) continue;
            hash = ((hash << 5) - hash + r * moduleCount + c) | 0;
            if ((hash & 1) === 0) {
              ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
            }
          }
        }

        canvasContainer.appendChild(canvas);
        downloadBtn.style.display = '';

        // Show notice
        var notice = document.createElement('div');
        notice.style.cssText = 'font-size:10px;color:#f97316;margin-top:4px';
        notice.textContent = 'Note: Load qrcodejs library for scannable QR codes';
        canvasContainer.appendChild(notice);
      }
    }

    container.querySelector('.aw-qr-gen').addEventListener('click', generate);

    downloadBtn.addEventListener('click', function() {
      var canvas = canvasContainer.querySelector('canvas') || canvasContainer.querySelector('img');
      if (!canvas) return;
      var link = document.createElement('a');
      if (canvas.tagName === 'CANVAS') {
        link.href = canvas.toDataURL('image/png');
      } else {
        link.href = canvas.src;
      }
      link.download = 'qr-code.png';
      link.click();
    });
  };
})();
