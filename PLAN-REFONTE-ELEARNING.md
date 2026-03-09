# Plan de refonte – Plateforme e-learning FACAM ACADEMIA

Ce document décrit la refonte de l’interface et de la logique de la plateforme pour aboutir à une **interface intuitive, moderne et cohérente**, avec une structure pédagogique claire et des espaces dédiés (étudiant, responsable de module, administrateur).

---

## 1. Structure pédagogique cible

| Niveau            | Description                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Module**        | Formation globale (ex. « Maintenance industrielle »).                                                                               |
| **Cours**         | Sous-ensemble d’un module (ex. « Partie 1 – Fondamentaux »). Un module contient **plusieurs cours**.                                |
| **Chapitre**      | Unité d’apprentissage = **1 vidéo + 1 description + 1 quiz**. Chaque cours contient **10 chapitres**.                               |
| **Quiz chapitre** | QCM à choix multiple (plusieurs questions, une seule bonne réponse par question). Débloqué **après** avoir vu la vidéo du chapitre. |
| **Quiz final**    | Un par module. Si l’étudiant obtient **≥ 80 %** au quiz final, il peut **télécharger un certificat**.                               |

**Modèle de données actuel (Prisma)**  
Aujourd’hui : `Module` → `Chapter` → `ChapterItem` (video | document | quiz). Il n’y a pas d’entité **Cours**.

**Choix recommandé**

- **Option A (recommandée)** : Introduire l’entité **Course** pour coller au cahier des charges.
  - `Module` → `Course[]` → `Chapter[]` (10 par cours).
  - Chaque `Chapter` : titre, description, vidéo, quiz (lien vers `Quiz`).
  - Migration Prisma : créer le modèle `Course` (moduleId, title, order), ajouter `courseId` à `Chapter`, et éventuellement simplifier en mettant `description` et `videoUrl` directement sur `Chapter` (au lieu de tout passer par `ChapterItem`).
- **Option B (sans migration)** : Garder le schéma actuel et afficher en UI des « cours » comme regroupements de chapitres (par ex. par tranches de 10 chapitres ou via un champ `sectionTitle` sur `Chapter`). Moins propre mais plus rapide.

**Recommandation** : Option A pour une plateforme professionnelle et évolutive.

---

## 2. Interface étudiant – Réorganisation complète

### 2.1 Objectifs UX

L’étudiant doit pouvoir :

- Voir **tous les modules disponibles** (catalogue).
- Entrer dans un **module**.
- Voir les **cours** du module puis les **chapitres** de chaque cours.
- Regarder les **vidéos**, lire la **description** de chaque chapitre.
- Passer les **quiz** (débloqués après la vidéo).
- Suivre sa **progression** (barre, chapitres validés / verrouillés).

### 2.2 Navigation

- **Bouton « Retour à l’accueil »** visible (header ou breadcrumb).
- **Fil d’Ariane (breadcrumb)** systématique :  
  `Accueil > [Nom du module] > [Nom du cours] > Chapitre X`.
- **Menu latéral (sidebar)** pour les chapitres :
  - Liste des cours du module (accordéon ou sections).
  - Sous chaque cours : les 10 chapitres avec indicateur (validé ✓ / en cours / verrouillé).
  - Clic sur un chapitre débloqué → page chapitre.

### 2.3 Page d’apprentissage (chapitre)

- **Vidéo** en position principale (lecteur principal).
- **Description** du chapitre sous la vidéo (texte clair, aéré).
- **Bouton « Chapitre suivant »** (ou « Passer au quiz » si le quiz est après la vidéo, selon le flow retenu).
- **Quiz** :
  - Affiché ou accessible **uniquement après** que la vidéo a été considérée comme vue (marquer l’élément comme complété côté API, ex. `POST /enrollments/:id/complete-item`).
  - Si le flow est « vidéo puis quiz dans la même page », afficher le quiz sous la description une fois la vidéo complétée.

### 2.4 Progression

- **Barre de progression** globale du module (pourcentage), visible sur la page module et éventuellement dans la sidebar.
- **Chapitres validés** : icône (ex. coche verte) ou style distinct.
- **Chapitres verrouillés** : grisés, non cliquables tant que le chapitre précédent (ou la vidéo + quiz précédent) n’est pas validé.
- Utiliser les endpoints existants : `PATCH /enrollments/:id/progression`, `POST /enrollments/:id/complete-item`, et les données retournées par `GET /formations/:id` (progression).

---

## 3. Amélioration du design (chartre et composants)

