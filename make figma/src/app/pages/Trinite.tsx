import { Triangle, Network, GitBranch, Zap, CheckCircle2, AlertTriangle, Settings, Plus, BarChart2 } from "lucide-react";

const entities = [
  {
    id: "ENT-001", name: "COYA Infrastructures", type: "Filiale", status: "Actif",
    activity: "Déploiement infrastructure télécoms et réseau",
    revenue: "145,000,000", employees: 34, projects: 5, color: "bg-blue-500"
  },
  {
    id: "ENT-002", name: "COYA Digital", type: "Filiale", status: "Actif",
    activity: "Solutions logicielles et transformation numérique",
    revenue: "87,000,000", employees: 22, projects: 8, color: "bg-violet-500"
  },
  {
    id: "ENT-003", name: "COYA Academy", type: "Filiale", status: "Actif",
    activity: "Centre de formation professionnelle",
    revenue: "38,000,000", employees: 12, projects: 3, color: "bg-pink-500"
  },
  {
    id: "ENT-004", name: "COYA Energy", type: "JV", status: "En création",
    activity: "Énergies renouvelables et efficacité énergétique",
    revenue: "0", employees: 6, projects: 1, color: "bg-amber-500"
  },
  {
    id: "ENT-005", name: "COYA Logistics", type: "Filiale", status: "Actif",
    activity: "Transport et logistique de fret",
    revenue: "52,000,000", employees: 18, projects: 4, color: "bg-teal-500"
  },
];

const synergies = [
  { from: "COYA Infrastructures", to: "COYA Digital", type: "Technique", description: "Partage d'équipes et de plateformes cloud" },
  { from: "COYA Digital", to: "COYA Academy", type: "Formation", description: "Certification des compétences numériques" },
  { from: "COYA Logistics", to: "COYA Infrastructures", type: "Support", description: "Transport de matériels et équipements lourds" },
  { from: "COYA Energy", to: "COYA Infrastructures", type: "Projet", description: "Alimentation des data centers en énergie verte" },
];

export function Trinite() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Trinité — Structure Groupe</h2>
          <p className="text-gray-500 text-sm">Gestion multi-entités et synergies</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Entité
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Entités du groupe", value: entities.length, icon: Triangle, color: "bg-red-500" },
          { label: "Effectifs total groupe", value: entities.reduce((a, e) => a + e.employees, 0), icon: Network, color: "bg-blue-500" },
          { label: "CA consolidé", value: "322M", icon: BarChart2, color: "bg-emerald-500" },
          { label: "Synergies actives", value: synergies.length, icon: GitBranch, color: "bg-violet-500" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${k.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-gray-900 text-2xl font-bold">{k.value}</p>
              <p className="text-gray-500 text-xs mt-1">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Org chart visual */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-gray-900 mb-6">Organigramme Groupe COYA</h3>
        <div className="flex flex-col items-center">
          {/* Holding */}
          <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a3a5c] text-white rounded-2xl px-8 py-4 text-center shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <p className="font-bold text-lg">COYA HOLDING</p>
            <p className="text-white/60 text-xs">Société mère · Dakar, Sénégal</p>
          </div>

          {/* Connector */}
          <div className="w-0.5 h-8 bg-gray-300" />

          {/* Branches */}
          <div className="flex flex-wrap justify-center gap-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-80px)] h-0.5 bg-gray-200" />
            {entities.map((e, i) => (
              <div key={e.id} className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-gray-300" />
                <div className={`border-2 border-gray-200 rounded-2xl p-4 w-44 hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className={`w-8 h-8 ${e.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-white text-xs font-bold">{e.name.split(" ")[1]?.charAt(0) || "C"}</span>
                  </div>
                  <p className="text-gray-800 text-xs font-medium text-center">{e.name}</p>
                  <p className="text-gray-400 text-[10px] text-center mt-0.5">{e.type}</p>
                  <div className="mt-2 flex justify-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === "Actif" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {e.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {entities.map(e => (
          <div key={e.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${e.color} rounded-xl flex items-center justify-center`}>
                  <Triangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">{e.name}</p>
                  <span className="text-xs text-gray-400">{e.type} · {e.id}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${e.status === "Actif" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{e.status}</span>
            </div>
            <p className="text-gray-500 text-xs mb-4">{e.activity}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-gray-900 font-bold text-sm">{e.employees}</p>
                <p className="text-gray-400 text-[10px]">Employés</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-gray-900 font-bold text-sm">{e.projects}</p>
                <p className="text-gray-400 text-[10px]">Projets</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-gray-900 font-bold text-[11px]">{e.revenue === "0" ? "—" : e.revenue.slice(0, 6) + "M"}</p>
                <p className="text-gray-400 text-[10px]">CA (F)</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Synergies */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-gray-900 mb-4">Synergies Intra-Groupe</h3>
        <div className="space-y-3">
          {synergies.map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <GitBranch className="w-5 h-5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-blue-600 text-sm font-medium">{s.from}</span>
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-violet-600 text-sm font-medium">{s.to}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{s.description}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{s.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
