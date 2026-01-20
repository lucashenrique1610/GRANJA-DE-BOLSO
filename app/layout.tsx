import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ConfigProvider } from "@/contexts/config-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { TipsProvider } from "@/contexts/tips-context"
import { PwaProvider } from "@/contexts/pwa-context"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Granja de Bolso",
  description: "Sistema de gestão para pequenos produtores",
  generator: 'v0.dev',
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Granja Bolso",
  },
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PwaProvider>
            <ConfigProvider>
              <SubscriptionProvider>
                <TipsProvider>
                  {children}
                  <PwaInstallPrompt />
                  <Toaster />
                </TipsProvider>
              </SubscriptionProvider>
            </ConfigProvider>
          </PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
