"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Upload, Plus, RotateCcw, Trash2, CheckCircle, AlertCircle, BookOpen, Award, Smartphone, ExternalLink } from "lucide-react"
import { decodePayload, type Course as ImportedCourse } from "@/lib/decodePayload"
import Link from "next/link"
import { GradeDistribution } from "@/components/charts/grade-distribution"

interface Course {
    id: string
    title: string
    credits: number
    grade: string
}

interface SemesterData {
    semester: string
    courses: ImportedCourse[]
    gpa: number
}

interface StudentData {
    id: number
    credits_registered: number
    credits_earned: number
    cgpa: number
    courses: ImportedCourse[]
}

const gradePoints: Record<string, number> = {
    S: 10,
    A: 9,
    B: 8,
    C: 7,
    D: 6,
    E: 5,
    F: 0,
    P: 0,
}

export default function CGPACalculator() {
    // Open the mobile app to Grades (best-effort scheme/intent)
    const openApp = () => {
        const ua = navigator.userAgent || ''
        const isAndroid = /Android/i.test(ua)
        const isIOS = /iPhone|iPad|iPod/i.test(ua)
        const pkg = 'com.udhay.vitapstudentapp'
        const play = 'https://play.google.com/store/apps/details?id=' + pkg
        const appstore = 'https://apps.apple.com/in/app/vitap-student/id6748966515'
        const iosScheme = 'vitapstudent://grades' // Assumption; update if different

        const start = Date.now()
        const t = setTimeout(() => {
            if (Date.now() - start < 1800) return
            window.location.href = isAndroid ? play : appstore
        }, 1500)

        if (isAndroid) {
            window.location.href = 'intent://grades#Intent;package=' + pkg + ';end'
        } else if (isIOS) {
            window.location.href = iosScheme
        } else {
            clearTimeout(t)
            window.open('https://github.com/AbhiramVSA/cgpa-calculator-vit-ap', '_blank')
        }
    }
    const [courses, setCourses] = useState<Course[]>([])
    const [currentCourse, setCurrentCourse] = useState({
        title: "",
        credits: "",
        grade: "",
    }) as any
    const [encodedData, setEncodedData] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [cgpa, setCgpa] = useState<number | null>(null)
    const [importSuccess, setImportSuccess] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)
    const [semesterData, setSemesterData] = useState<SemesterData[]>([])
    const [studentData, setStudentData] = useState<StudentData | null>(null)
    const searchParams = useSearchParams()

    const calculateCGPA = (courseList: Course[]) => {
        const validCourses = courseList.filter((course) => course.grade !== "P")
        if (validCourses.length === 0) return 0
        const totalGradePoints = validCourses.reduce((sum, course) => sum + gradePoints[course.grade] * course.credits, 0)
        const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)
        return totalCredits > 0 ? totalGradePoints / totalCredits : 0
    }

    const calculateSemesterGPA = (courses: ImportedCourse[]): number => {
        const validCourses = courses.filter((course) => course.grade !== "P")
        if (validCourses.length === 0) return 0
        const totalGradePoints = validCourses.reduce((sum, course) => {
            const points = gradePoints[course.grade] || 0
            const credits = typeof course.credits === 'string' ? parseFloat(course.credits) : course.credits
            return sum + points * credits
        }, 0)
        const totalCredits = validCourses.reduce((sum, course) => {
            const credits = typeof course.credits === 'string' ? parseFloat(course.credits) : course.credits
            return sum + credits
        }, 0)
        return totalCredits > 0 ? totalGradePoints / totalCredits : 0
    }

    const groupCoursesBySemester = (courses: ImportedCourse[]): SemesterData[] => {
        const semesterMap = new Map<string, ImportedCourse[]>()
        courses.forEach(course => {
            const semester = course.exam_month
            if (!semesterMap.has(semester)) semesterMap.set(semester, [])
            semesterMap.get(semester)!.push(course)
        })
        const sortedSemesters = Array.from(semesterMap.keys()).sort((a, b) => {
            const parseDate = (dateStr: string) => {
                const [month, year] = dateStr.split('-')
                const monthMap: Record<string, number> = {
                    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                }
                return new Date(parseInt(year), monthMap[month] - 1)
            }
            return parseDate(a).getTime() - parseDate(b).getTime()
        })
        return sortedSemesters.map(semester => ({
            semester,
            courses: semesterMap.get(semester)!,
            gpa: calculateSemesterGPA(semesterMap.get(semester)!)
        }))
    }

    const addCourse = () => {
        if (!currentCourse.title.trim()) return alert("Please enter a course title")
        if (!currentCourse.credits || Number.parseFloat(currentCourse.credits) <= 0) return alert("Please enter valid credits (greater than 0)")
        if (!currentCourse.grade) return alert("Please select a grade")
        const newCourse: Course = {
            id: Date.now().toString(),
            title: currentCourse.title.trim(),
            credits: Number.parseFloat(currentCourse.credits),
            grade: currentCourse.grade,
        }
        const updatedCourses = [...courses, newCourse]
        setCourses(updatedCourses)
        setCgpa(calculateCGPA(updatedCourses))
        setCurrentCourse({ title: "", credits: "", grade: "" })
    }

    const removeCourse = (courseId: string) => {
        const updatedCourses = courses.filter((course) => course.id !== courseId)
        setCourses(updatedCourses)
        setCgpa(updatedCourses.length > 0 ? calculateCGPA(updatedCourses) : null)
    }

    const resetCalculator = () => {
        setCourses([])
        setCgpa(null)
        setCurrentCourse({ title: "", credits: "", grade: "" })
        setEncodedData("")
        setImportSuccess(false)
        setImportError(null)
        setSemesterData([])
        setStudentData(null)
    }

    const handleAutomatedImport = async (value?: string) => {
        const toProcess = (value ?? encodedData).trim()
        if (!toProcess) return
        setIsLoading(true)
        setImportError(null)
        setImportSuccess(false)
        try {
            const decoded = decodePayload(toProcess) as StudentData
            if (!decoded.courses || !Array.isArray(decoded.courses)) throw new Error("Invalid data structure - missing courses array")
            const processedStudentData: StudentData = {
                ...decoded,
                id: typeof decoded.id === 'string' ? parseInt(decoded.id) : decoded.id,
                credits_registered: typeof decoded.credits_registered === 'string' ? parseFloat(decoded.credits_registered) : decoded.credits_registered,
                credits_earned: typeof decoded.credits_earned === 'string' ? parseFloat(decoded.credits_earned) : decoded.credits_earned,
                cgpa: typeof decoded.cgpa === 'string' ? parseFloat(decoded.cgpa) : decoded.cgpa,
                courses: decoded.courses.map(course => ({
                    ...course,
                    credits: typeof course.credits === 'string' ? parseFloat(course.credits) : course.credits
                }))
            }
            const semesters = groupCoursesBySemester(processedStudentData.courses)
            setStudentData(processedStudentData)
            setSemesterData(semesters)
            setImportSuccess(true)
            setCourses([])
            setCgpa(null)
            const reportUrl = `/report?data=${encodeURIComponent(toProcess)}`
            window.open(reportUrl, '_blank')
        } catch (error) {
            console.error("Decoding error:", error)
            setImportError("Error processing data. Please check your input.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && currentCourse.title && currentCourse.credits && currentCourse.grade) addCourse()
    }

    useEffect(() => {
        const qp = searchParams.get("data") || searchParams.get("payload")
        if (qp && qp !== encodedData) setEncodedData(qp)
    }, [searchParams, encodedData])

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                            <Calculator className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-xl font-semibold leading-tight">CGPA Calculator</h1>
                            <p className="text-sm text-muted-foreground">Manual entry or instant import from VITAP Student App</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <Link href="#vitap-app-cta">
                            <Button variant="outline" size="sm" className="group">
                                <Smartphone className="h-4 w-4 mr-2" /> Paste encoded string
                                <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={openApp}>
                            <Smartphone className="h-4 w-4 mr-2" /> Open App
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 -z-10 opacity-50" aria-hidden>
                            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Manual Calculator</CardTitle>
                            <CardDescription>Add courses and get CGPA instantly</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="course-title">Course Title</Label>
                                <Input id="course-title" placeholder="Data Structures and Algorithms" value={currentCourse.title} onChange={(e) => setCurrentCourse((p: any) => ({ ...p, title: e.target.value }))} onKeyPress={handleKeyPress} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="credits">Credits</Label>
                                    <Input id="credits" type="number" step="0.5" min="0.5" max="10" placeholder="3" value={currentCourse.credits} onChange={(e) => setCurrentCourse((p: any) => ({ ...p, credits: e.target.value }))} onKeyPress={handleKeyPress} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="grade">Grade</Label>
                                    <Select value={currentCourse.grade} onValueChange={(value) => setCurrentCourse((p: any) => ({ ...p, grade: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="S">S (10)</SelectItem>
                                            <SelectItem value="A">A (9)</SelectItem>
                                            <SelectItem value="B">B (8)</SelectItem>
                                            <SelectItem value="C">C (7)</SelectItem>
                                            <SelectItem value="D">D (6)</SelectItem>
                                            <SelectItem value="E">E (5)</SelectItem>
                                            <SelectItem value="F">F (0)</SelectItem>
                                            <SelectItem value="P">P (Pass)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button onClick={addCourse} className="flex-1" disabled={!currentCourse.title.trim() || !currentCourse.credits || !currentCourse.grade}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Course
                                </Button>
                                <Button variant="outline" onClick={resetCalculator} disabled={courses.length === 0}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            {courses.length > 0 && cgpa !== null && (
                                <div className="mt-4 rounded-lg border p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1"><Award className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Current CGPA</span></div>
                                    <div className="text-3xl font-semibold">{cgpa.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Based on {courses.filter(c => c.grade !== "P").length} courses</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card id="vitap-app-cta" className="relative overflow-hidden">
                        <div className="absolute inset-0 -z-10 opacity-50" aria-hidden>
                            <div className="absolute -left-16 -bottom-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Academic Report</CardTitle>
                            <CardDescription>Paste your encoded string from the VITAP Student App</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center gap-2">
                                <Smartphone className="h-4 w-4" /> Open the app → Grades → Share grades → Paste below
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="encoded-data">Encoded Data</Label>
                                <Textarea id="encoded-data" placeholder="Paste your encoded academic data here..." value={encodedData} onChange={(e) => setEncodedData(e.target.value)} rows={5} className="resize-none" />
                            </div>
                            <Button onClick={() => handleAutomatedImport()} disabled={!encodedData.trim() || isLoading} className="w-full">
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" /> Import & Edit Data
                                    </>
                                )}
                            </Button>
                            {importSuccess && (
                                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-900/30 dark:bg-green-900/20">
                                    <CheckCircle className="h-4 w-4 text-green-600" /> Imported successfully. Opening interactive report...
                                </div>
                            )}
                            {importError && (
                                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/30 dark:bg-red-900/20">
                                    <AlertCircle className="h-4 w-4 text-red-600" /> {importError}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {courses.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Course Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-[1fr,280px]">
                                <div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b bg-muted/30">
                                                    <th className="text-left p-3 font-medium">Course</th>
                                                    <th className="text-left p-3 font-medium">Credits</th>
                                                    <th className="text-left p-3 font-medium">Grade</th>
                                                    <th className="text-left p-3 font-medium">Points</th>
                                                    <th className="text-left p-3 font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courses.map((course, index) => (
                                                    <tr key={course.id} className={`border-b hover:bg-muted/20 transition-colors ${index % 2 === 0 ? "bg-background" : ""}`}>
                                                        <td className="p-3">{course.title}</td>
                                                        <td className="p-3 font-mono">{course.credits}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-sm font-medium ${course.grade === "S" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" :
                                                                course.grade === "A" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" :
                                                                    course.grade === "B" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" :
                                                                        course.grade === "C" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200" :
                                                                            course.grade === "F" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" :
                                                                                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}>
                                                                {course.grade}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-mono">{course.grade === "P" ? "N/A" : gradePoints[course.grade]}</td>
                                                        <td className="p-3">
                                                            <Button variant="ghost" size="sm" onClick={() => removeCourse(course.id)} className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <div className="text-sm font-medium mb-2">Grade Distribution</div>
                                    <GradeDistribution courses={courses as any} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
