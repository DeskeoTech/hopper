import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Suspense } from 'react'
import { UtmTracker } from '@/components/utm-tracker'
import './globals.css'

// Font Header - ProgramNarOT Black for titles (H1/H2/H3)
const headerFont = localFont({
  src: '../public/fonts/brand-font/ProgramNarOT-Black.otf',
  variable: '--font-header',
  display: 'swap',
  weight: '900',
})

// Font Body - Articulat CF for body text and UI
const bodyFont = localFont({
  src: [
    {
      path: '../public/fonts/articulat-cf/ArticulatCF-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/articulat-cf/ArticulatCF-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/articulat-cf/ArticulatCF-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
})

// Font Editorial - GT Alpina Italic for accent text
const editorialFont = localFont({
  src: '../public/fonts/gt-alpina/GTAlpina-Italic.otf',
  variable: '--font-editorial',
  display: 'swap',
  style: 'italic',
})

export const metadata: Metadata = {
  title: 'Hopper - Deskeo',
  description: 'Espaces de coworking Hopper by Deskeo',
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hopper',
  },
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${headerFont.variable} ${bodyFont.variable} ${editorialFont.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Suspense fallback={null}>
          <UtmTracker />
        </Suspense>
        <Toaster richColors position="top-right" />
        <Analytics />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9DVXRFFJNP" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9DVXRFFJNP');gtag('config','G-T0NFGK34PM');`}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "vmf0p853d7");`}
        </Script>
      </body>
    </html>
  )
}
