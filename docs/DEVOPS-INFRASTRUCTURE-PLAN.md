# Plan d’infrastructure DevOps — FACAM ACADEMIA

Document de **planification stricte** : chaque étape doit être **validée** avant de passer à la suivante. **Aucune modification de code** (workflows, config) tant que les étapes « Sécurité » et « Branches » ne sont pas effectives et vérifiées.

---

## Décisions retenues

| Décision               | Choix                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Nombre de branches** | **3 branches** : `dev`, `main`, `production`                                                |
| **Renommage**          | **Oui** : branche `master` renommée en `main`                                               |
| **Ordre d’exécution**  | 1) Sécuriser le code + créer les branches → **vérifier que c’est effectif** → 2) CI → 3) CD |

---

## Rôles des 3 branches

| Branche          | Rôle                                                                                                                                      | Qui pousse / merge                                   | Déploiement                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| **`dev`**        | Développement au quotidien Toutes les features et correctifs arrivent ici (directement ou via PR depuis des branches type `feature/xxx`). | Équipe dev                                           | Aucun (ou preview Vercel optionnel)                                         |
| **`main`**       | Intégration / staging. Code prêt à être livré, testé avant mise en production.                                                            | Merge depuis `dev` après revue (PR) + CI verte       | Staging (si tu configures un env staging plus tard) ou aucun au début       |
| **`production`** | Production. Code livré aux utilisateurs.                                                                                                  | Merge depuis `main` après validation (PR) + CI verte | **Vercel + Railway** (déploiement automatique uniquement sur cette branche) |

Au démarrage, ton code actuel (sur `master`) = ce qui tourne en prod. Donc après migration :

- Ce contenu sera d’abord sur `main` (après renommage de `master` → `main`).
- On créera la branche **`production`** à partir de `main` (même contenu).
- On créera la branche **`dev`** à partir de `main` (même contenu).
- Ensuite : **Vercel et Railway** seront configurés pour déployer **uniquement** depuis **`production`** (pas depuis `main` ni `dev`).

Gestion au quotidien (détail plus bas) : travail sur `dev` → PR `dev` → `main` → PR `main` → `production` → déploiement auto.

---

## Règle d’or : une étape à la fois, avec validation

- **On ne code pas** les workflows CI/CD tant que les étapes 1 et 2 ne sont pas **terminées et vérifiées**.
- Chaque étape a des **critères de validation** (checklist). Tant qu’ils ne sont pas tous cochés, on **ne passe pas** à l’étape suivante.
- Tu peux m’indiquer « Étape 1 faite, voici ce que j’ai vu » et on valide ensemble avant de détailler l’étape 2.

---

# ÉTAPE 1 — Sécuriser le code actuel

**Objectif :** Aucune perte de code. Point de restauration clair en cas de problème.

## Actions à faire (toi, sur ta machine)

1. **Vérifier l’état du dépôt**

   ```bash
   git status
   git branch -a
   git log -1 --oneline
   ```

   - Noter la branche actuelle (normalement `master`) et le dernier commit.

2. **Tout commiter et pousser sur `master`**

   ```bash
   git add -A
   git status
   ```

   - Si des fichiers sont modifiés/non suivis :  
     `git add -A && git commit -m "chore: état propre avant migration DevOps"`

   ```bash
   git push origin master
   ```

3. **Créer le tag de sauvegarde**

   ```bash
   git tag -a pre-devops-migration -m "État production avant migration branches/CI-CD"
   git push origin pre-devops-migration
   ```

4. **Vérifier sur GitHub**
   - Ouvrir le dépôt sur GitHub.
   - Onglet **Code** : la branche `master` existe, le dernier commit est bien celui que tu as poussé.
   - Onglet **Releases** ou **Tags** : le tag `pre-devops-migration` est visible (ou liste des tags si pas de Releases).

## Critères de validation (checklist) — à cocher avant de passer à l’étape 2

- [ ] `git status` est propre (rien à commiter) ou tout a été commité et poussé.
- [ ] `git push origin master` a réussi.
- [ ] Le tag `pre-devops-migration` a été poussé (`git push origin pre-devops-migration` réussi).
- [ ] Sur GitHub : la branche `master` existe et contient le dernier commit.
- [ ] Sur GitHub : le tag `pre-devops-migration` est visible.

**Quand tous les critères sont cochés** → on passe à l’**Étape 2** (création des branches). Sinon, on corrige ou on refait les commandes jusqu’à ce que ce soit le cas.

---

# ÉTAPE 2 — Création des 3 branches et renommage master → main

**Objectif :** Avoir les 3 branches (`dev`, `main`, `production`) sur le dépôt, avec le code actuel en sécurité. Branche `master` renommée en `main`.

**Prérequis :** Étape 1 validée (tag présent, code poussé sur `master`).

## Actions à faire (dans l’ordre)

### 2.1 Renommer `master` en `main` (local puis remote)

1. **En local** (tu dois être sur `master`) :

   ```bash
   git checkout master
   git branch -m master main
   ```

   - La branche locale s’appelle maintenant `main`, le contenu est inchangé.

2. **Pousser la nouvelle branche `main`** :

   ```bash
   git push origin main
   ```

3. **Sur GitHub** :
   - **Settings** du dépôt → **General** → **Default branch**.
   - Changer la branche par défaut de `master` vers **`main`** (dropdown → `main` → **Update**).
   - Sauvegarder si demandé.

4. **Supprimer l’ancienne branche distante `master`** (optionnel mais recommandé pour éviter la confusion) :
   - Vérifier une dernière fois que `main` existe sur GitHub et a le même dernier commit que l’ancien `master`.
   ```bash
   git push origin --delete master
   ```

