import { useState } from "react";
import { Package, Truck, MapPin, Clock, CheckCircle2, AlertCircle, Plus, Search, Filter, BarChart2 } from "lucide-react";

const shipments = [
  { id: "LIV-001", description: "Équipements réseau SENATEL", origin: "Dakar Port", destination: "Saint-Louis", status: "En transit", date: "06/05/2025", driver: "Mamadou Ba", weight: "2.4 T", progress: 65 },
  { id: "LIV-002", description: "Matériel solaire – Thiès", origin: "Entrepôt Pikine", destination: "Thiès", status: "Livré", date: "05/05/2025", driver: "Oumar Sène", weight: "5.8 T", progress: 100 },
  { id: "LIV-003", description: "Câbles fibre optique", origin: "Aéroport DSS", destination: "Ziguinchor", status: "En transit", date: "07/05/2025", driver: "Issa Diallo", weight: "1.2 T", progress: 30 },
  { id: "LIV-004", description: "Serveurs datacenter", origin: "Fournisseur Chine", destination: "Dakar", status: "Douane", date: "04/05/2025", driver: "—", weight: "0.8 T", progress: 45 },
  { id: "LIV-005", description: "Groupes électrogènes", origin: "Entrepôt Pikine", destination: "Kaolack", status: "Planifié", date: "09/05/2025", driver: "Alioune Fall", weight: "3.1 T", progress: 0 },
  { id: "LIV-006", description: "Mobilier bureau Mbour", origin: "Dakar", destination: "Mbour", status: "Livré", date: "03/05/2025", driver: "Cheikh Diop", weight: "0.6 T", progress: 100 },
];

const stock = [
  { ref: "MAT-001", name: "Câble RJ45 Cat.6 (100m)", qty: 248, unit: "bobine", threshold: 50, location: "Zone A" },
  { ref: "MAT-002", name: "Switch Cisco SG250", qty: 14, unit: "unité", threshold: 10, location: "Zone B" },
  { ref: "MAT-003", name: "Routeur Mikrotik CCR2004", qty: 8, unit: "unité", threshold: 5, location: "Zone B" },
  { ref: "MAT-004", name: "Câble Fibre Optique (500m)", qty: 6, unit: "bobine", threshold: 10, location: "Zone C" },
  { ref: "MAT-005", name: "Onduleur APC 3000VA", qty: 22, unit: "unité", threshold: 8, location: "Zone A" },
  { ref: "MAT-006", name: "Panneau solaire 400W", qty: 45, unit: "unité", threshold: 20, location: "Zone D" },
  { ref: "MAT-007", name: "Batterie AGM 200Ah", qty: 3, unit: "unité", threshold: 10, location: "Zone D" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "En transit": { color: "bg-blue-100 text-blue-700", icon: Truck },
  "Livré": { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  "Planifié": { color: "bg-amber-100 text-amber-700", icon: Clock },
  "Douane": { color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

export function Logistique() {
  const [tab, setTab] = useState<"livraisons" | "stock">("livraisons");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Logistique</h2>
          <p className="text-gray-500 text-sm">Suivi des livraisons et gestion des stocks</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Livraison
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Livraisons ce mois", value: shipments.length, icon: Package, color: "bg-teal-500" },
          { label: "En transit", value: shipments.filter(s => s.status === "En transit").length, icon: Truck, color: "bg-blue-500" },
          { label: "Livrées à temps", value: "94%", icon: CheckCircle2, color: "bg-emerald-500" },
          { label: "Articles en rupture", value: stock.filter(s => s.qty < s.threshold).length, icon: AlertCircle, color: "bg-red-500" },
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
        {(["livraisons", "stock"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "livraisons" ? "Livraisons" : "Stock"}
          </button>
        ))}
      </div>

      {tab === "livraisons" && (
        <div className="space-y-4">
          {shipments.map(s => {
            const cfg = statusConfig[s.status];
            const Icon = cfg.icon;
            return (
              <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm">{s.description}</p>
                      <p className="text-gray-400 text-xs">{s.id} · {s.weight}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.origin}</span>
                    <span className="text-gray-300">→</span>
                    <span>{s.destination}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {s.status}
                    </span>
                    <span className="text-gray-400 text-xs">{s.date}</span>
                  </div>
                </div>

                {s.progress > 0 && s.progress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Progression</span>
                      <span className="text-xs font-medium text-gray-600">{s.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "stock" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-900">Inventaire des stocks</h3>
            <button className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700">
              <Filter className="w-4 h-4" /> Filtrer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Référence", "Désignation", "Quantité", "Unité", "Seuil", "Localisation", "État"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const critical = s.qty < s.threshold;
                  return (
                    <tr key={s.ref} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">{s.ref}</td>
                      <td className="px-5 py-4 text-sm text-gray-800">{s.name}</td>
                      <td className={`px-5 py-4 text-sm font-bold ${critical ? "text-red-500" : "text-gray-700"}`}>{s.qty}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{s.unit}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{s.threshold}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{s.location}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${critical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {critical ? "Rupture proche" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
