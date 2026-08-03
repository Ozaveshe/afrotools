(function initSwahiliFarmLoans(root) {
  'use strict';

  var app = root.AfroTools = root.AfroTools || {};
  var config = root.__SW_AGRI_PAGE__ || {};
  var allData = app.AgriLoansData;
  var evidenceRegistry = app.AgriLoansEvidence;
  var engine = app.FarmLoanEngine;
  var country = null;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function radio(name) {
    var selected = document.querySelector('input[name="' + name + '"]:checked');
    return Boolean(selected && selected.value === 'yes');
  }
  function number(value, digits) {
    return new Intl.NumberFormat('sw', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits == null ? 1 : digits
    }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat('sw', {
      style: 'currency', currency: country.currency, maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
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
  function metric(label, value) {
    var wrapper = document.createElement('div');
    var strong = document.createElement('strong');
    var text = document.createElement('span');
    wrapper.className = 'metric';
    strong.textContent = value;
    text.textContent = label;
    wrapper.append(strong, text);
    return wrapper;
  }
  function reason(value) {
    var match;
    if ((match = value.match(/^Minimum age: (\d+) years \(you are (\d+)\)$/))) {
      return 'Umri wa chini ni miaka ' + match[1] + ' (umeweka miaka ' + match[2] + ').';
    }
    if ((match = value.match(/^Maximum age: (\d+) years \(you are (\d+)\)$/))) {
      return 'Umri wa juu ni miaka ' + match[1] + ' (umeweka miaka ' + match[2] + ').';
    }
    if (value === 'Must be a cooperative or farmer group member') return 'Uanachama wa ushirika au kikundi cha wakulima unahitajika.';
    if (value === 'Joining a cooperative improves your chances') return 'Kujiunga na ushirika kunaweza kuboresha nafasi ya kutimiza vigezo.';
    if (value === 'Requires a bank account') return 'Akaunti ya benki inahitajika.';
    if (value.indexOf('Requires collateral') === 0) return 'Dhamana inahitajika, kama hati ya ardhi, mali au kifaa.';
    if ((match = value.match(/^Minimum farm size: ([\d.]+) ha/))) return 'Ukubwa wa chini wa shamba ni ha ' + match[1] + '.';
    if ((match = value.match(/^Maximum farm size: ([\d.]+) ha/))) return 'Ukubwa wa juu wa shamba ni ha ' + match[1] + '; programu imelenga wakulima wadogo.';
    if (value === 'Mandatory entrepreneurship training required before application') return 'Mafunzo ya ujasiriamali yanahitajika kabla ya kuomba.';
    if ((match = value.match(/^Minimum tenor: (\d+) months \(you selected (\d+)\)$/))) return 'Muda wa chini ni miezi ' + match[1] + ' (umechagua miezi ' + match[2] + ').';
    if ((match = value.match(/^Maximum tenor: (\d+) months \(you selected (\d+)\)$/))) return 'Muda wa juu ni miezi ' + match[1] + ' (umechagua miezi ' + match[2] + ').';
    if (value === 'Record is a regulated directory, not a verified direct loan product') return 'Hii ni orodha ya watoa huduma wanaodhibitiwa, si bidhaa moja ya mkopo iliyothibitishwa.';
    if (value === 'Record is a referral or guarantee channel, not a direct loan product') return 'Hii ni njia ya rufaa au dhamana, si bidhaa ya mkopo inayotolewa moja kwa moja.';
    if (value === 'Record provides grants, incentives, or support rather than a direct loan') return 'Rekodi hii ni ya ruzuku, motisha au msaada, si mkopo wa moja kwa moja.';
    if (value === 'Record provides in-kind input credit or services rather than a cash loan') return 'Rekodi hii ni ya pembejeo kwa mkopo au huduma, si mkopo wa fedha taslimu.';
    if (value === 'Record is agricultural insurance, not a loan product') return 'Rekodi hii ni bima ya kilimo, si bidhaa ya mkopo.';
    if (value === 'Record is missing dated official-source evidence') return 'Rekodi haina chanzo rasmi chenye tarehe; haitalinganishwa.';
    if (value.indexOf('Your requested amount exceeds the maximum') === 0) return 'Kiasi ulichoomba kinazidi kiwango cha juu cha programu.';
    if (value.indexOf('Minimum loan:') === 0) return 'Kiasi ulichoomba ni chini ya kiwango cha chini cha programu.';
    return 'Kigezo kilichohifadhiwa hakijatimizwa; thibitisha moja kwa moja kwa mkopeshaji.';
  }
  function profile() {
    return {
      age: Number(byId('age').value),
      farmSize_ha: Number(byId('farmSize').value),
      isCoop: radio('coop'),
      hasBankAccount: radio('bank'),
      hasCollateral: radio('collateral'),
      hasRequiredTraining: radio('training'),
      requestedAmount: Number(byId('amount').value),
      tenorMonths: Number(byId('tenor').value)
    };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true });
    byId('formError').textContent = message;
    setStatus('Ulinganishaji haujakamilika. Sahihisha sehemu iliyoonyeshwa.', true);
    if (field) field.focus();
    return false;
  }
  function validate(input) {
    if (!Number.isInteger(input.age) || input.age < 16 || input.age > 80) {
      return fail('Weka umri kamili kati ya miaka 16 na 80.', byId('age'));
    }
    if (!Number.isFinite(input.farmSize_ha) || input.farmSize_ha < 0.1 || input.farmSize_ha > 10000) {
      return fail('Weka ukubwa wa shamba kati ya ha 0.1 na 10,000.', byId('farmSize'));
    }
    if (!Number.isFinite(input.requestedAmount) || input.requestedAmount < config.amountMin) {
      return fail('Weka kiasi kisichopungua ' + money(config.amountMin) + '.', byId('amount'));
    }
    if ([6, 12, 18, 24, 36, 48, 60].indexOf(input.tenorMonths) < 0) {
      return fail('Chagua muda halali wa marejesho.', byId('tenor'));
    }
    return true;
  }
  function rateText(program) {
    var rate = program.interestRate_pct;
    if (rate == null) return 'Kiwango hakijaainishwa au kimejumuishwa kwenye gharama';
    if (typeof rate === 'object') return number(rate.min) + '-' + number(rate.max) + '% kwa mwaka';
    return number(rate) + '% kwa mwaka';
  }
  function programCard(result) {
    var program = result.program;
    var article = document.createElement('article');
    var heading = document.createElement('h3');
    var type = document.createElement('p');
    var grid = document.createElement('div');
    var tenor = program.tenor_months && !(program.tenor_months.min === 0 && program.tenor_months.max === 0)
      ? program.tenor_months.min + '-' + program.tenor_months.max + ' miezi'
      : 'Hakuna ratiba ya mkopo';
    article.className = 'card loan-program-card';
    heading.textContent = program.name;
    type.textContent = config.programTypes[program.typeBadge] || 'Mpango wa fedha';
    grid.className = 'result-grid';
    grid.append(
      metric('Kiwango', rateText(program)),
      metric('Kiasi cha chini', program.minAmount ? money(program.minAmount) : 'Hakijaainishwa'),
      metric('Kiasi cha juu', program.maxAmount ? money(program.maxAmount) : 'Kulingana na programu'),
      metric('Muda', tenor)
    );
    article.append(heading, type, grid);
    if (result.rateAssumption && result.rateAssumption.method === 'midpoint-of-published-range') {
      var assumption = document.createElement('p');
      assumption.className = 'rate-assumption';
      assumption.textContent = 'Dhana ya marejesho: katikati ya wigo wa riba, yaani ' + number(result.rateAssumption.used) + '% kwa mwaka (wigo ' + number(result.rateAssumption.min) + '-' + number(result.rateAssumption.max) + '%).';
      article.appendChild(assumption);
    }
    if (result.repayment) {
      var repayment = document.createElement('div');
      repayment.className = 'result-grid';
      repayment.append(
        metric('Makadirio ya malipo ya mwezi', money(result.repayment.monthly)),
        metric('Jumla ya kurejesha', money(result.repayment.totalPayable)),
        metric('Jumla ya riba', money(result.repayment.totalInterest))
      );
      article.appendChild(repayment);
    }
    var messages = result.eligible ? result.warnings : result.blockers;
    if (messages.length) {
      var list = document.createElement('ul');
      list.className = 'recommendations';
      messages.forEach(function (message) {
        var item = document.createElement('li');
        item.textContent = reason(message);
        list.appendChild(item);
      });
      article.appendChild(list);
    }
    var source = document.createElement('p');
    var sourceLink = document.createElement('a');
    source.className = 'program-source';
    source.appendChild(document.createTextNode('Chanzo rasmi: '));
    sourceLink.href = program.officialUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener';
    sourceLink.textContent = program.sourceTitle;
    source.append(sourceLink, document.createTextNode('. Ilikaguliwa ' + program.checkedDate + '; tarehe ya rekodi/uanzo ' + program.effectiveDate + '.'));
    article.appendChild(source);
    return article;
  }
  function render(results) {
    var matching = results.filter(function (result) { return result.eligible; });
    var notMatching = results.filter(function (result) { return !result.eligible; });
    var lowest = matching.length ? Math.min.apply(null, matching.map(function (result) { return result.rate || 99; })) : null;
    var highest = matching.length ? Math.max.apply(null, matching.map(function (result) { return result.program.maxAmount || 0; })) : 0;
    byId('summary').replaceChildren(
      metric('Programu zinazolingana', String(matching.length)),
      metric('Programu zilizopitiwa', String(results.length))
    );
    if (lowest != null && lowest < 99) byId('summary').appendChild(metric('Kiwango cha chini cha kupanga', number(lowest) + '%'));
    if (highest > 0) byId('summary').appendChild(metric('Kiwango cha juu cha kupanga', money(highest)));
    byId('eligibleTitle').textContent = matching.length
      ? 'Programu zinazolingana na taarifa ulizoweka (' + matching.length + ')'
      : 'Hakuna programu inayolingana na taarifa ulizoweka';
    byId('eligibleList').replaceChildren();
    matching.forEach(function (result) { byId('eligibleList').appendChild(programCard(result)); });
    if (!matching.length) {
      var note = document.createElement('p');
      note.textContent = 'Kagua uanachama wa ushirika, akaunti ya benki, dhamana, ukubwa wa shamba au kiasi ulichoomba.';
      byId('eligibleList').appendChild(note);
    }
    byId('ineligibleSection').hidden = !notMatching.length;
    byId('ineligibleTitle').textContent = 'Programu ambazo hazilingani kwa sasa (' + notMatching.length + ')';
    byId('ineligibleList').replaceChildren();
    notMatching.forEach(function (result) { byId('ineligibleList').appendChild(programCard(result)); });
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    setActionsEnabled(true);
    setStatus('Ulinganishaji wa hazina tuli umekamilika kwenye kivinjari hiki. Huu si uamuzi wa mkopeshaji.');
    byId('resultPanel').focus();
  }
  function localisedResult(result) {
    return {
      programuId: result.program.id,
      programu: result.program.name,
      aina: config.programTypes[result.program.typeBadge] || 'Mpango wa fedha',
      inalingana: result.eligible,
      kiwangoChaRibaAsilimia: result.rate,
      dhanaYaKiwango: result.rateAssumption ? {
        mbinu: result.rateAssumption.method === 'midpoint-of-published-range' ? 'katikati-ya-wigo' : 'kiwango-kimoja-kilichohifadhiwa',
        kiwangoChaChini: result.rateAssumption.min,
        kiwangoChaJuu: result.rateAssumption.max,
        kiwangoKilichotumika: result.rateAssumption.used
      } : null,
      vizuizi: result.blockers.map(reason),
      maonyo: result.warnings.map(reason),
      marejesho: result.repayment,
      rekodi: {
        aina: result.program.programMode,
        haliYaUshahidi: result.program.evidenceStatus,
        chanzoRasmi: result.program.sourceTitle,
        kiungoRasmi: result.program.officialUrl,
        tareheYaUkaguzi: result.program.checkedDate,
        tareheYaRekodiAuUanzo: result.program.effectiveDate
      }
    };
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1,
      zana: 'mikopo-ya-shamba',
      lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: latest.profile,
      matokeo: latest.results.map(localisedResult),
      chanzo: {
        hazina: 'data/agriculture/agri-loans-data.js',
        ushahidiWaRekodi: 'data/agriculture/agri-loans-evidence.js',
        injini: 'engines/src/farm-loan-engine.js',
        marejeoYaNchi: config.sourceNames,
        upya: config.freshnessLabel,
        kiwangoChaUhakika: config.confidenceLabel,
        dataMojaKwaMoja: false
      },
      onyo: 'Huu si uamuzi, idhini au ofa ya mkopeshaji. Thibitisha masharti ya sasa moja kwa moja.',
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'
    };
  }
  function reportText() {
    var report = reportObject();
    if (!report) return '';
    var matching = report.matokeo.filter(function (result) { return result.inalingana; });
    var sources = report.matokeo.map(function (result) {
      return '- ' + result.programu + ': ' + result.rekodi.chanzoRasmi + ' — ' + result.rekodi.kiungoRasmi + ' — ilikaguliwa ' + result.rekodi.tareheYaUkaguzi + '; tarehe ya rekodi/uanzo ' + result.rekodi.tareheYaRekodiAuUanzo;
    });
    return [
      'AfroTools - Mikopo ya shamba',
      'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Kiasi kilichoombwa: ' + money(report.ingizo.requestedAmount),
      'Muda: miezi ' + report.ingizo.tenorMonths,
      'Programu zinazolingana: ' + matching.length + ' / ' + report.matokeo.length,
    ].concat(matching.map(function (result) {
      var rateNote = result.dhanaYaKiwango && result.dhanaYaKiwango.mbinu === 'katikati-ya-wigo' ? ' (katikati ya wigo)' : '';
      return '- ' + result.programu + ': ' + number(result.kiwangoChaRibaAsilimia) + '%' + rateNote;
    }), ['', 'Marejeo ya programu:'], sources, [
      '',
      'Chanzo: ' + config.sourceNames,
      'Upya: ' + config.freshnessLabel,
      'Kiwango cha uhakika: ' + config.confidenceLabel,
      'Onyo: huu si uamuzi, idhini au ofa ya mkopeshaji.',
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'
    ]).join('\n');
  }
  function calculate() {
    byId('formError').textContent = '';
    var input = profile();
    if (!validate(input)) return null;
    var results = engine.evaluatePrograms(input, country);
    latest = { profile: input, results: results };
    root.__SW_AGRI_TEST__.latest = latest;
    render(results);
    return results;
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function createCsv() {
    var report = reportObject();
    var rows = [[
      'nchi', 'code_nchi', 'programu_id', 'programu', 'inalingana', 'kiwango_riba_asilimia', 'mbinu_ya_kiwango',
      'malipo_mwezi', 'jumla_marejesho', 'sarafu', 'marejeo_ya_nchi', 'upya',
      'kiwango_cha_uhakika', 'chanzo_rasmi', 'kiungo_rasmi', 'tarehe_ya_ukaguzi', 'tarehe_ya_rekodi_au_uanzo', 'data_moja_kwa_moja'
    ]];
    report.matokeo.forEach(function (result) {
      rows.push([
        config.countryName, config.countryCode, result.programuId, result.programu,
        result.inalingana ? 'ndiyo' : 'hapana', result.kiwangoChaRibaAsilimia,
        result.dhanaYaKiwango ? result.dhanaYaKiwango.mbinu : '',
        result.marejesho ? result.marejesho.monthly : '',
        result.marejesho ? result.marejesho.totalPayable : '',
        country.currency, config.sourceNames, config.freshnessLabel, config.confidenceLabel,
        result.rekodi.chanzoRasmi, result.rekodi.kiungoRasmi, result.rekodi.tareheYaUkaguzi,
        result.rekodi.tareheYaRekodiAuUanzo, 'hapana'
      ]);
    });
    return '\ufeff' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Linganisha programu upya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject();
    var text = reportText();
    var slug = 'afrotools-mikopo-ya-shamba-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(text);
        setStatus('Muhtasari umenakiliwa.');
      } else if (action === 'share') {
        var payload = { title: 'Mikopo ya shamba', text: text, url: location.href };
        if (navigator.share) {
          await navigator.share(payload);
          setStatus('Kidirisha cha kushiriki kimefunguliwa.');
        } else {
          await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text);
          setStatus('Kushiriki kwa mfumo hakupatikani; kiungo na muhtasari vimenakiliwa.');
        }
      } else if (action === 'save') {
        localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(object));
        setStatus('Nakala imehifadhiwa kwenye kivinjari hiki.');
      } else if (action === 'json') {
        download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json');
        setStatus('Faili ya JSON imepakuliwa.');
      } else if (action === 'txt') {
        download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
        setStatus('Faili ya TXT imepakuliwa.');
      } else if (action === 'csv') {
        download(createCsv(), 'text/csv;charset=utf-8', slug + '.csv');
        setStatus('Faili ya CSV imepakuliwa.');
      } else if (action === 'pdf') {
        var JsPdf = root.jspdf && root.jspdf.jsPDF;
        if (!JsPdf) throw new Error('Maktaba ya PDF haipatikani.');
        var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
        pdf.text(pdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
        pdf.save(slug + '.pdf');
        setStatus('Faili ya PDF imepakuliwa.');
      }
    } catch (error) {
      setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true);
    }
  }
  function initialise() {
    if (!engine || !allData || !evidenceRegistry || !allData[config.countryCode]) {
      throw new Error('Injini au hazina ya mikopo ya shamba haipatikani.');
    }
    country = allData[config.countryCode];
    byId('age').value = '30';
    byId('farmSize').value = '1';
    byId('amount').value = String(config.amountDefault);
    byId('tenor').value = '12';
    byId('coopYes').checked = true;
    byId('bankYes').checked = true;
    byId('collateralNo').checked = true;
    byId('trainingNo').checked = true;
    byId('currencyHint').textContent = 'Sarafu: ' + country.currency;
    byId('formError').textContent = '';
    clearResult();
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate,
    latest: null,
    reportObject: reportObject,
    reportText: reportText,
    engine: engine,
    data: allData,
    invalidate: clearResult
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('loanForm');
    try {
      initialise();
    } catch (error) {
      byId('formError').textContent = error.message;
      console.error(error);
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    form.addEventListener('input', function () {
      clearResult();
      byId('formError').textContent = '';
    });
    form.addEventListener('change', function () {
      clearResult();
      byId('formError').textContent = '';
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        initialise();
        byId('age').focus();
      }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (button) runAction(button.dataset.resultAction);
    });
  });
})(window);
