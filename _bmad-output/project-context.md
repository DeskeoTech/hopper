---
project_name: 'hopper'
user_name: 'Deskeo'
date: '2026-01-20'
sections_completed:
  - technology_stack
  - typescript_rules
  - nextjs_rules
  - supabase_rules
  - ui_rules
  - naming_rules
  - anti_patterns
status: 'complete'
---

# Project Context - Hopper

> Règles critiques pour les agents AI. Complète CLAUDE.md avec des détails spécifiques d'implémentation.

## Stack Technique (Versions Exactes)

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.0.10 | App Router, Server Components par défaut |
| react | 19.2.0 | Hooks uniquement, pas de classes |
| typescript | 5.x | Mode strict activé |
| tailwindcss | 4.1.9 | Nouvelle syntaxe CSS |
| @supabase/ssr | 0.8.0 | Client serveur avec cookies |
| sonner | 1.7.4 | Toasts (position: top-right) |
| zod | 3.25.76 | Validation schemas |
| react-hook-form | 7.60.0 | Formulaires avec resolvers Zod |
| date-fns | 4.1.0 | Manipulation dates |

## Règles Critiques TypeScript

- **Imports :** Utiliser alias `@/` pour tous les imports internes
- **Types DB :** Toujours importer depuis `@/lib/types/database.ts`
- **Null vs Undefined :** Utiliser `null` pour les valeurs DB, jamais `undefined`
- **Async/Await :** Toujours async/await, jamais `.then()` chains

```typescript
// ✅ Correct
import { Site } from "@/lib/types/database"
const site: Site | null = data

// ❌ Incorrect
import { Site } from "../../lib/types/database"
const site: Site | undefined = data
```

## Règles Next.js 16 / React 19

### Server vs Client Components

- **Par défaut :** Server Component (pas de directive)
- **Client :** Ajouter `"use client"` uniquement si interactivité requise
- **Hydration :** Ne jamais mixer état serveur et client dans le même composant

```typescript
// Server Component (défaut) - data fetching
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent data={data} />
}

// Client Component - interactivité
"use client"
export function ClientComponent({ data }) {
  const [state, setState] = useState(data)
}
```

### Server Actions

- **Emplacement :** `lib/actions/{domaine}.ts`
- **Directive :** `"use server"` en haut du fichier
- **Retour mutations :** `{ success: true }` ou `{ error: "message" }`
- **Retour queries :** `{ data: [], error?: string }`
- **Revalidation :** Toujours appeler `revalidatePath()` après mutation

```typescript
"use server"

export async function updateItem(id: string, data: Data) {
  const supabase = await createClient()
  const { error } = await supabase.from("items").update(data).eq("id", id)

  if (error) return { error: error.message }

  revalidatePath(`/admin/items/${id}`)
  return { success: true }
}
```

## Règles Supabase

- **Client serveur :** `await createClient()` depuis `@/lib/supabase/server.ts`
- **Client browser :** `createClient()` depuis `@/lib/supabase/client.ts`
- **RLS :** Toujours actif, ne jamais contourner
- **Storage :** Bucket `site-photos` pour les images

```typescript
// ✅ Server Component / Server Action
const supabase = await createClient()

// ✅ Client Component
const supabase = createClient()
```

## Règles UI / Composants

### Toasts (Sonner)

```typescript
import { toast } from "sonner"

// Après server action
const result = await updateSite(id, data)
if (result.error) {
  toast.error(result.error)
} else {
  toast.success("Site mis à jour")
}
```

### Formulaires

- **Toujours :** React Hook Form + Zod resolver
- **Validation :** Inline avec messages en français
- **Submit :** Désactiver bouton pendant soumission

### Composants shadcn/ui

- **Style :** New York
- **Imports :** Depuis `@/components/ui/`
- **Filtres dropdown :** Utiliser `SearchableSelect` (pas `Select` basique)

## Règles de Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | kebab-case | `user-card.tsx` |
| Composants | PascalCase | `UserCard` |
| Fonctions | camelCase | `getUserById` |
| Variables | camelCase | `userId` |
| Tables DB | snake_case pluriel | `users`, `site_photos` |
| Colonnes DB | snake_case | `created_at`, `user_id` |

## Anti-Patterns à Éviter

| Ne Pas Faire | Faire |
|--------------|-------|
| Créer des routes API `/api/` | Utiliser Server Actions |
| `useState` pour loading initial | Fichier `loading.tsx` + Suspense |
| `alert()` pour feedback | `toast.success/error()` |
| Types dans chaque fichier | Centraliser dans `lib/types/` |
| `undefined` pour valeurs DB | `null` |
| Imports relatifs `../../` | Alias `@/` |

## Messages Utilisateur

- **Langue :** Toujours en français
- **Ton :** Professionnel mais accessible
- **Erreurs :** Orientées action ("Vérifiez..." pas "Erreur 500")

## Checklist Avant Commit

- [ ] Pas d'erreurs TypeScript
- [ ] Imports avec alias `@/`
- [ ] Server Actions retournent `{success}` ou `{error}`
- [ ] `revalidatePath()` appelé après mutations
- [ ] Messages en français
- [ ] Pas de `console.log` en production

---

## Usage Guidelines

**Pour les Agents AI :**

- Lire ce fichier avant d'implémenter du code
- Suivre TOUTES les règles exactement comme documentées
- En cas de doute, préférer l'option la plus restrictive
- Mettre à jour ce fichier si de nouveaux patterns émergent

**Pour les Humains :**

- Garder ce fichier lean et focalisé sur les besoins des agents
- Mettre à jour quand la stack technique change
- Revoir trimestriellement pour retirer les règles obsolètes

---

*Dernière mise à jour : 2026-01-20*
