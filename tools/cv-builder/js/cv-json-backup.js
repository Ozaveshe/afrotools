(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CVJsonBackup=api;})(typeof window==='undefined'?null:window,function(){
'use strict';
var copy={en:{review:'Review JSON backup',note:'Restore this backup as a new local CV version. Existing saved versions stay available. Nothing is sent online.',confirm:'Replace the current draft with this backup',restore:'Restore backup',cancel:'Cancel',invalid:'This is not a supported CV backup. Check the file and try again.',failed:'The backup could not be saved locally. Your current CV has not changed.',done:'Backup restored locally.',preview:'Backup contents'},fr:{review:'Vérifier la sauvegarde JSON',note:'Restaurez cette sauvegarde comme une nouvelle version locale du CV. Les versions enregistrées restent disponibles. Rien n’est envoyé en ligne.',confirm:'Remplacer le brouillon actuel par cette sauvegarde',restore:'Restaurer la sauvegarde',cancel:'Annuler',invalid:'Cette sauvegarde de CV n’est pas prise en charge. Vérifiez le fichier et réessayez.',failed:'La sauvegarde n’a pas pu être enregistrée localement. Votre CV actuel n’a pas changé.',done:'Sauvegarde restaurée localement.',preview:'Contenu de la sauvegarde'},sw:{review:'Kagua nakala ya JSON',note:'Rejesha nakala hii kama toleo jipya la CV kwenye kifaa hiki. Matoleo yaliyohifadhiwa yatabaki. Hakuna kinachotumwa mtandaoni.',confirm:'Badilisha rasimu ya sasa kwa nakala hii',restore:'Rejesha nakala',cancel:'Ghairi',invalid:'Hii si nakala ya CV inayotumika. Kagua faili kisha ujaribu tena.',failed:'Nakala haikuweza kuhifadhiwa kwenye kifaa hiki. CV yako ya sasa haijabadilika.',done:'Nakala imerejeshwa kwenye kifaa hiki.',preview:'Maudhui ya nakala'}};
function labels(lang){return copy[String(lang||'en').split('-')[0]]||copy.en;}
function invalid(){throw new Error('CV_BACKUP_INVALID');}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function validate(text){
 if(typeof text!=='string'||text.length>10*1024*1024)invalid();
 var value;try{value=JSON.parse(text);}catch(_){invalid();}
 function walk(item,depth){if(depth>30)invalid();if(item&&typeof item==='object')Object.keys(item).forEach(function(key){if(['__proto__','prototype','constructor'].includes(key))invalid();walk(item[key],depth+1);});}
 walk(value,0);
 if(!object(value)||value.version!==1||value.source!=='afrotools-cv-builder'||!object(value.data))invalid();
 if(value.targetRole!==undefined&&typeof value.targetRole!=='string')invalid();
 if(typeof value.country!=='string'||!/^([A-Z]{2,4})$/.test(value.country)||typeof value.template!=='string'||!/^[a-z][a-z0-9-]{0,79}$/.test(value.template))invalid();
 for(var key of ['exps','edus','langs','refs'])if(!Array.isArray(value.data[key])||!value.data[key].every(object))invalid();
 for(var optional of ['projs','certs','customSections'])if(value.data[optional]!==undefined&&(!Array.isArray(value.data[optional])||!value.data[optional].every(object)))invalid();
 if(!object(value.data.skills))invalid();
 var stringFields=['fn','ln','title','email','phoneCode','phone','altPhone','loc','linkedin','web','github','portfolio','summary','photo','dob','nat','mar','so','lga','idNumber','dlStatus'];
 stringFields.forEach(function(key){if(value.data[key]!==undefined&&value.data[key]!==null&&typeof value.data[key]!=='string')invalid();});
 ['skills','extras'].forEach(function(key){if(value.data[key]!==undefined&&(!object(value.data[key])||Object.values(value.data[key]).some(function(v){return typeof v!=='string';})))invalid();});
 ['exps','edus','langs','refs','projs','certs','customSections'].forEach(function(key){(value.data[key]||[]).forEach(function(row){['s','e','y1','y2'].forEach(function(dateKey){if(row[dateKey]!==undefined&&row[dateKey]!==null&&typeof row[dateKey]!=='string')invalid();});if(Object.values(row).some(function(v){return v!==null&&!['string','number','boolean'].includes(typeof v);}))invalid();});});
 for(var color of ['accentColor','accentHex'])if(value[color]!==undefined&&value[color]!==''&&(typeof value[color]!=='string'||!(/^(#[0-9a-f]{3,8}|var\(--[a-z0-9-]+\))$/i.test(value[color]))))invalid();
 if(value.data.photo&& !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value.data.photo))invalid();
 return value;
}
function restore(value,env){
 value=validate(JSON.stringify(value));
 if(!env.hasTemplate(value.template)||(env.hasCountry&&!env.hasCountry(value.country)))invalid();
 var state=env.state,storage=env.storage,keys=['afro_cv_data','afro_cv_master_versions_v1','afro_cv_active_version_id','afro_cv_list'],prior={};
 keys.forEach(function(key){prior[key]=storage.getItem(key);});
 var old={data:state.data,country:state.country,template:state.template,accentColor:state.accentColor,accentHex:state.accentHex,currentCVId:state.currentCVId,dirty:state.dirty,savedCVs:state.savedCVs};
 var snapshot={data:value.data,country:value.country,template:value.template,accentColor:value.accentColor||'var(--color-primary)',accentHex:value.accentHex||'#0062CC'};
 var stamp=new Date().toISOString(),id='cvv_import_'+env.id;
 var store=prior.afro_cv_master_versions_v1?JSON.parse(prior.afro_cv_master_versions_v1):{schema:1,master:Object.assign({id:'master',title:'Master CV'},old),versions:[]};
 if(!object(store)||!object(store.master)||!Array.isArray(store.versions))throw new Error('CV_BACKUP_STORAGE');
 var version=Object.assign({id:id,title:env.title,targetRole:value.targetRole||value.data.title||'',targetOrg:'',jobDescription:'',notes:'',createdAt:stamp,updatedAt:stamp,sourceId:'json-backup',exportHistory:[],atsScoreHistory:[]},snapshot);
 store.versions.unshift(version);store.activeId=id;
 try{
  storage.setItem('afro_cv_data',JSON.stringify(snapshot));storage.setItem('afro_cv_master_versions_v1',JSON.stringify(store));storage.setItem('afro_cv_active_version_id',id);
  var savedCVs=state.savedCVs;if(env.mirror){env.mirror();savedCVs=JSON.parse(storage.getItem('afro_cv_list')||'[]');if(!Array.isArray(savedCVs))throw new Error('CV_BACKUP_STORAGE');}
  if(state.autoSaveTimer)env.clearTimer(state.autoSaveTimer);
  Object.assign(state,snapshot,{currentCVId:id,dirty:false,savedCVs:savedCVs});
 }catch(error){keys.forEach(function(key){try{prior[key]===null?storage.removeItem(key):storage.setItem(key,prior[key]);}catch(_){}});Object.assign(state,old);throw new Error('CV_BACKUP_STORAGE');}
 return version;
}
function knownTemplate(win,id){var legacy=typeof CVTemplates!=='undefined'?CVTemplates:win.CVTemplates;return win.CVTemplateRegistry.all().some(function(item){return item.id===id;})||(legacy&&Object.prototype.hasOwnProperty.call(legacy,id)&&typeof legacy[id]==='function');}
function review(win,container,text){
 var doc=win.document,c=labels(doc.documentElement.lang),backup=validate(text);
 if(!knownTemplate(win,backup.template))invalid();
 if(!Array.from(doc.querySelectorAll('.cv-country-sel option')).some(function(option){return option.value===backup.country;}))invalid();
 var panel=container.querySelector('[data-import-review]'),input=container.querySelector('[data-import-input-panel]');
 panel.replaceChildren();input.hidden=true;panel.hidden=false;
 var heading=doc.createElement('h3');heading.textContent=c.review;panel.appendChild(heading);
 var note=doc.createElement('p');note.textContent=c.note;panel.appendChild(note);
 var preview=doc.createElement('textarea');preview.readOnly=true;preview.rows=8;preview.style.width='100%';preview.setAttribute('aria-label',c.preview);preview.value=JSON.stringify(backup,null,2);panel.appendChild(preview);
 var status=doc.createElement('p');status.setAttribute('role','status');status.dataset.backupStatus='';panel.appendChild(status);
 var button=doc.createElement('button');button.type='button';button.className='cv-btn cv-btn-primary';button.dataset.backupRestore='';button.textContent=c.restore;
 button.addEventListener('click',function(){try{restore(backup,{state:win.CVApp.getState(),storage:win.localStorage,hasTemplate:function(id){return !!knownTemplate(win,id);},hasCountry:function(code){return Array.from(doc.querySelectorAll('.cv-country-sel option')).some(function(option){return option.value===code;});},id:win.crypto.randomUUID(),title:c.review,clearTimer:win.clearTimeout.bind(win),mirror:function(){if(win.CVVersionSystem)win.CVVersionSystem.mirrorSavedList();}});container.classList.remove('open');try{win.CVApp.renderAll();if(win.CVVersionSystem)win.CVVersionSystem.render();}catch(_){/* The saved backup remains available after reload. */}win.CVApp.showToast(c.done);}catch(_){status.textContent=c.failed;}});
 var cancel=doc.createElement('button');cancel.type='button';cancel.className='cv-btn cv-btn-ghost';cancel.textContent=c.cancel;cancel.addEventListener('click',function(){panel.hidden=true;input.hidden=false;container.querySelector('[data-import-file]').value='';container.querySelector('[data-import-text]').focus();});panel.append(button,cancel);button.focus();
 if(container.__backupKeyHandler)container.removeEventListener('keydown',container.__backupKeyHandler);
 container.__backupKeyHandler=function(event){if(panel.hidden)return;if(event.key==='Escape'){event.preventDefault();container.classList.remove('open');if(container.__returnFocus&&container.__returnFocus.isConnected)container.__returnFocus.focus();}if(event.key==='Tab'){var items=Array.from(container.querySelectorAll('button,textarea,input')).filter(function(item){return !item.disabled&&item.getClientRects().length;});var first=items[0],last=items[items.length-1];if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}}};container.addEventListener('keydown',container.__backupKeyHandler);
}
return {validate:validate,restore:restore,review:review,labels:labels};
});
