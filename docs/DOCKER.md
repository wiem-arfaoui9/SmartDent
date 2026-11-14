# SmartDent - Conteneurisation (Étape 2)

## Architecture

```
Navigateur ──► frontend (Nginx :8080, non-root)
                 ├─ /            → application React (fichiers statiques)
                 └─ /api /sanctum /up → FastCGI ──► backend (PHP-FPM :9000, non-root)
                                                      └──► db (MySQL 8, réseau interne)
```

| Service  | Image                         | Rôle                                      | Persistance |
|----------|-------------------------------|-------------------------------------------|-------------|
| frontend | nginx-unprivileged (build Vite) | Sert React, relaie l'API vers PHP-FPM   | -           |
| backend  | php:8.3-fpm + Chromium + Node | Laravel 11, génération PDF (Browsershot)  | `storagedata` (PDF) |
| db       | mysql:8.0                     | Base de données                           | `dbdata`    |

Le navigateur n'appelle qu'**une seule origine** (`/api` sur le port Nginx) : pas de CORS et cookies Sanctum valides.

## Démarrage

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-env.ps1   # crée .env (secrets aléatoires)
docker compose up -d --build
docker compose ps                                                  # 3 services "healthy"
```

Application : http://localhost:8080 - comptes de test : `admin@smartdent.com` / `password` (si `RUN_SEED=true`).

## Commandes utiles

```powershell
docker compose logs -f backend      # logs Laravel + PHP-FPM
docker compose exec backend php artisan about
docker compose down                 # arrête (données conservées)
docker compose down -v              # arrête ET supprime base + PDF
```

## Sécurité

- Backend et frontend tournent en **non-root** (`appuser` uid 1000, `nginx` uid 101).
- Code applicatif en lecture seule ; seuls `storage/` et `bootstrap/cache` sont inscriptibles.
- Secrets dans `.env` (ignoré par Git) ; aucun secret dans les images (`.dockerignore`).
- `cap_drop: ALL`, `no-new-privileges`, frontend en système de fichiers `read_only`.
- La base n'est **pas publiée** sur l'hôte et vit sur un réseau interne.

## Points d'attention

- `php artisan config:cache` n'est volontairement pas utilisé : `ResumeIaController` lit `env('ANTHROPIC_API_KEY')` directement.
- PDF : Chromium est lancé avec `--no-sandbox` (`LARAVEL_PDF_NO_SANDBOX=true`), usage normal en conteneur non-root.
