const COLORS = {
  wall: { r: 238, g: 242, b: 255, index: 7 },
  opening: { r: 96, g: 165, b: 250, index: 5 },
  furniture: { r: 74, g: 222, b: 128, index: 3 },
  fixture: { r: 251, g: 191, b: 36, index: 2 },
  dim: { r: 125, g: 211, b: 252, index: 4 },
  text: { r: 226, g: 232, b: 240, index: 7 },
  boundary: { r: 248, g: 113, b: 113, index: 1 },
  site: { r: 45, g: 212, b: 191, index: 4 },
  landscape: { r: 34, g: 197, b: 94, index: 3 }
};

const BASE_LAYERS = [
  layer("Layer 0", COLORS.wall, 0.25),
  layer("Defpoints", { r: 128, g: 128, b: 128, index: 8 }, 0, { plot: false }),
  layer("A-WALL", COLORS.wall, 0.5),
  layer("A-OPENING", COLORS.opening, 0.25),
  layer("A-FURN", COLORS.furniture, 0.25),
  layer("A-FIXTURE", COLORS.fixture, 0.25),
  layer("A-DIMS", COLORS.dim, 0.18),
  layer("A-TEXT", COLORS.text, 0.18),
  layer("C-BOUNDARY", COLORS.boundary, 0.35),
  layer("C-SITE", COLORS.site, 0.25),
  layer("L-LANDSCAPE", COLORS.landscape, 0.2)
];

function layer(name, color, lineweight, extra = {}) {
  return {
    name,
    color,
    lineweight,
    linetype: extra.linetype || "Continuous",
    visible: true,
    frozen: false,
    locked: false,
    plot: extra.plot !== false
  };
}

function entity(base, layerName, colorKey) {
  return {
    layer: layerName,
    color: COLORS[colorKey] || "bylayer",
    linetype: "Continuous",
    lineweight: layerWeight(layerName),
    visible: true,
    locked: false,
    ...base
  };
}

function layerWeight(layerName) {
  const found = BASE_LAYERS.find((item) => item.name === layerName);
  return found ? found.lineweight : 0.25;
}

function line(x1, y1, x2, y2, layerName = "A-WALL", colorKey = "wall") {
  return entity({ type: "line", start: { x: x1, y: y1 }, end: { x: x2, y: y2 } }, layerName, colorKey);
}

function rect(x, y, width, height, layerName = "A-WALL", colorKey = "wall") {
  return entity({
    type: "polyline",
    vertices: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ],
    closed: true
  }, layerName, colorKey);
}

function circle(x, y, radius, layerName = "A-FIXTURE", colorKey = "fixture") {
  return entity({ type: "circle", center: { x, y }, radius }, layerName, colorKey);
}

function arc(x, y, radius, startAngle, endAngle, layerName = "A-OPENING", colorKey = "opening") {
  return entity({ type: "arc", center: { x, y }, radius, startAngle, endAngle }, layerName, colorKey);
}

function text(value, x, y, height = 160, layerName = "A-TEXT", rotation = 0) {
  return entity({ type: "text", position: { x, y }, text: value, height, rotation }, layerName, "text");
}

function dim(x1, y1, x2, y2, dx, dy, label) {
  return entity({
    type: "dimension",
    dimType: "linear",
    defPoint1: { x: x1, y: y1 },
    defPoint2: { x: x2, y: y2 },
    dimLinePoint: { x: (x1 + x2) / 2 + dx, y: (y1 + y2) / 2 + dy },
    text: label,
    textHeight: 130,
    arrowSize: 90,
    precision: 0
  }, "A-DIMS", "dim");
}

function verticalDim(x1, y1, x2, y2, dx, dy, label) {
  return entity({
    type: "dimension",
    dimType: "aligned",
    defPoint1: { x: x1, y: y1 },
    defPoint2: { x: x2, y: y2 },
    dimLinePoint: { x: (x1 + x2) / 2 + dx, y: (y1 + y2) / 2 + dy },
    text: label,
    textHeight: 130,
    arrowSize: 90,
    precision: 0
  }, "A-DIMS", "dim");
}

function door(x, y, width, orientation = "right") {
  const sign = orientation === "left" ? -1 : 1;
  return [
    line(x, y, x + sign * width, y, "A-OPENING", "opening"),
    arc(x, y, width, 0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, "A-OPENING", "opening")
  ];
}

function windowLine(x1, y1, x2, y2) {
  return [
    line(x1, y1, x2, y2, "A-OPENING", "opening"),
    line(x1, y1 + 80, x2, y2 + 80, "A-OPENING", "opening")
  ];
}

