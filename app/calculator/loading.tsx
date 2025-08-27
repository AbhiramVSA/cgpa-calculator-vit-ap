import { Calculator } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Calculator className="h-8 w-8 text-primary animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-foreground">Loading Calculator</h2>
              <p className="text-sm text-muted-foreground">Preparing your CGPA calculator...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
