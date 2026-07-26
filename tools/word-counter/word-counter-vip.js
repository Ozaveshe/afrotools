(function () {
  'use strict';

  window.AFROTOOLS_WORD_COUNTER_VIP = true;

  var engine = window.AfroTools && window.AfroTools.wordCounter;
  if (!engine) return;

  var STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not',
    'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'by', 'from', 'they',
    'we', 'or', 'an', 'will', 'one', 'all', 'there', 'what', 'so', 'if', 'about',
    'which', 'when', 'can', 'your', 'some', 'than', 'then', 'only', 'also', 'how',
    'our', 'because', 'these', 'is', 'are', 'was', 'were', 'been', 'has', 'had'
  ]);

  var elements = {
    textarea: document.getElementById('textInput'),
    clear: document.getElementById('clearBtn'),
    copy: document.getElementById('copyBtn'),
    download: document.getElementById('downloadReportBtn'),
    print: document.getElementById('printReportBtn'),
    status: document.getElementById('actionStatus'),
    upload: document.getElementById('fileUpload'),
    goalToggle: document.getElementById('goalToggle'),
    goalWrap: document.getElementById('goalWrap'),
    minimumWords: document.getElementById('minimumWords'),
    maximumWords: document.getElementById('maximumWords'),
    maximumCharacters: document.getElementById('maximumCharacters'),
    limitResult: document.getElementById('limitResult'),
    readingWpm: document.getElementById('readingWpm'),
    speakingWpm: document.getElementById('speakingWpm'),
    wordsPerPage: document.getElementById('wordsPerPage'),
    stopToggle: document.getElementById('stopToggle'),
    keywordList: document.getElementById('kwList')
  };

  var currentNgram = 1;
  var currentStats = engine.analyse('');
  var currentLimits = engine.evaluateLimits(currentStats, {});

  function numberValue(input, fallback) {
    var value = Number(input && input.value);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  function assumptions() {
    return {
      readingWpm: numberValue(elements.readingWpm, 200),
      speakingWpm: numberValue(elements.speakingWpm, 130),
      wordsPerPage: numberValue(elements.wordsPerPage, 275)
    };
  }

  function limits() {
    return {
      minimumWords: elements.minimumWords.value,
      maximumWords: elements.maximumWords.value,
      maximumCharacters: elements.maximumCharacters.value
    };
  }

  function setText(id, value) {
    var target = document.getElementById(id);
    if (target) target.textContent = value;
  }

  function setStatus(message) {
    elements.status.textContent = message || '';
  }

  function easeDescription(score) {
    if (score >= 80) return 'Easier English prose';
    if (score >= 60) return 'Standard English prose';
    if (score >= 40) return 'More complex English prose';
    return 'Very complex English prose';
  }

  function updateReadability() {
    var result = currentStats.readability;
    if (!result.available) {
      setText('fleschEase', '—');
      setText('gradeLevel', '—');
      setText('fleschEaseDesc', result.reason);
      setText('gradeLevelDesc', 'No grade estimate shown.');
      return;
    }

    setText('fleschEase', result.ease);
    setText('gradeLevel', result.grade);
    setText('fleschEaseDesc', easeDescription(result.ease) + '. ' + result.note);
    setText('gradeLevelDesc', 'Approximate US grade-level complexity; not a reader or quality verdict.');
  }

  function updateLimitResult() {
    currentLimits = engine.evaluateLimits(currentStats, limits());
    elements.limitResult.dataset.state = currentLimits.state;
    if (!currentLimits.valid) {
      elements.limitResult.textContent = currentLimits.issues.join(' ');
      return;
    }
    elements.limitResult.textContent = currentLimits.messages.join(' ');
  }

  function createKeywordItem(item, totalWords, maxCount) {
    var row = document.createElement('li');
    row.className = 'kw-item';

    var phrase = document.createElement('span');
    phrase.className = 'kw-word';
    phrase.textContent = item.phrase;

    var barWrap = document.createElement('div');
    barWrap.className = 'kw-bar-wrap';
    barWrap.setAttribute('aria-hidden', 'true');
    var bar = document.createElement('div');
    bar.className = 'kw-bar';
    bar.style.width = ((item.count / maxCount) * 100) + '%';
    barWrap.appendChild(bar);

    var percentage = document.createElement('span');
    percentage.className = 'kw-pct';
    percentage.textContent = ((item.count / totalWords) * 100).toFixed(1) + '%';

    var count = document.createElement('span');
    count.className = 'kw-count';
    count.textContent = String(item.count);
    count.setAttribute('aria-label', item.count + ' occurrences');

    row.appendChild(phrase);
    row.appendChild(barWrap);
    row.appendChild(percentage);
    row.appendChild(count);
    return row;
  }

  function updateKeywords() {
    var list = engine.ngrams(
      currentStats.normalisedWords,
      currentNgram,
      elements.stopToggle.checked,
      STOP_WORDS
    );
    elements.keywordList.replaceChildren();

    if (!list.length || !currentStats.words) {
      var empty = document.createElement('li');
      empty.className = 'kw-empty';
      empty.textContent = 'Add text to review repeated words and phrases.';
      elements.keywordList.appendChild(empty);
      return;
    }

    var maxCount = list[0].count;
    list.forEach(function (item) {
      elements.keywordList.appendChild(createKeywordItem(item, currentStats.words, maxCount));
    });
  }

  function update() {
    currentStats = engine.analyse(elements.textarea.value, assumptions());
    setText('wordCount', currentStats.words.toLocaleString());
    setText('charCount', currentStats.characters.toLocaleString());
    setText('charNoSpace', currentStats.charactersNoWhitespace.toLocaleString());
    setText('sentenceCount', currentStats.sentences.toLocaleString());
    setText('paraCount', currentStats.paragraphs.toLocaleString());
    setText('uniqueWords', currentStats.uniqueWords.toLocaleString());
    setText('avgLength', currentStats.averageWordLength);
    setText('readTime', currentStats.readingTime.label);
    setText('speakTime', currentStats.speakingTime.label);
    setText('pageCount', currentStats.pageEstimate);
    updateReadability();
    updateLimitResult();
    updateKeywords();
  }

  function report() {
    var settings = assumptions();
    var limitLines = currentLimits.messages.length
      ? currentLimits.messages.map(function (line) { return '- ' + line; })
      : ['- No assignment limits set.'];
    var readable = currentStats.readability.available
      ? [
        '- Flesch Reading Ease: ' + currentStats.readability.ease,
        '- Flesch-Kincaid grade estimate: ' + currentStats.readability.grade
      ]
      : ['- Not shown: ' + currentStats.readability.reason];

    return [
      'Word Counter summary — AfroTools',
      'Generated: ' + new Date().toLocaleString(),
      '',
      'Counts',
      '- Words: ' + currentStats.words,
      '- Characters: ' + currentStats.characters,
      '- Characters without whitespace: ' + currentStats.charactersNoWhitespace,
      '- Sentences: ' + currentStats.sentences,
      '- Paragraphs: ' + currentStats.paragraphs,
      '- Unique words: ' + currentStats.uniqueWords,
      '- Average word length: ' + currentStats.averageWordLength,
      '',
      'Planning estimates',
      '- Reading time: ' + currentStats.readingTime.label + ' at ' + settings.readingWpm + ' words/min',
      '- Speaking time: ' + currentStats.speakingTime.label + ' at ' + settings.speakingWpm + ' words/min',
      '- Draft pages: ' + currentStats.pageEstimate + ' at ' + settings.wordsPerPage + ' words/page',
      '',
      'Assignment limit check',
      limitLines.join('\n'),
      '',
      'English readability estimate',
      readable.join('\n'),
      '',
      'Privacy',
      'The draft text is intentionally excluded from this summary. Analysis ran in the browser tab.'
    ].join('\n');
  }

  function fallbackCopy(value) {
    var helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    helper.remove();
    setStatus(copied ? 'Summary copied. Draft text was excluded.' : 'Copy failed. Download the TXT summary instead.');
  }

  elements.textarea.addEventListener('input', update);
  [
    elements.minimumWords,
    elements.maximumWords,
    elements.maximumCharacters,
    elements.readingWpm,
    elements.speakingWpm,
    elements.wordsPerPage
  ].forEach(function (input) {
    input.addEventListener('input', update);
  });

  elements.goalToggle.addEventListener('click', function () {
    var visible = elements.goalWrap.classList.toggle('visible');
    elements.goalToggle.classList.toggle('active', visible);
    elements.goalToggle.setAttribute('aria-expanded', String(visible));
    if (visible) elements.minimumWords.focus();
  });

  elements.clear.addEventListener('click', function () {
    elements.textarea.value = '';
    update();
    setStatus('Draft cleared from this tab.');
    elements.textarea.focus();
  });

  elements.copy.addEventListener('click', function () {
    var value = report();
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopy(value);
      return;
    }
    navigator.clipboard.writeText(value).then(function () {
      setStatus('Summary copied. Draft text was excluded.');
    }).catch(function () {
      fallbackCopy(value);
    });
  });

  elements.download.addEventListener('click', function () {
    var blob = new Blob([report()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'word-counter-summary-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    setStatus('TXT summary downloaded. Draft text was excluded.');
  });

  elements.print.addEventListener('click', function () {
    setStatus('Print dialog opened. Choose “Save as PDF” to create a PDF summary.');
    window.print();
  });

  elements.upload.addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus('That file is larger than 2 MB. Choose a smaller plain-text file.');
      event.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      elements.textarea.value = String(loadEvent.target.result || '');
      update();
      setStatus('Plain-text file loaded locally.');
    };
    reader.onerror = function () {
      setStatus('The file could not be read. Try a UTF-8 plain-text file.');
    };
    reader.readAsText(file);
    event.target.value = '';
  });

  document.querySelectorAll('.kw-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.kw-tab').forEach(function (other) {
        var active = other === tab;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      currentNgram = Number(tab.dataset.n) || 1;
      updateKeywords();
    });
  });

  elements.stopToggle.addEventListener('change', updateKeywords);

  document.querySelectorAll('.case-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = elements.textarea.value;
      if (!value) {
        setStatus('Add text before converting case.');
        return;
      }
      if (button.dataset.case === 'upper') {
        elements.textarea.value = value.toLocaleUpperCase();
      } else if (button.dataset.case === 'lower') {
        elements.textarea.value = value.toLocaleLowerCase();
      } else if (button.dataset.case === 'title') {
        elements.textarea.value = value.replace(/\p{L}[\p{L}\p{M}’'-]*/gu, function (word) {
          var letters = Array.from(word);
          return letters[0].toLocaleUpperCase() + letters.slice(1).join('').toLocaleLowerCase();
        });
      } else if (button.dataset.case === 'sentence') {
        elements.textarea.value = value.replace(/(^|[.!?]\s+)(\p{L})/gu, function (_, boundary, letter) {
          return boundary + letter.toLocaleUpperCase();
        });
      }
      update();
      setStatus('Case converted in the draft. Review names and specialist terms before using it.');
    });
  });

  update();
})();
