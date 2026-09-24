# syntax=docker/dockerfile:1
# =============================================================================
# Image Docker du portfolio, construite en deux étapes (« multi-stage ») :
#   1. build   : une image Node installe les outils et fabrique le site (dist/) ;
#   2. service : une image nginx minimale ne reçoit QUE le dossier dist/.
# L'image finale ne contient ni Node, ni node_modules, ni le code source :
# elle est légère et expose le moins de choses possible.
# =============================================================================

# --- Étape 1 : fabrication du site -------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Les dépendances d'abord : tant que package.json et package-lock.json ne
# changent pas, Docker réutilise cette étape depuis son cache (build plus rapide).
COPY package.json package-lock.json ./
RUN npm ci

# Puis le reste du projet, et le build (vérifie aussi les fiches Markdown)
COPY . .
RUN npm run build

# --- Étape 2 : service par nginx ---------------------------------------------
FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Port HTTP interne au conteneur ; le reverse proxy du homelab s'y connecte
EXPOSE 80

# Vérification de santé : Docker marque le conteneur « unhealthy » si nginx
# ne répond plus (visible avec `docker ps`)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
