(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var KEY = 'afrotools:afcon-scenario:v1';
  var REQUIRED = ['mode', 'favorite', 'formBoost', 'defenseBoost', 'hostBoost', 'upsetTolerance'];
  var OPTIONAL = ['kenyaStrength', 'replaceSeed'];
  function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function validate(payload, fields) {
    if (!object(payload) || payload.schema_version !== 1 || payload.tool !== 'afcon-predictor'
      || !object(payload.inputs) || Object.keys(payload).some(function (key) { return ['schema_version', 'tool', 'inputs', 'created_at'].indexOf(key) < 0; })) {
      throw Error('Choose an AfroTools AFCON scenario JSON backup (version 1).');
    }
    var values = {}, names = Object.keys(payload.inputs);
    if (REQUIRED.some(function (name) { return names.indexOf(name) < 0; })
      || names.some(function (name) { return REQUIRED.concat(OPTIONAL).indexOf(name) < 0 || !fields[name]; })) {
      throw Error('This backup has missing or unsupported scenario fields. Your current inputs are unchanged.');
    }
    names.forEach(function (name) {
      var value = payload.inputs[name], field = fields[name];
      if (typeof value !== 'string' || value.length > 160) throw Error('Scenario fields must contain valid text values.');
      if (field.options && field.options.indexOf(value) < 0) throw Error('A saved team, mode or replacement is not available in this model.');
      if (field.type === 'number' && value.trim() !== '') {
        var n = Number(value);
        if (!Number.isFinite(n) || n < field.min || n > field.max || (field.step && Math.abs((n - field.min) / field.step - Math.round((n - field.min) / field.step)) > 1e-8)) throw Error('A saved model input is outside its allowed range.');
      } else if (field.type === 'number' && REQUIRED.indexOf(name) >= 0) throw Error('A required model input is empty.');
      values[name] = value;
    });
    if (values.kenyaStrength && (!Number.isFinite(Number(values.kenyaStrength)) || Number(values.kenyaStrength) < 0 || Number(values.kenyaStrength) > 3000)) throw Error('Kenya strength must be from 0 to 3000 model points.');
    if (values.favorite === 'Kenya' && (values.mode !== '2027-planner' || !values.kenyaStrength || !values.replaceSeed)) throw Error('A Kenya scenario needs its 2027 strength assumption and replacement seed.');
    OPTIONAL.forEach(function (name) { if (fields[name] && !Object.prototype.hasOwnProperty.call(values, name)) values[name] = ''; });
    return values;
  }
  function pack(values, fields, date) {
    var result = {schema_version: 1, tool: 'afcon-predictor', created_at: date, inputs: values};
    result.inputs = validate(result, fields); return result;
  }
  function mount(win) {
    var doc = win.document;
    if (!doc.body || doc.body.getAttribute('data-sports-tool') !== 'afcon-predictor') return;
    var form = doc.getElementById('sports-tool-form');
    if (!form || doc.getElementById('afcon-scenario-actions')) return;
    var panel = doc.createElement('section');
    panel.id = 'afcon-scenario-actions'; panel.className = 'sports-scenario-actions';
    panel.setAttribute('aria-labelledby', 'afcon-scenario-heading');
    panel.innerHTML = '<h3 id="afcon-scenario-heading">Keep this scenario</h3>'
      + '<p>Save your input assumptions on this device, or download a JSON backup to reopen later. Reopening recalculates the current model; this is not a forecast or betting odds.</p>'
      + '<div class="sports-report-actions"><button type="button" class="sports-btn secondary" data-scenario-save>Save scenario on this device</button>'
      + '<button type="button" class="sports-btn secondary" data-scenario-reopen>Reopen saved scenario</button>'
      + '<button type="button" class="sports-btn secondary" data-scenario-download>Download scenario JSON</button>'
      + '<button type="button" class="sports-btn secondary" data-scenario-remove>Remove saved scenario</button></div>'
      + '<p><label for="afcon-scenario-file">Open a scenario JSON backup</label><input id="afcon-scenario-file" type="file" accept=".json,application/json"></p>'
      + '<p role="status" aria-live="polite" data-scenario-status></p>';
    form.insertAdjacentElement('afterend', panel);
    var status = panel.querySelector('[data-scenario-status]'), input = panel.querySelector('input'), revision = 0;
    function message(text) { status.textContent = text; }
    function controls() {
      var result = {};
      Array.from(form.elements).forEach(function (node) { if (REQUIRED.concat(OPTIONAL).indexOf(node.name) >= 0) result[node.name] = node; });
      return result;
    }
    function fields() {
      var result = {}, nodes = controls();
      Object.keys(nodes).forEach(function (name) {
        var node = nodes[name];
        result[name] = node.tagName === 'SELECT' ? {options: Array.from(node.options).map(function (option) { return option.value; })}
          : {type: node.type, min: node.min === '' ? -Infinity : Number(node.min), max: node.max === '' ? Infinity : Number(node.max), step: node.step && node.step !== 'any' ? Number(node.step) : 0};
      }); return result;
    }
    function capture() {
      if (!form.checkValidity()) throw Error('Correct the highlighted model inputs before saving or downloading.');
      var nodes = controls(), values = {};
      Object.keys(nodes).forEach(function (name) { values[name] = nodes[name].value; });
      return pack(values, fields(), new Date().toISOString());
    }
    function apply(payload) {
      var values = validate(payload, fields()), nodes = controls(), previous = {};
      Object.keys(values).forEach(function (name) {
        var node = nodes[name];
        previous[name] = {value: node.value, error: node.validity && node.validity.customError ? node.validationMessage : ''};
        node.value = values[name]; node.setCustomValidity('');
      });
      if (!form.checkValidity()) {
        Object.keys(previous).forEach(function (name) { nodes[name].value = previous[name].value; nodes[name].setCustomValidity(previous[name].error); });
        throw Error('This backup is not valid for the current model. Your inputs are unchanged.');
      }
      Object.keys(values).forEach(function (name) { nodes[name].dispatchEvent(new win.Event('input', {bubbles: true})); });
      form.requestSubmit();
    }
    form.addEventListener('input', function () { revision++; });
    panel.querySelector('[data-scenario-save]').addEventListener('click', function () {
      try { var value = capture(); win.localStorage.setItem(KEY, JSON.stringify(value)); message('Scenario saved on this device. Use Reopen saved scenario after returning.'); }
      catch (error) { message(error.message || 'Device storage is unavailable. Download a JSON backup instead.'); }
    });
    panel.querySelector('[data-scenario-reopen]').addEventListener('click', function () {
      try { var text = win.localStorage.getItem(KEY); if (!text) throw Error('No scenario is saved on this device yet.'); apply(JSON.parse(text)); message('Saved scenario reopened and recalculated.'); }
      catch (error) { message('Could not reopen: ' + error.message); }
    });
    panel.querySelector('[data-scenario-download]').addEventListener('click', function () {
      try {
        var payload = capture(), blob = new win.Blob([JSON.stringify(payload, null, 2) + '\n'], {type: 'application/json'});
        var url = win.URL.createObjectURL(blob), link = doc.createElement('a');
        link.href = url; link.download = 'afcon-scenario-' + payload.inputs.mode + '-' + payload.inputs.favorite.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
        doc.body.appendChild(link); link.click(); link.remove(); win.setTimeout(function () { win.URL.revokeObjectURL(url); }, 1000);
        message('Scenario JSON download requested. Keep this file to reopen your input assumptions later.');
      } catch (error) { message(error.message); }
    });
    panel.querySelector('[data-scenario-remove]').addEventListener('click', function () {
      try { win.localStorage.removeItem(KEY); message('Saved scenario removed from this device. Current inputs are unchanged.'); }
      catch (_) { message('Device storage is unavailable. Current inputs are unchanged.'); }
    });
    input.addEventListener('change', function () {
      var file = input.files && input.files[0], started = revision;
      if (!file) return;
      if (file.size > 16384) { message('Choose a scenario JSON file smaller than 16 KB. Your current inputs are unchanged.'); input.value = ''; return; }
      file.text().then(function (text) {
        if (started !== revision) throw Error('Inputs changed while opening the file. Choose the backup again if you want to replace them.');
        apply(JSON.parse(text)); message('JSON scenario opened and recalculated. It has not replaced your device save.');
      }).catch(function (error) { message('Could not open backup: ' + error.message); }).finally(function () { input.value = ''; });
    });
  }
  return {validate: validate, pack: pack, mount: mount, storageKey: KEY};
});
