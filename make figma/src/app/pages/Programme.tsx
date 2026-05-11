import { useState } from "react";
import { Plus, ChevronRight, Target, Layers, BarChart2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const programmes = [
  {
    id: "PROG-001",
    name: "Programme Infrastructure Nationale",
    description: "Déploiement des infrastructures télécoms et énergétiques à l'échelle nationale",
    status: "En cours",
    progress: 58,
    budget: "850,000,000",
    projects: 4,
    startDate: "Jan 2024",
    endDate: "Déc 2026",
    color: "bg-blue-500",
    manager: "Ibrahima Diallo",
    objectives: ["Couvrir 90% du territoire", "Fibre optique dans 10 villes", "3 centrales solaires"],
  },
  {
    id: "PROG-002",
    name: "Programme Digital Sénégal",
    description: "Transformation numérique des administrations publiques et PME",
    status: "En cours",
    progress: 42,
    budget: "450,000,000",
    projects: 5,
    startDate: "Mar 2024",
    endDate: "Déc 2025",
    color: "bg-violet-500",
    manager: "Fatou Diop",
    objectives: ["Formation 500 agents", "50 apps déployées", "Cloud souverain"],
  },
  {
    id: "PROG-003",
    name: "Programme Renforcement Capacités",
    description: "Formation professionnelle et développement des compétences",
    status: "En cours",
    progress: 75,
    budget: "120,000,000",
    projects: 3,
    startDate: "Juin 2024",
    endDate: "Juin 2025",
    color: "bg-emerald-500",
    manager: "Moussa Ndiaye",
    objectives: ["1000 bénéficiaires", "50 formateurs certifiés", "10 centres actifs"],
  },
  {
    id: "PROG-004",
    name: "Programme Développement Durable",
    description: "Initiatives RSE et développement durable du Groupe COYA",
    status: "Planifié",
    progress: 10,
    budget: "80,000,000",
    projects: 2,
    startDate: "Jul 2025",
    endDate: "Déc 2026",
    color: "bg-green-500",
    manager: "Aïda Sall",
    objectives: ["Zéro carbone 2026", "100% énergie renouvelable", "30% recyclage"],
  },
];

const milestones = [
  { prog: "PROG-001", label: "Phase 1 — Étude de faisabilité", date: "30/06/2024", done: true },
  { prog: "PROG-001", label: "Phase 2 — Déploiement pilote", date: "31/12/2024", done: true },
  { prog: "PROG-001", label: "Phase 3 — Extension nationale", date: "30/06/2025", done: false },
  { prog: "PROG-002", label: "Audit des besoins", date: "30/04/2024", done: true },
  { prog: "PROG-002", label: "Développement applications", date: "31/08/2025", done: false },
  { prog: "PROG-003", label: "Recrutement formateurs", date: "31/08/2024", done: true },
  { prog: "PROG-003", label: "Première promotion", date: "15/03/2025", done: true },
];

export function Programme() {
  const [selected, setSelected] = useState<string | null>("PROG-001");
  const selectedProg = programmes.find(p => p.id === selected);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Gestion des Programmes</h2>
          <p className="text-gray-500 text-sm">{programmes.length} programmes actifs</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouveau Programme
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total programmes", value: programmes.length, icon: Layers, color: "bg-blue-500" },
          { label: "Projets inclus", value: programmes.reduce((a, p) => a + p.projects, 0), icon: Target, color: "bg-violet-500" },
          { label: "Budget total", value: "1.5Mrd", icon: BarChart2, color: "bg-emerald-500" },
          { label: "Milestones atteints", value: milestones.filter(m => m.done).length, icon: CheckCircle2, color: "bg-green-500" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Programme list */}
        <div className="space-y-3">
          {programmes.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all ${selected === p.id ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:shadow-md"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 ${p.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{p.id.split("-")[1]}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === "En cours" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
              </div>
              <p className="text-gray-900 text-sm font-medium mb-1">{p.name}</p>
              <p className="text-gray-500 text-xs mb-3 line-clamp-2">{p.description}</p>
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">Avancement</span>
                  <span className="text-xs font-semibold text-gray-600">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{p.projects} projets</span>
                <span>{p.startDate} → {p.endDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Programme detail */}
        {selectedProg && (
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 ${selectedProg.color} rounded-2xl flex items-center justify-center`}>
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900">{selectedProg.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedProg.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Budget</p>
                  <p className="text-gray-800 text-sm font-semibold">{selectedProg.budget} F</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Projets</p>
                  <p className="text-gray-800 text-sm font-semibold">{selectedProg.projects}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Responsable</p>
                  <p className="text-gray-800 text-sm font-semibold truncate">{selectedProg.manager}</p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-gray-700 text-sm font-medium mb-3">Objectifs stratégiques</p>
                <div className="space-y-2">
                  {selectedProg.objectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-gray-600 text-sm">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-700 text-sm font-medium mb-3">Avancement global</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-gray-100 rounded-full">
                    <div className={`h-full ${selectedProg.color} rounded-full`} style={{ width: `${selectedProg.progress}%` }} />
                  </div>
                  <span className="text-gray-800 font-bold text-lg w-12 text-right">{selectedProg.progress}%</span>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-gray-900 mb-4">Jalons / Milestones</h4>
              <div className="space-y-3">
                {milestones.filter(m => m.prog === selected).map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                      {m.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${m.done ? "text-gray-700 line-through opacity-60" : "text-gray-800"}`}>{m.label}</p>
                      <p className="text-gray-400 text-xs">{m.date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${m.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.done ? "Atteint" : "En cours"}
                    </span>
                  </div>
                ))}
                {milestones.filter(m => m.prog === selected).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">Aucun jalon défini</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
