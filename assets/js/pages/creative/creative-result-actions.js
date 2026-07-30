(function (global) {
  "use strict";

  var latest = null;
  var locale = document.documentElement.lang === "fr" ? "fr" : "en";
  var labels = {
    en: { copy: "Copy result", json: "Download JSON", txt: "Download TXT", copied: "Result copied.", ready: "Your private result exports are ready." },
    fr: { copy: "Copier le résultat", json: "Télécharger JSON", txt: "Télécharger TXT", copied: "Résultat copié.", ready: "Vos exports privés sont prêts." }
  }[locale];

  function flatten(value, prefix, lines) {
    if (Array.isArray(value)) {
      value.forEach(function (item, index) { flatten(item, prefix + " " + (index + 1), lines); });
      return;
    }
    if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        flatten(value[key], prefix ? prefix + " / " + key : key, lines);
      });
      return;
    }
    lines.push((prefix || "result") + ": " + String(value == null ? "" : value));
  }

  function textPayload(record) {
    var lines = [record.title, "", locale === "fr" ? "Généré localement dans votre navigateur." : "Generated locally in your browser.", ""];
    flatten(record.result, "", lines);
    return lines.join("\n");
  }

  function download(content, type, extension) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = latest.slug + "." + extension;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function ensureActions(target) {
    var existing = target.querySelector("[data-creative-result-actions]");
    if (existing) return existing;
    var box = document.createElement("section");
    box.setAttribute("data-creative-result-actions", "");
    box.setAttribute("aria-label", locale === "fr" ? "Actions du résultat" : "Result actions");
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:18px 0;padding:14px;border:1px solid var(--en-border,#dbe4ef);border-radius:10px;background:var(--en-card,#fff)";
    box.innerHTML =
      '<button type="button" data-copy-result>' + labels.copy + "</button>" +
      '<button type="button" data-download-json>' + labels.json + "</button>" +
      '<button type="button" data-download-txt>' + labels.txt + "</button>" +
      '<output aria-live="polite" data-result-status style="flex-basis:100%;min-height:1.25em"></output>';
    target.appendChild(box);
    box.querySelectorAll("button").forEach(function (button) {
      button.style.cssText = "min-height:44px;padding:9px 13px;border:1px solid #94a3b8;border-radius:8px;background:#fff;color:#0f172a;font:700 14px/1.2 system-ui;cursor:pointer";
    });
    box.querySelector("[data-copy-result]").addEventListener("click", function () {
      navigator.clipboard.writeText(textPayload(latest)).then(function () {
        box.querySelector("[data-result-status]").textContent = labels.copied;
      });
    });
    box.querySelector("[data-download-json]").addEventListener("click", function () {
      download(JSON.stringify({ schemaVersion: 1, locale: locale, title: latest.title, result: latest.result }, null, 2), "application/json", "json");
      box.querySelector("[data-result-status]").textContent = labels.ready;
    });
    box.querySelector("[data-download-txt]").addEventListener("click", function () {
      download(textPayload(latest), "text/plain;charset=utf-8", "txt");
      box.querySelector("[data-result-status]").textContent = labels.ready;
    });
    return box;
  }

  function publish(options) {
    latest = {
      slug: options.slug,
      title: options.title,
      result: options.result
    };
    var target = options.target || document.getElementById("results") || document.getElementById("tool-mount");
    if (!target) return;
    ensureActions(target);
  }

  global.AfroToolsCreativeResultActions = Object.freeze({ publish: publish, textPayload: textPayload });
})(window);
