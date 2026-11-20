window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.colorContrast = function(e, t) {
  const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const local = (en, native) => fr ? native : en;
  var a = "dark" === ((t = t || {}).theme || "light"), i = a ? "#1a1a2e" : "#fff", r = a ? "#e0e0e0" : "#333", o = a ? "#16213e" : "#f5f7fa", s = a ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-color-contrast" style="font-family:\'Inter\',sans-serif;background:' + i + ";color:" + r + ";padding:20px;border-radius:10px;border:1px solid " + s + '"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin-bottom:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + local("Foreground", "Couleur du texte") + '</label><div style="display:flex;gap:8px;align-items:center"><input type="color" class="aw-cc-fg" value="#000000" style="width:50px;height:40px;border:none;cursor:pointer;border-radius:6px;padding:0"><input type="text" class="aw-input aw-cc-fg-hex" value="#000000" style="flex:1;min-width:0;padding:8px;border:1px solid ' + s + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + o + ";color:" + r + ';box-sizing:border-box"></div></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + local("Background", "Couleur de fond") + '</label><div style="display:flex;gap:8px;align-items:center"><input type="color" class="aw-cc-bg" value="#FFFFFF" style="width:50px;height:40px;border:none;cursor:pointer;border-radius:6px;padding:0"><input type="text" class="aw-input aw-cc-bg-hex" value="#FFFFFF" style="flex:1;min-width:0;padding:8px;border:1px solid ' + s + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + o + ";color:" + r + ';box-sizing:border-box"></div></div></div><div class="aw-cc-preview" style="padding:20px;border-radius:8px;margin-bottom:12px;text-align:center;border:1px solid ' + s + '"><div style="font-size:24px;font-weight:700;margin-bottom:4px">' + local("Sample Text", "Exemple de texte") + '</div><div style="font-size:14px">' + local("The quick brown fox jumps over the lazy dog", "Voyez comme ces lettres se détachent du fond.") + '</div></div><div class="aw-result-box" style="text-align:center;padding:16px;background:' + o + ";border:1px solid " + s + ';border-radius:8px;margin-bottom:12px"><div style="font-size:14px;font-weight:600;margin-bottom:4px">' + local("Contrast Ratio", "Rapport de contraste") + '</div><div class="aw-cc-ratio" style="font-size:36px;font-weight:700;color:#0062CC">21:1</div></div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"><div class="aw-result-box aw-cc-aa-normal" style="padding:10px;border-radius:8px;border:1px solid ' + s + ';text-align:center"><div style="font-size:11px;font-weight:600;margin-bottom:2px">' + local("AA Normal", "AA · Texte courant") + '</div><div style="font-size:11px;color:#888">' + local("4.5:1 required", "Minimum 4,5:1") + '</div><div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div></div><div class="aw-result-box aw-cc-aa-large" style="padding:10px;border-radius:8px;border:1px solid ' + s + ';text-align:center"><div style="font-size:11px;font-weight:600;margin-bottom:2px">' + local("AA Large", "AA · Grand texte") + '</div><div style="font-size:11px;color:#888">' + local("3:1 required", "Minimum 3:1") + '</div><div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div></div><div class="aw-result-box aw-cc-aaa-normal" style="padding:10px;border-radius:8px;border:1px solid ' + s + ';text-align:center"><div style="font-size:11px;font-weight:600;margin-bottom:2px">' + local("AAA Normal", "AAA · Texte courant") + '</div><div style="font-size:11px;color:#888">' + local("7:1 required", "Minimum 7:1") + '</div><div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div></div><div class="aw-result-box aw-cc-aaa-large" style="padding:10px;border-radius:8px;border:1px solid ' + s + ';text-align:center"><div style="font-size:11px;font-weight:600;margin-bottom:2px">' + local("AAA Large", "AAA · Grand texte") + '</div><div style="font-size:11px;color:#888">' + local("4.5:1 required", "Minimum 4,5:1") + '</div><div class="aw-cc-status" style="font-size:13px;font-weight:700;margin-top:4px"></div></div></div><div style="margin-top:8px;text-align:center"><button class="aw-btn aw-cc-swap" style="padding:6px 12px;background:' + o + ";color:" + r + ";border:1px solid " + s + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + local("Swap Colors", "Inverser les couleurs") + "</button></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var l = e.querySelector(".aw-cc-fg"), d = e.querySelector(".aw-cc-bg"), n = e.querySelector(".aw-cc-fg-hex"), p = e.querySelector(".aw-cc-bg-hex"), c = e.querySelector(".aw-cc-preview"), x = e.querySelector(".aw-cc-ratio");
  function g(e) {
    return 3 === (e = e.replace(/^#/, "")).length && (e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]),
    {
      r: parseInt(e.substring(0, 2), 16),
      g: parseInt(e.substring(2, 4), 16),
      b: parseInt(e.substring(4, 6), 16)
    };
  }
  function u(e, t, a) {
    var i = e / 255, r = t / 255, o = a / 255;
    return .2126 * (i = i <= .04045 ? i / 12.92 : Math.pow((i + .055) / 1.055, 2.4)) + .7152 * (r = r <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4)) + .0722 * (o <= .04045 ? o / 12.92 : Math.pow((o + .055) / 1.055, 2.4));
  }
  function v(t, i) {
    var r = e.querySelector(t + " .aw-cc-status");
    r.textContent = i ? local("PASS", "Conforme") : local("FAIL", "Insuffisant"), r.style.color = i ? "#0062CC" : "#dc2626",
    e.querySelector(t).style.background = i ? a ? "rgba(22,163,74,0.1)" : "rgba(22,163,74,0.05)" : a ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.05)";
  }
  function f() {
    var e, t, a = g(n.value), i = g(p.value), r = (e = u(a.r, a.g, a.b), t = u(i.r, i.g, i.b),
    (Math.max(e, t) + .05) / (Math.min(e, t) + .05));
    c.style.color = l.value, c.style.background = d.value, x.textContent = r.toLocaleString(fr ? "fr" : "en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ":1", v(".aw-cc-aa-normal", r >= 4.5), v(".aw-cc-aa-large", r >= 3), v(".aw-cc-aaa-normal", r >= 7),
    v(".aw-cc-aaa-large", r >= 4.5);
  }
  l.addEventListener("input", function() {
    n.value = this.value.toUpperCase(), n.dispatchEvent(new Event("input"));
  }), d.addEventListener("input", function() {
    p.value = this.value.toUpperCase(), p.dispatchEvent(new Event("input"));
  }), [ n, p ].forEach((input, index) => {
    const picker = index ? d : l;
    input.setAttribute("aria-label", index ? local("Background HEX", "Code hexadécimal du fond") : local("Foreground HEX", "Code hexadécimal du texte"));
    picker.setAttribute("aria-label", index ? local("Pick background colour", "Choisir la couleur de fond") : local("Pick foreground colour", "Choisir la couleur du texte"));
    input.addEventListener("input", () => {
      const value = input.value.trim().replace(/^#/, "");
      if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
        input.setAttribute("aria-invalid", "true");
        x.textContent = local("Enter 3 or 6 HEX digits", "Saisissez 3 ou 6 chiffres hexadécimaux");
        e.querySelectorAll(".aw-cc-status").forEach(node => node.textContent = "—");
        return;
      }
      input.removeAttribute("aria-invalid");
      picker.value = "#" + (value.length === 3 ? [ ...value ].map(c => c + c).join("") : value);
      if (![ n, p ].some(el => el.hasAttribute("aria-invalid"))) f();
    });
  }), e.querySelector(".aw-cc-swap").addEventListener("click", function() {
    if ([ n, p ].some(el => el.hasAttribute("aria-invalid"))) return;
    var e = l.value, t = n.value;
    l.value = d.value, n.value = p.value, d.value = e, p.value = t, f();
  }), f();
};
