"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const rootPath = path.resolve(__dirname, "..");
const source = file => fs.readFileSync(path.join(rootPath, file), "utf8");
const contract = require("../scripts/lib/sw-energy-remaining-contract");
const app = contract.SW_ENERGY_REMAINING_APPS.find(item => item.id === "solar-vs-generator");
const defaults = { country: "TZ", dailyHours: 6, genKVA: 5, dailyKWh: 20 };

function engineContext() {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source("data/energy/sw-energy-planning-snapshot.js"), context);
  vm.runInContext(source("engines/src/solar-vs-generator-engine.js"), context);
  return context;
}

test("preset stays usable and the original engine API is unchanged", () => {
  const context = engineContext(), engine = context.AfroTools.SolarVsGeneratorEngine;
  const old = engine.calculate(defaults, "TZ"), result = engine.calculateComparison(defaults, "TZ");
  assert.ok(Math.abs(result.breakdown.genTotal - 38384300) < 0.001);
  assert.equal(result.breakdown.solarTotal, 13455000);
  assert.match(old.gen5yrTotal, /45,671,160/);
  assert.equal(old.paybackYrs, "1.6 yrs");
  assert.equal(result.paybackYrs, "1.4 miaka", "comparison uses the same daily demand, extra capital and net annual operating savings");
  assert.equal(result.assumptionBasis.fuelPrice, "planning_default");
});

test("each entered cost and operating assumption participates in an independently computed total", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  const input = { ...defaults, genKVA: 6.25, dailyHours: 4, operatingDays: 200, fuelPrice: 3200, genLitresHour: 1.5, genCapex: 2000000, solarCapex: 12000000, genAnnualMaintenance: 400000, solarAnnualMaintenance: 100000, solarReplacement5yr: 2000000 };
  const result = engine.calculateComparison(input, "TZ"), b = result.breakdown;
  assert.equal(b.annualLitres, 1200);
  assert.equal(b.annualFuel, 3840000);
  assert.equal(b.genTotal, 23200000);
  assert.equal(b.solarTotal, 14500000);
  assert.equal(b.savings5yr, 8700000);
  assert.equal(b.annualSaving, 3740000);
  assert.equal(result.paybackYears, 10000000 / 3740000);
  for (const field of app.comparisonFields) {
    const higher = engine.calculateComparison({ ...input, [field.name]: input[field.name] + 1 }, "TZ");
    assert.notEqual(higher.breakdown.savings5yr, b.savings5yr, field.name + " must affect the result");
  }
});

test("default fuel follows daily energy demand, not unused generator nameplate capacity", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  const low = engine.calculateComparison({ ...defaults, dailyKWh: 10 }, "TZ");
  const normal = engine.calculateComparison(defaults, "TZ");
  const largerNameplate = engine.calculateComparison({ ...defaults, genKVA: 10 }, "TZ");
  assert.ok(Math.abs(normal.assumptions.genLitresHour - 20 / 6 * 0.28) < 1e-12);
  assert.ok(Math.abs(low.breakdown.annualLitres * 2 - normal.breakdown.annualLitres) < 1e-9);
  assert.ok(Math.abs(normal.breakdown.annualLitres - 20 * 0.28 * 365) < 1e-9);
  assert.equal(largerNameplate.breakdown.annualLitres, normal.breakdown.annualLitres);
  assert.ok(low.breakdown.genTotal < normal.breakdown.genTotal);
  const longerRuntime = engine.calculateComparison({ ...defaults, dailyHours: 12 }, "TZ");
  assert.equal(longerRuntime.breakdown.annualLitres, normal.breakdown.annualLitres);
  const measured = engine.calculateComparison({ ...defaults, dailyKWh: 10, genLitresHour: 1.5 }, "TZ");
  assert.equal(measured.assumptions.genLitresHour, 1.5);
  assert.equal(measured.breakdown.annualLitres, 1.5 * 6 * 365);
  const inferredEnergy = engine.calculateComparison({ ...defaults, dailyKWh: 0 }, "TZ");
  assert.equal(inferredEnergy.assumptions.dailyKWh, 24);
  assert.ok(Math.abs(inferredEnergy.assumptions.genLitresHour - 1.12) < 1e-12);
});

