import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar } from "lucide-react";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const events = [
  { id: 1, title: "Réunion direction", date: "2025-05-06", time: "09:00", end: "10:30", type: "reunion", color: "bg-blue-500", participants: 8 },
  { id: 2, title: "Sprint Review SENATEL", date: "2025-05-07", time: "14:00", end: "16:00", type: "projet", color: "bg-violet-500", participants: 5 },
  { id: 3, title: "Formation équipe RH", date: "2025-05-08", time: "10:00", end: "12:00", type: "formation", color: "bg-pink-500", participants: 12 },
  { id: 4, title: "Audit comptable Q1", date: "2025-05-09", time: "08:30", end: "17:00", type: "audit", color: "bg-amber-500", participants: 3 },
  { id: 5, title: "Présentation client Port", date: "2025-05-12", time: "10:00", end: "11:30", type: "client", color: "bg-emerald-500", participants: 6 },
  { id: 6, title: "Maintenance Parc Auto", date: "2025-05-13", time: "08:00", end: "12:00", type: "maintenance", color: "bg-orange-500", participants: 2 },
  { id: 7, title: "Clôture projet OFPT", date: "2025-05-15", time: "15:00", end: "17:00", type: "projet", color: "bg-cyan-500", participants: 7 },
  { id: 8, title: "Réunion budgétaire", date: "2025-05-19", time: "09:00", end: "11:00", type: "reunion", color: "bg-blue-500", participants: 4 },
  { id: 9, title: "Formation Sécurité IT", date: "2025-05-21", time: "14:00", end: "16:00", type: "formation", color: "bg-pink-500", participants: 20 },
  { id: 10, title: "Revue mensuelle", date: "2025-05-28", time: "10:00", end: "12:00", type: "reunion", color: "bg-blue-500", participants: 15 },
];

const ganttTasks = [
  { id: 1, name: "Infrastructure SENATEL", start: 1, duration: 6, color: "bg-blue-500", progress: 72 },
  { id: 2, name: "Gestion Portuaire", start: 3, duration: 5, color: "bg-violet-500", progress: 45 },
  { id: 3, name: "Formation OFPT", start: 2, duration: 3, color: "bg-green-500", progress: 90 },
  { id: 4, name: "Réseau Fibre Saint-Louis", start: 4, duration: 7, color: "bg-cyan-500", progress: 28 },
  { id: 5, name: "App Mobile Banque Atl.", start: 6, duration: 6, color: "bg-amber-500", progress: 0 },
  { id: 6, name: "Centrale Solaire Thiès", start: 3, duration: 10, color: "bg-red-500", progress: 15 },
];

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year: number, month: number) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function Planification() {
  const [currentMonth, setCurrentMonth] = useState(4); // May
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<string | null>("2025-05-06");
  const [activeTab, setActiveTab] = useState<"calendar" | "gantt">("calendar");

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDay(currentYear, currentMonth);

  const goBack = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goForward = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Planification</h2>
          <p className="text-gray-500 text-sm">Calendrier et planification des activités</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            {(["calendar", "gantt"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm transition-colors ${activeTab === tab ? "bg-[#0d1b2a] text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {tab === "calendar" ? "Calendrier" : "Gantt"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-[#0d1b2a] text-white px-4 py-2.5 rounded-xl hover:bg-[#1a3a5c] transition-colors text-sm">
            <Plus className="w-4 h-4" /> Événement
          </button>
        </div>
      </div>

      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={goBack} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h3 className="text-gray-900">{MONTHS[currentMonth]} {currentYear}</h3>
              <button onClick={goForward} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = getEventsForDay(day);
                const isToday = dateStr === "2025-05-06";
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-24 border-b border-r border-gray-50 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                  >
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs mb-1 ${isToday ? "bg-blue-500 text-white font-bold" : "text-gray-700"}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} className={`${ev.color} text-white text-[9px] px-1.5 py-0.5 rounded truncate`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-gray-400 text-[9px]">+{dayEvents.length - 2} autres</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-gray-900 mb-1">
              {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Sélectionnez une date"}
            </h3>
            <p className="text-gray-400 text-xs mb-4">{selectedEvents.length} événement(s)</p>

            {selectedEvents.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun événement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className={`p-3 rounded-xl border-l-4 bg-gray-50`} style={{ borderLeftColor: ev.color.replace("bg-", "") }}>
                    <div className={`inline-block w-2 h-2 rounded-full ${ev.color} mb-2`} />
                    <p className="text-gray-800 text-sm font-medium">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" /> {ev.time} – {ev.end}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Users className="w-3 h-3" /> {ev.participants}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-gray-700 text-sm font-medium mb-3">Prochains événements</p>
              <div className="space-y-2">
                {events.slice(0, 4).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ev.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-xs truncate">{ev.title}</p>
                      <p className="text-gray-400 text-[10px]">{ev.date} · {ev.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "gantt" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-gray-900">Diagramme de Gantt — Projets 2025</h3>
            <p className="text-gray-400 text-sm mt-1">Vue d'ensemble temporelle des projets</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="flex border-b border-gray-100">
                <div className="w-48 shrink-0 px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Projet</div>
                <div className="flex-1 grid grid-cols-12">
                  {MONTH_LABELS.map(m => (
                    <div key={m} className="text-center py-3 text-xs font-semibold text-gray-400 uppercase border-l border-gray-100">{m}</div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              {ganttTasks.map(task => (
                <div key={task.id} className="flex items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="w-48 shrink-0 px-4 py-4">
                    <p className="text-gray-700 text-sm">{task.name}</p>
                    <p className="text-gray-400 text-xs">{task.progress}%</p>
                  </div>
                  <div className="flex-1 relative py-4 pr-4">
                    <div className="h-2 bg-gray-100 rounded-full w-full" />
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-7 ${task.color} rounded-lg flex items-center px-2 opacity-90`}
                      style={{
                        left: `${((task.start - 1) / 12) * 100}%`,
                        width: `${(task.duration / 12) * 100}%`,
                      }}
                    >
                      <div className="h-1.5 bg-white/40 rounded-full" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
