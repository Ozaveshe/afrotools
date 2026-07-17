const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '053-single-project-consolidation.sql'),
  'utf8'
).toLowerCase();
const servicePolicies = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '054-consolidated-service-table-policies.sql'),
  'utf8'
).toLowerCase();

[
  'search_queries',
  'education_gpa_records',
  'education_flashcard_decks',
  'education_study_plans',
  'creator_voice_profiles',
  'creator_mind_projects',
  'creator_mind_outputs',
  'jamb_attempts',
  'jamb_daily_subscribers',
  'wb_conversations',
  'wb_usage_log'
].forEach((table) => {
  assert.ok(migration.includes(`create table if not exists public.${table}`), `${table} must be replayable`);
  assert.ok(migration.includes(`alter table public.${table} enable row level security`), `${table} must enable RLS`);
});

assert.ok(
  !migration.includes('jbmhfpkzbgyeodsqhprx'),
  'the consolidation migration must never target the retired project'
);

[
  'search_queries',
  'creator_voice_profiles',
  'creator_mind_projects',
  'creator_mind_outputs',
  'jamb_daily_subscribers',
  'wb_conversations',
  'wb_usage_log'
].forEach((table) => {
  assert.ok(servicePolicies.includes(`on public.${table} for all to anon, authenticated`));
  assert.ok(servicePolicies.includes('using (false) with check (false)'));
});

execFileSync(process.execPath, [path.join(root, 'scripts', 'verify-supabase-consolidation.js')], {
  cwd: root,
  stdio: 'inherit'
});

console.log('supabase-consolidation: ok');
