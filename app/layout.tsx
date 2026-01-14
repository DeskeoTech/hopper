import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
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
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body
        className={`${headerFont.variable} ${bodyFont.variable} ${editorialFont.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
