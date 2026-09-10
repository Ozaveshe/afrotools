import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {getStore} from '@netlify/blobs';
import {sanitizeEngine,PROJECT,SITE,STORE} from '../netlify/functions/_shared/operator-engine.mjs';
const require=createRequire(import.meta.url);
const {parseTomlString,parseWorktreePorcelain}=require('./automation-control-plane.js');
const {readHandoffRecords,reconcileRecords}=require('./automation-handoff.js');
const exec=promisify(execFile);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=async(command,args,cwd)=> (await exec(command,args,{cwd,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},timeout:12000,maxBuffer:4*1024*1024,windowsHide:true,encoding:'utf8'})).stdout.trim();
const age=(date,now)=> (now-Date.parse(date))/3600000;
async function bounded(items,worker) {
  const result=new Array(items.length); let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{while(cursor<items.length){const index=cursor++;result[index]=await worker(items[index]);}}));
  return result;
}
export async function collectGit(repo,now=Date.now()) {
  const origin=await run('git',['remote','get-url','origin'],repo);
  if(!/^https:\/\/github\.com\/Ozaveshe\/afrotools(?:\.git)?$/i.test(origin) && origin!=='git@github.com:Ozaveshe/afrotools.git') throw new Error('Repository identity mismatch');
  let fetched_at=null;
  try {await exec('git',['fetch','origin','main','--no-tags'],{cwd:repo,timeout:45000,windowsHide:true,maxBuffer:1024*1024});fetched_at=new Date().toISOString();}catch{/* Keep comparison explicitly stale. */}
  const base_sha=await run('git',['rev-parse','origin/main'],repo);
  const entries=parseWorktreePorcelain(await run('git',['worktree','list','--porcelain'],repo));
  const rows=await bounded(entries,async entry=>{
    const base={workspace:path.resolve(entry.path)===path.resolve(repo)?'Primary checkout':path.basename(path.dirname(entry.path)),branch:(entry.branch||'detached').replace(/^refs\/heads\//,''),head:entry.head,status:'unavailable'};
    try {
      const [counts,changes,last_commit,pending]=await Promise.all([
        run('git',['rev-list','--left-right','--count',base_sha+'...'+entry.head],repo),
        run('git',['status','--porcelain','--untracked-files=normal'],entry.path),
        run('git',['show','-s','--format=%cI',entry.head],repo),
        run('git',['log','--format=%H','-8',base_sha+'..'+entry.head],repo)
      ]);
      const [behind,ahead]=counts.split(/\s+/).map(Number), lines=changes.split(/\r?\n/).filter(Boolean);
      return {...base,status:'ok',behind,ahead,pending_commits:pending.split(/\r?\n/).filter(Boolean),last_commit,dirty:lines.filter(l=>!l.startsWith('??')).length,untracked:lines.filter(l=>l.startsWith('??')).length,stale:age(last_commit,now)>168};
    } catch {return base;}
  });
  return {status:fetched_at?'ok':'stale',fetched_at,base_sha,rows};
}
export function collectAutomations(root,now=Date.now()) {
  const records=reconcileRecords(readHandoffRecords(root));
  const rows=[]; let invalid_receipts=0;
  for(const entry of fs.readdirSync(root,{withFileTypes:true})) {
    if(!entry.isDirectory() || /oddspadi|salarypadi|latmtools/i.test(entry.name))continue;
    const filename=path.join(root,entry.name,'automation.toml');if(!fs.existsSync(filename))continue;
    const raw=fs.readFileSync(filename,'utf8');
    if(!/afrotools/i.test(raw))continue;
    if(parseTomlString(raw,'kind')==='heartbeat')continue; // Observers do not emit producer receipts.
    const matching=records.filter(r=>path.relative(root,r.filePath).split(path.sep)[0]===entry.name);
    const invalid=matching.filter(r=>r.errors.length);invalid_receipts+=invalid.length;
    const invalidLatest=invalid.some(r=>path.resolve(r.filePath)===path.resolve(root,entry.name,'handoff.json'));
    const latest=matching.filter(r=>!r.errors.length).sort((a,b)=>Date.parse(b.item.created_at)-Date.parse(a.item.created_at))[0]?.item;
    const checks=Array.isArray(latest?.validations)?latest.validations:[];
    const blocker=String(latest?.blocker||'').toLowerCase();
    const review_area=/supabase|credential|auth|network|fetch/.test(blocker)?'Data or provider access':/depend|handoff|receipt/.test(blocker)?'Receipt or dependency contract':/source|official|fresh/.test(blocker)?'Source verification':/test|build|audit/.test(blocker)?'Validation checks':blocker?'Recorded blocker requires operator review':null;
    rows.push({id:entry.name,name:parseTomlString(raw,'name')||entry.name,enabled:parseTomlString(raw,'status')==='ACTIVE',schedule:parseTomlString(raw,'rrule'),
      disposition:invalidLatest?'invalid receipt':latest?.status||'not observed',receipt_at:latest?.created_at,commit:latest?.commit,
      review_area,dependencies:latest?.dependencies?.length,
      checks_passed:latest?checks.filter(t=>['pass','passed'].includes(t.status)).length:null,checks_failed:latest?checks.filter(t=>['fail','failed'].includes(t.status)).length:null,
      source_changes:latest?.source_files?.length,stale:latest?age(latest.created_at,now)>48:false});
  }
  return {status:'ok',invalid_receipts,rows};
}
export function collectRuntime(filename,now=Date.now()) {
  const value=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(value.project_ref!==PROJECT || !Number.isFinite(Date.parse(value.checked_at)) || Date.parse(value.checked_at)>now+60000)throw new Error('Runtime identity or timestamp mismatch');
  return {status:age(value.checked_at,now)>2?'stale':'ok',checked_at:value.checked_at,rows:value.rows};
}
export async function collect(options) {
  const now=Date.now(), result={schema_version:1,project_ref:PROJECT,collected_at:new Date(now).toISOString()};
  const tasks={git:()=>collectGit(options.repo,now),automations:()=>collectAutomations(options.automations,now),runtime:()=>collectRuntime(options.runtime,now),
    ci:async()=>({status:'ok',rows:JSON.parse(await run('gh',['run','list','--repo','Ozaveshe/afrotools','--limit','20','--json','databaseId,workflowName,status,conclusion,headBranch,headSha,createdAt'],options.repo)).map(r=>({id:r.databaseId,name:r.workflowName,status:r.status,conclusion:r.conclusion,branch:r.headBranch,commit:r.headSha,created_at:r.createdAt}))}),
    pulls:async()=>({status:'ok',rows:JSON.parse(await run('gh',['pr','list','--repo','Ozaveshe/afrotools','--state','open','--limit','50','--json','number,headRefName,isDraft,updatedAt'],options.repo)).map(r=>({number:r.number,branch:r.headRefName,draft:r.isDraft,updated_at:r.updatedAt}))})};
  await Promise.all(Object.entries(tasks).map(async([key,task])=>{try{result[key]=await task();}catch{result[key]={status:'unavailable',rows:[]};}}));
  if(result.git.base_sha)await bounded(result.automations.rows,async row=>{
    if(!/^[a-f0-9]{40}$/.test(row.commit))return;
    try{await run('git',['merge-base','--is-ancestor',row.commit,result.git.base_sha],options.repo);row.integrated=true;}
    catch(error){row.integrated=error.code===1?false:null;}
  });
  return sanitizeEngine(result);
}
export async function publish(summary) {
  const cli=process.env.NETLIFY_CLI_ROOT || path.join(process.env.APPDATA||'', 'npm/node_modules/netlify-cli');
  const {getToken}=await import(pathToFileURL(path.join(cli,'dist/utils/command-helpers.js')).href);
  const [token]=await getToken();
  if(!token)throw new Error('Netlify login required');
  const response=await fetch('https://api.netlify.com/api/v1/sites/'+SITE,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Site verification unavailable');
  const site=await response.json();if(site.id!==SITE || site.name!=='afrotools')throw new Error('Site identity mismatch');
  const store=getStore({name:STORE,siteID:SITE,token,consistency:'strong'});
  await store.setJSON('latest',sanitizeEngine(summary));
  const verified=await store.get('latest',{type:'json'});
  if(verified?.collected_at!==summary.collected_at || verified?.project_ref!==PROJECT)throw new Error('Published summary verification failed');
}
async function main() {
  const options={repo:ROOT,automations:path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'automations'),runtime:path.join(ROOT,'artifacts/operator-engine/runtime.json'),output:path.join(ROOT,'artifacts/operator-engine/latest.json')};
  let upload=false;
  for(let i=2;i<process.argv.length;i++){const key=process.argv[i];if(key==='--publish')upload=true;else if(['--repo','--automations','--runtime','--output'].includes(key)&&process.argv[i+1])options[key.slice(2)]=path.resolve(process.argv[++i]);else throw new Error('Unknown argument');}
  const summary=await collect(options);
  if(Object.values(summary).filter(v=>v && typeof v==='object').every(v=>v.status==='unavailable'))throw new Error('All evidence unavailable');
  fs.mkdirSync(path.dirname(options.output),{recursive:true});
  const temp=options.output+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(summary,null,2)+'\n');fs.renameSync(temp,options.output);
  if(upload)await publish(summary);
  console.log(JSON.stringify({collected_at:summary.collected_at,published:upload,sources:Object.fromEntries(['git','automations','ci','pulls','runtime'].map(k=>[k,{status:summary[k].status,rows:summary[k].rows.length}]))}));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('Operator sync failed. Previous published summary is preserved. Check local Git, gh and Netlify authentication.');process.exitCode=1;});
