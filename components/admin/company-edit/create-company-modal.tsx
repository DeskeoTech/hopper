"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Building2, Mail, Phone, MapPin, Loader2, Armchair, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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

interface CreateCompanyModalProps {
  sites: { id: string; name: string | null }[]
}

export function CreateCompanyModal({ sites }: CreateCompanyModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [companyType, setCompanyType] = useState<CompanyType | "none">("none")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [mainSiteId, setMainSiteId] = useState("")
  const [numberOfSeats, setNumberOfSeats] = useState("")
  const [initialCredits, setInitialCredits] = useState("")

  const siteOptions = sites.map((s) => ({ value: s.id, label: s.name || "Sans nom" }))
  const selectedSiteName = sites.find((s) => s.id === mainSiteId)?.name

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setConfirmOpen(true)
  }

  const resetForm = () => {
    setName("")
    setCompanyType("none")
    setEmail("")
    setPhone("")
    setAddress("")
    setMainSiteId("")
    setNumberOfSeats("")
    setInitialCredits("")
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await createCompany({
      name: name.trim(),
      company_type: companyType === "none" ? null : companyType,
      contact_email: email || null,
      phone: phone || null,
      address: address || null,
      main_site_id: mainSiteId || null,
      numberOfSeats: numberOfSeats ? parseInt(numberOfSeats, 10) : null,
      initialCredits: initialCredits ? parseInt(initialCredits, 10) : null,
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

  const seatsNum = numberOfSeats ? parseInt(numberOfSeats, 10) : 0
  const creditsNum = initialCredits ? parseInt(initialCredits, 10) : 0

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle entreprise</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span>Nouvelle entreprise</span>
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de l&#39;entreprise. Seul le nom est obligatoire.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pr-1">
            {/* Section 1: Informations générales */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom de l&#39;entreprise <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Acme Corp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type d&#39;entreprise</Label>
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
            </div>

            {/* Section 2: Coordonnées */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Coordonnées</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 rue de l'exemple, 75001 Paris"
                />
              </div>
            </div>

            {/* Section 3: Configuration */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seats" className="flex items-center gap-1.5">
                    <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                    Postes
                  </Label>
                  <Input
                    id="seats"
                    type="number"
                    min="0"
                    value={numberOfSeats}
                    onChange={(e) => setNumberOfSeats(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits" className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    Crédits initiaux
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    min="0"
                    value={initialCredits}
                    onChange={(e) => setInitialCredits(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              {seatsNum > 0 && (
                <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                  Un contrat <span className="font-medium text-foreground">Hopper Résidence</span> avec {seatsNum} poste{seatsNum > 1 ? "s" : ""} sera automatiquement créé.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
                Créer l&#39;entreprise
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Vous êtes sur le point de créer l&#39;entreprise suivante :</p>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{name}</span>
                    {companyType !== "none" && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {companyType === "self_employed" ? "Indépendant" : "Multi-employés"}
                      </span>
                    )}
                  </div>
                  {selectedSiteName && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Site : {selectedSiteName}</span>
                    </div>
                  )}
                  {seatsNum > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Armchair className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Contrat Hopper Résidence : {seatsNum} poste{seatsNum > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {creditsNum > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{creditsNum} crédit{creditsNum > 1 ? "s" : ""} attribués</span>
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
