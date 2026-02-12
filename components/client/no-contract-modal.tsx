"use client"

import { useState } from "react"
import { AlertCircle, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface NoContractModalProps {
  open: boolean
}

export function NoContractModal({ open }: NoContractModalProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  if (!open) return null

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[20px] bg-background p-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>

          {/* Title */}
          <h2 className="mt-4 font-header text-xl font-bold uppercase tracking-tight">
            Aucun pass actif
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm text-foreground/70">
            Votre compte n&apos;est lié à aucun pass actif.
            Veuillez contacter l&apos;administrateur de votre entreprise pour être assigné à un pass.
          </p>

          {/* Logout button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-6"
          >
            {loggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Déconnexion...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
