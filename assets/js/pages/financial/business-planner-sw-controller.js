(function(){
  "use strict";
  var root=document.querySelector("[data-business-planner-sw]");
  var engine=window.BusinessPlannerEngine;
  if(!root||!engine)return;
  var $=function(s){return root.querySelector(s);};
  var $$=function(s){return Array.prototype.slice.call(root.querySelectorAll(s));};
  var state={country:null,plan:null,fullPlan:{}};
  var countryEl=$("#country-code"),regionEl=$("#region-filter"),searchEl=$("#country-search"),typeEl=$("#business-type"),industryEl=$("#industry"),descEl=$("#business-description");
  var countries=engine.getCountries(),regions=engine.getRegions();
  var countryNames;
  try{countryNames=new Intl.DisplayNames(["sw"],{type:"region"});}catch(_e){countryNames=null;}
  var regionSw={"West Africa":"Afrika Magharibi","East Africa":"Afrika Mashariki","North Africa":"Afrika Kaskazini","Southern Africa":"Afrika Kusini","Central Africa":"Afrika ya Kati"};
  var industrySw={"Agriculture & Agribusiness":"Kilimo na biashara ya kilimo","Technology / Fintech":"Teknolojia na fintech","Food & Beverage":"Chakula na vinywaji","Retail & E-commerce":"Rejareja na biashara mtandaoni","Import/Export & Trading":"Uagizaji, usafirishaji na biashara","Healthcare":"Huduma za afya","Education":"Elimu","Construction / Real Estate":"Ujenzi na mali isiyohamishika","Transportation & Logistics":"Usafiri na lojistiki","Manufacturing":"Uzalishaji","Tourism & Hospitality":"Utalii na ukarimu","Creative & Media":"Ubunifu na vyombo vya habari","Mining & Natural Resources":"Madini na maliasili","Professional Services (Consulting, Legal, Accounting)":"Huduma za kitaalamu","Energy & Utilities":"Nishati na huduma za msingi","Other":"Nyingine"};
  var typeRules=[[/sole proprietorship|sole trader|entreprise individuelle/i,"Biashara ya mtu binafsi"],[/private limited|limited liability|pty ltd|\bltd\b|sarl/i,"Kampuni yenye dhima ndogo"],[/public limited|plc/i,"Kampuni ya umma"],[/partnership/i,"Ubia"],[/cooperative/i,"Ushirika"],[/branch/i,"Tawi la kampuni"],[/one.?person/i,"Kampuni ya mtu mmoja"]];
  function typeSw(v){for(var i=0;i<typeRules.length;i++)if(typeRules[i][0].test(v))return typeRules[i][1]+" — "+v;return v;}
  function displayCountry(c){return countryNames&&countryNames.of(c.code)||c.name;}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(ch){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];});}
  function swText(v){
    return String(v||"")
      .replace(/business days/gi,"siku za kazi").replace(/\bdays\b/gi,"siku").replace(/\bmonths\b/gi,"miezi").replace(/\bmonth\b/gi,"mwezi")
      .replace(/\bFree\b/gi,"Bure").replace(/\bInstant online\b/gi,"Mara moja mtandaoni").replace(/\bImmediate\b/gi,"Mara moja")
      .replace(/Sole proprietorship/gi,"Biashara ya mtu binafsi").replace(/home-based/gi,"inayoendeshwa nyumbani").replace(/small office/gi,"ofisi ndogo").replace(/commercial premises/gi,"eneo la biashara").replace(/employees/gi,"wafanyakazi")
      .replace(/Certificate of Incorporation/gi,"Cheti cha usajili wa kampuni").replace(/Business Name Registration/gi,"usajili wa jina la biashara").replace(/Proof of (business )?address/gi,"Uthibitisho wa anwani ya biashara").replace(/Valid ID/gi,"Kitambulisho halali").replace(/passport photos?/gi,"picha za pasipoti").replace(/Board Resolution/gi,"Azimio la bodi")
      .replace(/Industry-specific license data[^.]*not yet available\./gi,"Taarifa mahususi za leseni za sekta hii bado hazijathibitishwa.").replace(/The AI advisor can help research this\./gi,"Mshauri wa AI anaweza kusaidia kupanga maswali ya kuhakiki.");
  }
  function status(msg,error){var el=$("[data-status]");el.textContent=msg||"";el.classList.toggle("is-error",!!error);}
  function progress(step){$$(".bp-progress span").forEach(function(el){var n=Number(el.dataset.step);el.classList.toggle("is-active",n===step);el.classList.toggle("is-done",n<step);});}
  function populateCountries(){
    var q=searchEl.value.trim().toLowerCase(),region=regionEl.value,current=countryEl.value;
    var options=countries.filter(function(c){return(region==="All"||c.region===region)&&(!q||c.name.toLowerCase().includes(q)||displayCountry(c).toLowerCase().includes(q)||c.code.toLowerCase().includes(q));});
    countryEl.innerHTML='<option value="">Chagua nchi ('+options.length+')</option>'+options.map(function(c){return'<option value="'+c.code+'">'+esc(displayCountry(c))+' ('+c.code+')</option>';}).join("");
    if(options.some(function(c){return c.code===current;}))countryEl.value=current;
  }
  regions.forEach(function(r){regionEl.insertAdjacentHTML("beforeend",'<option value="'+esc(r)+'">'+esc(regionSw[r]||r)+'</option>');});
  engine.getIndustries().forEach(function(v){industryEl.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(industrySw[v]||v)+'</option>');});
  populateCountries(); searchEl.addEventListener("input",populateCountries); regionEl.addEventListener("change",populateCountries);
  countryEl.addEventListener("change",function(){
    state.country=engine.getCountry(countryEl.value); typeEl.innerHTML='<option value="">Chagua muundo</option>';
    if(!state.country){typeEl.disabled=true;return;}
    state.country.registration.types.forEach(function(t){typeEl.insertAdjacentHTML("beforeend",'<option value="'+esc(t.type)+'">'+esc(typeSw(t.type))+'</option>');});
    typeEl.disabled=false; progress(2); status("Nchi imechaguliwa. Jaza maelezo ya biashara.");
  });
  descEl.addEventListener("input",function(){$("[data-char-count]").textContent=String(descEl.value.length);});
  function phase(title,body,open){return'<details class="bp-phase"'+(open?' open':'')+'><summary>'+esc(title)+'</summary><div class="bp-phase-body">'+body+'</div></details>';}
  function check(text){return'<label class="bp-step"><input type="checkbox" data-plan-check><span>'+swText(esc(text))+'</span></label>';}
  function list(items){return'<ul class="bp-list">'+items.map(function(x){return'<li>'+swText(esc(x))+'</li>';}).join("")+'</ul>';}
  function link(url,label){return url?'<p class="bp-source"><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a></p>':"";}
  function renderPlan(p){
    var html='<div class="bp-facts"><div class="bp-fact"><span>Nchi</span><strong>'+esc(displayCountry({code:p.countryCode,name:p.country}))+'</strong></div><div class="bp-fact"><span>Sarafu</span><strong>'+esc(p.currency.code+' ('+p.currency.symbol+')')+'</strong></div><div class="bp-fact"><span>Eneo</span><strong>'+esc(regionSw[p.region]||p.region)+'</strong></div></div>';
    var r=p.phase1_registration;
    html+=phase('Awamu ya 1: Usajili wa biashara','<p><strong>Mamlaka:</strong> '+esc(r.authority)+'</p>'+link(r.website,'Fungua tovuti rasmi ya mamlaka')+'<p><strong>Gharama iliyohifadhiwa:</strong> '+esc(p.currency.symbol+' '+Number(r.estimatedCost).toLocaleString('sw'))+' · <strong>Muda:</strong> '+swText(esc(r.estimatedTimeline))+'</p><h4>Hatua</h4>'+r.steps.map(check).join('')+'<h4>Mahitaji</h4>'+list(r.requirements),true);
    var t=p.phase2_tax, taxes=t.applicableTaxes||[];
    html+=phase('Awamu ya 2: Usajili wa kodi na uzingatiaji','<p><strong>Mamlaka:</strong> '+esc(t.authority)+'</p>'+link(t.website,'Fungua tovuti rasmi ya mamlaka ya kodi')+'<h4>Kodi zinazoweza kutumika</h4>'+(taxes.length?taxes.map(function(x){return check(x.name+' — '+x.rate+(x.note?' ('+swText(x.note)+')':''));}).join(''):'<p>Hakuna kodi iliyolingana na muundo huu katika data iliyohifadhiwa. Thibitisha moja kwa moja kwa mamlaka.</p>')+'<h4>Tarehe za kuwasilisha za kuhakiki</h4>'+list(t.filingDeadlines.map(function(x){return x.tax+': '+x.deadline;})));
    var l=p.phase3_licenses,licenses=(l.generalLicenses||[]).concat(l.industryLicenses||[]);
    html+=phase('Awamu ya 3: Leseni na vibali',(licenses.length?licenses.map(function(x){return check(x.name+' — '+x.authority+'; '+swText(x.cost)+', '+swText(x.timeline)+(x.note?' — '+swText(x.note):''));}).join(''):'<p>Hakuna leseni mahususi katika data iliyohifadhiwa.</p>')+(l.note?'<p class="bp-warning">'+swText(esc(l.note))+'</p>':''));
    var b=p.phase4_banking;
    html+=phase('Awamu ya 4: Benki ya biashara','<p><strong>Muda uliokadiriwa:</strong> '+swText(esc(b.estimatedTimeline))+'</p><h4>Benki za kulinganisha</h4>'+list(b.recommendedBanks)+'<h4>Mahitaji ya akaunti</h4>'+list(b.requirements));
    var follow=['Hifadhi cheti cha usajili, namba ya kodi, risiti na rejea za maombi katika folda moja.','Thibitisha kama leseni za eneo, biashara, afya, taaluma au sekta zinahitaji kufanywa upya kila mwaka.','Tengeneza kalenda ya kodi kutoka mwongozo wa '+t.authority+' kabla ya kipindi cha kwanza cha kuwasilisha.','Uliza benki kuhusu KYC, azimio la bodi, wamiliki halisi na masharti ya ufuatiliaji.','Kagua tena kurasa za '+r.authority+' na '+t.authority+' kabla ya kulipa, kuwasilisha au kutaja muda.'];
    html+=phase('Awamu ya 5: Ufuatiliaji na ukaguzi wa kufanywa upya',follow.map(check).join(''));
    html+=phase('Makadirio ya gharama','<div class="bp-costs">'+[['Bajeti ndogo',p.costEstimate.low],['Bajeti ya kati',p.costEstimate.medium],['Bajeti kubwa',p.costEstimate.high]].map(function(x){return'<div class="bp-cost"><span>'+x[0]+'</span><strong>'+esc(x[1].range)+'</strong><p>'+swText(esc(x[1].description))+'</p></div>';}).join('')+'</div>');
    $("[data-plan]").innerHTML=html;
    $("[data-plan-title]").textContent=displayCountry({code:p.countryCode,name:p.country})+' — '+typeSw(p.businessType);
    $("[data-disclaimer]").textContent='Mwongozo wa kupanga tu; si ushauri wa kisheria, kodi, fedha, benki au leseni. Ada, vizingiti, fomu, tarehe na masharti hubadilika. Thibitisha kwa '+r.authority+' na '+t.authority+' kabla ya kuchukua hatua.';
    $("[data-results]").hidden=false; $$('[data-plan-check]').forEach(function(el){el.addEventListener('change',updateChecklist);}); updateChecklist(); progress(3);
  }
  function updateChecklist(){var all=$$('[data-plan-check]'),done=all.filter(function(x){return x.checked;}).length,pct=all.length?Math.round(done/all.length*100):0;$("[data-progress]").value=pct;$("[data-progress-label]").textContent=pct+'%';}
  function generate(){
    if(!countryEl.value){status('Chagua nchi kwanza.',true);countryEl.focus();return;}
    if(!typeEl.value){status('Chagua muundo wa kisheria.',true);typeEl.focus();return;}
    if(!industryEl.value){status('Chagua sekta.',true);industryEl.focus();return;}
    state.plan=engine.generateActionPlan({countryCode:countryEl.value,businessType:typeEl.value,industry:industryEl.value,hasEmployees:$('input[name="employees"]:checked').value==='yes'});
    if(!state.plan||state.plan.error){status('Mpango haukuweza kutengenezwa. Kagua nchi uliyochagua.',true);return;}
    renderPlan(state.plan);status('Mpango wa hatua umetengenezwa ndani ya kivinjari.');$("[data-results]").scrollIntoView({block:'start'});
  }
  $("[data-generate]").addEventListener('click',generate);
  $("[data-reset]").addEventListener('click',function(){searchEl.value='';regionEl.value='All';populateCountries();countryEl.value='';typeEl.innerHTML='<option value="">Chagua nchi kwanza</option>';typeEl.disabled=true;industryEl.value='';descEl.value='';$('input[name="employees"][value="no"]').checked=true;$("[data-char-count]").textContent='0';$("[data-results]").hidden=true;state={country:null,plan:null,fullPlan:{}};progress(1);status('Fomu imerejeshwa mwanzo.');countryEl.focus();});
  $("[data-print]").addEventListener('click',function(){window.print();});
  function pdfLines(p){
    var lines=['MPANGO WA HATUA WA BIASHARA',displayCountry({code:p.countryCode,name:p.country})+' — '+typeSw(p.businessType),'Sarafu: '+p.currency.code,'','AWAMU YA 1 — USAJILI','Mamlaka: '+p.phase1_registration.authority,'Gharama: '+p.currency.symbol+' '+p.phase1_registration.estimatedCost,'Muda: '+swText(p.phase1_registration.estimatedTimeline)].concat(p.phase1_registration.steps.map(function(x,i){return(i+1)+'. '+swText(x);}));
    lines.push('','AWAMU YA 2 — KODI','Mamlaka: '+p.phase2_tax.authority);p.phase2_tax.applicableTaxes.forEach(function(x){lines.push(x.name+': '+x.rate);});
    lines.push('','AWAMU YA 3 — LESENI');p.phase3_licenses.generalLicenses.concat(p.phase3_licenses.industryLicenses).forEach(function(x){lines.push(x.name+' — '+x.authority+'; '+swText(x.cost)+', '+swText(x.timeline));});
    lines.push('','AWAMU YA 4 — BENKI','Benki: '+p.phase4_banking.recommendedBanks.join(', '));p.phase4_banking.requirements.forEach(function(x){lines.push('• '+swText(x));});
    lines.push('','AWAMU YA 5 — UTHIBITISHAJI','Thibitisha ada, fomu, tarehe, leseni na mahitaji ya benki kwa mamlaka rasmi kabla ya kuchukua hatua.','','KANUSHO','Mwongozo wa kupanga tu; si ushauri rasmi wa kisheria, kodi, fedha, benki au leseni.');return lines;
  }
  $("[data-pdf]").addEventListener('click',function(){
    if(!state.plan||!window.jspdf){status('Maktaba ya PDF haipatikani kwa sasa.',true);return;}
    var doc=new window.jspdf.jsPDF(),y=18,pageH=doc.internal.pageSize.getHeight();doc.setProperties({title:'Mpango wa biashara — '+state.plan.country,subject:'Mpango wa hatua wa ndani ya kivinjari',author:'AfroTools'});
    pdfLines(state.plan).forEach(function(line){var parts=doc.splitTextToSize(String(line),170);if(y+parts.length*6>pageH-18){doc.addPage();y=18;}doc.setFontSize(/^AWAMU|^MPANGO|^KANUSHO/.test(line)?12:9);doc.text(parts,20,y);y+=parts.length*6;});
    doc.save('mpango-wa-biashara-'+state.plan.countryCode.toLowerCase()+'.pdf');status('PDF imepakuliwa. Fungua na uhakiki kabla ya kuitumia.');
  });
  function aiContext(){return{country:state.plan.country,countryCode:state.plan.countryCode,businessType:state.plan.businessType,industry:industryEl.value,description:descEl.value,hasEmployees:$('input[name="employees"]:checked').value==='yes',startupCost:state.plan.costEstimate.medium.range,currency:state.plan.currency.symbol+' '+state.plan.currency.code,currencyCode:state.plan.currency.code};}
  $("[data-advisor]").addEventListener('click',async function(){
    var out=$("[data-advisor-output]"),question=$("#advisor-question").value.trim();if(!state.plan){out.textContent='Tengeneza mpango wa hatua kwanza.';return;}if(!$("#advisor-consent").checked){out.textContent='AI ni hiari. Weka alama ya ridhaa baada ya kuondoa taarifa binafsi.';$("#advisor-consent").focus();return;}if(!question){out.textContent='Andika swali kabla ya kutuma.';$("#advisor-question").focus();return;}
    var today=(new Date()).toISOString().slice(0,10),usage={date:today,count:0};try{usage=JSON.parse(localStorage.getItem('afrotools_business_advisor_usage')||'null')||usage;}catch(_e){}if(usage.date!==today)usage={date:today,count:0};if(usage.count>=3){out.textContent='Maswali matatu ya bure ya leo yametumika. Mpango wa hatua wa ndani ya kivinjari bado unapatikana.';return;}
    this.disabled=true;out.textContent='Inasubiri jibu la AI…';var ctx=aiContext();var prompt='Jibu kwa Kiswahili. Usibuni ada, vizingiti, tarehe, muda, masharti ya benki au URL. Taja mamlaka ya kuhakiki ikiwa sheria inaweza kubadilika. Muktadha: '+JSON.stringify(ctx)+'\nSwali: '+question;
    try{var res=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json','X-AfroTools-AI-Consent':'accepted'},body:JSON.stringify({aiConsent:'accepted',toolId:'business-planner',messages:[{role:'user',content:prompt}]})});var data=await res.json();if(!res.ok||data.error)throw new Error(data.error||'AI error');usage.count+=1;try{localStorage.setItem('afrotools_business_advisor_usage',JSON.stringify(usage));}catch(_e){}out.textContent=data.content||data.response||data.reply||data.message||'Hakuna jibu lililopokelewa.';}catch(_e){out.textContent='Mshauri wa AI hapatikani kwa sasa. Mpango wa hatua uliopo juu bado unafanya kazi ndani ya kivinjari.';}finally{this.disabled=false;}
  });
  var proSections=[['executive-summary','Muhtasari wa utendaji'],['market-analysis','Uchambuzi wa soko'],['financial-projections','Makadirio ya miaka mitatu'],['swot','Uchambuzi wa SWOT'],['funding-strategy','Mkakati wa ufadhili']];
  $("[data-full-plan]").addEventListener('click',async function(){
    var out=$("[data-full-plan-output]");if(!state.plan){out.textContent='Tengeneza mpango wa hatua kwanza.';return;}if(!$("#full-plan-consent").checked){out.textContent='Weka alama ya ridhaa kabla ya kutuma maelezo kwa AI.';$("#full-plan-consent").focus();return;}
    var isPro=window.AfroProGate&&await window.AfroProGate.isPro();if(!isPro){out.textContent='Mpango kamili wa AI ni wa Pro. Mpango wa hatua na PDF hapo juu hubaki bure bila akaunti.';return;}
    this.disabled=true;state.fullPlan={};out.textContent='Inatengeneza sehemu 1/5…';var ctx=aiContext();
    for(var i=0;i<proSections.length;i++){var sec=proSections[i];out.textContent='Inatengeneza '+sec[1]+' ('+(i+1)+'/5)…';try{var res=await fetch('/.netlify/functions/ai-business-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({section:sec[0]},ctx))});var data=await res.json();if(res.ok&&data.content)state.fullPlan[sec[0]]=data.content;}catch(_e){/* Continue section by section, as English owner does. */}}
    var keys=Object.keys(state.fullPlan);out.innerHTML=keys.length?proSections.filter(function(s){return state.fullPlan[s[0]];}).map(function(s){return'<h4>'+esc(s[1])+'</h4><p>'+esc(state.fullPlan[s[0]])+'</p>';}).join(''):'Hakuna sehemu iliyotengenezwa. Kagua muunganisho na ujaribu tena.';$("[data-full-plan-pdf]").hidden=!keys.length;this.disabled=false;
  });
  $("[data-full-plan-pdf]").addEventListener('click',function(){
    if(!state.plan||!Object.keys(state.fullPlan).length||!window.jspdf)return;var doc=new window.jspdf.jsPDF(),y=18,pageH=doc.internal.pageSize.getHeight();doc.setProperties({title:'Mpango kamili wa biashara — '+state.plan.country,subject:'Mpango wa biashara uliosaidiwa na AI',author:'AfroTools'});var lines=['MPANGO KAMILI WA BIASHARA',displayCountry({code:state.plan.countryCode,name:state.plan.country})+' — '+typeSw(state.plan.businessType),'Sekta: '+(industrySw[industryEl.value]||industryEl.value),''];proSections.forEach(function(s){if(state.fullPlan[s[0]])lines.push(s[1].toUpperCase(),String(state.fullPlan[s[0]]),'');});lines.push('UTHIBITISHAJI','Maudhui ya AI yanaweza kukosea. Thibitisha ada, sheria, soko, makadirio na vyanzo kwa mamlaka au mtaalamu kabla ya kutumia.');lines.forEach(function(line){var parts=doc.splitTextToSize(line,170);if(y+parts.length*6>pageH-18){doc.addPage();y=18;}doc.setFontSize(/^[A-Z0-9 _–-]+$/.test(line)&&line.length<50?12:9);doc.text(parts,20,y);y+=parts.length*6;});doc.save('mpango-kamili-wa-biashara-'+state.plan.countryCode.toLowerCase()+'.pdf');status('PDF ya mpango kamili imepakuliwa. Thibitisha maudhui ya AI kabla ya kuitumia.');
  });
})();
