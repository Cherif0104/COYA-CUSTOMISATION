import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DetailPageShell } from '../../ui/DetailPageShell';
import { ModuleSection } from '../../ui/ModuleSection';
import { fleetDesignTokens } from './fleetDesignTokens';
import {
  NAV_SESSION_OPEN_PROGRAMME_ID,
  NAV_SESSION_OPEN_PROJECT_ID,
  NAV_SESSION_PROGRAMMES_PROJECTS_TAB,
  useAppNavigation,
} from '../../../contexts/AppNavigationContext';
import { useModulePermissions } from '../../../hooks/useModulePermissions';
import type { ModuleName } from '../../../types';
import { projectsHomeView } from '../../../utils/programmesProjectsNav';
import * as parcAutoService from '../../../services/parcAutoService';
import type {
  VehicleHandoverReport,
  VehiclePaymentStatus,
  VehiclePhotoRow,
  VehiclePhotoSlot,
  VehicleRequest,
  VehicleRequestDetailBundle,
  VehicleRequestStatus,
} from '../../../services/parcAutoService';

function expectedN1ApproverId(
  r: VehicleRequest,
  managerByRequester: Map<string, string | null>,
): string | null {
  return r.designatedApproverProfileId || managerByRequester.get(r.requesterId) || null;
}

function paymentStatusLabel(s: VehiclePaymentStatus, isFr: boolean): string {
  const fr: Record<VehiclePaymentStatus, string> = {
    not_invoiced: 'Non facturé',
    pending_payment: 'En attente paiement',
    paid: 'Payé',
    settled: 'Soldé',
  };
  const en: Record<VehiclePaymentStatus, string> = {
    not_invoiced: 'Not invoiced',
    pending_payment: 'Pending payment',
    paid: 'Paid',
    settled: 'Settled',
  };
  return isFr ? fr[s] : en[s];
}

function slotLabel(slot: VehiclePhotoSlot, isFr: boolean): string {
  const fr: Record<VehiclePhotoSlot, string> = {
    avant: 'Avant',
    arriere: 'Arrière',
    interieur: 'Intérieur',
    cockpit: 'Cockpit',
    bagages: 'Bagages',
    extra_1: 'Extra 1',
    extra_2: 'Extra 2',
    extra_3: 'Extra 3',
    extra_4: 'Extra 4',
    extra_5: 'Extra 5',
  };
  const en: Record<VehiclePhotoSlot, string> = {
    avant: 'Front',
    arriere: 'Rear',
    interieur: 'Interior',
    cockpit: 'Cockpit',
    bagages: 'Luggage',
    extra_1: 'Extra 1',
    extra_2: 'Extra 2',
    extra_3: 'Extra 3',
    extra_4: 'Extra 4',
    extra_5: 'Extra 5',
  };
  return isFr ? fr[slot] : en[slot];
}

function statusLabel(s: string, isFr: boolean): string {
  if (s === 'pending_n1') return isFr ? 'Attente N+1' : 'Pending line manager';
  if (s === 'pending_fleet') return isFr ? 'Attente flotte / DAF' : 'Pending fleet';
  if (s === 'validated') return isFr ? 'Validé (flotte)' : 'Fleet validated';
  if (s === 'allocated') return isFr ? 'Mis à disposition' : 'Allocated';
  if (s === 'returned') return isFr ? 'Retourné' : 'Returned';
  if (s === 'rejected') return isFr ? 'Rejeté' : 'Rejected';
  return s;
}

function profileLine(
  profiles: Map<string, { fullName: string | null; email: string | null }>,
  id: string | null | undefined,
): string {
  if (!id) return '—';
  const p = profiles.get(id);
  if (!p) return id.slice(0, 8) + '…';
  return (p.fullName || p.email || id).slice(0, 120);
}

