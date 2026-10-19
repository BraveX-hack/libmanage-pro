import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Book,
  User,
  Loan,
  Reservation,
  ReadingAccess,
  Receipt,
  ActivityLog,
  SubscriptionPlan,
  PaymentTransaction,
  VisitorSession,
  PublicUser,
} from '../types/library';
import { compressImageToDataUrl } from '../utils/imageUpload';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

type ActionResult = { success: boolean; error?: string; receipt?: Receipt };

interface LibraryContextType {
  currentUser: User | null;
  users: User[];
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
  readingAccesses: ReadingAccess[];
  receipts: Receipt[];
  activityLogs: ActivityLog[];
  cart: string[];
  /** Livre actuellement ouvert dans la liseuse (lecture en ligne). */
  readerBookId: string | null;
  openReader: (bookId: string) => void;
  closeReader: () => void;
  activeReceipt: Receipt | null;
  toasts: ToastMessage[];
  transactions: PaymentTransaction[];
  visitors: VisitorSession[];
  refreshDatabase: () => Promise<void>;
  downloadDatabaseJson: () => void;

  // Auth
  loginUser: (email: string, password?: string) => Promise<boolean>;
  registerUser: (data: {
    lastName: string;
    firstName: string;
    email: string;
    school: string;
    nationalIdCard: string;
    birthDate: string;
    academicLevel?: string;
    filiere?: string;
    password?: string;
  }) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  updateUserStatus: (userId: string, status: 'actif' | 'suspendu') => Promise<void>;
  updateUserRole: (userId: string, newRole: User['role']) => Promise<void>;

  // Payments & Subscriptions
  upgradeSubscription: (
    plan: SubscriptionPlan,
    paymentDetails: { method: PaymentTransaction['paymentMethod']; amount: number; phoneNumber?: string }
  ) => Promise<{ success: boolean; ref?: string; checkoutUrl?: string; error?: string }>;

  // Books
  /** Renvoie l'identifiant du livre créé (ou null en cas d'échec). */
  addBook: (bookData: Omit<Book, 'id' | 'rating' | 'reviewsCount' | 'isArchived'>) => Promise<string | null>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<boolean>;
  archiveBook: (id: string) => Promise<{ success: boolean; error?: string }>;
  restoreBook: (id: string) => Promise<void>;
  uploadBookCover: (file: File) => Promise<string | null>;
  uploadBookContent: (bookId: string, file: File) => Promise<boolean>;
  removeBookContent: (bookId: string) => Promise<boolean>;

  // Lecture en ligne (même prix que la réservation, 7 jours, sans téléchargement)
  buyReading: (bookId: string) => Promise<ActionResult>;

  // Loans & Returns
  borrowBook: (bookId: string, durationDays?: number) => Promise<ActionResult>;
  returnBook: (loanId: string) => Promise<{ success: boolean; error?: string }>;
  renewLoan: (loanId: string) => Promise<{ success: boolean; error?: string }>;

  // Reservations
  reserveBook: (bookId: string) => Promise<ActionResult>;
  cancelReservation: (resId: string) => Promise<{ success: boolean; error?: string }>;
  pickupReservation: (resId: string) => Promise<ActionResult>;

  // Cart
  addToCart: (bookId: string) => { success: boolean; error?: string };
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  checkoutCart: () => Promise<ActionResult>;

  // Receipts
  setActiveReceipt: (receipt: Receipt | null) => void;
  generateLoanReceipt: (loan: Loan) => Promise<Receipt | null>;
  generateReservationReceipt: (res: Reservation) => Promise<Receipt | null>;
  sendReceiptByEmail: (receiptId: string, email: string) => Promise<boolean>;

