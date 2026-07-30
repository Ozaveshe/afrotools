(function (global) {
  "use strict";
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function value(id) { return document.getElementById(id).value; }
  function generate() {
    var engine = global.AfroTools && global.AfroTools.SocialMediaCalendarEngine;
    if (!engine) throw new Error("SocialMediaCalendarEngine is unavailable");
    var result = engine.generate({
      niche: value("niche"), platform: value("platform"), frequency: value("frequency"),
      timezone: value("timezone"), month: value("startMonth"), year: new Date().getFullYear(),
    });
    document.getElementById("calTitle").textContent = result.monthName + " " + result.year;
    document.getElementById("calSub").textContent = result.frequency === "daily" ? "Daily posting" : "Posting " + (result.frequency === "3x" ? "3x" : "once") + " per week — " + result.timezone + " timezone";
    document.getElementById("calHeaders").innerHTML = DAYS.map(function (day) { return '<div class="cal-header">' + day + "</div>"; }).join("");
    var byDay = {};
    result.posts.forEach(function (post) { byDay[post.day] = post; });
    var html = "";
    for (var pad = 0; pad < result.startDay; pad += 1) html += "<div></div>";
    var classes = { edu: "post-edu", ent: "post-ent", promo: "post-promo", personal: "post-personal" };
    var labels = { edu: "Educate", ent: "Entertain", promo: "Promote", personal: "Personal" };
    for (var day = 1; day <= result.daysInMonth; day += 1) {
      var post = byDay[day];
      html += post ? '<div class="cal-day"><div class="cal-day-num">' + day + '</div><div class="cal-post ' + classes[post.type] + '">' + labels[post.type] + '</div><div style="font-size:.72rem;color:#334155;line-height:1.3;margin-bottom:4px">' + post.topic + '</div><div class="cal-time">⏰ ' + post.time + "</div></div>" :
        '<div class="cal-day"><div class="cal-day-num" style="color:#cbd5e1">' + day + "</div></div>";
    }
    document.getElementById("calendar").innerHTML = html;
    document.getElementById("postCount").textContent = result.totalPosts;
    document.getElementById("mixMetrics").innerHTML =
      '<div class="en-metric"><div class="en-metric-label">Educational (30%)</div><div class="en-metric-value">' + result.counts.edu + '</div><div class="en-metric-unit" style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px">Educate</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Entertainment (50%)</div><div class="en-metric-value">' + result.counts.ent + '</div><div class="en-metric-unit" style="background:#fce7f3;color:#9d174d;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px">Entertain</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Promotional (20%)</div><div class="en-metric-value">' + result.counts.promo + '</div><div class="en-metric-unit" style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px">Promote</div></div>' +
      '<div class="en-metric"><div class="en-metric-label">Personal</div><div class="en-metric-value">' + result.counts.personal + '</div><div class="en-metric-unit" style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px">Connect</div></div>';
    var captions = {
      edu: "📚 Did you know? [Insert fact about " + result.niche + "]\n\nHere's why this matters for you: [explain in 2-3 sentences]\n\nSave this post and share with someone who needs to know this!\n\n#" + result.niche + " #Africa #AfricanCreatives #LearnSomethingNew",
      ent: "✨ [Hook — ask a question or make a bold statement]\n\n[Story or experience — 3-4 sentences]\n\nDouble tap if you agree! Drop your thoughts below 👇\n\n#" + result.niche + " #AfricaIsNotACountry #ContentCreator",
      promo: "🚀 [Product/Service Name] is here!\n\n[3 bullet points of key benefits]\n\n✅ [Call to action — e.g., \"Link in bio\" or \"DM 'INFO' to get started\"]\n\nLimited spots available — don't miss out!",
      personal: "I don't usually share this, but...\n\n[Personal story or lesson — 3-4 sentences]\n\nWhat's one thing you've learned on your journey? Comment below!\n\n#MyJourney #Authentic #AfricanCreator",
    };
    var captionLabels = { edu: "Educational Post", ent: "Entertainment Post", promo: "Promotional Post", personal: "Personal/Story Post" };
    document.getElementById("captionTemplates").innerHTML = Object.keys(captions).map(function (type) {
      return '<div style="margin-bottom:16px"><div style="font-size:.85rem;font-weight:700;color:var(--en-accent-dark);margin-bottom:8px">' + captionLabels[type] + '</div><div style="background:#f8fafd;border:1px solid var(--en-border);border-radius:10px;padding:14px;font-size:.83rem;line-height:1.7;color:#334155;white-space:pre-line">' + captions[type] + "</div></div>";
    }).join("");
    document.getElementById("results").classList.add("on");
    if (global.AfroToolsCreativeResultActions) global.AfroToolsCreativeResultActions.publish({ slug: "social-media-calendar", title: "Social media content calendar", result: result });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.generate = generate;
})(window);
