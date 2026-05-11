import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  FolderKanban, Users, TrendingUp, DollarSign, ArrowUpRight,
  ArrowDownRight, CheckCircle2, Clock, AlertTriangle, Activity,
  Package, Car, Ticket, GraduationCap
} from "lucide-react";

const revenueData = [
  { month: "Jan", revenus: 12400000, depenses: 8200000 },
  { month: "Fév", revenus: 14800000, depenses: 9100000 },
  { month: "Mar", revenus: 13200000, depenses: 7800000 },
  { month: "Avr", revenus: 16500000, depenses: 10200000 },
  { month: "Mai", revenus: 18200000, depenses: 11500000 },
  { month: "Jun", revenus: 15800000, depenses: 9800000 },
  { month: "Jul", revenus: 19400000, depenses: 12100000 },
  { month: "Aoû", revenus: 21000000, depenses: 13400000 },
  { month: "Sep", revenus: 17600000, depenses: 10900000 },
  { month: "Oct", revenus: 22300000, depenses: 14200000 },
  { month: "Nov", revenus: 20100000, depenses: 12800000 },
  { month: "Déc", revenus: 24500000, depenses: 15600000 },
];

const projectStatus = [
  { name: "En cours", value: 14, color: "#3b82f6" },
  { name: "Terminés", value: 28, color: "#10b981" },
  { name: "En attente", value: 7, color: "#f59e0b" },
  { name: "Bloqués", value: 3, color: "#ef4444" },
];

const recentActivities = [
  { id: 1, action: "Nouveau contrat signé", module: "CRM", time: "Il y a 12 min", icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
  { id: 2, action: "Projet SENATEL mis à jour", module: "Projets", time: "Il y a 35 min", icon: FolderKanban, color: "bg-violet-100 text-violet-600" },
  { id: 3, action: "Ticket #TK-0042 résolu", module: "IT", time: "Il y a 1h", icon: Ticket, color: "bg-rose-100 text-rose-600" },
  { id: 4, action: "Formation RH planifiée", module: "Formations", time: "Il y a 2h", icon: GraduationCap, color: "bg-pink-100 text-pink-600" },
  { id: 5, action: "Livraison validée", module: "Logistique", time: "Il y a 3h", icon: Package, color: "bg-teal-100 text-teal-600" },
  { id: 6, action: "Véhicule VH-007 sorti", module: "Parc Auto", time: "Il y a 4h", icon: Car, color: "bg-amber-100 text-amber-600" },
];

const kpis = [
  {
    label: "Chiffre d'affaires", value: "247.5M", unit: "FCFA", change: "+12.4%", up: true,
    icon: DollarSign, color: "bg-blue-500", light: "bg-blue-50 text-blue-600"
  },
  {
    label: "Projets actifs", value: "14", unit: "projets", change: "+3", up: true,
    icon: FolderKanban, color: "bg-violet-500", light: "bg-violet-50 text-violet-600"
  },
  {
    label: "Collaborateurs", value: "87", unit: "employés", change: "+5", up: true,
    icon: Users, color: "bg-green-500", light: "bg-green-50 text-green-600"
  },
  {
    label: "Tâches en retard", value: "6", unit: "tâches", change: "-2", up: false,
    icon: AlertTriangle, color: "bg-amber-500", light: "bg-amber-50 text-amber-600"
  },
];

const upcomingTasks = [
  { title: "Réunion direction COYA", date: "Aujourd'hui 14h00", priority: "haute", status: "bg-red-100 text-red-600" },
  { title: "Revue budget Q2", date: "Demain 09h30", priority: "haute", status: "bg-red-100 text-red-600" },
  { title: "Formation équipe commerciale", date: "07 Mai 10h00", priority: "moyenne", status: "bg-amber-100 text-amber-600" },
  { title: "Audit logistique", date: "08 Mai 08h00", priority: "normale", status: "bg-green-100 text-green-600" },
  { title: "Clôture projet SENATEL Phase 1", date: "10 Mai 17h00", priority: "haute", status: "bg-red-100 text-red-600" },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a3a5c] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-48 h-48 rounded-full border-[40px] border-white absolute -top-10 -right-10" />
          <div className="w-32 h-32 rounded-full border-[25px] border-white absolute bottom-0 right-20" />
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-sm mb-1">Bienvenue sur COYA ERP</p>
          <h1 className="text-white mb-3">Bonjour, Admin COYA 👋</h1>
          <p className="text-white/70 text-sm max-w-lg">
            Tableau de bord consolidé — {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-white/60 text-xs">Tickets ouverts</p>
              <p className="text-white font-semibold">12</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-white/60 text-xs">Messages non lus</p>
              <p className="text-white font-semibold">5</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-white/60 text-xs">Réunions aujourd'hui</p>
              <p className="text-white font-semibold">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${kpi.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
              <p className="text-gray-900 text-2xl font-bold leading-none">{kpi.value}</p>
              <p className="text-gray-400 text-xs mt-1">{kpi.unit}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900">Revenus vs Dépenses</h3>
              <p className="text-gray-400 text-xs mt-0.5">Évolution annuelle 2025 (FCFA)</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">2025</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => [`${(v / 1000000).toFixed(1)}M FCFA`]} />
              <Area type="monotone" dataKey="revenus" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" name="Revenus" />
              <Area type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={2} fill="url(#dep)" name="Dépenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h3 className="text-gray-900">Statut des Projets</h3>
            <p className="text-gray-400 text-xs mt-0.5">Répartition globale</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={projectStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {projectStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {projectStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 text-xs">{item.name}</span>
                </div>
                <span className="text-gray-900 text-xs font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900">Activités Récentes</h3>
              <p className="text-gray-400 text-xs mt-0.5">Dernières actions sur la plateforme</p>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentActivities.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm truncate">{a.action}</p>
                    <p className="text-gray-400 text-xs">{a.module} · {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900">Tâches & Échéances</h3>
              <p className="text-gray-400 text-xs mt-0.5">Prochaines actions importantes</p>
            </div>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm truncate">{task.title}</p>
                  <p className="text-gray-400 text-xs">{task.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${task.status}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
