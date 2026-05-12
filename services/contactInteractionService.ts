import { supabase } from './supabaseService';
import type { Contact, CrmContactLifecycleStatus } from '../types';
import { dispatchCrmOutboundEvent } from './crmIntegrationHub';
import { createCrmInteraction, type CrmInteractionChannel } from './crmActivityService';

export const CRM_INTERACTIONS_CHANGED_EVENT = 'coya-crm-interactions-changed';

function mapActionTypeToCrmChannel(action: ContactInteractionActionType): CrmInteractionChannel {
  switch (action) {
    case 'email_sent':
      return 'email';
    case 'phone_call':
      return 'phone';
    case 'whatsapp':
      return 'whatsapp';
    case 'meeting':
      return 'meeting';
    default:
      return 'note';
  }
}

function buildInteractionSummarySnippet(
  motif: string | null,
  detail: string | null,
  actionType: ContactInteractionActionType,
): string {
  const m = (motif || '').trim();
  const d = (detail || '').trim();
  const base = m || actionType;
  if (!d || d === m) return base.slice(0, 280);
  return `${base} — ${d}`.slice(0, 280);
}

export type ContactInteractionActionType =
  | 'follow_up'
  | 'reminder'
  | 'email_sent'
  | 'phone_call'
  | 'meeting'
  | 'whatsapp'
  | 'visit'
  | 'other';

export type ContactInteractionRow = {
  id: string;
  organization_id: string;
  contact_id: string;
  action_type: ContactInteractionActionType;
  motif: string | null;
  status_snapshot: string | null;
  status_updated_to: string | null;
  detail: string | null;
  follow_up_at: string | null;
  created_by: string | null;
  created_at: string;
  /** Rempli côté client après jointure sur `profiles` (auth user_id). */
  created_by_name?: string | null;
};

const UI_STATUS_TO_DB: Record<CrmContactLifecycleStatus, string> = {
  Lead: 'lead',
  Contacted: 'contacted',
  Unreachable: 'unreachable',
  CallbackExpected: 'callback_expected',
  Prospect: 'prospect',
  Customer: 'customer',
};

const DB_STATUS_TO_UI: Record<string, CrmContactLifecycleStatus> = {
  lead: 'Lead',
  contacted: 'Contacted',
  unreachable: 'Unreachable',
  callback_expected: 'CallbackExpected',
  prospect: 'Prospect',
  customer: 'Customer',
};

export function contactStatusUiToDbSnapshot(status: CrmContactLifecycleStatus): string {
  return UI_STATUS_TO_DB[status] ?? 'lead';
}

export function contactStatusDbToUi(db: string | null | undefined): CrmContactLifecycleStatus | null {
  if (!db) return null;
  const k = String(db).trim().toLowerCase();
  return DB_STATUS_TO_UI[k] ?? null;
}

function isUuidContactId(id: string | number): boolean {
  const s = String(id);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function listContactInteractions(contactId: string): Promise<{
  data: ContactInteractionRow[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: new Error(error.message) };
    const rows = (data || []) as ContactInteractionRow[];
    const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
    if (userIds.length === 0) {
      return { data: rows, error: null };
    }
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);
    if (pErr) {
      return { data: rows, error: null };
    }
    const nameBy = new Map<string, string>();
    (profs || []).forEach((p: { user_id: string; full_name: string | null; email: string | null }) => {
      const label = (p.full_name && p.full_name.trim()) || p.email || '';
      if (p.user_id && label) nameBy.set(p.user_id, label);
    });
    const enriched = rows.map((r) => ({
      ...r,
      created_by_name: r.created_by ? nameBy.get(r.created_by) ?? null : null,
    }));
    return { data: enriched, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function insertContactInteraction(params: {
  organizationId: string;
  contactId: string;
  contact: Contact;
  actionType: ContactInteractionActionType;
  motif: string | null;
  detail: string | null;
  statusUpdatedTo: CrmContactLifecycleStatus | null;
  createdByUserId: string | null;
  followUpAt?: string | null;
}): Promise<{ error: Error | null; interactionId?: string | null }> {
  if (!isUuidContactId(params.contactId)) {
    return { error: new Error('CONTACT_NOT_SYNCED') };
  }
  const statusSnapshot = contactStatusUiToDbSnapshot(params.contact.status);
  const statusUpdatedToDb = params.statusUpdatedTo ? contactStatusUiToDbSnapshot(params.statusUpdatedTo) : null;
  try {
    const followIso =
      params.followUpAt && String(params.followUpAt).trim()
        ? new Date(params.followUpAt as string).toISOString()
        : null;
    const { data, error } = await supabase
      .from('contact_interactions')
      .insert({
        organization_id: params.organizationId,
        contact_id: params.contactId,
        action_type: params.actionType,
        motif: params.motif?.trim() || null,
        status_snapshot: statusSnapshot,
        status_updated_to: statusUpdatedToDb,
        detail: params.detail?.trim() || null,
        follow_up_at: followIso,
        created_by: params.createdByUserId ?? null,
      })
      .select('id')
      .single();
    if (error) return { error: new Error(error.message) };
    const interactionId = data?.id != null ? String(data.id) : null;
    const snippet = buildInteractionSummarySnippet(params.motif, params.detail, params.actionType);

    if (interactionId) {
      dispatchCrmOutboundEvent({
        kind: 'interaction.logged',
        version: 1,
        organizationId: params.organizationId,
        contactId: params.contactId,
        interactionId,
        actionType: params.actionType,
        followUpAt: followIso,
        createdBy: params.createdByUserId ?? null,
        summarySnippet: snippet || null,
        metadata: {
          motif: params.motif ?? null,
          status_updated_to: statusUpdatedToDb,
        },
      });
      if (followIso) {
        dispatchCrmOutboundEvent({
          kind: 'follow_up.scheduled',
          version: 1,
          organizationId: params.organizationId,
          contactId: params.contactId,
          interactionId,
          followUpAt: followIso,
          createdBy: params.createdByUserId ?? null,
          summarySnippet: snippet || null,
          metadata: { actionType: params.actionType },
        });
      }

      void createCrmInteraction({
        contactId: params.contactId,
        channel: mapActionTypeToCrmChannel(params.actionType),
        summary: snippet.trim() ? snippet : params.actionType,
        details: {
          source: 'contact_interaction',
          interaction_id: interactionId,
          action_type: params.actionType,
        },
      });

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(CRM_INTERACTIONS_CHANGED_EVENT, { detail: { contactId: params.contactId } }),
          );
        }
      } catch {
        /* ignore */
      }
    }

    return { error: null, interactionId };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
