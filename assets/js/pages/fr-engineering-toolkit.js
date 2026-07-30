(function () {
  'use strict';

  var storageKey = 'afro_engineering_packs';

  function normalizedRoute(route) {
    var value = String(route || '/')
      .split('?')[0]
      .split('#')[0]
      .replace(/\\/g, '/')
      .replace(/\/index\.html$/i, '/')
      .replace(/\/app\.html$/i, '/app');
    if (!/\/app$/i.test(value) && !/\.[a-z0-9]+$/i.test(value) && !value.endsWith('/')) {
      value += '/';
    }
    return value;
  }

  function text(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function list(items, ordered) {
    var tag = ordered ? 'ol' : 'ul';
    return '<' + tag + '>' + items.map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('') + '</' + tag + '>';
  }

  function optionList(items, values) {
    return items.map(function (item, index) {
      var value = values && values[index] != null ? values[index] : item;
      return '<option value="' + escapeHtml(value) + '">' +
        escapeHtml(item) + '</option>';
    }).join('');
  }

  function markup(config) {
    var presets = config.presets.map(function (preset, index) {
      return '<button type="button" class="eng-preset" data-preset="' +
        index + '">' + escapeHtml(preset.label) + '</button>';
    }).join('');
    return '<section class="eng-toolkit" aria-label="' + escapeHtml(config.name) + '">' +
      '<div class="eng-toolkit-head"><div>' +
      '<div class="eng-toolkit-kicker">' + escapeHtml(config.kicker) + '</div>' +
      '<h2 class="eng-toolkit-title">' + escapeHtml(config.name) + '</h2>' +
      '<p class="eng-toolkit-copy">' + escapeHtml(config.description) + '</p>' +
      '</div><div class="eng-toolkit-actions">' +
      '<button type="button" class="eng-btn eng-btn-primary" data-eng-action="build">Préparer le dossier</button>' +
      '<button type="button" class="eng-btn eng-btn-dashboard" data-eng-action="dashboard">Enregistrer le dossier</button>' +
      '<button type="button" class="eng-btn" data-eng-action="copy">Copier</button>' +
      '<button type="button" class="eng-btn eng-btn-gold" data-eng-action="print">Imprimer</button>' +
      '</div></div><div class="eng-toolkit-body">' +
      (presets ? '<div class="eng-presets">' + presets + '</div>' : '') +
      '<div class="eng-grid"><div class="eng-panel"><h3>Contexte du projet</h3>' +
      '<div class="eng-field-grid"><div class="eng-field">' +
      '<label class="eng-label">Mode</label>' +
      '<select class="eng-select" data-eng-field="mode" aria-label="Mode du projet d’ingénierie">' +
      optionList(config.modes, config.modeValues) + '</select></div>' +
      '<div class="eng-field"><label class="eng-label">Pression de livraison</label>' +
      '<select class="eng-select" data-eng-field="pressure" aria-label="Pression de livraison">' +
      '<option value="Normal">Normale</option><option value="Fast quote">Devis rapide</option><option value="Urgent site decision">Décision urgente de chantier</option><option value="Audit only">Audit uniquement</option>' +
      '</select></div><div class="eng-field"><label class="eng-label">Confiance du devis</label>' +
      '<select class="eng-select" data-eng-field="confidence" aria-label="Confiance du devis">' +
      '<option value="Medium">Moyenne</option><option value="Low">Faible</option><option value="High">Élevée</option><option value="Supplier confirmed">Fournisseur confirmé</option>' +
      '</select></div><div class="eng-field"><label class="eng-label">Marge (%)</label>' +
      '<input class="eng-input" data-eng-field="buffer" aria-label="Pourcentage de marge suggéré" type="number" min="0" max="50" value="10">' +
      '</div><div class="eng-field eng-field-full"><label class="eng-label">Note de chantier</label>' +
      '<textarea class="eng-textarea eng-site-note" data-eng-field="note" aria-label="Note de chantier" placeholder="Accès, sol, contrainte client, devis fournisseur, révision du plan…"></textarea>' +
      '</div></div></div><div class="eng-panel"><h3>Contrôles à conserver</h3>' +
      list(config.checks.slice(0, 5), false) +
      (config.benchmark
        ? '<div class="eng-market-note"><strong>Comparaison locale :</strong> ' +
          escapeHtml(config.benchmark) + '</div>'
        : '') +
      '</div></div><div class="eng-output" aria-live="polite"></div></div></section>';
  }

  function collectControls(toolkit) {
    return Array.prototype.slice.call(
      document.querySelectorAll('input, select, textarea')
    ).filter(function (control) {
      return (control.id || control.name) &&
        control.type !== 'hidden' &&
        control.type !== 'file' &&
        !control.disabled &&
        !control.closest('.eng-toolkit, .eng-floating-panel');
    }).slice(0, 18).map(function (control) {
      var label = control.getAttribute('aria-label') ||
        control.getAttribute('placeholder') ||
        control.id ||
        control.name;
      var value = control.type === 'checkbox'
        ? (control.checked ? 'Oui' : 'Non')
        : (control.tagName === 'SELECT' && control.selectedOptions[0]
            ? control.selectedOptions[0].textContent
            : control.value);
      return { label: text(label), value: text(value) };
    }).filter(function (entry) {
      return entry.value;
    });
  }

  function values(toolkit) {
    return {
      mode: toolkit.querySelector('[data-eng-field="mode"]').value,
      pressure: toolkit.querySelector('[data-eng-field="pressure"]').value,
      confidence: toolkit.querySelector('[data-eng-field="confidence"]').value,
      buffer: toolkit.querySelector('[data-eng-field="buffer"]').value,
      note: toolkit.querySelector('[data-eng-field="note"]').value
    };
  }

  function thresholdRisks(config, controls) {
    var risks = config.risks.slice();
    config.thresholds.forEach(function (threshold) {
      var entry = controls.find(function (control) {
        return control.id === threshold.id || control.name === threshold.id;
      });
      var numeric = entry && Number.parseFloat(entry.value);
      if (!Number.isFinite(numeric)) return;
      if (
        (threshold.min != null && numeric >= threshold.min) ||
        (threshold.max != null && numeric <= threshold.max)
      ) {
        risks.unshift(threshold.message);
      }
    });
    return risks.slice(0, 8);
  }

  function build(config, toolkit) {
    var captured = collectControls(toolkit);
    var context = values(toolkit);
    var risks = thresholdRisks(config, captured);
    var summary = [
      config.name,
      'Mode : ' + context.mode,
      'Pression de livraison : ' + context.pressure,
      'Confiance du devis : ' + context.confidence,
      'Marge suggérée : ' + context.buffer + '%',
      '',
      'Hypothèses relevées :'
    ];
    if (captured.length) {
      captured.slice(0, 10).forEach(function (entry) {
        summary.push('- ' + entry.label + ' : ' + entry.value);
      });
    } else {
      summary.push('- Aucune donnée de calcul détectée sur cette page.');
    }
    summary.push('', 'Contrôles :');
    config.checks.forEach(function (item) { summary.push('- ' + item); });
    summary.push('', 'Risques :');
    risks.forEach(function (item) { summary.push('- ' + item); });
    summary.push('', 'Approvisionnement :');
    config.procurement.forEach(function (item) { summary.push('- ' + item); });
    summary.push('', 'Note de chantier : ' + (context.note || 'Aucune note ajoutée.'));

    var companionLinks = config.companions.map(function (companion) {
      return '<a href="' + escapeHtml(companion.href) + '">' +
        escapeHtml(companion.label) + '</a>';
    }).join('');
    var output = toolkit.querySelector('.eng-output');
    output.innerHTML =
      '<div class="eng-status-strip"><span class="eng-status-pill">Mode : ' +
      escapeHtml(context.mode) + '</span><span class="eng-status-pill">Pression : ' +
      escapeHtml(context.pressure) + '</span><span class="eng-status-pill">Marge : ' +
      escapeHtml(context.buffer) + '%</span></div><div class="eng-output-grid">' +
      '<div class="eng-card"><h4>Hypothèses relevées</h4>' +
      list(captured.length
        ? captured.slice(0, 8).map(function (entry) {
          return entry.label + ' : ' + entry.value;
        })
        : ['Aucune donnée détectée. Lancez l’outil, puis recréez le dossier.'], false) +
      '</div><div class="eng-card"><h4>Risques</h4>' + list(risks, false) +
      '</div><div class="eng-card"><h4>Approvisionnement</h4>' +
      list(config.procurement, false) +
      '</div><div class="eng-card"><h4>Étapes de travail</h4>' +
      list(config.sequence, true) + '</div></div>' +
      (config.benchmark
        ? '<div class="eng-card eng-benchmark"><h4>Comparaison locale</h4><p>' +
          escapeHtml(config.benchmark) + '</p></div>'
        : '') +
      '<div class="eng-card"><h4>Outils associés</h4><div class="eng-companions">' +
      companionLinks + '</div></div>' +
      '<div class="eng-save-status" aria-live="polite">Dossier prêt localement.</div>' +
      '<textarea class="eng-copybox" readonly aria-label="Résumé du dossier">' +
      escapeHtml(summary.join('\n')) + '</textarea>';
    output.classList.add('is-on');
    output.dataset.copyText = summary.join('\n');
    toolkit._frEngineeringPack = {
      config: config,
      controls: captured,
      context: context,
      risks: risks,
      summary: summary.join('\n')
    };
  }

  function applyPreset(config, index) {
    var preset = config.presets[index];
    if (!preset) return;
    Object.keys(preset.values || {}).forEach(function (key) {
      var control = document.getElementById(key) ||
        document.querySelector('[name="' + CSS.escape(key) + '"]');
      if (!control) return;
      if (control.type === 'checkbox') {
        control.checked = preset.values[key] === true ||
          preset.values[key] === 'true' ||
          preset.values[key] === 'yes';
      } else {
        control.value = preset.values[key];
      }
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (preset.note) {
      var note = document.querySelector('.eng-site-note');
      if (note) note.value = preset.note;
    }
  }

  function copy(toolkit) {
    var output = toolkit.querySelector('.eng-output');
    if (!output || !output.dataset.copyText) {
      build(toolkit._frEngineeringConfig, toolkit);
      output = toolkit.querySelector('.eng-output');
    }
    var value = output.dataset.copyText || '';
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value);
      return;
    }
    var field = toolkit.querySelector('.eng-copybox');
    if (field) {
      field.focus();
      field.select();
      document.execCommand('copy');
    }
  }

  function save(toolkit) {
    if (!toolkit._frEngineeringPack) build(toolkit._frEngineeringConfig, toolkit);
    var pack = toolkit._frEngineeringPack;
    var current = [];
    try {
      current = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(current)) current = [];
    } catch (_error) {
      current = [];
    }
    var item = {
      id: 'engineering-pack:' + normalizedRoute(location.pathname),
      itemType: 'engineering-pack',
      title: pack.config.name,
      href: normalizedRoute(location.pathname),
      updatedAt: new Date().toISOString(),
      payload: {
        context: pack.context,
        controls: pack.controls,
        risks: pack.risks
      }
    };
    current = current.filter(function (entry) { return entry.id !== item.id; });
    current.unshift(item);
    try {
      localStorage.setItem(storageKey, JSON.stringify(current.slice(0, 24)));
    } catch (_error) {}
    var status = toolkit.querySelector('.eng-save-status');
    if (status) status.textContent = 'Dossier enregistré localement sur cet appareil.';
  }

  function wire(toolkit, config) {
    toolkit._frEngineeringConfig = config;
    toolkit.addEventListener('click', function (event) {
      var preset = event.target.closest('[data-preset]');
      if (preset) {
        applyPreset(config, Number.parseInt(preset.dataset.preset, 10));
        build(config, toolkit);
        return;
      }
      var action = event.target.closest('[data-eng-action]');
      if (!action) return;
      if (action.dataset.engAction === 'build') build(config, toolkit);
      if (action.dataset.engAction === 'copy') copy(toolkit);
      if (action.dataset.engAction === 'dashboard') save(toolkit);
      if (action.dataset.engAction === 'print') window.print();
    });
  }

  function mount(config) {
    if (document.querySelector('.eng-toolkit, .eng-floating-launch')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = markup(config);
    var toolkit = wrapper.firstElementChild;
    if (config.floating) {
      var launch = document.createElement('button');
      launch.type = 'button';
      launch.className = 'eng-floating-launch';
      launch.textContent = 'Dossier d’ingénierie';
      var panel = document.createElement('aside');
      panel.className = 'eng-floating-panel';
      panel.appendChild(toolkit);
      document.body.appendChild(launch);
      document.body.appendChild(panel);
      launch.addEventListener('click', function () {
        panel.classList.toggle('is-open');
      });
    } else {
      var target = document.querySelector('main .en-container') ||
        document.querySelector('main') ||
        document.querySelector('.landing-page') ||
        document.querySelector('.main') ||
        document.body;
      if (target.classList && target.classList.contains('landing-page')) {
        var before = target.querySelector('.landing-section, .landing-saved');
        if (before) target.insertBefore(toolkit, before);
        else target.appendChild(toolkit);
      } else {
        target.appendChild(toolkit);
      }
    }
    wire(toolkit, config);
  }

  function start() {
    var configs = window.AfroFrenchEngineeringToolkitConfigs || {};
    var config = configs[normalizedRoute(window.location.pathname)];
    if (config) mount(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
