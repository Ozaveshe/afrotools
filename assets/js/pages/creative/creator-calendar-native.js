(function () {
  "use strict";
  var root = document.querySelector("[data-creator-calendar-native]");
  if (!root || !window.CreatorCalendarEngine) return;
  var fr = root.getAttribute("data-lang") === "fr";
  var form = root.querySelector("form");
  var output = root.querySelector("[data-output]");
  var status = root.querySelector("[data-status]");
  var actions = root.querySelector("[data-export-actions]");
  var lastPlan = null;
  var words = fr ? {
    invalid: "Vérifiez le sujet, la date, la durée et choisissez au moins une plateforme.",
    ready: "Calendrier créé localement. Vérifiez les horaires proposés selon votre audience.",
    day: "Jour", date: "Date", platform: "Plateforme", time: "Heure", angle: "Angle",
    educate: "Expliquer", engage: "Faire participer", showcase: "Présenter",
    downloaded: "Fichier téléchargé."
  } : {
    invalid: "Check the topic, date, duration, and choose at least one platform.",
    ready: "Calendar created locally. Review the suggested times for your audience.",
    day: "Day", date: "Date", platform: "Platform", time: "Time", angle: "Angle",
    educate: "Educate", engage: "Engage", showcase: "Showcase",
    downloaded: "File downloaded."
  };
  function selectedPlatforms() {
    return Array.prototype.map.call(form.querySelectorAll('[name="platform"]:checked'), function (input) { return input.value; });
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; });
  }
  function render(plan) {
    var html = '<table class="ccn-table"><thead><tr><th>' + words.day + '</th><th>' + words.date + '</th><th>' + words.platform + '</th><th>' + words.time + '</th><th>' + words.angle + '</th></tr></thead><tbody>';
    plan.posts.forEach(function (post) {
      html += '<tr><td data-label="' + words.day + '">' + post.day + '</td><td data-label="' + words.date + '">' + escapeHtml(post.date) + '</td><td data-label="' + words.platform + '">' + escapeHtml(post.platform) + '</td><td data-label="' + words.time + '">' + escapeHtml(post.time) + '</td><td data-label="' + words.angle + '">' + words[post.angle] + '</td></tr>';
    });
    output.innerHTML = html + "</tbody></table>";
    output.hidden = false;
    actions.hidden = false;
  }
  function csv(plan) {
    var rows = [[words.day, words.date, words.platform, words.time, words.angle]];
    plan.posts.forEach(function (post) { rows.push([post.day, post.date, post.platform, post.time, words[post.angle]]); });
    return "\uFEFF" + rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
  }
  function download(filename, type, body) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([body], {type: type}));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status.textContent = words.downloaded;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      lastPlan = window.CreatorCalendarEngine.buildLocalPlan({
        topic: form.elements.topic.value,
        startDate: form.elements.startDate.value,
        days: Number(form.elements.days.value),
        country: form.elements.country.value,
        platforms: selectedPlatforms()
      });
      render(lastPlan);
      status.textContent = words.ready;
    } catch (_) {
      lastPlan = null;
      output.hidden = true;
      actions.hidden = true;
      status.textContent = words.invalid;
    }
  });
  root.querySelector("[data-json]").addEventListener("click", function () {
    if (lastPlan) download("creator-calendar.json", "application/json", JSON.stringify(lastPlan, null, 2));
  });
  root.querySelector("[data-csv]").addEventListener("click", function () {
    if (lastPlan) download("creator-calendar.csv", "text/csv;charset=utf-8", csv(lastPlan));
  });
})();
