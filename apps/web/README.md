# FACAM ACADEMIA – Frontend (Next.js)

Interface web pour tous les acteurs de la plateforme : **étudiants**, **responsables de module**, **administrateurs**, **support technique**.

## Prérequis

- Node.js 20+
- Installer les dépendances **à la racine du monorepo** : `cd Code && npm install`

## Lancer l’application

```bash
# À la racine du monorepo (Code/)
npm run dev
```

Le frontend est servi par défaut sur [http://localhost:3000](http://localhost:3000).

## Structure des écrans (PRD)

### Page d’accueil (publique)

- Hero avec image (Unsplash), CTA Connexion / Inscription
- Présentation des domaines (maintenance, production, QHSE)

### Authentification

- **Login** : email / mot de passe ; redirection selon le rôle (mock en localStorage)
- **Signup** : nom, email, mot de passe, type de compte (étudiant / responsable)

Comptes démo (mot de passe : `demo123`) :

- `etudiant@facam.com` → espace étudiant
- `responsable@facam.com` → espace responsable module
- `admin@facam.com` → espace admin
- `support@facam.com` → espace support

### Étudiant

- Tableau de bord (progression, score moyen, modules en cours)
- Catalogue des modules (cartes avec image, durée, chapitres)
- Détail module → chapitres, ressources (vidéo/docs), quiz
- Écran cours (chapitre) : zone vidéo, documents, lien quiz
- Quiz interactif (QCM, vrai/faux) avec score
- Test final → résultat et lien certificat
- Page certificat (téléchargement PDF – mock)

### Responsable de module

- Dashboard : statistiques (Recharts), complétions, scores
- Modules et chapitres : liste, édition, ajout chapitres (mock CRUD)
- Quiz : création / gestion, seuils de validation
- Statistiques détaillées

### Administrateur / Responsable plateforme

- Dashboard global (utilisateurs, modules, certificats)
- Gestion des utilisateurs (liste, rôles)
- Paramètres plateforme (mock)

### Support technique

- Monitoring (état API, DB)
- Logs système (sans données sensibles)

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS** (styles uniquement, pas de CSS brut)
- **clsx** + **tailwind-merge** + **class-variance-authority** (composants UI)
- **lucide-react** (icônes)
- **Recharts** (graphiques dashboard)
- **Framer Motion** (prêt pour animations ; utilisé si besoin)
- Images : **Unsplash** (libres de droit) via `next/image`

## Fichiers clés

- `src/app/` : routes (page d’accueil, `(auth)`, `(dashboard)` par rôle)
- `src/components/ui/` : Button, Card, Input
- `src/components/layout/` : Header, Sidebar, DashboardShell
- `src/lib/utils.ts` : `cn()` pour les classes Tailwind
- `src/types/` : types partagés (User, Module, Quiz, etc.)
- `src/data/mock.ts` : données mock (remplacées par l’API backend)

## Backend

Les écrans utilisent des données mock. La connexion à l’API Nest.js (auth, modules, quiz, certificats, etc.) sera faite dans une phase ultérieure.
