import { redirect } from "next/navigation"
import { decodePayload, isCourseArray, type Course as ImportedCourse } from "@/lib/decodePayload"
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

export default function ReportPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
    const dataParam = (searchParams?.data ?? searchParams?.payload) as string | undefined
    if (!dataParam) {
        redirect("/calculator")
    }
    let parsed: any
    try {
        parsed = decodePayload(dataParam!)
    } catch (e) {
        redirect(`/calculator?error=decode`)
    }
    const student = coerceStudentData(parsed)
    return <InteractiveReport initial={student} />
}
