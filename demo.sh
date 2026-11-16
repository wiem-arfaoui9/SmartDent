#!/bin/bash
# Démo : boucle complète en 30 secondes (à lancer depuis la racine du dépôt SmartDent)
set -e

BRANCH="demo-$(date +%s)"

echo "1. Modification du code (fichier de démo, aucun impact fonctionnel)..."
mkdir -p docs
echo "Démo du $(date '+%Y-%m-%d %H:%M:%S')" >> docs/demo-log.md

echo "2. Commit et push sur une branche..."
git checkout -b "$BRANCH"
git add docs/demo-log.md
git commit -m "demo: mise à jour du journal de démo"
git push -u origin HEAD

echo "3. Ouvrir la Pull Request (les tests CI démarrent) :"
echo "   https://github.com/wiem-arfaoui9/SmartDent/compare/main...$BRANCH?expand=1"

echo "4. Après fusion dans main : onglet Actions, build + push GHCR."
echo "   Puis déploiement : pyinfra @local deploy/deploy.py --yes"
