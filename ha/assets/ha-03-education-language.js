(function (root) {
  'use strict';

  var document = root.document;
  if (!document) return;

  function byId(id) {
    return document.getElementById(id);
  }

  function text(value) {
    return String(value === null || value === undefined ? '' : value);
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function finite(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat('ha-NG', {
      maximumFractionDigits: digits === undefined ? 2 : digits,
      minimumFractionDigits: 0
    }).format(finite(value, 0));
  }

  function formatMoney(value, currency) {
    try {
      return new Intl.NumberFormat('ha-NG', {
        style: 'currency',
        currency: text(currency || 'NGN').toUpperCase(),
        maximumFractionDigits: 2
      }).format(finite(value, 0));
    } catch (_) {
      return text(currency || 'NGN').toUpperCase() + ' ' + formatNumber(value, 2);
    }
  }

  function safeUrl(value) {
    try {
      var url = new URL(text(value));
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function showError(message, target) {
    var error = target || byId('ha03Error');
    if (error) error.textContent = text(message);
  }

  function clearError(target) {
    showError('', target);
  }

  function showStatus(message, target) {
    var status = target || byId('ha03Status');
    if (status) status.textContent = text(message);
  }

  function showResult(html, target) {
    var result = target || byId('ha03Result');
    if (!result) return;
    result.innerHTML = html;
    result.setAttribute('data-visible', 'true');
  }

  function clearResult(target) {
    var result = target || byId('ha03Result');
    if (!result) return;
    result.removeAttribute('data-visible');
    result.innerHTML = '';
  }

  function firstField(form) {
    return form && form.querySelector('input:not([type="hidden"]), select, textarea, button');
  }

  function markInvalid(control, message) {
    if (control) {
      control.setAttribute('aria-invalid', 'true');
      if (typeof control.focus === 'function') control.focus();
    }
    showError(message);
  }

  function clearInvalid(form) {
    if (!form) return;
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (control) {
      control.removeAttribute('aria-invalid');
    });
  }

  function downloadText(filename, content, statusTarget) {
    var blob = new Blob(['\ufeff' + text(content)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    showStatus('An sauke fayil ɗin TXT a wannan na’ura. Ba a aika bayananka ko’ina ba.', statusTarget);
  }

  function bindExport(getPayload, filename) {
    var button = document.querySelector('[data-ha03-export]');
    if (!button) return;
    button.addEventListener('click', function () {
      var payload = getPayload();
      if (!payload) {
        showError('Yi lissafi ko bincike da farko kafin sauke TXT.');
        return;
      }
      clearError();
      downloadText(filename, payload);
    });
  }

  function bindReset(form, resetExtra) {
    var button = document.querySelector('[data-ha03-reset]');
    if (!button || !form) return;
    button.addEventListener('click', function () {
      form.reset();
      clearInvalid(form);
      clearError();
      clearResult();
      showStatus('An goge bayanan fom ɗin a wannan shafin.');
      if (typeof resetExtra === 'function') resetExtra();
      var field = firstField(form);
      if (field) field.focus();
    });
  }

  function initThemeToggle() {
    var shell = document.querySelector('.ha03-shell');
    if (!shell || shell.querySelector('[data-ha03-theme]')) return;
    var media = typeof root.matchMedia === 'function' ? root.matchMedia('(prefers-color-scheme: dark)') : null;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ha03-theme';
    button.setAttribute('data-ha03-theme', '');

    function isDark() {
      var chosen = document.documentElement.getAttribute('data-theme');
      if (chosen) return chosen === 'dark';
      return Boolean(media && media.matches);
    }

    function label() {
      var dark = isDark();
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.textContent = dark ? 'Canja zuwa yanayin haske' : 'Canja zuwa yanayin duhu';
    }

    button.addEventListener('click', function () {
      document.documentElement.setAttribute('data-theme', isDark() ? 'light' : 'dark');
      label();
    });
    if (media && typeof media.addEventListener === 'function') media.addEventListener('change', label);
    shell.insertBefore(button, shell.firstChild);
    label();
  }

  function initWaec() {
    var form = byId('ha03Form');
    var system = byId('waecSystem');
    var engine = root.WAECPlannerEngine;
    var exportText = '';
    if (!form || !engine) {
      showError('Injin WAEC/NECO bai samu ba. Sake loda shafin.');
      return;
    }

    function configureSubjects() {
      var ghana = system.value.indexOf('gh-') === 0;
      var mathematics = document.querySelector('[data-waec-key="Mathematics"]');
      var mathLabel = mathematics && mathematics.querySelector('[data-subject-label]');
      if (mathematics) mathematics.setAttribute('data-engine-subject', ghana ? 'Core Mathematics' : 'Mathematics');
      if (mathLabel) mathLabel.textContent = ghana ? 'Babban Lissafi' : 'Lissafi';
      byId('waecPathwayHelp').hidden = !ghana;
    }

    function subjectLabel(name) {
      return {
        'English Language': 'Turanci',
        Mathematics: 'Lissafi',
        'Core Mathematics': 'Babban Lissafi',
        'Integrated Science': 'Kimiyyar haɗaka',
        'Social Studies': 'Nazarin zamantakewa'
      }[name] || name;
    }

    function rows() {
      return Array.prototype.map.call(document.querySelectorAll('[data-waec-row]'), function (row) {
        var nameInput = row.querySelector('[data-waec-name]');
        return {
          name: nameInput ? nameInput.value.trim() : row.getAttribute('data-engine-subject'),
          grade: row.querySelector('[data-waec-grade]').value,
          compulsory: row.hasAttribute('data-waec-compulsory')
        };
      }).filter(function (row) { return row.name || row.grade; });
    }

    function translateCheck(label) {
      var labels = {
        'Five credit-level results recorded': 'An shigar da aƙalla sakamakon kiredit biyar',
        'English Language credit recorded': 'An shigar da kiredit na Turanci',
        'Mathematics credit recorded': 'An shigar da kiredit na Lissafi',
        'Core Mathematics credit recorded': 'An shigar da kiredit na Babban Lissafi',
        'Integrated Science credit recorded': 'An shigar da kiredit na Kimiyyar haɗaka',
        'Social Studies credit recorded': 'An shigar da kiredit na Nazarin zamantakewa',
        'Three elective credits recorded': 'An shigar da kiredit na darussan zaɓi uku'
      };
      return labels[label] || 'An duba sharadin darasi';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var inputRows = rows();
      var result = system.value === 'ng'
        ? engine.calculateNigeria(inputRows)
        : engine.calculateGhana(inputRows, system.value === 'gh-non-science' ? 'non-science' : 'science');
      if (!result.complete) {
        var empty = form.querySelector('[data-waec-grade]:not([value])') || form.querySelector('[data-waec-grade]');
        markInvalid(empty, system.value === 'ng'
          ? 'Cika aƙalla darussa biyar da maki domin samun tsarin darussa biyar mafi kyau.'
          : 'Cika darussan wajibi uku da darussan zaɓi uku domin samun jimillar Ghana.');
        exportText = '';
        return;
      }
      var selected = result.selected.map(function (row) {
        return '<li>' + escapeHtml(subjectLabel(row.name)) + ': ' + escapeHtml(row.grade) + ' — maki ' + formatNumber(row.points, 0) + '</li>';
      }).join('');
      var checks = result.checks.map(function (check) {
        return '<li>' + (check.pass ? 'Ya cika: ' : 'Bai cika ba: ') + escapeHtml(translateCheck(check.label)) + '</li>';
      }).join('');
      showResult(
        '<strong class="ha03-number">' + formatNumber(result.value, 0) + '</strong>' +
        '<p>' + (system.value === 'ng' ? 'Ma’aunin shiri na darussa biyar mafi ƙanƙantar maki.' : 'Jimillar shiri ta WASSCE: darussan wajibi uku da na zaɓi uku.') + '</p>' +
        '<h3>Darussan da aka ƙirga</h3><ul>' + selected + '</ul>' +
        '<h3>Binciken shiri</h3><ul>' + checks + '</ul>' +
        '<p><strong>Iyaka:</strong> Wannan ba jimillar hukuma ko hukuncin cancantar shiga ba ne. JAMB, makaranta ko shirin karatu ne ke tantance haɗin darussa.</p>'
      );
      exportText = [
        'AfroTools Hausa — Tsarin WAEC/NECO/WASSCE',
        'Tsari: ' + system.options[system.selectedIndex].text,
        'Sakamakon shiri: ' + result.value,
        'Darussan da aka ƙirga:',
        result.selected.map(function (row) { return '- ' + subjectLabel(row.name) + ': ' + row.grade + ' (maki ' + row.points + ')'; }).join('\n'),
        '',
        'Ba jimillar hukuma ko hukuncin cancantar shiga ba ne.',
        'Tushen dubawa: https://eligibility.jamb.gov.ng/ da https://waecgh.org/home/wassce-school/',
        'An duba iyakar tushe: 2026-07-26.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    system.addEventListener('change', configureSubjects);
    configureSubjects();
    bindExport(function () { return exportText; }, 'afrotools-ha-waec-neco-tsarin.txt');
    bindReset(form, function () { exportText = ''; configureSubjects(); });
  }

  function initJamb() {
    var form = byId('ha03Form');
    var engine = root.JambAggregateEngine;
    var exportText = '';
    if (!form || !engine) {
      showError('Injin lissafin JAMB bai samu ba. Sake loda shafin.');
      return;
    }
    var errorMap = {
      'UTME score must be between 0 and 400.': 'Makin UTME dole ya kasance daga 0 zuwa 400.',
      'Post-UTME score must be between 0 and 100.': 'Makin Post-UTME dole ya kasance daga 0 zuwa 100.',
      'Enter non-negative UTME and Post-UTME weights.': 'Shigar da nauyin UTME da Post-UTME da ba su ƙasa da sifili ba.',
      'UTME and Post-UTME weights must add up to 100%.': 'Nauyin UTME da Post-UTME dole su zama 100% idan an haɗa.',
      'The published benchmark must be between 0 and 100.': 'Ma\'aunin kwatanci da makaranta ta wallafa dole ya kasance daga 0 zuwa 100.'
    };
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var result = engine.calculate({
        utme: byId('jambUtme').value,
        postUtme: byId('jambPostUtme').value,
        utmeWeight: byId('jambUtmeWeight').value,
        postUtmeWeight: byId('jambPostWeight').value,
        benchmark: byId('jambBenchmark').value
      });
      if (!result.ok) {
        var control = byId('jambUtme');
        if (/Post-UTME score/.test(result.error)) control = byId('jambPostUtme');
        if (/weights/.test(result.error)) control = byId('jambUtmeWeight');
        if (/benchmark/.test(result.error)) control = byId('jambBenchmark');
        markInvalid(control, errorMap[result.error] || 'Duba makin da nauyin da ka shigar.');
        exportText = '';
        return;
      }
      var comparison = result.difference === null
        ? 'Ba a shigar da ma\'aunin kwatanci ba.'
        : result.difference >= 0
          ? 'Ya fi ma\'aunin kwatancin da ka shigar da ' + formatNumber(result.difference, 2) + ' maki.'
          : 'Ya gaza ma\'aunin kwatancin da ka shigar da ' + formatNumber(Math.abs(result.difference), 2) + ' maki.';
      showResult(
        '<strong class="ha03-number">' + formatNumber(result.aggregate, 2) + '%</strong>' +
        '<dl class="ha03-kv"><dt>UTME bayan raba 400 zuwa 100</dt><dd>' + formatNumber(result.normalizedUtme, 2) + '</dd>' +
        '<dt>Gudummawar UTME</dt><dd>' + formatNumber(result.utmeContribution, 2) + '</dd>' +
        '<dt>Gudummawar Post-UTME</dt><dd>' + formatNumber(result.postUtmeContribution, 2) + '</dd></dl>' +
        '<p>' + escapeHtml(comparison) + '</p>' +
        '<p><strong>Iyaka:</strong> Wannan takardar lissafi tana amfani ne da nauyin da kai ka tabbatar daga makaranta. Ba ta ba da dabara, makin iyaka, cancanta ko tabbacin samun gurbin karatu.</p>'
      );
      exportText = [
        'AfroTools Hausa — Takardar lissafin JAMB',
        'UTME: ' + result.utme + '/400',
        'Post-UTME: ' + result.postUtme + '/100',
        'Nauyi: UTME ' + result.utmeWeight + '%, Post-UTME ' + result.postUtmeWeight + '%',
        'Jimillar shiri: ' + result.aggregate.toFixed(2) + '%',
        comparison,
        '',
        'Dabara da ma’aunin kwatanci sun fito daga abin da mai amfani ya shigar; tabbatar da su daga makaranta.',
        'JAMB IBASS: https://eligibility.jamb.gov.ng/',
        'JAMB: https://www.jamb.gov.ng/',
        'An duba iyakar tushe: 2026-07-26.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-jimillar-jamb.txt');
    bindReset(form, function () { exportText = ''; });
  }

  function initGpa() {
    var form = byId('ha03Form');
    var courses = byId('gpaCourses');
    var engine = root.AfroGpaEngine;
    var exportText = '';
    var nextCourse = 4;
    if (!form || !courses || !engine) {
      showError('Injin GPA bai samu ba. Sake loda shafin.');
      return;
    }

    function courseMarkup(index) {
      return '<div class="ha03-course" data-gpa-course>' +
        '<div class="ha03-field"><label for="gpaName' + index + '">Sunan kwas</label><input id="gpaName' + index + '" data-gpa-name autocomplete="off"></div>' +
        '<div class="ha03-field"><label for="gpaCredit' + index + '">Raka’o’i</label><input id="gpaCredit' + index + '" data-gpa-credit type="number" min="0.5" max="100" step="0.5"></div>' +
        '<div class="ha03-field"><label for="gpaValue' + index + '">Maki ko daraja</label><input id="gpaValue' + index + '" data-gpa-value autocomplete="off"></div>' +
        '<button class="ha03-course-remove" type="button" data-gpa-remove aria-label="Cire wannan kwas">Cire</button>' +
        '</div>';
    }

    byId('gpaAddCourse').addEventListener('click', function () {
      if (courses.querySelectorAll('[data-gpa-course]').length >= 20) {
        showError('Ana iya ƙara kwas har guda 20 a wannan fom.');
        return;
      }
      clearError();
      courses.insertAdjacentHTML('beforeend', courseMarkup(nextCourse));
      byId('gpaName' + nextCourse).focus();
      nextCourse += 1;
    });
    courses.addEventListener('click', function (event) {
      var button = event.target.closest('[data-gpa-remove]');
      if (!button) return;
      if (courses.querySelectorAll('[data-gpa-course]').length <= 1) {
        showError('A bar aƙalla layin kwas ɗaya.');
        return;
      }
      button.closest('[data-gpa-course]').remove();
      clearError();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var template = engine.getTemplate(byId('gpaTemplate').value, byId('gpaScale').value);
      var inputCourses = Array.prototype.map.call(courses.querySelectorAll('[data-gpa-course]'), function (row) {
        return {
          name: row.querySelector('[data-gpa-name]').value.trim(),
          credits: row.querySelector('[data-gpa-credit]').value,
          value: row.querySelector('[data-gpa-value]').value.trim()
        };
      });
      var result = engine.calculateSemester(inputCourses, template);
      if (!result.validCourses || result.invalidCourses.length) {
        var invalidIndex = result.invalidCourses.length ? result.invalidCourses[0] : 0;
        var invalidRow = courses.querySelectorAll('[data-gpa-course]')[invalidIndex];
        markInvalid(invalidRow && invalidRow.querySelector('[data-gpa-value]'), 'Cika aƙalla kwas ɗaya; raka’o’i su fi sifili kuma maki ko daraja ya dace da tsarin da ka zaɓa.');
        exportText = '';
        return;
      }
      var previousAverage = finite(byId('gpaPreviousAverage').value, 0);
      var previousCredits = finite(byId('gpaPreviousCredits').value, 0);
      if (previousAverage < 0 || previousAverage > template.scale || previousCredits < 0) {
        markInvalid(byId('gpaPreviousAverage'), 'Matsakaicin baya dole ya dace da iyakar tsarin; raka’o’in baya ba su ƙasa da sifili ba.');
        exportText = '';
        return;
      }
      var cumulativeCredits = previousCredits + result.totalCredits;
      var cumulative = cumulativeCredits > 0
        ? (previousAverage * previousCredits + result.totalPoints) / cumulativeCredits
        : result.average;
      var unit = template.kind === 'score' ? 'matsakaici' : 'GPA';
      showResult(
        '<strong class="ha03-number">' + formatNumber(result.average, 3) + ' / ' + formatNumber(template.scale, 1) + '</strong>' +
        '<p>' + unit + ' na wannan zangon bisa raka’o’i.</p>' +
        '<dl class="ha03-kv"><dt>Jimillar raka’o’in zango</dt><dd>' + formatNumber(result.totalCredits, 2) + '</dd>' +
        '<dt>Jimillar makin daraja mai nauyi</dt><dd>' + formatNumber(result.totalPoints, 3) + '</dd>' +
        '<dt>CGPA/matsakaicin haɗe</dt><dd>' + formatNumber(cumulative, 3) + ' / ' + formatNumber(template.scale, 1) + '</dd></dl>' +
        '<p><strong>Iyaka:</strong> Teburin haruffa misali ne kawai. Jami’a ce ke yanke tsarin maki, zagaye lamba, sake kwas da rabon daraja.</p>'
      );
      exportText = [
        'AfroTools Hausa — Takardar lissafin GPA/CGPA',
        'Tsari: ' + byId('gpaTemplate').options[byId('gpaTemplate').selectedIndex].text + ' (iyaka ' + template.scale + ')',
        'GPA/matsakaicin zango: ' + result.average.toFixed(3),
        'CGPA/matsakaicin haɗe: ' + cumulative.toFixed(3),
        'Raka’o’in zango: ' + result.totalCredits,
        '',
        'Kwas:',
        inputCourses.filter(function (row) { return row.name || row.credits || row.value; }).map(function (row) {
          return '- ' + (row.name || 'Kwas') + ': raka’o’i ' + row.credits + ', maki ko daraja ' + row.value;
        }).join('\n'),
        '',
        'Teburin misali ba dokar jami’a ko sauya darajar takardar karatu ba ne.',
        'An duba iyakar aikin tushe: 2026-07-26.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-gpa-cgpa.txt');
    bindReset(form, function () {
      exportText = '';
      courses.innerHTML = courseMarkup(1) + courseMarkup(2) + courseMarkup(3);
      nextCourse = 4;
    });
  }

  function initSchoolFees() {
    var form = byId('ha03Form');
    var engine = root.AfroTools && root.AfroTools.schoolFeesEngine;
    var exportText = '';
    if (!form || !engine) {
      showError('Injin kuɗin makaranta bai samu ba. Sake loda shafin.');
      return;
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var result = engine.calculate({
        school: byId('feesSchool').value,
        currency: byId('feesCurrency').value,
        tuition: byId('feesTuition').value,
        extras: byId('feesExtras').value,
        monthlySupport: byId('feesSupport').value,
        rhythm: byId('feesRhythm').value
      });
      if (!result.ok) {
        markInvalid(byId('feesTuition'), 'Duba lambar kuɗi, kuɗin shekara, ƙarin caji, tallafin wata da tsarin biyan kuɗi. Aƙalla kuɗin karatu ko ƙarin caji ya fi sifili.');
        exportText = '';
        return;
      }
      var band = {
        unknown: 'Ana bukatar tallafin wata domin kwatanci',
        high: 'Nauyin ajiyar ya yi yawa',
        stretch: 'Nauyin ajiyar yana da tsauri',
        lower: 'Nauyin ajiyar ya fi sauƙi'
      }[result.band];
      var ratio = result.ratio === null ? 'Ba a lissafa ba' : formatNumber(result.ratio * 100, 1) + '% na tallafin wata';
      showResult(
        '<strong class="ha03-number">' + escapeHtml(formatMoney(result.annual, result.currency)) + '</strong>' +
        '<p>Jimillar kuɗin karatu da ƙarin caji na shekara da kai ka shigar.</p>' +
        '<dl class="ha03-kv"><dt>Ajiyar da ake bukata kowane wata</dt><dd>' + escapeHtml(formatMoney(result.monthlyReserve, result.currency)) + '</dd>' +
        '<dt>Kowane kashi na biyan kuɗi</dt><dd>' + escapeHtml(formatMoney(result.paymentChunk, result.currency)) + '</dd>' +
        '<dt>Alamar nauyi</dt><dd>' + escapeHtml(band) + ' — ' + escapeHtml(ratio) + '</dd></dl>' +
        '<p><strong>Iyaka:</strong> Wannan hasashen shiri ne daga adadin da ka shigar, ba takardar farashi, hukuncin iya ɗaukar nauyi ko shawarar kuɗi ba.</p>'
      );
      exportText = [
        'AfroTools Hausa — Tsarin kuɗin makaranta',
        'Makaranta/zabi: ' + result.school,
        'Kuɗin karatu na shekara: ' + formatMoney(result.tuition, result.currency),
        'Ƙarin caji na shekara: ' + formatMoney(result.extras, result.currency),
        'Jimilla: ' + formatMoney(result.annual, result.currency),
        'Ajiyar wata: ' + formatMoney(result.monthlyReserve, result.currency),
        'Kowane kashi: ' + formatMoney(result.paymentChunk, result.currency),
        'Nauyi: ' + band + ' — ' + ratio,
        '',
        'Tabbatar da takardar kuɗin makaranta, rajista, littattafai, kayan ɗalibai, sufuri, abinci, ƙarin caji, ranakun biya da maido da kuɗi daga makaranta.',
        'Kiyasin shiri kawai; adadin duk daga mai amfani ne.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-kudin-makaranta.txt');
    bindReset(form, function () { exportText = ''; });
  }

  function initScholarships() {
    var form = byId('ha03Form');
    var feedApi = root.AfroScholarshipFeed;
    var matcher = root.ScholarshipMatcher;
    var feed = [];
    var feedMeta = null;
    var exportText = '';
    var loading = byId('scholarshipLoading');
    var results = byId('scholarshipResults');
    var submit = form && form.querySelector('[type="submit"]');
    if (!form || !feedApi || !matcher) {
      showError('Ba a samu injin bayanan tallafin karatu ba. Sake loda shafin.');
      return;
    }

    function modeLabel(mode) {
      return {
        live: 'Bayanan kai-tsaye daga API',
        cached: 'Bayanan da aka ajiye daga binciken baya',
        curated: 'Jerin da AfroTools ya tace',
        fallback: 'Ƙaramin jerin madadin da aka tace'
      }[mode] || 'Ba a bayyana yanayin bayanai ba';
    }

    function checkedLabel(meta) {
      var raw = meta && (meta.lastCheckedAt || meta.cachedAt);
      if (!raw) return 'Ba a samu ranar bincike a martanin bayanan ba.';
      var date = new Date(raw);
      return Number.isNaN(date.getTime())
        ? 'Ba a iya karanta ranar binciken bayanan ba.'
        : 'An bincika ko an ajiye bayanan: ' + new Intl.DateTimeFormat('ha-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(date) + '.';
    }

    function deadlineLabel(row) {
      if (row && row.deadline_date) {
        var date = new Date(row.deadline_date);
        if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('ha-NG', { dateStyle: 'long' }).format(date);
      }
      return 'Ba a tabbatar da takamaiman ranar wannan zagaye ba; duba shafin mai bayarwa.';
    }

    function sourceLink(row) {
      return safeUrl(row && (row.application_url || row.info_url || row.source_url));
    }

    function runMatch() {
      if (!feed.length) {
        showError('Har yanzu ba a samu jerin tallafin karatu ba. Sake gwadawa bayan bayanan sun loda.');
        return;
      }
      clearError();
      showStatus('');
      var level = byId('scholarshipLevel').value;
      var destination = byId('scholarshipDestination').value;
      var field = byId('scholarshipField').value;
      var gpaControl = byId('scholarshipGpa');
      var scaleControl = byId('scholarshipScale');
      var ieltsControl = byId('scholarshipIelts');
      var gpa = gpaControl.value === '' ? null : finite(gpaControl.value, NaN);
      var scale = finite(scaleControl.value, 0);
      var ielts = ieltsControl.value === '' ? null : finite(ieltsControl.value, NaN);
      if (gpa !== null && (!Number.isFinite(gpa) || gpa < 0 || gpa > scale)) {
        markInvalid(gpaControl, 'GPA ko matsakaici dole ya kasance daga sifili zuwa iyakar tsarin da ka zaɓa.');
        exportText = '';
        return;
      }
      if (ielts !== null && (!Number.isFinite(ielts) || ielts < 0 || ielts > 9)) {
        markInvalid(ieltsControl, 'Jimillar makin IELTS dole ya kasance daga sifili zuwa tara.');
        exportText = '';
        return;
      }
      var profile = {
        gpa_value: gpaControl.value,
        gpa_scale: scaleControl.value,
        ielts_overall: ieltsControl.value,
        target_fields: field === 'any' ? [] : [field],
        target_countries: destination === 'any' ? [] : [destination],
        target_study_level: level
      };
      var matched = matcher.match(feed, profile).filter(function (entry) {
        var row = entry.scholarship || {};
        return !level || !Array.isArray(row.levels) || row.levels.indexOf(level) !== -1;
      }).slice(0, 6);
      if (!matched.length) {
        results.innerHTML = '<p>Babu abin da ya dace da matakin da ka zaɓa a jerin da aka samu. Faɗaɗa tacewa sannan ka sake gwadawa.</p>';
        showResult('<p>Babu gajeren jeri a yanzu. Wannan ba yana nufin babu tallafin da ya dace ba.</p>');
        exportText = '';
        return;
      }
      results.innerHTML = matched.map(function (entry) {
        var row = entry.scholarship || {};
        var url = sourceLink(row);
        return '<article class="ha03-scholarship">' +
          '<h3>' + escapeHtml(row.name || row.title || 'Tallafin karatu') + '</h3>' +
          '<p>' + escapeHtml(row.provider || row.organization || 'Ba a bayyana mai bayarwa ba') + '</p>' +
          '<div class="ha03-meta"><span>Makin daidaitawa: ' + formatNumber(entry.percent, 0) + '%</span><span>' + escapeHtml(modeLabel(feedMeta && feedMeta.mode)) + '</span></div>' +
          '<p><strong>Ranar rufewa:</strong> ' + escapeHtml(deadlineLabel(row)) + '</p>' +
          (url ? '<a class="ha03-button secondary" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Buɗe shafin mai bayarwa</a>' : '<p>Ba a samu mahaɗin HTTPS na mai bayarwa a wannan bayanin ba.</p>') +
          '</article>';
      }).join('');
      showResult(
        '<strong class="ha03-number">' + matched.length + '</strong>' +
        '<p>Abubuwan da aka fi dacewa a jerin da aka samu. Makin daidaitawa ba hukuncin cancanta ba ne.</p>' +
        '<p><strong>Yanayin tushe:</strong> ' + escapeHtml(modeLabel(feedMeta && feedMeta.mode)) + '. ' + escapeHtml(checkedLabel(feedMeta)) + '</p>' +
        '<p><strong>Iyaka:</strong> Duba ƙasa, fanni, shekaru, ƙwarewa, gurbin karatu, takardu da sabuwar ranar rufewa kai tsaye daga mai bayarwa.</p>'
      );
      exportText = [
        'AfroTools Hausa — Gajeren jerin tallafin karatu',
        'Yanayin tushe: ' + modeLabel(feedMeta && feedMeta.mode),
        checkedLabel(feedMeta),
        '',
        matched.map(function (entry, index) {
          var row = entry.scholarship || {};
          return [
            (index + 1) + '. ' + (row.name || row.title || 'Tallafin karatu'),
            'Mai bayarwa: ' + (row.provider || row.organization || 'Ba a bayyana ba'),
            'Ranar: ' + deadlineLabel(row),
            'Mahaɗi: ' + (sourceLink(row) || 'Ba a samu HTTPS ba')
          ].join('\n');
        }).join('\n\n'),
        '',
        'Gajeren jeri da makin daidaitawa ba hukuncin cancanta ko tabbacin kuɗi ba ne. Tabbatar da duk sharadi da sabon zagaye daga shafin mai bayarwa.'
      ].join('\n');
      showStatus('An sabunta gajeren jeri a cikin burauzarka.');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      runMatch();
    });
    submit.disabled = true;
    feedApi.load().then(function (response) {
      feed = Array.isArray(response.scholarships) ? response.scholarships : [];
      feedMeta = response.meta || {};
      loading.textContent = modeLabel(feedMeta.mode) + '. ' + checkedLabel(feedMeta);
      submit.disabled = false;
      runMatch();
    }).catch(function () {
      loading.textContent = 'Ba a samu bayanan tallafin karatu ba. Sake loda shafin.';
      submit.disabled = false;
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-gajeren-jerin-tallafin-karatu.txt');
    bindReset(form, function () { exportText = ''; if (feed.length) runMatch(); });
  }

  function initNysc() {
    var form = byId('ha03Form');
    var engine = root.AfroTools && root.AfroTools.nyscBudgetEngine;
    var exportText = '';
    if (!form || !engine) {
      showError('Injin kasafin NYSC bai samu ba. Sake loda shafin.');
      return;
    }
    function value(id) { return byId(id).value; }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var result = engine.calculate({
        planMonths: value('nyscPlanMonths'),
        federalMonthly: value('nyscFederalMonthly'),
        federalMonths: value('nyscFederalMonths'),
        stateMonthly: value('nyscStateMonthly'),
        stateMonths: value('nyscStateMonths'),
        ppaMonthly: value('nyscPpaMonthly'),
        ppaMonths: value('nyscPpaMonths'),
        otherMonthly: value('nyscOtherMonthly'),
        otherMonths: value('nyscOtherMonths'),
        oneTimeIncome: value('nyscOneTimeIncome'),
        housingMonthly: value('nyscHousing'),
        foodMonthly: value('nyscFood'),
        transportMonthly: value('nyscTransport'),
        dataMonthly: value('nyscData'),
        otherCostMonthly: value('nyscOtherCost'),
        oneTimeCosts: value('nyscOneTimeCosts')
      });
      if (!result.valid) {
        markInvalid(byId('nyscPlanMonths'), 'Duba adadin kuɗi da watanni. Kuɗi ba su ƙasa da sifili ba; watanni cikakkun lambobi ne daga 0 zuwa 12 kuma ba su wuce lokacin shirin ba.');
        exportText = '';
        return;
      }
      var tone = result.remainder >= 0 ? 'Ragowar shiri' : 'Gibin shiri';
      var buffer = result.bufferMonths === null ? 'Ba a lissafa ba' : formatNumber(result.bufferMonths, 1) + ' watannin manyan buƙatu';
      showResult(
        '<strong class="ha03-number">' + escapeHtml(formatMoney(Math.abs(result.remainder), 'NGN')) + '</strong>' +
        '<p>' + tone + ' bayan kuɗin shiga da kashe-kashen da ka shigar.</p>' +
        '<dl class="ha03-kv"><dt>Jimillar kuɗin shiga</dt><dd>' + escapeHtml(formatMoney(result.totalIncome, 'NGN')) + '</dd>' +
        '<dt>Jimillar kashe-kashe</dt><dd>' + escapeHtml(formatMoney(result.totalCosts, 'NGN')) + '</dd>' +
        '<dt>Matsakaicin kuɗin shiga na wata</dt><dd>' + escapeHtml(formatMoney(result.averageMonthlyIncome, 'NGN')) + '</dd>' +
        '<dt>Kariyar manyan buƙatu</dt><dd>' + escapeHtml(buffer) + '</dd></dl>' +
        '<p><strong>Iyaka:</strong> Wannan lissafin kasafi ne kawai. Ba ya tabbatar da haƙƙin kuɗi, bashin baya, biyan NYSC/PPA, tsarin albashi ko lokacin biyan kuɗi.</p>'
      );
      exportText = [
        'AfroTools Hausa — Kasafin alawus na NYSC',
        'Lokacin shiri: ' + result.planMonths + ' watanni',
        'Jimillar kuɗin shiga: ' + formatMoney(result.totalIncome, 'NGN'),
        'Jimillar kashe-kashe: ' + formatMoney(result.totalCosts, 'NGN'),
        tone + ': ' + formatMoney(Math.abs(result.remainder), 'NGN'),
        'Kariyar manyan buƙatu: ' + buffer,
        '',
        'Adadin kuɗin tarayya da sauran kuɗi duk ana iya gyarawa; yi amfani da abin da ka tabbatar daga takardar biyan kuɗi.',
        'Tushen bayanin tarayya: https://yid.fmyd.gov.ng/nysc-monthly-allowance-increased-to-%E2%82%A677000-a-milestone-in-youth-empowerment/',
        'An duba iyakar tushe: 2026-07-26. Wannan ba tabbacin haƙƙin kuɗi ko lokacin biya ba ne.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-kasafin-nysc.txt');
    bindReset(form, function () { exportText = ''; });
  }

  function initStudentBudget() {
    var form = byId('ha03Form');
    var engine = root.AfroTools && root.AfroTools.studentBudgetEngine;
    var exportText = '';
    if (!form || !engine) {
      showError('Injin kasafin ɗalibi bai samu ba. Sake loda shafin.');
      return;
    }
    function value(id) { return byId(id).value; }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearInvalid(form);
      clearError();
      showStatus('');
      var currency = value('budgetCurrency').toUpperCase();
      var result = engine.calculate({
        periodMonths: value('budgetMonths'),
        monthlyIncome: value('budgetMonthlyIncome'),
        periodFunding: value('budgetPeriodFunding'),
        monthlyExpenses: {
          housing: value('budgetHousing'),
          food: value('budgetFood'),
          transport: value('budgetTransport'),
          data: value('budgetData'),
          other: value('budgetOtherMonthly')
        },
        periodExpenses: {
          tuition: value('budgetTuition'),
          books: value('budgetBooks'),
          other: value('budgetOtherPeriod')
        }
      });
      if (!/^[A-Z]{3}$/.test(currency)) {
        markInvalid(byId('budgetCurrency'), 'Shigar da lambar kuɗi mai haruffa uku kamar NGN, GHS, XOF ko USD.');
        exportText = '';
        return;
      }
      if (!result.ok) {
        markInvalid(byId('budgetMonths'), 'Lokacin shiri ya fi sifili kuma bai wuce watanni 24 ba; duk adadin kuɗi sifili ko sama.');
        exportText = '';
        return;
      }
      var tone = result.balance >= 0 ? 'Ragowar kasafi' : 'Gibin kasafi';
      var expenseLabels = {
        housing: 'Masauki',
        food: 'Abinci',
        transport: 'Sufuri',
        data: 'Intanet da waya',
        other: 'Sauran kashe-kashe',
        tuition: 'Kuɗin karatu',
        books: 'Littattafai da kayan aiki'
      };
      var largest = result.largestExpense
        ? (expenseLabels[result.largestExpense.key] || 'Sauran kashe-kashe') + ' — ' + formatMoney(result.largestExpense.amount, currency)
        : 'Babu kashe kuɗin da aka shigar';
      showResult(
        '<strong class="ha03-number">' + escapeHtml(formatMoney(Math.abs(result.balance), currency)) + '</strong>' +
        '<p>' + tone + ' a lokacin watanni ' + formatNumber(result.periodMonths, 0) + '.</p>' +
        '<dl class="ha03-kv"><dt>Jimillar abin da ake da shi</dt><dd>' + escapeHtml(formatMoney(result.totalResources, currency)) + '</dd>' +
        '<dt>Jimillar kashe-kashe</dt><dd>' + escapeHtml(formatMoney(result.totalExpenses, currency)) + '</dd>' +
        '<dt>Matsakaicin kashe-kashe na wata</dt><dd>' + escapeHtml(formatMoney(result.monthlyExpenseEquivalent, currency)) + '</dd>' +
        '<dt>Babban kashe-kuɗi</dt><dd>' + escapeHtml(largest) + '</dd></dl>' +
        '<p><strong>Iyaka:</strong> Ragowar kuɗi ba tabbacin iya ɗaukar nauyi ba ne. Kuɗin da aka manta, ranakun biya, gaggawa da sauyin kuɗin shiga na iya canza sakamako.</p>'
      );
      exportText = [
        'AfroTools Hausa — Kasafin ɗalibi',
        'Lokacin shiri: ' + result.periodMonths + ' watanni',
        'Jimillar albarkatu: ' + formatMoney(result.totalResources, currency),
        'Jimillar kashe-kashe: ' + formatMoney(result.totalExpenses, currency),
        tone + ': ' + formatMoney(Math.abs(result.balance), currency),
        'Matsakaicin kashe-kashe na wata: ' + formatMoney(result.monthlyExpenseEquivalent, currency),
        'Babban kashe-kuɗi: ' + largest,
        '',
        'Duk lissafi daga adadin da mai amfani ya shigar ne. Tabbatar da kuɗin karatu, masauki, sufuri, tallafin karatu da ranakun biya daga makaranta ko mai ɗaukar nauyi.'
      ].join('\n');
      showStatus('An yi lissafi a cikin burauzarka.');
    });
    bindExport(function () { return exportText; }, 'afrotools-ha-kasafin-dalibi.txt');
    bindReset(form, function () { exportText = ''; });
  }

  function initTranslator() {
    var form = byId('ha03Form');
    var data = root.AfroTools && root.AfroTools.hausaPhrasebook;
    var results = byId('phraseResults');
    var exportText = '';
    if (!form || !data || !Array.isArray(data.entries)) {
      showError('Ba a samu kundin jimlolin Hausa ba. Sake loda shafin.');
      return;
    }

    function matches(entry, query, direction, category) {
      if (category && category !== 'all' && entry.cat !== category) return false;
      if (!query) return true;
      var source = direction === 'ha-en' ? entry.ha : entry.en;
      var other = direction === 'ha-en' ? entry.en : entry.ha;
      return source.toLocaleLowerCase('ha').indexOf(query) !== -1 || other.toLocaleLowerCase('ha').indexOf(query) !== -1;
    }

    function render() {
      clearError();
      var query = byId('translatorQuery').value.trim().toLocaleLowerCase('ha');
      var direction = byId('translatorDirection').value;
      var category = byId('translatorCategory').value;
      var entries = data.entries.filter(function (entry) { return matches(entry, query, direction, category); }).slice(0, 30);
      if (!entries.length) {
        results.innerHTML = '<p>Babu daidaitaccen rubutu a ƙaramin kundin nan. Gwada gajeriyar kalma ko wani rukuni.</p>';
        showResult('<p>Ba a samu kalma ko ɓangaren kalma da ya dace ba. Wannan kayan aikin ba na’urar fassarar kowace magana ba ce.</p>');
        exportText = '';
        return;
      }
      results.innerHTML = entries.map(function (entry) {
        var source = direction === 'ha-en' ? entry.ha : entry.en;
        var target = direction === 'ha-en' ? entry.en : entry.ha;
        return '<article class="ha03-phrase">' +
          '<h3><span lang="' + (direction === 'ha-en' ? 'ha' : 'en') + '">' + escapeHtml(source) + '</span></h3>' +
          '<p><strong>Ma’ana:</strong> <span lang="' + (direction === 'ha-en' ? 'en' : 'ha') + '">' + escapeHtml(target) + '</span></p>' +
          '<p><strong>Jagorar furuci:</strong> ' + escapeHtml(entry.pron) + '</p>' +
          (entry.note ? '<p>' + escapeHtml(entry.note) + '</p>' : '') +
          '<div class="ha03-meta"><span>' + escapeHtml(entry.cat) + '</span><span>Boko</span></div>' +
          '</article>';
      }).join('');
      showResult(
        '<strong class="ha03-number">' + entries.length + '</strong>' +
        '<p>Jimlolin da suka dace a kundin Boko na wannan kayan aikin.</p>' +
        '<p><strong>Iyaka:</strong> Kundin daftarin farko ne, ba cikakkiyar fassara, Ajami, alamar karin sauti ko nazarin ƙwararren mai fassara ba.</p>'
      );
      exportText = [
        'AfroTools Hausa — Kundin jimloli',
        'Hanyar bincike: ' + (direction === 'ha-en' ? 'Hausa zuwa Turanci' : 'Turanci zuwa Hausa'),
        'An duba iyakar rubutu: ' + data.checkedAt,
        'Nau\'in rubutu: ' + data.script,
        '',
        entries.map(function (entry) {
          return entry.en + '\t' + entry.ha + '\t' + entry.pron + '\t' + entry.cat + (entry.note ? '\t' + entry.note : '');
        }).join('\n'),
        '',
        'Daftarin farko ne. Muhimmin rubutu ya kamata ƙwararren mai fassara ya duba.',
        'Jagorar rubutu: ' + data.sourceUrl
      ].join('\n');
      showStatus('An tace kundin a cikin burauzarka; babu buƙatar hanyar sadarwa.');
    }

    form.addEventListener('submit', function (event) { event.preventDefault(); render(); });
    byId('translatorQuery').addEventListener('input', render);
    byId('translatorDirection').addEventListener('change', render);
    byId('translatorCategory').addEventListener('change', render);
    render();
    bindExport(function () { return exportText; }, 'afrotools-ha-kundin-fassara.txt');
    bindReset(form, function () { exportText = ''; render(); });
  }

  var apps = {
    waec: initWaec,
    jamb: initJamb,
    gpa: initGpa,
    'school-fees': initSchoolFees,
    scholarships: initScholarships,
    nysc: initNysc,
    'student-budget': initStudentBudget,
    translator: initTranslator
  };

  function start() {
    initThemeToggle();
    var appId = document.body && document.body.getAttribute('data-ha03-app');
    if (appId && apps[appId]) apps[appId]();
  }

  root.AfroToolsHa03 = {
    apps: apps,
    downloadText: downloadText,
    formatMoney: formatMoney,
    safeUrl: safeUrl
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}(typeof window !== 'undefined' ? window : this));
