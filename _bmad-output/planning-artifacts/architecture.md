---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
status: 'complete'
completedAt: '2026-01-20'
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

## Implementation Patterns & Consistency Rules

### Points de Conflit Identifiés

**5 catégories critiques** où les agents AI pourraient faire des choix divergents ont été analysées et standardisées.

### Naming Patterns

#### Base de données (Supabase PostgreSQL)

| Élément | Convention | Exemples |
|---------|------------|----------|
| Tables | snake_case pluriel | `sites`, `resources`, `bookings`, `site_photos` |
| Colonnes | snake_case | `site_id`, `created_at`, `start_date` |
| Clés étrangères | `{table_singulier}_id` | `site_id`, `user_id`, `company_id` |
| Types enum | snake_case | `"meeting_room"`, `"flex_desk"` |
| Timestamps | `created_at`, `updated_at` | Toujours présents |

#### Code TypeScript

| Élément | Convention | Exemples |
|---------|------------|----------|
| Fichiers composants | kebab-case.tsx | `site-card.tsx`, `booking-status-badge.tsx` |
| Noms composants | PascalCase | `SiteCard`, `BookingStatusBadge` |
| Interfaces/Types | PascalCase | `Site`, `BookingWithDetails`, `UserRole` |
| Variables | camelCase | `siteId`, `photoUrls`, `isLoading` |
| Fonctions | camelCase verbe+nom | `getSiteById`, `updateBooking` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE` |

#### Dossiers

| Élément | Convention | Exemples |
|---------|------------|----------|
| Dossiers composants | kebab-case | `site-edit/`, `company-edit/` |
| Dossiers routes | kebab-case | `admin/`, `auth/` |
| Groupes de fichiers | Par domaine | `components/admin/`, `lib/actions/` |

### Structure Patterns

#### Organisation Projet

```
app/
  (routes)/           # Routes App Router
    admin/            # Routes admin protégées
    auth/             # Callback authentification
    login/            # Page connexion
  layout.tsx          # Layout racine
  page.tsx            # Page d'accueil

components/
  admin/              # Composants interface admin
    {feature}/        # Sous-dossiers par feature
  client/             # Composants interface client
  ui/                 # Composants shadcn/ui

lib/
  actions/            # Server Actions par domaine
    sites.ts
    bookings.ts
    users.ts
    companies.ts
  supabase/           # Clients Supabase
    server.ts         # Client serveur
    client.ts         # Client navigateur
  types/              # Types TypeScript
    database.ts       # Types DB centralisés
  utils.ts            # Utilitaires (cn, etc.)
```

#### Placement des fichiers

| Type | Emplacement |
|------|-------------|
| Server Actions | `lib/actions/{domaine}.ts` |
| Types DB | `lib/types/database.ts` |
| Composants UI génériques | `components/ui/` |
| Composants métier | `components/{admin\|client}/` |
| Loading states | `app/**/loading.tsx` co-localisé |

### Format Patterns

#### Retours Server Actions

**Mutations (create, update, delete) :**
```typescript
// Succès
return { success: true }

// Échec
return { error: "Message d'erreur en français" }

// Avec données retournées
return { success: true, bookingId: booking.id }
```

**Queries (get, list) :**
```typescript
// Toujours retourner un tableau même vide
return { rooms: [], error?: string }
return { bookings: data || [] }
```

#### Formats de données

| Donnée | Format |
|--------|--------|
| Dates JSON | ISO 8601 string (`"2026-01-20T10:00:00Z"`) |
| IDs | UUID string |
| Booléens | `true` / `false` |
| Valeurs nullables | `null` (pas `undefined` en DB) |

### Communication Patterns

#### Notifications Toast (Sonner)

**Configuration :**
```typescript
// app/layout.tsx
import { Toaster } from "sonner"
<Toaster position="top-right" richColors />
```

**Usage :**
```typescript
import { toast } from "sonner"

