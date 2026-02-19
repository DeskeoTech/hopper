"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une entreprise</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de l'entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de l'entreprise"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type d'entreprise</Label>
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
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse de l'entreprise"
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats">Nombre de postes</Label>
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
                <Label htmlFor="credits">Crédits initiaux</Label>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment créer l'entreprise "{name}" ?
              {numberOfSeats && parseInt(numberOfSeats) > 0 && (
                <> Un contrat Hopper Résidence avec {numberOfSeats} poste{parseInt(numberOfSeats) > 1 ? "s" : ""} sera automatiquement créé.</>
              )}
              {initialCredits && parseInt(initialCredits) > 0 && (
                <> {initialCredits} crédit{parseInt(initialCredits) > 1 ? "s" : ""} seront attribués.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Création..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
