"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
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
  Armchair,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { HopperResidenceModal } from "./hopper-residence-modal"
import { cn } from "@/lib/utils"
import { MetroLineBadge } from "@/components/ui/metro-line-badge"
import { groupTransportByStation } from "@/lib/utils/transportation"
import type { Site, DayOfWeek, TransportationStop } from "@/lib/types/database"

const SiteLocationMap = dynamic(
  () => import("./site-location-map").then((m) => ({ default: m.SiteLocationMap })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-2xl bg-muted animate-pulse" />,
  }
)

interface MeetingRoom {
  id: string
  name: string
  capacity: number | null
  photoUrls: string[]
}

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
  meetingRoomsCount?: number
  meetingRooms?: MeetingRoom[]
}

interface SiteDetailsDialogProps {
  site: SiteWithPhotos | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBook: (site: SiteWithPhotos) => void
}


const DAYS_ORDER: DayOfWeek[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]

// Convert French time format (9h00 - 19h00) to English AM/PM format
function formatHoursForLocale(hours: string, locale: string): string {
  if (locale !== "en") return hours
  const timeRegex = /(\d{1,2})h(\d{2})?/g
  return hours.replace(timeRegex, (_match, hour, minutes) => {
    const h = parseInt(hour, 10)
    const m = minutes || "00"
    if (h === 0) return `12:${m} AM`
    if (h === 12) return `12:${m} PM`
    if (h < 12) return `${h}:${m} AM`
    return `${h - 12}:${m} PM`
  })
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
  const t = useTranslations("reservation")
  const tEquip = useTranslations("equipmentDetails")
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState("about")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [fullscreenPhoto, setFullscreenPhoto] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [residenceModalOpen, setResidenceModalOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const TABS = useMemo(() => [
    { id: "about", label: t("siteDetails.tabAbout") },
    { id: "access", label: t("siteDetails.tabAccess") },
    { id: "workspace", label: t("siteDetails.tabWorkspace") },
  ], [t])

  const photos = site?.photos.length ? site.photos : []

  // Scroll spy via callback ref — s'attache dès que le DOM est disponible
  const scrollListenerRef = useRef<(() => void) | null>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    // Nettoyer l'ancien listener
    if (scrollListenerRef.current && contentRef.current) {
      contentRef.current.removeEventListener("scroll", scrollListenerRef.current)
      scrollListenerRef.current = null
    }

    contentRef.current = node

    if (!node) return

    const handleScroll = () => {
      if (isScrollingRef.current) return

      const containerRect = node.getBoundingClientRect()
      const threshold = containerRect.top + 120

      // Si on est scrollé tout en bas, activer le dernier onglet
      if (Math.abs(node.scrollHeight - node.scrollTop - node.clientHeight) < 2) {
        setActiveTab(TABS[TABS.length - 1].id)
        return
      }

      let currentSection = TABS[0].id
      for (const tab of TABS) {
        const section = sectionRefs.current[tab.id]
        if (section) {
          const sectionRect = section.getBoundingClientRect()
          if (sectionRect.top <= threshold) {
            currentSection = tab.id
          }
        }
      }

      setActiveTab(currentSection)
    }

    scrollListenerRef.current = handleScroll
    node.addEventListener("scroll", handleScroll, { passive: true })
  }, [TABS])

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveTab(sectionId)
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    isScrollingRef.current = true
    const section = sectionRefs.current[sectionId]
    const content = contentRef.current
    if (section && content) {
      const containerRect = content.getBoundingClientRect()
      const sectionRect = section.getBoundingClientRect()
      const scrollOffset = sectionRect.top - containerRect.top + content.scrollTop - 80
      content.scrollTo({
        top: scrollOffset,
        behavior: "smooth",
      })
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
    }, 800)
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setCurrentPhotoIndex(0)
    setFullscreenPhoto(false)
    setShowFullDescription(false)
    setActiveTab("about")
  }, [onOpenChange])

  if (!site) return null

  const description = (locale === 'en' && site.description_en) ? site.description_en : (site.description || "")
  const truncatedDescription = description.length > 200 ? description.slice(0, 200) + "..." : description
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`

  return (
    <>
      <Dialog open={open && !fullscreenPhoto} onOpenChange={handleClose}>
        <DialogContent className="flex flex-col max-w-[90vw] md:max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{t("siteDetails.title", { siteName: site.name })}</DialogTitle>
          </VisuallyHidden>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3 md:py-4">
            <Button variant="ghost" size="sm" onClick={handleClose} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("siteDetails.back")}</span>
            </Button>
            <Button size="lg" className="rounded-full font-bold" onClick={() => onBook(site)}>
              {t("siteDetails.bookButton")}
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="sticky top-0 z-10 flex gap-6 border-b border-border bg-background px-4 md:px-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 py-3 text-xs md:text-sm transition-colors duration-200",
                  activeTab === tab.id
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div ref={setContentRef} className="flex-1 overflow-y-auto">
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
                        {t("siteDetails.showPhotos", { count: photos.length })}
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
                      {showFullDescription ? t("siteDetails.showLess") : t("siteDetails.showMore")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Access & Equipment Section */}
            <div
              ref={(el) => { sectionRefs.current["access"] = el }}
              className="border-b border-border p-4 md:p-6 [&>div:last-child]:border-b-0"
            >
              {/* Opening Hours */}
              {site.opening_hours && (
                <Accordion icon={<Clock className="h-5 w-5" />} label={t("siteDetails.openingHours")}>
                  <div className="space-y-2 md:max-w-[240px]">
                    {(site.opening_days || DAYS_ORDER.slice(0, 5)).map((day) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span>{t(`days.${day}`)}</span>
                        <span className="text-muted-foreground">{formatHoursForLocale(site.opening_hours!, locale)}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Location */}
              <Accordion icon={<MapPin className="h-5 w-5" />} label={t("siteDetails.location")}>
                <div className="space-y-3">
                  {site.latitude && site.longitude && (
                    <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-muted">
                      <SiteLocationMap lat={site.latitude} lng={site.longitude} />
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
              {site.transportation_lines && site.transportation_lines.length > 0 && (
                <Accordion icon={<TrainFront className="h-5 w-5" />} label={t("siteDetails.metroAccess")}>
                  <div className="space-y-2">
                    {groupTransportByStation(site.transportation_lines as TransportationStop[]).map(({ station, lines }) => (
                      <div key={station} className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {lines.map((line) => (
                            <MetroLineBadge key={line} line={line} size="sm" />
                          ))}
                        </div>
                        <span className="text-sm">{station}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Services */}
              {site.equipments && site.equipments.length > 0 && (
                <Accordion icon={<Star className="h-5 w-5" />} label={t("siteDetails.includedServices")}>
                  <div className="space-y-1">
                    {site.equipments.map((equipment) => (
                      <div key={equipment} className="flex items-center gap-2 py-2 text-sm">
                        <span className="text-muted-foreground">{getEquipmentIcon(equipment)}</span>
                        {tEquip(equipment)}
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
              <Accordion icon={<Briefcase className="h-5 w-5" />} label={t("siteDetails.workspaces")}>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {site.capacity > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#1B1918] px-3 py-2 text-[#F1E8DC] text-sm font-medium">
                        <Armchair className="h-4 w-4" />
                        {t("siteDetails.seats", { count: site.capacity })}
                      </div>
                    )}
                    {(site.meetingRoomsCount ?? 0) > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#1B1918] px-3 py-2 text-[#F1E8DC] text-sm font-medium">
                        <Building className="h-4 w-4" />
                        {t("siteDetails.meetingRooms", { count: site.meetingRoomsCount ?? 0 })}
                      </div>
                    )}
                  </div>

                  {/* Meeting Room Cards */}
                  {site.meetingRooms && site.meetingRooms.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                      {site.meetingRooms.map((room) => (
                        <div key={room.id} className="w-48 flex-shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                          <div className="relative h-24 bg-muted">
                            {room.photoUrls.length > 0 ? (
                              <Image
                                src={room.photoUrls[0]}
                                alt={room.name}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Monitor className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="truncate text-sm font-semibold">{room.name}</h4>
                            {room.capacity && (
                              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="text-xs">{t("siteDetails.persons", { count: room.capacity })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion>

              {/* Hopper Residence CTA */}
              <div
                className="mt-4 rounded-2xl p-5 cursor-pointer transition-all hover:opacity-90"
                style={{ backgroundColor: "#D4C4B0" }}
                onClick={() => setResidenceModalOpen(true)}
              >
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">
                  {t("siteDetails.residenceTitle")}
                </h3>
                <p className="font-editorial text-base text-foreground mb-3">
                  {t("siteDetails.residenceTagline")}
                </p>
                <Button size="sm" className="rounded-full font-bold">
                  {t("siteDetails.learnMore")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <HopperResidenceModal open={residenceModalOpen} onOpenChange={setResidenceModalOpen} />

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
