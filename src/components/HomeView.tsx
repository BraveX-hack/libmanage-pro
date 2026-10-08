import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, SubscriptionPlan } from '../types/library';
import { HeroSection } from './HeroSection';
import { BookCard } from './BookCard';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  Award,
  Zap,
  Smartphone,
} from 'lucide-react';

interface HomeViewProps {
  onSearch: (query: string) => void;
  onNavigateCatalogue: () => void;
  onNavigateStudent: () => void;
  onNavigateSubscriptions: () => void;
  onOpenBookDetails: (book: Book) => void;
  onOpenQuittanceDemo: () => void;
  onSelectPlanToPay: (plan: SubscriptionPlan, amount: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  onNavigateCatalogue,
  onNavigateStudent,
  onNavigateSubscriptions,
  onOpenBookDetails,
  onOpenQuittanceDemo,
  onSelectPlanToPay,
}) => {
  const { books } = useLibrary();

  const featuredBooks = books.filter((b) => b.featured && !b.isArchived).slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <HeroSection
        onSearch={onSearch}
        onNavigateCatalogue={onNavigateCatalogue}
        onNavigateSecurity={onNavigateSubscriptions}
      />

      {/* Featured Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coups de Cœur & Recommandations des Professeurs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Sélections Académiques de la Semaine
            </h2>
          </div>

          <button
            onClick={onNavigateCatalogue}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-amber-800 transition-colors underline underline-offset-4"
          >
            <span>Voir tout le catalogue ({books.length} titres)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} onOpenDetails={onOpenBookDetails} />
          ))}
        </div>
      </section>

      {/* How it Works Section (3 steps) */}
      <section className="bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">
              Comment Réserver & Emprunter un Ouvrage
            </h2>
            <p className="text-xs text-slate-500">
              Procédure universitaire en 3 étapes pour tous les étudiants inscrits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  01
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base mb-2">
                  Recherchez & Réservez
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consultez la fiche détaillée, le rayon et réservez votre exemplaire en ligne. Le livre est réservé pendant 4 jours à la banque centrale d'accueil.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/60 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Compte à rebours 4 jours actif</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  02
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base mb-2">
                  Quittance & Envoi Email
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Générez votre quittance officielle imprimable avec QR Code sécurisé et recevez-la instantanément sur votre boîte email universitaire.
                </p>
              </div>
              <button
                onClick={onOpenQuittanceDemo}
                className="mt-4 pt-4 border-t border-slate-200/60 text-[11px] text-slate-700 hover:text-slate-950 font-semibold flex items-center gap-1.5 underline underline-offset-2"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Voir un exemple de quittance</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  03
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base mb-2">
                  Paiement Mobile & Prolongation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Souscrivez à un forfait supérieur par MTN Mobile Money, Moov ou Wave pour augmenter votre quota d'emprunt jusqu'à 5 ou 15 ouvrages.
                </p>
              </div>
              <button
                onClick={onNavigateSubscriptions}
                className="mt-4 pt-4 border-t border-slate-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 hover:underline"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Voir les modes de paiement</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans & Promotions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Formules d'Abonnement Universitaire</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">
            Des Forfaits Adaptés à Chaque Cycle d'Étude
          </h2>
          <p className="text-xs text-slate-500">
            Paiement mobile instantané par MTN Mobile Money, Moov Money, Wave ou Carte Bancaire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Offre Initiale
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Gratuit Universitaire</h3>
              <div className="mt-3 mb-4">
                <span className="text-3xl font-bold font-mono text-slate-900">0 FCFA</span>
                <span className="text-xs text-slate-500"> / an</span>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                Idéal pour les étudiants en première année souhaitant consulter les manuels de base.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span>2 livres empruntables en même temps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span>Durée de prêt : 14 jours</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span>Quittance numérique incluse</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onNavigateStudent}
              className="mt-6 w-full py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Plan Actif par Défaut
            </button>
          </div>

          {/* Plan 2: Featured Student Plus */}
          <div className="p-6 bg-slate-900 text-white border-2 border-amber-500 rounded-2xl shadow-lg relative flex flex-col justify-between">
            <div className="absolute -top-3 right-4 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-full shadow-xs">
              Recommandé Étudiants
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Offre Rentrée 2026 (-50%)
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Étudiant Plus</h3>
              <div className="mt-3 mb-4">
                <span className="text-3xl font-bold font-mono text-amber-400">2 500 FCFA</span>
                <span className="text-xs text-slate-400"> / semestre</span>
              </div>
              <p className="text-xs text-slate-300 mb-6">
                Conçu pour les étudiants préparant leurs examens, mémoires et projets.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>5 livres empruntables</strong> simultanément</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Réservation prioritaire 4 jours</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Prolongation en 1 clic depuis votre espace</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlanToPay('Étudiant Plus', 2500)}
              className="mt-6 w-full py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Souscrire via MoMo / Carte</span>
            </button>
          </div>

          {/* Plan 3 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Corps Enseignant & Thèse
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Recherche & Doctorat</h3>
              <div className="mt-3 mb-4">
                <span className="text-3xl font-bold font-mono text-slate-900">10 000 FCFA</span>
                <span className="text-xs text-slate-500"> / an</span>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                Pour doctorants, chercheurs et professeurs nécessitant des volumes importants.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span><strong>15 livres empruntables</strong> en continu</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <span>Durée étendue à 30 jours par emprunt</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onSelectPlanToPay('Recherche & Doctorat', 10000)}
              className="mt-6 w-full py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Souscrire (10 000 FCFA)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