test("capacity relationship is explicit and incompatible average demand gets a useful correction", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  const normal = engine.calculateComparison(defaults, "TZ");
  assert.equal(normal.assumptions.generatorKW, 4);
  assert.equal(normal.assumptions.averageLoadKW, 20 / 6);
  const tooSmall = engine.calculateComparison({ ...defaults, dailyKWh: 30 }, "TZ");
  assert.equal(tooSmall.error, "capacity");
  assert.equal(tooSmall.averageLoadKW, 5);
  assert.equal(tooSmall.generatorKW, 4);
  const measuredTooSmall = engine.calculateComparison({ ...defaults, dailyKWh: 30, genLitresHour: 2 }, "TZ");
  assert.equal(measuredTooSmall.error, "capacity", "a fuel-rate override does not make an insufficient capacity assumption consistent");
});

test("zero capital and maintenance are valid; energy-only input never means free generator fuel", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  const free = engine.calculateComparison({ ...defaults, genCapex: 0, solarCapex: 0, genAnnualMaintenance: 0, solarAnnualMaintenance: 0, solarReplacement5yr: 0 }, "TZ");
  assert.equal(free.breakdown.genCapital, 0);
  assert.equal(free.breakdown.solarTotal, 0);
  const energyOnly = engine.calculateComparison({ ...defaults, genKVA: 0 }, "TZ");
  assert.ok(energyOnly.breakdown.annualFuel > 0);
  assert.ok(energyOnly.assumptions.genKVA > 0);
});

test("invalid numeric and country inputs do not produce a cost recommendation", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  for (const field of app.comparisonFields) for (const value of [-1, Infinity, NaN, "bad", "3bad", {}, true]) {
    assert.ok(engine.calculateComparison({ ...defaults, [field.name]: value }, "TZ").error, field.name + ": " + value);
  }
  assert.ok(engine.calculateComparison({ ...defaults, operatingDays: 367 }, "TZ").error);
  assert.ok(engine.calculateComparison({ ...defaults, genLitresHour: 0 }, "TZ").error);
  assert.ok(engine.calculateComparison({ ...defaults, dailyHours: 25 }, "TZ").error);
  assert.ok(engine.calculateComparison({ ...defaults, dailyKWh: 0, genKVA: 0 }, "TZ").error);
  assert.ok(engine.calculateComparison(defaults, "UNKNOWN").error);
  const noSaving = engine.calculateComparison({ ...defaults, fuelPrice: 0, genAnnualMaintenance: 0, solarAnnualMaintenance: 100 }, "TZ");
  assert.equal(noSaving.paybackYears, null);
  assert.equal(noSaving.paybackYrs, "Hakuna akiba ya mwaka");
});

