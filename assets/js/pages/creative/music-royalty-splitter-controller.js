var splitFrench=document.documentElement.lang==='fr';
function splitText(english,french){return splitFrench?french:english;}
function splitEscape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var splitRoles=['Auteur-compositeur','Production','Artiste principal','Beatmaker','Artiste invité','Label','Édition','Management','Coécriture','Mixage'];
var ROLES=['Songwriter','Producer','Lead Artist','Beatmaker','Featured Artist','Label','Publisher','Manager','Co-writer','Mixing Engineer'];
var collabs=[];
var collabId=0;

function addCollab(name,role,pct){
  var id=++collabId;
  collabs.push(id);
  var div=document.createElement('div');
  div.className='collab-row';
  div.id='cr'+id;
  div.innerHTML='<div class="en-field"><label class="en-label">'+splitText('Name','Nom')+'</label><input aria-label="E.g. Davido" type="text" id="cn'+id+'" class="en-input" placeholder="e.g. Davido" value="'+splitEscape(name||'')+'"></div>'+
    '<div class="en-field"><label class="en-label">'+splitText('Role','Rôle')+'</label><select id="cr_role'+id+'" class="en-select" aria-label="Cr Role">'+ROLES.map(function(r,index){return '<option value="'+r+'"'+(r==role?' selected':'')+'>'+splitText(r,splitRoles[index])+'</option>'}).join('')+'</select></div>'+
    '<div class="en-field"><label class="en-label">'+splitText('Split %','Part (%)')+'</label><input aria-label="Cp'+id+'" type="number" id="cp'+id+'" class="en-input" placeholder="25" min="0" max="100" value="'+splitEscape(pct||'')+'" oninput="validateSplits()"></div>'+
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
  var output=document.getElementById('results');if(output)output.classList.remove('on');
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
    el.textContent=splitText('✓ Splits total 100% — ready to calculate','Total de 100 % : le partage peut être calculé.');
  } else {
    el.className='split-validation split-err';
    el.textContent=splitText('Splits total '+t+'% — must equal exactly 100%','Le total est de '+t+' %. Les parts doivent atteindre 100 %.');
  }
}

function fmt(n){return n.toLocaleString(splitText('en-US','fr-FR'),{minimumFractionDigits:2,maximumFractionDigits:2});}

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
    if(result.error==='missing_total')alert(splitText('Please enter total royalties.','Saisissez le montant des redevances.'));
    else if(result.error==='missing_collaborator')alert(splitText('Add at least one collaborator.','Ajoutez au moins un collaborateur.'));
    else alert(splitText('Splits must total exactly 100%. Currently '+result.splitTotal+'%.','Le total des parts est de '+result.splitTotal+' %. Corrigez les parts pour obtenir 100 %.'));
    return;
  }
  var sym=result.symbol;
  if(splitFrench)result.shares.forEach(function(s,i){if(!data[i].name.trim())s.name='Collaborateur '+(i+1);});
  document.getElementById('totalDisplay').textContent='$'+fmt(result.totalUSD);
  document.getElementById('localDisplay').textContent=sym+fmt(result.totalLocal)+' ('+splitText(result.periodLabel,({1:"Mois",3:"Trimestre",12:"Année"})[result.period])+')';
  document.getElementById('periodDisplay').textContent=splitText(result.periodLabel,({1:"Mois",3:"Trimestre",12:"Année"})[result.period]);

  var tableHtml='';
  result.shares.forEach(function(d){
    var w=Math.round(d.pct);
    tableHtml+='<div class="split-row"><div style="flex:1"><div style="font-weight:700">'+splitEscape(d.name)+'</div><div style="font-size:.78rem;color:#64748b">'+splitEscape(splitText(d.role,splitRoles[ROLES.indexOf(d.role)]||d.role))+'</div></div>'+
      '<div class="split-bar-wrap"><div class="split-bar" style="width:'+w+'%"></div></div>'+
      '<div style="text-align:right"><div style="font-weight:800;color:var(--en-accent-dark)">'+d.pct+'%</div><div style="font-size:.85rem;color:#64748b">$'+fmt(d.shareUSD)+'</div><div style="font-size:.85rem;font-weight:600">'+sym+fmt(d.shareLocal)+'</div></div></div>';
  });
  document.getElementById('splitTable').innerHTML=tableHtml;

  var metricsHtml='';
  result.shares.forEach(function(d){
    metricsHtml+='<div class="en-metric"><div class="en-metric-label">'+splitEscape(d.name)+'</div><div class="en-metric-value">'+d.pct+'%</div><div class="en-metric-unit">$'+fmt(d.shareUSD)+' / period</div></div>';
  });
  document.getElementById('metricsRow').innerHTML=metricsHtml;

  var projHtml='';
  result.shares.forEach(function(d){
    var q=d.quarterly;
    projHtml+='<tr><td class="en-td-value">'+splitEscape(d.name)+'<br><span style="font-size:.75rem;color:#64748b">'+splitEscape(splitText(d.role,splitRoles[ROLES.indexOf(d.role)]||d.role))+'</span></td>'+
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
