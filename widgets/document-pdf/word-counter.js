window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.wordCounter = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Text: "Texte",
    Words: "Mots",
    Characters: "Caractères",
    "No Spaces": "Hors espaces",
    Sentences: "Phrases",
    Paragraphs: "Paragraphes",
    "Avg Word Len": "Longueur moyenne des mots",
    "Min Read": "Lecture (min)",
    "Paste or type your text here...": "Collez ou saisissez votre texte…"
  };
  var r = "dark" === ((t = t || {}).theme || "light"), i = r ? "#1a1a2e" : "#fff", o = r ? "#e0e0e0" : "#333", d = r ? "#16213e" : "#f5f7fa", a = r ? "#333" : "#ddd", s = "#0062CC";
  e.innerHTML = '<div class="aw-word-counter" style="font-family:\'Inter\',sans-serif;background:' + i + ";color:" + o + ";padding:20px;border-radius:10px;border:1px solid " + a + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Text") + '</label><textarea class="aw-input aw-wc-input" style="width:100%;min-height:160px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:inherit;font-size:14px;background:" + d + ";color:" + o + ';resize:vertical;box-sizing:border-box;line-height:1.6" placeholder="' + translate("Paste or type your text here...") + '"></textarea></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,5rem),1fr));gap:10px;margin-bottom:10px"><div class="aw-result-box" style="text-align:center;padding:12px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-words" style="font-size:24px;font-weight:700;color:' + s + '">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Words") + '</div></div><div class="aw-result-box" style="text-align:center;padding:12px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-chars" style="font-size:24px;font-weight:700;color:' + s + '">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Characters") + '</div></div><div class="aw-result-box" style="text-align:center;padding:12px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-chars-ns" style="font-size:24px;font-weight:700;color:' + s + '">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("No Spaces") + '</div></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,5rem),1fr));gap:10px"><div class="aw-result-box" style="text-align:center;padding:10px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-sentences" style="font-size:18px;font-weight:700">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Sentences") + '</div></div><div class="aw-result-box" style="text-align:center;padding:10px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-paragraphs" style="font-size:18px;font-weight:700">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Paragraphs") + '</div></div><div class="aw-result-box" style="text-align:center;padding:10px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-avgword" style="font-size:18px;font-weight:700">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Avg Word Len") + '</div></div><div class="aw-result-box" style="text-align:center;padding:10px;background:' + d + ";border:1px solid " + a + ';border-radius:8px"><div class="aw-wc-readtime" style="font-size:18px;font-weight:700">0</div><div style="font-size:11px;color:#888;margin-top:2px">' + translate("Min Read") + "</div></div></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var n = e.querySelector(".aw-wc-input");
  const hasSegmenter = typeof Intl.Segmenter === "function";
  const graphemes = hasSegmenter ? new Intl.Segmenter(locale, {
    granularity: "grapheme"
  }) : null;
  const words = hasSegmenter ? new Intl.Segmenter(locale, {
    granularity: "word"
  }) : null;
  const sentences = hasSegmenter ? new Intl.Segmenter(locale, {
    granularity: "sentence"
  }) : null;
  function size(value) {
    return graphemes ? Array.from(graphemes.segment(value)).length : Array.from(value).length;
  }
  n.addEventListener("input", function() {
    const value = n.value, trimmed = value.trim();
    const tokens = words ? Array.from(words.segment(trimmed)).filter(token => token.isWordLike).map(token => token.segment) : trimmed.split(/\s+/).filter(Boolean);
    const count = tokens.length;
    const metrics = {
      words: count,
      chars: size(value),
      "chars-ns": size(value.replace(/\s/g, "")),
      sentences: !trimmed ? 0 : sentences ? Array.from(sentences.segment(trimmed)).filter(part => part.segment.trim()).length : trimmed.split(/[.!?]+/).filter(part => part.trim()).length,
      paragraphs: trimmed ? trimmed.split(/\n\s*\n+/).length : 0,
      avgword: count ? (tokens.reduce((total, word) => total + size(word), 0) / count).toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) : 0,
      readtime: Math.ceil(count / 200)
    };
    for (const [metric, result] of Object.entries(metrics)) e.querySelector(".aw-wc-" + metric).textContent = result;
  });
};
