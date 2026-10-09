import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NextFunction, Request, Response, Router } from 'express';
import type {
  Book,
  Loan,
  Receipt,
  Reservation,
  PaymentTransaction,
  PublicUser,
  SubscriptionPlan,
  User,
  UserRole,
} from '../src/types/library';
import {
  burnVerifyTime,
  clearSessionCookie,
  createRateLimiter,
  getSessionSecret,
  getSessionToken,
  hashPassword,
  parseCookies,
  readSession,
  setSessionCookie,
  signSession,
  verifyPassword,
} from './auth';
import { buildAuthUrl as buildGoogleAuthUrl, fetchGoogleProfile, isGoogleConfigured } from './google';
import { describeMailError, sendMail, verificationEmail, mailMode } from './mailer';
import { checkSession, createCheckoutSession, isBachsConfigured, reservationProduct, toBachsAmount } from './bachs';
import { Database, DATA_DIR, DB_FILE, mutate, nextCounter, read, resetToDemo, todayISO } from './store';

// ======================================================
// Utilitaires
// ======================================================

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};

const wrapAsync =
  (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const wrap =
  (fn: (req: Request, res: Response) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req, res);
    } catch (err) {
      next(err);
    }
  };

const clean = (value: unknown, max: number, opts: { min?: number; label: string }): string => {
  if (typeof value !== 'string') fail(400, `${opts.label} invalide.`);
  // eslint-disable-next-line no-control-regex
  const v = (value as string).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (v.length < (opts.min ?? 0)) fail(400, `${opts.label} requis.`);
  if (v.length > max) fail(400, `${opts.label} trop long (${max} caractères max).`);
  return v;
};

const optionalClean = (value: unknown, max: number, label: string): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return clean(value, max, { label });
};

const toInt = (value: unknown, label: string, min: number, max: number): number => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : (value as number);
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    fail(400, `${label} invalide (entier entre ${min} et ${max}).`);
  }
  return n;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CATEGORIES: Book['category'][] = ['Informatique', 'Littérature', 'Droit', 'Sciences', 'Économie', 'Philosophie'];
const PLAN_PRICES: Record<SubscriptionPlan, { amount: number; maxLoans: number }> = {
  Gratuit: { amount: 0, maxLoans: 2 },
  'Étudiant Plus': { amount: 2500, maxLoans: 5 },
  'Recherche & Doctorat': { amount: 10000, maxLoans: 15 },
};
const PAYMENT_METHODS: PaymentTransaction['paymentMethod'][] = ['Bachs', 'MTN MoMo', 'Moov Money', 'Wave', 'Carte Bancaire'];
const LOAN_DAYS = 14;
const RESERVATION_DAYS = 4;
const PAYMENT_HOLD_MINUTES = 55; // durée de mise de côté pendant le paiement (session Bachs ≈ 1 h)
const DAILY_LATE_FEE = 200;

const isStaff = (u?: User | null) => !!u && (u.role === 'admin' || u.role === 'super_admin');

const publicUser = (u: User): PublicUser => {
  const { passwordHash: _p, legacyDemoPassword: _l, googleId: _g, ...rest } = u;
  return rest;
};

const safeCoverUrl = (value: unknown, fallback: string): string => {
  if (value === undefined || value === null || value === '') return fallback;
  const v = clean(value, 2048, { label: 'URL de couverture' });
  if (/^(https?:\/\/|\/[^/]|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,)/i.test(v)) return v;
  return fail(400, 'URL de couverture invalide (http(s), chemin local ou image encodée uniquement).');
};

const clientIp = (req: Request) => (req.ip || req.socket.remoteAddress || 'inconnue').replace('::ffff:', '');

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16);

const logActivity = (
  data: Database,
  actor: User | null,
  action: string,
  target: string,
  details: string,
  req: Request
) => {
  data.activityLogs.unshift({
    id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: stamp(),
    actorName: actor ? actor.name : 'Visiteur Anonyme',
    actorRole: actor ? actor.role : 'visiteur',
    action,
    target,
    details,
    ipAddress: clientIp(req),
  });
  data.activityLogs = data.activityLogs.slice(0, 500);
};

