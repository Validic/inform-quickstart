import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { ConfigProvider } from '@/context/ConfigContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inform API Demo',
  description: 'Interactive demonstration of Inform APIs and Services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ConfigProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
