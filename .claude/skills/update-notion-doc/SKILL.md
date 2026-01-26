---
name: update-notion-doc
description: Met à jour la documentation Notion du projet Hopper. Utiliser après avoir ajouté ou modifié des pages, des fonctionnalités ou la stack technique.
allowed-tools: Glob, Grep, Read, Task, mcp__notion__notion-fetch, mcp__notion__notion-update-page
---

# Mise à jour de la documentation Notion Hopper

## Contexte

- **Page Notion cible** : `2ee643a0940480e4b4a8c7abc0804048` (App Hopper)
- **Sections existantes** :
  - Documentation Technique (stack, dossiers, routes, modèle de données, auth, commandes)
  - Documentation Fonctionnelle (page par page)

## Tâche

Analyser le code actuel et mettre à jour la documentation Notion.

### Étape 1 : Analyser les changements

1. Lister les routes dans `app/` avec `Glob` pattern `app/**/page.tsx`
2. Vérifier les types dans `lib/types/database.ts`
3. Identifier les nouveaux composants dans `components/`

### Étape 2 : Récupérer la doc existante

\`\`\`
mcp__notion__notion-fetch avec id: 2ee643a0940480e4b4a8c7abc0804048
\`\`\`

### Étape 3 : Comparer et identifier les mises à jour

Vérifier pour chaque section :

**Documentation Technique :**
- Présentation du projet → Stack technique changée ?
- Structure des dossiers → Nouveaux dossiers ?
- Routes principales → Nouvelles routes ?
- Modèle de données → Nouvelles tables/champs ?
- Authentification → Changements dans le flux ?
- Commandes utiles → Nouvelles commandes npm ?

**Documentation Fonctionnelle :**
- Nouvelles pages à documenter ?
- Fonctionnalités modifiées sur les pages existantes ?
- Nouveaux filtres, formulaires ou actions ?

### Étape 4 : Mettre à jour Notion

Utiliser `mcp__notion__notion-update-page` avec :
- `command: "insert_content_after"` pour ajouter du contenu
- `command: "replace_content_range"` pour modifier une section existante

Format des toggles Notion :
\`\`\`
▶ **Titre de la section**
	Contenu indenté avec tab
	- Liste à puces
	**Sous-titre en gras**
\`\`\`

### Étape 5 : Rapport final

Résumer :
- ✅ Sections mises à jour
- ➕ Sections ajoutées
- ⏭️ Sections inchangées

Fournir le lien : https://www.notion.so/2ee643a0940480e4b4a8c7abc0804048
