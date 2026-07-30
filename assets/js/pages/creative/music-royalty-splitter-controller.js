var ROLES=['Songwriter','Producer','Lead Artist','Beatmaker','Featured Artist','Label','Publisher','Manager','Co-writer','Mixing Engineer'];
var collabs=[];
var collabId=0;

function addCollab(name,role,pct){
  var id=++collabId;
  collabs.push(id);
  var div=document.createElement('div');
  div.className='collab-row';
  div.id='cr'+id;
  div.innerHTML='<div class="en-field"><label class="en-label">Name</label><input aria-label="E.g. Davido" type="text" id="cn'+id+'" class="en-input" placeholder="e.g. Davido" value="'+(name||'')+'"></div>'+
    '<div class="en-field"><label class="en-label">Role</label><select id="cr_role'+id+'" class="en-select" aria-label="Cr Role">'+ROLES.map(function(r){return '<option'+(r==role?' selected':'')+'>'+r+'</option>'}).join('')+'</select></div>'+
    '<div class="en-field"><label class="en-label">Split %</label><input aria-label="Cp'+id+'" type="number" id="cp'+id+'" class="en-input" placeholder="25" min="0" max="100" value="'+(pct||'')+'" oninput="validateSplits()"></div>'+
    '<button type="button" class="remove-btn" onclick="removeCollab('+id+')" title="Remove">&times;</button>';
  document.getElementById('collabList').appendChild(div);
  validateSplits();
}

function removeCollab(id){
  var idx=collabs.indexOf(id);
  if(idx>-1) collabs.splice(idx,1);
  var el=document.getElementById('cr'+id);
  if(el) el.remove();
  validateSplits();
}

function validateSplits(){
  var owner=window.AfroTools&&window.AfroTools.MusicRoyaltySplitterEngine;
  if(!owner)throw new Error('MusicRoyaltySplitterEngine is unavailable');
  var total=owner.roundedPercent(collabs.map(function(id){
    return{pct:(document.getElementById('cp'+id)||{}).value};
  }));
  var el=document.getElementById('splitValidation');
  if(collabs.length===0){el.style.display='none';return;}
  el.style.display='block';
  var t=total;
  if(t===100){
    el.className='split-validation split-ok';
    el.textContent='✓ Splits total 100% — ready to calculate';
  } else {
    el.className='split-validation split-err';
    el.textContent='⚠ Splits total '+t+'% — must equal exactly 100%';
  }
}

function fmt(n){return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}

function calculate(){
  var data=collabs.map(function(id){
    return{id:id,name:document.getElementById('cn'+id).value,role:document.getElementById('cr_role'+id).value,pct:document.getElementById('cp'+id).value};
  });
  var owner=window.AfroTools&&window.AfroTools.MusicRoyaltySplitterEngine;
  if(!owner)throw new Error('MusicRoyaltySplitterEngine is unavailable');
  var result=owner.calculate({
    title:document.getElementById('songTitle').value,
    country:document.getElementById('country').value,
    totalRoyalties:document.getElementById('totalRoyalties').value,
    period:document.getElementById('period').value,
    collaborators:data
  });
  if(!result.ok){
    if(result.error==='missing_total')alert('Please enter total royalties.');
    else if(result.error==='missing_collaborator')alert('Add at least one collaborator.');
    else alert('Splits must total exactly 100%. Currently '+result.splitTotal+'%.');
    return;
  }
  var sym=result.symbol;
  document.getElementById('totalDisplay').textContent='$'+fmt(result.totalUSD);
  document.getElementById('localDisplay').textContent=sym+fmt(result.totalLocal)+' ('+result.periodLabel+')';
  document.getElementById('periodDisplay').textContent=result.periodLabel;

  var tableHtml='';
  result.shares.forEach(function(d){
    var w=Math.round(d.pct);
    tableHtml+='<div class="split-row"><div style="flex:1"><div style="font-weight:700">'+d.name+'</div><div style="font-size:.78rem;color:#64748b">'+d.role+'</div></div>'+
      '<div class="split-bar-wrap"><div class="split-bar" style="width:'+w+'%"></div></div>'+
      '<div style="text-align:right"><div style="font-weight:800;color:var(--en-accent-dark)">'+d.pct+'%</div><div style="font-size:.85rem;color:#64748b">$'+fmt(d.shareUSD)+'</div><div style="font-size:.85rem;font-weight:600">'+sym+fmt(d.shareLocal)+'</div></div></div>';
  });
  document.getElementById('splitTable').innerHTML=tableHtml;

  var metricsHtml='';
  result.shares.forEach(function(d){
    metricsHtml+='<div class="en-metric"><div class="en-metric-label">'+d.name+'</div><div class="en-metric-value">'+d.pct+'%</div><div class="en-metric-unit">$'+fmt(d.shareUSD)+' / period</div></div>';
  });
  document.getElementById('metricsRow').innerHTML=metricsHtml;

  var projHtml='';
  result.shares.forEach(function(d){
    var q=d.quarterly;
    projHtml+='<tr><td class="en-td-value">'+d.name+'<br><span style="font-size:.75rem;color:#64748b">'+d.role+'</span></td>'+
      '<td>$'+fmt(q)+'</td><td>$'+fmt(q)+'</td><td>$'+fmt(q)+'</td><td class="en-td-highlight">$'+fmt(q*4)+'</td></tr>';
  });
  document.getElementById('projTable').innerHTML=projHtml;

  document.getElementById('results').classList.add('on');
  if(window.AfroToolsCreativeResultActions)window.AfroToolsCreativeResultActions.publish({slug:'music-royalty-split',title:'Music royalty split',result:result});
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
}

// Initialise with 3 default collaborators
addCollab('','Songwriter',40);
addCollab('','Producer',30);
addCollab('','Lead Artist',30);
document.getElementById('splitValidation').style.display='none';
