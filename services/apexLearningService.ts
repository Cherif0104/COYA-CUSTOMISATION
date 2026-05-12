import type { ApexCertificateTemplate, ApexTemporaryLearnerAccess } from '../types';
import { supabase } from './supabaseService';
import { handleOptionalTableError, isTableUnavailable } from './optionalTableGuard';
import OrganizationService from './organizationService';

const APEX_TEMP_ACCESS_TABLE = 'apex_temporary_access';
const APEX_CERT_TEMPLATE_TABLE = 'apex_certificate_templates';
const LEARNING_CERT_TABLE = 'learning_certificates';

const DEFAULT_TEMPLATES: ApexCertificateTemplate[] = [
  {
    id: 'tpl-default',
    name: 'Attestation de suivi',
    body: {
      title: 'Certificat de complétion',
      issuer: 'COYA — APEX',
      legalMention: 'Document non contractuel tant que la génération PDF n’est pas branchée.',
    },
  },
  {
    id: 'tpl-pro',
    name: 'Parcours certifiant (quiz + présence)',
    body: {
      title: 'Certificat professionnel',
      criteria: ['Quiz final ≥ 80 %', 'Présence sessions (si données)'],
      issuer: 'COYA — APEX',
    },
  },
];

function getBaseAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || 'https://app.coya.pro';
}

async function getApexProfileContext(): Promise<{ organizationId: string; profileId: string } | null> {
  try {
    const organizationId = await OrganizationService.getCurrentUserOrganizationId();
    if (!organizationId) return null;
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return null;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !profile?.id) return null;
    return { organizationId, profileId: String(profile.id) };
  } catch {
    return null;
  }
}

async function hashTokenSha256(token: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(token));
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback : hash simple (moins sûr) mais évite de stocker le jeton brut.
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    const chr = token.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
}

export async function listApexCertificateTemplates(): Promise<ApexCertificateTemplate[]> {
  if (isTableUnavailable(APEX_CERT_TEMPLATE_TABLE)) return DEFAULT_TEMPLATES;
  try {
    const { data, error } = await supabase
      .from(APEX_CERT_TEMPLATE_TABLE)
      .select('id, name, body')
      .order('name', { ascending: true });
    if (error) {
      if (handleOptionalTableError(error, APEX_CERT_TEMPLATE_TABLE, 'listApexCertificateTemplates')) {
        return DEFAULT_TEMPLATES;
      }
      console.error('Erreur lecture apex_certificate_templates:', error);
      return DEFAULT_TEMPLATES;
    }
    if (!data || data.length === 0) {
      return DEFAULT_TEMPLATES;
    }
    return data.map((row: any) => ({
      id: String(row.id),
      name: String(row.name || ''),
      body: (row.body as Record<string, unknown>) || {},
    }));
  } catch (error) {
    console.error('Erreur listApexCertificateTemplates:', error);
    return DEFAULT_TEMPLATES;
  }
}

