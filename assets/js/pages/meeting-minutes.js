(function () {
  'use strict';

  var STORAGE_KEY = 'afrotools-meeting-minutes-current-v2';
  var SHARE_PARAM = 'minutes';
  var selectedId = null;
  var manualEdit = false;
  var saveState = window.SaveState ? new window.SaveState('meeting-minutes') : null;

  var attendees = [];
  var agendaItems = [];
  var decisions = [];
  var actions = [];

  var templates = [
    { id: 'blank', name: 'Blank meeting', agenda: [] },
    { id: 'board', name: 'Board meeting', agenda: ['Call to order', 'Approval of previous minutes', 'Chair report', 'Financial report', 'Resolutions', 'Any other business', 'Adjournment'] },
    { id: 'team-sync', name: 'Team sync', agenda: ['Wins since last meeting', 'Current priorities', 'Blockers', 'Decisions needed', 'Next actions'] },
    { id: 'project-review', name: 'Project review', agenda: ['Project status', 'Deliverables review', 'Timeline and milestones', 'Risks and blockers', 'Resource needs', 'Next steps'] },
    { id: 'sales', name: 'Sales review', agenda: ['Pipeline update', 'Key accounts', 'Revenue risks', 'Customer blockers', 'Next actions'] },
    { id: 'ngo', name: 'NGO or donor meeting', agenda: ['Program update', 'Field observations', 'Budget and compliance', 'Beneficiary issues', 'Donor actions'] },
    { id: 'school', name: 'School committee', agenda: ['Opening remarks', 'Attendance and apologies', 'Academic update', 'Finance and facilities', 'Parent or community issues', 'Action items'] }
  ];

  var styles = [
    { id: 'executive', name: 'Executive summary' },
    { id: 'formal', name: 'Formal minutes' },
    { id: 'action', name: 'Action-focused' },
    { id: 'standup', name: 'Standup brief' }
  ];

  var fieldIds = [
    'templateId',
    'styleId',
    'meetingTitle',
    'organization',
    'meetingDate',
    'startTime',
    'endTime',
    'location',
    'chair',
    'minuteTaker',
    'risks',
    'parkingLot',
    'nextDate',
    'nextTime',
    'nextAgenda'
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugFile(value, fallback) {
    var cleaned = String(value || fallback || 'meeting-minutes').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (cleaned || fallback || 'meeting-minutes').toLowerCase();
  }

  function toast(message) {
    var node = byId('toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      node.classList.remove('show');
    }, 2600);
  }

  function fillSelect(id, options, selected) {
    var el = byId(id);
    if (!el) return;
    el.innerHTML = '';
    options.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name;
      el.appendChild(opt);
    });
    if (selected) el.value = selected;
  }

  function getValue(id) {
    var el = byId(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setValue(id, value) {
    var el = byId(id);
    if (el) el.value = value == null ? '' : value;
  }

  function formatDate(value, opts) {
    if (!value) return '';
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || !parts[0]) return value;
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function collectState() {
    var state = {};
    fieldIds.forEach(function (id) {
      state[id] = getValue(id);
    });
    state.attendees = attendees.slice();
    state.agendaItems = agendaItems.slice();
    state.decisions = decisions.slice();
    state.actions = actions.slice();
    state.minutesText = getValue('minutesText');
    state.selectedId = selectedId;
    state.updatedAt = Date.now();
    return state;
  }

  function normalizeAttendees(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      return {
        id: item.id || uid('attendee'),
        name: item.name || '',
        role: item.role || '',
        status: item.status || 'present',
        email: item.email || ''
      };
    }).filter(function (item) { return item.name; });
  }

  function normalizeAgenda(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      return {
        id: item.id || uid('agenda'),
        title: item.title || '',
        discussion: item.discussion || '',
        decision: item.decision || '',
        owner: item.owner || ''
      };
    }).filter(function (item) { return item.title || item.discussion || item.decision; });
  }

  function normalizeDecisions(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      return {
        id: item.id || uid('decision'),
        text: item.text || item.decision || '',
        owner: item.owner || '',
        status: item.status || 'approved'
      };
    }).filter(function (item) { return item.text; });
  }

  function normalizeActions(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      return {
        id: item.id || uid('action'),
        text: item.text || '',
        owner: item.owner || '',
        due: item.due || '',
        priority: item.priority || 'medium',
        status: item.status || (item.done ? 'done' : 'open'),
        source: item.source || ''
      };
    }).filter(function (item) { return item.text; });
  }

  function applyState(state, preserveText) {
    if (!state) return;
    fieldIds.forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(state, id)) setValue(id, state[id]);
    });
    attendees = normalizeAttendees(state.attendees);
    agendaItems = normalizeAgenda(state.agendaItems);
    decisions = normalizeDecisions(state.decisions);
    actions = normalizeActions(state.actions);
    selectedId = state.selectedId || selectedId || null;
    renderAllLists();
    if (!preserveText && state.minutesText) {
      setValue('minutesText', state.minutesText);
      manualEdit = true;
    }
    if (!getValue('minutesText')) {
      rebuildMinutes();
    } else {
      updatePreviewAndScore();
    }
    renderSaved();
  }

  function addLines(lines, title, body) {
    if (!body) return;
    lines.push('');
    lines.push(title);
    lines.push(body);
  }

  function buildMinutes(state) {
    var lines = [];
    var title = state.meetingTitle || 'Meeting minutes';
    var styleId = state.styleId || 'executive';
    var present = attendees.filter(function (item) { return item.status === 'present' || item.status === 'remote'; });
    var apologies = attendees.filter(function (item) { return item.status === 'apology' || item.status === 'absent'; });
    var doneCount = actions.filter(function (item) { return item.status === 'done'; }).length;
    var openCount = actions.length - doneCount;

    lines.push(title.toUpperCase());
    if (state.organization) lines.push(state.organization);
    var detailParts = [];
    if (state.meetingDate) detailParts.push('Date: ' + formatDate(state.meetingDate));
    if (state.startTime || state.endTime) detailParts.push('Time: ' + [state.startTime, state.endTime].filter(Boolean).join(' to '));
    if (state.location) detailParts.push('Location: ' + state.location);
    if (detailParts.length) lines.push(detailParts.join(' | '));
    if (state.chair || state.minuteTaker) {
      lines.push([state.chair ? 'Chair: ' + state.chair : '', state.minuteTaker ? 'Minutes by: ' + state.minuteTaker : ''].filter(Boolean).join(' | '));
    }

    lines.push('');
    lines.push('SUMMARY');
    if (styleId === 'standup') {
      lines.push('This meeting covered ' + agendaItems.length + ' agenda item(s), recorded ' + decisions.length + ' decision(s), and left ' + openCount + ' open action item(s).');
    } else {
      lines.push('The meeting recorded ' + attendees.length + ' attendee(s), ' + agendaItems.length + ' agenda item(s), ' + decisions.length + ' decision(s), and ' + actions.length + ' action item(s). ' + doneCount + ' action item(s) are complete and ' + openCount + ' remain open.');
    }

    if (present.length) {
      addLines(lines, 'ATTENDEES PRESENT', present.map(function (item) {
        return '- ' + item.name + (item.role ? ', ' + item.role : '') + (item.status === 'remote' ? ' (remote)' : '');
      }).join('\n'));
    }
    if (apologies.length) {
      addLines(lines, 'APOLOGIES OR ABSENT', apologies.map(function (item) {
        return '- ' + item.name + (item.role ? ', ' + item.role : '') + ' (' + item.status + ')';
      }).join('\n'));
    }

    if (agendaItems.length) {
      lines.push('');
      lines.push('AGENDA AND DISCUSSION');
      agendaItems.forEach(function (item, index) {
        lines.push(String(index + 1) + '. ' + (item.title || 'Untitled agenda item'));
        if (item.discussion) lines.push('   Discussion: ' + item.discussion);
        if (item.decision) lines.push('   Outcome: ' + item.decision);
      });
    }

    var allDecisions = decisions.slice();
    agendaItems.forEach(function (item) {
      if (item.decision) allDecisions.push({ text: item.decision, owner: item.owner || '', status: 'from agenda' });
    });
    if (allDecisions.length) {
      lines.push('');
      lines.push('DECISIONS');
      allDecisions.forEach(function (item, index) {
        lines.push(String(index + 1) + '. ' + item.text + (item.owner ? ' - Owner: ' + item.owner : '') + (item.status ? ' [' + item.status + ']' : ''));
      });
    }

    if (actions.length) {
      lines.push('');
      lines.push('ACTION ITEMS');
      actions.forEach(function (item, index) {
        var meta = [];
        if (item.owner) meta.push('Owner: ' + item.owner);
        if (item.due) meta.push('Due: ' + formatDate(item.due, { day: 'numeric', month: 'short', year: 'numeric' }));
        if (item.priority) meta.push('Priority: ' + item.priority);
        if (item.status) meta.push('Status: ' + item.status);
        lines.push(String(index + 1) + '. ' + item.text + (meta.length ? ' (' + meta.join('; ') + ')' : ''));
      });
    }

    if (state.risks) addLines(lines, 'RISKS OR BLOCKERS', state.risks);
    if (state.parkingLot) addLines(lines, 'PARKING LOT', state.parkingLot);

    if (state.nextDate || state.nextAgenda) {
      lines.push('');
      lines.push('NEXT MEETING');
      if (state.nextDate) lines.push('Date: ' + formatDate(state.nextDate) + (state.nextTime ? ' at ' + state.nextTime : ''));
      if (state.nextAgenda) lines.push('Proposed agenda: ' + state.nextAgenda);
    }

    lines.push('');
    lines.push('Prepared with AfroTools Meeting Minutes Generator.');
    return lines.join('\n');
  }

  function calculateScore(state) {
    var checks = [];
    var score = 0;
    function add(label, points, good, detail) {
      if (good) score += points;
      checks.push({ label: label, good: good, detail: detail });
    }
    var agendaWithNotes = agendaItems.filter(function (item) { return item.title && (item.discussion || item.decision); }).length;
    var decisionsTotal = decisions.length + agendaItems.filter(function (item) { return item.decision; }).length;
    var actionsWithOwner = actions.filter(function (item) { return item.owner; }).length;
    var actionsWithDue = actions.filter(function (item) { return item.due; }).length;

    add('Meeting basics', 12, Boolean(state.meetingTitle && state.meetingDate && state.chair), 'Add title, date, and chair.');
    add('Minute ownership', 8, Boolean(state.minuteTaker), 'Name the minute taker.');
    add('Attendees', 12, attendees.length > 0, 'Add attendees and their status.');
    add('Agenda evidence', 16, agendaItems.length > 0 && agendaWithNotes >= Math.min(agendaItems.length, 2), 'Add agenda items with notes or outcomes.');
    add('Decisions', 14, decisionsTotal > 0, 'Record at least one decision or outcome.');
    add('Action owners', 14, actions.length > 0 && actionsWithOwner === actions.length, 'Every action should have an owner.');
    add('Action due dates', 12, actions.length > 0 && actionsWithDue === actions.length, 'Every action should have a due date.');
    add('Next meeting', 6, Boolean(state.nextDate || state.nextAgenda), 'Add next meeting date or proposed agenda.');
    add('Risk handling', 6, Boolean(state.risks || state.parkingLot), 'Capture risks, blockers, or unresolved topics.');

    return {
      score: Math.max(0, Math.min(100, score)),
      checks: checks,
      agendaWithNotes: agendaWithNotes,
      decisionsTotal: decisionsTotal,
      actionsWithOwner: actionsWithOwner,
      actionsWithDue: actionsWithDue
    };
  }

  function renderPreview(text) {
    var paper = byId('minutesPreview');
    if (!paper) return;
    paper.innerHTML = '';
    var lines = String(text || '').split('\n');
    var section = null;
    lines.forEach(function (line, index) {
      var trimmed = line.trim();
      if (!trimmed) return;
      if (index === 0) {
        var title = document.createElement('p');
        title.className = 'paper-title';
        title.textContent = trimmed;
        paper.appendChild(title);
        return;
      }
      if (/^[A-Z0-9 ,&/-]{4,}$/.test(trimmed) && trimmed.length < 40) {
        section = document.createElement('h3');
        section.textContent = trimmed;
        paper.appendChild(section);
        return;
      }
      var p = document.createElement('p');
      p.textContent = trimmed;
      paper.appendChild(p);
    });
    var footer = document.createElement('div');
    footer.className = 'paper-muted';
    footer.textContent = 'Generated privately with AfroTools.com';
    paper.appendChild(footer);
  }

  function renderScore(result) {
    byId('scoreValue').textContent = String(result.score);
    byId('scoreRing').style.setProperty('--score-deg', Math.round(result.score * 3.6) + 'deg');
    byId('scoreCopy').textContent = result.score >= 85 ? 'Strong minutes. Ready to share after a final read.' : result.score >= 65 ? 'Good base. Close the warnings below before sharing.' : 'Needs more structure before this can drive follow-through.';
    byId('metricAttendees').textContent = String(attendees.length);
    byId('metricAgenda').textContent = String(agendaItems.length);
    byId('metricDecisions').textContent = String(result.decisionsTotal);
    byId('metricActions').textContent = String(actions.length);
    byId('checksList').innerHTML = result.checks.map(function (check) {
      return '<div class="check ' + (check.good ? 'good' : 'warn') + '"><strong>' + escapeHtml(check.label) + '</strong><br>' + escapeHtml(check.good ? 'Looks good.' : check.detail) + '</div>';
    }).join('');
  }

  function updatePreviewAndScore() {
    var state = collectState();
    var text = state.minutesText;
    renderPreview(text);
    renderScore(calculateScore(state));
    persistCurrent(state);
  }

  function rebuildMinutes() {
    var state = collectState();
    setValue('minutesText', buildMinutes(state));
    manualEdit = false;
    var editState = byId('editState');
    if (editState) editState.textContent = 'Generated from the structured form. You can edit the text directly before exporting.';
    updatePreviewAndScore();
  }

  function persistCurrent(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state || collectState()));
    } catch (err) {
      // Keep the app usable if local storage is unavailable.
    }
  }

  function readCurrent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      return null;
    }
  }

  function titleFor(state) {
    return state.meetingTitle || 'Meeting minutes';
  }

  function renderAttendees() {
    var node = byId('attendeeList');
    if (!node) return;
    if (!attendees.length) {
      node.innerHTML = '<div class="helper">No attendees yet.</div>';
      return;
    }
    node.innerHTML = attendees.map(function (item) {
      return '<div class="list-item"><div class="list-title">' + escapeHtml(item.name) + '</div><div class="list-meta">' + escapeHtml([item.role, item.status, item.email].filter(Boolean).join(' | ')) + '</div><div class="list-actions"><button class="btn btn-danger" type="button" data-remove-attendee="' + escapeHtml(item.id) + '">Remove</button></div></div>';
    }).join('');
  }

  function renderAgenda() {
    var node = byId('agendaList');
    if (!node) return;
    if (!agendaItems.length) {
      node.innerHTML = '<div class="helper">No agenda items yet. Choose a template or add one below.</div>';
      return;
    }
    node.innerHTML = agendaItems.map(function (item, index) {
      return '<div class="agenda-card" data-agenda="' + escapeHtml(item.id) + '"><div class="agenda-top"><div class="agenda-index">' + (index + 1) + '</div><label class="field full" style="margin:0"><span>Title</span><input value="' + escapeHtml(item.title) + '" data-agenda-field="title" data-id="' + escapeHtml(item.id) + '"></label><button class="btn btn-danger" type="button" data-remove-agenda="' + escapeHtml(item.id) + '">Remove</button></div><label class="field full"><span>Discussion</span><textarea data-agenda-field="discussion" data-id="' + escapeHtml(item.id) + '">' + escapeHtml(item.discussion) + '</textarea></label><div class="form-grid"><label class="field"><span>Decision or outcome</span><input value="' + escapeHtml(item.decision) + '" data-agenda-field="decision" data-id="' + escapeHtml(item.id) + '"></label><label class="field"><span>Owner</span><input value="' + escapeHtml(item.owner) + '" data-agenda-field="owner" data-id="' + escapeHtml(item.id) + '"></label></div></div>';
    }).join('');
  }

  function renderDecisions() {
    var node = byId('decisionList');
    if (!node) return;
    if (!decisions.length) {
      node.innerHTML = '<div class="helper">No standalone decisions yet.</div>';
      return;
    }
    node.innerHTML = decisions.map(function (item) {
      return '<div class="list-item"><div class="list-title">' + escapeHtml(item.text) + '</div><div class="list-meta">' + escapeHtml([item.owner ? 'Owner: ' + item.owner : '', item.status].filter(Boolean).join(' | ')) + '</div><div class="list-actions"><button class="btn btn-danger" type="button" data-remove-decision="' + escapeHtml(item.id) + '">Remove</button></div></div>';
    }).join('');
  }

  function renderActions() {
    var node = byId('actionList');
    if (!node) return;
    if (!actions.length) {
      node.innerHTML = '<div class="helper">No action items yet.</div>';
      return;
    }
    node.innerHTML = actions.map(function (item) {
      var due = item.due ? formatDate(item.due, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date';
      return '<div class="list-item"><div class="list-title">' + escapeHtml(item.text) + '</div><div class="list-meta">' + escapeHtml([item.owner ? 'Owner: ' + item.owner : 'No owner', 'Due: ' + due, 'Priority: ' + item.priority, item.source ? 'Source: ' + item.source : ''].filter(Boolean).join(' | ')) + '</div><div><span class="action-status status-' + escapeHtml(item.status) + '">' + escapeHtml(item.status) + '</span></div><div class="list-actions"><button class="btn btn-soft" type="button" data-toggle-action="' + escapeHtml(item.id) + '">' + (item.status === 'done' ? 'Reopen' : 'Mark done') + '</button><button class="btn btn-danger" type="button" data-remove-action="' + escapeHtml(item.id) + '">Remove</button></div></div>';
    }).join('');
  }

  function renderAllLists() {
    renderAttendees();
    renderAgenda();
    renderDecisions();
    renderActions();
  }

  function syncAfterStructureChange() {
    renderAllLists();
    if (!manualEdit) {
      rebuildMinutes();
    } else {
      updatePreviewAndScore();
    }
  }

  function addAttendee() {
    var name = getValue('attendeeName');
    if (!name) {
      toast('Add an attendee name.');
      return;
    }
    attendees.push({
      id: uid('attendee'),
      name: name,
      role: getValue('attendeeRole'),
      status: getValue('attendeeStatus') || 'present',
      email: getValue('attendeeEmail')
    });
    ['attendeeName', 'attendeeRole', 'attendeeEmail'].forEach(function (id) { setValue(id, ''); });
    syncAfterStructureChange();
  }

  function addAgenda() {
    var title = getValue('agendaTitle');
    if (!title) {
      toast('Add an agenda title.');
      return;
    }
    agendaItems.push({
      id: uid('agenda'),
      title: title,
      discussion: getValue('agendaDiscussion'),
      decision: getValue('agendaDecision'),
      owner: ''
    });
    ['agendaTitle', 'agendaDiscussion', 'agendaDecision'].forEach(function (id) { setValue(id, ''); });
    syncAfterStructureChange();
  }

  function addDecision() {
    var text = getValue('decisionText');
    if (!text) {
      toast('Add a decision.');
      return;
    }
    decisions.push({ id: uid('decision'), text: text, owner: getValue('decisionOwner'), status: getValue('decisionStatus') || 'approved' });
    ['decisionText', 'decisionOwner'].forEach(function (id) { setValue(id, ''); });
    syncAfterStructureChange();
  }

  function addAction() {
    var text = getValue('actionText');
    if (!text) {
      toast('Add an action.');
      return;
    }
    actions.push({
      id: uid('action'),
      text: text,
      owner: getValue('actionOwner'),
      due: getValue('actionDue'),
      priority: getValue('actionPriority') || 'medium',
      status: getValue('actionStatus') || 'open',
      source: getValue('actionSource')
    });
    ['actionText', 'actionOwner', 'actionDue', 'actionSource'].forEach(function (id) { setValue(id, ''); });
    syncAfterStructureChange();
  }

  function removeById(list, id) {
    return list.filter(function (item) { return item.id !== id; });
  }

  function saveMinutes() {
    if (!saveState) {
      toast('Saving is not available in this browser.');
      return;
    }
    var state = collectState();
    var saved = saveState.save({
      id: selectedId || undefined,
      title: titleFor(state),
      data: state,
      thumbnail: null
    });
    selectedId = saved.id;
    state.selectedId = selectedId;
    persistCurrent(state);
    history.replaceState(null, '', '?id=' + encodeURIComponent(selectedId));
    renderSaved();
    toast('Saved.');
  }

  function renderSaved() {
    var node = byId('savedList');
    if (!node) return;
    if (!saveState) {
      node.innerHTML = '<div class="helper">Saved minutes are not available in this browser.</div>';
      return;
    }
    var items = saveState.getAll();
    if (!items.length) {
      node.innerHTML = '<div class="helper">No saved minutes yet.</div>';
      return;
    }
    node.innerHTML = items.map(function (item) {
      var date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return '<div class="saved-item"><div class="saved-title">' + escapeHtml(item.title || 'Untitled minutes') + '</div><div class="saved-meta">' + escapeHtml(date) + '</div><div class="list-actions"><button class="btn btn-soft" type="button" data-load="' + escapeHtml(item.id) + '">Load</button><button class="btn btn-danger" type="button" data-delete="' + escapeHtml(item.id) + '">Delete</button></div></div>';
    }).join('');
  }

  function loadSaved(id) {
    if (!saveState) return;
    var item = saveState.load(id);
    if (!item || !item.data) {
      toast('Saved minutes not found.');
      return;
    }
    selectedId = item.id;
    applyState(item.data, false);
    history.replaceState(null, '', '?id=' + encodeURIComponent(item.id));
    toast('Loaded saved minutes.');
  }

  function deleteSaved(id) {
    if (!saveState) return;
    saveState.delete(id);
    if (selectedId === id) selectedId = null;
    renderSaved();
    toast('Deleted.');
  }

  function downloadBlob(filename, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function downloadText() {
    var state = collectState();
    downloadBlob(slugFile(titleFor(state), 'meeting-minutes') + '.txt', 'text/plain;charset=utf-8', state.minutesText);
    toast('TXT downloaded.');
  }

  function downloadJson() {
    var state = collectState();
    downloadBlob(slugFile(titleFor(state), 'meeting-minutes') + '.json', 'application/json;charset=utf-8', JSON.stringify(state, null, 2));
    toast('JSON downloaded.');
  }

  function csvCell(value) {
    return '"' + String(value || '').replace(/"/g, '""') + '"';
  }

  function downloadCsv() {
    var rows = [['Action', 'Owner', 'Due date', 'Priority', 'Status', 'Source']];
    actions.forEach(function (item) {
      rows.push([item.text, item.owner, item.due, item.priority, item.status, item.source]);
    });
    var csv = rows.map(function (row) { return row.map(csvCell).join(','); }).join('\n');
    downloadBlob(slugFile(getValue('meetingTitle'), 'meeting-actions') + '-actions.csv', 'text/csv;charset=utf-8', csv);
    toast('Actions CSV downloaded.');
  }

  function downloadWord() {
    var state = collectState();
    var body = String(state.minutesText || '').split(/\n{2,}/).map(function (block) {
      return '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(titleFor(state)) + '</title><style>body{font-family:Georgia,serif;font-size:11pt;line-height:1.55;margin:54pt;}p{margin:0 0 12pt;}</style></head><body>' + body + '</body></html>';
    downloadBlob(slugFile(titleFor(state), 'meeting-minutes') + '.doc', 'application/msword;charset=utf-8', html);
    toast('Word-compatible document downloaded.');
  }

  function toIcsDate(dateValue, timeValue) {
    if (!dateValue) return '';
    var date = String(dateValue).replace(/-/g, '');
    var time = String(timeValue || '0900').replace(':', '').padEnd(4, '0');
    return date + 'T' + time + '00';
  }

  function downloadIcs() {
    var state = collectState();
    var start = toIcsDate(state.nextDate || state.meetingDate, state.nextTime || state.startTime);
    if (!start) {
      toast('Add a next meeting date first.');
      return;
    }
    var summary = 'Next meeting: ' + titleFor(state);
    var description = (state.nextAgenda || 'Follow-up meeting generated from AfroTools minutes.').replace(/\r?\n/g, '\\n');
    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AfroTools//Meeting Minutes//EN',
      'BEGIN:VEVENT',
      'UID:' + uid('meeting') + '@afrotools.com',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
      'DTSTART:' + start,
      'SUMMARY:' + summary,
      'DESCRIPTION:' + description,
      'LOCATION:' + (state.location || ''),
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    downloadBlob(slugFile(summary, 'next-meeting') + '.ics', 'text/calendar;charset=utf-8', ics);
    toast('ICS calendar file downloaded.');
  }

  function downloadPdf() {
    var state = collectState();
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast('PDF library is still loading. Try again in a moment.');
      return;
    }
    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 18;
    var y = 20;
    var lineHeight = 5.5;
    var maxWidth = pageWidth - margin * 2;
    doc.setProperties({
      title: titleFor(state),
      subject: 'Meeting minutes generated with AfroTools',
      author: state.minuteTaker || state.chair || 'AfroTools user',
      creator: 'AfroTools Meeting Minutes Generator'
    });
    String(state.minutesText || '').split('\n').forEach(function (line, index) {
      var text = line || ' ';
      var isHeading = /^[A-Z0-9 ,&/-]{4,}$/.test(text.trim()) && text.trim().length < 42;
      doc.setFont(isHeading || index === 0 ? 'helvetica' : 'times', isHeading || index === 0 ? 'bold' : 'normal');
      doc.setFontSize(index === 0 ? 14 : isHeading ? 10 : 10.5);
      var lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(function (wrapped) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrapped, margin, y);
        y += lineHeight;
      });
      if (isHeading || !line) y += 1.5;
    });
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text('Generated privately with AfroTools.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setTextColor(0);
    }
    doc.save(slugFile(titleFor(state), 'meeting-minutes') + '.pdf');
    toast('PDF downloaded.');
  }

  function copyRecap() {
    var text = getValue('minutesText');
    if (!text) {
      toast('Nothing to copy yet.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copied to clipboard.');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy() {
    var node = byId('minutesText');
    if (!node) return;
    node.focus();
    node.select();
    try {
      document.execCommand('copy');
      toast('Copied to clipboard.');
    } catch (err) {
      toast('Select the text and copy manually.');
    }
  }

  function encodeShare(state) {
    var json = JSON.stringify(state);
    var encoded = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    var url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set(SHARE_PARAM, encoded);
    return url.toString();
  }

  function decodeShare(value) {
    try {
      var normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) normalized += '=';
      return JSON.parse(decodeURIComponent(escape(atob(normalized))));
    } catch (err) {
      return null;
    }
  }

  function copyShareLink() {
    var url = encodeShare(collectState());
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast('Share link copied.');
      }).catch(function () {
        toast('Could not copy share link.');
      });
    } else {
      toast('Clipboard unavailable.');
    }
  }

  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || '{}'));
        selectedId = data.selectedId || null;
        applyState(data, false);
        history.replaceState(null, '', window.location.pathname);
        toast('Imported minutes.');
      } catch (err) {
        toast('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function handleFormChange(event) {
    if (event && event.target && event.target.id === 'templateId') {
      var template = templates.find(function (item) { return item.id === getValue('templateId'); });
      if (template && template.agenda.length && agendaItems.length === 0) {
        agendaItems = template.agenda.map(function (title) {
          return { id: uid('agenda'), title: title, discussion: '', decision: '', owner: '' };
        });
        renderAgenda();
      }
    }
    if (manualEdit) {
      var editState = byId('editState');
      if (editState) editState.textContent = 'Structured fields changed after manual edits. Click Rebuild to regenerate the minutes.';
      updatePreviewAndScore();
      return;
    }
    rebuildMinutes();
  }

  function attachEvents() {
    fieldIds.forEach(function (id) {
      var el = byId(id);
      if (!el) return;
      el.addEventListener('input', handleFormChange);
      el.addEventListener('change', handleFormChange);
    });

    var text = byId('minutesText');
    if (text) {
      text.addEventListener('input', function () {
        manualEdit = true;
        var editState = byId('editState');
        if (editState) editState.textContent = 'Manual edits are preserved. Use Rebuild only when you want a fresh structured version.';
        updatePreviewAndScore();
      });
    }

    document.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var agendaId = target.getAttribute('data-id');
      var field = target.getAttribute('data-agenda-field');
      if (agendaId && field) {
        agendaItems = agendaItems.map(function (item) {
          if (item.id === agendaId) item[field] = target.value;
          return item;
        });
        if (!manualEdit) rebuildMinutes();
        else updatePreviewAndScore();
      }
    });

    document.addEventListener('click', function (event) {
      var node = event.target.closest('[data-action]');
      if (node) {
        var action = node.getAttribute('data-action');
        if (action === 'rebuild') rebuildMinutes();
        if (action === 'save') saveMinutes();
        if (action === 'copy') copyRecap();
        if (action === 'share') copyShareLink();
        if (action === 'pdf') downloadPdf();
        if (action === 'word') downloadWord();
        if (action === 'txt') downloadText();
        if (action === 'csv') downloadCsv();
        if (action === 'ics') downloadIcs();
        if (action === 'json') downloadJson();
        if (action === 'import') byId('importInput').click();
        if (action === 'print') window.print();
        if (action === 'add-attendee') addAttendee();
        if (action === 'add-agenda') addAgenda();
        if (action === 'add-decision') addDecision();
        if (action === 'add-action') addAction();
      }

      var id;
      if ((id = event.target.closest('[data-remove-attendee]') && event.target.closest('[data-remove-attendee]').getAttribute('data-remove-attendee'))) {
        attendees = removeById(attendees, id);
        syncAfterStructureChange();
      }
      if ((id = event.target.closest('[data-remove-agenda]') && event.target.closest('[data-remove-agenda]').getAttribute('data-remove-agenda'))) {
        agendaItems = removeById(agendaItems, id);
        syncAfterStructureChange();
      }
      if ((id = event.target.closest('[data-remove-decision]') && event.target.closest('[data-remove-decision]').getAttribute('data-remove-decision'))) {
        decisions = removeById(decisions, id);
        syncAfterStructureChange();
      }
      if ((id = event.target.closest('[data-remove-action]') && event.target.closest('[data-remove-action]').getAttribute('data-remove-action'))) {
        actions = removeById(actions, id);
        syncAfterStructureChange();
      }
      if ((id = event.target.closest('[data-toggle-action]') && event.target.closest('[data-toggle-action]').getAttribute('data-toggle-action'))) {
        actions = actions.map(function (item) {
          if (item.id === id) item.status = item.status === 'done' ? 'open' : 'done';
          return item;
        });
        syncAfterStructureChange();
      }

      var load = event.target.closest('[data-load]');
      if (load) loadSaved(load.getAttribute('data-load'));
      var del = event.target.closest('[data-delete]');
      if (del) deleteSaved(del.getAttribute('data-delete'));
    });

    var importInput = byId('importInput');
    if (importInput) {
      importInput.addEventListener('change', function () {
        importJsonFile(importInput.files && importInput.files[0]);
        importInput.value = '';
      });
    }
  }

  function loadInitialState() {
    var params = new URLSearchParams(window.location.search);
    var shared = params.get(SHARE_PARAM);
    if (shared) {
      var sharedState = decodeShare(shared);
      if (sharedState) {
        selectedId = null;
        applyState(sharedState, false);
        toast('Shared minutes loaded.');
        return true;
      }
    }
    var id = params.get('id');
    if (id && saveState) {
      var item = saveState.load(id);
      if (item && item.data) {
        selectedId = id;
        applyState(item.data, false);
        return true;
      }
    }
    var current = readCurrent();
    if (current && (current.meetingTitle || current.minutesText)) {
      selectedId = current.selectedId || null;
      applyState(current, false);
      return true;
    }
    return false;
  }

  function initDefaults() {
    fillSelect('templateId', templates, 'blank');
    fillSelect('styleId', styles, 'executive');
    var today = new Date();
    setValue('meetingDate', today.toISOString().slice(0, 10));
    setValue('startTime', today.toTimeString().slice(0, 5));
  }

  function init() {
    initDefaults();
    attachEvents();
    var loaded = loadInitialState();
    if (!loaded) {
      rebuildMinutes();
    }
    renderAllLists();
    renderSaved();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
