import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationService from '../../services/organizationService';
import * as comptabiliteService from '../../services/comptabiliteService';
import type { AccountingJournal, JournalEntry } from '../../types';
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [journals, setJournals] = useState<AccountingJournal[]>([]);
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
  }, [organizationId, loadJournals]);

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

  if (!organizationId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Aucune organisation associée à votre compte. Les écritures comptables ne peuvent pas être chargées.
      </div>
    );
  }

  return (
    <AccountingJournalCombinedView
      journalRows={rows}
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
  );
};

export default AccountingJournalLive;
