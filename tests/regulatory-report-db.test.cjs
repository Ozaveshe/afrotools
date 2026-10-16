// Destructive fixtures ONLY in an explicitly named, otherwise empty LOCAL test DB.
// node tests/regulatory-report-db.test.cjs
// REGULATORY_TEST_DATABASE_URL=postgresql://...@127.0.0.1:<port>/afrotools_regulatory_test_<unique>
// REGULATORY_TEST_PSQL=<absolute psql executable> (or psql on PATH)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFile, execFileSync } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
const db = process.env.REGULATORY_TEST_DATABASE_URL;
if (!db) throw new Error('LOCAL SQL tests NOT RUN: set REGULATORY_TEST_DATABASE_URL to an isolated local test database.');
const url = new URL(db);
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/afrotools_regulatory_test_[a-z0-9_]+$/.test(url.pathname) || url.search || url.hash) throw new Error('Refuse non-local/non-isolated database.');
const psql = process.env.REGULATORY_TEST_PSQL || 'psql';
const args = ['-X', '-v', 'ON_ERROR_STOP=1', '-At', '-d', db];
const query = sql => execFileSync(psql, [...args, '-c', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }).trim();
const parallelQuery = async sql => { try { const result = await runFile(psql, [...args, '-c', sql], { encoding: 'utf8', timeout: 15000 }); return { ok: true, out: result.stdout.trim() }; } catch (err) { return { ok: false, error: String(err.stderr) }; } };
const server=JSON.parse(query("select json_build_object('address',inet_server_addr(),'port',inet_server_port(),'database',current_database())"));
assert.ok(['127.0.0.1','::1'].includes(server.address),'Actual server must also be loopback.');
assert.equal(server.port,Number(url.port||5432),'Actual server port must match the reviewed URL.');
assert.equal(server.database,url.pathname.slice(1));
assert.equal(query("select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'"), '0', 'Test DB must initially be empty.');
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/regulatory-existing-schema.json'), 'utf8'));
assert.equal(schema.existing_columns.length,29);assert.equal(schema.existing_constraints.length,5);
const quote = name => { assert.match(name,/^[a-z_]+$/);return '"'+name+'"'; };
const existingTables=['gazette_changes','review_queue'].map(table=>'create table public.'+quote(table)+'('+schema.existing_columns.filter(c=>c.table===table).map(c=>quote(c.column)+' '+c.type+(c.default?' default '+c.default:'')+(c.nullable==='NO'?' not null':'')).join(',')+');').join('\n');
const constraints=schema.existing_constraints.map(c=>'alter table public.'+quote(c.table)+' add constraint '+quote(c.name)+' '+c.definition+';').join('\n');
const bootstrap = `
do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; if not exists(select from pg_roles where rolname='service_role') then create role service_role nologin; end if; end $$;
create table public.data_confidence(id uuid primary key default gen_random_uuid());
${existingTables}
${constraints}
alter table public.gazette_changes enable row level security; alter table public.review_queue enable row level security;
grant usage on schema public to service_role,anon,authenticated;
grant select,insert,update,delete on public.gazette_changes,public.review_queue to service_role;
create policy service on public.gazette_changes for all to service_role using(true) with check(true);
create policy service on public.review_queue for all to service_role using(true) with check(true);`;
const negativeOriginal = process.argv.includes('--expect-original-check-rejection');
if (negativeOriginal && !process.env.REGULATORY_TEST_MIGRATION_FILE) throw new Error('Original-negative mode requires the exact archived parent migration file.');
const migration = fs.readFileSync(process.env.REGULATORY_TEST_MIGRATION_FILE || path.join(__dirname, '../supabase/migrations/20261016185739_regulatory_report_receipts.sql'), 'utf8');
if (negativeOriginal) assert.equal(createHash('sha256').update(migration).digest('hex'),'bb1eddd3746d9758397e82f0abdb71359e4adcc1bbd96d58152e45faa71db8a8','Negative must execute exact committed457e migration bytes.');
const payload = { country_code:'NG',change_type:'minimum-wage',title:'Synthetic regulatory signal',details:'Synthetic public-source details for a local test only.',source_url:'https://example.org/gazette',effective_date:'2026-10-16' };
const literal = value => "'" + JSON.stringify(value).replace(/'/g,"''") + "'::jsonb";
const key = 'a'.repeat(64), request = '6a5fb81e-b0c6-4359-84b0-a4171e09b67b';
const call = (id=request,p=payload,k=key,day="(now() at time zone 'UTC')::date") => `select public.submit_regulatory_report('${id}'::uuid,${literal(p)},'${k}',${day})`;
const svc = sql => 'set role service_role; ' + sql;
async function main() {
try {
  query(bootstrap);
  // The local role intentionally does NOT bypass RLS, stronger than the live
  // service-role policy boundary. No fake auth schema or private records exist.
  assert.equal(query("select rolbypassrls from pg_roles where rolname='service_role'"),'f');
  const observedColumns=JSON.parse(query("select json_agg(x order by x.table,x.position) from (select table_name as table,column_name as column,data_type as type,is_nullable as nullable,column_default as default,ordinal_position as position from information_schema.columns where table_schema='public' and table_name in('gazette_changes','review_queue')) x"));
  assert.deepEqual(observedColumns.map(({position,...column})=>column),schema.existing_columns);
  const observedConstraints=JSON.parse(query("select json_agg(x order by x.table,x.name) from (select cl.relname as table,co.conname as name,pg_get_constraintdef(co.oid) as definition from pg_constraint co join pg_class cl on cl.oid=co.conrelid join pg_namespace ns on ns.oid=cl.relnamespace where ns.nspname='public' and cl.relname in('gazette_changes','review_queue')) x"));
  assert.deepEqual(observedConstraints,schema.existing_constraints);
  const observedRLS=JSON.parse(query("select json_agg(json_build_object('table',cl.relname,'rls',cl.relrowsecurity,'force_rls',cl.relforcerowsecurity) order by cl.relname) from pg_class cl join pg_namespace ns on ns.oid=cl.relnamespace where ns.nspname='public' and cl.relname in('gazette_changes','review_queue')"));
  assert.deepEqual(observedRLS,schema.existing_rls);
  query(migration);
  if(negativeOriginal){
    let rejection;
    try { query(svc(call())); } catch(error) { rejection=String(error.stderr); }
    assert.match(rejection||'',/gazette_changes_change_type_check/);
    console.error('EXPECTED ORIGINAL457e CONSTRAINT REJECTION:\n'+rejection);
    const remaining=JSON.parse(query("select json_build_object('gazette',(select count(*) from gazette_changes),'queue',(select count(*) from review_queue),'receipts',(select count(*) from regulatory_report_receipts),'quotas',(select count(*) from regulatory_report_quotas))"));
    assert.deepEqual(remaining,{gazette:0,queue:0,receipts:0,quotas:0});
    console.log(JSON.stringify({negativeOriginal457e:true,exactParentMigrationSha256:'bb1eddd3746d9758397e82f0abdb71359e4adcc1bbd96d58152e45faa71db8a8',actualConstraint:'gazette_changes_change_type_check',faithfulColumns:29,faithfulConstraints:5,persisted:remaining}));
    return;
  }
  const first = JSON.parse(query(svc(call())).split('\n').at(-1));
  assert.equal(first.status,'pending_review');
  const again = JSON.parse(query(svc(call())).split('\n').at(-1)); assert.deepEqual(again,first);
  assert.equal(query('select accepted_count from regulatory_report_quotas'),'1');
  assert.throws(()=>query(svc(call(request,{...payload,title:'Changed payload title'}))),/Request conflict/);
  assert.equal(query('select count(*) from gazette_changes'),'1');
  assert.equal(query("select count(*) from gazette_changes where verified=false and applied_to_tools=false and confidence=0 and source_name='Community report (unverified)'"),'1');
  assert.equal(query("select count(*) from review_queue where status='pending' and reason='community_regulatory_report'"),'1');
  // Same ID races: all responses identical, one signal/one quota debit.
  const replay = await Promise.all(Array.from({length:8},()=>parallelQuery(svc(call()))));
  assert.ok(replay.every(x=>x.ok)); assert.ok(replay.every(x=>JSON.parse(x.out.split('\n').at(-1)).receipt_id===first.receipt_id));
  assert.equal(query('select count(*) from gazette_changes'),'1');
  // Distinct concurrent reports: total accepted stays exactly five.
  const ids=Array.from({length:12},(_,i)=>`7a5fb81e-b0c6-4359-84b0-${String(i).padStart(12,'0')}`);
  const results=await Promise.all(ids.map(id=>parallelQuery(svc(call(id)))));
  assert.equal(results.filter(x=>x.ok).length,4);assert.ok(results.filter(x=>!x.ok).every(x=>/Daily report limit/.test(x.error)));
  assert.equal(query('select accepted_count from regulatory_report_quotas'),'5');assert.equal(query('select count(*) from regulatory_report_receipts'),'5');
  // First-receipt race, not just replay of a previously committed receipt.
  const newID='ba5fb81e-b0c6-4359-84b0-000000000001', newKey='f'.repeat(64);
  const firstRace=await Promise.all(Array.from({length:8},()=>parallelQuery(svc(call(newID,payload,newKey)))));
  assert.ok(firstRace.every(x=>x.ok));assert.equal(new Set(firstRace.map(x=>JSON.parse(x.out.split('\n').at(-1)).receipt_id)).size,1);
  assert.equal(query("select accepted_count from regulatory_report_quotas where quota_key=repeat('f',64)"),'1');
  const crossDay=JSON.parse(query(svc(call(newID,payload,'0'.repeat(64),"date '1900-01-01'"))).split('\n').at(-1));
  assert.equal(crossDay.receipt_id,JSON.parse(firstRace[0].out.split('\n').at(-1)).receipt_id);
  assert.equal(query("select count(*) from regulatory_report_quotas where quota_key=repeat('0',64)"),'0');
  // Failure after gazette insertion must roll back signal, queue, receipt, quota.
  query("create function public.force_test_failure() returns trigger language plpgsql as $$ begin raise exception 'synthetic rollback'; end $$; create trigger test_failure before insert on public.review_queue for each row execute function public.force_test_failure();");
  assert.throws(()=>query(svc(call('8a5fb81e-b0c6-4359-84b0-000000000001',payload,'b'.repeat(64)))),/synthetic rollback/);
  assert.equal(query('select count(*) from gazette_changes'),'6');assert.equal(query("select count(*) from regulatory_report_quotas where quota_key=repeat('b',64)"),'0');
  query('drop trigger test_failure on public.review_queue; drop function public.force_test_failure();');
  // Both table privileges and RLS: private pending rows remain invisible.
  for(const role of ['anon','authenticated']){
    assert.throws(()=>query(`set role ${role}; select * from regulatory_report_receipts`),/permission denied/);
    assert.throws(()=>query(`set role ${role}; ${call()}`),/permission denied/);
  }
  query('grant select on regulatory_report_receipts,regulatory_report_quotas to anon,authenticated');
  for(const role of ['anon','authenticated']) assert.equal(query(`set role ${role}; select count(*) from regulatory_report_receipts`).split('\n').at(-1),'0');
  query('revoke select on regulatory_report_receipts,regulatory_report_quotas from anon,authenticated');
  for(const bad of [{...payload,country_code:'XX'},{...payload,source_url:'javascript:alert(1)'},{...payload,effective_date:'2026-02-30'},{...payload,details:'short'},{...payload,email:'not allowed'}]) assert.throws(()=>query(svc(call('9a5fb81e-b0c6-4359-84b0-000000000001',bad,'c'.repeat(64)))));
  // Expiry is lazy: idle keys exist until a later accepted intake prunes them.
  query("insert into regulatory_report_quotas(quota_key,bucket_date,expires_at) values(repeat('d',64),current_date-3,now()-interval '1 hour')");
  assert.equal(query("select count(*) from regulatory_report_quotas where quota_key=repeat('d',64)"),'1');
  query(svc(call('aa5fb81e-b0c6-4359-84b0-000000000001',payload,'e'.repeat(64))));
  assert.equal(query("select count(*) from regulatory_report_quotas where quota_key=repeat('d',64)"),'0');
  // Moderation is one exact association/transaction for repeat/opposite races.
  const gazetteID=query(`select gazette_id from regulatory_report_receipts where request_id='${request}'`);
  const review = action => `select public.review_regulatory_report('${gazetteID}','${action}','Synthetic admin decision')`;
  const consistent = () => query(`select count(*) from regulatory_report_receipts r join gazette_changes g on g.id=r.gazette_id join review_queue q on q.id=r.review_queue_id where r.request_id='${request}' and ((g.verified and not g.applied_to_tools and q.status='approved') or (not g.verified and g.applied_to_tools and q.status='rejected')) and g.verified_at=q.reviewed_at`);
  query(svc(review('approve')));assert.equal(consistent(),'1');query(svc(review('approve')));assert.equal(consistent(),'1');query(svc(review('reject')));assert.equal(consistent(),'1');
  const decisions=await Promise.all(Array.from({length:12},(_,i)=>parallelQuery(svc(review(i%2?'approve':'reject')))));
  assert.ok(decisions.every(x=>x.ok));assert.equal(consistent(),'1');
  const before=query(`select row_to_json(g) from gazette_changes g where id='${gazetteID}'`);
  query(`update review_queue set reason='synthetic_changed_association' where id=(select review_queue_id from regulatory_report_receipts where request_id='${request}')`);
  assert.throws(()=>query(svc(review('approve'))),/Report queue association changed/);
  assert.equal(query(`select row_to_json(g) from gazette_changes g where id='${gazetteID}'`),before);
  query(`update review_queue set reason='community_regulatory_report' where id=(select review_queue_id from regulatory_report_receipts where request_id='${request}')`);
  for(const role of ['anon','authenticated'])assert.throws(()=>query(`set role ${role}; ${review('approve')}`),/permission denied/);
  assert.throws(()=>query(svc(review('invented'))),/Invalid report decision/);
  // Legacy rejected-country reconciliation must not retire new community rows.
  // Keep synthetic compatibility mutations in one rollback-only transaction.
  query("begin; do $$ declare before_count integer; begin select count(*) into before_count from gazette_changes where source_name='Community report (unverified)' and applied_to_tools=true; insert into gazette_changes(country_code,change_type,description,source_name) values('NG','minimum_wage','Synthetic nullable legacy',null),('NG','minimum_wage','Synthetic named legacy','Legacy Gazette'); update gazette_changes set applied_to_tools=true where country_code='NG' and change_type='minimum_wage' and applied_to_tools=false and (source_name is null or source_name<>'Community report (unverified)'); if (select count(*) from gazette_changes where description like 'Synthetic % legacy' and applied_to_tools=true)<>2 then raise exception 'legacy reconciliation lost'; end if; if (select count(*) from gazette_changes where source_name='Community report (unverified)' and applied_to_tools=true)<>before_count then raise exception 'community reconciliation regression'; end if; end $$; rollback;");
  // Legacy 90-day deletion still cleans unrelated rows without receipt FK failure.
  query("update review_queue set status='approved',created_at=now()-interval '100 days' where reason='community_regulatory_report'; insert into review_queue(category,country_code,metric,reason,status,created_at) values('gazette','NG','minimum-wage','gazette_detected','approved',now()-interval '100 days'),('other','NG','other','synthetic_other','rejected',now()-interval '100 days'); delete from review_queue where status<>'pending' and reason<>'community_regulatory_report' and created_at<now()-interval '90 days';");
  assert.equal(query("select count(*) from review_queue where reason<>'community_regulatory_report'"),'0');assert.equal(query('select count(*) from regulatory_report_receipts'),'7');assert.equal(query('select count(*) from review_queue'),'7');
  const mappings={'minimum-wage':'minimum_wage','paye-bands':'paye_bracket','pension-rate':'pension_rate','social-security':'other','new-levy':'other','tax-threshold':'other','cit-rate':'other','filing-deadline':'other'};
  const acceptedMappings=[];
  for(const [i,[uiType,legacyType]] of Object.entries(mappings).entries()){
    const typeID='ca5fb81e-b0c6-4359-84b0-'+String(i).padStart(12,'0');
    const typed={...payload,change_type:uiType};
    const response=JSON.parse(query(svc(call(typeID,typed,(i+1).toString(16).repeat(64)))).split('\n').at(-1));assert.equal(response.status,'pending_review');
    const observed=JSON.parse(query(`select json_build_object('change_type',g.change_type,'metric',q.metric,'description',g.description,'verified',g.verified,'confidence',g.confidence,'applied',g.applied_to_tools) from regulatory_report_receipts r join gazette_changes g on g.id=r.gazette_id join review_queue q on q.id=r.review_queue_id where r.request_id='${typeID}'`));
    assert.deepEqual(observed,{change_type:legacyType,metric:uiType,description:'[Reported UI type: '+uiType+']\n'+typed.title+'\n'+typed.details,verified:false,confidence:0,applied:false});
    assert.ok(Buffer.byteLength(observed.description)<=8597);acceptedMappings.push({uiType,legacyType,originalTypePreserved:true});
  }
  assert.equal(query("select count(*) from gazette_changes where source_name='Community report (unverified)' and change_type in('nhif_rate','tax_relief','vat_rate')"),'0');
  console.log(JSON.stringify({localSQL:true,faithfulColumns:29,faithfulConstraints:5,localServiceRoleBypassesRLS:false,receiptReplay:true,concurrentReplay:8,concurrentFirstReceipt:8,crossDayReceiptRecovery:true,distinctRace:12,acceptedInDailyBucket:5,quotaConflictRollbackRLSAndValidation:true,lazyExpiry:true,adminVisibleUnverifiedSignals:true,atomicModerationRepeatOppositeRace:12,moderationAssociationFailureRollback:true,legacyReconciliationAndCleanupCompatibility:true,allEightMappings:acceptedMappings}));
} finally {
  // Isolated test database only. Leave shared roles untouched.
  query('drop function if exists public.submit_regulatory_report(uuid,jsonb,text,date); drop function if exists public.review_regulatory_report(uuid,text,text); drop table if exists public.regulatory_report_receipts,public.regulatory_report_quotas,public.review_queue,public.gazette_changes,public.data_confidence cascade; drop function if exists public.force_test_failure();');
}
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
