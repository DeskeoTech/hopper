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

  // Fetch photos for this site
  const { data: photos } = await supabase.from("site_photos").select("*").eq("site_id", id).order("created_at")

  // Build public URLs for photos
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photoUrls = photos?.map((photo) => ({
    ...photo,
    url: `${supabaseUrl}/storage/v1/object/public/site-photos/${photo.storage_path}`,
  })) || []

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
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-accent">
            <Building2 className="h-7 w-7 text-brand-accent-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
              <StatusBadge status={site.status} size="md" />
            </div>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{site.address}</span>
            </div>
          </div>
        </div>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info - Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Site Images */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {photoUrls.length > 0 ? (
              <div className="relative">
                <img
                  src={photoUrls[0].url}
                  alt={photoUrls[0].filename || site.name}
                  className="h-64 w-full object-cover"
                />
                {photoUrls.length > 1 && (
                  <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto pb-2">
                    {photoUrls.slice(1, 5).map((photo, index) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={photo.filename || `${site.name} - ${index + 2}`}
                        className="h-16 w-24 rounded-lg object-cover border-2 border-card shadow-md"
                      />
                    ))}
                    {photoUrls.length > 5 && (
                      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-black/60 text-white text-sm font-medium">
                        +{photoUrls.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-brand-muted">
                <div className="text-center text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-2" />
                  <p>Aucune photo</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions & Access */}
          {(site.instructions || site.access) && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-brand-accent" />
                Instructions & Accès
              </h2>
              <div className="space-y-4">
                {site.instructions && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Instructions</h3>
                    <p className="mt-1 text-foreground whitespace-pre-wrap">{site.instructions}</p>
                  </div>
                )}
                {site.access && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Accès</h3>
                    <p className="mt-1 text-foreground">{site.access}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Building2 className="h-5 w-5 text-brand-accent" />
              Ressources ({resources?.length || 0})
            </h2>

            {resourcesByType && Object.keys(resourcesByType).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(resourcesByType).map(([type, typeResources]) => (
                  <div key={type}>
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
              <p className="text-muted-foreground">Aucune ressource pour ce site</p>
            )}
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Opening Hours */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Clock className="h-5 w-5 text-brand-accent" />
              Horaires
            </h2>
            <div className="space-y-3">
              {site.opening_hours && (
                <div>
                  <span className="text-sm text-muted-foreground">Heures d'ouverture</span>
                  <p className="font-medium text-foreground">{site.opening_hours}</p>
                </div>
              )}
              {site.opening_days && site.opening_days.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Jours d'ouverture</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {site.opening_days.map((day) => (
                      <span key={day} className="rounded bg-brand-muted px-2 py-1 text-xs font-medium text-foreground">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!site.opening_hours && (!site.opening_days || site.opening_days.length === 0) && (
                <p className="text-muted-foreground text-sm">Non renseigné</p>
              )}
            </div>
          </div>

          {/* WiFi */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Wifi className="h-5 w-5 text-brand-accent" />
              WiFi
            </h2>
            {site.wifi_ssid ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">SSID</span>
                  <p className="font-mono font-medium text-foreground">{site.wifi_ssid}</p>
                </div>
                {site.wifi_password && (
                  <div>
                    <span className="text-sm text-muted-foreground">Mot de passe</span>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <p className="font-mono font-medium text-foreground">{site.wifi_password}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Non renseigné</p>
            )}
          </div>

          {/* Equipments */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Calendar className="h-5 w-5 text-brand-accent" />
              Équipements
            </h2>
            {site.equipments && site.equipments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {site.equipments.map((equipment) => (
                  <EquipmentBadge key={equipment} equipment={equipment} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun équipement renseigné</p>
            )}
          </div>

          {/* Coordinates */}
          {(site.latitude || site.longitude) && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <MapPin className="h-5 w-5 text-brand-accent" />
                Coordonnées GPS
              </h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Latitude:</span>{" "}
                  <span className="font-mono">{site.latitude}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Longitude:</span>{" "}
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
