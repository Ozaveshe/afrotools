(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var rawCategory = script.getAttribute('data-category');
  var countryCode = script.getAttribute('data-country');
  if (!rawCategory) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function buttonStyle(color, background) {
    return [
      'padding:6px 14px',
      'border:1.5px solid ' + color,
      'background:' + background,
      'color:' + color,
      'border-radius:8px',
      'font-size:12px',
      'font-weight:700',
      'cursor:pointer',
      'font-family:inherit'
    ].join(';');
  }

  function init() {
    var engine = window.AfroPointsEngine;
    if (!engine) return;

    var categoryId = engine.normalizeCategoryId(rawCategory) || rawCategory;
    var category = engine.getCategoryById(categoryId);
    if (!category) return;

    var host = document.querySelector('.afro-freshness-badge') ||
      document.querySelector('.tool-section:last-of-type') ||
      document.querySelector('main');
    if (!host) return;

    var countryName = countryCode ? engine.getCountryName(countryCode) : 'your city';
    var contributionUrl = '/tools/afropoints/contribute.html?cat=' + encodeURIComponent(category.id) +
      (countryCode ? '&country=' + encodeURIComponent(countryCode) : '');

    var bridge = document.createElement('div');
    bridge.className = 'afro-crowdsource-bridge';
    bridge.style.cssText = [
      'background:linear-gradient(135deg,#E8F2FF 0%,#f6f9ff 100%)',
      'border:1.5px solid rgba(0,122,255,.14)',
      'border-radius:14px',
      'padding:20px 24px',
      'margin:20px auto',
      'max-width:680px',
      'font-family:inherit'
    ].join(';');

    bridge.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:6px">Does this still look right for ' + countryName + '?</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="cs-vote" data-vote="up" style="' + buttonStyle('#166534', '#f0fdf4') + '">Accurate</button>' +
            '<button class="cs-vote" data-vote="down" style="' + buttonStyle('#b91c1c', '#fff1f2') + '">Needs update</button>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<a href="' + contributionUrl + '" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:#007AFF;color:#fff;border-radius:980px;font-size:13px;font-weight:700;text-decoration:none">' +
            category.emoji + ' Submit ' + category.label + ' (+' + engine.getSubmissionPoints(category.id) + ' pts)' +
          '</a>' +
        '</div>' +
      '</div>' +
      '<div id="cs-feedback" style="display:none;margin-top:10px;font-size:12px;color:#64748b;text-align:center"></div>';

    if (host.classList.contains('afro-freshness-badge') && host.parentNode) {
      host.parentNode.insertBefore(bridge, host.nextSibling);
    } else {
      host.appendChild(bridge);
    }

    var feedback = bridge.querySelector('#cs-feedback');
    bridge.querySelectorAll('.cs-vote').forEach(function (button) {
      button.addEventListener('click', function () {
        var vote = button.getAttribute('data-vote');
        feedback.style.display = 'block';
        feedback.textContent = vote === 'up'
          ? 'Helpful. If you see a tighter neighborhood-level update, submit it through AfroPoints.'
          : 'Thanks. Use the submit button to send the current local value and earn AfroPoints.';
      });
    });
  }
})();
