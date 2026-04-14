(function () {
  'use strict';

  const QUICK_STARTS = {
    NG: {
      countryCode: 'NG',
      countryLabel: 'Nigeria',
      routeLabel: 'Apapa / Tin Can',
      vehicleLabel: '2018 Toyota Corolla',
      sourceLabel: 'Japan quote',
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      engineCc: 1800,
      destinationCity: 'lagos',
      driveSide: 'right',
      bodyType: 'sedan',
      fuelType: 'petrol',
      sourceMarket: 'japan',
    },
    KE: {
      countryCode: 'KE',
      countryLabel: 'Kenya',
      routeLabel: 'Mombasa to Nairobi',
      vehicleLabel: '2019 Toyota Axio',
      sourceLabel: 'Japan quote',
      make: 'Toyota',
      model: 'Axio',
      year: 2019,
      engineCc: 1500,
      destinationCity: 'nairobi',
      driveSide: 'right',
      bodyType: 'sedan',
      fuelType: 'petrol',
      sourceMarket: 'japan',
    },
    GH: {
      countryCode: 'GH',
      countryLabel: 'Ghana',
      routeLabel: 'Tema / Takoradi',
      vehicleLabel: '2016 Honda CR-V',
      sourceLabel: 'Japan quote',
      make: 'Honda',
      model: 'CR-V',
      year: 2016,
      engineCc: 2400,
      destinationCity: 'accra',
      driveSide: 'left',
      bodyType: 'suv',
      fuelType: 'petrol',
      sourceMarket: 'japan',
    },
    UG: {
      countryCode: 'UG',
      countryLabel: 'Uganda',
      routeLabel: 'Mombasa / Dar corridor',
      vehicleLabel: '2017 Mazda Demio',
      sourceLabel: 'Japan quote',
      make: 'Mazda',
      model: 'Demio',
      year: 2017,
      engineCc: 1300,
      destinationCity: 'kampala',
      driveSide: 'right',
      bodyType: 'hatchback',
      fuelType: 'petrol',
      sourceMarket: 'japan',
    },
    ZM: {
      countryCode: 'ZM',
      countryLabel: 'Zambia',
      routeLabel: 'Entry to Lusaka',
      vehicleLabel: '2015 Toyota Hilux',
      sourceLabel: 'Japan quote',
      make: 'Toyota',
      model: 'Hilux',
      year: 2015,
      engineCc: 2500,
      destinationCity: 'lusaka',
      driveSide: 'right',
      bodyType: 'pickup',
      fuelType: 'diesel',
      sourceMarket: 'japan',
    },
    TZ: {
      countryCode: 'TZ',
      countryLabel: 'Tanzania',
      routeLabel: 'Dar es Salaam',
      vehicleLabel: '2014 Toyota Noah',
      sourceLabel: 'Japan quote',
      make: 'Toyota',
      model: 'Noah',
      year: 2014,
      engineCc: 2000,
      destinationCity: 'dar-es-salaam',
      driveSide: 'right',
      bodyType: 'mpv',
      fuelType: 'petrol',
      sourceMarket: 'japan',
    },
  };

  const PROOF_CARDS = [
    {
      title: 'See the full number',
      body: 'Split vehicle value, customs charges, and real-world port or clearing extras before you commit money.',
    },
    {
      title: 'Catch rule issues early',
      body: 'See age, steering, valuation, and inspection risk before you ship the wrong car.',
    },
    {
      title: 'Budget for bad surprises',
      body: 'Use best, normal, and painful-case scenarios instead of one misleading quote.',
    },
  ];

  const NEED_CHIPS = [
    'Import country',
    'Source market',
    'Make + model + year',
    'Approx price or CIF',
    'Port or destination if you know it',
  ];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character];
    });
  }

  function heroSecondaryHref() {
    const parts = location.pathname.split('/').filter(Boolean);
    const countrySlug = parts[2];
    return countrySlug ? `/cars/${countrySlug}/` : '/cars/compare/';
  }

  function heroSecondaryLabel() {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts[2] ? 'Browse import vs local prices' : 'Compare source markets';
  }

  function ensureHeroEnhancements() {
    const heroBody = $('.car-import-hero-grid > div');
    if (!heroBody) {
      return;
    }

    if (!$('.car-import-hero-actions', heroBody)) {
      const actions = document.createElement('div');
      actions.className = 'car-import-hero-actions';
      actions.innerHTML = [
        '<a href="#carImportApp" class="car-import-hero-button">Start your quote</a>',
        `<a href="${escapeHtml(heroSecondaryHref())}" class="car-import-hero-button secondary">${escapeHtml(heroSecondaryLabel())}</a>`,
      ].join('');
      heroBody.appendChild(actions);
    }

    if (!$('.car-import-hero-points', heroBody)) {
      const points = document.createElement('div');
      points.className = 'car-import-hero-points';
      points.innerHTML = [
        '<span>Official vs practical cost split</span>',
        '<span>Best / normal / painful scenarios</span>',
        '<span>Japan vs UAE vs UK vs South Africa</span>',
      ].join('');
      heroBody.appendChild(points);
    }
  }

  function buildEnhancementMarkup() {
    const proofMarkup = PROOF_CARDS.map(function (card) {
      return [
        '<article class="car-import-proof-card">',
        `<strong>${escapeHtml(card.title)}</strong>`,
        `<p>${escapeHtml(card.body)}</p>`,
        '</article>',
      ].join('');
    }).join('');

    const quickStartMarkup = Object.values(QUICK_STARTS)
      .map(function (preset) {
        return [
          `<button type="button" class="car-import-quick-card" data-quick-start="${escapeHtml(preset.countryCode)}">`,
          `<span class="car-import-quick-eyebrow">${escapeHtml(preset.countryLabel)} · ${escapeHtml(preset.routeLabel)}</span>`,
          `<strong>${escapeHtml(preset.vehicleLabel)}</strong>`,
          `<span>${escapeHtml(preset.sourceLabel)}</span>`,
          '</button>',
        ].join('');
      })
      .join('');

    const chipsMarkup = NEED_CHIPS.map(function (label) {
      return `<span class="car-import-chip">${escapeHtml(label)}</span>`;
    }).join('');

    return [
      `<div class="car-import-proof-grid">${proofMarkup}</div>`,
      '<section class="car-import-start-block">',
      '<div class="car-import-start-head">',
      '<div><h3>Quick starts</h3><p>Load a realistic sample quote, then edit it to match your actual vehicle.</p></div>',
      '<span>Built for ad traffic</span>',
      '</div>',
      `<div class="car-import-quick-grid">${quickStartMarkup}</div>`,
      '</section>',
      '<section class="car-import-start-block car-import-start-block-soft">',
      '<div class="car-import-start-head">',
      '<div><h3>What you need</h3><p>Even partial information is enough to get a planning estimate.</p></div>',
      '<span>No paperwork required</span>',
      '</div>',
      `<div class="car-import-chip-row">${chipsMarkup}</div>`,
      '</section>',
    ].join('');
  }

  function setField(id, value) {
    const field = document.getElementById(id);
    if (field && value != null && value !== '') {
      field.value = value;
    }
  }

  function submitForm() {
    const form = $('#carImportForm');
    if (!form) {
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      return;
    }

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function syncQuickStartActive(countryCode) {
    $$('.car-import-quick-card').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-quick-start') === countryCode);
    });
  }

  function applyQuickStart(countryCode) {
    const preset = QUICK_STARTS[countryCode];
    const countryField = $('#carImportCountry');
    if (!preset || !countryField) {
      return;
    }

    countryField.value = preset.countryCode;
    countryField.dispatchEvent(new Event('change', { bubbles: true }));

    window.setTimeout(function () {
      setField('carImportSourceMarket', preset.sourceMarket);
      setField('carImportInputMode', 'make-model-year');
      setField('carImportOutputMode', 'practical');
      setField('carImportMake', preset.make);
      setField('carImportModel', preset.model);
      setField('carImportYear', preset.year);
      setField('carImportFirstRegistrationMonth', '1');
      setField('carImportFuelType', preset.fuelType);
      setField('carImportEngineCc', preset.engineCc);
      setField('carImportBodyType', preset.bodyType);
      setField('carImportDriveSide', preset.driveSide);
      setField('carImportTransmission', 'automatic');
      setField('carImportCondition', 'used');
      setField('carImportMileage', '65000');
      setField('carImportDownPayment', '25');
      setField('carImportApr', '24');
      setField('carImportFinanceMonths', '36');
      setField('carImportDestinationCity', preset.destinationCity);
      syncQuickStartActive(countryCode);
      submitForm();
    }, 80);
  }

  function ensureResultGuide() {
    const results = $('#carImportResults');
    const head = $('.car-import-result-head', results);
    if (!results || results.hidden || !head) {
      return;
    }

    let note = $('#carImportGuideNote');
    if (!note) {
      note = document.createElement('div');
      note.id = 'carImportGuideNote';
      note.className = 'car-import-guide-note';
      head.insertAdjacentElement('afterend', note);
    }

    const countryLabel = $('#carImportCountry option:checked')
      ? $('#carImportCountry option:checked').textContent
      : 'selected market';
    const sourceLabel = $('#carImportSourceMarket option:checked')
      ? $('#carImportSourceMarket option:checked').textContent
      : 'the selected source market';

    note.innerHTML = `<strong>Fast read:</strong> This ${escapeHtml(
      countryLabel
    )} quote already includes more than customs. Use <strong>Official Charges</strong> to isolate customs-only costs, or open <strong>Compare</strong> to see whether ${escapeHtml(
      sourceLabel
    )} still looks best against the other source markets.`;
  }

  function enhanceForm(form) {
    if (!form || form.dataset.enhanced === 'true') {
      return;
    }

    form.dataset.enhanced = 'true';
    form.classList.add('car-import-panel-enhanced');

    const heading = $('h2', form);
    const help = $('.car-import-help', form);
    const submitButton = $('.car-import-button[type="submit"]', form);
    const compareButton = $('#carImportCompareMode', form);

    if (heading) {
      heading.textContent = 'Know the true landed cost before you buy, bid, or ship';
    }

    if (help) {
      help.textContent =
        'Start with the few details you know. The calculator will split vehicle value, official charges, port or clearing extras, and registration into one planning quote.';
      help.insertAdjacentHTML('afterend', buildEnhancementMarkup());
    }

    if (submitButton) {
      submitButton.textContent = 'Get landed cost';
    }

    if (compareButton) {
      compareButton.textContent = 'Open source comparison';
    }

    $$('.car-import-quick-card', form).forEach(function (button) {
      button.addEventListener('click', function () {
        applyQuickStart(button.getAttribute('data-quick-start'));
      });
    });

    const countryField = $('#carImportCountry', form);
    if (countryField) {
      countryField.addEventListener('change', function () {
        syncQuickStartActive(countryField.value);
      });
      syncQuickStartActive(countryField.value);
    }
  }

  function attachEnhancements() {
    ensureHeroEnhancements();
    const form = $('#carImportForm');
    if (!form) {
      return false;
    }
    enhanceForm(form);
    ensureResultGuide();
    return true;
  }

  function startObservers() {
    const interval = window.setInterval(function () {
      if (attachEnhancements()) {
        window.clearInterval(interval);

        const results = $('#carImportResults');
        if (results) {
          const observer = new MutationObserver(function () {
            ensureResultGuide();
          });
          observer.observe(results, {
            attributes: true,
            childList: true,
            subtree: true,
          });
        }
      }
    }, 150);

    window.setTimeout(function () {
      window.clearInterval(interval);
    }, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservers);
  } else {
    startObservers();
  }
})();
