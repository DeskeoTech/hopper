"use client"

import { useEffect, useState } from "react"

const APP_VERSION = "0.1.0"

export function UrlVersionFooter() {
  const [url, setUrl] = useState("")

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  if (!url) return null

  return (
    <div className="fixed bottom-4 left-4 text-xs text-muted-foreground/60">
      <span>{url}</span>
      <span className="mx-2">•</span>
      <span>v{APP_VERSION}</span>
    </div>
  )
}
