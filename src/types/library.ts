export type UserRole = 'visiteur' | 'etudiant' | 'admin' | 'super_admin';

export type SubscriptionPlan = 'Gratuit' | 'Étudiant Plus' | 'Recherche & Doctorat';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  legacyDemoPassword?: boolean;
  googleId?: string;
  studentCardNumber?: string;
  nationalIdCard?: string;
  birthDate?: string;
  school?: string;
  subscriptionPlan: SubscriptionPlan;
  maxLoans: number;
  status: 'actif' | 'suspendu';
  avatar?: string;
  phone?: string;
  faculty?: string;
  academicLevel?: string;
  filiere?: string;
  joinedDate: string;
}

export type PublicUser = Omit<User, 'passwordHash' | 'legacyDemoPassword' | 'googleId'>;

export interface Book {
  id: string;
  title: string;
  author: string;
  category: 'Informatique' | 'Littérature' | 'Droit' | 'Sciences' | 'Économie' | 'Philosophie';
  isbn: string;
  publishedYear: number;
  publisher: string;
  pages: number;
  summary: string;
  backCoverText: string;
  coverUrl: string;
  reservationPrice?: number; // prix de la réservation en FCFA (0 = gratuit) ; la lecture en ligne coûte le même prix
  /** Vrai si l'administration a déposé le contenu (PDF) : lecture en ligne possible. Le fichier lui-même n'est jamais dans l'état public. */
  hasDigitalContent?: boolean;
  stockTotal: number;
  stockAvailable: number;
  shelfLocation: string; // e.g. "Rayon INF-A04"
  isArchived: boolean;
  featured?: boolean;
  rating: number;
  reviewsCount: number;
}

export interface Loan {
  id: string;
  reference: string; // e.g. "EMP-2026-8941"
  userId: string;
  userName: string;
  userEmail: string;
  studentCardNumber?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  isbn: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'en_cours' | 'rendu' | 'en_retard';
  renewalCount: number;
  dailyLateFee: number;
  lateFee?: number;
}

export interface Reservation {
  id: string;
  reference: string; // e.g. "RES-2026-3104"
  userId: string;
  userName: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  isbn: string;
  reservedAt: string;
  expiresAt: string; // 4 days limit
  status: 'active' | 'retiree' | 'expiree' | 'annulee' | 'en_attente_paiement';
  pickupDesk: string;
}

/** Droit de lire un livre en ligne (même prix que la réservation, valable 7 jours, sans téléchargement). */
export interface ReadingAccess {
  id: string;
  reference: string; // e.g. "LEC-2026-4012"
  userId: string;
  userName: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  startedAt: string;
  /** Fin du droit de lecture (7 jours après le paiement). */
  expiresAt: string;
  status: 'en_attente_paiement' | 'active' | 'expiree' | 'annulee';
  price: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. "QUITT-2026-8942"
  type: 'emprunt' | 'reservation' | 'retour' | 'paiement';
  createdAt: string;
  userId: string;
  userName: string;
  userEmail?: string;
  studentCardNumber?: string;
  academicLevel?: string;
  filiere?: string;
  school?: string;
  items: {
    bookId: string;
    title: string;
    author: string;
    isbn: string;
    dueDate?: string;
    shelfLocation?: string;
  }[];
  expiresAt?: string;
  securityHash: string;
  operatorName: string;
  emailSentTo?: string;
  emailSentAt?: string;
  amountPaid?: number;
  paymentMethod?: string;
}

export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  userId: string;
  userName: string;
  plan?: SubscriptionPlan;
  kind?: 'abonnement' | 'reservation' | 'lecture';
  reservationIds?: string[];
  /** Droit de lecture en ligne payé par cette transaction. */
  accessId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'Bachs' | 'MTN MoMo' | 'Moov Money' | 'Wave' | 'Carte Bancaire';
  externalId?: string;
  phoneNumber?: string;
  status: 'succes' | 'en_attente' | 'echec';
  date: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'systeme';
  action: string;
  target: string;
  details: string;
  ipAddress?: string;
}

export interface VisitorSession {
  id: string;
  timestamp: string;
  ip?: string;
  device?: string;
  action: 'visite_site' | 'connexion' | 'inscription' | 'changement_role' | 'emprunt' | 'reservation' | 'retour';
  userId?: string;
  userName: string;
  userEmail?: string;
  userRole: UserRole;
  details?: string;
}

