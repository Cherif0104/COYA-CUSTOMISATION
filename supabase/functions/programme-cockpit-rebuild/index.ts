/**
 * Programme Cockpit CQRS (P0) — rebuild batch-first, event-ready.
 *
 * - Vérifie JWT utilisateur (verify_jwt=true dans config.toml)
 * - Vérifie appartenance org + programme
 * - Calcule le read-model `programme_cockpit.v1` côté serveur
 * - Écrit dans `public.programme_cockpit_read_models` (service_role bypass RLS)
 * - Met à jour `public.projection_checkpoints`
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type CockpitRequest = { programme_id?: string };

type LogEnvelope = {
  ts: string;
  projection_name: 'programme_cockpit';
  action: 'rebuild_start' | 'rebuild_end' | 'rebuild_error';
  severity: 'info' | 'warn' | 'error';
  organization_id?: string;
  programme_id?: string;
  actor_user_id?: string;
  duration_ms?: number;
  watermark_event_occurred_at?: string | null;
  watermark_source_updated_at?: string | null;
  alert_count?: number;
  rows?: Record<string, number>;
  error_code?: string;
  error_message?: string;
};

function logJson(e: LogEnvelope) {
  // Logs structurés (stdout/stderr) — utilisables dans PP-OBS-001
  const line = JSON.stringify(e);
  if (e.severity === 'error') console.error(line);
  else console.log(line);
}

function ymd(value?: string | null): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function computeElapsedPercent(startDate?: string | null, endDate?: string | null, now: Date = new Date()): number | null {
  const s = startDate ? new Date(startDate) : null;
  const e = endDate ? new Date(endDate) : null;
  if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) return null;
  const total = e.getTime() - s.getTime();
  const elapsed = now.getTime() - s.getTime();
  return clamp01(elapsed / total) * 100;
}

function budgetAlertLevel(variancePercent: number): 'critical' | 'warning' | 'under' | 'ok' {
  // cohérent `projectCockpitReadModel.ts`
  if (variancePercent >= 15) return 'critical';
  if (variancePercent >= 8) return 'warning';
  if (variancePercent <= -8) return 'under';
  return 'ok';
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deterministicAlertId(params: {
  programmeId: string;
  kind: string;
  scope: string;
  referenceId: string;
}): Promise<{ alert_id: string; alert_key: string }> {
  const alert_key = `prog:${params.programmeId}:${params.kind}:${params.scope}:${params.referenceId}`;
  const alert_id = await sha256Hex(alert_key);
  return { alert_id, alert_key };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(500, { error: 'server_misconfigured' });
  }

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse(401, { error: 'missing_authorization' });
  }

  // Client "user" pour vérifier la session (JWT)
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return jsonResponse(401, { error: 'invalid_session' });
  }

  let body: CockpitRequest = {};
  try {
    body = (await req.json()) as CockpitRequest;
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }
  const programmeId = String(body?.programme_id || '').trim();
  if (!programmeId) return jsonResponse(400, { error: 'missing_programme_id' });

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileErr || !profile?.organization_id) {
    return jsonResponse(403, { error: 'no_organization' });
  }
  const orgId = String(profile.organization_id);
  const startedAt = Date.now();
  const runId = crypto.randomUUID();
  logJson({
    ts: new Date().toISOString(),
    projection_name: 'programme_cockpit',
    action: 'rebuild_start',
    severity: 'info',
    organization_id: orgId,
    programme_id: programmeId,
    actor_user_id: user.id,
  });

  // Mark "building" early for orchestration / UI health
  // (service_role bypass RLS)
  try {
    await admin.from('programme_cockpit_read_models').upsert({
      organization_id: orgId,
      programme_id: programmeId,
      schema_id: 'programme_cockpit.v1',
      model_version: 1,
      projection_run_id: runId,
      projection_status: 'building',
      projection_error: {},
      generated_at: new Date().toISOString(),
      model: {},
    });
  } catch (e) {
    // non-bloquant: rebuild continue, mais on log
    logJson({
      ts: new Date().toISOString(),
      projection_name: 'programme_cockpit',
      action: 'rebuild_error',
      severity: 'error',
      organization_id: orgId,
      programme_id: programmeId,
      actor_user_id: user.id,
      duration_ms: Date.now() - startedAt,
      error_code: 'mark_building_failed',
      error_message: e instanceof Error ? e.message : String(e),
    });
  }

  const { data: programme, error: progErr } = await admin
    .from('programmes')
    .select('id, organization_id, start_date, end_date')
    .eq('id', programmeId)
    .maybeSingle();
  if (progErr || !programme?.id) {
    return jsonResponse(404, { error: 'programme_not_found' });
  }
  if (String(programme.organization_id || '') !== orgId) {
    return jsonResponse(403, { error: 'organization_mismatch' });
  }

  // ---- Sources ----
  const now = new Date();
  const elapsedPercent = computeElapsedPercent(programme.start_date, programme.end_date, now);

  const [
    budgetLinesRes,
    cascadeLinesRes,
    rollupPostRes,
    rollupScopeRes,
    actionsRes,
    activitiesRes,
    expenseReqRes,
    lastEventRes,
  ] = await Promise.all([
    admin.from('programme_budget_lines').select('planned_amount, spent_amount, currency, updated_at').eq('programme_id', programmeId),
    admin
      .from('budget_cascade_lines')
      .select('planned_amount, actual_amount, currency, expense_post_code, scope_level, workflow_status, updated_at, id')
      .eq('programme_id', programmeId),
    admin.from('v_budget_cascade_rollup_by_post').select('*').eq('programme_id', programmeId),
    admin.from('v_budget_cascade_rollup_by_scope').select('*').eq('programme_id', programmeId),
    admin
      .from('programme_actions')
      .select('id, title, status, due_date, period_end, executor_profile_id, proof_url, proof_storage_path, updated_at')
      .eq('programme_id', programmeId),
    admin
      .from('project_activities')
      .select('id, status, mel_target_value, mel_result_value, mel_unit, updated_at')
      .eq('programme_id', programmeId),
    admin.from('expense_requests').select('id, title, status, updated_at').eq('programme_id', programmeId),
    admin
      .from('domain_events')
      .select('occurred_at')
      .eq('organization_id', orgId)
      .eq('aggregate_type', 'programme')
      .eq('aggregate_id', programmeId)
      .order('occurred_at', { ascending: false })
      .limit(1),
  ]);

  const actions = (actionsRes.data || []) as Array<any>;
  const actionIds = actions.map((a) => String(a.id));
  let assigneesRows: Array<{ action_id: string; profile_id: string }> = [];
  if (actionIds.length > 0) {
    const { data } = await admin.from('programme_action_assignees').select('action_id, profile_id').in('action_id', actionIds);
    assigneesRows = (data || []) as any;
  }

  // ---- Budget totals ----
  const budgetLines = (budgetLinesRes.data || []) as Array<any>;
  const currency = String((budgetLines[0]?.currency ?? 'XOF') || 'XOF');
  const plannedTotal = budgetLines.reduce((s, r) => s + (Number(r.planned_amount) || 0), 0);
  const actualTotal = budgetLines.reduce((s, r) => s + (Number(r.spent_amount) || 0), 0);
  const variance = actualTotal - plannedTotal;
  const variancePercent = plannedTotal > 0 ? (variance / plannedTotal) * 100 : 0;
  const burnRatePercent = plannedTotal > 0 ? (actualTotal / plannedTotal) * 100 : 0;
  const alertLevel = budgetAlertLevel(variancePercent);

  // rollups (fallback if views empty)
  const rollPost = (rollupPostRes.data || []) as Array<any>;
  const rollScope = (rollupScopeRes.data || []) as Array<any>;

  // ---- Terrain / MEL ----
  const activities = (activitiesRes.data || []) as Array<any>;
  const activitiesCount = activities.length;
  const byStatus = { planned: 0, ongoing: 0, done: 0, cancelled: 0 };
  let withTarget = 0;
  let withResult = 0;
  let withUnit = 0;
  let missingTargetCount = 0;
  let missingResultCount = 0;
  let resultExceedsTargetCount = 0;
  let negativeOrInvalidCount = 0;
  let plannedCount = 0;
  let completedCount = 0;

  for (const a of activities) {
    const st = String(a.status || 'planned');
    if (st === 'planned') byStatus.planned += 1;
    else if (st === 'in_progress') byStatus.ongoing += 1;
    else if (st === 'completed') byStatus.done += 1;
    else if (st === 'cancelled') byStatus.cancelled += 1;

    if (st === 'planned') plannedCount += 1;
    if (st === 'completed') completedCount += 1;

    const t = a.mel_target_value;
    const r = a.mel_result_value;
    const u = a.mel_unit;
    const hasTarget = t !== null && t !== undefined;
    const hasResult = r !== null && r !== undefined;
    const hasUnit = u !== null && u !== undefined && String(u).trim() !== '';
    if (hasTarget) withTarget += 1;
    if (hasResult) withResult += 1;
    if (hasUnit) withUnit += 1;

    if ((st === 'in_progress' || st === 'completed') && !hasTarget) missingTargetCount += 1;
    if (st === 'completed' && !hasResult) missingResultCount += 1;

    const tn = Number(t);
    const rn = Number(r);
    if (hasTarget && hasResult && Number.isFinite(tn) && Number.isFinite(rn) && rn > tn) resultExceedsTargetCount += 1;
    if ((hasTarget && (!Number.isFinite(tn) || tn < 0)) || (hasResult && (!Number.isFinite(rn) || rn < 0))) negativeOrInvalidCount += 1;
  }
  const completenessPercent = activitiesCount > 0 ? (withResult / activitiesCount) * 100 : 0;
  const completionPercent = activitiesCount > 0 ? (completedCount / activitiesCount) * 100 : 0;

  // ---- Actions programme ----
  const byStatusAction: Record<string, number> = {
    draft: 0,
    pending_validation: 0,
    validated: 0,
    assigned: 0,
    done: 0,
    cancelled: 0,
    not_realized: 0,
  };
  const today = new Date().toISOString().slice(0, 10);
  const dueSoonDays = 3;
  const dueSoonLimit = new Date();
  dueSoonLimit.setDate(dueSoonLimit.getDate() + dueSoonDays);
  const dueSoonYmd = dueSoonLimit.toISOString().slice(0, 10);

  let overdueCount = 0;
  let dueSoonCount = 0;
  let withDueDate = 0;
  let unassignedCount = 0;
  const assigneeByAction = new Map<string, string[]>();
  for (const row of assigneesRows) {
    const aid = String(row.action_id);
    const list = assigneeByAction.get(aid) || [];
    list.push(String(row.profile_id));
    assigneeByAction.set(aid, list);
  }

  const nextDue: Array<any> = [];
  let totalActionsRequiringProof = 0;
  let withProofCount = 0;

  for (const a of actions) {
    const st = String(a.status || 'draft');
    if (byStatusAction[st] === undefined) byStatusAction[st] = 0;
    byStatusAction[st] += 1;
    const deadline = ymd(a.period_end || a.due_date);
    const terminal = st === 'done' || st === 'cancelled' || st === 'not_realized';
    if (deadline) {
      withDueDate += 1;
      if (!terminal && deadline < today) overdueCount += 1;
      if (!terminal && deadline >= today && deadline <= dueSoonYmd) dueSoonCount += 1;
    }

    const assignees = (assigneeByAction.get(String(a.id)) || []).filter(Boolean);
    const effectiveAssignees = assignees.length > 0 ? assignees : a.executor_profile_id ? [String(a.executor_profile_id)] : [];
    if (effectiveAssignees.length === 0) unassignedCount += 1;

    const hasProof = Boolean((a.proof_url && String(a.proof_url).trim()) || (a.proof_storage_path && String(a.proof_storage_path).trim()));
    const proofStatus = hasProof ? 'linked' : 'missing';

    if (st === 'validated' || st === 'assigned' || st === 'done') {
      totalActionsRequiringProof += 1;
      if (hasProof) withProofCount += 1;
    }

    if (deadline && !terminal) {
      nextDue.push({
        id: String(a.id),
        title: String(a.title || ''),
        status: st,
        dueDate: deadline,
        assigneeProfileIds: effectiveAssignees,
        proofStatus,
      });
    }
  }

  nextDue.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const nextDueTop = nextDue.slice(0, 5);
  const missingProofCount = Math.max(0, totalActionsRequiringProof - withProofCount);
  const proofCompletenessPercent = totalActionsRequiringProof > 0 ? (withProofCount / totalActionsRequiringProof) * 100 : 100;

  // ---- Governance minimal ----
  const cascadePending = ((cascadeLinesRes.data || []) as any[]).filter((l) => String(l.workflow_status) === 'submitted').length;
  const expensePending = ((expenseReqRes.data || []) as any[]).filter((r) => String(r.status) === 'pending').length;
  const actionsPendingValidation = actions.filter((a) => String(a.status) === 'pending_validation').length;
  const pendingApprovalsCount = cascadePending + expensePending + actionsPendingValidation;

  const pendingApprovalSamples: any[] = [];
  for (const l of (cascadeLinesRes.data || []) as any[]) {
    if (String(l.workflow_status) !== 'submitted') continue;
    pendingApprovalSamples.push({
      entityType: 'budget_cascade_line',
      entityId: String(l.id),
      label: String(l.label || 'Ligne budgétaire'),
      workflowStatus: String(l.workflow_status),
      updatedAt: l.updated_at ?? null,
    });
    if (pendingApprovalSamples.length >= 6) break;
  }
  if (pendingApprovalSamples.length < 10) {
    for (const r of (expenseReqRes.data || []) as any[]) {
      if (String(r.status) !== 'pending') continue;
      pendingApprovalSamples.push({
        entityType: 'expense_request',
        entityId: String(r.id),
        label: String(r.title || 'Dépense'),
        workflowStatus: String(r.status),
        updatedAt: r.updated_at ?? null,
      });
      if (pendingApprovalSamples.length >= 10) break;
    }
  }

  // ---- Alerts (deterministic ids) ----
  const alerts: any[] = [];
  const generatedAtIso = now.toISOString();

  if (alertLevel === 'critical' || alertLevel === 'warning') {
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'budget_variance',
      scope: 'programme',
      referenceId: 'totals',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'budget_variance',
      severity: alertLevel === 'critical' ? 'high' : 'medium',
      fr: `Budget programme: variance ${variancePercent.toFixed(1)}%`,
      en: `Programme budget variance ${variancePercent.toFixed(1)}%`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'variance_percent', value: Number(variancePercent.toFixed(2)), unit: '%' },
      createdAt: generatedAtIso,
    });
  }

  if (elapsedPercent != null && burnRatePercent > elapsedPercent + 10) {
    const sev = burnRatePercent > elapsedPercent + 20 ? 'high' : 'medium';
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'burn_rate',
      scope: 'programme',
      referenceId: 'totals',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'burn_rate',
      severity: sev,
      fr: `Burn rate supérieur au rythme attendu (${burnRatePercent.toFixed(1)}% vs ${elapsedPercent.toFixed(1)}%)`,
      en: `Burn rate above expected pace (${burnRatePercent.toFixed(1)}% vs ${elapsedPercent.toFixed(1)}%)`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'burn_rate_percent', value: Number(burnRatePercent.toFixed(2)), unit: '%' },
      createdAt: generatedAtIso,
    });
  }

  if (overdueCount > 0) {
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'action_overdue',
      scope: 'programme_actions',
      referenceId: 'overdue_count',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'action_overdue',
      severity: overdueCount >= 5 ? 'high' : 'medium',
      fr: `${overdueCount} action(s) programme en retard`,
      en: `${overdueCount} programme action(s) overdue`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'overdue_actions', value: overdueCount },
      createdAt: generatedAtIso,
    });
  }

  if (missingProofCount > 0) {
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'proof_missing',
      scope: 'programme_actions',
      referenceId: 'missing_proofs',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'proof_missing',
      severity: missingProofCount >= 3 ? 'high' : 'medium',
      fr: `${missingProofCount} preuve(s) manquante(s) sur des actions à justifier`,
      en: `${missingProofCount} missing proof(s) on actions requiring evidence`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'missing_proofs', value: missingProofCount },
      createdAt: generatedAtIso,
    });
  }

  if (missingResultCount > 0 || missingTargetCount > 0) {
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'mel_anomaly',
      scope: 'project_activities',
      referenceId: 'mel_missing',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'mel_anomaly',
      severity: missingResultCount > 0 ? 'high' : 'medium',
      fr: `MEL: ${missingResultCount} activité(s) terminée(s) sans résultat, ${missingTargetCount} sans cible`,
      en: `MEL: ${missingResultCount} completed activity(ies) missing result, ${missingTargetCount} missing target`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'mel_missing_results', value: missingResultCount },
      createdAt: generatedAtIso,
    });
  }

  if (pendingApprovalsCount > 0) {
    const { alert_id, alert_key } = await deterministicAlertId({
      programmeId,
      kind: 'budget_approval_pending',
      scope: 'governance',
      referenceId: 'pending_approvals',
    });
    alerts.push({
      id: alert_id,
      key: alert_key,
      kind: 'budget_approval_pending',
      severity: pendingApprovalsCount >= 5 ? 'high' : 'medium',
      fr: `${pendingApprovalsCount} validation(s) en attente (budget/dépenses/actions)`,
      en: `${pendingApprovalsCount} approval(s) pending (budget/expenses/actions)`,
      entityType: 'programme',
      entityId: programmeId,
      metric: { name: 'pending_approvals', value: pendingApprovalsCount },
      createdAt: generatedAtIso,
    });
  }

  // ---- Risk proxy ----
  let riskScore = 0;
  const drivers: any[] = [];
  if (alertLevel === 'critical') {
    riskScore += 35;
    drivers.push({ kind: 'budget', severity: 'high', value: variancePercent });
  } else if (alertLevel === 'warning') {
    riskScore += 20;
    drivers.push({ kind: 'budget', severity: 'medium', value: variancePercent });
  }
  if (overdueCount > 0) {
    riskScore += Math.min(25, overdueCount * 5);
    drivers.push({ kind: 'overdue_actions', severity: overdueCount >= 5 ? 'high' : 'medium', value: overdueCount });
  }
  const melProblems = missingResultCount + missingTargetCount + negativeOrInvalidCount;
  if (melProblems > 0) {
    riskScore += Math.min(20, melProblems * 2);
    drivers.push({ kind: 'mel_anomalies', severity: melProblems >= 5 ? 'high' : 'medium', value: melProblems });
  }
  if (pendingApprovalsCount > 0) {
    riskScore += Math.min(20, pendingApprovalsCount * 3);
    drivers.push({ kind: 'pending_approvals', severity: pendingApprovalsCount >= 5 ? 'high' : 'medium', value: pendingApprovalsCount });
  }
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

  // ---- Sync health ----
  const lastEventOccurredAt = (lastEventRes.data && lastEventRes.data[0]?.occurred_at) ? String(lastEventRes.data[0].occurred_at) : null;
  const lastProjectedAt = generatedAtIso;
  const lagSeconds = lastEventOccurredAt ? Math.max(0, Math.floor((now.getTime() - new Date(lastEventOccurredAt).getTime()) / 1000)) : null;

  // watermark_source_updated_at: max(updated_at) across sources
  const updatedCandidates: string[] = [];
  for (const r of budgetLines) if (r.updated_at) updatedCandidates.push(String(r.updated_at));
  for (const r of (cascadeLinesRes.data || []) as any[]) if (r.updated_at) updatedCandidates.push(String(r.updated_at));
  for (const r of actions) if (r.updated_at) updatedCandidates.push(String(r.updated_at));
  for (const r of activities) if (r.updated_at) updatedCandidates.push(String(r.updated_at));
  for (const r of (expenseReqRes.data || []) as any[]) if (r.updated_at) updatedCandidates.push(String(r.updated_at));
  const watermarkSourceUpdatedAt = updatedCandidates.length ? updatedCandidates.sort().slice(-1)[0] : null;

  const model = {
    schemaId: 'programme_cockpit.v1',
    modelVersion: 1,
    programmeId,
    organizationId: orgId,
    generatedAt: generatedAtIso,
    period: {
      startDate: programme.start_date ?? null,
      endDate: programme.end_date ?? null,
      elapsedPercent: elapsedPercent != null ? Number(elapsedPercent.toFixed(2)) : null,
    },
    budget: {
      currency,
      plannedTotal,
      actualTotal,
      variance,
      variancePercent: Number(variancePercent.toFixed(2)),
      burnRatePercent: Number(burnRatePercent.toFixed(2)),
      alertLevel,
    },
    budgetRollups: {
      byPost: rollPost.slice(0, 25),
      byScope: rollScope.slice(0, 25),
    },
    terrain: {
      activitiesCount,
      byStatus,
      melCoverage: {
        withTarget,
        withResult,
        withUnit,
        completenessPercent: Number(completenessPercent.toFixed(2)),
      },
      melAnomalies: {
        missingTargetCount,
        missingResultCount,
        resultExceedsTargetCount,
        negativeOrInvalidCount,
      },
      progress: {
        plannedCount,
        completedCount,
        completionPercent: Number(completionPercent.toFixed(2)),
      },
    },
    actions: {
      total: actions.length,
      byStatus: byStatusAction,
      due: {
        withDueDate,
        overdueCount,
        dueSoonCount,
        nextDue: nextDueTop,
      },
      assignees: {
        uniqueAssignees: Array.from(new Set(assigneesRows.map((r) => String(r.profile_id)))).length,
        unassignedCount,
      },
    },
    governance: {
      pendingApprovalsCount,
      byWorkflow: {
        budgetCascadePending: cascadePending,
        expenseRequestsPending: expensePending,
        actionsPendingValidation,
      },
      pendingApprovalSamples,
    },
    proofs: {
      programmeActionProofs: {
        totalActionsRequiringProof,
        withProofCount,
        missingProofCount,
        completenessPercent: Number(proofCompletenessPercent.toFixed(2)),
      },
      uploads: {},
    },
    riskProxy: {
      level: riskLevel,
      score: riskScore,
      drivers,
    },
    alerts,
    sync: {
      projectorStatus: 'ok',
      lastProjectedAt,
      lastProcessedEventOccurredAt: lastEventOccurredAt,
      lagSeconds,
      watermark: { stream: 'domain_events', position: lastEventOccurredAt },
      dataFreshness: {
        budgetsAt: watermarkSourceUpdatedAt,
        terrainAt: watermarkSourceUpdatedAt,
        actionsAt: watermarkSourceUpdatedAt,
      },
    },
  };

  // Persist snapshot + checkpoint
  const { error: upsertErr } = await admin.from('programme_cockpit_read_models').upsert({
    organization_id: orgId,
    programme_id: programmeId,
    schema_id: 'programme_cockpit.v1',
    model_version: 1,
    projection_run_id: runId,
    projection_status: 'ready',
    projection_error: {},
    generated_at: generatedAtIso,
    watermark_event_occurred_at: lastEventOccurredAt,
    watermark_source_updated_at: watermarkSourceUpdatedAt,
    model,
  });
  if (upsertErr) {
    logJson({
      ts: new Date().toISOString(),
      projection_name: 'programme_cockpit',
      action: 'rebuild_error',
      severity: 'error',
      organization_id: orgId,
      programme_id: programmeId,
      actor_user_id: user.id,
      duration_ms: Date.now() - startedAt,
      error_code: 'upsert_failed',
      error_message: String((upsertErr as any)?.message || upsertErr),
    });
    await admin.from('programme_cockpit_read_models').upsert({
      organization_id: orgId,
      programme_id: programmeId,
      schema_id: 'programme_cockpit.v1',
      model_version: 1,
      projection_run_id: runId,
      projection_status: 'failed',
      projection_error: { error_code: 'upsert_failed', message: String((upsertErr as any)?.message || upsertErr) },
      generated_at: generatedAtIso,
    });
    return jsonResponse(500, { error: 'upsert_failed' });
  }

  const { error: ckErr } = await admin.from('projection_checkpoints').upsert({
    projection_name: 'programme_cockpit',
    organization_id: orgId,
    programme_id: programmeId,
    last_built_at: generatedAtIso,
    last_event_occurred_at: lastEventOccurredAt,
    watermark_position: lastEventOccurredAt,
    metadata: { schema_id: 'programme_cockpit.v1', model_version: 1 },
  });
  if (ckErr) {
    logJson({
      ts: new Date().toISOString(),
      projection_name: 'programme_cockpit',
      action: 'rebuild_error',
      severity: 'error',
      organization_id: orgId,
      programme_id: programmeId,
      actor_user_id: user.id,
      duration_ms: Date.now() - startedAt,
      error_code: 'checkpoint_upsert_failed',
      error_message: String((ckErr as any)?.message || ckErr),
    });
  }

  logJson({
    ts: new Date().toISOString(),
    projection_name: 'programme_cockpit',
    action: 'rebuild_end',
    severity: 'info',
    organization_id: orgId,
    programme_id: programmeId,
    actor_user_id: user.id,
    duration_ms: Date.now() - startedAt,
    watermark_event_occurred_at: lastEventOccurredAt,
    watermark_source_updated_at: watermarkSourceUpdatedAt,
    alert_count: alerts.length,
    rows: {
      programme_budget_lines: (budgetLinesRes.data || []).length,
      budget_cascade_lines: (cascadeLinesRes.data || []).length,
      programme_actions: (actionsRes.data || []).length,
      programme_action_assignees: assigneesRows.length,
      project_activities: (activitiesRes.data || []).length,
      expense_requests: (expenseReqRes.data || []).length,
      domain_events_last: (lastEventRes.data || []).length,
    },
  });

  return jsonResponse(200, { ok: true, programme_id: programmeId, generated_at: generatedAtIso });
});

