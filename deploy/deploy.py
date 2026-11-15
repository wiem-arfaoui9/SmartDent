"""
SmartDent - Étape 4 : déploiement avec pyinfra.

Récupère les dernières images depuis Harbor et (re)démarre la stack SmartDent.

Exemples (depuis la racine du dépôt, dans WSL/Linux) :
    export HARBOR_REGISTRY=localhost HARBOR_USERNAME=admin HARBOR_PASSWORD='...'
    pyinfra @local deploy/deploy.py                      # sur cette machine
    pyinfra 192.168.1.50 deploy/deploy.py --user ubuntu  # sur une VM en SSH

Variables d'environnement (lues sur la machine qui lance pyinfra) :
    HARBOR_REGISTRY   adresse du registre              (défaut : localhost)
    HARBOR_PROJECT    projet Harbor                    (défaut : devops)
    HARBOR_USERNAME   compte Harbor (robot conseillé)  (optionnel si projet public)
    HARBOR_PASSWORD   mot de passe / secret du robot   (optionnel si projet public)
    IMAGE_TAG         tag à déployer                   (défaut : latest)
    WEB_PORT          port HTTP de l'application       (défaut : 8081)
    DEPLOY_DIR        dossier sur la cible             (défaut : ~/smartdent)
"""

import os
import sys
from pathlib import Path

from pyinfra import host
from pyinfra.facts.server import Home, Which
from pyinfra.operations import apt, files, server

REGISTRY = os.environ.get("HARBOR_REGISTRY", "localhost")
PROJECT = os.environ.get("HARBOR_PROJECT", "devops")
IMAGE_TAG = os.environ.get("IMAGE_TAG", "latest")
WEB_PORT = os.environ.get("WEB_PORT", "8081")
USERNAME = os.environ.get("HARBOR_USERNAME", "")
PASSWORD = os.environ.get("HARBOR_PASSWORD", "")
DEPLOY_DIR = os.environ.get("DEPLOY_DIR") or f"{host.get_fact(Home)}/smartdent"

COMPOSE = f"cd {DEPLOY_DIR} && docker compose"

# Chemins locaux absolus : fonctionnent quel que soit le dossier d'où l'on lance pyinfra
HERE = Path(sys._getframe().f_code.co_filename).resolve().parent  # .../deploy
ROOT = HERE.parent                                                  # racine du dépôt

# 1. Docker : installé seulement s'il est absent (inutile avec Docker Desktop / WSL)
if not host.get_fact(Which, command="docker"):
    apt.packages(
        name="Installer Docker et Compose",
        packages=["docker.io", "docker-compose-v2"],
        update=True,
        _sudo=True,
    )

# 2. Fichiers de déploiement
files.directory(
    name="Créer le dossier de déploiement",
    path=f"{DEPLOY_DIR}/scripts",
)
files.put(
    name="Copier docker-compose (images Harbor)",
    src=str(HERE / "docker-compose.deploy.yml"),
    dest=f"{DEPLOY_DIR}/docker-compose.yml",
)
files.put(
    name="Copier .env.example",
    src=str(ROOT / ".env.example"),
    dest=f"{DEPLOY_DIR}/.env.example",
)
files.put(
    name="Copier le générateur de secrets",
    src=str(ROOT / "scripts" / "init-env.sh"),
    dest=f"{DEPLOY_DIR}/scripts/init-env.sh",
    mode="755",
)

# 3. Configuration (.env) : secrets générés UNE fois, jamais écrasés
SET_ENV = (
    'set_env() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; '
    'else echo "$1=$2" >> .env; fi; }'
)
server.shell(
    name="Générer .env (si absent) et y écrire les réglages de déploiement",
    commands=[
        f"cd {DEPLOY_DIR} && ( [ -f .env ] || sh scripts/init-env.sh )",
        f"cd {DEPLOY_DIR} && {SET_ENV} && "
        f"set_env REGISTRY {REGISTRY} && set_env HARBOR_PROJECT {PROJECT} && "
        f"set_env IMAGE_TAG {IMAGE_TAG} && set_env WEB_PORT {WEB_PORT} && chmod 600 .env",
    ],
)

# 4. Connexion à Harbor (mot de passe lu sur stdin, jamais écrit dans un fichier du projet)
if USERNAME and PASSWORD:
    server.shell(
        name="Connexion à Harbor",
        commands=[
            f'echo "$HARBOR_PASSWORD" | docker login {REGISTRY} '
            '-u "$HARBOR_USERNAME" --password-stdin',
        ],
        _env={"HARBOR_USERNAME": USERNAME, "HARBOR_PASSWORD": PASSWORD},
    )

# 5. Récupérer les images puis redémarrer
server.shell(
    name=f"Pull des images {REGISTRY}/{PROJECT}/smartdent-*:{IMAGE_TAG}",
    commands=[f"{COMPOSE} pull"],
)
server.shell(
    name="Redémarrer la stack (attend les healthchecks)",
    commands=[f"{COMPOSE} up -d --remove-orphans --wait --wait-timeout 300"],
)

# 6. Vérification et nettoyage
server.shell(
    name="Vérifier que l'application répond",
    commands=[f"curl -fsS -o /dev/null http://localhost:{WEB_PORT}/up && echo 'SmartDent OK sur le port {WEB_PORT}'"],
)
server.shell(
    name="Supprimer les anciennes images inutilisées",
    commands=["docker image prune -f"],
)
