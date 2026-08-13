(function () {
  'use strict';
  var session = null;
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.hausaUssdSimulator;
  if (!engine) return;

  function byId(id) { return document.getElementById(id); }
  function setStatus(message, error) {
    var node = byId('ussd-status');
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(error));
  }
  function line(role, text) { return role + ': ' + String(text || '').replace(/\s*\n\s*/g, ' | '); }
  function download(payload, filename) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob); var anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function safeCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea'); area.value = text; area.readOnly = true; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); return Promise.resolve();
  }
  function draw(text) {
    byId('ussd-screen').textContent = text;
    var stats = byId('ussd-stats');
    if (!session) { stats.replaceChildren(); byId('ussd-log').textContent = 'Ba a fara zaman gwaji ba.'; return; }
    var current = session.flow[session.state];
    var values = [
      ['Tsari', session.meta.name], ['Lamba', session.meta.code], ['Jiha', session.state],
      ['Haruffa', String(text.length)], ['Bayanan kama', Object.keys(session.variables).join(', ') || 'Babu'],
      ['Yanayi', 'Kwaikwayo kawai']
    ];
    stats.replaceChildren.apply(stats, values.map(function (entry) {
      var item = document.createElement('div'); var strong = document.createElement('strong'); strong.textContent = entry[0]; item.append(strong, document.createTextNode(entry[1])); return item;
    }));
    byId('ussd-log').textContent = session.log.map(function (row) { return line(row.role, row.text); }).join('\n');
    byId('ussd-input').disabled = session.ended;
    byId('ussd-send').disabled = session.ended;
    byId('ussd-cancel').disabled = session.ended;
    byId('ussd-export').disabled = false;
    byId('ussd-copy').disabled = false;
    if (!session.ended && current) byId('ussd-input').focus();
  }
  function start(flow, meta) {
    try {
      session = engine.createSession(flow, meta);
      var initial = engine.screen(session); session.log.push({ role: 'SYSTEM', text: initial.text });
      byId('ussd-input').disabled = false; byId('ussd-send').disabled = false; byId('ussd-cancel').disabled = false;
      draw(initial.text); setStatus('An fara zaman kwaikwayo a wannan naʻarar.');
    } catch (error) { session = null; draw('Ba a iya fara zaman ba.'); setStatus(error.message, true); }
  }
  function selectPreset(key) {
    var preset = engine.presets[key]; if (!preset) return;
    document.querySelectorAll('[data-preset]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.preset === key)); });
    byId('ussd-code').value = preset.code; byId('ussd-flow').value = JSON.stringify(preset.flow, null, 2);
    start(preset.flow, { name: preset.name, code: preset.code });
  }
  document.querySelectorAll('[data-preset]').forEach(function (button) { button.addEventListener('click', function () { selectPreset(button.dataset.preset); }); });
  byId('ussd-load').addEventListener('click', function () {
    try {
      var flow = JSON.parse(byId('ussd-flow').value); var validation = engine.validateFlow(flow);
      start(flow, { name: 'Tsarin musamman', code: byId('ussd-code').value.trim() || 'Lambar musamman' });
      setStatus('An karanta tsarin: jihohi ' + validation.states + ', ƙarshen hanya ' + validation.terminals + '.');
    } catch (error) { setStatus('JSON bai inganta ba: ' + error.message, true); byId('ussd-flow').focus(); }
  });
  function respond() {
    try {
      var result = engine.respond(session, byId('ussd-input').value); byId('ussd-input').value = ''; draw(result.text);
      setStatus(result.ok ? (result.ended ? 'Zaman gwaji ya ƙare.' : 'An matsa zuwa mataki na gaba.') : 'Zaɓi bai dace ba.', !result.ok);
    } catch (error) { setStatus(error.message, true); byId('ussd-input').focus(); }
  }
  byId('ussd-send').addEventListener('click', respond);
  byId('ussd-input').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); respond(); } });
  byId('ussd-cancel').addEventListener('click', function () { try { draw(engine.cancel(session)); setStatus('An soke zaman; babu lambar da aka kira.'); } catch (error) { setStatus(error.message, true); } });
  byId('ussd-copy').addEventListener('click', function () { try { safeCopy(engine.qaBrief(session)).then(function () { setStatus('An kwafi takaitaccen QA.'); }).catch(function () { setStatus('Ba a iya kwafi a wannan burauzar ba.', true); }); } catch (error) { setStatus(error.message, true); } });
  byId('ussd-export').addEventListener('click', function () { try { var payload = engine.exportData(session); payload.generatedAt = new Date().toISOString(); download(payload, 'gwajin-ussd-hausa.json'); setStatus('An sauke JSON na zaman gwaji.'); } catch (error) { setStatus(error.message, true); } });
  byId('ussd-reset').addEventListener('click', function () { selectPreset('mpesa'); byId('ussd-code').focus(); setStatus('An mayar da samfurin farko.'); });
  byId('ussd-theme').addEventListener('click', function () { var dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; byId('ussd-theme').setAttribute('aria-pressed', String(dark)); byId('ussd-theme').textContent = dark ? 'Yanayin haske' : 'Yanayin duhu'; });
  selectPreset('mpesa');
})();
