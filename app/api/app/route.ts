import { type NextRequest } from "next/server"
import { gunzipSync } from "zlib"

interface CourseData {
    id: number
    course_code: string
    course_title: string
    course_type: string
    credits: string | number
    grade: string
    exam_month: string
    course_distribution: string
}

interface StudentData {
    id: number
    credits_registered: string | number
    credits_earned: string | number
    cgpa: string | number
    courses: CourseData[]
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

function base64UrlDecode(str: string): Buffer {
    // Add padding if needed
    str += "=".repeat((4 - (str.length % 4)) % 4)
    // Replace URL-safe characters
    str = str.replace(/-/g, "+").replace(/_/g, "/")
    return Buffer.from(str, "base64")
}

// Attempt to repair a pseudo-JS object literal (unquoted keys / identifiers) into valid JSON
function salvagePseudoJson(str: string): string {
    let repaired = str

    // Step 1: Quote keys: {key: or , key: -> {"key": / , "key":
    repaired = repaired.replace(/([,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, (_, pfx, key) => `${pfx}"${key}":`)

    // Step 2: Quote unquoted string values - this is more comprehensive
    // Match anything after : that's not already quoted, not a number, not boolean/null
    repaired = repaired.replace(/(:\s*)([^",\[\]{}]+?)(?=\s*[,}\]])/g, (match, prefix, value) => {
        const trimmedValue = value.trim()

        // Skip if already quoted
        if (trimmedValue.startsWith('"') || trimmedValue.startsWith("'")) return match

        // Skip if it's a number (including decimals and negative numbers)
        if (/^-?[0-9]+(\.[0-9]+)?$/.test(trimmedValue)) return match

        // Skip if it's a boolean or null
        if (["true", "false", "null"].includes(trimmedValue)) return match

        // Skip if it starts with { or [ (objects/arrays)
        if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) return match

        // Quote the value
        return prefix + JSON.stringify(trimmedValue)
    })

    return repaired
}

function calculateSemesterGPA(courses: CourseData[]): number {
    // Filter out courses with grade "P" as they don't count towards GPA
    const validCourses = courses.filter((course) => course.grade !== "P")

    if (validCourses.length === 0) {
        return 0
    }

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

function groupCoursesBySemester(courses: CourseData[]) {
    const semesterMap = new Map<string, CourseData[]>()

    courses.forEach(course => {
        const semester = course.exam_month
        if (!semesterMap.has(semester)) {
            semesterMap.set(semester, [])
        }
        semesterMap.get(semester)!.push(course)
    })

    // Sort semesters chronologically
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

function generateErrorPage(title: string, message: string, details?: string) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - VIT-AP CGPA Calculator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-red-50 to-pink-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full mx-4">
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-feather="alert-circle" class="w-8 h-8 text-red-600"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">${title}</h1>
            <p class="text-gray-600 mb-4">${message}</p>
            ${details ? `<div class="bg-gray-50 rounded-lg p-3 mb-4"><code class="text-sm text-gray-700">${details}</code></div>` : ''}
            <button onclick="history.back()" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 mx-auto">
                <i data-feather="arrow-left" class="w-4 h-4"></i>
                <span>Go Back</span>
            </button>
        </div>
    </div>
    <script>feather.replace();</script>
</body>
</html>`
}

function generateHTML(studentData: StudentData, semesterData: any[]) {
    const totalCourses = studentData.courses.length
    const totalSemesters = semesterData.length
    const averageGPA = semesterData.reduce((sum, sem) => sum + sem.gpa, 0) / semesterData.length

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Academic Report - VIT-AP University</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        body { 
            font-family: 'Inter', sans-serif; 
        }
        
        .fade-in {
            animation: fadeIn 0.6s ease-in-out;
        }
        
        .slide-up {
            animation: slideUp 0.8s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .gpa-circle {
            background: conic-gradient(from 0deg, #10b981 ${(typeof studentData.cgpa === 'number' ? studentData.cgpa : parseFloat(studentData.cgpa.toString())) * 36}deg, #e5e7eb 0deg);
        }
        
        .course-row:hover {
            transform: translateX(4px);
            transition: all 0.2s ease-in-out;
        }
        
        .stat-card {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .print-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        @media print {
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 no-print">
        <div class="container mx-auto px-4 py-4 max-w-6xl">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <i data-feather="graduation-cap" class="text-white w-6 h-6"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">VIT-AP Academic Report</h1>
                        <p class="text-sm text-gray-600">Student ID: ${studentData.id}</p>
                    </div>
                </div>
                <button onclick="window.print()" class="print-button px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2">
                    <i data-feather="printer" class="w-4 h-4"></i>
                    <span>Print Report</span>
                </button>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <!-- Main Stats Dashboard -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 fade-in">
            <!-- CGPA Circle -->
            <div class="lg:col-span-1">
                <div class="bg-white/90 stat-card rounded-2xl p-6 text-center h-full flex flex-col justify-center">
                    <div class="relative mx-auto mb-4">
                        <div class="gpa-circle w-32 h-32 rounded-full flex items-center justify-center relative">
                            <div class="bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-gray-800">${typeof studentData.cgpa === 'number' ? studentData.cgpa.toFixed(2) : parseFloat(studentData.cgpa.toString()).toFixed(2)}</div>
                                    <div class="text-xs text-gray-500 font-medium">CGPA</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Overall Performance</h3>
                    <div class="flex justify-center space-x-4 text-sm text-gray-600">
                        <div class="flex items-center">
                            <i data-feather="trending-up" class="w-4 h-4 mr-1"></i>
                            <span>${averageGPA.toFixed(2)} Avg GPA</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="lg:col-span-2 grid grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="book-open" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold">${totalCourses}</span>
                    </div>
                    <h3 class="font-semibold">Total Courses</h3>
                    <p class="text-blue-100 text-sm">${totalSemesters} semesters</p>
                </div>
                
                <div class="bg-gradient-to-br from-green-500 to-green-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="award" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold">${studentData.credits_earned}</span>
                    </div>
                    <h3 class="font-semibold">Credits Earned</h3>
                    <p class="text-green-100 text-sm">of ${studentData.credits_registered} registered</p>
                </div>
                
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="calendar" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold">${totalSemesters}</span>
                    </div>
                    <h3 class="font-semibold">Semesters</h3>
                    <p class="text-purple-100 text-sm">Academic journey</p>
                </div>
                
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="trending-up" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold">${Math.round((parseFloat(studentData.credits_earned.toString()) / parseFloat(studentData.credits_registered.toString())) * 100)}%</span>
                    </div>
                    <h3 class="font-semibold">Completion</h3>
                    <p class="text-orange-100 text-sm">Credit progress</p>
                </div>
            </div>
        </div>

        <!-- Semester-wise Performance -->
        <div class="space-y-6">
            ${semesterData.map((semester, index) => `
            <div class="bg-white/90 rounded-2xl shadow-lg overflow-hidden slide-up" style="animation-delay: ${index * 0.1}s">
                <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div class="flex items-center space-x-3 mb-4 md:mb-0">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-feather="calendar" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold">${semester.semester}</h2>
                                <p class="text-indigo-100">${semester.courses.length} courses • ${semester.courses.filter((c: CourseData) => c.grade !== 'P').reduce((sum: number, c: CourseData) => {
        const credits = typeof c.credits === 'string' ? parseFloat(c.credits) : c.credits
        return sum + credits
    }, 0)} credits</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold mb-1">${semester.gpa.toFixed(2)}</div>
                            <div class="text-indigo-100 text-sm font-medium">Semester GPA</div>
                            <div class="mt-2">
                                <div class="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div class="h-full bg-white rounded-full transition-all duration-1000" style="width: ${(semester.gpa / 10) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b-2 border-gray-100">
                                    <th class="text-left py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Course</th>
                                    <th class="text-left py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Title</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Type</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Credits</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Grade</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Points</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                                ${semester.courses.map((course: CourseData, courseIndex: number) => `
                                <tr class="course-row hover:bg-gray-50 transition-all duration-200" style="animation-delay: ${index * 0.1 + courseIndex * 0.05}s">
                                    <td class="py-4 px-3">
                                        <div class="font-semibold text-indigo-600 text-sm">${course.course_code}</div>
                                    </td>
                                    <td class="py-4 px-3">
                                        <div class="text-gray-800 font-medium text-sm leading-tight">${course.course_title}</div>
                                        <div class="text-gray-500 text-xs mt-1">${course.course_distribution}</div>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            ${course.course_type}
                                        </span>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="font-semibold text-gray-700">${course.credits}</span>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold
                                            ${course.grade === 'S' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200' :
            course.grade === 'A' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200' :
                course.grade === 'B' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' :
                    course.grade === 'C' ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-200' :
                        course.grade === 'P' ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-200' :
                            'bg-red-100 text-red-800 ring-2 ring-red-200'}">
                                            ${course.grade}
                                        </span>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="font-semibold text-gray-700">
                                            ${course.grade === 'P' ? 'N/A' : gradePoints[course.grade] || 0}
                                        </span>
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
        
        <!-- Footer -->
        <div class="text-center text-gray-500 text-sm mt-12 py-8 border-t border-gray-200">
            <div class="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4">
                <div class="flex items-center space-x-2">
                    <i data-feather="shield-check" class="w-4 h-4"></i>
                    <span>Generated by VIT-AP CGPA Calculator</span>
                </div>
                <div class="hidden md:block">•</div>
                <div class="flex items-center space-x-2">
                    <i data-feather="calendar" class="w-4 h-4"></i>
                    <span>${new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                </div>
            </div>
            <p class="mt-2 text-xs">This report is auto-generated and contains confidential academic information.</p>
        </div>
    </div>

    <script>
        // Initialize Feather icons
        feather.replace();
        
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Add intersection observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe all animated elements
        document.querySelectorAll('.slide-up, .fade-in').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });
    </script>
</body>
</html>`

    return html
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const encodedData = searchParams.get("data")

        if (!encodedData) {
            return new Response(
                generateErrorPage(
                    "Missing Data Parameter",
                    "Please provide encoded data using the 'data' query parameter.",
                    "Example: /api/app?data=your_encoded_string"
                ),
                {
                    status: 400,
                    headers: { "Content-Type": "text/html" }
                }
            )
        }

        // Step 1: Base64URL decode the string
        let decodedBuffer: Buffer
        try {
            decodedBuffer = base64UrlDecode(encodedData)
        } catch (error) {
            return new Response(
                generateErrorPage(
                    "Invalid Data Format",
                    "The provided data string is not valid Base64URL encoded.",
                    `Error: ${error instanceof Error ? error.message : 'Unknown encoding error'}`
                ),
                {
                    status: 400,
                    headers: { "Content-Type": "text/html" }
                }
            )
        }

        // Step 2: Gzip decompress the result
        let decompressedData: Buffer
        try {
            decompressedData = gunzipSync(decodedBuffer)
        } catch (error) {
            return new Response(
                generateErrorPage(
                    "Decompression Error",
                    "Failed to decompress the provided data.",
                    `Error: ${error instanceof Error ? error.message : 'Unknown decompression error'}`
                ),
                {
                    status: 400,
                    headers: { "Content-Type": "text/html" }
                }
            )
        }

        // Step 3: Parse JSON data
        let studentData: StudentData
        try {
            const jsonString = decompressedData.toString("utf-8")

            // Try parsing as strict JSON first
            try {
                studentData = JSON.parse(jsonString)
            } catch (jsonError) {
                // If strict JSON fails, try parsing as pseudo-JavaScript object literal
                const salvaged = salvagePseudoJson(jsonString)
                studentData = JSON.parse(salvaged)
            }

            // Validate the data structure
            if (!studentData.courses || !Array.isArray(studentData.courses)) {
                throw new Error("Invalid data structure - missing courses array")
            }

            // Ensure we have the required student data structure
            if (!studentData.id || (!studentData.cgpa && studentData.cgpa !== 0)) {
                throw new Error("Invalid data structure - missing id or cgpa")
            }

            // Convert string values to numbers where needed
            const processedData: StudentData = {
                ...studentData,
                id: typeof studentData.id === 'string' ? parseInt(studentData.id) : studentData.id,
                credits_registered: typeof studentData.credits_registered === 'string'
                    ? parseFloat(studentData.credits_registered)
                    : studentData.credits_registered,
                credits_earned: typeof studentData.credits_earned === 'string'
                    ? parseFloat(studentData.credits_earned)
                    : studentData.credits_earned,
                cgpa: typeof studentData.cgpa === 'string'
                    ? parseFloat(studentData.cgpa)
                    : studentData.cgpa,
                courses: studentData.courses.map(course => ({
                    ...course,
                    credits: typeof course.credits === 'string'
                        ? parseFloat(course.credits)
                        : course.credits
                }))
            }

            studentData = processedData
        } catch (error) {
            console.error("Data parsing error:", error)
            return new Response(
                generateErrorPage(
                    "Data Parsing Error",
                    "Failed to parse the decoded data as valid student information.",
                    `Error: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
                ),
                {
                    status: 400,
                    headers: { "Content-Type": "text/html" }
                }
            )
        }

        // Step 4: Group courses by semester and calculate GPAs
        const semesterData = groupCoursesBySemester(studentData.courses)

        // Step 5: Generate and return HTML
        const html = generateHTML(studentData, semesterData)

        return new Response(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        })
    } catch (error) {
        console.error("Error processing request:", error)
        return new Response(
            generateErrorPage(
                "Server Error",
                "An unexpected error occurred while processing your request.",
                `Error: ${error instanceof Error ? error.message : 'Unknown server error'}`
            ),
            {
                status: 500,
                headers: { "Content-Type": "text/html" }
            }
        )
    }
}

// Handle non-GET methods
export async function POST() {
    return new Response(
        generateErrorPage(
            "Method Not Allowed",
            "Only GET requests are supported for this endpoint.",
            "Please use a GET request to access the academic report."
        ),
        {
            status: 405,
            headers: {
                "Content-Type": "text/html",
                "Allow": "GET"
            }
        }
    )
}

export async function PUT() {
    return POST()
}

export async function DELETE() {
    return POST()
}

export async function PATCH() {
    return POST()
}
