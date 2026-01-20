# Catalogue des Composants

> Documentation générée automatiquement le 2026-01-19

## Composants UI (shadcn/ui)

Ces composants proviennent de shadcn/ui (style New York) et sont personnalisés pour le design system Deskeo.

| Composant | Fichier | Description |
|-----------|---------|-------------|
| Button | `components/ui/button.tsx` | Bouton avec variantes (default, destructive, outline, secondary, ghost, link) |
| Input | `components/ui/input.tsx` | Champ de saisie texte |
| Textarea | `components/ui/textarea.tsx` | Zone de texte multi-lignes |
| Label | `components/ui/label.tsx` | Label pour formulaires |
| Checkbox | `components/ui/checkbox.tsx` | Case à cocher |
| Select | `components/ui/select.tsx` | Menu déroulant |
| SearchableSelect | `components/ui/searchable-select.tsx` | Select avec barre de recherche (préféré pour les filtres) |
| Dialog | `components/ui/dialog.tsx` | Modal de dialogue |
| AlertDialog | `components/ui/alert-dialog.tsx` | Modal de confirmation |
| Sheet | `components/ui/sheet.tsx` | Panneau latéral |
| Popover | `components/ui/popover.tsx` | Popup contextuel |
| Command | `components/ui/command.tsx` | Palette de commandes (cmdk) |
| Table | `components/ui/table.tsx` | Tableau avec header, body, row, cell |
| Tabs | `components/ui/tabs.tsx` | Onglets de navigation |
| Calendar | `components/ui/calendar.tsx` | Calendrier pour sélection de date |
| DateRangePicker | `components/ui/date-range-picker.tsx` | Sélecteur de plage de dates |
| Skeleton | `components/ui/skeleton.tsx` | Placeholder de chargement |

---

## Composants Admin

### Layout et Navigation

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| AdminSidebar | `components/admin/admin-sidebar.tsx` | - | Barre latérale de navigation admin (masquée sur mobile) |
| AdminHeader | `components/admin/admin-header.tsx` | `userEmail?: string` | En-tête admin avec email utilisateur et déconnexion |
| MobileNav | `components/admin/mobile-nav.tsx` | - | Navigation mobile (hamburger menu) |
| NavigationItems | `components/admin/navigation-items.tsx` | - | Items de navigation réutilisables |
| DetailsTabs | `components/admin/details-tabs.tsx` | `defaultTab`, `infoContent`, `reservationsContent` | Tabs pour pages de détails (Info / Réservations) |

### Sites

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| SiteCard | `components/admin/site-card.tsx` | `site`, `imageUrl?`, `capacityRange?` | Card de présentation d'un site |
| SitesSearch | `components/admin/sites/sites-search.tsx` | - | Barre de recherche pour la liste des sites |
| StatusBadge | `components/admin/status-badge.tsx` | `status: 'open' \| 'closed'`, `size?` | Badge de statut coloré |
| EquipmentBadge | `components/admin/equipment-badge.tsx` | `equipment: Equipment` | Badge d'équipement avec icône |
| ResourceCard | `components/admin/resource-card.tsx` | `resource: Resource` | Card d'une ressource (salle, poste) |

### Modals d'édition de site

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| EditHeaderModal | `components/admin/site-edit/edit-header-modal.tsx` | `siteId`, `initialName`, `initialStatus`, `initialAddress` | Modifier nom, statut, adresse |
| EditInstructionsModal | `components/admin/site-edit/edit-instructions-modal.tsx` | `siteId`, `initialInstructions`, `initialAccess` | Modifier instructions et accès |
| EditHoursModal | `components/admin/site-edit/edit-hours-modal.tsx` | `siteId`, `initialHours`, `initialDays` | Modifier horaires |
| EditWifiModal | `components/admin/site-edit/edit-wifi-modal.tsx` | `siteId`, `initialSsid`, `initialPassword` | Modifier WiFi |
| EditEquipmentsModal | `components/admin/site-edit/edit-equipments-modal.tsx` | `siteId`, `initialEquipments` | Modifier équipements |
| SitePhotoGallery | `components/admin/site-edit/site-photo-gallery.tsx` | `siteId`, `photos`, `siteName` | Galerie photos avec upload/delete |

### Clients (Companies)

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| CompaniesTable | `components/admin/companies-table.tsx` | `companies: CompanyWithDetails[]` | Tableau des entreprises clientes |
| CompanyCard | `components/admin/company-card.tsx` | `company`, `userCount?` | Card de présentation d'une entreprise |
| CompanySearch | `components/admin/company-search.tsx` | - | Barre de recherche + filtre type |

