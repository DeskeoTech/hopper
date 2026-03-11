"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Camera, CameraOff } from "lucide-react"
import { Button } from "@/components/ui/button"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface QrScannerProps {
  onScan: (userId: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2))

  const startScanning = async () => {
    setError(null)
    try {
      const scanner = new Html5Qrcode(containerRef.current)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (UUID_REGEX.test(decodedText)) {
            scanner.stop().catch(() => {})
            scannerRef.current = null
            setIsScanning(false)
            onScan(decodedText)
          }
        },
        () => {}
      )
      setIsScanning(true)
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        id={containerRef.current}
        className="mx-auto max-w-[350px] overflow-hidden rounded-xl"
        style={{ minHeight: isScanning ? 300 : 0 }}
      />

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-center">
        {!isScanning ? (
          <Button onClick={startScanning} variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            Activer la caméra
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="outline" className="gap-2">
            <CameraOff className="h-4 w-4" />
            Arrêter la caméra
          </Button>
        )}
      </div>
    </div>
  )
}
