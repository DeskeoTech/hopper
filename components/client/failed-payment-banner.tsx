"use client"

import { Component, type ReactNode, useState } from "react"
import { useTranslations } from "next-intl"
import { useClientLayout } from "./client-layout-provider"
import { createBillingPortalSession } from "@/lib/actions/billing"

class BannerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function FailedPaymentBannerInner() {
  const { paymentStatus, isDeskeoEmployee } = useClientLayout()
  const t = useTranslations("failedPaymentBanner")
  const [loading, setLoading] = useState(false)

  if (isDeskeoEmployee || paymentStatus !== "failed") {
    return null
  }

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await createBillingPortalSession(window.location.href)
      if (result.url) {
        window.open(result.url, "_blank")
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="fixed top-0 left-0 right-0 z-[9999] cursor-pointer bg-red-600 py-2 text-center transition-opacity hover:opacity-90 overflow-hidden"
      >
        <p className="whitespace-nowrap px-4 text-[10px] font-semibold text-white sm:text-[14px]">
          {loading ? t("loading") : t("message")}
        </p>
      </div>
      <div className="h-[34px] sm:h-[42px]" />
    </>
  )
}

export function FailedPaymentBanner() {
  return (
    <BannerErrorBoundary>
      <FailedPaymentBannerInner />
    </BannerErrorBoundary>
  )
}
