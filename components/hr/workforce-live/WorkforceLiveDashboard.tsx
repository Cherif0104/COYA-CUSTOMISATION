import React from 'react';
import { AnalyticsWorkspaceFloorplan, KPIStrip, type KPIStripItem } from '../../../ui-runtime';
import { AttendanceRealtimeTimeline } from './AttendanceRealtimeTimeline';
import { WorkforceAlertPanel } from './WorkforceAlertPanel';
import { DepartmentPresenceHeatmap } from './DepartmentPresenceHeatmap';
import { PresenceLiveGrid } from './PresenceLiveGrid';
import { PresenceSessionChrono } from './PresenceSessionChrono';
import type {
  DepartmentPresenceCard,
  PresenceLiveGridRow,
  WorkforceAlert,
  WorkforceLiveCounters,
  WorkforceLiveTimelineEntry,
} from './types';

export type WorkforceLiveDashboardProps = {
  fr: boolean;
  counters: WorkforceLiveCounters;
  timelineEntries: WorkforceLiveTimelineEntry[];
  alerts: WorkforceAlert[];
  departments: DepartmentPresenceCard[];
  gridRows: PresenceLiveGridRow[];
  /** Message vide grille live (défaut : salariés uniquement). */
  presenceGridEmptyLabel?: string;
  onRefresh: () => void;
  onOpenTimeAttendance?: () => void;
  onRowAnalysis?: (profileId: string) => void;
};

export const WorkforceLiveDashboard: React.FC<WorkforceLiveDashboardProps> = ({
  fr,
  counters,
  timelineEntries,
  alerts,
  departments,
  gridRows,
  presenceGridEmptyLabel,
  onRefresh,
  onOpenTimeAttendance,
  onRowAnalysis,
}) => {
  const kpiItems: KPIStripItem[] = [
    { id: 'p', label: fr ? 'Présents' : 'Present', value: counters.present },
    { id: 'pause', label: fr ? 'Pause' : 'Break', value: counters.pause },
    { id: 'meet', label: fr ? 'Réunion' : 'Meeting', value: counters.meeting },
    { id: 'abs', label: fr ? 'Absents' : 'Absent', value: counters.absent },
    { id: 'tech', label: fr ? 'Tech' : 'Tech', value: counters.technical },
    { id: 'field', label: fr ? 'Terrain' : 'Field', value: counters.field },
  ];

  return (
    <AnalyticsWorkspaceFloorplan
      className="!shadow-none"
      title={fr ? 'Workforce Live' : 'Workforce Live'}
      subtitle={
        fr
          ? 'Centre opérationnel — statuts live, anomalies et pointage (refresh données existantes).'
          : 'Operations center — live status, alerts, and clocking (existing data refresh).'
      }
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <i className="fas fa-rotate" />
            {fr ? 'Actualiser' : 'Refresh'}
          </button>
          {onOpenTimeAttendance ? (
            <button
              type="button"
              onClick={onOpenTimeAttendance}
              className="inline-flex items-center gap-2 rounded-xl bg-coya-green px-3 py-2 text-xs font-semibold text-white hover:bg-coya-institutional-secondary"
            >
              <i className="fas fa-chart-column" />
              {fr ? 'Temps & Présence' : 'Time & attendance'}
            </button>
          ) : null}
        </div>
      }
      kpi={<KPIStrip items={kpiItems} max={6} />}
    >
      <div className="mt-4 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {fr ? 'Statut piloté via onboarding + bannière' : 'Status handled via onboarding + banner'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {fr
                  ? 'Le chronomètre suit la session active ; le changement de statut se fait depuis la superposition de statut ou le widget compte à rebours.'
                  : 'The timer follows the active session; status updates happen from the status overlay or the countdown widget.'}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 lg:items-end">
              <div className="hidden lg:block">
                <PresenceSessionChrono fr={fr} variant="compact" />
              </div>
              <div className="lg:hidden max-w-md">
                <PresenceSessionChrono fr={fr} variant="prominent" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <AttendanceRealtimeTimeline
            title={fr ? 'Timeline live (statuts)' : 'Live timeline (status)'}
            hint={fr ? 'Flux dérivé des segments de statut — bus événements dédié plus tard.' : 'Derived from status segments — dedicated event bus later.'}
            entries={timelineEntries}
            emptyLabel={fr ? 'Aucun mouvement récent.' : 'No recent activity.'}
          />
          <WorkforceAlertPanel
            title={fr ? 'Anomalies & priorités' : 'Alerts & priorities'}
            alerts={alerts}
            emptyLabel={fr ? 'Aucune alerte prioritaire détectée.' : 'No priority alerts.'}
          />
        </div>

        <DepartmentPresenceHeatmap
          title={fr ? 'Vue équipes (agrégat indicatif)' : 'Team view (indicative rollup)'}
          hint={fr ? 'Répartition par pôles fictifs à partir du roster — départements réels à brancher.' : 'Synthetic poles from roster — wire real departments later.'}
          departments={departments}
        />

        <PresenceLiveGrid
          title={fr ? 'Grille présence live' : 'Live presence grid'}
          hint={fr ? 'Cartes compactes — le détail analytique reste dans Temps & Présence.' : 'Compact cards — analytical detail stays in Time & attendance.'}
          rows={gridRows}
          fr={fr}
          emptyLabel={
            presenceGridEmptyLabel ?? (fr ? 'Aucun salarié chargé.' : 'No employees loaded.')
          }
          onRowAnalysis={onRowAnalysis}
          analysisLabel={fr ? 'Analyse & export' : 'Analysis & export'}
        />
      </div>
    </AnalyticsWorkspaceFloorplan>
  );
};

export default WorkforceLiveDashboard;
