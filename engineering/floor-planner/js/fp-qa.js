/* AfroPlan plan QA and handoff pack */
(function (window, document) {
  'use strict';

  var sourceLinks = [
    {
      label: 'RoomSketcher floor plan features',
      href: 'https://www.roomsketcher.com/features/roomsketcher-app/'
    },
    {
      label: 'AutoCAD Web measurements and layers',
      href: 'https://help.autodesk.com/view/ACADWEB/ENU/?query=features'
    }
  ];

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function meters(value) {
    return (Number(value) || 0).toFixed(1) + ' m';
  }

  function area(value) {
    return (Number(value) || 0).toFixed(1) + ' m2';
  }

  function lengthOf(wall) {
    var dx = (wall.x2 || 0) - (wall.x1 || 0);
    var dy = (wall.y2 || 0) - (wall.y1 || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function roomBounds(room) {
    var points = Array.isArray(room.points) ? room.points : [];
    var xs = points.map(function (point) { return point.x || 0; });
    var ys = points.map(function (point) { return point.y || 0; });
    if (!xs.length) return { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, depth: 0 };
    var x1 = Math.min.apply(Math, xs);
    var x2 = Math.max.apply(Math, xs);
    var y1 = Math.min.apply(Math, ys);
    var y2 = Math.max.apply(Math, ys);
    return { x1: x1, y1: y1, x2: x2, y2: y2, width: x2 - x1, depth: y2 - y1 };
  }

  function pointNearRoom(point, bounds) {
    var tolerance = 0.35;
    return point.x >= bounds.x1 - tolerance &&
      point.x <= bounds.x2 + tolerance &&
      point.y >= bounds.y1 - tolerance &&
      point.y <= bounds.y2 + tolerance;
  }

  function openingsForRoom(room, openings) {
    var bounds = roomBounds(room);
    return openings.filter(function (opening) {
      return pointNearRoom(opening, bounds);
    });
  }

  function status(type, title, body) {
    return { type: type, title: title, body: body };
  }

  function roomTarget(name) {
    var lower = String(name || '').toLowerCase();
    if (/master/.test(lower)) return { min: 14, good: 18 };
    if (/bed/.test(lower)) return { min: 9, good: 12 };
    if (/living|parlour|sitting|lounge/.test(lower)) return { min: 16, good: 22 };
    if (/kitchen/.test(lower)) return { min: 7, good: 10 };
    if (/bath|toilet|wc|shower/.test(lower)) return { min: 2.5, good: 4 };
    if (/corridor|passage|hall/.test(lower)) return { min: 0, good: 1.2, corridor: true };
    return { min: 4, good: 8 };
  }

  function assessRoom(room, doors, windows) {
    var bounds = roomBounds(room);
    var name = room.name || 'Unnamed room';
    var target = roomTarget(name);
    var roomArea = Number(room.area) || Math.abs(bounds.width * bounds.depth);
    var minSide = Math.min(bounds.width || 0, bounds.depth || 0);
    var roomWindows = openingsForRoom(room, windows);
    var roomDoors = openingsForRoom(room, doors);
    var flags = [];

    if (!room.name) flags.push('Name this room before export.');
    if (target.corridor && minSide && minSide < 1.2) flags.push('Corridor appears under 1.2 m clear width.');
    if (!target.corridor && roomArea < target.min) flags.push('Area is tight for this room type.');
    if (!/store|garage|corridor|passage|hall/i.test(name) && !roomWindows.length) flags.push('No window detected near this room.');
    if (!roomDoors.length) flags.push('No door detected near this room.');

    return {
      name: name,
      area: roomArea,
      width: bounds.width,
      depth: bounds.depth,
      windows: roomWindows.length,
      doors: roomDoors.length,
      status: flags.length ? 'warn' : 'ok',
      notes: flags.length ? flags.join(' ') : 'Looks ready for review.'
    };
  }

  function buildReport() {
    var data = window.FPApp && typeof window.FPApp.exportPlanData === 'function'
      ? window.FPApp.exportPlanData()
      : { walls: [], doors: [], windows: [], rooms: [], furniture: [], totalArea: 0 };

    var walls = Array.isArray(data.walls) ? data.walls : [];
    var doors = Array.isArray(data.doors) ? data.doors : [];
    var windows = Array.isArray(data.windows) ? data.windows : [];
    var rooms = Array.isArray(data.rooms) ? data.rooms : [];
    var furniture = Array.isArray(data.furniture) ? data.furniture : [];
    var totalArea = Number(data.totalArea) || rooms.reduce(function (sum, room) {
      return sum + (Number(room.area) || 0);
    }, 0);
    var wallLength = walls.reduce(function (sum, wall) { return sum + lengthOf(wall); }, 0);
    var roomRows = rooms.map(function (room) { return assessRoom(room, doors, windows); });
    var namedRooms = rooms.filter(function (room) { return !!room.name; }).length;
    var wetRooms = rooms.filter(function (room) { return /bath|toilet|wc|shower|kitchen/i.test(room.name || ''); }).length;
    var bedrooms = rooms.filter(function (room) { return /bed|master/i.test(room.name || ''); }).length;
    var checks = [];

    checks.push(status(rooms.length ? 'ok' : 'risk', 'Room Schedule', rooms.length ? rooms.length + ' rooms detected, ' + namedRooms + ' named.' : 'No rooms detected yet. Draw closed walls or load a template first.'));
    checks.push(status(totalArea > 0 ? 'ok' : 'risk', 'Measured Area', totalArea > 0 ? 'Total room area is ' + area(totalArea) + '.' : 'No measurable room area yet.'));
    checks.push(status(windows.length >= Math.max(1, Math.ceil(rooms.length * 0.5)) ? 'ok' : 'warn', 'Ventilation Openings', windows.length + ' windows for ' + rooms.length + ' rooms. Cross-check bedrooms, living rooms and kitchens.'));
    checks.push(status(doors.length >= Math.max(1, rooms.length - 1) ? 'ok' : 'warn', 'Access Points', doors.length + ' doors detected. Every usable room should have a door or clear opening.'));
    checks.push(status(wetRooms ? 'ok' : 'warn', 'Wet Core', wetRooms ? wetRooms + ' kitchen/bath/service rooms detected.' : 'Add or label kitchen, bath and toilet areas for BOQ handoff.'));
    checks.push(status(bedrooms ? 'ok' : 'warn', 'Bedroom Privacy', bedrooms ? bedrooms + ' bedroom spaces detected. Check that bedroom access does not cut through living spaces.' : 'No bedroom labels detected.'));
    checks.push(status(furniture.length ? 'ok' : 'warn', 'Furniture Fit', furniture.length ? furniture.length + ' furniture or fixture items placed.' : 'Place key furniture and fixtures to test clearances before export.'));
    checks.push(status(wallLength > 0 ? 'ok' : 'risk', 'Export Readiness', wallLength > 0 ? 'Wall length total is ' + meters(wallLength) + '. Export PDF, PNG or BOQ after QA.' : 'No wall geometry found for export.'));

    return {
      data: data,
      metrics: {
        rooms: rooms.length,
        totalArea: totalArea,
        wallLength: wallLength,
        openings: doors.length + windows.length,
        furniture: furniture.length
      },
      checks: checks,
      roomRows: roomRows
    };
  }

  function metricHtml(label, value) {
    return '<div class="fp-qa-metric"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  function checkHtml(check) {
    return '<div class="fp-qa-item">' +
      '<span class="fp-qa-status ' + esc(check.type) + '"></span>' +
      '<div><strong>' + esc(check.title) + '</strong><p>' + esc(check.body) + '</p></div>' +
      '</div>';
  }

  function roomTableHtml(rows) {
    if (!rows.length) return '<p style="font-size:12px;color:var(--color-text-muted)">No room polygons detected yet.</p>';
    return '<table class="fp-qa-table"><thead><tr><th>Room</th><th>Area</th><th>Size</th><th>Openings</th><th>Note</th></tr></thead><tbody>' +
      rows.map(function (room) {
        return '<tr><td>' + esc(room.name) + '</td><td>' + esc(area(room.area)) + '</td><td>' + esc(meters(room.width) + ' x ' + meters(room.depth)) + '</td><td>' + esc(room.doors + 'D / ' + room.windows + 'W') + '</td><td>' + esc(room.notes) + '</td></tr>';
      }).join('') +
      '</tbody></table>';
  }

  function handoffText(report) {
    var lines = [
      'AfroPlan QA Handoff',
      'Project: ' + ((window.FPApp && window.FPApp.projectName) || 'Untitled Plan'),
      'Rooms: ' + report.metrics.rooms,
      'Total room area: ' + area(report.metrics.totalArea),
      'Wall length: ' + meters(report.metrics.wallLength),
      'Openings: ' + report.metrics.openings,
      '',
      'Checks:'
    ];
    report.checks.forEach(function (check) {
      lines.push('- ' + check.title + ': ' + check.body);
    });
    if (report.roomRows.length) {
      lines.push('', 'Room schedule:');
      report.roomRows.forEach(function (room) {
        lines.push('- ' + room.name + ': ' + area(room.area) + ', ' + meters(room.width) + ' x ' + meters(room.depth) + ', ' + room.doors + ' doors, ' + room.windows + ' windows. ' + room.notes);
      });
    }
    return lines.join('\n');
  }

  function renderQa() {
    var report = buildReport();
    var body = document.getElementById('fpQaContent');
    if (!body) return;
    body.innerHTML =
      '<div class="fp-qa-grid">' +
      metricHtml('Rooms', report.metrics.rooms) +
      metricHtml('Area', area(report.metrics.totalArea)) +
      metricHtml('Wall Length', meters(report.metrics.wallLength)) +
      metricHtml('Openings', report.metrics.openings) +
      metricHtml('Furniture', report.metrics.furniture) +
      '</div>' +
      '<div class="fp-qa-section"><h3>Review Checks</h3><div class="fp-qa-list">' + report.checks.map(checkHtml).join('') + '</div></div>' +
      '<div class="fp-qa-section"><h3>Room Schedule</h3>' + roomTableHtml(report.roomRows) + '</div>' +
      '<div class="fp-qa-actions">' +
      '<button type="button" class="fp-act-btn fp-act-ai" id="fpQaCopy">Copy Handoff</button>' +
      '<button type="button" class="fp-act-btn" id="fpQaRefresh">Refresh QA</button>' +
      '</div>' +
      '<div class="fp-qa-source">Inspired by practical floor-plan features such as measurements, room labels, symbols, export and review workflows. Sources: ' +
      sourceLinks.map(function (link) { return '<a href="' + esc(link.href) + '" target="_blank" rel="noopener">' + esc(link.label) + '</a>'; }).join(' | ') +
      '</div>';

    var copy = document.getElementById('fpQaCopy');
    var refresh = document.getElementById('fpQaRefresh');
    if (copy) copy.addEventListener('click', function () {
      var text = handoffText(report);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          copy.textContent = 'Copied';
          window.setTimeout(function () { copy.textContent = 'Copy Handoff'; }, 1400);
        }).catch(function () { window.prompt('Copy handoff notes:', text); });
      } else {
        window.prompt('Copy handoff notes:', text);
      }
    });
    if (refresh) refresh.addEventListener('click', renderQa);
  }

  function ensureModal() {
    if (document.getElementById('fpQaModal')) return;
    var modal = document.createElement('div');
    modal.id = 'fpQaModal';
    modal.className = 'fp-modal-overlay';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="fp-modal fp-modal-lg" role="dialog" aria-modal="true" aria-labelledby="fpQaTitle">' +
      '<div class="fp-modal-header"><h2 id="fpQaTitle">Plan QA & Handoff</h2><button class="fp-modal-close" type="button" data-close="fpQaModal">&times;</button></div>' +
      '<div class="fp-modal-body" id="fpQaContent"></div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.hidden = true;
    });
    modal.querySelector('[data-close="fpQaModal"]').addEventListener('click', function () {
      modal.hidden = true;
    });
  }

  function addButton() {
    var actionRight = document.querySelector('.fp-action-right');
    if (!actionRight || document.getElementById('fpPlanQa')) return;
    var button = document.createElement('button');
    button.id = 'fpPlanQa';
    button.type = 'button';
    button.className = 'fp-act-btn fp-act-ai';
    button.title = 'Plan QA';
    button.textContent = 'Plan QA';
    var reference = document.getElementById('fpOptimize');
    actionRight.insertBefore(button, reference || actionRight.firstChild);
    button.addEventListener('click', function () {
      ensureModal();
      renderQa();
      document.getElementById('fpQaModal').hidden = false;
    });
  }

  function init() {
    addButton();
    ensureModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.FPPlanQA = { buildReport: buildReport, render: renderQa };
})(window, document);
