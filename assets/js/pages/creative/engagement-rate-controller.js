(function (global) {
  "use strict";
  function fmt(number, digits) { return number.toLocaleString("en-US", { minimumFractionDigits: digits || 1, maximumFractionDigits: digits || 1 }); }
  function value(id) { return document.getElementById(id).value; }
  function calculate() {
    var engine = global.AfroTools && global.AfroTools.EngagementRateEngine;
    var tools = global.AfroTools && global.AfroTools.CreativeResultTools;
    if (!engine) throw new Error("EngagementRateEngine is unavailable");
    if (!(parseInt(value("followers"), 10) > 0)) {
      return tools.reject(tools.text("Enter a follower count greater than zero.", "Saisissez un nombre d'abonnés supérieur à zéro."), "followers");
    }
    var result = engine.calculate({
      platform: value("platform"), followers: value("followers"), likes: value("likes"),
      comments: value("comments"), shares: value("shares"), saves: value("saves"),
    });
    var benchmark = result.benchmark;
    document.getElementById("erDisplay").textContent = fmt(result.rate) + "%";
    document.getElementById("erRating").textContent = result.gradeLabel + " for " + benchmark.platform + " — " + result.interactions.toLocaleString() + " total interactions per post";
    document.getElementById("gradeBox").innerHTML = '<div style="font-size:.78rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Grade</div><div class="er-grade ' + result.gradeClass + '">' + result.grade + "</div>";
    document.getElementById("metrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">Likes</div><div class="en-metric-value">' + result.likes.toLocaleString() + '</div><div class="en-metric-unit">Avg per post</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Comments</div><div class="en-metric-value">' + result.comments.toLocaleString() + '</div><div class="en-metric-unit">Avg per post</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Shares + Saves</div><div class="en-metric-value">' + (result.shares + result.saves).toLocaleString() + '</div><div class="en-metric-unit">Avg per post</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Engagement Rate</div><div class="en-metric-value">' + fmt(result.rate) + '%</div><div class="en-metric-unit">vs ' + benchmark.average + "% platform avg</div></div>";
    document.getElementById("benchmarks").innerHTML = '<div style="display:flex;flex-direction:column;gap:14px">' + result.benchmarkLevels.map(function (level) {
      var width = Math.min(100, level.value / benchmark.excellent * 100);
      var status = result.rate >= level.value ? '<span style="font-size:.78rem;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-weight:700">You qualify</span>' : '<span style="font-size:.78rem;color:#94a3b8">' + Math.max(0, level.value - result.rate).toFixed(1) + "% gap</span>";
      return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:.85rem;font-weight:700;color:#334155">' + level.label + " (" + level.value + "%+)</span>" + status + '</div><div class="er-bar-wrap"><div class="er-bar" style="width:' + width + '%"></div></div></div>';
    }).join("") + "</div>";
    var ready = result.rate >= benchmark.average;
    var monetization = '<div class="en-notice' + (ready ? "" : " en-notice-warning") + '"><strong>Monetization Status: ' + (ready ? "Ready to monetize" : "Not yet ready") + "</strong><br>" +
      (ready ? "Your engagement rate is above the " + benchmark.platform + " average. You can pitch brands for sponsorships. Focus on growing your niche and document value for potential partners." :
        "Your engagement rate is below the " + benchmark.platform + " average of " + benchmark.average + "%. Focus on content quality and community building before pitching brands. Aim for " + benchmark.good + "% before monetizing.") + "</div>";
    result.monetizationStreams.forEach(function (stream) {
      var streamReady = result.rate >= stream.threshold;
      monetization += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--en-border)"><span style="font-size:1.1rem">' + (streamReady ? "✅" : "⏳") + '</span><span style="font-size:.9rem;font-weight:600;color:#334155">' + stream.name + '</span><span style="font-size:.8rem;color:#64748b;margin-left:auto">Requires ' + stream.threshold + "%+ ER</span></div>";
    });
    document.getElementById("monetization").innerHTML = monetization;
    document.getElementById("tips").innerHTML = '<ul style="list-style:none;display:flex;flex-direction:column;gap:10px">' + result.tips.map(function (tip) { return '<li style="display:flex;gap:10px;font-size:.88rem;line-height:1.5;color:#334155"><span style="color:var(--en-accent);flex-shrink:0;font-weight:700">✓</span>' + tip + "</li>"; }).join("") + "</ul>";
    document.getElementById("results").classList.add("on");
    tools.publish({ name: tools.text("Engagement Rate Calculator", "Calculateur du taux d'engagement"), fileBase: "engagement-rate" });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.calculate = calculate;
})(window);
