#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const COUNTRIES = [
  {code:"NG",name:"Nigeria",slug:"nigeria",flag:"🇳🇬",currency:"NGN"},
  {code:"KE",name:"Kenya",slug:"kenya",flag:"🇰🇪",currency:"KES"},
  {code:"ZA",name:"South Africa",slug:"south-africa",flag:"🇿🇦",currency:"ZAR"},
  {code:"GH",name:"Ghana",slug:"ghana",flag:"🇬🇭",currency:"GHS"},
  {code:"EG",name:"Egypt",slug:"egypt",flag:"🇪🇬",currency:"EGP"},
  {code:"ET",name:"Ethiopia",slug:"ethiopia",flag:"🇪🇹",currency:"ETB"},
  {code:"TZ",name:"Tanzania",slug:"tanzania",flag:"🇹🇿",currency:"TZS"},
  {code:"UG",name:"Uganda",slug:"uganda",flag:"🇺🇬",currency:"UGX"},
  {code:"RW",name:"Rwanda",slug:"rwanda",flag:"🇷🇼",currency:"RWF"},
  {code:"CI",name:"Côte d'Ivoire",slug:"cote-divoire",flag:"🇨🇮",currency:"XOF"},
  {code:"CM",name:"Cameroon",slug:"cameroon",flag:"🇨🇲",currency:"XAF"},
  {code:"SN",name:"Senegal",slug:"senegal",flag:"🇸🇳",currency:"XOF"},
  {code:"MA",name:"Morocco",slug:"morocco",flag:"🇲🇦",currency:"MAD"},
  {code:"TN",name:"Tunisia",slug:"tunisia",flag:"🇹🇳",currency:"TND"},
  {code:"AO",name:"Angola",slug:"angola",flag:"🇦🇴",currency:"AOA"}
];

