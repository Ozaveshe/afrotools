(function () {
  'use strict';

  var fallbackMode = false;
  var patchQueued = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function allFiltersAreBroad() {
    return ['level', 'field', 'destination', 'funding', 'deadlineFilter', 'sourceConfidence']
      .every(function (id) {
        var control = byId(id);
        return !control || !control.value || control.value === 'all';
      }) && !(byId('search') && byId('search').value.trim());
  }

  function setText(selector, value) {
    var node = document.querySelector(selector);
    if (node && node.textContent !== value) node.textContent = value;
  }

  function configureCountryControl() {
    var control = byId('eligibilityCountry');
    if (!control || control.dataset.vipConfigured) return;
    control.dataset.vipConfigured = 'true';
    control.value = 'all';
    control.disabled = true;
    control.setAttribute('aria-describedby', 'eligibilityCountryNote');

    var note = document.createElement('p');
    note.id = 'eligibilityCountryNote';
    note.className = 'sch-control-note';
    note.textContent = 'Applicant-country rules are not consistently structured in the current feed. Confirm nationality eligibility on the provider page.';
    control.insertAdjacentElement('afterend', note);

    var label = document.querySelector('label[for="eligibilityCountry"]');
    if (label) label.textContent = 'Applicant country';
  }

  function configureGradeControl() {
    var control = byId('quickBand');
    if (!control || control.dataset.vipConfigured) return;
    control.dataset.vipConfigured = 'true';
    control.value = '';
    control.disabled = true;
    control.setAttribute('aria-describedby', 'quickBandNote');

    var note = document.createElement('p');
    note.id = 'quickBandNote';
    note.className = 'sch-control-note';
    note.textContent = 'Grade requirements are not consistently structured in this feed, so grade band is not used for ranking.';
    control.insertAdjacentElement('afterend', note);
  }

  function patchCard(card) {
    var fit = card.querySelector('.sch-fit-chip');
    if (fit) {
      if (allFiltersAreBroad()) {
        if (fit.textContent !== 'Not assessed') fit.textContent = 'Not assessed';
      } else {
        var original = fit.textContent.toLowerCase();
        var relevance = /relevance|not assessed/.test(original)
          ? fit.textContent
          : original.indexOf('strong') >= 0
          ? 'High relevance'
          : original.indexOf('good') >= 0
            ? 'Medium relevance'
            : original.indexOf('possible') >= 0
              ? 'Some relevance'
              : 'Low relevance';
        if (fit.textContent !== relevance) fit.textContent = relevance;
      }
      fit.setAttribute('title', 'Shortlist relevance only; not an eligibility or award prediction.');
    }

    var details = card.querySelector('.sch-match-details');
    if (details) {
      var summary = details.querySelector('summary');
      var paragraph = details.querySelector('p');
      if (summary && summary.textContent !== 'How this result was ranked') summary.textContent = 'How this result was ranked';
      if (paragraph) {
        var explanation = allFiltersAreBroad()
          ? 'No profile filters are active. Results are ordered using available source and deadline metadata.'
          : 'Relevance reflects the filters you selected and the fields available in this record. It does not evaluate every provider eligibility rule.';
        if (paragraph.textContent !== explanation) paragraph.textContent = explanation;
      }
    }

    var officialLink = card.querySelector('.sch-card-actions a');
    if (officialLink && !/^https:\/\/[^ ]+$/i.test(officialLink.href)) {
      officialLink.removeAttribute('href');
      officialLink.removeAttribute('target');
      officialLink.textContent = 'Provider link unavailable';
      officialLink.setAttribute('aria-disabled', 'true');
      officialLink.classList.add('is-disabled');
    }

    if (fallbackMode && !card.querySelector('.sch-vip-source-boundary')) {
      var boundary = document.createElement('p');
      boundary.className = 'sch-vip-source-boundary';
      boundary.textContent = 'Curated fallback record. Current-cycle eligibility, coverage and dates are not verified here.';
      var summaryNode = card.querySelector('.sch-card-summary');
      if (summaryNode) summaryNode.insertAdjacentElement('afterend', boundary);
    }
  }

  function patchSourceState() {
    var heroMessage = byId('heroFreshnessMessage');
    var feedStatus = byId('feedStatus');
    if (heroMessage && !heroMessage.hidden && /refresh/i.test(heroMessage.textContent || '')) {
      fallbackMode = true;
    }
    if (fallbackMode) {
      if (heroMessage) {
        heroMessage.hidden = false;
        heroMessage.textContent = 'Live records are unavailable. The page is showing a smaller curated fallback for research; verify every current-cycle detail on the provider page.';
      }
      if (feedStatus) {
        feedStatus.textContent = 'Curated fallback · source links available · current-cycle details require provider verification';
        feedStatus.classList.add('warn');
      }
      var summary = byId('summaryText');
      if (summary) {
        summary.textContent = 'Showing ' + document.querySelectorAll('.sch-card').length + ' curated fallback records. These are research leads, not confirmed open applications.';
      }
    }
  }

  function patchPage() {
    patchQueued = false;
    setText('.sch-section-kicker', 'Reviewed scholarship discovery');
    setText('.scholarship-product-hero .hero-sub', 'Search reviewed records by level, field, destination, funding and deadline confidence. Verify the current cycle on the provider page.');
    configureCountryControl();
    configureGradeControl();
    patchSourceState();
    document.querySelectorAll('.sch-card').forEach(patchCard);

    var printButton = byId('schPrintPack');
    if (printButton && !printButton.dataset.vipBound) {
      printButton.dataset.vipBound = 'true';
      printButton.addEventListener('click', function () {
        document.documentElement.classList.add('sch-pack-printing');
      });
      window.addEventListener('afterprint', function () {
        document.documentElement.classList.remove('sch-pack-printing');
      });
    }
  }

  function queuePatch() {
    if (patchQueued) return;
    patchQueued = true;
    window.requestAnimationFrame(patchPage);
  }

  window.addEventListener('afroedu:scholarship-feed-updated', function (event) {
    var meta = event && event.detail ? event.detail : {};
    fallbackMode = meta.mode === 'fallback' || meta.mode === 'cached' || !!meta.isDegraded;
    queuePatch();
  });
  document.addEventListener('input', queuePatch);
  document.addEventListener('change', queuePatch);
  document.addEventListener('click', queuePatch);

  var grid = byId('scholarshipGrid');
  if (grid && window.MutationObserver) {
    new MutationObserver(queuePatch).observe(grid, { childList: true, subtree: true });
  }

  patchPage();
  window.setTimeout(patchPage, 500);
  window.setTimeout(patchPage, 1500);
}());
