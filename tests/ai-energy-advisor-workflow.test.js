#!/usr/bin/env node

const assert = require("assert");
const advisor = require("../assets/js/ai/energy-advisor-workflow.js");

function includes(list, text) {
  return (list || []).some((item) => String(item).toLowerCase().includes(String(text).toLowerCase()));
}

const lagosShop = advisor.buildAdvisorPlan({}, {
  query: "Should I install solar for my shop in Lagos? I use a 5kVA generator 6 hours/day and my monthly bill is NGN 120000 with budget NGN 3000000"
});
assert.strictEqual(lagosShop.inputs.country, "Nigeria");
assert.strictEqual(lagosShop.inputs.city, "Lagos");
assert.strictEqual(lagosShop.inputs.userType, "shop");
assert.strictEqual(lagosShop.inputs.generatorSizeKva, 5);
assert.strictEqual(lagosShop.inputs.generatorHoursPerDay, 6);
assert.strictEqual(lagosShop.inputs.monthlyBill, 120000);
assert.ok(lagosShop.estimates.monthlyGeneratorCost > 0);
assert.ok(lagosShop.estimates.annualFuelExposure > lagosShop.estimates.monthlyGeneratorCost);
assert.ok(lagosShop.estimates.roughSystemKw >= 3);
assert.strictEqual(lagosShop.solarRoute, "/tools/solar-roi/nigeria/");
assert.strictEqual(lagosShop.generatorRoute, "/tools/fuel-tracker/#generator-cost");
assert.strictEqual(lagosShop.generatorFuelRoute, "/tools/generator-fuel/nigeria/");
assert.ok(includes(lagosShop.installerQuestions, "inverter"));
assert.ok(includes(lagosShop.risks, "Fuel"));
assert.ok(lagosShop.warning.includes("Planning estimate only"));
assert.strictEqual(lagosShop.solarPrefillInputs.mode, "solar");
assert.strictEqual(lagosShop.generatorPrefillInputs.mode, "generator");
assert.match(lagosShop.decisionBriefText, /SOLAR AND GENERATOR DECISION BRIEF/);
assert.match(advisor.renderEnergyPanel(lagosShop), /Solar and generator advisor/);
assert.match(advisor.renderEnergyPanel(lagosShop), /Open Solar ROI with prefill/);
assert.match(advisor.renderEnergyPanel(lagosShop), /Open AfroFuel with prefill/);
assert.match(advisor.renderEnergyPanel(lagosShop), /Open generator calculator/);
assert.doesNotMatch(advisor.renderEnergyPanel(lagosShop), /Â/);

const nairobiHome = advisor.buildAdvisorPlan({}, {
  query: "Nairobi home solar backup, electricity bill KES 8500, diesel generator 3 hours daily, 2kW load"
});
assert.strictEqual(nairobiHome.inputs.country, "Kenya");
assert.strictEqual(nairobiHome.inputs.city, "Nairobi");
assert.strictEqual(nairobiHome.inputs.userType, "household");
assert.strictEqual(nairobiHome.inputs.fuelType, "diesel");
assert.strictEqual(nairobiHome.inputs.loadSizeKw, 2);
assert.strictEqual(nairobiHome.countryData.currency, "KES");
assert.ok(nairobiHome.sourceState.tariff.label);

const accraOffice = advisor.buildAdvisorPlan({}, {
  query: "Check solar ROI for an office in Accra, Ghana. Monthly electricity bill GHS 4500, outage 4 hours, fuel spend GHS 1800"
});
assert.strictEqual(accraOffice.inputs.country, "Ghana");
assert.strictEqual(accraOffice.inputs.city, "Accra");
assert.strictEqual(accraOffice.inputs.userType, "office");
assert.strictEqual(accraOffice.inputs.monthlyGeneratorSpend, 1800);
assert.ok(accraOffice.estimates.systemCost > 0);
assert.ok(accraOffice.formatted.systemCost.includes("GHS"));

const johannesburgBusiness = advisor.buildAdvisorPlan({}, {
  query: "Should a Johannesburg small business install solar with R 9000 monthly bill, 8 hours outages and 4kW load?"
});
assert.strictEqual(johannesburgBusiness.inputs.country, "South Africa");
assert.strictEqual(johannesburgBusiness.inputs.city, "Johannesburg");
assert.strictEqual(johannesburgBusiness.inputs.userType, "small business");
assert.strictEqual(johannesburgBusiness.inputs.outageHours, 8);
assert.strictEqual(johannesburgBusiness.estimates.batteryProfile, "extended");
assert.strictEqual(johannesburgBusiness.solarRoute, "/tools/solar-roi/south-africa/");

const missing = advisor.buildAdvisorPlan({}, {
  query: "Should I install solar?"
});
assert.ok(missing.missingInputs.includes("country"));
assert.ok(missing.missingInputs.includes("userType"));
assert.ok(missing.missingInputs.includes("monthlyBill"));

console.log("AI energy advisor workflow validated: Lagos shop, Nairobi home, Accra office, Johannesburg small business, source state, exports, and cautious copy.");