const TOOLS = [
  {
    slug: "generator-fuel",
    toolNum: 130,
    hubTitle: "Generator Fuel Cost Calculator",
    metaDesc: "Calculate generator fuel cost in {{COUNTRY_NAME}}. See daily, monthly, and annual diesel or petrol running costs for your generator.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Generator Fuel Cost Calculator</em>",
    heroSub: "Calculate how much your generator costs to run per day, month, and year in {{COUNTRY_NAME}} using current fuel prices.",
    formIcon: "⛽",
    formHeading: "Calculate Generator Fuel Cost",
    engineVar: "GeneratorFuelEngine",
    engineFile: "generator-fuel-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="genKVA">Generator Size (kVA)</label><select class="en-select" id="genKVA"><option value="2">2 kVA (small home)</option><option value="5" selected>5 kVA (average home)</option><option value="10">10 kVA (large home)</option><option value="20">20 kVA (small office)</option><option value="50">50 kVA (medium business)</option><option value="100">100 kVA (large business)</option></select></div>
<div class="en-field"><label class="en-label" for="dailyHours">Daily Running Hours</label><input class="en-input" type="number" id="dailyHours" placeholder="e.g. 8" min="0.5" max="24" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="fuelType">Fuel Type</label><select class="en-select" id="fuelType"><option value="diesel">Diesel</option><option value="petrol">Petrol</option></select></div>`,
    calcInputs: `i.genKVA=sv("genKVA");i.dailyHours=fv("dailyHours");i.fuelType=sv("fuelType");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Monthly Fuel Cost</div><div class="en-res-amount" id="rMonthly">—</div><div class="en-res-sub" id="rDaily">Daily: —</div></div>
<table class="en-results-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
<tr><td>Fuel Price / Litre</td><td id="rFuelPrice">—</td></tr>
<tr><td>Consumption</td><td id="rLPH">—</td></tr>
<tr><td>Daily Litres</td><td id="rDailyL">—</td></tr>
<tr><td>Daily Cost</td><td id="rDailyCost">—</td></tr>
<tr><td>Monthly Cost</td><td id="rMonthlyCost">—</td></tr>
<tr><td>Annual Cost</td><td id="rAnnual">—</td></tr>
<tr><td>Total Annual (+ Maintenance)</td><td id="rTotalAnnual">—</td></tr>
<tr><td>Cost per kWh</td><td id="rCostKwh">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rMonthly").textContent=r.monthlyCost;
document.getElementById("rDaily").textContent="Daily: "+r.dailyCost;
document.getElementById("rFuelPrice").textContent=r.fuelPrice+"/L";
document.getElementById("rLPH").textContent=r.litrePerHour;
document.getElementById("rDailyL").textContent=r.dailyLitres;
document.getElementById("rDailyCost").textContent=r.dailyCost;
document.getElementById("rMonthlyCost").textContent=r.monthlyCost;
document.getElementById("rAnnual").textContent=r.annualCost;
document.getElementById("rTotalAnnual").textContent=r.totalAnnualCost;
document.getElementById("rCostKwh").textContent=r.costPerKWh+"/kWh";`,
    seoTitle: "Generator Fuel Cost",
    seoBody: "Running a generator in {{COUNTRY_NAME}} is expensive — fuel prices directly impact your monthly energy bill. Use this calculator to understand your true generator running cost and compare it against grid electricity and solar alternatives.",
    seoFact: "fuel prices and power infrastructure reliability"
  },
  {
    slug: "solar-vs-generator",
    toolNum: 131,
    hubTitle: "Solar vs Generator Comparison",
    metaDesc: "Compare solar vs generator costs over 5 years in {{COUNTRY_NAME}}. See which is cheaper, payback period, and long-term savings.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Solar vs Generator Comparison</em>",
    heroSub: "Compare the true 5-year cost of solar power vs a generator in {{COUNTRY_NAME}}, including fuel, maintenance, and installation.",
    formIcon: "⚖️",
    formHeading: "Compare Solar vs Generator",
    engineVar: "SolarVsGeneratorEngine",
    engineFile: "solar-vs-generator-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="dailyKWh">Daily Energy Need (kWh)</label><input class="en-input" type="number" id="dailyKWh" placeholder="e.g. 10" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="genKVA">Generator Size (kVA) — if you have one</label><select class="en-select" id="genKVA"><option value="2">2 kVA</option><option value="5" selected>5 kVA</option><option value="10">10 kVA</option><option value="20">20 kVA</option></select></div>
<div class="en-field"><label class="en-label" for="dailyHours">Daily Backup Hours Needed</label><input class="en-input" type="number" id="dailyHours" placeholder="e.g. 8" inputmode="numeric"></div>`,
    calcInputs: `i.dailyKWh=fv("dailyKWh");i.genKVA=sv("genKVA");i.dailyHours=fv("dailyHours");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Recommendation</div><div class="en-res-amount" id="rRec">—</div><div class="en-res-sub" id="rSaving">5-year saving: —</div></div>
<table class="en-results-table"><thead><tr><th>Option</th><th>5-Year Total Cost</th></tr></thead><tbody>
<tr><td>Generator (total)</td><td id="rGenTotal">—</td></tr>
<tr><td>Solar (total)</td><td id="rSolarTotal">—</td></tr>
<tr><td>Solar Savings (5yr)</td><td id="rSavings">—</td></tr>
<tr><td>Solar Payback</td><td id="rPayback">—</td></tr>
<tr><td>Solar Size Needed</td><td id="rSolarSize">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rRec").textContent=r.recommendation;
document.getElementById("rSaving").textContent="5-year saving: "+r.savings5yr;
document.getElementById("rGenTotal").textContent=r.gen5yrTotal;
document.getElementById("rSolarTotal").textContent=r.solar5yrTotal;
document.getElementById("rSavings").textContent=r.savings5yr;
document.getElementById("rPayback").textContent=r.paybackYrs;
document.getElementById("rSolarSize").textContent=r.solarSizeKW+"kW";`,
    seoTitle: "Solar vs Generator Comparison",
    seoBody: "Is solar or a generator the better investment in {{COUNTRY_NAME}}? Our comparison calculator factors in fuel prices, maintenance costs, and solar installation costs to give you a 5-year total cost comparison with a clear recommendation.",
    seoFact: "energy costs and solar adoption rates"
  },
  {
    slug: "electricity-bill-verify",
    toolNum: 133,
    hubTitle: "Electricity Bill Verifier",
    metaDesc: "Verify your electricity bill in {{COUNTRY_NAME}}. Enter your meter readings and check if you have been correctly billed using current tariff rates.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Electricity Bill Verifier</em>",
    heroSub: "Check if your electricity bill is correct in {{COUNTRY_NAME}}. Enter your meter readings and we'll calculate what you should have been charged.",
    formIcon: "🔍",
    formHeading: "Verify Your Electricity Bill",
    engineVar: "BillVerifierEngine",
    engineFile: "bill-verifier-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="prevReading">Previous Meter Reading (kWh)</label><input class="en-input" type="number" id="prevReading" placeholder="e.g. 12450" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="currReading">Current Meter Reading (kWh)</label><input class="en-input" type="number" id="currReading" placeholder="e.g. 12720" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="billedAmount">Amount Billed (optional)</label><input class="en-input" type="number" id="billedAmount" placeholder="e.g. 18500" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="customerType">Customer Type</label><select class="en-select" id="customerType"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>`,
    calcInputs: `i.prevReading=fv("prevReading");i.currReading=fv("currReading");i.billedAmount=fv("billedAmount");i.customerType=sv("customerType");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Bill Status</div><div class="en-res-amount" id="rStatus">—</div><div class="en-res-sub" id="rVariance">Variance: —</div></div>
<table class="en-results-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>
<tr><td>Units Consumed</td><td id="rUnits">—</td></tr>
<tr><td>Expected (Energy)</td><td id="rExpEnergy">—</td></tr>
<tr><td>Service Charge</td><td id="rService">—</td></tr>
<tr><td>Expected Total</td><td id="rExpTotal">—</td></tr>
<tr><td>Billed Amount</td><td id="rBilled">—</td></tr>
<tr><td>Variance</td><td id="rVarianceRow">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rStatus").textContent=r.status;
document.getElementById("rVariance").textContent="Variance: "+r.variancePct;
document.getElementById("rUnits").textContent=r.unitsConsumed;
document.getElementById("rExpEnergy").textContent=r.expectedEnergy;
document.getElementById("rService").textContent=r.serviceCharge;
document.getElementById("rExpTotal").textContent=r.expectedTotal;
document.getElementById("rBilled").textContent=r.billedAmount;
document.getElementById("rVarianceRow").textContent=r.variance+" ("+r.variancePct+")";`,
    seoTitle: "Electricity Bill Verifier",
    seoBody: "Many electricity customers in {{COUNTRY_NAME}} are overbilled through estimated readings or billing errors. Use our free bill verifier to cross-check your utility bill against official tariff rates using your actual meter readings.",
    seoFact: "electricity billing accuracy and consumer rights"
  },
  {
    slug: "water-bill",
    toolNum: 134,
    hubTitle: "Water Bill Calculator",
    metaDesc: "Calculate your water bill in {{COUNTRY_NAME}}. Enter your monthly usage and get an accurate water cost estimate based on local tariff rates.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Water Bill Calculator</em>",
    heroSub: "Calculate your monthly water bill in {{COUNTRY_NAME}} using local tariff rates. See cost per m³ and daily usage comparison.",
    formIcon: "💧",
    formHeading: "Calculate Your Water Bill",
    engineVar: "WaterBillEngine",
    engineFile: "water-bill-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="monthlyUsage">Monthly Usage (m³)</label><input class="en-input" type="number" id="monthlyUsage" placeholder="e.g. 15" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="householdSize">Household Size</label><input class="en-input" type="number" id="householdSize" placeholder="e.g. 4" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="customerType">Customer Type</label><select class="en-select" id="customerType"><option value="residential">Residential</option><option value="commercial">Commercial</option></select></div>`,
    calcInputs: `i.monthlyUsage=fv("monthlyUsage");i.householdSize=fv("householdSize");i.customerType=sv("customerType");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Monthly Water Bill</div><div class="en-res-amount" id="rBill">—</div><div class="en-res-sub" id="rRating">Efficiency: —</div></div>
<table class="en-results-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
<tr><td>Water Charge</td><td id="rCharge">—</td></tr>
<tr><td>Fixed Charge</td><td id="rFixed">—</td></tr>
<tr><td>Rate per m³</td><td id="rRate">—</td></tr>
<tr><td>Daily Usage</td><td id="rDaily">—</td></tr>
<tr><td>Per Person / Day</td><td id="rPerson">—</td></tr>
<tr><td>WHO Benchmark (m³/month)</td><td id="rWHO">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rBill").textContent=r.monthlyBill;
document.getElementById("rRating").textContent="Efficiency: "+r.efficiencyRating;
document.getElementById("rCharge").textContent=r.energyCharge;
document.getElementById("rFixed").textContent=r.fixedCharge;
document.getElementById("rRate").textContent=r.ratePerM3+"/m³";
document.getElementById("rDaily").textContent=r.dailyUsageLitres;
document.getElementById("rPerson").textContent=r.perPersonPerDay;
document.getElementById("rWHO").textContent=r.whoBenchmarkM3;`,
    seoTitle: "Water Bill Calculator",
    seoBody: "Calculate your exact water bill in {{COUNTRY_NAME}} using official tariff rates. Our calculator shows cost per m³, efficiency rating vs WHO benchmarks, and tips to reduce water consumption and cost.",
    seoFact: "water access rates and utility infrastructure"
  },
  {
    slug: "gas-lpg-cost",
    toolNum: 135,
    hubTitle: "Gas / LPG Cost Calculator",
    metaDesc: "Calculate LPG and cooking gas costs in {{COUNTRY_NAME}}. Find out how much you spend on cooking gas per month based on local cylinder prices.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Gas &amp; LPG Cost Calculator</em>",
    heroSub: "Calculate your monthly cooking gas (LPG) cost in {{COUNTRY_NAME}}. Compare with local cylinder prices and see annual spending.",
    formIcon: "🔥",
    formHeading: "Calculate Gas / LPG Cost",
    engineVar: "GasLPGEngine",
    engineFile: "gas-lpg-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="cylinderSize">Cylinder Size (kg)</label><select class="en-select" id="cylinderSize"><option value="3">3 kg (small)</option><option value="6">6 kg</option><option value="12.5" selected>12.5 kg (standard)</option><option value="25">25 kg (large)</option><option value="50">50 kg (commercial)</option></select></div>
<div class="en-field"><label class="en-label" for="monthlyRefills">Cylinders per Month</label><input class="en-input" type="number" id="monthlyRefills" placeholder="e.g. 1" min="0.25" step="0.25" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="householdSize">Household Size</label><input class="en-input" type="number" id="householdSize" placeholder="e.g. 4" inputmode="numeric"></div>`,
    calcInputs: `i.cylinderSize=sv("cylinderSize");i.monthlyRefills=fv("monthlyRefills");i.householdSize=fv("householdSize");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Monthly Gas Cost</div><div class="en-res-amount" id="rMonthly">—</div><div class="en-res-sub" id="rAnnual">Annual: —</div></div>
<table class="en-results-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
<tr><td>Price per Cylinder</td><td id="rCylinder">—</td></tr>
<tr><td>Price per kg</td><td id="rPerKg">—</td></tr>
<tr><td>Monthly Cost</td><td id="rMonthlyCost">—</td></tr>
<tr><td>Annual Cost</td><td id="rAnnualCost">—</td></tr>
<tr><td>Cost per Person/Day</td><td id="rPerPerson">—</td></tr>
<tr><td>Energy per Month</td><td id="rKWh">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rMonthly").textContent=r.monthlyCost;
document.getElementById("rAnnual").textContent="Annual: "+r.annualCost;
document.getElementById("rCylinder").textContent=r.pricePerCylinder;
document.getElementById("rPerKg").textContent=r.pricePerKg+"/kg";
document.getElementById("rMonthlyCost").textContent=r.monthlyCost;
document.getElementById("rAnnualCost").textContent=r.annualCost;
document.getElementById("rPerPerson").textContent=r.costPerPersonDay+"/day";
document.getElementById("rKWh").textContent=r.monthlyKWh;`,
    seoTitle: "Gas & LPG Cost Calculator",
    seoBody: "LPG prices in {{COUNTRY_NAME}} directly affect household cooking costs. Use our gas cost calculator to track monthly spending, compare LPG to other cooking fuels, and find out the cost-per-kWh of your cooking energy.",
    seoFact: "cooking energy access and LPG adoption rates"
  },
  {
    slug: "paygo-solar",
    toolNum: 140,
    hubTitle: "Pay-As-You-Go Solar Calculator",
    metaDesc: "Compare pay-as-you-go solar options in {{COUNTRY_NAME}}. Find the right solar home system tier, weekly payments, and how much you save vs current energy spend.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Pay-As-You-Go Solar Calculator</em>",
    heroSub: "Find the best pay-as-you-go solar plan for your energy needs in {{COUNTRY_NAME}}. Compare providers, weekly payments, and savings.",
    formIcon: "🌤️",
    formHeading: "Find Your PayGo Solar Plan",
    engineVar: "PaygoSolarEngine",
    engineFile: "paygo-solar-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="dailyWh">Daily Energy Need (Wh)</label><select class="en-select" id="dailyWh"><option value="30">30 Wh — phone charging + 2 lights</option><option value="100">100 Wh — 4 lights + phone + radio</option><option value="200">200 Wh — lights + TV + phone</option><option value="500" selected>500 Wh — small home (fridge + lights + phone)</option><option value="1000">1,000 Wh — medium home</option></select></div>
<div class="en-field"><label class="en-label" for="currentMonthlySpend">Current Monthly Energy Spend</label><input class="en-input" type="number" id="currentMonthlySpend" placeholder="e.g. 8000" inputmode="numeric"></div>`,
    calcInputs: `i.dailyWh=sv("dailyWh");i.currentMonthlySpend=fv("currentMonthlySpend");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Recommended System</div><div class="en-res-amount" id="rTier">—</div><div class="en-res-sub" id="rSaving">Monthly saving: —</div></div>
<table class="en-results-table"><thead><tr><th>Detail</th><th>Value</th></tr></thead><tbody>
<tr><td>System Size</td><td id="rSystem">—</td></tr>
<tr><td>Deposit</td><td id="rDeposit">—</td></tr>
<tr><td>Weekly Payment</td><td id="rWeekly">—</td></tr>
<tr><td>Monthly Payment</td><td id="rMonthly">—</td></tr>
<tr><td>Total Ownership Cost</td><td id="rOwnership">—</td></tr>
<tr><td>Monthly Saving</td><td id="rMSaving">—</td></tr>
</tbody></table>`,
    bindJS: `if(!r.available){document.getElementById("rTier").textContent="Not Available";document.getElementById("rSaving").textContent=r.message;document.getElementById("results").classList.add("on");return;}
document.getElementById("rTier").textContent=r.tier;
document.getElementById("rSaving").textContent="Monthly saving: "+r.monthlySaving;
document.getElementById("rSystem").textContent=r.systemWp;
document.getElementById("rDeposit").textContent=r.depositLocal;
document.getElementById("rWeekly").textContent=r.weeklyPayment;
document.getElementById("rMonthly").textContent=r.monthlyPayment;
document.getElementById("rOwnership").textContent=r.totalOwnership;
document.getElementById("rMSaving").textContent=r.monthlySaving;`,
    seoTitle: "Pay-As-You-Go Solar Calculator",
    seoBody: "Pay-as-you-go solar is transforming energy access across {{COUNTRY_NAME}}. Use this calculator to find the right solar home system tier for your needs, understand weekly payment plans, and see how much you save compared to kerosene or grid electricity.",
    seoFact: "off-grid solar adoption and energy access levels"
  },
  {
    slug: "outage-cost",
    toolNum: 144,
    hubTitle: "Electricity Outage Cost Calculator",
    metaDesc: "Calculate the business cost of electricity outages in {{COUNTRY_NAME}}. Quantify daily revenue loss, spoilage, and see if backup power is financially justified.",
    h1: "{{FLAG}} {{COUNTRY_NAME}} <em>Electricity Outage Cost Calculator</em>",
    heroSub: "Quantify the real financial cost of power outages on your business in {{COUNTRY_NAME}}. Calculate daily losses and justify backup power investment.",
    formIcon: "🔌",
    formHeading: "Calculate Outage Business Impact",
    engineVar: "OutageCostEngine",
    engineFile: "outage-cost-engine",
    formHTML: `<div class="en-field"><label class="en-label" for="businessType">Business Type</label><select class="en-select" id="businessType"><option value="retail">Retail / Shop</option><option value="restaurant">Restaurant / Food</option><option value="manufacturing">Manufacturing</option><option value="office">Office / Professional</option><option value="hotel">Hotel / Hospitality</option><option value="clinic">Clinic / Pharmacy</option></select></div>
<div class="en-field"><label class="en-label" for="dailyRevenue">Average Daily Revenue</label><input class="en-input" type="number" id="dailyRevenue" placeholder="e.g. 150000" inputmode="numeric"></div>
<div class="en-field"><label class="en-label" for="outageHrsPerDay">Daily Outage Hours</label><input class="en-input" type="number" id="outageHrsPerDay" placeholder="e.g. 6" min="0.5" max="20" inputmode="numeric"></div>`,
    calcInputs: `i.businessType=sv("businessType");i.dailyRevenue=fv("dailyRevenue");i.outageHrsPerDay=fv("outageHrsPerDay");`,
    resultsHTML: `<div class="en-res-hero"><div class="en-res-label">Monthly Business Loss</div><div class="en-res-amount" id="rMonthly">—</div><div class="en-res-sub" id="rJustified">Backup power: —</div></div>
<table class="en-results-table"><thead><tr><th>Item</th><th>Monthly Impact</th></tr></thead><tbody>
<tr><td>Revenue Loss</td><td id="rRevLoss">—</td></tr>
<tr><td>Stock Spoilage</td><td id="rSpoilage">—</td></tr>
<tr><td>Total Monthly Impact</td><td id="rTotal">—</td></tr>
<tr><td>Annual Loss</td><td id="rAnnual">—</td></tr>
<tr><td>Generator Cost (monthly)</td><td id="rGenCost">—</td></tr>
<tr><td>Net Benefit of Backup</td><td id="rNetBenefit">—</td></tr>
</tbody></table>`,
    bindJS: `document.getElementById("rMonthly").textContent=r.totalMonthlyImpact;
document.getElementById("rJustified").textContent=r.backupJustified?"Backup power IS justified":"Consider smaller UPS instead";
document.getElementById("rRevLoss").textContent=r.monthlyRevenueLoss;
document.getElementById("rSpoilage").textContent=r.monthlySpoilage;
document.getElementById("rTotal").textContent=r.totalMonthlyImpact;
document.getElementById("rAnnual").textContent=r.annualLoss;
document.getElementById("rGenCost").textContent=r.genMonthlyCost;
document.getElementById("rNetBenefit").textContent=r.netMonthlyBenefit;`,
    seoTitle: "Electricity Outage Cost Calculator",
    seoBody: "Power outages cost {{COUNTRY_NAME}} businesses billions each year in lost revenue and spoilage. Use this calculator to quantify your specific outage losses and determine whether investing in backup power (generator or solar UPS) is financially justified.",
    seoFact: "power outage frequency and economic impact"
  }
];

