"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight, Upload, X, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSite, uploadSitePhoto } from "@/lib/actions/sites"
import type { SiteStatus, Equipment, DayOfWeek } from "@/lib/types/database"

const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: "lundi", label: "Lundi" },
  { id: "mardi", label: "Mardi" },
  { id: "mercredi", label: "Mercredi" },
  { id: "jeudi", label: "Jeudi" },
  { id: "vendredi", label: "Vendredi" },
  { id: "samedi", label: "Samedi" },
  { id: "dimanche", label: "Dimanche" },
]

const EQUIPMENT_OPTIONS: { id: Equipment; label: string }[] = [
  { id: "barista", label: "Barista" },
  { id: "stationnement_velo", label: "Parking vélos" },
  { id: "impression", label: "Impression" },
  { id: "douches", label: "Douches" },
  { id: "salle_sport", label: "Salle de sport" },
  { id: "terrasse", label: "Terrasse" },
  { id: "rooftop", label: "Rooftop" },
  { id: "cafe", label: "Café" },
  { id: "phonebooth", label: "Phonebooth" },
  { id: "fontaine_eau", label: "Fontaine à eau" },
  { id: "micro_ondes", label: "Micro-ondes" },
  { id: "restauration", label: "Restauration" },
  { id: "wifi", label: "Wifi" },
]

interface FormData {
  // Step 1
  name: string
  address: string
  status: SiteStatus
  access: string
  instructions: string
  wifi_ssid: string
  wifi_password: string
  is_nomad: boolean
  // Step 2
  opening_days: DayOfWeek[]
  opening_hours: string
  equipments: Equipment[]
  // Step 3
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  photos: File[]
}

const initialFormData: FormData = {
  name: "",
  address: "",
  status: "open",
  access: "",
  instructions: "",
  wifi_ssid: "",
  wifi_password: "",
  is_nomad: false,
  opening_days: [],
  opening_hours: "",
  equipments: [],
  contact_first_name: "",
  contact_last_name: "",
  contact_email: "",
  contact_phone: "",
  photos: [],
}

export function CreateSiteModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const totalSteps = 3

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const toggleDay = (day: DayOfWeek) => {
    setFormData((prev) => ({
      ...prev,
      opening_days: prev.opening_days.includes(day)
        ? prev.opening_days.filter((d) => d !== day)
        : [...prev.opening_days, day],
    }))
  }

  const toggleEquipment = (equipment: Equipment) => {
    setFormData((prev) => ({
      ...prev,
      equipments: prev.equipments.includes(equipment)
        ? prev.equipments.filter((e) => e !== equipment)
        : [...prev.equipments, equipment],
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos = Array.from(files)
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Le nom est obligatoire"
      }
      if (!formData.address.trim()) {
        newErrors.address = "L'adresse est obligatoire"
      }
    }

    if (currentStep === 3) {
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = "Email invalide"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setIsSubmitting(true)

    const result = await createSite({
      name: formData.name,
      address: formData.address,
      status: formData.status,
      access: formData.access || null,
      instructions: formData.instructions || null,
      wifi_ssid: formData.wifi_ssid || null,
      wifi_password: formData.wifi_password || null,
      is_nomad: formData.is_nomad,
      opening_days: formData.opening_days.length > 0 ? formData.opening_days : null,
      opening_hours: formData.opening_hours || null,
      equipments: formData.equipments.length > 0 ? formData.equipments : null,
      contact_first_name: formData.contact_first_name || null,
      contact_last_name: formData.contact_last_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
    })

    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
      return
    }

    // Upload photos if any
    if (result.siteId && formData.photos.length > 0) {
      for (const photo of formData.photos) {
        const photoFormData = new FormData()
        photoFormData.append("file", photo)
        await uploadSitePhoto(result.siteId, photoFormData)
      }
    }

    toast.success("Site créé avec succès")
    setIsSubmitting(false)
    handleClose()

    if (result.siteId) {
      router.push(`/admin/sites/${result.siteId}`)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setStep(1)
    setErrors({})
    setOpen(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose()
    } else {
      setOpen(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau site</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau site</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`h-0.5 w-8 ${s < step ? "bg-primary/20" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {step === 1 && "Informations de base"}
            {step === 2 && "Horaires & Équipements"}
            {step === 3 && "Photos & Contact"}
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nom du site"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => updateFormData("status", v as SiteStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Adresse <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Adresse du site"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="access">Accès (métros, transports)</Label>
                <Input
                  id="access"
                  placeholder="Ex: Métro Bastille (lignes 1, 5, 8)"
                  value={formData.access}
                  onChange={(e) => updateFormData("access", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Instructions pour accéder au site..."
                  value={formData.instructions}
                  onChange={(e) => updateFormData("instructions", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wifi_ssid">WiFi SSID</Label>
                  <Input
                    id="wifi_ssid"
                    placeholder="Nom du réseau WiFi"
                    value={formData.wifi_ssid}
                    onChange={(e) => updateFormData("wifi_ssid", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifi_password">Mot de passe WiFi</Label>
                  <Input
                    id="wifi_password"
                    placeholder="Mot de passe"
                    value={formData.wifi_password}
                    onChange={(e) => updateFormData("wifi_password", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-4">
                <Switch
                  id="is_nomad"
                  checked={formData.is_nomad}
                  onCheckedChange={(checked) => updateFormData("is_nomad", checked)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_nomad" className="cursor-pointer">
                    Site Nomad
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Cocher si ce site fait partie du réseau Nomad
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hours & Equipment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Jours d'ouverture</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={formData.opening_days.includes(day.id)}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <Label htmlFor={day.id} className="cursor-pointer font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening_hours">Heures d'ouverture</Label>
                <Input
                  id="opening_hours"
                  placeholder="Ex: 9h00 - 18h00"
                  value={formData.opening_hours}
                  onChange={(e) => updateFormData("opening_hours", e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Équipements</Label>
                <div className="grid grid-cols-2 gap-3">
                  {EQUIPMENT_OPTIONS.map((equipment) => (
                    <div key={equipment.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment.id}
                        checked={formData.equipments.includes(equipment.id)}
                        onCheckedChange={() => toggleEquipment(equipment.id)}
                      />
                      <Label htmlFor={equipment.id} className="cursor-pointer font-normal">
                        {equipment.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos & Contact */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Photos */}
              <div className="space-y-4">
                <Label>Photos du site</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <span className="mt-1 block text-xs text-muted-foreground">Ajouter</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Contact du site</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_first_name">Prénom</Label>
                    <Input
                      id="contact_first_name"
                      placeholder="Prénom"
                      value={formData.contact_first_name}
                      onChange={(e) => updateFormData("contact_first_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_last_name">Nom</Label>
                    <Input
                      id="contact_last_name"
                      placeholder="Nom"
                      value={formData.contact_last_name}
                      onChange={(e) => updateFormData("contact_last_name", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="email@exemple.com"
                      value={formData.contact_email}
                      onChange={(e) => updateFormData("contact_email", e.target.value)}
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-destructive">{errors.contact_email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Téléphone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData("contact_phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            {step < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le site"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
