import {
  Invoice,
  Expense,
  PaySlipWithLines,
  Budget,
  WorkItemCanonicalRef,
} from '../types';
import {
  postBalancedJournalEntry,
  type AccountingPostingLineInput,
  getOrganizationAccountingSettings,
  listChartOfAccounts,
  listAccountingJournals,
} from './comptabiliteService';
import { supabase } from './supabaseService';

/** Événements comptables transverses (contrat stable entre modules). */
export type AccountingEvent =
  | {
      type: 'accounting.invoice_issued';
      organizationId: string;
      invoice: Invoice;
    }
  | {
      type: 'accounting.expense_recorded';
      organizationId: string;
      expense: Expense;
    }
  | {
      type: 'accounting.payroll_validated';
      organizationId: string;
      paySlip: PaySlipWithLines;
    }
  | {
      type: 'accounting.budget_committed';
      organizationId: string;
      budget: Budget;
    }
  | {
      /**
       * Entrée générique déjà mappée vers des comptes OHADA.
       * Utilisable par des modules métiers sans créer de type dédié.
       */
      type: 'accounting.generic_posting';
      organizationId: string;
      workItemRef?: WorkItemCanonicalRef | null;
      payload: {
        label: string;
        amount: number;
        currencyCode?: string;
        entryDate: string;
        debitAccountId: string;
        creditAccountId: string;
        metadata?: Record<string, unknown>;
      };
    };

export type AccountingEventHandler = (event: AccountingEvent) => void | Promise<void>;

const listeners = new Set<AccountingEventHandler>();

/** Souscription in-process (front ou fonctions edge) – pas de garantie d’acheminement. */
export function subscribeAccountingEvents(handler: AccountingEventHandler): () => void {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}

