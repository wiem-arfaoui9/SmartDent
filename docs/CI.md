# SmartDent - Pipeline CI (Étape 3, GitHub Actions)

Fichier : `.github/workflows/ci.yml` - déclenché à **chaque push** (et sur les pull requests vers `main`).

| GitLab CI (consigne)            | GitHub Actions (ce projet)                              |
|---------------------------------|---------------------------------------------------------|
| `.gitlab-ci.yml`                | `.github/workflows/ci.yml`                              |
| GitLab Runner + Shell executor  | Runner hébergé par GitHub (`ubuntu-latest`), rien à installer |
| `stages: test, build`           | jobs de test, puis `build-images` (`needs:`)            |
| `tags: local`                   | `runs-on: ubuntu-latest`                                |
| `rules: $CI_COMMIT_BRANCH == "main"` | `if: github.ref == 'refs/heads/main'`              |
| `$CI_COMMIT_SHORT_SHA`          | `${GITHUB_SHA::7}`                                      |

## Jobs

1. **backend-checks** : `composer validate`, installation, syntaxe PHP, démarrage de Laravel (`route:list`), Pint (informatif), PHPUnit si des tests existent.
2. **frontend-checks** : `npm ci` + `npm run build`.
3. **build-images** (branche `main`) : build des images `smartdent/backend` et `smartdent/frontend` taguées avec le SHA court + `latest`, démarrage de la stack, test `/up` + login Sanctum.

## Runner local (si l'enseignante exige un runner sur ta machine)

Dépôt GitHub → Settings → Actions → Runners → New self-hosted runner, puis dans `ci.yml` remplacer
`runs-on: ubuntu-latest` par `runs-on: [self-hosted, local]` (avec le label `local` ajouté au runner).
