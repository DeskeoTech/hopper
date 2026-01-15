# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hopper is a Next.js 16 admin dashboard for managing coworking spaces (sites, resources, reservations). It uses React 19, TypeScript, Supabase for database/auth, and Tailwind CSS 4 with shadcn/ui components.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

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

## Design System

Custom Deskeo brand with:
- **Primary background:** #F0E8DC (warm beige)
- **Primary text:** #1B1918 (dark brown)
- **Fonts:** ProgramNarOT (headers), Articulat CF (body), GT Alpina (editorial)
- **Border radius:** 20px default

## Database Types

Key types from `lib/types/database.ts`:
- `SiteStatus`: "open" | "closed"
- `ResourceType`: "bench" | "meeting_room" | "flex_desk" | "fixed_desk"
- `Equipment`: "barista" | "stationnement_velo" | "impression" | "douches" | "salle_sport" | "terrasse" | "rooftop"
