import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContextSupabase';
import DataAdapter from '../../services/dataAdapter';
import * as comptabiliteService from '../../services/comptabiliteService';
import type {
  AccountingJournal,
  AccountingBudget,
  ChartOfAccount,
  CostCenter,
  AccountingReconciliation,
  AccountingPeriodClosure,
  FiscalRule,
  Invoice,
  AccountingFramework,
} from '../../types';
import type {
  AccountingComptaFocus,
  AccountingFiscaliteFocus,
  AccountingReportMode,
  AccountingTresorerieFocus,
} from './accountingRoutes';

const card = 'rounded-xl border border-slate-200 bg-white shadow-sm';

function fmtMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

function normCode(code: string) {
  return code.replace(/\s/g, '');
}

function isClientAccountCode(code: string) {
  return /^411/.test(normCode(code));
}

function isSupplierAccountCode(code: string) {
  return /^401/.test(normCode(code));
}

function isBankAccountCode(code: string) {
  const c = normCode(code);
  return /^52/.test(c) || /^53/.test(c);
}

function isCashRegisterCode(code: string) {
  return /^57/.test(normCode(code));
}

function isTreasuryMovementCode(code?: string | null) {
  if (!code) return false;
  const c = normCode(code);
  return /^5[0-7]/.test(c);
}

function resolveActorUserId(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null;
  const u = user as Record<string, unknown>;
  const id = u.id ?? u.user_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Écran minimal lorsqu’aucune API n’existe encore pour la sous-fonction. */
export const AccountingRouteEmpty: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className={`${card} p-10 text-center`}>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto">{message}</p>
  </div>
);

export const AccountingDashboardView: React.FC<{ organizationId: string | null }> = ({ organizationId }) => {
  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title="Synthèse"
        message="Associez une organisation à votre compte pour afficher les indicateurs comptables."
      />
    );
  }
  return (
    <div className={`${card} p-10 text-center space-y-3`}>
      <h3 className="text-lg font-semibold text-slate-900">Synthèse & devise</h3>
      <p className="text-sm text-slate-600 max-w-xl mx-auto">
        Le tableau de bord consolidé (KPI multi-comptes) n’est pas encore livré. Les soldes et le journal sont
        disponibles via les onglets « Balance », « Grand livre » et « Journal ».
      </p>
    </div>
  );
};

