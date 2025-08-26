import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Free CGPA Calculator | AI-Powered GPA Calculator Online",
  description:
    "Calculate your CGPA instantly with our free AI-powered calculator. Manual entry or automated import. Supports all grading systems. Get accurate GPA calculations in seconds.",
  keywords:
    "CGPA calculator, GPA calculator, grade point average, academic calculator, student tools, university calculator, college GPA, semester calculator",
  authors: [{ name: "CGPA Calculator Team" }],
  creator: "CGPA Calculator",
  publisher: "CGPA Calculator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cgpa-calculator.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free CGPA Calculator | AI-Powered GPA Calculator Online",
    description:
      "Calculate your CGPA instantly with our free AI-powered calculator. Manual entry or automated import. Supports all grading systems.",
    url: "https://cgpa-calculator.vercel.app",
    siteName: "CGPA Calculator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CGPA Calculator - Free Online GPA Calculator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free CGPA Calculator | AI-Powered GPA Calculator Online",
    description: "Calculate your CGPA instantly with our free AI-powered calculator. Manual entry or automated import.",
    images: ["/og-image.png"],
    creator: "@cgpacalculator",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
    generator: 'v0.app'
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CGPA Calculator",
  description:
    "Free AI-powered CGPA calculator for students. Calculate GPA manually or through automated import with support for all grading systems.",
  url: "https://cgpa-calculator.vercel.app",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Manual CGPA calculation",
    "Automated data import",
    "Multiple grading systems support",
    "Real-time calculations",
    "Course management",
    "Grade point tracking",
  ],
  author: {
    "@type": "Organization",
    name: "CGPA Calculator Team",
  },
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  inLanguage: "en-US",
  isAccessibleForFree: true,
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`font-sans ${inter.variable} ${poppins.variable} antialiased`}>{children}</body>
    </html>
  )
}
