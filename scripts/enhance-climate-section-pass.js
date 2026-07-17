#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const COUNTRIES = [
  ["NG", "Nigeria"], ["KE", "Kenya"], ["ZA", "South Africa"], ["GH", "Ghana"], ["EG", "Egypt"],
  ["ET", "Ethiopia"], ["TZ", "Tanzania"], ["UG", "Uganda"], ["RW", "Rwanda"], ["CI", "Cote d'Ivoire"],
  ["CM", "Cameroon"], ["SN", "Senegal"], ["MA", "Morocco"], ["TN", "Tunisia"], ["AO", "Angola"]
].map(([value, label]) => ({ value, label }));

const countryField = {
  id: "country",
  label: "Country preset",
  type: "select",
  options: COUNTRIES,
  help: "Preset factors are planning defaults. Confirm local data before formal reporting."
};

const SHARED_SOURCES = {
  air: [
    { label: "US EPA Air Quality Index", href: "https://aqs.epa.gov/aqsweb/helpfiles/aqi.htm", note: "AQI category structure and pollutant-index method." },
    { label: "EPA AQI activity guidance", href: "https://www.epa.gov/wildfire-smoke-course/using-air-quality-index-aqi-plan-daily-activities", note: "How AQI is used to reduce exposure during high-pollution periods." },
    { label: "WHO household air pollution", href: "https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health", note: "Clean cooking and household smoke health-risk context." }
  ],
  carbon: [
    { label: "Verra VCS project process", href: "https://verra.org/programs/verified-carbon-standard/develop-a-vcs-project/", note: "Validation, verification and issuance flow for VCS projects." },
    { label: "Gold Standard certification", href: "https://globalgoals.goldstandard.org/certify-a-project/", note: "Certification and safeguards process for Gold Standard projects." },
    { label: "IPCC AR6 carbon dioxide removal", href: "https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/", note: "Afforestation, reforestation, soil carbon and other CDR methods." }
  ],
  risk: [
    { label: "World Bank climate risk screening", href: "https://climatescreeningtools.worldbank.org/", note: "Climate and disaster risk screening workflow inspiration." },
    { label: "World Bank climate information resources", href: "https://climatescreeningtools.worldbank.org/climate-information-resources", note: "Hazard layers for flood, drought and climate planning." },
    { label: "World Bank Climate Knowledge Portal", href: "https://climateknowledgeportal.worldbank.org/", note: "Country climate-risk profiles and physical risk context." }
  ],
  water: [
    { label: "UN-Water water scarcity", href: "https://www.unwater.org/water-facts/scarcity/", note: "Water scarcity and stress definitions." },
    { label: "United Nations water facts", href: "https://www.un.org/en/global-issues/water", note: "Basic water-use and access context." },
    { label: "FAO AQUASTAT 2025 snapshot", href: "https://www.fao.org/newsroom/detail/renewable-water-availability-per-person-plunges-7-percent-in-a-decade-as-global-scarcity-deepens--fao-data-shows/en", note: "Renewable water availability and stress trend context." }
  ],
  waste: [
    { label: "UNEP Zero Waste 101", href: "https://www.unep.org/interactives/zero-waste-101/index.html", note: "Waste reduction, circularity and municipal solid waste context." },
    { label: "UNEP Global Waste Management Outlook 2024", href: "https://www.unep.org/resources/global-waste-management-outlook-2024", note: "Waste management cost and circular economy framing." },
    { label: "EPA WARM materials recovery calculator", href: "https://www.epa.gov/waste-reduction-model/policy-and-program-impact-estimator-materials-recovery-greenhouse-gas", note: "Recycling and composting GHG-estimation feature pattern." }
  ],
  ewaste: [
    { label: "Global E-waste Monitor 2024", href: "https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-waste-Monitor-2024.aspx", note: "Global e-waste volumes and formal recycling context." },
    { label: "WHO e-waste and child health", href: "https://www.who.int/news-room/facts-in-pictures/detail/e-waste-and-child-health", note: "Health risks from informal e-waste recycling." },
    { label: "UNEP e-waste overview", href: "https://www.unep.org/news-and-stories/story/electronic-waste-surges-countries-look-answers", note: "Policy and collection challenge context." }
  ],
  forest: [
    { label: "FAO forest emissions and removals", href: "https://www.fao.org/statistics/highlights-archive/highlights-detail/forest-emissions-and-removals.-global--regional-and-country-trends/en", note: "Forest carbon stock change and deforestation-emissions context." },
    { label: "FAO Global Forest Resources Assessment 2025", href: "https://www.fao.org/newsroom/detail/global-deforestation-slows--but-forests-remain-under-pressure--fao-report-shows/en", note: "Forest extent, deforestation and biomass context." },
    { label: "IPCC AR6 mitigation chapter", href: "https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/", note: "Land-based carbon removal and sequestration context." }
  ],
  rain: [
    { label: "NASA drought near-real-time data", href: "https://www.earthdata.nasa.gov/topics/human-dimensions/droughts/near-real-time-data", note: "Drought monitoring and rainfall-deficit feature pattern." },
    { label: "NASA Southern Africa drought case", href: "https://science.nasa.gov/earth/earth-observatory/severe-drought-in-southern-africa-152711/", note: "CHIRPS, FEWS NET and crop-season monitoring context." },
    { label: "World Bank Climate Knowledge Portal", href: "https://climateknowledgeportal.worldbank.org/", note: "Country precipitation and climate profile context." }
  ],
  business: [
    { label: "GRI Standards", href: "https://www.globalreporting.org/standards", note: "Business sustainability impact reporting feature pattern." },
    { label: "GRI Universal Standards", href: "https://www.globalreporting.org/standards/standards-development/universal-standards/", note: "Universal reporting foundations and disclosure readiness." },
    { label: "IFC EDGE green building report", href: "https://www.ifc.org/content/dam/ifc/doc/mgrt/59988-ifc-greenbuildings-report-final-1-30-20.pdf", note: "Energy, water and materials efficiency benchmark inspiration." }
  ],
  cooking: [
    { label: "WHO household air pollution", href: "https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health", note: "Health impact and clean cooking fuel context." },
    { label: "WHO clean cooking policy brief", href: "https://www.who.int/indonesia/news/detail/22-01-2025-clean-cooking-fuels-more-effective-in-cutting-harmful-pollutants--who-policy-brief", note: "Clean fuels and pollutant-reduction context." },
    { label: "EPA GHG equivalencies calculator", href: "https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator", note: "GHG-equivalency feature pattern and caution language." }
  ]
};

