"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { decodePayload, type Course as ImportedCourse } from "@/lib/decodePayload"
import { payloadFromUrl, reportPath } from "@/lib/payloadFromUrl"
import { InteractiveReport, type StudentData } from "@/components/report/InteractiveReport"

function coerceStudentData(obj: any): StudentData {
    if (!obj || typeof obj !== "object") throw new Error("Invalid data")
    if (!Array.isArray(obj.courses)) throw new Error("Missing courses")
    const courses: ImportedCourse[] = obj.courses.map((c: any) => ({
        ...c,
        credits: typeof c.credits === "string" ? parseFloat(c.credits) : c.credits,
    }))
    return {
        id: typeof obj.id === "string" ? parseInt(obj.id, 10) : obj.id,
        credits_registered: typeof obj.credits_registered === "string" ? parseFloat(obj.credits_registered) : obj.credits_registered,
        credits_earned: typeof obj.credits_earned === "string" ? parseFloat(obj.credits_earned) : obj.credits_earned,
        cgpa: typeof obj.cgpa === "string" ? parseFloat(obj.cgpa) : obj.cgpa,
        courses,
    }
}

/**
 * Decoded in the browser, not on the server: the payload is a student's full
 * grade history, and a server component would receive it in the request and
 * could log it. The app links here with `#data=...` so the server never sees it.
 */
export default function ReportPage() {
    const router = useRouter()
    const [student, setStudent] = useState<StudentData | null>(null)

    useEffect(() => {
        const { encoded, fromQuery } = payloadFromUrl(new URL(window.location.href))
        if (!encoded) {
            router.replace("/calculator")
            return
        }

        // An old `?data=` link has already sent the payload once. Move it into
        // the fragment so a reload or a shared link doesn't send it again.
        if (fromQuery) window.history.replaceState(null, "", reportPath(encoded))

        try {
            setStudent(coerceStudentData(decodePayload(encoded)))
        } catch {
            router.replace("/calculator?error=decode")
        }
    }, [router])

    if (!student) return <div className="min-h-screen bg-background" aria-busy="true" />
    return <InteractiveReport initial={student} />
}
