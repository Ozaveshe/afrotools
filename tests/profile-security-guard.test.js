const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { PGlite } = require('@electric-sql/pglite');
const { resolveProfileEntitlement } = require('../netlify/functions/_shared/entitlements');

const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261002064000_protect_profile_access_fields.sql'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/profile-security-schema.sql'), 'utf8');
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const fresh = '00000000-0000-4000-8000-000000000003';
const protectedChanges = [
  ['tier', 'pro'], ['subscription_tier', 'pro'], ['role', 'admin'],
  ['subscription_expires_at', '2099-01-01T00:00:00Z'],
  ['paystack_customer_id', 'synthetic-customer'],
  ['paystack_subscription_code', 'synthetic-subscription']
];

test('PostgreSQL profile guard protects access fields without breaking profile and server writes', async t => {
  const db = new PGlite();
  await db.exec(fixture);
  async function asRole(role, sub, action) {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ role, sub })]);
    try { return await action(); }
    finally {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims', '{}', false)");
    }
  }
  const own = (action, sub = first) => asRole('authenticated', sub, action);
  const denied = action => assert.rejects(action, error => error.code === '42501' && error.message === 'Account access fields are managed by AfroTools.');
  try {
    await t.test('fixture independently reproduces writable own-row admin and paid access before protection', async () => {
      await own(() => db.query("update public.profiles set role='admin',subscription_tier='pro' where id=$1", [first]));
      const { rows } = await db.query('select role,subscription_tier from public.profiles where id=$1', [first]);
      assert.equal(rows[0].role, 'admin');
      assert.equal(resolveProfileEntitlement(rows[0]).isPro, true);
      await db.query("update public.profiles set role='user',subscription_tier='free' where id=$1", [first]);
      await db.exec(migration);
    });
    for (const [column, value] of protectedChanges) {
      await t.test(`client update cannot change ${column}`, async () => {
        await own(() => denied(() => db.query(`update public.profiles set ${column}=$1 where id=$2`, [value, first])));
      });
      await t.test(`client insert cannot forge ${column}`, async () => {
        await own(() => denied(() => db.query(`insert into public.profiles (id,${column}) values ($1,$2)`, [fresh, value])), fresh);
      });
    }
    await t.test('ordinary onboarding/profile edits and default free profile creation work', async () => {
      await own(() => db.query("update public.profiles set name='Edited synthetic name',country='NG',onboarding_completed=true where id=$1", [first]));
      await own(() => db.query('insert into public.profiles (id,name) values ($1,$2)', [fresh, 'Synthetic New']), fresh);
      const { rows } = await db.query('select name,country,onboarding_completed,role,subscription_tier from public.profiles where id=$1', [first]);
      assert.deepEqual(rows[0], { name: 'Edited synthetic name', country: 'NG', onboarding_completed: true, role: 'user', subscription_tier: 'free' });
    });
    await t.test('unchanged protected values may accompany legitimate profile edits', async () => {
      await own(() => db.query("update public.profiles set name='Synthetic unchanged-access edit',tier='free',subscription_tier='free',role='user',subscription_expires_at=null,paystack_customer_id=null,paystack_subscription_code=null where id=$1", [first]));
    });
    await t.test('service-role billing activation, cancellation and admin management remain available', async () => {
      await asRole('service_role', null, () => db.query("update public.profiles set tier='pro',subscription_tier='pro',subscription_expires_at='2099-01-01',paystack_customer_id='synthetic-customer',paystack_subscription_code='synthetic-subscription',role='admin' where id=$1", [first]));
      const { rows } = await db.query('select subscription_tier,subscription_expires_at from public.profiles where id=$1', [first]);
      assert.equal(resolveProfileEntitlement(rows[0]).isPro, true);
      await own(() => db.query("update public.profiles set name='Synthetic paid profile edit' where id=$1", [first]));
      await own(() => denied(() => db.query("update public.profiles set subscription_tier='free' where id=$1", [first])));
      await asRole('service_role', null, () => db.query("update public.profiles set tier='free',subscription_tier='free',subscription_expires_at=null,role='user' where id=$1", [first]));
      const after = await db.query('select subscription_tier,subscription_expires_at from public.profiles where id=$1', [first]);
      assert.equal(resolveProfileEntitlement(after.rows[0]).isPro, false);
    });
    await t.test('RLS still isolates other users and denies anonymous profiles', async () => {
      const selected = await own(() => db.query('select id from public.profiles where id=$1', [second]));
      assert.equal(selected.rows.length, 0);
      const changed = await own(() => db.query("update public.profiles set name='Unexpected' where id=$1 returning id", [second]));
      assert.equal(changed.rows.length, 0);
      const anonymous = await asRole('anon', null, () => db.query('select id from public.profiles'));
      assert.equal(anonymous.rows.length, 0);
    });
    await t.test('a client-called SECURITY DEFINER cannot bypass protection through its postgres owner', async () => {
      await db.exec(`create function public.synthetic_definer_profile_update(subject uuid) returns void language sql security definer set search_path='' as $$update public.profiles set role='admin' where id=subject$$; grant execute on function public.synthetic_definer_profile_update(uuid) to authenticated;`);
      await own(() => denied(() => db.query('select public.synthetic_definer_profile_update($1)', [first])));
    });
    await t.test('an authenticated SQL role with an inconsistent service-role claim remains untrusted', async () => {
      await own(async () => {
        await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ role: 'service_role', sub: first })]);
        await denied(() => db.query("update public.profiles set role='admin' where id=$1", [first]));
      });
    });
    await t.test('migration repeats without changing existing records or exposing the trigger as RPC', async () => {
      await db.exec(migration);
      const { rows } = await db.query("select p.prosecdef, p.proconfig, has_function_privilege('authenticated',p.oid,'execute') as executable from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='protect_profile_access_fields'");
      assert.equal(rows[0].prosecdef, false);
      assert.equal(rows[0].executable, false);
      assert.deepEqual(rows[0].proconfig, ['search_path=""']);
      await own(() => denied(() => db.query("update public.profiles set role='admin' where id=$1", [first])));
    });
  } finally { await db.close(); }
});
