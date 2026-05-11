import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Calendar, Users, Clock, CheckCircle2, AlertCircle, Pause, Play, ChevronDown } from "lucide-react";

const projects = [
  {
    id: "PRJ-001", name: "Infrastructure Télécom SENATEL", client: "SENATEL SA",
    manager: "Ibrahima Diallo", team: 8, progress: 72, status: "En cours",
    start: "01/01/2025", end: "30/06/2025", budget: "85,000,000", spent: "61,200,000",
    priority: "Haute", category: "Infrastructure", color: "bg-blue-500"
  },
  {
    id: "PRJ-002", name: "Système de Gestion Portuaire", client: "Port Autonome de Dakar",
    manager: "Fatou Diop", team: 12, progress: 45, status: "En cours",
    start: "15/02/2025", end: "31/12/2025", budget: "120,000,000", spent: "54,000,000",
    priority: "Haute", category: "Logiciel", color: "bg-violet-500"
  },
  {
    id: "PRJ-003", name: "Formation Numérique OFPT", client: "OFPT Sénégal",
    manager: "Moussa Ndiaye", team: 5, progress: 90, status: "En cours",
    start: "01/03/2025", end: "31/05/2025", budget: "25,000,000", spent: "22,500,000",
    priority: "Normale", category: "Formation", color: "bg-green-500"
  },
  {
    id: "PRJ-004", name: "Audit Financier Groupe COYA", client: "Interne",
    manager: "Aïda Sall", team: 4, progress: 100, status: "Terminé",
    start: "01/11/2024", end: "31/01/2025", budget: "15,000,000", spent: "14,800,000",
    priority: "Haute", category: "Audit", color: "bg-emerald-500"
  },
  {
    id: "PRJ-005", name: "Réseau Fibre Optique Saint-Louis", client: "Ministère des Télécoms",
    manager: "Cheikh Fall", team: 15, progress: 28, status: "En cours",
    start: "01/04/2025", end: "28/02/2026", budget: "200,000,000", spent: "56,000,000",
    priority: "Haute", category: "Infrastructure", color: "bg-cyan-500"
  },
  {
    id: "PRJ-006", name: "Application Mobile Banque Atlantique", client: "Banque Atlantique",
    manager: "Rokhaya Gueye", team: 6, progress: 0, status: "En attente",
    start: "01/06/2025", end: "30/11/2025", budget: "45,000,000", spent: "0",
    priority: "Moyenne", category: "Logiciel", color: "bg-amber-500"
  },
  {
    id: "PRJ-007", name: "Centrale Solaire Thiès", client: "SENELEC",
    manager: "Omar Badji", team: 20, progress: 15, status: "Bloqué",
    start: "01/03/2025", end: "31/12/2025", budget: "350,000,000", spent: "52,500,000",
    priority: "Critique", category: "Énergie", color: "bg-red-500"
  },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "En cours": { color: "bg-blue-100 text-blue-700", icon: Play },
  "Terminé": { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  "En attente": { color: "bg-amber-100 text-amber-700", icon: Pause },
  "Bloqué": { color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const priorityConfig: Record<string, string> = {
  "Critique": "bg-red-100 text-red-700",
  "Haute": "bg-orange-100 text-orange-700",
  "Moyenne": "bg-amber-100 text-amber-700",
  "Normale": "bg-green-100 text-green-700",
};

export function Projets() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Tous" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Gestion des Projets</h2>
          <p className="text-gray-500 text-sm">{projects.length} projets au total</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouveau Projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "En cours", value: projects.filter(p => p.status === "En cours").length, color: "border-l-blue-500" },
          { label: "Terminés", value: projects.filter(p => p.status === "Terminé").length, color: "border-l-green-500" },
          { label: "En attente", value: projects.filter(p => p.status === "En attente").length, color: "border-l-amber-500" },
          { label: "Bloqués", value: projects.filter(p => p.status === "Bloqué").length, color: "border-l-red-500" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm border border-gray-100`}>
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className="text-gray-900 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un projet ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {["Tous", "En cours", "Terminé", "En attente", "Bloqué"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-[#0d1b2a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          return (
            <div key={project.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${project.color} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{project.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{project.id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[project.priority]}`}>{project.priority}</span>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <h4 className="text-gray-900 mb-1 leading-snug">{project.name}</h4>
              <p className="text-gray-500 text-xs mb-4">{project.client}</p>

              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Avancement</span>
                  <span className="text-xs font-semibold text-gray-700">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${project.color} transition-all`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Budget</p>
                  <p className="text-gray-700 text-xs font-medium">{project.budget} F</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Dépensé</p>
                  <p className="text-gray-700 text-xs font-medium">{project.spent} F</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(3, project.team) }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full ${project.color} border-2 border-white flex items-center justify-center`}>
                        <span className="text-white text-[9px] font-bold">{String.fromCharCode(65 + i)}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">+{project.team} membres</span>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusConfig[project.status].color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {project.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
