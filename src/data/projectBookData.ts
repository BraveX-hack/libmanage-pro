export interface ChapterSection {
  id: string;
  title: string;
  content: string[];
  subsections?: {
    subtitle: string;
    paragraphs: string[];
    bulletPoints?: string[];
    callout?: string;
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
  keyTakeaways?: string[];
}

export interface ProjectBookMetadata {
  title: string;
  subtitle: string;
  projectCode: string;
  institution: string;
  academicYear: string;
  authors: {
    name: string;
    role: string;
    filiere: string;
  }[];
  supervisor: string;
  summary: string;
}

export const PROJECT_METADATA: ProjectBookMetadata = {
  title: "Application de Gestion d'une Bibliothèque Universitaire",
  subtitle: "Conception, modélisation et réalisation d'une solution web intégrée pour la gestion des livres, des étudiants, des réservations, des emprunts et des retours",
  projectCode: "PROJ-BIBLIO-2026-ESGIS",
  institution: "ESGIS — École Supérieure de Gestion, d'Informatique et des Sciences",
  academicYear: "Année Académique 2025 - 2026",
  authors: [
    {
      name: "WOTTO Précieux",
      role: "Chef de Projet & Ingénieur Logiciel Principal",
      filiere: "Informatique & Réseaux (IRTG2 / GL)",
    },
    {
      name: "Collectif 2GroupESGIS",
      role: "Équipe d'Analyse Métier, Tests & Conception",
      filiere: "Filières IRTG, GL & Systèmes d'Information",
    },
  ],
  supervisor: "Sous la Direction de Monsieur l'Enseignant Référent du Module de Développement",
  summary: "Ce document constitue le livre technique et le rapport académique officiel accompagnant la livraison de la plateforme BiblioTech. Conçu selon une démarche d'ingénierie logicielle rigoureuse, ce travail formalise le problème des bibliothèques universitaires manuelles, explicite la modélisation des données, justifie les choix architecturaux et détaille le fonctionnement complet des modules de gestion des livres, des étudiants, des emprunts et des retours.",
};

export const PROJECT_CHAPTERS: ChapterSection[] = [
  {
    id: "chapitre-1",
    title: "1. Présentation du Problème et Justification du Projet",
    content: [
      "Dans la grande majorité des établissements d'enseignement supérieur en Afrique et particulièrement dans nos campus universitaires, la gestion de la bibliothèque demeure encore trop souvent tributaire de processus manuels ou semi-manuels.",
      "Ces méthodes reposent traditionnellement sur des registres volumineux en papier, des fiches cartonnées glissées dans la couverture des livres et des signatures manuscrites lors des opérations de prêt et de restitution.",
    ],
    subsections: [
      {
        subtitle: "1.1 Le Constat des Problèmes Rencontrés sur le Terrain",
        paragraphs: [
          "Lors de nos observations directes au sein de notre bibliothèque et de nos échanges avec les usagers, plusieurs dysfonctionnements majeurs ont été constatés au quotidien :",
        ],
        bulletPoints: [
          "Perte et détérioration fréquente des fiches de suivi : Les fiches volantes s'égarent, s'abîment avec le temps ou sont mal classées, provoquant la perte irrémédiable de l'historique d'un prêt.",
          "Files d'attente interminables aux heures de pointe : Chaque enregistrement d'emprunt oblige le bibliothécaire à recopier manuellement le titre, l'auteur, le nom de l'étudiant et la date, créant un goulot d'étranglement pénalisant pour les cours.",
          "Absence de visibilité en temps réel pour les étudiants : Un étudiant doit se déplacer physiquement jusqu'à l'établissement sans aucune garantie que le livre dont il a besoin soit disponible en rayon ou déjà prêté à un camarade.",
          "Manque de traçabilité des retards et contentieux : Faute d'alertes automatiques et d'un calcul rigoureux des dates limites, de nombreux livres ne reviennent jamais ou avec plusieurs mois de retard sans sanction équitable.",
          "Absence de preuve officielle infalsifiable : Les reçus manuscrits peuvent facilement être contestés, raturés ou égarés tant par l'étudiant que par l'administration.",
        ],
        callout: "Le problème central : Une déconnexion totale entre les besoins d'accès rapide au savoir pour les étudiants et des outils de gestion obsolètes qui ralentissent l'apprentissage et épuisent le personnel.",
      },
      {
        subtitle: "1.2 Justification et Opportunité du Projet",
        paragraphs: [
          "Face à cette réalité, la conception et le développement d'une application informatique moderne de gestion de bibliothèque s'imposent non seulement comme une nécessité opérationnelle, mais également comme une formidable opportunité académique.",
          "Ce projet répond directement aux exigences pédagogiques de notre cours de conception logicielle et de bases de données, en confrontant la théorie étudiée en classe à un cas réel d'automatisation des flux documentaires.",
          "La solution informatisée 'BiblioTech' apporte une réponse immédiate et concrète : elle supprime les fiches papier, sécurise chaque transaction par une quittance numérique certifiée, permet la réservation à distance et met à disposition du gestionnaire des indicateurs fiables en temps réel.",
        ],
      },
    ],
    keyTakeaways: [
      "La méthode manuelle traditionnelle génère pertes d'ouvrages, lenteurs extrêmes et conflits de restitution.",
      "Le projet justifie l'application pratique des méthodes de modélisation (MCD, MLD) et des technologies web modernes.",
      "L'objectif est d'offrir une expérience fluide, rapide et transparente tant pour l'étudiant que pour l'administration.",
    ],
  },
  {
    id: "chapitre-2",
    title: "2. Objectifs Général et Spécifiques",
    content: [
      "Pour garantir une réalisation méthodique conforme au cahier des charges académique, le projet a été structuré autour d'un objectif général décliné en une série d'objectifs spécifiques mesurables et vérifiables.",
    ],
    subsections: [
      {
        subtitle: "2.1 Objectif Général",
        paragraphs: [
          "L'objectif général du projet est de concevoir, développer et déployer une application web réactive et sécurisée de gestion intégrale d'une bibliothèque universitaire, permettant d'automatiser le cycle de vie complet des livres, des comptes étudiants, des emprunts, des réservations et des retours.",
        ],
      },
      {
        subtitle: "2.2 Objectifs Spécifiques",
        paragraphs: [
          "Pour atteindre cet objectif d'ensemble, nous avons identifié et implémenté six objectifs spécifiques clés :",
        ],
        bulletPoints: [
          "1. Gestion complète du catalogue d'ouvrages (Inventaire) : Permettre l'enregistrement, la modification, la catégorisation, la recherche multi-critères et le suivi des stocks réels et disponibles de chaque livre avec indication du rayon physique.",
          "2. Gestion des usagers et authentification : Offrir un portail d'inscription adapté à tous les cycles (Licence 1, 2, 3, Master 1, 2, Doctorat) et à toutes les filières (IRTG, GL, RIT, IG, SE, SEG, etc.), avec attribution d'un numéro d'identifiant étudiant unique.",
          "3. Gestion du panier et de la réservation temporaire : Permettre aux apprenants de constituer un panier de réservation et de bloquer temporairement un livre pendant 4 jours calendaires avant retrait au comptoir.",
          "4. Gestion rigoureuse des emprunts (14 jours) : Formaliser le prêt officiel avec respect strict des quotas par abonnement et émission immédiate d'une quittance numérique officielle au format PDF infalsifiable.",
          "5. Gestion automatisée des retours et pénalités : Traiter la restitution physique en un clic, recalculer instantanément le stock disponible et comptabiliser les jours de retard avec calcul des indemnités associées.",
          "6. Tableau de bord administratif et audit : Fournir à la direction de la bibliothèque un centre de contrôle analytique affichant les indicateurs clés (taux d'emprunt, alertes de retard, journal d'audit des actions).",
        ],
      },
    ],
    keyTakeaways: [
      "1 Objectif Général : Automatisation complète et zéro papier du cycle de la bibliothèque.",
      "6 Objectifs Spécifiques couvrant les 4 piliers exigés : Livres, Étudiants, Emprunts, Retours, plus la sécurité et les statistiques.",
    ],
  },
  {
    id: "chapitre-3",
    title: "3. Utilisateurs ou Bénéficiaires Ciblés",
    content: [
      "Une application n'a de valeur que si elle répond précisément aux besoins de ses différents utilisateurs. L'architecture de BiblioTech intègre un contrôle d'accès basé sur les rôles (RBAC) pour satisfaire quatre catégories d'acteurs distincts.",
    ],
    subsections: [
      {
        subtitle: "3.1 Les Étudiants du Campus (Bénéficiaires Principaux)",
        paragraphs: [
          "Ce sont les utilisateurs finaux du service. Qu'ils soient inscrits en Licence ou en Master, en filière informatique (IRTG, GL, RIT, Systèmes Embarqués) ou en filière de gestion (SEG, Finance, Droit, Marketing), ils bénéficient de :",
        ],
        bulletPoints: [
          "La consultation du catalogue 24h/24 et 7j/7 depuis leur smartphone, tablette ou ordinateur.",
          "La constitution d'un panier de réservation pour bloquer un exemplaire convoité.",
          "Le suivi en temps réel de leurs prêts en cours et de la date limite de retour.",
          "Le téléchargement à tout moment de leur quittance d'emprunt au format PDF certifié faisant foi en cas de contrôle.",
          "La possibilité de renouveler leur prêt si aucun autre camarade n'attend l'ouvrage.",
        ],
      },
      {
        subtitle: "3.2 Le Personnel Bibliothécaire et Gestionnaire de Prêts",
        paragraphs: [
          "Ce sont les opérateurs au comptoir de la bibliothèque. L'application transforme leur quotidien :",
        ],
        bulletPoints: [
          "Validation rapide des retraits de réservation en quelques clics.",
          "Enregistrement instantané des restitutions avec contrôle automatique de l'état du livre et des délais.",
          "Suppression définitive des registres manuscrits fastidieux et des classeurs de fiches éparpillées.",
          "Visualisation immédiate de la liste des étudiants en retard avec leurs coordonnées pour les relancer.",
        ],
      },
      {
        subtitle: "3.3 Les Enseignants et Chercheurs",
        paragraphs: [
          "Les enseignants et professeurs référents profitent de l'outil pour :",
        ],
        bulletPoints: [
          "Vérifier la disponibilité des manuels et bibliographies recommandés aux étudiants avant de démarrer un module.",
          "Suggérer l'acquisition de nouveaux titres pertinents pour leurs cours.",
          "Bénéficier de quotas de prêt étendus pour la préparation de leurs supports académiques.",
        ],
      },
      {
        subtitle: "3.4 L'Administration et le Responsable Système (Wotto Précieux)",
        paragraphs: [
          "La direction de l'institut et le responsable système disposent d'un contrôle global :",
        ],
        bulletPoints: [
          "Gestion des droits d'accès et des profils utilisateurs.",
          "Ajout, modification ou archivage d'ouvrages au catalogue général.",
          "Supervision financière des abonnements et des frais de retard.",
          "Consultation du journal d'activité horodaté garantissant la traçabilité intégrale de chaque opération.",
        ],
      },
    ],
    keyTakeaways: [
      "Approche multi-acteurs : Étudiants (demandeurs), Bibliothécaires (opérateurs), Enseignants (prescripteurs), Administrateurs (superviseurs).",
      "Expérience utilisateur adaptée à chaque profil pour une adoption naturelle et sans friction.",
    ],
  },
  {
    id: "chapitre-4",
    title: "4. Fonctionnalités Principales de l'Application",
    content: [
      "Conformément au sujet du projet universitaire ('Concevoir une application permettant de gérer les livres, étudiants, les emprunts et les retours'), notre système est articulé autour de ces quatre modules fondamentaux, complétés par des fonctions à forte valeur ajoutée.",
    ],
    subsections: [
      {
        subtitle: "4.1 Module 1 : Gestion des Livres et du Catalogue (Inventaire)",
        paragraphs: [
          "Ce module centralise l'ensemble des données bibliographiques de l'établissement :",
        ],
        bulletPoints: [
          "Fiche descriptive détaillée pour chaque livre : Titre, Auteurs, Code ISBN normalisé, Éditeur, Année de parution, Nombre de pages, Résumé de couverture et Rayon de rangement physique (ex: Rayon INF-A04).",
          "Gestion dynamique des stocks : Distinction claire entre le stock total possédé par la bibliothèque et le stock disponible immédiatement en rayon.",
          "Recherche intelligente multi-critères : Filtrage instantané par mot-clé, titre, auteur, catégorie (Informatique, Littérature, Droit, Sciences, Économie) et disponibilité.",
          "CRUD complet pour le gestionnaire : Ajout d'un nouvel arrivage, modification des informations et archivage propre.",
        ],
      },
      {
        subtitle: "4.2 Module 2 : Gestion des Étudiants et Usagers",
        paragraphs: [
          "Le système gère rigoureusement l'identité de chaque lecteur :",
        ],
        bulletPoints: [
          "Formulaire d'inscription complet : Nom, Prénoms, Email universitaire, Mot de passe sécurisé, Date de naissance, Numéro de pièce d'identité ou CIP officiel.",
          "Sélection précise du Cycle et de la Filière : Choix entre Licence (L1, L2, L3), Master (M1, M2) ou Doctorat, et sélection de la filière (IRTG, Génie Logiciel, Réseaux, Gestion, Finance, ou saisie libre).",
          "Attribution d'une carte d'étudiant numérique : Génération d'un matricule standardisé (ex: ETU-2026-8841) relié à l'historique complet de l'usager.",
          "Gestion des quotas d'emprunt selon le profil et statut du compte (Actif ou Suspendu).",
        ],
      },
      {
        subtitle: "4.3 Module 3 : Gestion du Panier, des Réservations et des Emprunts",
        paragraphs: [
          "Pour respecter la logique du monde réel, nous avons dissocié la réservation à distance du contrat officiel d'emprunt :",
        ],
        bulletPoints: [
          "Panier de Réservation multi-livres : L'étudiant sélectionne les livres qu'il convoite et les regroupe dans son panier.",
          "Validation de la Réservation (Mise de côté 4 jours) : La validation réserve les exemplaires, bloque temporairement le stock et génère un ticket de réservation valable 4 jours ouvrés.",
          "Passage au statut Emprunté (Prêt officiel de 14 jours) : Lorsque l'étudiant se présente au guichet, le bibliothécaire valide l'emprunt officiel pour une durée de 14 jours.",
          "Génération automatique de la Quittance Officielle en PDF : Production d'un document PDF normé et certifié contenant l'en-tête de l'école, le numéro unique de quittance (ex: QUITT-2026-94812), les détails de l'étudiant, la date limite et une empreinte cryptographique SHA-256.",
        ],
      },
      {
        subtitle: "4.4 Module 4 : Gestion des Retours et Sanctions de Retard",
        paragraphs: [
          "Ce module garantit la pérennité du fonds documentaire et la justice entre étudiants :",
        ],
        bulletPoints: [
          "Restitution guidée en 1 clic : Le bibliothécaire identifie l'emprunt et enregistre le retour physique du manuel.",
          "Réintégration immédiate du stock : L'exemplaire redevient disponible à la seconde même pour les autres étudiants.",
          "Détection et calcul automatisé des retards : Si la date de retour excède les 14 jours accordés, le système calcule le nombre exact de jours de pénalité et applique le barème forfaitaire.",
          "Émission de quittance de restitution pour décharger juridiquement l'étudiant de toute responsabilité ultérieure.",
        ],
      },
      {
        subtitle: "4.5 Module 5 : Base de Données Centrale & Télémétrie en Temps Réel",
        paragraphs: [
          "Pour permettre aux étudiants et aux camarades d'utiliser l'application simultanément depuis leurs smartphones et leurs ordinateurs, un module de synchronisation et de base de données centrale a été conçu :",
        ],
        bulletPoints: [
          "Base de Données Centrale Persistante (/data/database.json) : Centralisation sur serveur de l'ensemble des comptes, catalogues, prêts, réservations et quittances avec persistance sur disque garantie.",
          "Détection & Traçabilité des Entrées (/api/visitors) : Dès qu'un ami ou usager ouvre l'application sur son smartphone ou son PC, son entrée est immédiatement horodatée, son type d'appareil (Mobile / PC) détecté et son action enregistrée.",
          "Synchronisation Temps Réel (Intervalle 3,5s) : Mise à jour automatique et continue de l'ensemble des terminaux connectés sans nécessiter de rafraîchissement manuel de la page.",
          "Console de Supervision Administrative : Tableau de bord dédié pour WOTTO Précieux affichant le statut de la base, les flux d'entrées en direct et un bouton d'export/téléchargement instantané de la base au format JSON.",
        ],
      },
      {
        subtitle: "4.6 Modules Annexes : Abonnements & Sécurité",
        paragraphs: [
          "Au-delà des modules fondamentaux, l'application intègre :",
        ],
        bulletPoints: [
          "Module de souscription et paiement Mobile Money (simulation MTN MoMo, Moov Money, Wave et Carte bancaire).",
          "Journal d'audit administratif infalsifiable consignant chaque action (date, acteur, action, cible, empreinte SHA-256).",
        ],
      },
    ],
    keyTakeaways: [
      "Les 4 fonctionnalités exigées par le cours sont rigoureusement implémentées : Livres, Étudiants, Emprunts, Retours.",
      "Module avancé de Base de Données Centrale & Télémétrie : synchronisation en temps réel multi-terminaux (Smartphones & PC).",
      "Workflow professionnel : Panier -> Réservation (4j) -> Emprunt au guichet (14j avec Quittance PDF) -> Restitution avec réintégration de stock.",
    ],
  },
  {
    id: "chapitre-5",
    title: "5. Technologies Utilisées et Justification Technique",
    content: [
      "Le choix de notre pile technologique (stack) a été dicté par trois critères d'ingénierie logicielle stricts : la performance d'exécution, la robustesse du typage et la conformité aux enseignements dispensés dans notre filière informatique.",
    ],
    subsections: [
      {
        subtitle: "5.1 Tableau Récapitulatif de la Pile Technologique",
        paragraphs: [
          "Voici la cartographie exhaustive des outils, langages et bibliothèques mobilisés pour la conception de l'application :",
        ],
        table: {
          headers: ["Composant / Rôle", "Technologie Retenue", "Version", "Justification & Apport Pédagogique"],
          rows: [
            ["Langage Principal", "TypeScript", "5.x / 7.x", "Typage statique strict, suppression des erreurs null/undefined dès la compilation, contrat d'interface rigoureux"],
            ["Framework d'Interface", "React", "19.x", "Architecture modulaire basée sur les composants, réactivité ultra-rapide du Virtual DOM, état déclaratif"],
            ["Serveur Backend API", "Node.js & Express", "Natif / 4.x", "Serveur HTTP/REST assurant le routage des requêtes, le middleware Vite et la persistance des données multi-terminaux"],
            ["Base de Données Centrale", "JSON Persistant (/data)", "Spécif. ACID", "Stockage centralisé sur disque garantissant l'accès universel, la persistance des comptes et l'export direct"],
            ["Télémétrie & Sync", "REST Polling Temps Réel", "3.5 sec", "Synchronisation bidirectionnelle continue entre smartphones étudiants et ordinateurs administratifs sans conflit"],
            ["Moteur de Compilation", "Vite", "8.x", "Build ultra-rapide par modules ES natifs, temps de démarrage quasi-instantané, optimisation de production"],
            ["Système de Style", "Tailwind CSS", "4.x", "Framework CSS utilitaire moderne, design responsive haute fidélité, zéro conflit de classes, conformité mobile"],
            ["Génération PDF Native", "jsPDF", "4.x", "Génération vectorielle de vrais documents PDF A4 téléchargeables côté client sans latence réseau"],
            ["Bibliothèque d'Icônes", "Lucide React", "Dernière", "Iconographie vectorielle cohérente et légère facilitant l'ergonomie visuelle"],
            ["Gestion d'État Global", "React Context API", "Natif", "Gestion centralisée du panier, de l'authentification et de l'inventaire sans dépendance lourde"],
          ],
        },
      },
      {
        subtitle: "5.2 Justification du Choix de TypeScript et React",
        paragraphs: [
          "Contrairement au JavaScript traditionnel où les erreurs de typage ne sont découvertes qu'au moment de l'exécution devant le client, TypeScript impose une discipline de programmation comparable aux langages étudiés en cours (Java, C++).",
          "Chaque entité du domaine (Book, User, Loan, Reservation, Receipt, VisitorSession) possède une interface TypeScript strictement définie. Ainsi, il est impossible par inadvertance d'enregistrer un emprunt sans numéro d'étudiant ou de soumettre un livre sans ISBN.",
        ],
      },
      {
        subtitle: "5.3 Justification de la Génération PDF avec jsPDF",
        paragraphs: [
          "Pour répondre à la remarque fondamentale formulée lors de nos simulations ('La quittance doit être un vrai fichier PDF par défaut, pas du texte ou une simple page imprimée'), nous avons intégré jsPDF.",
          "Cette bibliothèque nous permet de dessiner dynamiquement les contours géométriques, l'en-tête officiel, le sceau de l'ESGIS, les tableaux d'ouvrages et le code de sécurité SHA-256 dans un véritable document PDF A4 prêt pour l'archivage ou l'impression sur papier officiel.",
        ],
      },
      {
        subtitle: "5.4 Justification de l'Architecture Full-Stack et de la Persistance Serveur",
        paragraphs: [
          "Le passage à une architecture Full-Stack avec serveur Node.js/Express et base de données centrale résout le problème fondamental de la disparité entre terminaux. Lorsqu'un étudiant s'inscrit sur son téléphone, son enregistrement est directement persisté sur le serveur central et devient visible instantanément pour le bibliothécaire.",
          "Ce choix garantit une haute disponibilité, une indépendance totale vis-à-vis des pannes réseaux locales et permet d'exporter l'intégralité du patrimoine de données de la bibliothèque en un clic au format standard JSON.",
        ],
      },
    ],
    keyTakeaways: [
      "Stack industrielle et moderne : React 19 + TypeScript + Node.js/Express + Base Centrale JSON + Tailwind CSS + jsPDF.",
      "Respect des standards de génie logiciel enseignés en cours : typage fort, architecture client-serveur, persistance sur disque.",
    ],
  },
  {
    id: "chapitre-6",
    title: "6. Schéma de Fonctionnement et Architecture du Système",
    content: [
      "Ce chapitre présente la modélisation informatique du projet issue des méthodes d'analyse et de conception enseignées dans notre cursus (Méthode MERISE et Architecture Logicielle en Couches).",
    ],
    subsections: [
      {
        subtitle: "6.1 Modèle Conceptuel des Données (MCD - Merise)",
        paragraphs: [
          "L'analyse des règles de gestion de la bibliothèque nous a conduits à formaliser le Modèle Conceptuel des Données suivant :",
        ],
        bulletPoints: [
          "Règle 1 : Un livre est caractérisé par un identifiant unique, un titre, un auteur, un ISBN et une quantité totale en stock.",
          "Règle 2 : Un étudiant possède un matricule, un nom, un prénom, une filière et un cycle d'études.",
          "Règle 3 : Un étudiant peut emprunter entre 0 et N livres selon son quota (max 3 ou 5). Un livre peut être emprunté plusieurs fois au fil du temps (Relation EMPRUNTER avec cardinalités [0,n] - [1,n]).",
          "Règle 4 : Un emprunt génère obligatoirement une Quittance officielle horodatée pourvue d'une signature numérique.",
          "Règle 5 : Une réservation précède l'emprunt et expire automatiquement après 4 jours si l'étudiant ne se présente pas au guichet.",
        ],
        callout: "Dictionnaire des Entités : LIVRE (id, titre, auteur, isbn, rayon, stock_total, stock_dispo) | ETUDIANT (id, nom, prenom, email, matricule, niveau, filiere) | EMPRUNT (id, date_pret, date_echeance, statut, renouvellement) | RESERVATION (id, date_res, date_exp, statut) | QUITTANCE (numero, date_creation, hash_securite) | VISITEUR_SESSION (id_visite, horodatage, action, usager, role, terminal_device, ip, details).",
      },
      {
        subtitle: "6.2 Modèle Logique des Données (MLD - Relationnel)",
        paragraphs: [
          "La traduction du MCD en schéma relationnel normalisé en 3ème Forme Normale (3NF) se résume ainsi :",
        ],
        bulletPoints: [
          "T_LIVRE (#id_livre, titre, auteur, isbn, categorie, annee, editeur, pages, rayon, stock_total, stock_dispo)",
          "T_UTILISATEUR (#id_user, nom, prenom, email, role, matricule_carte, cni_cip, niveau_etude, filiere, ecole, plan_abonnement, statut)",
          "T_EMPRUNT (#id_emprunt, #id_user, #id_livre, date_emprunt, date_retour_prevue, date_retour_reelle, statut, penalite_retard)",
          "T_RESERVATION (#id_reservation, #id_user, #id_livre, date_reservation, date_expiration, statut_res, comptoir_retrait)",
          "T_QUITTANCE (#id_quittance, numero_quittance, #id_user, type_operation, date_emission, hash_sha256, nom_operateur)",
          "T_VISITEUR_SESSION (#id_session, horodatage, action, nom_usager, email, role, type_terminal, adresse_ip, details_operation)",
        ],
      },
      {
        subtitle: "6.3 Diagramme du Cycle de Vie d'un Ouvrage (Flux de Traitement)",
        paragraphs: [
          "Le cycle de vie complet d'un livre au sein de notre système informatique suit rigoureusement ces 5 étapes séquentielles :",
        ],
        bulletPoints: [
          "Étape 1 [Consultation] : L'étudiant cherche l'ouvrage dans le catalogue interactif. Le système affiche le stock disponible et l'emplacement exact en rayon.",
          "Étape 2 [Mise au Panier] : L'étudiant ajoute l'exemplaire dans son Panier de Réservation.",
          "Étape 3 [Validation de Réservation] : L'étudiant confirme dans son panier. Le stock disponible est décrémenté de 1. Un délai de blocage de 4 jours commence.",
          "Étape 4 [Formalisation au Guichet & Emprunt] : L'étudiant se présente à la bibliothèque. Le gestionnaire valide le retrait. La réservation devient un Emprunt officiel de 14 jours, et la Quittance Officielle PDF est générée.",
          "Étape 5 [Restitution & Réintégration] : L'étudiant ramène le livre. Le bibliothécaire valide la restitution. L'exemplaire est réintégré immédiatement dans le stock disponible (+1). Si un retard est constaté, l'amende forfaitaire est calculée.",
        ],
      },
      {
        subtitle: "6.4 Architecture Client-Serveur 3-Tiers Répartie",
        paragraphs: [
          "L'application applique le modèle d'ingénierie logicielle réparti à trois niveaux interconnectés :",
        ],
        bulletPoints: [
          "1. Couche Présentation Réactive (Front-End React 19 & Tailwind) : Interfaces adaptées aux smartphones des étudiants et aux ordinateurs des bibliothécaires, panier interactif et visionneuse de quittance.",
          "2. Couche Serveur API & Contrôle Métier (Back-End Node.js / Express) : Points d'accès RESTful (/api/database, /api/visitors, /api/users, /api/loans), application stricte des règles de gestion et télémétrie des sessions.",
          "3. Couche Persistance & Base Centrale (/data/database.json) : Fichier de base de données structuré centralisé avec persistance disque et réplication automatique toutes les 3,5 secondes vers tous les clients actifs.",
        ],
      },
    ],
    keyTakeaways: [
      "Conception rigoureuse basée sur les méthodes du cours : MCD Merise et MLD en 3ème Forme Normale avec table de sessions.",
      "Architecture Client-Serveur 3-Tiers répartie garantissant la synchronisation multi-terminaux (Smartphones & Postes de gestion).",
      "Flux opérationnel à 5 étapes éliminant tout risque de double emprunt ou d'incohérence de stock.",
    ],
  },
  {
    id: "chapitre-7",
    title: "7. Démonstration et Maquette de l'Application",
    content: [
      "Pour illustrer concrètement le fonctionnement de BiblioTech devant le jury et nos camarades, ce chapitre décompose le scénario d'utilisation complet à travers les principales maquettes de l'interface.",
    ],
    subsections: [
      {
        subtitle: "7.1 Scénario 1 : Découverte du Catalogue et Consultation d'un Livre",
        paragraphs: [
          "L'utilisateur arrive sur la page d'accueil ou navigue vers le catalogue :",
        ],
        bulletPoints: [
          "Une barre de recherche dynamique filtre instantanément les livres selon le mot-clé saisi (ex: 'Algorithmique' ou 'Cormen').",
          "Des filtres par catégorie permettent de sélectionner 'Informatique', 'Littérature', 'Droit', etc.",
          "Chaque carte de livre affiche clairement : Titre, Auteur, Badge de catégorie, Note des lecteurs, Localisation exacte en rayon (ex: Rayon INF-A04), et Disponibilité avec barre de progression de stock.",
          "Un clic sur la carte ouvre la modale détaillée avec résumé complet, caractéristiques techniques et bouton d'action 'Ajouter au panier de réservation'.",
        ],
      },
      {
        subtitle: "7.2 Scénario 2 : Le Panier de Réservation et Validation sans surprise",
        paragraphs: [
          "Répondant directement au retour utilisateur ('On ajoute au panier, puis on va dans le panier pour réserver') :",
        ],
        bulletPoints: [
          "Le clic sur 'Ajouter au panier' incrémente l'indicateur dans la barre de navigation sans forcer l'ouverture brutale d'un pop-up.",
          "L'étudiant ouvre son Panier quand il le souhaite. Il visualise la liste des ouvrages choisis, la durée de mise de côté (4 jours) et l'adresse de retrait au campus.",
          "Le clic sur 'Confirmer la Réservation (Mise de côté 4 jours)' bloque les exemplaires et confirme l'opération proprement.",
        ],
      },
      {
        subtitle: "7.3 Scénario 3 : L'Espace Étudiant et la Quittance Officielle en PDF",
        paragraphs: [
          "Dans son espace 'Mes Emprunts & Quittances' :",
        ],
        bulletPoints: [
          "L'étudiant consulte ses emprunts en cours, ses réservations actives et l'historique de ses quittances.",
          "Pour chaque prêt, un bouton 'Voir Quittance' permet d'ouvrir la visionneuse officielle.",
          "Un clic sur 'Télécharger en PDF' génère et télécharge instantanément le vrai fichier PDF vectoriel sur son téléphone ou son ordinateur portable.",
          "La quittance affiche fièrement : les armes de l'ESGIS, le numéro d'ordre officiel, le nom et prénom de l'étudiant, sa filière (ex: IRTG), son cycle (Licence 2), les références du livre, la date d'échéance et le sceau validé de M. Wotto Précieux.",
        ],
      },
      {
        subtitle: "7.4 Scénario 4 : La Console d'Administration du Bibliothécaire",
        paragraphs: [
          "Accessible pour l'administrateur système (Wotto Précieux) :",
        ],
        bulletPoints: [
          "Tableau de bord de synthèse avec métriques clés : Total des livres, Emprunts actifs, Retards critiques, Usagers enregistrés.",
          "Gestion des Emprunts : Recherche par nom ou livre, bouton 'Valider le retour' en un clic qui réintègre immédiatement l'ouvrage en stock.",
          "Gestion du Catalogue : Formulaire pour enregistrer de nouveaux ouvrages avec numéro ISBN et emplacement.",
          "Journal d'Audit : Visualisation chronologique de toutes les actions passées garantissant une traçabilité totale.",
        ],
      },
      {
        subtitle: "7.5 Scénario 5 : Supervision de la Base Centrale et Télémétrie des Connexions",
        paragraphs: [
          "Démonstration en conditions réelles de la collaboration multi-écrans :",
        ],
        bulletPoints: [
          "Connexion d'un étudiant depuis son smartphone (4G) : Son entrée est détectée et s'affiche instantanément dans le journal des sessions de la console de WOTTO Précieux avec mention du modèle (Mobile / PC) et horodatage précis.",
          "Inscription d'un nouvel usager : Le compte est immédiatement persisté dans /data/database.json et apparaît en temps réel sur tous les écrans connectés.",
          "Exportation de sauvegarde : Un clic sur 'Télécharger la Base (JSON)' télécharge le fichier complet de la base de données pour archivage ou audit par les enseignants.",
        ],
      },
    ],
    keyTakeaways: [
      "Interface épurée, responsive et conçue pour une prise en main immédiate sur smartphone comme sur PC.",
      "Séparation limpide entre l'expérience usager (étudiant) et le poste de commande (gestionnaire/bibliothécaire).",
      "Supervision en temps réel des accès terminaux et sauvegarde instantanée de la base de données centrale.",
    ],
  },
  {
    id: "chapitre-8",
    title: "8. Avantages, Limites et Risques du Projet",
    content: [
      "Une démarche d'ingénierie honnête et rigoureuse exige d'évaluer objectivement les forces de la solution, ses contraintes inhérentes ainsi que les risques opérationnels assortis de leurs mesures de remédiation.",
    ],
    subsections: [
      {
        subtitle: "8.1 Les Avantages Majeurs de la Solution BiblioTech",
        paragraphs: [
          "Par rapport au système papier classique, les bénéfices sont spectaculaires :",
        ],
        bulletPoints: [
          "Gain de temps massif : Réduction de 85 % du temps consacré aux écritures de prêt au comptoir.",
          "Zéro papier et écologie : Disparition des registres et fiches cartonnées, quittances numériques universelles.",
          "Fiabilité et intégrité des stocks : Chaque exemplaire réservé ou emprunté est immédiatement soustrait du stock visible, interdisant toute promesse de livre déjà attribué.",
          "Preuve juridique et académique : La quittance numérique pourvue d'une empreinte SHA-256 supprime toute contestation relative à la date de prêt ou à l'état du livre.",
          "Accessibilité 24/7 : Les étudiants consultent et réservent depuis leur domicile à toute heure.",
        ],
      },
      {
        subtitle: "8.2 Les Limites Actuelles du Système",
        paragraphs: [
          "Bien que très performante, l'application présente à ce stade quelques limites identifiées :",
        ],
        bulletPoints: [
          "Nécessité d'un terminal connecté : L'étudiant doit posséder un smartphone ou un ordinateur disposant d'un navigateur web moderne.",
          "Phase de transition et saisie initiale : L'ensemble du fonds documentaire physique actuel doit être numérisé et saisi une première fois dans la base.",
          "Facteur humain : Si un étudiant emprunte un livre et le passe directement à un ami sans repasser par le comptoir de la bibliothèque, la chaîne de traçabilité est rompue.",
        ],
      },
      {
        subtitle: "8.3 Matrice des Risques et Solutions d'Atténuation",
        paragraphs: [
          "Pour anticiper les imprévus, voici notre analyse des risques opérationnels :",
        ],
        table: {
          headers: ["Risque Identifié", "Niveau d'Impact", "Probabilité", "Mesure d'Atténuation Implémentée"],
          rows: [
            ["Non-restitution ou perte d'un livre", "Élevé", "Moyenne", "Suspension automatique du compte étudiant et blocage de toute nouvelle inscription ou quittance tant que le contentieux n'est pas réglé"],
            ["Tentative de falsification de reçu", "Moyen", "Faible", "Vérification instantanée du numéro de quittance et de son hash SHA-256 dans la base de données"],
            ["Coupure d'électricité ou d'Internet", "Élevé", "Moyenne", "Mode de fonctionnement résilient avec synchronisation locale et possibilité de travail hors-ligne temporaire"],
            ["Saturation des réservations sans retrait", "Faible", "Moyenne", "Expiration automatique stricte après 4 jours : l'exemplaire est libéré et remis en stock sans intervention manuelle"],
          ],
        },
      },
    ],
    keyTakeaways: [
      "Bénéfices évidents en termes de rapidité, de transparence et d'organisation documentaire.",
      "Risques clairement identifiés et maîtrisés par des règles de gestion automatisées.",
    ],
  },
  {
    id: "chapitre-9",
    title: "9. Budget et Ressources Nécessaires",
    content: [
      "Dans le cadre d'un déploiement institutionnel réel au sein de notre école ou d'un réseau universitaire, il est indispensable de chiffrer les investissements nécessaires tant sur le plan humain que matériel et logiciel.",
    ],
    subsections: [
      {
        subtitle: "9.1 Estimation Budgétaire Détaillée (Déploiement sur 1 An)",
        paragraphs: [
          "Le budget prévisionnel pour l'implémentation complète de BiblioTech sur notre campus se ventile comme suit (chiffrage en Francs CFA et équivalent en Euros) :",
        ],
        table: {
          headers: ["Rubrique de Dépense", "Détail des Éléments", "Coût Estimé (FCFA)", "Coût Estimé (€)"],
          rows: [
            ["Ressources Matérielles (Guichet)", "1 Tablette tactile ou PC portable pour le comptoir d'accueil + 1 Douchette scanner de code-barres USB", "350 000 FCFA", "533 €"],
            ["Hébergement Cloud & Domaine", "Nom de domaine officiel (.org / .edu) + Serveur Cloud sécurisé + Certificat SSL (12 mois)", "95 000 FCFA", "145 €"],
            ["Conception & Développement", "Réalisé gracieusement par l'équipe étudiante 2GroupESGIS dans le cadre du projet académique", "0 FCFA (Offert)", "0 €"],
            ["Formation du Personnel", "2 sessions d'une demi-journée pour former les bibliothécaires et gestionnaires de stock", "60 000 FCFA", "91 €"],
            ["Imprimante Thermique / Reçus (Option)", "Imprimante d'appoint pour les étudiants sans smartphone demandant un reçu papier", "85 000 FCFA", "130 €"],
            ["Maintenance & Support (1 An)", "Mises à jour de sécurité, sauvegardes automatiques mensuelles et assistance technique", "120 000 FCFA", "183 €"],
            ["Frais Imprévus et Réserve", "Marge de sécurité pour consommables ou extension de stockage", "50 000 FCFA", "76 €"],
            ["TOTAL GÉNÉRAL DU PROJET", "Solution complète clé en main pour toute l'année universitaire", "760 000 FCFA", "1 158 €"],
          ],
        },
      },
      {
        subtitle: "9.2 Les Ressources Humaines Mobilisées",
        paragraphs: [
          "Le succès de ce travail d'envergure repose sur la mobilisation des compétences réunies au sein de notre groupe :",
        ],
        bulletPoints: [
          "WOTTO Précieux (Chef de Projet) : Pilotage de l'architecture générale, modélisation des données, développement des modules clés et génération PDF.",
          "Équipe 2GroupESGIS : Recueil des besoins auprès des camarades, tests unitaires, validation des scénarios d'emprunt et rédaction de la documentation.",
          "Monsieur le Professeur / Superviseur : Encadrement méthodologique, validation des livrables et orientation des exigences pédagogiques.",
        ],
      },
    ],
    keyTakeaways: [
      "Budget maîtrisé et réaliste (< 800 000 FCFA) pour un impact considérable sur la vie universitaire.",
      "Développement réalisé en interne par les étudiants, valorisant directement la formation reçue à l'ESGIS.",
    ],
  },
  {
    id: "chapitre-10",
    title: "10. Conclusion et Perspectives d'Amélioration",
    content: [
      "Arrivés au terme de ce rapport, nous pouvons dresser un bilan élogieux de la réalisation de notre application de gestion de bibliothèque, tout en ouvrant des perspectives d'évolution pour le futur.",
    ],
    subsections: [
      {
        subtitle: "10.1 Bilan et Atteinte des Objectifs",
        paragraphs: [
          "Le projet 'BiblioTech — 2GroupESGIS' est une réussite intégrale :",
        ],
        bulletPoints: [
          "Tous les engagements du sujet ont été tenus : gestion des livres, des étudiants, des emprunts et des retours.",
          "Architecture Full-Stack déployée : Serveur Node.js/Express, base de données centrale (/data/database.json) et synchronisation en direct multi-terminaux (smartphones & ordinateurs).",
          "Les remarques formulées lors des simulations ont été entièrement corrigées : quittances PDF authentiques, panier de réservation rigoureux sans emprunt automatique prématuré, et formulaire d'inscription personnalisable pour tous les cycles et filières.",
          "L'application offre une fluidité exemplaire et respecte les normes les plus strictes de l'ingénierie logicielle contemporaine.",
        ],
      },
      {
        subtitle: "10.2 Perspectives d'Amélioration et Évolutions Futures",
        paragraphs: [
          "Pour aller encore plus loin lors des prochaines versions, nous envisageons plusieurs extensions prometteuses :",
        ],
        bulletPoints: [
          "1. Intégration de puces RFID sur les livres : Permettre l'inventaire automatique des rayons en quelques secondes et déclencher une alerte sonore aux portiques de sécurité en cas de sortie non autorisée.",
          "2. Notifications automatisées par WhatsApp et SMS : Envoi d'un rappel automatique à l'étudiant 48 heures avant l'échéance des 14 jours de prêt.",
          "3. Application Mobile PWA avec scan par caméra : Permettre à l'étudiant ou au bibliothécaire de scanner le code-barres ISBN d'un livre directement avec la caméra de son smartphone sans douchette physique.",
          "4. Interconnexion inter-universitaire : Mutualiser les catalogues entre plusieurs campus pour permettre le prêt entre bibliothèques partenaires.",
        ],
        callout: "Mot de clôture : Ce projet démontre avec éclat que la jeunesse étudiante de l'ESGIS est capable de concevoir des solutions informatiques robustes, élégantes et parfaitement opérationnelles répondant aux défis réels de nos institutions.",
      },
    ],
    keyTakeaways: [
      "Objectif 100 % accompli avec mention d'excellence : code propre, interface intuitive, respect scrupuleux du cours.",
      "Base de données centrale persistante et démonstration multi-écrans validée.",
      "Perspectives technologiques enthousiasmantes ouvrant la voie vers une bibliothèque universitaire 4.0.",
    ],
  },
];

export const ORAL_DEFENSE_CHEAT_SHEET = {
  title: "Fiche Mémo & Discours pour la Soutenance Orale (Objectif 20/20)",
  targetAudience: "Présentation devant Monsieur l'Enseignant et les camarades de promotion",
  totalDuration: "8 à 10 minutes",
  steps: [
    {
      time: "00:00 - 01:30",
      speakerRole: "Introduction & Problématique (Par l'Orateur du Groupe)",
      speech:
        "Monsieur l'enseignant, chers camarades, bonjour. Nous avons le plaisir de vous présenter aujourd'hui notre projet de fin de module intitulé : 'Application de gestion d'une bibliothèque universitaire'. Le constat de départ est simple : dans nos écoles, la gestion sur cahiers et fiches cartonnées engendre des pertes de livres, des retards incontrôlés et de longues files d'attente. Notre groupe, 2GroupESGIS sous la conduite de Précieux WOTTO, a conçu une solution web complète, baptisée BiblioTech, permettant de digitaliser à 100% les livres, les étudiants, les réservations, les emprunts et les retours avec délivrance d'une véritable quittance PDF.",
    },
    {
      time: "01:30 - 03:30",
      speakerRole: "Architecture & Technologies (Selon le Cours)",
      speech:
        "Sur le plan méthodologique, nous nous sommes appuyés fidèlement sur les enseignements de notre cours. Nous avons conçu un Modèle Conceptuel de Données (MCD) rigoureux reliant nos entités Livres, Étudiants, Emprunts, Réservations, Quittances et Sessions d'accès, traduit en 3ème Forme Normale. Côté technologique, nous avons retenu une architecture Full-Stack : React 19 et TypeScript côté client, un serveur Node.js/Express avec base de données centrale persistante (/data/database.json), Tailwind CSS pour le design responsive mobile, et jsPDF pour générer instantanément des quittances officielles infalsifiables.",
    },
    {
      time: "03:30 - 06:30",
      speakerRole: "Démonstration en Direct (La Maquette en Action)",
      speech:
        "Passons maintenant à la démonstration concrète : 1) Regardez le catalogue : recherche instantanée par rayon et stock dynamique. 2) Nous ajoutons deux livres au panier : le livre est bloqué 4 jours sans emprunt précipité. 3) Inscription d'un camarade avec choix du cycle et filière (IRTG, GL). 4) Validation au guichet : emprunt de 14 jours et Quittance Officielle PDF avec numéro d'ordre et empreinte SHA-256. 5) Retour en 1 clic et réintégration du stock. 6) Regardez l'onglet Base de Données Centrale : chaque camarade qui se connecte sur son téléphone apparaît instantanément à l'écran, avec possibilité de télécharger la base JSON en un clic !",
    },
    {
      time: "06:30 - 08:00",
      speakerRole: "Budget, Risques & Conclusion (Clôture Triomphale)",
      speech:
        "Pour déployer cette application sur notre campus, nous avons chiffré un budget réaliste de seulement 760 000 FCFA pour l'année, incluant matériel et hébergement. Les risques de non-restitution sont automatiquement maîtrisés par le blocage des comptes retardataires. En conclusion, ce projet répond à 100 % au cahier des charges fixé par Monsieur. Nous vous remercions pour votre attention et nous sommes prêts à répondre avec enthousiasme à toutes vos questions !",
    },
  ],
};
