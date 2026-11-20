window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.hashGenerator = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Input Text": "Texte à traiter",
    "Generate Hashes": "Calculer les empreintes",
    Uppercase: "Majuscules",
    Dark: "Mode sombre",
    Copy: "Copier",
    "Copied!": "Copié !",
    "Computing...": "Calcul en cours…",
    "Valid JSON": "JSON valide",
    "Paste JSON here...": "Collez le JSON ici…",
    "Enter text to hash...": "Saisissez le texte à vérifier…",
    " Uppercase": " Majuscules",
    " Braces": " Accolades"
  };
  var a = "dark" === ((t = t || {}).theme || "light"), r = a ? "#1a1a2e" : "#fff", o = a ? "#e0e0e0" : "#333", n = a ? "#16213e" : "#f5f7fa", i = a ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-hash-generator" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + o + ";padding:20px;border-radius:10px;border:1px solid " + i + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Input Text") + '</label><textarea class="aw-input aw-hash-input" style="width:100%;min-height:100px;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + o + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Enter text to hash...") + '"></textarea></div><div style="display:flex;gap:8px;margin-bottom:12px"><button class="aw-btn aw-btn--primary aw-hash-generate" style="padding:8px 16px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Generate Hashes") + '</button><label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-hash-uppercase">' + translate(" Uppercase") + '</label></div><div class="aw-hash-results" style="display:grid;gap:10px"></div>' + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var s = e.querySelector(".aw-hash-input"), l = e.querySelector(".aw-hash-results"), d = e.querySelector(".aw-hash-uppercase"), p = [ "SHA-1", "SHA-256", "SHA-384", "SHA-512" ];
  var revision = 0;
  function c() {
    var current = ++revision;
    var e = s.value;
    if (e) {
      var t = (new TextEncoder).encode(e), a = d.checked;
      l.innerHTML = p.map(function(e) {
        return '<div class="aw-result-box" style="background:' + n + ";border:1px solid " + i + ';border-radius:6px;padding:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:12px;font-weight:600">' + e + '</span><button disabled class="aw-btn aw-hash-copy" data-algo="' + e + '" style="padding:3px 8px;background:transparent;color:' + o + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Copy") + '</button></div><div class="aw-hash-val" data-algo="' + e + '" style="font-family:\'Courier New\',monospace;font-size:12px;word-break:break-all;color:#888">' + translate("Computing...") + "</div></div>";
      }).join(""), p.forEach(function(e) {
        crypto.subtle.digest(e, t).then(function(t) {
          if (current !== revision) return;
          var r = function(e) {
            return Array.from(new Uint8Array(e)).map(function(e) {
              return e.toString(16).padStart(2, "0");
            }).join("");
          }(t);
          a && (r = r.toUpperCase());
          var o = l.querySelector('.aw-hash-val[data-algo="' + e + '"]');
          if (o) {
            o.textContent = r;
            l.querySelector('.aw-hash-copy[data-algo="' + e + '"]').disabled = false;
          }
        });
      }), l.querySelectorAll(".aw-hash-copy").forEach(function(e) {
        e.addEventListener("click", function() {
          var e = this.getAttribute("data-algo"), hashNode = l.querySelector('.aw-hash-val[data-algo="' + e + '"]'), t = hashNode.textContent, a = this;
          (async function() {
            try {
              await navigator.clipboard.writeText(t);
              a.textContent = translate("Copied!");
            } catch {
              const range = document.createRange();
              range.selectNodeContents(hashNode);
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
              a.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
            }
            setTimeout(function() {
              a.textContent = translate("Copy");
            }, 3e3);
          })();
        });
      });
    } else l.innerHTML = "";
  }
  e.querySelector(".aw-hash-generate").addEventListener("click", c), d.addEventListener("change", c),
  s.addEventListener("input", c);
};
