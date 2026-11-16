# syntax=docker/dockerfile:1

# ───────────── Étape 1 : build Vite ─────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# '/api' = même origine que le site : Nginx relaie /api et /sanctum vers PHP-FPM
# (pas de CORS, cookies Sanctum valides)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ───────────── Étape 2 : Nginx non-root ─────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/wiem-arfaoui9/SmartDent"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
