(function () {
  "use strict";

  var LOCAL_WORKSPACE_KEY = "afro_telecom_workspace";
  var LOCAL_LEADS_KEY = "afro_telecom_leads";
  var PDF_TEMPLATE_SRC = "/assets/js/lib/pdf-template.js";

  var COUNTRIES = [
    ["NG", "Nigeria"],
    ["KE", "Kenya"],
    ["GH", "Ghana"],
    ["ZA", "South Africa"],
    ["EG", "Egypt"],
    ["TZ", "Tanzania"],
    ["UG", "Uganda"],
    ["RW", "Rwanda"],
    ["CM", "Cameroon"],
    ["CI", "Cote d'Ivoire"],
    ["SN", "Senegal"],
    ["MA", "Morocco"]
  ];

  var SOURCES = {
    gsma: {
      label: "GSMA Mobile Economy Africa",
      href: "https://www.gsma.com/mobileeconomy/sub-saharan-africa/"
    },
    dataPricing: {
      label: "Worldwide 1GB data pricing research",
      href: "https://bestbroadbanddeals.co.uk/mobiles/worldwide-data-pricing/"
    },
    whatsapp: {
      label: "WhatsApp Business Platform pricing",
      href: "https://business.whatsapp.com/products/platform-pricing"
    },
    starlink: {
      label: "Starlink availability map",
      href: "https://www.starlink.com/map/"
    },
    dstv: {
      label: "DStv package comparison",
      href: "https://www.dstv.com/en-ng/buy/compare-packages"
    },
    twilio: {
      label: "Twilio SMS pricing and features",
      href: "https://www.twilio.com/en-us/sms/pricing/us"
    },
    africaTalking: {
      label: "Africa's Talking SMS help",
      href: "https://help.africastalking.com/en/collections/150764-sms"
    },
    airalo: {
      label: "Airalo Africa eSIM plans",
      href: "https://www.airalo.com/africa-esim"
    },
    icasa: {
      label: "ICASA numbering and portability",
      href: "https://www.icasa.org.za/pages/numbering"
    },
    caKenya: {
      label: "Kenya CA number portability guide",
      href: "https://repository.ca.go.ke/items/abf5f83d-a36c-47e1-9e13-a70f1aa52208/full"
    },
    ncaGhana: {
      label: "Ghana NCA SIM registration",
      href: "https://nca.org.gh/registration-process/"
    }
  };

  var RELATED = {
    dataPlan: { label: "Data plans", href: "/telecom/data-plan-compare/", brief: "Compare bundle price, validity, and value." },
    usage: { label: "Data usage", href: "/telecom/data-usage-calc/", brief: "Turn habits into a monthly GB target." },
    ussd: { label: "USSD codes", href: "/telecom/ussd-directory/", brief: "Keep balance, bundle, and wallet codes handy." },
    roaming: { label: "Roaming cost", href: "/telecom/roaming-cost/", brief: "Model travel data and local SIM breakeven." },
    internet: { label: "Speed vs cost", href: "/telecom/internet-compare/", brief: "Rank ISPs by cost per Mbps." },
    fiber: { label: "Fiber vs LTE vs 5G", href: "/telecom/fiber-lte-5g/", brief: "Pick the right access technology first." },
    starlink: { label: "Starlink compare", href: "/telecom/starlink-compare/", brief: "Check satellite TCO against local ISPs." },
    business: { label: "Business internet", href: "/telecom/business-internet/", brief: "Size office bandwidth and backup needs." },
    sms: { label: "Bulk SMS", href: "/telecom/bulk-sms-pricing/", brief: "Estimate campaign volume, route, and fees." },
    whatsapp: { label: "WhatsApp vs SMS", href: "/telecom/whatsapp-vs-sms/", brief: "Choose channel by cost, reach, and interactivity." },
    money: { label: "Mobile money fees", href: "/tools/mobile-money-fees/", brief: "Check send, cash-out, and cross-network fees." },
    portability: { label: "Number portability", href: "/telecom/number-portability/", brief: "Switch networks without losing the number." },
    sim: { label: "SIM registration", href: "/telecom/sim-registration/", brief: "Confirm ID and activation rules." },
    tv: { label: "TV packages", href: "/telecom/tv-compare/", brief: "Compare household entertainment value." },
    airtime: { label: "Airtime value", href: "/telecom/airtime-value/", brief: "Estimate airtime recovery value and risk." }
  };

  var WORKFLOWS = {
    dataSaver: workflow("Cut mobile data spend", "Find the right data size, compare plans, then keep the buying code ready.", ["usage", "dataPlan", "ussd", "airtime"]),
    traveller: workflow("Travel connection plan", "Decide between roaming, eSIM, local SIM, and mobile money before you land.", ["roaming", "sim", "dataPlan", "ussd", "money"]),
    homeOffice: workflow("Home or office internet plan", "Choose access technology, compare providers, then add resilience if work depends on it.", ["fiber", "internet", "starlink", "business"]),
    campaign: workflow("Customer messaging plan", "Estimate SMS and WhatsApp costs, then add payment and support fallbacks.", ["sms", "whatsapp", "money", "ussd"]),
    entertainment: workflow("Family entertainment plan", "Budget TV and streaming together so channels do not hide data costs.", ["tv", "usage", "internet", "dataPlan"]),
    switcher: workflow("Network switching plan", "Check registration, portability, and wallet impact before moving a live number.", ["portability", "sim", "ussd", "money"])
  };

  var CONFIGS = {
    "/telecom/data-plan-compare": cfg({
      toolId: "telecom-data-plan",
      workflow: "dataSaver",
      title: "Data buying brief",
      copy: "Pick a bundle by validity, price per GB, and realistic expiry risk, not just the biggest headline allowance.",
      useCases: ["Choose between daily, weekly, and monthly bundles.", "Find the cheapest general-purpose data, not night-only or social bundles.", "Copy a USSD code after deciding."],
      checklist: ["Confirm the operator app or USSD menu before purchase.", "Check expiry, fair-use limits, and whether bonus data is restricted.", "Use the usage calculator first when you are not sure how many GB you need."],
      next: ["Run a weekly and monthly comparison for the same country.", "Copy the top USSD code into your notes before buying.", "If travelling, compare local SIM cost before buying a large bundle."],
      benchmark: ["Global data tables benchmark price per 1GB; AfroTools turns that into a country and operator buying path.", "Competitor plan lists rarely show expiry risk; this flow pushes validity and plan size into the decision.", "The handoff to USSD and usage tools closes the gap between research and purchase."],
      presets: [preset("Nigeria monthly value", { countrySelect: "NG", validityFilter: "30" }), preset("Kenya weekly test", { countrySelect: "KE", validityFilter: "7" })],
      sources: ["dataPricing", "gsma"],
      related: ["usage", "ussd", "roaming"]
    }),
    "/telecom/ussd-directory": cfg({
      toolId: "telecom-ussd",
      workflow: "dataSaver",
      title: "USSD field kit",
      copy: "Treat USSD as a backup channel for low-data moments: balance checks, bundle purchase, mobile money, borrowing airtime, and support.",
      useCases: ["Find a code that works without data.", "Build a support script for agents or field staff.", "Compare operator self-service coverage."],
      checklist: ["USSD menus can change, especially promo and data bundle paths.", "Short codes sometimes differ for prepaid, postpaid, and business lines.", "Do not enter wallet PINs on a shared or untrusted phone."],
      next: ["Search by task first, then operator.", "Save balance, data, and customer-care codes before travel.", "Use the data-plan tool after finding the bundle menu."],
      benchmark: ["Operator support pages list codes one network at a time; AfroTools groups them by user task.", "Travel and field-work competitors often assume data access; this keeps a no-data path visible.", "The dashboard save turns codes into a reusable field checklist."],
      presets: [preset("Find balance codes", { countrySelect: "NG", searchInput: "balance" }), preset("Find mobile money", { countrySelect: "GH", searchInput: "mobile money" })],
      sources: ["gsma"],
      related: ["dataPlan", "money", "airtime"]
    }),
    "/telecom/airtime-value": cfg({
      toolId: "telecom-airtime",
      workflow: "dataSaver",
      title: "Airtime recovery planner",
      copy: "Estimate the cash haircut before you convert excess airtime, then decide whether resale, transfer, or keeping credit is smarter.",
      useCases: ["You received airtime instead of mobile money.", "Compare informal and app-based conversion rates.", "Run a safety checklist before sending airtime to a buyer."],
      checklist: ["High rates from unknown buyers are a scam signal.", "Operator terms may restrict resale or bulk transfers.", "The safest route is usually a known contact or reputable platform."],
      next: ["Model the value range before negotiating.", "Keep screenshots and confirm payment before releasing airtime.", "Use mobile money fee checks for the payout route."],
      benchmark: ["Airtime resale sites focus on exchange rate; AfroTools adds fraud and payout-route checks.", "Mobile money competitors show fees after the transfer; this tool models the haircut before the user sends credit.", "The related mobile-money step helps users compare the final cash path."],
      presets: [preset("NGN 5,000 MTN case", { countrySelect: "NG", operatorSelect: "MTN Nigeria", amountInput: "5000" }, "calcBtn"), preset("KSh 1,000 Safaricom case", { countrySelect: "KE", operatorSelect: "Safaricom", amountInput: "1000" }, "calcBtn")],
      sources: ["gsma"],
      related: ["money", "ussd", "dataPlan"]
    }),
    "/tools/mobile-money-fees": cfg({
      toolId: "mobile-money-fees",
      workflow: "campaign",
      title: "Mobile money route check",
      copy: "Compare the full route: send fee, cash-out pressure, urgency, recipient network, and the worst-fee alternative.",
      useCases: ["Decide between M-Pesa, MoMo, Airtel Money, OPay, or agent cash.", "Account for recipient withdrawal pressure.", "Prepare a fee brief for family, rent, school fees, or business payment."],
      checklist: ["Provider fees and government levies change often.", "Cash-out and cross-network fees can erase a cheap send fee.", "Large or urgent transfers need app or USSD confirmation before sending."],
      next: ["Compare at least two providers and one bank/remittance alternative.", "Copy the route brief into a payment note.", "Contribute real fee observations when the result looks stale."],
      benchmark: ["Wallet apps often show only their own fee; AfroTools compares the route and recipient outcome.", "Messaging tools stop at campaign cost; this handoff checks the payment route behind the campaign.", "The dashboard save makes repeat payout routes easier to reuse."],
      presets: [preset("Kenya family transfer", { mmCountry: "KE", mmAmount: "10000", mmTxType: "send", mmRouteNetwork: "same", mmPurpose: "family" }, ".mm-compare-btn"), preset("Nigeria business payout", { mmCountry: "NG", mmAmount: "50000", mmTxType: "withdraw", mmRouteNetwork: "bank", mmPurpose: "business" }, ".mm-compare-btn")],
      sources: ["gsma"],
      related: ["sms", "whatsapp", "airtime"]
    }),
    "/telecom/data-usage-calc": cfg({
      toolId: "telecom-data-usage",
      workflow: "dataSaver",
      title: "Usage sizing lab",
      copy: "Convert habits into a monthly GB target, then add a buffer before buying a plan or comparing ISPs.",
      useCases: ["Choose between 5 GB, 10 GB, or 25 GB.", "Understand streaming and video-call pressure.", "Size a plan before checking prices."],
      checklist: ["Background app refresh and updates can change the result.", "HD video can multiply data use quickly.", "Shared family devices need a household buffer."],
      next: ["Test a normal day and a heavy weekend day.", "Add 15 to 25 percent headroom.", "Take the target into the data-plan comparator."],
      benchmark: ["Generic data calculators estimate usage; AfroTools ties the result to African bundle and ISP tools.", "Competitors rarely include a purchase workflow; this panel moves the user to price-per-GB next.", "The PDF brief helps families or teams agree on a shared monthly target."],
      presets: [preset("Remote worker day", { countrySelect: "KE", slider_browsing: "3", slider_youtube: "1", quality_youtube: "medium", slider_videocall: "2", slider_downloads: "4" }), preset("Streaming-heavy home", { countrySelect: "ZA", slider_social: "3", slider_youtube: "3", quality_youtube: "hd", slider_downloads: "8" })],
      sources: ["gsma", "dataPricing"],
      related: ["dataPlan", "internet", "business"]
    }),
    "/telecom/roaming-cost": cfg({
      toolId: "telecom-roaming",
      workflow: "traveller",
      title: "Travel SIM decision",
      copy: "Model roaming against a local SIM or eSIM before travel, especially when data is the main cost.",
      useCases: ["Travel between African countries.", "Estimate local-SIM breakeven.", "Build a daily usage budget for calls, SMS, and data."],
      checklist: ["Operator roaming packs can beat default rates.", "eSIM availability varies by destination and phone model.", "Mobile money apps may need your home SIM for OTPs."],
      next: ["Run both a light and heavy data scenario.", "Keep your home SIM active for OTPs if possible.", "Check destination SIM registration rules before arrival."],
      benchmark: ["eSIM marketplaces emphasize package convenience; AfroTools compares eSIM, local SIM, and home roaming in one trip flow.", "Travel blogs often ignore OTP and wallet continuity; this checklist keeps the home SIM decision visible.", "The next step routes the user to SIM registration before they rely on a local line."],
      presets: [preset("Lagos to Nairobi week", { homeCountry: "NG", destCountry: "KE", tripDays: "7", callMins: "10", smsCount: "2", dataMB: "500" }, "calcBtn"), preset("Accra to Johannesburg work trip", { homeCountry: "GH", destCountry: "ZA", tripDays: "5", callMins: "20", smsCount: "5", dataMB: "800" }, "calcBtn")],
      sources: ["airalo", "gsma"],
      related: ["sim", "dataPlan", "usage"]
    }),
    "/telecom/internet-compare": cfg({
      toolId: "telecom-internet",
      workflow: "homeOffice",
      title: "Broadband value board",
      copy: "Compare providers by cost per Mbps, not just price, then inspect whether Starlink or LTE is a fallback rather than the default.",
      useCases: ["Choose home broadband.", "Compare fibre, LTE, 5G, and satellite in one view.", "Find the cheapest usable speed tier."],
      checklist: ["A low price can hide caps, contention, or installation fees.", "Advertised speeds are usually up-to speeds.", "Rural coverage can make LTE or satellite the only realistic option."],
      next: ["Sort by cost per Mbps first, then fastest speed.", "Check installation and router fees before signing.", "Use business internet for offices or critical uptime."],
      benchmark: ["Broadband deal sites benchmark price, speed, and contract terms; AfroTools adds local fallback logic for fibre, LTE, 5G, and satellite.", "Starlink's map answers availability; this tool answers whether the total cost makes sense.", "The workflow continues into business redundancy when the connection is mission-critical."],
      presets: [preset("South Africa value sort", { "country-sel": "ZA", "sort-sel": "cpm" }), preset("Kenya fastest sort", { "country-sel": "KE", "sort-sel": "speed" })],
      sources: ["starlink", "gsma", "dataPricing"],
      related: ["fiber", "starlink", "business"]
    }),
    "/telecom/fiber-lte-5g": cfg({
      toolId: "telecom-fiber-lte-5g",
      workflow: "homeOffice",
      title: "Access technology picker",
      copy: "Choose the access type that matches coverage, latency, mobility, and budget before comparing individual plans.",
      useCases: ["Choose between fibre, LTE router, and 5G.", "Explain why one access type fits a location.", "Get a recommendation from usage, priority, and location."],
      checklist: ["5G coverage is still city-first in many markets.", "Fibre can be best but unavailable at street level.", "LTE reliability depends on tower congestion and signal."],
      next: ["Run the quiz with your actual location type.", "Use internet compare for provider pricing.", "For offices, add a backup route."],
      benchmark: ["Provider coverage maps show where service exists; AfroTools turns coverage, latency, and mobility into a decision.", "Generic speed guides underweight local installation friction; this flow flags availability before price.", "The next app compares real provider cost after the access type is chosen."],
      presets: [preset("South Africa access map", { "country-sel": "ZA" }), preset("Kenya home options", { "country-sel": "KE" })],
      sources: ["gsma", "starlink"],
      related: ["internet", "business", "starlink"]
    }),
    "/telecom/number-portability": cfg({
      toolId: "telecom-portability",
      workflow: "switcher",
      title: "Switching checklist",
      copy: "Porting is operational, not just regulatory: confirm ID, outstanding balances, SIM status, and downtime risk before switching.",
      useCases: ["Keep a number while changing networks.", "Check if MNP is live in a country.", "Prepare a customer-support porting guide."],
      checklist: ["Outstanding debt or inactive SIMs can block porting.", "Business lines may need extra authorization.", "Porting windows can disrupt OTP and bank notifications."],
      next: ["Back up contacts and wallet access before porting.", "Keep old and new SIMs until the port completes.", "Verify mobile money and bank OTP after completion."],
      benchmark: ["Regulator pages explain eligibility; AfroTools turns that into a consumer switching checklist.", "ICASA notes porting scope and timelines, so this page highlights downtime and OTP risk.", "The workflow continues into SIM registration and wallet checks after the port."],
      presets: [preset("Ghana porting check", { "country-sel": "GH" }), preset("Kenya porting check", { "country-sel": "KE" })],
      sources: ["icasa", "caKenya", "ncaGhana"],
      related: ["sim", "ussd", "money"]
    }),
    "/telecom/sim-registration": cfg({
      toolId: "telecom-sim-reg",
      workflow: "switcher",
      title: "SIM compliance desk",
      copy: "Check the ID requirement, verification method, penalty, and operator context before buying or relying on a SIM.",
      useCases: ["Buy a local SIM while traveling.", "Resolve a restricted or revalidation line.", "Check national ID, NIN, Ghana Card, RICA, or passport rules."],
      checklist: ["Deadlines and enforcement waves change by regulator.", "Foreign visitors may have different document paths.", "Registration checks can be operator-specific."],
      next: ["Check the country rule before travel or porting.", "Keep ID, proof of address, and passport photo when required.", "Use the USSD directory for local check codes."],
      benchmark: ["Official regulator pages explain the legal process; AfroTools packages the practical documents and failure points.", "The Ghana NCA flow shows USSD and biometric steps, so this page separates existing, new, and foreign-user checks.", "The PDF brief makes a travel-ready SIM checklist easy to share."],
      presets: [preset("Nigeria NIN check", { "country-sel": "NG" }), preset("Ghana Card check", { "country-sel": "GH" })],
      sources: ["ncaGhana", "gsma"],
      related: ["portability", "roaming", "ussd"]
    }),
    "/telecom/tv-compare": cfg({
      toolId: "telecom-tv",
      workflow: "entertainment",
      title: "Entertainment package chooser",
      copy: "Compare channel count, package price, and streaming alternatives by the household's real viewing habits.",
      useCases: ["Choose DStv, GOtv, Showmax, or a low-cost tier.", "Compare cost per channel, not just package name.", "Set a family or sports budget ceiling."],
      checklist: ["Channel count is not equal to channel value.", "Streaming needs reliable data or broadband.", "Sports rights and package names change frequently."],
      next: ["Set a monthly ceiling first.", "Sort by best value, then inspect must-have channels.", "Use the data usage calculator if streaming is part of the plan."],
      benchmark: ["DStv lets users compare up to five packages; AfroTools adds household budget and streaming-data context.", "Package pages show channels but rarely model broadband impact; this workflow links TV to usage and internet tools.", "The PDF brief helps families decide before renewing a package."],
      presets: [preset("Nigeria under 10k", { "country-sel": "NG", "sort-sel": "value", "price-max": "10000" }), preset("Kenya most channels", { "country-sel": "KE", "sort-sel": "channels-desc", "price-max": "15000" })],
      sources: ["dstv", "dataPricing"],
      related: ["usage", "internet", "dataPlan"]
    }),
    "/telecom/starlink-compare": cfg({
      toolId: "telecom-starlink",
      workflow: "homeOffice",
      title: "Satellite breakeven desk",
      copy: "Use Starlink as a total-cost and availability decision, not only a speed promise.",
      useCases: ["You are outside reliable fibre coverage.", "You need backup internet for a business or creator setup.", "Compare hardware plus monthly cost against local ISPs."],
      checklist: ["Availability, hardware price, and service plans change by country.", "Obstructions and installation quality affect performance.", "Local fibre usually wins where it is reliable and uncapped."],
      next: ["Check official availability before buying hardware.", "Compare one-year and three-year total cost.", "Pair Starlink with local LTE if uptime matters."],
      benchmark: ["Starlink's map answers availability; AfroTools adds local ISP and multi-year breakeven context.", "Satellite reviews focus on speed; this tool foregrounds hardware, installation, and backup routing.", "The business-internet handoff turns the result into an uptime plan."],
      presets: [preset("Nigeria TCO check", { "country-select": "NG" }), preset("Kenya TCO check", { "country-select": "KE" })],
      sources: ["starlink", "gsma"],
      related: ["internet", "fiber", "business"]
    }),
    "/telecom/business-internet": cfg({
      toolId: "telecom-business-internet",
      workflow: "homeOffice",
      title: "Office bandwidth planner",
      copy: "Estimate seats, usage, redundancy, and SLA needs before talking to an ISP sales rep.",
      useCases: ["Size office internet for staff and cloud tools.", "Prepare a dedicated versus shared line conversation.", "Plan backup for payments, POS, VoIP, or support desks."],
      checklist: ["Employee count alone understates video and upload demand.", "Shared plans can collapse during peak hours.", "Business-critical teams need a second provider or LTE fallback."],
      next: ["Run the same case at 25, 50, and 100 Mbps.", "Ask providers for uptime SLA, static IP, and support hours.", "Budget for router, installation, and backup data."],
      benchmark: ["Business broadband pages quote speed tiers; AfroTools translates headcount and usage into an SLA conversation.", "Generic calculators rarely include backup route cost; this flow treats redundancy as part of the plan.", "The dashboard save gives teams a repeatable ISP shopping brief."],
      presets: [preset("25-person cloud office", { "country-select": "KE", employees: "25", speed: "50", usage: "moderate" }, "calc-btn"), preset("80-person heavy office", { "country-select": "ZA", employees: "80", speed: "100", usage: "heavy" }, "calc-btn")],
      sources: ["gsma", "starlink"],
      related: ["internet", "fiber", "starlink"]
    }),
    "/telecom/bulk-sms-pricing": cfg({
      toolId: "telecom-bulk-sms",
      workflow: "campaign",
      title: "SMS campaign cost desk",
      copy: "Estimate campaign cost by country, route, and volume, then compare SMS with WhatsApp before sending.",
      useCases: ["Plan OTP, alert, billing, or marketing SMS.", "Model volume-tier impact.", "Get an international SMS rough order of magnitude."],
      checklist: ["Delivery quality and sender ID approval matter as much as price.", "International routes can add destination and carrier surcharges.", "High-volume marketing may perform better on WhatsApp or email."],
      next: ["Model monthly and annual costs.", "Ask gateways about sender ID, delivery reports, and opt-out handling.", "Compare the same volume in WhatsApp vs SMS."],
      benchmark: ["Twilio exposes SMS, RCS, carrier fees, volume discounts, compliance, and delivery features; AfroTools converts those into an African campaign checklist.", "Africa's Talking support material highlights country-specific sender ID requirements; this page keeps sender ID in the buying brief.", "The WhatsApp handoff turns a single-channel quote into a channel strategy."],
      presets: [preset("50k Kenya domestic", { "country-select": "KE", "sms-type": "domestic", "volume-slider": "50000" }), preset("250k Nigeria international", { "country-select": "NG", "sms-type": "international", "volume-slider": "250000" })],
      sources: ["twilio", "africaTalking", "whatsapp"],
      related: ["whatsapp", "money", "ussd"]
    }),
    "/telecom/whatsapp-vs-sms": cfg({
      toolId: "telecom-whatsapp-vs-sms",
      workflow: "campaign",
      title: "Messaging channel strategy",
      copy: "Compare WhatsApp marketing, utility, authentication, and service messages against SMS, then choose channel by reach and interactivity.",
      useCases: ["Budget customer notifications.", "Find a breakeven point for WhatsApp templates versus SMS.", "Split marketing, utility, authentication, and service traffic."],
      checklist: ["WhatsApp pricing is category-based and market-based.", "SMS still wins for feature phones and no-data users.", "Compliance, consent, and opt-out handling shape both channels."],
      next: ["Run one transactional and one marketing-heavy split.", "Use SMS for offline reach and WhatsApp for rich conversations.", "Check the official rate card before a large campaign."],
      benchmark: ["WhatsApp now emphasizes per-message pricing by delivered message, market, and category; AfroTools lets users model the traffic mix.", "SMS platforms expose compliance and delivery reports; this comparison forces the same operational checks into WhatsApp decisions.", "The campaign workflow saves both cost and payment-route follow-ups to the dashboard."],
      presets: [preset("Transactional 50k NG", { "country-select": "NG", volume: "50000", "split-marketing": "10", "split-utility": "70", "split-service": "20" }, "calc-btn"), preset("Marketing 100k KE", { "country-select": "KE", volume: "100000", "split-marketing": "60", "split-utility": "30", "split-service": "10" }, "calc-btn")],
      sources: ["whatsapp", "twilio"],
      related: ["sms", "money", "ussd"]
    })
  };

  function workflow(label, summary, steps) {
    return { label: label, summary: summary, steps: steps || [] };
  }

  function cfg(config) {
    config = config || {};
    config.useCases = config.useCases || [];
    config.checklist = config.checklist || [];
    config.next = config.next || [];
    config.benchmark = config.benchmark || [];
    config.presets = config.presets || [];
    config.sources = config.sources || [];
    config.related = config.related || [];
    return config;
  }

  function preset(label, values, click) {
    return { label: label, values: values || {}, click: click || "" };
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseJson(value, fallback) {
    try {
      var parsed = JSON.parse(value || "");
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function readLocal(key, fallback) {
    try {
      return parseJson(localStorage.getItem(key), fallback);
    } catch (error) {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function routeKey() {
    var path = window.location.pathname || "/";
    path = path.replace(/\/index\.html$/i, "/").replace(/\/$/, "");
    return path || "/";
  }

  function slugFromPath(path) {
    return String(path || routeKey()).replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "telecom";
  }

  function getQuery() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (error) {
      return new URLSearchParams("");
    }
  }

  function getCountryName(code) {
    code = String(code || "").toUpperCase();
    for (var i = 0; i < COUNTRIES.length; i += 1) {
      if (COUNTRIES[i][0] === code) return COUNTRIES[i][1];
    }
    return code || "Africa";
  }

  function countryOptions(selected) {
    selected = String(selected || "NG").toUpperCase();
    return COUNTRIES.map(function (item) {
      return '<option value="' + esc(item[0]) + '"' + (item[0] === selected ? " selected" : "") + ">" + esc(item[1]) + "</option>";
    }).join("");
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
  }

  function getStoredEmail() {
    try {
      var user = window.AfroAuth && typeof window.AfroAuth.getUser === "function" ? window.AfroAuth.getUser() : null;
      if (user && user.email) return user.email;
    } catch (error) {}
    try {
      return localStorage.getItem("afrotools_lead_email") || localStorage.getItem("afrotools-email-gate") || "";
    } catch (error) {
      return "";
    }
  }

  function getDeviceType() {
    var width = window.innerWidth || 1024;
    if (width < 720) return "mobile";
    if (width < 1040) return "tablet";
    return "desktop";
  }

  function buildHref(href, state) {
    try {
      var url = new URL(href, window.location.origin);
      if (state && state.country) url.searchParams.set("telecom_country", state.country);
      if (state && state.goal) url.searchParams.set("telecom_goal", state.goal);
      if (state && state.planId) url.searchParams.set("telecom_plan", state.planId);
      return url.pathname + url.search;
    } catch (error) {
      return href;
    }
  }

  function injectStyles() {
    if (document.getElementById("telecom-toolkit-style")) return;
    var style = document.createElement("style");
    style.id = "telecom-toolkit-style";
    style.textContent = [
      ".telecom-toolkit{max-width:1120px;margin:34px auto 0;padding:0}",
      ".telecom-toolkit__inner{border:1px solid #dbeafe;background:linear-gradient(180deg,#f8fbff,#fff);border-radius:14px;padding:22px}",
      ".telecom-toolkit__kicker{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#0369a1;margin-bottom:8px}",
      ".telecom-toolkit h2{font-size:1.25rem;line-height:1.2;margin:0 0 8px;color:#0f172a}",
      ".telecom-toolkit h3{margin:0}",
      ".telecom-toolkit p{font-size:.9rem;color:#475569;line-height:1.65;margin:0}",
      ".telecom-toolkit__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}",
      ".telecom-toolkit__block{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px}",
      ".telecom-toolkit__block h3{font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#0f172a;margin:0 0 8px}",
      ".telecom-toolkit__block ul{margin:0;padding:0;list-style:none;display:grid;gap:7px}",
      ".telecom-toolkit__block li{font-size:.82rem;line-height:1.5;color:#475569;position:relative;padding-left:14px}",
      ".telecom-toolkit__block li:before{content:'';position:absolute;left:0;top:.62em;width:5px;height:5px;border-radius:50%;background:#06b6d4}",
      ".telecom-toolkit__presets,.telecom-toolkit__links,.telecom-toolkit__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}",
      ".telecom-toolkit button,.telecom-toolkit a.telecom-pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:.78rem;font-weight:800;text-decoration:none;min-height:36px;padding:8px 12px}",
      ".telecom-toolkit button{border:1px solid #0891b2;background:#06b6d4;color:#fff;cursor:pointer}",
      ".telecom-toolkit button.secondary{border-color:#bfdbfe;background:#fff;color:#075985}",
      ".telecom-toolkit a.telecom-pill{border:1px solid #dbeafe;background:#fff;color:#075985}",
      ".telecom-toolkit__sources{border-top:1px solid #e2e8f0;margin-top:16px;padding-top:12px;font-size:.76rem;color:#64748b;line-height:1.6}",
      ".telecom-toolkit__sources a{border:none;background:transparent;min-height:auto;padding:0;margin-right:10px;color:#0369a1;text-decoration:underline;text-underline-offset:3px}",
      ".telecom-lead{margin-top:18px;display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px}",
      ".telecom-lead label,.telecom-planner label{display:grid;gap:5px;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#334155}",
      ".telecom-lead input,.telecom-lead select,.telecom-planner input,.telecom-planner select{width:100%;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;min-height:38px;padding:8px 10px;font:inherit;font-size:.86rem}",
      ".telecom-lead__check{display:flex;align-items:center;gap:7px;font-size:.78rem;color:#475569;text-transform:none;letter-spacing:0;font-weight:700}",
      ".telecom-lead__check input{width:16px;min-height:16px}",
      ".telecom-status{font-size:.78rem;color:#475569;margin-top:9px;min-height:20px}",
      ".telecom-status.error{color:#b91c1c}.telecom-status.good{color:#047857}",
      ".telecom-workflow{margin-top:18px;border:1px solid #dbeafe;background:#fff;border-radius:12px;padding:14px}",
      ".telecom-workflow__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}",
      ".telecom-workflow__steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}",
      ".telecom-step{border:1px solid #e2e8f0;border-radius:10px;padding:10px;text-decoration:none;color:#0f172a;background:#f8fafc}",
      ".telecom-step strong{display:block;font-size:.8rem;margin-bottom:4px}.telecom-step span{display:block;font-size:.74rem;color:#64748b;line-height:1.45}",
      ".telecom-toolkit-hub{max-width:1120px;margin:34px auto 0;padding:0 24px}",
      ".telecom-planner{margin-top:18px;background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:16px}",
      ".telecom-planner__form{display:grid;grid-template-columns:1.1fr 1.1fr .8fr 1.2fr;gap:10px;align-items:end}",
      ".telecom-planner__result{margin-top:14px}",
      ".telecom-planner__result:empty{display:none}",
      ".telecom-planner__card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px}",
      ".telecom-planner__meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}",
      ".telecom-chip{display:inline-flex;align-items:center;border:1px solid #dbeafe;background:#eff6ff;color:#075985;border-radius:999px;padding:5px 9px;font-size:.72rem;font-weight:800}",
      ".telecom-toolkit-hub__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}",
      ".telecom-toolkit-hub__card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-decoration:none;color:#0f172a}",
      ".telecom-toolkit-hub__card strong{display:block;font-size:.9rem;margin-bottom:5px}",
      ".telecom-toolkit-hub__card span{display:block;font-size:.78rem;color:#64748b;line-height:1.5}",
      "@media(max-width:920px){.telecom-toolkit__grid,.telecom-toolkit-hub__grid,.telecom-workflow__steps,.telecom-lead,.telecom-planner__form{grid-template-columns:1fr}.telecom-toolkit__inner{padding:18px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function list(items) {
    return "<ul>" + items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>";
  }

  function setField(id, value, notify) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = !!value;
    } else {
      el.value = value;
    }
    if (notify === false) return;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clickTarget(selectorOrId) {
    if (!selectorOrId) return;
    var el = document.getElementById(selectorOrId) || document.querySelector(selectorOrId);
    if (el && typeof el.click === "function") el.click();
  }

  function applyPreset(config, index) {
    var item = config.presets[index];
    if (!item) return;
    Object.keys(item.values).forEach(function (id) { setField(id, item.values[id], false); });
    Object.keys(item.values).forEach(function (id) { setField(id, item.values[id]); });
    window.setTimeout(function () {
      Object.keys(item.values).forEach(function (id) { setField(id, item.values[id], false); });
      Object.keys(item.values).forEach(function (id) { setField(id, item.values[id]); });
      clickTarget(item.click);
    }, 90);
  }

  function getWorkflow(key) {
    return WORKFLOWS[key] || WORKFLOWS.dataSaver;
  }

  function getWorkflowSteps(key, state) {
    return getWorkflow(key).steps.map(function (stepKey) {
      var item = RELATED[stepKey];
      if (!item) return "";
      return '<a class="telecom-step" href="' + esc(buildHref(item.href, state || {})) + '">' +
        "<strong>" + esc(item.label) + "</strong>" +
        "<span>" + esc(item.brief) + "</span>" +
        "</a>";
    }).join("");
  }

  function renderWorkflow(config, state) {
    var flow = getWorkflow(config.workflow);
    return '<div class="telecom-workflow">' +
      '<div class="telecom-workflow__head">' +
      '<div><div class="telecom-toolkit__kicker">Workflow</div><h3>' + esc(flow.label) + '</h3><p>' + esc(flow.summary) + '</p></div>' +
      '<a class="telecom-pill" href="/dashboard/#myWorkspace">Dashboard</a>' +
      '</div>' +
      '<div class="telecom-workflow__steps">' + getWorkflowSteps(config.workflow, state) + '</div>' +
      '</div>';
  }

  function renderPresets(config) {
    if (!config.presets || !config.presets.length) return "";
    return '<div class="telecom-toolkit__presets">' + config.presets.map(function (item, index) {
      return '<button type="button" data-telecom-preset="' + index + '">' + esc(item.label) + "</button>";
    }).join("") + "</div>";
  }

  function renderRelated(config, state) {
    if (!config.related || !config.related.length) return "";
    return '<div class="telecom-toolkit__links">' + config.related.map(function (key) {
      var item = RELATED[key];
      return item ? '<a class="telecom-pill" href="' + esc(buildHref(item.href, state || {})) + '">' + esc(item.label) + "</a>" : "";
    }).join("") + "</div>";
  }

  function renderSources(config) {
    if (!config.sources || !config.sources.length) return "";
    return '<div class="telecom-toolkit__sources"><strong>Research checked:</strong> ' + config.sources.map(function (key) {
      var source = SOURCES[key];
      return source ? '<a href="' + esc(source.href) + '" target="_blank" rel="noopener">' + esc(source.label) + "</a>" : "";
    }).join("") + "</div>";
  }

  function renderLeadGate(config, country) {
    var email = getStoredEmail();
    return '<form class="telecom-lead" id="telecom-lead-form" novalidate>' +
      '<label>Name <input id="telecom-lead-name" name="name" autocomplete="name" placeholder="Optional"></label>' +
      '<label>Email for PDF <input id="telecom-lead-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(email) + '"></label>' +
      '<label>Country <select id="telecom-country-context">' + countryOptions(country) + '</select></label>' +
      '<label class="telecom-lead__check"><input id="telecom-lead-optin" type="checkbox" checked> Send useful telecom updates</label>' +
      '<div class="telecom-toolkit__actions">' +
      '<button type="button" data-telecom-action="save">Save to dashboard</button>' +
      '<button type="button" class="secondary" data-telecom-action="pdf">Unlock PDF brief</button>' +
      '</div>' +
      '<div class="telecom-status" id="telecom-status" aria-live="polite"></div>' +
      '</form>';
  }

  function setStatus(message, type) {
    var el = document.getElementById("telecom-status") || document.getElementById("telecom-hub-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "telecom-status" + (type ? " " + type : "");
  }

  function getCurrentCountry(fallback) {
    var params = getQuery();
    var fromUrl = params.get("telecom_country") || params.get("country");
    if (fromUrl) return String(fromUrl).toUpperCase();
    var ids = ["telecom-country-context", "countrySelect", "country-sel", "country-select", "homeCountry", "destCountry", "mmCountry"];
    for (var i = 0; i < ids.length; i += 1) {
      var el = document.getElementById(ids[i]);
      if (el && el.value) return String(el.value).toUpperCase();
    }
    return fallback || "NG";
  }

  function getLeadData() {
    var emailEl = document.getElementById("telecom-lead-email") || document.getElementById("telecom-hub-email");
    var nameEl = document.getElementById("telecom-lead-name") || document.getElementById("telecom-hub-name");
    var optEl = document.getElementById("telecom-lead-optin") || document.getElementById("telecom-hub-optin");
    return {
      email: normalizeEmail(emailEl ? emailEl.value : ""),
      name: nameEl ? String(nameEl.value || "").trim() : "",
      optInDigest: !optEl || optEl.checked
    };
  }

  function makeRecord(config, source, extra) {
    var country = getCurrentCountry(extra && extra.country);
    var flow = getWorkflow(config.workflow || (extra && extra.goal) || "dataSaver");
    var lead = getLeadData();
    var id = "tel-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    var href = window.location.pathname + window.location.search;
    var record = {
      id: id,
      itemType: source === "hub" ? "telecom-plan" : "telecom-brief",
      toolId: config.toolId || slugFromPath(),
      title: extra && extra.title ? extra.title : config.title,
      summary: extra && extra.summary ? extra.summary : config.copy,
      country: country,
      countryName: getCountryName(country),
      workflow: config.workflow || (extra && extra.goal) || "dataSaver",
      workflowLabel: flow.label,
      href: href,
      email: lead.email,
      name: lead.name,
      optInDigest: lead.optInDigest,
      checklist: config.checklist || [],
      next: config.next || [],
      benchmark: config.benchmark || [],
      sources: config.sources || [],
      steps: flow.steps.map(function (key) {
        var item = RELATED[key] || {};
        return { key: key, label: item.label || key, href: item.href || "/telecom/", brief: item.brief || "" };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        if (extra[key] !== undefined) record[key] = extra[key];
      });
    }
    return record;
  }

  function captureLead(record, source) {
    if (!record.email || !isEmail(record.email)) return Promise.resolve({ ok: false, skipped: true });
    try {
      localStorage.setItem("afrotools_lead_email", record.email);
    } catch (error) {}
    var leads = readLocal(LOCAL_LEADS_KEY, []);
    if (!Array.isArray(leads)) leads = [];
    leads.unshift({
      email: record.email,
      name: record.name || "",
      source: source || "telecom-pdf-gate",
      toolSlug: record.toolId,
      countryCode: record.country,
      href: record.href,
      createdAt: new Date().toISOString()
    });
    writeLocal(LOCAL_LEADS_KEY, leads.slice(0, 50));
    return fetch("/api/capture-lead", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: record.email,
        name: record.name || "",
        source: source || "telecom-pdf-gate",
        toolSlug: record.toolId,
        countryCode: record.country,
        optInDigest: record.optInDigest !== false,
        pageUrl: window.location.href,
        referrerUrl: document.referrer || "",
        deviceType: getDeviceType(),
        conversionValue: source === "telecom-pdf-gate" ? 2 : 1
      })
    }).then(function (response) {
      return response.json().catch(function () { return { ok: response.ok }; });
    }).catch(function () {
      return { ok: true, stored: false, local: true };
    });
  }

  function ensureWorkspaceSync() {
    if (window.AfroWorkspace) return Promise.resolve();
    if (document.querySelector('script[src*="workspace-sync.js"]')) {
      return new Promise(function (resolve) { window.setTimeout(resolve, 400); });
    }
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = "/assets/js/lib/workspace-sync.js";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  async function saveTelecomItem(record) {
    var items = readLocal(LOCAL_WORKSPACE_KEY, []);
    if (!Array.isArray(items)) items = [];
    items = items.filter(function (item) { return item.id !== record.id; });
    items.unshift(record);
    writeLocal(LOCAL_WORKSPACE_KEY, items.slice(0, 60));

    try {
      if (window.AfroData) {
        if (typeof window.AfroData.save === "function") window.AfroData.save(record.toolId, record);
        if (typeof window.AfroData.logToolUse === "function") window.AfroData.logToolUse(record.toolId, record.title);
      }
    } catch (error) {}

    try {
      window.dispatchEvent(new CustomEvent("afro-workspace-change", { detail: { source: "telecom", item: record } }));
    } catch (error) {}

    await ensureWorkspaceSync();
    try {
      if (window.AfroWorkspace && window.AfroWorkspace.isSignedIn && window.AfroWorkspace.isSignedIn()) {
        await window.AfroWorkspace.upsert({
          itemType: record.itemType,
          itemKey: record.id,
          toolSlug: record.toolId,
          title: record.title,
          summary: record.countryName + " - " + record.workflowLabel,
          href: record.href,
          payload: record,
          meta: { category: "telecom", countryCode: record.country, workflow: record.workflow }
        });
      }
    } catch (error) {
      console.warn("[TelecomToolkit] workspace sync skipped:", error.message || error);
    }
    return record;
  }

  function loadPdfTemplate() {
    if (window.AfroTools && window.AfroTools.pdf && window.AfroTools.pdf.generate) return Promise.resolve();
    if (document.querySelector('script[src*="pdf-template.js"]')) {
      return new Promise(function (resolve) { window.setTimeout(resolve, 500); });
    }
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = PDF_TEMPLATE_SRC;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function rowsFrom(items) {
    return (items || []).slice(0, 6).map(function (item, index) {
      return { label: "Check " + (index + 1), value: item };
    });
  }

  function sourceText(record) {
    return (record.sources || []).map(function (key) {
      var source = SOURCES[key];
      return source ? source.label + ": " + source.href : "";
    }).filter(Boolean).join(" | ");
  }

  function printFallback(record) {
    var popup = window.open("", "_blank", "noopener");
    if (!popup) {
      setStatus("PDF popup was blocked. Allow popups or try again.", "error");
      return;
    }
    popup.document.write("<!doctype html><title>" + esc(record.title) + "</title><body style='font-family:Arial,sans-serif;max-width:760px;margin:40px auto;line-height:1.55;color:#111827'>" +
      "<h1>" + esc(record.title) + "</h1>" +
      "<p><strong>Country:</strong> " + esc(record.countryName) + "</p>" +
      "<p><strong>Workflow:</strong> " + esc(record.workflowLabel) + "</p>" +
      "<h2>Checklist</h2>" + list(record.checklist) +
      "<h2>Competitor benchmark</h2>" + list(record.benchmark) +
      "<h2>Next steps</h2>" + list(record.next) +
      "<p style='font-size:12px;color:#6b7280'>Generated by AfroTools. Use your browser print dialog to save as PDF.</p>" +
      "</body>");
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function generatePdf(record) {
    try {
      await loadPdfTemplate();
      if (window.AfroTools && window.AfroTools.pdf && window.AfroTools.pdf.generate) {
        await window.AfroTools.pdf.generate({
          toolId: record.toolId,
          title: record.title,
          subtitle: record.countryName + " telecom decision brief",
          country: record.country,
          heroStats: [
            { label: "Workflow", value: record.workflowLabel, highlight: true },
            { label: "Country", value: record.country },
            { label: "Saved", value: new Date().toLocaleDateString("en-GB") }
          ],
          sections: [
            {
              title: "Decision brief",
              rows: [
                { label: "Tool", value: record.title, highlight: true },
                { label: "Country", value: record.countryName },
                { label: "Workflow", value: record.workflowLabel },
                { label: "Dashboard", value: "Saved under Telecom workspace" }
              ]
            },
            { title: "Checks before action", rows: rowsFrom(record.checklist) },
            { title: "Competitor benchmark", rows: rowsFrom(record.benchmark) },
            { title: "Next actions", rows: rowsFrom(record.next) }
          ],
          source: sourceText(record),
          disclaimer: "Telecom prices, package names, and regulations change frequently. Confirm with the operator, regulator, or provider before buying, porting, or sending a campaign."
        });
      } else {
        printFallback(record);
      }
    } catch (error) {
      console.warn("[TelecomToolkit] PDF fallback:", error.message || error);
      printFallback(record);
    }
  }

  async function handleSave(config) {
    var record = makeRecord(config, "tool");
    await saveTelecomItem(record);
    if (record.email && isEmail(record.email)) captureLead(record, "telecom-workspace-save");
    setStatus("Saved to your Telecom dashboard workspace.", "good");
  }

  async function handlePdf(config) {
    var record = makeRecord(config, "tool");
    if (!isEmail(record.email)) {
      setStatus("Enter a valid email to unlock the PDF brief.", "error");
      var emailEl = document.getElementById("telecom-lead-email");
      if (emailEl) emailEl.focus();
      return;
    }
    setStatus("Capturing the email gate and preparing the PDF brief...", "");
    await captureLead(record, "telecom-pdf-gate");
    await saveTelecomItem(record);
    await generatePdf(record);
    setStatus("PDF brief generated and saved to your dashboard workspace.", "good");
  }

  function applyUrlContext() {
    var params = getQuery();
    var country = params.get("telecom_country");
    if (country) {
      ["telecom-country-context", "countrySelect", "country-sel", "country-select", "homeCountry", "mmCountry"].forEach(function (id) {
        setField(id, country.toUpperCase(), true);
      });
    }
    var email = params.get("telecom_email");
    if (email) {
      var el = document.getElementById("telecom-lead-email");
      if (el) el.value = email;
    }
  }

  function renderPanel(config) {
    if (document.getElementById("telecom-toolkit-panel")) return;
    var host = document.querySelector(".tool-main") || document.querySelector(".mm-wrap") || document.querySelector("main") || document.body;
    var state = { country: getCurrentCountry("NG"), goal: config.workflow };
    var panel = document.createElement("section");
    panel.id = "telecom-toolkit-panel";
    panel.className = "telecom-toolkit";
    panel.setAttribute("aria-labelledby", "telecom-toolkit-title");
    panel.innerHTML =
      '<div class="telecom-toolkit__inner">' +
      '<div class="telecom-toolkit__kicker">Tool upgrade layer</div>' +
      '<h2 id="telecom-toolkit-title">' + esc(config.title) + "</h2>" +
      "<p>" + esc(config.copy) + "</p>" +
      '<div class="telecom-toolkit__grid">' +
      '<div class="telecom-toolkit__block"><h3>Use it for</h3>' + list(config.useCases) + "</div>" +
      '<div class="telecom-toolkit__block"><h3>Check first</h3>' + list(config.checklist) + "</div>" +
      '<div class="telecom-toolkit__block"><h3>Competitor gap</h3>' + list(config.benchmark) + "</div>" +
      "</div>" +
      renderWorkflow(config, state) +
      renderPresets(config) +
      renderRelated(config, state) +
      renderLeadGate(config, state.country) +
      renderSources(config) +
      "</div>";
    host.appendChild(panel);
    panel.querySelectorAll("[data-telecom-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyPreset(config, Number(btn.getAttribute("data-telecom-preset")));
      });
    });
    panel.querySelector('[data-telecom-action="save"]').addEventListener("click", function () { handleSave(config); });
    panel.querySelector('[data-telecom-action="pdf"]').addEventListener("click", function () { handlePdf(config); });
    applyUrlContext();
  }

  function buildHubPlan() {
    var goalEl = document.getElementById("telecom-hub-goal");
    var countryEl = document.getElementById("telecom-hub-country");
    var spendEl = document.getElementById("telecom-hub-spend");
    var goal = goalEl ? goalEl.value : "dataSaver";
    var country = countryEl ? countryEl.value : "NG";
    var spend = spendEl ? String(spendEl.value || "").trim() : "";
    var flow = getWorkflow(goal);
    return {
      id: "tel-plan-" + Date.now().toString(36),
      goal: goal,
      title: flow.label,
      summary: flow.summary,
      country: country,
      countryName: getCountryName(country),
      spend: spend,
      workflowLabel: flow.label,
      workflow: goal,
      checklist: [
        "Run the tools in order, because each step gives context to the next.",
        "Save the result after each major decision so the dashboard becomes the working file.",
        "Use the PDF brief when you need to share the plan with family, staff, or a client."
      ],
      next: flow.steps.map(function (key) {
        var item = RELATED[key] || {};
        return item.label ? item.label + ": " + item.brief : key;
      }),
      benchmark: [
        "Competitor tools usually solve one telecom question at a time.",
        "This workflow ties price, compliance, connectivity, messaging, and payments into one path.",
        "Dashboard saves and gated briefs make the plan reusable after the first visit."
      ],
      sources: ["gsma", "dataPricing", "whatsapp", "starlink"],
      steps: flow.steps.map(function (key) {
        var item = RELATED[key] || {};
        return { key: key, label: item.label || key, href: item.href || "/telecom/", brief: item.brief || "" };
      })
    };
  }

  function renderHubPlan(plan) {
    var result = document.getElementById("telecom-planner-result");
    if (!result) return;
    var state = { country: plan.country, goal: plan.goal, planId: plan.id };
    result.innerHTML =
      '<div class="telecom-planner__card">' +
      '<div class="telecom-toolkit__kicker">Recommended workflow</div>' +
      '<h3>' + esc(plan.title) + " for " + esc(plan.countryName) + "</h3>" +
      "<p>" + esc(plan.summary) + "</p>" +
      '<div class="telecom-planner__meta">' +
      '<span class="telecom-chip">' + esc(plan.countryName) + "</span>" +
      (plan.spend ? '<span class="telecom-chip">Budget: ' + esc(plan.spend) + "</span>" : "") +
      '<span class="telecom-chip">' + esc(plan.steps.length) + " steps</span>" +
      "</div>" +
      '<div class="telecom-workflow__steps">' + plan.steps.map(function (step) {
        return '<a class="telecom-step" href="' + esc(buildHref(step.href, state)) + '">' +
          "<strong>" + esc(step.label) + "</strong><span>" + esc(step.brief) + "</span></a>";
      }).join("") + "</div>" +
      '<div class="telecom-toolkit__actions">' +
      '<button type="button" data-hub-action="save">Save plan to dashboard</button>' +
      '<button type="button" class="secondary" data-hub-action="pdf">Email-gated PDF plan</button>' +
      "</div>" +
      "</div>";
    result.querySelector('[data-hub-action="save"]').addEventListener("click", function () { handleHubSave(plan, false); });
    result.querySelector('[data-hub-action="pdf"]').addEventListener("click", function () { handleHubSave(plan, true); });
  }

  async function handleHubSave(plan, wantsPdf) {
    var lead = getLeadData();
    var record = makeRecord({
      toolId: "telecom-category-workflow",
      workflow: plan.goal,
      title: plan.title,
      copy: plan.summary,
      checklist: plan.checklist,
      next: plan.next,
      benchmark: plan.benchmark,
      sources: plan.sources
    }, "hub", {
      id: plan.id,
      title: plan.title,
      summary: plan.summary,
      country: plan.country,
      countryName: plan.countryName,
      spend: plan.spend,
      steps: plan.steps,
      href: "/telecom/?telecom_country=" + encodeURIComponent(plan.country) + "&telecom_goal=" + encodeURIComponent(plan.goal)
    });
    record.email = lead.email;
    record.name = lead.name;
    record.optInDigest = lead.optInDigest;
    if (wantsPdf && !isEmail(record.email)) {
      setStatus("Enter a valid email to unlock the PDF plan.", "error");
      var emailEl = document.getElementById("telecom-hub-email");
      if (emailEl) emailEl.focus();
      return;
    }
    if (record.email && isEmail(record.email)) await captureLead(record, wantsPdf ? "telecom-hub-pdf-gate" : "telecom-hub-save");
    await saveTelecomItem(record);
    if (wantsPdf) {
      await generatePdf(record);
      setStatus("PDF plan generated and saved to your Telecom workspace.", "good");
    } else {
      setStatus("Telecom workflow saved to your dashboard workspace.", "good");
    }
  }

  function renderHub() {
    if (document.getElementById("telecom-toolkit-hub")) return;
    var anchor = document.querySelector(".telecom-stats-bar") || document.querySelector(".telecom-hero");
    if (!anchor) return;
    var params = getQuery();
    var selectedGoal = params.get("telecom_goal") || "dataSaver";
    var selectedCountry = params.get("telecom_country") || "NG";
    var email = getStoredEmail();
    var section = document.createElement("section");
    section.id = "telecom-toolkit-hub";
    section.className = "telecom-toolkit-hub telecom-toolkit";
    section.innerHTML =
      '<div class="telecom-toolkit__inner">' +
      '<div class="telecom-toolkit__kicker">Start from the homepage</div>' +
      "<h2>Build a telecom workflow, then carry it across the apps</h2>" +
      "<p>Pick the job, save the route to your dashboard, and unlock a shareable PDF plan when email capture matters.</p>" +
      '<div class="telecom-planner">' +
      '<div class="telecom-planner__form">' +
      '<label>Goal <select id="telecom-hub-goal">' + Object.keys(WORKFLOWS).map(function (key) {
        return '<option value="' + esc(key) + '"' + (key === selectedGoal ? " selected" : "") + ">" + esc(WORKFLOWS[key].label) + "</option>";
      }).join("") + "</select></label>" +
      '<label>Country <select id="telecom-hub-country">' + countryOptions(selectedCountry) + "</select></label>" +
      '<label>Budget <input id="telecom-hub-spend" inputmode="decimal" placeholder="Optional"></label>' +
      '<label>Email for PDF <input id="telecom-hub-email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(email) + '"></label>' +
      '<label>Name <input id="telecom-hub-name" autocomplete="name" placeholder="Optional"></label>' +
      '<label class="telecom-lead__check"><input id="telecom-hub-optin" type="checkbox" checked> Send useful telecom updates</label>' +
      '<div class="telecom-toolkit__actions"><button type="button" id="telecom-build-plan">Build workflow</button></div>' +
      "</div>" +
      '<div class="telecom-status" id="telecom-hub-status" aria-live="polite"></div>' +
      '<div class="telecom-planner__result" id="telecom-planner-result"></div>' +
      "</div>" +
      '<div class="telecom-toolkit-hub__grid">' +
      hubCard("Cut data spend", "Usage sizing, plan comparison, USSD buying codes.", "/telecom/data-usage-calc/", "dataSaver") +
      hubCard("Travel without bill shock", "Roaming, SIM registration, local data, and wallet checks.", "/telecom/roaming-cost/", "traveller") +
      hubCard("Choose reliable internet", "Fibre, LTE, 5G, Starlink, and business backup.", "/telecom/internet-compare/", "homeOffice") +
      hubCard("Reach customers", "Bulk SMS, WhatsApp Business, and payment routes.", "/telecom/whatsapp-vs-sms/", "campaign") +
      hubCard("Manage family entertainment", "TV packages, streaming data, and home broadband.", "/telecom/tv-compare/", "entertainment") +
      hubCard("Switch network safely", "Number portability, SIM status, and OTP continuity.", "/telecom/number-portability/", "switcher") +
      "</div>" +
      renderSources({ sources: ["gsma", "dataPricing", "starlink", "whatsapp", "dstv", "twilio"] }) +
      "</div>";
    anchor.insertAdjacentElement("afterend", section);
    var buildBtn = document.getElementById("telecom-build-plan");
    if (buildBtn) {
      buildBtn.addEventListener("click", function () {
        var plan = buildHubPlan();
        window._telecomHubPlan = plan;
        renderHubPlan(plan);
        setStatus("Workflow ready. Save it or unlock the PDF plan.", "good");
      });
    }
    renderHubPlan(buildHubPlan());
  }

  function hubCard(title, body, href, goal) {
    return '<a class="telecom-toolkit-hub__card" href="' + esc(buildHref(href, { goal: goal, country: getCurrentCountry("NG") })) + '">' +
      "<strong>" + esc(title) + "</strong><span>" + esc(body) + "</span></a>";
  }

  function init() {
    injectStyles();
    var path = routeKey();
    if (path === "/telecom") {
      renderHub();
      return;
    }
    var config = CONFIGS[path];
    if (config) {
      renderPanel(config);
      try {
        if (window.AfroData && typeof window.AfroData.logToolUse === "function") {
          window.AfroData.logToolUse(config.toolId || slugFromPath(path), config.title);
        }
      } catch (error) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
