import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePresence } from '../contexts/PresenceContext';
import { Meeting, PresenceStatus } from '../types';
import DataAdapter from '../services/dataAdapter';
import { STATUS_OPTIONS } from './StatusSelector';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

const MENU_WIDTH_PX = 288;

const PresenceCountdownWidget: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const { currentSession, setStatus } = usePresence();
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const status = currentSession?.status ?? 'absent';
  const startedAt = currentSession?.startedAt;
  const isCounting = status !== 'absent';

  useEffect(() => {
    if (!isCounting || !startedAt) {
      setElapsedSeconds(0);
      return;
    }
    const update = () => {
      const start = new Date(startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isCounting, startedAt]);

  useEffect(() => {
    if (!user?.id || (!showPicker && status !== 'in_meeting')) return;
    let cancelled = false;
    DataAdapter.getMeetings()
      .then(list => {
        if (!cancelled) setMeetings(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setMeetings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, showPicker, status]);

  const upcomingMeetings = useMemo(
    () => meetings.filter(m => new Date(m.endTime) >= new Date()),
    [meetings],
  );

  const updateMenuPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, r.right - MENU_WIDTH_PX),
      window.innerWidth - MENU_WIDTH_PX - 8,
    );
    setMenuPos({ top: r.bottom + 6, left });
  };

  useLayoutEffect(() => {
    if (!showPicker) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showPicker]);

  useEffect(() => {
    if (!showPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPicker]);

  const currentOption = useMemo(() => STATUS_OPTIONS.find(o => o.value === status), [status]);

  const changeStatus = async (newStatus: PresenceStatus, opts?: { meetingId?: string | null }) => {
    if (loading) return;
    setLoading(true);
    try {
      await setStatus(newStatus, opts);
      setShowPicker(false);
    } catch (e) {
      console.error('changeStatus error:', e);
    }
    setLoading(false);
  };

  const applyMeetingLink = async (meetingId: string | null) => {
    if (loading || status !== 'in_meeting') return;
    setLoading(true);
    try {
      await setStatus('in_meeting', { meetingId });
    } catch (e) {
      console.error('applyMeetingLink error:', e);
    }
    setLoading(false);
  };

  if (!user) return null;

  const pickerPortal =
    showPicker &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[105] bg-black/25 backdrop-blur-[3px]"
          onClick={() => setShowPicker(false)}
          aria-hidden
        />
        {menuPos && (
          <div
            role="menu"
            className="fixed z-[106] w-72 max-w-[calc(100vw-16px)] rounded-xl bg-coya-card py-1 shadow-xl border border-coya-border/80 overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => changeStatus(opt.value)}
                disabled={loading}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${opt.value === status ? 'bg-coya-primary/10 text-coya-primary font-medium' : 'text-coya-text hover:bg-coya-bg'}`}
              >
                <i className={`${opt.icon} w-4 text-xs`} />
                <span>{t(opt.labelKey as any) || opt.labelFallback}</span>
              </button>
            ))}
            {status === 'in_meeting' && currentSession && (
              <div className="border-t border-coya-border/70 px-3 py-2.5 space-y-1.5">
                <label className="block text-[11px] font-medium text-coya-text-muted uppercase tracking-wide">
                  {t('presence_calendar_meeting' as any)}
                </label>
                <select
                  className="w-full text-sm border border-coya-border rounded-lg px-2 py-2 bg-coya-bg text-coya-text"
                  value={currentSession.meetingId ?? ''}
                  onChange={e => applyMeetingLink(e.target.value || null)}
                  disabled={loading}
                >
                  <option value="">{t('presence_no_meeting_unpaid' as any)}</option>
                  {upcomingMeetings.map(m => (
                    <option key={String(m.id)} value={String(m.id)}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-coya-text-muted leading-snug">
                  {t('presence_in_meeting_unpaid_hint' as any)}
                </p>
              </div>
            )}
            {currentSession && status !== 'absent' && (
              <div className="border-t border-coya-border/70 px-2 py-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={loading}
                  onClick={() => changeStatus('absent')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {t('presence_end_session' as any)}
                </button>
              </div>
            )}
          </div>
        )}
      </>,
      document.body,
    );

  return (
    <div className="relative flex items-center gap-2">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 rounded-full bg-coya-bg/80 px-3 py-2 text-coya-text hover:bg-coya-primary/5 border border-coya-border/80 hover:border-coya-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-coya-primary/20 focus:ring-offset-1"
        title={!isCounting ? t('status_not_counted') : currentOption ? t(currentOption.labelKey as any) : undefined}
        aria-expanded={showPicker}
        aria-haspopup="menu"
      >
        {currentOption && <i className={`${currentOption.icon} text-xs text-[rgba(255,255,255,1)]`} />}
        <span className="font-mono tabular-nums text-white">{formatElapsed(elapsedSeconds)}</span>
        <i className="fas fa-chevron-down text-coya-text-muted text-[10px]" />
      </button>
      {pickerPortal}
    </div>
  );
};

export default PresenceCountdownWidget;
