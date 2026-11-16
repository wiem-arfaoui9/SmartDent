# syntax=docker/dockerfile:1

# ───────────── Étape 1 : dépendances PHP (Composer) ─────────────
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress \
      --no-scripts --no-autoloader --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts

# ───────────── Étape 2 : Puppeteer (requis par Browsershot / spatie/laravel-pdf) ─────────────
# On n'installe que le module npm : le navigateur est fourni par le paquet Debian "chromium".
FROM node:20-bookworm-slim AS pdf-tools
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --prefix /opt/pdf --omit=dev --no-audit --no-fund puppeteer@23.11.1

# ───────────── Étape 3 : image d'exécution (PHP-FPM) ─────────────
FROM php:8.3-fpm-bookworm AS runtime
LABEL org.opencontainers.image.source="https://github.com/wiem-arfaoui9/SmartDent"

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql bcmath opcache

# Node.js (binaire seul) + module Puppeteer pour la génération des PDF
COPY --from=pdf-tools /usr/local/bin/node /usr/local/bin/node
COPY --from=pdf-tools /opt/pdf /opt/pdf

# Configuration PHP / PHP-FPM
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && rm -f /usr/local/etc/php-fpm.d/*
COPY docker/php-overrides.ini "$PHP_INI_DIR/conf.d/zz-smartdent.ini"
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Utilisateur non-root
RUN useradd --uid 1000 --create-home --shell /usr/sbin/nologin appuser

WORKDIR /var/www/html

# Code applicatif en lecture seule (propriétaire root)
COPY --from=vendor /app .

# Seuls storage/ et bootstrap/cache sont inscriptibles par appuser
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod 0755 /usr/local/bin/entrypoint.sh \
    && mkdir -p storage/app/public storage/framework/cache storage/framework/sessions \
                storage/framework/views storage/logs bootstrap/cache \
    && chown -R appuser:appuser storage bootstrap/cache

# Génération PDF : lus par config/laravel-pdf.php du package (aucun changement de code)
ENV LARAVEL_PDF_NODE_BINARY=/usr/local/bin/node \
    LARAVEL_PDF_CHROME_PATH=/usr/bin/chromium \
    LARAVEL_PDF_NODE_MODULES_PATH=/opt/pdf/node_modules \
    LARAVEL_PDF_TEMP_PATH=/tmp \
    LARAVEL_PDF_NO_SANDBOX=true

USER appuser
EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