  // Toast
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Remise à zéro de la base de démonstration (super-admin, hors production)
  resetDemoData: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const CART_KEY = 'bibliotech_cart_v2';
const POLL_INTERVAL_MS = 15000;

// Couvertures réelles (affichage identique à l'existant)
const REAL_BOOK_COVERS: Record<string, string> = {
  'book-1': '/images/book-1.jpg',
  'book-2': '/images/book-2.jpg',
  'book-3': '/images/book-3.jpg',
  'book-4': '/images/book-4.jpg',
  'book-5': '/images/book-5.jpg',
  'book-6': '/images/book-6.jpg',
  'book-7': '/images/book-7.jpg',
  'book-8': '/images/book-8.jpg',
};

const withCover = <T extends { coverUrl: string; id: string }>(b: T): T => ({
  ...b,
  coverUrl: REAL_BOOK_COVERS[b.id] || b.coverUrl || `/images/${b.id}.jpg`,
});

const withBookCover = <T extends { bookCover: string; bookId: string }>(x: T): T => ({
  ...x,
  bookCover: REAL_BOOK_COVERS[x.bookId] || x.bookCover || `/images/${x.bookId}.jpg`,
});

interface ServerState {
  me: PublicUser | null;
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
  readingAccesses?: ReadingAccess[];
  receipts: Receipt[];
  transactions: PaymentTransaction[];
  users: PublicUser[];
  activityLogs: ActivityLog[];
  visitors: VisitorSession[];
}

interface ApiResponse {
  ok: boolean;
  status: number;
  data: any;
}

const callApi = async (method: string, url: string, body?: unknown): Promise<ApiResponse> => {
  try {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Serveur injoignable. Vérifiez votre connexion.' } };
  }
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [readingAccesses, setReadingAccesses] = useState<ReadingAccess[]>([]);
  const [readerBookId, setReaderBookId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [visitors, setVisitors] = useState<VisitorSession[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Le panier est la seule donnée conservée localement (aucune donnée personnelle)
  const [cart, setCart] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* stockage indisponible */
    }
  }, [cart]);

