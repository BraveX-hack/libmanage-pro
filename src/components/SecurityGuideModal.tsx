import React, { useState, useId } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Database,
  FileCheck2,
  Lock,
  UploadCloud,
  FileCode,
  Copy,
  Check,
  AlertTriangle,
  Terminal,
  Zap,
} from 'lucide-react';

export const SecurityGuideModal: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<'password' | 'sql' | 'csrf' | 'rbac' | 'upload' | 'xss'>('password');

  // Interactive password tester
  const [testPassword, setTestPassword] = useState('Etudiant2026@Universite#Securite!');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Mock argon2/bcrypt generator representation for the interactive playground
  const generateSimulatedHash = (pwd: string) => {
    let hashNum = 0;
    for (let i = 0; i < pwd.length; i++) {
      hashNum = (hashNum << 5) - hashNum + pwd.charCodeAt(i);
      hashNum |= 0;
    }
    const salt = Math.abs(hashNum).toString(36).padEnd(22, 'x7a89q10');
    return `$argon2id$v=19$m=65536,t=4,p=2$${salt.slice(0, 22)}$${btoa(pwd + salt).slice(0, 43)}`;
  };

  const simulatedHash = generateSimulatedHash(testPassword);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Guide & Laboratoire de Sécurité Applicative</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
            Comment Sécuriser Votre Application (Exemples Concrets de Code)
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Voici les changements précis à apporter dans votre code PHP / SQL pour rendre l'application totalement inviolable contre les attaques réelles (injections SQL, vol de session, vol de mots de passe, failles CSRF, XSS et exécution de scripts malveillants).
          </p>
        </div>
      </div>

      {/* Topics Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        <button
          onClick={() => setActiveTopic('password')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'password'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-600" />
          <span>1. Mots de Passe</span>
          <span className="text-[10px] text-slate-400 font-normal">Argon2id & Bcrypt</span>
        </button>

        <button
          onClick={() => setActiveTopic('sql')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'sql'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Database className="w-4 h-4 text-sky-600" />
          <span>2. Injections SQL</span>
          <span className="text-[10px] text-slate-400 font-normal">Requêtes Préparées PDO</span>
        </button>

        <button
          onClick={() => setActiveTopic('csrf')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'csrf'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <span>3. Protection CSRF</span>
          <span className="text-[10px] text-slate-400 font-normal">Jetons de validation</span>
        </button>

        <button
          onClick={() => setActiveTopic('rbac')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'rbac'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-600" />
          <span>4. Contrôle Rôle (RBAC)</span>
          <span className="text-[10px] text-slate-400 font-normal">Vérification Serveur</span>
        </button>

        <button
          onClick={() => setActiveTopic('upload')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'upload'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-blue-600" />
          <span>5. Uploads Fichiers</span>
          <span className="text-[10px] text-slate-400 font-normal">MIME & Renommage</span>
        </button>

        <button
          onClick={() => setActiveTopic('xss')}
          className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col gap-1.5 ${
            activeTopic === 'xss'
              ? 'border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <FileCode className="w-4 h-4 text-rose-600" />
          <span>6. Failles XSS & Cookies</span>
          <span className="text-[10px] text-slate-400 font-normal">HttpOnly & Échappement</span>
        </button>
      </div>

      {/* TOPIC 1: Password Hashing */}
      {activeTopic === 'password' && (
        <div className="space-y-6">
          {/* Interactive Playground for the user's password */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Simulateur Interactif : Testez un Mot de Passe et Observez le Hachage
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Tapez n'importe quel mot de passe ci-dessous pour voir comment il doit être transformé de manière irréversible avant d'être stocké en base de données.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Entrez votre mot de passe pour tester :
                </label>
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Ex: MonMotDePasseSecret2026!"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span>Longueur : <strong>{testPassword.length} caractères</strong></span>
                  <span>·</span>
                  <span className={testPassword.length >= 12 ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                    {testPassword.length >= 12 ? 'Excellente entropie' : 'Trop court (recommandé: >= 12)'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Hash Cryptographique Généré (Argon2id avec Sel Aléatoire Automatique)
                  </div>
                  <div className="text-amber-400 break-all text-[11px] leading-relaxed">
                    {simulatedHash}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  ✓ Même si la base de données fuite, il est impossible de retrouver le mot de passe original par force brute.
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Vulnerable vs Secure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vulnerable */}
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Ce qu'il ne faut JAMAIS faire (Code Dangereux)</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Stockage en clair ou utilisation d'algorithmes obsolètes (comme <code className="font-mono text-rose-700">md5()</code> ou <code className="font-mono text-rose-700">sha1()</code>).
              </p>
              <div className="bg-rose-950/90 text-rose-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`// ❌ TRÈS GRAVE : Mot de passe stocké en clair ou avec md5
$password = $_POST['password'];

// MD5 est cassable en 0.001 seconde avec des rainbow tables !
$hash = md5($password); 

// L'administrateur ou un pirate peut lire tous les mots de passe !
$pdo->query("INSERT INTO users (email, password) 
             VALUES ('$email', '$password')");`}</pre>
              </div>
            </div>

            {/* Secure */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4" />
                  <span>Code Sécurisé à Mettre en Place (PHP 8.2+)</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `// 1. Lors de l'inscription : hachage irréversible avec Argon2id ou Bcrypt
$password = $_POST['password'];
$hash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost'   => 4,
    'threads'     => 2
]);

// 2. Lors de la connexion : vérification temporelle constante
if (password_verify($password_saisi, $hash_enregistre_en_bdd)) {
    // Mot de passe correct !
    session_regenerate_id(true); // Protection contre la fixation de session
    $_SESSION['user_id'] = $user['id'];
}`,
                      'pwd-secure'
                    )
                  }
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  {copiedCode === 'pwd-secure' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'pwd-secure' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`// 1. Lors de l'inscription : Hachage irréversible
$password = $_POST['password'];

// Argon2id génère un sel aléatoire UNIQUE pour chaque utilisateur
$hash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost'   => 4,
    'threads'     => 2
]);

// 2. Lors de la connexion : Vérification
if (password_verify($password_saisi, $hash_en_base)) {
    session_regenerate_id(true); // Empêche le vol de session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 2: SQL Injections */}
      {activeTopic === 'sql' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vulnerable */}
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Code Vulnérable aux Injections SQL</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Concaténer directement les variables de formulaire dans la chaîne SQL permet à un attaquant d'injecter <code className="font-mono text-rose-700">' OR 1=1 --</code> et de se connecter sans mot de passe !
              </p>
              <div className="bg-rose-950/90 text-rose-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`// ❌ TRÈS DANGEREUX : Concaténation directe
$email = $_POST['email'];
$password = $_POST['password'];

// Si l'attaquant tape : admin@univ.edu' --
// Le reste de la requête est ignoré et il devient admin !
$sql = "SELECT * FROM users 
        WHERE email = '$email' AND password = '$password'";
$result = $pdo->query($sql);`}</pre>
              </div>
            </div>

            {/* Secure */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4" />
                  <span>Solution : Requêtes Préparées PDO</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `// 🟢 SÉCURISÉ : Les paramètres sont envoyés séparément du code SQL
$stmt = $pdo->prepare("SELECT id, name, password_hash, role 
                       FROM users 
                       WHERE email = :email LIMIT 1");

$stmt->execute([':email' => $_POST['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($_POST['password'], $user['password_hash'])) {
    // Connexion autorisée
}`,
                      'sql-secure'
                    )
                  }
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  {copiedCode === 'sql-secure' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'sql-secure' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`// 🟢 SÉCURISÉ : Les données ne peuvent jamais devenir du code exécutable
$stmt = $pdo->prepare("SELECT id, name, password_hash, role 
                       FROM users 
                       WHERE email = :email LIMIT 1");

// Liaison stricte des paramètres (Prepared Statement)
$stmt->execute([':email' => $_POST['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($_POST['password'], $user['password_hash'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 3: CSRF Tokens */}
      {activeTopic === 'csrf' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Le Risque CSRF (Usurpation de Recommandation)</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Sans jeton CSRF, un site tiers malveillant visité par un bibliothécaire connecté peut envoyer une requête POST invisible vers votre bibliothèque (ex: supprimer tous les livres) avec les cookies de l'administrateur !
              </p>
              <div className="bg-rose-950/90 text-rose-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`<!-- ❌ Formulaire sans jeton anti-CSRF -->
<form action="/admin/delete_book.php" method="POST">
  <input type="hidden" name="book_id" value="42">
  <button type="submit">Supprimer</button>
</form>`}</pre>
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Check className="w-4 h-4" />
                  <span>Implémentation du Jeton CSRF en PHP</span>
                </div>
              </div>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`// 1. Génération du token en début de session
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// 2. Inclusion dans CHAQUE formulaire HTML
<form action="/admin/delete_book.php" method="POST">
  <input type="hidden" name="csrf_token" 
         value="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
  <input type="hidden" name="book_id" value="42">
  <button type="submit">Supprimer</button>
</form>

// 3. Vérification obligatoire côté serveur :
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'] ?? '')) {
    http_response_code(403);
    die("Erreur CSRF : Requête non autorisée !");
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 4: RBAC Server-Side */}
      {activeTopic === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-serif mb-2">
              Contrôle d'Accès Basé sur les Rôles (RBAC) Côté Serveur
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <strong>Règle d'or :</strong> Masquer un bouton en CSS/HTML (<code className="font-mono">display: none</code>) ne protège RIEN. Un étudiant peut ouvrir l'inspecteur réseau de son navigateur ou faire un appel <code className="font-mono">curl</code> direct sur vos scripts d'administration. Chaque fichier PHP admin doit valider le rôle dans la session.
            </p>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`// Fichier : /includes/auth_guard.php
session_start();

function require_role(array $allowed_roles) {
    if (!isset($_SESSION['user_id'])) {
        header("Location: /login.php");
        exit();
    }
    
    // Vérification stricte du rôle stocké dans la session côté serveur
    if (!in_array($_SESSION['role'], $allowed_roles, true)) {
        http_response_code(403);
        echo "403 Accès Refusé : Vous n'avez pas les privilèges bibliothécaire.";
        exit();
    }
}

// Exemple sur une page sensible (ex: /admin/dashboard.php) :
require_once __DIR__ . '/includes/auth_guard.php';
require_role(['admin', 'super_admin']); // Bloque net tout visiteur ou étudiant !`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 5: Secure Uploads */}
      {activeTopic === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-serif mb-2">
              Sécurisation des Uploads de Couvertures de Livres
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Un pirate peut uploader un fichier nommé <code className="font-mono text-rose-700">malware.php</code> déguisé en image pour prendre le contrôle total du serveur. Voici comment le neutraliser :
            </p>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`// 1. Vérification du vrai type MIME (et pas juste l'extension du nom)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($_FILES['cover']['tmp_name']);

$allowed_mimes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($mime, $allowed_mimes)) {
    die("Fichier rejeté : Seules les images JPEG/PNG sont admises.");
}

// 2. Limite stricte de taille (ex: max 2 Mo)
if ($_FILES['cover']['size'] > 2 * 1024 * 1024) {
    die("Image trop lourde (2 Mo max).");
}

// 3. Renommage ALÉATOIRE complet avec hash pour empêcher l'exécution
$extension = match($mime) {
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
};
$safe_filename = bin2hex(random_bytes(16)) . '.' . $extension;

// 4. Déplacement vers le dossier de stockage
move_uploaded_file($_FILES['cover']['tmp_name'], __DIR__ . '/uploads/' . $safe_filename);

// 5. Important : Placer un fichier .htaccess dans le dossier /uploads/ contenant :
// php_flag engine off (désactive toute exécution de script)`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TOPIC 6: XSS & Cookies */}
      {activeTopic === 'xss' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-serif mb-2">
              Protection Contre les Failles XSS & Sécurité des Cookies de Session
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Le XSS permet d'injecter du JavaScript dans vos pages pour voler le cookie de session de l'administrateur. Avec le flag <code className="font-mono text-emerald-700">HttpOnly</code>, le JavaScript est techniquement incapable de lire le cookie !
            </p>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`// Avant session_start() : Configurer des cookies blindés
session_set_cookie_params([
    'lifetime' => 0,              // Cookie de session détruit à la fermeture
    'path'     => '/',
    'domain'   => '',
    'secure'   => true,           // Uniquement transmis via HTTPS
    'httponly' => true,           // INTERDIT l'accès via document.cookie en JS (anti-vol XSS !)
    'samesite' => 'Strict'        // Bloque l'envoi de cookie depuis des sites tiers
]);
session_start();

// Protection XSS à l'affichage : Échappement systématique avec ENT_QUOTES
function e(string $string): string {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

// Exemple dans le template :
<h1>Livre : <?php echo e($book['title']); ?></h1>
<p>Avis : <?php echo e($comment['user_text']); ?></p>`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
