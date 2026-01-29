"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import confetti from "canvas-confetti"
import {
  Loader2,
  Building2,
  Briefcase,
  Upload,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
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

const AUTO_ADVANCE_DELAY = 400 // ms delay before auto-advancing

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function OnboardingModal({ userId, existingCompany }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [companyType, setCompanyType] = useState<CompanyType | null>(null)
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: existingCompany?.name || "",
    address: existingCompany?.address || "",
    contact_email: existingCompany?.contact_email || "",
  })
  const [emailError, setEmailError] = useState<string | null>(null)

  const needsKbis = companyType === "multi_employee"
  const actualSteps = needsKbis ? 4 : 3 // Skip KBIS step for self_employed

  // Trigger confetti when complete
  useEffect(() => {
    if (isComplete) {
      // Fire confetti from center
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#1B1918", "#F2E7DC", "#D4A574", "#8B7355"],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#1B1918", "#F2E7DC", "#D4A574", "#8B7355"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      // Initial burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#1B1918", "#F2E7DC", "#D4A574", "#8B7355"],
      })

      frame()
    }
  }, [isComplete])

  const getStepIndex = (currentStep: number): number => {
    if (!needsKbis && currentStep >= 2) {
      return currentStep + 1 // Skip step 2 (KBIS) visually
    }
    return currentStep
  }

  const goNext = useCallback((skipKbis?: boolean) => {
    setDirection("forward")
    setError(null)

    // Skip KBIS step if self_employed
    if (step === 1 && skipKbis) {
      setStep(3) // Jump to info step
    } else if (step === 1 && !needsKbis) {
      setStep(3) // Jump to info step
    } else {
      setStep((s) => s + 1)
    }
    setIsTransitioning(false)
  }, [step, needsKbis])

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

  // Auto-advance after selecting company type
  const handleCompanyTypeSelect = (type: CompanyType) => {
    setCompanyType(type)
    setIsTransitioning(true)

    // Auto-advance after a short delay for visual feedback
    setTimeout(() => {
      setDirection("forward")
      setError(null)
      // Skip KBIS step if self_employed
      if (type === "self_employed") {
        setStep(3)
      } else {
        setStep(2)
      }
      setIsTransitioning(false)
    }, AUTO_ADVANCE_DELAY)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setKbisFile(file)
      setError(null)
      setIsTransitioning(true)

      // Auto-advance after file selection
      setTimeout(() => {
        setDirection("forward")
        setStep(3)
        setIsTransitioning(false)
      }, AUTO_ADVANCE_DELAY)
    }
  }

  const handleRemoveFile = () => {
    setKbisFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError("L'email est requis")
      return false
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Format d'email invalide")
      return false
    }
    setEmailError(null)
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setCompanyInfo((prev) => ({ ...prev, contact_email: email }))
    // Clear error when user starts typing
    if (emailError) {
      setEmailError(null)
    }
  }

  const handleEmailBlur = () => {
    if (companyInfo.contact_email) {
      validateEmail(companyInfo.contact_email)
    }
  }

  const handleSubmit = async () => {
    if (!companyType) return

    // Validate email before submitting
    if (!validateEmail(companyInfo.contact_email)) {
      return
    }

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

    // Show success screen with confetti
    setLoading(false)
    setIsComplete(true)

    // Redirect after showing success (page will revalidate)
    setTimeout(() => {
      window.location.reload()
    }, 3000)
  }

  const isEmailValid = EMAIL_REGEX.test(companyInfo.contact_email)
  const isInfoValid =
    companyInfo.name.trim() &&
    companyInfo.address.trim() &&
    companyInfo.contact_email.trim() &&
    isEmailValid

  const animationClass =
    direction === "forward"
      ? "animate-in fade-in-0 slide-in-from-right-8 duration-400 ease-out"
      : "animate-in fade-in-0 slide-in-from-left-8 duration-400 ease-out"

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Success Screen with Confetti */}
        {isComplete ? (
          <div className="space-y-6 text-center animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="mx-auto">
              <Image
                src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
                alt="Hopper Logo"
                width={180}
                height={72}
                className="mx-auto h-16 w-auto"
                priority
              />
            </div>

            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-header text-2xl font-bold uppercase tracking-tight">
                Merci !
              </h2>
              <p className="text-lg text-muted-foreground">
                Bienvenue chez Hopper Coworking
              </p>
              <p className="text-sm text-muted-foreground">
                Votre espace est prêt, redirection en cours...
              </p>
            </div>

            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Progress Indicator */}
            {step > 0 && (
              <div className="mb-6 flex justify-center gap-3">
                {Array.from({ length: actualSteps - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-500 ease-out",
                      getStepIndex(step) > i + 1
                        ? "bg-primary w-2.5"
                        : getStepIndex(step) === i + 1
                          ? "bg-primary w-8"
                          : "bg-muted w-2.5"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className={cn("space-y-6 text-center", animationClass)}>
                <div className="mx-auto">
                  <Image
                    src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
                    alt="Hopper Logo"
                    width={180}
                    height={72}
                    className="mx-auto h-16 w-auto"
                    priority
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="font-header text-2xl font-bold uppercase tracking-tight">
                    Bienvenue !
                  </h2>
                  <p className="text-muted-foreground">
                    L&apos;équipe Hopper Coworking vous souhaite la bienvenue dans votre nouvel espace de travail.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Pour commencer, nous avons besoin de quelques informations sur votre entreprise.
                </p>

                <Button onClick={() => goNext()} className="w-full" size="lg">
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
                    Type d&apos;entreprise
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez le type de structure de votre entreprise
                  </p>
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={() => handleCompanyTypeSelect("self_employed")}
                    disabled={isTransitioning}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all duration-300",
                      companyType === "self_employed"
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:scale-[1.02]",
                      isTransitioning && companyType !== "self_employed" && "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                      companyType === "self_employed" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {companyType === "self_employed" && isTransitioning ? (
                        <Check className="h-6 w-6 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <Briefcase className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Entreprise Individuelle</div>
                      <div className="text-sm text-muted-foreground">
                        Auto-entrepreneur, EI, EIRL
                      </div>
                    </div>
                    {companyType === "self_employed" && isTransitioning && (
                      <div className="absolute right-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompanyTypeSelect("multi_employee")}
                    disabled={isTransitioning}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all duration-300",
                      companyType === "multi_employee"
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:scale-[1.02]",
                      isTransitioning && companyType !== "multi_employee" && "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                      companyType === "multi_employee" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {companyType === "multi_employee" && isTransitioning ? (
                        <Check className="h-6 w-6 animate-in zoom-in-50 duration-200" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Entreprise</div>
                      <div className="text-sm text-muted-foreground">
                        SAS, SARL, SA, SASU, EURL...
                      </div>
                    </div>
                    {companyType === "multi_employee" && isTransitioning && (
                      <div className="absolute right-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                </div>

                <Button variant="outline" onClick={goBack} className="w-full" disabled={isTransitioning}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
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
                    <div className={cn(
                      "flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4 transition-all duration-300",
                      isTransitioning && "scale-[1.02]"
                    )}>
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                        isTransitioning ? "bg-primary text-primary-foreground" : "bg-primary/10"
                      )}>
                        {isTransitioning ? (
                          <Check className="h-5 w-5 animate-in zoom-in-50 duration-200" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{kbisFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(kbisFile.size / 1024 / 1024).toFixed(2)} Mo
                        </div>
                      </div>
                      {isTransitioning ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
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
                        className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted transition-colors duration-300 group-hover:bg-primary/10">
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
                  <div className="rounded-lg bg-destructive/10 p-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button variant="outline" onClick={goBack} className="w-full" disabled={isTransitioning}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </div>
            )}

            {/* Step 3: Company Info */}
            {step === 3 && (
              <div className={cn("space-y-6", animationClass)}>
                <div className="space-y-2 text-center">
                  <h2 className="font-header text-xl font-bold uppercase tracking-tight">
                    Complétez votre profil
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Plus que quelques informations et c&apos;est terminé !
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      Nom de l&apos;entreprise <span className="text-destructive">*</span>
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
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      placeholder="contact@entreprise.com"
                      className={cn(emailError && "border-destructive focus-visible:ring-destructive")}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1 duration-200">
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="flex-1" disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !isInfoValid}
                    className="flex-1 transition-all duration-300"
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
