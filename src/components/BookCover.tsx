import React, { useState } from 'react';
import { Book } from '../types/library';

interface BookCoverProps {
  book: Book;
  className?: string;
  containerClassName?: string;
}

// Couvertures photographiques réelles enregistrées en local dans /public/images/
const DEFAULT_BOOK_COVERS: Record<string, string> = {
  'book-1': '/images/book-1.jpg',
  'book-2': '/images/book-2.jpg',
  'book-3': '/images/book-3.jpg',
  'book-4': '/images/book-4.jpg',
  'book-5': '/images/book-5.jpg',
  'book-6': '/images/book-6.jpg',
  'book-7': '/images/book-7.jpg',
  'book-8': '/images/book-8.jpg',
};

// Couleurs authentiques par catégorie
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Informatique: { bg: 'from-blue-950 via-slate-900 to-indigo-950', text: 'text-sky-400', border: 'border-sky-500/40' },
  Littérature: { bg: 'from-purple-950 via-indigo-950 to-slate-950', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40' },
  Droit: { bg: 'from-rose-950 via-red-950 to-neutral-950', text: 'text-rose-400', border: 'border-rose-500/40' },
  Économie: { bg: 'from-amber-950 via-yellow-950 to-stone-950', text: 'text-amber-400', border: 'border-amber-500/40' },
  Sciences: { bg: 'from-emerald-950 via-teal-950 to-slate-950', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  Philosophie: { bg: 'from-slate-900 via-zinc-950 to-neutral-900', text: 'text-slate-300', border: 'border-slate-500/40' },
};

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full',
}) => {
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Utiliser la vraie image locale
  const primarySrc = DEFAULT_BOOK_COVERS[book.id] || book.coverUrl || `/images/${book.id}.jpg`;
  const currentSrc = triedFallback ? `/images/${book.id}.jpg` : primarySrc;

  if (hasError) {
    const style = CATEGORY_STYLES[book.category] || {
      bg: 'from-slate-900 to-slate-950',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
    };

    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br ${style.bg} text-white select-none relative overflow-hidden border ${style.border}`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/50 border-r border-white/20" />
        <div className="pl-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
              {book.category}
            </span>
          </div>
          <h4 className="font-serif font-bold text-sm sm:text-base leading-snug mt-2 line-clamp-3 text-white">
            {book.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1.5 line-clamp-1 font-medium">{book.author}</p>
        </div>
        <div className="pl-2 flex items-center justify-between border-t border-white/15 pt-2 text-[10px] text-slate-400">
          <span className="font-sans">{book.publishedYear}</span>
          <span className="font-mono text-amber-300 font-bold">{book.shelfLocation}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={book.title}
      loading="eager"
      onError={() => {
        if (!triedFallback) {
          setTriedFallback(true);
        } else {
          setHasError(true);
        }
      }}
      className={className}
    />
  );
};
