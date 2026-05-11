/**
 * Multi-tenant test — org A vs org B
 *
 * Checks:
 * - user A cannot rebuild programme B (Edge function)
 * - user A cannot read cockpit row for programme B (RLS)
 * - user B cannot rebuild programme A
 * - user B cannot read cockpit row for programme A
 *
 * Usage (PowerShell):
 *  $env:SUPABASE_URL="..."
 *  $env:SUPABASE_ANON_KEY="..."
 *  $env:USER_A_EMAIL="..."
 *  $env:USER_A_PASSWORD="..."
 *  $env:PROGRAMME_A_ID="..."
 *  $env:USER_B_EMAIL="..."
 *  $env:USER_B_PASSWORD="..."
 *  $env:PROGRAMME_B_ID="..."
 *  node scripts/programme-cockpit/multi-tenant-check.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.USER_A_EMAIL;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;
const PROGRAMME_A_ID = process.env.PROGRAMME_A_ID;
const USER_B_EMAIL = process.env.USER_B_EMAIL;
const USER_B_PASSWORD = process.env.USER_B_PASSWORD;
const PROGRAMME_B_ID = process.env.PROGRAMME_B_ID;

function reqEnv(name, value) {
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

async function login(email, password) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return sb;
}

async function tryRebuild(sb, programmeId) {
  const res = await sb.functions.invoke('programme-cockpit-rebuild', { body: { programme_id: programmeId } });
  return { ok: !res.error, error: res.error ? { message: res.error.message, name: res.error.name, context: res.error.context } : null };
}

async function tryReadRow(sb, programmeId) {
  const { data, error } = await sb
    .from('programme_cockpit_read_models')
    .select('programme_id, organization_id, projection_status, projection_run_id, generated_at')
    .eq('programme_id', programmeId)
    .maybeSingle();
  return { ok: !error, error: error ? { message: error.message, code: error.code } : null, found: Boolean(data), row: data || null };
}

async function main() {
  reqEnv('SUPABASE_URL', SUPABASE_URL);
  reqEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
  reqEnv('USER_A_EMAIL', USER_A_EMAIL);
  reqEnv('USER_A_PASSWORD', USER_A_PASSWORD);
  reqEnv('PROGRAMME_A_ID', PROGRAMME_A_ID);
  reqEnv('USER_B_EMAIL', USER_B_EMAIL);
  reqEnv('USER_B_PASSWORD', USER_B_PASSWORD);
  reqEnv('PROGRAMME_B_ID', PROGRAMME_B_ID);

  const sbA = await login(USER_A_EMAIL, USER_A_PASSWORD);
  const sbB = await login(USER_B_EMAIL, USER_B_PASSWORD);

  console.log(JSON.stringify({ test: 'multi-tenant-check', programme_a: PROGRAMME_A_ID, programme_b: PROGRAMME_B_ID }));

  // A -> B
  const aRebuildB = await tryRebuild(sbA, PROGRAMME_B_ID);
  const aReadB = await tryReadRow(sbA, PROGRAMME_B_ID);
  console.log(JSON.stringify({ actor: 'A', target: 'B', rebuild: aRebuildB, read: aReadB }));

  // B -> A
  const bRebuildA = await tryRebuild(sbB, PROGRAMME_A_ID);
  const bReadA = await tryReadRow(sbB, PROGRAMME_A_ID);
  console.log(JSON.stringify({ actor: 'B', target: 'A', rebuild: bRebuildA, read: bReadA }));

  // sanity: own access should work (if already built, read should find; rebuild should be ok)
  const aRebuildA = await tryRebuild(sbA, PROGRAMME_A_ID);
  const bRebuildB = await tryRebuild(sbB, PROGRAMME_B_ID);
  console.log(JSON.stringify({ actor: 'A', target: 'A', rebuild: aRebuildA }));
  console.log(JSON.stringify({ actor: 'B', target: 'B', rebuild: bRebuildB }));

  const violations = [];
  if (aRebuildB.ok) violations.push('A rebuilt programme B (should be forbidden)');
  if (aReadB.found) violations.push('A read cockpit row for programme B (RLS leak)');
  if (bRebuildA.ok) violations.push('B rebuilt programme A (should be forbidden)');
  if (bReadA.found) violations.push('B read cockpit row for programme A (RLS leak)');

  if (violations.length) {
    throw new Error(`Multi-tenant violations: ${violations.join('; ')}`);
  }

  console.log(JSON.stringify({ ok: true }));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e?.message || String(e) }));
  process.exit(1);
});

