(function (window, document) {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatNumber(value) {
    var numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
  }

  function showToast(message, type) {
    var toast = $('mdToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'md-toast show' + (type ? ' ' + type : '');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () {
      toast.className = 'md-toast';
    }, 3200);
  }

  function buildCountrySelect(selectId) {
    var select = $(selectId);
    if (!select || !window.AfroPointsEngine) return;
    var engine = window.AfroPointsEngine;
    var codes = Object.keys(engine.COUNTRIES).sort(function (left, right) {
      return engine.COUNTRIES[left].localeCompare(engine.COUNTRIES[right]);
    });
    select.innerHTML = '<option value="">All Countries</option>';
    codes.forEach(function (code) {
      var option = document.createElement('option');
      option.value = code;
      option.textContent = engine.COUNTRIES[code];
      select.appendChild(option);
    });
  }

  function renderReportFields(config) {
    var form = $('mdReportFields');
    if (!form || !window.AfroPointsEngine) return;
    var fields = config.reportFields || window.AfroPointsEngine.getFieldsForCategory(config.subtype);
    form.innerHTML = fields.map(function (field) {
      var inputHtml = '';
      if (field.type === 'select') {
        inputHtml = '<select class="md-select" id="report_' + escapeHtml(field.key) + '">' +
          '<option value="">Select...</option>' +
          (field.options || []).map(function (option) {
            return '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</option>';
          }).join('') +
          '</select>';
      } else if (field.type === 'textarea') {
        inputHtml = '<textarea class="md-textarea" id="report_' + escapeHtml(field.key) + '" placeholder="' + escapeHtml(field.placeholder || '') + '"></textarea>';
      } else {
        inputHtml = '<input class="md-input" id="report_' + escapeHtml(field.key) + '" type="' + escapeHtml(field.type || 'text') + '" placeholder="' + escapeHtml(field.placeholder || '') + '"' + (field.min !== undefined ? ' min="' + escapeHtml(field.min) + '"' : '') + '>';
      }
      return '<div class="md-form-field">' +
        '<label for="report_' + escapeHtml(field.key) + '">' + escapeHtml(field.label) + '</label>' +
        inputHtml +
        '</div>';
    }).join('');
  }

  function readFieldValue(field) {
    var element = $('report_' + field.key);
    if (!element) return null;
    if (field.type === 'number') {
      var numeric = Number(element.value);
      return Number.isFinite(numeric) ? numeric : null;
    }
    return element.value || null;
  }

  function collectReportPayload(config) {
    var engine = window.AfroPointsEngine;
    var fields = config.reportFields || engine.getFieldsForCategory(config.subtype);
    var payload = {};
    var missing = [];

    fields.forEach(function (field) {
      var value = readFieldValue(field);
      if (field.required && (value === null || value === '')) {
        missing.push(field.label);
      }
      if (value !== null && value !== '') payload[field.key] = value;
    });

    if (missing.length) {
      return { error: 'Please complete: ' + missing.join(', ') };
    }

    var country = $('mdReportCountry').value || $('mdCountry').value;
    var city = $('mdReportCity').value || $('mdCity').value;
    if (!country || !city) {
      return { error: 'Country and city are required for reports' };
    }

    var report = {
      subtype: config.subtype,
      vertical: config.vertical,
      category: config.subtype,
      country_code: country,
      city: city,
      neighborhood: $('mdReportNeighborhood').value || null,
      observed_at: $('mdObservedAt').value || null,
      source_type: $('mdSourceType').value || null,
      proof_url: $('mdProofUrl').value || null,
      currency_code: $('mdReportCurrency').value || engine.getCurrency(country),
      provider_name: $('mdReportProvider').value || payload.provider || payload.provider_name || null,
      merchant_name: $('mdReportMerchant').value || payload.market_name || payload.merchant_name || null,
      route_name: payload.route_name || null,
      payload: config.transformPayload ? config.transformPayload(payload) : payload
    };

    return { report: report };
  }

  async function mount(config) {
    buildCountrySelect('mdCountry');
    buildCountrySelect('mdReportCountry');
    renderReportFields(config);

    var reportCurrency = $('mdReportCurrency');
    if (reportCurrency && window.AfroPointsEngine) {
      reportCurrency.value = window.AfroPointsEngine.getCurrency($('mdReportCountry').value || 'NG');
    }

    var filterInputs = Array.prototype.slice.call(document.querySelectorAll('[data-md-filter]'));
    filterInputs.forEach(function (input) {
      input.addEventListener('change', loadData);
      if (input.tagName === 'INPUT') input.addEventListener('input', loadData);
    });

    var refreshButton = $('mdRefresh');
    if (refreshButton) refreshButton.addEventListener('click', loadData);

    var reportButton = $('mdSubmitReport');
    if (reportButton) {
      reportButton.addEventListener('click', async function () {
        if (!window.AfroAuth || !window.AfroAuth.isLoggedIn()) {
          showToast('Please sign in before submitting a report', 'error');
          return;
        }

        var submission = collectReportPayload(config);
        if (submission.error) {
          showToast(submission.error, 'error');
          return;
        }

        reportButton.disabled = true;
        reportButton.textContent = 'Submitting...';
        try {
          var result = await window.AfroPointsEngine.submitContribution(submission.report);
          if (result && result.error) {
            showToast(result.error, 'error');
          } else {
            showToast('Report submitted. Points will appear on your AfroPoints profile.', 'success');
            loadData();
          }
        } catch (error) {
          showToast('Submission failed. Please try again.', 'error');
        }
        reportButton.disabled = false;
        reportButton.textContent = config.reportButtonLabel || 'Submit Report';
      });
    }

    async function loadData() {
      var params = new URLSearchParams();
      filterInputs.forEach(function (input) {
        if (input.value) params.set(input.getAttribute('data-md-filter'), input.value);
      });
      params.set('limit', config.limit || '24');

      var list = $('mdList');
      if (list) list.innerHTML = '<div class="md-empty">Loading live data...</div>';

      try {
        var response = await fetch(config.endpoint + '?' + params.toString());
        var data = await response.json();
        var rows = data[config.responseKey] || data.rows || [];
        var summary = $('mdSummary');

        if (summary) {
          if (typeof config.renderSummary === 'function') {
            summary.innerHTML = config.renderSummary(rows, data, { formatNumber: formatNumber, escapeHtml: escapeHtml });
          } else {
            summary.innerHTML =
              '<div class="md-stat"><div class="md-stat-value">' + formatNumber(rows.length) + '</div><div class="md-stat-label">Verified records</div></div>' +
              '<div class="md-stat"><div class="md-stat-value">' + escapeHtml(($('mdCountry').value || 'ALL')) + '</div><div class="md-stat-label">Country filter</div></div>' +
              '<div class="md-stat"><div class="md-stat-value">' + escapeHtml(($('mdCity').value || 'All cities')) + '</div><div class="md-stat-label">City filter</div></div>';
          }
        }

        if (!rows.length) {
          list.innerHTML = '<div class="md-empty">No verified records match these filters yet. Use the report form to seed the dataset.</div>';
          return;
        }

        list.innerHTML = rows.map(function (row) {
          return config.renderCard(row, {
            escapeHtml: escapeHtml,
            formatNumber: formatNumber,
            currency: row.currency_code || row.currency || ''
          });
        }).join('');
      } catch (error) {
        if (list) list.innerHTML = '<div class="md-empty">Live data is temporarily unavailable.</div>';
      }
    }

    loadData();
  }

  window.MarketDataApp = {
    mount: mount,
    showToast: showToast,
    escapeHtml: escapeHtml,
    formatNumber: formatNumber
  };
})(window, document);
