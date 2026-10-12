import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { ShoppingBag, ShieldCheck, UserCircle, LogOut, BookOpen } from 'lucide-react';

interface NavbarProps {
  currentTab: 'accueil' | 'catalogue' | 'etudiant' | 'admin' | 'abonnements';
  setCurrentTab: (tab: 'accueil' | 'catalogue' | 'etudiant' | 'admin' | 'abonnements') => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenCart,
}) => {
  const { currentUser, logoutUser, cart } = useLibrary();

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('accueil')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs overflow-hidden border border-slate-800">
            <BookOpen className="w-5 h-5 text-amber-400 group-hover:scale-105 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-serif tracking-tight text-slate-900">
              BiblioTech
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('accueil')}
            className={`transition-colors hover:text-slate-900 pb-0.5 ${
              currentTab === 'accueil'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : ''
            }`}
          >
            Accueil
          </button>

          <button
            onClick={() => setCurrentTab('catalogue')}
            className={`transition-colors hover:text-slate-900 pb-0.5 ${
              currentTab === 'catalogue'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : ''
            }`}
          >
            Catalogue
          </button>

          <button
            onClick={() => setCurrentTab('etudiant')}
            className={`transition-colors hover:text-slate-900 pb-0.5 ${
              currentTab === 'etudiant'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : ''
            }`}
          >
            Mes Emprunts & Quittances
          </button>

          <button
            onClick={() => setCurrentTab('abonnements')}
            className={`transition-colors hover:text-slate-900 pb-0.5 ${
              currentTab === 'abonnements'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : ''
            }`}
          >
            Abonnements & Tarifs
          </button>

          {/* Admin tab */}
          {isAdminOrSuper && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`inline-flex items-center gap-1.5 transition-colors pb-0.5 ${
                currentTab === 'admin'
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'text-emerald-700 hover:text-emerald-900 font-semibold'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Console d'Administration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            aria-label="Voir le panier d'emprunt"
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          {/* User Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('etudiant')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-slate-950 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <UserCircle className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[130px] truncate">{currentUser.name}</span>
              </button>
              <button
                onClick={logoutUser}
                title="Déconnexion"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
            >
              Connexion / Inscription
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 bg-white text-xs font-medium text-slate-600">
        <button
          onClick={() => setCurrentTab('accueil')}
          className={`py-1 ${currentTab === 'accueil' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Accueil
        </button>
        <button
          onClick={() => setCurrentTab('catalogue')}
          className={`py-1 ${currentTab === 'catalogue' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Catalogue
        </button>
        <button
          onClick={() => setCurrentTab('etudiant')}
          className={`py-1 ${currentTab === 'etudiant' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Emprunts
        </button>
        <button
          onClick={() => setCurrentTab('abonnements')}
          className={`py-1 ${currentTab === 'abonnements' ? 'text-slate-900 font-semibold' : ''}`}
        >
          Tarifs
        </button>
        {isAdminOrSuper && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`py-1 font-semibold ${currentTab === 'admin' ? 'text-emerald-700 underline' : 'text-slate-700'}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
