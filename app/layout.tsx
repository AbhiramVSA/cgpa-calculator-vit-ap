import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "VIT-AP CGPA Calculator",
  description: "Calculate your CGPA manually or import academic data for comprehensive semester-wise reports. Built for VIT-AP students.",
  keywords: ["CGPA Calculator", "VIT-AP", "Academic Report", "GPA", "Semester", "Grades"],
  authors: [{ name: "VIT-AP CGPA Calculator" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "VIT-AP CGPA Calculator",
    description: "Calculate your CGPA manually or import academic data for comprehensive semester-wise reports",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
