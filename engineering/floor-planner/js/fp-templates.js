/**
 * FPTemplates — Pre-built floor plan templates for AfroPlan Floor Planner
 * All coordinates in METRES. Origin (0,0) = top-left corner of building footprint.
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Colour palette
  // ---------------------------------------------------------------------------
  var COLORS = {
    parlour:    'rgba(59,130,246,0.06)',
    kitchen:    'rgba(239,68,68,0.06)',
    bedroom:    'rgba(168,85,247,0.05)',
    masterBed:  'rgba(139,92,246,0.06)',
    bathroom:   'rgba(6,182,212,0.06)',
    store:      'rgba(100,116,139,0.06)',
    corridor:   'rgba(148,163,175,0.04)',
    verandah:   'rgba(34,197,94,0.05)',
    garage:     'rgba(100,116,139,0.08)',
    security:   'rgba(245,158,11,0.08)',
    bq:         'rgba(139,92,246,0.05)',
    generator:  'rgba(220,38,38,0.06)',
    office:     'rgba(99,102,241,0.06)',
    dining:     'rgba(59,130,246,0.06)',
    living:     'rgba(59,130,246,0.06)',
    shop:       'rgba(99,102,241,0.06)'
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function wall(x1, y1, x2, y2, material) {
    return { type: 'wall', x1: x1, y1: y1, x2: x2, y2: y2, thickness: 0.15, material: material || 'block' };
  }

  function door(x, y, angle, subtype) {
    return { type: 'door', x: x, y: y, width: 0.9, angle: angle || 0, subtype: subtype || 'single' };
  }

  function win(x, y, angle, subtype, width) {
    return { type: 'window', x: x, y: y, width: width || 1.2, angle: angle || 0, subtype: subtype || 'double' };
  }

  function room(name, points, area, color) {
    return { type: 'room', name: name, points: points, area: area, color: color };
  }

  function furniture(label, subtype, x, y, w, h, rotation) {
    return { type: 'furniture', label: label, subtype: subtype, x: x, y: y, w: w, h: h, rotation: rotation || 0 };
  }

  function rect(x, y, w, h) {
    return [{ x: x, y: y }, { x: x + w, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }];
  }

  // Box of walls (clockwise from top-left)
  function boxWalls(x, y, w, h, material) {
    return [
      wall(x,     y,     x + w, y,     material),
      wall(x + w, y,     x + w, y + h, material),
      wall(x + w, y + h, x,     y + h, material),
      wall(x,     y + h, x,     y,     material)
    ];
  }

  // ---------------------------------------------------------------------------
  // TEMPLATES
  // ---------------------------------------------------------------------------
  var TEMPLATES = [

    // -------------------------------------------------------------------------
    // 1. ng-2bed-bungalow — 2 Bedroom Bungalow
    // -------------------------------------------------------------------------
    {
      key:     'ng-2bed-bungalow',
      name:    '2 Bedroom Bungalow',
      country: 'Nigeria',
      desc:    'Classic Nigerian 2-bedroom bungalow on a 60×120 ft plot. Parlour, dining, kitchen, 2 bedrooms, bathroom and front verandah.',
      rooms:   5,
      area:    80,
      build: function () {
        // Building envelope: 10 wide × 8 deep, verandah 10×1.5 at front (y < 0)
        var items = [];

        // -- Outer walls --
        // Main block 0,0 to 10,8
        items = items.concat(boxWalls(0, 0, 10, 8));

        // Verandah 0,-1.5 to 10,0
        items = items.concat(boxWalls(0, -1.5, 10, 1.5));

        // -- Internal walls --
        // Horizontal divider splitting front (parlour/dining) from rear (beds/kitchen) at y=3.8
        items.push(wall(0, 3.8, 10, 3.8));
        // Vertical: parlour | dining at x=5.5
        items.push(wall(5.5, 0, 5.5, 3.8));
        // Vertical: bed1 | bed2 at x=5 from y=3.8 to y=8
        items.push(wall(5, 3.8, 5, 8));
        // Vertical: kitchen | bedroom corridor at x=7.5 from y=3.8 to y=8
        items.push(wall(7.5, 3.8, 7.5, 8));
        // Bathroom wall inside kitchen zone y=3.8 to y=6 at x=7.5 (already done); horizontal at y=6 from 7.5 to 10
        items.push(wall(7.5, 6, 10, 6));

        // -- Doors --
        // Front entrance verandah → parlour at x≈1.5, y=0
        items.push(door(1.5, 0, 0));
        // Parlour → dining (internal opening, no door needed — open arch) — skip or use door
        items.push(door(5.5, 1.5, 90));
        // Parlour/dining → rear corridor at y=3.8
        items.push(door(2.5, 3.8, 0));
        items.push(door(6.8, 3.8, 0));
        // Bed 1 door (left side, open into bed from corridor)
        items.push(door(0.9, 5.5, 270));
        // Bed 2 door
        items.push(door(5.9, 5.5, 270));
        // Kitchen door
        items.push(door(7.9, 3.8, 0));
        // Bathroom door at x=8.5, y=6
        items.push(door(8.5, 6, 0));

        // -- Windows --
        // Front verandah wall (y=-1.5) — decorative pillars, no windows
        // Parlour front wall y=0
        items.push(win(2.5, 0, 0));
        // Dining front wall y=0
        items.push(win(7, 0, 0));
        // Bed1 rear wall y=8
        items.push(win(2, 8, 0));
        // Bed2 rear wall y=8
        items.push(win(6.2, 8, 0));
        // Kitchen side wall x=10
        items.push(win(10, 5, 90));
        // Bed1 side wall x=0
        items.push(win(0, 5.5, 90));

        // -- Rooms --
        items.push(room('Verandah', rect(0, -1.5, 10, 1.5), 15, COLORS.verandah));
        items.push(room('Parlour', rect(0, 0, 5.5, 3.8), 20.9, COLORS.parlour));
        items.push(room('Dining', rect(5.5, 0, 4.5, 3.8), 17.1, COLORS.dining));
        items.push(room('Bedroom 1', rect(0, 3.8, 5, 4.2), 21, COLORS.bedroom));
        items.push(room('Bedroom 2', rect(5, 3.8, 2.5, 4.2), 10.5, COLORS.bedroom));
        items.push(room('Kitchen', rect(7.5, 3.8, 2.5, 2.2), 5.5, COLORS.kitchen));
        items.push(room('Bathroom', rect(7.5, 6, 2.5, 2), 5, COLORS.bathroom));

        // -- Furniture --
        // Parlour: sofa set
        items.push(furniture('Sofa', 'sofa', 0.5, 0.4, 2.5, 0.8));
        items.push(furniture('Sofa', 'sofa', 0.5, 1.4, 0.8, 1.5));
        items.push(furniture('Coffee Table', 'table', 1.5, 1.2, 1, 0.6));
        items.push(furniture('TV Stand', 'cabinet', 3.5, 0.2, 1.5, 0.4));
        // Dining: table + chairs
        items.push(furniture('Dining Table', 'table', 6, 0.8, 2, 1.2));
        // Bed 1
        items.push(furniture('Bed', 'bed', 1, 4.5, 1.8, 2.0));
        items.push(furniture('Wardrobe', 'wardrobe', 3.5, 4.0, 1.2, 0.6));
        // Bed 2
        items.push(furniture('Bed', 'bed', 5.2, 4.8, 1.6, 1.8));
        // Kitchen
        items.push(furniture('Cooker', 'cooker', 7.7, 4.0, 0.6, 0.6));
        items.push(furniture('Sink', 'sink', 8.6, 4.0, 0.6, 0.5));
        // Bathroom
        items.push(furniture('Toilet', 'toilet', 7.7, 6.2, 0.5, 0.7));
        items.push(furniture('Bath', 'bathtub', 8.5, 6.2, 0.8, 1.5));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 2. ng-3bed-bq — 3 Bedroom Bungalow with BQ
    // -------------------------------------------------------------------------
    {
      key:     'ng-3bed-bq',
      name:    '3 Bedroom Bungalow with BQ',
      country: 'Nigeria',
      desc:    'Generous 3-bedroom bungalow with separate Boys\u2019 Quarters at rear. Parlour, dining, kitchen, 3 bedrooms, 2 bathrooms, corridor.',
      rooms:   8,
      area:    120,
      build: function () {
        var items = [];

        // Main house: 12 wide × 9 deep, origin 0,0
        items = items.concat(boxWalls(0, 0, 12, 9));

        // Internal walls
        // Central corridor horizontal band y=4 to y=5.2 full width → walls at y=4 and y=5.2
        items.push(wall(0, 4, 12, 4));
        items.push(wall(0, 5.2, 12, 5.2));
        // Front: parlour | dining split at x=6
        items.push(wall(6, 0, 6, 4));
        // Rear: bed1 | bed2 split at x=4.5 from y=5.2 to y=9
        items.push(wall(4.5, 5.2, 4.5, 9));
        // Rear: bed2 | bed3/bath split at x=8.5 from y=5.2 to y=9
        items.push(wall(8.5, 5.2, 8.5, 9));
        // Bathroom 1 in bed3 zone at x=8.5 to 12, y=5.2 to 7 (bath horizontal wall)
        items.push(wall(8.5, 7, 12, 7));
        // Kitchen partition front right: x=8 from y=0 to y=4
        items.push(wall(8, 0, 8, 4));
        // Store inside kitchen zone: y=2 from x=8 to x=12
        items.push(wall(8, 2, 12, 2));

        // Doors
        items.push(door(2, 0, 0));          // front entrance → parlour
        items.push(door(9, 0, 0));          // dining/kitchen side entrance
        items.push(door(3, 4, 0));          // parlour → corridor
        items.push(door(7, 4, 0));          // dining → corridor
        items.push(door(10, 4, 0));         // kitchen → corridor
        items.push(door(2, 5.2, 0));        // corridor → bed1
        items.push(door(6, 5.2, 0));        // corridor → bed2
        items.push(door(10, 5.2, 0));       // corridor → bed3/bath zone
        items.push(door(9.5, 7, 0));        // bed3 → bathroom
        items.push(door(0.5, 6.5, 270));    // bed1 → ensuite (small bath — omit partition for simplicity)

        // Windows
        items.push(win(2.5, 0, 0));         // parlour front
        items.push(win(7, 0, 0));           // dining front
        items.push(win(10, 0, 0));          // kitchen front
        items.push(win(0, 6.5, 90));        // bed1 left
        items.push(win(2, 9, 0));           // bed1 rear
        items.push(win(6, 9, 0));           // bed2 rear
        items.push(win(10, 9, 0));          // bed3 rear
        items.push(win(12, 6, 90));         // bath right

        // Rooms (main house)
        items.push(room('Parlour',   rect(0, 0, 6, 4),      24,   COLORS.parlour));
        items.push(room('Dining',    rect(6, 0, 2, 4),      8,    COLORS.dining));
        items.push(room('Kitchen',   rect(8, 2, 4, 2),      8,    COLORS.kitchen));
        items.push(room('Store',     rect(8, 0, 4, 2),      8,    COLORS.store));
        items.push(room('Corridor',  rect(0, 4, 12, 1.2),   14.4, COLORS.corridor));
        items.push(room('Bedroom 1', rect(0, 5.2, 4.5, 3.8), 17.1, COLORS.bedroom));
        items.push(room('Bedroom 2', rect(4.5, 5.2, 4, 3.8), 15.2, COLORS.bedroom));
        items.push(room('Bedroom 3', rect(8.5, 5.2, 3.5, 1.8), 6.3, COLORS.bedroom));
        items.push(room('Bathroom 1', rect(8.5, 7, 3.5, 2), 7,   COLORS.bathroom));

        // BQ block: 4 wide × 5 deep, placed at x=14 (2m gap from main), y=2
        var bx = 14, by = 2;
        items = items.concat(boxWalls(bx, by, 4, 5));
        items.push(wall(bx, by + 3, bx + 4, by + 3));     // BQ room | toilet split
        items.push(wall(bx + 2.5, by + 3, bx + 2.5, by + 5)); // toilet width
        items.push(door(bx + 1, by, 0));                   // BQ entrance
        items.push(door(bx + 1, by + 3, 0));               // BQ toilet door
        items.push(win(bx + 2.5, by, 0, 'single', 0.9));   // BQ front window
        items.push(win(bx + 4, by + 1.5, 90, 'single', 0.9));
        items.push(room('BQ Room',   rect(bx, by, 4, 3),   12,  COLORS.bq));
        items.push(room('BQ Toilet', rect(bx, by + 3, 2.5, 2), 5, COLORS.bathroom));
        items.push(furniture('Bed',      'bed',      bx + 0.3, by + 0.5, 1.5, 1.8));
        items.push(furniture('Wardrobe', 'wardrobe', bx + 2.8, by + 0.3, 0.9, 0.5));

        // Main furniture
        items.push(furniture('Sofa',         'sofa',    0.4, 0.5, 3, 0.8));
        items.push(furniture('TV Stand',     'cabinet', 4.5, 0.2, 1.2, 0.4));
        items.push(furniture('Dining Table', 'table',   6.2, 0.8, 1.4, 1.2));
        items.push(furniture('Bed',          'bed',     0.3, 5.8, 1.8, 2.0));
        items.push(furniture('Bed',          'bed',     5.0, 5.8, 1.8, 2.0));
        items.push(furniture('Bed',          'bed',     8.7, 5.4, 1.6, 1.4));
        items.push(furniture('Cooker',       'cooker',  8.2, 2.5, 0.6, 0.6));
        items.push(furniture('Sink',         'sink',    9.0, 2.5, 0.6, 0.5));
        items.push(furniture('Toilet',       'toilet',  8.7, 7.2, 0.5, 0.7));
        items.push(furniture('Bath',         'bathtub', 9.5, 7.2, 0.8, 1.4));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 3. ng-4bed-duplex — 4 Bedroom Duplex (Ground Floor)
    // -------------------------------------------------------------------------
    {
      key:     'ng-4bed-duplex',
      name:    '4 Bedroom Duplex (Ground Floor)',
      country: 'Nigeria',
      desc:    'Ground floor of a 4-bedroom duplex. 14×10 m. Parlour, dining, kitchen, guest toilet, store, and staircase to upper floor.',
      rooms:   6,
      area:    140,
      build: function () {
        var items = [];

        // Envelope 14 × 10
        items = items.concat(boxWalls(0, 0, 14, 10));

        // Front verandah 14 × 1.5 at y=-1.5
        items = items.concat(boxWalls(0, -1.5, 14, 1.5));

        // Internal walls
        // Parlour | dining vertical at x=7 from y=0 to y=6
        items.push(wall(7, 0, 7, 6));
        // Dining | kitchen vertical at x=10.5 from y=0 to y=6
        items.push(wall(10.5, 0, 10.5, 6));
        // Horizontal at y=6 full width (separates front rooms from service zone)
        items.push(wall(0, 6, 14, 6));
        // Staircase box x=10.5 to 14, y=6 to 10
        items.push(wall(10.5, 6, 10.5, 10));
        // Guest toilet x=0 to 3, y=6 to 10
        items.push(wall(3, 6, 3, 10));
        // Store x=3 to 6.5, y=6 to 10, horizontal split at y=8
        items.push(wall(6.5, 6, 6.5, 10));
        items.push(wall(3, 8, 6.5, 8));

        // Doors
        items.push(door(3.5, 0, 0));        // main entrance → parlour
        items.push(door(7, 2.5, 90));       // parlour → dining (internal arch)
        items.push(door(10.5, 2, 90));      // dining → kitchen
        items.push(door(13, 0, 0));         // kitchen side door
        items.push(door(1.5, 6, 0));        // parlour → guest toilet zone
        items.push(door(5, 6, 0));          // to store
        items.push(door(9, 6, 0));          // to utility/stair lobby
        items.push(door(0.5, 7, 270));      // guest toilet entry
        items.push(door(4, 8, 0));          // inner store 2

        // Windows
        items.push(win(2.5, 0, 0));         // parlour front
        items.push(win(8.5, 0, 0));         // dining front
        items.push(win(12, 0, 0));          // kitchen front
        items.push(win(0, 3, 90));          // parlour left
        items.push(win(14, 2, 90));         // kitchen right
        items.push(win(14, 8, 90));         // stairs right
        items.push(win(0, 8, 90));          // toilet left

        // Rooms
        items.push(room('Verandah',    rect(0, -1.5, 14, 1.5),  21,   COLORS.verandah));
        items.push(room('Parlour',     rect(0, 0, 7, 6),         42,   COLORS.parlour));
        items.push(room('Dining',      rect(7, 0, 3.5, 6),       21,   COLORS.dining));
        items.push(room('Kitchen',     rect(10.5, 0, 3.5, 6),    21,   COLORS.kitchen));
        items.push(room('Guest Toilet',rect(0, 6, 3, 4),         12,   COLORS.bathroom));
        items.push(room('Store',       rect(3, 6, 3.5, 2),       7,    COLORS.store));
        items.push(room('Store 2',     rect(3, 8, 3.5, 2),       7,    COLORS.store));
        items.push(room('Utility/Stair', rect(6.5, 6, 4, 4),    16,   COLORS.corridor));
        items.push(room('Staircase',   rect(10.5, 6, 3.5, 4),   14,   COLORS.corridor));

        // Furniture
        items.push(furniture('Sofa',         'sofa',    0.4, 0.5, 3.5, 0.9));
        items.push(furniture('Sofa',         'sofa',    0.4, 2.0, 0.9, 2.0));
        items.push(furniture('TV Stand',     'cabinet', 5.5, 0.2, 1.2, 0.4));
        items.push(furniture('Coffee Table', 'table',   2.0, 1.5, 1.2, 0.7));
        items.push(furniture('Dining Table', 'table',   7.5, 1.0, 2.5, 1.5));
        items.push(furniture('Cooker',       'cooker',  10.7, 0.5, 0.6, 0.6));
        items.push(furniture('Fridge',       'fridge',  11.5, 0.3, 0.7, 0.7));
        items.push(furniture('Sink',         'sink',    12.5, 0.5, 0.6, 0.5));
        items.push(furniture('Toilet',       'toilet',  0.3, 6.3, 0.5, 0.7));
        items.push(furniture('Hand Basin',   'sink',    1.2, 6.3, 0.5, 0.4));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 4. ng-selfcontain — Self-Contain Studio
    // -------------------------------------------------------------------------
    {
      key:     'ng-selfcontain',
      name:    'Self-Contain Studio',
      country: 'Nigeria',
      desc:    'Compact Nigerian self-contain: one room with partitioned kitchenette and bathroom. 5×4 m.',
      rooms:   3,
      area:    20,
      build: function () {
        var items = [];

        // Envelope 5 × 4
        items = items.concat(boxWalls(0, 0, 5, 4));

        // Bathroom partition: x=3.5 to 5, y=0 to y=2 — left wall at x=3.5
        items.push(wall(3.5, 0, 3.5, 2));
        items.push(wall(3.5, 2, 5, 2));    // bath bottom wall

        // Kitchenette partition: x=3.5 to 5, y=2 to 4 — use y=2 wall already placed
        // (open kitchen, separated by counter — no extra wall)

        // Doors
        items.push(door(1.5, 0, 0));       // main entrance
        items.push(door(3.5, 1, 90));      // bathroom door (opens into main room)

        // Windows
        items.push(win(3.5, 0, 0, 'single', 0.9));  // bathroom window (small)
        items.push(win(1.0, 0, 0));                  // main room front
        items.push(win(0, 2.5, 90));                 // side window
        items.push(win(4, 4, 0, 'single', 0.9));     // kitchenette rear

        // Rooms
        items.push(room('Room',        rect(0, 0, 3.5, 4),  14, COLORS.bedroom));
        items.push(room('Bathroom',    rect(3.5, 0, 1.5, 2), 3, COLORS.bathroom));
        items.push(room('Kitchenette', rect(3.5, 2, 1.5, 2), 3, COLORS.kitchen));

        // Furniture
        items.push(furniture('Bed',        'bed',      0.3, 1.8, 1.6, 1.8));
        items.push(furniture('Wardrobe',   'wardrobe', 0.3, 0.2, 1.0, 0.5));
        items.push(furniture('TV Stand',   'cabinet',  2.5, 0.2, 0.8, 0.4));
        items.push(furniture('Toilet',     'toilet',   3.7, 0.2, 0.5, 0.7));
        items.push(furniture('Shower',     'shower',   4.3, 0.5, 0.6, 0.6));
        items.push(furniture('Cooker',     'cooker',   3.7, 2.5, 0.6, 0.6));
        items.push(furniture('Mini Fridge','fridge',   4.4, 2.5, 0.5, 0.5));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 5. ng-faceme — Face-Me-I-Face-You
    // -------------------------------------------------------------------------
    {
      key:     'ng-faceme',
      name:    'Face-Me-I-Face-You',
      country: 'Nigeria',
      desc:    'Traditional Lagos tenement: central corridor, 3 rooms each side (6 total), shared kitchen & toilet at rear. 12×8 m.',
      rooms:   8,
      area:    96,
      build: function () {
        var items = [];

        // Envelope 12 × 8
        items = items.concat(boxWalls(0, 0, 12, 8));

        // Central corridor: y=3.1 to y=4.9 (1.8 m wide)
        items.push(wall(0, 3.1, 10, 3.1));
        items.push(wall(0, 4.9, 10, 4.9));

        // Rear service block at x=10 to 12, full height: vertical divider
        items.push(wall(10, 0, 10, 8));
        // Horizontal divider in service block at y=4
        items.push(wall(10, 4, 12, 4));

        // Room dividers — front row (y=0 to 3.1) at x=4 and x=8
        items.push(wall(4, 0, 4, 3.1));
        items.push(wall(8, 0, 8, 3.1));
        // Room dividers — rear row (y=4.9 to 8) at x=4 and x=8
        items.push(wall(4, 4.9, 4, 8));
        items.push(wall(8, 4.9, 8, 8));

        // Doors
        // Corridor entrance doors (both ends)
        items.push(door(0, 4, 270));        // left corridor entrance
        items.push(door(10, 4, 90));        // corridor → service
        // Front rooms → corridor
        items.push(door(2, 3.1, 0));
        items.push(door(6, 3.1, 0));
        items.push(door(9, 3.1, 0));
        // Rear rooms → corridor
        items.push(door(2, 4.9, 0));
        items.push(door(6, 4.9, 0));
        items.push(door(9, 4.9, 0));
        // Service block doors
        items.push(door(10.5, 4, 0));      // shared toilet
        items.push(door(11, 0, 0));        // shared kitchen

        // Windows
        // Front rooms (y=0 wall)
        items.push(win(2, 0, 0));
        items.push(win(6, 0, 0));
        items.push(win(9, 0, 0));
        // Rear rooms (y=8 wall)
        items.push(win(2, 8, 0));
        items.push(win(6, 8, 0));
        items.push(win(9, 8, 0));
        // Service side
        items.push(win(12, 2, 90));
        items.push(win(12, 6, 90));

        // Rooms
        items.push(room('Room 1', rect(0, 0, 4, 3.1),    12.4, COLORS.bedroom));
        items.push(room('Room 2', rect(4, 0, 4, 3.1),    12.4, COLORS.bedroom));
        items.push(room('Room 3', rect(8, 0, 2, 3.1),    6.2,  COLORS.bedroom));
        items.push(room('Corridor', rect(0, 3.1, 10, 1.8), 18, COLORS.corridor));
        items.push(room('Room 4', rect(0, 4.9, 4, 3.1),  12.4, COLORS.bedroom));
        items.push(room('Room 5', rect(4, 4.9, 4, 3.1),  12.4, COLORS.bedroom));
        items.push(room('Room 6', rect(8, 4.9, 2, 3.1),  6.2,  COLORS.bedroom));
        items.push(room('Kitchen', rect(10, 0, 2, 4),    8,    COLORS.kitchen));
        items.push(room('Shared Toilet', rect(10, 4, 2, 4), 8, COLORS.bathroom));

        // Furniture — representative per room
        var roomDefs = [
          [0.3, 0.5], [4.3, 0.5], [8.2, 0.5],
          [0.3, 5.4], [4.3, 5.4], [8.2, 5.4]
        ];
        roomDefs.forEach(function (pos, i) {
          items.push(furniture('Bed', 'bed', pos[0], pos[1], 1.4, 1.8));
        });
        items.push(furniture('Cooker', 'cooker', 10.2, 0.5, 0.6, 0.6));
        items.push(furniture('Toilet', 'toilet', 10.2, 4.5, 0.5, 0.7));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 6. ng-4flats — Block of 4 Flats
    // -------------------------------------------------------------------------
    {
      key:     'ng-4flats',
      name:    'Block of 4 Flats',
      country: 'Nigeria',
      desc:    'Standard block of 4 mini-flats arranged around a central staircase. 16×12 m. Each unit: parlour, 2 bedrooms, kitchen, bathroom.',
      rooms:   16,
      area:    192,
      build: function () {
        var items = [];

        // Envelope 16 × 12
        items = items.concat(boxWalls(0, 0, 16, 12));

        // Central staircase block x=6.5 to 9.5, y=0 to 12 (3 m wide)
        items.push(wall(6.5, 0, 6.5, 12));
        items.push(wall(9.5, 0, 9.5, 12));

        // Horizontal mid-divider at y=6 (separates ground-floor pair)
        items.push(wall(0, 6, 6.5, 6));
        items.push(wall(9.5, 6, 16, 6));

        // ---- Unit A (top-left): x=0-6.5, y=0-6 ----
        // Internal: parlour | bed+bath at x=3.5 from y=0 to 6
        items.push(wall(3.5, 0, 3.5, 4));
        // bath | bed at y=4 from x=3.5 to 6.5
        items.push(wall(3.5, 4, 6.5, 4));
        // kitchen strip at y=2 from x=0 to 3.5
        items.push(wall(0, 2, 1.5, 2));
        items.push(wall(1.5, 0, 1.5, 2));

        // ---- Unit B (top-right): x=9.5-16, y=0-6 ----
        items.push(wall(12.5, 0, 12.5, 4));
        items.push(wall(9.5, 4, 12.5, 4));
        items.push(wall(14.5, 0, 14.5, 2));
        items.push(wall(14.5, 2, 16, 2));

        // ---- Unit C (bottom-left): x=0-6.5, y=6-12 ----
        items.push(wall(3.5, 6, 3.5, 10));
        items.push(wall(3.5, 10, 6.5, 10));
        items.push(wall(0, 8, 1.5, 8));
        items.push(wall(1.5, 6, 1.5, 8));

        // ---- Unit D (bottom-right): x=9.5-16, y=6-12 ----
        items.push(wall(12.5, 6, 12.5, 10));
        items.push(wall(9.5, 10, 12.5, 10));
        items.push(wall(14.5, 8, 16, 8));
        items.push(wall(14.5, 6, 14.5, 8));

        // Doors — staircase
        items.push(door(7.5, 0, 0));       // stair front entrance
        items.push(door(7.5, 12, 0));      // stair rear
        // Unit A
        items.push(door(6.5, 2, 90));      // stair → unit A
        items.push(door(3.5, 2.5, 90));    // parlour → bed side
        items.push(door(5, 4, 0));         // bed1 door
        // Unit B
        items.push(door(9.5, 2, 90));      // stair → unit B
        items.push(door(12.5, 2.5, 90));
        items.push(door(11, 4, 0));
        // Unit C
        items.push(door(6.5, 8, 90));
        items.push(door(3.5, 8.5, 90));
        items.push(door(5, 10, 0));
        // Unit D
        items.push(door(9.5, 8, 90));
        items.push(door(12.5, 8.5, 90));
        items.push(door(11, 10, 0));

        // Windows
        // Front wall (y=0)
        items.push(win(2, 0, 0));    // Unit A parlour
        items.push(win(13, 0, 0));   // Unit B parlour
        // Rear wall (y=12)
        items.push(win(2, 12, 0));   // Unit C
        items.push(win(13, 12, 0));  // Unit D
        // Left wall (x=0)
        items.push(win(0, 1.5, 90, 'single', 0.9));  // Unit A kitchen
        items.push(win(0, 4.5, 90));                  // Unit A bed
        items.push(win(0, 7.5, 90, 'single', 0.9));  // Unit C kitchen
        items.push(win(0, 10.5, 90));                 // Unit C bed
        // Right wall (x=16)
        items.push(win(16, 1.5, 90, 'single', 0.9));
        items.push(win(16, 4.5, 90));
        items.push(win(16, 7.5, 90, 'single', 0.9));
        items.push(win(16, 10.5, 90));

        // Rooms
        items.push(room('Unit A Parlour',  rect(0, 0, 3.5, 6),    21,  COLORS.parlour));
        items.push(room('Unit A Kitchen',  rect(0, 0, 1.5, 2),     3,   COLORS.kitchen));
        items.push(room('Unit A Bedroom',  rect(3.5, 0, 3, 4),    12,  COLORS.bedroom));
        items.push(room('Unit A Bathroom', rect(3.5, 4, 3, 2),    6,   COLORS.bathroom));

        items.push(room('Unit B Parlour',  rect(9.5, 0, 3, 6),    18,  COLORS.parlour));
        items.push(room('Unit B Kitchen',  rect(14.5, 0, 1.5, 2), 3,   COLORS.kitchen));
        items.push(room('Unit B Bedroom',  rect(12.5, 0, 3, 4),   9,   COLORS.bedroom));
        items.push(room('Unit B Bathroom', rect(9.5, 4, 3, 2),    6,   COLORS.bathroom));

        items.push(room('Unit C Parlour',  rect(0, 6, 3.5, 6),    21,  COLORS.parlour));
        items.push(room('Unit C Kitchen',  rect(0, 6, 1.5, 2),    3,   COLORS.kitchen));
        items.push(room('Unit C Bedroom',  rect(3.5, 6, 3, 4),    12,  COLORS.bedroom));
        items.push(room('Unit C Bathroom', rect(3.5, 10, 3, 2),   6,   COLORS.bathroom));

        items.push(room('Unit D Parlour',  rect(9.5, 6, 3, 6),    18,  COLORS.parlour));
        items.push(room('Unit D Kitchen',  rect(14.5, 6, 1.5, 2), 3,   COLORS.kitchen));
        items.push(room('Unit D Bedroom',  rect(12.5, 6, 3, 4),   9,   COLORS.bedroom));
        items.push(room('Unit D Bathroom', rect(9.5, 10, 3, 2),   6,   COLORS.bathroom));

        items.push(room('Staircase', rect(6.5, 0, 3, 12), 36, COLORS.corridor));

        // Furniture — one bed per unit, one sofa per unit
        items.push(furniture('Sofa', 'sofa', 0.3, 0.3, 2.2, 0.8));
        items.push(furniture('Bed',  'bed',  3.7, 0.3, 1.6, 1.8));
        items.push(furniture('Sofa', 'sofa', 9.7, 0.3, 2.2, 0.8));
        items.push(furniture('Bed',  'bed',  12.7, 0.3, 1.6, 1.8));
        items.push(furniture('Sofa', 'sofa', 0.3, 6.3, 2.2, 0.8));
        items.push(furniture('Bed',  'bed',  3.7, 6.3, 1.6, 1.8));
        items.push(furniture('Sofa', 'sofa', 9.7, 6.3, 2.2, 0.8));
        items.push(furniture('Bed',  'bed',  12.7, 6.3, 1.6, 1.8));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 7. ng-compound — Compound House
    // -------------------------------------------------------------------------
    {
      key:     'ng-compound',
      name:    'Compound House',
      country: 'Nigeria',
      desc:    'Full compound layout: main 4-bed house, BQ, security post, generator room, parking. 18×30 m plot.',
      rooms:   10,
      area:    540,
      build: function () {
        var items = [];

        // Compound boundary
        items = items.concat(boxWalls(0, 0, 18, 30));

        // Gate opening at x=7 to 11, y=30 (remove that section — just mark with door)
        items.push(door(9, 30, 0, 'double'));

        // Main house: 14×9 m at x=2, y=2
        var mx = 2, my = 2;
        items = items.concat(boxWalls(mx, my, 14, 9));
        // Internal walls of main house
        items.push(wall(mx, my + 5.5, mx + 14, my + 5.5));   // front | rear divide
        items.push(wall(mx + 7, my, mx + 7, my + 5.5));      // parlour | dining/kitchen
        items.push(wall(mx + 10.5, my, mx + 10.5, my + 5.5));// dining | kitchen
        items.push(wall(mx + 3.5, my + 5.5, mx + 3.5, my + 9)); // bed1 | bed2-4
        items.push(wall(mx + 7, my + 5.5, mx + 7, my + 9));  // bed2 | bed3
        items.push(wall(mx + 10.5, my + 5.5, mx + 10.5, my + 9)); // bed3 | bath+bed4
        items.push(wall(mx + 10.5, my + 7, mx + 14, my + 7)); // bed4 | bathroom

        // Main house doors
        items.push(door(mx + 3, my, 0));           // front entrance
        items.push(door(mx + 8.5, my, 0));         // dining entrance
        items.push(door(mx + 7, my + 2.5, 90));    // parlour → dining
        items.push(door(mx + 10.5, my + 2, 90));   // dining → kitchen
        items.push(door(mx + 13, my + 3, 90));     // kitchen side door
        items.push(door(mx + 1.5, my + 5.5, 0));   // corridor → bed1
        items.push(door(mx + 5, my + 5.5, 0));     // → bed2
        items.push(door(mx + 8.5, my + 5.5, 0));   // → bed3
        items.push(door(mx + 12, my + 5.5, 0));    // → bed4/bath
        items.push(door(mx + 12.5, my + 7, 0));    // bed4 → bathroom

        // Main house windows
        items.push(win(mx + 2.5, my, 0));
        items.push(win(mx + 9, my, 0));
        items.push(win(mx + 12.5, my, 0));
        items.push(win(mx, my + 3, 90));
        items.push(win(mx + 1.5, my + 9, 0));
        items.push(win(mx + 5, my + 9, 0));
        items.push(win(mx + 8.5, my + 9, 0));
        items.push(win(mx + 14, my + 7.5, 90));

        // Main house rooms
        items.push(room('Parlour',     rect(mx, my, 7, 5.5),          38.5, COLORS.parlour));
        items.push(room('Dining',      rect(mx + 7, my, 3.5, 5.5),    19.25, COLORS.dining));
        items.push(room('Kitchen',     rect(mx + 10.5, my, 3.5, 5.5), 19.25, COLORS.kitchen));
        items.push(room('Master Bed',  rect(mx, my + 5.5, 3.5, 3.5),  12.25, COLORS.masterBed));
        items.push(room('Bedroom 2',   rect(mx + 3.5, my + 5.5, 3.5, 3.5), 12.25, COLORS.bedroom));
        items.push(room('Bedroom 3',   rect(mx + 7, my + 5.5, 3.5, 3.5),   12.25, COLORS.bedroom));
        items.push(room('Bedroom 4',   rect(mx + 10.5, my + 5.5, 3.5, 1.5), 5.25, COLORS.bedroom));
        items.push(room('Bathroom',    rect(mx + 10.5, my + 7, 3.5, 2),     7, COLORS.bathroom));

        // BQ: 4×5 at x=2, y=14
        items = items.concat(boxWalls(2, 14, 4, 5));
        items.push(wall(2, 17, 6, 17));
        items.push(door(3.5, 14, 0));
        items.push(door(3, 17, 0));
        items.push(win(2, 15.5, 90, 'single', 0.9));
        items.push(room('BQ Room',   rect(2, 14, 4, 3), 12, COLORS.bq));
        items.push(room('BQ Toilet', rect(2, 17, 4, 2), 8,  COLORS.bathroom));

        // Security post: 2×2 at x=0.5, y=26
        items = items.concat(boxWalls(0.5, 26, 2, 2));
        items.push(door(1.5, 26, 0));
        items.push(win(2.5, 27, 90, 'single', 0.8));
        items.push(room('Security Post', rect(0.5, 26, 2, 2), 4, COLORS.security));

        // Generator room: 2×2 at x=15, y=14
        items = items.concat(boxWalls(15, 14, 2.5, 2.5));
        items.push(door(15.8, 14, 0));
        items.push(room('Generator Room', rect(15, 14, 2.5, 2.5), 6.25, COLORS.generator));

        // Parking bay outline (just dashed lines implied by walls, no room fill)
        // Use thin walls to delineate 2 bays 2.5×5 each at x=10, y=22
        items.push(wall(10, 22, 10, 28));
        items.push(wall(10, 22, 17, 22));
        items.push(wall(17, 22, 17, 28));
        items.push(wall(12.5, 22, 12.5, 28));
        items.push(wall(15, 22, 15, 28));
        items.push(room('Parking', rect(10, 22, 7, 6), 42, COLORS.garage));

        // Key furniture
        items.push(furniture('Sofa', 'sofa', mx + 0.5, my + 0.5, 3, 0.9));
        items.push(furniture('Dining Table', 'table', mx + 7.5, my + 1, 2.5, 1.5));
        items.push(furniture('Cooker', 'cooker', mx + 10.7, my + 0.5, 0.6, 0.6));
        items.push(furniture('Bed', 'bed', mx + 0.3, my + 6.2, 1.8, 2.0));
        items.push(furniture('Bed', 'bed', mx + 3.8, my + 6.2, 1.6, 1.8));
        items.push(furniture('Bed', 'bed', mx + 7.3, my + 6.2, 1.6, 1.8));
        items.push(furniture('Bed', 'bed', mx + 10.8, my + 5.7, 1.4, 1.4));
        items.push(furniture('Toilet', 'toilet', mx + 10.8, my + 7.5, 0.5, 0.7));
        items.push(furniture('Bed', 'bed', 2.3, 14.5, 1.4, 1.8));
        items.push(furniture('Generator', 'generator', 15.3, 14.5, 1.5, 1.5));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 8. ke-3bed — Kenyan 3 Bedroom Bungalow
    // -------------------------------------------------------------------------
    {
      key:     'ke-3bed',
      name:    '3 Bedroom Bungalow',
      country: 'Kenya',
      desc:    'Standard Kenyan 3-bedroom bungalow on 1/8 acre (15×30 m). Living, dining, kitchen, 3 bedrooms, 2 bathrooms.',
      rooms:   7,
      area:    108,
      build: function () {
        var items = [];

        // Envelope 12 × 9
        items = items.concat(boxWalls(0, 0, 12, 9));

        // Internal layout
        // Front zone y=0 to y=5: living | dining | kitchen
        items.push(wall(5.5, 0, 5.5, 5));   // living | dining
        items.push(wall(8.5, 0, 8.5, 5));   // dining | kitchen
        items.push(wall(0, 5, 12, 5));       // front | rear divide

        // Rear zone y=5 to 9: corridor + 3 beds + 2 baths
        // Corridor at y=5 to y=6.2
        items.push(wall(0, 6.2, 12, 6.2));
        // Bed splits
        items.push(wall(4, 6.2, 4, 9));     // bed1 | bed2
        items.push(wall(8, 6.2, 8, 9));     // bed2 | bed3+baths
        // Bathroom strip: x=8 to 12, y=5 to 6.2 (ensuite for bed3)
        // and x=10 to 12, y=6.2 to 9
        items.push(wall(10, 6.2, 10, 9));   // bed3 | bathroom
        // Shared bathroom in corner: x=0 to 2, y=5 to 6.2
        items.push(wall(2, 5, 2, 6.2));

        // Doors
        items.push(door(2.5, 0, 0));        // main entrance
        items.push(door(5.5, 2, 90));       // living → dining
        items.push(door(8.5, 2, 90));       // dining → kitchen
        items.push(door(11, 0, 0));         // kitchen back door
        items.push(door(1, 5, 0));          // shared bath from corridor
        items.push(door(6, 5, 0));          // → corridor
        items.push(door(2, 6.2, 0));        // → bed1
        items.push(door(6, 6.2, 0));        // → bed2
        items.push(door(9, 6.2, 0));        // → bed3
        items.push(door(10, 7.5, 90));      // bed3 → ensuite

        // Windows
        items.push(win(2, 0, 0));           // living front
        items.push(win(7, 0, 0));           // dining front
        items.push(win(10, 0, 0));          // kitchen front
        items.push(win(0, 2.5, 90));        // living left
        items.push(win(2, 9, 0));           // bed1 rear
        items.push(win(6, 9, 0));           // bed2 rear
        items.push(win(9, 9, 0));           // bed3 rear
        items.push(win(12, 7, 90));         // ensuite right

        // Rooms
        items.push(room('Living Room', rect(0, 0, 5.5, 5),   27.5, COLORS.living));
        items.push(room('Dining',      rect(5.5, 0, 3, 5),   15,   COLORS.dining));
        items.push(room('Kitchen',     rect(8.5, 0, 3.5, 5), 17.5, COLORS.kitchen));
        items.push(room('Bathroom',    rect(0, 5, 2, 1.2),   2.4,  COLORS.bathroom));
        items.push(room('Corridor',    rect(2, 5, 10, 1.2),  12,   COLORS.corridor));
        items.push(room('Bedroom 1',   rect(0, 6.2, 4, 2.8), 11.2, COLORS.bedroom));
        items.push(room('Bedroom 2',   rect(4, 6.2, 4, 2.8), 11.2, COLORS.bedroom));
        items.push(room('Bedroom 3',   rect(8, 6.2, 2, 2.8), 5.6,  COLORS.masterBed));
        items.push(room('Ensuite',     rect(10, 6.2, 2, 2.8),5.6,  COLORS.bathroom));

        // Furniture
        items.push(furniture('Sofa',         'sofa',    0.3, 0.5, 3, 0.9));
        items.push(furniture('TV Stand',     'cabinet', 4, 0.2, 1.2, 0.4));
        items.push(furniture('Dining Table', 'table',   5.8, 0.8, 2.2, 1.4));
        items.push(furniture('Cooker',       'cooker',  8.7, 0.5, 0.6, 0.6));
        items.push(furniture('Fridge',       'fridge',  9.5, 0.3, 0.7, 0.7));
        items.push(furniture('Bed',          'bed',     0.3, 6.8, 1.6, 1.8));
        items.push(furniture('Bed',          'bed',     4.3, 6.8, 1.6, 1.8));
        items.push(furniture('Bed',          'bed',     8.2, 6.8, 1.5, 1.8));
        items.push(furniture('Toilet',       'toilet',  10.2, 6.5, 0.5, 0.7));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 9. ke-maisonette — Kenyan Maisonette (Ground Floor)
    // -------------------------------------------------------------------------
    {
      key:     'ke-maisonette',
      name:    'Maisonette (Ground Floor)',
      country: 'Kenya',
      desc:    'Popular Nairobi maisonette ground floor. 10×8 m. Lounge, dining, kitchen, guest bedroom, toilet.',
      rooms:   5,
      area:    80,
      build: function () {
        var items = [];

        // Envelope 10 × 8
        items = items.concat(boxWalls(0, 0, 10, 8));

        // Internal walls
        items.push(wall(5, 0, 5, 5));       // lounge | kitchen/dining
        items.push(wall(7, 0, 7, 5));       // dining | kitchen
        items.push(wall(0, 5, 10, 5));      // front | rear
        items.push(wall(4, 5, 4, 8));       // bedroom | toilet/stairs
        items.push(wall(4, 6.5, 10, 6.5)); // toilet | stair hall

        // Doors
        items.push(door(2.5, 0, 0));        // main entrance
        items.push(door(5, 2.5, 90));       // lounge → dining arch
        items.push(door(7, 2.5, 90));       // dining → kitchen
        items.push(door(9.5, 0, 0));        // kitchen side door
        items.push(door(2, 5, 0));          // lounge → bed/rear
        items.push(door(7, 5, 0));          // to stair/toilet
        items.push(door(4, 5.5, 90));       // → toilet
        items.push(door(2, 8, 0));          // bedroom rear door (yard)

        // Windows
        items.push(win(1.5, 0, 0));         // lounge front
        items.push(win(6, 0, 0));           // dining front
        items.push(win(8.5, 0, 0));         // kitchen front
        items.push(win(0, 2.5, 90));        // lounge left
        items.push(win(2, 8, 0));           // bedroom rear
        items.push(win(10, 6, 90));         // stair right

        // Rooms
        items.push(room('Lounge',      rect(0, 0, 5, 5),    25, COLORS.living));
        items.push(room('Dining',      rect(5, 0, 2, 5),    10, COLORS.dining));
        items.push(room('Kitchen',     rect(7, 0, 3, 5),    15, COLORS.kitchen));
        items.push(room('Bedroom',     rect(0, 5, 4, 3),    12, COLORS.bedroom));
        items.push(room('Toilet',      rect(4, 5, 6, 1.5),  9,  COLORS.bathroom));
        items.push(room('Stair Hall',  rect(4, 6.5, 6, 1.5),9, COLORS.corridor));

        // Furniture
        items.push(furniture('Sofa',         'sofa',    0.3, 0.5, 2.8, 0.9));
        items.push(furniture('TV Stand',     'cabinet', 4, 0.2, 0.8, 0.4));
        items.push(furniture('Dining Table', 'table',   5.2, 0.8, 1.5, 1.2));
        items.push(furniture('Cooker',       'cooker',  7.2, 0.5, 0.6, 0.6));
        items.push(furniture('Bed',          'bed',     0.3, 5.5, 1.6, 1.8));
        items.push(furniture('Toilet',       'toilet',  4.3, 5.2, 0.5, 0.7));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 10. ke-bedsitter — Kenyan Bedsitter/Studio
    // -------------------------------------------------------------------------
    {
      key:     'ke-bedsitter',
      name:    'Bedsitter / Studio',
      country: 'Kenya',
      desc:    'Compact Nairobi bedsitter. 4×3.5 m. Open-plan living/sleeping with kitchenette and bathroom.',
      rooms:   3,
      area:    14,
      build: function () {
        var items = [];

        // Envelope 4 × 3.5
        items = items.concat(boxWalls(0, 0, 4, 3.5));

        // Bathroom corner: x=2.8 to 4, y=0 to 1.8
        items.push(wall(2.8, 0, 2.8, 1.8));
        items.push(wall(2.8, 1.8, 4, 1.8));

        // Kitchenette counter (implied by furniture, no extra wall)

        // Doors
        items.push(door(1.2, 0, 0));        // entrance
        items.push(door(2.8, 0.9, 90));     // bathroom door

        // Windows
        items.push(win(0.5, 0, 0, 'single', 0.9));   // front
        items.push(win(0, 2, 90, 'single', 0.9));     // left
        items.push(win(3.3, 3.5, 0, 'single', 0.9)); // rear kitchenette

        // Rooms
        items.push(room('Studio Room',  rect(0, 0, 2.8, 3.5),  9.8, COLORS.bedroom));
        items.push(room('Bathroom',     rect(2.8, 0, 1.2, 1.8),2.16,COLORS.bathroom));
        items.push(room('Kitchenette',  rect(2.8, 1.8, 1.2, 1.7),2.04,COLORS.kitchen));

        // Furniture
        items.push(furniture('Bed',        'bed',      0.2, 1.5, 1.4, 1.6));
        items.push(furniture('Wardrobe',   'wardrobe', 0.2, 0.2, 0.8, 0.5));
        items.push(furniture('Toilet',     'toilet',   3.0, 0.2, 0.5, 0.7));
        items.push(furniture('Shower',     'shower',   3.3, 1.0, 0.6, 0.6));
        items.push(furniture('Mini Cooker','cooker',   3.0, 2.2, 0.5, 0.5));
        items.push(furniture('Mini Fridge','fridge',   3.6, 2.2, 0.4, 0.4));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 11. za-rdp — South African RDP House
    // -------------------------------------------------------------------------
    {
      key:     'za-rdp',
      name:    'RDP House',
      country: 'South Africa',
      desc:    'Government-standard RDP (Reconstruction & Development Programme) house. 6×7 m. 2 bedrooms, living area, kitchen, bathroom.',
      rooms:   4,
      area:    42,
      build: function () {
        var items = [];

        // Envelope 6 × 7
        items = items.concat(boxWalls(0, 0, 6, 7));

        // Internal walls
        // Horizontal at y=3.5: front living/kitchen | rear beds/bath
        items.push(wall(0, 3.5, 6, 3.5));
        // Kitchen | living at x=3 from y=0 to 3.5
        items.push(wall(3, 0, 3, 3.5));
        // Bed 1 | Bed 2 at x=3 from y=3.5 to 7
        items.push(wall(3, 3.5, 3, 7));
        // Bathroom at x=0 to 2, y=3.5 to 5.2 — right wall at x=2 from y=3.5 to 5.2?
        // Use: bath in right half top corner: x=3 to 6, y=3.5 to 5 (between bed2 top)
        items.push(wall(3, 5, 6, 5));       // bed2 | bathroom horizontal

        // Doors
        items.push(door(1.5, 0, 0));        // front entrance → living
        items.push(door(3, 1.5, 90));       // living → kitchen (archway)
        items.push(door(1, 3.5, 0));        // living → bed1
        items.push(door(4.5, 3.5, 0));      // → bed2
        items.push(door(4.5, 5, 0));        // bed2 → bathroom

        // Windows
        items.push(win(1, 0, 0));           // living front
        items.push(win(4.5, 0, 0));         // kitchen front
        items.push(win(0, 5.5, 90));        // bed1 left
        items.push(win(1, 7, 0));           // bed1 rear
        items.push(win(4.5, 7, 0));         // bed2 rear
        items.push(win(6, 4.5, 90));        // bathroom right

        // Rooms
        items.push(room('Living Room', rect(0, 0, 3, 3.5),   10.5, COLORS.living));
        items.push(room('Kitchen',     rect(3, 0, 3, 3.5),   10.5, COLORS.kitchen));
        items.push(room('Bedroom 1',   rect(0, 3.5, 3, 3.5), 10.5, COLORS.bedroom));
        items.push(room('Bedroom 2',   rect(3, 3.5, 3, 1.5), 4.5,  COLORS.bedroom));
        items.push(room('Bathroom',    rect(3, 5, 3, 2),     6,    COLORS.bathroom));

        // Furniture
        items.push(furniture('Sofa',    'sofa',   0.2, 0.4, 2, 0.7));
        items.push(furniture('Cooker',  'cooker', 3.2, 0.4, 0.6, 0.6));
        items.push(furniture('Sink',    'sink',   4.0, 0.4, 0.6, 0.5));
        items.push(furniture('Bed',     'bed',    0.3, 4.0, 1.4, 1.8));
        items.push(furniture('Bed',     'bed',    3.2, 3.7, 1.4, 1.2));
        items.push(furniture('Toilet',  'toilet', 3.2, 5.3, 0.5, 0.7));
        items.push(furniture('Shower',  'shower', 4.2, 5.3, 0.8, 0.8));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 12. za-family — South African 3 Bedroom Family Home
    // -------------------------------------------------------------------------
    {
      key:     'za-family',
      name:    '3 Bedroom Family Home',
      country: 'South Africa',
      desc:    'Middle-income South African family home. 12×10 m. Lounge, kitchen, dining, 3 bedrooms, 2 bathrooms, single garage.',
      rooms:   8,
      area:    120,
      build: function () {
        var items = [];

        // Main house: 12 × 10
        items = items.concat(boxWalls(0, 0, 12, 10));

        // Garage: 4 × 5.5 attached at right, y=0
        items = items.concat(boxWalls(12, 0, 4, 5.5));
        items.push(door(14, 0, 0, 'double'));   // garage vehicle entrance (front)
        items.push(door(12, 3, 90));            // house → garage

        // Internal walls of main house
        // y=5.5: front | rear
        items.push(wall(0, 5.5, 12, 5.5));
        // Lounge | dining at x=5.5 from y=0 to 5.5
        items.push(wall(5.5, 0, 5.5, 5.5));
        // Dining | kitchen at x=8.5 from y=0 to 5.5
        items.push(wall(8.5, 0, 8.5, 5.5));
        // Rear corridor at y=5.5 to 6.8 (full width)
        items.push(wall(0, 6.8, 12, 6.8));
        // Bed dividers from y=6.8 to 10
        items.push(wall(4, 6.8, 4, 10));
        items.push(wall(8, 6.8, 8, 10));
        // Ensuite for master: x=8 to 12, y=6.8 to 8.5
        items.push(wall(8, 8.5, 12, 8.5));
        // Shared bathroom: x=0 to 2, y=5.5 to 6.8
        items.push(wall(2, 5.5, 2, 6.8));

        // Doors
        items.push(door(2.5, 0, 0));        // main front entrance
        items.push(door(5.5, 2.5, 90));     // lounge → dining
        items.push(door(8.5, 2.5, 90));     // dining → kitchen
        items.push(door(11, 0, 0));         // kitchen front door
        items.push(door(1, 5.5, 0));        // → shared bath
        items.push(door(5, 5.5, 0));        // → corridor
        items.push(door(10, 5.5, 0));       // → corridor right
        items.push(door(2, 6.8, 0));        // → bed1
        items.push(door(6, 6.8, 0));        // → bed2
        items.push(door(10, 6.8, 0));       // → master bed
        items.push(door(10, 8.5, 0));       // master → ensuite

        // Windows
        items.push(win(2, 0, 0));
        items.push(win(7, 0, 0));
        items.push(win(10.5, 0, 0));
        items.push(win(0, 2.5, 90));
        items.push(win(0, 8, 90));
        items.push(win(2, 10, 0));
        items.push(win(6, 10, 0));
        items.push(win(10, 10, 0));
        items.push(win(12, 9, 90));

        // Rooms
        items.push(room('Lounge',      rect(0, 0, 5.5, 5.5),     30.25, COLORS.living));
        items.push(room('Dining',      rect(5.5, 0, 3, 5.5),     16.5,  COLORS.dining));
        items.push(room('Kitchen',     rect(8.5, 0, 3.5, 5.5),   19.25, COLORS.kitchen));
        items.push(room('Bathroom',    rect(0, 5.5, 2, 1.3),     2.6,   COLORS.bathroom));
        items.push(room('Corridor',    rect(2, 5.5, 10, 1.3),    13,    COLORS.corridor));
        items.push(room('Bedroom 1',   rect(0, 6.8, 4, 3.2),     12.8,  COLORS.bedroom));
        items.push(room('Bedroom 2',   rect(4, 6.8, 4, 3.2),     12.8,  COLORS.bedroom));
        items.push(room('Master Bed',  rect(8, 6.8, 4, 1.7),     6.8,   COLORS.masterBed));
        items.push(room('Ensuite',     rect(8, 8.5, 4, 1.5),     6,     COLORS.bathroom));
        items.push(room('Garage',      rect(12, 0, 4, 5.5),      22,    COLORS.garage));

        // Furniture
        items.push(furniture('Sofa',         'sofa',    0.3, 0.5, 3, 0.9));
        items.push(furniture('TV Stand',     'cabinet', 4.5, 0.2, 0.8, 0.4));
        items.push(furniture('Dining Table', 'table',   5.8, 0.8, 2, 1.4));
        items.push(furniture('Cooker',       'cooker',  8.7, 0.5, 0.6, 0.6));
        items.push(furniture('Fridge',       'fridge',  9.5, 0.3, 0.7, 0.7));
        items.push(furniture('Bed',          'bed',     0.3, 7.2, 1.6, 1.8));
        items.push(furniture('Bed',          'bed',     4.3, 7.2, 1.6, 1.8));
        items.push(furniture('Bed',          'bed',     8.3, 7.0, 1.8, 2.0));
        items.push(furniture('Toilet',       'toilet',  8.2, 8.7, 0.5, 0.7));
        items.push(furniture('Bath',         'bathtub', 9.2, 8.7, 0.8, 1.4));
        items.push(furniture('Car',          'car',     12.3, 0.5, 2.2, 4.5));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 13. modern-openplan — Open Plan Modern
    // -------------------------------------------------------------------------
    {
      key:     'modern-openplan',
      name:    'Open Plan Modern',
      country: 'Pan-African',
      desc:    'Contemporary open-plan home. 10×8 m. Open living/dining/kitchen zone, 2 bedrooms, 1 bathroom.',
      rooms:   4,
      area:    80,
      build: function () {
        var items = [];

        // Envelope 10 × 8
        items = items.concat(boxWalls(0, 0, 10, 8));

        // Internal walls
        // Bedroom zone: x=0 to 10, y=4.5 to 8 (rear half)
        items.push(wall(0, 4.5, 10, 4.5));
        // Corridor at y=4.5 to 5.5
        items.push(wall(0, 5.5, 10, 5.5));
        // Bed 1 | Bed 2 at x=5 from y=5.5 to 8
        items.push(wall(5, 5.5, 5, 8));
        // Bathroom alcove in open plan right side: x=7.5 to 10, y=0 to 4.5
        items.push(wall(7.5, 0, 7.5, 4.5));
        // Bathroom horizontal at y=2.5 from x=7.5 to 10 (toilet top, shower below)
        items.push(wall(7.5, 2.5, 10, 2.5));

        // Doors
        items.push(door(3, 0, 0));          // main entrance
        items.push(door(7.5, 1, 90));       // → bathroom
        items.push(door(3, 4.5, 0));        // living → corridor
        items.push(door(7, 4.5, 0));        // kitchen → corridor
        items.push(door(2, 5.5, 0));        // → bed1
        items.push(door(7, 5.5, 0));        // → bed2

        // Windows (large glazing — modern style)
        items.push(win(1, 0, 0, 'double', 1.8));      // open plan front
        items.push(win(5, 0, 0, 'double', 1.8));      // open plan front centre
        items.push(win(0, 2, 90, 'double', 1.8));     // left wall
        items.push(win(2, 8, 0, 'double', 1.5));      // bed1 rear
        items.push(win(7, 8, 0, 'double', 1.5));      // bed2 rear
        items.push(win(10, 0.8, 90, 'single', 0.9));  // bathroom

        // Rooms
        items.push(room('Open Living/Dining/Kitchen', rect(0, 0, 7.5, 4.5), 33.75, COLORS.living));
        items.push(room('Bathroom',  rect(7.5, 0, 2.5, 2.5),   6.25, COLORS.bathroom));
        items.push(room('WC/Shower', rect(7.5, 2.5, 2.5, 2),   5,    COLORS.bathroom));
        items.push(room('Corridor',  rect(0, 4.5, 10, 1),      10,   COLORS.corridor));
        items.push(room('Bedroom 1', rect(0, 5.5, 5, 2.5),     12.5, COLORS.bedroom));
        items.push(room('Bedroom 2', rect(5, 5.5, 5, 2.5),     12.5, COLORS.bedroom));

        // Furniture
        items.push(furniture('Sofa',         'sofa',    0.3, 0.5, 3.5, 0.9));
        items.push(furniture('Sofa',         'sofa',    0.3, 1.5, 0.8, 2));
        items.push(furniture('Coffee Table', 'table',   1.5, 1.2, 1.5, 0.8));
        items.push(furniture('Dining Table', 'table',   2.5, 3.2, 2.5, 1));
        items.push(furniture('Kitchen Island','cabinet', 5.5, 0.5, 1.7, 1.2));
        items.push(furniture('Cooker',       'cooker',  5.5, 2.5, 0.6, 0.6));
        items.push(furniture('Fridge',       'fridge',  6.5, 0.3, 0.7, 0.7));
        items.push(furniture('Toilet',       'toilet',  7.7, 0.2, 0.5, 0.7));
        items.push(furniture('Shower',       'shower',  8.2, 2.7, 0.8, 0.8));
        items.push(furniture('Bed',          'bed',     0.3, 5.8, 1.8, 2));
        items.push(furniture('Wardrobe',     'wardrobe',0.3, 5.6, 1.2, 0.6, 90));
        items.push(furniture('Bed',          'bed',     5.3, 5.8, 1.8, 2));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 14. home-office — Home Office Layout
    // -------------------------------------------------------------------------
    {
      key:     'home-office',
      name:    'Home Office Layout',
      country: 'Pan-African',
      desc:    'Home with dedicated office space. 11×9 m. 2 bedrooms, office, living room, kitchen, bathroom.',
      rooms:   6,
      area:    99,
      build: function () {
        var items = [];

        // Envelope 11 × 9
        items = items.concat(boxWalls(0, 0, 11, 9));

        // Internal walls
        // Front band y=0 to 5.5: living | office | kitchen
        items.push(wall(5, 0, 5, 5.5));      // living | office
        items.push(wall(8, 0, 8, 5.5));      // office | kitchen
        // Horizontal at y=5.5
        items.push(wall(0, 5.5, 11, 5.5));
        // Corridor at y=5.5 to 6.8
        items.push(wall(0, 6.8, 11, 6.8));
        // Bed 1 | Bed 2 at x=5.5 from y=6.8 to 9
        items.push(wall(5.5, 6.8, 5.5, 9));
        // Bathroom: x=8 to 11, y=5.5 to 6.8
        items.push(wall(8, 5.5, 8, 6.8));

        // Doors
        items.push(door(2.5, 0, 0));         // main entrance
        items.push(door(8, 0, 0));           // kitchen side door
        items.push(door(5, 2.5, 90));        // living → office (glass door — archway)
        items.push(door(8, 2.5, 90));        // office → kitchen
        items.push(door(2.5, 5.5, 0));       // → corridor
        items.push(door(6.5, 5.5, 0));       // → corridor right
        items.push(door(9, 5.5, 0));         // → bathroom
        items.push(door(2.5, 6.8, 0));       // → bed1
        items.push(door(8, 6.8, 0));         // → bed2

        // Windows
        items.push(win(1.5, 0, 0));
        items.push(win(6.5, 0, 0));
        items.push(win(9.5, 0, 0));
        items.push(win(0, 2.5, 90));
        items.push(win(0, 7.5, 90));
        items.push(win(2, 9, 0));
        items.push(win(8, 9, 0));
        items.push(win(11, 6, 90));

        // Rooms
        items.push(room('Living Room', rect(0, 0, 5, 5.5),     27.5,  COLORS.living));
        items.push(room('Office',      rect(5, 0, 3, 5.5),     16.5,  COLORS.office));
        items.push(room('Kitchen',     rect(8, 0, 3, 5.5),     16.5,  COLORS.kitchen));
        items.push(room('Bathroom',    rect(8, 5.5, 3, 1.3),   3.9,   COLORS.bathroom));
        items.push(room('Corridor',    rect(0, 5.5, 8, 1.3),   10.4,  COLORS.corridor));
        items.push(room('Bedroom 1',   rect(0, 6.8, 5.5, 2.2), 12.1,  COLORS.bedroom));
        items.push(room('Bedroom 2',   rect(5.5, 6.8, 5.5, 2.2),12.1, COLORS.masterBed));

        // Furniture
        items.push(furniture('Sofa',        'sofa',     0.3, 0.5, 3, 0.9));
        items.push(furniture('TV Stand',    'cabinet',  4, 0.2, 0.8, 0.4));
        items.push(furniture('Desk',        'desk',     5.3, 0.5, 2.2, 0.8));
        items.push(furniture('Office Chair','chair',    6.2, 1.5, 0.6, 0.6));
        items.push(furniture('Bookshelf',   'bookcase', 5.3, 1.5, 0.4, 2.5));
        items.push(furniture('Monitor',     'monitor',  6.5, 0.5, 0.5, 0.3));
        items.push(furniture('Cooker',      'cooker',   8.2, 0.5, 0.6, 0.6));
        items.push(furniture('Fridge',      'fridge',   9.2, 0.3, 0.7, 0.7));
        items.push(furniture('Toilet',      'toilet',   8.3, 5.7, 0.5, 0.7));
        items.push(furniture('Shower',      'shower',   9.5, 5.7, 0.8, 0.8));
        items.push(furniture('Bed',         'bed',      0.3, 7.2, 1.8, 2));
        items.push(furniture('Bed',         'bed',      5.8, 7.2, 1.8, 2));
        items.push(furniture('Wardrobe',    'wardrobe', 3.5, 6.9, 1.5, 0.6));
        items.push(furniture('Wardrobe',    'wardrobe', 9.5, 6.9, 1.4, 0.6));

        return items;
      }
    },

    // -------------------------------------------------------------------------
    // 15. small-shop — Small Shop/Retail
    // -------------------------------------------------------------------------
    {
      key:     'small-shop',
      name:    'Small Shop / Retail',
      country: 'Pan-African',
      desc:    'Typical African roadside shop unit. 8×6 m. Shop floor, store room, toilet, service counter.',
      rooms:   3,
      area:    48,
      build: function () {
        var items = [];

        // Envelope 8 × 6
        items = items.concat(boxWalls(0, 0, 8, 6));

        // Store room: x=5.5 to 8, y=0 to 6 — vertical divider at x=5.5
        items.push(wall(5.5, 0, 5.5, 4.5));
        // Toilet alcove at x=5.5 to 8, y=4 to 6 — horizontal at y=4.5 from 5.5 to 8
        items.push(wall(5.5, 4.5, 8, 4.5));

        // Service counter line (wall stub at y=2.5 from x=0 to 3)
        items.push(wall(0, 2.5, 3, 2.5));
        items.push(wall(3, 1.5, 3, 2.5));  // counter end post

        // Doors
        items.push(door(2, 0, 0, 'double')); // shop front double door
        items.push(door(6.5, 0, 0));         // store front access (staff)
        items.push(door(5.5, 2, 90));        // shop floor → store
        items.push(door(6.5, 4.5, 0));       // → toilet

        // Windows — display windows at front
        items.push(win(0.5, 0, 0, 'double', 1.5));   // display window left
        items.push(win(4, 0, 0, 'double', 1.2));      // display window right of door
        items.push(win(0, 4, 90, 'single', 1.0));     // side ventilation
        items.push(win(8, 2, 90, 'single', 0.9));     // store ventilation

        // Rooms
        items.push(room('Shop Floor',  rect(0, 0, 5.5, 6),     33,  COLORS.shop));
        items.push(room('Store Room',  rect(5.5, 0, 2.5, 4.5), 11.25, COLORS.store));
        items.push(room('Toilet',      rect(5.5, 4.5, 2.5, 1.5), 3.75, COLORS.bathroom));

        // Furniture
        items.push(furniture('Counter',       'counter',  0.2, 1.5, 2.5, 0.8));
        items.push(furniture('Display Shelf', 'bookcase', 0.2, 3.0, 0.4, 2.8));
        items.push(furniture('Display Shelf', 'bookcase', 1.0, 3.0, 0.4, 2.8));
        items.push(furniture('Display Shelf', 'bookcase', 1.8, 3.0, 0.4, 2.8));
        items.push(furniture('Cash Register', 'monitor',  2.5, 1.6, 0.4, 0.3));
        items.push(furniture('Storage Rack',  'bookcase', 5.7, 0.3, 0.4, 4.0));
        items.push(furniture('Storage Rack',  'bookcase', 6.5, 0.3, 0.4, 4.0));
        items.push(furniture('Toilet Bowl',   'toilet',   5.8, 4.7, 0.5, 0.7));
        items.push(furniture('Hand Basin',    'sink',     6.8, 4.7, 0.5, 0.4));
        items.push(furniture('Chair',         'chair',    3.5, 1.8, 0.5, 0.5));
        items.push(furniture('Small Table',   'table',    3.8, 1.5, 0.8, 0.5));

        return items;
      }
    }

  ]; // end TEMPLATES array

  // ---------------------------------------------------------------------------
  // FPTemplates public API
  // ---------------------------------------------------------------------------
  var FPTemplates = {

    TEMPLATES: TEMPLATES,

    /**
     * Load a template by key and return its array of canvas objects.
     * @param  {string} key  Template key, e.g. 'ng-2bed-bungalow'
     * @return {Array}       Array of wall/door/window/room/furniture objects
     */
    loadTemplate: function (key) {
      var tpl = null;
      for (var i = 0; i < TEMPLATES.length; i++) {
        if (TEMPLATES[i].key === key) { tpl = TEMPLATES[i]; break; }
      }
      if (!tpl) {
        console.warn('[FPTemplates] Unknown template key:', key);
        return [];
      }
      return tpl.build();
    },

    /**
     * Return metadata for all templates (for gallery rendering).
     * @return {Array} Array of { key, name, country, desc, rooms, area }
     */
    getAll: function () {
      return TEMPLATES.map(function (t) {
        return {
          key:     t.key,
          name:    t.name,
          country: t.country,
          desc:    t.desc,
          rooms:   t.rooms,
          area:    t.area
        };
      });
    }

  };

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPTemplates;
  } else {
    global.FPTemplates = FPTemplates;
  }

}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
