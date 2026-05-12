import React, { useEffect, useState } from 'react';
import type { ApexTemporaryLearnerAccess, Course } from '../../../types';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import {
  inviteTemporaryLearnerAccess,
  listPendingTemporaryLearnerAccessInvites,
  revokeTemporaryLearnerAccess,
} from '../../../services/apexLearningService';

export type ApexLearnersSectionProps = {
  isFr: boolean;
  courses: Course[];
};

export const ApexLearnersSection: React.FC<ApexLearnersSectionProps> = ({ isFr, courses }) => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCourseId, setInviteCourseId] = useState(() => courses[0]?.id ?? '');
  const [inviteFrom, setInviteFrom] = useState('');
  const [inviteUntil, setInviteUntil] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteDoneLink, setInviteDoneLink] = useState<string | null>(null);

  const [invites, setInvites] = useState<ApexTemporaryLearnerAccess[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  useEffect(() => {
    setInvitesLoading(true);
    void listPendingTemporaryLearnerAccessInvites()
      .then(setInvites)
      .finally(() => setInvitesLoading(false));
  }, []);

  useEffect(() => {
    if (!inviteCourseId && courses[0]?.id) setInviteCourseId(courses[0].id);
  }, [courses, inviteCourseId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteCourseId || !inviteFrom || !inviteUntil) return;
    setInviteBusy(true);
    setInviteDoneLink(null);
    try {
      const row = await inviteTemporaryLearnerAccess({
        courseId: inviteCourseId,
        email: inviteEmail.trim(),
        validFrom: inviteFrom,
        validUntil: inviteUntil,
      });
      if (row.magicLink) {
        setInviteDoneLink(row.magicLink);
        setInvites((prev) => [row, ...prev]);
      }
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    const ok = await revokeTemporaryLearnerAccess(id);
    if (!ok) return;
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Entité apprenant interconnectée' : 'Interconnected learner entity'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Sources : CRM, collectes, formulaires, imports, programmes, projets. Chaque apprenant : accès temporel, expiration, permissions, historique. Suivi : temps actif, vidéos, engagement, présences, progression.'
            : 'Sources: CRM, collects, forms, imports, programs, projects. Per learner: time-bound access, expiry, permissions, history. Tracking: time on task, video, engagement, attendance, progress.'}
        </p>
        <div className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="font-medium text-slate-800">{isFr ? 'Tableau apprenant' : 'Learner board'}</p>
            <p className="mt-0.5">{isFr ? 'Progression, sessions, certificats, examens, mentor, calendrier.' : 'Progress, sessions, certs, exams, mentor, calendar.'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="font-medium text-slate-800">CRM / Collecte</p>
            <p className="mt-0.5">{isFr ? 'Ponts vers modules métier (permissions).' : 'Bridges to business modules.'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="font-medium text-slate-800">{isFr ? 'Temps réel' : 'Realtime'}</p>
            <p className="mt-0.5">{isFr ? 'Présence & événements session (roadmap).' : 'Session presence & events.'}</p>
          </div>
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} space-y-4 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">
            {isFr
              ? 'Invitations persistées (`apex_temporary_access`) — fenêtre de validité, lien magique, révocation.'
              : 'Invites in `apex_temporary_access` — validity window, magic link, revoke.'}
          </p>
          <Button type="button" variant="primary" onClick={() => setInviteOpen(true)}>
            {isFr ? 'Inviter un participant' : 'Invite participant'}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
          <p className="font-medium text-slate-800">{isFr ? 'Invitations actives' : 'Active invites'}</p>
          {invitesLoading ? (
            <p className="mt-1 text-slate-500">{isFr ? 'Chargement…' : 'Loading…'}</p>
          ) : invites.length === 0 ? (
            <p className="mt-1 text-slate-500">
              {isFr
                ? 'Aucune invitation temporaire pour votre organisation.'
                : 'No temporary invites for your organization.'}
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-left text-[11px] text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-1.5">Email</th>
                    <th className="px-2 py-1.5">{isFr ? 'Cours' : 'Course'}</th>
                    <th className="px-2 py-1.5">{isFr ? 'Valide jusqu’au' : 'Valid until'}</th>
                    <th className="px-2 py-1.5">{isFr ? 'Statut' : 'Status'}</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => {
                    const course = courses.find((c) => c.id === inv.courseId);
                    const ends = inv.validUntil ? new Date(inv.validUntil) : null;
                    const isExpired = ends ? ends < new Date() : false;
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-1.5">{inv.email}</td>
                        <td className="px-2 py-1.5">{course?.title || '—'}</td>
                        <td className="px-2 py-1.5">{ends ? ends.toLocaleString() : isFr ? 'Non défini' : 'Not set'}</td>
                        <td className="px-2 py-1.5">{isExpired ? (isFr ? 'Expiré' : 'Expired') : isFr ? 'Actif' : 'Active'}</td>
                        <td className="px-2 py-1.5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isExpired}
                            onClick={() => handleRevokeInvite(inv.id)}
                          >
                            {isFr ? 'Révoquer' : 'Revoke'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {inviteOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" role="dialog">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">{isFr ? 'Accès temporaire' : 'Temporary access'}</h3>
              <form className="mt-4 space-y-3" onSubmit={handleInviteSubmit}>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{isFr ? 'Cours' : 'Course'}</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={inviteCourseId}
                    onChange={(e) => setInviteCourseId(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">{isFr ? 'Début' : 'Start'}</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs"
                      value={inviteFrom}
                      onChange={(e) => setInviteFrom(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">{isFr ? 'Fin' : 'End'}</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs"
                      value={inviteUntil}
                      onChange={(e) => setInviteUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {inviteDoneLink && (
                  <p className="break-all text-xs text-emerald-700">
                    {isFr ? 'Lien magique généré :' : 'Magic link generated:'} <code>{inviteDoneLink}</code>
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                    {isFr ? 'Fermer' : 'Close'}
                  </Button>
                  <Button type="submit" variant="primary" disabled={inviteBusy}>
                    {inviteBusy ? '…' : isFr ? 'Enregistrer' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
