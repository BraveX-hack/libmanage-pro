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

export const mailMode = (): 'smtp' | 'dev' | 'none' =>
  isSmtpConfigured() ? 'smtp' : process.env.NODE_ENV === 'production' ? 'none' : 'dev';

/** Explication lisible d'un échec d'envoi (affichée seulement hors production). */
export const describeMailError = (err: unknown): string => {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const code = e?.code || '';
  if (code === 'EAUTH' || e?.responseCode === 535)
    return "SMTP : identifiants refusés. Avec Gmail, utilisez un « mot de passe d'application » (validation en 2 étapes requise), pas le mot de passe du compte, et SMTP_USER doit être l'adresse Gmail complète.";
  if (code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT')
    return "SMTP : serveur injoignable. Vérifiez SMTP_HOST et SMTP_PORT (Gmail : smtp.gmail.com, 587), votre connexion, et qu'un antivirus ou pare-feu ne bloque pas le port.";
  if (code === 'EENVELOPE') return "SMTP : adresse destinataire ou expéditeur refusée (vérifiez MAIL_FROM_EMAIL).";
  return `SMTP : ${e?.message || 'erreur inconnue'}`;
};

export const sendMail = async (msg: MailMessage): Promise<void> => {
  if (isSmtpConfigured()) {
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
    const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER!;
    const fromName = process.env.MAIL_FROM_NAME || 'BiblioTech';
    await transport.sendMail({
      from: { name: fromName, address: fromEmail },
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error("L'envoi d'e-mails n'est pas configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).");
  }

  // Développement sans SMTP : on garde une trace lisible au lieu d'envoyer
  const dir = path.join(DATA_DIR, 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${Date.now()}-${msg.to.replace(/[^a-z0-9@._-]/gi, '_')}.json`), JSON.stringify(msg, null, 2));
  console.log(`\n[BiblioTech] (mode développement, SMTP non configuré) E-mail pour ${msg.to} :\n${msg.text}\n`);
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