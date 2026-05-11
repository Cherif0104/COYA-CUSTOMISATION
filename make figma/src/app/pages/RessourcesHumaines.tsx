import { useState } from "react";
import { Search, Plus, MoreVertical, Phone, Mail, MapPin, Star, TrendingUp, Users, UserCheck, UserX, Briefcase } from "lucide-react";

const employees = [
  { id: "EMP-001", name: "Ibrahima Diallo", role: "Chef de Projet Senior", dept: "Projets", email: "i.diallo@coya.sn", phone: "+221 77 123 45 67", location: "Dakar", status: "Actif", rating: 4.8, salary: "850,000", joined: "15/03/2019", avatar: "ID" },
  { id: "EMP-002", name: "Fatou Diop", role: "Architecte Système", dept: "IT", email: "f.diop@coya.sn", phone: "+221 78 234 56 78", location: "Dakar", status: "Actif", rating: 4.6, salary: "780,000", joined: "01/07/2020", avatar: "FD" },
  { id: "EMP-003", name: "Moussa Ndiaye", role: "Responsable Formation", dept: "Formations", email: "m.ndiaye@coya.sn", phone: "+221 76 345 67 89", location: "Thiès", status: "Actif", rating: 4.5, salary: "650,000", joined: "10/01/2021", avatar: "MN" },
  { id: "EMP-004", name: "Aïda Sall", role: "Directrice Financière", dept: "Comptabilité", email: "a.sall@coya.sn", phone: "+221 77 456 78 90", location: "Dakar", status: "Actif", rating: 4.9, salary: "1,200,000", joined: "01/02/2018", avatar: "AS" },
  { id: "EMP-005", name: "Cheikh Fall", role: "Ingénieur Télécom", dept: "Infrastructure", email: "c.fall@coya.sn", phone: "+221 70 567 89 01", location: "Saint-Louis", status: "Actif", rating: 4.3, salary: "720,000", joined: "15/06/2021", avatar: "CF" },
  { id: "EMP-006", name: "Rokhaya Gueye", role: "Développeuse Full Stack", dept: "IT", email: "r.gueye@coya.sn", phone: "+221 78 678 90 12", location: "Dakar", status: "Actif", rating: 4.7, salary: "700,000", joined: "20/09/2022", avatar: "RG" },
  { id: "EMP-007", name: "Omar Badji", role: "Directeur Travaux", dept: "Infrastructure", email: "o.badji@coya.sn", phone: "+221 77 789 01 23", location: "Ziguinchor", status: "Congé", rating: 4.4, salary: "900,000", joined: "05/04/2017", avatar: "OB" },
  { id: "EMP-008", name: "Aminata Sarr", role: "Commerciale Senior", dept: "CRM", email: "a.sarr@coya.sn", phone: "+221 76 890 12 34", location: "Dakar", status: "Actif", rating: 4.8, salary: "600,000", joined: "01/11/2022", avatar: "AM" },
  { id: "EMP-009", name: "Pape Diagne", role: "Logisticien", dept: "Logistique", email: "p.diagne@coya.sn", phone: "+221 77 901 23 45", location: "Dakar", status: "Actif", rating: 4.2, salary: "450,000", joined: "12/03/2023", avatar: "PD" },
  { id: "EMP-010", name: "Ndéye Faye", role: "RH Manager", dept: "RH", email: "n.faye@coya.sn", phone: "+221 70 012 34 56", location: "Dakar", status: "Actif", rating: 4.6, salary: "750,000", joined: "08/08/2020", avatar: "NF" },
];

const deptColors: Record<string, string> = {
  "Projets": "bg-violet-100 text-violet-700",
  "IT": "bg-blue-100 text-blue-700",
  "Formations": "bg-pink-100 text-pink-700",
  "Comptabilité": "bg-yellow-100 text-yellow-700",
  "Infrastructure": "bg-cyan-100 text-cyan-700",
  "CRM": "bg-emerald-100 text-emerald-700",
  "Logistique": "bg-teal-100 text-teal-700",
  "RH": "bg-green-100 text-green-700",
};

const avatarColors = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-pink-500", "bg-cyan-500", "bg-red-500", "bg-indigo-500",
  "bg-teal-500", "bg-green-500"
];

export function RessourcesHumaines() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Tous");

  const depts = ["Tous", ...Array.from(new Set(employees.map(e => e.dept)))];
  const filtered = employees.filter(e => {
    const matchS = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchD = dept === "Tous" || e.dept === dept;
    return matchS && matchD;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Ressources Humaines</h2>
          <p className="text-gray-500 text-sm">{employees.length} collaborateurs</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvel Employé
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Effectifs", value: "87", icon: Users, color: "bg-blue-500" },
          { label: "Actifs", value: "79", icon: UserCheck, color: "bg-green-500" },
          { label: "En congé", value: "6", icon: UserX, color: "bg-amber-500" },
          { label: "Recrutements", value: "3", icon: Briefcase, color: "bg-violet-500" },
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
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {depts.map(d => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${dept === d ? "bg-[#0d1b2a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp, i) => (
          <div key={emp.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center`}>
                  <span className="text-white font-bold">{emp.avatar}</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{emp.name}</p>
                  <p className="text-gray-500 text-xs">{emp.role}</p>
                </div>
              </div>
              <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full ${deptColors[emp.dept] || "bg-gray-100 text-gray-600"}`}>{emp.dept}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${emp.status === "Actif" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{emp.status}</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Mail className="w-3.5 h-3.5" /> <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Phone className="w-3.5 h-3.5" /> {emp.phone}
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <MapPin className="w-3.5 h-3.5" /> {emp.location}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-gray-400 text-[10px]">Salaire mensuel</p>
                <p className="text-gray-700 text-sm font-medium">{emp.salary} FCFA</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-gray-700 text-sm font-medium">{emp.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
