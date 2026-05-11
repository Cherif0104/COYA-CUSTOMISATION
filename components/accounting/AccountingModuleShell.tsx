import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgePercent,
  BookOpen,
  Building2,
  Calculator,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  LineChart,
  Link2,
  List,
  Lock,
  Menu,
  PieChart,
  PiggyBank,
  Receipt,
  Scale,
  ScrollText,
  Target,
  Truck,
  UserCog,
  Users,
  Wallet,
  Moon,
  Sun,
} from 'lucide-react';
import {
  AccountingBudgetsView,
  AccountingComptaGeneraleView,
  AccountingDashboardView,
  AccountingFacturationView,
  AccountingFiscaliteView,
  AccountingParametresView,
  AccountingRapportsView,
  AccountingTresorerieView,
} from './AccountingViews';
import AccountingJournalLive from './AccountingJournalLive';

const STORAGE_ROUTE = 'coya.accounting.shell.route.v2';
const STORAGE_DARK = 'coya.accounting.shell.dark.v1';

export type AccountingRouteId =
  | 'journal'
  | 'ecritures'
  | 'grand_livre'
  | 'plan_comptable'
  | 'balance'
  | 'bilan'
  | 'compte_resultat'
  | 'flux'
  | 'budgets'
  | 'cloture'
  | 'banques'
  | 'caisse'
  | 'rapprochements'
  | 'clients'
  | 'fournisseurs'
  | 'facturation'
  | 'paiements'
  | 'tva'
  | 'impots'
  | 'declarations'
  | 'analytique'
  | 'devise'
  | 'centres_couts'
  | 'utilisateurs';

type NavItem = { id: AccountingRouteId; label: string; icon: React.ElementType };

type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'TABLEAU DE BORD',
    items: [
      { id: 'journal', label: 'Journal', icon: ScrollText },
      { id: 'ecritures', label: 'Écritures', icon: FileText },
      { id: 'grand_livre', label: 'Grand livre', icon: BookOpen },
      { id: 'plan_comptable', label: 'Plan comptable', icon: List },
      { id: 'balance', label: 'Balance', icon: Scale },
      { id: 'bilan', label: 'Bilan', icon: Building2 },
      { id: 'compte_resultat', label: 'Compte de résultat', icon: LineChart },
      { id: 'flux', label: 'Tableau de flux', icon: Activity },
      { id: 'budgets', label: 'Budgets', icon: PiggyBank },
      { id: 'cloture', label: 'Clôture', icon: Lock },
    ],
  },
  {
    title: 'TRÉSORERIE',
    items: [
      { id: 'banques', label: 'Comptes bancaires', icon: Landmark },
      { id: 'caisse', label: 'Caisse', icon: Wallet },
      { id: 'rapprochements', label: 'Rapprochements', icon: Link2 },
    ],
  },
  {
    title: 'CLIENTS & FOURNISSEURS',
    items: [
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
      { id: 'facturation', label: 'Facturation', icon: Receipt },
      { id: 'paiements', label: 'Paiements', icon: CreditCard },
    ],
  },
  {
    title: 'FISCALITÉ',
    items: [
      { id: 'tva', label: 'TVA', icon: BadgePercent },
      { id: 'impots', label: 'Impôts & Taxes', icon: PieChart },
      { id: 'declarations', label: 'Déclarations', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'PARAMÈTRES',
    items: [
      { id: 'analytique', label: 'Analytique', icon: PieChart },
      { id: 'devise', label: 'Devise', icon: Coins },
      { id: 'centres_couts', label: 'Centre de coûts', icon: Target },
      { id: 'utilisateurs', label: 'Utilisateurs & Accès', icon: UserCog },
    ],
  },
];

const ALL_IDS = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)));

function readStoredRoute(): AccountingRouteId | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ROUTE);
    if (!raw || !ALL_IDS.has(raw as AccountingRouteId)) return null;
    return raw as AccountingRouteId;
  } catch {
    return null;
  }
}

function readStoredDark(): boolean | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_DARK);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}

const StubPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
    <p className="text-base font-semibold text-slate-800 dark:text-zinc-100">{title}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
      Écran à connecter — priorité donnée au journal et aux listes d’écritures (données live).
    </p>
  </div>
);

/** Panneau sombre pour les vues `AccountingViews` conçues pour fond foncé. */
const DarkPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[320px] rounded-2xl border border-slate-700/40 bg-[#0c0c0f] p-4 shadow-inner md:p-6">{children}</div>
);

