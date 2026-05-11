/** Grille calendrier mois (lundi = premier jour de la semaine), aligné MAKE FIGMA Planification. */

export function toYMD(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Offset 0–6 : cases vides avant le 1er du mois (lundi = 0). */
export function mondayFirstOffset(year: number, monthIndex0: number): number {
  const d = new Date(year, monthIndex0, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function monthRangeYmd(anchor: Date): { from: string; to: string } {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: toYMD(from), to: toYMD(to) };
}
