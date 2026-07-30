#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const OWNER = path.join(ROOT, "tools", "japa-calculator", "index.html");
const OUTPUT = path.join(ROOT, "engines", "src", "japa-engine.js");

function balancedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing English owner function ${name}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Unbalanced English owner function ${name}`);
}

function build() {
  const source = fs.readFileSync(OWNER, "utf8");
  const dbStart = source.indexOf("var DB={");
  const dbEnd = source.indexOf("\n};", dbStart);
  if (dbStart < 0 || dbEnd < 0) throw new Error("Missing English Japa owner database");
  const database = source.slice(dbStart, dbEnd + 3);
  const flight = balancedFunction(source, "flightEstimate");
  let calculate = balancedFunction(source, "calculate")
    .replace("function calculate(silent)", "function ownerCalculate()");
  const resultStart = calculate.indexOf("lastResult={");
  if (resultStart < 0) throw new Error("Missing English Japa structured result");
  calculate = calculate.slice(0, resultStart) +
    "return {items:items,o:o,d:d,pw:pw,oc:oc,dc:dc,dCity:dCityName,pax:pax,spouse:spouse,kids:kids,nKids:nKids};\n}";
  calculate = calculate.replace(
    "if(!pw){toast('? Please select a visa pathway');return;}",
    "if(!pw){return null;}"
  );

  const output = `(function installFrenchJapaFromEnglishOwner(window, document) {
  "use strict";
  ${database}
  var curPW = null;
  function element(id) { return document.getElementById(id); }
  function isOn(id) { var node = element(id); return !!(node && node.classList.contains("on")); }
  ${flight}
  ${calculate}
  function money(value) { return "$" + Math.round(value).toLocaleString(); }
  function pathway() {
    var destination = DB.dests[element("dCtry").value];
    var requested = document.querySelector("#pwGrid [data-owner-pathway].on");
    return requested && destination.pathways[requested.dataset.ownerPathway]
      ? requested.dataset.ownerPathway
      : Object.keys(destination.pathways)[0];
  }
  function renderPathways() {
    var destination = DB.dests[element("dCtry").value];
    var grid = element("pwGrid");
    var note = element("pwNote");
    var keys = Object.keys(destination.pathways);
    grid.innerHTML = keys.map(function (key, index) {
      var item = destination.pathways[key];
      return '<button type="button" class="pw' + (index === 0 ? ' on' : '') +
        '" data-owner-pathway="' + key + '"><strong>' + item.name +
        '</strong><span>' + item.time + '</span></button>';
    }).join("");
    grid.querySelectorAll("[data-owner-pathway]").forEach(function (button) {
      button.addEventListener("click", function () {
        grid.querySelectorAll("[data-owner-pathway]").forEach(function (item) { item.classList.remove("on"); });
        button.classList.add("on");
        curPW = button.dataset.ownerPathway;
        note.textContent = destination.pathways[curPW].note || destination.pathways[curPW].desc || "";
      });
    });
    curPW = keys[0];
    note.textContent = destination.pathways[curPW].note || destination.pathways[curPW].desc || "";
  }
  function render(result) {
    if (!result) return;
    var total = 0, low = 0, high = 0, local = 0;
    result.items.forEach(function (item) {
      total += item.usd; low += item.lo; high += item.hi; local += item.local;
    });
    element("totUsd").textContent = money(total) + " USD";
    element("totLocal").textContent = result.o.sym + Math.round(local).toLocaleString() + " " + result.o.cur;
    element("totSub").textContent = result.o.name + " -> " + result.d.name + " (" + result.dCity + ") - " + result.pw.name;
    element("rangeMin").textContent = "Bas: " + money(low);
    element("rangeMid").textContent = "Moyen: " + money(total);
    element("rangeMax").textContent = "Haut: " + money(high);
    var income = Number(element("monthlyIncome").value) || 0;
    var rate = Number(element("savingsRate").value) || 25;
    var saved = Number(element("alreadySaved").value) || 0;
    var monthlySavings = income * rate / 100;
    var remaining = Math.max(0, total - saved);
    var months = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    element("totBadges").innerHTML = "<span>" + result.pw.time + "</span><span>Reste: " + money(remaining) + "</span>";
    element("totSub").dataset.uaSavingsMonths = months == null ? "" : String(months);
    var savings = element("spBar");
    savings.style.display = "block";
    savings.innerHTML = '<div class="sp-bar-title">Progression d epargne</div><div id="spTxt">' +
      money(monthlySavings) + ' / mois</div><div id="spSub">' +
      (months == null ? 'Ajoutez le revenu mensuel.' : months + ' mois restants') + '</div>';
    var results = element("results");
    results.dataset.uaMonthlySavings = String(monthlySavings);
    results.dataset.uaOwnerTotal = String(total);
    results.dataset.uaOwnerLow = String(low);
    results.dataset.uaOwnerHigh = String(high);
    element("breakdown").innerHTML = result.items.map(function (item) {
      return '<div class="line-item" data-owner-category="' + item.cat + '"><span>' +
        item.name + '</span><strong>' + money(item.usd) + '</strong></div>';
    }).join("");
    results.classList.add("on");
    window.AfroToolsFrenchJapaPayload = {
      total: total, low: low, high: high, local: local,
      monthlySavings: monthlySavings, savingsMonths: months,
      items: result.items.map(function (item) {
        return { name: item.name, category: item.cat, usd: item.usd, low: item.lo, high: item.hi, local: item.local };
      })
    };
  }
  window.updOrigin = function () {
    var origin = DB.origins[element("oCtry").value];
    element("oCity").innerHTML = origin.cities.map(function (city) { return "<option>" + city + "</option>"; }).join("");
  };
  window.updDest = function () {
    var destination = DB.dests[element("dCtry").value];
    element("dCity").innerHTML = destination.cities.map(function (city) { return "<option>" + city + "</option>"; }).join("");
    renderPathways();
  };
  window.recalcIfDone = function () {};
  window.calculate = function () {
    curPW = pathway();
    render(ownerCalculate());
  };
  document.addEventListener("DOMContentLoaded", function () {
    window.updOrigin();
    window.updDest();
  });
})(window, document);
`;
  writeFileSyncWithRetry(OUTPUT, output, "utf8");
  console.log(path.relative(ROOT, OUTPUT).replace(/\\\\/g, "/"));
}

if (require.main === module) build();

module.exports = { build };
