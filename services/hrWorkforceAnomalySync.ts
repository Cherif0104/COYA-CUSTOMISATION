import type { WorkforceLocalDayInterpretation } from './workforceDayInterpretation';
import { DataService } from './dataService';

/** Enregistre les anomalies détectées pour revue manager (statut `pending`). */
export async function persistInterpretationAsPendingAnomalies(params: {
  organizationId: string;
  profileId: string;
  interpretation: WorkforceLocalDayInterpretation;
}): Promise<number> {
  const { interpretation } = params;
  if (!interpretation.summaryCodes.length) return 0;

  const morningAbsentMin = Math.max(
    0,
    interpretation.morningEndMinutes - interpretation.expectedWorkStartMinutes,
  );
  const afternoonAbsentMin = Math.max(
    0,
    interpretation.expectedWorkEndMinutes - interpretation.afternoonDeadlineMinutes,
  );

  let n = 0;
  for (const code of interpretation.summaryCodes) {
    let minutes = 0;
    if (code === 'late_connect') minutes = interpretation.delayMinutes;
    else if (code === 'absence_morning') minutes = morningAbsentMin;
    else if (code === 'absence_afternoon') minutes = afternoonAbsentMin;
    else if (code === 'early_departure') minutes = interpretation.earlyDepartureMinutes;

    const { data } = await DataService.upsertHrWorkforceAnomaly({
      organizationId: params.organizationId,
      profileId: params.profileId,
      workDate: interpretation.dateIso,
      anomalyKind: code,
      minutesValue: minutes,
      managerDecision: 'pending',
      countsTowardAbsence: true,
    });
    if (data) n += 1;
  }
  return n;
}
