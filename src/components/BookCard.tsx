import React from 'react';
import { Book } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { BookOpen, Bookmark, Star, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  onOpenDetails: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onOpenDetails }) => {
  const { borrowBook, reserveBook, addToCart, cart, currentUser } = useLibrary();

  const isInCart = cart.includes(book.id);
  const isAvailable = book.stockAvailable > 0;

  const handleQuickBorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    borrowBook(book.id);
  };

  const handleQuickReserve = (e: React.MouseEvent) => {
    e.stopPropagation();
    reserveBook(book.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(book.id);
  };

  return (
    <div
      onClick={() => onOpenDetails(book)}
      className="group relative bg-white border border-slate-200/90 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
        <BookCover
          book={book}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
        />

        {/* Floating Stock Availability Indicator */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isAvailable ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-emerald-800 shadow-xs border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{book.stockAvailable} dispo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[11px] font-semibold text-amber-800 shadow-xs border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Sur réservation</span>
            </div>
          )}
        </div>

        {/* Quick Cart Button */}
        <button
          onClick={handleAddToCart}
          title={isInCart ? 'Déjà dans le panier' : 'Ajouter au panier d\'emprunt'}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-lg shadow-sm backdrop-blur-sm transition-all ${
            isInCart
              ? 'bg-amber-600 text-white'
              : 'bg-white/90 text-slate-700 hover:bg-slate-900 hover:text-white'
          }`}
        >
          {isInCart ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean Unboxed Metadata (Discipline Zero-Pill) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span>{book.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{book.publishedYear}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 font-mono text-[11px]">{book.shelfLocation}</span>
          </div>

          <h3 className="font-serif font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
            {book.title}
          </h3>

          <p className="text-xs text-slate-600 mt-1 line-clamp-1">{book.author}</p>
          <p className="text-xs font-semibold text-amber-800 mt-1">
            Réservation : {(book.reservationPrice ?? 0) > 0 ? `${(book.reservationPrice ?? 0).toLocaleString('fr-FR')} FCFA` : 'Gratuite'}
          </p>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {book.summary}
          </p>
        </div>

        {/* Footer Area with Rating and Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-mono tabular-nums">{book.rating.toFixed(1)}</span>
            <span className="text-slate-400 text-[11px]">({book.reviewsCount})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isInCart
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dans le panier</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ajouter au panier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
