import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Target, Plus, Phone, Mail, Building2, ArrowUpRight } from "lucide-react";

const pipeline = [
  { stage: "Prospects", count: 42, value: 0, color: "bg-gray-400" },
  { stage: "Qualification", count: 28, value: 185000000, color: "bg-blue-400" },
  { stage: "Proposition", count: 15, value: 320000000, color: "bg-violet-500" },
  { stage: "Négociation", count: 8, value: 215000000, color: "bg-amber-500" },
  { stage: "Signature", count: 4, value: 148000000, color: "bg-emerald-500" },
];

const clients = [
  { id: "CLI-001", name: "SENATEL SA", sector: "Télécoms", contact: "Mamadou Cissé", email: "m.cisse@senatel.sn", phone: "+221 77 100 20 30", value: "85,000,000", status: "Client actif", deals: 3 },
  { id: "CLI-002", name: "Port Autonome de Dakar", sector: "Logistique", contact: "Ndèye Touré", email: "n.toure@portdakar.sn", phone: "+221 77 200 30 40", value: "120,000,000", status: "Client actif", deals: 2 },
  { id: "CLI-003", name: "SENELEC", sector: "Énergie", contact: "Abdoulaye Konaté", email: "a.konate@senelec.sn", phone: "+221 77 300 40 50", value: "350,000,000", status: "Prospect chaud", deals: 1 },
  { id: "CLI-004", name: "Banque Atlantique SN", sector: "Finance", contact: "Soda Ndiaye", email: "s.ndiaye@banqueatlantique.sn", phone: "+221 77 400 50 60", value: "45,000,000", status: "Nouveau", deals: 1 },
  { id: "CLI-005", name: "OFPT Sénégal", sector: "Formation", contact: "Boubacar Barry", email: "b.barry@ofpt.sn", phone: "+221 77 500 60 70", value: "25,000,000", status: "Client actif", deals: 2 },
  { id: "CLI-006", name: "Mairie de Dakar", sector: "Public", contact: "Khady Faye", email: "k.faye@dakar.sn", phone: "+221 77 600 70 80", value: "60,000,000", status: "Prospect", deals: 0 },
];

const monthlyPerfData = [
  { month: "Jan", objectif: 25, realise: 22 },
  { month: "Fév", objectif: 28, realise: 31 },
  { month: "Mar", objectif: 30, realise: 27 },
  { month: "Avr", objectif: 32, realise: 35 },
  { month: "Mai", objectif: 35, realise: 38 },
];

const statusColors: Record<string, string> = {
  "Client actif": "bg-green-100 text-green-700",
  "Prospect chaud": "bg-orange-100 text-orange-700",
  "Nouveau": "bg-blue-100 text-blue-700",
  "Prospect": "bg-gray-100 text-gray-600",
};

export function CRMVentes() {
  const [tab, setTab] = useState<"dashboard" | "pipeline" | "clients">("dashboard");

  const totalPipeline = pipeline.reduce((a, s) => a + s.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">CRM & Ventes</h2>
          <p className="text-gray-500 text-sm">Gestion commerciale et relation client</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Opportunité
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CA ce mois", value: "38M", unit: "FCFA", change: "+8.6%", icon: DollarSign, color: "bg-emerald-500" },
          { label: "Opportunités actives", value: "51", unit: "deals", change: "+12", icon: Target, color: "bg-blue-500" },
          { label: "Clients actifs", value: clients.filter(c => c.status === "Client actif").length, unit: "clients", change: "+2", icon: Building2, color: "bg-violet-500" },
          { label: "Taux de conversion", value: "28%", unit: "this month", change: "+5%", icon: TrendingUp, color: "bg-amber-500" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${k.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="flex items-center gap-0.5 text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />{k.change}
                </span>
              </div>
              <p className="text-gray-900 text-2xl font-bold">{k.value}</p>
              <p className="text-gray-400 text-xs mt-1">{k.unit} · {k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["dashboard", "pipeline", "clients"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "dashboard" ? "Performance" : t === "pipeline" ? "Pipeline" : "Clients"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 mb-1">Performance commerciale</h3>
            <p className="text-gray-400 text-xs mb-5">Objectif vs Réalisé (Millions FCFA)</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyPerfData} barSize={18} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}M FCFA`]} />
                <Bar dataKey="objectif" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Objectif" />
                <Bar dataKey="realise" fill="#10b981" radius={[4, 4, 0, 0]} name="Réalisé" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 mb-4">Top clients par valeur</h3>
            <div className="space-y-4">
              {clients.sort((a, b) => parseInt(b.value.replace(/,/g, "")) - parseInt(a.value.replace(/,/g, ""))).slice(0, 5).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm truncate">{c.name}</p>
                    <p className="text-gray-400 text-xs">{c.sector}</p>
                  </div>
                  <p className="text-gray-700 text-sm font-semibold">{c.value} F</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "pipeline" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-gray-900">Pipeline commercial</h3>
                <p className="text-gray-400 text-xs">Valeur totale: {(totalPipeline / 1000000).toFixed(0)}M FCFA</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pipeline.map(stage => (
                <div key={stage.stage} className="flex-1 min-w-[160px]">
                  <div className={`${stage.color} rounded-t-xl p-3 text-white`}>
                    <p className="text-sm font-medium">{stage.stage}</p>
                    <p className="text-white/80 text-2xl font-bold">{stage.count}</p>
                  </div>
                  <div className="bg-gray-50 rounded-b-xl p-3 border border-t-0 border-gray-100">
                    <p className="text-gray-600 text-xs">{stage.value > 0 ? `${(stage.value / 1000000).toFixed(0)}M FCFA` : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "clients" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-gray-900">Base clients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Client", "Secteur", "Contact", "Valeur", "Statut", "Deals"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm font-medium">{c.name}</p>
                          <p className="text-gray-400 text-xs">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.sector}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 text-sm">{c.contact}</p>
                      <p className="text-gray-400 text-xs">{c.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{c.value} F</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.deals}</td>
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
