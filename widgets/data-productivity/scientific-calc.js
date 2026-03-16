(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.scientificCalc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#DBEAFE';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#F5F9FF';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-sc-' + Math.random().toString(36).slice(2,8);
    var dispBg = theme === 'dark' ? '#0d1117' : 'linear-gradient(135deg,#1a1f2e 0%,#0f1419 100%)';

    var btnBase = 'padding:10px 4px;font-size:.75rem;font-weight:700;border:1.5px solid ' + border + ';background:' + (theme==='dark'?'rgba(255,255,255,.06)':'#fff') + ';border-radius:6px;cursor:pointer;color:' + text + ';font-family:inherit;text-align:center;min-height:38px;';
    var btnFunc = btnBase + 'font-size:.68rem;background:' + (theme==='dark'?'rgba(100,180,255,.08)':'rgba(52,152,219,.06)') + ';color:' + (theme==='dark'?'#7dd3fc':'#1a5276') + ';';
    var btnOp = btnBase + 'background:' + (theme==='dark'?'rgba(0,113,227,.1)':'rgba(0,113,227,.06)') + ';color:' + (theme==='dark'?'#93c5fd':'#0a4018') + ';';
    var btnNum = btnBase + 'font-size:.9rem;';
    var btnEq = 'padding:10px 4px;font-size:1rem;font-weight:700;border:1.5px solid ' + accent + ';background:' + accent + ';border-radius:6px;cursor:pointer;color:#fff;font-family:inherit;text-align:center;min-height:38px;grid-column:span 2;';
    var btnClr = btnBase + 'background:rgba(192,57,43,.08);color:#8b2e1f;';
    var btnMem = btnBase + 'font-size:.65rem;background:rgba(243,156,18,.08);color:#8a6d20;';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:420px;">' +
        '<div style="background:' + dispBg + ';padding:14px 18px 10px;">' +
          '<div id="' + uid + '-expr" style="font-size:.75rem;color:#6B8CAE;min-height:18px;font-family:monospace;text-align:right;word-break:break-all;"></div>' +
          '<div id="' + uid + '-result" style="font-size:2rem;font-weight:800;color:' + accent + ';text-align:right;font-family:monospace;word-break:break-all;min-height:40px;line-height:1.2;">0</div>' +
          '<div style="display:flex;justify-content:space-between;margin-top:5px;">' +
            '<span id="' + uid + '-mode" style="font-size:.6rem;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:3px;background:rgba(0,113,227,.2);color:' + accent + ';cursor:pointer;">DEG</span>' +
            '<span id="' + uid + '-mem" style="font-size:.6rem;font-weight:700;color:#f39c12;"></span>' +
          '</div>' +
        '</div>' +
        '<div style="padding:6px;background:' + inputBg + ';display:grid;grid-template-columns:repeat(6,1fr);gap:3px;">' +
          '<button style="' + btnMem + '" data-a="mc">MC</button>' +
          '<button style="' + btnMem + '" data-a="mr">MR</button>' +
          '<button style="' + btnMem + '" data-a="m+">M+</button>' +
          '<button style="' + btnMem + '" data-a="m-">M\u2212</button>' +
          '<button style="' + btnClr + '" data-a="ac">AC</button>' +
          '<button style="' + btnClr + '" data-a="del">DEL</button>' +

          '<button style="' + btnFunc + '" data-a="fn" data-fn="sin(">sin</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="cos(">cos</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="tan(">tan</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="log(">log</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="ln(">ln</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="\u221A(">\u221A</button>' +

          '<button style="' + btnFunc + '" data-a="fn" data-fn="asin(">sin\u207B\u00B9</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="acos(">cos\u207B\u00B9</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="atan(">tan\u207B\u00B9</button>' +
          '<button style="' + btnFunc + '" data-a="t" data-t="!">n!</button>' +
          '<button style="' + btnFunc + '" data-a="t" data-t="\u03C0">\u03C0</button>' +
          '<button style="' + btnFunc + '" data-a="t" data-t="e">e</button>' +

          '<button style="' + btnOp + '" data-a="t" data-t="(">(</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t=")">)</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="^">x^y</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="%">mod</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="\u00F7">\u00F7</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="\u00D7">\u00D7</button>' +

          '<button style="' + btnNum + '" data-a="t" data-t="7">7</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="8">8</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="9">9</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="\u2212">\u2212</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="abs(">|x|</button>' +
          '<button style="' + btnFunc + '" data-a="t" data-t="\u00B2">x\u00B2</button>' +

          '<button style="' + btnNum + '" data-a="t" data-t="4">4</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="5">5</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="6">6</button>' +
          '<button style="' + btnOp + '" data-a="t" data-t="+">+</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="10^(">10^x</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="exp(">e^x</button>' +

          '<button style="' + btnNum + '" data-a="t" data-t="1">1</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="2">2</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t="3">3</button>' +
          '<button style="' + btnOp + '" data-a="sign">+/\u2212</button>' +
          '<button style="' + btnEq + '" data-a="eq">=</button>' +

          '<button style="' + btnNum + 'grid-column:span 2;" data-a="t" data-t="0">0</button>' +
          '<button style="' + btnNum + '" data-a="t" data-t=".">.</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="cbrt(">\u221B</button>' +
          '<button style="' + btnFunc + '" data-a="fn" data-fn="1/(">1/x</button>' +
          '<button style="' + btnFunc + '"></button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 14px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var expression = '';
    var isDeg = true;
    var memory = 0;
    var lastResult = '0';
    var exprEl = document.getElementById(uid + '-expr');
    var resultEl = document.getElementById(uid + '-result');
    var modeEl = document.getElementById(uid + '-mode');
    var memEl = document.getElementById(uid + '-mem');

    function updateDisplay() { exprEl.textContent = expression || ''; resultEl.textContent = lastResult; }

    function factorial(n) {
      if (n < 0 || n !== Math.floor(n)) return NaN;
      if (n > 170) return Infinity;
      if (n <= 1) return 1;
      var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
    }

    function evalExpr(expr) {
      var e = expr
        .replace(/\u00D7/g,'*').replace(/\u00F7/g,'/').replace(/\u2212/g,'-')
        .replace(/\u03C0/g,'('+Math.PI+')').replace(/\u00B2/g,'**2').replace(/\^/g,'**');
      e = e.replace(/(?<![a-z])e(?![a-z(^x])/g, '('+Math.E+')');
      e = e.replace(/(\d+(?:\.\d+)?)!/g, function(_,n){ return String(factorial(parseFloat(n))); });
      e = e.replace(/\u221A\(/g,'Math.sqrt(');
      e = e.replace(/cbrt\(/g,'Math.cbrt(');
      e = e.replace(/abs\(/g,'Math.abs(');
      e = e.replace(/10\^\(/g,'Math.pow(10,');
      e = e.replace(/exp\(/g,'Math.exp(');
      e = e.replace(/1\/\(/g,'(1/(');
      if (isDeg) {
        e = e.replace(/asin\(([^)]+)\)/g, function(_,a){ return '(Math.asin('+a+')*180/Math.PI)'; });
        e = e.replace(/acos\(([^)]+)\)/g, function(_,a){ return '(Math.acos('+a+')*180/Math.PI)'; });
        e = e.replace(/atan\(([^)]+)\)/g, function(_,a){ return '(Math.atan('+a+')*180/Math.PI)'; });
        e = e.replace(/sin\(([^)]+)\)/g, function(_,a){ return 'Math.sin(('+a+')*Math.PI/180)'; });
        e = e.replace(/cos\(([^)]+)\)/g, function(_,a){ return 'Math.cos(('+a+')*Math.PI/180)'; });
        e = e.replace(/tan\(([^)]+)\)/g, function(_,a){ return 'Math.tan(('+a+')*Math.PI/180)'; });
      } else {
        e = e.replace(/asin\(/g,'Math.asin(').replace(/acos\(/g,'Math.acos(').replace(/atan\(/g,'Math.atan(');
        e = e.replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(');
      }
      e = e.replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(');
      var opens = (e.match(/\(/g)||[]).length;
      var closes = (e.match(/\)/g)||[]).length;
      for (var i = 0; i < opens - closes; i++) e += ')';
      return Function('"use strict"; return (' + e + ')')();
    }

    function formatResult(n) {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toPrecision(10)).toString();
    }

    function livePreview() {
      try {
        var val = evalExpr(expression);
        if (!isNaN(val) && isFinite(val)) lastResult = formatResult(val);
      } catch(e) {}
      updateDisplay();
    }

    var root = document.getElementById(uid);
    root.addEventListener('click', function(ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var a = btn.dataset.a;
      if (!a) return;
      if (a === 't') { expression += btn.dataset.t; livePreview(); }
      else if (a === 'fn') { expression += btn.dataset.fn; updateDisplay(); }
      else if (a === 'ac') { expression = ''; lastResult = '0'; updateDisplay(); }
      else if (a === 'del') {
        if (expression.match(/(sin|cos|tan|log|abs|exp)\($/)) expression = expression.slice(0,-4);
        else if (expression.match(/(asin|acos|atan|cbrt|10\^)\($/)) expression = expression.slice(0,-5);
        else if (expression.match(/(ln|\u221A|1\/)\($/)) expression = expression.slice(0,-3);
        else expression = expression.slice(0,-1);
        if (expression) livePreview(); else { lastResult = '0'; updateDisplay(); }
      }
      else if (a === 'eq') {
        if (!expression) return;
        try {
          var val = evalExpr(expression);
          lastResult = (isNaN(val) || !isFinite(val)) ? 'Error' : formatResult(val);
        } catch(e) { lastResult = 'Error'; }
        expression = ''; updateDisplay();
      }
      else if (a === 'sign') {
        expression = '(\u2212(' + expression + '))'; livePreview();
      }
      else if (a === 'mc') { memory = 0; memEl.textContent = ''; }
      else if (a === 'mr') { expression += String(memory); updateDisplay(); }
      else if (a === 'm+') { memory += parseFloat(lastResult)||0; memEl.textContent = 'M: ' + formatResult(memory); }
      else if (a === 'm-') { memory -= parseFloat(lastResult)||0; memEl.textContent = 'M: ' + formatResult(memory); }
    });

    modeEl.addEventListener('click', function() {
      isDeg = !isDeg;
      modeEl.textContent = isDeg ? 'DEG' : 'RAD';
    });

    updateDisplay();
  };
})();
