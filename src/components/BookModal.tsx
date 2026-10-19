import React, { useState } from 'react';
import { Book } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { X, BookOpen, Clock, MapPin, Calendar, Layers, ShieldCheck, Check, Bookmark, Star, MonitorSmartphone } from 'lucide-react';
import { BookCover } from './BookCover';

interface BookModalProps {
  book: Book | null;
  onClose: () => void;
}

export const BookModal: React.FC<BookModalProps> = ({ book, onClose }) => {
  const { borrowBook, reserveBook, addToCart, cart, currentUser, readingAccesses, buyReading, openReader } = useLibrary();
  const [isBuyingReading, setIsBuyingReading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'backCover'>('details');

  if (!book) return null;

  const isInCart = cart.includes(book.id);
  const price = book.reservationPrice ?? 0;
  const priceLabel = price > 0 ? `${price.toLocaleString('fr-FR')} FCFA` : 'Gratuit';
  const activeAccess = readingAccesses.find(
    (x) => x.bookId === book.id && x.userId === currentUser?.id && x.status === 'active' && new Date(x.expiresAt).getTime() > Date.now()
  );
  const msLeft = activeAccess ? new Date(activeAccess.expiresAt).getTime() - Date.now() : 0;

  const handleRead = async () => {
    if (activeAccess) {
      openReader(book.id);
      onClose();
      return;
    }
    if (isBuyingReading) return;
    setIsBuyingReading(true);
    const res = await buyReading(book.id);
    setIsBuyingReading(false);
    if (res.success) onClose();
  };
  const isAvailable = book.stockAvailable > 0;

  const handleBorrow = async () => {
    const res = await borrowBook(book.id);
    if (res.success) {
      onClose();
    }
  };

  const handleReserve = async () => {
    const res = await reserveBook(book.id);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Notice Bibliographique
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-xs text-slate-500">ISBN {book.isbn}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Cover & Quick specs */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="relative aspect-[3/4] w-full max-w-[220px] rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-50">
              <BookCover
                book={book}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Availability Widget */}
            <div className="w-full mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-xs text-slate-500 mb-1">Disponibilité en rayon</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {book.stockAvailable}
                </span>
                <span className="text-xs text-slate-400">/ {book.stockTotal} ex. total</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                <span>{book.shelfLocation}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, metadata, summary and 4th cover */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div>
              {/* Unboxed discipline metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                <span className="text-amber-800 font-semibold">{book.category}</span>
                <span>·</span>
                <span>{book.publisher}</span>
                <span>·</span>
                <span className="tabular-nums">{book.publishedYear}</span>
                <span>·</span>
                <span className="tabular-nums">{book.pages} pages</span>
              </div>

              <h2 className="text-2xl font-serif font-bold text-slate-900 leading-snug">
                {book.title}
              </h2>
              <p className="text-sm font-medium text-slate-700 mt-1">Par {book.author}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{book.rating.toFixed(1)} / 5</span>
                </div>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{book.reviewsCount} avis d'étudiants</span>
              </div>

              {/* Tabs for 1st cover synopsis vs 4th cover editorial */}
              <div className="mt-5 border-b border-slate-200 flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 text-xs font-semibold transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-slate-900 text-slate-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Résumé de l'ouvrage
                </button>
                <button
                  onClick={() => setActiveTab('backCover')}
                  className={`pb-2 text-xs font-semibold transition-colors ${
                    activeTab === 'backCover'
                      ? 'border-b-2 border-slate-900 text-slate-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  4ème de Couverture
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-600 leading-relaxed min-h-[100px]">
                {activeTab === 'details' ? (
                  <p>{book.summary}</p>
                ) : (
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-slate-700 italic">
                    « {book.backCoverText} »
                  </div>
                )}
              </div>

              {/* Conditions box */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Règles de prêt universitaires :</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                  <li>Emprunt standard : 14 jours (prolongation possible 1 fois).</li>
                  <li>Réservation en ligne : exemplaire mis de côté 4 jours à la banque d'accueil.</li>
                  <li>
                    Prix de la réservation :{' '}
                    <strong className="text-amber-800">
                      {(book.reservationPrice ?? 0) > 0 ? `${(book.reservationPrice ?? 0).toLocaleString('fr-FR')} FCFA` : 'Gratuite'}
                    </strong>{' '}
                    (réglée en ligne via Bachs).
                  </li>
                  {book.hasDigitalContent && (
                    <li>
                      <strong>Lecture en ligne</strong> : même prix ({priceLabel}), lecture sur le site uniquement (pas de téléchargement),
                      <strong> 7 jours</strong> pour terminer à compter du paiement.
                    </li>
                  )}
                  <li>Un ticket de caisse officiel avec empreinte de sécurité est automatiquement délivré.</li>
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Fermer
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {book.hasDigitalContent && (
                  <button
                    onClick={handleRead}
                    disabled={isBuyingReading}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 transition-all flex items-center gap-2 shadow-xs"
                  >
                    <MonitorSmartphone className="w-4 h-4" />
                    <span>
                      {activeAccess
                        ? `Continuer la lecture (reste ${Math.floor(msLeft / 86400000) > 0 ? `${Math.floor(msLeft / 86400000)} j ` : ''}${Math.floor((msLeft % 86400000) / 3600000)} h)`
                        : isBuyingReading
                        ? 'Ouverture du paiement…'
                        : `Lire en ligne — ${priceLabel} · 7 jours`}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => addToCart(book.id)}
                  className={`px-5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-xs ${
                    isInCart
                      ? 'border-amber-600 text-amber-900 bg-amber-50'
                      : 'bg-slate-900 hover:bg-slate-800 text-white border-transparent'
                  }`}
                >
                  {isInCart ? <Check className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4 text-amber-400" />}
                  <span>{isInCart ? '✓ Déjà dans le Panier' : book.hasDigitalContent ? `Réserver le livre papier — ${priceLabel}` : 'Ajouter au Panier de Réservation'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
