# SmartDent : projet DevOps

Application de gestion de cabinet dentaire (Laravel 11 + React/Vite + MySQL 8), industrialisée avec une chaîne DevOps complète : Git, conteneurs, CI/CD, registre d'images, déploiement automatisé et supervision.

Dépôt : https://github.com/wiem-arfaoui9/SmartDent

## Architecture

| Composant | Rôle |
|---|---|
| GitHub | Code source, branches, Pull Requests |
| GitHub Actions | Pipeline CI/CD (runner `ubuntu-latest`) |
| Docker + Docker Compose | Conteneurisation : `db` (MySQL), `backend` (Laravel / PHP-FPM), `frontend` (React + Nginx) |
| GHCR (`ghcr.io`) | Registre d'images utilisé par le pipeline |
| Harbor | Registre privé cible (job `push-harbor` sur un runner auto-hébergé `local`) |
| pyinfra (`deploy/deploy.py`) | Déploiement automatisé |
| Uptime Kuma | Supervision de disponibilité (sonde `/up`) |

```
Développeur --push--> branche feature --Pull Request--> tests CI
                                                          |
                                                   fusion dans main
                                                          |
                         build des images + test de démarrage (stack complète)
                                                          |
                              push des images vers GHCR (tags : SHA court + latest)
                                                          |
                         pyinfra / docker compose pull + up -d  --> application
                                                          |
                                         Uptime Kuma sonde /up en continu
```

## Flux du pipeline

1. Le développeur pousse sur une branche `feature/*`.
2. La Pull Request exécute les tests : Backend Laravel (syntaxe, démarrage, PHPUnit s'il y a des tests) et Frontend React (build Vite).
3. La fusion dans `main` construit les deux images, démarre toute la stack et teste `/up`, la page React et le login Sanctum.
4. Si tout est vert, les images sont publiées sur GHCR avec le SHA court du commit (retour arrière possible) et `latest`.
5. `deploy.py` (ou Compose) récupère la nouvelle image et redémarre l'application.
6. Uptime Kuma sonde `/up` en continu.

## Comment exécuter

### 1. Développement local (port 8080)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-env.ps1   # crée .env (APP_KEY + mots de passe aléatoires)
docker compose up -d --build
docker compose ps                                                  # 3 services "healthy"
```

Ouvrir http://localhost:8080 (compte de démonstration : `admin@smartdent.com` / `password`).
Arrêt : `docker compose down` (ajouter `-v` pour effacer aussi la base).

### 2. Déploiement depuis le registre (port 8081)

```powershell
$env:REGISTRY = "ghcr.io"
$env:HARBOR_PROJECT = "wiem-arfaoui9"
$env:IMAGE_TAG = "latest"
$env:WEB_PORT = "8081"
docker compose -f deploy/docker-compose.deploy.yml --env-file .env pull
docker compose -f deploy/docker-compose.deploy.yml --env-file .env up -d --remove-orphans --wait
curl.exe -fsS http://localhost:8081/up
```

Avec pyinfra (sous Ubuntu / WSL2) :

```bash
pip install -r deploy/requirements.txt
export HARBOR_REGISTRY=ghcr.io HARBOR_USERNAME=... HARBOR_PASSWORD=...
pyinfra @local deploy/deploy.py --yes
```

### 3. Harbor (registre privé local)

```bash
sh scripts/harbor-prepare.sh ~/harbor 8082
cd ~/harbor && sudo ./install.sh
```

Détails dans [docs/HARBOR.md](docs/HARBOR.md). Variante GHCR dans [docs/GHCR.md](docs/GHCR.md). Pipeline expliqué dans [docs/CI.md](docs/CI.md).

### 4. Supervision

Dans Uptime Kuma, créer une sonde HTTP sur `http://localhost:8081/up` (intervalle 30 s).

### 5. Démo en 30 secondes

```bash
./demo.sh
```

## Sécurité

- Backend et Nginx en utilisateur non-root, `cap_drop: ALL`, `no-new-privileges`, frontend en lecture seule.
- Aucun secret dans le dépôt : `.env` est ignoré par Git, les identifiants Harbor sont des secrets GitHub, GHCR utilise `GITHUB_TOKEN`.
- Base de données non publiée sur la machine hôte (réseau interne).
- Images multi-stage : ni Composer, ni Node, ni outils de build dans les images finales.

## Structure

```
.github/workflows/ci.yml        pipeline CI/CD
backend/                        Laravel + Dockerfile + entrypoint
frontend/                       React/Vite + Dockerfile + nginx.conf
docker-compose.yml              stack de développement
deploy/                         docker-compose.deploy.yml, deploy.py, requirements.txt
scripts/                        init-env, harbor-prepare
docs/                           CI.md, HARBOR.md, GHCR.md
demo.sh                         démo de la boucle complète
```