  // ---------- Toasts ----------
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---------- Synchronisation avec le serveur ----------
  const applyState = useCallback((state: ServerState) => {
    setCurrentUser((state.me as User) ?? null);
    setUsers((state.users as User[]) ?? []);
    setBooks((state.books ?? []).map(withCover));
    setLoans((state.loans ?? []).map(withBookCover));
    setReservations((state.reservations ?? []).map(withBookCover));
    setReadingAccesses(state.readingAccesses ?? []);
    setReceipts(state.receipts ?? []);
    setTransactions(state.transactions ?? []);
    setActivityLogs(state.activityLogs ?? []);
    setVisitors(state.visitors ?? []);
    // Retire du panier les livres qui n'existent plus ou sont archivés
    const available = new Set((state.books ?? []).map((b) => b.id));
    setCart((prev) => {
      const next = prev.filter((id) => available.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, []);

  const refreshDatabase = useCallback(async () => {
    const res = await callApi('GET', '/api/state');
    if (res.ok && res.data) applyState(res.data as ServerState);
  }, [applyState]);

  const refreshRef = useRef(refreshDatabase);
  refreshRef.current = refreshDatabase;

  // Vérifie auprès du serveur (donc de Bachs) les paiements en attente de l'utilisateur connecté
  const verifyingRef = useRef(false);
  const verifyPayments = useCallback(async () => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    try {
      const res = await callApi('POST', '/api/payments/verify', {});
      if (res.ok && res.data?.state) {
        applyState(res.data.state as ServerState);
        if (res.data.receipt) {
          setActiveReceipt(res.data.receipt as Receipt);
          addToast(
            res.data.paidKind === 'lecture'
              ? 'Paiement confirmé ! Vous pouvez lire le livre pendant 7 jours depuis « Mes lectures ».'
              : (res.data.receipt as Receipt).type === 'reservation'
              ? 'Paiement confirmé ! Vos livres sont réservés pendant 4 jours.'
              : 'Paiement confirmé ! Votre formule est activée.',
            'success'
          );
        }
      }
    } finally {
      verifyingRef.current = false;
    }
  }, [applyState, addToast]);

  const hasPendingRef = useRef(false);
  hasPendingRef.current = transactions.some((t) => t.status === 'en_attente' && t.paymentMethod === 'Bachs');
  const verifyRef = useRef(verifyPayments);
  verifyRef.current = verifyPayments;

  useEffect(() => {
    refreshRef.current();
    callApi('POST', '/api/visitors', {});

    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (hasPendingRef.current) verifyRef.current();
      else refreshRef.current();
    };
    // Retour depuis la page de paiement Bachs : vérification immédiate
    if (new URLSearchParams(window.location.search).has('paiement')) {
      setTimeout(() => verifyRef.current(), 800);
    }
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  /**
   * Exécute une action serveur : affiche l'erreur éventuelle, applique le nouvel état renvoyé.
   * Une session expirée (401) resynchronise l'interface.
   */
  const run = useCallback(
    async (method: string, url: string, body?: unknown): Promise<{ ok: boolean; data: any; error?: string }> => {
      const res = await callApi(method, url, body);
      if (res.ok) {
        if (res.data?.state) applyState(res.data.state as ServerState);
        return { ok: true, data: res.data };
      }
      const error: string = res.data?.error || 'Une erreur est survenue.';
      if (res.status === 401 && !url.startsWith('/api/auth/')) {
        addToast('Votre session a expiré. Veuillez vous reconnecter.', 'warning');
        refreshRef.current();
      } else {
        addToast(error, 'error');
      }
      return { ok: false, data: res.data, error };
    },
    [applyState, addToast]
  );

  const downloadDatabaseJson = () => {
    const link = document.createElement('a');
    link.href = '/api/database/download';
    link.setAttribute('download', 'BiblioTech_Database_2GroupESGIS.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Authentification ----------
  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    const r = await run('POST', '/api/auth/login', { email, password: password ?? '' });
    if (r.ok) {
      const name = r.data.state?.me?.name;
      addToast(`Bienvenue, ${name} !`, 'success');
    }
    return r.ok;
  };

  const registerUser: LibraryContextType['registerUser'] = async (data) => {
    // Le compte n'est créé qu'après clic sur le lien reçu par e-mail
    const r = await run('POST', '/api/auth/register', data);
    if (r.ok) addToast(`E-mail de vérification envoyé à ${data.email}. Cliquez sur le lien pour activer votre compte.`, 'info');
    return r.ok;
  };

  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    const r = await run('POST', '/api/auth/resend-verification', { email });
    if (r.ok) addToast(`Nouvel e-mail de vérification envoyé à ${email}.`, 'info');
    return r.ok;
  };

  const logoutUser = async () => {
    await run('POST', '/api/auth/logout');
    setCart([]);
    addToast('Session fermée en toute sécurité.', 'info');
  };

  const updateUserStatus = async (userId: string, status: 'actif' | 'suspendu') => {
    const r = await run('PUT', `/api/users/${encodeURIComponent(userId)}/status`, { status });
    if (r.ok) addToast(`Statut mis à jour : ${status}`, 'info');
  };

  const updateUserRole = async (userId: string, newRole: User['role']) => {
    const r = await run('PUT', `/api/users/${encodeURIComponent(userId)}/role`, { role: newRole });
    if (r.ok) addToast(`Rôle mis à jour : ${newRole}`, 'success');
  };

  // ---------- Abonnement ----------
  const upgradeSubscription: LibraryContextType['upgradeSubscription'] = async (plan, details) => {
    const r = await run('POST', '/api/subscription', { plan, ...details });
    if (r.ok) {
      // Paiement Bachs : le client est redirigé vers la page de paiement, la formule s'active après confirmation
      if (r.data.checkoutUrl) {
        return { success: true, ref: r.data.transactionRef as string, checkoutUrl: r.data.checkoutUrl as string };
      }
      setActiveReceipt(r.data.receipt as Receipt);
      return { success: true, ref: r.data.transactionRef as string };
    }
    return { success: false, error: r.error };
  };

  // ---------- Livres ----------
  const bookPayload = (b: Partial<Book>) => ({
    title: b.title,
    author: b.author,
    category: b.category,
    isbn: b.isbn,
    publishedYear: b.publishedYear,
    publisher: b.publisher,
    pages: b.pages,
    summary: b.summary,
    backCoverText: b.backCoverText,
    shelfLocation: b.shelfLocation,
    stockTotal: b.stockTotal,
    reservationPrice: b.reservationPrice ?? 0,
    coverUrl: b.coverUrl,
  });

  const addBook: LibraryContextType['addBook'] = async (bookData) => {
    const r = await run('POST', '/api/books', bookPayload(bookData));
    if (r.ok) addToast(`Livre "${bookData.title}" ajouté au catalogue.`, 'success');
    return r.ok ? ((r.data.bookId as string) || null) : null;
  };

  const updateBook: LibraryContextType['updateBook'] = async (id, updates) => {
    const current = books.find((b) => b.id === id);
    if (!current) {
      addToast('Livre introuvable.', 'error');
      return false;
    }
    const r = await run('PUT', `/api/books/${encodeURIComponent(id)}`, bookPayload({ ...current, ...updates }));
    if (r.ok) addToast('Notice mise à jour avec succès.', 'success');
    return r.ok;
  };

  const archiveBook: LibraryContextType['archiveBook'] = async (id) => {
    const r = await run('POST', `/api/books/${encodeURIComponent(id)}/archive`);
    if (r.ok) addToast('Livre retiré de la consultation publique.', 'info');
    return r.ok ? { success: true } : { success: false, error: r.error };
  };

  const restoreBook = async (id: string) => {
    const r = await run('POST', `/api/books/${encodeURIComponent(id)}/restore`);
    if (r.ok) addToast('Livre restauré dans le catalogue public.', 'success');
  };

  const uploadBookCover = async (file: File): Promise<string | null> => {
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const res = await callApi('POST', '/api/uploads/cover', { dataUrl });
      if (res.ok && res.data?.url) return res.data.url as string;
      addToast(res.data?.error || "Échec de l'envoi de l'image.", 'error');
    } catch (err) {
      addToast((err as Error).message, 'error');
    }
    return null;
  };

  const MAX_CONTENT_MB = 30;

  /** Envoie le PDF du livre (contenu lisible en ligne). Le fichier part tel quel, en binaire, vers le serveur. */
  const uploadBookContent = async (bookId: string, file: File): Promise<boolean> => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Le contenu du livre doit être un fichier PDF.', 'error');
      return false;
    }
    if (file.size > MAX_CONTENT_MB * 1024 * 1024) {
      addToast(`PDF trop volumineux (${MAX_CONTENT_MB} Mo maximum).`, 'error');
      return false;
    }
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(bookId)}/content`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (data?.state) applyState(data.state as ServerState);
        addToast('Contenu du livre enregistré : la lecture en ligne est activée.', 'success');
        return true;
      }
      addToast(data?.error || "Échec de l'envoi du PDF.", 'error');
    } catch {
      addToast("Serveur injoignable pendant l'envoi du PDF.", 'error');
    }
    return false;
  };

  const removeBookContent = async (bookId: string): Promise<boolean> => {
    const r = await run('DELETE', `/api/books/${encodeURIComponent(bookId)}/content`);
    if (r.ok) addToast('Contenu en ligne supprimé.', 'info');
    return r.ok;
  };

  // ---------- Lecture en ligne ----------
  const buyReading: LibraryContextType['buyReading'] = async (bookId) => {
    if (!currentUser) {
      addToast('Connectez-vous pour lire ce livre en ligne.', 'warning');
      return { success: false, error: 'Non authentifié' };
    }
    const r = await run('POST', '/api/reading', { bookId });
    if (!r.ok) return { success: false, error: r.error };
    if (r.data.checkoutUrl) return redirectToPayment(r.data.checkoutUrl as string);
    addToast('Lecture activée gratuitement pour 7 jours. Bonne lecture !', 'success');
    return { success: true };
  };

  // ---------- Prêts & retours ----------
  const borrowBook: LibraryContextType['borrowBook'] = async (bookId) => {
    if (!currentUser) {
      addToast('Veuillez vous connecter pour emprunter un livre.', 'warning');
      return { success: false, error: 'Non authentifié' };
    }
    const r = await run('POST', '/api/loans', { bookId });
    if (!r.ok) return { success: false, error: r.error };
    const receipt = r.data.receipt as Receipt;
    addToast(`Emprunt validé ! Quittance n° ${receipt.receiptNumber} émise.`, 'success');
    return { success: true, receipt };
  };

  const returnBook: LibraryContextType['returnBook'] = async (loanId) => {
    const loan = loans.find((l) => l.id === loanId);
    const r = await run('PUT', `/api/loans/${encodeURIComponent(loanId)}/return`);
    if (!r.ok) return { success: false, error: r.error };
    const fee = Number(r.data.lateFee) || 0;
    addToast(
      `Livre "${loan?.bookTitle ?? ''}" restitué. Exemplaire réintégré en rayon.${
        fee > 0 ? ` Pénalité de retard à régler : ${fee.toLocaleString('fr-FR')} FCFA.` : ''
      }`,
      fee > 0 ? 'warning' : 'success'
    );
    return { success: true };
  };

  const renewLoan: LibraryContextType['renewLoan'] = async (loanId) => {
    const r = await run('PUT', `/api/loans/${encodeURIComponent(loanId)}/renew`);
    if (!r.ok) return { success: false, error: r.error };
    addToast(`Prêt prolongé de 14 jours ! Date limite : ${r.data.newDueDate}`, 'success');
    return { success: true };
  };

  // Réservation payante : redirection vers la page de paiement Bachs (la réservation est confirmée après paiement)
  const redirectToPayment = (checkoutUrl: string): ActionResult => {
    addToast('Redirection vers la page de paiement sécurisée Bachs…', 'info');
    window.location.assign(checkoutUrl);
    return { success: true };
  };

  // ---------- Réservations ----------
  const reserveBook: LibraryContextType['reserveBook'] = async (bookId) => {
    if (!currentUser) {
      addToast('Connectez-vous pour effectuer une réservation.', 'warning');
      return { success: false, error: 'Non authentifié' };
    }
    const r = await run('POST', '/api/reservations', { bookIds: [bookId] });
    if (!r.ok) return { success: false, error: r.error };
    if (r.data.checkoutUrl) return redirectToPayment(r.data.checkoutUrl as string);
    addToast('Réservation validée ! Ticket 4 jours émis.', 'success');
    return { success: true, receipt: r.data.receipt as Receipt };
  };

  const cancelReservation: LibraryContextType['cancelReservation'] = async (resId) => {
    const r = await run('PUT', `/api/reservations/${encodeURIComponent(resId)}/cancel`);
    if (!r.ok) return { success: false, error: r.error };
    addToast('Réservation annulée. Livre remis en rayon disponible.', 'info');
    return { success: true };
  };

  const pickupReservation: LibraryContextType['pickupReservation'] = async (resId) => {
    const r = await run('PUT', `/api/reservations/${encodeURIComponent(resId)}/pickup`);
    if (!r.ok) return { success: false, error: r.error };
    const receipt = r.data.receipt as Receipt;
    setActiveReceipt(receipt);
    addToast(`Retrait validé au guichet ! Quittance d'emprunt n° ${receipt.receiptNumber} émise.`, 'success');
    return { success: true, receipt };
  };

