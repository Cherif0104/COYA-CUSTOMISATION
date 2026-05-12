import React, { useMemo } from 'react';
import type { Role, User } from '../../../types';
import { APEX_SHELL_CARD } from '../apexConstants';

const PEDAGOGY_ROLES: Role[] = ['trainer', 'coach', 'facilitator', 'partner_facilitator', 'mentor'];

function roleLabel(role: Role, isFr: boolean): string {
  const map: Partial<Record<Role, { fr: string; en: string }>> = {
    trainer: { fr: 'Formateur', en: 'Trainer' },
    coach: { fr: 'Coach', en: 'Coach' },
    facilitator: { fr: 'Facilitateur', en: 'Facilitator' },
    partner_facilitator: { fr: 'Facilitateur partenaire', en: 'Partner facilitator' },
    mentor: { fr: 'Mentor', en: 'Mentor' },
  };
  const m = map[role];
  if (!m) return role;
  return isFr ? m.fr : m.en;
}

export type ApexPedagogySectionProps = {
  isFr: boolean;
  users: User[];
};

export const ApexPedagogySection: React.FC<ApexPedagogySectionProps> = ({ isFr, users }) => {
  const staff = useMemo(
    () => users.filter((u) => PEDAGOGY_ROLES.includes(u.role as Role)),
    [users],
  );

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Formateurs, mentors, facilitateurs' : 'Trainers, mentors, facilitators'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Profils : bio, compétences, spécialités, disponibilités, certifications. Permissions : contenus / examens / corrections (formateur), coaching & validation terrain (mentor), animation & présence (facilitateur). Matching IA : roadmap.'
            : 'Profiles: bio, skills, specialties, availability, certs. Role permissions + AI matching roadmap.'}
        </p>
      </div>

      {staff.length === 0 ? (
        <div className={`${APEX_SHELL_CARD} p-8 text-center text-sm text-slate-600`}>
          {isFr
            ? 'Aucun profil avec rôle formateur / coach / facilitateur / mentor dans les utilisateurs chargés. Branchez le référentiel RH pour enrichir l’annuaire.'
            : 'No users with trainer/coach/facilitator/mentor role in loaded users. Connect HR directory.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((u) => (
            <div key={String(u.id)} className={`${APEX_SHELL_CARD} p-4`}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-emerald-800 text-sm font-bold text-white">
                  {(u.fullName || u.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{u.fullName || u.name}</p>
                  <p className="text-[11px] text-slate-500">{roleLabel(u.role, isFr)}</p>
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                    {u.bio ||
                      (isFr
                        ? 'Bio à compléter — compétences & spécialités liées au catalogue APEX.'
                        : 'Add bio — skills linked to APEX catalog.')}
                  </p>
                  {u.skills?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {u.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`${APEX_SHELL_CARD} overflow-x-auto p-4`}>
        <table className="min-w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">{isFr ? 'Rôle' : 'Role'}</th>
              <th className="px-2 py-2">{isFr ? 'Contenus / examens' : 'Content / exams'}</th>
              <th className="px-2 py-2">{isFr ? 'Coaching / terrain' : 'Coaching / field'}</th>
              <th className="px-2 py-2">{isFr ? 'Sessions / présence' : 'Sessions / attendance'}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { r: 'trainer' as const, c: '✓', m: '—', s: '✓' },
              { r: 'mentor' as const, c: '—', m: '✓', s: '◐' },
              { r: 'facilitator' as const, c: '◐', m: '—', s: '✓' },
            ].map((row) => (
              <tr key={row.r} className="border-b border-slate-100">
                <td className="px-2 py-2 font-medium text-slate-800">{roleLabel(row.r, isFr)}</td>
                <td className="px-2 py-2">{row.c}</td>
                <td className="px-2 py-2">{row.m}</td>
                <td className="px-2 py-2">{row.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10px] text-slate-400">
          {isFr ? '◐ partiel / configurable par organisation (permissions).' : '◐ partial / org-configurable.'}
        </p>
      </div>
    </div>
  );
};
