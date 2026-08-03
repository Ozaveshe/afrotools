(function () {
  "use strict";
  var engine = window.SwFaraidEngine;
  var form = document.getElementById("faraid-form");
  if (!engine || !form) return;
  var result = null;
  var stale = true;
  var storageKey = "afrotools-sw-faraid-draft-v1";
  var exportButtons = Array.prototype.slice.call(document.querySelectorAll("[data-faraid-export]"));

  function field(name) { return form.elements[name]; }
  function collect() {
    return {
      currency: field("currency").value,
      estate: field("estate").value,
      debts: field("debts").value,
      funeral: field("funeral").value,
      bequest: field("bequest").value,
      spouse: field("spouse").value,
      wives: field("wives").value,
      sons: field("sons").value,
      daughters: field("daughters").value,
      brothers: field("brothers").value,
      sisters: field("sisters").value,
      father: field("father").checked,
      mother: field("mother").checked,
      limitedCase: field("limitedCase").checked
    };
  }

  function setText(id, text) { document.getElementById(id).textContent = text; }
  function setExports(enabled) { exportButtons.forEach(function (button) { button.disabled = !enabled; }); }
  function money(value, currency) {
    try { return new Intl.NumberFormat("sw", { style: "currency", currency: currency, maximumFractionDigits: 2 }).format(value || 0); }
    catch (error) { return currency + " " + Number(value || 0).toLocaleString("sw", { maximumFractionDigits: 2 }); }
  }
  function number(value) { return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2, useGrouping: false }); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function fraction(value) {
    if (value <= 0) return "0";
    var denominator = 72;
    var numerator = Math.round(value * denominator);
    var divisor = gcd(numerator, denominator);
    var percent = (value * 100).toFixed(value < 0.01 ? 2 : 1).replace(/\.0$/, "");
    return (numerator / divisor) + "/" + (denominator / divisor) + " (" + percent + "%)";
  }

  function showErrors(errors) {
    Array.prototype.forEach.call(form.elements, function (control) {
      if (!control.name || control.type === "submit" || control.type === "button") return;
      var error = errors[control.name] || "";
      control.setAttribute("aria-invalid", error ? "true" : "false");
      var message = document.getElementById("error-" + control.name);
      if (message) { message.textContent = error; message.hidden = !error; }
    });
  }

  function renderLists(listId, items) {
    document.getElementById(listId).innerHTML = items.map(function (item) { var li = document.createElement("li"); li.textContent = item; return li.outerHTML; }).join("");
  }

  function renderRows(rows, currency, netEstate) {
    var tbody = document.getElementById("faraid-share-rows");
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4">Hakuna fungu la modeli. Ingiza warithi kisha uhesabu.</td></tr>'; return; }
    tbody.innerHTML = rows.map(function (row) {
      var name = row.count > 1 ? row.count + " × " + row.label : row.label;
      return '<tr><td data-label="Mrithi">' + name + '</td><td data-label="Msingi">' + row.basis + '</td><td data-label="Fungu">' + fraction(row.share) + '</td><td data-label="Kiasi kwa kila mrithi">' + money(netEstate * row.perShare, currency) + '</td></tr>';
    }).join("");
  }

  function render(next) {
    result = next;
    stale = false;
    var currency = next.input.currency;
    setText("faraid-net", money(next.netEstate, currency));
    setText("faraid-heirs", String(next.rows.reduce(function (sum, row) { return sum + row.count; }, 0)));
    setText("faraid-allocated", money(next.allocatedAmount, currency));
    setText("faraid-unallocated", money(next.unallocatedAmount, currency));
    setText("faraid-review", next.reviewFlag);
    var simple = next.reviewFlag === "Hali rahisi";
    var notice = document.getElementById("faraid-notice");
    notice.dataset.kind = simple ? "good" : "warning";
    notice.textContent = simple ? "Hali hii inaingia katika modeli yenye mipaka, lakini msomi na mwanasheria bado wanapaswa kuthibitisha warithi na mchakato wa eneo kabla ya kugawa mali." : "Haya ni makadirio ya kupanga yenye maonyo. Usigawanye mali hadi msomi mwenye sifa na mshauri wa sheria wa eneo wathibitishe hali hii.";
    renderRows(next.rows, currency, next.netEstate);
    renderLists("faraid-warnings", next.warnings);
    renderLists("faraid-next-steps", next.nextSteps);
    var status = document.getElementById("faraid-status");
    status.dataset.kind = simple ? "good" : "warning";
    status.textContent = "Matokeo yamesasishwa. " + next.reviewFlag + ".";
    setExports(true);
    try { localStorage.setItem(storageKey, JSON.stringify({ savedAt: new Date().toISOString(), inputs: collect(), result: next })); } catch (error) {}
  }

  function markStale() {
    var checked = engine.validate(collect());
    showErrors(checked.errors);
    if (result && !stale) {
      stale = true;
      document.getElementById("faraid-status").textContent = "Thamani zimebadilika. Hesabu tena kabla ya kunakili, kupakua au kuchapisha.";
    } else if (!checked.ok) document.getElementById("faraid-status").textContent = "Sahihisha sehemu zilizo na hitilafu kabla ya kuhesabu.";
    setExports(false);
  }

  function resultText() {
    var currency = result.input.currency;
    var lines = [
      "Matokeo ya Kikokotoo cha Urithi wa Faraid — AfroTools",
      "Tarehe: " + new Date().toISOString().slice(0, 10),
      "Sarafu: " + currency,
      "Mali ghafi: " + money(result.input.estate, currency),
      "Madeni: " + money(result.input.debts, currency),
      "Gharama za mazishi na mirathi: " + money(result.input.funeral, currency),
      "Wasia uliotumika: " + money(result.bequestUsed, currency),
      "Mali halisi: " + money(result.netEstate, currency),
      "Kiasi kilichogawiwa: " + money(result.allocatedAmount, currency),
      "Hali: " + result.reviewFlag,
      "Mafungu:"
    ];
    result.rows.forEach(function (row) { lines.push("- " + row.label + ": " + fraction(row.share) + ", kila mrithi " + money(result.netEstate * row.perShare, currency) + " (" + row.basis + ")"); });
    lines.push("Maonyo:");
    result.warnings.forEach(function (warning) { lines.push("- " + warning); });
    lines.push("Kwa elimu na kupanga pekee. Thibitisha na msomi mwenye sifa na mwanasheria kabla ya kugawa mali.");
    return lines.join("\n");
  }

  function copyResult() {
    var text = resultText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { document.getElementById("faraid-status").textContent = "Matokeo yamenakiliwa kwa mapitio."; }).catch(function () { window.prompt("Nakili matokeo ya Faraid", text); });
    else window.prompt("Nakili matokeo ya Faraid", text);
  }

  function exportCsv() {
    var currency = result.input.currency;
    var rows = [
      ["Sehemu", "Thamani"], ["Tarehe", new Date().toISOString().slice(0, 10)], ["Sarafu", currency],
      ["Mali ghafi", number(result.input.estate)], ["Madeni", number(result.input.debts)], ["Gharama za mazishi na mirathi", number(result.input.funeral)],
      ["Wasia uliotumika", number(result.bequestUsed)], ["Mali halisi", number(result.netEstate)], ["Kiasi kilichogawiwa", number(result.allocatedAmount)],
      ["Salio lisilogawiwa", number(result.unallocatedAmount)], ["Hali ya mapitio", result.reviewFlag], ["Tahadhari", "Kwa elimu na kupanga pekee; thibitisha na msomi na mwanasheria."]
    ];
    result.rows.forEach(function (row) { rows.push([row.label, fraction(row.share), row.basis, number(result.netEstate * row.perShare)]); });
    result.warnings.forEach(function (warning) { rows.push(["Onyo", warning]); });
    var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var link = document.createElement("a"); link.href = url; link.download = "afrotools-urithi-wa-faraid.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var calculated = engine.calculate(collect());
    showErrors(calculated.errors || {});
    if (!calculated.ok) { result = null; stale = true; setExports(false); document.getElementById("faraid-status").textContent = "Sahihisha sehemu zilizo na hitilafu kabla ya kuhesabu."; document.getElementById("faraid-status").focus(); return; }
    render(calculated);
  });
  Array.prototype.forEach.call(form.elements, function (control) { if (control.name) { control.addEventListener("input", markStale); control.addEventListener("change", markStale); } });
  document.getElementById("faraid-copy").addEventListener("click", copyResult);
  document.getElementById("faraid-csv").addEventListener("click", exportCsv);
  document.getElementById("faraid-print").addEventListener("click", function () { window.print(); });
  setExports(false);
  showErrors({});
})();
