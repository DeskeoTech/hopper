"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Building2, Mail, Phone, MapPin, Loader2, Armchair, Coins,
  ChevronLeft, ChevronRight, Check, CreditCard, Globe, DoorOpen, Info,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createCompany } from "@/lib/actions/companies"
import type { CompanyType } from "@/lib/types/database"

type ClientType = "platform" | "off_platform" | "meeting_room_only"

interface CreateCompanyModalProps {
  sites: { id: string; name: string | null }[]
}

const STEP_LABELS = [
  "Informations",
  "Coordonnées",
  "Type de client",
  "Crédits & Contrat",
]

const TOTAL_STEPS = 4

export function CreateCompanyModal({ sites }: CreateCompanyModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Step 1 — Informations
  const [name, setName] = useState("")
  const [companyType, setCompanyType] = useState<CompanyType | "none">("none")
  const [mainSiteId, setMainSiteId] = useState("")

  // Step 2 — Coordonnées
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  // Step 3 — Type de client
  const [clientType, setClientType] = useState<ClientType>("platform")

  // Step 3 — Off-platform fields
  const [sbPlanName, setSbPlanName] = useState("")
  const [sbPricePerSeat, setSbPricePerSeat] = useState("")
  const [sbCreditsPerPerson, setSbCreditsPerPerson] = useState("")
  const [sbSeats, setSbSeats] = useState("")
  const [sbStartDate, setSbStartDate] = useState("")

  // Step 4 — Crédits & Contrat
  const [numberOfSeats, setNumberOfSeats] = useState("")
  const [initialCredits, setInitialCredits] = useState("")

  const siteOptions = sites.map((s) => ({ value: s.id, label: s.name || "Sans nom" }))
  const selectedSiteName = sites.find((s) => s.id === mainSiteId)?.name

  // Computed totals for off-platform summary
  const sbTotals = useMemo(() => {
    const seats = sbSeats ? parseInt(sbSeats, 10) : 0
    const price = sbPricePerSeat ? parseFloat(sbPricePerSeat) : 0
    const credits = sbCreditsPerPerson ? parseFloat(sbCreditsPerPerson) : 0
    return {
      totalPrice: Math.round(price * seats * 100) / 100,
      totalCredits: credits * seats,
      seats,
    }
  }, [sbPricePerSeat, sbCreditsPerPerson, sbSeats])

  const seatsNum = numberOfSeats ? parseInt(numberOfSeats, 10) : 0
  const creditsNum = initialCredits ? parseInt(initialCredits, 10) : 0

  const resetForm = () => {
    setStep(1)
    setName("")
    setCompanyType("none")
    setMainSiteId("")
    setEmail("")
    setPhone("")
    setAddress("")
    setClientType("platform")
    setSbPlanName("")
    setSbPricePerSeat("")
    setSbCreditsPerPerson("")
    setSbSeats("")
    setSbStartDate("")
    setNumberOfSeats("")
    setInitialCredits("")
  }

  const validateStep = (s: number): boolean => {
    if (s === 1 && !name.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    if (!validateStep(step)) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)

    // Compute off-platform totals
    const isOffPlatform = clientType === "off_platform"
    const isMeetingRoomOnly = clientType === "meeting_room_only"
    const sbSeatsNum = sbSeats ? parseInt(sbSeats, 10) : null
    const sbPriceNum = sbPricePerSeat ? parseFloat(sbPricePerSeat) : null
    const sbCreditsNum = sbCreditsPerPerson ? parseFloat(sbCreditsPerPerson) : null
    const totalPrice = sbPriceNum !== null && sbSeatsNum
      ? Math.round(sbPriceNum * sbSeatsNum * 100) / 100
      : null
    const totalCredits = sbCreditsNum !== null && sbSeatsNum
      ? sbCreditsNum * sbSeatsNum
      : null

    const result = await createCompany({
      name: name.trim(),
      company_type: companyType === "none" ? null : companyType,
      contact_email: email || null,
      phone: phone || null,
      address: address || null,
      main_site_id: mainSiteId || null,
      numberOfSeats: isMeetingRoomOnly ? null : (numberOfSeats ? parseInt(numberOfSeats, 10) : null),
      initialCredits: initialCredits ? parseInt(initialCredits, 10) : null,
      from_spacebring: isOffPlatform,
      meeting_room_only: isMeetingRoomOnly,
      spacebring_plan_name: isOffPlatform && sbPlanName ? sbPlanName : null,
      spacebring_monthly_price: isOffPlatform ? totalPrice : null,
      spacebring_monthly_credits: isOffPlatform ? totalCredits : null,
      spacebring_seats: isOffPlatform ? sbSeatsNum : null,
      spacebring_start_date: isOffPlatform && sbStartDate ? sbStartDate : null,
    })

    setLoading(false)
    if (result.success && result.companyId) {
      resetForm()
      setOpen(false)
      setConfirmOpen(false)
      router.push(`/admin/clients/${result.companyId}`)
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  const handleClose = () => {
    resetForm()
    setOpen(false)
  }

  const clientTypeLabel = clientType === "platform"
    ? "Client plateforme"
    : clientType === "off_platform"
      ? "Client hors plateforme"
      : "Salles de réunion uniquement"

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle entreprise</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span>Nouvelle entreprise</span>
            </DialogTitle>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1 pt-4">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      s === step
                        ? "bg-primary text-primary-foreground"
                        : s < step
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s < step ? <Check className="h-3.5 w-3.5" /> : s}
                  </div>
                  {s < TOTAL_STEPS && (
                    <div className={cn("h-0.5 w-6", s < step ? "bg-primary/20" : "bg-muted")} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {STEP_LABELS[step - 1]}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 pr-1">
            {/* Step 1: Informations */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">
                    Nom de l&#39;entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Acme Corp"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-type">Type d&#39;entreprise</Label>
                  <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType | "none")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non défini</SelectItem>
                      <SelectItem value="self_employed">Indépendant</SelectItem>
                      <SelectItem value="multi_employee">Multi-employés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site principal</Label>
                  <SearchableSelect
                    options={siteOptions}
                    value={mainSiteId}
                    onValueChange={setMainSiteId}
                    placeholder="Sélectionner un site"
                    searchPlaceholder="Rechercher un site..."
                    emptyMessage="Aucun site trouvé"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Coordonnées */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Ces coordonnées correspondent à l&#39;administrateur de l&#39;entreprise. C&#39;est le contact principal, responsable de la facturation et de la gestion du compte.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="c-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@entreprise.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Téléphone
                    </Label>
                    <Input
                      id="c-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-address" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Adresse
                  </Label>
                  <Input
                    id="c-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 rue de l'exemple, 75001 Paris"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Type de client */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {/* Paiement en ligne */}
                  <button
                    type="button"
                    onClick={() => setClientType("platform")}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors",
                      clientType === "platform"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium">Paiement en ligne</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le client paie par carte ou prélèvement SEPA via Stripe. Il a accès à tous les sites ouverts.
                    </p>
                  </button>

                  {/* Facturation manuelle */}
                  <button
                    type="button"
                    onClick={() => setClientType("off_platform")}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors",
                      clientType === "off_platform"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium">Facturation manuelle</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le client est facturé manuellement (virement, chèque...). Il a accès à tous les sites ouverts mais n&#39;a pas d&#39;onglet facturation.
                    </p>
                  </button>

                  {/* Salles de réunion uniquement */}
                  <button
                    type="button"
                    onClick={() => setClientType("meeting_room_only")}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors",
                      clientType === "meeting_room_only"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-foreground" />
                      <span className="text-sm font-medium">Salles de réunion uniquement</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le client accède uniquement à la réservation de salles de réunion sur son site de référence (ex : clients Skedda). Il ne voit pas les autres sites Hopper et n&#39;a pas d&#39;onglet facturation.
                    </p>
                  </button>
                </div>

                {/* Off-platform subscription fields */}
                {clientType === "off_platform" && (
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Abonnement hors plateforme
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="sb-plan">Nom du plan</Label>
                      <Input
                        id="sb-plan"
                        value={sbPlanName}
                        onChange={(e) => setSbPlanName(e.target.value)}
                        placeholder="Ex : Hopper Résidence"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sb-price">Prix / poste / mois</Label>
                        <div className="relative">
                          <Input
                            id="sb-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={sbPricePerSeat}
                            onChange={(e) => setSbPricePerSeat(e.target.value)}
                            placeholder="0.00"
                            className="pr-12"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            € HT
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sb-credits">Crédits / pers. / mois</Label>
                        <Input
                          id="sb-credits"
                          type="number"
                          min="0"
                          step="0.5"
                          value={sbCreditsPerPerson}
                          onChange={(e) => setSbCreditsPerPerson(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sb-seats">Nombre de postes</Label>
                        <Input
                          id="sb-seats"
                          type="number"
                          min="1"
                          value={sbSeats}
                          onChange={(e) => setSbSeats(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sb-start" className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          Date de début
                        </Label>
                        <Input
                          id="sb-start"
                          type="date"
                          value={sbStartDate}
                          onChange={(e) => setSbStartDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Monthly summary */}
                    {sbTotals.seats > 0 && (sbPricePerSeat || sbCreditsPerPerson) && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Récapitulatif mensuel
                        </p>
                        <div className="space-y-1 text-sm">
                          {sbPricePerSeat && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                {sbPricePerSeat} € HT × {sbTotals.seats} poste{sbTotals.seats > 1 ? "s" : ""}
                              </span>
                              <span className="font-semibold text-foreground">
                                {sbTotals.totalPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT/mois
                              </span>
                            </div>
                          )}
                          {sbCreditsPerPerson && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                {sbCreditsPerPerson} crédit{parseFloat(sbCreditsPerPerson) > 1 ? "s" : ""} × {sbTotals.seats} pers.
                              </span>
                              <span className="font-semibold text-foreground">
                                {sbTotals.totalCredits} crédits/mois
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Crédits & Contrat */}
            {step === 4 && (
              <div className="space-y-4">
                {clientType !== "meeting_room_only" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="c-seats" className="flex items-center gap-1.5">
                        <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                        Nombre de postes
                      </Label>
                      <Input
                        id="c-seats"
                        type="number"
                        min="0"
                        value={numberOfSeats}
                        onChange={(e) => setNumberOfSeats(e.target.value)}
                        placeholder="0"
                      />
                      {seatsNum > 0 && (
                        <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                          Un contrat <span className="font-medium text-foreground">Hopper Résidence</span> avec {seatsNum} poste{seatsNum > 1 ? "s" : ""} sera automatiquement créé.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="c-credits" className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    Crédits initiaux
                  </Label>
                  <Input
                    id="c-credits"
                    type="number"
                    min="0"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Les crédits initiaux sont attribués immédiatement à l&#39;entreprise, indépendamment de son contrat ou abonnement. Utile pour offrir un bonus de bienvenue.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with navigation */}
          <DialogFooter className="flex gap-3 border-t pt-4 sm:justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrevious} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={handleNext} className="gap-1">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading || !name.trim()}>
                Créer l&#39;entreprise
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Vous êtes sur le point de créer l&#39;entreprise suivante :</p>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2.5">
                  {/* Company name + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{name}</span>
                    {companyType !== "none" && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {companyType === "self_employed" ? "Indépendant" : "Multi-employés"}
                      </span>
                    )}
                  </div>

                  {/* Client type badge */}
                  <div className="flex items-center gap-2 text-sm">
                    {clientType === "platform" && <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    {clientType === "off_platform" && <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    {clientType === "meeting_room_only" && <DoorOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span>{clientTypeLabel}</span>
                  </div>

                  {/* Site */}
                  {selectedSiteName && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Site : {selectedSiteName}</span>
                    </div>
                  )}

                  {/* Off-platform details */}
                  {clientType === "off_platform" && sbTotals.seats > 0 && (
                    <div className="rounded-md bg-muted/50 p-2.5 text-sm space-y-1">
                      {sbPlanName && <p className="font-medium text-foreground">{sbPlanName}</p>}
                      <p>{sbTotals.seats} poste{sbTotals.seats > 1 ? "s" : ""}</p>
                      {sbPricePerSeat && (
                        <p>{sbTotals.totalPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT/mois</p>
                      )}
                      {sbCreditsPerPerson && (
                        <p>{sbTotals.totalCredits} crédits/mois</p>
                      )}
                    </div>
                  )}

                  {/* Contract (platform clients only) */}
                  {clientType !== "meeting_room_only" && seatsNum > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Armchair className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Contrat Hopper Résidence : {seatsNum} poste{seatsNum > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {/* Credits */}
                  {creditsNum > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{creditsNum} crédit{creditsNum > 1 ? "s" : ""} initiaux</span>
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Confirmer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
