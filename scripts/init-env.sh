#!/bin/sh
# Crée .env (APP_KEY + mots de passe aléatoires) pour Docker Compose. Usage : sh scripts/init-env.sh [--force]
set -eu
root=$(cd "$(dirname "$0")/.." && pwd)
target="$root/.env"
if [ -f "$target" ] && [ "${1:-}" != "--force" ]; then
  echo ".env existe déjà : rien à faire (--force pour régénérer)."
  exit 0
fi
secret() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-28; }
key="base64:$(openssl rand -base64 32)"
sed -e "s|^APP_KEY=.*|APP_KEY=$key|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=$(secret)|" \
    -e "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$(secret)|" \
    "$root/.env.example" > "$target"
chmod 600 "$target"
echo ".env créé : $target"
