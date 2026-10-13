(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.localizedCountdown = api; }
})(typeof window === 'undefined' ? null : window, function (root) {
  'use strict';
  function createClock(options) {
    options = options || {};
    var engine = options.engine || (root && root.BusinessRoiEngine);
    var validate = options.validate || (root && root.AfroTools && root.AfroTools.countdownStorage && root.AfroTools.countdownStorage.validate);
    if (!engine || typeof engine.countdown !== 'function' || typeof validate !== 'function') throw new Error('Countdown dependencies unavailable');
    var now = options.now || Date.now, repeat = options.setInterval || setInterval, stop = options.clearInterval || clearInterval;
    var onChange = options.onChange || function () {}, onComplete = options.onComplete || function () {};
    var event = null, target = null, interval = null, generation = 0, completionEligible = false;
    function snapshot() {
      if (!event) return null;
      var generatedAt = new Date(now()).toISOString();
      var value = engine.countdown({ from: generatedAt, to: target });
      return { event: { name: event.name, date: event.date, time: event.time }, targetIso: target,
        generatedAt: generatedAt, remaining: value, running: interval !== null };
    }
    function stopInterval() {
      generation += 1;
      if (interval !== null) stop(interval);
      interval = null;
    }
    function refresh() {
      var value = snapshot(); if (!value) return null;
      var announce = value.remaining.complete && completionEligible;
      if (value.remaining.complete) { completionEligible = false; stopInterval(); value.running = false; }
      onChange(value);
      if (announce) onComplete(value);
      return value;
    }
    function resume() {
      stopInterval();
      var value = refresh();
      if (value && !value.remaining.complete) {
        var token = generation;
        interval = repeat(function () { if (token === generation) refresh(); }, 1000);
      }
      return snapshot();
    }
    function configure(input) {
      var next = validate(input), nextTarget = new Date(next.date + 'T' + next.time + ':00');
      if (Number.isNaN(nextTarget.getTime())) throw new Error('Invalid event time');
      stopInterval(); event = next; target = nextTarget.toISOString(); completionEligible = nextTarget.getTime() > now();
      return resume();
    }
    function cancel() { stopInterval(); event = null; target = null; completionEligible = false; onChange(null); }
    return { configure: configure, snapshot: snapshot, refresh: refresh, suspend: stopInterval, resume: resume, cancel: cancel };
  }
  var messages = {
    fr: {
      title: 'Événements et alertes', save: 'Enregistrer cet événement', saved: 'Événements enregistrés', load: 'Ouvrir', remove: 'Supprimer',
      clear: 'Effacer les événements enregistrés', confirm: 'Effacer tous les événements enregistrés dans ce navigateur ? Cette action est irréversible. Le compte à rebours actif continuera.',
      empty: 'Aucun événement enregistré.', unavailable: 'Les événements enregistrés ne sont pas disponibles.',
      loadError: 'Impossible de lire les événements enregistrés. Les données originales sont conservées. Le compte à rebours reste utilisable.',
      saveError: 'Les modifications n’ont pas été enregistrées. Les événements précédents sont conservés.',
      clearError: 'Impossible d’effacer les événements. Les données sont conservées.', cleared: 'Événements effacés. Le compte à rebours actif continue.',
      stored: 'Événements enregistrés sur cet appareil.', invalid: 'Choisissez une date et une heure valides.', changed: 'La liste a changé dans un autre onglet. Sélectionnez de nouveau l’événement.',
      ready: 'Le compte à rebours suit l’horloge de cet appareil.', edited: 'Les détails ont changé. Relancez le compte à rebours.', complete: 'L’échéance est atteinte.',
      sound: 'Émettre un son à l’échéance', enable: 'Activer les notifications', disable: 'Désactiver les notifications',
      notifyOn: 'Notifications activées pour cet onglet.', notifyOff: 'Notifications désactivées.', notifyDenied: 'Les notifications sont bloquées dans les paramètres du navigateur.',
      notifyUnavailable: 'Les notifications sont indisponibles. Le compte à rebours reste utilisable.', notifyNotEnabled: 'Les notifications ne sont pas activées.', notifyFailure: 'La notification n’a pas pu être affichée. L’échéance est atteinte.',
      presets: 'Dates rapides', newYear: 'Nouvel An', christmas: 'Noël', africaDay: 'Journée de l’Afrique', eid: 'Aïd al-Fitr — choisir la date',
      eidGuidance: 'Saisissez la date confirmée par l’autorité compétente de votre pays.', source: 'Exemple de déclaration officielle au Nigeria',
      remaining: 'Temps restant avant l’événement'
    },
    sw: {
      title: 'Matukio na arifa', save: 'Hifadhi tukio hili', saved: 'Matukio yaliyohifadhiwa', load: 'Fungua', remove: 'Futa',
      clear: 'Futa matukio yaliyohifadhiwa', confirm: 'Ufute matukio yote yaliyohifadhiwa kwenye kivinjari hiki? Huwezi kutendua hatua hii. Hesabu ya muda inayoendelea haitaathiriwa.',
      empty: 'Hakuna matukio yaliyohifadhiwa.', unavailable: 'Matukio yaliyohifadhiwa hayapatikani.',
      loadError: 'Matukio yaliyohifadhiwa hayakuweza kusomwa. Data ya awali imehifadhiwa. Bado unaweza kutumia hesabu ya muda.',
      saveError: 'Mabadiliko hayakuhifadhiwa. Matukio ya awali yamebaki.', clearError: 'Matukio hayakuweza kufutwa. Data imebaki.', cleared: 'Matukio yamefutwa. Hesabu ya muda inayoendelea haijaathiriwa.',
      stored: 'Matukio yamehifadhiwa kwenye kifaa hiki.', invalid: 'Chagua tarehe na saa halali.', changed: 'Orodha imebadilika kwenye kichupo kingine. Chagua tukio tena.',
      ready: 'Hesabu ya muda inatumia saa ya kifaa hiki.', edited: 'Maelezo yamebadilika. Anzisha hesabu ya muda tena.', complete: 'Muda wa tukio umefika.',
      sound: 'Cheza sauti muda wa tukio unapofika', enable: 'Washa arifa', disable: 'Zima arifa',
      notifyOn: 'Arifa zimewashwa kwa kichupo hiki.', notifyOff: 'Arifa zimezimwa.', notifyDenied: 'Arifa zimezuiwa kwenye mipangilio ya kivinjari.',
      notifyUnavailable: 'Arifa hazipatikani. Hesabu ya muda bado inafanya kazi.', notifyNotEnabled: 'Arifa hazijawashwa.', notifyFailure: 'Arifa haikuweza kuonyeshwa. Muda wa tukio umefika.',
      presets: 'Tarehe za haraka', newYear: 'Mwaka Mpya', christmas: 'Krismasi', africaDay: 'Siku ya Afrika', eid: 'Eid al-Fitr — chagua tarehe',
      eidGuidance: 'Weka tarehe iliyothibitishwa na mamlaka husika nchini mwako.', source: 'Mfano wa tangazo rasmi nchini Nigeria',
      remaining: 'Muda uliobaki hadi tukio'
    }
  };
  var instances = new WeakMap();
  function mount(app, locale, callbacks) {
    if (instances.has(app)) return instances.get(app);
    callbacks = callbacks || {};
    var doc = app.ownerDocument, win = doc.defaultView, t = messages[locale];
    if (!t) throw new Error('Unsupported countdown locale');
    var form = app.querySelector('[data-business-form]'), clock, ready = false, notificationsEnabled = false;
    function node(tag, text, role) { var el = doc.createElement(tag); if (text) el.textContent = text; if (role) el.setAttribute('data-countdown-role', role); return el; }
    function button(text, role, handler) { var el = node('button', text, role); el.type = 'button'; el.addEventListener('click', handler); return el; }
    function live(role) { var el = node('p', '', role); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); return el; }
    var panel = node('section', '', 'panel'); panel.className = 'panel sw-business-panel'; panel.style.gridColumn = '1 / -1'; panel.setAttribute('aria-label', t.title);
    var status = live('status'), storageStatus = live('storage-status'), notificationStatus = live('notification-status');
    var actions = node('div'); actions.className = 'actions sw-business-actions';
    var save = button(t.save, 'save', function () { var state = clock.snapshot(); if (!ready || !state) return; if (store.add(state.event)) renderSaved(); });
    var clear = button(t.clear, 'clear', function () { if (win.confirm(t.confirm) && store.clear()) renderSaved(); });
    var notifications = button(t.enable, 'notifications', async function () {
      if (notifications.disabled) return;
      if (notificationsEnabled) { notificationsEnabled = false; notifications.textContent = t.enable; notificationStatus.textContent = t.notifyOff; return; }
      if (!win.Notification || typeof win.Notification.requestPermission !== 'function') { notificationStatus.textContent = t.notifyUnavailable; return; }
      notifications.disabled = true;
      try {
        var permission = win.Notification.permission === 'default' ? await win.Notification.requestPermission() : win.Notification.permission;
        notificationsEnabled = permission === 'granted'; notifications.textContent = notificationsEnabled ? t.disable : t.enable;
        notificationStatus.textContent = notificationsEnabled ? t.notifyOn : permission === 'denied' ? t.notifyDenied : t.notifyNotEnabled;
      } catch (error) { notificationStatus.textContent = t.notifyUnavailable; }
      finally { notifications.disabled = false; }
    });
    var soundLabel = node('label', t.sound), sound = node('input', '', 'sound'); sound.type = 'checkbox'; sound.checked = true; soundLabel.prepend(sound);
    var savedList = node('div', '', 'saved-list'); savedList.setAttribute('data-countdown-saved-list', '');
    var presetActions = node('div'); presetActions.className = 'actions sw-business-actions';
    function choosePreset(name, monthDay, nextYear) {
      var now = new Date(), year = now.getFullYear() + (nextYear ? 1 : 0), date = monthDay ? year + '-' + monthDay : '';
      if (date && !nextYear && new Date(date + 'T00:00:00') < now) date = (year + 1) + '-' + monthDay;
      invalidate(); form.elements.eventName.value = name; form.elements.eventDate.value = date; form.elements.eventTime.value = '00:00';
      form.dispatchEvent(new win.Event('input', { bubbles: true }));
      if (date) form.requestSubmit(); else { status.textContent = t.eidGuidance; form.elements.eventDate.focus(); }
    }
    [[t.newYear,'01-01',true],[t.christmas,'12-25',false],[t.africaDay,'05-25',false],[t.eid,'',false]].forEach(function (preset, index) {
      presetActions.append(button(preset[0], 'preset-' + index, function () { choosePreset(index === 3 ? 'Eid al-Fitr' : preset[0], preset[1], preset[2]); }));
    });
    var guidance = node('p', t.eidGuidance + ' '), source = node('a', t.source); source.href = 'https://nscia.com.ng/eid-fitr-2024-no-positive-moonsighting-in-nigeria-nscia/'; source.target = '_blank'; source.rel = 'noopener'; guidance.append(source);
    actions.append(save, notifications, clear); panel.append(node('h2', t.title), actions, soundLabel, status, notificationStatus,
      node('h3', t.presets), presetActions, guidance, node('h3', t.saved), savedList, storageStatus); app.append(panel);
    var store = win.AfroTools.countdownStorage.create({ storage: function () { return win.localStorage; }, onStatus: function (code) { storageStatus.textContent = t[code === 'saved' ? 'stored' : code] || ''; } });
    function renderSaved() {
      var rows = store.read(); savedList.replaceChildren();
      if (!rows || !rows.length) { savedList.append(node('p', rows ? t.empty : t.unavailable)); return; }
      rows.forEach(function (event, index) {
        var row = node('div'); row.className = 'actions sw-business-actions';
        var name = event.name || event.date;
        var load = button(t.load + ' — ' + name, 'load', function () {
          var current = store.read();
          if (!current || !current[index] || JSON.stringify(current[index]) !== JSON.stringify(event)) { renderSaved(); storageStatus.textContent = t.changed; return; }
          invalidate(); form.elements.eventName.value = event.name; form.elements.eventDate.value = event.date; form.elements.eventTime.value = event.time;
          form.dispatchEvent(new win.Event('input', { bubbles: true })); form.requestSubmit();
        });
        var remove = button(t.remove + ' — ' + name, 'delete', function () { store.remove(index, event); renderSaved(); });
        [load,remove].forEach(function (el) { el.style.maxWidth = '100%'; el.style.overflowWrap = 'anywhere'; }); row.append(load, remove); savedList.append(row);
      });
    }
    function announce(state) {
      status.textContent = t.complete;
      if (sound.checked) {
        try { var Audio = win.AudioContext || win.webkitAudioContext, audio = new Audio(), oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.connect(gain); gain.connect(audio.destination); gain.gain.setValueAtTime(0.15,audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime + 0.25); oscillator.onended = function () { audio.close().catch(function () {}); }; oscillator.start(); oscillator.stop(audio.currentTime + 0.3); } catch (error) { /* Sound is optional. */ }
      }
      if (notificationsEnabled) {
        try { if (!win.Notification || win.Notification.permission !== 'granted') throw Error('Unavailable'); new win.Notification(t.complete, { body: state.event.name, icon: '/assets/img/logo-mark.svg' }); }
        catch (error) { notificationsEnabled = false; notifications.textContent = t.enable; notificationStatus.textContent = t.notifyFailure; }
      }
    }
    clock = createClock({ onChange: function (state) { if (callbacks.onSnapshot) callbacks.onSnapshot(state); }, onComplete: announce });
    var configuredInputs = null;
    function inputSignature() { return JSON.stringify(['eventName', 'eventDate', 'eventTime'].map(function (name) { return form.elements.namedItem(name).value; })); }
    function invalidate(event) {
      if (event && (event.type === "input" || event.type === "change") && ready && inputSignature() === configuredInputs) return;
      configuredInputs = null; ready = false; clock.cancel(); save.disabled = true; status.textContent = t.edited;
    }
    ['input','change','invalid','reset'].forEach(function (event) { form.addEventListener(event,invalidate,event === 'invalid'); });
    win.addEventListener('focus', function () { if (ready) clock.refresh(); });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden && ready) clock.refresh(); });
    win.addEventListener('pagehide', clock.suspend);
    win.addEventListener('pageshow', function (event) { if (event.persisted && ready) clock.resume(); });
    win.addEventListener('storage', function (event) { if (event.key === 'afro_countdowns' || event.key === null) renderSaved(); });
    var api = { configure: function (event) {
      var state;
      configuredInputs = inputSignature();
      try { state = clock.configure(event); }
      catch (error) { invalidate(); status.textContent = t.invalid; throw new Error(t.invalid); }
      ready = true; save.disabled = false; status.textContent = state.remaining.complete ? t.complete : t.ready; return state;
    }, snapshot: clock.snapshot, refresh: clock.refresh, cancel: invalidate };
    var metrics = app.querySelector('[data-result-metrics]'); if (metrics) { metrics.setAttribute('role','timer'); metrics.setAttribute('aria-live','off'); metrics.setAttribute('aria-label',t.remaining); }
    save.disabled = true; renderSaved(); instances.set(app,api); return api;
  }
  return { createClock: createClock, mount: mount };
});
