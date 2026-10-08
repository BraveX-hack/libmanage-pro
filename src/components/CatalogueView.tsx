import React, { useState, useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types/library';
import { BookCard } from './BookCard';
import { Search, Filter, SlidersHorizontal, BookOpen } from 'lucide-react';

interface CatalogueViewProps {
  initialSearch?: string;
  onOpenBookDetails: (book: Book) => void;
}

// Recherche insensible à la casse et aux accents (ex. « litterature » trouve « Littérature »)
const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  initialSearch = '',
  onOpenBookDetails,
}) => {
  const { books } = useLibrary();

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'year'>('rating');

  const categories = [
    'Tous',
    'Informatique',
    'Littérature',
    'Droit',
    'Sciences',
    'Économie',
    'Philosophie',
  ];

  const filteredBooks = useMemo(() => {
    const needle = normalizeText(search);
    return books
      .filter((book) => {
        if (book.isArchived) return false;

        const matchesSearch =
          !needle ||
          normalizeText(book.title).includes(needle) ||
          normalizeText(book.author).includes(needle) ||
          book.isbn.replace(/-/g, '').includes(search.replace(/-/g, '').trim()) ||
          normalizeText(book.category).includes(needle);

        const matchesCat =
          selectedCategory === 'Tous' || book.category === selectedCategory;

        const matchesAvail = onlyAvailable ? book.stockAvailable > 0 : true;

        return matchesSearch && matchesCat && matchesAvail;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'year') return b.publishedYear - a.publishedYear;
        return a.title.localeCompare(b.title);
      });
  }, [books, search, selectedCategory, onlyAvailable, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Catalogue Documentaire
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explorez les manuels de référence, périodiques scientifiques et œuvres littéraires de l'université.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher titre, auteur, ISBN..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
          />
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Filter Buttons (Interactive controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-slate-900 focus:ring-slate-900"
            />
            <span className="font-medium">En stock uniquement</span>
          </label>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-medium">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'rating' | 'year')}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none"
            >
              <option value="rating">Les mieux notés</option>
              <option value="year">Année récente</option>
              <option value="title">Titre alphabétique</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-slate-900 mb-1">
            Aucun ouvrage ne correspond à votre recherche
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Essayez de modifier vos filtres ou de soumettre une suggestion d'achat dans votre espace lecteur.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('Tous');
              setOnlyAvailable(false);
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onOpenDetails={onOpenBookDetails} />
          ))}
        </div>
      )}
    </div>
  );
};
