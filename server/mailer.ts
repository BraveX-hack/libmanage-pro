/**
 * Envoi d'e-mails (vérification d'adresse). Équivalent Node de PHPMailer + SMTP.
 *
 * Configuration (.env) : SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true" pour le port 465), SMTP_USER, SMTP_PASSWORD,
 * MAIL_FROM_EMAIL, MAIL_FROM_NAME. Avec Gmail : mot de passe d'application (validation en 2 étapes requise).
 *
 * Sans SMTP en développement, le message est écrit dans le terminal et dans data/outbox/ (le lien est cliquable).
 */
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { DATA_DIR } from './store';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const isSmtpConfigured = (): boolean => !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;

/**
 * Fournisseur d'envoi, par ordre de priorité :
 *  - brevo / resend : API web en HTTPS (port 443) — fonctionne sur Render gratuit, où les ports SMTP sont bloqués ;
 *  - smtp : serveur SMTP classique (Gmail…) ;
 *  - dev : développement sans configuration (lien écrit dans le terminal) ; none : production non configurée.
 */
export type MailProvider = 'brevo' | 'resend' | 'smtp' | 'dev' | 'none';

export const mailMode = (): MailProvider =>
  process.env.BREVO_API_KEY
    ? 'brevo'
    : process.env.RESEND_API_KEY
    ? 'resend'
    : isSmtpConfigured()
    ? 'smtp'
    : process.env.NODE_ENV === 'production'
    ? 'none'
    : 'dev';

export class MailApiError extends Error {
  constructor(public provider: string, public status: number, public detail: string) {
    super(`${provider} a répondu ${status} : ${detail}`);
  }
}

/** Explication lisible d'un échec d'envoi (affichée seulement hors production). */
export const describeMailError = (err: unknown): string => {
  if (err instanceof MailApiError) {
    if (err.status === 401 || err.status === 403)
      return `${err.provider} : clé API refusée (${err.status}). Vérifiez la clé dans les variables d'environnement, sans espace ni guillemets.`;
    if (err.status === 400 || err.status === 422)
      return `${err.provider} : message refusé — l'adresse d'expéditeur (MAIL_FROM_EMAIL) doit être validée chez ${err.provider}. Détail : ${err.detail.slice(0, 200)}`;
    if (err.status === 429) return `${err.provider} : limite d'envois atteinte, réessayez plus tard.`;
    return `${err.provider} : ${err.detail.slice(0, 200)}`;
  }
  const e = err as { code?: string; responseCode?: number; message?: string };
  const code = e?.code || '';
  if (code === 'EAUTH' || e?.responseCode === 535)
    return "SMTP : identifiants refusés. Avec Gmail, utilisez un « mot de passe d'application » (validation en 2 étapes requise), pas le mot de passe du compte, et SMTP_USER doit être l'adresse Gmail complète.";
  if (code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT')
    return "SMTP : serveur injoignable. Vérifiez SMTP_HOST et SMTP_PORT, votre connexion et le pare-feu. Sur Render gratuit, les ports SMTP (25, 465, 587) sont bloqués : utilisez BREVO_API_KEY ou RESEND_API_KEY.";
  if (code === 'EENVELOPE') return "SMTP : adresse destinataire ou expéditeur refusée (vérifiez MAIL_FROM_EMAIL).";
  return `Envoi : ${e?.message || 'erreur inconnue'}`;
};

const fromAddress = (): { email: string; name: string } => {
  const email = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || '';
  if (!email) throw new Error('MAIL_FROM_EMAIL est obligatoire (adresse d\'expéditeur validée chez votre fournisseur).');
  return { email, name: process.env.MAIL_FROM_NAME || 'BiblioTech' };
};

const postJson = async (provider: string, url: string, headers: Record<string, string>, body: unknown): Promise<void> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = text;
    try {
      const j = JSON.parse(text);
      detail = j.message || j.error?.message || j.error || text;
    } catch {
      /* texte brut */
    }
    throw new MailApiError(provider, res.status, String(detail));
  }
};

export const sendMail = async (msg: MailMessage): Promise<void> => {
  const mode = mailMode();

  if (mode === 'brevo') {
    const from = fromAddress();
    await postJson(
      'Brevo',
      process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email',
      { 'api-key': process.env.BREVO_API_KEY!.trim() },
      { sender: { name: from.name, email: from.email }, to: [{ email: msg.to }], subject: msg.subject, htmlContent: msg.html, textContent: msg.text }
    );
    return;
  }

  if (mode === 'resend') {
    const from = fromAddress();
    await postJson(
      'Resend',
      process.env.RESEND_API_URL || 'https://api.resend.com/emails',
      { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}` },
      { from: `${from.name} <${from.email}>`, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }
    );
    return;
  }

  if (mode === 'smtp') {
    const port = Number(process.env.SMTP_PORT) || 587;
    // Les mots de passe d'application Gmail s'affichent « abcd efgh ijkl mnop » : les espaces ne font pas partie du mot de passe
    const smtpPass = /gmail|googlemail/i.test(process.env.SMTP_HOST || '')
      ? process.env.SMTP_PASSWORD!.replace(/\s+/g, '')
      : process.env.SMTP_PASSWORD;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user: process.env.SMTP_USER, pass: smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    const from = fromAddress();
    await transport.sendMail({ from: { name: from.name, address: from.email }, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
    return;
  }

  if (mode === 'none') {
    throw new Error("L'envoi d'e-mails n'est pas configuré (BREVO_API_KEY, RESEND_API_KEY ou SMTP_*).");
  }

  // Développement sans configuration : on garde une trace lisible au lieu d'envoyer
  const dir = path.join(DATA_DIR, 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${Date.now()}-${msg.to.replace(/[^a-z0-9@._-]/gi, '_')}.json`), JSON.stringify(msg, null, 2));
  console.log(`\n[BiblioTech] (mode développement, aucun fournisseur d'e-mail configuré) E-mail pour ${msg.to} :\n${msg.text}\n`);
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const verificationEmail = (opts: { to: string; firstName: string; link: string; hours: number }): MailMessage => ({
  to: opts.to,
  subject: 'Confirmez votre adresse e-mail — BiblioTech',
  text: `Bonjour ${opts.firstName},\n\nConfirmez votre adresse e-mail pour activer votre compte BiblioTech (lien valable ${opts.hours} h) :\n${opts.link}\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez ce message.`,
  html:
    `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:auto">` +
    `<h2>Bienvenue${opts.firstName ? ', ' + escapeHtml(opts.firstName) : ''} !</h2>` +
    `<p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail et activer votre compte.</p>` +
    `<p style="text-align:center;margin:28px 0"><a href="${escapeHtml(opts.link)}" ` +
    `style="background:#0f172a;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Vérifier mon e-mail</a></p>` +
    `<p>Ce lien expire dans ${opts.hours} heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p></div>`,
});