export const AccountingFacturationView: React.FC<{ organizationId: string | null }> = ({ organizationId }) => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await DataAdapter.getInvoices();
        if (!cancelled) setRows(list);
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Erreur chargement factures');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title="Facturation"
        message="Organisation requise pour lier les pièces aux écritures."
      />
    );
  }

  const totalOutstanding = rows.reduce((sum, inv) => {
    if (inv.status === 'Paid') return sum;
    const paid = inv.paidAmount ?? 0;
    const remaining = Math.max(0, inv.amount - paid);
    return sum + remaining;
  }, 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Facturation</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Liste des factures Finance (table <code className="font-mono text-xs">invoices</code>) pour cette
            organisation. Le lien exact vers les écritures comptables sera branché via les événements
            comptables (`accountingEvents`) côté backend.
          </p>
        </div>
      </header>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Factures</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{rows.length}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Encours (non soldé)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {rows.length === 0 ? '0' : fmtMoney(totalOutstanding)}
          </p>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800">Factures récentes</h4>
          <button
            type="button"
            onClick={() => {
              if (!organizationId) return;
              setLoading(true);
              setErr(null);
              DataAdapter.getInvoices()
                .then((list) => setRows(list))
                .catch((e: unknown) => {
                  setErr(e instanceof Error ? e.message : 'Erreur chargement factures');
                  setRows([]);
                })
                .finally(() => setLoading(false));
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
          >
            Actualiser
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            Aucune facture trouvée pour cette organisation. Créez une facture dans le module Finance pour voir les
            pièces ici.
          </p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">N° facture</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 text-right font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Comptabilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows
                  .slice()
                  .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))
                  .map((inv) => {
                    const outstanding =
                      inv.status === 'Paid' ? 0 : Math.max(0, inv.amount - (inv.paidAmount ?? 0));
                    return (
                      <tr key={inv.id}>
                        <td className="px-4 py-2 text-slate-600">
                          {inv.transactionDate
                            ? new Date(inv.transactionDate).toLocaleDateString('fr-FR')
                            : inv.dueDate || '—'}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-900">
                          {inv.invoiceNumber || inv.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-2">{inv.clientName}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {fmtMoney(inv.amount)}{' '}
                          {outstanding > 0 && (
                            <span className="ml-1 text-xs text-amber-700">
                              ({fmtMoney(outstanding)} en attente)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'Overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : inv.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          Pont vers écriture comptable à activer (bus évènements).
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AccountingFiscaliteView: React.FC<{
  organizationId: string | null;
  focus: AccountingFiscaliteFocus;
}> = ({ organizationId, focus }) => {
  const [rules, setRules] = useState<FiscalRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title =
    focus === 'tva' ? 'TVA' : focus === 'impots' ? 'Impôts & taxes' : 'Déclarations fiscales';

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const list = await comptabiliteService.listFiscalRules(organizationId);
        if (!cancelled) setRules(list);
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Erreur chargement règles fiscales');
          setRules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title={title}
        message="Organisation requise pour afficher les paramètres fiscaux."
      />
    );
  }

  if (focus === 'declarations') {
    return (
      <AccountingRouteEmpty
        title={title}
        message="Les liasses et déclarations s’appuieront sur les règles fiscales (table fiscal_rules) et les soldes comptables. Cet écran expose déjà les règles ; les exports restent à brancher côté backend."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">
            Codes et taux issus de la table <code className="font-mono text-xs">fiscal_rules</code>{' '}
            (référentiel TVA / impôts par organisation).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!organizationId) return;
            setLoading(true);
            setErr(null);
            comptabiliteService
              .listFiscalRules(organizationId)
              .then((list) => setRules(list))
              .catch((e: unknown) => {
                setErr(e instanceof Error ? e.message : 'Erreur chargement règles fiscales');
                setRules([]);
              })
              .finally(() => setLoading(false));
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </header>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      <div className={`${card} overflow-hidden`}>
        {rules.length === 0 && !loading ? (
          <p className="p-6 text-sm text-slate-600">
            Aucune règle fiscale enregistrée pour cette organisation. Les taux de TVA et d’impôts
            peuvent être saisis via l’administration ou des migrations SQL.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Libellé</th>
                <th className="px-4 py-2 text-right font-medium">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-900">{r.code}</td>
                  <td className="px-4 py-2 text-slate-800">{r.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.rate.toFixed(2)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const AccountingBudgetsView: React.FC<{ organizationId: string | null }> = ({ organizationId }) => {
  const [rows, setRows] = useState<AccountingBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const list = await comptabiliteService.listBudgets(organizationId);
      setRows(list);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement budgets');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return <AccountingRouteEmpty title="Budgets" message="Organisation requise." />;
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Budgets</h3>
          <p className="text-sm text-slate-500 mt-1">Budgets enregistrés pour l’organisation (table budgets).</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </header>
      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      <div className={`${card} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            Aucun budget en base. Créez un budget via l’API ou les écrans d’administration lorsqu’ils seront exposés ici.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Exercice</th>
                <th className="px-4 py-2 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((b) => (
                <tr key={b.id} className="text-slate-800">
                  <td className="px-4 py-2 font-medium">{b.name}</td>
                  <td className="px-4 py-2 tabular-nums">{b.fiscalYear}</td>
                  <td className="px-4 py-2 text-slate-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const AccountingTresorerieView: React.FC<{
  organizationId: string | null;
  focus: AccountingTresorerieFocus;
}> = ({ organizationId, focus }) => {
  const [rows, setRows] = useState<AccountingReconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const list = await comptabiliteService.listReconciliations(organizationId);
      setRows(list);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement rapprochements');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const focusLabel =
    focus === 'banques'
      ? 'Comptes bancaires'
      : focus === 'caisse'
        ? 'Caisse'
        : 'Rapprochements bancaires';

  if (!organizationId) {
    return <AccountingRouteEmpty title={focusLabel} message="Organisation requise." />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">{focusLabel}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {focus === 'rapprochements'
            ? 'Pointages relevé ↔ grand-livre (table accounting_reconciliations).'
            : 'Soldes par compte de trésorerie : à compléter avec le marquage is_cash_flow_register sur le plan comptable et les mouvements bancaires.'}
        </p>
      </header>
      {focus !== 'rapprochements' ? (
        <div className={`${card} p-8 text-center text-sm text-slate-600`}>
          Vue détaillée « {focusLabel} » : pas d’agrégat dédié en base hors rapprochements. Utilisez le tableau de flux ou le grand livre filtré sur les comptes de trésorerie.
        </div>
      ) : null}
      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800">Rapprochements</h4>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-medium text-coya-primary hover:underline"
          >
            Actualiser
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">Aucun rapprochement enregistré.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Réf. relevé</th>
                <th className="px-4 py-2 font-medium">Date relevé</th>
                <th className="px-4 py-2 text-right font-medium">Relevé</th>
                <th className="px-4 py-2 text-right font-medium">Comptable</th>
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono text-xs">{r.statementReference}</td>
                  <td className="px-4 py-2">{r.statementDate}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(r.statementBalance)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(r.bookBalance)}</td>
                  <td className="px-4 py-2 text-slate-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const AccountingComptaGeneraleView: React.FC<{
  organizationId: string | null;
  focus: AccountingComptaFocus;
}> = ({ organizationId, focus }) => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const [a, j, c] = await Promise.all([
        comptabiliteService.listChartOfAccounts(organizationId),
        comptabiliteService.listAccountingJournals(organizationId),
        comptabiliteService.listCostCenters(organizationId),
      ]);
      setAccounts(a);
      setJournals(j);
      setCenters(c);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement');
      setAccounts([]);
      setJournals([]);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return <AccountingRouteEmpty title="Comptabilité générale" message="Organisation requise." />;
  }

  const title =
    focus === 'plan_comptable' ? 'Plan comptable' : focus === 'analytique' ? 'Analytique' : 'Centres de coûts';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">Données Supabase (RLS organisation).</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </header>
      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : null}

      {(focus === 'plan_comptable' || focus === 'analytique') && (
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Plan comptable ({accounts.length} comptes)</h4>
          </div>
          {accounts.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">Aucun compte. Initialisez le plan (template SYSCOHADA / SYCEBNL) depuis les migrations ou l’admin.</p>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Libellé</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts
                    .slice()
                    .sort((x, y) => x.code.localeCompare(y.code))
                    .map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 font-mono text-xs text-slate-900">{a.code}</td>
                        <td className="px-4 py-2 text-slate-800">{a.label}</td>
                        <td className="px-4 py-2 text-slate-500">{a.accountType}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(focus === 'analytique' || focus === 'centres_couts') && (
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Centres de coûts ({centers.length})</h4>
          </div>
          {centers.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">Aucun centre de coût.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Libellé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
                    <td className="px-4 py-2">{c.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {focus === 'plan_comptable' && (
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Journaux ({journals.length})</h4>
          </div>
          {journals.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">Aucun journal comptable.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Nom</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journals.map((j) => (
                  <tr key={j.id}>
                    <td className="px-4 py-2 font-mono text-xs">{j.code}</td>
                    <td className="px-4 py-2">{j.name}</td>
                    <td className="px-4 py-2 text-slate-500">{j.journalType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export const AccountingRapportsView: React.FC<{
  organizationId: string | null;
  mode: AccountingReportMode;
}> = ({ organizationId, mode }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [balances, setBalances] = useState<
    Array<{ accountId: string; code: string; label: string; accountType: string; debit: number; credit: number; balance: number }>
  >([]);
  const [bilan, setBilan] = useState<Awaited<ReturnType<typeof comptabiliteService.getBalanceSheet>> | null>(null);
  const [cr, setCr] = useState<Awaited<ReturnType<typeof comptabiliteService.getIncomeStatement>> | null>(null);
  const [flux, setFlux] = useState<Awaited<ReturnType<typeof comptabiliteService.getCashFlowStatement>> | null>(null);

  const title =
    mode === 'grand_livre'
      ? 'Grand livre (soldes par compte)'
      : mode === 'balance'
        ? 'Balance des comptes'
        : mode === 'bilan'
          ? 'Bilan'
          : mode === 'compte_resultat'
            ? 'Compte de résultat'
            : 'Tableau de flux de trésorerie';

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      if (mode === 'grand_livre' || mode === 'balance') {
        const b = await comptabiliteService.getAccountBalances({ organizationId, dateFrom, dateTo });
        setBalances(b.sort((x, y) => x.code.localeCompare(y.code)));
        setBilan(null);
        setCr(null);
        setFlux(null);
      } else if (mode === 'bilan') {
        const data = await comptabiliteService.getBalanceSheet(organizationId, dateTo);
        setBilan(data);
        setBalances([]);
        setCr(null);
        setFlux(null);
      } else if (mode === 'compte_resultat') {
        const data = await comptabiliteService.getIncomeStatement(organizationId, dateFrom, dateTo);
        setCr(data);
        setBalances([]);
        setBilan(null);
        setFlux(null);
      } else {
        const data = await comptabiliteService.getCashFlowStatement(organizationId, dateFrom, dateTo);
        setFlux(data);
        setBalances([]);
        setBilan(null);
        setCr(null);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement rapport');
      setBalances([]);
      setBilan(null);
      setCr(null);
      setFlux(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, mode, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return <AccountingRouteEmpty title={title} message="Organisation requise pour calculer les soldes." />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">Calculs issus des écritures validées sur la période (getAccountBalances / rapports SYSCOHADA).</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        {mode !== 'bilan' ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Du
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          {mode === 'bilan' ? 'À la date du' : 'Au'}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </div>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}

      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      {(mode === 'grand_livre' || mode === 'balance') && !loading && (
        <div className={`${card} overflow-hidden`}>
          {balances.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-600">Aucune écriture sur cette période — balance vide.</p>
          ) : (
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Compte</th>
                    <th className="px-4 py-2 text-right font-medium">Débit</th>
                    <th className="px-4 py-2 text-right font-medium">Crédit</th>
                    <th className="px-4 py-2 text-right font-medium">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.map((b) => (
                    <tr key={b.accountId}>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-slate-800">{b.code}</span>
                        <span className="text-slate-600"> · {b.label}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(b.debit)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(b.credit)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtMoney(b.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {mode === 'bilan' && bilan && !loading && (
        <div className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                { label: 'Actif', rows: bilan.assets, total: bilan.totalAssets },
                {
                  label: 'Passif',
                  rows: bilan.liabilities,
                  total: bilan.liabilities.reduce((s, x) => s + x.balance, 0),
                },
                {
                  label: 'Capitaux propres',
                  rows: bilan.equity,
                  total: bilan.equity.reduce((s, x) => s + x.balance, 0),
                },
              ] as const
            ).map((block) => (
              <div key={block.label} className={card}>
                <div className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-800">{block.label}</div>
                <div className="max-h-64 overflow-auto">
                  {block.rows.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500">Aucune ligne.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        {block.rows.map((r) => (
                          <tr key={`${block.label}-${r.code}`} className="border-b border-slate-100">
                            <td className="px-3 py-1.5 text-slate-700">
                              {r.code} · {r.label}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtMoney(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="border-t border-slate-200 px-4 py-2 text-right text-sm font-semibold text-slate-900">
                  Sous-total {fmtMoney(block.total)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Total actif {fmtMoney(bilan.totalAssets)} · Total passif + capitaux propres (agrégat service){' '}
            {fmtMoney(bilan.totalLiabilitiesAndEquity)}
          </p>
        </div>
      )}

      {mode === 'compte_resultat' && cr && !loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-800">Produits</div>
            <div className="max-h-64 overflow-auto text-sm">
              {cr.income.length === 0 ? (
                <p className="p-4 text-slate-500">Aucun produit sur la période.</p>
              ) : (
                cr.income.map((r) => (
                  <div key={r.code} className="flex justify-between border-b border-slate-100 px-4 py-2">
                    <span className="text-slate-700">
                      {r.code} · {r.label}
                    </span>
                    <span className="tabular-nums">{fmtMoney(r.balance)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-2 text-right font-semibold">Total {fmtMoney(cr.totalIncome)}</div>
          </div>
          <div className={card}>
            <div className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-800">Charges</div>
            <div className="max-h-64 overflow-auto text-sm">
              {cr.expense.length === 0 ? (
                <p className="p-4 text-slate-500">Aucune charge sur la période.</p>
              ) : (
                cr.expense.map((r) => (
                  <div key={r.code} className="flex justify-between border-b border-slate-100 px-4 py-2">
                    <span className="text-slate-700">
                      {r.code} · {r.label}
                    </span>
                    <span className="tabular-nums">{fmtMoney(r.balance)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-2 text-right font-semibold">Total {fmtMoney(cr.totalExpense)}</div>
          </div>
          <p className="md:col-span-2 text-sm font-medium text-slate-800">
            Résultat : {fmtMoney(cr.result)} (produits − charges selon soldes période)
          </p>
        </div>
      )}

      {mode === 'flux' && flux && !loading && (
        <div className={`${card} p-6 space-y-4`}>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-500">Trésorerie ouverture</p>
              <p className="text-lg font-semibold tabular-nums">{fmtMoney(flux.openingCash)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Trésorerie clôture</p>
              <p className="text-lg font-semibold tabular-nums">{fmtMoney(flux.closingCash)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Mouvement période</p>
              <p className="text-lg font-semibold tabular-nums">{fmtMoney(flux.periodMovement)}</p>
            </div>
          </div>
          {flux.details.length === 0 ? (
            <p className="text-sm text-slate-600">
              Aucun compte marqué « registre de trésorerie » (is_cash_flow_register). Paramétrez le plan comptable pour
              alimenter ce tableau.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Compte</th>
                  <th className="py-2 text-right font-medium">Ouverture</th>
                  <th className="py-2 text-right font-medium">Clôture</th>
                  <th className="py-2 text-right font-medium">Mouvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flux.details.map((d) => (
                  <tr key={d.code}>
                    <td className="py-2">
                      <span className="font-mono text-xs">{d.code}</span> · {d.label}
                    </td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(d.opening)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(d.closing)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(d.movement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export const AccountingParametresView: React.FC<{ organizationId: string | null }> = ({ organizationId }) => {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof comptabiliteService.getOrganizationAccountingSettings>>>(null);
  const [fiscalYears, setFiscalYears] = useState<Awaited<ReturnType<typeof comptabiliteService.listFiscalYears>>>([]);
  const [perms, setPerms] = useState<Awaited<ReturnType<typeof comptabiliteService.getAccountingPermissions>>>([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [bridgeSaving, setBridgeSaving] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeSuccess, setBridgeSuccess] = useState<string | null>(null);
  const [bridgeForm, setBridgeForm] = useState<{
    invoiceReceivableAccountId: string;
    invoiceRevenueAccountId: string;
    invoiceVatAccountId: string;
    invoiceJournalId: string;
  }>({
    invoiceReceivableAccountId: '',
    invoiceRevenueAccountId: '',
    invoiceVatAccountId: '',
    invoiceJournalId: '',
  });

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [s, fy, p, a, j] = await Promise.all([
        comptabiliteService.getOrganizationAccountingSettings(organizationId),
        comptabiliteService.listFiscalYears(organizationId),
        comptabiliteService.getAccountingPermissions(organizationId),
        comptabiliteService.listChartOfAccounts(organizationId),
        comptabiliteService.listAccountingJournals(organizationId),
      ]);
      setSettings(s);
      setFiscalYears(fy);
      setPerms(p);
      setAccounts(a);
      setJournals(j);

      const bridge = s?.bridgeConfig;
      // Heuristiques douces pour pré‑remplir les sélections si rien n’est défini.
      const receivableDefault =
        bridge?.invoiceReceivableAccountId ??
        (a.find((acc) => acc.accountType === 'asset' && /^41/.test(normCode(acc.code)))?.id ?? '');
      const revenueDefault =
        bridge?.invoiceRevenueAccountId ??
        (a.find((acc) => acc.accountType === 'income' && /^7/.test(normCode(acc.code)))?.id ?? '');
      const vatDefault =
        bridge?.invoiceVatAccountId ??
        (a.find((acc) => acc.accountType === 'liability' && /^44/.test(normCode(acc.code)))?.id ?? '');
      const journalDefault =
        bridge?.invoiceJournalId ??
        (j.find((jj) => jj.journalType === 'sales')?.id ?? (j[0]?.id ?? ''));

      setBridgeForm({
        invoiceReceivableAccountId: receivableDefault || '',
        invoiceRevenueAccountId: revenueDefault || '',
        invoiceVatAccountId: vatDefault || '',
        invoiceJournalId: journalDefault || '',
      });
    } catch {
      setSettings(null);
      setFiscalYears([]);
      setPerms([]);
      setAccounts([]);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return <AccountingRouteEmpty title="Paramètres" message="Organisation requise." />;
  }

  const handleSaveBridge: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!organizationId) return;
    setBridgeSaving(true);
    setBridgeError(null);
    setBridgeSuccess(null);
    try {
      const next = await comptabiliteService.setOrganizationAccountingBridgeConfig(organizationId, {
        invoiceReceivableAccountId: bridgeForm.invoiceReceivableAccountId || null,
        invoiceRevenueAccountId: bridgeForm.invoiceRevenueAccountId || null,
        invoiceVatAccountId: bridgeForm.invoiceVatAccountId || null,
        invoiceJournalId: bridgeForm.invoiceJournalId || null,
      });
      setSettings(next);
      setBridgeSuccess('Pont factures → comptabilité enregistré.');
    } catch (err: unknown) {
      setBridgeError(
        err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du pont factures.',
      );
    } finally {
      setBridgeSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Paramètres & accès</h3>
          <p className="text-sm text-slate-500 mt-1">Cadre comptable, exercices, droits métier (tables Supabase).</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </header>

      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card + ' p-5'}>
          <h4 className="text-sm font-semibold text-slate-900">Cadre comptable</h4>
          <p className="mt-2 text-sm text-slate-600">
            {settings?.accountingFramework
              ? `Référentiel : ${settings.accountingFramework}`
              : 'Aucun cadre enregistré (organization_accounting_settings).'}
          </p>
          <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-800">
              Pont factures Finance → Comptabilité
            </p>
            <p className="text-xs text-slate-500">
              Sélectionnez les comptes et le journal utilisés lorsque les factures Finance sont
              postées en comptabilité.
            </p>
            <form onSubmit={handleSaveBridge} className="mt-2 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Compte client (classe 41…)
                  <select
                    value={bridgeForm.invoiceReceivableAccountId}
                    onChange={(e) =>
                      setBridgeForm((prev) => ({
                        ...prev,
                        invoiceReceivableAccountId: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="">— Non défini</option>
                    {accounts
                      .filter((acc) => acc.accountType === 'asset')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} · {acc.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Compte produits (classe 70…)
                  <select
                    value={bridgeForm.invoiceRevenueAccountId}
                    onChange={(e) =>
                      setBridgeForm((prev) => ({
                        ...prev,
                        invoiceRevenueAccountId: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="">— Non défini</option>
                    {accounts
                      .filter((acc) => acc.accountType === 'income')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} · {acc.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Compte TVA collectée (classe 44…)
                  <select
                    value={bridgeForm.invoiceVatAccountId}
                    onChange={(e) =>
                      setBridgeForm((prev) => ({
                        ...prev,
                        invoiceVatAccountId: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="">— Optionnel (pas de TVA)</option>
                    {accounts
                      .filter((acc) => acc.accountType === 'liability')
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} · {acc.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Journal de ventes
                  <select
                    value={bridgeForm.invoiceJournalId}
                    onChange={(e) =>
                      setBridgeForm((prev) => ({
                        ...prev,
                        invoiceJournalId: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="">— Non défini</option>
                    {journals.map((jj) => (
                      <option key={jj.id} value={jj.id}>
                        {jj.code} · {jj.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {bridgeError ? (
                <p className="text-xs text-amber-700">{bridgeError}</p>
              ) : null}
              {bridgeSuccess ? (
                <p className="text-xs text-emerald-700">{bridgeSuccess}</p>
              ) : null}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={bridgeSaving}
                  className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                >
                  {bridgeSaving ? 'Enregistrement…' : 'Enregistrer le pont factures'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className={card + ' p-5'}>
          <h4 className="text-sm font-semibold text-slate-900">Exercices fiscaux</h4>
          {fiscalYears.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Aucun exercice.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {fiscalYears.map((fy) => (
                <li key={fy.id} className="flex justify-between gap-2">
                  <span>{fy.label}</span>
                  <span className="text-slate-500 text-xs">
                    {fy.dateStart} → {fy.dateEnd}
                    {fy.isClosed ? ' · clôturé' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={card + ' p-5'}>
        <h4 className="text-sm font-semibold text-slate-900">Droits comptabilité ({perms.length})</h4>
        {perms.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Aucune ligne accounting_permissions pour cette organisation.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-700 font-mono">
            {perms.map((p) => (
              <li key={p.id}>
                {p.userId?.slice(0, 8)}… — {p.role}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const AccountingAuxiliaireView: React.FC<{
  organizationId: string | null;
  variant: 'clients' | 'fournisseurs';
}> = ({ organizationId, variant }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<
    Array<{ accountId: string; code: string; label: string; debit: number; credit: number; balance: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = variant === 'clients' ? 'Clients' : 'Fournisseurs';

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const balances = await comptabiliteService.getAccountBalances({
        organizationId,
        dateFrom,
        dateTo,
      });
      const filtered = balances
        .filter((b) =>
          variant === 'clients'
            ? isClientAccountCode(b.code)
            : isSupplierAccountCode(b.code),
        )
        .sort((a, b) => a.code.localeCompare(b.code));
      setRows(filtered);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement soldes auxiliaires');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, variant, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title={title}
        message="Organisation requise pour afficher les soldes clients/fournisseurs."
      />
    );
  }

  const subtitle =
    variant === 'clients'
      ? 'Soldes par compte client (classe 41 – ex. 411…).'
      : 'Soldes par compte fournisseur (classe 40 – ex. 401…).';

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Du
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Au
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </div>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      <div className={`${card} overflow-hidden`}>
        {rows.length === 0 && !loading ? (
          <p className="p-8 text-center text-sm text-slate-600">
            Aucun solde trouvé sur la période pour les comptes sélectionnés. Vérifiez le plan
            comptable (classes 40/41) et le journal.
          </p>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Compte</th>
                  <th className="px-4 py-2 text-right font-medium">Débit</th>
                  <th className="px-4 py-2 text-right font-medium">Crédit</th>
                  <th className="px-4 py-2 text-right font-medium">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((b) => (
                  <tr key={b.accountId}>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-800">{b.code}</span>
                      <span className="text-slate-600"> · {b.label}</span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(b.debit)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(b.credit)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {fmtMoney(b.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AccountingPaiementsView: React.FC<{ organizationId: string | null }> = ({
  organizationId,
}) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [cashFlow, setCashFlow] = useState<
    Awaited<ReturnType<typeof comptabiliteService.getCashFlowStatement>> | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await comptabiliteService.getCashFlowStatement(organizationId, dateFrom, dateTo);
      setCashFlow(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement paiements');
      setCashFlow(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title="Paiements"
        message="Organisation requise pour afficher les mouvements de trésorerie."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-semibold text-slate-900">Paiements</h3>
        <p className="text-sm text-slate-500 mt-1">
          Synthèse des encaissements/décaissements sur les comptes de trésorerie marqués comme
          « registre de trésorerie » dans le plan comptable.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Du
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Au
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Actualiser
        </button>
      </div>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      {!loading && cashFlow && (
        <div className="space-y-4">
          <div className={`${card} p-6 grid gap-3 sm:grid-cols-3 text-sm`}>
            <div>
              <p className="text-xs uppercase text-slate-500">Trésorerie ouverture</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmtMoney(cashFlow.openingCash)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Trésorerie clôture</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmtMoney(cashFlow.closingCash)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Mouvement période</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmtMoney(cashFlow.periodMovement)}
              </p>
            </div>
          </div>

          <div className={`${card} overflow-hidden`}>
            {cashFlow.details.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                Aucun compte marqué « registre de trésorerie ». Activez l’option sur les comptes
                bancaires / caisses dans le plan comptable pour suivre les paiements.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Compte</th>
                    <th className="px-4 py-2 text-right font-medium">Ouverture</th>
                    <th className="px-4 py-2 text-right font-medium">Clôture</th>
                    <th className="px-4 py-2 text-right font-medium">Mouvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashFlow.details.map((d) => (
                    <tr key={d.code}>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs">{d.code}</span> · {d.label}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmtMoney(d.opening)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmtMoney(d.closing)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmtMoney(d.movement)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AccountingClotureView: React.FC<{ organizationId: string | null }> = ({
  organizationId,
}) => {
  const { user } = useAuth();
  const actorId = resolveActorUserId(user);
  const [closures, setClosures] = useState<AccountingPeriodClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [closureType, setClosureType] =
    useState<AccountingPeriodClosure['closureType']>('month');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr(null);
    try {
      const list = await comptabiliteService.listPeriodClosures(organizationId);
      setClosures(list);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur chargement clôtures');
      setClosures([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!organizationId) {
    return (
      <AccountingRouteEmpty
        title="Clôture"
        message="Organisation requise pour gérer les périodes comptables."
      />
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Clôture des périodes</h3>
          <p className="text-sm text-slate-500 mt-1">
            Verrouille les écritures sur une plage de dates. Les réouvertures sont tracées avec
            l’utilisateur.
          </p>
        </div>
      </header>

      <div className={card + ' p-5'}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end text-sm">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Début période
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Fin période
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Type
            <select
              value={closureType}
              onChange={(e) =>
                setClosureType(e.target.value as AccountingPeriodClosure['closureType'])
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="month">Mensuelle</option>
              <option value="quarter">Trimestrielle</option>
              <option value="semester">Semestrielle</option>
              <option value="year">Annuelle</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await comptabiliteService.closeAccountingPeriod({
                  organizationId,
                  periodStart,
                  periodEnd,
                  closureType,
                  actorId,
                });
                await load();
              })
            }
            className="md:col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Clôture en cours…' : 'Clôturer la période'}
          </button>
        </div>
      </div>

      {err ? <p className="text-sm text-amber-700">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : null}

      <div className={card + ' overflow-hidden'}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Période</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {closures.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">
                  {c.periodStart} → {c.periodEnd}
                </td>
                <td className="px-4 py-2">{c.closureType}</td>
                <td className="px-4 py-2">
                  {c.status === 'closed' ? 'Clôturée' : 'Réouverte'}
                </td>
                <td className="px-4 py-2">
                  {c.status === 'closed' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await comptabiliteService.reopenAccountingPeriod(c.id, actorId);
                          await load();
                        })
                      }
                      className="text-xs font-medium text-coya-primary hover:underline disabled:opacity-60"
                    >
                      Réouvrir
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {closures.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-slate-600"
                >
                  Aucune clôture enregistrée pour cette organisation.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};
