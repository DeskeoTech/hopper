import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
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
    generator: 'v0.app'
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
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
