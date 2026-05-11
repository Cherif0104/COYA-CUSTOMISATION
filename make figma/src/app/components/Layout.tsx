import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboard, FolderKanban, CalendarDays, Users, Calculator,
  BookOpen, GraduationCap, TrendingUp, Triangle, Package,
  Car, MessageSquare, Ticket, FileText, Wrench,
  ChevronLeft, ChevronRight, Bell, Search, Settings,
  LogOut, User, Menu, X, ChevronDown
} from "lucide-react";

const navItems = [
  { path: "/", label: "Tableau de Bord", icon: LayoutDashboard, color: "text-blue-400" },
  { path: "/projets", label: "Projets", icon: FolderKanban, color: "text-violet-400" },
  { path: "/planification", label: "Planification", icon: CalendarDays, color: "text-cyan-400" },
  { path: "/rh", label: "Ressources Humaines", icon: Users, color: "text-green-400" },
  { path: "/comptabilite", label: "Comptabilité", icon: Calculator, color: "text-yellow-400" },
  { path: "/programme", label: "Programme", icon: BookOpen, color: "text-orange-400" },
  { path: "/formations", label: "Formations", icon: GraduationCap, color: "text-pink-400" },
  { path: "/crm-ventes", label: "CRM & Ventes", icon: TrendingUp, color: "text-emerald-400" },
  { path: "/trinite", label: "Trinité", icon: Triangle, color: "text-red-400" },
  { path: "/logistique", label: "Logistique", icon: Package, color: "text-teal-400" },
  { path: "/parc-auto", label: "Parc Auto", icon: Car, color: "text-amber-400" },
  { path: "/messagerie", label: "Messagerie", icon: MessageSquare, color: "text-sky-400" },
  { path: "/ticket-it", label: "Ticket IT", icon: Ticket, color: "text-rose-400" },
  { path: "/docs-senegel", label: "DOCS SENEGEL", icon: FileText, color: "text-indigo-400" },
  { path: "/moyens-generaux", label: "Moyens Généraux", icon: Wrench, color: "text-lime-400" },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 flex flex-col h-full
          bg-[#0d1b2a] text-white transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <span className="text-white font-bold text-xl tracking-wide">COYA</span>
                <p className="text-white/40 text-[10px] leading-none mt-0.5">ERP Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {!collapsed && (
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 mt-1">Menu Principal</p>
          )}
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                      ${isActive
                        ? "bg-white/15 shadow-sm"
                        : "hover:bg-white/8"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                    title={collapsed ? item.label : ""}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-400" />
                    )}
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? item.color : "text-white/50 group-hover:text-white/80"} transition-colors`} />
                    {!collapsed && (
                      <span className={`text-sm truncate transition-colors ${isActive ? "text-white font-medium" : "text-white/60 group-hover:text-white/90"}`}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">AM</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium leading-none">Admin COYA</p>
                  <p className="text-white/40 text-xs mt-0.5">Administrateur</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/40" />
              </>
            )}
          </button>
          {!collapsed && profileOpen && (
            <div className="mt-1 bg-white/10 rounded-xl overflow-hidden">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
                <User className="w-4 h-4" /> Mon Profil
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm">
                <Settings className="w-4 h-4" /> Paramètres
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors text-red-400 hover:text-red-300 text-sm">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900 font-semibold leading-none">
                {currentPage?.label || "COYA"}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
              />
            </div>
            <button className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Bell className="w-4.5 h-4.5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Settings className="w-4.5 h-4.5 text-gray-600" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AM</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
