import { useState } from "react";
import { Wrench, Building2, Zap, Droplets, Wifi, Shield, Plus, MoreVertical, AlertTriangle, CheckCircle2, Clock, TrendingDown } from "lucide-react";

const equipments = [
  { id: "EQ-001", name: "Groupe Électrogène Principal", type: "Énergie", location: "Sous-sol siège", status: "Opérationnel", lastCheck: "01/05/2025", nextCheck: "01/08/2025", brand: "SDMO", serial: "GE2024-001" },
  { id: "EQ-002", name: "Climatisation Salle Serveurs", type: "CVC", location: "Datacenter R+2", status: "Opérationnel", lastCheck: "15/04/2025", nextCheck: "15/07/2025", brand: "Daikin", serial: "CLI-2023-045" },
  { id: "EQ-003", name: "Ascenseur Principal", type: "Élévation", location: "Hall siège", status: "En maintenance", lastCheck: "30/04/2025", nextCheck: "En cours", brand: "Schindler", serial: "ASC-2019-003" },
  { id: "EQ-004", name: "Système de Sécurité Incendie", type: "Sécurité", location: "Tout bâtiment", status: "Opérationnel", lastCheck: "10/04/2025", nextCheck: "10/10/2025", brand: "Hochiki", serial: "FIRE-2021-007" },
  { id: "EQ-005", name: "Pompe à eau circuit fermé", type: "Hydraulique", location: "Chaufferie", status: "Défaillant", lastCheck: "25/04/2025", nextCheck: "Urgent", brand: "Grundfos", serial: "PMP-2020-012" },
  { id: "EQ-006", name: "Générateur UPS Datacenter", type: "Énergie", location: "Datacenter R+2", status: "Opérationnel", lastCheck: "20/04/2025", nextCheck: "20/07/2025", brand: "APC", serial: "UPS-2022-003" },
];

const sites = [
  { id: "SITE-001", name: "Siège Social — Dakar Plateau", surface: "1,200 m²", floors: 4, employees: 65, rent: "2,800,000", status: "Principal" },
  { id: "SITE-002", name: "Entrepôt Logistique — Pikine", surface: "800 m²", floors: 1, employees: 12, rent: "650,000", status: "Location" },
  { id: "SITE-003", name: "Bureau Régional — Thiès", surface: "250 m²", floors: 2, employees: 8, rent: "380,000", status: "Location" },
  { id: "SITE-004", name: "Bureau Régional — Saint-Louis", surface: "180 m²", floors: 1, employees: 5, rent: "250,000", status: "Location" },
];

const interventions = [
  { id: "INT-001", object: "Ascenseur principal bloqué", priority: "Urgente", date: "06/05/2025", technician: "OTIS Services", status: "En cours" },
  { id: "INT-002", object: "Fuite d'eau bureau 3ème étage", priority: "Haute", date: "05/05/2025", technician: "Plomberie DIALLO", status: "Résolu" },
  { id: "INT-003", object: "Remplacement pompe chaufferie", priority: "Haute", date: "07/05/2025", technician: "Grundfos SN", status: "Planifié" },
  { id: "INT-004", object: "Révision groupe électrogène", priority: "Normale", date: "15/05/2025", technician: "SDMO Sénégal", status: "Planifié" },
  { id: "INT-005", object: "Peinture couloir R+1", priority: "Faible", date: "20/05/2025", technician: "Artisans COYA", status: "Planifié" },
];

const statusColors: Record<string, string> = {
  "Opérationnel": "bg-green-100 text-green-700",
  "En maintenance": "bg-amber-100 text-amber-700",
  "Défaillant": "bg-red-100 text-red-700",
};

const intStatusColors: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-700",
  "Résolu": "bg-green-100 text-green-700",
  "Planifié": "bg-amber-100 text-amber-700",
};

export function MoyensGeneraux() {
  const [tab, setTab] = useState<"equipements" | "sites" | "interventions">("equipements");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Moyens Généraux</h2>
          <p className="text-gray-500 text-sm">Gestion des installations et équipements</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Intervention
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Équipements gérés", value: equipments.length, icon: Wrench, color: "bg-lime-500" },
          { label: "Sites / Locaux", value: sites.length, icon: Building2, color: "bg-blue-500" },
          { label: "Interventions en cours", value: interventions.filter(i => i.status === "En cours").length, icon: Clock, color: "bg-amber-500" },
          { label: "Équipements en défaillance", value: equipments.filter(e => e.status === "Défaillant").length, icon: AlertTriangle, color: "bg-red-500" },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["equipements", "sites", "interventions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "equipements" ? "Équipements" : t === "sites" ? "Sites & Locaux" : "Interventions"}
          </button>
        ))}
      </div>

      {tab === "equipements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {equipments.map(eq => (
            <div key={eq.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lime-50 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-lime-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{eq.name}</p>
                    <p className="text-gray-400 text-xs">{eq.id} · {eq.type}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[eq.status]}`}>{eq.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Localisation</p>
                  <p className="text-gray-700">{eq.location}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Marque</p>
                  <p className="text-gray-700">{eq.brand}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Dernier contrôle</p>
                  <p className="text-gray-700">{eq.lastCheck}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Prochain contrôle</p>
                  <p className={`${eq.nextCheck === "Urgent" ? "text-red-500 font-bold" : "text-gray-700"}`}>{eq.nextCheck}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sites.map(site => (
            <div key={site.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{site.name}</p>
                    <p className="text-gray-400 text-xs">{site.id}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${site.status === "Principal" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{site.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Surface</p>
                  <p className="text-gray-700 font-medium">{site.surface}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Étages</p>
                  <p className="text-gray-700 font-medium">{site.floors}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Effectif</p>
                  <p className="text-gray-700 font-medium">{site.employees} personnes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-gray-400 text-[10px]">Loyer mensuel</p>
                  <p className="text-gray-700 font-medium">{site.rent} FCFA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "interventions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-gray-900">Journal des interventions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Référence", "Objet", "Priorité", "Date", "Prestataire", "Statut"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interventions.map(i => (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">{i.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-800">{i.object}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${i.priority === "Urgente" ? "bg-red-100 text-red-700" : i.priority === "Haute" ? "bg-orange-100 text-orange-700" : i.priority === "Normale" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {i.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{i.date}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{i.technician}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${intStatusColors[i.status]}`}>{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
