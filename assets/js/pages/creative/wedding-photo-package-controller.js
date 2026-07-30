(function (global) {
  "use strict";
  var LABELS = { new: "New Photographer", mid: "Experienced", senior: "Senior", established: "Top-Tier" };
  var NOTES = { new: "Basic package, digital only", mid: "Full day, 2nd shooter option", senior: "Album, drone, pre-wedding", established: "Full premium package" };
  var CHECKLIST = [
    "Client names and wedding date / venue", "Exact hours of coverage (start and end time)",
    "Package details: all inclusions listed explicitly", "Payment schedule: deposit + balance due date",
    "Cancellation / postponement policy (non-refundable deposit)", "Photo delivery timeline and format (online gallery, USB, etc.)",
    "Rights and usage — who owns the images", "Copyright notice: photographer retains copyright, client gets licence to print/share",
    "What happens if photographer is ill (backup plan)", "Travel / accommodation costs if applicable",
  ];
  function value(id) { return document.getElementById(id).value; }
  function fmt(number) { return number.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function engine() {
    var owner = global.AfroTools && global.AfroTools.WeddingPhotoPackageEngine;
    if (!owner) throw new Error("WeddingPhotoPackageEngine is unavailable");
    return owner;
  }
  function updatePrices() {
    var symbol = { NG: "₦", KE: "KES ", ZA: "R", GH: "GHS ", EG: "EGP " }[value("country")];
    document.getElementById("addonList").innerHTML = engine().catalog(value("country"), value("experience")).map(function (addon) {
      return '<div class="addon-item"><input aria-label="Cb ' + addon.id + '" type="checkbox" id="cb_' + addon.id + '"><div class="addon-label">' + addon.label + '<div style="font-size:.78rem;color:#94a3b8;font-weight:400">' + addon.desc + '</div></div><span class="addon-price">+' + symbol + fmt(addon.price) + "</span></div>";
    }).join("");
  }
  function calculate() {
    var addons = Array.from(document.querySelectorAll('#addonList input[type="checkbox"]:checked'), function (input) { return input.id.replace("cb_", ""); });
    var result = engine().calculate({ country: value("country"), hours: value("hours"), experience: value("experience"), addons: addons });
    var symbol = result.symbol;
    document.getElementById("totalPrice").textContent = symbol + fmt(result.total);
    document.getElementById("depositInfo").textContent = "Balance due: " + symbol + fmt(result.deposit) + " on the wedding day";
    document.getElementById("depositAmount").textContent = symbol + fmt(result.deposit);
    document.getElementById("quoteItems").innerHTML = result.items.map(function (item) {
      return '<div class="addon-item"><span style="font-size:1.1rem;color:#16a34a">✓</span><div class="addon-label">' + item.label + '</div><span class="addon-price">' + symbol + fmt(item.price) + "</span></div>";
    }).join("") + '<div style="background:var(--en-accent-pale);padding:14px 16px;border-top:2px solid var(--en-accent-light);display:flex;justify-content:space-between;font-weight:800;font-size:1rem"><span>TOTAL PACKAGE</span><span style="color:var(--en-accent-dark)">' + symbol + fmt(result.total) + "</span></div>";
    document.getElementById("compareTable").innerHTML = result.comparisons.map(function (item) {
      return '<tr' + (item.level === result.experience ? ' style="background:var(--en-accent-pale)"' : "") + '><td class="en-td-value">' +
        LABELS[item.level] + (item.level === result.experience ? " ← You" : "") + '</td><td class="en-td-highlight">' + symbol + fmt(item.price) + " – " + symbol + fmt(item.price * 2) +
        '</td><td style="font-size:.82rem;color:#64748b">' + NOTES[item.level] + "</td></tr>";
    }).join("");
    document.getElementById("contractChecklist").innerHTML = '<ul style="list-style:none;display:flex;flex-direction:column;gap:8px;font-size:.88rem">' +
      CHECKLIST.map(function (item) { return '<li style="display:flex;gap:8px;align-items:flex-start"><span style="color:var(--en-accent);flex-shrink:0">□</span>' + item + "</li>"; }).join("") + "</ul>";
    document.getElementById("results").classList.add("on");
    if (global.AfroToolsCreativeResultActions) global.AfroToolsCreativeResultActions.publish({ slug: "wedding-photo-package", title: "Wedding photography package", result: result });
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  global.updatePrices = updatePrices;
  global.calculate = calculate;
  updatePrices();
})(window);