function cloneTemplate(template) {
  return JSON.parse(JSON.stringify(template));
}

function template(id, name, summary, size, limitsMax, entities, tags = []) {
  return {
    id,
    name,
    summary,
    size,
    units: "mm",
    scale: "1:50",
    limitsMin: { x: 0, y: 0 },
    limitsMax,
    layers: BASE_LAYERS,
    tags,
    entities
  };
}

function roomPlan() {
  return [
    rect(0, 0, 6000, 4200),
    rect(150, 150, 5700, 3900),
    line(3600, 150, 3600, 4050),
    line(150, 2400, 3600, 2400),
    ...door(3600, 150, 900, "right"),
    ...door(150, 900, 850, "right"),
    ...windowLine(900, 4050, 2600, 4050),
    ...windowLine(4200, 4050, 5400, 4050),
    rect(520, 2740, 1900, 1100, "A-FURN", "furniture"),
    rect(4050, 2250, 1450, 900, "A-FURN", "furniture"),
    circle(4575, 1125, 380, "A-FURN", "furniture"),
    text("Sleeping", 820, 3650),
    text("Living", 4100, 3650),
    text("Bath", 1100, 2050),
    dim(0, 0, 6000, 0, 0, -620, "6000"),
    verticalDim(6000, 0, 6000, 4200, 650, 0, "4200")
  ];
}

function shopPlan() {
  const shelves = [];
  for (let x = 700; x <= 5700; x += 1250) shelves.push(rect(x, 3600, 850, 300, "A-FURN", "furniture"));
  for (let y = 800; y <= 2900; y += 700) shelves.push(rect(6900, y, 300, 500, "A-FURN", "furniture"));
  return [
    rect(0, 0, 8000, 5000),
    rect(150, 150, 7700, 4700),
    line(0, 1700, 0, 3300, "A-OPENING", "opening"),
    line(6000, 150, 6000, 4850),
    rect(6200, 3300, 1350, 900, "A-FIXTURE", "fixture"),
    rect(5400, 700, 450, 2100, "A-FIXTURE", "fixture"),
    ...shelves,
    text("Sales floor", 2250, 2600),
    text("Storage", 6500, 4550),
    text("Counter", 5450, 2850, 130),
    dim(0, 0, 8000, 0, 0, -700, "8000"),
    verticalDim(8000, 0, 8000, 5000, 760, 0, "5000"),
    dim(6000, 150, 7850, 150, 0, -420, "1850")
  ];
}

function fencePlan() {
  const posts = [];
  for (let x = 0; x <= 30000; x += 3000) {
    if (x < 12000 || x > 18000) posts.push(circle(x, 0, 120, "C-BOUNDARY", "boundary"));
    posts.push(circle(x, 18000, 120, "C-BOUNDARY", "boundary"));
  }
  for (let y = 3000; y <= 15000; y += 3000) {
    posts.push(circle(0, y, 120, "C-BOUNDARY", "boundary"));
    posts.push(circle(30000, y, 120, "C-BOUNDARY", "boundary"));
  }
  return [
    rect(0, 0, 30000, 18000, "C-BOUNDARY", "boundary"),
    line(0, 0, 12000, 0, "C-BOUNDARY", "boundary"),
    line(18000, 0, 30000, 0, "C-BOUNDARY", "boundary"),
    line(12000, 0, 12000, 2600, "A-OPENING", "opening"),
    line(18000, 0, 18000, 2600, "A-OPENING", "opening"),
    line(12000, 2600, 18000, 2600, "A-OPENING", "opening"),
    ...posts,
    text("6 m sliding gate", 12800, 3100, 420),
    text("Fence posts at 3 m centres", 8700, 17500, 420),
    dim(0, 0, 30000, 0, 0, -1400, "30000"),
    verticalDim(30000, 0, 30000, 18000, 1600, 0, "18000"),
    dim(12000, 0, 18000, 0, 0, -700, "6000 gate")
  ];
}

