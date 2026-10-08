/**
 * Intégration Bachs (paiement hébergé).
 * La clé API reste côté serveur (variables d'environnement) et n'est jamais envoyée au navigateur.
 */
import type { SubscriptionPlan } from '../src/types/library';

const env = () => ({
  url: (process.env.BACHS_URL || 'https://sandbox-api.bachs.io').replace(/\/+$/, ''),
  key: process.env.BACHS_API_KEY || '',
  defaultProduct: process.env.PRODUIT_ID || '',
  publicUrl: (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, ''),
});

export const isBachsConfigured = (): boolean => {
  const e = env();
  return !!e.key && !!e.defaultProduct;
};

/** Produit Bachs associé à chaque formule (le prix est défini dans le produit Bachs). */
export const productForPlan = (plan: SubscriptionPlan): string => {
  const specific: Partial<Record<SubscriptionPlan, string | undefined>> = {
    'Étudiant Plus': process.env.BACHS_PRODUCT_ETUDIANT_PLUS,
    'Recherche & Doctorat': process.env.BACHS_PRODUCT_RECHERCHE_DOCTORAT,
  };
  return specific[plan] || env().defaultProduct;
};

const headers = () => ({
  Authorization: `Bearer ${env().key}`,
  'Content-Type': 'application/json',
});

const asJson = async (res: Response): Promise<any> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const pick = (d: any, ...paths: string[]): any => {
  for (const p of paths) {
    const v = p.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), d);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

/** Même logique de repérage du lien que votre projet de test. */
const findCheckoutUrl = (d: any): string | undefined =>
  pick(d, 'checkout_url', 'data.checkout_url', 'url', 'data.url') ||
  (JSON.stringify(d || {}).match(/https:\/\/[^"]*checkout[^"]*/) || [])[0];

export interface BachsSession {
  id: string;
  checkoutUrl: string;
}

/** Produit Bachs « prix personnalisé » utilisé pour les réservations (montant imposé par le serveur). */
export const reservationProduct = (): string => process.env.BACHS_PRODUCT_RESERVATION || env().defaultProduct;

/**
 * Convertit un montant en FCFA vers la devise du produit Bachs.
 * BACHS_CURRENCY_RATE = nombre de FCFA pour 1 unité de la devise du produit (1 si le produit est en FCFA).
 */
export const toBachsAmount = (fcfa: number): string => {
  const rate = Number(process.env.BACHS_CURRENCY_RATE) > 0 ? Number(process.env.BACHS_CURRENCY_RATE) : 1;
  return (fcfa / rate).toFixed(2);
};

export const createCheckoutSession = async (opts: {
  plan?: SubscriptionPlan;
  /** Montant à facturer (chaîne décimale) : remplace le prix du produit (produit « prix personnalisé »). */
  amount?: string;
  productId?: string;
  email: string;
  localRef: string;
}): Promise<BachsSession> => {
  const e = env();
  // Bachs refuse localhost : en local, des adresses publiques factices sont utilisées (comme dans votre test).
  const base = e.publicUrl && !/localhost|127\.0\.0\.1/.test(e.publicUrl) ? e.publicUrl : 'https://example.com';
  const res = await fetch(`${e.url}/v1/checkout-sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      product_cart: [
        {
          product_id: opts.productId || productForPlan(opts.plan as SubscriptionPlan),
          quantity: 1,
          ...(opts.amount ? { amount: opts.amount } : {}),
        },
      ],
      customer: { email: opts.email },
      return_url: `${base}/?paiement=succes&ref=${encodeURIComponent(opts.localRef)}`,
      cancel_url: `${base}/?paiement=annule&ref=${encodeURIComponent(opts.localRef)}`,
    }),
  });
  const data = await asJson(res);
  const checkoutUrl = findCheckoutUrl(data);
  // Bachs renvoie l'identifiant sous le nom « checkout_id » (ex. chk_...)
  const id = pick(data, 'checkout_id', 'data.checkout_id', 'id', 'data.id', 'checkout_session_id', 'data.checkout_session_id');
  if (!res.ok || !checkoutUrl || !id) {
    console.error('[Bachs] Création de session refusée :', res.status, JSON.stringify(data));
    const detail = pick(data, 'message', 'error.message', 'error', 'detail', 'data.message');
    throw new Error(
      `Bachs a refusé la création du paiement (code ${res.status}${
        typeof detail === 'string' ? ` : ${detail.slice(0, 160)}` : ''
      }). Vérifiez la clé API et le produit.`
    );
  }
  return { id: String(id), checkoutUrl };
};

const PAID = new Set(['paid', 'complete', 'completed', 'succeeded', 'success', 'successful']);
const FAILED = new Set(['expired', 'failed', 'canceled', 'cancelled']);

export type BachsOutcome = 'paid' | 'failed' | 'pending';

/** Interroge Bachs : le paiement n'est considéré comme réussi que si Bachs le confirme lui-même. */
export const checkSession = async (sessionId: string): Promise<BachsOutcome> => {
  const res = await fetch(`${env().url}/v1/checkout-sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: headers(),
  });
  const data = await asJson(res);
  if (!res.ok) {
    console.error('[Bachs] Vérification impossible :', res.status, JSON.stringify(data));
    return 'pending';
  }
  const values = [
    pick(data, 'status'),
    pick(data, 'payment_status'),
    pick(data, 'data.status'),
    pick(data, 'data.payment_status'),
  ]
    .filter((v) => typeof v === 'string')
    .map((v: string) => v.toLowerCase());
  if (values.some((v) => PAID.has(v))) return 'paid';
  if (values.some((v) => FAILED.has(v))) return 'failed';
  return 'pending';
};
