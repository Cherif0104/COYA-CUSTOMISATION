import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationService from '../services/organizationService';
import { listWorkDaySummaries, listWorkProofs, addWorkProof, type WorkDaySummary, type WorkProof } from '../services/workJournalService';

type Props = {
  profileId?: string; // filtre optionnel
};

function minutesToHHMM(total: number): string {
  const m = Math.max(0, Math.floor(total || 0));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const WorkJournalTab: React.FC<Props> = ({ profileId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<WorkDaySummary[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [proofs, setProofs] = useState<WorkProof[]>([]);
  const [proofUrl, setProofUrl] = useState('');
  const [proofCaption, setProofCaption] = useState('');
  const [proofSaving, setProofSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = await OrganizationService.getCurrentUserOrganizationId();
      if (!orgId) {
        setRows([]);
        return;
      }
      const data = await listWorkDaySummaries({ organizationId: orgId, profileId, from, to });
      setRows(data);
    } catch (e: any) {
      setError(e?.message || String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [from, profileId, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openProofs = useCallback(async (workDate: string) => {
    setSelectedDate(workDate);
    try {
      const orgId = await OrganizationService.getCurrentUserOrganizationId();
      if (!orgId) return;
      const p = await listWorkProofs({ organizationId: orgId, profileId, workDate });
      setProofs(p);
    } catch (e) {
      setProofs([]);
    }
  }, [profileId]);

  const total = useMemo(() => {
    const sum = rows.reduce(
      (acc, r) => {
        acc.project += r.minutesProjectWork || 0;
        acc.plan += r.minutesPlanning || 0;
        acc.att += r.minutesAttendanceSpan || 0;
        return acc;
      },
      { project: 0, plan: 0, att: 0 }
    );
    return sum;
  }, [rows]);

  const submitProof = useCallback(async () => {
    if (!selectedDate) return;
    const url = proofUrl.trim();
    if (!url) return;
    setProofSaving(true);
    try {
      const orgId = await OrganizationService.getCurrentUserOrganizationId();
      if (!orgId || !profileId) return;
      await addWorkProof({
        organizationId: orgId,
        profileId,
        workDate: selectedDate,
        proofType: 'external_url',
        externalUrl: url,
        caption: proofCaption.trim() || undefined,
      });
      setProofUrl('');
      setProofCaption('');
      await openProofs(selectedDate);
    } finally {
      setProofSaving(false);
    }
  }, [openProofs, profileId, proofCaption, proofUrl, selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Du</label>
          <input className="border rounded px-2 py-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Au</label>
          <input className="border rounded px-2 py-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded bg-emerald-700 text-white" onClick={reload} disabled={loading}>
          {loading ? 'Chargement…' : 'Recharger'}
        </button>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
      </div>

      <div className="text-sm text-gray-700">
        Totaux période — Projet: <b>{minutesToHHMM(total.project)}</b> · Planification: <b>{minutesToHHMM(total.plan)}</b> · Présence (span): <b>{minutesToHHMM(total.att)}</b>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Statut</th>
              <th className="text-right px-3 py-2">Temps projet</th>
              <th className="text-right px-3 py-2">Planification</th>
              <th className="text-right px-3 py-2">Présence</th>
              <th className="text-center px-3 py-2">Journée OK</th>
              <th className="text-right px-3 py-2">Preuves</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.workDate}</td>
                <td className="px-3 py-2">{r.presenceStatus}</td>
                <td className="px-3 py-2 text-right">{minutesToHHMM(r.minutesProjectWork)}</td>
                <td className="px-3 py-2 text-right">{minutesToHHMM(r.minutesPlanning)}</td>
                <td className="px-3 py-2 text-right">{minutesToHHMM(r.minutesAttendanceSpan)}</td>
                <td className="px-3 py-2 text-center">{r.journeyCompleted ? 'Oui' : '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button className="underline" onClick={() => openProofs(r.workDate)}>
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  Aucune donnée sur la période.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedDate ? (
        <div className="border rounded p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Preuves — {selectedDate}</div>
            <button className="text-sm underline" onClick={() => setSelectedDate(null)}>
              Fermer
            </button>
          </div>

          <div className="space-y-2">
            {proofs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="truncate">
                  {p.caption ? <span className="font-medium">{p.caption}</span> : <span className="font-medium">Preuve</span>}
                  {p.externalUrl ? (
                    <span className="ml-2 text-gray-600 truncate">{p.externalUrl}</span>
                  ) : (
                    <span className="ml-2 text-gray-600 truncate">{p.storageObjectPath}</span>
                  )}
                </div>
                {p.externalUrl ? (
                  <a className="underline" href={p.externalUrl} target="_blank" rel="noreferrer">
                    Ouvrir
                  </a>
                ) : null}
              </div>
            ))}
            {!proofs.length ? <div className="text-sm text-gray-500">Aucune preuve.</div> : null}
          </div>

          {profileId ? (
            <div className="pt-2 border-t space-y-2">
              <div className="text-sm font-medium">Ajouter une preuve (URL)</div>
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="https://drive.google.com/…"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <input
                className="w-full border rounded px-2 py-1"
                placeholder="Description (optionnel)"
                value={proofCaption}
                onChange={(e) => setProofCaption(e.target.value)}
              />
              <button className="px-3 py-2 rounded bg-emerald-700 text-white" onClick={submitProof} disabled={proofSaving || !proofUrl.trim()}>
                {proofSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Sélectionne un salarié pour ajouter des preuves.</div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default WorkJournalTab;

