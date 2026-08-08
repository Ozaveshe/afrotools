(function initUniquelyAfricanEngine(root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroToolsUniquelyAfricanEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createUniquelyAfricanEngine() {
  "use strict";

  var CITY_COSTS = Object.freeze({
    lagos: { name: "Lagos, Nigeria", currency: "NGN", rate: 1550, rent1bed: 350, rent3bed: 800, grocery: 150, transport: 40, internet: 25, electricity: 30, water: 8, phone: 10, gym: 25, domestic: 80, restaurant: 12, cinema: 5 },
    nairobi: { name: "Nairobi, Kenya", currency: "KES", rate: 153, rent1bed: 400, rent3bed: 900, grocery: 160, transport: 35, internet: 20, electricity: 25, water: 6, phone: 8, gym: 30, domestic: 70, restaurant: 15, cinema: 6 },
    joburg: { name: "Johannesburg, Afrique du Sud", currency: "ZAR", rate: 18.5, rent1bed: 550, rent3bed: 1200, grocery: 200, transport: 50, internet: 30, electricity: 50, water: 10, phone: 12, gym: 35, domestic: 100, restaurant: 20, cinema: 8 },
    accra: { name: "Accra, Ghana", currency: "GHS", rate: 15.5, rent1bed: 350, rent3bed: 750, grocery: 140, transport: 30, internet: 25, electricity: 25, water: 5, phone: 8, gym: 25, domestic: 60, restaurant: 12, cinema: 5 },
    cairo: { name: "Le Caire, Égypte", currency: "EGP", rate: 50, rent1bed: 250, rent3bed: 500, grocery: 100, transport: 20, internet: 12, electricity: 15, water: 3, phone: 5, gym: 15, domestic: 50, restaurant: 10, cinema: 4 },
    dar: { name: "Dar es Salaam, Tanzanie", currency: "TZS", rate: 2700, rent1bed: 300, rent3bed: 600, grocery: 120, transport: 25, internet: 20, electricity: 20, water: 5, phone: 6, gym: 20, domestic: 50, restaurant: 10, cinema: 4 },
    kampala: { name: "Kampala, Ouganda", currency: "UGX", rate: 3800, rent1bed: 250, rent3bed: 500, grocery: 100, transport: 20, internet: 18, electricity: 15, water: 4, phone: 5, gym: 20, domestic: 40, restaurant: 8, cinema: 4 },
    kigali: { name: "Kigali, Rwanda", currency: "RWF", rate: 1350, rent1bed: 300, rent3bed: 600, grocery: 120, transport: 20, internet: 20, electricity: 15, water: 5, phone: 6, gym: 25, domestic: 50, restaurant: 10, cinema: 5 },
    cape: { name: "Le Cap, Afrique du Sud", currency: "ZAR", rate: 18.5, rent1bed: 650, rent3bed: 1400, grocery: 210, transport: 50, internet: 30, electricity: 55, water: 10, phone: 12, gym: 35, domestic: 110, restaurant: 22, cinema: 8 },
    addis: { name: "Addis-Abeba, Éthiopie", currency: "ETB", rate: 57, rent1bed: 200, rent3bed: 400, grocery: 80, transport: 15, internet: 15, electricity: 10, water: 3, phone: 4, gym: 15, domestic: 30, restaurant: 6, cinema: 3 },
    casablanca: { name: "Casablanca, Maroc", currency: "MAD", rate: 10, rent1bed: 350, rent3bed: 700, grocery: 150, transport: 25, internet: 15, electricity: 30, water: 5, phone: 8, gym: 25, domestic: 60, restaurant: 12, cinema: 5 },
    abuja: { name: "Abuja, Nigeria", currency: "NGN", rate: 1550, rent1bed: 400, rent3bed: 900, grocery: 160, transport: 35, internet: 25, electricity: 30, water: 8, phone: 10, gym: 25, domestic: 70, restaurant: 12, cinema: 5 }
  });

  var OKADA_DEFAULTS = Object.freeze({
    ng: { currency: "NGN", trips: 15, fare: 300, fuel: 1500, owner: 2000, maintenance: 500, phone: 2000 },
    ke: { currency: "KES", trips: 12, fare: 150, fuel: 400, owner: 500, maintenance: 200, phone: 1000 },
    ug: { currency: "UGX", trips: 12, fare: 3000, fuel: 8000, owner: 10000, maintenance: 5000, phone: 5000 },
    gh: { currency: "GHS", trips: 10, fare: 8, fuel: 40, owner: 30, maintenance: 15, phone: 50 }
  });

  var LAND_TO_SQM = Object.freeze({
    sqm: 1,
    sqft: 0.092903,
    sqyd: 0.836127,
    acre: 4046.8564224,
    hectare: 10000,
    plot: 648,
    halfplot: 324,
    gplot: 650.321,
    keighth: 505.857,
    morgen: 8565.32,
    kacre: 4046.8564224
  });

  var CORRIDOR_ADJUSTMENTS = Object.freeze({
    "us-ng": 0.9, "uk-ng": 0.85, "us-ke": 0.95, "uk-ke": 0.9,
    "us-gh": 1, "us-za": 0.9, "ae-ng": 1.1, "ae-ke": 1.05,
    "ng-ke": 1.3, "ng-gh": 1.25, "za-ng": 1.2, "ke-ug": 1.1,
    "ke-tz": 1.15, "us-et": 1.1, "us-sn": 1.15, "eu-sn": 0.95,
    "eu-ng": 0.95, "ca-ng": 1
  });

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function positive(input, keys) {
    for (var index = 0; index < keys.length; index += 1) {
      var value = number(input[keys[index]]);
      if (!(value > 0)) return { ok: false, field: keys[index], code: "positive_required" };
    }
    return { ok: true };
  }

  function result(values, rows, statuses) {
    return {
      status: "ok",
      values: values || {},
      rows: rows || [],
      statuses: statuses || []
    };
  }

  function invalid(field, code) {
    return { status: "invalid", field: field || null, code: code || "invalid_input", values: {}, rows: [], statuses: [] };
  }

  function feeWatch(input) {
    var check = positive(input, ["amount"]);
    if (!check.ok) return invalid(check.field, check.code);
    var amount = number(input.amount);
    var flatFee = Math.max(0, number(input.flatFee) || 0);
    var feePct = Math.max(0, number(input.feePct) || 0);
    var fxMarginPct = Math.max(0, number(input.fxMarginPct) || 0);
    var fee = flatFee + amount * feePct / 100;
    var fxCost = amount * fxMarginPct / 100;
    var totalCost = fee + fxCost;
    return result({ amount: amount, fee: fee, fxCost: fxCost, totalCost: totalCost, recipientValue: Math.max(0, amount - totalCost), totalPct: totalCost / amount * 100 });
  }

  function ajoTracker(input) {
    var check = positive(input, ["members", "contribution", "rounds"]);
    if (!check.ok) return invalid(check.field, check.code);
    var members = Math.max(1, Math.floor(number(input.members)));
    var rounds = Math.max(1, Math.floor(number(input.rounds)));
    var contribution = number(input.contribution);
    var missed = Math.max(0, Math.floor(number(input.missedPayments) || 0));
    var penalty = Math.max(0, number(input.latePenalty) || 0);
    var pool = members * contribution;
    var rows = [];
    for (var index = 0; index < rounds; index += 1) {
      rows.push({ round: index + 1, pool: pool, recipient: (index % members) + 1 });
    }
    return result({ members: members, rounds: rounds, pool: pool, totalContributions: pool * rounds, arrears: missed * (contribution + penalty) }, rows);
  }

  function electricity(input) {
    var check = positive(input, ["watts", "hoursPerDay", "quantity", "tariff"]);
    if (!check.ok) return invalid(check.field, check.code);
    var days = Math.max(1, number(input.days) || 30);
    var dailyKwh = number(input.watts) * number(input.hoursPerDay) * number(input.quantity) / 1000;
    var monthlyKwh = dailyKwh * days;
    return result({ dailyKwh: dailyKwh, monthlyKwh: monthlyKwh, monthlyCost: monthlyKwh * number(input.tariff), days: days });
  }

  function fuelCost(input) {
    var mode = input.mode === "generator" ? "generator" : "trip";
    if (mode === "generator") {
      var generatorCheck = positive(input, ["kva", "hours", "price"]);
      if (!generatorCheck.ok) return invalid(generatorCheck.field, generatorCheck.code);
      var burnRate = number(input.burnRate);
      if (!(burnRate > 0)) burnRate = number(input.kva) * (input.fuelType === "diesel" ? 0.22 : 0.3);
      var dailyLitres = burnRate * number(input.hours);
      var generatorDays = Math.max(1, number(input.days) || 25);
      return result({ burnRate: burnRate, dailyLitres: dailyLitres, dailyCost: dailyLitres * number(input.price), monthlyLitres: dailyLitres * generatorDays, monthlyCost: dailyLitres * number(input.price) * generatorDays });
    }
    var tripCheck = positive(input, ["distance", "efficiency", "price"]);
    if (!tripCheck.ok) return invalid(tripCheck.field, tripCheck.code);
    var distance = number(input.distance) * (input.distanceUnit === "mi" ? 1.60934 : 1);
    if (input.roundTrip === true || input.roundTrip === "yes") distance *= 2;
    var litresPerKm = input.efficiencyUnit === "l100"
      ? number(input.efficiency) / 100
      : input.efficiencyUnit === "mpg"
        ? 1 / (number(input.efficiency) * 1.60934 / 3.78541)
        : 1 / number(input.efficiency);
    var factors = { highway: 1, mixed: 1.15, traffic: 1.3, rough: 1.25 };
    var factor = factors[input.condition] || 1;
    var baseLitres = distance * litresPerKm;
    var adjustedLitres = baseLitres * factor;
    var reserveLitres = adjustedLitres * Math.max(0, Math.min(50, number(input.reservePct) || 0)) / 100;
    var totalLitres = adjustedLitres + reserveLitres;
    var cost = totalLitres * number(input.price);
    return result({ distanceKm: distance, baseLitres: baseLitres, reserveLitres: reserveLitres, totalLitres: totalLitres, totalCost: cost, perPerson: cost / Math.max(1, number(input.passengers) || 1) });
  }

  function hawala(input) {
    var check = positive(input, ["amount"]);
    if (!check.ok) return invalid(check.field, check.code);
    var channels = [
      { key: "bank", fee: 5, fx: 3 },
      { key: "mobile", fee: 1.5, fx: 1.5 },
      { key: "fintech", fee: 0.5, fx: 0.8 },
      { key: "cash", fee: 3, fx: 2.5 },
      { key: "crypto", fee: 0.5, fx: 1 },
      { key: "hawala", fee: 1, fx: 0.5 }
    ];
    var adjustment = CORRIDOR_ADJUSTMENTS[String(input.from || "").toLowerCase() + "-" + String(input.to || "").toLowerCase()] || 1;
    var amount = number(input.amount);
    var rows = channels.map(function (channel) {
      var feePct = channel.fee * adjustment;
      var fxPct = channel.fx * adjustment;
      var totalCost = amount * (feePct + fxPct) / 100;
      return { channel: channel.key, feePct: feePct, fxPct: fxPct, totalCost: totalCost, recipientValue: amount - totalCost };
    }).sort(function (left, right) { return left.totalCost - right.totalCost; });
    return result({ amount: amount, cheapestCost: rows[0].totalCost, highestCost: rows[rows.length - 1].totalCost, savings: rows[rows.length - 1].totalCost - rows[0].totalCost }, rows);
  }

  function stapleBasket(input) {
    var check = positive(input, ["weeklyCost", "householdSize", "weeks"]);
    if (!check.ok) return invalid(check.field, check.code);
    var base = number(input.weeklyCost) * number(input.weeks);
    var householdFactor = 1 + (Math.max(1, number(input.householdSize)) - 1) * 0.7;
    var inflationFactor = 1 + Math.max(-100, number(input.changePct) || 0) / 100;
    return result({ baseCost: base, householdFactor: householdFactor, adjustedCost: base * householdFactor * inflationFactor, weeklyPerPerson: base * householdFactor * inflationFactor / number(input.weeks) / number(input.householdSize) });
  }

  function wholesaleSpread(input) {
    var check = positive(input, ["wholesale", "retail", "quantity"]);
    if (!check.ok) return invalid(check.field, check.code);
    var wholesale = number(input.wholesale);
    var retail = number(input.retail);
    var quantity = number(input.quantity);
    var cost = wholesale * quantity;
    var revenue = retail * quantity;
    var grossProfit = revenue - cost;
    return result({ unitSpread: retail - wholesale, spreadPct: (retail - wholesale) / wholesale * 100, cost: cost, revenue: revenue, grossProfit: grossProfit, marginPct: revenue ? grossProfit / revenue * 100 : 0 });
  }

  function landSize(input) {
    var unit = LAND_TO_SQM[input.unit] ? input.unit : "sqm";
    var area;
    if (input.mode === "dimensions") {
      var dimensionCheck = positive(input, ["length", "width"]);
      if (!dimensionCheck.ok) return invalid(dimensionCheck.field, dimensionCheck.code);
      var dimensionFactor = input.dimensionUnit === "ft" ? 0.3048 : input.dimensionUnit === "yd" ? 0.9144 : 1;
      area = number(input.length) * dimensionFactor * number(input.width) * dimensionFactor;
    } else {
      var areaCheck = positive(input, ["area"]);
      if (!areaCheck.ok) return invalid(areaCheck.field, areaCheck.code);
      area = number(input.area) * LAND_TO_SQM[unit];
    }
    var rows = Object.keys(LAND_TO_SQM).map(function (key) { return { unit: key, value: area / LAND_TO_SQM[key] }; });
    return result({ sqm: area, sqft: area / LAND_TO_SQM.sqft, hectares: area / LAND_TO_SQM.hectare, acres: area / LAND_TO_SQM.acre, estimatedPrice: Math.max(0, number(input.pricePerSqm) || 0) * area }, rows);
  }

  function informalFx(input) {
    var check = positive(input, ["officialRate", "observedRate", "amount"]);
    if (!check.ok) return invalid(check.field, check.code);
    var official = number(input.officialRate);
    var observed = number(input.observedRate);
    var amount = number(input.amount);
    return result({ officialValue: amount * official, observedValue: amount * observed, spread: observed - official, spreadPct: (observed - official) / official * 100, difference: amount * (observed - official) });
  }

  var NUMBER_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var NUMBER_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function numberWords(value) {
    var n = Math.floor(value);
    if (n === 0) return "Zero";
    if (n < 20) return NUMBER_ONES[n];
    if (n < 100) return NUMBER_TENS[Math.floor(n / 10)] + (n % 10 ? "-" + NUMBER_ONES[n % 10] : "");
    if (n < 1000) return NUMBER_ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + numberWords(n % 100) : "");
    if (n < 1000000) return numberWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberWords(n % 1000) : "");
    if (n < 1000000000) return numberWords(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + numberWords(n % 1000000) : "");
    return numberWords(Math.floor(n / 1000000000)) + " Billion" + (n % 1000000000 ? " " + numberWords(n % 1000000000) : "");
  }
  function amountWords(input, mode) {
    var amount = number(input.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999.99) return invalid("amount", "amount_out_of_range");
    var parts = amount.toFixed(2).split(".");
    var main = Number(parts[0]);
    var sub = Number(parts[1]);
    var words;
    if (mode === "ke") words = main === 0 && sub === 0 ? "Zero Kenya Shillings Only" : (main ? "Kenya Shillings " + numberWords(main) : "") + (sub ? (main ? " and Cents " : "Cents ") + numberWords(sub) : "") + " Only";
    else if (mode === "gh") words = main === 0 && sub === 0 ? "Zero Ghana Cedis Only" : (main ? "Ghana Cedis " + numberWords(main) : "") + (sub ? (main ? " and Pesewas " : "Pesewas ") + numberWords(sub) : "") + " Only";
    else words = main === 0 && sub === 0 ? "Zero Naira Only" : (main ? numberWords(main) + " Naira" : "") + (sub ? (main ? " and " : "") + numberWords(sub) + " Kobo" : "") + " Only";
    return result({ amount: amount, words: words, mainUnit: main, subUnit: sub });
  }
  function susu(input) {
    var members = Math.floor(number(input.members));
    var contribution = number(input.contribution);
    if (!(members >= 2)) return invalid("members", "minimum_two_members");
    if (!(contribution > 0)) return invalid("contribution", "positive_required");
    var feePct = Math.max(0, number(input.collectorFee) || 0);
    var reservePct = Math.max(0, number(input.reservePct) || 0);
    var missed = Math.max(0, Math.floor(number(input.missedPayments) || 0));
    var latePenalty = Math.max(0, number(input.latePenalty) || 0);
    var pot = contribution * members;
    var fee = pot * feePct / 100;
    var reserve = pot * reservePct / 100;
    var net = Math.max(0, pot - fee - reserve);
    var rows = [];
    for (var index = 0; index < members; index += 1) rows.push({ round:index + 1, recipient:index + 1, contribution:contribution, netPot:net });
    return result({ members:members, potSize:pot, feeAmount:fee, reserveAmount:reserve, netPot:net, defaultExposure:missed * contribution, penaltyDue:missed * latePenalty }, rows);
  }
  function whatsapp(input) {
    var code = String(input.countryCode || "").replace(/\D/g, "");
    var clean = String(input.phoneNumber || "").replace(/[\s\-()+]/g, "").replace(/^0+/, "");
    if (!code) return invalid("countryCode", "country_code_required");
    if (!clean) return invalid("phoneNumber", "phone_required");
    var normalized = clean.indexOf(code) === 0 && clean.length > code.length + 5 ? clean : code + clean;
    if (normalized.length < 8 || normalized.length > 15) return invalid("phoneNumber", "phone_length");
    var message = String(input.message || "").trim();
    var link = "https://wa.me/" + normalized + (message ? "?text=" + encodeURIComponent(message) : "");
    return result({ normalizedNumber:normalized, messageLength:message.length, link:link });
  }
  function ajoInterest(input) {
    var members = Math.max(1, Math.floor(number(input.members) || 10));
    var contribution = number(input.contribution);
    if (!(contribution > 0)) return invalid("contribution", "positive_required");
    var position = Math.min(Math.max(1, Math.floor(number(input.position) || 1)), members);
    var feePct = Math.max(0, number(input.fee) || 0);
    var reservePct = Math.max(0, number(input.reservePct) || 0);
    var lateMembers = Math.max(0, Math.floor(number(input.lateMembers) || 0));
    var pool = contribution * members;
    var payout = pool - pool * feePct / 100;
    var exposure = lateMembers * contribution;
    var reserve = pool * reservePct / 100;
    return result({ members:members, position:position, pool:pool, payout:payout, totalContribution:contribution * members, wait:position - 1, reserveTarget:reserve, missedExposure:exposure, coveragePct:exposure ? Math.min(100, reserve / exposure * 100) : 100 });
  }
  function marketDays(input) {
    var raw = String(input.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return invalid("date", "invalid_date");
    var date = new Date(raw + "T00:00:00Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return invalid("date", "invalid_date");
    var reference = new Date("2026-01-01T00:00:00Z");
    var names = ["Eke", "Orie", "Afor", "Nkwo"];
    var offset = Math.round((date.getTime() - reference.getTime()) / 86400000);
    var index = ((1 + offset) % 4 + 4) % 4;
    return result({ date:raw, marketDay:names[index], dayIndex:index, referenceDate:"2026-01-01", referenceDay:"Orie" }, names.map(function (name, rowIndex) { return { dayIndex:rowIndex, marketDay:name }; }), ["confirm_with_local_market"]);
  }
  function ajoChamaCalc(input) {
    var members = Math.floor(number(input.members));
    var contribution = number(input.contribution);
    var cycles = Math.max(1, Math.floor(number(input.numCycles) || 1));
    if (!(members >= 2)) return invalid("members", "minimum_two_members");
    if (!(contribution > 0)) return invalid("contribution", "positive_required");
    var interestRate = Math.max(0, number(input.interestRate) || 0);
    var reserveRate = Math.max(0, number(input.reserveRate) || 0);
    var penaltyRate = Math.max(0, number(input.penaltyRate) || 0);
    var pool = contribution * members;
    var payout = pool + pool * interestRate / 100;
    var rounds = members * cycles;
    var rows = [];
    for (var index = 0; index < rounds; index += 1) rows.push({ round:index + 1, recipient:index % members + 1, contribution:contribution, payout:payout });
    return result({ members:members, poolPerRound:pool, payoutPerRound:payout, penaltyAmount:contribution * penaltyRate / 100, totalRounds:rounds, totalCycleValue:payout * rounds, totalEachPays:contribution * rounds, totalEachReceives:payout * cycles, reserveTotal:pool * reserveRate / 100 * rounds }, rows);
  }

  function monthlyCityCost(city, input) {
    var people = Math.max(1, number(input.householdSize) || 1);
    var lifestyleFactor = input.lifestyle === "expat" ? 1.35 : input.lifestyle === "local" ? 0.85 : 1;
    var rent = city[input.housing === "rent3bed" ? "rent3bed" : "rent1bed"];
    var grocery = city.grocery * (1 + (people - 1) * 0.7) * lifestyleFactor;
    var transport = city.transport * Math.min(people, 2) * lifestyleFactor;
    var utilities = (city.internet + city.electricity + city.water + city.phone * people) * lifestyleFactor;
    var lifestyle = (city.gym + city.domestic + city.restaurant * 2 + city.cinema * 2) * lifestyleFactor;
    return { total: rent + grocery + transport + utilities + lifestyle, rent: rent, grocery: grocery, transport: transport, utilities: utilities, lifestyle: lifestyle };
  }

  function costOfLiving(input) {
    var first = CITY_COSTS[input.city1];
    var second = CITY_COSTS[input.city2];
    if (!first || !second || input.city1 === input.city2) return invalid("city2", "distinct_supported_cities_required");
    var firstCost = monthlyCityCost(first, input);
    var secondCost = monthlyCityCost(second, input);
    var cheaper = firstCost.total <= secondCost.total ? first : second;
    var cheaperCost = Math.min(firstCost.total, secondCost.total);
    var difference = Math.abs(firstCost.total - secondCost.total);
    return result({ city1TotalUsd: firstCost.total, city2TotalUsd: secondCost.total, cheaperCity: cheaper.name, cheaperCostUsd: cheaperCost, monthlyDifferenceUsd: difference, annualDifferenceUsd: difference * 12 }, [
      { city: first.name, currency: first.currency, localTotal: firstCost.total * first.rate, totalUsd: firstCost.total },
      { city: second.name, currency: second.currency, localTotal: secondCost.total * second.rate, totalUsd: secondCost.total }
    ]);
  }

  function atlas(input) {
    var countries = Array.isArray(input.countries) ? input.countries : [];
    var selected = countries.filter(function (country) {
      return [input.countryA, input.countryB].includes(country.code || country.iso2 || country.id);
    });
    if (!input.countryA || !input.countryB || input.countryA === input.countryB || selected.length !== 2) {
      return invalid("countryB", "distinct_supported_countries_required");
    }
    var rows = selected.map(function (country) {
      var gdp = number(country.gdp);
      var population = number(country.population);
      return {
        code: country.code || country.iso2 || country.id,
        name: country.name,
        gdpUsd: Number.isFinite(gdp) ? gdp : null,
        population: Number.isFinite(population) ? population : null,
        gdpPerCapitaUsd: gdp > 0 && population > 0 ? gdp / population : null,
        resources: Array.isArray(country.resources) ? country.resources.map(function (resource) { return resource.type || resource; }) : []
      };
    });
    var firstGdp = number(rows[0].gdpUsd) || 0;
    var secondGdp = number(rows[1].gdpUsd) || 0;
    return result({ comparedCountries: 2, largerEconomy: firstGdp >= secondGdp ? rows[0].name : rows[1].name, gdpDifferenceUsd: Math.abs(firstGdp - secondGdp) }, rows);
  }

  function afroPoints(input) {
    var check = positive(input, ["records", "pointsPerRecord"]);
    if (!check.ok) return invalid(check.field, check.code);
    var records = Math.floor(number(input.records));
    var acceptedRate = Math.max(0, Math.min(100, number(input.acceptedRate) || 0));
    var accepted = Math.floor(records * acceptedRate / 100);
    return result({ records: records, acceptedRecords: accepted, pendingRecords: records - accepted, estimatedPoints: accepted * number(input.pointsPerRecord) }, [], ["points_are_not_cash"]);
  }

  function kitchen(input) {
    var check = positive(input, ["originalServings", "targetServings"]);
    if (!check.ok) return invalid(check.field, check.code);
    var ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
    if (!ingredients.length) return invalid("ingredients", "ingredient_required");
    var factor = number(input.targetServings) / number(input.originalServings);
    var rows = ingredients.map(function (ingredient) {
      var amount = number(ingredient.amount);
      return {
        name: ingredient.name,
        unit: ingredient.unit || "",
        originalAmount: Number.isFinite(amount) ? amount : null,
        scaledAmount: Number.isFinite(amount) ? amount * factor : null
      };
    });
    return result({ scaleFactor: factor, ingredientCount: rows.length, targetServings: number(input.targetServings) }, rows);
  }

  function conflict(input) {
    var records = Array.isArray(input.records) ? input.records : [];
    if (!records.length) return invalid("records", "records_required");
    var status = String(input.status || "all").toLowerCase();
    var filtered = status === "all" ? records.slice() : records.filter(function (record) {
      return String(record.status || record.severity || "").toLowerCase() === status;
    });
    var displaced = filtered.reduce(function (total, record) {
      return total + Math.max(0, number(record.idps_count) || 0) + Math.max(0, number(record.refugees_count) || 0);
    }, 0);
    var weights = { critical: 3, high: 2, medium: 1, low: 0.5 };
    var weighted = filtered.reduce(function (total, record) {
      return total + (weights[String(record.status || record.severity || "").toLowerCase()] || 0);
    }, 0);
    return result({ records: filtered.length, displaced: displaced, weightedSeverity: filtered.length ? weighted / filtered.length : 0, empty: filtered.length === 0 }, filtered.map(function (record) {
      return {
        slug: record.slug,
        name: record.name,
        country: record.primary_country,
        status: record.status || record.severity,
        updatedAt: record.updated_at || record.as_of || null
      };
    }), ["not_live_safety_advice"]);
  }

  function diaspora(input) {
    var days = number(input.daysPresent);
    if (!Number.isFinite(days) || days < 0 || days > 366) return invalid("daysPresent", "days_out_of_range");
    var threshold = Math.max(1, Math.min(366, number(input.residencyThreshold) || 183));
    var remittance = Math.max(0, number(input.annualRemittance) || 0);
    return result({ daysPresent: days, threshold: threshold, daysToThreshold: Math.max(0, threshold - days), thresholdReached: days >= threshold, annualRemittance: remittance }, [], ["planning_only_not_tax_advice"]);
  }

  function nollywood(input) {
    var check = positive(input, ["preProduction", "production", "postProduction", "shootDays"]);
    if (!check.ok) return invalid(check.field, check.code);
    var subtotal = number(input.preProduction) + number(input.production) + number(input.postProduction) + Math.max(0, number(input.distribution) || 0);
    var contingencyPct = Math.max(0, number(input.contingencyPct) || 0);
    var contingency = subtotal * contingencyPct / 100;
    var total = subtotal + contingency;
    var fundedPct = Math.max(0, Math.min(100, number(input.fundedPct) || 0));
    return result({ subtotal: subtotal, contingency: contingency, total: total, costPerShootDay: total / number(input.shootDays), secured: total * fundedPct / 100, fundingGap: total * (1 - fundedPct / 100) });
  }

  function okada(input) {
    var country = OKADA_DEFAULTS[input.country] ? input.country : "ng";
    var defaults = OKADA_DEFAULTS[country];
    var trips = number(input.trips);
    var fare = number(input.fare);
    var daysPerWeek = number(input.daysPerWeek);
    if (!(trips > 0) || !(fare > 0) || !(daysPerWeek > 0)) return invalid(!(trips > 0) ? "trips" : !(fare > 0) ? "fare" : "daysPerWeek", "positive_required");
    var daysPerMonth = Math.max(1, daysPerWeek * 4.33 - Math.max(0, number(input.slowDays) || 0));
    var dailyGross = trips * fare;
    var commissionPct = Math.max(0, number(input.commissionPct) || 0) / 100;
    var monthlyGross = dailyGross * daysPerMonth;
    var fuel = Math.max(0, number(input.fuel) || 0);
    var ownerPay = Math.max(0, number(input.ownerPay) || 0);
    var maintenance = Math.max(0, number(input.maintenance) || 0);
    var insurance = Math.max(0, number(input.insurance) || 0);
    var phone = Math.max(0, number(input.phone) || 0);
    var parking = Math.max(0, number(input.parking) || 0);
    var loan = Math.max(0, number(input.loan) || 0);
    var monthlyFuel = fuel * daysPerMonth;
    var monthlyOwner = ownerPay * daysPerMonth;
    var monthlyMaintenance = maintenance * 4.33;
    var monthlyCommission = dailyGross * commissionPct * daysPerMonth;
    var monthlyParking = parking * daysPerMonth;
    var expenses = monthlyFuel + monthlyOwner + monthlyMaintenance + insurance + phone + monthlyCommission + loan + monthlyParking;
    var profit = monthlyGross - expenses;
    var dailyProfit = profit / daysPerMonth;
    var savePct = Math.max(0, number(input.savePct) || 0) / 100;
    var monthlySavings = Math.max(0, profit * savePct);
    var bikeGoal = Math.max(0, number(input.bikeGoal) || 0);
    var reserveGoal = Math.max(0, number(input.reserveGoal) || 0);
    var dailyFixedCost = fuel + ownerPay + parking + maintenance / Math.max(1, daysPerWeek) +
      insurance / daysPerMonth + phone / daysPerMonth + loan / daysPerMonth;
    var perTripNet = Math.max(1, fare * (1 - commissionPct));
    return result({
      currency: defaults.currency,
      daysPerMonth: daysPerMonth,
      dailyGross: dailyGross,
      monthlyGross: monthlyGross,
      expenses: expenses,
      monthlyProfit: profit,
      weeklyProfit: profit / 4.33,
      dailyProfit: dailyProfit,
      profitMarginPct: monthlyGross ? profit / monthlyGross * 100 : 0,
      breakEvenTrips: Math.ceil(dailyFixedCost / perTripNet),
      monthlySavings: monthlySavings,
      bikeMonths: monthlySavings > 0 && bikeGoal > 0 ? bikeGoal / monthlySavings : 0,
      reserveMonths: monthlySavings > 0 && reserveGoal > 0 ? reserveGoal / monthlySavings : 0
    });
  }

  function prices(input) {
    var records = Array.isArray(input.records) ? input.records : [];
    var quantity = number(input.quantity);
    if (!records.length) return invalid("records", "records_required");
    if (!(quantity > 0)) return invalid("quantity", "positive_required");
    var rows = records.map(function (record) {
      var price = number(record.price || record.min_price || record.amount);
      return {
        country: record.country || record.country_name || record.country_code,
        city: record.city || record.market || "",
        currency: record.currency || record.currency_code || "",
        unit: record.unit || "",
        unitPrice: Number.isFinite(price) ? price : null,
        total: Number.isFinite(price) ? price * quantity : null,
        observedAt: record.observed_at || record.updated_at || null,
        source: record.source || record.source_name || null
      };
    }).filter(function (record) { return record.unitPrice !== null; }).sort(function (left, right) { return left.unitPrice - right.unitPrice; });
    if (!rows.length) return invalid("records", "numeric_prices_required");
    return result({ records: rows.length, quantity: quantity, cheapestCountry: rows[0].country, cheapestTotal: rows[0].total, highestTotal: rows[rows.length - 1].total, savings: rows[rows.length - 1].total - rows[0].total }, rows);
  }

  function ankara(input) {
    var check = positive(input, ["pricePerYard", "yards", "units", "fxRate"]);
    if (!check.ok) return invalid(check.field, check.code);
    var material = number(input.pricePerYard) * number(input.yards);
    var units = Math.max(1, Math.floor(number(input.units)));
    var shippingPerPiece = Math.max(0, number(input.shippingOrder) || 0) / units;
    var costPerPiece = material / units + Math.max(0, number(input.labourPerPiece) || 0) + Math.max(0, number(input.packagingPerPiece) || 0) + shippingPerPiece;
    var quotePerPiece = costPerPiece * (1 + Math.max(0, number(input.marginPct) || 0) / 100);
    return result({ material: material, materialUsd: material / number(input.fxRate), costPerPiece: costPerPiece, quotePerPiece: quotePerPiece, orderTotal: quotePerPiece * units, grossProfitPerPiece: quotePerPiece - costPerPiece });
  }

  function fabric(input) {
    var check = positive(input, ["pricePerYard", "yards", "fxRate"]);
    if (!check.ok) return invalid(check.field, check.code);
    var wastePct = Math.max(0, number(input.wastePct) || 0);
    var yardsWithWaste = number(input.yards) * (1 + wastePct / 100);
    var fabricCost = number(input.pricePerYard) * yardsWithWaste;
    var notions = Math.max(0, number(input.notions) || 0);
    var materialCost = fabricCost + notions;
    var productionCost = materialCost + Math.max(0, number(input.labour) || 0);
    var quote = productionCost * (1 + Math.max(0, number(input.marginPct) || 0) / 100);
    return result({ yardsWithWaste: yardsWithWaste, fabricCost: fabricCost, notions: notions, materialCost: materialCost, productionCost: productionCost, quote: quote, grossProfit: quote - productionCost, quoteUsd: quote / number(input.fxRate) });
  }

  var calculators = Object.freeze({
    "naira-to-words": function (input) { return amountWords(input, "ng"); },
    "amount-words-ke": function (input) { return amountWords(input, "ke"); },
    "amount-words-gh": function (input) { return amountWords(input, "gh"); },
    "susu-tracker": susu,
    "whatsapp-link": whatsapp,
    "ajo-interest": ajoInterest,
    "market-days": marketDays,
    "ajo-chama-calc": ajoChamaCalc,
    "fintech-fee-watch": feeWatch,
    "ajo-chama": ajoTracker,
    "electricity-estimator": electricity,
    "fuel-cost": fuelCost,
    "hawala-tracker": hawala,
    "staple-basket": stapleBasket,
    "wholesale-retail-spread": wholesaleSpread,
    "land-size": landSize,
    "informal-fx-watch": informalFx,
    "cost-of-living": costOfLiving,
    "afroatlas": atlas,
    "afropoints": afroPoints,
    "afrokitchen": kitchen,
    "africa-conflict": conflict,
    "diaspora-guide": diaspora,
    "nollywood-pitch": nollywood,
    "okada-income": okada,
    "afroprices": prices,
    "ankara-kente-cost": ankara,
    "fabric-cost": fabric
  });

  var routeContracts = Object.freeze({
    "naira-to-words": { inputKeys:["amount"], outputKeys:["words","mainUnit","subUnit"], sourceOwner:"tools/naira-to-words/index.html#amountToWords" },
    "amount-words-ke": { inputKeys:["amount"], outputKeys:["words","mainUnit","subUnit"], sourceOwner:"tools/amount-words-ke/index.html#amountToWords" },
    "amount-words-gh": { inputKeys:["amount"], outputKeys:["words","mainUnit","subUnit"], sourceOwner:"tools/amount-words-gh/index.html#amountToWords" },
    "susu-tracker": { inputKeys:["members","contribution","collectorFee","reservePct","missedPayments","latePenalty"], outputKeys:["potSize","netPot","reserveAmount","feeAmount"], sourceOwner:"tools/susu-tracker/index.html#generate" },
    "whatsapp-link": { inputKeys:["countryCode","phoneNumber","message"], outputKeys:["normalizedNumber","messageLength","link"], sourceOwner:"tools/whatsapp-link/index.html#buildLink" },
    "ajo-interest": { inputKeys:["members","position","contribution","fee","reservePct","lateMembers"], outputKeys:["pool","payout","wait","coveragePct"], sourceOwner:"tools/ajo-interest/index.html#calculate" },
    "market-days": { inputKeys:["date"], outputKeys:["marketDay","dayIndex","referenceDate"], delegateOwner:"assets/js/engines/igbo-market-days.js" },
    "ajo-chama-calc": { inputKeys:["members","contribution","numCycles","interestRate","reserveRate","penaltyRate"], outputKeys:["poolPerRound","payoutPerRound","totalRounds","reserveTotal"], sourceOwner:"tools/ajo-chama/index.html#generateSchedule" },
    "fintech-fee-watch": { inputKeys: ["amount", "flatFee", "feePct", "fxMarginPct"], outputKeys: ["fee", "fxCost", "totalCost", "recipientValue", "totalPct"], sourceOwner: "tools/fintech-fee-watch/index.html" },
    "ajo-chama": { inputKeys: ["members", "contribution", "rounds", "missedPayments", "latePenalty"], outputKeys: ["pool", "totalContributions", "arrears"], sourceOwner: "tools/ajo-tracker/index.html" },
    "electricity-estimator": { inputKeys: ["watts", "hoursPerDay", "quantity", "tariff", "days"], outputKeys: ["dailyKwh", "monthlyKwh", "monthlyCost"], sourceOwner: "tools/electricity-estimator/index.html" },
    "fuel-cost": { inputKeys: ["mode", "distance", "efficiency", "price", "condition", "reservePct"], outputKeys: ["totalLitres", "totalCost", "perPerson"], sourceOwner: "tools/fuel-cost/index.html" },
    "hawala-tracker": { inputKeys: ["from", "to", "amount"], outputKeys: ["cheapestCost", "highestCost", "savings"], sourceOwner: "tools/hawala-tracker/index.html" },
    "staple-basket": { inputKeys: ["weeklyCost", "householdSize", "weeks", "changePct"], outputKeys: ["baseCost", "adjustedCost", "weeklyPerPerson"], sourceOwner: "tools/staple-basket/index.html" },
    "wholesale-retail-spread": { inputKeys: ["wholesale", "retail", "quantity"], outputKeys: ["unitSpread", "spreadPct", "grossProfit", "marginPct"], sourceOwner: "tools/wholesale-retail-spread/index.html" },
    "land-size": { inputKeys: ["mode", "area", "unit", "length", "width", "dimensionUnit", "pricePerSqm"], outputKeys: ["sqm", "sqft", "hectares", "acres", "estimatedPrice"], sourceOwner: "tools/land-size/index.html" },
    "informal-fx-watch": { inputKeys: ["officialRate", "observedRate", "amount"], outputKeys: ["officialValue", "observedValue", "spread", "spreadPct", "difference"], sourceOwner: "tools/informal-fx-watch/index.html" },
    "cost-of-living": { inputKeys: ["city1", "city2", "householdSize", "housing", "lifestyle"], outputKeys: ["city1TotalUsd", "city2TotalUsd", "cheaperCity", "annualDifferenceUsd"], sourceOwner: "tools/cost-of-living/index.html" },
    "afroatlas": { inputKeys: ["countries", "countryA", "countryB"], outputKeys: ["largerEconomy", "gdpDifferenceUsd"], delegateOwner: "engines/src/afroatlas-engine.js" },
    "afropoints": { inputKeys: ["records", "pointsPerRecord", "acceptedRate"], outputKeys: ["acceptedRecords", "pendingRecords", "estimatedPoints"], delegateOwner: "engines/src/afropoints-engine.js" },
    "afrokitchen": { inputKeys: ["ingredients", "originalServings", "targetServings"], outputKeys: ["scaleFactor", "ingredientCount", "targetServings"], delegateOwner: "engines/src/afrokitchen-engine.js" },
    "africa-conflict": { inputKeys: ["records", "status"], outputKeys: ["records", "displaced", "weightedSeverity", "empty"], delegateOwner: "engines/src/africa-conflict-engine.js" },
    "diaspora-guide": { inputKeys: ["daysPresent", "residencyThreshold", "annualRemittance"], outputKeys: ["daysToThreshold", "thresholdReached", "annualRemittance"], sourceOwner: "tools/diaspora-guide/index.html" },
    "nollywood-pitch": { inputKeys: ["preProduction", "production", "postProduction", "distribution", "contingencyPct", "shootDays", "fundedPct"], outputKeys: ["total", "costPerShootDay", "secured", "fundingGap"], sourceOwner: "tools/nollywood-pitch/index.html" },
    "okada-income": { inputKeys: ["country", "trips", "fare", "daysPerWeek", "fuel", "ownerPay", "maintenance", "insurance", "phone", "commissionPct", "loan", "slowDays", "parking", "savePct", "bikeGoal", "reserveGoal"], outputKeys: ["monthlyGross", "expenses", "monthlyProfit", "weeklyProfit", "dailyProfit", "profitMarginPct", "breakEvenTrips", "monthlySavings", "bikeMonths", "reserveMonths"], sourceOwner: "tools/okada-income/index.html" },
    "afroprices": { inputKeys: ["records", "quantity"], outputKeys: ["cheapestCountry", "cheapestTotal", "highestTotal", "savings"], delegateOwner: "engines/src/afroprices-engine.js" },
    "ankara-kente-cost": { inputKeys: ["pricePerYard", "yards", "units", "fxRate", "labourPerPiece", "packagingPerPiece", "shippingOrder", "marginPct"], outputKeys: ["material", "costPerPiece", "quotePerPiece", "orderTotal", "grossProfitPerPiece"], sourceOwner: "tools/ankara-kente-cost/index.html" },
    "fabric-cost": { inputKeys: ["pricePerYard", "yards", "fxRate", "wastePct", "notions", "labour", "marginPct"], outputKeys: ["yardsWithWaste", "materialCost", "productionCost", "quote", "grossProfit", "quoteUsd"], sourceOwner: "tools/fabric-cost/index.html" }
  });

  function calculate(toolId, input) {
    var calculator = calculators[toolId];
    if (!calculator) return invalid(null, "unknown_tool");
    return calculator(input || {});
  }

  return Object.freeze({
    version: "1.0.0",
    calculate: calculate,
    calculators: calculators,
    routeContracts: routeContracts,
    data: Object.freeze({
      cityCosts: CITY_COSTS,
      okadaDefaults: OKADA_DEFAULTS,
      landToSqm: LAND_TO_SQM,
      corridorAdjustments: CORRIDOR_ADJUSTMENTS
    })
  });
});
