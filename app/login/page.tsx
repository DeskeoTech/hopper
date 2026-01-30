import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { UserBar } from "@/components/user-bar"
import { getUser } from "@/lib/supabase/server"
import { ExternalLink } from "lucide-react"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getUser()
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user?.email} />

      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Top/Left side - Background image */}
        <div className="relative h-[40vh] w-full lg:h-auto lg:w-1/2">
          <img
            src="https://res.cloudinary.com/dhzxgl5eb/image/upload/v1769636196/DESKEO_VICTOIRE_-_LA_CASA_DESKEO_-_RDC_front_-_8_hg0jrt.jpg"
            alt="Espace Hopper"
            className="h-full w-full object-cover"
          />
          {/* Mobile: Bottom gradient + blur effect */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/50 to-transparent lg:hidden" />
          <div className="absolute inset-x-0 bottom-0 h-16 backdrop-blur-[2px] bg-gradient-to-t from-background to-transparent lg:hidden" />
          {/* Desktop: Right edge gradient + blur effect */}
          <div className="absolute inset-y-0 right-0 hidden w-32 bg-gradient-to-l from-background via-background/60 to-transparent lg:block" />
          <div className="absolute inset-y-0 right-0 hidden w-24 backdrop-blur-[3px] bg-gradient-to-l from-background/80 to-transparent lg:block" />
        </div>

        {/* Bottom/Right side - Login container */}
        <div className="relative -mt-8 flex w-full flex-1 flex-col items-center justify-center p-4 lg:mt-0 lg:w-1/2 lg:p-8">

          <div className="w-full max-w-md space-y-6">
            {/* Login Card */}
            <div className="rounded-[20px] bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
              {/* Logo - centered inside card */}
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

              {/* Login Form */}
              <LoginForm initialError={error} />
            </div>

            {/* CTA Link below card */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Pas de réservation ?{" "}
                <Link
                  href="https://hopper-coworking.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Découvrez et réservez l&apos;expérience Hopper ici
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <p className="fixed bottom-4 right-4 text-xs text-muted-foreground">v0.1.0</p>
    </div>
  )
}
