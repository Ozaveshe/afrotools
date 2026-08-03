"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const builder = require("../scripts/build-sw-energy-sizing-parity.js");
const controller = require("../assets/js/pages/sw-energy-sizing-parity.js");
const acceptance = require("../data/audits/swahili-free-app-acceptance.json");
const routeMap = require("../assets/js/ai/swahili-route-map.generated.js");
const RECIPROCAL_LOCALE_FILES = {
  "solar-sizing": ["tools/solar-sizing/index.html", "fr/tools/dimensionnement-solaire/index.html"],
  "battery-sizing": ["tools/battery-sizing/index.html", "fr/tools/dimensionnement-batterie-onduleur/index.html"],
  "backup-duration": ["tools/backup-duration/index.html", "fr/tools/autonomie-secours/index.html"]
};

function engine(file, exportName, energyData) {
  const context = { window: {}, ENERGY_DATA: energyData };
  context.window.ENERGY_DATA = energyData;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  return context.window.AfroTools[exportName];
}

const sourceData = builder.loadEnergyData();
const solar = engine("engines/solar-sizing-engine.js", "SolarSizingEngine", sourceData);
const battery = engine("engines/battery-sizing-engine.js", "BatterySizingEngine", sourceData);
const backup = engine("engines/backup-duration-engine.js", "BackupDurationEngine", sourceData);
const snapshotContext = {};
vm.createContext(snapshotContext);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, "data/energy/sw-energy-sizing-snapshot.js"), "utf8"),
  snapshotContext,
  { filename: "data/energy/sw-energy-sizing-snapshot.js" }
);
const snapshotData = snapshotContext.ENERGY_DATA;

test("the bounded family keeps exact English engine ownership and deterministic outputs", () => {
  const solarInput = {
    country: "KE",
    appliances: controller.PRESETS.map((row) => ({ ...row }))
  };
  const solarResult = solar.calculate(solarInput);
  assert.equal(solarResult.totalWatts, "311W");
  assert.equal(solarResult.dailyKWh, "4.08 kWh");
  assert.equal(solarResult.solarKW, "1.1 kW");
  assert.equal(solarResult.batteryKWh, "6.2 kWh");
  assert.equal(solarResult.inverterKVA, "0.5 kVA");
  const previousEnergyData = globalThis.ENERGY_DATA;
  globalThis.ENERGY_DATA = snapshotData;
  const solarExport = controller.solarBrief(solarInput, solarResult);
  assert.match(solarExport, /MUHTASARI WA UKUBWA/);
  assert.match(solarExport, /USD 300 kwa kW/);
  assert.match(solarExport, /USD 200 kwa kWh/);
  assert.match(solarExport, /USD 150 kwa kVA/);
  assert.match(solarExport, /Ufungaji: 20%/);
  assert.match(solarExport, /https:\/\/globalsolaratlas\.info\/map/);
  const zaExport = controller.solarBrief({ ...solarInput, country: "ZA" }, solar.calculate({ ...solarInput, country: "ZA" }));
  assert.match(zaExport, /Nchi: Afrika Kusini \(ZA\)/);
  assert.doesNotMatch(zaExport, /Nchi: South Africa/);

  const batteryInput = {
    country: "KE",
    loadWatts: 1500,
    backupHours: 8,
    batteryType: "lithium",
    systemVoltage: "24"
  };
  const lithium = battery.calculate(batteryInput);
  const lead = battery.calculate({ ...batteryInput, batteryType: "lead" });
  assert.equal(lithium.requiredKWh, "13.33 kWh");
  assert.equal(lithium.totalCapacityKWh, "15.7 kWh");
  assert.equal(lithium.inverterKVA, "2 kVA");
  assert.equal(lithium.batteryConfig, "2S × 2P (4 batteries)");
  assert.equal(lithium.batteryCostUSD, "$1,200");
  assert.equal(lithium.totalCostUSD, "$1,560");
  assert.equal(lead.totalCapacityKWh, "26.7 kWh");
  assert.equal(lead.batteryConfig, "2S × 3P (6 batteries)");
  assert.equal(lead.batteryCostUSD, "$600");
  assert.equal(lead.totalCostUSD, "$960");
  const batteryExport = controller.batteryBrief(batteryInput, lithium, lead);
  assert.match(batteryExport, /ULINGANISHO WA KEMIA/);
  assert.match(batteryExport, /https:\/\/data\.worldbank\.org\/indicator\/PA\.NUS\.FCRF/);
  assert.match(batteryExport, /USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V\/200 Ah/);
  assert.match(batteryExport, /USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V\/200 Ah/);
  assert.match(batteryExport, /USD 180 kwa kila kVA/);
  assert.match(batteryExport, /idadi nzima ya betri/i);
  assert.match(batteryExport, /nakala ya Machi 2026/);
  assert.match(batteryExport, /makadirio ya kupanga pekee/);
  assert.match(batteryExport, /injini ya Kiingereza ya AfroTools/);

  const backupInput = {
    batteryKWh: 5.12,
    batteryAh: 0,
    systemVoltage: "24",
    loadWatts: 800,
    batteryType: "lithium"
  };
  const backupResult = backup.calculate(backupInput);
  assert.equal(backupResult.backupHours, "4.9 hours");
  assert.equal(backupResult.criticalLoadHours, "12.2 hours (critical only)");
  const scenarios = controller.scenarioRows(backupInput, backup);
  assert.deepEqual(Array.from(scenarios, (row) => row.targetWatts), [800, 600, 400, 320, 200]);
  assert.match(controller.backupBrief(backupInput, backupResult, scenarios), /MPANGO WA MUDA WA AKIBA/);
  globalThis.ENERGY_DATA = previousEnergyData;
});

