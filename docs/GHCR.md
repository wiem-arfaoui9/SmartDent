# SmartDent - Étape 4 (variante GHCR) : registre GitHub à la place de Harbor

Même principe que Harbor (registre privé, tags par commit, déploiement automatisé), mais le registre est **GitHub Container
Registry (`ghcr.io`)**. Les images sont publiées depuis les serveurs de GitHub : pas de runner local, pas de téléchargement
lourd, aucun secret à créer (le `GITHUB_TOKEN` suffit).

```
push main ─► GitHub Actions ─► tests ─► build + démarrage de la stack ─► (si OK) docker push ghcr.io/<utilisateur>/smartdent-*
                                                                                         │
                                                              docker compose pull / up  ◄┘  (PowerShell, WSL ou VM via pyinfra)
```

## 1. Publier les images

Fusionne la branche dans `main` : le job **Build images Docker + test de démarrage** publie, après le test réussi,
`ghcr.io/wiem-arfaoui9/smartdent-backend` et `smartdent-frontend` avec deux tags : le SHA court du commit (rollback) et `latest`.
Vérifie sur GitHub : page du dépôt > colonne de droite **Packages**.

## 2. Rendre les paquets accessibles

Un paquet est **privé** par défaut. Deux choix :

- **Simple (recommandé pour la démo)** : GitHub > ton profil > **Packages** > `smartdent-backend` > **Package settings** >
  *Change visibility* > **Public**. Idem pour `smartdent-frontend`. Plus besoin de se connecter pour tirer les images.
- **Privé** : crée un jeton (GitHub > Settings > Developer settings > Personal access tokens > *Tokens (classic)*) avec la
  permission `read:packages`, puis `docker login ghcr.io -u wiem-arfaoui9` et colle le jeton comme mot de passe.

## 3. Déployer

### A. Depuis PowerShell (sans Ubuntu)

```powershell
cd C:\chemin\vers\SmartDent
powershell -ExecutionPolicy Bypass -File .\scripts\init-env.ps1     # crée .env (secrets aléatoires), une seule fois

$env:REGISTRY = "ghcr.io"
$env:HARBOR_PROJECT = "wiem-arfaoui9"       # = ton nom d'utilisateur GitHub, en minuscules
$env:IMAGE_TAG = "latest"                   # ou un SHA court pour revenir à une version précise
$env:WEB_PORT = "8081"                      # le .env contient 8080, déjà pris par ta stack de développement

docker compose -f deploy/docker-compose.deploy.yml --env-file .env pull
docker compose -f deploy/docker-compose.deploy.yml --env-file .env up -d --remove-orphans --wait
curl.exe -fsS http://localhost:8081/up
```

Application : http://localhost:8081 (projet Compose `smartdent-prod`, séparé du développement sur le port 8080).
Arrêt : `docker compose -f deploy/docker-compose.deploy.yml --env-file .env down`.

### B. Avec pyinfra (Ubuntu/WSL ou VM)

```bash
export HARBOR_REGISTRY=ghcr.io HARBOR_PROJECT=wiem-arfaoui9 IMAGE_TAG=latest
# paquets privés seulement :
# export HARBOR_USERNAME=wiem-arfaoui9 HARBOR_PASSWORD='<jeton read:packages>'
pyinfra @local deploy/deploy.py --yes
```

(Les variables s'appellent `HARBOR_*` car `deploy.py` sert aux deux registres ; avec GHCR elles désignent simplement le registre et le projet.)

## Dépannage

| Symptôme | Piste |
|---|---|
| Étape *Pousser les images vers GHCR* : `denied` / `permission_denied` | Settings du dépôt > Actions > General > *Workflow permissions* : autorise *Read and write permissions*, puis relance le job. |
| `pull access denied` au déploiement | Paquet privé : rends-le public (§2) ou fais `docker login ghcr.io`. |
| `manifest unknown` | Le job de publication n'a pas encore tourné sur `main`, ou le tag demandé n'existe pas (voir l'onglet Packages). |
| Port 8081 déjà utilisé | Choisis un autre port : `$env:WEB_PORT = "8090"` avant le `docker compose`. |

## Harbor ou GHCR ?

Les deux peuvent coexister : le job `push-harbor` reste ignoré tant que la variable `HARBOR_REGISTRY` n'est pas définie.
GHCR est le choix le plus simple (rien à installer) ; Harbor apporte un registre auto-hébergé avec scan d'images et comptes robots.
