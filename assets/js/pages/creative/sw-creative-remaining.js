(function () {
  "use strict";

  var path = location.pathname;
  var q = function (id) { return document.getElementById(id); };
  var text = function (id) { return String(q(id) && q(id).value || "").trim(); };
  var state = null;

  function download(name, value, type) {
    var blob = value instanceof Blob ? value : new Blob([value], { type: type || "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url; link.download = name; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function exportBar(formats) {
    var host = q("detail") || q("job-results") || q("results");
    if (!host || document.querySelector("[data-sw-native-exports]")) return;
    var bar = document.createElement("div");
    bar.dataset.swNativeExports = "true";
    bar.className = "actions";
    bar.setAttribute("aria-label", "Pakua matokeo");
    formats.forEach(function (format) {
      var button = document.createElement("button");
      button.type = "button"; button.className = "secondary";
      button.textContent = "Pakua " + format.toUpperCase();
      button.dataset.export = format;
      bar.appendChild(button);
    });
    host.after(bar);
  }

  function addField(id, label, type, value) {
    var grid = document.querySelector(".form-grid");
    if (!grid || q(id)) return;
    var wrapper = document.createElement("label");
    wrapper.textContent = label;
    var input = document.createElement("input");
    input.id = id; input.type = type || "text"; input.value = value || "";
    wrapper.appendChild(input); grid.appendChild(wrapper);
  }

  function stock() {
    var engine = window.AfroTools && window.AfroTools.CreatorStockEngine;
    if (!engine) return;
    addField("sourceUrl", "URL ya chanzo", "url", "https://example.org/media");
    addField("creator", "Mtayarishaji / mpiga picha", "text", "Mtoa maudhui");
    function calculate() {
      try {
        state = engine.createAsset({ title: text("query"), sourceUrl: text("sourceUrl"), creator: text("creator"), license: q("license").selectedOptions[0].text, usage: q("type").selectedOptions[0].text, checkedOn: new Date().toISOString().slice(0, 10), note: "Masharti ya leseni yahakikiwe kabla ya kuchapisha." });
        q("results").innerHTML = "<div class=\"metric\"><span>Rekodi ya media</span><strong>" + state.title + "</strong><small>" + state.license + "</small></div>";
        q("detail").textContent = "Chanzo na masharti yamehifadhiwa kwenye rekodi ya ndani. AfroTools haipakui wala haithibitishi leseni hii.";
      } catch (error) { state = null; q("results").textContent = error.message; }
    }
    q("calculate").onclick = calculate; calculate(); exportBar(["json", "csv"]);
    document.addEventListener("click", function (event) {
      if (!state || !event.target.dataset.export) return;
      if (event.target.dataset.export === "json") download("rekodi-stock.json", JSON.stringify(state, null, 2));
      if (event.target.dataset.export === "csv") download("rekodi-stock.csv", engine.toCsv([state]), "text/csv;charset=utf-8");
    });
  }

  function thumb() {
    var engine = window.AfroTools && window.AfroTools.creatorFinalWave;
    if (!engine) return;
    function calculate() {
      try {
        var format = q("platform").value === "youtube" ? "youtube" : q("platform").value === "tiktok" ? "instagram" : "instagram";
        state = engine.calculate("creator-thumb", { headline: text("title"), kicker: text("sub"), format: format, background: q("bg").value, accent: "#f59e0b", textColour: "#ffffff" });
        var canvas = q("canvas"), ctx = canvas.getContext("2d"); canvas.width = state.width; canvas.height = state.height;
        ctx.fillStyle = state.colours.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = state.colours.text; ctx.font = "800 " + Math.max(42, Math.round(canvas.width / 14)) + "px system-ui"; ctx.fillText(state.headline, 64, Math.round(canvas.height * .42));
        ctx.font = "600 " + Math.max(24, Math.round(canvas.width / 28)) + "px system-ui"; ctx.fillText(state.kicker, 64, Math.round(canvas.height * .58));
        q("results").textContent = state.platform + " · " + state.width + " × " + state.height + " px";
      } catch (error) { state = null; q("results").textContent = error.message; }
    }
    q("calculate").onclick = calculate; calculate(); exportBar(["png", "json", "txt"]);
    document.addEventListener("click", function (event) {
      var format = event.target.dataset.export; if (!state || !format) return;
      if (format === "png") q("canvas").toBlob(function (blob) { download("thumbnail-" + state.width + "x" + state.height + ".png", blob, "image/png"); });
      if (format === "json") download("thumbnail.json", JSON.stringify(state, null, 2));
      if (format === "txt") download("thumbnail.txt", state.headline + "\n" + state.kicker + "\n" + state.width + "x" + state.height, "text/plain;charset=utf-8");
    });
  }

  function titles() {
    var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorTitles;
    if (!engine) return;
    function calculate() {
      try {
        state = engine.generateLocalTitles(text("topic"), q("platform").value, "sw");
        q("results").textContent = state.titles.length + " vichwa vimetengenezwa";
        q("detail").innerHTML = "<ol>" + state.titles.map(function (item) { return "<li>" + item.title + " <small>(" + item.charCount + ")</small></li>"; }).join("") + "</ol>";
      } catch (error) { state = null; q("results").textContent = error.message; }
    }
    q("calculate").onclick = calculate; calculate(); exportBar(["json", "txt"]);
    document.addEventListener("click", function (event) {
      var format = event.target.dataset.export; if (!state || !format) return;
      if (format === "json") download("vichwa.json", JSON.stringify(state, null, 2));
      if (format === "txt") download("vichwa.txt", state.titles.map(function (item) { return item.title; }).join("\n"), "text/plain;charset=utf-8");
    });
  }

  function calendar() {
    var engine = window.AfroTools && window.AfroTools.SocialMediaCalendarEngine;
    if (!engine) return;
    var months = ["Januari", "Februari", "Machi", "Aprili", "Mei", "Juni", "Julai", "Agosti", "Septemba", "Oktoba", "Novemba", "Desemba"];
    function calculate() {
      state = engine.generate({ niche: q("niche").value, platform: q("platform").value, frequency: q("frequency").value, timezone: q("timezone").value, month: q("startMonth").value, year: new Date().getFullYear() });
      q("results").textContent = state.totalPosts + " machapisho · " + months[state.month] + " " + state.year;
      q("detail").innerHTML = "<table><thead><tr><th>Tarehe</th><th>Muda</th><th>Aina</th></tr></thead><tbody>" + state.posts.map(function (post) { return "<tr><td>" + post.day + " " + months[state.month] + "</td><td>" + post.time + " " + state.timezone + "</td><td>" + ({edu:"Elimu",ent:"Ushirikishaji",promo:"Tangazo",personal:"Binafsi"}[post.type] || post.type) + "</td></tr>"; }).join("") + "</tbody></table>";
    }
    q("calculate").onclick = calculate; calculate(); exportBar(["json", "csv"]);
    document.addEventListener("click", function (event) {
      var format = event.target.dataset.export; if (!state || !format) return;
      if (format === "json") download("kalenda.json", JSON.stringify(state, null, 2));
      if (format === "csv") download("kalenda.csv", "date,time,type\r\n" + state.posts.map(function (post) { return [state.year + "-" + String(state.month + 1).padStart(2,"0") + "-" + String(post.day).padStart(2,"0"), post.time + " " + state.timezone, post.type].map(function(v){return "\""+String(v).replace(/\"/g,"\"\"")+"\"";}).join(","); }).join("\r\n"), "text/csv;charset=utf-8");
    });
  }

  if (path.indexOf("/maktaba-ya-stock-media/") >= 0) stock();
  if (path.indexOf("/thumbnail-ya-mtayarishi/") >= 0) thumb();
  if (path.indexOf("/vichwa-vya-maudhui/") >= 0) titles();
  if (path.indexOf("/kalenda-ya-mitandao-ya-kijamii/") >= 0) calendar();
}());