async function journalEntryExistsForInvoice(invoiceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('journal_entry_lines')
    .select('id')
    .eq('metadata->>source', 'invoice')
    .eq('metadata->>invoice_id', invoiceId)
    .limit(1);
  if (error) {
    console.warn('[AccountingEvents] journalEntryExistsForInvoice failed', error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

async function journalEntryExistsForExpense(expenseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('journal_entry_lines')
    .select('id')
    .eq('metadata->>source', 'expense')
    .eq('metadata->>expense_id', expenseId)
    .limit(1);
  if (error) {
    console.warn('[AccountingEvents] journalEntryExistsForExpense failed', error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

async function postInvoiceToAccounting(organizationId: string, invoice: Invoice): Promise<void> {
  if (!invoice.amount || invoice.amount <= 0) {
    console.warn('[AccountingEvents] invoice bridge skipped (amount <= 0)', { invoiceId: invoice.id });
    return;
  }

  const alreadyPosted = await journalEntryExistsForInvoice(invoice.id);
  if (alreadyPosted) {
    console.debug('[AccountingEvents] invoice bridge idempotent skip', { invoiceId: invoice.id });
    return;
  }

  const settings = await getOrganizationAccountingSettings(organizationId);
  const bridge = settings?.bridgeConfig;

  const [accounts, journals] = await Promise.all([
    listChartOfAccounts(organizationId),
    listAccountingJournals(organizationId),
  ]);

  const normaliseCode = (code: string) => code.replace(/\s/g, '');

  let receivableAccountId = bridge?.invoiceReceivableAccountId ?? null;
  let revenueAccountId = bridge?.invoiceRevenueAccountId ?? null;
  let vatAccountId = bridge?.invoiceVatAccountId ?? null;
  let journalId = bridge?.invoiceJournalId ?? null;

  if (!receivableAccountId) {
    const candidate = accounts.find((a) => a.accountType === 'asset' && /^41/.test(normaliseCode(a.code)));
    receivableAccountId = candidate?.id ?? null;
  }
  if (!revenueAccountId) {
    const candidate = accounts.find((a) => a.accountType === 'income' && /^7/.test(normaliseCode(a.code)));
    revenueAccountId = candidate?.id ?? null;
  }
  if (!vatAccountId) {
    const candidate = accounts.find(
      (a) => a.accountType === 'liability' && /^44/.test(normaliseCode(a.code)),
    );
    vatAccountId = candidate?.id ?? null;
  }
  if (!journalId) {
    const salesJournal = journals.find((j) => j.journalType === 'sales') ?? journals[0];
    journalId = salesJournal?.id ?? null;
  }

  if (!receivableAccountId || !revenueAccountId || !journalId) {
    console.warn('[AccountingEvents] invoice bridge disabled (missing mapping)', {
      organizationId,
      invoiceId: invoice.id,
      hasReceivable: !!receivableAccountId,
      hasRevenue: !!revenueAccountId,
      hasJournal: !!journalId,
    });
    return;
  }

  const entryDate = invoice.transactionDate || invoice.dueDate;
  if (!entryDate) {
    console.warn('[AccountingEvents] invoice bridge skipped (no date)', {
      invoiceId: invoice.id,
    });
    return;
  }

  const description = `Facture ${invoice.invoiceNumber || invoice.id} – ${invoice.clientName}`;
  const baseMetadata = {
    source: 'invoice',
    invoice_id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    client_name: invoice.clientName,
    currency_code: invoice.currencyCode,
    status: invoice.status,
  } as Record<string, unknown>;

  const baseAmount = Number(invoice.amount || 0);
  const vatAmount = Number(invoice.vatAmount ?? 0) || 0;
  const totalAmount = invoice.totalAmount != null ? Number(invoice.totalAmount) || 0 : 0;

  let receivableAmount = baseAmount;
  let revenueAmount = baseAmount;
  let vatLineAmount = 0;

  if (vatAmount > 0 && vatAccountId) {
    if (totalAmount > 0 && totalAmount > vatAmount) {
      receivableAmount = totalAmount;
      revenueAmount = totalAmount - vatAmount;
    } else {
      receivableAmount = baseAmount + vatAmount;
      revenueAmount = baseAmount;
    }
    vatLineAmount = vatAmount;
  } else if (vatAmount > 0 && !vatAccountId) {
    console.warn(
      '[AccountingEvents] invoice bridge VAT amount present mais aucun compte TVA trouvé, écriture 2 lignes utilisée.',
      { organizationId, invoiceId: invoice.id },
    );
  }

  // Garde‑fou : si les montants dérivés semblent incohérents, repasse sur le schéma 2 lignes.
  if (
    receivableAmount <= 0 ||
    revenueAmount <= 0 ||
    receivableAmount < revenueAmount ||
    (vatLineAmount > 0 && Math.abs(receivableAmount - (revenueAmount + vatLineAmount)) > 0.01)
  ) {
    receivableAmount = baseAmount;
    revenueAmount = baseAmount;
    vatLineAmount = 0;
  }

  const lines: AccountingPostingLineInput[] = [
    {
      accountId: receivableAccountId,
      label: description,
      debit: receivableAmount,
      metadata: { ...baseMetadata, side: 'debit' },
    },
    {
      accountId: revenueAccountId,
      label: description,
      credit: revenueAmount,
      metadata: { ...baseMetadata, side: vatLineAmount > 0 ? 'credit_revenue' : 'credit' },
    },
  ];

  if (vatLineAmount > 0 && vatAccountId) {
    lines.push({
      accountId: vatAccountId,
      label: `${description} – TVA`,
      credit: vatLineAmount,
      metadata: { ...baseMetadata, side: 'credit_vat' },
    });
  }

  await postBalancedJournalEntry(
    {
      organizationId,
      journalId,
      entryDate,
      description,
      reference: invoice.invoiceNumber ?? undefined,
      documentNumber: invoice.invoiceNumber ?? undefined,
      status: 'validated',
    },
    lines,
  );
}

async function postExpenseToAccounting(organizationId: string, expense: Expense): Promise<void> {
  if (!expense.amount || expense.amount <= 0) {
    console.warn('[AccountingEvents] expense bridge skipped (amount <= 0)', { expenseId: expense.id });
    return;
  }

  const alreadyPosted = await journalEntryExistsForExpense(expense.id);
  if (alreadyPosted) {
    console.debug('[AccountingEvents] expense bridge idempotent skip', { expenseId: expense.id });
    return;
  }

  const [accounts, journals] = await Promise.all([
    listChartOfAccounts(organizationId),
    listAccountingJournals(organizationId),
  ]);

  const normaliseCode = (code: string) => code.replace(/\s/g, '');

  let expenseAccountId: string | null = null;
  let treasuryAccountId: string | null = null;
  let journalId: string | null = null;

  const expenseCandidate =
    accounts.find((a) => a.accountType === 'expense' && /^6/.test(normaliseCode(a.code))) ??
    accounts.find((a) => a.accountType === 'expense');
  expenseAccountId = expenseCandidate?.id ?? null;

  const treasuryCandidate =
    accounts.find((a) => a.isCashFlowRegister) ??
    accounts.find((a) => /^5[1-3]/.test(normaliseCode(a.code)) || /^57/.test(normaliseCode(a.code)));
  treasuryAccountId = treasuryCandidate?.id ?? null;

  const purchaseJournal =
    journals.find((j) => j.journalType === 'purchase') ??
    journals.find((j) => j.journalType === 'cash' || j.journalType === 'bank') ??
    journals[0];
  journalId = purchaseJournal?.id ?? null;

  if (!expenseAccountId || !treasuryAccountId || !journalId) {
    console.warn('[AccountingEvents] expense bridge disabled (missing mapping)', {
      organizationId,
      expenseId: expense.id,
      hasExpenseAccount: !!expenseAccountId,
      hasTreasuryAccount: !!treasuryAccountId,
      hasJournal: !!journalId,
    });
    return;
  }

  const entryDate = expense.transactionDate || expense.date;
  if (!entryDate) {
    console.warn('[AccountingEvents] expense bridge skipped (no date)', {
      expenseId: expense.id,
    });
    return;
  }

  const description = `Dépense ${expense.description || expense.category || expense.id}`;
  const baseMetadata = {
    source: 'expense',
    expense_id: expense.id,
    category: expense.category,
    currency_code: expense.currencyCode,
    status: expense.status,
  } as Record<string, unknown>;

  const amount = Number(expense.amount || 0);
  const lines: AccountingPostingLineInput[] = [
    {
      accountId: expenseAccountId,
      label: description,
      debit: amount,
      metadata: { ...baseMetadata, side: 'debit' },
    },
    {
      accountId: treasuryAccountId,
      label: description,
      credit: amount,
      metadata: { ...baseMetadata, side: 'credit' },
    },
  ];

  await postBalancedJournalEntry(
    {
      organizationId,
      journalId,
      entryDate,
      description,
      reference: undefined,
      documentNumber: undefined,
      status: 'validated',
    },
    lines,
  );
}

export async function publishAccountingEvent(event: AccountingEvent): Promise<void> {
  const snapshot = Array.from(listeners);
  for (const handler of snapshot) {
    // Chaque handler est isolé pour éviter qu’une erreur en bloque d’autres
    try {
      // eslint-disable-next-line no-await-in-loop
      await handler(event);
    } catch (err) {
      // Journalisation minimale côté console ; les implémentations peuvent brancher un logger plus riche si besoin.
      console.error('[AccountingEvents] Handler error for event', event.type, err);
    }
  }
}

/**
 * Enregistre un handler par défaut :
 * - Log structuré pour toutes les familles d’événements.
 * - Pour `generic_posting`, appelle directement la façade comptable avec un schéma simple.
 *
 * Cette fonction est idempotente : elle peut être appelée plusieurs fois sans dupliquer les handlers.
 */
export function registerDefaultAccountingHandlers() {
  const defaultHandler: AccountingEventHandler = async (event) => {
    if (event.type === 'accounting.invoice_issued') {
      await postInvoiceToAccounting(event.organizationId, event.invoice);
      return;
    }

    if (event.type === 'accounting.expense_recorded') {
      await postExpenseToAccounting(event.organizationId, event.expense);
      return;
    }

    if (event.type === 'accounting.generic_posting') {
      const { organizationId, payload } = event;
      const amount = Number(payload.amount || 0);
      if (!amount || amount <= 0) {
        console.warn('[AccountingEvents] generic_posting ignoré (amount <= 0)', payload);
        return;
      }
      const lines: AccountingPostingLineInput[] = [
        {
          accountId: payload.debitAccountId,
          label: payload.label,
          debit: amount,
        },
        {
          accountId: payload.creditAccountId,
          label: payload.label,
          credit: amount,
        },
      ];
      await postBalancedJournalEntry(
        {
          organizationId,
          journalId: payload.metadata?.journalId as string | undefined || (payload.metadata?.journalCode as string | undefined) || '',
          entryDate: payload.entryDate,
          description: payload.label,
          reference: (payload.metadata?.reference as string | undefined) ?? null,
          documentNumber: (payload.metadata?.documentNumber as string | undefined) ?? null,
          createdById: (payload.metadata?.createdById as string | undefined) ?? null,
          status: 'validated',
        },
        lines,
      );
      return;
    }

    // Pour les autres événements, on se limite à un log structuré : le branchement aux comptes
    // (mapping produits/charges, taxes, etc.) est géré dans des handlers dédiés côté backend.
    console.debug('[AccountingEvents] Event reçu (stub)', {
      type: event.type,
      organizationId: event.organizationId,
    });
  };

  // Empêche l’ajout multiple du même handler (comparaison par référence).
  if (!Array.from(listeners).includes(defaultHandler)) {
    listeners.add(defaultHandler);
  }
}

