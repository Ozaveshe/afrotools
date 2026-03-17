/**
 * AfroPlan Wall Drawing + Room Detection
 * Click-to-place walls, auto-join, room detection, doors/windows
 */
var FPWalls = (function() {
  'use strict';

  var isDrawing = false;
  var wallStart = null;
  var previewEnd = null;
  var defaultThickness = 0.15; // 150mm = 6-inch block
  var wallMaterial = 'block'; // block, brick, drywall

  // Room colours
  var ROOM_COLORS = {
    'Parlour': 'rgba(59,130,246,0.06)', 'Sitting Room': 'rgba(59,130,246,0.06)',
    'Living Room': 'rgba(59,130,246,0.06)', 'Dining': 'rgba(245,166,35,0.06)',
    'Kitchen': 'rgba(239,68,68,0.06)', 'Backyard Kitchen': 'rgba(239,68,68,0.06)',
    'Master Bedroom': 'rgba(139,92,246,0.06)', 'Bedroom': 'rgba(168,85,247,0.05)',
    'Bathroom': 'rgba(6,182,212,0.08)', 'Toilet': 'rgba(6,182,212,0.06)',
    'Shower': 'rgba(6,182,212,0.06)', 'Store': 'rgba(100,116,139,0.06)',
    'Garage': 'rgba(100,116,139,0.08)', 'Security Post': 'rgba(245,158,11,0.08)',
    'Generator Room': 'rgba(220,38,38,0.06)', 'BQ': 'rgba(139,92,246,0.05)',
    'Verandah': 'rgba(34,197,94,0.05)', 'Corridor': 'rgba(148,163,175,0.04)',
    'Balcony': 'rgba(34,197,94,0.06)', 'Terrace': 'rgba(34,197,94,0.06)',
    'Office': 'rgba(99,102,241,0.06)', 'default': 'rgba(0,122,255,0.04)'
  };

  var ROOM_SUGGESTIONS = [
    'Parlour', 'Sitting Room', 'Living Room', 'Dining', 'Kitchen',
    'Backyard Kitchen', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4',
    "Boys' Quarter (BQ)", 'Bathroom', 'Toilet', 'Shower', 'Store', 'Pantry',
    'Garage', 'Car Park', 'Security Post', 'Generator Room', 'Borehole House',
    'Verandah', 'Corridor', 'Balcony', 'Terrace', 'Office', 'Laundry'
  ];

  function init() {
    // Listen for canvas events when wall tool is active
    FPCanvas.on('canvasMouseDown', onMouseDown);
    FPCanvas.on('canvasMouseMove', onMouseMove);
    FPCanvas.on('canvasDblClick', onDblClick);
    FPCanvas.on('escape', function() {
      if (isDrawing) { isDrawing = false; wallStart = null; previewEnd = null; FPCanvas.render(); }
    });
  }

  function onMouseDown(e) {
    if (FPApp && FPApp.currentTool !== 'wall') return;
    var snap = FPCanvas.snapPoint(e.world.x, e.world.y);
    // Snap to existing wall endpoints
    var nearest = findNearestEndpoint(snap.x, snap.y, 0.2);
    if (nearest) { snap.x = nearest.x; snap.y = nearest.y; }

    if (!isDrawing) {
      isDrawing = true;
      wallStart = { x: snap.x, y: snap.y };
    } else {
      // Angle constraint
      var endPt = constrainAngle(wallStart, snap);
      nearest = findNearestEndpoint(endPt.x, endPt.y, 0.2);
      if (nearest) { endPt.x = nearest.x; endPt.y = nearest.y; }

      FPCanvas.pushUndo();
      FPCanvas.addObject({
        type: 'wall',
        x1: wallStart.x, y1: wallStart.y,
        x2: endPt.x, y2: endPt.y,
        thickness: defaultThickness,
        material: wallMaterial
      });
      // Continue chain — new wall starts from previous end
      wallStart = { x: endPt.x, y: endPt.y };
      detectRooms();
      FPCanvas.render();
      FPCanvas.emit('objectsChanged');
    }
  }

  function onMouseMove(e) {
    if (!isDrawing || (FPApp && FPApp.currentTool !== 'wall')) return;
    var snap = FPCanvas.snapPoint(e.world.x, e.world.y);
    previewEnd = constrainAngle(wallStart, snap);
    drawPreview();
  }

  function onDblClick() {
    if (isDrawing) {
      isDrawing = false;
      wallStart = null;
      previewEnd = null;
      FPCanvas.render();
    }
  }

  function constrainAngle(start, end) {
    var dx = end.x - start.x;
    var dy = end.y - start.y;
    var angle = Math.atan2(dy, dx);
    var len = Math.sqrt(dx * dx + dy * dy);
    // Snap to 90/45 degree increments
    var snapAngles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4];
    var closest = snapAngles[0], minDiff = Math.abs(angle - snapAngles[0]);
    for (var i = 1; i < snapAngles.length; i++) {
      var diff = Math.abs(angle - snapAngles[i]);
      if (diff < minDiff) { minDiff = diff; closest = snapAngles[i]; }
    }
    // Only snap if within 10 degrees
    if (minDiff < Math.PI / 18) {
      return {
        x: FPCanvas.snapToGrid(start.x + len * Math.cos(closest)),
        y: FPCanvas.snapToGrid(start.y + len * Math.sin(closest))
      };
    }
    return end;
  }

  function findNearestEndpoint(x, y, tol) {
    var walls = FPCanvas.getObjects('wall');
    var best = null, bestDist = tol;
    walls.forEach(function(w) {
      var d1 = Math.sqrt(Math.pow(w.x1 - x, 2) + Math.pow(w.y1 - y, 2));
      var d2 = Math.sqrt(Math.pow(w.x2 - x, 2) + Math.pow(w.y2 - y, 2));
      if (d1 < bestDist) { bestDist = d1; best = { x: w.x1, y: w.y1 }; }
      if (d2 < bestDist) { bestDist = d2; best = { x: w.x2, y: w.y2 }; }
    });
    return best;
  }

  function drawPreview() {
    FPCanvas.render();
    if (!wallStart || !previewEnd) return;
    var canvas = document.getElementById('fpCanvas');
    var ctx = canvas.getContext('2d');
    var a = FPCanvas.worldToScreen(wallStart.x, wallStart.y);
    var b = FPCanvas.worldToScreen(previewEnd.x, previewEnd.y);
    ctx.save();
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = defaultThickness * FPCanvas.scale * FPCanvas.PX_PER_M;
    ctx.setLineDash([6, 4]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Length label
    var len = Math.sqrt(Math.pow(previewEnd.x - wallStart.x, 2) + Math.pow(previewEnd.y - wallStart.y, 2));
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = '600 12px JetBrains Mono, monospace';
    ctx.fillStyle = '#007AFF';
    ctx.textAlign = 'center';
    ctx.fillText(FPCanvas.formatDim(len), mx, my - 12);
    ctx.restore();
  }

  // ── Room detection ──
  function detectRooms() {
    var walls = FPCanvas.getObjects('wall');
    if (walls.length < 3) return;

    // Build graph of wall endpoints
    var eps = 0.05; // tolerance for matching endpoints
    var nodes = []; // unique points
    var edges = []; // wall connections

    function findNode(x, y) {
      for (var i = 0; i < nodes.length; i++) {
        if (Math.abs(nodes[i].x - x) < eps && Math.abs(nodes[i].y - y) < eps) return i;
      }
      nodes.push({ x: x, y: y });
      return nodes.length - 1;
    }

    walls.forEach(function(w) {
      var a = findNode(w.x1, w.y1);
      var b = findNode(w.x2, w.y2);
      if (a !== b) {
        edges.push({ a: a, b: b });
      }
    });

    // Build adjacency
    var adj = {};
    edges.forEach(function(e) {
      if (!adj[e.a]) adj[e.a] = [];
      if (!adj[e.b]) adj[e.b] = [];
      adj[e.a].push(e.b);
      adj[e.b].push(e.a);
    });

    // Find simple cycles (rooms) using minimum cycle detection
    var existingRooms = FPCanvas.getObjects('room');
    var existingNames = {};
    existingRooms.forEach(function(r) { if (r.name) existingNames[r._cycleKey] = r.name; });

    // Remove old auto-detected rooms
    existingRooms.forEach(function(r) {
      if (r.autoDetected) FPCanvas.removeObject(r.id);
    });

    var cycles = findMinCycles(nodes, adj);
    cycles.forEach(function(cycle) {
      var points = cycle.map(function(idx) { return { x: nodes[idx].x, y: nodes[idx].y }; });
      var area = polygonArea(points);
      if (area < 0.5) return; // too small
      var key = cycle.sort().join(',');
      var color = ROOM_COLORS['default'];
      var name = existingNames[key] || '';
      if (name) {
        for (var k in ROOM_COLORS) {
          if (name.indexOf(k) >= 0) { color = ROOM_COLORS[k]; break; }
        }
      }
      FPCanvas.addObject({
        type: 'room',
        points: points,
        area: area,
        name: name,
        color: color,
        autoDetected: true,
        _cycleKey: key
      });
    });
  }

  function findMinCycles(nodes, adj) {
    // Simple approach: find all triangles and quads (most rooms are rectangular)
    var cycles = [];
    var visited = {};

    for (var n = 0; n < nodes.length; n++) {
      var neighbors = adj[n] || [];
      for (var i = 0; i < neighbors.length; i++) {
        for (var j = i + 1; j < neighbors.length; j++) {
          var a = neighbors[i], b = neighbors[j];
          // Check if a and b are connected (triangle)
          if (adj[a] && adj[a].indexOf(b) >= 0) {
            var key = [n, a, b].sort().join(',');
            if (!visited[key]) { visited[key] = true; cycles.push([n, a, b]); }
          }
          // Check for quads: n -> a -> ? -> b -> n
          if (adj[a]) {
            for (var k = 0; k < adj[a].length; k++) {
              var c = adj[a][k];
              if (c === n || c === b) continue;
              if (adj[c] && adj[c].indexOf(b) >= 0) {
                var key4 = [n, a, c, b].sort().join(',');
                if (!visited[key4]) { visited[key4] = true; cycles.push([n, a, c, b]); }
              }
            }
          }
        }
      }
    }
    return cycles;
  }

  function polygonArea(pts) {
    var area = 0;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      area += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
    }
    return Math.abs(area / 2);
  }

  function setRoomName(roomId, name) {
    var room = FPCanvas.getObject(roomId);
    if (!room) return;
    room.name = name;
    for (var k in ROOM_COLORS) {
      if (name.indexOf(k) >= 0) { room.color = ROOM_COLORS[k]; break; }
    }
    FPCanvas.render();
  }

  return {
    init: init,
    detectRooms: detectRooms,
    setRoomName: setRoomName,
    ROOM_SUGGESTIONS: ROOM_SUGGESTIONS,
    ROOM_COLORS: ROOM_COLORS,
    get isDrawing() { return isDrawing; },
    get defaultThickness() { return defaultThickness; },
    set defaultThickness(v) { defaultThickness = v; },
    get wallMaterial() { return wallMaterial; },
    set wallMaterial(v) { wallMaterial = v; }
  };
})();
