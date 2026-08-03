(function initSwEnergySizingParity(root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AfroToolsSwEnergySizingParity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwEnergySizingParity(root) {
  "use strict";

  var PRESETS = [
    { name: "Taa ya LED (9W)", watts: 9, hours: 6, qty: 4 },
    { name: "Feni ya dari", watts: 75, hours: 8, qty: 1 },
    { name: "Kuchaji simu", watts: 10, hours: 4, qty: 2 },
    { name: "Televisheni ya LED ya inchi 32", watts: 60, hours: 5, qty: 1 },
    { name: "Friji ya lita 200", watts: 120, hours: 24, qty: 1 }
  ];

  var LOAD_SCENARIOS = [
    { name: "Mzigo wote ulioingizwa", ratio: 1, action: "Endesha mzigo wote ulioingizwa" },
    { name: "Punguza mzigo kwa 25%", ratio: 0.75, action: "Zima karibu robo ya mzigo" },
    { name: "Nusu ya mzigo", ratio: 0.5, action: "Endesha nusu ya mzigo" },
    { name: "Vifaa muhimu", ratio: 0.4, action: "Endesha vifaa muhimu kwa takribani 40% ya mzigo" },
    { name: "Vifaa vya dharura", ratio: 0.25, action: "Endesha robo ya mzigo pekee" }
  ];

  var SOLAR_COST_ASSUMPTIONS = [
    "Paneli: USD 300 kwa kW.",
    "Betri: USD 200 kwa kWh.",
    "Inverter: USD 150 kwa kVA.",
    "Ufungaji: 20% ya jumla ya paneli, betri na inverter.",
    "Fedha ya nchi: jumla ya USD huzidishwa kwa kiwango cha nakala ya Machi 2026."
  ];

  function byId(id) {
    return root.document ? root.document.getElementById(id) : null;
  }

  function numberFrom(value) {
    var parsed = parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function countryRecord(code) {
    var countries = root.ENERGY_DATA && root.ENERGY_DATA.countries;
    return countries && countries[code] ? countries[code] : null;
  }

  function countryName(code) {
    var country = countryRecord(code);
    return country && (country.nameSw || country.name) ? (country.nameSw || country.name) : code;
  }

  function reviewedMonth() {
    return root.ENERGY_DATA && root.ENERGY_DATA.lastUpdated
      ? root.ENERGY_DATA.lastUpdated
      : "haijaandikwa";
  }

  function sourceUrl(id, fallback) {
    var sources = root.ENERGY_DATA && root.ENERGY_DATA.sourceUrls;
    var source = sources && sources.find(function findSource(item) { return item.id === id; });
    return source && source.url ? source.url : fallback;
  }

  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value;
  }

  function setStatus(message, state) {
    var node = byId("formStatus");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.state = state || "";
  }

  function clearValidationStatus() {
    setStatus("");
  }

  function firstInvalidField(fields) {
    for (var index = 0; index < fields.length; index += 1) {
      if (!fields[index].checkValidity()) return fields[index];
    }
    return null;
  }

  function reportInvalidField(field, message) {
    if (field && typeof field.reportValidity === "function") field.reportValidity();
    setStatus(message, "error");
  }

  function showResults(show) {
    var results = byId("results");
    if (!results) return;
    results.classList.toggle("on", Boolean(show));
    results.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function scrollToResults() {
    var results = byId("results");
    if (!results) return;
    var reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    results.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function copyText(value) {
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      return root.navigator.clipboard.writeText(value);
    }
    var area = root.document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    root.document.body.appendChild(area);
    area.select();
    var copied = false;
    try {
      copied = root.document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    area.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error("copy unavailable"));
  }

  function formatConfig(value) {
    return String(value || "")
      .replace(/\bbatteries\b/gi, "betri")
      .replace(/\s*Ã—\s*/g, " × ");
  }

  function cycleLabel(value) {
    var match = String(value || "").match(/^(\d+) cycles \((\d+) yrs\)$/);
    if (!match) return String(value || "").replace("cycles", "mizunguko").replace("yrs", "miaka");
    return Number(match[1]).toLocaleString("sw") + " mizunguko (takribani miaka " + Number(match[2]) + ")";
  }

  function hoursLabel(value) {
    return numberFrom(value) + " saa";
  }

  function renderObservations(items) {
    var panel = byId("rObs");
    if (!panel) return;
    panel.replaceChildren();
    panel.className = "sw-observations";
    var heading = root.document.createElement("h3");
    heading.textContent = "Maelezo ya makadirio";
    var list = root.document.createElement("ul");
    items.forEach(function addItem(text) {
      var item = root.document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    panel.append(heading, list);
  }

  function solarObservations(input, result) {
    var top = result.applianceList && result.applianceList[0];
    var items = [
      "Mzigo uliounganishwa ni " + result.totalWatts + "; matumizi ya siku ni " + result.dailyKWh + ".",
      "Makadirio yametumia saa " + result.sunHours + " za jua lenye kilele kwa siku na nyongeza ya uzalishaji ya 25%.",
      "Betri imelenga siku 1.5 za nishati; inverter imepewa nafasi ya ziada ya 20%."
    ];
    if (top) {
      items.push("Kifaa chenye matumizi makubwa zaidi ni " + top.name + " kwa " + top.dailyWh + " Wh kwa siku.");
    }
    items.push("Fundi athibitishe msukumo wa kuanzia, kivuli, paa, nyaya, ulinzi na earthing kabla ya ununuzi.");
    return items;
  }

  function batteryObservations(input, result) {
    return [
      "Mzigo wa " + input.loadWatts + " W kwa saa " + input.backupHours + " unahitaji " + result.requiredKWh + " kabla ya kurekebisha DoD.",
      (input.batteryType === "lithium" ? "LiFePO4" : "Lead-acid") + " imetumia DoD ya " + result.dod + " na ufanisi wa inverter wa 90%.",
      "Mpangilio wa mfano ni " + formatConfig(result.batteryConfig) + "; si orodha ya vifaa ya kununua.",
      "Thibitisha BMS, msukumo wa kuanzia, joto, nyaya, kinga, uingizaji hewa na dhamana na fundi mwenye sifa."
    ];
  }

  function backupObservations(input, result) {
    return [
      "Kwa mzigo wa " + input.loadWatts + " W, muda wa akiba ni " + hoursLabel(result.backupHours) + " baada ya ufanisi wa inverter wa 90%.",
      "Betri ya " + result.batteryKWh + " imetumia DoD ya " + result.dod + ", hivyo nishati inayotumika ni " + result.usableKWh + ".",
      "Kupunguza mzigo hadi vifaa muhimu huongeza muda, lakini makadirio hayahesabu umri, joto, idle draw wala msukumo wa kuanzia.",
      "Thibitisha hali ya betri, watt za kuendelea na kuanzia, nyaya, uingizaji hewa na mipaka ya inverter."
    ];
  }

  function solarBrief(input, result) {
    var appliances = result.applianceList.map(function mapAppliance(item) {
      return "- " + item.name + ": " + item.watts + " W × saa " + item.hoursPerDay + " = " + item.dailyWh + " Wh kwa siku";
    });
    return [
      "MUHTASARI WA UKUBWA WA MFUMO WA UMEME WA JUA — AFROTOOLS",
      "Nchi: " + countryName(input.country) + " (" + input.country + ")",
      "Mwezi wa nakala ya data: " + reviewedMonth(),
      "Chanzo cha saa za jua: " + sourceUrl("global-solar-atlas", "https://globalsolaratlas.info/map"),
      "Chanzo cha kiwango cha fedha: " + sourceUrl("world-bank-official-exchange-rate", "https://data.worldbank.org/indicator/PA.NUS.FCRF"),
      "Saa za jua lenye kilele: " + result.sunHours + " kwa siku",
      "Mzigo uliounganishwa: " + result.totalWatts,
      "Nishati ya siku: " + result.dailyKWh,
      "Paneli zinazopendekezwa: " + result.solarKW,
      "Betri inayopendekezwa: " + result.batteryKWh + " / " + result.batteryAh,
      "Inverter inayopendekezwa: " + result.inverterKVA,
      "Gharama ya mfano: " + result.totalCostUSD + (result.totalCostLocal !== result.totalCostUSD ? " (" + result.totalCostLocal + ")" : ""),
      "",
      "VIFAA VILIVYOHESABIWA",
      appliances.join("\n"),
      "",
      "DHANA ZILIZOLINDWA",
      "- Nyongeza ya uzalishaji na upotevu wa paneli: 25%.",
      "- Hifadhi ya betri: siku 1.5 za matumizi yaliyohesabiwa.",
      "- Nafasi ya inverter: 20%, ikizungushwa hadi 0.5 kVA.",
      "- " + SOLAR_COST_ASSUMPTIONS.join("\n- "),
      "- Mfano wa gharama si bei hai wala ofa ya mtoa huduma; kiwango cha fedha na gharama zina uhakika wa chini.",
      "",
      "Makadirio ya kupanga tu; si usanifu wa umeme, ofa ya fundi, idhini ya utility, dhamana wala uthibitisho wa usalama.",
      "Faragha: taarifa hii haijahifadhiwa wala kutumwa. Iinakiliwe tu ukichagua."
    ].join("\n");
  }

  function chemistryDecision(lithium, lead) {
    var saving = numberFrom(lead.totalCapacityKWh) - numberFrom(lithium.totalCapacityKWh);
    var multiple = Math.round(parseInt(lithium.cycleLife, 10) / parseInt(lead.cycleLife, 10));
    var premium = numberFrom(lithium.totalCostUSD) - numberFrom(lead.totalCostUSD);
    var cost = premium >= 0
      ? "gharama ya mwanzo ni USD " + Math.round(premium).toLocaleString("sw") + " zaidi"
      : "gharama ya mwanzo ni USD " + Math.round(Math.abs(premium)).toLocaleString("sw") + " chini";
    return "Katika mfano huu, LiFePO4 inahitaji kWh " + saving.toFixed(1) + " pungufu ya uwezo wa jina na ina karibu mara " + multiple + " ya mizunguko, lakini " + cost + ". Linganisha nishati inayotumika, dhamana, marudio ya kubadilisha na masharti ya ufungaji.";
  }

  function batteryBrief(input, lithium, lead) {
    return [
      "ULINGANISHO WA KEMIA YA BETRI — AFROTOOLS",
      "Nchi: " + countryName(input.country) + " (" + input.country + ")",
      "Mwezi wa nakala ya data: " + reviewedMonth(),
      "Chanzo cha kiwango cha fedha: " + sourceUrl("world-bank-official-exchange-rate", "https://data.worldbank.org/indicator/PA.NUS.FCRF"),
      "Mzigo: " + input.loadWatts + " W",
      "Muda unaolengwa: saa " + input.backupHours,
      "Voltage ya mfumo: " + input.systemVoltage + " V",
      "Inverter ya mfano kwa zote mbili: " + lithium.inverterKVA,
      "",
      "LiFePO4",
      "- Uwezo: " + lithium.totalCapacityKWh + " / " + lithium.totalAh,
      "- Mpangilio: " + formatConfig(lithium.batteryConfig),
      "- DoD: " + lithium.dod,
      "- Mizunguko: " + cycleLabel(lithium.cycleLife),
      "- Gharama ya mfumo: " + lithium.totalCostUSD + " (" + lithium.totalCostLocal + ")",
      "",
      "LEAD-ACID AGM/GEL",
      "- Uwezo: " + lead.totalCapacityKWh + " / " + lead.totalAh,
      "- Mpangilio: " + formatConfig(lead.batteryConfig),
      "- DoD: " + lead.dod,
      "- Mizunguko: " + cycleLabel(lead.cycleLife),
      "- Gharama ya mfumo: " + lead.totalCostUSD + " (" + lead.totalCostLocal + ")",
      "",
      "Uamuzi: " + chemistryDecision(lithium, lead),
      "",
      "Dhana ya gharama ya betri: USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V/200 Ah au USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V/200 Ah, kulingana na kemia iliyochaguliwa.",
      "Idadi nzima ya betri hupatikana baada ya kupanga betri za 12 V/200 Ah kwa mfululizo na sambamba ili kutimiza voltage na Ah za mfumo; gharama ya betri ni idadi hiyo mara kiwango cha kemia.",
      "Dhana ya gharama ya inverter: USD 180 kwa kila kVA ya ukubwa wa inverter uliokokotolewa. Gharama ya mfumo ni gharama ya betri pamoja na gharama ya inverter.",
      "Kiasi cha nchi ni jumla ya USD mara kiwango cha fedha cha nakala ya Machi 2026.",
      "Asili na hali mpya: viwango vya USD 300, USD 100 na USD 180/kVA ni dhana zisizo hai zilizowekwa ndani ya injini ya Kiingereza ya AfroTools; si data ya sasa ya soko wala bei ya muuzaji. Kiwango cha fedha ni nakala ya Machi 2026 yenye uhakika mdogo ikizeeka.",
      "Mpaka: ni makadirio ya kupanga pekee, si usanifu, ushauri wa mtaalamu, ofa ya bei au dhamana. Mfano pia hutumia ufanisi wa inverter wa 90%, DoD kulingana na kemia na nafasi ya inverter ya 30%; mizunguko si dhamana.",
      "Faragha: ulinganisho huu haujahifadhiwa wala kutumwa."
    ].join("\n");
  }

  function scenarioRows(input, engine) {
    return LOAD_SCENARIOS.map(function mapScenario(scenario) {
      var targetWatts = Math.max(1, Math.round(input.loadWatts * scenario.ratio));
      var result = engine.calculate(Object.assign({}, input, { loadWatts: targetWatts }));
      return {
        name: scenario.name,
        action: scenario.action,
        targetWatts: targetWatts,
        runtime: hoursLabel(result.backupHours),
        runtimeHours: numberFrom(result.backupHours)
      };
    });
  }

  function backupBrief(input, result, scenarios) {
    var basis = input.batteryKWh > 0
      ? input.batteryKWh + " kWh"
      : input.batteryAh + " Ah × " + input.systemVoltage + " V";
    var baseline = scenarios[0].runtimeHours;
    var lines = [
      "MPANGO WA MUDA WA AKIBA WAKATI UMEME UMEKATIKA — AFROTOOLS",
      "Betri iliyoingizwa: " + basis,
      "Aina: " + result.batteryType + " | jumla " + result.batteryKWh + " | inayotumika " + result.usableKWh,
      "Ufanisi wa inverter: 90%",
      "Mzigo wa kuanzia: " + input.loadWatts + " W",
      "Rejeo la mbinu: https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/index-en.html",
      ""
    ];
    scenarios.forEach(function addScenario(scenario, index) {
      var extra = Math.round((scenario.runtimeHours - baseline) * 10) / 10;
      lines.push((index + 1) + ". " + scenario.name + " | " + scenario.targetWatts + " W | " + scenario.runtime + (extra > 0 ? " | +" + extra + " saa" : ""));
      lines.push("   Hatua: " + scenario.action + ".");
    });
    lines.push("");
    lines.push("Kila mstari umetumia formula ileile ya betri, DoD na ufanisi wa inverter kwa mzigo tofauti.");
    lines.push("Makadirio hayahesabu msukumo wa kuanzia, idle draw, umri wa betri, joto, nyaya wala mizigo inayowaka na kuzima.");
    lines.push("Faragha: taarifa haijahifadhiwa wala kutumwa; nakili tu ukichagua.");
    return lines.join("\n");
  }

  function wireCopy(buttonId, outputId, statusId, getValue) {
    var button = byId(buttonId);
    if (!button) return;
    button.addEventListener("click", function copyCurrent() {
      var value = getValue();
      if (!value) return;
      copyText(value).then(function copied() {
        setText(statusId, "Muhtasari umenakiliwa.");
      }).catch(function blocked() {
        setText(statusId, "Kivinjari kimezuia kunakili. Muhtasari kamili bado unaonekana hapa.");
      });
    });
  }

  function initSolar() {
    var engine = root.AfroTools && root.AfroTools.SolarSizingEngine;
    var rows = PRESETS.map(function clone(row) { return Object.assign({}, row); });
    var latest = "";

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, function replace(ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
      });
    }

    function invalidate(message) {
      latest = "";
      showResults(false);
      clearValidationStatus();
      byId("copyResult").disabled = true;
      setText("briefOutput", message || "Taarifa zimebadilika. Hesabu tena ili kupata muhtasari mpya.");
      setText("copyStatus", "Matokeo ya awali yamepitwa na wakati na hayawezi kunakiliwa.");
    }

    function renderRows() {
      var list = byId("appList");
      list.innerHTML = "";
      rows.forEach(function renderRow(row, index) {
        var div = root.document.createElement("div");
        div.className = "appliance-row";
        div.innerHTML =
          '<input class="en-input appliance-name" aria-label="Jina la kifaa" type="text" value="' + escapeHtml(row.name) + '" data-field="name" data-index="' + index + '">' +
          '<input class="en-input" aria-label="Watt za kifaa" type="number" min="0" max="1000000" step="1" inputmode="decimal" required value="' + row.watts + '" data-field="watts" data-index="' + index + '">' +
          '<input class="en-input" aria-label="Saa za matumizi kwa siku" type="number" min="0.5" max="24" step="0.5" inputmode="decimal" required value="' + row.hours + '" data-field="hours" data-index="' + index + '">' +
          '<input class="en-input" aria-label="Idadi ya vifaa" type="number" min="1" max="1000" step="1" inputmode="numeric" required value="' + row.qty + '" data-field="qty" data-index="' + index + '">' +
          '<button class="rm-btn" type="button" aria-label="Ondoa ' + escapeHtml(row.name || "kifaa") + '" data-remove="' + index + '">×</button>';
        list.appendChild(div);
      });
      list.querySelectorAll("[data-field]").forEach(function wire(field) {
        field.addEventListener("input", function update() {
          var index = Number(field.dataset.index);
          rows[index][field.dataset.field] = field.dataset.field === "name" ? field.value : numberFrom(field.value);
          invalidate();
        });
      });
      list.querySelectorAll("[data-remove]").forEach(function wire(button) {
        button.addEventListener("click", function remove() {
          rows.splice(Number(button.dataset.remove), 1);
          renderRows();
          invalidate();
        });
      });
    }

    byId("addBtn").addEventListener("click", function add() {
      rows.push({ name: "", watts: 0, hours: 1, qty: 1 });
      renderRows();
      invalidate();
      var names = byId("appList").querySelectorAll(".appliance-name");
      if (names.length) names[names.length - 1].focus();
    });
    byId("countrySelect").addEventListener("change", invalidate);
    byId("calcBtn").addEventListener("click", function calculate() {
      setStatus("");
      var invalidField = firstInvalidField(Array.from(byId("appList").querySelectorAll("input[type=number]")));
      if (invalidField) {
        invalidate("Thamani moja ya kifaa haikubaliki. Rekebisha sehemu iliyoangaziwa.");
        reportInvalidField(
          invalidField,
          invalidField.dataset.field === "hours"
            ? "Saa za matumizi lazima ziwe kati ya 0.5 na 24 kwa hatua za 0.5."
            : invalidField.dataset.field === "qty"
              ? "Idadi ya vifaa lazima iwe namba kamili kati ya 1 na 1,000."
              : "Watt lazima iwe namba kamili kati ya 0 na 1,000,000.",
        );
        return;
      }
      var appliances = rows.filter(function usable(row) { return row.watts > 0 && row.hours > 0 && row.qty > 0; });
      if (!appliances.length) {
        invalidate("Ongeza angalau kifaa kimoja chenye watt na saa halali.");
        setStatus("Ongeza angalau kifaa kimoja chenye watt na saa za matumizi.", "error");
        return;
      }
      var input = { appliances: appliances, country: byId("countrySelect").value };
      var result = engine.calculate(input);
      if (result.error) {
        invalidate("Taarifa hazijakamilika. Rekebisha kisha uhesabu tena.");
        setStatus("Weka watt, saa na idadi halali kwa kifaa.", "error");
        return;
      }
      setText("rPanels", result.solarKW);
      setText("rBattery", "Betri: " + result.batteryKWh);
      setText("rPanelSpec", result.solarKW + " za paneli");
      setText("rBattSpec", result.batteryKWh + " / " + result.batteryAh);
      setText("rInvSpec", result.inverterKVA);
      setText("rPanelCost", result.breakdown.panels);
      setText("rBattCost", result.breakdown.batteries);
      setText("rInvCost", result.breakdown.inverter);
      setText("rInstCost", result.breakdown.installation);
      setText("rTotal", result.totalCostUSD + (result.totalCostLocal !== result.totalCostUSD ? " / " + result.totalCostLocal : ""));
      renderObservations(solarObservations(input, result));
      latest = solarBrief(input, result);
      setText("briefOutput", latest);
      byId("copyResult").disabled = false;
      setText("copyStatus", "Muhtasari uko tayari. Hakuna kilichohifadhiwa, kutumwa au kunakiliwa kiotomatiki.");
      showResults(true);
      scrollToResults();
    });
    wireCopy("copyResult", "briefOutput", "copyStatus", function value() { return latest; });
    renderRows();
  }

  function initBattery() {
    var engine = root.AfroTools && root.AfroTools.BatterySizingEngine;
    var latest = "";
    var ids = ["loadWatts", "backupHours", "batteryType", "systemVoltage", "countrySelect"];

    function inputValues() {
      return {
        loadWatts: numberFrom(byId("loadWatts").value),
        backupHours: numberFrom(byId("backupHours").value),
        batteryType: byId("batteryType").value,
        systemVoltage: byId("systemVoltage").value,
        country: byId("countrySelect").value
      };
    }

    function withType(input, type) {
      return Object.assign({}, input, { batteryType: type });
    }

    function invalidate() {
      latest = "";
      showResults(false);
      clearValidationStatus();
      byId("copyResult").disabled = true;
      setText("copyStatus", "Taarifa zimebadilika. Ulinganisho wa awali umepitwa na wakati.");
      setText("briefOutput", "Hesabu tena ili kupata ulinganisho mpya.");
    }

    function renderCard(prefix, result, selected) {
      setText(prefix + "Capacity", result.totalCapacityKWh + " / " + result.totalAh);
      setText(prefix + "Config", formatConfig(result.batteryConfig));
      setText(prefix + "Dod", result.dod);
      setText(prefix + "Cycles", cycleLabel(result.cycleLife));
      setText(prefix + "Cost", result.totalCostUSD + " / " + result.totalCostLocal);
      byId(prefix + "Card").classList.toggle("is-selected", selected);
      setText(prefix + "Selected", selected ? "Chaguo la matokeo makuu" : "");
    }

    ids.forEach(function wire(id) {
      byId(id).addEventListener("input", invalidate);
      byId(id).addEventListener("change", invalidate);
    });
    byId("calcBtn").addEventListener("click", function calculate() {
      setStatus("");
      var invalidField = firstInvalidField([byId("loadWatts"), byId("backupHours")]);
      if (invalidField) {
        invalidate();
        reportInvalidField(
          invalidField,
          invalidField.id === "loadWatts"
            ? "Weka mzigo kwa namba kamili kati ya 1 na 1,000,000 W."
            : "Weka muda kati ya saa 0.5 na 168 kwa hatua za 0.5.",
        );
        return;
      }
      var input = inputValues();
      var lithium = engine.calculate(withType(input, "lithium"));
      if (lithium.error) {
        invalidate();
        setStatus(input.loadWatts <= 0 ? "Weka mzigo wa jumla ulio zaidi ya sifuri." : "Weka muda wa akiba ulio zaidi ya sifuri.", "error");
        return;
      }
      var lead = engine.calculate(withType(input, "lead"));
      var selected = input.batteryType === "lead" ? lead : lithium;
      setText("rAh", selected.totalAh);
      setText("rKwh", "Uwezo: " + selected.totalCapacityKWh);
      setText("rUsable", selected.requiredKWh);
      setText("rTotal", selected.totalCapacityKWh);
      setText("rConfig", formatConfig(selected.batteryConfig));
      setText("rType", selected.batteryType);
      setText("rInverter", selected.inverterKVA);
      setText("rDOD", selected.dod);
      setText("rCycles", cycleLabel(selected.cycleLife));
      setText("rBattCost", selected.batteryCostUSD);
      setText("rTotalCost", selected.totalCostUSD + " / " + selected.totalCostLocal);
      renderCard("lithium", lithium, input.batteryType === "lithium");
      renderCard("lead", lead, input.batteryType === "lead");
      setText("chemDecision", chemistryDecision(lithium, lead));
      renderObservations(batteryObservations(input, selected));
      latest = batteryBrief(input, lithium, lead);
      setText("briefOutput", latest);
      byId("copyResult").disabled = false;
      setText("copyStatus", "Ulinganisho uko tayari. Hakuna kilichohifadhiwa, kutumwa au kunakiliwa kiotomatiki.");
      showResults(true);
      scrollToResults();
    });
    wireCopy("copyResult", "briefOutput", "copyStatus", function value() { return latest; });
  }

  function initBackup() {
    var engine = root.AfroTools && root.AfroTools.BackupDurationEngine;
    var latest = "";
    var ids = ["batteryKWh", "batteryAh", "systemVoltage", "loadWatts", "batteryType"];

    function inputValues() {
      return {
        batteryKWh: numberFrom(byId("batteryKWh").value),
        batteryAh: numberFrom(byId("batteryAh").value),
        systemVoltage: byId("systemVoltage").value,
        loadWatts: numberFrom(byId("loadWatts").value),
        batteryType: byId("batteryType").value
      };
    }

    function invalidate() {
      latest = "";
      showResults(false);
      clearValidationStatus();
      byId("copyResult").disabled = true;
      setText("copyStatus", "Taarifa zimebadilika. Mpango wa awali umepitwa na wakati.");
      setText("briefOutput", "Hesabu tena ili kupata mpango mpya.");
    }

    ids.forEach(function wire(id) {
      byId(id).addEventListener("input", invalidate);
      byId(id).addEventListener("change", invalidate);
    });
    byId("calcBtn").addEventListener("click", function calculate() {
      setStatus("");
      var invalidField = firstInvalidField([
        byId("batteryKWh"),
        byId("batteryAh"),
        byId("loadWatts")
      ]);
      if (invalidField) {
        invalidate();
        reportInvalidField(
          invalidField,
          invalidField.id === "loadWatts"
            ? "Weka mzigo kwa namba kamili kati ya 1 na 1,000,000 W."
            : "Weka uwezo wa betri ndani ya mpaka unaoonyeshwa.",
        );
        return;
      }
      var input = inputValues();
      var result = engine.calculate(input);
      if (result.error) {
        invalidate();
        setStatus((input.batteryKWh <= 0 && input.batteryAh <= 0)
          ? "Weka uwezo wa betri kwa kWh, au Ah pamoja na voltage."
          : "Weka mzigo wa jumla ulio zaidi ya sifuri.", "error");
        return;
      }
      setText("rHours", hoursLabel(result.backupHours));
      setText("rCritical", "Vifaa muhimu pekee: " + hoursLabel(result.criticalLoadHours));
      setText("rUsable", result.usableKWh);
      setText("rTotal", result.batteryKWh);
      setText("rAh", result.batteryAh);
      setText("rVolt", result.systemVoltage);
      setText("rDOD", result.dod);
      setText("rType", result.batteryType);
      var scenarios = scenarioRows(input, engine);
      var body = byId("runtimeBody");
      body.replaceChildren();
      scenarios.forEach(function renderScenario(scenario) {
        var row = root.document.createElement("tr");
        [scenario.name, scenario.targetWatts + " W", scenario.runtime, scenario.action].forEach(function renderCell(value) {
          var cell = root.document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      renderObservations(backupObservations(input, result));
      latest = backupBrief(input, result, scenarios);
      setText("briefOutput", latest);
      byId("copyResult").disabled = false;
      setText("copyStatus", "Mpango uko tayari. Hakuna kilichohifadhiwa, kutumwa au kunakiliwa kiotomatiki.");
      showResults(true);
      scrollToResults();
    });
    wireCopy("copyResult", "briefOutput", "copyStatus", function value() { return latest; });
  }

  function init() {
    if (!root.document || !root.document.body) return;
    var app = root.document.body.dataset.swEnergySizingApp;
    if (app === "solar") initSolar();
    else if (app === "battery") initBattery();
    else if (app === "backup") initBackup();
  }

  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return {
    PRESETS: PRESETS,
    LOAD_SCENARIOS: LOAD_SCENARIOS,
    SOLAR_COST_ASSUMPTIONS: SOLAR_COST_ASSUMPTIONS,
    numberFrom: numberFrom,
    countryName: countryName,
    formatConfig: formatConfig,
    cycleLabel: cycleLabel,
    solarObservations: solarObservations,
    batteryObservations: batteryObservations,
    backupObservations: backupObservations,
    solarBrief: solarBrief,
    batteryBrief: batteryBrief,
    backupBrief: backupBrief,
    chemistryDecision: chemistryDecision,
    scenarioRows: scenarioRows
  };
});
