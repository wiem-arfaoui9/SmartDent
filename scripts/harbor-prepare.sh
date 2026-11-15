#!/bin/sh
# Prépare harbor.yml pour un usage LOCAL d'apprentissage (HTTP, sans HTTPS).
# Usage : sh scripts/harbor-prepare.sh <dossier-harbor> [port-http]
#   ex. : sh scripts/harbor-prepare.sh ~/harbor          (port 80, comme le guide)
#         sh scripts/harbor-prepare.sh ~/harbor 8082     (si le port 80 est occupé)
set -eu

dir=${1:?Usage: harbor-prepare.sh <dossier-harbor> [port-http]}
port=${2:-80}
tmpl="$dir/harbor.yml.tmpl"
out="$dir/harbor.yml"

[ -f "$tmpl" ] || { echo "ERREUR : $tmpl introuvable (décompressez d'abord l'installeur Harbor)." >&2; exit 1; }

# 1. Départ du modèle officiel
cp "$tmpl" "$out.new"

# 2. hostname -> localhost
sed -i 's/^hostname: .*/hostname: localhost/' "$out.new"

# 3. Port HTTP (le bloc http est le premier "  port: 80")
sed -i "0,/^  port: 80\$/s//  port: $port/" "$out.new"

# 4. Commenter tout le bloc https: (jusqu'à la première ligne vide)
awk '/^https:/ {blk=1} blk && /^$/ {blk=0} blk {print "# " $0; next} {print}' "$out.new" > "$out.new2"
mv "$out.new2" "$out.new"

# 5. Port différent de 80 : Harbor doit connaître son URL externe
if [ "$port" != "80" ]; then
  sed -i "s|^# external_url: .*|external_url: http://localhost:$port|" "$out.new"
fi

mv "$out.new" "$out"
echo "harbor.yml prêt : $out"
echo "  hostname = localhost, http.port = $port, https désactivé"
echo "  mot de passe admin = $(grep '^harbor_admin_password:' "$out" | cut -d' ' -f2)  (à changer hors apprentissage)"
echo "Étape suivante : cd $dir && sudo ./install.sh"
