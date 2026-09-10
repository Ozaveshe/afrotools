(function(){
  'use strict';
  const age=(date,now)=>date && Number.isFinite(Date.parse(date))?(now-Date.parse(date))/3600000:Infinity;
  function latestChecks(rows){const seen=new Set();return rows.slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).filter(r=>{const key=r.name+'|'+r.branch;if(seen.has(key))return false;seen.add(key);return true;});}
  function advice(engine,snapshot,now=Date.now()) {
    const items=[];
    const add=(rank,title,evidence,next,view)=>items.push({rank,title,evidence,next,view});
    if(!engine || age(engine.collected_at,now)>2)add(0,'Refresh operational evidence',engine?'The last PC sync is older than two hours.':'No operational summary is available.','Check that this PC and the hourly sync are running.','work');
    if(engine){
      for(const [key,label] of [['git','Git'],['automations','Automation receipts'],['ci','GitHub checks'],['pulls','Pull requests'],['runtime','Feed runs']])if(engine[key]?.status!=='ok')add(1,label+' evidence needs attention','Source status: '+(engine[key]?.status||'unavailable')+'.','Restore this source before relying on its counts.',key==='git'||key==='pulls'?'work':'automations');
      const checks=latestChecks(engine.ci?.rows||[]).filter(r=>['failure','timed_out','action_required'].includes(r.conclusion)&&age(r.created_at,now)<48);
      if(checks.length)add(1,checks.length+' latest GitHub checks need review','Latest observed run per workflow and branch; last 48 hours.','Open the failing run and resolve its reported check.','automations');
      const failed=(engine.runtime?.rows||[]).filter(r=>r.failures_24h>0);
      if(failed.length)add(1,failed.length+' feed jobs recorded failures','Failures in the 24-hour window at the feed-check timestamp.','Inspect the affected feed job before accepting freshness.','automations');
      const lanes=engine.automations?.rows||[],blocked=lanes.filter(r=>['blocked','quarantined','invalid receipt'].includes(r.disposition));
      if(engine.automations?.invalid_receipts>0)add(1,'Repair invalid automation receipts','Receipt validation rejected one or more current or historical records.','Inspect the receipt validator before accepting this queue as complete.','automations');
      if(blocked.length)add(2,blocked.length+' automation lanes need a decision','Latest recorded receipt per lane; older results are marked stale.','Review the receipt and decide whether to repair or retire the lane.','automations');
      const ready=lanes.filter(r=>r.disposition==='ready'&&r.integrated!==true);
      if(ready.length)add(3,ready.length+' producer results awaiting review','A ready receipt is a candidate, not proof of merge or deployment.','Check dependencies and send eligible work through the publisher.','automations');
      const work=engine.git?.rows||[],pending=work.filter(r=>r.ahead>0||r.dirty>0||r.untracked>0);
      if(pending.length)add(4,pending.length+' workspaces have pending work','Commits outside the observed main branch, or local file changes.','Choose the work to finish and review its diff.','work');
      const old=work.filter(r=>r.stale&&r.behind>0);
      if(old.length)add(5,old.length+' older workspaces are behind main','Last commit older than seven days. This does not prove inactivity.','Inspect and preserve any work before updating or retiring the workspace.','work');
    }
    if(snapshot){
      const previews=snapshot.pro.filter(r=>r.status!=='active');
      if(previews.length)add(5,previews.length+' Pro apps need completion','Registry marks these apps as preview or shell.','Select an app and complete its recorded next readiness step.','pro');
      const low=Number(snapshot.quality?.score_distribution_rows?.F||0)+Number(snapshot.quality?.score_distribution_rows?.D||0);
      if(low)add(5,low+' tools in the lowest quality bands','D/F grades from the dated repository report; not a live acceptance test.','Refresh quality evidence, then verify the affected workflows.','health');
      const due=snapshot.sources.filter(r=>r.status==='review overdue').length;
      if(due)add(6,due+' source reviews due','Cadence evaluated at the repository snapshot date.','Review the dated source and update affected product facts.','source-review');
      if(age(snapshot.quality?.generated_at,now)>168)add(4,'Refresh the product quality audit','The available quality report is older than seven days or undated.','Run the quality audit and browser smoke before prioritizing repairs.','health');
    }
    return items.sort((a,b)=>a.rank-b.rank);
  }
  if(typeof module==='object'&&module.exports){module.exports={advice,latestChecks};return;}
  const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let engine=null,snapshot=null,expanded=false;
  const stamp=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'Not observed';
  const count=value=>typeof value==='number'?value.toLocaleString('en'):'—';
  const pill=(text,tone='')=>'<span class="status-pill '+tone+'">'+esc(text)+'</span>';
  const commit=value=>value?'<code>'+esc(value.slice(0,12))+'</code>':'—';
  function table(id,heads,rows){$(id).innerHTML=rows.length?'<table><thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((v,i)=>'<td data-label="'+heads[i]+'">'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'<p class="ops-empty">No matching records. Check the source status above.</p>';}
  function renderAdvice(){
    const items=advice(engine,snapshot);
    $('morning-list').innerHTML=(expanded?items:items.slice(0,4)).map((r,i)=>'<button class="intelligence-row" data-open-view="'+r.view+'"><span class="priority-number '+(r.rank<3?'priority-alert':'')+'">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(r.title)+'</strong><small>'+esc(r.evidence)+'</small><span class="intelligence-next">'+esc(r.next)+'</span></span><span aria-hidden="true">↗</span></button>').join('')||'<p class="ops-empty">No matching review signals in the available evidence.</p>';
    $('inbox-count').textContent=items.length+' priorities';
    $('inbox-expand').hidden=items.length<=4;$('inbox-expand').textContent=expanded?'Show top priorities':'Show all '+items.length+' priorities';$('inbox-expand').setAttribute('aria-expanded',String(expanded));
    const work=engine?.git?.status==='unavailable'?null:engine?.git?.rows,lanes=engine?.automations?.status==='unavailable'?null:engine?.automations?.rows;
    const values=[['Pending workspaces',work?.filter(r=>r.ahead>0||r.dirty>0||r.untracked>0).length,'Compared with observed main'],['Ready results',lanes?.filter(r=>r.disposition==='ready'&&r.integrated!==true).length,'Awaiting publisher review'],['Blocked / held',lanes?.filter(r=>['blocked','quarantined','invalid receipt'].includes(r.disposition)).length,'Latest recorded receipts'],['Pro apps to complete',snapshot?.pro.filter(r=>r.status!=='active').length,'Registry preview / shell']];
    $('engine-metrics').innerHTML=values.map(([label,value,note])=>'<article class="metric"><div class="metric-top"><span>'+label+'</span></div><strong>'+count(value)+'</strong><small>'+note+'</small></article>').join('');
  }
  function renderWork(){
    const git=engine?.git, query=$('work-search').value.toLowerCase(),filter=$('work-filter').value;
    $('git-evidence').textContent=git?'Git: '+git.status+' · main '+(git.base_sha?.slice(0,12)||'unavailable')+' · fetched '+stamp(git.fetched_at)+'. Counts are per workspace; overlapping commits are not added together.':'Git evidence unavailable.';
    const rows=(git?.rows||[]).filter(r=>(!query||r.branch.toLowerCase().includes(query))&&(filter==='all'||filter==='pending'&&(r.ahead>0||r.dirty>0||r.untracked>0)||filter==='older'&&r.stale||filter==='unknown'&&r.status!=='ok')).sort((a,b)=>(b.ahead||0)-(a.ahead||0));
    $('work-count').textContent=rows.length+' matching workspaces · '+(git?.rows?.length||0)+' observed';
    table('work-table',['Workspace branch','Commits vs main','Local changes','Last commit'],rows.map(r=>[esc(r.branch)+'<small>'+commit(r.head)+'</small>',r.status==='ok'?count(r.ahead)+' outside main<small>'+count(r.behind)+' behind</small>'+((r.pending_commits||[]).length?'<details><summary>Inspect pending commits</summary>'+(r.pending_commits||[]).filter(hash=>/^[a-f0-9]{40}$/.test(hash)).map(hash=>'<a href="https://github.com/Ozaveshe/afrotools/commit/'+hash+'" target="_blank" rel="noopener">'+hash.slice(0,12)+' ↗</a>').join('')+'<small>Latest 8 shown. Unpushed commits are only available in the local workspace.</small></details>':''):pill('Unavailable'),r.status==='ok'?count(r.dirty)+' tracked<small>'+count(r.untracked)+' untracked entries</small>':'—',stamp(r.last_commit)+(r.stale?'<small>Older than 7 days</small>':'')]));
    $('pull-evidence').textContent='GitHub pull requests: '+(engine?.pulls?.status||'unavailable')+' · up to 50 open requests.';
    table('pull-table',['Pull request','Branch','Updated'],(engine?.pulls?.rows||[]).map(r=>['<a href="https://github.com/Ozaveshe/afrotools/pull/'+Number(r.number)+'" target="_blank" rel="noopener">#'+Number(r.number)+' ↗</a>'+pill(r.draft?'Draft':'Open'),esc(r.branch),stamp(r.updated_at)]));
  }
  const resultLabel=value=>({ready:'Ready for review',consumed:'Consumed by publisher',no_change:'Completed · no change',live_only:'Completed · live only',blocked:'Blocked',quarantined:'Quarantined','not observed':'No receipt observed'})[value]||value;
  function renderAutomations(){
    const lanes=engine?.automations,filter=$('automation-filter').value,query=$('automation-search').value.toLowerCase();
    $('automation-evidence').textContent='Receipt source: '+(lanes?.status||'unavailable')+'. Latest validated receipt per lane; not a live running-state feed. Receipts over 48 hours old are marked older.';
    const rows=(lanes?.rows||[]).filter(r=>(!query||(r.name+' '+r.id).toLowerCase().includes(query))&&(!filter||filter==='attention'&&['blocked','quarantined','invalid receipt','not observed'].includes(r.disposition)||filter==='completed'&&['no_change','live_only','consumed'].includes(r.disposition)||filter==='ready'&&r.disposition==='ready'&&r.integrated!==true));
    table('automation-table',['Automation','Latest result','Checks / changes','Receipt date'],rows.map(r=>[esc(r.name)+'<small>'+esc(r.id)+'</small>'+pill(r.enabled?'Enabled':'Paused'),pill(r.disposition==='ready'&&r.integrated===true?'Commit already in main':resultLabel(r.disposition),['no_change','live_only','consumed'].includes(r.disposition)?'active':'')+'<small>'+commit(r.commit)+'</small>'+(r.review_area?'<small>Review area: '+esc(r.review_area)+' (inferred)</small>':'')+(r.dependencies>0?'<small>'+count(r.dependencies)+' declared dependencies</small>':''),count(r.checks_passed)+' passed · '+count(r.checks_failed)+' failed<small>'+count(r.source_changes)+' source files</small>',stamp(r.receipt_at)+(r.stale?'<small>Older receipt · not current success</small>':'')]));
    const ci=engine?.ci;
    $('ci-evidence').textContent='GitHub checks: '+(ci?.status||'unavailable')+' · latest 20 observed runs.';
    table('ci-table',['Workflow / branch','Result','Commit / date'],(ci?.rows||[]).map(r=>['<a href="https://github.com/Ozaveshe/afrotools/actions/runs/'+Number(r.id)+'" target="_blank" rel="noopener">'+esc(r.name)+' ↗</a><small>'+esc(r.branch)+'</small>',pill(r.conclusion||r.status,r.conclusion==='success'?'active':''),commit(r.commit)+'<small>'+stamp(r.created_at)+'</small>']));
    const runtime=engine?.runtime;
    $('runtime-evidence').textContent='Feed evidence: '+(runtime?.status||'unavailable')+' · checked '+stamp(runtime?.checked_at)+'. Jobs observed in scraper_runs over seven days; this does not cover every scheduled function.';
    table('runtime-table',['Observed feed job','Latest result','24-hour window','Latest run'],(runtime?.rows||[]).map(r=>[esc(r.scraper_id),pill(r.latest_status,r.latest_status==='ok'?'active':''),count(r.runs_24h)+' runs · '+count(r.failures_24h)+' failures',stamp(r.latest_at)]));
  }
  function render(){
    const old=!engine||age(engine.collected_at,Date.now())>2;
    $('engine-status').textContent=engine?(old?'Sync is older than two hours':'Operational summary')+' · '+stamp(engine.collected_at)+' · hourly while this PC is on':'Operational summary unavailable. Check the hourly sync or sign in again.';
    $('engine-status').classList.toggle('sync-stale',old);
    renderAdvice();renderWork();renderAutomations();
  }
  async function refresh(){
    $('engine-refresh').disabled=true;
    try{const response=await fetch('/api/operator-dashboard/operations.json',{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error();const value=await response.json();if(value.schema_version!==1||value.project_ref!=='zpclagtgczsygrgztlts')throw Error();engine=value;render();}
    catch{engine=null;render();}finally{$('engine-refresh').disabled=false;}
  }
  window.addEventListener('operator-snapshot',event=>{snapshot=event.detail;renderAdvice();});
  ['work-search','work-filter'].forEach(id=>$(id).addEventListener('input',renderWork));
  ['automation-search','automation-filter'].forEach(id=>$(id).addEventListener('input',renderAutomations));
  $('engine-refresh').addEventListener('click',refresh);
  $('inbox-expand').addEventListener('click',()=>{expanded=!expanded;renderAdvice();});
  refresh();setInterval(()=>{render();},60000);
}());
