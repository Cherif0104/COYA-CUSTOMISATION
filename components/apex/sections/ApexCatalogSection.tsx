import React, { useMemo, useState } from 'react';
import type { Course, User } from '../../../types';
import Courses from '../../Courses';
import { APEX_SHELL_CARD } from '../apexConstants';

const CONTENT_TYPES_FR = [
  'Parcours',
  'Sessions',
  'Ateliers',
  'Bootcamps',
  'Programmes',
  'Contenus',
  'Ressources',
];
const CONTENT_TYPES_EN = [
  'Tracks',
  'Sessions',
  'Workshops',
  'Bootcamps',
  'Programs',
  'Content',
  'Resources',
];

const VISIBILITY_FR = ['Public', 'Privé', 'Cohorte', 'Programme', 'Organisation'];
const VISIBILITY_EN = ['Public', 'Private', 'Cohort', 'Program', 'Organization'];

export type ApexCatalogSectionProps = {
  isFr: boolean;
  courses: Course[];
  users: User[];
  onSelectCourse: (id: string) => void;
};

export const ApexCatalogSection: React.FC<ApexCatalogSectionProps> = ({
  isFr,
  courses,
  users,
  onSelectCourse,
}) => {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [sort, setSort] = useState<'recent' | 'rating' | 'duration'>('recent');

  const types = isFr ? CONTENT_TYPES_FR : CONTENT_TYPES_EN;
  const vis = isFr ? VISIBILITY_FR : VISIBILITY_EN;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach((c) => c.category && cats.add(c.category));
    return Array.from(cats).sort();
  }, [courses]);

  const levels = useMemo(() => {
    const lv = new Set<string>();
    courses.forEach((c) => c.level && lv.add(c.level));
    return Array.from(lv).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    let list = [...courses];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q),
      );
    }
    if (level !== 'all') list = list.filter((c) => (c.level || '').toLowerCase() === level.toLowerCase());
    if (category !== 'all') list = list.filter((c) => c.category === category);
    if (status !== 'all') list = list.filter((c) => c.status === status);

    list.sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'duration') return (b.duration || 0) - (a.duration || 0);
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return list;
  }, [courses, query, level, category, status, sort]);

  const totalDuration = useMemo(() => filtered.reduce((s, c) => s + (Number(c.duration) || 0), 0), [filtered]);
  const avgRating =
    filtered.length > 0
      ? Math.round((filtered.reduce((s, c) => s + (c.rating || 0), 0) / filtered.length) * 10) / 10
      : null;

  return (
    <div className="space-y-4">
      <div
        className={`${APEX_SHELL_CARD} overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white sm:p-8`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/90">
          APEX · {isFr ? 'Bibliothèque centrale' : 'Central library'}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {isFr ? 'Catalogue unifié' : 'Unified catalog'}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          {isFr
            ? 'UX type Netflix / Coursera : rangées, filtres, tags dynamiques, niveaux, durées. Un contenu peut être public, privé, réservé cohorte, programme ou organisation.'
            : 'Netflix / Coursera-style UX: rows, filters, tags, levels, durations. Visibility: public, private, cohort, program or org.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-white/20"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} p-4`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {isFr ? 'Classification & métadonnées' : 'Classification & metadata'}
            </h3>
            <p className="text-xs text-slate-500">
              {isFr
                ? 'Catégories, tags, visibilité et niveaux filtrables localement (pas de requêtes serveur).'
                : 'Categories, tags, visibility and levels filtered locally (no server roundtrip).'}
            </p>
            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">{filtered.length}</span>{' '}
              {isFr ? 'éléments filtrés · durée totale' : 'items filtered · total duration'}:{' '}
              <span className="font-semibold text-slate-700">{totalDuration || '0'}</span>{' '}
              {isFr ? 'heures' : 'hours'} ·{' '}
              <span className="font-semibold text-slate-700">{avgRating ?? '—'}</span> ⭐
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vis.map((v) => (
              <span
                key={v}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">{isFr ? 'Recherche' : 'Search'}</p>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={isFr ? 'Titre, catégorie, description…' : 'Title, category, description…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">{isFr ? 'Niveau' : 'Level'}</p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">{isFr ? 'Tous' : 'All'}</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">{isFr ? 'Catégorie' : 'Category'}</p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">{isFr ? 'Toutes' : 'All'}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">{isFr ? 'Statut' : 'Status'}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">{isFr ? 'Tous' : 'All'}</option>
                <option value="draft">{isFr ? 'Brouillon' : 'Draft'}</option>
                <option value="published">{isFr ? 'Publié' : 'Published'}</option>
                <option value="archived">{isFr ? 'Archivé' : 'Archived'}</option>
              </select>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-40"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="recent">{isFr ? 'Plus récents' : 'Most recent'}</option>
                <option value="rating">{isFr ? 'Meilleures notes' : 'Top rated'}</option>
                <option value="duration">{isFr ? 'Durée' : 'Duration'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} overflow-hidden p-4 sm:p-6`}>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            {isFr
              ? 'Aucun résultat pour ces filtres. Essayez une autre recherche ou réinitialisez les filtres.'
              : 'No result with these filters. Try another search or reset filters.'}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                className="rounded-md bg-slate-900 px-3 py-1 text-white"
                onClick={() => {
                  setQuery('');
                  setLevel('all');
                  setCategory('all');
                  setStatus('all');
                  setSort('recent');
                }}
              >
                {isFr ? 'Réinitialiser' : 'Reset'}
              </button>
              <span className="rounded-md bg-white px-3 py-1 text-slate-700">
                {isFr ? 'Utilisez le studio pour créer un cours.' : 'Use Studio to create a course.'}
              </span>
            </div>
          </div>
        ) : (
          <Courses courses={filtered} users={users} onSelectCourse={onSelectCourse} formationHubEmbed />
        )}
      </div>
    </div>
  );
};
