import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Book,
  User,
  Loan,
  Reservation,
  Receipt,
  ActivityLog,
  VisitorSession,
  PaymentTransaction,
} from '../src/types/library';
import {
  INITIAL_BOOKS,
  INITIAL_USERS,
  INITIAL_LOANS,
  INITIAL_RESERVATIONS,
  INITIAL_LOGS,
} from '../src/data/mockData';
import { hashPassword, isScryptHash } from './auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', 'data');
export const DB_FILE = path.join(DATA_DIR, 'database.json');

/** Inscription en attente de confirmation par e-mail : le compte n'existe pas tant que le lien n'est pas cliqué. */
export interface PendingRegistration {
  email: string;
  lastName: string;
  firstName: string;
  school: string;
  academicLevel: string;
  filiere: string;
  birthDate: string;
  nationalIdCard?: string;
  passwordHash: string;
  tokenHash: string; // seule l'empreinte SHA-256 du jeton est conservée
  expiresAt: string;
  lastSentAt: string;
}

export interface Database {
  pendingRegistrations: PendingRegistration[];
  users: User[];
  books: Book[];
  loans: Loan[];
  reservations: Reservation[];
  receipts: Receipt[];
  activityLogs: ActivityLog[];
  visitors: VisitorSession[];
  transactions: PaymentTransaction[];
  counters: Record<string, number>;
  lastUpdated: string;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

const buildInitialDb = (): Database => ({
  users: structuredClone(INITIAL_USERS),
  books: structuredClone(INITIAL_BOOKS),
  loans: structuredClone(INITIAL_LOANS),
  reservations: structuredClone(INITIAL_RESERVATIONS),
  receipts: [],
  activityLogs: structuredClone(INITIAL_LOGS),
  visitors: [],
  transactions: [],
  counters: {},
  pendingRegistrations: [],
  lastUpdated: new Date().toISOString(),
});

let db: Database | null = null;

// ---------- Persistance atomique (écriture temporaire + rename) ----------

const save = () => {
  if (!db) return;
  db.lastUpdated = new Date().toISOString();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
};

const backupExisting = (reason: string) => {
  if (!fs.existsSync(DB_FILE)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(DATA_DIR, `database.backup-${reason}-${stamp}.json`);
  fs.copyFileSync(DB_FILE, target);
  console.log(`[BiblioTech] Sauvegarde de sécurité créée : ${path.basename(target)}`);
};

// ---------- Migration / normalisation ----------

const migrate = (data: Database): boolean => {
  let changed = false;

  for (const key of ['users', 'books', 'loans', 'reservations', 'receipts', 'activityLogs', 'visitors', 'transactions', 'pendingRegistrations'] as const) {
    if (!Array.isArray(data[key])) {
      (data as any)[key] = [];
      changed = true;
    }
  }
  if (!data.counters || typeof data.counters !== 'object') {
    data.counters = {};
    changed = true;
  }

  // Anciens "hash" factices ($argon2id$...$secret) -> vrai hash scrypt.
  // Le mot de passe de démonstration est conservé tel quel mais marqué "legacyDemoPassword" :
  // il est refusé en production tant qu'il n'a pas été remplacé.
  for (const u of data.users) {
    if (u.email) u.email = u.email.trim().toLowerCase();
    if (!isScryptHash(u.passwordHash)) {
      const legacySecret = (u.passwordHash || '').split('$').pop() || '';
      if (legacySecret.length >= 6) {
        u.passwordHash = hashPassword(legacySecret);
        u.legacyDemoPassword = true;
      } else {
        // Aucun secret exploitable : compte verrouillé jusqu'à réinitialisation par un administrateur
        u.passwordHash = hashPassword(cryptoRandom());
        u.legacyDemoPassword = true;
      }
      changed = true;
    }
  }

  // Prix de réservation par défaut pour les livres existants (modifiable ensuite par l'administration)
  for (const b of data.books) {
    if (typeof b.reservationPrice !== 'number') {
      b.reservationPrice = 500;
      changed = true;
    }
  }

  // Dédoublonnage des e-mails (garde la première occurrence)
  const seen = new Set<string>();
  const before = data.users.length;
  data.users = data.users.filter((u) => {
    if (seen.has(u.email)) return false;
    seen.add(u.email);
    return true;
  });
  if (data.users.length !== before) changed = true;

  // Les anciens journaux de visiteurs contenaient des identités déclarées par le client : on les conserve tels quels.
  return changed;
};

const cryptoRandom = () => crypto.randomBytes(24).toString('hex');

/** Applique la ADMIN_PASSWORD (si définie) au compte super_admin. */
const applyAdminPasswordFromEnv = (data: Database): boolean => {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  if (pwd.length < 8) {
    console.warn('[BiblioTech] ADMIN_PASSWORD ignoré : 8 caractères minimum.');
    return false;
  }
  const admin = data.users.find((u) => u.role === 'super_admin');
  if (!admin) return false;
  admin.passwordHash = hashPassword(pwd);
  admin.legacyDemoPassword = false;
  return true;
};

// ---------- Cohérence métier ----------

/**
 * - Marque les prêts dépassés comme "en_retard"
 * - Expire les réservations de plus de 4 jours
 * - Recalcule le stock disponible = total - prêts actifs - réservations actives
 * Retourne true si quelque chose a changé.
 */
export const sweep = (data: Database): boolean => {
  let changed = false;
  const today = todayISO();
  const now = Date.now();

  for (const loan of data.loans) {
    if (loan.status === 'en_cours' && loan.dueDate < today) {
      loan.status = 'en_retard';
      changed = true;
    }
  }

  for (const res of data.reservations) {
    const wasPaidHold = res.status === 'active';
    // 'en_attente_paiement' = livre mis de côté pendant le paiement (délai court) ; 'active' = payée, 4 jours
    if ((res.status === 'active' || res.status === 'en_attente_paiement') && new Date(res.expiresAt).getTime() < now) {
      res.status = 'expiree';
      changed = true;
      if (wasPaidHold) {
        // Réservation non retirée dans les 4 jours : elle expire et l'exemplaire revient en rayon (stock recalculé plus bas)
        data.activityLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actorName: 'Système',
          actorRole: 'systeme',
          action: 'Expiration Réservation',
          target: res.reference,
          details: `"${res.bookTitle}" non retiré par ${res.userName} : exemplaire remis en rayon`,
          ipAddress: '-',
        });
        data.activityLogs = data.activityLogs.slice(0, 500);
      }
    }
  }

