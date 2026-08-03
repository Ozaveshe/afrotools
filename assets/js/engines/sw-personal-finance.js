(function initSwPersonalFinanceEngine(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AfroToolsSwPersonalFinanceEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createEngine() {
  'use strict';

  var REVIEW_DATE = '2026-07-18';
  var CURRENCIES = Object.freeze({
    NG: { code: 'NGN', symbol: '₦', country: 'Nigeria' },
    KE: { code: 'KES', symbol: 'KSh', country: 'Kenya' },
    ZA: { code: 'ZAR', symbol: 'R', country: 'Afrika Kusini' },
    GH: { code: 'GHS', symbol: 'GH₵', country: 'Ghana' },
    EG: { code: 'EGP', symbol: 'E£', country: 'Misri' },
    ET: { code: 'ETB', symbol: 'Br', country: 'Ethiopia' },
    TZ: { code: 'TZS', symbol: 'TSh', country: 'Tanzania' },
    UG: { code: 'UGX', symbol: 'USh', country: 'Uganda' },
    RW: { code: 'RWF', symbol: 'RF', country: 'Rwanda' },
    CI: { code: 'XOF', symbol: 'FCFA', country: "Côte d'Ivoire" },
    SN: { code: 'XOF', symbol: 'FCFA', country: 'Senegal' },
    CM: { code: 'XAF', symbol: 'FCFA', country: 'Cameroon' },
    MA: { code: 'MAD', symbol: 'DH', country: 'Morocco' },
    TN: { code: 'TND', symbol: 'DT', country: 'Tunisia' },
    AO: { code: 'AOA', symbol: 'Kz', country: 'Angola' },
    ZM: { code: 'ZMW', symbol: 'ZK', country: 'Zambia' },
    ZW: { code: 'USD', symbol: '$', country: 'Zimbabwe' }
  });

  var HUSTLES = Object.freeze([
    { id: 'freelance_writing', sortName: 'Freelance Writing / Content', name: 'Uandishi wa kujitegemea na maudhui', skills: ['writing'], capitalMin: 0, hoursMin: 5, check: 'Tengeneza mifano miwili, eleza kazi ndogo ya kulipwa, kisha uliza wanunuzi halisi wangetaka kununua nini.' },
    { id: 'graphics_design', sortName: 'Graphic Design / Branding', name: 'Ubunifu wa michoro na chapa', skills: ['design'], capitalMin: 50, hoursMin: 10, check: 'Tengeneza jalada dogo la kazi, weka mipaka ya marekebisho na faili, kisha jaribu maelezo moja ya kazi ya kulipwa.' },
    { id: 'tutoring', sortName: 'Private Tutoring / Online Teaching', name: 'Mafunzo binafsi au mtandaoni', skills: ['teaching'], capitalMin: 0, hoursMin: 5, check: 'Thibitisha mtaala, ulinzi wa watoto, mahali au kanuni za jukwaa, na masharti ya vipindi.' },
    { id: 'ride_hailing', sortName: 'Ride-Hailing Driver (Uber/Bolt/InDriver)', name: 'Dereva wa usafiri wa programu', skills: ['driving'], capitalMin: 200, hoursMin: 20, check: 'Thibitisha leseni, bima, gari, usalama, kodi na kanuni za Uber, Bolt au InDriver; hesabu mafuta, matengenezo na kilomita tupu.' },
    { id: 'food_sales', sortName: 'Home Food Business / Catering', name: 'Biashara ya chakula cha nyumbani au upishi', skills: ['cooking'], capitalMin: 50, hoursMin: 10, check: 'Panga gharama za viungo, vifungashio, upotevu na ufikishaji, kisha thibitisha kanuni za afya na vibali.' },
    { id: 'social_media_mgmt', sortName: 'Social Media Management', name: 'Usimamizi wa mitandao ya kijamii', skills: ['social', 'writing'], capitalMin: 0, hoursMin: 10, check: 'Tengeneza kalenda ya mfano, fafanua idhini na ufikiaji wa akaunti, kisha uza jaribio fupi la kulipwa.' },
    { id: 'mini_importation', sortName: 'Mini-Importation / eCommerce', name: 'Uagizaji mdogo wa bidhaa na biashara mtandaoni', skills: ['sales'], capitalMin: 200, hoursMin: 10, check: 'Jaribu mahitaji kwa mzigo mdogo unaokubalika na hesabu bidhaa, usafirishaji, ushuru, kodi, hasara, marejesho na hatua ya mwisho ya ufikishaji.' },
    { id: 'photography', sortName: 'Photography / Videography', name: 'Upigaji picha na video', skills: ['photography'], capitalMin: 200, hoursMin: 10, check: 'Jenga jalada la kazi lenye ridhaa na bei ya vifaa, usafiri, uhariri, uhifadhi, muda wa kukabidhi na haki za matumizi.' },
    { id: 'real_estate_agent', sortName: 'Real Estate Agent / Property Finder', name: 'Wakala wa mali au mtafutaji wa nyumba', skills: ['sales'], capitalMin: 0, hoursMin: 10, check: 'Thibitisha leseni, uwakala, matangazo, amana na tume kabla ya kushughulikia mali au fedha.' },
    { id: 'beauty_hair', sortName: 'Hair / Beauty / Nails', name: 'Nywele, urembo na kucha', skills: ['beauty'], capitalMin: 50, hoursMin: 10, check: 'Thibitisha mafunzo, usafi, bidhaa, mzio, taka na vibali, kisha panga bei za huduma chache kwanza.' },
    { id: 'freelance_dev', sortName: 'Web/App Development', name: 'Kutengeneza tovuti au programu', skills: ['tech'], capitalMin: 0, hoursMin: 10, check: 'Jenga mifano miwili, fafanua vigezo vya kukubali na matengenezo, kisha toa jaribio la kulipwa lenye wigo maalumu.' },
    { id: 'tailoring', sortName: 'Tailoring / Fashion Design', name: 'Ushonaji na ubunifu wa mavazi', skills: ['tailoring'], capitalMin: 200, hoursMin: 20, check: 'Jaribu oda ndogo, andika vipimo na tarehe, kisha hesabu kitambaa, vifaa, kazi, marekebisho na kushona upya.' },
    { id: 'financial_consulting', sortName: 'Financial Advisory / Tax Filing', name: 'Ushauri wa fedha au uwasilishaji wa kodi', skills: ['finance'], capitalMin: 0, hoursMin: 5, check: 'Toa tu kazi inayoruhusiwa na sifa na kanuni zako; andika wigo, faragha, rekodi na mipaka ya dhima.' },
    { id: 'agric_produce', sortName: 'Agriculture / Produce Trading', name: 'Kilimo au biashara ya mazao', skills: ['farming'], capitalMin: 200, hoursMin: 20, check: 'Anza na mzunguko mdogo na panga misimu, upotevu, usafiri, uhifadhi, masharti ya mnunuzi na mtaji wa kuendesha biashara.' },
    { id: 'repairs_maintenance', sortName: 'Phone/Electronics Repairs', name: 'Matengenezo ya simu au vifaa vya kielektroniki', skills: ['repair'], capitalMin: 50, hoursMin: 20, check: 'Pata mafunzo ya vitendo, linda taarifa za mteja, fuata usalama wa umeme na betri, na fafanua vipuri na dhamana.' }
  ]);

  function finiteNonNegative(value) {
    return Number.isFinite(Number(value)) && Number(value) >= 0;
  }
  function fail(field, error) { return { ok: false, field: field, error: error }; }

  function budget503020(input) {
    var fields = ['income', 'currentNeeds', 'currentWants', 'currentSavings'];
    for (var i = 0; i < fields.length; i += 1) if (!finiteNonNegative(input[fields[i]])) return fail(fields[i], 'Weka sifuri au kiasi chanya katika kila sehemu.');
    var income = Number(input.income);
    if (income <= 0) return fail('income', 'Weka mapato halisi ya mwezi yaliyo zaidi ya sifuri.');
    var currentNeeds = Number(input.currentNeeds);
    var currentWants = Number(input.currentWants);
    var currentSavings = Number(input.currentSavings);
    var idealNeeds = income * 0.5;
    var idealWants = income * 0.3;
    var idealSavings = income * 0.2;
    var currentTotal = currentNeeds + currentWants + currentSavings;
    return { ok: true, income: income, idealNeeds: idealNeeds, idealWants: idealWants, idealSavings: idealSavings,
      currentNeeds: currentNeeds, currentWants: currentWants, currentSavings: currentSavings, currentTotal: currentTotal,
      needsGap: currentNeeds - idealNeeds, wantsGap: currentWants - idealWants, savingsGap: currentSavings - idealSavings,
      unallocated: income - currentTotal };
  }

  function albumBudget(input) {
    var money = ['studioRate', 'beatCost', 'mixCost', 'masterCost', 'coverArt', 'photoShoot', 'musicVideo', 'distroCost', 'playlistBudget', 'adsBudget', 'prBudget', 'netPerStream'];
    for (var i = 0; i < money.length; i += 1) if (!finiteNonNegative(input[money[i]])) return fail(money[i], 'Weka sifuri au kiasi chanya katika kila sehemu ya fedha.');
    var tracks = Number(input.tracks);
    var hours = Number(input.hoursPerTrack);
    if (!Number.isInteger(tracks) || tracks < 1 || tracks > 20) return fail('tracks', 'Weka idadi kamili ya nyimbo kati ya 1 na 20.');
    if (!Number.isFinite(hours) || hours <= 0) return fail('hoursPerTrack', 'Weka saa za kurekodi kwa wimbo zilizo zaidi ya sifuri.');
    var recordingCost = Number(input.studioRate) * hours * tracks;
    var mixingCost = Number(input.mixCost) * tracks;
    var production = recordingCost + Number(input.beatCost) + mixingCost + Number(input.masterCost);
    var visuals = Number(input.coverArt) + Number(input.photoShoot) + Number(input.musicVideo);
    var marketing = Number(input.distroCost) + Number(input.playlistBudget) + Number(input.adsBudget) + Number(input.prBudget);
    var total = production + visuals + marketing;
    var netPerStream = Number(input.netPerStream);
    return { ok: true, tracks: tracks, recordingCost: recordingCost, mixingCost: mixingCost, production: production,
      visuals: visuals, marketing: marketing, total: total, costPerTrack: total / tracks, contingency10: total * 0.1,
      contingency20: total * 0.2, breakEvenStreams: netPerStream > 0 ? Math.ceil(total / netPerStream) : null };
  }

  function filmBudget(input) {
    var fields = ['totalBudget', 'shootDays', 'cashSecured', 'contingencyPct', 'aboveLinePct', 'productionPct', 'postPct', 'marketingPct'];
    for (var i = 0; i < fields.length; i += 1) if (!finiteNonNegative(input[fields[i]])) return fail(fields[i], 'Weka sifuri au namba chanya katika kila sehemu.');
    var total = Number(input.totalBudget), shootDays = Number(input.shootDays), contingencyPct = Number(input.contingencyPct);
    var allocations = [Number(input.aboveLinePct), Number(input.productionPct), Number(input.postPct), Number(input.marketingPct)];
    if (total <= 0) return fail('totalBudget', 'Weka bajeti ya jumla iliyo zaidi ya sifuri.');
    if (!Number.isInteger(shootDays) || shootDays < 1) return fail('shootDays', 'Weka idadi kamili ya siku za kurekodi iliyo zaidi ya sifuri.');
    if (contingencyPct > 100 || allocations.some(function (v) { return v > 100; })) return fail('contingencyPct', 'Kila asilimia iwe kati ya 0 na 100.');
    var allocationTotal = allocations.reduce(function (sum, value) { return sum + value; }, 0);
    if (Math.abs(allocationTotal - 100) > 0.001) return fail('aboveLinePct', 'Mgao wa idara nne lazima uwe 100%. Sasa ni ' + allocationTotal.toFixed(1) + '%.');
    var contingency = total * contingencyPct / 100;
    var required = total + contingency;
    var cash = Number(input.cashSecured);
    return { ok: true, total: total, shootDays: shootDays, perDay: total / shootDays, aboveLine: total * allocations[0] / 100,
      production: total * allocations[1] / 100, post: total * allocations[2] / 100, marketing: total * allocations[3] / 100,
      allocations: allocations, allocationTotal: allocationTotal, contingency: contingency, required: required, cashSecured: cash,
      gap: Math.max(0, required - cash), surplus: Math.max(0, cash - required) };
  }

  function emergencyFund(input) {
    var fields = ['monthlyExpenses', 'targetMonths', 'oneOffCosts', 'currentSavings', 'monthlyContribution'];
    for (var i = 0; i < fields.length; i += 1) if (!finiteNonNegative(input[fields[i]])) return fail(fields[i], 'Weka sifuri au kiasi chanya katika kila sehemu ya fedha.');
    var expenses = Number(input.monthlyExpenses), months = Number(input.targetMonths);
    if (expenses <= 0) return fail('monthlyExpenses', 'Weka matumizi muhimu ya mwezi yaliyo zaidi ya sifuri.');
    if (!Number.isInteger(months) || months < 1 || months > 24) return fail('targetMonths', 'Chagua idadi kamili ya miezi kati ya 1 na 24.');
    var oneOff = Number(input.oneOffCosts), saved = Number(input.currentSavings), contribution = Number(input.monthlyContribution);
    var target = expenses * months + oneOff;
    var gap = Math.max(0, target - saved);
    return { ok: true, target: target, tier1: expenses + oneOff, tier2: target, tier3: expenses * 6 + oneOff,
      gap: gap, monthsToGoal: gap === 0 ? 0 : (contribution > 0 ? Math.ceil(gap / contribution) : null) };
  }

  function capitalBandFor(hustle) { return hustle.capitalMin === 0 ? 0 : (hustle.capitalMin <= 50 ? 1 : (hustle.capitalMin <= 200 ? 2 : 3)); }
  function scoreHustle(hustle, skills, hours, capital) {
    var skillMatch = hustle.skills.some(function (skill) { return skills.indexOf(skill) >= 0; });
    var skillPoints = skills.length === 0 ? 20 : (skillMatch ? 60 : 0);
    var requiredCapital = capitalBandFor(hustle);
    var capitalPoints = capital >= requiredCapital ? 20 : Math.max(0, 20 - (requiredCapital - capital) * 10);
    var hoursPoints = hours >= hustle.hoursMin ? 20 : Math.round(hours / hustle.hoursMin * 20);
    return { score: skillPoints + capitalPoints + hoursPoints, skill: skillPoints / 6, capital: capitalPoints / 2,
      time: hoursPoints / 2, skillMatch: skillMatch, requiredCapital: requiredCapital };
  }
  function rankSideHustles(input) {
    var hours = Number(input.hours), capital = Number(input.capital), skills = Array.isArray(input.skills) ? input.skills.slice() : [];
    if (!Number.isFinite(hours) || hours <= 0) return fail('hours', 'Chagua muda wa wiki ulio zaidi ya sifuri.');
    if (!Number.isInteger(capital) || capital < 0 || capital > 3) return fail('capital', 'Chagua kiwango halali cha mtaji.');
    var ranked = HUSTLES.map(function (h) { return { hustle: h, fit: scoreHustle(h, skills, hours, capital) }; })
      .sort(function (a, b) { return b.fit.score - a.fit.score || a.hustle.sortName.localeCompare(b.hustle.sortName); });
    return { ok: true, skills: skills, hours: hours, capital: capital, top5: ranked.slice(0, 5) };
  }

  var FORMULAS = Object.freeze({
    '50-30-20-budget': budget503020,
    'album-budget': albumBudget,
    'film-budget': filmBudget,
    'security-emergency-fund': emergencyFund,
    'side-hustle-ranker': rankSideHustles
  });
  function calculate(app, input) { return FORMULAS[app] ? FORMULAS[app](input || {}) : fail('app', 'Programu hii haitambuliki.'); }
  return { REVIEW_DATE: REVIEW_DATE, CURRENCIES: CURRENCIES, HUSTLES: HUSTLES, FORMULAS: FORMULAS,
    calculate: calculate, budget503020: budget503020, albumBudget: albumBudget, filmBudget: filmBudget,
    emergencyFund: emergencyFund, rankSideHustles: rankSideHustles, scoreHustle: scoreHustle };
});
