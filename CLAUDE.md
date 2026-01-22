# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hopper is a Next.js 16 admin dashboard for managing coworking spaces (sites, resources, reservations). It uses React 19, TypeScript, Supabase for database/auth, and Tailwind CSS 4 with shadcn/ui components.

## Commands

\`\`\`bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
\`\`\`

## Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router with React Server Components)
- **Database/Auth:** Supabase (PostgreSQL + magic link authentication via OTP)
- **UI:** Tailwind CSS 4 + shadcn/ui (New York style) + Lucide icons
- **Forms:** React Hook Form + Zod validation

### Directory Structure
- `app/` - Next.js App Router pages and layouts
  - `app/admin/` - Protected admin routes (sites, reservations, users, settings)
  - `app/auth/` - Authentication callback and error handling
  - `app/login/` - Login page with magic link form
- `components/` - React components
  - `components/ui/` - shadcn/ui base components
  - `components/admin/` - Admin-specific components (sidebar, header, cards)
- `lib/` - Utilities and configuration
  - `lib/supabase/` - Supabase clients (server.ts, client.ts)
  - `lib/types/database.ts` - TypeScript interfaces for database schema

### Authentication Flow
1. User enters email on `/login`
2. Supabase sends magic link email
3. User clicks link → `/auth/callback` exchanges code for session
4. Middleware (`proxy.ts`) protects `/admin/*` routes
5. Server components use `getUser()` from `lib/supabase/server.ts`

### Data Model
- **Sites:** Coworking locations with address, status, WiFi, equipment, opening hours
- **Resources:** Bookable items (bench, meeting_room, flex_desk, fixed_desk) linked to sites
- **SitePhotos:** Images stored in Supabase storage bucket `site-photos/`
- **SiteContacts:** Contact information for sites

### Patterns
- Server Components are default; use `"use client"` only when needed
- Data fetching happens in server components via `createClient()` from `lib/supabase/server.ts`
- Styling uses Tailwind + `cn()` utility from `lib/utils.ts` for conditional classes
- Import aliases: `@/components`, `@/lib`, `@/hooks`
- **Dropdown filters must always include a search bar.** Use the `SearchableSelect` component from `@/components/ui/searchable-select` instead of the basic `Select` component for all filter dropdowns.
- **Search bars must filter results in real-time.** Trigger the search on every input change (`onChange`), not only on form submit. This provides instant feedback to the user.

## Design System

Custom Deskeo brand with:
- **Primary background:** #F0E8DC (warm beige)
- **Primary text:** #1B1918 (dark brown)
- **Fonts:** ProgramNarOT (headers), Articulat CF (body), GT Alpina (editorial)
- **Border radius:** 20px default

## Responsive Design Guidelines

**The site must be fully responsive.** Follow these patterns for all new components:

### Breakpoints (Tailwind defaults)
- `sm:` (640px) - Small tablets
- `md:` (768px) - Tablets / sidebar visibility
- `lg:` (1024px) - Desktop multi-column layouts
- `xl:` (1280px) - Wide screens

### Layout Patterns

**Main content padding:**
\`\`\`tsx
<main className="p-4 md:p-6">
\`\`\`

**Card sections:**
\`\`\`tsx
<div className="rounded-lg bg-card p-4 sm:p-6">
\`\`\`

**Filter rows (stack on mobile, row on tablet+):**
\`\`\`tsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
\`\`\`

**Grid layouts (responsive columns):**
\`\`\`tsx
// Cards grid
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">

// Detail page with sidebar
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">Main content</div>
  <div>Sidebar</div>
</div>
\`\`\`

**Page headers (icon + title + badge):**
\`\`\`tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
  <div className="flex h-10 w-10 shrink-0 ... sm:h-14 sm:w-14">
    <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
  </div>
  <div className="min-w-0 flex-1">
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
\`\`\`

### Table Responsiveness

**Always wrap tables with overflow:**
\`\`\`tsx
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
\`\`\`

**Hide secondary columns on mobile:**
\`\`\`tsx
// Header
<TableHead className="hidden md:table-cell">Column</TableHead>

// Cell
<TableCell className="hidden md:table-cell">Value</TableCell>
\`\`\`

### Text & Content

**Truncate long text:**
\`\`\`tsx
<span className="truncate max-w-[200px]">{longText}</span>
\`\`\`

**Break long words:**
\`\`\`tsx
<span className="break-words">{address}</span>
\`\`\`

**Hide text on mobile, show on tablet+:**
\`\`\`tsx
<span className="hidden sm:inline">Full label</span>
<span className="sm:hidden">Short</span>
\`\`\`

## Database Types

Key types from `lib/types/database.ts`:
- `SiteStatus`: "open" | "closed"
- `ResourceType`: "bench" | "meeting_room" | "flex_desk" | "fixed_desk"
- `Equipment`: "barista" | "stationnement_velo" | "impression" | "douches" | "salle_sport" | "terrasse" | "rooftop"

## Création de Pull Requests

**OBLIGATOIRE : Toujours pousser la branche vers origin AVANT de créer une PR.**

Quand l'utilisateur demande de créer une PR (ou clique sur "create pr") :

1. **D'abord, pousser la branche locale vers origin :**
   ```bash
   git push -u origin <nom-de-la-branche>
   ```
   Exemple : `git push -u origin buba-hub/meeting-room-icons-padding`

2. **Ensuite, créer la PR avec `gh pr create`**

Cette étape est **impérative** car la branche doit exister sur le remote avant de pouvoir créer une PR. Sans cela, l'erreur suivante apparaît :
```
fatal : argument 'origin/<branch>...HEAD' ambigu : révision inconnue ou chemin inexistant
```

**Workflow complet :**
```bash
# 1. Pousser la branche vers origin
git push -u origin <nom-de-la-branche>

# 2. Créer la PR
gh pr create --title "..." --body "..."
```

## Linear Integration

**Toujours synchroniser les stories avec Linear via le MCP Linear.**

Quand une story est créée (workflow `create-story`) :
1. **D'abord vérifier** si une issue existe déjà dans Linear (rechercher par titre "Story X.Y")
2. Si elle existe : utiliser l'issue existante et mettre à jour le fichier story avec son ID/URL
3. Sinon : créer une issue Linear dans le projet **Hopper Back Office** (équipe Deskeo)
4. Statut initial : **Backlog** (ne pas mettre In Progress)
5. Inclure dans la description : user story, acceptance criteria, tasks
6. Ajouter un lien vers le fichier story local dans les références
7. Mettre à jour le fichier story avec l'ID/URL de l'issue Linear

Quand une story est commencée (workflow `dev-story`) :
1. Mettre à jour le statut de l'issue Linear → **In Progress**

Quand une story est implémentée (workflow `dev-story` terminé) :
1. Mettre à jour le statut de l'issue Linear → **In Review** (équivalent "To Test")
2. Ajouter dans le fichier story ET dans Linear :
   - **Page à tester:** `/path/to/page` (la page principale concernée par la story)
   - Liste des tests fonctionnels simples (5 max)
3. La story est prête pour être testée/validée

Quand une story est validée (après tests + `code-review`) :
1. Mettre à jour le statut de l'issue Linear → **Done**
2. Ajouter les notes de complétion en commentaire si pertinent
