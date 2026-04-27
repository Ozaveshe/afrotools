(function (root) {
  'use strict';

  var COUNTRIES = {
    NG: { name: 'Nigeria', currency: 'NGN', fx: 1550, djBase: 250000, photoDay: 180000, gymFee: 28000, ticketBase: 3500, importUplift: 0.58 },
    KE: { name: 'Kenya', currency: 'KES', fx: 130, djBase: 38000, photoDay: 32000, gymFee: 4500, ticketBase: 650, importUplift: 0.42 },
    ZA: { name: 'South Africa', currency: 'ZAR', fx: 18.5, djBase: 9000, photoDay: 7500, gymFee: 720, ticketBase: 180, importUplift: 0.28 },
    GH: { name: 'Ghana', currency: 'GHS', fx: 13.2, djBase: 4200, photoDay: 3600, gymFee: 420, ticketBase: 90, importUplift: 0.5 },
    EG: { name: 'Egypt', currency: 'EGP', fx: 48, djBase: 15000, photoDay: 12000, gymFee: 850, ticketBase: 140, importUplift: 0.38 },
    ET: { name: 'Ethiopia', currency: 'ETB', fx: 125, djBase: 26000, photoDay: 22000, gymFee: 2200, ticketBase: 280, importUplift: 0.55 },
    TZ: { name: 'Tanzania', currency: 'TZS', fx: 2600, djBase: 650000, photoDay: 520000, gymFee: 70000, ticketBase: 8000, importUplift: 0.48 },
    UG: { name: 'Uganda', currency: 'UGX', fx: 3800, djBase: 900000, photoDay: 700000, gymFee: 120000, ticketBase: 12000, importUplift: 0.5 },
    RW: { name: 'Rwanda', currency: 'RWF', fx: 1320, djBase: 420000, photoDay: 350000, gymFee: 45000, ticketBase: 5500, importUplift: 0.46 },
    CI: { name: "Cote d'Ivoire", currency: 'XOF', fx: 610, djBase: 190000, photoDay: 160000, gymFee: 30000, ticketBase: 4500, importUplift: 0.52 },
    CM: { name: 'Cameroon', currency: 'XAF', fx: 610, djBase: 180000, photoDay: 150000, gymFee: 26000, ticketBase: 3500, importUplift: 0.52 },
    SN: { name: 'Senegal', currency: 'XOF', fx: 610, djBase: 190000, photoDay: 160000, gymFee: 30000, ticketBase: 4500, importUplift: 0.5 },
    MA: { name: 'Morocco', currency: 'MAD', fx: 10, djBase: 6500, photoDay: 5200, gymFee: 360, ticketBase: 80, importUplift: 0.32 },
    TN: { name: 'Tunisia', currency: 'TND', fx: 3.1, djBase: 1700, photoDay: 1500, gymFee: 110, ticketBase: 24, importUplift: 0.35 },
    AO: { name: 'Angola', currency: 'AOA', fx: 920, djBase: 360000, photoDay: 300000, gymFee: 42000, ticketBase: 5200, importUplift: 0.62 }
  };

  var CURRENCIES = ['NGN', 'KES', 'GHS', 'ZAR', 'XOF', 'XAF', 'EGP', 'ETB', 'TZS', 'UGX', 'RWF', 'MAD', 'TND', 'AOA', 'USD'];

  var SOURCES = {
    cafOverview: {
      title: 'CAF AFCON Morocco 2025 overview',
      url: 'https://www.cafonline.com/afcon2025/news/everything-you-need-to-know-about-totalenergies-caf-africa-cup-of-nations-morocco-2025/',
      note: 'Tournament dates, format, and official competition framing.'
    },
    cafAppeal: {
      title: 'CAF Appeal Board media statement',
      url: 'https://www.cafonline.com/news/caf-appeal-board-media-statement/',
      note: 'Official March 2026 post-final ruling context.'
    },
    fplScoring: {
      title: 'Premier League FPL scoring rules',
      url: 'https://www.premierleague.com/en/news/2174909/fpl-basics-scoring',
      note: '2025/26 points, clean sheets, saves, cards, and defensive contributions.'
    },
    kraExcise: {
      title: 'KRA Finance Act 2025 excise notice',
      url: 'https://www.kra.go.ke/news-center/public-notices/2237-adjustment-of-excise-duty-rates-for-excisable-goods-and-services-by-the-finance-act%2C-2025',
      note: 'Kenya betting and gaming excise moved to 5 percent on wallet deposits.'
    },
    kraWht: {
      title: 'KRA withholding tax table',
      url: 'https://kra.go.ke/individual/filing-paying/types-of-taxes/individual-withholding-tax',
      note: 'Kenya winnings withholding tax reference.'
    },
    ghMoF: {
      title: 'Ghana Ministry of Finance 2025 reforms',
      url: 'https://www.mofep.gov.gh/node/1935',
      note: 'Abolition of 10 percent withholding tax on bet winnings and gaming.'
    },
    spotifyRoyalties: {
      title: 'Spotify for Artists royalties guide',
      url: 'https://artists.spotify.com/en/royalties-guide',
      note: 'Major streaming services use streamshare models rather than fixed per-stream rates.'
    },
    filmOneYearbook: {
      title: 'FilmOne Nigeria Box Office Yearbook 2025',
      url: 'https://yearbook.filmoneng.com/',
      note: 'Nigeria and West Africa cinema market benchmark reference.'
    },
    ncaaIntl: {
      title: 'NCAA international academic requirements',
      url: 'https://www.ncaa.org/sports/2018/5/15/international-academic-requirements.aspx',
      note: 'International student-athlete document and academic requirements.'
    },
    ncaaD1: {
      title: 'NCAA Division I initial eligibility toolkit',
      url: 'https://www.ncaa.org/sports/2013/11/25/division-i-initial-eligibility-toolkit.aspx',
      note: 'Division I core courses and minimum core-course GPA.'
    },
    naia: {
      title: 'NAIA Eligibility Center',
      url: 'https://naia.prestosports.com/why-naia/eligibility-center',
      note: 'NAIA and international record evaluation pathway.'
    }
  };

  var AFCON_TEAMS = [
    ['Morocco', 1885], ['Senegal', 1875], ['Nigeria', 1815], ['Cote d\'Ivoire', 1800],
    ['Egypt', 1780], ['Algeria', 1765], ['Tunisia', 1705], ['South Africa', 1690],
    ['Cameroon', 1680], ['Ghana', 1655], ['Mali', 1645], ['Burkina Faso', 1605],
    ['DR Congo', 1595], ['Guinea', 1570], ['Angola', 1520], ['Uganda', 1505],
    ['Tanzania', 1480], ['Gambia', 1470], ['Zimbabwe', 1460], ['Mauritania', 1440],
    ['Namibia', 1435], ['Guinea-Bissau', 1410], ['Sierra Leone', 1400], ['Equatorial Guinea', 1385]
  ];

  function countryOptions() {
    return Object.keys(COUNTRIES).map(function (code) {
      return { value: code, label: COUNTRIES[code].name + ' (' + COUNTRIES[code].currency + ')' };
    });
  }

  function currencyOptions() {
    return CURRENCIES.map(function (code) { return { value: code, label: code }; });
  }

  function number(value, fallback) {
    var n = parseFloat(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function integer(value, fallback) {
    var n = parseInt(value, 10);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function fmt(value, digits) {
    var places = digits == null ? 0 : digits;
    return Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
  }

  function pct(value, digits) {
    return fmt(value, digits == null ? 1 : digits) + '%';
  }

  function money(amount, currency) {
    var digits = Math.abs(amount) >= 1000 ? 0 : 2;
    return (currency || 'USD') + ' ' + fmt(amount, digits);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function parseOdds(format, rawValue) {
    var value = String(rawValue || '').trim();
    if (format === 'decimal' || format === 'african') {
      var dec = number(value);
      return dec > 1 ? dec : null;
    }
    if (format === 'fractional') {
      var parts = value.split('/');
      if (parts.length !== 2) return null;
      var top = number(parts[0]);
      var bottom = number(parts[1]);
      return bottom > 0 ? top / bottom + 1 : null;
    }
    if (format === 'american') {
      var us = number(value);
      if (us > 0) return us / 100 + 1;
      if (us < 0) return 100 / Math.abs(us) + 1;
    }
    return null;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function toFractional(decimal) {
    var profit = Math.max(0, decimal - 1);
    var bestNum = 1;
    var bestDen = 1;
    var bestDiff = Infinity;
    for (var den = 1; den <= 64; den += 1) {
      var num = Math.round(profit * den);
      var diff = Math.abs(profit - num / den);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestNum = num;
        bestDen = den;
      }
    }
    var g = gcd(bestNum, bestDen);
    return (bestNum / g) + '/' + (bestDen / g);
  }

  function toAmerican(decimal) {
    if (decimal >= 2) return '+' + Math.round((decimal - 1) * 100);
    return '-' + Math.round(100 / Math.max(0.01, decimal - 1));
  }

  function getCountry(values) {
    return COUNTRIES[values.country] || COUNTRIES.NG;
  }

  function sourceList(keys) {
    return (keys || []).map(function (key) { return SOURCES[key]; }).filter(Boolean);
  }

  function statusLabel(score) {
    if (score >= 70) return 'Strong';
    if (score >= 45) return 'Workable';
    return 'Needs work';
  }

  function calcBettingOdds(v) {
    var currency = v.currency || 'NGN';
    var stake = Math.max(0, number(v.stake));
    var decimal = parseOdds(v.oddsFormat, v.oddsValue) || 0;
    if (!decimal) {
      return { heroLabel: 'Waiting for valid odds', heroValue: 'Enter odds', heroSub: 'Use decimal, fractional, American, or local multiplier odds.', metrics: [], rows: [], insights: ['Decimal odds must be higher than 1.00. Fractional odds should look like 6/4. American odds should include a positive or negative number.'] };
    }
    var implied = 100 / decimal;
    var probability = clamp(number(v.estimatedProbability, implied), 1, 99);
    var profit = stake * (decimal - 1);
    var total = stake * decimal;
    var ev = (probability / 100) * profit - (1 - probability / 100) * stake;
    var edge = probability - implied;
    var fairOdds = 100 / probability;
    var verdict = edge >= 5 ? 'Positive value' : edge >= 0 ? 'Thin value' : 'Negative value';
    var opponentDecimal = parseOdds(v.opponentOddsFormat || v.oddsFormat, v.opponentOddsValue) || 0;
    var noVigRows = [];
    if (opponentDecimal > 1) {
      var p1 = 100 / decimal;
      var p2 = 100 / opponentDecimal;
      var overround = p1 + p2;
      var noVigP1 = overround > 0 ? p1 / overround * 100 : implied;
      var noVigOdds = 100 / Math.max(1, noVigP1);
      noVigRows = [
        ['Two-way market overround', pct(overround - 100, 1)],
        ['No-vig probability for your side', pct(noVigP1, 1)],
        ['No-vig fair odds for your side', fmt(noVigOdds, 2)]
      ];
    }
    var parlayLegs = clamp(integer(v.parlayLegs, 1), 1, 12);
    var avgLegOdds = Math.max(1.01, number(v.averageLegOdds, decimal));
    var parlayDecimal = Math.pow(avgLegOdds, parlayLegs);
    var parlayImplied = 100 / parlayDecimal;
    return {
      heroLabel: verdict,
      heroValue: money(profit, currency),
      heroSub: 'Potential profit on a ' + money(stake, currency) + ' stake. Total return if it wins: ' + money(total, currency) + '.',
      metrics: [
        { label: 'Implied chance', value: pct(implied, 1), unit: 'break-even probability' },
        { label: 'Your edge', value: pct(edge, 1), unit: 'estimate minus market' },
        { label: 'Expected value', value: money(ev, currency), unit: 'per bet at your estimate' }
      ],
      rows: [
        ['Decimal odds', fmt(decimal, 2)],
        ['Fractional odds', toFractional(decimal)],
        ['American odds', toAmerican(decimal)],
        ['Fair odds from your estimate', fmt(fairOdds, 2)],
        ['Parlay stress test', parlayLegs + ' legs at avg ' + fmt(avgLegOdds, 2) + ' odds = ' + pct(parlayImplied, 2) + ' implied chance'],
        ['Potential profit', money(profit, currency)],
        ['Total return', money(total, currency)]
      ].concat(noVigRows),
      bars: [
        { label: 'Market implied', value: implied, text: pct(implied, 1) },
        { label: 'Your estimate', value: probability, text: pct(probability, 1) }
      ],
      insights: [
        edge >= 0 ? 'Your probability estimate is above the market break-even point. The bet can make sense if that estimate is honest.' : 'Your estimate is below the market break-even point. The price is too short unless your read changes.',
        'Use the expected value line to compare several bets with the same stake instead of chasing the largest possible payout.',
        opponentDecimal > 1 ? 'The no-vig line removes a simple two-way bookmaker margin, which is the missing feature in many basic odds converters.' : 'Add the opposite side of the market to remove vig and compare your price against a fair no-margin line.',
        'For accumulators, use the parlay stress test. Small pricing errors compound quickly.'
      ]
    };
  }

  function calcAfcon(v) {
    var favorite = v.favorite || 'Morocco';
    var formBoost = number(v.formBoost, 0);
    var defenseBoost = number(v.defenseBoost, 0);
    var hostBoost = number(v.hostBoost, 0);
    var upsetTolerance = clamp(number(v.upsetTolerance, 4), 0, 10);
    var mode = v.mode || '2027-planner';
    var volatilityDivisor = 330 + upsetTolerance * 28;
    var scores = AFCON_TEAMS.map(function (item) {
      var rating = item[1];
      if (item[0] === favorite) rating += formBoost * 8 + defenseBoost * 5 + hostBoost * 10;
      if (mode === '2025-review' && item[0] === 'Morocco') rating += 35;
      if (mode === '2025-review' && item[0] === 'Senegal') rating += 25;
      return { name: item[0], rating: rating, weight: Math.exp((rating - 1450) / volatilityDivisor) };
    });
    var total = scores.reduce(function (sum, t) { return sum + t.weight; }, 0);
    scores.forEach(function (t) { t.prob = t.weight / total * 100; });
    scores.sort(function (a, b) { return b.prob - a.prob; });
    var fav = scores.filter(function (t) { return t.name === favorite; })[0] || scores[0];
    return {
      heroLabel: favorite + ' title model',
      heroValue: pct(fav.prob, 1),
      heroSub: mode === '2025-review' ? 'Review mode includes Morocco 2025 official post-final context and higher weight for finalists.' : 'Planning mode estimates the title path from rating strength plus your form, defensive, and host assumptions.',
      metrics: [
        { label: 'Top contender', value: scores[0].name, unit: pct(scores[0].prob, 1) + ' model share' },
        { label: 'Favorite rank', value: String(scores.indexOf(fav) + 1), unit: 'among 24 teams' },
        { label: 'Field pressure', value: pct(100 - fav.prob, 1), unit: 'chance someone else wins' }
      ],
      rows: scores.slice(0, 8).map(function (t, idx) {
        return [String(idx + 1) + '. ' + t.name, pct(t.prob, 1) + ' title probability'];
      }).concat([
        ['Most likely final path', scores[0].name + ' vs ' + scores[1].name],
        ['Upset setting', fmt(upsetTolerance, 0) + '/10, higher means less confidence in favorites']
      ]),
      bars: scores.slice(0, 6).map(function (t) {
        return { label: t.name, value: t.prob, text: pct(t.prob, 1) };
      }),
      insights: [
        mode === '2025-review' ? 'The 2025 final has unusual official history: Senegal won on the field, then the CAF Appeal Board recorded a Morocco forfeit win. Keep both sporting and official contexts visible.' : 'Use the form and defense sliders as scouting assumptions, not live rankings.',
        'Competitor tournament tools usually stop at a bracket. This version gives a reusable content angle: favorite rank, field pressure, and likely final path.',
        'A low single-team probability is normal in a 24-team knockout tournament. The field is usually stronger than any one favorite.',
        'For content planning, the top-six list is more useful than a single champion pick.'
      ],
      sources: sourceList(['cafOverview', 'cafAppeal'])
    };
  }

  function calcFantasy(v) {
    var pos = v.position || 'mid';
    var mins = integer(v.minutes);
    var goals = integer(v.goals);
    var assists = integer(v.assists);
    var clean = v.cleanSheet === 'yes';
    var conceded = integer(v.goalsConceded);
    var saves = integer(v.saves);
    var defensiveActions = integer(v.defensiveActions);
    var yellow = integer(v.yellowCards);
    var red = integer(v.redCards);
    var ownGoals = integer(v.ownGoals);
    var penSave = integer(v.penaltySaves);
    var penMiss = integer(v.penaltyMisses);
    var bonus = integer(v.bonus);
    var captain = v.captain || 'none';
    var playerPrice = Math.max(0.1, number(v.playerPrice, 8));
    var startProb = clamp(number(v.startProbability, 90), 0, 100);
    var fixtureDifficulty = clamp(number(v.fixtureDifficulty, 3), 1, 5);
    var goalPts = { gk: 10, def: 6, mid: 5, fwd: 4 };
    var csPts = { gk: 4, def: 4, mid: 1, fwd: 0 };
    var rows = [];
    var total = 0;
    function add(label, points) {
      total += points;
      rows.push([label, (points > 0 ? '+' : '') + points + ' pts']);
    }
    if (mins >= 60) add('Appearance, 60+ minutes', 2);
    else if (mins > 0) add('Appearance, under 60 minutes', 1);
    else add('Did not play', 0);
    if (goals) add('Goals scored', goals * goalPts[pos]);
    if (assists) add('Assists', assists * 3);
    if (clean && mins >= 60 && csPts[pos]) add('Clean sheet', csPts[pos]);
    if ((pos === 'gk' || pos === 'def') && conceded >= 2) add('Goals conceded', -Math.floor(conceded / 2));
    if (pos === 'gk' && saves >= 3) add('Saves', Math.floor(saves / 3));
    if (defensiveActions >= (pos === 'def' ? 10 : 12) && pos !== 'gk') add('Defensive contributions', 2);
    if (penSave) add('Penalty saves', penSave * 5);
    if (yellow) add('Yellow cards', yellow * -1);
    if (red) add('Red cards', red * -3);
    if (ownGoals) add('Own goals', ownGoals * -2);
    if (penMiss) add('Penalty misses', penMiss * -2);
    if (bonus) add('Bonus points', clamp(bonus, 0, 3));
    var raw = total;
    if (captain === 'captain') total *= 2;
    if (captain === 'triple') total *= 3;
    var adjusted = total * (startProb / 100) * (1.12 - (fixtureDifficulty - 3) * 0.08);
    var ppm = total / playerPrice;
    rows.push(['Fixture-adjusted expectation', fmt(adjusted, 1) + ' pts using ' + pct(startProb, 0) + ' start probability']);
    rows.push(['Player value', fmt(ppm, 2) + ' points per million']);
    return {
      heroLabel: captain === 'none' ? 'Gameweek points' : 'Captaincy-adjusted points',
      heroValue: fmt(total, 0) + ' pts',
      heroSub: captain === 'none' ? 'Base points before bench or chip rules.' : 'Base score was ' + raw + ' before the selected multiplier.',
      metrics: [
        { label: 'Base score', value: raw + ' pts', unit: 'before multiplier' },
        { label: 'Value', value: fmt(ppm, 2), unit: 'points per million' },
        { label: 'Minutes', value: String(mins), unit: mins >= 60 ? 'clean-sheet eligible' : 'limited minutes' }
      ],
      rows: rows,
      insights: [
        defensiveActions >= 8 ? 'The defensive contribution input is now important in 2025/26 FPL, especially for defenders and ball-winning midfielders.' : 'If the player made many clearances, blocks, interceptions, or tackles, add defensive contributions before finalizing.',
        total >= 12 ? 'This is a strong captaincy-level return.' : total >= 6 ? 'This is a useful return, but captaincy depends on fixture difficulty and minutes security.' : 'This return is thin. Check minutes, role, and upcoming fixtures before keeping captaincy on this player.',
        'Competitor FPL tools often show raw points only. The value and start-probability lines make it more useful for transfer decisions.',
        'Official FPL can revise assists and bonus points after review, so treat this as a planning calculator.'
      ],
      sources: sourceList(['fplScoring'])
    };
  }

  var TAX_MARKETS = {
    NG_LAGOS: { label: 'Nigeria - Lagos licensed online gaming', currency: 'NGN', depositDuty: 0, wht: 5, note: '5 percent withholding on net winnings for Lagos-licensed platforms.' },
    KE: { label: 'Kenya', currency: 'KES', depositDuty: 5, wht: 20, note: '5 percent betting wallet deposit excise plus KRA winnings WHT reference.' },
    GH: { label: 'Ghana', currency: 'GHS', depositDuty: 0, wht: 0, note: 'Direct withholding tax on bet winnings was abolished in 2025 reforms.' },
    TZ: { label: 'Tanzania', currency: 'TZS', depositDuty: 0, wht: 12, note: 'Uses a 2025 sports betting winnings benchmark. Verify before filing.' },
    ZA: { label: 'South Africa', currency: 'ZAR', depositDuty: 0, wht: 0, note: 'No automatic withholding modeled here. Professional gambling can be treated differently.' },
    CUSTOM: { label: 'Custom market', currency: 'USD', depositDuty: 0, wht: 0, note: 'Use the custom tax fields for countries that need manual review.' }
  };

  function calcBettingTax(v) {
    var market = TAX_MARKETS[v.market] || TAX_MARKETS.CUSTOM;
    var currency = v.market === 'CUSTOM' ? (v.currency || 'USD') : market.currency;
    var stake = Math.max(0, number(v.stake));
    var grossPayout = Math.max(0, number(v.grossPayout));
    var winnings = Math.max(0, grossPayout - stake);
    var depositRate = v.market === 'CUSTOM' ? number(v.depositTaxPct) : market.depositDuty;
    var whtRate = v.market === 'CUSTOM' ? number(v.whtPct) : market.wht;
    var depositTax = stake * depositRate / 100;
    var withholding = winnings * whtRate / 100;
    var netPayout = Math.max(0, grossPayout - withholding);
    var netProfit = netPayout - stake - depositTax;
    var effective = grossPayout > 0 ? (withholding + depositTax) / grossPayout * 100 : 0;
    var actualReceived = Math.max(0, number(v.actualReceived));
    var payoutGap = actualReceived ? actualReceived - netPayout : 0;
    return {
      heroLabel: 'Net betting profit after modeled tax',
      heroValue: money(netProfit, currency),
      heroSub: market.label + ': ' + market.note,
      metrics: [
        { label: 'Withheld on winnings', value: money(withholding, currency), unit: pct(whtRate, 1) + ' WHT' },
        { label: 'Deposit or stake duty', value: money(depositTax, currency), unit: pct(depositRate, 1) + ' modeled' },
        { label: 'Effective drag', value: pct(effective, 1), unit: 'of gross payout' }
      ],
      rows: [
        ['Stake or wallet deposit', money(stake, currency)],
        ['Gross payout if won', money(grossPayout, currency)],
        ['Net winnings before tax', money(winnings, currency)],
        ['WHT on winnings', money(withholding, currency)],
        ['Deposit or stake duty', money(depositTax, currency)],
        ['Net payout', money(netPayout, currency)],
        ['Slip audit gap', actualReceived ? money(payoutGap, currency) + ' vs modeled payout' : 'Enter actual received to audit a slip']
      ],
      insights: [
        'Betting tax changes quickly. This tool separates deposit duty from winnings withholding so the operator model is visible.',
        'If your sportsbook deducts tax at payout, compare the actual slip against the WHT line before assuming an error.',
        actualReceived ? (Math.abs(payoutGap) <= Math.max(1, grossPayout * .01) ? 'Your actual receipt is close to the modeled payout.' : 'Your actual receipt differs materially. Check bonus rules, void legs, operator fees, or the tax basis.') : 'Competitor calculators usually stop at net payout. This audit line helps compare the bookmaker slip itself.',
        v.market === 'GH' ? 'Ghana is deliberately modeled at 0 percent direct withholding after the 2025 reform. Annual income reporting may still matter.' : 'For countries not listed, use Custom market and enter the rate from the regulator or operator terms.'
      ],
      sources: sourceList(['kraExcise', 'kraWht', 'ghMoF'])
    };
  }

  function calcStreaming(v) {
    var rates = {
      spotify: 0.0035,
      apple: 0.0065,
      boomplay: 0.00025,
      audiomack: 0.001,
      youtube: 0.0015,
      deezer: 0.004,
      tidal: 0.01
    };
    var rows = [];
    var gross = 0;
    Object.keys(rates).forEach(function (key) {
      var streams = Math.max(0, integer(v[key + 'Streams']));
      var amount = streams * rates[key];
      gross += amount;
      rows.push([key.charAt(0).toUpperCase() + key.slice(1), fmt(streams, 0) + ' streams, est. ' + money(amount, 'USD')]);
    });
    var distributor = gross * number(v.distributorFee, 15) / 100;
    var afterDistributor = gross - distributor;
    var artistMaster = afterDistributor * number(v.artistMasterShare, 80) / 100;
    var publishing = gross * 0.15 * number(v.songwriterShare, 50) / 100;
    var recoupableAdvance = Math.max(0, number(v.recoupableAdvance));
    var collaboratorShare = clamp(number(v.collaboratorShare, 0), 0, 100);
    var marketingSpend = Math.max(0, number(v.marketingSpend));
    var collaboratorDeduction = (artistMaster + publishing) * collaboratorShare / 100;
    var recoupApplied = Math.min(recoupableAdvance, Math.max(0, artistMaster + publishing - collaboratorDeduction));
    var net = artistMaster + publishing - collaboratorDeduction - recoupApplied - marketingSpend;
    var target = Math.max(1, number(v.targetIncome, 1000));
    var blended = gross > 0 ? gross / Math.max(1, Object.keys(rates).reduce(function (sum, key) { return sum + Math.max(0, integer(v[key + 'Streams'])); }, 0)) : 0.003;
    var payoutRate = Math.max(0.000001, (artistMaster + publishing - collaboratorDeduction) / Math.max(1, gross));
    var neededStreams = target / Math.max(0.000001, blended * payoutRate);
    return {
      heroLabel: 'Estimated artist net',
      heroValue: money(net, 'USD'),
      heroSub: 'After distributor fee, master split, and a simple publishing estimate. Streaming platforms do not pay one universal fixed rate.',
      metrics: [
        { label: 'Gross estimate', value: money(gross, 'USD'), unit: 'before splits' },
        { label: 'Distributor fee', value: money(distributor, 'USD'), unit: pct(number(v.distributorFee, 15), 1) },
        { label: 'Recoup left', value: money(Math.max(0, recoupableAdvance - recoupApplied), 'USD'), unit: 'after this period' },
        { label: 'Streams for target', value: fmt(neededStreams, 0), unit: 'for ' + money(target, 'USD') + ' net' }
      ],
      rows: rows.concat([
        ['Artist master share', money(artistMaster, 'USD')],
        ['Songwriter/publishing estimate', money(publishing, 'USD')],
        ['Collaborator split', money(collaboratorDeduction, 'USD')],
        ['Advance recouped this period', money(recoupApplied, 'USD')],
        ['Marketing spend charged', money(marketingSpend, 'USD')],
        ['Estimated net', money(net, 'USD')]
      ]),
      insights: [
        'Boomplay and Audiomack can matter strategically even when per-stream estimates are lower, because they may better match African discovery behavior.',
        'Treat the target-streams line as a campaign planning number. Your actual distributor statement is the source of truth.',
        'If a label owns the master, lower the artist master share and compare how much publishing still contributes.',
        'Competitor royalty tools rarely show recoupment. Add advance and campaign spend to see when cash actually reaches the artist.'
      ],
      sources: sourceList(['spotifyRoyalties'])
    };
  }

  function calcNollywood(v) {
    var currency = 'NGN';
    var production = Math.max(0, number(v.productionBudget));
    var marketing = Math.max(0, number(v.marketingBudget));
    var admissions = Math.max(0, integer(v.admissions));
    var ticket = Math.max(0, number(v.avgTicket));
    var cinemaShare = clamp(number(v.cinemaShare, 50), 0, 90);
    var distributorFee = clamp(number(v.distributorFee, 12), 0, 50);
    var streaming = Math.max(0, number(v.streamingDeal));
    var brand = Math.max(0, number(v.brandTieIns));
    var distributionExpenses = Math.max(0, number(v.distributionExpenses));
    var investorRecoupPct = clamp(number(v.investorRecoupPct, 0), 0, 100);
    var gross = admissions * ticket;
    var producerCinema = gross * (1 - cinemaShare / 100) * (1 - distributorFee / 100);
    var totalRevenue = producerCinema + streaming + brand;
    var totalCost = production + marketing + distributionExpenses;
    var preRecoupProfit = totalRevenue - totalCost;
    var investorRecoup = Math.max(0, preRecoupProfit) * investorRecoupPct / 100;
    var profit = preRecoupProfit - investorRecoup;
    var roi = totalCost > 0 ? profit / totalCost * 100 : 0;
    var contributionPerAdmission = ticket * (1 - cinemaShare / 100) * (1 - distributorFee / 100);
    var breakEvenAdmissions = Math.max(0, (totalCost - streaming - brand) / Math.max(1, contributionPerAdmission));
    return {
      heroLabel: 'Producer-side profit estimate',
      heroValue: money(profit, currency),
      heroSub: 'Cinema gross, exhibitor split, distributor fee, streaming, brand tie-ins, production, and marketing combined.',
      metrics: [
        { label: 'Box office gross', value: money(gross, currency), unit: fmt(admissions, 0) + ' admissions' },
        { label: 'Producer revenue', value: money(totalRevenue, currency), unit: 'after cinema/distributor split' },
        { label: 'Investor recoup', value: money(investorRecoup, currency), unit: pct(investorRecoupPct, 0) + ' of profit' },
        { label: 'ROI', value: pct(roi, 1), unit: 'profit over cost' }
      ],
      rows: [
        ['Production budget', money(production, currency)],
        ['Marketing budget', money(marketing, currency)],
        ['Distribution expenses', money(distributionExpenses, currency)],
        ['Producer cinema share', money(producerCinema, currency)],
        ['Streaming and brand revenue', money(streaming + brand, currency)],
        ['Investor recoup waterfall', money(investorRecoup, currency)],
        ['Break-even admissions', fmt(breakEvenAdmissions, 0)],
        ['2025 market benchmark', 'FilmOne yearbook references a high-growth West African box office market. Use current distributor data for release decisions.']
      ],
      insights: [
        profit >= 0 ? 'This scenario can recoup if the admissions estimate is realistic.' : 'This scenario needs more admissions, a stronger streaming floor, lower marketing, or sponsor support.',
        'Average ticket price matters more than many producers expect. Premium holiday windows can improve gross while reducing audience breadth.',
        'Model streaming as negotiated upside, not guaranteed recovery, unless the agreement is signed.',
        'Competitor box-office tools usually stop at gross. Producer cash flow needs distributor expenses and investor recoup before calling a film profitable.'
      ],
      sources: sourceList(['filmOneYearbook'])
    };
  }

  function calcDj(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var eventMult = { wedding: 1.25, club: .9, festival: 1.7, corporate: 1.45, private: 1.0 }[v.eventType] || 1;
    var expMult = { emerging: .65, working: 1, known: 1.55, headline: 2.4 }[v.experience] || 1;
    var hours = Math.max(1, number(v.hours, 4));
    var base = country.djBase * eventMult * expMult;
    var extraHours = Math.max(0, hours - 4) * country.djBase * 0.16;
    var equipment = { none: 0, controller: base * .12, sound: base * .32, full: base * .48 }[v.equipment] || 0;
    var travel = Math.max(0, number(v.travelCost));
    var crowdLift = Math.max(0, (number(v.crowdSize, 150) - 250) / 250) * country.djBase * .12;
    var peak = v.peakDay === 'yes' ? base * .18 : 0;
    var setupHours = Math.max(0, number(v.setupHours, 1));
    var setupFee = setupHours * country.djBase * .08;
    var mcService = v.mcService === 'yes' ? base * .2 : 0;
    var quote = base + extraHours + equipment + travel + crowdLift + peak + setupFee + mcService;
    return {
      heroLabel: 'Recommended DJ quote',
      heroValue: money(quote, currency),
      heroSub: 'Includes event type, experience level, set length, equipment, crowd size, travel, and peak-day pressure.',
      metrics: [
        { label: 'Deposit', value: money(quote * .5, currency), unit: 'recommended booking hold' },
        { label: 'Extra hours', value: money(extraHours, currency), unit: Math.max(0, hours - 4) + ' hours over base' },
        { label: 'MC or host add-on', value: money(mcService, currency), unit: v.mcService === 'yes' ? 'included' : 'not selected' },
        { label: 'Equipment line', value: money(equipment, currency), unit: 'gear and setup' }
      ],
      rows: [
        ['Base performance fee', money(base, currency)],
        ['Peak-day premium', money(peak, currency)],
        ['Setup and soundcheck time', money(setupFee, currency)],
        ['MC/host service', money(mcService, currency)],
        ['Travel and logistics', money(travel, currency)],
        ['Crowd-size lift', money(crowdLift, currency)],
        ['Suggested quote range', money(quote * .9, currency) + ' to ' + money(quote * 1.18, currency)]
      ],
      insights: [
        'Separate performance, equipment, and travel in the quote so clients can see what changes the price.',
        'Use a 50 percent deposit for weddings, festivals, and December events where replacement bookings are difficult.',
        'For clubs, quote a lower guarantee only if there is a written door split or repeat-night upside.',
        'Competitor quote tables often hide setup and MC duties. Keep them as separate lines so scope creep does not eat the fee.'
      ]
    };
  }

  function calcConcert(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var capacity = Math.max(1, integer(v.capacity, 1000));
    var attendance = clamp(number(v.attendance, 70), 1, 100) / 100;
    var vipShare = clamp(number(v.vipShare, 12), 0, 80) / 100;
    var avgTicket = number(v.regularTicket) * (1 - vipShare) + number(v.vipTicket) * vipShare;
    var ticketRevenue = capacity * attendance * avgTicket;
    var sponsor = Math.max(0, number(v.sponsorRevenue));
    var vendorRevenue = Math.max(0, number(v.vendorRevenue));
    var grossRevenue = ticketRevenue + sponsor + vendorRevenue;
    var fixedCosts = number(v.artistFees) + number(v.venueCost) + number(v.productionCost) + number(v.securityCost) + number(v.marketingCost) + number(v.permitCost) + number(v.insuranceCost);
    var variableFees = ticketRevenue * number(v.ticketingFee, 8) / 100;
    var contingency = fixedCosts * number(v.contingency, 10) / 100;
    var totalCosts = fixedCosts + variableFees + contingency;
    var net = grossRevenue - totalCosts;
    var breakEvenTicket = (totalCosts - sponsor - vendorRevenue) / Math.max(1, capacity * attendance);
    var profitAt50 = capacity * .5 * avgTicket + sponsor + vendorRevenue - totalCosts;
    var profitAt75 = capacity * .75 * avgTicket + sponsor + vendorRevenue - totalCosts;
    return {
      heroLabel: 'Event net profit',
      heroValue: money(net, currency),
      heroSub: 'Break-even average ticket price is ' + money(breakEvenTicket, currency) + ' at ' + pct(attendance * 100, 0) + ' attendance.',
      metrics: [
        { label: 'Ticket revenue', value: money(ticketRevenue, currency), unit: fmt(capacity * attendance, 0) + ' paid attendees' },
        { label: 'Total costs', value: money(totalCosts, currency), unit: 'including fees and contingency' },
        { label: 'Sponsor/vendor cover', value: money(sponsor + vendorRevenue, currency), unit: pct((sponsor + vendorRevenue) / Math.max(1, totalCosts) * 100, 1) + ' of costs' }
      ],
      rows: [
        ['Average ticket yield', money(avgTicket, currency)],
        ['Artist fees', money(number(v.artistFees), currency)],
        ['Venue and production', money(number(v.venueCost) + number(v.productionCost), currency)],
        ['Security and marketing', money(number(v.securityCost) + number(v.marketingCost), currency)],
        ['Permits and insurance', money(number(v.permitCost) + number(v.insuranceCost), currency)],
        ['Vendor booth revenue', money(vendorRevenue, currency)],
        ['Ticketing and gateway fees', money(variableFees, currency)],
        ['Contingency', money(contingency, currency)],
        ['50% attendance stress test', money(profitAt50, currency)],
        ['75% attendance stress test', money(profitAt75, currency)]
      ],
      insights: [
        net >= 0 ? 'This budget clears break-even. Protect the margin by locking production and security quotes early.' : 'This budget is short. Raise sponsorship, reduce artist guarantee, or increase VIP yield before announcing.',
        'Model a realistic attendance percentage. Sold-out assumptions hide risk on new festivals.',
        'Keep contingency visible. Outdoor events and imported production can move costs late.',
        'Competitor event budgets often show one forecast. Keep 50 percent and 75 percent attendance stress tests visible before you commit deposits.'
      ]
    };
  }

  function calcGym(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var members = Math.max(0, integer(v.members));
    var fee = Math.max(0, number(v.monthlyFee, country.gymFee));
    var membershipRevenue = members * fee;
    var ptRevenue = Math.max(0, number(v.ptRevenue));
    var retailRevenue = Math.max(0, number(v.retailRevenue));
    var revenue = membershipRevenue + ptRevenue + retailRevenue;
    var costs = number(v.rent) + number(v.staffCost) + number(v.utilities) + number(v.equipmentFinance) + number(v.otherCosts) + number(v.ownerSalary);
    var profit = revenue - costs;
    var startup = Math.max(0, number(v.startupCost));
    var breakEvenMembers = Math.max(0, (costs - ptRevenue - retailRevenue) / Math.max(1, fee));
    var payback = profit > 0 ? startup / profit : Infinity;
    var churn = Math.max(.1, number(v.monthlyChurn, 6)) / 100;
    var grossMargin = revenue > 0 ? clamp((revenue - costs) / revenue, .05, .85) : .3;
    var ltv = fee * grossMargin / churn;
    var cac = Math.max(1, number(v.cac));
    return {
      heroLabel: 'Monthly operating profit',
      heroValue: money(profit, currency),
      heroSub: profit > 0 ? 'Startup payback is about ' + fmt(payback, 1) + ' months at this run-rate.' : 'This gym is below break-even. Increase members, fee, or reduce fixed costs.',
      metrics: [
        { label: 'Break-even members', value: fmt(breakEvenMembers, 0), unit: 'active paying members' },
        { label: 'LTV/CAC', value: fmt(ltv / cac, 1) + 'x', unit: 'retention economics' },
        { label: 'Non-dues revenue', value: money(ptRevenue + retailRevenue, currency), unit: pct((ptRevenue + retailRevenue) / Math.max(1, revenue) * 100, 1) + ' of revenue' },
        { label: 'Monthly churn', value: pct(churn * 100, 1), unit: 'member loss assumption' }
      ],
      rows: [
        ['Membership revenue', money(membershipRevenue, currency)],
        ['PT and retail revenue', money(ptRevenue + retailRevenue, currency)],
        ['Monthly fixed costs', money(costs, currency)],
        ['Owner/operator salary', money(number(v.ownerSalary), currency)],
        ['Startup investment', money(startup, currency)],
        ['Payback period', Number.isFinite(payback) ? fmt(payback, 1) + ' months' : 'No payback until profitable'],
        ['Estimated member LTV', money(ltv, currency)]
      ],
      insights: [
        ltv / cac >= 3 ? 'Acquisition economics look healthy. Keep measuring retention before scaling ads.' : 'LTV/CAC is thin. Improve retention or lower acquisition spend before expansion.',
        'The break-even member count is the number to track weekly before adding a second location.',
        'Equipment finance is useful only if monthly member growth comfortably covers it.',
        'Competitor gym calculators often count revenue only by members. Add personal training and retail to see whether the business has a second profit engine.'
      ]
    };
  }

  function calcEventTickets(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var vipGross = integer(v.vipTickets) * number(v.vipPrice);
    var regularGross = integer(v.regularTickets) * number(v.regularPrice);
    var studentGross = integer(v.studentTickets) * number(v.studentPrice);
    var earlyBirdGross = integer(v.earlyBirdTickets) * number(v.earlyBirdPrice);
    var ticketGross = vipGross + regularGross + studentGross + earlyBirdGross;
    var sponsorRevenue = Math.max(0, number(v.sponsorRevenue));
    var affiliateFee = Math.max(0, number(v.affiliateFee));
    var gross = ticketGross + sponsorRevenue;
    var fees = ticketGross * (number(v.platformFee, 7) + number(v.gatewayFee, 2)) / 100;
    var refunds = ticketGross * number(v.refundRate, 3) / 100;
    var net = gross - fees - refunds - affiliateFee - number(v.marketingCost) - number(v.fixedCosts);
    var paidTickets = integer(v.vipTickets) + integer(v.regularTickets) + integer(v.studentTickets) + integer(v.earlyBirdTickets);
    var comps = integer(v.compTickets);
    var capacity = Math.max(1, paidTickets + comps);
    return {
      heroLabel: 'Net ticket revenue',
      heroValue: money(net, currency),
      heroSub: 'After platform fees, gateway fees, refunds, marketing, and fixed event costs.',
      metrics: [
        { label: 'Gross sales', value: money(gross, currency), unit: fmt(paidTickets, 0) + ' paid tickets plus sponsors' },
        { label: 'Fees and refunds', value: money(fees + refunds, currency), unit: 'deducted before event costs' },
        { label: 'Average paid ticket', value: money(ticketGross / Math.max(1, paidTickets), currency), unit: 'blended yield' }
      ],
      rows: [
        ['VIP gross', money(vipGross, currency)],
        ['Regular gross', money(regularGross, currency)],
        ['Student gross', money(studentGross, currency)],
        ['Early-bird gross', money(earlyBirdGross, currency)],
        ['Sponsor revenue', money(sponsorRevenue, currency)],
        ['Affiliate or influencer payout', money(affiliateFee, currency)],
        ['Comp tickets', fmt(comps, 0) + ' seats, ' + pct(comps / capacity * 100, 1) + ' of capacity'],
        ['Marketing and fixed costs', money(number(v.marketingCost) + number(v.fixedCosts), currency)]
      ],
      insights: [
        net >= 0 ? 'The ticket mix clears the modeled cost stack.' : 'This ticket mix does not cover the event. Add sponsor revenue or reprice VIP inventory.',
        'Comp tickets are not free. Track them as capacity you cannot sell.',
        'If online fees feel high, compare net revenue, not just headline ticket price.',
        'Competitor ticket calculators rarely include affiliate payouts. Add them when promoters, campus reps, or influencers sell inventory.'
      ]
    };
  }

  function calcMatchTickets(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var leagueMult = { local: 1, continental: 1.8, national: 2.4, derby: 3.2 }[v.matchTier] || 1;
    var seatMult = { terrace: .65, regular: 1, vip: 2.6, box: 6 }[v.seatType] || 1;
    var demandMult = { normal: 1, title: 1.35, rivalry: 1.55, final: 2.1 }[v.demand] || 1;
    var channelFee = v.channel === 'online' ? .08 : v.channel === 'reseller' ? .18 : 0;
    var price = country.ticketBase * leagueMult * seatMult * demandMult;
    var qty = Math.max(1, integer(v.quantity, 2));
    var ticketSubtotal = price * qty * (1 + channelFee);
    var transportCost = Math.max(0, number(v.transportCost));
    var foodCost = Math.max(0, number(v.foodCost));
    var parkingCost = Math.max(0, number(v.parkingCost));
    var total = ticketSubtotal + transportCost + foodCost + parkingCost;
    var season = Math.max(0, number(v.seasonPassPrice));
    var matches = Math.max(1, integer(v.homeMatches, 15));
    var seasonPerMatch = season / matches;
    return {
      heroLabel: 'Estimated match-day ticket cost',
      heroValue: money(total, currency),
      heroSub: money(price, currency) + ' per ticket before channel fees for ' + country.name + '.',
      metrics: [
        { label: 'Single ticket', value: money(price, currency), unit: v.seatType + ' seat' },
        { label: 'Channel fee', value: pct(channelFee * 100, 0), unit: v.channel },
        { label: 'Match-day extras', value: money(transportCost + foodCost + parkingCost, currency), unit: 'transport, food, parking' },
        { label: 'Season per match', value: season ? money(seasonPerMatch, currency) : 'Add pass', unit: 'season comparison' }
      ],
      rows: [
        ['Ticket quantity', fmt(qty, 0)],
        ['Ticket subtotal with channel fee', money(ticketSubtotal, currency)],
        ['Transport', money(transportCost, currency)],
        ['Food and drinks', money(foodCost, currency)],
        ['Parking or local access', money(parkingCost, currency)],
        ['Base country benchmark', money(country.ticketBase, currency)],
        ['Match tier and demand lift', fmt(leagueMult * demandMult, 2) + 'x'],
        ['Seat multiplier', fmt(seatMult, 2) + 'x'],
        ['Season pass value', season ? (seasonPerMatch <= price ? 'Season pass looks better if you attend often.' : 'Single tickets may be cheaper unless perks matter.') : 'Enter a pass price to compare.']
      ],
      insights: [
        'Use this as a comparator before buying through a reseller or at the gate.',
        'Derbies, finals, and continental matches can move far above league averages.',
        'Families should calculate transport and food separately; tickets are often only part of the match-day cost.',
        'Competitor ticket pages usually compare face value. This tool compares the actual outing cost.'
      ]
    };
  }

  function calcScholarship(v) {
    var gpa = number(v.gpa, 2.5);
    var core = integer(v.coreCourses);
    var age = integer(v.age, 18);
    var english = integer(v.englishScore);
    var score = 0;
    var gaps = [];
    var levelScore = { local: 10, regional: 20, national: 32, international: 42 }[v.competitionLevel] || 10;
    score += levelScore;
    var gpaTarget = v.pathway === 'naia' ? 2.5 : v.pathway === 'ncaa-d1' ? 2.3 : 2.2;
    if (gpa >= gpaTarget) score += 20; else gaps.push('Raise or explain GPA against the selected pathway threshold.');
    if (core >= 16 || v.pathway !== 'ncaa-d1') score += 12; else gaps.push('Map your transcript to the 16 NCAA core-course requirement.');
    if (v.video === 'yes') score += 10; else gaps.push('Create a short highlight video with full-match links.');
    if (v.transcripts === 'yes') score += 10; else gaps.push('Prepare official transcripts and certified English translations if needed.');
    if (english >= 75) score += 8; else gaps.push('Plan English testing if your target school requires it.');
    if (age <= 21) score += 8; else gaps.push('Confirm amateurism and seasons-of-competition rules for your age and playing history.');
    var targetSchools = Math.max(0, integer(v.targetSchools));
    var coachEmails = Math.max(0, integer(v.coachEmails));
    var responseRate = clamp(number(v.responseRate, 8), 0, 100);
    var outreachScore = clamp((targetSchools >= 20 ? 10 : targetSchools / 2) + (coachEmails >= 10 ? 8 : coachEmails * .8) + (responseRate >= 10 ? 7 : responseRate * .7), 0, 25);
    score += outreachScore;
    if (targetSchools < 20) gaps.push('Build a target list of at least 20 schools by level, major, roster need, and scholarship budget.');
    if (coachEmails < 10) gaps.push('Send a personalized coach email sequence with video, transcript status, position, and graduation year.');
    score = clamp(score, 0, 100);
    if (gaps.length) score = Math.min(score, 89);
    return {
      heroLabel: 'Scholarship readiness',
      heroValue: fmt(score, 0) + '/100',
      heroSub: statusLabel(score) + ' fit for ' + (v.pathway || 'selected pathway').toUpperCase() + '.',
      metrics: [
        { label: 'Athletic proof', value: fmt(levelScore, 0) + ' pts', unit: v.competitionLevel + ' level' },
        { label: 'GPA target', value: fmt(gpaTarget, 1), unit: 'minimum planning mark' },
        { label: 'Outreach engine', value: fmt(outreachScore, 0) + '/25', unit: fmt(coachEmails, 0) + ' coach emails' },
        { label: 'Age review', value: age <= 21 ? 'Early' : 'Check', unit: 'eligibility timing' }
      ],
      rows: [
        ['GPA entered', fmt(gpa, 2)],
        ['Core courses entered', fmt(core, 0)],
        ['Highlight video', v.video === 'yes' ? 'Ready' : 'Missing'],
        ['Transcripts', v.transcripts === 'yes' ? 'Ready' : 'Missing'],
        ['English score', english ? String(english) : 'Not entered'],
        ['Target schools', fmt(targetSchools, 0)],
        ['Coach reply rate', pct(responseRate, 1)]
      ],
      bars: [
        { label: 'Readiness', value: score, text: fmt(score, 0) + '/100' }
      ],
      insights: gaps.length ? gaps.concat(['Competitor eligibility tools often stop at academic rules. The outreach score keeps the recruiting workflow visible.']) : ['You have the core materials for outreach. Build a target list by division, major, scholarship budget, and coach response speed.'],
      sources: sourceList(['ncaaIntl', 'ncaaD1', 'naia'])
    };
  }

  function calcAthlete(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var sportBaseUsd = { football: 650, basketball: 520, athletics: 380, rugby: 480, boxing: 420 }[v.sport] || 500;
    var levelMult = { academy: .35, local: 1, national: 2.4, continental: 6, europe: 14 }[v.level] || 1;
    var monthly = number(v.monthlySalary);
    if (!monthly) monthly = sportBaseUsd * levelMult * country.fx;
    var years = clamp(number(v.yearsRemaining, 8), 1, 25);
    var growth = number(v.annualGrowth, 8) / 100;
    var endorsements = number(v.monthlyEndorsements);
    var gross = 0;
    var current = monthly * 12;
    for (var year = 0; year < years; year += 1) {
      gross += current + endorsements * 12;
      current *= (1 + growth);
    }
    var signingBonus = Math.max(0, number(v.signingBonus));
    gross += signingBonus;
    var agent = gross * number(v.agentFee, 8) / 100;
    var tax = gross * number(v.taxReserve, 15) / 100;
    var injuryReserve = gross * number(v.injuryReserve, 6) / 100;
    var relocationCost = Math.max(0, number(v.relocationCost));
    var retirementContribution = clamp(number(v.retirementContribution, 0), 0, 60);
    var retirementReserve = Math.max(0, gross - agent - tax - injuryReserve) * retirementContribution / 100;
    var net = gross - agent - tax - injuryReserve - relocationCost - retirementReserve;
    var savings = net * number(v.savingsRate, 25) / 100;
    return {
      heroLabel: 'Projected career net',
      heroValue: money(net, currency),
      heroSub: 'Across ' + fmt(years, 0) + ' remaining years after agent fee, tax reserve, and injury reserve.',
      metrics: [
        { label: 'Career gross', value: money(gross, currency), unit: 'salary plus endorsements' },
        { label: 'Suggested savings', value: money(savings, currency), unit: pct(number(v.savingsRate, 25), 0) + ' of net' },
        { label: 'Retirement reserve', value: money(retirementReserve, currency), unit: pct(retirementContribution, 0) + ' of post-reserve gross' },
        { label: 'Monthly baseline', value: money(monthly, currency), unit: v.level + ' level' }
      ],
      rows: [
        ['Signing bonus', money(signingBonus, currency)],
        ['Agent fee reserve', money(agent, currency)],
        ['Tax reserve', money(tax, currency)],
        ['Injury reserve', money(injuryReserve, currency)],
        ['Relocation and family support', money(relocationCost, currency)],
        ['Endorsements per month', money(endorsements, currency)],
        ['Next contract target', money(monthly * 1.3, currency) + ' monthly']
      ],
      insights: [
        'The fastest financial improvement is often contract duration and guaranteed pay, not headline salary.',
        'Separate injury reserve from savings. One protects a season; the other builds post-career options.',
        'Endorsement income should be stress-tested because it usually drops fastest after injury or transfer.',
        'Competitor salary calculators rarely include relocation and retirement reserves. Those lines protect the athlete after a move or contract gap.'
      ]
    };
  }

  function calcGamingPc(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var budget = Math.max(0, number(v.budget));
    var reserve = v.peripherals === 'yes' ? .15 : 0;
    var usedDiscount = v.usedParts === 'yes' ? .16 : 0;
    var sourceMult = (v.sourceType === 'import' ? (1 + country.importUplift) : (1 + country.importUplift * .65)) * (1 - usedDiscount);
    var effectiveUsd = (budget / country.fx) / sourceMult;
    var coreBudget = budget * (1 - reserve);
    var allocation = [
      ['GPU', .36],
      ['CPU', .2],
      ['Motherboard', .1],
      ['RAM', .09],
      ['Storage', .08],
      ['Power and case', .1],
      ['Cooling and extras', .07]
    ];
    var tier = effectiveUsd < 450 ? 'Entry esports' : effectiveUsd < 850 ? '1080p balanced' : effectiveUsd < 1350 ? '1440p value' : effectiveUsd < 2200 ? 'High refresh 1440p' : '4K enthusiast';
    var resolution = v.resolution || '1080p';
    var resolutionDrag = { '1080p': 1, '1440p': .68, '4k': .38 }[resolution] || 1;
    var fps = {
      esports: effectiveUsd < 450 ? Math.round(100 * resolutionDrag) + '-' + Math.round(150 * resolutionDrag) + ' FPS at ' + resolution : Math.round(180 * resolutionDrag) + '+ FPS at ' + resolution,
      aaa: effectiveUsd < 850 ? Math.round(55 * resolutionDrag) + '-' + Math.round(75 * resolutionDrag) + ' FPS at ' + resolution : effectiveUsd < 1350 ? Math.round(80 * resolutionDrag) + '-' + Math.round(115 * resolutionDrag) + ' FPS at ' + resolution : Math.round(130 * resolutionDrag) + '+ FPS at ' + resolution,
      creator: effectiveUsd < 850 ? 'Good editing, modest 3D' : 'Strong editing and streaming headroom'
    }[v.gameType] || 'Balanced gaming target';
    var psuGuide = effectiveUsd < 850 ? '550W bronze baseline' : effectiveUsd < 1500 ? '650-750W gold preferred' : '850W quality unit with headroom';
    return {
      heroLabel: 'Recommended build tier',
      heroValue: tier,
      heroSub: 'Effective component power is about USD ' + fmt(effectiveUsd, 0) + ' after local/import uplift.',
      metrics: [
        { label: 'Core build budget', value: money(coreBudget, currency), unit: reserve ? 'peripherals reserved' : 'tower only' },
        { label: 'Expected performance', value: fps, unit: v.gameType },
        { label: 'Price uplift', value: pct((sourceMult - 1) * 100, 0), unit: v.sourceType + (v.usedParts === 'yes' ? ', used mix' : '') },
        { label: 'PSU guidance', value: psuGuide, unit: 'do not underspec' }
      ],
      rows: allocation.map(function (item) {
        return [item[0], money(coreBudget * item[1], currency)];
      }).concat([
        ['Target resolution', resolution],
        ['Used-parts discount model', v.usedParts === 'yes' ? 'Applied, verify warranty and seller reputation' : 'Not applied']
      ]),
      bars: allocation.map(function (item) {
        return { label: item[0], value: item[1] * 100, text: pct(item[1] * 100, 0) };
      }),
      insights: [
        'Keep the GPU budget near one-third of the tower budget for gaming. Overspending on case lighting usually costs FPS.',
        'If importing parts, compare warranty and customs risk against the apparent savings.',
        'For esports cafes, prioritize durable PSUs, cooling, and easy-to-replace peripherals.',
        'Competitor PC builders often assume US pricing. This model adjusts for African local/import uplift and lets you test used-part savings.'
      ]
    };
  }

  function calcPhotoVideo(v) {
    var country = getCountry(v);
    var currency = country.currency;
    var typeMult = { wedding: 1.35, portrait: .75, commercial: 1.65, musicvideo: 1.5, event: 1.0, realestate: .9 }[v.projectType] || 1;
    var shootDays = Math.max(1, number(v.shootDays, 1));
    var editDays = Math.max(0, number(v.editDays, 2));
    var crew = Math.max(0, integer(v.extraCrew));
    var dayRate = country.photoDay * typeMult;
    var shooting = dayRate * shootDays;
    var editing = country.photoDay * .42 * editDays;
    var crewCost = crew * country.photoDay * .55 * shootDays;
    var equipment = number(v.equipmentCost) * shootDays;
    var deliverables = number(v.deliverables) * country.photoDay * .04;
    var usage = { personal: 0, smallbusiness: .18, campaign: .45, broadcast: .8 }[v.usage] || 0;
    var usageFee = (shooting + editing) * usage;
    var rush = v.rush === 'yes' ? (shooting + editing) * .2 : 0;
    var revisionRounds = Math.max(0, integer(v.revisionRounds, 1));
    var revisionFee = Math.max(0, revisionRounds - 1) * country.photoDay * .12;
    var albumCost = Math.max(0, number(v.albumCost));
    var droneFee = v.drone === 'yes' ? country.photoDay * .28 : 0;
    var travel = Math.max(0, number(v.travelCost));
    var subtotal = shooting + editing + crewCost + equipment + deliverables + usageFee + rush + revisionFee + albumCost + droneFee + travel;
    var overhead = subtotal * clamp(number(v.overheadPct, 12), 0, 80) / 100;
    var quote = subtotal + overhead;
    return {
      heroLabel: 'Recommended creative quote',
      heroValue: money(quote, currency),
      heroSub: 'Includes shoot days, editing, crew, equipment, deliverables, travel, rush, and usage rights.',
      metrics: [
        { label: 'Booking deposit', value: money(quote * .6, currency), unit: '60 percent upfront' },
        { label: 'Shoot fee', value: money(shooting, currency), unit: fmt(shootDays, 1) + ' day(s)' },
        { label: 'Usage fee', value: money(usageFee, currency), unit: v.usage },
        { label: 'Overhead', value: money(overhead, currency), unit: pct(clamp(number(v.overheadPct, 12), 0, 80), 0) }
      ],
      rows: [
        ['Editing fee', money(editing, currency)],
        ['Extra crew', money(crewCost, currency)],
        ['Equipment rental', money(equipment, currency)],
        ['Deliverable handling', money(deliverables, currency)],
        ['Extra revision rounds', money(revisionFee, currency)],
        ['Album/print production', money(albumCost, currency)],
        ['Drone add-on', money(droneFee, currency)],
        ['Rush premium', money(rush, currency)],
        ['Travel', money(travel, currency)]
      ],
      insights: [
        'Put usage rights on the invoice. A personal wedding edit is not the same as a paid advertising campaign.',
        'Use deposits to protect dates, especially for weekends and December bookings.',
        'If the client cuts budget, reduce deliverables or usage scope before cutting editing time.',
        'Competitor pricing calculators often omit revisions, album production, and business overhead. Those are usually where creative margins leak.'
      ]
    };
  }

  var TOOLS = {
    'betting-odds': {
      title: 'Football Betting Odds Calculator',
      kicker: 'Odds and value',
      sources: [],
      fields: [
        { id: 'oddsFormat', label: 'Odds format', type: 'select', value: 'decimal', options: [
          { value: 'decimal', label: 'Decimal, e.g. 2.50' },
          { value: 'fractional', label: 'Fractional, e.g. 6/4' },
          { value: 'american', label: 'American, e.g. +150 or -200' },
          { value: 'african', label: 'Local multiplier, e.g. 2.5' }
        ] },
        { id: 'oddsValue', label: 'Odds value', type: 'text', value: '2.50', hint: 'Paste the price from the slip.' },
        { id: 'opponentOddsFormat', label: 'Opposite-side odds format', type: 'select', value: 'decimal', options: [
          { value: 'decimal', label: 'Decimal, e.g. 2.70' },
          { value: 'fractional', label: 'Fractional, e.g. 17/10' },
          { value: 'american', label: 'American, e.g. +170 or -150' },
          { value: 'african', label: 'Local multiplier, e.g. 2.7' }
        ], hint: 'Optional, used for no-vig market margin.' },
        { id: 'opponentOddsValue', label: 'Opposite-side odds value', type: 'text', value: '2.70' },
        { id: 'stake', label: 'Stake amount', type: 'number', value: 5000 },
        { id: 'currency', label: 'Currency', type: 'select', value: 'NGN', options: currencyOptions() },
        { id: 'estimatedProbability', label: 'Your estimated win probability', type: 'number', value: 45, hint: 'Use your own model or honest match read.' },
        { id: 'parlayLegs', label: 'Accumulator legs', type: 'number', value: 1 },
        { id: 'averageLegOdds', label: 'Average leg odds', type: 'number', value: 2.1 }
      ],
      calculate: calcBettingOdds
    },
    'afcon-predictor': {
      title: 'AFCON Tournament Predictor',
      kicker: 'Tournament model',
      fields: [
        { id: 'mode', label: 'Mode', type: 'select', value: '2027-planner', options: [
          { value: '2027-planner', label: '2027 planning mode' },
          { value: '2025-review', label: '2025 review and what-if mode' }
        ] },
        { id: 'favorite', label: 'Team to stress-test', type: 'select', value: 'Morocco', options: AFCON_TEAMS.map(function (t) { return { value: t[0], label: t[0] }; }) },
        { id: 'formBoost', label: 'Recent form boost', type: 'number', value: 3, hint: '0 to 10' },
        { id: 'defenseBoost', label: 'Defensive stability boost', type: 'number', value: 2, hint: '0 to 10' },
        { id: 'hostBoost', label: 'Host or crowd advantage', type: 'number', value: 1, hint: '0 to 10' },
        { id: 'upsetTolerance', label: 'Upset volatility', type: 'number', value: 4, hint: '0 to 10, higher lowers favorite certainty.' }
      ],
      calculate: calcAfcon
    },
    'fantasy-football': {
      title: 'Fantasy Football Points Calculator',
      kicker: 'FPL 2025/26',
      fields: [
        { id: 'position', label: 'Position', type: 'select', value: 'mid', options: [
          { value: 'gk', label: 'Goalkeeper' },
          { value: 'def', label: 'Defender' },
          { value: 'mid', label: 'Midfielder' },
          { value: 'fwd', label: 'Forward' }
        ] },
        { id: 'captain', label: 'Multiplier', type: 'select', value: 'none', options: [
          { value: 'none', label: 'Normal player' },
          { value: 'captain', label: 'Captain, 2x' },
          { value: 'triple', label: 'Triple captain, 3x' }
        ] },
        { id: 'minutes', label: 'Minutes played', type: 'number', value: 90 },
        { id: 'goals', label: 'Goals', type: 'number', value: 1 },
        { id: 'assists', label: 'Assists', type: 'number', value: 0 },
        { id: 'cleanSheet', label: 'Clean sheet', type: 'select', value: 'yes', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
        { id: 'goalsConceded', label: 'Goals conceded', type: 'number', value: 0 },
        { id: 'saves', label: 'Saves, GK only', type: 'number', value: 0 },
        { id: 'defensiveActions', label: 'Defensive contributions', type: 'number', value: 6, hint: 'CBIT style actions. Def threshold 10, Mid/Fwd 12.' },
        { id: 'playerPrice', label: 'Player price, millions', type: 'number', value: 8 },
        { id: 'startProbability', label: 'Start probability %', type: 'number', value: 90 },
        { id: 'fixtureDifficulty', label: 'Fixture difficulty, 1-5', type: 'number', value: 3 },
        { id: 'yellowCards', label: 'Yellow cards', type: 'number', value: 0 },
        { id: 'redCards', label: 'Red cards', type: 'number', value: 0 },
        { id: 'ownGoals', label: 'Own goals', type: 'number', value: 0 },
        { id: 'penaltySaves', label: 'Penalty saves', type: 'number', value: 0 },
        { id: 'penaltyMisses', label: 'Penalty misses', type: 'number', value: 0 },
        { id: 'bonus', label: 'Bonus points', type: 'number', value: 2 }
      ],
      calculate: calcFantasy
    },
    'betting-tax': {
      title: 'Sports Betting Tax Calculator',
      kicker: 'Tax and payout',
      fields: [
        { id: 'market', label: 'Tax market', type: 'select', value: 'NG_LAGOS', options: Object.keys(TAX_MARKETS).map(function (key) { return { value: key, label: TAX_MARKETS[key].label }; }) },
        { id: 'stake', label: 'Stake or wallet deposit', type: 'number', value: 5000 },
        { id: 'grossPayout', label: 'Gross payout if won', type: 'number', value: 12500 },
        { id: 'actualReceived', label: 'Actual received from slip', type: 'number', value: 0, hint: 'Optional, used to audit sportsbook payout differences.' },
        { id: 'currency', label: 'Custom currency', type: 'select', value: 'USD', options: currencyOptions(), hint: 'Only used for Custom market.' },
        { id: 'depositTaxPct', label: 'Custom deposit/stake duty %', type: 'number', value: 0 },
        { id: 'whtPct', label: 'Custom WHT on winnings %', type: 'number', value: 0 }
      ],
      calculate: calcBettingTax
    },
    'streaming-royalties': {
      title: 'Music Streaming Royalty Calculator',
      kicker: 'Creator earnings',
      fields: [
        { id: 'spotifyStreams', label: 'Spotify streams', type: 'number', value: 50000 },
        { id: 'appleStreams', label: 'Apple Music streams', type: 'number', value: 12000 },
        { id: 'boomplayStreams', label: 'Boomplay streams', type: 'number', value: 80000 },
        { id: 'audiomackStreams', label: 'Audiomack streams', type: 'number', value: 25000 },
        { id: 'youtubeStreams', label: 'YouTube Music streams', type: 'number', value: 30000 },
        { id: 'deezerStreams', label: 'Deezer streams', type: 'number', value: 4000 },
        { id: 'tidalStreams', label: 'Tidal streams', type: 'number', value: 1000 },
        { id: 'distributorFee', label: 'Distributor fee %', type: 'number', value: 15 },
        { id: 'artistMasterShare', label: 'Artist master share %', type: 'number', value: 80 },
        { id: 'songwriterShare', label: 'Songwriter share %', type: 'number', value: 50 },
        { id: 'collaboratorShare', label: 'Producer/collaborator split %', type: 'number', value: 10 },
        { id: 'recoupableAdvance', label: 'Unrecouped advance, USD', type: 'number', value: 0 },
        { id: 'marketingSpend', label: 'Marketing spend charged, USD', type: 'number', value: 0 },
        { id: 'targetIncome', label: 'Net income target, USD', type: 'number', value: 1000 }
      ],
      calculate: calcStreaming
    },
    'nollywood-box-office': {
      title: 'Nollywood Box Office Estimator',
      kicker: 'Film recoupment',
      fields: [
        { id: 'productionBudget', label: 'Production budget, NGN', type: 'number', value: 85000000 },
        { id: 'marketingBudget', label: 'Marketing budget, NGN', type: 'number', value: 25000000 },
        { id: 'admissions', label: 'Expected admissions', type: 'number', value: 65000 },
        { id: 'avgTicket', label: 'Average ticket price, NGN', type: 'number', value: 5600 },
        { id: 'cinemaShare', label: 'Cinema/exhibitor share %', type: 'number', value: 50 },
        { id: 'distributorFee', label: 'Distributor fee %', type: 'number', value: 12 },
        { id: 'distributionExpenses', label: 'Distribution expenses, NGN', type: 'number', value: 6000000 },
        { id: 'streamingDeal', label: 'Streaming deal, NGN', type: 'number', value: 45000000 },
        { id: 'brandTieIns', label: 'Brand tie-ins, NGN', type: 'number', value: 12000000 },
        { id: 'investorRecoupPct', label: 'Investor recoup share %', type: 'number', value: 25 }
      ],
      calculate: calcNollywood
    },
    'dj-booking-rate': {
      title: 'DJ Booking Rate Calculator',
      kicker: 'Quote builder',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'eventType', label: 'Event type', type: 'select', value: 'wedding', options: [
          { value: 'wedding', label: 'Wedding or owambe' },
          { value: 'club', label: 'Club night' },
          { value: 'festival', label: 'Festival' },
          { value: 'corporate', label: 'Corporate event' },
          { value: 'private', label: 'Private party' }
        ] },
        { id: 'experience', label: 'DJ level', type: 'select', value: 'working', options: [
          { value: 'emerging', label: 'Emerging' },
          { value: 'working', label: 'Working professional' },
          { value: 'known', label: 'Known city act' },
          { value: 'headline', label: 'Headline act' }
        ] },
        { id: 'hours', label: 'Set length, hours', type: 'number', value: 5 },
        { id: 'equipment', label: 'Equipment supplied', type: 'select', value: 'sound', options: [
          { value: 'none', label: 'Client supplies everything' },
          { value: 'controller', label: 'Deck/controller only' },
          { value: 'sound', label: 'Sound system' },
          { value: 'full', label: 'Sound, lights, booth' }
        ] },
        { id: 'crowdSize', label: 'Expected crowd', type: 'number', value: 300 },
        { id: 'setupHours', label: 'Setup and soundcheck hours', type: 'number', value: 1 },
        { id: 'mcService', label: 'Include MC/host service', type: 'select', value: 'no', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
        { id: 'travelCost', label: 'Travel/logistics cost', type: 'number', value: 30000 },
        { id: 'peakDay', label: 'Peak day or December slot', type: 'select', value: 'yes', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }
      ],
      calculate: calcDj
    },
    'concert-budget': {
      title: 'Concert and Festival Budget Planner',
      kicker: 'Break-even plan',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'capacity', label: 'Venue capacity', type: 'number', value: 2500 },
        { id: 'attendance', label: 'Expected attendance %', type: 'number', value: 72 },
        { id: 'regularTicket', label: 'Regular ticket price', type: 'number', value: 12000 },
        { id: 'vipTicket', label: 'VIP ticket price', type: 'number', value: 45000 },
        { id: 'vipShare', label: 'VIP share of sold tickets %', type: 'number', value: 12 },
        { id: 'sponsorRevenue', label: 'Sponsorship revenue', type: 'number', value: 8000000 },
        { id: 'vendorRevenue', label: 'Vendor booth revenue', type: 'number', value: 1200000 },
        { id: 'artistFees', label: 'Artist fees', type: 'number', value: 18000000 },
        { id: 'venueCost', label: 'Venue cost', type: 'number', value: 4500000 },
        { id: 'productionCost', label: 'Production cost', type: 'number', value: 12000000 },
        { id: 'securityCost', label: 'Security and compliance', type: 'number', value: 3200000 },
        { id: 'permitCost', label: 'Permits and licensing', type: 'number', value: 600000 },
        { id: 'insuranceCost', label: 'Insurance and medical cover', type: 'number', value: 500000 },
        { id: 'marketingCost', label: 'Marketing budget', type: 'number', value: 6500000 },
        { id: 'ticketingFee', label: 'Ticketing/gateway fee %', type: 'number', value: 8 },
        { id: 'contingency', label: 'Contingency %', type: 'number', value: 10 }
      ],
      calculate: calcConcert
    },
    'gym-roi-business': {
      title: 'Gym and Fitness Center ROI Calculator',
      kicker: 'Fitness business',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'startupCost', label: 'Startup investment', type: 'number', value: 28000000 },
        { id: 'members', label: 'Active paying members', type: 'number', value: 420 },
        { id: 'monthlyFee', label: 'Average monthly fee', type: 'number', value: 28000 },
        { id: 'ptRevenue', label: 'Personal training revenue', type: 'number', value: 850000 },
        { id: 'retailRevenue', label: 'Retail/smoothie revenue', type: 'number', value: 350000 },
        { id: 'monthlyChurn', label: 'Monthly churn %', type: 'number', value: 6 },
        { id: 'cac', label: 'Customer acquisition cost', type: 'number', value: 14000 },
        { id: 'rent', label: 'Monthly rent', type: 'number', value: 1700000 },
        { id: 'staffCost', label: 'Monthly staff cost', type: 'number', value: 2300000 },
        { id: 'utilities', label: 'Utilities and internet', type: 'number', value: 650000 },
        { id: 'equipmentFinance', label: 'Equipment finance', type: 'number', value: 900000 },
        { id: 'ownerSalary', label: 'Owner/operator salary', type: 'number', value: 700000 },
        { id: 'otherCosts', label: 'Other monthly costs', type: 'number', value: 450000 }
      ],
      calculate: calcGym
    },
    'event-ticket-revenue': {
      title: 'Event Ticket Revenue Calculator',
      kicker: 'Ticket yield',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'vipTickets', label: 'VIP tickets sold', type: 'number', value: 120 },
        { id: 'vipPrice', label: 'VIP price', type: 'number', value: 50000 },
        { id: 'regularTickets', label: 'Regular tickets sold', type: 'number', value: 900 },
        { id: 'regularPrice', label: 'Regular price', type: 'number', value: 12000 },
        { id: 'studentTickets', label: 'Student tickets sold', type: 'number', value: 180 },
        { id: 'studentPrice', label: 'Student price', type: 'number', value: 5000 },
        { id: 'earlyBirdTickets', label: 'Early-bird tickets sold', type: 'number', value: 160 },
        { id: 'earlyBirdPrice', label: 'Early-bird price', type: 'number', value: 8500 },
        { id: 'compTickets', label: 'Comp/free tickets', type: 'number', value: 80 },
        { id: 'sponsorRevenue', label: 'Sponsor revenue', type: 'number', value: 1500000 },
        { id: 'affiliateFee', label: 'Affiliate/influencer payout', type: 'number', value: 250000 },
        { id: 'platformFee', label: 'Platform fee %', type: 'number', value: 6 },
        { id: 'gatewayFee', label: 'Payment gateway fee %', type: 'number', value: 2 },
        { id: 'refundRate', label: 'Refund/no-show reserve %', type: 'number', value: 3 },
        { id: 'marketingCost', label: 'Marketing cost', type: 'number', value: 1800000 },
        { id: 'fixedCosts', label: 'Fixed event costs', type: 'number', value: 3200000 }
      ],
      calculate: calcEventTickets
    },
    'match-tickets': {
      title: 'Match Ticket Price Comparator',
      kicker: 'Football tickets',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'matchTier', label: 'Competition level', type: 'select', value: 'local', options: [
          { value: 'local', label: 'Local league' },
          { value: 'continental', label: 'CAF/continental match' },
          { value: 'national', label: 'National team qualifier' },
          { value: 'derby', label: 'Major derby or rivalry' }
        ] },
        { id: 'seatType', label: 'Seat type', type: 'select', value: 'regular', options: [
          { value: 'terrace', label: 'Terrace/standard end' },
          { value: 'regular', label: 'Regular seat' },
          { value: 'vip', label: 'VIP' },
          { value: 'box', label: 'Box/hospitality' }
        ] },
        { id: 'demand', label: 'Demand level', type: 'select', value: 'normal', options: [
          { value: 'normal', label: 'Normal fixture' },
          { value: 'title', label: 'Title race or qualifier' },
          { value: 'rivalry', label: 'Rivalry match' },
          { value: 'final', label: 'Final or trophy game' }
        ] },
        { id: 'quantity', label: 'Tickets needed', type: 'number', value: 2 },
        { id: 'channel', label: 'Purchase channel', type: 'select', value: 'online', options: [
          { value: 'gate', label: 'Gate or club office' },
          { value: 'online', label: 'Official online platform' },
          { value: 'reseller', label: 'Reseller/agent' }
        ] },
        { id: 'seasonPassPrice', label: 'Season pass price', type: 'number', value: 0 },
        { id: 'homeMatches', label: 'Home matches in pass', type: 'number', value: 15 },
        { id: 'transportCost', label: 'Transport cost', type: 'number', value: 8000 },
        { id: 'foodCost', label: 'Food and drinks', type: 'number', value: 12000 },
        { id: 'parkingCost', label: 'Parking or access cost', type: 'number', value: 2500 }
      ],
      calculate: calcMatchTickets
    },
    'sports-scholarship': {
      title: 'Sports Scholarship Eligibility Checker',
      kicker: 'Student-athlete',
      fields: [
        { id: 'pathway', label: 'Target pathway', type: 'select', value: 'ncaa-d1', options: [
          { value: 'ncaa-d1', label: 'NCAA Division I' },
          { value: 'ncaa-d2', label: 'NCAA Division II' },
          { value: 'ncaa-d3', label: 'NCAA Division III' },
          { value: 'naia', label: 'NAIA' },
          { value: 'uk', label: 'UK university sport' },
          { value: 'canada', label: 'Canada university sport' }
        ] },
        { id: 'competitionLevel', label: 'Highest competition level', type: 'select', value: 'national', options: [
          { value: 'local', label: 'School/local club' },
          { value: 'regional', label: 'State/regional' },
          { value: 'national', label: 'National competition' },
          { value: 'international', label: 'International selection' }
        ] },
        { id: 'gpa', label: 'Estimated GPA on 4.0 scale', type: 'number', value: 2.8 },
        { id: 'coreCourses', label: 'Mapped core courses', type: 'number', value: 16 },
        { id: 'age', label: 'Age', type: 'number', value: 18 },
        { id: 'englishScore', label: 'English test score or equivalent', type: 'number', value: 80 },
        { id: 'video', label: 'Highlight video ready', type: 'select', value: 'yes', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
        { id: 'transcripts', label: 'Official transcripts ready', type: 'select', value: 'no', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
        { id: 'targetSchools', label: 'Target schools researched', type: 'number', value: 12 },
        { id: 'coachEmails', label: 'Coach emails sent', type: 'number', value: 4 },
        { id: 'responseRate', label: 'Coach reply rate %', type: 'number', value: 8 }
      ],
      calculate: calcScholarship
    },
    'athlete-earnings': {
      title: 'Athlete Career Earnings Calculator',
      kicker: 'Career finance',
      fields: [
        { id: 'country', label: 'Home market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'sport', label: 'Sport', type: 'select', value: 'football', options: [
          { value: 'football', label: 'Football' },
          { value: 'basketball', label: 'Basketball' },
          { value: 'athletics', label: 'Athletics' },
          { value: 'rugby', label: 'Rugby' },
          { value: 'boxing', label: 'Boxing' }
        ] },
        { id: 'level', label: 'Current level', type: 'select', value: 'local', options: [
          { value: 'academy', label: 'Academy or amateur' },
          { value: 'local', label: 'Local professional' },
          { value: 'national', label: 'Top national league' },
          { value: 'continental', label: 'Continental/top club' },
          { value: 'europe', label: 'Europe or global league' }
        ] },
        { id: 'monthlySalary', label: 'Current monthly salary, optional', type: 'number', value: 0 },
        { id: 'signingBonus', label: 'Signing bonus', type: 'number', value: 0 },
        { id: 'monthlyEndorsements', label: 'Monthly endorsements', type: 'number', value: 250000 },
        { id: 'yearsRemaining', label: 'Years remaining', type: 'number', value: 8 },
        { id: 'annualGrowth', label: 'Annual contract growth %', type: 'number', value: 8 },
        { id: 'agentFee', label: 'Agent/management fee %', type: 'number', value: 8 },
        { id: 'taxReserve', label: 'Tax reserve %', type: 'number', value: 15 },
        { id: 'injuryReserve', label: 'Injury reserve %', type: 'number', value: 6 },
        { id: 'relocationCost', label: 'Relocation/family support cost', type: 'number', value: 0 },
        { id: 'retirementContribution', label: 'Retirement reserve %', type: 'number', value: 8 },
        { id: 'savingsRate', label: 'Savings rate % of net', type: 'number', value: 25 }
      ],
      calculate: calcAthlete
    },
    'gaming-pc-build': {
      title: 'Gaming PC Build Calculator for Africa',
      kicker: 'Parts budget',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'budget', label: 'Total budget in local currency', type: 'number', value: 1400000 },
        { id: 'gameType', label: 'Primary workload', type: 'select', value: 'esports', options: [
          { value: 'esports', label: 'Esports, 1080p high FPS' },
          { value: 'aaa', label: 'AAA gaming' },
          { value: 'creator', label: 'Gaming plus content creation' }
        ] },
        { id: 'resolution', label: 'Target resolution', type: 'select', value: '1080p', options: [
          { value: '1080p', label: '1080p' },
          { value: '1440p', label: '1440p' },
          { value: '4k', label: '4K' }
        ] },
        { id: 'sourceType', label: 'Buying route', type: 'select', value: 'local', options: [
          { value: 'local', label: 'Local retailers' },
          { value: 'import', label: 'Import parts' }
        ] },
        { id: 'usedParts', label: 'Use verified used parts', type: 'select', value: 'no', options: [{ value: 'yes', label: 'Yes, some parts' }, { value: 'no', label: 'No, new parts only' }] },
        { id: 'peripherals', label: 'Include monitor and peripherals', type: 'select', value: 'yes', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No, tower only' }] }
      ],
      calculate: calcGamingPc
    },
    'photo-video-pricing': {
      title: 'Photography and Videography Pricing Tool',
      kicker: 'Creative quote',
      fields: [
        { id: 'country', label: 'Market', type: 'select', value: 'NG', options: countryOptions() },
        { id: 'projectType', label: 'Project type', type: 'select', value: 'wedding', options: [
          { value: 'wedding', label: 'Wedding' },
          { value: 'portrait', label: 'Portrait/session' },
          { value: 'commercial', label: 'Commercial campaign' },
          { value: 'musicvideo', label: 'Music video' },
          { value: 'event', label: 'Event coverage' },
          { value: 'realestate', label: 'Real estate/property' }
        ] },
        { id: 'shootDays', label: 'Shoot days', type: 'number', value: 1 },
        { id: 'editDays', label: 'Editing days', type: 'number', value: 3 },
        { id: 'extraCrew', label: 'Extra crew members', type: 'number', value: 1 },
        { id: 'equipmentCost', label: 'Equipment rental per day', type: 'number', value: 75000 },
        { id: 'deliverables', label: 'Final deliverables count', type: 'number', value: 60 },
        { id: 'revisionRounds', label: 'Included revision rounds', type: 'number', value: 1 },
        { id: 'usage', label: 'Usage rights', type: 'select', value: 'personal', options: [
          { value: 'personal', label: 'Personal/private use' },
          { value: 'smallbusiness', label: 'Small business marketing' },
          { value: 'campaign', label: 'Paid campaign' },
          { value: 'broadcast', label: 'Broadcast or large campaign' }
        ] },
        { id: 'albumCost', label: 'Album/print production', type: 'number', value: 0 },
        { id: 'drone', label: 'Drone coverage', type: 'select', value: 'no', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
        { id: 'overheadPct', label: 'Business overhead %', type: 'number', value: 12 },
        { id: 'travelCost', label: 'Travel/logistics', type: 'number', value: 50000 },
        { id: 'rush', label: 'Rush delivery', type: 'select', value: 'no', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }
      ],
      calculate: calcPhotoVideo
    }
  };

  var ORDER = [
    'betting-odds', 'afcon-predictor', 'fantasy-football', 'betting-tax',
    'streaming-royalties', 'nollywood-box-office', 'dj-booking-rate', 'concert-budget',
    'gym-roi-business', 'event-ticket-revenue', 'match-tickets', 'sports-scholarship',
    'athlete-earnings', 'gaming-pc-build', 'photo-video-pricing'
  ];

  var REPORTS_KEY = 'afro_sports_reports_v1';
  var LEAD_KEY = 'afro_sports_lead_v1';
  var COMMON_LEAD_KEY = 'afrotools_lead_email';
  var LEGACY_LEAD_KEY = 'afrotools-email-gate';
  var WORKFLOWS = [
    { id: 'betting', label: 'Betting decision path', tools: ['betting-odds', 'betting-tax', 'match-tickets'] },
    { id: 'creator', label: 'Creator money path', tools: ['streaming-royalties', 'photo-video-pricing', 'dj-booking-rate'] },
    { id: 'event', label: 'Event operator path', tools: ['concert-budget', 'event-ticket-revenue', 'dj-booking-rate', 'photo-video-pricing'] },
    { id: 'athlete', label: 'Athlete pathway', tools: ['sports-scholarship', 'athlete-earnings', 'fantasy-football'] },
    { id: 'business', label: 'Sports business path', tools: ['gym-roi-business', 'gaming-pc-build', 'athlete-earnings'] }
  ];
  var TOOL_TO_WORKFLOW = {};
  WORKFLOWS.forEach(function (workflow) {
    workflow.tools.forEach(function (id) {
      if (!TOOL_TO_WORKFLOW[id]) TOOL_TO_WORKFLOW[id] = workflow;
    });
  });

  function readJson(key, fallback) {
    try {
      var raw = root.localStorage && root.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (!root.localStorage) return false;
      root.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getAuthEmail() {
    try {
      if (root.AfroAuth && typeof root.AfroAuth.getUser === 'function') {
        var user = root.AfroAuth.getUser();
        if (user && user.email) return user.email;
      }
      var cached = readJson('afro_auth_v2', null);
      if (cached && cached.email) return cached.email;
    } catch (err) {}
    return '';
  }

  function getLeadDefaults() {
    var stored = readJson(LEAD_KEY, {});
    if (!stored || typeof stored !== 'object') stored = {};
    var email = stored.email || '';
    try {
      email = email || (root.localStorage && (root.localStorage.getItem(COMMON_LEAD_KEY) || root.localStorage.getItem(LEGACY_LEAD_KEY))) || '';
    } catch (err) {}
    email = email || getAuthEmail();
    return { name: stored.name || '', email: email };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
  }

  function rememberLead(lead, toolId) {
    var data = { name: lead.name || '', email: lead.email || '', toolSlug: toolId || '', savedAt: new Date().toISOString() };
    writeJson(LEAD_KEY, data);
    try {
      root.localStorage.setItem(COMMON_LEAD_KEY, data.email);
      root.localStorage.setItem(LEGACY_LEAD_KEY, data.email);
    } catch (err) {}
  }

  function captureLead(lead, toolId, result) {
    if (!root.fetch || !lead.email) return;
    try {
      root.fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lead.email,
          name: lead.name || null,
          source: 'sports-pdf-gate',
          category: 'sports',
          toolSlug: toolId,
          leadMagnet: 'sports-report',
          pageUrl: root.location && root.location.href || '',
          referrerUrl: root.document && root.document.referrer || '',
          conversionValue: result && result.heroValue || ''
        })
      }).catch(function () {});
    } catch (err) {}
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (!root.document) {
        resolve(false);
        return;
      }
      if (root.document.querySelector('script[src="' + src + '"]')) {
        resolve(true);
        return;
      }
      var script = root.document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = function () { resolve(true); };
      script.onerror = function () { reject(new Error('Could not load ' + src)); };
      root.document.head.appendChild(script);
    });
  }

  function ensureWorkspace() {
    if (root.AfroWorkspace && typeof root.AfroWorkspace.upsert === 'function') return Promise.resolve(true);
    return loadScript('/assets/js/afro-auth.js')
      .catch(function () { return false; })
      .then(function () { return loadScript('/assets/js/lib/workspace-sync.js').catch(function () { return false; }); })
      .then(function () { return !!(root.AfroWorkspace && typeof root.AfroWorkspace.upsert === 'function'); });
  }

  function reportSummary(result) {
    var text = [result.heroLabel || 'Sports report', result.heroValue || '', result.heroSub || ''].join(': ').replace(/\s+/g, ' ').trim();
    return text.length > 180 ? text.slice(0, 177).trim() + '...' : text;
  }

  function buildReportText(toolId, tool, result, values) {
    var lines = [];
    lines.push(tool.title + ' - AfroTools Sports Report');
    lines.push('Created: ' + new Date().toLocaleString());
    lines.push('Page: /tools/' + toolId + '/');
    lines.push('');
    lines.push('Headline: ' + (result.heroLabel || 'Result') + ' - ' + (result.heroValue || '-'));
    if (result.heroSub) lines.push('Summary: ' + result.heroSub);
    if (result.metrics && result.metrics.length) {
      lines.push('');
      lines.push('Key metrics');
      result.metrics.forEach(function (metric) {
        lines.push('- ' + metric.label + ': ' + metric.value + (metric.unit ? ' (' + metric.unit + ')' : ''));
      });
    }
    if (result.rows && result.rows.length) {
      lines.push('');
      lines.push('Detailed lines');
      result.rows.forEach(function (row) {
        lines.push('- ' + row[0] + ': ' + row[1]);
      });
    }
    if (result.insights && result.insights.length) {
      lines.push('');
      lines.push('Action notes');
      result.insights.forEach(function (item) {
        lines.push('- ' + item);
      });
    }
    lines.push('');
    lines.push('Inputs');
    tool.fields.forEach(function (field) {
      if (field.type === 'heading') return;
      var label = field.label || field.id;
      lines.push('- ' + label + ': ' + (values[field.id] == null ? '' : values[field.id]));
    });
    var sources = result.sources || sourceList(tool.sources);
    if (sources && sources.length) {
      lines.push('');
      lines.push('Sources and assumptions');
      sources.forEach(function (source) {
        lines.push('- ' + source.title + ': ' + source.url);
      });
    }
    return lines.join('\n');
  }

  function makeReportItem(toolId, tool, result, values, reportText, lead) {
    var now = new Date().toISOString();
    var workflow = TOOL_TO_WORKFLOW[toolId];
    return {
      id: 'sports-' + toolId + '-' + Date.now().toString(36),
      itemType: 'sports-report',
      toolSlug: toolId,
      toolTitle: tool.title,
      title: tool.title + ' report',
      summary: reportSummary(result),
      href: '/tools/' + toolId + '/',
      report: reportText,
      resultLabel: result.heroLabel || '',
      resultValue: result.heroValue || '',
      inputs: values || {},
      lead: { name: lead.name || '', email: lead.email || '' },
      workflowId: workflow ? workflow.id : '',
      workflowLabel: workflow ? workflow.label : '',
      createdAt: now,
      savedAt: now
    };
  }

  function readReports() {
    var items = readJson(REPORTS_KEY, []);
    return Array.isArray(items) ? items : [];
  }

  function saveReportLocal(item) {
    var items = readReports().filter(function (existing) { return existing && existing.id !== item.id; });
    items.unshift(item);
    writeJson(REPORTS_KEY, items.slice(0, 30));
    try {
      root.dispatchEvent(new CustomEvent('afro-workspace-change', {
        detail: { action: 'upsert', itemType: 'sports-report', itemKey: item.id, item: item, synced: false }
      }));
    } catch (err) {}
  }

  function saveReportCloud(item) {
    return ensureWorkspace().then(function () {
      if (!root.AfroWorkspace || !root.AfroWorkspace.isSignedIn || !root.AfroWorkspace.isSignedIn()) return false;
      return root.AfroWorkspace.upsert({
        itemType: 'sports-report',
        itemKey: item.id,
        toolSlug: item.toolSlug,
        title: item.title,
        summary: item.summary,
        href: item.href,
        payload: item,
        meta: { category: 'sports', workflow: item.workflowId || '' }
      }).then(function () { return true; }).catch(function () { return false; });
    }).catch(function () { return false; });
  }

  function renderWorkflowStrip(currentId) {
    var workflow = TOOL_TO_WORKFLOW[currentId];
    if (!workflow) return '';
    var html = '<section class="sports-workflow-strip" aria-label="Suggested sports workflow">';
    html += '<div><strong>' + esc(workflow.label) + '</strong><span>Save a report, then continue the path. Sports reports appear in your dashboard workspace.</span></div>';
    html += '<div class="sports-workflow-steps">';
    workflow.tools.forEach(function (id) {
      var tool = TOOLS[id];
      if (!tool) return;
      html += '<a class="sports-workflow-step' + (id === currentId ? ' active' : '') + '" href="/tools/' + esc(id) + '/">' + esc(tool.kicker || tool.title) + '</a>';
    });
    html += '</div></section>';
    return html;
  }

  function nextWorkflowHref(currentId) {
    var workflow = TOOL_TO_WORKFLOW[currentId];
    if (!workflow) return '/sports/';
    var idx = workflow.tools.indexOf(currentId);
    var next = workflow.tools[idx + 1] || workflow.tools[0];
    return '/tools/' + next + '/';
  }

  function renderReportGate(toolId, tool, result, values) {
    var lead = getLeadDefaults();
    var reportText = buildReportText(toolId, tool, result, values);
    return '<div class="sports-report-gate" data-sports-report-gate>' +
      '<h3>Unlock the PDF-ready report</h3>' +
      '<p>Get a clean printable report, save this scenario to your dashboard, and continue the related sports workflow.</p>' +
      '<form class="sports-lead-form" novalidate>' +
        '<input class="sports-input" type="text" name="name" autocomplete="name" placeholder="Name, optional" value="' + esc(lead.name) + '">' +
        '<input class="sports-input" type="email" name="email" autocomplete="email" required placeholder="you@example.com" value="' + esc(lead.email) + '">' +
        '<button class="sports-btn" type="submit">Unlock report</button>' +
        '<div class="sports-lead-msg" aria-live="polite"></div>' +
      '</form>' +
      '<div class="sports-report-actions" hidden>' +
        '<button class="sports-btn" type="button" data-print-report>Print / save PDF</button>' +
        '<button class="sports-btn secondary" type="button" data-save-report>Save to dashboard</button>' +
        '<a class="sports-btn secondary" href="' + esc(nextWorkflowHref(toolId)) + '">Continue workflow</a>' +
        '<a class="sports-btn secondary" href="/dashboard/">Open dashboard</a>' +
      '</div>' +
      '<pre class="sports-report-preview" data-report-preview>' + esc(reportText) + '</pre>' +
      '<div class="sports-dashboard-note">We store the report locally right away. If you are signed in, AfroTools will also try to sync it to your account workspace.</div>' +
    '</div>';
  }

  function wireReportGate(container, toolId, tool, result, values) {
    var gate = container && container.querySelector('[data-sports-report-gate]');
    if (!gate) return;
    var form = gate.querySelector('form');
    var actions = gate.querySelector('.sports-report-actions');
    var preview = gate.querySelector('[data-report-preview]');
    var msg = gate.querySelector('.sports-lead-msg');
    var reportText = buildReportText(toolId, tool, result, values);
    var item = null;
    if (preview) preview.textContent = reportText;
    function setMsg(text) {
      if (msg) msg.textContent = text || '';
    }
    function unlock(lead) {
      item = item || makeReportItem(toolId, tool, result, values, reportText, lead);
      saveReportLocal(item);
      saveReportCloud(item).then(function (synced) {
        setMsg(synced ? 'Report unlocked, saved locally, and synced to your account.' : 'Report unlocked and saved on this device. Sign in to sync across devices.');
      });
      if (actions) actions.hidden = false;
      if (preview) preview.classList.add('on');
    }
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var lead = {
          name: (form.elements.name && form.elements.name.value || '').trim(),
          email: (form.elements.email && form.elements.email.value || '').trim()
        };
        if (!isValidEmail(lead.email)) {
          setMsg('Enter a valid email to unlock the report.');
          if (form.elements.email) form.elements.email.focus();
          return;
        }
        rememberLead(lead, toolId);
        captureLead(lead, toolId, result);
        unlock(lead);
      });
    }
    var printBtn = gate.querySelector('[data-print-report]');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        gate.classList.add('print-active');
        if (root.document && root.document.body) root.document.body.classList.add('sports-printing');
        try { root.print(); } catch (err) {}
        root.setTimeout(function () {
          gate.classList.remove('print-active');
          if (root.document && root.document.body) root.document.body.classList.remove('sports-printing');
        }, 500);
      });
    }
    var saveBtn = gate.querySelector('[data-save-report]');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var defaults = getLeadDefaults();
        item = item || makeReportItem(toolId, tool, result, values, reportText, defaults);
        saveReportLocal(item);
        setMsg('Saved to dashboard on this device. Checking account sync...');
        saveReportCloud(item).then(function (synced) {
          setMsg(synced ? 'Saved to your account workspace.' : 'Saved locally. Sign in to sync it across devices.');
        });
      });
    }
  }

  function fieldHtml(field) {
    if (field.type === 'heading') return '<div class="sports-field-heading">' + esc(field.label) + '</div>';
    var cls = field.full ? 'sports-field full' : 'sports-field';
    var html = '<div class="' + cls + '"><label class="sports-label" for="sports-' + esc(field.id) + '">' + esc(field.label) + '</label>';
    if (field.type === 'select') {
      html += '<select class="sports-select" id="sports-' + esc(field.id) + '" name="' + esc(field.id) + '">';
      (field.options || []).forEach(function (option) {
        html += '<option value="' + esc(option.value) + '"' + (String(option.value) === String(field.value) ? ' selected' : '') + '>' + esc(option.label) + '</option>';
      });
      html += '</select>';
    } else {
      html += '<input class="sports-input" id="sports-' + esc(field.id) + '" name="' + esc(field.id) + '" type="' + esc(field.type || 'text') + '" value="' + esc(field.value == null ? '' : field.value) + '" inputmode="' + (field.type === 'number' ? 'decimal' : 'text') + '">';
    }
    if (field.hint) html += '<div class="sports-hint">' + esc(field.hint) + '</div>';
    html += '</div>';
    return html;
  }

  function readValues(form, tool) {
    var values = {};
    tool.fields.forEach(function (field) {
      if (field.type === 'heading') return;
      var el = form.elements[field.id];
      values[field.id] = el ? el.value : field.value;
    });
    return values;
  }

  function renderResult(rootEl, result, tool, values, currentId) {
    var html = '<div class="sports-result-hero">';
    html += '<div class="sports-result-label">' + esc(result.heroLabel || 'Result') + '</div>';
    html += '<div class="sports-result-value">' + esc(result.heroValue || '-') + '</div>';
    html += '<div class="sports-result-sub">' + esc(result.heroSub || '') + '</div>';
    html += '</div>';
    if (result.metrics && result.metrics.length) {
      html += '<div class="sports-metrics">';
      result.metrics.forEach(function (metric) {
        html += '<div class="sports-metric"><div class="sports-metric-label">' + esc(metric.label) + '</div><div class="sports-metric-value">' + esc(metric.value) + '</div><div class="sports-metric-unit">' + esc(metric.unit || '') + '</div></div>';
      });
      html += '</div>';
    }
    if (result.bars && result.bars.length) {
      html += '<div class="sports-bars">';
      result.bars.forEach(function (bar) {
        var width = clamp(number(bar.value), 0, 100);
        html += '<div class="sports-bar-row"><div>' + esc(bar.label) + '</div><div class="sports-bar-track"><div class="sports-bar-fill" style="width:' + width + '%"></div></div><div>' + esc(bar.text || pct(width, 0)) + '</div></div>';
      });
      html += '</div>';
    }
    if (result.rows && result.rows.length) {
      html += '<div class="sports-table-wrap"><table class="sports-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>';
      result.rows.forEach(function (row) {
        html += '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    if (result.insights && result.insights.length) {
      html += '<div class="sports-insights"><h3>What to do with this</h3><ul>';
      result.insights.forEach(function (item) { html += '<li>' + esc(item) + '</li>'; });
      html += '</ul></div>';
    }
    var sources = result.sources || sourceList(tool.sources);
    if (sources && sources.length) {
      html += '<div class="sports-source-card"><h3>Sources and assumptions</h3><ul>';
      sources.forEach(function (source) {
        html += '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) + '</a>: ' + esc(source.note) + '</li>';
      });
      html += '</ul></div>';
    }
    html += renderReportGate(currentId, tool, result, values || {});
    rootEl.innerHTML = html;
    wireReportGate(rootEl, currentId, tool, result, values || {});
  }

  function renderNextApps(container, currentId) {
    var currentIndex = ORDER.indexOf(currentId);
    var picks = [ORDER[(currentIndex + 1) % ORDER.length], ORDER[(currentIndex + 2) % ORDER.length], ORDER[(currentIndex + 3) % ORDER.length]];
    var html = '<div class="sports-next-apps">';
    picks.forEach(function (id) {
      var tool = TOOLS[id];
      if (!tool) return;
      html += '<a href="/tools/' + esc(id) + '/">' + esc(tool.title) + '<span>' + esc(tool.kicker || 'Sports tool') + '</span></a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function init(id) {
    id = id || (root.document && root.document.body && root.document.body.getAttribute('data-sports-tool'));
    var tool = TOOLS[id];
    var rootEl = root.document && root.document.getElementById('sports-tool-root');
    if (!rootEl || !tool) return;
    rootEl.innerHTML = renderWorkflowStrip(id) + '<div class="sports-shell-grid"><section class="sports-panel"><div class="sports-panel-title"><span>Inputs</span><span class="sports-panel-kicker">' + esc(tool.kicker || 'Tool') + '</span></div><form id="sports-tool-form" novalidate><div class="sports-form-grid">' + tool.fields.map(fieldHtml).join('') + '</div><div class="sports-actions"><button class="sports-btn" type="submit">Calculate</button><button class="sports-btn secondary" type="button" data-reset>Reset</button></div></form></section><section class="sports-panel" id="sports-result-panel"><div class="sports-panel-title"><span>Results</span><span class="sports-status">Live calculator</span></div><div id="sports-results"></div></section></div><div id="sports-next-apps"></div>';
    var form = root.document.getElementById('sports-tool-form');
    var output = root.document.getElementById('sports-results');
    function calculate() {
      var values = readValues(form, tool);
      renderResult(output, tool.calculate(values), tool, values, id);
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) el.addEventListener('change', calculate);
    });
    var reset = form.querySelector('[data-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        tool.fields.forEach(function (field) {
          if (field.type === 'heading') return;
          var el = form.elements[field.id];
          if (el) el.value = field.value == null ? '' : field.value;
        });
        calculate();
      });
    }
    calculate();
    renderNextApps(root.document.getElementById('sports-next-apps'), id);
  }

  var api = {
    init: init,
    tools: TOOLS,
    countries: COUNTRIES,
    workflows: WORKFLOWS,
    getSavedReports: readReports,
    calculate: function (id, values) {
      if (!TOOLS[id]) throw new Error('Unknown sports tool: ' + id);
      return TOOLS[id].calculate(values || {});
    }
  };

  root.AfroSports = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
