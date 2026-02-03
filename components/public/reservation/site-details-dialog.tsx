"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Image as ImageIcon,
  Clock,
  MapPin,
  TrainFront,
  Star,
  Briefcase,
  ExternalLink,
  Coffee,
  Sun,
  Wifi,
  Phone,
  Monitor,
  Printer,
  UtensilsCrossed,
  Flame,
  Bike,
  Droplets,
  Zap,
  Users,
  Dumbbell,
  Building,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Site, Equipment, DayOfWeek } from "@/lib/types/database"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
  meetingRoomsCount?: number
}

interface SiteDetailsDialogProps {
  site: SiteWithPhotos | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBook: (site: SiteWithPhotos) => void
}

const TABS = [
  { id: "about", label: "À propos" },
  { id: "access", label: "Accès & équipements" },
  { id: "workspace", label: "Espaces de travail" },
]

const METRO_COLORS: Record<string, string> = {
  "1": "#FFCD00",
  "2": "#003CA6",
  "3": "#9F9825",
  "3bis": "#98D4E2",
  "4": "#CF009E",
  "5": "#F28E42",
  "6": "#6ECA97",
  "7": "#FA9ABA",
  "7bis": "#6ECA97",
  "8": "#E19BDF",
  "9": "#B6BD00",
  "10": "#C9910D",
  "11": "#704B1C",
  "12": "#007852",
  "13": "#6EC4E8",
  "14": "#62259D",
}

const DAYS_ORDER: DayOfWeek[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
const DAYS_LABELS: Record<DayOfWeek, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
}

function getEquipmentIcon(equipment: string): React.ReactNode {
  const eq = equipment.toLowerCase()
  if (eq.includes("barista") || eq.includes("café") || eq.includes("coffee")) return <Coffee className="h-4 w-4" />
  if (eq.includes("terrasse") || eq.includes("extérieur") || eq.includes("rooftop")) return <Sun className="h-4 w-4" />
  if (eq.includes("wifi") || eq.includes("internet")) return <Wifi className="h-4 w-4" />
  if (eq.includes("phone") || eq.includes("cabine") || eq.includes("téléphone")) return <Phone className="h-4 w-4" />
  if (eq.includes("écran") || eq.includes("monitor") || eq.includes("tv")) return <Monitor className="h-4 w-4" />
  if (eq.includes("imprimante") || eq.includes("print") || eq.includes("impression")) return <Printer className="h-4 w-4" />
  if (eq.includes("restauration") || eq.includes("restaurant")) return <UtensilsCrossed className="h-4 w-4" />
  if (eq.includes("micro") || eq.includes("ondes") || eq.includes("chauff")) return <Flame className="h-4 w-4" />
  if (eq.includes("vélo") || eq.includes("bike")) return <Bike className="h-4 w-4" />
  if (eq.includes("fontaine") || eq.includes("eau") || eq.includes("water") || eq.includes("douche")) return <Droplets className="h-4 w-4" />
  if (eq.includes("sport") || eq.includes("gym")) return <Dumbbell className="h-4 w-4" />
  return <Zap className="h-4 w-4" />
}

const equipmentLabels: Record<Equipment, string> = {
  barista: "Barista / Café",
  stationnement_velo: "Parking vélo",
  impression: "Imprimante",
  douches: "Douches",
  salle_sport: "Salle de sport",
  terrasse: "Terrasse",
  rooftop: "Rooftop",
}

function extractMetroLines(access: string | null): string[] {
  if (!access) return []
  const matches = access.match(/\b(\d{1,2}(?:bis)?)\b/gi) || []
  return [...new Set(matches.filter((m) => METRO_COLORS[m.toLowerCase()]))]
}

// Collapsible Accordion Component
function Accordion({
  icon,
  label,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] pb-4" : "max-h-0"
        )}
      >
        <div className="pl-9">{children}</div>
      </div>
    </div>
  )
}

