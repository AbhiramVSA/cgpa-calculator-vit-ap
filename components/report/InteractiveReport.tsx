"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, BookOpen, Calendar, ExternalLink, Printer, RefreshCcw, Smartphone, Star } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts"
import type { Course as ImportedCourse } from "@/lib/decodePayload"
import { Input } from "../ui/input"

type Course = ImportedCourse

export interface StudentData {
    id: number
    credits_registered: number
    credits_earned: number
    cgpa: number
    courses: Course[]
}

export interface newSemester {
    month: string,
    year: string,
    courses: Course[],
    gpa: number
}

type courseSuggestion = {
    course_code: string,
    course_title: string,
    course_type: string,
    credits: number
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

function calculateSemesterGPA(courses: Course[]): number {
    const valid = courses.filter((c) => c.grade !== "P")
    if (!valid.length) return 0
    const totalPoints = valid.reduce((s, c) => s + (gradePoints[c.grade] || 0) * Number(c.credits), 0)
    const totalCredits = valid.reduce((s, c) => s + Number(c.credits), 0)
    return totalCredits ? totalPoints / totalCredits : 0
}

function groupBySemester(courses: Course[]) {
    const map = new Map<string, Course[]>()
    for (const c of courses) {
        const k = c.exam_month
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(c)
    }
    const parseDate = (m: string) => {
        const [mon, year] = m.split("-")
        const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
        return new Date(Number(year), months[mon] ?? 0).getTime()
    }
    const semesters = Array.from(map.keys()).sort((a, b) => parseDate(a) - parseDate(b))
    return semesters.map((s) => ({ semester: s, courses: map.get(s)!, gpa: calculateSemesterGPA(map.get(s)!) }))
}

async function fetchCoursesForSuggestion(path: string='courses.csv') {
    let courses: courseSuggestion[] = []
    try {
        const response = await fetch(path)
        if (!response.ok) {
            throw new Error(`HTTP error while fetching ${path} : ${response.status}`)
        }
        const data = await response.text()
        courses = data
            .split('\n')
            .slice(1)
            .map((line) => {
                const [course_code, course_title, course_type, credits] = line.split(',')

                return {
                    course_code: course_code?.trim(),
                    course_title: course_title?.trim(),
                    course_type: course_type?.trim(),
                    credits: Number(credits)
                }
            })
            .filter(c => c.course_code) // remove empty lines
    } catch (error) {
        console.error("Error obtaing or parsing courses data:", error)
    }
    return courses
}

async function encodeBase64Gzip(input:string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)

    const cs = new CompressionStream('gzip')
    const writer = cs.writable.getWriter()
    writer.write(data)
    writer.close()

    const compressed = await new Response(cs.readable).arrayBuffer()

    const base64 = btoa(
        String.fromCharCode(...new Uint8Array(compressed))
    )

    return base64
}

