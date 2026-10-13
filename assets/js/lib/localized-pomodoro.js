(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.localizedPomodoro = api; }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  function createClock(options) {
    options = options || {};
    var now = options.now || Date.now;
    var repeat = options.setInterval || setInterval, stopRepeat = options.clearInterval || clearInterval;
    var later = options.setTimeout || setTimeout, stopLater = options.clearTimeout || clearTimeout;
    var onChange = options.onChange || function () {}, onComplete = options.onComplete || function () {};
    var plan = { work: 1500, short: 300, long: 900, sessions: 4 };
    var mode = 'work', remaining = plan.work * 1000, deadline = null, running = false;
    var completed = 0, automatic = false, interval = null, pending = null, generation = 0;

    function snapshot() {
      return { mode: mode, remainingMilliseconds: remaining, remainingSeconds: Math.ceil(remaining / 1000),
        running: running, completed: completed, automatic: automatic,
        plan: { work: plan.work, short: plan.short, long: plan.long, sessions: plan.sessions } };
    }
    function emit() { onChange(snapshot()); }
    function cancelPending() {
      generation += 1;
      if (pending !== null) stopLater(pending);
      pending = null;
    }
    function stopInterval() {
      if (interval !== null) stopRepeat(interval);
      interval = null;
    }
    function cancel() {
      cancelPending(); stopInterval(); running = false; deadline = null; emit();
    }
    function select(next) {
      if (['work', 'short', 'long'].indexOf(next) < 0) throw new Error('Invalid timer mode');
      cancelPending(); stopInterval(); running = false; deadline = null;
      mode = next; remaining = plan[mode] * 1000; emit();
    }
    function configure(value) {
      if (!value || ['focusSeconds', 'shortBreakSeconds', 'longBreakSeconds'].some(function (key) {
        return !Number.isSafeInteger(value[key]) || value[key] < 60 || value[key] > 86400;
      }) || !Number.isSafeInteger(value.sessions) || value.sessions < 1 || value.sessions > 12) {
        throw new Error('Invalid timer plan');
      }
      plan = { work: value.focusSeconds, short: value.shortBreakSeconds, long: value.longBreakSeconds, sessions: value.sessions };
      completed = 0; select('work');
    }
    function complete() {
      if (!running) return;
      stopInterval(); running = false; deadline = null; remaining = 0;
      var finished = mode, seconds = plan[finished];
      if (finished === 'work') completed += 1;
      emit(); onComplete({ mode: finished, seconds: seconds, completed: completed });
      if (automatic) {
        select(finished === 'work' ? (completed % plan.sessions === 0 ? 'long' : 'short') : 'work');
        var token = generation;
        pending = later(function () {
          pending = null;
          if (token !== generation || running || !automatic) return;
          start();
        }, 1000);
      }
    }
    function tick() {
      if (!running || deadline === null) return;
      remaining = Math.max(0, deadline - now());
      if (!remaining) complete(); else emit();
    }
    function start() {
      cancelPending();
      if (running) return;
      if (!remaining) remaining = plan[mode] * 1000;
      running = true; deadline = now() + remaining;
      interval = repeat(tick, 250); emit();
    }
    function pause() {
      cancelPending();
      if (!running) return;
      tick(); cancelPending();
      stopInterval(); running = false; deadline = null; emit();
    }
    function reset() { select(mode); }
    function toggle() { if (running) pause(); else start(); }
    function setAutomatic(value) { automatic = value === true; if (!automatic) cancelPending(); emit(); }
    return { configure: configure, snapshot: snapshot, tick: tick, start: start, pause: pause, toggle: toggle,
      reset: reset, select: select, cancel: cancel, setAutomatic: setAutomatic };
  }

  function normalizeStats(value, today) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid statistics');
    function count(number) { if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid count'); return number; }
    function minutes(number) { if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) throw new Error('Invalid minutes'); return number; }
    function date(value) {
      if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime()) || new Date(value).toDateString() !== value) throw new Error('Invalid date');
      return value;
    }
    function record(item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid day');
      return { count: count(item.count), minutes: minutes(item.minutes) };
    }
    var current = value.today === undefined ? { count: 0, minutes: 0, date: date(today) }
      : Object.assign(record(value.today), { date: date(value.today.date) });
    var week = Object.create(null);
    if (value.week !== undefined) {
      if (!value.week || typeof value.week !== 'object' || Array.isArray(value.week)) throw new Error('Invalid history');
      Object.keys(value.week).forEach(function (key) { week[date(key)] = record(value.week[key]); });
    }
    return { today: current, week: week, allTime: minutes(value.allTime === undefined ? 0 : value.allTime),
      bestDay: count(value.bestDay === undefined ? 0 : value.bestDay), streak: count(value.streak === undefined ? 0 : value.streak) };
  }

  function createStatistics(options) {
    options = options || {};
    var getStorage = options.storage, now = options.now || function () { return new Date(); };
    var onStatus = options.onStatus || function () {}, blocked = false;
    function today() { return now().toDateString(); }
    function empty() { return { today: { count: 0, minutes: 0, date: today() }, week: {}, allTime: 0, bestDay: 0, streak: 0 }; }
    var state = empty();
    function storage() { return typeof getStorage === 'function' ? getStorage() : getStorage; }
    function rollover() {
      if (state.today.date !== today()) {
        state.week[state.today.date] = { count: state.today.count, minutes: state.today.minutes };
        state.today = { count: 0, minutes: 0, date: today() };
      }
      var date = now(), streak = 0;
      for (var i = 0; i < 365; i += 1) {
        var row = i === 0 ? state.today : state.week[date.toDateString()];
        if (row && row.count > 0) streak += 1;
        else if (i !== 0) break;
        date.setDate(date.getDate() - 1);
      }
      state.streak = streak;
    }
    function refresh() {
      if (blocked) return false;
      try {
        var raw = storage().getItem('pomodoroStats');
        state = raw === null ? empty() : normalizeStats(JSON.parse(raw), today());
        rollover(); return true;
      } catch (error) { blocked = true; onStatus('loadError'); return false; }
    }
    function view() {
      rollover();
      var count = state.today.count, minutes = state.today.minutes, date = now();
      for (var i = 1; i < 7; i += 1) {
        date.setDate(date.getDate() - 1);
        var previous = state.week[date.toDateString()];
        if (previous) { count += previous.count; minutes += previous.minutes; }
      }
      return { todayCount: state.today.count, todayMinutes: state.today.minutes, weekCount: count,
        weekMinutes: minutes, allTimeMinutes: state.allTime, bestDay: state.bestDay, streak: state.streak, blocked: blocked };
    }
    function record(seconds) {
      if (!Number.isSafeInteger(seconds) || seconds < 1) throw new Error('Invalid completed duration');
      if (!blocked) refresh();
      rollover();
      var next = normalizeStats(state, today());
      next.today.count += 1; next.today.minutes += seconds / 60; next.allTime += seconds / 60;
      next.bestDay = Math.max(next.bestDay, next.today.count);
      try { state = normalizeStats(next, today()); }
      catch (error) { blocked = true; onStatus('saveError'); return false; }
      state.week[state.today.date] = { count: state.today.count, minutes: state.today.minutes };
      rollover();
      if (blocked) return false;
      try { storage().setItem('pomodoroStats', JSON.stringify(state)); onStatus(''); return true; }
      catch (error) { blocked = true; onStatus('saveError'); return false; }
    }
    function reset() {
      try { storage().removeItem('pomodoroStats'); }
      catch (error) { onStatus('resetError'); return false; }
      state = empty(); blocked = false; onStatus('resetDone'); return true;
    }
    refresh();
    return { view: view, record: record, refresh: refresh, reset: reset };
  }

  var messages = {
    fr: {
      title: 'Minuteur de concentration', work: 'Concentration', short: 'Pause courte', long: 'Pause longue',
      start: 'Démarrer', pause: 'Mettre en pause', resume: 'Reprendre', reset: 'Réinitialiser le minuteur',
      automatic: 'Enchaîner automatiquement les sessions et les pauses', sound: 'Signal sonore',
      ready: 'Cycle prêt. Démarrez le minuteur quand vous êtes prêt.', changed: 'Les paramètres ont changé. Recalculez le cycle avant de démarrer.',
      invalid: 'Utilisez des durées entières de 1 à 1 440 minutes et de 1 à 12 sessions.',
      finished: 'Session terminée.', breakFinished: 'Pause terminée.', remaining: 'Temps restant',
      today: 'Sessions aujourd’hui', focus: 'Concentration aujourd’hui', week: 'Sessions sur sept jours',
      allTime: 'Concentration cumulée', streak: 'Jours consécutifs', best: 'Meilleure journée', minute: 'min',
      goal: 'Objectif quotidien (sessions)', goalInvalid: 'Choisissez un objectif entier de 1 à 20 sessions.',
      resetStats: 'Réinitialiser les statistiques', confirmReset: 'Réinitialiser toutes les statistiques enregistrées dans ce navigateur ? Cette action est irréversible. Le minuteur ne sera pas arrêté.',
      loadError: 'Les statistiques enregistrées n’ont pas pu être chargées. Leur copie reste inchangée. Le minuteur fonctionne ; les nouvelles statistiques restent dans cet onglet jusqu’à leur réinitialisation.',
      saveError: 'Les dernières statistiques n’ont pas pu être enregistrées. Le minuteur continue ; votre progression reste dans cet onglet.',
      resetError: 'Les statistiques n’ont pas été effacées. Vérifiez l’accès au stockage du navigateur.',
      resetDone: 'Statistiques réinitialisées. Le minuteur est inchangé.',
      enable: 'Activer les notifications', disable: 'Désactiver les notifications',
      notifyEnabled: 'Notifications activées pour cet onglet.', notifyOff: 'Notifications désactivées pour cet onglet.',
      notifyDenied: 'Les notifications sont bloquées dans les paramètres du navigateur. Le minuteur reste disponible.',
      notifyUnavailable: 'Les notifications ne sont pas disponibles. Le minuteur reste disponible.',
      notifyFailure: 'La notification n’a pas pu être affichée. Le minuteur continue.',
      notifyNotEnabled: 'Les notifications n’ont pas été activées.',
      keyboard: 'Dans ce panneau : Espace pour démarrer ou mettre en pause, R pour réinitialiser. Le minuteur est réinitialisé si vous rechargez la page.'
    },
    sw: {
      title: 'Kipima muda cha kuzingatia', work: 'Kuzingatia', short: 'Mapumziko mafupi', long: 'Mapumziko marefu',
      start: 'Anza', pause: 'Sitisha kwa muda', resume: 'Endelea', reset: 'Anzisha muda upya',
      automatic: 'Endelea moja kwa moja na vipindi na mapumziko', sound: 'Sauti ya taarifa',
      ready: 'Mzunguko uko tayari. Anza kipima muda ukiwa tayari.', changed: 'Vigezo vimebadilika. Kokotoa mzunguko tena kabla ya kuanza.',
      invalid: 'Tumia dakika kamili kutoka 1 hadi 1,440 na vipindi kutoka 1 hadi 12.',
      finished: 'Kipindi kimekamilika.', breakFinished: 'Mapumziko yamekamilika.', remaining: 'Muda uliobaki',
      today: 'Vipindi vya leo', focus: 'Muda wa kuzingatia leo', week: 'Vipindi vya siku saba',
      allTime: 'Jumla ya muda wa kuzingatia', streak: 'Siku mfululizo', best: 'Siku yenye vipindi vingi zaidi', minute: 'dakika',
      goal: 'Lengo la kila siku (vipindi)', goalInvalid: 'Chagua lengo la vipindi kamili kutoka 1 hadi 20.',
      resetStats: 'Futa takwimu', confirmReset: 'Ufute takwimu zote zilizohifadhiwa kwenye kivinjari hiki? Huwezi kutendua hatua hii. Kipima muda hakitasimamishwa.',
      loadError: 'Takwimu zilizohifadhiwa hazikuweza kupakiwa. Nakala yake haijabadilishwa. Kipima muda kinafanya kazi; takwimu mpya zinabaki kwenye kichupo hiki hadi ufute takwimu.',
      saveError: 'Takwimu za karibuni hazikuweza kuhifadhiwa. Kipima muda kinaendelea; maendeleo yako yanabaki kwenye kichupo hiki.',
      resetError: 'Takwimu hazikufutwa. Kagua ruhusa za hifadhi ya kivinjari.',
      resetDone: 'Takwimu zimefutwa. Kipima muda hakijabadilishwa.',
      enable: 'Washa arifa', disable: 'Zima arifa',
      notifyEnabled: 'Arifa zimewashwa kwa kichupo hiki.', notifyOff: 'Arifa zimezimwa kwa kichupo hiki.',
      notifyDenied: 'Arifa zimezuiwa kwenye mipangilio ya kivinjari. Kipima muda bado kinapatikana.',
      notifyUnavailable: 'Arifa hazipatikani. Kipima muda bado kinapatikana.',
      notifyFailure: 'Arifa haikuweza kuonyeshwa. Kipima muda kinaendelea.',
      notifyNotEnabled: 'Arifa hazikuwashwa.',
      keyboard: 'Ndani ya paneli hii: Space kuanza au kusitisha kwa muda, R kuanzisha upya. Kipima muda huanza upya ukipakia ukurasa tena.'
    }
  };
  var instances = new WeakMap();
  function mount(root, locale) {
    if (instances.has(root)) return instances.get(root);
    var t = messages[locale]; if (!t) throw new Error('Unsupported Pomodoro locale');
    var doc = root.ownerDocument, win = doc.defaultView, ready = false, clock, statistics;
    var number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    function node(tag, text, name) {
      var element = doc.createElement(tag);
      if (text) element.textContent = text;
      if (name) element.dataset.pomodoroRole = name;
      return element;
    }
    function live(name) { var element = node('p', '', name); element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); return element; }
    var panel = node('section', '', 'panel'); panel.className = 'panel sw-business-panel afro-pomodoro'; panel.style.gridColumn = '1 / -1'; panel.tabIndex = 0; panel.setAttribute('aria-label', t.title);
    var heading = node('h2', t.title), modeLabel = node('h3', t.work), display = node('p', '--:--', 'clock');
    display.setAttribute('role', 'timer'); display.setAttribute('aria-live', 'off'); display.setAttribute('aria-label', t.remaining); display.style.fontSize = '3rem'; display.style.fontVariantNumeric = 'tabular-nums';
    var status = live('status'), storageStatus = live('storage-status'), notificationState = live('notification-status');
    var modes = node('div'), controls = node('div'); modes.className = controls.className = 'actions sw-business-actions';
    var modeButtons = {}, controlled = [];
    function button(text, handler, name) { var item = node('button', text, name); item.type = 'button'; item.addEventListener('click', handler); return item; }
    ['work', 'short', 'long'].forEach(function (mode) {
      var item = button(t[mode], function () { if (ready) { clock.select(mode); status.textContent = t.ready; } }, mode);
      modeButtons[mode] = item; controlled.push(item); modes.append(item);
    });
    var start = button(t.start, function () { if (ready) clock.toggle(); }, 'start');
    var reset = button(t.reset, function () { if (ready) { clock.reset(); status.textContent = t.ready; } }, 'reset');
    controlled.push(start, reset); controls.append(start, reset);
    function checkbox(text, name) { var label = node('label', text), input = node('input', '', name); input.type = 'checkbox'; label.prepend(input); return { label: label, input: input }; }
    var automatic = checkbox(t.automatic, 'automatic'), sound = checkbox(t.sound, 'sound'); sound.input.checked = true;
    var goalLabel = node('label', t.goal), goal = node('input', '', 'goal'); goal.type = 'number'; goal.min = '1'; goal.max = '20'; goal.step = '1'; goal.value = '8'; goalLabel.append(goal);
    var goalStatus = live('goal-status'), statsGrid = node('div'); statsGrid.className = 'metrics sw-business-metrics';
    var statNodes = {};
    [['todayCount','today'],['todayMinutes','focus'],['weekCount','week'],['allTimeMinutes','allTime'],['streak','streak'],['bestDay','best']].forEach(function (entry) {
      var card = node('div'), value = node('strong', '0', entry[0]); card.className = 'metric sw-business-metric'; card.append(node('span', t[entry[1]]), value); statsGrid.append(card); statNodes[entry[0]] = value;
    });
    var notificationsEnabled = false, notificationButton = button(t.enable, async function () {
      if (notificationButton.disabled) return;
      if (notificationsEnabled) { notificationsEnabled = false; notificationButton.textContent = t.enable; notificationState.textContent = t.notifyOff; return; }
      if (!win.Notification || typeof win.Notification.requestPermission !== 'function') { notificationState.textContent = t.notifyUnavailable; return; }
      notificationButton.disabled = true;
      try {
        var permission = win.Notification.permission === 'default' ? await win.Notification.requestPermission() : win.Notification.permission;
        notificationsEnabled = permission === 'granted'; notificationButton.textContent = notificationsEnabled ? t.disable : t.enable;
        notificationState.textContent = notificationsEnabled ? t.notifyEnabled : permission === 'denied' ? t.notifyDenied : t.notifyNotEnabled;
      } catch (error) { notificationState.textContent = t.notifyUnavailable; }
      finally { notificationButton.disabled = false; }
    }, 'notifications');
    function notify(message) {
      if (!notificationsEnabled) return;
      try { if (!win.Notification || win.Notification.permission !== 'granted') throw new Error('Unavailable'); new win.Notification(t.title, { body: message, icon: '/assets/img/logo-mark.svg' }); }
      catch (error) { notificationsEnabled = false; notificationButton.textContent = t.enable; notificationState.textContent = t.notifyFailure; }
    }
    function playSound() {
      if (!sound.input.checked) return;
      try {
        var Audio = win.AudioContext || win.webkitAudioContext; if (!Audio) return;
        var audio = new Audio(), oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = 659;
        gain.gain.setValueAtTime(0.15, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
        oscillator.onended = function () { audio.close().catch(function () {}); }; oscillator.start(); oscillator.stop(audio.currentTime + 0.3);
      } catch (error) { /* Optional sound never interrupts the timer. */ }
    }
    function renderStats() {
      var value = statistics.view();
      Object.keys(statNodes).forEach(function (key) { statNodes[key].textContent = number.format(value[key]) + (/Minutes$/.test(key) ? ' ' + t.minute : ''); });
      var target = Number(goal.value);
      if (!goal.value.trim() || !Number.isInteger(target) || target < 1 || target > 20) { goal.setAttribute('aria-invalid', 'true'); goalStatus.textContent = t.goalInvalid; }
      else { goal.removeAttribute('aria-invalid'); goalStatus.textContent = number.format(value.todayCount) + ' / ' + number.format(target); }
    }
    var clear = button(t.resetStats, function () { if (win.confirm(t.confirmReset)) { statistics.reset(); renderStats(); } }, 'reset-statistics');
    controls.append(notificationButton, clear);
    panel.append(heading, modeLabel, display, modes, controls, automatic.label, sound.label, status, notificationState,
      node('p', t.keyboard), goalLabel, goalStatus, statsGrid, storageStatus); root.append(panel);
    statistics = createStatistics({ storage: function () { return win.localStorage; }, onStatus: function (code) { storageStatus.textContent = code ? t[code] : ''; } });
    function render(value) {
      var seconds = value.remainingSeconds;
      display.textContent = ready ? Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') : '--:--';
      modeLabel.textContent = t[value.mode];
      start.textContent = value.running ? t.pause : value.remainingMilliseconds > 0 && value.remainingMilliseconds < value.plan[value.mode] * 1000 ? t.resume : t.start;
      controlled.forEach(function (item) { item.disabled = !ready; });
      Object.keys(modeButtons).forEach(function (mode) {
        modeButtons[mode].textContent = t[mode] + ' (' + number.format(value.plan[mode] / 60) + ' ' + t.minute + ')';
        modeButtons[mode].setAttribute('aria-pressed', mode === value.mode ? 'true' : 'false');
      });
    }
    clock = createClock({ onChange: render, onComplete: function (completed) {
      if (completed.mode === 'work') statistics.record(completed.seconds);
      renderStats(); status.textContent = completed.mode === 'work' ? t.finished : t.breakFinished;
      playSound(); notify(status.textContent);
    } });
    automatic.input.addEventListener('change', function () { clock.setAutomatic(automatic.input.checked); });
    goal.addEventListener('input', renderStats);
    var form = root.querySelector('[data-business-form]');
    var configuredInputs = null;
    function inputSignature() { return JSON.stringify(['focusMinutes', 'shortBreakMinutes', 'longBreakMinutes', 'sessions'].map(function (name) { return form.elements.namedItem(name).value; })); }
    function invalidate(event) {
      if (event && (event.type === "input" || event.type === "change") && ready && inputSignature() === configuredInputs) return;
      configuredInputs = null; ready = false; clock.cancel(); status.textContent = t.changed;
    }
    ['input','change','invalid','reset'].forEach(function (event) { form.addEventListener(event, invalidate, event === 'invalid'); });
    panel.addEventListener('keydown', function (event) {
      if (!ready || event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      var target = event.target;
      if (target.isContentEditable || target.closest('input,textarea,select,button,a,[role="button"],[role="textbox"]')) return;
      if (event.code === 'Space') { event.preventDefault(); clock.toggle(); }
      if (event.code === 'KeyR') { event.preventDefault(); clock.reset(); }
    });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) clock.tick(); });
    win.addEventListener('focus', clock.tick);
    win.addEventListener('pagehide', clock.cancel);
    win.addEventListener('storage', function (event) { if (event.key === 'pomodoroStats' || event.key === null) { statistics.refresh(); renderStats(); } });
    var api = { configure: function (plan) {
      var names = ['focusMinutes','shortBreakMinutes','longBreakMinutes','sessions'];
      var valid = names.map(function (name) {
        var input = form.elements.namedItem(name), value = input ? Number(input.value) : NaN;
        var good = Boolean(input && input.value.trim()) && Number.isInteger(value) && value >= 1 && value <= (name === 'sessions' ? 12 : 1440);
        if (input) { if (good) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true'); }
        return good;
      }).every(Boolean);
      if (!valid) { invalidate(); throw new Error(t.invalid); }
      configuredInputs = inputSignature();
      ready = true;
      try { clock.configure(plan); }
      catch (error) { invalidate(); throw new Error(t.invalid); }
      status.textContent = t.ready;
    }, cancel: invalidate, snapshot: clock.snapshot };
    instances.set(root, api); render(clock.snapshot()); renderStats(); status.textContent = t.ready;
    return api;
  }

  return { createClock: createClock, normalizeStats: normalizeStats, createStatistics: createStatistics, mount: mount };
});