### 3.1 Problème actuel

- **Trop de bleu**, **pas assez de jaune**.
- Besoin d’une interface plus moderne, aérée, responsive.

### 3.2 Palette

- **Bleu** : couleur principale (identité, navigation, titres).
- **Jaune** : **couleur d’accent** pour :
  - Boutons d’action principaux (ex. « Commencer », « Chapitre suivant », « Passer le quiz »).
  - Éléments importants (progression, badges).
  - Notifications positives (succès, validation).
- **Blanc** : fonds de cartes, zones de contenu.
- **Gris clair** : fonds de page (ex. `gray-50`), bordures légères.

Ajuster `globals.css` et `tailwind.config.ts` pour que le jaune soit plus présent (boutons CTA, barre de progression, états de succès). Le composant `Button` a déjà une variante `accent` (jaune) : l’utiliser en priorité pour les actions principales côté étudiant.

### 3.3 Style général

- **Moderne, aéré, responsive** : inspiration type Coursera, Udemy, Notion, Linear.
- **Composants** : cartes (cards), ombres légères, espacements généreux, typographie claire (déjà Montserrat).
- **Composants UI réutilisables** : boutons, cartes, breadcrumb, barre de progression, liste de chapitres (sidebar), blocs quiz.

---

## 4. Interface responsable de module

### 4.1 Rôle

Le responsable de module peut :

- Créer un **module** (s’il a les droits ; sinon uniquement gérer les modules qui lui sont assignés).
- Créer un **cours** dans ce module.
- Créer **10 chapitres** par cours (ou un nombre fixe configurable).
- Pour chaque chapitre : **titre**, **description**, **vidéo** (URL), **quiz** (QCM).
- Créer les **quiz par chapitre** et le **quiz final** du module.

### 4.2 Création de quiz

- Interface dédiée : **ajouter une question**, **ajouter plusieurs choix**, **définir la bonne réponse**.
- Type unique : **choix multiple** (une seule bonne réponse par question).
- Aligner avec le modèle existant : `Quiz`, `QuizQuestion` (options en JSON, `correctIndex`).

### 4.3 Parcours type

- **Module Manager** : Dashboard → Liste de mes modules → Sélection d’un module → Gestion des **cours** → Pour chaque cours, gestion des **chapitres** (création / édition titre, description, vidéo, quiz).
- Pages à prévoir ou à adapter :
  - Liste des modules (ex. `/module-manager/modules`).
  - Détail module : onglets ou sections « Cours », « Chapitres », « Quiz final ».
  - Édition d’un chapitre : formulaire titre, description, URL vidéo, lien vers quiz (création / édition du quiz).
  - Création / édition de quiz : formulaire questions / réponses / bonne réponse.

Si l’entité **Course** est ajoutée, prévoir les écrans de création/édition de cours (titre, ordre).

---

## 5. Statistiques pour le responsable de module

Dashboard avec indicateurs utiles, alimentés par l’API (ou mocks en attendant) :

- **Nombre d’étudiants inscrits** au module.
- **Taux de complétion** du cours (ex. % d’enrollments avec `completedAt` non null).
- **Score moyen aux quiz** (chapitres).
- **Score moyen au quiz final** (ou note moyenne sur 20).
- **Chapitres les plus abandonnés** (où les utilisateurs s’arrêtent le plus).
- **Progression moyenne** des étudiants (ex. `progressPercent` moyen).

Présentation : **graphiques** (Recharts déjà présent), **indicateurs visuels** (KPIs), **cartes statistiques**. Réutiliser ou étendre la page actuelle `/module-manager/stats` et brancher les vrais endpoints (ex. stats agrégées à ajouter côté API si besoin).

---

## 6. Interface administrateur

### 6.1 Rôle

- **Création de comptes** : **étudiants** et **responsables de module** (avec association à un module pour le responsable).
- Utiliser les endpoints existants : `POST /users` (body avec `role`, `moduleId` si `role = module_manager`).

### 6.2 Dashboard global

- **Nombre total d’étudiants**.
- **Nombre total de modules** (et éventuellement de cours si Option A).
- **Nombre total de cours** (si Option A).
- **Taux global de complétion** (agrégation des enrollments).
- **Activité récente** sur la plateforme (dernières inscriptions, complétions, connexions — selon ce que l’API expose).

Présentation : cartes, graphiques, liste d’activité récente. Remplacer les mocks (`MOCK_USERS`, `MOCK_MODULES`) par des appels API (`GET /users`, `GET /formations`, etc.).

---

