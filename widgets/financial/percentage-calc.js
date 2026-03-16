(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.percentage_calc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_pct_' + Math.random().toString(36).substr(2,6);
    var modes = [
      {id:'pctOf', label:'X% of Y', fields:['Percentage','Value'], calc:function(a,b){ return {result: a*b/100, label:'Result'}; }},
      {id:'whatPct', label:'X is ?% of Y', fields:['X','Y'], calc:function(a,b){ return b>0?{result:(a/b)*100, label:'Percentage', suffix:'%'}:{result:0, label:'N/A'}; }},
      {id:'change', label:'% Change', fields:['Old Value','New Value'], calc:function(a,b){ return a>0?{result:((b-a)/a)*100, label:'% Change', suffix:'%'}:{result:0, label:'N/A'}; }},
      {id:'discount', label:'Discount', fields:['Price','Discount %'], calc:function(a,b){ var s=a*b/100; return {result: a-s, label:'Sale Price', extra:'You save: '+fmt(s)}; }},
      {id:'tipSplit', label:'Tip & Split', fields:['Bill','Tip %'], calc:function(a,b){ var tip=a*b/100; return {result:a+tip, label:'Total', extra:'Tip: '+fmt(tip)}; }},
      {id:'marginMarkup', label:'Margin/Markup', fields:['Cost','Selling Price'], calc:function(a,b){ var p=b-a; var margin=b>0?(p/b*100):0; var markup=a>0?(p/a*100):0; return {result:margin, label:'Margin', suffix:'%', extra:'Markup: '+markup.toFixed(1)+'%'}; }}
    ];

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

    var modeButtons = '';
    for (var i = 0; i < modes.length; i++) {
      var sel = i === 0 ? 'background:'+accent+';color:#fff;border-color:'+accent : 'background:transparent;color:'+fg+';border-color:'+border;
      modeButtons += '<button class="aw-btn '+uid+'_modeBtn" data-idx="'+i+'" style="padding:6px 10px;border:2px solid;border-radius:6px;cursor:pointer;font-size:0.78rem;'+sel+';">'+modes[i].label+'</button>';
    }

    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 12px;font-size:1.1rem;">Percentage Calculator</h3>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;">'+modeButtons+'</div>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" id="'+uid+'_lbl1" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">'+modes[0].fields[0]+'</label><input class="aw-input" id="'+uid+'_val1" type="number" step="any" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" id="'+uid+'_lbl2" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">'+modes[0].fields[1]+'</label><input class="aw-input" id="'+uid+'_val2" type="number" step="any" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';" id="'+uid+'_resLabel">Result</div>';
    html += '<div class="aw-result-main" id="'+uid+'_resMain" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div id="'+uid+'_extra" style="font-size:0.85rem;color:'+muted+';margin-top:6px;"></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    var currentIdx = 0;
    var modeBtns = container.querySelectorAll('.'+uid+'_modeBtn');
    for (var j = 0; j < modeBtns.length; j++) {
      modeBtns[j].onclick = (function(btn) {
        return function() {
          currentIdx = parseInt(btn.dataset.idx);
          for (var k = 0; k < modeBtns.length; k++) {
            modeBtns[k].style.background = 'transparent'; modeBtns[k].style.color = fg; modeBtns[k].style.borderColor = border;
          }
          btn.style.background = accent; btn.style.color = '#fff'; btn.style.borderColor = accent;
          document.getElementById(uid+'_lbl1').textContent = modes[currentIdx].fields[0];
          document.getElementById(uid+'_lbl2').textContent = modes[currentIdx].fields[1];
          document.getElementById(uid+'_result').style.display = 'none';
        };
      })(modeBtns[j]);
    }

    document.getElementById(uid+'_calc').onclick = function() {
      var a = parseFloat(document.getElementById(uid+'_val1').value) || 0;
      var b = parseFloat(document.getElementById(uid+'_val2').value) || 0;
      var r = modes[currentIdx].calc(a, b);
      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_resLabel').textContent = r.label;
      document.getElementById(uid+'_resMain').textContent = fmt(r.result) + (r.suffix || '');
      document.getElementById(uid+'_extra').textContent = r.extra || '';
    };
  };
})();
