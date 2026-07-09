import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Xitique Fácil',
  description: 'Gerencie o seu grupo de Xitique de forma simples e segura. Registe contribuições, acompanhe a ordem de recebimento e mantenha o histórico completo.',
  keywords: 'xitique, xitiki, poupança rotativa, moçambique, gestão financeira',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Xitique Fácil',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-MZ" className={inter.variable} data-scroll-behavior="smooth">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
