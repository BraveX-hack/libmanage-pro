import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { SubscriptionPlan } from '../types/library';
import { Award, Check, Smartphone, CreditCard, ShieldCheck, Zap } from 'lucide-react';

interface SubscriptionViewProps {
  onSelectPlanToPay: (plan: SubscriptionPlan, amount: number) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onSelectPlanToPay }) => {
  const { currentUser, transactions } = useLibrary();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
          <Award className="w-4 h-4" />
          <span>Abonnements & Tarifs Universitaires</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mb-3">
          Choisissez Votre Formule de Prêt
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Paiement mobile instantané via <strong>MTN Mobile Money</strong>, <strong>Moov Money</strong>, <strong>Wave</strong> ou <strong>Carte Bancaire</strong>. Activation immédiate du quota de livres et délivrance de quittance certifiée.
        </p>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Plan 1 */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Formule Initiale
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900">Gratuit Universitaire</h3>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-bold font-mono text-slate-900">0 FCFA</span>
              <span className="text-xs text-slate-500"> / an</span>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              Idéal pour une utilisation ponctuelle et la consultation sur place.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>2 livres empruntables</strong> en simultané</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Durée de prêt de 14 jours</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quittances numériques avec QR code</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            {currentUser?.subscriptionPlan === 'Gratuit' ? (
              <span className="block text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                Formule Actuellement Active
              </span>
            ) : (
              <span className="block text-center py-2 text-xs font-medium text-slate-400">
                Inclus d'office
              </span>
            )}
          </div>
        </div>

        {/* Plan 2: Best Value */}
        <div className="p-6 bg-slate-900 text-white border-2 border-amber-500 rounded-2xl shadow-xl relative flex flex-col justify-between">
          <div className="absolute -top-3.5 right-6 px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-full shadow-xs">
            Formule Recommandée
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              Étudiant Plus
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">Semestre Académique</h3>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-bold font-mono text-amber-400">2 500 FCFA</span>
              <span className="text-xs text-slate-400"> / semestre</span>
            </div>
            <p className="text-xs text-slate-300 mb-6">
              Idéal pour préparer les sessions d'examens, mémoires et projets de groupe.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>5 livres empruntables</strong> en même temps</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Réservation prioritaire 4 jours en ligne</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Prolongation de 14 jours en 1 clic</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Notification de rappel par SMS / Email</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            {currentUser?.subscriptionPlan === 'Étudiant Plus' ? (
              <span className="block text-center py-2.5 text-xs font-semibold text-amber-400 bg-amber-400/10 rounded-xl border border-amber-500/30">
                Votre Formule Active
              </span>
            ) : (
              <button
                onClick={() => onSelectPlanToPay('Étudiant Plus', 2500)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Souscrire (2 500 FCFA)</span>
              </button>
            )}
          </div>
        </div>

        {/* Plan 3 */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Niveau Supérieur
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900">Recherche & Doctorat</h3>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-bold font-mono text-slate-900">10 000 FCFA</span>
              <span className="text-xs text-slate-500"> / an</span>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              Pour chercheurs, thésards et enseignants nécessitant un accès illimité.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>15 à 20 livres empruntables</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prêts longue durée (30 jours)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Accès aux archives patrimoniales rares</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            {currentUser?.subscriptionPlan === 'Recherche & Doctorat' ? (
              <span className="block text-center py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                Formule Active
              </span>
            ) : (
              <button
                onClick={() => onSelectPlanToPay('Recherche & Doctorat', 10000)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
              >
                Souscrire (10 000 FCFA)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions History if any */}
      {transactions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="font-serif font-bold text-slate-900 text-base mb-4">
            Historique des Règlements Mobile Money & Banque
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Réf. Transaction</th>
                  <th className="py-2.5 px-3">Bénéficiaire</th>
                  <th className="py-2.5 px-3">Formule</th>
                  <th className="py-2.5 px-3">Montant</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {tx.transactionRef}
                    </td>
                    <td className="py-2.5 px-3">{tx.userName}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{tx.plan ?? (tx.kind === 'reservation' ? 'Réservation de livres' : '')}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {tx.amount.toLocaleString('fr-FR')} {tx.currency}
                    </td>
                    <td className="py-2.5 px-3">{tx.paymentMethod}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Payé & Validé
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
