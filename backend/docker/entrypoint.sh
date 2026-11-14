#!/bin/sh
# Entrypoint du backend SmartDent : prépare Laravel puis lance PHP-FPM.
set -eu

# Logs PHP-FPM : FIFO relayé vers stderr (voir php-fpm.conf)
rm -f /tmp/php-fpm.log
mkfifo /tmp/php-fpm.log
cat /tmp/php-fpm.log >&2 &

echo "[entrypoint] Découverte des packages Laravel..."
php artisan package:discover

echo "[entrypoint] Migrations de la base de données..."
tries=0
until php artisan migrate --force; do
  tries=$((tries + 1))
  if [ "$tries" -ge 10 ]; then
    echo "[entrypoint] ERREUR : migrations impossibles après $tries essais" >&2
    exit 1
  fi
  echo "[entrypoint] Base pas prête, nouvel essai dans 3 s ($tries/10)..."
  sleep 3
done

# Comptes/données de test : uniquement si demandé ET si la table users est vide
if [ "${RUN_SEED:-false}" = "true" ]; then
  # shellcheck disable=SC2016
  users=$(php -r 'require "vendor/autoload.php"; $a = require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo App\Models\User::count();' 2>/dev/null || echo 0)
  if [ "$users" = "0" ]; then
    echo "[entrypoint] Chargement des données de test (seed)..."
    php artisan db:seed --force
  else
    echo "[entrypoint] Seed ignoré : la base contient déjà $users utilisateur(s)."
  fi
fi

echo "[entrypoint] Démarrage : $*"
exec "$@"
