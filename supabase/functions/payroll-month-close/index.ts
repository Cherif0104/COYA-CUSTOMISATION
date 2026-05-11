/**
 * Stub Edge Function — clôture paie / bulletins.
 * La génération métier réelle s’exécute aujourd’hui côté client (`payrollService.bulkGenerateDraftPaySlipsForPeriod`)
 * après consolidation des temps. Ce handler sert de point d’ancrage pour un cron `pg_net` / scheduler
 * qui appellera plus tard une logique serveur (service role + moteur aligné).
 *
 * Déploiement : `supabase functions deploy payroll-month-close`
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: { period_start?: string; period_end?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    return new Response(
      JSON.stringify({
        ok: true,
        stub: true,
        message_fr:
          'Fonction de clôture paie (stub). Branchez ici un appel service_role vers la même logique que le client ou vers `rh_payroll_close_period_stub` + pipeline métier.',
        message_en: 'Payroll month-close stub. Wire service_role to client-equivalent engine or SQL stub + domain pipeline.',
        period_start: body.period_start ?? null,
        period_end: body.period_end ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
