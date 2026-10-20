import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Footer from "@/components/layout/footer"
import { SiteShell } from "@/components/site-shell"
import { Oswald } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Cinemark Perú",
  description: "Disfruta del mejor cine en Cinemark Perú",
  icons: {
    icon: "/iso.webp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={oswald.variable} suppressHydrationWarning>
      <body className={`${oswald.className} bg-black text-white min-h-screen flex flex-col`}>
        <SiteShell>
          <main className="flex-grow">{children}</main>
          <Footer />
        </SiteShell>
      </body>
    </html>
  )
}
