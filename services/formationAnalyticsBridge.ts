/**
 * Point d’extension analytics ONG / LMS : agrégats cohortes, complétions, impact programmes.
 * Brancher ici des requêtes Supabase ou un read model quand les métriques sont définies.
 */
export function formationNgoAnalyticsTrainingSubtitle(isFr: boolean): string {
  return isFr
    ? 'ONG : agrégats cohortes / impact — branchement prévu.'
    : 'NGO: cohort / impact aggregates — wiring planned.';
}