// Après server action
const result = await updateSite(siteId, data)
if (result.error) {
  toast.error(result.error)
} else {
  toast.success("Site mis à jour")
}
```

| Situation | Méthode | Exemple |
|-----------|---------|---------|
| Succès mutation | `toast.success()` | `"Réservation confirmée"` |
| Erreur serveur | `toast.error()` | `result.error` |
| Validation form | Inline | React Hook Form + Zod |

#### Revalidation

```typescript
// Après mutation réussie
revalidatePath(`/admin/sites/${siteId}`)
revalidatePath("/")  // Si impact global
```

### Process Patterns

#### Loading States

**Pattern Suspense Next.js :**
```typescript
// app/admin/sites/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted" />
    </div>
  )
}
```

- Pas de `isLoading` state local pour le chargement initial
- Suspense boundaries via fichiers `loading.tsx`
- `animate-pulse` pour les squelettes

#### Error Handling

| Niveau | Pattern |
|--------|---------|
| 404 | `notFound()` de Next.js |
| Erreur DB | Retour `{ error: message }` + toast |
| Validation | Zod + React Hook Form inline |
| Erreur critique | Error boundary (à implémenter) |

**Messages d'erreur :** Toujours en français, orientés utilisateur.

### Enforcement Guidelines

**Tous les agents AI DOIVENT :**

1. Utiliser les conventions de nommage snake_case pour la DB, camelCase/PascalCase pour le code
2. Placer les server actions dans `lib/actions/{domaine}.ts`
3. Retourner `{ error }` ou `{ success }` des server actions
4. Utiliser `toast.success/error` pour le feedback utilisateur (pas alert)
5. Utiliser les fichiers `loading.tsx` pour les états de chargement
6. Écrire les messages utilisateur en français
7. Centraliser les types DB dans `lib/types/database.ts`

**Anti-patterns à éviter :**

- ❌ Créer des dossiers `api/` pour les routes API (utiliser Server Actions)
- ❌ Utiliser `useState` pour les loading states initiaux
- ❌ Mélanger snake_case et camelCase dans le même contexte
- ❌ Retourner `undefined` au lieu de `null` pour les valeurs DB
- ❌ Créer des fichiers de types par composant

## Project Structure & Boundaries

### Structure Complète du Projet

```
hopper/
├── README.md
├── CLAUDE.md                     # Instructions pour Claude Code
├── package.json
├── package-lock.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── proxy.ts                      # Middleware auth (protection routes)
├── .env.local                    # Variables d'environnement (non commité)
├── .env.example                  # Template variables d'environnement
├── .gitignore
│
├── app/                          # Next.js App Router
│   ├── globals.css               # Styles globaux + Tailwind
│   ├── layout.tsx                # Layout racine (+ Toaster Sonner)
│   ├── page.tsx                  # Page d'accueil (redirection selon rôle)
│   ├── not-found.tsx             # Page 404 globale
│   │
│   ├── login/
│   │   └── page.tsx              # Page connexion magic link
│   │
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts          # Callback Supabase auth
│   │   └── error/
│   │       └── page.tsx          # Page erreur auth
│   │
│   └── admin/                    # Routes admin protégées
│       ├── layout.tsx            # Layout admin (sidebar, header)
│       ├── page.tsx              # Dashboard admin
│       ├── loading.tsx           # Loading skeleton
│       │
│       ├── sites/
│       │   ├── page.tsx          # Liste des sites
│       │   ├── loading.tsx
│       │   └── [id]/
│       │       ├── page.tsx      # Détail site (info + réservations)
│       │       └── not-found.tsx
│       │
│       ├── clients/
│       │   ├── page.tsx          # Liste entreprises
│       │   └── [id]/
│       │       └── page.tsx      # Détail entreprise
│       │
│       ├── reservations/
│       │   └── page.tsx          # Vue réservations globale
│       │
│       └── dashboard/
│           └── page.tsx          # Dashboard statistiques
│
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── searchable-select.tsx # Select avec recherche
│   │   ├── calendar.tsx
│   │   ├── date-range-picker.tsx
│   │   └── ...
│   │
│   ├── admin/                    # Composants interface admin
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── navigation-items.tsx
│   │   │
│   │   ├── site-card.tsx
│   │   ├── resource-card.tsx
│   │   ├── company-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── equipment-badge.tsx
│   │   ├── details-tabs.tsx
│   │   ├── companies-table.tsx
│   │   ├── company-search.tsx
│   │   │
│   │   ├── site-edit/            # Modales édition site
│   │   │   ├── edit-header-modal.tsx
│   │   │   ├── edit-hours-modal.tsx
│   │   │   ├── edit-wifi-modal.tsx
│   │   │   ├── edit-equipments-modal.tsx
│   │   │   ├── edit-instructions-modal.tsx
│   │   │   └── site-photo-gallery.tsx
│   │   │
│   │   ├── company-edit/         # Modales édition entreprise
│   │   │   ├── edit-header-modal.tsx
│   │   │   ├── edit-contact-modal.tsx
│   │   │   ├── edit-subscription-modal.tsx
│   │   │   ├── edit-user-modal.tsx
│   │   │   ├── add-user-modal.tsx
│   │   │   ├── user-card.tsx
│   │   │   └── users-list.tsx
│   │   │
│   │   ├── reservations/         # Composants réservations
│   │   │   ├── reservations-section.tsx
│   │   │   ├── reservations-section-client.tsx
│   │   │   ├── reservations-filters.tsx
│   │   │   ├── reservations-calendar.tsx
│   │   │   ├── calendar-week-view.tsx
│   │   │   ├── calendar-month-view.tsx
│   │   │   ├── calendar-list-view.tsx
│   │   │   ├── booking-card.tsx
│   │   │   ├── booking-status-badge.tsx
│   │   │   └── view-toggle.tsx
│   │   │
│   │   └── sites/
│   │       └── sites-search.tsx
│   │
│   ├── client/                   # Composants interface client
│   │   ├── client-home-page.tsx
│   │   ├── user-profile-card.tsx
│   │   ├── user-credits-card.tsx
│   │   ├── user-plan-card.tsx
│   │   ├── user-bookings-section.tsx
│   │   ├── user-booking-card.tsx
│   │   ├── meeting-room-card.tsx
│   │   ├── book-meeting-room-modal.tsx
│   │   ├── time-slot-picker.tsx
│   │   ├── room-planning-grid.tsx
│   │   └── admin-access-button.tsx
│   │
│   ├── login-form.tsx
│   ├── user-bar.tsx
│   └── theme-provider.tsx
│
├── lib/
│   ├── utils.ts                  # Utilitaires (cn, etc.)
│   ├── navigation.ts             # Config navigation
│   │
│   ├── types/
│   │   └── database.ts           # Types TypeScript centralisés
│   │
│   ├── supabase/
│   │   ├── server.ts             # Client Supabase serveur
│   │   └── client.ts             # Client Supabase navigateur
│   │
│   ├── airtable/
│   │   └── authorized-emails.ts  # Vérification collaborateurs Deskeo
│   │
│   └── actions/                  # Server Actions
│       ├── auth.ts               # Actions authentification
│       ├── sites.ts              # Actions gestion sites
│       ├── companies.ts          # Actions gestion entreprises
│       ├── users.ts              # Actions gestion utilisateurs
│       └── bookings.ts           # Actions réservations
│
├── public/
│   └── (assets statiques)
│
└── docs/                         # Documentation projet
    ├── index.md
    ├── architecture.md
    └── components.md
