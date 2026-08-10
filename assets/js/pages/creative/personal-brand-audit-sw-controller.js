(function (global) {
  "use strict";
  var root = document.querySelector("[data-personal-brand-audit-sw]");
  var engine = global.AfroTools && global.AfroTools.PersonalBrandAuditEngine;
  if (!root || !engine) return;
  var form = root.querySelector("form");
  var results = root.querySelector("[data-results]");
  var status = root.querySelector("[data-status]");
  var lastReport = "";
  var CATEGORY_LABELS = {
    LinkedIn: "LinkedIn", "Social Media": "Mitandao ya kijamii", "Digital / SEO": "Uwepo wa kidijitali / SEO",
    "Content Creation": "Uundaji wa maudhui", "Offline Reputation": "Sifa nje ya mtandao", Credentials: "Sifa na vyeti"
  };
  var SUMMARY = {
    "A+": "Chapa yako binafsi inaonekana kama mamlaka inayotambulika katika taaluma yako.",
    A: "Chapa yako binafsi ni imara na rahisi kugunduliwa. Endelea kujenga ushahidi.",
    "B+": "Una mwonekano na uaminifu mzuri; hatua chache zenye umakini zinaweza kukupeleka daraja la juu.",
    B: "Msingi upo. Uchapishaji wa maudhui kwa uthabiti ndio hatua inayofuata.",
    C: "Chapa yako inachipua; huenda sifa yako nje ya mtandao ni imara kuliko uwepo wa kidijitali.",
    D: "Uko hatua ya mwanzo. Boresha LinkedIn na uchague njia moja ya maudhui.",
    F: "Anza kwa kuunda au kukamilisha wasifu wa LinkedIn na ushahidi mmoja wa kazi."
  };
  var WEAKEST_ACTIONS = {
    LinkedIn: "Kamilisha kila sehemu ya LinkedIn na uombe mapendekezo matatu ya kweli kutoka kwa watu uliowahi kufanya nao kazi.",
    "Social Media": "Chagua jukwaa moja na uchapishe kwa ratiba ya siku 30 huku ukijibu mazungumzo ya taaluma yako.",
    "Digital / SEO": "Unda portfolio rahisi yenye wasifu, kazi zilizothibitishwa na jina lako kwenye kichwa cha ukurasa.",
    "Content Creation": "Andika makala moja kila wiki na uibadilishe kuwa machapisho mafupi yenye ushahidi.",
    "Offline Reputation": "Omba nafasi za kuzungumza kwenye matukio mawili na hudhuria mikutano ya taaluma yako.",
    Credentials: "Chunguza cheti kimoja kinachotambulika katika taaluma yako na uthibitishe gharama na masharti yake."
  };
  function field(id) { return root.querySelector("#" + id); }
  function selectedIndustry() { var node = field("industry"); return node.options[node.selectedIndex] ? node.options[node.selectedIndex].textContent : ""; }
  function getInput() {
    var ids = ["liConnections", "liPosting", "twFollowers", "igFollowers", "website", "googleResult", "articles", "book", "podcast", "speaking", "awards", "education", "certs"];
    var input = { industry: field("industry").value, yearsExp: field("yearsExp").value };
    ids.forEach(function (id) { input[id] = field(id).value; }); return input;
  }
  function recommendations(result) {
    return [
      ["Siku 1–7", "Maboresho ya haraka", "Boresha kichwa cha LinkedIn kwa maneno matatu ya taaluma yako, tumia picha ya kitaalamu na chagua siku mbili za kuchapisha."],
      ["Siku 8–21", "Anzisha maudhui", "Andika makala moja kuhusu funzo lako kubwa baada ya miaka " + result.years + " katika " + selectedIndustry() + "."],
      ["Siku 22–45", "Imarisha " + CATEGORY_LABELS[result.weakest.name], WEAKEST_ACTIONS[result.weakest.name]],
      ["Siku 46–60", "Mwonekano nje ya mtandao", "Omba kuzungumza katika tukio au webinar moja na kutembelea podcast inayohusiana na taaluma yako."],
      ["Siku 61–90", "Uthabiti na mifumo", "Panga maudhui wiki mbili mapema, pima alama tena na weka lengo la miezi sita linaloweza kuthibitishwa."]
    ];
  }
  function readiness(result) {
    if (result.total >= 70) return ["Juu", "Una ushahidi wa kutosha kujaribu ofa moja ya kulipwa. Thibitisha mahitaji ya hadhira, bei, kodi na masharti kabla ya kuahidi matokeo."];
    if (result.total >= 50) return ["Wastani", "Jenga ofa moja ya wazi na ujaribu kwa wateja wachache. Usitumie alama hii kama uthibitisho wa mapato au bei ya soko."];
    return ["Hatua ya mwanzo", "Tumia miezi inayofuata kujenga ushahidi, mwonekano na hadhira kabla ya kutegemea mapato ya chapa binafsi."];
  }
  function makeReport(result, plan, ready) {
    var lines = ["UKAGUZI WA CHAPA BINAFSI", "Alama: " + result.total + "/100", "Daraja: " + result.grade, "Muhtasari: " + SUMMARY[result.grade], "Sekta: " + selectedIndustry(), "Uzoefu: " + result.years + " miaka", "", "MGAWANYO WA ALAMA"];
    result.categories.forEach(function (category) { lines.push(CATEGORY_LABELS[category.name] + ": " + category.score + "/" + category.max); });
    lines.push("", "MPANGO WA SIKU 90"); plan.forEach(function (item) { lines.push(item[0] + " — " + item[1] + ": " + item[2]); });
    lines.push("", "UTAYARI WA MAPATO: " + ready[0], ready[1], "", "Ni tathmini binafsi ya kupanga, si data hai ya wasifu wala dhamana ya ukuaji, kazi au mapato.", "Imetengenezwa ndani ya kivinjari na AfroTools.");
    return lines.join("\n");
  }
  function render(result) {
    var plan = recommendations(result); var ready = readiness(result);
    root.querySelector("[data-score]").textContent = result.total;
    root.querySelector("[data-ring]").style.setProperty("--pct", result.total + "%");
    root.querySelector("[data-grade]").textContent = "Daraja " + result.grade;
    root.querySelector("[data-grade]").className = "grade-badge " + result.gradeClass;
    root.querySelector("[data-summary]").textContent = SUMMARY[result.grade];
    root.querySelector("[data-breakdown]").innerHTML = result.categories.map(function (category) {
      var percentage = Math.round(category.score / category.max * 100);
      return '<div class="en-progress-item"><div class="en-progress-label">' + category.icon + " " + CATEGORY_LABELS[category.name] + '</div><div class="en-progress-bar-wrap"><div class="en-progress-bar" style="width:' + percentage + '%"></div></div><div class="en-progress-value">' + category.score + "/" + category.max + "</div></div>";
    }).join("");
    root.querySelector("[data-plan]").innerHTML = plan.map(function (item) { return '<article class="action-card"><div class="action-week">' + item[0] + '</div><div class="action-text"><strong>' + item[1] + ":</strong> " + item[2] + "</div></article>"; }).join("");
    root.querySelector("[data-readiness]").innerHTML = "<strong>Utayari wa mapato: " + ready[0] + "</strong><br>" + ready[1];
    results.hidden = false; results.classList.add("on"); root.querySelector("[data-actions]").hidden = false; lastReport = makeReport(result, plan, ready);
    status.textContent = "Ukaguzi umekamilika kwenye kivinjari hiki.";
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!field("industry").value) { status.textContent = "Chagua sekta kabla ya kukokotoa."; field("industry").setAttribute("aria-invalid", "true"); field("industry").focus(); return; }
    field("industry").removeAttribute("aria-invalid"); render(engine.calculate(getInput()));
  });
  root.querySelector("[data-reset]").addEventListener("click", function () {
    form.reset(); results.hidden = true; results.classList.remove("on"); root.querySelector("[data-actions]").hidden = true; lastReport = ""; status.textContent = "Mfano umerejeshwa."; field("industry").focus();
  });
  function fallbackCopy(text) { var area = document.createElement("textarea"); area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); }
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastReport) return;
    var attempt = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(lastReport) : Promise.reject();
    Promise.resolve(attempt).catch(function () { fallbackCopy(lastReport); }).finally(function () { status.textContent = "Muhtasari umenakiliwa."; });
  });
  root.querySelector("[data-txt]").addEventListener("click", function () {
    if (!lastReport) return;
    var url = URL.createObjectURL(new Blob([lastReport], { type: "text/plain;charset=utf-8" })); var link = document.createElement("a");
    link.href = url; link.download = "ukaguzi-wa-chapa-binafsi.txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); status.textContent = "Faili ya TXT imepakuliwa.";
  });
})(window);