### Modals d'édition d'entreprise

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| EditHeaderModal | `components/admin/company-edit/edit-header-modal.tsx` | `companyId`, `initialName`, `initialType` | Modifier nom et type |
| EditContactModal | `components/admin/company-edit/edit-contact-modal.tsx` | `companyId`, `initialAddress`, `initialPhone`, `initialEmail` | Modifier contact |
| EditSubscriptionModal | `components/admin/company-edit/edit-subscription-modal.tsx` | `companyId`, `initialPeriod`, `initialStartDate`, `initialEndDate` | Modifier abonnement |
| UsersList | `components/admin/company-edit/users-list.tsx` | `companyId`, `initialUsers` | Liste des utilisateurs avec CRUD |
| UserCard | `components/admin/company-edit/user-card.tsx` | `user`, `companyId`, `onEdit`, `onToggleStatus` | Card d'un utilisateur |
| AddUserModal | `components/admin/company-edit/add-user-modal.tsx` | `companyId`, `open`, `onOpenChange` | Créer un utilisateur |
| EditUserModal | `components/admin/company-edit/edit-user-modal.tsx` | `user`, `companyId`, `open`, `onOpenChange` | Modifier un utilisateur |

### Réservations

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| ReservationsFilters | `components/admin/reservations/reservations-filters.tsx` | `sites`, `companies`, `users` | Filtres pour les réservations |
| ReservationsCalendar | `components/admin/reservations/reservations-calendar.tsx` | `bookings`, `view`, `referenceDate` | Calendrier des réservations |
| CalendarWeekView | `components/admin/reservations/calendar-week-view.tsx` | `bookings`, `referenceDate` | Vue semaine |
| CalendarMonthView | `components/admin/reservations/calendar-month-view.tsx` | `bookings`, `referenceDate` | Vue mois |
| CalendarListView | `components/admin/reservations/calendar-list-view.tsx` | `bookings` | Vue liste |
| ViewToggle | `components/admin/reservations/view-toggle.tsx` | `currentView` | Sélecteur de vue (semaine/mois/liste) |
| BookingCard | `components/admin/reservations/booking-card.tsx` | `booking: BookingWithDetails` | Card d'une réservation |
| BookingStatusBadge | `components/admin/reservations/booking-status-badge.tsx` | `status: BookingStatus` | Badge de statut de réservation |
| ReservationsSection | `components/admin/reservations/reservations-section.tsx` | `context`, `searchParams` | Section réservations (pour pages site/company) |

---

## Composants Client

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| ClientHomePage | `components/client/client-home-page.tsx` | `user`, `bookings`, `isAdmin`, `credits`, `plan`, `sites`, `mainSiteId` | Page d'accueil client complète |
| UserProfileCard | `components/client/user-profile-card.tsx` | `user` | Card profil utilisateur |
| UserPlanCard | `components/client/user-plan-card.tsx` | `plan` | Card forfait utilisateur |
| UserCreditsCard | `components/client/user-credits-card.tsx` | `credits`, `onBookClick` | Card crédits avec CTA réservation |
| UserBookingsSection | `components/client/user-bookings-section.tsx` | `bookings` | Liste des réservations utilisateur |
| UserBookingCard | `components/client/user-booking-card.tsx` | `booking` | Card d'une réservation utilisateur |
| BookMeetingRoomModal | `components/client/book-meeting-room-modal.tsx` | `open`, `onOpenChange`, `userId`, `companyId`, `mainSiteId`, `remainingCredits`, `sites` | Modal de réservation de salle |
| MeetingRoomCard | `components/client/meeting-room-card.tsx` | `room`, `selected`, `onSelect` | Card sélection de salle |
| TimeSlotPicker | `components/client/time-slot-picker.tsx` | `resourceId`, `date`, `onSelect` | Sélecteur de créneaux horaires |
| AdminAccessButton | `components/client/admin-access-button.tsx` | - | Bouton d'accès admin (pour utilisateurs admin/deskeo) |

---

## Composants partagés

| Composant | Fichier | Props | Description |
|-----------|---------|-------|-------------|
| LoginForm | `components/login-form.tsx` | - | Formulaire de connexion (magic link ou password selon environnement) |
| UserBar | `components/user-bar.tsx` | `userEmail?: string` | Barre utilisateur en haut de page (logo + email) |
| ThemeProvider | `components/theme-provider.tsx` | `children` | Provider pour le thème (next-themes) |

---

## Patterns d'utilisation

### Utiliser SearchableSelect pour les filtres

```tsx
import { SearchableSelect } from "@/components/ui/searchable-select"

<SearchableSelect
  options={sites.map(s => ({ value: s.id, label: s.name }))}
  value={selectedSite}
  onValueChange={setSelectedSite}
  placeholder="Sélectionner un site"
  searchPlaceholder="Rechercher..."
/>
```

### Créer un modal d'édition

```tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export function EditModal({ entityId, initialData }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier</DialogTitle>
        </DialogHeader>
        {/* Formulaire */}
      </DialogContent>
    </Dialog>
  )
}
```

### Structure de page responsive

```tsx
export default function Page() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 ... sm:h-14 sm:w-14">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="type-h2 text-foreground">Titre</h1>
          <p className="mt-1 text-muted-foreground">Description</p>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{/* Main content */}</div>
        <div>{/* Sidebar */}</div>
      </div>
    </div>
  )
}
```
