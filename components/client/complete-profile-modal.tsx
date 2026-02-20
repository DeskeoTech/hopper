"use client"

import { useState, useRef } from "react"
import { Loader2, Building2, User, Upload, FileText, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  updateUserProfile,
  updateCompanyProfile,
  uploadCompanyKbis,
} from "@/lib/actions/user-company-info"
import { acceptCgu } from "@/lib/actions/cgu"
import { isCompanyInfoComplete } from "@/lib/validations/user-company-info"
import type { User as UserType, Company } from "@/lib/types/database"

interface CompleteProfileModalProps {
  user: UserType
  company: Company
}

export function CompleteProfileModal({
  user,
  company,
}: CompleteProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User form state
  const [firstName, setFirstName] = useState(user.first_name || "")
  const [lastName, setLastName] = useState(user.last_name || "")
  const [phone, setPhone] = useState(user.phone || "")

  // Company form state
  const [companyName, setCompanyName] = useState(company.name || "")
  const [address, setAddress] = useState(company.address || "")
  const [companyType, setCompanyType] = useState<
    "self_employed" | "multi_employee" | ""
  >(company.company_type || "")

  // KBIS file state
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [existingKbis, setExistingKbis] = useState(company.kbis_storage_path)

  // CGU acceptance state (only show if not already accepted)
  const [cguAccepted, setCguAccepted] = useState(!!user.cgu_accepted_at)
  const needsCguAcceptance = !user.cgu_accepted_at

  // If company info is already complete (e.g. invited user), skip company fields
  const companyAlreadyComplete = isCompanyInfoComplete(company)

  const needsKbis = companyType === "multi_employee"
  const hasKbis = !!kbisFile || !!existingKbis

  const isFormValid = (companyAlreadyComplete
    ? firstName.trim() && lastName.trim()
    : firstName.trim() &&
      lastName.trim() &&
      companyName.trim() &&
      address.trim() &&
      companyType &&
      (!needsKbis || hasKbis)) &&
    cguAccepted

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setKbisFile(file)
    }
  }

  const handleRemoveFile = () => {
    setKbisFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setLoading(true)
    setError(null)

    // Update user info
    const userResult = await updateUserProfile(user.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    })

    if (userResult.error) {
      setError(userResult.error)
      setLoading(false)
      return
    }

    // Update company info only if not already complete
    if (!companyAlreadyComplete) {
      const companyResult = await updateCompanyProfile(company.id, {
        name: companyName.trim(),
        address: address.trim(),
        company_type: companyType as "self_employed" | "multi_employee",
      })

      if (companyResult.error) {
        setError(companyResult.error)
        setLoading(false)
        return
      }

      // Upload KBIS if SAS and new file provided
      if (needsKbis && kbisFile) {
        const formData = new FormData()
        formData.append("file", kbisFile)
        const kbisResult = await uploadCompanyKbis(company.id, formData)

        if (kbisResult.error) {
          setError(kbisResult.error)
          setLoading(false)
          return
        }
      }
    }

    // Accept CGU if needed
    if (needsCguAcceptance && cguAccepted) {
      const cguResult = await acceptCgu()
      if (cguResult.error) {
        setError(cguResult.error)
        setLoading(false)
        return
      }
    }

    // Success - page will revalidate and modal will close
    // because info will be complete
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Complétez votre profil
          </DialogTitle>
          <DialogDescription>
            Veuillez renseigner vos informations pour accéder à l'application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Informations personnelles
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="firstName">
                  Prénom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="lastName">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="phone">
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

          {/* Company Info Section - hidden if company already complete (e.g. invited user) */}
          {!companyAlreadyComplete && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Informations entreprise
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Nom de l'entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Adresse <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse de l'entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Type d'entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={companyType}
                    onValueChange={(v) =>
                      setCompanyType(v as "self_employed" | "multi_employee")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_employed">
                        EI (Entreprise Individuelle)
                      </SelectItem>
                      <SelectItem value="multi_employee">SAS / SARL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* KBIS Section - only shown for SAS */}
              {needsKbis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Document KBIS <span className="text-destructive">*</span>
                  </div>

                  {existingKbis && !kbisFile ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">KBIS déjà fourni</span>
                    </div>
                  ) : kbisFile ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">
                        {kbisFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="kbis-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Importer le KBIS
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Formats acceptés : PDF, JPG, PNG
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* CGU Acceptance */}
          {needsCguAcceptance && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="cgu-accept"
                checked={cguAccepted}
                onCheckedChange={(checked) => setCguAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="cgu-accept"
                className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
              >
                J&apos;accepte les{" "}
                <a
                  href="/conditions-generales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-foreground hover:text-primary"
                >
                  Conditions Générales
                </a>{" "}
                et la{" "}
                <a
                  href="/politique-de-confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-foreground hover:text-primary"
                >
                  Politique de confidentialité
                </a>
              </Label>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer et continuer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
