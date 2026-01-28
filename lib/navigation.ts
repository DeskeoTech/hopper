import {
  Building2,
  Calendar,
  Briefcase,
  LayoutDashboard,
  Home,
  DoorOpen,
  User,
  Newspaper,
  Headphones,
  ShoppingCart,
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
  { name: "Tickets", href: "/admin/tickets", icon: Headphones },
]

export const clientNavigation: NavItem[] = [
  { name: "Accueil", href: "/compte", icon: Home },
  { name: "Fil d'actualité", href: "/actualites", icon: Newspaper },
  { name: "Salles de réunion", href: "/salles", icon: DoorOpen },
  { name: "Boutique", href: "/boutique", icon: ShoppingCart },
  { name: "Mon Compte", href: "/mon-compte", icon: User },
]