function runtime() {
  class Element {
    constructor() { this.value = ""; this.dataset = {}; this.children = []; this.listeners = {}; this.textContent = ""; this.hidden = false; }
    appendChild(child) { this.children.push(child); return child; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    emit(name, event = {}) { return this.listeners[name] && this.listeners[name]({ target: this, preventDefault() {}, ...event }); }
    setAttribute(name, value) { this[name] = value; }
    scrollIntoView() {}
    remove() {}
    click() { if (this.download) downloads.push({ name: this.download, blob: blobs.get(this.href) }); }
  }
  const nodes = {}, fields = [], downloads = [], blobs = new Map();
  const node = name => nodes[name] || (nodes[name] = new Element());
  const form = node("energyForm"), country = node("country");
  country.name = "country"; country.type = "select"; country.required = true; fields.push(country);
  for (const item of [...app.fields, ...(app.comparisonFields || [])]) {
    const field = new Element(); Object.assign(field, item); field.type = item.type; field.value = String(item.value ?? ""); fields.push(field);
  }
  fields.namedItem = name => fields.find(field => field.name === name);
  form.elements = fields;
  form.checkValidity = () => fields.every(field => field.type !== "number" || (!field.required && field.value === "") || (field.value !== "" && Number.isFinite(Number(field.value)) && Number(field.value) >= field.min && (field.max == null || Number(field.value) <= field.max)));
  form.reportValidity = () => {};
  const config = { ...app, assumptionFields: (app.comparisonFields || []).map(({ name, label }) => ({ name, label })) };
  const configNode = { textContent: JSON.stringify(config) };
  const buttons = ["json", "csv", "txt", "pdf"].map(format => { const button = new Element(); button.dataset.export = format; return button; });
  const context = engineContext();
  context.document = {
    getElementById: node,
    querySelector: selector => selector.includes("data-sw-energy-config") ? configNode : null,
    querySelectorAll: () => buttons,
    createElement: () => new Element(), body: new Element(), documentElement: new Element()
  };
  context.Blob = Blob;
  context.URL = { createObjectURL(blob) { const url = "blob:" + blobs.size; blobs.set(url, blob); return url; }, revokeObjectURL() {} };
  context.setTimeout = callback => { /* Downloads remain inspectable; reset is tested explicitly below. */ context.pendingTimer = callback; };
  context.FileReader = class { readAsText(file) { this.result = file.content; this.onload(); } };
  vm.runInContext(source("assets/js/pages/sw-energy-remaining-parity.js"), context);
  return {
    context, nodes, fields, downloads,
    set(name, value) { const field = fields.namedItem(name); field.value = String(value); form.emit("input", { target: field }); },
    calculate() { form.emit("submit"); },
    export(format) { buttons.find(button => button.dataset.export === format).emit("click"); return downloads.at(-1); },
    import(record) { node("importJson").emit("change", { target: { files: [{ content: JSON.stringify(record) }] } }); },
    country(code) { country.value = code; country.emit("change"); }
  };
}

test("actual runtime exposes editable prices, recalculates costs and shows the breakdown", async () => {
  const page = runtime();
  assert.equal(page.fields.namedItem("fuelPrice").value, "3100");
  assert.match(page.nodes.solarCurrency.textContent, /TZS/);
  page.calculate();
  assert.equal(page.nodes.results.hidden, false);
  const original = JSON.parse(await page.export("json").blob.text());
  page.set("fuelPrice", 4000); page.calculate();
  const changed = JSON.parse(await page.export("json").blob.text());
  assert.ok(changed.breakdown.genTotal > original.breakdown.genTotal);
  assert.equal(changed.input.fuelPrice, 4000);
  assert.equal(changed.assumptionBasis.fuelPrice, "user_entered");
  assert.equal(page.nodes.comparisonBreakdown.children.length, 11);
  assert.match(page.nodes.resultBoundary.textContent, /thamani zilizo kwenye fomu/);
});

test("runtime demand changes update only estimated fuel and explain incompatible capacity", async () => {
  const page = runtime(); page.calculate();
  const original = JSON.parse(await page.export("json").blob.text());
  page.import(original);
  const reopened = JSON.parse(await page.export("json").blob.text());
  assert.deepEqual(reopened.input, original.input, "default fuel roundtrip preserves values and its estimated mode");
  page.set("dailyKWh", 10); page.calculate();
  const reduced = JSON.parse(await page.export("json").blob.text());
  assert.ok(Math.abs(reduced.breakdown.annualLitres * 2 - original.breakdown.annualLitres) < 1e-8);
  page.set("genLitresHour", 1.5); page.set("dailyKWh", 20); page.calculate();
  const measured = JSON.parse(await page.export("json").blob.text());
  assert.equal(measured.input.genLitresHour, 1.5);
  assert.equal(measured.breakdown.annualLitres, 3285);
  page.set("dailyKWh", 30); page.calculate();
  assert.equal(page.nodes.results.hidden, true);
  assert.match(page.nodes.formStatus.textContent, /5\.00 kW.*4\.00 kW.*0\.8 × kVA/);
  page.country("KE");
  assert.equal(page.fields.namedItem("fuelPrice").value, "", "invalid capacity must not preserve prices from the previous currency");
  assert.match(page.nodes.solarCurrency.textContent, /KES/);
  page.set("dailyKWh", 20); page.calculate();
  assert.equal(page.nodes.results.hidden, false);
  assert.notEqual(page.fields.namedItem("genLitresHour").value, "1.5", "country reset replaces old measured assumptions");
});

test("five-year capital, maintenance and replacement are counted once and finite at input boundaries", () => {
  const engine = engineContext().AfroTools.SolarVsGeneratorEngine;
  const input = { ...defaults, fuelPrice: 0, genCapex: 100, solarCapex: 200, genAnnualMaintenance: 10, solarAnnualMaintenance: 20, solarReplacement5yr: 30 };
  const result = engine.calculateComparison(input, "TZ");
  assert.equal(result.breakdown.genTotal, 150);
  assert.equal(result.breakdown.solarTotal, 330);
  assert.equal(result.breakdown.savings5yr, -180);
  assert.equal(result.paybackYears, null);
  for (const operatingDays of [1, 366]) for (const genLitresHour of [0.000001, 100000]) {
    const extreme = engine.calculateComparison({ ...input, operatingDays, genLitresHour, fuelPrice: 1e15 }, "TZ");
    assert.ok(!extreme.error);
    assert.ok(Number.isFinite(extreme.breakdown.genTotal) && extreme.breakdown.genTotal >= 0);
    assert.ok(Number.isFinite(extreme.breakdown.solarTotal) && extreme.breakdown.solarTotal >= 0);
  }
});

test("JSON reimport preserves every chosen assumption and all export formats include them", async () => {
  const page = runtime();
  const values = { fuelPrice: 3200, genLitresHour: 1.5, genCapex: 2000000, solarCapex: 12000000, genAnnualMaintenance: 400000, solarAnnualMaintenance: 100000, operatingDays: 200, solarReplacement5yr: 2000000 };
  Object.entries(values).forEach(([key, value]) => page.set(key, value)); page.calculate();
  const first = JSON.parse(await page.export("json").blob.text());
  page.set("fuelPrice", 9999); page.import(first);
  const reopened = JSON.parse(await page.export("json").blob.text());
  assert.deepEqual(reopened.input, first.input);
  assert.deepEqual(reopened.breakdown, first.breakdown);
  for (const [key, value] of Object.entries(values)) assert.equal(Number(page.fields.namedItem(key).value), value);
  for (const format of ["txt", "csv", "pdf"]) {
    const text = await page.export(format).blob.text();
    assert.match(text, /3200/);
    assert.match(text, /12000000/);
    assert.match(text, /2000000/);
    assert.match(text, /1\.5/);
    if (format === "pdf" && process.env.SW_SOLAR_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.SW_SOLAR_EVIDENCE_DIR, "comparison-report.pdf"), Buffer.from(await page.downloads.at(-1).blob.arrayBuffer()));
  }
});

