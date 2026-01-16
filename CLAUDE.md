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
