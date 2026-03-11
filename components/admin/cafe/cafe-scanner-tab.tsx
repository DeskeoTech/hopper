"use client"

import { useState, useCallback } from "react"
import { QrCode, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QrScanner } from "./qr-scanner"
import { CafeUserSearch } from "./cafe-user-search"
import { CafeUserFiche } from "./cafe-user-fiche"
import { getCafeUserFiche, type CafeUserFiche as CafeUserFicheType } from "@/lib/actions/cafe"

type ScanMode = "qr" | "search"

interface CafeScannerTabProps {
  adminId: string
}

export function CafeScannerTab({ adminId }: CafeScannerTabProps) {
  const [mode, setMode] = useState<ScanMode>("search")
  const [fiche, setFiche] = useState<CafeUserFicheType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    setFiche(null)

    const result = await getCafeUserFiche(userId)

    if (result.error) {
      setError(result.error)
    } else {
      setFiche(result.data)
    }
    setLoading(false)
  }, [])

  const handleReset = () => {
    setFiche(null)
    setError(null)
  }

  const handleConsumptionRecorded = useCallback(async () => {
    if (fiche) {
      // Refresh the fiche data
      const result = await getCafeUserFiche(fiche.id)
      if (result.data) {
        setFiche(result.data)
      }
    }
  }, [fiche])

  // If we have a user fiche, show it
  if (fiche) {
    return (
      <div className="mx-auto max-w-md">
        <CafeUserFiche
          fiche={fiche}
          adminId={adminId}
          onReset={handleReset}
          onConsumptionRecorded={handleConsumptionRecorded}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <Button
          variant={mode === "search" ? "default" : "ghost"}
          size="sm"
          className="flex-1 gap-2"
          onClick={() => setMode("search")}
        >
          <Search className="h-4 w-4" />
          Recherche
        </Button>
        <Button
          variant={mode === "qr" ? "default" : "ghost"}
          size="sm"
          className="flex-1 gap-2"
          onClick={() => setMode("qr")}
        >
          <QrCode className="h-4 w-4" />
          Scanner QR
        </Button>
      </div>

      {/* Scanner or search */}
      {mode === "qr" ? (
        <QrScanner onScan={loadUser} />
      ) : (
        <CafeUserSearch onSelect={loadUser} />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
