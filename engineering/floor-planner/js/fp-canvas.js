/**
 * AfroPlan Canvas Engine
 * Grid, zoom, pan, snap, rulers, undo/redo, hit-testing
 */
var FPCanvas = (function() {
  'use strict';

  // ── State ──
  var canvas, ctx, wrap;
  var rulerH, rulerHCtx, rulerV, rulerVCtx;
  var W = 0, H = 0;
  var offsetX = 0, offsetY = 0;
  var scale = 1;
  var gridSize = 0.25; // metres (25cm default)
  var PX_PER_M = 100; // base: 100px = 1 metre
  var snapEnabled = true;
  var isPanning = false, panStartX = 0, panStartY = 0;
  var undoStack = [], redoStack = [], MAX_UNDO = 50;
  var objects = []; // all drawable objects: walls, doors, windows, furniture, labels, dimensions
  var selectedIds = [];
  var hoveredId = null;
  var _listeners = {};
  var _animFrame = null;
  var units = 'm'; // 'm' or 'ft'
  var M_TO_FT = 3.28084;

  function init() {
    canvas = document.getElementById('fpCanvas');
    ctx = canvas.getContext('2d');
    wrap = document.getElementById('fpCanvasWrap');
    rulerH = document.getElementById('fpRulerH');
    rulerHCtx = rulerH.getContext('2d');
    rulerV = document.getElementById('fpRulerV');
    rulerVCtx = rulerV.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    // Touch events
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // Keyboard
    document.addEventListener('keydown', onKeyDown);

    // Zoom buttons
    var zi = document.getElementById('fpZoomIn');
    var zo = document.getElementById('fpZoomOut');
    var zf = document.getElementById('fpZoomFit');
    if (zi) zi.addEventListener('click', function() { zoomTo(scale * 1.25); });
    if (zo) zo.addEventListener('click', function() { zoomTo(scale / 1.25); });
    if (zf) zf.addEventListener('click', fitAll);

    // Center canvas
    offsetX = W / 2;
    offsetY = H / 2;

    requestRender();
  }

  function resize() {
    var rect = wrap.getBoundingClientRect();
    // Account for rulers on desktop
    var rW = window.innerWidth > 768 ? 24 : 0;
    var rH = window.innerWidth > 768 ? 24 : 0;
    W = rect.width - rW;
    H = rect.height - rH;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    if (window.innerWidth > 768) {
      rulerH.width = W * devicePixelRatio;
      rulerH.height = 24 * devicePixelRatio;
      rulerH.style.width = W + 'px';
      rulerHCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      rulerV.width = 24 * devicePixelRatio;
      rulerV.height = H * devicePixelRatio;
      rulerV.style.width = '24px';
      rulerV.style.height = H + 'px';
      rulerVCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    requestRender();
  }

  // ── Coordinate transforms ──
  function screenToWorld(sx, sy) {
    return {
      x: (sx - offsetX) / (scale * PX_PER_M),
      y: (sy - offsetY) / (scale * PX_PER_M)
    };
  }
  function worldToScreen(wx, wy) {
    return {
      x: wx * scale * PX_PER_M + offsetX,
      y: wy * scale * PX_PER_M + offsetY
    };
  }
  function snapToGrid(val) {
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  }
  function snapPoint(wx, wy) {
    return { x: snapToGrid(wx), y: snapToGrid(wy) };
  }

  // ── Units display ──
  function formatDim(metres) {
    if (units === 'ft') return (metres * M_TO_FT).toFixed(1) + ' ft';
    if (metres >= 1) return metres.toFixed(2) + ' m';
    return (metres * 100).toFixed(0) + ' cm';
  }
  function formatArea(sqm) {
    if (units === 'ft') return (sqm * M_TO_FT * M_TO_FT).toFixed(1) + ' sq ft';
    return sqm.toFixed(2) + ' m\u00B2';
  }

  // ── Rendering ──
  function requestRender() {
    if (_animFrame) return;
    _animFrame = requestAnimationFrame(function() {
      _animFrame = null;
      render();
    });
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawObjects();
    drawRulers();
  }

  function drawGrid() {
    var sPx = gridSize * scale * PX_PER_M;
    if (sPx < 5) return; // too small to draw
    ctx.save();
    ctx.strokeStyle = '#dde1e7';
    ctx.lineWidth = 0.5;

    // Minor grid
    var startX = offsetX % sPx;
    var startY = offsetY % sPx;
    ctx.beginPath();
    for (var x = startX; x < W; x += sPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (var y = startY; y < H; y += sPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Major grid (every 1m)
    var mPx = 1 * scale * PX_PER_M;
    if (mPx > 15) {
      ctx.strokeStyle = '#c5cbd3';
      ctx.lineWidth = 0.8;
      var msX = offsetX % mPx;
      var msY = offsetY % mPx;
      ctx.beginPath();
      for (var mx = msX; mx < W; mx += mPx) {
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, H);
      }
      for (var my = msY; my < H; my += mPx) {
        ctx.moveTo(0, my);
        ctx.lineTo(W, my);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObjects() {
    ctx.save();
    // Sort: rooms first, then walls, then doors/windows, then furniture, then labels/dimensions
    var sorted = objects.slice().sort(function(a, b) {
      var order = { room: 0, wall: 1, door: 2, window: 2, furniture: 3, label: 4, dimension: 5 };
      return (order[a.type] || 5) - (order[b.type] || 5);
    });
    for (var i = 0; i < sorted.length; i++) {
      var obj = sorted[i];
      if (obj._deleted) continue;
      var isSelected = selectedIds.indexOf(obj.id) >= 0;
      var isHovered = hoveredId === obj.id;
      drawObject(obj, isSelected, isHovered);
    }
    ctx.restore();
  }

  function drawObject(obj, isSelected, isHovered) {
    switch (obj.type) {
      case 'wall': drawWall(obj, isSelected, isHovered); break;
      case 'door': drawDoor(obj, isSelected, isHovered); break;
      case 'window': drawWindow(obj, isSelected, isHovered); break;
      case 'room': drawRoom(obj); break;
      case 'furniture': drawFurniture(obj, isSelected, isHovered); break;
      case 'label': drawLabel(obj, isSelected); break;
      case 'dimension': drawDimension(obj); break;
    }
  }

  function drawWall(wall, sel, hov) {
    var a = worldToScreen(wall.x1, wall.y1);
    var b = worldToScreen(wall.x2, wall.y2);
    var thick = wall.thickness * scale * PX_PER_M;
    ctx.save();
    ctx.lineWidth = Math.max(thick, 2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = sel ? '#007AFF' : hov ? '#3399ff' : '#2a3d55';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // Dimension on hover/select
    if (sel || hov) {
      var len = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillStyle = '#007AFF';
      ctx.textAlign = 'center';
      ctx.fillText(formatDim(len), mx, my - thick / 2 - 6);
    }
    ctx.restore();
  }

  function drawDoor(door, sel, hov) {
    var p = worldToScreen(door.x, door.y);
    var w = door.width * scale * PX_PER_M;
    var ang = door.angle || 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    // Door frame
    ctx.fillStyle = sel ? '#007AFF' : '#1a1a1a';
    ctx.fillRect(-w / 2, -3, w, 6);
    // Swing arc
    ctx.strokeStyle = sel ? '#007AFF' : hov ? '#3399ff' : '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(-w / 2, 0, w, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawWindow(win, sel, hov) {
    var p = worldToScreen(win.x, win.y);
    var w = win.width * scale * PX_PER_M;
    var ang = win.angle || 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.lineWidth = 2;
    ctx.strokeStyle = sel ? '#007AFF' : hov ? '#3399ff' : '#666';
    ctx.fillStyle = 'rgba(135,206,250,0.3)';
    ctx.fillRect(-w / 2, -4, w, 8);
    ctx.strokeRect(-w / 2, -4, w, 8);
    // Centre line
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoom(room) {
    if (!room.points || room.points.length < 3) return;
    ctx.save();
    ctx.beginPath();
    var p0 = worldToScreen(room.points[0].x, room.points[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (var i = 1; i < room.points.length; i++) {
      var p = worldToScreen(room.points[i].x, room.points[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = room.color || 'rgba(0,122,255,0.04)';
    ctx.fill();
    // Room label
    if (room.name) {
      var cx = 0, cy = 0;
      for (var j = 0; j < room.points.length; j++) {
        cx += room.points[j].x;
        cy += room.points[j].y;
      }
      cx /= room.points.length;
      cy /= room.points.length;
      var sc = worldToScreen(cx, cy);
      ctx.font = '600 12px DM Sans, sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, sc.x, sc.y - 6);
      if (room.area) {
        ctx.font = '400 11px JetBrains Mono, monospace';
        ctx.fillStyle = '#007AFF';
        ctx.fillText(formatArea(room.area), sc.x, sc.y + 10);
      }
    }
    ctx.restore();
  }

  function drawFurniture(furn, sel, hov) {
    var p = worldToScreen(furn.x, furn.y);
    var w = furn.w * scale * PX_PER_M;
    var h = furn.h * scale * PX_PER_M;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(furn.rotation || 0);
    ctx.fillStyle = sel ? 'rgba(0,122,255,0.15)' : hov ? 'rgba(0,122,255,0.08)' : 'rgba(100,116,139,0.1)';
    ctx.strokeStyle = sel ? '#007AFF' : hov ? '#3399ff' : '#94a3af';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    // SVG icon or label
    ctx.font = '500 10px DM Sans, sans-serif';
    ctx.fillStyle = sel ? '#007AFF' : '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = furn.label || furn.subtype || '';
    if (label.length > 10) label = label.substring(0, 9) + '..';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  function drawLabel(lbl, sel) {
    var p = worldToScreen(lbl.x, lbl.y);
    ctx.save();
    ctx.font = (sel ? '700' : '600') + ' 13px DM Sans, sans-serif';
    ctx.fillStyle = sel ? '#007AFF' : '#333';
    ctx.textAlign = 'center';
    ctx.fillText(lbl.text || 'Label', p.x, p.y);
    ctx.restore();
  }

  function drawDimension(dim) {
    var a = worldToScreen(dim.x1, dim.y1);
    var b = worldToScreen(dim.x2, dim.y2);
    var len = Math.sqrt(Math.pow(dim.x2 - dim.x1, 2) + Math.pow(dim.y2 - dim.y1, 2));
    ctx.save();
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Endpoints
    ctx.fillStyle = '#007AFF';
    ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    // Label
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = '500 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'center';
    ctx.fillText(formatDim(len), mx, my - 8);
    ctx.restore();
  }

  // ── Rulers ──
  function drawRulers() {
    if (window.innerWidth <= 768) return;
    // Horizontal
    rulerHCtx.clearRect(0, 0, W, 24);
    rulerHCtx.fillStyle = '#fafbfc';
    rulerHCtx.fillRect(0, 0, W, 24);
    rulerHCtx.strokeStyle = '#ccc';
    rulerHCtx.fillStyle = '#888';
    rulerHCtx.font = '10px JetBrains Mono, monospace';
    rulerHCtx.textAlign = 'center';
    var step = getTickStep();
    var startW = screenToWorld(0, 0).x;
    var endW = screenToWorld(W, 0).x;
    var tickStart = Math.floor(startW / step) * step;
    for (var t = tickStart; t < endW; t += step) {
      var sx = worldToScreen(t, 0).x;
      rulerHCtx.beginPath();
      rulerHCtx.moveTo(sx, 16);
      rulerHCtx.lineTo(sx, 24);
      rulerHCtx.stroke();
      var lbl = units === 'ft' ? (t * M_TO_FT).toFixed(0) : t.toFixed(1);
      if (t === 0) lbl = '0';
      rulerHCtx.fillText(lbl, sx, 12);
    }
    // Vertical
    rulerVCtx.clearRect(0, 0, 24, H);
    rulerVCtx.fillStyle = '#fafbfc';
    rulerVCtx.fillRect(0, 0, 24, H);
    rulerVCtx.strokeStyle = '#ccc';
    rulerVCtx.fillStyle = '#888';
    rulerVCtx.font = '10px JetBrains Mono, monospace';
    rulerVCtx.textAlign = 'right';
    var startVW = screenToWorld(0, 0).y;
    var endVW = screenToWorld(0, H).y;
    var vTickStart = Math.floor(startVW / step) * step;
    for (var tv = vTickStart; tv < endVW; tv += step) {
      var sy = worldToScreen(0, tv).y;
      rulerVCtx.beginPath();
      rulerVCtx.moveTo(16, sy);
      rulerVCtx.lineTo(24, sy);
      rulerVCtx.stroke();
      var vlbl = units === 'ft' ? (tv * M_TO_FT).toFixed(0) : tv.toFixed(1);
      if (tv === 0) vlbl = '0';
      rulerVCtx.fillText(vlbl, 14, sy + 3);
    }
  }

  function getTickStep() {
    var px = scale * PX_PER_M;
    if (px > 80) return 0.5;
    if (px > 30) return 1;
    if (px > 10) return 2;
    return 5;
  }

  // ── Mouse handling ──
  var _mouseBtn = -1;
  function getMousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e) {
    var pos = getMousePos(e);
    _mouseBtn = e.button;
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+click = pan
      isPanning = true;
      panStartX = pos.x - offsetX;
      panStartY = pos.y - offsetY;
      canvas.style.cursor = 'grabbing';
      return;
    }
    if (e.button === 0) {
      emit('canvasMouseDown', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: e.shiftKey, ctrl: e.ctrlKey });
    }
  }

  function onMouseMove(e) {
    var pos = getMousePos(e);
    if (isPanning) {
      offsetX = pos.x - panStartX;
      offsetY = pos.y - panStartY;
      requestRender();
      return;
    }
    emit('canvasMouseMove', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: e.shiftKey });
  }

  function onMouseUp(e) {
    var pos = getMousePos(e);
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'crosshair';
      return;
    }
    if (e.button === 0) {
      emit('canvasMouseUp', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: e.shiftKey });
    }
  }

  function onDblClick(e) {
    var pos = getMousePos(e);
    emit('canvasDblClick', { screen: pos, world: screenToWorld(pos.x, pos.y) });
  }

  function onWheel(e) {
    e.preventDefault();
    var pos = getMousePos(e);
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newScale = Math.min(10, Math.max(0.05, scale * delta));
    // Zoom toward cursor
    var wx = (pos.x - offsetX) / (scale * PX_PER_M);
    var wy = (pos.y - offsetY) / (scale * PX_PER_M);
    scale = newScale;
    offsetX = pos.x - wx * scale * PX_PER_M;
    offsetY = pos.y - wy * scale * PX_PER_M;
    updateZoomLabel();
    requestRender();
  }

  // ── Touch handling ──
  var _touches = [];
  var _pinchDist = 0;
  var _pinchScale = 1;

  function onTouchStart(e) {
    e.preventDefault();
    _touches = Array.from(e.touches);
    if (_touches.length === 2) {
      _pinchDist = getTouchDist(_touches);
      _pinchScale = scale;
    } else if (_touches.length === 1) {
      var t = _touches[0];
      var rect = canvas.getBoundingClientRect();
      var pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      emit('canvasMouseDown', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: false, ctrl: false });
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    var touches = Array.from(e.touches);
    if (touches.length === 2) {
      var dist = getTouchDist(touches);
      var ratio = dist / _pinchDist;
      var newScale = Math.min(10, Math.max(0.05, _pinchScale * ratio));
      // Find midpoint
      var rect = canvas.getBoundingClientRect();
      var mx = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      var my = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
      var wx = (mx - offsetX) / (scale * PX_PER_M);
      var wy = (my - offsetY) / (scale * PX_PER_M);
      scale = newScale;
      offsetX = mx - wx * scale * PX_PER_M;
      offsetY = my - wy * scale * PX_PER_M;
      updateZoomLabel();
      requestRender();
    } else if (touches.length === 1 && _touches.length === 1) {
      var rect2 = canvas.getBoundingClientRect();
      var pos = { x: touches[0].clientX - rect2.left, y: touches[0].clientY - rect2.top };
      emit('canvasMouseMove', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: false });
    }
    _touches = touches;
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0 && _touches.length === 1) {
      var rect = canvas.getBoundingClientRect();
      var t = _touches[0];
      var pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      emit('canvasMouseUp', { screen: pos, world: screenToWorld(pos.x, pos.y), shift: false });
    }
    _touches = Array.from(e.touches);
  }

  function getTouchDist(ts) {
    var dx = ts[0].clientX - ts[1].clientX;
    var dy = ts[0].clientY - ts[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Keyboard ──
  function onKeyDown(e) {
    // Don't capture when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey && e.key === 'c') { emit('copy'); return; }
    if (e.ctrlKey && e.key === 'v') { emit('paste'); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { emit('delete'); return; }
    if (e.key === 'Escape') { emit('escape'); return; }
    if (e.key === 'r' || e.key === 'R') { emit('rotate'); return; }
    emit('keypress', { key: e.key, shift: e.shiftKey });
  }

  // ── Zoom helpers ──
  function zoomTo(newScale) {
    var cx = W / 2, cy = H / 2;
    var wx = (cx - offsetX) / (scale * PX_PER_M);
    var wy = (cy - offsetY) / (scale * PX_PER_M);
    scale = Math.min(10, Math.max(0.05, newScale));
    offsetX = cx - wx * scale * PX_PER_M;
    offsetY = cy - wy * scale * PX_PER_M;
    updateZoomLabel();
    requestRender();
  }

  function fitAll() {
    if (objects.length === 0) { zoomTo(1); return; }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach(function(o) {
      if (o._deleted) return;
      var bounds = getObjBounds(o);
      if (bounds.x1 < minX) minX = bounds.x1;
      if (bounds.y1 < minY) minY = bounds.y1;
      if (bounds.x2 > maxX) maxX = bounds.x2;
      if (bounds.y2 > maxY) maxY = bounds.y2;
    });
    if (minX === Infinity) { zoomTo(1); return; }
    var pw = maxX - minX, ph = maxY - minY;
    if (pw < 0.1) pw = 10;
    if (ph < 0.1) ph = 10;
    var sx = (W - 80) / (pw * PX_PER_M);
    var sy = (H - 80) / (ph * PX_PER_M);
    scale = Math.min(sx, sy, 5);
    offsetX = W / 2 - ((minX + maxX) / 2) * scale * PX_PER_M;
    offsetY = H / 2 - ((minY + maxY) / 2) * scale * PX_PER_M;
    updateZoomLabel();
    requestRender();
  }

  function updateZoomLabel() {
    var el = document.getElementById('fpZoomLevel');
    if (el) el.textContent = Math.round(scale * 100) + '%';
  }

  // ── Object bounds ──
  function getObjBounds(o) {
    switch (o.type) {
      case 'wall':
        return { x1: Math.min(o.x1, o.x2), y1: Math.min(o.y1, o.y2), x2: Math.max(o.x1, o.x2), y2: Math.max(o.y1, o.y2) };
      case 'door': case 'window':
        return { x1: o.x - o.width / 2, y1: o.y - 0.1, x2: o.x + o.width / 2, y2: o.y + 0.1 };
      case 'furniture':
        return { x1: o.x - o.w / 2, y1: o.y - o.h / 2, x2: o.x + o.w / 2, y2: o.y + o.h / 2 };
      case 'room':
        if (!o.points || !o.points.length) return { x1: 0, y1: 0, x2: 0, y2: 0 };
        var rx1 = Infinity, ry1 = Infinity, rx2 = -Infinity, ry2 = -Infinity;
        o.points.forEach(function(p) { if (p.x < rx1) rx1 = p.x; if (p.y < ry1) ry1 = p.y; if (p.x > rx2) rx2 = p.x; if (p.y > ry2) ry2 = p.y; });
        return { x1: rx1, y1: ry1, x2: rx2, y2: ry2 };
      case 'label':
        return { x1: o.x - 1, y1: o.y - 0.5, x2: o.x + 1, y2: o.y + 0.5 };
      case 'dimension':
        return { x1: Math.min(o.x1, o.x2), y1: Math.min(o.y1, o.y2), x2: Math.max(o.x1, o.x2), y2: Math.max(o.y1, o.y2) };
      default:
        return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }
  }

  // ── Hit testing ──
  function hitTest(wx, wy, tolerance) {
    tolerance = tolerance || 0.15;
    for (var i = objects.length - 1; i >= 0; i--) {
      var o = objects[i];
      if (o._deleted) continue;
      if (hitObject(o, wx, wy, tolerance)) return o;
    }
    return null;
  }

  function hitObject(o, wx, wy, tol) {
    switch (o.type) {
      case 'wall':
        return pointToSegmentDist(wx, wy, o.x1, o.y1, o.x2, o.y2) < (o.thickness / 2 + tol);
      case 'door': case 'window':
        return Math.abs(wx - o.x) < o.width / 2 + tol && Math.abs(wy - o.y) < tol + 0.1;
      case 'furniture':
        return Math.abs(wx - o.x) < o.w / 2 + tol && Math.abs(wy - o.y) < o.h / 2 + tol;
      case 'label':
        return Math.abs(wx - o.x) < 1 + tol && Math.abs(wy - o.y) < 0.5 + tol;
      default:
        return false;
    }
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    var nx = x1 + t * dx, ny = y1 + t * dy;
    return Math.sqrt((px - nx) * (px - nx) + (py - ny) * (py - ny));
  }

  // ── Undo / Redo ──
  function pushUndo() {
    var snapshot = JSON.stringify(objects.filter(function(o) { return !o._deleted; }));
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    updateUndoButtons();
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(objects.filter(function(o) { return !o._deleted; })));
    var snapshot = JSON.parse(undoStack.pop());
    objects = snapshot;
    selectedIds = [];
    hoveredId = null;
    updateUndoButtons();
    requestRender();
    emit('objectsChanged');
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(objects.filter(function(o) { return !o._deleted; })));
    var snapshot = JSON.parse(redoStack.pop());
    objects = snapshot;
    selectedIds = [];
    hoveredId = null;
    updateUndoButtons();
    requestRender();
    emit('objectsChanged');
  }

  function updateUndoButtons() {
    var u = document.getElementById('fpUndo');
    var r = document.getElementById('fpRedo');
    if (u) u.disabled = undoStack.length === 0;
    if (r) r.disabled = redoStack.length === 0;
  }

  // ── Event system ──
  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }
  function emit(event, data) {
    var fns = _listeners[event];
    if (fns) fns.forEach(function(fn) { fn(data); });
  }

  // ── Object management ──
  var _nextId = 1;
  function addObject(obj) {
    obj.id = _nextId++;
    objects.push(obj);
    return obj;
  }
  function removeObject(id) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].id === id) { objects[i]._deleted = true; break; }
    }
  }
  function getObject(id) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].id === id && !objects[i]._deleted) return objects[i];
    }
    return null;
  }
  function getObjects(type) {
    return objects.filter(function(o) { return !o._deleted && (!type || o.type === type); });
  }
  function clearAll() {
    objects = [];
    selectedIds = [];
    hoveredId = null;
    _nextId = 1;
    undoStack = [];
    redoStack = [];
    updateUndoButtons();
    requestRender();
  }
  function setObjects(arr) {
    objects = arr;
    _nextId = 1;
    objects.forEach(function(o) { if (o.id >= _nextId) _nextId = o.id + 1; });
    selectedIds = [];
    hoveredId = null;
    requestRender();
  }

  // ── Selection ──
  function select(ids) {
    selectedIds = Array.isArray(ids) ? ids : [ids];
    requestRender();
    emit('selectionChanged', selectedIds);
  }
  function deselect() {
    selectedIds = [];
    hoveredId = null;
    requestRender();
    emit('selectionChanged', []);
  }

  // ── Public API ──
  return {
    init: init,
    resize: resize,
    render: requestRender,
    screenToWorld: screenToWorld,
    worldToScreen: worldToScreen,
    snapPoint: snapPoint,
    snapToGrid: snapToGrid,
    formatDim: formatDim,
    formatArea: formatArea,
    hitTest: hitTest,
    addObject: addObject,
    removeObject: removeObject,
    getObject: getObject,
    getObjects: getObjects,
    clearAll: clearAll,
    setObjects: setObjects,
    pushUndo: pushUndo,
    undo: undo,
    redo: redo,
    select: select,
    deselect: deselect,
    fitAll: fitAll,
    on: on,
    emit: emit,
    getObjBounds: getObjBounds,
    get scale() { return scale; },
    get offsetX() { return offsetX; },
    get offsetY() { return offsetY; },
    get selectedIds() { return selectedIds; },
    set units(u) { units = u; requestRender(); },
    get units() { return units; },
    set gridSize(g) { gridSize = g; requestRender(); },
    get gridSize() { return gridSize; },
    set snapEnabled(v) { snapEnabled = v; },
    get snapEnabled() { return snapEnabled; },
    PX_PER_M: PX_PER_M
  };
})();
