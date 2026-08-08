(function () {
  'use strict';

  var app = document.body && document.body.dataset.haHealthApp;
  if (!app) return;

  var state = { app: app, current: null };

  function byId(id) { return document.getElementById(id); }
  function text(id, value) { var node = byId(id); if (node) node.textContent = value; }
  function todayIso() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function formatMoney(amount, currency) {
    return currency + ' ' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function formatCents(cents, currency) { return formatMoney(cents / 100, currency); }
  function formatDate(iso) {
    if (!iso) return 'Ba a rubuta ba';
    try {
      return new Intl.DateTimeFormat('ha-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(iso + 'T00:00:00Z'));
    } catch (_error) {
      return iso;
    }
  }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function showResult(id) {
    var panel = byId(id);
    if (!panel) return;
    panel.hidden = false;
    var focusTarget = panel.querySelector('[tabindex="-1"]') || panel;
    focusTarget.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
  function hideResult(id) { var panel = byId(id); if (panel) panel.hidden = true; }
  function showError(id, message) {
    var node = byId(id);
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    node.focus();
  }
  function clearError(id) { var node = byId(id); if (node) { node.textContent = ''; node.hidden = true; } }
  function setStatus(message) { text('export-status', message); }
  function filenameSafe(name) { return name.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase(); }
  function downloadText(name, content) {
    var url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function downloadPdf(name, title, content) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setStatus('Ba a samu ma ajiyar PDF ba. Yi amfani da TXT.');
      return;
    }
    var Pdf = window.jspdf.jsPDF;
    var pdf = new Pdf({ unit: 'pt', format: 'a4', compress: false });
    pdf.setProperties({ title: title });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    var lines = pdf.splitTextToSize(content, 500);
    var y = 52;
    lines.forEach(function (line) {
      if (y > 790) { pdf.addPage(); y = 52; }
      pdf.text(line, 46, y);
      y += 14;
    });
    pdf.save(name);
    setStatus('An sauke PDF a cikin wannan burauzar.');
  }
  function wireExports(prefix, title, buildText) {
    var txt = byId('download-txt');
    var pdf = byId('download-pdf');
    if (txt) txt.addEventListener('click', function () {
      if (!state.current) return setStatus('Da farko ka samar da sakamako.');
      downloadText(filenameSafe(prefix) + '.txt', buildText());
      setStatus('An sauke TXT a cikin wannan burauzar.');
    });
    if (pdf) pdf.addEventListener('click', function () {
      if (!state.current) return setStatus('Da farko ka samar da sakamako.');
      downloadPdf(filenameSafe(prefix) + '.pdf', title, buildText());
    });
  }
  function wireReset(formId, resultId, firstId) {
    var button = byId('reset-app');
    if (!button) return;
    button.addEventListener('click', function () {
      var form = byId(formId);
      if (form) form.reset();
      state.current = null;
      hideResult(resultId);
      clearError('form-error');
      setStatus('An goge bayanan da sakamakon daga shafin.');
      var first = byId(firstId);
      if (first) first.focus();
    });
  }
  function clearOnInput(form, resultId) {
    form.addEventListener('input', function () {
      if (!state.current) return;
      state.current = null;
      hideResult(resultId);
      setStatus('');
    });
    form.addEventListener('change', function () {
      if (!state.current) return;
      state.current = null;
      hideResult(resultId);
      setStatus('');
    });
  }

  function mapHospitalError(message) {
    if (/facility or quote reference/i.test(message)) return 'Saka sunan asibiti ko lambar takardar farashi.';
    if (/three-letter currency/i.test(message)) return 'Saka lambar kudin kasa mai haruffa uku, misali NGN.';
    if (/valid quote date/i.test(message)) return 'Saka ingantaccen kwanan takardar farashi wanda bai wuce yau ba.';
    if (/insurer contribution cannot exceed/i.test(message)) return 'Gudummawar mai inshora ba za ta wuce jimillar farashin da aka shigar ba.';
    if (/at least one positive/i.test(message)) return 'Saka akalla farashi guda daya da ya fi sifili daga takardar asibiti.';
    if (/must be between/i.test(message)) return 'Duba adadin: dole ya kasance sifili ko sama, cikin iyakar da aka amince.';
    return 'Ba a iya lissafa ba. Duba duk bayanan da ka shigar.';
  }

  function initHospital() {
    var engine = window.HospitalQuoteEngine;
    var form = byId('hospital-form');
    var date = byId('quote-date');
    date.value = todayIso();
    date.max = todayIso();
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearError('form-error');
      hideResult('app-result');
      state.current = null;
      if (!engine) return showError('form-error', 'Ma ajiyar lissafi ba ta loda ba. Sake bude shafin.');
      try {
        var result = engine.calculate(Object.fromEntries(new FormData(form).entries()));
        state.current = result;
        text('result-total', formatMoney(result.totalWithBuffer, result.currency));
        text('gross-total', formatMoney(result.gross, result.currency));
        text('contribution-total', formatMoney(result.insuranceContribution, result.currency));
        text('household-total', formatMoney(result.outOfPocket, result.currency));
        text('buffer-total', formatMoney(result.bufferAmount, result.currency));
        text('result-assumptions', 'Takardar farashi ta ' + formatDate(result.quoteDate) + '; an kara ajiyar shiri ' + result.bufferPercent + '% bayan gudummawar mai inshora.');
        text('result-confidence', 'Amincewa da lissafi: mai karfi. Amincewa da farashi: ya dogara da rubutaccen farashi da izinin inshora da ka shigar.');
        showResult('app-result');
      } catch (error) {
        showError('form-error', mapHospitalError(error && error.message || ''));
      }
    });
    function report() {
      var r = state.current;
      if (!r) return '';
      return [
        'AFROTOOLS - KASAFIN TAKARDAR FARASHIN ASIBITI',
        '',
        'Asibiti ko lamba: ' + r.facility,
        'Kwanan takardar farashi: ' + r.quoteDate,
        'Kudin kasa: ' + r.currency,
        'Jimillar farashin da aka shigar: ' + formatMoney(r.gross, r.currency),
        'Gudummawar mai inshora da aka tabbatar: ' + formatMoney(r.insuranceContribution, r.currency),
        'Abin da za a biya kafin ajiya: ' + formatMoney(r.outOfPocket, r.currency),
        'Ajiyar shiri (' + r.bufferPercent + '%): ' + formatMoney(r.bufferAmount, r.currency),
        'Jimillar kasafin shiri: ' + formatMoney(r.totalWithBuffer, r.currency),
        '',
        'IYAKA: Lissafin farashin da mai amfani ya shigar ne kawai. Ba ganewar cuta, shawarar magani, tabbacin takardar kudi ko hasashen sakamakon jinya ba ne. Tabbatar da abin da farashi ya kunsa da izinin mai inshora a rubuce.',
        'SABUNTAWA: ingancin farashi ya dogara da kwanan takardar da ke sama.',
        'SIRRI: an kirkira a cikin wannan burauzar; ba a ajiye ko tura bayanan ba.'
      ].join('\n');
    }
    wireExports('afrotools-kasafin-asibiti', 'Kasafin takardar farashin asibiti', report);
    wireReset('hospital-form', 'app-result', 'facility-reference');
    clearOnInput(form, 'app-result');
  }

  var SICKLE_LABELS = {
    AA: ['Tsarin HbAA', 'Hadin A/A a wannan saukakken tsarin'],
    AS: ['Halin mai dauke da kwayar sikila', 'Tsarin trait'],
    AC: ['Halin mai dauke da haemoglobin C', 'Tsarin trait'],
    SS: ['Cutar sikila ta HbSS', 'Tsarin cutar sikila'],
    SC: ['Cutar sikila ta HbSC', 'Tsarin cutar sikila'],
    CC: ['Cutar haemoglobin C ta HbCC', 'Tsarin cutar haemoglobin C']
  };
  function sickleClass(code) {
    if (code === 'AS' || code === 'AC') return 'trait';
    if (code === 'SS' || code === 'SC') return 'disease';
    if (code === 'CC') return 'hbc';
    return 'haa';
  }
  function initSickle() {
    var engine = window.AfroToolsSickleInheritance;
    var form = byId('sickle-form');
    var confirmed = byId('lab-confirmed');
    var first = byId('result-one');
    var second = byId('result-two');
    function renderPunnett(result) {
      var wrap = byId('punnett-square');
      wrap.replaceChildren();
      var table = document.createElement('table');
      table.className = 'ha-table';
      var caption = document.createElement('caption');
      caption.textContent = 'Kowane fili na ciki yana wakiltar daya daga hadin alleles guda hudu masu nauyi iri daya.';
      table.appendChild(caption);
      var thead = document.createElement('thead');
      var head = document.createElement('tr');
      ['Alleles', result.allelesSecond[0], result.allelesSecond[1]].forEach(function (value) {
        var th = document.createElement('th'); th.scope = 'col'; th.textContent = value; head.appendChild(th);
      });
      thead.appendChild(head); table.appendChild(thead);
      var tbody = document.createElement('tbody');
      for (var row = 0; row < 2; row += 1) {
        var tr = document.createElement('tr');
        var rowHead = document.createElement('th'); rowHead.scope = 'row'; rowHead.textContent = result.allelesFirst[row]; tr.appendChild(rowHead);
        for (var col = 0; col < 2; col += 1) {
          var td = document.createElement('td');
          var code = result.cells[row * 2 + col];
          td.textContent = code; td.dataset.outcome = sickleClass(code); tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody); wrap.appendChild(table);
    }
    function renderOutcomes(result) {
      var wrap = byId('outcomes'); wrap.replaceChildren();
      result.outcomes.forEach(function (outcome) {
        var card = document.createElement('article'); card.className = 'ha-outcome'; card.dataset.outcome = sickleClass(outcome.genotype);
        var code = document.createElement('p'); code.className = 'ha-outcome__code'; code.textContent = outcome.genotype;
        var probability = document.createElement('p'); probability.className = 'ha-outcome__value'; probability.textContent = outcome.probability + '%';
        var title = document.createElement('h3'); title.textContent = SICKLE_LABELS[outcome.genotype][0];
        var detail = document.createElement('p'); detail.textContent = SICKLE_LABELS[outcome.genotype][1] + ' - ga kowane ciki.';
        card.append(code, probability, title, detail); wrap.appendChild(card);
      });
    }
    function showErrors(errors) {
      var list = byId('error-list'); list.replaceChildren();
      errors.forEach(function (entry) {
        var item = document.createElement('li'); var link = document.createElement('a');
        link.href = '#' + entry.field; link.textContent = entry.message;
        link.addEventListener('click', function (event) { event.preventDefault(); byId(entry.field).focus(); });
        item.appendChild(link); list.appendChild(item); byId(entry.field).setAttribute('aria-invalid', 'true');
      });
      var summary = byId('form-error'); summary.hidden = false; summary.focus();
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      ['lab-confirmed', 'result-one', 'result-two'].forEach(function (id) { byId(id).removeAttribute('aria-invalid'); });
      var summary = byId('form-error');
      summary.hidden = true;
      hideResult('app-result'); state.current = null;
      var errors = [];
      if (!confirmed.checked) errors.push({ field: 'lab-confirmed', message: 'Tabbatar cewa bayanan biyu sun fito daga dakin gwaji ko fassarar kwararren lafiya.' });
      if (!engine) errors.push({ field: 'result-one', message: 'Ma ajiyar lissafi ba ta loda ba. Sake bude shafin.' });
      var result = engine ? engine.calculate(first.value, second.value) : null;
      if (result && !result.ok) result.errors.forEach(function (entry) {
        errors.push({ field: entry.field, message: entry.field === 'result-one' ? 'Zabi sakamakon farko da aka tabbatar.' : 'Zabi sakamakon na biyu da aka tabbatar.' });
      });
      if (errors.length) return showErrors(errors);
      state.current = result;
      text('result-summary', result.first + ' x ' + result.second + ' ya samar da hadin genotype ' + result.outcomes.length + ' a wannan tsarin fili hudu.');
      renderPunnett(result); renderOutcomes(result);
      showResult('app-result');
    });
    function report() {
      var r = state.current;
      if (!r) return '';
      return [
        'AFROTOOLS - ILIMIN GADON SIKILA; BA GANEWAR CUTA KO HUKUNCI BA', '',
        'Sakamakon farko da aka tabbatar: ' + r.first,
        'Sakamakon na biyu da aka tabbatar: ' + r.second, '',
        'YIWUWAR HADIN GA KOWANE CIKI',
        r.outcomes.map(function (outcome) { return '- ' + outcome.genotype + ': ' + outcome.probability + '% - ' + SICKLE_LABELS[outcome.genotype][0]; }).join('\n'), '',
        'Kowane ciki lamari ne mai zaman kansa. Kason ba ya hasashen ko tabbatar da sakamakon jariri guda.',
        'Wannan saukakken tsarin ya kunshi AA, AS, AC, SS, SC da CC kawai. Ba ya tabbatar da genotype, rufe sauran variants ko thalassaemia, auna alamomi ko tsanani, ko yanke hukuncin aure da haihuwa.',
        'Yi amfani da sakamakon dakin gwaji da aka tabbatar, sannan tattauna gwaji, newborn screening da bin diddigi da likita ko mai ba da shawarar kwayoyin gado.', '',
        'Tushen hukuma da aka duba 2026-07-26:',
        '- CDC About Sickle Cell Disease: https://www.cdc.gov/sickle-cell/about/index.html',
        '- CDC Sickle Cell Trait: https://www.cdc.gov/sickle-cell/sickle-cell-trait/',
        '- NIH/NHLBI Sickle Cell Trait: https://www.nhlbi.nih.gov/health/sickle-cell-disease/sickle-cell-trait',
        '- NIH/NHLBI Pregnancy and Reproduction: https://www.nhlbi.nih.gov/health/sickle-cell-disease/pregnancy', '',
        'SIRRI: an kirkira a cikin wannan burauzar; ba a ajiye ko tura zabin ba.'
      ].join('\n');
    }
    wireExports('afrotools-ilimin-gadon-sikila', 'Ilimin gadon sikila', report);
    wireReset('sickle-form', 'app-result', 'lab-confirmed');
    clearOnInput(form, 'app-result');
  }

  var GENOTYPE_METHODS = {
    electrophoresis: 'Gwajin haemoglobin electrophoresis',
    hplc: 'High-performance liquid chromatography (HPLC)',
    ief: 'Isoelectric focusing (IEF)',
    capillary: 'Capillary electrophoresis',
    genetic: 'Gwajin kwayoyin halitta',
    other: 'Wata hanyar da rahoton ya ambata',
    unknown: 'Ba a ambaci hanyar ba ko ba a sani ba'
  };
  var GENOTYPE_STATUS = {
    final: 'Rahoton karshe na dakin gwaji',
    preliminary: 'Sakamakon screening ko na farko',
    unsure: 'Ba a tabbatar ko rahoton karshe ba ne'
  };
  var GENOTYPE_CONTEXT = {
    AA: ['Alamar A / A', 'A wannan saukakken rubutu, haruffan A biyu suna nufin tsarin HbA/HbA. Wannan ba ya kore sauran matsalolin lafiya ko haemoglobin variants da ba a gwada ba.'],
    AS: ['Alamar A / S', 'Tsarin HbA/HbS ana kiransa sickle cell trait. Trait ya bambanta da cutar sikila; cikakken rahoto da kwararren lafiya ne za su tabbatar da sakamakon mutum.'],
    AC: ['Alamar A / C', 'Tsarin HbA/HbC ana kiransa haemoglobin C trait. Fassarar lafiya tana bukatar cikakken rahoton dakin gwaji.'],
    SS: ['Alamar S / S', 'Tsarin HbS/HbS yana da alaka da cutar sikila. Wannan jagora ba ya gano cuta, fassara alamomi ko hasashen tsanani.'],
    SC: ['Alamar S / C', 'Tsarin HbS/HbC yana da alaka da cutar sikila. Wannan jagora ba ya gano cuta, fassara alamomi ko hasashen tsanani.'],
    CC: ['Alamar C / C', 'Tsarin HbC/HbC yana da alaka da cutar haemoglobin C, wadda ba daya take da cutar sikila ba. Kwararren lafiya ya fassara cikakken rahoto.']
  };
  function genotypePresentation(result) {
    var code = result.canonicalCode;
    var flags = [];
    var questions = [];
    if (!code) {
      flags.push('Rubutun yana wajen iyakacin AA, AS, AC, SS, SC da CC na wannan jagora. Kada ka fassara, sauya jerin haruffa ko yin zato.');
      questions.push('Me kowane harafi, lamba ko alama a wannan sakamakon yake nufi?');
      questions.push('Shin sakamakon ya kunshi wani variant ko beta-thalassaemia da wannan jagora bai rufe ba?');
    }
    if (result.testMethod === 'unknown') {
      flags.push('Ba a rubuta hanyar gwajin a nan ba.');
      questions.push('Wace hanyar dakin gwaji ce ta samar da sakamakon, kuma ana bukatar gwajin tabbatarwa?');
    } else if (result.testMethod === 'other') {
      flags.push('Rahoton yana amfani da hanyar da wannan jagora ba ya fassara.');
      questions.push('Shin hanyar da aka rubuta tana tabbatar da sakamakon, kuma mene ne iyakarta?');
    }
    if (result.confirmationStatus !== 'final') {
      flags.push(result.confirmationStatus === 'preliminary' ? 'Sakamakon screening ko na farko na iya bukatar tabbatarwa.' : 'Ba a bayyana ko wannan sakamako ne na karshe da aka tabbatar ba.');
      questions.push('Shin wannan sakamakon karshe ne da dakin gwaji ya tabbatar, ko yana bukatar karin tabbatarwa?');
    }
    if (!byId('test-date').value) questions.push('Yaushe aka yi gwajin, kuma zan iya samun rahoton da ke dauke da kwanan wata?');
    questions.push('Shin cikakken rahoton yana da karin haemoglobin fractions ko sharhi da ya kamata na fahimta?');
    questions.push('Shin likita ko mai ba da shawarar kwayoyin gado zai ba da shawarar bin diddigi ga yanayina?');
    questions.push('Wane newborn screening da gwajin tabbatarwa ake samu a yankina idan yana da alaka da shirin iyali?');
    return {
      label: code ? GENOTYPE_CONTEXT[code][0] : 'Rubutun yana bukatar karin bayani daga dakin gwaji',
      explanation: code ? GENOTYPE_CONTEXT[code][1] : 'Wannan jagora ba zai iya hada wannan rubutu cikin A/S/C cikin aminci ba. Ka bar rahoton yadda yake, ka tambayi dakin gwaji ko likita ya bayyana shi.',
      flags: flags,
      questions: Array.from(new Set(questions))
    };
  }
  function renderList(id, items) {
    var list = byId(id); list.replaceChildren();
    items.forEach(function (item) { var li = document.createElement('li'); li.textContent = item; list.appendChild(li); });
  }
  function mapGenotypeError(message) {
    if (/result notation/i.test(message)) return 'Saka rubutun sakamakon daidai yadda yake a rahoto.';
    if (/test method/i.test(message)) return 'Zabi hanyar gwajin da rahoton ya ambata, ko zabi ba a sani ba.';
    if (/confirmation status/i.test(message)) return 'Zabi matsayin tabbatar da rahoton.';
    if (/future/i.test(message)) return 'Kwanan gwajin ba zai wuce yau ba.';
    if (/valid test date/i.test(message)) return 'Saka ingantaccen kwanan gwaji ko bar shi babu komai.';
    return 'Duba bayanan rahoton da ka shigar.';
  }
  function initGenotype() {
    var engine = window.HaemoglobinResultVerificationEngine;
    var form = byId('genotype-form');
    byId('test-date').max = todayIso();
    form.addEventListener('submit', function (event) {
      event.preventDefault(); clearError('form-error'); hideResult('app-result'); state.current = null;
      if (!engine) return showError('form-error', 'Ma ajiyar jagora ba ta loda ba. Sake bude shafin.');
      var result = engine.verify({
        reportedResult: byId('reported-result').value,
        testMethod: byId('test-method').value,
        testDate: byId('test-date').value,
        confirmationStatus: byId('confirmation-status').value
      });
      if (!result.ok) return showError('form-error', mapGenotypeError(result.error));
      var presentation = genotypePresentation(result);
      result.hausa = presentation;
      state.current = result;
      text('notation-label', presentation.label);
      text('notation-explanation', presentation.explanation);
      text('method-value', GENOTYPE_METHODS[result.testMethod]);
      text('date-value', byId('test-date').value ? formatDate(result.testDate) : 'Ba a rubuta ba');
      text('confirmation-value', GENOTYPE_STATUS[result.confirmationStatus]);
      byId('flags-panel').hidden = presentation.flags.length === 0;
      renderList('flags-list', presentation.flags); renderList('questions-list', presentation.questions);
      showResult('app-result');
    });
    function report() {
      var r = state.current; if (!r) return '';
      var lines = [
        'AFROTOOLS - JERIN TABBATAR DA SAKAMAKON HAEMOGLOBIN', '',
        'Rubutun rahoto: ' + r.reportedResult,
        'Matsayin jagora: ' + r.hausa.label,
        'Hanyar gwaji: ' + GENOTYPE_METHODS[r.testMethod],
        'Kwanan gwaji: ' + (byId('test-date').value || 'Ba a rubuta ba'),
        'Matsayin rahoto: ' + GENOTYPE_STATUS[r.confirmationStatus], '',
        'Bayani cikin saukin Hausa:', r.hausa.explanation
      ];
      if (r.hausa.flags.length) { lines.push('', 'Abubuwan da za a tabbatar:'); r.hausa.flags.forEach(function (flag) { lines.push('- ' + flag); }); }
      lines.push('', 'Tambayoyin da za a kai dakin gwaji, likita ko mai ba da shawarar kwayoyin gado:');
      r.hausa.questions.forEach(function (question) { lines.push('- ' + question); });
      lines.push('', 'IYAKA: Wannan jeri yana tsara tambayoyin tabbatar da rahoto. Ba ya tabbatar da sakamako, gano cuta, fassara alamomi, hasashen tsanani ko lissafa gado.', 'An duba tushen hukuma: 2026-07-26.', 'SIRRI: an kirkira a cikin wannan burauzar; ba a ajiye ko tura bayanan ba.');
      return lines.join('\n');
    }
    wireExports('afrotools-tabbatar-da-haemoglobin', 'Jerin tabbatar da sakamakon haemoglobin', report);
    wireReset('genotype-form', 'app-result', 'reported-result');
    clearOnInput(form, 'app-result');
  }

  var BIRTH_ITEMS = {
    plannedCare: 'Farashin kulawar haihuwa daga asibiti',
    professionalFees: 'Kudin kwararru, dakin tiyata ko anaesthesia daban',
    medicinesSupplies: 'Magunguna, jini ko kayayyaki',
    testsCare: 'Gwaje-gwaje, kulawar jariri ko bayan haihuwa',
    transportStay: 'Sufuri, masauki ko tallafi',
    contingency: 'Ajiyar gidan iyali'
  };
  var BIRTH_SOURCES = {
    'written-provider': 'Rubutaccen farashi daga asibiti',
    'written-payer': 'Rubutaccen tabbaci daga mai inshora ko mai biya',
    'verbal-provider': 'Farashin baki daga asibiti da za a tabbatar a rubuce',
    'household-assumption': 'Hasashen kasafin gida, ba tabbacin asibiti ba'
  };
  function mapBirthError(message) {
    if (/3-letter currency/i.test(message)) return 'Saka lambar kudin kasa mai haruffa uku.';
    if (/supported figure source/i.test(message)) return 'Zabi ingantaccen tushen adadin.';
    if (/valid quote date/i.test(message)) return 'Saka ingantaccen kwanan farashi ko hasashe.';
    if (/future/i.test(message)) return 'Kwanan farashi ba zai wuce yau ba.';
    if (/at least one cost/i.test(message)) return 'Saka akalla adadin kudi guda daya da ya fi sifili.';
    if (/contribution cannot exceed/i.test(message)) return 'Gudummawar mai biya ba za ta wuce jimillar kudin da aka shigar ba.';
    if (/must be zero or a positive/i.test(message)) return 'Kowane adadi ya zama sifili ko sama, da lambobi biyu kacal bayan digo.';
    if (/must not exceed/i.test(message)) return 'Adadin ya wuce iyakar da kayan aikin ke karba.';
    return 'Duba duk adadin da kwanan wata da ka shigar.';
  }
  function initChildbirth() {
    var engine = window.AfroTools && window.AfroTools.childbirthBudgetEngine;
    var form = byId('childbirth-form');
    byId('quote-date').max = todayIso();
    form.addEventListener('submit', function (event) {
      event.preventDefault(); clearError('form-error'); hideResult('app-result'); state.current = null;
      if (!engine) return showError('form-error', 'Ma ajiyar lissafi ba ta loda ba. Sake bude shafin.');
      var input = {
        currency: byId('currency-code').value,
        quoteDate: byId('quote-date').value,
        sourceType: byId('source-type').value,
        confirmedContribution: byId('confirmed-contribution').value,
        asOf: todayIso()
      };
      Object.keys(BIRTH_ITEMS).forEach(function (key) { input[key] = byId(key).value; });
      var result = engine.calculate(input);
      if (!result.valid) return showError('form-error', mapBirthError(result.error));
      state.current = result;
      text('gross-total', formatCents(result.grossCents, result.currency));
      text('contribution-total', formatCents(result.contributionCents, result.currency));
      text('household-total', formatCents(result.householdCents, result.currency));
      text('freshness-badge', result.ageDays <= 30 ? 'Sabon adadi: kwanaki ' + result.ageDays : result.ageDays <= 90 ? 'A sake tabbatarwa: kwanaki ' + result.ageDays : 'Ana bukatar sabon farashi: kwanaki ' + result.ageDays);
      text('source-summary', BIRTH_SOURCES[result.sourceType] + ', mai kwanan ' + formatDate(result.quoteDate) + '.');
      var list = byId('breakdown-list'); list.replaceChildren();
      result.lineItems.forEach(function (item) {
        var li = document.createElement('li'); var label = document.createElement('span'); var amount = document.createElement('strong');
        label.textContent = BIRTH_ITEMS[item.id]; amount.textContent = formatCents(item.cents, result.currency); li.append(label, amount); list.appendChild(li);
      });
      showResult('app-result');
    });
    function report() {
      var r = state.current; if (!r) return '';
      return [
        'AFROTOOLS - KASAFIN HAIHUWA DAGA FARASHIN ASIBITI', '',
        'Tushen adadi: ' + BIRTH_SOURCES[r.sourceType],
        'Kwanan farashi ko hasashe: ' + formatDate(r.quoteDate),
        'Shekarun adadi lokacin lissafi: kwanaki ' + r.ageDays,
        'Kudin kasa: ' + r.currency, '',
        'Adadin da aka shigar:',
        r.lineItems.map(function (item) { return '- ' + BIRTH_ITEMS[item.id] + ': ' + formatCents(item.cents, r.currency); }).join('\n'), '',
        'Jimillar kudin da mai amfani ya shigar: ' + formatCents(r.grossCents, r.currency),
        'Gudummawar mai biya da aka tabbatar: ' + formatCents(r.contributionCents, r.currency),
        'Adadin da gida zai tanada: ' + formatCents(r.householdCents, r.currency), '',
        'IYAKA: Kowane adadi mai amfani ne ya shigar. Lissafi ne, ba farashin asibiti, tabbacin inshora ko shawarar kulawa ba.',
        'Sifili yana nufin ba a shigar da adadi ba, ba yana nufin kulawa kyauta ba.',
        'Tabbatar da tsarin kulawa, ingancin farashi, abubuwan da ya kunsa da inshora kai tsaye. Kulawar da ba a zata ba na iya canza kudi.',
        'Kasafin kudi kada ya jinkirta kulawar haihuwa da ake bukata ko ta gaggawa.',
        'Tushen hukuma: WHO universal health coverage; WHO financial protection; WHO maternal mortality.',
        'An duba tushe: 2026-07-26.',
        'SIRRI: an kirkira a cikin wannan burauzar. Babu account, email, upload, analytics ko ajiyar bayanai.'
      ].join('\n');
    }
    wireExports('afrotools-kasafin-haihuwa', 'Kasafin haihuwa daga farashin asibiti', report);
    wireReset('childbirth-form', 'app-result', 'currency-code');
    clearOnInput(form, 'app-result');
  }

  function mapMedicineError(message) {
    if (/quote date/i.test(message)) return 'Saka ingantaccen kwanan farashin kantin magani.';
    if (/currency code/i.test(message)) return 'Saka lambar kudin kasa mai haruffa uku.';
    if (/Enter medicine label name/i.test(message)) return 'Saka ainihin sunan magani da ke jikin takarda.';
    if (/Enter strength/i.test(message)) return 'Saka karfin magani daidai yadda aka rubuta.';
    if (/Enter dosage form/i.test(message)) return 'Saka nau in magani daidai yadda aka rubuta.';
    if (/pharmacy\/reference/i.test(message)) return 'Saka sunan kantin magani ko lambar farashi ga duka bangarorin.';
    if (/whole number|between/i.test(message)) return 'Duba adadin, girman kwalin da farashi; su kasance cikin iyakar da aka nuna.';
    return 'Duba ainihin magani da duk farashin da ka shigar.';
  }
  function initMedicine() {
    var engine = window.ExactMedicineCompareEngine;
    var form = byId('medicine-form');
    byId('quote-date').value = todayIso();
    form.addEventListener('submit', function (event) {
      event.preventDefault(); clearError('form-error'); hideResult('app-result'); state.current = null;
      if (!engine) return showError('form-error', 'Ma ajiyar lissafi ba ta loda ba. Sake bude shafin.');
      try {
        var r = engine.calculate(Object.fromEntries(new FormData(form).entries())); state.current = r;
        ['a', 'b'].forEach(function (key) {
          text(key + '-title', r[key].provider); text(key + '-total', formatMoney(r[key].totalCost, r.currency));
          text(key + '-detail', 'Akwati ' + r[key].packsNeeded + ' cikakku; ragowar guda ' + r[key].unusedUnits + '.');
        });
        text('difference', 'Bambancin kudin gaba daya: ' + formatMoney(r.difference, r.currency) + '.');
        text('result-assumptions', 'An ce duka farashin sun dace da ' + r.medicine + ', ' + r.strength + ', ' + r.dosageForm + '; kwanan farashi ' + formatDate(r.quoteDate) + '.');
        showResult('app-result');
      } catch (error) { showError('form-error', mapMedicineError(error && error.message || '')); }
    });
    function report() {
      var r = state.current; if (!r) return '';
      return [
        'AFROTOOLS - KWATANCEN FARASHIN AINIHIN MAGANI',
        'Ainihin magani: ' + r.medicine + ' | ' + r.strength + ' | ' + r.dosageForm,
        'Kwanan farashi: ' + r.quoteDate,
        'Yawan da aka ce a saya: ' + r.requiredUnits, '',
        r.a.provider + ': akwati ' + r.a.packsNeeded + ', jimilla ' + formatMoney(r.a.totalCost, r.currency) + ', ragowar guda ' + r.a.unusedUnits,
        r.b.provider + ': akwati ' + r.b.packsNeeded + ', jimilla ' + formatMoney(r.b.totalCost, r.currency) + ', ragowar guda ' + r.b.unusedUnits,
        'Bambancin kudi: ' + formatMoney(r.difference, r.currency), '',
        'IYAKA: Lissafin farashin wannan ainihin samfur ne kawai. Ba shawarar canza magani, dose, substitution ko therapeutic equivalence ba ce.',
        'SABUNTAWA: kwanan farashi na sama ne tushen sabuntawa; sake tabbatarwa da kantin magani.',
        'SIRRI: an kirkira a cikin wannan burauzar; ba a ajiye ko tura bayanan ba.'
      ].join('\n');
    }
    wireExports('afrotools-kwatancen-ainihin-magani', 'Kwatancen farashin ainihin magani', report);
    wireReset('medicine-form', 'app-result', 'medicine');
    clearOnInput(form, 'app-result');
  }

  function mapMealError(message) {
    if (/currency code/i.test(message)) return 'Saka lambar kudin kasa mai haruffa uku.';
    if (/date prices were checked|real calendar date/i.test(message)) return 'Saka ingantaccen kwanan da aka duba farashin abinci.';
    if (/whole number|between/i.test(message)) return 'Duba kwanaki, mutane, adadin abinci, kasafi da ajiya; su kasance cikin iyakar da aka nuna.';
    return 'Duba bayanan tsarin abinci da kasafin da ka shigar.';
  }
  function initMeal() {
    var engine = window.MealLogisticsEngine;
    var form = byId('meal-form'); byId('price-date').value = todayIso();
    form.addEventListener('submit', function (event) {
      event.preventDefault(); clearError('form-error'); hideResult('app-result'); state.current = null;
      if (!engine) return showError('form-error', 'Ma ajiyar lissafi ba ta loda ba. Sake bude shafin.');
      try {
        var r = engine.calculate(Object.fromEntries(new FormData(form).entries())); state.current = r;
        text('result-total', formatMoney(r.totalBudget, r.currency));
        text('servings-total', r.totalServings + ' hidimar abinci da aka shirya.');
        text('base-total', 'Kasafi na asali ' + formatMoney(r.baseBudget, r.currency) + ' + ajiya ' + formatMoney(r.bufferAmount, r.currency) + '.');
        text('result-assumptions', 'An dogara da farashin da aka duba ' + formatDate(r.priceDate) + '; maye gurbinsa da sabon farashin yankinka.');
        showResult('app-result');
      } catch (error) { showError('form-error', mapMealError(error && error.message || '')); }
    });
    function report() {
      var r = state.current; if (!r) return '';
      return [
        'AFROTOOLS - TSARIN HIDIMAR ABINCI DA KASAFI',
        'Kwanan duba farashi: ' + r.priceDate,
        'Kudin kasa: ' + r.currency,
        'Mutane: ' + r.people,
        'Kwanaki: ' + r.days,
        'Abinci ga mutum a rana: ' + r.mealsPerDay,
        'Jimillar hidimar abinci: ' + r.totalServings,
        'Kasafi na asali: ' + formatMoney(r.baseBudget, r.currency),
        'Ajiyar sayayya: ' + formatMoney(r.bufferAmount, r.currency),
        'Jimillar kasafi: ' + formatMoney(r.totalBudget, r.currency), '',
        'Bayanan mai amfani:', r.notes || 'Ba a shigar da bayani ba.', '',
        'IYAKA: Jadawali da farashin da mai amfani ya zaba ne kawai. Ba ya tsara irin abinci, diet, calories, bukatar lafiya ko magani.',
        'SABUNTAWA: ingancin kasafi ya dogara da farashin yankinka da kwanan da ke sama.',
        'SIRRI: an kirkira a cikin wannan burauzar; ba a ajiye ko tura bayanan ba.'
      ].join('\n');
    }
    wireExports('afrotools-tsarin-abinci-da-kasafi', 'Tsarin hidimar abinci da kasafi', report);
    wireReset('meal-form', 'app-result', 'days');
    clearOnInput(form, 'app-result');
  }

  var initializers = {
    hospital: initHospital,
    sickle: initSickle,
    genotype: initGenotype,
    childbirth: initChildbirth,
    medicine: initMedicine,
    meal: initMeal
  };
  if (initializers[app]) initializers[app]();

  window.HausaHealthParity = {
    app: app,
    getCurrent: function () { return state.current; },
    privacyContract: 'local-only-no-storage-no-input-network'
  };
}());
