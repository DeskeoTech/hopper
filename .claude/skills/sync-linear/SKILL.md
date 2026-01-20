---
name: sync-linear
description: Synchronise les stories du fichier epics.md vers Linear. Crée les Epics comme issues parentes et les Stories comme sub-issues avec les labels de scope appropriés.
disable-model-invocation: true
allowed-tools: Read, Grep, mcp__linear__create_project, mcp__linear__create_issue, mcp__linear__create_issue_label, mcp__linear__list_projects, mcp__linear__list_issue_labels, mcp__linear__list_issues, mcp__linear__update_issue
---

# Sync Stories vers Linear

Synchronise les stories du projet Hopper vers Linear.

## Paramètres

- `$ARGUMENTS` peut contenir :
  - `dry-run` : Affiche ce qui serait créé sans rien créer
  - `epic-N` : Sync uniquement l'Epic N (ex: `epic-2`)
  - `todo-only` : Sync uniquement les stories [TODO]
  - (vide) : Sync complète

## Configuration Linear

- **Team** : Deskeo
- **Projet** : Hopper (à créer si n'existe pas)

## Labels de Scope à Créer

| Label | Couleur | Description |
|-------|---------|-------------|
| `scope:app-client` | `#10B981` | Interface utilisateur client |
| `scope:back-office` | `#3B82F6` | Interface admin (Sales/OM) |
| `scope:database` | `#8B5CF6` | Schéma DB, migrations, RLS |
| `scope:api` | `#F59E0B` | Server Actions, Edge Functions |
| `scope:auth` | `#EC4899` | Authentification, sessions, rôles |
| `scope:integration` | `#06B6D4` | Airtable, Stripe, n8n webhooks |

## Étapes d'Exécution

### 1. Lire et parser epics.md

Charger le fichier `_bmad-output/planning-artifacts/epics.md` et extraire :
- Les 8 Epics avec leur titre et description
- Les 50 Stories avec :
  - Numéro (X.Y)
  - Titre
  - Statut ([DONE], [PARTIAL], [TODO])
  - Description (As a... I want... So that...)
  - Acceptance Criteria (Given/When/Then)

### 2. Vérifier/Créer les labels

1. Lister les labels existants avec `mcp__linear__list_issue_labels`
2. Pour chaque label de scope manquant, créer avec `mcp__linear__create_issue_label`

### 3. Vérifier/Créer le projet

1. Lister les projets avec `mcp__linear__list_projects`
2. Si "Hopper" n'existe pas, créer avec `mcp__linear__create_project`

### 4. Créer les Epics (issues parentes)

Pour chaque Epic (1 à 8) :
```
mcp__linear__create_issue(
  team: "Deskeo",
  project: "Hopper",
  title: "Epic X: {nom}",
  description: "{description}\n\n**FRs couverts:** {liste FRs}"
)
```

Stocker les IDs des Epics créés pour les utiliser comme `parentId`.

### 5. Créer les Stories (sub-issues)

Pour chaque Story, charger le mapping des scopes depuis [mapping.md](mapping.md), puis :

```
mcp__linear__create_issue(
  team: "Deskeo",
  project: "Hopper",
  parentId: "{epic_id}",
  title: "Story X.Y: {titre}",
  description: "## Description\n\nAs a **{role}**,\nI want **{action}**,\nSo that **{benefit}**.\n\n## Acceptance Criteria\n\n{acceptance_criteria}",
  labels: ["{scopes selon mapping}"],
  state: "{Done|In Progress|Backlog selon statut}"
)
```

### 6. Mapping des statuts

| epics.md | Linear State |
|----------|--------------|
| `[DONE]` | Done |
| `[PARTIAL]` | In Progress |
| `[TODO]` | Backlog |

### 7. Rapport final

Afficher :
- Nombre de labels créés
- Nombre d'Epics créés
- Nombre de Stories créées (par statut)
- Lien vers le projet Linear

## Fichiers de référence

- [mapping.md](mapping.md) : Mapping complet des scopes par story
