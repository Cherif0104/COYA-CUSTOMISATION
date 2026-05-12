import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useModulePermissions } from '../../hooks/useModulePermissions';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { Language } from '../../types';
import {
  NAV_SESSION_CRM_OPEN_COLLECTE_TAB,
  NAV_SESSION_COLLECTE_PRESET_FORMATION_ID,
  NAV_SESSION_APEX_SECTION,
  NAV_SESSION_FORMATION_SECTION,
} from '../../contexts/AppNavigationContext';
import type { Course, User } from '../../types';
import { Button } from '../ui/Button';
import {
  isApexSection,
  parseApexSectionFromHash,
  pushApexSectionToUrl,
  type ApexSection,
} from '../../utils/apexNav';
import { PillTabs } from '../../ui-runtime';
import DataAdapter from '../../services/dataAdapter';
import type { ApexCohortRow } from './types/apexHub';
import {
  ApexOverviewSection,
  ApexCatalogSection,
  ApexCohortsSection,
  ApexStudioSection,
  ApexSessionsSection,
  ApexTracksSection,
  ApexPedagogySection,
  ApexLearnersSection,
  ApexAssessmentsSection,
  ApexCertificatesSection,
  ApexReportsSection,
  ApexIntegrationsSection,
} from './sections';

/**
 * APEX Learning Hub — coquille LMS : sous-modules (vue d’ensemble, catalogue, cohortes,
 * studio, planification, parcours, pédagogie, apprenants, évaluations, certifications,
 * rapports, intégrations) avec données réelles où les tables existent.
 */

export interface ApexModuleShellProps {
  courses: Course[];
  users: User[];
  onSelectCourse: (id: string) => void;
  onAddCourse: (courseData: Omit<Course, 'id' | 'progress'>) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  isLoading?: boolean;
  loadingOperation?: string | null;
  setView: (view: string) => void;
}

