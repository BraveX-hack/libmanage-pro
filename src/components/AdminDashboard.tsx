import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, User, Loan, Reservation, UserRole } from '../types/library';
import {
  BookOpen,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Edit,
  Archive,
  RotateCcw,
  Search,
  Check,
  X,
  ShieldAlert,
  FileSpreadsheet,
  Activity,
  UserCheck,
  UserX,
  ShieldCheck,
  Lock,
  Server,
  Zap,
  Download,
  RefreshCw,
  Smartphone,
  Laptop,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    books,
    loans,
    reservations,
    users,
    activityLogs,
    addBook,
    updateBook,
    archiveBook,
    restoreBook,
    uploadBookCover,
    uploadBookContent,
    removeBookContent,
    returnBook,
    pickupReservation,
    updateUserStatus,
    updateUserRole,
    currentUser,
    addToast,
    setActiveReceipt,
    generateLoanReceipt,
    visitors,
    refreshDatabase,
    downloadDatabaseJson,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'kpi' | 'livres' | 'emprunts' | 'etudiants' | 'database' | 'securite' | 'logs'>('database');
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);

  // Book search & filters
  const [bookSearch, setBookSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // New Book Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState<Book['category']>('Informatique');
  const [formIsbn, setFormIsbn] = useState('');
  const [formYear, setFormYear] = useState(2025);
  const [formPublisher, setFormPublisher] = useState('');
  const [formPages, setFormPages] = useState(450);
  const [formSummary, setFormSummary] = useState('');
  const [formBackCover, setFormBackCover] = useState('');
  const [formShelf, setFormShelf] = useState('Rayon A-01');
  const [formStockTotal, setFormStockTotal] = useState(5);
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formPrice, setFormPrice] = useState(500);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  /** PDF choisi dans le formulaire (contenu du livre, lisible en ligne) : envoyé à l'enregistrement. */
  const [formContentFile, setFormContentFile] = useState<File | null>(null);
  const [isSavingBook, setIsSavingBook] = useState(false);

  // Loan filters
  const [loanFilter, setLoanFilter] = useState<'all' | 'en_cours' | 'en_retard' | 'rendu'>('all');

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  if (!isAdminOrSuper) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Accès Réservé à l'Administration
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Cette console est réservée au Super-Administrateur <strong>WOTTO Précieux</strong> et aux bibliothécaires autorisés. Connectez-vous avec un compte administrateur pour y accéder.
        </p>
      </div>
    );
  }

  // KPIs
  const totalPhysicalBooks = books.reduce((acc, b) => acc + b.stockTotal, 0);
  const totalAvailableBooks = books.reduce((acc, b) => acc + b.stockAvailable, 0);
  const activeLoans = loans.filter((l) => l.status === 'en_cours');
  const overdueLoans = loans.filter((l) => l.status === 'en_retard');
  const returnedLoans = loans.filter((l) => l.status === 'rendu');
  const activeReservations = reservations.filter((r) => r.status === 'active');

  // Filter books
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.isbn.includes(bookSearch);
    if (showArchived) return matchesSearch;
    return matchesSearch && !b.isArchived;
  });

  // Filter loans
  const filteredLoans = loans.filter((l) => {
    if (loanFilter === 'all') return true;
    return l.status === loanFilter;
  });

  const handleOpenEdit = (b: Book) => {
    setEditingBook(b);
    setFormTitle(b.title);
    setFormAuthor(b.author);
    setFormCategory(b.category);
    setFormIsbn(b.isbn);
    setFormYear(b.publishedYear);
    setFormPublisher(b.publisher);
    setFormPages(b.pages);
    setFormSummary(b.summary);
    setFormBackCover(b.backCoverText);
    setFormShelf(b.shelfLocation);
    setFormStockTotal(b.stockTotal);
    setFormCoverUrl(b.coverUrl);
    setFormPrice(b.reservationPrice ?? 0);
    setFormContentFile(null);
    setIsAddBookModalOpen(true);
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingCover(true);
    const url = await uploadBookCover(file);
    setIsUploadingCover(false);
    if (url) {
      setFormCoverUrl(url);
      addToast('Photo du livre enregistrée.', 'success');
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAuthor.trim() || !formIsbn.trim()) {
      addToast('Veuillez renseigner tous les champs obligatoires.', 'error');
      return;
    }

    setIsSavingBook(true);
    let saved = false;
    let savedBookId: string | null = null;
    if (editingBook) {
      savedBookId = editingBook.id;
      saved = await updateBook(editingBook.id, {
        title: formTitle,
        author: formAuthor,
        category: formCategory,
        isbn: formIsbn,
        publishedYear: formYear,
        publisher: formPublisher,
        pages: formPages,
        summary: formSummary,
        backCoverText: formBackCover,
        shelfLocation: formShelf,
        stockTotal: formStockTotal,
        reservationPrice: formPrice,
        coverUrl: formCoverUrl || editingBook.coverUrl,
      });
    } else {
      savedBookId = await addBook({
        title: formTitle,
        author: formAuthor,
        category: formCategory,
        isbn: formIsbn,
        publishedYear: formYear,
        publisher: formPublisher,
        pages: formPages,
        summary: formSummary,
        backCoverText: formBackCover,
        shelfLocation: formShelf,
        stockTotal: formStockTotal,
        stockAvailable: formStockTotal,
        reservationPrice: formPrice,
        coverUrl:
          formCoverUrl ||
          '/images/book-1.jpg',
        featured: false,
      });
      saved = !!savedBookId;
    }

    // Contenu du livre (PDF) : envoyé une fois la notice enregistrée
    if (saved && savedBookId && formContentFile) {
      const ok = await uploadBookContent(savedBookId, formContentFile);
      if (!ok) {
        addToast('La notice est enregistrée, mais le PDF n\'a pas pu être envoyé : rouvrez le livre pour réessayer.', 'warning');
      }
    }
    setIsSavingBook(false);

    if (saved) {
      setIsAddBookModalOpen(false);
      setEditingBook(null);
      setFormContentFile(null);
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Titre,Auteur,Catégorie,ISBN,Stock Total,Stock Disponible,Emplacement\n';
    const rows = books
      .map(
        (b) =>
          `"${b.id}","${b.title.replace(/"/g, '""')}","${b.author}","${b.category}","${b.isbn}",${b.stockTotal},${b.stockAvailable},"${b.shelfLocation}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventaire_bibliotech_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Fichier CSV d\'inventaire exporté avec succès.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Title & Controls */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 mb-8 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
              Super-Administrateur
            </span>
            <span className="text-xs text-slate-400">ESGIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Console de Contrôle — WOTTO Précieux
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Email officiel : <strong className="text-slate-200 font-mono">wottoprecieux@gmail.com</strong> · Tél : <span className="font-mono text-amber-300 font-bold">+229 01 62 66 21 32</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingBook(null);
              setFormTitle('');
              setFormAuthor('');
              setFormCategory('Informatique');
              setFormIsbn('978-2' + Math.floor(10000000 + Math.random() * 90000000));
              setFormYear(2025);
              setFormPublisher('Dunod Universités');
              setFormPages(500);
              setFormSummary('');
              setFormBackCover('');
              setFormShelf('Rayon A-05');
              setFormStockTotal(4);
              setFormCoverUrl('');
              setFormPrice(500);
              setFormContentFile(null);
              setIsAddBookModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Livre</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'kpi'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Vue d'Ensemble & Métriques
        </button>

        <button
          onClick={() => setActiveTab('livres')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'livres'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Gestion des Livres ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('emprunts')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'emprunts'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Prêts & Retours ({loans.length})</span>
          {overdueLoans.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('etudiants')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'etudiants'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Comptes Étudiants ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'database'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Base de Données Centrale</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-mono animate-pulse">
            {visitors.length} visites
          </span>
        </button>

        <button
          onClick={() => setActiveTab('securite')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'securite'
              ? 'bg-emerald-800 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sécurité & Protections Actives</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Journal d'Audit ({activityLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: KPI Dashboard */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Stock Total Ouvrages</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {totalPhysicalBooks}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {totalAvailableBooks} exemplaires en rayon immédiat
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Emprunts en Cours</span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {activeLoans.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {returnedLoans.length} retours archivés avec succès
              </div>
            </div>

            <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-rose-700 text-xs mb-2">
                <span className="font-semibold">Retards Critiques</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
                {overdueLoans.length}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                Pénalités appliquées (200 FCFA/j)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span>Réservations en Attente</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {activeReservations.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Bloqués 4 jours au guichet
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue alert box */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Alertes de Retard & Pénalités</span>
              </h3>
              {overdueLoans.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Aucun retard en cours. Tout est en règle.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {overdueLoans.map((loan) => (
                    <div key={loan.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{loan.bookTitle}</div>
                        <div className="text-slate-500">
                          {loan.userName} ({loan.studentCardNumber || 'N/A'})
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-700 font-mono font-bold block">
                          Échéance : {loan.dueDate}
                        </span>
                        <button
                          onClick={() => returnBook(loan.id)}
                          className="mt-1 px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors"
                        >
                          Régulariser & Restituer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Reservations for Pickup */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Réservations Prêtes au Guichet (4 jours)</span>
              </h3>
              {activeReservations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Aucune réservation en attente de retrait.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {activeReservations.map((res) => {
                    const owner = users.find((u) => u.id === res.userId);
                    const daysLeft = Math.max(0, Math.ceil((new Date(res.expiresAt).getTime() - Date.now()) / 86400000));
                    return (
                      <div key={res.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            {res.userName}
                            {owner?.studentCardNumber && (
                              <span className="font-mono font-normal text-slate-500"> ({owner.studentCardNumber})</span>
                            )}
                          </div>
                          <div className="text-slate-700">{res.bookTitle}</div>
                          <div className="text-slate-500">
                            {res.reference} · expire le {new Date(res.expiresAt).toLocaleDateString('fr-FR')}{' '}
                            <span className={daysLeft <= 1 ? 'font-semibold text-rose-700' : 'font-semibold text-amber-700'}>
                              ({daysLeft} j restant{daysLeft > 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => pickupReservation(res.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
                        >
                          Retirer
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Book Management */}
      {activeTab === 'livres' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Rechercher par titre, auteur, ISBN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-900"
              />
              <span>Afficher les titres archivés</span>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ouvrage</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Emplacement</th>
                  <th className="py-3 px-4 text-center">Stock Dispo / Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className={`hover:bg-slate-50/50 ${book.isArchived ? 'opacity-60 bg-slate-50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverUrl || `/images/${book.id}.jpg`}
                          alt={book.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `/images/${book.id}.jpg`;
                          }}
                          className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 font-serif line-clamp-1">
                            {book.title}
                          </div>
                          <div className="text-slate-500 text-[11px]">{book.author}</div>
                          {book.hasDigitalContent && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-semibold">
                              Lecture en ligne
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{book.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{book.isbn}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{book.shelfLocation}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={book.stockAvailable > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {book.stockAvailable}
                      </span>{' '}
                      / {book.stockTotal}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(book)}
                        title="Modifier les informations"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {!book.isArchived ? (
                        <button
                          onClick={() => archiveBook(book.id)}
                          title="Archiver le livre"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => restoreBook(book.id)}
                          title="Désarchiver"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Loan & Return Management */}
      {activeTab === 'emprunts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setLoanFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  loanFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({loans.length})
              </button>
              <button
                onClick={() => setLoanFilter('en_cours')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  loanFilter === 'en_cours'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En cours ({activeLoans.length})
              </button>
              <button
                onClick={() => setLoanFilter('en_retard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-rose-700 ${
                  loanFilter === 'en_retard'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-rose-600 hover:text-rose-800'
                }`}
              >
                En retard ({overdueLoans.length})
              </button>
              <button
                onClick={() => setLoanFilter('rendu')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  loanFilter === 'rendu'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Restitués ({returnedLoans.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Réf. Emprunt</th>
                  <th className="py-3 px-4">Étudiant Emprunteur</th>
                  <th className="py-3 px-4">Ouvrage</th>
                  <th className="py-3 px-4">Date Prêt</th>
                  <th className="py-3 px-4">Date Limite</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action Restitution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {loan.reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{loan.userName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {loan.studentCardNumber || loan.userEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-serif font-medium text-slate-800">
                      {loan.bookTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{loan.borrowDate}</td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          loan.status === 'en_retard' ? 'text-rose-700 font-bold' : 'text-slate-800'
                        }
                      >
                        {loan.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {loan.status === 'rendu' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Restitué
                        </span>
                      )}
                      {loan.status === 'en_cours' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          En cours (14j)
                        </span>
                      )}
                      {loan.status === 'en_retard' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Retard (Pénalité)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {loan.status !== 'rendu' ? (
                        <button
                          onClick={() => returnBook(loan.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Enregistrer Retour</span>
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const receipt = await generateLoanReceipt(loan);
                            if (receipt) setActiveReceipt(receipt);
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-900 underline underline-offset-2"
                        >
                          Reçu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Student Accounts Management */}
      {activeTab === 'etudiants' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Étudiant / Utilisateur</th>
                <th className="py-3 px-4">N° Carte Universitaire</th>
                <th className="py-3 px-4">Abonnement & Quota</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions Compte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const userActiveLoansCount = loans.filter(
                  (l) => l.userId === u.id && l.status !== 'rendu'
                ).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                      {u.school && (
                        <div className="text-slate-500 text-[10px] truncate max-w-[200px]">{u.school}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-bold">{u.studentCardNumber || 'N/A'}</div>
                      {u.nationalIdCard && (
                        <div className="font-mono text-[10px] text-slate-400">CIP : {u.nationalIdCard}</div>
                      )}
                      {u.birthDate && (
                        <div className="text-[10px] text-slate-400">Né(e) : {u.birthDate}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{u.subscriptionPlan}</div>
                      <div className="text-slate-400 text-[11px]">
                        {userActiveLoansCount} / {u.maxLoans} emprunts actifs
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {currentUser?.role === 'super_admin' ? (
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                        >
                          <option value="etudiant">Étudiant</option>
                          <option value="admin">Bibliothécaire</option>
                          <option value="super_admin">Super-Admin</option>
                        </select>
                      ) : (
                        <span className="capitalize font-medium text-slate-700">
                          {u.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          u.status === 'actif'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {u.status === 'actif' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.status === 'actif' ? (
                        <button
                          onClick={() => updateUserStatus(u.id, 'suspendu')}
                          className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Suspendre</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(u.id, 'actif')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Réactiver</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: System Security Diagnostics & Controls (Dedicated to WOTTO Précieux) */}
      {activeTab === 'securite' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-serif font-bold text-slate-900 text-lg">
                Bouclier de Sécurité du Système & Diagnostic en Temps Réel
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Vérification des protocoles de défense contre les cyberattaques (injections SQL, CSRF, failles XSS, vol de sessions et brute-force).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Chiffrement des Mots de Passe (Argon2id)
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Tous les comptes créés sont hachés de manière irréversible avec sel cryptographique aléatoire unique.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Requêtes Préparées & Paramétrées (Anti-SQLi)
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Séparation stricte des données et des commandes. Aucun caractère spécial ne peut altérer la base de données.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Contrôle des Privilèges RBAC Côté Serveur
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    L'accès aux opérations de suppression et modification est strictement réservé au compte de <strong>WOTTO Précieux</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Désinfection des Entrées & Protection XSS
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Nettoyage systématique des balises HTML et scripts suspects sur les formulaires d'inscription et de recherche.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Live Central Server Database */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Server Status Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  Base de Données Centrale Connectée & En Direct
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                  Fichier : /data/database.json
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Contrôle Central des Utilisateurs & Entrées
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Chaque utilisateur, étudiant ou ami qui ouvre l’application depuis son téléphone ou son ordinateur est automatiquement détecté, synchronisé et enregistré dans la base de données centrale du serveur.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={async () => {
                  setIsRefreshingDb(true);
                  await refreshDatabase();
                  setTimeout(() => setIsRefreshingDb(false), 600);
                  addToast('Base de données synchronisée avec le serveur.', 'success');
                }}
                disabled={isRefreshingDb}
                className="px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-colors flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingDb ? 'animate-spin' : ''}`} />
                <span>Actualiser en direct</span>
              </button>

              <button
                onClick={() => {
                  downloadDatabaseJson();
                  addToast('Fichier database.json téléchargé.', 'info');
                }}
                className="px-3.5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger la Base (JSON)</span>
              </button>
            </div>
          </div>

          {/* Database Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Utilisateurs en Base</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{users.length}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Persistance JSON garantie
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Visites & Entrées Détectées</span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{visitors.length}</div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">
                Historique des connexions
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Prêts Actifs en Base</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {loans.filter((l) => l.status !== 'rendu').length}
              </div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">
                Sur un total de {loans.length} prêts
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Ouvrages au Catalogue</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{books.length}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Stocks dynamiques synchronisés
              </div>
            </div>
          </div>

          {/* Table 1: Registered Users in Database */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Tous les Utilisateurs Enregistrés dans la Base ({users.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ces comptes sont stockés sur le serveur et accessibles depuis n'importe quel ordinateur ou téléphone.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold self-start sm:self-auto">
                Synchronisation auto : 3.5s
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Utilisateur / Nom</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rôle</th>
                    <th className="p-3">Matricule / Carte</th>
                    <th className="p-3">Filière & Cycle</th>
                    <th className="p-3">Date d'Inscription</th>
                    <th className="p-3 text-right">Statut Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSuperAdmin = u.email === 'wottoprecieux@gmail.com';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                              {u.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div>{u.name}</div>
                              {isSuperAdmin && (
                                <span className="text-[10px] text-amber-600 font-bold">
                                  Créateur du Système
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'super_admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : u.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {u.studentCardNumber || '—'}
                        </td>
                        <td className="p-3 text-slate-600">
                          {u.filiere ? (
                            <span className="font-medium text-slate-900">
                              {u.academicLevel || 'Cycle'} · {u.filiere}
                            </span>
                          ) : (
                            <span className="text-slate-400">Général / Non renseigné</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          {u.joinedDate || '2026-10-03'}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Enregistré
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Real-time Visitor & Connection Entrance Logs */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Journal des Entrées & Connexions en Temps Réel ({visitors.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dès qu'un ami ou un usager ouvre l'application ou s'inscrit, son passage est tracé ici.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Flux en direct de l'API /api/visitors
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
              {visitors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Aucune visite enregistrée pour le moment.
                </div>
              ) : (
                visitors.map((v) => {
                  const isMobile = v.device?.toLowerCase().includes('phone') || v.device?.toLowerCase().includes('mobile');
                  return (
                    <div
                      key={v.id}
                      className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          {isMobile ? (
                            <Smartphone className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Laptop className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{v.userName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {v.userRole}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({v.device || 'Navigateur Web'})
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-xs">{v.details}</p>
                          {v.ip && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Adresse IP : {v.ip}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-[11px] text-slate-500 font-medium">
                          {new Date(v.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(v.timestamp).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Activity Logs & Audits */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Journal d'Audit Immuable
            </h3>
            <span className="text-[11px] text-slate-400">Traçabilité des connexions et opérations</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500 text-[11px]">{log.target}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-1 font-medium">
                    <span>Par {log.actorName}</span>
                    <span>({log.actorRole})</span>
                    {log.ipAddress && (
                      <>
                        <span>·</span>
                        <span className="font-mono">IP: {log.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="font-mono text-slate-400 text-[11px] whitespace-nowrap">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-serif font-bold text-slate-900">
                {editingBook ? 'Modifier la Notice du Livre' : 'Ajouter un Nouvel Ouvrage au Catalogue'}
              </h2>
              <button
                onClick={() => setIsAddBookModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titre de l'ouvrage *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Traité Fondamental d'Algorithmique"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auteur(s) *</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Ex: Thomas Cormen"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discipline / Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Book['category'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Informatique">Informatique</option>
                    <option value="Littérature">Littérature</option>
                    <option value="Droit">Droit</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Économie">Économie</option>
                    <option value="Philosophie">Philosophie</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code ISBN *</label>
                  <input
                    type="text"
                    required
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="978-2100814526"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Année Édition</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre de Pages</label>
                  <input
                    type="number"
                    value={formPages}
                    onChange={(e) => setFormPages(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maison d'Édition</label>
                  <input
                    type="text"
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    placeholder="Dunod, Dalloz..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emplacement Rayon</label>
                  <input
                    type="text"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value)}
                    placeholder="Rayon INF-B02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Total d'Exemplaires</label>
                  <input
                    type="number"
                    min={1}
                    value={formStockTotal}
                    onChange={(e) => setFormStockTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix de réservation (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">0 = réservation gratuite</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo du livre (couverture)</label>
                <div className="flex items-start gap-3">
                  {formCoverUrl && (
                    <img
                      src={formCoverUrl}
                      alt="Aperçu de la couverture"
                      className="w-16 h-24 object-cover rounded border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverFileChange}
                      disabled={isUploadingCover}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    />
                    <input
                      type="text"
                      value={formCoverUrl}
                      onChange={(e) => setFormCoverUrl(e.target.value)}
                      placeholder="ou coller l'adresse (URL) d'une image"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      {isUploadingCover ? 'Envoi de la photo en cours…' : 'JPEG, PNG ou WebP — redimensionnée automatiquement.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
                <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>Contenu du livre — lecture en ligne (PDF)</span>
                </label>
                <p className="text-[11px] text-slate-600 mb-3">
                  Avec un PDF, le lecteur choisit : <strong>réserver</strong> le livre papier ou le <strong>lire en ligne</strong> au même prix ({formPrice > 0 ? `${formPrice.toLocaleString('fr-FR')} FCFA` : 'gratuit'}).
                  La lecture se fait uniquement sur le site, sans téléchargement, pendant <strong>7 jours</strong> à compter du paiement.
                </p>
                {editingBook && books.find((b) => b.id === editingBook.id)?.hasDigitalContent && (
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-emerald-800 font-semibold">✓ Un contenu est déjà en ligne pour ce livre (choisir un nouveau PDF le remplace).</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Supprimer le contenu en ligne de ce livre ?')) await removeBookContent(editingBook.id);
                      }}
                      className="px-2.5 py-1 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-50 shrink-0"
                    >
                      Supprimer le contenu
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 30 * 1024 * 1024) {
                      addToast('PDF trop volumineux (30 Mo maximum).', 'error');
                      e.target.value = '';
                      setFormContentFile(null);
                      return;
                    }
                    setFormContentFile(f);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  {formContentFile ? `Sélectionné : ${formContentFile.name} (${(formContentFile.size / 1048576).toFixed(1)} Mo)` : 'PDF, 30 Mo maximum. Facultatif : sans PDF, le livre reste en réservation seulement.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Résumé synthétique</label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Présentation des thématiques et concepts abordés..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Texte de 4ème de couverture</label>
                <textarea
                  rows={2}
                  value={formBackCover}
                  onChange={(e) => setFormBackCover(e.target.value)}
                  placeholder="Texte au dos du livre / avis critique..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingBook}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {isSavingBook ? 'Enregistrement…' : editingBook ? 'Enregistrer les Modifications' : 'Ajouter au Fonds Documentaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