## 7. Exigences techniques

### 7.1 Code

- **Propre, modulaire, réutilisable**, bien structuré.
- **Composants UI** réutilisables (boutons, cartes, breadcrumb, progression, sidebar chapitres, formulaire quiz).
- **Séparation** claire entre logique (hooks, services API) et interface (composants, pages).
- **Composants et routes bien nommés** pour faciliter la maintenance.

### 7.2 Données et API

- **Remplacer les mocks** par des appels à l’API NestJS (`NEXT_PUBLIC_API_URL`).
- **Client API central** : instance fetch/axios avec intercepteur pour le JWT (stockage du token après `POST /auth/login`, envoi dans `Authorization: Bearer <token>`).
- **Connexion du login** : appeler `POST /auth/login`, stocker le token (et les infos utilisateur), puis rediriger selon le rôle (étudiant → `/student`, etc.).
- **Protection des routes** : vérifier le token (et le rôle) côté client ; l’API vérifie déjà le JWT et les rôles.

### 7.3 Certificat

- Règle métier : **≥ 80 % au quiz final** pour télécharger le certificat. Côté backend, la note est sur 20 (ex. 16/20 = 80 %). S’assurer que la logique de création du certificat (ex. dans `grades.controller.ts`) reflète bien ce seuil (80 % ou 16/20).

---

## 8. Ordre de mise en œuvre suggéré

1. **Design system**
   - Ajuster palette (jaune en accent), variables CSS, Tailwind.
   - Utiliser la variante `accent` du Button pour les CTA étudiants.
   - Créer ou réutiliser un composant Breadcrumb et une barre de progression réutilisable.

2. **Client API + auth**
   - Créer un client API (fetch/axios + JWT).
   - Connecter la page login à `POST /auth/login` et stocker le token.
   - Remplacer progressivement les mocks par les appels API (formations, chapitres, enrollments, quiz).

3. **Structure pédagogique**
   - Décider Option A (Course) ou B (affichage par sections).
   - Si Option A : migration Prisma + adaptation des endpoints formations/chapitres.
   - Adapter les types front (Module, Course, Chapter) en conséquence.

4. **Interface étudiant**
   - Breadcrumb + sidebar chapitres (avec états validé / verrouillé).
   - Page chapitre : vidéo, description, déblocage du quiz après vidéo, bouton « Chapitre suivant ».
   - Barre de progression et indicateurs de progression.

5. **Interface responsable de module**
   - CRUD module / cours (si Option A) / chapitres.
   - Interface de création de quiz (questions, choix, bonne réponse).
   - Dashboard statistiques (brancher les données réelles ou endpoints dédiés).

6. **Interface administrateur**
   - Création de comptes (étudiant, responsable de module).
   - Dashboard global avec indicateurs et activité récente (données API).

7. **Tests et polish**
   - Vérifier le flow complet : inscription, parcours chapitres, quiz, quiz final, certificat.
   - Responsive, accessibilité de base, messages d’erreur clairs.

---

## 9. Fichiers et dossiers à créer ou modifier (résumé)

| Domaine               | Fichiers / zones concernés                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design                | `globals.css`, `tailwind.config.ts`, `Button.tsx`, nouveau `Breadcrumb.tsx`, composant `ProgressBar`                                                                                                      |
| API client            | Nouveau `lib/api-client.ts` (ou `src/services/api.ts`), usage dans les pages                                                                                                                              |
| Auth                  | `login/page.tsx`, stockage JWT, en-tête Authorization                                                                                                                                                     |
| Étudiant              | `student/page.tsx`, `student/modules/page.tsx`, `student/modules/[id]/page.tsx`, `student/modules/[id]/chapitre/[num]/page.tsx`, `ModuleCourseSidebar`, nouvelle structure avec breadcrumb et progression |
| Responsable           | `module-manager/*` : dashboard, modules, cours/chapitres, quiz, stats                                                                                                                                     |
| Admin                 | `admin/page.tsx`, `admin/users/page.tsx`, création de comptes, dashboard global                                                                                                                           |
| Données               | Réduction de l’usage de `@/data/mock`, appels API à la place                                                                                                                                              |
| Backend (si Option A) | `schema.prisma` (Course), migrations, `formations.controller.ts`, `chapitres.controller.ts` (ou nouveau `courses.controller.ts`)                                                                          |

---

Ce plan peut servir de base pour une validation avant implémentation. Une fois validé (et les choix Option A/B et certificat 80 % confirmés), l’implémentation pourra suivre l’ordre proposé.
