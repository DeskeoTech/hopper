import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/admin/status-badge"
import { EquipmentBadge } from "@/components/admin/equipment-badge"
import { ResourceCard } from "@/components/admin/resource-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Clock, Wifi, Key, Calendar, FileText, Edit, Building2 } from "lucide-react"

interface SiteDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function SiteDetailsPage({ params }: SiteDetailsPageProps) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  // Fetch site data
  const { data: site, error } = await supabase.from("sites").select("*").eq("id", id).single()

  if (error || !site) {
    notFound()
  }

  // Fetch resources for this site
  const { data: resources } = await supabase.from("resources").select("*").eq("site_id", id).order("type").order("name")

  // Group resources by type
  const resourcesByType = resources?.reduce(
    (acc, resource) => {
      const type = resource.type
      if (!acc[type]) acc[type] = []
      acc[type].push(resource)
      return acc
    },
    {} as Record<string, typeof resources>,
  )

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#C5A572]">
            <Building2 className="h-7 w-7 text-[#1A1A1A]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">{site.name}</h1>
              <StatusBadge status={site.status} size="md" />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[#1A1A1A]/60">
              <MapPin className="h-4 w-4" />
              <span>{site.address}</span>
            </div>
          </div>
        </div>
        <Button className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info - Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Site Image */}
          <div className="overflow-hidden rounded-xl border border-[#1A1A1A]/10 bg-white">
            <img
              src={`/placeholder.svg?height=300&width=800&query=modern coworking space interior ${site.name}`}
              alt={site.name}
              className="h-64 w-full object-cover"
            />
          </div>

          {/* Instructions & Access */}
          {(site.instructions || site.access) && (
            <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
                <FileText className="h-5 w-5 text-[#C5A572]" />
                Instructions & Accès
              </h2>
              <div className="space-y-4">
                {site.instructions && (
                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A]/60">Instructions</h3>
                    <p className="mt-1 text-[#1A1A1A] whitespace-pre-wrap">{site.instructions}</p>
                  </div>
                )}
                {site.access && (
                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A]/60">Accès</h3>
                    <p className="mt-1 text-[#1A1A1A]">{site.access}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources */}
          <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
              <Building2 className="h-5 w-5 text-[#C5A572]" />
              Ressources ({resources?.length || 0})
            </h2>

            {resourcesByType && Object.keys(resourcesByType).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(resourcesByType).map(([type, typeResources]) => (
                  <div key={type}>
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                      {getResourceTypeLabel(type)} ({typeResources?.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {typeResources?.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#1A1A1A]/50">Aucune ressource pour ce site</p>
            )}
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Opening Hours */}
          <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
              <Clock className="h-5 w-5 text-[#C5A572]" />
              Horaires
            </h2>
            <div className="space-y-3">
              {site.opening_hours && (
                <div>
                  <span className="text-sm text-[#1A1A1A]/60">Heures d'ouverture</span>
                  <p className="font-medium text-[#1A1A1A]">{site.opening_hours}</p>
                </div>
              )}
              {site.opening_days && site.opening_days.length > 0 && (
                <div>
                  <span className="text-sm text-[#1A1A1A]/60">Jours d'ouverture</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {site.opening_days.map((day) => (
                      <span key={day} className="rounded bg-[#F5F1EB] px-2 py-1 text-xs font-medium text-[#1A1A1A]">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!site.opening_hours && (!site.opening_days || site.opening_days.length === 0) && (
                <p className="text-[#1A1A1A]/50 text-sm">Non renseigné</p>
              )}
            </div>
          </div>

          {/* WiFi */}
          <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
              <Wifi className="h-5 w-5 text-[#C5A572]" />
              WiFi
            </h2>
            {site.wifi_ssid ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[#1A1A1A]/60">SSID</span>
                  <p className="font-mono font-medium text-[#1A1A1A]">{site.wifi_ssid}</p>
                </div>
                {site.wifi_password && (
                  <div>
                    <span className="text-sm text-[#1A1A1A]/60">Mot de passe</span>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-[#1A1A1A]/40" />
                      <p className="font-mono font-medium text-[#1A1A1A]">{site.wifi_password}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[#1A1A1A]/50 text-sm">Non renseigné</p>
            )}
          </div>

          {/* Equipments */}
          <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
              <Calendar className="h-5 w-5 text-[#C5A572]" />
              Équipements
            </h2>
            {site.equipments && site.equipments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {site.equipments.map((equipment) => (
                  <EquipmentBadge key={equipment} equipment={equipment} />
                ))}
              </div>
            ) : (
              <p className="text-[#1A1A1A]/50 text-sm">Aucun équipement renseigné</p>
            )}
          </div>

          {/* Coordinates */}
          {(site.latitude || site.longitude) && (
            <div className="rounded-xl border border-[#1A1A1A]/10 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1A1A1A]">
                <MapPin className="h-5 w-5 text-[#C5A572]" />
                Coordonnées GPS
              </h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-[#1A1A1A]/60">Latitude:</span>{" "}
                  <span className="font-mono">{site.latitude}</span>
                </p>
                <p>
                  <span className="text-[#1A1A1A]/60">Longitude:</span>{" "}
                  <span className="font-mono">{site.longitude}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bench: "Postes en open space",
    meeting_room: "Salles de réunion",
    flex_desk: "Bureaux flexibles",
    fixed_desk: "Bureaux fixes",
  }
  return labels[type] || type
}