test("country switch resets monetary assumptions explicitly and bad imports preserve current values", async () => {
  const page = runtime(); page.set("fuelPrice", 4000); page.calculate();
  page.country("KE");
  assert.match(page.nodes.solarCurrency.textContent, /KES/);
  assert.notEqual(page.fields.namedItem("fuelPrice").value, "4000");
  assert.match(page.nodes.formStatus.textContent, /zimewekwa upya/);
  page.calculate();
  const current = JSON.parse(await page.export("json").blob.text());
  page.import({ ...current, input: { ...current.input, operatingDays: 999 } });
  assert.equal(Number(page.fields.namedItem("operatingDays").value), current.input.operatingDays);
  assert.match(page.nodes.exportStatus.textContent, /haijabadilishwa/);
  page.import({ ...current, input: { ...current.input, country: "constructor" } });
  assert.equal(page.fields.namedItem("country").value, "KE");
  page.nodes.solarDefaults.emit("click");
  assert.equal(page.fields.namedItem("fuelPrice").dataset.basis, "planning_default");
});

test("official city fuel reference is optional, dated, exportable and limited to Tanzania", async () => {
  const page = runtime();
  assert.equal(page.fields.namedItem("fuelPrice").value, "3100", "do not silently use a city cap for a whole country");
  assert.equal(page.nodes.solarFuelReference.hidden, false);
  page.nodes.useSolarFuelReference.emit("click"); page.calculate();
  assert.equal(page.fields.namedItem("fuelPrice").value, "4128");
  const record = JSON.parse(await page.export("json").blob.text());
  assert.equal(record.assumptionBasis.fuelPrice, "official_reference");
  assert.equal(record.sourceContext.fuelReference.location, "Dar es Salaam");
  assert.equal(record.sourceContext.fuelReference.effectiveDate, "2026-11-04");
  assert.match(record.sourceContext.fuelReference.url, /^https:\/\/www\.ewura\.go\.tz\//);
  page.import(record);
  const reopened = JSON.parse(await page.export("json").blob.text());
  assert.deepEqual(reopened.sourceContext.fuelReference, record.sourceContext.fuelReference);
  page.country("KE");
  assert.equal(page.nodes.solarFuelReference.hidden, true);
  const kenya = page.fields.namedItem("fuelPrice").value;
  page.nodes.useSolarFuelReference.emit("click");
  assert.equal(page.fields.namedItem("fuelPrice").value, kenya);
});

test("maintained template exposes the controls, their labels and the official dated context", () => {
  const script = source("scripts/build-sw-energy-remaining-parity.js").split("let changed = 0;")[0];
  const module = { exports: {} };
  vm.runInNewContext(script + "\nmodule.exports={page};", {
    module, __dirname: path.join(rootPath, "scripts"), process: { argv: [] },
    require(name) {
      if (name === "./lib/sw-energy-remaining-contract") return contract;
      if (name.startsWith("node:")) return require(name);
      return {};
    }
  });
  const html = module.exports.page(app);
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], "generated page IDs must identify one actual control or section");
  for (const id of ["solarFuelReference", "useSolarFuelReference", "solarDefaults", "comparisonBreakdown"]) {
    assert.equal(ids.filter(value => value === id).length, 1, id + " must occur exactly once");
  }
  assert.match(html, /Ulinganisho wa gharama za miaka 5/);
  assert.doesNotMatch(html, /Uhakika mdogo · hakiki data/);
  const other = contract.SW_ENERGY_REMAINING_APPS.find(item => item.id === "solar-roi");
  assert.match(module.exports.page(other), /Uhakika mdogo · hakiki data/, "unrelated tool result label remains unchanged");
  for (const field of app.comparisonFields) {
    assert.match(html, new RegExp('name="' + field.name + '"'));
    assert.ok(html.includes(field.label));
  }
  assert.match(html, /id="comparisonBreakdown"/);
  assert.match(html, /TZS 4,128\/lita/);
  assert.match(html, /4 Novemba 2026/);
  assert.doesNotMatch(html, /Masoko 42 bado yana pengo/);
  assert.equal((html.match(/<form\b/g) || []).length, (html.match(/<\/form>/g) || []).length);
  assert.equal((html.match(/<div\b/g) || []).length, (html.match(/<\/div>/g) || []).length);
  if (process.env.SW_SOLAR_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.SW_SOLAR_EVIDENCE_DIR, "rendered-solar-page.html"), html);
});
