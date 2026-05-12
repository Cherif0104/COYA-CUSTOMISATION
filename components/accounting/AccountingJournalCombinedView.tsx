import React, { useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as PieTooltip,
} from 'recharts';
import { ChevronDown, FileSpreadsheet, Printer, Search, Settings2 } from 'lucide-react';

const fmtFcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';

export type JournalRowStatut = 'Validée' | 'Brouillon' | 'Verrouillée';

export type JournalRow = {
  /** Clé stable React (ex. entryId + lineId) */
  rowKey: string;
  /** Identifiant d’écriture (affichage court ou UUID) */
  id: string;
  date: string;
  journal: string;
  libelle: string;
  reference: string;
  compte: string;
  debit: number | null;
  credit: number | null;
  statut: JournalRowStatut;
};

const REPORT_LIST = [
  'Balance générale',
  'Grand livre',
  'Balance auxiliaire',
  'Liasse fiscale',
  'État des flux',
  'Bilan',
  'Compte de résultat',
  'Annexes',
];

const card =
  'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900';

function buildDonutFromRows(rows: JournalRow[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const amt = (r.debit ?? 0) + (r.credit ?? 0);
    m.set(r.journal, (m.get(r.journal) ?? 0) + amt);
  }
  const tot = [...m.values()].reduce((a, b) => a + b, 0) || 1;
  const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#0ea5e9', '#8b5cf6', '#64748b'];
  let i = 0;
  return [...m.entries()].map(([name, v]) => ({
    name,
    value: Math.max(1, Math.round((v / tot) * 100)),
    color: colors[i++ % colors.length],
  }));
}

export type AccountingJournalCombinedViewProps = {
  /**
   * Tableau (éventuellement vide) = lignes issues de Supabase ou d’une autre source réelle.
   */
  journalRows?: JournalRow[] | null;
  /** Autorise la création d’une nouvelle écriture depuis cette vue. */
  canCreateEntry?: boolean;
  /** Callback déclenché au clic sur « + Nouvelle écriture ». */
  onClickNewEntry?: () => void;
  loading?: boolean;
  loadError?: string | null;
  /** Texte sous le titre du journal (source / période). */
  dataSourceHint?: string;
  optionsJournal?: { value: string; label: string }[];
  dateFrom?: string;
  dateTo?: string;
  filtreJournalId?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onFiltreJournalChange?: (journalId: string) => void;
  onActualiser?: () => void;
  /** Masque le bloc « Rapports » (vue Écritures / focus journal). */
  hideReportsSection?: boolean;
};

