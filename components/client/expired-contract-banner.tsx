"use client"

import { useClientLayout } from "./client-layout-provider"

export function ExpiredContractBanner() {
  const { user, plan, isDeskeoEmployee } = useClientLayout()

  // Don't show for Deskeo employees (unlimited access) or if user has an active plan
  if (isDeskeoEmployee || plan) {
    return null
  }

  const handleClick = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  return (
    <>
      {/* Fixed banner at top */}
      <div
        onClick={handleClick}
        className="fixed top-0 left-0 right-0 z-50 cursor-pointer bg-primary py-3 text-center transition-opacity hover:opacity-90"
      >
        <p className="px-4 text-[12px] font-semibold leading-[32px] text-primary-foreground sm:text-[14px] sm:leading-[32px]">
          VOTRE PASS HOPPER A EXPIRÉ, SOUSCRIVEZ-EN UN NOUVEAU ICI
        </p>
      </div>
      {/* Spacer to push content below the fixed banner */}
      <div className="h-[46px] sm:h-[50px]" />
    </>
  )
}
