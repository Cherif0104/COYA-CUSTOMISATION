import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar } from 'lucide-react';
import type { Meeting, PlanningSlot } from '../../types';
import { mondayFirstOffset, daysInMonth, toYMD } from '../../services/planning/calendarLayout';
import {
  SLOT_TYPE_BAR_CLASS,
  SLOT_TYPE_BORDER_L_CLASS,
  SLOT_TYPE_ICONS,
  SLOT_TYPE_LABELS_EN,
  SLOT_TYPE_LABELS_FR,
  isPlanningSlotAutoInjectedNotes,
} from '../../services/planning/planningConstants';
import { DAY_RANGE_MIN, DAY_START_MIN, timeToMinutes } from '../../services/planning/dayTimelineLayout';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type PlanningItineraryViewMode = 'calendar' | 'week' | 'gantt';

export type PlanningItineraryFigmaViewProps = {
  isFr: boolean;
  locale: string;
  viewMode: PlanningItineraryViewMode;
  onViewModeChange: (m: PlanningItineraryViewMode) => void;
  loading: boolean;
  calendarMonth: Date;
  onCalendarPrev: () => void;
  onCalendarNext: () => void;
  selectedYmd: string | null;
  onSelectYmd: (ymd: string) => void;
  slotsByDay: Record<string, PlanningSlot[]>;
  weekLabel: string;
  weekDays: string[];
  prevWeek: () => void;
  nextWeek: () => void;
  goToday: () => void;
  timelineUserIds: string[];
  timelineLabels: Record<string, string>;
  slots: PlanningSlot[];
  userId?: string | number;
  isOrgScopePlanner: boolean;
  onPrint: () => void;
  onNewSlot: () => void;
  onEditSlot: (s: PlanningSlot) => void;
  onDeleteSlot: (id: string) => void;
  meetings: Meeting[];
  onOpenTimeTracking?: () => void;
  /** Affiché sous la barre Gantt si la liste d’utilisateurs est tronquée (perf.). */
  ganttCapacityHint?: string | null;
};

