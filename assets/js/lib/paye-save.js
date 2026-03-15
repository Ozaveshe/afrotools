/**
 * AFROTOOLS — PAYE Saved Calculations
 * Drop-in script for any PAYE/salary-tax page.
 *
 * Requirements:
 *   - save-state.js must be loaded first (provides SaveState class)
 *   - Page must have a calculate() function
 *   - Page must have an element to insert saved section into
 *
 * Usage: add <script src="/assets/js/lib/paye-save.js" defer></script>
 *        and set: window.PAYE_SAVE_SLUG = 'ng-salary-tax';
 *                 window.PAYE_SAVE_INPUTS = { grossSalary: 'grossSalary', ... };
 */
(function () {
  'use strict';

  function init() {
    var slug = window.PAYE_SAVE_SLUG;
    if (!slug || typeof SaveState === 'undefined') return;

    var ss = new SaveState(slug, { maxFree: 20 });

    // ── Inject "Your Saved Calculations" section ──
    injectSavedSection(ss, slug);

    // ── Inject "Save This Calculation" button after calc button ──
    injectSaveButton(ss, slug);

    // ── Check URL for ?id= to auto-load ──
    var params = new URLSearchParams(window.location.search);
    var loadId = params.get('id');
    if (loadId) {
      setTimeout(function () { loadCalc(ss, loadId); }, 500);
    }
  }

  function injectSavedSection(ss, slug) {
    // Find the main content area — look for the first .card or main container
    var target = document.querySelector('.tool-page .container, .paye-page .container, main .container, .crumb');
    if (!target) target = document.querySelector('.card');
    if (!target) return;

    var section = document.createElement('div');
    section.id = 'paye-saved-section';
    section.style.cssText = 'max-width:900px;margin:0 auto;padding:20px 20px 0;';

    // Insert after breadcrumb or at top of container
    if (target.classList.contains('crumb')) {
      target.parentNode.insertBefore(section, target.nextSibling);
    } else {
      target.parentNode.insertBefore(section, target);
    }

    renderSaved(ss, slug, section);
  }

  function renderSaved(ss, slug, section) {
    var items = ss.getAll();

    if (!items.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    var html = '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<h3 style="font-size:.95rem;font-weight:800;color:#111827;margin:0;">Your Saved Calculations</h3>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;">';

    items.forEach(function (item) {
      var summary = item.data && item.data.summary ? item.data.summary : '';
      html += '<div class="paye-saved-card" data-id="' + item.id + '" style="flex:1;min-width:200px;max-width:280px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;cursor:pointer;transition:border-color .15s,box-shadow .15s;">' +
        '<div style="font-size:.82rem;font-weight:700;color:#111827;margin-bottom:4px;">' + esc(item.title) + '</div>' +
        (summary ? '<div style="font-size:.72rem;color:#6b7280;margin-bottom:6px;">' + esc(summary) + '</div>' : '') +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<span style="font-size:.65rem;color:#9ca3af;">' + timeAgo(item.updatedAt) + '</span>' +
        '<button class="paye-del-btn" data-del="' + item.id + '" style="background:none;border:none;color:#ef4444;font-size:.68rem;font-weight:700;cursor:pointer;padding:2px 6px;">Delete</button>' +
        '</div></div>';
    });

    html += '</div></div>';
    section.innerHTML = html;

    // Wire click-to-load
    section.querySelectorAll('.paye-saved-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('paye-del-btn')) return;
        var id = card.getAttribute('data-id');
        loadCalc(ss, id);
      });
      card.addEventListener('mouseenter', function () { card.style.borderColor = '#007AFF'; card.style.boxShadow = '0 2px 8px rgba(0,122,255,.1)'; });
      card.addEventListener('mouseleave', function () { card.style.borderColor = '#e5e7eb'; card.style.boxShadow = 'none'; });
    });

    // Wire delete buttons
    section.querySelectorAll('.paye-del-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-del');
        if (!confirm('Delete this saved calculation?')) return;
        ss.delete(id);
        renderSaved(ss, window.PAYE_SAVE_SLUG, section);
      });
    });
  }

  function injectSaveButton(ss, slug) {
    // Find calc button
    var calcBtn = document.getElementById('calcBtn');
    if (!calcBtn) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:none;margin-top:12px;text-align:center;';
    wrapper.id = 'paye-save-wrapper';

    wrapper.innerHTML = '<button id="payeSaveBtn" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:#fff;border:1.5px solid #007AFF;border-radius:10px;color:#007AFF;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .15s,color .15s;">' +
      '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>' +
      'Save This Calculation</button>';

    // Insert after calc button's parent
    var parent = calcBtn.parentElement;
    parent.insertBefore(wrapper, calcBtn.nextSibling);

    // Show after first calculation
    var origCalc = window.calculate;
    if (typeof origCalc === 'function') {
      window.calculate = function () {
        origCalc.apply(this, arguments);
        wrapper.style.display = '';
      };
    }

    // Handle save
    document.getElementById('payeSaveBtn').addEventListener('click', function () {
      var name = prompt('Name this calculation (e.g., "Current Salary", "If Promoted"):');
      if (!name) return;

      var data = gatherInputs();
      data.summary = getSummary();

      ss.save({ title: name, data: data });

      // Show confirmation
      var btn = document.getElementById('payeSaveBtn');
      var orig = btn.innerHTML;
      btn.innerHTML = 'Saved!';
      btn.style.background = '#007AFF';
      btn.style.color = '#fff';
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.style.background = '#fff';
        btn.style.color = '#007AFF';
      }, 1500);

      // Re-render saved section
      var section = document.getElementById('paye-saved-section');
      if (section) renderSaved(ss, slug, section);
    });
  }

  function gatherInputs() {
    var data = {};
    // Gather all input/select values in the form
    document.querySelectorAll('.card input[type="text"], .card input[type="number"], .card input[type="range"], .card select, .card input[type="checkbox"], .card input[type="radio"]').forEach(function (el) {
      if (!el.id) return;
      if (el.type === 'checkbox') {
        data[el.id] = el.checked;
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name || el.id] = el.value;
      } else {
        data[el.id] = el.value;
      }
    });
    // Also gather mode buttons state
    var modeOn = document.querySelector('.mode-btn.on');
    if (modeOn) data._mode = modeOn.textContent.trim();
    return data;
  }

  function loadCalc(ss, id) {
    var item = ss.load(id);
    if (!item || !item.data) return;

    var data = item.data;
    Object.keys(data).forEach(function (key) {
      if (key === 'summary' || key === '_mode') return;
      var el = document.getElementById(key);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = !!data[key];
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        el.value = data[key];
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Trigger calc mode if saved
    if (data._mode) {
      var btns = document.querySelectorAll('.mode-btn');
      btns.forEach(function (b) {
        if (b.textContent.trim() === data._mode) b.click();
      });
    }

    // Run calculation
    setTimeout(function () {
      if (typeof window.calculate === 'function') window.calculate();
    }, 200);

    // Scroll to results
    setTimeout(function () {
      var results = document.getElementById('resultsCard') || document.querySelector('.results-card');
      if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  function getSummary() {
    // Try to get the result amount from various common elements
    var el = document.getElementById('resAmount') || document.querySelector('.res-hero-amount');
    return el ? el.textContent.trim() : '';
  }

  function timeAgo(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    var d = Math.floor(s / 86400);
    if (d < 30) return d + 'd ago';
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