export function SiteDetailsDialog({ site, open, onOpenChange, onBook }: SiteDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("about")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [fullscreenPhoto, setFullscreenPhoto] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const photos = site?.photos.length ? site.photos : []

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const scrollTop = contentRef.current.scrollTop
      let currentSection = "about"

      for (const tab of TABS) {
        const section = sectionRefs.current[tab.id]
        if (section && section.offsetTop - 100 <= scrollTop) {
          currentSection = tab.id
        }
      }

      setActiveTab(currentSection)
    }

    const content = contentRef.current
    content?.addEventListener("scroll", handleScroll)
    return () => content?.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = useCallback((sectionId: string) => {
    const section = sectionRefs.current[sectionId]
    if (section && contentRef.current) {
      contentRef.current.scrollTo({
        top: section.offsetTop - 80,
        behavior: "smooth",
      })
    }
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setCurrentPhotoIndex(0)
    setFullscreenPhoto(false)
    setShowFullDescription(false)
    setActiveTab("about")
  }, [onOpenChange])

  if (!site) return null

  const description = site.instructions || ""
  const truncatedDescription = description.length > 200 ? description.slice(0, 200) + "..." : description
  const metroLines = extractMetroLines(site.access)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`

  return (
    <>
      <Dialog open={open && !fullscreenPhoto} onOpenChange={handleClose}>
        <DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{site.name} - Détails du site</DialogTitle>
          </VisuallyHidden>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3 md:py-4">
            <Button variant="ghost" size="sm" onClick={handleClose} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <Button size="lg" className="font-bold" onClick={() => onBook(site)}>
              RÉSERVER
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="sticky top-0 z-10 flex gap-6 border-b border-border bg-background px-4 md:px-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 py-3 text-xs md:text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            {/* Photo Gallery */}
            {photos.length > 0 && (
              <div className="p-4 md:p-6">
                <div className="flex gap-2 h-[250px] md:h-[380px]">
                  {/* Main Photo */}
                  <div
                    className="relative flex-[2] rounded-2xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setFullscreenPhoto(true)}
                  >
                    <Image
                      src={photos[0]}
                      alt={`${site.name} - Photo principale`}
                      fill
                      className="object-cover"
                    />
                    {photos.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFullscreenPhoto(true)
                        }}
                        className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-4 py-2 text-sm font-medium shadow-sm"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Afficher les {photos.length} photos
                      </button>
                    )}
                  </div>

                  {/* Thumbnails (Desktop) */}
                  {photos.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 flex-1">
                      {photos.slice(1, 4).map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPhotoIndex(index + 1)
                            setFullscreenPhoto(true)
                          }}
                          className="relative flex-1 rounded-2xl overflow-hidden bg-muted"
                        >
                          <Image src={photo} alt="" fill className="object-cover" />
                          {index === 2 && photos.length > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-bold">
                              +{photos.length - 4}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Section */}
            <div
              ref={(el) => { sectionRefs.current["about"] = el }}
              className="border-b border-border p-4 md:p-6"
            >
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{site.name}</h2>
              {description && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {showFullDescription ? description : truncatedDescription}
                  </p>
                  {description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      {showFullDescription ? "Afficher moins" : "Afficher plus"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Access & Equipment Section */}
            <div
              ref={(el) => { sectionRefs.current["access"] = el }}
              className="border-b border-border p-4 md:p-6"
            >
              {/* Opening Hours */}
              {site.opening_hours && (
                <Accordion icon={<Clock className="h-5 w-5" />} label="Heures d'ouverture">
                  <div className="space-y-2 md:max-w-[240px]">
                    {(site.opening_days || DAYS_ORDER.slice(0, 5)).map((day) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span>{DAYS_LABELS[day]}</span>
                        <span className="text-muted-foreground">{site.opening_hours}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Location */}
              <Accordion icon={<MapPin className="h-5 w-5" />} label="Localisation">
                <div className="space-y-3">
                  {site.latitude && site.longitude && (
                    <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-muted">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${site.latitude},${site.longitude}&zoom=15`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {site.address}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Accordion>

              {/* Metro Access */}
              {metroLines.length > 0 && (
                <Accordion icon={<TrainFront className="h-5 w-5" />} label="Accès Métro">
                  <div className="flex flex-wrap gap-2">
                    {metroLines.map((line) => (
                      <div
                        key={line}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: METRO_COLORS[line.toLowerCase()] || "#666",
                          color: ["1", "9"].includes(line) ? "#000" : "#fff",
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                  {site.access && (
                    <p className="mt-2 text-sm text-muted-foreground">{site.access}</p>
                  )}
                </Accordion>
              )}

              {/* Services */}
              {site.equipments && site.equipments.length > 0 && (
                <Accordion icon={<Star className="h-5 w-5" />} label="Services inclus">
                  <div className="space-y-1">
                    {site.equipments.map((equipment) => (
                      <div key={equipment} className="flex items-center gap-2 py-2 text-sm">
                        <span className="text-muted-foreground">{getEquipmentIcon(equipment)}</span>
                        {equipmentLabels[equipment] || equipment}
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}
            </div>

            {/* Workspace Section */}
            <div
              ref={(el) => { sectionRefs.current["workspace"] = el }}
              className="p-4 md:p-6"
            >
              <Accordion icon={<Briefcase className="h-5 w-5" />} label="Espaces de travail">
                <div className="flex flex-wrap gap-2">
                  {site.capacity > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#1B1918] px-3 py-2 text-[#F1E8DC] text-sm font-medium">
                      <Users className="h-4 w-4" />
                      {site.capacity} postes
                    </div>
                  )}
                  {site.meetingRoomsCount && site.meetingRoomsCount > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#1B1918] px-3 py-2 text-[#F1E8DC] text-sm font-medium">
                      <Building className="h-4 w-4" />
                      {site.meetingRoomsCount} salles de réunion
                    </div>
                  )}
                </div>
              </Accordion>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Gallery */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <button
            onClick={() => setFullscreenPhoto(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                className="absolute left-4 rounded-full bg-white/10 p-3 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 rounded-full bg-white/10 p-3 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Current Photo */}
          <div className="relative h-[70vh] w-[80vw]">
            <Image
              src={photos[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            {currentPhotoIndex + 1} / {photos.length}
          </div>

          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={cn(
                    "relative h-12 w-16 flex-shrink-0 rounded overflow-hidden",
                    currentPhotoIndex === index && "ring-2 ring-white"
                  )}
                >
                  <Image src={photo} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
