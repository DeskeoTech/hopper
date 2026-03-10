"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign"] as const
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function UtmTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const hasUtm = UTM_PARAMS.some((p) => searchParams.get(p))
    if (!hasUtm) return

    for (const param of UTM_PARAMS) {
      const value = searchParams.get(param)
      if (value) {
        document.cookie = `${param}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
      }
    }
  }, [searchParams])

  return null
}
