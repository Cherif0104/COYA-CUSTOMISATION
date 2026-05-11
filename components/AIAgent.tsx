import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

interface AIAgentProps {
  currentView: string;
  onOpenMessaging?: (target?: 'channels' | 'direct') => void;
  onOpenTicketIT?: () => void;
}

const AIAgent: React.FC<AIAgentProps> = ({ onOpenMessaging, onOpenTicketIT }) => {
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] right-4 z-50 md:bottom-6 md:right-6">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-14 w-14 transform items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:scale-110 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 md:h-16 md:w-16"
          aria-label={t('messagerie') || 'Messagerie'}
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-envelope'} text-2xl`} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-[calc(12.5rem+env(safe-area-inset-bottom,0px))] right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:bottom-24 md:right-6 md:w-full">
          <header className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <i className="fas fa-bolt" />
              {t('messagerie') || 'Messagerie'}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
              <i className="fas fa-times" />
            </button>
          </header>
          <main className="p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-3">
              Raccourcis rapides pour la messagerie et le support.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenMessaging?.('channels');
                  setIsOpen(false);
                }}
                className="text-left text-sm text-slate-700 py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium"
              >
                <i className="fas fa-hashtag mr-2" aria-hidden />
                Canaux
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenMessaging?.('direct');
                  setIsOpen(false);
                }}
                className="text-left text-sm text-slate-700 py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium"
              >
                <i className="fas fa-comment-dots mr-2" aria-hidden />
                Direct
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenMessaging?.('channels');
                  setIsOpen(false);
                }}
                className="text-left text-sm text-slate-700 py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium"
              >
                <i className="fas fa-inbox mr-2" aria-hidden />
                Messagerie
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenTicketIT?.();
                  setIsOpen(false);
                }}
                className="text-left text-sm text-slate-700 py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium"
              >
                <i className="fas fa-ticket-alt mr-2" aria-hidden />
                Ticket IT
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default AIAgent;
