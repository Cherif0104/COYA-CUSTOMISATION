import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationService from '../../services/organizationService';
import * as comptabiliteService from '../../services/comptabiliteService';
import { useAuth } from '../../contexts/AuthContextSupabase';
import type { AccountingJournal, ChartOfAccount, JournalEntry } from '../../types';
import AccountingJournalCombinedView, {
  type JournalRow,
  type JournalRowStatut,
} from './AccountingJournalCombinedView';

function statusFr(s: string | undefined): JournalRowStatut {
  if (s === 'locked') return 'Verrouillée';
  if (s === 'validated') return 'Validée';
  return 'Brouillon';
}

function entriesToRows(entries: JournalEntry[], journalById: Map<string, AccountingJournal>): JournalRow[] {
  const out: JournalRow[] = [];
  for (const e of entries) {
    const j = journalById.get(e.journalId);
    const journalName = j?.name ?? j?.code ?? '—';
    const dateStr = e.entryDate ? new Date(e.entryDate).toLocaleDateString('fr-FR') : '';
    const statut = statusFr(e.status);
    const displayId = e.id.length > 14 ? `${e.id.slice(0, 10)}…` : e.id;
    const lines = e.lines ?? [];
    if (lines.length === 0) {
      out.push({
        rowKey: `${e.id}-sans-ligne`,
        id: displayId,
        date: dateStr,
        journal: journalName,
        libelle: e.description ?? '—',
        reference: e.reference ?? e.documentNumber ?? '—',
        compte: '—',
        debit: null,
        credit: null,
        statut,
      });
      continue;
    }
    for (const line of lines) {
      const code = line.accountCode ?? '';
      const label = line.accountLabel ?? '';
      const compte = code && label ? `${code} · ${label}` : code || label || '—';
      out.push({
        rowKey: `${e.id}-${line.id}`,
        id: displayId,
        date: dateStr,
        journal: journalName,
        libelle: line.label || e.description || '—',
        reference: e.reference ?? e.documentNumber ?? '—',
        compte,
        debit: line.debit > 0 ? line.debit : null,
        credit: line.credit > 0 ? line.credit : null,
        statut,
      });
    }
  }
  return out;
}

type Props = { hideReportsSection?: boolean };

