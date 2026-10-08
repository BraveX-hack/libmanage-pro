import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X, Trash2, Bookmark, ArrowRight, ShieldCheck, CheckCircle2, Download, Eye, Clock } from 'lucide-react';
import { Receipt } from '../types/library';
import { generateReceiptPDF } from '../utils/pdfGenerator';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { cart, books, removeFromCart, clearCart, checkoutCart, currentUser, setActiveReceipt, addToast } = useLibrary();
  const [confirmedReceipt, setConfirmedReceipt] = useState<Receipt | null>(null);

  if (!isOpen) return null;

  const cartBooks = books.filter((b) => cart.includes(b.id));
  const cartTotal = cartBooks.reduce((sum, b) => sum + (b.reservationPrice ?? 0), 0);
  const formatFcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

  const handleCheckout = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const res = await checkoutCart();
    if (res.success && res.receipt) {
      setConfirmedReceipt(res.receipt);
    }
  };

  const handleDownloadPDF = () => {
    if (!confirmedReceipt) return;
    try {
      generateReceiptPDF(confirmedReceipt);
      addToast('Quittance officielle téléchargée en PDF avec succès !', 'success');
    } catch (err) {
      console.error('Erreur PDF:', err);
      window.print();
    }
  };

  const handleViewReceipt = () => {
    if (!confirmedReceipt) return;
    setActiveReceipt(confirmedReceipt);
    setConfirmedReceipt(null);
    onClose();
  };

  const handleCloseModal = () => {
    setConfirmedReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-slate-900 text-lg">
              Panier de Réservation ({cart.length})
            </h2>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {confirmedReceipt ? (
            /* Post-Reservation Confirmation Screen */
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-slate-900 text-xl">
                  Réservation Enregistrée !
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ticket N° <strong className="font-mono text-slate-800">{confirmedReceipt.receiptNumber}</strong>
                </p>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Mise de côté pendant 4 jours :</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Vos <strong>{confirmedReceipt.items.length}</strong> livre(s) sont réservés et conservés à la <strong>Banque centrale d'accueil ESGIS (Guichet 2)</strong>.
                </p>
                <p className="text-[11px] text-slate-600">
                  Étudiant : <strong>{confirmedReceipt.userName}</strong> ({confirmedReceipt.academicLevel || 'Licence 2'} — {confirmedReceipt.filiere || 'IRTG'})
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger ma Quittance en PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleViewReceipt}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                    <span>Consulter la Quittance</span>
                  </button>

                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
                  >
                    Continuer mes recherches
                  </button>
                </div>
              </div>
            </div>
          ) : cartBooks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-600" />
              <p className="text-sm font-medium text-slate-700">Votre panier de réservation est vide.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Naviguez dans le catalogue et cliquez sur « Ajouter au panier » pour sélectionner les livres que vous souhaitez réserver.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Fonctionnement de la réservation :</strong> Chaque réservation est payante : réglez le total en ligne via <strong>Bachs</strong>. Une fois le paiement confirmé, les livres sont bloqués à votre nom pendant <strong>4 jours</strong> ; venez les récupérer au guichet avec votre ticket.
                </p>
              </div>

              <div className="space-y-2.5">
                {cartBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={book.coverUrl || `/images/${book.id}.jpg`}
                        alt={book.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/images/${book.id}.jpg`;
                        }}
                        className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <h4 className="font-serif font-bold text-slate-900 text-xs truncate">
                          {book.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          <span className="font-mono text-slate-600">{book.shelfLocation}</span>
                          <span>·</span>
                          <span className="font-semibold text-amber-800">
                            {(book.reservationPrice ?? 0) > 0 ? formatFcfa(book.reservationPrice ?? 0) : 'Gratuite'}
                          </span>
                          <span>·</span>
                          <span
                            className={`font-semibold ${
                              book.stockAvailable > 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {book.stockAvailable > 0 ? `${book.stockAvailable} dispo` : 'Sur réservation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(book.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Retirer du panier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {cartTotal > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center justify-between">
                  <span className="font-bold">Total à payer</span>
                  <span className="font-mono font-bold">{formatFcfa(cartTotal)}</span>
                </div>
              )}

              {/* Quota reminder */}
              {currentUser && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Abonnement : </span>
                    <span>{currentUser.subscriptionPlan}</span>
                  </div>
                  <div className="font-mono font-bold">
                    Quota max : {currentUser.maxLoans} ouvrages
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!confirmedReceipt && cartBooks.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={clearCart}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Vider le panier
            </button>

            <button
              onClick={handleCheckout}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>
                {!currentUser
                  ? 'Se connecter pour réserver'
                  : cartTotal > 0
                  ? `Payer ${formatFcfa(cartTotal)} et réserver (${cart.length})`
                  : `Confirmer la Réservation (${cart.length})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
