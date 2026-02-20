import {
  Building2,
  Calendar,
  Briefcase,
  LayoutDashboard,
  Home,
  User,
  Newspaper,
  Headphones,
  ShoppingCart,
  FlaskConical,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export const adminNavigation: NavItem[] = [
  { name: "Accueil", href: "/admin", icon: Home },
  { name: "Accueil", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Building2 },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Clients", href: "/admin/clients", icon: Briefcase },
  { name: "Tickets", href: "/admin/tickets", icon: Headphones },
  { name: "Tests Stripe", href: "/admin/tests", icon: FlaskConical },
]

export const clientNavigation: NavItem[] = [
  { name: "Accueil", href: "/compte", icon: Home },
  // { name: "Fil d'actualité", href: "/actualites", icon: Newspaper }, // TODO: réactiver quand la page sera enrichie
  { name: "Boutique", href: "/boutique", icon: ShoppingCart },
  { name: "Mon Compte", href: "/mon-compte", icon: User },
]