export async function inviteTemporaryLearnerAccess(input: {
  courseId: string;
  email: string;
  validFrom: string;
  validUntil: string;
}): Promise<ApexTemporaryLearnerAccess> {
  const ctx = await getApexProfileContext();
  const safeEmail = input.email.trim();
  const baseShape: ApexTemporaryLearnerAccess = {
    id: `apex-access-${Date.now()}`,
    courseId: input.courseId,
    email: safeEmail,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    accessToken: null,
    linkedProfileId: null,
    magicLink: null,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };

  if (!ctx || isTableUnavailable(APEX_TEMP_ACCESS_TABLE)) {
    return baseShape;
  }

  const rawToken = crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await hashTokenSha256(rawToken);
  const appUrl = getBaseAppUrl().replace(/\/$/, '');
  const magicLink = `${appUrl}/apex/access?token=${encodeURIComponent(rawToken)}`;

  try {
    const { data, error } = await supabase
      .from(APEX_TEMP_ACCESS_TABLE)
      .insert({
        organization_id: ctx.organizationId,
        course_id: input.courseId,
        session_id: null,
        email: safeEmail,
        token_hash: tokenHash,
        expires_at: input.validUntil,
        revoked_at: null,
        created_by_profile_id: ctx.profileId,
        metadata: {
          validFrom: input.validFrom,
          validUntil: input.validUntil,
        },
      })
      .select('*')
      .single();

    if (error) {
      if (handleOptionalTableError(error, APEX_TEMP_ACCESS_TABLE, 'inviteTemporaryLearnerAccess')) {
        return baseShape;
      }
      console.error('Erreur insert apex_temporary_access:', error);
      return baseShape;
    }

    const row: ApexTemporaryLearnerAccess = {
      id: String(data.id),
      courseId: String(data.course_id),
      email: String(data.email),
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      accessToken: rawToken,
      linkedProfileId: data.linked_profile_id ? String(data.linked_profile_id) : null,
      magicLink,
      revokedAt: data.revoked_at ? String(data.revoked_at) : null,
      createdAt: data.created_at ? String(data.created_at) : new Date().toISOString(),
    };

    // TODO: brancher envoi e-mail transactionnel (Resend / Twilio) pour le magic link.
    console.info('[APEX] Magic link temporaire généré:', magicLink);

    return row;
  } catch (error) {
    console.error('Erreur inviteTemporaryLearnerAccess:', error);
    return baseShape;
  }
}

export async function listPendingTemporaryLearnerAccessInvites(): Promise<ApexTemporaryLearnerAccess[]> {
  const ctx = await getApexProfileContext();
  if (!ctx || isTableUnavailable(APEX_TEMP_ACCESS_TABLE)) return [];
  try {
    const { data, error } = await supabase
      .from(APEX_TEMP_ACCESS_TABLE)
      .select('id, course_id, email, expires_at, revoked_at, metadata, created_at, linked_profile_id')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });
    if (error) {
      if (handleOptionalTableError(error, APEX_TEMP_ACCESS_TABLE, 'listPendingTemporaryLearnerAccessInvites')) {
        return [];
      }
      console.error('Erreur select apex_temporary_access:', error);
      return [];
    }
    return (data || []).map((row: any) => {
      const meta = (row.metadata || {}) as { validFrom?: string; validUntil?: string };
      return {
        id: String(row.id),
        courseId: String(row.course_id),
        email: String(row.email),
        validFrom: meta.validFrom || new Date().toISOString(),
        validUntil: meta.validUntil || (row.expires_at ? String(row.expires_at) : new Date().toISOString()),
        accessToken: null,
        linkedProfileId: row.linked_profile_id ? String(row.linked_profile_id) : null,
        magicLink: null,
        revokedAt: row.revoked_at ? String(row.revoked_at) : null,
        createdAt: row.created_at ? String(row.created_at) : undefined,
      };
    });
  } catch (error) {
    console.error('Erreur listPendingTemporaryLearnerAccessInvites:', error);
    return [];
  }
}

export async function revokeTemporaryLearnerAccess(id: string): Promise<boolean> {
  if (isTableUnavailable(APEX_TEMP_ACCESS_TABLE)) return false;
  try {
    const { error } = await supabase
      .from(APEX_TEMP_ACCESS_TABLE)
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      if (handleOptionalTableError(error, APEX_TEMP_ACCESS_TABLE, 'revokeTemporaryLearnerAccess')) {
        return false;
      }
      console.error('Erreur revokeTemporaryLearnerAccess:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur revokeTemporaryLearnerAccess:', error);
    return false;
  }
}

