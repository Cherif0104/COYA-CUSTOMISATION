import React, { useCallback, useEffect, useState } from 'react';
import {
  HR_DOCUMENT_REQUEST_TYPES,
  createHrDocumentRequest,
  listHrDocumentRequests,
  updateHrDocumentRequestStatus,
  type HrDocumentRequestRow,
  type HrDocumentRequestType,
  type HrDocumentRequestStatus,
} from '../../services/hrDocumentRequestService';

const TYPE_LABELS_FR: Record<HrDocumentRequestType, string> = {
  payslip: 'Bulletin de paie',
  salary_certificate: 'Attestation de salaire',
  work_certificate: 'Certificat de travail',
  contract: 'Copie de contrat',
  mission_order: 'Ordre de mission',
  leave_certificate: 'Attestation de congé',
};

const STATUS_LABELS_FR: Record<HrDocumentRequestStatus, string> = {
  submitted: 'Soumise',
  in_progress: 'En traitement',
  ready: 'Prête',
  rejected: 'Refusée',
  cancelled: 'Annulée',
};

export type HrDocumentRequestsPanelProps = {
  organizationId: string;
  profileId: string;
  fr: boolean;
  /** Salarié connecté = profil affiché : formulaire de création visible */
  allowEmployeeCreate: boolean;
  /** RH / manager : mise à jour du statut */
  allowManagerUpdate: boolean;
};

const HrDocumentRequestsPanel: React.FC<HrDocumentRequestsPanelProps> = ({
  organizationId,
  profileId,
  fr,
  allowEmployeeCreate,
  allowManagerUpdate,
}) => {
  const [rows, setRows] = useState<HrDocumentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<HrDocumentRequestType>('salary_certificate');
  const [formComment, setFormComment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listHrDocumentRequests({ organizationId, profileId });
      setRows(list);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [organizationId, profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void load();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVis);
    const intervalId = window.setInterval(tick, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(intervalId);
    };
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createHrDocumentRequest({
        organizationId,
        profileId,
        requestType: formType,
        payload: formComment.trim() ? { comment: formComment.trim() } : {},
      });
      setFormComment('');
      await load();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const onStatus = async (id: string, status: HrDocumentRequestStatus) => {
    setSaving(true);
    try {
      await updateHrDocumentRequestStatus(id, status);
      await load();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {allowEmployeeCreate && (
        <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            {fr ? 'Nouvelle demande' : 'New request'}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              {fr ? 'Type de document' : 'Document type'}
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as HrDocumentRequestType)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              >
                {HR_DOCUMENT_REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {fr ? TYPE_LABELS_FR[t] : t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
              {fr ? 'Précisions (optionnel)' : 'Details (optional)'}
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? '…' : fr ? 'Envoyer la demande' : 'Submit request'}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{fr ? 'Demandes enregistrées' : 'Recorded requests'}</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">{fr ? 'Chargement…' : 'Loading…'}</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">{fr ? 'Aucune demande.' : 'No requests.'}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{fr ? TYPE_LABELS_FR[r.requestType] : r.requestType}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString(fr ? 'fr-FR' : 'en-GB')} · {STATUS_LABELS_FR[r.status]}
                  </p>
                  {r.notes && <p className="mt-1 text-xs text-slate-600">{r.notes}</p>}
                </div>
                {allowManagerUpdate && r.status === 'submitted' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatus(r.id, 'in_progress')}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      {fr ? 'Prendre en charge' : 'In progress'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatus(r.id, 'ready')}
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      {fr ? 'Marquer prête' : 'Mark ready'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatus(r.id, 'rejected')}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                    >
                      {fr ? 'Refuser' : 'Reject'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HrDocumentRequestsPanel;
