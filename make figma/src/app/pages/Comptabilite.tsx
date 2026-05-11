/**
 * Démonstrateur isolé pour l’app Vite « make figma » — ce fichier n’est pas monté par l’intranet COYA principal.
 * Comptabilité canonique : `components/ComptabiliteModule.tsx` → `AccountingModuleShell`.
 */
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Download, Filter } from "lucide-react";

const monthlyData = [
  { month: "Jan", revenus: 12.4, depenses: 8.2, benefice: 4.2 },
  { month: "Fév", revenus: 14.8, depenses: 9.1, benefice: 5.7 },
  { month: "Mar", revenus: 13.2, depenses: 7.8, benefice: 5.4 },
  { month: "Avr", revenus: 16.5, depenses: 10.2, benefice: 6.3 },
  { month: "Mai", revenus: 18.2, depenses: 11.5, benefice: 6.7 },
];

const expenseCategories = [
  { name: "Salaires", value: 45, color: "#3b82f6" },
  { name: "Fournisseurs", value: 22, color: "#10b981" },
  { name: "Transport", value: 12, color: "#f59e0b" },
  { name: "Loyers", value: 10, color: "#8b5cf6" },
  { name: "Autres", value: 11, color: "#6b7280" },
];

const transactions = [
  { id: "TXN-001", label: "Paiement client SENATEL", type: "credit", amount: "15,000,000", date: "05/05/2025", category: "Revenus projets", status: "Validé" },
  { id: "TXN-002", label: "Salaires Avril 2025", type: "debit", amount: "8,500,000", date: "04/05/2025", category: "Salaires", status: "Validé" },
  { id: "TXN-003", label: "Facture fournisseur Elec.", type: "debit", amount: "1,250,000", date: "03/05/2025", category: "Fournisseurs", status: "En attente" },
  { id: "TXN-004", label: "Contrat Port Autonome", type: "credit", amount: "22,000,000", date: "02/05/2025", category: "Revenus projets", status: "Validé" },
  { id: "TXN-005", label: "Loyer siège social", type: "debit", amount: "2,800,000", date: "01/05/2025", category: "Loyers", status: "Validé" },
  { id: "TXN-006", label: "Formation externe OFPT", type: "credit", amount: "5,500,000", date: "30/04/2025", category: "Formations", status: "Validé" },
  { id: "TXN-007", label: "Carburant Parc Auto", type: "debit", amount: "650,000", date: "29/04/2025", category: "Transport", status: "Validé" },
  { id: "TXN-008", label: "Maintenance équipements", type: "debit", amount: "980,000", date: "28/04/2025", category: "Maintenance", status: "En attente" },
];

export function Comptabilite() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "budget">("overview");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Comptabilité</h2>
          <p className="text-gray-500 text-sm">Exercice fiscal 2025</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
            <Plus className="w-4 h-4" /> Écriture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chiffre d'affaires YTD", value: "75.1M", unit: "FCFA", change: "+18.4%", up: true, icon: TrendingUp, color: "bg-blue-500" },
          { label: "Dépenses YTD", value: "46.8M", unit: "FCFA", change: "+12.1%", up: false, icon: TrendingDown, color: "bg-red-500" },
          { label: "Bénéfice net", value: "28.3M", unit: "FCFA", change: "+24.7%", up: true, icon: DollarSign, color: "bg-emerald-500" },
          { label: "Trésorerie", value: "42.6M", unit: "FCFA", change: "+8.9%", up: true, icon: ArrowUpRight, color: "bg-violet-500" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${k.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs px-2 py-1 rounded-full ${k.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.change}
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
        {(["overview", "transactions", "budget"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === tab ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab === "overview" ? "Vue d'ensemble" : tab === "transactions" ? "Transactions" : "Budget"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 mb-1">Résultats mensuels</h3>
            <p className="text-gray-400 text-xs mb-5">Millions FCFA</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v}M FCFA`]} />
                <Bar dataKey="revenus" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenus" />
                <Bar dataKey="depenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Dépenses" />
                <Bar dataKey="benefice" fill="#10b981" radius={[4, 4, 0, 0]} name="Bénéfice" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-gray-900 mb-1">Répartition des Dépenses</h3>
            <p className="text-gray-400 text-xs mb-4">Par catégorie</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={expenseCategories} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                  {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {expenseCategories.map(c => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-600 text-xs">{c.name}</span>
                  </div>
                  <span className="text-gray-700 text-xs font-medium">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-900">Journal des transactions</h3>
            <button className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700">
              <Filter className="w-4 h-4" /> Filtrer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Référence", "Libellé", "Catégorie", "Date", "Montant", "Statut"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-gray-500 font-mono">{t.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-800">{t.label}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{t.category}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{t.date}</td>
                    <td className={`px-5 py-4 text-sm font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "credit" ? "+" : "-"}{t.amount} F
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${t.status === "Validé" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "budget" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { dept: "Projets & Travaux", allocated: 450, spent: 312, pct: 69 },
            { dept: "Ressources Humaines", allocated: 180, spent: 152, pct: 84 },
            { dept: "Infrastructure IT", allocated: 85, spent: 47, pct: 55 },
            { dept: "Logistique & Transport", allocated: 65, spent: 38, pct: 58 },
            { dept: "Formations", allocated: 40, spent: 28, pct: 70 },
            { dept: "Moyens Généraux", allocated: 55, spent: 41, pct: 74 },
          ].map(b => (
            <div key={b.dept} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between mb-3">
                <h4 className="text-gray-800">{b.dept}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${b.pct > 80 ? "bg-red-100 text-red-600" : b.pct > 65 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                  {b.pct}% utilisé
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-3">
                <div
                  className={`h-full rounded-full ${b.pct > 80 ? "bg-red-500" : b.pct > 65 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Dépensé: {b.spent}M FCFA</span>
                <span>Alloué: {b.allocated}M FCFA</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
