import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/toaster"
import { WelcomeAnimation } from "@/components/welcome-animation"
import { AnimatedGradientBackground } from "@/components/animated-gradient-background"
import { LogoAnimation } from "@/components/logo-animation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planeja+ | Organize seus eventos com facilidade",
  description: "Plataforma para organização de eventos colaborativos, festas, casamentos e viagens.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LogoAnimation />
            <a href="#main-content" className="skip-to-content">
              Pular para o conteúdo
            </a>
            <WelcomeAnimation />
            <AnimatedGradientBackground />
            <Navbar />
            <main id="main-content">{children}</main>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
