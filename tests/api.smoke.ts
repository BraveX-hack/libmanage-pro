/**
 * Test de fumée de l'API : lance un serveur isolé (base temporaire) et vérifie
 * authentification, autorisations, règles de prêt/réservation et intégrité du stock.
 * Usage : npm run test:api
 */
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';

const PORT = 3999;
const MOCK_PORT = 3997;
// Faux serveur Bachs pour tester l'intégration sans réseau
let mockStatus = 'open';
let mockLastAuth = '';
let mockLastBody: any = null;
const mockBachs = http.createServer((req, res) => {
  mockLastAuth = String(req.headers.authorization || '');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'POST' && req.url === '/v1/checkout-sessions') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { mockLastBody = JSON.parse(raw); } catch { mockLastBody = null; }
      res.end(JSON.stringify({ checkout_id: 'cs_test_1', checkout_url: 'https://checkout.bachs.io/cs_test_1', status: 'open' }));
    });
    return;
  }
  if (req.method === 'POST' && false) {
    res.end(JSON.stringify({ checkout_id: 'cs_test_1', checkout_url: 'https://checkout.bachs.io/cs_test_1', status: 'open' }));
  } else if (req.method === 'GET' && req.url === '/v1/checkout-sessions/cs_test_1') {
    res.end(JSON.stringify({ checkout_id: 'cs_test_1', status: mockStatus }));
  } else {
    res.statusCode = 404;
    res.end('{}');
  }
});
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bibliotech-test-'));

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean, extra?: unknown) => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`, extra ?? '');
  }
};

class Client {
  cookie = '';
  async call(method: string, url: string, body?: unknown) {
    const res = await fetch(BASE + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(this.cookie ? { Cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.includes('Max-Age=0') ? '' : set.split(';')[0];
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* non JSON */
    }
    return { status: res.status, json };
  }
}

// Lance Node directement (sans wrapper npx/tsx) pour que l'arrêt tue réellement le serveur
const startServer = () =>
  spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      NODE_ENV: 'development',
      BACHS_URL: `http://127.0.0.1:${MOCK_PORT}`,
      BACHS_API_KEY: 'sk_test_fake',
      PRODUIT_ID: 'prod_test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const stopServer = (child: ReturnType<typeof spawn>) => {
  child.kill('SIGKILL');
};

const waitForServer = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Serveur de test injoignable');
};