function randomIdPart(): string {
  return typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatMoneyCents(cents: number | null | undefined, isFr: boolean): string {
  if (cents == null || Number.isNaN(cents)) return '—';
  const v = cents / 100;
  return isFr ? `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : `€${v.toFixed(2)}`;
}

const REQUEST_FIELD_LABELS_FR: Partial<Record<keyof VehicleRequest, string>> = {
  id: 'Identifiant',
  organizationId: 'Organisation',
  vehicleId: 'Véhicule interne (id)',
  requesterId: 'Demandeur (profil)',
  status: 'Statut',
  transportMode: 'Mode transport',
  partnerVehicleId: 'Véhicule partenaire (id)',
  programmeId: 'Programme (id)',
  projectId: 'Projet (id)',
  taskId: 'Tâche (id)',
  missionJustification: 'Justification mission',
  designatedApproverProfileId: 'Approbateur N+1 désigné',
  requestedAt: 'Demandé le',
  validatedAt: 'Validé le (legacy)',
  allocatedAt: 'Mis à disposition le',
  returnAt: 'Retour le',
  notes: 'Notes',
  createdAt: 'Créé le',
  updatedAt: 'Mis à jour le',
  routeOrigin: 'Origine',
  routeDestination: 'Destination',
  routeWaypoints: 'Étapes (waypoints)',
  missionOrderStoragePath: 'Ordre de mission (stockage)',
  startAt: 'Début mission',
  endAt: 'Fin mission',
  quotedPriceCents: 'Montant devis (centimes)',
  priceBreakdown: 'Détail prix (JSON)',
  paymentStatus: 'Statut paiement',
  invoiceStoragePath: 'Facture (stockage)',
  invoiceNumber: 'N° facture',
  invoiceMetadata: 'Métadonnées facture',
  n1ValidatedByProfileId: 'N+1 validé par',
  n1ValidatedAt: 'N+1 validé le',
  fleetValidatedByProfileId: 'Flotte validée par',
  fleetValidatedAt: 'Flotte validée le',
  allocatedByProfileId: 'Attribué par',
  rejectedByProfileId: 'Rejeté par',
  rejectedAt: 'Rejeté le',
  releasedAt: 'Libéré le',
};

function emptyDisplay(isFr: boolean): React.ReactNode {
  return <span className="text-slate-400 italic">{isFr ? 'Non renseigné' : 'Not set'}</span>;
}

function formatDateTime(iso: string | null | undefined, isFr: boolean): React.ReactNode {
  if (!iso) return emptyDisplay(isFr);
  try {
    return new Date(iso).toLocaleString(isFr ? 'fr-FR' : 'en-US');
  } catch {
    return iso;
  }
}

type Props = {
  requestId: string;
  /** Change quand la ligne demande est rafraîchie dans la liste (après load / actions). */
  listRowSignal?: string | null;
  onBack: () => void;
  isFr: boolean;
  orgId: string | null;
  myProfileId: string | null;
  managerByRequester: Map<string, string | null>;
  isFleetRole: boolean;
  onUpdateRequestStatus: (id: string, status: VehicleRequestStatus) => void | Promise<void>;
  onOpenHandover: (request: VehicleRequest, phase: 'checkout' | 'checkin', after: VehicleRequestStatus) => void;
  onAfterMutation?: () => void;
};

const VehicleRequestDetailPage: React.FC<Props> = ({
  requestId,
  listRowSignal,
  onBack,
  isFr,
  orgId,
  myProfileId,
  managerByRequester,
  isFleetRole,
  onUpdateRequestStatus,
  onOpenHandover,
  onAfterMutation,
}) => {
  const nav = useAppNavigation();
  const { canAccessModule } = useModulePermissions();
  const [bundle, setBundle] = useState<VehicleRequestDetailBundle | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});
  const [docUrls, setDocUrls] = useState<{ mission: string | null; invoice: string | null }>({
    mission: null,
    invoice: null,
  });
  const [fleetBillingDraft, setFleetBillingDraft] = useState({
    quotedPriceCents: '',
    paymentStatus: 'not_invoiced' as VehiclePaymentStatus,
    invoiceNumber: '',
    priceBreakdownJson: '{}',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [savingBilling, setSavingBilling] = useState(false);

  const reload = useCallback(async () => {
    setLoadError(null);
    setBundle(undefined);
    try {
      const b = await parcAutoService.fetchVehicleRequestDetailBundle(requestId);
      setBundle(b);
      if (b?.request) {
        const r = b.request;
        setFleetBillingDraft({
          quotedPriceCents: r.quotedPriceCents != null ? String(r.quotedPriceCents) : '',
          paymentStatus: r.paymentStatus,
          invoiceNumber: r.invoiceNumber ?? '',
          priceBreakdownJson: r.priceBreakdown ? JSON.stringify(r.priceBreakdown, null, 2) : '{}',
        });
      }
    } catch (e) {
      console.error(e);
      setLoadError(isFr ? 'Erreur de chargement.' : 'Load error.');
      setBundle(null);
    }
  }, [requestId, isFr]);

  useEffect(() => {
    void reload();
  }, [reload, requestId, listRowSignal]);

  const r = bundle?.request;

  const runStatus = async (id: string, status: VehicleRequestStatus) => {
    await Promise.resolve(onUpdateRequestStatus(id, status));
    await reload();
    onAfterMutation?.();
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!bundle?.photos?.length) {
        if (!cancelled) setPhotoUrls({});
        return;
      }
      const next: Record<string, string | null> = {};
      for (const p of bundle.photos) {
        next[p.id] = await parcAutoService.createSignedFleetUrl(p.storagePath, 7200);
      }
      if (!cancelled) setPhotoUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [bundle?.photos]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mission = r?.missionOrderStoragePath
        ? await parcAutoService.createSignedFleetUrl(r.missionOrderStoragePath, 7200)
        : null;
      const invoice = r?.invoiceStoragePath
        ? await parcAutoService.createSignedFleetUrl(r.invoiceStoragePath, 7200)
        : null;
      if (!cancelled) setDocUrls({ mission, invoice });
    })();
    return () => {
      cancelled = true;
    };
  }, [r?.missionOrderStoragePath, r?.invoiceStoragePath]);

  const canActN1On = useCallback(
    (req: VehicleRequest) =>
      req.status === 'pending_n1' &&
      !!myProfileId &&
      expectedN1ApproverId(req, managerByRequester) === myProfileId,
    [myProfileId, managerByRequester],
  );

  const canActFleetOn = useCallback(
    (req: VehicleRequest) => isFleetRole && ['pending_fleet', 'validated', 'allocated'].includes(req.status),
    [isFleetRole],
  );

  const canEditFleetBilling = useCallback(
    (req: VehicleRequest) => isFleetRole && ['pending_fleet', 'validated', 'allocated', 'returned'].includes(req.status),
    [isFleetRole],
  );

  const openProgramme = useCallback(() => {
    if (!r?.programmeId || !nav?.setView) return;
    try {
      sessionStorage.setItem(NAV_SESSION_OPEN_PROGRAMME_ID, r.programmeId);
    } catch {
      /* ignore */
    }
    nav.setView('programme');
  }, [nav, r?.programmeId]);

  const openProject = useCallback(() => {
    if (!r?.projectId || !nav?.setView) return;
    try {
      sessionStorage.setItem(NAV_SESSION_OPEN_PROJECT_ID, r.projectId);
      sessionStorage.setItem(NAV_SESSION_PROGRAMMES_PROJECTS_TAB, 'projects');
    } catch {
      /* ignore */
    }
    nav.setView(projectsHomeView(canAccessModule as (m: ModuleName) => boolean));
  }, [nav, r?.projectId, canAccessModule]);

  const riskAlerts = useMemo(() => {
    if (!r) return [] as { key: string; tone: 'warn' | 'danger' | 'info'; text: string }[];
    const alerts: { key: string; tone: 'warn' | 'danger' | 'info'; text: string }[] = [];
    const end = r.endAt ? new Date(r.endAt).getTime() : null;
    if (end && end < Date.now() && !['returned', 'rejected'].includes(r.status)) {
      alerts.push({
        key: 'overdue',
        tone: 'danger',
        text: isFr
          ? 'Fin de mission dépassée : la demande n’est pas clôturée (retour / rejet).'
          : 'Mission end is in the past but the request is not closed.',
      });
    }
    if (['pending_fleet', 'validated'].includes(r.status) && !r.missionOrderStoragePath?.trim()) {
      alerts.push({
        key: 'mission-doc',
        tone: 'warn',
        text: isFr
          ? 'Ordre de mission absent : recommandé pour la traçabilité avant attribution.'
          : 'Mission order file missing; recommended before allocation.',
      });
    }
    if (['paid', 'settled'].includes(r.paymentStatus) && !r.invoiceStoragePath?.trim()) {
      alerts.push({
        key: 'invoice',
        tone: 'danger',
        text: isFr
          ? 'Incohérence : statut payé/soldé sans chemin de facture en base.'
          : 'Inconsistency: paid/settled without invoice storage path.',
      });
    }
    return alerts;
  }, [r, isFr]);

  const mergedTimeline = useMemo(() => {
    if (!bundle) return [];
    const prof = bundle.profilesById;
    type Row = { at: string; kind: 'transition' | 'audit'; title: string; sub: string; icon: string; details?: Record<string, unknown> };
    const rows: Row[] = bundle.transitions.map((t) => ({
      at: t.createdAt,
      kind: 'transition' as const,
      title: isFr ? `Changement de statut · ${(t.fromStatus || '—') + ' → ' + t.toStatus}` : `Status · ${(t.fromStatus || '—')} → ${t.toStatus}`,
      sub: profileLine(prof, t.actorProfileId ?? undefined),
      icon: 'fas fa-random',
      details: t.meta,
    }));
    for (const ev of bundle.auditEvents) {
      rows.push({
        at: ev.createdAt,
        kind: 'audit',
        title: isFr ? `Audit · ${ev.eventType}` : `Audit · ${ev.eventType}`,
        sub: `${isFr ? 'Sujet' : 'Subject'} · ${ev.subjectType} — ${isFr ? 'Acteur' : 'Actor'} · ${profileLine(prof, ev.actorProfileId ?? undefined)}`,
        icon: 'fas fa-clipboard-check',
        details: ev.details,
      });
    }
    return rows.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [bundle, isFr]);

  const submitFleetBillingPatch = async () => {
    if (!r || !orgId) return;
    setSavingBilling(true);
    try {
      let invoiceStoragePath: string | null | undefined = r.invoiceStoragePath ?? null;
      if (invoiceFile) {
        const ext = invoiceFile.name.split('.').pop() || 'pdf';
        const rel = `vehicle-requests/invoices/${randomIdPart()}.${ext}`;
        const up = await parcAutoService.uploadFleetPrivateObject({
          organizationId: orgId,
          relativePath: rel,
          file: invoiceFile,
          contentType: invoiceFile.type || undefined,
        });
        if (!up) {
          alert(isFr ? 'Échec upload facture.' : 'Invoice upload failed.');
          setSavingBilling(false);
          return;
        }
        invoiceStoragePath = up;
      }
      if (['paid', 'settled'].includes(fleetBillingDraft.paymentStatus) && !invoiceStoragePath) {
        alert(isFr ? 'Statut payé/soldé : joindre une facture.' : 'Paid/settled requires an invoice attachment.');
        setSavingBilling(false);
        return;
      }
      let priceBreakdown: Record<string, unknown> = {};
      try {
        priceBreakdown = fleetBillingDraft.priceBreakdownJson.trim()
          ? (JSON.parse(fleetBillingDraft.priceBreakdownJson) as Record<string, unknown>)
          : {};
      } catch {
        alert(isFr ? 'JSON détail prix invalide.' : 'Invalid price breakdown JSON.');
        setSavingBilling(false);
        return;
      }
      const ok = await parcAutoService.patchVehicleRequestFleetFields(r.id, {
        quotedPriceCents: fleetBillingDraft.quotedPriceCents.trim()
          ? parseInt(fleetBillingDraft.quotedPriceCents, 10)
          : null,
        priceBreakdown,
        paymentStatus: fleetBillingDraft.paymentStatus,
        invoiceStoragePath,
        invoiceNumber: fleetBillingDraft.invoiceNumber.trim() || null,
      });
      if (ok) {
        setInvoiceFile(null);
        await reload();
        onAfterMutation?.();
      }
    } finally {
      setSavingBilling(false);
    }
  };

  const statusBadgeClass = useMemo(() => {
    if (!r) return 'bg-slate-100 text-slate-700';
    if (r.status === 'returned') return 'bg-green-100 text-green-800';
    if (r.status === 'allocated') return 'bg-blue-100 text-blue-800';
    if (r.status === 'validated') return 'bg-amber-100 text-amber-800';
    if (r.status === 'rejected') return 'bg-red-100 text-red-800';
    if (r.status === 'pending_n1') return 'bg-violet-100 text-violet-800';
    return 'bg-slate-100 text-slate-700';
  }, [r]);

  if (bundle === undefined && !loadError) {
    return (
      <div className="flex items-center gap-2 text-slate-500 p-8">
        <span className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
        <span>{isFr ? 'Chargement de la demande…' : 'Loading request…'}</span>
      </div>
    );
  }

  if (loadError || bundle === null) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <button type="button" onClick={onBack} className="btn-3d-secondary text-sm">
          ← {isFr ? 'Retour à la liste' : 'Back to list'}
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 text-sm">
          {loadError || (isFr ? 'Demande introuvable ou accès refusé.' : 'Request not found or access denied.')}
        </div>
      </div>
    );
  }

  if (!bundle || !r) return null;

  const profiles = bundle.profilesById;
  const transportTitle =
    r.transportMode === 'partner'
      ? [r.partnerCompanyName, r.partnerVehicleLabel].filter(Boolean).join(' — ') ||
        (r.partnerVehicleId ? r.partnerVehicleId.slice(0, 8) : '—')
      : bundle.vehicle?.name || (r.vehicleId ? r.vehicleId.slice(0, 8) : '—');

  const renderDbFieldRow = (key: keyof VehicleRequest) => {
    const val = r[key];
    const label = isFr ? REQUEST_FIELD_LABELS_FR[key] ?? String(key) : String(key);
    const isEmpty =
      val === undefined ||
      val === null ||
      val === '' ||
      (key === 'routeWaypoints' && Array.isArray(val) && val.length === 0) ||
      (key === 'priceBreakdown' && val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val as object).length === 0) ||
      (key === 'invoiceMetadata' && val && typeof val === 'object' && Object.keys(val as object).length === 0);
    let display: React.ReactNode;
    if (isEmpty) display = emptyDisplay(isFr);
    else if (key === 'quotedPriceCents') display = formatMoneyCents(val as number, isFr);
    else if (
      key === 'requestedAt' ||
      key === 'validatedAt' ||
      key === 'allocatedAt' ||
      key === 'returnAt' ||
      key === 'createdAt' ||
      key === 'updatedAt' ||
      key === 'startAt' ||
      key === 'endAt' ||
      key === 'n1ValidatedAt' ||
      key === 'fleetValidatedAt' ||
      key === 'rejectedAt' ||
      key === 'releasedAt'
    )
      display = formatDateTime(val as string, isFr);
    else if (key === 'routeWaypoints' || key === 'priceBreakdown' || key === 'invoiceMetadata') {
      display = (
        <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    } else if (typeof val === 'object') display = JSON.stringify(val);
    else display = String(val);
    return (
      <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-slate-100 py-2 last:border-0">
        <div className="text-xs font-medium text-slate-500 md:col-span-1">{label}</div>
        <div className="md:col-span-2 break-words">{display}</div>
      </div>
    );
  };

  const allRequestKeys = [
    'id',
    'organizationId',
    'vehicleId',
    'requesterId',
    'status',
    'transportMode',
    'partnerVehicleId',
    'programmeId',
    'projectId',
    'taskId',
    'missionJustification',
    'designatedApproverProfileId',
    'requestedAt',
    'validatedAt',
    'allocatedAt',
    'returnAt',
    'notes',
    'createdAt',
    'updatedAt',
    'routeOrigin',
    'routeDestination',
    'routeWaypoints',
    'missionOrderStoragePath',
    'startAt',
    'endAt',
    'quotedPriceCents',
    'priceBreakdown',
    'paymentStatus',
    'invoiceStoragePath',
    'invoiceNumber',
    'invoiceMetadata',
    'n1ValidatedByProfileId',
    'n1ValidatedAt',
    'fleetValidatedByProfileId',
    'fleetValidatedAt',
    'allocatedByProfileId',
    'rejectedByProfileId',
    'rejectedAt',
    'releasedAt',
  ] as (keyof VehicleRequest)[];

  const navLink = (href: string, label: string) => (
    <a
      key={href}
      href={href}
      className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-800"
    >
      {label}
    </a>
  );

  const Accordion: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
    title,
    defaultOpen,
    children,
  }) => (
    <ModuleSection title={title} collapseOnMobile mobileDefaultOpen={!!defaultOpen} className="!shadow-sm">
      {children}
    </ModuleSection>
  );

  return (
    <DetailPageShell tone="enterprise" maxWidthClass="max-w-5xl" innerClassName="px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="btn-3d-secondary text-sm">
          ← {isFr ? 'Retour à la liste' : 'Back to list'}
        </button>
        <span className="text-xs text-slate-400 font-mono">{r.id}</span>
      </div>

      <nav
        className={`${fleetDesignTokens.stickyNav} -mx-4 px-4 py-2 flex flex-wrap gap-2`}
        aria-label={isFr ? 'Sommaire' : 'Table of contents'}
      >
        {navLink('#section-overview', isFr ? 'Vue d’ensemble' : 'Overview')}
        {navLink('#section-mission', isFr ? 'Mission & N+1' : 'Mission & approvers')}
        {navLink('#section-workflow', isFr ? 'Jalons' : 'Milestones')}
        {navLink('#section-links', isFr ? 'Liens' : 'Links')}
        {navLink('#section-transport', isFr ? 'Transport' : 'Transport')}
        {navLink('#section-route', isFr ? 'Itinéraire' : 'Route')}
        {navLink('#section-handovers', isFr ? 'Constats' : 'Handovers')}
        {navLink('#section-billing', isFr ? 'Facturation' : 'Billing')}
        {navLink('#section-gallery', isFr ? 'Pièces & photos' : 'Docs & photos')}
        {navLink('#section-timeline', isFr ? 'Chronologie' : 'Timeline')}
        {navLink('#section-data', isFr ? 'Données complètes' : 'Full data')}
      </nav>

      {riskAlerts.length > 0 ? (
        <div className="space-y-2">
          {riskAlerts.map((a) => (
            <div
              key={a.key}
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm ${
                a.tone === 'danger'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : a.tone === 'warn'
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                    : 'border-sky-200 bg-sky-50 text-sky-950'
              }`}
            >
              <i className="fas fa-exclamation-triangle mr-2" aria-hidden />
              {a.text}
            </div>
          ))}
        </div>
      ) : null}

      {/* Macro — toujours visible ; pas de repli mobile */}
      <section id="section-overview" className={fleetDesignTokens.heroCard + ' p-5'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isFr ? 'Demande véhicule' : 'Vehicle request'}
            </h1>
            <p className="text-slate-600 mt-1">{transportTitle}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass}`}>
                {statusLabel(r.status, isFr)}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                {r.transportMode === 'partner'
                  ? isFr
                    ? 'Prestataire'
                    : 'Partner'
                  : isFr
                    ? 'Flotte interne'
                    : 'Internal fleet'}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-800">
                {paymentStatusLabel(r.paymentStatus, isFr)}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-slate-600 space-y-1 min-w-[200px]">
            <div>
              <span className="text-slate-400">{isFr ? 'Demandeur · ' : 'Requester · '}</span>
              {profileLine(profiles, r.requesterId)}
            </div>
            <div>
              <span className="text-slate-400">{isFr ? 'Créée · ' : 'Created · '}</span>
              {formatDateTime(r.requestedAt, isFr)}
            </div>
            <div className="font-semibold text-slate-900">
              {isFr ? 'Montant devis · ' : 'Quote · '}
              {formatMoneyCents(r.quotedPriceCents, isFr)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-slate-100 p-3">
              <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Synthèse trajet' : 'Route summary'}</div>
              <div className="text-sm font-medium text-slate-800 mt-1">
                {(r.routeOrigin || (isFr ? 'Non renseigné' : 'Not set')) +
                  ' → ' +
                  (r.routeDestination || (isFr ? 'Non renseigné' : 'Not set'))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isFr
                  ? 'Résumé textuel ; intégration carte / itinéraire calculé à brancher (GPS, distance, durée).'
                  : 'Text summary; plug in map provider for distance and ETA.'}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-3">
              <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Dates clés' : 'Key dates'}</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                <li>
                  <span className="text-slate-400">{isFr ? 'Début · ' : 'Start · '}</span>
                  {formatDateTime(r.startAt, isFr)}
                </li>
                <li>
                  <span className="text-slate-400">{isFr ? 'Fin · ' : 'End · '}</span>
                  {formatDateTime(r.endAt, isFr)}
                </li>
                <li>
                  <span className="text-slate-400">{isFr ? 'Libération · ' : 'Released · '}</span>
                  {formatDateTime(r.releasedAt, isFr)}
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 flex flex-col items-center justify-center text-center min-h-[140px]">
            <i className="fas fa-map-marked-alt text-2xl text-slate-400 mb-2" aria-hidden />
            <p className="text-xs font-medium text-slate-600">{isFr ? 'Carte / trajet' : 'Map / route'}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {isFr ? 'Emplacement réservé (Figma : zone carte).' : 'Placeholder (Figma map area).'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Transitions' : 'Transitions'}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{bundle.transitions.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Audit' : 'Audit'}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{bundle.auditEvents.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Constats' : 'Handovers'}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{bundle.handovers.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-3">
            <div className="text-[10px] uppercase text-slate-400">{isFr ? 'Photos' : 'Photos'}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{bundle.photos.length}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-200">
          {canActN1On(r) && (
            <>
              <button
                type="button"
                className="btn-3d-primary text-xs py-2 px-3"
                onClick={() => void runStatus(r.id, 'pending_fleet')}
              >
                {isFr ? 'N+1 OK → flotte' : 'N+1 OK → fleet'}
              </button>
              <button
                type="button"
                className="btn-3d-danger text-xs py-2 px-3"
                onClick={() => void runStatus(r.id, 'rejected')}
              >
                {isFr ? 'Rejeter' : 'Reject'}
              </button>
            </>
          )}
          {canActFleetOn(r) && r.status === 'pending_fleet' && (
            <>
              <button
                type="button"
                className="btn-3d-primary text-xs py-2 px-3"
                onClick={() => void runStatus(r.id, 'validated')}
              >
                {isFr ? 'Valider (flotte)' : 'Validate (fleet)'}
              </button>
              <button
                type="button"
                className="btn-3d-danger text-xs py-2 px-3"
                onClick={() => void runStatus(r.id, 'rejected')}
              >
                {isFr ? 'Rejeter' : 'Reject'}
              </button>
            </>
          )}
          {canActFleetOn(r) && r.status === 'validated' && r.transportMode === 'internal' && (
            <button
              type="button"
              className="btn-3d-primary text-xs py-2 px-3"
              onClick={() => onOpenHandover(r, 'checkout', 'allocated')}
            >
              {isFr ? 'Mise à disposition (constat sortie)' : 'Allocate (checkout)'}
            </button>
          )}
          {canActFleetOn(r) && r.status === 'validated' && r.transportMode === 'partner' && (
            <button
              type="button"
              className="btn-3d-primary text-xs py-2 px-3"
              onClick={() => void runStatus(r.id, 'allocated')}
            >
              {isFr ? 'Marquer mis à disposition' : 'Mark allocated'}
            </button>
          )}
          {canActFleetOn(r) && r.status === 'allocated' && r.transportMode === 'internal' && (
            <button
              type="button"
              className="btn-3d-secondary text-xs py-2 px-3"
              onClick={() => onOpenHandover(r, 'checkin', 'returned')}
            >
              {isFr ? 'Retour (constat entrée)' : 'Return (check-in)'}
            </button>
          )}
          {canActFleetOn(r) && r.status === 'allocated' && r.transportMode === 'partner' && (
            <button
              type="button"
              className="btn-3d-secondary text-xs py-2 px-3"
              onClick={() => void runStatus(r.id, 'returned')}
            >
              {isFr ? 'Clôturer mission' : 'Close mission'}
            </button>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <div id="section-mission">
          <Accordion title={isFr ? 'Mission, conducteur & chaîne N+1' : 'Mission, driver & approver chain'} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">{isFr ? 'Justification' : 'Justification'}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{r.missionJustification || emptyDisplay(isFr)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">{isFr ? 'Notes internes' : 'Internal notes'}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{r.notes || emptyDisplay(isFr)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">{isFr ? 'Chaîne de validation' : 'Approval chain'}</p>
              <ol className="mt-2 space-y-2 text-xs text-slate-700 list-decimal pl-4">
                <li>
                  <span className="font-semibold">{isFr ? 'Demandeur / conducteur' : 'Requester / driver'} · </span>
                  {profileLine(profiles, r.requesterId)}
                </li>
                <li>
                  <span className="font-semibold">{isFr ? 'N+1 attendu' : 'Expected line manager'} · </span>
                  {profileLine(profiles, expectedN1ApproverId(r, managerByRequester) ?? undefined)}
                  {r.designatedApproverProfileId ? (
                    <span className="block text-slate-500 mt-0.5">
                      {isFr ? '(Désignation explicite sur la demande)' : '(Explicit approver on request)'}
                    </span>
                  ) : null}
                </li>
                <li>
                  <span className="font-semibold">{isFr ? 'Flotte / DAF' : 'Fleet / finance'} · </span>
                  {isFr ? 'Validation matérielle, attribution, facturation.' : 'Fleet validation, allocation, billing.'}
                </li>
              </ol>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              {isFr
                ? 'Assurance véhicule et contrôle technique : champs non présents en base pour l’instant (évolution prévue).'
                : 'Insurance and roadworthiness: not stored in DB yet (planned extension).'}
            </p>
          </Accordion>
        </div>

        <div id="section-workflow">
          <Accordion title={isFr ? 'Jalons workflow' : 'Workflow milestones'}>
          <ul className="space-y-2">
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Demandé' : 'Requested'}:</span>
              {r.requestedAt ? new Date(r.requestedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US') : '—'}
            </li>
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Validation N+1' : 'N+1 validation'}:</span>
              {r.n1ValidatedAt
                ? `${new Date(r.n1ValidatedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')} (${profileLine(profiles, r.n1ValidatedByProfileId)})`
                : '—'}
            </li>
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Validation flotte' : 'Fleet validation'}:</span>
              {r.fleetValidatedAt
                ? `${new Date(r.fleetValidatedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')} (${profileLine(profiles, r.fleetValidatedByProfileId)})`
                : '—'}
            </li>
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Mis à disposition' : 'Allocated'}:</span>
              {r.allocatedAt
                ? `${new Date(r.allocatedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')} (${profileLine(profiles, r.allocatedByProfileId)})`
                : '—'}
            </li>
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Retour' : 'Returned'}:</span>
              {r.returnAt ? new Date(r.returnAt).toLocaleString(isFr ? 'fr-FR' : 'en-US') : '—'}
            </li>
            <li className="flex flex-wrap gap-2">
              <span className="font-medium text-slate-600">{isFr ? 'Rejet' : 'Rejected'}:</span>
              {r.rejectedAt
                ? `${new Date(r.rejectedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')} (${profileLine(profiles, r.rejectedByProfileId)})`
                : '—'}
            </li>
          </ul>
        </Accordion>
        </div>

        <div id="section-links">
        <Accordion title={isFr ? 'Lien programme / projet / tâche' : 'Programme / project / task'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {r.programmeId ? (
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/80">
                <div className="text-xs text-slate-500">{isFr ? 'Programme' : 'Programme'}</div>
                <div className="font-medium text-slate-900">{r.programmeName || r.programmeId}</div>
                {canAccessModule('programme' as ModuleName) && nav?.setView ? (
                  <button type="button" className="text-emerald-700 text-xs underline mt-2" onClick={openProgramme}>
                    {isFr ? 'Ouvrir le programme' : 'Open programme'}
                  </button>
                ) : null}
              </div>
            ) : null}
            {r.projectId ? (
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/80">
                <div className="text-xs text-slate-500">{isFr ? 'Projet' : 'Project'}</div>
                <div className="font-medium text-slate-900">{r.projectTitle || r.projectId}</div>
                {canAccessModule('projects' as ModuleName) && nav?.setView ? (
                  <button type="button" className="text-emerald-700 text-xs underline mt-2" onClick={openProject}>
                    {isFr ? 'Ouvrir le projet' : 'Open project'}
                  </button>
                ) : null}
              </div>
            ) : null}
            {r.taskId ? (
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/80">
                <div className="text-xs text-slate-500">{isFr ? 'Tâche' : 'Task'}</div>
                <div className="font-medium text-slate-900">{r.taskTitle || r.taskId}</div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {isFr
                    ? 'Ouvrez le projet pour gérer la tâche dans le workspace.'
                    : 'Open the project to work on the task in the workspace.'}
                </p>
              </div>
            ) : null}
            {!r.programmeId && !r.projectId && !r.taskId ? (
              <p className="text-slate-500 text-sm">{isFr ? 'Aucun lien mission.' : 'No mission links.'}</p>
            ) : null}
          </div>
        </Accordion>
        </div>

        <div id="section-transport">
        {r.transportMode === 'partner' && (bundle.partnerCompany || bundle.partnerVehicle) ? (
          <Accordion title={isFr ? 'Prestataire transport' : 'Transport partner'} defaultOpen>
            {bundle.partnerCompany ? (
              <div className="space-y-1">
                <div className="font-semibold">{bundle.partnerCompany.name}</div>
                {bundle.partnerCompany.contactEmail ? <div>{bundle.partnerCompany.contactEmail}</div> : null}
                {bundle.partnerCompany.phone ? <div>{bundle.partnerCompany.phone}</div> : null}
                {bundle.partnerCompany.notes ? (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap">{bundle.partnerCompany.notes}</div>
                ) : null}
              </div>
            ) : null}
            {bundle.partnerVehicle ? (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-600">{isFr ? 'Véhicule' : 'Vehicle'}</div>
                <div>{bundle.partnerVehicle.label}</div>
                {bundle.partnerVehicle.plateNumber ? <div>{bundle.partnerVehicle.plateNumber}</div> : null}
                {bundle.partnerVehicle.seats != null ? (
                  <div>
                    {isFr ? 'Places · ' : 'Seats · '}
                    {bundle.partnerVehicle.seats}
                  </div>
                ) : null}
                {bundle.partnerVehicle.notes ? (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap">{bundle.partnerVehicle.notes}</div>
                ) : null}
              </div>
            ) : null}
          </Accordion>
        ) : null}

        {r.transportMode === 'internal' && bundle.vehicle ? (
          <Accordion title={isFr ? 'Véhicule interne' : 'Internal vehicle'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">{isFr ? 'Nom · ' : 'Name · '}</span>
                {bundle.vehicle.name}
              </div>
              <div>
                <span className="text-slate-500">{isFr ? 'Immat. · ' : 'Plate · '}</span>
                {bundle.vehicle.plateNumber || '—'}
              </div>
              <div>
                <span className="text-slate-500">{isFr ? 'Km · ' : 'Km · '}</span>
                {bundle.vehicle.currentOdometer ?? '—'}
              </div>
              <div>
                <span className="text-slate-500">{isFr ? 'Lieu · ' : 'Location · '}</span>
                {bundle.vehicle.location || '—'}
              </div>
            </div>
          </Accordion>
        ) : null}
        </div>

        <div id="section-route">
        <Accordion title={isFr ? 'Itinéraire détaillé' : 'Itinerary detail'}>
          <div className="space-y-2">
            <div>
              <span className="font-medium">{isFr ? 'Origine · ' : 'Origin · '}</span>
              {r.routeOrigin || '—'}
            </div>
            <div>
              <span className="font-medium">{isFr ? 'Destination · ' : 'Destination · '}</span>
              {r.routeDestination || '—'}
            </div>
            {r.routeWaypoints && r.routeWaypoints.length > 0 ? (
              <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(r.routeWaypoints, null, 2)}
              </pre>
            ) : (
              <p className="text-slate-500 text-xs">{isFr ? 'Pas d’étapes intermédiaires.' : 'No waypoints.'}</p>
            )}
            <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                {isFr ? 'JSON brut (waypoints / métadonnées trajet)' : 'Raw JSON (waypoints)'}
              </summary>
              <pre className="mt-2 text-[10px] bg-white p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify({ waypoints: r.routeWaypoints ?? [] }, null, 2)}
              </pre>
            </details>
          </div>
        </Accordion>
        </div>

        <div id="section-handovers">
        <Accordion title={isFr ? 'Constats remise / retour' : 'Handover reports'}>
          {bundle.handovers.length === 0 ? (
            <p className="text-slate-500">{isFr ? 'Aucun constat enregistré.' : 'No handover records.'}</p>
          ) : (
            <div className="space-y-4">
              {bundle.handovers.map((h: VehicleHandoverReport) => (
                <div key={h.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-semibold text-slate-800">
                    {h.phase === 'checkout'
                      ? isFr
                        ? 'Constat de sortie'
                        : 'Checkout'
                      : isFr
                        ? 'Constat de retour'
                        : 'Check-in'}
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-1">
                    <div>
                      {isFr ? 'Km · ' : 'Odometer · '}
                      {h.odometer ?? '—'}
                    </div>
                    <div>
                      {isFr ? 'Carburant % · ' : 'Fuel % · '}
                      {h.fuelLevelPercent ?? '—'}
                    </div>
                    <div>
                      {isFr ? 'Enregistré · ' : 'Recorded · '}
                      {new Date(h.recordedAt).toLocaleString(isFr ? 'fr-FR' : 'en-US')} —{' '}
                      {profileLine(profiles, h.recordedByProfileId)}
                    </div>
                    {h.conditionNotes ? (
                      <div className="whitespace-pre-wrap mt-2">{h.conditionNotes}</div>
                    ) : null}
                    {h.maintenanceFlag ? (
                      <div className="text-amber-700 font-medium">
                        {isFr ? 'Maintenance / anomalie signalée' : 'Maintenance / issue flagged'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Accordion>
        </div>

        <div id="section-gallery">
          <Accordion title={isFr ? 'Galerie pièces & photos' : 'Documents & photo gallery'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col items-center text-center">
                {docUrls.mission ? (
                  <a href={docUrls.mission} target="_blank" rel="noreferrer" className="block w-full">
                    <div className="h-28 w-full rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <i className="fas fa-file-pdf text-3xl text-red-500" aria-hidden />
                    </div>
                    <span className="mt-2 text-xs font-medium text-emerald-800 underline">
                      {isFr ? 'Ordre de mission' : 'Mission order'}
                    </span>
                  </a>
                ) : (
                  <>
                    <div className="h-28 w-full rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <i className="fas fa-file-upload text-2xl" aria-hidden />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{isFr ? 'Aucun ordre de mission joint.' : 'No mission order attached.'}</p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-col items-center text-center">
                {docUrls.invoice ? (
                  <a href={docUrls.invoice} target="_blank" rel="noreferrer" className="block w-full">
                    <div className="h-28 w-full rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <i className="fas fa-file-invoice text-3xl text-slate-600" aria-hidden />
                    </div>
                    <span className="mt-2 text-xs font-medium text-emerald-800 underline">
                      {isFr ? 'Facture' : 'Invoice'}
                    </span>
                  </a>
                ) : (
                  <>
                    <div className="h-28 w-full rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <i className="fas fa-file-invoice-dollar text-2xl" aria-hidden />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{isFr ? 'Aucune facture jointe.' : 'No invoice attached.'}</p>
                  </>
                )}
              </div>
              {r.transportMode === 'internal' && bundle.photos.length > 0
                ? bundle.photos.map((p: VehiclePhotoRow) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                      <div className="text-[10px] font-semibold uppercase text-slate-500 px-2 py-1 bg-slate-50">
                        {slotLabel(p.slot, isFr)}
                      </div>
                      {photoUrls[p.id] ? (
                        <a href={photoUrls[p.id]!} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={photoUrls[p.id]!}
                            alt={slotLabel(p.slot, isFr)}
                            className="h-32 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="p-2 text-[10px] text-slate-400 break-all">{p.storagePath}</div>
                      )}
                    </div>
                  ))
                : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 col-span-full">
                    {r.transportMode === 'internal'
                      ? isFr
                        ? 'Pas de photos véhicule enregistrées pour ce dossier.'
                        : 'No vehicle photos for this request.'
                      : isFr
                        ? 'Photos réservées au mode flotte interne.'
                        : 'Photos apply to internal fleet mode only.'}
                  </div>
                )}
            </div>
          </Accordion>
        </div>

        <div id="section-billing">
        <Accordion title={isFr ? 'Coûts & facturation' : 'Costs & billing'}>
          <div className="space-y-2 text-sm">
            <div>
              {isFr ? 'Montant devis · ' : 'Quote · '}
              {formatMoneyCents(r.quotedPriceCents, isFr)}
            </div>
            <div>
              {isFr ? 'Statut paiement · ' : 'Payment status · '}
              {paymentStatusLabel(r.paymentStatus, isFr)}
            </div>
            {r.invoiceNumber ? (
              <div>
                {isFr ? 'N° facture · ' : 'Invoice # · '}
                {r.invoiceNumber}
              </div>
            ) : (
              <div>
                {isFr ? 'N° facture · ' : 'Invoice # · '}
                {emptyDisplay(isFr)}
              </div>
            )}
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">{isFr ? 'Détail tarifaire (JSON)' : 'Price breakdown'}</p>
              {r.priceBreakdown && Object.keys(r.priceBreakdown).length > 0 ? (
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <tbody>
                    {Object.entries(r.priceBreakdown).map(([k, v]) => (
                      <tr key={k} className="border-b border-slate-100 last:border-0 bg-white">
                        <td className="px-2 py-1.5 font-medium text-slate-600 w-1/3">{k}</td>
                        <td className="px-2 py-1.5 text-slate-900 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-500">{isFr ? 'Aucune ligne de détail.' : 'No breakdown lines.'}</p>
              )}
            </div>
            <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                {isFr ? 'Métadonnées facture (JSON)' : 'Invoice metadata (JSON)'}
              </summary>
              <pre className="mt-2 text-[10px] bg-white p-2 rounded overflow-x-auto max-h-40">
                {JSON.stringify(r.invoiceMetadata ?? {}, null, 2)}
              </pre>
            </details>
          </div>

          {canEditFleetBilling(r) && orgId ? (
            <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-white space-y-2 max-w-xl">
              <div className="text-xs font-semibold text-slate-700">
                {isFr ? 'Modifier tarification & facturation' : 'Edit billing'}
              </div>
              <input
                type="number"
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                placeholder={isFr ? 'Montant devis (centimes)' : 'Quote (cents)'}
                value={fleetBillingDraft.quotedPriceCents}
                onChange={(e) => setFleetBillingDraft((f) => ({ ...f, quotedPriceCents: e.target.value }))}
              />
              <select
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                value={fleetBillingDraft.paymentStatus}
                onChange={(e) =>
                  setFleetBillingDraft((f) => ({
                    ...f,
                    paymentStatus: e.target.value as VehiclePaymentStatus,
                  }))
                }
              >
                {(['not_invoiced', 'pending_payment', 'paid', 'settled'] as VehiclePaymentStatus[]).map((ps) => (
                  <option key={ps} value={ps}>
                    {paymentStatusLabel(ps, isFr)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                placeholder={isFr ? 'N° facture' : 'Invoice #'}
                value={fleetBillingDraft.invoiceNumber}
                onChange={(e) => setFleetBillingDraft((f) => ({ ...f, invoiceNumber: e.target.value }))}
              />
              <textarea
                className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                rows={4}
                value={fleetBillingDraft.priceBreakdownJson}
                onChange={(e) => setFleetBillingDraft((f) => ({ ...f, priceBreakdownJson: e.target.value }))}
              />
              <div>
                <label className="text-xs text-slate-600">{isFr ? 'Facture (PDF/image)' : 'Invoice file'}</label>
                <input type="file" className="block text-xs mt-1" onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)} />
              </div>
              <button
                type="button"
                className="btn-3d-primary text-xs disabled:opacity-50"
                disabled={savingBilling}
                onClick={() => void submitFleetBillingPatch()}
              >
                {savingBilling ? '…' : isFr ? 'Enregistrer facturation' : 'Save billing'}
              </button>
            </div>
          ) : null}
        </Accordion>
        </div>

        <div id="section-timeline">
          <Accordion title={isFr ? 'Chronologie unifiée (statuts + audit)' : 'Unified timeline (status + audit)'}>
            {mergedTimeline.length === 0 ? (
              <p className="text-slate-500 text-sm">{isFr ? 'Aucun événement horodaté.' : 'No timestamped events.'}</p>
            ) : (
              <ul className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
                {mergedTimeline.map((row, i) => (
                  <li key={`${row.kind}-${row.at}-${i}`} className="relative">
                    <span className="absolute -left-[26px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                      <i className={`${row.icon} text-[11px]`} aria-hidden />
                    </span>
                    <div className="text-xs font-semibold text-slate-900">{row.title}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(row.at).toLocaleString(isFr ? 'fr-FR' : 'en-US')} · {row.sub}
                    </div>
                    {row.details && Object.keys(row.details).length > 0 ? (
                      <pre className="mt-1 max-h-28 overflow-y-auto rounded bg-slate-50 p-2 text-[10px] text-slate-700">
                        {JSON.stringify(row.details, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Accordion>
        </div>

        <div id="section-data">
          <Accordion title={isFr ? 'Tous les champs (base de données)' : 'All database fields'}>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {allRequestKeys.map((key) => renderDbFieldRow(key))}
            </div>
          </Accordion>
        </div>
      </div>
    </DetailPageShell>
  );
};

export default VehicleRequestDetailPage;
