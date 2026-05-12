import React, { useEffect, useMemo, useState } from 'react';
import { describeAssessmentTypes } from '../../../services/apexLearningService';
import { APEX_SHELL_CARD } from '../apexConstants';

export type ApexAssessmentsSectionProps = {
  isFr: boolean;
};

export const ApexAssessmentsSection: React.FC<ApexAssessmentsSectionProps> = ({ isFr }) => {
  type Question = {
    id: string;
    text: string;
    type: string;
    difficulty: string;
    tags: string[];
  };

  const STORAGE_KEY = 'apex_question_bank';
  const [bank, setBank] = useState<Question[]>([]);
  const [text, setText] = useState('');
  const [type, setType] = useState('qcm');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBank(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
    } catch {
      /* ignore */
    }
  }, [bank]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const item: Question = {
      id: `q-${Date.now()}`,
      text: text.trim(),
      type,
      difficulty,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    setBank((prev) => [item, ...prev].slice(0, 100)); // limiter localement
    setText('');
    setTags('');
  };

  const grouped = useMemo(() => {
    return bank.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
  }, [bank]);

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Moteur d’évaluation complet' : 'Full assessment engine'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Quiz (QCM, V/F, texte libre), examens (finaux, intermédiaires, pratiques), évaluations terrain (coaching, projets, livrables). Banque de questions, timer, tentatives, correction auto, randomisation.'
            : 'Quizzes, exams, field assessments. Question bank, timer, attempts, auto-grade, shuffle.'}
        </p>
      </div>

      <div className={`${APEX_SHELL_CARD} space-y-4 p-6`}>
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <label className="w-full text-xs font-medium text-slate-700">
              {isFr ? 'Question' : 'Question'}
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={2}
              />
            </label>
            <div className="flex w-full flex-col gap-2 sm:w-56">
              <label className="text-xs font-medium text-slate-700">
                {isFr ? 'Type' : 'Type'}
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="qcm">{isFr ? 'QCM' : 'MCQ'}</option>
                  <option value="boolean">{isFr ? 'Vrai / Faux' : 'True / False'}</option>
                  <option value="text">{isFr ? 'Texte libre' : 'Free text'}</option>
                  <option value="code">{isFr ? 'Code' : 'Code'}</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                {isFr ? 'Difficulté' : 'Difficulty'}
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">{isFr ? 'Facile' : 'Easy'}</option>
                  <option value="medium">{isFr ? 'Moyen' : 'Medium'}</option>
                  <option value="hard">{isFr ? 'Difficile' : 'Hard'}</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                Tags
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="quiz, data, sql"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-600">
            <span className="rounded-md bg-white px-2 py-1">
              {isFr ? 'Persistance locale (localStorage)' : 'Local-only storage'}
            </span>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800"
            >
              {isFr ? 'Ajouter' : 'Add'}
            </button>
          </div>
        </form>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">{isFr ? 'Répartition par type' : 'Split by type'}</p>
            <div className="mt-2 space-y-1">
              {Object.entries(grouped).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                  <span className="font-medium text-slate-800">{k}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
              ))}
              {Object.keys(grouped).length === 0 && (
                <p className="text-slate-400">{isFr ? 'Aucune question pour le moment.' : 'No questions yet.'}</p>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <ul className="space-y-3">
              {bank.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {isFr
                    ? 'Banque locale vide. Ajoutez des questions ci-dessus.'
                    : 'Local question bank is empty. Add questions above.'}
                </li>
              ) : (
                bank.map((q) => (
                  <li key={q.id} className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{q.text}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {q.type} · {isFr ? 'Difficulté' : 'Difficulty'}: {q.difficulty}
                        </p>
                        {q.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.tags.map((t) => (
                              <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-xs text-slate-500 underline"
                        onClick={() => setBank((prev) => prev.filter((x) => x.id !== q.id))}
                      >
                        {isFr ? 'Supprimer' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${APEX_SHELL_CARD} p-5`}>
          <h4 className="text-xs font-semibold uppercase text-slate-500">{isFr ? 'Builder examens' : 'Exam builder'}</h4>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li>· {isFr ? 'Banque de questions taggée par compétence' : 'Tagged question bank'}</li>
            <li>· {isFr ? 'Timer global & par section' : 'Global & per-section timer'}</li>
            <li>· {isFr ? 'Tentatives & pénalités' : 'Attempts & penalties'}</li>
            <li>· {isFr ? 'Randomisation des items' : 'Item randomization'}</li>
            <li>· {isFr ? 'Correction auto + file manuelle' : 'Auto-grade + manual queue'}</li>
          </ul>
        </div>
        <div className={`${APEX_SHELL_CARD} p-5`}>
          <h4 className="text-xs font-semibold uppercase text-slate-500">{isFr ? 'Surveillance intégrité' : 'Integrity monitoring'}</h4>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li>· {isFr ? 'Anti-copie / navigation' : 'Anti-copy / navigation guard'}</li>
            <li>· {isFr ? 'Webcam (opt-in RGPD)' : 'Webcam (GDPR opt-in)'}</li>
            <li>· {isFr ? 'Plein écran forcé' : 'Forced fullscreen'}</li>
            <li>· {isFr ? 'Score d’activité suspecte' : 'Suspicious activity score'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