function resolveInitialApexSection(): ApexSection {
  if (typeof window !== 'undefined') {
    const fromHash = parseApexSectionFromHash();
    if (fromHash) {
      try {
        sessionStorage.removeItem(NAV_SESSION_APEX_SECTION);
        sessionStorage.removeItem(NAV_SESSION_FORMATION_SECTION);
      } catch {
        /* ignore */
      }
      return fromHash;
    }
    for (const key of [NAV_SESSION_APEX_SECTION, NAV_SESSION_FORMATION_SECTION] as const) {
      try {
        const preset = sessionStorage.getItem(key);
        if (preset && isApexSection(preset)) {
          sessionStorage.removeItem(key);
          return preset;
        }
        if (key === NAV_SESSION_FORMATION_SECTION && preset) {
          const legacyMap: Record<string, ApexSection> = {
            overview: 'overview',
            programmes: 'tracks',
            cohortes: 'cohorts',
            formations: 'studio',
            cours: 'catalog',
            formateurs: 'pedagogy',
            apprenants: 'learners',
            evaluations: 'assessments',
            certificats: 'certificates',
            rapports: 'reports',
          };
          const mapped = legacyMap[preset];
          if (mapped) {
            sessionStorage.removeItem(key);
            return mapped;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return 'overview';
}

const ApexModuleShell: React.FC<ApexModuleShellProps> = ({
  courses,
  users,
  onSelectCourse,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  isLoading,
  loadingOperation,
  setView,
}) => {
  const { language } = useLocalization();
  const isFr = language === Language.FR;
  const { user } = useAuth();
  const { canAccessModule, hasPermission } = useModulePermissions();
  const canStudio = canAccessModule('course_management') && hasPermission('course_management', 'read');

  const [section, setSectionState] = useState<ApexSection>(resolveInitialApexSection);
  const setSection = useCallback((next: ApexSection) => setSectionState(next), []);

  const [cohortsLoading, setCohortsLoading] = useState(false);
  const [cohortsLoaded, setCohortsLoaded] = useState(false);
  const [cohortsError, setCohortsError] = useState<string | null>(null);
  const [cohortRows, setCohortRows] = useState<ApexCohortRow[]>([]);

  useEffect(() => {
    if (cohortsLoaded || cohortsLoading) return;
    const publishedCourses = courses.filter((c) => c.status === 'published');
    let cancelled = false;
    setCohortsLoading(true);
    setCohortsError(null);
    (async () => {
      try {
        const rows: ApexCohortRow[] = [];
        for (const course of publishedCourses) {
          const sessions = await DataAdapter.listCourseSessionsForCourse(String(course.id));
          for (const session of sessions) {
            const enrollments = await DataAdapter.listCourseSessionEnrollmentsForSession(session.id);
            if (cancelled) return;
            rows.push({
              courseId: course.id,
              courseTitle: course.title,
              sessionId: session.id,
              sessionTitle: session.title,
              startsAt: session.startsAt ?? null,
              endsAt: session.endsAt ?? null,
              status: session.status,
              enrollmentCount: enrollments.length,
            });
          }
        }
        if (!cancelled) {
          setCohortRows(rows);
          setCohortsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Erreur chargement cohortes APEX:', error);
          setCohortsError(isFr ? 'Impossible de charger les cohortes.' : 'Unable to load cohorts.');
        }
      } finally {
        if (!cancelled) setCohortsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courses, cohortsLoaded, cohortsLoading, isFr]);

  useEffect(() => {
    const sync = () => {
      const parsed = parseApexSectionFromHash();
      if (parsed) setSectionState(parsed);
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('coya-apex-section', sync as EventListener);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('coya-apex-section', sync as EventListener);
    };
  }, []);

  useEffect(() => {
    pushApexSectionToUrl(section);
  }, [section]);

  const sectionTitle: Record<ApexSection, { fr: string; en: string }> = {
    overview: { fr: "Vue d'ensemble", en: 'Overview' },
    catalog: { fr: 'Catalogue', en: 'Catalog' },
    cohorts: { fr: 'Cohortes & sessions', en: 'Cohorts & sessions' },
    studio: { fr: 'Studio pédagogique', en: 'Pedagogy studio' },
    sessions: { fr: 'Planification sessions', en: 'Session scheduling' },
    tracks: { fr: 'Parcours & durées', en: 'Tracks & duration' },
    pedagogy: { fr: 'Formateurs & mentors', en: 'Trainers & mentors' },
    learners: { fr: 'Apprenants', en: 'Learners' },
    assessments: { fr: 'Évaluations & examens', en: 'Assessments & exams' },
    certificates: { fr: 'Certifications', en: 'Certifications' },
    reports: { fr: 'Rapports', en: 'Reports' },
    integrations: { fr: 'Intégrations', en: 'Integrations' },
  };

  const tabItems = useMemo(
    () =>
      (
        [
          'overview',
          'catalog',
          'cohorts',
          'studio',
          'sessions',
          'tracks',
          'pedagogy',
          'learners',
          'assessments',
          'certificates',
          'reports',
          'integrations',
        ] as ApexSection[]
      ).map((id) => ({
        id,
        label: isFr ? sectionTitle[id].fr : sectionTitle[id].en,
      })),
    [isFr],
  );

  const published = useMemo(() => courses.filter((c) => c.status === 'published'), [courses]);

  const demoYoutubeUrl = useMemo(() => {
    const fromCourse = published.find((c) => c.youtubeUrl?.trim())?.youtubeUrl?.trim();
    return fromCourse || '';
  }, [published]);

  const openCrmCollecteForCourse = (courseId: string) => {
    try {
      sessionStorage.setItem(NAV_SESSION_COLLECTE_PRESET_FORMATION_ID, courseId);
      sessionStorage.setItem(NAV_SESSION_CRM_OPEN_COLLECTE_TAB, '1');
    } catch {
      /* ignore */
    }
    setView('crm_sales');
  };

  const totalSessionEnrollments = useMemo(
    () => cohortRows.reduce((sum, row) => sum + row.enrollmentCount, 0),
    [cohortRows],
  );

  const reportMetrics = useMemo(() => {
    const publishedCount = published.length;
    const sessionsCount = cohortRows.length;
    const courseIdsWithSessions = new Set(cohortRows.map((r) => r.courseId));
    const coverage =
      publishedCount > 0 ? Math.round((courseIdsWithSessions.size / publishedCount) * 100) : 0;
    const avgEnroll = sessionsCount > 0 ? totalSessionEnrollments / sessionsCount : 0;
    const totalCourseEnrollments = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    return {
      publishedCount,
      sessionsCount,
      totalSessionEnrollments,
      coveragePct: coverage,
      avgSessionEnrollments: avgEnroll,
      totalCourseEnrollments,
    };
  }, [published, cohortRows, totalSessionEnrollments, courses]);

  const firstCourseId = courses[0]?.id || '';

  return (
    <div className="min-h-screen bg-[var(--coya-enterprise-bg,#F8FAFC)]" data-testid="apex-shell">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {section !== 'overview' ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">APEX</p>
                  <h1 className="text-xl font-bold text-slate-900">
                    {isFr ? sectionTitle[section].fr : sectionTitle[section].en}
                  </h1>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSection('overview')}>
                  ← {isFr ? "Vue d'ensemble" : 'Overview'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">APEX</p>
                <h1 className="text-xl font-bold text-slate-900">{isFr ? 'E-learning COYA' : 'COYA e-learning'}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {isFr
                    ? 'Hub apprentissage, collecte, accompagnement, certification et pilotage programme / projet — sous-modules interconnectés, pilotables par permissions.'
                    : 'Learning, collect, coaching, certification and program/project steering — interconnected sub-modules with permission control.'}
                </p>
              </div>
            )}

            <div className="-mx-2 overflow-x-auto pb-1">
              <PillTabs<ApexSection> className="min-w-0 px-2" items={tabItems} value={section} onChange={setSection} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {section === 'overview' && (
          <ApexOverviewSection
            isFr={isFr}
            userRole={user?.role}
            courses={courses}
            published={published}
            cohortRows={cohortRows}
            demoYoutubeUrl={demoYoutubeUrl}
          />
        )}

        {section === 'catalog' && (
          <ApexCatalogSection isFr={isFr} courses={courses} users={users} onSelectCourse={onSelectCourse} />
        )}

        {section === 'cohorts' && (
          <ApexCohortsSection
            isFr={isFr}
            cohortRows={cohortRows}
            cohortsLoading={cohortsLoading}
            cohortsError={cohortsError}
            canAccessModule={canAccessModule}
            setView={setView}
            openCrmCollecteForCourse={openCrmCollecteForCourse}
            firstCourseId={firstCourseId}
          />
        )}

        {section === 'studio' && (
          <ApexStudioSection
            isFr={isFr}
            canStudio={canStudio}
            courses={courses}
            users={users}
            onAddCourse={onAddCourse}
            onUpdateCourse={onUpdateCourse}
            onDeleteCourse={onDeleteCourse}
            isLoading={isLoading}
            loadingOperation={loadingOperation}
            openCrmCollecteForCourse={openCrmCollecteForCourse}
          />
        )}

        {section === 'sessions' && (
          <ApexSessionsSection
            isFr={isFr}
            cohortRows={cohortRows}
            cohortsLoading={cohortsLoading}
            totalSessionEnrollments={totalSessionEnrollments}
            setView={setView}
          />
        )}

        {section === 'tracks' && <ApexTracksSection isFr={isFr} setView={setView} />}

        {section === 'pedagogy' && <ApexPedagogySection isFr={isFr} users={users} />}

        {section === 'learners' && <ApexLearnersSection isFr={isFr} courses={courses} />}

        {section === 'assessments' && <ApexAssessmentsSection isFr={isFr} />}

        {section === 'certificates' && (
          <ApexCertificatesSection isFr={isFr} courses={courses} users={users} />
        )}

        {section === 'reports' && (
          <ApexReportsSection isFr={isFr} reportMetrics={reportMetrics} cohortsLoading={cohortsLoading} />
        )}

        {section === 'integrations' && (
          <ApexIntegrationsSection
            isFr={isFr}
            canAccessModule={canAccessModule}
            setView={setView}
            openCrmCollecteForCourse={openCrmCollecteForCourse}
            firstCourseId={firstCourseId}
          />
        )}
      </div>
    </div>
  );
};

export default ApexModuleShell;
