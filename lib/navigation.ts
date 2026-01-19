import {
  Building2,
  Calendar,
  Briefcase,
  LayoutDashboard,
  Home,
  DoorOpen,
  Monitor,
  User,
  Newspaper,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const adminNavigation: NavItem[] = [
  { name: "Accueil", href: "/admin", icon: Home },
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Building2 },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Clients", href: "/admin/clients", icon: Briefcase },
]

export const clientNavigation: NavItem[] = [
  { name: "Salles", href: "/salles", icon: DoorOpen },
  { name: "Postes de travail", href: "/postes", icon: Monitor },
  { name: "Mon compte", href: "/compte", icon: User },
  { name: "Fil d'actualité", href: "/actualites", icon: Newspaper },
]
