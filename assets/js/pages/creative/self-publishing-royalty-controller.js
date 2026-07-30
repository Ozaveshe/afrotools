(function (global) {
  "use strict";
  function fmt(number, digits) { return number.toLocaleString("en-US", { minimumFractionDigits: digits || 2, maximumFractionDigits: digits || 2 }); }
  function value(id) { return document.getElementById(id).value; }
  function calculate() {
    var engine = global.AfroTools && global.AfroTools.SelfPublishingRoyaltyEngine;
    if (!engine) throw new Error("SelfPublishingRoyaltyEngine is unavailable");
    var result = engine.calculate({
      price: value("bookPrice"), format: value("format"), pages: value("pageCount"),
      monthly: value("monthlySales"), country: value("country"),
    });
    var best = result.best;
    document.getElementById("bestMonthly").textContent = "$" + fmt(best.perCopy * result.monthly);
    document.getElementById("bestPlatform").textContent = "Best: " + best.name + " (" + result.symbol + fmt(best.perCopy * result.monthly * result.rate, 0) + "/month)";
    document.getElementById("bestAnnual").textContent = "$" + fmt(best.perCopy * result.monthly * 12, 0);
    document.getElementById("platformTable").innerHTML = result.platforms.map(function (platform, index) {
      var note = platform.note === "print-cost-formula" ? "Price minus print cost (" + fmt(result.printCost) + "×60%)" : platform.note;
      var monthly = platform.perCopy * result.monthly;
      return '<tr><td class="en-td-value">' + platform.name + (index === 0 ? '<span class="winner-badge">BEST</span>' : "") + "</td><td>" +
        (platform.rate * 100).toFixed(0) + "%</td><td>$" + fmt(platform.perCopy) + "</td><td>$" + fmt(monthly, 0) +
        '</td><td class="en-td-highlight">$' + fmt(monthly * 12, 0) + '</td><td style="font-size:.8rem;color:#64748b">' + note + "</td></tr>";
    }).join("");
    document.getElementById("sweetSpotTable").innerHTML = result.sweetSpots.map(function (spot) {
      return '<tr' + (spot.price === result.price ? ' style="background:var(--en-accent-pale)"' : "") + "><td>$" + spot.price.toFixed(2) +
        (spot.price === result.price ? " (current)" : spot.price === 4.99 ? " ★ popular" : "") + "</td><td>" + (spot.rate * 100).toFixed(0) +
        "%</td><td>$" + fmt(spot.monthly, 0) + '</td><td class="en-td-highlight">$' + fmt(spot.annual, 0) + "</td></tr>";
    }).join("");
    document.getElementById("results").classList.add("on");
    if (global.AfroToolsCreativeResultActions) global.AfroToolsCreativeResultActions.publish({ slug: "self-publishing-royalty", title: "Self-publishing royalty comparison", result: result });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.calculate = calculate;
})(window);