  const stillPending = (data.pendingRegistrations ?? []).filter((p) => new Date(p.expiresAt).getTime() >= now);
  if (stillPending.length !== (data.pendingRegistrations ?? []).length) {
    data.pendingRegistrations = stillPending;
    changed = true;
  }

  const activeLoans = new Map<string, number>();
  for (const l of data.loans) {
    if (l.status !== 'rendu') activeLoans.set(l.bookId, (activeLoans.get(l.bookId) || 0) + 1);
  }
  const activeRes = new Map<string, number>();
  for (const r of data.reservations) {
    if (r.status === 'active' || r.status === 'en_attente_paiement') activeRes.set(r.bookId, (activeRes.get(r.bookId) || 0) + 1);
  }
  for (const book of data.books) {
    const expected = Math.max(
      0,
      Math.min(book.stockTotal, book.stockTotal - (activeLoans.get(book.id) || 0) - (activeRes.get(book.id) || 0))
    );
    if (book.stockAvailable !== expected) {
      book.stockAvailable = expected;
      changed = true;
    }
  }

  return changed;
};

// ---------- API du store ----------

export const initStore = (): void => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    db = buildInitialDb();
    migrate(db);
    applyAdminPasswordFromEnv(db);
    sweep(db);
    save();
    console.log('[BiblioTech] Base de données créée dans', DB_FILE);
    return;
  }

  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Database;
  } catch (err) {
    // Fichier corrompu : on le conserve pour analyse au lieu de l'écraser silencieusement
    backupExisting('corrupted');
    throw new Error(`database.json illisible (${(err as Error).message}). Une copie a été conservée.`);
  }

  const needsBackup = db.users?.some((u) => !isScryptHash(u.passwordHash));
  if (needsBackup) backupExisting('pre-migration');
  const migrated = migrate(db);
  const adminChanged = applyAdminPasswordFromEnv(db);
  const swept = sweep(db);
  if (migrated || adminChanged || swept) save();
};

const ensure = (): Database => {
  if (!db) initStore();
  return db!;
};

/** Lecture (applique les expirations/retards avant de répondre). */
export const read = (): Database => {
  const data = ensure();
  if (sweep(data)) save();
  return data;
};

/**
 * Mutation : `fn` reçoit la base, peut lever une erreur pour annuler.
 * En cas d'erreur, l'état en mémoire est restauré depuis le disque pour éviter toute modification partielle.
 */
export const mutate = <T>(fn: (data: Database) => T): T => {
  const data = ensure();
  sweep(data);
  const snapshot = JSON.stringify(data);
  try {
    const result = fn(data);
    sweep(data);
    save();
    return result;
  } catch (err) {
    db = JSON.parse(snapshot) as Database;
    throw err;
  }
};

export const nextCounter = (data: Database, name: string, start = 1000): number => {
  const next = (data.counters[name] ?? start - 1) + 1;
  data.counters[name] = next;
  return next;
};

/** Remet la base de démonstration (sauvegarde préalable). Réservé au développement. */
export const resetToDemo = (): void => {
  backupExisting('pre-reset');
  db = buildInitialDb();
  migrate(db);
  applyAdminPasswordFromEnv(db);
  sweep(db);
  save();
};
