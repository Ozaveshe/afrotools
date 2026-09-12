(function () {
  'use strict';

  var contract = window.AfroTools && window.AfroTools.B2BChoiceContract;

  function normalizeFallback(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function setSelectValue(select, value, normalize) {
    if (!select || !value) return;
    var normalized = normalize ? normalize(value, '') : normalizeFallback(value);
    Array.prototype.forEach.call(select.options, function (option) {
      if (option.value === normalized) select.value = normalized;
    });
  }

  function setStatus(form, message, tone) {
    var status = form.querySelector('[data-b2b-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone || 'neutral';
  }

  function setField(form, name, value) {
    if (form.elements[name]) form.elements[name].value = value || '';
  }

  function safeReferrer() {
    if (!document.referrer) return '';
    try {
      var referrer = new URL(document.referrer);
      return /^https?:$/.test(referrer.protocol) ? referrer.origin + referrer.pathname : '';
    } catch (error) {
      return '';
    }
  }

  function existingField(form, name) {
    return form.elements[name] ? form.elements[name].value : '';
  }

  function applyContext(form) {
    var params = new URLSearchParams(window.location.search);
    var offer = params.get('offer') || form.dataset.defaultOffer;
    var prospect = params.get('prospect') || params.get('prospect_segment') || form.dataset.defaultProspect;
    var tool = params.get('tool') || form.dataset.defaultTool;
    var source = params.get('source') || params.get('source_route') || form.dataset.source || window.location.pathname;
    var ctaType = params.get('cta_type') || form.dataset.defaultCtaType || form.dataset.ctaType || existingField(form, 'cta_type') || 'business-enquiry-form';

    setSelectValue(form.querySelector('[name="requested_offer"]'), offer, contract && contract.normalizeOffer);
    setSelectValue(form.querySelector('[name="prospect_type"]'), prospect, contract && contract.normalizeProspect);

    if (tool && form.elements.relevant_tool && !form.elements.relevant_tool.value) {
      form.elements.relevant_tool.value = tool;
    }

    setField(form, 'source_path', source);
    setField(form, 'source_route', params.get('source_route') || source);
    setField(form, 'cta_type', ctaType);
    setField(form, 'prospect_segment', params.get('prospect_segment') || prospect || '');
    setField(form, 'page_url', window.location.href);
    setField(form, 'referrer_url', params.get('referrer') || safeReferrer());

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (name) {
      setField(form, name, params.get(name) || '');
    });
  }

  function focusFirstInvalid(form) {
    var invalid = form.querySelector(':invalid');
    if (invalid && invalid.focus) invalid.focus();
  }

  function payloadFromForm(form) {
    var payload = {};
    new FormData(form).forEach(function (value, key) {
      payload[key] = value;
    });
    payload.consent = Boolean(form.querySelector('[name="consent"]:checked'));
    payload.source_path = payload.source_path || form.dataset.source || window.location.pathname;
    payload.source_route = payload.source_route || payload.source_path;
    payload.page_url = payload.page_url || window.location.href;
    payload.referrer_url = payload.referrer_url || safeReferrer() || null;
    return payload;
  }

  function bindForm(form) {
    applyContext(form);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        setStatus(form, 'Please complete the required fields and consent checkbox.', 'error');
        focusFirstInvalid(form);
        form.reportValidity();
        return;
      }

      var submit = form.querySelector('[type="submit"]');
      var originalLabel = submit ? submit.textContent : '';
      var payload = payloadFromForm(form);

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending enquiry...';
      }
      setStatus(form, 'Saving your enquiry securely through AfroTools server...', 'neutral');

      fetch('/api/b2b-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (body) {
            if (!response.ok) throw new Error(body.error || 'Could not send enquiry');
            return body;
          });
        })
        .then(function () {
          form.reset();
          applyContext(form);
          setStatus(form, 'Enquiry received. We will reply with the next practical step.', 'success');
          form.classList.add('b2b-form--sent');
        })
        .catch(function (error) {
          setStatus(form, error.message || 'Could not send enquiry. Email hello@afrotools.com instead.', 'error');
        })
        .finally(function () {
          if (submit) {
            submit.disabled = false;
            submit.textContent = originalLabel;
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-b2b-enquiry-form]').forEach(bindForm);
  });
}());
