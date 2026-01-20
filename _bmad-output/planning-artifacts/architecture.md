---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - docs/index.md
  - docs/architecture.md
  - docs/components.md
workflowType: 'architecture'
project_name: 'hopper'
user_name: 'Deskeo'
date: '2026-01-20'
context: 'brownfield'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

**Approche :** Documentation de l'architecture existante (brownfield MVP) - pas de refonte.

### Requirements Overview

**Functional Requirements (46 FRs):**

| Catégorie | Nombre | Implications architecturales |
|-----------|--------|------------------------------|
| Authentification | 3 | Magic link Supabase, vérification Airtable, routage par rôle |
| Gestion Sites | 6 | CRUD sites, photos Storage, équipements, horaires |
| Gestion Entreprises | 4 | CRUD entreprises, types (multi-users/individuelle) |
| Gestion Abonnements | 2 | Types (bench/flex), périodes, crédits associés |
| Attribution Benchs | 3 | Liaison entreprise-site-ressource |
| Gestion Utilisateurs | 6 | CRUD users, rôles, statuts, liaison entreprise |
| Réservation Client | 7 | Recherche salles, disponibilité, déduction crédits |
| Gestion Réservations Admin | 7 | Vue multi-sites, filtres, CRUD réservations |
| Crédits | 3 | Consultation/modification, niveau entreprise |
| Notifications | 1 | Email (événements à définir) |
| Webhooks | 1 | n8n (événements à définir) |
| Profil | 3 | Consultation profil, entreprise, sites nomad |

**Non-Functional Requirements:**

| NFR | Critère | Impact architectural |
|-----|---------|---------------------|
| Performance | Pages < 3s, Actions < 2s | Server Components, optimisation requêtes |
| Sécurité | Magic Link, RLS, HTTPS | Supabase Auth + Row Level Security |
| RGPD | Données UE | Stockage Supabase |
| Disponibilité intégrations | > 99% | Gestion erreurs gracieuse, retry webhooks |
| Responsive | Desktop, tablet, mobile | Breakpoints Tailwind (sm/md/lg/xl) |

### Scale & Complexity

- **Domaine principal :** Full-stack Web Application (Next.js App Router)
- **Niveau de complexité :** Moyenne
- **Contexte :** Brownfield (MVP en cours de développement)

### Technical Constraints & Dependencies

| Contrainte | Description |
|------------|-------------|
| **Compatibilité v0** | Code compatible outil v0 Vercel |
| **Stack imposée** | Next.js 16, React 19, Tailwind 4, shadcn/ui |
| **Supabase** | DB + Auth + Storage |
| **Airtable** | Source vérité collaborateurs Deskeo |
| **Stripe** | Paiements clients (intégration future) |

### Cross-Cutting Concerns

| Concern | Description |
|---------|-------------|
| **RBAC** | 5 rôles avec permissions distinctes |
| **Système de crédits** | Crédits entreprise, décompte réservations |
| **Multi-interface** | Admin + Client avec navigation distincte |
| **Scope par rôle** | Filtrage données selon rôle utilisateur |

## Stack Technique (Existante)

**Note :** Projet brownfield - stack déjà établie et en production.

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16 | Framework React avec App Router |
| React | 19 | Bibliothèque UI |
| TypeScript | 5.x | Langage de programmation |
| Tailwind CSS | 4 | Framework CSS |
| shadcn/ui | New York style | Composants UI |
| Lucide React | - | Bibliothèque d'icônes |
| React Hook Form | - | Gestion des formulaires |
| Zod | - | Validation des schémas |
| date-fns | - | Manipulation des dates |

### Backend / Services

| Service | Usage |
|---------|-------|
| Supabase | Base de données PostgreSQL + Authentification + Storage |
| Airtable | Source de vérité pour les collaborateurs Deskeo |
| Vercel | Hébergement et déploiement |
| Vercel Analytics | Suivi d'usage |

### Patterns établis

| Pattern | Description |
|---------|-------------|
| **Server Components** | Par défaut pour le rendu côté serveur |
| **Client Components** | Uniquement si interactivité requise (`"use client"`) |
| **Server Actions** | Pour toutes les mutations de données |
| **Revalidation** | `revalidatePath()` après mutations |
| **Auth Magic Link** | Supabase Auth avec OTP email |

## Décisions Architecturales

### Décisions établies (existantes)

| Domaine | Décision | Rationale |
|---------|----------|-----------|
| **Base de données** | Supabase PostgreSQL | Intégration native auth + storage + RLS |
| **Authentification** | Magic Link Supabase | Pas de mot de passe à gérer, UX simplifiée |
| **Autorisation** | RLS Supabase + vérification rôle côté app | Sécurité au niveau DB |
| **Détection admin Deskeo** | Vérification Airtable | Source de vérité collaborateurs existante |
| **Storage fichiers** | Supabase Storage (bucket `site-photos`) | Cohérence avec la stack |
| **State management** | React state local + Server Components | Simplicité, pas de state global complexe |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Design system Deskeo intégré |
| **Hosting** | Vercel | Intégration native Next.js |

### Décisions complémentaires (MVP)

| Domaine | Décision | Rationale |
|---------|----------|-----------|
| **Notifications email** | Via n8n (webhooks) | Centralisation des automatisations, flexibilité |
| **Webhooks** | URL n8n en variable d'env | Simple, configurable par environnement |
| **Stripe** | Bouton "Gérer mon abonnement" → Stripe Customer Portal | Délégation à Stripe, pas de gestion custom |
| **Migration clients** | Import Spacebring → Hopper (infos clients, pas abonnements) | Continuité service existant |
| **Abonnements legacy** | Affichage "Géré dans Spacebring" côté front | Période de transition claire |
| **Monitoring** | Différé post-MVP | Vercel Analytics suffit pour le MVP |

### Architecture des intégrations

```
┌─────────────┐     Webhook      ┌─────────────┐     Email
│   Hopper    │─────────────────>│     n8n     │─────────────────> Utilisateurs
│  (Next.js)  │                  │             │
└──────┬──────┘                  └─────────────┘
       │
       │ Supabase Client
       v
┌─────────────┐
│  Supabase   │
│ (DB + Auth) │
└─────────────┘
       │
       │ Stripe Customer Portal
       v
┌─────────────┐
│   Stripe    │ <── "Gérer mon abonnement"
└─────────────┘
```

### Migration Spacebring

| Données | Action | Notes |
|---------|--------|-------|
| Entreprises | Import dans `companies` | Mapping des champs |
| Utilisateurs | Import dans `users` | Email comme identifiant |
| Abonnements | **Non migré** | Affichage "Géré dans Spacebring" |
| Réservations historiques | À définir | Optionnel pour MVP |

