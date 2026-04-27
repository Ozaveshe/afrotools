(function () {
  "use strict";

  var CONFIG = {
    "energy": {
      title: "Choose the right energy calculator",
      copy: "Start with the bill you can see, then model the backup or solar decision behind it.",
      checklist: [
        "Bill problem: use tariff, prepaid meter, or bill verifier first.",
        "Backup problem: compare generator, battery, solar, and outage cost.",
        "Planning problem: use sizing, audit, mini-grid, or farm pump tools."
      ],
      next: [
        "Keep one recent bill, meter reading, fuel receipt, and daily usage estimate nearby.",
        "Run the same country across two related tools before buying equipment."
      ],
      note: "The section now treats tariff, backup, solar, water, LPG, carbon, and mini-grid decisions as separate workflows."
    },
    "electricity-tariff": {
      title: "Tariff scenario shortcuts",
      copy: "Use a realistic monthly kWh case before you compare solar, prepaid meter value, or disputed bills.",
      presets: [
        { label: "Low-use home", values: { monthlyUnits: 75, customerType: "residential" } },
        { label: "Family home", values: { monthlyUnits: 220, customerType: "residential" } },
        { label: "Small shop", values: { monthlyUnits: 450, customerType: "commercial" } }
      ],
      checklist: ["Use actual kWh from a bill when possible.", "Compare residential and commercial only if your account type is uncertain.", "If usage jumps, verify meter readings before blaming tariffs."],
      next: ["Run the same kWh in the prepaid meter calculator.", "Use monthly bill output as the solar ROI input."]
    },
    "solar-roi": {
      title: "Solar ROI decision helper",
      copy: "Model system size against the bill it can realistically offset, then inspect payback and 10-year cash savings.",
      presets: [
        { label: "Starter 1 kW", values: { systemKW: 1, currentMonthlyBill: 15000 } },
        { label: "Home 3 kW", values: { systemKW: 3, currentMonthlyBill: 45000 } },
        { label: "Shop 10 kW", values: { systemKW: 10, currentMonthlyBill: 180000 } }
      ],
      checklist: ["Use average bill from at least three months.", "Leave room for wiring, inverter, battery, and installer markup.", "Treat shading, dust, and downtime as real losses."],
      next: ["Use Solar vs Generator for backup economics.", "Use Solar Sizing before requesting installer quotes."]
    },
    "prepaid-meter": {
      title: "Token value tester",
      copy: "Estimate the units a recharge should buy after fixed charges, then compare token sizes.",
      presets: [
        { label: "Small token", values: { tokenAmount: 5000, customerType: "residential" } },
        { label: "Monthly home", values: { tokenAmount: 20000, customerType: "residential" } },
        { label: "Business token", values: { tokenAmount: 50000, customerType: "commercial" } }
      ],
      checklist: ["Enter the exact recharge amount, not the amount after mobile money fees.", "Use the account type on the meter.", "If units seem low, compare against the bill verifier."],
      next: ["Use appliance power to estimate how long the units should last.", "Save your expected units before buying another token."]
    },
    "generator-fuel": {
      title: "Generator running-cost presets",
      copy: "Fuel spend changes sharply with generator size and hours. Start with a load pattern, not the rated kVA alone.",
      presets: [
        { label: "Evening home", values: { genKVA: 2, dailyHours: 5, fuelType: "petrol" } },
        { label: "Hybrid home", values: { genKVA: 5, dailyHours: 8, fuelType: "diesel" } },
        { label: "Small office", values: { genKVA: 20, dailyHours: 10, fuelType: "diesel" } }
      ],
      checklist: ["Use daily running hours from the last week.", "Oversized generators burn fuel inefficiently.", "Add maintenance before comparing with solar."],
      next: ["Run Solar vs Generator with the same hours.", "Use Outage Cost if this is a business decision."]
    },
    "solar-vs-generator": {
      title: "Solar or generator decision frame",
      copy: "Compare total ownership, not just purchase price. Fuel, battery replacement, and maintenance decide the winner.",
      presets: [
        { label: "Small home", values: { dailyKWh: 4, genKVA: 2, dailyHours: 6 } },
        { label: "Large home", values: { dailyKWh: 12, genKVA: 5, dailyHours: 8 } },
        { label: "Business", values: { dailyKWh: 45, genKVA: 20, dailyHours: 10 } }
      ],
      checklist: ["Use backup energy need, not total building consumption.", "Keep generator capex and 5-year fuel separate.", "If payback is long, test a smaller critical-load solar setup."],
      next: ["Use Battery Sizing for critical loads.", "Use Solar ROI for grid-bill offset economics."]
    },
    "electricity-bill-verify": {
      title: "Bill dispute workflow",
      copy: "A good dispute starts with meter readings, expected units, and variance from the utility bill.",
      presets: [
        { label: "Normal month", values: { prevReading: 12450, currReading: 12720, billedAmount: 18500, customerType: "residential" } },
        { label: "High reading", values: { prevReading: 12450, currReading: 13050, billedAmount: 46000, customerType: "residential" } },
        { label: "Business", values: { prevReading: 8300, currReading: 9100, billedAmount: 140000, customerType: "commercial" } }
      ],
      checklist: ["Use current and previous readings from the same meter.", "Check if the bill used estimated readings.", "Take a meter photo before contacting the utility."],
      next: ["If usage is real, run Energy Audit.", "If amount is wrong, keep this output with your dispute evidence."]
    },
    "water-bill": {
      title: "Water use benchmark",
      copy: "Convert monthly cubic metres into per-person daily use before deciding if the bill is usage or leakage.",
      presets: [
        { label: "Apartment", values: { monthlyUsage: 12, householdSize: 3, customerType: "residential" } },
        { label: "Family home", values: { monthlyUsage: 22, householdSize: 5, customerType: "residential" } },
        { label: "Salon or cafe", values: { monthlyUsage: 80, householdSize: 1, customerType: "commercial" } }
      ],
      checklist: ["Check if the meter moved while all taps were off.", "Compare per-person litres, not just total bill.", "Seasonal garden or tank filling can distort one month."],
      next: ["If usage is high, test leak repairs before upsizing storage.", "Use the result as a household budget line."]
    },
    "gas-lpg-cost": {
      title: "Cooking energy cost lens",
      copy: "LPG budgeting is easier when you compare cylinder size, refill frequency, and cost per cooking day.",
      presets: [
        { label: "Single room", values: { cylinderSize: 6, monthlyRefills: 1, householdSize: 1 } },
        { label: "Family kitchen", values: { cylinderSize: 12.5, monthlyRefills: 1, householdSize: 4 } },
        { label: "Food seller", values: { cylinderSize: 50, monthlyRefills: 3, householdSize: 1 } }
      ],
      checklist: ["Use the full refill price including transport.", "Track refill days to catch leaks or inefficient burners.", "Compare LPG with charcoal only after health and time costs."],
      next: ["Use Biogas ROI for farms or livestock homes.", "Use Carbon Footprint for emissions comparison."]
    },
    "paygo-solar": {
      title: "PayGo affordability test",
      copy: "Match the system tier to daily watt-hours, then compare weekly or monthly payments with current spend.",
      presets: [
        { label: "Phone and lights", values: { dailyWh: 100, currentMonthlySpend: 5000 } },
        { label: "TV home", values: { dailyWh: 500, currentMonthlySpend: 15000 } },
        { label: "Premium home", values: { dailyWh: 1000, currentMonthlySpend: 30000 } }
      ],
      checklist: ["Check deposit, weekly payment, ownership period, and service support.", "Do not size PayGo for high-power appliances unless the plan supports them.", "Confirm mobile-money lockout rules before signing."],
      next: ["Use Solar Sizing if you need fridge, pump, or AC loads.", "Compare total ownership with generator fuel."]
    },
    "outage-cost": {
      title: "Business outage model",
      copy: "Quantify revenue loss, spoilage, and backup cost before buying a generator or inverter.",
      presets: [
        { label: "Retail shop", values: { businessType: "retail", dailyRevenue: 150000, outageHrsPerDay: 5 } },
        { label: "Restaurant", values: { businessType: "restaurant", dailyRevenue: 300000, outageHrsPerDay: 6 } },
        { label: "Clinic", values: { businessType: "clinic", dailyRevenue: 500000, outageHrsPerDay: 4 } }
      ],
      checklist: ["Separate lost sales from spoilage and equipment risk.", "Estimate outage hours from business days, not calendar days.", "If losses are low, a UPS may beat a full generator."],
      next: ["Use Solar vs Generator for the backup option.", "Use Battery Sizing for critical equipment only."]
    },
    "solar-sizing": {
      title: "Solar sizing review",
      copy: "Add the appliances you truly need during outages. High-load devices can double the system price.",
      presets: [
        { label: "Core home", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 6, qty: 6 }, { name: "Fan (ceiling)", watts: 75, hours: 8, qty: 2 }, { name: "Smartphone charging", watts: 10, hours: 4, qty: 4 }, { name: "32\" LED TV", watts: 60, hours: 5, qty: 1 }, { name: "Fridge (200L)", watts: 120, hours: 24, qty: 1 }] },
        { label: "Work from home", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 6, qty: 8 }, { name: "Laptop", watts: 65, hours: 8, qty: 2 }, { name: "Router (WiFi)", watts: 12, hours: 24, qty: 1 }, { name: "Fan (ceiling)", watts: 75, hours: 8, qty: 2 }, { name: "Fridge (200L)", watts: 120, hours: 24, qty: 1 }] },
        { label: "Include AC", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 6, qty: 8 }, { name: "Fridge (200L)", watts: 120, hours: 24, qty: 1 }, { name: "1.5HP Air conditioner", watts: 1200, hours: 6, qty: 1 }, { name: "Water pump (0.5HP)", watts: 400, hours: 1, qty: 1 }, { name: "Router (WiFi)", watts: 12, hours: 24, qty: 1 }] }
      ],
      checklist: ["Start with lights, fan, phones, router, TV, and fridge.", "Run AC, pump, microwave, and iron as separate what-if cases.", "Keep 20 to 30 percent headroom for inverter surge."],
      next: ["Take the panel and battery outputs into Solar ROI.", "Ask installers to quote the same load list so bids are comparable."]
    },
    "battery-sizing": {
      title: "Critical-load battery presets",
      copy: "Battery systems are cheaper when you size for essential loads instead of the whole building.",
      presets: [
        { label: "Lights and router", values: { loadWatts: 180, backupHours: 8, batteryType: "lithium", systemVoltage: 24 } },
        { label: "Home essentials", values: { loadWatts: 800, backupHours: 8, batteryType: "lithium", systemVoltage: 48 } },
        { label: "Office critical", values: { loadWatts: 2500, backupHours: 6, batteryType: "lithium", systemVoltage: 48 } }
      ],
      checklist: ["Use measured watts when possible.", "Lead-acid usable capacity is much lower than label capacity.", "Include inverter losses and startup surge."],
      next: ["Use Backup Duration to test an existing battery.", "Use Solar Sizing if the battery will recharge from panels."]
    },
    "carbon-footprint-energy": {
      title: "Energy carbon mix",
      copy: "Split grid, generator, LPG, and biomass so the tool can show which source drives the footprint.",
      presets: [
        { label: "Grid home", values: { gridKWh: 220, genLitres: 10, lpgKg: 12.5, woodKg: 0 } },
        { label: "Generator heavy", values: { gridKWh: 80, genLitres: 90, lpgKg: 12.5, woodKg: 0 } },
        { label: "Biomass cooking", values: { gridKWh: 80, genLitres: 0, lpgKg: 0, woodKg: 120 } }
      ],
      checklist: ["Use monthly litres and kilograms, not purchase price.", "Diesel backup can dominate emissions even with modest grid use.", "Switching cooking fuel may reduce indoor pollution as well as CO2."],
      next: ["Use Solar ROI for grid and generator reduction.", "Use LPG or Biogas tools for cooking alternatives."]
    },
    "ev-charging": {
      title: "EV charging cost presets",
      copy: "Compare charging cost with petrol before deciding whether home charging or fast charging works.",
      presets: [
        { label: "City hatchback", values: { batteryKWh: 40, chargingLevel: "home", dailyKm: 35 } },
        { label: "Ride-hail day", values: { batteryKWh: 60, chargingLevel: "fast", dailyKm: 180 } },
        { label: "SUV commute", values: { batteryKWh: 80, chargingLevel: "home", dailyKm: 70 } }
      ],
      checklist: ["Home charging wins when parking and supply are reliable.", "Fast charging is convenient but can erase some savings.", "Check service network and battery warranty before purchase."],
      next: ["Use Solar ROI if you plan to charge from rooftop solar.", "Use Carbon Footprint to compare grid and petrol emissions."]
    },
    "energy-audit": {
      title: "Home audit shortcuts",
      copy: "Use the audit to rank savings by impact before spending on solar or batteries.",
      presets: [
        { label: "Efficient flat", values: { monthlyBill: 18000, homeSizeSqm: 70, occupants: 2, acUnits: 0, lightingType: "led", waterHeater: "none" } },
        { label: "Family home", values: { monthlyBill: 60000, homeSizeSqm: 140, occupants: 5, acUnits: 2, lightingType: "mix", waterHeater: "electric" } },
        { label: "AC-heavy home", values: { monthlyBill: 120000, homeSizeSqm: 180, occupants: 5, acUnits: 3, lightingType: "incandescent", waterHeater: "electric" } }
      ],
      checklist: ["Fix lighting, standby, and AC settings before buying larger systems.", "Use annual average bills if cooling is seasonal.", "Ask whether savings are comfort-neutral or require behaviour change."],
      next: ["Move the reduced bill into Solar ROI.", "Use Appliance Power to find the top consumers."]
    },
    "backup-duration": {
      title: "Existing backup runtime test",
      copy: "Check what your battery can actually run after depth of discharge and inverter losses.",
      presets: [
        { label: "Small inverter", values: { batteryKWh: 1.2, batteryAh: 0, systemVoltage: 24, loadWatts: 180, batteryType: "lead" } },
        { label: "5 kWh lithium", values: { batteryKWh: 5.12, batteryAh: 0, systemVoltage: 48, loadWatts: 800, batteryType: "lithium" } },
        { label: "Office rack", values: { batteryKWh: 10, batteryAh: 0, systemVoltage: 48, loadWatts: 2500, batteryType: "lithium" } }
      ],
      checklist: ["Use continuous watts, not inverter nameplate.", "Old lead-acid batteries may deliver far less capacity.", "Test critical-only load before a long outage."],
      next: ["Use Battery Sizing if runtime is too short.", "Use Solar Sizing to model recharge from panels."]
    },
    "diesel-vs-solar-farm": {
      title: "Farm pump comparison",
      copy: "Solar pumps win when irrigation hours and diesel trips are predictable. Test the same pump duty cycle.",
      presets: [
        { label: "Smallholder", values: { farmHa: 2, pumpKW: 2, dailyPumpHrs: 4 } },
        { label: "Vegetable farm", values: { farmHa: 5, pumpKW: 3, dailyPumpHrs: 6 } },
        { label: "Commercial farm", values: { farmHa: 20, pumpKW: 7.5, dailyPumpHrs: 8 } }
      ],
      checklist: ["Use dry-season pumping hours.", "Match solar pump size to water requirement, not only hectares.", "Include fuel transport and downtime in diesel cost."],
      next: ["Use Mini-Grid if multiple farms or homes share supply.", "Use Carbon Footprint for emissions savings."]
    },
    "mini-grid-feasibility": {
      title: "Mini-grid viability model",
      copy: "Load factor matters. Productive-use businesses can make a village mini-grid bankable.",
      presets: [
        { label: "Village basic", values: { households: 120, businesses: 8, avgKWhHousehold: 30, avgKWhBusiness: 100 } },
        { label: "Productive use", values: { households: 250, businesses: 35, avgKWhHousehold: 60, avgKWhBusiness: 250 } },
        { label: "Anchor heavy", values: { households: 400, businesses: 60, avgKWhHousehold: 100, avgKWhBusiness: 500 } }
      ],
      checklist: ["Separate household, business, school, clinic, and telecom loads.", "Higher daytime productive use improves revenue quality.", "Grant funding can change viability more than tariff tweaks."],
      next: ["Use Solar Sizing for anchor loads.", "Use Outage Cost for businesses that would buy power first."]
    },
    "appliance-power": {
      title: "Appliance cost diagnosis",
      copy: "The fastest savings come from finding the top consumer and hidden standby loads.",
      presets: [
        { label: "Basic home", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 6, qty: 6, standbyWatts: 0 }, { name: "Ceiling Fan", watts: 75, hours: 8, qty: 2, standbyWatts: 0 }, { name: "32\" LED TV", watts: 60, hours: 5, qty: 1, standbyWatts: 3 }, { name: "Smartphone Charger", watts: 10, hours: 4, qty: 3, standbyWatts: 0.5 }, { name: "Fridge (200L)", watts: 120, hours: 24, qty: 1, standbyWatts: 0 }] },
        { label: "Cooling-heavy", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 6, qty: 8, standbyWatts: 0 }, { name: "1.5HP Air Conditioner", watts: 1200, hours: 6, qty: 1, standbyWatts: 5 }, { name: "Ceiling Fan", watts: 75, hours: 8, qty: 2, standbyWatts: 0 }, { name: "Fridge (200L)", watts: 120, hours: 24, qty: 1, standbyWatts: 0 }, { name: "Router (WiFi)", watts: 12, hours: 24, qty: 1, standbyWatts: 0 }] },
        { label: "Small shop", appliances: [{ name: "LED Bulb (9W)", watts: 9, hours: 10, qty: 10, standbyWatts: 0 }, { name: "Chest freezer", watts: 180, hours: 24, qty: 1, standbyWatts: 0 }, { name: "POS and router", watts: 35, hours: 10, qty: 1, standbyWatts: 3 }, { name: "Standing fan", watts: 50, hours: 10, qty: 2, standbyWatts: 0 }, { name: "Security lights", watts: 20, hours: 12, qty: 2, standbyWatts: 0 }] }
      ],
      checklist: ["Enter watts from appliance labels where possible.", "Fridges, pumps, irons, kettles, and ACs need honest hours.", "Add standby watts for TVs, decoders, routers, and chargers."],
      next: ["Use the monthly kWh result in Electricity Tariff.", "Use top consumers to decide what goes into Solar Sizing."]
    },
    "biogas-roi": {
      title: "Biogas farm economics",
      copy: "Biogas works best when manure is reliable, cooking demand is daily, and slurry has farm value.",
      presets: [
        { label: "Small dairy", values: { livestockType: "cattle", livestockCount: 3, cookingHours: 3 } },
        { label: "Pig unit", values: { livestockType: "pig", livestockCount: 20, cookingHours: 4 } },
        { label: "Poultry farm", values: { livestockType: "chicken", livestockCount: 500, cookingHours: 3 } }
      ],
      checklist: ["Confirm daily manure collection before budgeting.", "Value bioslurry only if you can use or sell it.", "Kitchen distance and water availability affect installation cost."],
      next: ["Compare monthly saving with LPG Cost.", "Use Carbon Footprint to quantify emissions reduction."]
    }
  };

  var SOURCE_PACKS = {
    energy: {
      note: "Competitor check: strong energy tools pair calculators with assumptions, source links, and exportable results. AfroTools keeps that flow fast, African-market focused, and usable without an account.",
      links: [
        { label: "IEA Africa access finance", href: "https://www.iea.org/reports/financing-electricity-access-in-africa/executive-summary" },
        { label: "IRENA off-grid access", href: "https://www.irena.org/Energy-Transition/Policy/Off-grid-for-Energy-Access" }
      ]
    },
    solar: {
      note: "Benchmarked against PVWatts and solar marketplaces: users expect loss assumptions, payback framing, and quote-ready outputs. Confirm local installer prices before spending.",
      links: [
        { label: "PVWatts solar model", href: "https://pvwatts.nrel.gov/" },
        { label: "EnergySage solar calculator", href: "https://www.energysage.com/solar/calculator/" }
      ]
    },
    generator: {
      note: "Generator competitors emphasize load percentage and fuel type. AfroTools adds African fuel prices, daily hours, outage cost, and solar comparison paths.",
      links: [
        { label: "Generator fuel benchmark", href: "https://fuelgo.co/generator-fuel-calculator/" },
        { label: "HOMER hybrid modelling", href: "https://wn.ul-renewables.com/homer/pro" }
      ]
    },
    audit: {
      note: "Energy audit tools work best when they explain what to verify in the home. Treat these results as a triage list before buying bigger solar or battery systems.",
      links: [
        { label: "DOE home energy assessments", href: "https://www.energy.gov/energysaver/home-energy-assessments" },
        { label: "LBNL Home Energy Saver", href: "https://homes.lbl.gov/home-energy-saver/" }
      ]
    },
    carbon: {
      note: "Carbon tools need transparent factors and personal inputs. Use actual litres, kWh, and LPG kilograms where possible.",
      links: [
        { label: "EPA carbon calculator", href: "https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator" },
        { label: "EPA GHG factors", href: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" }
      ]
    },
    miniGrid: {
      note: "Mini-grid competitors model load profiles and hybrid dispatch. This calculator stays lightweight, so verify anchor loads, daytime demand, and subsidy assumptions before procurement.",
      links: [
        { label: "World Bank ESMAP mini-grids", href: "https://www.worldbank.org/en/results/2020/11/11/esmap-global-facility-on-mini-grids-scaling-up-mini-grid-markets-to-provide-electricity-to-half-a-billion-people-by-2030" },
        { label: "HOMER microgrid software", href: "https://wn.ul-renewables.com/homer/pro" }
      ]
    },
    bioenergy: {
      note: "Biogas and LPG decisions depend on feedstock, cooking demand, and indoor-air context. Confirm manure collection and actual refill prices.",
      links: [
        { label: "FAO sustainable bioenergy", href: "https://www.fao.org/energy/areas-of-work/sustainable-bioenergy-from-agriculture/en" },
        { label: "FAO biogas training manual", href: "https://www.fao.org/4/ae897e/ae897e00.htm" }
      ]
    },
    utility: {
      note: "Utility calculators are most useful when they pair bill math with meter evidence. Keep bill photos, meter readings, token receipts, and usage notes together.",
      links: [
        { label: "IEA demand estimation", href: "https://www.iea.org/commentaries/africas-electricity-access-planners-turn-to-geospatial-mapping" },
        { label: "IEA electricity access in Africa", href: "https://www.iea.org/reports/financing-electricity-access-in-africa/executive-summary" }
      ]
    }
  };

  var SOURCE_BY_SLUG = {
    "electricity-tariff": "utility",
    "prepaid-meter": "utility",
    "electricity-bill-verify": "utility",
    "water-bill": "utility",
    "solar-roi": "solar",
    "solar-sizing": "solar",
    "battery-sizing": "solar",
    "backup-duration": "solar",
    "solar-vs-generator": "generator",
    "generator-fuel": "generator",
    "outage-cost": "generator",
    "diesel-vs-solar-farm": "generator",
    "energy-audit": "audit",
    "appliance-power": "audit",
    "carbon-footprint-energy": "carbon",
    "ev-charging": "carbon",
    "mini-grid-feasibility": "miniGrid",
    "gas-lpg-cost": "bioenergy",
    "paygo-solar": "solar",
    "biogas-roi": "bioenergy"
  };

  var DASHBOARD_STORAGE_KEY = "afro_energy_reports";
  var LEAD_EMAIL_KEY = "afrotools_lead_email";
  var LEGACY_LEAD_KEY = "afrotools-email-gate";

  var HUB_WORKFLOWS = [
    {
      title: "Check a bill before you pay",
      copy: "Start with tariff math, verify the bill from meter readings, then find the appliance or fixed charge driving the cost.",
      steps: [
        { label: "Tariff", href: "/tools/electricity-tariff/" },
        { label: "Bill verifier", href: "/tools/electricity-bill-verify/" },
        { label: "Appliance power", href: "/tools/appliance-power/" }
      ]
    },
    {
      title: "Choose generator, battery, or solar",
      copy: "Turn outage hours into fuel spend, compare five-year ownership, then size the battery or solar kit around critical loads.",
      steps: [
        { label: "Generator fuel", href: "/tools/generator-fuel/" },
        { label: "Solar vs generator", href: "/tools/solar-vs-generator/" },
        { label: "Battery sizing", href: "/tools/battery-sizing/" }
      ]
    },
    {
      title: "Prepare a quote-ready solar brief",
      copy: "Use a load list, estimate solar ROI, save the result, then export a PDF that an installer can price consistently.",
      steps: [
        { label: "Solar sizing", href: "/tools/solar-sizing/" },
        { label: "Solar ROI", href: "/tools/solar-roi/" },
        { label: "Dashboard", href: "/dashboard/" }
      ]
    },
    {
      title: "Build a business resilience case",
      copy: "Quantify outage losses, compare backup options, and keep a saved report for procurement or landlord discussions.",
      steps: [
        { label: "Outage cost", href: "/tools/outage-cost/" },
        { label: "Solar vs generator", href: "/tools/solar-vs-generator/" },
        { label: "Backup duration", href: "/tools/backup-duration/" }
      ]
    },
    {
      title: "Plan a productive-use mini-grid",
      copy: "Model community demand, test farm pump economics, then quantify carbon and business value before deeper engineering.",
      steps: [
        { label: "Mini-grid", href: "/tools/mini-grid-feasibility/" },
        { label: "Farm pump", href: "/tools/diesel-vs-solar-farm/" },
        { label: "Carbon", href: "/tools/carbon-footprint-energy/" }
      ]
    }
  ];

  var APP_UPGRADES = {
    "electricity-tariff": {
      competitor: "Utility bill estimators and tariff tables",
      upgrade: "Added scenario shortcuts, bill-evidence checklist, source links, and a path from tariff estimate into bill verification, appliance diagnosis, and solar ROI.",
      reportTitle: "Electricity tariff estimate",
      nextTools: [
        { label: "Verify a high bill", href: "/tools/electricity-bill-verify/", reason: "compare the expected kWh charge with meter readings" },
        { label: "Find top loads", href: "/tools/appliance-power/", reason: "turn monthly kWh into appliance-level action" },
        { label: "Test solar ROI", href: "/tools/solar-roi/", reason: "use the bill estimate as the avoided-cost input" }
      ]
    },
    "solar-roi": {
      competitor: "PVWatts and EnergySage",
      upgrade: "Added PVWatts-style assumption prompts, quote-ready summary export, dashboard save, and a follow-on path into load sizing and generator comparison.",
      reportTitle: "Solar ROI estimate",
      nextTools: [
        { label: "Size the system", href: "/tools/solar-sizing/", reason: "build a load list before asking installers for quotes" },
        { label: "Compare generator", href: "/tools/solar-vs-generator/", reason: "check fuel and maintenance against solar ownership cost" },
        { label: "Save in dashboard", href: "/dashboard/", reason: "keep your scenario with other energy plans" }
      ]
    },
    "prepaid-meter": {
      competitor: "Prepaid token calculators and utility recharge estimators",
      upgrade: "Added recharge-size presets, fixed-charge reminders, expected-units report export, and links into appliance usage and bill verification.",
      reportTitle: "Prepaid meter token estimate",
      nextTools: [
        { label: "Estimate usage", href: "/tools/appliance-power/", reason: "see how long the token should last" },
        { label: "Verify bill logic", href: "/tools/electricity-bill-verify/", reason: "check whether charges match meter evidence" },
        { label: "Plan solar offset", href: "/tools/solar-roi/", reason: "convert token spend into avoided-cost savings" }
      ]
    },
    "generator-fuel": {
      competitor: "Generator fuel calculators and HOMER hybrid modeling",
      upgrade: "Added load-pattern presets, fuel-vs-grid-vs-solar handoff, report actions for the custom planner, and a dashboard-save path.",
      reportTitle: "Generator fuel estimate",
      nextTools: [
        { label: "Compare solar", href: "/tools/solar-vs-generator/", reason: "turn daily fuel spend into five-year ownership math" },
        { label: "Cost outages", href: "/tools/outage-cost/", reason: "see whether backup power is worth the spend" },
        { label: "Check runtime", href: "/tools/backup-duration/", reason: "compare generator runtime with battery backup" }
      ]
    },
    "solar-vs-generator": {
      competitor: "HOMER and installer ownership-cost worksheets",
      upgrade: "Added total-cost decision prompts, critical-load next steps, source links, dashboard save, and PDF export for procurement conversations.",
      reportTitle: "Solar versus generator comparison",
      nextTools: [
        { label: "Size batteries", href: "/tools/battery-sizing/", reason: "model the critical-load backup option" },
        { label: "Run solar ROI", href: "/tools/solar-roi/", reason: "separate grid-bill savings from outage backup savings" },
        { label: "Estimate fuel", href: "/tools/generator-fuel/", reason: "check whether current fuel spend is realistic" }
      ]
    },
    "electricity-bill-verify": {
      competitor: "Utility bill dispute checkers",
      upgrade: "Added a meter-evidence workflow, copyable dispute summary, dashboard storage, and next steps for usage reduction or formal dispute support.",
      reportTitle: "Electricity bill verification",
      nextTools: [
        { label: "Audit usage", href: "/tools/energy-audit/", reason: "if the meter usage is real, find the savings levers" },
        { label: "Check appliances", href: "/tools/appliance-power/", reason: "identify the loads causing high kWh" },
        { label: "Save evidence", href: "/dashboard/", reason: "keep the dispute summary with your workspace" }
      ]
    },
    "water-bill": {
      competitor: "Water utility bill and household-use calculators",
      upgrade: "Added household-use benchmarks, leak-check prompts, saved report support, and budget handoff language for utility planning.",
      reportTitle: "Water bill estimate",
      nextTools: [
        { label: "Save result", href: "/dashboard/", reason: "track monthly water and electricity plans together" },
        { label: "Check energy bill", href: "/tools/electricity-tariff/", reason: "complete the household utilities budget" },
        { label: "Audit home energy", href: "/tools/energy-audit/", reason: "pair water-heating and electricity savings" }
      ]
    },
    "gas-lpg-cost": {
      competitor: "Clean-cooking cost calculators and fuel-switching guides",
      upgrade: "Added cylinder-frequency presets, cost-per-day framing, biogas/carbon handoffs, and a PDF summary for household budgeting.",
      reportTitle: "LPG cooking cost estimate",
      nextTools: [
        { label: "Compare biogas", href: "/tools/biogas-roi/", reason: "for livestock homes and farms, test a fuel switch" },
        { label: "Estimate carbon", href: "/tools/carbon-footprint-energy/", reason: "compare cooking fuel emissions" },
        { label: "Save budget", href: "/dashboard/", reason: "keep cooking energy with utility plans" }
      ]
    },
    "paygo-solar": {
      competitor: "GSMA PAYG solar journeys and GOGLA consumer protection guidance",
      upgrade: "Added affordability prompts for deposits, payment cadence, lockout rules, ownership period, support, dashboard save, and exportable PAYG comparison.",
      reportTitle: "PayGo solar affordability estimate",
      nextTools: [
        { label: "Size loads", href: "/tools/solar-sizing/", reason: "confirm the plan supports the appliances you need" },
        { label: "Compare generator", href: "/tools/generator-fuel/", reason: "test PAYG payments against current fuel spend" },
        { label: "Save plan", href: "/dashboard/", reason: "track offers before signing" }
      ]
    },
    "outage-cost": {
      competitor: "Business continuity and outage-loss calculators",
      upgrade: "Added sector presets, procurement-ready report actions, and a path from lost revenue into solar, generator, or battery choices.",
      reportTitle: "Business outage cost estimate",
      nextTools: [
        { label: "Compare backup", href: "/tools/solar-vs-generator/", reason: "see which option can pay for itself" },
        { label: "Size battery", href: "/tools/battery-sizing/", reason: "cover critical equipment first" },
        { label: "Save case", href: "/dashboard/", reason: "keep the procurement note in your workspace" }
      ]
    },
    "solar-sizing": {
      competitor: "PVWatts, installer load sheets, and solar quote tools",
      upgrade: "Added appliance presets, quote-ready load-list reporting, PDF export, and a handoff into ROI and backup-duration checks.",
      reportTitle: "Solar system sizing report",
      nextTools: [
        { label: "Run ROI", href: "/tools/solar-roi/", reason: "turn the size into payback and savings" },
        { label: "Check battery runtime", href: "/tools/backup-duration/", reason: "test whether the battery meets outage needs" },
        { label: "Save load list", href: "/dashboard/", reason: "reuse the scenario when comparing installer quotes" }
      ]
    },
    "battery-sizing": {
      competitor: "Inverter and battery runtime calculators",
      upgrade: "Added critical-load presets, chemistry reminders, exportable sizing notes, dashboard save, and solar recharge handoff.",
      reportTitle: "Battery sizing estimate",
      nextTools: [
        { label: "Check runtime", href: "/tools/backup-duration/", reason: "test an existing or quoted battery bank" },
        { label: "Size solar recharge", href: "/tools/solar-sizing/", reason: "confirm panel size for daily recharge" },
        { label: "Compare generator", href: "/tools/solar-vs-generator/", reason: "see if batteries beat fuel spend" }
      ]
    },
    "carbon-footprint-energy": {
      competitor: "EPA household carbon calculator",
      upgrade: "Added source-transparent factor prompts, generator/LPG/biomass separation, PDF export, and cleaner-energy handoffs.",
      reportTitle: "Home energy carbon footprint",
      nextTools: [
        { label: "Reduce grid and fuel", href: "/tools/solar-roi/", reason: "model the biggest energy reduction lever" },
        { label: "Compare cooking", href: "/tools/gas-lpg-cost/", reason: "test cooking fuel changes" },
        { label: "Save footprint", href: "/dashboard/", reason: "track reduction scenarios over time" }
      ]
    },
    "ev-charging": {
      competitor: "EV charging cost and fuel-comparison calculators",
      upgrade: "Added commute presets, home-vs-fast charging guidance, petrol comparison workflow, report export, and solar charging handoff.",
      reportTitle: "EV charging cost estimate",
      nextTools: [
        { label: "Solar charging ROI", href: "/tools/solar-roi/", reason: "test rooftop charging economics" },
        { label: "Carbon impact", href: "/tools/carbon-footprint-energy/", reason: "compare grid charging and petrol emissions" },
        { label: "Save scenario", href: "/dashboard/", reason: "keep vehicle energy scenarios together" }
      ]
    },
    "energy-audit": {
      competitor: "DOE home energy assessments and LBNL Home Energy Saver",
      upgrade: "Added audit-before-solar framing, high-impact checklists, saved reports, PDF export, and appliance diagnosis next steps.",
      reportTitle: "Home energy audit summary",
      nextTools: [
        { label: "Find top appliances", href: "/tools/appliance-power/", reason: "convert the audit into device-level action" },
        { label: "Run solar ROI", href: "/tools/solar-roi/", reason: "use the reduced bill as the better solar baseline" },
        { label: "Save audit", href: "/dashboard/", reason: "track efficiency work before buying equipment" }
      ]
    },
    "backup-duration": {
      competitor: "Battery runtime calculators",
      upgrade: "Added usable-capacity reminders, chemistry presets, PDF runtime report, dashboard save, and sizing handoffs.",
      reportTitle: "Backup runtime estimate",
      nextTools: [
        { label: "Resize battery", href: "/tools/battery-sizing/", reason: "if runtime is too short, calculate the right bank" },
        { label: "Size solar recharge", href: "/tools/solar-sizing/", reason: "model daily panel recharge" },
        { label: "Estimate outage value", href: "/tools/outage-cost/", reason: "for business loads, compare runtime value with revenue risk" }
      ]
    },
    "diesel-vs-solar-farm": {
      competitor: "Solar pump payback sheets and hybrid-energy modeling tools",
      upgrade: "Added farm-duty presets, fuel-transport reminders, saved reports, PDF export, and mini-grid/carbon handoffs.",
      reportTitle: "Diesel versus solar pump estimate",
      nextTools: [
        { label: "Mini-grid case", href: "/tools/mini-grid-feasibility/", reason: "test shared power for farms and nearby businesses" },
        { label: "Carbon savings", href: "/tools/carbon-footprint-energy/", reason: "quantify avoided diesel emissions" },
        { label: "Save farm plan", href: "/dashboard/", reason: "keep pump scenarios for grant or lender conversations" }
      ]
    },
    "mini-grid-feasibility": {
      competitor: "HOMER Pro and World Bank mini-grid project workflows",
      upgrade: "Added productive-use prompts, anchor-load reminders, dashboard save, PDF export, and follow-on sizing/outage workflows.",
      reportTitle: "Mini-grid feasibility snapshot",
      nextTools: [
        { label: "Size anchor load", href: "/tools/solar-sizing/", reason: "model schools, clinics, pumps, or telecom loads" },
        { label: "Business outage value", href: "/tools/outage-cost/", reason: "identify the customers that can pay first" },
        { label: "Save mini-grid case", href: "/dashboard/", reason: "keep the early feasibility note for partners" }
      ]
    },
    "appliance-power": {
      competitor: "Home energy saver and appliance consumption calculators",
      upgrade: "Added African load presets, standby-load prompts, report export, dashboard save, and tariff/solar handoffs.",
      reportTitle: "Appliance power diagnosis",
      nextTools: [
        { label: "Estimate bill", href: "/tools/electricity-tariff/", reason: "turn appliance kWh into monthly tariff cost" },
        { label: "Build solar load list", href: "/tools/solar-sizing/", reason: "move essential loads into system sizing" },
        { label: "Save diagnosis", href: "/dashboard/", reason: "track savings opportunities" }
      ]
    },
    "biogas-roi": {
      competitor: "FAO biogas guidance and clean-cooking calculators",
      upgrade: "Added livestock presets, feedstock reliability prompts, LPG/carbon handoffs, saved reports, and PDF export for farm planning.",
      reportTitle: "Biogas ROI estimate",
      nextTools: [
        { label: "Compare LPG", href: "/tools/gas-lpg-cost/", reason: "check the cooking-fuel savings baseline" },
        { label: "Carbon benefit", href: "/tools/carbon-footprint-energy/", reason: "estimate emissions reduction" },
        { label: "Save farm case", href: "/dashboard/", reason: "keep the project note for installer or cooperative review" }
      ]
    }
  };

  var lastPresetLabel = "";

  function currentSlug() {
    var path = window.location.pathname.replace(/\/+$/, "/");
    if (path === "/energy/") return "energy";
    var match = path.match(/\/tools\/([^\/]+)\//);
    return match ? match[1] : "";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function setValue(id, value) {
    var node = document.getElementById(id);
    if (!node) return;
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applyPreset(preset) {
    lastPresetLabel = preset.label || "";
    Object.keys(preset.values || {}).forEach(function (key) {
      setValue(key, preset.values[key]);
    });
    if (preset.appliances && preset.appliances.length) {
      window.dispatchEvent(new CustomEvent("afro-energy-appliance-preset", {
        detail: { appliances: preset.appliances }
      }));
    }
    var calc = document.getElementById("calcBtn");
    if (calc) calc.focus();
  }

  function renderList(items) {
    var list = el("ul", "en-assistant-list");
    (items || []).forEach(function (item) {
      list.appendChild(el("li", "", item));
    });
    return list;
  }

  function sourcePack(slug) {
    return SOURCE_PACKS[SOURCE_BY_SLUG[slug] || slug] || SOURCE_PACKS.energy;
  }

  function renderSourcePanel(slug) {
    var pack = sourcePack(slug);
    var details = el("details", "en-source-panel");
    var summary = el("summary", "", "Assumptions and competitor cues");
    details.appendChild(summary);
    details.appendChild(el("p", "en-source-note", pack.note));
    if (pack.links && pack.links.length) {
      var links = el("div", "en-source-links");
      pack.links.forEach(function (source) {
        var a = el("a", "", source.label);
        a.href = source.href;
        a.target = "_blank";
        a.rel = "noopener";
        links.appendChild(a);
      });
      details.appendChild(links);
    }
    return details;
  }

  function renderUpgradeNote(slug) {
    var upgrade = APP_UPGRADES[slug];
    if (!upgrade) return null;
    var wrap = el("div", "en-competitor-note");
    wrap.appendChild(el("div", "en-assistant-eyebrow", "Competitor check"));
    wrap.appendChild(el("p", "", upgrade.competitor + ": " + upgrade.upgrade));
    return wrap;
  }

  function renderHubCommandCenter() {
    var section = el("section", "en-hub-command");
    section.setAttribute("aria-labelledby", "energy-command-center-title");
    var head = el("div", "en-hub-command-head");
    var text = el("div", "");
    text.appendChild(el("div", "en-assistant-eyebrow", "Energy command center"));
    var title = el("h2", "", "Pick a workflow, not just a calculator");
    title.id = "energy-command-center-title";
    text.appendChild(title);
    text.appendChild(el("p", "", "Competitor tools usually stop at one output. AfroTools now carries each result into the next practical energy decision, with saved reports and PDF exports for quotes, disputes, and procurement."));
    head.appendChild(text);
    var dashboard = el("a", "en-dashboard-pill", "Open saved energy plans");
    dashboard.href = "/dashboard/";
    head.appendChild(dashboard);
    section.appendChild(head);

    var grid = el("div", "en-hub-path-grid");
    HUB_WORKFLOWS.forEach(function (flow) {
      var card = el("article", "en-hub-path-card");
      card.appendChild(el("h3", "", flow.title));
      card.appendChild(el("p", "", flow.copy));
      var steps = el("div", "en-hub-path-steps");
      flow.steps.forEach(function (step, index) {
        var a = el("a", "", (index + 1) + ". " + step.label);
        a.href = step.href;
        steps.appendChild(a);
      });
      card.appendChild(steps);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  function buildPanel(cfg, slug) {
    var panel = el("section", "en-assistant-panel" + (slug === "energy" ? " en-hub-guide" : ""));
    panel.setAttribute("aria-label", "Energy tool guidance");
    panel.appendChild(el("div", "en-assistant-eyebrow", slug === "energy" ? "Energy workflow" : "Quick scenarios"));
    panel.appendChild(el("h2", "en-assistant-title", cfg.title));
    panel.appendChild(el("p", "en-assistant-copy", cfg.copy));

    if (cfg.presets && cfg.presets.length) {
      var presets = el("div", "en-assistant-presets");
      cfg.presets.forEach(function (preset) {
        var button = el("button", "en-preset-btn", preset.label);
        button.type = "button";
        button.addEventListener("click", function () { applyPreset(preset); });
        presets.appendChild(button);
      });
      panel.appendChild(presets);
    }

    var grid = el("div", "en-assistant-grid");
    if (cfg.checklist && cfg.checklist.length) {
      var check = el("div");
      check.appendChild(el("div", "en-assistant-eyebrow", "Check before deciding"));
      check.appendChild(renderList(cfg.checklist));
      grid.appendChild(check);
    }
    if (cfg.next && cfg.next.length) {
      var next = el("div");
      next.appendChild(el("div", "en-assistant-eyebrow", "Next useful move"));
      next.appendChild(renderList(cfg.next));
      grid.appendChild(next);
    }
    if (grid.children.length) panel.appendChild(grid);
    var upgrade = renderUpgradeNote(slug);
    if (upgrade) panel.appendChild(upgrade);
    panel.appendChild(renderSourcePanel(slug));
    if (cfg.note) panel.appendChild(el("p", "en-assistant-note", cfg.note));
    return panel;
  }

  function injectAssistant() {
    if (document.querySelector(".en-assistant-panel")) return;
    var slug = currentSlug();
    var cfg = CONFIG[slug];
    if (!cfg) return;
    var panel = buildPanel(cfg, slug);
    var cardBody = document.querySelector(".en-card-body");
    if (cardBody) {
      var target = cardBody.querySelector(".en-form-grid") || cardBody.firstElementChild;
      if (target && target.nextSibling) cardBody.insertBefore(panel, target.nextSibling);
      else cardBody.insertBefore(panel, cardBody.firstChild);
      return;
    }
    var hub = document.querySelector(".en-hub .container") || document.querySelector(".en-hub");
    if (hub) {
      var label = hub.querySelector(".en-region-label") || hub.firstElementChild;
      if (label) hub.insertBefore(panel, label);
      else hub.appendChild(panel);
      if (slug === "energy" && !document.querySelector(".en-hub-command") && !document.querySelector(".en-home-command")) {
        hub.insertBefore(renderHubCommandCenter(), panel.nextSibling);
      }
    }
  }

  function injectEnhancementStyles() {
    if (document.querySelector('link[data-afro-energy-enhancements="true"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/energy-competitive.css";
    link.setAttribute("data-afro-energy-enhancements", "true");
    document.head.appendChild(link);
  }

  function renderObservations(target, observations, title) {
    if (!target || !observations || !observations.length) return;
    target.textContent = "";
    target.appendChild(el("h3", "", title || "Calculation Notes"));
    target.appendChild(renderList(observations));
    target.style.display = "block";
    injectReportActions();
  }

  function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function reportTitle(slug) {
    var upgrade = APP_UPGRADES[slug] || {};
    var h1 = cleanText((document.querySelector("h1") || {}).textContent);
    return upgrade.reportTitle || h1 || "AfroTools energy report";
  }

  function safeJson(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function readStoredReports() {
    var items = [];
    try {
      items = safeJson(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "[]", []);
    } catch (err) {
      items = [];
    }
    return Array.isArray(items) ? items : [];
  }

  function writeStoredReports(items) {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function flashButton(button, label, ok) {
    if (!button) return;
    var original = button.getAttribute("data-label") || button.textContent;
    button.setAttribute("data-label", original);
    button.textContent = label;
    if (ok === false) button.classList.add("en-report-btn-error");
    window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove("en-report-btn-error");
    }, 1800);
  }

  function collectResultMetrics(results) {
    var lines = [];
    results.querySelectorAll(".en-metric,.gf-metric").forEach(function (card) {
      var label = cleanText((card.querySelector(".en-metric-label,span") || {}).textContent);
      var value = cleanText((card.querySelector(".en-metric-value,strong") || {}).textContent);
      var unit = cleanText((card.querySelector(".en-metric-unit") || {}).textContent);
      if (label && value && value !== "-") lines.push(label + ": " + [value, unit].filter(Boolean).join(" "));
    });
    results.querySelectorAll(".gf-card p,.en-tip-text").forEach(function (node) {
      var text = cleanText(node.textContent);
      if (text && lines.indexOf(text) === -1) lines.push(text);
    });
    return lines;
  }

  function buildReport(results) {
    var slug = currentSlug();
    var lines = [];
    var heading = reportTitle(slug);
    lines.push(heading);
    lines.push("Route: " + window.location.pathname);
    if (lastPresetLabel) lines.push("Scenario: " + lastPresetLabel);

    var hero = results.querySelector(".en-res-hero,.en-results-hero");
    if (hero) {
      var label = cleanText((hero.querySelector(".en-res-label,.en-results-hero-label") || {}).textContent);
      var amount = cleanText((hero.querySelector(".en-res-amount,.en-results-hero-value") || {}).textContent);
      var sub = cleanText((hero.querySelector(".en-res-sub,.en-results-hero-sub") || {}).textContent);
      if (label || amount) lines.push("Headline: " + [label, amount, sub].filter(Boolean).join(" | "));
    }

    collectResultMetrics(results).slice(0, 10).forEach(function (line) {
      lines.push(line);
    });

    results.querySelectorAll("table tr").forEach(function (row) {
      var cells = Array.prototype.map.call(row.children, function (cell) { return cleanText(cell.textContent); }).filter(Boolean);
      if (cells.length >= 2 && cells.join(" ").indexOf(String.fromCharCode(8212)) === -1) lines.push(cells.join(": "));
    });

    var notes = Array.prototype.map.call(results.querySelectorAll(".en-observations li"), function (li) {
      return cleanText(li.textContent);
    }).filter(Boolean);
    if (notes.length) {
      lines.push("Notes:");
      notes.slice(0, 8).forEach(function (note) { lines.push("- " + note); });
    }

    var pack = sourcePack(slug);
    lines.push("Assumption note: " + pack.note);
    if (pack.links && pack.links.length) {
      lines.push("Sources:");
      pack.links.forEach(function (source) {
        lines.push("- " + source.label + ": " + source.href);
      });
    }
    lines.push("Use this as an estimate. Confirm official tariffs, installer prices, fuel costs, and equipment specs before buying.");
    return lines.join("\n");
  }

  function reportSummary(text) {
    var lines = String(text || "").split("\n").map(cleanText).filter(Boolean);
    var preferred = lines.filter(function (line) {
      return line.indexOf("Headline:") === 0 || line.indexOf(":") > 0;
    }).slice(0, 3).join(" ");
    var summary = preferred || lines.slice(0, 4).join(" ");
    return summary.length > 180 ? summary.slice(0, 177).trim() + "..." : summary;
  }

  function buildEnergyRecord(results) {
    var slug = currentSlug();
    var text = buildReport(results);
    var upgrade = APP_UPGRADES[slug] || {};
    var now = new Date().toISOString();
    return {
      id: "energy-" + (slug || "tool") + "-" + Date.now(),
      slug: slug,
      title: reportTitle(slug),
      summary: reportSummary(text),
      report: text,
      href: window.location.pathname,
      nextTools: upgrade.nextTools || [],
      scenario: lastPresetLabel || "",
      savedAt: now,
      createdAt: now
    };
  }

  function tryWorkspaceSync(record) {
    if (!window.AfroWorkspace || !AfroWorkspace.upsert || !AfroWorkspace.isSignedIn || !AfroWorkspace.isSignedIn()) return;
    AfroWorkspace.upsert({
      itemType: "energy_report",
      itemKey: record.id,
      toolSlug: record.slug,
      title: record.title,
      summary: record.summary,
      href: record.href,
      payload: record,
      meta: { category: "energy", scenario: record.scenario || "" }
    }).catch(function () {});
  }

  function saveEnergyReport(results, button) {
    var record = buildEnergyRecord(results);
    var items = readStoredReports().filter(function (item) { return item && item.id !== record.id; });
    items.unshift(record);
    if (!writeStoredReports(items)) {
      flashButton(button, "Save failed", false);
      return;
    }
    tryWorkspaceSync(record);
    try {
      window.dispatchEvent(new CustomEvent("afro-workspace-change", {
        detail: { action: "upsert", itemType: "energy_report", itemKey: record.id, item: record }
      }));
    } catch (err) {}
    flashButton(button, "Saved to dashboard", true);
  }

  function getStoredLeadEmail() {
    try {
      return localStorage.getItem(LEAD_EMAIL_KEY) || localStorage.getItem(LEGACY_LEAD_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function getAuthEmail() {
    try {
      if (window.AfroAuth && typeof AfroAuth.getUser === "function") {
        var user = AfroAuth.getUser();
        if (user && user.email) return user.email;
      }
      var auth = safeJson(localStorage.getItem("afrotools-auth") || "{}", {});
      return auth && auth.email ? auth.email : "";
    } catch (err) {
      return "";
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  }

  function captureEnergyLead(data) {
    var payload = {
      email: data.email,
      source: "energy-pdf-gate",
      toolSlug: currentSlug(),
      optInDigest: true,
      name: data.name || null,
      role: data.projectType || null,
      industry: "Energy",
      pageUrl: window.location.href,
      referrerUrl: document.referrer || null
    };
    try {
      if (window.AfroTools && typeof AfroTools.captureLeadEnriched === "function") {
        AfroTools.captureLeadEnriched(payload);
      } else {
        fetch("/api/capture-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": "pdf-leads",
          email: data.email,
          name: data.name || "",
          source: "energy-pdf-gate",
          tool: currentSlug(),
          project_type: data.projectType || "",
          page: window.location.pathname
        }).toString()
      }).catch(function () {});
    } catch (err) {}
  }

  function rememberLead(data) {
    try {
      localStorage.setItem(LEAD_EMAIL_KEY, data.email);
      localStorage.setItem(LEGACY_LEAD_KEY, data.email);
    } catch (err) {}
  }

  function showPdfGate(callback) {
    var existing = document.querySelector(".en-gate-overlay");
    if (existing) existing.remove();
    var overlay = el("div", "en-gate-overlay");
    overlay.innerHTML = '<div class="en-gate-card" role="dialog" aria-modal="true" aria-labelledby="en-gate-title">' +
      '<button type="button" class="en-gate-close" aria-label="Close">x</button>' +
      '<div class="en-assistant-eyebrow">PDF report</div>' +
      '<h2 id="en-gate-title">Email this energy report</h2>' +
      '<p>Get a clean PDF for installer quotes, bill disputes, procurement notes, or project handoff. We keep the form short: email is required, project context is optional.</p>' +
      '<form class="en-gate-form">' +
        '<label>Email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>' +
        '<label>Name <span>(optional)</span><input type="text" name="name" autocomplete="name" placeholder="Your name"></label>' +
        '<label>Project type <span>(optional)</span><select name="projectType"><option value="">Select one</option><option>Home backup</option><option>Solar quote</option><option>Business resilience</option><option>Mini-grid or farm</option><option>Bill dispute</option></select></label>' +
        '<label class="en-gate-check"><input type="checkbox" name="optin" checked><span>Send me practical AfroTools energy updates.</span></label>' +
        '<div class="en-gate-error" role="alert"></div>' +
        '<button type="submit" class="en-report-btn">Email and download PDF</button>' +
      '</form>' +
      '<p class="en-gate-fine">No spam. You can unsubscribe anytime.</p>' +
    '</div>';
    document.body.appendChild(overlay);
    var close = overlay.querySelector(".en-gate-close");
    var form = overlay.querySelector("form");
    var email = overlay.querySelector('input[name="email"]');
    var error = overlay.querySelector(".en-gate-error");
    window.setTimeout(function () { if (email) email.focus(); }, 60);
    function remove() { overlay.remove(); document.removeEventListener("keydown", esc); }
    function esc(evt) { if (evt.key === "Escape") remove(); }
    document.addEventListener("keydown", esc);
    close.addEventListener("click", remove);
    overlay.addEventListener("click", function (evt) { if (evt.target === overlay) remove(); });
    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      var data = {
        email: cleanText(email.value),
        name: cleanText((form.querySelector('[name="name"]') || {}).value),
        projectType: cleanText((form.querySelector('[name="projectType"]') || {}).value)
      };
      if (!isValidEmail(data.email)) {
        error.textContent = "Enter a valid email address.";
        email.focus();
        return;
      }
      rememberLead(data);
      captureEnergyLead(data);
      remove();
      callback();
    });
  }

  function ensureJsPdf() {
    return new Promise(function (resolve, reject) {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
        return;
      }
      var existing = document.getElementById("afro-energy-jspdf");
      if (existing) {
        existing.addEventListener("load", function () { resolve(window.jspdf && window.jspdf.jsPDF); });
        existing.addEventListener("error", reject);
        return;
      }
      var script = document.createElement("script");
      script.id = "afro-energy-jspdf";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = function () {
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("jsPDF unavailable"));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function safeFileName(text) {
    return String(text || "energy-report").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "energy-report";
  }

  function generatePdfReport(results, button) {
    var slug = currentSlug();
    var title = reportTitle(slug);
    var text = buildReport(results);
    flashButton(button, "Preparing PDF", true);
    ensureJsPdf().then(function (JsPDF) {
      var doc = new JsPDF({ unit: "pt", format: "a4" });
      var margin = 42;
      var y = 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(title, margin, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Generated by AfroTools Energy on " + new Date().toLocaleDateString(), margin, y);
      y += 28;
      doc.setFontSize(10);
      var lines = doc.splitTextToSize(text, 510);
      lines.forEach(function (line) {
        if (y > 760) {
          doc.addPage();
          y = 48;
        }
        doc.text(line, margin, y);
        y += 14;
      });
      doc.save(safeFileName(title) + ".pdf");
      flashButton(button, "PDF downloaded", true);
    }).catch(function () {
      copyReport(text, button);
      window.setTimeout(function () { window.print(); }, 200);
    });
  }

  function downloadEnergyPdf(results, button) {
    if (getStoredLeadEmail() || getAuthEmail()) {
      generatePdfReport(results, button);
      return;
    }
    showPdfGate(function () {
      generatePdfReport(results, button);
    });
  }

  function copyReport(text, button) {
    function done(ok) {
      var original = button.getAttribute("data-label") || button.textContent;
      button.setAttribute("data-label", original);
      button.textContent = ok ? "Copied" : "Copy failed";
      window.setTimeout(function () { button.textContent = original; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
      return;
    }
    var area = el("textarea", "en-copy-buffer");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { done(document.execCommand("copy")); } catch (err) { done(false); }
    document.body.removeChild(area);
  }

  function renderNextStepLinks(slug) {
    var upgrade = APP_UPGRADES[slug];
    if (!upgrade || !upgrade.nextTools || !upgrade.nextTools.length) return null;
    var wrap = el("div", "en-result-next");
    wrap.appendChild(el("div", "en-result-next-title", "Next in this energy workflow"));
    var grid = el("div", "en-result-next-grid");
    upgrade.nextTools.slice(0, 3).forEach(function (step) {
      var a = el("a", "", "");
      a.href = step.href;
      a.appendChild(el("strong", "", step.label));
      a.appendChild(el("span", "", step.reason));
      grid.appendChild(a);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function injectReportActions() {
    document.querySelectorAll(".en-results,.gf-results").forEach(function (results) {
      if (!results.querySelector(".en-result-next")) {
        var next = renderNextStepLinks(currentSlug());
        if (next) results.appendChild(next);
      }
      if (results.querySelector(".en-report-actions")) return;
      var actions = el("div", "en-report-actions");
      var save = el("button", "en-report-btn", "Save to dashboard");
      save.type = "button";
      save.addEventListener("click", function () { saveEnergyReport(results, save); });
      var pdf = el("button", "en-report-btn", "Download PDF report");
      pdf.type = "button";
      pdf.addEventListener("click", function () { downloadEnergyPdf(results, pdf); });
      var copy = el("button", "en-report-btn", "Copy quote summary");
      copy.type = "button";
      copy.addEventListener("click", function () { copyReport(buildReport(results), copy); });
      var print = el("button", "en-report-btn en-report-btn-secondary", "Print");
      print.type = "button";
      print.addEventListener("click", function () { window.print(); });
      actions.appendChild(save);
      actions.appendChild(pdf);
      actions.appendChild(copy);
      actions.appendChild(print);
      results.appendChild(actions);
    });
  }

  window.AfroEnergyTools = window.AfroEnergyTools || {};
  window.AfroEnergyTools.renderObservations = renderObservations;
  window.AfroEnergyTools.injectAssistant = injectAssistant;
  window.AfroEnergyTools.injectReportActions = injectReportActions;
  window.AfroEnergyTools.saveEnergyReport = saveEnergyReport;
  window.AfroEnergyTools.downloadEnergyPdf = downloadEnergyPdf;
  window.AfroEnergyTools.buildReport = buildReport;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectEnhancementStyles();
      injectAssistant();
      injectReportActions();
    });
  } else {
    injectEnhancementStyles();
    injectAssistant();
    injectReportActions();
  }
})();
