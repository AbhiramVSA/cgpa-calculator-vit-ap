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
        <title>Interactive Academic Report - VIT-AP University</title>
        <script>
            window.tailwind = window.tailwind || {}; 
            window.tailwind.config = { darkMode: 'class' };
        </script>
        <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
    body { font-family: 'Inter', sans-serif; }
    .dark .gpa-circle { background: conic-gradient(from 0deg, #34d399 var(--cgpa-angle), #1f2937 0deg); }
        
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
            background: conic-gradient(from 0deg, #10b981 var(--cgpa-angle), #e5e7eb 0deg);
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
        
        .editable-grade {
            min-width: 60px;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid transparent;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        
        .editable-grade:hover {
            border-color: #6366f1;
            background: white;
        }
        
        .editable-grade:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .add-course-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            transition: all 0.2s ease;
        }
        
        .add-course-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .remove-course-btn {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            transition: all 0.2s ease;
        }
        
        .remove-course-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .new-course-form {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 20px;
            margin-top: 10px;
            display: none;
        }
        
        .new-course-form.active {
            display: block;
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @media print {
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            .editable-grade { border: 1px solid #e5e7eb !important; }
            .add-course-btn, .remove-course-btn { display: none !important; }
        }
    </style>
  </head>
  <body class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-black">
    <!-- Header -->
    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 no-print">
        <div class="container mx-auto px-4 py-4 max-w-6xl">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <a href="/" class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity" title="Back to site">
                        <i data-feather="graduation-cap" class="text-white w-6 h-6"></i>
                    </a>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800 dark:text-slate-100">Interactive Academic Report</h1>
                        <p class="text-sm text-gray-600 dark:text-slate-400">Student ID: ${studentData.id} • Edit grades to see live CGPA updates</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 sm:space-x-3">
                    <button onclick="toggleTheme()" class="no-print hidden sm:inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle theme">
                        <i data-feather="moon" class="w-4 h-4"></i>
                        <span class="hidden md:inline">Theme</span>
                    </button>
                    <a href="https://github.com/AbhiramVSA/cgpa-calculator-vit-ap" target="_blank" rel="noopener" class="no-print hidden sm:inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" aria-label="Star repository">
                        <i data-feather="star" class="w-4 h-4"></i>
                        <span class="hidden md:inline">Star</span>
                    </a>
                    <button onclick="openApp()" class="no-print bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-2 rounded-lg hover:opacity-95 transition-opacity flex items-center space-x-2">
                        <i data-feather="smartphone" class="w-4 h-4"></i>
                        <span>Open App</span>
                    </button>
                    <button onclick="resetToOriginal()" class="no-print bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2">
                        <i data-feather="refresh-cw" class="w-4 h-4"></i>
                        <span>Reset</span>
                    </button>
                    <button onclick="window.print()" class="print-button px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2">
                        <i data-feather="printer" class="w-4 h-4"></i>
                        <span>Print Report</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <!-- Main Stats Dashboard -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 fade-in">
            <!-- CGPA Circle -->
            <div class="lg:col-span-1">
                <div class="bg-white/90 dark:bg-slate-900/90 stat-card rounded-2xl p-6 text-center h-full flex flex-col justify-center">
                    <div class="relative mx-auto mb-4">
                        <div class="gpa-circle w-32 h-32 rounded-full flex items-center justify-center relative" style="--cgpa-angle: ${(typeof studentData.cgpa === 'number' ? studentData.cgpa : parseFloat(studentData.cgpa.toString())) * 36}deg;">
                            <div class="bg-white dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-gray-800 dark:text-slate-100" id="overall-cgpa">${typeof studentData.cgpa === 'number' ? studentData.cgpa.toFixed(2) : parseFloat(studentData.cgpa.toString()).toFixed(2)}</div>
                                    <div class="text-xs text-gray-500 dark:text-slate-400 font-medium">CGPA</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">Overall Performance</h3>
                    <div class="flex justify-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
                        <div class="flex items-center">
                            <i data-feather="trending-up" class="w-4 h-4 mr-1"></i>
                            <span id="average-gpa">${averageGPA.toFixed(2)} Avg GPA</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="lg:col-span-2 grid grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="book-open" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold" id="total-courses">${totalCourses}</span>
                    </div>
                    <h3 class="font-semibold">Total Courses</h3>
                    <p class="text-blue-100 text-sm"><span id="total-semesters">${totalSemesters}</span> semesters</p>
                </div>
                
                <div class="bg-gradient-to-br from-green-500 to-green-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="award" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold" id="credits-earned">${studentData.credits_earned}</span>
                    </div>
                    <h3 class="font-semibold">Credits Earned</h3>
                    <p class="text-green-100 text-sm">of <span id="credits-registered">${studentData.credits_registered}</span> registered</p>
                </div>
                
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="calendar" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold" id="semester-count">${totalSemesters}</span>
                    </div>
                    <h3 class="font-semibold">Semesters</h3>
                    <p class="text-purple-100 text-sm">Academic journey</p>
                </div>
                
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 stat-card rounded-2xl p-6 text-white">
                    <div class="flex items-center justify-between mb-3">
                        <i data-feather="trending-up" class="w-8 h-8 opacity-80"></i>
                        <span class="text-2xl font-bold" id="completion-percentage">${Math.round((parseFloat(studentData.credits_earned.toString()) / parseFloat(studentData.credits_registered.toString())) * 100)}%</span>
                    </div>
                    <h3 class="font-semibold">Completion</h3>
                    <p class="text-orange-100 text-sm">Credit progress</p>
                </div>
            </div>
        </div>

        <!-- Semester-wise Performance -->
        <div class="space-y-6">
            ${semesterData.map((semester, index) => `
            <div class="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-lg overflow-hidden slide-up" style="animation-delay: ${index * 0.1}s" data-semester="${semester.semester}">
                <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                    <div class="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div class="flex items-center space-x-3 mb-4 md:mb-0">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-feather="calendar" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold">${semester.semester}</h2>
                                <p class="text-indigo-100">
                                    <span class="semester-course-count">${semester.courses.length}</span> courses • 
                                    <span class="semester-credit-count">${semester.courses.filter((c: CourseData) => c.grade !== 'P').reduce((sum: number, c: CourseData) => {
        const credits = typeof c.credits === 'string' ? parseFloat(c.credits) : c.credits
        return sum + credits
    }, 0)}</span> credits
                                </p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold mb-1 semester-gpa">${semester.gpa.toFixed(2)}</div>
                            <div class="text-indigo-100 text-sm font-medium">Semester GPA</div>
                            <div class="mt-2">
                                <div class="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div class="h-full bg-white rounded-full transition-all duration-1000 semester-gpa-bar" style="width: ${(semester.gpa / 10) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b-2 border-gray-100 dark:border-slate-800">
                                    <th class="text-left py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Course</th>
                                    <th class="text-left py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Title</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Type</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Credits</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Grade</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide">Points</th>
                                    <th class="text-center py-4 px-3 font-semibold text-gray-700 dark:text-slate-300 text-sm uppercase tracking-wide no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 semester-courses" data-semester="${semester.semester}">
                                ${semester.courses.map((course: CourseData, courseIndex: number) => `
                <tr class="course-row hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200" style="animation-delay: ${index * 0.1 + courseIndex * 0.05}s" data-course-id="${course.id}">
                                    <td class="py-4 px-3">
                    <div class="font-semibold text-indigo-600 text-sm course-code">${course.course_code}</div>
                                    </td>
                                    <td class="py-4 px-3">
                    <div class="text-gray-800 dark:text-slate-100 font-medium text-sm leading-tight course-title">${course.course_title}</div>
                    <div class="text-gray-500 dark:text-slate-400 text-xs mt-1 course-distribution">${course.course_distribution}</div>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 course-type">
                                            ${course.course_type}
                                        </span>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                    <span class="font-semibold text-gray-700 dark:text-slate-300 course-credits">${course.credits}</span>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <select class="editable-grade inline-flex items-center justify-center w-16 h-10 rounded-lg text-sm font-bold text-center border-0 cursor-pointer
                                            ${course.grade === 'S' ? 'bg-emerald-100 text-emerald-800' :
            course.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                course.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                    course.grade === 'C' ? 'bg-orange-100 text-orange-800' :
                        course.grade === 'P' ? 'bg-gray-100 text-gray-600' :
                            'bg-red-100 text-red-800'}" 
                                            data-course-id="${course.id}" data-semester="${semester.semester}" onchange="updateGrade(this)">
                                            <option value="S" ${course.grade === 'S' ? 'selected' : ''}>S</option>
                                            <option value="A" ${course.grade === 'A' ? 'selected' : ''}>A</option>
                                            <option value="B" ${course.grade === 'B' ? 'selected' : ''}>B</option>
                                            <option value="C" ${course.grade === 'C' ? 'selected' : ''}>C</option>
                                            <option value="D" ${course.grade === 'D' ? 'selected' : ''}>D</option>
                                            <option value="E" ${course.grade === 'E' ? 'selected' : ''}>E</option>
                                            <option value="F" ${course.grade === 'F' ? 'selected' : ''}>F</option>
                                            <option value="P" ${course.grade === 'P' ? 'selected' : ''}>P</option>
                                        </select>
                                    </td>
                                    <td class="py-4 px-3 text-center">
                                        <span class="font-semibold text-gray-700 dark:text-slate-300 grade-points">
                                            ${course.grade === 'P' ? 'N/A' : gradePoints[course.grade] || 0}
                                        </span>
                                    </td>
                                    <td class="py-4 px-3 text-center no-print">
                                        <button onclick="removeCourse('${course.id}', '${semester.semester}')" class="remove-course-btn w-8 h-8 rounded-full text-white flex items-center justify-center">
                                            <i data-feather="x" class="w-4 h-4"></i>
                                        </button>
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Add Course Button -->
                    <div class="mt-4 no-print">
                        <button onclick="toggleAddCourseForm('${semester.semester}')" class="add-course-btn text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all">
                            <i data-feather="plus" class="w-4 h-4"></i>
                            <span>Add Course</span>
                        </button>
                        
                        <!-- Add Course Form -->
                        <div class="new-course-form" id="add-course-form-${semester.semester}">
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Add New Course to ${semester.semester}</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., CSE101" id="course-code-${semester.semester}">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Programming Fundamentals" id="course-title-${semester.semester}">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" id="course-type-${semester.semester}">
                                        <option value="Core">Core</option>
                                        <option value="Elective">Elective</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Project">Project</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                                    <input type="number" min="0" max="10" step="0.5" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 3" id="course-credits-${semester.semester}">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" id="course-grade-${semester.semester}">
                                        <option value="S">S (10)</option>
                                        <option value="A">A (9)</option>
                                        <option value="B">B (8)</option>
                                        <option value="C">C (7)</option>
                                        <option value="D">D (6)</option>
                                        <option value="E">E (5)</option>
                                        <option value="F">F (0)</option>
                                        <option value="P">P (Pass)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Distribution</label>
                                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Mandatory" id="course-distribution-${semester.semester}">
                                </div>
                            </div>
                            <div class="flex justify-end space-x-3 mt-4">
                                <button onclick="cancelAddCourse('${semester.semester}')" class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                                    Cancel
                                </button>
                                <button onclick="addCourse('${semester.semester}')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                    Add Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
        
        <!-- Footer -->
                <div class="text-center text-gray-500 dark:text-slate-400 text-sm mt-12 py-8 border-t border-gray-200 dark:border-slate-800">
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
                        <p class="mt-2 text-xs">Made with <span aria-hidden>❤️</span> by <a href="https://github.com/AbhiramVSA" target="_blank" rel="noopener" class="underline-offset-4 hover:underline">Abhiram</a></p>
        </div>
    </div>

    <script>
        // Initialize Feather icons
        feather.replace();
        
                // Theme toggle with persistence
                (function() {
                    const saved = localStorage.getItem('report-theme');
                    if (saved === 'dark') document.documentElement.classList.add('dark');
                })();
                function toggleTheme() {
                    const el = document.documentElement;
                    const isDark = el.classList.toggle('dark');
                    localStorage.setItem('report-theme', isDark ? 'dark' : 'light');
                }

                // Open app via custom scheme/intent with store fallback
                function openApp() {
                    const ua = navigator.userAgent || '';
                    const isAndroid = /Android/i.test(ua);
                    const isIOS = /iPhone|iPad|iPod/i.test(ua);
                    const pkg = 'com.udhay.vitapstudentapp';
                    const play = 'https://play.google.com/store/apps/details?id=' + pkg;
                    const appstore = 'https://apps.apple.com/in/app/vitap-student/id6748966515';

                    // Assumption: iOS custom scheme
                    const iosScheme = 'vitapstudent://grades';

                    const start = Date.now();
                    let timer = setTimeout(() => {
                        // If user hasn't switched by now, fallback to store
                        if (Date.now() - start < 1800) return; // canceled or switched
                        window.location.href = isAndroid ? play : appstore;
                    }, 1500);

                    if (isAndroid) {
                        // Android intent to app (grades)
                        window.location.href = 'intent://grades#Intent;package=' + pkg + ';end';
                    } else if (isIOS) {
                        window.location.href = iosScheme;
                    } else {
                        // Desktop: point to stores
                        clearTimeout(timer);
                        window.open('https://github.com/AbhiramVSA/cgpa-calculator-vit-ap', '_blank');
                    }
                }
        
        // Store original data for reset functionality
        const originalData = ${JSON.stringify(studentData)};
        let currentData = JSON.parse(JSON.stringify(originalData));
        
        // Grade points mapping
        const gradePoints = {
            S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0, P: 0
        };
        
        // Grade color classes
        const gradeColors = {
            S: 'bg-emerald-100 text-emerald-800',
            A: 'bg-blue-100 text-blue-800',
            B: 'bg-yellow-100 text-yellow-800',
            C: 'bg-orange-100 text-orange-800',
            D: 'bg-red-100 text-red-800',
            E: 'bg-red-100 text-red-800',
            F: 'bg-red-100 text-red-800',
            P: 'bg-gray-100 text-gray-600'
        };
        
    function updateGrade(selectElement) {
            const courseId = selectElement.dataset.courseId;
            const semester = selectElement.dataset.semester;
            const newGrade = selectElement.value;
            
            // Update current data
            const course = currentData.courses.find(c => c.id.toString() === courseId);
            if (course) {
                course.grade = newGrade;
            }
            
            // Update visual appearance
            selectElement.className = selectElement.className.replace(/bg-\\w+-100 text-\\w+-800/g, '');
            selectElement.classList.add(...gradeColors[newGrade].split(' '));
            
            // Update grade points display
            const row = selectElement.closest('tr');
            const gradePointsSpan = row.querySelector('.grade-points');
            gradePointsSpan.textContent = newGrade === 'P' ? 'N/A' : gradePoints[newGrade] || 0;
            // Micro interaction highlight
            row.style.transition = 'background-color 0.6s ease';
            row.classList.add('bg-amber-50');
            setTimeout(() => row.classList.remove('bg-amber-50'), 600);
            
            // Recalculate and update GPAs
            recalculateGPAs();
        }
        
        function recalculateGPAs() {
            // Group courses by semester
            const semesterMap = new Map();
            currentData.courses.forEach(course => {
                if (!semesterMap.has(course.exam_month)) {
                    semesterMap.set(course.exam_month, []);
                }
                semesterMap.get(course.exam_month).push(course);
            });
            
            let totalGradePoints = 0;
            let totalCredits = 0;
            let semesterCount = 0;
            let totalGPA = 0;
            
            // Calculate each semester GPA
            semesterMap.forEach((courses, semester) => {
                const validCourses = courses.filter(c => c.grade !== 'P');
                
                if (validCourses.length > 0) {
                    const semesterGradePoints = validCourses.reduce((sum, course) => {
                        const points = gradePoints[course.grade] || 0;
                        const credits = parseFloat(course.credits);
                        return sum + points * credits;
                    }, 0);
                    
                    const semesterCredits = validCourses.reduce((sum, course) => {
                        return sum + parseFloat(course.credits);
                    }, 0);
                    
                    const semesterGPA = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;
                    
                    // Update semester GPA display
                    const semesterElement = document.querySelector(\`[data-semester="\${semester}"]\`);
                    if (semesterElement) {
                        const gpaElement = semesterElement.querySelector('.semester-gpa');
                        const gpaBarElement = semesterElement.querySelector('.semester-gpa-bar');
                        const courseCountElement = semesterElement.querySelector('.semester-course-count');
                        const creditCountElement = semesterElement.querySelector('.semester-credit-count');
                        
                        if (gpaElement) gpaElement.textContent = semesterGPA.toFixed(2);
                        if (gpaBarElement) gpaBarElement.style.width = \`\${(semesterGPA / 10) * 100}%\`;
                        if (courseCountElement) courseCountElement.textContent = courses.length;
                        if (creditCountElement) creditCountElement.textContent = semesterCredits;
                    }
                    
                    totalGradePoints += semesterGradePoints;
                    totalCredits += semesterCredits;
                    totalGPA += semesterGPA;
                    semesterCount++;
                }
            });
            
            // Calculate overall CGPA
            const overallCGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
            const averageGPA = semesterCount > 0 ? totalGPA / semesterCount : 0;
            
            // Update overall CGPA display
            const cgpaElement = document.getElementById('overall-cgpa');
            const averageGpaElement = document.getElementById('average-gpa');
            const gpaCircle = document.querySelector('.gpa-circle');
            
            if (cgpaElement) cgpaElement.textContent = overallCGPA.toFixed(2);
            if (averageGpaElement) averageGpaElement.textContent = \`\${averageGPA.toFixed(2)} Avg GPA\`;
            if (gpaCircle) gpaCircle.style.setProperty('--cgpa-angle', \`\${overallCGPA * 36}deg\`);
            
            // Update stats
            const totalCoursesElement = document.getElementById('total-courses');
            const totalSemestersElement = document.getElementById('total-semesters');
            const semesterCountElement = document.getElementById('semester-count');
            
            if (totalCoursesElement) totalCoursesElement.textContent = currentData.courses.length;
            if (totalSemestersElement) totalSemestersElement.textContent = semesterMap.size;
            if (semesterCountElement) semesterCountElement.textContent = semesterMap.size;
        }
        
        function toggleAddCourseForm(semester) {
            const form = document.getElementById(\`add-course-form-\${semester}\`);
            if (form.classList.contains('active')) {
                form.classList.remove('active');
            } else {
                // Hide all other forms
                document.querySelectorAll('.new-course-form.active').forEach(f => f.classList.remove('active'));
                form.classList.add('active');
            }
        }
        
        function cancelAddCourse(semester) {
            const form = document.getElementById(\`add-course-form-\${semester}\`);
            form.classList.remove('active');
            
            // Clear form fields
            form.querySelectorAll('input, select').forEach(field => {
                field.value = '';
            });
        }
        
        function addCourse(semester) {
            const courseCode = document.getElementById(\`course-code-\${semester}\`).value.trim();
            const courseTitle = document.getElementById(\`course-title-\${semester}\`).value.trim();
            const courseType = document.getElementById(\`course-type-\${semester}\`).value;
            const courseCredits = parseFloat(document.getElementById(\`course-credits-\${semester}\`).value);
            const courseGrade = document.getElementById(\`course-grade-\${semester}\`).value;
            const courseDistribution = document.getElementById(\`course-distribution-\${semester}\`).value.trim();
            
            // Validation
            if (!courseCode || !courseTitle || !courseCredits || !courseDistribution) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Generate new course ID
            const newCourseId = Math.max(...currentData.courses.map(c => c.id)) + 1;
            
            // Create new course object
            const newCourse = {
                id: newCourseId,
                course_code: courseCode,
                course_title: courseTitle,
                course_type: courseType,
                credits: courseCredits,
                grade: courseGrade,
                exam_month: semester,
                course_distribution: courseDistribution
            };
            
            // Add to current data
            currentData.courses.push(newCourse);
            
            // Add to table
            const tbody = document.querySelector(\`.semester-courses[data-semester="\${semester}"]\`);
            const newRow = createCourseRow(newCourse, semester);
            tbody.appendChild(newRow);
            
            // Recalculate GPAs
            recalculateGPAs();
            
            // Hide form and clear fields
            cancelAddCourse(semester);
            
            // Re-initialize feather icons
            feather.replace();
        }
        
        function createCourseRow(course, semester) {
            const row = document.createElement('tr');
            row.className = 'course-row hover:bg-gray-50 transition-all duration-200';
            row.dataset.courseId = course.id;
            
            row.innerHTML = \`
                <td class="py-4 px-3">
                    <div class="font-semibold text-indigo-600 text-sm course-code">\${course.course_code}</div>
                </td>
                <td class="py-4 px-3">
                    <div class="text-gray-800 font-medium text-sm leading-tight course-title">\${course.course_title}</div>
                    <div class="text-gray-500 text-xs mt-1 course-distribution">\${course.course_distribution}</div>
                </td>
                <td class="py-4 px-3 text-center">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 course-type">
                        \${course.course_type}
                    </span>
                </td>
                <td class="py-4 px-3 text-center">
                    <span class="font-semibold text-gray-700 course-credits">\${course.credits}</span>
                </td>
                <td class="py-4 px-3 text-center">
                    <select class="editable-grade inline-flex items-center justify-center w-16 h-10 rounded-lg text-sm font-bold text-center border-0 cursor-pointer \${gradeColors[course.grade]}" 
                        data-course-id="\${course.id}" data-semester="\${semester}" onchange="updateGrade(this)">
                        <option value="S" \${course.grade === 'S' ? 'selected' : ''}>S</option>
                        <option value="A" \${course.grade === 'A' ? 'selected' : ''}>A</option>
                        <option value="B" \${course.grade === 'B' ? 'selected' : ''}>B</option>
                        <option value="C" \${course.grade === 'C' ? 'selected' : ''}>C</option>
                        <option value="D" \${course.grade === 'D' ? 'selected' : ''}>D</option>
                        <option value="E" \${course.grade === 'E' ? 'selected' : ''}>E</option>
                        <option value="F" \${course.grade === 'F' ? 'selected' : ''}>F</option>
                        <option value="P" \${course.grade === 'P' ? 'selected' : ''}>P</option>
                    </select>
                </td>
                <td class="py-4 px-3 text-center">
                    <span class="font-semibold text-gray-700 grade-points">
                        \${course.grade === 'P' ? 'N/A' : gradePoints[course.grade] || 0}
                    </span>
                </td>
                <td class="py-4 px-3 text-center no-print">
                    <button onclick="removeCourse('\${course.id}', '\${semester}')" class="remove-course-btn w-8 h-8 rounded-full text-white flex items-center justify-center">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </td>
            \`;
            
            return row;
        }
        
        function removeCourse(courseId, semester) {
            if (confirm('Are you sure you want to remove this course?')) {
                // Remove from current data
                currentData.courses = currentData.courses.filter(c => c.id.toString() !== courseId.toString());
                
                // Remove from DOM
                const row = document.querySelector(\`tr[data-course-id="\${courseId}"]\`);
                if (row) row.remove();
                
                // Recalculate GPAs
                recalculateGPAs();
            }
        }
        
        function resetToOriginal() {
            if (confirm('Are you sure you want to reset all changes? This will restore original grades and remove any added courses.')) {
                // Reset current data
                currentData = JSON.parse(JSON.stringify(originalData));
                
                // Reload the page to restore original state
                location.reload();
            }
        }
        
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
