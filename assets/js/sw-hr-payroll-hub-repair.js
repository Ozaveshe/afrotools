(function () {
  "use strict";

  var tools = [
    ["contractor-vs-employee", "Mkandarasi dhidi ya Mfanyakazi", "Linganisha bajeti mbili bila kuamua hadhi ya kisheria; thibitisha uhusiano na chanzo kinachotumika.", "/sw/zana/mkandarasi-dhidi-ya-mfanyakazi/"],
    ["domestic-worker", "Mshahara wa Mfanyakazi wa Nyumbani", "Panga gharama ya mwajiri kwa viwango unavyoingiza na chanzo chenye tarehe.", "/sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/"],
    ["employee-cost", "Gharama ya Mfanyakazi", "Jumlisha mshahara, marupurupu, wajibu na gharama nyingine kama makadirio ya kupanga.", "/sw/zana/gharama-ya-mfanyakazi/"],
    ["gratuity-calculator", "Kiinua Mgongo", "Tumia kiwango, muda wa huduma na chanzo ulichothibitisha kuandaa makadirio.", "/sw/zana/kikokotoo-kiinua-mgongo/"],
    ["maternity-leave", "Likizo ya Uzazi au ya Mzazi", "Linganisha muda na malipo kwa viwango unavyoingiza; thibitisha ustahiki na chanzo.", "/sw/zana/kikokotoo-likizo-ya-uzazi/"],
    ["retrenchment-calculator", "Malipo ya Kuachishwa Kazi", "Kadiria malipo kwa muda wa huduma, notisi, likizo na makato uliyothibitisha.", "/sw/zana/kikokotoo-malipo-ya-kuachishwa-kazi/"]
  ];

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function card(tool) {
    var id = tool[0], name = tool[1], description = tool[2], href = tool[3];
    return '<a href="' + escapeHtml(href) + '" class="htc sw-hr-hub-owned" data-sw-hr-hub-id="' + escapeHtml(id) + '">' +
      '<div class="htc-img" aria-hidden="true"><img src="/assets/img/tools/' + escapeHtml(id) + '.webp" alt="" loading="lazy" decoding="async"><div class="htc-img-chips"><span class="htc-badge badge-live">● Inapatikana</span></div></div>' +
      '<div class="htc-body"><div class="htc-name">' + escapeHtml(name) + '</div><div class="htc-desc">' + escapeHtml(description) + '</div></div>' +
      '<div class="htc-foot"><span class="htc-cta">Kokotoa<svg class="htc-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></span></div></a>';
  }

  function sync() {
    var grid = document.getElementById("tool-grid");
    if (!grid) return;
    grid.querySelectorAll(".sw-hr-hub-owned").forEach(function (node) { node.remove(); });
    var search = document.getElementById("hub-search");
    var query = String(search && search.value || "").trim().toLowerCase();
    var owned = tools.filter(function (tool) { return !query || tool.join(" ").toLowerCase().indexOf(query) !== -1; });
    if (owned.length) grid.insertAdjacentHTML("afterbegin", owned.map(card).join(""));
    var count = document.getElementById("tool-count");
    if (count) count.textContent = grid.querySelectorAll(".htc").length + " zana";
  }

  document.addEventListener("DOMContentLoaded", function () {
    sync();
    var search = document.getElementById("hub-search");
    if (search) search.addEventListener("input", sync);
  });
})();
