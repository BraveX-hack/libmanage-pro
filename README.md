# BiblioTech — 2GroupESGIS
## Système Complet de Gestion de Bibliothèque Universitaire

Application web développée par le collectif étudiant **2GroupESGIS** (ESGIS - École Supérieure de Gestion, d'Informatique et des Sciences).

---

### 📚 Les 4 Piliers Fonctionnels
1. **Gestion des Livres :** Inventaire, catégorisation, localisation physique par rayon (ex. *Rayon INF-A04*), suivi des stocks totaux et disponibles.
2. **Gestion des Étudiants :** Inscription libre et inclusive avec sélection du cycle (Licence 1 à Doctorat), filière au choix (IRTG, Génie Logiciel, Réseaux, Gestion, etc.), attribution d'un matricule étudiant unique.
3. **Gestion des Emprunts :** Panier de sélection d'ouvrages, réservation bloquante de 4 jours, validation de l'emprunt officiel au guichet pour 14 jours, et génération automatique de la **Quittance Officielle PDF** avec empreinte SHA-256.
4. **Gestion des Retours :** Validation physique en 1 clic, réintégration instantanée au stock disponible, calcul dynamique des pénalités en cas de retard.

---

### 🚀 Guide d'Installation & Lancement Local

#### Prérequis :
- **Node.js** (version 18 ou supérieure recommandée) : Téléchargeable gratuitement sur [nodejs.org](https://nodejs.org)
- **NPM** (inclus automatiquement avec Node.js)

#### Étapes :
1. **Extraire l'archive ZIP** dans un dossier de votre choix sur votre ordinateur.
2. **Ouvrir un terminal** (Invite de commandes, PowerShell ou Terminal macOS/Linux) dans ce dossier.
3. **Installer les dépendances :**
   ```bash
   npm install
   ```
4. **(Optionnel) Configurer l'environnement :** copier `.env.example` en `.env` (voir ci-dessous).
5. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
6. **Ouvrir votre navigateur :**
   Rendez-vous à l'adresse indiquée dans votre terminal (habituellement `http://localhost:3000` ou `http://localhost:5173`).

---

### 🛠️ Technologies Utilisées
- **Langage :** TypeScript
- **Framework Front-end :** React 19
- **Outil de Build :** Vite 8
- **Backend :** Node.js + Express (API REST, sessions signées, base JSON atomique)
- **Styling :** Tailwind CSS v4
- **Génération PDF :** jsPDF
- **Icônes :** Lucide-React


---

### 🔐 Sécurité & exploitation

- **Authentification réelle** : mots de passe hachés (scrypt), session par cookie signé `HttpOnly` / `SameSite=Lax`, blocage après échecs répétés.
- **Autorisations côté serveur** : rôles `etudiant` / `admin` / `super_admin` vérifiés sur chaque route ; le client n'est jamais cru sur parole.
- **Règles métier côté serveur** : quota, retards, doublons, stock, réservations de 4 jours (expiration automatique), pénalités de retard.
- **Variables d'environnement** (`.env.example`) : `SESSION_SECRET` (obligatoire en production), `ADMIN_PASSWORD`, `PORT`, `DATA_DIR`, `TRUST_PROXY`.
- **Production** : `npm run build` puis `NODE_ENV=production SESSION_SECRET=... ADMIN_PASSWORD=... npm run start:prod`. Les comptes de démonstration sont désactivés en production.
- **Tests de l'API** : `npm run test:api` (base temporaire, n'altère pas `data/`).
- **Sauvegardes** : une copie `data/database.backup-*.json` est créée avant toute migration ou réinitialisation.

### 💳 Paiement Bachs
1. Renseigner `BACHS_API_KEY`, `PRODUIT_ID` (et `BACHS_URL`) dans `.env`.
2. Le bouton « Bachs » est proposé par défaut dans la fenêtre de souscription : le serveur crée la session, le lecteur est redirigé vers la page Bachs.
3. La formule n'est activée qu'après confirmation par Bachs (vérification côté serveur, jamais sur la seule parole du navigateur).

### 📚 Réservation payante & photo des livres
- Chaque livre a un **prix de réservation en FCFA** (champ du formulaire « Nouveau livre » / « Modifier », 0 = gratuit). Les livres existants démarrent à 500 FCFA.
- Le lecteur règle le total de son panier via Bachs ; les livres sont mis de côté pendant le paiement, puis réservés 4 jours une fois le paiement confirmé par Bachs.
- La **photo de couverture** se téléverse depuis le formulaire (JPEG, PNG ou WebP, redimensionnée automatiquement) ; elle est stockée dans `data/uploads/`.
- Bachs impose un produit à « prix personnalisé » pour un montant variable : renseigner `BACHS_PRODUCT_RESERVATION` (voir `.env.example`).

### 📖 Lecture en ligne (contenu du livre)
- **Dépôt du contenu** : dans le formulaire d'ajout/modification d'un livre, l'administrateur peut joindre le **PDF** du livre (30 Mo max). Le fichier est stocké dans `data/contents/` (jamais dans la base JSON, jamais servi publiquement).
- **Le lecteur choisit** (fiche du livre) : *réserver le livre papier* (retrait au guichet sous 4 jours) ou *le lire en ligne* — **même prix** que la réservation (0 = gratuit), réglé via Bachs.
- **Lecture sur le site uniquement** : après paiement, le livre s'ouvre dans une liseuse intégrée (page par page, zoom, reprise à la dernière page). Pas de bouton de téléchargement, impression masquée, clic droit et Ctrl+S/P neutralisés, filigrane au nom du lecteur sur chaque page, PDF jamais mis en cache.
- **7 jours pour terminer** : le droit de lecture expire automatiquement 7 jours après le paiement ; le serveur refuse alors le PDF. Le lecteur retrouve ses livres dans *Espace étudiant → Mes lectures* et peut payer à nouveau pour relire.
- **Limites** : la lecture dans un navigateur ne peut pas empêcher une capture d'écran ; le filigrane sert à dissuader et à tracer. Sur Render, `data/contents/` doit être sur un **disque persistant** (`DATA_DIR`), comme la base.
- **Aucune nouvelle variable d'environnement** : le paiement réutilise `BACHS_API_KEY` et `BACHS_PRODUCT_RESERVATION`.

### ✉️ Inscription avec vérification d'e-mail & connexion Google
- L'inscription ne crée **plus** de compte immédiatement : un e-mail contenant un lien (valable 24 h) est envoyé ; le compte n'existe qu'après clic sur ce lien. Renvoi possible toutes les 2 minutes.
- Renseigner `SMTP_*` et `APP_PUBLIC_URL` dans `.env` (Gmail : mot de passe d'application). Sans SMTP en développement, le lien est affiché dans le terminal.
- **Connexion Google** : renseigner `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` et ajouter `http://localhost:3000/api/auth/google/callback` aux URI de redirection autorisées dans Google Cloud. Seuls les e-mails vérifiés par Google sont acceptés ; un compte existant avec la même adresse est rattaché.