// ─── HTML TEMPLATE ─────────────────────────────────────────────────────────────
function makePage(tool, country) {
  const title = `${country.name} ${tool.hubTitle} | AfroTools`;
  const desc = tool.metaDesc.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const canonical = `https://afrotools.com/tools/${tool.slug}/${country.slug}`;
  const h1 = tool.h1.replace(/\{\{FLAG\}\}/g, country.flag).replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const heroSub = tool.heroSub.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);
  const seoBody = tool.seoBody.replace(/\{\{COUNTRY_NAME\}\}/g, country.name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${title}","description":"${desc}","url":"${canonical}","applicationCategory":"FinanceApplication","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Energy & Utilities","item":"https://afrotools.com/energy/"},{"@type":"ListItem","position":3,"name":"${tool.hubTitle}","item":"https://afrotools.com/tools/${tool.slug}/"},{"@type":"ListItem","position":4,"name":"${country.name}","item":"${canonical}"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js?v=e84bb500" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<section class="en-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/energy/">Energy &amp; Utilities</a> <span>›</span> <a href="/tools/${tool.slug}/">${tool.hubTitle}</a> <span>›</span> ${country.name}</nav>
<h1>${h1}</h1>
<p class="en-tool-hero-sub">${heroSub}</p>
</div></section>
<main class="en-main">
<div class="en-card"><div class="en-card-head" onclick="var b=this.nextElementSibling;b.classList.toggle('collapsed');this.setAttribute('aria-expanded',b.classList.contains('collapsed')?'false':'true')" aria-expanded="true"><span>${tool.formIcon}</span><h2>${tool.formHeading}</h2><span class="en-card-toggle">&#x25BE;</span></div>
<div class="en-card-body"><div class="en-form-grid">
${tool.formHTML}
</div>
<button class="en-btn" id="calcBtn" type="button">Calculate</button></div></div>
<div class="en-results" id="results">
${tool.resultsHTML}
<div class="en-observations" id="rObs"></div>
</div>
<section class="en-seo">
<h2>${country.name} ${tool.seoTitle} — What You Need to Know</h2>
<p>${seoBody}</p>
<p>${country.name} is among Africa's key markets for ${tool.seoFact}. Use this free tool to make data-driven energy decisions.</p>
<p><strong>Disclaimer:</strong> Estimates based on available market data and published rates. Actual costs may vary. Verify with local providers.</p>
</section>
</main>
<afro-footer></afro-footer>
<script src="/data/energy/country-energy-index.js"></script>
<script src="/engines/${tool.engineFile}.js"></script>
<script src="/assets/js/energy-tool-assistant.js"></script>
<script>
!function(){
"use strict";
var CC='${country.code}';
var E=window.AfroTools.${tool.engineVar};
function fv(id){var el=document.getElementById(id);return el?parseFloat(el.value)||0:0;}
function sv(id){var el=document.getElementById(id);return el?el.value:"";}
document.getElementById("calcBtn").addEventListener("click",function(){
var i={};
${tool.calcInputs}
var r=E.calculate(i,CC);
if(r.error){alert(r.error);return;}
${tool.bindJS}
var obs=document.getElementById("rObs");
if(r.observations&&r.observations.length){
  if(window.AfroEnergyTools&&window.AfroEnergyTools.renderObservations){
    window.AfroEnergyTools.renderObservations(obs,r.observations,"Calculation Notes");
  }
}
document.getElementById("results").classList.add("on");
document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
});
}();
</script>
</body>
</html>`;
}

function makeHub(tool) {
  const title = `${tool.hubTitle} — Top 15 African Countries | AfroTools`;
  const desc = `Free ${tool.hubTitle} for Africa's top 15 economies. Select your country for local rates and data.`;
  const canonical = `https://afrotools.com/tools/${tool.slug}/`;
  const countryCards = COUNTRIES.map(c =>
    `<a href="/tools/${tool.slug}/${c.slug}/" class="en-country-card"><span class="en-country-flag">${c.flag}</span><span class="en-country-name">${c.name}</span></a>`
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js?v=e84bb500" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<section class="en-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/energy/">Energy &amp; Utilities</a> <span>›</span> ${tool.hubTitle}</nav>
<h1>${tool.formIcon} <em>${tool.hubTitle}</em></h1>
<p class="en-tool-hero-sub">${desc}</p>
</div></section>
<main class="en-main">
<section class="en-hub"><div class="container">
<h2>Select Your Country</h2>
<div class="en-hub-country-grid">
${countryCards}
</div>
</div></section>
</main>
<afro-footer></afro-footer>
<script src="/assets/js/energy-tool-assistant.js"></script>
</body>
</html>`;
}

let total = 0;
for (const tool of TOOLS) {
  const toolDir = path.join(ROOT, "tools", tool.slug);
  fs.mkdirSync(toolDir, { recursive: true });
  fs.writeFileSync(path.join(toolDir, "index.html"), makeHub(tool));
  total++;
  for (const c of COUNTRIES) {
    const cDir = path.join(toolDir, c.slug);
    fs.mkdirSync(cDir, { recursive: true });
    fs.writeFileSync(path.join(cDir, "index.html"), makePage(tool, c));
    total++;
  }
  console.log(`✓ ${tool.slug}: 1 hub + ${COUNTRIES.length} country pages`);
}
console.log(`\nTotal files: ${total}`);
