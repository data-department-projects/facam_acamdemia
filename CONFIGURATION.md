# Configuration et dépannage

## Connexion backend ↔ Supabase (PostgreSQL)

Le backend utilise **Prisma** avec la variable d’environnement **`DATABASE_URL`** (et **`DIRECT_URL`** pour les migrations). Dès que ces variables pointent vers votre projet Supabase, le backend est bien connecté à votre base.

### Vérifier que la base répond

Une fois l’API démarrée, appelez :

```http
GET https://votre-api.example.com/health/db
```

- Réponse **`{ "database": "ok" }`** → la connexion à Supabase fonctionne.
- Réponse **`{ "database": "error", "error": "..." }`** → vérifiez `DATABASE_URL` et le réseau (pare-feu, IP autorisées dans Supabase).

### Tables dans Supabase (SQL Editor)

Les tables sont créées par **Prisma** (migrations). En PostgreSQL, les noms de tables peuvent être sensibles à la casse.

- Le modèle Prisma **`User`** correspond en général à la table **`"User"`** (avec un U majuscule).
- Dans l’éditeur SQL Supabase, pour lister les utilisateurs, utilisez par exemple :

  ```sql
  SELECT * FROM "User";
  ```

  (avec des **guillemets doubles** autour de `User`). Sans guillemets, PostgreSQL peut interpréter le nom différemment.

Pour voir toutes les tables du schéma public :

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Après modification du schéma Prisma

Si vous modifiez `apps/api/prisma/schema.prisma` (nouveaux modèles, champs, etc.) :

1. **Générer le client** : à la racine du monorepo ou dans `apps/api`, exécutez  
   `npx prisma generate`  
   (met à jour le client TypeScript dans `node_modules/.prisma/client`).
2. **Appliquer les migrations** :  
   `npx prisma migrate dev --name nom_de_la_migration`  
   depuis `apps/api` pour créer et appliquer la migration sur la base.

En cas d’erreur **EPERM** sur Windows lors de `prisma generate`, fermez les processus qui utilisent les fichiers du projet (IDE, autre terminal) puis réessayez.

---

## Réinitialisation du mot de passe — Erreur 535 (Gmail)

L’erreur :

```text
Invalid login: 535-5.7.8 Username and Password not accepted.
https://support.google.com/mail/?p=BadCredentials
```

signifie que **Gmail refuse les identifiants SMTP** utilisés par l’application. Ce n’est **pas** un problème de base de données ni de Supabase.

### Cause

Gmail n’accepte plus un mot de passe “normal” pour les applications. Il faut utiliser un **mot de passe d’application** (App Password).

### Solution

1. Activez la **validation en 2 étapes** sur votre compte Google (si ce n’est pas déjà fait).
2. Allez dans [Compte Google → Sécurité → Mots de passe des applications](https://myaccount.google.com/apppasswords).
3. Créez un **mot de passe d’application** pour “Mail” (ou “Autre”).
4. Utilisez ce mot de passe (16 caractères) dans **`SMTP_PASS`** dans votre `.env` ou dans les variables d’environnement Railway :
   - `SMTP_USER` = votre adresse Gmail
   - `SMTP_PASS` = le mot de passe d’application (sans espaces)
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`

Si l’erreur 535 persiste :

- **Mot de passe sans espaces** : Google affiche le mot de passe en 4 blocs (ex. `swlx rrqb wekk xf`). Collez-le **sans espaces** dans `SMTP_PASS` (ex. `swlxrrqbwekkxf`). Le backend enlève désormais les espaces automatiquement, mais vérifiez quand même.
- **Fichier `.env` au bon endroit** : l’API NestJS charge le `.env` depuis le **répertoire de l’API**. Si vous lancez l’API depuis `Code/apps/api`, le fichier lu est **`Code/apps/api/.env`** (et non `Code/.env`). Copiez vos variables SMTP dans `apps/api/.env` puis redémarrez l’API.
- **Pas de guillemets** : écrivez `SMTP_PASS=swlxrrqjbwekkxf` et non `SMTP_PASS="swlxrrqjbwekkxf"`.
- **En production (Railway)** : les variables doivent être définies dans le tableau de bord Railway (Variables), pas dans un fichier sur votre machine.

---

## Récapitulatif

| Élément              | Vérification / action                                         |
| -------------------- | ------------------------------------------------------------- |
| Backend ↔ Supabase   | `GET /health/db` → `{ "database": "ok" }`                     |
| Tables (ex. User)    | Dans Supabase : `SELECT * FROM "User";` (avec guillemets)     |
| Envoi d’emails (OTP) | Erreur 535 → utiliser un **mot de passe d’application** Gmail |