const AccountingModuleShell: React.FC = () => {
  const [route, setRouteState] = useState<AccountingRouteId>('journal');
  const [mobileNav, setMobileNav] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const r = readStoredRoute();
    if (r) setRouteState(r);
    const d = readStoredDark();
    if (d !== null) setDarkMode(d);
  }, []);

  const setRoute = useCallback((next: AccountingRouteId) => {
    setRouteState(next);
    try {
      sessionStorage.setItem(STORAGE_ROUTE, next);
    } catch {
      /* ignore */
    }
    setMobileNav(false);
  }, []);

  const toggleDark = useCallback(() => {
    setDarkMode((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(STORAGE_DARK, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const activeLabel = useMemo(() => {
    for (const g of NAV_GROUPS) {
      const f = g.items.find((i) => i.id === route);
      if (f) return f.label;
    }
    return '';
  }, [route]);

  const wrapIfLight = useCallback(
    (node: React.ReactNode) => {
      if (darkMode) return node;
      return <DarkPanel>{node}</DarkPanel>;
    },
    [darkMode],
  );

  const mainContent = useMemo(() => {
    switch (route) {
      case 'journal':
        return <AccountingJournalLive />;
      case 'ecritures':
        return <AccountingJournalLive hideReportsSection />;
      case 'grand_livre':
      case 'balance':
        return wrapIfLight(<AccountingRapportsView />);
      case 'bilan':
      case 'compte_resultat':
      case 'flux':
        return wrapIfLight(<AccountingRapportsView />);
      case 'plan_comptable':
      case 'analytique':
      case 'centres_couts':
        return wrapIfLight(<AccountingComptaGeneraleView />);
      case 'budgets':
        return wrapIfLight(<AccountingBudgetsView />);
      case 'banques':
      case 'caisse':
      case 'rapprochements':
        return wrapIfLight(<AccountingTresorerieView />);
      case 'facturation':
        return wrapIfLight(<AccountingFacturationView />);
      case 'tva':
      case 'impots':
      case 'declarations':
        return wrapIfLight(<AccountingFiscaliteView />);
      case 'devise':
        return wrapIfLight(<AccountingDashboardView />);
      case 'utilisateurs':
        return wrapIfLight(<AccountingParametresView />);
      case 'cloture':
        return <StubPage title="Clôture" />;
      case 'clients':
        return <StubPage title="Clients" />;
      case 'fournisseurs':
        return <StubPage title="Fournisseurs" />;
      case 'paiements':
        return <StubPage title="Paiements" />;
      default:
        return <AccountingJournalLive />;
    }
  }, [route, wrapIfLight]);

  const shellRoot = darkMode
    ? 'flex min-h-[calc(100dvh-7rem)] flex-col bg-[#070708] text-[#f4f4f5] md:flex-row'
    : 'flex min-h-[calc(100dvh-7rem)] flex-col bg-slate-100 text-slate-900 md:flex-row';

  const asideClass = darkMode
    ? 'relative z-20 hidden w-[276px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0a1628] shadow-[8px_0_32px_rgba(0,0,0,0.45)] md:flex'
    : 'relative z-20 hidden w-[276px] shrink-0 flex-col border-r border-[#1e3a5f] bg-[#0c2744] text-slate-100 shadow-[8px_0_32px_rgba(15,23,42,0.25)] md:flex';

  const headerClass = darkMode
    ? 'sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-[#070708]/92 px-4 py-3 backdrop-blur-md md:px-6'
    : 'sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:px-6';

  const mainScroll = darkMode ? 'bg-[#070708]' : 'bg-slate-100';

  const navBtn = (active: boolean) =>
    darkMode
      ? `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
          active
            ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35)]'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
        }`
      : `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
          active
            ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
            : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
        }`;

  const NavBlock = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navigation module comptabilité">
      <div className="mb-2 flex items-center gap-2 px-2 lg:hidden">
        <Calculator className="h-8 w-8 shrink-0 text-cyan-300" aria-hidden />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">COYA</p>
          <p className="text-sm font-semibold text-white">Comptabilité</p>
        </div>
      </div>
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-3 last:mb-0">
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoute(item.id)}
                  className={navBtn(active)}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-cyan-300' : 'text-slate-500 dark:text-slate-500'}`} aria-hidden />
                  <span className="truncate font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="mt-auto border-t border-white/10 pt-3 dark:border-white/10">
        <button
          type="button"
          onClick={toggleDark}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {darkMode ? <Sun className="h-4 w-4 shrink-0 text-amber-300" /> : <Moon className="h-4 w-4 shrink-0 text-slate-300" />}
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>
    </nav>
  );

  return (
    <div className={shellRoot}>
      <aside className={asideClass} aria-label="Navigation comptabilité COYA">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5 dark:border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-900/35">
            <Calculator className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">ERP</p>
            <p className="truncate text-sm font-semibold text-white">Comptabilité</p>
          </div>
        </div>
        {NavBlock}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          mobileNav ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!mobileNav}
        onClick={() => setMobileNav(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(288px,88vw)] max-w-full flex-col border-r border-[#1e3a5f] bg-[#0c2744] text-slate-100 transition-transform duration-200 dark:border-white/[0.07] dark:bg-[#0a1628] md:hidden ${
          mobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex max-h-[100dvh] flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto">{NavBlock}</div>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col ${mainScroll}`}>
        <header className={headerClass}>
          <button
            type="button"
            className={
              darkMode
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#f4f4f5] md:hidden'
                : 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 md:hidden'
            }
            onClick={() => setMobileNav(true)}
            aria-label="Ouvrir le menu comptabilité"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
            <div
              className={
                darkMode
                  ? 'flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2'
                  : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm'
              }
            >
              <Building2 className="h-4 w-4 shrink-0 text-cyan-500 dark:text-cyan-400" aria-hidden />
              <label className="flex flex-col">
                <span
                  className={
                    darkMode
                      ? 'text-[9px] font-semibold uppercase tracking-wide text-zinc-500'
                      : 'text-[9px] font-semibold uppercase tracking-wide text-slate-500'
                  }
                >
                  Organisation
                </span>
                <select
                  aria-label="Organisation (sélecteur stub)"
                  className={
                    darkMode
                      ? 'cursor-pointer bg-transparent text-xs font-semibold text-[#f4f4f5] outline-none md:text-sm'
                      : 'cursor-pointer bg-transparent text-xs font-semibold text-slate-900 outline-none md:text-sm'
                  }
                  defaultValue="a"
                >
                  <option value="a">COYA Holding</option>
                  <option value="b">Filiale AO</option>
                  <option value="c">Filiale EU</option>
                </select>
              </label>
            </div>
            <div
              className={
                darkMode
                  ? 'flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2'
                  : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm'
              }
            >
              <Coins className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" aria-hidden />
              <label className="flex flex-col">
                <span
                  className={
                    darkMode
                      ? 'text-[9px] font-semibold uppercase tracking-wide text-zinc-500'
                      : 'text-[9px] font-semibold uppercase tracking-wide text-slate-500'
                  }
                >
                  Exercice
                </span>
                <select
                  aria-label="Exercice (stub)"
                  className={
                    darkMode
                      ? 'cursor-pointer bg-transparent text-xs font-semibold text-[#f4f4f5] outline-none md:text-sm'
                      : 'cursor-pointer bg-transparent text-xs font-semibold text-slate-900 outline-none md:text-sm'
                  }
                  defaultValue="2026"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </label>
            </div>
            <div
              className={
                darkMode
                  ? 'flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2'
                  : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm'
              }
            >
              <FileText className="h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400" aria-hidden />
              <label className="flex flex-col">
                <span
                  className={
                    darkMode
                      ? 'text-[9px] font-semibold uppercase tracking-wide text-zinc-500'
                      : 'text-[9px] font-semibold uppercase tracking-wide text-slate-500'
                  }
                >
                  Période
                </span>
                <select
                  aria-label="Période (stub)"
                  className={
                    darkMode
                      ? 'cursor-pointer bg-transparent text-xs font-semibold text-[#f4f4f5] outline-none md:text-sm'
                      : 'cursor-pointer bg-transparent text-xs font-semibold text-slate-900 outline-none md:text-sm'
                  }
                  defaultValue="m"
                >
                  <option value="m">Mois en cours</option>
                  <option value="t">Trimestre</option>
                  <option value="y">Exercice</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                darkMode
                  ? 'rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300'
                  : 'rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800'
              }
            >
              {activeLabel}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-8">{mainContent}</div>
      </div>
    </div>
  );
};

export default AccountingModuleShell;
