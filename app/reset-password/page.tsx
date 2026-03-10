import Image from "next/image"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; app?: string }>
}) {
  const { code, app } = await searchParams
  const isApp = app === "yes"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-[20px] bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex justify-center">
              <Image
                src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
                alt="Hopper Logo"
                width={200}
                height={80}
                className="h-10 w-auto sm:h-12"
                priority
              />
            </div>
            <ResetPasswordForm isApp={isApp} code={code} />
          </div>
        </div>
      </main>
    </div>
  )
}
