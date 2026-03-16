(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.regexTester = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';
    var highlightBg = isDark ? 'rgba(0,122,255,0.3)' : 'rgba(0,122,255,0.15)';

    container.innerHTML =
      '<div class="aw-regex-tester" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:10px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Pattern</label>' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" class="aw-input aw-regex-pattern" style="flex:1;padding:8px 10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box" placeholder="Enter regex pattern...">' +
            '<div style="display:flex;gap:4px;align-items:center;font-size:12px">' +
              '<label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-g" checked> g</label>' +
              '<label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-i"> i</label>' +
              '<label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-m"> m</label>' +
              '<label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-s"> s</label>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="aw-regex-error" style="font-size:12px;color:#dc2626;margin-bottom:6px"></div>' +
        '<div class="aw-field" style="margin-bottom:10px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Test String</label>' +
          '<textarea class="aw-input aw-regex-test" style="width:100%;min-height:100px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Enter test string..."></textarea>' +
        '</div>' +
        '<div class="aw-field" style="margin-bottom:10px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Matches</label>' +
          '<div class="aw-regex-matches" style="min-height:60px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';white-space:pre-wrap;word-break:break-all;overflow-y:auto;max-height:200px"></div>' +
        '</div>' +
        '<div class="aw-regex-info" style="font-size:12px;color:#888"></div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var patternEl = container.querySelector('.aw-regex-pattern');
    var testEl = container.querySelector('.aw-regex-test');
    var matchesEl = container.querySelector('.aw-regex-matches');
    var errorEl = container.querySelector('.aw-regex-error');
    var infoEl = container.querySelector('.aw-regex-info');

    function getFlags() {
      var f = '';
      if (container.querySelector('.aw-regex-flag-g').checked) f += 'g';
      if (container.querySelector('.aw-regex-flag-i').checked) f += 'i';
      if (container.querySelector('.aw-regex-flag-m').checked) f += 'm';
      if (container.querySelector('.aw-regex-flag-s').checked) f += 's';
      return f;
    }

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function test() {
      var pattern = patternEl.value;
      var str = testEl.value;
      errorEl.textContent = '';
      if (!pattern || !str) { matchesEl.innerHTML = ''; infoEl.textContent = ''; return; }

      var flags = getFlags();
      var regex;
      try {
        regex = new RegExp(pattern, flags);
      } catch(e) {
        errorEl.textContent = e.message;
        matchesEl.innerHTML = '';
        infoEl.textContent = '';
        return;
      }

      var matches = [];
      var startTime = performance.now();
      var maxTime = 3000;

      if (flags.indexOf('g') !== -1) {
        var match;
        while ((match = regex.exec(str)) !== null) {
          if (performance.now() - startTime > maxTime) {
            errorEl.textContent = 'Aborted: pattern took too long (possible catastrophic backtracking)';
            break;
          }
          matches.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) });
          if (match[0].length === 0) regex.lastIndex++;
        }
      } else {
        var match = regex.exec(str);
        if (match) {
          matches.push({ index: match.index, length: match[0].length, value: match[0], groups: match.slice(1) });
        }
      }

      // Build highlighted output
      var html = '';
      var lastIdx = 0;
      matches.forEach(function(m) {
        html += escapeHtml(str.substring(lastIdx, m.index));
        html += '<span style="background:'+highlightBg+';border-bottom:2px solid '+primary+'">' + escapeHtml(str.substring(m.index, m.index + m.length)) + '</span>';
        lastIdx = m.index + m.length;
      });
      html += escapeHtml(str.substring(lastIdx));
      matchesEl.innerHTML = html || '<span style="color:#888">No matches</span>';

      var info = matches.length + ' match' + (matches.length !== 1 ? 'es' : '');
      if (matches.length > 0 && matches[0].groups.length > 0) {
        info += ' | Groups: ' + matches[0].groups.map(function(g, i) { return '(' + (i+1) + ') ' + (g || 'undefined'); }).join(', ');
      }
      infoEl.textContent = info;
    }

    patternEl.addEventListener('input', test);
    testEl.addEventListener('input', test);
    container.querySelector('.aw-regex-flag-g').addEventListener('change', test);
    container.querySelector('.aw-regex-flag-i').addEventListener('change', test);
    container.querySelector('.aw-regex-flag-m').addEventListener('change', test);
    container.querySelector('.aw-regex-flag-s').addEventListener('change', test);
  };
})();