### 2.2 Créer la branche `production`

- La production doit pointer vers le même code que `main` au départ (ton code actuel).
  ```bash
  git checkout main
  git pull origin main
  git checkout -b production
  git push -u origin production
  ```

### 2.3 Créer la branche `dev`

- Même contenu que `main` au départ.
  ```bash
  git checkout main
  git pull origin main
  git checkout -b dev
  git push -u origin dev
  ```

### 2.4 Remettre la branche par défaut du dépôt (si besoin)

- La branche par défaut doit rester **`main`** (déjà fait en 2.1). Les nouvelles PR par défaut partiront de `main` ; pour le travail quotidien, l’équipe partira de `dev`.

## Critères de validation (checklist) — à cocher avant de toucher à la CI

- [ ] La branche **`main`** existe sur GitHub et contient le même code qu’avant (dernier commit identique).
- [ ] La branche **`production`** existe sur GitHub et partage le même dernier commit que `main`.
- [ ] La branche **`dev`** existe sur GitHub et partage le même dernier commit que `main`.
- [ ] La branche par défaut du dépôt GitHub est **`main`**.
- [ ] (Si tu as supprimé `master`) La branche **`master`** n’existe plus sur le remote.
- [ ] En local : `git branch -a` affiche au minimum `main`, `production`, `dev` (et plus `master` si supprimé).

**Quand tous les critères sont cochés** → la création des branches est **effective** et le code est **en sécurité**. On peut alors **passer à la CI** (Étape 3), puis à la CD (Étape 4). On ne modifie aucun fichier CI/CD avant d’avoir validé cette étape.

---

# ÉTAPE 3 — CI (à faire uniquement après validation de l’étape 2)

**Objectif :** Pipeline CI (lint, format, tests, build) sur les PR et push vers `dev`, `main`, `production` ; blocage des merges si la CI échoue (via protection des branches).

**Contenu détaillé (fichiers, règles de protection) sera rédigé uniquement quand l’étape 2 sera validée.** À ce stade, on se limite à confirmer que c’est l’étape suivante après les branches.

---

# ÉTAPE 4 — CD (à faire après que la CI soit en place et validée)

**Objectif :** Déploiement automatique Vercel + Railway **uniquement** depuis la branche **`production`**.

**Contenu détaillé (config Vercel, Railway, workflows) sera rédigé après validation de l’étape 3.**

---

# Étapes suivantes (après CI et CD)

- **Étape 5 — Sécurité et stabilité** : variables d’environnement, rollback, bonnes pratiques.
- **Étape 6 — Structure et qualité** : dossiers, scripts npm, ESLint/Prettier, migrations Prisma.

On les détaillera une fois la CI et la CD opérationnelles.

---

# Gestion des 3 branches au cours du développement

Pour t’aider à gérer les branches au quotidien (sans coder maintenant, juste le cadre) :

| Situation                          | Branche(s) concernée(s) | Action                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nouvelle feature / correctif**   | `dev`                   | Créer une branche depuis `dev` (ex. `feature/nom-feature` ou `fix/nom-fix`). Développer, commiter, pousser. Ouvrir une **PR vers `dev`**. Après revue et CI verte → merger dans `dev`.                                                                                                                                       |
| **Livraison vers l’intégration**   | `dev` → `main`          | Ouvrir une **PR de `dev` vers `main`**. Après revue et CI verte → merger. `main` est à jour avec ce qui est prêt pour la prod.                                                                                                                                                                                               |
| **Mise en production**             | `main` → `production`   | Ouvrir une **PR de `main` vers `production`**. Après validation (et CI verte) → merger. Le merge dans `production` déclenche le déploiement automatique (Vercel + Railway).                                                                                                                                                  |
| **Correction d’urgence en prod**   | `production`            | Option 1 : faire la correction sur une branche issue de `production` (ex. `hotfix/xxx`), PR vers `production`, merger. Ensuite merger `production` → `main` puis `main` → `dev` pour resynchroniser. Option 2 : faire la correction sur `dev`, PR dev→main puis main→production (si le flux normal est acceptable en délai). |
| **Synchroniser `dev` avec `main`** | `main` → `dev`          | Régulièrement (ou après merge main→production), mettre à jour `dev` depuis `main` : `git checkout dev && git merge main` (ou PR main→dev selon ta préférence).                                                                                                                                                               |

Résumé du flux normal :

1. Travail sur **`dev`** (ou branches → PR → `dev`).
2. Quand c’est prêt : **PR `dev` → `main`** → merge.
3. Quand tu veux déployer : **PR `main` → `production`** → merge → déploiement auto.

Tu pourras t’appuyer sur ce tableau (et sur un futur `docs/GIT-WORKFLOW.md`) pour gérer les branches ; on pourra l’enrichir au fil du projet.

---

# Récapitulatif de l’ordre à respecter

1. **Étape 1** — Sécuriser le code (tag, push). **Valider** avec la checklist.
2. **Étape 2** — Créer les 3 branches, renommer `master` → `main`. **Valider** avec la checklist.
3. **Étape 3** — CI (détail et mise en œuvre **après** validation de l’étape 2).
4. **Étape 4** — CD (détail et mise en œuvre **après** validation de l’étape 3).
5. Puis sécurité, structure, documentation.

**Prochaine action pour toi :** exécuter l’**Étape 1** (commandes ci-dessus), vérifier les critères de validation, puis me confirmer que c’est fait (ou me dire où tu bloques). Ensuite on valide ensemble et on passe à l’**Étape 2** (création des branches), sans toucher au code CI/CD avant que les branches soient effectives et validées.
