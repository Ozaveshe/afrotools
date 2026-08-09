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

  const result = EngineeringMaterialsEngine.tiles({roomLength:rl,roomWidth:rw,surface:st,wallHeight:wh,doors:doors,windows:windows,tileLengthCm:tile.l,tileWidthCm:tile.w,groutWidthMm:grout*1000,wastagePct:wastePct,pricePerTile:price});
  if (result.error) { alert('Please enter valid dimensions.'); return; }
  const totalArea=result.totalArea,tilesExact=result.tilesExact,wasteTiles=result.wasteTiles,totalTiles=result.totalTiles,tilesPerSqm=result.tilesPerSqm,boxesNeeded=result.boxesNeeded;

  let html = '';
  html += `<div class="result-box"><div class="num">${totalArea.toFixed(1)} m2</div><div class="lbl">Total Area</div></div>`;
  html += `<div class="result-box"><div class="num">${Math.ceil(tilesExact)}</div><div class="lbl">Tiles (Exact)</div></div>`;
  html += `<div class="result-box"><div class="num" style="color:#dc2626">+${wasteTiles}</div><div class="lbl">Wastage (${wastePct}%)</div></div>`;
  html += `<div class="result-box"><div class="num">${totalTiles}</div><div class="lbl">Total to Buy</div></div>`;
  html += `<div class="result-box"><div class="num">${boxesNeeded}</div><div class="lbl">Boxes (~8/box)</div></div>`;
  html += `<div class="result-box"><div class="num">${tilesPerSqm.toFixed(1)}</div><div class="lbl">Tiles per m2</div></div>`;

  document.getElementById('resultGrid').innerHTML = html;
  document.getElementById('resultCard').style.display = 'block';

  // Cost
  if (price > 0) {
    document.getElementById('costSection').style.display = 'block';
    const cost = result.cost;
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
  viz += '<p style="text-align:center;font-size:.68rem;color:#94a3b8;margin-top:6px">Visual representation (blue = tiles, red = wastage)</p>';
  document.getElementById('tileViz').innerHTML = viz;

  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
