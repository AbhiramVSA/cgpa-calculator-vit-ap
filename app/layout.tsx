import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { ThemeToggle } from "../components/ui/theme-toggle"
import { Calculator, Star } from "lucide-react"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "VIT-AP CGPA Calculator",
  description:
    "Calculate your CGPA manually or import academic data for comprehensive semester-wise reports. Built for VIT-AP students.",
  keywords: ["CGPA Calculator", "VIT-AP", "Academic Report", "GPA", "Semester", "Grades"],
  authors: [{ name: "VIT-AP CGPA Calculator" }],
  robots: "index, follow",
  openGraph: {
    title: "VIT-AP CGPA Calculator",
    description: "Calculate your CGPA manually or import academic data for comprehensive semester-wise reports",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={<div>Loading...</div>}>
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-2 group">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/15 transition-colors">
                    <Calculator className="h-5 w-5" />
                  </span>
                  <span className="font-semibold tracking-tight">VIT-AP CGPA</span>
                </Link>
                <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                  <Link href="/calculator" className="hover:text-foreground transition-colors">
                    Calculator
                  </Link>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </nav>
                <div className="flex items-center gap-2">
                  <Link
                    href="https://github.com/AbhiramVSA/cgpa-calculator-vit-ap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Star repository on GitHub"
                  >
                    <Star className="h-4 w-4" />
                    Star
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="mx-auto min-h-[calc(100vh-140px)]">{children}</main>

            <footer className="border-t bg-background/80">
              <div className="mx-auto max-w-7xl px-4 py-8 grid gap-4 sm:grid-cols-2 items-center">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} VIT-AP CGPA Calculator • Made with <span aria-hidden>❤️</span> by{" "}
                  <a
                    className="underline-offset-4 hover:underline"
                    href="https://github.com/AbhiramVSA"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abhiram
                  </a>
                </p>
                <div className="flex gap-4 sm:justify-end text-sm">
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms
                  </Link>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy
                  </Link>
                </div>
              </div>
            </footer>
          </Suspense>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