  // ---------- Panier ----------
  const addToCart = (bookId: string) => {
    if (cart.includes(bookId)) {
      addToast('Ce livre est déjà dans votre panier.', 'warning');
      return { success: false, error: 'Déjà présent' };
    }
    const maxQuota = currentUser ? currentUser.maxLoans : 3;
    const inUse =
      loans.filter((l) => l.userId === currentUser?.id && l.status !== 'rendu').length +
      reservations.filter((r) => r.userId === currentUser?.id && r.status === 'active').length;
    if (cart.length + inUse >= maxQuota) {
      addToast(`Quota d'emprunt (${maxQuota} livres) atteint.`, 'error');
      return { success: false, error: 'Quota dépassé' };
    }
    setCart((prev) => [...prev, bookId]);
    addToast("Livre ajouté au panier d'emprunt.", 'success');
    return { success: true };
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((id) => id !== bookId));
    addToast('Livre retiré du panier.', 'info');
  };

  const clearCart = () => setCart([]);

  const checkoutCart: LibraryContextType['checkoutCart'] = async () => {
    if (!currentUser) {
      addToast('Veuillez vous connecter pour valider votre réservation.', 'warning');
      return { success: false, error: 'Non authentifié' };
    }
    if (cart.length === 0) return { success: false, error: 'Panier vide' };

    const r = await run('POST', '/api/reservations', { bookIds: cart });
    if (!r.ok) return { success: false, error: r.error };

    const skipped: string[] = r.data.skipped ?? [];
    if (r.data.checkoutUrl) {
      setCart([]);
      if (skipped.length > 0) addToast(`Non réservé(s) (indisponible, déjà détenu ou quota) : ${skipped.join(', ')}`, 'warning');
      return redirectToPayment(r.data.checkoutUrl as string);
    }
    const receipt = r.data.receipt as Receipt;
    setCart([]);
    addToast(`Réservation validée pour ${receipt.items.length} livre(s) ! Ticket 4 jours émis.`, 'success');
    if (skipped.length > 0) {
      addToast(`Non réservé(s) (indisponible, déjà détenu ou quota) : ${skipped.join(', ')}`, 'warning');
    }
    return { success: true, receipt };
  };

  // ---------- Quittances ----------
  const generateLoanReceipt = async (loan: Loan): Promise<Receipt | null> => {
    const r = await run('POST', `/api/loans/${encodeURIComponent(loan.id)}/receipt`);
    return r.ok ? (r.data.receipt as Receipt) : null;
  };

  const generateReservationReceipt = async (res: Reservation): Promise<Receipt | null> => {
    const r = await run('POST', `/api/reservations/${encodeURIComponent(res.id)}/receipt`);
    return r.ok ? (r.data.receipt as Receipt) : null;
  };

  const sendReceiptByEmail = async (receiptId: string, _email: string): Promise<boolean> => {
    const r = await run('POST', `/api/receipts/${encodeURIComponent(receiptId)}/email`, { email: _email });
    return r.ok;
  };

  // ---------- Démo ----------
  const resetDemoData = async () => {
    if (!window.confirm('Réinitialiser toute la base de démonstration ? Une sauvegarde sera créée sur le serveur.')) return;
    const r = await run('POST', '/api/admin/reset-demo');
    if (r.ok) {
      setCart([]);
      addToast('Base de démonstration réinitialisée. Veuillez vous reconnecter.', 'info');
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        users,
        books,
        loans,
        reservations,
        readingAccesses,
        readerBookId,
        openReader: setReaderBookId,
        closeReader: () => setReaderBookId(null),
        receipts,
        activityLogs,
        cart,
        activeReceipt,
        toasts,
        transactions,
        loginUser,
        registerUser,
        logoutUser,
        resendVerificationEmail,
        updateUserStatus,
        updateUserRole,
        upgradeSubscription,
        addBook,
        updateBook,
        archiveBook,
        restoreBook,
        uploadBookCover,
        uploadBookContent,
        removeBookContent,
        buyReading,
        borrowBook,
        returnBook,
        renewLoan,
        reserveBook,
        cancelReservation,
        pickupReservation,
        addToCart,
        removeFromCart,
        clearCart,
        checkoutCart,
        visitors,
        refreshDatabase,
        downloadDatabaseJson,
        setActiveReceipt,
        generateLoanReceipt,
        generateReservationReceipt,
        sendReceiptByEmail,
        addToast,
        removeToast,
        resetDemoData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
