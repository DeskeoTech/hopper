# Architecture du Projet Hopper

> Documentation générée automatiquement le 2026-01-19 par BMAD Document Project Workflow

## Vue d'ensemble

**Hopper** est une application web de gestion d'espaces de coworking développée par Deskeo. Elle permet de gérer les sites, les ressources réservables, les entreprises clientes et leurs utilisateurs.

### Informations générales

| Propriété | Valeur |
|-----------|--------|
| **Nom du projet** | Hopper |
| **Type** | Application Web (Admin Dashboard + Interface Client) |
| **Framework** | Next.js 16 (App Router) |
| **Langage** | TypeScript |
| **Base de données** | Supabase (PostgreSQL) |
| **Déploiement** | Vercel |
| **Outil de développement UI** | v0 (Vercel) |

### Contraintes techniques

- **Compatibilité v0** : Le code doit rester compatible avec l'outil v0 de Vercel pour la génération et modification d'interfaces
- **Intégration Linear via MCP** : Prévue pour la synchronisation des tâches

---

## Stack Technique

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
| Airtable | Source de vérité pour les collaborateurs (détermination du rôle `deskeo`) |
| Vercel | Hébergement et déploiement |
| Vercel Analytics | Suivi d'usage |

### Authentification

- **Type** : Magic Link (OTP par email)
- **Provider** : Supabase Auth
- **Environnement preview v0** : Login par mot de passe disponible

---

## Architecture de l'application

### Structure des dossiers

```
hopper/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout racine avec fonts
│   ├── page.tsx                 # Page d'accueil client (/)
│   ├── not-found.tsx            # Page 404
│   ├── globals.css              # Variables CSS et design system
│   ├── login/                   # Page de connexion
│   │   └── page.tsx
│   ├── auth/                    # Gestion de l'authentification
│   │   ├── callback/route.ts    # Callback OAuth/Magic Link
│   │   └── error/page.tsx       # Page d'erreur auth
│   └── admin/                   # Routes protégées admin
│       ├── layout.tsx           # Layout admin avec sidebar
│       ├── page.tsx             # Dashboard admin
│       ├── loading.tsx          # Loading state
│       ├── dashboard/           # Page dashboard (prochainement)
│       ├── sites/               # Gestion des sites
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   └── [id]/page.tsx
│       ├── reservations/        # Gestion des réservations
│       │   └── page.tsx
│       └── clients/             # Gestion des clients
│           ├── page.tsx
│           └── [id]/page.tsx
│
├── components/                   # Composants React
│   ├── ui/                      # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── calendar.tsx
│   │   ├── searchable-select.tsx
│   │   └── ... (20+ composants)
│   ├── admin/                   # Composants admin
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── site-card.tsx
│   │   ├── companies-table.tsx
│   │   ├── site-edit/           # Modals d'édition de site
│   │   ├── company-edit/        # Modals d'édition d'entreprise
│   │   └── reservations/        # Composants de réservation
│   ├── client/                  # Composants interface client
│   │   ├── client-home-page.tsx
│   │   ├── user-profile-card.tsx
│   │   ├── book-meeting-room-modal.tsx
│   │   └── ...
│   ├── login-form.tsx
│   └── user-bar.tsx
│
├── lib/                         # Utilitaires et configuration
│   ├── utils.ts                 # Fonction cn() pour Tailwind
│   ├── navigation.ts            # Configuration de la navigation admin
│   ├── supabase/
│   │   ├── server.ts            # Client Supabase côté serveur
│   │   └── client.ts            # Client Supabase côté navigateur
│   ├── actions/                 # Server Actions Next.js
│   │   ├── sites.ts
│   │   ├── companies.ts
│   │   ├── users.ts
│   │   ├── bookings.ts
│   │   └── auth.ts
│   ├── airtable/
│   │   └── authorized-emails.ts # Vérification collaborateurs Airtable
│   └── types/
│       └── database.ts          # Types TypeScript pour le schéma DB
│
├── public/                      # Assets statiques
│   └── fonts/                   # Polices personnalisées Deskeo
│
├── proxy.ts                     # Middleware d'authentification
├── package.json
├── tsconfig.json
└── next.config.mjs
```

### Flux d'authentification

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /login    │────>│  Supabase   │────>│ /auth/      │
│  (email)    │     │  Magic Link │     │  callback   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               v
                                    ┌──────────────────┐
                                    │ Check user in    │
                                    │ users table      │
                                    └────────┬─────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         v                   v                   v
              ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
              │ No account      │ │ role = user     │ │ role = admin    │
              │ → /login?error  │ │ → / (client)    │ │ → /admin        │
              └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Rôles utilisateur

