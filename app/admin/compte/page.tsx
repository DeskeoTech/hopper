import {
  UserCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from "lucide-react"
import { createClient, getUser } from "@/lib/supabase/server"
import { AccountForm } from "@/components/admin/account/account-form"

const adminLevels = [
  {
    icon: UserCircle,
    name: "Utilisateur",
    description:
      "Accès à la réservation de salles de réunion pour le compte de son entreprise.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    name: "Admin",
    description:
      "Peut gérer les utilisateurs de son entreprise (ajout, modification, désactivation).",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: ShieldCheck,
    name: "Super Admin",
    description:
      "Contrôle total de l'application : gestion des sites, des crédits, des entreprises et de tous les utilisateurs.",
    color: "bg-emerald-50 text-emerald-600",
  },
] as const

export default async function AdminComptePage() {
  const supabase = await createClient()
  const authUser = await getUser()

  let profile: {
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string | null
    status: string | null
    is_hopper_admin: boolean
  } | null = null

  if (authUser?.email) {
    const { data } = await supabase
      .from("users")
      .select("first_name, last_name, email, role, status, is_hopper_admin")
      .eq("email", authUser.email)
      .eq("is_hopper_admin", true)
      .single()
    profile = data
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Informations personnelles */}
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Informations personnelles</h2>
        <AccountForm
          firstName={profile?.first_name ?? null}
          lastName={profile?.last_name ?? null}
          email={profile?.email ?? null}
          role={profile?.role ?? null}
          status={profile?.status ?? null}
          isHopperAdmin={profile?.is_hopper_admin ?? false}
        />
      </div>

      {/* Niveaux d'administration */}
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Niveaux d&apos;administration</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Hopper Coworking dispose de 3 niveaux d&apos;accès :
        </p>
        <div className="space-y-3">
          {adminLevels.map((level) => (
            <div key={level.name} className="flex items-start gap-3 rounded-md border p-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${level.color}`}
              >
                <level.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{level.name}</p>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assistance */}
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ShieldAlert className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Besoin d&apos;aide ?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pour toute assistance, contactez la Team Tech Deskeo via le formulaire dédié.
            </p>
            <a
              href="https://form.deskeo.com/demande-tech-product"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Contacter la Team Tech
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
