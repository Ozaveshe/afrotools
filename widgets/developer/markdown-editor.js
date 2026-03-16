(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.markdownEditor = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    container.innerHTML =
      '<div class="aw-markdown-editor" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
          '<button class="aw-btn aw-md-bold" title="Bold" style="padding:4px 8px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit"><b>B</b></button>' +
          '<button class="aw-btn aw-md-italic" title="Italic" style="padding:4px 8px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:13px;font-style:italic;font-family:inherit"><i>I</i></button>' +
          '<button class="aw-btn aw-md-code" title="Code" style="padding:4px 8px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-family:\'Courier New\',monospace;font-size:12px">`C`</button>' +
          '<button class="aw-btn aw-md-link" title="Link" style="padding:4px 8px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit">Link</button>' +
          '<div class="aw-md-stats" style="margin-left:auto;font-size:11px;color:#888"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Markdown</label>' +
            '<textarea class="aw-input aw-md-input" style="width:100%;min-height:200px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';resize:vertical;box-sizing:border-box" placeholder="Write markdown here..."></textarea>' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Preview</label>' +
            '<div class="aw-md-preview" style="min-height:200px;padding:10px;border:1px solid '+borderColor+';border-radius:6px;background:'+inputBg+';color:'+fg+';overflow-y:auto;font-size:14px;line-height:1.6"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
          '<button class="aw-btn aw-md-copy-html" style="padding:6px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy HTML</button>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var inputEl = container.querySelector('.aw-md-input');
    var previewEl = container.querySelector('.aw-md-preview');
    var statsEl = container.querySelector('.aw-md-stats');
    var lastHtml = '';

    // Simple markdown parser (no external deps)
    function parseMd(md) {
      var html = md
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:'+( isDark?'#0d1117':'#f0f0f0')+';padding:10px;border-radius:6px;overflow-x:auto"><code>$2</code></pre>')
        // Headers
        .replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
        .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
        .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid '+borderColor+'">')
        // Bold + Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code style="background:'+(isDark?'#0d1117':'#f0f0f0')+';padding:2px 4px;border-radius:3px;font-size:0.9em">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:'+primary+'" target="_blank">$1</a>')
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px">')
        // Blockquotes
        .replace(/^>\s+(.*)$/gm, '<blockquote style="border-left:3px solid '+primary+';padding-left:12px;margin:8px 0;color:#888">$1</blockquote>')
        // Unordered lists
        .replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      return '<p>' + html + '</p>';
    }

    function update() {
      var md = inputEl.value;
      lastHtml = parseMd(md);
      previewEl.innerHTML = lastHtml;

      var text = md.trim();
      if (text) {
        var words = text.split(/\s+/).filter(function(w){return w.length>0;}).length;
        var chars = text.length;
        var readTime = Math.ceil(words / 200);
        statsEl.textContent = words + ' words, ' + chars + ' chars, ~' + readTime + ' min read';
      } else {
        statsEl.textContent = '';
      }
    }

    function wrapSelection(before, after) {
      var start = inputEl.selectionStart;
      var end = inputEl.selectionEnd;
      var text = inputEl.value;
      var selected = text.substring(start, end) || 'text';
      inputEl.value = text.substring(0, start) + before + selected + after + text.substring(end);
      inputEl.focus();
      inputEl.selectionStart = start + before.length;
      inputEl.selectionEnd = start + before.length + selected.length;
      update();
    }

    container.querySelector('.aw-md-bold').addEventListener('click', function() { wrapSelection('**', '**'); });
    container.querySelector('.aw-md-italic').addEventListener('click', function() { wrapSelection('*', '*'); });
    container.querySelector('.aw-md-code').addEventListener('click', function() { wrapSelection('`', '`'); });
    container.querySelector('.aw-md-link').addEventListener('click', function() { wrapSelection('[', '](url)'); });

    inputEl.addEventListener('input', update);

    container.querySelector('.aw-md-copy-html').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(lastHtml).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy HTML'; }, 1500); });
    });
  };
})();
