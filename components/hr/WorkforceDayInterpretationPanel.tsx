import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Employee, EmployeeWorkSchedule, HrAttendancePolicy, HrWorkforceAnomaly, PresenceSession, User } from '../../types';
import { interpretWorkforceLocalDay } from '../../services/workforceDayInterpretation';
import { persistInterpretationAsPendingAnomalies } from '../../services/hrWorkforceAnomalySync';
import DataAdapter from '../../services/dataAdapter';
import { supabase } from '../../services/supabaseService';

type Props = {
  fr: boolean;
  organizationId: string | null;
  policy: HrAttendancePolicy | null;
  sessions: PresenceSession[];
  employees: Employee[];
  users: User[];
  userIdByProfile: Record<string, string>;
  canManage: boolean;
};

const decisionOptions: HrWorkforceAnomaly['managerDecision'][] = ['pending', 'authorized', 'unauthorized', 'verified'];

export const WorkforceDayInterpretationPanel: React.FC<Props> = ({
  fr,
  organizationId,
  policy,
  sessions,
  employees,
  users,
  userIdByProfile,
  canManage,
}) => {
  const [dateIso, setDateIso] = useState(() => new Date().toISOString().slice(0, 10));
  const [profileId, setProfileId] = useState('');
  const [anomalies, setAnomalies] = useState<HrWorkforceAnomaly[]>([]);
  const [busy, setBusy] = useState(false);
  const [schedules, setSchedules] = useState<EmployeeWorkSchedule[]>([]);

  const authUserId = profileId ? userIdByProfile[profileId] || profileId : '';

  const interpretation = useMemo(() => {
    if (!authUserId) return null;
    return interpretWorkforceLocalDay({
      dateIso,
      authUserId,
      sessions,
      policy,
      schedules,
    });
  }, [authUserId, dateIso, sessions, policy, schedules]);

  const loadAnomalies = useCallback(async () => {
    if (!organizationId || !profileId) {
      setAnomalies([]);
      return;
    }
    const rows = await DataAdapter.listHrWorkforceAnomalies({
      organizationId,
      profileId,
      fromDate: dateIso,
      toDate: dateIso,
    });
    setAnomalies(rows);
  }, [organizationId, profileId, dateIso]);

  useEffect(() => {
    void loadAnomalies();
  }, [loadAnomalies]);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!profileId) {
        setSchedules([]);
        return;
      }
      const rows = await DataAdapter.listEmployeeWorkSchedules({
        profileId,
        forDate: dateIso,
        activeOnly: false,
      });
      setSchedules(rows);
    };
    void loadSchedules();
  }, [profileId, dateIso]);

  const persistComputed = async () => {
    if (!organizationId || !profileId || !interpretation?.summaryCodes.length) return;
    setBusy(true);
    await persistInterpretationAsPendingAnomalies({
      organizationId,
      profileId,
      interpretation,
    });
    await loadAnomalies();
    setBusy(false);
  };

  const updateDecision = async (row: HrWorkforceAnomaly, managerDecision: HrWorkforceAnomaly['managerDecision']) => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id ?? null;
    const countsTowardAbsence =
      managerDecision === 'authorized' ? false : managerDecision === 'unauthorized' ? true : row.countsTowardAbsence;
    await DataAdapter.upsertHrWorkforceAnomaly({
      id: row.id,
      organizationId: row.organizationId,
      profileId: row.profileId,
      workDate: row.workDate,
      anomalyKind: row.anomalyKind,
      minutesValue: row.minutesValue,
      managerDecision,
      countsTowardAbsence,
      notes: row.notes ?? null,
      decidedByUserId: uid,
      decidedAt: new Date().toISOString(),
    });
    await loadAnomalies();
  };

  const labelForCode = (c: string) => {
    if (!fr) {
      const en: Record<string, string> = {
        late_connect: 'Late login',
        absence_morning: 'Absent (morning)',
        absence_afternoon: 'Absent (afternoon)',
        early_departure: 'Early leave',
      };
      return en[c] || c;
    }
    const map: Record<string, string> = {
      late_connect: 'Retard (connexion)',
      absence_morning: 'Absence matinée',
      absence_afternoon: 'Absence après-midi',
      early_departure: 'Départ anticipé',
    };
    return map[c] || c;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <h3 className="text-md font-semibold text-slate-900">
          {fr ? 'Interprétation journée (règles matin / après-midi)' : 'Day interpretation (morning / afternoon rules)'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          {fr
            ? 'Basé sur les sessions réelles et la politique (heures locales). Lun–Ven uniquement. Départ anticipé figé après la fin de journée attendue ou pour une date passée.'
            : 'Based on real sessions and policy (local hours). Mon–Fri only. Early leave finalized after expected end or for past dates.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">{fr ? 'Date' : 'Date'}</label>
          <input type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">{fr ? 'Salarié' : 'Employee'}</label>
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">{fr ? '— Choisir —' : '— Select —'}</option>
            {employees.map((emp) => {
              const linked = users.find((u) => String((u as any).profileId || '') === String(emp.profileId));
              const name = linked?.fullName || linked?.name || linked?.email || String(emp.profileId).slice(0, 8);
              return (
                <option key={emp.id} value={String(emp.profileId)}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
        {canManage && interpretation && interpretation.summaryCodes.length > 0 && (
          <button
            type="button"
            disabled={busy || !organizationId}
            onClick={() => void persistComputed()}
            className="rounded-lg bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-50"
          >
            {busy ? '…' : fr ? 'Enregistrer anomalies (pending)' : 'Save anomalies (pending)'}
          </button>
        )}
      </div>

      {interpretation && profileId && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 space-y-1">
          {!interpretation.isWorkingWeekday ? (
            <p>{fr ? 'Week-end / jour hors obligation.' : 'Weekend / non-working day.'}</p>
          ) : (
            <>
              <p>
                <span className="font-semibold">{fr ? 'Matin' : 'Morning'}:</span>{' '}
                {interpretation.morningStatus === 'ok' && (fr ? 'OK' : 'OK')}
                {interpretation.morningStatus === 'late' &&
                  (fr ? `Retard ${interpretation.delayMinutes} min` : `Late ${interpretation.delayMinutes} min`)}
                {interpretation.morningStatus === 'absent' && (fr ? 'Absent' : 'Absent')}
              </p>
              <p>
                <span className="font-semibold">{fr ? 'Après-midi' : 'Afternoon'}:</span>{' '}
                {interpretation.afternoonStatus === 'ok' ? (fr ? 'OK' : 'OK') : fr ? 'Absent' : 'Absent'}
              </p>
              <p>
                <span className="font-semibold">{fr ? 'Départ anticipé (figé si pertinent)' : 'Early leave (finalized if relevant)'}:</span>{' '}
                {interpretation.earlyDepartureMinutes} min
              </p>
              <p className="text-xs text-slate-600">
                {fr ? 'Codes' : 'Codes'}: {interpretation.summaryCodes.map(labelForCode).join(', ') || '—'}
              </p>
            </>
          )}
        </div>
      )}

      {canManage && anomalies.length > 0 && (
        <div className="overflow-x-auto border border-slate-100 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">{fr ? 'Type' : 'Type'}</th>
                <th className="px-3 py-2">{fr ? 'Minutes' : 'Minutes'}</th>
                <th className="px-3 py-2">{fr ? 'Décision manager' : 'Manager decision'}</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{labelForCode(a.anomalyKind)}</td>
                  <td className="px-3 py-2">{a.minutesValue}</td>
                  <td className="px-3 py-2">
                    <select
                      value={a.managerDecision}
                      onChange={(e) => void updateDecision(a, e.target.value as HrWorkforceAnomaly['managerDecision'])}
                      className="border border-slate-200 rounded px-2 py-1 text-sm"
                    >
                      {decisionOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
