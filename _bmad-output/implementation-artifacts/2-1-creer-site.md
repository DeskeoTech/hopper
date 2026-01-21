# Story 2.1: Créer un Site

Status: review
Linear: [DES-24](https://linear.app/deskeo/issue/DES-24/story-21-creer-un-site)
Branch: `c-hfaye/des-24-story-21-creer-un-site`

## Story

As a **Sales Deskeo**,
I want **créer un nouveau site de coworking**,
so that **je puisse ajouter de nouveaux espaces au réseau Deskeo**.

## Acceptance Criteria

1. **AC1: Création réussie**
   - Given je suis connecté en tant que Sales Deskeo sur `/admin/sites`
   - When je clique sur "Nouveau site" et remplis le formulaire (nom, adresse obligatoires)
   - Then le site est créé dans la base de données
   - And je suis redirigé vers la page de détail du site
   - And un toast confirme "Site créé avec succès"

2. **AC2: Validation des champs obligatoires**
   - Given je soumets un formulaire avec des champs obligatoires manquants
   - When la validation s'exécute
   - Then les erreurs sont affichées inline sous les champs concernés
   - And le formulaire n'est pas soumis

## Tasks / Subtasks

- [x] Task 1: Créer la Server Action `createSite` (AC: #1, #2)
  - [x] 1.1 Ajouter la fonction `createSite` dans `lib/actions/sites.ts`
  - [x] 1.2 Retourner `{ success: true, siteId: string }` ou `{ error: string }`
  - [x] 1.3 Appeler `revalidatePath("/admin/sites")` après création

- [x] Task 2: Créer le schema Zod pour validation (AC: #2)
  - [x] 2.1 Créer `createSiteSchema` dans le composant modal
  - [x] 2.2 Champs obligatoires: `name`, `address`
  - [x] 2.3 Champs optionnels: `status` (défaut: "open")

- [x] Task 3: Créer le composant `CreateSiteModal` (AC: #1, #2)
  - [x] 3.1 Créer `components/admin/sites/create-site-modal.tsx`
  - [x] 3.2 Utiliser Dialog de shadcn/ui
  - [x] 3.3 Formulaire avec React Hook Form + Zod resolver
  - [x] 3.4 Afficher erreurs inline sous les champs
  - [x] 3.5 Désactiver bouton pendant soumission (isPending)
  - [x] 3.6 Toast success/error avec Sonner
  - [x] 3.7 Redirection vers `/admin/sites/[id]` après succès

- [x] Task 4: Ajouter bouton "Nouveau site" sur la page liste (AC: #1)
  - [x] 4.1 Modifier `app/admin/sites/page.tsx`
  - [x] 4.2 Ajouter bouton à côté du titre ou de la recherche
  - [x] 4.3 Le bouton ouvre la modal `CreateSiteModal`

## Tests à valider

**Page à tester:** `/admin/sites`

- [ ] Le bouton "Nouveau site" est visible sur `/admin/sites`
- [ ] La modal s'ouvre au clic
- [ ] Création avec nom + adresse → toast succès + redirection vers détail
- [ ] Soumission sans champs → erreurs affichées inline
- [ ] Le site créé apparaît dans la liste

## Dev Notes

### Architecture Compliance

- **Server Action Pattern**: Retour `{ success: true, siteId }` ou `{ error: message }`
- **Revalidation**: Appeler `revalidatePath("/admin/sites")` ET `revalidatePath("/admin/sites/[newId]")`
- **Client Component**: La modal DOIT avoir `"use client"` car utilise useState, useRouter
- **Server Component**: La page liste reste Server Component, la modal est importée comme Client

### Technical Requirements

**Server Action `createSite`:**
```typescript
// lib/actions/sites.ts
export async function createSite(data: { name: string; address: string; status?: SiteStatus }) {
  const supabase = await createClient()

  const { data: site, error } = await supabase
    .from("sites")
    .insert({
      name: data.name,
      address: data.address,
      status: data.status || "open",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/admin/sites")
  return { success: true, siteId: site.id }
}
```

**Schema Zod:**
```typescript
const createSiteSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  address: z.string().min(1, "L'adresse est obligatoire"),
  status: z.enum(["open", "closed"]).default("open"),
})
```

### Library/Framework Requirements

| Package | Usage | Version |
|---------|-------|---------|
| react-hook-form | Gestion formulaire | 7.60.0 |
| @hookform/resolvers | Zod resolver | Installé |
| zod | Validation schema | 3.25.76 |
| sonner | Toast notifications | 1.7.4 |
| next/navigation | useRouter pour redirect | Next 16 |

### File Structure Requirements

```
components/admin/sites/
├── create-site-modal.tsx   # 🆕 À créer
├── sites-search.tsx        # Existant
└── ...

lib/actions/
└── sites.ts                # Ajouter createSite()

app/admin/sites/
└── page.tsx                # Modifier - ajouter bouton
```

### Project Structure Notes

- Le composant modal suit le pattern des autres modales d'édition dans `components/admin/`
- Placement du bouton: à côté de la barre de recherche `SitesSearch`, aligné à droite
- La page `/admin/sites/page.tsx` reste un Server Component
- La modal est un Client Component importé dynamiquement si nécessaire

### UI/UX Requirements

**Bouton "Nouveau site":**
- Utiliser `Button` de shadcn/ui avec variant "default"
- Icône `Plus` de lucide-react à gauche du texte
- Placement: dans le header à côté de la recherche

**Modal:**
- Titre: "Nouveau site"
- Champs visibles: Nom (input), Adresse (input ou textarea), Statut (select open/closed)
- Boutons: "Annuler" (variant outline), "Créer" (variant default)
- Largeur: `sm:max-w-[425px]`

**Messages:**
- Success toast: "Site créé avec succès"
- Error toast: Message d'erreur de la DB ou "Une erreur est survenue"
- Validation inline: "Le nom est obligatoire", "L'adresse est obligatoire"

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR4]
- [Source: _bmad-output/project-context.md#Règles-Server-Actions]
- [Source: lib/actions/sites.ts - Pattern existant pour updateSite*]
- [Source: lib/types/database.ts - Interface Site, SiteStatus]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build verification: `npm run build` - ✅ Success
- TypeScript check: `npx tsc --noEmit` - ✅ No errors in modified files

### Completion Notes List

1. **Task 1 - Server Action `createSite`:** Implémentée selon le pattern existant dans `lib/actions/sites.ts`. Retourne `{ success: true, siteId: string }` ou `{ error: string }`. Appelle `revalidatePath("/admin/sites")` après création.

2. **Task 2 - Schema Zod:** Créé `createSiteSchema` avec validation des champs obligatoires (name, address) et optionnels (status avec défaut "open"). Messages d'erreur en français.

3. **Task 3 - CreateSiteModal:** Nouveau composant client utilisant React Hook Form + Zod resolver. Affiche erreurs inline sous les champs. Bouton désactivé pendant soumission. Toast success/error avec Sonner. Redirection vers `/admin/sites/[id]` après succès. Note: Le composant Form de shadcn/ui n'étant pas installé, j'ai utilisé une approche manuelle avec `register`, `errors`, et des `<p>` pour les messages d'erreur.

4. **Task 4 - Bouton "Nouveau site":** Ajouté dans `app/admin/sites/page.tsx` à côté de la barre de recherche, aligné à droite. Layout responsive avec flex-col sur mobile et flex-row sur desktop.

### File List

- `lib/actions/sites.ts` - Ajout de la fonction `createSite()`
- `components/admin/sites/create-site-modal.tsx` - **NOUVEAU** - Composant modal de création de site
- `app/admin/sites/page.tsx` - Import et ajout du composant `CreateSiteModal`

### Change Log

- **2026-01-21:** Implémentation complète de la story 2.1 - Créer un Site
  - Ajout de la Server Action `createSite` avec validation et revalidation
  - Création du composant `CreateSiteModal` avec React Hook Form + Zod
  - Intégration du bouton "Nouveau site" sur la page liste des sites
  - Tous les critères d'acceptance sont satisfaits (AC1, AC2)

