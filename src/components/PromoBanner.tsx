import React, { useState } from 'react';
import { Sparkles, Calendar, ArrowRight, X } from 'lucide-react';

interface PromoBannerProps {
  onExploreOffer?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onExploreOffer }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-amber-300 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Rentrée Académique 2026 :
            </span>
            <span className="text-slate-200 truncate">
              Quota d'emprunt étendu à 5 ouvrages + réservations en ligne valables 4 jours pour tous les étudiants inscrits !
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onExploreOffer && (
            <button
              onClick={onExploreOffer}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors underline underline-offset-2 whitespace-nowrap"
            >
              <span>En savoir plus</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            aria-label="Fermer la bannière"
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
