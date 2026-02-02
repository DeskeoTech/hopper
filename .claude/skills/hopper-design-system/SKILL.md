---
name: hopper-design-system
description: Guide de design pour les composants UI Hopper. Applique automatiquement les patterns de design (cards, buttons, dropdowns, icons) pour maintenir la cohérence visuelle.
disable-model-invocation: true
allowed-tools: Read, Glob, Grep
---

# Hopper Design System

Ce skill définit les patterns de design à suivre pour toutes les implémentations UI du projet Hopper.

## Philosophie

Le design Hopper est **épuré, flat et minimaliste** :
- **Aucune ombre** (pas de shadow-sm, shadow-lg, etc.)
- Pas de bordures visibles (sauf séparateurs subtils internes)
- Séparation des éléments par **différence de fond** (bg-card vs bg-background)
- Coins arrondis généreux
- Espacement aéré
- Typographie uppercase pour les titres

## Couleurs

```tsx
// Backgrounds
bg-card              // Fond des cards (blanc/sombre selon theme)
bg-background        // Fond de page (#F2E7DC en light)
bg-foreground/5      // Fond subtil pour icônes, badges, inputs, sections internes
bg-foreground/10     // Fond hover ou badges plus visibles

// Textes
text-foreground      // Texte principal (#1B1918)
text-foreground/70   // Texte secondaire (icônes, labels)
text-muted-foreground // Texte tertiaire (descriptions, hints)

// Boutons primaires
bg-[#1B1918]         // Fond bouton principal
text-white           // Texte bouton principal
hover:bg-[#1B1918]/90 // Hover bouton principal

// États
text-green-500       // Succès (check, confirmation)
```

## Cards

**IMPORTANT : Jamais de shadow sur les cards. La séparation se fait par le fond.**

### Card standard
```tsx
<div className="rounded-[16px] bg-card overflow-hidden">
  {/* Contenu */}
</div>
```

### Card avec image
```tsx
<div className="overflow-hidden rounded-[16px] bg-card">
  {/* Image */}
  <div className="relative aspect-[3/2] overflow-hidden">
    <img src={image} alt={title} className="h-full w-full object-cover" />
    {/* Badge optionnel en haut à droite */}
    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium">
      <Icon className="h-2.5 w-2.5" />
      {value}
    </div>
  </div>

  {/* Contenu */}
  <div className="p-3">
    <h3 className="font-header text-sm font-bold uppercase tracking-tight">{title}</h3>
    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{description}</p>
    {/* Actions */}
  </div>
</div>
```

### Card plus grande (salles disponibles)
```tsx
<div className="overflow-hidden rounded-[20px] bg-card">
  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
    {/* Image ou placeholder */}
  </div>
  <div className="p-4">
    <h4 className="font-header text-base font-bold uppercase tracking-tight">{name}</h4>
    <p className="mt-1 text-sm text-muted-foreground">{info}</p>
    {/* Button */}
  </div>
</div>
```

## Modals / Dialogs

**Modals sans ombre, fond blanc sur overlay sombre.**

```tsx
// DialogContent
className="bg-background sm:rounded-[20px]"
// Pas de shadow-lg ou shadow-xl

// AlertDialogContent
className="bg-background sm:rounded-[20px]"
```

## Boutons

### Bouton principal (CTA)
```tsx
<Button
  size="sm"
  className="w-full rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-[10px] font-semibold tracking-wide h-8"
>
  {label}
</Button>
```

### Bouton standard
```tsx
<Button className="w-full rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-xs font-semibold tracking-wide">
  {label}
</Button>
```

### Bouton icône (copier, fermer, etc.)
```tsx
<button
  type="button"
  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
>
  <Icon className="h-4 w-4 text-muted-foreground" />
</button>
```

## Icônes avec fond circulaire

Pattern pour les icônes dans les listes d'informations :
```tsx
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
  <Icon className="h-5 w-5 text-foreground/70" />
</div>
```

## Dropdown / Accordion

```tsx
<div className="rounded-[16px] bg-card overflow-hidden">
  {/* Contenu toujours visible */}
  <div className="p-4">
    {/* ... */}
  </div>

  {/* Toggle button */}
  <button
    type="button"
    onClick={() => setExpanded(!expanded)}
    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/5"
  >
    <span>Voir plus</span>
    <ChevronDown className={cn(
      "h-4 w-4 transition-transform duration-200",
      expanded && "rotate-180"
    )} />
  </button>

  {/* Contenu expandable */}
  <div className={cn(
    "overflow-hidden transition-all duration-200",
    expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
  )}>
    <div className="space-y-4 px-4 pb-4">
      {/* Contenu additionnel */}
    </div>
  </div>
</div>
```

## Listes d'informations

Pattern pour afficher des infos avec icône :
```tsx
<div className="flex items-center gap-3">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
    <MapPin className="h-5 w-5 text-foreground/70" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
  {/* Action optionnelle à droite */}
</div>
```

## Badges / Tags

### Badge pill
```tsx
<span className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium">
  {label}
</span>
```

### Badge status
```tsx
<span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground/70">
  {status}
</span>
```

## Sections

### Titre de section
```tsx
<h2 className="font-header text-xl text-foreground">Titre de section</h2>
```

### Section avec header et action
```tsx
<div className="flex items-center justify-between">
  <h2 className="font-header text-xl text-foreground">Titre</h2>
  <button
    type="button"
    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
  >
    Voir tout
    <ChevronRight className="h-4 w-4" />
  </button>
</div>
```

## Empty States

```tsx
<div className="rounded-[20px] bg-card p-6 text-center">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
    <CalendarX2 className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="mt-4 text-sm text-muted-foreground">
    Message explicatif
  </p>
</div>
```

## Scroll horizontal (mobile)

```tsx
<div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
  <div className="flex gap-3 pb-2">
    {items.map((item) => (
      <div key={item.id} className="w-[160px] shrink-0">
        {/* Card */}
      </div>
    ))}
  </div>
</div>
```

## Espacements

- `gap-3` : Entre les cards dans une liste horizontale
- `gap-4` : Entre les cards dans une grille
- `space-y-4` : Entre les sections dans une liste verticale
- `space-y-6` : Entre les grandes sections de page
- `p-3` : Padding interne cards compactes
- `p-4` : Padding interne cards standard
- `p-6` : Padding interne sections/empty states

## Border radius

- `rounded-[12px]` : Petits éléments internes (instructions box)
- `rounded-[16px]` : Cards standard
- `rounded-[20px]` : Cards importantes, modals, empty states
- `rounded-full` : Boutons, badges, icônes circulaires

## Fichiers de référence

Pour voir ces patterns en action :
- `components/client/dashboard/quick-action-cards.tsx` - Cards + dropdown
- `components/client/dashboard/available-rooms-section.tsx` - Cards avec images
- `components/client/user-bookings-section.tsx` - Scroll horizontal + empty state
- `components/client/user-booking-card.tsx` - Card de réservation
- `components/client/account-page.tsx` - Layout de page

## Instructions pour l'implémentation

1. **JAMAIS d'ombre** - Pas de `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
2. **Séparation par fond** - Utiliser `bg-card` sur fond `bg-background` pour créer la hiérarchie
3. **Jamais de `border`** visible sur les cards (sauf séparateurs internes avec `border-foreground/5`)
4. **Utiliser `rounded-full`** pour tous les boutons
5. **Titres en uppercase** avec `font-header font-bold uppercase tracking-tight`
6. **Icônes dans cercles** avec fond `bg-foreground/5`
7. **Transitions** sur les interactions : `transition-colors`, `transition-all duration-200`
