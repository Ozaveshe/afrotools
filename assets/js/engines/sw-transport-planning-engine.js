(function initSwTransportPlanningEngine(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SwTransportPlanningEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createEngine() {
  'use strict';

  function number(input, key) {
    var value = Number(input && input[key]);
    return Number.isFinite(value) ? value : NaN;
  }

  function validRange(value, minimum, maximum) {
    return Number.isFinite(value) && value >= minimum && (maximum === undefined || value <= maximum);
  }

  function refuse(message) {
    return { ok: false, error: message || 'Kagua taarifa ulizoingiza.' };
  }

  function accept(primary, sub, metrics, note) {
    return { ok: true, primary: primary, sub: sub, metrics: metrics, note: note };
  }

  function money(label, value) { return { label: label, type: 'money', value: value }; }
  function percent(label, value) { return { label: label, type: 'percent', value: value }; }
  function text(label, value) { return { label: label, type: 'text', value: String(value) }; }

  function payment(principal, annualRate, months) {
    var monthlyRate = annualRate / 100 / 12;
    if (!monthlyRate) return principal / months;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  function calculate(kind, input, checklist) {
    input = input || {};
    checklist = checklist || { yes: 0, total: 0 };
    var total;

    if (kind === 'rideFare') {
      var base = number(input, 'base');
      var distance = number(input, 'distance');
      var perKm = number(input, 'perKm');
      var minutes = number(input, 'minutes');
      var perMin = number(input, 'perMin');
      var booking = number(input, 'booking');
      var surge = number(input, 'surge');
      if (!validRange(base, 0) || !validRange(distance, 0.01) || !validRange(perKm, 0) ||
          !validRange(minutes, 0) || !validRange(perMin, 0) || !validRange(booking, 0) ||
          !validRange(surge, 0.01, 20)) return refuse('Kagua umbali, muda, viwango na ongezeko la bei.');
      total = (base + distance * perKm + minutes * perMin + booking) * surge;
      return accept({ type: 'money', value: total }, 'Nauli ya teksi ya programu ya makadirio', [
        text('Umbali', distance.toFixed(1) + ' km'), text('Muda', minutes.toFixed(0) + ' dk'),
        text('Ongezeko la bei', surge.toFixed(2) + 'x'), money('Ada ya kuweka safari', booking)
      ], 'Nauli ya programu hubadilika kwa uhitaji, msongamano, ada za barabara na ofa.');
    }

    if (kind === 'bodaIncome') {
      var trips = number(input, 'trips');
      var fare = number(input, 'nauli');
      var fuel = number(input, 'mafuta');
      var maintenance = number(input, 'maintenance');
      var owner = number(input, 'owner');
      var days = number(input, 'days');
      if (!validRange(trips, 0.01) || !validRange(fare, 0.01) || !validRange(fuel, 0) ||
          !validRange(maintenance, 0) || !validRange(owner, 0) || !validRange(days, 1, 31)) {
        return refuse('Kagua safari, nauli, gharama na siku za kazi.');
      }
      var revenue = trips * fare;
      var cost = fuel + maintenance + owner;
      var profit = revenue - cost;
      return accept({ type: 'money', value: profit }, 'Mapato halisi kwa siku', [
        money('Mapato kwa siku', revenue), money('Gharama kwa siku', cost),
        money('Kwa wiki (siku 6)', profit * 6), money('Kwa mwezi', profit * days)
      ], 'Mapato hutegemea njia, msimu, utekelezaji wa sheria, mafuta na matengenezo.');
    }

    if (kind === 'matatuFare') {
      base = number(input, 'base'); distance = number(input, 'distance'); perKm = number(input, 'perKm');
      var peak = number(input, 'peak'); var transfers = number(input, 'transfers'); days = number(input, 'days');
      if (!validRange(base, 0) || !validRange(distance, 0.01) || !validRange(perKm, 0) ||
          !validRange(peak, 0, 500) || !validRange(transfers, 0, 20) || !validRange(days, 1, 31)) {
        return refuse('Kagua nauli, umbali, nyongeza ya saa za foleni na siku.');
      }
      var single = (base + distance * perKm) * (1 + peak / 100) + transfers * base;
      total = single * 2 * days;
      return accept({ type: 'money', value: total }, 'Makadirio ya nauli ya mwezi', [
        money('Safari moja', single), text('Njia', input.mode || 'Haijabainishwa'),
        text('Siku za kwenda na kurudi', days.toFixed(0)), percent('Ongezeko la saa za foleni', peak)
      ], 'Nauli halisi hutegemea mtoa huduma, msongamano, msimu na njia.');
    }

    if (kind === 'deliveryCost') {
      base = number(input, 'base'); distance = number(input, 'distance'); perKm = number(input, 'perKm');
      var waiting = number(input, 'waiting'); var platform = number(input, 'platform'); var margin = number(input, 'margin');
      if (!validRange(base, 0) || !validRange(distance, 0.01) || !validRange(perKm, 0) ||
          !validRange(waiting, 0) || !validRange(platform, 0, 100) || !validRange(margin, 0, 500)) {
        return refuse('Kagua umbali, kiwango kwa kilomita, ada na faida lengwa.');
      }
      var directCost = base + distance * perKm + waiting;
      var commission = directCost * platform / 100;
      total = (directCost + commission) * (1 + margin / 100);
      return accept({ type: 'money', value: total }, 'Bei ya ufikishaji ya makadirio', [
        text('Chombo', input.vehicle || 'Haijabainishwa'), money('Gharama kabla ya faida', directCost + commission),
        money('Ada ya jukwaa', commission), percent('Faida lengwa', margin)
      ], 'Nukuu ya ufikishaji hutegemea eneo, msongamano, kifurushi na mtoa huduma.');
    }

    if (kind === 'loanVsCash') {
      var price = number(input, 'price'); var deposit = number(input, 'deposit'); var fees = number(input, 'fees');
      var rate = number(input, 'rate'); var months = number(input, 'months'); var cashReturn = number(input, 'cashReturn');
      if (!validRange(price, 0.01) || !validRange(deposit, 0, price) || !validRange(fees, 0) ||
          !validRange(rate, 0, 200) || !validRange(months, 1, 600) || !validRange(cashReturn, 0, 200)) {
        return refuse('Kagua bei, amana, riba, muda na faida mbadala.');
      }
      var principal = Math.max(0, price - deposit + fees);
      var monthly = payment(principal, rate, months);
      var loanTotal = monthly * months + deposit;
      var opportunity = (price - deposit) * cashReturn / 100 * (months / 12);
      return accept({ type: 'money', value: loanTotal - price - opportunity }, 'Gharama ya mkopo dhidi ya pesa taslimu', [
        money('Jumla ya mkopo', loanTotal), money('Riba na ada', loanTotal - price),
        money('Faida mbadala', opportunity), money('Malipo ya mwezi', monthly)
      ], 'Uamuzi hutegemea ukwasi, riba na matumizi mbadala ya pesa. Hii si ofa ya benki.');
    }

    if (kind === 'vehicleRegistration') {
      var baseFee = number(input, 'baseFee'); var roadTax = number(input, 'roadTax');
      var inspection = number(input, 'inspection'); var plates = number(input, 'plates'); var late = number(input, 'late');
      if (![baseFee, roadTax, inspection, plates, late].every(function (value) { return validRange(value, 0); }) ||
          (baseFee + roadTax + inspection + plates + late <= 0 && checklist.yes === 0)) {
        return refuse('Weka angalau ada moja au kamilisha sehemu ya orodha ya ukaguzi.');
      }
      total = baseFee + roadTax + inspection + plates + late;
      return accept({ type: 'money', value: total }, 'Makadirio ya usajili au upyaishaji', [
        text('Orodha ya ukaguzi', checklist.yes + '/' + checklist.total), money('Kodi au tozo ya barabara', roadTax),
        money('Ukaguzi', inspection), money('Adhabu ya kuchelewa', late)
      ], 'Mamlaka ya usajili ndiyo huamua nyaraka, tarehe na ada rasmi.');
    }

    if (kind === 'roadworthiness') {
      var inspectionFee = number(input, 'inspectionFee'); var repairBuffer = number(input, 'repairBuffer');
      if (!validRange(inspectionFee, 0) || !validRange(repairBuffer, 0) || checklist.total < 1 ||
          (inspectionFee + repairBuffer <= 0 && checklist.yes === 0)) {
        return refuse('Kagua ada, akiba ya matengenezo na orodha ya ukaguzi.');
      }
      var readiness = checklist.yes / checklist.total * 100;
      return accept({ type: 'percent', value: readiness }, 'Utayari wa ukaguzi wa ubora wa gari barabarani', [
        text('Vipengele vilivyokamilika', checklist.yes + '/' + checklist.total), money('Ada ya ukaguzi', inspectionFee),
        money('Akiba ya matengenezo', repairBuffer), money('Jumla ya kupanga', inspectionFee + repairBuffer)
      ], 'Orodha hii si cheti. Ukaguzi rasmi lazima ufanywe na kituo kilichoidhinishwa.');
    }

    if (kind === 'vehicleDepreciation') {
      var purchase = number(input, 'purchase'); var annualRate = number(input, 'annualRate');
      var years = number(input, 'years'); var mileageAdj = number(input, 'mileageAdj'); var age = number(input, 'age');
      if (!validRange(purchase, 0.01) || !validRange(annualRate, 0, 100) || !validRange(years, 0.01, 100) ||
          !validRange(mileageAdj, 0, 100) || !validRange(age, 0, 150)) return refuse('Kagua bei, umri, muda na viwango vya kushuka thamani.');
      var value = purchase * Math.pow(1 - annualRate / 100, years) * (1 - mileageAdj / 100);
      return accept({ type: 'money', value: value }, 'Thamani ya makadirio baada ya muda', [
        money('Hasara ya thamani', purchase - value), percent('Kiwango cha mwaka', annualRate),
        percent('Marekebisho ya kilomita', mileageAdj), text('Umri mwisho', (age + years).toFixed(1) + ' miaka')
      ], 'Bei za soko, kilomita na hali ya gari zinaweza kubadilisha thamani.');
    }

    if (kind === 'lastMileDelivery') {
      var packages = number(input, 'packages'); var failed = number(input, 'failed');
      var fuelDay = number(input, 'fuelDay'); var wagesDay = number(input, 'wagesDay');
      var overheadDay = number(input, 'overheadDay'); var targetProfit = number(input, 'targetFaida'); var riders = number(input, 'riders');
      if (!validRange(packages, 1) || !validRange(failed, 0, 99.99) || !validRange(fuelDay, 0) ||
          !validRange(wagesDay, 0) || !validRange(overheadDay, 0) || !validRange(targetProfit, 0, 500) || !validRange(riders, 1)) {
        return refuse('Kagua vifurushi, asilimia iliyoshindikana, gharama, faida na wahudumu.');
      }
      var delivered = packages * (1 - failed / 100);
      var dayCost = fuelDay + wagesDay + overheadDay;
      var costPerPackage = dayCost / delivered;
      var targetPrice = costPerPackage * (1 + targetProfit / 100);
      return accept({ type: 'money', value: targetPrice }, 'Bei inayohitajika kwa kifurushi', [
        text('Vifurushi vilivyofikishwa', delivered.toFixed(0)), money('Gharama kwa kifurushi', costPerPackage),
        percent('Ufikishaji ulioshindikana', failed), text('Wahudumu au magari', riders.toFixed(0))
      ], 'Gharama hutegemea msongamano wa oda, ufikishaji ulioshindikana na trafiki.');
    }

    if (kind === 'parkingFee') {
      var hourly = number(input, 'hourly'); var hours = number(input, 'hours'); days = number(input, 'days');
      var monthlyPass = number(input, 'monthlyPass'); var penalties = number(input, 'penalties');
      if (!validRange(hourly, 0) || !validRange(hours, 0.01, 24) || !validRange(days, 1, 31) ||
          !validRange(monthlyPass, 0) || !validRange(penalties, 0) || (hourly === 0 && monthlyPass === 0)) {
        return refuse('Kagua kiwango cha saa au pasi ya mwezi, saa na siku.');
      }
      var daily = hourly * hours;
      var monthly = monthlyPass > 0 ? Math.min(daily * days, monthlyPass) : daily * days;
      total = monthly + penalties;
      return accept({ type: 'money', value: total }, 'Gharama ya maegesho kwa mwezi', [
        text('Eneo', input.zone || 'Haijabainishwa'), money('Gharama ya siku', daily),
        money('Pasi ya mwezi', monthlyPass), money('Makadirio ya mwaka', total * 12)
      ], 'Ada hutegemea jiji, mtoa huduma, saa na adhabu.');
    }

    if (kind === 'routeCost') {
      fuel = number(input, 'mafuta'); var driver = number(input, 'dereva'); var tolls = number(input, 'tolls');
      maintenance = number(input, 'maintenance'); distance = number(input, 'distance'); var loadTons = number(input, 'loadTons');
      if (![fuel, driver, tolls, maintenance].every(function (value) { return validRange(value, 0); }) ||
          !validRange(distance, 0.01) || !validRange(loadTons, 0.01) || fuel + driver + tolls + maintenance <= 0) {
        return refuse('Kagua gharama, umbali na uzito wa mzigo.');
      }
      var routeTotal = fuel + driver + tolls + maintenance;
      return accept({ type: 'money', value: routeTotal }, 'Gharama ya njia', [
        text('Njia', input.mode || 'Haijabainishwa'), money('Gharama kwa tani-km', routeTotal / (distance * loadTons)),
        text('Umbali', distance.toFixed(0) + ' km'), text('Mzigo', loadTons.toFixed(1) + ' tani')
      ], 'Mpaka, mafuta, ucheleweshaji na mzigo wa kurudi vinaweza kubadilisha gharama.');
    }

    if (kind === 'tollCalc') {
      tolls = number(input, 'tolls'); var feeEach = number(input, 'feeEach'); trips = number(input, 'trips');
      var returnTrip = number(input, 'returnTrip'); var tagDiscount = number(input, 'tagDiscount');
      if (!validRange(tolls, 1) || !validRange(feeEach, 0.01) || !validRange(trips, 1) ||
          !validRange(returnTrip, 1, 2) || !validRange(tagDiscount, 0, 100)) {
        return refuse('Kagua vituo, ada, safari, kwenda na kurudi na punguzo.');
      }
      var gross = tolls * feeEach * trips * returnTrip;
      total = gross * (1 - tagDiscount / 100);
      return accept({ type: 'money', value: total }, 'Ada za barabara za mwezi', [
        text('Aina ya chombo', input.vehicleClass || 'Haijabainishwa'), money('Kabla ya punguzo', gross),
        percent('Punguzo', tagDiscount), text('Safari', trips.toFixed(0))
      ], 'Viwango rasmi hutolewa na mwendeshaji wa barabara au mamlaka.');
    }

    if (kind === 'trackerRoi') {
      var install = number(input, 'install'); var subscription = number(input, 'subscription');
      var fuelSpend = number(input, 'fuelSpend'); var fuelSaving = number(input, 'fuelSaving');
      var insuranceDiscount = number(input, 'insurancePunguzo'); var lossAvoided = number(input, 'lossAvoided');
      if (![install, subscription, fuelSpend, insuranceDiscount, lossAvoided].every(function (value) { return validRange(value, 0); }) ||
          !validRange(fuelSaving, 0, 100) || install + subscription <= 0) return refuse('Kagua gharama ya kifuatiliaji na makadirio ya akiba.');
      var yearlyCost = install + subscription * 12;
      var savings = fuelSpend * 12 * fuelSaving / 100 + insuranceDiscount + lossAvoided;
      var net = savings - yearlyCost;
      return accept({ type: 'money', value: net }, 'Faida halisi ya mwaka wa kwanza', [
        money('Makadirio ya akiba', savings), money('Gharama ya kifuatiliaji', yearlyCost),
        percent('Akiba ya mafuta', fuelSaving), text('Miezi ya kurudisha gharama', savings > 0 ? (yearlyCost / (savings / 12)).toFixed(1) : 'Haijafikiwa')
      ], 'ROI hutegemea matumizi, hatari ya wizi, masharti ya bima na ubora wa mtoa huduma.');
    }

    return refuse('Aina hii ya hesabu haijatambuliwa.');
  }

  return Object.freeze({ calculate: calculate, payment: payment });
});
