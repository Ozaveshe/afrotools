(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.jwtDecoder = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-jwt-decoder" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">JWT Token</label>' +
          '<textarea class="aw-input aw-jwt-input" style="width:100%;min-height:80px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Paste JWT token here..."></textarea>' +
        '</div>' +
        '<button class="aw-btn aw-btn--primary aw-jwt-decode" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;margin-bottom:12px">Decode</button>' +
        '<div class="aw-jwt-status" style="font-size:12px;margin-bottom:8px"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Header</label>' +
            '<textarea class="aw-input aw-jwt-header" style="width:100%;min-height:120px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Payload</label>' +
            '<textarea class="aw-input aw-jwt-payload" style="width:100%;min-height:120px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" readonly></textarea>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var inputEl = container.querySelector('.aw-jwt-input');
    var headerEl = container.querySelector('.aw-jwt-header');
    var payloadEl = container.querySelector('.aw-jwt-payload');
    var statusEl = container.querySelector('.aw-jwt-status');

    function base64UrlDecode(str) {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      var pad = 4 - (str.length % 4);
      if (pad !== 4) str += '='.repeat(pad);
      return decodeURIComponent(escape(atob(str)));
    }

    function decode() {
      var token = inputEl.value.trim();
      if (!token) { headerEl.value = ''; payloadEl.value = ''; statusEl.textContent = ''; return; }
      var parts = token.split('.');
      if (parts.length !== 3) {
        statusEl.style.color = '#dc2626';
        statusEl.textContent = 'Invalid JWT: expected 3 parts, got ' + parts.length;
        headerEl.value = ''; payloadEl.value = '';
        return;
      }
      try {
        var header = JSON.parse(base64UrlDecode(parts[0]));
        var payload = JSON.parse(base64UrlDecode(parts[1]));
        headerEl.value = JSON.stringify(header, null, 2);
        payloadEl.value = JSON.stringify(payload, null, 2);

        var statusParts = [];
        if (payload.exp) {
          var expDate = new Date(payload.exp * 1000);
          var now = new Date();
          if (expDate < now) {
            statusParts.push('<span style="color:#dc2626">Expired: ' + expDate.toLocaleString() + '</span>');
          } else {
            statusParts.push('<span style="color:#16a34a">Expires: ' + expDate.toLocaleString() + '</span>');
          }
        }
        if (payload.iat) {
          statusParts.push('Issued: ' + new Date(payload.iat * 1000).toLocaleString());
        }
        if (header.alg) {
          statusParts.push('Algorithm: ' + header.alg);
        }
        statusEl.innerHTML = statusParts.join(' &middot; ');
        statusEl.style.color = fg;
      } catch(e) {
        statusEl.style.color = '#dc2626';
        statusEl.textContent = 'Error decoding: ' + e.message;
        headerEl.value = ''; payloadEl.value = '';
      }
    }

    container.querySelector('.aw-jwt-decode').addEventListener('click', decode);
    inputEl.addEventListener('input', decode);
  };
})();
