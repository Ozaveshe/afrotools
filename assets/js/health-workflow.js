(function () {
  'use strict';

  var PLAN_KEY = 'afro_health_plans';
  var EMAIL_KEY = 'afrotools_health_pdf_lead';
  var SCRIPT_CACHE = {};
  var state = { lastSnapshot: null };

  var JOURNEYS = {
    vitals: {
      title: 'Vitals checkup',
      summary: 'BMI, waist ratio, blood pressure, diabetes risk, and hydration in one reusable screening workflow.',
      toolIds: ['bmi-calculator', 'waist-hip-ratio', 'blood-pressure', 'diabetes-risk', 'water-intake'],
      href: '/health/bmi-calculator/',
      next: ['Record the same measurements again under similar conditions.', 'Save a PDF for a clinic or wellness conversation.', 'Open the diabetes or blood-pressure tool if the current result needs follow-up.']
    },
    family: {
      title: 'Pregnancy and child care plan',
      summary: 'Due date, pregnancy nutrition, childbirth cost, vaccines, growth, and breastfeeding support in one family-health flow.',
      toolIds: ['due-date', 'pregnancy-nutrition', 'childbirth-cost', 'vaccine-schedule', 'child-growth', 'breastfeeding-tracker'],
      href: '/health/pregnancy-due-date/',
      next: ['Confirm local antenatal and immunization schedules with a clinic.', 'Save dates, costs, and feeding notes into the dashboard.', 'Use the PDF as a visit-prep checklist, not a diagnosis.']
    },
    costs: {
      title: 'Care cost planner',
      summary: 'Hospital, clinic, pharmacy, dental, mental-health, and medical-travel estimates with quote-proof prompts.',
      toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'drug-price-compare', 'dental-cost', 'medical-tourism'],
      href: '/health/costs/',
      next: ['Replace defaults with real quotes before deciding.', 'Save the plan with facility, date, currency, and source notes.', 'Compare follow-up access and emergency support, not price only.']
    },
    clinical: {
      title: 'Clinical safety checklist',
      summary: 'Malaria, water safety, dosage verification, HIV, TB, cholera, Ebola, and Hepatitis B tools grouped for safer escalation.',
      toolIds: ['malaria-risk', 'water-quality', 'drug-dosage', 'hiv-treatment-cost', 'tb-tracker', 'cholera-risk', 'ebola-checklist', 'hep-b-screening'],
      href: '/tools/malaria-risk/',
      next: ['Use local public-health advice as the authority.', 'Document dates, symptoms, exposure, doses, and clinic instructions.', 'Escalate quickly for severe symptoms or known outbreak exposure.']
    },
    labs: {
      title: 'Labs and compatibility pack',
      summary: 'Medical reports, genotype, blood group, and sickle-cell guidance as a private questions-for-clinic workflow.',
      toolIds: ['medical-report', 'genotype-checker', 'blood-group', 'sickle-cell'],
      href: '/tools/medical-report/',
      next: ['Use verified lab records only.', 'Save questions, not raw private reports, when possible.', 'Bring the result to a clinician, lab, or genetic counsellor before acting.']
    },
    nutrition: {
      title: 'Nutrition and activity plan',
      summary: 'African-food calories, meal planning, home workouts, and gym costs combined into a weekly habit plan.',
      toolIds: ['calorie-counter', 'african-meal-plan', 'home-workout', 'gym-cost-compare'],
      href: '/health/calorie-counter/',
      next: ['Choose foods and activity that fit the household routine.', 'Review the plan weekly instead of chasing one perfect day.', 'Pause exercise and seek care for chest pain, fainting, injury, or severe breathlessness.']
    }
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function text(value, fallback) {
    var out = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return out || fallback || '';
  }

  function safeHref(value) {
    var href = text(value, '/health/');
    return href.charAt(0) === '/' || href.charAt(0) === '#' ? href : '/health/';
  }

  function cssId(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  }

  function registryTool(id) {
    try {
      if (typeof AFRO_TOOLS === 'undefined') return null;
      return AFRO_TOOLS.find(function (tool) { return tool && tool.id === id; }) || null;
    } catch (error) {
      return null;
    }
  }

  function readJson(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || '');
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getPlans() {
    var plans = readJson(PLAN_KEY, []);
    return Array.isArray(plans) ? plans : [];
  }

  function setPlans(plans) {
    writeJson(PLAN_KEY, plans.slice(0, 40));
    try {
      window.dispatchEvent(new CustomEvent('afro-workspace-change', {
        detail: { action: 'health-plan-save', itemType: 'health-plan', count: plans.length }
      }));
    } catch (error) {}
  }

  function loadScript(src) {
    if (SCRIPT_CACHE[src]) return SCRIPT_CACHE[src];
    SCRIPT_CACHE[src] = new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return SCRIPT_CACHE[src];
  }

  function ensureWorkspaceScripts() {
    if (window.AfroWorkspace && window.AfroWorkspace.upsert) return Promise.resolve();
    return loadScript('/assets/js/afro-auth.js')
      .catch(function () {})
      .then(function () { return loadScript('/assets/js/lib/workspace-sync.js'); })
      .catch(function () {});
  }

  function toast(message, tone) {
    var el = document.getElementById('health-workflow-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'health-workflow-toast';
      el.className = 'health-workflow-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.setAttribute('data-tone', tone || 'info');
    el.classList.add('show');
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function pageToolId() {
    if (window.HEALTH_TOOL_CONFIG && window.HEALTH_TOOL_CONFIG.id) return window.HEALTH_TOOL_CONFIG.id;
    var meta = document.querySelector('meta[name="tool-id"]');
    if (meta && meta.content) return meta.content;
    var kit = document.querySelector('[data-health-tool-id]');
    if (kit) return kit.getAttribute('data-health-tool-id');
    var match = location.pathname.match(/\/(?:tools|health)\/([^/]+)/);
    return match ? match[1] : 'health';
  }

  function contextFromTrigger(trigger) {
    var kit = trigger && trigger.closest ? trigger.closest('.health-action-kit, [data-health-source-name]') : null;
    if ((!kit || !kit.getAttribute('data-health-source-name')) && trigger && trigger.closest) {
      kit = trigger.closest('section[data-health-tool-id]');
    }
    if (!kit) kit = document.querySelector('[data-health-tool-id="' + pageToolId() + '"]') || document.querySelector('[data-health-tool-id]');
    var id = (trigger && trigger.getAttribute && trigger.getAttribute('data-health-tool-id')) || (kit && kit.getAttribute('data-health-tool-id')) || pageToolId();
    var reg = registryTool(id) || {};
    return {
      id: id,
      name: text((kit && kit.getAttribute('data-health-tool-name')) || reg.name || document.querySelector('h1') && document.querySelector('h1').textContent, 'Health tool'),
      href: safeHref((kit && kit.getAttribute('data-health-href')) || reg.href || location.pathname),
      bucket: text(kit && kit.getAttribute('data-health-bucket'), 'health'),
      sourceName: text(kit && kit.getAttribute('data-health-source-name'), 'Health source'),
      sourceUrl: text(kit && kit.getAttribute('data-health-source-url'), ''),
      competitor: text(kit && kit.getAttribute('data-health-competitor'), ''),
      feature: text(kit && kit.getAttribute('data-health-feature'), ''),
      journey: text((trigger && trigger.getAttribute && trigger.getAttribute('data-health-journey')) || (kit && kit.getAttribute('data-health-journey')), '')
    };
  }

  function collectInputs() {
    var fields = [];
    var root = document.getElementById('health-app-root') || document.querySelector('main') || document;
    Array.prototype.forEach.call(root.querySelectorAll('input, select, textarea'), function (el) {
      if (!el.id || el.type === 'hidden' || el.type === 'password' || el.type === 'file') return;
      if (el.closest('.health-email-modal')) return;
      var label = root.querySelector('label[for="' + cssId(el.id) + '"]');
      var value = el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value;
      if (!value) return;
      value = String(value);
      if (el.tagName === 'TEXTAREA' && value.length > 80) value = value.slice(0, 80).trim() + '...';
      fields.push({ label: text(label && label.textContent, el.id), value: value });
    });
    return fields.slice(0, 12);
  }

  function collectResult(ctx) {
    var snap = state.lastSnapshot;
    if (snap && (!snap.toolId || snap.toolId === ctx.id)) return snap;
    var result = document.getElementById('health-app-result');
    var body = result && result.classList.contains('show') ? text(result.textContent, '') : '';
    return body ? { headline: body.slice(0, 140), resultText: body.slice(0, 700), fields: collectInputs() } : { headline: '', fields: collectInputs() };
  }

  function relatedTools(ids) {
    return (ids || []).map(function (id) {
      var tool = registryTool(id);
      return tool ? { id: tool.id, name: tool.name, href: tool.href } : null;
    }).filter(Boolean);
  }

  function buildPlan(trigger, options) {
    options = options || {};
    var ctx = contextFromTrigger(trigger);
    var journey = JOURNEYS[options.journey || ctx.journey || ctx.bucket] || null;
    var snapshot = collectResult(ctx);
    var now = new Date().toISOString();
    var title = journey && options.mode === 'journey' ? journey.title : ctx.name + ' plan';
    var summary = snapshot.headline || (journey ? journey.summary : 'Saved Health workflow from AfroTools.');
    return {
      id: 'health-plan-' + ctx.id + '-' + Date.now(),
      type: 'health-plan',
      title: title,
      summary: summary,
      toolId: ctx.id,
      toolName: ctx.name,
      href: ctx.href,
      bucket: ctx.bucket,
      sourceName: ctx.sourceName,
      sourceUrl: ctx.sourceUrl,
      competitor: ctx.competitor,
      feature: ctx.feature,
      journeyKey: journey ? (options.journey || ctx.journey || ctx.bucket) : '',
      journey: journey,
      related: journey ? relatedTools(journey.toolIds) : [],
      snapshot: snapshot,
      inputs: snapshot.fields || collectInputs(),
      savedAt: now,
      syncStatus: 'device'
    };
  }

  function saveDevicePlan(plan) {
    var plans = getPlans().filter(function (item) { return item && item.id !== plan.id; });
    plans.unshift(plan);
    setPlans(plans);
    try {
      if (window.AfroData && window.AfroData.save) window.AfroData.save(plan.toolId || 'health', plan);
      if (window.AfroData && window.AfroData.logToolUse) window.AfroData.logToolUse(plan.toolId || 'health', plan.toolName || plan.title);
    } catch (error) {}
  }

  function syncPlan(plan) {
    return ensureWorkspaceScripts().then(function () {
      if (!window.AfroWorkspace || !window.AfroWorkspace.upsert || !window.AfroWorkspace.isSignedIn || !window.AfroWorkspace.isSignedIn()) {
        return false;
      }
      return window.AfroWorkspace.upsert({
        itemType: 'health-plan',
        itemKey: plan.id,
        toolSlug: plan.toolId || 'health',
        title: plan.title,
        summary: plan.summary,
        href: plan.href,
        payload: plan,
        meta: {
          category: 'health',
          bucket: plan.bucket || '',
          source: 'health-workflow',
          sourceName: plan.sourceName || '',
          sourceUrl: plan.sourceUrl || ''
        }
      }).then(function () { return true; }).catch(function () { return false; });
    });
  }

  function savePlan(trigger, options) {
    var plan = buildPlan(trigger, options);
    saveDevicePlan(plan);
    toast('Saved to your dashboard workspace on this device.', 'success');
    syncPlan(plan).then(function (synced) {
      if (synced) {
        plan.syncStatus = 'cloud';
        saveDevicePlan(plan);
        toast('Saved to your account dashboard and this device.', 'success');
      }
    });
    return plan;
  }

  function captureLead(email, plan, extra) {
    var payload = {
      email: email,
      name: extra && extra.name || '',
      source: 'health-pdf-gate',
      toolSlug: plan.toolId || 'health',
      optInDigest: true,
      countryCode: extra && extra.country || '',
      pageUrl: location.href,
      referrerUrl: document.referrer || '',
      deviceType: window.innerWidth < 720 ? 'mobile' : 'desktop',
      industry: 'Healthcare',
      conversionValue: 0
    };
    return fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  function storedLead() {
    var lead = readJson(EMAIL_KEY, null);
    return lead && /@/.test(lead.email || '') ? lead : null;
  }

  function openEmailGate(plan, callback) {
    var saved = storedLead();
    if (saved) {
      captureLead(saved.email, plan, saved).finally(callback);
      return;
    }
    var modal = document.createElement('div');
    modal.className = 'health-email-modal';
    modal.innerHTML =
      '<div class="health-modal-card" role="dialog" aria-modal="true" aria-labelledby="health-email-title">' +
        '<button type="button" class="health-modal-close" aria-label="Close">x</button>' +
        '<span class="health-modal-kicker">PDF health plan</span>' +
        '<h2 id="health-email-title">Send yourself a reusable Health plan</h2>' +
        '<p>Enter an email to unlock the PDF. The PDF is informational and should be reviewed with a qualified health worker for medical decisions.</p>' +
        '<form class="health-email-form">' +
          '<label>Email address<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>' +
          '<label>Name <span>optional</span><input type="text" name="name" autocomplete="name" placeholder="Your name"></label>' +
          '<label>Country <span>optional</span><input type="text" name="country" maxlength="2" placeholder="NG"></label>' +
          '<button type="submit">Unlock PDF</button>' +
        '</form>' +
        '<p class="health-modal-fine">We save the PDF gate email on this device so you do not need to enter it every time.</p>' +
      '</div>';
    document.body.appendChild(modal);
    var close = function () { modal.remove(); };
    modal.querySelector('.health-modal-close').addEventListener('click', close);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });
    modal.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var fields = form.elements || {};
      var lead = {
        email: text(fields.email && fields.email.value, ''),
        name: text(fields.name && fields.name.value, ''),
        country: text(fields.country && fields.country.value, '').toUpperCase().slice(0, 2)
      };
      if (!/@/.test(lead.email)) {
        toast('Enter a valid email to unlock the PDF.', 'warn');
        return;
      }
      writeJson(EMAIL_KEY, lead);
      captureLead(lead.email, plan, lead).finally(function () {
        close();
        callback();
      });
    });
    setTimeout(function () {
      var input = modal.querySelector('input[name="email"]');
      if (input) input.focus();
    }, 50);
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').then(function () {
      return window.jspdf && window.jspdf.jsPDF;
    });
  }

  function addWrapped(doc, textValue, x, y, width, lineHeight) {
    var lines = doc.splitTextToSize(text(textValue, ''), width);
    doc.text(lines, x, y);
    return y + Math.max(1, lines.length) * lineHeight;
  }

  function downloadPdf(plan) {
    ensurePdfLibrary().then(function (PDF) {
      if (!PDF) throw new Error('PDF library unavailable');
      var doc = new PDF({ unit: 'pt', format: 'a4' });
      var margin = 44;
      var y = 48;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      y = addWrapped(doc, plan.title || 'AfroTools Health Plan', margin, y, 500, 20) + 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Generated by AfroTools on ' + new Date(plan.savedAt || Date.now()).toLocaleString(), margin, y);
      y += 24;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', margin, y);
      doc.setFont('helvetica', 'normal');
      y = addWrapped(doc, plan.summary || 'Saved Health workflow.', margin, y + 18, 500, 15) + 10;
      if (plan.competitor || plan.feature) {
        doc.setFont('helvetica', 'bold');
        doc.text('Feature benchmark', margin, y);
        doc.setFont('helvetica', 'normal');
        y = addWrapped(doc, (plan.competitor ? plan.competitor + ': ' : '') + (plan.feature || ''), margin, y + 18, 500, 15) + 10;
      }
      if (plan.inputs && plan.inputs.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Inputs saved', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 18;
        plan.inputs.slice(0, 10).forEach(function (field) {
          y = addWrapped(doc, field.label + ': ' + field.value, margin, y, 500, 14);
        });
        y += 8;
      }
      if (plan.journey && plan.journey.next) {
        doc.setFont('helvetica', 'bold');
        doc.text('Next steps', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 18;
        plan.journey.next.forEach(function (step, index) {
          y = addWrapped(doc, (index + 1) + '. ' + step, margin, y, 500, 14);
        });
        y += 8;
      }
      if (plan.sourceUrl) {
        doc.setFont('helvetica', 'bold');
        doc.text('Reference', margin, y);
        doc.setFont('helvetica', 'normal');
        y = addWrapped(doc, (plan.sourceName || 'Source') + ' - ' + plan.sourceUrl, margin, y + 18, 500, 14) + 8;
      }
      doc.setFontSize(9);
      doc.setTextColor(90, 99, 112);
      addWrapped(doc, 'Medical disclaimer: This PDF is for planning and record keeping only. It does not replace professional medical advice, diagnosis, treatment, public-health guidance, or emergency care.', margin, 770, 500, 12);
      var file = 'afrotools-health-' + (plan.toolId || 'plan') + '-' + new Date().toISOString().slice(0, 10) + '.pdf';
      doc.save(file);
      saveDevicePlan(plan);
      toast('PDF unlocked and Health plan saved to dashboard.', 'success');
    }).catch(function () {
      toast('PDF export is not available right now. The plan was saved to your dashboard.', 'warn');
      saveDevicePlan(plan);
    });
  }

  function pdfPlan(trigger, options) {
    var plan = savePlan(trigger, options);
    openEmailGate(plan, function () { downloadPdf(plan); });
  }

  function renderHubBuilder() {
    var target = document.getElementById('health-workflow-builder');
    if (!target) return;
    target.innerHTML = '<div class="health-journey-grid">' + Object.keys(JOURNEYS).map(function (key) {
      var journey = JOURNEYS[key];
      return '<article class="health-journey-card">' +
        '<div class="health-journey-card-head"><span>' + esc(journey.toolIds.length) + ' tools</span><strong>' + esc(journey.title) + '</strong></div>' +
        '<p>' + esc(journey.summary) + '</p>' +
        '<div class="health-journey-tools">' + relatedTools(journey.toolIds).slice(0, 4).map(function (tool) {
          return '<a href="' + esc(safeHref(tool.href)) + '">' + esc(tool.name) + '</a>';
        }).join('') + '</div>' +
        '<div class="health-action-buttons">' +
          '<a class="health-workflow-btn" href="' + esc(safeHref(journey.href)) + '">Start workflow</a>' +
          '<button type="button" class="health-workflow-btn secondary" data-health-action="save-journey" data-health-journey="' + esc(key) + '">Save journey</button>' +
          '<button type="button" class="health-workflow-btn ghost" data-health-action="pdf-journey" data-health-journey="' + esc(key) + '">PDF plan</button>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function bindActions() {
    document.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-health-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-health-action');
      if (action === 'save') {
        event.preventDefault();
        savePlan(btn);
      } else if (action === 'pdf') {
        event.preventDefault();
        pdfPlan(btn);
      } else if (action === 'save-journey') {
        event.preventDefault();
        savePlan(btn, { mode: 'journey', journey: btn.getAttribute('data-health-journey') });
      } else if (action === 'pdf-journey') {
        event.preventDefault();
        pdfPlan(btn, { mode: 'journey', journey: btn.getAttribute('data-health-journey') });
      }
    });
  }

  function recordSnapshot(snapshot) {
    state.lastSnapshot = Object.assign({ generatedAt: new Date().toISOString() }, snapshot || {});
  }

  function logPageUse() {
    var id = pageToolId();
    var tool = registryTool(id);
    try {
      if (id && window.AfroData && window.AfroData.logToolUse) {
        window.AfroData.logToolUse(id, tool && tool.name || document.title.replace(/\s*\|\s*AfroTools.*/, ''));
      }
    } catch (error) {}
  }

  function init() {
    renderHubBuilder();
    bindActions();
    logPageUse();
  }

  window.AfroHealthWorkflow = {
    getPlans: getPlans,
    savePlan: savePlan,
    recordSnapshot: recordSnapshot,
    journeys: JOURNEYS
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
