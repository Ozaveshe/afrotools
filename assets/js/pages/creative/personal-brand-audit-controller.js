(function (global) {
  "use strict";
  function value(id) { return document.getElementById(id).value; }
  function calcBrand() {
    var engine = global.AfroTools && global.AfroTools.PersonalBrandAuditEngine;
    var tools = global.AfroTools && global.AfroTools.CreativeResultTools;
    if (!engine) throw new Error("PersonalBrandAuditEngine is unavailable");
    if (!value("industry").trim()) {
      return tools.reject(tools.text("Enter your industry before calculating.", "Saisissez votre secteur avant de calculer."), "industry");
    }
    var result = engine.calculate({
      liConnections: value("liConnections"), liPosting: value("liPosting"), twFollowers: value("twFollowers"),
      igFollowers: value("igFollowers"), website: value("website"), googleResult: value("googleResult"),
      articles: value("articles"), book: value("book"), podcast: value("podcast"), speaking: value("speaking"),
      awards: value("awards"), education: value("education"), certs: value("certs"),
      yearsExp: value("yearsExp"), industry: value("industry"),
    });
    document.getElementById("scoreRing").innerHTML = '<div class="score-ring" style="--pct:' + result.total + '%"><div class="score-ring-inner"><div class="score-ring-num">' + result.total + '</div><div class="score-ring-label">/ 100</div></div></div>';
    document.getElementById("gradeBadge").innerHTML = '<span class="grade-badge ' + result.gradeClass + '">Grade ' + result.grade + "</span>";
    document.getElementById("brandSummary").textContent = result.summary;
    document.getElementById("scoreBreakdown").innerHTML = result.categories.map(function (category) {
      var percentage = Math.round(category.score / category.max * 100);
      return '<div class="en-progress-item" style="margin-bottom:12px"><div class="en-progress-label">' + category.icon + " " + category.name +
        '</div><div class="en-progress-bar-wrap"><div class="en-progress-bar" style="width:' + percentage + '%"></div></div><div class="en-progress-value">' +
        category.score + "/" + category.max + "</div></div>";
    }).join("");
    var actions = [
      { week: "Days 1–7", text: "<strong>Quick wins:</strong> Update LinkedIn headline to include your top 3 keywords. Add a professional headshot if missing. Set posting schedule reminder (Tuesday + Thursday 8am is peak)." },
      { week: "Days 8–21", text: "<strong>Content launch:</strong> Write and publish your first thought-leadership article on LinkedIn. Topic: your biggest lesson from " + result.years + " years in " + result.industry + ". Share across all your platforms." },
      { week: "Days 22–45", text: "<strong>Build " + result.weakest.name + ":</strong> This is your lowest-scoring area. Specifically: " + result.weakestAction + "." },
      { week: "Days 46–60", text: "<strong>Offline visibility:</strong> Apply to speak at one industry event or webinar. Guest appearances on podcasts count. Target 2 applications this period." },
      { week: "Days 61–90", text: "<strong>Consistency & systems:</strong> Schedule content 2 weeks ahead using Buffer or Hootsuite. Review score again. Track follower growth weekly. Set 6-month brand target." },
    ];
    document.getElementById("actionPlan").innerHTML = actions.map(function (action) { return '<div class="action-card"><div class="action-week">' + action.week + '</div><div class="action-text">' + action.text + "</div></div>"; }).join("");
    var text = result.total >= 70 ?
      "Your brand score (" + result.total + "/100) indicates strong monetisation readiness. You can command: speaking fees (₦150k–₦2M+ per engagement), paid newsletter/community, consulting retainer (₦200k–₦1M+/month), book deal, brand ambassador partnerships, and premium courses." :
      result.total >= 50 ?
        "Your brand score (" + result.total + "/100) shows moderate monetisation potential. Focus on building one premium offering: a paid Whatsapp community, a signature online course (Selar or Gumroad), or consulting packages. At this stage, charge for your time: ₦20k–₦100k per consulting session." :
        "Your brand score (" + result.total + "/100) means you're not yet ready for significant brand monetisation. Invest the next 6–12 months building visibility. Most brand revenue comes after crossing the 60/100 threshold. Start with free speaking, free content, free community — then monetise when you have an audience.";
    document.getElementById("monetisation").innerHTML = "<strong>Monetisation Readiness: " + result.monetizationScore + "</strong><br><br>" + text;
    document.getElementById("results").className = "en-results on";
    tools.publish({ name: tools.text("Personal Brand Audit", "Audit de marque personnelle"), fileBase: "personal-brand-audit" });
  }
  global.calcBrand = calcBrand;
})(window);
