(function (global) {
  "use strict";
  function fmt(number, digits) { return number.toLocaleString("en-US", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 2 }); }
  function value(id) { return document.getElementById(id).value; }
  function calculate() {
    var engine = global.AfroTools && global.AfroTools.PodcastMonetizationEngine;
    var tools = global.AfroTools && global.AfroTools.CreativeResultTools;
    if (!engine) throw new Error("PodcastMonetizationEngine is unavailable");
    if (!(parseInt(value("downloads"), 10) >= 100)) {
      return tools.reject(tools.text("Enter at least 100 monthly downloads.", "Saisissez au moins 100 téléchargements mensuels."), "downloads");
    }
    if (!(parseInt(value("episodes"), 10) >= 1)) {
      return tools.reject(tools.text("Enter at least one episode per month.", "Saisissez au moins un épisode par mois."), "episodes");
    }
    if (!(parseFloat(value("patronFee")) >= 0)) {
      return tools.reject(tools.text("Support per patron cannot be negative.", "La contribution par soutien ne peut pas être négative."), "patronFee");
    }
    var result = engine.calculate({
      country: value("country"), downloads: value("downloads"), episodes: value("episodes"),
      audience: value("audience"), niche: value("niche"), patrons: value("patrons"), patronFee: value("patronFee"),
    });
    document.getElementById("totalMonthly").textContent = "$" + fmt(result.total, 0);
    document.getElementById("localMonthly").textContent = result.symbol + fmt(result.total * result.rate, 0) + "/month";
    document.getElementById("annualRevenue").textContent = "$" + fmt(result.total * 12, 0);
    document.getElementById("metrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">Ad Revenue</div><div class="en-metric-value">$' + fmt(result.adTotal, 0) + '</div><div class="en-metric-unit">Pre/mid/post roll</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Sponsorships</div><div class="en-metric-value">$' + fmt(result.sponsorship, 0) + '</div><div class="en-metric-unit">Direct deals</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Patreon/Support</div><div class="en-metric-value">$' + fmt(result.support, 0) + '</div><div class="en-metric-unit">' + result.patrons + ' patrons</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Downloads/Episode</div><div class="en-metric-value">' + fmt(result.downloadsPerEpisode, 0) + '</div><div class="en-metric-unit">' + result.episodes + ' eps/month</div></div>';
    document.getElementById("streamTable").innerHTML = result.streams.map(function (stream) {
      var status = stream.monthly > 0 ? '<span style="color:#16a34a;font-weight:700">✅ Active</span>' : '<span style="color:#94a3b8">Not yet unlocked</span>';
      return '<tr><td class="en-td-value">' + stream.name + "</td><td>$" + fmt(stream.monthly, 0) + '</td><td class="en-td-highlight">$' + fmt(stream.monthly * 12, 0) + "</td><td>" + status + "</td></tr>";
    }).join("");
    document.getElementById("unlockTable").innerHTML = result.thresholds.map(function (threshold) {
      var status = result.downloads >= threshold.threshold ? '<span style="color:#16a34a;font-weight:700">✅ Unlocked!</span>' : '<span style="color:#f59e0b;font-weight:600">' + fmt(threshold.threshold - result.downloads) + " more downloads needed</span>";
      return '<tr><td class="en-td-value">' + threshold.name + "</td><td>" + fmt(threshold.threshold) + " downloads/ep</td><td>" + status + "</td></tr>";
    }).join("");
    document.getElementById("results").classList.add("on");
    tools.publish({ name: tools.text("Podcast Monetization Calculator", "Calculateur de monétisation de podcast"), fileBase: "podcast-monetization" });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.calculate = calculate;
})(window);
