import { DataAdapter } from '../dataAdapter';
import { supabase } from '../supabaseService';

/** Préfixe des créneaux planning liés à une demande transport (voir Planning / DataService.deletePlanningSlotsByNotesPrefix). */
export function vehicleRequestPlanningNotesPrefix(requestId: string): string {
  return `COYA_VEHICLE_REQUEST:${requestId}`;
}

export async function deleteVehicleRequestPlanningSlots(requestId: string): Promise<void> {
  try {
    await DataAdapter.deletePlanningSlotsByNotesPrefix(vehicleRequestPlanningNotesPrefix(requestId));
  } catch {
    /* ignore */
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date locale YYYY-MM-DD */
function localYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Crée / remplace un créneau planning pour le demandeur (profil → auth user_id).
 * Une seule entrée sur la date de début ; si fin le même jour, heure de fin prise en compte.
 */
export async function syncVehicleRequestPlanningSlot(params: {
  requestId: string;
  requesterProfileId: string;
  startAtIso: string | null | undefined;
  endAtIso: string | null | undefined;
  title: string;
}): Promise<void> {
  const prefix = vehicleRequestPlanningNotesPrefix(params.requestId);
  await deleteVehicleRequestPlanningSlots(params.requestId);
  if (!params.startAtIso) return;

  const { data: prof, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', params.requesterProfileId)
    .maybeSingle();
  if (error || !prof?.user_id) return;

  const start = new Date(params.startAtIso);
  if (Number.isNaN(start.getTime())) return;

  const slotDate = localYmd(start);
  const startTime = localHm(start);

  let endTime = '23:59';
  if (params.endAtIso) {
    const end = new Date(params.endAtIso);
    if (!Number.isNaN(end.getTime()) && localYmd(end) === slotDate) {
      endTime = localHm(end);
    }
  }

  await DataAdapter.createPlanningSlot({
    userId: prof.user_id as string,
    slotDate,
    slotType: 'other',
    startTime,
    endTime,
    title: params.title.slice(0, 200),
    notes: prefix,
  });
}
