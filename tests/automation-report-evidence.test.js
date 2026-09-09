'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const {parseRollout, collectRuns} = require('../scripts/generate-automation-run-report');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'automation-evidence-'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
function events(id, terminal) {
  return [
    {type:'session_meta',payload:{id,timestamp:'2026-09-09T08:00:00Z'}},
    {type:'response_item',payload:{type:'message',role:'user',content:[{text:'Automation ID: fixture\nDo not report interrupted work as completed.'}]}},
    ...terminal,
  ].map(JSON.stringify).join('\n');
}
try {
  const active=path.join(root,'sessions','2026','09','09','rollout-2026-09-09T08-00-00-fixture.jsonl');
  const archive=path.join(root,'archived_sessions',path.basename(active));
  write(active,events('same-session',[{type:'event_msg',payload:{type:'task_complete',error:'synthetic timeout'}}]));
  write(archive,fs.readFileSync(active));
  assert.strictEqual(parseRollout(active).status,'failed');
  assert.strictEqual(collectRuns([path.join(root,'sessions'),path.join(root,'archived_sessions')],new Date('2026-09-09'),new Date('2026-09-10')).length,1,'retained and archived copies count once');
  const pending=path.join(root,'pending.jsonl');
  write(pending,events('pending',[]));
  assert.strictEqual(parseRollout(pending).status,'incomplete','prompt words do not classify execution');
  write(path.join(root,'archived_sessions','rollout-2020-01-01T00-00-00-old.jsonl'),'not current evidence');
  write(path.join(root,'automations','fixture','automation.toml'),'id = "fixture"\nname = "Fixture"\nkind = "cron"\nstatus = "ACTIVE"\n');
  const output=path.join(root,'reports');
  const result=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/generate-automation-run-report.js'),'--since=2026-09-09','--until=2026-09-09','--output-dir='+output],{env:{...process.env,CODEX_HOME:root},encoding:'utf8'});
  assert.strictEqual(result.status,0,result.stderr);
  const report=JSON.parse(fs.readFileSync(path.join(output,'automation-run-report-2026-09-09-to-2026-09-09.json')));
  assert.strictEqual(report.summary.runs_found,1);
  assert.strictEqual(report.automations[0].latest_run.status,'failed');
  assert.ok(report.sources.sessions_dir);
  process.env.CODEX_AUTOMATION_REPORT_DIR=output;
  const {findLatestAutomationReport,parseAutomationRunReport}=require('../scripts/audit-automation-registry');
  assert.strictEqual(findLatestAutomationReport(),path.join(output,'automation-run-report-2026-09-09-to-2026-09-09.md'));
  assert.strictEqual(parseAutomationRunReport().statuses.get('fixture'),'failed');
  // Receipt-only evidence is visible without inventing a retained session.
  report.automations[0].run_count=0; report.automations[0].latest_run=null;
  report.automations[0].latest_receipt={handoff_id:'fixture-one',status:'ready',timestamp:'2026-09-09T09:00:00Z'};
  fs.writeFileSync(path.join(output,'automation-run-report-2026-09-09-to-2026-09-09.json'),JSON.stringify(report));
  assert.strictEqual(parseAutomationRunReport().noRun.has('fixture'),false);
  console.log('automation report evidence tests passed');
} finally { delete process.env.CODEX_AUTOMATION_REPORT_DIR; fs.rmSync(root,{recursive:true,force:true}); }
