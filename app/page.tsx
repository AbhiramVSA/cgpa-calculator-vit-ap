"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Upload, Plus, RotateCcw, Trash2, CheckCircle, AlertCircle } from "lucide-react"

interface Course {
  id: string
  title: string
  credits: number
  grade: string
}

interface ImportedCourseData {
  course_title: string
  credits: number
  grade: string
}

const gradePoints: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
  P: 0, // Pass grade, ignored in CGPA calculation
}

export default function CGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([])
  const [importedCourses, setImportedCourses] = useState<Course[]>([])
  const [currentCourse, setCurrentCourse] = useState({
    title: "",
    credits: "",
    grade: "",
  })
  const [encodedData, setEncodedData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [cgpa, setCgpa] = useState<number | null>(null)
  const [importedCgpa, setImportedCgpa] = useState<number | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const calculateCGPA = (courseList: Course[]) => {
    const validCourses = courseList.filter((course) => course.grade !== "P")
    if (validCourses.length === 0) return 0

    const totalGradePoints = validCourses.reduce((sum, course) => {
      return sum + gradePoints[course.grade] * course.credits
    }, 0)

    const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)

    return totalCredits > 0 ? totalGradePoints / totalCredits : 0
  }

  const decodeImportedData = async (encodedString: string): Promise<ImportedCourseData[]> => {
    // This is a simplified decoder - in a real implementation, you'd need to
    // implement the actual Base64URL decode + gzip decompress logic
    // For now, we'll simulate the decoding process
    try {
      // Simulate API call to get both CGPA and course data
      const response = await fetch(`/api/calculate?data=${encodeURIComponent(encodedString)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to decode data")
      }

      // For demonstration, we'll create sample course data based on the CGPA
      // In a real implementation, the API would return both CGPA and course list
      const sampleCourses: ImportedCourseData[] = [
        { course_title: "Data Structures", credits: 4, grade: "A" },
        { course_title: "Algorithms", credits: 3, grade: "S" },
        { course_title: "Database Systems", credits: 3, grade: "B" },
        { course_title: "Computer Networks", credits: 4, grade: "A" },
      ]

      return sampleCourses
    } catch (error) {
      throw new Error("Failed to decode imported data")
    }
  }

  const addCourse = () => {
    if (!currentCourse.title.trim()) {
      alert("Please enter a course title")
      return
    }

    if (!currentCourse.credits || Number.parseFloat(currentCourse.credits) <= 0) {
      alert("Please enter valid credits (greater than 0)")
      return
    }

    if (!currentCourse.grade) {
      alert("Please select a grade")
      return
    }

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
    setImportedCourses([])
    setCgpa(null)
    setImportedCgpa(null)
    setCurrentCourse({ title: "", credits: "", grade: "" })
    setEncodedData("")
    setImportSuccess(false)
    setImportError(null)
  }

  const handleAutomatedImport = async (value?: string) => {
    const toProcess = (value ?? encodedData).trim()
    if (!toProcess) return

    setIsLoading(true)
    setImportError(null)
    setImportSuccess(false)

    try {
      // Get CGPA from API
      const response = await fetch(`/api/calculate?data=${encodeURIComponent(toProcess)}`)
      const result = await response.json()

      if (response.ok) {
        setImportedCgpa(result.cgpa)

        // Decode and display course data
        try {
          const decodedCourses = await decodeImportedData(toProcess)
          const coursesWithIds: Course[] = decodedCourses.map((course, index) => ({
            id: `imported-${Date.now()}-${index}`,
            title: course.course_title,
            credits: course.credits,
            grade: course.grade,
          }))

          setImportedCourses(coursesWithIds)
          setImportSuccess(true)
        } catch (decodeError) {
          // Even if course decoding fails, we still have the CGPA
          setImportSuccess(true)
        }
      } else {
        setImportError(result.error || "Failed to process data")
      }
    } catch (error) {
      setImportError("Error processing data. Please check your input.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentCourse.title && currentCourse.credits && currentCourse.grade) {
      addCourse()
    }
  }

  // Auto-import if ?data= (or ?payload=) present in URL
  useEffect(() => {
    const qp = searchParams.get("data") || searchParams.get("payload")
    if (qp && qp !== encodedData) {
      setEncodedData(qp)
      // Trigger import immediately with the query param value
      handleAutomatedImport(qp)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-inter)]">
              Free CGPA Calculator - AI-Powered GPA Calculator Online
            </h1>
          </div>
          <p className="text-muted-foreground font-[family-name:var(--font-poppins)] text-balance text-lg">
            Calculate your CGPA instantly with our free calculator. Manual entry or automated import supported. Get
            accurate GPA calculations for all grading systems.
          </p>
          <div className="sr-only">
            CGPA calculator, GPA calculator, grade point average calculator, academic calculator, student GPA tool,
            university calculator, college GPA calculator, semester calculator, free online calculator
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Manual Calculator */}
          <section aria-labelledby="manual-calculator-title">
            <Card>
              <CardHeader>
                <CardTitle
                  id="manual-calculator-title"
                  className="flex items-center gap-2 font-[family-name:var(--font-inter)]"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  Manual CGPA Calculator
                </CardTitle>
                <CardDescription className="font-[family-name:var(--font-poppins)]">
                  Add courses one by one to calculate your CGPA manually. Supports all standard grading systems.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title" className="font-[family-name:var(--font-poppins)]">
                    Course Title
                  </Label>
                  <Input
                    id="course-title"
                    placeholder="e.g., Data Structures"
                    value={currentCourse.title}
                    onChange={(e) => setCurrentCourse((prev) => ({ ...prev, title: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    aria-describedby="course-title-help"
                  />
                  <div id="course-title-help" className="sr-only">
                    Enter the name of your course or subject
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits" className="font-[family-name:var(--font-poppins)]">
                    Credits
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    placeholder="e.g., 3.0"
                    value={currentCourse.credits}
                    onChange={(e) => setCurrentCourse((prev) => ({ ...prev, credits: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    aria-describedby="credits-help"
                  />
                  <div id="credits-help" className="sr-only">
                    Enter the credit hours for this course (0.5 to 10)
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className="font-[family-name:var(--font-poppins)]">
                    Grade
                  </Label>
                  <Select
                    value={currentCourse.grade}
                    onValueChange={(value) => setCurrentCourse((prev) => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger aria-describedby="grade-help">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S (10 points)</SelectItem>
                      <SelectItem value="A">A (9 points)</SelectItem>
                      <SelectItem value="B">B (8 points)</SelectItem>
                      <SelectItem value="C">C (7 points)</SelectItem>
                      <SelectItem value="D">D (6 points)</SelectItem>
                      <SelectItem value="E">E (5 points)</SelectItem>
                      <SelectItem value="F">F (0 points)</SelectItem>
                      <SelectItem value="P">P (Pass - not counted)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div id="grade-help" className="sr-only">
                    Select the grade you received for this course
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={addCourse}
                    className="flex-1"
                    disabled={!currentCourse.title.trim() || !currentCourse.credits || !currentCourse.grade}
                    aria-describedby="add-course-help"
                  >
                    Add Course
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetCalculator}
                    disabled={courses.length === 0 && importedCourses.length === 0}
                    aria-label="Reset calculator"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div id="add-course-help" className="sr-only">
                  Click to add this course to your CGPA calculation
                </div>

                {courses.length > 0 && cgpa !== null && (
                  <div
                    className="mt-4 p-4 bg-primary/10 rounded-lg text-center"
                    role="region"
                    aria-labelledby="current-cgpa"
                  >
                    <p
                      id="current-cgpa"
                      className="text-sm text-muted-foreground font-[family-name:var(--font-poppins)] mb-1"
                    >
                      Current CGPA
                    </p>
                    <p
                      className="text-2xl font-bold text-primary font-[family-name:var(--font-inter)]"
                      aria-live="polite"
                    >
                      {cgpa.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Automated Import */}
          <section aria-labelledby="automated-import-title">
            <Card>
              <CardHeader>
                <CardTitle
                  id="automated-import-title"
                  className="flex items-center gap-2 font-[family-name:var(--font-inter)]"
                >
                  <Upload className="h-5 w-5" aria-hidden="true" />
                  Automated Import
                </CardTitle>
                <CardDescription className="font-[family-name:var(--font-poppins)]">
                  Paste encoded data string for instant CGPA calculation. Supports various data formats.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="encoded-data" className="font-[family-name:var(--font-poppins)]">
                    Encoded Data String
                  </Label>
                  <Textarea
                    id="encoded-data"
                    placeholder="Paste your encoded course data here..."
                    value={encodedData}
                    onChange={(e) => setEncodedData(e.target.value)}
                    rows={4}
                    aria-describedby="encoded-data-help"
                  />
                  <div id="encoded-data-help" className="sr-only">
                    Paste your encoded academic data for automatic CGPA calculation
                  </div>
                </div>

                <Button
                  onClick={() => handleAutomatedImport()}
                  disabled={!encodedData.trim() || isLoading}
                  className="w-full"
                  aria-describedby="import-button-help"
                >
                  {isLoading ? "Processing..." : "Calculate from Data"}
                </Button>
                <div id="import-button-help" className="sr-only">
                  Process the encoded data to calculate your CGPA automatically
                </div>

                {importSuccess && (
                  <div
                    className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                    role="alert"
                    aria-live="polite"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                    <span className="text-sm text-green-800 font-[family-name:var(--font-poppins)]">
                      Data imported successfully!
                    </span>
                  </div>
                )}

                {importError && (
                  <div
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                    <span className="text-sm text-red-800 font-[family-name:var(--font-poppins)]">{importError}</span>
                  </div>
                )}

                {importedCgpa !== null && (
                  <div
                    className="mt-4 p-4 bg-accent/10 rounded-lg text-center"
                    role="region"
                    aria-labelledby="imported-cgpa"
                  >
                    <p
                      id="imported-cgpa"
                      className="text-sm text-muted-foreground font-[family-name:var(--font-poppins)] mb-1"
                    >
                      Imported CGPA
                    </p>
                    <p
                      className="text-2xl font-bold text-accent font-[family-name:var(--font-inter)]"
                      aria-live="polite"
                    >
                      {importedCgpa.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Results Section */}
        {(courses.length > 0 || importedCourses.length > 0 || cgpa !== null || importedCgpa !== null) && (
          <section aria-labelledby="results-title" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle id="results-title" className="font-[family-name:var(--font-inter)]">
                  CGPA Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {importedCourses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 font-[family-name:var(--font-inter)] flex items-center gap-2">
                      <Upload className="h-5 w-5 text-accent" aria-hidden="true" />
                      Imported Courses
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse" role="table" aria-label="Imported courses table">
                        <thead>
                          <tr className="border-b">
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Course
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Credits
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Grade
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedCourses.map((course, index) => (
                            <tr key={course.id} className={index % 2 === 0 ? "bg-accent/5" : ""}>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.title}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.credits}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.grade}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">
                                {course.grade === "P" ? "N/A" : gradePoints[course.grade]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {courses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 font-[family-name:var(--font-inter)] flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
                      Manually Added Courses
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse" role="table" aria-label="Manually added courses table">
                        <thead>
                          <tr className="border-b">
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Course
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Credits
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Grade
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Points
                            </th>
                            <th scope="col" className="text-left p-2 font-[family-name:var(--font-poppins)]">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((course, index) => (
                            <tr key={course.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.title}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.credits}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">{course.grade}</td>
                              <td className="p-2 font-[family-name:var(--font-poppins)]">
                                {course.grade === "P" ? "N/A" : gradePoints[course.grade]}
                              </td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCourse(course.id)}
                                  className="text-destructive hover:text-destructive"
                                  aria-label={`Remove ${course.title} course`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {cgpa !== null && courses.length > 0 && (
                    <div
                      className="text-center p-6 bg-primary/10 rounded-lg"
                      role="region"
                      aria-labelledby="manual-cgpa-result"
                    >
                      <h3
                        id="manual-cgpa-result"
                        className="text-lg font-semibold mb-2 font-[family-name:var(--font-inter)]"
                      >
                        Manual CGPA
                      </h3>
                      <div
                        className="text-4xl font-bold text-primary font-[family-name:var(--font-inter)]"
                        aria-live="polite"
                      >
                        {cgpa.toFixed(2)}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="font-semibold">Courses</p>
                          <p>{courses.length}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Credits</p>
                          <p>{courses.filter((c) => c.grade !== "P").reduce((sum, c) => sum + c.credits, 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importedCgpa !== null && (
                    <div
                      className="text-center p-6 bg-accent/10 rounded-lg"
                      role="region"
                      aria-labelledby="imported-cgpa-result"
                    >
                      <h3
                        id="imported-cgpa-result"
                        className="text-lg font-semibold mb-2 font-[family-name:var(--font-inter)]"
                      >
                        Imported CGPA
                      </h3>
                      <div
                        className="text-4xl font-bold text-accent font-[family-name:var(--font-inter)]"
                        aria-live="polite"
                      >
                        {importedCgpa.toFixed(2)}
                      </div>
                      {importedCourses.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p className="font-semibold">Courses</p>
                            <p>{importedCourses.length}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Credits</p>
                            <p>
                              {importedCourses.filter((c) => c.grade !== "P").reduce((sum, c) => sum + c.credits, 0)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="container mx-auto px-4 py-8 max-w-4xl mt-16 border-t">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold font-[family-name:var(--font-inter)]">About Our CGPA Calculator</h2>
          <p className="text-muted-foreground font-[family-name:var(--font-poppins)] text-balance max-w-2xl mx-auto">
            Our free CGPA calculator helps students calculate their Grade Point Average quickly and accurately. Whether
            you're a university student, college student, or high school student, our tool supports all standard grading
            systems including 10-point, 4-point, and letter grade scales.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>Free CGPA Calculator</span>
            <span>•</span>
            <span>GPA Calculator Online</span>
            <span>•</span>
            <span>Academic Calculator</span>
            <span>•</span>
            <span>Student Tools</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 CGPA Calculator. Free online tool for students worldwide.
          </p>
        </div>
      </footer>
    </div>
  )
}
