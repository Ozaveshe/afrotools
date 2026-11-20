window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.markdownEditor = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Markdown: "Markdown",
    Preview: "Aperçu",
    "Copy HTML": "Copier le HTML",
    Bold: "Gras",
    Italic: "Italique",
    Code: "Code",
    Link: "Lien",
    "Write markdown here...": "Saisissez votre texte en Markdown…",
    "Copied!": "Copié !"
  };
  var r = "dark" === ((t = t || {}).theme || "light"), o = r ? "#1a1a2e" : "#fff", i = r ? "#e0e0e0" : "#333", n = r ? "#16213e" : "#f5f7fa", a = r ? "#333" : "#ddd", l = "#0062CC";
  e.innerHTML = '<div class="aw-markdown-editor" style="font-family:\'Inter\',sans-serif;background:' + o + ";color:" + i + ";padding:20px;border-radius:10px;border:1px solid " + a + '"><div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><button class="aw-btn aw-md-bold" title="' + translate("Bold") + '" aria-label="' + translate("Bold") + '" style="padding:4px 8px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:4px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit"><b>B</b></button><button class="aw-btn aw-md-italic" title="' + translate("Italic") + '" aria-label="' + translate("Italic") + '" style="padding:4px 8px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:4px;cursor:pointer;font-size:13px;font-style:italic;font-family:inherit"><i>I</i></button><button class="aw-btn aw-md-code" title="' + translate("Code") + '" aria-label="' + translate("Code") + '" style="padding:4px 8px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:4px;cursor:pointer;font-family:\'Courier New\',monospace;font-size:12px">`C`</button><button class="aw-btn aw-md-link" title="' + translate("Link") + '" aria-label="' + translate("Link") + '" style="padding:4px 8px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit">' + translate("Link") + '</button><div class="aw-md-stats" style="margin-left:auto;font-size:11px;color:#888"></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr));gap:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + translate("Markdown") + '</label><textarea aria-label="Markdown" class="aw-input aw-md-input" style="width:100%;min-height:200px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + i + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Write markdown here...") + '"></textarea></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + translate("Preview") + '</label><div class="aw-md-preview" style="min-height:200px;padding:10px;border:1px solid ' + a + ";border-radius:6px;background:" + n + ";color:" + i + ';overflow-y:auto;font-size:14px;line-height:1.6"></div></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="aw-btn aw-md-copy-html" style="padding:6px 12px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy HTML") + "</button></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var d = e.querySelector(".aw-md-input"), s = e.querySelector(".aw-md-preview"), p = e.querySelector(".aw-md-stats"), c = "";
  var eCopy = null;
  function renderMarkdown(target, source) {
    function inline(parent, text) {
      const tokens = /(!?)\[([^\]]*)\]\(([^)\s]+)\)|(\*\*\*|\*\*|\*|\x60)(.+?)\4/g;
      let start = 0;
      for (const token of text.matchAll(tokens)) {
        parent.append(text.slice(start, token.index));
        if (token[3]) {
          let url;
          try {
            url = new URL(token[3], document.baseURI);
          } catch {
            url = null;
          }
          if (!url || ![ "https:", "http:" ].includes(url.protocol)) {
            parent.append(token[2]);
          } else if (token[1] === "!") {
            const image = document.createElement("img");
            image.alt = token[2];
            image.src = url.href;
            image.style.maxWidth = "100%";
            parent.append(image);
          } else {
            const link = document.createElement("a");
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = token[2];
            parent.append(link);
          }
        } else {
          const marks = token[4];
          const element = document.createElement(marks === "*" ? "em" : marks.charCodeAt(0) === 96 ? "code" : "strong");
          if (marks === "***") {
            const emphasis = document.createElement("em");
            emphasis.textContent = token[5];
            element.append(emphasis);
          } else element.textContent = token[5];
          parent.append(element);
        }
        start = token.index + token[0].length;
      }
      parent.append(text.slice(start));
    }
    const fragment = document.createDocumentFragment();
    let paragraph, list, code;
    for (const line of source.split(/\r?\n/)) {
      if (/^\x60{3}/.test(line)) {
        paragraph = list = null;
        if (code) code = null; else {
          const pre = document.createElement("pre");
          code = document.createElement("code");
          pre.append(code);
          fragment.append(pre);
        }
        continue;
      }
      if (code) {
        code.append(line + "\n");
        continue;
      }
      const bullet = /^[-*]\s+(.*)$/.exec(line);
      if (bullet) {
        paragraph = null;
        if (!list) {
          list = document.createElement("ul");
          fragment.append(list);
        }
        const item = document.createElement("li");
        inline(item, bullet[1]);
        list.append(item);
        continue;
      }
      list = null;
      if (!line.trim()) {
        paragraph = null;
        continue;
      }
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      const quote = /^>\s+(.*)$/.exec(line);
      if (heading || quote || line === "---") {
        paragraph = null;
        const el = document.createElement(heading ? "h" + heading[1].length : quote ? "blockquote" : "hr");
        if (heading || quote) inline(el, heading ? heading[2] : quote[1]);
        fragment.append(el);
        continue;
      }
      if (!paragraph) {
        paragraph = document.createElement("p");
        fragment.append(paragraph);
      } else paragraph.append(document.createElement("br"));
      inline(paragraph, line);
    }
    target.replaceChildren(fragment);
  }
  function g() {
    var e = d.value;
    renderMarkdown(s, e);
    c = s.innerHTML;
    var old = eCopy;
    if (old) old.remove();
    eCopy = null;
    var t = e.trim();
    if (t) {
      var o = t.split(/\s+/).filter(function(e) {
        return e.length > 0;
      }).length, i = t.length, n = Math.ceil(o / 200);
      p.textContent = locale === "fr-FR" ? o + " mot" + (o > 1 ? "s" : "") + " · " + i + " caractères · environ " + n + " min de lecture" : o + " words, " + i + " chars, ~" + n + " min read";
    } else p.textContent = "";
  }
  function u(e, t) {
    var r = d.selectionStart, o = d.selectionEnd, i = d.value, n = i.substring(r, o) || (locale === "fr-FR" ? "texte" : "text");
    d.value = i.substring(0, r) + e + n + t + i.substring(o), d.focus(), d.selectionStart = r + e.length,
    d.selectionEnd = r + e.length + n.length, g();
  }
  e.querySelector(".aw-md-bold").addEventListener("click", function() {
    u("**", "**");
  }), e.querySelector(".aw-md-italic").addEventListener("click", function() {
    u("*", "*");
  }), e.querySelector(".aw-md-code").addEventListener("click", function() {
    u("`", "`");
  }), e.querySelector(".aw-md-link").addEventListener("click", function() {
    u("[", "](url)");
  }), d.addEventListener("input", g), e.querySelector(".aw-md-copy-html").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(c);
        e.textContent = translate("Copied!");
      } catch {
        if (!eCopy) {
          eCopy = document.createElement("textarea");
          eCopy.readOnly = true;
          eCopy.style.width = "100%";
          eCopy.setAttribute("aria-label", locale === "fr-FR" ? "HTML à copier" : "HTML to copy");
          e.parentNode.after(eCopy);
        }
        eCopy.value = c;
        eCopy.focus();
        eCopy.select();
        e.textContent = locale === "fr-FR" ? "HTML sélectionné : utilisez la commande Copier" : "HTML selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy HTML");
      }, 3e3);
    })();
  });
};
