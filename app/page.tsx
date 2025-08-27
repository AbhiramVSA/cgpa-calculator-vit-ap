import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Rocket, Smartphone, Upload, Calculator, BarChart2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 dark:opacity-60" aria-hidden>
          <div className="pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
            <div className="absolute -top-24 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-accent/15 to-primary/5 blur-3xl" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:pt-20 sm:pb-16">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                Built for VIT-AP students
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                CGPA, done right. Simple. Fast. Accurate.
              </h1>
              <p className="text-muted-foreground text-pretty">
                Skip manual entry with one-tap import, then get a beautiful interactive report with live editing, charts, and a share-ready view.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/calculator" className="w-full sm:w-auto">
                  <Button className="w-full group">
                    Open Calculator
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href="#vitap-app" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Import from mobile app
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2"><Upload className="h-4 w-4" />Import encoded string</div>
                <div className="inline-flex items-center gap-2"><Calculator className="h-4 w-4" />Instant CGPA</div>
                <div className="inline-flex items-center gap-2"><BarChart2 className="h-4 w-4" />Interactive report</div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/2] w-full rounded-xl border bg-card p-4 shadow-sm grid place-items-center">
                <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" /> One‑tap import from app
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16" id="vitap-app">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border p-5 bg-card">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <h3 className="font-semibold mb-1">Open VITAP Student App</h3>
            <p className="text-sm text-muted-foreground">Go to the grades page and tap “Share grades”. It copies an encoded string.</p>
          </div>
          <div className="rounded-xl border p-5 bg-card">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            <h3 className="font-semibold mb-1">Paste the string here</h3>
            <p className="text-sm text-muted-foreground">On the calculator page, paste it to auto-fill all courses in one click.</p>
          </div>
          <div className="rounded-xl border p-5 bg-card">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart2 className="h-4 w-4" />
            </div>
            <h3 className="font-semibold mb-1">Edit and explore</h3>
            <p className="text-sm text-muted-foreground">Fine-tune grades, view semester GPAs, and share a polished report.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