const logVisitor = (
  data: Database,
  req: Request,
  action: Database['visitors'][number]['action'],
  actor: User | null,
  device: string,
  details: string
) => {
  data.visitors.unshift({
    id: `vis-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    action,
    userId: actor?.id,
    userName: actor ? actor.name : 'Visiteur en ligne',
    userEmail: actor ? actor.email : 'non-connecté',
    userRole: actor ? actor.role : 'visiteur',
    device,
    ip: clientIp(req),
    details,
  });
  data.visitors = data.visitors.slice(0, 200);
};

const sha256 = (input: string) => crypto.createHash('sha256').update(input).digest('hex');

const buildReceipt = (
  data: Database,
  type: Receipt['type'],
  user: User,
  items: Receipt['items'],
  extra: Partial<Receipt> = {}
): Receipt => {
  const n = String(nextCounter(data, 'receipt', 10000));
  const year = new Date().getFullYear();
  const prefix = type === 'reservation' ? 'TICK' : type === 'paiement' ? 'QUITT-PAY' : 'QUITT';
  const base = {
    receiptNumber: `${prefix}-${year}-${n}`,
    type,
    createdAt: new Date().toISOString(),
    userId: user.id,
    items,
    expiresAt: extra.expiresAt,
    amountPaid: extra.amountPaid,
  };
  const receipt: Receipt = {
    id: `rcpt-${crypto.randomUUID()}`,
    ...base,
    userName: user.name,
    userEmail: user.email,
    studentCardNumber: user.studentCardNumber,
    academicLevel: user.academicLevel,
    filiere: user.filiere,
    school: user.school,
    // Empreinte réelle SHA-256 du contenu de la quittance
    securityHash: 'SHA256:' + sha256(JSON.stringify(base)),
    operatorName: 'Bibliothèque Universitaire — Guichet BiblioTech 2GroupESGIS',
    ...extra,
  };
  data.receipts.unshift(receipt);
  return receipt;
};

/** Recalcule le stock disponible (prêts + réservations actives ou en attente de paiement). */
const sweepStock = (data: Database) => {
  for (const book of data.books) {
    const used =
      data.loans.filter((l) => l.bookId === book.id && l.status !== 'rendu').length +
      data.reservations.filter((r) => r.bookId === book.id && (r.status === 'active' || r.status === 'en_attente_paiement')).length;
    book.stockAvailable = Math.max(0, Math.min(book.stockTotal, book.stockTotal - used));
  }
};

const holdsBook = (r: Reservation) => r.status === 'active' || r.status === 'en_attente_paiement';

const activeCount = (data: Database, userId: string) =>
  data.loans.filter((l) => l.userId === userId && l.status !== 'rendu').length +
  data.reservations.filter((r) => r.userId === userId && holdsBook(r)).length;

const assertCanBorrow = (data: Database, user: User) => {
  if (user.status === 'suspendu') fail(403, 'Votre compte est suspendu. Contactez l\'administration de la bibliothèque.');
  const late = data.loans.some((l) => l.userId === user.id && l.status === 'en_retard');
  if (late) fail(409, 'Vous avez un livre en retard. Restituez-le d\'abord pour débloquer votre compte.');
  if (activeCount(data, user.id) >= user.maxLoans) {
    fail(409, `Quota atteint (${user.maxLoans} livres max pour la formule ${user.subscriptionPlan}).`);
  }
};

const assertNoDuplicate = (data: Database, user: User, bookId: string) => {
  const hasLoan = data.loans.some((l) => l.userId === user.id && l.bookId === bookId && l.status !== 'rendu');
  const hasRes = data.reservations.some((r) => r.userId === user.id && r.bookId === bookId && holdsBook(r));
  if (hasLoan || hasRes) fail(409, 'Vous avez déjà ce livre en prêt ou en réservation.');
};

const nextRef = (data: Database, kind: 'EMP' | 'RES') =>
  `${kind}-${new Date().getFullYear()}-${nextCounter(data, kind.toLowerCase(), 1000)}`;

const newId = (prefix: string) => `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

// ======================================================
// État renvoyé au client (filtré selon le rôle)
// ======================================================

const buildState = (data: Database, user: User | null) => {
  const staff = isStaff(user);
  return {
    me: user ? publicUser(user) : null,
    books: staff ? data.books : data.books.filter((b) => !b.isArchived),
    loans: staff ? data.loans : user ? data.loans.filter((l) => l.userId === user.id) : [],
    reservations: staff ? data.reservations : user ? data.reservations.filter((r) => r.userId === user.id) : [],
    receipts: staff ? data.receipts : user ? data.receipts.filter((r) => r.userId === user.id) : [],
    transactions: staff ? data.transactions : user ? data.transactions.filter((t) => t.userId === user.id) : [],
    users: staff ? data.users.map(publicUser) : [],
    activityLogs: staff ? data.activityLogs : [],
    visitors: staff ? data.visitors : [],
  };
};

// ======================================================
// Router
// ======================================================

export const createApiRouter = (): Router => {
  const router = Router();
  const secret = getSessionSecret(DATA_DIR);
  const isProd = process.env.NODE_ENV === 'production';

  const loginLimiter = createRateLimiter(6, 15 * 60 * 1000);
  const loginIpLimiter = createRateLimiter(30, 15 * 60 * 1000);
  const registerLimiter = createRateLimiter(10, 60 * 60 * 1000);
  const visitLimiter = createRateLimiter(30, 60 * 1000);

  // ---- Protection CSRF : les requêtes qui modifient l'état doivent venir de la même origine ----
  router.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) {
          return res.status(403).json({ error: 'Origine non autorisée.' });
        }
      } catch {
        return res.status(403).json({ error: 'Origine invalide.' });
      }
    }
    next();
  });

  // ---- Résolution de l'utilisateur courant depuis le cookie de session ----
  const currentUser = (req: Request): User | null => {
    const uid = readSession(getSessionToken(req), secret);
    if (!uid) return null;
    const user = read().users.find((u) => u.id === uid);
    if (!user || user.status === 'suspendu') return null;
    return user;
  };

  const requireAuth = (req: Request): User => currentUser(req) ?? fail(401, 'Connexion requise.');
  const requireStaff = (req: Request): User => {
    const u = requireAuth(req);
    if (!isStaff(u)) fail(403, 'Accès réservé à l\'administration.');
    return u;
  };

  const respondState = (req: Request, res: Response, extra: Record<string, unknown> = {}) => {
    res.json({ success: true, ...extra, state: buildState(read(), currentUser(req)) });
  };

  // ------------------------------------------------------
  // Santé & état
  // ------------------------------------------------------
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get(
    '/state',
    wrap((req, res) => {
      res.json(buildState(read(), currentUser(req)));
    })
  );

  // ------------------------------------------------------
  // Authentification
  // ------------------------------------------------------
  // ---- Création d'un compte étudiant (utilisée après vérification d'e-mail ou via Google) ----
  const createStudentAccount = (
    data: Database,
    f: {
      email: string;
      lastName: string;
      firstName: string;
      school: string;
      academicLevel: string;
      filiere: string;
      birthDate: string;
      nationalIdCard?: string;
      passwordHash: string;
      googleId?: string;
      avatar?: string;
    }
  ): User => {
    let card = '';
    do {
      card = `ETU-${new Date().getFullYear()}-${nextCounter(data, 'student', 1000)}`;
    } while (data.users.some((u) => u.studentCardNumber === card));
    const created: User = {
      id: newId('user'),
      name: `${f.lastName} ${f.firstName}`.trim(),
      firstName: f.firstName,
      email: f.email,
      role: 'etudiant',
      studentCardNumber: card,
      nationalIdCard: f.nationalIdCard || `CIP-${crypto.randomInt(1000000000, 9999999999)}`,
      birthDate: f.birthDate,
      school: f.school,
      academicLevel: f.academicLevel,
      filiere: f.filiere,
      faculty: `${f.school} — ${f.academicLevel} (${f.filiere})`,
      subscriptionPlan: 'Gratuit',
      maxLoans: PLAN_PRICES.Gratuit.maxLoans,
      status: 'actif',
      joinedDate: todayISO(),
      passwordHash: f.passwordHash,
      googleId: f.googleId,
      avatar: f.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
    data.users.push(created);
    return created;
  };

  const appUrl = (): string => {
    const configured = (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, '');
    if (configured) return configured;
    if (isProd) fail(500, 'APP_PUBLIC_URL doit être défini en production (adresse publique du site).');
    return `http://localhost:${process.env.PORT || 3000}`;
  };

  const VERIFY_HOURS = 24;
  const RESEND_DELAY_MS = 120 * 1000;
  const sha256hex = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

  /** Génère un nouveau jeton pour l'inscription en attente et envoie le lien ; en cas d'échec, lève le délai anti-spam. */
  const sendVerification = async (email: string, firstName: string): Promise<void> => {
    const token = crypto.randomBytes(32).toString('hex');
    mutate((data) => {
      const p = data.pendingRegistrations.find((x) => x.email === email)!;
      p.tokenHash = sha256hex(token); // seule l'empreinte est stockée
      p.expiresAt = new Date(Date.now() + VERIFY_HOURS * 3600 * 1000).toISOString();
      p.lastSentAt = new Date().toISOString();
    });
    const link = `${appUrl()}/api/auth/verify-email?token=${token}`;
    try {
      await sendMail(verificationEmail({ to: email, firstName, link, hours: VERIFY_HOURS }));
    } catch (err) {
      const reason = describeMailError(err);
      console.error('[BiblioTech] Échec d\'envoi du mail de vérification :', reason, '| détail :', (err as Error).message);
      mutate((data) => {
        const p = data.pendingRegistrations.find((x) => x.email === email);
        if (p) p.lastSentAt = new Date(0).toISOString();
      });
      fail(502, `Impossible d'envoyer l'e-mail de vérification. Vérifiez l'adresse ou réessayez plus tard.${isProd ? '' : ' (' + reason + ')'}`);
    }
  };

  router.post(
    '/auth/register',
    wrapAsync(async (req, res) => {
      if (!registerLimiter.hit(clientIp(req))) fail(429, 'Trop d\'inscriptions depuis cette adresse. Réessayez plus tard.');
      const b = req.body || {};
      const lastName = clean(b.lastName, 60, { min: 1, label: 'Nom' });
      const firstName = clean(b.firstName, 60, { min: 1, label: 'Prénom' });
      const email = clean(b.email, 120, { min: 3, label: 'Email' }).toLowerCase();
      if (!EMAIL_RE.test(email)) fail(400, 'Adresse email invalide.');
      const password = typeof b.password === 'string' ? b.password : '';
      if (password.length < 8 || password.length > 128) fail(400, 'Le mot de passe doit contenir entre 8 et 128 caractères.');
      const school = clean(b.school, 150, { min: 1, label: 'École' });
      const academicLevel = optionalClean(b.academicLevel, 40, 'Niveau') || 'Licence 2';
      const filiere = optionalClean(b.filiere, 80, 'Filière') || 'IRTG';
      const birthDate = clean(b.birthDate, 10, { min: 10, label: 'Date de naissance' });
      const birth = new Date(birthDate);
      if (Number.isNaN(birth.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) fail(400, 'Date de naissance invalide.');
      const ageYears = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (ageYears < 14 || ageYears > 100) fail(400, 'Date de naissance invalide.');
      if (mailMode() === 'none') fail(503, 'L\'envoi d\'e-mails n\'est pas configuré : inscription impossible pour le moment.');

      // Le compte n'est PAS créé ici : l'inscription reste en attente jusqu'au clic sur le lien reçu par e-mail
      mutate((data) => {
        if (data.users.some((u) => u.email === email)) fail(409, 'Un compte est déjà associé à cet email.');
        const existing = data.pendingRegistrations.find((p) => p.email === email);
        if (existing && Date.now() - new Date(existing.lastSentAt).getTime() < RESEND_DELAY_MS) {
          fail(429, 'Un e-mail de vérification vient déjà d\'être envoyé. Patientez 2 minutes avant de réessayer.');
        }
        const pending = {
          email,
          lastName,
          firstName,
          school,
          academicLevel,
          filiere,
          birthDate,
          nationalIdCard: optionalClean(b.nationalIdCard, 40, 'Carte d\'identité'),
          passwordHash: hashPassword(password),
          tokenHash: '',
          expiresAt: new Date(Date.now() + VERIFY_HOURS * 3600 * 1000).toISOString(),
          lastSentAt: new Date(0).toISOString(),
        };
        data.pendingRegistrations = data.pendingRegistrations.filter((p) => p.email !== email);
        data.pendingRegistrations.push(pending);
      });
      await sendVerification(email, firstName);
      res.status(202).json({ success: true, pending: true, email });
    })
  );

  router.post(
    '/auth/resend-verification',
    wrapAsync(async (req, res) => {
      const email = clean(req.body?.email, 120, { min: 3, label: 'Email' }).toLowerCase();
      if (!registerLimiter.hit(`resend|${clientIp(req)}`)) fail(429, 'Trop de demandes. Réessayez plus tard.');
      const pending = read().pendingRegistrations.find((p) => p.email === email);
      if (!pending) return fail(404, 'Aucune inscription en attente pour cette adresse (le lien a peut-être expiré : recommencez l\'inscription).');
      if (Date.now() - new Date(pending.lastSentAt).getTime() < RESEND_DELAY_MS) {
        return fail(429, 'Un e-mail vient d\'être envoyé. Patientez 2 minutes avant de demander un nouvel envoi.');
      }
      await sendVerification(email, pending.firstName);
      res.json({ success: true });
    })
  );

  // Destination du bouton « Vérifier mon e-mail » : c'est ici que le compte est réellement créé.
  // Pas de connexion automatique (certains antivirus ouvrent les liens des mails) : l'utilisateur se connecte lui-même.
  router.get(
    '/auth/verify-email',
    wrap((req, res) => {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (!/^[0-9a-f]{64}$/.test(token)) return res.redirect('/?email_verifie=0');
      const hash = sha256hex(token);
      let ok = false;
      mutate((data) => {
        const pending = data.pendingRegistrations.find((p) => p.tokenHash === hash && new Date(p.expiresAt).getTime() > Date.now());
        if (!pending) return;
        ok = true;
        data.pendingRegistrations = data.pendingRegistrations.filter((p) => p !== pending);
        if (data.users.some((u) => u.email === pending.email)) return; // déjà vérifié : rien à recréer
        const created = createStudentAccount(data, pending);
        logActivity(data, created, 'Nouvelle Inscription', created.name, `Carte ${created.studentCardNumber} — e-mail vérifié`, req);
        logVisitor(data, req, 'inscription', created, 'Inscription en ligne', `Nouvelle inscription vérifiée : ${created.name}`);
      });
      res.redirect(ok ? '/?email_verifie=1' : '/?email_verifie=0');
    })
  );

  // ------------------------------------------------------
  // Connexion avec Google (OAuth 2.0)
  // ------------------------------------------------------
  const OAUTH_STATE_COOKIE = 'bt_oauth_state';
  const googleRedirectUri = () => `${appUrl()}/api/auth/google/callback`;

  router.get(
    '/auth/google',
    wrap((req, res) => {
      if (!isGoogleConfigured()) return res.redirect('/?google=non_configure');
      const state = crypto.randomBytes(16).toString('hex');
      const secure = isProd ? '; Secure' : '';
      res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=${state}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=600${secure}`);
      res.redirect(buildGoogleAuthUrl(googleRedirectUri(), state));
    })
  );

  router.get(
    '/auth/google/callback',
    wrapAsync(async (req, res) => {
      const clearState = () => res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=0`);
      const finish = (code: string) => {
        clearState();
        res.redirect(`/?google=${code}`);
      };
      if (!isGoogleConfigured()) return finish('non_configure');
      if (typeof req.query.error === 'string') return finish('annule');

      const cookieState = parseCookies(req.headers.cookie)[OAUTH_STATE_COOKIE] || '';
      const state = typeof req.query.state === 'string' ? req.query.state : '';
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      const a = Buffer.from(state);
      const b = Buffer.from(cookieState);
      if (!code || !state || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return finish('erreur');

      let profile;
      try {
        profile = await fetchGoogleProfile(code, googleRedirectUri());
      } catch (err) {
        console.error('[BiblioTech] Connexion Google échouée :', (err as Error).message);
        return finish('erreur');
      }
      // Seules les adresses vérifiées par Google sont acceptées (sinon rattachement par e-mail dangereux)
      if (!profile.emailVerified) return finish('email_non_verifie');

      let outcome: 'ok' | 'suspendu' | 'conflit' = 'ok';
      let userId = '';
      mutate((data) => {
        let user = data.users.find((u) => u.googleId === profile.sub) ?? data.users.find((u) => u.email === profile.email);
        if (user) {
          if (user.googleId && user.googleId !== profile.sub) {
            outcome = 'conflit';
            return;
          }
          if (user.status === 'suspendu') {
            outcome = 'suspendu';
            return;
          }
          user.googleId = profile.sub; // rattache le compte existant
        } else {
          user = createStudentAccount(data, {
            email: profile.email,
            lastName: profile.familyName || profile.givenName || 'Étudiant',
            firstName: profile.givenName || '',
            school: 'Non renseignée',
            academicLevel: 'Non renseigné',
            filiere: 'Non renseignée',
            birthDate: '',
            passwordHash: hashPassword(crypto.randomBytes(32).toString('hex')), // aucun mot de passe utilisable
            googleId: profile.sub,
            avatar: profile.picture,
          });
          logActivity(data, user, 'Nouvelle Inscription', user.name, `Carte ${user.studentCardNumber} — via Google`, req);
        }
        // L'e-mail est vérifié par Google : une inscription par e-mail encore en attente n'a plus lieu d'être
        data.pendingRegistrations = data.pendingRegistrations.filter((p) => p.email !== profile.email);
        logActivity(data, user, 'Connexion Réussie', user.email, 'Connexion avec Google', req);
        logVisitor(data, req, 'connexion', user, 'Google', `Utilisateur connecté via Google : ${user.name}`);
        userId = user.id;
      });
      if (outcome !== 'ok') return finish(outcome);
      setSessionCookie(req, res, signSession(userId, secret));
      finish('ok');
    })
  );

  router.post(
    '/auth/login',
    wrap((req, res) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 120) : '';
      const password = typeof req.body?.password === 'string' ? req.body.password.slice(0, 128) : '';
      const key = `${clientIp(req)}|${email}`;

      if (loginLimiter.isBlocked(key) || loginIpLimiter.isBlocked(clientIp(req))) fail(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
      if (!email || !password) fail(400, 'Email et mot de passe requis.');

      const data = read();
      const user = data.users.find((u) => u.email === email);
      const valid = user ? verifyPassword(password, user.passwordHash) : (burnVerifyTime(), false);

      if (!user || !valid) {
        loginLimiter.hit(key);
        loginIpLimiter.hit(clientIp(req));
        mutate((d) => logActivity(d, null, 'Tentative de Connexion Échouée', email || '(vide)', 'Identifiants invalides', req));
        return fail(401, 'Email ou mot de passe incorrect.');
      }
      if (user.status === 'suspendu') {
        mutate((d) => logActivity(d, null, 'Tentative sur Compte Suspendu', user.email, 'Accès bloqué', req));
        return fail(403, 'Ce compte est suspendu. Contactez l\'administration de la bibliothèque.');
      }
      if (isProd && user.legacyDemoPassword) {
        return fail(403, 'Ce compte de démonstration est désactivé en production. Définissez un nouveau mot de passe via ADMIN_PASSWORD.');
      }

      loginLimiter.reset(key);
      mutate((d) => {
        logActivity(d, user, 'Connexion Réussie', user.email, `Rôle ${user.role}`, req);
        logVisitor(d, req, 'connexion', user, req.headers['user-agent']?.includes('Mobile') ? 'Smartphone' : 'Ordinateur PC/Mac', `Utilisateur connecté : ${user.name} (${user.role})`);
      });
      setSessionCookie(req, res, signSession(user.id, secret));
      res.json({ success: true, state: buildState(read(), user) });
    })
  );

  router.post(
    '/auth/logout',
    wrap((req, res) => {
      const user = currentUser(req);
      if (user) mutate((d) => logActivity(d, user, 'Déconnexion', user.name, 'Fermeture de la session', req));
      clearSessionCookie(res);
      res.json({ success: true, state: buildState(read(), null) });
    })
  );

  // ------------------------------------------------------
  // Visites (journal) : l'identité vient de la session, jamais du client
  // ------------------------------------------------------
  router.post(
    '/visitors',
    wrap((req, res) => {
      if (!visitLimiter.hit(clientIp(req))) return void res.status(204).end();
      const user = currentUser(req);
      mutate((d) =>
        logVisitor(
          d,
          req,
          'visite_site',
          user,
          req.headers['user-agent']?.includes('Mobile') ? 'Smartphone' : 'Ordinateur PC/Mac',
          user ? `Session reprise : ${user.name}` : 'Nouvel utilisateur connecté à l\'application'
        )
      );
      res.json({ success: true });
    })
  );

  router.get(
    '/visitors',
    wrap((req, res) => {
      requireStaff(req);
      res.json(read().visitors);
    })
  );

  // ------------------------------------------------------
  // Livres (administration)
  // ------------------------------------------------------
  const parseBookInput = (b: any, existing?: Book) => {
    const title = clean(b.title, 200, { min: 1, label: 'Titre' });
    const author = clean(b.author, 200, { min: 1, label: 'Auteur' });
    const isbn = clean(b.isbn, 20, { min: 5, label: 'ISBN' });
    const category = b.category as Book['category'];
    if (!CATEGORIES.includes(category)) fail(400, 'Catégorie invalide.');
    return {
      title,
      author,
      isbn,
      category,
      publishedYear: toInt(b.publishedYear, 'Année', 1400, new Date().getFullYear() + 1),
      publisher: clean(b.publisher ?? '', 120, { label: 'Éditeur' }),
      pages: toInt(b.pages, 'Nombre de pages', 1, 20000),
      summary: clean(b.summary ?? '', 3000, { label: 'Résumé' }),
      backCoverText: clean(b.backCoverText ?? '', 3000, { label: '4e de couverture' }),
      shelfLocation: clean(b.shelfLocation ?? '', 60, { min: 1, label: 'Emplacement' }),
      stockTotal: toInt(b.stockTotal, 'Stock total', 0, 10000),
      reservationPrice: toInt(b.reservationPrice ?? 0, 'Prix de réservation (FCFA)', 0, 10000000),
      coverUrl: safeCoverUrl(b.coverUrl, existing?.coverUrl ?? '/images/book-1.jpg'),
    };
  };

  const normalizeIsbn = (s: string) => s.replace(/[^0-9Xx]/g, '').toUpperCase();

  // Téléversement de la photo de couverture : image validée (type, signature, taille) puis enregistrée sur le serveur
  const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
  const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
    'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
    'image/png': { ext: 'png', magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
    'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  };

  router.post(
    '/uploads/cover',
    wrap((req, res) => {
      const admin = requireStaff(req);
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) return fail(400, 'Image invalide (formats acceptés : JPEG, PNG, WebP).');
      const type = IMAGE_TYPES[m[1]];
      const buffer = Buffer.from(m[2], 'base64');
      if (buffer.length < 20 || buffer.length > 2 * 1024 * 1024) fail(413, 'Image trop volumineuse (2 Mo maximum).');
      if (!type.magic(buffer)) fail(400, 'Le contenu du fichier ne correspond pas à une image valide.');
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const name = `cover-${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${type.ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
      mutate((data) => logActivity(data, admin, 'Téléversement Image', name, `Photo de couverture (${Math.round(buffer.length / 1024)} Ko)`, req));
      res.json({ success: true, url: `/uploads/${name}` });
    })
  );

  router.post(
    '/books',
    wrap((req, res) => {
      const admin = requireStaff(req);
      const input = parseBookInput(req.body || {});
      mutate((data) => {
        if (data.books.some((bk) => normalizeIsbn(bk.isbn) === normalizeIsbn(input.isbn))) {
          fail(409, 'Un livre avec cet ISBN existe déjà dans le catalogue.');
        }
        const book: Book = {
          ...input,
          id: newId('book'),
          stockAvailable: input.stockTotal,
          isArchived: false,
          featured: false,
          rating: 5.0,
          reviewsCount: 1,
        };
        data.books.unshift(book);
        logActivity(data, admin, 'Ajout de Livre', book.title, `ISBN ${book.isbn}, Stock: ${book.stockTotal}`, req);
      });
      respondState(req, res);
    })
  );

  router.put(
    '/books/:id',
    wrap((req, res) => {
      const admin = requireStaff(req);
      mutate((data) => {
        const book = data.books.find((bk) => bk.id === req.params.id) ?? fail(404, 'Livre introuvable.');
        const input = parseBookInput(req.body || {}, book);
        if (data.books.some((bk) => bk.id !== book.id && normalizeIsbn(bk.isbn) === normalizeIsbn(input.isbn))) {
          fail(409, 'Un autre livre utilise déjà cet ISBN.');
        }
        const inUse = data.loans.filter((l) => l.bookId === book.id && l.status !== 'rendu').length +
          data.reservations.filter((r) => r.bookId === book.id && holdsBook(r)).length;
        if (input.stockTotal < inUse) {
          fail(409, `Stock total impossible : ${inUse} exemplaire(s) sont actuellement prêtés ou réservés.`);
        }
        Object.assign(book, input);
        logActivity(data, admin, 'Modification Livre', book.title, 'Mise à jour de la notice', req);
      });
      respondState(req, res);
    })
  );

  router.post(
    '/books/:id/archive',
    wrap((req, res) => {
      const admin = requireStaff(req);
      mutate((data) => {
        const book = data.books.find((bk) => bk.id === req.params.id) ?? fail(404, 'Livre introuvable.');
        const busy =
          data.loans.some((l) => l.bookId === book.id && l.status !== 'rendu') ||
          data.reservations.some((r) => r.bookId === book.id && holdsBook(r));
        if (busy) fail(409, 'Impossible d\'archiver : des exemplaires sont en cours d\'emprunt ou réservés.');
        book.isArchived = true;
        logActivity(data, admin, 'Archivage Livre', book.title, 'Livre archivé', req);
      });
      respondState(req, res);
    })
  );

  router.post(
    '/books/:id/restore',
    wrap((req, res) => {
      const admin = requireStaff(req);
      mutate((data) => {
        const book = data.books.find((bk) => bk.id === req.params.id) ?? fail(404, 'Livre introuvable.');
        book.isArchived = false;
        logActivity(data, admin, 'Restauration Livre', book.title, 'Livre restauré', req);
      });
      respondState(req, res);
    })
  );

  // ------------------------------------------------------
  // Emprunts
  // ------------------------------------------------------
  const createLoan = (data: Database, user: User, book: Book, req: Request): Loan => {
    const now = new Date();
    const due = new Date(now.getTime() + LOAN_DAYS * 24 * 3600 * 1000);
    const loan: Loan = {
      id: newId('loan'),
      reference: nextRef(data, 'EMP'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      studentCardNumber: user.studentCardNumber,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCover: book.coverUrl,
      isbn: book.isbn,
      borrowDate: now.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      status: 'en_cours',
      renewalCount: 0,
      dailyLateFee: DAILY_LATE_FEE,
    };
    data.loans.unshift(loan);
    return loan;
  };

  router.post(
    '/loans',
    wrap((req, res) => {
      const user = requireAuth(req);
      const bookId = clean(req.body?.bookId, 80, { min: 1, label: 'Livre' });
      let receipt!: Receipt;
      mutate((data) => {
        const me = data.users.find((u) => u.id === user.id)!;
        const book = data.books.find((b) => b.id === bookId && !b.isArchived) ?? fail(404, 'Livre introuvable.');
        assertCanBorrow(data, me);
        assertNoDuplicate(data, me, book.id);
        if (book.stockAvailable <= 0) fail(409, 'Rupture de stock temporaire. Vous pouvez le réserver pour son retour.');
        const loan = createLoan(data, me, book, req);
        receipt = buildReceipt(data, 'emprunt', me, [
          { bookId: book.id, title: book.title, author: book.author, isbn: book.isbn, dueDate: loan.dueDate, shelfLocation: book.shelfLocation },
        ]);
        logActivity(data, me, 'Nouvel Emprunt', loan.reference, `"${book.title}" prêté à ${me.name} (échéance: ${loan.dueDate})`, req);
        logVisitor(data, req, 'emprunt', me, 'Système Emprunts', `Emprunt de ${LOAN_DAYS} jours : "${book.title}" (Réf: ${loan.reference})`);
      });
      respondState(req, res, { receipt });
    })
  );

  router.put(
    '/loans/:id/return',
    wrap((req, res) => {
      const admin = requireStaff(req);
      let lateFee = 0;
      mutate((data) => {
        const loan = data.loans.find((l) => l.id === req.params.id) ?? fail(404, 'Emprunt introuvable.');
        if (loan.status === 'rendu') fail(409, 'Ce livre a déjà été restitué.');
        const today = todayISO();
        const daysLate = Math.max(0, Math.ceil((new Date(today).getTime() - new Date(loan.dueDate).getTime()) / 86400000));
        lateFee = daysLate * loan.dailyLateFee;
        loan.status = 'rendu';
        loan.returnDate = today;
        loan.lateFee = lateFee;
        logActivity(data, admin, 'Retour de Livre', loan.reference, `Retour de "${loan.bookTitle}"${lateFee ? ` — pénalité ${lateFee} FCFA` : ''}`, req);
        logVisitor(data, req, 'retour', admin, 'Guichet Retours', `Restitution validée : "${loan.bookTitle}". Exemplaire remis en stock (+1)`);
      });
      respondState(req, res, { lateFee });
    })
  );

  router.put(
    '/loans/:id/renew',
    wrap((req, res) => {
      const user = requireAuth(req);
      let newDueDate = '';
      mutate((data) => {
        const loan = data.loans.find((l) => l.id === req.params.id) ?? fail(404, 'Prêt introuvable.');
        if (loan.userId !== user.id && !isStaff(user)) fail(403, 'Ce prêt ne vous appartient pas.');
        if (loan.status === 'rendu') fail(409, 'Ce livre a déjà été restitué.');
        if (loan.status === 'en_retard') fail(409, 'Impossible de renouveler un livre déjà en retard.');
        if (loan.renewalCount >= 1) fail(409, 'Ce prêt a déjà été renouvelé une fois (limite maximale).');
        const due = new Date(loan.dueDate);
        due.setUTCDate(due.getUTCDate() + LOAN_DAYS);
        newDueDate = due.toISOString().slice(0, 10);
        loan.dueDate = newDueDate;
        loan.renewalCount += 1;
        logActivity(data, user, 'Prolongation Prêt', loan.reference, `Prolongé jusqu'au ${newDueDate}`, req);
      });
      respondState(req, res, { newDueDate });
    })
  );

  // ------------------------------------------------------
  // Réservations (4 jours) — un ou plusieurs livres (panier)
  // ------------------------------------------------------
  router.post(
    '/reservations',
    wrapAsync(async (req, res) => {
      const user = requireAuth(req);
      const rawIds = Array.isArray(req.body?.bookIds) ? req.body.bookIds : [req.body?.bookId];
      const bookIds: string[] = [...new Set<string>(rawIds.map((x: unknown) => clean(x, 80, { min: 1, label: 'Livre' })))];
      if (bookIds.length === 0 || bookIds.length > 20) fail(400, 'Sélection de livres invalide.');

      let receipt: Receipt | null = null;
      const skipped: string[] = [];
      let holdIds: string[] = [];
      let total = 0;

      mutate((data) => {
        const me = data.users.find((u) => u.id === user.id)!;
        // Un paiement abandonné ne doit pas bloquer le lecteur : on libère ses anciennes mises de côté en attente
        for (const r of data.reservations) {
          if (r.userId === me.id && r.status === 'en_attente_paiement') r.status = 'annulee';
        }
        // Les anciennes transactions restent « en_attente » : si le lecteur avait déjà payé, la vérification Bachs
        // le détectera et l'argent ne sera jamais « perdu » (livre réactivé s'il est encore libre, sinon remboursement signalé).
        sweepStock(data);
        assertCanBorrow(data, me);

        const now = new Date();
        const reserved: { book: Book; price: number }[] = [];
        for (const id of bookIds) {
          const book = data.books.find((b) => b.id === id && !b.isArchived);
          if (!book || book.stockAvailable <= 0) {
            skipped.push(book?.title ?? id);
            continue;
          }
          if (activeCount(data, me.id) >= me.maxLoans) {
            skipped.push(book.title);
            continue;
          }
          const hasAlready =
            data.loans.some((l) => l.userId === me.id && l.bookId === book.id && l.status !== 'rendu') ||
            data.reservations.some((r) => r.userId === me.id && r.bookId === book.id && holdsBook(r));
          if (hasAlready) {
            skipped.push(book.title);
            continue;
          }
          const price = Math.max(0, Math.round(book.reservationPrice ?? 0));
          reserved.push({ book, price });
          total += price;
          data.reservations.unshift({
            id: newId('res'),
            reference: nextRef(data, 'RES'),
            userId: me.id,
            userName: me.name,
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCover: book.coverUrl,
            isbn: book.isbn,
            reservedAt: now.toISOString(),
            // Réservation payante : livre mis de côté pendant le paiement, puis 4 jours après confirmation
            expiresAt: new Date(now.getTime() + RESERVATION_DAYS * 86400000).toISOString(),
            status: 'active',
            pickupDesk: 'Banque Centrale d\'accueil (Guichet 2)',
          });
          holdIds.push(data.reservations[0].id);
          book.stockAvailable -= 1; // recalculé de toute façon par sweep()
        }
        if (reserved.length === 0) {
          fail(409, 'Aucun livre n\'a pu être réservé (indisponible, déjà réservé ou quota atteint).');
        }

        // Au moins un livre payant : tout le lot est mis de côté pendant le paiement (puis 4 jours après confirmation)
        if (total > 0) {
          for (const r of data.reservations) {
            if (holdIds.includes(r.id)) {
              r.status = 'en_attente_paiement';
              r.expiresAt = new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60000).toISOString();
            }
          }
        } else {
          // Livres gratuits uniquement : réservation immédiate avec ticket
          receipt = buildReceipt(
            data,
            'reservation',
            me,
            reserved.map(({ book: b }) => ({ bookId: b.id, title: b.title, author: b.author, isbn: b.isbn, shelfLocation: b.shelfLocation })),
            { expiresAt: new Date(now.getTime() + RESERVATION_DAYS * 86400000).toISOString() }
          );
          logActivity(data, me, 'Réservation', receipt.receiptNumber, `${reserved.length} livre(s) réservé(s) (gratuit)`, req);
          logVisitor(data, req, 'reservation', me, 'Panier Réservation', `Réservation de ${RESERVATION_DAYS} jours : ${reserved.map(({ book: b }) => `"${b.title}"`).join(', ')}`);
        }
      });

      if (receipt) return respondState(req, res, { receipt, skipped });

      // ---- Réservation payante : paiement Bachs obligatoire ----
      const releaseHolds = () =>
        mutate((data) => {
          for (const r of data.reservations) if (holdIds.includes(r.id)) r.status = 'annulee';
        });
      if (!isBachsConfigured()) {
        releaseHolds();
        fail(503, 'Le paiement Bachs n\'est pas configuré sur le serveur : réservation impossible pour le moment.');
      }
      const transactionRef = `TX-${crypto.randomInt(10000000, 99999999)}`;
      let session;
      try {
        session = await createCheckoutSession({
          email: user.email,
          localRef: transactionRef,
          productId: reservationProduct(),
          amount: toBachsAmount(total),
        });
      } catch (err) {
        releaseHolds();
        return fail(502, (err as Error).message);
      }
      mutate((data) => {
        data.transactions.unshift({
          id: newId('tx'),
          transactionRef,
          userId: user.id,
          userName: user.name,
          kind: 'reservation',
          reservationIds: holdIds,
          amount: total,
          currency: 'FCFA',
          paymentMethod: 'Bachs',
          status: 'en_attente',
          externalId: session.id,
          date: new Date().toISOString(),
        });
        logActivity(data, user, 'Paiement Initié', transactionRef, `Réservation de ${holdIds.length} livre(s) — ${total} FCFA`, req);
      });
      respondState(req, res, { checkoutUrl: session.checkoutUrl, transactionRef, skipped, total });
    })
  );

  router.put(
    '/reservations/:id/cancel',
    wrap((req, res) => {
      const user = requireAuth(req);
      mutate((data) => {
        const r = data.reservations.find((x) => x.id === req.params.id) ?? fail(404, 'Réservation introuvable.');
        if (r.userId !== user.id && !isStaff(user)) fail(403, 'Cette réservation ne vous appartient pas.');
        if (r.status !== 'active') fail(409, 'Cette réservation n\'est plus active.');
        r.status = 'annulee';
        logActivity(data, user, 'Annulation Réservation', r.reference, `Réservation "${r.bookTitle}" annulée`, req);
      });
      respondState(req, res);
    })
  );

  router.put(
    '/reservations/:id/pickup',
    wrap((req, res) => {
      const admin = requireStaff(req);
      let receipt!: Receipt;
      mutate((data) => {
        const r = data.reservations.find((x) => x.id === req.params.id) ?? fail(404, 'Réservation introuvable.');
        if (r.status !== 'active') fail(409, 'Cette réservation n\'est plus active (expirée, annulée ou déjà retirée).');
        const owner = data.users.find((u) => u.id === r.userId) ?? fail(404, 'Compte du lecteur introuvable.');
        const book = data.books.find((b) => b.id === r.bookId) ?? fail(404, 'Livre introuvable.');
        r.status = 'retiree';
        const loan = createLoan(data, owner, book, req);
        receipt = buildReceipt(data, 'emprunt', owner, [
          { bookId: book.id, title: book.title, author: book.author, isbn: book.isbn, dueDate: loan.dueDate, shelfLocation: book.shelfLocation },
        ]);
        logActivity(data, admin, 'Retrait Réservation', r.reference, `Livre retiré par ${owner.name}`, req);
      });
      respondState(req, res, { receipt });
    })
  );

  // ------------------------------------------------------
  // Ré-édition d'une quittance pour un prêt / une réservation existant(e)
  // ------------------------------------------------------
  const reissueReceipt = (kind: 'loan' | 'reservation') =>
    wrap((req, res) => {
      const user = requireAuth(req);
      let receipt!: Receipt;
      mutate((data) => {
        const record: Loan | Reservation =
          (kind === 'loan'
            ? data.loans.find((l) => l.id === req.params.id)
            : data.reservations.find((r) => r.id === req.params.id)) ?? fail(404, 'Dossier introuvable.');
        if (record.userId !== user.id && !isStaff(user)) fail(403, 'Ce dossier ne vous appartient pas.');
        const owner = data.users.find((u) => u.id === record.userId) ?? fail(404, 'Compte introuvable.');
        const type = kind === 'loan' ? 'emprunt' : 'reservation';
        const existing = data.receipts.find(
          (r) => r.userId === record.userId && r.type === type && r.items.some((i) => i.bookId === record.bookId)
        );
        if (existing) {
          receipt = existing;
          return;
        }
        const book = data.books.find((b) => b.id === record.bookId);
        receipt = buildReceipt(
          data,
          type,
          owner,
          [
            {
              bookId: record.bookId,
              title: record.bookTitle,
              author: record.bookAuthor,
              isbn: record.isbn,
              dueDate: kind === 'loan' ? (record as Loan).dueDate : undefined,
              shelfLocation: book?.shelfLocation,
            },
          ],
          kind === 'reservation' ? { expiresAt: (record as Reservation).expiresAt } : {}
        );
      });
      respondState(req, res, { receipt });
    });

  router.post('/loans/:id/receipt', reissueReceipt('loan'));
  router.post('/reservations/:id/receipt', reissueReceipt('reservation'));

  // ------------------------------------------------------
  // Abonnement (paiement SIMULÉ — aucune passerelle réelle branchée)
  // ------------------------------------------------------
  /** Applique un paiement confirmé (abonnement ou réservation) — une seule fois par transaction. */
  const settleTransaction = (data: Database, tx: PaymentTransaction, req: Request): Receipt | null => {
    if (tx.status !== 'en_attente') return null;
    const me = data.users.find((u) => u.id === tx.userId);
    if (!me) return null;

    if (tx.kind === 'reservation') {
      const now = new Date();
      const items: Receipt['items'] = [];
      for (const id of tx.reservationIds ?? []) {
        const r = data.reservations.find((x) => x.id === id);
        const book = r && data.books.find((b) => b.id === r.bookId);
        if (!r || !book) continue;
        // Paiement arrivé après expiration de la mise de côté : on réactive si un exemplaire est encore libre
        if (r.status === 'expiree' || r.status === 'annulee') {
          sweepStock(data);
          if (book.stockAvailable <= 0) {
            logActivity(data, me, 'Paiement à rembourser', tx.transactionRef, `Livre "${r.bookTitle}" indisponible après paiement`, req);
            continue;
          }
        }
        r.status = 'active';
        r.reservedAt = now.toISOString();
        r.expiresAt = new Date(now.getTime() + RESERVATION_DAYS * 86400000).toISOString();
        items.push({ bookId: book.id, title: book.title, author: book.author, isbn: book.isbn, shelfLocation: book.shelfLocation });
      }
      tx.status = 'succes';
      if (items.length === 0) return null;
      const receipt = buildReceipt(data, 'reservation', me, items, {
        expiresAt: new Date(now.getTime() + RESERVATION_DAYS * 86400000).toISOString(),
        amountPaid: tx.amount,
        paymentMethod: tx.paymentMethod,
      });
      logActivity(data, me, 'Paiement Validé', tx.transactionRef, `Réservation de ${items.length} livre(s) — ${tx.amount} FCFA via ${tx.paymentMethod}`, req);
      logVisitor(data, req, 'reservation', me, 'Paiement Bachs', `Réservation payée : ${items.map((i) => `"${i.title}"`).join(', ')}`);
      return receipt;
    }

    const plan = tx.plan as SubscriptionPlan;
    const price = PLAN_PRICES[plan];
    tx.status = 'succes';
    me.subscriptionPlan = plan;
    me.maxLoans = price.maxLoans;
    const receipt = buildReceipt(
      data,
      'paiement',
      me,
      [{ bookId: 'sub-plan', title: `Souscription Formule ${plan} (${tx.amount} FCFA)`, author: `Règlement via ${tx.paymentMethod}`, isbn: `REF:${tx.transactionRef}` }],
      { amountPaid: tx.amount, paymentMethod: tx.paymentMethod, operatorName: 'Banque d\'Accueil & Comptabilité Universitaire' }
    );
    logActivity(data, me, 'Paiement Validé', tx.transactionRef, `Souscription ${plan} (${tx.amount} FCFA) via ${tx.paymentMethod}`, req);
    return receipt;
  };

  router.post(
    '/subscription',
    wrapAsync(async (req, res) => {
      const user = requireAuth(req);
      const plan = req.body?.plan as SubscriptionPlan;
      const method = req.body?.method as PaymentTransaction['paymentMethod'];
      if (!plan || !(plan in PLAN_PRICES) || plan === 'Gratuit') fail(400, 'Formule invalide.');
      if (!PAYMENT_METHODS.includes(method)) fail(400, 'Moyen de paiement invalide.');
      const price = PLAN_PRICES[plan];
      if (req.body?.amount !== price.amount) fail(400, 'Montant incorrect pour cette formule.');

      // ---- Paiement réel via Bachs : page de paiement hébergée, activation après confirmation ----
      if (method === 'Bachs') {
        if (!isBachsConfigured()) fail(503, 'Le paiement Bachs n\'est pas configuré sur le serveur (BACHS_API_KEY, PRODUIT_ID).');
        const transactionRef = `TX-${crypto.randomInt(10000000, 99999999)}`;
        let session;
        try {
          session = await createCheckoutSession({ plan, email: user.email, localRef: transactionRef });
        } catch (err) {
          return fail(502, (err as Error).message);
        }
        mutate((data) => {
          data.transactions.unshift({
            id: newId('tx'),
            transactionRef,
            userId: user.id,
            userName: user.name,
            plan,
            amount: price.amount,
            currency: 'FCFA',
            paymentMethod: 'Bachs',
            status: 'en_attente',
            externalId: session.id,
            date: new Date().toISOString(),
          });
          logActivity(data, user, 'Paiement Initié', transactionRef, `Bachs — ${plan} (${price.amount} FCFA)`, req);
        });
        return respondState(req, res, { checkoutUrl: session.checkoutUrl, transactionRef });
      }

      // ---- Autres moyens : paiement SIMULÉ (aucune passerelle réelle branchée) ----
      if (isProd && process.env.PAYMENT_SIMULATION !== 'true') {
        fail(503, 'Ce moyen de paiement n\'est pas disponible. Utilisez Bachs ou rendez-vous au guichet.');
      }
      let receipt!: Receipt;
      let transactionRef = '';
      mutate((data) => {
        transactionRef = `TX-${crypto.randomInt(10000000, 99999999)}`;
        const tx: PaymentTransaction = {
          id: newId('tx'),
          transactionRef,
          userId: user.id,
          userName: user.name,
          plan,
          amount: price.amount,
          currency: 'FCFA',
          paymentMethod: method,
          phoneNumber: optionalClean(req.body?.phoneNumber, 30, 'Numéro'),
          status: 'en_attente',
          date: new Date().toISOString(),
        };
        data.transactions.unshift(tx);
        receipt = settleTransaction(data, tx, req)!;
      });
      respondState(req, res, { receipt, transactionRef });
    })
  );

  /** Vérifie auprès de Bachs les paiements en attente de l'utilisateur et active la formule si payé. */
  router.post(
    '/payments/verify',
    wrapAsync(async (req, res) => {
      const user = requireAuth(req);
      const pending = read().transactions.filter(
        (t) => t.userId === user.id && t.status === 'en_attente' && t.paymentMethod === 'Bachs' && t.externalId
      );
      let receipt: Receipt | null = null;
      let paidRef = '';
      for (const tx of pending) {
        const outcome = await checkSession(tx.externalId!);
        if (outcome === 'pending') continue;
        mutate((data) => {
          const live = data.transactions.find((t) => t.id === tx.id);
          if (!live || live.status !== 'en_attente') return; // déjà traité (évite le double crédit)
          if (outcome === 'paid') {
            receipt = settleTransaction(data, live, req);
            paidRef = live.transactionRef;
          } else {
            live.status = 'echec';
            for (const r of data.reservations) {
              if ((live.reservationIds ?? []).includes(r.id) && r.status === 'en_attente_paiement') r.status = 'annulee';
            }
            logActivity(data, user, 'Paiement Échoué', live.transactionRef, 'Session Bachs expirée ou annulée', req);
          }
        });
      }
      respondState(req, res, { receipt, paidRef, pendingCount: read().transactions.filter((t) => t.userId === user.id && t.status === 'en_attente').length });
    })
  );

  // ------------------------------------------------------
  // Envoi de quittance par email : non configuré (aucun faux succès)
  // ------------------------------------------------------
  router.post(
    '/receipts/:id/email',
    wrap((req, res) => {
      requireAuth(req);
      res.status(501).json({ error: 'L\'envoi par email n\'est pas configuré sur ce serveur. Téléchargez la quittance en PDF.' });
    })
  );

  // ------------------------------------------------------
  // Gestion des comptes
  // ------------------------------------------------------
  router.put(
    '/users/:id/status',
    wrap((req, res) => {
      const admin = requireStaff(req);
      const status = req.body?.status;
      if (status !== 'actif' && status !== 'suspendu') fail(400, 'Statut invalide.');
      mutate((data) => {
        const target = data.users.find((u) => u.id === req.params.id) ?? fail(404, 'Compte introuvable.');
        if (target.id === admin.id) fail(409, 'Vous ne pouvez pas modifier votre propre statut.');
        if (isStaff(target) && admin.role !== 'super_admin') fail(403, 'Seul un super-administrateur peut modifier un compte administrateur.');
        target.status = status;
        logActivity(data, admin, 'Mise à jour Compte', target.email, `Statut passé à ${status}`, req);
      });
      respondState(req, res);
    })
  );

  router.put(
    '/users/:id/role',
    wrap((req, res) => {
      const admin = requireStaff(req);
      if (admin.role !== 'super_admin') fail(403, 'Seul un super-administrateur peut modifier les rôles.');
      const role = req.body?.role as UserRole;
      if (!['etudiant', 'admin', 'super_admin'].includes(role)) fail(400, 'Rôle invalide.');
      mutate((data) => {
        const target = data.users.find((u) => u.id === req.params.id) ?? fail(404, 'Compte introuvable.');
        if (target.id === admin.id) fail(409, 'Vous ne pouvez pas modifier votre propre rôle.');
        const maxLoans = role === 'etudiant' ? PLAN_PRICES[target.subscriptionPlan]?.maxLoans ?? 2 : Math.max(target.maxLoans, 10);
        target.role = role;
        target.maxLoans = maxLoans;
        logActivity(data, admin, 'Changement de Rôle', target.email, `Attribution du rôle ${role}`, req);
      });
      respondState(req, res);
    })
  );

  // ------------------------------------------------------
  // Administration technique
  // ------------------------------------------------------
  router.get(
    '/database/download',
    wrap((req, res) => {
      requireStaff(req);
      const data = read();
      const { pendingRegistrations: _pending, ...exportable } = data; // jamais d'inscriptions en attente (hash de mot de passe)
      const safe = { ...exportable, users: data.users.map(publicUser) };
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="BiblioTech_Database_2GroupESGIS.json"');
      res.send(JSON.stringify(safe, null, 2));
    })
  );

  // PDF du projet : public (comme avant) ; archive du code source : administrateurs uniquement
  const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
  router.get(
    '/pdf/download',
    wrap((_req, res) => {
      const file = path.join(PUBLIC_DIR, 'Livre_Master_Projet_Bibliotheque_50Pages_2GroupESGIS.pdf');
      if (!fs.existsSync(file)) fail(404, 'Fichier PDF officiel introuvable.');
      res.download(file, 'Livre_Master_Projet_Bibliotheque_50Pages_2GroupESGIS.pdf');
    })
  );

  router.get(
    '/source-code/download',
    wrap((req, res) => {
      requireStaff(req);
      const file = path.join(PUBLIC_DIR, 'BiblioTech_Code_Source_Complet_2GroupESGIS.zip');
      if (!fs.existsSync(file)) fail(404, 'Archive du code source introuvable.');
      res.download(file, 'BiblioTech_Code_Source_Complet_2GroupESGIS.zip');
    })
  );

  router.post(
    '/admin/reset-demo',
    wrap((req, res) => {
      const admin = requireStaff(req);
      if (admin.role !== 'super_admin') fail(403, 'Réservé au super-administrateur.');
      if (isProd) fail(403, 'La réinitialisation est désactivée en production.');
      resetToDemo();
      clearSessionCookie(res);
      res.json({ success: true, state: buildState(read(), null) });
    })
  );

  // Jamais d'exposition de l'ancien endpoint qui renvoyait toute la base (mots de passe compris)
  router.all('/database', (_req, res) => {
    res.status(404).json({ error: 'Introuvable.' });
  });

  router.use((_req, res) => {
    res.status(404).json({ error: 'Route API introuvable.' });
  });

  // ---- Gestion centralisée des erreurs ----
  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    if (err && typeof err === 'object' && (err as any).type === 'entity.too.large') {
      return res.status(413).json({ success: false, error: 'Requête trop volumineuse.' });
    }
    if (err && typeof err === 'object' && (err as any).type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, error: 'JSON invalide.' });
    }
    console.error('[BiblioTech] Erreur interne :', err);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur.' });
  });

  // Vérification d'intégrité du fichier de base au démarrage
  if (!fs.existsSync(DB_FILE)) read();

  return router;
};