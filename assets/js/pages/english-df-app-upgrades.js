(function () {
  'use strict';

  function money(value, currency) {
    var amount = Number(value || 0);
    return (currency || 'USD') + ' ' + Math.round(amount).toLocaleString();
  }

  function pct(value) {
    return Number(value || 0).toFixed(1).replace(/\.0$/, '') + '%';
  }

  function field(form, name, fallback) {
    var item = form.elements[name];
    return item ? item.value : fallback;
  }

  function number(form, name, fallback) {
    var value = Number(field(form, name, fallback));
    return Number.isFinite(value) ? value : Number(fallback || 0);
  }

  function update(form) {
    var tool = form.getAttribute('data-df-form');
    var out = document.querySelector('[data-df-result="' + tool + '"]');
    if (!out) return;
    var text = '';

    if (tool === 'baby-name-generator') {
      var culture = field(form, 'culture', 'Yoruba');
      var theme = field(form, 'theme', 'joy');
      var gender = field(form, 'gender', 'unisex');
      var names = {
        Yoruba: ['Ayomide', 'Ifeoluwa', 'Tiwatope'],
        Akan: ['Kwame', 'Ama', 'Kojo'],
        Swahili: ['Amani', 'Zuri', 'Imani'],
        Igbo: ['Chiamaka', 'Chinedu', 'Ngozi']
      }[culture] || ['Amani', 'Amara', 'Zola'];
      text = 'Result: shortlist ' + names.join(', ') + ' for a ' + gender + ' name with a ' + theme + ' meaning. Methodology: match culture, theme, gender preference, pronunciation notes, then confirm family spelling before registration.';
    } else if (tool === 'festival-calendar') {
      text = 'Result: plan ' + field(form, 'country', 'Nigeria') + ' events in ' + field(form, 'month', 'December') + ' with a 6-12 week travel buffer. Output: confirm official dates, book lodging, check filming rules, and add local transport costs.';
    } else if (tool === 'age-calculator-african') {
      var birth = new Date(field(form, 'birthDate', '2000-01-01'));
      var now = new Date();
      var age = now.getFullYear() - birth.getFullYear();
      if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
      var dayNames = ['Kwasi/Akousua', 'Kwadwo/Adwoa', 'Kwabena/Abena', 'Kwaku/Akua', 'Yaw/Yaa', 'Kofi/Afua', 'Kwame/Ama'];
      text = 'Result: exact age is about ' + age + ' years. Birth weekday is ' + birth.toLocaleDateString('en', { weekday: 'long' }) + '; Akan day-name reference: ' + dayNames[birth.getDay()] + '. Use legal birth records for forms.';
    } else if (tool === 'crop-insurance-calc') {
      var cropValue = number(form, 'cropValue', 500000);
      var rate = number(form, 'riskRate', 4.5);
      var subsidy = number(form, 'subsidy', 0);
      var premium = cropValue * rate / 100 * (1 - subsidy / 100);
      text = 'Estimate: planning premium is ' + money(premium, field(form, 'currency', 'NGN')) + ' for insured crop value of ' + money(cropValue, field(form, 'currency', 'NGN')) + '. Methodology: insured value x risk rate minus subsidy. Verify with the insurer or public agriculture scheme before buying cover.';
    } else if (tool === 'health-insurance-compare') {
      var premiumScore = Math.max(0, 35 - number(form, 'premium', 25000) / 3000);
      var coverScore = Math.min(40, number(form, 'inpatient', 1000000) / 40000);
      var networkScore = number(form, 'network', 20) > 50 ? 20 : 12;
      var total = Math.max(0, Math.min(100, premiumScore + coverScore + networkScore + (field(form, 'chronic', 'no') === 'yes' ? 5 : 0)));
      text = 'Result: plan fit score ' + Math.round(total) + '/100. Compare premium, inpatient limit, provider network, exclusions, waiting periods, and chronic care rules before choosing.';
    } else if (tool === 'health-contribution') {
      var income = number(form, 'income', 100000);
      var country = field(form, 'country', 'Kenya');
      var contribution = country === 'Kenya' ? Math.max(300, income * 0.0275) : income * 0.02;
      text = 'Estimate: ' + country + ' monthly contribution planning value is ' + money(contribution, field(form, 'currency', 'KES')) + '. Kenya uses a 2.75% SHIF planning rule with a minimum contribution; other countries need the country page and official schedule.';
    } else if (tool === 'workers-comp') {
      var payroll = number(form, 'payroll', 12000000);
      var risk = number(form, 'riskRate', 1.2);
      var assessment = payroll * risk / 100;
      text = 'Estimate: annual assessment envelope is ' + money(assessment, field(form, 'currency', 'ZAR')) + '. Methodology: annual insurable payroll x risk class rate. Confirm industry class, earnings cap, and filing deadline with the compensation authority.';
    } else if (tool === 'aso-ebi-cost') {
      var people = number(form, 'people', 20);
      var fabric = number(form, 'fabric', 18000);
      var tailoring = number(form, 'tailoring', 25000);
      var total = people * (fabric + tailoring);
      text = 'Result: group outfit budget is ' + money(total, field(form, 'currency', 'NGN')) + '. Collect a deposit of about ' + money(total * 0.6, field(form, 'currency', 'NGN')) + ' before buying fabric and lock measurement dates early.';
    } else if (tool === 'life-insurance-calc') {
      var annualIncome = number(form, 'annualIncome', 6000000);
      var years = number(form, 'years', 7);
      var debt = number(form, 'debt', 1000000);
      var savings = number(form, 'savings', 500000);
      var gap = Math.max(0, annualIncome * years + debt - savings);
      text = 'Result: life cover gap is about ' + money(gap, field(form, 'currency', 'NGN')) + '. Methodology: income replacement years plus debt minus current savings. This is a planning estimate, not financial advice.';
    } else if (tool === 'car-insurance') {
      var value = number(form, 'vehicleValue', 8000000);
      var cover = field(form, 'cover', 'comprehensive');
      var baseRate = cover === 'comprehensive' ? 0.045 : 0.012;
      text = 'Estimate: annual ' + cover + ' premium envelope is ' + money(value * baseRate, field(form, 'currency', 'NGN')) + '. Compare excess, theft cover, flood cover, approved repair network, and claim turnaround before paying.';
    } else if (tool === 'motor-third-party') {
      var vehicleType = field(form, 'vehicleType', 'private car');
      text = 'Result: ' + vehicleType + ' third-party checklist ready. Confirm the statutory premium, policy certificate, passenger limit, and cross-border validity with the licensed insurer or regulator before road use.';
    } else if (tool === 'ramadan-timetable') {
      var start = field(form, 'startDate', '2026-02-18');
      var city = field(form, 'city', 'Lagos');
      var days = number(form, 'days', 30);
      var buffer = number(form, 'suhoorBuffer', 10);
      text = 'Result: ' + city + ' Ramadan plan starts from ' + start + ' for ' + days + ' days with a ' + buffer + '-minute suhoor buffer. Confirm moon sighting and mosque times before publishing.';
    } else if (tool === 'electricity-tariff') {
      var monthlyKwh = number(form, 'monthlyKwh', 180);
      var tariff = number(form, 'tariff', 85);
      var fixed = number(form, 'fixedCharge', 1500);
      var bill = monthlyKwh * tariff + fixed;
      text = 'Estimate: monthly electricity bill is ' + money(bill, field(form, 'currency', 'NGN')) + '. Methodology: kWh used x tariff plus fixed charge. Confirm bands, VAT, service charge, and disco or utility tariff before payment.';
    } else if (tool === 'prepaid-meter') {
      var spend = number(form, 'spend', 10000);
      var unitTariff = number(form, 'tariff', 85);
      var deductions = number(form, 'deductions', 8);
      var units = unitTariff > 0 ? spend * (1 - deductions / 100) / unitTariff : 0;
      text = 'Result: prepaid purchase may deliver about ' + units.toFixed(1) + ' kWh after ' + pct(deductions) + ' charges. Check arrears, debt recovery, VAT, fixed charges, and tariff band on the receipt.';
    } else if (tool === 'business-insurance') {
      var stock = number(form, 'stockValue', 3000000);
      var equipment = number(form, 'equipmentValue', 2500000);
      var liability = number(form, 'liabilityLimit', 5000000);
      var exposure = stock + equipment + liability * 0.25;
      text = 'Estimate: cover need starts around ' + money(exposure, field(form, 'currency', 'NGN')) + '. Build the quote pack from stock, equipment, liability exposure, business interruption, goods in transit, and claim evidence.';
    } else if (tool === 'prayer-times') {
      var prayerCity = field(form, 'city', 'Lagos');
      var method = field(form, 'method', 'MWL');
      var school = field(form, 'school', 'standard');
      text = 'Result: prayer planning profile set for ' + prayerCity + ' using ' + method + ' and ' + school + ' Asr. Compare with the nearest mosque timetable before using it for public reminders.';
    } else if (tool === 'traditional-calendar') {
      var localDate = new Date(field(form, 'date', '2026-06-17'));
      var marketDay = ['Eke', 'Orie', 'Afo', 'Nkwo'][Math.abs(Math.floor(localDate.getTime() / 86400000)) % 4];
      text = 'Estimate: Igbo market-day reference is ' + marketDay + ' for ' + localDate.toDateString() + '. Traditional calendars can differ by town, so confirm locally before publishing.';
    } else if (tool === 'freelancer-rate') {
      var targetIncome = number(form, 'monthlyIncome', 800000);
      var billableDays = Math.max(1, number(form, 'billableDays', 14));
      var margin = number(form, 'taxBuffer', 25);
      var dayRate = targetIncome * (1 + margin / 100) / billableDays;
      text = 'Result: day rate target is ' + money(dayRate, field(form, 'currency', 'NGN')) + '. Methodology: monthly income goal plus tax/admin buffer divided by realistic billable days.';
    } else if (tool === 'gratuity-calculator') {
      var monthlyPay = number(form, 'monthlyPay', 300000);
      var yearsWorked = number(form, 'yearsWorked', 5);
      var daysPerYear = number(form, 'daysPerYear', 21);
      var gratuity = monthlyPay / 30 * daysPerYear * yearsWorked;
      text = 'Estimate: gratuity or severance envelope is ' + money(gratuity, field(form, 'currency', 'NGN')) + '. Confirm statutory formula, contract terms, tax treatment, and final payroll deductions locally.';
    } else if (tool === 'telecom-sim-reg') {
      var simCountry = field(form, 'country', 'Nigeria');
      var idType = field(form, 'idType', 'national ID');
      var channel = field(form, 'channel', 'operator store');
      text = 'Result: ' + simCountry + ' registration checklist prepared with ' + idType + ' via ' + channel + '. Bring ID, SIM card, proof of address where required, and keep the confirmation SMS.';
    } else if (tool === 'hajj-budget') {
      var travellers = Math.max(1, number(form, 'travellers', 1));
      var packageCost = number(form, 'packageCost', 6200);
      var cash = number(form, 'cashBudget', 800);
      var hajjBuffer = number(form, 'buffer', 12);
      var hajjTotal = (packageCost + cash) * travellers * (1 + hajjBuffer / 100);
      text = 'Estimate: pilgrimage savings target is ' + money(hajjTotal, 'USD') + '. Confirm official operator package, visa rules, exchange rate, vaccine needs, and payment deadline before deposit.';
    } else if (tool === 'career-growth') {
      var currentPay = number(form, 'currentPay', 350000);
      var targetPay = number(form, 'targetPay', 600000);
      var months = Math.max(1, number(form, 'months', 12));
      var gap = targetPay - currentPay;
      text = 'Result: growth gap is ' + money(gap, field(form, 'currency', 'NGN')) + ' over ' + months + ' months. Build a plan around one role target, skill proof, portfolio evidence, applications, and salary negotiation dates.';
    } else if (tool === 'crop-insurance') {
      var agValue = number(form, 'farmValue', 750000);
      var agRate = number(form, 'premiumRate', 5);
      var excess = number(form, 'excess', 10);
      var agPremium = agValue * agRate / 100;
      text = 'Estimate: crop premium is ' + money(agPremium, field(form, 'currency', 'NGN')) + ' with a possible ' + pct(excess) + ' excess. Check perils, trigger data, waiting period, and claim evidence before enrollment.';
    } else if (tool === 'gym-roi-business') {
      var members = number(form, 'members', 120);
      var fee = number(form, 'fee', 15000);
      var opex = number(form, 'opex', 900000);
      var setup = number(form, 'setup', 12000000);
      var monthlyProfit = members * fee - opex;
      var payback = monthlyProfit > 0 ? setup / monthlyProfit : 0;
      text = 'Estimate: monthly operating profit is ' + money(monthlyProfit, field(form, 'currency', 'NGN')) + '; setup payback is ' + (payback ? payback.toFixed(1) + ' months' : 'not reached yet') + '.';
    } else if (tool === 'athlete-earnings') {
      var salary = number(form, 'salary', 1200000);
      var bonuses = number(form, 'bonuses', 300000);
      var yearsActive = number(form, 'years', 6);
      var agentFee = number(form, 'agentFee', 10);
      var netCareer = (salary + bonuses) * yearsActive * (1 - agentFee / 100);
      text = 'Estimate: career gross after agent fee is ' + money(netCareer, field(form, 'currency', 'NGN')) + '. Plan for injuries, off-season income, taxes, savings, and post-career skills.';
    } else if (tool === 'contractor-vs-employee') {
      var basePay = number(form, 'basePay', 500000);
      var benefits = number(form, 'benefits', 18);
      var contractorMarkup = number(form, 'contractorMarkup', 35);
      var employeeCost = basePay * (1 + benefits / 100);
      var contractorCost = basePay * (1 + contractorMarkup / 100);
      text = 'Result: employee monthly cost is ' + money(employeeCost, field(form, 'currency', 'NGN')) + '; contractor equivalent is ' + money(contractorCost, field(form, 'currency', 'NGN')) + '. Check labour classification risk before choosing.';
    } else if (tool === 'retrenchment-calculator') {
      var retrenchPay = number(form, 'monthlyPay', 400000);
      var retrenchYears = number(form, 'yearsWorked', 4);
      var noticeMonths = number(form, 'noticeMonths', 1);
      var packageValue = retrenchPay / 30 * 21 * retrenchYears + retrenchPay * noticeMonths;
      text = 'Estimate: retrenchment package envelope is ' + money(packageValue, field(form, 'currency', 'NGN')) + '. Confirm statutory minimums, consultation process, leave pay, notice, tax, and contract terms.';
    } else if (tool === 'gov-scholarship') {
      var deadlineDays = number(form, 'deadlineDays', 30);
      var documents = number(form, 'documentsReady', 5);
      var readiness = Math.min(100, Math.max(0, documents * 12 + (deadlineDays >= 21 ? 25 : 10)));
      text = 'Result: scholarship readiness score is ' + Math.round(readiness) + '/100. Prioritize transcript, ID/passport, recommendation letters, essay, proof of admission, and deadline confirmation.';
    } else if (tool === 'livestock-feed-calculator') {
      var animals = number(form, 'animals', 25);
      var kgPerDay = number(form, 'kgPerDay', 2.5);
      var feedPrice = number(form, 'feedPrice', 420);
      var feedDays = number(form, 'days', 30);
      text = 'Estimate: feed budget is ' + money(animals * kgPerDay * feedPrice * feedDays, field(form, 'currency', 'NGN')) + ' for ' + animals + ' animals over ' + feedDays + ' days. Adjust for breed, age, grazing, and veterinary guidance.';
    } else if (tool === 'streaming-royalties') {
      var streams = number(form, 'streams', 100000);
      var rate = number(form, 'ratePerThousand', 3);
      var distributor = number(form, 'distributorFee', 15);
      var royalties = streams / 1000 * rate * (1 - distributor / 100);
      text = 'Estimate: net royalty is ' + money(royalties, 'USD') + ' after distributor fee. Platform rates vary by country, subscription type, rights split, and reporting delay.';
    } else if (tool === 'gaming-pc-build') {
      var gpu = number(form, 'gpu', 450000);
      var cpu = number(form, 'cpu', 220000);
      var otherParts = number(form, 'otherParts', 380000);
      var buildBuffer = number(form, 'buffer', 10);
      text = 'Estimate: PC build budget is ' + money((gpu + cpu + otherParts) * (1 + buildBuffer / 100), field(form, 'currency', 'NGN')) + '. Check power supply headroom, import duty, warranty, and local repair access.';
    } else if (tool === 'concert-budget') {
      var tickets = number(form, 'tickets', 800);
      var price = number(form, 'ticketPrice', 5000);
      var sponsors = number(form, 'sponsors', 1000000);
      var eventCost = number(form, 'eventCost', 3500000);
      var eventProfit = tickets * price + sponsors - eventCost;
      text = 'Estimate: event profit is ' + money(eventProfit, field(form, 'currency', 'NGN')) + '. Stress test attendance, artist deposit, security, venue, ticket fees, refunds, and rain plan.';
    } else if (tool === 'photo-video-pricing') {
      var shootHours = number(form, 'shootHours', 6);
      var hourlyRate = number(form, 'hourlyRate', 25000);
      var editDays = number(form, 'editDays', 2);
      var editRate = number(form, 'editRate', 80000);
      text = 'Quote: project fee is ' + money(shootHours * hourlyRate + editDays * editRate, field(form, 'currency', 'NGN')) + '. Add travel, assistant, equipment rental, rush delivery, and usage rights where needed.';
    } else if (tool === 'betting-odds') {
      var odds = number(form, 'odds', 2.2);
      var stake = number(form, 'stake', 5000);
      var probability = number(form, 'probability', 48);
      var implied = odds > 0 ? 100 / odds : 0;
      var edge = probability - implied;
      text = 'Result: implied probability is ' + pct(implied) + ' and your stated edge is ' + pct(edge) + '. Potential profit is ' + money(stake * (odds - 1), field(form, 'currency', 'NGN')) + '. Gamble responsibly; this does not predict outcomes.';
    } else if (tool === 'creator-analytics') {
      var views = number(form, 'views', 50000);
      var saves = number(form, 'saves', 1200);
      var clicks = number(form, 'clicks', 900);
      var engagement = views > 0 ? (saves + clicks) / views * 100 : 0;
      text = 'Result: action engagement is ' + pct(engagement) + '. Compare saves, clicks, watch time, posting time, and audience source before changing content strategy.';
    } else if (tool === 'creator-page') {
      var visits = number(form, 'visits', 2000);
      var linkClicks = number(form, 'linkClicks', 220);
      var offers = number(form, 'offers', 3);
      var clickRate = visits > 0 ? linkClicks / visits * 100 : 0;
      text = 'Result: creator page click rate is ' + pct(clickRate) + ' with ' + offers + ' priority offers. Put booking, portfolio, shop, newsletter, and contact links above low-value links.';
    } else if (tool === 'creator-polish') {
      var words = number(form, 'words', 450);
      var tone = field(form, 'tone', 'professional');
      var editMinutes = Math.max(8, Math.round(words / 70));
      text = 'Result: ' + words + ' words need about ' + editMinutes + ' minutes for a ' + tone + ' polish pass. Check clarity, local idioms, grammar, CTA, and unsupported claims.';
    }

    if (!text) {
      var values = Array.prototype.map.call(form.elements, function (element) {
        if (!element.name || element.type === 'submit' || element.type === 'button') return '';
        return element.getAttribute('aria-label') + ': ' + element.value;
      }).filter(Boolean).join('; ');
      var base = out.getAttribute('data-df-base') || out.textContent.trim() || 'Result: local planning summary ready.';
      text = base + (values ? ' Inputs reviewed: ' + values + '.' : '');
    }

    out.textContent = text;
  }

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-df-form]');
    if (!form) return;
    event.preventDefault();
    update(form);
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-df-copy]');
    if (!button) return;
    var tool = button.getAttribute('data-df-copy');
    var out = document.querySelector('[data-df-result="' + tool + '"]');
    var text = out ? out.textContent.trim() : '';
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        button.textContent = 'Copied';
        window.setTimeout(function () { button.textContent = 'Copy summary'; }, 1200);
      });
    } else {
      window.prompt('Copy summary', text);
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-df-form]'), update);
}());
