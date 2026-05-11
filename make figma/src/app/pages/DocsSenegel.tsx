import { useState } from "react";
import { FileText, Folder, Upload, Search, Download, Eye, MoreVertical, ChevronRight, File, FileSpreadsheet, Image, Archive } from "lucide-react";

const folders = [
  { id: 1, name: "Contrats & Marchés", count: 48, color: "bg-blue-500", icon: "📑" },
  { id: 2, name: "Rapports Projets", count: 124, color: "bg-violet-500", icon: "📊" },
  { id: 3, name: "RH & Personnel", count: 87, color: "bg-green-500", icon: "👥" },
  { id: 4, name: "Comptabilité", count: 213, color: "bg-yellow-500", icon: "💰" },
  { id: 5, name: "Documents Légaux", count: 35, color: "bg-red-500", icon: "⚖️" },
  { id: 6, name: "Appels d'offres", count: 29, color: "bg-orange-500", icon: "📢" },
  { id: 7, name: "Fiches Techniques", count: 67, color: "bg-cyan-500", icon: "🔧" },
  { id: 8, name: "Formations", count: 42, color: "bg-pink-500", icon: "🎓" },
];

const recentDocs = [
  { id: 1, name: "Contrat_SENATEL_Phase3_2025.pdf", type: "pdf", size: "2.4 MB", modified: "06/05/2025", author: "Ibrahima Diallo", folder: "Contrats & Marchés" },
  { id: 2, name: "Rapport_Avancement_PRJ-002_Avril.xlsx", type: "xlsx", size: "1.8 MB", modified: "05/05/2025", author: "Fatou Diop", folder: "Rapports Projets" },
  { id: 3, name: "Budget_Q2_2025_v3.xlsx", type: "xlsx", size: "0.9 MB", modified: "04/05/2025", author: "Aïda Sall", folder: "Comptabilité" },
  { id: 4, name: "Appel_Offre_Fibre_Optique_SL.pdf", type: "pdf", size: "5.2 MB", modified: "03/05/2025", author: "Cheikh Fall", folder: "Appels d'offres" },
  { id: 5, name: "Plan_Formation_RH_2025.docx", type: "docx", size: "0.4 MB", modified: "02/05/2025", author: "Ndéye Faye", folder: "Formations" },
  { id: 6, name: "Contrat_Travail_EMP-011.pdf", type: "pdf", size: "0.3 MB", modified: "01/05/2025", author: "Ndéye Faye", folder: "RH & Personnel" },
  { id: 7, name: "Schema_Reseau_Dakar_v2.png", type: "img", size: "8.1 MB", modified: "30/04/2025", author: "Fatou Diop", folder: "Fiches Techniques" },
  { id: 8, name: "Statuts_COYA_Holding_2024.pdf", type: "pdf", size: "1.1 MB", modified: "15/04/2025", author: "Admin COYA", folder: "Documents Légaux" },
];

const typeIcons: Record<string, React.ElementType> = {
  "pdf": FileText,
  "xlsx": FileSpreadsheet,
  "docx": File,
  "img": Image,
  "zip": Archive,
};

const typeColors: Record<string, string> = {
  "pdf": "text-red-500 bg-red-50",
  "xlsx": "text-green-600 bg-green-50",
  "docx": "text-blue-500 bg-blue-50",
  "img": "text-violet-500 bg-violet-50",
  "zip": "text-amber-500 bg-amber-50",
};

export function DocsSenegel() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = recentDocs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.folder.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">DOCS SENEGEL</h2>
          <p className="text-gray-500 text-sm">Gestion documentaire — {recentDocs.length} documents récents</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <Upload className="w-4 h-4" /> Importer
          </button>
          <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
            <Folder className="w-4 h-4" /> Nouveau Dossier
          </button>
        </div>
      </div>

      {/* Storage stats */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Stockage utilisé</p>
            <p className="text-3xl font-bold">24.8 GB</p>
            <p className="text-white/60 text-xs mt-1">sur 100 GB · 648 documents</p>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs text-white/70 mb-2">
              <span>24.8 GB utilisés</span>
              <span>75.2 GB libres</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full">
              <div className="h-full bg-white rounded-full" style={{ width: "24.8%" }} />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-white/70">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/80 inline-block" /> PDF 12.4 GB</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" /> Excel 7.2 GB</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300 inline-block" /> Autres 5.2 GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Folders */}
      <div>
        <h3 className="text-gray-800 mb-4">Dossiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map(f => (
            <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{f.icon}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-gray-800 text-sm font-medium leading-snug">{f.name}</p>
              <p className="text-gray-400 text-xs mt-1">{f.count} fichiers</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800">Documents récents</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-40" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nom", "Dossier", "Taille", "Modifié par", "Date", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const Icon = typeIcons[doc.type] || FileText;
                const color = typeColors[doc.type] || "text-gray-500 bg-gray-50";
                return (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-gray-800 text-sm truncate max-w-[200px]">{doc.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{doc.folder}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{doc.size}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{doc.author}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{doc.modified}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
