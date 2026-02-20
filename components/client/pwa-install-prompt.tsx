"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Download, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "pwa-install-dismissed"
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  )
}

function wasDismissedRecently(): boolean {
  if (typeof localStorage === "undefined") return false
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = parseInt(dismissed, 10)
  return Date.now() - dismissedAt < DISMISS_DURATION_MS
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (isStandalone() || wasDismissedRecently()) return

    // iOS: show custom instructions (no beforeinstallprompt support)
    if (isIOS()) {
      // Small delay so it doesn't flash immediately
      const timer = setTimeout(() => {
        setShowIOSPrompt(true)
        setVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }, [])

  if (!visible) return null

  // iOS prompt: instructions to use Share > Add to Home Screen
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300 sm:left-4 sm:right-auto sm:max-w-sm">
        <div className="rounded-[16px] bg-[#1B1918] p-4 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Download className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Installer Hopper</p>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  Appuyez sur{" "}
                  <Share className="inline h-3.5 w-3.5 -mt-0.5" />{" "}
                  puis <span className="font-medium text-white/90">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome prompt
  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300 sm:left-4 sm:right-auto sm:max-w-sm">
      <div className="rounded-[16px] bg-[#1B1918] p-4 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Installer Hopper</p>
              <p className="mt-1 text-xs text-white/70">
                Accédez à l&apos;app directement depuis votre écran d&apos;accueil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1B1918] uppercase tracking-wide transition-colors hover:bg-white/90"
        >
          Installer
        </button>
      </div>
    </div>
  )
}
