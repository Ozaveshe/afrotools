window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.regexTester = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Pattern: "Expression régulière",
    g: "g",
    i: "i",
    m: "m",
    s: "s",
    "Test String": "Texte à tester",
    Matches: "Correspondances",
    Dark: "Mode sombre",
    "Enter regex pattern...": "Saisissez une expression régulière…",
    "Enter test string...": "Saisissez le texte à tester…"
  };
  var a = "dark" === ((t = t || {}).theme || "light"), r = a ? "#1a1a2e" : "#fff", l = a ? "#e0e0e0" : "#333", n = a ? "#16213e" : "#f5f7fa", i = a ? "#333" : "#ddd", o = a ? "rgba(0,98,204,0.3)" : "rgba(0,98,204,0.15)";
  e.innerHTML = '<div class="aw-regex-tester" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + l + ";padding:20px;border-radius:10px;border:1px solid " + i + '"><div class="aw-field" style="margin-bottom:10px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Pattern") + '</label><div style="display:flex;gap:8px"><input type="text" class="aw-input aw-regex-pattern" style="flex:1;padding:8px 10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + l + ';box-sizing:border-box" placeholder="' + translate("Enter regex pattern...") + '"><div style="display:flex;gap:4px;align-items:center;font-size:12px"><label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-g" checked> g</label><label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-i"> i</label><label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-m"> m</label><label style="display:flex;align-items:center;gap:2px"><input type="checkbox" class="aw-regex-flag-s"> s</label></div></div></div><div class="aw-regex-error" style="font-size:12px;color:#dc2626;margin-bottom:6px"></div><div class="aw-field" style="margin-bottom:10px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Test String") + '</label><textarea class="aw-input aw-regex-test" style="width:100%;min-height:100px;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + l + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Enter test string...") + '"></textarea></div><div class="aw-field" style="margin-bottom:10px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Matches") + '</label><div class="aw-regex-matches" style="min-height:60px;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + l + ';white-space:pre-wrap;word-break:break-all;overflow-y:auto;max-height:200px"></div></div><div class="aw-regex-info" style="font-size:12px;color:#888"></div>' + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var s = e.querySelector(".aw-regex-pattern"), g = e.querySelector(".aw-regex-test"), d = e.querySelector(".aw-regex-matches"), p = e.querySelector(".aw-regex-error"), c = e.querySelector(".aw-regex-info");
  let activeWorker, deadline;
  function matchInWorker(event) {
    const {text: text, pattern: pattern, flags: flags} = event.data;
    try {
      const expression = new RegExp(pattern, flags);
      const matches = [];
      let match;
      while ((match = expression.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          groups: matches.length ? [] : match.slice(1)
        });
        if (!expression.global) break;
        if (!match[0].length) expression.lastIndex++;
      }
      self.postMessage({
        matches: matches
      });
    } catch {
      self.postMessage({
        invalid: true
      });
    }
  }
  function stopWorker() {
    if (activeWorker) activeWorker.terminate();
    activeWorker = null;
    clearTimeout(deadline);
  }
  function f() {
    stopWorker();
    p.textContent = "";
    c.textContent = "";
    d.replaceChildren();
    const pattern = s.value, text = g.value, french = locale === "fr-FR";
    if (!text || !pattern) return;
    const flags = [ "g", "i", "m", "s" ].filter(flag => e.querySelector(".aw-regex-flag-" + flag).checked).join("");
    const url = URL.createObjectURL(new Blob([ "self.onmessage=" + matchInWorker.toString() ], {
      type: "text/javascript"
    }));
    let worker;
    try {
      worker = new Worker(url);
    } catch {
      p.textContent = french ? "Le navigateur a bloqué le traitement local de l’expression." : "The browser blocked the local expression worker.";
      return;
    } finally {
      URL.revokeObjectURL(url);
    }
    activeWorker = worker;
    worker.onerror = () => {
      if (worker === activeWorker) {
        stopWorker();
        p.textContent = french ? "Impossible de terminer le calcul local." : "The local match could not finish.";
      }
    };
    deadline = setTimeout(() => {
      if (activeWorker !== worker) return;
      stopWorker();
      p.textContent = french ? "Calcul interrompu au bout de trois secondes. Simplifiez l’expression ou raccourcissez le texte." : "Matching stopped after three seconds. Simplify the pattern or shorten the text.";
    }, 3e3);
    worker.onmessage = ({data: data}) => {
      if (worker !== activeWorker) return;
      stopWorker();
      if (data.invalid) {
        p.textContent = french ? "Expression invalide. Vérifiez les groupes, les crochets et les caractères d’échappement." : "Invalid pattern. Check groups, brackets and escapes.";
        return;
      }
      const fragment = document.createDocumentFragment();
      let end = 0;
      for (const item of data.matches) {
        fragment.append(text.slice(end, item.index));
        const highlight = document.createElement("mark");
        highlight.textContent = text.slice(item.index, item.index + item.length);
        fragment.append(highlight);
        end = item.index + item.length;
      }
      fragment.append(text.slice(end));
      d.replaceChildren(fragment);
      const count = data.matches.length;
      c.textContent = count + (french ? " correspondance" + (count > 1 ? "s" : "") : " match" + (count === 1 ? "" : "es"));
      const groups = count && data.matches[0].groups;
      if (groups.length) c.textContent += (french ? " · Groupes : " : " · Groups: ") + groups.map((value, index) => "(" + (index + 1) + ") " + (value ?? (french ? "sans valeur" : "undefined"))).join(", ");
    };
    worker.postMessage({
      pattern: pattern,
      text: text,
      flags: flags
    });
  }
  s.addEventListener("input", f), g.addEventListener("input", f), e.querySelector(".aw-regex-flag-g").addEventListener("change", f),
  e.querySelector(".aw-regex-flag-i").addEventListener("change", f), e.querySelector(".aw-regex-flag-m").addEventListener("change", f),
  e.querySelector(".aw-regex-flag-s").addEventListener("change", f);
};
