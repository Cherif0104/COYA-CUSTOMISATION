import { useState } from "react";
import { GraduationCap, Users, Clock, Star, Plus, Search, Play, BookOpen, Award } from "lucide-react";

const formations = [
  {
    id: "FOR-001", title: "Gestion de Projet Agile", category: "Management", duration: "3 jours", participants: 24,
    rating: 4.8, status: "En cours", date: "05–07 Mai 2025", trainer: "Ibrahima Diallo", level: "Intermédiaire",
    color: "bg-blue-500", completed: 8, enrolled: 24
  },
  {
    id: "FOR-002", title: "Sécurité des Systèmes IT", category: "Informatique", duration: "2 jours", participants: 18,
    rating: 4.6, status: "Planifié", date: "19–20 Mai 2025", trainer: "Fatou Diop", level: "Avancé",
    color: "bg-red-500", completed: 0, enrolled: 18
  },
  {
    id: "FOR-003", title: "Excel Avancé & Power BI", category: "Bureautique", duration: "2 jours", participants: 30,
    rating: 4.5, status: "Terminé", date: "14–15 Avr 2025", trainer: "Moussa Ndiaye", level: "Intermédiaire",
    color: "bg-green-500", completed: 30, enrolled: 30
  },
  {
    id: "FOR-004", title: "Leadership & Communication", category: "Management", duration: "1 jour", participants: 15,
    rating: 4.9, status: "Terminé", date: "10 Avr 2025", trainer: "Aïda Sall", level: "Tous niveaux",
    color: "bg-violet-500", completed: 15, enrolled: 15
  },
  {
    id: "FOR-005", title: "Maintenance Réseaux Télécoms", category: "Technique", duration: "5 jours", participants: 12,
    rating: 4.7, status: "Planifié", date: "02–06 Jun 2025", trainer: "Cheikh Fall", level: "Expert",
    color: "bg-cyan-500", completed: 0, enrolled: 12
  },
  {
    id: "FOR-006", title: "Droit du Travail Sénégalais", category: "Juridique", duration: "1 jour", participants: 40,
    rating: 4.4, status: "Planifié", date: "21 Mai 2025", trainer: "Expert externe", level: "Tous niveaux",
    color: "bg-amber-500", completed: 0, enrolled: 40
  },
];

const categoryColors: Record<string, string> = {
  "Management": "bg-blue-100 text-blue-700",
  "Informatique": "bg-violet-100 text-violet-700",
  "Bureautique": "bg-green-100 text-green-700",
  "Technique": "bg-cyan-100 text-cyan-700",
  "Juridique": "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-700",
  "Planifié": "bg-amber-100 text-amber-700",
  "Terminé": "bg-green-100 text-green-700",
};

export function Formations() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");

  const filtered = formations.filter(f => {
    const matchS = f.title.toLowerCase().includes(search.toLowerCase());
    const matchF = filter === "Tous" || f.status === filter;
    return matchS && matchF;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Formations</h2>
          <p className="text-gray-500 text-sm">Plan de formation 2025</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Formation
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Formations 2025", value: formations.length, icon: BookOpen, color: "bg-pink-500" },
          { label: "Participants totaux", value: formations.reduce((a, f) => a + f.participants, 0), icon: Users, color: "bg-blue-500" },
          { label: "Heures dispensées", value: "248h", icon: Clock, color: "bg-violet-500" },
          { label: "Note moyenne", value: "4.6", icon: Star, color: "bg-amber-500" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher une formation..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" />
        </div>
        <div className="flex gap-2">
          {["Tous", "En cours", "Planifié", "Terminé"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-[#0d1b2a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(f => (
          <div key={f.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`${f.color} p-5`}>
              <div className="flex items-start justify-between">
                <GraduationCap className="w-8 h-8 text-white/80" />
                <span className={`text-xs px-2 py-1 rounded-full bg-white/20 text-white`}>{f.status}</span>
              </div>
              <h4 className="text-white mt-3 leading-snug">{f.title}</h4>
              <p className="text-white/70 text-xs mt-1">{f.category} · {f.level}</p>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 mb-4 text-gray-500 text-xs">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {f.duration}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {f.participants} participants</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {f.rating}</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-400">Complétion</span>
                  <span className="text-xs font-semibold text-gray-600">{Math.round((f.completed / f.enrolled) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${(f.completed / f.enrolled) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-gray-400 text-[10px]">Formateur</p>
                  <p className="text-gray-700 text-xs font-medium">{f.trainer}</p>
                </div>
                <p className="text-gray-400 text-xs">{f.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
