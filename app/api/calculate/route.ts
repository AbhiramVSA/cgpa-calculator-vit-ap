import { type NextRequest, NextResponse } from "next/server"
import { gunzipSync } from "zlib"

interface CourseData {
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

function base64UrlDecode(str: string): Buffer {
  // Add padding if needed
  str += "=".repeat((4 - (str.length % 4)) % 4)
  // Replace URL-safe characters
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(str, "base64")
}

function calculateCGPA(courses: CourseData[]): number {
  // Filter out courses with grade "P" as they don't count towards CGPA
  const validCourses = courses.filter((course) => course.grade !== "P")

  if (validCourses.length === 0) {
    return 0
  }

  const totalGradePoints = validCourses.reduce((sum, course) => {
    const points = gradePoints[course.grade] || 0
    return sum + points * course.credits
  }, 0)

  const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encodedData = searchParams.get("data")

    if (!encodedData) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 1: Base64URL decode the string
    let decodedBuffer: Buffer
    try {
      decodedBuffer = base64UrlDecode(encodedData)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 2: Gzip decompress the result
    let decompressedData: Buffer
    try {
      decompressedData = gunzipSync(decodedBuffer)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 3: Parse JSON array of course objects
    let courses: CourseData[]
    try {
      const jsonString = decompressedData.toString("utf-8")
      courses = JSON.parse(jsonString)

      // Validate that it's an array
      if (!Array.isArray(courses)) {
        throw new Error("Data is not an array")
      }

      // Validate each course object
      for (const course of courses) {
        if (
          typeof course.course_title !== "string" ||
          typeof course.credits !== "number" ||
          typeof course.grade !== "string" ||
          !gradePoints.hasOwnProperty(course.grade)
        ) {
          throw new Error("Invalid course data structure")
        }
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 4: Calculate CGPA
    const cgpa = calculateCGPA(courses)

    // Step 5: Return the result
    return NextResponse.json({ cgpa: Number(cgpa.toFixed(2)) }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const encodedData = body.data

    if (!encodedData || typeof encodedData !== "string") {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 1: Base64URL decode the string
    let decodedBuffer: Buffer
    try {
      decodedBuffer = base64UrlDecode(encodedData)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 2: Gzip decompress the result
    let decompressedData: Buffer
    try {
      decompressedData = gunzipSync(decodedBuffer)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 3: Parse JSON array of course objects
    let courses: CourseData[]
    try {
      const jsonString = decompressedData.toString("utf-8")
      courses = JSON.parse(jsonString)

      // Validate that it's an array
      if (!Array.isArray(courses)) {
        throw new Error("Data is not an array")
      }

      // Validate each course object
      for (const course of courses) {
        if (
          typeof course.course_title !== "string" ||
          typeof course.credits !== "number" ||
          typeof course.grade !== "string" ||
          !gradePoints.hasOwnProperty(course.grade)
        ) {
          throw new Error("Invalid course data structure")
        }
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 4: Calculate CGPA
    const cgpa = calculateCGPA(courses)

    // Step 5: Return the result
    return NextResponse.json({ cgpa: Number(cgpa.toFixed(2)) }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}

export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}
