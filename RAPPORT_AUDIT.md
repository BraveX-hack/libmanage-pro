# Rapport d'audit et d'améliorations — BiblioTech (2GroupESGIS)

**Contrainte respectée : aucun CSS modifié.** `src/index.css` et `index.html` sont strictement identiques à l'original, et toutes les chaînes `className` des composants sont identiques (vérifié par comparaison automatique avec l'archive d'origine). Seuls le HTML/JSX de logique, le JavaScript/TypeScript et le backend ont changé.

## 1. Architecture constatée
React 19 + Vite + Tailwind (le « CSS » est dans les classes utilitaires), serveur Express (`server.ts`) avec base JSON (`data/database.json`), état client dupliqué dans `localStorage`.

## 2. Problèmes critiques trouvés (et corrigés)

| # | Problème | Correction |
|---|----------|-----------|
| 1 | `npm install` échouait (conflit `esbuild ^0.25` / Vite 8) | `esbuild` passé en `^0.27.0` |
| 2 | **La connexion ignorait le mot de passe** : un simple e-mail suffisait (même pour le super-admin) | Authentification serveur : mot de passe haché (scrypt), session signée HttpOnly |
| 3 | **Le bouton du pied de page « Réinitialiser la simulation » connectait n'importe qui en super-admin** | Bouton réservé au super-admin, serveur, hors production, avec confirmation et sauvegarde |
| 4 | `GET /api/database` renvoyait toute la base (comptes, pièces d'identité, dates de naissance, « hash ») à n'importe quel visiteur | Route supprimée ; état filtré par rôle ; `passwordHash` jamais envoyé |
| 5 | `POST /api/users` et `/api/sync` permettaient de créer/modifier un compte avec `role: super_admin` | Rôle imposé par le serveur ; seul un super-admin change les rôles |
| 6 | Mots de passe de démonstration visibles dans le code envoyé au navigateur | Le client n'embarque plus les données de démo ; hash scrypt côté serveur |
| 7 | **Les modifications faites côté client étaient écrasées toutes les 3,5 s** par la base serveur (ajout de livre, réservation, renouvellement, rôles, archivage…) | Le serveur est l'unique source de vérité ; chaque action passe par l'API |
| 8 | Stock incohérent (données de démo fausses, double décompte client/serveur) | Stock recalculé = total − prêts actifs − réservations actives |
| 9 | Statut « en retard » jamais calculé ; pénalités inexistantes | Calcul automatique + pénalité (200 FCFA/jour) affichée au retour |
| 10 | Réservations expirées jamais libérées | Expiration automatique après 4 jours, stock restitué |
| 11 | Retrait d'une réservation créait le prêt avec l'e-mail/carte de l'administrateur | Prêt créé pour le bon lecteur |
| 12 | Quittance : « empreinte SHA-256 » faite avec `Math.random()` | Vrai SHA-256 du contenu ; numérotation séquentielle sans collision |
| 13 | « Envoi par e-mail » affichait un faux succès | Erreur claire (non configuré) au lieu d'un faux succès |
| 14 | Paiement : abonnement activé côté client sans contrôle | Plan, montant et moyen validés côté serveur ; désactivé en production sauf `PAYMENT_SIMULATION=true` |
| 15 | Numéro de téléphone et e-mail personnels codés en dur comme valeurs par défaut | Champs vides par défaut |

## 3. Autres améliorations
- Anti-force-brute (par IP et par compte), message de connexion générique, comptes suspendus déconnectés immédiatement.
- Validation et nettoyage serveur de toutes les entrées ; URL de couverture dangereuses refusées ; ISBN uniques.
- Protection CSRF (cookie `SameSite=Lax` + contrôle d'origine), en-têtes de sécurité, CSP en production.
- Écriture atomique de la base, restauration en mémoire en cas d'erreur, sauvegarde avant migration.
- Doublons de prêt/réservation interdits ; les réservations comptent dans le quota ; panier nettoyé automatiquement.
- Recherche du catalogue insensible aux accents et aux tirets d'ISBN.
- Interrogation du serveur toutes les 15 s (au lieu de 3,5 s) et seulement si l'onglet est visible ; console d'administration chargée à la demande.
- Les archives `.zip` du dossier `public/` ne sont plus servies ; le zip du code source est réservé aux admins.

## 4. Vérifications effectuées
`tsc --noEmit` sans erreur · `vite build` OK · `npm install` sans option spéciale · `npm run test:api` : **40 tests réussis** (authentification, droits, quotas, stock, retards/pénalités, doublons, anti-force-brute) · migration testée sur votre `data/database.json` réel (aucune donnée perdue, copie de sauvegarde créée).

## 5. Limites — à savoir honnêtement
- **L'interface n'a pas été testée dans un navigateur** (aucun disponible ici) : vérifiée par compilation, build et tests d'API. À parcourir une fois : connexion, inscription, emprunt, panier, retour (admin), paiement simulé.
- L'envoi d'e-mails et un vrai paiement mobile money ne sont pas branchés (à configurer).
- Base JSON : adaptée à une démo / petite bibliothèque, pas à plusieurs instances ; SQLite/PostgreSQL recommandé ensuite.
- Pas ajoutés dans cette passe : pagination, filtres par auteur/année, import/export avancé, upload des photos de couverture (URL seulement).

## 6. Avant toute mise en ligne
1. Définir `SESSION_SECRET` et `ADMIN_PASSWORD` (voir `.env.example`).
2. Les comptes de démonstration (dont les mots de passe figurent dans `src/data/mockData.ts`) sont refusés en production ; créez de vrais comptes.
3. Supprimer du dépôt les anciens `.zip` de `public/` : ils contiennent d'anciennes versions du code avec ces mots de passe.
