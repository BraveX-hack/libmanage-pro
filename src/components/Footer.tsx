import React from 'react';
import { BookOpen, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: 'accueil' | 'catalogue' | 'etudiant' | 'admin' | 'abonnements') => void;
  onResetDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab, onResetDemo }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Presentation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-base tracking-tight">BiblioTech</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Plateforme universitaire de gestion documentaire. Réservations 4 jours, quittances certifiées et paiement mobile.
            </p>
            {onResetDemo && (
              <div className="pt-2">
                <button
                  onClick={onResetDemo}
                  className="text-[11px] text-slate-400 hover:text-amber-400 underline underline-offset-2 transition-colors"
                >
                  Réinitialiser la simulation
                </button>
              </div>
            )}
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button
                  onClick={() => onNavigateTab('accueil')}
                  className="hover:text-white transition-colors"
                >
                  Page d'accueil
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('catalogue')}
                  className="hover:text-white transition-colors"
                >
                  Catalogue des ouvrages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('etudiant')}
                  className="hover:text-white transition-colors"
                >
                  Mes emprunts & quittances
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('abonnements')}
                  className="hover:text-white transition-colors"
                >
                  Tarifs & paiements
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('admin')}
                  className="hover:text-emerald-400 text-slate-300 font-medium transition-colors"
                >
                  Console d'Administration
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Horaires & Règlements */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
              Horaires & Règlements
            </h4>
            <div className="text-slate-400 space-y-1">
              <div>Lundi – Vendredi : 07h30 – 21h00</div>
              <div>Samedi : 08h00 – 18h00</div>
              <div>Projet Académique : <strong>ESGIS</strong></div>
              <div className="text-slate-500 pt-1 text-[11px]">
                Prêt standard : 14 jours · Prolongation 1x
              </div>
              <div className="text-slate-500 text-[11px]">
                Retard : 200 FCFA / jour ouvrable
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Direction */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider">
              Équipe & Contact
            </h4>
            <div className="text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ESGIS — Campus Universitaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>contact@esgis.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono font-medium">+229 01 62 66 21 32</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} BiblioTech.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Système sécurisé TLS 1.3 & Argon2id</span>
            </span>
            <span>·</span>
            <span>Normes de catalogage ISBD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