export async function validateTemporaryLearnerAccessToken(token: string): Promise<{
  valid: boolean;
  reason?: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED' | 'TABLE_MISSING';
  row?: ApexTemporaryLearnerAccess;
}> {
  if (isTableUnavailable(APEX_TEMP_ACCESS_TABLE)) {
    return { valid: false, reason: 'TABLE_MISSING' };
  }
  const ctx = await getApexProfileContext();
  if (!ctx) return { valid: false, reason: 'NOT_FOUND' };
  const tokenHash = await hashTokenSha256(token);
  try {
    const { data, error } = await supabase
      .from(APEX_TEMP_ACCESS_TABLE)
      .select('id, course_id, email, expires_at, revoked_at, metadata, created_at, linked_profile_id, organization_id')
      .eq('organization_id', ctx.organizationId)
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (error) {
      if (handleOptionalTableError(error, APEX_TEMP_ACCESS_TABLE, 'validateTemporaryLearnerAccessToken')) {
        return { valid: false, reason: 'TABLE_MISSING' };
      }
      console.error('Erreur validateTemporaryLearnerAccessToken:', error);
      return { valid: false, reason: 'NOT_FOUND' };
    }
    if (!data) return { valid: false, reason: 'NOT_FOUND' };
    const now = new Date();
    const expiresAt = data.expires_at ? new Date(String(data.expires_at)) : null;
    if (data.revoked_at) {
      return { valid: false, reason: 'REVOKED' };
    }
    if (expiresAt && expiresAt < now) {
      return { valid: false, reason: 'EXPIRED' };
    }
    const meta = (data.metadata || {}) as { validFrom?: string; validUntil?: string };
    const row: ApexTemporaryLearnerAccess = {
      id: String(data.id),
      courseId: String(data.course_id),
      email: String(data.email),
      validFrom: meta.validFrom || new Date().toISOString(),
      validUntil: meta.validUntil || (data.expires_at ? String(data.expires_at) : new Date().toISOString()),
      accessToken: null,
      linkedProfileId: data.linked_profile_id ? String(data.linked_profile_id) : null,
      magicLink: null,
      revokedAt: data.revoked_at ? String(data.revoked_at) : null,
      createdAt: data.created_at ? String(data.created_at) : undefined,
    };
    return { valid: true, row };
  } catch (error) {
    console.error('Erreur validateTemporaryLearnerAccessToken:', error);
    return { valid: false, reason: 'NOT_FOUND' };
  }
}

/** Émission : enregistre une ligne dans `learning_certificates` si la table existe. PDF géré côté client. */
export async function tryIssueCertificateRecord(input: {
  courseId: string;
  userId: string;
  templateId: string;
  quizPassed?: boolean;
  attendanceOk?: boolean;
}): Promise<{ certificateUrl: string | null; recordId: string }> {
  if (isTableUnavailable(LEARNING_CERT_TABLE)) {
    return { certificateUrl: null, recordId: `cert-pending-${Date.now()}` };
  }
  const orgId = await OrganizationService.getCurrentUserOrganizationId();
  if (!orgId) {
    return { certificateUrl: null, recordId: `cert-pending-${Date.now()}` };
  }
  const status =
    input.quizPassed === false || input.attendanceOk === false ? 'draft' : 'issued';
  try {
    const { data, error } = await supabase
      .from(LEARNING_CERT_TABLE)
      .insert({
        organization_id: orgId,
        course_id: input.courseId,
        user_id: input.userId,
        course_session_id: null,
        status,
        certificate_number: null,
      })
      .select('id')
      .single();
    if (error) {
      if (handleOptionalTableError(error, LEARNING_CERT_TABLE, 'tryIssueCertificateRecord')) {
        return { certificateUrl: null, recordId: `cert-pending-${Date.now()}` };
      }
      console.error('Erreur insert learning_certificates:', error);
      return { certificateUrl: null, recordId: `cert-pending-${Date.now()}` };
    }
    return { certificateUrl: null, recordId: String(data.id) };
  } catch (error) {
    console.error('Erreur tryIssueCertificateRecord:', error);
    return { certificateUrl: null, recordId: `cert-pending-${Date.now()}` };
  }
}

export function describeAssessmentTypes(isFr: boolean): { key: string; label: string; tiesTo: string }[] {
  return [
    { key: 'qcm', label: isFr ? 'QCM / quiz leçon' : 'MCQ / lesson quiz', tiesTo: 'CourseQuizQuestion (types.ts)' },
    { key: 'validation', label: isFr ? 'Contrôle continu' : 'Continuous assessment', tiesTo: 'Leçons + progression' },
    { key: 'exam', label: isFr ? 'Examen (sessionnel / final)' : 'Session / final exam', tiesTo: 'À étendre sur lessons type quiz' },
  ];
}
