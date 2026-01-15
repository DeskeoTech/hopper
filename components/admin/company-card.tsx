import Link from "next/link"
import { Users, Mail, MapPin, Briefcase } from "lucide-react"
import type { Company } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface CompanyCardProps {
  company: Company
  userCount: number
  siteCount: number
}

export function CompanyCard({ company, userCount, siteCount }: CompanyCardProps) {
  const companyTypeLabel = company.company_type === "self_employed" ? "Indépendant" : "Multi-employés"

  // Determine subscription status
  const now = new Date()
  const endDate = company.subscription_end_date ? new Date(company.subscription_end_date) : null
  const isActive = !endDate || endDate > now

  return (
    <Link href={`/admin/clients/${company.id}`} className="group block">
      <article className="overflow-hidden rounded-lg bg-card transition-all hover:shadow-md">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <Briefcase className="h-5 w-5 text-foreground/60" />
              </div>
              <div>
                <h3 className="font-header text-lg text-foreground transition-colors group-hover:text-brand">
                  {company.name || "Sans nom"}
                </h3>
                {company.company_type && (
                  <span className="text-xs text-muted-foreground">{companyTypeLabel}</span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-medium",
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {isActive ? "Actif" : "Inactif"}
            </span>
          </div>

          {/* Contact info */}
          {(company.contact_email || company.address) && (
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {company.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{company.contact_email}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{company.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{userCount} utilisateur{userCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{siteCount} site{siteCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
