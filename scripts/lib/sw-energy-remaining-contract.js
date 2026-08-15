"use strict";

const REVIEWED_AT = "2026-03-01";
const DATA_STATUS = "planning_snapshot_stale";

const optionSets = {
  customerType: [
    ["residential", "Nyumbani"], ["commercial", "Biashara"], ["industrial", "Viwandani"],
  ],
};

function number(name, label, value, min = 0, step = "any", extra = {}) {
  return { name, label, type: "number", value, min, step, required: true, ...extra };
}
function select(name, label, options) { return { name, label, type: "select", options }; }

const SW_ENERGY_REMAINING_APPS = [
  {
    id: "electricity-tariff", slug: "kikokotoo-tariff-ya-umeme", frSlug: "tarifs-electricite",
    title: "Gharama ya Umeme na Unit za Kulipia Kabla", description: "Badilisha pesa kuwa unit za kulipia kabla au kWh kuwa bili kwa tarifa ya sasa ya mtoa huduma na daraja la mteja.",
    engine: "electricity-cost-engine", global: "electricityCost", exactTariff: true,
    fields: [number("units", "Matumizi ya mwezi (kWh)", 250, 0.1), select("customerType", "Daraja la mteja", optionSets.customerType)],
    metrics: [["monthlyBill","Bili ya mwezi"],["dailyBill","Wastani kwa siku"],["annualBill","Makadirio ya mwaka"],["avgRate","Wastani kwa kWh"]],
  },
  {
    id: "solar-roi", slug: "faida-ya-solar", frSlug: "roi-solaire",
    title: "Kikokotoo cha Faida ya Solar", description: "Kadiria gharama, uzalishaji, akiba na muda wa kurejesha gharama ya mfumo wa solar kwa nakala ya nchi ya Machi 2026.",
    engine: "solar-roi-engine", global: "SolarROIEngine", mode: "solarQuick",
    fields: [number("systemKW", "Ukubwa wa mfumo (kW)", 3, 0.1), number("currentMonthlyBill", "Bili ya sasa kwa mwezi", 100000, 0.01)],
    metrics: [["installCostLocal","Gharama ya mfumo"],["paybackYears","Muda wa kurejesha gharama"],["monthlyGeneration","Uzalishaji kwa mwezi"],["roi10yr","Akiba halisi ya miaka 10"]],
  },
  {
    id: "prepaid-meter", slug: "kikokotoo-luku-ya-umeme", frSlug: "compteur-prepaye",
    title: "Kikokotoo cha LUKU ya Umeme", description: "Kadiria unit za kWh, makato ya huduma na siku za matumizi kutoka kiasi cha vocha ya umeme.",
    engine: "prepaid-meter-engine", global: "PrepaidMeterEngine",
    fields: [number("tokenAmount", "Kiasi cha vocha", 5000, 0.01), select("customerType", "Daraja la mteja", optionSets.customerType)],
    metrics: [["unitsReceived","Unit zinazokadiriwa"],["serviceCharge","Makato ya huduma"],["energyAmount","Kiasi kinachoenda kwa umeme"],["estimatedDays","Siku zinazokadiriwa"]],
  },
  {
    id: "solar-vs-generator", slug: "solar-dhidi-ya-generator", frSlug: "solaire-vs-generateur",
    title: "Solar dhidi ya Generator", description: "Linganisha gharama za miaka mitano za generator na mfumo wa solar kwa mzigo na saa zako za akiba.",
    engine: "solar-vs-generator-engine", global: "SolarVsGeneratorEngine",
    fields: [number("dailyHours", "Saa za akiba kwa siku", 6, 0.5, 0.5, {max:24}), number("genKVA", "Ukubwa wa generator (kVA)", 5, 0, 0.1, {required:false}), number("dailyKWh", "Mahitaji ya nishati kwa siku (kWh)", 20, 0, 0.1, {required:false})],
    metrics: [["gen5yrTotal","Jumla ya generator miaka 5"],["solar5yrTotal","Jumla ya solar miaka 5"],["savings5yr","Tofauti ya gharama"],["paybackYrs","Muda wa kurejesha gharama"]],
  },
  {
    id: "electricity-bill-verify", slug: "ukaguzi-wa-bili-ya-umeme", frSlug: "verifier-facture-electricite",
    title: "Ukaguzi wa Bili ya Umeme", description: "Linganisha usomaji wa mita, matumizi na bili uliyopokea dhidi ya makadirio ya tarifa ya nchi.",
    engine: "bill-verifier-engine", global: "BillVerifierEngine",
    fields: [number("prevReading", "Usomaji wa awali wa mita", 1200, 0), number("currReading", "Usomaji wa sasa wa mita", 1450, 0), number("billedAmount", "Kiasi kilicho kwenye bili", 0, 0, 0.01, {required:false}), select("customerType", "Daraja la mteja", optionSets.customerType)],
    metrics: [["unitsConsumed","Unit zilizotumika"],["expectedTotal","Bili inayotarajiwa"],["variance","Tofauti"],["status","Hali ya ukaguzi"]],
  },
  {
    id: "water-bill", slug: "kikokotoo-bili-ya-maji", frSlug: "calculateur-facture-eau",
    title: "Kikokotoo cha Bili ya Maji", description: "Kadiria bili na matumizi ya maji kwa mwezi kwa kaya au biashara kwa kutumia nakala ya tarifa ya nchi.",
    engine: "water-bill-engine", global: "WaterBillEngine",
    fields: [number("monthlyUsage", "Maji yaliyotumika kwa mwezi (m³)", 15, 0.1), number("householdSize", "Watu katika kaya", 4, 1, 1), select("customerType", "Aina ya matumizi", [["residential","Nyumbani"],["commercial","Biashara"]])],
    metrics: [["monthlyBill","Bili ya mwezi"],["ratePerM3","Bei kwa m³"],["dailyUsageLitres","Matumizi kwa siku"],["perPersonPerDay","Matumizi kwa mtu kwa siku"]],
  },
  {
    id: "gas-lpg-cost", slug: "gharama-za-gesi-lpg", frSlug: "cout-gaz-lpg",
    title: "Gharama za Gesi ya LPG", description: "Kadiria gharama ya kujaza mtungi, matumizi ya mwezi na mwaka kwa ukubwa wa mtungi na kaya yako.",
    engine: "gas-lpg-engine", global: "GasLPGEngine",
    fields: [number("cylinderSize", "Ukubwa wa mtungi (kg)", 12.5, 1, 0.5), number("monthlyRefills", "Mara za kujaza kwa mwezi", 1, 0.1, 0.1), number("householdSize", "Watu katika kaya", 4, 1, 1)],
    metrics: [["pricePerCylinder","Bei kwa mtungi"],["monthlyCost","Gharama ya mwezi"],["annualCost","Gharama ya mwaka"],["monthlyKWh","Nishati ya kupikia kwa mwezi"]],
  },
  {
    id: "paygo-solar", slug: "paygo-solar", frSlug: "solaire-paygo",
    title: "Kikokotoo cha PayGo Solar", description: "Kadiria kiwango cha mfumo, amana, malipo na gharama ya umiliki wa mpango wa PayGo solar.",
    engine: "paygo-solar-engine", global: "PaygoSolarEngine",
    fields: [number("dailyWh", "Mahitaji ya nishati kwa siku (Wh)", 200, 0, 1, {required:false}), number("currentMonthlySpend", "Matumizi ya sasa kwa mwezi", 5000, 0, 0.01, {required:false})],
    metrics: [["tier","Kiwango cha mfumo"],["systemWp","Nguvu ya mfumo"],["depositLocal","Amana"],["monthlyPayment","Malipo ya mwezi"],["totalOwnership","Jumla ya umiliki"]],
  },
  {
    id: "outage-cost", slug: "gharama-ya-kukatika-umeme", frSlug: "cout-coupure-entreprise",
    title: "Gharama ya Kukatika Umeme", description: "Kadiria mapato, bidhaa na kazi zinazopotea wakati biashara yako haina umeme.",
    engine: "outage-cost-engine", global: "OutageCostEngine",
    fields: [number("dailyRevenue", "Mapato ya kawaida kwa siku", 100000, 0.01), number("outageHrsPerDay", "Saa za kukatika kwa siku", 4, 0.5, 0.5, {max:24}), select("businessType", "Aina ya biashara", [["retail","Duka"],["restaurant","Mgahawa"],["manufacturing","Uzalishaji"],["office","Ofisi"],["hotel","Hoteli"],["clinic","Kliniki"]])],
    metrics: [["dailyLoss","Hasara kwa siku"],["totalMonthlyImpact","Athari kwa mwezi"],["annualLoss","Hasara kwa mwaka"],["genMonthlyCost","Gharama ya generator kwa mwezi"]],
  },
  {
    id: "energy-audit", slug: "ukaguzi-wa-nishati-nyumbani", frSlug: "audit-energie-maison",
    title: "Ukaguzi wa Nishati Nyumbani", description: "Kadiria matumizi ya nyumba, alama ya ufanisi na nafasi za kupunguza bili.",
    engine: "energy-audit-engine", global: "EnergyAuditEngine", countryInInput: true,
    fields: [number("homeSizeSqm", "Ukubwa wa nyumba (m²)", 100, 0, 1, {required:false}), number("occupants", "Wakazi", 4, 1, 1), number("monthlyBill", "Bili ya umeme kwa mwezi", 30000, 0.01), number("acUnits", "Viyoyozi", 1, 0, 1), select("lightingType", "Aina ya taa", [["led","LED"],["mix","Mchanganyiko"],["incandescent","Balbu za kawaida"]]), select("waterHeater", "Kupasha maji", [["electric","Umeme"],["solar","Solar"],["gas","Gesi"],["none","Hakuna"]])],
    metrics: [["monthlyKWh","Matumizi ya mwezi"],["efficiencyScore","Alama ya ufanisi"],["rating","Daraja"],["monthlySaving","Akiba inayowezekana kwa mwezi"]],
  },
  {
    id: "appliance-power", slug: "matumizi-ya-umeme-ya-vifaa", frSlug: "consommation-appareils",
    title: "Matumizi ya Umeme ya Vifaa", description: "Kokotoa watt, kWh na gharama ya kifaa kwa saa na idadi unayotumia.",
    engine: "appliance-power-engine", global: "AppliancePowerEngine", mode: "appliance", countryInInput: true,
    fields: [number("watts", "Nguvu ya kifaa (W)", 100, 0.1), number("hoursPerDay", "Saa kwa siku", 6, 0.1, 0.1, {max:24}), number("qty", "Idadi ya vifaa", 1, 1, 1), number("standbyWatts", "Nguvu ya kusubiri (W)", 0, 0, 0.1, {required:false})],
    metrics: [["totalWatts","Mzigo wote"],["dailyKWh","Matumizi kwa siku"],["monthlyKWh","Matumizi kwa mwezi"],["monthlyBill","Bili ya mwezi"]],
  },
  {
    id: "diesel-vs-solar-farm", slug: "dizeli-dhidi-ya-solar-shambani", frSlug: "diesel-vs-solaire-ferme",
    title: "Dizeli dhidi ya Solar Shambani", description: "Linganisha gharama ya miaka kumi ya pampu ya dizeli na pampu ya solar kwa shamba lako.",
    engine: "diesel-vs-solar-engine", global: "DieselVsSolarEngine", countryInInput: true,
    fields: [number("farmHa", "Ukubwa wa shamba (hekta)", 4, 0, 0.1, {required:false}), number("pumpKW", "Nguvu ya pampu (kW)", 2, 0, 0.1, {required:false}), number("dailyPumpHrs", "Saa za kusukuma kwa siku", 5, 0.1, 0.1, {max:24})],
    metrics: [["diesel10yrTotal","Dizeli miaka 10"],["solar10yrTotal","Solar miaka 10"],["savings10yr","Tofauti ya gharama"],["paybackYrs","Muda wa kurejesha gharama"]],
  },
  {
    id: "mini-grid-feasibility", slug: "uwezekano-wa-mini-grid", frSlug: "faisabilite-mini-reseau",
    title: "Uwezekano wa Mini-grid", description: "Fanya uchunguzi wa awali wa mahitaji, ukubwa, mtaji na muda wa kurejesha gharama wa mini-grid.",
    engine: "mini-grid-engine", global: "MiniGridEngine", countryInInput: true,
    fields: [number("households", "Kaya zitakazounganishwa", 100, 1, 1), number("businesses", "Biashara zitakazounganishwa", 10, 0, 1), number("avgKWhHousehold", "kWh kwa kaya kwa mwezi", 30, 0.1), number("avgKWhBusiness", "kWh kwa biashara kwa mwezi", 100, 0.1)],
    metrics: [["solarKW","Ukubwa wa solar"],["batteryKWh","Ukubwa wa betri"],["totalCapexLocal","Mtaji unaokadiriwa"],["paybackYrs","Muda wa kurejesha gharama"],["viability","Hali ya awali"]],
  },
  {
    id: "carbon-footprint-energy", slug: "alama-ya-kaboni-ya-nishati", frSlug: "empreinte-carbone-energie",
    title: "Alama ya Kaboni ya Nishati", description: "Kadiria CO₂ ya umeme, dizeli, LPG na biomasi kwa mwezi kwa vigezo vya uchunguzi.",
    engine: "carbon-footprint-energy-engine", global: "CarbonFootprintEnergyEngine", countryInInput: true,
    fields: [number("gridKWh", "Umeme wa gridi (kWh/mwezi)", 200, 0, 0.1, {required:false}), number("genLitres", "Dizeli ya generator (lita/mwezi)", 0, 0, 0.1, {required:false}), number("lpgKg", "LPG (kg/mwezi)", 0, 0, 0.1, {required:false}), number("woodKg", "Kuni/biomasi (kg/mwezi)", 0, 0, 0.1, {required:false})],
    metrics: [["totalMonthlyCO2","CO₂ kwa mwezi"],["totalAnnualCO2","CO₂ kwa mwaka"],["rating","Daraja la uchunguzi"],["solarOffsetPct","Sehemu inayoweza kupunguzwa na solar"]],
  },
  {
    id: "ev-charging", slug: "gharama-za-kuchaji-ev", frSlug: "cout-recharge-ev",
    title: "Gharama za Kuchaji EV", description: "Kadiria muda na gharama ya kuchaji gari la umeme na ulinganishe na matumizi ya petroli.",
    engine: "ev-charging-engine", global: "EVChargingEngine", countryInInput: true,
    fields: [number("batteryKWh", "Uwezo wa betri ya EV (kWh)", 50, 0.1), number("dailyKm", "Umbali kwa siku (km)", 50, 0, 0.1), select("chargingLevel", "Aina ya chaja", [["home","Nyumbani 7.4 kW"],["fast","Haraka 50 kW"],["rapid","Haraka sana 150 kW"]])],
    metrics: [["fullChargeCost","Gharama ya chaji kamili"],["chargingTimeHrs","Muda wa kuchaji"],["monthlyCost","Gharama ya mwezi"],["monthlyFuelSaving","Akiba dhidi ya petroli"]],
  },
  {
    id: "biogas-roi", slug: "faida-ya-biogas", frSlug: "roi-biogaz",
    title: "Kikokotoo cha Faida ya Biogas", description: "Kadiria uzalishaji wa biogas, ukubwa wa digester, akiba ya LPG na muda wa kurejesha gharama.",
    engine: "biogas-roi-engine", global: "BiogasROIEngine", countryInInput: true,
    fields: [number("livestockCount", "Idadi ya mifugo", 10, 1, 1), select("livestockType", "Aina ya mifugo", [["cattle","Ng'ombe"],["pig","Nguruwe"],["goat","Mbuzi"],["chicken","Kuku"],["sheep","Kondoo"]]), number("cookingHours", "Saa za kupika kwa siku", 3, 0.1, 0.1, {max:24})],
    metrics: [["dailyBiogasM3","Biogas kwa siku"],["digesterSize","Ukubwa wa digester"],["digesterCostLocal","Gharama ya digester"],["adjustedPayback","Muda wa kurejesha gharama"]],
  },
  {
    id: "generator-fuel", slug: "gharama-za-mafuta-ya-generator", frSlug: "carburant-generateur",
    title: "Gharama za Mafuta ya Generator", description: "Kadiria lita, gharama ya siku, mwezi na mwaka ya kuendesha generator kwa nakala ya bei ya mafuta.",
    engine: "generator-fuel-engine", global: "GeneratorFuelEngine",
    fields: [number("genKVA", "Ukubwa wa generator (kVA)", 5, 0.1), number("dailyHours", "Saa za matumizi kwa siku", 6, 0.1, 0.1, {max:24}), select("fuelType", "Aina ya mafuta", [["diesel","Dizeli"],["petrol","Petroli"]])],
    metrics: [["litrePerHour","Lita kwa saa"],["dailyCost","Gharama kwa siku"],["monthlyCost","Gharama kwa mwezi"],["totalAnnualCost","Jumla kwa mwaka"]],
  },
].map((app) => Object.freeze({
  ...app,
  enRoute: `/tools/${app.id}/`,
  swRoute: `/sw/zana/${app.slug}/`,
  frRoute: `/fr/tools/${app.frSlug}/`,
  file: `sw/zana/${app.slug}/index.html`,
  image: `/assets/img/tools/${app.id}.webp`,
  reviewedAt: REVIEWED_AT,
  dataStatus: DATA_STATUS,
}));

const PRESERVED_ACCEPTED = Object.freeze([
  { id: "solar-sizing", route: "/sw/zana/ukubwa-wa-mfumo-wa-solar/", file: "sw/zana/ukubwa-wa-mfumo-wa-solar/index.html" },
  { id: "battery-sizing", route: "/sw/zana/ukubwa-wa-betri-na-inverter/", file: "sw/zana/ukubwa-wa-betri-na-inverter/index.html" },
  { id: "backup-duration", route: "/sw/zana/muda-wa-backup-ya-betri/", file: "sw/zana/muda-wa-backup-ya-betri/index.html" },
]);

module.exports = { REVIEWED_AT, DATA_STATUS, SW_ENERGY_REMAINING_APPS, PRESERVED_ACCEPTED };
