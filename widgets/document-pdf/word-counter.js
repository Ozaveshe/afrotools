(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.wordCounter = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-word-counter" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Text</label>' +
          '<textarea class="aw-input aw-wc-input" style="width:100%;min-height:160px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:inherit;font-size:14px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box;line-height:1.6" placeholder="Paste or type your text here..."></textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">' +
          '<div class="aw-result-box" style="text-align:center;padding:12px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-words" style="font-size:24px;font-weight:700;color:'+primary+'">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Words</div>' +
          '</div>' +
          '<div class="aw-result-box" style="text-align:center;padding:12px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-chars" style="font-size:24px;font-weight:700;color:'+primary+'">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Characters</div>' +
          '</div>' +
          '<div class="aw-result-box" style="text-align:center;padding:12px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-chars-ns" style="font-size:24px;font-weight:700;color:'+primary+'">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">No Spaces</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' +
          '<div class="aw-result-box" style="text-align:center;padding:10px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-sentences" style="font-size:18px;font-weight:700">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Sentences</div>' +
          '</div>' +
          '<div class="aw-result-box" style="text-align:center;padding:10px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-paragraphs" style="font-size:18px;font-weight:700">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Paragraphs</div>' +
          '</div>' +
          '<div class="aw-result-box" style="text-align:center;padding:10px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-avgword" style="font-size:18px;font-weight:700">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Avg Word Len</div>' +
          '</div>' +
          '<div class="aw-result-box" style="text-align:center;padding:10px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:8px">' +
            '<div class="aw-wc-readtime" style="font-size:18px;font-weight:700">0</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px">Min Read</div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var inputEl = container.querySelector('.aw-wc-input');

    function count() {
      var text = inputEl.value;
      var trimmed = text.trim();

      var words = 0, sentences = 0, paragraphs = 0, avgWord = 0;
      if (trimmed) {
        var wordArr = trimmed.split(/\s+/).filter(function(w){return w.length>0;});
        words = wordArr.length;
        sentences = trimmed.split(/[.!?]+(?:\s|$)/).filter(function(s){return s.trim().length>0;}).length;
        paragraphs = trimmed.split(/\n\n+/).filter(function(p){return p.trim().length>0;}).length;
        var charsNoSpace = text.replace(/\s/g, '').length;
        avgWord = words > 0 ? (charsNoSpace / words).toFixed(1) : 0;
      }

      container.querySelector('.aw-wc-words').textContent = words;
      container.querySelector('.aw-wc-chars').textContent = text.length;
      container.querySelector('.aw-wc-chars-ns').textContent = text.replace(/\s/g, '').length;
      container.querySelector('.aw-wc-sentences').textContent = sentences;
      container.querySelector('.aw-wc-paragraphs').textContent = paragraphs;
      container.querySelector('.aw-wc-avgword').textContent = avgWord;
      container.querySelector('.aw-wc-readtime').textContent = Math.ceil(words / 200) || 0;
    }

    inputEl.addEventListener('input', count);
  };
})();
