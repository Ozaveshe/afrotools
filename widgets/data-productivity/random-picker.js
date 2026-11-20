window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.randomPicker = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Random Picker ": "Tirage au sort ",
    "0 items": "0 élément",
    Names: "Noms",
    Numbers: "Nombres",
    "Coin Flip": "Pile ou face",
    "Enter names/items (one per line)": "Saisissez un nom ou un élément par ligne",
    "How many to pick?": "Combien en tirer ?",
    "Pick Random Name(s)": "Tirer au sort",
    Minimum: "Minimum",
    Maximum: "Maximum",
    "How many?": "Combien de nombres ?",
    "Generate Random Number(s)": "Tirer des nombres",
    "Flip a fair coin. 50/50 chance. Uses cryptographic randomness.": "Chaque côté a une chance sur deux de sortir.",
    "Flip Coin": "Lancer la pièce",
    "Check your list and requested count.": "Vérifiez la liste et le nombre d’éléments à tirer.",
    "Check the integer range and requested count.": "Vérifiez les bornes entières et le nombre de valeurs à tirer.",
    Heads: "Pile",
    Tails: "Face",
    "Coin flip": "Lancer de pièce"
  };
  var n = (t = t || {}).theme || "light", i = "dark" === n ? "#1a1a2e" : "#fff", o = "dark" === n ? "#e2e8f0" : "#0f1419", r = "dark" === n ? "#94a3b8" : "#64748b", a = "dark" === n ? "rgba(255,255,255,.12)" : "#e2e8f0", d = "dark" === n ? "rgba(255,255,255,.06)" : "#f8fafc", l = t.accent || "#0071e3", s = "aw-rp-" + Math.random().toString(36).slice(2, 8), m = "padding:8px 14px;border-radius:7px;font-size:.78rem;font-weight:700;border:1.5px solid " + a + ";background:transparent;color:" + r + ";cursor:pointer;", p = "padding:8px 14px;border-radius:7px;font-size:.78rem;font-weight:700;border:1.5px solid " + l + ";background:" + l + ";color:#fff;cursor:pointer;", c = "width:100%;padding:9px 10px;border:1.5px solid " + a + ";border-radius:7px;font-size:.9rem;font-weight:600;background:" + d + ";color:" + o + ";outline:none;font-family:inherit;", u = "width:100%;padding:13px;background:" + l + ";color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:800;cursor:pointer;";
  e.innerHTML = '<div id="' + s + "\" style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:" + i + ";color:" + o + ";border:1px solid " + a + ';border-radius:12px;overflow:hidden;max-width:480px;"><div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + a + ';display:flex;justify-content:space-between;align-items:center;">' + translate("Random Picker ") + '<span id="' + s + '-badge" style="font-size:.72rem;background:' + ("dark" === n ? "rgba(255,255,255,.08)" : "#e2e8f0") + ";padding:2px 8px;border-radius:4px;color:" + r + ';">' + translate("0 items") + '</span></div><div style="padding:16px 18px;"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px;"><button class="aw-rp-tab" data-tab="names" style="' + p + '">' + translate("Names") + '</button><button class="aw-rp-tab" data-tab="numbers" style="' + m + '">' + translate("Numbers") + '</button><button class="aw-rp-tab" data-tab="coin" style="' + m + '">' + translate("Coin Flip") + '</button></div><div id="' + s + '-names"><div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("Enter names/items (one per line)") + '</label><textarea id="' + s + '-list" style="' + c + 'min-height:100px;resize:vertical;">Chinedu\nAmina\nThabo\nAma\nKwame\nFatima\nSipho\nNgozi</textarea></div><div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("How many to pick?") + '</label><input type="number" id="' + s + '-pickN" value="1" min="1" max="100" style="' + c + '"></div><button id="' + s + '-pickBtn" style="' + u + '">' + translate("Pick Random Name(s)") + '</button></div><div id="' + s + '-numbers" style="display:none;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;"><div><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("Minimum") + '</label><input type="number" id="' + s + '-min" value="1" style="' + c + '"></div><div><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("Maximum") + '</label><input type="number" id="' + s + '-max" value="100" style="' + c + '"></div></div><div style="margin-bottom:10px;"><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("How many?") + '</label><input type="number" id="' + s + '-numN" value="1" min="1" style="' + c + '"></div><button id="' + s + '-numBtn" style="' + u + '">' + translate("Generate Random Number(s)") + '</button></div><div id="' + s + '-coin" style="display:none;"><p style="font-size:.85rem;color:' + r + ';margin-bottom:14px;">' + translate("Flip a fair coin. 50/50 chance. Uses cryptographic randomness.") + '</p><button id="' + s + '-coinBtn" style="' + u + '">' + translate("Flip Coin") + '</button></div><div id="' + s + '-display" style="display:none;margin-top:16px;text-align:center;padding:24px;background:' + ("dark" === n ? "rgba(255,255,255,.04)" : "linear-gradient(135deg,#0f172a,#1e293b)") + ';border-radius:10px;"><div id="' + s + '-rtext" style="font-size:1.8rem;font-weight:800;color:#38bdf8;word-break:break-word;"></div><div id="' + s + '-rsub" style="font-size:.72rem;color:rgba(255,255,255,.4);margin-top:6px;"></div></div><div id="' + s + '-hist" style="margin-top:10px;"></div></div>' + (t.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + a + ";font-size:.72rem;color:" + r + ';">' + t.footerHTML + "</div>" : "") + "</div>";
  var b = document.getElementById(s), f = "names", g = [];
  function uniform(limit) {
    const span = 2 ** 53, cap = Math.floor(span / limit) * limit;
    if (window.crypto && crypto.getRandomValues) {
      const words = new Uint32Array(2);
      let sample;
      do {
        crypto.getRandomValues(words);
        sample = (words[0] & 2097151) * 4294967296 + words[1];
      } while (sample >= cap);
      return sample % limit;
    }
    return Math.floor(Math.random() * limit);
  }
  function x(value, note) {
    document.getElementById(s + "-display").style.display = "block";
    document.getElementById(s + "-rtext").textContent = value;
    document.getElementById(s + "-rsub").textContent = note || "";
  }
  function v(item) {
    g.unshift(item);
    if (g.length > 15) g.pop();
    const history = document.getElementById(s + "-hist");
    history.replaceChildren();
    for (const value of g) {
      const badge = document.createElement("span");
      badge.style.cssText = "display:inline-block;margin:2px;padding:3px 10px;border:1px solid currentColor;border-radius:16px";
      badge.textContent = value;
      history.append(badge);
    }
  }
  const h = b.querySelectorAll(".aw-rp-tab");
  h.forEach(tab => tab.addEventListener("click", () => {
    f = tab.dataset.tab;
    h.forEach(button => button.setAttribute("style", button.dataset.tab === f ? p : m));
    [ "names", "numbers", "coin" ].forEach(mode => document.getElementById(s + "-" + mode).style.display = mode === f ? "block" : "none");
    document.getElementById(s + "-display").style.display = "none";
  }));
  const read = id => document.getElementById(s + "-" + id);
  read("pickBtn").addEventListener("click", () => {
    const items = read("list").value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    const count = Number(read("pickN").value);
    read("badge").textContent = items.length + (locale === "fr-FR" ? " éléments" : " items");
    if (!items.length || !Number.isSafeInteger(count) || count < 1 || count > items.length) {
      x(translate("Check your list and requested count."));
      return;
    }
    for (let i = items.length - 1; i > 0; i--) {
      const other = uniform(i + 1);
      [items[i], items[other]] = [ items[other], items[i] ];
    }
    const selected = items.slice(0, count);
    x(selected.join(", "), locale === "fr-FR" ? count + " sur " + items.length : "Picked " + count + " of " + items.length);
    selected.forEach(v);
  });
  read("numBtn").addEventListener("click", () => {
    const min = read("min").valueAsNumber, max = read("max").valueAsNumber, count = read("numN").valueAsNumber, range = max - min + 1;
    if (![ min, max, count, range ].every(Number.isSafeInteger) || range < 1 || count < 1 || count > range) {
      x(translate("Check the integer range and requested count."));
      return;
    }
    const picked = new Set;
    for (let end = range - count; end < range; end++) {
      const candidate = uniform(end + 1);
      picked.add(picked.has(candidate) ? end : candidate);
    }
    const numbers = Array.from(picked, index => index + min).sort((a, b) => a - b);
    x(numbers.join(", "), locale === "fr-FR" ? "Entre " + min + " et " + max : "Between " + min + " and " + max);
    numbers.forEach(value => v(String(value)));
  });
  read("coinBtn").addEventListener("click", () => {
    const value = translate(uniform(2) ? "Heads" : "Tails");
    x(value, translate("Coin flip"));
    v(value);
  });
};
