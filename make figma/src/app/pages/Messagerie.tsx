import { useState } from "react";
import { Send, Search, Plus, Paperclip, Smile, MoreVertical, Circle } from "lucide-react";

const contacts = [
  { id: 1, name: "Ibrahima Diallo", role: "Chef de Projet", avatar: "ID", online: true, unread: 2, lastMsg: "OK, je prépare le rapport...", time: "14:32", color: "bg-blue-500" },
  { id: 2, name: "Fatou Diop", role: "Architecte Système", avatar: "FD", online: true, unread: 0, lastMsg: "La démo est planifiée pour vendredi.", time: "13:15", color: "bg-violet-500" },
  { id: 3, name: "Aïda Sall", role: "Directrice Financière", avatar: "AS", online: false, unread: 1, lastMsg: "Voici le récapitulatif du budget Q2.", time: "11:45", color: "bg-yellow-500" },
  { id: 4, name: "Moussa Ndiaye", role: "Resp. Formation", avatar: "MN", online: true, unread: 0, lastMsg: "La salle est réservée pour lundi.", time: "10:20", color: "bg-emerald-500" },
  { id: 5, name: "Cheikh Fall", role: "Ingénieur Télécom", avatar: "CF", online: false, unread: 3, lastMsg: "L'installation avance bien à Saint-Louis.", time: "09:08", color: "bg-cyan-500" },
  { id: 6, name: "Rokhaya Gueye", role: "Développeuse", avatar: "RG", online: true, unread: 0, lastMsg: "Pull request envoyée pour review.", time: "Hier", color: "bg-pink-500" },
  { id: 7, name: "Direction COYA", role: "Groupe", avatar: "DC", online: true, unread: 5, lastMsg: "AG Mensuelle le 15 mai à 10h.", time: "Hier", color: "bg-indigo-500" },
];

type Message = { id: number; from: string; text: string; time: string; mine: boolean };
const conversations: Record<number, Message[]> = {
  1: [
    { id: 1, from: "Ibrahima Diallo", text: "Bonjour, avez-vous eu le temps de revoir le planning du projet SENATEL ?", time: "14:10", mine: false },
    { id: 2, from: "Moi", text: "Oui, j'ai quelques commentaires. Je vous envoie ça ce soir.", time: "14:15", mine: true },
    { id: 3, from: "Ibrahima Diallo", text: "Parfait ! Pensez-vous que nous sommes toujours dans les délais ?", time: "14:25", mine: false },
    { id: 4, from: "Moi", text: "Oui, mais la phase 3 risque d'être serrée. Il faut renforcer l'équipe.", time: "14:28", mine: true },
    { id: 5, from: "Ibrahima Diallo", text: "OK, je prépare le rapport pour vous soumettre les options.", time: "14:32", mine: false },
  ],
  7: [
    { id: 1, from: "Direction COYA", text: "Rappel : l'Assemblée Générale mensuelle est fixée au 15 mai 2025 à 10h00.", time: "Hier 16:00", mine: false },
    { id: 2, from: "Direction COYA", text: "Ordre du jour : Résultats Q1, Projets en cours, Points RH.", time: "Hier 16:02", mine: false },
    { id: 3, from: "Moi", text: "Bien reçu. Je préparerai la présentation financière.", time: "Hier 16:30", mine: true },
    { id: 4, from: "Direction COYA", text: "Merci. Pensez aussi à inclure les perspectives Q2.", time: "Hier 17:00", mine: false },
    { id: 5, from: "Direction COYA", text: "AG Mensuelle le 15 mai à 10h. Confirmation de présence requise.", time: "09:00", mine: false },
  ],
};

export function Messagerie() {
  const [selected, setSelected] = useState(1);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const contact = contacts.find(c => c.id === selected)!;
  const msgs = conversations[selected] || [
    { id: 1, from: contact.name, text: "Bonjour, comment puis-je vous aider ?", time: "09:00", mine: false },
  ];

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Contacts sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900">Messagerie</h3>
            <button className="w-8 h-8 rounded-xl bg-[#0d1b2a] text-white flex items-center justify-center hover:bg-[#1a3a5c] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${selected === c.id ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{c.avatar}</span>
                </div>
                {c.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-gray-800 text-sm font-medium truncate">{c.name}</p>
                  <span className="text-gray-400 text-[10px] shrink-0">{c.time}</span>
                </div>
                <p className="text-gray-400 text-xs truncate">{c.lastMsg}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full ${contact.color} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{contact.avatar}</span>
              </div>
              {contact.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="text-gray-900 font-medium text-sm">{contact.name}</p>
              <p className={`text-xs ${contact.online ? "text-green-500" : "text-gray-400"}`}>
                {contact.online ? "En ligne" : "Hors ligne"} · {contact.role}
              </p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {msgs.map(msg => (
            <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
              {!msg.mine && (
                <div className={`w-8 h-8 rounded-full ${contact.color} flex items-center justify-center mr-2 shrink-0 self-end`}>
                  <span className="text-white text-xs font-bold">{contact.avatar}</span>
                </div>
              )}
              <div className={`max-w-sm ${msg.mine ? "" : ""}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.mine ? "bg-[#0d1b2a] text-white rounded-br-sm" : "bg-white text-gray-800 shadow-sm rounded-bl-sm"}`}>
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${msg.mine ? "text-right" : ""}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center">
              <Paperclip className="w-4.5 h-4.5 text-gray-500" />
            </button>
            <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Écrire un message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setMessage("")}
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
              />
              <Smile className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            <button
              onClick={() => setMessage("")}
              className="w-9 h-9 rounded-xl bg-[#0d1b2a] hover:bg-[#1a3a5c] text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
