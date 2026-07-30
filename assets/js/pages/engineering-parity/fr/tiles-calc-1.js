const surfaceType = document.getElementById('surfaceType');
const wallRow = document.getElementById('wallRow');
const windowRow = document.getElementById('windowRow');
const tileSizeSelect = document.getElementById('tileSize');
const customTileRow = document.getElementById('customTileRow');
const patternSelect = document.getElementById('pattern');

surfaceType.addEventListener('change', () => {
  const showWall = surfaceType.value !== 'floor';
  wallRow.style.display = showWall ? 'grid' : 'none';
  windowRow.style.display = showWall ? 'grid' : 'none';
});
tileSizeSelect.addEventListener('change', () => {
  customTileRow.style.display = tileSizeSelect.value === 'custom' ? 'grid' : 'none';
});
patternSelect.addEventListener('change', () => {
  const w = document.getElementById('wastage');
  const p = patternSelect.value;
  if (p === 'straight' || p === 'brick') w.value = 10;
  else if (p === 'diagonal') w.value = 15;
  else if (p === 'herringbone') w.value = 18;
});

function getTileSize() {
  const val = tileSizeSelect.value;
  if (val === 'custom') return { l: +document.getElementById('customTileL').value, w: +document.getElementById('customTileW').value };
  const [l, w] = val.split('x').map(Number);
  return { l, w };
}

function calculate() {
  const rl = +document.getElementById('roomLength').value;
  const rw = +document.getElementById('roomWidth').value;
  const st = surfaceType.value;
  const wh = +document.getElementById('wallHeight').value;
  const doors = +document.getElementById('doorCount').value;
  const windows = +document.getElementById('windowCount').value;
  const tile = getTileSize();
  const grout = +document.getElementById('groutWidth').value / 1000; // mm to m
  const wastePct = +document.getElementById('wastage').value;
  const price = +document.getElementById('pricePerTile').value;

  // Tile area including grout
  const tileL = (tile.l / 100) + grout;
  const tileW = (tile.w / 100) + grout;
  const tileArea = tileL * tileW;

  let totalArea = 0;
  let floorArea = 0;
  let wallArea = 0;

  if (st === 'floor' || st === 'both') {
    floorArea = rl * rw;
    totalArea += floorArea;
  }
  if (st === 'wall' || st === 'both') {
    const perimeter = 2 * (rl + rw);
    wallArea = perimeter * wh;
    wallArea -= doors * 1.68; // standard door 0.8m x 2.1m
    wallArea -= windows * 1.44; // standard window 1.2m x 1.2m
    wallArea = Math.max(0, wallArea);
    totalArea += wallArea;
  }

  const tilesExact = totalArea / tileArea;
  const wasteTiles = Math.ceil(tilesExact * (wastePct / 100));
  const totalTiles = Math.ceil(tilesExact) + wasteTiles;
  const tilesPerSqm = 1 / ((tile.l / 100) * (tile.w / 100));
  const boxesNeeded = Math.ceil(totalTiles / 8); // typical box of 8

  let html = '';
  html += `<div class="result-box"><div class="num">${totalArea.toFixed(1)} m2</div><div class="lbl">Total Surface</div></div>`;
  html += `<div class="result-box"><div class="num">${Math.ceil(tilesExact)}</div><div class="lbl">Carreaux exacts</div></div>`;
  html += `<div class="result-box"><div class="num" style="color:#dc2626">+${wasteTiles}</div><div class="lbl">Chutes (${wastePct}%)</div></div>`;
  html += `<div class="result-box"><div class="num">${totalTiles}</div><div class="lbl">Total à acheter</div></div>`;
  html += `<div class="result-box"><div class="num">${boxesNeeded}</div><div class="lbl">Boîtes (environ 8 par boîte)</div></div>`;
  html += `<div class="result-box"><div class="num">${tilesPerSqm.toFixed(1)}</div><div class="lbl">Carreaux par m²</div></div>`;

  document.getElementById('resultGrid').innerHTML = html;
  document.getElementById('resultCard').style.display = 'block';

  // Cost
  if (price > 0) {
    document.getElementById('costSection').style.display = 'block';
    const cost = totalTiles * price;
    document.getElementById('costValue').textContent = cost.toLocaleString('en-NG', { maximumFractionDigits: 0 });
    document.getElementById('costNote').textContent = `${totalTiles} tiles x ${price.toLocaleString()} per tile`;
  } else {
    document.getElementById('costSection').style.display = 'none';
  }

  // Visualization
  const vizCols = Math.min(Math.round(rl / (tile.l / 100)), 20);
  const vizRows = Math.min(Math.round(rw / (tile.w / 100)), 15);
  const vizTotal = vizCols * vizRows;
  const vizWaste = Math.round(vizTotal * (wastePct / 100));
  let viz = `<div class="tile-viz" style="grid-template-columns:repeat(${vizCols},1fr)">`;
  for (let i = 0; i < vizTotal; i++) viz += '<div></div>';
  for (let i = 0; i < Math.min(vizWaste, vizCols); i++) viz += '<div class="waste"></div>';
  viz += '</div>';
  viz += '<p style="text-align:center;font-size:.68rem;color:#94a3b8;margin-top:6px">Représentation visuelle (bleu = carreaux, rouge = chutes)</p>';
  document.getElementById('tileViz').innerHTML = viz;

  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
