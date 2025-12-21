import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ConfigProvider } from "@/contexts/config-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { TipsProvider } from "@/contexts/tips-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Granja de Bolso",
  description: "Sistema de gestão para pequenos produtores",
    generator: 'v0.dev'
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
          <ConfigProvider>
            <SubscriptionProvider>
              <TipsProvider>
                {children}
                <Toaster />
              </TipsProvider>
            </SubscriptionProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
