(function () {
  'use strict';
  var mount = document.querySelector('[data-frhr-app="leave"] .frhr-grid');
  if (!mount) return;
  var section = document.createElement('article');
  section.className = 'frhr-card';
  section.innerHTML = '<h2>Planifier les dates du congé</h2><p>Indiquez une durée confirmée avec votre employeur. Ce planning ne détermine pas vos droits légaux. Les jours ouvrables correspondent ici au lundi–vendredi, sans déduction automatique des jours fériés.</p>' +
    '<form class="frhr-form"><div class="frhr-field wide"><label for="leave-plan-type">Type de congé</label><select id="leave-plan-type"><option>Congé annuel</option><option>Congé maternité</option><option>Congé paternité</option></select></div>' +
    '<div class="frhr-field"><label for="leave-plan-start">Premier jour du congé</label><input id="leave-plan-start" type="date" required></div>' +
    '<div class="frhr-field"><label for="leave-plan-days">Durée confirmée (jours)</label><input id="leave-plan-days" type="number" min="1" max="3660" step="1" required></div>' +
    '<div class="frhr-field wide"><label for="leave-plan-unit">Jours à compter</label><select id="leave-plan-unit"><option value="calendar">Tous les jours du calendrier</option><option value="working">Du lundi au vendredi</option></select></div>' +
    '<div class="frhr-actions"><button class="frhr-button primary" type="submit">Calculer les dates</button><button class="frhr-button" type="button" data-calendar disabled>Télécharger le calendrier ICS</button></div></form>' +
    '<dl data-plan-result hidden></dl><p role="status" data-plan-status></p>';
  mount.appendChild(section);
  var form = section.querySelector('form'), result = section.querySelector('[data-plan-result]'), status = section.querySelector('[data-plan-status]');
  var button = section.querySelector('[data-calendar]'), current = null;
  button.dataset.noPdfGate = 'true';
  function value(id) { return section.querySelector('#leave-plan-' + id).value; }
  function invalidate() { current = null; result.hidden = true; button.disabled = true; status.textContent = 'Calculez les dates avant de télécharger le calendrier.'; }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  var ready = new Promise(function (resolve, reject) {
    if (window.AfroTools.leaveCalendar) return resolve(window.AfroTools.leaveCalendar);
    var script = document.createElement('script'); script.src = '/assets/js/lib/leave-calendar.js';
    script.onload = function () { resolve(window.AfroTools.leaveCalendar); }; script.onerror = reject; document.head.appendChild(script);
  });
  ready.catch(function () { status.textContent = 'Le planificateur est indisponible. Rechargez la page.'; });
  form.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    var input = {start:value('start'), days:value('days'), unit:value('unit')};
    try {
      var helper = await ready;
      if (input.start !== value('start') || input.days !== value('days') || input.unit !== value('unit')) return invalidate();
      current = helper.plan(input);
      result.replaceChildren();
      [['Premier jour',current.start],['Dernier jour de congé inclus',current.lastLeaveDate],['Reprise prévue',current.returnDate]].forEach(function (row) {
        var term = document.createElement('dt'), definition = document.createElement('dd'); term.textContent = row[0]; definition.textContent = row[1]; result.append(term, definition);
      });
      result.hidden = false; button.disabled = false; status.textContent = 'Dates calculées. Confirmez le jour de reprise et les jours fériés avec votre employeur.';
    } catch (_) { invalidate(); status.textContent = 'Vérifiez la date et la durée saisies.'; }
  });
  button.addEventListener('click', async function () {
    if (!current) return;
    var schedule = current, title = value('type'), helper = await ready;
    if (schedule !== current) return;
    var ics = helper.calendar(schedule, {uid:crypto.randomUUID(), title:title, returnTitle:'Reprise du travail', description:'Planning indicatif. Durée confirmée : '+schedule.days+' jours. '+(schedule.unit === 'working' ? 'Lundi–vendredi, jours fériés non déduits.' : 'Jours calendaires.' )});
    var url = URL.createObjectURL(new Blob([ics], {type:'text/calendar;charset=utf-8'}));
    var link = document.createElement('a'); link.href = url; link.download = 'planning-conge.ics'; link.dataset.noPdfGate = 'true'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Calendrier téléchargé localement.';
  });
})();