function sitePlan() {
  return [
    rect(0, 0, 24000, 18000, "C-BOUNDARY", "boundary"),
    rect(4200, 4600, 9600, 6800, "A-WALL", "wall"),
    rect(4500, 4900, 9000, 6200, "A-WALL", "wall"),
    rect(13800, 6200, 6700, 3000, "C-SITE", "site"),
    line(17150, 0, 17150, 6200, "C-SITE", "site"),
    line(17150, 9200, 17150, 18000, "C-SITE", "site"),
    circle(3000, 14500, 520, "L-LANDSCAPE", "landscape"),
    circle(20800, 14400, 520, "L-LANDSCAPE", "landscape"),
    circle(20500, 3200, 420, "L-LANDSCAPE", "landscape"),
    text("Building footprint", 5750, 8250, 360),
    text("Driveway", 15100, 7950, 320),
    text("N", 22600, 16000, 520),
    line(22800, 15600, 22800, 17100, "A-TEXT", "text"),
    line(22800, 17100, 22450, 16650, "A-TEXT", "text"),
    line(22800, 17100, 23150, 16650, "A-TEXT", "text"),
    dim(0, 0, 24000, 0, 0, -1500, "24000 plot"),
    verticalDim(24000, 0, 24000, 18000, 1600, 0, "18000 plot"),
    dim(0, 4600, 4200, 4600, 0, -650, "4200 setback")
  ];
}

function classroomPlan() {
  const desks = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) desks.push(rect(1400 + col * 1250, 1600 + row * 850, 650, 380, "A-FURN", "furniture"));
  }
  return [
    rect(0, 0, 9000, 7000),
    rect(150, 150, 8700, 6700),
    rect(2400, 6350, 4200, 280, "A-FIXTURE", "fixture"),
    rect(6600, 5400, 1300, 620, "A-FURN", "furniture"),
    ...desks,
    ...door(150, 900, 950, "right"),
    ...windowLine(1200, 6850, 3300, 6850),
    ...windowLine(5200, 6850, 7600, 6850),
    text("Teaching board", 3420, 6260, 220),
    text("Classroom seating", 2850, 5100, 260),
    dim(0, 0, 9000, 0, 0, -850, "9000"),
    verticalDim(9000, 0, 9000, 7000, 900, 0, "7000")
  ];
}

function kioskPlan() {
  return [
    rect(0, 0, 3000, 2400),
    rect(120, 120, 2760, 2160),
    rect(250, 1600, 2500, 380, "A-FIXTURE", "fixture"),
    rect(230, 420, 520, 900, "A-FURN", "furniture"),
    rect(2250, 420, 520, 900, "A-FURN", "furniture"),
    line(800, 0, 2200, 0, "A-OPENING", "opening"),
    line(800, -180, 2200, -180, "A-OPENING", "opening"),
    line(800, 0, 800, -180, "A-OPENING", "opening"),
    line(2200, 0, 2200, -180, "A-OPENING", "opening"),
    circle(1500, 1170, 260, "A-FIXTURE", "fixture"),
    text("Service hatch", 920, -420, 145),
    text("Counter", 1120, 1860, 130),
    text("Shelves", 340, 1450, 115),
    dim(0, 0, 3000, 0, 0, -560, "3000"),
    verticalDim(3000, 0, 3000, 2400, 560, 0, "2400"),
    dim(800, 0, 2200, 0, 0, -310, "1400 hatch")
  ];
}

export const DRAWING_TEMPLATES = [
  template("room", "Room plan", "One-room interior layout with walls, openings, furniture, and dimensions.", "6000 x 4200", { x: 7000, y: 5200 }, roomPlan(), ["interior", "plan"]),
  template("shop", "Shop plan", "Small retail floor with storage, shelves, counter, entrance, and dimensions.", "8000 x 5000", { x: 9000, y: 6200 }, shopPlan(), ["retail", "plan"]),
  template("fence", "Fence layout", "Plot fence with post spacing, gate opening, boundary, and dimensions.", "30000 x 18000", { x: 33000, y: 20500 }, fencePlan(), ["site", "boundary"]),
  template("site-plan", "Simple site plan", "Plot boundary, building footprint, driveway, landscape markers, and setbacks.", "24000 x 18000", { x: 27000, y: 20500 }, sitePlan(), ["site", "plot"]),
  template("classroom", "Classroom plan", "Teaching room layout with board, desks, openings, and room dimensions.", "9000 x 7000", { x: 10200, y: 8200 }, classroomPlan(), ["education", "plan"]),
  template("kiosk", "Kiosk plan", "Compact kiosk plan with service hatch, counter, storage, and dimensions.", "3000 x 2400", { x: 3800, y: 3200 }, kioskPlan(), ["retail", "small"])
];

export function listDrawingTemplates() {
  return DRAWING_TEMPLATES.map(({ id, name, summary, size, units, scale, tags }) => ({ id, name, summary, size, units, scale, tags }));
}

export function getDrawingTemplate(id) {
  const template = DRAWING_TEMPLATES.find((item) => item.id === id);
  return template ? cloneTemplate(template) : null;
}
