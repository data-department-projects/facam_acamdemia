# Dockerfile pour déployer l’API (NestJS) sur Railway.
# Une seule copie du code, build dans l’image, pas de second COPY qui écrase dist.

FROM node:22-alpine
WORKDIR /app

# Dépendances système éventuelles (Prisma peut en avoir besoin)
RUN apk add --no-cache openssl

# Tout le monorepo (sans node_modules, .next, dist, .git grâce à .dockerignore)
COPY . .

# Installer les dépendances puis builder uniquement l’API
RUN npm ci
RUN npx turbo run build --filter=api

# Script de démarrage : migrations Prisma puis node
RUN chmod +x apps/api/scripts/start-production.sh

ENV NODE_ENV=production

# Railway définit PORT ; l’API écoute sur process.env.PORT
# Le script applique prisma migrate deploy puis lance l’API
CMD ["sh", "apps/api/scripts/start-production.sh"]
