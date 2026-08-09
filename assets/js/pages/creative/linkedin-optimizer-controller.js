(function (root, document) {
  "use strict";

  var engine = root.AfroTools && root.AfroTools.LinkedInOptimizerEngine;
  if (!engine || !document) return;
  var locale = root.AfroToolsLinkedInOptimizerLocale || {};
  var strings = locale.strings || {};

  function t(key, fallback) {
    return Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : fallback;
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function readInput() {
    var checks = {};
    document.querySelectorAll('[id^="chk_"]').forEach(function (control) {
      checks[control.id] = control.checked === true;
    });
    return {
      industry: document.getElementById("industry").value,
      level: document.getElementById("level").value,
      connections: document.getElementById("connections").value,
      checks: checks,
    };
  }

  function renderChecklist(result) {
    var mount = document.getElementById("checklistStatus");
    mount.replaceChildren();
    result.checklist.forEach(function (check) {
      var row = element("div", "check-row " + (check.checked ? "pass" : "fail"));
      row.appendChild(element("div", "check-icon", check.checked ? "✅" : "❌"));
      var localizedCheck = locale.checks && locale.checks[check.id];
      var label = element("div", "check-label", localizedCheck ? localizedCheck.label : check.label);
      if (!check.checked) {
        label.append(" — ");
        var tip = element("em", "", localizedCheck ? localizedCheck.tip : check.tip);
        tip.style.fontWeight = "400";
        tip.style.color = "#64748b";
        label.appendChild(tip);
      }
      row.appendChild(label);
      row.appendChild(element("div", "check-pts", check.points + " " + t("points", "pts")));
      mount.appendChild(row);
    });
  }

  function renderHeadlines(result) {
    var mount = document.getElementById("headlines");
    mount.replaceChildren();
    var intro = element("p", "", t("headlineIntro", "Choose or adapt one of these for your level:"));
    intro.style.cssText = "font-size:.82rem;color:#64748b;margin-bottom:12px";
    mount.appendChild(intro);
    result.headlines.forEach(function (headline) {
      var card = element("div", "headline-card");
      if (headline.recommended) {
        card.style.borderColor = "var(--en-accent)";
        var recommended = element("div", "", t("recommended", "✓ RECOMMENDED FOR YOUR LEVEL"));
        recommended.style.cssText = "font-size:.7rem;font-weight:800;color:var(--en-accent-dark);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px";
        card.appendChild(recommended);
      }
      var headlineText = typeof locale.headline === "function" ? locale.headline(result.input.industry, headline.level, headline.text) : headline.text;
      card.appendChild(element("div", "headline-text", headlineText));
      var levelName = locale.levels && locale.levels[headline.level] ? locale.levels[headline.level] : headline.level;
      card.appendChild(element("div", "headline-why", t("level", "Level:") + " " + levelName));
      mount.appendChild(card);
    });
  }

  function renderKeywords(result) {
    var mount = document.getElementById("keywords");
    mount.replaceChildren();
    result.keywords.forEach(function (keyword) {
      mount.appendChild(element("span", "kw-tag", keyword));
    });
  }

  function render(result) {
    document.getElementById("profileScore").textContent = result.score + "%";
    var badge = element(
      "span",
      "allstar-badge",
      result.allStar
        ? t("allStar", "⭐ ALL-STAR STATUS")
        : t("notAllStar", "🔶 Not All-Star Yet — needs") + " " + result.pointsToAllStar + " " + t("morePoints", "more pts")
    );
    badge.style.background = result.allStar ? "#dcfce7" : "#fef9c3";
    badge.style.color = result.allStar ? "#15803d" : "#a16207";
    document.getElementById("allStarBadge").replaceChildren(badge);
    document.getElementById("profileSummary").textContent = result.allStar
      ? t("allStarSummary", "Congratulations! Your profile appears in more recruiter searches and gets 2× more views.")
      : t("incompleteSummary", "Complete the items below to reach All-Star status. All-Star profiles appear 2× more in searches.");

    renderChecklist(result);
    renderHeadlines(result);
    renderKeywords(result);

    var growth = document.getElementById("growthStrategy");
    var growthTip = locale.growthTips && locale.growthTips[result.input.connections] ? locale.growthTips[result.input.connections] : result.growthTip;
    growth.replaceChildren(document.createTextNode(growthTip));
    growth.appendChild(document.createElement("br"));
    growth.appendChild(document.createElement("br"));
    var industryName = locale.industries && locale.industries[result.input.industry] ? locale.industries[result.input.industry] : result.input.industry;
    growth.appendChild(element("strong", "", t("postingStrategy", "Posting strategy for") + " " + industryName + ":"));
    growth.append(" " + (locale.postingStrategy || result.postingStrategy));
    document.getElementById("results").classList.add("on");
  }

  function calculate() {
    render(engine.calculate(readInput()));
  }

  root.calcLinkedIn = calculate;
})(window, document);