export function InteractiveReport({ initial }: { initial: StudentData }) {
    const [data, setData] = useState<StudentData>(initial)

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]

    const [newSemester, setNewSemester] = useState<newSemester>({
        month: months[new Date().getMonth()],
        year: String(currentYear),
        courses: [],
        gpa: 0
    })

    const [courseCounter,setCourseCounter] = useState(417)

    const [newCourse, setNewCourse] = useState<Course>({
        id: courseCounter,
        course_code: "",
        course_title: "",
        course_type:"",
        credits:0,
        grade:"P",
        exam_month:"",
        course_distribution: "UE"
    })

    const [courseSuggestionList, setCourseSuggestionList] = useState<courseSuggestion[]>([])

    useEffect(() => {
        const encUrl = window.location.href
        const paramData = decodeURIComponent(encUrl.split("data=")[1]).replaceAll('/','_').replaceAll('+','-')
        const decUrl = encUrl.split("data=")[0] + "data=" + paramData
        setNewEncodedString(decUrl)
        fetchCoursesForSuggestion().then((data) => {
            if (data) setCourseSuggestionList(data)
        })
    }, [])

    const [filteredCourses, setFilteredCourses] = useState<courseSuggestion[]>([])

    const [showCCodeSuggestions, setShowCCodeSuggestions] = useState(false)
    const [showCNameSuggestions, setShowCNameSuggestions] = useState(false)
    const [newEncodedString, setNewEncodedString] = useState('')

    const semesters = useMemo(() => groupBySemester(data.courses), [data.courses])
    const overall = useMemo(() => {
        const valid = data.courses.filter((c) => c.grade !== "P")
        const points = valid.reduce((s, c) => s + (gradePoints[c.grade] || 0) * Number(c.credits), 0)
        const credits = valid.reduce((s, c) => s + Number(c.credits), 0)
        const cgpa = credits ? points / credits : 0
        const avgGpa = semesters.length ? semesters.reduce((s, x) => s + x.gpa, 0) / semesters.length : 0
        return { cgpa, avgGpa, courses: data.courses.length }
    }, [data.courses, semesters])

    // Charts data
    const gpaTrendData = useMemo(() => semesters.map((s) => ({ name: s.semester, gpa: Number(s.gpa.toFixed(2)) })), [semesters])
    const creditsBySemData = useMemo(() => {
        return semesters.map((s) => {
            const total = s.courses.reduce((sum, c) => sum + Number(c.credits), 0)
            const counted = s.courses.filter((c) => c.grade !== "P").reduce((sum, c) => sum + Number(c.credits), 0)
            return { name: s.semester, total, counted }
        })
    }, [semesters])
    const gradeDistributionData = useMemo(() => {
        const counts = data.courses.reduce<Record<string, number>>((acc, c) => {
            acc[c.grade] = (acc[c.grade] || 0) + 1
            return acc
        }, {})
        return Object.entries(counts)
            .map(([grade, value]) => ({ grade, value }))
            .sort((a, b) => (a.grade > b.grade ? 1 : -1))
    }, [data.courses])
    // Vibrant palette per grade (colorful to pop on b/w background)
    const GRADE_COLORS: Record<string, string> = {
        S: "#10b981", // emerald
        A: "#3b82f6", // blue
        B: "#f59e0b", // amber
        C: "#f97316", // orange
        D: "#ef4444", // red
        E: "#ef4444", // red
        F: "#b91c1c", // dark red
        P: "#6b7280", // gray
    }

    const changeGrade = (courseId: number, newGrade: string) => {
        setData((prev) => ({
            ...prev,
            courses: prev.courses.map((c) => (c.id === courseId ? { ...c, grade: newGrade } : c)),
        }))
    }

    const handleCourseTitleChange = (value: string) => {
        setNewCourse((prev) => ({ ...prev, course_title: value }))
        setFilteredCourses(courseSuggestionList.filter(c => c.course_title.toLowerCase().includes(value.toLowerCase())))
    }
    const handleCourseCodeChange = (value: string) => {
        setNewCourse((prev) => ({ ...prev, course_code: value }))
        setFilteredCourses(courseSuggestionList.filter(c => c.course_code.toLowerCase().includes(value.toLowerCase())))
    }
    
    const changeGradeNewSemester = (courseId: number, newGrade: string) => {
        setNewSemester((prev) => {
            const updatedCourses = prev.courses.map((c) => (c.id === courseId ? { ...c, grade: newGrade } : c))
            return { ...prev, courses: updatedCourses, gpa: calculateSemesterGPA(updatedCourses) }
        })
    }

    const addNewCourseToSemester = () => {
        console.log("Adding course", newCourse)
        console.log("To semester", newSemester)
        setNewSemester((prev) => {
            const updatedCourses = [...prev.courses, newCourse]
            return { ...prev, courses: updatedCourses, gpa: calculateSemesterGPA(updatedCourses) }
        })
        setCourseCounter((oldId) => {
            setNewCourse({
                id: oldId + 1,
                course_code: "",
                course_title: "",
                course_type:"",
                credits:0,
                grade:"P",
                exam_month:"",
                course_distribution: "UE"
            })
        return oldId + 1
        })
        setFilteredCourses([])
    }

    const addNewSemesterToData  = async () => {
        const semString = `${newSemester.month}-${newSemester.year}`
        let courseIdCounter = data.courses.length + 1
        const coursesWithSem = newSemester.courses.map(c => ({ ...c, id: courseIdCounter++, exam_month: semString }))
        const newCredits = coursesWithSem.reduce((s, c) => s + Number(c.credits), 0)
        const newEarned = coursesWithSem.filter(c => c.grade !== "F").reduce((s, c) => s + Number(c.credits), 0)
        const updatedData = {
            ...data,
            credits_registered: data.credits_registered + newCredits,
            credits_earned: data.credits_earned + newEarned,
            courses: [...data.courses, ...coursesWithSem]
        }
        setData(updatedData)
        setNewSemester({
            month: months[new Date().getMonth()],
            year: String(currentYear),
            courses: [],
            gpa: 0
        })
        const newEncStr = await encodeBase64Gzip(JSON.stringify(updatedData))
        setNewEncodedString((prev) => {
            return prev.split("data=")[0] + "data=" + newEncStr.replaceAll('/','_').replaceAll('+','-')
        })
    }

    const removeCourseFromNewSemester = (courseId: number) => {
        setNewSemester((prev) => {
            const updatedCourses = prev.courses.filter((c) => c.id !== courseId)
            return { ...prev, courses: updatedCourses, gpa: calculateSemesterGPA(updatedCourses) }
        })
    }

    const writeToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                alert("Text copied to clipboard!");
            } else {
                alert("Clipboard API is not supported in this browser.");
            }
        } catch (err) {
            console.error("Failed to copy:", err);
            alert("Failed to copy text. Please try again.");
        }
    }

    const handleCopyJson = () => {
        writeToClipboard(JSON.stringify(data))
    }
    const handleCopyURL = () => {
        writeToClipboard(newEncodedString)
    }
    const handleCopyEncString = () => {
        writeToClipboard(newEncodedString.split('data=')[1])
    }

    const reset = () => setData(initial)

    const openApp = () => {
        const ua = navigator.userAgent || ""
        const isAndroid = /Android/i.test(ua)
        const isIOS = /iPhone|iPad|iPod/i.test(ua)
        const pkg = "com.udhay.vitapstudentapp"
        const play = `https://play.google.com/store/apps/details?id=${pkg}`
        const appstore = "https://apps.apple.com/in/app/vitap-student/id6748966515"
        const iosScheme = "vitapstudent://grades" // adjust if different
        const start = Date.now()
        const t = setTimeout(() => {
            if (Date.now() - start < 1800) return
            window.location.href = isAndroid ? play : appstore
        }, 1500)
        if (isAndroid) window.location.href = `intent://grades#Intent;package=${pkg};end`
        else if (isIOS) window.location.href = iosScheme
        else {
            clearTimeout(t)
            window.open("https://github.com/AbhiramVSA/cgpa-calculator-vit-ap", "_blank")
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
            <div className="sm:flex flex items-end justify-end gap-3 mb-6">
                <Button variant="outline" size="sm" onClick={reset}><RefreshCcw className="h-4 w-4 mr-2" /> Reset</Button>
                <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overall CGPA</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="text-3xl font-semibold">{overall.cgpa.toFixed(2)}</div>
                        <div className="text-right text-sm text-muted-foreground">
                            <div>{overall.courses} courses</div>
                            <div>Avg GPA {overall.avgGpa.toFixed(2)}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="text-3xl font-semibold">{data.credits_earned}</div>
                        <div className="text-right text-sm text-muted-foreground">of {data.credits_registered} registered</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Semesters</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="text-3xl font-semibold">{semesters.length}</div>
                        <div className="text-right text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Journey</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">GPA trend by semester</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <div className="h-64 w-full">
                            <ResponsiveContainer>
                                <LineChart data={gpaTrendData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                                    <CartesianGrid stroke="currentColor" strokeOpacity={0.15} />
                                    <XAxis dataKey="name" tickMargin={8} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 10]} tickMargin={8} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                                    <Line
                                        type="monotone"
                                        dataKey="gpa"
                                        stroke="#a78bfa" /* violet-400 */
                                        strokeWidth={2}
                                        dot={{ r: 3, stroke: "#a78bfa", fill: "#a78bfa" }}
                                        activeDot={{ r: 4, stroke: "#a78bfa", fill: "#a78bfa" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Credits by semester</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <div className="h-64 w-full">
                            <ResponsiveContainer>
                                <BarChart data={creditsBySemData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                                    <CartesianGrid stroke="currentColor" strokeOpacity={0.15} />
                                    <XAxis dataKey="name" tickMargin={8} tickLine={false} axisLine={false} />
                                    <YAxis tickMargin={8} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                                    <Legend />
                                    <Bar dataKey="counted" name="Counted" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="total" name="Total" fill="#06b6d4" fillOpacity={0.7} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Grade distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(val, name) => [String(val), `Grade ${String(name)}`]} />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                    <Pie data={gradeDistributionData} dataKey="value" nameKey="grade" innerRadius={48} outerRadius={80} paddingAngle={3} stroke="hsl(var(--border))">
                                        {gradeDistributionData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 space-y-6">
                {semesters.map((sem) => (
                    <Card key={sem.semester} className="overflow-hidden">
                        <CardHeader className="bg-muted/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                                        <Calendar className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="font-semibold">{sem.semester}</div>
                                        <div className="text-xs text-muted-foreground">{sem.courses.length} courses</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-semibold">{sem.gpa.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">Semester GPA</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left p-3 text-xs font-medium uppercase tracking-wide">Course</th>
                                            <th className="text-left p-3 text-xs font-medium uppercase tracking-wide">Title</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Type</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Credits</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Grade</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sem.courses.map((c) => (
                                            <tr key={c.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium text-primary">{c.course_code}</td>
                                                <td className="p-3">
                                                    <div className="font-medium leading-tight">{c.course_title}</div>
                                                    <div className="text-xs text-muted-foreground">{c.course_distribution}</div>
                                                </td>
                                                <td className="p-3 text-center text-sm text-muted-foreground">{c.course_type}</td>
                                                <td className="p-3 text-center font-mono">{c.credits}</td>
                                                <td className="p-3 text-center">
                                                    <Select value={c.grade} onValueChange={(v) => changeGrade(c.id, v)}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(["S", "A", "B", "C", "D", "E", "F", "P"] as const).map((g) => (
                                                                <SelectItem key={g} value={g}>
                                                                    {g} {g === "P" ? "(Pass)" : `(${gradePoints[g]})`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-3 text-center font-mono">{c.grade === "P" ? "N/A" : (gradePoints[c.grade] || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Card key="newSemester" className="overflow-hidden">
                        <CardHeader className="bg-muted/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                                        <Calendar className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            <Select value={newSemester.month} onValueChange={(v) => setNewSemester((s) => ({ ...s, month: v }))}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(months).map((month) => (
                                                                <SelectItem key={month} value={month}>
                                                                    {month}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>-<Select value={newSemester.year} onValueChange={(v) => setNewSemester((s) => ({ ...s, year: v }))}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(years).map((year) => (
                                                                <SelectItem key={year} value={year.toString()}>
                                                                    {year}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{newSemester.courses.length} courses</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-semibold">{newSemester.gpa.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">Semester GPA</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="text-left p-3 text-xs font-medium uppercase tracking-wide">Course</th>
                                            <th className="text-left p-3 text-xs font-medium uppercase tracking-wide">Title</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Type</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Credits</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Grade</th>
                                            <th className="text-center p-3 text-xs font-medium uppercase tracking-wide">Add/Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr key="newCourse" className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium text-primary">
                                                    <Input
                                                            id="course-title"
                                                            placeholder="1008"
                                                            value={newCourse.course_code}
                                                            onFocus={() => setShowCCodeSuggestions(true)}
                                                            onChange={(e) => handleCourseCodeChange(e.target.value)}
                                                            onBlur={() => setShowCCodeSuggestions(false)}
                                                        />
                                                        {showCCodeSuggestions && filteredCourses.length > 0 && (
                                                                <div className="mx-auto w-full rounded-md border shadow-md max-h-40 overflow-auto">
                                                                {filteredCourses.map((course, index) => (
                                                                    <div
                                                                    key={`${course.course_code}-${index}`}
                                                                    className="px-3 py-2 dark:hover:bg-input/50 hover:bg-white cursor-pointer"
                                                                    onMouseDown={() => {
                                                                        setNewCourse((p) => ({
                                                                        ...p,
                                                                        course_code: course.course_code,
                                                                        course_title: course.course_title,
                                                                        course_type: course.course_type,
                                                                        credits: course.credits,
                                                                        }))
                                                                        setShowCCodeSuggestions(false)
                                                                    }}
                                                                    >
                                                                    <div className="font-medium">{course.course_code}</div>
                                                                    <div className="text-xs text-gray-500">{course.course_title}</div>
                                                                    </div>
                                                                ))}
                                                                </div>
                                                            )}
                                                </td>
                                                <td className="p-3 font-medium text-primary">
                                                    <div className="font-medium leading-tight">
                                                            <Input
                                                                id="course-title"
                                                                placeholder="Introduction to Programming"
                                                                value={newCourse.course_title}
                                                                onFocus={() => setShowCNameSuggestions(true)}
                                                                onChange={(e) => handleCourseTitleChange(e.target.value)}
                                                                onBlur={() => setShowCNameSuggestions(false)}
                                                            />
                                                            {showCNameSuggestions && filteredCourses.length > 0 && (
                                                                <div className="mx-auto rounded-md border shadow-md max-h-40 overflow-auto">
                                                                {filteredCourses.map((course, index) => (
                                                                    <div
                                                                    key={`${course.course_code}-${index}`}
                                                                    className="px-3 py-2 dark:hover:bg-input/50 hover:bg-white cursor-pointer"
                                                                    onMouseDown={() => {
                                                                        setNewCourse((p) => ({
                                                                        ...p,
                                                                        course_code: course.course_code,
                                                                        course_title: course.course_title,
                                                                        course_type: course.course_type,
                                                                        credits: course.credits,
                                                                        }))
                                                                        setShowCNameSuggestions(false)
                                                                    }}
                                                                    >
                                                                    <div className="font-medium">{course.course_title}</div>
                                                                    <div className="text-xs text-gray-500">{course.course_code}</div>
                                                                    </div>
                                                                ))}
                                                                </div>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-sm text-muted-foreground">
                                                    <Select value={newCourse.course_type} onValueChange={(v) => setNewCourse((s) => ({ ...s, course_type: v }))}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(["LO","NCC","ECA","ETP","TH","ETL","PJT"] as const).map((type) => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-3 text-center font-mono">
                                                    <Input
                                                        id="credits"
                                                        type="number"
                                                        step="0.5"
                                                        min="0.5"
                                                        max="12"
                                                        placeholder="3"
                                                        value={newCourse.credits}
                                                        onChange={(e) => setNewCourse((p: any) => ({ ...p, credits: e.target.value }))}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Select value={newCourse.grade} onValueChange={(v) => setNewCourse((p: any) => ({ ...p, grade: v }))}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(["S", "A", "B", "C", "D", "E", "F", "P"] as const).map((g) => (
                                                                <SelectItem key={g} value={g}>
                                                                    {g} {g === "P" ? "(Pass)" : `(${gradePoints[g]})`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-3 text-center font-mono">
                                                    <Button
                                                        onClick={addNewCourseToSemester}
                                                        className="flex-1"
                                                        disabled={!newCourse.course_title.trim() || !newCourse.credits || !newCourse.grade}
                                                        >+
                                                    </Button>
                                                </td>
                                            </tr>
                                        {newSemester.courses.map((c) => (
                                            <tr key={c.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium text-primary">{c.course_code}</td>
                                                <td className="p-3">
                                                    <div className="font-medium leading-tight">{c.course_title}</div>
                                                    <div className="text-xs text-muted-foreground">{c.course_distribution}</div>
                                                </td>
                                                <td className="p-3 text-center text-sm text-muted-foreground">{c.course_type}</td>
                                                <td className="p-3 text-center font-mono">{c.credits}</td>
                                                <td className="p-3 text-center">
                                                    <Select value={c.grade} onValueChange={(v) => changeGradeNewSemester(c.id, v)}>
                                                        <SelectTrigger size="sm" className="mx-auto">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(["S", "A", "B", "C", "D", "E", "F", "P"] as const).map((g) => (
                                                                <SelectItem key={g} value={g}>
                                                                    {g} {g === "P" ? "(Pass)" : `(${gradePoints[g]})`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-3 text-center font-mono">
                                                    <Button
                                                        onClick={() => removeCourseFromNewSemester(c.id)}
                                                        className="flex-1 bg-red-500 hover:bg-red-400 text-white"
                                                        >-
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <Button
                            onClick={addNewSemesterToData}
                            className="mx-auto mb-4"
                            disabled={newSemester.courses.length==0}
                            >Push
                        </Button>
                    </Card>
            </div>
            <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Updated URL</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Input
                            id="copy-url"
                            placeholder="URL"
                            value={newEncodedString} readOnly
                        />
                        <div className="text-right text-sm text-muted-foreground">
                            <Button size="sm" onClick={() => handleCopyURL()}>
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Encoded Data</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Input
                            id="copy-encoded-data"
                            placeholder="Encoded Data"
                            value={newEncodedString.includes("=") ? newEncodedString.split("data=")[1] : ""} readOnly
                        />
                        <div className="text-right text-sm text-muted-foreground">
                            <Button size="sm" onClick={() => handleCopyEncString()}>
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Data JSON</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Input
                            id="copy-url"
                            placeholder="URL"
                            value={data ? JSON.stringify(data) : ""} readOnly
                        />
                        <div className="text-right text-sm text-muted-foreground">
                            <Button size="sm" onClick={() => handleCopyJson()}>
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
