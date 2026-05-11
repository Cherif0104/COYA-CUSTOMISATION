import React, { useMemo } from 'react';
import logoSenegel from '../../assets/logo_senegel.png';

export interface LoadingOverlayProps {
  message?: string;
  /** Sous-texte (ex. étape de bootstrap, fichier chargé) */
  subMessage?: string;
  progress?: { current: number; total: number };
  variant?: 'minimal' | 'gradient';
  /** URL optionnelle du logo (ex. logo entreprise) */
  logoUrl?: string;
}

const INDICATORS: Array<{ label: string; icon: string }> = [
  { label: 'Sécurisé', icon: 'fa-shield-halved' },
  { label: 'Transparent', icon: 'fa-eye' },
  { label: 'Compétent', icon: 'fa-graduation-cap' },
  { label: 'Performant', icon: 'fa-bolt' },
  { label: 'Connecté', icon: 'fa-link' },
];
const SLOGAN = 'Citoyenneté. Transparence. Compétences.';

/**
 * Overlay de chargement : fluide, raffiné, marque COYA.
 * Logo / nom, slogans (Situationalité, Transparence, Compétence), illustrations légères.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  subMessage,
  progress,
  variant = 'minimal',
  logoUrl,
}) => {
  const progressPercent = useMemo(() => {
    if (!progress || progress.total <= 0) return null;
    return Math.min(100, Math.round((progress.current / progress.total) * 100));
  }, [progress]);

  const isGradient = variant === 'gradient';
  const bgStyle = isGradient
    ? {
        background:
          'radial-gradient(1200px 800px at 20% 20%, rgba(13,122,43,0.20), transparent 55%), radial-gradient(1000px 700px at 80% 60%, rgba(25,156,69,0.14), transparent 55%), linear-gradient(180deg, #071018 0%, #0F172A 55%, #071018 100%)',
      }
    : { backgroundColor: 'var(--coya-bg)' };

  const textMain = isGradient ? 'text-white' : 'text-gray-900';
  const textMuted = isGradient ? 'text-white/70' : 'text-gray-500';
  const progressTrackClass = isGradient ? 'bg-white/15' : 'bg-gray-100';
  /* Charte institutionnelle : barre verte (#0D7A2B) sur fond sombre */
  const progressFillClass = isGradient ? 'bg-coya-institutional shadow-[0_0_24px_rgba(13,122,43,0.45)]' : 'bg-coya-green';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 font-coya overflow-hidden animate-loading-overlay-in"
      style={bgStyle}
      role="status"
      aria-live="polite"
      aria-label={message || 'Chargement'}
    >
      {/* Halo et texture digitale (sans assets) */}
      {isGradient ? (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl animate-loading-shape" style={{ background: 'rgba(13,122,43,0.22)' }} />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full blur-3xl animate-loading-shape" style={{ background: 'rgba(244,196,48,0.12)', animationDelay: '-3s' }} />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-7 max-w-md w-full">
        {/* Logo : image ou marque COYA */}
        <div className="animate-loading-logo-pulse flex flex-col items-center gap-3">
          <div
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md flex items-center justify-center"
            style={isGradient ? { boxShadow: '0 18px 60px rgba(13,122,43,0.22)' } : undefined}
          >
            <img src={logoUrl || logoSenegel} alt="SENEGEL" className="h-11 w-11 sm:h-14 sm:w-14 object-contain" />
          </div>
          <div className="text-center space-y-1">
            <p className={`text-lg sm:text-xl font-semibold tracking-tight ${textMain}`}>SENEGEL</p>
            <p className={`text-xs sm:text-sm font-medium ${textMuted}`}>{SLOGAN}</p>
          </div>
        </div>

        {/* Progress bar : indéterminée si pas de `progress` */}
        <div className="w-full max-w-xs space-y-2">
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${progressTrackClass}`}>
            {progressPercent !== null ? (
              <div className={`h-full rounded-full transition-all duration-300 ease-out ${progressFillClass}`} style={{ width: `${progressPercent}%` }} />
            ) : (
              <div
                className={`h-full w-1/2 rounded-full ${isGradient ? 'bg-coya-institutional opacity-90' : ''}`}
                style={{
                  ...(isGradient
                    ? {}
                    : { background: 'var(--coya-green)', animation: 'loading-shimmer 1.2s ease-in-out infinite' }),
                  ...(isGradient ? { animation: 'loading-shimmer 1.2s ease-in-out infinite' } : {}),
                }}
              />
            )}
          </div>
          <p className={`text-xs text-center font-medium ${textMuted}`}>{message || 'Chargement en cours…'}</p>
          {subMessage ? (
            <p className={`text-[11px] text-center ${textMuted}`}>{subMessage}</p>
          ) : (
            <p className={`text-[11px] text-center ${textMuted}`}>Veuillez patienter</p>
          )}
        </div>

        {/* Indicateurs bas */}
        {isGradient ? (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {INDICATORS.map(({ label, icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-white/55 tracking-wide">
                <i className={`fas ${icon} text-[10px] opacity-70`} aria-hidden />
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LoadingOverlay;