test("each native owner exposes metadata, artwork, source state, local-only runtime, and stale clearing hooks", () => {
  for (const app of builder.APPS) {
    const html = fs.readFileSync(path.join(ROOT, app.file), "utf8");
    assert.match(html, /lang="sw"/);
    assert.ok(html.includes(`https://afrotools.com${app.swahiliRoute}`));
    assert.ok(html.includes(`https://afrotools.com/${app.artwork}`));
    assert.ok(html.includes(`hreflang="en" href="https://afrotools.com${app.englishRoute}"`));
    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('aria-live="polite"'));
    assert.ok(html.includes('class="sw-source-links"'));
    assert.match(html, /href="https:\/\/[^"]+"/);
    assert.ok(html.includes("/data/energy/sw-energy-sizing-snapshot.js"));
    assert.ok(html.includes(`/${app.engine}`));
    assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|lazy-analytics|energy-tool-assistant|sw-energy-runtime-localizer|alert\(/);
    assert.ok(fs.existsSync(path.join(ROOT, app.artwork)));
    for (const reciprocalFile of RECIPROCAL_LOCALE_FILES[app.id]) {
      const reciprocalHtml = fs.readFileSync(path.join(ROOT, reciprocalFile), "utf8");
      assert.ok(
        reciprocalHtml.includes(`hreflang="sw" href="https://afrotools.com${app.swahiliRoute}"`),
        `${reciprocalFile} must reciprocate ${app.swahiliRoute}`
      );
    }
  }
  const controllerText = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-energy-sizing-parity.js"), "utf8");
  assert.match(controllerText, /function invalidate/);
  assert.match(controllerText, /showResults\(false\)/);
  assert.match(controllerText, /clearValidationStatus\(\)/);
  assert.match(controllerText, /checkValidity\(\)/);
  assert.match(controllerText, /reportValidity\(\)/);
  assert.match(controllerText, /max="24"/);
  assert.doesNotMatch(controllerText, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);

  assert.equal(snapshotData.lastUpdated, "2026-03");
  assert.equal(snapshotData.status, "planning_snapshot");
  assert.equal(snapshotData.confidence, "low_when_stale");
  assert.equal(snapshotData.network, "none");
  assert.equal(snapshotData.countries.ZA.nameSw, "Afrika Kusini");
  assert.equal(Object.keys(snapshotData.countries).length, Object.keys(builder.COUNTRY_NAMES_SW).length);
  assert.deepEqual(
    Array.from(snapshotData.sourceUrls, (source) => source.url),
    builder.SNAPSHOT_SOURCES.map((source) => source.url)
  );

  const batteryHtml = fs.readFileSync(path.join(ROOT, "sw/zana/ukubwa-wa-betri-na-inverter/index.html"), "utf8");
  assert.match(batteryHtml, /href="\/tools\/battery-sizing\/"/);
  assert.match(batteryHtml, /USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V\/200 Ah/);
  assert.match(batteryHtml, /USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V\/200 Ah/);
  assert.match(batteryHtml, /USD 180 kwa kila kVA/);
  assert.match(batteryHtml, /nakala ya Machi 2026/);
  assert.match(batteryHtml, /makadirio ya kupanga pekee/);

  const css = fs.readFileSync(path.join(ROOT, "assets/css/sw-energy-sizing-parity.css"), "utf8");
  assert.match(css, /\.sw-source-links\s*\{[^}]*color:\s*#334155;/s);
  assert.match(css, /\.sw-source-links strong\s*\{[^}]*color:\s*#334155;/s);
  assert.match(css, /\.sw-form-status[^{]*\{\s*color:\s*#fca5a5;/s);
});

test("AI routing remains fail-closed pending coordinator acceptance", () => {
  for (const app of builder.APPS) {
    const entry = acceptance.entries.find((row) => row.englishId === app.id);
    assert.ok(!entry || entry.status !== "accepted", `${app.id} must remain outside the central acceptance ledger`);
    assert.equal(routeMap.ids[app.id], undefined, `${app.id} must remain outside the generated AI map`);
  }
});
