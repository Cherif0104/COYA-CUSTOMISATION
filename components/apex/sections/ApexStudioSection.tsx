import React from 'react';
import type { Course, User } from '../../../types';
import CourseManagement from '../../CourseManagement';
import { APEX_SHELL_CARD } from '../apexConstants';

export type ApexStudioSectionProps = {
  isFr: boolean;
  canStudio: boolean;
  courses: Course[];
  users: User[];
  onAddCourse: (courseData: Omit<Course, 'id' | 'progress'>) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  isLoading?: boolean;
  loadingOperation?: string | null;
  openCrmCollecteForCourse: (courseId: string) => void;
};

export const ApexStudioSection: React.FC<ApexStudioSectionProps> = ({
  isFr,
  canStudio,
  courses,
  users,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  isLoading,
  loadingOperation,
  openCrmCollecteForCourse,
}) => {
  if (!canStudio) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {isFr
          ? 'Accès studio requis (module Gestion des formations + permission lecture).'
          : 'Studio access required (course management module + read permission).'}
      </div>
    );
  }

  const blocks = isFr
    ? [
        { t: 'Éditeur visuel', d: 'Contenus, activités, quiz, examens, exercices, parcours.' },
        { t: 'Builder drag & drop', d: 'Structurer modules et leçons ; ordre pédagogique.' },
        { t: 'Médias', d: 'Vidéo, PDF, audio, PPT, images — compression & miniatures (pipeline).' },
        { t: 'Lecteur intégré', d: 'Pas d’ouverture primaire hors plateforme pour médias sensibles.' },
        { t: 'IA (roadmap)', d: 'Génération quiz, résumés, transcription, sous-titres.' },
      ]
    : [
        { t: 'Visual editor', d: 'Content, activities, quizzes, exams, exercises, tracks.' },
        { t: 'Drag & drop builder', d: 'Structure modules & lessons.' },
        { t: 'Media', d: 'Video, PDF, audio, PPT, images — compression & thumbs (pipeline).' },
        { t: 'In-app player', d: 'No primary external navigation for sensitive media.' },
        { t: 'AI (roadmap)', d: 'Quiz gen, summaries, transcription, subtitles.' },
      ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className={`${APEX_SHELL_CARD} overflow-hidden p-4 sm:p-6`}>
        <CourseManagement
          courses={courses}
          users={users}
          onAddCourse={onAddCourse}
          onUpdateCourse={onUpdateCourse}
          onDeleteCourse={onDeleteCourse}
          embedded
          isLoading={isLoading}
          loadingOperation={loadingOperation}
          onOpenCrmCollecteForCourse={openCrmCollecteForCourse}
        />
      </div>
      <div className="space-y-3">
        <div className={`${APEX_SHELL_CARD} p-4`}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isFr ? 'Moteur pédagogique' : 'Pedagogy engine'}
          </h3>
          <ul className="mt-3 space-y-3">
            {blocks.map((b) => (
              <li key={b.t} className="text-xs">
                <p className="font-semibold text-slate-900">{b.t}</p>
                <p className="mt-0.5 text-slate-600">{b.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
