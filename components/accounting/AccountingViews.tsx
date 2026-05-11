import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  FileStack,
  Landmark,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
const treasuryDemo = [
  { m: 'Jan', solde: 420 },
  { m: 'Fév', solde: 465 },
  { m: 'Mar', solde: 438 },
  { m: 'Avr', solde: 502 },
  { m: 'Mai', solde: 489 },
  { m: 'Juin', solde: 531 },
];

const glassPanel =
  'rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl';

export const AccountingDashboardView: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#f4f4f5]">Tableau de bord comptable</h1>
        <p className="mt-1 text-sm text-zinc-400">Vue consolidée multi-organisations (données fictives)</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`${glassPanel} flex items-center gap-2 px-3 py-2`}>
          <Building2 className="h-4 w-4 text-cyan-400" aria-hidden />
          <select
            className="cursor-pointer bg-transparent text-sm text-[#f4f4f5] outline-none"
            aria-label="Organisation active"
            defaultValue="org-a"
          >
            <option value="org-a">COYA Holding (stub)</option>
            <option value="org-b">Filiale Afrique Ouest (stub)</option>
            <option value="org-c">Filiale Europe (stub)</option>
          </select>
        </div>
        <div
          className={`${glassPanel} flex items-center gap-2 px-3 py-2 text-sm text-[#f4f4f5]`}
          title="Indicateur de devise de présentation"
        >
          <span className="font-mono text-cyan-300">XOF</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">EUR affiché</span>
        </div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Chiffre d’affaires (YTD)', hint: 'Placeholder', delta: '+12,4 %', up: true },
        { label: 'Charges opérationnelles', hint: 'Placeholder', delta: '−3,1 %', up: false },
        { label: 'Trésorerie disponible', hint: 'Placeholder', delta: '+8,0 %', up: true },
        { label: 'Marge brute', hint: 'Placeholder', delta: '+1,2 pt', up: true },
      ].map((k) => (
        <div key={k.label} className={`${glassPanel} p-5`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{k.label}</p>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[#f4f4f5]">—</p>
          <p className="mt-1 text-xs text-zinc-500">{k.hint}</p>
          <div
            className={`mt-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              k.up ? 'bg-cyan-500/15 text-cyan-300' : 'bg-blue-500/15 text-blue-300'
            }`}
          >
            {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {k.delta}
          </div>
        </div>
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-3">
      <div className={`${glassPanel} p-5 xl:col-span-2`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-400" aria-hidden />
            <h2 className="text-sm font-semibold text-[#f4f4f5]">Trésorerie — tendance</h2>
          </div>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
            Démo
          </span>
        </div>
        <div className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={treasuryDemo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="accTreasuryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Area
                type="monotone"
                dataKey="solde"
                name="Solde (M€ eq.)"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#accTreasuryFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`${glassPanel} p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f4f4f5]">
            <Receipt className="h-4 w-4 text-cyan-400" aria-hidden />
            Budgets — synthèse
          </h2>
          {[
            { n: 'Programme A', p: 72 },
            { n: 'Programme B', p: 54 },
            { n: 'Support HQ', p: 88 },
          ].map((b) => (
            <div key={b.n} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>{b.n}</span>
                <span>{b.p}% consommé</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${b.p}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className={`${glassPanel} p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f4f4f5]">
            <Bell className="h-4 w-4 text-amber-400" aria-hidden />
            Centre de notifications
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="rounded-lg bg-white/[0.03] px-3 py-2">Aucune alerte critique (stub)</li>
            <li className="rounded-lg bg-white/[0.03] px-3 py-2">Échéance TVA dans 9 jours (stub)</li>
            <li className="rounded-lg bg-white/[0.03] px-3 py-2">Rapprochement bancaire à valider (stub)</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className={`${glassPanel} p-5`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#f4f4f5]">
          <CalendarClock className="h-4 w-4 text-blue-400" aria-hidden />
          Activité récente
        </h2>
        <ul className="space-y-3">
          {[
            'Écriture OD — Dotations aux amortissements',
            'Lettrage fournisseur — lot #4821',
            'Export FEC — exercice 2026 (brouillon)',
          ].map((t, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400/90" />
              <div>
                <p className="text-zinc-200">{t}</p>
                <p className="text-xs text-zinc-500">Il y a {i + 1} h · utilisateur stub</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={`${glassPanel} flex flex-col justify-center p-8 text-center`}>
        <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400/90" aria-hidden />
        <p className="mt-4 text-sm font-medium text-[#f4f4f5]">Conformité & verrous</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Les indicateurs RLS multi-tenant et les workflows de validation seront branchés ici dans une prochaine
          itération.
        </p>
      </div>
    </div>
  </div>
);

export const AccountingFacturationView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Facturation</h1>
      <p className="mt-1 text-sm text-zinc-400">Aperçu facture — carte moderne (données de démonstration)</p>
    </header>
    <div className="mx-auto max-w-lg">
      <div className={`${glassPanel} overflow-hidden`}>
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-blue-600/25 to-cyan-500/10 px-6 py-5">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Facture</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#f4f4f5]">FAC-2026-0142</p>
            </div>
            <span className="self-start rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
              Payée
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-400">Client · Organisation stub · Paris</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {[
            { d: 'Prestation conseil — Lot 1', m: '4 500,00' },
            { d: 'Licence plateforme (trimestre)', m: '1 200,00' },
            { d: 'Frais déplacements', m: '320,00' },
          ].map((row) => (
            <div key={row.d} className="flex justify-between gap-4 text-sm">
              <span className="text-zinc-300">{row.d}</span>
              <span className="font-mono tabular-nums text-[#f4f4f5]">{row.m} €</span>
            </div>
          ))}
          <div className="border-t border-dashed border-white/[0.08] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">TVA 20 %</span>
              <span className="font-mono text-zinc-300">1 204,00 €</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span className="text-[#f4f4f5]">Total TTC</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text font-mono text-transparent">
                7 224,00 €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AccountingDepensesView: React.FC = () => (
  <PlaceholderPage
    title="Dépenses"
    subtitle="Saisie, notes de frais et workflows d’approbation — interface à brancher."
  />
);

export const AccountingTresorerieView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Trésorerie</h1>
      <p className="mt-1 text-sm text-zinc-400">Cash positions et rapprochements (stubs)</p>
    </header>
    <div className={`${glassPanel} p-5`}>
      <div className="mb-4 flex items-center gap-2">
        <Landmark className="h-5 w-5 text-cyan-400" aria-hidden />
        <h2 className="text-sm font-semibold text-[#f4f4f5]">Solde par compte bancaire</h2>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={treasuryDemo} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="m" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="stepAfter" dataKey="solde" stroke="#60a5fa" strokeWidth={2} fill="rgba(96,165,250,0.12)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <BankReconciliationStub />
  </div>
);

export const AccountingComptaGeneraleView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Comptabilité générale</h1>
      <p className="mt-1 text-sm text-zinc-400">Journaux, grand livre et analytique multi-projets (stubs)</p>
    </header>
    <JournalsTableStub />
    <AnalyticalProjectsStub />
    <p className="text-xs text-zinc-500">
      Le journal détaillé et les rapports interactifs sont disponibles depuis la section « Journal » du menu
      principal du module Comptabilité.
    </p>
  </div>
);

export const AccountingFiscaliteView: React.FC = () => (
  <PlaceholderPage title="Fiscalité" subtitle="TVA, liasses, déclarations — écrans à connecter au moteur fiscal." />
);

export const AccountingBudgetsView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Budgets</h1>
      <p className="mt-1 text-sm text-zinc-400">Suivi budgétaire et axes analytiques</p>
    </header>
    <div className="grid gap-4 md:grid-cols-3">
      {['Engagé', 'Réalisé', 'Écart'].map((label) => (
        <div key={label} className={`${glassPanel} p-5`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-3 font-mono text-2xl text-[#f4f4f5]">—</p>
          <p className="mt-2 text-xs text-zinc-500">Données budget multi-organisations (placeholder)</p>
        </div>
      ))}
    </div>
  </div>
);

export const AccountingImmobilisationsView: React.FC = () => (
  <PlaceholderPage title="Immobilisations" subtitle="Table d’immobilisation, amortissements et cessions." />
);

export const AccountingPaieRhView: React.FC = () => (
  <PlaceholderPage
    title="Paie & RH comptable"
    subtitle="Interfaces avec la paie, provisions sociales et charges patronales."
  />
);

export const AccountingConsolidationView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Consolidation</h1>
      <p className="mt-1 text-sm text-zinc-400">Périmètre, éliminations et états consolidés (stub)</p>
    </header>
    <div className={`${glassPanel} overflow-hidden`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Entité</th>
            <th className="px-4 py-3 font-medium">Méthode</th>
            <th className="px-4 py-3 font-medium text-right">CA consolidé</th>
            <th className="px-4 py-3 font-medium text-right">Résultat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05] text-[#e4e4e7]">
          {[
            ['COYA Holding', 'Intégration globale', '—', '—'],
            ['Filiale AO', 'Mise équivalence', '—', '—'],
            ['Filiale EU', 'Intégration globale', '—', '—'],
          ].map(([a, b, c, d]) => (
            <tr key={String(a)} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">{a}</td>
              <td className="px-4 py-3 text-zinc-400">{b}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">{c}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const AccountingAuditView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Audit & conformité</h1>
      <p className="mt-1 text-sm text-zinc-400">Piste d’audit, contrôles et preuves documentaires</p>
    </header>
    <div className={`${glassPanel} p-5`}>
      <ul className="space-y-3">
        {[
          'Journal d’audit immuable (Supabase / RLS) — à brancher',
          'Campagne de contrôle — échantillonnage des écritures',
          'Mapping des rôles SMT vs actions sensibles',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-zinc-300">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const AccountingRapportsView: React.FC = () => (
  <div className="space-y-6">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">Rapports</h1>
      <p className="mt-1 text-sm text-zinc-400">Bibliothèque de sorties financières et réglementaires</p>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {['Balance générale', 'Grand livre', 'Balance auxiliaire', 'État des flux', 'Liasse fiscale', 'FEC / export'].map(
        (name) => (
          <button
            key={name}
            type="button"
            className={`${glassPanel} flex items-center justify-between px-4 py-4 text-left text-sm text-[#f4f4f5] transition hover:border-cyan-500/30 hover:bg-white/[0.06]`}
          >
            <span className="flex items-center gap-2">
              <FileStack className="h-4 w-4 text-blue-400" aria-hidden />
              {name}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500" aria-hidden />
          </button>
        ),
      )}
    </div>
  </div>
);

const PlaceholderPage: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="space-y-4">
    <header>
      <h1 className="text-xl font-semibold text-[#f4f4f5]">{title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </header>
    <div className={`${glassPanel} p-8 text-center text-sm text-zinc-500`}>Contenu à venir dans une prochaine slice.</div>
  </div>
);

const JournalsTableStub: React.FC = () => (
  <div className={`${glassPanel} overflow-hidden`}>
    <div className="border-b border-white/[0.06] px-4 py-3">
      <h2 className="text-sm font-semibold text-[#f4f4f5]">Journaux</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2 font-medium">Code</th>
            <th className="px-4 py-2 font-medium">Libellé</th>
            <th className="px-4 py-2 font-medium text-right">Écritures (mois)</th>
            <th className="px-4 py-2 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {[
            ['ACH', 'Achats', '128', 'Ouvert'],
            ['VTE', 'Ventes', '94', 'Ouvert'],
            ['OD', 'Opérations diverses', '41', 'Ouvert'],
            ['BNQ', 'Banque', '210', 'Verrouillé'],
          ].map(([code, lib, n, st]) => (
            <tr key={String(code)} className="text-[#e4e4e7] hover:bg-white/[0.02]">
              <td className="px-4 py-2 font-mono text-cyan-300/90">{code}</td>
              <td className="px-4 py-2">{lib}</td>
              <td className="px-4 py-2 text-right font-mono tabular-nums">{n}</td>
              <td className="px-4 py-2 text-xs text-zinc-400">{st}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BankReconciliationStub: React.FC = () => (
  <div className={`${glassPanel} overflow-hidden`}>
    <div className="border-b border-white/[0.06] px-4 py-3">
      <h2 className="text-sm font-semibold text-[#f4f4f5]">Rapprochement bancaire</h2>
      <p className="text-xs text-zinc-500">Pointage relevé ↔ grand livre banque (stub)</p>
    </div>
    <table className="w-full text-left text-sm">
      <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
        <tr>
          <th className="px-4 py-2 font-medium">Compte</th>
          <th className="px-4 py-2 font-medium text-right">Relevé</th>
          <th className="px-4 py-2 font-medium text-right">Comptable</th>
          <th className="px-4 py-2 font-medium text-right">Écart</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.05] text-[#e4e4e7]">
        {[
          ['512001 · Principal', '—', '—', '—'],
          ['512002 · Payroll', '—', '—', '—'],
        ].map(([a, b, c, d]) => (
          <tr key={String(a)} className="hover:bg-white/[0.02]">
            <td className="px-4 py-2">{a}</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{b}</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{c}</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums text-amber-300/90">{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AnalyticalProjectsStub: React.FC = () => (
  <div className={`${glassPanel} p-5`}>
    <h2 className="mb-4 text-sm font-semibold text-[#f4f4f5]">Analytique multi-projets</h2>
    <div className="grid gap-3 md:grid-cols-2">
      {[
        { p: 'Projet Horizon', a: 'Axe Programme', v: '—' },
        { p: 'Projet Atlas', a: 'Axe Bailleur', v: '—' },
        { p: 'Internal / G&A', a: 'Axe Coût', v: '—' },
        { p: 'Cross-border', a: 'Axe Géo', v: '—' },
      ].map((row) => (
        <div key={row.p} className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">{row.p}</p>
          <p className="text-xs text-zinc-500">{row.a}</p>
          <p className="mt-2 font-mono text-lg text-cyan-300/90">{row.v}</p>
        </div>
      ))}
    </div>
  </div>
);

export const AccountingParametresView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#f4f4f5]">Paramètres</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cadre comptable, exercices, droits métier — cockpit et atelier historique SYSCOHADA / SYCEBNL
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Cadre et normes', 'SYSCOHADA / SYCEBNL, devise, arrondis'],
          ['Exercices & périodes', 'Ouverture, clôture, verrous'],
          ['Sécurité & rôles', 'RLS multi-tenant, validation à deux niveaux'],
        ].map(([title, desc]) => (
          <div key={String(title)} className={`${glassPanel} p-5 text-left`}>
            <p className="text-sm font-semibold text-[#f4f4f5]">{title}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        L’ancienne interface « expert » monolithique a été retirée au profit du module comptable unifié (navigation à
        gauche). La logique métier reste dans le code source `ComptabiliteModuleLegacy.tsx` pour réintégration ciblée.
      </p>
    </div>
  );
};