| Rôle | Accès |
|------|-------|
| `user` | Interface client uniquement (`/`) |
| `admin` | Interface admin complète (`/admin/*`) |
| `deskeo` | Interface admin (collaborateurs Deskeo, détecté via Airtable) |

---

## Modèle de données

### Schéma des entités principales

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     sites       │       │   companies     │       │     users       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │<──────│ main_site_id    │       │ id (PK)         │
│ name            │       │ id (PK)         │<──────│ company_id (FK) │
│ address         │       │ name            │       │ email           │
│ status          │       │ subscription_*  │       │ role            │
│ equipments[]    │       │ customer_stripe │       │ status          │
│ opening_hours   │       └────────┬────────┘       └────────┬────────┘
│ wifi_ssid       │                │                         │
└────────┬────────┘                │                         │
         │                         v                         │
         │               ┌─────────────────┐                 │
         │               │   contracts     │                 │
         v               ├─────────────────┤                 │
┌─────────────────┐      │ company_id (FK) │                 │
│   resources     │      │ plan_id (FK)    │                 │
├─────────────────┤      │ status          │                 │
│ id (PK)         │      └────────┬────────┘                 │
│ site_id (FK)    │               │                         │
│ type            │               v                         │
│ capacity        │      ┌─────────────────┐                 │
│ hourly_credit   │      │    credits      │                 │
└────────┬────────┘      ├─────────────────┤                 │
         │               │ contract_id (FK)│                 │
         │               │ period          │                 │
         v               │ allocated       │                 │
┌─────────────────┐      │ remaining       │                 │
│    bookings     │      └─────────────────┘                 │
├─────────────────┤                                          │
│ id (PK)         │<─────────────────────────────────────────┘
│ resource_id (FK)│
│ user_id (FK)    │
│ start_date      │
│ end_date        │
│ status          │
│ credits_used    │
└─────────────────┘
```

### Tables détaillées

#### sites
Espaces de coworking physiques.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | text | Nom du site |
| address | text | Adresse complète |
| status | enum | `open` \| `closed` |
| equipments | array | Équipements disponibles |
| opening_days | array | Jours d'ouverture |
| opening_hours | text | Heures d'ouverture |
| wifi_ssid/password | text | Informations WiFi |
| contact_* | text | Informations de contact |

#### resources
Ressources réservables dans un site.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| site_id | uuid | Site parent (FK) |
| name | text | Nom de la ressource |
| type | enum | `bench` \| `meeting_room` \| `flex_desk` \| `fixed_desk` |
| capacity | int | Capacité (personnes) |
| floor | enum | Étage (`RDC`, `R+1`, etc.) |
| hourly_credit_rate | int | Coût en crédits par heure |
| equipments | array | Équipements (`ecran`, `visio`, `tableau`) |
| status | enum | `available` \| `unavailable` |

#### companies
Entreprises clientes.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | text | Nom de l'entreprise |
| company_type | enum | `self_employed` \| `multi_employee` |
| main_site_id | uuid | Site principal (FK) |
| subscription_period | enum | `month` \| `week` |
| subscription_start/end_date | date | Période d'abonnement |
| customer_id_stripe | text | ID client Stripe |

#### users
Utilisateurs des entreprises clientes.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| company_id | uuid | Entreprise (FK) |
| email | text | Email (utilisé pour auth) |
| role | enum | `admin` \| `user` \| `deskeo` |
| status | enum | `active` \| `disabled` |

#### bookings
Réservations de ressources.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | Utilisateur (FK) |
| resource_id | uuid | Ressource (FK) |
| start_date | timestamp | Début de réservation |
| end_date | timestamp | Fin de réservation |
| status | enum | `confirmed` \| `cancelled` \| `pending` |
| credits_used | int | Crédits consommés |

#### credits
Crédits mensuels pour les salles de réunion.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| contract_id | uuid | Contrat (FK) |
| period | date | Période (1er du mois) |
| allocated_credits | int | Crédits alloués |
| remaining_credits | int | Crédits restants |

---

## Server Actions

Les mutations de données utilisent les Server Actions Next.js (`"use server"`).

### Sites (`lib/actions/sites.ts`)

| Action | Description |
|--------|-------------|
| `updateSiteHeader` | Modifier nom, statut et adresse |
| `updateSiteInstructions` | Modifier instructions et accès |
| `updateSiteHours` | Modifier horaires d'ouverture |
| `updateSiteWifi` | Modifier informations WiFi |
| `updateSiteEquipments` | Modifier équipements |
| `uploadSitePhoto` | Uploader une photo vers Storage |
| `deleteSitePhoto` | Supprimer une photo |

### Companies (`lib/actions/companies.ts`)

| Action | Description |
|--------|-------------|
| `updateCompanyHeader` | Modifier nom et type |
| `updateCompanyContact` | Modifier adresse, téléphone, email |
| `updateCompanySubscription` | Modifier période d'abonnement |

### Users (`lib/actions/users.ts`)

| Action | Description |
|--------|-------------|
| `createUser` | Créer un utilisateur |
| `updateUser` | Modifier un utilisateur |
| `toggleUserStatus` | Activer/désactiver un utilisateur |

### Bookings (`lib/actions/bookings.ts`)

| Action | Description |
|--------|-------------|
| `getMeetingRoomsBySite` | Lister les salles disponibles |
| `checkAvailability` | Vérifier les créneaux disponibles |
| `createMeetingRoomBooking` | Créer une réservation (avec vérification crédits) |

---

## Design System

### Palette de couleurs Deskeo

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--color-bg-primary` | `#F2E7DC` | Fond principal (beige chaud) |
| `--color-text-primary` | `#1B1918` | Texte, bordures, CTAs (brun foncé) |
| `--color-bg-secondary` | `#D9D0C4` | Cards, panels (beige foncé) |

