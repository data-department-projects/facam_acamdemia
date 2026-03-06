# API FACAM ACADEMIA – Endpoints

Documentation des routes (préfixe par défaut : `http://localhost:3001`).  
Les routes protégées nécessitent l’en-tête : `Authorization: Bearer <accessToken>`.

---

## Santé

| Méthode | Route     | Description    |
| ------- | --------- | -------------- |
| GET     | `/health` | Santé de l’API |

---

## Auth (`/auth`)

| Méthode | Route         | Auth | Description                                                                         |
| ------- | ------------- | ---- | ----------------------------------------------------------------------------------- |
| POST    | `/auth/login` | Non  | Connexion (email, password). Retourne `accessToken` + `user` (dont `firstLoginAt`). |
| GET     | `/auth/me`    | JWT  | Profil courant (dont `firstLoginAt`).                                               |
| GET     | `/auth/test`  | Non  | Smoke test du module.                                                               |

---

## Users (`/users`) – Admin

| Méthode | Route         | Rôles                   | Description                                                                                                 |
| ------- | ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| POST    | `/users`      | admin, platform_manager | Créer un utilisateur (étudiant ou responsable de module ; `moduleId` obligatoire si role = module_manager). |
| GET     | `/users`      | admin, platform_manager | Liste paginée (query : `page`, `limit`, `role`).                                                            |
| GET     | `/users/:id`  | admin, platform_manager | Détail d’un utilisateur.                                                                                    |
| PATCH   | `/users/:id`  | admin, platform_manager | Mise à jour (fullName, avatarUrl).                                                                          |
| DELETE  | `/users/:id`  | admin, platform_manager | Suppression.                                                                                                |
| GET     | `/users/test` | admin, platform_manager | Smoke test.                                                                                                 |

---

## Formations (`/formations`) – Modules de formation

| Méthode | Route              | Auth                                 | Description                                                                              |
| ------- | ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| POST    | `/formations`      | Admin                                | Créer un module.                                                                         |
| GET     | `/formations`      | JWT                                  | Liste des modules (étudiant : ses inscriptions ; admin : tous). Query : `page`, `limit`. |
| GET     | `/formations/:id`  | JWT                                  | Détail d’un module (chapitres, progression si étudiant).                                 |
| PATCH   | `/formations/:id`  | JWT (admin ou responsable du module) | Mise à jour.                                                                             |
| DELETE  | `/formations/:id`  | JWT (admin ou responsable)           | Suppression.                                                                             |
| GET     | `/formations/test` | Non                                  | Smoke test.                                                                              |

---

## Chapitres (`/chapitres`)

| Méthode | Route                         | Rôles                 | Description                                          |
| ------- | ----------------------------- | --------------------- | ---------------------------------------------------- |
| POST    | `/chapitres`                  | admin, module_manager | Créer un chapitre (moduleId, title, order).          |
| POST    | `/chapitres/items`            | admin, module_manager | Créer un élément (vidéo, document, quiz).            |
| GET     | `/chapitres/module/:moduleId` | JWT                   | Liste des chapitres du module (étudiant si inscrit). |
| GET     | `/chapitres/:id`              | JWT                   | Détail d’un chapitre.                                |
| GET     | `/chapitres/test`             | JWT                   | Smoke test.                                          |

---

## Enrollments (`/enrollments`) – Inscriptions

| Méthode | Route                            | Rôles | Description                                                 |
| ------- | -------------------------------- | ----- | ----------------------------------------------------------- |
| POST    | `/enrollments`                   | admin | Inscrire un étudiant à un module (userId, moduleId).        |
| GET     | `/enrollments`                   | JWT   | Mes inscriptions (ou query `userId` pour admin).            |
| GET     | `/enrollments/:id`               | JWT   | Détail d’une inscription.                                   |
| PATCH   | `/enrollments/:id/progression`   | JWT   | Mettre à jour lastViewedChapterId / lastViewedItemId.       |
| POST    | `/enrollments/:id/complete-item` | JWT   | Marquer un élément comme complété (body : `chapterItemId`). |
| GET     | `/enrollments/test`              | JWT   | Smoke test.                                                 |

---

## Quiz (`/quiz`)

| Méthode | Route                | Auth                      | Description                                                                                                                               |
| ------- | -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/quiz/:id`          | JWT                       | Détail d’un quiz (questions sans correctIndex pour l’étudiant).                                                                           |
| POST    | `/quiz/:id/submit`   | JWT                       | Soumettre une tentative (body : `answers` [index], optionnel `enrollmentId` pour quiz final). Retourne score % et passed (quiz chapitre). |
| GET     | `/quiz/:id/attempts` | JWT (responsable / admin) | Liste des tentatives (quiz final) pour correction.                                                                                        |
| GET     | `/quiz/test`         | JWT                       | Smoke test.                                                                                                                               |

---

## Grades (`/grades`) – Notes quiz final

| Méthode | Route                        | Rôles                 | Description                                                                                        |
| ------- | ---------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| POST    | `/grades/attempt/:attemptId` | admin, module_manager | Attribuer une note sur 20 (body : `gradeOver20`, optionnel `comment`). Crée le certificat si ≥ 10. |
| GET     | `/grades/test`               | admin, module_manager | Smoke test.                                                                                        |

---

## Certificates (`/certificates`)

| Méthode | Route                                    | Auth | Description                                |
| ------- | ---------------------------------------- | ---- | ------------------------------------------ |
| GET     | `/certificates/enrollment/:enrollmentId` | JWT  | Données du certificat pour génération PDF. |
| GET     | `/certificates/my`                       | JWT  | Liste de mes certificats.                  |
| GET     | `/certificates/test`                     | JWT  | Smoke test.                                |

---

## Reviews (`/reviews`) – Avis

| Méthode | Route                       | Auth | Description                                               |
| ------- | --------------------------- | ---- | --------------------------------------------------------- |
| GET     | `/reviews/module/:moduleId` | Non  | Liste des avis d’un module.                               |
| POST    | `/reviews/module/:moduleId` | JWT  | Créer un avis (body : `rating` 1–5, optionnel `comment`). |
| GET     | `/reviews/test`             | Non  | Smoke test.                                               |

---

## Discussions (`/discussions`)

| Méthode | Route                           | Auth | Description                                                             |
| ------- | ------------------------------- | ---- | ----------------------------------------------------------------------- |
| GET     | `/discussions/module/:moduleId` | Non  | Liste des questions/réponses d’un module.                               |
| POST    | `/discussions/module/:moduleId` | JWT  | Créer une question ou réponse (body : `content`, optionnel `parentId`). |
| GET     | `/discussions/test`             | Non  | Smoke test.                                                             |

---

## Variables d’environnement

- `DATABASE_URL` : connexion PostgreSQL (Prisma).
- `JWT_SECRET` : clé pour signer les tokens (défaut : `cle-secret-facam-dev`).
- `JWT_EXPIRES_IN` : expiration du token (défaut : `7d`).
- `PORT` : port du serveur (défaut : 3001).
- `CORS_ORIGIN` : origine(s) CORS (défaut : `true` = toute origine).
