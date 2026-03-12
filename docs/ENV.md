# Variables d'environnement — FACAM ACADEMIA

Ce document décrit la gestion des variables d'environnement par environnement (local, production) et les bonnes pratiques de sécurité. Les valeurs réelles ne doivent **jamais** être commitées : utiliser les fichiers `.env.example` comme modèles et renseigner les secrets localement ou dans les dashboards (Vercel, Railway).

---

## 1. Règles de sécurité

| Règle                               | Description                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ne jamais commiter de secrets**   | Les fichiers `.env`, `.env.local`, `.env.*.local` sont dans `.gitignore`. Seuls les `.env.example` (sans valeurs sensibles) sont versionnés. |
| **Pas de secrets dans la CI**       | Les workflows GitHub Actions n'ont pas accès aux secrets de prod. Les builds utilisent `npm ci` et les commandes publiques uniquement.       |
| **Production dans les plateformes** | En production, toutes les variables sont définies dans **Vercel** (frontend) et **Railway** (API), jamais dans le dépôt.                     |
| **Copier depuis les exemples**      | En local : `cp .env.example .env` (racine) et/ou `cp apps/web/.env.example apps/web/.env`, puis renseigner les valeurs.                      |

---

## 2. Où sont les modèles

| Fichier                                | Usage                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Racine** : `.env.example`            | Modèle pour le monorepo (API + DB + options partagées). En local, copier en `.env` à la racine si besoin.                        |
| **Frontend** : `apps/web/.env.example` | Modèle pour le frontend (Next.js). Variables exposées au client (préfixe `NEXT_PUBLIC_*`).                                       |
| **API**                                | Les variables de l’API sont décrites dans le `.env.example` à la racine (Prisma, JWT, SMTP, etc.) et dans `DEPLOYMENT.md` § 2.3. |

---

## 3. Variables par environnement

### 3.1 Local (développement)

- **Frontend** (`apps/web`) : créer `apps/web/.env` à partir de `apps/web/.env.example`.
  - `NEXT_PUBLIC_API_URL` = `http://localhost:3001` (ou l’URL de ton API locale).
- **API** : utiliser le `.env` à la racine (copie de `.env.example`) avec :
  - `DATABASE_URL`, `DIRECT_URL` : base locale ou Supabase dev.
  - `PORT=3001`, `JWT_SECRET`, et optionnellement SMTP, Supabase, Redis, Azure selon les features utilisées.

Référence complète : `.env.example` à la racine et `apps/web/.env.example`.

### 3.2 Production — Frontend (Vercel)

Configurer dans **Vercel** → **Settings** → **Environment Variables** (environnement **Production**) :

| Variable              | Obligatoire | Description                                            |
| --------------------- | ----------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Oui         | URL publique de l’API (ex. `https://xxx.railway.app`). |

Toute variable `NEXT_PUBLIC_*` est exposée au client : ne pas y mettre de secrets.

### 3.3 Production — API (Railway)

Configurer dans **Railway** → service API → **Variables** :

| Variable                                           | Obligatoire | Description                                                                        |
| -------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                                     | Oui         | URL PostgreSQL (pooler Supabase, port 6543, `?pgbouncer=true&connection_limit=1`). |
| `DIRECT_URL`                                       | Oui         | URL PostgreSQL directe (port 5432) pour les migrations Prisma.                     |
| `JWT_SECRET`                                       | Oui         | Secret JWT (min. 32 caractères, aléatoire).                                        |
| `PORT`                                             | Non         | Généralement défini par Railway.                                                   |
| `CORS_ORIGIN`                                      | Recommandé  | Origine du frontend (ex. `https://ton-app.vercel.app`).                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Si emails   | Configuration SMTP (ex. Gmail avec mot de passe d’application).                    |

Référence : `DEPLOYMENT.md` § 2.3 et `.env.example` à la racine.

### 3.4 Optionnel (tous environnements)

- **Supabase** : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (si utilisé côté API).
- **Resend** : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_LOGO_URL` (emails / OTP).
- **Upstash Redis** : `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- **Microsoft Graph / SharePoint** : `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `SHAREPOINT_SITE_URL`.

---

## 4. Vérifications rapides

- **`.gitignore`** contient bien `.env`, `.env.local`, `.env.*.local` et conserve `!.env.example`.
- Aucun fichier `.env` ou `.env.local` n’est suivi par Git (`git status` ne doit pas les afficher).
- En prod, les variables sont définies uniquement dans Vercel et Railway, avec les bonnes valeurs pour l’environnement Production.