### Typographie

| Police | Variable | Usage |
|--------|----------|-------|
| ProgramNarOT Black | `--font-header` | Titres (H1, H2, H3) - Majuscules |
| Articulat CF | `--font-body` | Corps de texte et UI |
| GT Alpina | `--font-editorial` | Texte d'accent (italique) |

### Classes utilitaires

```css
.type-h1 { /* Titre principal */ }
.type-h2 { /* Titre de section */ }
.type-h3 { /* Sous-titre */ }
.type-body { /* Texte courant */ }
.font-header { /* Police header uppercase */ }
.font-editorial { /* Police italique */ }
```

### Radius (signature Deskeo)

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--radius-sm` | 12px | Petits éléments |
| `--radius-md` | 20px | Boutons, inputs |
| `--radius-lg` | 28px | Cards, modals |

---

## Patterns de code

### Server Components (par défaut)

```tsx
// app/admin/sites/page.tsx
export default async function SitesPage() {
  const supabase = await createClient()
  const { data: sites } = await supabase.from("sites").select("*")

  return <SiteList sites={sites} />
}
```

### Client Components (quand nécessaire)

```tsx
// components/admin/site-card.tsx
"use client"

import { useState } from "react"

export function SiteCard({ site }) {
  const [isOpen, setIsOpen] = useState(false)
  // ...
}
```

### Server Actions

```tsx
// lib/actions/sites.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateSite(id: string, data: UpdateData) {
  const supabase = await createClient()
  await supabase.from("sites").update(data).eq("id", id)
  revalidatePath(`/admin/sites/${id}`)
  return { success: true }
}
```

### Règles importantes

1. **Filtres avec recherche** : Utiliser `SearchableSelect` au lieu de `Select` basique
2. **Recherche temps réel** : Déclencher sur `onChange`, pas sur submit
3. **Tables responsives** : Toujours wrapper avec `overflow-x-auto`
4. **Colonnes cachées mobile** : Utiliser `hidden md:table-cell`

---

## Intégrations externes

### Supabase

- **URL** : Variable d'environnement `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key** : Variable d'environnement `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Storage Bucket** : `site-photos` pour les images de sites

### Airtable

- **Usage** : Vérification des collaborateurs Deskeo à la connexion
- **Base ID** : `appDe1N8etZrwWXrG`
- **Table** : Collaborateurs
- **Token** : Variable d'environnement `AIRTABLE_API_TOKEN`

### Vercel

- **Déploiement** : Automatique depuis le repo GitHub
- **Analytics** : Activé via `@vercel/analytics`

---

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `AIRTABLE_API_TOKEN` | Token API Airtable |

---

## Prochaines évolutions prévues

- [ ] Intégration Linear via MCP pour la synchronisation des tâches
- [ ] Page Dashboard avec statistiques
- [ ] Création de réservations depuis l'admin