async function main() {
  // Un serveur déjà présent sur le port fausserait le test (base en mémoire différente)
  const already = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false);
  if (already) {
    console.error(`Le port ${PORT} est déjà utilisé par un serveur : arrêtez-le avant de lancer le test.`);
    process.exit(2);
  }
  await new Promise<void>((r) => mockBachs.listen(MOCK_PORT, '127.0.0.1', () => r()));
  const server = startServer();
  let serverLog = '';
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));

  try {
    await waitForServer();

    console.log('\nSécurité & authentification');
    const anon = new Client();
    let r = await anon.call('GET', '/api/database');
    check('/api/database n\'est plus exposé', r.status === 404);
    r = await anon.call('GET', '/api/state');
    check('état public sans utilisateurs/mots de passe', r.status === 200 && r.json.users.length === 0 && !JSON.stringify(r.json).includes('passwordHash'));
    r = await anon.call('GET', '/api/visitors');
    check('journal des visiteurs refusé aux anonymes', r.status === 401);
    r = await anon.call('POST', '/api/auth/login', { email: 'koffi.alexandre@univ-tech.edu', password: 'mauvais-mdp' });
    check('connexion refusée avec un mauvais mot de passe', r.status === 401);
    r = await anon.call('POST', '/api/auth/login', { email: 'wottoprecieux@gmail.com', password: '' });
    check('connexion refusée sans mot de passe', r.status === 400);
    r = await anon.call('POST', '/api/books', { title: 'x' });
    check('création de livre refusée aux anonymes', r.status === 401);

    console.log('\nInscription & session');
    const stu = new Client();
    r = await stu.call('POST', '/api/auth/register', {
      lastName: 'Test', firstName: 'Étudiant', email: 'test.etudiant@example.com', school: 'ESGIS',
      birthDate: '2003-05-14', password: 'court',
    });
    check('mot de passe trop court refusé', r.status === 400);
    r = await stu.call('POST', '/api/auth/register', {
      lastName: 'Test', firstName: 'Étudiant', email: 'test.etudiant@example.com', school: 'ESGIS',
      birthDate: '2003-05-14', password: 'MotDePasse123', role: 'super_admin',
    });
    check('inscription réussie', r.status === 201 && r.json.state.me?.role === 'etudiant', r.json);
    check('rôle imposé par le serveur (pas d\'escalade)', r.json.state.me.role === 'etudiant');
    check('hash du mot de passe jamais renvoyé', !JSON.stringify(r.json).includes('passwordHash'));
    r = await stu.call('POST', '/api/auth/register', {
      lastName: 'Test', firstName: 'Bis', email: 'TEST.etudiant@example.com', school: 'ESGIS',
      birthDate: '2003-05-14', password: 'MotDePasse123',
    });
    check('doublon d\'email refusé (insensible à la casse)', r.status === 409);

    console.log('\nDroits des étudiants');
    r = await stu.call('GET', '/api/visitors');
    check('étudiant : journal admin refusé', r.status === 403);
    r = await stu.call('PUT', `/api/users/${(await stu.call('GET', '/api/state')).json.me.id}/role`, { role: 'super_admin' });
    check('étudiant : auto-promotion refusée', r.status === 403);
    r = await stu.call('GET', '/api/database/download');
    check('étudiant : export de la base refusé', r.status === 403);
    r = await stu.call('GET', '/api/source-code/download');
    check('étudiant : archive du code source refusée', r.status === 403);

    console.log('\nEmprunts, quota et stock');
    const state0 = (await stu.call('GET', '/api/state')).json;
    const book = state0.books.find((b: any) => b.stockAvailable >= 2);
    const stockBefore = book.stockAvailable;
    r = await stu.call('POST', '/api/loans', { bookId: book.id });
    check('emprunt accepté', r.status === 200 && r.json.receipt?.securityHash?.startsWith('SHA256:'), r.json);
    check('empreinte SHA-256 réelle (64 hex)', /^SHA256:[0-9a-f]{64}$/.test(r.json.receipt.securityHash));
    const afterLoan = r.json.state.books.find((b: any) => b.id === book.id);
    check('stock décrémenté de 1', afterLoan.stockAvailable === stockBefore - 1);
    r = await stu.call('POST', '/api/loans', { bookId: book.id });
    check('doublon de prêt refusé', r.status === 409);
    r = await stu.call('POST', '/api/reservations', { bookIds: [book.id] });
    check('réservation du même livre refusée', r.status === 409);
    const other = state0.books.find((b: any) => b.id !== book.id && b.stockAvailable >= 1);
    check('prix de réservation par défaut : 500 FCFA', other.reservationPrice === 500, other.reservationPrice);
    r = await stu.call('POST', '/api/reservations', { bookIds: [other.id] });
    check('réservation payante : lien Bachs renvoyé, pas de ticket avant paiement', r.status === 200 && !!r.json.checkoutUrl && !r.json.receipt, r.json);
    check('montant envoyé à Bachs = prix du livre (500.00)', mockLastBody?.product_cart?.[0]?.amount === '500.00' && mockLastBody.product_cart[0].product_id === 'prod_test', mockLastBody);
    const held = r.json.state.reservations.find((x: any) => x.bookId === other.id);
    check('livre mis de côté pendant le paiement', held?.status === 'en_attente_paiement' && r.json.state.books.find((b: any) => b.id === other.id).stockAvailable === other.stockAvailable - 1);
    r = await stu.call('POST', '/api/payments/verify', {});
    check('paiement non confirmé : toujours en attente', r.json.state.reservations.find((x: any) => x.bookId === other.id).status === 'en_attente_paiement');
    mockStatus = 'complete';
    r = await stu.call('POST', '/api/payments/verify', {});
    check('paiement confirmé : réservation active + ticket avec montant payé', r.json.state.reservations.find((x: any) => x.bookId === other.id).status === 'active' && r.json.receipt?.type === 'reservation' && r.json.receipt.amountPaid === 500, r.json.receipt);
    mockStatus = 'open';
    const third = state0.books.find((b: any) => b.id !== book.id && b.id !== other.id && b.stockAvailable >= 1);
    r = await stu.call('POST', '/api/loans', { bookId: third.id });
    check('quota (2) respecté : 3e emprunt refusé', r.status === 409, r.json);
    const loanId = (await stu.call('GET', '/api/state')).json.loans[0].id;
    r = await stu.call('PUT', `/api/loans/${loanId}/return`);
    check('étudiant : validation de retour refusée', r.status === 403);
    r = await stu.call('PUT', `/api/loans/${loanId}/renew`);
    check('renouvellement accepté', r.status === 200);
    r = await stu.call('PUT', `/api/loans/${loanId}/renew`);
    check('2e renouvellement refusé', r.status === 409);
    const resId = (await stu.call('GET', '/api/state')).json.reservations.find((x: any) => x.status === 'active').id;
    r = await stu.call('PUT', `/api/reservations/${resId}/cancel`);
    check('annulation de réservation', r.status === 200);
    check('stock restitué après annulation', r.json.state.books.find((b: any) => b.id === other.id).stockAvailable === other.stockAvailable);

    console.log('\nPaiement Bachs (abonnement)');
    mockStatus = 'open';
    const meId = (await stu.call('GET', '/api/state')).json.me;
    check('formule de départ : Gratuit', meId.subscriptionPlan === 'Gratuit');
    r = await stu.call('POST', '/api/subscription', { plan: 'Étudiant Plus', method: 'Bachs', amount: 1 });
    check('montant incorrect refusé', r.status === 400);
    r = await anon.call('POST', '/api/subscription', { plan: 'Étudiant Plus', method: 'Bachs', amount: 2500 });
    check('paiement refusé sans connexion', r.status === 401);
    r = await stu.call('POST', '/api/subscription', { plan: 'Étudiant Plus', method: 'Bachs', amount: 2500 });
    check('session Bachs créée, lien de paiement renvoyé', r.status === 200 && r.json.checkoutUrl === 'https://checkout.bachs.io/cs_test_1', r.json);
    check('clé API envoyée à Bachs côté serveur uniquement', mockLastAuth === 'Bearer sk_test_fake' && !JSON.stringify(r.json).includes('sk_test_fake'));
    check('formule NON activée avant confirmation', r.json.state.me.subscriptionPlan === 'Gratuit' && r.json.state.transactions[0].status === 'en_attente');
    r = await stu.call('POST', '/api/payments/verify', {});
    check('paiement non confirmé : reste en attente', r.json.state.me.subscriptionPlan === 'Gratuit' && r.json.pendingCount === 1);
    mockStatus = 'complete';
    r = await stu.call('POST', '/api/payments/verify', {});
    check('paiement confirmé : formule activée + quittance', r.json.state.me.subscriptionPlan === 'Étudiant Plus' && r.json.state.me.maxLoans === 5 && r.json.receipt?.type === 'paiement', r.json);
    r = await stu.call('POST', '/api/payments/verify', {});
    check('vérification répétée : pas de double traitement', r.json.state.receipts.filter((x: any) => x.type === 'paiement').length === 1);

    console.log('\nAdministration');
    const adm = new Client();
    r = await adm.call('POST', '/api/auth/login', { email: 'wottoprecieux@gmail.com', password: 'wottoSecret2026' });
    check('super admin : connexion OK (mot de passe vérifié)', r.status === 200 && r.json.state.me.role === 'super_admin', r.json);
    check('admin : liste des comptes sans hash', r.json.state.users.length > 0 && !JSON.stringify(r.json).includes('passwordHash'));
    r = await adm.call('PUT', `/api/loans/${loanId}/return`);
    check('admin : retour validé', r.status === 200);
    check('stock réintégré après retour', r.json.state.books.find((b: any) => b.id === book.id).stockAvailable === stockBefore);
    r = await adm.call('PUT', `/api/loans/${loanId}/return`);
    check('double retour refusé', r.status === 409);
    r = await adm.call('POST', '/api/books', {
      title: 'Livre de test', author: 'Auteur', isbn: '978-2-00-000000-1', category: 'Sciences', publishedYear: 2024,
      publisher: 'Éd.', pages: 100, summary: 's', backCoverText: 'b', shelfLocation: 'Rayon T-01', stockTotal: 3,
      coverUrl: 'javascript:alert(1)',
    });
    check('URL de couverture dangereuse refusée', r.status === 400);
    r = await adm.call('POST', '/api/books', {
      title: 'Livre de test', author: 'Auteur', isbn: '978-2-00-000000-1', category: 'Sciences', publishedYear: 2024,
      publisher: 'Éd.', pages: 100, summary: 's', backCoverText: 'b', shelfLocation: 'Rayon T-01', stockTotal: 3,
      reservationPrice: 0,
    });
    check('admin : ajout de livre', r.status === 200 && r.json.state.books[0].title === 'Livre de test', r.json);
    const freeBookId = r.json.state.books[0].id;
    check('prix de réservation enregistré avec le livre', r.json.state.books[0].reservationPrice === 0);
    r = await adm.call('POST', '/api/books', {
      title: 'Prix négatif', author: 'Auteur', isbn: '978-2-00-000000-9', category: 'Sciences', publishedYear: 2024,
      publisher: 'Éd.', pages: 100, summary: 's', backCoverText: 'b', shelfLocation: 'Rayon T-01', stockTotal: 3, reservationPrice: -5,
    });
    check('prix de réservation négatif refusé', r.status === 400);
    r = await stu.call('POST', '/api/reservations', { bookIds: [freeBookId] });
    check('livre à 0 FCFA : réservation gratuite immédiate avec ticket', r.status === 200 && !r.json.checkoutUrl && r.json.receipt?.type === 'reservation', r.json);

    console.log('\nPhoto du livre (téléversement)');
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(60, 1)]).toString('base64');
    r = await stu.call('POST', '/api/uploads/cover', { dataUrl: `data:image/png;base64,${png}` });
    check('étudiant : téléversement refusé', r.status === 403);
    r = await adm.call('POST', '/api/uploads/cover', { dataUrl: `data:image/png;base64,${Buffer.from('ceci est du texte, pas une image').toString('base64')}` });
    check('faux fichier image refusé (signature invalide)', r.status === 400);
    r = await adm.call('POST', '/api/uploads/cover', { dataUrl: 'data:text/html;base64,PGgxPng=' });
    check('type non image refusé', r.status === 400);
    r = await adm.call('POST', '/api/uploads/cover', { dataUrl: `data:image/png;base64,${png}` });
    check('image valide enregistrée', r.status === 200 && /^\/uploads\/cover-.+\.png$/.test(r.json.url), r.json);
    const served = await fetch(BASE + r.json.url);
    check('image servie publiquement', served.status === 200 && (served.headers.get('content-type') || '').includes('image/png'));
    const leak = await fetch(BASE + '/uploads/../database.json');
    check('la base de données reste inaccessible', leak.status !== 200 || !(await leak.text()).includes('users'));
    r = await adm.call('POST', '/api/books', {
      title: 'Doublon', author: 'Auteur', isbn: '9782000000001', category: 'Sciences', publishedYear: 2024,
      publisher: 'Éd.', pages: 100, summary: 's', backCoverText: 'b', shelfLocation: 'Rayon T-01', stockTotal: 3,
    });
    check('ISBN en doublon refusé', r.status === 409);
    r = await adm.call('GET', '/api/database/download');
    check('admin : export sans mots de passe', r.status === 200 || r.json === null);

    console.log('\nRetards & expiration');
    const dbFile = path.join(dataDir, 'database.json');
    const db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    check('base : aucun hash factice conservé', db.users.every((u: any) => u.passwordHash.startsWith('scrypt$')));
    // Simule un prêt dépassé de 3 jours et une réservation expirée, puis relit
    const lateDue = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    const koffi = db.users.find((u: any) => u.email === 'koffi.alexandre@univ-tech.edu');
    const target = db.books.find((b: any) => b.id !== book.id && b.stockAvailable > 0);
    db.loans.unshift({ id: 'loan-late-test', reference: 'EMP-TEST-1', userId: koffi.id, userName: koffi.name, userEmail: koffi.email, bookId: target.id, bookTitle: target.title, bookAuthor: target.author, bookCover: target.coverUrl, isbn: target.isbn, borrowDate: lateDue, dueDate: lateDue, status: 'en_cours', renewalCount: 0, dailyLateFee: 200 });
    fs.writeFileSync(dbFile, JSON.stringify(db));
    // Le serveur garde la base en mémoire : on redémarre pour simuler la relecture disque
    stopServer(server);
    await new Promise((r) => setTimeout(r, 1000));
    const server2 = startServer();
    try {
      await waitForServer();
      const adm2 = new Client();
      const lg = await adm2.call('POST', '/api/auth/login', { email: 'wottoprecieux@gmail.com', password: 'wottoSecret2026' });
      let s = (await adm2.call('GET', '/api/state')).json;
      const lateLoan = s.loans.find((l: any) => l.id === 'loan-late-test');
      check('prêt dépassé passé automatiquement en "en_retard"', lateLoan?.status === 'en_retard', lateLoan);
      r = await adm2.call('PUT', '/api/loans/loan-late-test/return');
      check('pénalité calculée (3 jours × 200 = 600 FCFA)', r.json?.lateFee === 600, r.json?.lateFee);

      console.log('\nAnti-force-brute');
      const brute = new Client();
      let blocked = false;
      for (let i = 0; i < 10; i++) {
        const x = await brute.call('POST', '/api/auth/login', { email: 'sarah.mensah@univ-tech.edu', password: 'faux' + i });
        if (x.status === 429) blocked = true;
      }
      check('blocage après plusieurs échecs (429)', blocked);
    } finally {
      stopServer(server2);
    }
  } catch (err) {
    failed++;
    console.error('Erreur du test :', err);
    console.error(serverLog.slice(-1500));
  } finally {
    stopServer(server);
    mockBachs.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(`\nRésultat : ${passed} réussis, ${failed} échoués`);
  process.exit(failed ? 1 : 0);
}

main();
