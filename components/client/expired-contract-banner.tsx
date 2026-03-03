"use client"

import { Component, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useClientLayout } from "./client-layout-provider"

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

function ExpiredContractBannerInner() {
  const { user, plan, isDeskeoEmployee } = useClientLayout()
  const t = useTranslations("expiredBanner")

  if (isDeskeoEmployee || plan) {
    return null
  }

  const handleClick = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="fixed top-0 left-0 right-0 z-50 cursor-pointer bg-primary py-2 text-center transition-opacity hover:opacity-90 overflow-hidden"
      >
        <p className="whitespace-nowrap px-4 text-[10px] font-semibold text-primary-foreground sm:text-[14px]">
          {t("message")}
        </p>
      </div>
      <div className="h-[34px] sm:h-[42px]" />
    </>
  )
}

export function ExpiredContractBanner() {
  return (
    <BannerErrorBoundary>
      <ExpiredContractBannerInner />
    </BannerErrorBoundary>
  )
}
