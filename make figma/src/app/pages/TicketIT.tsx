import { useState } from "react";
import { Ticket, AlertTriangle, CheckCircle2, Clock, Plus, Search, MoreVertical, User, Tag, Monitor, Wifi, Shield, HardDrive } from "lucide-react";

const tickets = [
  { id: "TK-0001", title: "Impossible de se connecter au VPN", category: "Réseau", priority: "Haute", status: "En cours", user: "Moussa Ndiaye", assignee: "Fatou Diop", created: "06/05/2025 08:15", updated: "06/05/2025 09:30", description: "Depuis ce matin, impossible d'établir la connexion VPN depuis le bureau de Thiès.", tags: ["vpn", "réseau"] },
  { id: "TK-0002", title: "Mise à jour urgente serveur production", category: "Infrastructure", priority: "Critique", status: "En cours", user: "Ibrahima Diallo", assignee: "Rokhaya Gueye", created: "05/05/2025 17:00", updated: "06/05/2025 07:45", description: "Faille de sécurité critique détectée sur le serveur de production. Patch à appliquer immédiatement.", tags: ["sécurité", "serveur"] },
  { id: "TK-0003", title: "Imprimante bureau 2ème étage en panne", category: "Matériel", priority: "Normale", status: "Résolu", user: "Cheikh Fall", assignee: "Pape Diagne", created: "04/05/2025 10:00", updated: "05/05/2025 11:30", description: "Imprimante HP LaserJet ne répond plus sur le réseau.", tags: ["impression", "matériel"] },
  { id: "TK-0004", title: "Accès refusé à COYA ERP", category: "Logiciel", priority: "Haute", status: "En attente", user: "Aminata Sarr", assignee: "—", created: "06/05/2025 09:00", updated: "06/05/2025 09:00", description: "Après réinitialisation du mot de passe, l'accès au module comptabilité est toujours refusé.", tags: ["erp", "accès"] },
  { id: "TK-0005", title: "Sauvegarde automatique échouée", category: "Infrastructure", priority: "Haute", status: "Résolu", user: "Aïda Sall", assignee: "Rokhaya Gueye", created: "03/05/2025 23:00", updated: "04/05/2025 08:00", description: "La sauvegarde planifiée à 23h a échoué. Journaux d'erreur disponibles.", tags: ["backup", "serveur"] },
  { id: "TK-0006", title: "Installation logiciel AutoCAD", category: "Logiciel", priority: "Faible", status: "En attente", user: "Omar Badji", assignee: "—", created: "06/05/2025 11:00", updated: "06/05/2025 11:00", description: "Besoin d'installation d'AutoCAD 2025 sur le poste du bureau 215.", tags: ["logiciel", "installation"] },
  { id: "TK-0007", title: "Lenteur réseau local Pikine", category: "Réseau", priority: "Moyenne", status: "En cours", user: "Pape Diagne", assignee: "Fatou Diop", created: "05/05/2025 14:30", updated: "06/05/2025 10:00", description: "Connexion très lente depuis l'entrepôt de Pikine, surtout pour les transferts de fichiers.", tags: ["réseau", "performance"] },
];

const categoryIcons: Record<string, React.ElementType> = {
  "Réseau": Wifi,
  "Infrastructure": HardDrive,
  "Matériel": Monitor,
  "Logiciel": Shield,
};

const priorityConfig: Record<string, string> = {
  "Critique": "bg-red-100 text-red-700 border border-red-200",
  "Haute": "bg-orange-100 text-orange-700",
  "Moyenne": "bg-amber-100 text-amber-700",
  "Normale": "bg-blue-100 text-blue-700",
  "Faible": "bg-gray-100 text-gray-600",
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "En cours": { color: "bg-blue-100 text-blue-700", icon: Clock },
  "En attente": { color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  "Résolu": { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

export function TicketIT() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [selected, setSelected] = useState<string | null>("TK-0001");

  const filtered = tickets.filter(t => {
    const matchS = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search);
    const matchF = filter === "Tous" || t.status === filter;
    return matchS && matchF;
  });

  const selectedTicket = tickets.find(t => t.id === selected);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Tickets IT</h2>
          <p className="text-gray-500 text-sm">Support technique & helpdesk</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouveau Ticket
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tickets ouverts", value: tickets.filter(t => t.status !== "Résolu").length, icon: Ticket, color: "bg-rose-500" },
          { label: "Critiques", value: tickets.filter(t => t.priority === "Critique").length, icon: AlertTriangle, color: "bg-red-500" },
          { label: "En cours", value: tickets.filter(t => t.status === "En cours").length, icon: Clock, color: "bg-blue-500" },
          { label: "Résolus ce mois", value: tickets.filter(t => t.status === "Résolu").length, icon: CheckCircle2, color: "bg-green-500" },
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
          <input type="text" placeholder="Rechercher un ticket..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" />
        </div>
        <div className="flex gap-2">
          {["Tous", "En cours", "En attente", "Résolu"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f ? "bg-[#0d1b2a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(t => {
            const Icon = categoryIcons[t.category] || Ticket;
            const st = statusConfig[t.status];
            const StIcon = st.icon;
            return (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${selected === t.id ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-gray-800 font-medium text-sm">{t.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{t.id} · {t.user}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[t.priority]}`}>{t.priority}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                          <StIcon className="w-3 h-3" />{t.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-gray-400 text-xs">{t.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">Mis à jour: {t.updated}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {selectedTicket && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-xs font-mono">{selectedTicket.id}</p>
                <h4 className="text-gray-900 mt-1 leading-snug">{selectedTicket.title}</h4>
              </div>
              <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[selectedTicket.status].color}`}>{selectedTicket.status}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{selectedTicket.category}</span>
            </div>

            <p className="text-gray-600 text-sm mb-5 leading-relaxed">{selectedTicket.description}</p>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-[10px]">Demandeur</p>
                  <p className="text-gray-700 text-sm">{selectedTicket.user}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-[10px]">Assigné à</p>
                  <p className="text-gray-700 text-sm">{selectedTicket.assignee}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-[10px]">Créé le</p>
                  <p className="text-gray-700 text-sm">{selectedTicket.created}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {selectedTicket.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  <Tag className="w-3 h-3" />{tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-[#0d1b2a] text-white py-2 rounded-xl text-sm hover:bg-[#1a3a5c] transition-colors">Prendre en charge</button>
              <button className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">Résoudre</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
