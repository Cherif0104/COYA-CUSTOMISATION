/**
 * URL utilisée par Supabase après clic sur le lien « réinitialiser le mot de passe » (recovery).
 *
 * À ajouter tel quel dans Supabase Dashboard → Authentication → URL Configuration → Redirect URLs,
 * par ex. `https://votredomaine.com/` et la variante sans slash finale si vous l’utilisez aussi.
 *
 * Priorité :
 * - `VITE_AUTH_REDIRECT_URL` ou `VITE_SITE_URL` (URL canonique du déploiement)
 * - sinon `window.location.origin` + `/` (évite un pathname fragile qui peut 404 hors SPA)
 */
export function getPasswordRecoveryRedirectUrl(): string {
  const raw =
    typeof import.meta !== 'undefined'
      ? String(import.meta.env.VITE_AUTH_REDIRECT_URL || import.meta.env.VITE_SITE_URL || '').trim()
      : '';
  const base = raw.replace(/\/+$/, '');
  if (base) {
    return `${base}/`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return '/';
}
