/**
 * AfroPlan Objects — Doors, Windows, Selection, Move, Rotate, Erase, Labels, Dimensions
 */
var FPObjects = (function() {
  'use strict';

  var dragObj = null, dragOffset = { x: 0, y: 0 };
  var isDragging = false;
  var placingType = null; // 'door' or 'window' for placement mode
  var placingSubtype = null;
  var measureStart = null;

  // Door types
  var DOOR_TYPES = [
    { key: 'single', label: 'Single Door', width: 0.9 },
    { key: 'double', label: 'Double Door', width: 1.5 },
    { key: 'sliding', label: 'Sliding Door', width: 1.5 },
    { key: 'folding', label: 'Folding Door', width: 1.2 },
    { key: 'security', label: 'Security Gate', width: 0.9 }
  ];

  // Window types
  var WINDOW_TYPES = [
    { key: 'single', label: 'Single Window', width: 0.6 },
    { key: 'double', label: 'Double Window', width: 1.2 },
    { key: 'louvre', label: 'Louvre/Jalousie', width: 1.2 },
    { key: 'sliding', label: 'Sliding Window', width: 1.5 },
    { key: 'casement', label: 'Casement Window', width: 0.9 }
  ];

  function init() {
    FPCanvas.on('canvasMouseDown', onMouseDown);
    FPCanvas.on('canvasMouseMove', onMouseMove);
    FPCanvas.on('canvasMouseUp', onMouseUp);
    FPCanvas.on('canvasDblClick', onDblClick);
    FPCanvas.on('delete', deleteSelected);
    FPCanvas.on('escape', cancelAction);
    FPCanvas.on('rotate', rotateSelected);
    FPCanvas.on('copy', copySelected);
    FPCanvas.on('paste', pasteClipboard);
    FPCanvas.on('keypress', onKeyPress);
  }

  var clipboard = null;

  function onMouseDown(e) {
    var tool = FPApp ? FPApp.currentTool : 'select';

    if (tool === 'door' || tool === 'window') {
      placeDoorOrWindow(e.world, tool);
      return;
    }
    if (tool === 'measure') {
      if (!measureStart) {
        measureStart = FPCanvas.snapPoint(e.world.x, e.world.y);
      } else {
        var end = FPCanvas.snapPoint(e.world.x, e.world.y);
        FPCanvas.pushUndo();
        FPCanvas.addObject({
          type: 'dimension',
          x1: measureStart.x, y1: measureStart.y,
          x2: end.x, y2: end.y
        });
        measureStart = null;
        FPCanvas.render();
        FPCanvas.emit('objectsChanged');
      }
      return;
    }
    if (tool === 'label') {
      var snap = FPCanvas.snapPoint(e.world.x, e.world.y);
      var text = prompt('Enter label text:');
      if (text) {
        FPCanvas.pushUndo();
        FPCanvas.addObject({ type: 'label', x: snap.x, y: snap.y, text: text });
        FPCanvas.render();
        FPCanvas.emit('objectsChanged');
      }
      return;
    }
    if (tool === 'erase') {
      var hit = FPCanvas.hitTest(e.world.x, e.world.y);
      if (hit) {
        FPCanvas.pushUndo();
        FPCanvas.removeObject(hit.id);
        FPCanvas.deselect();
        FPWalls.detectRooms();
        FPCanvas.render();
        FPCanvas.emit('objectsChanged');
      }
      return;
    }
    if (tool === 'select') {
      var hit2 = FPCanvas.hitTest(e.world.x, e.world.y);
      if (hit2) {
        FPCanvas.select([hit2.id]);
        dragObj = hit2;
        dragOffset = { x: e.world.x - (hit2.x || hit2.x1 || 0), y: e.world.y - (hit2.y || hit2.y1 || 0) };
        isDragging = false;
        showProperties(hit2);
      } else {
        FPCanvas.deselect();
        showEmptyProperties();
      }
    }
  }

  function onMouseMove(e) {
    var tool = FPApp ? FPApp.currentTool : 'select';
    if (tool === 'select' && dragObj) {
      isDragging = true;
      var nx = FPCanvas.snapToGrid(e.world.x - dragOffset.x);
      var ny = FPCanvas.snapToGrid(e.world.y - dragOffset.y);
      moveObject(dragObj, nx, ny);
      FPCanvas.render();
    }
    // Hover highlight
    if (tool === 'select' || tool === 'erase') {
      var hit = FPCanvas.hitTest(e.world.x, e.world.y);
      FPCanvas.emit('hover', hit ? hit.id : null);
    }
  }

  function onMouseUp(e) {
    if (dragObj && isDragging) {
      FPCanvas.pushUndo();
      FPWalls.detectRooms();
      FPCanvas.emit('objectsChanged');
    }
    dragObj = null;
    isDragging = false;
  }

  function onDblClick(e) {
    var tool = FPApp ? FPApp.currentTool : 'select';
    if (tool !== 'select') return;
    var hit = FPCanvas.hitTest(e.world.x, e.world.y);
    if (hit && hit.type === 'room') {
      var name = prompt('Room name:', hit.name || '');
      if (name !== null) {
        FPCanvas.pushUndo();
        FPWalls.setRoomName(hit.id, name);
        FPCanvas.emit('objectsChanged');
      }
    }
    if (hit && hit.type === 'label') {
      var text = prompt('Edit label:', hit.text || '');
      if (text !== null) {
        FPCanvas.pushUndo();
        hit.text = text;
        FPCanvas.render();
        FPCanvas.emit('objectsChanged');
      }
    }
  }

  function moveObject(obj, nx, ny) {
    if (obj.type === 'wall') {
      var dx = nx - obj.x1, dy = ny - obj.y1;
      obj.x1 = nx; obj.y1 = ny;
      obj.x2 += dx; obj.y2 += dy;
    } else if (obj.x !== undefined) {
      obj.x = nx; obj.y = ny;
    }
  }

  function placeDoorOrWindow(world, type) {
    var snap = FPCanvas.snapPoint(world.x, world.y);
    // Find nearest wall to place on
    var walls = FPCanvas.getObjects('wall');
    var bestWall = null, bestDist = 0.5;
    walls.forEach(function(w) {
      var d = pointToSegDist(snap.x, snap.y, w.x1, w.y1, w.x2, w.y2);
      if (d < bestDist) { bestDist = d; bestWall = w; }
    });

    var angle = 0;
    if (bestWall) {
      angle = Math.atan2(bestWall.y2 - bestWall.y1, bestWall.x2 - bestWall.x1);
      // Project point onto wall
      var t = projectPointOnLine(snap.x, snap.y, bestWall.x1, bestWall.y1, bestWall.x2, bestWall.y2);
      snap.x = bestWall.x1 + t * (bestWall.x2 - bestWall.x1);
      snap.y = bestWall.y1 + t * (bestWall.y2 - bestWall.y1);
    }

    var defaults = type === 'door' ? DOOR_TYPES[0] : WINDOW_TYPES[0];
    FPCanvas.pushUndo();
    FPCanvas.addObject({
      type: type,
      x: snap.x,
      y: snap.y,
      width: defaults.width,
      angle: angle,
      subtype: defaults.key
    });
    FPCanvas.render();
    FPCanvas.emit('objectsChanged');
  }

  function projectPointOnLine(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return 0;
    return Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  }

  function pointToSegDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    var nx = x1 + t * dx, ny = y1 + t * dy;
    return Math.sqrt((px - nx) * (px - nx) + (py - ny) * (py - ny));
  }

  function deleteSelected() {
    var ids = FPCanvas.selectedIds;
    if (ids.length === 0) return;
    FPCanvas.pushUndo();
    ids.forEach(function(id) { FPCanvas.removeObject(id); });
    FPCanvas.deselect();
    FPWalls.detectRooms();
    FPCanvas.render();
    FPCanvas.emit('objectsChanged');
    showEmptyProperties();
  }

  function rotateSelected() {
    var ids = FPCanvas.selectedIds;
    if (ids.length === 0) return;
    FPCanvas.pushUndo();
    ids.forEach(function(id) {
      var obj = FPCanvas.getObject(id);
      if (!obj) return;
      if (obj.type === 'furniture') {
        obj.rotation = (obj.rotation || 0) + Math.PI / 4;
      } else if (obj.type === 'door' || obj.type === 'window') {
        obj.angle = (obj.angle || 0) + Math.PI / 2;
      }
    });
    FPCanvas.render();
    FPCanvas.emit('objectsChanged');
  }

  function copySelected() {
    var ids = FPCanvas.selectedIds;
    if (ids.length === 0) return;
    clipboard = ids.map(function(id) {
      var o = FPCanvas.getObject(id);
      return o ? JSON.parse(JSON.stringify(o)) : null;
    }).filter(Boolean);
  }

  function pasteClipboard() {
    if (!clipboard || clipboard.length === 0) return;
    FPCanvas.pushUndo();
    var offset = 0.5; // offset paste
    clipboard.forEach(function(o) {
      var copy = JSON.parse(JSON.stringify(o));
      delete copy.id;
      delete copy._deleted;
      if (copy.x !== undefined) { copy.x += offset; copy.y += offset; }
      if (copy.x1 !== undefined) { copy.x1 += offset; copy.y1 += offset; copy.x2 += offset; copy.y2 += offset; }
      FPCanvas.addObject(copy);
    });
    FPCanvas.render();
    FPCanvas.emit('objectsChanged');
  }

  function cancelAction() {
    placingType = null;
    measureStart = null;
    FPCanvas.deselect();
  }

  function onKeyPress(e) {
    // Tool shortcuts
    var shortcuts = { v: 'select', w: 'wall', d: 'door', n: 'window', f: 'furniture', m: 'measure', l: 'label', e: 'erase' };
    if (shortcuts[e.key] && FPApp) {
      FPApp.setTool(shortcuts[e.key]);
    }
  }

  // ── Properties panel ──
  function showProperties(obj) {
    var el = document.getElementById('fpPropsContent');
    if (!el) return;
    var html = '';
    if (obj.type === 'wall') {
      var len = Math.sqrt(Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2));
      html = '<div class="fp-prop-group"><div class="fp-prop-label">Wall</div>' +
        '<div class="fp-prop-row"><span>Length:</span><span style="font-family:var(--font-mono)">' + FPCanvas.formatDim(len) + '</span></div>' +
        '<div class="fp-prop-label">Thickness</div>' +
        '<select class="fp-prop-select" onchange="FPObjects.updateProp(' + obj.id + ',\'thickness\',parseFloat(this.value))">' +
        '<option value="0.15"' + (obj.thickness === 0.15 ? ' selected' : '') + '>150mm (6")</option>' +
        '<option value="0.225"' + (obj.thickness === 0.225 ? ' selected' : '') + '>225mm (9")</option>' +
        '<option value="0.1"' + (obj.thickness === 0.1 ? ' selected' : '') + '>100mm (drywall)</option>' +
        '</select>' +
        '<div class="fp-prop-label" style="margin-top:8px">Material</div>' +
        '<select class="fp-prop-select" onchange="FPObjects.updateProp(' + obj.id + ',\'material\',this.value)">' +
        '<option value="block"' + (obj.material === 'block' ? ' selected' : '') + '>Concrete Block</option>' +
        '<option value="brick"' + (obj.material === 'brick' ? ' selected' : '') + '>Brick</option>' +
        '<option value="drywall"' + (obj.material === 'drywall' ? ' selected' : '') + '>Drywall</option>' +
        '</select></div>';
    } else if (obj.type === 'door') {
      html = '<div class="fp-prop-group"><div class="fp-prop-label">Door</div>' +
        '<div class="fp-prop-label">Type</div>' +
        '<select class="fp-prop-select" onchange="FPObjects.updateDoorType(' + obj.id + ',this.value)">' +
        DOOR_TYPES.map(function(d) { return '<option value="' + d.key + '"' + (obj.subtype === d.key ? ' selected' : '') + '>' + d.label + '</option>'; }).join('') +
        '</select>' +
        '<div class="fp-prop-label" style="margin-top:8px">Width</div>' +
        '<input type="number" class="fp-prop-input" value="' + (obj.width * 1000).toFixed(0) + '" step="50" onchange="FPObjects.updateProp(' + obj.id + ',\'width\',this.value/1000)">' +
        '<span style="font-size:10px;color:var(--color-text-muted)">mm</span></div>';
    } else if (obj.type === 'window') {
      html = '<div class="fp-prop-group"><div class="fp-prop-label">Window</div>' +
        '<div class="fp-prop-label">Type</div>' +
        '<select class="fp-prop-select" onchange="FPObjects.updateWinType(' + obj.id + ',this.value)">' +
        WINDOW_TYPES.map(function(w) { return '<option value="' + w.key + '"' + (obj.subtype === w.key ? ' selected' : '') + '>' + w.label + '</option>'; }).join('') +
        '</select>' +
        '<div class="fp-prop-label" style="margin-top:8px">Width</div>' +
        '<input type="number" class="fp-prop-input" value="' + (obj.width * 1000).toFixed(0) + '" step="50" onchange="FPObjects.updateProp(' + obj.id + ',\'width\',this.value/1000)">' +
        '<span style="font-size:10px;color:var(--color-text-muted)">mm</span></div>';
    } else if (obj.type === 'furniture') {
      html = '<div class="fp-prop-group"><div class="fp-prop-label">' + (obj.label || 'Furniture') + '</div>' +
        '<div class="fp-prop-row"><span>W:</span><input type="number" class="fp-prop-input" value="' + (obj.w * 100).toFixed(0) + '" step="5" onchange="FPObjects.updateProp(' + obj.id + ',\'w\',this.value/100)"><span>cm</span></div>' +
        '<div class="fp-prop-row"><span>D:</span><input type="number" class="fp-prop-input" value="' + (obj.h * 100).toFixed(0) + '" step="5" onchange="FPObjects.updateProp(' + obj.id + ',\'h\',this.value/100)"><span>cm</span></div>' +
        '<button class="fp-btn" style="width:100%;margin-top:6px;padding:5px;font-size:11px" onclick="FPObjects.rotateSelected()">Rotate (R)</button></div>';
    } else if (obj.type === 'room') {
      html = '<div class="fp-prop-group"><div class="fp-prop-label">Room</div>' +
        '<div class="fp-prop-row"><span>Name:</span></div>' +
        '<input type="text" class="fp-prop-input" value="' + (obj.name || '') + '" onchange="FPWalls.setRoomName(' + obj.id + ',this.value)" list="roomNames">' +
        '<datalist id="roomNames">' + FPWalls.ROOM_SUGGESTIONS.map(function(s) { return '<option value="' + s + '">'; }).join('') + '</datalist>' +
        '<div class="fp-prop-row" style="margin-top:8px"><span>Area:</span><span style="font-family:var(--font-mono)">' + FPCanvas.formatArea(obj.area || 0) + '</span></div></div>';
    }
    el.innerHTML = html || '<div class="fp-props-empty">Select an element</div>';
  }

  function showEmptyProperties() {
    var el = document.getElementById('fpPropsContent');
    if (el) {
      // Show plan summary
      var walls = FPCanvas.getObjects('wall');
      var rooms = FPCanvas.getObjects('room');
      var totalArea = 0;
      rooms.forEach(function(r) { totalArea += r.area || 0; });
      var totalWallLen = 0;
      walls.forEach(function(w) {
        totalWallLen += Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
      });
      el.innerHTML = '<div class="fp-prop-group"><div class="fp-prop-label">Plan Summary</div>' +
        '<div class="fp-prop-row"><span>Walls:</span><span>' + walls.length + '</span></div>' +
        '<div class="fp-prop-row"><span>Rooms:</span><span>' + rooms.length + '</span></div>' +
        '<div class="fp-prop-row"><span>Total wall:</span><span style="font-family:var(--font-mono)">' + FPCanvas.formatDim(totalWallLen) + '</span></div>' +
        '<div class="fp-prop-row"><span>Total area:</span><span style="font-family:var(--font-mono)">' + FPCanvas.formatArea(totalArea) + '</span></div>' +
        '<div class="fp-prop-row"><span>Doors:</span><span>' + FPCanvas.getObjects('door').length + '</span></div>' +
        '<div class="fp-prop-row"><span>Windows:</span><span>' + FPCanvas.getObjects('window').length + '</span></div>' +
        '<div class="fp-prop-row"><span>Furniture:</span><span>' + FPCanvas.getObjects('furniture').length + '</span></div></div>';
    }
  }

  function updateProp(id, key, val) {
    var obj = FPCanvas.getObject(id);
    if (!obj) return;
    FPCanvas.pushUndo();
    obj[key] = typeof val === 'string' ? parseFloat(val) || val : val;
    FPCanvas.render();
    FPCanvas.emit('objectsChanged');
  }

  function updateDoorType(id, key) {
    var obj = FPCanvas.getObject(id);
    var dt = DOOR_TYPES.find(function(d) { return d.key === key; });
    if (obj && dt) {
      FPCanvas.pushUndo();
      obj.subtype = key;
      obj.width = dt.width;
      FPCanvas.render();
      showProperties(obj);
    }
  }

  function updateWinType(id, key) {
    var obj = FPCanvas.getObject(id);
    var wt = WINDOW_TYPES.find(function(w) { return w.key === key; });
    if (obj && wt) {
      FPCanvas.pushUndo();
      obj.subtype = key;
      obj.width = wt.width;
      FPCanvas.render();
      showProperties(obj);
    }
  }

  return {
    init: init,
    deleteSelected: deleteSelected,
    rotateSelected: rotateSelected,
    showProperties: showProperties,
    showEmptyProperties: showEmptyProperties,
    updateProp: updateProp,
    updateDoorType: updateDoorType,
    updateWinType: updateWinType,
    DOOR_TYPES: DOOR_TYPES,
    WINDOW_TYPES: WINDOW_TYPES
  };
})();
