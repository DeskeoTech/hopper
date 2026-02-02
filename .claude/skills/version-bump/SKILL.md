---
name: version-bump
description: Incrémente automatiquement la version de l'app en analysant les commits de la PR. Utilise le versioning sémantique (patch/minor/major) basé sur les conventional commits.
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(npm version:*), Bash(git add:*), Bash(git commit:*), Read, Grep
---

# Version Bump Automatique

Incrémente la version de l'application de manière intelligente en analysant les commits de la branche courante.

## Paramètres

- `$ARGUMENTS` peut contenir :
  - `dry-run` : Affiche le type de bump sans modifier les fichiers
  - `patch` / `minor` / `major` : Force un type de bump spécifique
  - (vide) : Analyse automatique des commits

## Versioning Sémantique

Le skill suit les conventions de [Semantic Versioning](https://semver.org/):

| Type | Format | Quand l'utiliser |
|------|--------|------------------|
| `major` | X.0.0 | Breaking changes, changements incompatibles |
| `minor` | 0.X.0 | Nouvelles fonctionnalités, ajouts compatibles |
| `patch` | 0.0.X | Corrections de bugs, refactoring mineur |

## Règles d'Analyse des Commits

Le skill analyse les messages de commit selon les [Conventional Commits](https://www.conventionalcommits.org/):

### → MAJOR (breaking change)
- Message contient `BREAKING CHANGE:` dans le corps
- Message contient `!` après le type (ex: `feat!:`, `fix!:`)

### → MINOR (nouvelle fonctionnalité)
- `feat:` ou `feat(scope):` - Nouvelle fonctionnalité
- `feature:` - Alias pour feat

### → PATCH (corrections)
- `fix:` - Correction de bug
- `refactor:` - Refactoring sans changement de comportement
- `perf:` - Amélioration de performance
- `style:` - Changements de style/formatage
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance
- `build:` - Changements de build
- `ci:` - Changements CI/CD

## Étapes d'Exécution

### 1. Identifier la branche de base

```bash
# Trouver la branche main/master
git rev-parse --verify main 2>/dev/null || git rev-parse --verify master
```

### 2. Récupérer les commits de la PR

```bash
# Lister les commits depuis la divergence avec main
git log main..HEAD --oneline --no-merges
```

### 3. Analyser les messages de commit

Pour chaque commit, déterminer le type de changement :

1. Chercher `BREAKING CHANGE:` ou `!:` → **major**
2. Chercher `feat:` ou `feature:` → **minor**
3. Sinon → **patch**

**Le type le plus élevé gagne** : si un seul commit est `major`, le bump sera major.

### 4. Afficher le résultat de l'analyse

```
📊 Analyse des commits (X commits depuis main)

Commits analysés :
  • abc1234 feat: ajouter nouvelle fonctionnalité → minor
  • def5678 fix: corriger bug d'affichage → patch
  • ghi9012 refactor: nettoyer le code → patch

Résultat : MINOR (la plus haute priorité trouvée)
Version actuelle : 0.1.3
Nouvelle version : 0.2.0
```

### 5. Appliquer le bump (si pas dry-run)

```bash
# Incrémenter la version
npm version {type} --no-git-tag-version

# Committer le changement
git add package.json package-lock.json
git commit -m "chore: bump to v{new_version}"
```

### 6. Rapport final

```
✅ Version mise à jour : 0.1.3 → 0.2.0

Prochaines étapes :
1. Vérifier les changements : git diff HEAD~1
2. Pousser la branche : git push
3. Créer la PR : gh pr create
```

## Cas Particuliers

### Aucun commit trouvé
Si la branche n'a pas de commits par rapport à main :
```
⚠️ Aucun commit trouvé depuis main.
Rien à faire.
```

### Messages non conventionnels
Si aucun commit ne suit les conventional commits :
```
⚠️ Aucun commit avec préfixe reconnu.
Bump par défaut : patch
```

### Force override
Si l'utilisateur spécifie `$ARGUMENTS` = `major|minor|patch`, utiliser ce type sans analyse.

## Fichiers Modifiés

- `package.json` : Champ `version` mis à jour
- `package-lock.json` : Synchronisé automatiquement par npm
