import React, { useEffect, useState } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Language } from '../../types';
import { Button } from '../ui/Button';
import { NAV_SESSION_APEX_SECTION } from '../../contexts/AppNavigationContext';
import { validateTemporaryLearnerAccessToken } from '../../services/apexLearningService';

interface ApexAccessLandingProps {
  setView: (view: string) => void;
}

type AccessStatus = 'loading' | 'ok' | 'error' | 'expired' | 'revoked' | 'missing';

const cardBase =
  'mx-auto mt-10 max-w-lg rounded-2xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]';

const ApexAccessLanding: React.FC<ApexAccessLandingProps> = ({ setView }) => {
  const { language } = useLocalization();
  const isFr = language === Language.FR;

  const [status, setStatus] = useState<AccessStatus>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    const token = params.get('token') || '';

    if (!token) {
      setStatus('error');
      setMessage(
        isFr ? 'Lien d’accès manquant ou invalide.' : 'Missing or invalid access link.',
      );
      return;
    }

    void (async () => {
      setStatus('loading');
      try {
        const res = await validateTemporaryLearnerAccessToken(token);
        if (!res.valid) {
          switch (res.reason) {
            case 'EXPIRED':
              setStatus('expired');
              setMessage(
                isFr
                  ? "Ce lien d'accès APEX a expiré. Demandez une nouvelle invitation à l'organisation."
                  : 'This APEX access link has expired. Please request a new invite from the organization.',
              );
              return;
            case 'REVOKED':
              setStatus('revoked');
              setMessage(
                isFr
                  ? "Ce lien d'accès a été révoqué par l'organisation."
                  : 'This access link has been revoked by the organization.',
              );
              return;
            case 'TABLE_MISSING':
              setStatus('missing');
              setMessage(
                isFr
                  ? "L'instance Supabase ne contient pas encore la table `apex_temporary_access`. Appliquez la migration APEX avant d'utiliser ces liens."
                  : 'The Supabase instance does not yet contain the `apex_temporary_access` table. Apply the APEX migration before using these links.',
              );
              return;
            default:
              setStatus('error');
              setMessage(
                isFr
                  ? "Invitation introuvable ou non valide pour cette organisation."
                  : 'Invite not found or not valid for this organization.',
              );
              return;
          }
        }

        setStatus('ok');
        setMessage(
          isFr
            ? "Invitation APEX valide. Vous pouvez ouvrir le module e-learning ; les contrôles avancés d'appareil et d'anti‑piratage restent hors périmètre de ce MVP."
            : 'Valid APEX invite. You can open the e‑learning module; advanced device and anti‑piracy controls are out of scope for this MVP.',
        );
      } catch (error) {
        console.error('Erreur validation lien APEX:', error);
        setStatus('error');
        setMessage(
          isFr
            ? "Une erreur est survenue lors de la validation du lien d'accès."
            : 'An error occurred while validating the access link.',
        );
      }
    })();
  }, [isFr]);

  const goToApex = () => {
    try {
      sessionStorage.setItem(NAV_SESSION_APEX_SECTION, 'catalog');
    } catch {
      /* ignore */
    }
    setView('apex');
  };

  const goToDashboard = () => {
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" data-testid="apex-access-landing">
      <div className={cardBase}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          APEX
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">
          {isFr ? 'Accès temporaire à la plateforme' : 'Temporary access to the platform'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isFr
            ? "Ce lien donne accès à un espace e‑learning pour une période limitée. L'authentification Supabase habituelle reste nécessaire pour les fonctionnalités avancées."
            : 'This link grants access to an e‑learning space for a limited period. Regular Supabase authentication is still required for advanced features.'}
        </p>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {status === 'loading' ? (isFr ? 'Vérification du lien…' : 'Validating link…') : message}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            disabled={status !== 'ok'}
            onClick={goToApex}
          >
            {isFr ? 'Ouvrir APEX' : 'Open APEX'}
          </Button>
          <Button type="button" variant="ghost" onClick={goToDashboard}>
            {isFr ? 'Retour au tableau de bord' : 'Back to dashboard'}
          </Button>
        </div>

        <p className="mt-4 text-[10px] text-slate-500">
          {isFr
            ? "Fonctionnalités hors périmètre : pipeline HLS, contrôle multi‑appareils, anti‑piratage avancé et compagnon IA pédagogique."
            : 'Out of scope: HLS pipeline, multi‑device control, advanced anti‑piracy and AI tutoring companion.'}
        </p>
      </div>
    </div>
  );
};

export default ApexAccessLanding;

