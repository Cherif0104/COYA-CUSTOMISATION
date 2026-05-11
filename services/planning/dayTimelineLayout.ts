/** Fenêtre horaire pour la vue timeline (grille verticale). */
export const DAY_START_MIN = 7 * 60;
export const DAY_END_MIN = 19 * 60;
export const DAY_RANGE_MIN = DAY_END_MIN - DAY_START_MIN;

export function timeToMinutes(t?: string | null): number | null {
  if (!t) return null;
  const p = String(t).slice(0, 5);
  const [h, m] = p.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Minutes depuis minuit → `HH:mm` (0–23h59). */
export function minutesToHHmm(total: number): string {
  const capped = Math.max(0, Math.min(total, 24 * 60 - 1));
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
