import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter } from './server/api';
import { DATA_DIR, DB_FILE, initStore, read } from './server/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  initStore();

  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

  // En-têtes de sécurité
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProd) {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data: blob:",
          "worker-src 'self' blob:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self'",
          "frame-ancestors 'self'",
        ].join('; ')
      );
    }
    next();
  });

  // Le téléversement d'une photo de couverture accepte un corps plus gros (image encodée en base64)
  app.use('/api/uploads', express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '100kb' }));

  // ==========================================
  // API (authentification, autorisations et règles métier côté serveur)
  // ==========================================
  app.use('/api', createApiRouter());

  // ==========================================
  // Fichiers statiques publics (couvertures, images, PDF du projet)
  // Les archives .zip (code source) ne sont jamais servies publiquement.
  // ==========================================
  // Photos de couverture téléversées (seul le sous-dossier uploads/ est public, jamais la base de données)
  app.use(
    '/uploads',
    express.static(path.join(DATA_DIR, 'uploads'), {
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
    })
  );

  const publicDir = path.resolve(__dirname, 'public');
  app.use((req, res, next) => {
    if (/\.zip$/i.test(req.path)) return res.status(404).end();
    next();
  });
  app.use(express.static(publicDir));

  // ==========================================
  // VITE MIDDLEWARE (DEV) OU STATIQUE (PROD)
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      // La base JSON (dossier data/) est réécrite à chaque action : elle ne doit jamais déclencher
      // de rechargement de la page par Vite.
      server: {
        middlewareMode: true,
        allowedHosts: true,
        watch: { ignored: ['**/data/**', '**/data.orig.bak/**'] },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      console.warn('[BiblioTech] Dossier dist/ introuvable : lancez "npm run build" avant "npm run start:prod".');
    }
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Balayage périodique : expire les réservations non retirées même sans activité sur le site
  setInterval(() => {
    try {
      read();
    } catch (err) {
      console.error('[BiblioTech] Balayage des réservations impossible :', err);
    }
  }, 5 * 60 * 1000).unref();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BiblioTech] Serveur démarré sur http://localhost:${PORT} (${isProd ? 'production' : 'développement'})`);
    console.log(`[BiblioTech] Base de données : ${DB_FILE}`);
  });
}

startServer().catch((err) => {
  console.error('[BiblioTech] Échec du démarrage :', err);
  process.exit(1);
});
