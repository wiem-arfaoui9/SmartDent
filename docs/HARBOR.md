# SmartDent - Étape 4 : registre privé Harbor + déploiement pyinfra

```
git push (main) ─► GitHub Actions ─► [tests + build cloud] ─► job push-harbor (runner LOCAL)
                                                                    │ docker push
                                                                    ▼
                                      Harbor (ton PC)  ◄── docker pull ── pyinfra deploy/deploy.py ─► stack SmartDent
```

> **Pourquoi un runner local ?** Harbor tourne sur ton ordinateur (`localhost`). Les runners GitHub sont
> dans le cloud et ne peuvent pas l'atteindre. Seul le job `push-harbor` tourne sur ton runner (label `local`) ;
> les tests et le build de contrôle restent sur GitHub.

Toutes les commandes ci-dessous se tapent dans un terminal **Ubuntu (WSL2)** avec Docker Desktop
(Settings > Resources > WSL integration > activer Ubuntu). Harbor, pyinfra et le runner sont des outils Linux.
Clone le projet dans le disque Linux : `git clone https://github.com/wiem-arfaoui9/SmartDent.git ~/SmartDent`.

## 1. Installer Harbor

```bash
cd ~
wget https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz
tar xzf harbor-offline-installer-v2.11.0.tgz

# Prépare harbor.yml : hostname localhost, HTTPS désactivé, port 8082 (le port 80 est souvent occupé sous Windows)
sh ~/SmartDent/scripts/harbor-prepare.sh ~/harbor 8082
cd ~/harbor && sudo ./install.sh
```

Ouvre http://localhost:8082 - compte `admin` / `Harbor12345` (mot de passe par défaut de `harbor.yml`).
Si le port 80 est libre, utilise `harbor-prepare.sh ~/harbor` (sans port) et remplace `localhost:8082` par `localhost` partout.
Harbor demande environ 4 Go de RAM.

Dans l'interface :
1. **Projects > New Project** : nom `devops`, accès privé.
2. **devops > Robot Accounts > New Robot Account** : nom `ci`, permissions *push* et *pull* sur les repositories.
   Note le nom complet (`robot$devops+ci`) et le **secret** (affiché une seule fois). Ce compte limité remplace `admin` pour le CI.

Test : `docker login localhost:8082 -u admin`

## 2. Runner GitHub auto-hébergé (équivalent du GitLab Runner de l'étape 3)

Dépôt GitHub > **Settings > Actions > Runners > New self-hosted runner** > Linux x64. Exécute les commandes
affichées par GitHub dans WSL, mais à l'étape de configuration ajoute le label `local` :

```bash
./config.sh --url https://github.com/wiem-arfaoui9/SmartDent --token <TOKEN_AFFICHÉ_PAR_GITHUB> --labels local
./run.sh        # laisser ce terminal ouvert pendant les pushs
```

Le runner doit apparaître **Idle** dans la liste des runners. Vérifie que `docker ps` fonctionne dans ce même terminal.

## 3. Variables et secrets du dépôt

**Settings > Secrets and variables > Actions**

| Type     | Nom               | Valeur                                   |
|----------|-------------------|------------------------------------------|
| Variable | `HARBOR_REGISTRY` | `localhost:8082`                         |
| Variable | `HARBOR_PROJECT`  | `devops`                                 |
| Secret   | `HARBOR_USERNAME` | `robot$devops+ci`                        |
| Secret   | `HARBOR_PASSWORD` | le secret du robot                       |

Tant que `HARBOR_REGISTRY` n'existe pas, le job `push-harbor` est simplement ignoré. Aucun identifiant n'est écrit dans le dépôt.

## 4. Pousser les images

Fais un push sur `main` : le job **Push des images vers Harbor** construit et pousse
`localhost:8082/devops/smartdent-backend` et `smartdent-frontend` avec deux tags : le SHA court du commit (rollback) et `latest`.
Vérifie dans Harbor : **devops > Repositories**.

## 5. Déployer avec pyinfra

```bash
sudo apt install -y python3-venv python3-pip
cd ~/SmartDent
python3 -m venv ~/.venv-pyinfra && . ~/.venv-pyinfra/bin/activate
pip install -r deploy/requirements.txt

export HARBOR_REGISTRY=localhost:8082 HARBOR_USERNAME='robot$devops+ci' HARBOR_PASSWORD='<secret-du-robot>'
pyinfra @local deploy/deploy.py --yes
```

Ce que fait `deploy.py` : installe Docker s'il est absent, copie le Compose de déploiement dans `~/smartdent`,
génère `.env` (secrets aléatoires, une seule fois), se connecte à Harbor, tire les images, redémarre la stack,
puis vérifie `/up`. Application : http://localhost:8081 (port différent du développement ; projet Compose `smartdent-prod`).

Variantes : tag précis `IMAGE_TAG=ab12cd3` (rollback) ; VM distante `pyinfra 192.168.1.50 deploy/deploy.py --user ubuntu --yes`.

## Dépannage

| Symptôme | Piste |
|---|---|
| Job `push-harbor` reste *Queued* | Le runner local n'est pas lancé (`./run.sh`) ou n'a pas le label `local`. |
| Job `push-harbor` ignoré (*Skipped*) | Variable `HARBOR_REGISTRY` absente, ou ce n'est pas la branche `main`. |
| `unauthorized` au push | Mauvais secret, ou le robot n'a pas la permission *push* sur le projet. |
| `connection refused` vers localhost:8082 | Harbor arrêté : `cd ~/harbor && docker compose up -d`. |
| `pyinfra` demande « proceed ? » | Ajoute `--yes`. |
| Port 8081 déjà utilisé | `WEB_PORT=8090 pyinfra @local deploy/deploy.py --yes`. |

## Sécurité

- Identifiants dans les **secrets GitHub** (jamais dans `ci.yml`) ; `docker/login-action` les retire du runner en fin de job.
- Compte **robot** limité au projet `devops` plutôt que `admin`.
- Mot de passe Harbor passé à `docker login` par **stdin** ; `.env` de déploiement en `chmod 600`.
- HTTP sans TLS acceptable uniquement en local ; en production, activer HTTPS sur Harbor.