```

### Boundaries Architecturaux

#### API Boundaries

| Boundary | Description |
|----------|-------------|
| **Server Actions** | Point d'entrée unique pour les mutations (pas de routes API) |
| **Supabase Client** | Accès DB via `createClient()` (serveur ou client) |
| **Airtable** | Vérification collaborateurs Deskeo uniquement à la connexion |
| **Webhooks n8n** | Notifications sortantes (événements à définir) |

#### Component Boundaries

| Couche | Responsabilité | Communication |
|--------|----------------|---------------|
| **Pages (app/)** | Routing, data fetching, layout | Server Components par défaut |
| **Composants (components/)** | UI, interactions | Props + Server Actions |
| **Actions (lib/actions/)** | Mutations, logique métier | Retour `{success}` ou `{error}` |
| **Types (lib/types/)** | Contrats de données | Import centralisé |

#### Data Boundaries

| Couche | Accès |
|--------|-------|
| **Server Components** | Lecture directe Supabase |
| **Client Components** | Via Server Actions uniquement |
| **Storage** | Bucket `site-photos` via Supabase Storage |

### Mapping Requirements → Structure

#### FR Authentification (FR-AUTH-*)

| Requirement | Fichiers |
|-------------|----------|
| Magic Link | `app/login/page.tsx`, `lib/actions/auth.ts` |
| Callback auth | `app/auth/callback/route.ts` |
| Vérification Airtable | `lib/airtable/authorized-emails.ts` |
| Protection routes | `proxy.ts` (middleware) |

#### FR Gestion Sites (FR-SITE-*)

| Requirement | Fichiers |
|-------------|----------|
| Liste sites | `app/admin/sites/page.tsx`, `components/admin/site-card.tsx` |
| Détail site | `app/admin/sites/[id]/page.tsx` |
| CRUD sites | `lib/actions/sites.ts` |
| Photos | `components/admin/site-edit/site-photo-gallery.tsx` |
| Édition | `components/admin/site-edit/*.tsx` |

#### FR Gestion Entreprises (FR-COMPANY-*)

| Requirement | Fichiers |
|-------------|----------|
| Liste entreprises | `app/admin/clients/page.tsx`, `components/admin/companies-table.tsx` |
| Détail entreprise | `app/admin/clients/[id]/page.tsx` |
| CRUD entreprises | `lib/actions/companies.ts` |
| Édition | `components/admin/company-edit/*.tsx` |

#### FR Gestion Utilisateurs (FR-USER-*)

| Requirement | Fichiers |
|-------------|----------|
| Liste utilisateurs | `components/admin/company-edit/users-list.tsx` |
| CRUD utilisateurs | `lib/actions/users.ts` |
| Modales | `components/admin/company-edit/add-user-modal.tsx`, `edit-user-modal.tsx` |

#### FR Réservations (FR-BOOKING-*)

| Requirement | Fichiers |
|-------------|----------|
| Vue calendrier | `components/admin/reservations/reservations-calendar.tsx` |
| Filtres | `components/admin/reservations/reservations-filters.tsx` |
| CRUD réservations | `lib/actions/bookings.ts` |
| Réservation client | `components/client/book-meeting-room-modal.tsx` |

#### FR Interface Client (FR-CLIENT-*)

| Requirement | Fichiers |
|-------------|----------|
| Page d'accueil | `app/page.tsx`, `components/client/client-home-page.tsx` |
| Profil | `components/client/user-profile-card.tsx` |
| Crédits | `components/client/user-credits-card.tsx` |
| Forfait | `components/client/user-plan-card.tsx` |
| Réservations | `components/client/user-bookings-section.tsx` |

### Points d'Intégration

#### Communication Interne

```
┌─────────────────────────────────────────────────────────────┐
│                        App Router                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Server      │    │ Client      │    │ Loading     │     │
│  │ Components  │───▶│ Components  │    │ States      │     │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘     │
│         │                  │                                 │
│         │ Props            │ Server Actions                  │
│         ▼                  ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  lib/actions/                        │   │
│  │   sites.ts │ companies.ts │ users.ts │ bookings.ts  │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         │ Supabase Client                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Supabase                          │   │
│  │        PostgreSQL │ Auth │ Storage                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Intégrations Externes

| Service | Point d'intégration | Direction |
|---------|---------------------|-----------|
| **Supabase Auth** | `lib/supabase/server.ts` | Bidirectionnel |
| **Supabase Storage** | `lib/actions/sites.ts` (photos) | Upload/Download |
| **Airtable** | `lib/airtable/authorized-emails.ts` | Lecture seule |
| **n8n Webhooks** | Server Actions (à implémenter) | Sortant |
| **Stripe** | Bouton externe Customer Portal | Redirection |

### Règles d'Extension

**Pour ajouter une nouvelle fonctionnalité :**

1. **Types** → Ajouter dans `lib/types/database.ts`
2. **Actions** → Créer/étendre dans `lib/actions/{domaine}.ts`
3. **Page** → Créer dans `app/admin/{feature}/page.tsx`
4. **Composants** → Créer dans `components/admin/{feature}/`
5. **Loading** → Ajouter `loading.tsx` co-localisé si nécessaire

**Pour ajouter une intégration externe :**

1. **Client** → Créer dans `lib/{service}/`
2. **Types** → Définir dans `lib/types/`
3. **Actions** → Utiliser le client dans les server actions
4. **Variables d'env** → Documenter dans `.env.example`

## Architecture Validation Results

### Coherence Validation ✅

**Compatibilité Décisions :**
Toutes les technologies choisies (Next.js 16, React 19, Supabase, Tailwind 4, shadcn/ui) sont mutuellement compatibles et forment une stack cohérente pour une application full-stack moderne.

**Cohérence Patterns :**
Les patterns d'implémentation (Server Components par défaut, Server Actions pour mutations, retours `{success}`/`{error}`) sont alignés avec les conventions Next.js et permettent une implémentation cohérente.

**Alignement Structure :**
La structure projet reflète fidèlement les décisions architecturales avec une séparation claire entre pages, composants, actions et types.

### Requirements Coverage Validation ✅

**Couverture Fonctionnelle :**
- 44/46 FRs ont un support architectural complet
- 2 FRs (notifications, webhooks) ont l'architecture définie mais nécessitent implémentation

**Couverture Non-Fonctionnelle :**
- Performance : Server Components + Suspense
- Sécurité : RLS Supabase + middleware auth
- RGPD : Hébergement UE Supabase
- Responsive : Tailwind breakpoints

### Implementation Readiness Validation ✅

**Décisions Complètes :**
- Stack technique entièrement spécifiée avec versions
- Patterns de nommage exhaustifs (DB, code, fichiers)
- Formats de données standardisés

**Structure Complète :**
- Arborescence projet détaillée
- Mapping requirements → fichiers
- Points d'intégration documentés

**Patterns Complets :**
- Naming conventions pour tous les contextes
- Retours Server Actions standardisés
- Gestion erreurs et loading states

### Gap Analysis Results

| Gap | Priorité | Résolution |
|-----|----------|------------|
| Installation Sonner | Haute | Ajouter au premier sprint |
| Webhooks n8n | Moyenne | Implémenter avec stories dédiées |
| Stratégie tests | Basse | Définir post-MVP |

### Architecture Completeness Checklist

**✅ Analyse Requirements**
- [x] Contexte projet analysé (brownfield MVP)
- [x] Complexité évaluée (moyenne)
- [x] Contraintes techniques identifiées (v0, stack imposée)
- [x] Concerns transversaux mappés (RBAC, crédits, multi-interface)

**✅ Décisions Architecturales**
- [x] Décisions critiques documentées
- [x] Stack technique spécifiée
- [x] Patterns d'intégration définis
- [x] Considérations performance adressées

**✅ Patterns Implémentation**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de process documentés

**✅ Structure Projet**
- [x] Structure répertoires complète
- [x] Boundaries composants établis
- [x] Points d'intégration mappés
- [x] Mapping requirements → structure complet

### Architecture Readiness Assessment

**Statut Global :** PRÊT POUR IMPLÉMENTATION

**Niveau de Confiance :** ÉLEVÉ

**Points Forts :**
- Stack moderne et cohérente
- Patterns clairs et documentés
- Structure existante validée
- Couverture requirements complète

**Améliorations Futures :**
- Stratégie de tests à définir
- Monitoring avancé post-MVP
- Error boundaries pour robustesse

### Implementation Handoff

**Directives pour Agents AI :**

1. Suivre toutes les décisions architecturales exactement comme documentées
2. Utiliser les patterns d'implémentation de manière cohérente
3. Respecter la structure projet et les boundaries
4. Référencer ce document pour toutes questions architecturales

**Première Priorité :**
1. Installer et configurer Sonner pour les toasts
2. Poursuivre l'implémentation des stories selon le PRD

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow :** COMPLETED ✅
**Étapes Complétées :** 8
**Date :** 2026-01-20
**Document :** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Document Architecture Complet**

- Toutes les décisions architecturales documentées avec versions spécifiques
- Patterns d'implémentation garantissant la cohérence des agents AI
- Structure projet complète avec tous les fichiers et répertoires
- Mapping requirements → architecture
- Validation confirmant cohérence et complétude

**🏗️ Fondation Prête pour Implémentation**

- 15+ décisions architecturales prises
- 7 catégories de patterns d'implémentation définis
- 6 domaines de composants architecturaux spécifiés
- 46 requirements fonctionnels supportés

**📚 Guide d'Implémentation pour Agents AI**

- Stack technique avec versions vérifiées
- Règles de cohérence prévenant les conflits d'implémentation
- Structure projet avec boundaries clairs
- Patterns d'intégration et standards de communication

### Quality Assurance Checklist

**✅ Cohérence Architecture**

- [x] Toutes les décisions fonctionnent ensemble sans conflits
- [x] Choix technologiques compatibles
- [x] Patterns supportent les décisions architecturales
- [x] Structure alignée avec tous les choix

**✅ Couverture Requirements**

- [x] Tous les requirements fonctionnels supportés
- [x] Tous les requirements non-fonctionnels adressés
- [x] Concerns transversaux gérés
- [x] Points d'intégration définis

**✅ Préparation Implémentation**

- [x] Décisions spécifiques et actionnables
- [x] Patterns prévenant les conflits entre agents
- [x] Structure complète et non-ambiguë
- [x] Exemples fournis pour clarté

---

**Architecture Status :** PRÊT POUR IMPLÉMENTATION ✅

**Phase Suivante :** Commencer l'implémentation en utilisant les décisions et patterns documentés.

**Maintenance Document :** Mettre à jour cette architecture lors de décisions techniques majeures pendant l'implémentation.