const AccountingJournalLive: React.FC<Props> = ({ hideReportsSection = false }) => {
  const { user } = useAuth();
  const currentUserId = (user as any)?.id ?? (user as any)?.user_id ?? null;
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [filtreJournalId, setFiltreJournalId] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    OrganizationService.getCurrentUserOrganizationId().then((id) => {
      if (!cancelled) setOrganizationId(id || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadJournals = useCallback(async () => {
    if (!organizationId) return;
    try {
      const list = await comptabiliteService.listAccountingJournals(organizationId);
      setJournals(list);
    } catch {
      setJournals([]);
    }
  }, [organizationId]);

  const loadAccounts = useCallback(async () => {
    if (!organizationId) return;
    try {
      const list = await comptabiliteService.listChartOfAccounts(organizationId);
      setAccounts(list);
    } catch {
      setAccounts([]);
    }
  }, [organizationId]);

  const loadEntries = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const list = await comptabiliteService.listJournalEntriesWithLines({
        organizationId,
        journalId: filtreJournalId || undefined,
        dateFrom,
        dateTo,
        entryLimit: 120,
      });
      setEntries(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors du chargement des écritures';
      setLoadError(msg);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filtreJournalId, dateFrom, dateTo]);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    void loadJournals();
    void loadAccounts();
  }, [organizationId, loadJournals, loadAccounts]);

  useEffect(() => {
    if (!organizationId) return;
    void loadEntries();
  }, [organizationId, loadEntries]);

  const journalById = useMemo(() => new Map(journals.map((j) => [j.id, j])), [journals]);
  const rows = useMemo(() => entriesToRows(entries, journalById), [entries, journalById]);
  const optionsJournal = useMemo(
    () => journals.map((j) => ({ value: j.id, label: `${j.code} · ${j.name}` })),
    [journals],
  );

  const canCreateEntry = organizationId != null && journals.length > 0 && accounts.length > 0;

  if (!organizationId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Aucune organisation associée à votre compte. Les écritures comptables ne peuvent pas être chargées.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showEntryForm && canCreateEntry && (
        <QuickEntryForm
          journals={journals}
          accounts={accounts}
          defaultDate={dateTo}
          submitting={submitting}
          onCancel={() => setShowEntryForm(false)}
          onSubmit={async (payload) => {
            if (!organizationId) return;
            setSubmitting(true);
            try {
              await comptabiliteService.postBalancedJournalEntry(
                {
                  organizationId,
                  journalId: payload.journalId,
                  entryDate: payload.entryDate,
                  reference: payload.reference ?? null,
                  description: payload.description ?? null,
                  documentNumber: payload.documentNumber ?? null,
                  createdById: currentUserId ?? null,
                  status: 'validated',
                },
                [
                  {
                    accountId: payload.debitAccountId,
                    label: payload.description ?? null,
                    debit: payload.amount,
                  },
                  {
                    accountId: payload.creditAccountId,
                    label: payload.description ?? null,
                    credit: payload.amount,
                  },
                ],
              );
              setShowEntryForm(false);
              await loadEntries();
            } catch (e) {
              console.error('Erreur création écriture comptable (journal live):', e);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {!canCreateEntry && showEntryForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Prérequis manquants pour saisir une écriture</p>
          <p>
            Créez au moins un journal et un compte comptable dans la vue Comptabilité avancée avant de poster une
            nouvelle écriture depuis ce journal.
          </p>
        </div>
      )}

      <AccountingJournalCombinedView
        journalRows={rows}
        canCreateEntry={canCreateEntry}
        onClickNewEntry={() => setShowEntryForm(true)}
        loading={loading}
        loadError={loadError}
        dataSourceHint={`Du ${dateFrom} au ${dateTo} · données Supabase`}
        optionsJournal={optionsJournal}
        dateFrom={dateFrom}
        dateTo={dateTo}
        filtreJournalId={filtreJournalId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onFiltreJournalChange={(id) => setFiltreJournalId(id)}
        onActualiser={() => void loadEntries()}
        hideReportsSection={hideReportsSection}
      />
    </div>
  );
};

export default AccountingJournalLive;

type QuickEntryFormProps = {
  journals: AccountingJournal[];
  accounts: ChartOfAccount[];
  defaultDate: string;
  submitting: boolean;
  onSubmit: (payload: {
    journalId: string;
    entryDate: string;
    description?: string;
    reference?: string;
    documentNumber?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
  }) => Promise<void>;
  onCancel: () => void;
};

const QuickEntryForm: React.FC<QuickEntryFormProps> = ({
  journals,
  accounts,
  defaultDate,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [journalId, setJournalId] = useState(journals[0]?.id ?? '');
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [debitAccountId, setDebitAccountId] = useState(accounts[0]?.id ?? '');
  const [creditAccountId, setCreditAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount.replace(',', '.'));
    if (!journalId || !entryDate || !debitAccountId || !creditAccountId || Number.isNaN(value) || value <= 0) {
      return;
    }
    await onSubmit({
      journalId,
      entryDate,
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
      documentNumber: documentNumber.trim() || undefined,
      debitAccountId,
      creditAccountId,
      amount: value,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Nouvelle écriture rapide</h3>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm text-slate-800">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Journal
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={journalId}
              onChange={(e) => setJournalId(e.target.value)}
              required
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.code} · {j.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Date
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            N° pièce
            <input
              type="text"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ex. PJ-2025-001"
            />
          </label>
        </div>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Référence (optionnelle)"
        />
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Compte au débit
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={debitAccountId}
              onChange={(e) => setDebitAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Compte au crédit
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={creditAccountId}
              onChange={(e) => setCreditAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Montant (débit = crédit)
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer l&apos;écriture
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};
