# Configuration Vercel – FACAM ACADEMIA

## Erreur « Cannot find module 'tailwindcss' »

Cette erreur apparaît quand la **commande de build** relance `npm ci` une deuxième fois. Le second `npm ci` réorganise les `node_modules` et Next.js ne trouve plus `tailwindcss`.

## À faire dans le Dashboard Vercel (obligatoire)

1. Ouvre ton **projet** sur [Vercel](https://vercel.com/dashboard).
2. Va dans **Settings** → **Build & Development Settings**.
3. **Build Command** :
   - Soit tu **laisses vide** pour utiliser le `vercel.json` du repo (recommandé).
   - Soit tu mets exactement :  
     `npm run vercel-build`  
     ou :  
     `npx turbo run build --filter=web`
4. **Ne mets surtout pas** :  
   `npm ci && npx turbo run build --filter=web`  
   (le `npm ci` en trop casse le build.)
5. **Root Directory** : laisse **vide** (racine du dépôt).
6. Clique sur **Save**, puis **Redeploy** le dernier déploiement.

Après ça, le build doit passer. Si tu as encore une commande de build personnalisée avec `npm ci &&`, supprime le `npm ci &&` et garde uniquement la partie build.