const AccountingJournalCombinedView: React.FC<AccountingJournalCombinedViewProps> = ({
  journalRows = null,
  canCreateEntry = false,
  onClickNewEntry,
  loading = false,
  loadError = null,
  dataSourceHint,
  optionsJournal,
  dateFrom,
  dateTo,
  filtreJournalId = '',
  onDateFromChange,
  onDateToChange,
  onFiltreJournalChange,
  onActualiser,
  hideReportsSection = false,
}) => {
  const [insightTab, setInsightTab] = useState<'resume' | 'analytics' | 'infos'>('resume');
  const [reportTab, setReportTab] = useState<'print' | 'pdf' | 'xlsx'>('print');

  const rows = journalRows ?? [];

  const totals = useMemo(() => {
    let d = 0;
    let c = 0;
    for (const r of rows) {
      if (r.debit != null) d += r.debit;
      if (r.credit != null) c += r.credit;
    }
    return { debit: d, credit: c };
  }, [rows]);

  const donutData = useMemo(() => {
    if (rows.length === 0) return [{ name: '—', value: 100, color: '#94a3b8' }];
    const built = buildDonutFromRows(rows);
    return built.length > 0 ? built : [{ name: '—', value: 100, color: '#94a3b8' }];
  }, [rows]);

  const hintDefault = 'Période sélectionnée';
  const subtitle = dataSourceHint ?? hintDefault;

  return (
    <div className="space-y-6">
      {/* Journal des écritures */}
      <section className={card}>
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Journal des écritures
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            {loadError ? (
              <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">{loadError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onActualiser ? (
              <button
                type="button"
                onClick={() => onActualiser()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Actualiser
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canCreateEntry || !onClickNewEntry}
              onClick={canCreateEntry && onClickNewEntry ? () => onClickNewEntry() : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Nouvelle écriture
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Du
            <input
              type="date"
              {...(dateFrom != null && onDateFromChange
                ? { value: dateFrom, onChange: (e) => onDateFromChange(e.target.value) }
                : { defaultValue: '2024-12-01' })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Au
            <input
              type="date"
              {...(dateTo != null && onDateToChange
                ? { value: dateTo, onChange: (e) => onDateToChange(e.target.value) }
                : { defaultValue: '2024-12-31' })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Journal
            {onFiltreJournalChange && optionsJournal ? (
              <select
                value={filtreJournalId}
                onChange={(e) => onFiltreJournalChange(e.target.value)}
                className="min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Tous les journaux</option>
                {optionsJournal.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <select className="min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option>Tous les journaux</option>
                <option>Achats</option>
                <option>Ventes</option>
                <option>Banque</option>
                <option>OD</option>
              </select>
            )}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Statut
            <select className="min-w-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option>Tous</option>
              <option>Validée</option>
              <option>Brouillon</option>
            </select>
          </label>
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher une écriture…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Settings2 className="h-4 w-4" />
            Filtres avancés
          </button>
        </div>

        <div className="relative flex flex-col xl:flex-row">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 text-sm font-medium text-slate-600 backdrop-blur-sm dark:bg-slate-900/70 dark:text-slate-300">
              Chargement…
            </div>
          ) : null}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">N° Écriture</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Journal</th>
                  <th className="px-4 py-3">Libellé</th>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Compte</th>
                  <th className="px-4 py-3 text-right">Débit</th>
                  <th className="px-4 py-3 text-right">Crédit</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr
                    key={r.rowKey}
                    className="text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {r.id}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{r.date}</td>
                    <td className="px-4 py-2.5">{r.journal}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5" title={r.libelle}>
                      {r.libelle}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {r.reference}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-2.5 text-xs" title={r.compte}>
                      {r.compte}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {r.debit != null ? fmtFcfa(r.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {r.credit != null ? fmtFcfa(r.credit) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.statut === 'Validée' ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Validée
                        </span>
                      ) : r.statut === 'Verrouillée' ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                          Verrouillée
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          Brouillon
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="w-full shrink-0 border-t border-slate-100 dark:border-slate-700 xl:w-[320px] xl:border-l xl:border-t-0">
            <div className="flex border-b border-slate-100 dark:border-slate-700">
              {(
                [
                  ['resume', 'Résumé'],
                  ['analytics', 'Analytics'],
                  ['infos', 'Informations'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setInsightTab(id)}
                  className={`flex-1 px-3 py-3 text-center text-xs font-semibold transition sm:text-sm ${
                    insightTab === id
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {insightTab === 'resume' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Soldes clés</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Total débit</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {fmtFcfa(totals.debit)}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Total crédit</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {fmtFcfa(totals.credit)}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">Écart</span>
                      <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtFcfa(Math.abs(totals.debit - totals.credit))}
                      </span>
                    </li>
                  </ul>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Répartition par journal
                    </h4>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={76}
                            paddingAngle={2}
                          >
                            {donutData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <PieTooltip
                            formatter={(value: number, name: string) => [`${value} %`, name]}
                            contentStyle={{
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                      {donutData.map((d) => (
                        <li key={d.name} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                          {d.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {insightTab === 'analytics' && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Graphiques d’activité et tendances seront branchés sur vos données réelles (volume d’écritures,
                  délais de validation, répartition analytique).
                </p>
              )}
              {insightTab === 'infos' && (
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>· Résumé basé sur les écritures affichées dans le tableau.</li>
                  <li>· Ajustez la période, le journal et les filtres pour affiner les montants.</li>
                  <li>· Les rapports détaillés (bilan, compte de résultat, flux) se trouvent dans les autres onglets du module.</li>
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>

      {!hideReportsSection ? (
      <section className={card}>
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rapports</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Génération et aperçu — branchement sur les rapports comptables de votre organisation.
          </p>
        </div>
        <div className="grid gap-0 lg:grid-cols-[200px_minmax(280px,1fr)_minmax(320px,1.2fr)]">
          <nav className="border-b border-slate-100 p-3 dark:border-slate-700 lg:border-b-0 lg:border-r">
            <ul className="space-y-1">
              {REPORT_LIST.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      name === 'Bilan'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {name}
                    {name === 'Bilan' ? <ChevronDown className="h-4 w-4 shrink-0 opacity-60" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-b border-slate-100 p-5 dark:border-slate-700 lg:border-b-0 lg:border-r">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Paramètres du rapport</h3>
            <div className="mt-4 space-y-4">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Type de rapport
                <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option>Bilan comparatif</option>
                  <option>Bilan simplifié</option>
                  <option>Bilan fonctionnel</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Date début
                  <input
                    type="date"
                    defaultValue="2024-01-01"
                    className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Date fin
                  <input
                    type="date"
                    defaultValue="2024-12-31"
                    className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Comparaison
                <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option>Exercice N vs N-1</option>
                  <option>Trimestre vs trimestre</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                Détaillé par regroupement
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600" />
                Masquer les comptes vides
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                Montants en devise locale (FCFA)
              </label>
            </div>
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
              {(
                [
                  ['print', 'Impression', Printer],
                  ['pdf', 'Export PDF', FileSpreadsheet],
                  ['xlsx', 'Export Excel', FileSpreadsheet],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setReportTab(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
                    reportTab === id
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-600 dark:bg-slate-950/50">
              <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900">
                <header className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Rapports comptables
                  </p>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    Aperçu des exports
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Les exports PDF / Excel s&apos;appuieront sur les mêmes agrégats que les vues « Bilan », « Compte de
                    résultat » et « Flux de trésorerie » du module Comptabilité.
                  </p>
                </header>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  Sélectionnez un type de rapport et une période, puis utilisez les boutons ci-dessus pour déclencher
                  un export côté backend. Cette zone n&apos;affiche volontairement aucune donnée simulée afin de rester
                  alignée sur vos tables réelles.
                </p>
                <p className="mt-4 text-center text-[10px] text-slate-400">
                  {reportTab === 'print' && 'Préparation de la mise en page à imprimer.'}
                  {reportTab === 'pdf' && 'Export PDF (à brancher sur votre API d’exports).'}
                  {reportTab === 'xlsx' && 'Export Excel (à brancher sur votre API d’exports).'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
};

export default AccountingJournalCombinedView;
