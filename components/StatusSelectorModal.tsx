import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePresence } from '../contexts/PresenceContext';
import { PresenceSession, PresenceStatus } from '../types';
import DataService from '../services/dataService';
import { STATUS_OPTIONS, setSkipStatusSelector } from './StatusSelector';
import { emitPresenceActivityEvents } from '../services/workforce/presenceActivityBridge';
import StatusHelpDemo from './StatusHelpDemo';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import logoSenegel from '../assets/logo_senegel.png';

interface StatusSelectorModalProps {
  onConfirm: () => void;
}

const StatusSelectorModal: React.FC<StatusSelectorModalProps> = ({ onConfirm }) => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const { currentSession, setCurrentSession } = usePresence();
  const [selected, setSelected] = useState<PresenceStatus>('absent');
  const [skipNextTime, setSkipNextTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const defaultAbsentAppliedRef = useRef(false);

  useEffect(() => {
    const applyDefaultAbsent = async () => {
      if (!user?.id || currentSession || defaultAbsentAppliedRef.current) return;
      defaultAbsentAppliedRef.current = true;
      try {
        const { data: existing } = await DataService.getCurrentPresenceSession(String(user.id));
        if (existing) return;
        await DataService.createPresenceSession({
          status: 'absent',
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          notes: 'auto-absent-at-login',
        });
      } catch {
        /* silent */
      }
    };
    applyDefaultAbsent();
  }, [user?.id, currentSession]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const prevSession = currentSession;
    const uid = user?.id ? String(user.id) : '';
    const emit = (next: PresenceSession) => {
      if (!uid) return;
      emitPresenceActivityEvents({
        actorUserId: uid,
        prevSession,
        nextSession: next,
        newStatus: selected,
        meetingOnlyUpdate: false,
      });
    };
    try {
      const { data, error: err } = await DataService.createPresenceSession({
        status: selected,
        startedAt: new Date().toISOString(),
      });
      if (data) {
        setCurrentSession(data);
        emit(data);
        setSkipStatusSelector(skipNextTime);
        onConfirm();
        setLoading(false);
        return;
      }
      if (err && user?.id) {
        const local: PresenceSession = {
          id: 'local-' + Date.now(),
          userId: String(user.id),
          organizationId: 'local',
          status: selected,
          startedAt: new Date().toISOString(),
          pauseMinutes: 0,
        };
        setCurrentSession(local);
        emit(local);
        setSkipStatusSelector(skipNextTime);
        onConfirm();
      } else {
        setError(err instanceof Error ? err.message : 'Error');
      }
    } catch (e) {
      if (user?.id) {
        const local: PresenceSession = {
          id: 'local-' + Date.now(),
          userId: String(user.id),
          organizationId: 'local',
          status: selected,
          startedAt: new Date().toISOString(),
          pauseMinutes: 0,
        };
        setCurrentSession(local);
        emit(local);
        setSkipStatusSelector(skipNextTime);
        onConfirm();
      } else {
        setError(e instanceof Error ? e.message : 'Erreur inattendue');
      }
    }
    setLoading(false);
  };

  const modal = (
    <>
      <div className="fixed inset-0 z-[110] font-coya overflow-y-auto bg-[#071018]">
        {/* Aligné Login.tsx — fond institutionnel cinématique */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 800px at 20% 20%, rgba(13,122,43,0.25), transparent 60%), radial-gradient(900px 700px at 80% 60%, rgba(25,156,69,0.18), transparent 60%), linear-gradient(180deg, #071018 0%, #0F172A 55%, #071018 100%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.50) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        <div className="relative flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div
              className="absolute -top-28 -left-24 h-96 w-96 rounded-full blur-3xl animate-loading-shape opacity-90"
              style={{ background: 'rgba(13,122,43,0.22)' }}
            />
            <div
              className="absolute -bottom-36 right-0 h-[28rem] w-[28rem] rounded-full blur-3xl animate-loading-shape opacity-90"
              style={{ background: 'rgba(244,196,48,0.12)', animationDelay: '-2.5s' }}
            />
          </div>

          <div className="relative z-10 w-full max-w-[480px]">
            <Card className="border-white/10 bg-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.30)] backdrop-blur-xl">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <img src={logoSenegel} alt="SENEGEL" className="h-8 w-8 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {t('status_selector_title')}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">{t('status_selector_modal_message')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelected(opt.value)}
                      className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all duration-200 sm:min-h-[4.75rem] ${
                        selected === opt.value
                          ? 'border-[var(--coya-institutional)] bg-[rgba(13,122,43,0.28)] text-white shadow-[0_0_0_1px_rgba(13,122,43,0.5)]'
                          : 'border-white/12 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      <i className={`${opt.icon} shrink-0 text-lg`} aria-hidden />
                      <span className="text-[10px] font-medium leading-tight text-white/95 sm:text-[11px]">
                        {t(opt.labelKey as any) || opt.labelFallback}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/10 sm:w-auto sm:px-4"
                >
                  <i className="fas fa-question-circle" aria-hidden />
                  {t('status_selector_help')}
                </button>

                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/15 px-4 py-3 text-sm text-red-50">{error}</div>
                )}

                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={skipNextTime}
                    onChange={(e) => setSkipNextTime(e.target.checked)}
                    className="rounded border-white/30 bg-white/10 text-[var(--coya-institutional)] focus:ring-[var(--coya-institutional)] focus:ring-offset-0"
                  />
                  {t('status_selector_skip_next')}
                </label>

                <Button type="button" className="w-full !h-auto py-3" size="lg" disabled={loading} onClick={handleConfirm}>
                  {loading ? t('loading') : t('status_selector_confirm')}
                </Button>
              </CardContent>
            </Card>

            <p className="mt-4 text-center text-xs text-white/45">COYA ERP • SENEGEL</p>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[111] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)} aria-hidden />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-coya-border bg-coya-card shadow-coya">
            <StatusHelpDemo onClose={() => setShowHelp(false)} />
          </div>
        </div>
      )}
    </>
  );

  if (typeof document === 'undefined') return modal;

  return createPortal(modal, document.body);
};

export default StatusSelectorModal;
