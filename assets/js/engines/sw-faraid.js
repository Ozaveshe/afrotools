(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SwFaraidEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "EGP", "USD", "GBP"];
  var SPOUSES = ["wife", "husband", "none"];
  var COUNT_FIELDS = ["sons", "daughters", "brothers", "sisters"];

  function finiteNumber(value) {
    if (value === "" || value === null || typeof value === "undefined") return NaN;
    return Number(value);
  }

  function validate(input) {
    var errors = {};
    var values = {};
    ["estate", "debts", "funeral", "bequest"].forEach(function (key) {
      var value = finiteNumber(input[key]);
      if (!Number.isFinite(value) || value < 0) errors[key] = "Weka namba iliyo sifuri au zaidi.";
      else values[key] = value;
    });
    COUNT_FIELDS.forEach(function (key) {
      var value = finiteNumber(input[key]);
      if (!Number.isInteger(value) || value < 0 || value > 100) errors[key] = "Weka idadi kamili kati ya 0 na 100.";
      else values[key] = value;
    });
    var wives = finiteNumber(input.wives);
    if (!Number.isInteger(wives) || wives < 1 || wives > 4) errors.wives = "Weka idadi ya wake kati ya 1 na 4.";
    else values.wives = wives;
    values.currency = CURRENCIES.indexOf(input.currency) >= 0 ? input.currency : "";
    if (!values.currency) errors.currency = "Chagua sarafu inayotumika.";
    values.spouse = SPOUSES.indexOf(input.spouse) >= 0 ? input.spouse : "";
    if (!values.spouse) errors.spouse = "Chagua hali ya mwenzi aliyebaki.";
    values.father = Boolean(input.father);
    values.mother = Boolean(input.mother);
    values.limitedCase = Boolean(input.limitedCase);
    return { ok: Object.keys(errors).length === 0, errors: errors, values: values };
  }

  function addShare(rows, key, label, count, share, basis) {
    if (!count || share <= 0) return;
    rows.push({ key: key, label: label, count: count, share: share, perShare: share / count, basis: basis });
  }

  function calculate(rawInput) {
    var checked = validate(rawInput || {});
    if (!checked.ok) return { ok: false, errors: checked.errors };
    var input = checked.values;
    var distributableBeforeBequest = Math.max(0, input.estate - input.debts - input.funeral);
    var bequestCap = distributableBeforeBequest / 3;
    var bequestUsed = Math.min(input.bequest, bequestCap);
    var netEstate = Math.max(0, distributableBeforeBequest - bequestUsed);
    var wives = Math.min(4, Math.max(1, input.wives || 1));
    var hasChildren = input.sons + input.daughters > 0;
    var siblingCount = input.brothers + input.sisters;
    var rows = [];
    var warnings = [];
    var nextSteps = [
      "Kusanya cheti cha kifo, ushahidi wa ndoa na kuzaliwa, orodha ya mali, ushahidi wa madeni, gharama za mazishi na wasia wowote.",
      "Mwombe msomi mwenye sifa ahakiki warithi, warithi waliozuiwa, awl, radd, uhalali wa wasia na tofauti za madhehebu.",
      "Mwombe mwanasheria, msimamizi wa mirathi au afisa wa mahakama ahakiki probate, mali ya ndoa, kodi, hati na sheria za eneo.",
      "Usigawanye mali hadi warithi wote, madeni na madai ya kisheria yathibitishwe kwa maandishi."
    ];
    var fixedTotal = 0;
    var residueReceivers = [];
    var umariyyat = input.spouse !== "none" && input.father && input.mother && !hasChildren && siblingCount === 0;

    if (input.bequest > bequestCap + 0.01) warnings.push("Wasia umepunguzwa hadi theluthi moja baada ya madeni na gharama. Ziada inahitaji mapitio na ridhaa ya warithi.");
    if (input.debts + input.funeral > input.estate) warnings.push("Madeni na gharama za mazishi au mirathi zinazidi mali ghafi; hakuna urithi wa kugawanya unaoonyeshwa.");

    if (input.spouse === "husband") {
      var husbandShare = hasChildren ? 1 / 4 : 1 / 2;
      addShare(rows, "husband", "Mume", 1, husbandShare, hasChildren ? "Fungu la 1/4 kwa sababu kuna watoto au vizazi" : "Fungu la 1/2 kwa sababu hakuna watoto au vizazi vilivyoingizwa");
      fixedTotal += husbandShare;
    } else if (input.spouse === "wife") {
      var wifeTotal = hasChildren ? 1 / 8 : 1 / 4;
      addShare(rows, "wives", wives === 1 ? "Mke" : "Wake", wives, wifeTotal, hasChildren ? "Fungu la 1/8 linagawanywa na mke au wake kwa sababu kuna watoto au vizazi" : "Fungu la 1/4 linagawanywa na mke au wake kwa sababu hakuna watoto au vizazi vilivyoingizwa");
      fixedTotal += wifeTotal;
    }

    if (input.mother) {
      if (umariyyat) rows.push({ key: "mother-remainder", label: "Mama", count: 1, share: 0, perShare: 0, basis: "Hali ya Umariyyat: theluthi moja ya salio baada ya fungu la mwenzi" });
      else {
        var motherShare = hasChildren || siblingCount >= 2 ? 1 / 6 : 1 / 3;
        addShare(rows, "mother", "Mama", 1, motherShare, motherShare === 1 / 6 ? "Fungu la 1/6 kwa sababu kuna watoto/vizazi au ndugu wawili au zaidi" : "Fungu la 1/3 kwa sababu hakuna watoto/vizazi na kuna ndugu chini ya wawili");
        fixedTotal += motherShare;
      }
    }

    if (input.father && hasChildren) {
      addShare(rows, "father-fixed", "Baba", 1, 1 / 6, "Fungu la 1/6 kwa sababu kuna watoto au vizazi");
      fixedTotal += 1 / 6;
      if (input.sons === 0 && input.daughters > 0) residueReceivers.push({ key: "father-residue", label: "Salio la baba", count: 1, unitWeight: 1, basis: "Salio baada ya mafungu kwa sababu kuna mabinti bila wana" });
    } else if (input.father && !hasChildren) residueReceivers.push({ key: "father-residue", label: "Baba", count: 1, unitWeight: 1, basis: "Salio baada ya mafungu kwa sababu hakuna watoto au vizazi vilivyoingizwa" });

    if (input.sons > 0) {
      residueReceivers.push({ key: "sons", label: "Mwana", count: input.sons, unitWeight: 2, basis: "Salio hugawanywa kwa uwiano wa 2:1 kati ya wana na mabinti" });
      if (input.daughters > 0) residueReceivers.push({ key: "daughters-residue", label: "Binti", count: input.daughters, unitWeight: 1, basis: "Salio hugawanywa kwa uwiano wa 2:1 kati ya wana na mabinti" });
    } else if (input.daughters === 1) {
      addShare(rows, "daughter-fixed", "Binti", 1, 1 / 2, "Fungu la 1/2 kwa sababu kuna binti mmoja na hakuna mwana");
      fixedTotal += 1 / 2;
    } else if (input.daughters > 1) {
      addShare(rows, "daughters-fixed", "Mabinti", input.daughters, 2 / 3, "Fungu la 2/3 linagawanywa na mabinti kwa sababu hakuna mwana");
      fixedTotal += 2 / 3;
    }

    if (siblingCount > 0 && (input.father || hasChildren)) warnings.push("Ndugu kamili wamezuiwa katika modeli hii kwa sababu baba au watoto/vizazi wameingizwa.");
    else if (siblingCount > 0) {
      if (input.brothers > 0) {
        residueReceivers.push({ key: "brothers", label: "Kaka kamili", count: input.brothers, unitWeight: 2, basis: "Salio hugawanywa kwa uwiano wa 2:1 kati ya kaka na dada kamili" });
        if (input.sisters > 0) residueReceivers.push({ key: "sisters-residue", label: "Dada kamili", count: input.sisters, unitWeight: 1, basis: "Salio hugawanywa kwa uwiano wa 2:1 kati ya kaka na dada kamili" });
      } else if (input.sisters === 1) {
        addShare(rows, "sister-fixed", "Dada kamili", 1, 1 / 2, "Fungu la 1/2 kwa sababu hakuna baba, watoto/vizazi au kaka kamili");
        fixedTotal += 1 / 2;
      } else if (input.sisters > 1) {
        addShare(rows, "sisters-fixed", "Dada kamili", input.sisters, 2 / 3, "Fungu la 2/3 linagawanywa na dada kamili kwa sababu hakuna baba, watoto/vizazi au kaka kamili");
        fixedTotal += 2 / 3;
      }
    }

    if (!input.limitedCase) warnings.push("Uthibitisho wa kuelewa mipaka ya modeli haujachaguliwa. Chukulia matokeo haya kama rasimu pekee.");
    var scaling = fixedTotal > 1 ? 1 / fixedTotal : 1;
    if (fixedTotal > 1) warnings.push("Mafungu yaliyowekwa yanazidi mali. Modeli imepunguza mafungu kwa uwiano kama onyo la awl; lazima hali hii ihakikiwe.");
    rows.forEach(function (row) { if (row.key !== "mother-remainder") { row.share *= scaling; row.perShare = row.share / row.count; } });
    var allocatedFixed = rows.reduce(function (sum, row) { return sum + (row.key === "mother-remainder" ? 0 : row.share); }, 0);

    if (umariyyat) {
      var remainderAfterSpouse = Math.max(0, 1 - allocatedFixed);
      var motherRemainderShare = remainderAfterSpouse / 3;
      var fatherRemainderShare = remainderAfterSpouse - motherRemainderShare;
      rows = rows.filter(function (row) { return row.key !== "mother-remainder" && row.key !== "father-residue"; });
      rows.push({ key: "mother-umariyyat", label: "Mama", count: 1, share: motherRemainderShare, perShare: motherRemainderShare, basis: "Theluthi moja ya salio baada ya mwenzi katika hali ya mwenzi pamoja na wazazi" });
      rows.push({ key: "father-umariyyat", label: "Baba", count: 1, share: fatherRemainderShare, perShare: fatherRemainderShare, basis: "Salio baada ya mwenzi na mama katika hali ya mwenzi pamoja na wazazi" });
      allocatedFixed = rows.reduce(function (sum, row) { return sum + row.share; }, 0);
      residueReceivers = [];
      warnings.push("Hali hii ya mwenzi pamoja na wazazi imetumia njia ya kawaida ya salio ya Umariyyat. Thibitisha madhehebu na desturi ya eneo.");
    }

    var residue = Math.max(0, 1 - allocatedFixed);
    if (residueReceivers.length && residue > 0 && fixedTotal <= 1) {
      var totalResidueWeight = residueReceivers.reduce(function (sum, item) { return sum + item.unitWeight * item.count; }, 0);
      residueReceivers.forEach(function (item) { addShare(rows, item.key, item.label, item.count, totalResidueWeight ? residue * (item.unitWeight * item.count / totalResidueWeight) : 0, item.basis); });
      allocatedFixed = rows.reduce(function (sum, row) { return sum + row.share; }, 0);
      residue = Math.max(0, 1 - allocatedFixed);
    } else if (residueReceivers.length && fixedTotal > 1) warnings.push("Warithi wa salio wameingizwa lakini mafungu tayari yanazidi mali. Mapitio ya msomi yanahitajika.");
    if (residue > 0.0001) warnings.push("Kuna salio ambalo halijagawanywa katika modeli hii. Radd au mrithi mwingine wa salio anaweza kuhusika.");
    if (!input.father && !input.mother && input.spouse === "none" && input.sons + input.daughters + input.brothers + input.sisters === 0) warnings.push("Hakuna mrithi wa modeli aliyeingizwa. Ongeza warithi au wasiliana na mamlaka husika kuhusu jamaa wengine.");
    warnings.push("Haijajumuishwa: babu na nyanya, wajukuu kupitia watoto waliokufa, ndugu wa upande mmoja, watoto wa kuasili, warithi waliopotea na kanuni za probate za eneo.");
    var allocatedAmount = netEstate * rows.reduce(function (sum, row) { return sum + row.share; }, 0);
    return {
      ok: true,
      input: input,
      distributableBeforeBequest: distributableBeforeBequest,
      bequestCap: bequestCap,
      bequestUsed: bequestUsed,
      netEstate: netEstate,
      rows: rows,
      warnings: warnings,
      nextSteps: nextSteps,
      allocatedAmount: allocatedAmount,
      unallocatedAmount: Math.max(0, netEstate - allocatedAmount),
      reviewFlag: warnings.length > 1 || residue > 0.0001 || fixedTotal > 1 ? "Mapitio yanahitajika" : "Hali rahisi"
    };
  }

  return { validate: validate, calculate: calculate, currencies: CURRENCIES.slice() };
});
