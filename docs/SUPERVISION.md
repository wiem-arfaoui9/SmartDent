# SmartDent - Étape 5 : supervision (Uptime Kuma) et validation de bout en bout

```
modifier le code ─► push + Pull Request ─► CI (tests, build, test de démarrage) ─► images sur GHCR
                                                                                          │
   Uptime Kuma (http://localhost:3001)  ──► surveille SmartDent (http://localhost:8081) ◄─┴─ déploiement (docker compose pull / up)
```

## 1. Ce qui change par rapport au guide

| Guide | SmartDent |
|---|---|
| Application sur `localhost:3000/health` | Application déployée sur `localhost:8081`, route de santé **`/api/health`** (ajoutée dans `backend/routes/api.php`) |
| `localhost` dans Uptime Kuma | Uptime Kuma tourne **dans un conteneur** : son `localhost` est lui-même. On utilise **`host.docker.internal`** pour atteindre ta machine |
| Merge Request GitLab, push vers Harbor | Pull Request GitHub, images publiées sur GHCR |
| `pyinfra @docker/ubuntu deploy.py` | `docker compose pull` + `up -d` (ou `pyinfra @local deploy/deploy.py` depuis Ubuntu) |

`/api/health` répond `{"status":"ok","database":"up"}` (HTTP 200), ou `{"status":"degraded","database":"down"}` (HTTP 503)
si la base est injoignable. C'est plus fiable que `/up` (qui reste vert même sans base de données).

## 2. Lancer Uptime Kuma (PowerShell)

```powershell
docker run -d --name uptime-kuma --restart unless-stopped -p 3001:3001 --add-host=host.docker.internal:host-gateway -v uptime-kuma-data:/app/data louislam/uptime-kuma:1
```

Ouvre http://localhost:3001, crée le compte administrateur, puis **Add New Monitor** :

| Moniteur | Type | URL | Mot-clé | Intervalle | Retries |
|---|---|---|---|---|---|
| SmartDent - API et base | HTTP(s) - Keyword | `http://host.docker.internal:8081/api/health` | `"database":"up"` | 60 s | 2 |
| SmartDent - site web | HTTP(s) - Keyword | `http://host.docker.internal:8081/` | `id="root"` | 60 s | 2 |

Pour la démonstration, mets l'intervalle à **20 s** : le passage au rouge est alors visible en moins de 2 minutes.
Notifications (Discord, Telegram, e-mail) : *Settings > Notifications*, facultatif.

Prérequis : la stack déployée doit tourner (`docker compose -f deploy/docker-compose.deploy.yml --env-file .env up -d`, voir `docs/GHCR.md`).

## 3. Cycle complet : modifier, CI, déployer, supervision

**a) Préparer la modification** (PowerShell, dans le dépôt) :

```powershell
git checkout main
git pull origin main
git checkout -b feature/update-health
```

Ouvre `backend\routes\api.php` dans VS Code et remplace, dans la route `/health` :
`$status = 'ok';` par `$status = 'healthy';`

**b) Pousser et fusionner :**

```powershell
git add backend/routes/api.php
git commit -m "feat: update health response"
git push -u origin feature/update-health
```

Sur GitHub : **Compare & pull request**, attends les tests verts, **Merge pull request**.

**c) Observer le pipeline** : onglet *Actions*, run sur `main` (environ 3 à 4 minutes) : Backend, Frontend et Build verts.
Le test de démarrage vérifie `/api/health`, puis les images sont publiées sur GHCR.

**d) Déployer :**

```powershell
$env:REGISTRY = "ghcr.io"; $env:HARBOR_PROJECT = "wiem-arfaoui9"; $env:IMAGE_TAG = "latest"; $env:WEB_PORT = "8081"
docker compose -f deploy/docker-compose.deploy.yml --env-file .env pull
docker compose -f deploy/docker-compose.deploy.yml --env-file .env up -d --remove-orphans --wait
```

**e) Vérifier :**

```powershell
curl.exe http://localhost:8081/api/health
# {"status":"healthy","database":"up"}
```

Dans Uptime Kuma, les moniteurs restent verts (un bref passage au rouge pendant le redémarrage du backend est possible).

## 4. Observer la supervision

```powershell
docker stop smartdent-prod-frontend-1      # le moniteur "site web" passe au rouge
docker start smartdent-prod-frontend-1     # ... puis revient au vert

docker stop smartdent-prod-db-1            # "API et base" rouge (503 degraded), alors que /up reste vert
docker start smartdent-prod-db-1
```

Avec 60 s d'intervalle et 2 retries, compte environ 3 minutes avant le rouge ; avec 20 s, environ 1 minute.

## Dépannage

| Symptôme | Piste |
|---|---|
| Moniteur rouge dès le début, `ECONNREFUSED` | La stack de déploiement ne tourne pas, ou le port n'est pas 8081 |
| `getaddrinfo ENOTFOUND host.docker.internal` | Relance Uptime Kuma avec `--add-host=host.docker.internal:host-gateway` (commande ci-dessus) |
| `/api/health` renvoie 404 | L'image déployée est ancienne : refaire `pull` après la fusion du patch et le run vert sur `main` |
| `/api/health` renvoie 503 | La base est arrêtée ou ses identifiants sont faux : `docker compose ... logs db backend` |
