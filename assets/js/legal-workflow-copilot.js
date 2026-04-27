(function () {
  'use strict';

  var LIST_KEY = 'afro_legal_workflows';
  var EMAIL_KEY = 'afro_legal_lead_email';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function $(root, selector) {
    if (typeof root === 'string') return (selector || document).querySelector(root);
    return root ? root.querySelector(selector) : null;
  }

  function all(root, selector) {
    if (typeof root === 'string') return Array.prototype.slice.call((selector || document).querySelectorAll(root));
    return root ? Array.prototype.slice.call(root.querySelectorAll(selector)) : [];
  }

  function safeJson(text, fallback) {
    try {
      return JSON.parse(text || '');
    } catch (err) {
      return fallback || {};
    }
  }

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
  }

  function getParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || '';
    } catch (err) {
      return '';
    }
  }

  function deviceType() {
    var width = window.innerWidth || document.documentElement.clientWidth || 1024;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  function countryCode(value) {
    var text = clean(value).toLowerCase();
    if (!text) return '';
    var codes = {
      algeria: 'DZ',
      angola: 'AO',
      benin: 'BJ',
      botswana: 'BW',
      burkina: 'BF',
      burundi: 'BI',
      cameroon: 'CM',
      egypt: 'EG',
      ethiopia: 'ET',
      ghana: 'GH',
      kenya: 'KE',
      morocco: 'MA',
      nigeria: 'NG',
      rwanda: 'RW',
      senegal: 'SN',
      'south africa': 'ZA',
      tanzania: 'TZ',
      tunisia: 'TN',
      uganda: 'UG',
      zambia: 'ZM',
      zimbabwe: 'ZW'
    };
    var direct = text.match(/\b(DZ|AO|BJ|BW|BF|BI|CV|CM|CF|TD|KM|CG|CD|CI|DJ|EG|GQ|ER|SZ|ET|GA|GM|GH|GN|GW|KE|LS|LR|LY|MG|MW|ML|MR|MU|MA|MZ|NA|NE|NG|RW|ST|SN|SC|SL|SO|ZA|SS|SD|TZ|TG|TN|UG|ZM|ZW)\b/i);
    if (direct) return direct[1].toUpperCase();
    var found = Object.keys(codes).find(function (name) { return text.indexOf(name) !== -1; });
    return found ? codes[found] : '';
  }

  function getField(section, name) {
    var el = section.querySelector('[data-workflow-field="' + name + '"]');
    return el ? clean(el.value) : '';
  }

  function setField(section, name, value) {
    var el = section.querySelector('[data-workflow-field="' + name + '"]');
    if (el) el.value = value || '';
  }

  function getChecked(section, kind) {
    return all(section, '[data-workflow-' + kind + ']')
      .filter(function (input) { return input.checked; })
      .map(function (input) { return input.value; });
  }

  function setChecked(section, kind, values) {
    var lookup = {};
    (values || []).forEach(function (value) { lookup[value] = true; });
    all(section, '[data-workflow-' + kind + ']').forEach(function (input) {
      input.checked = !!lookup[input.value];
    });
  }

  function storageKey(config) {
    return 'afrotools-legal-workflow:' + (config.slug || window.location.pathname);
  }

  function gateKey(config) {
    return 'afrotools-legal-pdf-gate:' + (config.slug || window.location.pathname);
  }

  function itemKey(config) {
    return 'legal-' + String(config.slug || window.location.pathname).replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-');
  }

  function readList() {
    var list = safeJson(localStorage.getItem(LIST_KEY), []);
    return Array.isArray(list) ? list : [];
  }

  function writeList(list) {
    localStorage.setItem(LIST_KEY, JSON.stringify(list.slice(0, 100)));
  }

  function upsertList(record) {
    var list = readList().filter(function (item) { return item.itemKey !== record.itemKey; });
    list.unshift(record);
    writeList(list);
  }

  function buildOptions(container, items, kind) {
    if (!container) return;
    container.innerHTML = '';
    (items || []).slice(0, 6).forEach(function (item, index) {
      var id = kind + '-' + index + '-' + Math.random().toString(36).slice(2, 7);
      var label = document.createElement('label');
      label.className = 'leg-workflow-check';
      label.setAttribute('for', id);
      label.innerHTML = '<input id="' + id + '" type="checkbox" data-workflow-' + kind + ' value=""><span></span>';
      label.querySelector('input').value = item;
      label.querySelector('span').textContent = item;
      container.appendChild(label);
    });
  }

  function workflowState(section) {
    return {
      matter: getField(section, 'matter'),
      country: getField(section, 'country'),
      date: getField(section, 'date'),
      status: getField(section, 'status') || 'Checking evidence',
      note: getField(section, 'note'),
      email: getField(section, 'email'),
      evidence: getChecked(section, 'evidence'),
      risks: getChecked(section, 'risk')
    };
  }

  function makeSummary(config, data) {
    var evidenceMissing = (config.evidence || []).filter(function (item) {
      return data.evidence.indexOf(item) === -1;
    });
    var riskStatus = data.risks.length
      ? 'Escalate before filing, signing, publishing, or relying on the output.'
      : 'No listed red flags selected.';
    var competitor = config.competitor && config.competitor.label ? config.competitor.label : 'reviewed competitor tools';
    var lines = [
      clean(config.workflowTitle || config.title || 'Legal workflow') + ' handoff note',
      'Tool: ' + clean(config.slug || window.location.pathname),
      'Coverage: ' + clean(config.coverage || 'Check page coverage label'),
      'Matter: ' + (data.matter || 'Not named'),
      'Country or regime: ' + (data.country || 'Not specified'),
      'Target date: ' + (data.date || 'Not set'),
      'Status: ' + data.status,
      '',
      'Competitor lens:',
      '- Benchmarked against ' + competitor + ' on 28 April 2026.',
      '',
      'Decision this supports:',
      '- ' + clean(config.decision || 'Review the app output and supporting evidence before acting.'),
      '',
      'Evidence checked:',
      data.evidence.length ? data.evidence.map(function (item) { return '- ' + item; }).join('\n') : '- None marked yet',
      '',
      'Evidence still missing:',
      evidenceMissing.length ? evidenceMissing.map(function (item) { return '- ' + item; }).join('\n') : '- No listed evidence gaps',
      '',
      'Risk review:',
      riskStatus,
      data.risks.length ? data.risks.map(function (item) { return '- ' + item; }).join('\n') : '- No listed red flags selected',
      '',
      'Notes:',
      data.note || '- No extra notes added',
      '',
      'Next action:',
      evidenceMissing.length || data.risks.length
        ? 'Pause and collect evidence or escalate before relying on the result.'
        : 'Save this note with the app output and verify the latest official source before final action.'
    ];
    return lines.join('\n');
  }

  function updateStatus(section, config, data) {
    var summary = $('[data-workflow-summary]', section);
    if (!summary) return;
    var missing = Math.max((config.evidence || []).length - data.evidence.length, 0);
    var riskCount = data.risks.length;
    var label = riskCount ? 'Escalate' : missing ? 'Needs evidence' : 'Ready to verify';
    summary.innerHTML = '<strong>' + label + '</strong><span>' + data.evidence.length + ' evidence item(s) checked, '
      + missing + ' still open, ' + riskCount + ' risk flag(s) selected.</span>';
  }

  function setGateStatus(section, message, tone) {
    var status = $('[data-workflow-gate-status]', section);
    if (!status) return;
    status.textContent = message || '';
    status.style.color = tone === 'error' ? '#b91c1c' : tone === 'success' ? '#166534' : '#1d4ed8';
  }

  function generate(section, config) {
    var data = workflowState(section);
    var output = $('[data-workflow-output]', section);
    if (output) output.value = makeSummary(config, data);
    updateStatus(section, config, data);
    return data;
  }

  function buildRecord(section, config, data) {
    var summary = makeSummary(config, data);
    var title = data.matter || config.title || config.workflowTitle || 'Legal workflow';
    var country = data.country || config.coverage || 'Legal';
    var href = window.location.pathname + window.location.search;
    return {
      itemKey: itemKey(config),
      itemType: 'legal-workflow',
      toolSlug: config.slug || '',
      title: title,
      summary: country + ' - ' + data.status,
      href: href,
      updatedAt: new Date().toISOString(),
      payload: {
        state: data,
        output: summary,
        config: {
          slug: config.slug,
          title: config.title,
          workflowTitle: config.workflowTitle,
          coverage: config.coverage,
          related: config.related || []
        }
      },
      meta: {
        category: 'legal',
        country: data.country || '',
        status: data.status,
        risks: data.risks.length,
        evidenceChecked: data.evidence.length,
        pdfUnlocked: isUnlocked(config)
      }
    };
  }

  function persistLocal(section, config, data) {
    var record = buildRecord(section, config, data);
    localStorage.setItem(storageKey(config), JSON.stringify(data));
    upsertList(record);
    window.dispatchEvent(new CustomEvent('afro-workspace-change', { detail: { type: 'legal-workflow', item: record } }));
    return record;
  }

  function persistWorkspace(record) {
    if (!window.AfroWorkspace || typeof window.AfroWorkspace.upsert !== 'function') return Promise.resolve(false);
    if (window.AfroWorkspace.isSignedIn && !window.AfroWorkspace.isSignedIn()) return Promise.resolve(false);
    return window.AfroWorkspace.upsert({
      itemType: record.itemType,
      itemKey: record.itemKey,
      toolSlug: record.toolSlug,
      title: record.title,
      summary: record.summary,
      href: record.href,
      payload: record.payload,
      meta: record.meta
    }).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  function save(section, config, button) {
    var data = generate(section, config);
    var record;
    try {
      record = persistLocal(section, config, data);
    } catch (err) {
      setGateStatus(section, 'Could not save this workflow in your browser.', 'error');
      return Promise.resolve(false);
    }
    var original = button ? button.textContent : '';
    if (button) button.textContent = 'Saved locally';
    return persistWorkspace(record).then(function (synced) {
      if (button) {
        button.textContent = synced ? 'Saved to dashboard' : 'Saved for dashboard';
        setTimeout(function () { button.textContent = original; }, 1800);
      }
      setGateStatus(section, synced ? 'Saved to your account workspace and dashboard.' : 'Saved on this device. The dashboard can show it locally.', 'success');
      return true;
    });
  }

  function load(section, config) {
    try {
      var raw = localStorage.getItem(storageKey(config));
      if (!raw) {
        setGateStatus(section, 'No saved workflow found for this app on this device.', 'error');
        return;
      }
      var data = safeJson(raw, {});
      setField(section, 'matter', data.matter);
      setField(section, 'country', data.country);
      setField(section, 'date', data.date);
      setField(section, 'status', data.status || 'Checking evidence');
      setField(section, 'note', data.note);
      setField(section, 'email', data.email || localStorage.getItem(EMAIL_KEY) || '');
      setChecked(section, 'evidence', data.evidence);
      setChecked(section, 'risk', data.risks);
      generate(section, config);
      setGateStatus(section, 'Saved workflow loaded.', 'success');
    } catch (err) {
      setGateStatus(section, 'Saved workflow could not be loaded.', 'error');
    }
  }

  function copy(section) {
    var output = $('[data-workflow-output]', section);
    var button = $('[data-workflow-copy]', section);
    if (!output || !button) return;
    var original = button.textContent;
    var done = function () {
      button.textContent = 'Copied';
      setTimeout(function () { button.textContent = original; }, 1600);
    };
    var fallback = function () {
      output.focus();
      output.select();
      try {
        document.execCommand('copy');
        done();
      } catch (err) {
        button.textContent = 'Select text manually';
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output.value).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function isUnlocked(config) {
    var data = safeJson(localStorage.getItem(gateKey(config)), null);
    return !!(data && data.email && data.unlockedAt);
  }

  function markUnlocked(config, email) {
    localStorage.setItem(gateKey(config), JSON.stringify({ email: email, unlockedAt: new Date().toISOString() }));
    localStorage.setItem(EMAIL_KEY, email);
  }

  function captureLead(section, config, button) {
    var data = generate(section, config);
    var email = data.email || localStorage.getItem(EMAIL_KEY) || '';
    if (!validEmail(email)) {
      setGateStatus(section, 'Enter a valid email to unlock the PDF checklist.', 'error');
      var input = $('[data-workflow-email]', section);
      if (input) input.focus();
      return Promise.resolve(false);
    }

    if (button) button.textContent = 'Sending...';
    return save(section, config, null).then(function () {
      var optIn = $('[data-workflow-optin]', section);
      return fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'legal-pdf-gate',
          toolSlug: config.slug || '',
          optInDigest: optIn ? optIn.checked !== false : true,
          countryCode: countryCode(data.country),
          industry: 'Legal',
          pageUrl: window.location.href,
          referrerUrl: document.referrer || '',
          utmSource: getParam('utm_source'),
          utmMedium: getParam('utm_medium'),
          utmCampaign: getParam('utm_campaign'),
          utmContent: getParam('utm_content'),
          deviceType: deviceType(),
          conversionValue: 1
        })
      }).then(function (response) {
        return response.ok ? response.json().catch(function () { return {}; }) : Promise.reject(new Error('lead capture failed'));
      }).then(function () {
        markUnlocked(config, email);
        if (button) button.textContent = 'PDF unlocked';
        setGateStatus(section, 'Checklist unlocked. Use Print or save PDF to keep a copy.', 'success');
        return true;
      }).catch(function () {
        markUnlocked(config, email);
        if (button) button.textContent = 'PDF unlocked';
        setGateStatus(section, 'PDF unlocked on this device. Lead capture was not confirmed by the server.', 'error');
        return true;
      });
    });
  }

  function printOrGate(section, config, button) {
    if (isUnlocked(config)) {
      save(section, config, null).then(function () { window.print(); });
      return;
    }
    captureLead(section, config, button).then(function (ok) {
      if (ok) window.print();
    });
  }

  function prefill(section) {
    var email = localStorage.getItem(EMAIL_KEY);
    if (email && !getField(section, 'email')) setField(section, 'email', email);
  }

  function init(section) {
    var config = safeJson(($('.leg-workflow-data', section) || {}).textContent, {});
    buildOptions($('[data-workflow-evidence-list]', section), config.evidence || [], 'evidence');
    buildOptions($('[data-workflow-risk-list]', section), config.redFlags || [], 'risk');
    prefill(section);

    var raw = localStorage.getItem(storageKey(config));
    if (raw) {
      var data = safeJson(raw, {});
      setField(section, 'matter', data.matter);
      setField(section, 'country', data.country);
      setField(section, 'date', data.date);
      setField(section, 'status', data.status || 'Checking evidence');
      setField(section, 'note', data.note);
      setField(section, 'email', data.email || localStorage.getItem(EMAIL_KEY) || '');
      setChecked(section, 'evidence', data.evidence);
      setChecked(section, 'risk', data.risks);
    }

    all(section, 'input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { generate(section, config); });
      el.addEventListener('change', function () { generate(section, config); });
    });

    var build = $('[data-workflow-build]', section);
    var saveBtn = $('[data-workflow-save]', section);
    var loadBtn = $('[data-workflow-load]', section);
    var copyBtn = $('[data-workflow-copy]', section);
    var printBtn = $('[data-workflow-print]', section);
    var gate = $('[data-workflow-gate]', section);

    if (build) build.addEventListener('click', function () { generate(section, config); });
    if (saveBtn) saveBtn.addEventListener('click', function () { save(section, config, saveBtn); });
    if (loadBtn) loadBtn.addEventListener('click', function () { load(section, config); });
    if (copyBtn) copyBtn.addEventListener('click', function () { copy(section); });
    if (printBtn) printBtn.addEventListener('click', function () { printOrGate(section, config, printBtn); });
    if (gate) {
      gate.addEventListener('submit', function (event) {
        event.preventDefault();
        captureLead(section, config, $('[data-workflow-pdf-gate]', section));
      });
    }

    if (isUnlocked(config)) setGateStatus(section, 'PDF checklist already unlocked on this device.', 'success');
    generate(section, config);
  }

  ready(function () {
    all(document, '.leg-workflow-copilot').forEach(init);
  });
}());
