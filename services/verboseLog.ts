/**
 * Logs détaillés (HTTP, DataAdapter, debug App) : désactivés par défaut.
 * Ajoutez dans `.env.local` : `VITE_VERBOSE_LOGS=1` pour les réactiver en dev.
 */
export function verboseLogs(): boolean {
  return import.meta.env.DEV === true && import.meta.env.VITE_VERBOSE_LOGS === '1';
}
