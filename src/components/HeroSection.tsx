import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Search, ArrowRight, ShieldCheck, BookOpen, Clock, Users, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onNavigateCatalogue: () => void;
  onNavigateSecurity: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onNavigateCatalogue,
  onNavigateSecurity,
}) => {
  const { books, loans, reservations, users } = useLibrary();
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      onSearch(localSearch.trim());
      onNavigateCatalogue();
    }
  };

  const totalBooks = books.reduce((acc, b) => acc + b.stockTotal, 0);
  const activeLoans = loans.filter((l) => l.status !== 'rendu').length;
  const activeReservations = reservations.filter((r) => r.status === 'active').length;

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white">
      {/* Background Hero Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_library_hall_1790865043506.jpg"
          alt="Grande salle de lecture de la bibliothèque universitaire"
          className="w-full h-full object-cover object-center opacity-30 filter brightness-75 contrast-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl">
          {/* Subtle natural kicker */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Portail Universitaire des Ressources Documentaires · 2GroupESGIS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white text-balance leading-tight mb-6">
            Découvrez, réservez et empruntez le savoir sans friction.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
            Accédez à plus de 10 000 ouvrages académiques, traités de droit, manuels d'ingénierie et littérature critique. Réservations en ligne valables 4 jours avec quittance numérique certifiée.
          </p>

          {/* Search bar inside hero */}
          <form onSubmit={handleSearchSubmit} className="mb-8 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Rechercher par titre, auteur, discipline ou ISBN (ex: Cormen, Droit...)"
                className="w-full pl-12 pr-32 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Chercher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Quick search tags */}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Recherches fréquentes :</span>
              <button
                type="button"
                onClick={() => {
                  onSearch('Informatique');
                  onNavigateCatalogue();
                }}
                className="hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                Informatique
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  onSearch('Droit');
                  onNavigateCatalogue();
                }}
                className="hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                Droit des Obligations
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  onSearch('Hugo');
                  onNavigateCatalogue();
                }}
                className="hover:text-amber-300 transition-colors underline underline-offset-2"
              >
                Victor Hugo
              </button>
            </div>
          </form>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onNavigateCatalogue}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-amber-500/20 flex items-center gap-2"
            >
              <span>Consulter le Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateSecurity}
              className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Atelier Sécurité & Code PHP</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid (Aligned to quantitative rigor) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Exemplaires en Rayon</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalBooks} ouvrages
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {books.length} titres indexés
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Prêts en Cours</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {activeLoans} actifs
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Durée maximale 14 jours
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Réservations en Ligne</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {activeReservations} tickets
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Expiration sous 4 jours
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Membres Inscrits</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {users.length} étudiants
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Comptes vérifiés
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
