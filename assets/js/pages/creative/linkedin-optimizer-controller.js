(function (root, document) {
  "use strict";

  var engine = root.AfroTools && root.AfroTools.LinkedInOptimizerEngine;
  if (!engine || !document) return;

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
      var label = element("div", "check-label", check.label);
      if (!check.checked) {
        label.append(" — ");
        var tip = element("em", "", check.tip);
        tip.style.fontWeight = "400";
        tip.style.color = "#64748b";
        label.appendChild(tip);
      }
      row.appendChild(label);
      row.appendChild(element("div", "check-pts", check.points + " pts"));
      mount.appendChild(row);
    });
  }

  function renderHeadlines(result) {
    var mount = document.getElementById("headlines");
    mount.replaceChildren();
    var intro = element("p", "", "Choose or adapt one of these for your level:");
    intro.style.cssText = "font-size:.82rem;color:#64748b;margin-bottom:12px";
    mount.appendChild(intro);
    result.headlines.forEach(function (headline) {
      var card = element("div", "headline-card");
      if (headline.recommended) {
        card.style.borderColor = "var(--en-accent)";
        var recommended = element("div", "", "✓ RECOMMENDED FOR YOUR LEVEL");
        recommended.style.cssText = "font-size:.7rem;font-weight:800;color:var(--en-accent-dark);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px";
        card.appendChild(recommended);
      }
      card.appendChild(element("div", "headline-text", headline.text));
      card.appendChild(element("div", "headline-why", "Level: " + headline.level));
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
        ? "⭐ ALL-STAR STATUS"
        : "🔶 Not All-Star Yet — needs " + result.pointsToAllStar + " more pts"
    );
    badge.style.background = result.allStar ? "#dcfce7" : "#fef9c3";
    badge.style.color = result.allStar ? "#15803d" : "#a16207";
    document.getElementById("allStarBadge").replaceChildren(badge);
    document.getElementById("profileSummary").textContent = result.allStar
      ? "Congratulations! Your profile appears in more recruiter searches and gets 2× more views."
      : "Complete the items below to reach All-Star status. All-Star profiles appear 2× more in searches.";

    renderChecklist(result);
    renderHeadlines(result);
    renderKeywords(result);

    var growth = document.getElementById("growthStrategy");
    growth.replaceChildren(document.createTextNode(result.growthTip));
    growth.appendChild(document.createElement("br"));
    growth.appendChild(document.createElement("br"));
    growth.appendChild(element("strong", "", "Posting strategy for " + result.input.industry + ":"));
    growth.append(" " + result.postingStrategy);
    document.getElementById("results").classList.add("on");
  }

  function calculate() {
    render(engine.calculate(readInput()));
  }

  root.calcLinkedIn = calculate;
})(window, document);
