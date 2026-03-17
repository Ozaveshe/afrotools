(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.diffChecker = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';
    var addBg = isDark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.1)';
    var rmBg = isDark ? 'rgba(220,38,38,0.2)' : 'rgba(220,38,38,0.1)';

    container.innerHTML =
      '<div class="aw-diff-checker" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Original</label>' +
            '<textarea class="aw-input aw-diff-left" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Paste original text..."></textarea>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Modified</label>' +
            '<textarea class="aw-input aw-diff-right" style="width:100%;min-height:140px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Paste modified text..."></textarea>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">' +
          '<button class="aw-btn aw-btn--primary aw-diff-compare" style="padding:8px 16px;background:'+primary+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">Compare</button>' +
          '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" class="aw-diff-ignore-ws"> Ignore whitespace</label>' +
          '<label style="display:flex;align-items:center;gap:4px;font-size:12px"><input type="checkbox" class="aw-diff-ignore-case"> Ignore case</label>' +
          '<div style="display:flex;gap:4px;margin-left:auto">' +
            '<button class="aw-btn aw-diff-mode-line aw-btn--primary" style="padding:4px 10px;background:'+primary+';color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit">Line</button>' +
            '<button class="aw-btn aw-diff-mode-word" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit">Word</button>' +
          '</div>' +
        '</div>' +
        '<div class="aw-diff-stats" style="font-size:12px;color:#888;margin-bottom:8px"></div>' +
        '<div class="aw-diff-output" style="max-height:400px;overflow-y:auto;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:12px;line-height:1.6"></div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var leftEl = container.querySelector('.aw-diff-left');
    var rightEl = container.querySelector('.aw-diff-right');
    var outputEl = container.querySelector('.aw-diff-output');
    var statsEl = container.querySelector('.aw-diff-stats');
    var lineMode = true;
    var lineModeBtn = container.querySelector('.aw-diff-mode-line');
    var wordModeBtn = container.querySelector('.aw-diff-mode-word');

    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function normalize(s) {
      if (container.querySelector('.aw-diff-ignore-case').checked) s = s.toLowerCase();
      if (container.querySelector('.aw-diff-ignore-ws').checked) s = s.replace(/\s+/g, ' ').trim();
      return s;
    }

    // Simple LCS-based diff
    function lcs(a, b) {
      var m = a.length, n = b.length;
      var dp = [];
      for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
          if (i === 0 || j === 0) dp[i][j] = 0;
          else if (normalize(a[i-1]) === normalize(b[j-1])) dp[i][j] = dp[i-1][j-1] + 1;
          else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
      }
      var result = [];
      var i = m, j = n;
      while (i > 0 && j > 0) {
        if (normalize(a[i-1]) === normalize(b[j-1])) {
          result.unshift({type:'equal', left:a[i-1], right:b[j-1]});
          i--; j--;
        } else if (dp[i-1][j] > dp[i][j-1]) {
          result.unshift({type:'remove', left:a[i-1]});
          i--;
        } else {
          result.unshift({type:'add', right:b[j-1]});
          j--;
        }
      }
      while (i > 0) { result.unshift({type:'remove', left:a[--i]}); }
      while (j > 0) { result.unshift({type:'add', right:b[--j]}); }
      return result;
    }

    function compare() {
      var leftText = leftEl.value;
      var rightText = rightEl.value;
      if (!leftText && !rightText) { outputEl.innerHTML = ''; statsEl.textContent = ''; return; }

      var leftItems, rightItems;
      if (lineMode) {
        leftItems = leftText.split('\n');
        rightItems = rightText.split('\n');
      } else {
        leftItems = leftText.match(/\S+|\s+/g) || [];
        rightItems = rightText.match(/\S+|\s+/g) || [];
      }

      var diff = lcs(leftItems, rightItems);
      var added = 0, removed = 0;

      if (lineMode) {
        var html = diff.map(function(d, idx) {
          var ln = idx + 1;
          if (d.type === 'equal') {
            return '<div style="padding:1px 8px">' + ln + ' &nbsp;' + escapeHtml(d.left) + '</div>';
          } else if (d.type === 'remove') {
            removed++;
            return '<div style="padding:1px 8px;background:'+rmBg+'"><span style="color:#dc2626">-</span> ' + ln + ' ' + escapeHtml(d.left) + '</div>';
          } else {
            added++;
            return '<div style="padding:1px 8px;background:'+addBg+'"><span style="color:#007AFF">+</span> ' + ln + ' ' + escapeHtml(d.right) + '</div>';
          }
        }).join('');
        outputEl.innerHTML = html || '<div style="padding:10px;color:#888;text-align:center">No differences</div>';
      } else {
        var html = '<div style="padding:8px;white-space:pre-wrap;word-break:break-all">';
        diff.forEach(function(d) {
          if (d.type === 'equal') {
            html += escapeHtml(d.left);
          } else if (d.type === 'remove') {
            removed++;
            html += '<span style="background:'+rmBg+';text-decoration:line-through">' + escapeHtml(d.left) + '</span>';
          } else {
            added++;
            html += '<span style="background:'+addBg+'">' + escapeHtml(d.right) + '</span>';
          }
        });
        html += '</div>';
        outputEl.innerHTML = html;
      }

      statsEl.textContent = added + ' addition' + (added!==1?'s':'') + ', ' + removed + ' removal' + (removed!==1?'s':'');
    }

    container.querySelector('.aw-diff-compare').addEventListener('click', compare);

    lineModeBtn.addEventListener('click', function() {
      lineMode = true;
      lineModeBtn.style.background = primary; lineModeBtn.style.color = '#fff'; lineModeBtn.style.border = 'none';
      wordModeBtn.style.background = inputBg; wordModeBtn.style.color = fg; wordModeBtn.style.border = '1px solid '+borderColor;
      compare();
    });
    wordModeBtn.addEventListener('click', function() {
      lineMode = false;
      wordModeBtn.style.background = primary; wordModeBtn.style.color = '#fff'; wordModeBtn.style.border = 'none';
      lineModeBtn.style.background = inputBg; lineModeBtn.style.color = fg; lineModeBtn.style.border = '1px solid '+borderColor;
      compare();
    });
  };
})();
