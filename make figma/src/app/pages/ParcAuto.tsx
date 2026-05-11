import { useState } from "react";
import { Car, Fuel, Wrench, MapPin, CheckCircle2, AlertTriangle, Clock, Plus, MoreVertical } from "lucide-react";

const vehicles = [
  { id: "VH-001", plate: "DK-4521-AB", model: "Toyota Hilux 4x4", type: "Pickup", status: "Disponible", fuel: 85, mileage: "47,200", lastService: "15/02/2025", nextService: "15/08/2025", driver: "—", location: "Dakar Siège", color: "bg-blue-500" },
  { id: "VH-002", plate: "DK-7832-CD", model: "Mercedes Sprinter", type: "Minibus", status: "En mission", fuel: 60, mileage: "82,500", lastService: "10/01/2025", nextService: "10/07/2025", driver: "Mamadou Ba", location: "Saint-Louis", color: "bg-violet-500" },
  { id: "VH-003", plate: "DK-1234-EF", model: "Ford Ranger", type: "Pickup", status: "En maintenance", fuel: 30, mileage: "63,800", lastService: "01/05/2025", nextService: "01/11/2025", driver: "—", location: "Garage Central", color: "bg-amber-500" },
  { id: "VH-004", plate: "DK-5678-GH", model: "Renault Master Cargo", type: "Fourgon", status: "Disponible", fuel: 92, mileage: "28,400", lastService: "20/03/2025", nextService: "20/09/2025", driver: "—", location: "Entrepôt Pikine", color: "bg-teal-500" },
  { id: "VH-005", plate: "DK-9012-IJ", model: "Mitsubishi L200", type: "Pickup", status: "En mission", fuel: 45, mileage: "91,200", lastService: "05/12/2024", nextService: "05/06/2025", driver: "Issa Diallo", location: "Thiès", color: "bg-emerald-500" },
  { id: "VH-006", plate: "DK-3456-KL", model: "Toyota Land Cruiser", type: "SUV", status: "Disponible", fuel: 78, mileage: "34,100", lastService: "01/04/2025", nextService: "01/10/2025", driver: "—", location: "Dakar Siège", color: "bg-cyan-500" },
  { id: "VH-007", plate: "DK-7890-MN", model: "Hyundai H350", type: "Fourgon", status: "Indisponible", fuel: 15, mileage: "115,000", lastService: "10/11/2024", nextService: "10/05/2025", driver: "—", location: "Garage Central", color: "bg-red-500" },
];

const missions = [
  { id: "MIS-001", vehicle: "DK-7832-CD", driver: "Mamadou Ba", from: "Dakar", to: "Saint-Louis", purpose: "Livraison équipements SENATEL", start: "06/05 08:00", end: "06/05 18:00", status: "En cours" },
  { id: "MIS-002", vehicle: "DK-9012-IJ", driver: "Issa Diallo", from: "Dakar", to: "Thiès", purpose: "Inspection chantier solaire", start: "06/05 09:30", end: "06/05 17:00", status: "En cours" },
  { id: "MIS-003", vehicle: "DK-4521-AB", driver: "Oumar Sène", from: "Dakar", to: "Kaolack", purpose: "Réunion client", start: "07/05 07:00", end: "07/05 20:00", status: "Planifié" },
];

const statusConfig: Record<string, string> = {
  "Disponible": "bg-green-100 text-green-700",
  "En mission": "bg-blue-100 text-blue-700",
  "En maintenance": "bg-amber-100 text-amber-700",
  "Indisponible": "bg-red-100 text-red-700",
};

export function ParcAuto() {
  const [tab, setTab] = useState<"vehicules" | "missions">("vehicules");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Parc Automobile</h2>
          <p className="text-gray-500 text-sm">{vehicles.length} véhicules gérés</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Ajouter Véhicule
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Disponibles", value: vehicles.filter(v => v.status === "Disponible").length, icon: Car, color: "bg-green-500" },
          { label: "En mission", value: vehicles.filter(v => v.status === "En mission").length, icon: MapPin, color: "bg-blue-500" },
          { label: "En maintenance", value: vehicles.filter(v => v.status === "En maintenance").length, icon: Wrench, color: "bg-amber-500" },
          { label: "Indisponibles", value: vehicles.filter(v => v.status === "Indisponible").length, icon: AlertTriangle, color: "bg-red-500" },
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
        {(["vehicules", "missions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "vehicules" ? "Véhicules" : "Missions"}
          </button>
        ))}
      </div>

      {tab === "vehicules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${v.color} rounded-xl flex items-center justify-center`}>
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{v.plate}</p>
                    <p className="text-gray-500 text-xs">{v.type}</p>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <p className="text-gray-800 text-sm font-medium mb-1">{v.model}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[v.status]}`}>{v.status}</span>
              </div>

              {/* Fuel */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-gray-500 text-xs"><Fuel className="w-3 h-3" /> Carburant</span>
                  <span className="text-xs font-medium text-gray-600">{v.fuel}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-full rounded-full ${v.fuel < 25 ? "bg-red-500" : v.fuel < 50 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${v.fuel}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Kilométrage</p>
                  <p className="text-gray-700 font-medium">{v.mileage} km</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-gray-400 text-[10px]">Localisation</p>
                  <p className="text-gray-700 font-medium truncate">{v.location}</p>
                </div>
              </div>

              {v.driver !== "—" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-[9px] font-bold">{v.driver.charAt(0)}</span>
                  </div>
                  {v.driver}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "missions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-gray-900">Missions du Jour</h3>
            </div>
            <div className="p-5 space-y-4">
              {missions.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium text-sm">{m.purpose}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{m.from} → {m.to}</span>
                      <span className="text-gray-500 text-xs">{m.vehicle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-xs">{m.driver}</p>
                    <p className="text-gray-400 text-xs">{m.start} – {m.end}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${m.status === "En cours" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
