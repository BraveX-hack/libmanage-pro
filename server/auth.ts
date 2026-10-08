import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';

const SESSION_COOKIE = 'bt_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------- Mots de passe (scrypt, sel aléatoire, comparaison à temps constant) ----------

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
};

export const isScryptHash = (value?: string): boolean => !!value && value.startsWith('scrypt$');

export const verifyPassword = (password: string, stored?: string): boolean => {
  if (!isScryptHash(stored)) return false;
  const [, saltB64, hashB64] = stored!.split('$');
  if (!saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
};

// Hash factice pour égaliser le temps de réponse quand l'email n'existe pas
const DUMMY_HASH = hashPassword('dummy-password-for-timing');
export const burnVerifyTime = () => {
  verifyPassword('x', DUMMY_HASH);
};

// ---------- Secret de session ----------

let cachedSecret: string | null = null;

export const getSessionSecret = (dataDir: string): string => {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (16+ caractères) est obligatoire en production.');
  }
  // Développement : secret généré une fois et conservé localement (jamais commité)
  const file = path.join(dataDir, '.session-secret');
  try {
    if (fs.existsSync(file)) {
      cachedSecret = fs.readFileSync(file, 'utf-8').trim();
    }
  } catch {
    /* ignore */
  }
  if (!cachedSecret) {
    cachedSecret = crypto.randomBytes(48).toString('hex');
    try {
      fs.writeFileSync(file, cachedSecret, { mode: 0o600 });
    } catch {
      /* secret volatile si l'écriture échoue */
    }
  }
  return cachedSecret;
};

// ---------- Session (cookie signé HMAC, HttpOnly) ----------

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

export const signSession = (userId: string, secret: string): string => {
  const payload = b64url(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS }));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

export const readSession = (token: string | undefined, secret: string): string | null => {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
};

export const parseCookies = (header?: string): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
};

export const getSessionToken = (req: Request): string | undefined => parseCookies(req.headers.cookie)[SESSION_COOKIE];

export const setSessionCookie = (req: Request, res: Response, token: string) => {
  const secure = process.env.NODE_ENV === 'production' && (req.secure || process.env.TRUST_PROXY === '1');
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000
    )}${secure ? '; Secure' : ''}`
  );
};

export const clearSessionCookie = (res: Response) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
};

// ---------- Limiteur de débit en mémoire ----------

interface Bucket {
  count: number;
  resetAt: number;
}

export const createRateLimiter = (max: number, windowMs: number) => {
  const buckets = new Map<string, Bucket>();
  const purge = () => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  };
  setInterval(purge, windowMs).unref();

  return {
    /** Enregistre un événement ; retourne false si la limite est dépassée. */
    hit(key: string): boolean {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      b.count += 1;
      return b.count <= max;
    },
    isBlocked(key: string): boolean {
      const b = buckets.get(key);
      return !!b && b.resetAt > Date.now() && b.count >= max;
    },
    reset(key: string) {
      buckets.delete(key);
    },
  };
};
