(function initSwahiliFarmPayroll(root) {
  'use strict';

  var app = root.AfroTools = root.AfroTools || {};
  var config = root.__SW_AGRI_PAGE__ || {};
  var allData = app.FarmPayrollData;
  var engine = app.FarmPayrollEngine;
  var country = null;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function value(id) { return Number(byId(id).value); }
  function number(input, digits) {
    return new Intl.NumberFormat('sw', { maximumFractionDigits: digits == null ? 1 : digits }).format(Number(input) || 0);
  }
  function money(input) {
    try {
      return new Intl.NumberFormat('sw', {
        style: 'currency', currency: country.currency, maximumFractionDigits: 0
      }).format(Number(input) || 0);
    } catch (error) {
      return String(country.symbol || country.currency) + ' ' + number(input, 0);
    }
  }
  function csvCell(input) {
    var text = String(input == null ? '' : input);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function setStatus(message, error) {
    var node = byId('actionStatus');
    node.textContent = message || '';
    node.style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)';
  }
  function setActionsEnabled(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) {
      button.disabled = !enabled;
    });
  }
  function clearResult(options) {
    latest = null;
    if (root.__SW_AGRI_TEST__) root.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    setActionsEnabled(false);
    if (!options || !options.keepStatus) setStatus('');
  }
  function contributionName(input) {
    var name = String(input || '').replace(/^Employer\s+/i, '');
    var map = {
      'Annual Leave Provision': 'Akiba ya malipo ya likizo ya mwaka',
      'Contributory Pension': 'Pensheni ya michango',
      'Housing Levy': 'Tozo ya nyumba',
      'Social Insurance': 'Bima ya kijamii'
    };
    if (map[name]) return map[name];
    return name
      .replace(/\bHealth\b/g, 'Afya')
      .replace(/\bMedical\b/g, 'Matibabu')
      .replace(/\bPension\b/g, 'Pensheni')
      .replace(/\bRisk\b/g, 'Hatari')
      .replace(/\bMaladie\b/g, 'Afya')
      .replace(/\bRetraite\b/g, 'Pensheni');
  }
  function rows(result) {
    return result.deductions.map(function (item) {
      return { category: 'Kato la mfanyakazi', name: contributionName(item.name), ratePct: item.rate, amount: item.amount };
    }).concat(result.employerContributions.map(function (item) {
      return { category: 'Mchango wa mwajiri', name: contributionName(item.name), ratePct: null, amount: item.amount };
    }));
  }
  function syncType() {
    var type = byId('workerType').value;
    var daily = type === 'casual' || type === 'seasonal';
    var piece = type === 'piece_rate';
    byId('grossField').hidden = piece;
    byId('daysField').hidden = !daily;
    byId('rateField').hidden = !piece;
    byId('unitsField').hidden = !piece;
    byId('grossLabel').textContent = daily
      ? 'Malipo ya siku kwa mfanyakazi'
      : 'Mshahara ghafi wa mwezi kwa mfanyakazi';
  }
  function defaults() {
    var monthly = country.agriMinWage_monthly || country.nationalMinWage_monthly || country.typicalDailyRate.mid * 26;
    byId('workerType').value = 'permanent';
    byId('numWorkers').value = '1';
    byId('grossPay').value = String(monthly);
    byId('daysWorked').value = '26';
    byId('ratePerUnit').value = String(country.typicalDailyRate.mid / 5);
    byId('unitsCompleted').value = '80';
    byId('overtimeHours').value = '0';
    byId('inKindHousing').value = '0';
    byId('inKindFood').value = '0';
    syncType();
  }
  function inputObject() {
    return {
      workerType: byId('workerType').value,
      numWorkers: value('numWorkers'),
      grossPay: value('grossPay'),
      daysWorked: value('daysWorked'),
      ratePerUnit: value('ratePerUnit'),
      unitsCompleted: value('unitsCompleted'),
      overtimeHours: value('overtimeHours'),
      inKindHousing: value('inKindHousing'),
      inKindFood: value('inKindFood')
    };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true });
    byId('formError').textContent = message;
    setStatus('Hesabu haijakamilika. Sahihisha sehemu iliyoonyeshwa.', true);
    if (field) field.focus();
    return false;
  }
  function validate(input) {
    if (!Number.isInteger(input.numWorkers) || input.numWorkers < 1 || input.numWorkers > 100000) {
      return fail('Weka idadi kamili ya wafanyakazi kati ya 1 na 100,000.', byId('numWorkers'));
    }
    if (input.workerType === 'permanent' && (!Number.isFinite(input.grossPay) || input.grossPay <= 0)) {
      return fail('Weka mshahara wa mwezi unaozidi sifuri.', byId('grossPay'));
    }
    if ((input.workerType === 'casual' || input.workerType === 'seasonal') && (!Number.isFinite(input.grossPay) || input.grossPay <= 0)) {
      return fail('Weka malipo ya siku yanayozidi sifuri.', byId('grossPay'));
    }
    if ((input.workerType === 'casual' || input.workerType === 'seasonal') && (!Number.isInteger(input.daysWorked) || input.daysWorked < 1 || input.daysWorked > 31)) {
      return fail('Weka siku kamili kati ya 1 na 31.', byId('daysWorked'));
    }
    if (input.workerType === 'piece_rate' && (!Number.isFinite(input.ratePerUnit) || input.ratePerUnit <= 0)) {
      return fail('Weka malipo kwa kazi yanayozidi sifuri.', byId('ratePerUnit'));
    }
    if (input.workerType === 'piece_rate' && (!Number.isInteger(input.unitsCompleted) || input.unitsCompleted < 1 || input.unitsCompleted > 1000000)) {
      return fail('Weka idadi kamili ya kazi kati ya 1 na 1,000,000.', byId('unitsCompleted'));
    }
    if (!Number.isFinite(input.overtimeHours) || input.overtimeHours < 0 || input.overtimeHours > 744) {
      return fail('Weka saa za ziada kati ya 0 na 744.', byId('overtimeHours'));
    }
    if (!Number.isFinite(input.inKindHousing) || input.inKindHousing < 0) {
      return fail('Thamani ya nyumba haiwezi kuwa chini ya sifuri.', byId('inKindHousing'));
    }
    if (!Number.isFinite(input.inKindFood) || input.inKindFood < 0) {
      return fail('Thamani ya chakula haiwezi kuwa chini ya sifuri.', byId('inKindFood'));
    }
    return true;
  }
  function renderRows(result) {
    var table = byId('deductionTable');
    var cards = byId('deductionCards');
    var head = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Aina', 'Jina', 'Kiwango', 'Kiasi'].forEach(function (label) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headerRow.appendChild(th);
    });
    head.appendChild(headerRow);
    var body = document.createElement('tbody');
    cards.replaceChildren();
    rows(result).forEach(function (item) {
      var rate = item.ratePct == null ? '?' : number(item.ratePct, 2) + ' %';
      var amount = money(item.amount);
      var tr = document.createElement('tr');
      [item.category, item.name, rate, amount].forEach(function (text) {
        var td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
      var card = document.createElement('article');
      var heading = document.createElement('strong');
      card.className = 'payroll-deduction-card';
      heading.textContent = item.name;
      card.appendChild(heading);
      [['Aina', item.category], ['Kiwango', rate], ['Kiasi', amount]].forEach(function (entry) {
        var line = document.createElement('span');
        line.textContent = entry[0] + ': ' + entry[1];
        card.appendChild(line);
      });
      cards.appendChild(card);
    });
    table.replaceChildren(head, body);
  }
  function render(result) {
    byId('netPay').textContent = money(result.netPay);
    byId('gross').textContent = money(result.grossForDeductions);
    byId('deductions').textContent = money(result.totalDeductions);
    byId('employerCost').textContent = money(result.totalEmployerCost);
    byId('farmMonthly').textContent = money(result.farmMonthlyCost);
    byId('farmAnnual').textContent = money(result.farmAnnualCost);
    byId('minimumStatus').textContent = result.mwCheck
      ? (result.mwCheck.compliant ? 'Juu ya au sawa na rejea' : 'Chini ya rejea')
      : 'Hakuna ulinganisho';
    renderRows(result);
    var law = result.laborLaw || {};
    var items = [
      'Kikomo cha rejea: saa ' + (law.maxHoursPerDay || '?') + ' kwa siku na saa ' + (law.maxHoursPerWeek || '?') + ' kwa wiki.',
      'Kizidishi cha saa za ziada: ' + number(law.overtimeRate || 1.5, 2) + '.',
      'Likizo ya mwaka ya rejea: siku ' + (law.annualLeave_days || '?') + '.',
      'Sikukuu za umma za rejea: ' + (law.publicHolidays || '?') + '.'
    ];
    byId('lawList').replaceChildren();
    items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      byId('lawList').appendChild(li);
    });
    byId('taxStatus').textContent = result.likelyTaxable
      ? 'Malipo ghafi yanaweza kuwa katika kiwango kinachotozwa kodi; tumia kikokotoo cha PAYE cha nchi na uthibitishe kwa mamlaka.'
      : 'Ukurasa huu haukokotoi PAYE kwa undani; thibitisha wajibu wa kodi kwa mamlaka ya nchi.';
  }
  function reportObject() {
    if (!latest) return null;
    var result = latest.result;
    return {
      schemaVersion: 1,
      zana: 'mishahara-ya-shamba',
      lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: latest.input,
      matokeo: {
        sarafu: result.currency,
        malipoGhafiMsingi: result.baseGross,
        malipoSaaZaZiada: result.overtimePay,
        thamaniFaidaZisizoFedha: result.inKindValue,
        malipoGhafiYanayokatwa: result.grossForDeductions,
        makato: rows(result).filter(function (item) { return item.category === 'Kato la mfanyakazi'; }),
        jumlaMakato: result.totalDeductions,
        malipoHalisi: result.netPay,
        michangoMwajiri: rows(result).filter(function (item) { return item.category === 'Mchango wa mwajiri'; }),
        gharamaMwajiriKwaMfanyakazi: result.totalEmployerCost,
        gharamaShambaKwaMwezi: result.farmMonthlyCost,
        gharamaShambaKwaMwaka: result.farmAnnualCost,
        ukaguziKimaChaChini: result.mwCheck,
        huendaIkatozwaKodi: result.likelyTaxable,
        sheriaKazi: {
          saaKwaSiku: result.laborLaw.maxHoursPerDay,
          saaKwaWiki: result.laborLaw.maxHoursPerWeek,
          kizidishiSaaZaZiada: result.laborLaw.overtimeRate,
          sikuLikizoMwaka: result.laborLaw.annualLeave_days,
          sikukuuZaUmma: result.laborLaw.publicHolidays
        }
      },
      chanzo: {
        jina: config.sourceLabel,
        data: 'data/agriculture/farm-payroll-data.js',
        injini: 'engines/src/farm-payroll-engine.js',
        dataMojaKwaMoja: false,
        upya: config.freshnessLabel,
        kiwangoChaUhakika: config.confidenceLabel
      },
      faragha: 'Hesabu ya ndani ya kivinjari; hakuna ingizo la mishahara linalotumwa.'
    };
  }
  function textReport() {
    if (!latest) return '';
    var result = latest.result;
    return [
      'AfroTools - Mishahara ya wafanyakazi wa shamba',
      config.countryName + ' (' + config.countryCode + ')',
      'Aina ya mfanyakazi: ' + config.workerTypes[latest.input.workerType],
      'Idadi ya wafanyakazi: ' + latest.input.numWorkers,
      'Malipo ghafi yanayokatwa: ' + money(result.grossForDeductions),
      'Jumla ya makato: ' + money(result.totalDeductions),
      'Malipo halisi kwa mfanyakazi: ' + money(result.netPay),
      'Gharama ya mwajiri kwa mfanyakazi: ' + money(result.totalEmployerCost),
      'Gharama ya shamba kwa mwezi: ' + money(result.farmMonthlyCost),
      'Gharama ya shamba kwa mwaka: ' + money(result.farmAnnualCost),
      '',
      'Chanzo: ' + config.sourceLabel,
      'Upya: ' + config.freshnessLabel,
      'Kiwango cha uhakika: ' + config.confidenceLabel,
      'Kadirio la kupanga tu; thibitisha viwango vya sasa kabla ya kulipa.',
      'Faragha: hesabu ya ndani ya kivinjari.'
    ].join('\n');
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function csvReport() {
    var report = reportObject();
    var result = report.matokeo;
    var values = [
      config.countryName, config.countryCode, latest.input.workerType, latest.input.numWorkers,
      result.malipoGhafiYanayokatwa, result.jumlaMakato, result.malipoHalisi,
      result.gharamaMwajiriKwaMfanyakazi, result.gharamaShambaKwaMwezi,
      result.gharamaShambaKwaMwaka, result.sarafu, config.sourceLabel, 'hapana'
    ];
    return [
      ['nchi', 'code_nchi', 'aina_mfanyakazi', 'idadi_wafanyakazi', 'malipo_ghafi', 'jumla_makato', 'malipo_halisi', 'gharama_mwajiri', 'gharama_shamba_mwezi', 'gharama_shamba_mwaka', 'sarafu', 'chanzo', 'data_moja_kwa_moja'],
      values
    ].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  function calculate() {
    byId('formError').textContent = '';
    setStatus('');
    var input = inputObject();
    if (!validate(input)) return null;
    var result = engine.calculate(input, country);
    if (!result || result.error) return fail('Injini ya mishahara ya nchi haikutoa matokeo.', byId('workerType'));
    latest = { input: input, result: result };
    if (root.__SW_AGRI_TEST__) root.__SW_AGRI_TEST__.latest = latest;
    render(result);
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    setActionsEnabled(true);
    setStatus('Kadirio limekokotolewa ndani ya kivinjari.');
    byId('resultPanel').focus();
    return result;
  }
  async function action(name) {
    if (!latest) return setStatus('Kokotoa mishahara kwanza.', true);
    var report = reportObject();
    var text = textReport();
    var slug = 'afrotools-mishahara-ya-shamba-' + config.countryCode.toLowerCase();
    if (name === 'copy') {
      await navigator.clipboard.writeText(text);
    } else if (name === 'share') {
      var payload = { title: 'Mishahara ya shamba - ' + config.countryName, text: text, url: location.origin + location.pathname };
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text);
    } else if (name === 'save') {
      localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(report));
    } else if (name === 'json') {
      download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', slug + '.json');
    } else if (name === 'txt') {
      download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
    } else if (name === 'csv') {
      download('\ufeff' + csvReport(), 'text/csv;charset=utf-8', slug + '.csv');
    } else if (name === 'pdf') {
      var JsPdf = root.jspdf && root.jspdf.jsPDF;
      if (!JsPdf) return setStatus('Utengenezaji wa PDF haupatikani.', true);
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      var safeText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      pdf.text(pdf.splitTextToSize(safeText, 500), 48, 58);
      pdf.save(slug + '.pdf');
    }
    setStatus(name === 'save' ? 'Matokeo yamehifadhiwa kwenye kivinjari hiki.' : 'Kitendo kimekamilika.');
  }
  function init() {
    if (!engine || !allData || !allData[config.countryCode]) throw new Error('Injini au hazina ya mishahara haipatikani.');
    country = allData[config.countryCode];
    defaults();
    setActionsEnabled(false);
    byId('workerType').addEventListener('change', syncType);
    byId('payrollForm').addEventListener('input', function () {
      byId('formError').textContent = '';
      if (latest) clearResult();
    });
    byId('payrollForm').addEventListener('change', function () {
      if (latest) clearResult();
    });
    byId('payrollForm').addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    byId('payrollForm').addEventListener('reset', function () {
      setTimeout(function () {
        clearResult();
        byId('formError').textContent = '';
        defaults();
        byId('workerType').focus();
      }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (!button) return;
      action(button.dataset.resultAction).catch(function () {
        setStatus('Kitendo hakikukamilika kwenye kivinjari hiki.', true);
      });
    });
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate,
    clearResult: clearResult,
    latest: null,
    engine: engine,
    data: allData,
    reportObject: reportObject,
    textReport: textReport
  };
  try { init(); } catch (error) {
    byId('formError').textContent = error.message;
    console.error(error);
  }
}(window));