const TOOLS = [
  {
    slug: "drought-risk",
    tool: "drought-risk",
    title: "Drought Risk Assessment for African Farms",
    shortName: "Drought Risk Assessment",
    desc: "Estimate drought probability, crop loss, water deficit and mitigation actions for African farms using rainfall anomaly, crop, soil and irrigation inputs.",
    icon: "DR",
    group: "Climate Risk",
    pills: ["Farm planning", "Loss estimate", "Adaptation plan"],
    button: "Assess drought risk",
    intro: "Use this to turn a dry-season concern into a practical planting, irrigation and insurance conversation.",
    fields: [
      countryField,
      { id: "crop", label: "Crop or enterprise", type: "select", options: [
        ["maize", "Maize"], ["rice", "Rice"], ["cassava", "Cassava"], ["cocoa", "Cocoa"], ["sorghum", "Sorghum"], ["vegetables", "Vegetables"], ["livestock", "Livestock"]
      ] },
      { id: "season", label: "Season stage", type: "select", options: [["early", "Early rains"], ["main", "Main rainy season"], ["late", "Late season"], ["dry", "Dry season"]] },
      { id: "rainfallAnomaly", label: "Rainfall anomaly", type: "number", unit: "%", value: -25, help: "Use negative numbers for below-normal rainfall." },
      { id: "irrigation", label: "Irrigation access", type: "select", options: [["none", "None"], ["partial", "Partial"], ["reliable", "Reliable"]] },
      { id: "soil", label: "Soil condition", type: "select", options: [["loam", "Loam or mixed"], ["sandy", "Sandy"], ["clay", "Clay"], ["degraded", "Degraded/low organic matter"]] },
      { id: "area", label: "Area exposed", type: "number", unit: "ha", value: 2 },
      { id: "cropValue", label: "Crop value per ha", type: "number", unit: "USD", value: 1200 }
    ],
    sources: SHARED_SOURCES.rain,
    faqs: [
      ["Is this a weather forecast?", "No. It is a planning screen that turns rainfall anomaly and farm conditions into a risk score. Confirm with local meteorological or extension data."],
      ["Why include soil and irrigation?", "Rainfall alone does not explain loss. Water retention, crop sensitivity and irrigation access change the actual risk on the farm."],
      ["Can this support insurance decisions?", "It can frame the conversation, but formal index insurance needs official rainfall stations or satellite triggers."]
    ]
  },
  {
    slug: "water-scarcity",
    tool: "water-scarcity",
    title: "Water Scarcity and Storage Calculator for Africa",
    shortName: "Water Scarcity Calculator",
    desc: "Estimate shortage days, storage needs, daily demand and water-stress risk for African homes, clinics, schools, farms and businesses.",
    icon: "WS",
    group: "Climate Risk",
    pills: ["Storage sizing", "Shortage days", "Reuse plan"],
    button: "Calculate water buffer",
    intro: "Use this before buying tanks, pumps or water contracts so the storage target matches real shortage days.",
    fields: [
      countryField,
      { id: "useType", label: "Use case", type: "select", options: [["household", "Household"], ["business", "Business"], ["school", "School"], ["clinic", "Clinic"], ["farm", "Small farm"]] },
      { id: "people", label: "People or user units", type: "number", value: 4 },
      { id: "dailyDemand", label: "Daily demand per user", type: "number", unit: "litres", value: 70 },
      { id: "supplyDays", label: "Reliable supply days/week", type: "number", unit: "days", value: 4 },
      { id: "storage", label: "Current storage", type: "number", unit: "litres", value: 500 },
      { id: "reusePct", label: "Reuse or saved demand", type: "number", unit: "%", value: 10 }
    ],
    sources: SHARED_SOURCES.water,
    faqs: [
      ["What does water stress mean here?", "The score combines broad country water-stress context with your local reliability, storage and reuse inputs."],
      ["Does this replace a plumbing design?", "No. It gives a first-pass storage and demand target. Engineers should size pumps, pressure and treatment."],
      ["Why track litres per person?", "It makes tank sizing practical and exposes leaks or hidden commercial uses."]
    ]
  },
  {
    slug: "rainfall-tracker",
    tool: "rainfall-tracker",
    title: "Rainfall Pattern Tracker for African Crops",
    shortName: "Rainfall Pattern Tracker",
    desc: "Compare received rainfall against expected monthly patterns and get crop-stage irrigation, drainage and planting guidance.",
    icon: "RF",
    group: "Climate Risk",
    pills: ["Crop stage", "Rain anomaly", "Irrigation need"],
    button: "Track rainfall pattern",
    intro: "Use this as a field notebook companion: expected rain, received rain, crop stage and next action in one screen.",
    fields: [
      countryField,
      { id: "month", label: "Month", type: "select", options: [
        [1, "January"], [2, "February"], [3, "March"], [4, "April"], [5, "May"], [6, "June"], [7, "July"], [8, "August"], [9, "September"], [10, "October"], [11, "November"], [12, "December"]
      ] },
      { id: "crop", label: "Crop", type: "select", options: [["maize", "Maize"], ["rice", "Rice"], ["cassava", "Cassava"], ["cocoa", "Cocoa"], ["sorghum", "Sorghum"], ["vegetables", "Vegetables"], ["pasture", "Pasture"]] },
      { id: "stage", label: "Crop stage", type: "select", options: [["planting", "Planting/establishment"], ["vegetative", "Vegetative"], ["flowering", "Flowering/fruiting"], ["harvest", "Harvest"]] },
      { id: "receivedRain", label: "Rain received", type: "number", unit: "mm", value: 55 },
      { id: "expectedRain", label: "Expected rain", type: "number", unit: "mm", value: 80, help: "Leave at 0 to use the country/month preset." },
      { id: "area", label: "Area", type: "number", unit: "ha", value: 1.5 }
    ],
    sources: SHARED_SOURCES.rain,
    faqs: [
      ["Where should I get rainfall data?", "Use a farm rain gauge, local meteorological office, CHIRPS-based dashboards or extension advisories."],
      ["Why does crop stage matter?", "A dry spell during flowering is often more damaging than the same deficit near harvest."],
      ["What if rainfall is above normal?", "The tool flags wet-spell risk so you can check drainage, fungal disease and flood exposure."]
    ]
  },
  {
    slug: "carbon-credit",
    tool: "carbon-credit",
    title: "Carbon Credit Revenue Calculator for Africa",
    shortName: "Carbon Credit Revenue",
    desc: "Estimate carbon credit revenue, buffer deductions, validation cost and MRV readiness for REDD+, reforestation, mangrove, soil, cookstove and methane projects.",
    icon: "CC",
    group: "Carbon and Environment",
    pills: ["MRV checklist", "Net revenue", "Standards-aware"],
    button: "Calculate credit revenue",
    intro: "This version forces the hard questions: buffer, validation cost, project scale and whether aggregation is needed.",
    fields: [
      countryField,
      { id: "projectType", label: "Project type", type: "select", options: [["redd", "REDD+ avoided deforestation"], ["reforestation", "Reforestation"], ["agroforestry", "Agroforestry"], ["soil", "Soil carbon"], ["mangrove", "Mangrove restoration"], ["cookstove", "Clean cookstove units"], ["methane", "Methane capture units"]] },
      { id: "projectSize", label: "Project size", type: "number", unit: "ha/units", value: 100 },
      { id: "years", label: "Crediting years", type: "number", value: 10 },
      { id: "standard", label: "Standard pathway", type: "select", options: [["verra", "Verra VCS"], ["gold", "Gold Standard"], ["planvivo", "Plan Vivo/community"], ["domestic", "Domestic/buyer-led"]] },
      { id: "price", label: "Credit price override", type: "number", unit: "USD/t", value: 0, help: "0 uses the standard preset." },
      { id: "bufferPct", label: "Buffer/reserve", type: "number", unit: "%", value: 15 },
      { id: "validationCost", label: "Validation and setup cost", type: "number", unit: "USD", value: 35000 }
    ],
    sources: SHARED_SOURCES.carbon,
    faqs: [
      ["Why subtract validation cost?", "Small projects can look profitable before MRV, validation and verification costs. Net revenue is the useful view."],
      ["What is a buffer reserve?", "Many nature projects withhold a share of credits to protect against reversal risk such as fire, drought or illegal harvesting."],
      ["Can a smallholder project issue credits alone?", "Usually aggregation is more realistic. The tool flags small scale as a cooperative or program candidate."]
    ]
  },
  {
    slug: "flood-risk",
    tool: "flood-risk",
    title: "Flood Risk Assessment Tool for Africa",
    shortName: "Flood Risk Assessment",
    desc: "Assess flood exposure, annual loss proxy, insurance budget and preparedness actions for African homes, shops and facilities.",
    icon: "FL",
    group: "Carbon and Environment",
    pills: ["Loss proxy", "Insurance signal", "Preparedness plan"],
    button: "Assess flood risk",
    intro: "Use this before renting, buying, insuring or storing stock in a flood-prone area.",
    fields: [
      countryField,
      { id: "site", label: "Site type", type: "select", options: [["urban", "Urban lowland"], ["coastal", "Coastal/lagoon"], ["river", "Near river"], ["wetland", "Wetland/floodplain"], ["upland", "Upland"]] },
      { id: "distance", label: "Distance to water", type: "select", options: [["under100", "Under 100 m"], ["100to500", "100-500 m"], ["500to2k", "500 m-2 km"], ["over2k", "Over 2 km"]] },
      { id: "elevation", label: "Elevation above water", type: "select", options: [["under5", "Under 5 m"], ["5to15", "5-15 m"], ["15to50", "15-50 m"], ["over50", "Over 50 m"]] },
      { id: "drainage", label: "Drainage condition", type: "select", options: [["blocked", "Blocked drains"], ["poor", "Poor"], ["average", "Average"], ["good", "Good/maintained"]] },
      { id: "building", label: "Building material", type: "select", options: [["mud", "Mud/adobe"], ["timber", "Timber/lightweight"], ["block", "Block/concrete"], ["reinforced", "Reinforced/raised"]] },
      { id: "propertyValue", label: "Property or stock value", type: "number", unit: "USD", value: 50000 },
      { id: "insurance", label: "Insurance status", type: "select", options: [["none", "None"], ["basic", "Basic"], ["full", "Full flood wording"]] }
    ],
    sources: SHARED_SOURCES.risk,
    faqs: [
      ["Does this know my exact flood map?", "No. It is a screening tool. Use local flood maps, river-basin bulletins and site inspection before decisions."],
      ["Why include building material?", "Flood probability and damage are different. Stronger, raised buildings can cut expected loss."],
      ["Can I use the premium as a quote?", "No. It is a budget proxy. Always confirm flood exclusions and limits with the insurer."]
    ]
  },
  {
    slug: "air-quality",
    tool: "air-quality",
    title: "Air Quality Index Tracker for African Cities",
    shortName: "Air Quality Index Tracker",
    desc: "Estimate AQI, PM2.5 exposure, mask guidance and health-cost proxy for African city, roadside, industrial, rural and indoor-smoke scenarios.",
    icon: "AQ",
    group: "Carbon and Environment",
    pills: ["AQI category", "PM2.5 proxy", "Health guidance"],
    button: "Estimate AQI exposure",
    intro: "The old page was a country selector. This turns it into a practical exposure planner with health group and indoor-fuel context.",
    fields: [
      countryField,
      { id: "location", label: "Location pattern", type: "select", options: [["capital", "City/capital average"], ["industrial", "Industrial district"], ["roadside", "Roadside/market corridor"], ["periurban", "Peri-urban"], ["rural", "Rural/background"]] },
      { id: "source", label: "Main pollution source", type: "select", options: [["mixed", "Mixed urban"], ["traffic", "Traffic"], ["generators", "Diesel generators"], ["burning", "Open burning"], ["dust", "Dust/harmattan"], ["cooking", "Cooking smoke"]] },
      { id: "health", label: "Sensitive group", type: "select", options: [["general", "General adult"], ["child", "Child"], ["elderly", "Older adult"], ["asthma", "Asthma/respiratory"], ["pregnant", "Pregnancy"]] },
      { id: "exposureHours", label: "Outdoor exposure", type: "number", unit: "hrs/day", value: 6 },
      { id: "indoorFuel", label: "Indoor cooking fuel", type: "select", options: [["clean", "Mostly clean/electric"], ["lpg", "LPG"], ["charcoal", "Charcoal"], ["wood", "Wood/biomass"], ["kerosene", "Kerosene"]] },
      { id: "pm25", label: "Known PM2.5", type: "number", unit: "ug/m3", value: 0, help: "Optional. Enter sensor reading to override preset AQI." }
    ],
    sources: SHARED_SOURCES.air,
    faqs: [
      ["Is this a live AQI monitor?", "No. It is a scenario estimator. Use a live AQI source or sensor for current public-health decisions."],
      ["Why include indoor fuel?", "For many households, cooking smoke can dominate daily exposure even if outdoor AQI looks acceptable."],
      ["What mask guidance is used?", "The tool follows AQI-style risk escalation and recommends N95/KN95 protection on unhealthy PM2.5 days."]
    ]
  },
  {
    slug: "deforestation",
    tool: "deforestation",
    title: "Deforestation Impact Calculator for Africa",
    shortName: "Deforestation Impact",
    desc: "Estimate CO2 released, lost future sequestration, restoration budget and land-conversion risk before clearing or restoring African forest land.",
    icon: "DF",
    group: "Carbon and Environment",
    pills: ["CO2 impact", "Restoration budget", "Land-use check"],
    button: "Estimate forest impact",
    intro: "Use this to put a carbon and restoration price beside land-clearing decisions.",
    fields: [
      countryField,
      { id: "forestType", label: "Forest type", type: "select", options: [["tropical", "Tropical moist forest"], ["miombo", "Miombo/dry woodland"], ["mangrove", "Mangrove"], ["savanna", "Savanna woodland"], ["plantation", "Plantation"]] },
      { id: "hectares", label: "Area affected", type: "number", unit: "ha", value: 10 },
      { id: "newUse", label: "New land use", type: "select", options: [["cropland", "Cropland"], ["pasture", "Pasture"], ["mining", "Mining/quarry"], ["urban", "Urban/building"], ["selective", "Selective logging only"]] },
      { id: "soilCarbon", label: "Soil disturbance", type: "select", options: [["low", "Low"], ["medium", "Medium"], ["high", "High/peat or wet soil"]] },
      { id: "restoration", label: "Restoration route", type: "select", options: [["natural", "Natural regeneration"], ["assisted", "Assisted regeneration"], ["plantation", "Plantation"], ["mangrove", "Mangrove restoration"]] }
    ],
    sources: SHARED_SOURCES.forest,
    faqs: [
      ["Why show lost future sink?", "Clearing emits carbon now and also removes future annual sequestration."],
      ["Are biomass values exact?", "No. They are broad planning defaults by forest type. Formal work needs field inventory or approved datasets."],
      ["What is the best mitigation?", "Avoidance is usually stronger than restoration. If clearing is unavoidable, protect buffers and price restoration upfront."]
    ]
  },
  {
    slug: "waste-management",
    tool: "waste-management",
    title: "Waste Management Cost Calculator for African Businesses",
    shortName: "Waste Management Cost",
    desc: "Estimate monthly waste collection cost, diversion potential, circularity score and operational fixes for African shops, clinics, schools and facilities.",
    icon: "WM",
    group: "Carbon and Environment",
    pills: ["Circularity score", "Collection cost", "Sorting plan"],
    button: "Calculate waste plan",
    intro: "Use this when waste is a recurring operating cost, compliance concern or missed recycling opportunity.",
    fields: [
      countryField,
      { id: "sector", label: "Business type", type: "select", options: [["retail", "Retail/shop"], ["food", "Food/restaurant"], ["clinic", "Clinic/pharmacy"], ["school", "School"], ["office", "Office"], ["light", "Light manufacturing"]] },
      { id: "kgDay", label: "Waste per day", type: "number", unit: "kg", value: 50 },
      { id: "organicPct", label: "Organic share", type: "number", unit: "%", value: 35 },
      { id: "recyclingPct", label: "Dry recyclable share", type: "number", unit: "%", value: 20 },
      { id: "separation", label: "Separation system", type: "select", options: [["none", "None"], ["basic", "Basic bags"], ["color", "Color-coded bins"], ["audited", "Audited streams"]] },
      { id: "pickups", label: "Pickups per month", type: "number", value: 8 },
      { id: "hazardous", label: "Hazardous waste", type: "select", options: [["no", "No"], ["small", "Small amount"], ["high", "Regular/high risk"]] }
    ],
    sources: SHARED_SOURCES.waste,
    faqs: [
      ["Why score circularity?", "It shows whether waste is only being removed or actually reduced, recovered and documented."],
      ["What counts as hazardous?", "Medical sharps, chemicals, batteries, oils and contaminated materials need specialist handling."],
      ["How do I verify savings?", "Ask for weight tickets, receipts or collection logs and compare them month by month."]
    ]
  },
  {
    slug: "recycling-revenue",
    tool: "recycling-revenue",
    title: "Recycling Revenue Calculator for Africa",
    shortName: "Recycling Revenue",
    desc: "Estimate monthly revenue, contamination loss, transport drag and CO2 avoided from plastic, metal, paper, glass and organics.",
    icon: "RR",
    group: "Carbon and Environment",
    pills: ["Material mix", "Transport drag", "CO2 avoided"],
    button: "Estimate recycling revenue",
    intro: "Use this to decide whether a recycling stream is worth collecting alone or should be pooled with nearby businesses.",
    fields: [
      countryField,
      { id: "plastic", label: "Plastic", type: "number", unit: "kg/month", value: 80 },
      { id: "aluminum", label: "Aluminum cans", type: "number", unit: "kg/month", value: 15 },
      { id: "steel", label: "Steel/metals", type: "number", unit: "kg/month", value: 30 },
      { id: "paper", label: "Paper/cardboard", type: "number", unit: "kg/month", value: 60 },
      { id: "glass", label: "Glass", type: "number", unit: "kg/month", value: 40 },
      { id: "organic", label: "Organics/compostable", type: "number", unit: "kg/month", value: 100 },
      { id: "contaminationPct", label: "Contamination", type: "number", unit: "%", value: 12 },
      { id: "transportCost", label: "Transport cost", type: "number", unit: "USD", value: 12 }
    ],
    sources: SHARED_SOURCES.waste,
    faqs: [
      ["Why can revenue be negative?", "Small or contaminated loads can lose money once transport is included."],
      ["Which material usually pays best?", "Clean aluminum and metals usually pay best per kg, but local buyer access matters."],
      ["How do I raise the price?", "Sort dry, keep food and liquid out, consolidate loads and track rejection reasons."]
    ]
  },
  {
    slug: "charcoal-vs-clean",
    tool: "charcoal-vs-clean",
    title: "Charcoal vs Clean Cooking Comparator for Africa",
    shortName: "Charcoal vs Clean Cooking",
    desc: "Compare charcoal against LPG, electric, biogas or ethanol cooking over time, including cost, smoke-risk and CO2-reduction proxy.",
    icon: "CK",
    group: "Carbon and Environment",
    pills: ["5-year cost", "Smoke risk", "Clean cooking"],
    button: "Compare cooking options",
    intro: "Use this to see whether a stove switch pays back and what health-risk reduction it may unlock.",
    fields: [
      countryField,
      { id: "charcoalKgWeek", label: "Charcoal used weekly", type: "number", unit: "kg", value: 8 },
      { id: "cleanOption", label: "Clean option", type: "select", options: [["lpg", "LPG"], ["electric", "Electric/induction"], ["biogas", "Biogas"], ["ethanol", "Ethanol"]] },
      { id: "stoveCost", label: "New stove/setup cost", type: "number", unit: "USD", value: 65 },
      { id: "ventilation", label: "Kitchen ventilation", type: "select", options: [["poor", "Poor/enclosed"], ["average", "Average"], ["good", "Good"], ["outdoor", "Mostly outdoor"]] },
      { id: "years", label: "Comparison period", type: "number", unit: "years", value: 5 }
    ],
    sources: SHARED_SOURCES.cooking,
    faqs: [
      ["Why does ventilation matter?", "Cleaner fuel helps, but poor ventilation also raises exposure to smoke and combustion by-products."],
      ["What if LPG refill supply is unreliable?", "Treat the result as a cost screen, then check refill distance, cylinder deposit and safety before switching."],
      ["Can clean cooking save money?", "Often yes over time, but upfront stove or cylinder costs can require finance or subsidies."]
    ]
  },
  {
    slug: "ewaste-value",
    tool: "ewaste-value",
    title: "E-Waste Collection Value Calculator for Africa",
    shortName: "E-Waste Collection Value",
    desc: "Estimate e-waste payout, data-wipe priority, hazard risk and CO2 avoided for phones, laptops, TVs, batteries and mixed electronics.",
    icon: "EW",
    group: "Pan-African Tools",
    pills: ["Payout estimate", "Data wipe", "Safe recycling"],
    button: "Calculate e-waste value",
    intro: "This version adds the missing safety layer: data risk, battery hazards and recycler route quality.",
    fields: [
      countryField,
      { id: "device", label: "Device type", type: "select", options: [["smartphone", "Smartphones"], ["laptop", "Laptops"], ["desktop", "Desktop/monitor"], ["tv", "TV/display"], ["battery", "Batteries/power banks"], ["mixed", "Mixed small electronics"]] },
      { id: "condition", label: "Condition", type: "select", options: [["working", "Working/resale"], ["repairable", "Repairable"], ["dead", "Dead"], ["stripped", "Stripped/incomplete"]] },
      { id: "quantity", label: "Quantity", type: "number", value: 5 },
      { id: "dataRisk", label: "Stored data risk", type: "select", options: [["none", "No storage"], ["low", "Low"], ["medium", "Medium"], ["high", "High/client data"]] },
      { id: "recycler", label: "Recycler route", type: "select", options: [["certified", "Certified recycler"], ["collection", "Formal collection point"], ["scrap", "Informal scrap buyer"]] }
    ],
    sources: SHARED_SOURCES.ewaste,
    faqs: [
      ["Why include data risk?", "A working phone or laptop may be worth more, but account and storage cleanup must happen before handoff."],
      ["Why might a certified recycler pay less?", "Formal handling has safety and compliance costs. The benefit is lower fire, toxic exposure and data risk."],
      ["Can batteries go with mixed e-waste?", "Prefer separate handling. Damaged lithium batteries are a fire risk."]
    ]
  },
  {
    slug: "tree-planting-roi",
    tool: "tree-planting-roi",
    title: "Tree Planting ROI Calculator for Africa",
    shortName: "Tree Planting ROI",
    desc: "Estimate 25-year tree planting value with survival rate, carbon price, produce or timber value, maintenance and carbon verification route.",
    icon: "TR",
    group: "Pan-African Tools",
    pills: ["Survival adjusted", "25-year ROI", "MRV route"],
    button: "Calculate tree ROI",
    intro: "The useful number is not trees planted. It is live trees, maintenance cost and whether carbon revenue is realistic.",
    fields: [
      countryField,
      { id: "species", label: "Planting model", type: "select", options: [["fruit", "Fruit orchard"], ["timber", "Timber"], ["indigenous", "Indigenous restoration"], ["mangrove", "Mangrove restoration"], ["agroforestry", "Agroforestry mix"]] },
      { id: "trees", label: "Trees planted", type: "number", value: 500 },
      { id: "survivalPct", label: "Expected survival", type: "number", unit: "%", value: 75 },
      { id: "investment", label: "Setup investment", type: "number", unit: "USD", value: 2500 },
      { id: "maintenancePerTree", label: "Annual maintenance/tree", type: "number", unit: "USD", value: 1.2 },
      { id: "carbonPrice", label: "Carbon price", type: "number", unit: "USD/t", value: 12 },
      { id: "verification", label: "Carbon route", type: "select", options: [["none", "No carbon registration"], ["cooperative", "Cooperative/program"], ["direct", "Direct project"]] }
    ],
    sources: SHARED_SOURCES.carbon,
    faqs: [
      ["Why survival-adjusted?", "A plantation with low survival can look good on planting day and fail financially by year two."],
      ["Why include verification route?", "Direct carbon registration can cost more than a small project earns. Aggregation is often the practical route."],
      ["Does this guarantee carbon credits?", "No. Credits require approved methodology, tenure clarity, monitoring and third-party validation."]
    ]
  },
  {
    slug: "sustainability-scorecard",
    tool: "sustainability-scorecard",
    title: "Sustainable Business Scorecard for Africa",
    shortName: "Sustainable Business Scorecard",
    desc: "Score an African business across energy, waste, water, sourcing, worker safety and disclosure readiness with a 90-day action plan.",
    icon: "SC",
    group: "Pan-African Tools",
    pills: ["A-F grade", "90-day plan", "Evidence-first"],
    button: "Generate scorecard",
    intro: "This is now a working self-assessment, not just a grade. It tells the operator what evidence to collect next.",
    fields: [
      { id: "sector", label: "Sector", type: "select", options: [["retail", "Retail"], ["manufacturing", "Manufacturing"], ["food", "Food and beverage"], ["services", "Services"], ["logistics", "Logistics"], ["farm", "Farm/agri"]] },
      { id: "renewablePct", label: "Renewable energy share", type: "number", unit: "%", value: 20 },
      { id: "generatorPct", label: "Generator energy share", type: "number", unit: "%", value: 30 },
      { id: "energyAudit", label: "Energy audit done", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "recyclingPct", label: "Waste recycled", type: "number", unit: "%", value: 25 },
      { id: "separatesWaste", label: "Separates waste", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "hazardPlan", label: "Hazardous waste plan", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "waterMeter", label: "Water metered", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "waterReusePct", label: "Water reused/saved", type: "number", unit: "%", value: 10 },
      { id: "leakChecks", label: "Leak checks logged", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "localSourcingPct", label: "Local sourcing", type: "number", unit: "%", value: 50 },
      { id: "supplierCode", label: "Supplier standards", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "ppe", label: "PPE and safety controls", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "training", label: "Worker training logs", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { id: "reporting", label: "Impact data documented", type: "select", options: [["no", "No"], ["yes", "Yes"]] }
    ],
    sources: SHARED_SOURCES.business,
    faqs: [
      ["Can I use the grade for investor reporting?", "Use it as an internal baseline. Formal investor reporting needs evidence, scope boundaries and usually a recognized standard."],
      ["What improves the score fastest?", "Energy audits, waste separation, water metering and documented training usually produce quick, provable gains."],
      ["Why include people and safety?", "Sustainability reporting covers impacts on people as well as environment."]
    ]
  }
];

const TOOL_ENHANCEMENTS = {
  "drought-risk": {
    competitor: "NASA Earthdata drought monitoring and Cool Farm Tool scenario workflows",
    upgrade: "Ready-made presets for common African farms, plus a downloadable action plan you can share with extension officers or insurers.",
    workflow: "Farm Resilience",
    audience: ["farmer", "agribusiness"],
    pdfTitle: "Farm drought action pack",
    leadMagnet: "Download a drought action PDF for extension, irrigation or insurance planning.",
    presets: [
      { label: "Maize dry start", values: { crop: "maize", season: "early", rainfallAnomaly: -35, irrigation: "none", soil: "sandy", area: 2, cropValue: 1100 } },
      { label: "Cocoa dry spell", values: { crop: "cocoa", season: "main", rainfallAnomaly: -22, irrigation: "partial", soil: "loam", area: 5, cropValue: 2400 } }
    ],
    nextTools: ["rainfall-tracker", "water-scarcity", "tree-planting-roi"]
  },
  "water-scarcity": {
    competitor: "WRI Aqueduct Water Risk Atlas and utility storage sizing tools",
    upgrade: "Storage presets for homes, clinics and farms, with a downloadable tank-sizing plan you can act on.",
    workflow: "Water Security",
    audience: ["home", "clinic", "business", "farm"],
    pdfTitle: "Water buffer sizing report",
    leadMagnet: "Download a water storage and shortage-days PDF for procurement or facility planning.",
    presets: [
      { label: "Household outage", values: { useType: "household", people: 5, dailyDemand: 65, supplyDays: 3, storage: 750, reusePct: 8 } },
      { label: "Clinic buffer", values: { useType: "clinic", people: 18, dailyDemand: 55, supplyDays: 4, storage: 2500, reusePct: 12 } }
    ],
    nextTools: ["drought-risk", "waste-management", "rainfall-tracker"]
  },
  "rainfall-tracker": {
    competitor: "NASA drought data, FEWS NET-style seasonal monitoring and Cool Farm Tool water metrics",
    upgrade: "Simple presets for the field, with downloadable season notes to keep with your farm records.",
    workflow: "Farm Resilience",
    audience: ["farmer", "agribusiness"],
    pdfTitle: "Rainfall season note",
    leadMagnet: "Download a rainfall action note for farm records, irrigation meetings or buyer updates.",
    presets: [
      { label: "Flowering deficit", values: { month: 6, crop: "maize", stage: "flowering", receivedRain: 45, expectedRain: 95, area: 2 } },
      { label: "Wet harvest", values: { month: 9, crop: "rice", stage: "harvest", receivedRain: 160, expectedRain: 100, area: 1.5 } }
    ],
    nextTools: ["drought-risk", "flood-risk", "water-scarcity"]
  },
  "carbon-credit": {
    competitor: "Verra VCS Project Hub, Gold Standard certification and Cool Farm Tool carbon workflows",
    upgrade: "Scenario presets for the major carbon standards, plus an investor-ready report you can download and share.",
    workflow: "Carbon Project",
    audience: ["project", "ngo", "developer"],
    pdfTitle: "Carbon project pre-feasibility note",
    leadMagnet: "Download a carbon revenue and MRV readiness PDF for partner or buyer conversations.",
    presets: [
      { label: "REDD+ pilot", values: { projectType: "redd", projectSize: 750, years: 20, standard: "verra", price: 8, bufferPct: 18, validationCost: 55000 } },
      { label: "Cookstove program", values: { projectType: "cookstove", projectSize: 5000, years: 7, standard: "gold", price: 11, bufferPct: 8, validationCost: 42000 } }
    ],
    nextTools: ["tree-planting-roi", "deforestation", "sustainability-scorecard"]
  },
  "flood-risk": {
    competitor: "FEMA National Risk Index, First Street Flood Factor and Climate Central flood screening",
    upgrade: "A clear property risk read-out, insurance budget guidance, and a downloadable flood preparedness plan.",
    workflow: "Property Resilience",
    audience: ["home", "business", "facility"],
    pdfTitle: "Flood preparedness report",
    leadMagnet: "Download a flood risk and preparedness PDF before renting, buying or insuring a site.",
    presets: [
      { label: "Urban shop", values: { site: "urban", distance: "100to500", elevation: "5to15", drainage: "poor", building: "block", propertyValue: 45000, insurance: "basic" } },
      { label: "Lagoon home", values: { site: "coastal", distance: "under100", elevation: "under5", drainage: "average", building: "block", propertyValue: 70000, insurance: "none" } }
    ],
    nextTools: ["rainfall-tracker", "water-scarcity", "sustainability-scorecard"]
  },
  "air-quality": {
    competitor: "AirNow AQI, IQAir-style exposure dashboards and WHO household-air-pollution guidance",
    upgrade: "Exposure presets with a downloadable air-quality plan for schools, homes and worksites.",
    workflow: "Healthy Air",
    audience: ["home", "school", "business"],
    pdfTitle: "Air quality exposure plan",
    leadMagnet: "Download an AQI exposure PDF for school, household or workplace planning.",
    presets: [
      { label: "Roadside commute", values: { location: "roadside", source: "traffic", health: "asthma", exposureHours: 4, indoorFuel: "lpg", pm25: 0 } },
      { label: "Cooking smoke", values: { location: "periurban", source: "cooking", health: "child", exposureHours: 2, indoorFuel: "wood", pm25: 0 } }
    ],
    nextTools: ["charcoal-vs-clean", "sustainability-scorecard", "waste-management"]
  },
  "deforestation": {
    competitor: "Global Forest Watch alerts, GFW dashboards and FAO forest-carbon reporting",
    upgrade: "Clear alerts and a carbon-loss checklist, with next steps into the carbon-credit and restoration tools.",
    workflow: "Land Use",
    audience: ["project", "ngo", "agribusiness"],
    pdfTitle: "Land-use impact memo",
    leadMagnet: "Download a deforestation impact memo for land review, board approval or community consultation.",
    presets: [
      { label: "Tropical conversion", values: { forestType: "tropical", hectares: 25, soilCarbon: "high", newUse: "cropland", restoration: "assisted" } },
      { label: "Mangrove loss", values: { forestType: "mangrove", hectares: 8, soilCarbon: "high", newUse: "urban", restoration: "mangrove" } }
    ],
    nextTools: ["carbon-credit", "tree-planting-roi", "sustainability-scorecard"]
  },
  "waste-management": {
    competitor: "UNEP Zero Waste guidance and EPA WARM policy/program estimator",
    upgrade: "Facility presets and a downloadable waste-contract summary to take to your collector.",
    workflow: "Circular Operations",
    audience: ["business", "clinic", "school", "municipal"],
    pdfTitle: "Waste operations action plan",
    leadMagnet: "Download a waste stream and collection action PDF for contractor or facility review.",
    presets: [
      { label: "Clinic waste", values: { sector: "clinic", kgDay: 35, organicPct: 12, recyclingPct: 18, pickups: 12, separation: "basic", hazardous: "high" } },
      { label: "Market shop", values: { sector: "retail", kgDay: 80, organicPct: 45, recyclingPct: 25, pickups: 10, separation: "none", hazardous: "small" } }
    ],
    nextTools: ["recycling-revenue", "ewaste-value", "sustainability-scorecard"]
  },
  "recycling-revenue": {
    competitor: "EPA WARM material categories and recycling program toolkits",
    upgrade: "Buyer-quality presets and a downloadable revenue summary for aggregators and facility managers.",
    workflow: "Circular Operations",
    audience: ["business", "collector", "municipal"],
    pdfTitle: "Recycling revenue sheet",
    leadMagnet: "Download a recycling revenue PDF for buyer negotiation or route planning.",
    presets: [
      { label: "Shop dry stream", values: { plastic: 110, aluminum: 18, steel: 35, paper: 75, glass: 30, organic: 20, contaminationPct: 8, transportCost: 16 } },
      { label: "Apartment mixed", values: { plastic: 160, aluminum: 10, steel: 20, paper: 90, glass: 60, organic: 180, contaminationPct: 22, transportCost: 28 } }
    ],
    nextTools: ["waste-management", "ewaste-value", "sustainability-scorecard"]
  },
  "charcoal-vs-clean": {
    competitor: "WHO clean cooking cost-benefit tools and Clean Cooking Alliance transition analysis",
    upgrade: "Household switch presets and a downloadable clean-cooking comparison to guide the change.",
    workflow: "Healthy Air",
    audience: ["home", "program", "school"],
    pdfTitle: "Clean cooking switch plan",
    leadMagnet: "Download a clean-cooking savings and health-risk PDF for household or program planning.",
    presets: [
      { label: "Urban LPG switch", values: { charcoalKgWeek: 8, cleanOption: "lpg", stoveCost: 65, years: 5, ventilation: "average" } },
      { label: "School kitchen", values: { charcoalKgWeek: 35, cleanOption: "electric", stoveCost: 280, years: 5, ventilation: "poor" } }
    ],
    nextTools: ["air-quality", "carbon-credit", "sustainability-scorecard"]
  },
  "ewaste-value": {
    competitor: "Global E-waste Monitor, formal collection targets and electronics trade-in flows",
    upgrade: "Device-batch presets and a downloadable collection plan for handing devices to a trusted recycler.",
    workflow: "Circular Operations",
    audience: ["business", "collector", "school"],
    pdfTitle: "E-waste collection report",
    leadMagnet: "Download an e-waste payout and handling PDF for collection or recycler handoff.",
    presets: [
      { label: "Office laptops", values: { country: "NG", device: "laptop", condition: "repairable", quantity: 12, dataRisk: "high", recycler: "certified" } },
      { label: "Battery batch", values: { country: "KE", device: "battery", condition: "dead", quantity: 50, dataRisk: "none", recycler: "collection" } }
    ],
    nextTools: ["recycling-revenue", "waste-management", "sustainability-scorecard"]
  },
  "tree-planting-roi": {
    competitor: "Cool Farm Tool sequestration scenarios, Verra land-use MRV and reforestation calculators",
    upgrade: "Survival-focused presets and a downloadable planting ROI summary you can plan around.",
    workflow: "Carbon Project",
    audience: ["project", "farmer", "ngo"],
    pdfTitle: "Tree planting ROI report",
    leadMagnet: "Download a planting ROI PDF for donor, buyer or cooperative review.",
    presets: [
      { label: "Agroforestry co-op", values: { species: "agroforestry", trees: 2500, survivalPct: 72, investment: 12000, maintenancePerTree: 1.4, carbonPrice: 9, verification: "cooperative" } },
      { label: "Mangrove restoration", values: { species: "mangrove", trees: 8000, survivalPct: 68, investment: 36000, maintenancePerTree: 0.9, carbonPrice: 14, verification: "direct" } }
    ],
    nextTools: ["carbon-credit", "deforestation", "water-scarcity"]
  },
  "sustainability-scorecard": {
    competitor: "GRI Standards, IFC EDGE-style efficiency scoring and ESG reporting checklists",
    upgrade: "Sector presets and a downloadable scorecard to share with operators and lenders.",
    workflow: "Business Readiness",
    audience: ["business", "facility", "investor"],
    pdfTitle: "Business sustainability scorecard",
    leadMagnet: "Download a sustainability scorecard PDF for management, lender or customer reporting.",
    presets: [
      { label: "Retail baseline", values: { sector: "retail", renewablePct: 10, generatorPct: 35, energyAudit: "no", recyclingPct: 18, separatesWaste: "no", hazardPlan: "no", waterMeter: "no", waterReusePct: 4, leakChecks: "no", localSourcingPct: 55, supplierCode: "no", ppe: "yes", training: "no", reporting: "no" } },
      { label: "Factory improving", values: { sector: "manufacturing", renewablePct: 28, generatorPct: 25, energyAudit: "yes", recyclingPct: 42, separatesWaste: "yes", hazardPlan: "yes", waterMeter: "yes", waterReusePct: 18, leakChecks: "yes", localSourcingPct: 62, supplierCode: "yes", ppe: "yes", training: "yes", reporting: "yes" } }
    ],
    nextTools: ["waste-management", "air-quality", "carbon-credit"]
  }
};

const HUB_PATHWAYS = [
  { id: "farm", label: "Farm resilience", audience: "farmer", tools: ["rainfall-tracker", "drought-risk", "water-scarcity", "tree-planting-roi"], copy: "Start with rainfall reality, quantify drought loss, size water buffers, then test planting ROI." },
  { id: "home", label: "Home and health", audience: "home", tools: ["air-quality", "charcoal-vs-clean", "water-scarcity", "flood-risk"], copy: "Reduce smoke and water interruption first, then screen property flood exposure." },
  { id: "business", label: "Business readiness", audience: "business", tools: ["sustainability-scorecard", "waste-management", "recycling-revenue", "air-quality"], copy: "Create an evidence baseline, fix waste operations, then quantify recycling and workplace exposure." },
  { id: "project", label: "Carbon project", audience: "project", tools: ["carbon-credit", "tree-planting-roi", "deforestation", "sustainability-scorecard"], copy: "Screen revenue, survival, land-use impact and reporting readiness before spending on validation." }
];

function withEnhancement(tool) {
  return Object.assign({}, tool, TOOL_ENHANCEMENTS[tool.slug] || {});
}

function toolBySlug(slug) {
  return withEnhancement(TOOLS.find((tool) => tool.slug === slug) || {});
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeOptions(options) {
  return options.map((opt) => Array.isArray(opt) ? { value: String(opt[0]), label: String(opt[1]) } : opt);
}

function fieldHtml(field) {
  const id = esc(field.id);
  const label = esc(field.label);
  const help = field.help ? `<div class="cl-field-help">${esc(field.help)}</div>` : "";
  if (field.type === "select") {
    const opts = normalizeOptions(field.options || []).map((opt) => `<option value="${esc(opt.value)}">${esc(opt.label)}</option>`).join("");
    return `<div class="cl-field">
<label class="cl-label" for="${id}">${label}</label>
<select class="cl-select" id="${id}" name="${id}" data-cl-field="${id}" required>${opts}</select>
${help}
</div>`;
  }
  const value = field.value == null ? "" : ` value="${esc(field.value)}"`;
  const unit = field.unit ? `<span class="cl-input-unit-label">${esc(field.unit)}</span>` : "";
  const input = `<input class="cl-input" type="number" id="${id}" name="${id}" data-cl-field="${id}" data-cl-number="true"${value} step="any" inputmode="decimal" required>`;
  return `<div class="cl-field">
<label class="cl-label" for="${id}">${label}</label>
<div class="${field.unit ? "cl-input-unit" : ""}">${input}${unit}</div>
${help}
</div>`;
}

function presetHtml(tool) {
  if (!tool.presets || !tool.presets.length) return "";
  return `<section class="cl-preset-card" aria-labelledby="clPresetTitle">
<div>
<h2 id="clPresetTitle">Quick-start scenarios</h2>
<p>Load a realistic case, then edit the numbers to match your own site, farm, household or project.</p>
</div>
<div class="cl-preset-actions">
${tool.presets.map((preset) => `<button type="button" class="cl-preset-btn" data-cl-preset='${esc(JSON.stringify(preset.values))}'>${esc(preset.label)}</button>`).join("\n")}
</div>
</section>`;
}

function companionHtml(tool) {
  const nextTools = (tool.nextTools || []).map(toolBySlug).filter((item) => item.slug);
  return `<section class="cl-workflow-card" id="cl-next-step">
<div class="cl-workflow-head">
<span>${esc(tool.workflow || "Climate workflow")}</span>
<h2>Next step after this result</h2>
<p>${esc(tool.upgrade || "Use the result as part of a connected Climate workflow.")}</p>
</div>
<div class="cl-workflow-links" id="cl-next-links">
${nextTools.map((next) => `<a class="cl-workflow-link" href="/tools/${esc(next.slug)}/"><strong>${esc(next.shortName || next.title)}</strong><span>${esc((next.pills && next.pills[0]) || next.group || "Open tool")}</span></a>`).join("\n")}
</div>
</section>`;
}

function methodologyHtml(tool) {
  return `<section class="cl-method-card-wide">
<div>
<span class="cl-kicker">Competitor-informed upgrade</span>
<h2>What this app now checks</h2>
<p>${esc(tool.upgrade || "This tool now combines a calculator result, assumptions, next actions and a reportable summary.")}</p>
</div>
<div class="cl-method-list">
<div><strong>Reference pattern</strong><span>${esc(tool.competitor || "Climate risk and sustainability planning tools")}</span></div>
<div><strong>Dashboard path</strong><span>Save the result locally, then sync it to account workspace when signed in.</span></div>
<div><strong>PDF gate</strong><span>${esc(tool.leadMagnet || "Download a gated PDF report when a result is ready.")}</span></div>
</div>
</section>`;
}

function faqHtml(faqs) {
  return `<section class="cl-faq">
<h2 class="cl-faq-title">Frequently Asked Questions</h2>
<div class="cl-faq-list">
${faqs.map(([q, a]) => `<div class="cl-faq-item"><button class="cl-faq-q" type="button">${esc(q)}</button><div class="cl-faq-a">${esc(a)}</div></div>`).join("\n")}
</div>
</section>`;
}

function pageHtml(tool) {
  tool = withEnhancement(tool);
  const canonical = `https://afrotools.com/tools/${tool.slug}/`;
  const config = {
    tool: tool.tool,
    slug: tool.slug,
    title: tool.title,
    shortName: tool.shortName,
    href: `/tools/${tool.slug}/`,
    sources: tool.sources,
    workflow: tool.workflow || "",
    competitor: tool.competitor || "",
    upgrade: tool.upgrade || "",
    pdfTitle: tool.pdfTitle || `${tool.shortName} report`,
    leadMagnet: tool.leadMagnet || "",
    presets: tool.presets || [],
    nextTools: (tool.nextTools || []).map((slug) => {
      const next = toolBySlug(slug);
      return {
        slug: next.slug,
        shortName: next.shortName,
        href: `/tools/${next.slug}/`,
        desc: next.desc,
        tag: (next.pills && next.pills[0]) || next.group || "Open tool"
      };
    }).filter((next) => next.slug)
  };
  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e57fe38a.min.js" lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tool.title)} | AfroTools</title>
<meta name="description" content="${esc(tool.desc)}">
<meta name="afrotools:tool-slug" content="${esc(tool.slug)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(tool.title)} | AfroTools">
<meta property="og:description" content="${esc(tool.desc)}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":${JSON.stringify(tool.title)},"description":${JSON.stringify(tool.desc)},"url":"${canonical}","applicationCategory":"EnvironmentalApplication","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com/"},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Climate & Environment","item":"https://afrotools.com/climate/"},{"@type":"ListItem","position":3,"name":${JSON.stringify(tool.shortName)},"item":"${canonical}"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/climate.css">
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="climate"></afro-navbar>
<section class="cl-tool-hero">
<div class="cl-tool-hero-inner">
<nav class="cl-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/climate/">Climate &amp; Environment</a><span>/</span>${esc(tool.shortName)}</nav>
<h1>${esc(tool.shortName)}<br><em>for Africa</em></h1>
<p class="cl-tool-hero-sub">${esc(tool.desc)}</p>
<div class="cl-tool-hero-meta">${tool.pills.map((pill) => `<span class="cl-tool-hero-pill">${esc(pill)}</span>`).join("")}<span class="cl-tool-hero-pill">${esc(tool.workflow || "Climate workflow")}</span></div>
</div>
</section>
<main class="cl-main-wide">
<section class="cl-copy-band"><strong>${esc(tool.group)}</strong><p>${esc(tool.intro)}</p></section>
${methodologyHtml(tool)}
<section class="cl-card">
<h2 class="cl-card-title"><span class="cl-card-title-icon">${esc(tool.icon)}</span> Inputs</h2>
${presetHtml(tool)}
<form id="climateForm">
<div class="cl-form-grid">${tool.fields.map(fieldHtml).join("\n")}</div>
<div class="cl-form-actions">
<button class="cl-btn" type="submit">${esc(tool.button)}</button>
<button class="cl-btn cl-btn-secondary" type="button" id="copyClimateSummary">Copy action plan</button>
<button class="cl-btn cl-btn-secondary" type="button" id="saveClimateDashboard" disabled>Save to dashboard</button>
<button class="cl-btn cl-btn-secondary" type="button" id="downloadClimatePdf" disabled>Download PDF report</button>
<p class="cl-compact-note">Estimates are planning signals, not official monitoring, legal, engineering or verification advice.</p>
</div>
</form>
</section>
<section class="cl-results" id="cl-results" aria-live="polite">
<div class="cl-results-hero">
<div class="cl-results-hero-inner">
<div class="cl-results-hero-grid">
<div>
<div class="cl-results-hero-label" id="cl-result-label">Result</div>
<div class="cl-results-hero-value" id="cl-result-value">-</div>
<div class="cl-results-hero-sub" id="cl-result-sub">Run the tool to see a tailored result.</div>
</div>
<div class="cl-results-hero-aside"><span class="cl-risk-pill" id="cl-result-level">Ready</span></div>
</div>
</div>
</div>
<div class="cl-result-shell">
<div>
<div class="cl-metrics" id="cl-metrics"></div>
<div class="cl-result-panel"><h2 class="cl-card-title">Decision Breakdown</h2><div id="cl-breakdown"></div></div>
</div>
<div class="cl-result-panel"><h2 class="cl-card-title">Action Plan</h2><div id="cl-actions"></div></div>
</div>
${companionHtml(tool)}
</section>
<section class="cl-source-card" id="cl-sources"></section>
${faqHtml(tool.faqs)}
</main>
<afro-footer></afro-footer>
<script>window.AfroClimateToolConfig=${JSON.stringify(config)};</script>
<script src="/assets/js/afro-auth.js?v=6"></script>
<script src="/assets/js/lib/workspace-sync.js?v=20260417a"></script>
<script src="/assets/js/climate-tools.js"></script>
</body>
</html>
`;
}

function climateIndexHtml() {
  const allTools = TOOLS.map(withEnhancement);
  const groups = [...new Set(allTools.map((tool) => tool.group))];
  const cardsByGroup = groups.map((group) => {
    const cards = allTools.filter((tool) => tool.group === group).map((tool) => `<a href="/tools/${tool.slug}/" class="cl-tool-card">
<div class="cl-tool-card-icon">${esc(tool.icon)}</div>
<div class="cl-tool-card-body">
<div class="cl-tool-card-name">${esc(tool.shortName)}</div>
<div class="cl-tool-card-desc">${esc(tool.desc)}</div>
<div class="cl-tool-card-meta"><span class="cl-badge cl-badge-live">LIVE</span><span class="cl-tool-card-tag">${esc(tool.workflow || tool.pills[0])}</span></div>
<div class="cl-tool-card-proof">${esc(tool.upgrade || tool.pills.join(" • "))}</div>
</div>
<span class="cl-tool-card-arrow">-&gt;</span>
</a>`).join("\n");
    return `<div class="cl-region-label">${esc(group)}</div><div class="cl-tools-grid">${cards}</div>`;
  }).join("\n");

  const pathwayCards = HUB_PATHWAYS.map((pathway) => `<article class="cl-pathway-card">
<div class="cl-pathway-top"><span>${esc(pathway.label)}</span><strong>${pathway.tools.length} steps</strong></div>
<p>${esc(pathway.copy)}</p>
<div class="cl-pathway-sequence">${pathway.tools.map((slug, index) => {
    const tool = toolBySlug(slug);
    return `<a href="/tools/${esc(slug)}/" data-path-tool="${esc(slug)}"><span>${index + 1}</span>${esc(tool.shortName || slug)}</a>`;
  }).join("")}</div>
</article>`).join("\n");

  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e57fe38a.min.js" lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Climate &amp; Environment Tools for Africa - Risk, Carbon, Water | AfroTools</title>
<meta name="description" content="Free climate and environment calculators for Africa. Drought risk, water scarcity, rainfall, carbon credits, flood risk, AQI, e-waste, waste, recycling, cooking and tree ROI tools.">
<link rel="canonical" href="https://afrotools.com/climate/">
<meta property="og:title" content="Climate &amp; Environment Tools for Africa | AfroTools">
<meta property="og:description" content="Practical climate tools for African farms, homes, businesses and project developers.">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:url" content="https://afrotools.com/climate/">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"Climate & Environment Tools for Africa","description":"Free climate and environment calculators for Africa.","url":"https://afrotools.com/climate/","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com/"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Climate & Environment","item":"https://afrotools.com/climate/"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/climate.css">
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="climate"></afro-navbar>
<section class="cl-hero">
<div class="cl-hero-inner">
<div class="cl-hero-badge-row"><span class="cl-badge">Climate &amp; Environment</span><span class="cl-badge">${TOOLS.length} free tools</span><span class="cl-badge">No sign-up needed</span></div>
<h1>Climate &amp; Environment<br><em>Tools for Africa</em></h1>
<p>Practical calculators for climate risk, water stress, carbon projects, waste, clean cooking and land-use decisions. Build a pathway, run each app, save the result, then export a PDF action pack when the plan is ready.</p>
<div class="cl-hero-stats">
<div class="cl-hero-stat"><span class="cl-hero-stat-num">${TOOLS.length}</span><span class="cl-hero-stat-label">Tools</span></div>
<div class="cl-hero-stat"><span class="cl-hero-stat-num">15</span><span class="cl-hero-stat-label">Country presets</span></div>
<div class="cl-hero-stat"><span class="cl-hero-stat-num">PDF</span><span class="cl-hero-stat-label">Downloadable reports</span></div>
</div>
</div>
</section>
<section class="cl-pathway-builder" aria-labelledby="clPathTitle">
<div class="cl-section-inner">
<div class="cl-pathway-builder-grid">
<div>
<span class="cl-kicker">Start here</span>
<h2 id="clPathTitle">Build a climate workflow before opening a tool</h2>
<p>Risk maps and dashboards show you the numbers, but not what to do next. Tell us your situation and we will line up the first four tools to run, in the right order.</p>
</div>
<form class="cl-pathway-form" id="clPathForm">
<label><span>Country preset</span><select id="clPathCountry">${COUNTRIES.map((c) => `<option value="${esc(c.value)}">${esc(c.label)}</option>`).join("")}</select></label>
<label><span>User type</span><select id="clPathPersona"><option value="farm">Farm or cooperative</option><option value="home">Home or school</option><option value="business">Business or facility</option><option value="project">Carbon or NGO project</option></select></label>
<label><span>Goal</span><select id="clPathGoal"><option value="risk">Reduce risk</option><option value="report">Prepare a report</option><option value="money">Find savings or revenue</option></select></label>
<button class="cl-btn" type="submit">Build pathway</button>
</form>
</div>
<div class="cl-pathway-result" id="clPathOutput"></div>
<div class="cl-pathway-grid">${pathwayCards}</div>
</div>
</section>
<section class="cl-tools-section">
<div class="cl-section-inner">
<h2 class="cl-section-title">Choose the climate decision you need to make</h2>
<p class="cl-section-subtitle">The tools are intentionally different: farm drought risk is not carbon MRV, and e-waste safety is not a tree ROI model. Each app has its own inputs and output plan.</p>
${cardsByGroup}
</div>
</section>
<afro-footer></afro-footer>
<script>window.AfroClimateHubConfig=${JSON.stringify({
    tools: allTools.map((tool) => ({ slug: tool.slug, shortName: tool.shortName, href: `/tools/${tool.slug}/`, desc: tool.desc, workflow: tool.workflow || "", audience: tool.audience || [], tag: (tool.pills && tool.pills[0]) || "" })),
    pathways: HUB_PATHWAYS
  })};</script>
<script src="/assets/js/climate-tools.js"></script>
</body>
</html>
`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(rel, content) {
  const target = path.join(ROOT, rel);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content, "utf8");
}

function registryEntry(tool) {
  const traffic = {
    "carbon-credit": 3200,
    "air-quality": 2800,
    "flood-risk": 2600,
    "tree-planting-roi": 2600,
    "charcoal-vs-clean": 2600,
    "sustainability-scorecard": 2500,
    "ewaste-value": 2400,
    "water-scarcity": 2400,
    "waste-management": 2300,
    "recycling-revenue": 2300,
    "drought-risk": 2200,
    "rainfall-tracker": 2100,
    "deforestation": 1800
  }[tool.slug] || 2000;
  const priority = {
    "carbon-credit": 72,
    "tree-planting-roi": 70,
    "air-quality": 69,
    "flood-risk": 68,
    "sustainability-scorecard": 68,
    "charcoal-vs-clean": 67,
    "ewaste-value": 66,
    "water-scarcity": 65,
    "drought-risk": 64,
    "waste-management": 64,
    "recycling-revenue": 63,
    "rainfall-tracker": 62,
    "deforestation": 58
  }[tool.slug] || 60;
  const revenue = Math.max(15, Math.round(traffic / 100));
  return `  { id: '${tool.slug}', name: '${tool.shortName} for Africa', icon: '${tool.icon}', desc: '${tool.desc.replace(/'/g, "\\'")}', href: '/tools/${tool.slug}/', category: 'climate', tier: 'T3', status: 'live', phase: 'LIVE', countries: ['ALL'], revenue: 'Freemium', estTraffic: ${traffic}, estRevenue: ${revenue}, priority: ${priority} },`;
}

function updateRegistry() {
  const registryPath = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
  const src = fs.readFileSync(registryPath, "utf8");
  const lines = src.split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes("climate (") && line.includes("tools"));
  const end = lines.findIndex((line, idx) => idx > start && line.includes("creative ("));
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not locate climate registry block");
  }
  const block = [
    "  // -- climate (13 tools) --",
    ...TOOLS.map(registryEntry),
    ""
  ];
  const next = lines.slice(0, start).concat(block, lines.slice(end));
  fs.writeFileSync(registryPath, next.join("\n"), "utf8");
}

writeFile("climate/index.html", climateIndexHtml());
for (const tool of TOOLS) {
  writeFile(path.join("tools", tool.slug, "index.html"), pageHtml(tool));
}
updateRegistry();

console.log(`Climate section regenerated: ${TOOLS.length} tools plus category page and registry block.`);
