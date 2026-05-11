/**
 * Stress test — 10 rebuilds simultanés (déterminisme cockpit Programme)
 *
 * Usage (PowerShell):
 *  $env:SUPABASE_URL="..."
 *  $env:SUPABASE_ANON_KEY="..."
 *  $env:USER_A_EMAIL="..."
 *  $env:USER_A_PASSWORD="..."
 *  $env:PROGRAMME_A_ID="..."
 *  node scripts/programme-cockpit/rebuild-concurrent.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.USER_A_EMAIL;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;
const PROGRAMME_A_ID = process.env.PROGRAMME_A_ID;

function reqEnv(name, value) {
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

async function main() {
  reqEnv('SUPABASE_URL', SUPABASE_URL);
  reqEnv('SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
  reqEnv('USER_A_EMAIL', USER_A_EMAIL);
  reqEnv('USER_A_PASSWORD', USER_A_PASSWORD);
  reqEnv('PROGRAMME_A_ID', PROGRAMME_A_ID);

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: login, error: loginErr } = await sb.auth.signInWithPassword({
    email: USER_A_EMAIL,
    password: USER_A_PASSWORD,
  });
  if (loginErr) throw loginErr;
  if (!login?.session?.access_token) throw new Error('No access token');

  const N = 10;
  console.log(JSON.stringify({ test: 'rebuild-concurrent', programme_id: PROGRAMME_A_ID, concurrent: N }));

  const runWave = async (wave) => {
    const t0 = Date.now();
    const calls = Array.from({ length: N }, () =>
      sb.functions.invoke('programme-cockpit-rebuild', { body: { programme_id: PROGRAMME_A_ID } }),
    );
    const res = await Promise.allSettled(calls);
    const ok = res.filter((r) => r.status === 'fulfilled' && !r.value.error).length;
    const fail = res.length - ok;
    const dt = Date.now() - t0;
    console.log(JSON.stringify({ wave, ok, fail, duration_ms: dt }));
    return { ok, fail, dt };
  };

  // wave 1 + snapshot
  await runWave(1);
  const { data: row1, error: rowErr1 } = await sb
    .from('programme_cockpit_read_models')
    .select('projection_run_id, projection_status, generated_at, watermark_event_occurred_at, watermark_source_updated_at, model')
    .eq('programme_id', PROGRAMME_A_ID)
    .maybeSingle();
  if (rowErr1) throw rowErr1;
  if (!row1) throw new Error('No cockpit row after wave 1');
  const alertIds1 = Array.isArray(row1.model?.alerts) ? row1.model.alerts.map((a) => a.id).sort() : [];
  console.log(
    JSON.stringify({
      after_wave: 1,
      projection_run_id: row1.projection_run_id,
      projection_status: row1.projection_status,
      generated_at: row1.generated_at,
      watermark_event_occurred_at: row1.watermark_event_occurred_at,
      watermark_source_updated_at: row1.watermark_source_updated_at,
      alert_count: alertIds1.length,
      alert_ids_hash_hint: alertIds1.slice(0, 5),
    }),
  );

  // wave 2 + determinism check (alert IDs stable)
  await runWave(2);
  const { data: row2, error: rowErr2 } = await sb
    .from('programme_cockpit_read_models')
    .select('projection_run_id, projection_status, generated_at, watermark_event_occurred_at, watermark_source_updated_at, model')
    .eq('programme_id', PROGRAMME_A_ID)
    .maybeSingle();
  if (rowErr2) throw rowErr2;
  if (!row2) throw new Error('No cockpit row after wave 2');
  const alertIds2 = Array.isArray(row2.model?.alerts) ? row2.model.alerts.map((a) => a.id).sort() : [];

  const sameAlerts = JSON.stringify(alertIds1) === JSON.stringify(alertIds2);
  console.log(
    JSON.stringify({
      after_wave: 2,
      projection_run_id: row2.projection_run_id,
      projection_status: row2.projection_status,
      generated_at: row2.generated_at,
      watermark_event_occurred_at: row2.watermark_event_occurred_at,
      watermark_source_updated_at: row2.watermark_source_updated_at,
      alert_count: alertIds2.length,
      deterministic_alert_ids: sameAlerts,
    }),
  );

  if (!sameAlerts) {
    throw new Error('Determinism failed: alert IDs changed between waves (same dataset expected)');
  }

  console.log(JSON.stringify({ ok: true }));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e?.message || String(e) }));
  process.exit(1);
});

