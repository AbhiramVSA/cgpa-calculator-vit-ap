import { type NextRequest, NextResponse } from "next/server"
import { gzipSync } from "zlib"

interface CourseInput {
  id?: number
  course_code: string
  credits: number
  grade: string
}

function base64UrlEncode(buffer: Buffer): string {
  // Convert to base64 and make it URL-safe
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const courses: CourseInput[] = await request.json()

    // Validate input
    if (!Array.isArray(courses)) {
      return NextResponse.json({ error: "Input must be an array of course objects" }, { status: 400 })
    }

    // Validate each course object
    for (const course of courses) {
      if (
        typeof course.course_code !== "string" ||
        typeof course.credits !== "number" ||
        typeof course.grade !== "string"
      ) {
        return NextResponse.json({ error: "Invalid course data structure" }, { status: 400 })
      }
    }

    // Step 1: Serialize to JSON
    const jsonString = JSON.stringify(courses)

    // Step 2: Gzip compress the JSON
    const compressedBuffer = gzipSync(Buffer.from(jsonString, "utf-8"))

    // Step 3: Base64url encode the gzipped bytes
    const encodedString = base64UrlEncode(compressedBuffer)

    // Return the encoded string
    return NextResponse.json({ encoded: encodedString }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process course data" }, { status: 400 })
  }
}

// Handle non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } })
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } })
}

export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } })
}
