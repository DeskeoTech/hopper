---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
status: complete
completedAt: 2026-01-20
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/project-context.md
  - docs/index.md
  - docs/components.md
documentCounts:
  prd: 1
  architecture: 1
  epics: 1
  projectContext: 1
  projectDocs: 2
  designSystem: 1
projectContext:
  name: hopper
  type: brownfield
  domain: "PropTech / Gestion espaces coworking"
  stack: "Next.js 16, React 19, Tailwind CSS 4, shadcn/ui"
designSystemProvided: true
---

# UX Design Specification Hopper

**Author:** Deskeo
**Date:** 2026-01-20

---

## Executive Summary

### Project Vision

Hopper est l'application de gestion d'espaces de coworking de Deskeo. Elle propose deux interfaces :

- **Interface Admin** : pour Sales Deskeo et Office Managers (gestion sites, clients, abonnements, réservations)
- **Interface Client** : pour entreprises et freelances (réservation salles, consultation crédits)

L'objectif UX est de créer une expérience simple, efficace et visuellement alignée avec l'identité Deskeo.

### Target Users

| Rôle | Profil | Besoin Principal |
|------|--------|------------------|
| Sales Deskeo | Commercial, gère tout le portefeuille | Administration fluide et rapide |
| Office Manager | Gère son site | Vue locale, gestion réservations |
| Admin Entreprise | Dirigeant/Manager | Gérer son équipe, voir les crédits |
| Utilisateur Client | Collaborateur | Réserver des salles rapidement |
| Freelance Flex/Nomade | Indépendant | Réserver simplement |

### Key Design Challenges

1. **Cohérence visuelle** entre les deux interfaces (Admin/Client)
2. **Gestion des permissions** transparente et sans friction
3. **Réservation minimaliste** : rapide et intuitive
4. **Responsive** : mobile-first pour clients, desktop-first pour admin

### Design Opportunities

1. **Parcours de réservation ultra-simple** (3 clics max)
2. **Dashboard admin actionnable** (pas juste consultatif)
3. **Identité Deskeo distinctive** : minimalisme, beige/noir, radius 20px

## Core User Experience

### Defining Experience

**Hopper utilise des patterns UX déjà établis :**

- **Client** : Page d'accueil avec cards informationnelles, réservation via modal multi-étapes
- **Admin** : Sidebar + pages de détail avec tabs, édition par modales contextuelles

L'objectif est de conserver ces patterns et les étendre aux nouvelles fonctionnalités.

### Platform Strategy

| Interface | Stratégie | Pattern Existant |
|-----------|-----------|------------------|
| Client | Mobile-first | Layout centré max-w-3xl, cards responsives |
| Admin | Desktop-first | Sidebar 64px + grilles lg:grid-cols-3 |
| Global | Web responsive | Tailwind breakpoints (sm/md/lg) |

### Existing UI Patterns (À Réutiliser)

| Pattern | Composant | Usage |
|---------|-----------|-------|
| Modal multi-étapes | `BookMeetingRoomModal` | Workflows client (réservation) |
| Modal d'édition inline | `Edit*Modal` | Édition admin par section |
| Tabs | `DetailsTabs` | Pages de détail (Info/Réservations) |
| Cards info | `*Card` | Affichage données structurées |
| SearchableSelect | `SearchableSelect` | Tous les filtres dropdown |
| Grille planning | `RoomPlanningGrid` | Vue calendrier des salles |

### Critical Success Moments

1. **Réservation client** : Flow existant en 3 étapes (planning → slots → confirm) ✅
2. **Édition admin** : Modales contextuelles par section ✅
3. **Recherche/filtrage** : SearchableSelect avec recherche temps réel ✅

### Experience Principles

1. **Réutiliser l'existant** — Étendre les patterns actuels, pas en créer de nouveaux
2. **Modales pour les actions** — Édition et workflows dans des Dialog/AlertDialog
3. **Tabs pour les vues** — DetailsTabs pour séparer Info/Réservations/Historique
4. **Responsive cohérent** — Utiliser les breakpoints établis (sm/md/lg)

## Desired Emotional Response

### Primary Emotional Goals

| Émotion | Description |
|---------|-------------|
| **Confiance** | L'utilisateur sait que sa réservation est confirmée, ses crédits sont à jour |
| **Efficacité** | Les tâches sont accomplies rapidement, sans friction |
| **Contrôle** | Visibilité permanente sur les crédits, options, statuts |

### Design Implications

- **Feedback immédiat** : Toast après chaque action (sonner)
- **États clairs** : Badges de statut visibles (StatusBadge, BookingStatusBadge)
- **Erreurs aidantes** : Messages actionnables, pas de blocage sec
- **Ton professionnel** : Design sobre Deskeo, messages en français

## Design System Reference

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg-background` | #F0E8DC | Fond principal |
| `text-foreground` | #1B1918 | Texte, icônes, bordures |
| `bg-card` | #D9D0C4 | Surfaces secondaires |

### Typographie

| Token | Font | Usage |
|-------|------|-------|
| `font-header` | ProgramNarOT-Black | Titres (uppercase) |
| `font-body` | Articulat CF | Texte courant |
| `font-editorial` | GT Alpina Italic | Accents (rare) |

### Composants

- **Radius** : 20px par défaut (`rounded-lg`)
- **Boutons** : Primary (noir/beige), Secondary (outline)
- **Contraintes** : Pas d'ombres, pas de gradients
