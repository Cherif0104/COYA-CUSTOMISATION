import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrganizationService from '../../services/organizationService';
import * as comptabiliteService from '../../services/comptabiliteService';
import type { FiscalYear } from '../../types';
import {
  AccountingAuxiliaireView,
  AccountingBudgetsView,
  AccountingClotureView,
  AccountingComptaGeneraleView,
  AccountingDashboardView,
  AccountingFacturationView,
  AccountingFiscaliteView,
  AccountingPaiementsView,
  AccountingParametresView,
  AccountingRapportsView,
  AccountingTresorerieView,
} from './AccountingViews';
import AccountingJournalLive from './AccountingJournalLive';
import type { AccountingRouteId } from './accountingRoutes';
import { PillTabs } from '../../ui-runtime';

const STORAGE_ROUTE = 'coya.accounting.shell.route.v2';

type AccountingModuleShellProps = {
  /** Ouvre la vue avancée (legacy) lorsque définie. */
  onOpenLegacy?: () => void;
};

export type { AccountingRouteId } from './accountingRoutes';

const NAV_ITEMS: { id: AccountingRouteId; label: string }[] = [
  { id: 'journal', label: 'Journal' },
  { id: 'ecritures', label: 'Écritures' },
  { id: 'grand_livre', label: 'Grand livre' },
  { id: 'plan_comptable', label: 'Plan comptable' },
  { id: 'balance', label: 'Balance' },
  { id: 'bilan', label: 'Bilan' },
  { id: 'compte_resultat', label: 'Compte de résultat' },
  { id: 'flux', label: 'Tableau de flux' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'cloture', label: 'Clôture' },
  { id: 'banques', label: 'Comptes bancaires' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'rapprochements', label: 'Rapprochements' },
  { id: 'clients', label: 'Clients' },
  { id: 'fournisseurs', label: 'Fournisseurs' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'tva', label: 'TVA' },
  { id: 'impots', label: 'Impôts & Taxes' },
  { id: 'declarations', label: 'Déclarations' },
  { id: 'analytique', label: 'Analytique' },
  { id: 'devise', label: 'Devise' },
  { id: 'centres_couts', label: 'Centre de coûts' },
  { id: 'utilisateurs', label: 'Utilisateurs & Accès' },
];

const ALL_IDS = new Set(NAV_ITEMS.map((i) => i.id));

function readStoredRoute(): AccountingRouteId | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ROUTE);
    if (!raw || !ALL_IDS.has(raw as AccountingRouteId)) return null;
    return raw as AccountingRouteId;
  } catch {
    return null;
  }
}

const AccountingModuleShell: React.FC<AccountingModuleShellProps> = ({ onOpenLegacy }) => {
  const [route, setRouteState] = useState<AccountingRouteId>('journal');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgLabel, setOrgLabel] = useState<string | null>(null);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);

  useEffect(() => {
    const r = readStoredRoute();
    if (r) setRouteState(r);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await OrganizationService.getCurrentUserOrganizationId();
      const org = await OrganizationService.getCurrentUserOrganization();
      if (cancelled) return;
      setOrganizationId(id);
      setOrgLabel(org?.name ?? (id ? `Organisation ${id.slice(0, 8)}…` : null));
      if (id) {
        try {
          const fy = await comptabiliteService.listFiscalYears(id);
          if (!cancelled) setFiscalYears(fy);
        } catch {
          if (!cancelled) setFiscalYears([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRoute = useCallback((next: AccountingRouteId) => {
    setRouteState(next);
    try {
      sessionStorage.setItem(STORAGE_ROUTE, next);
    } catch {
      /* ignore */
    }
  }, []);

  const mainContent = useMemo(() => {
    switch (route) {
      case 'journal':
        return <AccountingJournalLive />;
      case 'ecritures':
        return <AccountingJournalLive hideReportsSection />;
      case 'grand_livre':
      case 'balance':
      case 'bilan':
      case 'compte_resultat':
      case 'flux':
        return <AccountingRapportsView organizationId={organizationId} mode={route} />;
      case 'plan_comptable':
      case 'analytique':
      case 'centres_couts':
        return <AccountingComptaGeneraleView organizationId={organizationId} focus={route} />;
      case 'budgets':
        return <AccountingBudgetsView organizationId={organizationId} />;
      case 'banques':
      case 'caisse':
      case 'rapprochements':
        return <AccountingTresorerieView organizationId={organizationId} focus={route} />;
      case 'facturation':
        return <AccountingFacturationView organizationId={organizationId} />;
      case 'tva':
      case 'impots':
      case 'declarations':
        return <AccountingFiscaliteView organizationId={organizationId} focus={route} />;
      case 'devise':
        return <AccountingDashboardView organizationId={organizationId} />;
      case 'utilisateurs':
        return <AccountingParametresView organizationId={organizationId} />;
      case 'cloture':
        return <AccountingClotureView organizationId={organizationId} />;
      case 'clients':
        return <AccountingAuxiliaireView organizationId={organizationId} variant="clients" />;
      case 'fournisseurs':
        return <AccountingAuxiliaireView organizationId={organizationId} variant="fournisseurs" />;
      case 'paiements':
        return <AccountingPaiementsView organizationId={organizationId} />;
      default:
        return <AccountingJournalLive />;
    }
  }, [route, organizationId]);

  return (
    <div className="p-6 space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Comptabilité</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Journal et plan comptable connectés à Supabase (RLS par organisation). Les autres écrans s’enrichissent au fil des migrations.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end sm:text-right">
          <div className="max-w-md shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <p className="font-medium text-slate-800">{orgLabel ?? 'Organisation'}</p>
            <p className="mt-1 text-xs text-slate-500">
              {organizationId ? `ID : ${organizationId}` : 'Aucune organisation — connectez un compte avec une organisation.'}
            </p>
            {fiscalYears.length > 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Exercices :{' '}
                {fiscalYears
                  .slice(0, 4)
                  .map((fy) => fy.label || `${fy.dateStart} → ${fy.dateEnd}`)
                  .join(' · ')}
                {fiscalYears.length > 4 ? '…' : ''}
              </p>
            ) : organizationId ? (
              <p className="mt-2 text-xs text-amber-700">
                Aucun exercice fiscal en base — créez-en via l’administration ou les migrations comptables.
              </p>
            ) : null}
          </div>
          {onOpenLegacy ? (
            <button
              type="button"
              onClick={onOpenLegacy}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Ouvrir la vue avancée (legacy)
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <PillTabs<AccountingRouteId>
            className="max-w-full"
            items={NAV_ITEMS}
            value={route}
            onChange={setRoute}
          />
        </div>

        <div className="min-w-0 flex-1">{mainContent}</div>
      </div>
    </div>
  );
};

export default AccountingModuleShell;