export const PlanningItineraryFigmaView: React.FC<PlanningItineraryFigmaViewProps> = ({
  isFr,
  locale,
  viewMode,
  onViewModeChange,
  loading,
  calendarMonth,
  onCalendarPrev,
  onCalendarNext,
  selectedYmd,
  onSelectYmd,
  slotsByDay,
  weekLabel,
  weekDays,
  prevWeek,
  nextWeek,
  goToday,
  timelineUserIds,
  timelineLabels,
  slots,
  userId,
  isOrgScopePlanner,
  onPrint,
  onNewSlot,
  onEditSlot,
  onDeleteSlot,
  meetings,
  onOpenTimeTracking,
  ganttCapacityHint = null,
}) => {
  const months = isFr ? MONTHS_FR : MONTHS_EN;
  const daysHdr = isFr ? DAYS_FR : DAYS_EN;
  const slotLabel = (t: PlanningSlot['slotType']) => (isFr ? SLOT_TYPE_LABELS_FR[t] : SLOT_TYPE_LABELS_EN[t]);
  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();
  const firstOffset = mondayFirstOffset(y, m);
  const dim = daysInMonth(y, m);
  const todayYmd = toYMD(new Date());
  /** Créneaux injectés automatiquement (réunion ou tâche projet) — non modifiables ici. */
  const isReadOnlyPlanningEvent = (s: PlanningSlot) =>
    String(s.id).startsWith('meeting-') || isPlanningSlotAutoInjectedNotes(s.notes);

  const readOnlyPlanningLabel = (s: PlanningSlot) => {
    if (String(s.id).startsWith('meeting-')) return isFr ? 'Réunion (synchronisée)' : 'Meeting (synced)';
    if ((s.notes || '').startsWith('COYA_VEHICLE_REQUEST:')) return isFr ? 'Transport (parc auto)' : 'Fleet transport';
    if ((s.notes || '').startsWith('COYA_TASK_SYNC:')) return isFr ? 'Tâche projet (auto)' : 'Project task (auto)';
    return isFr ? 'Synchronisé' : 'Synced';
  };

  const selectedEvents =
    selectedYmd != null ? (slotsByDay[selectedYmd] || []).slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')) : [];

  const upcoming = [...slots]
    .filter((s) => s.slotDate >= todayYmd)
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || (a.startTime || '').localeCompare(b.startTime || ''))
    .slice(0, 5);

  const viewTabs: { id: PlanningItineraryViewMode; fr: string; en: string }[] = [
    { id: 'calendar', fr: 'Calendrier', en: 'Calendar' },
    { id: 'week', fr: 'Planification semaine', en: 'Weekly schedule' },
    { id: 'gantt', fr: 'Gantt', en: 'Gantt' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            {isFr ? 'Ma planification' : 'My schedule'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isFr
              ? 'Calendrier, planification hebdomadaire et Gantt — créneaux et réunions agrégés (vue 360°).'
              : 'Calendar, weekly plan and Gantt — slots and meetings combined (360° view).'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewModeChange(tab.id)}
                className={`px-4 py-2 text-sm transition-colors ${
                  viewMode === tab.id ? 'bg-[#0d1b2a] text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isFr ? tab.fr : tab.en}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <i className="fas fa-print text-gray-500" />
            {isFr ? 'Imprimer' : 'Print'}
          </button>
          <button
            type="button"
            onClick={onNewSlot}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d1b2a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3a5c]"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {isFr ? 'Créneau' : 'Slot'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{isFr ? 'Chargement des créneaux…' : 'Loading slots…'}</p>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={onCalendarPrev}
                className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-gray-100"
                aria-label={isFr ? 'Mois précédent' : 'Previous month'}
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <h3 className="text-base font-semibold text-gray-900">
                {months[m]} {y}
              </h3>
              <button
                type="button"
                onClick={onCalendarNext}
                className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-gray-100"
                aria-label={isFr ? 'Mois suivant' : 'Next month'}
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {daysHdr.map((d) => (
                <div key={d} className="py-3 text-center text-xs font-semibold uppercase text-gray-400">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstOffset }).map((_, i) => (
                <div key={`e-${i}`} className="h-24 border-b border-r border-gray-50 bg-gray-50/30" />
              ))}
              {Array.from({ length: dim }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = slotsByDay[dateStr] || [];
                const isToday = dateStr === todayYmd;
                const isSelected = dateStr === selectedYmd;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onSelectYmd(dateStr)}
                    className={`h-24 border-b border-r border-gray-50 p-1.5 text-left transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span
                      className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? 'bg-blue-500 font-bold text-white' : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[9px] text-white ${SLOT_TYPE_BAR_CLASS[ev.slotType]}`}
                        >
                          {ev.title || slotLabel(ev.slotType)}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] text-gray-400">+{dayEvents.length - 2}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">
              {selectedYmd
                ? new Date(selectedYmd + 'T12:00:00').toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : isFr
                  ? 'Sélectionnez une date'
                  : 'Pick a date'}
            </h3>
            <p className="mb-4 mt-1 text-xs text-gray-400">
              {selectedEvents.length} {isFr ? 'créneau(x)' : 'slot(s)'}
            </p>
            {selectedEvents.length === 0 ? (
              <div className="py-10 text-center">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-400">{isFr ? 'Aucun créneau' : 'No slots'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`rounded-xl border border-gray-100 bg-gray-50 p-3 border-l-4 ${SLOT_TYPE_BORDER_L_CLASS[ev.slotType]}`}
                  >
                    <div className={`mb-2 inline-block h-2 w-2 rounded-full ${SLOT_TYPE_BAR_CLASS[ev.slotType]}`} />
                    <p className="text-sm font-medium text-gray-800">{ev.title || slotLabel(ev.slotType)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {(ev.startTime || '').slice(0, 5)} – {(ev.endTime || '').slice(0, 5)}
                      </span>
                      <span className="text-xs text-gray-400">{slotLabel(ev.slotType)}</span>
                    </div>
                    {!isReadOnlyPlanningEvent(ev) ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEditSlot(ev)}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {isFr ? 'Modifier' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSlot(ev.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          {isFr ? 'Supprimer' : 'Delete'}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[10px] text-violet-600">{readOnlyPlanningLabel(ev)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm font-medium text-gray-700">{isFr ? 'À venir' : 'Upcoming'}</p>
              <div className="space-y-2">
                {upcoming.map((ev) => (
                  <div key={`up-${ev.id}`} className="flex items-center gap-3">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${SLOT_TYPE_BAR_CLASS[ev.slotType]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-gray-700">{ev.title || slotLabel(ev.slotType)}</p>
                      <p className="text-[10px] text-gray-400">
                        {ev.slotDate} · {(ev.startTime || '').slice(0, 5)}
                      </p>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && <p className="text-xs text-gray-400">{isFr ? 'Aucune entrée' : 'None'}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'gantt' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={prevWeek} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[240px] text-center text-sm font-semibold text-gray-800 sm:min-w-[280px]">
              {isFr ? 'Gantt — semaine du' : 'Gantt — week of'} {weekLabel}
            </span>
            <button type="button" onClick={nextWeek} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={goToday} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              {isFr ? "Aujourd'hui" : 'Today'}
            </button>
            <span className="text-xs text-gray-500">
              {isFr
                ? 'Même semaine que la planification : une ligne par personne, colonnes par jour.'
                : 'Same week as weekly schedule: one row per person, columns per day.'}
            </span>
          </div>
          {ganttCapacityHint ? (
            <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">{ganttCapacityHint}</p>
          ) : null}
          <div className="overflow-x-auto pb-2">
            <div
              className="inline-grid min-w-[720px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              style={{ gridTemplateColumns: `140px repeat(${weekDays.length}, minmax(88px, 1fr))` }}
            >
              <div className="border-b border-r border-gray-100 bg-gray-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {isFr ? 'Personne' : 'Person'}
              </div>
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="border-b border-r border-gray-100 bg-gray-50 px-1 py-2 text-center text-[10px] font-semibold uppercase text-gray-600 last:border-r-0"
                >
                  <div>{new Date(d + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short' })}</div>
                  <div className="text-[9px] font-normal text-gray-400">{d.slice(8)}</div>
                </div>
              ))}
              {(timelineUserIds.length ? timelineUserIds : userId ? [String(userId)] : []).map((colUid) => (
                <React.Fragment key={colUid}>
                  <div className="flex items-center border-b border-r border-gray-100 bg-gray-50/80 px-2 py-1.5 text-xs font-semibold text-gray-800">
                    <span className="truncate" title={timelineLabels[colUid]}>
                      {timelineLabels[colUid] || colUid.slice(0, 8)}
                    </span>
                  </div>
                  {weekDays.map((day) => (
                    <div key={`${colUid}-${day}`} className="relative h-[200px] border-b border-r border-gray-50 bg-white last:border-r-0">
                      {Array.from({ length: 13 }, (_, i) => 7 + i).map((h) => (
                        <div
                          key={h}
                          className="pointer-events-none absolute left-0 right-0 border-t border-gray-100 pl-0.5 text-[9px] text-gray-300"
                          style={{ top: `${((h * 60 - DAY_START_MIN) / DAY_RANGE_MIN) * 100}%` }}
                        >
                          {h}h
                        </div>
                      ))}
                      {slots
                        .filter((s) => String(s.userId) === colUid && s.slotDate === day)
                        .map((slot) => {
                          const sm = timeToMinutes(slot.startTime) ?? 9 * 60;
                          const em = timeToMinutes(slot.endTime) ?? sm + 60;
                          const top = Math.max(0, ((sm - DAY_START_MIN) / DAY_RANGE_MIN) * 100);
                          const hPct = Math.max(4, ((em - sm) / DAY_RANGE_MIN) * 100);
                          const readOnly = isReadOnlyPlanningEvent(slot);
                          const bar =
                            slot.slotType === 'meeting'
                              ? 'bg-violet-100 border-violet-200 text-violet-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900';
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={readOnly}
                              onClick={() => !readOnly && onEditSlot(slot)}
                              className={`absolute left-0.5 right-0.5 overflow-hidden rounded border px-0.5 py-0.5 text-left text-[9px] leading-tight shadow-sm ${
                                readOnly ? 'cursor-default opacity-95' : 'hover:brightness-95'
                              } ${bar}`}
                              style={{ top: `${top}%`, height: `${hPct}%` }}
                              title={slot.title || slotLabel(slot.slotType)}
                            >
                              <i className={`${SLOT_TYPE_ICONS[slot.slotType]} mr-0.5`} />
                              <span className="line-clamp-2">{slot.title || slotLabel(slot.slotType)}</span>
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={prevWeek} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[240px] text-center text-sm font-semibold text-gray-800 sm:min-w-[280px]">
              {isFr ? 'Planification — semaine du' : 'Schedule — week of'} {weekLabel}
            </span>
            <button type="button" onClick={nextWeek} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={goToday} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              {isFr ? "Aujourd'hui" : 'Today'}
            </button>
          </div>
          <div className="space-y-4">
            {weekDays.map((day) => (
              <div key={day} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 font-medium text-gray-800">
                  {new Date(day + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="space-y-2 p-4">
                  {(slotsByDay[day] || []).length === 0 ? (
                    <p className="text-sm text-gray-500">{isFr ? 'Aucun créneau' : 'No slots'}</p>
                  ) : (
                    (slotsByDay[day] || []).map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3 hover:border-emerald-200"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-lg p-2 ${
                              slot.slotType === 'telework'
                                ? 'bg-blue-100 text-blue-700'
                                : slot.slotType === 'leave'
                                  ? 'bg-amber-100 text-amber-700'
                                  : slot.slotType === 'meeting'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <i className={SLOT_TYPE_ICONS[slot.slotType]} />
                          </span>
                          <div>
                            <span className="font-medium text-gray-900">{slotLabel(slot.slotType)}</span>
                            {slot.title && <span className="ml-2 text-gray-600">– {slot.title}</span>}
                            <div className="mt-0.5 text-xs text-gray-500">
                              {(slot.startTime || '').slice(0, 5)} – {(slot.endTime || '').slice(0, 5)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isReadOnlyPlanningEvent(slot) ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditSlot(slot)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-emerald-600"
                              >
                                <i className="fas fa-edit" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSlot(slot.id)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-600"
                              >
                                <i className="fas fa-trash" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-violet-600">{readOnlyPlanningLabel(slot)}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meetings.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-violet-50 px-4 py-3 font-medium text-gray-800">
            <i className="fas fa-video mr-2 text-violet-600" />
            {isFr ? 'Réunions à venir' : 'Upcoming meetings'}
          </div>
          <ul className="divide-y divide-gray-100">
            {meetings.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium text-gray-900">{m.title}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(m.startTime).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                {onOpenTimeTracking && (
                  <button
                    type="button"
                    onClick={onOpenTimeTracking}
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    {isFr ? 'Suivi du temps' : 'Time tracking'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlanningItineraryFigmaView;
