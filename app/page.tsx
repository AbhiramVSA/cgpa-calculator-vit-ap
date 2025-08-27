"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Upload, Plus, RotateCcw, Trash2, CheckCircle, AlertCircle, BookOpen, Award } from "lucide-react"

interface Course {
  id: string
  title: string
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
  const [currentCourse, setCurrentCourse] = useState({
    title: "",
    credits: "",
    grade: "",
  })
  const [encodedData, setEncodedData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [cgpa, setCgpa] = useState<number | null>(null)
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
    setCgpa(null)
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
      // Redirect to the new API endpoint that displays the full report
      const reportUrl = `/api/app?data=${encodeURIComponent(toProcess)}`
      window.open(reportUrl, '_blank')
      setImportSuccess(true)
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

  // Auto-populate if ?data= (or ?payload=) present in URL
  useEffect(() => {
    const qp = searchParams.get("data") || searchParams.get("payload")
    if (qp && qp !== encodedData) {
      setEncodedData(qp)
    }
  }, [searchParams, encodedData])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              VIT-AP CGPA Calculator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate your CGPA manually or import your academic data for a comprehensive semester-wise report
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Manual Calculator */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Manual Calculator
              </CardTitle>
              <CardDescription>
                Add courses one by one to calculate your CGPA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">{/* ... content remains the same ... */}
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  placeholder="e.g., Data Structures and Algorithms"
                  value={currentCourse.title}
                  onChange={(e) => setCurrentCourse((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    placeholder="3.0"
                    value={currentCourse.credits}
                    onChange={(e) => setCurrentCourse((prev) => ({ ...prev, credits: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={currentCourse.grade}
                    onValueChange={(value) => setCurrentCourse((prev) => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500 transition-all">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S (10 points)</SelectItem>
                      <SelectItem value="A">A (9 points)</SelectItem>
                      <SelectItem value="B">B (8 points)</SelectItem>
                      <SelectItem value="C">C (7 points)</SelectItem>
                      <SelectItem value="D">D (6 points)</SelectItem>
                      <SelectItem value="E">E (5 points)</SelectItem>
                      <SelectItem value="F">F (0 points)</SelectItem>
                      <SelectItem value="P">P (Pass)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={addCourse}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors"
                  disabled={!currentCourse.title.trim() || !currentCourse.credits || !currentCourse.grade}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
                <Button
                  variant="outline"
                  onClick={resetCalculator}
                  disabled={courses.length === 0}
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {courses.length > 0 && cgpa !== null && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-gray-600 font-medium">Current CGPA</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700 mb-2">
                    {cgpa.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Based on {courses.filter(c => c.grade !== "P").length} courses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automated Import */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-teal-50/50" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                Academic Report
              </CardTitle>
              <CardDescription>
                Import your encoded academic data for a detailed semester-wise report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="space-y-2">
                <Label htmlFor="encoded-data">Encoded Data String</Label>
                <Textarea
                  id="encoded-data"
                  placeholder="Paste your encoded academic data here..."
                  value={encodedData}
                  onChange={(e) => setEncodedData(e.target.value)}
                  rows={4}
                  className="focus:ring-2 focus:ring-green-500 transition-all resize-none"
                />
                <p className="text-xs text-gray-500">
                  This data contains your complete academic record with courses, grades, and CGPA information
                </p>
              </div>

              <Button
                onClick={() => handleAutomatedImport()}
                disabled={!encodedData.trim() || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Generate Academic Report
                  </>
                )}
              </Button>

              {importSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Academic report opened in new tab!
                  </span>
                </div>
              )}

              {importError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-800">{importError}</span>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {courses.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Course Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Course</th>
                      <th className="text-left p-3 font-medium">Credits</th>
                      <th className="text-left p-3 font-medium">Grade</th>
                      <th className="text-left p-3 font-medium">Points</th>
                      <th className="text-left p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course, index) => (
                      <tr key={course.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}>
                        <td className="p-3">{course.title}</td>
                        <td className="p-3 font-mono">{course.credits}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${course.grade === "S" ? "bg-green-100 text-green-800" :
                              course.grade === "A" ? "bg-blue-100 text-blue-800" :
                                course.grade === "B" ? "bg-yellow-100 text-yellow-800" :
                                  course.grade === "C" ? "bg-orange-100 text-orange-800" :
                                    course.grade === "F" ? "bg-red-100 text-red-800" :
                                      "bg-gray-100 text-gray-800"
                            }`}>
                            {course.grade}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {course.grade === "P" ? "N/A" : gradePoints[course.grade]}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(course.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {cgpa !== null && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">CGPA</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {cgpa.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Courses</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {courses.length}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calculator className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Credits</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {courses.filter((c) => c.grade !== "P").reduce((sum, c) => sum + c.credits, 0)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
