"use client"

import type { ReactNode } from "react"
import Header from "@/components/layout/header"
import { ThemeProvider } from "@/components/theme-provider"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <Header />
      {children}
    </ThemeProvider>
  )
}
