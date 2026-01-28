"use client"

import { useState, useRef } from "react"
import {
  Loader2,
  Building2,
  Briefcase,
  Upload,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { completeOnboarding, uploadOnboardingKbis } from "@/lib/actions/onboarding"
import type { Company } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface OnboardingModalProps {
  userId: string
  existingCompany: Company | null
}

type CompanyType = "self_employed" | "multi_employee"

const TOTAL_STEPS = 4 // Welcome, Type, KBIS (conditional), Info

export function OnboardingModal({ userId, existingCompany }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [companyType, setCompanyType] = useState<CompanyType | null>(null)
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: existingCompany?.name || "",
    address: existingCompany?.address || "",
    contact_email: existingCompany?.contact_email || "",
  })

  const needsKbis = companyType === "multi_employee"
  const actualSteps = needsKbis ? 4 : 3 // Skip KBIS step for self_employed

  const getStepIndex = (currentStep: number): number => {
    if (!needsKbis && currentStep >= 2) {
      return currentStep + 1 // Skip step 2 (KBIS) visually
    }
    return currentStep
  }

  const goNext = () => {
    setDirection("forward")
    setError(null)

    // Skip KBIS step if self_employed
    if (step === 1 && !needsKbis) {
      setStep(3) // Jump to info step
    } else {
      setStep((s) => s + 1)
    }
  }

  const goBack = () => {
    setDirection("back")
    setError(null)

    // Skip KBIS step if self_employed when going back
    if (step === 3 && !needsKbis) {
      setStep(1) // Jump back to type step
    } else {
      setStep((s) => s - 1)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setKbisFile(file)
      setError(null)
    }
  }

  const handleRemoveFile = () => {
    setKbisFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!companyType) return

    setLoading(true)
    setError(null)

    // Upload KBIS first if needed
    let companyId = existingCompany?.id || null

    // Complete onboarding (creates company if needed)
    const result = await completeOnboarding({
      userId,
      companyId,
      companyType,
      companyInfo: {
        name: companyInfo.name.trim(),
        address: companyInfo.address.trim(),
        contact_email: companyInfo.contact_email.trim(),
      },
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // If we need to upload KBIS and have a file
    if (needsKbis && kbisFile) {
      // Get the company ID (might be newly created)
      const targetCompanyId = existingCompany?.id

      if (targetCompanyId) {
        const formData = new FormData()
        formData.append("file", kbisFile)
        const kbisResult = await uploadOnboardingKbis(targetCompanyId, formData)

        if (kbisResult.error) {
          setError(kbisResult.error)
          setLoading(false)
          return
        }
      }
    }

    // Success - page will revalidate and modal will close
  }

  const isInfoValid =
    companyInfo.name.trim() &&
    companyInfo.address.trim() &&
    companyInfo.contact_email.trim()

  const canProceedFromKbis = kbisFile !== null

  const animationClass =
    direction === "forward"
      ? "animate-in fade-in-0 slide-in-from-right-4 duration-300"
      : "animate-in fade-in-0 slide-in-from-left-4 duration-300"

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Progress Indicator */}
        {step > 0 && (
          <div className="mb-6 flex justify-center gap-2">
            {Array.from({ length: actualSteps - 1 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  getStepIndex(step) > i + 1
                    ? "bg-primary scale-100"
                    : getStepIndex(step) === i + 1
                      ? "bg-primary scale-125"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className={cn("space-y-6 text-center", animationClass)}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="font-header text-2xl font-bold uppercase tracking-tight">
                Bienvenue chez Hopper
              </h2>
              <p className="text-muted-foreground">
                Pour accéder à votre espace coworking, nous avons besoin de quelques informations sur votre entreprise.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Cette configuration ne prendra que quelques minutes.
            </p>

            <Button onClick={goNext} className="w-full" size="lg">
              Commencer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Company Type */}
        {step === 1 && (
          <div className={cn("space-y-6", animationClass)}>
            <div className="space-y-2 text-center">
              <h2 className="font-header text-xl font-bold uppercase tracking-tight">
                Type d'entreprise
              </h2>
              <p className="text-sm text-muted-foreground">
                Sélectionnez le type de structure de votre entreprise
              </p>
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => setCompanyType("self_employed")}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.02]",
                  companyType === "self_employed"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-medium">Entreprise Individuelle</div>
                  <div className="text-sm text-muted-foreground">
                    Auto-entrepreneur, EI, EIRL
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCompanyType("multi_employee")}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.02]",
                  companyType === "multi_employee"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-medium">Entreprise</div>
                  <div className="text-sm text-muted-foreground">
                    SAS, SARL, SA, SASU, EURL...
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={goNext}
                disabled={!companyType}
                className="flex-1"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: KBIS Upload (only for multi_employee) */}
        {step === 2 && needsKbis && (
          <div className={cn("space-y-6", animationClass)}>
            <div className="space-y-2 text-center">
              <h2 className="font-header text-xl font-bold uppercase tracking-tight">
                Document KBIS
              </h2>
              <p className="text-sm text-muted-foreground">
                Le KBIS est obligatoire pour les entreprises (SAS, SARL...)
              </p>
            </div>

            <div className="space-y-4">
              {kbisFile ? (
                <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{kbisFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(kbisFile.size / 1024 / 1024).toFixed(2)} Mo
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="kbis-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Cliquez pour importer</div>
                      <div className="text-sm text-muted-foreground">
                        PDF, JPG ou PNG (max 10 Mo)
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={goNext}
                disabled={!canProceedFromKbis}
                className="flex-1"
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Company Info */}
        {step === 3 && (
          <div className={cn("space-y-6", animationClass)}>
            <div className="space-y-2 text-center">
              <h2 className="font-header text-xl font-bold uppercase tracking-tight">
                Informations entreprise
              </h2>
              <p className="text-sm text-muted-foreground">
                Renseignez les coordonnées de votre entreprise
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Nom de l'entreprise <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={companyInfo.name}
                  onChange={(e) =>
                    setCompanyInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Adresse <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Adresse de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">
                  Email de contact <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={companyInfo.contact_email}
                  onChange={(e) =>
                    setCompanyInfo((prev) => ({
                      ...prev,
                      contact_email: e.target.value,
                    }))
                  }
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !isInfoValid}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Terminer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
